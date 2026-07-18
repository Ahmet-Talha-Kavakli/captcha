import Link from "next/link";
import {
  ArrowRight, Eye, Check, ShieldCheck, Bot, Zap, Gauge, Code2, Globe,
  Fingerprint, GitBranch, Sparkles, Lock, Activity, Server, Layers, Star,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { HeroGorsel, GhostFontGorsel, IzgaraArka, UrunEkranGorseli, AiAjanKoruma } from "@/components/site/gorseller";
import { GhostHero } from "@/components/site/GhostHero";
import { AkisDiyagram, MimariSema } from "@/components/site/illustrasyonlar";
import { MarkaLogo, GUVEN_MARKALARI } from "@/components/site/marka-logolari";
import { Faq, SORULAR } from "@/components/site/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { MARKA } from "@/lib/marka";

export default function LandingPage() {
  return (
    <>
      <JsonLd sss={SORULAR} />
      <Hero />
      <LogoStrip />
      <Problem />
      <GhostFont />
      <HowItWorks />
      <Features />
      <UrunOnizleme />
      <AiKoruma />
      <Compare />
      <Testimonials />
      <Stats />
      <Guven />
      <Entegrasyonlar />
      <CodeSection />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}

/* ============================================================ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-20 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal>
            <Badge variant="indigo">
              <Sparkles className="size-3.5" /> AI çağının bot koruması
            </Badge>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[54px]">
              AI botları her CAPTCHA'yı geçiyor.{" "}
              <Highlight variant="gradient">{MARKA.ad}</Highlight> geçemedikleri katman.
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
              Ghost-font teknolojisiyle insanın gördüğü, makinenin göremediği bir
              doğrulama. Davranış analizi, kural motoru ve görünmez mod ile
              sitenizi GPTBot, ClaudeBot ve tüm AI kazıyıcılardan koruyun.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          <Reveal delay={4}>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-500">
              {["10 dakikada kurulur", "Kredi kartı gerekmez", "reCAPTCHA uyumlu API"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-veylify-600" /> {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={2} className="zn-float">
          <HeroGorsel />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ LOGO STRIP */
function LogoStrip() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[13px] font-medium uppercase tracking-wider text-slate-400">
          Kullandığınız yığınla sorunsuz çalışır
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
function Problem() {
  const kartlar = [
    { ikon: Bot, baslik: "AI ajanları CAPTCHA'yı çözüyor", metin: "GPT-4o ve Claude görüntü CAPTCHA'larını %90+ doğrulukla geçiyor. Klasik doğrulama artık işe yaramıyor." },
    { ikon: Server, baslik: "İçeriğiniz eğitim verisine dönüşüyor", metin: "Kazıyıcı botlar sitenizi saniyeler içinde kopyalayıp AI modellerine yem yapıyor — izniniz olmadan." },
    { ikon: Zap, baslik: "Altyapı maliyeti patlıyor", metin: "Trafiğinizin %40'ı bot. Her istek sunucu, bant genişliği ve para yakıyor." },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Sorun</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            CAPTCHA artık insanı bottan ayıramıyor
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Yapay zeka görüntü tanımada insanı geçti. Eski doğrulama katmanları çöktü.
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
function GhostFont() {
  return (
    <section className="relative overflow-hidden bg-veylify-950 px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -right-20 top-0 -z-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-200 ring-1 ring-white/10">
            <Eye className="size-3.5" /> Ghost-font teknolojisi
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            İnsan görür. Makine göremez.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Temporal dithering ile karakterler tek karede gürültüye gömülür; yalnızca
            hareket koheransını algılayan insan gözü okur. Ekran görüntüsü alan AI
            bile sahte bir mesaj görür.
          </p>
        </div>
        {/* canlı interaktif demo (gerçek motor) + statik karşılaştırma */}
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
              <span className="rounded-full bg-veylify-600 px-2.5 py-1 text-[11px] uppercase tracking-wide">Kendin dene</span>
              Basılı tut, metnin nasıl kaybolduğunu gör
            </div>
            <GhostHero />
          </div>
          <GhostFontGorsel />
        </div>
      </div>
    </section>
  );
}

/* ============================================================ HOW IT WORKS */
function HowItWorks() {
  const adimlar = [
    { no: "01", ikon: Code2, baslik: "Tek satır entegrasyon", metin: "Script etiketini ekleyin ya da reCAPTCHA uyumlu API'yi çağırın. Mevcut kodunuz değişmez." },
    { no: "02", ikon: Activity, baslik: "Trafiği anında sınıflandır", metin: "Her istek ghost-font, davranış biyometrisi, TLS parmak izi ve kural motorundan geçer." },
    { no: "03", ikon: ShieldCheck, baslik: "İnsan geçer, bot durur", metin: "Milisaniyeler içinde karar: izin, doğrula veya engelle. Gerçek kullanıcı hiç fark etmez." },
  ];
  return (
    <section id="nasil" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Nasıl çalışır</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Kurulumdan korumaya 10 dakika
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
              {[["48ms", "karar süresi"], ["5", "savunma katmanı"], ["%0", "sızıntı"]].map(([d, e]) => (
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
function Features() {
  const ozellikler = [
    { ikon: Eye, baslik: "Ghost-font CAPTCHA", metin: "Temporal dithering — OCR'ı %100 kör eder, insanı hiç yormaz." },
    { ikon: Fingerprint, baslik: "Davranış biyometrisi", metin: "Fare, tuş ve dokunuş dinamiğinden insan-bot ayrımı." },
    { ikon: GitBranch, baslik: "Kural motoru", metin: "Path, ülke, ASN, bot sınıfı ile özel politikalar; canlı playground." },
    { ikon: Lock, baslik: "Görünmez mod", metin: "Challenge göstermeden, reCAPTCHA v3 gibi arka planda skorla." },
    { ikon: Bot, baslik: "AI ajan kataloğu", metin: "GPTBot, ClaudeBot, Bytespider — 15+ crawler'ı UA + TLS ile doğrula." },
    { ikon: Globe, baslik: "Coğrafi & ASN istihbaratı", metin: "Datacenter, VPN, botnet trafiğini kaynağından yakala." },
    { ikon: Gauge, baslik: "48ms yanıt", metin: "Edge'de çalışır; kullanıcı deneyimini hiç yavaşlatmaz." },
    { ikon: Layers, baslik: "Çok-katmanlı savunma", metin: "Bir katman atlansa diğeri yakalar — defense in depth." },
  ];
  return (
    <section id="ozellikler" className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Özellikler</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Tek katman değil, bütün bir savunma platformu
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
function UrunOnizleme() {
  const noktalar = [
    { ikon: Activity, baslik: "Canlı komuta merkezi", metin: "Her isteğin kararını gerçek zamanlı izle: izin, doğrula, engelle." },
    { ikon: Bot, baslik: "AI ajan istihbaratı", metin: "GPTBot'tan Bytespider'a kadar her operatörü tek panelde yönet." },
    { ikon: Gauge, baslik: "Milisaniye içgörü", metin: "48ms altında karar, 14 günlük trafik trendleri, ısı haritaları." },
  ];
  return (
    <section className="relative overflow-hidden px-5 py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-20 -z-10 size-80 rounded-full bg-veylify-100/40 blur-3xl" />
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Ürünü gör</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Tek panelden bütün bot trafiğin
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            İnsan mı, bot mu, hangi AI ajanı — her şey tek ekranda, canlı ve okunur.
          </p>
        </Reveal>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <UrunEkranGorseli />
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
function AiKoruma() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <Badge variant="indigo">AI ajan kataloğu</Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
              Her AI ajanına ayrı politika
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              GPTBot, ClaudeBot, Google-Extended, Bytespider — 15+ tanınan AI
              crawler&apos;ı User-Agent ve TLS parmak iziyle doğrular. İzin ver,
              doğrula ya da engelle; kararların tek tıkla gerçek robots.txt&apos;e döner.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {[
                "Model eğitimi crawler'larını engelle, aramayı serbest bırak",
                "robots.txt'i yok sayan ajanları AKTİF olarak durdur",
                "Tek tıkla hazır politika profilleri (sıkı / dengeli / açık)",
              ].map((t) => (
                <span key={t} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="mt-0.5 size-[18px] shrink-0 text-veylify-600" /> {t}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={1}>
            <AiAjanKoruma />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ COMPARE */
function Compare() {
  const satirlar: [string, boolean, boolean][] = [
    ["AI botlarını durdurur", true, false],
    ["İnsanı yormaz (görünmez mod)", true, false],
    ["Ekran görüntüsüne karşı dayanıklı", true, false],
    ["Davranış biyometrisi", true, false],
    ["reCAPTCHA uyumlu API", true, true],
    ["Coğrafi & ASN istihbaratı", true, false],
    ["10 dakikada kurulum", true, true],
  ];
  return (
    <section id="karsilastirma" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Karşılaştırma</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Klasik CAPTCHA'nın yapamadığı
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-veylify-100 bg-white">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-veylify-100 bg-veylify-50/50 px-5 py-4 text-[13px] font-semibold">
              <span className="text-slate-500">Özellik</span>
              <span className="text-center text-veylify-700">{MARKA.ad}</span>
              <span className="text-center text-slate-400">Klasik CAPTCHA</span>
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
function Testimonials() {
  const yorumlar = [
    {
      metin: "reCAPTCHA'dan Veylify'e geçtik ve bot trafiğimiz bir gecede %92 düştü. Görünmez mod sayesinde gerçek kullanıcılarımız hiçbir sürtünme yaşamadı.",
      ad: "Elif K.", unvan: "Platform Lideri, E-ticaret", bas: "EK", renk: "#4f46e5",
    },
    {
      metin: "İçeriğimiz sürekli AI kazıyıcılar tarafından çalınıyordu. Veylify, GPTBot ve ClaudeBot'u TLS parmak izinden yakalıyor — artık eğitim verisi olmaktan çıktık.",
      ad: "Mert A.", unvan: "CTO, İçerik Platformu", bas: "MA", renk: "#7c3aed",
    },
    {
      metin: "Kimlik doldurma saldırıları login sayfamızı bombalıyordu. Kural motoru + davranış biyometrisi ile kaçan istek oranı %0.3'e indi. Kurulum gerçekten 10 dakika.",
      ad: "Selin D.", unvan: "Güvenlik Mühendisi, SaaS", bas: "SD", renk: "#db2777",
    },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Müşteri hikayeleri</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Ekipler botları <Highlight variant="gradient">Veylify ile</Highlight> durduruyor
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {yorumlar.map((y, i) => (
            <Reveal key={y.ad} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <figure className="flex h-full flex-col rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(79,70,229,0.35)]">
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="flex-1 text-[14.5px] leading-relaxed text-slate-700">
                  “{y.metin}”
                </blockquote>
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
function Stats() {
  const stats: [string, string][] = [
    ["%100", "OCR körlüğü (kanıtlı)"],
    ["48ms", "ortalama yanıt süresi"],
    ["15+", "tanınan AI crawler"],
    ["%99.4", "insan geçiş oranı"],
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
function CodeSection() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Badge variant="indigo">Geliştirici dostu</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Tek satır ekle, koruma başlasın
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Script etiketi ya da reCAPTCHA uyumlu API. Mevcut backend'iniz değişmeden
            çalışır. Her dilde SDK, kapsamlı dokümanlar.
          </p>
          <ul className="mt-6 space-y-3">
            {["Sunucu-taraflı doğrulama (siteverify)", "Görünmez pasif skorlama", "Webhook & Slack entegrasyonu"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                <Check className="size-[18px] text-veylify-600" /> {t}
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
function Pricing() {
  const planlar = [
    { ad: "Başlangıç", fiyat: "₺0", period: "/ay", ozet: "Kişisel projeler için", vurgu: false,
      ozellikler: ["10.000 doğrulama/ay", "Ghost-font CAPTCHA", "1 site", "Topluluk desteği"] },
    { ad: "Büyüme", fiyat: "₺990", period: "/ay", ozet: "Büyüyen ekipler için", vurgu: true,
      ozellikler: ["1.000.000 doğrulama/ay", "Tüm savunma katmanları", "10 site", "Kural motoru + görünmez mod", "Öncelikli destek"] },
    { ad: "Kurumsal", fiyat: "Özel", period: "", ozet: "Yüksek trafik & SLA", vurgu: false,
      ozellikler: ["Sınırsız doğrulama", "Özel SLA + SSO", "Sınırsız site", "Adanmış çözüm mühendisi", "On-premise seçeneği"] },
  ];
  return (
    <section id="fiyat" className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Fiyatlandırma</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Basit, şeffaf, ölçeklenen
          </h2>
          <p className="mt-4 text-[16px] text-slate-600">Kredi kartı gerekmez. İstediğin zaman iptal et.</p>
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
                    <Sparkles className="size-3" /> En popüler
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
                  href="/kayit"
                  className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                    p.vurgu
                      ? "bg-veylify-600 text-white hover:bg-veylify-700"
                      : "border border-veylify-200 bg-white text-veylify-700 hover:bg-veylify-50"
                  }`}
                >
                  {p.ad === "Kurumsal" ? "İletişime geç" : "Başla"} <ArrowRight className="size-4" />
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
function Guven() {
  const rozetler = [
    { ikon: ShieldCheck, ad: "KVKK uyumlu", alt: "Veriler Türkiye'de, aydınlatma metni hazır" },
    { ikon: Lock, ad: "Uçtan uca şifreli", alt: "TLS 1.3 + at-rest AES-256" },
    { ikon: Server, ad: "SOC 2 hedefli", alt: "Denetim izleri & erişim kontrolü" },
    { ikon: Globe, ad: "GDPR hazır", alt: "AB veri işleme sözleşmesi" },
    { ikon: Activity, ad: "%99.9 uptime", alt: "Çok-bölgeli edge dağıtımı" },
    { ikon: Fingerprint, ad: "Sıfır PII sızıntısı", alt: "Ghost-font istemcide çalışır" },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Güven & uyumluluk</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Kurumsal güvenlik, gün bir&apos;den itibaren
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Veriniz sizde kalır. Ghost-font tarayıcıda çalışır — sunucumuza asla
            piksel gitmez. Uyumluluk ilk günden düşünüldü.
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
function Entegrasyonlar() {
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
            <Badge variant="indigo">Entegrasyonlar</Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
              Yığınınız neyse, {MARKA.ad} oraya oturur
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              Script etiketi, reCAPTCHA-uyumlu API veya sunucu-taraflı SDK. WordPress&apos;ten
              Next.js&apos;e, Shopify&apos;dan kendi backend&apos;inize — dakikalar içinde bağlanır.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {[
                "reCAPTCHA v2/v3 uyumlu — kodu değiştirmeden geçiş",
                "Her dilde SDK + kapsamlı doküman",
                "Webhook & Slack ile anlık uyarı",
              ].map((t) => (
                <span key={t} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                  <Check className="size-[18px] shrink-0 text-veylify-600" /> {t}
                </span>
              ))}
            </div>
            <Link
              href="/nasil-calisir"
              className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-veylify-600 transition hover:gap-3 hover:text-veylify-700"
            >
              Nasıl çalıştığını gör <ArrowRight className="size-4" />
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
function FinalCta() {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sitenizi AI botlarından bugün koruyun
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          10 dakikada kurun, kredi kartı olmadan başlayın. İnsanlar geçer, botlar durur.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Eye className="size-[18px]" /> Önce demoyu gör
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
