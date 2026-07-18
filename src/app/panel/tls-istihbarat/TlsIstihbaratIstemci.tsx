"use client";

import { useState } from "react";
import Link from "next/link";
import { Fingerprint, ShieldCheck, ShieldX, Bot, Terminal, Search, ArrowRight, AlertTriangle, Cpu } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { TLS_SINIF_RENK } from "@/lib/specter/tls-istihbarat";
import type { Ja3Kume, TlsSinif } from "@/lib/specter/tls-istihbarat";
import type { Dil } from "@/lib/i18n/panel";
import { tlsCeviri } from "./tls-istihbarat.i18n";
import { cn } from "@/lib/cn";

const SINIF_IKON: Record<TlsSinif, React.ReactNode> = {
  tarayici: <ShieldCheck className="size-4" />, arac: <Terminal className="size-4" />, headless: <Cpu className="size-4" />,
  ai: <Bot className="size-4" />, sahte: <ShieldX className="size-4" />, bilinmiyor: <Fingerprint className="size-4" />,
};

/**
 * Bilinen gerçek tarayıcı JA3'leri (lib'deki BILINEN_TARAYICI ile aynı VERİ).
 * Tarayıcı adı ("Chrome / Blink") çevrilmez — motor/ürün adıdır. Sadece
 * "tarayici" sınıfı açıklamasındaki {ad} yer tutucusunu doldurmak için burada.
 */
const BILINEN_TARAYICI: Record<string, string> = {
  cd08e31494f9531f560d64c695473da9: "Chrome / Blink",
  b32309a26951912be7dba376398abc3b: "Safari / WebKit",
  b20b44b18b853ef29ab773e921b03422: "Firefox / Gecko",
};

/** Küme açıklamasını `sinif` anahtarından yeniden kur (lib TR aciklama'sını kullanma). */
function kumeAciklama(k: Ja3Kume, t: (a: string) => string): string {
  if (k.sinif === "tarayici") {
    const ad = BILINEN_TARAYICI[k.ja3] ?? k.engine;
    return t("tls.aciklama.tarayici").replace("{ad}", ad);
  }
  return t(`tls.aciklama.${k.sinif}`);
}

