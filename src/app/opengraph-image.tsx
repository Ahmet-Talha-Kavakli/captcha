import { ImageResponse } from "next/og";
import { MARKA } from "@/lib/marka";

// Node runtime (Next 16 uyumu) — edge KULLANMA.
export const runtime = "nodejs";

export const alt = `${MARKA.ad} — ${MARKA.sloganTr}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4f46e5 130%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* arka plan ışıltısı */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(129,140,248,0.45) 0%, rgba(129,140,248,0) 70%)",
            display: "flex",
          }}
        />

        {/* üst: amblem + marka */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Kalkan + göz amblemi */}
          <svg width="92" height="92" viewBox="0 0 100 100" fill="none">
            <path
              d="M50 6 L86 20 V50 C86 74 70 90 50 96 C30 90 14 74 14 50 V20 Z"
              fill="rgba(255,255,255,0.08)"
              stroke="#a5b4fc"
              strokeWidth="4"
            />
            <path
              d="M24 52 C33 40 45 34 50 34 C55 34 67 40 76 52 C67 64 55 70 50 70 C45 70 33 64 24 52 Z"
              fill="rgba(255,255,255,0.10)"
              stroke="#c7d2fe"
              strokeWidth="3.5"
            />
            <circle cx="50" cy="52" r="11" fill="#818cf8" />
            <circle cx="50" cy="52" r="4.5" fill="#1e1b4b" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              color: "#e0e7ff",
              letterSpacing: 1,
            }}
          >
            {MARKA.domain}
          </div>
        </div>

        {/* orta: başlık */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {MARKA.ad}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 500,
              color: "#c7d2fe",
              maxWidth: 940,
              lineHeight: 1.25,
            }}
          >
            {MARKA.sloganTr}
          </div>
        </div>

        {/* alt: etiket şeridi */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 26,
              fontWeight: 600,
              color: "#a5b4fc",
              padding: "12px 24px",
              borderRadius: 9999,
              border: "1px solid rgba(165,180,252,0.35)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Ghost-font CAPTCHA · AI botlarına karşı insan doğrulama
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
