import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Eye, Check, ShieldCheck, Bot, Fingerprint, GitBranch,
  Lock, Globe, Layers, Gauge, Activity, Server, Cpu, Radio, Network,
  Sparkles, Terminal,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { GhostFontGorsel, IzgaraArka } from "@/components/site/gorseller";
import { AkisDiyagram, OzellikIzgara, VuruStat } from "@/components/site/illustrasyonlar";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Özellikler",
  description:
    "Ghost-font CAPTCHA, davranış biyometrisi, kural motoru, görünmez mod ve çok-katmanlı savunma — Veylify'nin AI botlarını durduran teknoloji katmanları.",
  alternates: { canonical: "/ozellikler" },
  openGraph: {
    title: `Özellikler — ${MARKA.ad}`,
    description:
      "Ghost-font CAPTCHA, davranış biyometrisi, kural motoru ve görünmez mod — AI botlarını durduran çok-katmanlı savunma.",
    url: `${MARKA.url}/ozellikler`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function OzelliklerPage() {
  return (
    <>
      <Hero />
      <OzetIzgara />
      <GhostFontBolum />
      <DavranisBolum />
      <KuralMotoruBolum />
      <GorunmezModBolum />
      <AjanKatalogBolum />
      <CografiBolum />
      <TlsBolum />
      <KatmanliBolum />
      <FinalCta />
    </>
  );
}

/* ============================================================ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-16 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge variant="indigo">
            <Layers className="size-3.5" /> Özellikler
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            Tek bir hile değil, <Highlight variant="gradient">bütün bir savunma platformu</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            {MARKA.ad}, AI botlarını durdurmak için tek katmana güvenmez. Ghost-font
            doğrulamadan davranış biyometrisine, kural motorundan TLS parmak izine
            kadar birbirini tamamlayan katmanlar, hiçbir kazıyıcının aşamadığı bir
            duvar oluşturur.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/kayit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
            >
              Ücretsiz başla <ArrowRight className="size-[18px]" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-veylify-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:border-veylify-300 hover:bg-veylify-50"
            >
              <Eye className="size-[18px]" /> Canlı demo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ ÖZET IZGARA */
function OzetIzgara() {
  const ozellikler = [
    { ikon: Eye, baslik: "Ghost-font CAPTCHA", metin: "Temporal dithering — OCR'ı %100 kör eder, insanı hiç yormaz." },
    { ikon: Fingerprint, baslik: "Davranış biyometrisi", metin: "Fare, tuş ve dokunuş dinamiğinden insan-bot ayrımı." },
    { ikon: GitBranch, baslik: "Kural motoru", metin: "Path, ülke, ASN, bot sınıfıyla özel politikalar; canlı playground." },
    { ikon: Lock, baslik: "Görünmez mod", metin: "Challenge göstermeden, reCAPTCHA v3 gibi arka planda skorla." },
    { ikon: Bot, baslik: "AI ajan kataloğu", metin: "GPTBot, ClaudeBot, Bytespider — 15+ crawler'ı UA + TLS ile doğrula." },
    { ikon: Globe, baslik: "Coğrafi & ASN istihbaratı", metin: "Datacenter, VPN, botnet trafiğini kaynağından yakala." },
    { ikon: Cpu, baslik: "TLS parmak izi", metin: "JA4/JA3 imzasıyla sahte tarayıcı istemcilerini ortaya çıkar." },
    { ikon: Layers, baslik: "Çok-katmanlı savunma", metin: "Bir katman atlansa diğeri yakalar — defense in depth." },
  ];
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Sekiz katman, tek entegrasyon
          </h2>
          <p className="mt-3 text-[15px] text-slate-600">
            Aşağıda her katmanı ayrıntısıyla inceleyin — hepsi tek satır kurulumla gelir.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

/* ---------- yeniden kullanılabilir alternatif bölüm iskeleti ---------- */
function OzellikBolum({
  rozet, baslik, vurgu, metin, maddeler, gorsel, sagda = false, koyu = false,
}: {
  rozet: string;
  baslik: React.ReactNode;
  vurgu?: React.ReactNode;
  metin: string;
  maddeler: string[];
  gorsel: React.ReactNode;
  sagda?: boolean;
  koyu?: boolean;
}) {
  return (
    <section className={koyu ? "bg-veylify-950 px-5 py-20 lg:px-8" : "px-5 py-20 lg:px-8"}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal className={sagda ? "lg:order-2" : ""}>
          <span
            className={
              koyu
                ? "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-200 ring-1 ring-white/10"
                : "inline-flex items-center gap-1.5 rounded-full bg-veylify-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-700 ring-1 ring-veylify-100"
            }
          >
            {rozet}
          </span>
          <h2 className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${koyu ? "text-white" : "text-veylify-950"}`}>
            {baslik} {vurgu && <Highlight variant="gradient">{vurgu}</Highlight>}
          </h2>
          <p className={`mt-4 text-[16px] leading-relaxed ${koyu ? "text-white/60" : "text-slate-600"}`}>
            {metin}
          </p>
          <ul className="mt-6 space-y-3">
            {maddeler.map((m) => (
              <li key={m} className={`flex items-start gap-2.5 text-[14px] ${koyu ? "text-white/80" : "text-slate-700"}`}>
                <Check className={`mt-0.5 size-[18px] shrink-0 ${koyu ? "text-veylify-300" : "text-veylify-600"}`} /> {m}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={1} className={sagda ? "lg:order-1" : ""}>
          {gorsel}
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ GHOST-FONT (koyu) */
function GhostFontBolum() {
  return (
    <section className="relative overflow-hidden bg-veylify-950 px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -right-20 top-0 -z-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-200 ring-1 ring-white/10">
            <Eye className="size-3.5" /> Ghost-font CAPTCHA
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            İnsan görür. Makine göremez.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Temporal dithering ile karakterler tek karede gürültüye gömülür; yalnızca
            hareket koheransını algılayan insan gözü okur. Ekran görüntüsü alan AI bile
            sahte bir mesaj görür — OCR sonucu her zaman boş döner.
          </p>
        </div>
        <div className="mt-12">
          <GhostFontGorsel />
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            ["%100", "OCR körlüğü (kanıtlı)"],
            ["0", "insana ek yük — 1 saniyede okunur"],
            ["∞", "her yüklemede yeni gürültü deseni"],
          ].map(([d, e]) => (
            <div key={e} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <div className="bg-gradient-to-r from-veylify-300 to-violet-300 bg-clip-text text-2xl font-extrabold tabular-nums text-transparent">{d}</div>
              <div className="mt-1 text-[12.5px] font-medium text-white/50">{e}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ DAVRANIŞ */
function DavranisBolum() {
  return (
    <OzellikBolum
      rozet="Davranış biyometrisi"
      baslik="Nasıl hareket ettiğin"
      vurgu="kim olduğunu ele verir"
      metin="Gerçek bir insanın fare eğrileri, tuşlama ritmi ve dokunuş jestleri organik gürültü taşır. Botların ürettiği hareket ise fazla düzgün, fazla doğrusal, fazla tekrarlıdır. Veylify bu mikro-desenleri milisaniyeler içinde skorlar."
      maddeler={[
        "İmleç ivmesi, duraklama ve Bézier eğrisi analizi",
        "Tuşlama arası zamanlama (keystroke dynamics) parmak izi",
        "Mobil dokunuş basıncı ve jiroskop sinyalleri",
        "Oturum boyunca sürekli, pasif skorlama",
      ]}
      gorsel={
        <div className="rounded-3xl border border-veylify-100 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-veylify-950">
              <Activity className="size-4 text-veylify-600" /> İmleç izi analizi
            </span>
            <span className="rounded-full bg-veylify-50 px-2.5 py-1 text-[11px] font-semibold text-veylify-600 ring-1 ring-veylify-100">
              skor 0.97
            </span>
          </div>
          <svg viewBox="0 0 320 150" className="w-full" aria-hidden>
            <path d="M10 130 C60 40 120 120 160 70 S260 20 310 60" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M10 20 H310" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="2 5" strokeLinecap="round" />
            <circle cx="10" cy="130" r="4" fill="#4f46e5" />
            <circle cx="310" cy="60" r="4" fill="#7c3aed" />
          </svg>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="text-[11px] font-medium text-emerald-700">İnsan eğrisi</div>
              <div className="mt-0.5 text-[13px] font-bold text-emerald-800">organik ✓</div>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
              <div className="text-[11px] font-medium text-red-700">Bot çizgisi</div>
              <div className="mt-0.5 text-[13px] font-bold text-red-800">doğrusal ✕</div>
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ============================================================ KURAL MOTORU */
function KuralMotoruBolum() {
  return (
    <OzellikBolum
      sagda
      rozet="Kural motoru"
      baslik="Politikalarını"
      vurgu="sen yaz"
      metin="Her site aynı değildir. Veylify'nin görsel kural motoruyla path, ülke, ASN, bot sınıfı ve davranış skoruna göre koşullar tanımla; izin ver, doğrula ya da engelle. Canlı playground'da anında test et, üretime saniyede yay."
      maddeler={[
        "IF / THEN kural zincirleri — kod yazmadan",
        "Path, coğrafya, ASN, UA ve skor eşiklerine göre dallanma",
        "Canlı playground: kuralı gerçek trafiğe karşı dene",
        "Versiyonlama ve anlık geri alma",
      ]}
      gorsel={
        <div className="rounded-3xl border border-veylify-100 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-veylify-950">
            <GitBranch className="size-4 text-veylify-600" /> Kural zinciri
          </div>
          <div className="space-y-2.5 text-[12.5px]">
            {[
              { k: "path = /api/*", v: "hız sınırı 60/dk", renk: "cyan" },
              { k: "ülke ∈ {datacenter}", v: "ghost-font zorunlu", renk: "indigo" },
              { k: "UA ∈ AI katalog", v: "engelle", renk: "red" },
              { k: "skor > 0.9", v: "sürtünmesiz geç", renk: "emerald" },
            ].map((r) => (
              <div key={r.k} className="flex items-center gap-2 rounded-xl border border-veylify-100 bg-veylify-50/40 px-3 py-2.5">
                <span className="rounded-md bg-veylify-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-veylify-700">IF</span>
                <span className="font-mono text-veylify-950">{r.k}</span>
                <ArrowRight className="ml-auto size-3.5 text-slate-400" />
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  r.renk === "red" ? "bg-red-50 text-red-700"
                  : r.renk === "emerald" ? "bg-emerald-50 text-emerald-700"
                  : "bg-veylify-100 text-veylify-700"
                }`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

/* ============================================================ GÖRÜNMEZ MOD */
function GorunmezModBolum() {
  return (
    <OzellikBolum
      rozet="Görünmez mod"
      baslik="Meşru kullanıcı"
      vurgu="hiç challenge görmez"
      metin="reCAPTCHA v3 ve Turnstile mantığında Veylify, davranış skoru yüksek ziyaretçileri arka planda sessizce geçirir. Yalnızca şüpheli istekler ghost-font challenge'a düşer. Sonuç: sıfır sürtünme, maksimum koruma."
      maddeler={[
        "Pasif skorlama — kullanıcı hiçbir şey yapmaz",
        "Yalnızca riskli oturumlarda görünür challenge",
        "Dönüşüm oranını düşürmeden bot filtreleme",
        "Eşiği kendi risk iştahına göre ayarla",
      ]}
      sagda
      gorsel={
        <div className="rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/60 to-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-veylify-950">
            <Lock className="size-4 text-veylify-600" /> Risk eşiği
          </div>
          <div className="space-y-3">
            {[
              { ad: "Düşük risk (0–0.3)", karar: "Sürtünmesiz geç", pct: 82, renk: "emerald" },
              { ad: "Orta risk (0.3–0.7)", karar: "Ghost-font challenge", pct: 13, renk: "amber" },
              { ad: "Yüksek risk (0.7–1)", karar: "Engelle", pct: 5, renk: "red" },
            ].map((r) => (
              <div key={r.ad}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-veylify-950">{r.ad}</span>
                  <span className="text-slate-500">{r.karar}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-veylify-100">
                  <div className={`h-full rounded-full ${
                    r.renk === "emerald" ? "bg-emerald-500" : r.renk === "amber" ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

/* ============================================================ AI AJAN KATALOĞU (koyu) */
function AjanKatalogBolum() {
  const ajanlar = [
    { ad: "GPTBot", sirket: "OpenAI", durum: "engel" },
    { ad: "ClaudeBot", sirket: "Anthropic", durum: "engel" },
    { ad: "Bytespider", sirket: "ByteDance", durum: "engel" },
    { ad: "Google-Extended", sirket: "Google", durum: "kural" },
    { ad: "CCBot", sirket: "Common Crawl", durum: "engel" },
    { ad: "PerplexityBot", sirket: "Perplexity", durum: "kural" },
    { ad: "Scrapy", sirket: "kütüphane", durum: "engel" },
    { ad: "Amazonbot", sirket: "Amazon", durum: "kural" },
  ];
  return (
    <section className="relative overflow-hidden bg-veylify-950 px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-veylify-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-200 ring-1 ring-white/10">
            <Bot className="size-3.5" /> AI ajan kataloğu
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            15+ crawler'ı isimden değil, imzadan tanı
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Botlar user-agent'ı yalan söyleyebilir. Veylify her ajanı UA + TLS parmak izi +
            IP aralığı üçlüsüyle çapraz doğrular. Hangisini engelleyeceğine sen karar verirsin.
          </p>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ajanlar.map((a) => (
            <Reveal key={a.ad} delay={1}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-veylify-200 ring-1 ring-white/10">
                    <Bot className="size-4" />
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    a.durum === "engel" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"
                  }`}>
                    {a.durum === "engel" ? "Engelli" : "Kurala bağlı"}
                  </span>
                </div>
                <div className="mt-3 font-mono text-[13px] font-bold text-white">{a.ad}</div>
                <div className="text-[11.5px] text-white/40">{a.sirket}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ COĞRAFİ & ASN */
function CografiBolum() {
  return (
    <OzellikBolum
      rozet="Coğrafi & ASN istihbaratı"
      baslik="Tehdidi"
      vurgu="kaynağından yakala"
      metin="Kazıyıcı trafiğin büyük kısmı datacenter IP'lerinden, kiralık VPN'lerden ve botnet'lerden gelir. Veylify her isteği güncel ASN itibar veritabanıyla eşler; şüpheli kaynağı daha ilk pakette işaretler."
      maddeler={[
        "Datacenter, VPN ve proxy trafiği tespiti",
        "Bilinen botnet ve kötü amaçlı ASN listeleri",
        "Ülke / bölge bazlı politika ve hız sınırı",
        "Gerçek zamanlı güncellenen itibar puanı",
      ]}
      gorsel={<AkisDiyagram />}
    />
  );
}

/* ============================================================ TLS PARMAK İZİ */
function TlsBolum() {
  return (
    <OzellikBolum
      sagda
      rozet="TLS parmak izi"
      baslik="Sahte tarayıcıyı"
      vurgu="el sıkışmadan tanı"
      metin="Bir bot kendini Chrome gibi tanıtabilir, ama TLS el sıkışmasının imzasını (JA4/JA3) taklit etmesi çok zordur. Veylify bu parmak izini gerçek tarayıcı profilleriyle karşılaştırıp otomasyon araçlarını maskesinin altından çıkarır."
      maddeler={[
        "JA4 / JA3 TLS istemci parmak izi çıkarımı",
        "Gerçek tarayıcı profilleriyle imza eşleştirme",
        "Headless Chrome, Puppeteer, curl-impersonate tespiti",
        "HTTP/2 çerçeve sıralaması analiziyle çapraz doğrulama",
      ]}
      gorsel={
        <div className="rounded-3xl border border-veylify-100 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-veylify-950">
            <Cpu className="size-4 text-veylify-600" /> TLS imza eşleştirme
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-emerald-800">ja4: t13d1516h2_...</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Gerçek Chrome ✓</span>
              </div>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-red-800">ja4: t13d0310h2_...</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">curl-impersonate ✕</span>
              </div>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-red-800">ja4: t13d0002h1_...</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Headless ✕</span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ============================================================ ÇOK-KATMANLI */
function KatmanliBolum() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <Network className="size-3.5" /> Çok-katmanlı savunma
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Bir katman atlansa, <Highlight variant="gradient">diğeri yakalar</Highlight>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Defense in depth ilkesi: hiçbir tek kontrol mükemmel değildir, ama üst üste
            binen bağımsız katmanlar birlikte neredeyse geçilmez bir savunma oluşturur.
          </p>
        </Reveal>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <OzellikIzgara />
          </Reveal>
          <Reveal delay={1}>
            <div className="grid grid-cols-2 gap-4">
              <VuruStat deger="%100" etiket="OCR körlüğü (kanıtlı)" />
              <VuruStat deger="48ms" etiket="ortalama yanıt süresi" />
              <VuruStat deger="15+" etiket="tanınan AI crawler" />
              <VuruStat deger="%99.4" etiket="insan geçiş oranı" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ FINAL CTA */
function FinalCta() {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sekiz katmanı bugün devreye alın
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Tek satır entegrasyon, kredi kartı gerekmez. İnsanlar geçer, botlar durur.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/nasil-calisir"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Terminal className="size-[18px]" /> Nasıl çalışır?
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
