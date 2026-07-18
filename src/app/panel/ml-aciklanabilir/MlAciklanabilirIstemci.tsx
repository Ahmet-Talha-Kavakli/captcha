"use client";

import { useState, useEffect } from "react";
import { Brain, Sliders, Bot, ShieldCheck, TrendingUp, GitBranch, Info, Sparkles } from "lucide-react";
import { Panel, StatKart } from "@/components/panel/kit";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { mlCeviri } from "./mlaciklanabilir.i18n";
import { SinifDagilimListesi, type DagilimSatir } from "@/components/panel/SinifDagilimListesi";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";

interface Katki { ozellik: string; agirlik: number; sinif: string }
interface Olasilik { sinif: string; olasilik: number }
interface Sonuc {
  sinif: string; guven: number; insanMi: boolean; guvenYorum: string;
  siraliOlasilik: Olasilik[]; katkilar: Katki[];
  karsiOlgusal: { sinyal: string; degisiklik: string; yeniSinif: string } | null;
}

// BotClass DEĞERLERİNE bağlı renkler — tek kaynak: botSinifGorsel (krem-tema uyumlu).
const SINIF_RENK: Record<string, string> = {
  human: botSinifGorsel("human").renk, good_bot: botSinifGorsel("good_bot").renk,
  automation: botSinifGorsel("automation").renk, scraper: botSinifGorsel("scraper").renk,
  credential_stuffing: botSinifGorsel("credential_stuffing").renk, ai_agent: botSinifGorsel("ai_agent").renk,
  ddos: botSinifGorsel("ddos").renk, spam: botSinifGorsel("spam").renk,
};

