/**
 * Specter — Veri Saklama & KVKK/GDPR Silme Otomasyonu (saf/deterministik model)
 * =============================================================================
 * Bu modül, bir gizlilik-operasyonları konsolunun (OneTrust benzeri) çekirdek
 * iş mantığını SAF fonksiyonlarla modeller: veri kategorileri, kategori-başına
 * saklama süresi (gün), yasal dayanak notları (KVKK/GDPR), yaşlanma/silme
 * durumu ve veri-konusu silme talebi (DSR) yaşam döngüsü.
 *
 * SAFLIK KURALI: Bu dosyada `Date.now()`, `Math.random()` veya argümansız
 * `new Date()` YOKTUR. Zamana ihtiyaç duyan her fonksiyon `bugun` (epoch ms)
 * parametresini dışarıdan alır. Böylece test edilebilir ve deterministiktir.
 * Gerçek silme işleri sunucu tarafında zamanlanmış olarak koşar; bu modül
 * yalnızca politika/karar mantığını sağlar.
 */

/** Bir günün milisaniye karşılığı. */
export const GUN_MS = 86_400_000;

/** KVKK'nın veri-konusu (ilgili kişi) taleplerine yanıt SLA'sı: 30 gün. */
export const KVKK_SLA_GUN = 30;

/** Bir kategorideki bir kaydın saklama durumu. */
export type SaklamaDurum =
  | "saklamada" // süre içinde — dokunulmaz
  | "silinecek" // süreyi aştı — silinmeli
  | "anonimlestir"; // süreyi aştı ama anonimleştirme tercih edilmiş

/** DSR (veri-konusu talebi) türü. */
export type DsrTur = "silme" | "erisim" | "duzeltme";

/** DSR yaşam döngüsü durumu. */
export type DsrDurum = "alindi" | "isleniyor" | "tamamlandi" | "reddedildi";

/** Bir veri kategorisinin tanımı (varsayılan politika). */
export interface VeriKategori {
  /** Kararlı anahtar (localStorage + politika eşlemesi). */
  key: string;
  /** İnsan-okur ad. */
  ad: string;
  /** Kısa açıklama — bu kategoride ne tutuluyor. */
  aciklama: string;
  /** Varsayılan saklama süresi (gün). */
  varsayilanGun: number;
  /** Yasal dayanak notu (KVKK/GDPR). */
  yasalDayanak: string;
  /** Kişisel veri içeriyor mu (silme hakkı kapsamı). */
  kisiselVeri: boolean;
  /** Süre dolduğunda varsayılan eylem: silme mi anonimleştirme mi. */
  varsayilanEylem: "sil" | "anonimlestir";
  /** lucide ikon adı (UI çözer). */
  ikon: string;
  /** Vurgu rengi (UI). */
  renk: string;
}

/**
 * Veri kategorileri kataloğu — Specter'ın topladığı sinyal türleri.
 * Saklama süreleri veri-minimizasyonu ilkesine göre muhafazakâr tutulur.
 */
export const VERI_KATEGORILERI: VeriKategori[] = [
  {
    key: "olay-loglari",
    ad: "Olay Logları",
    aciklama: "Bot değerlendirme olayları (ziyaret, verdict, skor, tetiklenen kural).",
    varsayilanGun: 90,
    yasalDayanak: "KVKK m.5/2-f meşru menfaat · GDPR Art.6(1)(f) — güvenlik izleme",
    kisiselVeri: true,
    varsayilanEylem: "anonimlestir",
    ikon: "Activity",
    renk: "#2f6fed",
  },
  {
    key: "ip-adresleri",
    ad: "IP Adresleri",
    aciklama: "Ziyaretçi IP adresleri ve itibar sinyalleri (kişisel veri sayılır).",
    varsayilanGun: 30,
    yasalDayanak: "KVKK m.4 veri minimizasyonu · GDPR Art.5(1)(c) — amaçla sınırlılık",
    kisiselVeri: true,
    varsayilanEylem: "anonimlestir",
    ikon: "Globe",
    renk: "#dc2626",
  },
  {
    key: "davranis-verisi",
    ad: "Davranış Verisi",
    aciklama: "Fare/tuş biyometrisi, etkileşim sinyalleri, cihaz parmak izi.",
    varsayilanGun: 60,
    yasalDayanak: "KVKK m.4 amaçla bağlantılı · GDPR Art.5(1)(e) — saklama sınırlaması",
    kisiselVeri: true,
    varsayilanEylem: "sil",
    ikon: "Fingerprint",
    renk: "#7c3aed",
  },
  {
    key: "denetim-gunlugu",
    ad: "Denetim Günlüğü",
    aciklama: "Değişmez denetim kayıtları (hash zinciri) — kim, ne, ne zaman.",
    varsayilanGun: 365,
    yasalDayanak: "KVKK m.12 veri güvenliği · GDPR Art.30 — işleme kayıtları (yasal saklama)",
    kisiselVeri: false,
    varsayilanEylem: "sil",
    ikon: "FileCheck",
    renk: "#16a34a",
  },
  {
    key: "kullanim-sayaclari",
    ad: "Kullanım Sayaçları",
    aciklama: "Günlük toplu sayaçlar (issued/verified/blocked) — kişisel-veri-dışı, toplulaştırılmış.",
    varsayilanGun: 730,
    yasalDayanak: "GDPR Art.5(1)(b) — toplulaştırılmış istatistik, kişisel veri değil",
    kisiselVeri: false,
    varsayilanEylem: "sil",
    ikon: "Gauge",
    renk: "#0891b2",
  },
  {
    key: "uyarilar",
    ad: "Uyarılar / Olaylar",
    aciklama: "Güvenlik uyarıları ve olay (incident) kayıtları, timeline ile.",
    varsayilanGun: 180,
    yasalDayanak: "KVKK m.12 · GDPR Art.33 — ihlal kayıt tutma yükümlülüğü",
    kisiselVeri: true,
    varsayilanEylem: "anonimlestir",
    ikon: "Bell",
    renk: "#d97706",
  },
];

