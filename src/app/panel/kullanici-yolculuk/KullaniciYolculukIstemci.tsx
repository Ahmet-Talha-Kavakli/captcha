"use client";

import Link from "next/link";
import { Users, Bot, TrendingDown, ShieldCheck, Scale, ArrowRight, Check, AlertTriangle, ArrowDown } from "lucide-react";
import { Panel, StatKart } from "@/components/panel/kit";
import type { YolculukSonuc, HuniAsama } from "@/lib/specter/kullanici-yolculuk";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { yolculukCeviri } from "./kullanici-yolculuk.i18n";

/** Sayı biçimi için BCP-47 yerel kodları. */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/**
 * Öneriler istemcide `sonuc` sayısal alanlarından yeniden türetilir (motorun
 * `yolculukOneriler` mantığının birebir aynası). Böylece motor TR metni
 * düzenlenmeden çeviri sağlanır. Her öneri sabit bir anahtar taşır.
 */
function oneriTuret(s: YolculukSonuc): { anahtar: string; tip: "iyi" | "uyari"; n?: number }[] {
  const o: { anahtar: string; tip: "iyi" | "uyari"; n?: number }[] = [];
  if (s.surtunmeKaybi > 8) o.push({ anahtar: "surtunmeYuksek", tip: "uyari", n: s.surtunmeKaybi });
  else o.push({ anahtar: "surtunmeDusuk", tip: "iyi" });
  if (s.botGecis > 10) o.push({ anahtar: "botSizinti", tip: "uyari", n: s.botGecis });
  else o.push({ anahtar: "botEtkili", tip: "iyi" });
  if (s.dengeSkoru < 60) o.push({ anahtar: "denge", tip: "uyari" });
  return o;
}

