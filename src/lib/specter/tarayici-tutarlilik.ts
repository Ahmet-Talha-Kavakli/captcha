/**
 * Specter — Tarayıcı Tutarlılık Doğrulama (Browser Consistency Verification)
 * ==========================================================================
 * Bir bot, User-Agent başlığını "Chrome 121 / Windows" diye YALAN söyleyebilir —
 * ama gerçekten Chrome ise, JavaScript ortamı da Chrome'un imzasını taşımalıdır.
 * Bu motor, UA'nın İDDİA ettiği tarayıcı/OS ile istemciden toplanan GERÇEK JS
 * sinyallerini çapraz-doğrular. Uyuşmazlık = güçlü spoofing kanıtı.
 *
 * Ghost-font'un tamamlayıcısı: ghost-font "insan mı okuyor?" der; bu motor
 * "iddia ettiğin tarayıcı gerçekten sen misin?" der. İkisi birlikte hem
 * insan-olmayan hem de kimliğini-gizleyen trafiği yakalar.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi sinyallerden.
 */

/** İstemciden (widget) toplanan tarayıcı ortam sinyalleri. */
export interface TarayiciSinyal {
  /** UA başlığının kendisi (iddia). */
  ua: string;
  /** navigator.webdriver — otomasyon açık bayrağı. */
  webdriver?: boolean;
  /** navigator.hardwareConcurrency (CPU çekirdek — 0/undefined şüpheli). */
  hardwareConcurrency?: number;
  /** navigator.deviceMemory (GB — Chrome'da var, Firefox/Safari'de yok). */
  deviceMemory?: number;
  /** navigator.languages dizisi uzunluğu (boş = şüpheli). */
  dilSayisi?: number;
  /** navigator.plugins.length (headless=0 tipik). */
  eklentiSayisi?: number;
  /** window.chrome nesnesi var mı (Chrome/Edge'de true olmalı). */
  chromeNesnesi?: boolean;
  /** WebGL üreticisi (SwiftShader/llvmpipe = yazılım render = headless işareti). */
  webglSaticisi?: string;
  /** AudioContext örnekleme oranı (headless'te sıklıkla eksik/0). */
  sesOrnekOrani?: number;
  /** window.devicePixelRatio (0 = şüpheli). */
  pikselOrani?: number;
  /** Dokunmatik olay desteği (maxTouchPoints>0). */
  dokunmatik?: boolean;
  /** Bildirim izni durumu ("denied" + headless imzası ilginç değil ama "default" beklenir). */
  bildirimIzni?: string;
  /** Permissions API tutarsızlığı (headless'te notification "denied" ama Notification.permission "default"). */
  izinTutarsiz?: boolean;
}

export type TarayiciAile = "chrome" | "firefox" | "safari" | "edge" | "opera" | "bilinmeyen";
export type IsletimSistemi = "windows" | "macos" | "linux" | "android" | "ios" | "bilinmeyen";

/** UA dizesinden iddia edilen tarayıcı ailesini çıkarır. */
export function uaAilesi(ua: string): TarayiciAile {
  const u = ua.toLowerCase();
  if (u.includes("edg/") || u.includes("edge")) return "edge";
  if (u.includes("opr/") || u.includes("opera")) return "opera";
  if (u.includes("firefox")) return "firefox";
  // Chrome kontrolü Safari'den ÖNCE (Chrome UA'sı "Safari" de içerir)
  if (u.includes("chrome") || u.includes("crios")) return "chrome";
  if (u.includes("safari")) return "safari";
  return "bilinmeyen";
}

/** UA dizesinden iddia edilen işletim sistemini çıkarır. */
export function uaOS(ua: string): IsletimSistemi {
  const u = ua.toLowerCase();
  if (u.includes("android")) return "android";
  if (u.includes("iphone") || u.includes("ipad") || u.includes("ios")) return "ios";
  if (u.includes("windows")) return "windows";
  if (u.includes("mac os") || u.includes("macintosh")) return "macos";
  if (u.includes("linux")) return "linux";
  return "bilinmeyen";
}

