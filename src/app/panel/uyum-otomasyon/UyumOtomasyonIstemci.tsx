"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Check, AlertTriangle, Download, RefreshCw, FileText,
  Zap, Radar, ClipboardCheck, ChevronDown, CircleCheck, CircleDashed,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { uoCeviri } from "./uyum-otomasyon.i18n";
import { Histogram, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { DonutDagilim } from "@/components/panel/grafikler";
import type { CerceveKey } from "@/app/panel/uyum/cerceve";
import {
  cerceveKapsamlari, kanitPaketi,
  type OtomasyonSonuc, type KanitSonuc,
} from "@/lib/specter/uyum-otomasyon";

/** dil → BCP-47 (tarih biçimlemesi için). */
const YEREL: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/** Çerçeve görsel meta (renk + kısa ad). cerceve.ts ile tutarlı. Adlar özel-ad, çevrilmez. */
const CERCEVE_META: Record<CerceveKey, { ad: string; renk: string }> = {
  soc2: { ad: "SOC 2", renk: "#2f6fed" },
  iso27001: { ad: "ISO 27001", renk: "#7c3aed" },
  kvkk: { ad: "KVKK", renk: "#16a34a" },
  gdpr: { ad: "GDPR", renk: "#d97706" },
};

/** İnsan-okur "… önce" (dakika/saat/gün). Dil-duyarlı; yalnızca gösterim. */
function goreliZaman(ts: number, dil: Dil): string {
  const fark = Date.now() - ts;
  const dk = Math.round(fark / 60000);
  if (dk < 1) return uoCeviri("uo.zaman.azOnce", dil);
  if (dk < 60) return uoCeviri("uo.zaman.dk", dil).replace("{n}", String(dk));
  const s = Math.round(dk / 60);
  if (s < 24) return uoCeviri("uo.zaman.sa", dil).replace("{n}", String(s));
  return uoCeviri("uo.zaman.g", dil).replace("{n}", String(Math.round(s / 24)));
}

function tamZaman(ts: number, yerel: string): string {
  return new Date(ts).toLocaleString(yerel, { dateStyle: "medium", timeStyle: "short" });
}

const skorRenk = (s: number) => (s >= 90 ? "#16a34a" : s >= 70 ? "#2f6fed" : s >= 50 ? "#d97706" : "#dc2626");

export function UyumOtomasyonIstemci({
  dil,
  sonuc,
  hesapAdi,
}: {
  dil: Dil;
  sonuc: OtomasyonSonuc;
  hesapAdi: string;
}) {
  const { goster } = useToast();
  const t = (k: string) => uoCeviri(k, dil);
  const yerel = YEREL[dil];
  const router = useRouter();
  const [bekliyor, gecisBaslat] = useTransition();
  const [taraniyorFlag, setTaraniyorFlag] = useState(false);
  const [acik, setAcik] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"hepsi" | "otomatik" | "elle">("hepsi");

  const kapsamlar = useMemo(() => cerceveKapsamlari(sonuc), [sonuc]);

  const gorunenSonuclar = useMemo(() => {
    if (filtre === "otomatik") return sonuc.sonuclar.filter((s) => s.gecti);
    if (filtre === "elle") return sonuc.sonuclar.filter((s) => !s.gecti);
    return sonuc.sonuclar;
  }, [sonuc.sonuclar, filtre]);

  /** Yeniden tara: sunucu verisini tazeler (router.refresh) — dürüst, gerçek yeniden-değerlendirme. */
  function yenidenTara() {
    setTaraniyorFlag(true);
    gecisBaslat(() => {
      router.refresh();
    });
    // Görsel geri bildirim; refresh tamamlanınca yeni props gelir.
    setTimeout(() => {
      setTaraniyorFlag(false);
      goster({ tip: "basari", baslik: t("uo.toast.tarandiBaslik"), aciklama: t("uo.toast.tarandiAcik") });
    }, 650);
  }

  /** Kanıt paketini .txt indir. */
  function paketIndirTxt() {
    const metin = kanitPaketi(sonuc, { hesapAdi });
    const blob = new Blob(["﻿" + metin], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specter-uyum-kanit-paketi.txt";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("uo.toast.indirildiTxt") });
  }

  /** Kanıt paketini yapılandırılmış JSON indir (denetçi araç entegrasyonu için). */
  function paketIndirJson() {
    const veri = {
      urun: "Veylify",
      tur: "otomatik-uyum-kanit-paketi",
      hesap: hesapAdi,
      taramaAni: new Date(sonuc.sonTarama).toISOString(),
      kapsamSkoru: sonuc.kapsamSkoru,
      gecen: sonuc.gecenSayi,
      toplam: sonuc.toplamSayi,
      otomatikKontrolSayisi: sonuc.otomatikKontrolSayisi,
      cerceveKapsamlari: kapsamlar,
      toplayicilar: sonuc.sonuclar.map((s) => ({
        anahtar: s.anahtar,
        ad: s.ad,
        gecti: s.gecti,
        kanit: s.kanit,
        detay: s.detay,
        kontroller: s.kontroller,
        sonKontrol: new Date(s.sonKontrol).toISOString(),
      })),
      not: "Otomatik kanıt resmi denetimin yerine geçmez; onu tamamlar.",
    };
    const blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specter-uyum-kanit-paketi.json";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("uo.toast.indirildiJson") });
  }

  const taraniyor = taraniyorFlag || bekliyor;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Zap className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("uo.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("uo.intro.metin")}</p>
        </div>
      </div>

      {/* özet skorlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${sonuc.kapsamSkoru}`}
          etiket={t("uo.ozet.kapsam")}
          ikon={<ShieldCheck className="size-5" />}
          tone={sonuc.kapsamSkoru >= 80 ? "ok" : sonuc.kapsamSkoru >= 50 ? "warn" : "danger"}
        />
        <StatKart sayi={`${sonuc.gecenSayi}/${sonuc.toplamSayi}`} etiket={t("uo.ozet.dogrulanan")} tone="ok" ikon={<CircleCheck className="size-5" />} />
        <StatKart sayi={sonuc.otomatikKontrolSayisi} etiket={t("uo.ozet.canliKontrol")} ikon={<ClipboardCheck className="size-5" />} />
        <StatKart sayi={sonuc.toplamSayi - sonuc.gecenSayi} etiket={t("uo.ozet.elleGereken")} tone={sonuc.toplamSayi - sonuc.gecenSayi > 0 ? "warn" : "ok"} ikon={<AlertTriangle className="size-5" />} />
      </div>

      {/* görsel panolar: kapsam gauge + kanıt toplama donut + çerçeve histogram */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* otomasyon kapsam gauge */}
        <div className="flex flex-col items-center rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-1 self-start text-[14px] font-semibold text-slate-ink">{t("uo.gorsel.kapsamBaslik")}</div>
          <div className="mb-2 self-start text-[12px] text-slate-muted">{t("uo.gorsel.kapsamAlt")}</div>
          <div className="grid flex-1 place-items-center">
            <GaugeGost
              deger={sonuc.kapsamSkoru}
              etiket={`${sonuc.gecenSayi}/${sonuc.toplamSayi} ${t("uo.gorsel.toplayici")}`}
              boyut={180}
              renk={skorRenk(sonuc.kapsamSkoru)}
            />
          </div>
        </div>

        {/* kanıt toplama durumu (otomatik/elle donut) */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-3 text-[14px] font-semibold text-slate-ink">{t("uo.gorsel.dagilimBaslik")}</div>
          <DonutDagilim
            merkezEtiket={t("uo.gorsel.toplayici")}
            segmentler={[
              { etiket: t("uo.gorsel.otomatik"), deger: sonuc.gecenSayi, renk: "#16a34a" },
              { etiket: t("uo.gorsel.elle"), deger: sonuc.toplamSayi - sonuc.gecenSayi, renk: "#d97706" },
            ]}
          />
        </div>

        {/* çerçeve kanıt yoğunluğu (histogram) */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-1 text-[14px] font-semibold text-slate-ink">{t("uo.gorsel.cerceveBaslik")}</div>
          <div className="mb-4 text-[12px] text-slate-muted">{t("uo.gorsel.cerceveAlt")}</div>
          <Histogram
            yukseklik={110}
            kovalar={kapsamlar.map((c) => ({
              etiket: CERCEVE_META[c.cerceve].ad,
              deger: c.toplamKontrol ? Math.round((c.otomatikKontrol / c.toplamKontrol) * 100) : 0,
            }))}
          />
        </div>
      </div>

      {/* sürekli izleme şeridi */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className={cn("absolute inline-flex size-full rounded-full bg-ok opacity-60", !taraniyor && "animate-ping")} />
            <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
          </span>
          <span className="text-[13px] font-medium text-slate-ink">{t("uo.izleme.aktif")}</span>
          <span className="text-[13px] text-slate-muted">{t("uo.izleme.sonTarama").replace("{goreli}", goreliZaman(sonuc.sonTarama, dil)).replace("{tam}", tamZaman(sonuc.sonTarama, yerel))}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={yenidenTara} disabled={taraniyor}>
            <RefreshCw className={cn("size-4", taraniyor && "animate-spin")} /> {taraniyor ? t("uo.izleme.taraniyor") : t("uo.izleme.yenidenTara")}
          </Button>
          <Button variant="outline" size="sm" onClick={paketIndirTxt}>
            <Download className="size-4" /> {t("uo.izleme.paketTxt")}
          </Button>
          <Button variant="accent" size="sm" onClick={paketIndirJson}>
            <FileText className="size-4" /> {t("uo.izleme.paketJson")}
          </Button>
        </div>
      </div>

      {/* çerçeve kapsam panosu */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kapsamlar.map((c) => {
          const yuzde = c.toplamKontrol ? Math.round((c.otomatikKontrol / c.toplamKontrol) * 100) : 0;
          const meta = CERCEVE_META[c.cerceve];
          return (
            <div key={c.cerceve} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-2xl text-white" style={{ background: meta.renk }}>
                  <ShieldCheck className="size-5" />
                </span>
                <span className="num text-[20px] font-bold" style={{ color: skorRenk(yuzde) }}>%{yuzde}</span>
              </div>
              <div className="mt-3 font-semibold text-slate-ink">{meta.ad}</div>
              <div className="text-[12px] text-slate-muted">{t("uo.pano.otomatikKanitli").replace("{otomatik}", String(c.otomatikKontrol)).replace("{toplam}", String(c.toplamKontrol))}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full transition-all" style={{ width: `${yuzde}%`, background: skorRenk(yuzde) }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* toplayıcı listesi */}
      <Panel
        baslik={t("uo.list.baslik")}
        sagUst={
          <div className="flex items-center gap-1 rounded-full bg-canvas p-1">
            {([
              ["hepsi", t("uo.list.filtre.hepsi").replace("{n}", String(sonuc.toplamSayi))],
              ["otomatik", t("uo.list.filtre.otomatik").replace("{n}", String(sonuc.gecenSayi))],
              ["elle", t("uo.list.filtre.elle").replace("{n}", String(sonuc.toplamSayi - sonuc.gecenSayi))],
            ] as const).map(([deger, etiket]) => (
              <button
                key={deger}
                onClick={() => setFiltre(deger)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition",
                  filtre === deger ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted hover:text-slate-ink",
                )}
              >
                {etiket}
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-2.5">
          {gorunenSonuclar.map((s) => (
            <ToplayiciSatir key={s.anahtar} sonuc={s} acik={acik === s.anahtar} onToggle={() => setAcik(acik === s.anahtar ? null : s.anahtar)} dil={dil} />
          ))}
          {gorunenSonuclar.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-8 text-center text-[13px] text-slate-muted">
              {t("uo.list.bos")}
            </div>
          )}
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span dangerouslySetInnerHTML={{ __html: t("uo.dust.metin") }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Tek toplayıcı satırı */

function ToplayiciSatir({ sonuc, acik, onToggle, dil }: { sonuc: KanitSonuc; acik: boolean; onToggle: () => void; dil: Dil }) {
  const t = (k: string) => uoCeviri(k, dil);
  const yerel = YEREL[dil];
  return (
    <div className={cn("rounded-2xl border bg-surface transition", sonuc.gecti ? "border-line" : "border-amber-200/70 bg-warn-soft/20")}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl",
            sonuc.gecti ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn",
          )}
        >
          {sonuc.gecti ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-ink">{sonuc.ad}</span>
            <Badge ton={sonuc.gecti ? "yesil" : "sari"}>{sonuc.gecti ? t("uo.satir.dogrulandi") : t("uo.satir.elleGerekli")}</Badge>
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-brand-700">
            <FileText className="mt-0.5 size-3 shrink-0" /> {sonuc.kanit}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {sonuc.kontroller.map((k) => {
              const meta = CERCEVE_META[k.cerceve];
              return (
                <span
                  key={`${k.cerceve}:${k.kontrolId}`}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1 ring-inset"
                  style={{ color: meta.renk, background: `${meta.renk}12`, borderColor: `${meta.renk}30` }}
                >
                  {meta.ad} {k.kontrolId}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-[11px] text-slate-faint">
            <Radar className="size-3" /> {goreliZaman(sonuc.sonKontrol, dil)}
          </span>
          <ChevronDown className={cn("size-4 text-slate-faint transition", acik && "rotate-180")} />
        </div>
      </button>
      {acik && (
        <div className="border-t border-line px-4 py-3.5">
          <p className="mb-2 text-[12px] text-slate-muted">{sonuc.aciklama}</p>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("uo.satir.kanitIzi")}</div>
          <ul className="space-y-1">
            {sonuc.detay.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-ink">
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", sonuc.gecti ? "bg-ok" : "bg-warn")} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 text-[11px] text-slate-faint">{t("uo.satir.sonKontrol").replace("{tam}", tamZaman(sonuc.sonKontrol, yerel))}</div>
        </div>
      )}
    </div>
  );
}
