import type { MetadataRoute } from "next";
import { MARKA } from "@/lib/marka";

export default function robots(): MetadataRoute.Robots {
  // Özel/uygulama alanları taranmaz: panel (giriş-arkası), api (uç noktalar),
  // muhur (widget mühür ucu), auth demo girişi. Kalan her şey (pazarlama,
  // blog, demo, durum) taranabilir.
  const disallow = [
    "/panel",
    "/panel/",
    "/api",
    "/api/",
    "/muhur",
    "/demo-giris",
  ];

  return {
    rules: [
      // Genel + itibarlı AI crawler'ları (GEO/llms.txt ile uyumlu) açıkça izinli.
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "Googlebot", allow: "/", disallow },
      { userAgent: "Bingbot", allow: "/", disallow },
    ],
    sitemap: `${MARKA.url}/sitemap.xml`,
    host: MARKA.url,
  };
}
