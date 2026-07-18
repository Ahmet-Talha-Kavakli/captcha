"use client";

/**
 * Specter — Olay Korelasyonu (SIEM)
 * =================================
 * Tek tek olaylar gürültüdür; SIEM'in işi onları ANLAMLI saldırı kampanyalarına
 * bağlamaktır. Bu bölüm, korelasyon motorunun (korelasyonBul / korelasyonOzet)
 * ilişkilendirdiği olayları tek bir "saldırı kampanyası" kartı olarak gösterir:
 * türü, şiddeti, güven skoru, kapsamı (olay/IP/ülke/süre), MITRE-benzeri taktik
 * zinciri ve mitigasyon (engel) oranı ile birlikte.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `correlation` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (korelasyonlar + korOzet), buraya hazır prop gelir.
 *
 * Tasarım: KillChainBolumu ile birebir aynı dil — Panel + krem kartlar
 * (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise (azHareket → sade).
 */

import { motion } from "framer-motion";
import {
  Network,
  KeyRound,
  Download,
  Crosshair,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Server,
  Fingerprint,
  Route,
  Gauge,
  Radio,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import type {
  Korelasyon,
  KorelasyonOzet,
  KorelasyonTur,
  KorelasyonSiddet,
} from "@/lib/specter/correlation";

/* ================================================================== Sabitler */

/** Korelasyon türü → TR ad + ikon + renk (çeşitli palet: mor/turkuaz/mavi/pembe/amber). */
const TUR_TANIM: Record<KorelasyonTur, { ad: string; kisa: string; ikon: React.ElementType; hex: string }> = {
  kimlik_dogrulama_saldirisi: { ad: "Kimlik Doğrulama Saldırısı", kisa: "Kimlik Doğrulama", ikon: KeyRound, hex: "#db2777" },
  kazima_kampanyasi:          { ad: "Kazıma Kampanyası", kisa: "Kazıma", ikon: Download, hex: "#d97706" },
  dagitik_bot_agi:            { ad: "Dağıtık Bot Ağı", kisa: "Dağıtık Ağ", ikon: Network, hex: "#7c3aed" },
  hedefli_endpoint_saldirisi: { ad: "Hedefli Endpoint Saldırısı", kisa: "Endpoint", ikon: Crosshair, hex: "#0891b2" },
  ip_patlamasi:               { ad: "IP Patlaması", kisa: "IP Patlaması", ikon: Zap, hex: "#2f6fed" },
};

/** Şiddet → renk paleti (hex + tailwind rozet tonu + etiket). */
const SIDDET_TANIM: Record<
  KorelasyonSiddet,
  { hex: string; rozet: "kirmizi" | "sari" | "mavi"; etiket: string }
> = {
  kritik: { hex: "#dc2626", rozet: "kirmizi", etiket: "Kritik" },
  yuksek: { hex: "#ea580c", rozet: "kirmizi", etiket: "Yüksek" },
  orta:   { hex: "#d97706", rozet: "sari",    etiket: "Orta" },
  dusuk:  { hex: "#2f6fed", rozet: "mavi",     etiket: "Düşük" },
};

/** Aktif sayılma penceresi (motor ile aynı: son 15 dk). */
const AKTIF_PENCERE_MS = 15 * 60 * 1000;

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** İki zaman damgası arasını insan-okur süreye çevirir ("12 dk", "3 sa", "2 gün"). */
function sureBicim(baslangic: number, bitis: number): string {
  const ms = Math.max(0, bitis - baslangic);
  const dk = Math.round(ms / 60000);
  if (dk < 1) return "<1 dk";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.round(sa / 24);
  return `${gun} gün`;
}

/** Bölümü rise ile saran motion sarmalayıcı (KillChainBolumu ile aynı). */
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
      initial={{ y: 12 }}
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

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
  nabiz,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok";
  nabiz?: boolean;
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : "text-slate-ink";
  const noktaRenk = ton === "danger" ? "bg-danger2" : "bg-ok";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        {nabiz ? (
          <span className="relative flex size-2.5">
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", noktaRenk)} />
            <span className={cn("relative inline-flex size-2.5 rounded-full", noktaRenk)} />
          </span>
        ) : (
          <Ikon className="size-3.5" />
        )}
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="text-[12px] tabular-nums text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Metrik hücresi */

function Metrik({
  ikon: Ikon,
  etiket,
  children,
}: {
  ikon: React.ElementType;
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-slate-ink">
        {children}
      </div>
    </div>
  );
}

/* ================================================================== Dairesel mitigasyon kalkanı */

/** Mitigasyon oranını yatay-bar yerine dairesel kalkan-göstergesiyle çizer. */
function MitigasyonHalka({
  yuzde,
  azHareket,
  boyut = 56,
}: {
  yuzde: number;
  azHareket: boolean;
  boyut?: number;
}) {
  const g = Math.max(0, Math.min(100, yuzde));
  const hex = g >= 60 ? "#16a34a" : g >= 30 ? "#d97706" : "#dc2626";
  const r = 22;
  const cevre = 2 * Math.PI * r;
  const dolu = (g / 100) * cevre;
  return (
    <div className="relative grid place-items-center" style={{ width: boyut, height: boyut }}>
      <svg viewBox="0 0 56 56" className="size-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#eceae2" strokeWidth="5" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={azHareket ? false : { strokeDashoffset: cevre }}
          animate={azHareket ? undefined : { strokeDashoffset: cevre - dolu }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={azHareket ? { strokeDashoffset: cevre - dolu } : undefined}
        />
      </svg>
      <ShieldCheck className="absolute size-4" style={{ color: hex }} />
    </div>
  );
}

/* ================================================================== Mini donut (tür dağılımı) */

function MiniDonut({
  segmentler,
  merkezUst,
  merkezAlt,
  boyut = 104,
}: {
  segmentler: { etiket: string; deger: number; renk: string; ikon?: React.ElementType }[];
  merkezUst: string;
  merkezAlt: string;
  boyut?: number;
}) {
  const toplam = segmentler.reduce((a, s) => a + s.deger, 0) || 1;
  const r = 42;
  const cevre = 2 * Math.PI * r;
  const bosluk = 2;
  const cokSegment = segmentler.filter((s) => s.deger > 0).length > 1;
  let birikim = 0;
  const dilimler = segmentler.map((s) => {
    const tam = (s.deger / toplam) * cevre;
    const uz = cokSegment && s.deger > 0 ? Math.max(0, tam - bosluk) : tam;
    const off = birikim;
    birikim += tam;
    return { ...s, uz, off };
  });
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: boyut, height: boyut }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#eceae2" strokeWidth="9" />
          {dilimler.map((s, i) => (
            <motion.circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.renk}
              strokeWidth="9"
              strokeDasharray={`${s.uz} ${cevre - s.uz}`}
              strokeDashoffset={-s.off}
              strokeLinecap="butt"
              initial={{ opacity: 0.001 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className="text-[19px] font-bold tabular-nums text-slate-ink">{merkezUst}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-faint">{merkezAlt}</div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {segmentler.map((s) => {
          const Ikon = s.ikon;
          return (
            <div key={s.etiket} className="flex items-center gap-1.5 text-[12px]">
              {Ikon ? (
                <Ikon className="size-3 shrink-0" style={{ color: s.renk }} />
              ) : (
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.renk }} />
              )}
              <span className="min-w-0 truncate text-slate-muted">{s.etiket}</span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums text-slate-ink">{sayi(s.deger)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== Şiddet dikey barlar */

/** Şiddet dağılımını dikey sütun kolonlarıyla gösterir (yatay-bar değil). */
function SiddetSutunlar({
  dagilim,
  azHareket,
}: {
  dagilim: { siddet: KorelasyonSiddet; sayi: number }[];
  azHareket: boolean;
}) {
  const max = Math.max(1, ...dagilim.map((d) => d.sayi));
  return (
    <div className="flex h-[104px] items-end gap-2">
      {dagilim.map((d, i) => {
        const t = SIDDET_TANIM[d.siddet];
        const yuk = Math.max(4, (d.sayi / max) * 100);
        return (
          <div key={d.siddet} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[12px] font-bold tabular-nums text-slate-ink">{sayi(d.sayi)}</span>
            <div className="flex w-full flex-1 items-end" style={{ minHeight: 44 }}>
              <motion.div
                className="w-full rounded-t-md"
                style={{ background: t.hex }}
                initial={azHareket ? false : { height: 0 }}
                animate={azHareket ? undefined : { height: `${yuk}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] font-medium text-slate-faint">{t.etiket}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== Kampanya kartı */

function KampanyaKart({
  kor,
  aktif,
  azHareket,
}: {
  kor: Korelasyon;
  aktif: boolean;
  azHareket: boolean;
}) {
  const turTanim = TUR_TANIM[kor.tur];
  const TurIkon = turTanim.ikon;
  const siddet = SIDDET_TANIM[kor.siddet];
  const kritikVurgu = kor.siddet === "kritik" || kor.siddet === "yuksek";
  const engelYuzde = Math.round(kor.engelOrani * 100);
  const sure = sureBicim(kor.ilkGorulme, kor.sonGorulme);
  // İlk 4 ülke bayrağı; kalanı "+N" olarak özetlenir.
  const ulkeGoster = kor.ulkeler.slice(0, 4);
  const ulkeArtan = kor.ulkeler.length - ulkeGoster.length;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        aktif ? "border-red-200 bg-danger-soft/25" : "border-line",
      )}
    >
      {/* Üst şerit: tür + başlık + durum */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${siddet.hex}14`,
              color: siddet.hex,
              borderColor: `${siddet.hex}33`,
            }}
          >
            <TurIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{turTanim.ad}</span>
              <Badge ton={siddet.rozet}>
                {kritikVurgu && <Flame className="size-3" />}
                {siddet.etiket}
              </Badge>
              {(() => {
                const bg = botSinifGorsel(kor.dominantBotClass);
                const BikonComp = bg.ikon;
                return (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium"
                    style={{ background: bg.soft, color: bg.renk }}
                  >
                    <BikonComp className="size-2.5" strokeWidth={2.4} />
                    <span className="truncate font-mono">{kor.dominantBotClass}</span>
                  </span>
                );
              })()}
              {aktif && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger2 opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-danger2" />
                  </span>
                  AKTİF
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[11.5px] text-slate-muted">{kor.baslik}</p>
          </div>
        </div>

        {/* Güven skoru pili */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-slate-faint" />
            <span className="text-[15px] font-bold tabular-nums" style={{ color: siddet.hex }}>
              %{kor.guvenSkoru}
            </span>
          </div>
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">güven</span>
        </div>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metrik ikon={Boxes} etiket="Olay">
          {sayi(kor.olaySayisi)}
        </Metrik>
        <Metrik ikon={Fingerprint} etiket="Benzersiz IP">
          {sayi(kor.benzersizIp)}
        </Metrik>
        <Metrik ikon={Server} etiket="ASN">
          <span className="truncate font-mono text-[12px]">{kor.asnler[0] ?? "—"}</span>
          {kor.asnler.length > 1 && (
            <span className="text-[11px] font-medium text-slate-faint">+{kor.asnler.length - 1}</span>
          )}
        </Metrik>
        <Metrik ikon={Clock} etiket="Süre">
          {sure}
        </Metrik>
      </div>

      {/* Ülkeler + hedef path */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">Kaynak</span>
          <div className="flex flex-wrap items-center gap-1">
            {ulkeGoster.map((u) => (
              <Ulke key={u} kod={u} />
            ))}
            {ulkeArtan > 0 && (
              <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted">
                +{ulkeArtan}
              </span>
            )}
          </div>
        </div>
        {kor.pathler[0] && (
          <div className="flex min-w-0 items-center gap-1.5">
            <Route className="size-3.5 shrink-0 text-slate-faint" />
            <span className="truncate font-mono text-[11.5px] text-slate-muted">{kor.pathler[0]}</span>
            {kor.pathler.length > 1 && (
              <span className="shrink-0 text-[11px] font-medium text-slate-faint">
                +{kor.pathler.length - 1} yol
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alt şerit: taktik zinciri (sol, MITRE-benzeri) + dairesel mitigasyon (sağ) */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line/70 pt-3.5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Crosshair className="size-3" />
            Taktik zinciri
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {kor.taktikler.map((tk, i) => (
              <span key={tk} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  {tk}
                </span>
              </span>
            ))}
          </div>
        </div>
        {/* Dairesel mitigasyon kalkanı (yatay-bar yerine) */}
        <div className="flex shrink-0 items-center gap-2">
          <MitigasyonHalka yuzde={engelYuzde} azHareket={azHareket} />
          <div className="leading-tight">
            <div className="text-[15px] font-bold tabular-nums text-slate-ink">%{engelYuzde}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-faint">
              mitigasyon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function KorelasyonBolumu({
  korelasyonlar,
  ozet,
  azHareket,
}: {
  korelasyonlar: Korelasyon[];
  ozet: KorelasyonOzet;
  azHareket: boolean;
}) {
  const gosterilecek = korelasyonlar.slice(0, 8);
  // "Aktif" belirleme motorla aynı mantık: en yeni olaya göre son 15 dk.
  const enYeniAn = korelasyonlar.reduce((m, k) => Math.max(m, k.sonGorulme), 0);
  const aktifMi = (k: Korelasyon) => enYeniAn - k.sonGorulme <= AKTIF_PENCERE_MS;
  const aktifVar = ozet.aktifSaldiri > 0;
  const enYayginAd = ozet.enYayginTur ? TUR_TANIM[ozet.enYayginTur].ad : null;

  // Tür dağılımı (donut) — kampanyaları türe göre grupla.
  const turSay = new Map<KorelasyonTur, number>();
  for (const k of korelasyonlar) turSay.set(k.tur, (turSay.get(k.tur) ?? 0) + 1);
  const turSegment = (Object.keys(TUR_TANIM) as KorelasyonTur[])
    .map((t) => ({
      etiket: TUR_TANIM[t].kisa,
      deger: turSay.get(t) ?? 0,
      renk: TUR_TANIM[t].hex,
      ikon: TUR_TANIM[t].ikon,
    }))
    .filter((s) => s.deger > 0);

  // Şiddet dağılımı (dikey sütunlar) — kritik→düşük sabit sıra.
  const siddetSay = new Map<KorelasyonSiddet, number>();
  for (const k of korelasyonlar) siddetSay.set(k.siddet, (siddetSay.get(k.siddet) ?? 0) + 1);
  const siddetDagilim = (["kritik", "yuksek", "orta", "dusuk"] as KorelasyonSiddet[]).map((s) => ({
    siddet: s,
    sayi: siddetSay.get(s) ?? 0,
  }));

  // Ortalama mitigasyon oranı (üst-özet anlatısı).
  const ortMitig = korelasyonlar.length
    ? Math.round((korelasyonlar.reduce((a, k) => a + k.engelOrani, 0) / korelasyonlar.length) * 100)
    : 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Network} metin="Olay Korelasyonu" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">
              {sayi(ozet.toplam)} kampanya
            </span>
            <Badge ton="brand">
              <Radio className="size-3" />
              SIEM
            </Badge>
          </div>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Tek tek olaylar gürültüdür — Veylify onları ilişkilendirip tek bir saldırı
          kampanyasına bağlar. Aşağıda birbirine bağlı olaylar; türü, kapsamı, taktik
          zinciri ve güven skoruyla birlikte gösteriliyor.
          {enYayginAd && (
            <>
              {" "}En yaygın örüntü: <span className="font-medium text-slate-ink">{enYayginAd}</span>.
            </>
          )}
        </p>

        {/* Üst-özet şeridi — "tek bakışta anla": KPI'lar + tür donutu + şiddet sütunları.
            Üç ayrı görsel dil; monoton yatay-bar tekrarı yok. */}
        <div className="grid gap-3 lg:grid-cols-12">
          {/* KPI dörtlüsü (2×2) */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-5">
            <OzetHap ikon={Boxes} etiket="Korelasyon" deger={sayi(ozet.toplam)} ek={`ø %${ortMitig} eng.`} />
            <OzetHap
              ikon={Flame}
              etiket="Kritik"
              deger={sayi(ozet.kritik)}
              ton={ozet.kritik > 0 ? "danger" : "ink"}
            />
            <OzetHap
              ikon={ShieldAlert}
              etiket="Aktif saldırı"
              deger={sayi(ozet.aktifSaldiri)}
              ton={aktifVar ? "danger" : "ok"}
              nabiz
            />
            <OzetHap ikon={Fingerprint} etiket="Etkilenen IP" deger={sayi(ozet.etkilenenIp)} />
          </div>

          {/* Tür dağılımı — donut (yatay-bar yerine) */}
          <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3.5 lg:col-span-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Network className="size-3.5" />
              Kampanya türü dağılımı
            </div>
            {turSegment.length > 0 ? (
              <MiniDonut segmentler={turSegment} merkezUst={sayi(ozet.toplam)} merkezAlt="kampanya" />
            ) : (
              <p className="py-4 text-center text-[12px] text-slate-faint">Kampanya yok</p>
            )}
          </div>

          {/* Şiddet dağılımı — dikey sütunlar (yatay-bar yerine) */}
          <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3.5 lg:col-span-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Flame className="size-3.5" />
              Şiddet
            </div>
            <SiddetSutunlar dagilim={siddetDagilim} azHareket={azHareket} />
          </div>
        </div>

        {/* Kampanya listesi */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">İlişkilendirilmiş saldırı kampanyası yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Birbirine bağlı olay örüntüleri tespit edildiğinde kampanyalar burada belirir.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((kor, i) => (
              <Bolum key={kor.id} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                <KampanyaKart kor={kor} aktif={aktifMi(kor)} azHareket={azHareket} />
              </Bolum>
            ))}
          </div>
        )}

        {/* Şiddet lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Şiddet:</span>
          {(Object.keys(SIDDET_TANIM) as KorelasyonSiddet[]).map((s) => {
            const t = SIDDET_TANIM[s];
            return (
              <span key={s} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.etiket}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-red-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger2 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-danger2" />
            </span>
            AKTİF = son 15 dk içinde olay üretti
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
