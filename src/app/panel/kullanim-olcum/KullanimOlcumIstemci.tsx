"use client";

/**
 * Kullanım Ölçümü & SLA Takibi — istemci görünümü
 * ================================================
 * Stripe/AWS faturalandırma + SLA konsolu hissi: kullanım-vs-kota göstergesi,
 * ay-sonu fatura projeksiyonu (taban + aşım dökümü + günlük SVG grafik), SLA
 * uyum tablosu (gerçek p95 gecikme) ve plan karşılaştırma/yükseltme önerisi.
 *
 * DÜRÜSTLÜK: Kullanım GERÇEK olaylardan ölçülür; plan/kota hesapta yoksa
 * varsayımdır (etiketlenir); fatura rakamları projeksiyondur; SLA "gerçekleşen"
 * değerleri gözlemlenen veriden türetilir (uptime/support proxy).
 */

import {
  Gauge,
  Receipt,
  Activity,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Info,
  ShieldCheck,
  TrendingUp,
  Server,
  Timer,
  LifeBuoy,
  Layers,
} from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { koCeviri } from "./kullanim-olcum.i18n";
import type {
  KullanimSonuc,
  SlaDurum,
  SlaDurumu,
  OlcumOzet,
  FaturaDokum,
  YukseltmeOneri,
  OlcumPlan,
} from "./olcum";

/** t yardımcısı tipi (çeviri fonksiyonu). */
type Ceviri = (anahtar: string) => string;

interface Props {
  dil: Dil;
  planId: OlcumPlan["id"];
  planVarsayim: boolean;
  kota: number;
  planFiyat: number;
  asimBirimFiyat: number;
  kullanim: KullanimSonuc;
  sla: SlaDurum[];
  ozet: OlcumOzet;
  fatura: FaturaDokum;
  oneri: YukseltmeOneri;
  planlar: OlcumPlan[];
  toplamOlay: number;
}

/* SLA durum → rozet/renk meta. Enum değeri (karşılanıyor/risk/ihlal) çevrilmez;
   yalnızca görünen etiket i18n anahtarıyla (enum→anahtar) çözülür. */
const SLA_META: Record<SlaDurumu, { adKey: string; ton: "yesil" | "sari" | "kirmizi"; renk: string; ikon: React.ReactNode }> = {
  "karşılanıyor": { adKey: "ko.slaDurum.karsilaniyor", ton: "yesil", renk: "text-ok", ikon: <CheckCircle2 className="size-4" /> },
  risk: { adKey: "ko.slaDurum.risk", ton: "sari", renk: "text-warn", ikon: <AlertTriangle className="size-4" /> },
  ihlal: { adKey: "ko.slaDurum.ihlal", ton: "kirmizi", renk: "text-danger2", ikon: <AlertTriangle className="size-4" /> },
};

const SLA_IKON: Record<string, React.ReactNode> = {
  uptime: <Server className="size-4" />,
  latency: <Timer className="size-4" />,
  support: <LifeBuoy className="size-4" />,
};

