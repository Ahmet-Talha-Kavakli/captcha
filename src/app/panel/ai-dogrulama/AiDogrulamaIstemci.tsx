"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldX, ShieldAlert, Bot, Search, Terminal, Check, X, Globe, ArrowRight, Fingerprint, Radar } from "lucide-react";
import { Panel, StatKart, Badge, Ulke, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import type { AiKategori, AiAjan } from "@/lib/specter/ai-agents";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { aiDogrulamaCeviri } from "./ai-dogrulama.i18n";

interface KatalogAjan {
  id: string; urun: string; operator: string; kategori: AiKategori;
  dogrulama: "ip_aralik" | "reverse_dns" | "yok"; logo: string; ipYayin: string | null;
  risk: AiAjan["risk"]; gozlemDogrulanan: number; gozlemSahte: number;
}
interface SahteOrnek { ip: string; country: string; urun: string; ts: number; ua: string }

/** Dil → BCP-47 yerel etiketi (Intl sayı/tarih biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/**
 * Operatör (şirket) → resmi marka logosu dosyası (public/brand/ai/*.svg).
 * Eşleşmeyen operatörler için `undefined` döner ve jenerik Bot ikonu fallback kalır.
 */
const OPERATOR_LOGO: Record<string, string> = {
  OpenAI: "/brand/ai/openai.svg",
  Anthropic: "/brand/ai/anthropic.svg",
  Google: "/brand/ai/google.svg",
  Perplexity: "/brand/ai/perplexity.svg",
  ByteDance: "/brand/ai/bytedance.svg",
  "Common Crawl": "/brand/ai/commoncrawl.svg",
  Amazon: "/brand/ai/amazon.svg",
  Meta: "/brand/ai/meta.svg",
  Cohere: "/brand/ai/cohere.svg",
};

/**
 * Şirket logo çipi: operatör tanınıyorsa beyaz zeminli ring'li karede gerçek
 * marka logosunu, değilse marka rengiyle jenerik Bot ikonunu gösterir.
 */
function LogoCip({ operator, renk, boyut = "size-9" }: { operator: string; renk: string; boyut?: string }) {
  const logo = OPERATOR_LOGO[operator];
  if (logo) {
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-xl bg-white ring-1 ring-line p-1.5", boyut)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={operator} className="size-full object-contain" width={24} height={24} />
      </span>
    );
  }
  // `renk` çağrı yerlerinde ajanın LOGO YOLU ile besleniyor ("/logo/x.svg"), bu da
  // geçersiz bir CSS rengi → fallback rozetin arka planı boş kalıyordu. Yalnızca
  // gerçek renk değerlerini kabul et, aksi halde marka indigosuna düş.
  const gecerliRenk = /^(#|rgb|hsl)/i.test(renk) ? renk : "#4f46e5";
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-xl text-white", boyut)} style={{ background: gecerliRenk }}>
      <Bot className="size-4" />
    </span>
  );
}

interface DogrulamaSonuc {
  durum: "dogrulandi" | "sahte" | "dogrulanamaz" | "ptr_yok";
  yontem: string; aciklama: string; kanit: string | null;
  onerilenAksiyon: "izin" | "dogrula" | "engelle";
}

