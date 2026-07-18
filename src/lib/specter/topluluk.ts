/**
 * Specter — Topluluk Tehdit Paylaşımı (Collaborative Threat Intelligence)
 * =======================================================================
 * Ağ-etkisi savunması: her Specter müşterisi gözlemlediği kötü niyetli
 * IOC'leri (IP / ASN / cihaz parmak izi) anonim olarak ortak bir havuza
 * katkılar; karşılığında topluluğun toplu istihbaratını tüketir. Bir
 * müşteride ilk görülen tehdit, diğer herkes için "önden bilinen" tehdide
 * dönüşür (CrowdSec / kolektif-güvenlik tarzı).
 *
 * DÜRÜSTLÜK NOTU
 * -------------
 * Gerçek çok-kiracılı bir topluluk arka-ucu YOKTUR. Bu modül iki katmanı
 * net ayırır:
 *   (a) SENİN KATKILARIN → GERÇEK. Kendi gözlemlediğin kötü-karar / düşük-skor
 *       olaylarından (BotEvent) türetilir.
 *   (b) TOPLULUK TOPLAMI → TEMSİLİ. Her IOC'nin hash'inden DETERMİNİSTİK
 *       sentezlenir (aynı IOC → her zaman aynı topluluk verisi). Gerçek başka
 *       müşterilerin var olduğu iddia EDİLMEZ; "Specter topluluk ağı (temsili /
 *       simüle edilmiş)" olarak açıkça etiketlenir.
 *
 * DETERMİNİZM: Bu dosya SAF'tır. Date.now / Math.random YOKTUR. Tüm "topluluk"
 * sayıları IOC dizesinin hash'inden üretilir; böylece yeniden hesapta stabil
 * kalır (test edilebilir, SSR/CSR arasında tutarlı).
 */

import type { BotEvent } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Bir IOC'nin türü — paylaşılabilir tanımlayıcı sınıfı. */
export type IocTur = "ip" | "asn" | "fingerprint";

/** Topluluğun bir IOC'yi hangi tehdit kategorisine koyduğu (temsili). */
export type ToplulukKategori =
  | "botnet"
  | "credential_stuffing"
  | "scraper"
  | "scanner"
  | "spam"
  | "proxy_abuse"
  | "ddos";

/** SENİN katkı yapabileceğin, gerçek gözlemlerinden türetilmiş bir IOC. */
export interface KendiKatki {
  /** Kararlı benzersiz anahtar (tablo + hash için). */
  id: string;
  tur: IocTur;
  /** IOC değeri: IP, "AS15169 Google" ya da parmak izi hash'i. */
  deger: string;
  /** Kısa/okunur etiket (ASN'de sağlayıcı adı, IP'de ülke). */
  etiket: string;
  /** Bu IOC'yi kaç kez gözlemledin (kötü-karar olayı sayısı). */
  gozlem: number;
  /** İlk gözlem (epoch ms). */
  ilkGorulme: number;
  /** Son gözlem (epoch ms). */
  sonGorulme: number;
  /** Kaç kez engellendi. */
  engellenen: number;
  /** Gözlemlerinden türettiğin ortalama tehdit skoru (0..100). */
  tehditSkoru: number;
  /** Önerilen paylaşım güveni (0..1) — gözlem + skordan türetilir. */
  onerilenGuven: number;
  /** Ağırlıklı ülke (IP kaynaklıysa) — bağlam için. */
  ulke?: string;
}

/** Bir IOC için TEMSİLİ topluluk zenginleştirmesi (deterministik sentez). */
export interface ToplulukZenginlik {
  /** Kaç (simüle) topluluk düğümü bu IOC'yi bildirdi. */
  dugumSayisi: number;
  /** Topluluk güven skoru (0..1) — düğüm sayısı + tutarlılıktan. */
  toplulukGuven: number;
  /** Topluluğun küresel ilk-görülme tahmini (epoch ms, temsili). */
  kureselIlkGorulme: number;
  /** Topluluğun bu IOC'yi koyduğu kategori (temsili). */
  kategori: ToplulukKategori;
  /** Topluluk bunu "doğruladı" mı (yeterli düğüm eşiğini geçti mi). */
  dogrulandi: boolean;
  /** Küresel toplam gözlem (temsili — düğümler arası). */
  kureselGozlem: number;
}

