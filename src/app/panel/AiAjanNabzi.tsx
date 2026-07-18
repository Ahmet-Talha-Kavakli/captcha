"use client";

/**
 * Veylify — AI Ajan Nabzı (AI Agent Intelligence Pulse)
 * =====================================================
 * Ürünün KALBİ: LLM ajanlarını görünür kılar. `aiRadar` (AiBotRadar) prop'undan
 * beslenir — YENİ MOTOR YOK. GPTBot / ClaudeBot / Bytespider gibi en aktif AI
 * crawler'ları renkli baş-harf rozetiyle, kategorisiyle, 24s istek + politika
 * durumu + 7g mini trendiyle gösterir.
 *
 * Anlatı: "X AI ajanı sitenizi taradı, Y'si engellendi." Üstte kategori dağılımı
 * (eğitim taraması / arama-indeks / kullanıcı-ajanı).
 *
 * KURAL: framer-motion opacity:0 giriş YOK — sadece y-kayma. Yatay taşma yok.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Ban, ShieldQuestion, Check, GraduationCap, Search, MousePointerClick, ChevronDown, ShieldCheck, Loader2 } from "lucide-react";
import { Panel, Badge } from "@/components/panel/kit";
import { MiniSpark } from "@/components/panel/grafikler";
import type { AiBotRadar, AiAjan } from "@/lib/specter/ai-bot-radar";
import { AI_AJANLAR } from "@/lib/specter/ai-agents";
import { cn } from "@/lib/cn";

/** Radar ajan adı (ör. "GPTBot") → AI_AJANLAR id'si (ör. "gptbot") — politika API'si için. */
function ajanId(ad: string): string | null {
  const a = AI_AJANLAR.find((x) => x.urun.toLowerCase() === ad.toLowerCase());
  return a?.id ?? null;
}

/* AI ajan adı → kategori + marka rengi. Kategori: eğitim/arama/kullanıcı-ajanı. */
const AJAN_META: Record<string, { kategori: "egitim" | "arama" | "kullanici"; renk: string }> = {
  GPTBot: { kategori: "egitim", renk: "#10a37f" },
  "ChatGPT-User": { kategori: "kullanici", renk: "#10a37f" },
  ClaudeBot: { kategori: "egitim", renk: "#d97757" },
  "Claude-Web": { kategori: "kullanici", renk: "#d97757" },
  "anthropic-ai": { kategori: "egitim", renk: "#d97757" },
  PerplexityBot: { kategori: "arama", renk: "#20b8cd" },
  "Google-Extended": { kategori: "egitim", renk: "#4285f4" },
  CCBot: { kategori: "egitim", renk: "#f59e0b" },
  Bytespider: { kategori: "egitim", renk: "#ff0050" },
  Amazonbot: { kategori: "arama", renk: "#ff9900" },
  "Applebot-Extended": { kategori: "egitim", renk: "#555555" },
  "cohere-ai": { kategori: "egitim", renk: "#39594d" },
  Diffbot: { kategori: "arama", renk: "#0b5cff" },
  "Bilinmeyen AI": { kategori: "kullanici", renk: "#6b6a63" },
};

const KATEGORI = {
  egitim: { ad: "Eğitim taraması", ikon: GraduationCap, renk: "#7c3aed" },
  arama: { ad: "Arama & indeks", ikon: Search, renk: "#2f6fed" },
  kullanici: { ad: "Kullanıcı ajanı", ikon: MousePointerClick, renk: "#0891b2" },
} as const;

function ajanMeta(ad: string) {
  return AJAN_META[ad] ?? { kategori: "kullanici" as const, renk: "#6b6a63" };
}

/** Ajanın çoğunluk kararına göre politika durumu (izin / doğrula / engelle). */
function politika(a: AiAjan): { ad: string; ton: "yesil" | "sari" | "kirmizi"; ikon: React.ReactNode } {
  const meydan = a.olay - a.engellenen - a.izinVerilen;
  if (a.engellenen >= a.izinVerilen && a.engellenen >= meydan && a.engellenen > 0)
    return { ad: "Engelle", ton: "kirmizi", ikon: <Ban className="size-3" /> };
  if (meydan > a.izinVerilen)
    return { ad: "Doğrula", ton: "sari", ikon: <ShieldQuestion className="size-3" /> };
  return { ad: "İzin ver", ton: "yesil", ikon: <Check className="size-3" /> };
}

