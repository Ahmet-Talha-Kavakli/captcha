/**
 * Specter — Denetim Günlüğü SIEM Dışa-Aktarımı & Bütünlük Doğrulama
 * =================================================================
 * SAF (pure) modül. Dışarıya bağımlılık yok; Date.now / Math.random /
 * argümansız `new Date()` KULLANILMAZ. Verilen kayıtlarla deterministik
 * çıktı üretir — aynı girdi → aynı çıktı. Böylece SIEM ingest'i (Splunk,
 * Elastic, ArcSight, QRadar…) ve zincir doğrulaması tekrarlanabilir olur.
 *
 * DÜRÜST NOT — Hash yeniden hesaplama:
 * Denetim kayıtlarının içerik hash'i db.ts içindeki `Audit.log` tarafından
 * ÜRETİLİR (SHA-256'nın ilk 16 hanesi). Ancak o hash yardımcısı DIŞA
 * AKTARILMAMIŞ (yalnızca db.ts'e özel). Bu yüzden burada SHA-256'yı yeniden
 * HESAPLAMIYORUZ; bunun yerine zincirin BAĞLANTISINI (linkage) ve sıra
 * sürekliliğini (seq continuity) doğruluyoruz: her kaydın `prevHash`'i bir
 * önceki kaydın `hash`'ine eşit mi ve `seq` numaraları boşluksuz artıyor mu.
 * Bu, silme / yeniden sıralama / araya kayıt sokma gibi kurcalamayı ortaya
 * çıkarır (tamper-evidence). Tek bir kaydın içeriğinin gizlice değiştirilip
 * hash'inin de aynı biçimde yeniden üretilmesi ancak orijinal hash
 * fonksiyonuyla mümkün olurdu — o bu modülün kapsamı dışındadır.
 */

import type { AuditLog } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Zincir doğrulama */

/** Zincirdeki tek bir kırılma noktası (hangi sırada, neden). */
export interface KirikNokta {
  seq: number;
  sebep: string;
}

/** `zincirDogrula` sonucu. */
export interface ZincirSonuc {
  /** Tüm bağlantı + sıra kontrolleri geçti mi. */
  gecerli: boolean;
  /** Bulunan kırılma noktaları (boşsa zincir sağlam). */
  kirikNoktalar: KirikNokta[];
  /** Kaç kayıt kontrol edildi (kapsam göstergesi). */
  toplamKontrol: number;
}

/** Genesis (ilk) kaydın prevHash'i olarak kabul edilen değerler. */
const GENESIS_PREV = new Set<string>(["genesis", "", "0"]);

/** Bir prevHash değeri genesis anlamına mı geliyor (genesis / undefined / boş). */
function genesisMi(prevHash: string | undefined): boolean {
  return prevHash == null || GENESIS_PREV.has(prevHash);
}

/**
 * Hash-zinciri BAĞLANTISINI doğrular (bkz. dosya başı dürüst not).
 * Kayıtları `seq`'e göre sıralar; sonra:
 *  1) İlk kayıt genesis olmalı (prevHash "genesis"/undefined/boş).
 *  2) Sonraki her kaydın prevHash'i bir önceki kaydın hash'ine eşit olmalı.
 *  3) seq numaraları boşluksuz ve artan olmalı (araya kayıt sokma / silme yakalanır).
 *  4) seq tekrarı (çift kayıt) bir kırılmadır.
 *
 * SAF: harici zaman/rastgele kaynak kullanmaz; sonuç yalnızca girdiye bağlıdır.
 */
