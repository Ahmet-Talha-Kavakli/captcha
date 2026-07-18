"use client";

/**
 * Otonom Savunma Orkestratörü — İstemci Görünümü
 * ==============================================
 * Platformun SOAR beyni: birden çok tespit motorunun çıktısını füzyonlayıp TEK
 * savunma duruşu + öncelikli otonom aksiyon planı gösterir.
 *
 * NAMUSLU: Bu bir KARAR-DESTEK önerisidir. Aksiyonlar üretim ortamında otomatik
 * uygulanmaz; "hepsini uygula (simüle)" yalnızca oturum-yerel bir kuyruk işaretler.
 *
 * ÇOK DİLLİLİK: Tüm kullanıcı-görünür metin `orkestra.i18n.ts` üzerinden etkin
 * dile çevrilir; enum (duruş/aciliyet/niyet) ve id değerleri asla çevrilmez.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit, ShieldCheck, ShieldAlert, ShieldX, Zap, ArrowRight,
  CheckCircle2, Circle, Bot, Hand, Info, Radar, ListChecks,
} from "lucide-react";
import Link from "next/link";
import { Panel, Badge, DurumRozeti, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  DURUS_META, type Durus, type Aciliyet, type OrkestraSonuc,
} from "./orkestra";
import {
  orkestraCeviri, durusAd, durusAcik, aciliyetAd, sinyalAd,
  katkiOzet, aksiyonBaslik, aksiyonMetin, aksiyonDayanak, gerekceMetin, baskinNiyetAd,
} from "./orkestra.i18n";

/* ------------------------------------------------------------------ Props */

interface Ozet {
  saldirgan: number;
  baskinNiyet: string | null;
  zincir: number;
  ileriUlasan: number;
  durdurmaOran: number;
  kritikIp: number;
  engellenmeli: number;
  caydirilanSinif: number;
  toplamSinif: number;
  uyariBaslik: string;
  uyariSiddet: string;
  trend: string;
}

interface Props {
  sonuc: OrkestraSonuc;
  toplamOlay: number;
  ozet: Ozet;
  dil: Dil;
}

/* ------------------------------------------------------------------ Renk yardımcıları */

const ACILIYET_TON: Record<Aciliyet, { ton: "kirmizi" | "sari" | "brand" | "gri"; renk: string }> = {
  kritik: { ton: "kirmizi", renk: "#dc2626" },
  yüksek: { ton: "kirmizi", renk: "#ea580c" },
  orta: { ton: "sari", renk: "#d97706" },
  düşük: { ton: "gri", renk: "#64748b" },
};

const DURUS_IKON: Record<Durus, typeof ShieldCheck> = {
  normal: ShieldCheck,
  yükseltilmiş: ShieldAlert,
  savunma: ShieldAlert,
  kilit: ShieldX,
};

/* ------------------------------------------------------------------ Duruş kadranı (SVG) */