/** Bir IOC'nin senin + topluluk görünümünü birleştiren zenginleştirilmiş kayıt. */
export interface ZenginlestirilmisKatki extends KendiKatki {
  topluluk: ToplulukZenginlik;
}

/** Topluluk-yalnız bir tehdit (sen görmedin, topluluk işaretledi → proaktif). */
export interface ToplulukTehdit {
  id: string;
  tur: IocTur;
  deger: string;
  etiket: string;
  topluluk: ToplulukZenginlik;
  /** Sen bunu engelledin mi (karşılaştırma sonucu). */
  sendeVar: boolean;
}

/** Ağ özeti: katkı + kapsam + karşılıklılık. */
export interface ToplulukOzet {
  /** Katkı yapılabilir toplam IOC sayısı (gerçek). */
  katkiSayisi: number;
  /** Bunlardan kaçı topluluk-doğrulanmış (simülasyonda başkalarınca da görülen). */
  dogrulanmisSayisi: number;
  /** Katkılarının benzersiz IP / ASN / parmak izi dağılımı. */
  turDagilim: Record<IocTur, number>;
  /** Temsili topluluk besleme boyutu (toplam bilinen kötü IOC — sabit-türetilmiş). */
  toplulukBeslemeBoyutu: number;
  /** Paylaşımdan kazanılan katkı puanı (itibar). */
  katkiPuani: number;
  /** Katkı puanının hangi kademede olduğu ("Bronz" / "Gümüş" / "Altın" / "Platin"). */
  kademe: string;
}

/* ------------------------------------------------------------------ Deterministik hash */

/**
 * FNV-1a 32-bit — saf, hızlı, deterministik string hash. Kripto değil; amaç
 * IOC'den stabil bir tohum üretmek (Math.random yerine). Aynı girdi → aynı çıktı.
 */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // 32-bit FNV asal ile çarpım (taşmasız, kaydırmalı).
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Hash'ten [0,1) aralığında deterministik "rastgele" değer. */
function hashOran(s: string): number {
  return fnv1a(s) / 0xffffffff;
}

/** Hash'ten [min,max] aralığında deterministik tamsayı. */
function hashAralik(s: string, min: number, max: number): number {
  return min + Math.floor(hashOran(s) * (max - min + 1));
}

/* ------------------------------------------------------------------ IOC yardımcıları */

const KATEGORILER: ToplulukKategori[] = [
  "botnet",
  "credential_stuffing",
  "scraper",
  "scanner",
  "spam",
  "proxy_abuse",
  "ddos",
];

export const KATEGORI_ETIKET: Record<ToplulukKategori, string> = {
  botnet: "Botnet / C2",
  credential_stuffing: "Kimlik doldurma",
  scraper: "İçerik kazıyıcı",
  scanner: "Tarayıcı",
  spam: "Spam kaynağı",
  proxy_abuse: "Proxy/VPN kötüye kullanımı",
  ddos: "DDoS",
};

export const TUR_ETIKET: Record<IocTur, string> = {
  ip: "IP adresi",
  asn: "ASN",
  fingerprint: "Cihaz parmak izi",
};

/** Bir IOC dizesini kararlı bir kimliğe çevir (tur öneki + değer). */
function iocId(tur: IocTur, deger: string): string {
  return `${tur}:${deger}`;
}

/**
 * ASN dizesinden okunur sağlayıcı etiketi çıkar ("AS15169 Google LLC" → "Google LLC").
 * Eşleşmezse ham değeri döndürür.
 */
function asnEtiket(asn: string): string {
  const m = asn.match(/^AS\d+\s+(.+)$/);
  return m ? m[1] : asn;
}

/* ------------------------------------------------------------------ (a) Kendi katkıların — GERÇEK */

/** Bir olayın "kötü" (paylaşmaya değer) sayılıp sayılmayacağı. */
function kotuOlayMi(e: BotEvent): boolean {
  return e.verdict === "blocked" || e.verdict === "flagged" || e.score < 0.4;
}

