"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Smartphone, Globe, Server, Package, Check, Copy, Info,
} from "lucide-react";
import { Panel, Badge, useToast } from "@/components/panel/kit";
import { MarkaLogo } from "@/components/panel/MarkaLogo";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { mobilSdkCeviri } from "./mobil-sdk.i18n";

/* Üç entegrasyon yolu — her müşteri senaryosu için. Metinler çeviri anahtarıdır;
 * enum durumu (hazır / yol-haritası) key-map ile etikete dönüşür. */
const YOLLAR = [
  {
    id: "webview", durum: "hazir" as const,
    ikon: <Globe className="size-5" />,
    adKey: "ms.yol.webview.ad", ozetKey: "ms.yol.webview.ozet", aciklamaKey: "ms.yol.webview.aciklama",
    artiKeyleri: ["ms.yol.webview.arti1", "ms.yol.webview.arti2", "ms.yol.webview.arti3"],
  },
  {
    id: "api", durum: "hazir" as const,
    ikon: <Server className="size-5" />,
    adKey: "ms.yol.api.ad", ozetKey: "ms.yol.api.ozet", aciklamaKey: "ms.yol.api.aciklama",
    artiKeyleri: ["ms.yol.api.arti1", "ms.yol.api.arti2", "ms.yol.api.arti3"],
  },
  {
    id: "sdk", durum: "yolharitasi" as const,
    ikon: <Package className="size-5" />,
    adKey: "ms.yol.sdk.ad", ozetKey: "ms.yol.sdk.ozet", aciklamaKey: "ms.yol.sdk.aciklama",
    artiKeyleri: ["ms.yol.sdk.arti1", "ms.yol.sdk.arti2", "ms.yol.sdk.arti3"],
  },
];

const KOD: Record<string, { dil: string; kod: string }> = {
  webview: {
    dil: "javascript",
    kod: `// React Native — WebView içinde Specter widget'ı
import { WebView } from 'react-native-webview';

<WebView
  source={{ uri: 'https://siteniz.com/dogrulama' }}
  onMessage={(e) => {
    const { specterToken } = JSON.parse(e.nativeEvent.data);
    // token'ı backend'e gönder → /api/siteverify ile doğrula
    verifyOnBackend(specterToken);
  }}
/>`,
  },
  api: {
    dil: "shell",
    kod: `# Native uygulama → backend → Specter siteverify
curl -X POST https://api.veylify.com/siteverify \\
  -H "Authorization: Bearer sk_gizli_anahtariniz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "kullanicidan_gelen_challenge_token",
    "ip": "istemci_ip",
    "action": "login"
  }'
# → { "success": true, "score": 0.94, "verdict": "allowed" }`,
  },
  sdk: {
    dil: "shell",
    kod: `// Swift (iOS) — planlanan SDK (öngörülen API)
import Specter

Specter.configure(siteKey: "pk_site_anahtariniz")

Specter.challenge(action: .login) { result in
  switch result {
  case .success(let token): submitLogin(token)
  case .failure(let err):   showError(err)
  }
}`,
  },
};

/** Durum enum → rozet tonu + çeviri anahtarı (enum değeri çevrilmez). */
const DURUM_META = {
  hazir: { adKey: "ms.durum.hazir", ton: "yesil" as const },
  yolharitasi: { adKey: "ms.durum.yolharitasi", ton: "sari" as const },
};