/** key → kategori (hızlı arama). */
export function kategoriBul(key: string): VeriKategori | undefined {
  return VERI_KATEGORILERI.find((k) => k.key === key);
}

/**
 * Bir kaydın saklama durumunu belirle.
 * @param kategori   ilgili veri kategorisi (varsayılanEylem'i belirler)
 * @param veriYasiGun kaydın yaşı (gün)
 * @param saklamaGun  bu kategori için yürürlükteki saklama süresi (gün)
 * @param eylem       süre aşımında uygulanacak eylem ("sil" | "anonimlestir");
 *                    verilmezse kategorinin varsayılanEylem'i kullanılır.
 */
export function saklamaDurumu(
  kategori: VeriKategori,
  veriYasiGun: number,
  saklamaGun: number,
  eylem?: "sil" | "anonimlestir",
): SaklamaDurum {
  // Süre içinde → dokunulmaz.
  if (veriYasiGun <= saklamaGun) return "saklamada";
  // Süre aşıldı → eylemi belirle.
  const uygulanacak = eylem ?? kategori.varsayilanEylem;
  return uygulanacak === "anonimlestir" ? "anonimlestir" : "silinecek";
}

/** Zamana bağlı olayın en az yaş (gün) taşıyan tek bir kaydı. */
export interface YasliKayit {
  /** Olayın zaman damgası (epoch ms). */
  ts: number;
}

/** `silmeTahmini` sonucu. */
export interface SilmeTahmini {
  /** Değerlendirilen toplam kayıt. */
  toplam: number;
  /** Saklama süresi içinde kalan (dokunulmayan) kayıt. */
  saklamada: number;
  /** Süreyi aşıp silinecek/anonimleştirilecek kayıt sayısı. */
  etkilenen: number;
  /** En eski kaydın yaşı (gün) — 0 kayıt varsa 0. */
  enEskiGun: number;
  /** Süre aşımına uygulanacak eylem (kategori kararı). */
  eylem: "sil" | "anonimlestir";
}

/**
 * Bir olay dizisi (kayıtlar) için saklama süresini aşan kaç kaydın
 * silineceğini/anonimleştirileceğini tahmin et. SAF: `bugun` dışarıdan verilir.
 * @param kayitlar  zaman-damgalı kayıtlar (ör. BotEvent[])
 * @param saklamaGun saklama süresi (gün)
 * @param bugun     referans an (epoch ms)
 * @param eylem     süre aşımı eylemi (bilgi amaçlı; sonuçta taşınır)
 */
export function silmeTahmini(
  kayitlar: YasliKayit[],
  saklamaGun: number,
  bugun: number,
  eylem: "sil" | "anonimlestir" = "sil",
): SilmeTahmini {
  const esikMs = bugun - saklamaGun * GUN_MS;
  let etkilenen = 0;
  let enEskiTs = bugun;
  for (const k of kayitlar) {
    if (k.ts < esikMs) etkilenen++;
    if (k.ts < enEskiTs) enEskiTs = k.ts;
  }
  const enEskiGun = kayitlar.length ? Math.max(0, Math.floor((bugun - enEskiTs) / GUN_MS)) : 0;
  return {
    toplam: kayitlar.length,
    saklamada: kayitlar.length - etkilenen,
    etkilenen,
    enEskiGun,
    eylem,
  };
}

/** Bir IPv4 adresini anonimleştir: son okteti sıfırla (185.220.101.34 → 185.220.101.0). */
export function ipAnonimlestir(ip: string): string {
  // IPv6 ise son segment grubunu maskele.
  if (ip.includes(":")) {
    const parcalar = ip.split(":");
    if (parcalar.length > 1) {
      parcalar[parcalar.length - 1] = "0";
      return parcalar.join(":");
    }
    return ip;
  }
  const oktet = ip.split(".");
  if (oktet.length === 4) {
    oktet[3] = "0";
    return oktet.join(".");
  }
  return ip;
}

