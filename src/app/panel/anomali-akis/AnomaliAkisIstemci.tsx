"use client";

/**
 * Gerçek-Zaman Anomali Akışı — canlı NOC/SOC konsolu (istemci).
 * ============================================================
 * Gelen trafiği SSE (birincil) + /api/live polling (yedek) ile izler; batch
 * anomali motorunu (`anomaliTespit`) yuvarlanan bir olay tamponu üzerinde
 * sürekli yeniden çalıştırıp YENİ anomalileri akışa önden ekler. Ayrıca canlı
 * hız sıçraması (z >= taban+2σ), canlı tehdit seviyesi göstergesi, olay/sn &
 * bot/sn metrikleri, hız spark çizgisi ve anomali türü dağılımı sunar.
 *
 * SSE + yedek + bellek sınırı deseni GenelBakisIstemci.KomutaSeridi'nden
 * birebir kopyalanmıştır (EventSource birincil, /api/live polling yedek,
 * unmount'ta temizlik). Tamponlar kapasiteyle sınırlıdır (bellek koruması).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Activity, Waves, Radar, Ban, Bot, TriangleAlert, ArrowUpRight, Pause, Play,
  TrendingUp, TrendingDown, Globe, Cpu, Gauge, MapPin, Network, Sparkles, Zap,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { anomaliTespit } from "@/lib/specter/anomaly";
import type { BotEvent } from "@/lib/db/schema";
import {
  sicramaTespit, ewma, tamponaEkle, tehditSeviyesi, siddetAgirlik,
} from "@/lib/specter/anomali-akis";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { anomaliCeviri, anomaliMetin } from "./anomali-akis.i18n";

/** Sayfa geneli çeviri kısayolu tipi (alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/** Dil kodu → Intl yerel etiketi (sayı/saat biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ tipler */

/** SSE/polling'den gelen hafif olay (API'nin döndürdüğü alt küme). */
interface CanliOlay {
  id: string; ts: number; ip: string; country: string; asn: string; ua?: string;
  path?: string; method?: string; botClass: string; verdict: string; score: number;
  triggeredRules?: string[]; fingerprint?: string; latency?: number; siteId?: string;
}

interface BaslangicAnomali {
  tur: string; siddet: string; baslik: string; aciklama: string; oneri: string | null; skor: number;
}

/** Akışa düşen tekil anomali kaydı (zaman damgalı, benzersiz anahtarlı). */
interface AkisAnomali extends BaslangicAnomali {
  anahtar: string;
  ts: number;
  /** İlk yükte mi geldi (giriş animasyonu yalnızca canlı gelenlere uygulanır). */
  ilk?: boolean;
}

interface Props {
  dil: Dil;
  baslangicAnomaliler: BaslangicAnomali[];
  baslangicBotOran: number;
  tohumOlaySayisi: number;
}

/* ------------------------------------------------------------------ sabitler */

const OLAY_TAMPON = 1200; // batch motoruna beslenen yuvarlanan olay tamponu (bellek sınırı)
const HIZ_ORNEK = 30; // spark çizgisinde tutulan hız örneği sayısı
const AKIS_LIMIT = 40; // akışta gösterilen azami anomali (bellek sınırı)

/**
 * Anomali türü → ikon + renk. Enum güvenliği: `tur` enum değeri sabit;
 * kullanıcı etiketi render sırasında t("aa.tur.<tur>") ile çözülür (aşağıda
 * `turMeta` içinde), böylece TUR_META'ya çeviri gömülmez.
 */
const TUR_META: Record<string, { ikon: React.ReactNode; renk: string }> = {
  trafik_artis: { ikon: <TrendingUp className="size-4" />, renk: "#dc2626" },
  trafik_dus: { ikon: <TrendingDown className="size-4" />, renk: "#2f6fed" },
  bot_orani: { ikon: <Bot className="size-4" />, renk: "#d97706" },
  cografya: { ikon: <MapPin className="size-4" />, renk: "#7c3aed" },
  skor_dusus: { ikon: <Gauge className="size-4" />, renk: "#db2777" },
  ai_ajan: { ikon: <Cpu className="size-4" />, renk: "#0891b2" },
  yeni_asn: { ikon: <Network className="size-4" />, renk: "#059669" },
};
/** Tür meta + yerelleştirilmiş ad (bilinmeyen tür → enum değeri aynen). */
function turMeta(tur: string, t: Ceviri): { ikon: React.ReactNode; ad: string; renk: string } {
  const m = TUR_META[tur];
  const cev = t(`aa.tur.${tur}`);
  const ad = cev === `aa.tur.${tur}` ? tur : cev;
  return m ? { ...m, ad } : { ikon: <TriangleAlert className="size-4" />, ad, renk: "#6b6a63" };
}

