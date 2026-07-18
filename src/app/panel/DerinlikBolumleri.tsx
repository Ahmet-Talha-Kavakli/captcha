"use client";

/**
 * Specter — Derinlik Bölümleri (Depth Sections)
 * =============================================
 * Dashboard'a "güven merkezi düzeni + Specter derinliği" katan 6 gerçek
 * güvenlik-istihbarat bölümü. HİÇBİR sayı uydurma değildir — hepsi motorlardan
 * (`durus`, `yuzey`, `nabiz`, `cografya`, `savunma`, `aiRadar`) türetilir.
 *
 * 6 bölüm (sırayla):
 *   1. Tehdit Duruşu       — 5 eksenli koruma sağlığı + harf notu + trend.
 *   2. AI Bot Radarı        — Specter'ın ana farkı: LLM ajanlarını görmek.
 *   3. Saldırı Yüzeyi        — hangi kapılar/araçlar/imzalar hedefleniyor.
 *   4. Coğrafi & ASN         — trafik nereden geliyor, ne kadarı datacenter.
 *   5. Savunma Etkinliği     — yakalama hunisi + kural performansı + FP riski.
 *   6. Canlı Nabız           — anlık RPS + 24s stacked seri + momentum.
 *
 * Tasarım: krem tema (bg-surface / border-line / text-slate-*), tabular-nums,
 * rounded-2xl kartlar; her bölüm framer-motion ile fade+rise (azHareket → sade).
 */

import { motion } from "framer-motion";
import {
  Gauge,
  Cpu,
  Target,
  Globe,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Fingerprint,
  Network,
  Filter,
  GitBranch,
  Clock,
  Radar as RadarIcon,
  AlertTriangle,
  Layers,
  ServerCog,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import type { TehditDurusu } from "@/lib/specter/tehdit-durusu";
import type { SaldiriYuzeyi } from "@/lib/specter/saldiri-yuzeyi";
import type { CanliNabiz } from "@/lib/specter/canli-nabiz";
import type { CografyaIstihbarat } from "@/lib/specter/cografya-istihbarat";
import type { SavunmaEtkinlik } from "@/lib/specter/savunma-etkinlik";
import type { AiBotRadar } from "@/lib/specter/ai-bot-radar";
import { Panel, Badge, NotKutusu, Ulke, Tooltip, Ilerleme } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, RadarGrafik, IsiMatris, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";

/* ================================================================== Sabitler */

/** BotClass → sabit TR etiket (motor değeri; çevrilmez). */
const BOT_SINIF_ETIKET: Record<string, string> = {
  human: "İnsan",
  good_bot: "İyi bot",
  automation: "Otomasyon",
  scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma",
  ai_agent: "AI ajan",
  ddos: "DDoS",
  spam: "Spam",
};

/** Verdict → sabit TR etiket. */
const VERDICT_ETIKET: Record<string, string> = {
  allowed: "İzin",
  challenged: "Meydan okuma",
  blocked: "Engellendi",
  flagged: "İşaretlendi",
};

/* ================================================================== Yardımcılar */

/** Skora göre tutarlı hex renk (çubuklar/vurgular). */
function skorRenk(skor: number): string {
  if (skor >= 85) return "#16a34a"; // yeşil
  if (skor >= 65) return "#2f6fed"; // brand mavi
  if (skor >= 50) return "#d97706"; // amber
  return "#dc2626"; // kırmızı
}

/** Harf notunun rengi (A+/A yeşil, B mavi, C sarı, D kırmızı). */
function harfRenk(harf: TehditDurusu["durusHarfi"]): string {
  if (harf === "A+" || harf === "A") return "#16a34a";
  if (harf === "B") return "#2f6fed";
  if (harf === "C") return "#d97706";
  return "#dc2626";
}

/** Tehdit seviyesi → nokta rengi. */
function seviyeNoktaRenk(seviye: "dusuk" | "orta" | "yuksek"): string {
  return seviye === "yuksek" ? "#dc2626" : seviye === "orta" ? "#d97706" : "#16a34a";
}

/** Yüzde biçimi: 0..1 oranı → "%42". */
function yuzOran(oran: number): string {
  return `%${Math.round((Number.isFinite(oran) ? oran : 0) * 100)}`;
}

/** 0..100 değeri tam sayı yüzde: "%42". */
function yuz100(v: number): string {
  return `%${Math.round(Number.isFinite(v) ? v : 0)}`;
}

/** Büyük sayıyı yerelleştir (tabular). */
function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Göreli zaman: epoch ms → "3 dk önce" / "2 sa önce" / "5 gün önce". */
function goreliZaman(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return "—";
  const fark = Date.now() - ts;
  if (fark < 0) return "az önce";
  const sn = Math.floor(fark / 1000);
  if (sn < 60) return "az önce";
  const dk = Math.floor(sn / 60);
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const gun = Math.floor(sa / 24);
  return `${gun} gün önce`;
}

/** BotClass etiketi (bilinmeyen değer ham döner). */
function sinifEtiket(sinif: string): string {
  return BOT_SINIF_ETIKET[sinif] ?? sinif;
}

/* ================================================================== Ortak alt-bileşenler */

/** Bir bölümü fade+rise ile saran motion sarmalayıcı. */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      // opacity:0 + whileInView KULLANMA — viewport'a girmeyen/headless'ta
      // görünmez kalır. Mount-based hafif kayma; görünürlük her koşulda garanti.
      initial={{ y: 16 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/** Küçük özet-hap (etiket + büyük sayı). */
function OzetHap({
  etiket,
  deger,
  ton,
  ikon: Ikon,
}: {
  etiket: string;
  deger: React.ReactNode;
  ton?: "brand" | "danger" | "ok" | "warn";
  ikon?: React.ElementType;
}) {
  const renk =
    ton === "danger"
      ? "text-danger2"
      : ton === "ok"
        ? "text-ok"
        : ton === "warn"
          ? "text-warn"
          : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        {Ikon && <Ikon className="size-3.5" />}
        {etiket}
      </div>
      <div className={cn("mt-1 text-[22px] font-bold leading-none num", renk)}>{deger}</div>
    </div>
  );
}

/** Trend/eğilim oku rozeti (artış/azalış + yüzde metni). */
function TrendRozet({
  yon,
  metin,
  iyiYukari,
}: {
  yon: "up" | "down" | "flat";
  metin: string;
  /** true → yukarı=iyi(yeşil); false → yukarı=kötü(kırmızı). */
  iyiYukari: boolean;
}) {
  if (yon === "flat") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
        <Minus className="size-3.5" />
        {metin}
      </span>
    );
  }
  const iyi = yon === "up" ? iyiYukari : !iyiYukari;
  const Ikon = yon === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset",
        iyi ? "bg-ok-soft text-green-700 ring-green-200" : "bg-danger-soft text-red-700 ring-red-200",
      )}
    >
      <Ikon className="size-3.5" />
      {metin}
    </span>
  );
}

