"use client";

/**
 * Filo Panosu (istemci) — çok-siteli portföy konsolu.
 * Bir sahibin tüm korunan sitelerini yan yana kıyaslar: duruş, trafik,
 * tehdit, kural, uyarı. Sıralama (risk/koruma/trafik), arama, "sadece riskli"
 * filtresi; en kötü sitelere dikkat çağrısı; filo geneli mod dağılımı ve
 * trafik kıyası. MSP/ajans hissi: az sitede bile dolu ve ölçeklenir görünür.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid, ShieldCheck, ShieldAlert, AlertTriangle, Check, X, Search,
  ArrowUpDown, ChevronRight, Activity, Ban, Eye, Gauge, Globe, TrendingUp,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { MiniSpark, DonutDagilim } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  korumaSeviye, riskli, RISK_ESIGI,
  type SiteDurumu, type FiloOzet,
} from "@/lib/specter/filo";
import { filoCeviri } from "./filo.i18n";

type Siralama = "risk" | "koruma" | "trafik" | "tehdit" | "ad";
const SIRALAMALAR: Siralama[] = ["risk", "koruma", "trafik", "tehdit", "ad"];

/* Küçük koruma-skoru halkası (tablo satırı için — kompakt).
 * Enum güvenliği: seviye etiketini lib TR'sinden değil, `sv.seviye` anahtarından çevir. */
