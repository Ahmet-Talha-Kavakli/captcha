"use client";

/**
 * Canlı Olay Konsolu — gerçek-zamanlı SOC akış konsolu.
 * ====================================================
 * Bot trafiği için "tail -f": SSE ile gelen olaylar tabloya BAŞTAN eklenir
 * (prepend), en fazla ~200 satır bellekte tutulur (en eski düşer). Filtreler
 * (verdict / botClass / metin arama) akışa gerçek zamanlı uygulanır. Sağda
 * seçilen olayın tüm alanlarını gösteren detay çekmecesi açılır.
 *
 * Canlı veri altyapısı hazır (buradan yalnızca TÜKETİLİR):
 *   - SSE: /api/live/stream  → data: {events:[...]}  (~2sn'de bir)
 *   - Fallback: GET /api/live?since=<ts> → {events: [...]}
 * SSE + polling-fallback deseni KomutaSeridi'den birebir kopyalandı.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Terminal, Search, X, Ban, ShieldCheck, ShieldAlert, Bot, Activity,
  Fingerprint, Play, Pause, ArrowDownToLine, Users, Gauge, Zap,
  Filter, ChevronRight, Cpu, Globe, Clock, Hash, ExternalLink,
} from "lucide-react";
import { Ulke } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { konsolCeviri } from "./canli-konsol.i18n";

/** Sayfa geneli çeviri kısayolu tipi (alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ Tipler */
/** Konsolun tükettiği düzleştirilmiş olay (sunucu sayfası bunu üretir). */
export interface KonsolOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  asn: string;
  ua: string;
  path: string;
  botClass: string;
  verdict: string;
  score: number;
  method: string;
  latency: number;
  ja3?: string;
  headless?: boolean;
  sinyaller?: string[];
}

/** Canlı akıştan gelen ham olay (opsiyonel alanlarla). */
interface AkisOlay extends Partial<KonsolOlay> {
  id: string;
  ts: number;
  verdict: string;
}

const MAX_SATIR = 200; // bellekte tutulan en fazla satır
const SPARK_ORNEK = 30; // olay/sn grafiğinde tutulan örnek sayısı

/** Dil kodu → Intl yerel etiketi (tarih/sayı biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ Etiketler */
// Enum güvenliği: bot sınıfı ve verdict DEĞERLERİ (enum) sabit kalır; kullanıcı
// etiketi render sırasında t("kk.bot.<deger>") / t("kk.verdict.<deger>") ile çözülür.
const BOT_SINIFLAR = [
  "human", "good_bot", "automation", "scraper",
  "credential_stuffing", "ai_agent", "ddos", "spam",
];
/** Bot sınıfı enum değeri → yerelleştirilmiş etiket (bilinmeyen değer aynen döner). */
const botEtiket = (t: Ceviri, deger: string) => {
  const cev = t(`kk.bot.${deger}`);
  return cev === `kk.bot.${deger}` ? deger : cev;
};

const VERDICTLER = ["allowed", "blocked", "challenged", "flagged"];
/** Verdict enum değeri → yerelleştirilmiş etiket. */
const verdictEtiket = (t: Ceviri, deger: string) => t(`kk.verdict.${deger}`);

