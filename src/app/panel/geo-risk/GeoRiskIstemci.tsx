"use client";

/**
 * Coğrafi & ASN Risk Konsolu — istemci.
 * Tehdidin NEREDEN geldiğini görünür kılar (ülke + ağ operatörü) ve her
 * satırı bir aksiyona (kural oluştur) bağlar. Datacenter/hosting ASN'lerinin
 * neden yüksek riskli olduğunu açıkça ortaya koyar.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe, MapPinned, Server, ShieldAlert, Search, Filter, TriangleAlert,
  Info, ArrowUpRight, Network, ChevronDown, ChevronUp, Boxes,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ULKE_AD } from "@/lib/flag";
import type { UlkeRisk, AsnRisk, GeoOzet, RiskSeviye } from "@/lib/specter/geo-risk";
import { seviyeRenk } from "@/lib/specter/geo-risk";
import type { Dil } from "@/lib/i18n/panel";
import { geoRiskCeviri } from "./geo-risk.i18n";

/** Yerel çeviri fonksiyonu tipi (alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/* ---- Seviye rozet tonu (renk mantığı — enum DEĞERİ, çevrilmez) ---- */
const SEVIYE_TON: Record<RiskSeviye, "yesil" | "sari" | "kirmizi"> = {
  dusuk: "yesil", orta: "sari", yuksek: "kirmizi", kritik: "kirmizi",
};