/** İç toplayıcı — bir IOC türü için kümülatif istatistik. */
interface Toplayici {
  deger: string;
  etiket: string;
  gozlem: number;
  engellenen: number;
  ilk: number;
  son: number;
  skorTop: number;
  ulkeSay: Record<string, number>;
}

function bosToplayici(deger: string, etiket: string): Toplayici {
  return { deger, etiket, gozlem: 0, engellenen: 0, ilk: Infinity, son: 0, skorTop: 0, ulkeSay: {} };
}

function toplayiciEkle(t: Toplayici, e: BotEvent): void {
  t.gozlem++;
  if (e.verdict === "blocked") t.engellenen++;
  if (e.ts < t.ilk) t.ilk = e.ts;
  if (e.ts > t.son) t.son = e.ts;
  // Düşük insanlık skoru = yüksek tehdit; 0..100 tehdit skoruna çevir.
  t.skorTop += (1 - Math.max(0, Math.min(1, e.score))) * 100;
  if (e.country) t.ulkeSay[e.country] = (t.ulkeSay[e.country] ?? 0) + 1;
}

function baskinUlke(t: Toplayici): string | undefined {
  let enCok: string | undefined;
  let mak = 0;
  for (const [u, n] of Object.entries(t.ulkeSay)) {
    if (n > mak) {
      mak = n;
      enCok = u;
    }
  }
  return enCok;
}

/**
 * Toplayıcıdan KendiKatki üret. onerilenGuven: gözlem sıklığı ve tehdit skoru
 * yükseldikçe artar (0.4 taban → 0.98 tavan). Saf/deterministik.
 */
function toplayiciKatkiya(tur: IocTur, t: Toplayici): KendiKatki {
  const tehditSkoru = Math.round(t.skorTop / t.gozlem);
  // Gözlem doygunluğu (log-benzeri, bölme ile): 1 gözlem düşük, 20+ yüksek.
  const gozlemAgirlik = Math.min(1, t.gozlem / 20);
  const skorAgirlik = tehditSkoru / 100;
  const onerilenGuven = Math.round((0.4 + 0.58 * (0.55 * gozlemAgirlik + 0.45 * skorAgirlik)) * 100) / 100;
  return {
    id: iocId(tur, t.deger),
    tur,
    deger: t.deger,
    etiket: t.etiket,
    gozlem: t.gozlem,
    ilkGorulme: t.ilk === Infinity ? t.son : t.ilk,
    sonGorulme: t.son,
    engellenen: t.engellenen,
    tehditSkoru,
    onerilenGuven,
    ulke: tur === "ip" ? baskinUlke(t) : undefined,
  };
}

/**
 * (a) Kendi katkıların: gözlemlediğin kötü niyetli IOC'ler.
 *
 * Kötü-karar (blocked/flagged) veya düşük-skor (<0.4) olaylarından IP, ASN ve
 * cihaz parmak izi IOC'lerini gruplar; her biri için gözlem sayısı, ilk/son
 * görülme ve önerilen güven döndürür. TAMAMEN GERÇEK — senin verinden.
 *
 * @param events  Events.forOwner(id, N) çıktısı.
 * @param opts.enAzGozlem  Gürültüyü elemek için IOC başına minimum gözlem (varsayılan 1).
 */
export function kendiKatkilar(
  events: BotEvent[],
  opts?: { enAzGozlem?: number },
): KendiKatki[] {
  const enAz = opts?.enAzGozlem ?? 1;
  const ipMap = new Map<string, Toplayici>();
  const asnMap = new Map<string, Toplayici>();
  const fpMap = new Map<string, Toplayici>();

  for (const e of events) {
    if (!kotuOlayMi(e)) continue;

    // IP IOC'si
    if (e.ip) {
      let t = ipMap.get(e.ip);
      if (!t) {
        t = bosToplayici(e.ip, e.country || "??");
        ipMap.set(e.ip, t);
      }
      toplayiciEkle(t, e);
    }

    // ASN IOC'si
    if (e.asn) {
      let t = asnMap.get(e.asn);
      if (!t) {
        t = bosToplayici(e.asn, asnEtiket(e.asn));
        asnMap.set(e.asn, t);
      }
      toplayiciEkle(t, e);
    }

    // Cihaz parmak izi IOC'si
    if (e.fingerprint) {
      let t = fpMap.get(e.fingerprint);
      if (!t) {
        t = bosToplayici(e.fingerprint, e.fingerprint.slice(0, 8));
        fpMap.set(e.fingerprint, t);
      }
      toplayiciEkle(t, e);
    }
  }

  const cikti: KendiKatki[] = [];
  for (const t of ipMap.values()) if (t.gozlem >= enAz) cikti.push(toplayiciKatkiya("ip", t));
  for (const t of asnMap.values()) if (t.gozlem >= enAz) cikti.push(toplayiciKatkiya("asn", t));
  for (const t of fpMap.values()) if (t.gozlem >= enAz) cikti.push(toplayiciKatkiya("fingerprint", t));

  // Etki sırası: önce en çok gözlemlenen + en yüksek skorlu.
  cikti.sort((a, b) => b.gozlem - a.gozlem || b.tehditSkoru - a.tehditSkoru || a.id.localeCompare(b.id));
  return cikti;
}

