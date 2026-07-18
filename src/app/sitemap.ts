import type { MetadataRoute } from "next";
import { MARKA } from "@/lib/marka";

/**
 * Sitemap — yalnız GERÇEKTEN var olan public rotalar listelenir (kırık URL
 * SEO'ya zarar verir). Blog rotası varsa yazı slug'ları otomatik dahil edilir.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = MARKA.url;
  const guncelleme = new Date("2026-07-18");

  // Ağırlıklı public rotalar. [yol, changeFrequency, priority]
  const rotalar: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    ["", "daily", 1],
    ["/ozellikler", "weekly", 0.9],
    ["/nasil-calisir", "weekly", 0.9],
    ["/cozumler", "weekly", 0.8],
    ["/fiyatlandirma", "weekly", 0.9],
    ["/demo", "weekly", 0.7],
    ["/durum", "daily", 0.5],
    ["/giris", "monthly", 0.4],
    ["/kayit", "monthly", 0.6],
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