/** Tek AI ajan kartı — tıklanınca açılır, gerçek politika (izin/doğrula/engelle)
 *  değiştirilebilir (POST /api/ai-agents). Ürünün ana vaadi: AI'yı yönet. */
function AjanKart({ a, gecikme }: { a: AiAjan; gecikme: number }) {
  const meta = ajanMeta(a.ad);
  const kat = KATEGORI[meta.kategori];
  const pol = politika(a);
  const bas = a.ad.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "AI";
  const id = ajanId(a.ad);
  const resmi = id ? AI_AJANLAR.find((x) => x.id === id) : null;

  const [acik, setAcik] = useState(false);
  const [politikaSecim, setPolitikaSecim] = useState<string | null>(null);
  const [kaydeden, setKaydeden] = useState<string | null>(null);

  const politikaDegistir = async (yeni: string) => {
    if (!id || kaydeden) return;
    setKaydeden(yeni);
    try {
      const r = await fetch("/api/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: id, policy: yeni }),
      });
      if (r.ok) setPolitikaSecim(yeni);
    } catch { /* sessiz */ } finally {
      setKaydeden(null);
    }
  };

  const POLITIKALAR = [
    { key: "izin", ad: "İzin ver", ikon: Check, ton: "text-green-700 ring-green-300 data-[sec=true]:bg-ok-soft" },
    { key: "dogrula", ad: "Doğrula", ikon: ShieldQuestion, ton: "text-amber-700 ring-amber-300 data-[sec=true]:bg-amber-50" },
    { key: "engelle", ad: "Engelle", ikon: Ban, ton: "text-red-700 ring-red-300 data-[sec=true]:bg-danger-soft" },
  ];
  // Aktif politika: kullanıcı seçtiyse o, yoksa karardan türetilen öneri.
  const aktifPol = politikaSecim ?? (pol.ad === "İzin ver" ? "izin" : pol.ad === "Doğrula" ? "dogrula" : "engelle");

  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-2xl border bg-surface p-3.5", acik ? "border-slate-300 ring-1 ring-inset ring-slate-200" : "border-line")}
    >
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
        aria-label={`${a.ad} ajan detayını ${acik ? "kapat" : "aç"}`}
        className="flex w-full items-center gap-2.5 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl text-[12px] font-bold text-white" style={{ background: meta.renk }}>
          {bas}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-slate-ink">{a.ad}</p>
          <p className="truncate text-[11px] text-slate-faint">{kat.ad}</p>
        </div>
        <Badge ton={pol.ton === "yesil" ? "yesil" : pol.ton === "sari" ? "sari" : "kirmizi"}>
          {pol.ikon} {pol.ad}
        </Badge>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-faint transition-transform", acik && "rotate-180")} />
      </button>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="num text-[20px] font-bold leading-none text-slate-ink">{a.olay.toLocaleString("tr-TR")}</p>
          <p className="mt-0.5 text-[10.5px] text-slate-muted">24s istek · {a.engellenen} engelli</p>
        </div>
        <div className="w-24 shrink-0">
          <MiniSpark tohum={a.ad} renk={meta.renk} yukseklik={30} />
        </div>
      </div>

      {/* Drill-down: istihbarat + GERÇEK politika değiştir */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2.5 border-t border-line pt-3 text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-faint">Amaç</span>
                <span className="font-medium text-slate-ink">{kat.ad}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-faint">İzin verilen / engellenen</span>
                <span className="num font-medium text-slate-ink">{a.izinVerilen} / {a.engellenen}</span>
              </div>
              {resmi && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-faint">Doğrulama yöntemi</span>
                    <span className="font-medium text-slate-ink">{resmi.dogrulama === "ip_aralik" ? "IP aralığı" : resmi.dogrulama === "reverse_dns" ? "Ters-DNS" : "Yok"}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-muted">{resmi.aciklama}</p>
                </>
              )}
            </div>

            {/* GERÇEK AKSİYON: politikayı değiştir (izin/doğrula/engelle) */}
            {id ? (
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">Bu ajana politika</p>
                <div className="flex items-center gap-1.5">
                  {POLITIKALAR.map((p) => {
                    const Ikon = p.ikon;
                    const sec = aktifPol === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        data-sec={sec}
                        onClick={() => politikaDegistir(p.key)}
                        disabled={!!kaydeden}
                        aria-pressed={sec}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold ring-1 ring-inset transition focus:outline-none focus-visible:ring-2",
                          p.ton,
                          sec ? "" : "opacity-55 hover:opacity-100",
                          kaydeden && "cursor-wait",
                        )}
                      >
                        {kaydeden === p.key ? <Loader2 className="size-3 animate-spin" /> : <Ikon className="size-3" />}
                        {p.ad}
                      </button>
                    );
                  })}
                </div>
                {politikaSecim && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-green-700">
                    <ShieldCheck className="size-3" /> Politika kaydedildi — anında uygulanır.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-slate-faint">Bu ajan için doğrulanabilir kimlik/politika yok (tanımsız imza).</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AiAjanNabzi({ aiRadar }: { aiRadar: AiBotRadar }) {
  const ajanlar = aiRadar.ajanlar.slice(0, 6);
  const toplam = aiRadar.toplamAiTrafik;
  const engellenen = aiRadar.politikaDurum.engellenen;
  const eg = aiRadar.egilim;

  // Kategori dağılımı — ajanların olay sayısını kategorilere topla.
  const katSayim: Record<"egitim" | "arama" | "kullanici", number> = { egitim: 0, arama: 0, kullanici: 0 };
  for (const a of aiRadar.ajanlar) katSayim[ajanMeta(a.ad).kategori] += a.olay;
  const katToplam = katSayim.egitim + katSayim.arama + katSayim.kullanici || 1;

  const EgilimIkon = eg.yon === "artis" ? ArrowUpRight : eg.yon === "azalis" ? ArrowDownRight : Minus;
  const egilimRenk = eg.yon === "artis" ? "#dc2626" : eg.yon === "azalis" ? "#16a34a" : "#6b6a63";

  return (
    <Panel
      baslik={
        <span className="flex items-center gap-2">
          <Cpu className="size-[18px] text-brand-600" /> AI Ajan Nabzı
        </span>
      }
      sagUst={
        <Link href="/panel/ai-ajanlar" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          AI ajanları <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {/* Anlatı bandı + kategori dağılımı */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
          <p className="text-[15px] leading-relaxed text-slate-ink">
            {toplam > 0 ? (
              <>
                <b className="num text-brand-700">{aiRadar.ozet.taninanAjan}</b> AI ajanı sitenizi taradı;{" "}
                <b className="num">{toplam.toLocaleString("tr-TR")}</b> istekten{" "}
                <b className="num text-danger2">{engellenen.toLocaleString("tr-TR")}</b>'i engellendi.
              </>
            ) : (
              <>Henüz AI ajan trafiği gözlemlenmedi. Radar aktif ve dinliyor.</>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: egilimRenk }}>
              <EgilimIkon className="size-3.5" /> 24s: {eg.son24.toLocaleString("tr-TR")} istek
              {eg.yon !== "sabit" && <span className="num">(%{Math.abs(eg.yuzde)})</span>}
            </span>
            {aiRadar.ozet.enAktifAjan && (
              <span className="text-slate-muted">En aktif: <b className="text-slate-ink">{aiRadar.ozet.enAktifAjan}</b></span>
            )}
            {aiRadar.bilinmeyenBot > 0 && (
              <span className="text-slate-muted">Gri bölge: <b className="num text-slate-ink">{aiRadar.bilinmeyenBot.toLocaleString("tr-TR")}</b> tanımsız</span>
            )}
          </div>
        </div>

        {/* Kategori dağılımı */}
        <div className="space-y-3 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">Amaç dağılımı</span>
          {(Object.keys(KATEGORI) as (keyof typeof KATEGORI)[]).map((k) => {
            const meta = KATEGORI[k];
            const Ikon = meta.ikon;
            const oran = (katSayim[k] / katToplam) * 100;
            return (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-slate-muted">
                    <Ikon className="size-3.5" style={{ color: meta.renk }} /> {meta.ad}
                  </span>
                  <span className="num font-semibold text-slate-ink">{katSayim[k].toLocaleString("tr-TR")}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div className="h-full rounded-full" style={{ background: meta.renk }} initial={{ width: 0 }} animate={{ width: `${oran}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* En aktif AI crawler'lar */}
      <div className="mt-6">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">En aktif AI crawler'lar</span>
        {ajanlar.length === 0 ? (
          <div className="mt-3 grid place-items-center rounded-2xl border border-dashed border-line py-8 text-[13px] text-slate-faint">
            AI ajan tespit edilmedi.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ajanlar.map((a, i) => (
              <AjanKart key={a.ad} a={a} gecikme={i * 0.04} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