function DurusKadrani({ skor, durus, dil }: { skor: number; durus: Durus; dil: Dil }) {
  const meta = DURUS_META[durus];
  // Yarım daire gösterge (180°). skor 0-100 → 0-180°.
  const R = 90;
  const cx = 110;
  const cy = 110;
  const aci = (skor / 100) * 180; // derece
  const rad = (deg: number) => (deg - 180) * (Math.PI / 180);
  const uc = { x: cx + R * Math.cos(rad(aci)), y: cy + R * Math.sin(rad(aci)) };
  const bas = { x: cx - R, y: cy };
  // Yay path (büyük yay değil).
  const arc = (deg: number) => {
    const p = { x: cx + R * Math.cos(rad(deg)), y: cy + R * Math.sin(rad(deg)) };
    return p;
  };
  const p0 = arc(0);
  const p180 = arc(180);

  // Tırmanma segment renkleri (4 dilim).
  const dilimler = [
    { d: "M20,110 A90,90 0 0 1 45.5,47", renk: "#16a34a" },
    { d: "M45.5,47 A90,90 0 0 1 110,20", renk: "#d97706" },
    { d: "M110,20 A90,90 0 0 1 174.5,47", renk: "#ea580c" },
    { d: "M174.5,47 A90,90 0 0 1 200,110", renk: "#dc2626" },
  ];

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-[280px]">
        {/* zemin yay */}
        <path d={`M${p180.x},${p180.y} A${R},${R} 0 0 1 ${p0.x},${p0.y}`} fill="none" stroke="var(--color-canvas, #eef1f6)" strokeWidth="16" strokeLinecap="round" />
        {/* renkli dilimler */}
        {dilimler.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.renk} strokeWidth="16" strokeLinecap="round" opacity={0.28} />
        ))}
        {/* aktif değer yayı */}
        <motion.path
          d={`M${bas.x},${bas.y} A${R},${R} 0 ${aci > 180 ? 1 : 0} 1 ${uc.x},${uc.y}`}
          fill="none" stroke={meta.renk} strokeWidth="16" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
        />
        {/* iğne */}
        <motion.line
          x1={cx} y1={cy} x2={uc.x} y2={uc.y}
          stroke={meta.renk} strokeWidth="3" strokeLinecap="round"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        />
        <circle cx={cx} cy={cy} r="6" fill={meta.renk} />
      </svg>
      <div className="-mt-6 text-center">
        <div className="num text-[44px] font-bold leading-none" style={{ color: meta.renk }}>{skor}</div>
        <div className="mt-0.5 text-xs font-medium text-slate-faint">{orkestraCeviri("o.tehditBasinci", dil)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Duruş merdiveni */

function DurusMerdiveni({ durus, dil }: { durus: Durus; dil: Dil }) {
  const sira = DURUS_META[durus].sira;
  const adimlar: Durus[] = ["normal", "yükseltilmiş", "savunma", "kilit"];
  return (
    <div className="flex items-center gap-1.5">
      {adimlar.map((d) => {
        const m = DURUS_META[d];
        const aktif = m.sira <= sira;
        const secili = m.sira === sira;
        return (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn("h-2 w-full rounded-full transition-all", secili && "ring-2 ring-offset-1")}
              style={{
                background: aktif ? m.renk : "var(--color-canvas, #eef1f6)",
                // @ts-expect-error css var
                "--tw-ring-color": m.renk,
              }}
            />
            <span className={cn("text-[10px] font-medium", secili ? "text-slate-ink" : "text-slate-faint")}>{durusAd(d, dil)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Sinyal füzyon radarı (SVG) */

function FuzyonRadari({ katkilar, dil }: { katkilar: OrkestraSonuc["katkilar"]; dil: Dil }) {
  const n = katkilar.length;
  const cx = 150, cy = 150, R = 110;
  const nokta = (i: number, r: number) => {
    const aci = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(aci), y: cy + r * Math.sin(aci) };
  };
  // Değer poligonu (puan 0-100 → 0-R).
  const poly = katkilar.map((k, i) => {
    const p = nokta(i, (k.puan / 100) * R);
    return `${p.x},${p.y}`;
  }).join(" ");
  const halkalar = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[320px]">
        {/* halkalar */}
        {halkalar.map((h, hi) => (
          <polygon
            key={hi}
            points={katkilar.map((_, i) => { const p = nokta(i, h * R); return `${p.x},${p.y}`; }).join(" ")}
            fill="none" stroke="var(--color-line, #e2e8f0)" strokeWidth="1"
          />
        ))}
        {/* eksenler */}
        {katkilar.map((_, i) => {
          const p = nokta(i, R);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-line, #e2e8f0)" strokeWidth="1" />;
        })}
        {/* değer poligonu */}
        <motion.polygon
          points={poly}
          fill="#4a41e8" fillOpacity={0.15} stroke="#4a41e8" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: "150px 150px" }} transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {/* düğümler + etiketler */}
        {katkilar.map((k, i) => {
          const p = nokta(i, (k.puan / 100) * R);
          const et = nokta(i, R + 4);
          const ortala = Math.abs(et.x - cx) < 10;
          const anchor = ortala ? "middle" : et.x > cx ? "start" : "end";
          const etiket = sinyalAd(k.anahtar, dil);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill={k.aktif ? "#4a41e8" : "#94a3b8"} />
              <text
                x={et.x} y={et.y} textAnchor={anchor as "middle" | "start" | "end"}
                dominantBaseline={et.y < cy ? "auto" : "hanging"}
                className="fill-slate-muted text-[9px] font-medium"
              >
                {etiket.length > 14 ? etiket.split(" ")[0] : etiket}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */

export function OrkestratorIstemci({ sonuc, toplamOlay, ozet, dil }: Props) {
  const t = (k: string) => orkestraCeviri(k, dil);
  const meta = DURUS_META[sonuc.durus];
  const DurusIkon = DURUS_IKON[sonuc.durus];

  // Oturum-yerel aksiyon kuyruğu (üretime uygulanmaz — namuslu etiket).
  const [kuyruk, setKuyruk] = useState<Set<number>>(new Set());
  const tumKuyrukta = kuyruk.size === sonuc.aksiyonlar.length && sonuc.aksiyonlar.length > 0;

  const kuyrukAltUst = (sira: number) =>
    setKuyruk((p) => {
      const y = new Set(p);
      y.has(sira) ? y.delete(sira) : y.add(sira);
      return y;
    });

  const hepsiniKuyrukla = () =>
    setKuyruk(tumKuyrukta ? new Set() : new Set(sonuc.aksiyonlar.map((a) => a.sira)));

  const otomatikSayi = useMemo(() => sonuc.aksiyonlar.filter((a) => a.otomatik).length, [sonuc.aksiyonlar]);

  const durusAdi = durusAd(sonuc.durus, dil);
  const baskinNiyet = baskinNiyetAd(ozet.baskinNiyet, dil);

  return (
    <div className="space-y-6">
      {/* Namusluluk şeridi */}
      <NotKutusu ton="bilgi" baslik={t("o.namus.baslik")}>
        <span dangerouslySetInnerHTML={{ __html: t("o.namus.metin") }} />
      </NotKutusu>

      {/* Üst: duruş kadranı + gerekçe */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel baslik={t("o.oneriDurus")} sagUst={<DurumRozeti ton={sonuc.durus === "normal" ? "ok" : sonuc.durus === "kilit" ? "danger" : "warn"} etiket={durusAdi} nabiz={sonuc.durus !== "normal"} />}>
          <DurusKadrani skor={sonuc.durusSkoru} durus={sonuc.durus} dil={dil} />
          <div className="mt-4">
            <DurusMerdiveni durus={sonuc.durus} dil={dil} />
          </div>
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3"
            style={{ borderColor: `${meta.renk}33`, background: `${meta.renk}0d` }}
          >
            <DurusIkon className="size-6 shrink-0" style={{ color: meta.renk }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: meta.renk }}>{t("o.durusEtiket").replace("{ad}", durusAdi)}</div>
              <div className="text-[13px] text-slate-muted">{durusAcik(sonuc.durus, dil)}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
            <span className="text-[13px] font-medium text-slate-muted">{t("o.fuzyonGuveni")}</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-white ring-1 ring-line">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${sonuc.guven}%` }} />
              </div>
              <span className="num text-sm font-semibold text-slate-ink">%{sonuc.guven}</span>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          {/* Neden bu duruş */}
          <Panel baslik={t("o.nedenDurus")} sagUst={<Badge ton="brand"><BrainCircuit className="size-3" /> {t("o.fuzyonGerekcesi")}</Badge>}>
            <p className="text-[15px] leading-relaxed text-slate-ink">{gerekceMetin(sonuc.gerekceVeri, sonuc.katkilar, dil)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <MiniOlcut etiket={t("o.mini.saldirgan")} deger={ozet.saldirgan} alt={baskinNiyet ? t("o.mini.saldirgan.niyet").replace("{ad}", baskinNiyet) : t("o.mini.saldirgan.yok")} />
              <MiniOlcut etiket={t("o.mini.killChain")} deger={ozet.zincir} alt={t("o.mini.killChain.alt").replace("{ileri}", String(ozet.ileriUlasan)).replace("{durdurma}", String(Math.round(ozet.durdurmaOran)))} />
              <MiniOlcut etiket={t("o.mini.kritikIp")} deger={ozet.kritikIp} alt={t("o.mini.kritikIp.alt").replace("{n}", String(ozet.engellenmeli))} />
              <MiniOlcut etiket={t("o.mini.caydirilan")} deger={`${ozet.caydirilanSinif}/${ozet.toplamSinif}`} alt={t("o.mini.caydirilan.alt")} />
              <MiniOlcut etiket={t("o.mini.trend")} deger={orkestraCeviri(`trend.${ozet.trend}`, dil)} alt={ozet.uyariBaslik} />
              <MiniOlcut etiket={t("o.mini.olay")} deger={toplamOlay} alt={t("o.mini.olay.alt")} />
            </div>
          </Panel>

          {/* Sinyal füzyonu */}
          <Panel baslik={t("o.sinyalFuzyonu")} sagUst={<Badge ton="gri"><Radar className="size-3" /> {t("o.aciklanabilirlik")}</Badge>}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <FuzyonRadari katkilar={sonuc.katkilar} dil={dil} />
              <div className="space-y-2.5">
                {sonuc.katkilar.map((k) => (
                  <div key={k.anahtar} className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[13px] font-semibold", k.aktif ? "text-slate-ink" : "text-slate-faint")}>{sinyalAd(k.anahtar, dil)}</span>
                      <span className="num text-[13px] font-semibold text-brand-700">+{k.katki}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-line">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${k.puan}%` }} />
                      </div>
                      <span className="num w-9 text-right text-[11px] text-slate-faint">{k.puan}</span>
                      <span className="w-14 text-right text-[10px] text-slate-faint">×{k.agirlik}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-muted">{katkiOzet(k, dil)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Otonom aksiyon planı */}
      <Panel
        baslik={t("o.aksiyonPlani")}
        sagUst={
          <div className="flex items-center gap-2">
            <Badge ton="gri"><Bot className="size-3" /> {t("o.aksiyonRozet").replace("{oto}", String(otomatikSayi)).replace("{manuel}", String(sonuc.aksiyonlar.length - otomatikSayi))}</Badge>
            <Button size="sm" variant={tumKuyrukta ? "outline" : "accent"} onClick={hepsiniKuyrukla}>
              <ListChecks className="size-4" />
              {tumKuyrukta ? t("o.kuyruguTemizle") : t("o.hepsiniUygula")}
            </Button>
          </div>
        }
      >
        {kuyruk.size > 0 && (
          <div className="mb-4">
            <NotKutusu ton="sari">
              <span dangerouslySetInnerHTML={{ __html: t("o.kuyrukNot").replace("{n}", String(kuyruk.size)) }} />
            </NotKutusu>
          </div>
        )}
        <ol className="space-y-3">
          {sonuc.aksiyonlar.map((a) => {
            const ton = ACILIYET_TON[a.aciliyet];
            const kuyrukta = kuyruk.has(a.sira);
            return (
              <motion.li
                key={a.sira}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: a.sira * 0.04 }}
                className={cn(
                  "relative flex flex-col gap-3 rounded-2xl border bg-surface p-4 transition sm:flex-row sm:items-start",
                  kuyrukta ? "border-brand-300 bg-brand-50/40" : "border-line hover:border-line-strong",
                )}
              >
                {/* Sıra + aciliyet çubuğu */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1.5">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{ background: ton.renk }}
                  >
                    {a.sira}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-ink">{aksiyonBaslik(a, dil)}</span>
                    <Badge ton={ton.ton}><Zap className="size-3" /> {aciliyetAd(a.aciliyet, dil)}</Badge>
                    {a.otomatik ? (
                      <Badge ton="mavi"><Bot className="size-3" /> {t("o.otomatik")}</Badge>
                    ) : (
                      <Badge ton="gri"><Hand className="size-3" /> {t("o.onayGerekir")}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{aksiyonMetin(a, dil)}</p>
                  <div className="mt-2 flex items-start gap-1.5 text-[12px] text-slate-faint">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span><b className="text-slate-muted">{t("o.dayanak")}</b> {aksiyonDayanak(a, sonuc.katkilar, dil)}</span>
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    onClick={() => kuyrukAltUst(a.sira)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                      kuyrukta ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-line-strong text-slate-ink hover:bg-canvas",
                    )}
                  >
                    {kuyrukta ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                    {kuyrukta ? t("o.kuyrukta") : t("o.kuyrugaAl")}
                  </button>
                  <Link
                    href={a.ilgiliPanel}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-800"
                  >
                    {t("o.paneleGit")} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ MiniOlcut */

function MiniOlcut({ etiket, deger, alt }: { etiket: string; deger: string | number; alt: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className="num mt-0.5 text-lg font-bold text-slate-ink">{deger}</div>
      <div className="truncate text-[11px] text-slate-muted">{alt}</div>
    </div>
  );
}
