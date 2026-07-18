import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MARKA } from "@/lib/marka";

// Tavily gibi TEK aile: Inter her yerde. (Sora display fontu kaldırıldı.)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(MARKA.url),
  title: {
    default: `${MARKA.ad} — Yapay zekaya karşı ghost-font koruması`,
    template: `%s · ${MARKA.ad}`,
  },
  description:
    `${MARKA.ad}, geliştiricilerin sitelerini AI botlarından korur. Ghost-font teknolojisiyle (temporal dithering) insanın gördüğü, makinenin göremediği CAPTCHA. Davranışsal analiz + kural motoru + görünmez mod.`,
  keywords: [
    "captcha", "bot koruması", "ghost font", "yapay zeka koruması", "AI bot",
    "temporal dithering", "reCAPTCHA alternatifi", "davranışsal analiz",
    "insan doğrulama", "bot tespiti", "web kazıma önleme", "Turnstile alternatifi",
    MARKA.ad,
  ],
  applicationName: MARKA.ad,
  authors: [{ name: MARKA.ad, url: MARKA.url }],
  creator: MARKA.ad,
  publisher: MARKA.ad,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${MARKA.ad} — Yapay zekaya karşı ghost-font koruması`,
    description: `AI botlar her CAPTCHA'yı geçiyor. ${MARKA.ad}, insanın gördüğü ile makinenin okuduğunu ayırarak botları yeniden dışarıda tutar.`,
    type: "website",
    locale: "tr_TR",
    url: MARKA.url,
    siteName: MARKA.ad,
  },
  twitter: {
    card: "summary_large_image",
    title: `${MARKA.ad} — Yapay zekaya karşı ghost-font koruması`,
    description: `AI botlar her CAPTCHA'yı geçiyor. ${MARKA.ad} geçemediği tek katman.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: MARKA.renk },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jbMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