export function AiDogrulamaIstemci({
  dil, toplamAiIddia, dogrulanan, sahte, sahteOrnekler, katalog,
}: {
  dil: Dil;
  toplamAiIddia: number; dogrulanan: number; sahte: number;
  sahteOrnekler: SahteOrnek[]; katalog: KatalogAjan[];
}) {
  const { goster } = useToast();
  const t = (k: string) => aiDogrulamaCeviri(k, dil);
  const yerel = YEREL[dil];
  // enum-id → çeviri (lib TR etiket-map'leri düzenlenmeden yeniden türetilir)
  const yontemEt = (y: string) => t(`yontem.${y}`);

  // API lib'in TR açıklamasını döner; durum+yöntem+kanıttan istemcide yeniden türet.
  function sonucAciklama(s: DogrulamaSonuc, yontem: string): string {
    if (s.durum === "dogrulandi") {
      return yontem === "reverse_dns"
        ? t("sonuc.dogrulandi.dns")
        : t("sonuc.dogrulandi.ip").replace("{kanit}", s.kanit ?? "");
    }
    if (s.durum === "sahte") {
      return yontem === "reverse_dns" ? t("sonuc.sahte.dns") : t("sonuc.sahte.ip");
    }
    if (s.durum === "ptr_yok") return t("sonuc.ptr_yok");
    return t("sonuc.dogrulanamaz");
  }

  // canlı doğrulama aracı
  const [ua, setUa] = useState("Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)");
  const [ip, setIp] = useState("45.11.22.33");
  const [ptr, setPtr] = useState("");
  const [test, setTest] = useState<{ ajan: { urun: string; operator: string; logo: string; dogrulama: string; ipYayin: string | null } | null; sonuc: DogrulamaSonuc } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function calistir() {
    setYukleniyor(true);
    setTest(null);
    try {
      const r = await fetch("/api/ai-dogrula", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ua, ip, ptr: ptr || undefined }),
      });
      if (!r.ok) throw new Error();
      setTest(await r.json());
    } catch {
      goster({ tip: "hata", baslik: t("arac.hata") });
    } finally {
      setYukleniyor(false);
    }
  }

  const sahteOran = toplamAiIddia > 0 ? Math.round((sahte / toplamAiIddia) * 100) : 0;

  const durumStil: Record<string, { bg: string; tx: string; ikon: React.ReactNode }> = {
    dogrulandi: { bg: "bg-ok-soft border-green-200", tx: "text-green-700", ikon: <ShieldCheck className="size-5" /> },
    sahte: { bg: "bg-danger-soft border-danger-soft", tx: "text-danger2", ikon: <ShieldX className="size-5" /> },
    dogrulanamaz: { bg: "bg-canvas border-line", tx: "text-slate-muted", ikon: <ShieldAlert className="size-5" /> },
    ptr_yok: { bg: "bg-warn-soft border-warn-soft", tx: "text-amber-700", ikon: <ShieldAlert className="size-5" /> },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.metin").split("{sahte}").map((parca, i) => (
              <span key={i}>{parca}{i === 0 ? <b>{t("aciklama.sahte")}</b> : null}</span>
            ))}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={toplamAiIddia.toLocaleString(yerel)} etiket={t("ozet.iddia").replace("{n}", (2000).toLocaleString(yerel))} ikon={<Bot className="size-5" />} />
        <StatKart sayi={dogrulanan.toLocaleString(yerel)} etiket={t("ozet.dogrulanan")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={sahte.toLocaleString(yerel)} etiket={t("ozet.sahte")} ikon={<ShieldX className="size-5" />} tone="danger" />
        <StatKart sayi={`%${sahteOran}`} etiket={t("ozet.oran")} ikon={<Radar className="size-5" />} tone={sahteOran > 20 ? "danger" : sahteOran > 0 ? "warn" : "ok"} />
      </div>

      {/* canlı doğrulama aracı */}
      <Panel baslik={t("arac.baslik")} sagUst={<span className="flex items-center gap-1.5 text-[12px] text-slate-faint"><Terminal className="size-3.5" /> {t("arac.ipucu")}</span>}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("arac.ua")}</label>
              <input value={ua} onChange={(e) => setUa(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-[12px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("arac.ip")}</label>
                <input value={ip} onChange={(e) => setIp(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 num text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("arac.ptr")}</label>
                <input value={ptr} onChange={(e) => setPtr(e.target.value)} placeholder="crawl.perplexity.ai" className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-[12px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => { setUa("Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)"); setIp("20.15.245.10"); setPtr(""); }} className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-medium text-slate-muted transition hover:text-slate-ink">{t("arac.gercekGptbot")}</button>
              <button onClick={() => { setUa("Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)"); setIp("45.11.22.33"); setPtr(""); }} className="rounded-full bg-danger-soft px-3 py-1.5 text-[12px] font-medium text-danger2 transition hover:brightness-95">{t("arac.sahteGptbot")}</button>
              <button onClick={() => { setUa("Mozilla/5.0 (compatible; PerplexityBot/1.0)"); setIp("44.221.181.5"); setPtr("crawl.perplexity.ai"); }} className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-medium text-slate-muted transition hover:text-slate-ink">{t("arac.perplexity")}</button>
            </div>
            <Button onClick={calistir} disabled={yukleniyor} className="mt-1"><Search className="size-4" /> {yukleniyor ? t("arac.dogrulaniyor") : t("arac.dogrula")}</Button>
          </div>

          {/* sonuç */}
          <div className={cn("flex flex-col rounded-3xl border p-5", test ? durumStil[test.sonuc.durum].bg : "border-line bg-canvas/40")}>
            {!test ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-slate-faint">
                <ShieldCheck className="mb-2 size-8 opacity-40" />
                <span className="text-[13px]">{t("arac.sonucBos")}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={durumStil[test.sonuc.durum].tx}>{durumStil[test.sonuc.durum].ikon}</span>
                  <span className={cn("text-[16px] font-bold", durumStil[test.sonuc.durum].tx)}>{t(`durum.${test.sonuc.durum}`)}</span>
                </div>
                {test.ajan && (
                  <div className="mt-3 flex items-center gap-2">
                    <LogoCip operator={test.ajan.operator} renk={test.ajan.logo} boyut="size-8" />
                    <div>
                      <div className="text-[13px] font-semibold text-slate-ink">{test.ajan.urun}</div>
                      <div className="text-[11px] text-slate-faint">{test.ajan.operator} · {yontemEt(test.ajan.dogrulama)}</div>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-[12.5px] leading-relaxed text-slate-muted">{sonucAciklama(test.sonuc, test.ajan?.dogrulama ?? test.sonuc.yontem)}</p>
                {test.sonuc.kanit && <div className="mt-2 rounded-lg bg-white/60 px-2.5 py-1.5 font-mono text-[11px] text-slate-ink">{t("arac.kanit")} {test.sonuc.kanit}</div>}
                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-[12px] text-slate-muted">{t("arac.onerilenAksiyon")}</span>
                  <Badge ton={test.sonuc.onerilenAksiyon === "engelle" ? "kirmizi" : test.sonuc.onerilenAksiyon === "izin" ? "yesil" : "sari"}>
                    {t(`aksiyon.${test.sonuc.onerilenAksiyon}`)}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </Panel>

      {/* yakalanan sahte ajanlar */}
      {sahteOrnekler.length > 0 && (
        <Panel baslik={t("sahteTablo.baslik").replace("{n}", String(sahte))} padding={false}>
          <div className="overflow-x-auto px-6 pb-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                  <th className="py-2 pr-4">{t("sahteTablo.ip")}</th><th className="py-2 pr-4">{t("sahteTablo.ulke")}</th>
                  <th className="py-2 pr-4">{t("sahteTablo.iddia")}</th><th className="py-2 pr-4">{t("sahteTablo.zaman")}</th><th className="py-2 text-right">{t("sahteTablo.incele")}</th>
                </tr>
              </thead>
              <tbody>
                {sahteOrnekler.map((s, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-3 pr-4 num font-medium text-slate-ink">{s.ip}</td>
                    <td className="py-3 pr-4"><Ulke kod={s.country} /></td>
                    <td className="py-3 pr-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-[12px] font-medium text-danger2"><ShieldX className="size-3.5" /> {t("sahteTablo.sahtePrefix")} {s.urun}</span></td>
                    <td className="py-3 pr-4 text-[12px] text-slate-faint">{new Date(s.ts).toLocaleString(yerel)}</td>
                    <td className="py-3 text-right"><Link href={`/panel/tehdit/${encodeURIComponent(s.ip)}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("sahteTablo.tehdit")} <ArrowRight className="size-3.5" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* doğrulama kataloğu */}
      <Panel baslik={t("katalog.baslik")}>
        <p className="mb-4 text-sm text-slate-muted">{t("katalog.aciklama")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {katalog.map((a) => (
            <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogoCip operator={a.operator} renk={a.logo} />
                  <div>
                    <div className="text-[13.5px] font-semibold text-slate-ink">{a.urun}</div>
                    <div className="text-[11px] text-slate-faint">{a.operator}</div>
                  </div>
                </div>
                <Badge ton={a.dogrulama === "yok" ? "gri" : "mavi"}>{yontemEt(a.dogrulama)}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span className="rounded-full bg-canvas px-2 py-0.5 text-slate-muted">{t(`kategori.${a.kategori}`)}</span>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-slate-muted">{t("katalog.risk")} {t(`risk.${a.risk}`)}</span>
              </div>
              {(a.gozlemDogrulanan > 0 || a.gozlemSahte > 0) && (
                <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5 text-[12px]">
                  <span className="flex items-center gap-1 text-green-700"><Check className="size-3.5" /> {a.gozlemDogrulanan} {t("katalog.gercek")}</span>
                  {a.gozlemSahte > 0 && <span className="flex items-center gap-1 text-danger2"><X className="size-3.5" /> {a.gozlemSahte} {t("katalog.sahte")}</span>}
                </div>
              )}
              {a.ipYayin && (
                <a href={a.ipYayin} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-[11px] text-brand-600 hover:underline"><Globe className="size-3" /> {t("katalog.resmiIp")}</a>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* nasıl çalışır */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Fingerprint className="size-4" /> {t("nasil.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("nasil.metin")}</p>
        </div>
        <Button href="/panel/ai-ajanlar" variant="outline" size="sm">{t("nasil.buton")} <ArrowRight className="size-3.5" /></Button>
      </div>
    </div>
  );
}
