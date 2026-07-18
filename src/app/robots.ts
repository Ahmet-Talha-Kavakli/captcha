import type { MetadataRoute } from "next";
import { MARKA } from "@/lib/marka";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/panel/", "/api", "/api/"],
    },
    sitemap: `${MARKA.url}/sitemap.xml`,
    host: MARKA.url,
  };
}
