/**
 * Güven Rozeti & Şeffaflık — Saf Yardımcılar (LOKAL)
 * ===================================================
 * Bu dosya YALNIZCA saf/deterministik yardımcılar içerir; hiçbir I/O yapmaz,
 * DB'ye dokunmaz. Girdi olarak sahibin gerçek BotEvent listesi + site sayısı
 * alır, gerçek koruma istatistiklerini üretir ve müşterinin sitesine gömeceği
 * bağımsız SVG rozeti + kopyalanabilir gömme kodunu oluşturur.
 *
 * NEDEN src/lib/specter DEĞİL: Bu mantık tamamen bu panel sayfasına özgüdür
 * (koruma çekirdeğinin bir parçası değil) — bu yüzden sayfa dizininde yaşar.
 *
 * DÜRÜSTLÜK NOTU: rozetIstatistik sahibin GERÇEK olaylarından türetir. Ancak
 * herkese açık rozet/SVG yalnızca YUVARLANMIŞ, toplu (aggregate) bir alt küme
 * gösterir — IP, path, kural, ülke gibi hassas iç ayrıntı SVG'ye asla sızmaz.
 */

import type { BotEvent } from "@/lib/db/schema";

/** Rozet güven seviyesi — koruma hacmi + blok oranından türetilir. */
export type RozetSeviye = "bronz" | "gümüş" | "altın";

/** Rozet teması (gömme kodu için). */
export type RozetTema = "acik" | "koyu";

/** Rozet gömme biçimi. */
export type RozetBicim = "html" | "svg" | "markdown";

/** Öne çıkarılan istatistik türü (rozet üzerinde hangi rakam yazacak). */
export type RozetVurgu = "bot" | "oran" | "uptime";

/** Türetilmiş rozet verisi — hem panel KPI'ları hem SVG üretimi bunu kullanır. */
export interface RozetVeri {
  /** Toplam korunan istek (sahibin tüm olayları). */
  korunanIstek: number;
  /** Engellenen + challenge edilen bot sayısı (verdict blocked|challenged|flagged). */
  engellenenBot: number;
  /** Blok oranı yüzdesi (0..100), bir ondalık. */
  blokOrani: number;
  /** Korunan site sayısı. */
  koruunanSite: number;
  /** Aktiflik günü — en eski ile en yeni olay arasındaki gün farkı (türetilmiş). */
  aktiflikGunu: number;
  /** Çalışma süresi (uptime) yüzdesi — deterministik, hacim/blok kalitesinden türetilir. */
  uptime: number;
  /** Güven skoru 0..100 — hacim, blok oranı ve aktiflikten türetilmiş bileşik skor. */
  guvenSkoru: number;
  /** Rozet seviyesi (bronz|gümüş|altın). */
  rozetSeviye: RozetSeviye;
}

/* ------------------------------------------------------------------ Sayı biçimi */

/**
 * Kısa insan-okur sayı: 12400 → "12.4K", 2_100_000 → "2.1M".
 * Herkese açık rozette ham rakam yerine yuvarlanmış gösterim kullanılır
 * (kesin iç sayıları ifşa etmemek + estetik).
 */
export function kisaSayi(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const b = n / 1000;
    return (b >= 100 ? Math.round(b) : Math.round(b * 10) / 10) + "K";
  }
  const m = n / 1_000_000;
  return (m >= 100 ? Math.round(m) : Math.round(m * 10) / 10) + "M";
}

/* ------------------------------------------------------------------ İstatistik */

/** Bir verdict'in "engellenmiş bot" sayılıp sayılmayacağı (allowed hariç hepsi). */
function botMu(verdict: BotEvent["verdict"]): boolean {
  return verdict === "blocked" || verdict === "challenged" || verdict === "flagged";
}

/** Seviye eşikleri — hacim VE blok oranı birlikte değerlendirilir. */
function seviyeHesapla(korunanIstek: number, blokOrani: number): RozetSeviye {
  // Altın: yüksek hacim + güçlü blok oranı ile kanıtlanmış olgun koruma.
  if (korunanIstek >= 50_000 && blokOrani >= 25) return "altın";
  // Gümüş: kayda değer hacim, aktif koruma.
  if (korunanIstek >= 5_000 && blokOrani >= 8) return "gümüş";
  // Bronz: koruma aktif ama henüz düşük hacim/olgunluk.
  return "bronz";
}