/* ------------------------------------------------------------------ (b) Topluluk zenginleştirme — TEMSİLİ */

/** Temsili topluluk ağının varsayılan (simüle) düğüm sayısı. */
export const TOPLULUK_DUGUM_SAYISI = 1240;

/** Bir IOC'nin topluluk-doğrulanmış sayılması için gereken düğüm eşiği. */
export const DOGRULAMA_ESIGI = 3;

/**
 * (b) Bir IOC için TEMSİLİ topluluk verisi sentezle — DETERMİNİSTİK.
 *
 * Tüm sayılar iocId hash'inden türetilir; aynı IOC her çağrıda AYNI topluluk
 * verisini verir. Gerçek başka müşteri iddiası yoktur — "simüle edilmiş
 * topluluk ağı" temsilidir.
 *
 * @param tur   IOC türü.
 * @param deger IOC değeri.
 * @param opts.sendeGozlem  Senin gözlem sayın (varsa) — küresel gözleme eklenir.
 */
export function toplulukZenginlestir(
  tur: IocTur,
  deger: string,
  opts?: { sendeGozlem?: number },
): ToplulukZenginlik {
  const anahtar = iocId(tur, deger);

  // Düğüm sayısı: hash'e göre 0..~90 (çoğu IOC birkaç düğümde, azı yaygın).
  // Üstel-benzeri eğri: hash oranının karesi → çoğu düşük, uç birkaçı yüksek.
  const oran = hashOran(anahtar + "|dugum");
  const dugumSayisi = Math.round(oran * oran * 90);

  // Topluluk güveni: düğüm sayısı arttıkça (yaygınlık) ve hash-tutarlılığıyla artar.
  const yayginlik = Math.min(1, dugumSayisi / 30);
  const tutarlilik = 0.5 + 0.5 * hashOran(anahtar + "|tutar");
  const toplulukGuven = Math.round((0.35 + 0.6 * (0.7 * yayginlik + 0.3 * tutarlilik)) * 100) / 100;

  // Küresel ilk-görülme: sabit referans noktasından (2026-01-01) 3..120 gün
  // öncesi. Date.now KULLANILMAZ — deterministik sabit taban + saatlik jitter.
  const REFERANS = 1767225600000; // 2026-01-01T00:00:00Z (sabit)
  const gunOnce = hashAralik(anahtar + "|ilk", 3, 120);
  const jitterSaat = hashAralik(anahtar + "|jitter", 0, 30);
  const kureselIlkGorulme = REFERANS - gunOnce * 86400000 + jitterSaat * 3600000;

  // Kategori: hash'ten sabit seçim.
  const kategori = KATEGORILER[hashAralik(anahtar + "|kat", 0, KATEGORILER.length - 1)];

  // Küresel gözlem: düğüm başına temsili gözlem + senin gözlemin.
  const dugumBasi = hashAralik(anahtar + "|gozlem", 8, 140);
  const kureselGozlem = dugumSayisi * dugumBasi + (opts?.sendeGozlem ?? 0);

  return {
    dugumSayisi,
    toplulukGuven,
    kureselIlkGorulme,
    kategori,
    dogrulandi: dugumSayisi >= DOGRULAMA_ESIGI,
    kureselGozlem,
  };
}

