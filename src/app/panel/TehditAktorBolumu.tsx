"use client";

/**
 * Specter — Tehdit Aktör Atfı (Threat Actor Attribution)
 * ======================================================
 * "Bana kim saldırıyor?" — tekil olaylar failin kimliğini söylemez. Specter,
 * saldırgan altyapısını (ASN imzası) ve davranışını (TTP: bot sınıfı, hedef
 * yollar, araçlar, coğrafya) bilinen tehdit-aktör arketipleriyle eşleştirir ve
 * her saldırgan grubunu bir profile ATFEDER: Kimlik Doldurma Şebekesi, Kazıma
 * Çiftliği, AI Toplama Operasyonu, DDoS Ekibi vb. MITRE ATT&CK tarzı — her atıf
 * bir güven skoru + eşleşen göstergelerle (IOC / TTP kanıtı) birlikte gelir.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `tehdit-aktor` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (tehditAktorAnaliz), buraya hazır AktorSonuc gelir.
 *
 * Tasarım: KorelasyonBolumu / IliskiGrafigiBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView/viewport/opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  UserSearch,
  Fingerprint,
  Boxes,
  Server,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Crosshair,
  Target,
  Users,
  Radar,
  Route,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import type { AktorSonuc, AktorAtif, AktorProfil } from "@/lib/specter/tehdit-aktor";

/* ================================================================== Sabitler */

/** Aktör seviyesi → renk paleti (hex + rozet tonu + etiket). fırsatçı=gri,
 *  organize=turuncu, gelişmiş=kırmızı (görev spesifikasyonu). */
const SEVIYE_TANIM: Record<
  AktorProfil["seviye"],
  { hex: string; rozet: "gri" | "sari" | "kirmizi"; etiket: string; alt: string }
