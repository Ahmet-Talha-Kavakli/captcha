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
    // GERÇEK dosyalar: Next `src/app/icon.png` → /icon.png (512), `apple-icon.png`
    // → /apple-icon.png (180); ayrıca public/favicon-32.png. Önceden olmayan
    // /icon.svg + /apple-icon.svg'e işaret ediyordu (kırık PWA ikonları).
    icons: [
      { src: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