/** Bir KendiKatki'yi topluluk verisiyle zenginleştir (kısayol). */
export function katkiZenginlestir(k: KendiKatki): ZenginlestirilmisKatki {
  return { ...k, topluluk: toplulukZenginlestir(k.tur, k.deger, { sendeGozlem: k.gozlem }) };
}

/* ------------------------------------------------------------------ (c) Ağ özeti */

/** Katkı puanını itibar kademesine çevir. */
function kademeBul(puan: number): string {
  if (puan >= 900) return "Platin";
  if (puan >= 500) return "Altın";
  if (puan >= 200) return "Gümüş";
  return "Bronz";
}

/**
 * (c) Ağ özeti: katkı sayısı, topluluk-doğrulanmış tehdit sayısı, temsili
 * besleme boyutu ve katkı puanı (paylaşımdan kazanılan itibar).
 *
 * Katkı puanı deterministiktir: her katkı gözlem + güvenle ağırlıklanır,
 * doğrulanmışlar bonus alır. Math.random yok.
 */
export function toplulukOzet(katkilar: KendiKatki[]): ToplulukOzet {
  const turDagilim: Record<IocTur, number> = { ip: 0, asn: 0, fingerprint: 0 };
  let dogrulanmisSayisi = 0;
  let puan = 0;

  for (const k of katkilar) {
    turDagilim[k.tur]++;
    const z = toplulukZenginlestir(k.tur, k.deger, { sendeGozlem: k.gozlem });
    if (z.dogrulandi) dogrulanmisSayisi++;
    // Puan: gözlem katkısı (log-benzeri) + güven + doğrulama bonusu.
    const gozlemPuani = Math.min(10, k.gozlem) * 2;
    const guvenPuani = Math.round(k.onerilenGuven * 10);
    puan += gozlemPuani + guvenPuani + (z.dogrulandi ? 8 : 0);
  }

  // Temsili besleme boyutu: sabit taban + katkı başına deterministik artış.
  // (Gerçek bir sayı DEĞİL — topluluğun toplu bilgi havuzunun temsili büyüklüğü.)
  const TABAN_BESLEME = 184_500;
  const toplulukBeslemeBoyutu = TABAN_BESLEME + katkilar.length * 7;

  return {
    katkiSayisi: katkilar.length,
    dogrulanmisSayisi,
    turDagilim,
    toplulukBeslemeBoyutu,
    katkiPuani: puan,
    kademe: kademeBul(puan),
  };
}

/* ------------------------------------------------------------------ (d) Karşılaştır — proaktif kazanç */

/**
 * Topluluk-yalnız IOC havuzunu (temsili) deterministik üret. Senin görmediğin
 * ama topluluğun yaygın işaretlediği tehditler — sana proaktif koruma sağlar.
 *
 * Havuz, senin katkı IOC'lerinin hash'lerinden komşu (türetilmiş) IOC'ler
 * üreterek büyütülür; böylece boş veri setinde bile anlamlı ve deterministik
 * bir topluluk beslemesi oluşur. Tümü "temsili topluluk ağı" etiketiyle sunulur.
 */
