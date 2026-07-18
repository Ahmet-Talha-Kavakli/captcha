"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, ShieldAlert, Search, ArrowRight, ChevronDown, Ban, Eye, ShieldCheck, Radar, Gauge } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { SEVIYE_RENK } from "@/lib/specter/birlesik-risk";
import type { IpRisk, RiskFaktor, RiskSeviye } from "@/lib/specter/birlesik-risk";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { birlesikRiskCeviri } from "./birlesik-risk.i18n";

// Öneri enum değeri → ton + ikon (enum değeri asla çevrilmez; ad çeviriden gelir).
const ONERI_TON: Record<string, { ton: "yesil" | "sari" | "kirmizi" | "gri"; ikon: React.ReactNode }> = {
  izin: { ton: "yesil", ikon: <ShieldCheck className="size-3.5" /> },
  izle: { ton: "gri", ikon: <Eye className="size-3.5" /> },
  dogrula: { ton: "sari", ikon: <Radar className="size-3.5" /> },
  engelle: { ton: "kirmizi", ikon: <Ban className="size-3.5" /> },
};

// Lib TR faktör adı → anahtar (lib yalnız TR `ad` üretir; anahtarı buradan türetiriz).
const FAKTOR_AD_ANAHTAR: Record<string, string> = {
  "Davranış & itibar": "itibar",
  "Tehdit beslemesi": "tehditFeed",
  "Datacenter/hosting": "datacenter",
  "Coğrafi risk": "cografya",
  "TLS/otomasyon imzası": "tls",
  "Tarayıcı tutarlılık": "tutarlilik",
  "Olay yoğunluğu": "yogunluk",
};

/** TR faktör adını anahtara çevirip yerel etikete eşle (dağılım + baskın faktör için). */
function faktorAd(trAd: string, dil: Dil): string {
  const anahtar = FAKTOR_AD_ANAHTAR[trAd];
  return anahtar ? birlesikRiskCeviri(`br.faktor.${anahtar}`, dil) : trAd;
}

/**
 * Faktör açıklamasını istemci-tarafında yeniden türet: lib TR üretir, biz
 * anahtar + TR açıklamadaki gömülü sayısal/veri jetonlarını çıkarıp çeviriye
 * yerleştiririz (sayı/ASN/ülke veri olarak korunur).
 */
function faktorAciklama(f: RiskFaktor, dil: Dil): string {
  const t = (k: string) => birlesikRiskCeviri(k, dil);
  const a = f.aciklama;
  switch (f.anahtar) {
    case "itibar": {
      const skor = a.match(/skoru\s+([\d.]+)/)?.[1] ?? "";
      const engel = a.match(/%(\d+)\./)?.[1] ?? "";
      return t("br.acik.itibar").replace("{skor}", skor).replace("{engel}", engel);
    }
    case "tehditFeed": {
      if (!f.aktif) return t("br.acik.tehditFeed.yok");
      const kaynaklar = a.replace(/\s*beslemelerinde listeli\.$/, "");
      return t("br.acik.tehditFeed.eslesti").replace("{kaynaklar}", kaynaklar);
    }
    case "datacenter": {
      if (!f.aktif) return t("br.acik.datacenter.hayir");
      const asn = a.match(/^(\S+)\s/)?.[1] ?? "";
      return t("br.acik.datacenter.evet").replace("{asn}", asn);
    }
    case "cografya": {
      const ulke = a.match(/^(\S+)\s/)?.[1] ?? "";
      return f.aktif
        ? t("br.acik.cografya.riskli").replace("{ulke}", ulke)
        : t("br.acik.cografya.dusuk").replace("{ulke}", ulke);
    }
    case "tls": {
      if (a.startsWith("UA")) return t("br.acik.tls.uyumsuz");
      if (a.startsWith("Headless")) return t("br.acik.tls.headless");
      return t("br.acik.tls.tutarli");
    }
    case "yogunluk": {
      const olay = a.match(/^(\d+)\s/)?.[1] ?? "";
      const kotu = a.match(/%(\d+)\s/)?.[1] ?? "";
      return t("br.acik.yogunluk").replace("{olay}", olay).replace("{kotu}", kotu);
    }
    default:
      return a;
  }
}

