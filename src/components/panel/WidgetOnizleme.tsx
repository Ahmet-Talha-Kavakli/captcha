"use client";

/**
 * Panel içi canlı ghost-font widget önizlemesi. Gerçek /api/v1/challenge
 * çağırır, gerçek GhostText (temporal dithering) ile kodu gösterir,
 * kullanıcı çözer ve /api/v1/verify ile doğrulanır. Site sahibi kendi
 * anahtarıyla widget'ın gerçek davranışını panelde görür.
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X, Lock } from "lucide-react";
import { GhostText } from "@/components/site/GhostText";
import { SpecterMark } from "@/components/ui/Logo";
import { MARKA } from "@/lib/marka";

export function WidgetOnizleme({ siteKey }: { siteKey: string }) {
  const [params, setParams] = useState<{ seed: number; length: number; difficulty: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [input, setInput] = useState("");
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "basari" | "hata">("yukleniyor");
  const [baslangic, setBaslangic] = useState(0);

  const cevapTuret = useCallback((seed: number, len: number) => {
    // widget/ghostfont ile birebir aynı türetme
    let a = (seed ^ 0x9e3779b9) >>> 0;
    const CH = "34679ACDEFHJKLMNPRTUVWXY";
    const next = () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let o = "";
    for (let i = 0; i < len; i++) o += CH[Math.floor(next() * CH.length)];
    return o;
  }, []);

  const yukle = useCallback(async () => {
    setDurum("yukleniyor");
    setInput("");
    try {
      const res = await fetch("/api/v1/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteKey }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParams(data.params);
      setToken(data.token);
      setAnswer(cevapTuret(data.params.seed, data.params.length));
      setBaslangic(Date.now());
      setDurum("hazir");
    } catch {
      setDurum("hata");
    }
  }, [siteKey, cevapTuret]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  async function dogrula() {
    if (!token) return;
    const signals = {
      mouseSamples: 30, mousePathLength: 250, mouseSpeedVariance: 0.25,
      keyIntervals: [140, 190, 110, 170], timeToFirstInteraction: 600,
      timeToSubmit: Date.now() - baslangic, hadTouch: false, focusEvents: 1, pasted: false,
    };
    const res = await fetch("/api/v1/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteKey, token, input, signals }) });
    const data = await res.json();
    if (data.success) setDurum("basari");
    else {
      setDurum("hata");
      setTimeout(yukle, 1200);
    }
  }

  return (
    <div
      className="w-full max-w-[328px] overflow-hidden rounded-[20px] text-[#e8eef7]"
      style={{
        background: "radial-gradient(120% 140% at 0% 0%,#16233f 0%,#0c1526 45%,#080d18 100%)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,.06), 0 20px 60px -18px rgba(0,0,0,.55), 0 0 0 1px rgba(103,232,249,.10)",
      }}
    >
      {durum === "basari" ? (
        <div className="flex flex-col items-center gap-2.5 px-5 py-9 text-center">
          <span className="grid place-items-center rounded-full text-emerald-400" style={{ width: 52, height: 52, background: "radial-gradient(circle,rgba(16,185,129,.28),rgba(16,185,129,.08))", boxShadow: "0 0 0 1px rgba(52,211,153,.3),0 0 24px -4px rgba(52,211,153,.5)" }}><Check className="size-6" /></span>
          <div className="text-[15px] font-semibold">İnsan olduğun doğrulandı</div>
          <button onClick={yukle} className="mt-1 text-[12px] text-specter-300 hover:text-specter-200">Tekrar dene</button>
        </div>
      ) : (
        <>
          {/* başlık şeridi */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#aebfd4]">
              <SpecterMark size={16} /> İnsan doğrulaması
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5ad1c4]"><Lock className="size-3" /> Şifreli</span>
          </div>
          <div className="relative px-4">
            <div className="overflow-hidden rounded-xl" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,.07), inset 0 0 30px rgba(0,0,0,.5)" }}>
              {params && durum !== "yukleniyor" ? (
                <GhostText text={answer} width={296} height={104} cell={3} color="#cfe9f5" bg="#0a1120" className="w-full" />
              ) : (
                <div className="flex h-[104px] items-center justify-center bg-[#0a1120] text-[12px] text-[#5f7189]">
                  {durum === "hata" ? "Widget yüklenemedi" : "Yükleniyor…"}
                </div>
              )}
            </div>
            <button onClick={yukle} aria-label="Yeni kod üret" className="absolute right-6 top-1.5 grid size-7 place-items-center rounded-lg border border-white/10 bg-[#0c1426]/70 text-[#aebfd4] backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-100">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <div className="flex gap-2.5 px-4 pb-1.5 pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && dogrula()}
              placeholder="Beliren kodu girin"
              maxLength={6}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-[#090e1a]/80 px-3.5 text-[16px] font-semibold uppercase tracking-[3px] text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/15 placeholder:text-[15px] placeholder:font-medium placeholder:tracking-normal placeholder:text-[#54657f]"
            />
            <button onClick={dogrula} className="rounded-xl px-5 text-[14px] font-extrabold text-[#042028] transition hover:brightness-110" style={{ background: "linear-gradient(180deg,#2ee0f5,#06b6d4)", boxShadow: "0 4px 14px -4px rgba(6,182,212,.6)" }}>
              Doğrula
            </button>
          </div>
          <div className="flex items-center justify-between px-4 pb-3.5 pt-2.5 text-[11px] text-[#54657f]">
            <span className="flex items-center gap-1.5 font-bold text-[#8fa8bd]">
              <span className="size-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 10px #22d3ee" }} /> {MARKA.koruniyorTr}
            </span>
            {durum === "hata" && (
              <span className="flex items-center gap-1 font-medium text-red-400"><X className="size-3" /> Yanlış kod</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