/** Tek bir tutarlılık kontrolünün sonucu. */
export interface TutarlilikKontrol {
  /** Kontrol kimliği (i18n key fragmanı olarak da kullanılır). */
  id: string;
  /** İnsan-okur ad (TR — UI i18n bunu key ile çevirir). */
  ad: string;
  /** Geçti mi (tutarlı mı). */
  gecti: boolean;
  /** Bu kontrolün önem ağırlığı (uyuşmazlık cezası). */
  agirlik: number;
  /** Ne beklendi / ne bulundu (kanıt). */
  detay: string;
  /** Kanıt gücü: kritik uyuşmazlık mı yoksa zayıf sinyal mi. */
  kritik: boolean;
}

export interface TutarlilikSonuc {
  ailesi: TarayiciAile;
  os: IsletimSistemi;
  kontroller: TutarlilikKontrol[];
  /** Tutarlılık skoru 0-100 (100 = tam tutarlı, düşük = spoofing). */
  skor: number;
  /** Toplam uyuşmazlık ağırlığı. */
  uyusmazlik: number;
  /** Karar: tutarlı / şüpheli / sahte. */
  karar: "tutarli" | "supheli" | "sahte";
  /** En güçlü spoofing kanıtı (varsa). */
  enGucluKanit: string | null;
}

/**
 * UA iddiasını istemci JS sinyalleriyle çapraz-doğrular.
 */
