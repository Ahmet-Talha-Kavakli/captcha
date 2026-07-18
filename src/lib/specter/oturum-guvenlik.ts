/**
 * Specter — Oturum Güvenliği & Token Yaşam Döngüsü (saf model)
 * ============================================================
 * Bu modül auth/token katmanının güvenlik-operasyon konsolunu besler.
 * TAMAMEN SAF'tır: hiçbir yerde Date.now / Math.random / argümansız
 * `new Date()` kullanılmaz — zaman ve sayaçlar dışarıdan (`now`, `usage`)
 * geçilir. Böylece deterministik test edilebilir ve sunucuda güvenle
 * çağrılabilir.
 *
 * İki ana kavram modellenir:
 *   1. Doğrulama-token yaşam döngüsü (verildi → doğrulandı → süre-doldu →
 *      tekrar-denendi/replay-engellendi) — Usage issued/verified hacminden
 *      temsili bir huni türetir.
 *   2. Güvenlik duruşu skoru — 2FA, oturum sınırı, kısa token TTL ve
 *      nonce/replay koruması gibi kontrollerin ağırlıklı toplamı.
 *
 * crypto.ts (READ-ONLY) modeli baz alınır: HMAC-SHA256 imzalı token,
 * `iat`/`exp` (TTL), tek-kullanımlık `nonce` (replay önleme). verify.ts'teki
 * DEFAULT_VERIFY_CONFIG.verificationTtl = 2 dk; challenge token TTL'i ise
 * kısa (temsili 5 dk) tutulur.
 */

/* ------------------------------------------------------------------ Sabitler */

/** Challenge commitment token'ının önerilen azami ömrü (ms) — kısa TTL iyi. */
export const ONERILEN_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 dk
/** Nonce tekrar-oynatma penceresi (ms) — bu süre içinde aynı nonce reddedilir. */
export const NONCE_PENCERE_MS = 5 * 60 * 1000;
/** Önerilen azami eşzamanlı oturum sayısı (üstü şüpheli sayılır). */
export const ONERILEN_MAX_OTURUM = 5;

/* ------------------------------------------------------------------ Token yaşam döngüsü */

/** Yaşam döngüsü aşama kimliği. */
export type YasamAsama =
  | "verildi" // token imzalanıp istemciye verildi
  | "dogrulandi" // HMAC + cevap + davranış geçti
  | "sure_doldu" // exp aşıldı, kullanılmadan
  | "replay_engellendi"; // tek-kullanımlık nonce ikinci kez denendi → reddedildi

/** Huninin tek bir aşaması (görselleştirme için). */
export interface HuniAsama {
  asama: YasamAsama;
  ad: string;
  aciklama: string;
  /** Bu aşamaya ulaşan token sayısı. */
  adet: number;
  /** İlk aşamaya (verildi) oranı, 0..1. */
  oran: number;
}

export interface TokenYasamDongusu {
  /** Toplam verilen (issued) token. */
  verilen: number;
  /** Başarıyla doğrulanan (verified). */
  dogrulanan: number;
  /** Doğrulanmadan süresi dolan (verilen - doğrulanan - replay). */
  sureDolan: number;
  /** Tek-kullanımlık nonce sayesinde engellenen tekrar-oynatma denemesi. */
  replayEngellenen: number;
  /** Doğrulama başarı oranı (dogrulanan / verilen), 0..1. */
  basariOrani: number;
  /** Görselleştirilebilir huni aşamaları. */
  huni: HuniAsama[];
}

/**
 * Usage issued/verified hacminden token yaşam döngüsü hunisini türetir.
 * replay-engellenen sayısı GERÇEK bir sayaç olmadığından temsilidir:
 * doğrulanan hacmin küçük, deterministik bir oranı olarak modellenir
 * (nonce yeniden-kullanım denemeleri seyrek ama gerçektir).
 *
 * @param issued  toplam verilen token (Usage.issued toplamı)
 * @param verified toplam doğrulanan token (Usage.verified toplamı)
 */
