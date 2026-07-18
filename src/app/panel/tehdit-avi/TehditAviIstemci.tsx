"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Play, Sparkles, Download, ArrowRight, Terminal, Bot, ShieldCheck, Filter } from "lucide-react";
import { Panel, StatKart, Badge, Ulke, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { tehditAviCeviri } from "./tehdit-avi.i18n";

type Ceviri = (anahtar: string) => string;

interface AvOlay {
  id: string; ts: number; ip: string; country: string; asn: string; ua: string;
  path: string; method: string; botClass: string; verdict: string; score: number; headless: boolean; tls: boolean;
}
interface Ozet {
  ulkeler: { ad: string; sayi: number }[];
  sinifis: { ad: string; sayi: number }[];
  kararlar: { ad: string; sayi: number }[];
  benzersizIp: number;
}
interface Sonuc { eslesme: number; toplam: number; ozet: Ozet; olaylar: AvOlay[] }

// Bot sınıfı VALUE → i18n anahtarı (değer çevrilmez, yalnızca etiket).
const BOT_ANAHTAR: Record<string, string> = {
  human: "av.bot.human", good_bot: "av.bot.good_bot", automation: "av.bot.automation", scraper: "av.bot.scraper",
  credential_stuffing: "av.bot.credential_stuffing", ai_agent: "av.bot.ai_agent", ddos: "av.bot.ddos", spam: "av.bot.spam",
};

/** botClass değerini görüntü etiketine çevir (bilinmeyen değer olduğu gibi kalır). */
function botEtiket(deger: string, t: Ceviri): string {
  const a = BOT_ANAHTAR[deger];
  return a ? t(a) : deger;
}

export function TehditAviIstemci({
  dil, ilkSonuc, sablonlar, alanlar,
}: {
  dil: Dil;
  ilkSonuc: Sonuc;
  sablonlar: { ad: string; sorgu: string; aciklama: string }[];
  alanlar: string[];
}) {
  const t = (anahtar: string) => tehditAviCeviri(anahtar, dil);
  const { goster } = useToast();
  const [sorgu, setSorgu] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc>(ilkSonuc);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [calisti, setCalisti] = useState(false);

  async function calistir(q?: string) {
    const query = q ?? sorgu;
    setYukleniyor(true);
    try {
      const r = await fetch("/api/tehdit-avi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu: query }),
      });
      if (!r.ok) throw new Error();
      setSonuc(await r.json());
      setCalisti(true);
    } catch {
      goster({ tip: "hata", baslik: t("av.toast.calistirilamadi") });
    } finally {
      setYukleniyor(false);
    }
  }

  function sablonYukle(q: string) {
    setSorgu(q);
    calistir(q);
  }

  function disaAktar() {
    const basliklar = ["ts", "ip", "country", "asn", "botClass", "verdict", "score", "path", "method"];
    const satirlar = [basliklar.join(",")];
    for (const e of sonuc.olaylar) {
      satirlar.push([new Date(e.ts).toISOString(), e.ip, e.country, `"${e.asn}"`, e.botClass, e.verdict, e.score, e.path, e.method].join(","));
    }
    const blob = new Blob([satirlar.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "specter-av-sonuc.csv"; a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("av.toast.csvIndirildi") });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* sorgu çubuğu */}
      <Panel baslik={t("av.sorgu.baslik")}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
            <Terminal className="size-4 shrink-0 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && calistir()}
              placeholder={t("av.sorgu.yer")}
              className="w-full bg-transparent font-mono text-[13px] outline-none"
              aria-label={t("av.sorgu.ariaEtiket")}
            />
          </div>
          <Button onClick={() => calistir()} disabled={yukleniyor}>
            <Play className="size-4" /> {yukleniyor ? t("av.sorgu.calisiyor") : t("av.sorgu.calistir")}
          </Button>
        </div>
        {/* alan ipuçları — alan İSİMLERİ sorgu söz dizimi, çevrilmez */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-faint">{t("av.sorgu.alanlar")}</span>
          {alanlar.map((a) => (
            <button key={a} onClick={() => setSorgu((s) => (s ? s + " " : "") + a + ":")} className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-muted transition hover:bg-slate-100 hover:text-slate-ink">{a}</button>
          ))}
        </div>
      </Panel>

      {/* şablonlar */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint"><Sparkles className="size-3.5" /> {t("av.sablon.baslik")}</div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {sablonlar.map((s) => (
            <button key={s.ad} onClick={() => sablonYukle(s.sorgu)} className="group rounded-2xl border border-line bg-surface p-3.5 text-left transition hover:border-brand-200 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-ink">{s.ad}</span>
                <Play className="size-3.5 text-slate-faint transition group-hover:text-brand-600" />
              </div>
              <div className="mt-1 font-mono text-[11px] text-brand-700">{s.sorgu}</div>
              <div className="mt-0.5 text-[11.5px] text-slate-muted">{s.aciklama}</div>
            </button>
          ))}
        </div>
      </div>

      {/* özet + sonuç */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={sonuc.eslesme.toLocaleString("tr-TR")} etiket={calisti ? t("av.kpi.eslesen") : t("av.kpi.sonOlaylar")} ikon={<Filter className="size-5" />} tone="brand" />
        <StatKart sayi={sonuc.toplam.toLocaleString("tr-TR")} etiket={t("av.kpi.taranan")} ikon={<Terminal className="size-5" />} />
        <StatKart sayi={sonuc.ozet.benzersizIp.toLocaleString("tr-TR")} etiket={t("av.kpi.benzersizIp")} ikon={<Bot className="size-5" />} tone="danger" />
        <StatKart sayi={`%${sonuc.toplam ? Math.round((sonuc.eslesme / sonuc.toplam) * 100) : 0}`} etiket={t("av.kpi.eslesmeOrani")} ikon={<ShieldCheck className="size-5" />} />
      </div>

      {/* dağılım özetleri */}
      {sonuc.eslesme > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <DagilimKart baslik={t("av.dagilim.ulkeler")} veri={sonuc.ozet.ulkeler} bayrak />
          <DagilimKart baslik={t("av.dagilim.botSiniflari")} veri={sonuc.ozet.sinifis.map((s) => ({ ad: botEtiket(s.ad, t), sayi: s.sayi }))} />
          <DagilimKart baslik={t("av.dagilim.kararlar")} veri={sonuc.ozet.kararlar} />
        </div>
      )}

      {/* sonuç tablosu */}
      <Panel baslik={t("av.sonuc.baslik").replace("{n}", String(sonuc.olaylar.length))} sagUst={sonuc.olaylar.length > 0 && <Button variant="outline" size="sm" onClick={disaAktar}><Download className="size-4" /> CSV</Button>} padding={false}>
        <div className="overflow-x-auto px-6 pb-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="py-2 pr-3">{t("av.sonuc.zaman")}</th><th className="py-2 pr-3">{t("av.sonuc.ip")}</th><th className="py-2 pr-3">{t("av.sonuc.ulke")}</th>
                <th className="py-2 pr-3">{t("av.sonuc.sinif")}</th><th className="py-2 pr-3">{t("av.sonuc.karar")}</th><th className="py-2 pr-3">{t("av.sonuc.skor")}</th>
                <th className="py-2 pr-3">{t("av.sonuc.yol")}</th><th className="py-2">{t("av.sonuc.incele")}</th>
              </tr>
            </thead>
            <tbody>
              {sonuc.olaylar.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-muted">{t("av.sonuc.bos")}</td></tr>}
              {sonuc.olaylar.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-2.5 pr-3 text-[11.5px] text-slate-faint">{new Date(e.ts).toLocaleString("tr-TR")}</td>
                  <td className="py-2.5 pr-3 num text-[12.5px] font-medium text-slate-ink">{e.ip}</td>
                  <td className="py-2.5 pr-3"><Ulke kod={e.country} /></td>
                  <td className="py-2.5 pr-3 text-[12.5px] text-slate-muted">{botEtiket(e.botClass, t)}</td>
                  <td className="py-2.5 pr-3"><VerdictBadge v={e.verdict} t={t} /></td>
                  <td className="py-2.5 pr-3 num text-[12.5px]">{e.score.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 truncate text-[12px] text-slate-muted" title={e.path}>{e.path}</td>
                  <td className="py-2.5"><Link href={`/panel/tehdit/${encodeURIComponent(e.ip)}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700">{t("av.sonuc.ipDetay")} <ArrowRight className="size-3" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DagilimKart({ baslik, veri, bayrak }: { baslik: string; veri: { ad: string; sayi: number }[]; bayrak?: boolean }) {
  const max = Math.max(1, ...veri.map((v) => v.sayi));
  return (
    <Panel baslik={baslik}>
      <div className="space-y-2">
        {veri.length === 0 && <p className="text-[12px] text-slate-faint">—</p>}
        {veri.map((v) => (
          <div key={v.ad}>
            <div className="mb-0.5 flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-ink">{bayrak && <Ulke kod={v.ad} />} {v.ad}</span>
              <span className="num font-semibold text-slate-muted">{v.sayi}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(v.sayi / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function VerdictBadge({ v, t }: { v: string; t: Ceviri }) {
  if (v === "blocked") return <Badge ton="kirmizi">{t("av.karar.blocked")}</Badge>;
  if (v === "allowed") return <Badge ton="yesil">{t("av.karar.allowed")}</Badge>;
  if (v === "challenged") return <Badge ton="sari">{t("av.karar.challenged")}</Badge>;
  return <Badge ton="gri">{t("av.karar.isaret")}</Badge>;
}