/* ---- Risk çubuğu (renk-kodlu) ---- */
function RiskCubugu({ puan, seviye }: { puan: number; seviye: RiskSeviye }) {
  const renk = seviyeRenk(seviye);
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${puan}%`, background: renk }} />
      </div>
      <span className="num w-8 text-right text-[13px] font-bold" style={{ color: renk }}>{puan}</span>
    </div>
  );
}

function yuzde(v: number) {
  return `${Math.round(v * 100)}%`;
}

export function GeoRiskIstemci({
  ulkeRiskler,
  asnRiskler,
  ozet,
  dil,
}: {
  ulkeRiskler: UlkeRisk[];
  asnRiskler: AsnRisk[];
  ozet: GeoOzet;
  dil: Dil;
}) {
  const t: Ceviri = (anahtar) => geoRiskCeviri(anahtar, dil);
  // Enum DEĞERLERİ (seviye/bot sınıfı) veridir; yalnızca etiketleri anahtarla çözülür.
  const seviyeAd = (s: RiskSeviye) => t(`seviye.${s}`);
  const botAd = (b: string) => t(`bot.${b}`) === `bot.${b}` ? b : t(`bot.${b}`);

  const [sekme, setSekme] = useState<"ulke" | "asn">("ulke");
  const [sorgu, setSorgu] = useState("");
  const [yalnizYuksek, setYalnizYuksek] = useState(false);
  const [aciklamaAcik, setAciklamaAcik] = useState(false);

  const yuksekMi = (s: RiskSeviye) => s === "yuksek" || s === "kritik";

  const ulkeAd = (kod: string) => ULKE_AD[kod] ?? kod;

  const filtreliUlke = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return ulkeRiskler.filter((u) => {
      if (yalnizYuksek && !yuksekMi(u.seviye)) return false;
      if (!q) return true;
      return u.ulke.toLowerCase().includes(q) || ulkeAd(u.ulke).toLowerCase().includes(q);
    });
  }, [ulkeRiskler, sorgu, yalnizYuksek]);

  const filtreliAsn = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return asnRiskler.filter((a) => {
      if (yalnizYuksek && !yuksekMi(a.seviye)) return false;
      if (!q) return true;
      return (
        a.asnKod.toLowerCase().includes(q) ||
        a.asnAd.toLowerCase().includes(q) ||
        a.ulkeler.some((u) => u.toLowerCase().includes(q))
      );
    });
  }, [asnRiskler, sorgu, yalnizYuksek]);

  const enRiskliAsnAd = ozet.enRiskliAsn
    ? `${ozet.enRiskliAsn.asnKod}`
    : "—";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* giriş bandı */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <MapPinned className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("serit.aciklama")}</p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamUlke} etiket={t("ozet.toplamUlke")} ikon={<Globe className="size-5" />} />
        <StatKart
          sayi={ozet.yuksekRiskUlke}
          etiket={t("ozet.yuksekRiskUlke")}
          ikon={<ShieldAlert className="size-5" />}
          tone={ozet.yuksekRiskUlke > 0 ? "danger" : "ok"}
        />
        <StatKart sayi={ozet.toplamAsn} etiket={t("ozet.toplamAsn")} ikon={<Network className="size-5" />} />
        <StatKart
          sayi={enRiskliAsnAd}
          etiket={ozet.enRiskliAsn ? t("ozet.enRiskliAsnRisk").replace("{n}", String(ozet.enRiskliAsn.riskPuan)) : t("ozet.enRiskliAsn")}
          ikon={<Server className="size-5" />}
          tone={ozet.enRiskliAsn && yuksekMi(ozet.enRiskliAsn.seviye) ? "danger" : undefined}
        />
      </div>

      {/* sekmeler + araçlar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-line bg-surface p-1">
          <button
            onClick={() => setSekme("ulke")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              sekme === "ulke" ? "bg-ink-900 text-white" : "text-slate-muted hover:text-slate-ink",
            )}
          >
            <Globe className="size-4" /> {t("sekme.ulke")}
            <span className={cn("num rounded-full px-1.5 text-[11px]", sekme === "ulke" ? "bg-white/20" : "bg-canvas")}>
              {ulkeRiskler.length}
            </span>
          </button>
          <button
            onClick={() => setSekme("asn")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              sekme === "asn" ? "bg-ink-900 text-white" : "text-slate-muted hover:text-slate-ink",
            )}
          >
            <Server className="size-4" /> {t("sekme.asn")}
            <span className={cn("num rounded-full px-1.5 text-[11px]", sekme === "asn" ? "bg-white/20" : "bg-canvas")}>
              {asnRiskler.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={sekme === "ulke" ? t("arama.ulke") : t("arama.asn")}
              aria-label={t("arama.aria")}
              className="h-10 w-56 rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
          <button
            onClick={() => setYalnizYuksek((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-2xl border px-3.5 text-sm font-medium transition",
              yalnizYuksek
                ? "border-danger2/40 bg-danger-soft text-red-700"
                : "border-line-strong bg-surface text-slate-muted hover:text-slate-ink",
            )}
          >
            <Filter className="size-4" /> {t("filtre.yalnizYuksek")}
          </button>
        </div>
      </div>

      {/* --- ÜLKE riski tablosu --- */}
      {sekme === "ulke" && (
        <Panel padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40">
                  <th className="w-10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.no")}</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.ulke")}</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.risk")}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.toplamEngel")}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.botOran")}</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.baskinSinif")}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.tekilIp")}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ulke.th.aksiyon")}</th>
                </tr>
              </thead>
              <tbody>
                {filtreliUlke.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-faint">
                      {t("ulke.bos")}
                    </td>
                  </tr>
                ) : (
                  filtreliUlke.map((u, i) => (
                    <tr key={u.ulke} className="border-b border-line last:border-0 transition hover:bg-canvas/60">
                      <td className="px-5 py-3.5 num text-slate-faint">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Ulke kod={u.ulke} />
                          <span className="font-medium text-slate-ink">{ulkeAd(u.ulke)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <RiskCubugu puan={u.riskPuan} seviye={u.seviye} />
                          <Badge ton={SEVIYE_TON[u.seviye]}>{seviyeAd(u.seviye)}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right num text-slate-ink">
                        {u.toplam.toLocaleString("tr-TR")}
                        <span className="text-slate-faint"> / </span>
                        <span className="text-danger2">{u.engellenen.toLocaleString("tr-TR")}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right num font-semibold" style={{ color: u.botOran >= 0.5 ? "#dc2626" : "#6b6a63" }}>
                        {yuzde(u.botOran)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-muted">{botAd(u.baskinBotClass)}</td>
                      <td className="px-5 py-3.5 text-right num text-slate-muted">{u.tekilIp.toLocaleString("tr-TR")}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/panel/kurallar/gelismis?field=country&value=${u.ulke}&action=${u.riskPuan >= 50 ? "block" : "challenge"}`}
                          className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[12px] font-medium text-slate-ink transition hover:border-brand-400 hover:text-brand-700"
                        >
                          {t("aksiyon.kuralOlustur")} <ArrowUpRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* --- ASN riski tablosu (derin kısım) --- */}
      {sekme === "asn" && (
        <>
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-warn-soft px-5 py-3.5 text-[13px] text-amber-800">
            <Boxes className="mt-0.5 size-4 shrink-0" />
            <span>{t("asn.uyari")}</span>
          </div>
          <Panel padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/40">
                    <th className="w-10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.no")}</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.asn")}</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.risk")}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.toplamEngel")}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.botOran")}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.kotuItibar")}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("asn.th.aksiyon")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliAsn.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-faint">
                        {t("asn.bos")}
                      </td>
                    </tr>
                  ) : (
                    filtreliAsn.map((a, i) => (
                      <tr key={a.asn} className="border-b border-line last:border-0 transition hover:bg-canvas/60">
                        <td className="px-5 py-3.5 num text-slate-faint">{i + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[12px] font-semibold text-slate-faint">{a.asnKod}</span>
                            <span className="font-medium text-slate-ink">{a.asnAd}</span>
                            {a.datacenterAgirlikli && (
                              <Badge ton="kirmizi"><Server className="size-3" /> {t("asn.datacenterRozet")}</Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {a.ulkeler.slice(0, 5).map((k) => <Ulke key={k} kod={k} />)}
                            {a.ulkeler.length > 5 && (
                              <span className="text-[11px] text-slate-faint">+{a.ulkeler.length - 5}</span>
                            )}
                            <span className="text-[11px] text-slate-faint">· {t("asn.baskin").replace("{n}", botAd(a.baskinBotClass))}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <RiskCubugu puan={a.riskPuan} seviye={a.seviye} />
                            <Badge ton={SEVIYE_TON[a.seviye]}>{seviyeAd(a.seviye)}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right num text-slate-ink">
                          {a.toplam.toLocaleString("tr-TR")}
                          <span className="text-slate-faint"> / </span>
                          <span className="text-danger2">{a.engellenen.toLocaleString("tr-TR")}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right num font-semibold" style={{ color: a.botOran >= 0.5 ? "#dc2626" : "#6b6a63" }}>
                          {yuzde(a.botOran)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="num font-semibold text-slate-ink">{a.kotuItibarIp}</span>
                          <span className="text-slate-faint"> / {a.tekilIp}</span>
                          {a.datacenterIp > 0 && (
                            <div className="text-[11px] text-red-700">{t("asn.datacenterSayi").replace("{n}", String(a.datacenterIp))}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/panel/kurallar/gelismis?field=asn&value=${encodeURIComponent(a.asnKod)}&action=${a.riskPuan >= 50 ? "block" : "challenge"}`}
                            className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[12px] font-medium text-slate-ink transition hover:border-brand-400 hover:text-brand-700"
                          >
                            {t("aksiyon.kuralOlustur")} <ArrowUpRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* açıklayıcı (nasıl yorumlanır / nasıl kullanılır) */}
      <div className="rounded-3xl border border-line bg-surface">
        <button
          onClick={() => setAciklamaAcik((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-ink">
            <Info className="size-5 text-brand-600" /> {t("aciklama.baslik")}
          </span>
          {aciklamaAcik ? <ChevronUp className="size-5 text-slate-faint" /> : <ChevronDown className="size-5 text-slate-faint" />}
        </button>
        {aciklamaAcik && (
          <div className="space-y-4 border-t border-line px-6 py-5 text-[13.5px] leading-relaxed text-slate-muted">
            <div>
              <div className="mb-1 font-semibold text-slate-ink">{t("aciklama.dortSinyal")}</div>
              <ul className="list-inside list-disc space-y-1">
                <li>{t("aciklama.botOran")}</li>
                <li>{t("aciklama.engelOran")}</li>
                <li>{t("aciklama.dusukInsan")}</li>
                <li>{t("aciklama.hacim")}</li>
              </ul>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-ink">
                <TriangleAlert className="size-4 text-warn" /> {t("aciklama.asnEkSinyal")}
              </div>
              <p>{t("aciklama.asnMetin")}</p>
            </div>
            <div>
              <div className="mb-1 font-semibold text-slate-ink">{t("aciklama.nasilAksiyon")}</div>
              <ul className="list-inside list-disc space-y-1">
                <li>{t("aciklama.allowlist")}</li>
                <li>{t("aciklama.challenge")}</li>
                <li>{t("aciklama.datacenterBlock")}</li>
              </ul>
              <p className="mt-2">{t("aciklama.kuralNot")}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button href="/panel/kurallar/gelismis" variant="outline" size="sm">
                <Network className="size-4" /> {t("aciklama.gelismisKural")}
              </Button>
              <Button href="/panel/kurallar" variant="ghost" size="sm">{t("aciklama.kurallar")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