export function KullaniciYolculukIstemci({ sonuc, dil }: { sonuc: YolculukSonuc; dil: Dil }) {
  const t = (anahtar: string) => yolculukCeviri(anahtar, dil);
  const oneriler = oneriTuret(sonuc);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Scale className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ky.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {(() => {
              // "{surtunme}" ve "{denge}" yer tutucularını <b> ile çevreleyerek yerleştir.
              const metin = t("ky.intro.metin");
              const parcalar = metin.split(/(\{surtunme\}|\{denge\})/g);
              return parcalar.map((p, i) =>
                p === "{surtunme}" ? <b key={i}>{t("ky.intro.surtunme")}</b> :
                p === "{denge}" ? <b key={i}>{t("ky.intro.denge")}</b> :
                <span key={i}>{p}</span>,
              );
            })()}
          </p>
        </div>
      </div>

      {/* özet vurgular */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`%${sonuc.insanDonusum}`} etiket={t("ky.stat.insanDonusum")} ikon={<Users className="size-5" />} tone="ok" />
        <StatKart sayi={`%${sonuc.surtunmeKaybi}`} etiket={t("ky.stat.surtunmeKaybi")} ikon={<TrendingDown className="size-5" />} tone={sonuc.surtunmeKaybi > 8 ? "danger" : "ok"} />
        <StatKart sayi={`%${sonuc.botGecis}`} etiket={t("ky.stat.botSizinti")} ikon={<Bot className="size-5" />} tone={sonuc.botGecis > 10 ? "danger" : "ok"} />
        <StatKart sayi={`${sonuc.dengeSkoru}`} etiket={t("ky.stat.dengeSkoru")} ikon={<Scale className="size-5" />} tone={sonuc.dengeSkoru >= 70 ? "ok" : "warn"} />
      </div>

      {/* iki huni yan yana */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HuniKart baslik={t("ky.huni.insan.baslik")} alt={t("ky.huni.insan.alt")} renk="#16a34a" asamalar={sonuc.insanHuni} ikon={<Users className="size-4" />} dizi="insan" dil={dil} t={t} />
        <HuniKart baslik={t("ky.huni.bot.baslik")} alt={t("ky.huni.bot.alt")} renk="#dc2626" asamalar={sonuc.botHuni} ikon={<Bot className="size-4" />} tersMantik dizi="bot" dil={dil} t={t} />
      </div>

      {/* öneriler */}
      <Panel baslik={t("ky.oneri.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oneriler.map((o) => {
            const baslik = t(`ky.oneri.${o.anahtar}.baslik`);
            const metin = t(`ky.oneri.${o.anahtar}.metin`).replace("{n}", String(o.n ?? ""));
            return (
              <div key={o.anahtar} className={cn("rounded-2xl border px-4 py-3.5", o.tip === "iyi" ? "border-green-200 bg-ok-soft/40" : "border-warn-soft bg-warn-soft/30")}>
                <div className={cn("flex items-center gap-1.5 text-[13.5px] font-semibold", o.tip === "iyi" ? "text-green-700" : "text-amber-700")}>
                  {o.tip === "iyi" ? <Check className="size-4" /> : <AlertTriangle className="size-4" />} {baslik}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{metin}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/panel/zorluk" className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800">{t("ky.cta.zorluk")} <ArrowRight className="size-3.5" /></Link>
          <Link href="/panel/surtunme" className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink">{t("ky.cta.surtunme")} <ArrowRight className="size-3.5" /></Link>
          <Link href="/panel/birlesik-risk" className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink">{t("ky.cta.risk")} <ArrowRight className="size-3.5" /></Link>
        </div>
      </Panel>
    </div>
  );
}

function HuniKart({
  baslik, alt, renk, asamalar, ikon, tersMantik, dizi, dil, t,
}: {
  baslik: string;
  alt: string;
  renk: string;
  asamalar: HuniAsama[];
  ikon: React.ReactNode;
  tersMantik?: boolean;
  /** "insan" | "bot" — çeviri anahtar önekini belirler. */
  dizi: "insan" | "bot";
  dil: Dil;
  t: (anahtar: string) => string;
}) {
  const yerel = YEREL[dil];
  const max = Math.max(1, ...asamalar.map((a) => a.sayi));
  return (
    <Panel baslik={<span className="flex items-center gap-2" style={{ color: renk }}>{ikon} {baslik}</span>}>
      <p className="mb-3 text-[12px] text-slate-faint">{alt}</p>
      <div className="space-y-1">
        {asamalar.map((a, i) => {
          const genislik = (a.sayi / max) * 100;
          const sondan = i === asamalar.length - 1;
          // Aşama adı motorda TR üretilir → indeks-anahtarla yeniden çevrilir.
          const asamaAd = t(`ky.${dizi}.${i}.ad`);
          return (
            <div key={i}>
              <div className="relative mx-auto overflow-hidden rounded-lg" style={{ width: `${Math.max(20, genislik)}%` }}>
                <div className="flex items-center justify-between px-3 py-2.5 text-white" style={{ background: renk, opacity: 0.55 + (i / asamalar.length) * 0.45 }}>
                  <span className="text-[12.5px] font-medium">{asamaAd}</span>
                  <span className="num text-[13px] font-bold">{a.sayi.toLocaleString(yerel)}</span>
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-2 text-[11px] text-slate-faint">
                <span>%{a.gecisOran} {t("ky.huni.gecis")}</span>
                {a.dusen > 0 && <span className={cn(tersMantik ? "text-ok" : "text-danger2")}>−{a.dusen.toLocaleString(yerel)}</span>}
              </div>
              {!sondan && <div className="flex justify-center py-0.5"><ArrowDown className="size-3 text-slate-300" /></div>}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-canvas/50 px-3 py-2 text-[11.5px] text-slate-muted">
        {/* Boş dizide `length-1` = -1 → geçersiz çeviri anahtarı (ky.insan.-1…) üretiyordu. */}
        <ShieldCheck className="size-3.5 shrink-0" style={{ color: renk }} /> {asamalar.length ? t(`ky.${dizi}.${asamalar.length - 1}.aciklama`) : ""}
      </div>
    </Panel>
  );
}
