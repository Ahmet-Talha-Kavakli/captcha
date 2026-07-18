"use client";

/**
 * Koruma Kapsamı & Maruz-Kalma Haritası — istemci konsolu.
 * ========================================================
 * "Bir bot-koruma ürünü ancak kapsamı kadar güçlüdür." Bu ekran, müşterinin
 * hangi endpoint'lerinin Specter widget'ı tarafından FİİLEN korunduğunu, hangi-
 * lerinin AÇIK (botların challenge görmeden geçtiği) olduğunu bir kapsam boşluğu
 * haritası olarak gösterir. Odak: risk sıralaması DEĞİL, koruma/kapsam boşluğu.
 *
 * DÜRÜSTLÜK: Kapsam gözlemlenen gerçek verdict'lerden çıkarılır. Henüz bot
 * trafiği görmemiş yol "güvenli" değil, "henüz test edilmedi"dir — ayrı işaretlenir.
 *
 * i18n: Tüm kullanıcı-görünür metin kapsamCeviri(t) üzerinden gelir. Enum
 * güvenliği: durumEtiket() lib TR çıktısı YERİNE "kap.durumEtiket.<durum>"
 * anahtarıyla istemcide yeniden türetilir (lib düzenlenmez); durumRenk() salt
 * renk olduğu için doğrudan kullanılır. Bot sınıfları key-map ile çevrilir.
 */

import { useMemo, useState } from "react";
import {
  ShieldHalf,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Search,
  Info,
  TriangleAlert,
  ChevronDown,
  KeyRound,
  CircleHelp,
  Wrench,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  durumRenk,
  type YolKapsam,
  type KapsamOzet,
  type KapsamDurum,
} from "./kapsam";
import { kapsamCeviri } from "./kapsam.i18n";

// Locale-aware sayı biçimlendirme için BCP-47 eşlemesi.
const LOCALE: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/* Kapsam durumu → Badge tonu. */
function durumTon(durum: KapsamDurum): "yesil" | "sari" | "kirmizi" | "gri" {
  switch (durum) {
    case "korunuyor":
      return "yesil";
    case "kismi":
      return "sari";
    case "acik":
      return "kirmizi";
    default:
      return "gri";
  }
}

/* Kapsam durumu → küçük ikon (rozet yanında). */
function DurumIkon({ durum, className }: { durum: KapsamDurum; className?: string }) {
  if (durum === "korunuyor") return <ShieldCheck className={className} />;
  if (durum === "kismi") return <ShieldAlert className={className} />;
  if (durum === "acik") return <ShieldX className={className} />;
  return <CircleHelp className={className} />;
}

/**
 * Bir açık yolu koruma aksiyonuna bağla. Kural oluşturucu (path ön-dolgulu)
 * en doğrudan yol; oto-düzeltme alternatif olarak sunulur.
 */
function kuralHref(yol: string) {
  const params = new URLSearchParams({ field: "path", op: "eq", value: yol });
  return `/panel/kurallar/gelismis?${params.toString()}`;
}

type DurumFiltre = "hepsi" | KapsamDurum;

