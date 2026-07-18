"use client";

import { useState } from "react";
import Link from "next/link";
import { Fingerprint, ShieldAlert, Code2, Play, Terminal, ArrowRight, Check, X, Search, Crosshair } from "lucide-react";
import { Panel, StatKart, Badge, Ulke, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { SIDDET_RENK } from "@/lib/specter/imza";
import type { Imza, ImzaVurusu } from "@/lib/specter/imza";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { imzaCeviri } from "./imza.i18n";

/** İmzanın koşullarını okunur metne çevirir. Alan/op/değer SÖZDİZİMİDİR (çevrilmez);
 *  yalnızca birleştirme bağlacının (VE/VEYA) görünen metni t() ile çevrilir. */
function kosulMetin(imza: Imza, t: (anahtar: string) => string): string {
  const ayrac = imza.birlestir === "or" ? t("kosul.veya") : t("kosul.ve");
  return imza.kosullar.map((k) => `${k.alan} ${k.op} "${k.deger}"`).join(ayrac);
}

export function ImzaIstemci({
  vuruslar, ozet, eslesenOlay, toplamOlay, kutuphane, dil,
}: {
  vuruslar: ImzaVurusu[];
  ozet: { toplamImza: number; tetiklenen: number; kritikVurus: number };
  eslesenOlay: number;
  toplamOlay: number;
  kutuphane: Imza[];
  dil: Dil;
}) {
  const t = (anahtar: string) => imzaCeviri(anahtar, dil);
  // Şiddet enum → etiket.
  const siddetAd = (s: Imza["siddet"]) => t(`siddet.${s}`);
  // Kategori enum → etiket.
  const kategoriAd = (k: Imza["kategori"]) => t(`kategori.${k}`);
  // İmza adı/açıklaması id anahtarlı; özel (kullanıcı) imzalarda lib'in metnine düşer.
  const imzaAd = (imza: Imza) => t(`imza.ad.${imza.id}`) === `imza.ad.${imza.id}` ? imza.ad : t(`imza.ad.${imza.id}`);
  const imzaAciklama = (imza: Imza) => t(`imza.aciklama.${imza.id}`) === `imza.aciklama.${imza.id}` ? imza.aciklama : t(`imza.aciklama.${imza.id}`);
  // Taktik TR kaynak → çeviri; eşleşme yoksa kaynağı koru.
  const taktikAd = (taktik: string) => t(`taktik.${taktik}`) === `taktik.${taktik}` ? taktik : t(`taktik.${taktik}`);

  const { goster } = useToast();
  const [sekme, setSekme] = useState<"vurus" | "kutuphane" | "derle">("vurus");
  const [sorgu, setSorgu] = useState("");

  // DSL derleyici durumu.
  const [dslAd, setDslAd] = useState("Özel imza");
  const [dsl, setDsl] = useState('ua contains "python" and score < 0.3');
  const [dslSonuc, setDslSonuc] = useState<{ vurus: number; benzersizIp: number; hata?: string; kosullar?: unknown[]; birlestir?: string } | null>(null);
  const [dslYukleniyor, setDslYukleniyor] = useState(false);

  async function dslTest() {
    setDslYukleniyor(true); setDslSonuc(null);
    try {
      const r = await fetch("/api/imza", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: dslAd, dsl }),
      });
      const d = await r.json();
      setDslSonuc(d);
      if (d.hata) goster({ tip: "hata", baslik: t("toast.derlemeHatasi"), aciklama: d.hata });
      else goster({ tip: "basari", baslik: t("toast.derlendi").replace("{n}", String(d.vurus)) });
    } catch {
      goster({ tip: "hata", baslik: t("toast.testBasarisiz") });
    } finally {
      setDslYukleniyor(false);
    }
  }

  const filtreVurus = vuruslar.filter((v) => !sorgu || `${v.imza.ad} ${v.imza.id} ${v.imza.kategori}`.toLowerCase().includes(sorgu.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Fingerprint className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")} <code className="rounded bg-canvas px-1 font-mono text-[11px]">ua contains "python" and score &lt; 0.3</code>{t("serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`${ozet.tetiklenen}/${ozet.toplamImza}`} etiket={t("ozet.tetiklenen")} ikon={<Fingerprint className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.kritikVurus} etiket={t("ozet.kritik")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart sayi={eslesenOlay.toLocaleString("tr-TR")} etiket={t("ozet.imzaliOlay")} ikon={<Crosshair className="size-5" />} tone="warn" />
        <StatKart sayi={`%${toplamOlay ? Math.round((eslesenOlay / toplamOlay) * 100) : 0}`} etiket={t("ozet.kapsama")} ikon={<Check className="size-5" />} />
      </div>

      {/* sekmeler */}
      <div className="flex gap-2">
        {([["vurus", t("sekme.vurus")], ["kutuphane", t("sekme.kutuphane")], ["derle", t("sekme.derle")]] as const).map(([k, ad]) => (
          <button key={k} onClick={() => setSekme(k)} className={cn("rounded-full px-4 py-2 text-[13px] font-medium transition", sekme === k ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>{ad}</button>
        ))}
      </div>

      {sekme === "vurus" && (
        <Panel baslik={t("vurus.baslik")} padding={false} sagUst={
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-1.5">
            <Search className="size-3.5 text-slate-faint" />
            <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("vurus.ara")} className="w-32 bg-transparent text-[12px] outline-none" aria-label={t("vurus.araAria")} />
          </div>
        }>
          <div className="divide-y divide-line">
            {filtreVurus.length === 0 && <p className="py-10 text-center text-sm text-slate-muted">{t("vurus.bos")}</p>}
            {filtreVurus.map((v) => (
              <div key={v.imza.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: SIDDET_RENK[v.imza.siddet] }}><Fingerprint className="size-5" /></span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-ink">{imzaAd(v.imza)}</span>
                        <span className="font-mono text-[11px] text-slate-faint">{v.imza.id}</span>
                        <Badge ton={v.imza.siddet === "kritik" || v.imza.siddet === "yuksek" ? "kirmizi" : v.imza.siddet === "orta" ? "sari" : "yesil"}>{siddetAd(v.imza.siddet)}</Badge>
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-slate-muted">{kategoriAd(v.imza.kategori)}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-slate-muted">{imzaAciklama(v.imza)}</p>
                      <div className="mt-1 font-mono text-[11px] text-brand-700">{kosulMetin(v.imza, t)}</div>
                      <div className="mt-1.5 flex items-center gap-1">{v.ulkeler.slice(0, 5).map((u) => <Ulke key={u} kod={u} />)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-faint">{t("vurus.ipEki").replace("{n}", String(v.benzersizIp))}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-faint">{taktikAd(v.imza.taktik)}</div>
                    </div>
                    {/* Vuruş sayısı — daire içinde rozet */}
                    <div
                      className="grid size-14 shrink-0 place-items-center rounded-full text-white ring-4 ring-white/60 shadow-card"
                      style={{ background: SIDDET_RENK[v.imza.siddet] }}
                      title={t("vurus.vurusTip").replace("{n}", v.vurus.toLocaleString("tr-TR"))}
                    >
                      <span className="num text-[17px] font-bold leading-none">{v.vurus.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {sekme === "kutuphane" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kutuphane.map((imza) => (
            <div key={imza.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-faint">{imza.id}</span>
                <Badge ton={imza.siddet === "kritik" || imza.siddet === "yuksek" ? "kirmizi" : imza.siddet === "orta" ? "sari" : "yesil"}>{siddetAd(imza.siddet)}</Badge>
              </div>
              <div className="mt-1.5 text-[14px] font-semibold text-slate-ink">{imzaAd(imza)}</div>
              <p className="mt-0.5 text-[12px] text-slate-muted">{imzaAciklama(imza)}</p>
              <div className="mt-2 rounded-lg bg-canvas px-2.5 py-1.5 font-mono text-[11px] text-slate-ink">{kosulMetin(imza, t)}</div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-faint">
                <span className="rounded-full bg-canvas px-2 py-0.5">{kategoriAd(imza.kategori)}</span>
                <span>· {taktikAd(imza.taktik)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sekme === "derle" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel baslik={t("derle.baslik")}>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("derle.imzaAdi")}</label>
                <input value={dslAd} onChange={(e) => setDslAd(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-muted">{t("derle.kural")}</label>
                <textarea value={dsl} onChange={(e) => setDsl(e.target.value)} rows={3} className="w-full rounded-xl border border-line-strong bg-[#0c1424] px-3.5 py-2.5 font-mono text-[12.5px] text-[#dbe4f0] outline-none focus:border-brand-400" spellCheck={false} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['ua contains "python"', 'botClass == "ai_agent"', 'score < 0.2', 'country in "RU,CN"', 'tls == true', 'headless == true'].map((s) => (
                  <button key={s} onClick={() => setDsl((d) => (d ? d + " and " : "") + s)} className="rounded-md bg-canvas px-2 py-1 font-mono text-[10.5px] text-slate-muted transition hover:bg-slate-100 hover:text-slate-ink">{s}</button>
                ))}
              </div>
              <Button onClick={dslTest} disabled={dslYukleniyor}><Play className="size-4" /> {dslYukleniyor ? t("derle.testEdiliyor") : t("derle.testEt")}</Button>
              <p className="text-[11.5px] text-slate-faint">
                <Terminal className="mr-1 inline size-3" /> {t("derle.operatorler")} <code className="font-mono">== != contains &lt; &gt; in</code> · {t("derle.birlestir")} <code className="font-mono">and / or</code>
              </p>
            </div>
          </Panel>

          <Panel baslik={t("derle.sonucBaslik")}>
            {!dslSonuc ? (
              <div className="grid h-40 place-items-center text-center text-slate-faint">
                <div><Code2 className="mx-auto mb-2 size-8 opacity-40" /><p className="text-[13px]">{t("derle.sonucBos")}</p></div>
              </div>
            ) : dslSonuc.hata ? (
              <div className="flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/40 px-3.5 py-3 text-[13px] text-danger2">
                <X className="mt-0.5 size-4 shrink-0" /> {dslSonuc.hata}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-center">
                  <div className="num text-[32px] font-bold text-brand-700">{dslSonuc.vurus}</div>
                  <div className="text-[12px] text-slate-muted">{t("derle.eslesti").replace("{n}", String(dslSonuc.benzersizIp))}</div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-ok-soft px-3 py-2.5 text-[12.5px] text-green-700">
                  <Check className="mt-0.5 size-4 shrink-0" /> {t("derle.gecerli")} {dslSonuc.vurus > 0 ? t("derle.eslesmeVar") : t("derle.eslesmeYok")}
                </div>
                <Link href="/panel/kurallar/gelismis" className="flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink">
                  {t("derle.kuralaCevir")} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
