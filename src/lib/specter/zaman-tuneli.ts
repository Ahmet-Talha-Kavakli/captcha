/**
 * Specter — Saldırı Zaman Tüneli & Olay Yeniden-Kurgu
 * ===================================================
 * Ham bot/güvenlik olaylarını KRONOLOJİK adli bir zaman tüneline dönüştürür.
 * Korelasyon motorunu (korelasyonBul) kullanarak olayları "incident"lara
 * gruplar, ardından her incident içinde olayları bir KILL-CHAIN faz dizisine
 * (keşif → erişim-denemesi → yayılma → veri-çıkarma → etki) yeniden kurar.
 *
 * Çıktı, saldırının zaman içindeki anlatısıdır: hangi IP/ASN ne zaman
 * katıldı, savunma ne zaman devreye girdi, olay hangi fazlardan geçti.
 *
 * SAF FONKSİYON KATMANI — bilinçli olarak `next/headers`/`server-only`
 * import ETMEZ; tsx test koşucusuyla bağımsız test edilebilir.
 *
 * DETERMİNİZM: Bu dosya ASLA `Date.now()`, `Math.random()` ya da argümansız
 * `new Date()` çağırmaz. Her metrik içeri verilen olay zaman damgalarından
 * hesaplanır — aksi halde test koşucusunda kırılır ve sonuçlar oynak olur.
 */

import { korelasyonBul, type KorelasyonOlay, type Korelasyon } from "./correlation";

/* ------------------------------------------------------------------ Tipler */

/**
 * Zaman tünelinin ihtiyaç duyduğu asgari olay şekli. BotEvent ve
 * KorelasyonOlay ile birebir uyumlu (yeni alan EKLENMEZ) — böylece hem
 * gerçek Events.forOwner çıktısı hem de sentetik test dizisi verilebilir.
 */
export type TunelOlay = KorelasyonOlay;

/** Kill-chain fazı (saldırı yaşam döngüsünün aşamaları — Türkçe). */
export type Faz =
  | "kesif" // erken, düşük-hacimli sondalama / GET taraması
  | "erisim_denemesi" // login/auth endpoint'lerine kimlik doldurma
  | "yayilma" // çok yol / çok IP'ye dağılma (yatay hareket)
  | "veri_cikarma" // tekrarlı data/api/export endpoint'i vurma
  | "etki"; // savunmanın devreye girmesi (engelle/challenge patlaması)

/** Bir incident içindeki tek bir kill-chain fazının kaydı. */
export interface FazKaydi {
  faz: Faz;
  /** Bu faza ait ilk olayın ts'i (fazın başlangıç anı). */
  ts: number;
  /** Bu faza ait son olayın ts'i (fazın bitiş anı). */
  bitisTs: number;
  olaySayisi: number;
  /** İnsan-okur anlatı cümlesi (bu fazda ne oldu). */
  aciklama: string;
  /** Bu faza katılan benzersiz IP'ler (sıralı). */
  ipler: string[];
  /** Bu fazdaki baskın verdict (engel/challenge yoğunluğu göstergesi). */
  baskinVerdict: string;
}

/** Bir katılımcının (IP) saldırıya ne zaman/nasıl katıldığı. */
export interface Katilimci {
  ip: string;
  country: string;
  asn: string;
  /** İlk olay ts (saldırıya katılma anı). */
  ilkGorulme: number;
  /** Son olay ts. */
  sonGorulme: number;
  olaySayisi: number;
  /** Bu IP'nin ilk göründüğü faz (rolü). */
  ilkFaz: Faz;
  /** Bu IP'nin engellenme oranı (0..1). */
  engelOrani: number;
}

/** Savunma yanıtının kırılımı. */
export interface SavunmaYaniti {
  engellenen: number;
  dogrulanan: number; // challenged
  izin: number; // allowed
  /** İşaretlenen (flagged). */
  isaretlenen: number;
  /** Savunmanın ilk devreye girdiği an (ilk blocked/challenged olay ts), yoksa null. */
  ilkTepkiTs: number | null;
  /** Toplam engel+challenge oranı (0..1) — mitigasyon etkinliği. */
  mitigasyonOrani: number;
}