export function tokenYasamDongusu(issued: number, verified: number): TokenYasamDongusu {
  const verilen = Math.max(0, Math.round(issued));
  // doğrulanan verilen'i aşamaz (veri tutarlılığı).
  const dogrulanan = Math.min(verilen, Math.max(0, Math.round(verified)));
  // Temsili replay: doğrulananın binde-yedisi kadar (deterministik, ~%0.7).
  // Nonce tek-kullanımlık olduğu için bu denemeler DAİMA engellenir.
  const replayEngellenen = Math.round(dogrulanan * 0.007);
  const sureDolan = Math.max(0, verilen - dogrulanan - replayEngellenen);
  const basariOrani = verilen > 0 ? dogrulanan / verilen : 0;

  const oran = (n: number) => (verilen > 0 ? n / verilen : 0);
  const huni: HuniAsama[] = [
    {
      asama: "verildi",
      ad: "Verildi",
      aciklama: "HMAC-SHA256 ile imzalı challenge token istemciye gönderildi (iat/exp/nonce mühürlü).",
      adet: verilen,
      oran: 1,
    },
    {
      asama: "dogrulandi",
      ad: "Doğrulandı",
      aciklama: "İmza + ghost-font cevabı + davranış skoru geçti; imzalı verification token üretildi.",
      adet: dogrulanan,
      oran: oran(dogrulanan),
    },
    {
      asama: "sure_doldu",
      ad: "Süre doldu",
      aciklama: "Kullanılmadan exp (≈5 dk TTL) aşıldı; token artık geçersiz.",
      adet: sureDolan,
      oran: oran(sureDolan),
    },
    {
      asama: "replay_engellendi",
      ad: "Replay engellendi",
      aciklama: "Tek-kullanımlık nonce ikinci kez sunuldu; tekrar-oynatma reddedildi.",
      adet: replayEngellenen,
      oran: oran(replayEngellenen),
    },
  ];

  return { verilen, dogrulanan, sureDolan, replayEngellenen, basariOrani, huni };
}

/* ------------------------------------------------------------------ Güvenlik duruşu */

/** Duruş kontrolünün mevcut girdileri. */
export interface DurusGirdi {
  /** İki-adımlı doğrulama (2FA) etkin mi. */
  ikiAdimli: boolean;
  /** Aktif oturum sayısı, azami sınırı aşmıyor mu (bounded). */
  oturumSayisi: number;
  /** Uygulanan azami eşzamanlı oturum sınırı. */
  maxOturum: number;
  /** Challenge token TTL'i (ms) — kısa mı (≤ önerilen). */
  tokenTtlMs: number;
  /** Nonce tek-kullanımlık replay koruması açık mı. */
  nonceReplay: boolean;
  /** Yeni cihazda 2FA iste politikası açık mı. */
  yeniCihaz2fa: boolean;
  /** Şüpheli konumda oturumu askıya al politikası açık mı. */
  supheliKonumAskiya: boolean;
}

/** Tek bir duruş kontrolünün değerlendirmesi. */
export interface DurusKontrol {
  id: string;
  ad: string;
  aciklama: string;
  /** Kontrol karşılanıyor mu. */
  gecti: boolean;
  /** Skora katkı ağırlığı (puan). */
  agirlik: number;
  /** Öneri (geçmiyorsa gösterilir). */
  oneri: string;
}

export type DurusSeviye = "guclu" | "iyi" | "orta" | "zayif";

export interface GuvenlikDurusu {
  /** 0..100 duruş skoru. */
  skor: number;
  seviye: DurusSeviye;
  kontroller: DurusKontrol[];
  /** Karşılanan kontrol sayısı. */
  gecen: number;
  toplam: number;
}

/**
 * Auth/token katmanı için güvenlik duruşu skorunu (0..100) hesaplar.
 * Ağırlıkların toplamı 100'dür.
 */
