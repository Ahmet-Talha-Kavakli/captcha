"use client";

/**
 * Kurulum Sihirbazı & Entegrasyon Merkezi (istemci)
 * =================================================
 * Genel Bakış'taki küçük OnboardingKart'ın zengin, tam-sayfa sürümü:
 *   • Sol raylı adımlayıcı (stepper) — 7 adım, gerçek durum işaretleriyle.
 *   • Çerçeveye özel entegrasyon rehberleri (HTML / React / Vue / Next.js /
 *     WordPress) — gerçek siteKey gömülü, kopyala-yapıştır KodBlok kodları.
 *   • Sunucu tarafı doğrulama örnekleri (Node/Express, Python/Flask) — gerçek
 *     /api/v1/siteverify çağrısı.
 *   • Genel ilerleme çubuğu + yüzde + "X/7 tamamlandı" + kutlama ekranı.
 *   • Her adımda "doğrula" — router.refresh() ile gerçek hesap durumu yeniden
 *     okunur, toast ile geri bildirim.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Globe, ShieldCheck, Code2, Zap, GitBranch, Plug, Users,
  CheckCircle2, Circle, Rocket, ArrowRight, ChevronRight, ChevronDown,
  Clock, RefreshCw, PartyPopper, Sparkles, Server, TerminalSquare,
  Check, ArrowUpRight, ListChecks, Hourglass,
  Gift, PlayCircle, BookOpen, FlaskConical, FileText, LifeBuoy,
} from "lucide-react";
import { Panel, Badge, KodBlok, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { WidgetOnizleme } from "@/components/panel/WidgetOnizleme";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { obCeviri } from "./onboarding.i18n";

/* --------------------------------------------------------------- tipler */

interface Durum {
  siteVar: boolean;
  dogrulandi: boolean;
  trafikVar: boolean;
  kuralVar: boolean;
  anahtarVar: boolean;
  entegrasyonVar: boolean;
  ekipVar: boolean;
}

interface Props {
  durum: Durum;
  siteKey: string;
  siteAd: string | null;
  siteId: string | null;
  dil: Dil;
}

interface Adim {
  anahtar: keyof Durum;
  /** i18n anahtar öneki (enum değeri değil — çeviri sözlüğü öneki). */
  i18n: string;
  no: number;
  ikon: React.ReactNode;
  /** Süre gösterimi: dakika sayısı (veri) ya da "aninda" (anlık). */
  sure: number | "aninda";
  href: string;
  /** Bu adım gerçekten doğrulanabilir mi (buton gösterilir mi)? */
  dogrulanabilir: boolean;
}

/* --------------------------------------------------------------- çerçeveler */

type Cerceve = "html" | "react" | "vue" | "nextjs" | "wordpress";

const CERCEVELER: { key: Cerceve; ad: string; dil: string }[] = [
  { key: "html", ad: "HTML", dil: "html" },
  { key: "react", ad: "React", dil: "tsx" },
  { key: "vue", ad: "Vue", dil: "vue" },
  { key: "nextjs", ad: "Next.js", dil: "tsx" },
  { key: "wordpress", ad: "WordPress", dil: "php" },
];

