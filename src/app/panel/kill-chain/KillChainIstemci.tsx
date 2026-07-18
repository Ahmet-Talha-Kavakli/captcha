"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Link2, ShieldCheck, ShieldAlert, Info, ChevronDown,
  Scissors, TrendingDown, Skull, Target, Flame, Route,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { RadarGrafik, Gauge } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  ASAMA_SIRA, ASAMA_META, TEHDIT_RENK,
  type SaldirganZincir, type KillChainOzet, type Asama,
} from "@/lib/specter/kill-chain";
import { killChainCeviri } from "./kill-chain.i18n";

/** Aşama etiketini enum-anahtarına göre çevir (lib'in TR `ad`'ı yerine). */
function asamaAd(asama: Asama, dil: Dil): string {
  return killChainCeviri(`kc.asama.${asama}`, dil);
}
/** Tehdit seviyesi görünen adı (enum değeri düşük/orta/yüksek/kritik anahtar kalır). */
function tehditAd(tehdit: SaldirganZincir["tehdit"], dil: Dil): string {
  return killChainCeviri(`kc.tehdit.${tehdit}`, dil);
}

export function KillChainIstemci({
  dil, zincirler, ozet, olaySayisi,
}: {
  dil: Dil;
  zincirler: SaldirganZincir[];
  ozet: KillChainOzet;
  olaySayisi: number;
}) {
  const t = (k: string) => killChainCeviri(k, dil);
  const azalt = useReducedMotion();
  const bos = zincirler.length === 0;

  // Açıklama gövdesindeki aşama zinciri + vurgu (çevrili).
  const asamaZinciriKisa = ["kesif", "tarama", "silahlanma", "erisim", "somuru", "sizma"]
    .map((a) => t(`kc.asama.${a}`))
    .join(" → ");
  const asamaZinciriTam = ASAMA_SIRA.map((a) => asamaAd(a, dil)).join(" → ");

  // En tehlikeli zincir (liste zaten tehdit puanına göre sıralı → ilki en tehlikeli).
  const enTehlikeli = zincirler[0] ?? null;

  // Radar profili: her aşamaya ulaşan zincir oranı (0-100) — savunma silueti.
  const radarEksenler = ozet.asamaHunisi.map((h) => ({
    etiket: asamaAd(h.asama, dil).slice(0, 8),
    deger: ozet.toplamZincir ? Math.round((h.ulasan / ozet.toplamZincir) * 100) : 0,
  }));

  // Erken kesme skoru (gauge): erken aşama = yüksek skor. ortKesmeSira 1..6, 0=kesme yok.
  // 1 → 100, 6 → ~17. Kesme yoksa 0.
  const erkenKesmeSkoru = ozet.ortKesmeSira > 0
    ? Math.max(0, Math.round((1 - (ozet.ortKesmeSira - 1) / 5) * 100))
    : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Link2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("kc.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("kc.aciklama.govde")
              .replace("{asamalar}", asamaZinciriKisa)
              .replace("{vurgu}", t("kc.aciklama.vurgu"))}
          </p>
        </div>
      </div>

      {bos ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <ShieldCheck className="size-10 text-ok" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("kc.bos.baslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">{t("kc.bos.govde").replace("{n}", String(olaySayisi))}</p>
        </div>
      ) : (
        <>
          {/* özet */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={ozet.toplamZincir} etiket={t("kc.ozet.zincir")} ikon={<Link2 className="size-5" />} tone="brand" />
            <StatKart sayi={`%${ozet.durdurulanOran}`} etiket={t("kc.ozet.durdurulan")} ikon={<Scissors className="size-5" />} tone={ozet.durdurulanOran >= 80 ? "ok" : ozet.durdurulanOran >= 50 ? "warn" : "danger"} />
            <StatKart sayi={ozet.ileriUlasan} etiket={t("kc.ozet.ileri")} ikon={<Skull className="size-5" />} tone={ozet.ileriUlasan === 0 ? "ok" : "danger"} />
            <StatKart sayi={ozet.ortKesmeSira || "—"} etiket={t("kc.ozet.kesme")} ikon={<TrendingDown className="size-5" />} tone={ozet.ortKesmeSira > 0 && ozet.ortKesmeSira <= 3 ? "ok" : "warn"} />
          </div>

          {/* ═══ Daralan aşama hunisi (staged, taper) — görsel dil: MITRE funnel ═══ */}
          <Panel baslik={t("kc.huni.baslik")}>
            <p className="mb-5 text-[13px] text-slate-muted">{t("kc.huni.aciklama")}</p>
            <div className="flex flex-col items-center gap-1.5">
              {ozet.asamaHunisi.map((h, i) => {
                const meta = ASAMA_META[h.asama];
                const maxUlasan = ozet.asamaHunisi[0]?.ulasan || 1;
                const oran = (h.ulasan / maxUlasan) * 100;
                // Daralma: her katman biraz daha dar (min %26 genişlik, taper hissi).
                const genislik = Math.max(26, oran);
                const kesmeOran = h.ulasan > 0 ? Math.round((h.kesilen / h.ulasan) * 100) : 0;
                return (
                  <motion.div
                    key={h.asama}
                    initial={azalt ? false : { y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                    style={{ maxWidth: `${genislik}%` }}
                  >
                    <div
                      className="group relative flex h-14 items-center justify-between gap-3 overflow-hidden rounded-xl px-4"
                      style={{
                        background: `linear-gradient(90deg, ${meta.renk}1f, ${meta.renk}0d)`,
                        boxShadow: `inset 0 0 0 1px ${meta.renk}33`,
                      }}
                    >
                      <span className="absolute left-0 top-0 h-full w-1" style={{ background: meta.renk }} />
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
                          style={{ background: meta.renk }}
                        >
                          {meta.sira}
                        </span>
                        <span className="truncate text-[13px] font-semibold text-slate-ink">{asamaAd(h.asama, dil)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {h.kesilen > 0 && (
                          <span className="hidden items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[10.5px] font-semibold text-ok sm:inline-flex">
                            <Scissors className="size-3" /> {kesmeOran}%
                          </span>
                        )}
                        <span className="num text-[16px] font-bold" style={{ color: meta.renk }}>{h.ulasan}</span>
                      </div>
                    </div>
                    {/* aşama başına kesme oranı — ince taban şerit */}
                    {h.kesilen > 0 && (
                      <div className="mx-4 mt-0.5 h-1 overflow-hidden rounded-full bg-canvas">
                        <motion.div
                          className="h-full rounded-full bg-ok"
                          initial={azalt ? false : { width: 0 }}
                          animate={{ width: `${kesmeOran}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-slate-faint">{t("kc.huni.dipnot").replace("{sira}", asamaZinciriTam)}</p>
          </Panel>

          {/* ═══ Savunma silueti (radar) + Erken kesme skoru (gauge) ═══ */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel baslik={t("kc.radar.baslik")}>
              <p className="mb-2 text-[13px] text-slate-muted">{t("kc.radar.aciklama")}</p>
              <div className="flex items-center justify-center py-2">
                <RadarGrafik eksenler={radarEksenler} boyut={230} renk="#dc2626" />
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 text-[11.5px] text-slate-faint">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: "#dc262633", boxShadow: "inset 0 0 0 1.5px #dc2626" }} />
                  {t("kc.radar.lejant")}
                </span>
              </div>
            </Panel>

            <Panel baslik={t("kc.gauge.baslik")}>
              <p className="mb-2 text-[13px] text-slate-muted">{t("kc.gauge.aciklama")}</p>
              <div className="flex flex-col items-center gap-3 py-3">
                <Gauge deger={erkenKesmeSkoru} etiket={t("kc.gauge.skor")} boyut={220} />
                <div className="grid w-full grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2.5 text-center">
                    <div className="num text-[19px] font-bold text-ok">{ozet.durdurulan}</div>
                    <div className="text-[11px] text-slate-muted">{t("kc.gauge.kesilen")}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2.5 text-center">
                    <div className={cn("num text-[19px] font-bold", ozet.ileriUlasan ? "text-danger2" : "text-slate-ink")}>{ozet.toplamZincir - ozet.durdurulan}</div>
                    <div className="text-[11px] text-slate-muted">{t("kc.gauge.gecen")}</div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* ═══ MITRE-tarzı aşama kartları ═══ */}
          <Panel baslik={t("kc.matris.baslik")}>
            <p className="mb-4 text-[13px] text-slate-muted">{t("kc.matris.aciklama")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ASAMA_SIRA.map((asama, i) => {
                const meta = ASAMA_META[asama];
                const h = ozet.asamaHunisi.find((x) => x.asama === asama);
                const ulasan = h?.ulasan ?? 0;
                const kesilen = h?.kesilen ?? 0;
                const acik = ozet.toplamZincir ? Math.round((ulasan / ozet.toplamZincir) * 100) : 0;
                return (
                  <motion.div
                    key={asama}
                    initial={azalt ? false : { y: 12 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4"
                    style={{ boxShadow: `inset 3px 0 0 ${meta.renk}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white"
                          style={{ background: meta.renk }}
                        >
                          {meta.sira}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-semibold text-slate-ink">{asamaAd(asama, dil)}</div>
                          <div className="text-[10.5px] uppercase tracking-wide text-slate-faint">{t("kc.matris.taktik")}</div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 min-h-[32px] text-[11.5px] leading-relaxed text-slate-muted">{meta.aciklama}</p>
                    {/* ulaşan / kesilen mini istatistik */}
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="flex items-center gap-1.5 text-[11.5px]">
                        <Target className="size-3.5 text-slate-faint" />
                        <span className="num font-bold text-slate-ink">{ulasan}</span>
                        <span className="text-slate-faint">{t("kc.matris.ulasan")}</span>
                      </span>
                      {kesilen > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[10.5px] font-semibold text-ok">
                          <Scissors className="size-3" /> {kesilen}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-slate-faint">—</span>
                      )}
                    </div>
                    {/* yoğunluk şeridi */}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: meta.renk }}
                        initial={azalt ? false : { width: 0 }}
                        animate={{ width: `${Math.max(acik, 3)}%` }}
                        transition={{ duration: 0.6, delay: 0.15 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Panel>

          {/* ═══ En tehlikeli zincir — dikey timeline örneği ═══ */}
          {enTehlikeli && (
            <Panel baslik={t("kc.timeline.baslik")}>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/40 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger2">
                  <Flame className="size-[18px]" />
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Ulke kod={enTehlikeli.country} />
                  <span className="num text-[14px] font-semibold text-slate-ink">{enTehlikeli.ip}</span>
                  <Badge ton={enTehlikeli.tehdit === "kritik" || enTehlikeli.tehdit === "yüksek" ? "kirmizi" : enTehlikeli.tehdit === "orta" ? "sari" : "yesil"}>{tehditAd(enTehlikeli.tehdit, dil)}</Badge>
                  <span className="text-[12px] text-slate-muted">{t("kc.timeline.adim").replace("{n}", String(enTehlikeli.olaySayisi))}</span>
                </div>
              </div>
              <ol className="relative ml-2 space-y-3 border-l-2 border-line pl-6">
                {enTehlikeli.adimlar.map((a, i) => {
                  const meta = ASAMA_META[a.asama];
                  return (
                    <motion.li
                      key={i}
                      initial={azalt ? false : { y: 8 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
                      className="relative"
                    >
                      {/* düğüm */}
                      <span
                        className="absolute -left-[31px] top-0.5 grid size-5 place-items-center rounded-full ring-4 ring-surface"
                        style={{ background: a.kesildi ? "#16a34a" : meta.renk }}
                      >
                        {a.kesildi
                          ? <Scissors className="size-3 text-white" />
                          : <span className="size-1.5 rounded-full bg-white" />}
                      </span>
                      <div className={cn(
                        "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border px-3 py-2",
                        a.kesildi ? "border-ok/30 bg-ok-soft/40" : "border-line bg-surface",
                      )}>
                        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-ink">
                          <span className="size-2 rounded-full" style={{ background: meta.renk }} />
                          {asamaAd(a.asama, dil)}
                        </span>
                        <span className="num min-w-0 flex-1 truncate text-[11.5px] text-slate-muted">{a.path}</span>
                        <span className="text-[10.5px] text-slate-faint">{a.botClass}</span>
                        <Badge ton={a.verdict === "blocked" ? "kirmizi" : a.verdict === "challenged" ? "sari" : "gri"}>{a.verdict}</Badge>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
              <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-slate-faint">
                <Route className="size-3.5" /> {t("kc.timeline.dipnot")}
              </p>
            </Panel>
          )}

          {/* saldırgan zincirleri */}
          <Panel baslik={t("kc.zincirler.baslik").replace("{n}", String(zincirler.length))}>
            <div className="space-y-2.5">
              {zincirler.map((z) => <ZincirKart key={z.ip} z={z} dil={dil} />)}
            </div>
          </Panel>
        </>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("kc.yontem")}</span>
      </div>
    </div>
  );
}

function ZincirKart({ z, dil }: { z: SaldirganZincir; dil: Dil }) {
  const t = (k: string) => killChainCeviri(k, dil);
  const [acik, setAcik] = useState(false);
  const renk = TEHDIT_RENK[z.tehdit];

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3" style={{ borderLeftWidth: 3, borderLeftColor: renk }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Ulke kod={z.country} />
          <span className="num text-[13.5px] font-semibold text-slate-ink">{z.ip}</span>
          <span className="hidden text-[11.5px] text-slate-faint sm:inline">{z.asn}</span>
          <Badge ton={z.tehdit === "kritik" ? "kirmizi" : z.tehdit === "yüksek" ? "kirmizi" : z.tehdit === "orta" ? "sari" : "yesil"}>{tehditAd(z.tehdit, dil)}</Badge>
          {z.durduruldu
            ? <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ok"><Scissors className="size-3" /> {z.kesilenAsama ? asamaAd(z.kesilenAsama, dil) : ""}{t("kc.kart.kesildiEk")}</span>
            : <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-danger2"><ShieldAlert className="size-3" /> {t("kc.kart.durdurulmadi")}</span>}
        </div>
        <button onClick={() => setAcik((v) => !v)} className="flex items-center gap-1 text-[12px] text-slate-muted hover:text-slate-ink">
          {t("kc.kart.adim").replace("{n}", String(z.olaySayisi))} <ChevronDown className={cn("size-4 transition", acik && "rotate-180")} />
        </button>
      </div>

      {/* aşama ilerleme şeridi */}
      <div className="mt-2.5 flex items-center gap-1">
        {ASAMA_SIRA.map((asama) => {
          const meta = ASAMA_META[asama];
          const ulasti = z.ilerlemeSira >= meta.sira;
          const burdaKesildi = z.kesilenAsama === asama;
          return (
            <div key={asama} className="flex flex-1 items-center gap-1" title={`${asamaAd(asama, dil)}${ulasti ? ` (${t("kc.kart.ulasildi")})` : ""}${burdaKesildi ? ` — ${t("kc.kart.burdaKesildi")}` : ""}`}>
              <div
                className="h-1.5 flex-1 rounded-full"
                style={{ background: ulasti ? meta.renk : "#e6e1d5", opacity: ulasti ? 1 : 0.5 }}
              />
              {burdaKesildi && <Scissors className="size-3 shrink-0 text-ok" />}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9.5px] uppercase tracking-wide text-slate-faint">
        {ASAMA_SIRA.map((a) => <span key={a} className="flex-1 text-center">{asamaAd(a, dil).slice(0, 4)}</span>)}
      </div>

      {acik && (
        <div className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
          {z.adimlar.map((a, i) => {
            const meta = ASAMA_META[a.asama];
            return (
              <div key={i} className="flex items-center gap-2.5 text-[12px]">
                <span className="num w-5 text-right text-slate-faint">{i + 1}</span>
                <span className="flex w-24 shrink-0 items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: meta.renk }} />
                  <span className="font-medium text-slate-ink">{asamaAd(a.asama, dil)}</span>
                </span>
                <span className="num min-w-0 flex-1 truncate text-slate-muted">{a.path}</span>
                <span className="text-[11px] text-slate-faint">{a.botClass}</span>
                <Badge ton={a.verdict === "blocked" ? "kirmizi" : a.verdict === "challenged" ? "sari" : "gri"}>{a.verdict}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