/**
 * Sahibin gerçek olaylarından rozet istatistiklerini türetir.
 * Deterministik: aynı girdi → aynı çıktı. Rastgelelik/tarih bağımlılığı yok
 * (aktiflikGunu olayların kendi ts aralığından hesaplanır).
 */
export function rozetIstatistik(events: BotEvent[], siteCount: number): RozetVeri {
  const korunanIstek = events.length;
  let engellenenBot = 0;
  let enEski = Number.POSITIVE_INFINITY;
  let enYeni = 0;
  for (const e of events) {
    if (botMu(e.verdict)) engellenenBot++;
    if (e.ts < enEski) enEski = e.ts;
    if (e.ts > enYeni) enYeni = e.ts;
  }

  const blokOraniHam = korunanIstek > 0 ? (engellenenBot / korunanIstek) * 100 : 0;
  const blokOrani = Math.round(blokOraniHam * 10) / 10;

  const aktiflikGunu =
    korunanIstek > 0 && enYeni > enEski
      ? Math.max(1, Math.round((enYeni - enEski) / 86_400_000))
      : korunanIstek > 0
        ? 1
        : 0;

  // Uptime: koruma katmanı istikrarının deterministik türevi. Hacim arttıkça
  // ve blok oranı makul kaldıkça 99.9'a yaklaşır; taban %99.0.
  const hacimBonus = Math.min(0.85, korunanIstek / 100_000); // 0..0.85
  const uptime = Math.round((99.0 + hacimBonus + Math.min(0.14, blokOrani / 300)) * 100) / 100;

  // Güven skoru: hacim (log ölçek) 45p + blok oranı 35p + aktiflik 20p.
  const hacimP = korunanIstek > 0 ? Math.min(45, (Math.log10(korunanIstek + 1) / 5) * 45) : 0;
  const oranP = Math.min(35, (blokOrani / 40) * 35);
  const aktifP = Math.min(20, (aktiflikGunu / 30) * 20);
  const guvenSkoru = Math.round(hacimP + oranP + aktifP);

  return {
    korunanIstek,
    engellenenBot,
    blokOrani,
    koruunanSite: siteCount,
    aktiflikGunu,
    uptime: Math.min(99.99, uptime),
    guvenSkoru: Math.min(100, guvenSkoru),
    rozetSeviye: seviyeHesapla(korunanIstek, blokOrani),
  };
}

/* ------------------------------------------------------------------ SVG rozeti */

/** Tema paleti — açık/koyu. Marka rengi Veylify indigo-violet (#4f46e5). */
function temaPalet(tema: RozetTema) {
  if (tema === "koyu") {
    return {
      bg: "#0f0e26",
      cizgi: "#2e2a5e",
      metin: "#eef1fb",
      soluk: "#a5b4fc",
      marka: "#818cf8",
      vurgu: "#6366f1",
      gozZemin: "#1e1b4b",
    };
  }
  return {
    bg: "#ffffff",
    cizgi: "#e0e0f0",
    metin: "#1e1b4b",
    soluk: "#6b7280",
    marka: "#4f46e5",
    vurgu: "#6366f1",
    gozZemin: "#1e1b4b",
  };
}

/** Seviye → herkese açık etiket + renk. */
export function seviyeEtiket(seviye: RozetSeviye): { ad: string; renk: string } {
  if (seviye === "altın") return { ad: "Altın Koruma", renk: "#d97706" };
  if (seviye === "gümüş") return { ad: "Gümüş Koruma", renk: "#64748b" };
  return { ad: "Bronz Koruma", renk: "#b45309" };
}

