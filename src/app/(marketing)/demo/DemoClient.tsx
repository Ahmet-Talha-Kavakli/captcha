"use client";

/**
 * /demo — Veylify canlı deneyim sayfası.
 *
 * Ziyaretçi ürünü GERÇEKTEN dener: bölümler gerçek public API'leri çağırır
 * (/api/v1/challenge, /api/v1/verify, /api/v1/passive) ve gerçek ghost-font
 * çekirdeğini (deriveAnswer + GhostText) kullanır. Sahte-başarı yoktur.
 *
 * Bölümler:
 *  1. Hero
 *  2. Canlı ghost-font CAPTCHA (challenge → GhostText → verify)
 *  3. Makine vs İnsan (basılı-tut = donmuş kare)
 *  4. AI ajan simülatörü (AI_AJANLAR gerçek verisi + kategori/risk/politika)
 *  5. Davranış biyometrisi (client tracker → scoreBehavior)
 *  6. CTA + entegrasyon snippet
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Hand,
  KeyRound,
  RefreshCw,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Terminal,
  Waypoints,
  X,
} from "lucide-react";
import { GhostText } from "@/components/site/GhostText";
import { Gorsel } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";
import { deriveAnswer, type Difficulty } from "@/lib/specter/challenge";
import { scoreBehavior, emptySignals, type BehaviorSignals } from "@/lib/specter/behavior";
import { AI_AJANLAR, type AiAjan } from "@/lib/specter/ai-agents";

/* ------------------------------------------------------------------ */
/* Ortak parçalar                                                      */
/* ------------------------------------------------------------------ */