/** Verdict → renk sınıfları (koyu konsol zemininde okunur). */
const VERDICT_STIL: Record<string, { nokta: string; pill: string }> = {
  allowed: { nokta: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  blocked: { nokta: "bg-red-400", pill: "bg-red-500/15 text-red-300 ring-red-500/30" },
  challenged: { nokta: "bg-amber-400", pill: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  flagged: { nokta: "bg-slate-400", pill: "bg-slate-500/20 text-slate-300 ring-slate-500/30" },
};

function saatBicim(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ Ana bileşen */
export function CanliKonsolIstemci({ ilkOlaylar, dil }: { ilkOlaylar: KonsolOlay[]; dil: Dil }) {
  const t = useCallback((anahtar: string) => konsolCeviri(anahtar, dil), [dil]);
  // Akış tamponu — en yeni üstte. İlk parti ters çevrilerek en yeni başa alınır
  // (Events.forOwner zaten en yeniyi başta döndürür, o yüzden aynen kullanılır).
  const [olaylar, setOlaylar] = useState<KonsolOlay[]>(() => ilkOlaylar.slice(0, MAX_SATIR));
  const [canli, setCanli] = useState(true);
  const [otoKaydir, setOtoKaydir] = useState(true);
  // Bağlantı durumu: konsol duraklatıldığında "durdu", SSE açılana kadar
  // "baglaniyor", SSE açıkken "canli", SSE koptuğunda yedek-polling'e düşüldüğü
  // için "yedek". Kullanıcı akışın gerçekten canlı mı yoksa yedekte mi
  // olduğunu akış başlığındaki rozetten görür.
  const [baglanti, setBaglanti] = useState<"baglaniyor" | "canli" | "yedek" | "durdu">("baglaniyor");

  // Oturum sayaçları (canlı akıştan biriken).
  const [oturumToplam, setOturumToplam] = useState(0);
  const [rps, setRps] = useState(0);
  const [spark, setSpark] = useState<number[]>([]);

  // Filtreler.
  const [verdictFiltre, setVerdictFiltre] = useState<Set<string>>(new Set());
  const [sinifFiltre, setSinifFiltre] = useState<Set<string>>(new Set());
  const [arama, setArama] = useState("");
  const [yalnizTehdit, setYalnizTehdit] = useState(false);

  const [secili, setSecili] = useState<KonsolOlay | null>(null);

  const sinceRef = useRef(Date.now());
  const akisUcuRef = useRef<HTMLDivElement>(null);

  // Hareket-azalt tercihi (satır animasyonlarını kapatmak için).
  const [azaltilmisHareket, setAzaltilmisHareket] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uygula = () => setAzaltilmisHareket(mq.matches);
    uygula();
    mq.addEventListener?.("change", uygula);
    return () => mq.removeEventListener?.("change", uygula);
  }, []);

  // İlk tohumun en yeni ts'ini başlangıç noktası yap (tekrar çekmemek için).
  useEffect(() => {
    if (ilkOlaylar.length) {
      sinceRef.current = Math.max(...ilkOlaylar.map((e) => e.ts));
    }
  }, [ilkOlaylar]);

  /* ----- Gelen olayları tampona ekle (prepend + kapak) ----- */
  const olaylariEkle = useCallback((gelen: AkisOlay[]) => {
    if (!gelen.length) return;
    // Yalnızca tam alanlı olayları göster; canlı akış tüm alanları taşır.
    const tam = gelen.filter((e): e is KonsolOlay =>
      e.ip !== undefined && e.botClass !== undefined && e.path !== undefined,
    );
    if (!tam.length) return;
    // En yeni en üstte olacak şekilde (ts azalan) sırala, sonra prepend.
    const sirali = [...tam].sort((a, b) => b.ts - a.ts);
    setOlaylar((onceki) => {
      // Var olan id'leri ele (SSE + fallback çakışmasına karşı).
      const varlar = new Set(onceki.map((e) => e.id));
      const yeni = sirali.filter((e) => !varlar.has(e.id));
      if (!yeni.length) return onceki;
      return [...yeni, ...onceki].slice(0, MAX_SATIR);
    });
    setOturumToplam((n) => n + tam.length);
  }, []);

  /* ----- SSE + polling-fallback (KomutaSeridi deseni) ----- */
  useEffect(() => {
    if (!canli) {
      setBaglanti("durdu");
      return;
    }
    setBaglanti("baglaniyor");
    let iptal = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const isle = (gelen: AkisOlay[], pencereSn: number) => {
      if (iptal) return;
      if (gelen.length) {
        sinceRef.current = Math.max(sinceRef.current, ...gelen.map((e) => e.ts));
        olaylariEkle(gelen);
        const hiz = Math.round(gelen.length / pencereSn);
        setRps(hiz);
        setSpark((p) => [...p, hiz].slice(-SPARK_ORNEK));
      } else {
        setRps(0);
        setSpark((p) => [...p, 0].slice(-SPARK_ORNEK));
      }
    };

    const pollBasla = () => {
      if (pollTimer) return;
      if (!iptal) setBaglanti("yedek");
      async function cek() {
        try {
          const r = await fetch(`/api/live?since=${sinceRef.current}`);
          if (!r.ok) return;
          const d = await r.json();
          isle(d.events || [], 3);
        } catch { /* sessiz */ }
      }
      cek();
      pollTimer = setInterval(cek, 3000);
    };

    if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
      try {
        es = new EventSource("/api/live/stream");
        es.onopen = () => {
          if (!iptal) setBaglanti("canli");
        };
        es.onmessage = (ev) => {
          if (!iptal) setBaglanti("canli");
          try {
            const d = JSON.parse(ev.data);
            if (Array.isArray(d.events)) isle(d.events, 2);
          } catch { /* ready/ping */ }
        };
        es.onerror = () => {
          // SSE koparsa polling'e düş.
          es?.close();
          es = null;
          pollBasla();
        };
      } catch {
        es = null;
        pollBasla();
      }
    } else {
      pollBasla();
    }

    return () => {
      iptal = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canli, olaylariEkle]);

  /* ----- Filtre uygulanmış görünüm (canlı) ----- */
  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return olaylar.filter((e) => {
      // "yalnızca tehditler" → engellenen + doğrulanan.
      if (yalnizTehdit && !(e.verdict === "blocked" || e.verdict === "challenged")) return false;
      if (verdictFiltre.size && !verdictFiltre.has(e.verdict)) return false;
      if (sinifFiltre.size && !sinifFiltre.has(e.botClass)) return false;
      if (q) {
        const hedef = `${e.ip} ${e.path} ${e.asn}`.toLowerCase();
        if (!hedef.includes(q)) return false;
      }
      return true;
    });
  }, [olaylar, arama, yalnizTehdit, verdictFiltre, sinifFiltre]);

  /* ----- Oturum mini-metrikleri (filtresiz tampon üzerinden) ----- */
  const metrik = useMemo(() => {
    let blocked = 0, challenged = 0, allowed = 0;
    const ipler = new Set<string>();
    for (const e of olaylar) {
      if (e.verdict === "blocked") blocked++;
      else if (e.verdict === "challenged") challenged++;
      else if (e.verdict === "allowed") allowed++;
      ipler.add(e.ip);
    }
    return { toplam: olaylar.length, blocked, challenged, allowed, ipler: ipler.size };
  }, [olaylar]);

  /* ----- Oto-kaydırma: yeni olay gelince en üste (akış tepesine) tut ----- */
  useEffect(() => {
    if (!otoKaydir || !canli) return;
    akisUcuRef.current?.scrollTo({ top: 0, behavior: azaltilmisHareket ? "auto" : "smooth" });
  }, [filtreli, otoKaydir, canli, azaltilmisHareket]);

  const verdictToggle = (v: string) =>
    setVerdictFiltre((p) => {
      const y = new Set(p);
      y.has(v) ? y.delete(v) : y.add(v);
      return y;
    });
  const sinifToggle = (v: string) =>
    setSinifFiltre((p) => {
      const y = new Set(p);
      y.has(v) ? y.delete(v) : y.add(v);
      return y;
    });
  const filtreTemizle = () => {
    setVerdictFiltre(new Set());
    setSinifFiltre(new Set());
    setArama("");
    setYalnizTehdit(false);
  };
  const filtreAktif = verdictFiltre.size > 0 || sinifFiltre.size > 0 || arama.trim() !== "" || yalnizTehdit;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-6 pt-6 pb-10 lg:px-10">
      {/* Üst bilgi bandı */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-slate-ink text-emerald-400">
            <Terminal className="size-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-ink">{t("kk.baslik")}</h1>
            <p className="mt-0.5 text-[13px] text-slate-muted">{t("kk.altbaslik.on")} <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px]">tail -f</code> {t("kk.altbaslik.son")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOtoKaydir((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition",
              otoKaydir ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line bg-surface text-slate-muted hover:text-slate-ink",
            )}
          >
            <ArrowDownToLine className="size-3.5" /> {otoKaydir ? t("kk.otoKaydirAcik") : t("kk.dondur")}
          </button>
          <button
            onClick={() => setCanli((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition",
              canli ? "bg-ink-900 hover:bg-ink-800" : "bg-emerald-600 hover:bg-emerald-500",
            )}
          >
            {canli ? <><Pause className="size-3.5" /> {t("kk.duraklat")}</> : <><Play className="size-3.5" /> {t("kk.devamEt")}</>}
          </button>
        </div>
      </div>

      {/* Mini-metrik şeridi */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetrikKart
          etiket={t("kk.m.olayHizi")} deger={rps} birim={t("kk.m.olaySn")} ikon={<Activity className="size-4" />}
          ekstra={<Sparkline veri={spark} />} dil={dil}
        />
        <MetrikKart etiket={t("kk.m.buOturum")} deger={oturumToplam} birim={t("kk.m.olay")} ikon={<Zap className="size-4" />} dil={dil} />
        <MetrikKart etiket={t("kk.m.engellenen")} deger={metrik.blocked} ton="danger" ikon={<Ban className="size-4" />} dil={dil} />
        <MetrikKart etiket={t("kk.m.dogrulanan")} deger={metrik.challenged} ton="warn" ikon={<ShieldAlert className="size-4" />} dil={dil} />
        <MetrikKart etiket={t("kk.m.izinVerilen")} deger={metrik.allowed} ton="ok" ikon={<ShieldCheck className="size-4" />} dil={dil} />
        <MetrikKart etiket={t("kk.m.benzersizIp")} deger={metrik.ipler} birim={t("kk.m.ip")} ikon={<Users className="size-4" />} dil={dil} />
      </div>

      {/* Filtre çubuğu */}
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
            <Filter className="size-3.5" /> {t("kk.filtreler")}
          </div>
          {/* Arama */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder={t("kk.araPlaceholder")}
              aria-label={t("kk.aramaLabel")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-9 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
            {arama && (
              <button onClick={() => setArama("")} aria-label={t("kk.aramaTemizle")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {/* Hızlı: yalnızca tehditler */}
          <button
            onClick={() => setYalnizTehdit((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition",
              yalnizTehdit ? "border-red-300 bg-danger-soft text-red-700" : "border-line bg-surface text-slate-muted hover:text-slate-ink",
            )}
          >
            <ShieldAlert className="size-3.5" /> {t("kk.yalnizTehditler")}
          </button>
          {filtreAktif && (
            <button onClick={filtreTemizle} className="flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium text-brand-600 transition hover:text-brand-700">
              <X className="size-3.5" /> {t("kk.temizle")}
            </button>
          )}
        </div>

        {/* Verdict çipleri */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-faint">{t("kk.karar")}</span>
          {VERDICTLER.map((v) => {
            const secili = verdictFiltre.has(v);
            return (
              <button
                key={v}
                onClick={() => verdictToggle(v)}
                aria-pressed={secili}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition",
                  secili ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line bg-canvas/40 text-slate-muted hover:border-line-strong",
                )}
              >
                <span className={cn("size-2 rounded-full", VERDICT_STIL[v]?.nokta ?? "bg-slate-400")} />
                {verdictEtiket(t, v)}
              </button>
            );
          })}
        </div>

        {/* Bot sınıfı çipleri */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-faint">{t("kk.botSinifi")}</span>
          {BOT_SINIFLAR.map((c) => {
            const secili = sinifFiltre.has(c);
            return (
              <button
                key={c}
                onClick={() => sinifToggle(c)}
                aria-pressed={secili}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12.5px] font-medium transition",
                  secili ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line bg-canvas/40 text-slate-muted hover:border-line-strong",
                )}
              >
                {botEtiket(t, c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Akış + detay */}
      <div className={cn("grid gap-5", secili ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1")}>
        {/* Akış paneli (koyu) */}
        <div className="overflow-hidden rounded-3xl border border-line bg-slate-ink text-white">
          {/* Akış başlığı */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-2.5">
              {(() => {
                // Bağlantı durumu → nokta rengi + pill etiketi/tonu.
                const nabizAt = canli && baglanti !== "durdu" && !azaltilmisHareket;
                const durum =
                  baglanti === "durdu"
                    ? { nokta: "bg-slate-500", pill: "bg-white/10 text-white/60", etiket: t("kk.duraklatildi") }
                    : baglanti === "canli"
                    ? { nokta: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300", etiket: t("kk.canli") }
                    : baglanti === "yedek"
                    ? { nokta: "bg-amber-400", pill: "bg-amber-500/15 text-amber-300", etiket: t("kk.yedekAkis") }
                    : { nokta: "bg-sky-400", pill: "bg-sky-500/15 text-sky-300", etiket: t("kk.baglaniyor") };
                return (
                  <>
                    <span className="relative flex size-2.5">
                      {nabizAt && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-70", durum.nokta)} />}
                      <span className={cn("relative inline-flex size-2.5 rounded-full", durum.nokta)} />
                    </span>
                    <span className="text-[14px] font-semibold">{t("kk.olayAkisi")}</span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors", durum.pill)}>
                      {durum.etiket}
                    </span>
                  </>
                );
              })()}
              <span className="num text-[12px] text-white/40">{filtreli.length} / {olaylar.length} {t("kk.satir")}</span>
            </div>
            {filtreAktif && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-brand-300">
                <Filter className="size-3" /> {t("kk.filtreUygulaniyor")}
              </span>
            )}
          </div>

          {/* Kolon başlıkları (masaüstü) */}
          <div className="hidden grid-cols-[76px_100px_120px_130px_1fr_60px_64px] gap-2 border-b border-white/[0.06] px-5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/35 lg:grid">
            <span>{t("kk.kol.saat")}</span><span>{t("kk.kol.karar")}</span><span>{t("kk.kol.sinif")}</span><span>{t("kk.kol.ip")}</span><span>{t("kk.kol.yol")}</span><span className="text-right">{t("kk.kol.skor")}</span><span className="text-right">{t("kk.kol.gecikme")}</span>
          </div>

          {/* Akış gövdesi */}
          <div ref={akisUcuRef} className="max-h-[62vh] overflow-y-auto">
            {filtreli.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Terminal className="mb-3 size-8 text-white/20" />
                <p className="text-sm font-medium text-white/60">
                  {olaylar.length === 0 ? t("kk.bos.bekleniyor") : t("kk.bos.eslesmeYok")}
                </p>
                <p className="mt-1 text-[12px] text-white/30">
                  {olaylar.length === 0 ? t("kk.bos.bekleniyorAlt") : t("kk.bos.eslesmeYokAlt")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {filtreli.map((e) => (
                  <OlaySatir
                    key={e.id}
                    olay={e}
                    secili={secili?.id === e.id}
                    azaltilmisHareket={azaltilmisHareket}
                    onClick={() => setSecili((s) => (s?.id === e.id ? null : e))}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detay çekmecesi */}
        {secili && <DetayCekmece olay={secili} onKapat={() => setSecili(null)} t={t} dil={dil} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Olay satırı */
function OlaySatir({
  olay, secili, azaltilmisHareket, onClick, t,
}: {
  olay: KonsolOlay; secili: boolean; azaltilmisHareket: boolean; onClick: () => void; t: Ceviri;
}) {
  const stil = VERDICT_STIL[olay.verdict] ?? VERDICT_STIL.flagged;
  const skorYuzde = Math.round(olay.score * 100);
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "grid w-full grid-cols-[76px_1fr] items-center gap-2 px-5 py-2.5 text-left transition hover:bg-white/[0.04] lg:grid-cols-[76px_100px_120px_130px_1fr_60px_64px]",
          secili && "bg-brand-500/10",
          !azaltilmisHareket && "animate-fade-up",
        )}
      >
        {/* Saat */}
        <span className="num text-[12px] font-medium text-white/50 tabular-nums">{saatBicim(olay.ts)}</span>

        {/* Karar pill */}
        <span className={cn("hidden w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset lg:inline-flex", stil.pill)}>
          <span className={cn("size-1.5 rounded-full", stil.nokta)} /> {verdictEtiket(t, olay.verdict)}
        </span>

        {/* Sınıf */}
        <span className="hidden text-[12.5px] text-white/70 lg:block">{botEtiket(t, olay.botClass)}</span>

        {/* IP + bayrak (mobilde ikinci sütun toplu) */}
        <span className="flex min-w-0 items-center gap-2 lg:contents">
          <span className="num truncate text-[12.5px] font-medium text-white/85 lg:block">{olay.ip}</span>
          <span className="hidden truncate text-[12.5px] text-white/45 lg:block">{olay.path}</span>
        </span>

        {/* Skor (masaüstü) */}
        <span className={cn("num hidden text-right text-[12px] font-semibold tabular-nums lg:block", skorYuzde < 40 ? "text-red-300" : skorYuzde < 70 ? "text-amber-300" : "text-emerald-300")}>
          {skorYuzde}
        </span>

        {/* Gecikme (masaüstü) */}
        <span className="num hidden text-right text-[12px] text-white/40 tabular-nums lg:block">{olay.latency}ms</span>

        {/* Mobil ikinci satır özeti */}
        <span className="col-span-2 mt-1 flex items-center gap-2 text-[11px] text-white/45 lg:hidden">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ring-1 ring-inset", stil.pill)}>{verdictEtiket(t, olay.verdict)}</span>
          <span className="truncate">{olay.path}</span>
          <span className="ml-auto num">{skorYuzde} · {olay.latency}ms</span>
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ Detay çekmecesi */
function DetayCekmece({ olay, onKapat, t, dil }: { olay: KonsolOlay; onKapat: () => void; t: Ceviri; dil: Dil }) {
  const stil = VERDICT_STIL[olay.verdict] ?? VERDICT_STIL.flagged;
  const skorYuzde = Math.round(olay.score * 100);
  const yerel = YEREL[dil];
  return (
    <aside className="h-fit overflow-hidden rounded-3xl border border-line bg-surface lg:sticky lg:top-4">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset", stil.pill)}>
            <span className={cn("size-2 rounded-full", stil.nokta)} /> {verdictEtiket(t, olay.verdict)}
          </span>
          <span className="text-[14px] font-semibold text-slate-ink">{t("kk.detay.baslik")}</span>
        </div>
        <button onClick={onKapat} aria-label={t("kk.detay.kapat")} className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[64vh] space-y-4 overflow-y-auto px-5 py-4">
        {/* Skor + gecikme */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-faint"><Gauge className="size-3.5" /> {t("kk.detay.insanlikSkoru")}</div>
            <div className={cn("num mt-1 text-[24px] font-bold leading-none", skorYuzde < 40 ? "text-danger2" : skorYuzde < 70 ? "text-warn" : "text-ok")}>{skorYuzde}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-faint"><Clock className="size-3.5" /> {t("kk.detay.gecikme")}</div>
            <div className="num mt-1 text-[24px] font-bold leading-none text-slate-ink">{olay.latency}<span className="text-[13px] font-medium text-slate-muted">ms</span></div>
          </div>
        </div>

        {/* Alan listesi */}
        <div className="space-y-0.5">
          <Alan ikon={<Clock className="size-3.5" />} etiket={t("kk.detay.zaman")} deger={new Date(olay.ts).toLocaleString(yerel)} />
          <Alan ikon={<Bot className="size-3.5" />} etiket={t("kk.detay.botSinifi")} deger={botEtiket(t, olay.botClass)} />
          <Alan ikon={<Hash className="size-3.5" />} etiket={t("kk.detay.ip")} mono deger={olay.ip} />
          <Alan ikon={<Globe className="size-3.5" />} etiket={t("kk.detay.ulke")} deger={<Ulke kod={olay.country} />} />
          <Alan ikon={<Cpu className="size-3.5" />} etiket={t("kk.detay.asn")} mono deger={olay.asn} />
          <Alan ikon={<ChevronRight className="size-3.5" />} etiket={t("kk.detay.yontemYol")} mono deger={`${olay.method} ${olay.path}`} />
          {olay.ja3 && <Alan ikon={<Fingerprint className="size-3.5" />} etiket={t("kk.detay.ja3")} mono deger={olay.ja3} />}
          {olay.headless !== undefined && (
            <Alan ikon={<Fingerprint className="size-3.5" />} etiket={t("kk.detay.headless")} deger={olay.headless ? t("kk.detay.headlessEvet") : t("kk.detay.headlessHayir")} />
          )}
        </div>

        {/* User-Agent */}
        <div>
          <div className="mb-1 text-[11px] font-medium text-slate-faint">{t("kk.detay.userAgent")}</div>
          <p className="break-all rounded-xl border border-line bg-canvas/40 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-slate-muted">{olay.ua}</p>
        </div>

        {/* Sinyaller */}
        {olay.sinyaller && olay.sinyaller.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-medium text-slate-faint">{t("kk.detay.tespitSinyalleri")}</div>
            <div className="flex flex-wrap gap-1.5">
              {olay.sinyaller.map((s, i) => (
                <span key={i} className="rounded-full bg-danger-soft px-2.5 py-0.5 text-[11.5px] font-medium text-red-700 ring-1 ring-inset ring-red-200">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Aksiyon linkleri */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href={`/panel/tehdit/${encodeURIComponent(olay.ip)}`} className="flex items-center justify-center gap-1.5 rounded-full bg-ink-900 px-3 py-2 text-[12.5px] font-medium text-white transition hover:bg-ink-800">
            <ShieldAlert className="size-3.5" /> {t("kk.detay.tehditProfili")}
          </Link>
          <Link href="/panel/oturum-replay" className="flex items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-2 text-[12.5px] font-medium text-slate-ink transition hover:bg-canvas">
            <ExternalLink className="size-3.5" /> {t("kk.detay.oturumTekrari")}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Alan({ ikon, etiket, deger, mono }: { ikon: React.ReactNode; etiket: string; deger: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-slate-muted">{ikon} {etiket}</span>
      <span className={cn("min-w-0 break-all text-right text-[12.5px] font-medium text-slate-ink", mono && "font-mono")}>{deger}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Mini-metrik kartı */
function MetrikKart({
  etiket, deger, birim, ikon, ton, ekstra, dil,
}: {
  etiket: string; deger: number; birim?: string; ikon: React.ReactNode;
  ton?: "danger" | "warn" | "ok"; ekstra?: React.ReactNode; dil: Dil;
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "warn" ? "text-warn" : ton === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11.5px] text-slate-muted">{ikon} {etiket}</span>
        {ekstra}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("num text-[24px] font-bold leading-none tabular-nums", renk)}>{deger.toLocaleString(YEREL[dil])}</span>
        {birim && <span className="text-[11px] text-slate-faint">{birim}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Sparkline (saf inline SVG) */
function Sparkline({ veri }: { veri: number[] }) {
  if (veri.length < 2) return <span className="h-6 w-16" />;
  const w = 64, h = 22;
  const maks = Math.max(1, ...veri);
  const adim = w / (veri.length - 1);
  const noktalar = veri.map((v, i) => `${(i * adim).toFixed(1)},${(h - (v / maks) * (h - 3) - 1.5).toFixed(1)}`);
  const cizgi = `M ${noktalar.join(" L ")}`;
  const alan = `${cizgi} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <path d={alan} fill="rgb(52 211 153 / 0.15)" />
      <path d={cizgi} fill="none" stroke="rgb(52 211 153)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