export function MlAciklanabilirIstemci({
  ozet, dil,
}: {
  ozet: { toplam: number; ortGuven: number; belirsizOran: number; sinifDagilim: { sinif: string; sayi: number; oran: number }[]; ozellikEtki: { ozellik: string; siklik: number }[] };
  dil: Dil;
}) {
  const t = (anahtar: string) => mlCeviri(anahtar, dil);
  // BotClass etiketi (enum → çeviri). Bilinmeyen değer olduğu gibi gösterilir.
  const sinifAd = (s: string) => t(`sinif.${s}`) === `sinif.${s}` ? s : t(`sinif.${s}`);
  // Lib'in ürettiği TR özellik/sinyal adını çevir; eşleşme yoksa kaynağı koru.
  const ozellikAd = (o: string) => t(`ozellik.${o}`) === `ozellik.${o}` ? o : t(`ozellik.${o}`);
  const sinyalAd = (s: string) => t(`sinyal.${s}`) === `sinyal.${s}` ? s : t(`sinyal.${s}`);
  const degisiklikAd = (d: string) => t(`degisiklik.${d}`) === `degisiklik.${d}` ? d : t(`degisiklik.${d}`);
  // Güven yorumunu lib'in TR metni yerine `guven` değerinden yeniden türet.
  const guvenYorumu = (guven: number) =>
    guven >= 0.7 ? t("guvenYorum.yuksek")
    : guven >= 0.45 ? t("guvenYorum.orta")
    : t("guvenYorum.dusuk");

  const [ua, setUa] = useState("python-requests/2.31");
  const [skor, setSkor] = useState(0.2);
  const [headless, setHeadless] = useState(true);
  const [tls, setTls] = useState(false);
  const [ai, setAi] = useState(false);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);

  // Girdi değişince otomatik yeniden sınıflandır (debounce).
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/ml-aciklanabilir", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ua, behaviorScore: skor, headless, tlsMismatch: tls, aiAjan: ai }),
        });
        if (r.ok) setSonuc(await r.json());
      } catch { /* sessiz */ }
    }, 250);
    return () => clearTimeout(t);
  }, [ua, skor, headless, tls, ai]);

  const maxSiklik = Math.max(1, ...ozet.ozellikEtki.map((e) => e.siklik));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Brain className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")}
            <b> {t("serit.aciklama.vurgu")}</b>{t("serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* interaktif açıklayıcı */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel baslik={t("girdi.baslik")} sagUst={<span className="flex items-center gap-1.5 text-[12px] text-slate-faint"><Sliders className="size-3.5" /> {t("girdi.canli")}</span>}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("girdi.ua")}</label>
              <input value={ua} onChange={(e) => setUa(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-[12px] outline-none focus:border-brand-400" />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["Mozilla/5.0 Chrome/120", "python-requests/2.31", "Mozilla/5.0 (compatible; GPTBot/1.1)", "curl/8.1", "Googlebot/2.1"].map((u) => (
                  <button key={u} onClick={() => setUa(u)} className="rounded-md bg-canvas px-2 py-0.5 font-mono text-[10.5px] text-slate-muted transition hover:bg-slate-100 hover:text-slate-ink">{u.slice(0, 20)}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="text-[13px] font-medium text-slate-ink">{t("girdi.davranisSkoru")}</span><span className="num text-[13px] font-semibold" style={{ color: skor >= 0.7 ? "#16a34a" : skor >= 0.3 ? "#d97706" : "#dc2626" }}>{skor.toFixed(2)}</span></div>
              <input type="range" min={0} max={1} step={0.05} value={skor} onChange={(e) => setSkor(parseFloat(e.target.value))} className="w-full accent-brand-600" aria-label={t("girdi.davranisSkoru")} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([[t("girdi.headless"), headless, setHeadless], [t("girdi.tlsUyumsuz"), tls, setTls], [t("girdi.aiAjan"), ai, setAi]] as const).map(([ad, deger, set]) => (
                <button key={ad} onClick={() => set(!deger)} className={cn("rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition", deger ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line bg-surface text-slate-muted")}>{ad}: {deger ? t("girdi.acik") : t("girdi.kapali")}</button>
              ))}
            </div>
          </div>
        </Panel>

        {/* karar sonucu */}
        <Panel baslik={t("karar.baslik")}>
          {!sonuc ? (
            <div className="grid h-48 place-items-center text-slate-faint"><Brain className="size-8 opacity-40" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: (SINIF_RENK[sonuc.sinif] ?? botSinifGorsel(sonuc.sinif).renk) + "18" }}>
                <div className="flex items-center gap-2">
                  <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: SINIF_RENK[sonuc.sinif] ?? botSinifGorsel(sonuc.sinif).renk }}>{sonuc.insanMi ? <ShieldCheck className="size-5" /> : <Bot className="size-5" />}</span>
                  <div>
                    <div className="text-[16px] font-bold text-slate-ink">{sinifAd(sonuc.sinif)}</div>
                    <div className="text-[11px] text-slate-muted">{t("karar.tahminiSinif")}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[26px] font-bold" style={{ color: SINIF_RENK[sonuc.sinif] ?? botSinifGorsel(sonuc.sinif).renk }}>%{Math.round(sonuc.guven * 100)}</div>
                  <div className="text-[11px] text-slate-faint">{t("karar.guven")}</div>
                </div>
              </div>
              {/* softmax olasılık dağılımı */}
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("karar.softmax")}</div>
                <div className="space-y-1.5">
                  {sonuc.siraliOlasilik.slice(0, 5).map((o) => (
                    <div key={o.sinif} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-[12px] text-slate-muted">{sinifAd(o.sinif)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full" style={{ width: `${o.olasilik * 100}%`, background: SINIF_RENK[o.sinif] ?? botSinifGorsel(o.sinif).renk }} /></div>
                      <span className="num w-10 shrink-0 text-right text-[11.5px] font-semibold text-slate-ink">%{(o.olasilik * 100).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* karşı-olgusal */}
              {sonuc.karsiOlgusal && (
                <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-[12.5px] text-brand-800">
                  <GitBranch className="mt-0.5 size-4 shrink-0" /> <b>{sinyalAd(sonuc.karsiOlgusal.sinyal)}</b> {degisiklikAd(sonuc.karsiOlgusal.degisiklik)} {t("karar.karsiOlgusal").replace("{yeni}", sinifAd(sonuc.karsiOlgusal.yeniSinif))}
                </div>
              )}
              <div className="flex items-start gap-2 text-[12px] text-slate-muted"><Info className="mt-0.5 size-3.5 shrink-0 text-brand-600" /> {guvenYorumu(sonuc.guven)}</div>
            </div>
          )}
        </Panel>
      </div>

      {/* katkı dökümü */}
      {sonuc && sonuc.katkilar.length > 0 && (
        <Panel baslik={t("katki.baslik")}>
          <div className="space-y-2.5">
            {sonuc.katkilar.slice(0, 6).map((k, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[13px] font-medium text-slate-ink">{ozellikAd(k.ozellik)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (k.agirlik / 3.5) * 100)}%`, background: SINIF_RENK[k.sinif] ?? "#2f6fed" }} /></div>
                <span className="num w-12 shrink-0 text-right text-[12px] font-semibold text-slate-ink">+{k.agirlik.toFixed(1)}</span>
                <span className="w-24 shrink-0 text-[11px] text-slate-faint">→ {sinifAd(k.sinif)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* gerçek trafik model özeti */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam.toLocaleString("tr-TR")} etiket={t("ozet.siniflandirilanOlay")} ikon={<Bot className="size-5" />} />
        <StatKart sayi={ozet.ortGuven.toFixed(2)} etiket={t("ozet.ortGuven")} ikon={<Brain className="size-5" />} tone={ozet.ortGuven >= 0.6 ? "ok" : "warn"} />
        <StatKart sayi={`%${ozet.belirsizOran}`} etiket={t("ozet.belirsizKarar")} ikon={<TrendingUp className="size-5" />} tone={ozet.belirsizOran > 25 ? "warn" : "ok"} />
        <StatKart sayi={ozet.sinifDagilim.length} etiket={t("ozet.aktifSinif")} ikon={<Sparkles className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel baslik={t("dagilim.baslik")}>
          <SinifDagilimListesi
            satirlar={ozet.sinifDagilim.map<DagilimSatir>((s) => ({
              sinif: s.sinif,
              etiket: sinifAd(s.sinif),
              deger: s.sayi,
              yuzde: s.oran,
            }))}
          />
        </Panel>
        <Panel baslik={t("ozellik.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("ozellik.aciklama")}</p>
          <div className="space-y-2">
            {ozet.ozellikEtki.map((e) => (
              <div key={e.ozellik} className="flex items-center gap-2">
                <span className="w-40 shrink-0 text-[12.5px] text-slate-ink">{ozellikAd(e.ozellik)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(e.siklik / maxSiklik) * 100}%` }} /></div>
                <span className="num w-12 shrink-0 text-right text-[12px] text-slate-muted">{e.siklik}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