/** Yeniden kurulmuş tek bir olay (incident). */
export interface TunelOlayi {
  id: string;
  baslik: string;
  /** Korelasyon türünden gelen şiddet ("kritik"|"yuksek"|"orta"|"dusuk"). */
  siddet: string;
  baslangic: number;
  bitis: number;
  sureMs: number;
  /** Kronolojik kill-chain faz dizisi. */
  fazlar: FazKaydi[];
  katilanIp: number;
  katilanAsn: number;
  ulkeler: string[];
  asnler: string[];
  /** Olayın en yoğun (en çok olay üreten) dakika-kovasının orta ts'i. */
  dorukTs: number;
  savunmaYaniti: SavunmaYaniti;
  /** Katılımcı IP'ler, katılma sırasına göre. */
  katilimcilar: Katilimci[];
  /** Otomatik üretilmiş 2-3 cümlelik adli anlatı özeti. */
  anlati: string;
  /** Toplam olay sayısı (bu incident). */
  olaySayisi: number;
  /** Baskın bot sınıfı. */
  dominantBotClass: string;
  /** Zaman-tüneli scrubber için tüm olaylar (ts artan, hafif alanlar). */
  olaylar: TunelOlay[];
}

/** Genel zaman çizelgesi için tek bir zaman kovası. */
export interface ZamanKovasi {
  /** Kovanın başlangıç ts'i. */
  ts: number;
  toplam: number;
  engellenen: number;
  dogrulanan: number; // challenged + flagged
  izin: number; // allowed
}

/* ------------------------------------------------------------------ Ayarlar */

/** Doruk hesabı için kova genişliği (ms). */
const DORUK_KOVA_MS = 60 * 1000; // 1 dk

/** Veri/çıkarma sayılan yol desenleri. */
const VERI_YOL_DESEN = /(api|export|download|graphql|scrape|data|feed|report|dump|backup|\.json|\.csv)/i;
/** Kimlik/erişim endpoint'i sayılan yol desenleri. */
const ERISIM_YOL_DESEN = /(login|signin|sign-in|auth|token|oauth|password|register|reset|otp|2fa|session)/i;

/** Kötü (saldırgan) verdict'ler. */
const KOTU_VERDICT = new Set(["blocked", "challenged", "flagged"]);

/* ------------------------------------------------------------------ Etiketler (UI ortak) */

export const FAZ_ETIKET: Record<Faz, string> = {
  kesif: "Keşif",
  erisim_denemesi: "Erişim Denemesi",
  yayilma: "Yayılma",
  veri_cikarma: "Veri Çıkarma",
  etki: "Etki",
};

/** Faz açıklamaları (kısa alt-metin). */
export const FAZ_ACIKLAMA: Record<Faz, string> = {
  kesif: "Düşük hacimli sondalama, endpoint keşfi",
  erisim_denemesi: "Kimlik doğrulama endpoint'lerine yüklenme",
  yayilma: "Çok sayıda yol/IP'ye yatay dağılma",
  veri_cikarma: "Veri/API endpoint'lerinden toplu sızdırma",
  etki: "Kaynak tüketimi ve savunmanın devreye girmesi",
};

/** Faz renkleri (grafik/rozet — kill-chain ilerledikçe koyulaşan tehdit). */
export const FAZ_RENK: Record<Faz, string> = {
  kesif: "#2f6fed", // mavi — erken, düşük tehdit
  erisim_denemesi: "#7c3aed", // mor
  yayilma: "#d97706", // amber
  veri_cikarma: "#dc2626", // kırmızı
  etki: "#0f766e", // teal — savunma yanıtı
};

/** Kill-chain'in kanonik (kronolojik) faz sırası. */
export const FAZ_SIRA: Faz[] = ["kesif", "erisim_denemesi", "yayilma", "veri_cikarma", "etki"];

/* ------------------------------------------------------------------ Yardımcılar */

