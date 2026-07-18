import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Target, Eye, ShieldCheck, Heart, Zap, Users, Globe,
  Sparkles, Compass, Lock,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { VuruStat } from "@/components/site/illustrasyonlar";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Veylify, siteleri yapay zeka botlarından koruyan İstanbul merkezli bir güvenlik ekibidir. Misyonumuz, hikayemiz ve değerlerimiz.",
};

export default function HakkimizdaPage() {
  return (
    <>
      <Hero />
      <Istatistikler />
      <Misyon />
      <Hikaye />
      <Degerler />
      <Ekip />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-14 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge variant="indigo">
            <Sparkles className="size-3.5" /> Hakkımızda
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            İnternetin <Highlight variant="gradient">insanlara ait</Highlight> kalması için
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            {MARKA.ad}, web sitelerini durmaksızın çoğalan yapay zeka botlarından koruyan bir
            güvenlik ekibidir. Ghost-font teknolojimiz, sadece insanların okuyabildiği görünmez
            bir katman yaratır — kazıyıcılar için okunaksız, ziyaretçiler için kusursuz.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Istatistikler() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Rakamlarla {MARKA.ad}
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-4">
          <Reveal delay={1}><VuruStat deger="1.2Mr+" etiket="korunan istek / gün" /></Reveal>
          <Reveal delay={2}><VuruStat deger="480M+" etiket="engellenen bot isteği / ay" /></Reveal>
          <Reveal delay={3}><VuruStat deger="%99.4" etiket="gerçek kullanıcı geçiş oranı" /></Reveal>
          <Reveal delay={4}><VuruStat deger="48ms" etiket="karar başına gecikme" /></Reveal>
        </div>
      </div>
    </section>
  );
}

