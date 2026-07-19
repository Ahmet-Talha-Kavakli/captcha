"use client";

/**
 * Öğrenme Merkezi — istemci arayüzü.
 *
 * Bölümler: hero + arama, hızlı başlangıç yolu, rehber kategorileri,
 * öne çıkan makaleler (drawer detay), kod örnekleri kütüphanesi,
 * video ipuçları, SSS (accordion), yardım CTA.
 *
 * Tüm içerik ./icerik.ts sabit dosyasından gelir. Arama; makale, kategori,
 * kod örneği ve SSS başlıklarını client-side filtreler.
 */
import { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import {
  GraduationCap,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowRight,
  Play,
  Code,
  HelpCircle,
  X,
  LifeBuoy,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Panel, Badge, KodBlok, NotKutusu, BosDurum, useScrollKilit } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { ogrenmeCeviri } from "./ogrenme.i18n";
import {
  HIZLI_BASLANGIC,
  KATEGORILER,
  MAKALELER,
  KOD_ORNEKLERI,
  VIDEOLAR,
  SSS,
  ZORLUK_TON,
  type Zorluk,
  type Makale,
  type Blok,
} from "./icerik";

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

function trAra(kaynak: string, sorgu: string) {
  return kaynak.toLocaleLowerCase("tr").includes(sorgu.toLocaleLowerCase("tr"));
}

// Zorluk enum'u → i18n anahtarı; görünen etiket t() ile çözülür (icerik.ts
// ZORLUK_ETIKET label-map'inin yeniden üretimi — lib/dosya düzenlenmez).
const zorlukEtiket = (z: Zorluk, dil: Dil) => ogrenmeCeviri(`og.zorluk.${z}`, dil);

export function OgrenmeIstemci({ dil }: { dil: Dil }) {
  const t = (k: string) => ogrenmeCeviri(k, dil);
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState<string>("hepsi");
  const [acikMakale, setAcikMakale] = useState<Makale | null>(null);
  const [acikSSS, setAcikSSS] = useState<number | null>(0);
  const [acikKod, setAcikKod] = useState<string>(KOD_ORNEKLERI[0]?.key ?? "");

  const sorgu = q.trim();
  const aramaVar = sorgu.length > 0;

  const makaleler = useMemo(() => {
    return MAKALELER.filter((m) => {
      if (kategori !== "hepsi" && m.kategori !== kategori) return false;
      if (!sorgu) return true;
      return trAra(m.baslik, sorgu) || trAra(m.ozet, sorgu) || trAra(m.kategoriAd, sorgu);
    });
  }, [sorgu, kategori]);

  const oneCikanlar = useMemo(
    () => (aramaVar || kategori !== "hepsi" ? makaleler : makaleler.filter((m) => m.onecikan)),
    [makaleler, aramaVar, kategori],
  );

  const sssFiltreli = useMemo(
    () => (!sorgu ? SSS : SSS.filter((s) => trAra(s.soru, sorgu) || trAra(s.cevap, sorgu))),
    [sorgu],
  );

  const kodFiltreli = useMemo(
    () => (!sorgu ? KOD_ORNEKLERI : KOD_ORNEKLERI.filter((k) => trAra(k.baslik, sorgu) || trAra(k.aciklama, sorgu))),
    [sorgu],
  );

  const kategoriFiltreli = useMemo(
    () => (!sorgu ? KATEGORILER : KATEGORILER.filter((k) => trAra(k.ad, sorgu) || trAra(k.aciklama, sorgu))),
    [sorgu],
  );

  const hicSonucYok =
    aramaVar &&
    makaleler.length === 0 &&
    sssFiltreli.length === 0 &&
    kodFiltreli.length === 0 &&
    kategoriFiltreli.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-6 pt-6 pb-16 lg:px-10">
      {/* ---------------------------------------------------------------- Hero + arama */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-50 via-surface to-surface px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-8 -top-8 hidden size-48 rounded-full bg-brand-100/50 blur-3xl sm:block" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-[12px] font-semibold text-brand-700">
            <GraduationCap className="size-3.5" /> {t("og.hero.rozet")}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-ink sm:text-4xl">
            {t("og.hero.baslik")}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-muted">
            {t("og.hero.altbaslik")}
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t("og.hero.araLabel")}
              placeholder={t("og.hero.araPlaceholder")}
              className="h-[52px] w-full rounded-2xl border border-line-strong bg-surface py-3.5 pl-12 pr-11 text-[15px] text-slate-ink shadow-card outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label={t("og.hero.temizleLabel")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {!aramaVar && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-faint">
              <span>{t("og.hero.populer")}</span>
              {["widget", "siteverify", "webhook", "GPTBot", "kural"].map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(t)}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 font-medium text-slate-muted transition hover:border-brand-300 hover:text-brand-700"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {hicSonucYok && (
        <BosDurum
          ikon={<Search className="size-7" />}
          baslik={t("og.bos.baslik").replace("{sorgu}", sorgu)}
          aciklama={t("og.bos.aciklama")}
          aksiyon={<Button variant="outline" onClick={() => setQ("")}>{t("og.bos.temizle")}</Button>}
        />
      )}

      {/* ---------------------------------------------------------------- Hızlı başlangıç */}
      {!aramaVar && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-ink">{t("og.hizli.baslik")}</h2>
              <p className="mt-1 text-sm text-slate-muted">{t("og.hizli.altbaslik")}</p>
            </div>
            <span className="hidden text-[13px] font-medium text-slate-faint sm:block">{t("og.hizli.toplam")}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {HIZLI_BASLANGIC.map((adim, i) => (
              <div
                key={adim.no}
                className="group relative flex flex-col rounded-3xl border border-line bg-surface p-5 transition hover:border-brand-300 hover:shadow-card"
              >
                {i < HIZLI_BASLANGIC.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-9 z-10 hidden size-5 text-line-strong lg:block" />
                )}
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <LucideIkon name={adim.ikon} className="size-5" />
                  </span>
                  <span className="grid size-6 place-items-center rounded-full bg-ink-900 text-[12px] font-bold text-white">
                    {adim.no}
                  </span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-slate-ink">{adim.baslik}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-muted">{adim.aciklama}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={adim.href}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition hover:gap-1.5"
                  >
                    {adim.hrefEtiket} <ChevronRight className="size-3.5" />
                  </Link>
                  <span className="inline-flex items-center gap-1 text-[12px] text-slate-faint">
                    <Clock className="size-3.5" /> {adim.sure}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Kategoriler */}
      {kategoriFiltreli.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-ink">{t("og.kat.baslik")}</h2>
            <p className="mt-1 text-sm text-slate-muted">{t("og.kat.altbaslik")}</p>
          </div>
          {!aramaVar && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setKategori("hepsi")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                  kategori === "hepsi" ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
                )}
              >
                {t("og.kat.tumu")}
              </button>
              {KATEGORILER.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setKategori(k.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                    kategori === k.key ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
                  )}
                >
                  {k.ad}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kategoriFiltreli.map((k) => (
              <button
                key={k.key}
                onClick={() => {
                  setKategori(k.key);
                  setQ("");
                  document.getElementById("makaleler")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group flex items-start gap-4 rounded-3xl border border-line bg-surface p-5 text-left transition hover:border-brand-300 hover:shadow-card"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <LucideIkon name={k.ikon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-ink">{k.ad}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-muted">{k.aciklama}</p>
                  <span className="mt-2 inline-block text-[12px] font-medium text-slate-faint">
                    {t("og.kat.makaleSayisi").replace("{n}", String(k.makaleSayisi))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Makaleler */}
      {makaleler.length > 0 && (
        <section id="makaleler">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-ink">
                {aramaVar || kategori !== "hepsi" ? t("og.mak.baslikArama") : t("og.mak.baslikOne")}
              </h2>
              <p className="mt-1 text-sm text-slate-muted">
                {kategori !== "hepsi" && !aramaVar
                  ? t("og.mak.altKategori").replace("{ad}", KATEGORILER.find((k) => k.key === kategori)?.ad ?? "")
                  : t("og.mak.altVarsayilan")}
              </p>
            </div>
            {kategori !== "hepsi" && !aramaVar && (
              <button
                onClick={() => setKategori("hepsi")}
                className="text-[13px] font-medium text-brand-700 transition hover:underline"
              >
                {t("og.mak.tumunuGoster")}
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {oneCikanlar.map((m) => (
              <button
                key={m.slug}
                onClick={() => setAcikMakale(m)}
                className="group flex flex-col rounded-3xl border border-line bg-surface p-5 text-left transition hover:border-brand-300 hover:shadow-card"
              >
                <div className="flex items-center gap-2">
                  <Badge ton="gri">{m.kategoriAd}</Badge>
                  <Badge ton={ZORLUK_TON[m.zorluk]}>{zorlukEtiket(m.zorluk, dil)}</Badge>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-slate-ink transition group-hover:text-brand-700">
                  {m.baslik}
                </h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-slate-muted">{m.ozet}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="inline-flex items-center gap-1 text-[12px] text-slate-faint">
                    <Clock className="size-3.5" /> {t("og.mak.okuma").replace("{n}", String(m.okuma))}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition group-hover:gap-1.5">
                    {t("og.mak.oku")} <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Kod kütüphanesi */}
      {kodFiltreli.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Code className="size-5 text-brand-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-ink">{t("og.kod.baslik")}</h2>
              <p className="mt-1 text-sm text-slate-muted">{t("og.kod.altbaslik")}</p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            {/* liste */}
            <div className="flex flex-col gap-1.5">
              {kodFiltreli.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setAcikKod(k.key)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition",
                    acikKod === k.key
                      ? "border-brand-300 bg-brand-50"
                      : "border-line bg-surface hover:border-brand-200 hover:bg-canvas/50",
                  )}
                >
                  <div className={cn("text-[13.5px] font-semibold", acikKod === k.key ? "text-brand-800" : "text-slate-ink")}>
                    {k.baslik}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{k.aciklama}</div>
                </button>
              ))}
            </div>
            {/* seçili kod */}
            <div className="min-w-0">
              {(() => {
                const secili = kodFiltreli.find((k) => k.key === acikKod) ?? kodFiltreli[0];
                if (!secili) return null;
                return <KodBlok kod={secili.kod} dil={secili.dil} baslik={secili.baslik} maxH="max-h-[560px]" />;
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Videolar */}
      {!aramaVar && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Play className="size-5 text-brand-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-ink">{t("og.video.baslik")}</h2>
              <p className="mt-1 text-sm text-slate-muted">{t("og.video.altbaslik")}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VIDEOLAR.map((v) => (
              <div
                key={v.key}
                className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface"
              >
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-ink-900 to-slate-700">
                  <span className="grid size-12 place-items-center rounded-full bg-white/95 text-ink-900 shadow-lift">
                    <Play className="size-5 translate-x-0.5 fill-current" />
                  </span>
                  {/* Video henüz çekilmedi: dürüst "Yakında" rozeti (yanıltıcı tıklama vaadi yok). */}
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-900">
                    {t("og.video.yakinda")}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {v.sure}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2">
                    <Badge ton={ZORLUK_TON[v.seviye]}>{zorlukEtiket(v.seviye, dil)}</Badge>
                  </div>
                  <h3 className="text-[14px] font-semibold leading-snug text-slate-ink">{v.baslik}</h3>
                  <p className="mt-1 flex-1 text-[12px] leading-relaxed text-slate-muted">{v.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- SSS */}
      {sssFiltreli.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="size-5 text-brand-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-ink">{t("og.sss.baslik")}</h2>
              <p className="mt-1 text-sm text-slate-muted">{t("og.sss.altbaslik")}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            {sssFiltreli.map((s, i) => {
              const acik = acikSSS === i;
              return (
                <div key={s.soru} className="border-b border-line last:border-0">
                  <button
                    onClick={() => setAcikSSS(acik ? null : i)}
                    aria-expanded={acik}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-canvas/40"
                  >
                    <span className="text-[15px] font-medium text-slate-ink">{s.soru}</span>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-slate-faint transition-transform", acik && "rotate-180 text-brand-600")}
                    />
                  </button>
                  {acik && (
                    <div className="px-5 pb-4 text-[14px] leading-relaxed text-slate-muted animate-fade-up">{s.cevap}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Yardım CTA */}
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-ink-900 to-slate-800 px-6 py-8 text-white sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-brand-300" />
              <h2 className="text-xl font-bold">{t("og.cta.baslik")}</h2>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">
              {t("og.cta.metin")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/panel/entegrasyonlar"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink-900 transition hover:bg-brand-50"
            >
              <MessageCircle className="size-4" /> {t("og.cta.destek")}
            </Link>
            <a
              href="/sdk/rest.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-white/10"
            >
              <BookOpen className="size-4" /> {t("og.cta.rest")}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Makale drawer */}
      <MakaleDrawer makale={acikMakale} kapat={() => setAcikMakale(null)} dil={dil} />
    </div>
  );
}

/* ------------------------------------------------------------------ Drawer */
function MakaleDrawer({ makale, kapat, dil }: { makale: Makale | null; kapat: () => void; dil: Dil }) {
  const t = (k: string) => ogrenmeCeviri(k, dil);
  // Drawer açıkken arka plan sayfasının kaymasını kilitle — aksi halde
  // fixed backdrop yalnızca ekranı kaplarken altta bulanık olmayan bir
  // şerit görünür (sayfa arkada bağımsız kayabildiği için).
  useScrollKilit(!!makale);
  return (
    <>
      <div
        onClick={kapat}
        className={cn(
          "fixed inset-0 z-[90] bg-ink-950/40 backdrop-blur-sm transition-opacity duration-200",
          makale ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[95] flex h-full w-full max-w-2xl flex-col border-l border-line bg-surface shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          makale ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!makale}
      >
        {makale && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge ton="gri">{makale.kategoriAd}</Badge>
                  <Badge ton={ZORLUK_TON[makale.zorluk]}>{zorlukEtiket(makale.zorluk, dil)}</Badge>
                  <span className="inline-flex items-center gap-1 text-[12px] text-slate-faint">
                    <Clock className="size-3.5" /> {t("og.mak.okuma").replace("{n}", String(makale.okuma))}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-ink">{makale.baslik}</h2>
              </div>
              <button
                onClick={kapat}
                aria-label={t("og.drawer.kapat")}
                className="shrink-0 rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {makale.govde.map((b, i) => (
                <BlokRender key={i} blok={b} />
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function BlokRender({ blok }: { blok: Blok }) {
  switch (blok.tip) {
    case "h":
      return <h3 className="pt-2 text-[17px] font-semibold text-slate-ink">{blok.metin}</h3>;
    case "p":
      return <p className="text-[14.5px] leading-relaxed text-slate-muted">{blok.metin}</p>;
    case "liste":
      return (
        <ul className="space-y-2">
          {blok.ogeler.map((o, i) => (
            <li key={i} className="flex gap-2.5 text-[14.5px] leading-relaxed text-slate-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      );
    case "not":
      return (
        <NotKutusu ton={blok.ton} baslik={blok.baslik}>
          {blok.metin}
        </NotKutusu>
      );
    case "kod":
      return <KodBlok kod={blok.kod} dil={blok.dil} baslik={blok.baslik} />;
    default:
      return null;
  }
}