/** Gerçek siteKey gömülü, çerçeveye özel istemci entegrasyon kodu. */
function istemciKodu(cerceve: Cerceve, siteKey: string): string {
  switch (cerceve) {
    case "html":
      return `<!-- 1) Specter ghost-font betiğini <head>'e ekle -->
<script
  src="https://cdn.veylify.com/v1/specter.js"
  data-site-key="${siteKey}"
  defer
></script>

<!-- 2) Korunacak formun içine doğrulama kutusunu yerleştir -->
<form action="/giris" method="POST">
  <input type="email" name="email" required />
  <input type="password" name="parola" required />

  <!-- Specter widget'ı buraya bir gizli token enjekte eder -->
  <div class="specter-widget" data-site-key="${siteKey}"></div>

  <button type="submit">Giriş yap</button>
</form>`;
    case "react":
      return `// 1) Betiği bir kez yükle (ör. kök layout / App.tsx)
import { useEffect } from "react";

export function SpecterYukle() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://cdn.veylify.com/v1/specter.js";
    s.dataset.siteKey = "${siteKey}";
    s.defer = true;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
  return null;
}

// 2) Formda widget kutusunu render et
export function GirisFormu() {
  return (
    <form action="/giris" method="POST">
      <input type="email" name="email" required />
      <input type="password" name="parola" required />
      <div className="specter-widget" data-site-key="${siteKey}" />
      <button type="submit">Giriş yap</button>
    </form>
  );
}`;
    case "vue":
      return `<!-- SpecterFormu.vue -->
<script setup>
import { onMounted, onUnmounted } from "vue";

let betik;
onMounted(() => {
  betik = document.createElement("script");
  betik.src = "https://cdn.veylify.com/v1/specter.js";
  betik.dataset.siteKey = "${siteKey}";
  betik.defer = true;
  document.head.appendChild(betik);
});
onUnmounted(() => betik && betik.remove());
</script>

<template>
  <form action="/giris" method="POST">
    <input type="email" name="email" required />
    <input type="password" name="parola" required />
    <div class="specter-widget" :data-site-key="'${siteKey}'"></div>
    <button type="submit">Giriş yap</button>
  </form>
</template>`;
    case "nextjs":
      return `// app/layout.tsx — betiği next/script ile yükle
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Script
          src="https://cdn.veylify.com/v1/specter.js"
          data-site-key="${siteKey}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

// app/giris/page.tsx — formda widget kutusu
export default function GirisSayfasi() {
  return (
    <form action="/api/giris" method="POST">
      <input type="email" name="email" required />
      <input type="password" name="parola" required />
      <div className="specter-widget" data-site-key="${siteKey}" />
      <button type="submit">Giriş yap</button>
    </form>
  );
}`;
    case "wordpress":
      return `<?php
/**
 * Specter'ı WordPress'e ekle. Bu kodu aktif temanın functions.php
 * dosyasına yapıştır (ya da küçük bir eklenti olarak kaydet).
 */

// 1) Ghost-font betiğini tüm sayfalara ekle
add_action( 'wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'specter',
    'https://cdn.veylify.com/v1/specter.js',
    array(),
    'v1',
    true
  );
  wp_script_add_data( 'specter', 'data-site-key', '${siteKey}' );
} );

// 2) Yorum / giriş formuna widget kutusunu ekle
add_action( 'comment_form_after_fields', function () {
  echo '<div class="specter-widget" data-site-key="${siteKey}"></div>';
} );`;
  }
}

/** Sunucu tarafı ghost-font doğrulama örneği (gizli anahtar ile). */
function sunucuKodu(cerceve: "node" | "python", siteKey: string): string {
  if (cerceve === "node") {
    return `// Node.js / Express — form gönderiminde token'ı Specter ile doğrula.
// GİZLİ anahtarını (sk_live_…) yalnızca sunucuda tut, asla istemciye koyma.
import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));

const SPECTER_SECRET = process.env.SPECTER_SECRET_KEY; // sk_live_...

app.post("/giris", async (req, res) => {
  const token = req.body["veylify-token"];

  const dogrula = await fetch("https://api.veylify.com/api/v1/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: SPECTER_SECRET,
      site_key: "${siteKey}",
      token,
      remoteip: req.ip,
    }),
  });

  const sonuc = await dogrula.json();
  if (!sonuc.success || sonuc.verdict === "blocked") {
    return res.status(403).send("Bot tespit edildi — istek reddedildi.");
  }

  // İnsan doğrulandı → normal akışa devam et.
  res.send("Giriş başarılı.");
});`;
  }
  return `# Python / Flask — form gönderiminde token'ı Specter ile doğrula.
# GİZLİ anahtarı (sk_live_…) yalnızca sunucuda tut.
import os
import requests
from flask import Flask, request, abort

app = Flask(__name__)
SPECTER_SECRET = os.environ["SPECTER_SECRET_KEY"]  # sk_live_...

@app.post("/giris")
def giris():
    token = request.form.get("veylify-token")

    r = requests.post(
        "https://api.veylify.com/api/v1/siteverify",
        json={
            "secret": SPECTER_SECRET,
            "site_key": "${siteKey}",
            "token": token,
            "remoteip": request.remote_addr,
        },
        timeout=5,
    )
    sonuc = r.json()

    if not sonuc.get("success") or sonuc.get("verdict") == "blocked":
        abort(403, "Bot tespit edildi — istek reddedildi.")

    return "Giriş başarılı."`;
}

