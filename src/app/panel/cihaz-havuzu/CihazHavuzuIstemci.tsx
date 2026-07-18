"use client";

import { useState } from "react";
import Link from "next/link";
import { Fingerprint, Network, Search, ArrowRight, AlertTriangle, Cpu, Layers, MonitorSmartphone } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import type { CihazHavuzu, IpHavuzu } from "@/lib/specter/cihaz-havuzu";
import type { Dil } from "@/lib/i18n/panel";
import { cihazHavuzuCeviri } from "./cihaz-havuzu.i18n";
import { cn } from "@/lib/cn";

function renk(t: number) { return t >= 70 ? "#dc2626" : t >= 40 ? "#d97706" : "#16a34a"; }

export function CihazHavuzuIstemci({
  cihazlar, ipHavuzlari, ozet, dil,
}: {
  cihazlar: CihazHavuzu[];
  ipHavuzlari: IpHavuzu[];
  ozet: { supheliCihaz: number; supheliIp: number; enGenisCihaz: number; enGenisIp: number; toplamCihaz: number };
  dil: Dil;
}) {
  const t = (anahtar: string) => cihazHavuzuCeviri(anahtar, dil);
  // Bot sınıfı DEĞERİ veridir; yalnızca etiketi "bot.*" anahtarıyla çözülür.
  const botEtiket = (sinif: string) => t(`bot.${sinif}`) === `bot.${sinif}` ? sinif : t(`bot.${sinif}`);

  const [sekme, setSekme] = useState<"cihaz" | "ip">("cihaz");
  const [sorgu, setSorgu] = useState("");

  const filtreCihaz = cihazlar.filter((c) => !sorgu || `${c.fingerprint} ${c.ipler.join(" ")} ${c.ulkeler.join(" ")}`.toLowerCase().includes(sorgu.toLowerCase()));
  const filtreIp = ipHavuzlari.filter((i) => !sorgu || `${i.ip} ${i.asn} ${i.country}`.toLowerCase().includes(sorgu.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("serit.aciklama")}</p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.supheliCihaz} etiket={t("ozet.supheliCihaz")} ikon={<Fingerprint className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.enGenisCihaz} etiket={t("ozet.enGenisCihaz")} ikon={<Network className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.supheliIp} etiket={t("ozet.supheliIp")} ikon={<Layers className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.enGenisIp} etiket={t("ozet.enGenisIp")} ikon={<Cpu className="size-5" />} />
      </div>

      {/* sekme + arama */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setSekme("cihaz")} className={cn("rounded-full px-4 py-2 text-[13px] font-medium transition", sekme === "cihaz" ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
            {t("sekme.cihaz").replace("{n}", String(cihazlar.length))}
          </button>
          <button onClick={() => setSekme("ip")} className={cn("rounded-full px-4 py-2 text-[13px] font-medium transition", sekme === "ip" ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
            {t("sekme.ip").replace("{n}", String(ipHavuzlari.length))}
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
          <Search className="size-4 text-slate-faint" />
          <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("arama.placeholder")} className="w-40 bg-transparent text-[13px] outline-none" aria-label={t("arama.aria")} />
        </div>
      </div>

      {sekme === "cihaz" ? (
        <Panel baslik={t("cihaz.baslik")} padding={false}>
          {filtreCihaz.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-muted">{t("cihaz.bos")}</p>
          ) : (
            <div className="divide-y divide-line">
              {filtreCihaz.map((c) => (
                <div key={c.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-danger-soft text-danger2"><Fingerprint className="size-5" /></span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold text-slate-ink">{c.fingerprint.slice(0, 20)}</span>
                          <Badge ton="kirmizi">{t("cihaz.ipRozet").replace("{n}", String(c.ipler.length))}</Badge>
                          {c.cokUlke && <Badge ton="sari">{t("cihaz.ulkeRozet").replace("{n}", String(c.ulkeler.length))}</Badge>}
                          {c.headless && <Badge ton="gri">{t("cihaz.headless")}</Badge>}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-muted">
                          {t("cihaz.meta")
                            .replace("{sinif}", botEtiket(c.dominantBotClass))
                            .replace("{olay}", String(c.toplamOlay))
                            .replace("{ipBasina}", String(c.ipBasinaOlay))
                            .replace("{skor}", c.minSkor.toFixed(2))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {c.ulkeler.slice(0, 6).map((u) => <Ulke key={u} kod={u} />)}
                          <span className="ml-1 flex flex-wrap gap-1">
                            {c.ipler.slice(0, 5).map((ip) => (
                              <Link key={ip} href={`/panel/tehdit/${encodeURIComponent(ip)}`} className="rounded bg-canvas px-1.5 py-0.5 num text-[11px] text-slate-ink transition hover:bg-slate-100">{ip}</Link>
                            ))}
                            {c.ipler.length > 5 && <span className="text-[11px] text-slate-faint">+{c.ipler.length - 5}</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-[20px] font-bold" style={{ color: renk(c.tehditSkoru) }}>{c.tehditSkoru}</div>
                      <div className="text-[11px] text-slate-faint">{t("cihaz.tehdit")}</div>
                    </div>
                  </div>
                  {c.cokUlke && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/30 px-3 py-2 text-[12px] text-danger2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      {t("cihaz.cokUlkeUyari").replace("{n}", String(c.ulkeler.length))} <Link href="/panel/kurallar/gelismis" className="font-semibold underline">{t("cihaz.kuralOlustur")}</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : (
        <Panel baslik={t("ip.baslik")} padding={false}>
          {filtreIp.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-muted">{t("ip.bos")}</p>
          ) : (
            <div className="overflow-x-auto px-6 pb-2">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                    <th className="py-2 pr-4">{t("ip.th.ip")}</th><th className="py-2 pr-4">{t("ip.th.ulke")}</th><th className="py-2 pr-4">{t("ip.th.asn")}</th>
                    <th className="py-2 pr-4">{t("ip.th.fpCesidi")}</th><th className="py-2 pr-4">{t("ip.th.olay")}</th><th className="py-2">{t("ip.th.tehdit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreIp.map((i) => (
                    <tr key={i.id} className="border-t border-line">
                      <td className="py-3 pr-4"><Link href={`/panel/tehdit/${encodeURIComponent(i.ip)}`} className="num font-medium text-brand-700 hover:underline">{i.ip}</Link></td>
                      <td className="py-3 pr-4"><Ulke kod={i.country} /></td>
                      <td className="py-3 pr-4 text-[12px] text-slate-muted">{i.asn}</td>
                      <td className="py-3 pr-4"><span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-[12px] font-semibold text-amber-700"><Layers className="size-3.5" /> {i.fpCesidi}</span></td>
                      <td className="py-3 pr-4 num text-slate-ink">{i.toplamOlay}</td>
                      <td className="py-3"><span className="num font-bold" style={{ color: renk(i.tehditSkoru) }}>{i.tehditSkoru}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* nasıl kullanılır */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Fingerprint className="size-4" /> {t("cta.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("cta.aciklama")}</p>
        </div>
        <Link href="/panel/iliski-grafigi" className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10">{t("cta.iliskiGrafigi")} <ArrowRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}