/** Deterministik 32-bit FNV-1a hash → kısa hex (Date.now/random KULLANMAZ). */
function hash(girdi: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < girdi.length; i++) {
    h ^= girdi.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Benzersiz + sıralı (kararlı çıktı için). */
function tekil(dizi: string[]): string[] {
  return [...new Set(dizi)].sort();
}

/** Bir dizideki en sık geçen değeri döndürür (eşitlikte ilk görülen). */
function baskin<T>(dizi: T[]): T | undefined {
  const say = new Map<T, number>();
  let enIyi: T | undefined;
  let enCok = 0;
  for (const x of dizi) {
    const n = (say.get(x) ?? 0) + 1;
    say.set(x, n);
    if (n > enCok) {
      enCok = n;
      enIyi = x;
    }
  }
  return enIyi;
}

/** ts'i "HH:MM" biçimine çevirir (verilen ts'ten — argümansız new Date YOK). */
function saatDk(ts: number): string {
  const d = new Date(ts);
  const s = String(d.getUTCHours()).padStart(2, "0");
  const dk = String(d.getUTCMinutes()).padStart(2, "0");
  return `${s}:${dk}`;
}

/** Süre biçimlendir (ms → "3dk 12sn" / "45sn"). */
function sureBicim(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}sn`;
  const dk = Math.floor(s / 60);
  const kalan = s % 60;
  return kalan ? `${dk}dk ${kalan}sn` : `${dk}dk`;
}

/**
 * Tek bir olayı kill-chain fazına eşler. HEURİSTİK: yol + botClass + verdict.
 *
 *  1) verdict blocked/challenged/flagged ise → ETKİ (savunma devrede).
 *  2) yol kimlik/auth endpoint'i (login/token…) VEYA botClass
 *     credential_stuffing ise → ERİŞİM DENEMESİ.
 *  3) yol veri/api/export endpoint'i VEYA botClass scraper/ai_agent ise →
 *     VERİ ÇIKARMA.
 *  4) botClass ddos ise → YAYILMA (hacimsel yük/yatay hareket).
 *  5) Aksi halde (automation/human ve genel yol — düşük sinyalli sondalama)
 *     → KEŞİF.
 *
 * Not: YAYILMA aslında toplu bir özelliktir (çok IP/çok yola dağılma); bu
 * yüzden tek-olay KEŞİF sınıflaması `fazlariKur` içinde, bir keşif kümesi
 * çok yola/çok IP'ye yayıldığında YAYILMA'ya yükseltilir. Böylece "salt
 * GET taraması → yatay hareket" ayrımı zamansal bağlamda yapılır.
 */
export function olayFazi(e: TunelOlay): Faz {
  // Savunma tepkisi her şeyin önünde: engellenen/challenge = etki fazı.
  if (KOTU_VERDICT.has(e.verdict)) return "etki";
  // Kimlik doğrulama saldırısı.
  if (e.botClass === "credential_stuffing" || ERISIM_YOL_DESEN.test(e.path)) return "erisim_denemesi";
  // Veri kazıma / sızdırma.
  if (e.botClass === "scraper" || e.botClass === "ai_agent" || VERI_YOL_DESEN.test(e.path)) return "veri_cikarma";
  // Yüksek hacimli yük (DDoS) → yayılma/kaynak tüketimi.
  if (e.botClass === "ddos") return "yayilma";
  // Düşük sinyalli sondalama (automation/human, genel yol) → keşif.
  return "kesif";
}

/** Yayılma eşikleri: bir keşif kümesi bu kadar farklı IP/yola değerse
 *  "yatay hareket" (yayılma) sayılır. */
const YAYILMA_IP_ESIK = 3;
const YAYILMA_YOL_ESIK = 4;

/**
 * Bir faz kaydı için insan-okur açıklama cümlesi üretir.
 * Faz + katılan IP sayısı + baskın verdict + yol örneğinden.
 */
function fazAciklama(faz: Faz, olaylar: TunelOlay[], ipSayisi: number): string {
  const ornekYol = baskin(olaylar.map((e) => e.path)) ?? "/";
  const kotu = olaylar.filter((e) => KOTU_VERDICT.has(e.verdict)).length;
  const oran = Math.round((kotu / Math.max(1, olaylar.length)) * 100);
  switch (faz) {
    case "kesif":
      return `${ipSayisi} IP düşük hacimle ${ornekYol} çevresinde sondalama yaptı.`;
    case "erisim_denemesi":
      return `${olaylar.length} kimlik doğrulama denemesi ${ornekYol} endpoint'ine yöneldi.`;
    case "yayilma":
      return `Saldırı ${ipSayisi} IP ve ${tekil(olaylar.map((e) => e.path)).length} yola yayıldı (yatay hareket).`;
    case "veri_cikarma":
      return `${ornekYol} üzerinden tekrarlı veri çıkarma; ${olaylar.length} istek.`;
    case "etki":
      return `Savunma devrede: olayların %${oran}'ı engellendi/doğrulandı.`;
  }
}