export function tarayiciTutarlilik(s: TarayiciSinyal): TutarlilikSonuc {
  const ailesi = uaAilesi(s.ua);
  const os = uaOS(s.ua);
  const k: TutarlilikKontrol[] = [];

  const ekle = (id: string, ad: string, gecti: boolean, agirlik: number, detay: string, kritik = false) =>
    k.push({ id, ad, gecti, agirlik, detay, kritik });

  // 1) webdriver bayrağı — açıkça otomasyon
  ekle(
    "webdriver", "Otomasyon bayrağı (webdriver)",
    s.webdriver !== true, 40,
    s.webdriver === true ? "navigator.webdriver=true — otomasyon araç açıkça bildirildi" : "webdriver bayrağı yok",
    s.webdriver === true,
  );

  // 2) Chrome/Edge iddiası → window.chrome nesnesi olmalı
  if (ailesi === "chrome" || ailesi === "edge") {
    ekle(
      "chrome-nesnesi", "Chrome runtime nesnesi",
      s.chromeNesnesi !== false, 25,
      s.chromeNesnesi === false ? `UA "${ailesi}" diyor ama window.chrome nesnesi yok — sahte Chrome` : "window.chrome mevcut",
      s.chromeNesnesi === false,
    );
    // Chrome → deviceMemory API'si olmalı (Chrome'a özgü)
    ekle(
      "device-memory", "deviceMemory API (Chrome'a özgü)",
      s.deviceMemory !== undefined && s.deviceMemory > 0, 15,
      s.deviceMemory === undefined || s.deviceMemory === 0 ? "Chrome iddiası ama navigator.deviceMemory yok" : `deviceMemory=${s.deviceMemory}GB`,
    );
  }

  // 3) Firefox/Safari iddiası → deviceMemory OLMAMALI (Chrome'a özgü API)
  if (ailesi === "firefox" || ailesi === "safari") {
    ekle(
      "device-memory-yok", "deviceMemory yokluğu (Firefox/Safari)",
      s.deviceMemory === undefined || s.deviceMemory === 0, 20,
      s.deviceMemory && s.deviceMemory > 0 ? `UA "${ailesi}" diyor ama Chrome'a özgü deviceMemory=${s.deviceMemory} var — sahte` : "deviceMemory yok (beklenen)",
      !!(s.deviceMemory && s.deviceMemory > 0),
    );
  }

  // 4) WebGL yazılım-render tespiti (headless göstergesi)
  if (s.webglSaticisi) {
    const yazilim = /swiftshader|llvmpipe|software|mesa/i.test(s.webglSaticisi);
    ekle(
      "webgl-render", "WebGL donanım render",
      !yazilim, 30,
      yazilim ? `WebGL yazılım render (${s.webglSaticisi}) — headless/sanal ortam işareti` : `WebGL donanım: ${s.webglSaticisi}`,
      yazilim,
    );
  }

  // 5) hardwareConcurrency makul mü (0 = şüpheli, >32 = maskeleme)
  if (s.hardwareConcurrency !== undefined) {
    const makul = s.hardwareConcurrency >= 1 && s.hardwareConcurrency <= 64;
    ekle(
      "cpu-cekirdek", "CPU çekirdek sayısı makul",
      makul, 15,
      makul ? `${s.hardwareConcurrency} çekirdek` : `hardwareConcurrency=${s.hardwareConcurrency} — anormal (0 veya maskelenmiş)`,
    );
  }

  // 6) navigator.languages boş olmamalı (headless'te sık boş)
  ekle(
    "dil-listesi", "Dil tercihi listesi",
    (s.dilSayisi ?? 0) > 0, 15,
    (s.dilSayisi ?? 0) === 0 ? "navigator.languages boş — headless işareti" : `${s.dilSayisi} dil tercihi`,
  );

  // 7) Eklenti sayısı — masaüstü Chrome/Firefox'ta genelde >0; headless=0
  if (ailesi === "chrome" || ailesi === "firefox" || ailesi === "edge") {
    if (os === "windows" || os === "macos" || os === "linux") {
      ekle(
        "eklenti", "Tarayıcı eklentileri",
        (s.eklentiSayisi ?? 0) > 0, 10,
        (s.eklentiSayisi ?? 0) === 0 ? "Masaüstü tarayıcı ama plugins boş — headless olabilir" : `${s.eklentiSayisi} eklenti`,
      );
    }
  }

  // 8) devicePixelRatio > 0 olmalı
  ekle(
    "piksel-orani", "Ekran piksel oranı",
    (s.pikselOrani ?? 0) > 0, 12,
    (s.pikselOrani ?? 0) === 0 ? "devicePixelRatio=0 — gerçek ekran yok (headless)" : `devicePixelRatio=${s.pikselOrani}`,
  );

  // 9) AudioContext örnekleme oranı (gerçek tarayıcıda 44100/48000)
  if (s.sesOrnekOrani !== undefined) {
    const gecerli = s.sesOrnekOrani >= 8000;
    ekle(
      "ses-orani", "Ses bağlamı örnekleme oranı",
      gecerli, 10,
      gecerli ? `${s.sesOrnekOrani}Hz` : "AudioContext örnekleme oranı geçersiz/eksik — headless",
    );
  }

  // 10) Mobil OS + dokunmatik tutarlılığı
  if (os === "android" || os === "ios") {
    ekle(
      "dokunmatik", "Mobil dokunmatik desteği",
      s.dokunmatik !== false, 12,
      s.dokunmatik === false ? `UA mobil (${os}) diyor ama dokunmatik yok — masaüstü emülasyonu` : "dokunmatik mevcut",
    );
  }

  // 11) Permissions API tutarsızlığı (headless Chrome imzası)
  if (s.izinTutarsiz) {
    ekle(
      "izin-tutarsiz", "İzin API tutarlılığı",
      false, 20,
      "Notification.permission ile Permissions API çelişiyor — headless Chrome imzası",
      true,
    );
  }

  const toplamAgirlik = k.reduce((a, c) => a + c.agirlik, 0) || 1;
  const uyusmazlik = k.filter((c) => !c.gecti).reduce((a, c) => a + c.agirlik, 0);
  let skor = Math.round(Math.max(0, 100 - (uyusmazlik / toplamAgirlik) * 100));

  // KRİTİK uyuşmazlık (ör. UA-JS çelişkisi, deviceMemory sızıntısı, webdriver) tek
  // başına spoofing KANITIdır — genel skor yüksek olsa bile tavanı düşür. Her kritik
  // başarısızlık skoru en fazla 45'e (şüpheli) kilitler; bu, tek bir güçlü kanıtın
  // düzinelerce zayıf "geçti" tarafından örtülmesini engeller.
  const kritikSayi = k.filter((c) => !c.gecti && c.kritik).length;
  if (kritikSayi > 0) skor = Math.min(skor, kritikSayi >= 2 ? 25 : 45);

  const karar: TutarlilikSonuc["karar"] =
    skor >= 80 ? "tutarli" : skor >= 50 ? "supheli" : "sahte";

  // En güçlü kanıt: geçemeyen kritik kontrollerden en ağırı
  const kritikBasarisiz = k.filter((c) => !c.gecti && c.kritik).sort((a, b) => b.agirlik - a.agirlik);
  const enGucluKanit = kritikBasarisiz.length ? kritikBasarisiz[0].detay : null;

  return { ailesi, os, kontroller: k, skor, uyusmazlik, karar, enGucluKanit };
}

