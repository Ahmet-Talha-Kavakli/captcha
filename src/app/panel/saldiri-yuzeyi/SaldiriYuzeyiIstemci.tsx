"use client";

/**
 * Saldırı Yüzeyi Analizi — istemci konsolu.
 * Güvenlik ekibi için "endpoint maruziyet konsolu": hangi yollar en çok
 * saldırıya uğruyor ve her biri ne kadar açık. Arama + kategori filtresi +
 * "yüksek risk" filtresi, satır-genişletmeli detay (verdict kırılımı, saldıran
 * ülkeler, "kural oluştur" hızlı aksiyonu) ve kategori kırılım paneli.
 */

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Crosshair, Search, ChevronDown, ShieldPlus, ShieldAlert, TriangleAlert, Info } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { saldiriYuzeyiCeviri, YEREL_BCP47 } from "./saldiri-yuzeyi.i18n";
import {
  maruzetRenk,
  kategoriRenk,
  kategoriIkon,
  type YolRisk,
  type YuzeyOzet,
  type KategoriDagilim,
  type YolKategori,
} from "@/lib/specter/saldiri-yuzeyi";

/* Lucide ikonunu ada göre dinamik çöz (kategori ikonları için). */
function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

/* Enum→renk eşlemesi çeviri gerektirmez (veri). */
const VERDICT_RENK: Record<string, string> = {
  allowed: "#16a34a",
  blocked: "#dc2626",
  challenged: "#d97706",
  flagged: "#2f6fed",
};

/** Bir yolu gelişmiş kural oluşturucuya path-tabanlı ön-dolgu ile bağla. */
function kuralHref(yol: string) {
  const params = new URLSearchParams({ field: "path", op: "eq", value: yol });
  return `/panel/kurallar/gelismis?${params.toString()}`;
}