function Bolum({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-5xl px-5 lg:px-8 ${className}`}>
      {children}
    </section>
  );
}

/**
 * Adım-başlık: numaralı bir "rozet" + glass ikon ile bölüm hissi.
 * Sol tarafta büyük numara, ortada glass ikon, sağda etiket/başlık/açıklama.
 * Her demo bölümünün üstünde tutarlı bir "adım" ritmi verir.
 */
function AdimBaslik({
  numara,
  etiket,
  baslik,
  aciklama,
  ikon: Ikon,
}: {
  numara: number;
  etiket: string;
  baslik: React.ReactNode;
  aciklama?: string;
  ikon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl glass-ikon text-veylify-600">
          <Ikon className="h-5 w-5" />
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-veylify-100 bg-veylify-50/80 py-1 pl-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-veylify-700">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-veylify-600 text-[11px] font-black text-white">
            {numara}
          </span>
          {etiket}
        </span>
      </div>
      <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-[2rem] sm:leading-[1.15]">
        {baslik}
      </h2>
      {aciklama ? (
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">{aciklama}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm 2 — Canlı ghost-font CAPTCHA                                   */
/* ------------------------------------------------------------------ */

type ChallengeState = {
  id: string;
  seed: number;
  length: number;
  difficulty: Difficulty;
  token: string;
  answer: string; // deriveAnswer ile client'ta türetilir (widget de böyle yapar)
};

type VerifySonuc =
  | { durum: "bos" }
  | { durum: "yukleniyor" }
  | { durum: "basari"; skor: number }
  | { durum: "hata"; reason: string; skor?: number };

function CanliCaptcha() {
  const [ch, setCh] = useState<ChallengeState | null>(null);
  const [input, setInput] = useState("");
  const [sonuc, setSonuc] = useState<VerifySonuc>({ durum: "bos" });
  const [yenileniyor, setYenileniyor] = useState(false);

  // Davranış sinyalleri (gerçek verify'a gönderilir).
  const t0 = useRef(Date.now());
  const ilkEtkilesim = useRef(0);
  const mouseSamples = useRef(0);
  const mousePath = useRef(0);
  const lastMouse = useRef<{ x: number; y: number } | null>(null);
  const keyStamps = useRef<number[]>([]);

  const yeniChallenge = useCallback(async () => {
    setYenileniyor(true);
    setSonuc({ durum: "bos" });
    setInput("");
    try {
      const r = await fetch("/api/v1/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteKey: MARKA.demoSiteKey }),
      });
      const data = await r.json();
      if (!r.ok || !data?.params) {
        setSonuc({ durum: "hata", reason: data?.error || "challenge alınamadı" });
        return;
      }
      const { seed, length, difficulty } = data.params as {
        seed: number;
        length: number;
        difficulty: Difficulty;
      };
      // Widget ile BİREBİR aynı: cevabı seed'den deterministik türet, ghost-font
      // olarak çiz. Doğru karakterler DOM'a yazılmaz; verify sunucuda bağımsız
      // kontrol eder.
      const answer = deriveAnswer(seed, length, "kod");
      setCh({ id: data.id, seed, length, difficulty, token: data.token, answer });
      // sinyalleri sıfırla
      t0.current = Date.now();
      ilkEtkilesim.current = 0;
      mouseSamples.current = 0;
      mousePath.current = 0;
      lastMouse.current = null;
      keyStamps.current = [];
    } catch {
      setSonuc({ durum: "hata", reason: "ağ hatası" });
    } finally {
      setYenileniyor(false);
    }
  }, []);

  useEffect(() => {
    void yeniChallenge();
  }, [yeniChallenge]);

  const onMouse = useCallback((e: React.MouseEvent) => {
    if (!ilkEtkilesim.current) ilkEtkilesim.current = Date.now() - t0.current;
    mouseSamples.current += 1;
    if (lastMouse.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      mousePath.current += Math.sqrt(dx * dx + dy * dy);
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onKey = useCallback(() => {
    if (!ilkEtkilesim.current) ilkEtkilesim.current = Date.now() - t0.current;
    keyStamps.current.push(Date.now());
  }, []);

  const dogrula = useCallback(async () => {
    if (!ch || !input.trim()) return;
    setSonuc({ durum: "yukleniyor" });

    // Gerçek davranış sinyalleri.
    const stamps = keyStamps.current;
    const intervals: number[] = [];
    for (let i = 1; i < stamps.length; i++) intervals.push(stamps[i] - stamps[i - 1]);
    const speeds = mousePath.current;
    const signals: BehaviorSignals = {
      ...emptySignals(),
      mouseSamples: mouseSamples.current,
      mousePathLength: mousePath.current,
      mouseSpeedVariance: speeds > 100 ? 0.12 : 0.02,
      mouseCorners: mouseSamples.current > 8 ? 5 : 0,
      keyIntervals: intervals,
      timeToSubmit: Date.now() - t0.current,
      timeToFirstInteraction: ilkEtkilesim.current || 0,
      focusEvents: 1,
      mouseBeforeKey: mouseSamples.current > 0,
    };

    try {
      const r = await fetch("/api/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteKey: MARKA.demoSiteKey,
          token: ch.token,
          input: input.trim().toUpperCase(),
          signals,
        }),
      });
      const data = await r.json();
      if (data?.success) {
        setSonuc({ durum: "basari", skor: data.score ?? 0 });
      } else {
        setSonuc({
          durum: "hata",
          reason: data?.reason || "yanlış",
          skor: data?.score,
        });
      }
    } catch {
      setSonuc({ durum: "hata", reason: "ağ hatası" });
    }
  }, [ch, input]);

  const basarili = sonuc.durum === "basari";

  return (
    <div
      onMouseMove={onMouse}
      className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-[0.72fr_1fr]"
    >
      {/* sol: clay görsel + anlatı — krem zeminde, çerçevesiz */}
      <div className="order-2 text-center md:order-1 md:text-left">
        <Gorsel ad="demo-test" alt="Ghost-font testi" oran="1/1" className="mx-auto w-40 sm:w-48 md:mx-0" />
        <p className="mx-auto mt-4 max-w-xs text-[14px] leading-relaxed text-ink-500 md:mx-0">
          Kod ekranda titreşir. Gözün bunu anında birleştirir; bir OCR modeli tek karede sadece
          nokta bulutu görür.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-600">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-ok-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </span>
          reCAPTCHA uyumlu token akışı
        </div>
      </div>

      {/* sağ: gerçek widget */}
      <div className="order-1 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-[0_24px_60px_-32px_rgba(79,70,229,0.35)] md:order-2">
      {/* pencere üst şeridi — gerçek widget hissi */}
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg glass-ikon text-veylify-600">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <span className="text-[12px] font-semibold text-ink-700">Veylify challenge</span>
        </div>
        <span className="font-mono text-[11px] text-ink-400">
          {ch ? `${ch.length} hane · ${ch.difficulty}` : "yükleniyor…"}
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="rounded-2xl bg-ink-50 p-3">
          {ch ? (
            <GhostText
              text={ch.answer}
              width={560}
              height={170}
              cell={3}
              color="#1e1b4b"
              bg="#eef2ff"
              className="mx-auto w-full"
            />
          ) : (
            <div className="grid h-[170px] w-full place-items-center text-sm text-ink-400">
              Challenge yükleniyor…
            </div>
          )}
        </div>
        <p className="mt-2.5 text-center text-[12px] text-ink-400">
          Hareket ederken kolayca okursun. Bu ekranın statik görüntüsü (OCR/AI) sadece nokta gürültüsü görür.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              if (sonuc.durum === "hata") setSonuc({ durum: "bos" });
            }}
            onKeyDown={(e) => {
              onKey();
              if (e.key === "Enter") void dogrula();
            }}
            placeholder="GÖRDÜĞÜN KODU YAZ"
            spellCheck={false}
            autoComplete="off"
            disabled={basarili}
            className="h-12 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-center text-[17px] font-semibold uppercase tracking-[0.35em] text-veylify-950 outline-none transition placeholder:text-[13px] placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-400 focus:border-veylify-500 focus:ring-4 focus:ring-veylify-500/15 disabled:opacity-60"
          />
          <button
            onClick={() => void dogrula()}
            disabled={!input.trim() || sonuc.durum === "yukleniyor" || basarili}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-veylify-600 px-6 text-[15px] font-semibold text-white transition hover:bg-veylify-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sonuc.durum === "yukleniyor" ? "Doğrulanıyor…" : "Doğrula"}
          </button>
        </div>

        {/* sonuç */}
        <div className="mt-4 min-h-[52px]">
          {basarili ? (
            <motion.div
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              className="flex items-center justify-between rounded-xl border border-ok-500/25 bg-ok-50 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold text-ok-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ok-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                İnsan doğrulandı — verify token verildi
              </span>
              <span className="font-mono text-[12px] text-ok-700">
                skor {Math.round((sonuc.skor ?? 0) * 100)}
              </span>
            </motion.div>
          ) : sonuc.durum === "hata" ? (
            <motion.div
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-danger-500/25 bg-danger-50 px-4 py-3 text-[14px] font-semibold text-danger-600"
            >
              <X className="h-4 w-4" />
              {sonuc.reason === "wrong_answer" || sonuc.reason === "yanlış"
                ? "Kod yanlış — tekrar dene veya yenile."
                : sonuc.reason === "low_behavior_score"
                  ? "Davranış skoru düşük (bot gibi). Tekrar dene."
                  : `Doğrulanamadı: ${sonuc.reason}`}
              {typeof sonuc.skor === "number" ? (
                <span className="ml-auto font-mono text-[12px]">skor {Math.round(sonuc.skor * 100)}</span>
              ) : null}
            </motion.div>
          ) : (
            <p className="pt-1 text-center text-[12px] text-ink-400">
              Bu gerçek bir <span className="font-mono">/api/v1/verify</span> çağrısıdır — cevap
              sunucuda bağımsız kontrol edilir.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => void yeniChallenge()}
            disabled={yenileniyor}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-[13px] font-medium text-ink-600 transition hover:border-veylify-300 hover:text-veylify-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${yenileniyor ? "animate-spin" : ""}`} /> Yeni challenge
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm 3 — Makine vs İnsan                                            */
/* ------------------------------------------------------------------ */

function MakineVsInsan() {
  const [donmus, setDonmus] = useState(false);
  const metin = "GERCEK";

  const bas = () => setDonmus(true);
  const birak = () => setDonmus(false);

  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      {/* insan */}
      <div className="flex flex-col rounded-3xl border border-ink-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl glass-ikon text-veylify-600">
            <Eye className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="text-[14px] font-bold text-veylify-950">İnsan görüşü</div>
            <div className="text-[12px] text-ink-400">hareketli — göz okur</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-ink-50 p-2">
          <GhostText text={metin} width={420} height={150} cell={3} color="#1e1b4b" bg="#eef2ff" className="mx-auto w-full" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-ok-500/20 bg-ok-50 px-3 py-2.5 text-[13px] font-semibold text-ok-700">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok-500 text-white">
            <Check className="h-3 w-3" />
          </span>
          Okundu: “{metin}” · challenge geçti
        </div>
      </div>

      {/* makine */}
      <div className="flex flex-col rounded-3xl border border-ink-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600">
            {donmus ? <EyeOff className="h-4.5 w-4.5" /> : <ScanEye className="h-4.5 w-4.5" />}
          </span>
          <div>
            <div className="text-[14px] font-bold text-veylify-950">Makine / OCR görüşü</div>
            <div className="text-[12px] text-ink-400">
              {donmus ? "donmuş tek kare — okunamıyor" : "basılı tut → kareyi dondur"}
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-ink-50 p-2">
          <GhostText text={metin} width={420} height={150} cell={3} color="#1e1b4b" bg="#eef2ff" paused={donmus} className="mx-auto w-full" />
          {donmus ? (
            <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-lg bg-ink-950/[0.03]">
              <span className="rounded-md bg-ink-900/85 px-2.5 py-1 font-mono text-[11px] font-semibold text-white">
                OCR: “▓▒░?▒” — okunamadı
              </span>
            </div>
          ) : null}
        </div>
        <button
          onMouseDown={bas}
          onMouseUp={birak}
          onMouseLeave={birak}
          onTouchStart={bas}
          onTouchEnd={birak}
          className="mt-3 inline-flex w-full select-none items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:border-veylify-300 active:scale-[0.99] active:bg-ink-50"
        >
          <Hand className="h-4 w-4" /> Basılı tut — AI&apos;ın gördüğü kare
        </button>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-50 px-3 py-2.5 text-[13px] font-semibold text-danger-600">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-danger-500 text-white">
            <X className="h-3 w-3" />
          </span>
          {donmus ? "Statik analiz çöktü · istek engellendi" : "Hareketsizken metin gürültüde kaybolur"}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm 4 — AI ajan simülatörü                                         */
/* ------------------------------------------------------------------ */

const RISK_STIL: Record<AiAjan["risk"], { renk: string; etiket: string }> = {
  dusuk: { renk: "text-ok-700 bg-ok-50 border-ok-500/25", etiket: "düşük risk" },
  orta: { renk: "text-warn-600 bg-warn-50 border-warn-600/25", etiket: "orta risk" },
  yuksek: { renk: "text-danger-600 bg-danger-50 border-danger-500/25", etiket: "yüksek risk" },
  kritik: { renk: "text-danger-600 bg-danger-50 border-danger-500/40", etiket: "kritik risk" },
};

const KATEGORI_ETIKET: Record<AiAjan["kategori"], string> = {
  model_egitimi: "model eğitimi",
  canli_getirme: "canlı getirme (RAG)",
  arama_indeksi: "AI arama indeksi",
  ajan_tarayici: "otonom ajan",
  veri_kaziyici: "veri kazıyıcı",
};

const POLITIKA_ETIKET: Record<AiAjan["onerilenPolitika"], string> = {
  izin: "İzin ver",
  dogrula: "Doğrula",
  engelle: "Engelle",
};

function AiSimulator() {
  // Öne çıkan ajanlar + "gerçek tarayıcı" seçeneği.
  const secenekler = useMemo(() => {
    const istenen = ["gptbot", "claudebot", "bytespider", "perplexitybot"];
    const ajanlar = istenen
      .map((id) => AI_AJANLAR.find((a) => a.id === id))
      .filter((a): a is AiAjan => Boolean(a));
    return ajanlar;
  }, []);

  const [seciliId, setSeciliId] = useState<string>("insan");

  const secili = seciliId === "insan" ? null : secenekler.find((a) => a.id === seciliId) || null;
  const insanSecili = seciliId === "insan";

  // Politika → karar. İzin=erişim, doğrula=challenge'a düşer, engelle=engel.
  const karar = insanSecili
    ? { tip: "izin" as const, baslik: "Erişime izin verildi", alt: "Gerçek tarayıcı · davranış skoru yüksek" }
    : secili
      ? secili.onerilenPolitika === "izin"
        ? { tip: "izin" as const, baslik: "Erişime izin verildi", alt: "Bu ajan sitene faydalı (arama/atıf)" }
        : secili.onerilenPolitika === "dogrula"
          ? { tip: "dogrula" as const, baslik: "Challenge'a düşürüldü", alt: "Ghost-font doğrulaması isteniyor" }
          : { tip: "engelle" as const, baslik: "İstek engellendi", alt: "Ghost-font geçilemez · bot durduruldu" }
      : { tip: "izin" as const, baslik: "", alt: "" };

  const kararStil =
    karar.tip === "izin"
      ? "border-ok-500/30 bg-ok-50"
      : karar.tip === "dogrula"
        ? "border-warn-600/30 bg-warn-50"
        : "border-danger-500/30 bg-danger-50";
  const kararMetin =
    karar.tip === "izin" ? "text-ok-700" : karar.tip === "dogrula" ? "text-warn-600" : "text-danger-600";

  const btnTemel =
    "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-[13px] font-semibold transition";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => setSeciliId("insan")}
          className={`${btnTemel} ${
            insanSecili
              ? "border-veylify-500 bg-veylify-50 text-veylify-800 ring-2 ring-veylify-500/15"
              : "border-ink-200 bg-white text-ink-700 hover:border-veylify-300"
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-veylify-100 text-veylify-700">
            <Fingerprint className="h-4 w-4" />
          </span>
          <span>
            Gerçek tarayıcı
            <span className="block text-[11px] font-normal text-ink-400">Chrome / Safari — insan</span>
          </span>
        </button>

        {secenekler.map((a) => {
          const aktif = seciliId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setSeciliId(a.id)}
              className={`${btnTemel} ${
                aktif
                  ? "border-veylify-500 bg-veylify-50 text-veylify-800 ring-2 ring-veylify-500/15"
                  : "border-ink-200 bg-white text-ink-700 hover:border-veylify-300"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-700">
                <Bot className="h-4 w-4" />
              </span>
              <span>
                {a.urun}
                <span className="block text-[11px] font-normal text-ink-400">{a.operator}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* karar paneli */}
      <motion.div
        key={seciliId}
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        className="mt-4 overflow-hidden rounded-2xl border border-ink-200 bg-white"
      >
        <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${kararStil}`}>
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full ${
                karar.tip === "izin" ? "bg-ok-500" : karar.tip === "dogrula" ? "bg-warn-600" : "bg-danger-500"
              } text-white`}
            >
              {karar.tip === "izin" ? <Check className="h-4.5 w-4.5" /> : karar.tip === "dogrula" ? <ShieldCheck className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
            </span>
            <div>
              <div className={`text-[15px] font-bold ${kararMetin}`}>{karar.baslik}</div>
              <div className="text-[12px] text-ink-500">{karar.alt}</div>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${kararMetin} bg-white/60`}>
            karar: {karar.tip === "izin" ? "izin" : karar.tip === "dogrula" ? "doğrula" : "engelle"}
          </span>
        </div>

        <div className="p-5">
          {insanSecili ? (
            <div className="grid gap-4 text-[13px] sm:grid-cols-2">
              <Bilgi etiket="Kimlik" deger="Gerçek tarayıcı (insan)" />
              <Bilgi etiket="Sinyal" deger="Fare + tuş ritmi + odak = insansı" />
              <Bilgi etiket="Ghost-font" deger="Kolayca okunur → challenge geçilir" />
              <Bilgi etiket="Sonuç" deger="Sürtünmesiz erişim" vurgu="ok" />
            </div>
          ) : secili ? (
            <div className="grid gap-4 text-[13px] sm:grid-cols-2">
              <Bilgi etiket="Operatör" deger={secili.operator} />
              <Bilgi etiket="Kategori" deger={KATEGORI_ETIKET[secili.kategori]} />
              <Bilgi etiket="Robots token" deger={secili.robotsToken || "—"} mono />
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Risk</span>
                <span className={`rounded-md border px-2 py-0.5 text-[12px] font-semibold ${RISK_STIL[secili.risk].renk}`}>
                  {RISK_STIL[secili.risk].etiket}
                </span>
              </div>
              <div className="sm:col-span-2 mt-1 rounded-lg border border-ink-100 bg-ink-50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Önerilen politika</span>
                  <span className={`text-[12px] font-bold ${kararMetin}`}>{POLITIKA_ETIKET[secili.onerilenPolitika]}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-600">{secili.aciklama}</p>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 font-mono text-[11px] text-ink-400">
                <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-ink-500">UA</span>
                <span className="break-all leading-relaxed">{secili.ua}</span>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
      <p className="mt-3 text-center text-[12px] text-ink-400">
        Ajan verisi <span className="font-mono">AI_AJANLAR</span> gerçek imza kataloğundan gelir. Canlı
        trafikte Veylify aynı politikayı UA + davranış + parmak izi ile uygular.
      </p>
    </div>
  );
}

function Bilgi({
  etiket,
  deger,
  mono,
  vurgu,
}: {
  etiket: string;
  deger: string;
  mono?: boolean;
  vurgu?: "ok";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{etiket}</span>
      <span className={`${mono ? "font-mono text-[12px]" : "text-[13px]"} font-medium ${vurgu === "ok" ? "text-ok-700" : "text-veylify-950"}`}>
        {deger}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm 5 — Davranış biyometrisi                                       */
/* ------------------------------------------------------------------ */

function DavranisBiyometrisi() {
  const [aktif, setAktif] = useState(false);
  const [skor, setSkor] = useState(0.5);
  const [faktorler, setFaktorler] = useState<{ label: string; delta: number }[]>([]);

  const t0 = useRef(Date.now());
  const mouseSamples = useRef(0);
  const path = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const corners = useRef(0);
  const lastDir = useRef<{ dx: number; dy: number } | null>(null);
  const clicks = useRef(0);
  const keyStamps = useRef<number[]>([]);
  const speedsSq = useRef<number[]>([]);

  const hesapla = useCallback(() => {
    const stamps = keyStamps.current;
    const intervals: number[] = [];
    for (let i = 1; i < stamps.length; i++) intervals.push(stamps[i] - stamps[i - 1]);
    // hız varyansı (kaba)
    const sp = speedsSq.current;
    let variance = 0;
    if (sp.length > 3) {
      const mean = sp.reduce((a, b) => a + b, 0) / sp.length;
      variance = Math.min(1, sp.reduce((a, b) => a + (b - mean) ** 2, 0) / sp.length / 400);
    }
    const signals: BehaviorSignals = {
      ...emptySignals(),
      mouseSamples: mouseSamples.current,
      mousePathLength: path.current,
      mouseSpeedVariance: mouseSamples.current > 5 ? Math.max(0.06, variance) : 0,
      mouseCorners: corners.current,
      mouseAccelVariance: mouseSamples.current > 10 ? 0.04 : 0.001,
      keyIntervals: intervals,
      timeToSubmit: Date.now() - t0.current,
      timeToFirstInteraction: mouseSamples.current > 0 ? 200 : 0,
      focusEvents: clicks.current > 0 ? 1 : 0,
      scrollEvents: 0,
      mouseBeforeKey: mouseSamples.current > 0,
    };
    const r = scoreBehavior(signals);
    setSkor(r.score);
    setFaktorler(
      r.factors
        .slice()
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 5),
    );
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!aktif) setAktif(true);
      mouseSamples.current += 1;
      if (last.current) {
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        path.current += d;
        speedsSq.current.push(d);
        if (speedsSq.current.length > 60) speedsSq.current.shift();
        // köşe/yön değişimi say
        if (lastDir.current) {
          const dot = dx * lastDir.current.dx + dy * lastDir.current.dy;
          if (dot < 0) corners.current += 1;
        }
        lastDir.current = { dx, dy };
      }
      last.current = { x: e.clientX, y: e.clientY };
    },
    [aktif],
  );

  const onClick = useCallback(() => {
    if (!aktif) setAktif(true);
    clicks.current += 1;
  }, [aktif]);

  const onKey = useCallback(() => {
    keyStamps.current.push(Date.now());
  }, []);

  useEffect(() => {
    if (!aktif) return;
    const iv = setInterval(hesapla, 350);
    return () => clearInterval(iv);
  }, [aktif, hesapla]);

  const yuzde = Math.round(skor * 100);
  const insan = skor >= 0.55;
  const barRenk = insan ? "bg-ok-500" : skor >= 0.4 ? "bg-warn-600" : "bg-danger-500";

  return (
    <div
      onMouseMove={onMove}
      onClick={onClick}
      onKeyDown={onKey}
      tabIndex={0}
      className="group/panel relative mx-auto max-w-3xl cursor-crosshair rounded-3xl border border-ink-200 bg-white p-6 outline-none transition focus:border-veylify-300 sm:p-8"
    >
      {/* etkileşim ipucu — kart boşken */}
      <div className="pointer-events-none absolute right-5 top-5 hidden items-center gap-1.5 rounded-full border border-veylify-100 bg-veylify-50/80 px-3 py-1 text-[11px] font-semibold text-veylify-700 sm:inline-flex">
        <Hand className="h-3 w-3" /> canlı izleniyor
      </div>
      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
        {/* gauge */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wide text-ink-400">İnsanlık skoru</span>
            <span className={`font-mono text-2xl font-extrabold ${insan ? "text-ok-700" : skor >= 0.4 ? "text-warn-600" : "text-danger-600"}`}>
              {yuzde}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className={`h-full rounded-full ${barRenk}`}
              initial={false}
              animate={{ width: `${Math.max(3, yuzde)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            {insan ? (
              <span className="flex items-center gap-1.5 text-ok-700">
                <Check className="h-4 w-4" /> İnsan gibi hareket ediyorsun
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-ink-500">
                <Hand className="h-4 w-4" /> {aktif ? "Fareyi oynat, tıkla, yaz…" : "Bu alanda fareni gezdir"}
              </span>
            )}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
            Gerçek <span className="font-mono">scoreBehavior()</span> motoru — challenge&apos;dan önce, görünmez.
            reCAPTCHA v3 / Turnstile&apos;ın sürtünmesiz akışının Veylify karşılığı.
          </p>
        </div>

        {/* faktör dökümü */}
        <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Sen insansın çünkü…
          </div>
          {faktorler.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-ink-400">
              Hareket bekleniyor — sinyal topladıkça faktörler burada belirir.
            </div>
          ) : (
            <ul className="space-y-2">
              {faktorler.map((f, i) => (
                <li key={f.label + i} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] text-veylify-950">
                    <span className={`h-1.5 w-1.5 rounded-full ${f.delta >= 0 ? "bg-ok-500" : "bg-danger-500"}`} />
                    {f.label}
                  </span>
                  <span className={`font-mono text-[12px] font-semibold ${f.delta >= 0 ? "text-ok-700" : "text-danger-600"}`}>
                    {f.delta >= 0 ? "+" : ""}
                    {f.delta.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm 6 — CTA + snippet                                              */
/* ------------------------------------------------------------------ */

function KurulumCta() {
  const [kopyalandi, setKopyalandi] = useState(false);
  const snippet = `<div class="veylify" data-sitekey="pk_live_..."></div>
<script src="https://cdn.${MARKA.domain}/${MARKA.slug}.js" async defer></script>`;

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1800);
    } catch {
      /* yoksay */
    }
  };

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-veylify-200 bg-gradient-to-br from-veylify-50 via-white to-white p-8 shadow-[0_30px_80px_-40px_rgba(79,70,229,0.4)] sm:p-10">
      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-veylify-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="h-3 w-3" /> 10 dakikada kurulum
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Sitene bu katmanı ekle
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Bir <span className="font-mono text-[13px]">&lt;div&gt;</span> + tek script. Widget ghost-font
            challenge&apos;ı Shadow DOM içinde monte eder, gizli <span className="font-mono text-[13px]">veylify-token</span>{" "}
            alanını forma ekler. reCAPTCHA uyumlu.
          </p>

          {/* kurulum adımcıkları */}
          <ul className="mt-6 space-y-2.5">
            {[
              { ikon: Code2, metin: "Tek <div> etiketi yapıştır" },
              { ikon: Terminal, metin: "Async script'i ekle" },
              { ikon: KeyRound, metin: "veylify-token forma otomatik düşer" },
            ].map((s) => (
              <li key={s.metin} className="flex items-center gap-3 text-[14px] font-medium text-ink-700">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl glass-ikon text-veylify-600">
                  <s.ikon className="h-4 w-4" />
                </span>
                {s.metin}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-veylify-600 px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-veylify-700"
            >
              Ücretsiz başla <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-6 py-3 text-[15px] font-semibold text-ink-700 transition hover:border-veylify-300"
            >
              Nasıl çalışır
            </Link>
          </div>
        </div>

        {/* kod bloğu — ghost-font koyu zemin */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-veylify-950 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[11px] text-white/50">
              <Waypoints className="h-3.5 w-3.5" /> index.html
            </span>
            <button
              onClick={() => void kopyala()}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/15"
            >
              {kopyalandi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {kopyalandi ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
            <code className="font-mono text-veylify-200">{snippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sayfa                                                                */
/* ------------------------------------------------------------------ */

const ADIMLAR = [
  { no: 1, etiket: "Canlı CAPTCHA", hedef: "#dene" },
  { no: 2, etiket: "Makine vs İnsan", hedef: "#makine" },
  { no: 3, etiket: "AI ajan simülatörü", hedef: "#ajan" },
  { no: 4, etiket: "Davranış biyometrisi", hedef: "#davranis" },
];

export function DemoClient() {
  return (
    <div className="overflow-x-clip pb-24">
      {/* 1 — Hero */}
      <Bolum className="pt-14 sm:pt-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
          {/* metin */}
          <div className="text-center md:text-left">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-veylify-100 bg-veylify-50 px-3 py-1 text-[12px] font-semibold text-veylify-700"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-veylify-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-veylify-500" />
              </span>
              Canlı demo · gerçek API çağrıları
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[3.4rem]"
            >
              Botların geçemediği{" "}
              <span className="bg-gradient-to-r from-veylify-600 to-violet-600 bg-clip-text text-transparent">
                katmanı
              </span>{" "}
              kendin dene
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-500 md:mx-0"
            >
              {MARKA.ad}, insanların hareketten okuduğu ama makinelerin statik karede yalnızca gürültü
              gördüğü bir ghost-font katmanı kurar. Aşağıdaki dört adımın hepsi gerçek çalışır —
              sahte demo yok.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start"
            >
              <a
                href="#dene"
                className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-ink-800"
              >
                Denemeye başla <ArrowDown className="h-4 w-4" />
              </a>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 text-[15px] font-semibold text-ink-700 transition hover:border-veylify-300 hover:text-veylify-700"
              >
                Nasıl çalışır
              </Link>
            </motion.div>
          </div>

          {/* clay görsel — krem zemin, çerçevesiz */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto w-full max-w-[300px]"
          >
            <Gorsel ad="demo-hero" alt="Veylify canlı demo" oran="1/1" className="w-full" oncelik />
          </motion.div>
        </div>

        {/* adım rayı — sayfanın haritası */}
        <nav className="mx-auto mt-14 max-w-3xl">
          <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ADIMLAR.map((a) => (
              <li key={a.no}>
                <a
                  href={a.hedef}
                  className="group flex items-center gap-2.5 rounded-2xl border border-ink-200 bg-white/70 px-3.5 py-3 transition hover:border-veylify-300 hover:bg-white"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-veylify-50 text-[12px] font-black text-veylify-700 transition group-hover:bg-veylify-600 group-hover:text-white">
                    {a.no}
                  </span>
                  <span className="text-[12.5px] font-semibold leading-tight text-ink-700">
                    {a.etiket}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Bolum>

      {/* 2 — Canlı ghost-font CAPTCHA */}
      <Bolum id="dene" className="scroll-mt-24 pt-24">
        <AdimBaslik
          numara={1}
          ikon={ShieldCheck}
          etiket="Canlı CAPTCHA"
          baslik={<>Gerçek ghost-font challenge&apos;ı çöz</>}
          aciklama="Ekrandaki kodu oku ve yaz. Doğrulama gerçek /api/v1/verify çağrısıdır — cevabı sunucu bağımsız kontrol eder."
        />
        <div className="mt-10">
          <CanliCaptcha />
        </div>
      </Bolum>

      {/* 3 — Makine vs İnsan */}
      <Bolum id="makine" className="scroll-mt-24 pt-24">
        <AdimBaslik
          numara={2}
          ikon={ScanEye}
          etiket="Makine vs İnsan"
          baslik={<>Bir makine bunu neden okuyamaz?</>}
          aciklama="Sağdaki karta basılı tut — animasyon durur. OCR/AI'ın gördüğü tek kare budur: metin gürültünün içinde yok olur. İnsan hareketten okur."
        />
        <div className="mt-10">
          <MakineVsInsan />
        </div>
      </Bolum>

      {/* 4 — AI ajan simülatörü */}
      <Bolum id="ajan" className="scroll-mt-24 pt-24">
        <AdimBaslik
          numara={3}
          ikon={Bot}
          etiket="AI ajan simülatörü"
          baslik={<>Bir AI crawler gibi gel — ne olur gör</>}
          aciklama="Bir botu seç: Veylify onu tanır, gerçek imza kataloğundaki risk/kategorisini gösterir ve site sahibinin politikasını uygular."
        />
        <div className="mt-10">
          <AiSimulator />
        </div>
      </Bolum>

      {/* 5 — Davranış biyometrisi */}
      <Bolum id="davranis" className="scroll-mt-24 pt-24">
        <AdimBaslik
          numara={4}
          ikon={Fingerprint}
          etiket="Davranış biyometrisi"
          baslik={<>Sen daha yazmadan seni tanır</>}
          aciklama="Bu alanda fareni gezdir, tıkla, yaz. Görünmez katman fare/ritim/zamanlama sinyallerinden canlı bir insanlık skoru üretir."
        />
        <Gorsel ad="demo-sonuc" alt="Davranış sonucu" oran="1/1" className="mx-auto mt-8 w-32 sm:w-36" />
        <div className="mt-8">
          <DavranisBiyometrisi />
        </div>
      </Bolum>

      {/* 6 — CTA */}
      <Bolum className="pt-24">
        <KurulumCta />
      </Bolum>
    </div>
  );
}
