"use client";

/**
 * Veylify — Canlı Savunma Akışı (Live Operations Console)
 * ======================================================
 * "Şu an ne oluyor" canlı operasyon panosu. `/api/live/stream` (Server-Sent
 * Events) üzerinden gerçek olay akışını dinler; EventSource yoksa `/api/live`
 * polling'e düşer. Datadog/Cloudflare canlı görünüm hissi, guven-merkezi'nin
 * ferah beyaz-kart diliyle.
 *
 * Üç şerit:
 *   1. 5 savunma katmanının canlı durumu (yeşil pulse).
 *   2. Canlı olay akışı — IP + ülke bayrağı + bot sınıf ikonu + karar rozeti
 *      + hangi katman yakaladı. En yeni üstte, yumuşak giriş.
 *   3. Sağ sütun: canlı sayaçlar (olay/dk, engellenen/dk, aktif tehdit) +
 *      bağlantı durumu göstergesi.
 *
 * KURAL: framer-motion'da opacity:0 ile giriş YOK (görünmezlik bug'ı) —
 * sadece initial={{y:N}} animate={{y:0}}. Yatay taşma yok.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, WifiOff, ArrowRight, Radio, ShieldCheck, Fingerprint, GitBranch, Cpu, Gauge } from "lucide-react";
import { Panel, VerdictRozet } from "@/components/panel/kit";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { bayrak, ULKE_AD } from "@/lib/flag";
import { cn } from "@/lib/cn";

/* Akıştan gelen tekil canlı olay (route.ts payload şekli). */
interface CanliOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  botClass: string;
  verdict: string;
  path: string;
  score: number;
  triggeredRules?: string[];
}

/* 5 savunma katmanı — kural/UA imzasından "hangi katman yakaladı" türetilir. */
const KATMANLAR = [
  { id: "ghost-font", ad: "Ghost-Font", ikon: Fingerprint, renk: "#2f6fed", desen: /ghost|font|dither/i },
  { id: "davranis", ad: "Davranış", ikon: Activity, renk: "#0891b2", desen: /davran|behav|biyometri/i },
  { id: "kural", ad: "Kural Motoru", ikon: GitBranch, renk: "#7c3aed", desen: /rule|kural|honeypot|imza/i },
  { id: "ai-filtre", ad: "AI Filtre", ikon: Cpu, renk: "#db2777", desen: /ai|gpt|claude|llm|agent/i },
  { id: "rate-limit", ad: "Rate Limit", ikon: Gauge, renk: "#d97706", desen: /rate|limit|flood|ddos/i },
] as const;

const BOT_ETIKET: Record<string, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam",
};

/** Bir olayın hangi savunma katmanı tarafından yakalandığını tahmin eder. */
function yakalayanKatman(o: CanliOlay): (typeof KATMANLAR)[number] {
  const kaynak = [(o.triggeredRules ?? []).join(" "), o.botClass, o.path].join(" ");
  for (const k of KATMANLAR) {
    if (k.desen.test(kaynak)) return k;
  }
  // Karara göre kaba düşüş: engelli → kural, meydan okuma → davranış.
  if (o.verdict === "blocked") return KATMANLAR[2];
  if (o.verdict === "challenged") return KATMANLAR[1];
  return KATMANLAR[0];
}

function ulkeAdi(kod: string): string {
  return ULKE_AD[(kod ?? "").toUpperCase()] ?? kod ?? "—";
}

const MAX_SATIR = 14; // akışta tutulan en fazla satır (bellek + görsel denge)
const PENCERE_MS = 60_000; // canlı sayaç penceresi (son 1 dk)