export function MobilSdkIstemci({ dil }: { dil: Dil }) {
  const t = (k: string) => mobilSdkCeviri(k, dil);
  const [aktif, setAktif] = useState("webview");
  const [kopyalandi, setKopyalandi] = useState(false);
  const azalt = useReducedMotion();
  const { goster } = useToast();
  const seciliKod = KOD[aktif];
  const seciliYol = YOLLAR.find((y) => y.id === aktif)!;

  const kopyala = () => {
    navigator.clipboard?.writeText(seciliKod.kod);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: t("ms.toast.kopyalandi") });
    setTimeout(() => setKopyalandi(false), 1600);
  };

  // Platform matrisi — platform/çerçeve adları (React Native, Flutter, iOS…) veri
  // olarak kalır; yöntem/durum/biyometri metni çeviri anahtarıdır.
  const MATRIS: [string, string, "hazir" | "yolharitasi", string][] = [
    ["React Native", "WebView", "hazir", "ms.biyo.dokunusjest"],
    ["Flutter", "WebView", "hazir", "ms.biyo.dokunusjest"],
    ["Ionic / Capacitor", "WebView", "hazir", "ms.biyo.dokunusjest"],
    ["iOS (native)", "siteverify API", "hazir", "ms.biyo.backend"],
    ["Android (native)", "siteverify API", "hazir", "ms.biyo.backend"],
    ["iOS SDK (Swift)", "Native SDK", "yolharitasi", "ms.biyo.attestasyon"],
    ["Android SDK (Kotlin)", "Native SDK", "yolharitasi", "ms.biyo.attestasyon"],
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("ms.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("ms.intro.metin1")}<b>{t("ms.intro.hibrit")}</b>{t("ms.intro.metin2")}<b>{t("ms.intro.native")}</b>{t("ms.intro.metin3")}<b>{t("ms.intro.nativesdk")}</b>{t("ms.intro.metin4")}
          </p>
        </div>
      </div>

      {/* üç yol kartı */}
      <div className="grid gap-4 lg:grid-cols-3">
        {YOLLAR.map((y, i) => {
          const secili = aktif === y.id;
          const dm = DURUM_META[y.durum];
          return (
            <motion.button
              key={y.id}
              onClick={() => setAktif(y.id)}
              initial={azalt ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={cn(
                "group rounded-2xl border p-5 text-left transition-all duration-200",
                secili ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-200 shadow-card" : "border-line bg-surface hover:border-line-strong hover:shadow-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("grid size-11 place-items-center rounded-xl transition", secili ? "bg-brand-100 text-brand-700" : "bg-canvas text-slate-muted group-hover:text-slate-ink")}>{y.ikon}</span>
                <Badge ton={dm.ton}>{t(dm.adKey)}</Badge>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t(y.adKey)}</p>
              <p className="mt-0.5 text-[12.5px] text-slate-faint">{t(y.ozetKey)}</p>
            </motion.button>
          );
        })}
      </div>

      {/* seçili yol detayı + kod */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel baslik={t(seciliYol.adKey)}>
          <p className="text-[13.5px] leading-relaxed text-slate-muted">{t(seciliYol.aciklamaKey)}</p>
          <div className="mt-4 space-y-2">
            {seciliYol.artiKeyleri.map((ak) => (
              <div key={ak} className="flex items-center gap-2.5 text-[13px] text-slate-ink">
                <span className="grid size-5 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3.5" /></span>
                {t(ak)}
              </div>
            ))}
          </div>
        </Panel>

        {/* kod bloğu */}
        <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950">
          <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <MarkaLogo ad={seciliKod.dil} size={16} />
              <span className="text-[12.5px] font-medium text-slate-300">{seciliKod.dil === "javascript" ? "React Native" : seciliKod.dil === "shell" ? (aktif === "sdk" ? "Swift" : "cURL") : seciliKod.dil}</span>
            </div>
            <button onClick={kopyala} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white transition hover:bg-white/20">
              {kopyalandi ? <><Check className="size-3.5 text-green-400" /> {t("ms.kod.kopyalandi")}</> : <><Copy className="size-3.5" /> {t("ms.kod.kopyala")}</>}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-relaxed text-slate-200"><code>{seciliKod.kod}</code></pre>
        </div>
      </div>

      {/* platform matrisi */}
      <Panel baslik={t("ms.matris.baslik")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="pb-2.5 pr-3">{t("ms.matris.platform")}</th>
                <th className="px-3 pb-2.5">{t("ms.matris.yontem")}</th>
                <th className="px-3 pb-2.5">{t("ms.matris.durum")}</th>
                <th className="px-3 pb-2.5">{t("ms.matris.biyometri")}</th>
              </tr>
            </thead>
            <tbody>
              {MATRIS.map(([platform, yontem, durum, biyoKey]) => (
                <tr key={platform} className="border-b border-line/60 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-slate-ink">{platform}</td>
                  <td className="px-3 py-2.5 text-slate-muted">{yontem}</td>
                  <td className="px-3 py-2.5"><Badge ton={durum === "hazir" ? "yesil" : "sari"}>{t(DURUM_META[durum].adKey)}</Badge></td>
                  <td className="px-3 py-2.5 text-slate-muted">{t(biyoKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span><b>{t("ms.not.bugunhazir")}</b>{t("ms.not.metin1")}<code className="rounded bg-canvas px-1">siteverify</code>{t("ms.not.metin2")}<b>{t("ms.not.yolharitasi")}</b>{t("ms.not.metin3")}</span>
      </div>
    </div>
  );
}