/**
 * Bir incident'ın olaylarından kronolojik faz dizisini kurar.
 *
 * Yaklaşım: olaylar ts'e göre sıralanır, her olay `olayFazi` ile
 * etiketlenir, ardından AYNI faza ait ARDIŞIK olaylar tek bir FazKaydi'na
 * birleştirilir. Böylece "keşif → erişim → … → etki" gibi zaman sıralı
 * bir anlatı ortaya çıkar (aynı faz saldırı boyunca birden çok kez de
 * görünebilir — gerçek kill-chain gibi).
 */
export function fazlariKur(olaylar: TunelOlay[]): FazKaydi[] {
  if (!olaylar.length) return [];
  const sirali = [...olaylar].sort((a, b) => a.ts - b.ts);
  const kayitlar: FazKaydi[] = [];
  let mevcut: { faz: Faz; grup: TunelOlay[] } | null = null;

  const kapat = (m: { faz: Faz; grup: TunelOlay[] }) => {
    const ipler = tekil(m.grup.map((e) => e.ip));
    // KEŞİF kümesi çok IP/çok yola yayıldıysa YAYILMA'ya yükselt (yatay hareket).
    let faz = m.faz;
    if (faz === "kesif") {
      const yollar = tekil(m.grup.map((e) => e.path)).length;
      if (ipler.length >= YAYILMA_IP_ESIK || yollar >= YAYILMA_YOL_ESIK) faz = "yayilma";
    }
    kayitlar.push({
      faz,
      ts: m.grup[0].ts,
      bitisTs: m.grup[m.grup.length - 1].ts,
      olaySayisi: m.grup.length,
      aciklama: fazAciklama(faz, m.grup, ipler.length),
      ipler,
      baskinVerdict: baskin(m.grup.map((e) => e.verdict)) ?? "allowed",
    });
  };

  for (const e of sirali) {
    const faz = olayFazi(e);
    if (mevcut && mevcut.faz === faz) {
      mevcut.grup.push(e);
    } else {
      if (mevcut) kapat(mevcut);
      mevcut = { faz, grup: [e] };
    }
  }
  if (mevcut) kapat(mevcut);
  return kayitlar;
}

/** Katılımcı IP'lerin listesini, katılma (ilk görülme) sırasına göre kurar. */
function katilimcilariKur(olaylar: TunelOlay[]): Katilimci[] {
  const grup = new Map<string, TunelOlay[]>();
  for (const e of olaylar) {
    (grup.get(e.ip) ?? grup.set(e.ip, []).get(e.ip)!).push(e);
  }
  const liste: Katilimci[] = [];
  for (const [ip, evs] of grup) {
    const sirali = [...evs].sort((a, b) => a.ts - b.ts);
    const kotu = sirali.filter((e) => KOTU_VERDICT.has(e.verdict)).length;
    liste.push({
      ip,
      country: sirali[0].country,
      asn: sirali[0].asn,
      ilkGorulme: sirali[0].ts,
      sonGorulme: sirali[sirali.length - 1].ts,
      olaySayisi: sirali.length,
      ilkFaz: olayFazi(sirali[0]),
      engelOrani: kotu / Math.max(1, sirali.length),
    });
  }
  // Katılma sırasına göre (ilk gelen önce).
  liste.sort((a, b) => a.ilkGorulme - b.ilkGorulme);
  return liste;
}