/** Şiddet → görsel stil. Enum değeri sabit; ad t("aa.siddet.<s>") ile çözülür. */
const SIDDET_STIL: Record<string, { kutu: string; rozet: "kirmizi" | "sari" | "gri" }> = {
  kritik: { kutu: "border-danger-soft bg-danger-soft/50", rozet: "kirmizi" },
  yuksek: { kutu: "border-danger-soft bg-danger-soft/30", rozet: "kirmizi" },
  orta: { kutu: "border-warn-soft bg-warn-soft/40", rozet: "sari" },
  dusuk: { kutu: "border-line bg-canvas", rozet: "gri" },
};
/** Şiddet stili + yerelleştirilmiş ad. */
function siddetStil(s: string, t: Ceviri): { kutu: string; rozet: "kirmizi" | "sari" | "gri"; ad: string } {
  const st = SIDDET_STIL[s] ?? SIDDET_STIL.dusuk;
  const anahtar = SIDDET_STIL[s] ? s : "dusuk";
  return { ...st, ad: t(`aa.siddet.${anahtar}`) };
}

/** Öneri türüne göre eyleme bağlanan kısayol (etiket anahtarı + href). */
function anomaliEylem(tur: string): { adAnahtar: string; href: string } {
  switch (tur) {
    case "trafik_artis":
    case "trafik_dus":
      return { adAnahtar: "aa.satirEylem.tehdit", href: "/panel/tehdit" };
    case "bot_orani":
    case "skor_dusus":
      return { adAnahtar: "aa.satirEylem.zorluk", href: "/panel/zorluk" };
    case "ai_ajan":
    case "cografya":
    case "yeni_asn":
    default:
      return { adAnahtar: "aa.satirEylem.kural", href: "/panel/kural-oneri" };
  }
}

/** Anomali kimliği: aynı tür+başlık kısa aralıkta tekrar akışa düşmesin diye. */
function anomaliKimlik(a: { tur: string; baslik: string }): string {
  return `${a.tur}|${a.baslik}`;
}

/* ------------------------------------------------------------------ bileşen */