/**
 * Bir tanımlayıcıyı (e-posta vb.) geri-döndürülemez şekilde kısa hash'e çevir.
 * Basit, bağımlılıksız FNV-1a türevi — kanıt/önizleme amaçlı deterministik
 * "psödonimleştirme". Gerçek anonimleştirme sunucuda güçlü hash ile yapılır.
 */
export function tanimlayiciHashle(deger: string): string {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < deger.length; i++) {
    h ^= deger.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  // İşaretsiz 32-bit → 8 haneli hex.
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `anon_${hex}`;
}

/** Bir DSR (veri-konusu silme/erişim talebi). */
export interface DsrTalep {
  id: string;
  /** Talep türü. */
  tur: DsrTur;
  /** Talep edilen tanımlayıcı (IP / e-posta). */
  tanimlayici: string;
  /** Mevcut durum. */
  durum: DsrDurum;
  /** Talebin alındığı an (epoch ms). */
  alindiTs: number;
  /** İşleme alındığı an (epoch ms | null). */
  islenmeTs: number | null;
  /** Tamamlandığı/reddedildiği an (epoch ms | null). */
  bitisTs: number | null;
  /** Serbest not (opsiyonel). */
  not?: string;
}

/** DSR SLA hesap sonucu. */
export interface DsrSla {
  /** Son yanıt tarihi (epoch ms) — alındıTs + 30 gün. */
  sonTarihTs: number;
  /** Bugüne göre kalan gün (negatif = gecikmiş). */
  kalanGun: number;
  /** SLA aşıldı mı. */
  gecikti: boolean;
  /** Talep sonuçlandı mı (tamamlandı/reddedildi). */
  kapali: boolean;
}

/**
 * Bir DSR talebi için KVKK 30-günlük SLA'sını hesapla. SAF: `bugun` dışarıdan.
 * Kapalı talepler (tamamlandı/reddedildi) için gecikme, bitiş anına göre ölçülür.
 */
export function dsrSla(talep: DsrTalep, bugun: number): DsrSla {
  const sonTarihTs = talep.alindiTs + KVKK_SLA_GUN * GUN_MS;
  const kapali = talep.durum === "tamamlandi" || talep.durum === "reddedildi";
  const kiyasAn = kapali && talep.bitisTs != null ? talep.bitisTs : bugun;
  const kalanMs = sonTarihTs - kiyasAn;
  const kalanGun = Math.ceil(kalanMs / GUN_MS);
  return {
    sonTarihTs,
    kalanGun,
    gecikti: kalanMs < 0,
    kapali,
  };
}

/**
 * Bir DSR talebini yeni bir duruma taşı (yaşam döngüsü geçişi). SAF: `bugun`
 * dışarıdan verilir; ilgili zaman damgaları set edilir. Geçersiz geçişlerde
 * talep değişmeden döner (deterministik, yan-etkisiz — yeni nesne üretir).
 *
 * İzinli geçişler:
 *   alindi → isleniyor
 *   isleniyor → tamamlandi | reddedildi
 *   alindi → reddedildi (doğrudan ret)
 */
export function dsrIsle(talep: DsrTalep, hedef: DsrDurum, bugun: number): DsrTalep {
  const izinli: Record<DsrDurum, DsrDurum[]> = {
    alindi: ["isleniyor", "reddedildi"],
    isleniyor: ["tamamlandi", "reddedildi"],
    tamamlandi: [],
    reddedildi: [],
  };
  if (!izinli[talep.durum].includes(hedef)) return talep;

  const yeni: DsrTalep = { ...talep, durum: hedef };
  if (hedef === "isleniyor") {
    yeni.islenmeTs = bugun;
  } else if (hedef === "tamamlandi" || hedef === "reddedildi") {
    // Doğrudan ret gelirse işlenme anı da damgalanır (izlenebilirlik).
    if (yeni.islenmeTs == null) yeni.islenmeTs = bugun;
    yeni.bitisTs = bugun;
  }
  return yeni;
}

/** Yeni bir DSR talebi üret (SAF: `bugun` + `yeniId` dışarıdan verilir). */
export function dsrOlustur(
  girdi: { tur: DsrTur; tanimlayici: string; not?: string },
  bugun: number,
  yeniId: string,
): DsrTalep {
  return {
    id: yeniId,
    tur: girdi.tur,
    tanimlayici: girdi.tanimlayici,
    durum: "alindi",
    alindiTs: bugun,
    islenmeTs: null,
    bitisTs: null,
    not: girdi.not,
  };
}

/** Bir kategori için sonraki otomatik çalışma anını hesapla (SAF). */
export function sonrakiCalisma(bugun: number, periyotGun = 1): number {
  return bugun + periyotGun * GUN_MS;
}
