/**
 * Specter — SOC Vaka & Ekip İş Akışı (saf yardımcı)
 * ==================================================
 * Tespit edilen tehditleri ATANABİLİR VAKALARA (case) dönüştürür: sahip,
 * durum yaşam döngüsü, öncelik/SLA ve ekip performans takibi. Gerçek bir
 * SOC'un çalışma biçimi — analistler vakayı üstlenir, triyaj eder, çözer;
 * yönetim MTTR/backlog izler. Olay Müdahale playbook'larının (mudahale)
 * ÜZERİNE oturan KUYRUK/EKİP/VAKA katmanıdır (her vaka bir playbook'a atıf
 * yapabilir).
 *
 * Bu dosya SAF ve DETERMİNİSTİKtir: compute içinde Date.now / Math.random
 * KULLANILMAZ. "Şimdi" referansı olaylardaki en büyük ts'tir (en yeni olay).
 * Böylece aynı girdi her zaman aynı vakaları üretir (test edilebilir).
 *
 * DÜRÜSTLÜK: Vakalar GERÇEK yüksek-şiddetli olaylardan buluşsal kümeleme ile
 * TOHUMLANIR (auto-seed). Ekip listesi (TAKIM) ve ilk atamalar TEMSİLİ bir
 * demo iş akışıdır — istemci bunu açıkça belirtir. Üretimi mutasyona uğratmaz.
 *
 * NOT: src/lib/specter/* dosyaları yasak; bu yardımcı panel-yereldir.
 */

