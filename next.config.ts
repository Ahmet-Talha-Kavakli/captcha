import type { NextConfig } from "next";

/**
 * Production yapılandırması.
 * - Güvenlik başlıkları (HSTS, X-Frame-Options, referrer, permissions).
 * - poweredByHeader kapalı (parmak izi azaltma).
 * - compress açık.
 * Not: widget (public/specter.js) 3. taraf sitelere gömüldüğü için ona
 * frame kısıtı uygulanmaz; frame koruması panel/uygulama içindir.
 */
const guvenlikBasliklari = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async redirects() {
    // Eski Türkçe pazarlama/auth URL'leri yeni İngilizce rotalara kalıcı (301)
    // yönlendir. SEO ve dış bağlantılar kırılmasın.
    const eskiden: Array<[string, string]> = [
      ["/ozellikler", "/features"],
      ["/fiyatlandirma", "/pricing"],
      ["/nasil-calisir", "/how-it-works"],
      ["/cozumler", "/solutions"],
      ["/iletisim", "/contact"],
      ["/hakkimizda", "/about"],
      ["/guvenlik", "/security"],
      ["/giris", "/login"],
      ["/kayit", "/signup"],
    ];
    return eskiden.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        // specter.js hariç tüm yollara güvenlik başlıkları.
        source: "/((?!specter\\.js).*)",
        headers: guvenlikBasliklari,
      },
      {
        // WIDGET CACHE: 3. taraf sitelere gömülen widget her sayfa yüklemesinde
        // yeniden indirilmesin. Daha önce Cache-Control:max-age=0 idi (her ziyaret
        // round-trip). stale-while-revalidate: tarayıcı cache'ten ANINDA servis
        // eder, arka planda yeni sürümü çeker → sürüm değişince cache-bust'a gerek
        // yok, otomatik güncellenir. CORS için widget zaten * ile erişilebilir.
        source: "/:file(veylify\\.js|specter\\.js)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
