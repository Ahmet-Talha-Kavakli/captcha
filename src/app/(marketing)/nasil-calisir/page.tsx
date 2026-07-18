import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Eye, Check, Code2, Activity, ShieldCheck, Terminal,
  Server, Zap, Gauge, GitBranch, Network, Layers, Sparkles,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { AkisDiyagram, MimariSema, VuruStat } from "@/components/site/illustrasyonlar";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "Veylify'nin teknik akışı: tek satır kurulum, 5 katmanlı savunma hunisi, edge mimarisi, karar akışı ve reCAPTCHA uyumlu API entegrasyonu.",
  alternates: { canonical: "/nasil-calisir" },
  openGraph: {
    title: `Nasıl Çalışır — ${MARKA.ad}`,
    description:
      "Tek satır kurulum, 5 katmanlı savunma hunisi, edge mimarisi ve reCAPTCHA uyumlu API entegrasyonu.",
    url: `${MARKA.url}/nasil-calisir`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function NasilCalisirPage() {
  return (
    <>
      <Hero />
      <KurulumBolum />
      <HuniBolum />
      <MimariBolum />
      <KararAkisi />
      <KodBolum />
      <EntegrasyonAdimlari />
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
            <Terminal className="size-3.5" /> Nasıl çalışır
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            İstekten karara <Highlight variant="gradient">48 milisaniye</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            Her istek {MARKA.ad} edge'inde beş bağımsız savunma katmanından geçer.
            İnsan sürtünmesiz geçer, bot durur — hepsi kullanıcı fark etmeden,
            milisaniyeler içinde. İşte kaputun altında ne olduğu.
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
              href="/ozellikler"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-veylify-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:border-veylify-300 hover:bg-veylify-50"
            >
              <Layers className="size-[18px]" /> Özellikleri gör
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ KURULUM */
function KurulumBolum() {
  const adimlar = [
    { no: "01", ikon: Code2, baslik: "Script'i ekle", metin: "Tek bir <script> etiketini sayfanın head'ine koyun. Frontend'de bir div ile challenge alanını işaretleyin." },
    { no: "02", ikon: Server, baslik: "Token'ı doğrula", metin: "Backend'de reCAPTCHA uyumlu /siteverify uç noktasını çağırın. Mevcut doğrulama akışınız neredeyse hiç değişmez." },
    { no: "03", ikon: ShieldCheck, baslik: "Kararı uygula", metin: "Dönen verdict'e göre isteği geçirin, doğrulayın veya engelleyin. Kurulum tipik olarak 10 dakika sürer." },
  ];
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Kurulum</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Üç adımda canlı
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
      </div>
    </section>
  );
}

/* ============================================================ 5-KATMANLI HUNİ */
function HuniBolum() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Badge variant="indigo">
              <Network className="size-3.5" /> Savunma hunisi
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
              Her istek <Highlight variant="gradient">beş katmandan</Highlight> geçer
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              Trafik en ucuz kontrolden en pahalısına doğru süzülür. Bir istek erken
              bir katmanda elenirse, geri kalan katmanları hiç meşgul etmez — bu hem
              hızlı hem de maliyet-verimli bir mimaridir.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Edge hız sınırı: kaba kuvvet ve flood'u ilk pakette kes",
                "IP & ASN itibarı: datacenter/VPN/botnet kaynaklarını ele",
                "TLS parmak izi: sahte tarayıcı istemcilerini ortaya çıkar",
                "Ghost-font: otomasyonun okuyamadığı görsel doğrulama",
                "Davranış skoru: insan-benzeri etkileşimi son kez teyit et",
              ].map((m) => (
                <li key={m} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="mt-0.5 size-[18px] shrink-0 text-veylify-600" /> {m}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={1}>
            <AkisDiyagram />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ MİMARİ */
function MimariBolum() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <Server className="size-3.5" /> Mimari
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Siteniz — Edge — Panel
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Karar mantığı, kullanıcıya en yakın edge düğümünde çalışır. Sunucunuz sadece
            imzalı sonucu doğrular; ağır iş yükü hiçbir zaman altyapınıza dokunmaz.
          </p>
        </Reveal>
        <Reveal delay={1} className="mt-12">
          <MimariSema />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Reveal delay={1}><VuruStat deger="48ms" etiket="edge'de ortalama karar" /></Reveal>
          <Reveal delay={2}><VuruStat deger="0" etiket="ek altyapı gereksinimi" /></Reveal>
          <Reveal delay={3}><VuruStat deger="%100" etiket="stateless & imzalı token" /></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ KARAR AKIŞI */
function KararAkisi() {
  const kararlar = [
    { ikon: Check, ad: "allowed", renk: "emerald", metin: "Skor yüksek, imza temiz — istek sürtünmesiz geçer." },
    { ikon: Eye, ad: "challenged", renk: "amber", metin: "Belirsiz sinyal — kullanıcıya ghost-font challenge gösterilir." },
    { ikon: ShieldCheck, ad: "blocked", renk: "red", metin: "Bilinen bot ya da yüksek risk — istek reddedilir." },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <GitBranch className="size-3.5" /> Karar akışı
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Üç olası verdict, tek çağrı
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Katmanlar bir risk skoru üretir; kural motorunuz bunu üç net karardan birine dönüştürür.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {kararlar.map((k, i) => (
            <Reveal key={k.ad} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6 text-center transition hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${
                  k.renk === "emerald" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                  : k.renk === "amber" ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                  : "bg-red-50 text-red-600 ring-1 ring-red-100"
                }`}>
                  <k.ikon className="size-6" />
                </span>
                <div className={`mt-4 font-mono text-[15px] font-bold ${
                  k.renk === "emerald" ? "text-emerald-700" : k.renk === "amber" ? "text-amber-700" : "text-red-700"
                }`}>"{k.ad}"</div>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{k.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ KOD (koyu terminal) */
function KodBolum() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Badge variant="indigo">
            <Code2 className="size-3.5" /> Geliştirici dostu
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Sunucu tarafında tek çağrı
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Frontend'de üretilen token'ı backend'de doğrulayın. reCAPTCHA'dan geçiş
            yapıyorsanız, çoğu durumda yalnızca uç nokta URL'sini değiştirmeniz yeterli.
          </p>
          <ul className="mt-6 space-y-3">
            {["Her dilde SDK + saf HTTP", "Sunucu-taraflı siteverify", "Webhook & Slack bildirimleri"].map((t) => (
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
{`// 1) Frontend: challenge token'ı üret
//    <script src="https://cdn.${MARKA.domain}/z.js"></script>
//    <div class="veylify-widget" data-key="pub_..."></div>

// 2) Backend: sunucu-taraflı doğrula
const res = await fetch(
  "https://api.${MARKA.domain}/v1/siteverify",
  {
    method: "POST",
    headers: { "X-Api-Key": SECRET_KEY },
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

/* ============================================================ ENTEGRASYON ADIMLARI */
function EntegrasyonAdimlari() {
  const adimlar = [
    { ikon: Sparkles, baslik: "Site anahtarı al", metin: "Panelde saniyeler içinde public + secret anahtar çifti oluştur." },
    { ikon: Code2, baslik: "Widget'ı yerleştir", metin: "Script + div ekle; challenge alanı otomatik render edilir." },
    { ikon: Server, baslik: "Backend'i bağla", metin: "siteverify çağrısını doğrulama akışına ekle." },
    { ikon: GitBranch, baslik: "Kuralları ayarla", metin: "Kural motorunda politikaları tanımla, playground'da test et." },
    { ikon: Activity, baslik: "Canlı izle", metin: "Panelde gerçek zamanlı karar akışını ve metrikleri takip et." },
    { ikon: Zap, baslik: "Ölçekle", metin: "Trafik büyüdükçe edge otomatik ölçeklenir — senin işin yok." },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Entegrasyon</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Kurulumdan ölçeğe, tam yol haritası
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adimlar.map((a, i) => (
            <Reveal key={a.baslik} delay={(((i % 3) + 1) as 1 | 2 | 3)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                    <a.ikon className="size-[18px]" />
                  </span>
                  <span className="text-[13px] font-bold text-veylify-300">0{i + 1}</span>
                </div>
                <h3 className="mt-3.5 text-[15px] font-bold text-veylify-950">{a.baslik}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{a.metin}</p>
              </div>
            </Reveal>
          ))}
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
          10 dakikada canlıya geçin
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Anahtarınızı alın, script'i ekleyin, koruma başlasın. Kredi kartı gerekmez.
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
