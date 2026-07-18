"use client";

import { useState } from "react";
import { Camera, Eye, Bot, ShieldCheck, Fingerprint, Sparkles } from "lucide-react";
import { GhostText } from "@/components/site/GhostText";

export function DemoClient() {
  const [mesaj, setMesaj] = useState("INSAN MISIN");
  const [donmus, setDonmus] = useState(false);

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
          Ghost-font'u <span className="text-specter-300">canlı</span> dene
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/55">
          Mesajını yaz. Hareket ederken sen kolayca okuyabilirsin. "AI'ın gördüğü kare" ile aynı görüntünün
          statik hâlinde metnin nasıl gürültüye karıştığını gör.
        </p>
      </div>

      {/* Ghost-font stüdyosu */}
      <div className="rounded-2xl border border-white/10 bg-abyss-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-specter-300">
            <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-specter-500" /> Ghost-font stüdyosu
          </span>
          <span className="text-[11px] text-white/40">{donmus ? "AI KARESİ (statik)" : "CANLI (insan görüşü)"}</span>
        </div>

        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl">
          <GhostText text={mesaj || "..."} width={680} height={220} cell={3} color="#0b1120" bg="#dfe6ea" paused={donmus} className="w-full" />
        </div>

        <div className="mx-auto mt-4 max-w-2xl">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Mesajını yaz</div>
          <div className="flex gap-2">
            <input
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value.toUpperCase().slice(0, 20))}
              placeholder="MESAJINI YAZ"
              className="h-11 flex-1 rounded-lg border border-white/10 bg-abyss-800 px-3 text-[15px] uppercase tracking-widest text-white outline-none transition focus:border-specter-500 focus:ring-2 focus:ring-specter-500/20 placeholder:tracking-normal placeholder:text-white/30"
            />
            <button
              onMouseDown={() => setDonmus(true)}
              onMouseUp={() => setDonmus(false)}
              onMouseLeave={() => setDonmus(false)}
              onTouchStart={() => setDonmus(true)}
              onTouchEnd={() => setDonmus(false)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
            >
              <Camera className="h-4 w-4" /> AI karesini gör
            </button>
          </div>
          <p className="mt-3 text-center text-[12px] text-white/40">
            "AI karesini gör" butonuna basılı tut — animasyon durur ve OCR'ın gördüğü tek kareyle baş başa kalırsın:
            metin gürültünün içinde kaybolur.
          </p>
        </div>
      </div>

      {/* Nasıl çalışır şeridi */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Eye, t: "İnsan hareketten okur", d: "Görme sistemin kareler arası tutarlı titreşimi harf olarak yakalar." },
          { icon: Camera, t: "AI tek kare görür", d: "Ekran görüntüsündeki metin bölgesi arka planla aynı yoğunlukta — ayırt edilemez." },
          { icon: Fingerprint, t: "Statik analiz çöker", d: "OCR/vision modeli hareketi göremez; sadece rastgele nokta gürültüsü bulur." },
        ].map((x) => {
          const Icon = x.icon;
          return (
            <div key={x.t} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <Icon className="h-5 w-5 text-specter-300" />
              <div className="mt-2.5 font-semibold text-white">{x.t}</div>
              <div className="mt-1 text-[13px] text-white/50">{x.d}</div>
            </div>
          );
        })}
      </div>

      {/* Ürün bağlantısı */}
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-specter-500/20 bg-specter-500/[0.04] p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-specter-500/10 text-specter-300">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-white">Bu teknoloji sitenizi korur</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            Veylify, ghost-font'u davranışsal analiz + kural motoruyla birleştirerek AI botlarını üç katmanda durdurur.
            CAPTCHA'nız artık gerçekten "insan mı bot mu?" sorusunu cevaplar.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-specter-300">
          <Sparkles className="h-3.5 w-3.5" /> reCAPTCHA uyumlu · 10 dakikada kurulum
        </div>
      </div>
    </div>
  );
}

// (BotSimülasyonu bileşeni ayrı — DemoBot.tsx)
export { Bot };