export function CanliSavunmaAkisi() {
  const [olaylar, setOlaylar] = useState<CanliOlay[]>([]);
  const [durum, setDurum] = useState<"baglaniyor" | "canli" | "polling" | "kapali">("baglaniyor");
  const olayRef = useRef<CanliOlay[]>([]);
  // Son 1 dk zaman damgaları (olay/dk hesabı) + engellenen zaman damgaları.
  const zamanRef = useRef<number[]>([]);
  const engelRef = useRef<number[]>([]);
  const [sayac, setSayac] = useState({ olayDk: 0, engelDk: 0, aktifTehdit: 0 });

  const olayEkle = useCallback((yeni: CanliOlay[]) => {
    if (!yeni.length) return;
    const simdi = Date.now();
    // Zaman pencerelerini güncelle.
    for (const o of yeni) {
      zamanRef.current.push(o.ts || simdi);
      if (o.verdict === "blocked" || o.verdict === "challenged") engelRef.current.push(o.ts || simdi);
    }
    const esik = simdi - PENCERE_MS;
    zamanRef.current = zamanRef.current.filter((t) => t >= esik);
    engelRef.current = engelRef.current.filter((t) => t >= esik);
    // En yeni üstte; MAX_SATIR ile sınırla.
    const birlesik = [...yeni].reverse().concat(olayRef.current).slice(0, MAX_SATIR);
    olayRef.current = birlesik;
    setOlaylar(birlesik);
    const aktifTehdit = birlesik.filter((o) => o.verdict === "blocked" || o.verdict === "challenged").length;
    setSayac({ olayDk: zamanRef.current.length, engelDk: engelRef.current.length, aktifTehdit });
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let since = Date.now() - 8000;
    let iptal = false;

    async function polla() {
      try {
        const r = await fetch(`/api/live?since=${since}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { now: number; events: CanliOlay[] };
        since = j.now ?? Date.now();
        if (!iptal) olayEkle(j.events ?? []);
      } catch { /* sessiz — bir sonraki tick yeniden dener */ }
    }

    function pollingBaslat() {
      setDurum("polling");
      polla();
      pollTimer = setInterval(polla, 3000);
    }

    if (typeof EventSource !== "undefined") {
      try {
        es = new EventSource("/api/live/stream");
        es.addEventListener("ready", () => { if (!iptal) setDurum("canli"); });
        es.onmessage = (ev) => {
          try {
            const j = JSON.parse(ev.data) as { now: number; events: CanliOlay[] };
            if (!iptal) { setDurum("canli"); olayEkle(j.events ?? []); }
          } catch { /* yut */ }
        };
        es.onerror = () => {
          // Stream koptu → temizle, polling'e düş.
          es?.close();
          es = null;
          if (!iptal && !pollTimer) pollingBaslat();
        };
      } catch {
        pollingBaslat();
      }
    } else {
      pollingBaslat();
    }

    return () => {
      iptal = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [olayEkle]);

  // Katman "canlılığı" — son akıştaki hangi katmanların hit aldığı (pulse için).
  const aktifKatmanlar = new Set(olaylar.map((o) => yakalayanKatman(o).id));

  const durumRenk =
    durum === "canli" ? "#16a34a" : durum === "polling" ? "#d97706" : durum === "kapali" ? "#dc2626" : "#6b6a63";
  const durumMetin =
    durum === "canli" ? "Canlı akış" : durum === "polling" ? "Yoklama modu" : durum === "kapali" ? "Bağlantı yok" : "Bağlanıyor…";

  return (
    <Panel
      baslik={
        <span className="flex items-center gap-2">
          <Radio className="size-[18px] text-brand-600" /> Canlı Savunma Akışı
        </span>
      }
      sagUst={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas/50 px-2.5 py-1 text-[12px] font-medium" style={{ color: durumRenk }}>
          <span className="relative flex size-2">
            {durum === "canli" && <span className="absolute inline-flex size-full animate-ping rounded-full opacity-70" style={{ background: durumRenk }} />}
            <span className="relative inline-flex size-2 rounded-full" style={{ background: durumRenk }} />
          </span>
          {durum === "kapali" ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}
          {durumMetin}
        </span>
      }
    >
      {/* 5 savunma katmanının canlı durumu */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {KATMANLAR.map((k) => {
          const Ikon = k.ikon;
          const aktif = aktifKatmanlar.has(k.id);
          return (
            <div key={k.id} className="flex items-center gap-2.5 rounded-2xl border border-line bg-canvas/40 px-3 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl" style={{ background: `${k.renk}14`, color: k.renk }}>
                <Ikon className="size-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-slate-ink">{k.ad}</p>
                <span className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: aktif ? "#16a34a" : "#9c9a90" }}>
                  <span className="relative flex size-1.5">
                    {aktif && <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-70" />}
                    <span className={cn("relative inline-flex size-1.5 rounded-full", aktif ? "bg-ok" : "bg-slate-300")} />
                  </span>
                  {aktif ? "yakalıyor" : "beklemede"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_236px]">
        {/* Canlı olay akışı */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">Canlı olay akışı</span>
            <Link href="/panel/trafik" className="flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700">
              Tüm trafik <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {olaylar.length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-line py-10 text-[13px] text-slate-faint">
                Canlı olaylar bekleniyor…
              </div>
            )}
            <AnimatePresence initial={false}>
              {olaylar.map((o) => {
                const g = botSinifGorsel(o.botClass);
                const Ikon = g.ikon;
                const kat = yakalayanKatman(o);
                return (
                  <motion.div
                    key={o.id}
                    layout
                    initial={{ y: -8 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl" style={{ background: g.soft, color: g.renk }}>
                      <Ikon className="size-4" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="num truncate text-[13px] font-semibold text-slate-ink">{o.ip}</span>
                        <span className="shrink-0 text-[13px]" title={ulkeAdi(o.country)}>{bayrak(o.country)}</span>
                      </div>
                      <p className="truncate text-[11.5px] text-slate-muted">
                        {BOT_ETIKET[o.botClass] ?? o.botClass} · <span className="num">{o.path}</span>
                      </p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium sm:inline-flex" style={{ background: `${kat.renk}12`, color: kat.renk }}>
                      {kat.ad}
                    </span>
                    <span className="shrink-0"><VerdictRozet verdict={o.verdict} boyut="sm" /></span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Canlı sayaçlar */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">Son 60 saniye</span>
          <SayacKart etiket="Olay / dk" deger={sayac.olayDk} renk="#2f6fed" ikon={<Activity className="size-4" />} />
          <SayacKart etiket="Engellenen / dk" deger={sayac.engelDk} renk="#dc2626" ikon={<ShieldCheck className="size-4" />} />
          <SayacKart etiket="Aktif tehdit" deger={sayac.aktifTehdit} renk="#d97706" ikon={<Radio className="size-4" />} alt="akıştaki son olaylar" />
        </div>
      </div>
    </Panel>
  );
}

function SayacKart({ etiket, deger, renk, ikon, alt }: { etiket: string; deger: number; renk: string; ikon: React.ReactNode; alt?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-muted">
        <span style={{ color: renk }}>{ikon}</span> {etiket}
      </div>
      <motion.p
        key={deger}
        initial={{ y: 4 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.25 }}
        className="num mt-0.5 text-[26px] font-bold leading-none"
        style={{ color: renk }}
      >
        {deger.toLocaleString("tr-TR")}
      </motion.p>
      {alt && <p className="mt-0.5 text-[10.5px] text-slate-faint">{alt}</p>}
    </div>
  );
}