function toplulukHavuzu(seninKatkilar: KendiKatki[]): ToplulukTehdit[] {
  const havuz: ToplulukTehdit[] = [];
  const gorulen = new Set<string>();

  // Sabit tohum IP blokları (temsili kötü altyapı) — deterministik türetme tabanı.
  const TOHUM_IP_ONEK = ["185.220.101", "45.155.205", "193.42.33", "89.248.165", "141.98.11", "23.129.64"];
  const TOHUM_ASN = [
    "AS200651 Flokinet",
    "AS49505 Selectel",
    "AS14061 DigitalOcean",
    "AS9009 M247",
    "AS16276 OVH",
    "AS204957 Bulletproof Ltd",
  ];

  const ekle = (tur: IocTur, deger: string, etiket: string) => {
    const anahtar = iocId(tur, deger);
    if (gorulen.has(anahtar)) return;
    gorulen.add(anahtar);
    const topluluk = toplulukZenginlestir(tur, deger);
    // Yalnızca doğrulanmış (topluluğun gerçekten işaretlediği) tehditleri havuza al.
    if (!topluluk.dogrulandi) return;
    havuz.push({
      id: anahtar,
      tur,
      deger,
      etiket,
      topluluk,
      sendeVar: false, // karsilastir() dolduracak
    });
  };

  // Tohum IP'ler: her önekten deterministik son-oktet üret.
  for (const onek of TOHUM_IP_ONEK) {
    const oktet = hashAralik("ip:" + onek + "|oktet", 2, 254);
    const ip = `${onek}.${oktet}`;
    const ulkeKod = ["NL", "RU", "US", "DE", "IR", "UA"][hashAralik("ip:" + ip + "|ulke", 0, 5)];
    ekle("ip", ip, ulkeKod);
  }
  // Tohum ASN'ler.
  for (const asn of TOHUM_ASN) ekle("asn", asn, asnEtiket(asn));

  // Senin katkılarından komşu IOC türet (topluluğun "bir sonraki" gördüğü).
  for (const k of seninKatkilar) {
    if (k.tur === "ip") {
      const p = k.deger.split(".");
      if (p.length === 4) {
        const yeniSon = hashAralik(k.deger + "|komsu", 1, 254);
        const komsu = `${p[0]}.${p[1]}.${p[2]}.${yeniSon}`;
        if (komsu !== k.deger) ekle("ip", komsu, k.ulke ?? "??");
      }
    }
  }

  // Deterministik sırala: en yaygın (düğüm) + en güvenli önce.
  havuz.sort(
    (a, b) =>
      b.topluluk.dugumSayisi - a.topluluk.dugumSayisi ||
      b.topluluk.toplulukGuven - a.topluluk.toplulukGuven ||
      a.id.localeCompare(b.id),
  );
  return havuz;
}

/**
 * (d) Karşılaştır: topluluğun işaretlediği ama SENİN henüz engellemediğin
 * IOC'leri bul (proaktif koruma boşlukları). Ayrıca topluluk havuzundaki
 * IOC'nin sende olup olmadığını işaretler.
 *
 * @param seninKatkilar  kendiKatkilar() çıktısı.
 * @returns bosluklar (sende yok, topluluk var) — engellenince kazanılan proaktif koruma.
 */
export function karsilastir(seninKatkilar: KendiKatki[]): {
  havuz: ToplulukTehdit[];
  bosluklar: ToplulukTehdit[];
  ortakSayisi: number;
} {
  const seninSet = new Set(seninKatkilar.map((k) => iocId(k.tur, k.deger)));
  const havuz = toplulukHavuzu(seninKatkilar);

  let ortakSayisi = 0;
  for (const t of havuz) {
    t.sendeVar = seninSet.has(t.id);
    if (t.sendeVar) ortakSayisi++;
  }
  const bosluklar = havuz.filter((t) => !t.sendeVar);
  return { havuz, bosluklar, ortakSayisi };
}

/* ------------------------------------------------------------------ Karşılıklılık (give-get) */

export interface Karsiliklilik {
  /** Topluluğa kaç IOC katkı yaptın (paylaşıma açıksan). */
  verilen: number;
  /** Topluluktan kaç proaktif engelleme kazandın (boşluk sayısı). */
  kazanilan: number;
  /** Kaç tehdidin topluluğca doğrulandı (daha hızlı aksiyon). */
  dogrulanan: number;
  /** Net ağ-etkisi oranı (kazanılan / max(1, verilen)). */
  agEtkisiOrani: number;
}

/**
 * Give-get karşılıklılık görünümü: kaç IOC verdin, karşılığında kaç proaktif
 * engelleme + doğrulama kazandın. Ağ-etkisi değer çerçevesi.
 */
export function karsiliklilik(
  seninKatkilar: KendiKatki[],
  paylasilanSet: Set<string>,
): Karsiliklilik {
  const verilen = seninKatkilar.filter((k) => paylasilanSet.has(k.id)).length;
  const { bosluklar, ortakSayisi } = karsilastir(seninKatkilar);
  const kazanilan = bosluklar.length;
  return {
    verilen,
    kazanilan,
    dogrulanan: ortakSayisi,
    agEtkisiOrani: Math.round((kazanilan / Math.max(1, verilen)) * 10) / 10,
  };
}
