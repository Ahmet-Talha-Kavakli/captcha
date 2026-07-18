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
  async headers() {
    return [
      {
        // specter.js hariç tüm yollara güvenlik başlıkları.
        source: "/((?!specter\\.js).*)",
        headers: guvenlikBasliklari,
      },
    ];
  },
};

export default nextConfig;