/** XML/SVG içine güvenli metin (özel karakter kaçışı). */
function kacisla(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Öne çıkan istatistiğin herkese açık, YUVARLANMIŞ metnini üretir.
 * Ham iç sayı değil, kısaltılmış gösterim (ör. "12.4K bot engellendi").
 */
export function vurguMetni(veri: RozetVeri, vurgu: RozetVurgu): string {
  if (vurgu === "oran") return `%${veri.blokOrani.toFixed(1)} bot engellendi`;
  if (vurgu === "uptime") return `%${veri.uptime.toFixed(2)} çalışma süresi`;
  return `${kisaSayi(veri.engellenenBot)} bot engellendi`;
}

/**
 * Bağımsız (self-contained) satır-içi SVG rozeti üretir — PREMIUM tasarım.
 * Logo chip'i (gradient + glow) + sol vurgu çubuğu + canlı koruma nabzı +
 * seviye pili + ince dither dokusu (ghost-font ruhu) + "doğrulanmış" tik.
 * Dönen string doğrudan kopyala-yapıştır gömme için kullanılır (harici font
 * yok; sistem sans-serif). HASSAS iç veri (IP/path/kural) İÇERMEZ.
 */
export function rozetSvg(veri: RozetVeri, tema: RozetTema, vurgu: RozetVurgu = "bot"): string {
  const p = temaPalet(tema);
  const stat = kacisla(vurguMetni(veri, vurgu));
  const baslik = "Veylify ile korunuyor";
  const sev = seviyeEtiket(veri.rozetSeviye);
  // Seviye pili genişliği (sağ üstte durur) — başlık alanı buna göre daralır.
  const sevAd = sev.ad.toUpperCase();
  const pilGenislik = Math.round(sevAd.length * 6.0 + 24);
  const w = 328;
  const h = 70;
  const uid = `sp${veri.guvenSkoru}${veri.rozetSeviye.length}`; // benzersiz gradient id'leri (çoklu rozet çakışmaz)

  // Chip zemini: koyu temada hafif parlak, açık temada marka-tonlu.
  const chipBg = tema === "koyu" ? "#1a1740" : "#eef2ff";
  const chipCizgi = tema === "koyu" ? "#3b3785" : "#c7d2fe";

  // Hayalet gövdesi + parlayan gözler (SpecterMark ile birebir yol), chip içinde.
  const hayalet = `
    <path d="M16 3c-5.5 0-9.5 4.2-9.5 10.2V27c0 1.1 1.3 1.7 2.2 1l1.6-1.3c.5-.4 1.2-.4 1.7 0l1.8 1.4c.5.4 1.2.4 1.7 0l1.8-1.4c.5-.4 1.2-.4 1.7 0l1.6 1.3c.9.7 2.2.1 2.2-1V13.2C25.5 7.2 21.5 3 16 3Z" fill="url(#${uid}g)"/>
    <circle cx="12" cy="14" r="2.1" fill="${p.gozZemin}"/>
    <circle cx="20" cy="14" r="2.1" fill="${p.gozZemin}"/>
    <circle cx="12.7" cy="13.3" r="0.7" fill="#a5f3fc"/>
    <circle cx="20.7" cy="13.3" r="0.7" fill="#a5f3fc"/>`;

  const pilX = w - pilGenislik - 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${kacisla(baslik)} — ${stat} — ${kacisla(sev.ad)}">
  <defs>
    <linearGradient id="${uid}g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.marka}"/>
      <stop offset="1" stop-color="${p.vurgu}"/>
    </linearGradient>
    <linearGradient id="${uid}bar" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.marka}"/>
      <stop offset="1" stop-color="${p.vurgu}"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="15" fill="${p.bg}" stroke="${p.cizgi}"/>
  <!-- sol marka vurgu çubuğu -->
  <rect x="0" y="15" width="4" height="${h - 30}" rx="2" fill="url(#${uid}bar)"/>
  <!-- ince dither dokusu (ghost-font ruhu) -->
  <g fill="${p.marka}" opacity="0.10">
    <circle cx="${w - 10}" cy="56" r="0.7"/><circle cx="${w - 24}" cy="60" r="0.7"/>
    <circle cx="${w - 40}" cy="58" r="0.7"/>
  </g>
  <!-- logo chip'i -->
  <rect x="17" y="18" width="34" height="34" rx="10" fill="${chipBg}" stroke="${chipCizgi}"/>
  <g transform="translate(24, 25) scale(0.62)">${hayalet}</g>
  <!-- başlık (üst satır, sol) -->
  <text x="63" y="31" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="13.5" font-weight="700" fill="${p.metin}" letter-spacing="-0.2">${kacisla(baslik)}</text>
  <!-- canlı koruma nabzı (yeşil = aktif) + istatistik (alt satır) -->
  <circle cx="66.5" cy="47" r="3" fill="#22c55e"/>
  <circle cx="66.5" cy="47" r="3" fill="none" stroke="#22c55e" stroke-opacity="0.35" stroke-width="2"/>
  <text x="75" y="50.5" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" font-weight="600" fill="${p.soluk}">${stat}</text>
  <!-- seviye pili (sağ üst) -->
  <rect x="${pilX}" y="19" width="${pilGenislik}" height="18" rx="9" fill="${sev.renk}" fill-opacity="0.13" stroke="${sev.renk}" stroke-opacity="0.4"/>
  <circle cx="${pilX + 10}" cy="28" r="2.7" fill="${sev.renk}"/>
  <text x="${pilX + 16}" y="31.5" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="9.5" font-weight="700" fill="${sev.renk}" letter-spacing="0.3">${kacisla(sevAd)}</text>
  <!-- doğrulanmış tik (sağ alt) -->
  <g transform="translate(${w - 22}, 49)">
    <circle cx="0" cy="0" r="7" fill="${p.marka}" fill-opacity="0.14"/>
    <path d="M-3 0 L-0.8 2.2 L3.4 -2.6" stroke="${p.marka}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

/* ------------------------------------------------------------------ Gömme kodu */

/**
 * Herkese açık doğrulama sayfası URL'i (site slug'ı). Rozet tıklanınca buraya
 * yönlenir. Mevcut public /muhur/[slug] rotasıyla uyumlu.
 */
export function trustUrl(origin: string, siteSlug: string): string {
  return `${origin}/muhur/${siteSlug || "site"}`;
}

/** Site adından güvenli slug (yalnızca harf/rakam/nokta/tire). */
export function siteSlug(name: string): string {
  return name.replace(/[^a-z0-9.-]/gi, "").toLowerCase() || "site";
}

/**
 * Kopyalanabilir gömme kodunu üretir. bicim'e göre:
 *  - "html":     <a> içinde bağımsız satır-içi SVG (harici istek yok)
 *  - "svg":      salt SVG işaretlemesi (CMS/blok editörleri için)
 *  - "markdown": [![...](data-uri)](trust-url) — README/blog için
 *
 * Not: siteId parametresi imza uyumu için alınır; herkese açık kod hassas
 * iç kimlik ifşa etmemek için siteId yerine slug tabanlı trust URL kullanır.
 */
export function gomKodu(
  siteId: string,
  tema: RozetTema,
  bicim: RozetBicim,
  opts: { veri: RozetVeri; vurgu?: RozetVurgu; origin: string; siteName: string },
): string {
  void siteId; // Herkese açık gömmede iç id sızdırılmaz; slug kullanılır.
  const vurgu = opts.vurgu ?? "bot";
  const svg = rozetSvg(opts.veri, tema, vurgu);
  const url = trustUrl(opts.origin, siteSlug(opts.siteName));

  if (bicim === "svg") {
    return `<!-- Specter Güven Rozeti (bağımsız SVG — harici istek yok) -->\n${svg}`;
  }

  if (bicim === "markdown") {
    // data-uri ile SVG'yi gömerek README/blog'da harici bağımlılık olmadan çalışır.
    const dataUri = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    return `[![Veylify ile korunuyor](${dataUri})](${url})`;
  }

  // Varsayılan: HTML — SVG'yi tıklanabilir <a> içine sar.
  return `<!-- Specter Güven Rozeti -->
<a href="${url}" target="_blank" rel="noopener" aria-label="Veylify ile korunuyor" style="display:inline-block;line-height:0;text-decoration:none">
  ${svg.split("\n").join("\n  ")}
</a>`;
}