> = {
  "fırsatçı": { hex: "#64748b", rozet: "gri",     etiket: "Fırsatçı", alt: "Hedefsiz tarama" },
  organize:   { hex: "#ea580c", rozet: "sari",    etiket: "Organize", alt: "Koordineli operasyon" },
  "gelişmiş": { hex: "#dc2626", rozet: "kirmizi", etiket: "Gelişmiş", alt: "Tespit atlatan" },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Atıf güvenine göre renk (hex) + tailwind metin sınıfı. */
function guvenRenk(g: number): { hex: string; sinif: string } {
  if (g >= 70) return { hex: "#dc2626", sinif: "text-danger2" };
  if (g >= 50) return { hex: "#ea580c", sinif: "text-orange-600" };
  if (g >= 30) return { hex: "#d97706", sinif: "text-warn" };
  return { hex: "#2f6fed", sinif: "text-blue-600" };
}

/** Bölümü rise ile saran motion sarmalayıcı (KorelasyonBolumu ile aynı). */
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
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok";
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
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

/* ================================================================== Dairesel atıf-güven göstergesi */

/** Küçük radial gauge — atıf güvenini yay olarak çizer (yatay-bar yerine). */
function GuvenHalka({
  guven,
  hex,
  azHareket,
  boyut = 52,
}: {
  guven: number;
  hex: string;
  azHareket: boolean;
  boyut?: number;
}) {
  const g = Math.max(0, Math.min(100, guven));
  const r = 20;
  const cevre = 2 * Math.PI * r;
  const dolu = (g / 100) * cevre;
  return (
    <div className="relative grid place-items-center" style={{ width: boyut, height: boyut }}>
      <svg viewBox="0 0 52 52" className="size-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--color-line)" strokeWidth="5" />
        <motion.circle
          cx="26"
          cy="26"
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
      <span className="absolute text-[13px] font-bold tabular-nums" style={{ color: hex }}>
        {g}
      </span>
    </div>
  );
}

/* ================================================================== Mini donut (dağılım) */

/** Segmentli halka — seviye/profil dağılımı için (özet şeritte yatay-barı kırar). */
function MiniDonut({
  segmentler,
  merkezUst,
  merkezAlt,
  boyut = 108,
}: {
  segmentler: { etiket: string; deger: number; renk: string }[];
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
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
          {dilimler.map((s, i) => (
            <circle
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
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className="text-[20px] font-bold tabular-nums text-slate-ink">{merkezUst}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-faint">{merkezAlt}</div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {segmentler.map((s) => (
          <div key={s.etiket} className="flex items-center gap-2 text-[12px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.renk }} />
            <span className="min-w-0 truncate text-slate-muted">{s.etiket}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums text-slate-ink">{sayi(s.deger)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== Aktör atıf kartı */

function AktorKart({ atif, azHareket }: { atif: AktorAtif; azHareket: boolean }) {
  const { profil } = atif;
  const seviye = SEVIYE_TANIM[profil.seviye];
  const guven = guvenRenk(atif.guven);
  const vurgulu = profil.seviye === "gelişmiş" || profil.seviye === "organize";
  const gelismis = profil.seviye === "gelişmiş";

  const ulkeGoster = atif.ulkeler.slice(0, 4);
  const ulkeArtan = atif.ulkeler.length - ulkeGoster.length;
  const yolGoster = atif.hedefYollar.slice(0, 3);
  const yolArtan = atif.hedefYollar.length - yolGoster.length;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        vurgulu ? "border-red-200 bg-danger-soft/25" : "border-line",
      )}
    >
      {/* Üst şerit: seviye + profil adı + atıf güveni */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${seviye.hex}14`,
              color: seviye.hex,
              borderColor: `${seviye.hex}33`,
            }}
          >
            {gelismis ? <Crosshair className="size-[18px]" /> : <UserSearch className="size-[18px]" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{profil.ad}</span>
              <Badge ton={seviye.rozet}>
                {gelismis && <Flame className="size-3" />}
                {seviye.etiket}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                <Fingerprint className="size-3" />
                <span className="truncate font-mono">{atif.id.replace("aktor_", "#")}</span>
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-muted">{profil.aciklama}</p>
          </div>
        </div>

        {/* Atıf güveni — dairesel gösterge (yatay-bar değil) */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-right text-[10.5px] font-medium uppercase leading-tight tracking-wide text-slate-faint sm:block">
            atıf
            <br />
            güveni
          </span>
          <GuvenHalka guven={atif.guven} hex={guven.hex} azHareket={azHareket} />
        </div>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metrik ikon={Boxes} etiket="Olay">
          {sayi(atif.toplamOlay)}
        </Metrik>
        <Metrik ikon={Fingerprint} etiket="Benzersiz IP">
          {sayi(atif.benzersizIp)}
        </Metrik>
        <Metrik ikon={Server} etiket="ASN">
          <span className="truncate font-mono text-[12px]">{atif.asnler[0] ?? "—"}</span>
          {atif.asnler.length > 1 && (
            <span className="text-[11px] font-medium text-slate-faint">+{atif.asnler.length - 1}</span>
          )}
        </Metrik>
        <Metrik ikon={Layers} etiket="Baskın sınıf">
          {(() => {
            const bg = botSinifGorsel(atif.dominantSinif);
            const BikonComp = bg.ikon;
            return (
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="grid size-4 shrink-0 place-items-center rounded"
                  style={{ background: bg.soft, color: bg.renk }}
                >
                  <BikonComp className="size-2.5" strokeWidth={2.4} />
                </span>
                <span className="truncate">{atif.dominantSinif}</span>
              </span>
            );
          })()}
        </Metrik>
      </div>

      {/* Kaynak ülkeler + motivasyon */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {ulkeGoster.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Globe className="size-3" />
              Kaynak
            </span>
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
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          <Target className="size-3.5 shrink-0 text-slate-faint" />
          <span className="truncate text-[11.5px] text-slate-muted">
            <span className="font-medium text-slate-ink">Motivasyon:</span> {profil.motivasyon}
          </span>
        </div>
      </div>

      {/* TTP chip'leri (MITRE tarzı — profilin karakteristik teknikleri) */}
      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
          <Crosshair className="size-3" />
          Karakteristik TTP&apos;ler
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {profil.ttp.map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Göstergeler — eşleşen IOC / TTP kanıtı (atıfın gerekçesi, ayrı renk) */}
      {atif.gostergeler.length > 0 && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Radar className="size-3" />
            Eşleşen göstergeler — atıf kanıtı
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {atif.gostergeler.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
              >
                <ShieldAlert className="size-3 opacity-70" />
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hedef yollar */}
      {yolGoster.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line/70 pt-3">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Route className="size-3" />
            Hedef yollar
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {yolGoster.map((y) => (
              <span
                key={y}
                className="max-w-[220px] truncate rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-muted ring-1 ring-inset ring-line"
              >
                {y}
              </span>
            ))}
            {yolArtan > 0 && (
              <span className="text-[11px] font-medium text-slate-faint">+{sayi(yolArtan)} yol</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function TehditAktorBolumu({ aktor, azHareket }: { aktor: AktorSonuc; azHareket: boolean }) {
  const { atiflar, ozet } = aktor;
  // Atıf güvenine göre sırala; en yüksek güvenli atıflar önce.
  const gosterilecek = [...atiflar].sort((a, b) => b.guven - a.guven).slice(0, 8);
  const gelismisVar = ozet.gelismisAktor > 0;
  const profilCesidi = ozet.profilDagilim.length;

  // Seviye dağılımı (donut için) — atıfları seviyeye göre grupla.
  const seviyeSay: Record<AktorProfil["seviye"], number> = { "fırsatçı": 0, organize: 0, "gelişmiş": 0 };
  for (const a of atiflar) seviyeSay[a.profil.seviye]++;
  const seviyeSegment = (["gelişmiş", "organize", "fırsatçı"] as AktorProfil["seviye"][])
    .map((s) => ({ etiket: SEVIYE_TANIM[s].etiket, deger: seviyeSay[s], renk: SEVIYE_TANIM[s].hex }))
    .filter((s) => s.deger > 0);
  // Ortalama atıf güveni (üst-özet anlatısı).
  const ortGuven = atiflar.length
    ? Math.round(atiflar.reduce((a, b) => a + b.guven, 0) / atiflar.length)
    : 0;
  // Profil dağılımı için baskın bot-sınıf rengini eşle (rozet-ızgarası).
  const profilRenk = (ad: string): string => {
    const bul = atiflar.find((a) => a.profil.ad === ad);
    return bul ? botSinifGorsel(bul.dominantSinif).renk : "#6b6a63";
  };
  const enCokProfil = ozet.profilDagilim[0]?.sayi ?? 1;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={UserSearch} metin="Tehdit Aktör Atfı" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(ozet.toplamAktor)} aktör</span>
            <Badge ton={gelismisVar ? "kirmizi" : "brand"}>
              <Fingerprint className="size-3" />
              {gelismisVar ? `${sayi(ozet.gelismisAktor)} gelişmiş` : "Atıf"}
            </Badge>
          </div>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Veylify, saldırgan altyapısını (ASN/TTP) bilinen tehdit-aktör
          arketipleriyle eşleştirir — her saldırgan grubunu davranış imzasına göre
          bir profile atfeder ve atıfı eşleşen göstergelerle (IOC) gerekçelendirir.
          {ozet.enAktifProfil !== "—" && (
            <>
              {" "}En aktif profil: <span className="font-medium text-slate-ink">{ozet.enAktifProfil}</span>.
            </>
          )}
        </p>

        {/* Üst-özet şeridi — "tek bakışta anla": KPI + seviye donutu + profil ızgarası.
            Yatay-bar listesi değil; üç farklı görsel dil bir arada. */}
        <div className="grid gap-3 lg:grid-cols-12">
          {/* Büyük KPI ikilisi */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-4">
            <OzetHap ikon={Users} etiket="Toplam aktör" deger={sayi(ozet.toplamAktor)} ek={`ø %${ortGuven}`} />
            <OzetHap
              ikon={Flame}
              etiket="Gelişmiş"
              deger={sayi(ozet.gelismisAktor)}
              ton={gelismisVar ? "danger" : "ink"}
              ek={`${sayi(profilCesidi)} profil`}
            />
          </div>

          {/* Seviye dağılımı — donut (yatay-bar yerine) */}
          <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3.5 lg:col-span-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Layers className="size-3.5" />
              Aktör seviyesi dağılımı
            </div>
            {seviyeSegment.length > 0 ? (
              <MiniDonut
                segmentler={seviyeSegment}
                merkezUst={sayi(ozet.toplamAktor)}
                merkezAlt="aktör"
              />
            ) : (
              <p className="py-4 text-center text-[12px] text-slate-faint">Atıf yok</p>
            )}
          </div>

          {/* En aktif profiller — rozet-ızgarası (bot-sınıf renkleriyle) */}
          <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3.5 lg:col-span-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Radar className="size-3.5" />
              En aktif profiller
            </div>
            {ozet.profilDagilim.length > 0 ? (
              <div className="space-y-2">
                {ozet.profilDagilim.slice(0, 4).map((p) => {
                  const renk = profilRenk(p.ad);
                  const oran = Math.round((p.sayi / enCokProfil) * 100);
                  return (
                    <div key={p.ad} className="flex items-center gap-2">
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-bold tabular-nums"
                        style={{ background: `${renk}1f`, color: renk }}
                      >
                        {p.sayi}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11.5px] font-medium text-slate-ink">{p.ad}</div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-canvas">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: renk }}
                            initial={azHareket ? false : { width: 0 }}
                            animate={azHareket ? undefined : { width: `${oran}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-[12px] text-slate-faint">Profil yok</p>
            )}
          </div>
        </div>

        {/* Atıf kartları */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Atfedilmiş tehdit aktörü yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Saldırgan grupları bir aktör arketipine eşleştiğinde atıflar burada belirir.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((a, i) => (
              <Bolum key={a.id} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                <AktorKart atif={a} azHareket={azHareket} />
              </Bolum>
            ))}
          </div>
        )}

        {/* Seviye lejantı + profil dağılımı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Aktör seviyesi:</span>
          {(["fırsatçı", "organize", "gelişmiş"] as AktorProfil["seviye"][]).map((s) => {
            const t = SEVIYE_TANIM[s];
            return (
              <span key={s} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.etiket}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-slate-muted">
            <Fingerprint className="size-3.5 text-slate-faint" />
            ASN imzası = aktör altyapısı
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
