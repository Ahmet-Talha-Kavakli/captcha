import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { Campaigns } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { PanelBaslik, Panel, DurumRozeti, Badge, BosDurum } from "@/components/panel/kit";
import { DonutDagilim, MiniSpark } from "@/components/panel/grafikler";
import { Histogram, Gauge } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { bayrak } from "@/lib/flag";
import { Crosshair, ChevronRight, Radar, ShieldCheck, Ban, Activity, Gauge as GaugeGost, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Kampanyalar — Veylify" };

const BOT_ETIKET: Record<string, string> = {
  scraper: "Kazıyıcı", credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam", automation: "Otomasyon",
};

export default async function KampanyalarPage() {
  const user = await currentUser();
  if (!user) return null;
  const campaigns = Campaigns.forOwner(user.id);

  const aktif = campaigns.filter((c) => c.status === "active").length;
  const azaltilan = campaigns.filter((c) => c.status === "mitigated").length;
  const toplamEngel = campaigns.reduce((a, c) => a + c.blockedRequests, 0);
  const toplamIstek = campaigns.reduce((a, c) => a + c.totalRequests, 0);
  const zirveRps = campaigns.reduce((a, c) => Math.max(a, c.peakRps), 0);
  const ortAzaltma = toplamIstek ? (toplamEngel / toplamIstek) * 100 : 0;

  // Kampanya türü dağılımı (donut) — engellenen istek ağırlıklı.
  const turSay: Record<string, number> = {};
  for (const c of campaigns) turSay[c.botClass] = (turSay[c.botClass] || 0) + c.blockedRequests;
  const turSegmentler = Object.entries(turSay)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ etiket: BOT_ETIKET[k] || k, deger: v, renk: botSinifGorsel(k).renk }));

  // Şiddet histogramı — zirve RPS bantlarına göre kampanya sayısı.
  const bantlar = [
    { etiket: "<1B", alt: 0, ust: 1000 },
    { etiket: "1-5B", alt: 1000, ust: 5000 },
    { etiket: "5-10B", alt: 5000, ust: 10000 },
    { etiket: "10-25B", alt: 10000, ust: 25000 },
    { etiket: "25B+", alt: 25000, ust: Infinity },
  ];
  const siddetKovalar = bantlar.map((b) => ({
    etiket: b.etiket,
    deger: campaigns.filter((c) => c.peakRps >= b.alt && c.peakRps < b.ust).length,
    ton: (b.alt >= 10000 ? "bot" : b.alt >= 1000 ? "nötr" : "insan") as "insan" | "bot" | "nötr",
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Tehdit İstihbaratı", href: "/panel/tehdit" }, { ad: "Kampanyalar" }]} baslik="Kampanyalar" />
      <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
        <PanelBaslik baslik="Saldırı Kampanyaları" aciklama="Koordineli bot saldırıları — tespit, azaltma ve izleme durumu." />

        {campaigns.length === 0 ? (
          <BosDurum ikon={<Crosshair className="size-8" />} baslik="Aktif kampanya yok" aciklama="Şu an koordineli bir saldırı tespit edilmedi." />
        ) : (
          <>
            {/* Ferah özet şerit */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-card lg:grid-cols-4">
              <OzetHucre
                ikon={<Radar className="size-4" />}
                sayi={aktif}
                etiket="Aktif saldırı"
                renk={aktif > 0 ? "text-danger2" : "text-slate-ink"}
                soft={aktif > 0 ? "bg-danger-soft text-danger2" : "bg-slate-100 text-slate-muted"}
                nabiz={aktif > 0}
              />
              <OzetHucre
                ikon={<ShieldCheck className="size-4" />}
                sayi={azaltilan}
                etiket="Azaltıldı"
                renk="text-ok"
                soft="bg-ok-soft text-ok"
              />
              <OzetHucre
                ikon={<Ban className="size-4" />}
                sayi={toplamEngel.toLocaleString("tr-TR")}
                etiket="Toplam engellenen"
                renk="text-slate-ink"
                soft="bg-brand-50 text-brand-600"
              />
              <OzetHucre
                ikon={<Zap className="size-4" />}
                sayi={zirveRps.toLocaleString("tr-TR")}
                etiket="Zirve RPS"
                renk="text-warn"
                soft="bg-warn-soft text-warn"
              />
            </div>

            {/* Tür donut + şiddet histogram */}
            <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
              <Panel baslik="Kampanya türü dağılımı">
                <p className="mb-4 text-[13px] text-slate-muted">Engellenen istek hacmine göre saldırı sınıfları.</p>
                <DonutDagilim segmentler={turSegmentler} />
              </Panel>
              <Panel baslik="Şiddet dağılımı">
                <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-muted">
                  <GaugeGost className="size-4 text-slate-faint" />
                  Zirve RPS bandına göre kampanya sayısı
                </div>
                <Histogram kovalar={siddetKovalar} yukseklik={150} />
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-canvas/50 px-4 py-3">
                  <span className="text-[13px] text-slate-muted">Ort. azaltma oranı</span>
                  <span className="num text-lg font-bold text-ok">%{ortAzaltma.toFixed(1)}</span>
                </div>
              </Panel>
            </div>

            {/* Zengin kampanya kartları */}
            <div className="grid gap-4 lg:grid-cols-2">
              {campaigns.map((c) => {
                const oran = c.totalRequests ? (c.blockedRequests / c.totalRequests) * 100 : 0;
                const g = botSinifGorsel(c.botClass);
                const Ikon = g.ikon;
                return (
                  <div key={c.id} className="group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition hover:border-line-strong hover:shadow-lift">
                    {/* tür renkli üst şerit */}
                    <span className="absolute inset-x-0 top-0 h-1" style={{ background: g.renk }} />
                    <div className="p-6 pt-7">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: g.soft, color: g.renk }}>
                            <Ikon className="size-5" strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0">
                            <Link href={`/panel/tehdit/kampanyalar/${c.id}`} className="group/l flex items-center gap-1 text-[17px] font-semibold text-slate-ink hover:text-brand-700">
                              <span className="truncate">{c.name}</span>
                              <ChevronRight className="size-4 shrink-0 text-slate-faint transition group-hover/l:translate-x-0.5" />
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge ton="gri">{BOT_ETIKET[c.botClass] || c.botClass}</Badge>
                              <span className="text-[12px] text-slate-faint">{new Date(c.startedAt).toLocaleDateString("tr-TR")}</span>
                            </div>
                          </div>
                        </div>
                        <DurumRozeti
                          ton={c.status === "active" ? "danger" : c.status === "monitoring" ? "warn" : "ok"}
                          etiket={c.status === "active" ? "Aktif" : c.status === "monitoring" ? "İzleniyor" : "Durduruldu"}
                          nabiz={c.status === "active"}
                        />
                      </div>

                      <div className="mt-5 flex items-center gap-4">
                        {/* mitigasyon gauge */}
                        <div className="shrink-0">
                          <Gauge deger={oran} etiket="azaltma" boyut={116} />
                        </div>
                        {/* metrikler + zirve spark */}
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Metrik ad="Toplam istek" deger={c.totalRequests.toLocaleString("tr-TR")} />
                            <Metrik ad="Engellenen" deger={c.blockedRequests.toLocaleString("tr-TR")} renk="text-danger2" />
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[12px]">
                              <span className="flex items-center gap-1.5 text-slate-muted"><Activity className="size-3.5 text-slate-faint" /> Zirve RPS</span>
                              <span className="num font-semibold text-slate-ink">{c.peakRps.toLocaleString("tr-TR")}</span>
                            </div>
                            <MiniSpark tohum={`${c.id}-rps`} renk={g.renk} yukseklik={34} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                        <div className="flex items-center gap-1.5">
                          {c.topCountries.slice(0, 4).map((k) => (
                            <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-canvas px-2 py-1 text-[11px] font-medium text-slate-muted" title={k}>
                              <span className="text-[13px] leading-none">{bayrak(k)}</span>
                              {k}
                            </span>
                          ))}
                        </div>
                        <span className="truncate text-[12px] text-slate-faint">{c.topAsns[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function OzetHucre({
  ikon, sayi, etiket, renk, soft, nabiz,
}: {
  ikon: React.ReactNode; sayi: string | number; etiket: string; renk: string; soft: string; nabiz?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 bg-surface px-5 py-5">
      <span className={`relative grid size-10 shrink-0 place-items-center rounded-2xl ${soft}`}>
        {ikon}
        {nabiz && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-danger2 ring-2 ring-surface" />}
      </span>
      <div className="min-w-0">
        <div className={`num text-2xl font-bold leading-none ${renk}`}>{sayi}</div>
        <div className="mt-1 truncate text-[12.5px] text-slate-muted">{etiket}</div>
      </div>
    </div>
  );
}

function Metrik({ ad, deger, renk }: { ad: string; deger: string; renk?: string }) {
  return (
    <div>
      <div className={`text-lg font-bold num ${renk || "text-slate-ink"}`}>{deger}</div>
      <div className="text-[11.5px] text-slate-muted">{ad}</div>
    </div>
  );
}
