import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";
import { Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";
import { YAZILAR, yaziBul } from "../yazilar";

export function generateStaticParams() {
  return YAZILAR.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) {
    return { title: "Yazı bulunamadı" };
  }
  return {
    title: yazi.baslik,
    description: yazi.ozet,
    alternates: { canonical: `/blog/${yazi.slug}` },
    openGraph: {
      title: `${yazi.baslik} — ${MARKA.ad}`,
      description: yazi.ozet,
      url: `${MARKA.url}/blog/${yazi.slug}`,
      type: "article",
      locale: "tr_TR",
      siteName: MARKA.ad,
      publishedTime: yazi.isoTarih,
    },
  };
}

export default async function BlogYaziPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) notFound();

  const digerleri = YAZILAR.filter((y) => y.slug !== yazi.slug).slice(0, 2);

  return (
    <>
      <section className="relative overflow-hidden px-5 pt-14 pb-8 lg:px-8 lg:pt-20">
        <IzgaraArka />
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-veylify-700 transition hover:gap-2.5"
            >
              <ArrowLeft className="size-4" /> Tüm yazılar
            </Link>
          </Reveal>
          <Reveal delay={1}>
            <span className="mt-6 inline-flex items-center rounded-full bg-veylify-50 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-veylify-700 ring-1 ring-veylify-100">
              {yazi.kategori}
            </span>
          </Reveal>
          <Reveal delay={2}>
            <h1 className="mt-4 text-[32px] font-extrabold leading-[1.12] tracking-tight text-veylify-950 sm:text-[42px]">
              {yazi.baslik}
            </h1>
          </Reveal>
          <Reveal delay={3}>
            <p className="mt-4 text-[17px] leading-relaxed text-slate-600">{yazi.ozet}</p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-5 flex items-center gap-3 border-t border-veylify-100 pt-4 text-[13px] text-slate-400">
              <span>{yazi.tarih}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {yazi.okumaSuresi} okuma
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <article className="px-5 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {yazi.icerik.map((bolum, bi) => (
            <Reveal key={bi} as="section" className="mt-9 first:mt-4">
              {bolum.baslik && (
                <h2 className="text-[22px] font-extrabold tracking-tight text-veylify-950">
                  {bolum.baslik}
                </h2>
              )}
              <div className="mt-3 space-y-4">
                {bolum.paragraflar.map((p, pi) => (
                  <p key={pi} className="text-[16px] leading-[1.75] text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
              {bolum.liste && (
                <ul className="mt-4 space-y-2.5">
                  {bolum.liste.map((li, li_i) => (
                    <li
                      key={li_i}
                      className="flex gap-2.5 text-[15.5px] leading-relaxed text-slate-600"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-veylify-500" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}

          {/* Yazı içi CTA */}
          <Reveal className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 p-8 text-center">
            <h3 className="text-2xl font-extrabold text-white">Sitenizi botlardan koruyun</h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/80">
              {MARKA.ad} ile insanı yormadan botu durduran doğrulamayı 10 dakikada kurun.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
            >
              Ücretsiz başla <ArrowRight className="size-[18px]" />
            </Link>
          </Reveal>
        </div>
      </article>

      {/* İlgili yazılar */}
      {digerleri.length > 0 && (
        <section className="border-t border-veylify-100 bg-veylify-50/30 px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-slate-500">
              <BookOpen className="size-4" /> Devamını okuyun
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {digerleri.map((y) => (
                <Link
                  key={y.slug}
                  href={`/blog/${y.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]"
                >
                  <span className="w-fit text-[11.5px] font-bold uppercase tracking-wide text-veylify-600">
                    {y.kategori}
                  </span>
                  <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-veylify-950">
                    {y.baslik}
                  </h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">{y.ozet}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-veylify-700 transition group-hover:gap-2.5">
                    Oku <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
