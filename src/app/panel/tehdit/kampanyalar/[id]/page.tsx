import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { Campaigns, Sites, Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { Panel, StatKart, Badge, DurumRozeti, Ilerleme, Ulke } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { CografyaBar, TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Gauge, IsiMatris } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { ArrowLeft, ShieldCheck, Ban, CheckCircle2, Circle, Radar, TrendingUp, Zap, Crosshair } from "lucide-react";

export const metadata: Metadata = { title: "Kampanya — Veylify" };

const BOT_ETIKET: Record<string, string> = {
  scraper: "Kazıyıcı", credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam", automation: "Otomasyon",
};
const ULKE_AD: Record<string, string> = { TR: "Türkiye", US: "ABD", RU: "Rusya", CN: "Çin", DE: "Almanya", NL: "Hollanda", BR: "Brezilya", IN: "Hindistan", GB: "İngiltere", FR: "Fransa" };
const VERDICT_ETIKET: Record<string, string> = { allowed: "İzin", challenged: "Doğrula", blocked: "Engel", flagged: "İşaret" };

const FAZ_IKON = [Radar, TrendingUp, Zap, ShieldCheck, CheckCircle2];

export default async function KampanyaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return null;
  const c = Campaigns.byId(id);
  if (!c) notFound();
  const site = Sites.byId(c.siteId);
  if (!site || site.ownerId !== user.id) notFound();

  const oran = c.totalRequests ? (c.blockedRequests / c.totalRequests) * 100 : 0;
  const sure = Math.max(1, Math.round((Date.now() - c.startedAt) / 3600000));
  const g = botSinifGorsel(c.botClass);
  const HeroIkon = g.ikon;

  // Bu kampanyanın bot sınıfına ait gerçek olaylardan derin analiz.
  const siteOlaylar = Events.forSite(c.siteId, 2000);
  const kampanyaOlaylar = siteOlaylar.filter((e) => e.botClass === c.botClass && e.ts >= c.startedAt);

  // Zaman çizelgesi: son 24 saat, saatlik istek/engel yoğunluğu.
  const simdi = Date.now();
  const saatlik: number[] = Array.from({ length: 24 }, () => 0);
  const saatEtiket: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(simdi - i * 3600000);
    saatEtiket.push(`${String(d.getHours()).padStart(2, "0")}:00`);
  }
  for (const e of kampanyaOlaylar) {
    const saatFark = Math.floor((simdi - e.ts) / 3600000);
    if (saatFark >= 0 && saatFark < 24) {
      saatlik[23 - saatFark]++;
    }
  }
  // Hedeflenen yollar
  const yolSay: Record<string, number> = {};
  for (const e of kampanyaOlaylar) yolSay[e.path] = (yolSay[e.path] || 0) + 1;
  const yollar = Object.entries(yolSay).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxYol = Math.max(...yollar.map((y) => y[1]), 1);

  // Yol × karar ısı-matrisi (hangi yol hangi kararla karşılaştı).
  const kararKolon = ["allowed", "challenged", "blocked", "flagged"];
  const isiSatir = yollar.map(([y]) => y);
  const isiDeger = isiSatir.map((yol) =>
    kararKolon.map((v) => kampanyaOlaylar.filter((e) => e.path === yol && e.verdict === v).length),
  );

  // Saldırgan IP'ler
  const ipSay: Record<string, { sayi: number; country: string }> = {};
  for (const e of kampanyaOlaylar) {
    if (!ipSay[e.ip]) ipSay[e.ip] = { sayi: 0, country: e.country };
    ipSay[e.ip].sayi++;
  }
  const ipler = Object.entries(ipSay).sort((a, b) => b[1].sayi - a[1].sayi).slice(0, 8);
  const maxIp = Math.max(...ipler.map(([, d]) => d.sayi), 1);

  // Bot-sınıf / karar donut (bu kampanyadaki olayların karar dağılımı).
  const kararSay: Record<string, number> = {};
  for (const e of kampanyaOlaylar) kararSay[e.verdict] = (kararSay[e.verdict] || 0) + 1;
  const KARAR_RENK: Record<string, string> = { allowed: "#16a34a", challenged: "#d97706", blocked: "#dc2626", flagged: "#2f6fed" };
  const kararSegment = kararKolon
    .filter((v) => (kararSay[v] || 0) > 0)
    .map((v) => ({ etiket: VERDICT_ETIKET[v] || v, deger: kararSay[v] || 0, renk: KARAR_RENK[v] || "#6b6a63" }));

  // Saldırı fazları (durum bazlı)
  const fazlar = [
    { ad: "Keşif", aciklama: "İlk tarama ve zayıflık araması", tamam: true },
    { ad: "Tırmanış", aciklama: "İstek hacmi hızla arttı", tamam: c.totalRequests > 1000 },
    { ad: "Zirve", aciklama: `${c.peakRps.toLocaleString("tr-TR")} RPS'ye ulaştı`, tamam: c.peakRps > 0 },
    { ad: "Azaltma", aciklama: `%${oran.toFixed(0)} otomatik engellendi`, tamam: oran > 50 },
    { ad: "Sönümleme", aciklama: "Saldırı durduruldu", tamam: c.status === "mitigated" },
  ];
  const aktifFaz = fazlar.findIndex((f) => !f.tamam);

  return (
    <>
      <PanelUst kirintilar={[{ ad: "Tehdit İstihbaratı", href: "/panel/tehdit" }, { ad: "Kampanyalar", href: "/panel/tehdit/kampanyalar" }, { ad: c.name }]} baslik={c.name} />
      <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
        <Link href="/panel/tehdit/kampanyalar" className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted transition hover:text-slate-ink">
          <ArrowLeft className="size-3.5" /> Kampanyalar
        </Link>

        {/* Tür renkli hero şerit */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: g.renk }} />
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 pl-7">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: g.soft, color: g.renk }}>
                <HeroIkon className="size-7" strokeWidth={2.1} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge ton="gri">{BOT_ETIKET[c.botClass] || c.botClass}</Badge>
                  <DurumRozeti ton={c.status === "active" ? "danger" : c.status === "monitoring" ? "warn" : "ok"} etiket={c.status === "active" ? "Aktif saldırı" : c.status === "monitoring" ? "İzleniyor" : "Durduruldu"} nabiz={c.status === "active"} />
                </div>
                <div className="mt-1.5 text-[13px] text-slate-muted">{site.name} · {sure} saattir sürüyor</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" size="sm"><Ban className="size-4" /> Tümünü engelle</Button>
              <Button variant="outline" size="sm" href="/panel/kurallar">Kural oluştur</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatKart sayi={c.totalRequests.toLocaleString("tr-TR")} etiket="Toplam istek" />
          <StatKart sayi={c.blockedRequests.toLocaleString("tr-TR")} etiket="Engellenen" tone="danger" ikon={<ShieldCheck className="size-5" />} />
          <StatKart sayi={c.peakRps.toLocaleString("tr-TR")} etiket="Zirve RPS" tone="warn" ikon={<Zap className="size-5" />} />
          <StatKart sayi={`%${oran.toFixed(1)}`} etiket="Azaltma oranı" tone="ok" />
        </div>

        {/* Saldırı yaşam döngüsü — dikey timeline */}
        <Panel baslik="Saldırı yaşam döngüsü">
          <ol className="relative ml-1">
            {fazlar.map((f, i) => {
              const Ikon = f.tamam ? FAZ_IKON[i] : Circle;
              const aktif = i === aktifFaz;
              const sonuncu = i === fazlar.length - 1;
              return (
                <li key={f.ad} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* dikey çizgi */}
                  {!sonuncu && (
                    <span
                      className="absolute left-[19px] top-10 bottom-0 w-0.5"
                      style={{ background: f.tamam ? g.renk : "#e6e1d5" }}
                    />
                  )}
                  <span
                    className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ${
                      f.tamam ? "text-white" : aktif ? "bg-surface ring-2" : "bg-canvas text-slate-faint ring-1 ring-line"
                    }`}
                    style={
                      f.tamam
                        ? { background: g.renk }
                        : aktif
                          ? { color: g.renk, boxShadow: `inset 0 0 0 2px ${g.renk}` }
                          : undefined
                    }
                  >
                    <Ikon className="size-5" strokeWidth={2.1} />
                  </span>
                  <div className="pt-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[14px] font-semibold ${f.tamam || aktif ? "text-slate-ink" : "text-slate-faint"}`}>{f.ad}</span>
                      {f.tamam && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[10.5px] font-semibold text-ok">Tamam</span>}
                      {aktif && <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10.5px] font-semibold text-warn">Devam ediyor</span>}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-slate-muted">{f.aciklama}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        {/* Zaman çizelgesi + azaltma gauge */}
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel baslik="Saldırı yoğunluğu (son 24 saat)">
            <TrendGrafik
              noktalar={saatlik}
              etiketler={saatEtiket}
              renk="#dc2626"
              yukseklik={200}
            />
            <div className="mt-3 flex items-center gap-4 text-[12px] text-slate-muted">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-danger2" /> Toplam istek</span>
              <span className="num">Zirve: {Math.max(...saatlik, 0).toLocaleString("tr-TR")} / saat</span>
            </div>
          </Panel>
          <Panel baslik="Azaltma etkinliği">
            <div className="flex flex-col items-center">
              <Gauge deger={oran} etiket={oran > 90 ? "güçlü" : oran > 50 ? "orta" : "zayıf"} boyut={190} />
            </div>
            <Ilerleme deger={oran} ton={oran > 90 ? "ok" : "warn"} />
            <p className="mt-3 text-[13px] leading-relaxed text-slate-muted">
              {oran > 90
                ? "Veylify bu kampanyanın büyük çoğunluğunu otomatik engelliyor. Ek işlem gerekmez."
                : "Azaltma oranı düşük — kural motorunda bu bot türü için daha agresif bir kural ekleyebilirsin."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2.5">
                <div className="num text-lg font-bold text-slate-ink">{kampanyaOlaylar.length.toLocaleString("tr-TR")}</div>
                <div className="text-[11px] text-slate-faint">İlişkili olay</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2.5">
                <div className="num text-lg font-bold text-slate-ink">{ipler.length.toLocaleString("tr-TR")}</div>
                <div className="text-[11px] text-slate-faint">Benzersiz IP</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Hedeflenen yollar (dikey bar) + karar dağılımı donut */}
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Panel baslik="Hedeflenen yollar">
            {yollar.length > 0 ? (
              <div className="space-y-3">
                {yollar.map(([yol, sayi], i) => (
                  <div key={yol} className="flex items-center gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-danger-soft text-[11px] font-bold text-danger2">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                        <span className="num truncate font-medium text-slate-ink">{yol}</span>
                        <span className="num shrink-0 text-slate-muted">{sayi.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-danger2/80" style={{ width: `${(sayi / maxYol) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-slate-faint">Bu kampanya için yol verisi yok.</p>
            )}
          </Panel>
          <Panel baslik="Karar dağılımı">
            {kararSegment.length > 0 ? (
              <DonutDagilim segmentler={kararSegment} />
            ) : (
              <p className="py-6 text-center text-[13px] text-slate-faint">Karar verisi yok.</p>
            )}
          </Panel>
        </div>

        {/* Yol × karar ısı-matrisi */}
        {isiSatir.length > 0 && (
          <Panel baslik="Yol × karar yoğunluğu">
            <p className="mb-4 flex items-center gap-2 text-[13px] text-slate-muted">
              <Crosshair className="size-4 text-slate-faint" />
              Her hedef yolun hangi kararla karşılaştığı — koyu hücre yüksek yoğunluk.
            </p>
            <IsiMatris
              satirlar={isiSatir}
              sutunlar={kararKolon.map((v) => VERDICT_ETIKET[v] || v)}
              degerler={isiDeger}
            />
          </Panel>
        )}

        {/* Saldırgan IP'ler */}
        <Panel baslik="Saldırgan IP'ler">
          {ipler.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {ipler.map(([ip, d]) => (
                <Link key={ip} href={`/panel/tehdit/${encodeURIComponent(ip)}`} className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 transition hover:border-line-strong hover:bg-canvas/60">
                  <Ulke kod={d.country} />
                  <span className="num min-w-0 flex-1 truncate text-[13px] font-medium text-slate-ink group-hover:text-brand-700">{ip}</span>
                  <div className="flex w-24 shrink-0 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-danger2/80" style={{ width: `${(d.sayi / maxIp) * 100}%` }} />
                    </div>
                    <span className="num w-8 shrink-0 text-right text-[11px] font-semibold text-slate-muted">{d.sayi.toLocaleString("tr-TR")}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-[13px] text-slate-faint">IP verisi yok.</p>
          )}
        </Panel>

        {/* Coğrafya + ASN */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel baslik="Kaynak ülkeler">
            <CografyaBar ulkeler={c.topCountries.map((k, i) => ({ kod: k, ad: ULKE_AD[k] || k, deger: Math.round(c.totalRequests / (i + 2)) }))} />
          </Panel>
          <Panel baslik="Kaynak ağlar (ASN)">
            <div className="space-y-3">
              {c.topAsns.map((asn, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line px-3.5 py-3">
                  <span className="text-[13px] text-slate-ink">{asn}</span>
                  <Badge ton="kirmizi">{Math.round(c.blockedRequests / (i + 2)).toLocaleString("tr-TR")} engel</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
