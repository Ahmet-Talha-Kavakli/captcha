"use client";

/**
 * Specter — Saldırı Kill-Chain / Saldırı Hikayesi
 * ================================================
 * Tek tek olaylar gürültüdür; bir saldırı ise AŞAMALI bir zincirdir. Bu bölüm
 * her saldırganın (IP) 6 aşamalı saldırı zincirini (Keşif → Sızma) yatay bir
 * "kill-chain" göstergesiyle anlatır ve Specter'ın onu HANGİ aşamada durdurduğunu
 * (kalkan işareti) görsel olarak gösterir. Erken kesme = güçlü savunma.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `kill-chain` motorundan (killChainCikar /
 * killChainOzet) türetilir. page.tsx SERVER'da hesaplar, buraya hazır prop gelir.
 *
 * Tasarım: DerinlikBolumleri ile aynı dil — Panel + krem kartlar (bg-canvas),
 * tabular-nums, rounded kartlar; framer-motion fade+rise (azHareket → sade).
 */

import { motion } from "framer-motion";
import {
  Crosshair,
  Search,
  Radar,
  Wrench,
  KeyRound,
  Bug,
  DoorOpen,
  ShieldCheck,
  ShieldAlert,
  Ban,
  GitBranch,
  Flame,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import type { SaldirganZincir, KillChainOzet, Asama } from "@/lib/specter/kill-chain";

/* ================================================================== Sabitler */

/** Aşama sırası (1..6). */
const ASAMA_SIRA: Asama[] = ["kesif", "tarama", "silahlanma", "erisim", "somuru", "sizma"];

/** Aşama → TR ad + kısa ad + ikon. */
const ASAMA_TANIM: Record<Asama, { ad: string; kisa: string; ikon: React.ElementType }> = {
  kesif:      { ad: "Keşif",       kisa: "Keşif", ikon: Search },
  tarama:     { ad: "Tarama",      kisa: "Tarama", ikon: Radar },
  silahlanma: { ad: "Silahlanma",  kisa: "Silah", ikon: Wrench },
  erisim:     { ad: "Erişim",      kisa: "Erişim", ikon: KeyRound },
  somuru:     { ad: "Sömürü",      kisa: "Sömürü", ikon: Bug },
  sizma:      { ad: "Sızma",       kisa: "Sızma", ikon: DoorOpen },
};

/** tehdit seviyesi → renk paleti (hex + tailwind rozet tonu). */
const TEHDIT_TANIM: Record<
  SaldirganZincir["tehdit"],
  { hex: string; rozet: "yesil" | "sari" | "kirmizi"; etiket: string }
> = {
  "düşük":  { hex: "#16a34a", rozet: "yesil",   etiket: "Düşük" },
  "orta":   { hex: "#d97706", rozet: "sari",    etiket: "Orta" },
  "yüksek": { hex: "#ea580c", rozet: "kirmizi", etiket: "Yüksek" },
  "kritik": { hex: "#dc2626", rozet: "kirmizi", etiket: "Kritik" },
};

/** Aşama → renk (kill-chain motor ASAMA_META ile aynı: keşif gri → sızma mor).
 *  Huni basamakları için çeşitli palet — hepsi tek brand-mavi değil. */
const ASAMA_RENK: Record<Asama, string> = {
  kesif:      "#64748b", // slate
  tarama:     "#0891b2", // turkuaz
  silahlanma: "#7c3aed", // mor
  erisim:     "#d97706", // amber
  somuru:     "#dc2626", // kırmızı
  sizma:      "#9333ea", // menekşe
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Bölümü fade+rise ile saran motion sarmalayıcı (DerinlikBolumleri ile aynı). */
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

/* ================================================================== Kill-chain barı */

/**
 * Tek saldırganın 6 aşamalı yatay kill-chain göstergesi.
 * - Ulaşılan aşamalar dolu (tehdit rengi), ulaşılmayanlar soluk.
 * - Specter'ın kestiği aşamada kalkan (ShieldCheck) rozeti + o noktadan sonrası
 *   yeşil "durduruldu" tonuna geçer.
 * - Durdurulmamış + sızmaya ulaşmış zincir → kırmızı/kritik uyarı halesi.
 */
function KillChainBar({
  zincir,
  azHareket,
  gecikme,
}: {
  zincir: SaldirganZincir;
  azHareket: boolean;
  gecikme: number;
}) {
  const tehdit = TEHDIT_TANIM[zincir.tehdit];
  const kesilenSira = zincir.kesilenSira; // 1..6 | null

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-2">
      {ASAMA_SIRA.map((asama, i) => {
        const sira = i + 1; // 1..6
        const tanim = ASAMA_TANIM[asama];
        const Ikon = tanim.ikon;
        const ulasildi = sira <= zincir.ilerlemeSira;
        const kesildi = kesilenSira !== null && sira === kesilenSira;
        const kesildiktenSonra = kesilenSira !== null && sira > kesilenSira;

        // Nokta rengi: kesildiği aşama yeşil kalkan; kesildikten sonra ulaşılan
        // aşama zaten olmaz (durdu) ama güvenli — soluk; ulaşılan = tehdit rengi.
        const dolu = ulasildi && !kesildiktenSonra;
        const nokta = kesildi
          ? "#16a34a"
          : dolu
            ? tehdit.hex
            : "#e2e8f0"; // slate-200 (ulaşılmadı)

        return (
          <div key={asama} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            {/* Aşama düğümü */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="relative grid size-8 shrink-0 place-items-center rounded-xl ring-1 ring-inset sm:size-9"
                style={{
                  background: kesildi ? "#dcfce7" : dolu ? `${tehdit.hex}1a` : "#f8fafc",
                  color: nokta,
                  boxShadow: kesildi ? "0 0 0 3px rgba(22,163,74,0.12)" : undefined,
                }}
                initial={azHareket ? false : { scale: 0.6 }}
                animate={azHareket ? undefined : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: gecikme + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {kesildi ? (
                  <ShieldCheck className="size-4 sm:size-[18px]" />
                ) : (
                  <Ikon className="size-4 sm:size-[18px]" style={{ opacity: dolu ? 1 : 0.5 }} />
                )}
                {/* Sızmaya ulaşmış + durdurulmamış → kritik nabız halesi */}
                {!azHareket && asama === "sizma" && dolu && !zincir.durduruldu && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger2 opacity-70" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-danger2" />
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "hidden text-[9px] font-medium leading-none tracking-tight sm:block",
                  dolu || kesildi ? "text-slate-muted" : "text-slate-faint/70",
                )}
              >
                {tanim.kisa}
              </span>
            </div>

            {/* Aşamalar arası bağlantı çizgisi (son aşamadan sonra yok) */}
            {i < ASAMA_SIRA.length - 1 && (
              <div className="relative h-[3px] min-w-3 flex-1 self-start overflow-hidden rounded-full bg-canvas" style={{ marginTop: 16 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      kesilenSira !== null && sira >= kesilenSira
                        ? "#16a34a"
                        : sira < zincir.ilerlemeSira
                          ? tehdit.hex
                          : "transparent",
                  }}
                  initial={azHareket ? false : { width: 0 }}
                  animate={azHareket ? undefined : { width: "100%" }}
                  transition={{ duration: 0.4, delay: gecikme + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== Zincir satırı */

function ZincirSatir({
  zincir,
  azHareket,
  gecikme,
}: {
  zincir: SaldirganZincir;
  azHareket: boolean;
  gecikme: number;
}) {
  const tehdit = TEHDIT_TANIM[zincir.tehdit];
  const durduruldu = zincir.durduruldu;
  const kesilenAd = zincir.kesilenAsama ? ASAMA_TANIM[zincir.kesilenAsama].ad : null;
  const ilerlemeAd = ASAMA_TANIM[zincir.ilerlemeAsama].ad;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        durduruldu ? "border-line" : "border-red-200 bg-danger-soft/30",
      )}
    >
      {/* Üst şerit: kimlik + durum */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset"
            style={{ background: `${tehdit.hex}14`, color: tehdit.hex, borderColor: `${tehdit.hex}33` }}
          >
            {durduruldu ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-[13px] font-semibold text-slate-ink">{zincir.ip}</span>
              <Ulke kod={zincir.country} />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-faint">
              <span className="truncate font-mono">{zincir.asn}</span>
              <span className="text-slate-300">·</span>
              <span className="tabular-nums">{sayi(zincir.olaySayisi)} olay</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge ton={tehdit.rozet}>
            {!durduruldu && zincir.tehdit === "kritik" && <Flame className="size-3" />}
            {tehdit.etiket} tehdit
          </Badge>
          {durduruldu ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 text-[12px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
              <ShieldCheck className="size-3.5" />
              {kesilenAd} aşamasında durduruldu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-0.5 text-[12px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
              <Ban className="size-3.5" />
              {ilerlemeAd} aşamasına ulaştı
            </span>
          )}
        </div>
      </div>

      {/* Kill-chain görseli */}
      <KillChainBar zincir={zincir} azHareket={azHareket} gecikme={gecikme} />
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function KillChainBolumu({
  zincirler,
  ozet,
  azHareket,
}: {
  zincirler: SaldirganZincir[];
  ozet: KillChainOzet;
  azHareket: boolean;
}) {
  const gosterilecek = zincirler.slice(0, 9);
  const durdurulanOran = ozet.durdurulanOran; // 0..100
  // En "geniş" aşama huni değeri — bar oranları için.
  const huniMax = Math.max(1, ...ozet.asamaHunisi.map((a) => a.ulasan));

  // Tehdit seviyesi dağılımı (segment şeridi + rozetler) — kritik→düşük sabit sıra.
  const tehditSay: Record<SaldirganZincir["tehdit"], number> = {
    "kritik": 0, "yüksek": 0, "orta": 0, "düşük": 0,
  };
  for (const z of zincirler) tehditSay[z.tehdit]++;
  const tehditDagilim = (["kritik", "yüksek", "orta", "düşük"] as SaldirganZincir["tehdit"][]).map((s) => ({
    seviye: s,
    sayi: tehditSay[s],
  }));
  const toplamTehdit = zincirler.length;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Crosshair} metin="Saldırı Kill-Chain" />}
        sagUst={
          <span className="text-[12px] text-slate-faint">
            {sayi(ozet.toplamZincir)} saldırı zinciri
          </span>
        }
      >
        {/* Açıklama */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Her saldırgan bir saldırı zinciridir: Keşif'ten Sızma'ya 6 aşama. Veylify
          zinciri ne kadar erken keserse savunma o kadar güçlüdür. Aşağıda en tehlikeli
          saldırganlar ve durduruldukları nokta gösteriliyor.
        </p>

        {/* Özet şeridi */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Layers className="size-3.5" />
              Zincir
            </div>
            <div className="mt-1 text-[22px] font-bold leading-none num text-slate-ink">
              {sayi(ozet.toplamZincir)}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <ShieldCheck className="size-3.5" />
              Durduruldu
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[22px] font-bold leading-none num text-ok">{sayi(ozet.durdurulan)}</span>
              <span className="text-[12px] tabular-nums text-slate-faint">%{durdurulanOran}</span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <Flame className="size-3.5" />
              İleri aşama
            </div>
            <div className={cn("mt-1 text-[22px] font-bold leading-none num", ozet.ileriUlasan > 0 ? "text-danger2" : "text-slate-ink")}>
              {sayi(ozet.ileriUlasan)}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <GitBranch className="size-3.5" />
              Ort. kesme
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[22px] font-bold leading-none num text-slate-ink">
                {ozet.ortKesmeSira ? ozet.ortKesmeSira.toFixed(1) : "—"}
              </span>
              {ozet.ortKesmeSira > 0 && <span className="text-[12px] text-slate-faint">/ 6</span>}
            </div>
          </div>
        </div>

        {/* İki kolonlu derinlik: sol = gerçek dikey HUNİ, sağ = tehdit segment şeridi.
            Monoton yatay-bar ızgarası yerine iki farklı görsel dil. */}
        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          {/* Aşama hunisi — dikey daralan basamaklar (gerçek funnel) */}
          <div className="rounded-2xl border border-line bg-canvas/30 p-4 lg:col-span-8">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
              <GitBranch className="size-3.5 text-slate-faint" />
              Saldırı hunisi — kaç zincir bu aşamaya ulaştı, kaçı burada kesildi
            </div>
            <div className="space-y-1">
              {ozet.asamaHunisi.map((h, i) => {
                const tanim = ASAMA_TANIM[h.asama];
                const Ikon = tanim.ikon;
                const asamaHex = ASAMA_RENK[h.asama];
                const oran = Math.round((h.ulasan / huniMax) * 100);
                // Kesme oranı — bu aşamaya ulaşanların ne kadarı burada durduruldu.
                const kesmeOran = h.ulasan > 0 ? Math.round((h.kesilen / h.ulasan) * 100) : 0;
                return (
                  <div key={h.asama} className="flex items-center gap-3">
                    {/* Aşama etiketi + sıra */}
                    <div className="flex w-[104px] shrink-0 items-center gap-1.5">
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold tabular-nums"
                        style={{ background: `${asamaHex}1f`, color: asamaHex }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex items-center gap-1 text-[11.5px] font-medium text-slate-muted">
                        <Ikon className="size-3.5 text-slate-faint" />
                        <span className="truncate">{tanim.kisa}</span>
                      </span>
                    </div>
                    {/* Daralan huni çubuğu (ortalanmış, gerçek funnel hissi) */}
                    <div className="flex min-w-0 flex-1 items-center">
                      <div className="flex h-7 w-full items-center justify-center overflow-hidden rounded-md bg-canvas">
                        <motion.div
                          className="flex h-full items-center justify-end rounded-md pr-2"
                          style={{ background: `${asamaHex}` }}
                          initial={azHareket ? false : { width: 0 }}
                          animate={azHareket ? undefined : { width: `${Math.max(8, oran)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="text-[11px] font-bold tabular-nums text-white">{sayi(h.ulasan)}</span>
                        </motion.div>
                      </div>
                    </div>
                    {/* Kesme rozeti */}
                    <div className="w-[64px] shrink-0 text-right">
                      {h.kesilen > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-700">
                          <ShieldCheck className="size-3" />
                          {sayi(h.kesilen)}
                          <span className="text-green-600/70">·%{kesmeOran}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-faint">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tehdit seviyesi dağılımı — segment/ısı şeridi + rozetler */}
          <div className="rounded-2xl border border-line bg-canvas/30 p-4 lg:col-span-4">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
              <Flame className="size-3.5 text-slate-faint" />
              Tehdit seviyesi dağılımı
            </div>
            {/* Segment şeridi (oranlı, tek satır ısı-bar) */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-canvas">
              {tehditDagilim
                .filter((t) => t.sayi > 0)
                .map((t) => (
                  <motion.div
                    key={t.seviye}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ background: TEHDIT_TANIM[t.seviye].hex }}
                    initial={azHareket ? false : { width: 0 }}
                    animate={azHareket ? undefined : { width: `${(t.sayi / (toplamTehdit || 1)) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
            </div>
            {/* Rozet-ızgarası (sayı + oran) */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tehditDagilim.map((t) => {
                const tt = TEHDIT_TANIM[t.seviye];
                const oran = toplamTehdit > 0 ? Math.round((t.sayi / toplamTehdit) * 100) : 0;
                return (
                  <div
                    key={t.seviye}
                    className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: tt.hex }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-slate-muted">{tt.etiket}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[15px] font-bold tabular-nums text-slate-ink">{sayi(t.sayi)}</span>
                        <span className="text-[10px] tabular-nums text-slate-faint">%{oran}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Zincir listesi */}
        {gosterilecek.length === 0 ? (
          <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Aktif saldırı zinciri yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              Çok-adımlı saldırgan davranışı tespit edildiğinde zincirler burada belirir.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {gosterilecek.map((z, i) => (
              <ZincirSatir
                key={z.ip}
                zincir={z}
                azHareket={azHareket}
                gecikme={azHareket ? 0 : 0.05 + i * 0.03}
              />
            ))}
          </div>
        )}

        {/* Aşama lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Aşamalar:</span>
          {ASAMA_SIRA.map((asama, i) => {
            const tanim = ASAMA_TANIM[asama];
            const Ikon = tanim.ikon;
            return (
              <span key={asama} className="inline-flex items-center gap-1.5 text-slate-muted">
                <Ikon className="size-3.5 text-slate-faint" />
                <span className="tabular-nums text-slate-faint">{i + 1}.</span>
                {tanim.ad}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-green-700">
            <ShieldCheck className="size-3.5" />
            Veylify'ın kestiği aşama
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
