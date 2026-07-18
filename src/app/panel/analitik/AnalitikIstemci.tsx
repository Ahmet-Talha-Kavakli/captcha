"use client";

import { useRouter } from "next/navigation";
import { Download, Cpu, Globe, Server, Route, Sigma } from "lucide-react";
import { PanelBaslik, Panel, Badge, useToast } from "@/components/panel/kit";
import { StackBar, DonutDagilim } from "@/components/panel/grafikler";
import { IsiMatris } from "@/components/panel/grafikler-ek";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { bayrak } from "@/lib/flag";
import type { Dil } from "@/lib/i18n/panel";
import { analitikCeviri } from "./analitik.i18n";
import { KpiKart, Funnel, Histogram, delta } from "./parcalar";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";

// Bot sınıfı renkleri — merkezi görsel kimlikten (tek kaynak). Eskiden ddos
// neredeyse-siyah (#0b0b18) ve spam koyu-gri (#5c6072) idi; krem temaya uymuyordu.
const BOT_RENK: Record<string, string> = {
  human: botSinifGorsel("human").renk,
  good_bot: botSinifGorsel("good_bot").renk,
  automation: botSinifGorsel("automation").renk,
  scraper: botSinifGorsel("scraper").renk,
  credential_stuffing: botSinifGorsel("credential_stuffing").renk,
  ai_agent: botSinifGorsel("ai_agent").renk,
  ddos: botSinifGorsel("ddos").renk,
  spam: botSinifGorsel("spam").renk,
};
const ASN_KAT_TON: Record<string, "kirmizi" | "sari" | "yesil"> = {
  vpn: "kirmizi",
  datacenter: "sari",
  temiz: "yesil",
};

type Sayac = { issued: number; verified: number; blocked: number; challenged: number };

