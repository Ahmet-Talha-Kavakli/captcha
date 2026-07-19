import type { MetadataRoute } from "next";
import { MARKA } from "@/lib/marka";

/**
 * Sitemap — yalnız GERÇEKTEN var olan public rotalar listelenir (kırık URL
 * SEO'ya zarar verir). Blog rotası varsa yazı slug'ları otomatik dahil edilir.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = MARKA.url;
  const guncelleme = new Date("2026-07-19");

  // Ağırlıklı public rotalar. [yol, changeFrequency, priority]
  // Öncelik mantığı: ana sayfa 1.0 · ürün/pazarlama 0.8 · dönüşüm (demo/signup)
  // 0.7 · durum/blog 0.5-0.6 · giriş 0.4 · yasal sayfalar 0.3.
  // Yalnız GERÇEKTEN var olan rotalar (kırık URL SEO'ya zarar verir). Eski
  // Türkçe rotalar (/ozellikler…) next.config.ts'te 301 → sitemap'e KONMAZ.
  const rotalar: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    ["", "daily", 1.0],
    // Ürün / pazarlama
    ["/features", "weekly", 0.8],
    ["/how-it-works", "weekly", 0.8],
    ["/solutions", "weekly", 0.8],
    ["/pricing", "weekly", 0.8],
    ["/security", "monthly", 0.7],
    ["/about", "monthly", 0.6],
    ["/contact", "monthly", 0.6],
    // Dönüşüm / uygulama girişi
    ["/demo", "weekly", 0.7],
    ["/signup", "monthly", 0.6],
    ["/login", "monthly", 0.4],
    // Canlı durum
    ["/durum", "daily", 0.5],
    // Yasal
    ["/gizlilik", "yearly", 0.3],
    ["/kvkk", "yearly", 0.3],
    ["/sartlar", "yearly", 0.3],
    ["/mesafeli-satis", "yearly", 0.3],
    ["/iade", "yearly", 0.3],
    ["/teslimat", "yearly", 0.3],
  ];

  const girisler: MetadataRoute.Sitemap = rotalar.map(([r, cf, p]) => ({
    url: base + r,
    lastModified: guncelleme,
    changeFrequency: cf,
    priority: p,
  }));

  // Blog — başka bir ajan tarafından eklenmiş olabilir; varsa dahil et, yoksa sessizce atla.
  try {
    const mod: Record<string, unknown> = await import("@/app/(marketing)/blog/yazilar");
    const yazilar: Array<{ slug: string; tarih?: string }> =
      (mod.YAZILAR as Array<{ slug: string; tarih?: string }>) ??
      (mod.yazilar as Array<{ slug: string; tarih?: string }>) ??
      (mod.default as Array<{ slug: string; tarih?: string }>) ??
      [];
    if (Array.isArray(yazilar) && yazilar.length > 0) {
      girisler.push({
        url: `${base}/blog`,
        lastModified: guncelleme,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      for (const y of yazilar) {
        if (!y?.slug) continue;
        // Blog tarihi görüntü biçiminde ("12 Temmuz 2026") — Date parse edemez;
        // geçersizse güvenle güncelleme tarihine düş.
        const ayrist = y.tarih ? new Date(y.tarih) : guncelleme;
        const lastModified = Number.isNaN(ayrist.getTime()) ? guncelleme : ayrist;
        girisler.push({
          url: `${base}/blog/${y.slug}`,
          lastModified,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // yazilar.ts yok — statik sitemap yeterli.
  }

  return girisler;
}