import type { BotEvent, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Türler */

/** Vaka önceliği (PagerDuty tarzı). P1 = en yüksek. */
export type Oncelik = "P1" | "P2" | "P3" | "P4";

/** Vaka yaşam döngüsü durumu (kanban sütunları). */
export type VakaDurum = "yeni" | "triyaj" | "devam" | "beklemede" | "cozuldu";

/** Kanban sütun sırası (kanonik). */
export const DURUM_SIRA: VakaDurum[] = ["yeni", "triyaj", "devam", "beklemede", "cozuldu"];

/** Durum insan-okur etiketleri. */
export const DURUM_ETIKET: Record<VakaDurum, string> = {
  yeni: "Yeni",
  triyaj: "Triyaj",
  devam: "Devam ediyor",
  beklemede: "Beklemede",
  cozuldu: "Çözüldü",
};

/** Öncelik insan-okur etiketleri + SLA süreleri (dakika). */
export const ONCELIK_ETIKET: Record<Oncelik, string> = {
  P1: "P1 — Kritik",
  P2: "P2 — Yüksek",
  P3: "P3 — Orta",
  P4: "P4 — Düşük",
};

/** Öncelik başına SLA hedefi (dakika) — çözüm için taahhüt süresi. */
export const SLA_DK: Record<Oncelik, number> = {
  P1: 60, // 1 saat
  P2: 240, // 4 saat
  P3: 720, // 12 saat
  P4: 1440, // 24 saat
};

/** Bir ekip analisti (temsili demo roster). */
export interface Analist {
  id: string;
  ad: string;
  rol: "Kıdemli Analist" | "Analist" | "Yönetici";
  /** Avatar rengi (kit Avatar ile). */
  renk: string;
  /** Başlangıçta atanmış (temsili) aktif vaka sayısı — üretimden hesaplanır. */
  aktifVaka: number;
}

/** Atanabilir bir güvenlik vakası (case). */
export interface Vaka {
  id: string;
  /** Deterministik başlık (ör. "AS9009 kaynaklı kimlik-doldurma dalgası"). */
  baslik: string;
  /** Saldırı türü (insan-okur). */
  tur: string;
  oncelik: Oncelik;
  durum: VakaDurum;
  /** Atanan analist adı (yoksa null). */
  atanan: string | null;
  /** Oluşturulma anı (kümedeki ilk olay ts'i). */
  olusturuldu: number;
  /** Son güncelleme anı (kümedeki son olay ts'i; çözüldüyse çözüm anı). */
  guncellendi: number;
  /** SLA hedefi (dakika) — önceliğe göre. */
  sla: number;
  /** Etkilenen istek (olay) sayısı. */
  etkilenenIstek: number;
  /** Kaynak özeti (ASN / IP / ülke). */
  kaynak: string;
  /** Baskın bot sınıfı. */
  botClass: BotClass;
  /** İlgili müdahale playbook'unun adı (cross-link — /panel/mudahale). */
  ilgiliPlaybook: string;
  /** Baskın kaynak ASN (kısa, ör. "AS9009"). */
  asn: string;
  /** Kaynak ülkeler (ISO2, en sık üstte, en fazla 4). */
  ulkeler: string[];
  /** Benzersiz IP sayısı. */
  benzersizIp: number;
  /** İnsan-okur açıklama (nasıl tohumlandı). */
  aciklama: string;
}

/* ------------------------------------------------------------------ Sabitler */

const SAAT = 3_600_000;
const DK = 60_000;
/** Aynı kümedeki iki olay bu süreden fazla ayrıksa yeni pencere başlar. */
const PATLAMA_BOSLUK = 6 * SAAT;
/** Bir vaka sayılması için gereken asgari olay (altındakiler gürültü). */
const MIN_OLAY = 4;

/**
 * botClass → saldırı türü adı (vaka başlığı için).
 * İnsan/iyi-bot saldırı sayılmaz (filtrelenir), yine de tam kayıt için tutulur.
 */
const SALDIRI_ADI: Record<BotClass, string> = {
  human: "İnsan trafiği",
  good_bot: "İyi-bot aktivitesi",
  automation: "otomasyon dalgası",
  scraper: "içerik kazıma kampanyası",
  credential_stuffing: "kimlik-doldurma dalgası",
  ai_agent: "AI-ajan taraması",
  ddos: "DDoS sel saldırısı",
  spam: "spam akını",
};

/**
 * botClass → ilgili müdahale playbook adı (mudahale/playbook.ts kataloğuyla
 * ELLE senkron; oradaki `ad` alanlarıyla birebir eşleşir ki cross-link tutarlı
 * olsun). O dosya READ-ONLY olduğundan burada isimler sabitlenir.
 */
const PLAYBOOK_ADI: Record<BotClass, string> = {
  human: "Şüpheli Otomasyon Artışı",
  good_bot: "Şüpheli Otomasyon Artışı",
  automation: "Kazıyıcı Kampanyası",
  scraper: "Kazıyıcı Kampanyası",
  credential_stuffing: "Kimlik Doldurma Dalgası",
  ai_agent: "AI Eğitim Taraması",
  ddos: "DDoS Sel Saldırısı",
  spam: "Şüpheli Otomasyon Artışı",
};

/* ------------------------------------------------------------------ Yardımcılar */

/** ASN dizesinden kısa etiket çıkarır: "AS9009 M247 Ltd" → "AS9009". */
function asnKisa(asn: string): string {
  const m = /^(AS\d+)/i.exec((asn || "").trim());
  return m ? m[1].toUpperCase() : (asn || "").trim().split(/\s+/)[0] || "AS?";
}

/** Bir sayaç haritasına ekler. */
function say<T>(harita: Map<T, number>, k: T): void {
  harita.set(k, (harita.get(k) ?? 0) + 1);
}

/** Sayaç haritasını sıklığa göre azalan sıralı anahtar dizisine çevirir. */
function sirali<T>(harita: Map<T, number>): T[] {
  return [...harita.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
}

/**
 * Deterministik id: bileşik anahtar + pencere başlangıcından türetilir (FNV-1a).
 * Aynı küme her zaman aynı id'yi alır (crypto/random YOK).
 */
function vakaId(anahtar: string, pencereBaslangic: number): string {
  let h = 2166136261;
  const s = `${anahtar}|${pencereBaslangic}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "vaka_" + (h >>> 0).toString(36);
}

/**
 * Deterministik öncelik: baskın sınıfın temel şiddeti + hacim/dağıtım
 * yükseltmesi. Kritik sınıflar (credential_stuffing, ddos) yüksek başlar;
 * çok olay + çok IP + çok ASN önceliği yukarı iter.
 */
function oncelikHesapla(
  botClass: BotClass,
  olaySayisi: number,
  benzersizIp: number,
  asnSayisi: number,
  kacinmaOran: number,
): Oncelik {
  // Temel şiddet skoru (0..100) sınıfa göre.
  const temel: Partial<Record<BotClass, number>> = {
    credential_stuffing: 62,
    ddos: 60,
    ai_agent: 34,
    scraper: 40,
    automation: 36,
    spam: 30,
  };
  let skor = temel[botClass] ?? 30;

  // Hacim yükseltmesi: 30 olayda +8, 120 olayda doygun (+16).
  skor += Math.min(16, Math.floor(olaySayisi / 8));
  // Dağıtım: çok IP (dağıtık altyapı) → daha ciddi.
  skor += Math.min(10, Math.floor(benzersizIp / 4));
  // Çok-ağ koordinasyonu.
  skor += Math.min(8, (asnSayisi - 1) * 3);
  // Kaçınma sinyali (headless / TLS-UA uyumsuz / otomasyon bayrağı).
  skor += Math.round(kacinmaOran * 12);

  if (skor >= 78) return "P1";
  if (skor >= 56) return "P2";
  if (skor >= 36) return "P3";
  return "P4";
}

/* ------------------------------------------------------------------ Ana kümeleme */

/**
 * GERÇEK yüksek-şiddetli olayları aday vakalara kümeler.
 *
 * Algoritma (kampanya kümelemesiyle akraba, vaka-odaklı):
 *  1) Saldırı olmayan sınıfları (human/good_bot) ele.
 *  2) Bileşik anahtarla (ASN-kısa + botClass) grupla.
 *  3) Her grup içinde ts'e göre sırala; PATLAMA_BOSLUK'tan büyük boşlukta böl.
 *  4) MIN_OLAY altını gürültü say.
 *  5) Her pencereyi bir Vaka'ya dönüştür: deterministik başlık + öncelik +
 *     SLA + kaynak özeti + ilgili playbook.
 *  6) Öncelik ve son-görülme'ye göre sırala.
 *
 * "Şimdi" referansı: tüm olaylardaki en büyük ts (deterministik).
 * Başlangıç durumu deterministik olarak dağıtılır (yeni/triyaj/devam) —
 * gerçek bir kuyruğun karışık görünmesi için; istemci bunu localStorage'a
 * kopyalar ve oradan yönetir.
 */
export function vakalariUret(events: BotEvent[]): Vaka[] {
  if (!events || events.length === 0) return [];

  // Saldırı olmayan sınıfları ele.
  const kotu = events.filter((e) => e.botClass !== "human" && e.botClass !== "good_bot");
  if (kotu.length === 0) return [];

  // 1) Bileşik anahtara göre grupla (ASN + sınıf).
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of kotu) {
    const anahtar = `${asnKisa(e.asn)}|${e.botClass}`;
    let arr = gruplar.get(anahtar);
    if (!arr) {
      arr = [];
      gruplar.set(anahtar, arr);
    }
    arr.push(e);
  }

  const vakalar: Vaka[] = [];

  for (const [anahtar, grupOlaylar] of gruplar) {
    // 2) Zamana göre sırala ve patlama pencerelerine böl.
    const sirasal = [...grupOlaylar].sort((a, b) => a.ts - b.ts);
    let pencere: BotEvent[] = [];
    const pencereler: BotEvent[][] = [];
    let onceki = -Infinity;
    for (const e of sirasal) {
      if (pencere.length > 0 && e.ts - onceki > PATLAMA_BOSLUK) {
        pencereler.push(pencere);
        pencere = [];
      }
      pencere.push(e);
      onceki = e.ts;
    }
    if (pencere.length > 0) pencereler.push(pencere);

    // 3) + 4) Her pencereyi vakaya dönüştür.
    for (const pOlaylar of pencereler) {
      if (pOlaylar.length < MIN_OLAY) continue; // gürültü

      const ilk = pOlaylar[0].ts;
      const son = pOlaylar[pOlaylar.length - 1].ts;

      // Sayaçlar.
      const ipSet = new Set<string>();
      const asnSay = new Map<string, number>();
      const ulkeSay = new Map<string, number>();
      const sinifSay = new Map<BotClass, number>();
      let kacinma = 0;
      for (const e of pOlaylar) {
        ipSet.add(e.ip);
        say(asnSay, e.asn);
        if (e.country) say(ulkeSay, e.country);
        say(sinifSay, e.botClass);
        if (e.headless || e.tlsUaUyumsuz || (e.automationFlags && e.automationFlags.length > 0)) kacinma++;
      }

      const asnlar = sirali(asnSay);
      const ulkeler = sirali(ulkeSay);
      const baskinSinif = sirali(sinifSay)[0];
      const benzersizIp = ipSet.size;
      const kacinmaOran = pOlaylar.length > 0 ? kacinma / pOlaylar.length : 0;

      const oncelik = oncelikHesapla(baskinSinif, pOlaylar.length, benzersizIp, asnlar.length, kacinmaOran);
      const asnEtiket = asnKisa(asnlar[0]);
      const turAdi = SALDIRI_ADI[baskinSinif];

      // Deterministik başlık: "AS9009 kaynaklı kimlik-doldurma dalgası".
      const baslik = `${asnEtiket} kaynaklı ${turAdi}`;

      // Kaynak özeti (ASN + IP + ülke).
      const anaUlke = ulkeler[0] ?? "—";
      const kaynak = `${asnEtiket} · ${benzersizIp} IP · ${anaUlke}${ulkeler.length > 1 ? ` +${ulkeler.length - 1}` : ""}`;

      const aciklama =
        `${pOlaylar.length} olay, ${benzersizIp} benzersiz IP ve ${asnlar.length} ASN paylaşan ` +
        `${turAdi}. ${asnEtiket} altyapısından ${ulkeler.length} ülkeye yayılmış; ` +
        `${SLA_DK[oncelik]} dk SLA ile ${ONCELIK_ETIKET[oncelik]} olarak sınıflandırıldı.`;

      // Başlangıç durumunu deterministik dağıt (id hash'inden) — kuyruk gerçekçi
      // görünsün. P1/P2 daha çok "yeni/triyaj/devam"; düşükler "beklemede" olabilir.
      const id = vakaId(anahtar, ilk);
      const durum = baslangicDurum(id, oncelik);
      // Çözülmüş başlangıç yok — hepsi açık kuyrukta doğar (canlı SOC hissi).

      vakalar.push({
        id,
        baslik,
        tur: turAdi,
        oncelik,
        durum,
        atanan: null, // ilk atama istemcide temsili roster'dan yapılır
        olusturuldu: ilk,
        guncellendi: son,
        sla: SLA_DK[oncelik],
        etkilenenIstek: pOlaylar.length,
        kaynak,
        botClass: baskinSinif,
        ilgiliPlaybook: PLAYBOOK_ADI[baskinSinif],
        asn: asnEtiket,
        ulkeler: ulkeler.slice(0, 4),
        benzersizIp,
        aciklama,
      });
    }
  }

  // 6) Öncelik (P1 önce) sonra son-görülme'ye göre sırala.
  const oncelikRank: Record<Oncelik, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
  vakalar.sort((a, b) => {
    if (oncelikRank[a.oncelik] !== oncelikRank[b.oncelik]) {
      return oncelikRank[a.oncelik] - oncelikRank[b.oncelik];
    }
    return b.guncellendi - a.guncellendi;
  });

  return vakalar;
}

/**
 * Deterministik başlangıç durumu (id hash + öncelikten). Kuyruğun canlı
 * görünmesi için vakaları "yeni/triyaj/devam/beklemede" arasında dağıtır.
 * Çözülmüş üretilmez — çözümler ekip metrik demosu için ayrıca tohumlanır.
 */
function baslangicDurum(id: string, oncelik: Oncelik): VakaDurum {
  // id son karakterinden 0..35 kova.
  const c = id.charCodeAt(id.length - 1);
  const kova = c % 4;
  // P1: hızla ele alınır (triyaj/devam ağırlıklı). P4: beklemede olabilir.
  if (oncelik === "P1") return kova < 2 ? "triyaj" : "devam";
  if (oncelik === "P2") return kova === 0 ? "yeni" : kova === 3 ? "devam" : "triyaj";
  if (oncelik === "P3") return kova < 2 ? "yeni" : "triyaj";
  return kova === 0 ? "beklemede" : "yeni";
}

/* ------------------------------------------------------------------ Ekip roster */

/**
 * TAKIM — temsili SOC ekip listesi (demo roster). Sabit ve deterministik.
 * DÜRÜSTLÜK: Gerçek ekip üyeleri değil; iş akışını göstermek için temsilidir
 * (istemci bunu açıkça etiketler). aktifVaka başlangıç değeri temsilidir;
 * istemci gerçek atama sayısını localStorage durumundan hesaplar.
 */
export const TAKIM: Analist[] = [
  { id: "an_ela", ad: "Ela Demir", rol: "Kıdemli Analist", renk: "#06b6d4", aktifVaka: 0 },
  { id: "an_kaan", ad: "Kaan Yılmaz", rol: "Analist", renk: "#10b981", aktifVaka: 0 },
  { id: "an_zeynep", ad: "Zeynep Arslan", rol: "Kıdemli Analist", renk: "#8b5cf6", aktifVaka: 0 },
  { id: "an_mert", ad: "Mert Kaya", rol: "Analist", renk: "#f59e0b", aktifVaka: 0 },
  { id: "an_selin", ad: "Selin Aydın", rol: "Yönetici", renk: "#ef4444", aktifVaka: 0 },
];

/* ------------------------------------------------------------------ Ekip metrikleri */

export interface EkipMetrik {
  /** Toplam vaka. */
  toplam: number;
  /** Açık (çözülmemiş) vaka. */
  acik: number;
  /** Çözülmüş vaka. */
  cozuldu: number;
  /** Ortalama çözüm süresi (dakika) — çözülmüş vakaların olusturuldu→guncellendi ortalaması. */
  ortMTTR: number;
  /** SLA'yı aşan (ihlal) vaka sayısı. */
  slaIhlal: number;
  /** En eski açık vakanın yaşı (dakika) — backlog yaşlanması. */
  backlogYasi: number;
  /** Öncelik dağılımı (P1..P4 sayıları). */
  oncelikDagilim: Record<Oncelik, number>;
  /** SLA uyum yüzdesi (0..100) — süresi içinde olan vaka oranı. */
  slaUyum: number;
}

/**
 * Ekip/kuyruk metriklerini hesaplar (saf). "now" verilmezse vakalardaki en
 * büyük guncellendi/olusturuldu referans alınır (deterministik).
 */
export function ekipMetrikleri(vakalar: Vaka[], now?: number): EkipMetrik {
  const oncelikDagilim: Record<Oncelik, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };

  // Referans "şimdi": verilmezse en büyük guncellendi (deterministik).
  let ref = now ?? 0;
  if (now === undefined) {
    for (const v of vakalar) {
      if (v.guncellendi > ref) ref = v.guncellendi;
      if (v.olusturuldu > ref) ref = v.olusturuldu;
    }
  }

  let acik = 0;
  let cozuldu = 0;
  let mttrToplam = 0;
  let mttrSayi = 0;
  let slaIhlal = 0;
  let backlogYasi = 0;

  for (const v of vakalar) {
    oncelikDagilim[v.oncelik]++;
    if (v.durum === "cozuldu") {
      cozuldu++;
      // MTTR: oluşturma → son güncelleme (çözüm anı), dakika.
      const sureDk = Math.max(0, (v.guncellendi - v.olusturuldu) / DK);
      mttrToplam += sureDk;
      mttrSayi++;
      // SLA ihlali: çözüm süresi SLA hedefini aştıysa.
      if (sureDk > v.sla) slaIhlal++;
    } else {
      acik++;
      // Açık vaka yaşı (oluşturma → şimdi).
      const yasDk = Math.max(0, (ref - v.olusturuldu) / DK);
      if (yasDk > backlogYasi) backlogYasi = yasDk;
      // Açık ve SLA'yı geçmiş de ihlaldir.
      if (yasDk > v.sla) slaIhlal++;
    }
  }

  const toplam = vakalar.length;
  const ortMTTR = mttrSayi > 0 ? Math.round(mttrToplam / mttrSayi) : 0;
  const slaUyum = toplam > 0 ? Math.round(((toplam - slaIhlal) / toplam) * 100) : 100;

  return {
    toplam,
    acik,
    cozuldu,
    ortMTTR,
    slaIhlal,
    backlogYasi: Math.round(backlogYasi),
    oncelikDagilim,
    slaUyum,
  };
}

/* ------------------------------------------------------------------ SLA durumu */

export interface SlaDurum {
  /** SLA hedefine kalan dakika (negatifse aşıldı). */
  kalanDk: number;
  /** SLA ihlal edildi mi. */
  ihlal: boolean;
  /** Geçen süre yüzdesi (0..100+, SLA penceresinin ne kadarı tükendi). */
  yuzde: number;
}

/**
 * Tek bir vakanın SLA durumu (saf). Çözülmüş vaka için kapanış süresine göre;
 * açık vaka için "now"a göre kalan süreyi hesaplar.
 */
export function slaDurumu(vaka: Vaka, now: number): SlaDurum {
  const slaMs = vaka.sla * DK;
  // Çözülmüşse geçen süre = çözüm anı - oluşturma; değilse now - oluşturma.
  const bitis = vaka.durum === "cozuldu" ? vaka.guncellendi : now;
  const gecenMs = Math.max(0, bitis - vaka.olusturuldu);
  const kalanMs = slaMs - gecenMs;
  const kalanDk = Math.round(kalanMs / DK);
  const yuzde = slaMs > 0 ? Math.round((gecenMs / slaMs) * 100) : 100;
  return {
    kalanDk,
    ihlal: gecenMs > slaMs,
    yuzde: Math.max(0, yuzde),
  };
}