export function AnalitikIstemci({
  dil,
  siteCount,
  donem,
  olayOrani,
  buDonem,
  oncekiDonem,
  aiBu,
  aiOnceki,
  ortBu,
  ortOnceki,
  gunluk,
  toplamTrend,
  insanTrend,
  botTrend,
  gunEtiketleri,
  botDagilim,
  funnel,
  heatmap,
  cografya,
  yollar,
  asnler,
  histogram,
  segmentler,
}: {
  dil: Dil;
  siteCount: number;
  donem: number;
  olayOrani: number;
  buDonem: Sayac;
  oncekiDonem: Sayac;
  aiBu: number;
  aiOnceki: number;
  ortBu: { skor: number; latency: number };
  ortOnceki: { skor: number; latency: number };
  gunluk: { label: string; insan: number; bot: number }[];
  toplamTrend: number[];
  insanTrend: number[];
  botTrend: number[];
  gunEtiketleri: string[];
  botDagilim: [string, number][];
  funnel: { toplam: number; incelendi: number; dogrulama: number; engellendi: number; izin: number };
  heatmap: number[][];
  cografya: { kod: string; istek: number; bot: number; oran: number }[];
  yollar: { yol: string; istek: number; engel: number }[];
  asnler: { asn: string; istek: number; bot: number; kat: "vpn" | "datacenter" | "temiz"; oran: number }[];
  histogram: number[];
  segmentler: { aile: string; istek: number; engel: number; bot: boolean }[];
}) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => analitikCeviri(k, dil);

  // --- KPI türetimleri (sayaç bazlı, gerçek ölçek) ---
  const toplam = buDonem.issued;
  const toplamOnceki = oncekiDonem.issued;
  const botlar = buDonem.blocked + buDonem.challenged;
  const botlarOnceki = oncekiDonem.blocked + oncekiDonem.challenged;
  const engelOran = toplam ? (buDonem.blocked / toplam) * 100 : 0;
  const engelOranOnceki = toplamOnceki ? (oncekiDonem.blocked / toplamOnceki) * 100 : 0;

  const dToplam = delta(toplam, toplamOnceki);
  const dInsan = delta(buDonem.verified, oncekiDonem.verified);
  const dBot = delta(botlar, botlarOnceki);
  const dAi = delta(aiBu, aiOnceki);
  const dEngel = delta(engelOran, engelOranOnceki);
  const dSkor = delta(ortBu.skor, ortOnceki.skor);
  const dLatency = delta(ortBu.latency, ortOnceki.latency);

  // --- Donut segmentleri (Türkçe etiketli, yüzdeli) ---
  const donut = botDagilim.map(([k, v]) => ({ etiket: t(`an.bot.${k}`), deger: v, renk: BOT_RENK[k] || "#8b8fa3" }));
  const botDagilimToplam = botDagilim.reduce((a, [, v]) => a + v, 0);

  const maxSegIstek = Math.max(...segmentler.map((s) => s.istek), 1);
  const maxGeoIstek = Math.max(...cografya.map((g) => g.istek), 1);

  // --- Yollar → ısı-matris satırları (istek / engel / risk% 0-100 yoğunluk) ---
  const yolMaxIstek = Math.max(...yollar.map((y) => y.istek), 1);
  const yolMaxEngel = Math.max(...yollar.map((y) => y.engel), 1);
  const yolSatirlar = yollar.map((y) => y.yol);
  const yolSutunlar = [t("an.yol.col.istek"), t("an.yol.col.engel"), t("an.yol.col.risk")];
  const yolDegerler = yollar.map((y) => [
    Math.round((y.istek / yolMaxIstek) * 100),
    Math.round((y.engel / yolMaxEngel) * 100),
    Math.round(y.istek ? (y.engel / y.istek) * 100 : 0),
  ]);

  // --- ASN → kategori donutu (VPN / veri-merkezi / temiz) + kompakt kartlar ---
  const asnKatToplam: Record<string, number> = { vpn: 0, datacenter: 0, temiz: 0 };
  for (const a of asnler) asnKatToplam[a.kat] += a.istek;
  const asnDonut = [
    { etiket: t("an.asn.vpn"), deger: asnKatToplam.vpn, renk: "#dc2626" },
    { etiket: t("an.asn.datacenter"), deger: asnKatToplam.datacenter, renk: "#d97706" },
    { etiket: t("an.asn.temiz"), deger: asnKatToplam.temiz, renk: "#16a34a" },
  ].filter((d) => d.deger > 0);

  // --- Segment → bot vs tarayıcı özet donutu ---
  const segBotToplam = segmentler.filter((s) => s.bot).reduce((a, s) => a + s.istek, 0);
  const segTarayiciToplam = segmentler.filter((s) => !s.bot).reduce((a, s) => a + s.istek, 0);
  const segDonut = [
    { etiket: t("an.seg.tarayiciToplam"), deger: segTarayiciToplam, renk: "#2f6fed" },
    { etiket: t("an.seg.botToplam"), deger: segBotToplam, renk: "#dc2626" },
  ].filter((d) => d.deger > 0);

  // --- Funnel adımları ---
  const funnelAdimlar = [
    { etiket: t("an.funnel.toplam"), deger: funnel.toplam, renk: "#2f6fed" },
    { etiket: t("an.funnel.incelendi"), deger: funnel.incelendi, renk: "#4a41e8" },
    { etiket: t("an.funnel.dogrulama"), deger: funnel.dogrulama, renk: "#d97706" },
    { etiket: t("an.funnel.engellendi"), deger: funnel.engellendi, renk: "#dc2626" },
    { etiket: t("an.funnel.izin"), deger: funnel.izin, renk: "#16a34a" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("an.ozet").replace("{site}", String(siteCount)).replaceAll("{donem}", String(donem))}
        aksiyon={
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-line-strong bg-surface p-1">
              {[7, 30, 90].map((dd) => (
                <button
                  key={dd}
                  onClick={() => router.push(`/panel/analitik?donem=${dd}`)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                    donem === dd ? "bg-brand-600 text-white" : "text-slate-muted hover:text-slate-ink",
                  )}
                >
                  {dd}g
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportCsv(
                  `specter-analitik-${donem}g.csv`,
                  gunluk.map((g, i) => ({
                    [t("an.csv.gun")]: g.label, [t("an.csv.toplam")]: toplamTrend[i] ?? 0, [t("an.csv.insan")]: g.insan, [t("an.csv.bot")]: g.bot,
                  })),
                );
                goster({ tip: "basari", baslik: t("an.csvIndirildi") });
              }}
            >
              <Download className="size-4" /> {t("an.disaAktar")}
            </Button>
          </div>
        }
      />

      {/* ---------------------------------------------------------------- KPI şeridi */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKart etiket={t("an.kpi.toplam")} deger={toplam.toLocaleString("tr-TR")} spark={toplamTrend} sparkRenk="#2f6fed" d={dToplam} iyiYon="notr" />
        <KpiKart etiket={t("an.kpi.insan")} deger={buDonem.verified.toLocaleString("tr-TR")} spark={insanTrend} sparkRenk="#16a34a" d={dInsan} iyiYon="up" />
        <KpiKart etiket={t("an.kpi.bot")} deger={botlar.toLocaleString("tr-TR")} spark={botTrend} sparkRenk="#dc2626" d={dBot} iyiYon="down" />
        <KpiKart etiket={t("an.kpi.ai")} deger={aiBu.toLocaleString("tr-TR")} spark={botTrend} sparkRenk="#6a97fb" d={dAi} iyiYon="down" altBilgi={t("an.kpi.ai.alt")} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiKart etiket={t("an.kpi.engel")} deger={`%${engelOran.toFixed(1)}`} spark={botTrend} sparkRenk="#dc2626" d={dEngel} iyiYon="notr" altBilgi={t("an.kpi.engel.alt")} />
        <KpiKart etiket={t("an.kpi.skor")} deger={ortBu.skor.toFixed(2)} spark={insanTrend} sparkRenk="#4a41e8" d={dSkor} iyiYon="up" altBilgi={t("an.kpi.skor.alt")} />
        <KpiKart etiket={t("an.kpi.latency")} deger={`${ortBu.latency.toFixed(0)} ms`} spark={toplamTrend} sparkRenk="#0891b2" d={dLatency} iyiYon="down" altBilgi={t("an.kpi.latency.alt")} />
      </div>

      {/* ---------------------------------------------------------------- Zaman serisi */}
      <Panel
        baslik={t("an.zaman.baslik").replace("{donem}", String(donem))}
        sagUst={
          <div className="flex items-center gap-3 text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-sm bg-brand-500" /> {t("an.lejant.insan")}</span>
            <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-sm bg-danger2/80" /> {t("an.lejant.bot")}</span>
          </div>
        }
      >
        <StackBar data={gunluk} yukseklik={280} />
      </Panel>

      {/* ---------------------------------------------------------------- Bot sınıfı + Funnel */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel baslik={t("an.sinif.baslik")} sagUst={<span className="text-[12px] text-slate-faint">{t("an.sinif.orneklem")}</span>}>
          {botDagilimToplam === 0 ? (
            <p className="py-8 text-center text-[13px] text-slate-faint">{t("an.sinif.bos")}</p>
          ) : (
            <DonutDagilim segmentler={donut} />
          )}
        </Panel>
        <Panel baslik={t("an.funnel.baslik")} sagUst={<Badge ton="brand"><Sigma className="size-3" /> {t("an.funnel.rozet")}</Badge>}>
          <Funnel adimlar={funnelAdimlar} t={t} />
        </Panel>
      </div>

      {/* ---------------------------------------------------------------- Skor histogramı */}
      <Panel
        baslik={t("an.hist.baslik")}
        sagUst={<span className="text-[12px] text-slate-faint">{t("an.hist.altBilgi")}</span>}
      >
        <Histogram kovalar={histogram} t={t} />
      </Panel>

      {/* ---------------------------------------------------------------- Heatmap + Coğrafya */}
      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <Panel baslik={t("an.heat.baslik")} sagUst={<span className="text-[12px] text-slate-faint">{t("an.heat.altBilgi")}</span>}>
          <Heatmap veri={heatmap} t={t} />
        </Panel>
        <Panel baslik={t("an.geo.baslik")} sagUst={<Badge ton="mavi"><Globe className="size-3" /> {t("an.geo.rozet")}</Badge>}>
          {cografya.length === 0 ? (
            <p className="text-[13px] text-slate-faint">{t("an.geo.bos")}</p>
          ) : (
            <GeoKartlar cografya={cografya} maxGeoIstek={maxGeoIstek} t={t} />
          )}
        </Panel>
      </div>

      {/* ---------------------------------------------------------------- Yollar (ısı-matris) + ASN (kategori donutu + kartlar) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          baslik={t("an.yol.baslik")}
          sagUst={
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-slate-faint sm:inline">{t("an.yol.altBilgi")}</span>
              <Badge ton="kirmizi"><Route className="size-3" /> {t("an.yol.rozet")}</Badge>
            </div>
          }
        >
          {yollar.length === 0 ? (
            <p className="text-[13px] text-slate-faint">{t("an.yol.bos")}</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                <IsiMatris satirlar={yolSatirlar} sutunlar={yolSutunlar} degerler={yolDegerler} />
              </div>
            </div>
          )}
        </Panel>
        <Panel baslik={t("an.asn.baslik")} sagUst={<Badge ton="gri"><Server className="size-3" /> {t("an.asn.rozet")}</Badge>}>
          {asnler.length === 0 ? (
            <p className="text-[13px] text-slate-faint">{t("an.asn.bos")}</p>
          ) : (
            <div className="space-y-4">
              {asnDonut.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-faint">{t("an.asn.kategori")}</p>
                  <DonutDagilim segmentler={asnDonut} />
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {asnler.map((a) => (
                  <div key={a.asn} className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line bg-canvas/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge ton={ASN_KAT_TON[a.kat]}>{t(`an.asn.${a.kat}`)}</Badge>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                          a.oran >= 50 ? "bg-danger-soft text-danger2" : a.oran >= 25 ? "bg-warn-soft text-amber-700" : "bg-ok-soft text-ok",
                        )}
                      >
                        %{a.oran.toFixed(0)}
                      </span>
                    </div>
                    <span className="truncate text-[13px] font-medium text-slate-ink" title={a.asn}>{a.asn}</span>
                    <span className="num tabular-nums text-[12px] text-slate-muted">
                      {a.istek.toLocaleString("tr-TR")} {t("an.yol.istek")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ---------------------------------------------------------------- Segment kırılımı */}
      <Panel baslik={t("an.seg.baslik")} sagUst={<Badge ton="mavi"><Cpu className="size-3" /> {t("an.seg.rozet")}</Badge>}>
        {segmentler.length === 0 ? (
          <p className="text-[13px] text-slate-faint">{t("an.seg.bos")}</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            {segDonut.length > 0 && (
              <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-faint">{t("an.seg.ozet")}</p>
                <DonutDagilim segmentler={segDonut} />
              </div>
            )}
            <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  <th className="py-2.5 pr-4">{t("an.seg.aile")}</th>
                  <th className="px-4 py-2.5">{t("an.seg.tur")}</th>
                  <th className="px-4 py-2.5 text-right">{t("an.seg.istek")}</th>
                  <th className="px-4 py-2.5 text-right">{t("an.seg.engel")}</th>
                  <th className="px-4 py-2.5">{t("an.seg.pay")}</th>
                </tr>
              </thead>
              <tbody>
                {segmentler.map((s) => (
                  <tr key={s.aile} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-ink">{s.aile}</td>
                    <td className="px-4 py-3">
                      <Badge ton={s.bot ? "kirmizi" : "yesil"}>{s.bot ? t("an.seg.botTur") : t("an.seg.tarayici")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right num tabular-nums text-slate-ink">{s.istek.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right num tabular-nums text-danger2">{s.engel.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(s.istek / maxSegIstek) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </Panel>

      <p className="px-1 text-[11px] text-slate-faint">
        {t("an.dipnot").replace("{oran}", String(olayOrani))}
      </p>
    </div>
  );
}

/* Coğrafi dağılım — ısı-renkli ülke kartları: hacme göre dolgu genişliği,
 * bot-oranına göre renk (yeşil→amber→kırmızı). Yatay-bar listesi değil. */
function GeoKartlar({
  cografya,
  maxGeoIstek,
  t,
}: {
  cografya: { kod: string; istek: number; bot: number; oran: number }[];
  maxGeoIstek: number;
  t: (k: string) => string;
}) {
  const oranTon = (oran: number) =>
    oran >= 50
      ? { cip: "bg-danger-soft text-danger2", dolgu: "#dc2626" }
      : oran >= 25
        ? { cip: "bg-warn-soft text-amber-700", dolgu: "#d97706" }
        : { cip: "bg-ok-soft text-ok", dolgu: "#16a34a" };
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cografya.map((g) => {
        const ton = oranTon(g.oran);
        const dolu = Math.max(6, (g.istek / maxGeoIstek) * 100);
        return (
          <div key={g.kod} className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas/40 p-3">
            {/* hacim dolgusu — zemin, bot-oranı rengiyle çok soluk */}
            <div
              className="absolute inset-y-0 left-0 opacity-[0.09]"
              style={{ width: `${dolu}%`, background: ton.dolgu }}
            />
            <div className="relative flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
                <span className="text-[15px] leading-none">{bayrak(g.kod)}</span>
                <span className="truncate">{g.kod}</span>
              </div>
              <span className="num text-lg font-bold leading-none tabular-nums text-slate-ink">{g.istek.toLocaleString("tr-TR")}</span>
              <span className={cn("w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", ton.cip)}>
                {t("an.geo.botOran").replace("%", `%${g.oran.toFixed(0)}`)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const GUN_ANAHTAR = ["an.gun.pzt", "an.gun.sal", "an.gun.car", "an.gun.per", "an.gun.cum", "an.gun.cmt", "an.gun.paz"];
function Heatmap({ veri, t }: { veri: number[][]; t: (k: string) => string }) {
  const max = Math.max(1, ...veri.flat());
  const gunler = GUN_ANAHTAR.map((k) => t(k));
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2">
        <div className="flex shrink-0 flex-col justify-between pt-6 pb-1">
          {gunler.map((g) => <span key={g} className="h-[18px] text-[11px] leading-[18px] text-slate-faint">{g}</span>)}
        </div>
        <div className="min-w-[480px] flex-1">
          <div className="mb-1 flex justify-between text-[10px] text-slate-faint">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23</span>
          </div>
          <div className="space-y-[3px]">
            {veri.map((satir, g) => (
              <div key={g} className="flex gap-[3px]">
                {satir.map((v, s) => {
                  const yogun = v / max;
                  return (
                    <div
                      key={s}
                      title={t("an.heat.tooltip").replace("{gun}", gunler[g]).replace("{saat}", String(s)).replace("{sayi}", String(v))}
                      className="h-[18px] flex-1 rounded-[3px] transition hover:ring-2 hover:ring-brand-400"
                      style={{ background: v === 0 ? "var(--color-canvas)" : `rgba(47,111,237,${0.15 + yogun * 0.85})` }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
