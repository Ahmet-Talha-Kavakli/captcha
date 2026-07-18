import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";
import { YAZILAR } from "./yazilar";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "AI bot tehditleri, ghost-font teknolojisi, CAPTCHA'nın geleceği ve e-ticaret bot koruması üzerine Veylify blogu.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog — ${MARKA.ad}`,
    description: "Bot tehditleri, ghost-font ve modern doğrulama üzerine yazılar.",
    url: `${MARKA.url}/blog`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function BlogPage() {
  const [one, ...digerleri] = YAZILAR;
  return (
    <>
      <section className="relative overflow-hidden px-5 pt-16 pb-10 lg:px-8 lg:pt-24">
        <IzgaraArka />
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Badge variant="indigo">
              <BookOpen className="size-3.5" /> Blog
            </Badge>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
              Bot ekonomisine dair <Highlight variant="gradient">yazılar</Highlight>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
              AI bot tehditleri, ghost-font teknolojisi ve modern doğrulama üzerine ekibimizin
              görüşleri, teknik derinlemesine incelemeler ve sektör rehberleri.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Öne çıkan */}
          {one && (
            <Reveal>
              <Link
                href={`/blog/${one.slug}`}
                className="group grid overflow-hidden rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/60 to-white shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_72px_-32px_rgba(79,70,229,0.4)] lg:grid-cols-[1.1fr_1fr]"
              >
                <div className="relative min-h-[220px] overflow-hidden bg-gradient-to-br from-veylify-600 via-veylify-500 to-violet-600 p-8">
                  <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    Öne çıkan
                  </span>
                  <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-white/70">
                    {one.kategori}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                    {one.baslik}
                  </h2>
                </div>
                <div className="flex flex-col justify-center p-8">
                  <p className="text-[15px] leading-relaxed text-slate-600">{one.ozet}</p>
                  <MetaSatiri tarih={one.tarih} okumaSuresi={one.okumaSuresi} />
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-veylify-700 transition group-hover:gap-2.5">
                    Yazıyı oku <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )}

          {/* Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((y, i) => (
              <Reveal key={y.slug} delay={(((i % 3) + 1) as 1 | 2 | 3)}>
                <Link
                  href={`/blog/${y.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-veylify-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-veylify-700 ring-1 ring-veylify-100">
                    {y.kategori}
                  </span>
                  <h3 className="mt-3.5 text-[17px] font-extrabold leading-snug text-veylify-950">
                    {y.baslik}
                  </h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">{y.ozet}</p>
                  <MetaSatiri tarih={y.tarih} okumaSuresi={y.okumaSuresi} />
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-veylify-700 transition group-hover:gap-2.5">
                    Devamını oku <ArrowRight className="size-4" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-veylify-100 bg-veylify-50/40 p-8 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950">
            Sitenizi bugün koruyun
          </h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-slate-600">
            Okuduklarınızı uygulamaya dökmenin en hızlı yolu: ücretsiz bir hesapla başlayın.
          </p>
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

function MetaSatiri({ tarih, okumaSuresi }: { tarih: string; okumaSuresi: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 text-[12.5px] text-slate-400">
      <span>{tarih}</span>
      <span className="text-slate-300">•</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" /> {okumaSuresi} okuma
      </span>
    </div>
  );
}