export function BirlesikRiskIstemci({
  dil, riskler, ozet, faktorDagilim,
}: {
  dil: Dil;
  riskler: IpRisk[];
  ozet: { toplamIp: number; kritik: number; yuksek: number; ortRisk: number; engellenmeli: number };
  faktorDagilim: { ad: string; tetiklenme: number; ortPuan: number }[];
}) {
  const t = (k: string) => birlesikRiskCeviri(k, dil);
  const [sorgu, setSorgu] = useState("");
  const [filtreSeviye, setFiltreSeviye] = useState<RiskSeviye | "hepsi">("hepsi");
  const [acik, setAcik] = useState<string | null>(riskler[0]?.ip ?? null);

  const filtreli = riskler.filter((r) =>
    (filtreSeviye === "hepsi" || r.seviye === filtreSeviye) &&
    (!sorgu || `${r.ip} ${r.country} ${r.asn}`.toLowerCase().includes(sorgu.toLowerCase())),
  );

  const seviyeler: (RiskSeviye | "hepsi")[] = ["hepsi", "kritik", "yuksek", "orta", "dusuk", "temiz"];
  const maxTetik = Math.max(1, ...faktorDagilim.map((f) => f.tetiklenme));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Layers className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("br.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("br.aciklama.govde").replace("{vurgu}", t("br.aciklama.vurgu"))}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamIp.toLocaleString("tr-TR")} etiket={t("br.ozet.ip")} ikon={<Layers className="size-5" />} />
        <StatKart sayi={ozet.kritik + ozet.yuksek} etiket={t("br.ozet.yuksekKritik")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.ortRisk} etiket={t("br.ozet.ort")} ikon={<Gauge className="size-5" />} tone={ozet.ortRisk >= 50 ? "warn" : "ok"} />
        <StatKart sayi={ozet.engellenmeli} etiket={t("br.ozet.engelle")} ikon={<Ban className="size-5" />} tone="danger" />
      </div>

      {/* faktör dağılımı */}
      <Panel baslik={t("br.dagilim.baslik")}>
        <p className="mb-3 text-[13px] text-slate-muted">{t("br.dagilim.aciklama")}</p>
        <div className="space-y-2.5">
          {faktorDagilim.map((f) => (
            <div key={f.ad}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-slate-ink">{faktorAd(f.ad, dil)}</span>
                <span className="num text-slate-muted">{t("br.dagilim.ipOrt").replace("{n}", String(f.tetiklenme)).replace("{p}", String(f.ortPuan))}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(f.tetiklenme / maxTetik) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* filtre + arama */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {seviyeler.map((s) => (
            <button key={s} onClick={() => setFiltreSeviye(s)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition", filtreSeviye === s ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
              {s === "hepsi" ? t("br.filtre.hepsi") : t(`br.seviye.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
          <Search className="size-4 text-slate-faint" />
          <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("br.ara.placeholder")} className="w-44 bg-transparent text-[13px] outline-none" aria-label={t("br.ara.placeholder")} />
        </div>
      </div>

      {/* IP risk listesi */}
      <Panel baslik={t("br.liste.baslik").replace("{n}", String(filtreli.length))} padding={false}>
        <div className="divide-y divide-line">
          {filtreli.length === 0 && <p className="py-10 text-center text-sm text-slate-muted">{t("br.liste.eslesmeYok")}</p>}
          {filtreli.map((r) => {
            const acikMi = acik === r.ip;
            const o = ONERI_TON[r.oneri];
            const oneriAd = t(`br.oneri.${r.oneri}`);
            return (
              <div key={r.ip}>
                <button onClick={() => setAcik(acikMi ? null : r.ip)} className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition hover:bg-canvas/40">
                  {/* risk halkası */}
                  <div className="relative grid size-12 shrink-0 place-items-center">
                    <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#eef0f4" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={SEVIYE_RENK[r.seviye]} strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - r.risk / 100)} />
                    </svg>
                    <span className="absolute num text-[13px] font-bold" style={{ color: SEVIYE_RENK[r.seviye] }}>{r.risk}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[14px] font-semibold text-slate-ink">{r.ip}</span>
                      <Ulke kod={r.country} />
                      <Badge ton={r.seviye === "kritik" || r.seviye === "yuksek" ? "kirmizi" : r.seviye === "orta" ? "sari" : "yesil"}>{t(`br.seviye.${r.seviye}`)}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-slate-faint">{t("br.liste.satirOzet").replace("{asn}", r.asn).replace("{olay}", String(r.toplamOlay)).replace("{faktor}", faktorAd(r.baskinFaktor, dil))}</div>
                  </div>
                  <Badge ton={o.ton}>{oneriAd}</Badge>
                  <ChevronDown className={cn("size-4 shrink-0 text-slate-faint transition", acikMi && "rotate-180")} />
                </button>
                {acikMi && (
                  <div className="border-t border-line bg-canvas/30 px-6 py-4">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("br.detay.baslik")}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {r.faktorler.map((f) => (
                        <div key={f.anahtar} className={cn("rounded-xl border px-3 py-2.5", f.aktif ? "border-line bg-surface" : "border-line/60 bg-transparent opacity-55")}>
                          <div className="flex items-center justify-between">
                            <span className="text-[12.5px] font-medium text-slate-ink">{birlesikRiskCeviri(`br.faktor.${f.anahtar}`, dil)}</span>
                            <span className="num text-[12px] font-semibold" style={{ color: f.puan >= 60 ? "#dc2626" : f.puan >= 30 ? "#d97706" : "#16a34a" }}>{f.puan}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                            <div className="h-full rounded-full" style={{ width: `${f.puan}%`, background: f.puan >= 60 ? "#dc2626" : f.puan >= 30 ? "#d97706" : "#16a34a" }} />
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-muted">{faktorAciklama(f, dil)} <span className="text-slate-faint">(×{f.agirlik})</span></p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Link href={`/panel/tehdit/${encodeURIComponent(r.ip)}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("br.detay.ipIstihbarat")} <ArrowRight className="size-3.5" /></Link>
                      {(r.oneri === "engelle" || r.oneri === "dogrula") && (
                        <Link href="/panel/kural-oneri" className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-ink-800">
                          {o.ikon} {t("br.detay.kuralOner").replace("{oneri}", oneriAd)}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