export function AnomaliAkisIstemci({ dil, baslangicAnomaliler, baslangicBotOran, tohumOlaySayisi }: Props) {
  const t = useCallback((anahtar: string) => anomaliCeviri(anahtar, dil), [dil]);
  const yerel = YEREL[dil];

  // prefers-reduced-motion — animasyonları kapatmak için.
  const [azaltilmisHareket, setAzaltilmisHareket] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uygula = () => setAzaltilmisHareket(mq.matches);
    uygula();
    mq.addEventListener?.("change", uygula);
    return () => mq.removeEventListener?.("change", uygula);
  }, []);

  const [canli, setCanli] = useState(true);

  // Canlı metrikler (state — render tetikler).
  const [eps, setEps] = useState(0); // olay/sn
  const [bps, setBps] = useState(0); // bot/sn
  const [hizSeri, setHizSeri] = useState<number[]>([]); // spark için son ~30 hız örneği
  const [ewmaHiz, setEwmaHiz] = useState<number | null>(null);
  const [sicrama, setSicrama] = useState(false);
  const [botOran, setBotOran] = useState(baslangicBotOran);
  const [oturumSayac, setOturumSayac] = useState({ toplam: 0, bot: 0, anomali: 0 });

  // Anomali akışı — ilk yük tohumdan gelenler (animasyonsuz).
  const [akis, setAkis] = useState<AkisAnomali[]>(() =>
    baslangicAnomaliler.map((a, i) => ({
      ...a,
      anahtar: `tohum-${i}-${anomaliKimlik(a)}`,
      ts: Date.now(),
      ilk: true,
    })),
  );

  // Ref'ler — effect içinde güncel değerlere yeniden-bağlanmadan erişim.
  const olayTamponRef = useRef<BotEvent[]>([]); // batch motoruna beslenen yuvarlanan tampon
  const gorulenKimlikRef = useRef<Map<string, number>>(new Map()); // kimlik → son görülme ts (tekrar bastırma)
  const sinceRef = useRef(Date.now() - 60000);
  const ewmaRef = useRef<number | null>(null);
  const hizSeriRef = useRef<number[]>([]);

  // Başlangıçta görülen anomali kimliklerini işaretle (tohumlar tekrar düşmesin).
  useEffect(() => {
    const simdi = Date.now();
    for (const a of baslangicAnomaliler) gorulenKimlikRef.current.set(anomaliKimlik(a), simdi);
    setOturumSayac((p) => ({ ...p, anomali: baslangicAnomaliler.length }));
    // yalnızca ilk montajda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------- SSE + polling yedek */
  // Desen GenelBakisIstemci.KomutaSeridi'nden birebir: EventSource birincil,
  // /api/live polling yedek, unmount'ta temizlik, tamponlar kapasiteyle sınırlı.
  useEffect(() => {
    if (!canli) return;
    let iptal = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const isle = (olaylar: CanliOlay[], pencereSn: number) => {
      if (iptal || !olaylar.length) {
        if (!iptal) setEps(0), setBps(0);
        // Hız 0 olsa bile spark serisine 0 örneği ekle (boşluk gerçekçi görünsün).
        if (!iptal) {
          const y = tamponaEkle(hizSeriRef.current, 0, HIZ_ORNEK);
          hizSeriRef.current = y;
          setHizSeri(y);
        }
        return;
      }

      // 1) since ilerlet + oturum sayaçları.
      sinceRef.current = Math.max(sinceRef.current, ...olaylar.map((e) => e.ts));
      const botOlay = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged");
      const eventPs = Math.max(0, Math.round(olaylar.length / pencereSn));
      const botPs = Math.max(0, Math.round(botOlay.length / pencereSn));
      setEps(eventPs);
      setBps(botPs);
      setOturumSayac((p) => ({ ...p, toplam: p.toplam + olaylar.length, bot: p.bot + botOlay.length }));

      // 2) Hız spark serisi + EWMA + sıçrama (z >= taban+2σ, önceki pencereye göre).
      const yeniSeri = tamponaEkle(hizSeriRef.current, eventPs, HIZ_ORNEK);
      hizSeriRef.current = yeniSeri;
      setHizSeri(yeniSeri);
      const yeniEwma = ewma(ewmaRef.current, eventPs, 0.3);
      ewmaRef.current = yeniEwma;
      setEwmaHiz(yeniEwma);
      const sic = sicramaTespit(yeniSeri, 2, 5);
      setSicrama(sic.sicrama);

      // 3) Yuvarlanan olay tamponunu güncelle (batch motoruna beslenir).
      //    Hafif CanliOlay'ı BotEvent'e tam-olmasa-da uyumlu şekilde besleriz;
      //    anomaliTespit yalnızca ts/verdict/country/botClass/score/asn kullanır.
      const donustur = olaylar.map(
        (e) =>
          ({
            id: e.id, siteId: e.siteId ?? "", ts: e.ts, ip: e.ip, country: e.country,
            asn: e.asn, ua: e.ua ?? "", path: e.path ?? "/", botClass: e.botClass as BotEvent["botClass"],
            verdict: e.verdict as BotEvent["verdict"], score: e.score, triggeredRules: e.triggeredRules ?? [],
            fingerprint: e.fingerprint ?? "", method: e.method ?? "GET", latency: e.latency ?? 0,
          }) as BotEvent,
      );
      let tampon = olayTamponRef.current.concat(donustur);
      if (tampon.length > OLAY_TAMPON) tampon = tampon.slice(tampon.length - OLAY_TAMPON);
      olayTamponRef.current = tampon;

      // Anlık bot oranı (tampon üzerinden, gösterge için).
      if (tampon.length) {
        const b = tampon.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
        setBotOran(b / tampon.length);
      }

      // 4) Batch motorunu tampon üzerinde yeniden çalıştır → YENİ anomalileri bul.
      //    anomaliTespit "en yeni önce" beklemez; ts'e göre kendi gruplar. Tampon
      //    ekleme sırasında (ts artan). Yalnız görülmemiş kimlikleri akışa ekle.
      if (tampon.length >= 20) {
        const bulunan = anomaliTespit(tampon);
        const simdi = Date.now();
        const yeniler: AkisAnomali[] = [];
        for (const a of bulunan) {
          const kimlik = anomaliKimlik(a);
          const sonGorulme = gorulenKimlikRef.current.get(kimlik);
          // Aynı anomali 90 sn içinde tekrar akışa düşmesin (gürültü bastırma).
          if (sonGorulme && simdi - sonGorulme < 90000) continue;
          gorulenKimlikRef.current.set(kimlik, simdi);
          yeniler.push({
            tur: a.tur, siddet: a.siddet, baslik: a.baslik, aciklama: a.aciklama,
            oneri: a.oneri ?? null, skor: a.skor,
            anahtar: `${simdi}-${kimlik}`, ts: simdi, ilk: false,
          });
        }
        // gorulenKimlik haritasını sınırla (bellek).
        if (gorulenKimlikRef.current.size > 200) {
          const yeni = new Map<string, number>();
          [...gorulenKimlikRef.current.entries()].slice(-100).forEach(([k, v]) => yeni.set(k, v));
          gorulenKimlikRef.current = yeni;
        }
        if (yeniler.length) {
          setAkis((p) => [...yeniler, ...p].slice(0, AKIS_LIMIT));
          setOturumSayac((p) => ({ ...p, anomali: p.anomali + yeniler.length }));
        }
      }
    };

    const pollBasla = () => {
      if (pollTimer) return;
      async function cek() {
        try {
          const r = await fetch(`/api/live?since=${sinceRef.current}`);
          if (!r.ok) return;
          const d = await r.json();
          isle(d.events || [], 3);
        } catch {
          /* sessiz */
        }
      }
      cek();
      pollTimer = setInterval(cek, 3000);
    };

    if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
      try {
        es = new EventSource("/api/live/stream");
        es.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data);
            if (Array.isArray(d.events)) isle(d.events, 2);
          } catch {
            /* ready/ping */
          }
        };
        es.onerror = () => {
          // SSE koparsa yedeğe düş (bağlantı yeniden kurulana dek polling).
          if (!pollTimer && !iptal) pollBasla();
        };
      } catch {
        es = null;
        pollBasla();
      }
    } else {
      pollBasla();
    }

    return () => {
      iptal = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canli]);

  /* -------------------------------------------------- türetilmiş */

  // Canlı tehdit seviyesi: bot oranı + aktif (son 5 dk) anomali ağırlığı + sıçrama.
  const aktifAgirlik = useMemo(() => {
    const simdi = Date.now();
    return akis
      .filter((a) => simdi - a.ts < 300000) // son 5 dk
      .reduce((t, a) => t + siddetAgirlik(a.siddet), 0);
  }, [akis]);
  const seviye = tehditSeviyesi(botOran, aktifAgirlik, sicrama);
  const seviyeMeta =
    seviye >= 70 ? { ad: t("aa.seviye.kritik"), renk: "#dc2626" }
      : seviye >= 45 ? { ad: t("aa.seviye.yuksek"), renk: "#ea580c" }
        : seviye >= 25 ? { ad: t("aa.seviye.orta"), renk: "#d97706" }
          : { ad: t("aa.seviye.dusuk"), renk: "#16a34a" };

  // Anomali türü dağılımı (akıştaki tüm anomaliler).
  const turDagilim = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of akis) m[a.tur] = (m[a.tur] || 0) + 1;
    return Object.entries(m).sort((x, y) => y[1] - x[1]);
  }, [akis]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-12 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Waves className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aa.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("aa.serit.aciklama")}</p>
        </div>
      </div>

      {/* canlı komuta bandı: tehdit seviyesi göstergesi + metrikler */}
      <div className="overflow-hidden rounded-[28px] border border-line bg-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex size-2.5">
              {canli && !azaltilmisHareket && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              )}
              <span className={cn("relative inline-flex size-2.5 rounded-full", canli ? "bg-emerald-400" : "bg-slate-500")} />
            </span>
            <span className="text-[15px] font-semibold">{t("aa.komuta.baslik")}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/60">
              {canli ? t("aa.canli") : t("aa.duraklatildi")}
            </span>
          </div>
          <button
            onClick={() => setCanli((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/80 transition hover:bg-white/20"
          >
            {canli ? <><Pause className="size-3.5" /> {t("aa.duraklat")}</> : <><Play className="size-3.5" /> {t("aa.devamEt")}</>}
          </button>
        </div>

        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {/* tehdit seviyesi göstergesi */}
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[12px] text-white/50"><Radar className="size-3.5" /> {t("aa.tehditSeviyesi")}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[24px] font-bold leading-none" style={{ color: seviyeMeta.renk }}>{seviyeMeta.ad}</span>
              <span className="num text-[13px] text-white/40">{seviye}/100</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full", !azaltilmisHareket && "transition-all duration-700")}
                style={{ width: `${seviye}%`, background: seviyeMeta.renk }}
              />
            </div>
          </div>

          {/* olay/sn + spark */}
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center justify-between text-[12px] text-white/50">
              <span className="flex items-center gap-1.5"><Activity className="size-3.5" /> {t("aa.olayHizi")}</span>
              {sicrama && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                  <Zap className="size-3" /> {t("aa.sicrama")}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="num text-[28px] font-bold leading-none tabular-nums">{eps}</span>
              <span className="text-[13px] text-white/40">{t("aa.olaySn")}</span>
            </div>
            <HizSpark seri={hizSeri} vurgu={sicrama} azaltilmisHareket={azaltilmisHareket} />
          </div>

          {/* bot/sn */}
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[12px] text-white/50"><Ban className="size-3.5" /> {t("aa.botHizi")}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="num text-[28px] font-bold leading-none tabular-nums">{bps}</span>
              <span className="text-[13px] text-white/40">{t("aa.botSn")}</span>
            </div>
            <div className="mt-2 text-[12px] text-white/40">
              {t("aa.botOrani").replace("{n}", String(Math.round(botOran * 100)))}
              {ewmaHiz !== null && <span> · {t("aa.taban").replace("{n}", ewmaHiz.toFixed(1))}</span>}
            </div>
          </div>

          {/* oturum sayaçları */}
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[12px] text-white/50"><TriangleAlert className="size-3.5" /> {t("aa.buOturum")}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="num text-[28px] font-bold leading-none tabular-nums">{oturumSayac.anomali}</span>
              <span className="text-[13px] text-white/40">{t("aa.anomali")}</span>
            </div>
            <div className="mt-2 num text-[12px] text-white/40">
              {t("aa.izlendi")
                .replace("{olay}", oturumSayac.toplam.toLocaleString(yerel))
                .replace("{bot}", oturumSayac.bot.toLocaleString(yerel))}
            </div>
          </div>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={akis.length} etiket={t("aa.kart.akistaAnomali")} ikon={<Waves className="size-5" />} tone={akis.length > 0 ? "warn" : "ok"} />
        <StatKart sayi={seviye} etiket={t("aa.kart.canliTehdit")} ikon={<Radar className="size-5" />} tone={seviye >= 45 ? "danger" : "ok"} />
        <StatKart sayi={`%${Math.round(botOran * 100)}`} etiket={t("aa.kart.anlikBot")} ikon={<Bot className="size-5" />} />
        <StatKart sayi={tohumOlaySayisi.toLocaleString(yerel)} etiket={t("aa.kart.izlenenOlay")} ikon={<Globe className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* canlı anomali akışı */}
        <Panel
          baslik={t("aa.panel.canliAkis")}
          padding={false}
          sagUst={
            <span className="flex items-center gap-1.5 text-[12px] text-slate-muted">
              <span className={cn("size-2 rounded-full bg-emerald-500", canli && !azaltilmisHareket && "animate-pulse")} />
              {canli ? t("aa.izleniyor") : t("aa.duraklatildi")}
            </span>
          }
        >
          <div className="max-h-[560px] overflow-y-auto px-6 pb-4">
            {akis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-ok-soft text-ok">
                  <Waves className="size-7" />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-ink">{t("aa.bos.baslik")}</p>
                <p className="mt-1 max-w-xs text-[13px] text-slate-muted">{t("aa.bos.aciklama")}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {akis.map((a) => (
                  <AnomaliSatir key={a.anahtar} a={a} azaltilmisHareket={azaltilmisHareket} t={t} yerel={yerel} dil={dil} />
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* yan panel: tür dağılımı + ipuçları */}
        <div className="space-y-6">
          {/* Canlı tehdit göstergesi — yarım-daire gauge (seviye 0-100).
              Komuta bandındaki çubuğu farklı bir görsel dille tekrarlar. */}
          <Panel baslik={t("aa.kart.canliTehdit")}>
            <div className="flex flex-col items-center gap-2 py-1">
              <GaugeGost deger={seviye} etiket={seviyeMeta.ad} renk={seviyeMeta.renk} boyut={168} />
              <div className="flex items-center gap-4 text-[12px] text-slate-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Bot className="size-3.5 text-slate-faint" />
                  {t("aa.kart.anlikBot")}
                  <span className="font-semibold tabular-nums text-slate-ink">%{Math.round(botOran * 100)}</span>
                </span>
                {sicrama && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger2">
                    <Zap className="size-3" /> {t("aa.sicrama")}
                  </span>
                )}
              </div>
            </div>
          </Panel>

          <Panel baslik={t("aa.panel.turDagilim")}>
            {turDagilim.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-muted">{t("aa.turYok")}</p>
            ) : (
              <DonutDagilim
                merkezEtiket={t("aa.anomali")}
                segmentler={turDagilim.map(([tur, sayi]) => {
                  const m = turMeta(tur, t);
                  return { etiket: m.ad, deger: sayi, renk: m.renk };
                })}
              />
            )}
          </Panel>

          <Panel baslik={t("aa.panel.hizliEylemler")}>
            <p className="mb-3 text-[12.5px] leading-relaxed text-slate-muted">{t("aa.hizli.aciklama")}</p>
            <div className="space-y-2">
              <EylemBaglanti href="/panel/kural-oneri" ikon={<Sparkles className="size-4" />} ad={t("aa.eylem.kuralAd")} desc={t("aa.eylem.kuralDesc")} />
              <EylemBaglanti href="/panel/zorluk" ikon={<Gauge className="size-4" />} ad={t("aa.eylem.zorlukAd")} desc={t("aa.eylem.zorlukDesc")} />
              <EylemBaglanti href="/panel/tehdit" ikon={<TriangleAlert className="size-4" />} ad={t("aa.eylem.tehditAd")} desc={t("aa.eylem.tehditDesc")} />
            </div>
          </Panel>

          <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-3 text-[12px] leading-relaxed text-slate-muted">
            {t("aa.dipnot").replace("{n}", tohumOlaySayisi.toLocaleString(yerel))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ akış satırı */
function AnomaliSatir({
  a, azaltilmisHareket, t, yerel, dil,
}: {
  a: AkisAnomali; azaltilmisHareket: boolean; t: Ceviri; yerel: string; dil: Dil;
}) {
  const m = turMeta(a.tur, t);
  const s = siddetStil(a.siddet, t);
  const eylem = anomaliEylem(a.tur);
  // Motor-metni yeniden türet: lib'in ürettiği TR başlık/açıklama/öneri,
  // enum `tur` + gömülü sayı/ülke token'larından yerel dile çevrilir.
  const metin = anomaliMetin(a, dil);
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        s.kutu,
        !azaltilmisHareket && !a.ilk && "animate-fade-up",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/70" style={{ color: m.renk }}>
          {m.ikon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-semibold text-slate-ink">{metin.baslik}</span>
            <Badge ton={s.rozet}>{s.ad}</Badge>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-slate-muted">{m.ad}</span>
            <span className="num ml-auto text-[11px] text-slate-faint">
              {new Date(a.ts).toLocaleTimeString(yerel)}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{metin.aciklama}</p>
          {metin.oneri && <p className="mt-1.5 text-[12px] italic text-slate-faint">→ {metin.oneri}</p>}
          <Link
            href={eylem.href}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 transition hover:text-brand-700"
          >
            {t(eylem.adAnahtar)} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ hız spark (inline SVG) */
function HizSpark({ seri, vurgu, azaltilmisHareket }: { seri: number[]; vurgu: boolean; azaltilmisHareket: boolean }) {
  const W = 120;
  const H = 30;
  if (seri.length < 2) {
    return <div className="mt-2 h-[30px]" aria-hidden="true" />;
  }
  const max = Math.max(...seri, 1);
  const step = W / (seri.length - 1);
  const nokta = (v: number, i: number) => [i * step, H - (v / max) * (H - 3) - 1.5] as const;
  const pts = seri.map((v, i) => nokta(v, i));
  const cizgi = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const alan = `${cizgi} L ${W} ${H} L 0 ${H} Z`;
  const son = pts[pts.length - 1];
  const renk = vurgu ? "#f87171" : "#34d399";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" style={{ height: H }} preserveAspectRatio="none" role="img" aria-label="Olay hızı spark çizgisi">
      <path d={alan} fill={renk} fillOpacity="0.12" />
      <path d={cizgi} fill="none" stroke={renk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={son[0]} cy={son[1]} r="2" fill={renk}>
        {vurgu && !azaltilmisHareket && <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />}
      </circle>
    </svg>
  );
}

/* ------------------------------------------------------------------ eylem bağlantısı */
function EylemBaglanti({ href, ikon, ad, desc }: { href: string; ikon: React.ReactNode; ad: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 transition hover:border-line-strong hover:bg-canvas">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{ikon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-slate-ink group-hover:text-brand-700">{ad}</div>
        <div className="truncate text-[11.5px] text-slate-muted">{desc}</div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  );
}
