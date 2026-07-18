import type { MetadataRoute } from "next";
import { MARKA } from "@/lib/marka";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MARKA.ad} — AI bot koruması`,
    short_name: MARKA.ad,
    description: MARKA.sloganTr,
    start_url: "/panel",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: MARKA.renk,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  };
}