export function zincirDogrula(kayitlar: AuditLog[]): ZincirSonuc {
  const kirikNoktalar: KirikNokta[] = [];
  const toplamKontrol = kayitlar.length;

  // seq'i olmayan (eski/legacy) kayıtları ele: seq zorunlu olmadan zincir
  // doğrulanamaz. Hepsi seq'siz ise "doğrulanamaz" ama kırılma değil sayılır.
  const seqli = kayitlar.filter((k) => typeof k.seq === "number");
  if (seqli.length === 0) {
    // Zincir alanı hiç yok → değişmezlik kanıtı sunulamaz; boş sonuç.
    return { gecerli: toplamKontrol === 0, kirikNoktalar, toplamKontrol };
  }

  // seq artan sıraya diz (kararlı: eşitlikte orijinal göreli sıra korunur).
  const sirali = [...seqli].sort((a, b) => (a.seq as number) - (b.seq as number));

  let onceki: AuditLog | null = null;
  for (const kayit of sirali) {
    const seq = kayit.seq as number;

    if (onceki === null) {
      // İlk (en küçük seq) kayıt: genesis bağlantısı beklenir.
      if (!genesisMi(kayit.prevHash)) {
        kirikNoktalar.push({
          seq,
          sebep: `İlk kayıt genesis değil: prevHash "${kayit.prevHash}" beklenirken "genesis".`,
        });
      }
    } else {
      const oncekiSeq = onceki.seq as number;

      // (3) seq sürekliliği: tam olarak +1 artmalı.
      if (seq === oncekiSeq) {
        kirikNoktalar.push({ seq, sebep: `Yinelenen sıra numarası: seq ${seq} birden çok kez var.` });
      } else if (seq !== oncekiSeq + 1) {
        const eksik = seq - oncekiSeq - 1;
        kirikNoktalar.push({
          seq,
          sebep:
            eksik > 0
              ? `Sıra boşluğu: seq ${oncekiSeq} ile ${seq} arasında ${eksik} kayıt eksik (olası silme).`
              : `Sıra düzensiz: seq ${seq}, önceki seq ${oncekiSeq}'den küçük/eşit.`,
        });
      }

      // (2) bağlantı: prevHash bir önceki kaydın hash'ine eşit olmalı.
      const beklenen = onceki.hash;
      if (kayit.prevHash !== beklenen) {
        kirikNoktalar.push({
          seq,
          sebep: `Zincir kopuk: prevHash "${kayit.prevHash ?? "—"}" ≠ önceki kaydın hash'i "${beklenen ?? "—"}".`,
        });
      }
    }

    onceki = kayit;
  }

  return {
    gecerli: kirikNoktalar.length === 0,
    kirikNoktalar,
    toplamKontrol,
  };
}

/* ------------------------------------------------------------------ NDJSON (Splunk / Elastic) */

/** Bir denetim kaydını SIEM-dostu düz nesneye indirger (deterministik alan sırası). */
function ndjsonSatirNesnesi(k: AuditLog): Record<string, unknown> {
  return {
    seq: k.seq ?? null,
    ts: k.ts,
    // ISO zaman damgası: k.ts (epoch ms) SABİT bir değer olduğundan bu SAF'tır
    // (argümanlı new Date(k.ts) → deterministik, sistem saatinden bağımsız).
    time: new Date(k.ts).toISOString(),
    actor_id: k.actorId,
    actor_name: k.actorName,
    action: k.action,
    target: k.target,
    category: k.category ?? null,
    critical: k.critical ?? false,
    src_ip: k.ip,
    prev_value: k.onceki ?? null,
    new_value: k.sonraki ?? null,
    hash: k.hash ?? null,
    prev_hash: k.prevHash ?? null,
    meta: k.meta ?? null,
  };
}

/**
 * NDJSON (Newline-Delimited JSON): satır başına bir JSON nesnesi. Splunk HEC,
 * Elastic Bulk / Filebeat ve çoğu log-ingest hattının beklediği biçim.
 * Kayıtlar seq'e göre (yoksa ts'e göre) artan sıralanır — arşiv okunabilirliği için.
 */
export function ndjsonUret(kayitlar: AuditLog[]): string {
  const sirali = [...kayitlar].sort(zamanSira);
  return sirali.map((k) => JSON.stringify(ndjsonSatirNesnesi(k))).join("\n");
}

/* ------------------------------------------------------------------ CEF (ArcSight / QRadar) */

/** Kritik/kritik-değil → CEF önem (severity) eşlemesi (0..10). */
function cefOnem(k: AuditLog): number {
  // Kritik işlem → yüksek önem (8); normal işlem → düşük-orta (3).
  return k.critical ? 8 : 3;
}

/** CEF ham metin kaçışı: başlık alanında | ve \ ; uzantı değerinde = ve \. */
function cefKac(deger: string, baslikMi: boolean): string {
  let s = deger.replace(/\\/g, "\\\\");
  if (baslikMi) s = s.replace(/\|/g, "\\|");
  else s = s.replace(/=/g, "\\=");
  // Yeni satırlar CEF'te satırı bozar → boşlukla değiştir.
  return s.replace(/[\r\n]+/g, " ");
}

/**
 * ArcSight CEF (Common Event Format) satırları. Biçim:
 *   CEF:0|Cihaz Üreticisi|Cihaz Ürünü|Sürüm|Sınıf ID|Ad|Önem|Uzantı
 * Temsili ama gerçekçi bir eşleme kullanırız:
 *   act  = işlem (action)      suser = aktör adı (actorName)
 *   src  = kaynak IP (ip)      cs1   = hedef (target)      cs1Label = Hedef
 *   cs2  = kategori            cn1   = sıra numarası (seq)
 *   externalId = kayıt hash'i  cs3   = önceki hash (prev_hash)
 * QRadar da CEF ayrıştırır; bu çıktı her iki SIEM'e de verilebilir.
 */
