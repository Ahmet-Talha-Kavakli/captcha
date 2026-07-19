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
      className="w-full max-w-[328px] overflow-hidden rounded-[22px] text-[#eef1fb]"
      style={{
        background: "radial-gradient(130% 150% at 0% 0%,rgba(49,46,129,.85) 0%,rgba(30,27,75,.92) 44%,rgba(15,14,38,.96) 100%)",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,.10), 0 24px 64px -20px rgba(20,16,60,.72), 0 0 0 1px rgba(129,140,248,.14)",
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
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#c3c9f2]">
              <SpecterMark size={16} /> İnsan doğrulaması
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#a5b4fc]"><Lock className="size-3" /> Şifreli</span>
          </div>
          <div className="relative px-4">
            <div className="overflow-hidden rounded-xl" style={{ boxShadow: "0 0 0 1px rgba(129,140,248,.12), inset 0 0 30px rgba(0,0,0,.5)" }}>
              {params && durum !== "yukleniyor" ? (
                <GhostText text={answer} decoy="ERISIM RED" width={296} height={112} cell={3} color="#c7d2fe" bg="#0b1020" className="w-full" />
              ) : (
                <div className="flex h-[112px] items-center justify-center bg-[#0b1020] text-[12px] text-[#6c74a3]">
                  {durum === "hata" ? "Widget yüklenemedi" : "Yükleniyor…"}
                </div>
              )}
            </div>
            <button onClick={yukle} aria-label="Yeni kod üret" className="absolute right-6 top-1.5 grid size-7 place-items-center rounded-lg border border-white/10 bg-[#1e1b4b]/60 text-[#c3c9f2] backdrop-blur transition hover:border-veylify-400/45 hover:text-white">
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
              className="h-11 flex-1 rounded-xl border border-white/10 bg-[#0f0e26]/55 px-3.5 text-[16px] font-semibold uppercase tracking-[3px] text-white outline-none backdrop-blur transition focus:border-veylify-400 focus:ring-4 focus:ring-veylify-400/20 placeholder:text-[15px] placeholder:font-medium placeholder:tracking-normal placeholder:text-[#6c74a3]"
            />
            <button onClick={dogrula} className="rounded-xl px-5 text-[14px] font-bold text-white transition hover:brightness-110" style={{ background: "linear-gradient(180deg,#818cf8,#4f46e5)", border: "1px solid rgba(255,255,255,.16)", boxShadow: "0 6px 18px -6px rgba(79,70,229,.7), 0 1px 0 rgba(255,255,255,.25) inset" }}>
              Doğrula
            </button>
          </div>
          <div className="flex items-center justify-between px-4 pb-3.5 pt-2.5 text-[11px] text-[#6c74a3]">
            <span className="flex items-center gap-1.5 font-bold text-[#a5b4fc]">
              <span className="size-1.5 rounded-full bg-veylify-400" style={{ boxShadow: "0 0 10px #818cf8" }} /> {MARKA.koruniyorTr}
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