export function SaldiriYuzeyiIstemci({
  yolRiskler,
  ozet,
  dagilim,
  dil,
}: {
  yolRiskler: YolRisk[];
  ozet: YuzeyOzet;
  dagilim: KategoriDagilim[];
  dil: Dil;
}) {
  const t = (anahtar: string) => saldiriYuzeyiCeviri(anahtar, dil);
  const yerel = YEREL_BCP47[dil];
  const nf = (n: number) => n.toLocaleString(yerel);
  // Kategori etiketi lib yerine çeviriden türetilir (lib DEĞİŞMEZ).
  const katEtiket = (k: YolKategori) => t(`kategori.${k}`);
  // Bot sınıfı etiketi: çeviri yoksa (anahtar geri dönerse) ham enum değeri gösterilir.
  const botClassEtiket = (bc: string) => {
    const anahtar = `botclass.${bc}`;
    const cev = saldiriYuzeyiCeviri(anahtar, dil);
    return cev === anahtar ? bc : cev;
  };

  const [sorgu, setSorgu] = useState("");
  const [kategoriFiltre, setKategoriFiltre] = useState<YolKategori | "hepsi">("hepsi");
  const [yalnizYuksek, setYalnizYuksek] = useState(false);
  const [acikYol, setAcikYol] = useState<string | null>(null);

  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return yolRiskler.filter((y) => {
      if (kategoriFiltre !== "hepsi" && y.kategori !== kategoriFiltre) return false;
      if (yalnizYuksek && y.seviye !== "yuksek" && y.seviye !== "kritik") return false;
      if (q && !y.yol.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [yolRiskler, sorgu, kategoriFiltre, yalnizYuksek]);

  const maxKatToplam = Math.max(1, ...dagilim.map((d) => d.toplam));

  const kategoriler: { deger: YolKategori | "hepsi"; ad: string }[] = [
    { deger: "hepsi", ad: t("kategori.hepsi") },
    { deger: "kimlik", ad: t("kategori.kimlik") },
    { deger: "yonetim", ad: t("kategori.yonetim") },
    { deger: "odeme", ad: t("kategori.odeme") },
    { deger: "api", ad: t("kategori.api") },
    { deger: "icerik", ad: t("kategori.icerik") },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Crosshair className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")} <b>{t("serit.aciklama.hedef")}</b> {t("serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamYol} etiket={t("ozet.izlenen")} ikon={<Crosshair className="size-5" />} />
        <StatKart
          sayi={ozet.yuksekRiskYol}
          etiket={t("ozet.yuksekRisk")}
          ikon={<ShieldAlert className="size-5" />}
          tone={ozet.yuksekRiskYol > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ozet.enCokSaldirilanYol ? ozet.enCokSaldirilanYol.yol : "—"}
          etiket={t("ozet.enCok")}
          ikon={<Crosshair className="size-5" />}
          tone="warn"
        />
        <StatKart sayi={nf(ozet.toplamBotIstek)} etiket={t("ozet.toplamBot")} tone="danger" />
      </div>

      {/* kategori kırılımı */}
      <Panel baslik={t("kirilim.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("kirilim.aciklama")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dagilim.map((d) => {
            const renk = kategoriRenk(d.kategori);
            const oran = Math.round(d.botOran * 100);
            return (
              <button
                key={d.kategori}
                onClick={() => setKategoriFiltre((k) => (k === d.kategori ? "hepsi" : d.kategori))}
                className={cn(
                  "rounded-2xl border bg-surface p-4 text-left transition",
                  kategoriFiltre === d.kategori ? "border-brand-400 ring-1 ring-brand-200" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl text-white" style={{ background: renk }}>
                    <LucideIkon name={kategoriIkon(d.kategori)} className="size-4" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-ink">{katEtiket(d.kategori)}</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="num text-2xl font-bold text-slate-ink">{d.yolSayisi}</span>
                  <span className="text-[11px] text-slate-faint">{t("kirilim.endpoint")}</span>
                </div>
                {/* toplam istek çubuğu (kategoriler arası kıyas) */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full" style={{ width: `${(d.toplam / maxKatToplam) * 100}%`, background: renk }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-muted">
                  <span>{nf(d.toplam)} {t("kirilim.istek")}</span>
                  <span className={cn("font-semibold", oran >= 50 ? "text-danger2" : oran >= 20 ? "text-warn" : "text-ok")}>{t("kirilim.bot").replace("{n}", String(oran))}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* filtre çubuğu */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <input
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder={t("filtre.ara")}
            aria-label={t("filtre.araLabel")}
            className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {kategoriler.map((k) => (
            <button
              key={k.deger}
              onClick={() => setKategoriFiltre(k.deger)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                kategoriFiltre === k.deger ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong",
              )}
            >
              {k.ad}
            </button>
          ))}
        </div>
        <button
          onClick={() => setYalnizYuksek((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
            yalnizYuksek ? "border-red-300 bg-danger-soft text-red-700" : "border-line text-slate-muted hover:border-line-strong",
          )}
        >
          <ShieldAlert className="size-3.5" /> {t("filtre.yalnizYuksek")}
        </button>
      </div>

      {/* saldırı yüzeyi tablosu */}
      <Panel baslik={t("tablo.baslik").replace("{n}", String(filtreli.length))} padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">#</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.endpoint")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.maruziyet")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.toplam")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.bot")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.engel")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.tekilIp")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.baskinSinif")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("tablo.method")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-faint">
                    {t("tablo.bos")}
                  </td>
                </tr>
              ) : (
                filtreli.map((y, i) => {
                  const acik = acikYol === y.yol;
                  const renk = maruzetRenk(y.seviye);
                  const botYuzde = Math.round(y.botOran * 100);
                  return (
                    <FragmentSatir key={y.yol}>
                      <tr
                        onClick={() => setAcikYol(acik ? null : y.yol)}
                        className="cursor-pointer border-b border-line transition hover:bg-canvas/60"
                      >
                        <td className="px-5 py-3.5 num text-slate-faint">{i + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 shrink-0 place-items-center rounded-lg text-white" style={{ background: kategoriRenk(y.kategori) }}>
                              <LucideIkon name={kategoriIkon(y.kategori)} className="size-3.5" />
                            </span>
                            <span className="font-mono text-[13px] font-medium text-slate-ink">{y.yol}</span>
                            <Badge
                              ton={
                                y.kategori === "kimlik" ? "kirmizi" : y.kategori === "yonetim" ? "sari" : y.kategori === "odeme" ? "sari" : y.kategori === "api" ? "mavi" : "gri"
                              }
                            >
                              {katEtiket(y.kategori)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas">
                              <div className="h-full rounded-full" style={{ width: `${y.maruzetSkoru}%`, background: renk }} />
                            </div>
                            <span className="num text-[13px] font-bold" style={{ color: renk }}>{y.maruzetSkoru}</span>
                            <span className="text-[11px] text-slate-faint">{t(`seviye.${y.seviye}`)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right num text-slate-ink">{nf(y.toplam)}</td>
                        <td className="px-5 py-3.5 text-right num">
                          <span className="font-semibold text-danger2">{nf(y.bot)}</span>
                          <span className="ml-1 text-[11px] text-slate-faint">{t("kirilim.bot").replace("{n}", String(botYuzde))}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right num text-slate-muted">{nf(y.engellenen)}</td>
                        <td className="px-5 py-3.5 text-right num text-slate-muted">{nf(y.benzersizIp)}</td>
                        <td className="px-5 py-3.5">
                          <Badge ton={y.baskinBotClass === "human" ? "yesil" : "gri"}>{botClassEtiket(y.baskinBotClass)}</Badge>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[12px] text-slate-muted">{y.baskinMethod}</td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronDown className={cn("size-4 text-slate-faint transition", acik && "rotate-180")} />
                        </td>
                      </tr>
                      {acik && (
                        <tr className="border-b border-line bg-canvas/30">
                          <td colSpan={10} className="px-5 py-5">
                            <div className="grid gap-6 lg:grid-cols-3">
                              {/* verdict kırılımı */}
                              <div>
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("detay.kararKirilim")}</div>
                                <div className="space-y-2">
                                  {(["allowed", "challenged", "flagged", "blocked"] as const).map((v) => {
                                    const adet = y.verdictKirilim[v] ?? 0;
                                    const yuzde = y.toplam ? Math.round((adet / y.toplam) * 100) : 0;
                                    return (
                                      <div key={v}>
                                        <div className="mb-1 flex items-center justify-between text-[12px]">
                                          <span className="text-slate-muted">{t(`verdict.${v}`)}</span>
                                          <span className="num font-semibold text-slate-ink">
                                            {nf(adet)} <span className="text-slate-faint">{t("yuzde").replace("{n}", String(yuzde))}</span>
                                          </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                                          <div className="h-full rounded-full" style={{ width: `${yuzde}%`, background: VERDICT_RENK[v] }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* saldıran ülkeler */}
                              <div>
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("detay.enCokSaldiranUlkeler")}</div>
                                {y.saldiriUlkeleri.length === 0 ? (
                                  <p className="text-[12px] text-slate-faint">{t("detay.saldiriYok")}</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {y.saldiriUlkeleri.map((u) => (
                                      <span key={u.ulke} className="inline-flex items-center gap-1.5">
                                        <Ulke kod={u.ulke} />
                                        <span className="num text-[12px] font-semibold text-slate-ink">{nf(u.adet)}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("detay.ortInsanlik")}</div>
                                    <div className="num font-semibold text-slate-ink">{(y.ortSkor * 100).toFixed(0)}%</div>
                                  </div>
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("detay.ortYanit")}</div>
                                    <div className="num font-semibold text-slate-ink">{y.ortLatency} ms</div>
                                  </div>
                                </div>
                              </div>

                              {/* hızlı aksiyon */}
                              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                                <div>
                                  <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
                                    <ShieldPlus className="size-4 text-brand-600" /> {t("detay.buUcuKoru")}
                                  </div>
                                  <p className="mt-1 text-[12px] text-slate-muted">
                                    {y.kategori === "kimlik" || y.kategori === "yonetim" || y.kategori === "odeme"
                                      ? t("detay.yuksekDegerli")
                                      : t("detay.pathTabanli")}
                                  </p>
                                </div>
                                <Button size="sm" href={kuralHref(y.yol)} className="w-full">
                                  <ShieldPlus className="size-4" /> {t("detay.kuralOlustur")}
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentSatir>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* güvenlik ipucu / açıklayıcı */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-danger-soft px-5 py-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger2" />
          <div className="text-[13px] text-red-800">
            <div className="font-semibold text-red-900">{t("ipucu.hedefBaslik")}</div>
            <p className="mt-1">
              <b>{t("ipucu.hedefKimlik")}</b>, <b>{t("ipucu.hedefYonetim")}</b>, <b>{t("ipucu.hedefApi")}</b> {t("ipucu.hedefMetin.1")} <b>{t("ipucu.hedefOdeme")}</b> {t("ipucu.hedefMetin.2")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <div className="text-[13px] text-slate-muted">
            <div className="font-semibold text-slate-ink">{t("ipucu.skorBaslik")}</div>
            <p className="mt-1">
              {t("ipucu.skorMetin.1")} <b>{t("ipucu.skorMetin.hassaslik")}</b> {t("ipucu.skorMetin.2")} <span className="font-mono">:id</span> {t("ipucu.skorMetin.3")}{" "}
              <span className="font-mono">/api/users/1</span> {t("ipucu.skorMetin.ve")} <span className="font-mono">/api/users/2</span> {t("ipucu.skorMetin.4")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Tablo içinde birden çok <tr> döndürmek için hafif fragment sarmalayıcı. */
function FragmentSatir({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