/** Savunma yanıtı kırılımını hesaplar. */
function savunmaKur(olaylar: TunelOlay[]): SavunmaYaniti {
  let engellenen = 0;
  let dogrulanan = 0;
  let izin = 0;
  let isaretlenen = 0;
  let ilkTepkiTs: number | null = null;
  for (const e of olaylar) {
    if (e.verdict === "blocked") engellenen++;
    else if (e.verdict === "challenged") dogrulanan++;
    else if (e.verdict === "flagged") isaretlenen++;
    else izin++;
    if ((e.verdict === "blocked" || e.verdict === "challenged") && (ilkTepkiTs === null || e.ts < ilkTepkiTs)) {
      ilkTepkiTs = e.ts;
    }
  }
  const toplam = olaylar.length || 1;
  return {
    engellenen,
    dogrulanan,
    izin,
    isaretlenen,
    ilkTepkiTs,
    mitigasyonOrani: (engellenen + dogrulanan + isaretlenen) / toplam,
  };
}

/** En yoğun dakika-kovasının orta ts'ini bulur (doruk anı). */
function dorukBul(olaylar: TunelOlay[]): number {
  if (!olaylar.length) return 0;
  const taban = olaylar.reduce((m, e) => Math.min(m, e.ts), Infinity);
  const kova = new Map<number, number>();
  for (const e of olaylar) {
    const k = Math.floor((e.ts - taban) / DORUK_KOVA_MS);
    kova.set(k, (kova.get(k) ?? 0) + 1);
  }
  let enIyiK = 0;
  let enCok = -1;
  for (const [k, n] of kova) {
    if (n > enCok) {
      enCok = n;
      enIyiK = k;
    }
  }
  return taban + enIyiK * DORUK_KOVA_MS + DORUK_KOVA_MS / 2;
}

/**
 * Otomatik adli anlatı özeti üretir (2-3 cümle).
 * "03:12'de RU'dan keşif başladı, 03:20'de /login'e kimlik doldurma,
 *  savunma 03:22'de devreye girdi ve %90'ını engelledi."
 */
export function anlatiUret(
  fazlar: FazKaydi[],
  katilimcilar: Katilimci[],
  savunma: SavunmaYaniti,
  olaySayisi: number,
): string {
  if (!fazlar.length) return "Yeniden kurulacak olay bulunamadı.";
  const cumleler: string[] = [];

  // 1) Açılış: ilk faz + ilk katılımcının ülkesi.
  const ilk = fazlar[0];
  const ilkUlke = katilimcilar[0]?.country ?? "bilinmeyen";
  cumleler.push(
    `${saatDk(ilk.ts)}'de ${ilkUlke} kaynaklı ${FAZ_ETIKET[ilk.faz].toLowerCase()} ile başladı`,
  );

  // 2) Tırmanış: erişim/veri-çıkarma fazı varsa vurgula.
  const tirmanis = fazlar.find((f) => f.faz === "erisim_denemesi" || f.faz === "veri_cikarma");
  if (tirmanis) {
    const ornekYol = baskin(tirmanis.ipler) ? undefined : undefined;
    void ornekYol;
    const eylem =
      tirmanis.faz === "erisim_denemesi" ? "kimlik doldurma denemeleri" : "veri çıkarma girişimleri";
    cumleler.push(`${saatDk(tirmanis.ts)}'de ${eylem} yoğunlaştı`);
  }

  // 3) Savunma yanıtı.
  if (savunma.ilkTepkiTs !== null) {
    const engelYuzde = Math.round(savunma.mitigasyonOrani * 100);
    cumleler.push(
      `savunma ${saatDk(savunma.ilkTepkiTs)}'de devreye girdi ve olayların %${engelYuzde}'ini durdurdu`,
    );
  } else {
    cumleler.push(`savunma bu incident'ta henüz tetiklenmedi`);
  }

  // Toplam hacim eki.
  const kapanis = `. Toplam ${olaySayisi} olay, ${katilimcilar.length} IP.`;
  return cumleler.join(", ") + kapanis;
}

