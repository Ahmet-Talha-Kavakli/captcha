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

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Clock,
  MapPin,
  Server,
  Activity,
  ArrowRight,
  Copy,
  Check,
  Filter,
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

/* ============================================================ Drill-down detay */

/** verdict → TR etiket + ton. */
const VERDICT_TANIM: Record<string, { ad: string; ton: string; hex: string }> = {
  blocked: { ad: "Engellendi", ton: "text-red-700", hex: "#dc2626" },
  challenged: { ad: "Doğrulama", ton: "text-amber-700", hex: "#d97706" },
  flagged: { ad: "İşaretlendi", ton: "text-amber-700", hex: "#d97706" },
  allowed: { ad: "İzin verildi", ton: "text-green-700", hex: "#16a34a" },
};
function verdictTanim(v: string) {
  return VERDICT_TANIM[v] ?? { ad: v || "—", ton: "text-slate-muted", hex: "#64748b" };
}

/** Göreli zaman ("3dk önce") — page.tsx now'ını prop geçmediği için mutlak saat gösteririz. */
function saatBicim(ts: number): string {
  const d = new Date(ts);
  const ss = String(d.getHours()).padStart(2, "0");
  const dd = String(d.getMinutes()).padStart(2, "0");
  return `${ss}:${dd}`;
}

/** İki adım arası süre farkını insan-okur ver ("+2dk", "+15sn"). */
function farkBicim(ms: number): string {
  if (ms < 1000) return "+0sn";
  const sn = Math.round(ms / 1000);
  if (sn < 60) return `+${sn}sn`;
  const dk = Math.round(sn / 60);
  if (dk < 60) return `+${dk}dk`;
  return `+${Math.round(dk / 60)}sa`;
}

/** Zincire göre önerilen savunma aksiyonu (durduruldu mu / ne kadar ilerledi). */
function onerilenAksiyon(z: SaldirganZincir): { baslik: string; aciklama: string; ton: "yesil" | "sari" | "kirmizi" } {
  if (z.durduruldu && z.kesilenSira !== null && z.kesilenSira <= 3) {
    return { baslik: "Aksiyon gerekmiyor", aciklama: "Saldırı erken aşamada (keşif/tarama) otomatik kesildi. Mevcut kurallar bu aktörü etkili engelliyor.", ton: "yesil" };
  }
  if (z.durduruldu) {
    return { baslik: "İzle — kural sıkılaştır", aciklama: "Saldırı durduruldu ama ileri aşamaya ulaştı. Bu IP/ASN için erken-aşama kuralı ekleyerek kesme noktasını öne çekin.", ton: "sari" };
  }
  return { baslik: "Acil — kalıcı engelle", aciklama: `Saldırgan ${ASAMA_TANIM[z.ilerlemeAsama].ad} aşamasına ulaştı ve durdurulmadı. Bu IP'yi kalıcı engel listesine alın ve ASN geneli hız-limiti uygulayın.`, ton: "kirmizi" };
}