function Misyon() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-veylify-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-700 ring-1 ring-veylify-100">
            <Target className="size-3.5" /> Misyonumuz
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Siteleri AI botlarından <Highlight variant="gradient">gerçekten</Highlight> korumak
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-slate-600">
            Web trafiğinin artık büyük bölümü otomasyon. Fiyat kazıyıcılar, içerik hırsızları,
            AI eğitim crawler'ları ve kimlik doldurma botları; içeriğinizi, gelirinizi ve
            kullanıcı deneyiminizi sessizce aşındırıyor. Klasik CAPTCHA'ları ise modern AI
            ajanları çoktan geçiyor.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Biz farklı bir yol seçtik: insanı yormadan makineyi kör eden bir doğrulama katmanı.
            Amacımız, geliştiricilerin tek satırlık bir kurulumla sitelerini savunabilmesi ve
            emeklerinin izinsiz ticarileştirilmesine son vermek.
          </p>
        </Reveal>
        <Reveal delay={1}>
          <div className="rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/60 to-white p-7 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
            <div className="space-y-5">
              {[
                [Eye, "Görünmez koruma", "Ziyaretçi hiçbir sürtünme yaşamaz; bot ise duvara çarpar."],
                [Lock, "Gizlilik önce", "Stateless doğrulama, kişisel veri toplamaz; KVKK/GDPR uyumlu."],
                [Zap, "Milisaniyeler", "Ortalama 48 ms karar süresi — sayfanız hiç yavaşlamaz."],
              ].map(([Ikon, b, m]) => {
                const I = Ikon as typeof Eye;
                return (
                  <div key={b as string} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-veylify-600 shadow-[0_12px_28px_-14px_rgba(79,70,229,0.5)] ring-1 ring-veylify-100">
                      <I className="size-5" />
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-veylify-950">{b as string}</div>
                      <div className="mt-0.5 text-[13.5px] leading-relaxed text-slate-600">{m as string}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Hikaye() {
  const adimlar: [string, string, string][] = [
    [
      "2024 — Kıvılcım",
      "Başlangıç",
      "Kendi projelerimiz AI crawler'ları tarafından günde milyonlarca kez taranınca fark ettik: robots.txt bir dilek listesinden ibaretti. Uygulanan bir korumaya ihtiyaç vardı.",
    ],
    [
      "2025 — Ghost-font",
      "Buluş",
      "Temporal dithering ile OCR'ı %100 kör eden, insan gözünün ise sorunsuz okuduğu bir yazı tipi tekniği geliştirdik. İlk testlerde hiçbir AI modeli metni çözemedi.",
    ],
    [
      "2025 — Platform",
      "Büyüme",
      "Tek bir hileyi, sekiz katmanlı bir savunma platformuna dönüştürdük: davranış biyometrisi, kural motoru, TLS parmak izi ve coğrafi istihbarat aynı çatı altında.",
    ],
    [
      "2026 — Bugün",
      "Ölçek",
      "Günde 1.2 milyardan fazla isteği koruyor, e-ticaretten SaaS'a onlarca sektörde botları durduruyoruz. Yolculuğun daha başındayız.",
    ],
  ];
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-700 ring-1 ring-veylify-100">
            <Compass className="size-3.5" /> Hikayemiz
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Bir sorundan bir <Highlight variant="gradient">platforma</Highlight>
          </h2>
        </Reveal>
        <div className="mt-12 space-y-4">
          {adimlar.map(([yil, etiket, metin], i) => (
            <Reveal key={yil} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
              <div className="grid gap-4 rounded-2xl border border-veylify-100 bg-white p-6 sm:grid-cols-[220px_1fr]">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-wide text-veylify-600">{etiket}</div>
                  <div className="mt-1 text-[17px] font-extrabold text-veylify-950">{yil}</div>
                </div>
                <p className="text-[14.5px] leading-relaxed text-slate-600">{metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Degerler() {
  const degerler = [
    { ikon: ShieldCheck, baslik: "Uygulanan güvenlik", metin: "Söz değil, sonuç. Her katman ölçülebilir biçimde botları durdurur; iddialarımızı verilerle gösteririz." },
    { ikon: Heart, baslik: "İnsan önce", metin: "Gerçek kullanıcı asla ceza görmez. Sürtünmeyi bota yükler, ziyaretçiye görünmez kalırız." },
    { ikon: Lock, baslik: "Gizliliğe saygı", metin: "Mümkün olan en az veriyi işleriz. Stateless mimari, KVKK ve GDPR ilk günden tasarımın parçası." },
    { ikon: Zap, baslik: "Sadelik", metin: "Tek satır kurulum, anlaşılır panel, net faturalandırma. Güvenlik karmaşık olmak zorunda değil." },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <Heart className="size-3.5" /> Değerlerimiz
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Bizi biz yapan <Highlight variant="gradient">ilkeler</Highlight>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {degerler.map((d, i) => (
            <Reveal key={d.baslik} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <span className="grid size-11 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                  <d.ikon className="size-5" />
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-veylify-950">{d.baslik}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{d.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Ekip() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <Users className="size-3.5" /> Ekip
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            İstanbul merkezli, <Highlight variant="gradient">dünyaya bakan</Highlight> ekip
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Güvenlik mühendisleri, ML araştırmacıları ve ürün tasarımcılarından oluşan küçük ama
            odaklı bir ekibiz. Uzaktan çalışıyor, kararlarımızı İstanbul'da alıyoruz.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { ad: "Deniz Aksoy", rol: "Kurucu & Güvenlik Mühendisi", not: "Botnet tespiti ve TLS parmak izi üzerine çalışıyor." },
            { ad: "Elif Yıldız", rol: "ML Araştırmacısı", not: "Ghost-font ve davranış biyometrisi modellerinin arkasındaki isim." },
            { ad: "Kaan Demir", rol: "Ürün & Tasarım", not: "Panel deneyimini ve geliştirici entegrasyonunu sadeleştiriyor." },
          ].map((k, i) => (
            <Reveal key={k.ad} delay={(((i % 3) + 1) as 1 | 2 | 3)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-veylify-500 to-violet-500 text-[18px] font-bold text-white">
                  {k.ad.split(" ").map((p) => p[0]).join("")}
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-veylify-950">{k.ad}</h3>
                <div className="mt-0.5 text-[13px] font-semibold text-veylify-600">{k.rol}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{k.not}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-10 flex max-w-2xl items-center gap-3 rounded-2xl border border-veylify-100 bg-white p-5 text-[14px] text-slate-600">
          <Globe className="size-6 shrink-0 text-veylify-600" />
          <span>
            Ekibimize katılmak ister misiniz? Açık pozisyonlar için{" "}
            <Link href="/iletisim" className="font-semibold text-veylify-700 underline underline-offset-2">
              bize yazın
            </Link>
            .
          </span>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sitenizi bugün koruma altına alın
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Botları durduran, insanı geçiren doğrulama katmanını 10 dakikada kurun.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/iletisim"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Sparkles className="size-[18px]" /> Bize ulaşın
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