/**
 * Tek bir korelasyondan (incident) tam TunelOlayi kurar.
 * Korelasyon yalnızca 5 örnek olay tutar; bu yüzden tam olay kümesini
 * ayrıca içeri veririz (`incidentOlaylar`).
 */
function tunelOlayiKur(kor: Korelasyon, incidentOlaylar: TunelOlay[]): TunelOlayi {
  const sirali = [...incidentOlaylar].sort((a, b) => a.ts - b.ts);
  const fazlar = fazlariKur(sirali);
  const katilimcilar = katilimcilariKur(sirali);
  const savunma = savunmaKur(sirali);
  const baslangic = sirali[0]?.ts ?? kor.ilkGorulme;
  const bitis = sirali[sirali.length - 1]?.ts ?? kor.sonGorulme;

  return {
    id: kor.id,
    baslik: kor.baslik,
    siddet: kor.siddet,
    baslangic,
    bitis,
    sureMs: Math.max(0, bitis - baslangic),
    fazlar,
    katilanIp: kor.benzersizIp,
    katilanAsn: kor.asnler.length,
    ulkeler: kor.ulkeler,
    asnler: kor.asnler,
    dorukTs: dorukBul(sirali),
    savunmaYaniti: savunma,
    katilimcilar,
    anlati: anlatiUret(fazlar, katilimcilar, savunma, sirali.length),
    olaySayisi: sirali.length,
    dominantBotClass: kor.dominantBotClass,
    // Scrubber için hafif olay dizisi (ts artan).
    olaylar: sirali,
  };
}

/* ------------------------------------------------------------------ Ana API */

/**
 * Ham olayları zaman-sıralı incident'lara gruplar ve her birini bir
 * kill-chain zaman tünelına yeniden kurar.
 *
 * Korelasyon motoru (korelasyonBul) olayları gruplar; ancak yalnızca ilk 5
 * örnek olayı tutar. Biz her korelasyonun TAM olay kümesini kendi grup
 * anahtarlarını (ip/asn/path + zaman kovası) yeniden hesaplayarak değil,
 * korelasyonun kimlik uzayına düşen olayları eşleştirerek toplarız:
 * korelasyonun ilkGorulme..sonGorulme penceresi + katılan IP/ASN/path
 * kümesine giren olaylar o incident'a atanır.
 */
export function saldiriZamanTuneli(olaylar: TunelOlay[]): TunelOlayi[] {
  if (!olaylar.length) return [];
  const korelasyonlar = korelasyonBul(olaylar);
  if (!korelasyonlar.length) return [];

  const sonuc: TunelOlayi[] = [];
  for (const kor of korelasyonlar) {
    // Bu korelasyona ait TAM olay kümesini topla: zaman penceresi içinde VE
    // korelasyonun IP kümesine (veya path kümesine) düşen olaylar.
    const ipSet = new Set<string>();
    for (const e of kor.ornekOlaylar) ipSet.add(e.ip);
    const pathSet = new Set(kor.pathler);
    const asnSet = new Set(kor.asnler);

    const incidentOlaylar = olaylar.filter((e) => {
      if (e.ts < kor.ilkGorulme || e.ts > kor.sonGorulme) return false;
      // Korelasyon türüne göre üyelik: örnek IP kümesi VEYA (aynı ASN + path)
      // kümesi. Bu, korelasyonKur'daki gruplama mantığını yansıtır.
      if (ipSet.has(e.ip)) return true;
      if (asnSet.has(e.asn) && pathSet.has(e.path)) return true;
      return false;
    });

    // Güvenlik: hiç olay eşleşmezse örnek olaylarla yetin (asla boş kalma).
    const kaynak = incidentOlaylar.length ? incidentOlaylar : kor.ornekOlaylar;
    sonuc.push(tunelOlayiKur(kor, kaynak));
  }

  // Şiddet (kritik→düşük) sonra hacim (çok→az) sırala — adli öncelik.
  const siddetSira: Record<string, number> = { kritik: 0, yuksek: 1, orta: 2, dusuk: 3 };
  sonuc.sort((a, b) => {
    const s = (siddetSira[a.siddet] ?? 9) - (siddetSira[b.siddet] ?? 9);
    return s !== 0 ? s : b.olaySayisi - a.olaySayisi;
  });
  return sonuc;
}