export function TlsIstihbaratIstemci({
  kumeler, ozet, dil,
}: {
  kumeler: Ja3Kume[];
  ozet: { toplamJa3: number; tarayiciJa3: number; aracJa3: number; sahteJa3: number; uyumsuzOlay: number; sahteOran: number };
  dil: Dil;
}) {
  const t = (anahtar: string) => tlsCeviri(anahtar, dil);
  const [sorgu, setSorgu] = useState("");
  const [filtreSinif, setFiltreSinif] = useState<TlsSinif | "hepsi">("hepsi");

  const filtreli = kumeler.filter((k) =>
    (filtreSinif === "hepsi" || k.sinif === filtreSinif) &&
    (!sorgu || `${k.ja3} ${k.ornekUa} ${k.ornekIpler.join(" ")}`.toLowerCase().includes(sorgu.toLowerCase())),
  );

  const siniflar: (TlsSinif | "hepsi")[] = ["hepsi", "sahte", "arac", "headless", "ai", "tarayici", "bilinmiyor"];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Fingerprint className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("tls.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("tls.serit.aciklama") }} />
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamJa3} etiket={t("tls.ozet.benzersiz")} ikon={<Fingerprint className="size-5" />} />
        <StatKart sayi={ozet.sahteJa3} etiket={t("tls.ozet.sahte")} ikon={<ShieldX className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.uyumsuzOlay.toLocaleString(dil)} etiket={t("tls.ozet.uyumsuz")} ikon={<AlertTriangle className="size-5" />} tone="warn" />
        <StatKart sayi={`%${ozet.sahteOran}`} etiket={t("tls.ozet.oran")} ikon={<Terminal className="size-5" />} tone={ozet.sahteOran > 30 ? "danger" : "warn"} />
      </div>

      {/* sınıf dağılımı */}
      <Panel baslik={t("tls.dagilim.baslik")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["tarayici", "arac", "headless", "ai", "sahte", "bilinmiyor"] as TlsSinif[]).map((s) => {
            const say = kumeler.filter((k) => k.sinif === s).length;
            const olay = kumeler.filter((k) => k.sinif === s).reduce((a, k) => a + k.toplam, 0);
            return (
              <div key={s} className="rounded-2xl border border-line bg-surface p-3.5 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-xl text-white" style={{ background: TLS_SINIF_RENK[s] }}>{SINIF_IKON[s]}</span>
                <div className="mt-2 num text-[18px] font-bold text-slate-ink">{say}</div>
                <div className="text-[11px] text-slate-muted">{t(`tls.sinif.${s}`)}</div>
                <div className="text-[10px] text-slate-faint">{olay} {t("tls.dagilim.olay")}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* filtre + arama */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {siniflar.map((s) => (
            <button key={s} onClick={() => setFiltreSinif(s)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition", filtreSinif === s ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
              {s === "hepsi" ? t("tls.filtre.hepsi") : t(`tls.sinif.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
          <Search className="size-4 text-slate-faint" />
          <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("tls.ara.yer")} className="w-44 bg-transparent text-[13px] outline-none" aria-label={t("tls.ara.etiket")} />
        </div>
      </div>

      {/* JA3 kümeleri */}
      <Panel baslik={t("tls.kume.baslik").replace("{n}", String(filtreli.length))} padding={false}>
        <div className="divide-y divide-line">
          {filtreli.length === 0 && <p className="py-10 text-center text-sm text-slate-muted">{t("tls.kume.bos")}</p>}
          {filtreli.map((k) => (
            <div key={k.ja3} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: TLS_SINIF_RENK[k.sinif] }}>{SINIF_IKON[k.sinif]}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-slate-ink">{k.ja3.slice(0, 24)}</span>
                      <Badge ton={k.sinif === "tarayici" ? "yesil" : k.sinif === "sahte" || k.sinif === "arac" ? "kirmizi" : "sari"}>{t(`tls.sinif.${k.sinif}`)}</Badge>
                      {k.uyumsuz && <Badge ton="kirmizi">{t("tls.kume.uyumsuz")}</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-slate-muted">{kumeAciklama(k, t)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-faint">
                      <span>{t("tls.kume.olayIp").replace("{olay}", String(k.toplam)).replace("{ip}", String(k.benzersizIp))}</span>
                      <span>{t("tls.kume.motor").replace("{motor}", k.engine)}</span>
                      <span className="flex items-center gap-1">{k.ulkeler.slice(0, 4).map((u) => <Ulke key={u} kod={u} />)}</span>
                    </div>
                    <div className="mt-1.5 max-w-2xl truncate rounded bg-canvas px-2 py-1 font-mono text-[11px] text-slate-muted" title={k.ornekUa}>{k.ornekUa}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[20px] font-bold" style={{ color: k.tehditSkoru >= 60 ? "#dc2626" : k.tehditSkoru >= 30 ? "#d97706" : "#16a34a" }}>{k.tehditSkoru}</div>
                  <div className="text-[11px] text-slate-faint">{t("tls.kume.tehdit")}</div>
                  {k.ornekIpler[0] && <Link href={`/panel/tehdit/${encodeURIComponent(k.ornekIpler[0])}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700">{t("tls.kume.ip")} <ArrowRight className="size-3" /></Link>}
                </div>
              </div>
              {(k.sinif === "sahte" || k.sinif === "arac") && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/30 px-3 py-2 text-[12px] text-danger2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {k.sinif === "sahte" ? t("tls.kume.uyariSahte") : t("tls.kume.uyariArac")}
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* nasıl kullanılır */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Fingerprint className="size-4" /> {t("tls.cta.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("tls.cta.aciklama")}</p>
        </div>
        <Link href="/panel/cihaz-havuzu" className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10">{t("tls.cta.buton")} <ArrowRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}
