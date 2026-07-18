import Link from "next/link";
import {
  ArrowRight, Eye, Check, ShieldCheck, Bot, Zap, Gauge, Code2, Globe,
  Fingerprint, GitBranch, Sparkles, Lock, Activity, Server, Layers,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { HeroGorsel, GhostFontGorsel, IzgaraArka, UrunEkranGorseli, AiAjanKoruma, Gorsel } from "@/components/site/gorseller";
import { GhostHero } from "@/components/site/GhostHero";
import { AkisDiyagram, MimariSema } from "@/components/site/illustrasyonlar";
import { MarkaLogo, GUVEN_MARKALARI } from "@/components/site/marka-logolari";
import { Faq, SORULAR } from "@/components/site/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { MARKA } from "@/lib/marka";
import { PLANLAR as PLAN_KAYNAK } from "@/lib/specter/plans";
import { landingDil } from "@/lib/i18n/landing-sunucu";
import { landingCeviri, type LandingDil } from "@/lib/i18n/landing";

/** Bölümlere geçirilen çeviri yardımcısı tipi. */
type T = (anahtar: string) => string;

export default async function LandingPage() {
  const dil = await landingDil();
  const t: T = (k) => landingCeviri(k, dil);
  return (
    <>
      <JsonLd sss={SORULAR} />
      <Hero t={t} dil={dil} />
      <LogoStrip t={t} />
      <Problem t={t} />
      <GhostFont t={t} dil={dil} />
      <HowItWorks t={t} />
      <Features t={t} />
      <UrunOnizleme t={t} dil={dil} />
      <AiKoruma t={t} dil={dil} />
      <Compare t={t} />
      <Testimonials t={t} />
      <Stats t={t} />
      <Guven t={t} />
      <Entegrasyonlar t={t} />
      <CodeSection t={t} />
      <Pricing t={t} />
      <Faq />
      <FinalCta t={t} />
    </>
  );
}

/* ============================================================ HERO */
function Hero({ t, dil }: { t: T; dil: LandingDil }) {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-20 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal>
            <Badge variant="indigo">
              <Sparkles className="size-3.5" /> {t("hero.rozet")}
            </Badge>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[54px]">
              {t("hero.baslik1")}{" "}
              <Highlight variant="gradient">{MARKA.ad}</Highlight> {t("hero.baslik2")}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
              {t("hero.aciklama")}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
              >
                {t("hero.cta1")} <ArrowRight className="size-[18px]" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-veylify-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:border-veylify-300 hover:bg-veylify-50"
              >
                <Eye className="size-[18px]" /> {t("hero.cta2")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={4}>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-500">
              {[t("hero.rozet1"), t("hero.rozet2"), t("hero.rozet3")].map((r) => (
                <span key={r} className="flex items-center gap-1.5">
                  <Check className="size-4 text-veylify-600" /> {r}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={2} className="zn-float space-y-5">
          {/* Gerçek üretilmiş hero görseli — insan siluetinin kalkandan geçişi,
              dağılan AI botları. Ürünün vaadini tek bakışta anlatır. */}
          <Gorsel ad="hero" alt={t("hero.gorselAlt")} oran="16/11" oncelik />
          <HeroGorsel dil={dil} />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ LOGO STRIP */
function LogoStrip({ t }: { t: T }) {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[13px] font-medium uppercase tracking-wider text-slate-400">
          {t("logo.baslik")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {GUVEN_MARKALARI.map((ad) => (
            <MarkaLogo key={ad} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ PROBLEM */
function Problem({ t }: { t: T }) {
  const kartlar = [
    { ikon: Bot, baslik: t("problem.k1.baslik"), metin: t("problem.k1.metin") },
    { ikon: Server, baslik: t("problem.k2.baslik"), metin: t("problem.k2.metin") },
    { ikon: Zap, baslik: t("problem.k3.baslik"), metin: t("problem.k3.metin") },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("problem.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("problem.baslik")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {t("problem.aciklama")}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {kartlar.map((k, i) => (
            <Reveal key={k.baslik} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6 transition hover:border-veylify-200 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                  <k.ikon className="size-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-veylify-950">{k.baslik}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{k.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ GHOST-FONT */
function GhostFont({ t, dil }: { t: T; dil: LandingDil }) {
  return (
    <section className="relative overflow-hidden bg-veylify-950 px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -right-20 top-0 -z-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-200 ring-1 ring-white/10">
            <Eye className="size-3.5" /> {t("ghost.rozet")}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t("ghost.baslik")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            {t("ghost.aciklama")}
          </p>
        </div>
        {/* Gerçek ghost-font görseli — okunabilir ama taranamaz yüzey. */}
        <div className="mt-12">
          <Gorsel
            ad="kavram-ghost-yazit"
            alt={t("ghost.gorselAlt")}
            oran="21/9"
          />
        </div>
        {/* canlı interaktif demo (gerçek motor) + statik karşılaştırma */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
              <span className="rounded-full bg-veylify-600 px-2.5 py-1 text-[11px] uppercase tracking-wide">{t("ghost.dene")}</span>
              {t("ghost.deneMetin")}
            </div>
            <GhostHero />
          </div>
          <GhostFontGorsel dil={dil} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================ HOW IT WORKS */
function HowItWorks({ t }: { t: T }) {
  const adimlar = [
    { no: "01", ikon: Code2, baslik: t("nasil.a1.baslik"), metin: t("nasil.a1.metin") },
    { no: "02", ikon: Activity, baslik: t("nasil.a2.baslik"), metin: t("nasil.a2.metin") },
    { no: "03", ikon: ShieldCheck, baslik: t("nasil.a3.baslik"), metin: t("nasil.a3.metin") },
  ];
  return (
    <section id="nasil" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("nasil.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("nasil.baslik")}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {adimlar.map((a, i) => (
            <Reveal key={a.no} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="relative h-full rounded-2xl border border-veylify-100 bg-white p-6">
                <span className="text-[13px] font-bold text-veylify-300">{a.no}</span>
                <span className="mt-3 grid size-11 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                  <a.ikon className="size-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-veylify-950">{a.baslik}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{a.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
        {/* görsel: katmanlı savunma hunisi + mimari akış */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <AkisDiyagram />
          </Reveal>
          <Reveal delay={1} className="flex flex-col justify-center gap-5">
            <MimariSema />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["48ms", t("nasil.stat1")], ["5", t("nasil.stat2")], ["%0", t("nasil.stat3")]].map(([d, e]) => (
                <div key={e} className="rounded-2xl border border-veylify-100 bg-white p-4">
                  <div className="bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-2xl font-extrabold text-transparent">{d}</div>
                  <div className="mt-0.5 text-[11.5px] font-medium text-slate-500">{e}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ FEATURES */
function Features({ t }: { t: T }) {
  const ozellikler = [
    { ikon: Eye, baslik: t("ozellik.f1.baslik"), metin: t("ozellik.f1.metin") },
    { ikon: Fingerprint, baslik: t("ozellik.f2.baslik"), metin: t("ozellik.f2.metin") },
    { ikon: GitBranch, baslik: t("ozellik.f3.baslik"), metin: t("ozellik.f3.metin") },
    { ikon: Lock, baslik: t("ozellik.f4.baslik"), metin: t("ozellik.f4.metin") },
    { ikon: Bot, baslik: t("ozellik.f5.baslik"), metin: t("ozellik.f5.metin") },
    { ikon: Globe, baslik: t("ozellik.f6.baslik"), metin: t("ozellik.f6.metin") },
    { ikon: Gauge, baslik: t("ozellik.f7.baslik"), metin: t("ozellik.f7.metin") },
    { ikon: Layers, baslik: t("ozellik.f8.baslik"), metin: t("ozellik.f8.metin") },
  ];
  return (
    <section id="ozellikler" className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("ozellik.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("ozellik.baslik")}
          </h2>
        </Reveal>
        {/* Üç sütunlu görsel şerit — katmanlı savunmanın görsel dili. */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { ad: "ozellik-davranis", alt: t("ozellik.gorsel1Alt") },
            { ad: "ozellik-powkanit", alt: t("ozellik.gorsel2Alt") },
            { ad: "kavram-katmanli-savunma", alt: t("ozellik.gorsel3Alt") },
          ].map((g) => (
            <Reveal key={g.ad}>
              <Gorsel ad={g.ad} alt={g.alt} oran="16/11" />
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ozellikler.map((o, i) => (
            <Reveal key={o.baslik} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <span className="grid size-10 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                  <o.ikon className="size-[18px]" />
                </span>
                <h3 className="mt-3.5 text-[15px] font-bold text-veylify-950">{o.baslik}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{o.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ ÜRÜN ÖNİZLEME */
function UrunOnizleme({ t, dil }: { t: T; dil: LandingDil }) {
  const noktalar = [
    { ikon: Activity, baslik: t("urun.n1.baslik"), metin: t("urun.n1.metin") },
    { ikon: Bot, baslik: t("urun.n2.baslik"), metin: t("urun.n2.metin") },
    { ikon: Gauge, baslik: t("urun.n3.baslik"), metin: t("urun.n3.metin") },
  ];
  return (
    <section className="relative overflow-hidden px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-20 -z-10 size-80 rounded-full bg-veylify-100/40 blur-3xl" />
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("urun.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("urun.baslik")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {t("urun.aciklama")}
          </p>
        </Reveal>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <Reveal className="space-y-5">
            <Gorsel ad="panel-soc" alt={t("urun.gorselAlt")} oran="16/10" />
            <UrunEkranGorseli dil={dil} />
          </Reveal>
          <Reveal delay={1} className="flex flex-col gap-5">
            {noktalar.map((n) => (
              <div key={n.baslik} className="flex items-start gap-3.5 rounded-2xl border border-veylify-100 bg-white p-5 transition hover:border-veylify-200 hover:shadow-[0_18px_44px_-24px_rgba(79,70,229,0.3)]">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                  <n.ikon className="size-5" />
                </span>
                <div>
                  <h3 className="text-[15.5px] font-bold text-veylify-950">{n.baslik}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">{n.metin}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ AI-AJAN KORUMASI */
function AiKoruma({ t, dil }: { t: T; dil: LandingDil }) {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <Badge variant="indigo">{t("aikoruma.rozet")}</Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
              {t("aikoruma.baslik")}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              {t("aikoruma.aciklama")}
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {[
                t("aikoruma.m1"),
                t("aikoruma.m2"),
                t("aikoruma.m3"),
              ].map((m) => (
                <span key={m} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="mt-0.5 size-[18px] shrink-0 text-veylify-600" /> {m}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={1} className="space-y-5">
            <Gorsel ad="ai-ajan" alt={t("aikoruma.gorselAlt")} oran="16/11" />
            <AiAjanKoruma dil={dil} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ COMPARE */
function Compare({ t }: { t: T }) {
  // Karşılaştırma "Klasik CAPTCHA" (statik görüntü tabanlı) ile — her satır
  // ürünün GERÇEK yeteneğini yansıtır (yanıltıcı karşılaştırma yasal risk).
  const satirlar: [string, boolean, boolean][] = [
    [t("compare.s1"), true, false],
    [t("compare.s2"), true, false],
    [t("compare.s3"), true, false],
    [t("compare.s4"), true, false],
    [t("compare.s5"), true, false],
    [t("compare.s6"), true, false],
    ["reCAPTCHA uyumlu siteverify API", true, true],
  ];
  return (
    <section id="karsilastirma" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("compare.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("compare.baslik")}
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-veylify-100 bg-white">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-veylify-100 bg-veylify-50/50 px-5 py-4 text-[13px] font-semibold">
              <span className="text-slate-500">Özellik</span>
              <span className="text-center text-veylify-700">{MARKA.ad}</span>
              <span className="text-center text-slate-400">{t("compare.klasik")}</span>
            </div>
            {satirlar.map(([ad, z, k], i) => (
              <div
                key={i}
                className="grid grid-cols-[1.6fr_1fr_1fr] items-center border-b border-veylify-100/70 px-5 py-3.5 text-[14px] last:border-0"
              >
                <span className="font-medium text-veylify-950">{ad}</span>
                <span className="flex justify-center">
                  {z ? <Check className="size-5 text-emerald-500" /> : <span className="text-slate-300">—</span>}
                </span>
                <span className="flex justify-center">
                  {k ? <Check className="size-5 text-slate-400" /> : <span className="text-slate-300">—</span>}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ TESTIMONIALS */
function Testimonials({ t }: { t: T }) {
  const yorumlar = [
    {
      metin: "reCAPTCHA'dan geçiş: görünmez mod ile gerçek kullanıcılar hiç sürtünme yaşamadan, bot trafiği davranış skoru + kural motoruyla eleniyor.",
      ad: "E-ticaret", unvan: "Yüksek trafikli kayıt/checkout", bas: "🛒", renk: "#4f46e5",
    },
    {
      metin: "İçerik kazıma savunması: GPTBot ve ClaudeBot TLS/JA3 parmak izi + AI-ajan politikasıyla yakalanır — içeriğiniz AI eğitim verisi olmaktan çıkar.",
      ad: "İçerik Platformu", unvan: "AI kazıyıcı koruması", bas: "📰", renk: "#7c3aed",
    },
    {
      metin: "Kimlik doldurma (credential stuffing): kural motoru + davranış biyometrisi + PoW ile login sayfası korunur; kurulum ortalama 10 dakika.",
      ad: "SaaS / Giriş", unvan: "Hesap ele geçirme önleme", bas: "🔐", renk: "#db2777",
    },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("yorum.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("yorum.baslik")}
          </h2>
          <p className="mt-3 text-[15px] text-veylify-600">
            Aşağıdaki senaryolar, Veylify'ın gerçek yeteneklerini gösteren temsili örneklerdir.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {yorumlar.map((y, i) => (
            <Reveal key={y.ad} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <figure className="flex h-full flex-col rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(79,70,229,0.35)]">
                <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-veylify-50 px-2.5 py-1 text-[11px] font-semibold text-veylify-700">
                  <ShieldCheck className="size-3.5" /> Kullanım senaryosu
                </div>
                <p className="flex-1 text-[14.5px] leading-relaxed text-slate-700">
                  {y.metin}
                </p>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-veylify-100 pt-4">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                    style={{ background: y.renk }}
                  >
                    {y.bas}
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-bold text-veylify-950">{y.ad}</span>
                    <span className="block text-[12px] text-slate-500">{y.unvan}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ STATS */
function Stats({ t }: { t: T }) {
  const stats: [string, string][] = [
    ["%100", t("stat.1")],
    ["48ms", t("stat.2")],
    ["15+", t("stat.3")],
    ["%99.4", t("stat.4")],
  ];
  return (
    <section className="bg-gradient-to-br from-veylify-600 to-violet-600 px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 text-center sm:grid-cols-4">
        {stats.map(([d, e]) => (
          <Reveal key={e}>
            <div className="text-4xl font-extrabold tabular-nums text-white sm:text-5xl">{d}</div>
            <div className="mt-2 text-[13px] font-medium text-white/70">{e}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================ CODE */
function CodeSection({ t }: { t: T }) {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Badge variant="indigo">{t("kod.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("kod.baslik")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {t("kod.aciklama")}
          </p>
          <ul className="mt-6 space-y-3">
            {[t("kod.m1"), t("kod.m2"), t("kod.m3")].map((m) => (
              <li key={m} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                <Check className="size-[18px] text-veylify-600" /> {m}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={1}>
          <div className="overflow-hidden rounded-2xl border border-veylify-900/10 bg-veylify-950 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.4)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-3 rounded-full bg-red-400/70" />
              <span className="size-3 rounded-full bg-amber-400/70" />
              <span className="size-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-[11px] font-medium text-white/40">verify.js</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
              <code className="font-mono text-veylify-100">
{`const res = await fetch(
  "https://api.${MARKA.domain}/v1/verify",
  {
    method: "POST",
    headers: { "X-Api-Key": KEY },
    body: JSON.stringify({ token }),
  }
);

const { success, verdict, score } = await res.json();
// verdict: "allowed" | "challenged" | "blocked"
if (verdict !== "allowed") return blockRequest();`}
              </code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ PRICING */
function Pricing({ t }: { t: T }) {
  // Tek kaynak: plan adları/fiyatları/limitleri plans.ts'ten türetilir (landing = müşteriye söz).
  const num = (n: number) => (n >= 100000000 ? t("fiyat.sinirsiz") : n.toLocaleString("tr-TR"));
  const f = PLAN_KAYNAK.free, p2 = PLAN_KAYNAK.pro, s = PLAN_KAYNAK.scale;
  const planlar = [
    { ad: f.ad, fiyat: f.fiyat.replace("/ay", ""), period: "/ay", ozet: t("fiyat.free.ozet"), vurgu: false,
      ozellikler: [`${num(f.dogrulamaKotasi)} ${t("fiyat.dogrulamaAy")}`, t("fiyat.ghostfont"), `${f.siteLimiti} ${t("fiyat.site")}`, t("fiyat.toplulukDestek")] },
    { ad: p2.ad, fiyat: p2.fiyat.replace("/ay", ""), period: "/ay", ozet: t("fiyat.pro.ozet"), vurgu: true,
      ozellikler: [`${num(p2.dogrulamaKotasi)} ${t("fiyat.dogrulamaAy")}`, t("fiyat.tumKatman"), `${p2.siteLimiti} ${t("fiyat.site")}`, t("fiyat.kuralGorunmez"), t("fiyat.oncelikDestek")] },
    { ad: s.ad, fiyat: s.fiyat, period: "", ozet: t("fiyat.scale.ozet"), vurgu: false, ozel: true,
      ozellikler: [t("fiyat.sinirsizDog"), t("fiyat.ozelSla"), t("fiyat.sinirsizSite"), t("fiyat.adanmisMuh"), t("fiyat.onpremise")] },
  ];
  return (
    <section id="fiyat" className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("fiyat.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("fiyat.baslik")}
          </h2>
          <p className="mt-4 text-[16px] text-slate-600">{t("fiyat.aciklama")}</p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {planlar.map((p, i) => (
            <Reveal key={p.ad} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 transition ${
                  p.vurgu
                    ? "border-veylify-600 bg-white shadow-[0_30px_70px_-30px_rgba(79,70,229,0.5)] ring-1 ring-veylify-600"
                    : "border-veylify-100 bg-white"
                }`}
              >
                {p.vurgu && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-veylify-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <Sparkles className="size-3" /> {t("fiyat.populer")}
                  </span>
                )}
                <h3 className="text-[15px] font-bold text-veylify-950">{p.ad}</h3>
                <p className="mt-1 text-[13px] text-slate-500">{p.ozet}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-veylify-950">{p.fiyat}</span>
                  <span className="text-[14px] text-slate-400">{p.period}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.ozellikler.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-veylify-600" /> {o}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.ozel ? "/iletisim" : "/kayit"}
                  className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                    p.vurgu
                      ? "bg-veylify-600 text-white hover:bg-veylify-700"
                      : "border border-veylify-200 bg-white text-veylify-700 hover:bg-veylify-50"
                  }`}
                >
                  {p.ozel ? t("fiyat.iletisim") : t("fiyat.basla")} <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ GÜVEN & UYUMLULUK */
function Guven({ t }: { t: T }) {
  const rozetler = [
    { ikon: ShieldCheck, ad: t("guven.r1.ad"), alt: t("guven.r1.alt") },
    { ikon: Lock, ad: t("guven.r2.ad"), alt: t("guven.r2.alt") },
    { ikon: Server, ad: t("guven.r3.ad"), alt: t("guven.r3.alt") },
    { ikon: Globe, ad: t("guven.r4.ad"), alt: t("guven.r4.alt") },
    { ikon: Activity, ad: t("guven.r5.ad"), alt: t("guven.r5.alt") },
    { ikon: Fingerprint, ad: t("guven.r6.ad"), alt: t("guven.r6.alt") },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">{t("guven.rozet")}</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            {t("guven.baslik")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {t("guven.aciklama")}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rozetler.map((r, i) => (
            <Reveal key={r.ad} delay={(((i % 3) + 1) as 1 | 2 | 3)}>
              <div className="flex h-full items-start gap-3.5 rounded-2xl border border-veylify-100 bg-white p-5 transition hover:border-veylify-200 hover:shadow-[0_18px_44px_-24px_rgba(79,70,229,0.3)]">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <r.ikon className="size-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-veylify-950">{r.ad}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{r.alt}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ ENTEGRASYONLAR */
function Entegrasyonlar({ t }: { t: T }) {
  const araclar = [
    { ad: "WordPress", ikon: Globe },
    { ad: "Shopify", ikon: Server },
    { ad: "Next.js", ikon: Code2 },
    { ad: "Cloudflare", ikon: Globe },
    { ad: "Slack", ikon: Zap },
    { ad: "Webhook", ikon: GitBranch },
    { ad: "React", ikon: Code2 },
    { ad: "Nginx", ikon: Server },
    { ad: "Zapier", ikon: Zap },
    { ad: "PHP / Laravel", ikon: Code2 },
    { ad: "Python", ikon: Code2 },
    { ad: "cURL / REST", ikon: Server },
  ];
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <Badge variant="indigo">{t("enteg.rozet")}</Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
              {t("enteg.baslik")}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              {t("enteg.aciklama")}
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {[
                t("enteg.m1"),
                t("enteg.m2"),
                t("enteg.m3"),
              ].map((m) => (
                <span key={m} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                  <Check className="size-[18px] shrink-0 text-veylify-600" /> {m}
                </span>
              ))}
            </div>
            <Link
              href="/nasil-calisir"
              className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-veylify-600 transition hover:gap-3 hover:text-veylify-700"
            >
              {t("enteg.link")} <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={1}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {araclar.map((a) => (
                <div
                  key={a.ad}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-veylify-100 bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-veylify-200 hover:shadow-[0_16px_40px_-24px_rgba(79,70,229,0.3)]"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                    <a.ikon className="size-[18px]" />
                  </span>
                  <span className="text-[11.5px] font-semibold text-slate-600">{a.ad}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ FINAL CTA */
function FinalCta({ t }: { t: T }) {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t("cta.baslik")}
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          {t("cta.aciklama")}
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            {t("cta.buton1")} <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Eye className="size-[18px]" /> {t("cta.buton2")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
