"use client";

/**
 * Dil & Yerelleştirme İstemcisi — DilIstemci.tsx
 * ===============================================
 * Widget'ın (public/specter.js) desteklediği dilleri yönetir ve canlı önizler.
 *   - Desteklenen dillerin listesi (native ad + bayrak + RTL rozeti).
 *   - Seçilen dile göre GÜNCELLENEN ghost-font doğrulama kartı taklidi
 *     (gerçek canvas yok; sadece çevrilmiş UI iskeleti — talimat gereği).
 *   - data-lang entegrasyon parçacığı + kopyala.
 *   - Dil × anahtar kapsam tablosu (%100 tamlığı kanıtlar).
 *   - Otomatik algılama sırası hakkında dürüst not.
 *
 * i18n NOTU: Panel KRONU `dilCeviri(anahtar, dil)` ile 5 dile (tr/en/de/fr/es) çevrilir.
 * VERİ olan ve ASLA çevrilmeyenler: dil endonimleri (secili.nativeAd), widget önizleme
 * metinleri (dil.ceviriler — widget'ın kendi I18N kopyasıyla BİREBİR), data-lang kod
 * parçacığı ve dil kodları. RTL bir bayrak enum'udur; kısaltması evrensel olduğundan sabit.
 */

import { useMemo, useState } from "react";
import { Languages, ShieldCheck, Lock, RotateCw, Volume2, Check, Globe, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Panel, StatKart, Badge, KodBlok, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { dilCeviri } from "./dil.i18n";
import type { WidgetDil } from "@/lib/widget-i18n";

export function DilIstemci({ diller, anahtarlar, dil }: { diller: WidgetDil[]; anahtarlar: string[]; dil: Dil }) {
  const t = (k: string) => dilCeviri(k, dil);
  const { goster } = useToast();
  const [seciliKod, setSeciliKod] = useState<string>(diller[0]?.kod ?? "tr");

  const secili = useMemo(
    () => diller.find((d) => d.kod === seciliKod) ?? diller[0],
    [diller, seciliKod],
  );

  const rtlSayisi = diller.filter((d) => d.rtl).length;

  // Entegrasyon parçacığı — seçili dilin data-lang değeriyle.
  const snippet = useMemo(
    () =>
      `<div class="veylify"\n     data-sitekey="pk_site_anahtariniz"\n     data-lang="${secili.kod}"></div>\n<script src="https://veylify.com/veylify.js" async defer></script>`,
    [secili.kod],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Languages className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("tanit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {(() => {
              // {sayi} sayı olarak konur; {kod} → <code>data-lang</code> düğümüyle değişir.
              const [once, sonra] = t("tanit.metin")
                .replace("{sayi}", String(diller.length))
                .split("{kod}");
              return (
                <>
                  {once}
                  <code className="rounded bg-white px-1 py-0.5 text-[12px] font-medium text-brand-700">data-lang</code>
                  {sonra}
                </>
              );
            })()}
          </p>
        </div>
      </div>

      {/* özet istatistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={diller.length} etiket={t("ozet.dil")} ikon={<Globe className="size-5" />} tone="brand" />
        <StatKart sayi={anahtarlar.length} etiket={t("ozet.anahtar")} ikon={<Check className="size-5" />} />
        <StatKart sayi="%100" etiket={t("ozet.kapsam")} tone="ok" ikon={<ShieldCheck className="size-5" />} />
        <StatKart sayi={rtlSayisi} etiket={t("ozet.rtl")} />
      </div>

      {/* dil ızgarası */}
      <div>
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("izgara.sec")}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {diller.map((d) => (
            <button
              key={d.kod}
              onClick={() => setSeciliKod(d.kod)}
              aria-pressed={secili.kod === d.kod}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3 text-left transition",
                secili.kod === d.kod
                  ? "border-brand-400 shadow-card ring-1 ring-brand-200"
                  : "border-line hover:border-line-strong hover:bg-canvas",
              )}
            >
              <span className="text-[26px] leading-none">{d.bayrak}</span>
              <span className="min-w-0 flex-1">
                {/* endonim + İngilizce ad VERİ'dir — çevrilmez. */}
                <span className="block truncate font-semibold text-slate-ink" dir={d.rtl ? "rtl" : "ltr"}>
                  {d.nativeAd}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-slate-muted">
                  {d.ad}
                  <span className="font-mono text-[11px] text-slate-faint">· {d.kod}</span>
                </span>
              </span>
              {d.rtl && <Badge ton="mavi">RTL</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* canlı önizleme + entegrasyon */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel baslik={t("onizleme.baslik").replace("{ad}", secili.nativeAd)}>
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("onizleme.metin")}
          </p>
          <OnizlemeKart dil={secili} />
        </Panel>

        <Panel baslik={t("ent.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">
            {(() => {
              // İki yer-tutucudan böl: {kod}→<code>data-lang</code>, {ad}→<b>endonim</b>.
              // {kodDeger} (dil kodu) düz metin olarak önce yerine konur — VERİ.
              const ham = t("ent.metin").replace("{kodDeger}", secili.kod);
              const [once, kalan] = ham.split("{kod}");
              const [orta, sonra] = kalan.split("{ad}");
              return (
                <>
                  {once}
                  <code className="rounded bg-canvas px-1 py-0.5 text-[12px] font-medium text-brand-700">data-lang</code>
                  {orta}
                  <b>{secili.nativeAd}</b>
                  {sonra}
                </>
              );
            })()}
          </p>
          <KodBlok kod={snippet} dil="html" baslik={`data-lang="${secili.kod}"`} />
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`data-lang="${secili.kod}"`);
                goster({ tip: "basari", baslik: t("ent.kopyalandi") });
              }}
            >
              <Check className="size-4" /> {t("ent.kopyala")}
            </Button>
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 px-4 py-3 text-[12.5px] text-slate-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {/* Kod tokenları (data-lang, <html lang>, navigator.language, tr) VERİ — çevrilmez;
                yalnızca bağlaç metni t() ile gelir. */}
            <span>
              <b>{t("ent.notBaslik")}</b> {t("ent.notMetin1")}
              <span className="font-medium text-slate-ink"> data-lang</span> {t("ent.notMetin2")}
              <span className="font-medium text-slate-ink"> &lt;html lang&gt;</span> →
              <span className="font-medium text-slate-ink"> navigator.language</span> {t("ent.notMetin3")}
              <span className="font-medium text-slate-ink"> tr</span> {t("ent.notMetin4")}
            </span>
          </div>
        </Panel>
      </div>

      {/* kapsam tablosu */}
      <Panel baslik={t("kapsam.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("kapsam.metin")
            .replace("{sayi}", String(diller.length))
            .replace("{anahtar}", String(anahtarlar.length))}
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="sticky left-0 z-10 bg-canvas/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  {t("kapsam.thAnahtar")}
                </th>
                {diller.map((d) => (
                  <th key={d.kod} className="px-3 py-3 text-center text-xs font-semibold text-slate-faint">
                    <span className="block text-[16px] leading-none">{d.bayrak}</span>
                    <span className="mt-1 block font-mono text-[10px] uppercase">{d.kod}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anahtarlar.map((k) => (
                <tr key={k} className="border-b border-line last:border-0 hover:bg-canvas/40">
                  {/* anahtar id'si VERİ'dir — çevrilmez. */}
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 font-mono text-[12px] font-medium text-slate-ink">
                    {k}
                  </td>
                  {diller.map((d) => {
                    const dolu = Boolean((d.ceviriler as Record<string, string>)[k]?.trim());
                    return (
                      <td key={d.kod} className="px-3 py-2.5 text-center">
                        {dolu ? (
                          <Check className="mx-auto size-4 text-ok" />
                        ) : (
                          <span className="mx-auto block size-1.5 rounded-full bg-danger2" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-canvas/40">
                <td className="sticky left-0 z-10 bg-canvas/40 px-4 py-2.5 text-[12px] font-semibold text-slate-ink">
                  {t("kapsam.tfKapsam")}
                </td>
                {diller.map((d) => {
                  const dolu = anahtarlar.filter((k) => (d.ceviriler as Record<string, string>)[k]?.trim()).length;
                  const tam = dolu === anahtarlar.length;
                  return (
                    <td key={d.kod} className="px-3 py-2.5 text-center">
                      <Badge ton={tam ? "yesil" : "kirmizi"}>
                        {Math.round((dolu / anahtarlar.length) * 100)}%
                      </Badge>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ OnizlemeKart
 * Widget'ın (public/specter.js) ghost-font doğrulama kartının görsel taklidi.
 * Gerçek canvas render'ı yok; sadece UI iskeleti. İçerik dil.ceviriler'den gelir —
 * bunlar widget'ın KENDİ çevirileri (VERİ), panel çevirisi değildir. RTL dillerde
 * dir="rtl" ile akış tersine döner. */
function OnizlemeKart({ dil }: { dil: WidgetDil }) {
  const t = dil.ceviriler;
  const rtl = dil.rtl;
  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="mx-auto w-[328px] max-w-full overflow-hidden rounded-[20px] text-[#e8eef7] shadow-[0_20px_60px_-18px_rgba(0,0,0,.65)] ring-1 ring-cyan-400/10"
      style={{ background: "radial-gradient(120% 140% at 0% 0%,#16233f 0%,#0c1526 45%,#080d18 100%)" }}
    >
      {/* üst glossy şerit */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      {/* başlık */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#aebfd4]">
          <ShieldCheck className="size-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,.5)]" />
          {t.title}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5ad1c4]">
          <Lock className="size-[11px]" />
          {t.secure}
        </div>
      </div>

      {/* canvas alanı taklidi */}
      <div className="relative px-4 pt-0.5">
        <div className="relative flex h-[104px] items-center justify-center overflow-hidden rounded-xl bg-[#0b1120] ring-1 ring-white/[0.07]">
          {/* ghost-font gürültü dokusu taklidi */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #234 1px, transparent 1px), radial-gradient(circle at 60% 70%, #2a3b52 1px, transparent 1px), radial-gradient(circle at 80% 20%, #1c3350 1px, transparent 1px)",
              backgroundSize: "6px 6px, 5px 5px, 7px 7px",
            }}
          />
          <span className="relative select-none font-mono text-[30px] font-black tracking-[0.35em] text-[#d4ecf7]/85 drop-shadow-[0_0_10px_rgba(103,232,249,.35)]">
            {rtl ? "٤٧٩A" : "K7X4"}
          </span>
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 3px)",
            }}
          />
          {/* ses + yeni kod butonları (RTL'de sol üstte, dir sayesinde otomatik) */}
          <div className="absolute top-2.5 flex gap-1.5" style={rtl ? { left: 10 } : { right: 10 }}>
            <span
              title={t.audio}
              className="grid size-[30px] place-items-center rounded-[9px] border border-white/[0.09] bg-[rgba(12,20,38,.72)] text-[#aebfd4]"
            >
              <Volume2 className="size-[15px]" />
            </span>
            <span
              title={t.reload}
              className="grid size-[30px] place-items-center rounded-[9px] border border-white/[0.09] bg-[rgba(12,20,38,.72)] text-[#aebfd4]"
            >
              <RotateCw className="size-[15px]" />
            </span>
          </div>
        </div>
      </div>

      {/* input + doğrula */}
      <div className="flex gap-2.5 px-4 pt-3.5 pb-1.5">
        <div className="flex h-11 flex-1 items-center rounded-xl border border-white/10 bg-[rgba(9,14,26,.8)] px-3.5 text-[13px] text-[#54657f]">
          {t.placeholder}
        </div>
        <div className="grid h-11 place-items-center rounded-xl bg-gradient-to-b from-[#2ee0f5] to-[#06b6d4] px-5 text-[14px] font-extrabold text-[#042028]">
          {t.verify}
        </div>
      </div>

      {/* yön tuş takımı önizlemesi (yon türü) */}
      <div className="flex items-center gap-1.5 px-4 pt-1 pb-1 text-[11px] text-[#54657f]">
        <span>{t.phYon}:</span>
        <span className="flex gap-1">
          <ArrowUp className="size-3.5" aria-label={t.yonYukari} />
          <ArrowDown className="size-3.5" aria-label={t.yonAsagi} />
          <ArrowLeft className="size-3.5" aria-label={t.yonSol} />
          <ArrowRight className="size-3.5" aria-label={t.yonSag} />
        </span>
      </div>

      {/* kontrol mesajı (görünmez mod) */}
      <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] text-[#7387a0]">
        <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
        <span>{t.checking}</span>
      </div>

      {/* alt bar */}
      <div className="flex items-center justify-between px-4 pb-3.5 pt-1 text-[11px] text-[#54657f]">
        <span className="flex items-center gap-1.5 font-bold text-[#8fa8bd]">
          <span className="size-[7px] rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          {t.protected}
        </span>
        <span className="flex gap-2.5">
          <span>{t.privacy}</span>
          <span>{t.terms}</span>
        </span>
      </div>
    </div>
  );
}
