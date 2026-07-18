// Twitter kartı = OG görseliyle aynı render. Next 16 config alanlarının
// (runtime/size/…) re-export'unu statik parse edemediği için config burada
// yerel olarak tanımlanır; yalnızca görsel fonksiyonu paylaşılır.
import { MARKA } from "@/lib/marka";
import OgImage from "./opengraph-image";

export const runtime = "nodejs";
export const alt = `${MARKA.ad} — ${MARKA.sloganTr}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return OgImage();
}