export function KullanimOlcumIstemci(p: Props) {
  const { dil, kullanim: k, sla, ozet, fatura, oneri } = p;
  const t: Ceviri = (anahtar) => koCeviri(anahtar, dil);
  // Sayı/para biçimlendirme BCP-47 dile göre; para birimi (₺) veri olarak kalır.
  const nf = (n: number) => n.toLocaleString(dil);
  const tl = (n: number) => "₺" + n.toLocaleString(dil);
  // Mevcut plan adı, id'den çevrili türetilir (lib plan.ad TR yerine).
  const planAd = t(`ko.planAd.${p.planId}`);
  const mevcutPct = Math.min(100, Math.round(k.kotaYuzde * 100));
  const projPct = p.kota > 0 ? Math.min(200, (k.projeksiyon / p.kota) * 100) : 0;
  const slaGenel = SLA_META[ozet.slaUyum];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Receipt className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("ko.intro.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {planAd} {t("ko.intro.planEki")}{p.planVarsayim && <span className="text-warn">{t("ko.intro.varsayilan")}</span>} ·{" "}
            {t("ko.intro.metin")
              .replace("{gecen}", String(k.gecenGun))
              .replace("{toplam}", String(k.toplamGun))
              .replace("{olay}", nf(p.toplamOlay))}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={nf(k.kullanilanDogrulama)}
          etiket={t("ko.ozet.kullanilan").replace("{pct}", String(mevcutPct))}
          ikon={<Gauge className="size-5" />}
          tone={k.kotaYuzde >= 0.9 ? "warn" : undefined}
        />
        <StatKart
          sayi={nf(k.projeksiyon)}
          etiket={t("ko.ozet.projeksiyon")}
          ikon={<TrendingUp className="size-5" />}
          tone={k.asimRiski ? "danger" : "ok"}
        />
        <StatKart
          sayi={tl(k.faturaTahmini)}
          etiket={t("ko.ozet.faturaTahmini")}
          ikon={<Receipt className="size-5" />}
          tone={fatura.asimUcret > 0 ? "warn" : undefined}
        />
        <StatKart
          sayi={t(slaGenel.adKey)}
          etiket={ozet.toplamKrediYuzde > 0 ? t("ko.ozet.slaUyumKredi").replace("{kredi}", String(ozet.toplamKrediYuzde)) : t("ko.ozet.slaUyum")}
          ikon={<ShieldCheck className="size-5" />}
          tone={ozet.slaUyum === "ihlal" ? "danger" : ozet.slaUyum === "risk" ? "warn" : "ok"}
        />
      </div>

      {/* --- Kota kullanım göstergesi --- */}
      <Panel baslik={t("ko.kota.baslik")}>
        <div className="space-y-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {/* mevcut kullanım bar */}
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-slate-muted">{t("ko.kota.suAnaKadar")}</span>
                  <span className="num text-sm font-semibold text-slate-ink">
                    {nf(k.kullanilanDogrulama)} / {nf(p.kota)}
                  </span>
                </div>
                <KotaBar kullanimPct={mevcutPct} projPct={projPct} asim={k.asimRiski} />
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-brand-600" /> {t("ko.kota.gercek").replace("{pct}", String(mevcutPct))}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("h-2.5 w-3 rounded-sm", k.asimRiski ? "bg-danger2/40" : "bg-brand-300/50")} />
                    {t("ko.kota.projeksiyon").replace("{pct}", String(Math.round(projPct)))}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-px bg-slate-ink" /> {t("ko.kota.sinir")}
                  </span>
                </div>
              </div>
            </div>

            {/* run-rate mini metrikleri */}
            <div className="grid grid-cols-3 gap-3 lg:w-64 lg:grid-cols-1">
              <MiniMetrik ikon={<Activity className="size-4" />} etiket={t("ko.kota.gunlukOrt")} deger={t("ko.kota.gunBirim").replace("{n}", nf(k.gunlukOrt))} />
              <MiniMetrik ikon={<CalendarClock className="size-4" />} etiket={t("ko.kota.kalanGun")} deger={t("ko.kota.gunEki").replace("{n}", String(k.kalanGun))} />
              <MiniMetrik
                ikon={<Layers className="size-4" />}
                etiket={t("ko.kota.apiCagri")}
                deger={nf(k.apiCagri)}
              />
            </div>
          </div>

          {k.asimRiski ? (
            <NotKutusu ton="kirmizi" baslik={t("ko.kota.asimBaslik")}>
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    t("ko.kota.asimMetin")
                      .replace("{proj}", nf(k.projeksiyon))
                      .replace("{asim}", nf(k.asimMiktari))
                      .replace("{pct}", String(Math.round(projPct - 100))) +
                    (fatura.asimUcretli
                      ? t("ko.kota.asimUcretli").replace("{tutar}", tl(fatura.asimUcret))
                      : t("ko.kota.asimBlok")),
                }}
              />
            </NotKutusu>
          ) : (
            <NotKutusu ton="yesil" baslik={t("ko.kota.guvenBaslik")}>
              <span dangerouslySetInnerHTML={{ __html: t("ko.kota.guvenMetin").replace("{proj}", nf(k.projeksiyon)) }} />
            </NotKutusu>
          )}
        </div>
      </Panel>

      {/* --- Fatura projeksiyonu --- */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel baslik={t("ko.fatura.gunlukBaslik")}>
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("ko.fatura.gunlukMetin")}
          </p>
          <GunlukGrafik
            gunlukSeri={k.gunlukSeri}
            etiketler={k.gunEtiketleri}
            gunlukOrt={k.gunlukOrt}
            kalanGun={k.kalanGun}
            t={t}
            nf={nf}
            dil={dil}
          />
        </Panel>

        <Panel baslik={t("ko.fatura.baslik")}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-canvas/40 p-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-[13px] text-slate-muted">{t("ko.fatura.taban").replace("{plan}", planAd)}</span>
                <span className="num text-sm font-semibold text-slate-ink">{tl(fatura.taban)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line py-3">
                <div>
                  <span className="text-[13px] text-slate-muted">{t("ko.fatura.asimUcreti")}</span>
                  {fatura.asimMiktari > 0 && (
                    <p className="mt-0.5 text-[11px] text-slate-faint">
                      {t("ko.fatura.asimDetay").replace("{miktar}", nf(fatura.asimMiktari)).replace("{birim}", tl(p.asimBirimFiyat))}
                    </p>
                  )}
                </div>
                <span className={cn("num text-sm font-semibold", fatura.asimUcret > 0 ? "text-warn" : "text-slate-faint")}>
                  {fatura.asimUcretli ? tl(fatura.asimUcret) : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-3">
                <span className="text-sm font-semibold text-slate-ink">{t("ko.fatura.toplam")}</span>
                <span className="num text-2xl font-bold text-slate-ink">{tl(fatura.toplam)}</span>
              </div>
            </div>

            {ozet.toplamKrediTutar > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-danger-soft px-4 py-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger2" />
                <div className="text-[13px] text-red-800">
                  <span className="font-semibold">{t("ko.fatura.slaKredi").replace("{tutar}", tl(ozet.toplamKrediTutar))}</span> (%{ozet.toplamKrediYuzde})
                  <p className="mt-0.5 text-[12px] text-red-700">
                    {t("ko.fatura.slaKrediMetin")}
                  </p>
                </div>
              </div>
            )}

            <p className="flex items-start gap-1.5 text-[12px] text-slate-faint">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {t("ko.fatura.dipnot")}
            </p>
          </div>
        </Panel>
      </div>

      {/* --- SLA uyum tablosu --- */}
      <Panel baslik={t("ko.sla.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("ko.sla.metin")}
          <span className="text-slate-faint">{t("ko.sla.metinEk")}</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thMetrik")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thTaahhut")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thGerceklesen")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thKarsilama")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thDurum")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ko.sla.thKredi")}</th>
              </tr>
            </thead>
            <tbody>
              {sla.map((s) => {
                const meta = SLA_META[s.durum];
                // Karşılama yüzdesi (bar): yüksek-iyi metrikte gerçek/taahhüt; düşük-iyide taahhüt/gerçek.
                const oran = s.yuksekIyi
                  ? (s.taahhut > 0 ? (s.gerceklesen / s.taahhut) * 100 : 100)
                  : (s.gerceklesen > 0 ? (s.taahhut / s.gerceklesen) * 100 : 100);
                const barPct = Math.max(0, Math.min(100, oran));
                const barTon = s.durum === "ihlal" ? "danger" : s.durum === "risk" ? "warn" : "ok";
                // Birim çevrilir yalnızca "sa" (saat) için; % ve ms evrenseldir → veri kalır.
                const birim = s.birim === "sa" ? t("ko.birim.sa") : s.birim;
                // Açıklama lib TR yerine istemcide türetilir; latency p99 sayısı lib
                // metninden çıkarılıp çevrili şablona yerleştirilir (veri korunur).
                const aciklama =
                  s.anahtar === "latency"
                    ? t("ko.slaAciklama.latency").replace("{p99}", String(s.aciklama.match(/(\d+)\s*ms/)?.[1] ?? ""))
                    : t(`ko.slaAciklama.${s.anahtar}`);
                return (
                  <tr key={s.anahtar} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-faint">{SLA_IKON[s.anahtar]}</span>
                        <span className="font-medium text-slate-ink">{t(`ko.slaMetrik.${s.anahtar}`)}</span>
                      </div>
                      <p className="mt-1 max-w-md text-[12px] leading-relaxed text-slate-faint">{aciklama}</p>
                    </td>
                    <td className="num px-4 py-4 text-slate-muted">
                      {s.anahtar === "uptime" ? s.taahhut + s.birim : `${nf(s.taahhut)} ${birim}`}
                    </td>
                    <td className="num px-4 py-4">
                      <span className={cn("font-semibold", meta.renk)}>
                        {s.anahtar === "uptime" ? s.gerceklesen + s.birim : `${nf(s.gerceklesen)} ${birim}`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-32">
                        <Ilerleme deger={barPct} ton={barTon} />
                        <span className="num mt-1 block text-[11px] text-slate-faint">%{Math.round(barPct)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Badge ton={meta.ton}>
                        <span className={meta.renk}>{meta.ikon}</span>
                        {t(meta.adKey)}
                      </Badge>
                    </td>
                    <td className="num px-4 py-4 text-right">
                      {s.kredi > 0 ? (
                        <span className="font-semibold text-danger2">%{s.kredi}</span>
                      ) : (
                        <span className="text-slate-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ozet.slaUyum === "karşılanıyor" ? (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-ok">
            <CheckCircle2 className="size-4" /> {t("ko.sla.hepsiKarsilaniyor")}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-muted">
            <Info className="size-4 text-slate-faint" />
            <span
              dangerouslySetInnerHTML={{
                __html: t("ko.sla.ihlalOzet")
                  .replace("{n}", String(ozet.ihlalSayisi))
                  .replace("{kredi}", `<strong class="text-danger2">${ozet.toplamKrediYuzde}</strong>`)
                  .replace("{tutar}", tl(ozet.toplamKrediTutar)),
              }}
            />
          </div>
        )}
      </Panel>

      {/* --- Plan karşılaştırma / yükseltme --- */}
      <Panel baslik={t("ko.plan.baslik")}>
        <div className="grid gap-4 md:grid-cols-3">
          {p.planlar.map((pl) => {
            const mevcutMu = pl.id === p.planId;
            const onerilenMu = oneri.hedef?.id === pl.id;
            const sigar = k.projeksiyon <= pl.aylikKota;
            return (
              <div
                key={pl.id}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  mevcutMu
                    ? "border-brand-300 bg-brand-50/50 ring-1 ring-brand-200"
                    : onerilenMu
                      ? "border-ok/40 bg-ok-soft/40 ring-1 ring-green-200"
                      : "border-line bg-surface",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-slate-ink">{t(`ko.planAd.${pl.id}`)}</span>
                  {mevcutMu ? (
                    <Badge ton="brand">{t("ko.plan.mevcut")}</Badge>
                  ) : onerilenMu ? (
                    <Badge ton="yesil">{t("ko.plan.onerilen")}</Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="num text-2xl font-bold text-slate-ink">{pl.fiyat === 0 ? t("ko.plan.ucretsiz") : tl(pl.fiyat)}</span>
                  {pl.fiyat > 0 && <span className="text-[12px] text-slate-faint">{t("ko.plan.ay")}</span>}
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-slate-muted">
                  <li className="flex items-center justify-between">
                    <span>{t("ko.plan.aylikKota")}</span>
                    <span className="num font-medium text-slate-ink">{nf(pl.aylikKota)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t("ko.plan.slaUptime")}</span>
                    <span className="num font-medium text-slate-ink">{pl.slaUptime}%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t("ko.plan.gecikmeP95")}</span>
                    <span className="num font-medium text-slate-ink">≤{pl.slaLatencyP95} ms</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t("ko.plan.destekYaniti")}</span>
                    <span className="num font-medium text-slate-ink">{t("ko.plan.saEki").replace("{n}", String(pl.destekYaniti))}</span>
                  </li>
                  <li className="flex items-center justify-between border-t border-line pt-1.5">
                    <span>{t("ko.plan.projeksiyonUygun")}</span>
                    <span className={cn("font-medium", sigar ? "text-ok" : "text-danger2")}>
                      {sigar ? t("ko.plan.evet") : t("ko.plan.asar")}
                    </span>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>

        {oneri.onerilir && oneri.hedef ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-200 bg-ok-soft/50 px-5 py-4">
            <div className="flex items-start gap-3">
              <ArrowUpRight className="mt-0.5 size-5 shrink-0 text-ok" />
              <div>
                <p className="text-sm font-semibold text-slate-ink">{t("ko.plan.yukseltmeBaslik").replace("{plan}", t(`ko.planAd.${oneri.hedef.id}`))}</p>
                <p className="mt-0.5 max-w-2xl text-[13px] text-slate-muted">{yukseltmeGerekce(oneri, k, t, dil)}</p>
              </div>
            </div>
            <Button href="/panel/ayarlar" size="sm">
              {t("ko.plan.yukseltmeBtn")}
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
            <CheckCircle2 className="size-4 text-ok" />
            {yukseltmeGerekce(oneri, k, t, dil)}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Yükseltme gerekçesi (lib TR yerine istemcide türetilir)
   olcum.ts yukseltmeOneri() ile AYNI dallanma; canlı sayılar (projeksiyon, kullanım %'si)
   çevrili şablona yerleştirilir. hedef adı id→i18n anahtarıyla çözülür. */
function yukseltmeGerekce(oneri: YukseltmeOneri, k: KullanimSonuc, t: Ceviri, dil: Dil): string {
  const yaklasiyor = k.kotaYuzde >= 0.9;
  const asiyor = k.asimRiski;
  if (!oneri.hedef) {
    if (!asiyor && !yaklasiyor) return t("ko.gerekce.yok");
    return asiyor ? t("ko.gerekce.enUstAsiyor") : t("ko.gerekce.enUstYaklasiyor");
  }
  const hedefAd = t(`ko.planAd.${oneri.hedef.id}`);
  return asiyor
    ? t("ko.gerekce.asiyor")
        .replace("{proj}", k.projeksiyon.toLocaleString(dil))
        .replace("{plan}", hedefAd)
    : t("ko.gerekce.yaklasiyor")
        .replace("{pct}", String(Math.round(k.kotaYuzde * 100)))
        .replace("{plan}", hedefAd);
}

/* ------------------------------------------------------------------ Kota barı (gerçek + projeksiyon + sınır) */
function KotaBar({ kullanimPct, projPct, asim }: { kullanimPct: number; projPct: number; asim: boolean }) {
  // Projeksiyon 100%'ü aşabilir; bar 0..100 zeminde çizilir, aşım kırmızı bölgeye taşar.
  const projGoster = Math.min(100, projPct);
  return (
    <div className="relative h-5 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-line">
      {/* projeksiyon (arka, açık) */}
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full transition-all", asim ? "bg-danger2/25" : "bg-brand-300/45")}
        style={{ width: `${projGoster}%` }}
      />
      {/* gerçek kullanım (ön, dolu) */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-all"
        style={{ width: `${Math.min(100, kullanimPct)}%` }}
      />
      {/* kota sınır çizgisi (100%) */}
      <div className="absolute inset-y-0 right-0 w-px bg-slate-ink/70" />
    </div>
  );
}

/* ------------------------------------------------------------------ Mini metrik kutusu */
function MiniMetrik({ ikon, etiket, deger }: { ikon: React.ReactNode; etiket: string; deger: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3">
      <div className="flex items-center gap-1.5 text-slate-faint">{ikon}<span className="text-[11px]">{etiket}</span></div>
      <p className="num mt-1 text-[15px] font-semibold text-slate-ink">{deger}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Günlük kullanım SVG grafik + projeksiyon */
function GunlukGrafik({
  gunlukSeri,
  etiketler,
  gunlukOrt,
  kalanGun,
  t,
  nf,
  dil,
}: {
  gunlukSeri: number[];
  etiketler: string[];
  gunlukOrt: number;
  kalanGun: number;
  t: Ceviri;
  nf: (n: number) => string;
  dil: Dil;
}) {
  if (gunlukSeri.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-faint">{t("ko.grafik.bosVeri")}</p>;
  }
  const W = 640;
  const H = 200;
  const padL = 8;
  const padR = 8;
  const padB = 22;
  const padT = 8;

  // Projeksiyon barları: kalan günler için günlük ortalama (açık ton).
  const projBarlar: number[] = Array.from({ length: kalanGun }, () => gunlukOrt);
  const tumDeger = [...gunlukSeri, ...projBarlar];
  const maxDeger = Math.max(1, ...tumDeger);
  const barSayisi = tumDeger.length;
  const cizW = W - padL - padR;
  const barW = cizW / barSayisi;
  const cizH = H - padT - padB;

  // Ortalama çizgisi y'si.
  const ortY = padT + cizH - (gunlukOrt / maxDeger) * cizH;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full min-w-[520px]" role="img" aria-label={t("ko.grafik.aria")}>
        {/* yatay ızgara */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padR}
            y1={padT + cizH - f * cizH}
            y2={padT + cizH - f * cizH}
            stroke="currentColor"
            className="text-line"
            strokeWidth={1}
          />
        ))}

        {/* barlar */}
        {tumDeger.map((v, i) => {
          const h = (v / maxDeger) * cizH;
          const x = padL + i * barW + barW * 0.15;
          const y = padT + cizH - h;
          const projMi = i >= gunlukSeri.length;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW * 0.7}
              height={Math.max(0, h)}
              rx={2}
              className={projMi ? "fill-brand-300/50" : "fill-brand-600"}
            >
              <title>
                {projMi ? t("ko.grafik.projeksiyon") : etiketler[i] ?? ""}: {v.toLocaleString(dil)}
              </title>
            </rect>
          );
        })}

        {/* ortalama (run-rate) çizgisi */}
        <line
          x1={padL}
          x2={W - padR}
          y1={ortY}
          y2={ortY}
          stroke="currentColor"
          className="text-warn"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        {/* projeksiyon bölge ayıracı */}
        {kalanGun > 0 && (
          <line
            x1={padL + gunlukSeri.length * barW}
            x2={padL + gunlukSeri.length * barW}
            y1={padT}
            y2={padT + cizH}
            stroke="currentColor"
            className="text-slate-300"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {/* x etiketleri (seyrek) */}
        {etiketler.map((e, i) => {
          const adim = Math.ceil(etiketler.length / 8);
          if (i % adim !== 0) return null;
          return (
            <text
              key={i}
              x={padL + i * barW + barW / 2}
              y={H - 6}
              textAnchor="middle"
              className="fill-slate-faint text-[9px]"
            >
              {e}
            </text>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-600" /> {t("ko.grafik.gercekGunluk")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-300/50" /> {t("ko.grafik.projeksiyon")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warn" /> {t("ko.grafik.runRate").replace("{n}", nf(gunlukOrt))}</span>
      </div>
    </div>
  );
}
