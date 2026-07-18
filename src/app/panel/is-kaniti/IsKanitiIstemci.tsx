"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Cpu, ShieldCheck, Gauge, Info, ScrollText, Hammer, BadgeCheck,
  User, Bot, Zap, TrendingUp, ArrowRight,
} from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme, Tooltip } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  powZorluk, powEkonomi,
  type DagilimRaporu, type ZorlukKatman,
} from "@/lib/specter/proof-of-work";
import { isKanitiCeviri } from "./is-kaniti.i18n";

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Katman → StatKart/DurumRozeti tonu (kit tonlarına eşle). */
const KATMAN_TON: Record<ZorlukKatman, "ok" | "warn" | "danger" | "brand"> = {
  insan: "ok",
  supheli: "warn",
  muhtemel_bot: "danger",
  bot: "danger",
};

/** Katman → çubuk zemin rengi. */
const KATMAN_BAR: Record<ZorlukKatman, string> = {
  insan: "bg-ok",
  supheli: "bg-warn",
  muhtemel_bot: "bg-danger2",
  bot: "bg-danger2",
};

const KATMAN_ILERLEME: Record<ZorlukKatman, "ok" | "warn" | "danger" | "brand"> = {
  insan: "ok",
  supheli: "warn",
  muhtemel_bot: "danger",
  bot: "danger",
};