function SkorHalka({ skor, t }: { skor: number; t: (k: string) => string }) {
  const sv = korumaSeviye(skor);
  const seviyeEtiket = t(`fl.seviye.${sv.seviye}`);
  const r = 15;
  const cevre = 2 * Math.PI * r;
  const dolu = (Math.max(0, Math.min(100, skor)) / 100) * cevre;
  return (
    <div className="relative grid size-11 place-items-center" title={t("fl.korumaTip").replace("{seviye}", seviyeEtiket)}>
      <svg viewBox="0 0 40 40" className="size-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#eceae2" strokeWidth="4" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke={sv.renk} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dolu} ${cevre - dolu}`}
        />
      </svg>
      <span className="absolute text-[12px] font-bold tabular-nums text-slate-ink">{skor}</span>
    </div>
  );
}

export function FiloIstemci({ durumlar, ozet, dil }: { durumlar: SiteDurumu[]; ozet: FiloOzet; dil: Dil }) {
  const t = (k: string) => filoCeviri(k, dil);
  const { goster } = useToast();
  const [sorgu, setSorgu] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("risk");
  const [sadeceRiskli, setSadeceRiskli] = useState(false);

  // --- Filtre + sıralama ---
  const gorunen = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    let liste = durumlar.filter((d) => {
      if (sadeceRiskli && !riskli(d)) return false;
      if (!q) return true;
      return (
        d.ad.toLowerCase().includes(q) ||
        (d.domain?.toLowerCase().includes(q) ?? false)
      );
    });
    liste = [...liste].sort((a, b) => {
      switch (siralama) {
        case "risk": // en kötü (düşük skor) önce; eşitlikte açık kritik çok olan önce
          return a.korumaSkoru - b.korumaSkoru || b.acikKritikOlay - a.acikKritikOlay;
        case "koruma":
          return b.korumaSkoru - a.korumaSkoru;
        case "trafik":
          return b.toplamOlay - a.toplamOlay;
        case "tehdit":
          return b.botOran - a.botOran;
        case "ad":
          return a.ad.localeCompare(b.ad, dil);
      }
    });
    return liste;
  }, [durumlar, sorgu, siralama, sadeceRiskli, dil]);

  // --- En kötü site(ler) (dikkat çağrısı) ---
  const enKotular = useMemo(
    () => [...durumlar].filter(riskli).sort((a, b) => a.korumaSkoru - b.korumaSkoru).slice(0, 3),
    [durumlar],
  );

  // --- İzleme-modunda (koruma pasif) siteler ---
  const izlemeSiteler = useMemo(() => durumlar.filter((d) => d.mode === "monitor"), [durumlar]);

  // --- Mod dağılımı (donut) ---
  const modSegmentler = [
    { etiket: t("fl.seg.engelle"), deger: ozet.modDagilim.block, renk: "#16a34a" },
    { etiket: t("fl.seg.meydanoku"), deger: ozet.modDagilim.challenge, renk: "#d97706" },
    { etiket: t("fl.seg.izle"), deger: ozet.modDagilim.monitor, renk: "#94a3b8" },
  ];

  // --- Trafik kıyası (en çok olaydan aza) ---
  const trafikKiyas = useMemo(() => {
    const enFazla = Math.max(1, ...durumlar.map((d) => d.toplamOlay));
    return [...durumlar]
      .sort((a, b) => b.toplamOlay - a.toplamOlay)
      .map((d) => ({ ...d, oran: (d.toplamOlay / enFazla) * 100 }));
  }, [durumlar]);

  if (durumlar.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-10 lg:px-10">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-20 text-center">
          <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <LayoutGrid className="size-7" />
          </span>
          <h3 className="text-lg font-semibold text-slate-ink">{t("fl.bos.baslik")}</h3>
          <p className="mt-1.5 max-w-sm text-sm text-slate-muted">
            {t("fl.bos.metin")}
          </p>
          <div className="mt-6">
            <Button href="/panel/siteler">{t("fl.bos.dugme")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <LayoutGrid className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("fl.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("fl.giris.metin")}
          </p>
        </div>
      </div>

      {/* filo özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamSite} etiket={t("fl.kart.toplamSite")} ikon={<Globe className="size-5" />} />
        <StatKart
          sayi={`${ozet.korunanSite}/${ozet.toplamSite}`}
          etiket={t("fl.kart.korumaAktif")}
          ikon={<ShieldCheck className="size-5" />}
          tone={ozet.korunanSite === ozet.toplamSite ? "ok" : "warn"}
        />
        <StatKart
          sayi={ozet.ortKorumaSkoru}
          etiket={t("fl.kart.ortSkor")}
          ikon={<Gauge className="size-5" />}
          tone={ozet.ortKorumaSkoru >= 65 ? "ok" : ozet.ortKorumaSkoru >= 45 ? "warn" : "danger"}
        />
        <StatKart
          sayi={ozet.riskliSite}
          etiket={t("fl.kart.dikkat")}
          ikon={<ShieldAlert className="size-5" />}
          tone={ozet.riskliSite > 0 ? "danger" : "ok"}
        />
      </div>

      {/* dikkat çağrısı — en kötü siteler */}
      {enKotular.length > 0 && (
        <div className="rounded-3xl border border-red-200 bg-danger-soft/50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-danger2" />
            <h3 className="text-[15px] font-semibold text-slate-ink">
              {t("fl.dikkat.baslik").replace("{n}", String(enKotular.length))}
            </h3>
          </div>
          <p className="mt-1 text-[13px] text-slate-muted">
            {t("fl.dikkat.metin")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enKotular.map((d) => {
              const sv = korumaSeviye(d.korumaSkoru);
              return (
                <Link
                  key={d.siteId}
                  href={`/panel/siteler/${d.siteId}`}
                  className="group flex items-center gap-3 rounded-2xl border border-red-200 bg-surface p-3.5 transition hover:border-red-300 hover:shadow-card"
                >
                  <SkorHalka skor={d.korumaSkoru} t={t} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-slate-ink">{d.ad}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-muted">
                      <span style={{ color: sv.renk }} className="font-medium">{t(`fl.seviye.${sv.seviye}`)}</span>
                      {d.mode === "monitor" && <span className="text-slate-faint">· {t("fl.dikkat.korumaPasif")}</span>}
                      {d.acikKritikOlay > 0 && (
                        <span className="text-danger2">· {t("fl.dikkat.acikKritik").replace("{n}", String(d.acikKritikOlay))}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-slate-muted" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* araç çubuğu: arama + sıralama + sadece riskli */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <input
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder={t("fl.ara.placeholder")}
            aria-label={t("fl.ara.aria")}
            className="h-11 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value as Siralama)}
            aria-label={t("fl.sirala.aria")}
            className="h-11 rounded-2xl border border-line-strong bg-surface pl-9 pr-8 text-sm font-medium text-slate-ink outline-none transition focus:border-brand-400"
          >
            {SIRALAMALAR.map((k) => (
              <option key={k} value={k}>{t(`fl.sirala.${k}`)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSadeceRiskli((v) => !v)}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition",
            sadeceRiskli
              ? "border-red-300 bg-danger-soft text-red-700"
              : "border-line-strong bg-surface text-slate-muted hover:bg-canvas",
          )}
        >
          <ShieldAlert className="size-4" />
          {t("fl.sadeceRiskli")}
          {sadeceRiskli && <X className="size-3.5" />}
        </button>
      </div>

      {/* kıyas tablosu */}
      <Panel baslik={t("fl.tablo.baslik").replace("{n}", String(gorunen.length))} padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="px-5 py-3">{t("fl.th.site")}</th>
                <th className="px-4 py-3">{t("fl.th.koruma")}</th>
                <th className="px-4 py-3">{t("fl.th.mod")}</th>
                <th className="px-4 py-3">{t("fl.th.zorluk")}</th>
                <th className="px-4 py-3 text-right">{t("fl.th.trafik")}</th>
                <th className="px-4 py-3 text-right">{t("fl.th.botOran")}</th>
                <th className="px-4 py-3 text-right">{t("fl.th.engellenen")}</th>
                <th className="px-4 py-3 text-right">{t("fl.th.kural")}</th>
                <th className="px-4 py-3">{t("fl.th.tehdit")}</th>
                <th className="px-4 py-3">{t("fl.th.aktivite")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {gorunen.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm text-slate-faint">
                    {t("fl.tablo.eslesmeyok")}
                  </td>
                </tr>
              ) : (
                gorunen.map((d) => {
                  const modTon: "yesil" | "sari" | "gri" =
                    d.mode === "block" ? "yesil" : d.mode === "challenge" ? "sari" : "gri";
                  const sv = korumaSeviye(d.korumaSkoru);
                  const isRisk = riskli(d);
                  return (
                    <tr
                      key={d.siteId}
                      className={cn(
                        "group border-b border-line transition last:border-0 hover:bg-canvas/60",
                        isRisk && "bg-danger-soft/25",
                      )}
                    >
                      {/* site */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isRisk && <span className="size-2 shrink-0 rounded-full bg-danger2" title={t("fl.riskli")} />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-semibold text-slate-ink">{d.ad}</span>
                              {d.verified ? (
                                <Check className="size-3.5 shrink-0 text-ok" aria-label={t("fl.dogrulanmis")} />
                              ) : (
                                <span title={t("fl.dogrulanmamis")}>
                                  <AlertTriangle className="size-3.5 shrink-0 text-warn" aria-label={t("fl.dogrulanmamis")} />
                                </span>
                              )}
                            </div>
                            {d.domain && <div className="truncate text-[12px] text-slate-faint">{d.domain}</div>}
                          </div>
                        </div>
                      </td>
                      {/* koruma */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <SkorHalka skor={d.korumaSkoru} t={t} />
                          <span className="hidden text-[12px] font-medium xl:inline" style={{ color: sv.renk }}>
                            {t(`fl.seviye.${sv.seviye}`)}
                          </span>
                        </div>
                      </td>
                      {/* mod */}
                      <td className="px-4 py-3.5">
                        <Badge ton={modTon}>
                          {d.mode === "block" ? <Ban className="size-3" /> : d.mode === "challenge" ? <ShieldCheck className="size-3" /> : <Eye className="size-3" />}
                          {t(`fl.mod.${d.mode}`)}
                        </Badge>
                      </td>
                      {/* zorluk */}
                      <td className="px-4 py-3.5 text-slate-muted">{t(`fl.zorluk.${d.difficulty}`)}</td>
                      {/* trafik */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-semibold tabular-nums text-slate-ink">{d.toplamOlay.toLocaleString(dil)}</div>
                        <div className="text-[11px] tabular-nums text-slate-faint">{d.benzersizIp} {t("fl.ip")}</div>
                      </td>
                      {/* bot oranı */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={cn("font-semibold tabular-nums", d.botOran >= 0.6 ? "text-danger2" : d.botOran >= 0.3 ? "text-warn" : "text-slate-ink")}>
                          %{Math.round(d.botOran * 100)}
                        </span>
                      </td>
                      {/* engellenen */}
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-ink">{d.engellenen.toLocaleString(dil)}</td>
                      {/* kural */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="tabular-nums text-slate-ink">{d.aktifKural}</span>
                        <span className="tabular-nums text-slate-faint">/{d.toplamKural}</span>
                      </td>
                      {/* baskın tehdit */}
                      <td className="px-4 py-3.5">
                        {d.dominantTehdit ? (
                          <span className="text-[12px] text-slate-muted">
                            {t(`fl.bot.${d.dominantTehdit}`)}
                            <span className="ml-1 tabular-nums text-slate-faint">({d.dominantTehditSayi})</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-faint">—</span>
                        )}
                        {d.acikKritikOlay > 0 && (
                          <div className="mt-0.5 text-[11px] font-medium text-danger2">{t("fl.acikKritikOlay").replace("{n}", String(d.acikKritikOlay))}</div>
                        )}
                      </td>
                      {/* aktivite sparkline */}
                      <td className="px-4 py-3.5">
                        <MiniSpark tohum={d.siteId + d.toplamOlay} renk={sv.renk} yukseklik={28} />
                      </td>
                      {/* link */}
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/panel/siteler/${d.siteId}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-medium text-brand-700 transition hover:bg-brand-50"
                        >
                          {t("fl.detay")}
                          <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* filo geneli: mod dağılımı + trafik kıyası */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel baslik={t("fl.modDagilim")}>
          <DonutDagilim segmentler={modSegmentler} />
          {izlemeSiteler.length > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-warn-soft/60 px-4 py-3">
              <Eye className="mt-0.5 size-4 shrink-0 text-warn" />
              <div className="text-[13px] text-amber-800">
                <b>{t("fl.izleme.baslik").replace("{n}", String(izlemeSiteler.length))}</b> {t("fl.izleme.metin")}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {izlemeSiteler.map((d) => (
                    <Link
                      key={d.siteId}
                      href={`/panel/siteler/${d.siteId}`}
                      className="rounded-full bg-surface px-2.5 py-0.5 text-[12px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-warn-soft"
                    >
                      {d.ad}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel baslik={t("fl.trafikBaslik")}>
          <div className="space-y-3">
            {trafikKiyas.map((d) => {
              const sv = korumaSeviye(d.korumaSkoru);
              return (
                <div key={d.siteId} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 truncate text-[13px] font-medium text-slate-ink" title={d.ad}>
                    {d.ad}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full" style={{ width: `${d.oran}%`, background: sv.renk }} />
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-ink">
                    {d.toplamOlay.toLocaleString(dil)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-[12px] text-slate-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5" />
              {t("fl.toplam")} <b className="tabular-nums text-slate-ink">{ozet.toplamOlay.toLocaleString(dil)}</b> {t("fl.olay")}
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              {t("fl.enAktif")} <b className="text-slate-ink">{ozet.enAktifSite ?? "—"}</b>
            </span>
          </div>
        </Panel>
      </div>

      {/* dışa aktar (kanıt/rapor) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
        <div className="flex items-start gap-2.5 text-[13px] text-slate-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            {t("fl.export.aciklama").replace("{esik}", String(RISK_ESIGI))}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const satirlar = [
              [t("fl.csv.site"), t("fl.csv.alan"), t("fl.csv.koruma"), t("fl.csv.mod"), t("fl.csv.zorluk"), t("fl.csv.dogrulanmis"), t("fl.csv.toplamOlay"), t("fl.csv.botOran"), t("fl.csv.engellenen"), t("fl.csv.aktifKural"), t("fl.csv.acikKritik"), t("fl.csv.tehdit")].join(","),
              ...durumlar.map((d) =>
                [
                  `"${d.ad}"`, `"${d.domain ?? ""}"`, d.korumaSkoru, t(`fl.mod.${d.mode}`),
                  t(`fl.zorluk.${d.difficulty}`), d.verified ? t("fl.csv.evet") : t("fl.csv.hayir"), d.toplamOlay,
                  Math.round(d.botOran * 100), d.engellenen, d.aktifKural, d.acikKritikOlay,
                  d.dominantTehdit ? t(`fl.bot.${d.dominantTehdit}`) : "-",
                ].join(","),
              ),
            ];
            const blob = new Blob(["﻿" + satirlar.join("\n")], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "specter-filo.csv"; a.click();
            URL.revokeObjectURL(url);
            goster({ tip: "basari", baslik: t("fl.export.indirildi") });
          }}
        >
          {t("fl.export.dugme")}
        </Button>
      </div>
    </div>
  );
}