/* --------------------------------------------------------------- bileşen */

export function OnboardingIstemci({ durum, siteKey, siteAd, siteId, dil }: Props) {
  const { goster } = useToast();
  const router = useRouter();
  const [yenileniyor, baslatYenile] = useTransition();
  const t = (anahtar: string) => obCeviri(anahtar, dil);

  const siteHref = siteId ? `/panel/siteler/${siteId}` : "/panel/siteler";

  // Adım tanımları — metin ALANLARI i18n önekinden türetilir (enum değil).
  // `sure`: dakika sayısı (veri) ya da "aninda" (anlık — chrome, ayrı çevrilir).
  const adimlar: Adim[] = [
    { anahtar: "siteVar", i18n: "adim.siteVar", no: 1, ikon: <Globe className="size-4" />, sure: 1, href: "/panel/siteler", dogrulanabilir: true },
    { anahtar: "dogrulandi", i18n: "adim.dogrulandi", no: 2, ikon: <ShieldCheck className="size-4" />, sure: 2, href: siteHref, dogrulanabilir: true },
    { anahtar: "trafikVar", i18n: "adim.entegre", no: 3, ikon: <Code2 className="size-4" />, sure: 3, href: "/panel/gelistirici", dogrulanabilir: true },
    { anahtar: "trafikVar", i18n: "adim.trafik", no: 4, ikon: <Zap className="size-4" />, sure: "aninda", href: "/panel/trafik", dogrulanabilir: true },
    { anahtar: "kuralVar", i18n: "adim.kural", no: 5, ikon: <GitBranch className="size-4" />, sure: 2, href: "/panel/kurallar", dogrulanabilir: true },
    { anahtar: "entegrasyonVar", i18n: "adim.entegrasyon", no: 6, ikon: <Plug className="size-4" />, sure: 2, href: "/panel/entegrasyonlar", dogrulanabilir: true },
    { anahtar: "ekipVar", i18n: "adim.ekip", no: 7, ikon: <Users className="size-4" />, sure: 1, href: "/panel/ekip", dogrulanabilir: true },
  ];

  // Süre etiketi: dakika → "{n} dk" şablonu; "aninda" → ayrı anahtar.
  const sureEtiket = (s: number | "aninda") =>
    s === "aninda" ? t("sure.aninda") : t("sure.dk").replace("{n}", String(s));

  const toplam = adimlar.length;
  const tamamSayi = adimlar.filter((a) => durum[a.anahtar]).length;
  const kalanSayi = toplam - tamamSayi;
  const yuzde = Math.round((tamamSayi / toplam) * 100);
  const bittiHepsi = tamamSayi === toplam;
  // Sıradaki (ilk tamamlanmamış) adım.
  const aktifNo = adimlar.find((a) => !durum[a.anahtar])?.no ?? null;

  // Kalan tahmini süre (dk) — tamamlanmamış adımların `sure` verisi toplanır;
  // "aninda" adımlar 0 dk sayılır. Sadece gösterge; hiçbir mantığı etkilemez.
  const kalanSure = useMemo(
    () => adimlar.reduce((acc, a) => (durum[a.anahtar] || a.sure === "aninda" ? acc : acc + a.sure), 0),
    [adimlar, durum],
  );

  // Seçili adım (sağ panelde detayı gösterilen). Varsayılan: aktif ya da ilk.
  const [seciliNo, setSeciliNo] = useState<number>(aktifNo ?? 1);
  const secili = adimlar.find((a) => a.no === seciliNo) ?? adimlar[0];

  function durumuDogrula() {
    baslatYenile(() => {
      router.refresh();
      goster({
        tip: "bilgi",
        baslik: t("toast.baslik"),
        aciklama: t("toast.aciklama"),
      });
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-12 lg:px-10">
      {/* üst şerit: başlık + genel ilerleme halkası */}
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-brand-50/70 via-surface to-surface"
      >
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-900 text-white shadow-lift">
              <Rocket className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-slate-ink">{t("baslik")}</h1>
                <span className="rounded-full bg-brand-600/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                  {t("rozet")}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-[13.5px] text-slate-muted">
                {siteAd
                  ? (() => {
                      // {site} yer tutucusunu koyu site adıyla değiştir (dile duyarlı).
                      const [once, sonra] = t("ozet.site").split("{site}");
                      return <>{once}<b className="text-slate-ink">{siteAd}</b>{sonra}</>;
                    })()
                  : t("ozet.genel")}
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={durumuDogrula} disabled={yenileniyor}>
                  <RefreshCw className={cn("size-4", yenileniyor && "animate-spin")} /> {t("durumDogrula")}
                </Button>
              </div>
            </div>
          </div>

          {/* genel ilerleme halkası (progress-ring) */}
          <div className="flex shrink-0 items-center gap-5">
            <IlerlemeHalkasi yuzde={yuzde} tamam={tamamSayi} toplam={toplam} bitti={bittiHepsi} t={t} />
            <div className="hidden gap-2 sm:grid">
              <OzetHap
                ikon={<ListChecks className="size-4" />}
                deger={`${tamamSayi}/${toplam}`}
                etiket={t("ozet.tamamlanan")}
                ton="ok"
              />
              <OzetHap
                ikon={<Circle className="size-4" />}
                deger={String(kalanSayi)}
                etiket={t("ozet.kalan")}
                ton="brand"
              />
              <OzetHap
                ikon={<Hourglass className="size-4" />}
                deger={bittiHepsi ? "—" : t("sure.dk").replace("{n}", String(kalanSure))}
                etiket={t("ozet.tahminiSure")}
                ton="notr"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* hızlı başlangıç özet şeridi — yalnızca hiç adım tamamlanmamışsa (sıfır-durum) */}
      {tamamSayi === 0 && <HizliBaslangic t={t} />}

      {/* kutlama ekranı */}
      {bittiHepsi && (
        <div className="relative overflow-hidden rounded-[28px] border border-green-200 bg-gradient-to-br from-ok-soft/60 via-surface to-brand-50/40 p-6 lg:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-white shadow-lift">
              <PartyPopper className="size-7" />
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-ink">{t("kutlama.baslik")}</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-muted">
                {t("kutlama.metin")}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SonrakiOneri href="/panel/ai-ajanlar" ikon={<Sparkles className="size-4" />} baslik={t("kutlama.oneri1.baslik")} desc={t("kutlama.oneri1.desc")} />
            <SonrakiOneri href="/panel/korelasyon" ikon={<GitBranch className="size-4" />} baslik={t("kutlama.oneri2.baslik")} desc={t("kutlama.oneri2.desc")} />
            <SonrakiOneri href="/panel/uyum" ikon={<ShieldCheck className="size-4" />} baslik={t("kutlama.oneri3.baslik")} desc={t("kutlama.oneri3.desc")} />
          </div>
        </div>
      )}

      {/* iki kolon: sol adımlayıcı | sağ detay */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* sol ray: stepper */}
        <div className="space-y-2">
          {adimlar.map((a, i) => {
            const tamam = durum[a.anahtar];
            const aktif = a.no === aktifNo;
            const secili2 = a.no === seciliNo;
            return (
              <button
                key={a.no}
                onClick={() => setSeciliNo(a.no)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                  secili2 ? "border-brand-400 bg-surface shadow-card ring-1 ring-brand-200" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                {/* bağlayıcı çizgi */}
                {i < adimlar.length - 1 && (
                  <span className={cn("absolute left-[27px] top-[46px] h-[calc(100%-30px)] w-px", tamam ? "bg-ok/40" : "bg-line")} />
                )}
                {tamam ? (
                  <span className="z-[1] grid size-7 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 className="size-5" /></span>
                ) : aktif ? (
                  <span className="z-[1] grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-card">{a.ikon}</span>
                ) : (
                  <span className="z-[1] grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"><Circle className="size-4" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="num text-[10.5px] font-bold text-slate-faint">{t("stepper.adim").replace("{n}", String(a.no))}</span>
                    {aktif && <span className="rounded-full bg-brand-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">{t("stepper.simdi")}</span>}
                  </div>
                  <div className={cn("truncate text-[13.5px] font-semibold", tamam ? "text-slate-faint" : "text-slate-ink")}>{t(`${a.i18n}.ad`)}</div>
                  {/* durum satırı: tamamlandı etiketi ya da tahmini süre */}
                  <div className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium">
                    {tamam ? (
                      <span className="inline-flex items-center gap-0.5 text-ok"><Check className="size-3" /> {t("durum.tamamlandi")}</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-slate-faint"><Clock className="size-3" /> {sureEtiket(a.sure)}</span>
                    )}
                  </div>
                </div>
                {tamam && <CheckCircle2 className="size-4 shrink-0 text-ok" />}
              </button>
            );
          })}
        </div>

        {/* sağ: seçili adım detayı */}
        <div className="space-y-5">
          <AdimDetay
            adim={secili}
            tamam={durum[secili.anahtar]}
            aktif={secili.no === aktifNo}
            onDogrula={durumuDogrula}
            yenileniyor={yenileniyor}
            t={t}
            sureEtiket={sureEtiket}
          />

          {/* adım 3 & 4 → çerçeveye özel entegrasyon rehberi + canlı widget testi */}
          {(secili.no === 3 || secili.no === 4) && (
            <>
              <EntegrasyonRehberi siteKey={siteKey} t={t} />
              <CanliTest siteKey={siteKey} t={t} />
            </>
          )}
        </div>
      </div>

      {/* her zaman görünür: yardım & kaynak bağlantıları */}
      <YardimBolumu t={t} />
    </div>
  );
}

/* --------------------------------------------------------------- HizliBaslangic
 * Sıfır-durum motivasyon şeridi: "3 adımda korumaya başla" — 3 mini kart. Yalnızca
 * hiç adım tamamlanmamışken gösterilir (ilk kez giren kullanıcı için yön). */
function HizliBaslangic({ t }: { t: (k: string) => string }) {
  const kartlar = [
    { ikon: <Globe className="size-5" />, no: 1, baslik: t("hizli.1.baslik"), desc: t("hizli.1.desc") },
    { ikon: <Code2 className="size-5" />, no: 2, baslik: t("hizli.2.baslik"), desc: t("hizli.2.desc") },
    { ikon: <Zap className="size-5" />, no: 3, baslik: t("hizli.3.baslik"), desc: t("hizli.3.desc") },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[24px] border border-brand-100 bg-gradient-to-br from-brand-50/60 via-surface to-surface p-5 lg:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-card"><Rocket className="size-4" /></span>
        <div>
          <h3 className="text-[15px] font-bold text-slate-ink">{t("hizli.baslik")}</h3>
          <p className="text-[12.5px] text-slate-muted">{t("hizli.aciklama")}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {kartlar.map((k, i) => (
          <div key={k.no} className="relative flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{k.ikon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="num text-[10.5px] font-bold text-slate-faint">{t("stepper.adim").replace("{n}", String(k.no))}</span>
              </div>
              <div className="text-[13.5px] font-semibold text-slate-ink">{k.baslik}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{k.desc}</p>
            </div>
            {/* oklar (son karttan sonra yok) */}
            {i < kartlar.length - 1 && (
              <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-brand-300 sm:block" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- CanliTest
 * Kullanıcının kurduğu widget'ı GERÇEKTEN test edebileceği canlı bölüm. Gerçek
 * /api/v1/challenge + /api/v1/verify çağrılır (WidgetOnizleme). Kullanıcı
 * kurulumun uçtan uca çalıştığını gözüyle görür. */
function CanliTest({ siteKey, t }: { siteKey: string; t: (k: string) => string }) {
  return (
    <Panel baslik={t("test.baslik")}>
      <p className="text-[13.5px] leading-relaxed text-slate-muted">{t("test.aciklama")}</p>
      <div className="mt-5 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="shrink-0">
          <WidgetOnizleme siteKey={siteKey} />
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-3">
          <PlayCircle className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <p className="text-[12.5px] leading-relaxed text-brand-900">{t("test.ipucu")}</p>
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- YardimBolumu
 * Her zaman görünür kaynak/yardım bağlantıları: Öğrenme Merkezi, API Test Alanı,
 * Dokümanlar. Kullanıcı takıldığında hızlı çıkış noktaları. */
function YardimBolumu({ t }: { t: (k: string) => string }) {
  const kaynaklar = [
    { href: "/panel/ogrenme", ikon: <BookOpen className="size-4" />, baslik: t("yardim.ogrenme.baslik"), desc: t("yardim.ogrenme.desc") },
    { href: "/panel/test-alani", ikon: <FlaskConical className="size-4" />, baslik: t("yardim.test.baslik"), desc: t("yardim.test.desc") },
    { href: "/panel/gelistirici", ikon: <FileText className="size-4" />, baslik: t("yardim.dok.baslik"), desc: t("yardim.dok.desc") },
  ];
  return (
    <div className="rounded-[24px] border border-line bg-surface p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-canvas text-slate-muted"><LifeBuoy className="size-4" /></span>
        <div>
          <h3 className="text-[15px] font-bold text-slate-ink">{t("yardim.baslik")}</h3>
          <p className="text-[12.5px] text-slate-muted">{t("yardim.aciklama")}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {kaynaklar.map((k) => (
          <Link
            key={k.href}
            href={k.href}
            className="group flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 p-4 transition hover:border-line-strong hover:bg-canvas"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{k.ikon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[13.5px] font-semibold text-slate-ink group-hover:text-brand-700">
                {k.baslik} <ArrowUpRight className="size-3.5 shrink-0 text-slate-faint transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{k.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- AdimDetay */

function AdimDetay({
  adim, tamam, aktif, onDogrula, yenileniyor, t, sureEtiket,
}: {
  adim: Adim; tamam: boolean; aktif: boolean;
  onDogrula: () => void; yenileniyor: boolean;
  t: (anahtar: string) => string;
  sureEtiket: (s: number | "aninda") => string;
}) {
  const [nasilAcik, setNasilAcik] = useState(false);
  // "Nasıl yapılır" adımları i18n'den (adim.<x>.nasil1..3) türetilir.
  const nasil = [t(`${adim.i18n}.nasil1`), t(`${adim.i18n}.nasil2`), t(`${adim.i18n}.nasil3`)];
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl",
            tamam ? "bg-ok-soft text-ok" : "bg-brand-50 text-brand-600",
          )}>
            {tamam ? <CheckCircle2 className="size-6" /> : adim.ikon}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="num text-[11px] font-bold text-slate-faint">{t("detay.adimNo").replace("{n}", String(adim.no))}</span>
              <h2 className="text-[17px] font-bold text-slate-ink">{t(`${adim.i18n}.ad`)}</h2>
              {tamam ? (
                <Badge ton="yesil"><Check className="size-3" /> {t("durum.tamamlandi")}</Badge>
              ) : aktif ? (
                <Badge ton="brand">{t("durum.siradaki")}</Badge>
              ) : (
                <Badge ton="gri">{t("durum.bekliyor")}</Badge>
              )}
            </div>
            <p className="mt-0.5 text-[13px] font-medium text-slate-muted">{t(`${adim.i18n}.ozet`)}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-slate-muted">
          <Clock className="size-3.5" /> {sureEtiket(adim.sure)}
        </span>
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed text-slate-muted">{t(`${adim.i18n}.aciklama`)}</p>

      {/* "ne kazanırsın" mikro-sonuç kutusu — bu adımı tamamlayınca ne elde edilir */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-600"><Gift className="size-4" /></span>
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-brand-600">{t("kazanim.etiket")}</div>
          <p className="mt-0.5 text-[13px] leading-relaxed text-brand-900">{t(`${adim.i18n}.kazanim`)}</p>
        </div>
      </div>

      {/* nasıl yapılır (genişletilebilir) */}
      <button
        onClick={() => setNasilAcik((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition hover:text-brand-700"
      >
        <Sparkles className="size-3.5" /> {t("nasilYapilir")}
        <ChevronDown className={cn("size-3.5 transition-transform", nasilAcik && "rotate-180")} />
      </button>
      {nasilAcik && (
        <ol className="mt-3 space-y-2 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          {nasil.map((n, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-brand-900">
              <span className="num mt-px grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{i + 1}</span>
              {n}
            </li>
          ))}
        </ol>
      )}

      {/* aksiyonlar */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {!tamam && (
          <Link
            href={adim.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800"
          >
            {t(`${adim.i18n}.cta`)} <ArrowRight className="size-3.5" />
          </Link>
        )}
        {adim.dogrulanabilir && (
          <button
            onClick={onDogrula}
            disabled={yenileniyor}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-slate-ink transition hover:bg-canvas disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", yenileniyor && "animate-spin")} /> {t("durumDogrula")}
          </button>
        )}
        {tamam && (
          <Link
            href={adim.href}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink"
          >
            {t("ayarlariAc")} <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- EntegrasyonRehberi */

function EntegrasyonRehberi({ siteKey, t }: { siteKey: string; t: (anahtar: string) => string }) {
  const [cerceve, setCerceve] = useState<Cerceve>("html");
  const [sunucu, setSunucu] = useState<"node" | "python">("node");
  const secili = CERCEVELER.find((c) => c.key === cerceve)!;

  return (
    <Panel baslik={t("rehber.baslik")}>
      {/* çerçeve seçici */}
      <div className="flex flex-wrap gap-2">
        {CERCEVELER.map((c) => (
          <button
            key={c.key}
            onClick={() => setCerceve(c.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
              cerceve === c.key
                ? "bg-ink-900 text-white shadow-card"
                : "border border-line bg-surface text-slate-muted hover:border-line-strong hover:text-slate-ink",
            )}
          >
            {c.ad}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-2.5">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
        <p className="text-[12.5px] leading-relaxed text-brand-900">
          {(() => {
            // {key} yer tutucusunu vurgulu <code> site anahtarıyla değiştir.
            const [once, sonra] = t("rehber.hazir").split("{key}");
            return <>{once}<code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11.5px] text-brand-700">{siteKey}</code>{sonra}</>;
          })()}
        </p>
      </div>

      <div className="mt-4">
        <KodBlok
          kod={istemciKodu(cerceve, siteKey)}
          dil={secili.dil}
          baslik={t("rehber.istemci").replace("{cerceve}", secili.ad)}
        />
      </div>

      {/* sunucu tarafı doğrulama */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-slate-muted" />
            <h4 className="text-[14px] font-semibold text-slate-ink">{t("rehber.sunucuBaslik")}</h4>
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">{t("rehber.gizliAnahtar")}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSunucu("node")}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition",
                sunucu === "node" ? "bg-ink-900 text-white" : "border border-line text-slate-muted hover:text-slate-ink")}
            >
              <TerminalSquare className="size-3.5" /> Node/Express
            </button>
            <button
              onClick={() => setSunucu("python")}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition",
                sunucu === "python" ? "bg-ink-900 text-white" : "border border-line text-slate-muted hover:text-slate-ink")}
            >
              <TerminalSquare className="size-3.5" /> Python/Flask
            </button>
          </div>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-muted">
          {(() => {
            // {uc} yer tutucusunu vurgulu <code> uç nokta yoluyla değiştir.
            const [once, sonra] = t("rehber.sunucuAciklama").split("{uc}");
            return <>{once}<code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px]">/api/v1/siteverify</code>{sonra}</>;
          })()}
        </p>
        <div className="mt-3">
          <KodBlok
            kod={sunucuKodu(sunucu, siteKey)}
            dil={sunucu === "node" ? "js" : "python"}
            baslik={sunucu === "node" ? t("rehber.nodeBaslik") : t("rehber.pythonBaslik")}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
        <Link href="/panel/gelistirici" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition hover:text-brand-700">
          {t("rehber.anahtarGoruntule")} <ArrowUpRight className="size-3.5" />
        </Link>
        <span className="text-slate-faint">·</span>
        <Link href="/panel/ogrenme" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition hover:text-brand-700">
          {t("rehber.ogrenmeMerkezi")} <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- IlerlemeHalkasi
 * Genel kurulum ilerlemesini yarım-daire yerine TAM daire progress-ring olarak
 * gösterir (Gauge'dan farklı görsel dil). Ortada yüzde + X/Y adım. Animasyon
 * yalnızca strokeDashoffset (opacity yok). */
function IlerlemeHalkasi({
  yuzde, tamam, toplam, bitti, t,
}: {
  yuzde: number; tamam: number; toplam: number; bitti: boolean; t: (k: string) => string;
}) {
  const r = 40;
  const cevre = 2 * Math.PI * r;
  const dolu = (yuzde / 100) * cevre;
  const renk = bitti ? "#16a34a" : "#2f6fed";
  return (
    <div className="relative grid size-[116px] shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e6e1d5" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={renk}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={{ strokeDashoffset: cevre }}
          animate={{ strokeDashoffset: cevre - dolu }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num text-[26px] font-bold leading-none text-slate-ink">%{yuzde}</span>
        <span className="mt-0.5 text-[11px] font-medium" style={{ color: renk }}>
          {bitti ? t("halka.tamam") : `${tamam}/${toplam} ${t("halka.adim")}`}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- OzetHap
 * Üst şeritteki küçük ikon + değer + etiket satırı (tamamlanan/kalan/süre). */
function OzetHap({
  ikon, deger, etiket, ton,
}: {
  ikon: React.ReactNode; deger: string; etiket: string; ton: "ok" | "brand" | "notr";
}) {
  const tonSinif =
    ton === "ok" ? "bg-ok-soft text-ok" : ton === "brand" ? "bg-brand-50 text-brand-600" : "bg-canvas text-slate-muted";
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tonSinif)}>{ikon}</span>
      <div className="min-w-0 leading-tight">
        <div className="num text-[15px] font-bold text-slate-ink">{deger}</div>
        <div className="truncate text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- SonrakiOneri */

function SonrakiOneri({ href, ikon, baslik, desc }: { href: string; ikon: React.ReactNode; baslik: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border border-line bg-white/70 p-4 transition hover:border-line-strong hover:bg-white">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{ikon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[13.5px] font-semibold text-slate-ink group-hover:text-brand-700">
          {baslik} <ChevronRight className="size-3.5 shrink-0 text-slate-faint transition group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{desc}</p>
      </div>
    </Link>
  );
}