/**
 * Tüm olaylardan zaman-kovalı hacim serisi üretir (genel zaman çizelgesi /
 * scrubber grafiği için). Kovalar verdict'e göre renklendirilebilir olsun
 * diye engellenen/doğrulanan/izin ayrımıyla döner.
 *
 * @param kovaSayisi hedef kova sayısı (çözünürlük). En az 1.
 */
export function zamanKovalari(olaylar: TunelOlay[], kovaSayisi = 60): ZamanKovasi[] {
  if (!olaylar.length || kovaSayisi < 1) return [];
  const enErken = olaylar.reduce((m, e) => Math.min(m, e.ts), Infinity);
  const enGec = olaylar.reduce((m, e) => Math.max(m, e.ts), -Infinity);
  const aralik = Math.max(1, enGec - enErken);
  const genislik = aralik / kovaSayisi;

  const kovalar: ZamanKovasi[] = Array.from({ length: kovaSayisi }, (_, i) => ({
    ts: enErken + i * genislik,
    toplam: 0,
    engellenen: 0,
    dogrulanan: 0,
    izin: 0,
  }));

  for (const e of olaylar) {
    let idx = Math.floor((e.ts - enErken) / genislik);
    if (idx < 0) idx = 0;
    if (idx >= kovaSayisi) idx = kovaSayisi - 1;
    const k = kovalar[idx];
    k.toplam++;
    if (e.verdict === "blocked") k.engellenen++;
    else if (e.verdict === "challenged" || e.verdict === "flagged") k.dogrulanan++;
    else k.izin++;
  }
  return kovalar;
}

/* ------------------------------------------------------------------ Özet */

export interface TunelOzet {
  toplamIncident: number;
  kritik: number;
  /** Tüm incident'lardaki toplam benzersiz IP (yaklaşık — korelasyonlar ayrık). */
  toplamKatilimci: number;
  /** Ortalama incident süresi (ms). */
  ortSureMs: number;
  /** En sık görülen açılış fazı. */
  baskinAcilisFaz: Faz | null;
  /** Toplam mitigasyon oranı (engel+challenge / tüm incident olayları). */
  genelMitigasyon: number;
}

/** Incident listesinden üst-düzey özet metrikleri. */
export function tunelOzet(incidents: TunelOlayi[]): TunelOzet {
  if (!incidents.length) {
    return {
      toplamIncident: 0,
      kritik: 0,
      toplamKatilimci: 0,
      ortSureMs: 0,
      baskinAcilisFaz: null,
      genelMitigasyon: 0,
    };
  }
  const toplamKatilimci = incidents.reduce((a, i) => a + i.katilanIp, 0);
  const ortSureMs = Math.round(incidents.reduce((a, i) => a + i.sureMs, 0) / incidents.length);
  const acilislar = incidents.map((i) => i.fazlar[0]?.faz).filter(Boolean) as Faz[];
  const toplamOlay = incidents.reduce((a, i) => a + i.olaySayisi, 0) || 1;
  const kotu = incidents.reduce(
    (a, i) => a + i.savunmaYaniti.engellenen + i.savunmaYaniti.dogrulanan + i.savunmaYaniti.isaretlenen,
    0,
  );
  return {
    toplamIncident: incidents.length,
    kritik: incidents.filter((i) => i.siddet === "kritik").length,
    toplamKatilimci,
    ortSureMs,
    baskinAcilisFaz: baskin(acilislar) ?? null,
    genelMitigasyon: kotu / toplamOlay,
  };
}

/* ------------------------------------------------------------------ Biçim yardımcıları (UI ortak) */

export { saatDk, sureBicim };