/* ================================================================== 1) Tehdit Duruşu */

function TehditDurusuBolum({
  t,
  durus,
  azHareket,
}: {
  t: (k: string) => string;
  durus: TehditDurusu;
  azHareket: boolean;
}) {
  const eksenler = durus.eksenler ?? [];
  const hRenk = harfRenk(durus.durusHarfi);
  const trendYon = durus.trend > 0 ? "up" : durus.trend < 0 ? "down" : "flat";
  const trendMetin =
    durus.trend === 0
      ? t("dr.durus.sabitTrend")
      : `${durus.trend > 0 ? "+" : ""}${durus.trend} ${t("dr.durus.puan24s")}`;

  return (
    <Bolum azHareket={azHareket} gecikme={0}>
      <Panel
        baslik={<BaslikIkon ikon={Gauge} metin={t("dr.durus.baslik")} />}
        sagUst={
          <span className="text-[12px] text-slate-faint">
            {sayi(durus.olaySayisi)} {t("dr.durus.olaydan")}
          </span>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
          {/* Sol: büyük harf notu + skor + trend */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 py-6">
            <div
              className="text-[64px] font-black leading-none tabular-nums"
              style={{ color: hRenk }}
            >
              {durus.durusHarfi}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[30px] font-bold leading-none num text-slate-ink">
                {durus.genelSkor}
              </span>
              <span className="text-[13px] text-slate-faint">/100</span>
            </div>
            <div className="mt-3">
              <TrendRozet yon={trendYon} metin={trendMetin} iyiYukari />
            </div>
            <p className="mt-3 max-w-[180px] text-center text-[11px] leading-relaxed text-slate-faint">
              {t("dr.durus.genelAltyazi")}
            </p>
          </div>

          {/* Orta: çok-eksenli koruma profili (radar) */}
          <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-line bg-canvas/30 py-4">
            {eksenler.length < 3 ? (
              <div className="grid h-full min-h-[160px] place-items-center text-[13px] text-slate-faint">
                {t("dr.durus.eksenYok")}
              </div>
            ) : (
              <>
                <RadarGrafik
                  eksenler={eksenler.map((e) => ({ etiket: e.ad, deger: e.skor }))}
                  boyut={220}
                  renk={hRenk}
                />
                <span className="mt-1 text-[11px] font-medium text-slate-faint">
                  Koruma profili
                </span>
              </>
            )}
          </div>

          {/* Sağ: eksen bazında kompakt skor kartları (renk noktalı) */}
          <div className="min-w-0 space-y-2.5">
            {eksenler.length === 0 ? (
              <div className="grid h-full place-items-center text-[13px] text-slate-faint">
                {t("dr.durus.eksenYok")}
              </div>
            ) : (
              eksenler.map((eksen) => {
                const er = skorRenk(eksen.skor);
                return (
                  <div
                    key={eksen.ad}
                    className="rounded-xl border border-line bg-canvas/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-slate-ink">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: er }} />
                        <span className="truncate">{eksen.ad}</span>
                      </span>
                      <span
                        className="shrink-0 text-[15px] font-bold tabular-nums"
                        style={{ color: er }}
                      >
                        {eksen.skor}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-faint">
                      {eksen.aciklama}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kritik bulgu */}
        {eksenler.length > 0 && (
          <div className="mt-5">
            <NotKutusu ton="sari">
              <span className="font-semibold">{durus.kritikBulgu.eksen}</span>{" "}
              {t("dr.durus.zayifHalka")} ({durus.kritikBulgu.skor}/100).
            </NotKutusu>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}

/* ================================================================== 2) AI Bot Radarı */

function AiRadarBolum({
  t,
  aiRadar,
  azHareket,
}: {
  t: (k: string) => string;
  aiRadar: AiBotRadar;
  azHareket: boolean;
}) {
  const ajanlar = aiRadar.ajanlar ?? [];
  const eg = aiRadar.egilim;
  const egYon = eg.yon === "artis" ? "up" : eg.yon === "azalis" ? "down" : "flat";
  const pol = aiRadar.politikaDurum;
  const polSegmentler = [
    { etiket: VERDICT_ETIKET.allowed, deger: pol.izinVerilen, renk: "#16a34a" },
    { etiket: VERDICT_ETIKET.challenged, deger: pol.meydanOkunan, renk: "#d97706" },
    { etiket: VERDICT_ETIKET.blocked, deger: pol.engellenen, renk: "#dc2626" },
  ];

  return (
    <Bolum azHareket={azHareket} gecikme={0.05}>
      <Panel
        baslik={<BaslikIkon ikon={Cpu} metin={t("dr.ai.baslik")} />}
        sagUst={
          <TrendRozet
            yon={egYon}
            metin={`${eg.yuzde > 0 ? "+" : ""}${eg.yuzde}%`}
            iyiYukari={false}
          />
        }
      >
        {/* 4 mini-stat */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap etiket={t("dr.ai.taninanAjan")} deger={sayi(aiRadar.ozet.taninanAjan)} ikon={RadarIcon} />
          <OzetHap etiket={t("dr.ai.toplamTrafik")} deger={sayi(aiRadar.toplamAiTrafik)} ton="brand" ikon={Cpu} />
          <OzetHap etiket={t("dr.ai.son24")} deger={sayi(aiRadar.son24Ai)} ikon={Clock} />
          <OzetHap
            etiket={t("dr.ai.engelOran")}
            deger={yuzOran(aiRadar.ozet.engelOran)}
            ton={aiRadar.ozet.engelOran >= 0.5 ? "ok" : "warn"}
          />
        </div>

        {ajanlar.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <RadarIcon className="mb-2 size-7 text-slate-faint" />
            <p className="text-[13px] font-medium text-slate-muted">{t("dr.ai.bosBaslik")}</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">{t("dr.ai.bosAciklama")}</p>
          </div>
        ) : (
          <>
            {/* Ajan başına trafik histogramı — bar-liste yerine yoğunluk profili */}
            <div className="mt-5 rounded-2xl border border-line bg-canvas/30 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                <Cpu className="size-3.5 text-slate-faint" />
                Ajan başına trafik hacmi
              </div>
              <Histogram
                kovalar={ajanlar.slice(0, 10).map((a) => ({
                  etiket: a.ad.length > 8 ? `${a.ad.slice(0, 8)}…` : a.ad,
                  deger: a.olay,
                  ton: a.olay > 0 && a.engellenen / a.olay >= 0.5 ? "bot" : "nötr",
                }))}
                yukseklik={96}
                renk="#0891b2"
              />
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              {/* Ajan tablosu — engel oranı segment çubuğuyla (Ilerleme yerine) */}
              <div className="min-w-0 space-y-2.5">
                {ajanlar.map((ajan) => {
                  const engelOran = ajan.olay > 0 ? (ajan.engellenen / ajan.olay) * 100 : 0;
                  const izinOran = 100 - engelOran;
                  return (
                    <div
                      key={ajan.ad}
                      className="rounded-xl border border-line bg-canvas/30 px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Cpu className="size-4 shrink-0 text-brand-600" />
                          <span className="truncate text-[13px] font-semibold text-slate-ink">
                            {ajan.ad}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-faint">
                          {goreliZaman(ajan.sonGoruldu)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-[12px]">
                        <span className="tabular-nums text-slate-muted">
                          {sayi(ajan.olay)} {t("dr.ai.olay")}
                        </span>
                        <span className="tabular-nums text-green-700">
                          ✓ {sayi(ajan.izinVerilen)}
                        </span>
                        <span className="tabular-nums text-red-700">
                          ✕ {sayi(ajan.engellenen)}
                        </span>
                      </div>
                      {/* izin/engel oran çubuğu — tek renkli bar yerine iki-tonlu */}
                      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div style={{ width: `${izinOran}%`, background: "#16a34a" }} />
                        <div style={{ width: `${engelOran}%`, background: "#dc2626" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Politika dağılımı */}
              <div className="flex flex-col justify-center rounded-2xl border border-line bg-canvas/30 p-4">
                <div className="mb-2 text-[12px] font-medium text-slate-muted">
                  {t("dr.ai.politika")}
                </div>
                <DonutDagilim segmentler={polSegmentler} />
              </div>
            </div>
          </>
        )}

        {aiRadar.bilinmeyenBot > 0 && (
          <div className="mt-4">
            <NotKutusu ton="bilgi">
              {sayi(aiRadar.bilinmeyenBot)} {t("dr.ai.bilinmeyen")}
            </NotKutusu>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}

/* ================================================================== 3) Saldırı Yüzeyi */

function SaldiriYuzeyiBolum({
  t,
  yuzey,
  azHareket,
}: {
  t: (k: string) => string;
  yuzey: SaldiriYuzeyi;
  azHareket: boolean;
}) {
  const yollar = yuzey.yollar ?? [];
  const yontemler = yuzey.yontemler ?? [];
  const protokoller = yuzey.protokoller ?? [];
  const tls = yuzey.tlsParmakizi ?? [];
  const enRiskli = yuzey.ozet.enRiskliYol;

  return (
    <Bolum azHareket={azHareket} gecikme={0.1}>
      <Panel baslik={<BaslikIkon ikon={Target} metin={t("dr.yuzey.baslik")} />}>
        {/* Üst 3 özet-hap */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <OzetHap etiket={t("dr.yuzey.toplamYuzey")} deger={sayi(yuzey.ozet.toplamYuzey)} ikon={Layers} />
          <OzetHap
            etiket={t("dr.yuzey.botluOran")}
            deger={yuz100(yuzey.ozet.botluYuzeyOran)}
            ton={yuzey.ozet.botluYuzeyOran >= 50 ? "danger" : "warn"}
            ikon={Target}
          />
          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <AlertTriangle className="size-3.5" />
              {t("dr.yuzey.enRiskli")}
            </div>
            <div className="mt-1 truncate font-mono text-[13px] font-semibold text-slate-ink">
              {enRiskli ? enRiskli.path : "—"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* Sol: en hedeflenen yollar — yol × risk faktörü ısı matrisi */}
          <div className="min-w-0">
            <div className="mb-3 text-[12px] font-medium text-slate-muted">
              {t("dr.yuzey.yollarBaslik")}
            </div>
            {yollar.length === 0 ? (
              <div className="grid h-20 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
                {t("dr.yuzey.veriYok")}
              </div>
            ) : (
              (() => {
                const ilk = yollar.slice(0, 6);
                const maxOlay = Math.max(1, ...ilk.map((y) => y.olay));
                const maxBot = Math.max(1, ...ilk.map((y) => y.botOlay));
                return (
                  <div className="overflow-x-auto">
                    <IsiMatris
                      satirlar={ilk.map((y) =>
                        y.path.length > 16 ? `${y.path.slice(0, 16)}…` : y.path,
                      )}
                      sutunlar={["Olay", "Bot", "Risk"]}
                      degerler={ilk.map((y) => [
                        Math.round((y.olay / maxOlay) * 100),
                        Math.round((y.botOlay / maxBot) * 100),
                        Math.round(y.riskSkoru),
                      ])}
                      renk="#dc2626"
                    />
                  </div>
                );
              })()
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-slate-faint">
              Her hücre göreli yoğunluk (0–100): koyu = daha yüksek maruzet.
            </p>
          </div>

          {/* Sağ: yöntemler + protokoller */}
          <div className="space-y-5">
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                <Filter className="size-3.5 text-slate-faint" />
                {t("dr.yuzey.yontemler")}
              </div>
              {yontemler.length === 0 ? (
                <div className="text-[12px] text-slate-faint">{t("dr.yuzey.veriYok")}</div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {yontemler.slice(0, 6).map((y) => (
                    <span
                      key={y.method}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/50 px-2.5 py-1 text-[12px]"
                    >
                      <span className="font-mono font-semibold text-slate-ink">{y.method}</span>
                      <span className="tabular-nums text-slate-faint">{yuz100(y.oran)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                <Network className="size-3.5 text-slate-faint" />
                {t("dr.yuzey.protokoller")}
              </div>
              {protokoller.length === 0 ? (
                <div className="text-[12px] text-slate-faint">{t("dr.yuzey.veriYok")}</div>
              ) : (
                <div className="space-y-2.5">
                  {protokoller.slice(0, 5).map((p) => (
                    <div key={p.surum}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="font-mono text-slate-ink">{p.surum}</span>
                        <span className="tabular-nums text-slate-faint">
                          {sayi(p.olay)} · {yuz100(p.oran)}
                        </span>
                      </div>
                      <Ilerleme deger={p.oran} ton="brand" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TLS parmak izi */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
            <Fingerprint className="size-3.5 text-slate-faint" />
            {t("dr.yuzey.tls")}
          </div>
          {tls.length === 0 ? (
            <div className="text-[12px] text-slate-faint">{t("dr.yuzey.tlsYok")}</div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {tls.slice(0, 4).map((f) => (
                <div
                  key={f.ja3}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/30 px-3.5 py-2.5"
                >
                  <span className="truncate font-mono text-[12px] text-slate-ink">
                    {f.ja3.length > 12 ? `${f.ja3.slice(0, 12)}…` : f.ja3}
                  </span>
                  <div className="flex shrink-0 items-center gap-2 text-[12px]">
                    <span className="tabular-nums text-slate-faint">{sayi(f.olay)}</span>
                    <Badge ton={f.botOran >= 50 ? "kirmizi" : "gri"}>{yuz100(f.botOran)} bot</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </Bolum>
  );
}

/* ================================================================== 4) Coğrafi & ASN */

function CografyaBolum({
  t,
  cografya,
  azHareket,
}: {
  t: (k: string) => string;
  cografya: CografyaIstihbarat;
  azHareket: boolean;
}) {
  const ulkeler = cografya.ulkeler ?? [];
  const asnler = cografya.asnler ?? [];
  const riskli = cografya.riskliBolgeler ?? [];
  const dcOran = cografya.datacenterOran;
  const dcYuksek = dcOran >= 0.3;

  return (
    <Bolum azHareket={azHareket} gecikme={0.05}>
      <Panel baslik={<BaslikIkon ikon={Globe} metin={t("dr.cografya.baslik")} />}>
        {/* Üst özet */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OzetHap etiket={t("dr.cografya.ulkeSayisi")} deger={sayi(cografya.ozet.ulkeSayisi)} ikon={Globe} />
          <OzetHap etiket={t("dr.cografya.asnSayisi")} deger={sayi(cografya.ozet.asnSayisi)} ikon={Network} />
          <OzetHap
            etiket={t("dr.cografya.datacenter")}
            deger={yuzOran(dcOran)}
            ton={dcYuksek ? "danger" : "ok"}
            ikon={ServerCog}
          />
          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              {t("dr.cografya.enTehditkar")}
            </div>
            <div className="mt-1.5">
              {cografya.ozet.enTehditkarUlke ? (
                <Ulke kod={cografya.ozet.enTehditkarUlke} />
              ) : (
                <span className="text-[13px] text-slate-faint">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Datacenter uyarısı */}
        {dcYuksek && (
          <div className="mt-4">
            <NotKutusu ton="kirmizi">
              {t("dr.cografya.dcUyariOn")} {yuzOran(dcOran)} {t("dr.cografya.dcUyariSon")}
            </NotKutusu>
          </div>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* Sol: ısı-renkli ülke kartları + riskli bölgeler */}
          <div className="min-w-0">
            <div className="mb-3 text-[12px] font-medium text-slate-muted">
              {t("dr.cografya.ulkelerBaslik")}
            </div>
            {ulkeler.length === 0 ? (
              <div className="grid h-20 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
                {t("dr.cografya.veriYok")}
              </div>
            ) : (
              <>
                {/* Trafik hacmine göre boy, bot-oranına göre renk (ısı kartları) */}
                {(() => {
                  const ilk = ulkeler.slice(0, 6);
                  const maxOlay = Math.max(1, ...ilk.map((u) => u.olay));
                  return (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {ilk.map((u) => {
                        const nokta = seviyeNoktaRenk(u.tehditSeviyesi);
                        const dolu = Math.round((u.olay / maxOlay) * 100);
                        return (
                          <div
                            key={u.kod}
                            className="min-w-0 rounded-xl border border-line bg-canvas/40 px-3 py-2.5"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="min-w-0 truncate text-[13px] font-semibold text-slate-ink">
                                {u.kod}
                              </span>
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ background: nokta }}
                              />
                            </div>
                            <div className="mt-1 text-[16px] font-bold tabular-nums text-slate-ink">
                              {sayi(u.olay)}
                            </div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-canvas">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.max(4, dolu)}%`, background: nokta }}
                              />
                            </div>
                            <div className="mt-1 text-[11px] tabular-nums text-slate-faint">
                              {yuzOran(u.botOran)} bot
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {riskli.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                      {t("dr.cografya.riskliBaslik")}
                    </div>
                    {riskli.slice(0, 5).map((u) => (
                      <div key={u.kod} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: seviyeNoktaRenk(u.tehditSeviyesi) }}
                          />
                          <Ulke kod={u.kod} />
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="tabular-nums text-red-700">{yuzOran(u.botOran)} bot</span>
                          <Badge ton="kirmizi">{t("dr.cografya.yuksekRisk")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sağ: ASN trafik payı donutu + kompakt sağlayıcı listesi */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
              <Network className="size-3.5 text-slate-faint" />
              {t("dr.cografya.asnBaslik")}
            </div>
            {asnler.length === 0 ? (
              <div className="grid h-20 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
                {t("dr.cografya.veriYok")}
              </div>
            ) : (
              <>
                {/* Sağlayıcı trafik payı — donut (bot-yoğun sağlayıcılar kırmızı) */}
                <div className="rounded-2xl border border-line bg-canvas/30 p-4">
                  <DonutDagilim
                    segmentler={asnler.slice(0, 5).map((a) => ({
                      etiket:
                        a.saglayici.length > 16 ? `${a.saglayici.slice(0, 16)}…` : a.saglayici,
                      deger: a.olay,
                      renk:
                        a.botOran >= 0.6 ? "#dc2626" : a.botOran >= 0.3 ? "#d97706" : "#2f6fed",
                    }))}
                  />
                </div>
                {/* Kompakt liste — bot oranı çipiyle (bar tekrarı yok) */}
                <div className="mt-3 space-y-1.5">
                  {asnler.slice(0, 6).map((a) => {
                    const yuksekBot = a.botOran >= 0.6;
                    return (
                      <div
                        key={a.asn}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas/30 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: yuksekBot ? "#dc2626" : "#2f6fed" }}
                          />
                          <span className="truncate text-[12px] font-medium text-slate-ink">
                            {a.saglayici}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-[11px]">
                          <span className="tabular-nums text-slate-faint">
                            {sayi(a.olay)} {t("dr.cografya.olay")}
                          </span>
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                              yuksekBot
                                ? "bg-danger-soft text-red-700"
                                : "bg-brand-50 text-brand-600",
                            )}
                          >
                            {yuzOran(a.botOran)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </Panel>
    </Bolum>
  );
}

/* ================================================================== 5) Savunma Etkinliği */

function SavunmaBolum({
  t,
  savunma,
  azHareket,
}: {
  t: (k: string) => string;
  savunma: SavunmaEtkinlik;
  azHareket: boolean;
}) {
  const huni = savunma.yakalamaHunisi;
  const asamalar = huni.asamalar ?? [];
  const kurallar = savunma.kuralPerformans ?? [];
  const fp = savunma.falsePozitifRisk;
  const yanit = savunma.ortalamaYanit;
  const fpDurum = savunma.ozet.fpRiskDurumu;
  const fpTon = fpDurum === "yuksek" ? "kirmizi" : fpDurum === "orta" ? "sari" : "yesil";
  const fpEtiket =
    fpDurum === "yuksek"
      ? t("dr.savunma.fpYuksek")
      : fpDurum === "orta"
        ? t("dr.savunma.fpOrta")
        : t("dr.savunma.fpDusuk");
  const yanitYon = yanit.yon === "artis" ? "up" : yanit.yon === "dusus" ? "down" : "flat";

  // Huni renk skalası: en geniş açık brand → en dar koyu.
  const huniRenkler = ["#93b4f5", "#5a8af0", "#2f6fed", "#1e4fc4"];

  return (
    <Bolum azHareket={azHareket} gecikme={0.1}>
      <Panel baslik={<BaslikIkon ikon={ShieldCheck} metin={t("dr.savunma.baslik")} />}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* SOL: yakalama hunisi */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
              <GitBranch className="size-3.5 text-slate-faint" />
              {t("dr.savunma.huni")}
            </div>
            {asamalar.length === 0 ? (
              <div className="grid h-24 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
                {t("dr.savunma.veriYok")}
              </div>
            ) : (
              <div className="space-y-2">
                {asamalar.map((asama, i) => {
                  const genislik = Math.max(6, Math.round(asama.oran * 100));
                  return (
                    <div key={asama.etiket}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="text-slate-muted">{asama.etiket}</span>
                        <span className="tabular-nums text-slate-ink">
                          {sayi(asama.sayi)}{" "}
                          <span className="text-slate-faint">({yuz100(asama.oran * 100)})</span>
                        </span>
                      </div>
                      <div className="h-6 w-full overflow-hidden rounded-lg bg-canvas">
                        <motion.div
                          className="h-full rounded-lg"
                          style={{ background: huniRenkler[i] ?? huniRenkler[huniRenkler.length - 1] }}
                          initial={azHareket ? false : { width: 0 }}
                          animate={{ width: `${genislik}%` }}
                          transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SAĞ */}
          <div className="min-w-0 space-y-5">
            {/* Üst: katman kapsama gauge + fp risk + yanıt */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
                <div className="mb-1 self-start text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                  {t("dr.savunma.kapsama")}
                </div>
                <GaugeGost
                  deger={savunma.katmanKapsama.yuzde}
                  etiket="kapsama"
                  boyut={116}
                  renk={savunma.katmanKapsama.yuzde >= 60 ? "#16a34a" : "#d97706"}
                />
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                  {t("dr.savunma.fpRisk")}
                </div>
                <div className="mt-2">
                  <Badge ton={fpTon}>{fpEtiket}</Badge>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                  {t("dr.savunma.yanit")}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[20px] font-bold leading-none num text-slate-ink">
                    {Math.round(yanit.ortalamaMs)}
                  </span>
                  <span className="text-[11px] text-slate-faint">ms</span>
                </div>
                <div className="mt-1.5">
                  <TrendRozet
                    yon={yanitYon}
                    metin={`${yanit.trendMs > 0 ? "+" : ""}${Math.round(yanit.trendMs)}ms`}
                    iyiYukari={false}
                  />
                </div>
              </div>
            </div>

            {/* Kural performansı — çok-eksenli etkinlik profili + kompakt liste */}
            <div>
              <div className="mb-3 text-[12px] font-medium text-slate-muted">
                {t("dr.savunma.kurallar")}
              </div>
              {kurallar.length === 0 ? (
                <div className="text-[12px] text-slate-faint">{t("dr.savunma.kuralYok")}</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:items-center">
                  {kurallar.length >= 3 ? (
                    <div className="flex justify-center">
                      <RadarGrafik
                        eksenler={kurallar.slice(0, 6).map((k) => ({
                          etiket:
                            k.ruleId.length > 10 ? `${k.ruleId.slice(0, 10)}…` : k.ruleId,
                          deger: k.etkinlik * 100,
                        }))}
                        boyut={190}
                        renk="#2f6fed"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 space-y-1.5">
                    {kurallar.slice(0, 6).map((k) => {
                      const et = k.etkinlik * 100;
                      const er = skorRenk(et);
                      return (
                        <div
                          key={k.ruleId}
                          className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas/30 px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: er }}
                            />
                            <span className="truncate font-mono text-[12px] text-slate-ink">
                              {k.ruleId.length > 20 ? `${k.ruleId.slice(0, 20)}…` : k.ruleId}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-[11px]">
                            <span className="tabular-nums text-slate-faint">
                              {sayi(k.tetiklenme)}
                            </span>
                            <span
                              className="text-[13px] font-bold tabular-nums"
                              style={{ color: er }}
                            >
                              {yuz100(et)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FP uyarısı */}
        {fpDurum === "yuksek" && fp.sayi > 0 && (
          <div className="mt-5">
            <NotKutusu ton="sari">
              {sayi(fp.sayi)} {t("dr.savunma.fpUyari")} ({yuzOran(fp.oran)}).
            </NotKutusu>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}

/* ================================================================== 6) Canlı Nabız */

/** 24 saatlik stacked SVG bar grafik (bot kırmızı / insan mavi). */
function SaatlikBarGrafik({
  seri,
  azHareket,
  hoverBiciimi,
}: {
  seri: CanliNabiz["saatlikSeri"];
  azHareket: boolean;
  hoverBiciimi: (saat: string, toplam: number, bot: number) => string;
}) {
  const max = Math.max(...seri.map((s) => s.toplam), 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 140 }} role="img" aria-label="Son 24 saat olay dağılımı">
      {seri.map((kova, i) => {
        const h = (kova.toplam / max) * 100;
        const botH = kova.toplam > 0 ? (kova.bot / kova.toplam) * 100 : 0;
        const etiketVar = i % 4 === 0;
        return (
          <Tooltip key={i} metin={hoverBiciimi(kova.saat, kova.toplam, kova.bot)} className="flex-1">
            <div className="group flex w-full flex-col justify-end" style={{ height: 140 }}>
              <motion.div
                className="flex w-full flex-col overflow-hidden rounded-[3px] transition-transform duration-200 group-hover:-translate-y-0.5"
                initial={azHareket ? false : { height: 0 }}
                animate={{ height: `${Math.max(h, kova.toplam > 0 ? 3 : 0)}%` }}
                transition={{ duration: 0.6, delay: i * 0.01, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-full shrink-0" style={{ height: `${botH}%`, background: "#dc2626" }} />
                <div className="w-full grow" style={{ background: "#2f6fed" }} />
              </motion.div>
              {etiketVar && (
                <span className="mt-1 block text-center text-[9px] tabular-nums text-slate-faint">
                  {kova.saat.slice(0, 2)}
                </span>
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

function CanliNabizBolum({
  t,
  nabiz,
  azHareket,
}: {
  t: (k: string) => string;
  nabiz: CanliNabiz;
  azHareket: boolean;
}) {
  const seri = nabiz.saatlikSeri ?? [];
  const mom = nabiz.momentum;
  const momYon = mom.yon === "yukseliyor" ? "up" : mom.yon === "dusuyor" ? "down" : "flat";
  const s5 = nabiz.son5dk;

  const verdiktSegmentler = (nabiz.canliVerdiktDagilim ?? [])
    .filter((v) => v.sayi > 0)
    .map((v) => ({
      etiket: VERDICT_ETIKET[v.verdict] ?? v.verdict,
      deger: v.sayi,
      renk:
        v.verdict === "allowed"
          ? "#16a34a"
          : v.verdict === "challenged"
            ? "#d97706"
            : v.verdict === "blocked"
              ? "#dc2626"
              : "#2f6fed",
    }));

  return (
    <Bolum azHareket={azHareket} gecikme={0.05}>
      <Panel
        baslik={<BaslikIkon ikon={Activity} metin={t("dr.nabiz.baslik")} />}
        sagUst={
          <TrendRozet yon={momYon} metin={`${mom.yuzde}%`} iyiYukari={false} />
        }
      >
        {/* son 5 dk canlı şerit */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <span className="relative flex size-2">
                {!azHareket && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-70" />
                )}
                <span className="relative inline-flex size-2 rounded-full bg-ok" />
              </span>
              {t("dr.nabiz.rps")}
            </div>
            <div className="mt-1 text-[22px] font-bold leading-none num text-slate-ink">
              {s5.rps.toFixed(2)}
            </div>
          </div>
          <OzetHap etiket={t("dr.nabiz.son5Olay")} deger={sayi(s5.olay)} />
          <OzetHap etiket={t("dr.nabiz.son5Bot")} deger={sayi(s5.bot)} ton="warn" />
          <OzetHap etiket={t("dr.nabiz.son5Engel")} deger={sayi(s5.engellenen)} ton="danger" />
        </div>

        {/* 24 saatlik seri */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-medium text-slate-muted">{t("dr.nabiz.seri24")}</div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-muted">
                <span className="size-2 rounded-full" style={{ background: "#2f6fed" }} />
                {t("dr.nabiz.insan")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-muted">
                <span className="size-2 rounded-full" style={{ background: "#dc2626" }} />
                {t("dr.nabiz.bot")}
              </span>
            </div>
          </div>
          {seri.length === 0 ? (
            <div className="grid h-32 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
              {t("dr.nabiz.veriYok")}
            </div>
          ) : (
            <SaatlikBarGrafik
              seri={seri}
              azHareket={azHareket}
              hoverBiciimi={(saat, toplam, bot) =>
                `${saat}: ${sayi(toplam)} ${t("dr.nabiz.olay")}, ${sayi(bot)} bot`
              }
            />
          )}
        </div>

        {/* zirve / sakin + verdict dağılım */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                <TrendingUp className="size-3.5 text-red-700" />
                {t("dr.nabiz.zirve")}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold leading-none num text-slate-ink">
                  {nabiz.zirveSaat.saat}
                </span>
                <span className="text-[12px] tabular-nums text-slate-faint">
                  {sayi(nabiz.zirveSaat.toplam)} {t("dr.nabiz.olay")}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                <TrendingDown className="size-3.5 text-green-700" />
                {t("dr.nabiz.sakin")}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold leading-none num text-slate-ink">
                  {nabiz.sakinSaat.saat}
                </span>
                <span className="text-[12px] tabular-nums text-slate-faint">
                  {sayi(nabiz.sakinSaat.toplam)} {t("dr.nabiz.olay")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="mb-2 text-[12px] font-medium text-slate-muted">
              {t("dr.nabiz.verdiktDagilim")}
            </div>
            {verdiktSegmentler.length === 0 ? (
              <div className="text-[12px] text-slate-faint">{t("dr.nabiz.veriYok")}</div>
            ) : (
              <DonutDagilim segmentler={verdiktSegmentler} />
            )}
          </div>
        </div>
      </Panel>
    </Bolum>
  );
}

/* ================================================================== Ana bileşen */

export function DerinlikBolumleri({
  t,
  dil,
  azHareket,
  durus,
  yuzey,
  nabiz,
  cografya,
  savunma,
  aiRadar,
}: {
  t: (k: string) => string;
  dil: Dil;
  azHareket: boolean;
  durus: TehditDurusu;
  yuzey: SaldiriYuzeyi;
  nabiz: CanliNabiz;
  cografya: CografyaIstihbarat;
  savunma: SavunmaEtkinlik;
  aiRadar: AiBotRadar;
}) {
  void dil; // gelecekte lokal biçimlendirme için imzada tutuluyor
  return (
    <div className="space-y-6">
      <TehditDurusuBolum t={t} durus={durus} azHareket={azHareket} />
      <AiRadarBolum t={t} aiRadar={aiRadar} azHareket={azHareket} />
      <SaldiriYuzeyiBolum t={t} yuzey={yuzey} azHareket={azHareket} />
      <CografyaBolum t={t} cografya={cografya} azHareket={azHareket} />
      <SavunmaBolum t={t} savunma={savunma} azHareket={azHareket} />
      <CanliNabizBolum t={t} nabiz={nabiz} azHareket={azHareket} />
    </div>
  );
}