export function cefUret(kayitlar: AuditLog[]): string {
  const sirali = [...kayitlar].sort(zamanSira);
  return sirali
    .map((k) => {
      const sinifId = cefKac(k.action, true);
      const ad = cefKac(k.action, true);
      const onem = cefOnem(k);
      const uzantilar: string[] = [];
      uzantilar.push(`rt=${k.ts}`);
      uzantilar.push(`act=${cefKac(k.action, false)}`);
      uzantilar.push(`suser=${cefKac(k.actorName, false)}`);
      uzantilar.push(`src=${cefKac(k.ip, false)}`);
      uzantilar.push(`cs1Label=Hedef`);
      uzantilar.push(`cs1=${cefKac(k.target, false)}`);
      if (k.category) {
        uzantilar.push(`cs2Label=Kategori`);
        uzantilar.push(`cs2=${cefKac(k.category, false)}`);
      }
      if (typeof k.seq === "number") uzantilar.push(`cn1Label=Sira`, `cn1=${k.seq}`);
      if (k.hash) uzantilar.push(`externalId=${cefKac(k.hash, false)}`);
      if (k.prevHash) uzantilar.push(`cs3Label=OncekiHash`, `cs3=${cefKac(k.prevHash, false)}`);
      uzantilar.push(`VeylifyCritical=${k.critical ? "true" : "false"}`);
      const header = `CEF:0|Veylify|AuditLog|1.0|${sinifId}|${ad}|${onem}`;
      return `${header}|${uzantilar.join(" ")}`;
    })
    .join("\n");
}

/* ------------------------------------------------------------------ JSON (genel) */

/**
 * Tam JSON dizisi (girinti ile). Genel amaçlı içe/dışa aktarım, arşiv veya
 * elle inceleme için. NDJSON'dan farkı: tek bir geçerli JSON belgesi.
 */
export function jsonUret(kayitlar: AuditLog[]): string {
  const sirali = [...kayitlar].sort(zamanSira);
  return JSON.stringify(sirali.map(ndjsonSatirNesnesi), null, 2);
}

/* ------------------------------------------------------------------ Özet çıkarımı */

/** `ozetCikar` sonucu — panel özet kartları + rapor başlığı için. */
export interface DenetimOzet {
  toplam: number;
  kritik: number;
  kategoriler: { kategori: string; sayi: number }[];
  aktorler: { ad: string; sayi: number }[];
  /** En eski kaydın zaman damgası (epoch ms) — kayıt yoksa null. */
  ilkTs: number | null;
  /** En yeni kaydın zaman damgası (epoch ms) — kayıt yoksa null. */
  sonTs: number | null;
}

/**
 * Denetim kümesinden deterministik özet çıkarır: toplam, kritik sayısı,
 * kategori dağılımı (çoktan aza), aktör dağılımı (çoktan aza) ve zaman aralığı.
 * SAF: yalnızca girdiye bağlı; harici zaman kaynağı yok.
 */
export function ozetCikar(kayitlar: AuditLog[]): DenetimOzet {
  const toplam = kayitlar.length;
  let kritik = 0;
  let ilkTs: number | null = null;
  let sonTs: number | null = null;

  const katSay = new Map<string, number>();
  const aktSay = new Map<string, number>();

  for (const k of kayitlar) {
    if (k.critical) kritik++;
    if (ilkTs === null || k.ts < ilkTs) ilkTs = k.ts;
    if (sonTs === null || k.ts > sonTs) sonTs = k.ts;

    const kat = k.category ?? "site";
    katSay.set(kat, (katSay.get(kat) ?? 0) + 1);
    aktSay.set(k.actorName, (aktSay.get(k.actorName) ?? 0) + 1);
  }

  // Deterministik sıralama: sayı azalan, eşitlikte ada göre alfabetik.
  const kategoriler = [...katSay.entries()]
    .map(([kategori, sayi]) => ({ kategori, sayi }))
    .sort((a, b) => b.sayi - a.sayi || a.kategori.localeCompare(b.kategori, "tr"));

  const aktorler = [...aktSay.entries()]
    .map(([ad, sayi]) => ({ ad, sayi }))
    .sort((a, b) => b.sayi - a.sayi || a.ad.localeCompare(b.ad, "tr"));

  return { toplam, kritik, kategoriler, aktorler, ilkTs, sonTs };
}

/* ------------------------------------------------------------------ Ortak sıralama */

/**
 * Kararlı sıralama karşılaştırıcısı: önce seq (varsa), yoksa ts. İki kayıt da
 * seq'siz ise ts'e göre. Böylece dışa-aktarım çıktısı deterministik olur.
 */
function zamanSira(a: AuditLog, b: AuditLog): number {
  const as = typeof a.seq === "number" ? a.seq : null;
  const bs = typeof b.seq === "number" ? b.seq : null;
  if (as !== null && bs !== null) return as - bs;
  return a.ts - b.ts;
}