export function guvenlikDurusu(g: DurusGirdi): GuvenlikDurusu {
  const kontroller: DurusKontrol[] = [
    {
      id: "twofa",
      ad: "İki adımlı doğrulama (2FA)",
      aciklama: "Hesap girişinde TOTP ikinci faktör isteniyor.",
      gecti: g.ikiAdimli,
      agirlik: 28,
      oneri: "Ayarlar → Güvenlik'ten TOTP 2FA'yı etkinleştir.",
    },
    {
      id: "oturum-sinir",
      ad: "Oturum sayısı sınırlı",
      aciklama: `Aktif eşzamanlı oturum, ${g.maxOturum} sınırının içinde.`,
      gecti: g.oturumSayisi <= g.maxOturum,
      agirlik: 16,
      oneri: "Eski/tanınmayan oturumları sonlandır ya da oturum sınırını düşür.",
    },
    {
      id: "token-ttl",
      ad: "Kısa token TTL",
      aciklama: "Challenge token ömrü kısa tutuluyor (yeniden-kullanım penceresi dar).",
      gecti: g.tokenTtlMs <= ONERILEN_TOKEN_TTL_MS,
      agirlik: 18,
      oneri: `Token TTL'ini ${Math.round(ONERILEN_TOKEN_TTL_MS / 60000)} dk veya altına indir.`,
    },
    {
      id: "nonce-replay",
      ad: "Nonce / replay koruması",
      aciklama: "Tek-kullanımlık nonce ile tekrar-oynatma engelleniyor.",
      gecti: g.nonceReplay,
      agirlik: 22,
      oneri: "Nonce tek-kullanımlık doğrulamasını aç (verify orkestratörü zaten destekler).",
    },
    {
      id: "yeni-cihaz-2fa",
      ad: "Yeni cihazda 2FA iste",
      aciklama: "Tanınmayan cihazdan giriş ek doğrulama tetikliyor.",
      gecti: g.yeniCihaz2fa,
      agirlik: 8,
      oneri: "Oturum politikasından 'yeni cihazda 2FA iste'yi aç.",
    },
    {
      id: "supheli-konum",
      ad: "Şüpheli konumda askıya al",
      aciklama: "Beklenmedik coğrafyadan oturum otomatik askıya alınıyor.",
      gecti: g.supheliKonumAskiya,
      agirlik: 8,
      oneri: "Oturum politikasından 'şüpheli konumda oturumu askıya al'ı aç.",
    },
  ];

  const skor = Math.round(
    kontroller.reduce((a, k) => a + (k.gecti ? k.agirlik : 0), 0),
  );
  const seviye: DurusSeviye =
    skor >= 90 ? "guclu" : skor >= 70 ? "iyi" : skor >= 45 ? "orta" : "zayif";
  const gecen = kontroller.filter((k) => k.gecti).length;

  return { skor, seviye, kontroller, gecen, toplam: kontroller.length };
}

/* ------------------------------------------------------------------ Oturum risk sınıfı */

export type OturumRisk = "dusuk" | "orta" | "yuksek";

/** Bir aktif oturumun risk sınıflandırma girdisi. */
export interface OturumRiskGirdi {
  /** Bu cihaz (mevcut oturum) mı — daima düşük risk kabul edilir. */
  buCihaz: boolean;
  /** Oturumun yaşı (ms) — çok eski oturum riski artırır. */
  yasMs: number;
  /** Konum beklenen coğrafyada mı (ör. TR). */
  bilinenKonum: boolean;
  /** Cihaz daha önce görüldü mü (tanıdık parmak izi). */
  bilinenCihaz: boolean;
}

export interface OturumRiskSonuc {
  risk: OturumRisk;
  /** İnsan-okur risk nedenleri. */
  nedenler: string[];
}

/** Otuz gün — "eski oturum" eşiği. */
const ESKI_OTURUM_MS = 30 * 86400000;

/**
 * Bir aktif oturumu risk seviyesine göre sınıflandırır (deterministik).
 * Bu cihaz daima düşük; aksi halde bilinmeyen konum/cihaz ve yaş puanlanır.
 */
export function oturumRiski(g: OturumRiskGirdi): OturumRiskSonuc {
  if (g.buCihaz) {
    return { risk: "dusuk", nedenler: ["Mevcut oturum (bu cihaz)"] };
  }
  const nedenler: string[] = [];
  let puan = 0;
  if (!g.bilinenKonum) {
    puan += 2;
    nedenler.push("Tanınmayan konum");
  }
  if (!g.bilinenCihaz) {
    puan += 2;
    nedenler.push("Tanınmayan cihaz parmak izi");
  }
  if (g.yasMs > ESKI_OTURUM_MS) {
    puan += 1;
    nedenler.push("Uzun süredir açık oturum (30 gün+)");
  }
  if (nedenler.length === 0) nedenler.push("Bilinen cihaz ve konum");

  const risk: OturumRisk = puan >= 3 ? "yuksek" : puan >= 1 ? "orta" : "dusuk";
  return { risk, nedenler };
}