export function IsKanitiIstemci({ rapor, olaySayisi, dil }: { rapor: DagilimRaporu; olaySayisi: number; dil: Dil }) {
  const azalt = useReducedMotion();
  const t = (k: string) => isKanitiCeviri(k, dil);
  const loc = BCP47[dil];
  const sayi = (n: number) => n.toLocaleString(loc);
  const ondalik = (n: number, d = 2) => n.toLocaleString(loc, { maximumFractionDigits: d });
  const yuzdeStr = (n: number) => n.toLocaleString(loc, { maximumFractionDigits: 1 });

  const bos = rapor.toplamOlay === 0;
  const enBuyukOlay = Math.max(1, ...rapor.katmanlar.map((k) => k.olaySayisi));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Cpu className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("pow.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("pow.serit.aciklama") }} />
        </div>
      </div>

      {bos ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <Cpu className="size-10 text-slate-faint" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("pow.bos.baslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">{t("pow.bos.aciklama").replace("{n}", sayi(olaySayisi))}</p>
        </div>
      ) : (
        <>
          {/* özet kartlar */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={sayi(rapor.toplamOlay)} etiket={t("pow.kpi.toplamOlay")} ikon={<Cpu className="size-5" />} tone="brand" />
            <StatKart sayi={sayi(rapor.supheliOlay)} etiket={t("pow.kpi.supheli")} ikon={<ShieldCheck className="size-5" />} tone={rapor.supheliOlay > 0 ? "warn" : "ok"} />
            <StatKart sayi={ondalik(rapor.ortHedefBit, 1)} etiket={t("pow.kpi.ortBit")} ikon={<Gauge className="size-5" />} tone="brand" />
            <StatKart sayi={ondalik(rapor.toplamSaatMaliyet, 3)} etiket={t("pow.kpi.toplamMaliyet")} ikon={<TrendingUp className="size-5" />} tone="ok" />
          </div>

          {/* adaptif zorluk dağılımı */}
          <Panel baslik={t("pow.dagilim.baslik")}>
            <p className="mb-4 text-[13px] text-slate-muted">{t("pow.dagilim.aciklama")}</p>
            <div className="space-y-3">
              {rapor.katmanlar.map((k, i) => (
                <motion.div
                  key={k.katman}
                  initial={azalt ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-2xl border border-line bg-surface px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", KATMAN_BAR[k.katman])} />
                      <span className="text-[14px] font-semibold text-slate-ink">{t(`pow.katman.${k.katman}`)}</span>
                      <Badge ton={KATMAN_TON[k.katman] === "ok" ? "yesil" : KATMAN_TON[k.katman] === "warn" ? "sari" : "kirmizi"}>
                        {k.hedefBit} {t("pow.dagilim.bit")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-slate-muted">
                      <span><span className="num font-semibold text-slate-ink">{sayi(k.olaySayisi)}</span> {t("pow.dagilim.olay")} · <span className="num">{yuzdeStr(k.yuzde)}%</span></span>
                      <Tooltip metin={`${ondalik(k.saatMaliyet, 4)} ${t("pow.dagilim.saat")}`}>
                        <span className="num font-medium text-slate-ink">{ondalik(k.saatMaliyet, 3)} {t("pow.dagilim.saat")}</span>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <Ilerleme deger={(k.olaySayisi / enBuyukOlay) * 100} ton={KATMAN_ILERLEME[k.katman]} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Panel>

          {/* adaptif açıklayıcı + ekonomi simülatörü yan yana */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AdaptifAciklayici t={t} sayi={sayi} ondalik={ondalik} />
            <EkonomiSimulator t={t} sayi={sayi} ondalik={ondalik} />
          </div>

          {/* nasıl çalışır boru hattı */}
          <NasilCalisir t={t} azalt={!!azalt} />

          {/* insan vs bot kontrastı */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ok/25 bg-ok-soft/40 px-5 py-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-green-700"><User className="size-4" /> {t("pow.kontrast.insan.baslik")}</div>
              <p className="mt-2 text-[13px] text-slate-muted">{t("pow.kontrast.insan.aciklama")}</p>
            </div>
            <div className="rounded-2xl border border-danger2/25 bg-danger-soft/30 px-5 py-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-red-700"><Bot className="size-4" /> {t("pow.kontrast.bot.baslik")}</div>
              <p className="mt-2 text-[13px] text-slate-muted">{t("pow.kontrast.bot.aciklama")}</p>
            </div>
          </div>
        </>
      )}

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("pow.not").replace("{n}", sayi(olaySayisi)) }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Adaptif açıklayıcı */
function AdaptifAciklayici({
  t, sayi, ondalik,
}: {
  t: (k: string) => string; sayi: (n: number) => string; ondalik: (n: number, d?: number) => string;
}) {
  // Skor eksenine göre örnek satırlar (skor yüksek = insan).
  const satirlar = [1.0, 0.7, 0.4, 0.1, 0.0].map((skor) => {
    const z = powZorluk(1 - skor);
    return { skor, z };
  });
  return (
    <Panel baslik={t("pow.adaptif.baslik")}>
      <p className="mb-4 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("pow.adaptif.aciklama") }} />
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-slate-faint">
              <th className="pb-2 font-medium">{t("pow.adaptif.insanlik")}</th>
              <th className="pb-2 text-right font-medium">{t("pow.adaptif.hedefBit")}</th>
              <th className="pb-2 text-right font-medium">{t("pow.adaptif.gecikme")}</th>
              <th className="pb-2 text-right font-medium">{t("pow.adaptif.botKat")}</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map(({ skor, z }) => (
              <tr key={skor} className="border-t border-line/60">
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", KATMAN_BAR[z.katman])} />
                    <span className="num font-medium text-slate-ink">{ondalik(skor, 2)}</span>
                  </span>
                </td>
                <td className="num py-2 text-right font-semibold text-slate-ink">{z.hedefBit}</td>
                <td className="num py-2 text-right text-slate-muted">{ondalik(z.insanGecikmeMs, 0)} ms</td>
                <td className="num py-2 text-right font-medium text-brand-700">{sayi(z.botMaliyetKat)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Ekonomi simülatörü */
function EkonomiSimulator({
  t, sayi, ondalik,
}: {
  t: (k: string) => string; sayi: (n: number) => string; ondalik: (n: number, d?: number) => string;
}) {
  // Log-ölçekli hacim adımları (1K → 100M) ve bit adımları (16 → 26).
  const HACIMLER = [1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000];
  const [hacimIdx, setHacimIdx] = useState(3); // 1M
  const [bit, setBit] = useState(20);

  const hacim = HACIMLER[hacimIdx];
  const eko = useMemo(() => powEkonomi(bit, hacim), [bit, hacim]);
  const caydirici = eko.caydiricilikKat >= 100_000;

  return (
    <Panel baslik={t("pow.sim.baslik")}>
      <p className="mb-4 text-[13px] text-slate-muted">{t("pow.sim.aciklama")}</p>

      {/* hacim slider */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
          <span className="font-medium text-slate-muted">{t("pow.sim.hacim")}</span>
          <span className="num font-semibold text-slate-ink">{sayi(hacim)}</span>
        </div>
        <input
          type="range" min={0} max={HACIMLER.length - 1} step={1} value={hacimIdx}
          onChange={(e) => setHacimIdx(Number(e.target.value))}
          className="w-full accent-brand-600"
          aria-label={t("pow.sim.hacim")}
        />
      </div>

      {/* zorluk slider */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
          <span className="font-medium text-slate-muted">{t("pow.sim.zorluk")}</span>
          <span className="num font-semibold text-slate-ink">{bit} {t("pow.dagilim.bit")}</span>
        </div>
        <input
          type="range" min={16} max={26} step={1} value={bit}
          onChange={(e) => setBit(Number(e.target.value))}
          className="w-full accent-brand-600"
          aria-label={t("pow.sim.zorluk")}
        />
      </div>

      {/* sonuç kartları */}
      <div className="grid grid-cols-2 gap-3">
        <SimHucre etiket={t("pow.sim.insanMaliyet")} deger={`${ondalik(eko.insanMaliyetSn, 3)} ${t("pow.sim.saniye")}`} ton="ok" ikon={<User className="size-4" />} />
        <SimHucre etiket={t("pow.sim.botSaat")} deger={`${ondalik(eko.botToplamSaatMaliyet, 2)} ${t("pow.sim.saat")}`} ton="danger" ikon={<Bot className="size-4" />} />
        <SimHucre etiket={t("pow.sim.engel")} deger={`${sayi(eko.saldiriEngeli)}${t("pow.sim.kat")}`} ton="warn" ikon={<Zap className="size-4" />} />
        <SimHucre etiket={t("pow.sim.caydiricilik")} deger={`${sayi(eko.caydiricilikKat)}${t("pow.sim.kat")}`} ton="brand" ikon={<ShieldCheck className="size-4" />} />
      </div>

      <div className={cn("mt-4 rounded-xl px-4 py-3 text-[12.5px]", caydirici ? "bg-ok-soft/50 text-green-800" : "bg-warn-soft/40 text-amber-800")}>
        <span dangerouslySetInnerHTML={{ __html: caydirici ? t("pow.sim.sonuc.caydirici") : t("pow.sim.sonuc.hafif") }} />
      </div>
    </Panel>
  );
}

function SimHucre({ etiket, deger, ton, ikon }: { etiket: string; deger: string; ton: "ok" | "danger" | "warn" | "brand"; ikon: React.ReactNode }) {
  const renk = ton === "ok" ? "text-ok" : ton === "danger" ? "text-danger2" : ton === "warn" ? "text-warn" : "text-brand-700";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className={cn("flex items-center gap-1.5 text-[11.5px] font-medium", renk)}>{ikon}<span className="text-slate-muted">{etiket}</span></div>
      <div className={cn("num mt-1.5 text-[19px] font-bold leading-none", renk)}>{deger}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Nasıl çalışır boru hattı */
function NasilCalisir({ t, azalt }: { t: (k: string) => string; azalt: boolean }) {
  const adimlar = [
    { ad: t("pow.nasil.adim1.ad"), aciklama: t("pow.nasil.adim1.aciklama"), ikon: <ScrollText className="size-5" /> },
    { ad: t("pow.nasil.adim2.ad"), aciklama: t("pow.nasil.adim2.aciklama"), ikon: <Hammer className="size-5" /> },
    { ad: t("pow.nasil.adim3.ad"), aciklama: t("pow.nasil.adim3.aciklama"), ikon: <BadgeCheck className="size-5" /> },
  ];
  return (
    <Panel baslik={t("pow.nasil.baslik")}>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
        {adimlar.map((a, i) => (
          <div key={a.ad} className="contents">
            <motion.div
              initial={azalt ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="rounded-2xl border border-line bg-canvas/30 px-4 py-4"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{a.ikon}</span>
              <p className="mt-3 text-[14px] font-semibold text-slate-ink">{a.ad}</p>
              <p className="mt-1 text-[12.5px] text-slate-muted">{a.aciklama}</p>
            </motion.div>
            {i < adimlar.length - 1 && (
              <div className="hidden items-center justify-center sm:flex">
                <ArrowRight className="size-5 text-slate-faint" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