export function KapsamIstemci({ yollar, ozet, dil }: { yollar: YolKapsam[]; ozet: KapsamOzet; dil: Dil }) {
  const t = (anahtar: string) => kapsamCeviri(anahtar, dil);
  const loc = LOCALE[dil];
  // Kapsam durumunun insan-okur etiketini istemcide yeniden türet (lib'e dokunma).
  const durumEtiketi = (durum: KapsamDurum) => t(`kap.durumEtiket.${durum}`);

  const [sorgu, setSorgu] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("hepsi");
  const [yalnizHassas, setYalnizHassas] = useState(false);
  const [acikYol, setAcikYol] = useState<string | null>(null);

  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return yollar.filter((y) => {
      if (durumFiltre !== "hepsi" && y.durum !== durumFiltre) return false;
      if (yalnizHassas && !y.hassas) return false;
      if (q && !y.yol.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [yollar, sorgu, durumFiltre, yalnizHassas]);

  // Açık delikler paneli: fiilen bot sızdıran açık yollar, kritik önce.
  const delikler = useMemo(
    () => yollar.filter((y) => y.durum === "acik" && y.korumasizBot > 0),
    [yollar],
  );

  const genelYuzde = Math.round(ozet.genelKapsamOrani * 100);

  const durumFiltreler: { deger: DurumFiltre; ad: string }[] = [
    { deger: "hepsi", ad: t("kap.filtre.tumu") },
    { deger: "acik", ad: t("kap.filtre.acik") },
    { deger: "kismi", ad: t("kap.filtre.kismi") },
    { deger: "korunuyor", ad: t("kap.filtre.korunuyor") },
    { deger: "test_edilmedi", ad: t("kap.filtre.testEdilmedi") },
  ];

  // Kapsam görselleştirmesi (segmentli bar): yol sayısına göre oranlar.
  const segmentler = [
    { durum: "korunuyor" as KapsamDurum, adet: ozet.korunanYol },
    { durum: "kismi" as KapsamDurum, adet: ozet.kismiYol },
    { durum: "acik" as KapsamDurum, adet: ozet.acikYol },
    { durum: "test_edilmedi" as KapsamDurum, adet: ozet.testEdilmeyenYol },
  ].filter((s) => s.adet > 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ShieldHalf className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("kap.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("kap.aciklama.p1")}<b>{t("kap.aciklama.p1b")}</b>{t("kap.aciklama.p2")}<b>{t("kap.aciklama.p2b")}</b>{t("kap.aciklama.p3")}<b>{t("kap.aciklama.p3b")}</b>{t("kap.aciklama.p4")}
            <span className="font-mono"> /api/login</span>{t("kap.aciklama.p5")}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${genelYuzde}`}
          etiket={t("kap.ozet.genelOran")}
          ikon={<ShieldHalf className="size-5" />}
          tone={genelYuzde >= 75 ? "ok" : genelYuzde >= 40 ? "warn" : "danger"}
        />
        <StatKart
          sayi={ozet.korunanYol}
          etiket={t("kap.ozet.korunanUc")}
          ikon={<ShieldCheck className="size-5" />}
          tone="ok"
        />
        <StatKart
          sayi={ozet.acikYol}
          etiket={ozet.kritikAcikYol > 0 ? t("kap.ozet.acikUcKritik").replace("{n}", String(ozet.kritikAcikYol)) : t("kap.ozet.acikUc")}
          ikon={<ShieldX className="size-5" />}
          tone={ozet.acikYol > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ozet.korumasizBotIstek.toLocaleString(loc)}
          etiket={t("kap.ozet.korumasizIstek")}
          ikon={<TriangleAlert className="size-5" />}
          tone={ozet.korumasizBotIstek > 0 ? "danger" : "ok"}
        />
      </div>

      {/* kapsam görselleştirmesi — segmentli bar */}
      <Panel baslik={t("kap.gorsel.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">{t("kap.gorsel.aciklama")}</p>
        {segmentler.length === 0 ? (
          <p className="text-sm text-slate-faint">{t("kap.gorsel.bosDurum")}</p>
        ) : (
          <>
            <div className="flex h-6 w-full overflow-hidden rounded-full ring-1 ring-line">
              {segmentler.map((s) => (
                <div
                  key={s.durum}
                  className="h-full transition-all"
                  style={{ width: `${(s.adet / ozet.toplamYol) * 100}%`, background: durumRenk(s.durum) }}
                  title={`${durumEtiketi(s.durum)}: ${s.adet}`}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {(["korunuyor", "kismi", "acik", "test_edilmedi"] as KapsamDurum[]).map((d) => {
                const adet =
                  d === "korunuyor"
                    ? ozet.korunanYol
                    : d === "kismi"
                      ? ozet.kismiYol
                      : d === "acik"
                        ? ozet.acikYol
                        : ozet.testEdilmeyenYol;
                return (
                  <div key={d} className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: durumRenk(d) }} />
                    <span className="text-[13px] text-slate-muted">{durumEtiketi(d)}</span>
                    <span className="num text-[13px] font-semibold text-slate-ink">{adet}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Panel>

      {/* açık delikler paneli */}
      {delikler.length > 0 && (
        <Panel baslik={t("kap.delik.baslik").replace("{n}", String(delikler.length))}>
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("kap.delik.aciklamaOnce")}<b>{t("kap.delik.aciklamaVurgu")}</b>{t("kap.delik.aciklamaSonra")}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {delikler.map((y) => (
              <div
                key={y.yol}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4",
                  y.kritik ? "border-red-300 bg-danger-soft/60" : "border-line bg-surface",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-slate-ink">{y.yol}</span>
                      {y.hassas && (
                        <Badge ton="kirmizi">
                          <KeyRound className="size-3" /> {t("kap.rozet.hassas")}
                        </Badge>
                      )}
                      {y.kritik && <Badge ton="kirmizi">{t("kap.rozet.kritik")}</Badge>}
                    </div>
                    <p className="mt-1 text-[12px] text-slate-muted">
                      <span className="num font-semibold text-danger2">{y.korumasizBot.toLocaleString(loc)}</span>{" "}
                      {t("kap.delik.botIstek")}{" "}
                      <span className="num font-semibold" style={{ color: durumRenk(y.durum) }}>
                        %{Math.round(y.korumaOrani * 100)}
                      </span>
                    </p>
                  </div>
                  <ShieldX className="size-5 shrink-0 text-danger2" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" href={kuralHref(y.yol)}>
                    <ShieldAlert className="size-4" /> {t("kap.delik.buYoluKoru")}
                  </Button>
                  <Button size="sm" variant="outline" href="/panel/oto-duzeltme">
                    <Wrench className="size-4" /> {t("kap.delik.otoDuzeltme")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* filtre çubuğu */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <input
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder={t("kap.filtre.ara")}
            aria-label={t("kap.filtre.araEtiket")}
            className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {durumFiltreler.map((d) => (
            <button
              key={d.deger}
              onClick={() => setDurumFiltre(d.deger)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                durumFiltre === d.deger
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-line text-slate-muted hover:border-line-strong",
              )}
            >
              {d.ad}
            </button>
          ))}
        </div>
        <button
          onClick={() => setYalnizHassas((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
            yalnizHassas
              ? "border-red-300 bg-danger-soft text-red-700"
              : "border-line text-slate-muted hover:border-line-strong",
          )}
        >
          <KeyRound className="size-3.5" /> {t("kap.filtre.yalnizHassas")}
        </button>
      </div>

      {/* kapsam haritası tablosu */}
      <Panel baslik={t("kap.tablo.baslik").replace("{n}", String(filtreli.length))} padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.endpoint")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.durum")}</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.kapsam")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.koruma")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.botIstegi")}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("kap.tablo.korumasiz")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-faint">
                    {t("kap.tablo.bosSonuc")}
                  </td>
                </tr>
              ) : (
                filtreli.map((y) => {
                  const acik = acikYol === y.yol;
                  const renk = durumRenk(y.durum);
                  // Bot trafiği kapsam çubuğu: yeşil (korunan) + kırmızı (korumasız).
                  const korunanBot = Math.round(y.korumaOrani * y.botIstek);
                  const korunanYuzde = y.botIstek ? (korunanBot / y.botIstek) * 100 : 0;
                  return (
                    <FragmentSatir key={y.yol}>
                      <tr
                        onClick={() => setAcikYol(acik ? null : y.yol)}
                        className={cn(
                          "cursor-pointer border-b border-line transition hover:bg-canvas/60",
                          y.kritik && "bg-danger-soft/30",
                        )}
                      >
                        <td className="px-5 py-3.5">
                          {/* Endpoint adı sabit min-genişlikte → "Hassas"/"Kritik"
                              rozetleri her satırda AYNI dikey hizada başlar. */}
                          <div className="flex items-center gap-2">
                            <span className="min-w-[150px] shrink-0 font-mono text-[13px] font-medium text-slate-ink">{y.yol}</span>
                            {y.hassas && (
                              <Badge ton="kirmizi">
                                <KeyRound className="size-3" /> {t("kap.rozet.hassas")}
                              </Badge>
                            )}
                            {y.kritik && <Badge ton="kirmizi">{t("kap.rozet.kritik")}</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                            style={{ color: renk }}
                          >
                            <DurumIkon durum={y.durum} className="size-4" />
                            {durumEtiketi(y.durum)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {y.botIstek === 0 ? (
                            <span className="text-[12px] text-slate-faint">{t("kap.tablo.botTrafigiYok")}</span>
                          ) : (
                            <div className="flex h-2 w-32 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
                              <div
                                className="h-full"
                                style={{ width: `${korunanYuzde}%`, background: "#16a34a" }}
                              />
                              <div
                                className="h-full"
                                style={{ width: `${100 - korunanYuzde}%`, background: "#dc2626" }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {y.botIstek === 0 ? (
                            <span className="text-[12px] text-slate-faint">—</span>
                          ) : (
                            <span className="num text-[13px] font-bold" style={{ color: renk }}>
                              %{Math.round(y.korumaOrani * 100)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right num text-slate-ink">
                          {y.botIstek.toLocaleString(loc)}
                          <span className="ml-1 text-[11px] text-slate-faint">%{Math.round(y.botYogunlugu * 100)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right num">
                          <span className={cn("font-semibold", y.korumasizBot > 0 ? "text-danger2" : "text-slate-faint")}>
                            {y.korumasizBot.toLocaleString(loc)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronDown className={cn("size-4 text-slate-faint transition", acik && "rotate-180")} />
                        </td>
                      </tr>
                      {acik && (
                        <tr className="border-b border-line bg-canvas/30">
                          <td colSpan={7} className="px-5 py-5">
                            <div className="grid gap-6 lg:grid-cols-3">
                              {/* verdict kırılımı */}
                              <div>
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                                  {t("kap.detay.kararKirilimi")}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[12px]">
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("kap.detay.toplamIstek")}</div>
                                    <div className="num font-semibold text-slate-ink">{y.toplamIstek.toLocaleString(loc)}</div>
                                  </div>
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("kap.detay.izinVerilen")}</div>
                                    <div className="num font-semibold text-slate-ink">{y.izinVerilen.toLocaleString(loc)}</div>
                                  </div>
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("kap.detay.dogrulama")}</div>
                                    <div className="num font-semibold text-slate-ink">{y.meydanOkunan.toLocaleString(loc)}</div>
                                  </div>
                                  <div className="rounded-lg border border-line bg-surface px-3 py-2">
                                    <div className="text-slate-faint">{t("kap.detay.engellenen")}</div>
                                    <div className="num font-semibold text-slate-ink">{y.engellenen.toLocaleString(loc)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* bot sınıfları */}
                              <div>
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                                  {t("kap.detay.botSiniflari")}
                                </div>
                                {y.ornekBotClasslar.length === 0 ? (
                                  <p className="text-[12px] text-slate-faint">
                                    {t("kap.detay.botTrafigiYok")}
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {y.ornekBotClasslar.map((b) => {
                                      const g = botSinifGorsel(b.botClass);
                                      const Ikon = g.ikon;
                                      return (
                                        <span
                                          key={b.botClass}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface py-1.5 pl-1.5 pr-2.5 text-[12px]"
                                        >
                                          <span className="grid size-5 shrink-0 place-items-center rounded-md" style={{ background: g.soft, color: g.renk }}>
                                            <Ikon className="size-3" strokeWidth={2.2} />
                                          </span>
                                          <span className="font-medium text-slate-ink">
                                            {t(`kap.bot.${b.botClass}`)}
                                          </span>
                                          <span className="num font-semibold text-slate-muted">{b.adet.toLocaleString(loc)}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* aksiyon / yorum */}
                              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                                <div>
                                  <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
                                    <DurumIkon durum={y.durum} className="size-4" />
                                    {y.durum === "korunuyor"
                                      ? t("kap.durum.saglikli")
                                      : y.durum === "test_edilmedi"
                                        ? t("kap.durum.testEdilmedi")
                                        : t("kap.durum.bosluk")}
                                  </div>
                                  <p className="mt-1 text-[12px] text-slate-muted">
                                    {y.durum === "korunuyor"
                                      ? t("kap.yorum.korunuyor")
                                      : y.durum === "test_edilmedi"
                                        ? t("kap.yorum.testEdilmedi")
                                        : y.durum === "kismi"
                                          ? t("kap.yorum.kismi")
                                          : t("kap.yorum.acik")}
                                  </p>
                                </div>
                                {y.durum !== "korunuyor" && (
                                  <Button size="sm" href={kuralHref(y.yol)} className="w-full">
                                    <ShieldAlert className="size-4" /> {t("kap.delik.buYoluKoru")}
                                  </Button>
                                )}
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

      {/* dürüstlük / açıklayıcı notlar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-danger-soft px-5 py-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger2" />
          <div className="text-[13px] text-red-800">
            <div className="font-semibold text-red-900">{t("kap.not.delikBaslik")}</div>
            <p className="mt-1">
              {t("kap.not.delikMetin1")}<b>allowed</b>{t("kap.not.delikMetin2")}<span className="font-mono">monitor</span>{t("kap.not.delikMetin3")}
              <span className="font-mono"> /api/login</span>{t("kap.not.delikMetin4")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <div className="text-[13px] text-slate-muted">
            <div className="font-semibold text-slate-ink">{t("kap.not.oranBaslik")}</div>
            <p className="mt-1">
              {t("kap.not.oranMetin1")}<span className="font-mono">challenged</span>{t("kap.not.oranMetin2")}<span className="font-mono">blocked</span>{t("kap.not.oranMetin3")}
              <b>{t("kap.not.oranFormul")}</b>{t("kap.not.oranMetin4")}<b>{t("kap.not.oranHenuz")}</b>{t("kap.not.oranMetin5")}<b>{t("kap.not.oranGuvenliDegil")}</b>{t("kap.not.oranMetin6")}<span className="font-mono">:id</span>{t("kap.not.oranMetin7")}
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