/** Genişleyen detay: adım-adım zaman çizelgesi + IP istihbaratı + önerilen aksiyon. */
function ZincirDetay({ zincir, siteId }: { zincir: SaldirganZincir; siteId: string | null }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  // GERÇEK AKSİYON: IP'yi engelle → kural motoruna field=ip/op=eq/action=block kuralı.
  const [engelDurum, setEngelDurum] = useState<"bos" | "gonderiliyor" | "engellendi" | "hata">("bos");
  const aksiyon = onerilenAksiyon(zincir);
  const aksiyonTon =
    aksiyon.ton === "yesil"
      ? "border-green-200 bg-ok-soft/40 text-green-800"
      : aksiyon.ton === "sari"
        ? "border-amber-200 bg-amber-50/60 text-amber-800"
        : "border-red-200 bg-danger-soft/40 text-red-800";
  const kopyala = () => {
    try {
      navigator.clipboard?.writeText(zincir.ip);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1500);
    } catch { /* pano yok */ }
  };
  const ipEngelle = async () => {
    if (!siteId || engelDurum === "gonderiliyor" || engelDurum === "engellendi") return;
    setEngelDurum("gonderiliyor");
    try {
      const r = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: `Engel: ${zincir.ip}`,
          description: `Kill-Chain'den engellendi — ${ASAMA_TANIM[zincir.ilerlemeAsama].ad} aşamasına ulaşan saldırgan.`,
          field: "ip",
          op: "eq",
          value: zincir.ip,
          action: "block",
          priority: 1,
        }),
      });
      setEngelDurum(r.ok ? "engellendi" : "hata");
    } catch {
      setEngelDurum("hata");
    }
  };
  const ilkTs = zincir.adimlar.length ? zincir.adimlar[0].ts : 0;

  return (
    <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-12">
      {/* Sol: adım-adım zaman çizelgesi */}
      <div className="lg:col-span-7">
        <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-muted">
          <Clock className="size-3.5 text-slate-faint" />
          Saldırı zaman çizelgesi — {sayi(zincir.adimlar.length)} adım
        </div>
        <div className="relative space-y-0">
          {zincir.adimlar.map((adim, i) => {
            const tanim = ASAMA_TANIM[adim.asama];
            const Ikon = tanim.ikon;
            const v = verdictTanim(adim.verdict);
            const asamaHex = ASAMA_RENK[adim.asama];
            const fark = i > 0 ? adim.ts - zincir.adimlar[i - 1].ts : 0;
            const sonMu = i === zincir.adimlar.length - 1;
            return (
              <div key={i} className="flex gap-3">
                {/* Dikey çizgi + nokta */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg ring-2 ring-inset",
                      adim.kesildi && "ring-green-300",
                    )}
                    style={{ background: `${asamaHex}18`, color: asamaHex, ...(adim.kesildi ? {} : { borderColor: `${asamaHex}33` }) }}
                  >
                    {adim.kesildi ? <ShieldCheck className="size-3.5 text-green-600" /> : <Ikon className="size-3.5" />}
                  </span>
                  {!sonMu && <span className="my-0.5 w-px flex-1 bg-line" style={{ minHeight: 18 }} />}
                </div>
                {/* İçerik */}
                <div className={cn("min-w-0 flex-1", sonMu ? "pb-0" : "pb-3")}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[12.5px] font-semibold text-slate-ink">{tanim.ad}</span>
                    <span className={cn("text-[11px] font-medium", v.ton)}>{v.ad}</span>
                    {adim.kesildi && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-1.5 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                        <ShieldCheck className="size-2.5" /> kesildi
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-faint">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="size-3" /> {saatBicim(adim.ts)}
                    </span>
                    {i > 0 && <span className="tabular-nums text-slate-300">{farkBicim(fark)}</span>}
                    {adim.path && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="truncate font-mono">{adim.path}</span>
                      </>
                    )}
                    {adim.botClass && adim.botClass !== "human" && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="truncate">{adim.botClass}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sağ: IP istihbaratı + önerilen aksiyon */}
      <div className="space-y-3 lg:col-span-5">
        <div className="rounded-xl border border-line bg-surface p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-muted">
            <Server className="size-3.5 text-slate-faint" />
            Aktör istihbaratı
          </div>
          <dl className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-faint"><MapPin className="size-3" /> IP adresi</dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-ink">{zincir.ip}</span>
                <button
                  onClick={kopyala}
                  className="grid size-5 place-items-center rounded text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
                  aria-label="IP adresini kopyala"
                >
                  {kopyalandi ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-faint"><Server className="size-3" /> ASN</dt>
              <dd className="truncate font-mono text-slate-ink">{zincir.asn}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-faint"><MapPin className="size-3" /> Ülke</dt>
              <dd className="flex items-center gap-1.5 text-slate-ink"><Ulke kod={zincir.country} /> {zincir.country}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-faint"><Activity className="size-3" /> Toplam olay</dt>
              <dd className="tabular-nums font-semibold text-slate-ink">{sayi(zincir.olaySayisi)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-faint"><GitBranch className="size-3" /> Ulaşılan aşama</dt>
              <dd className="tabular-nums font-semibold text-slate-ink">{zincir.ilerlemeSira}/6 · {ASAMA_TANIM[zincir.ilerlemeAsama].ad}</dd>
            </div>
          </dl>
        </div>

        {/* Önerilen aksiyon */}
        <div className={cn("rounded-xl border p-3.5", aksiyonTon)}>
          <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold">
            <ArrowRight className="size-3.5" />
            {aksiyon.baslik}
          </div>
          <p className="text-[11.5px] leading-relaxed opacity-90">{aksiyon.aciklama}</p>

          {/* GERÇEK AKSİYON: tek tıkla bu IP'yi engelle (kural motoruna block kuralı) */}
          {siteId && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={ipEngelle}
                disabled={engelDurum === "gonderiliyor" || engelDurum === "engellendi"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                  engelDurum === "engellendi"
                    ? "cursor-default bg-ok-soft text-green-700 ring-1 ring-inset ring-green-300"
                    : "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
                  engelDurum === "gonderiliyor" && "cursor-wait opacity-70",
                )}
              >
                {engelDurum === "engellendi" ? (
                  <><Check className="size-3.5" /> Engellendi</>
                ) : engelDurum === "gonderiliyor" ? (
                  <><Ban className="size-3.5 animate-pulse" /> Engelleniyor…</>
                ) : (
                  <><Ban className="size-3.5" /> Bu IP&apos;yi engelle</>
                )}
              </button>
              {engelDurum === "engellendi" && (
                <span className="text-[11px] text-green-700">Kural motoruna eklendi — bu IP artık bloklanır.</span>
              )}
              {engelDurum === "hata" && (
                <span className="text-[11px] text-red-700">Eklenemedi, tekrar deneyin.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Zincir satırı */

function ZincirSatir({
  zincir,
  azHareket,
  gecikme,
  acik,
  onToggle,
  siteId,
}: {
  zincir: SaldirganZincir;
  azHareket: boolean;
  gecikme: number;
  acik: boolean;
  onToggle: () => void;
  siteId: string | null;
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
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Üst şerit: kimlik + durum — TIKLANABİLİR (drill-down aç/kapa) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${zincir.ip} saldırı zinciri detayını ${acik ? "kapat" : "aç"}`}
        className="mb-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
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
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-faint transition-transform",
              acik && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Kill-chain görseli */}
      <KillChainBar zincir={zincir} azHareket={azHareket} gecikme={gecikme} />

      {/* Drill-down detay — tıklayınca açılır */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ZincirDetay zincir={zincir} siteId={siteId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function KillChainBolumu({
  zincirler,
  ozet,
  azHareket,
  siteId = null,
}: {
  zincirler: SaldirganZincir[];
  ozet: KillChainOzet;
  azHareket: boolean;
  siteId?: string | null;
}) {
  // Açık drill-down zinciri (IP) + tehdit-seviyesi filtresi (null = hepsi).
  const [acikIp, setAcikIp] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<SaldirganZincir["tehdit"] | null>(null);

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

  // Filtreye göre gösterilecek zincirler (en fazla 9). Filtre tıklandığında liste daralır.
  const gosterilecek = useMemo(
    () => zincirler.filter((z) => !filtre || z.tehdit === filtre).slice(0, 9),
    [zincirler, filtre],
  );

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
            {/* Rozet-ızgarası (sayı + oran) — TIKLANABİLİR FİLTRE */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tehditDagilim.map((t) => {
                const tt = TEHDIT_TANIM[t.seviye];
                const oran = toplamTehdit > 0 ? Math.round((t.sayi / toplamTehdit) * 100) : 0;
                const secili = filtre === t.seviye;
                return (
                  <button
                    key={t.seviye}
                    type="button"
                    onClick={() => { setFiltre(secili ? null : t.seviye); setAcikIp(null); }}
                    disabled={t.sayi === 0}
                    aria-pressed={secili}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                      secili ? "border-slate-400 bg-canvas ring-1 ring-inset ring-slate-300" : "border-line bg-surface hover:border-slate-300",
                      t.sayi === 0 && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: tt.hex }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-slate-muted">{tt.etiket}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[15px] font-bold tabular-nums text-slate-ink">{sayi(t.sayi)}</span>
                        <span className="text-[10px] tabular-nums text-slate-faint">%{oran}</span>
                      </div>
                    </div>
                    {secili && <Filter className="size-3 shrink-0 text-slate-muted" />}
                  </button>
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
          <>
            {filtre && (
              <div className="mt-4 flex items-center gap-2 text-[12px] text-slate-muted">
                <Filter className="size-3.5 text-slate-faint" />
                <span><span className="font-semibold text-slate-ink">{TEHDIT_TANIM[filtre].etiket}</span> tehditli {sayi(gosterilecek.length)} zincir gösteriliyor</span>
                <button
                  type="button"
                  onClick={() => setFiltre(null)}
                  className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-slate-muted transition hover:bg-canvas hover:text-slate-ink"
                >
                  Filtreyi kaldır
                </button>
              </div>
            )}
            <div className="mt-3 space-y-3">
              {gosterilecek.map((z, i) => (
                <ZincirSatir
                  key={z.ip}
                  zincir={z}
                  azHareket={azHareket}
                  gecikme={azHareket ? 0 : 0.05 + i * 0.03}
                  acik={acikIp === z.ip}
                  onToggle={() => setAcikIp(acikIp === z.ip ? null : z.ip)}
                  siteId={siteId}
                />
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-faint">
              <ChevronDown className="size-3" />
              Bir saldırgana tıklayarak adım-adım saldırı zaman çizelgesini ve önerilen aksiyonu görün.
            </p>
          </>
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