export const KARAR_RENK: Record<TutarlilikSonuc["karar"], string> = {
  tutarli: "#16a34a", supheli: "#d97706", sahte: "#dc2626",
};

/* ------------------------------------------------------- Toplu olay analizi */
import type { BotEvent } from "@/lib/db/schema";

export interface TutarlilikDagilim {
  /** UA aile bazında sayım (iddia edilen). */
  aileler: { aile: TarayiciAile; sayi: number; sahte: number }[];
  toplam: number;
  tutarli: number;
  supheli: number;
  sahte: number;
  /** En sık spoofing edilen tarayıcı ailesi. */
  enCokSahteAile: TarayiciAile | null;
  /** UA-TLS uyumsuzluğu bildirilen olay sayısı (schema alanı). */
  tlsUaUyumsuz: number;
  /** Headless imzalı olay sayısı. */
  headless: number;
}

/**
 * Gözlemlenen olaylardan tarayıcı-tutarlılık dağılımını çıkarır. Gerçek istemci
 * JS sinyalleri olay kaydında saklanmadığından (sadece türetilmiş bayraklar), bu
 * analiz olayın `headless`/`tlsUaUyumsuz`/`automationFlags`/`botClass` bayraklarını
 * UA-iddiasıyla birleştirip tutarlılık kararını YENİDEN türetir. UI'da "gözlemlenen
 * trafikten türetilmiş" olarak dürüstçe etiketlenir.
 */
export function tutarlilikAnaliz(events: BotEvent[]): TutarlilikDagilim {
  const aileSay = new Map<TarayiciAile, { sayi: number; sahte: number }>();
  let tutarli = 0, supheli = 0, sahte = 0, tlsUaUyumsuz = 0, headless = 0;

  for (const e of events) {
    const aile = uaAilesi(e.ua);
    const kayit = aileSay.get(aile) ?? { sayi: 0, sahte: 0 };
    kayit.sayi++;

    // Karar: olay bayraklarından türet — TLS/UA uyumsuz veya headless veya
    // automation bayrağı = güçlü tutarsızlık; düşük skor + otomasyon sınıfı = şüpheli.
    const tls = e.tlsUaUyumsuz === true;
    const hless = e.headless === true;
    const oto = (e.automationFlags?.length ?? 0) > 0;
    if (tls) tlsUaUyumsuz++;
    if (hless) headless++;

    if (tls || hless) {
      sahte++;
      kayit.sahte++;
    } else if (oto || (e.botClass === "automation" || e.botClass === "scraper") && e.score < 0.3) {
      supheli++;
    } else {
      tutarli++;
    }
    aileSay.set(aile, kayit);
  }

  const aileler = [...aileSay.entries()]
    .map(([aile, v]) => ({ aile, sayi: v.sayi, sahte: v.sahte }))
    .sort((a, b) => b.sayi - a.sayi);

  const enCokSahteAile = [...aileSay.entries()]
    .filter(([, v]) => v.sahte > 0)
    .sort((a, b) => b[1].sahte - a[1].sahte)[0]?.[0] ?? null;

  return {
    aileler, toplam: events.length, tutarli, supheli, sahte,
    enCokSahteAile, tlsUaUyumsuz, headless,
  };
}
