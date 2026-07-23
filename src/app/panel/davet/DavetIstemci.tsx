"use client";

/**
 * Davet Et & Kazan (referral) — istemci.
 * Davet linki kopyala, e-posta ile davet gönder, kazanç istatistikleri.
 */

import { useState } from "react";
import { Gift, Copy, Check, Send, Users2, Coins, Share2, Loader2 } from "lucide-react";
import { Panel, StatKart, useToast } from "@/components/panel/kit";

interface Stat {
  kod: string;
  link: string;
  davetSayisi: number;
  kazanc: number;
  odulEden: number;
  odulEdilen: number;
}

export function DavetIstemci({ stat }: { stat: Stat }) {
  const { goster } = useToast();
  const [kopyalandi, setKopyalandi] = useState(false);
  const [epostaMetni, setEpostaMetni] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function linkKopyala() {
    try {
      await navigator.clipboard.writeText(stat.link);
      setKopyalandi(true);
      goster({ tip: "basari", baslik: "Davet linki kopyalandı" });
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      goster({ tip: "hata", baslik: "Kopyalanamadı", aciklama: "Linki elle seçip kopyalayın." });
    }
  }

  async function paylas() {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Veylify daveti", text: "Veylify'e katıl, kredi kazan!", url: stat.link });
      } catch { /* kullanıcı iptal etti */ }
    } else {
      linkKopyala();
    }
  }

  async function davetGonder() {
    const emails = epostaMetni
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      goster({ tip: "bilgi", baslik: "E-posta girin", aciklama: "Virgül veya boşlukla ayırarak birden çok ekleyebilirsin." });
      return;
    }
    setGonderiliyor(true);
    try {
      const r = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const j = await r.json();
      if (!r.ok) {
        goster({ tip: "hata", baslik: "Gönderilemedi", aciklama: j.error || "Tekrar deneyin." });
        return;
      }
      if (j.gonderilen > 0) {
        goster({ tip: "basari", baslik: `${j.gonderilen} davet gönderildi`, aciklama: `${j.toplam} adresten ${j.gonderilen} tanesine ulaşıldı.` });
        setEpostaMetni("");
      } else {
        goster({
          tip: "bilgi",
          baslik: "Davet kuyruğa alındı",
          aciklama: "Mail sunucusu (SMTP) henüz yapılandırılmadıysa gönderim canlıda aktifleşir; linki elle de paylaşabilirsin.",
        });
      }
    } catch {
      goster({ tip: "hata", baslik: "Ağ hatası", aciklama: "İstek gönderilemedi." });
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Hero şeridi */}
      <div className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-surface px-6 py-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
          <Gift className="size-5" />
        </span>
        <div>
          <h2 className="text-[16px] font-semibold text-slate-ink">Davet et, birlikte kazanın</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-muted">
            Davet linkinle kaydolan her kişi için <strong className="text-brand-700">{stat.odulEden} kredi</strong> kazanırsın;
            davet ettiğin kişi de <strong className="text-brand-700">{stat.odulEdilen} kredi</strong> ile başlar. Kredi, plan
            kotanın üstünde ek doğrulama kapasitesidir.
          </p>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatKart sayi={stat.davetSayisi} etiket="Başarılı davet" ikon={<Users2 className="size-5" />} tone="brand" />
        <StatKart sayi={stat.kazanc} etiket="Kazanılan kredi" ikon={<Coins className="size-5" />} tone="ok" />
        <StatKart sayi={stat.kod} etiket="Davet kodun" ikon={<Gift className="size-5" />} />
      </div>

      {/* Davet linki */}
      <Panel baslik="Davet linkin">
        <p className="mb-3 text-[13px] text-slate-muted">Bu linki paylaş — kaydolan herkes seni referans gösterir.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={stat.link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 truncate rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-[13px] text-slate-ink outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={linkKopyala}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-brand-700"
            >
              {kopyalandi ? <Check className="size-4" /> : <Copy className="size-4" />}
              {kopyalandi ? "Kopyalandı" : "Kopyala"}
            </button>
            <button
              type="button"
              onClick={paylas}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-medium text-slate-ink transition hover:border-brand-300"
            >
              <Share2 className="size-4" /> Paylaş
            </button>
          </div>
        </div>
      </Panel>

      {/* E-posta ile davet */}
      <Panel baslik="E-posta ile davet gönder">
        <p className="mb-3 text-[13px] text-slate-muted">
          Arkadaşlarının e-postalarını virgül veya boşlukla ayırarak gir; davetini biz gönderelim.
        </p>
        <textarea
          value={epostaMetni}
          onChange={(e) => setEpostaMetni(e.target.value)}
          rows={3}
          placeholder="ornek@site.com, arkadas@site.com"
          className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] text-slate-ink outline-none focus:border-brand-400"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={davetGonder}
            disabled={gonderiliyor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {gonderiliyor ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Davet gönder
          </button>
        </div>
      </Panel>
    </div>
  );
}
