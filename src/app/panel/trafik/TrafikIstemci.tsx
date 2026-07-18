"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Bot, ShieldCheck, MapPin, Fingerprint, Server, Clock, Pause, Play, Download, Layers, Zap, Sparkles, Loader2 } from "lucide-react";
import { PanelBaslik, Panel, Badge, Tablo, Ulke, BosDurum, useScrollKilit, useToast, type Kolon } from "@/components/panel/kit";
import { Activity as ActivityIcon, Code2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/csv";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { trafikCeviri } from "./trafik.i18n";
import { DonutDagilim, MiniSpark } from "@/components/panel/grafikler";
import { SinifDagilimListesi, type DagilimSatir } from "@/components/panel/SinifDagilimListesi";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { bayrak } from "@/lib/flag";

interface Ev {
  id: string;
  ts: number;
  ip: string;
  country: string;
  city?: string;
  asn: string;
  ua: string;
  path: string;
  method: string;
  botClass: string;
  verdict: string;
  score: number;
  triggeredRules: string[];
  fingerprint: string;
  latency: number;
  siteId: string;
}

// Bot sınıflarının sabit anahtar sırası (etiketler i18n'den çözülür).
const BOT_SINIFLARI = ["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"];
// Karar (verdict) çip anahtarları → i18n anahtarları.
const VERDICTS = [
  { key: "all", ceviri: "tr.verdictTumu" },
  { key: "blocked", ceviri: "tr.engellendi" },
  { key: "challenged", ceviri: "tr.dogrulandi" },
  { key: "allowed", ceviri: "tr.izinVerildi" },
  { key: "flagged", ceviri: "tr.isaretlendi" },
];

export function TrafikIstemci({ events: ilk, sites, dil }: { events: Ev[]; sites: { id: string; name: string }[]; dil: Dil }) {
  const t = (k: string) => trafikCeviri(k, dil);
  const botEtiket = (k: string) => t(`tr.bot.${k}`);
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [verdict, setVerdict] = useState(params.get("verdict") || "all");
  const [botFilter, setBotFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [seçili, setSeçili] = useState<Ev | null>(null);
  const [canli, setCanli] = useState(true);
  const [events, setEvents] = useState<Ev[]>(ilk);
  const [denemeYukleniyor, setDenemeYukleniyor] = useState(false);
  const { goster } = useToast();

  // Deneme trafiği — kullanıcı BİLEREK ister; gerçek olaylar üretilir (dürüst,
  // otomatik değil). Widget entegre edilene kadar ürünü deneyimlemek için.
  const denemeTrafigiOlustur = async () => {
    setDenemeYukleniyor(true);
    try {
      const r = await fetch("/api/deneme-trafigi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adet: 40 }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        goster({ tip: "basari", baslik: d.mesaj });
        setTimeout(() => window.location.reload(), 700);
      } else {
        goster({ tip: "hata", baslik: d.error || "Deneme trafiği oluşturulamadı." });
        setDenemeYukleniyor(false);
      }
    } catch {
      goster({ tip: "hata", baslik: "Bağlantı hatası. Tekrar deneyin." });
      setDenemeYukleniyor(false);
    }
  };
  const [yeniSayac, setYeniSayac] = useState(0);
  // Bağlantı durumu: canlı SSE / yeniden bağlanıyor / kesildi.
  const [baglanti, setBaglanti] = useState<"baglaniyor" | "canli" | "kesildi">("baglaniyor");
  const sinceRef = useRef<number>(Date.now());

  // GERÇEK-ZAMAN akış: Server-Sent Events (SSE) push.
  // EventSource ile /api/live/stream'e bağlan; sunucu yeni olayları anlık iter.
  // EventSource yoksa (SSR/eski tarayıcı) veya hata olursa polling'e düşer.
  useEffect(() => {
    if (!canli) {
      setBaglanti("kesildi");
      return;
    }

    let aktif = true;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Gelen olay grubunu akışın başına ekle.
    const olaylariEkle = (yeni: Ev[]) => {
      if (!aktif || !yeni?.length) return;
      setEvents((p) => [...[...yeni].reverse(), ...p].slice(0, 500));
      setYeniSayac((v) => v + yeni.length);
    };

    // ---- Fallback: eski polling (SSE başarısızsa) ----
    const pollBasla = () => {
      if (pollTimer) return;
      const poll = async () => {
        try {
          const res = await fetch(`/api/live?since=${sinceRef.current}`);
          const data = await res.json();
          if (!aktif) return;
          sinceRef.current = data.now;
          setBaglanti("canli");
          olaylariEkle(data.events);
        } catch {
          if (aktif) setBaglanti("kesildi");
        }
      };
      poll();
      pollTimer = setInterval(poll, 3000);
    };

    // ---- Birincil: SSE ----
    if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
      try {
        setBaglanti("baglaniyor");
        es = new EventSource("/api/live/stream");
        es.onopen = () => {
          if (aktif) setBaglanti("canli");
        };
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.now) sinceRef.current = data.now;
            olaylariEkle(data.events);
            setBaglanti("canli");
          } catch {
            /* ready/ping gibi olaylar → yok say */
          }
        };
        es.onerror = () => {
          // EventSource kendi kendine yeniden bağlanmaya çalışır.
          if (aktif) setBaglanti("baglaniyor");
        };
      } catch {
        // EventSource kurulamadı → polling fallback.
        es = null;
        pollBasla();
      }
    } else {
      // SSR / desteklenmiyor → polling fallback.
      pollBasla();
    }

    return () => {
      aktif = false;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canli]);

  const filtreli = useMemo(() => {
    return events.filter((e) => {
      if (verdict !== "all" && e.verdict !== verdict) return false;
      if (botFilter !== "all" && e.botClass !== botFilter) return false;
      if (siteFilter !== "all" && e.siteId !== siteFilter) return false;
      if (q) {
        const alt = q.toLocaleLowerCase("tr");
        if (!e.ip.includes(q) && !e.path.toLowerCase().includes(alt) && !e.asn.toLowerCase().includes(alt) && !e.country.toLowerCase().includes(alt)) return false;
      }
      return true;
    });
  }, [events, verdict, botFilter, siteFilter, q]);

  const sayac = useMemo(() => {
    const c = { blocked: 0, challenged: 0, allowed: 0, flagged: 0 };
    for (const e of events) c[e.verdict as keyof typeof c] = (c[e.verdict as keyof typeof c] || 0) + 1;
    return c;
  }, [events]);

  // Canlı KPI şeridini "nefes aldırmak" için saniyede bir kaydırma penceresini
  // yeniden hesapla (yalnızca görsel; veri/akış mantığına dokunmaz).
  const [tik, setTik] = useState(0);
  useEffect(() => {
    if (!canli) return;
    const id = setInterval(() => setTik((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [canli]);

  // Kayan pencere KPI'ları — son olayların zaman damgalarına dayalı.
  const kpi = useMemo(() => {
    void tik; // saniyelik yeniden hesap için bağımlılık
    const simdi = Date.now();
    const son1dk = events.filter((e) => simdi - e.ts <= 60_000);
    const son10sn = events.filter((e) => simdi - e.ts <= 10_000);
    const bot1dk = son1dk.filter((e) => e.botClass !== "human").length;
    const engellenen1dk = son1dk.filter((e) => e.verdict === "blocked").length;
    const aktifIp = new Set(son1dk.map((e) => e.ip)).size;
    return {
      istekSaniye: son10sn.length / 10,
      son1dk: son1dk.length,
      botOrani: son1dk.length ? Math.round((bot1dk / son1dk.length) * 100) : 0,
      engellenen: engellenen1dk,
      aktifIp,
    };
  }, [events, tik]);

  // Görsel özet: son 120 olayın karar dağılımı (donut) + bot-sınıfı dağılımı.
  const ozet = useMemo(() => {
    const dilim = events.slice(0, 120);
    const kararSay = { allowed: 0, challenged: 0, blocked: 0, flagged: 0 };
    const sinifSay: Record<string, number> = {};
    for (const e of dilim) {
      kararSay[e.verdict as keyof typeof kararSay] = (kararSay[e.verdict as keyof typeof kararSay] || 0) + 1;
      sinifSay[e.botClass] = (sinifSay[e.botClass] || 0) + 1;
    }
    const kararDonut = [
      { etiket: t("tr.izinVerildi"), deger: kararSay.allowed, renk: "#16a34a" },
      { etiket: t("tr.dogrulandi"), deger: kararSay.challenged, renk: "#d97706" },
      { etiket: t("tr.engellendi"), deger: kararSay.blocked, renk: "#dc2626" },
      { etiket: t("tr.isaretlendi"), deger: kararSay.flagged, renk: "#94a3b8" },
    ];
    const sinifSatir: DagilimSatir[] = Object.entries(sinifSay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([sinif, deger]) => ({ sinif, etiket: botEtiket(sinif), deger }));
    return { kararDonut, sinifSatir };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, dil]);

  // Son ~12 dakikanın dakika-bazlı olay sayısı → mini trend serisi (spark tohumu).
  const trendTohum = useMemo(() => {
    const simdi = Date.now();
    const kovalar = Array.from({ length: 12 }, (_, i) => {
      const alt = simdi - (12 - i) * 60_000;
      const ust = alt + 60_000;
      return events.filter((e) => e.ts >= alt && e.ts < ust).length;
    });
    return kovalar.join("-") + "-" + events.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, tik]);

  const kolonlar: Kolon<Ev>[] = [
    {
      baslik: t("tr.kolon.zaman"),
      render: (e) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className={cn("size-1.5 shrink-0 rounded-full", Date.now() - e.ts <= 8000 ? "bg-ok animate-pulse-dot" : "bg-slate-200")} />
          <span className="num text-[13px] font-medium text-slate-ink">{new Date(e.ts).toLocaleTimeString("tr-TR")}</span>
        </span>
      ),
    },
    {
      baslik: t("tr.kolon.sinif"),
      render: (e) => {
        const g = botSinifGorsel(e.botClass);
        const Ikon = g.ikon;
        return (
          <span className="flex items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-md" style={{ background: g.soft, color: g.renk }}>
              <Ikon className="size-3.5" strokeWidth={2.2} />
            </span>
            <span className="text-[13px] font-medium">{botEtiket(e.botClass)}</span>
          </span>
        );
      },
    },
    { baslik: t("tr.kolon.ip"), render: (e) => <span className="num text-[13px] font-medium tracking-tight text-slate-ink">{e.ip}</span> },
    {
      baslik: t("tr.kolon.ulke"),
      render: (e) => (
        <span className="flex items-center gap-1.5">
          <span className="text-[15px] leading-none" aria-hidden>{bayrak(e.country)}</span>
          <Ulke kod={e.country} />
        </span>
      ),
    },
    { baslik: t("tr.kolon.yol"), render: (e) => <span className="num text-[13px] text-slate-muted">{e.path}</span> },
    { baslik: t("tr.kolon.katman"), render: (e) => <KatmanRozet ev={e} t={t} /> },
    { baslik: t("tr.kolon.skor"), render: (e) => <SkorMini skor={e.score} /> },
    { baslik: t("tr.kolon.karar"), render: (e) => <VerdictBadge verdict={e.verdict} t={t} /> },
  ];

  const aktifFiltre = verdict !== "all" || botFilter !== "all" || siteFilter !== "all" || q;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        baslik={t("tr.baslik")}
        aciklama={t("tr.aciklama")}
        aksiyon={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportCsv(
                  "specter-trafik.csv",
                  filtreli.slice(0, 500).map((e) => ({
                    zaman: new Date(e.ts).toISOString(),
                    ip: e.ip,
                    ulke: e.country,
                    asn: e.asn,
                    yol: e.path,
                    sinif: e.botClass,
                    karar: e.verdict,
                    skor: e.score.toFixed(2),
                  })),
                )
              }
            >
              <Download className="size-4" /> {t("tr.disaAktar")}
            </Button>
            <Button variant={canli ? "outline" : "accent"} size="sm" onClick={() => setCanli((v) => !v)}>
              {canli ? <Pause className="size-4" /> : <Play className="size-4" />}
              {canli ? t("tr.duraklat") : t("tr.devamEt")}
              {canli && <span className="ml-1 size-2 animate-pulse-dot rounded-full bg-ok" />}
            </Button>
          </>
        }
      />

      {/* Hiç olay yoksa (widget henüz entegre değil) → yönlendirici boş-durum. */}
      {events.length === 0 ? (
        <BosDurum
          ikon={<ActivityIcon className="size-8" />}
          baslik={t("tr.bosBaslik")}
          aciklama={t("tr.bosAciklama")}
          aksiyon={
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" href="/panel/gelistirici"><Code2 className="size-4" /> {t("tr.widgetEntegre")}</Button>
                <Button size="sm" variant="outline" href="/panel/siteler">{t("tr.sitelerim")}</Button>
              </div>
              <button
                onClick={denemeTrafigiOlustur}
                disabled={denemeYukleniyor}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-canvas/50 px-3.5 py-1.5 text-[12.5px] font-medium text-slate-muted transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
              >
                {denemeYukleniyor ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {denemeYukleniyor ? "Deneme trafiği üretiliyor…" : "Önce deneme trafiğiyle keşfet"}
              </button>
              <p className="max-w-xs text-center text-[11px] text-slate-faint">
                Widget&apos;ı entegre etmeden ürünü deneyimlemek için 40 örnek olay üretir. İstediğinde ayarlardan temizleyebilirsin.
              </p>
            </div>
          }
        />
      ) : (
      <>
      {/* ferah canlı KPI şeridi — kayan pencere, saniyede güncellenir */}
      <Panel padding className="overflow-hidden">
        <div className="mb-4 flex items-center gap-2">
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", canli ? "bg-ok-soft text-ok" : "bg-canvas text-slate-faint")}>
            <span className={cn("size-1.5 rounded-full", canli ? "bg-ok animate-pulse-dot" : "bg-slate-300")} />
            {canli ? t("tr.canli") : t("tr.duraklatildi")}
          </span>
          <span className="text-[13px] text-slate-faint">{t("tr.aciklama")}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <CanliKpi ikon={<Zap className="size-4" />} ton="brand" ad={t("tr.kpiIstekSaniye")} deger={kpi.istekSaniye.toFixed(1)} />
          <CanliKpi ikon={<ActivityIcon className="size-4" />} ton="brand" ad={t("tr.kpiSonDakika")} deger={kpi.son1dk.toLocaleString("tr-TR")} />
          <CanliKpi ikon={<Bot className="size-4" />} ton={kpi.botOrani >= 40 ? "danger" : "warn"} ad={t("tr.kpiBotOrani")} deger={`%${kpi.botOrani}`} />
          <CanliKpi ikon={<ShieldCheck className="size-4" />} ton="danger" ad={t("tr.kpiEngellenen")} deger={kpi.engellenen.toLocaleString("tr-TR")} />
          <CanliKpi ikon={<Server className="size-4" />} ton="ok" ad={t("tr.kpiAktifIp")} deger={kpi.aktifIp.toLocaleString("tr-TR")} />
        </div>
      </Panel>

      {/* görsel özet — karar donut + bot-sınıf dağılımı + son-dakika trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel baslik={t("tr.kararDagilimi")}>
          <DonutDagilim segmentler={ozet.kararDonut} />
        </Panel>
        <Panel baslik={t("tr.botSinifDagilimi")}>
          {ozet.sinifSatir.length > 0 ? (
            <SinifDagilimListesi satirlar={ozet.sinifSatir} azHareket />
          ) : (
            <div className="grid h-20 place-items-center text-[12px] text-slate-faint">{t("tr.hepsiTemiz")}</div>
          )}
        </Panel>
        <Panel baslik={t("tr.sonDakikaTrend")}>
          <div className="flex flex-col justify-between gap-3 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="num text-3xl font-bold text-slate-ink">{kpi.son1dk.toLocaleString("tr-TR")}</span>
              <span className="text-[12px] text-slate-muted">{t("tr.kpiSonDakika")}</span>
            </div>
            <MiniSpark tohum={trendTohum} renk="#2f6fed" yukseklik={72} />
          </div>
        </Panel>
      </div>

      {/* özet çubuğu — toplam karar sayaçları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat ad={t("tr.engellendi")} deger={sayac.blocked} renk="text-danger2" />
        <MiniStat ad={t("tr.dogrulandi")} deger={sayac.challenged} renk="text-warn" />
        <MiniStat ad={t("tr.izinVerildi")} deger={sayac.allowed} renk="text-ok" />
        <MiniStat ad={t("tr.isaretlendi")} deger={sayac.flagged} renk="text-slate-muted" />
      </div>

      {/* filtre çubuğu */}
      <Panel padding>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              aria-label={t("tr.araLabel")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("tr.araPlaceholder")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <select aria-label={t("tr.botFiltreLabel")} value={botFilter} onChange={(e) => setBotFilter(e.target.value)} className="h-10 rounded-2xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-400">
            <option value="all">{t("tr.tumSiniflar")}</option>
            {BOT_SINIFLARI.map((k) => (
              <option key={k} value={k}>
                {botEtiket(k)}
              </option>
            ))}
          </select>
          <select aria-label={t("tr.siteFiltreLabel")} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="h-10 rounded-2xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-400">
            <option value="all">{t("tr.tumSiteler")}</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* verdict çipleri */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VERDICTS.map((v) => (
            <button
              key={v.key}
              onClick={() => setVerdict(v.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                verdict === v.key ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
              )}
            >
              {t(v.ceviri)}
            </button>
          ))}
          {aktifFiltre && (
            <button
              onClick={() => {
                setQ("");
                setVerdict("all");
                setBotFilter("all");
                setSiteFilter("all");
              }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-danger2 hover:bg-danger-soft"
            >
              <X className="size-3.5" /> {t("tr.temizle")}
            </button>
          )}
        </div>

        {/* aktif filtre rozetleri — hangi filtrelerin uygulandığını gösterir */}
        {(botFilter !== "all" || siteFilter !== "all" || q) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            {q && <FiltreRozet etiket={`"${q}"`} kaldir={() => setQ("")} />}
            {botFilter !== "all" && <FiltreRozet etiket={botEtiket(botFilter)} kaldir={() => setBotFilter("all")} />}
            {siteFilter !== "all" && <FiltreRozet etiket={sites.find((s) => s.id === siteFilter)?.name ?? siteFilter} kaldir={() => setSiteFilter("all")} />}
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between text-[13px] text-slate-muted">
        <span>
          {t("tr.olaySayac").replace("{n}", filtreli.length.toLocaleString("tr-TR"))} {aktifFiltre && t("tr.filtreli")}
        </span>
        <BaglantiDurumu canli={canli} baglanti={baglanti} yeniSayac={yeniSayac} t={t} />
      </div>

      <Tablo kolonlar={kolonlar} veri={filtreli} sayfaBoyu={20} onSatir={(e) => setSeçili(e)} bosMesaj={t("tr.bosMesaj")} />
      </>
      )}

      {/* detay drawer */}
      <AnimatePresence>
        {seçili && <OlayDrawer ev={seçili} kapat={() => setSeçili(null)} t={t} botEtiket={botEtiket} />}
      </AnimatePresence>
    </div>
  );
}

/** SSE bağlantı durumu göstergesi: canlı (yeşil) / bağlanıyor / kesildi. */
function BaglantiDurumu({ canli, baglanti, yeniSayac, t }: { canli: boolean; baglanti: "baglaniyor" | "canli" | "kesildi"; yeniSayac: number; t: (k: string) => string }) {
  if (!canli) {
    return (
      <span className="flex items-center gap-1.5 text-slate-faint">
        <span className="size-2 rounded-full bg-slate-300" /> {t("tr.duraklatildi")}
      </span>
    );
  }
  if (baglanti === "canli") {
    return (
      <span className="flex items-center gap-1.5 text-ok">
        <span className="size-2 animate-pulse-dot rounded-full bg-ok" /> {t("tr.canliYeni").replace("{n}", String(yeniSayac))}
      </span>
    );
  }
  if (baglanti === "baglaniyor") {
    return (
      <span className="flex items-center gap-1.5 text-warn">
        <span className="size-2 animate-pulse rounded-full bg-warn" /> {t("tr.baglaniyor")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-danger2">
      <span className="size-2 rounded-full bg-danger2" /> {t("tr.baglantiKesildi")}
    </span>
  );
}

function MiniStat({ ad, deger, renk }: { ad: string; deger: number; renk: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3 shadow-card">
      <div className={cn("text-2xl font-bold num", renk)}>{deger.toLocaleString("tr-TR")}</div>
      <div className="text-[12px] text-slate-muted">{ad}</div>
    </div>
  );
}

/** Canlı KPI hücresi — ikon çipi + büyük sayı + etiket. */
function CanliKpi({ ikon, ad, deger, ton }: { ikon: React.ReactNode; ad: string; deger: string; ton: "brand" | "ok" | "warn" | "danger" }) {
  const cip = {
    brand: "bg-brand-50 text-brand-600",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger2",
  }[ton];
  return (
    <motion.div initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-3">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", cip)}>{ikon}</span>
      <div className="min-w-0">
        <div className="num text-2xl font-bold leading-tight text-slate-ink">{deger}</div>
        <div className="truncate text-[12px] text-slate-muted">{ad}</div>
      </div>
    </motion.div>
  );
}

/** Skor mini-göstergesi — küçük yatay çubuk + değer. Renk skora göre. */
function SkorMini({ skor }: { skor: number }) {
  const yuzde = Math.max(0, Math.min(100, Math.round(skor * 100)));
  const renk = skor < 0.35 ? "#dc2626" : skor < 0.6 ? "#d97706" : "#16a34a";
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-[#eceae2]">
        <span className="block h-full rounded-full" style={{ width: `${yuzde}%`, background: renk }} />
      </span>
      <span className="num text-[13px] font-semibold" style={{ color: renk }}>{skor.toFixed(2)}</span>
    </span>
  );
}

/** Kararı hangi katmanın verdiği — verdict/skora göre türetilir (görsel). */
function KatmanRozet({ ev, t }: { ev: Ev; t: (k: string) => string }) {
  void t;
  const katman =
    ev.triggeredRules.length > 0
      ? "Kural"
      : ev.verdict === "blocked"
        ? "Davranış"
        : ev.verdict === "challenged"
          ? "Challenge"
          : ev.botClass !== "human"
            ? "Parmak izi"
            : "Sinyal";
  const bot = ev.verdict !== "allowed" || ev.botClass !== "human";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium", bot ? "bg-brand-50 text-brand-600" : "bg-canvas text-slate-muted")}>
      <Layers className="size-3" strokeWidth={2.4} /> {katman}
    </span>
  );
}

/** Aktif filtre rozeti — etiket + çarpı (tek filtreyi kaldırır). */
function FiltreRozet({ etiket, kaldir }: { etiket: string; kaldir: () => void }) {
  return (
    <button onClick={kaldir} className="group inline-flex max-w-[200px] items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-600 transition hover:bg-brand-100">
      <span className="truncate">{etiket}</span>
      <X className="size-3 shrink-0 opacity-60 transition group-hover:opacity-100" />
    </button>
  );
}

function VerdictBadge({ verdict, t }: { verdict: string; t: (k: string) => string }) {
  if (verdict === "blocked") return <Badge ton="kirmizi">{t("tr.engellendi")}</Badge>;
  if (verdict === "allowed") return <Badge ton="yesil">{t("tr.izinVerildi")}</Badge>;
  if (verdict === "challenged") return <Badge ton="sari">{t("tr.dogrulandi")}</Badge>;
  return <Badge ton="gri">{t("tr.isaretlendi")}</Badge>;
}

function OlayDrawer({ ev, kapat, t, botEtiket }: { ev: Ev; kapat: () => void; t: (k: string) => string; botEtiket: (k: string) => string }) {
  useScrollKilit(true);
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-ink">{t("tr.olayDetayi")}</h2>
            <p className="text-[12px] text-slate-faint">{new Date(ev.ts).toLocaleString("tr-TR")}</p>
          </div>
          <button onClick={kapat} className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          <div className="mb-5 flex items-center justify-between rounded-xl border border-line bg-canvas/60 px-4 py-3">
            <span className="text-sm font-medium text-slate-ink">{t("tr.karar")}</span>
            <VerdictBadge verdict={ev.verdict} t={t} />
          </div>

          <SatirBilgi ton="mor" ikon={<Fingerprint className="size-4" />} etiket={t("tr.botSinifi")} deger={botEtiket(ev.botClass)} />
          <SatirBilgi ton={ev.score < 0.35 ? "kirmizi" : "yesil"} ikon={<span className="text-[13px] font-bold">S</span>} etiket={t("tr.insanlikSkoru")} deger={`${ev.score.toFixed(2)} / 1.00`} vurgu={ev.score < 0.35 ? "danger" : undefined} />
          <SatirBilgi ton="mavi" ikon={<MapPin className="size-4" />} etiket={t("tr.konum")} deger={`${ev.city ? ev.city + ", " : ""}${ev.country}`} />
          <SatirBilgi ton="turuncu" ikon={<Server className="size-4" />} etiket={t("tr.asn")} deger={ev.asn} />
          <SatirBilgi ton="mavi" ikon={<span className="text-[11px] font-bold">IP</span>} etiket={t("tr.ipAdresi")} deger={ev.ip} mono />
          <SatirBilgi ton="yesil" ikon={<Clock className="size-4" />} etiket={t("tr.yanitSuresi")} deger={`${ev.latency} ms`} />
          <SatirBilgi ton="mor" ikon={<span className="text-[11px] font-bold">{ev.method}</span>} etiket={t("tr.istek")} deger={ev.path} mono />
          <SatirBilgi ton="turuncu" ikon={<Fingerprint className="size-4" />} etiket={t("tr.parmakIzi")} deger={ev.fingerprint} mono />

          <div className="mt-4">
            <div className="mb-2 text-[13px] font-semibold text-slate-ink">{t("tr.userAgent")}</div>
            <div className="rounded-lg bg-canvas px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-muted">{ev.ua}</div>
          </div>

          <FingerprintPaneli ua={ev.ua} botClass={ev.botClass} ip={ev.ip} t={t} />


          {ev.triggeredRules.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-[13px] font-semibold text-slate-ink">{t("tr.tetiklenenKurallar")}</div>
              <div className="flex flex-wrap gap-1.5">
                {ev.triggeredRules.map((r, i) => (
                  <Badge key={i} ton="kirmizi">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" href={`/panel/tehdit/${encodeURIComponent(ev.ip)}`}>
              {t("tr.ipIncele")}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" href="/panel/kurallar">
              {t("tr.kuralOlustur")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FingerprintPaneli({ ua, botClass, ip, t }: { ua: string; botClass: string; ip: string; t: (k: string) => string }) {
  const fp = useMemo(() => fingerprintUret(ua, botClass, ip), [ua, botClass, ip]);
  const anomaliYuzde = Math.round(fp.headerAnomali * 100);
  const anomaliTon = fp.headerAnomali >= 0.5 ? "danger" : fp.headerAnomali >= 0.25 ? "warn" : "ok";
  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
        <Fingerprint className="size-4 text-brand-600" /> {t("tr.cihazParmakIzi")}
      </div>
      <div className="space-y-2 rounded-xl border border-line bg-canvas/50 p-3">
        <div className="grid grid-cols-2 gap-2">
          <FpKutu etiket="JA3" deger={fp.ja3} mono />
          <FpKutu etiket="HTTP" deger={fp.httpVersion} />
          <FpKutu etiket={t("tr.motor")} deger={fp.engine} />
          <FpKutu
            etiket={t("tr.headerAnomali")}
            deger={`%${anomaliYuzde}`}
            ton={anomaliTon === "danger" ? "danger" : anomaliTon === "warn" ? "warn" : undefined}
          />
        </div>
        {/* JA4 tam satır */}
        <div className="rounded-lg bg-surface px-2.5 py-1.5">
          <div className="text-[10px] uppercase tracking-wide text-slate-faint">JA4</div>
          <div className="truncate font-mono text-[11px] text-slate-ink">{fp.ja4}</div>
        </div>
        {/* durum rozetleri */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {fp.headless && <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-1 text-[11px] font-semibold text-danger2"><Bot className="size-3" /> {t("tr.headless")}</span>}
          {fp.tlsUaUyumsuz && <span className="rounded-md bg-danger-soft px-2 py-1 text-[11px] font-semibold text-danger2">{t("tr.tlsUaUyumsuz")}</span>}
          {fp.automationFlags.map((f) => (
            <span key={f} className="rounded-md bg-warn-soft px-2 py-1 font-mono text-[11px] font-medium text-amber-700">{f}</span>
          ))}
          {!fp.headless && !fp.tlsUaUyumsuz && fp.automationFlags.length === 0 && (
            <span className="rounded-md bg-ok-soft px-2 py-1 text-[11px] font-semibold text-ok">{t("tr.otomasyonBayragiYok")}</span>
          )}
        </div>
        {/* sinyaller */}
        {fp.sinyaller.length > 0 && (
          <ul className="space-y-1 pt-1">
            {fp.sinyaller.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-slate-muted">
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", fp.headerAnomali >= 0.4 ? "bg-danger2" : "bg-brand-500")} />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FpKutu({ etiket, deger, mono, ton }: { etiket: string; deger: string; mono?: boolean; ton?: "danger" | "warn" }) {
  return (
    <div className="rounded-lg bg-surface px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className={cn("truncate text-[12px] font-semibold", mono && "font-mono text-[11px]", ton === "danger" ? "text-danger2" : ton === "warn" ? "text-warn" : "text-slate-ink")}>{deger}</div>
    </div>
  );
}

function SatirBilgi({ ikon, etiket, deger, mono, vurgu, ton = "mavi" }: { ikon: React.ReactNode; etiket: string; deger: string; mono?: boolean; vurgu?: "danger"; ton?: "mavi" | "yesil" | "kirmizi" | "turuncu" | "mor" }) {
  const tonlar = {
    mavi: "bg-brand-50 text-brand-600",
    yesil: "bg-ok-soft text-ok",
    kirmizi: "bg-danger-soft text-danger2",
    turuncu: "bg-warn-soft text-warn",
    mor: "bg-violet-100 text-violet-600",
  }[ton];
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <span className="flex items-center gap-2.5 text-[13px] text-slate-muted">
        <span className={cn("grid size-7 place-items-center rounded-lg", tonlar)}>{ikon}</span>
        {etiket}
      </span>
      <span className={cn("text-[13px] font-semibold", mono && "num tracking-tight", vurgu === "danger" ? "text-danger2" : "text-slate-ink")}>{deger}</span>
    </div>
  );
}
