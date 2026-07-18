"use client";

/**
 * Davranış Yakalama Stüdyosu — istemci
 * =====================================
 * CANLI biyometrik yakalama kanıtı. Yöneticinin KENDİ faresi/klavyesi/scroll'u
 * tarayıcıda — tıpkı specter.js widget'ındaki gibi — yakalanır ve GERÇEK
 * `scoreBehavior()` motoruyla anlık skorlanır.
 *
 * Neden bu dosya var: /panel/biyometri sayfası hazır arketip imzalarını motordan
 * geçirip GALERİ gösterir. Bu stüdyo ise yöneticinin CANLI davranışını yakalayıp
 * "motor gerçekten senin insan imzanı görüyor mu?" sorusunu ispatlar. İkisi
 * birbirini tamamlar.
 *
 * Yakalama mantığı specter.js'teki `BehaviorTracker` ile BİREBİR aynıdır
 * (mousemove → mouseSamples/path/speed/accel/corners, keydown → keyIntervals +
 * mouseBeforeKey, keyup → dwell, touchstart → hadTouch, paste → pasted,
 * scroll → scrollEvents, focus → focusEvents, visibilitychange → visibilityChanges,
 * navigator.webdriver → webdriver, hadTouch&&hadMouse → interactionMix). Böylece
 * yakalanan sinyaller widget'ın ürettiğiyle AYNI biçimde hesaplanır.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MousePointerClick,
  Play,
  RotateCcw,
  Bot,
  User,
  Activity,
  Keyboard,
  Timer,
  Fingerprint,
  Info,
  Gauge,
  Waypoints,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu, DurumRozeti, Ilerleme, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { Histogram, RadarGrafik } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import {
  scoreBehavior,
  emptySignals,
  type BehaviorSignals,
  type BehaviorFactor,
} from "@/lib/specter/behavior";
import { ARKETIPLER, arketipSkoru, type Arketip } from "@/lib/specter/biyometri-profil";
import type { Dil } from "@/lib/i18n/panel";
import { davranisYakalamaCeviri, faktorEtiketCeviri } from "./davranis-yakalama.i18n";

/* ------------------------------------------------------------------ tipler */

/** Fare izi görselleştirmesi için ham nokta (yakalama alanına göreli). */
interface IzNoktasi {
  x: number;
  y: number;
}

/** Dil kodu → Intl yerel etiketi (sayı biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Kategori → ETİKET ANAHTARI + ikon (enum→anahtar; değer çevrilmez, görüntü çevrilir). */
const KATEGORI_META: Record<
  BehaviorFactor["category"],
  { anahtar: string; ikon: React.ReactNode }
> = {
  hareket: { anahtar: "dy.kat.hareket", ikon: <Activity className="size-3.5" /> },
  ritim: { anahtar: "dy.kat.ritim", ikon: <Keyboard className="size-3.5" /> },
  zamanlama: { anahtar: "dy.kat.zamanlama", ikon: <Timer className="size-3.5" /> },
  cihaz: { anahtar: "dy.kat.cihaz", ikon: <Gauge className="size-3.5" /> },
  butunluk: { anahtar: "dy.kat.butunluk", ikon: <Fingerprint className="size-3.5" /> },
};

/* ------------------------------------------------------------------ yakalayıcı
 * specter.js BehaviorTracker'ın React'e taşınmış birebir kopyası. Tüm birikim
 * mutable ref içinde tutulur (her mousemove'da re-render tetiklemeyiz — bu, gerçek
 * widget davranışıdır ve performanslıdır). React state yalnızca throttle'lı
 * anlık-görüntü (snapshot) için güncellenir. */
class DavranisYakalayici {
  startedAt = 0;
  firstInteraction = 0;
  mouseSamples = 0;
  pathLen = 0;
  speeds: number[] = [];
  accels: number[] = [];
  lastPt: [number, number] | null = null;
  lastMoveT = 0;
  lastSpeed = 0;
  lastVec: [number, number] | null = null;
  corners = 0;
  keyTimes: number[] = [];
  keyDown: Record<string, number> = {};
  dwell: number[] = [];
  hadTouch = false;
  hadMouse = false;
  focusEvents = 0;
  scrollEvents = 0;
  visibilityChanges = 0;
  pasted = false;
  mouseBeforeKey: boolean | null = null;
  /** Fare izi (yalnızca görselleştirme için — motora GİRMEZ). */
  iz: IzNoktasi[] = [];

  sifirla() {
    this.startedAt = Date.now();
    this.firstInteraction = 0;
    this.mouseSamples = 0;
    this.pathLen = 0;
    this.speeds = [];
    this.accels = [];
    this.lastPt = null;
    this.lastMoveT = 0;
    this.lastSpeed = 0;
    this.lastVec = null;
    this.corners = 0;
    this.keyTimes = [];
    this.keyDown = {};
    this.dwell = [];
    this.hadTouch = false;
    this.hadMouse = false;
    this.focusEvents = 0;
    this.scrollEvents = 0;
    this.visibilityChanges = 0;
    this.pasted = false;
    this.mouseBeforeKey = null;
    this.iz = [];
  }

  /** İlk etkileşim damgası (specter.js'teki mark()). */
  private isaretle() {
    if (!this.firstInteraction) this.firstInteraction = Date.now() - this.startedAt;
  }

  /** Fare hareketi — specter.js mousemove handler'ının birebir mantığı.
   *  ex/ey: ekran (clientX/Y) — path/hız/köşe için; rx/ry: alana göreli — çizim için. */
  fare(ex: number, ey: number, rx: number, ry: number) {
    this.isaretle();
    this.mouseSamples++;
    this.hadMouse = true;
    const now = Date.now();
    if (this.lastPt) {
      const dx = ex - this.lastPt[0];
      const dy = ey - this.lastPt[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.pathLen += dist;
      const dt = now - this.lastMoveT;
      if (dt > 0) {
        const sp = dist / dt;
        this.speeds.push(sp);
        this.accels.push(sp - this.lastSpeed); // ivme = hız değişimi
        this.lastSpeed = sp;
      }
      // köşe/yön değişimi (insan yolu çok mikro-düzeltme içerir)
      if (this.lastVec && dist > 1) {
        const d1 = this.lastVec;
        const mag1 = Math.sqrt(d1[0] * d1[0] + d1[1] * d1[1]);
        const mag2 = dist;
        if (mag1 > 0 && mag2 > 0) {
          const cos = (d1[0] * dx + d1[1] * dy) / (mag1 * mag2);
          if (cos < 0.5) this.corners++; // ~60°'den keskin dönüş
        }
      }
      if (dist > 1) this.lastVec = [dx, dy];
    }
    this.lastPt = [ex, ey];
    this.lastMoveT = now;
    // izi biriktir (görselleştirme; en fazla son 600 nokta tutulur)
    this.iz.push({ x: rx, y: ry });
    if (this.iz.length > 600) this.iz.shift();
  }

  /** Tuş basımı — specter.js keydown handler. */
  tusBasti(key: string | undefined) {
    this.isaretle();
    this.keyTimes.push(Date.now());
    if (this.mouseBeforeKey === null) this.mouseBeforeKey = this.hadMouse;
    if (key != null) this.keyDown[key] = Date.now();
  }

  /** Tuş bırakma — specter.js keyup handler (dwell = basılı-kalma süresi). */
  tusBirakti(key: string | undefined) {
    if (key != null && this.keyDown[key]) {
      this.dwell.push(Date.now() - this.keyDown[key]);
      delete this.keyDown[key];
    }
  }

  dokunma() {
    this.isaretle();
    this.hadTouch = true;
  }
  yapistirdi() {
    this.pasted = true;
  }
  kaydirdi() {
    this.scrollEvents++;
  }
  odaklandi() {
    this.focusEvents++;
  }
  gorunurluk() {
    this.visibilityChanges++;
  }

  /** specter.js snapshot() birebir — motorun okuduğu tüm alanlar. */
  anlikGoruntu(): BehaviorSignals {
    const intervals: number[] = [];
    for (let i = 1; i < this.keyTimes.length; i++) {
      intervals.push(this.keyTimes[i] - this.keyTimes[i - 1]);
    }
    const mean = this.speeds.length
      ? this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length
      : 0;
    const variance = this.speeds.length
      ? this.speeds.reduce((a, b) => a + (b - mean) * (b - mean), 0) / this.speeds.length
      : 0;
    const aMean = this.accels.length
      ? this.accels.reduce((a, b) => a + b, 0) / this.accels.length
      : 0;
    const aVar = this.accels.length
      ? this.accels.reduce((a, b) => a + (b - aMean) * (b - aMean), 0) / this.accels.length
      : 0;
    let wd = false;
    try {
      wd = !!navigator.webdriver;
    } catch {
      wd = false;
    }
    return {
      mouseSamples: this.mouseSamples,
      mousePathLength: this.pathLen,
      mouseSpeedVariance: variance,
      keyIntervals: intervals,
      timeToFirstInteraction: this.firstInteraction,
      timeToSubmit: this.startedAt ? Date.now() - this.startedAt : 0,
      hadTouch: this.hadTouch,
      focusEvents: this.focusEvents,
      pasted: this.pasted,
      // derin biyometri
      mouseCorners: this.corners,
      mouseAccelVariance: aVar,
      keyDwellTimes: this.dwell,
      scrollEvents: this.scrollEvents,
      visibilityChanges: this.visibilityChanges,
      webdriver: wd,
      mouseBeforeKey: this.mouseBeforeKey ?? undefined,
      interactionMix: this.hadTouch && this.hadMouse,
    };
  }
}

/* ------------------------------------------------------------------ yardımcı: histogram */

/** Tuş aralıklarını basit kovalara bölerek küçük bir histogram üretir. */
function histogram(degerler: number[], kova = 6): { etiket: string; sayi: number }[] {
  if (degerler.length === 0) return [];
  const min = Math.min(...degerler);
  const max = Math.max(...degerler);
  const genislik = Math.max(1, (max - min) / kova);
  const kovalar = Array.from({ length: kova }, (_, i) => ({
    alt: Math.round(min + i * genislik),
    ust: Math.round(min + (i + 1) * genislik),
    sayi: 0,
  }));
  for (const d of degerler) {
    let idx = Math.floor((d - min) / genislik);
    if (idx >= kova) idx = kova - 1;
    if (idx < 0) idx = 0;
    kovalar[idx].sayi++;
  }
  return kovalar.map((k) => ({ etiket: `${k.alt}–${k.ust}`, sayi: k.sayi }));
}

/* ------------------------------------------------------------------ ana bileşen */

export function DavranisYakalamaIstemci({ dil }: { dil: Dil }) {
  const t = (anahtar: string) => davranisYakalamaCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const { goster } = useToast();
  const yakalayiciRef = useRef(new DavranisYakalayici());
  const alanRef = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(false);
  const [sinyal, setSinyal] = useState<BehaviorSignals>(emptySignals());
  const [azMotion, setAzMotion] = useState(false);

  // prefers-reduced-motion — SSR-güvenli (yalnızca effect içinde okunur).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uygula = () => setAzMotion(mq.matches);
    uygula();
    mq.addEventListener?.("change", uygula);
    return () => mq.removeEventListener?.("change", uygula);
  }, []);

  // Anlık-görüntüyü throttle'lı yenile: yakalama aktifken ~8 fps ile snapshot al
  // → motor CANLI çalışır ama her mousemove'da re-render yapmayız (performans).
  useEffect(() => {
    if (!aktif) return;
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      setSinyal(yakalayiciRef.current.anlikGoruntu());
    }, 120);
    return () => window.clearInterval(id);
  }, [aktif]);

  // Global dinleyiciler (scroll/focus/visibility/paste) — yalnızca aktifken bağlı.
  useEffect(() => {
    if (!aktif) return;
    if (typeof window === "undefined") return;
    const y = yakalayiciRef.current;
    const onScroll = () => y.kaydirdi();
    const onFocus = () => y.odaklandi();
    const onVis = () => y.gorunurluk();
    const onPaste = () => y.yapistirdi();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("paste", onPaste);
    };
  }, [aktif]);

  const baslat = useCallback(() => {
    yakalayiciRef.current.sifirla();
    setAktif(true);
    setSinyal(yakalayiciRef.current.anlikGoruntu());
    goster({ tip: "bilgi", baslik: t("dy.toast.baslik"), aciklama: t("dy.toast.aciklama") });
  }, [goster]);

  const sifirla = useCallback(() => {
    yakalayiciRef.current.sifirla();
    setAktif(false);
    setSinyal(emptySignals());
  }, []);

  // Yakalama alanı olayları (fare/dokunma/tuş) — yalnızca aktifken kaydeder.
  const alanFare = useCallback(
    (e: React.MouseEvent) => {
      if (!aktif) return;
      const kutu = alanRef.current?.getBoundingClientRect();
      const rx = kutu ? e.clientX - kutu.left : 0;
      const ry = kutu ? e.clientY - kutu.top : 0;
      yakalayiciRef.current.fare(e.clientX, e.clientY, rx, ry);
    },
    [aktif],
  );
  const alanTus = useCallback(
    (e: React.KeyboardEvent) => {
      if (!aktif) return;
      yakalayiciRef.current.tusBasti(e.key);
    },
    [aktif],
  );
  const alanTusBirak = useCallback(
    (e: React.KeyboardEvent) => {
      if (!aktif) return;
      yakalayiciRef.current.tusBirakti(e.key);
    },
    [aktif],
  );
  const alanDokunma = useCallback(() => {
    if (!aktif) return;
    yakalayiciRef.current.dokunma();
  }, [aktif]);

  // CANLI skor — gerçek motor. Her snapshot değişiminde yeniden hesaplanır.
  const skor = useMemo(() => scoreBehavior(sinyal), [sinyal]);
  const yuzde = Math.round(skor.score * 100);
  const insanMi = skor.humanLikely;

  // Arketip skorları (gerçek motordan; determinist → bir kez hesapla).
  const arketipSonuclari = useMemo(
    () => ARKETIPLER.map((a) => ({ arketip: a, sonuc: arketipSkoru(a) })),
    [],
  );

  // Canlı imzaya "en yakın" arketip: skor farkı en küçük olan (kaba mesafe).
  const enYakinArketip = useMemo(() => {
    if (!aktif || sinyal.mouseSamples === 0) return null;
    let en: { arketip: Arketip; fark: number } | null = null;
    for (const { arketip, sonuc } of arketipSonuclari) {
      const fark = Math.abs(sonuc.score - skor.score);
      if (!en || fark < en.fark) en = { arketip, fark };
    }
    return en;
  }, [aktif, sinyal.mouseSamples, arketipSonuclari, skor.score]);

  // Anlamlı karşılaştırma için 3 temsili arketip (1 insan + 2 bot).
  const kiyasArketipleri = useMemo(
    () => arketipSonuclari.filter((x) => ["dogal-insan", "otomasyon-scripti", "insan-taklidi-bot"].includes(x.arketip.kimlik)),
    [arketipSonuclari],
  );

  const intervalHist = useMemo(() => histogram(sinyal.keyIntervals), [sinyal.keyIntervals]);

  // Kategori-bazlı sinyal ayırt-edicilik radarı: her faktör kategorisinin toplam
  // katkı büyüklüğü (|delta|) → 0-100 ölçekli eksen. Motor verisi DEĞİŞMEZ.
  const radarEksenleri = useMemo(() => {
    const KATLAR: BehaviorFactor["category"][] = ["hareket", "ritim", "zamanlama", "cihaz", "butunluk"];
    const toplam: Record<string, number> = { hareket: 0, ritim: 0, zamanlama: 0, cihaz: 0, butunluk: 0 };
    for (const f of skor.factors) toplam[f.category] += Math.abs(f.delta);
    const enBuyuk = Math.max(0.001, ...Object.values(toplam));
    return KATLAR.map((k) => ({
      etiket: t(KATEGORI_META[k].anahtar),
      deger: Math.round((toplam[k] / enBuyuk) * 100),
    }));
  }, [skor.factors, dil]);

  // Arketip skor karşılaştırma histogramı: canlı imza + tüm arketipler (0-100).
  const arketipHist = useMemo(
    () => [
      ...(aktif && sinyal.mouseSamples > 0
        ? [{ etiket: t("dy.ark.senCanli"), deger: yuzde, ton: (insanMi ? "insan" : "bot") as "insan" | "bot" }]
        : []),
      ...arketipSonuclari.map(({ arketip, sonuc }) => ({
        etiket: arketip.ad,
        deger: Math.round(sonuc.score * 100),
        ton: (sonuc.humanLikely ? "insan" : "bot") as "insan" | "bot",
      })),
    ],
    [aktif, sinyal.mouseSamples, arketipSonuclari, yuzde, insanMi, dil],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <MousePointerClick className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("dy.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("dy.serit.a1")} <span className="font-medium text-slate-ink">{t("dy.serit.a2")}</span> {t("dy.serit.a3")}{" "}
            <code className="rounded bg-white px-1 py-0.5 text-[12px] text-brand-700">scoreBehavior()</code> {t("dy.serit.a4")}
          </p>
        </div>
      </div>

      {/* kontrol + özet */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DurumRozeti
            ton={aktif ? "brand" : "gri"}
            etiket={aktif ? t("dy.durum.etkin") : t("dy.durum.beklemede")}
            nabiz={aktif && !azMotion}
          />
          {aktif && (
            <Badge ton={insanMi ? "yesil" : "kirmizi"}>
              {insanMi ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              {insanMi ? t("dy.karar.insanOlasi") : t("dy.karar.botOlasi")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!aktif ? (
            <Button onClick={baslat} variant="accent" size="sm">
              <Play className="size-4" /> {t("dy.dugme.baslat")}
            </Button>
          ) : (
            <Button onClick={sifirla} variant="outline" size="sm">
              <RotateCcw className="size-4" /> {t("dy.dugme.sifirla")}
            </Button>
          )}
        </div>
      </div>

      {/* canlı skor kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={aktif ? `%${yuzde}` : "—"}
          etiket={t("dy.kart.skor")}
          ikon={<Activity className="size-5" />}
          tone={!aktif ? undefined : insanMi ? "ok" : "danger"}
        />
        <StatKart sayi={aktif ? `%${skor.confidence}` : "—"} etiket={t("dy.kart.guven")} ikon={<Gauge className="size-5" />} />
        <StatKart sayi={sinyal.mouseSamples.toLocaleString(yerel)} etiket={t("dy.kart.fareOrnegi")} ikon={<MousePointerClick className="size-5" />} />
        <StatKart sayi={sinyal.keyIntervals.length + 1 > 1 ? sinyal.keyIntervals.length + 1 : 0} etiket={t("dy.kart.tusVurusu")} ikon={<Keyboard className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------------------------------------------- canlı yakalama alanı */}
        <Panel baslik={t("dy.alan.baslik")} className="lg:col-span-2">
          <p className="mb-3 text-[13px] text-slate-muted">{t("dy.alan.aciklama")}</p>
          <div
            ref={alanRef}
            onMouseMove={alanFare}
            onTouchStart={alanDokunma}
            className={cn(
              "relative h-64 w-full overflow-hidden rounded-2xl border border-line-strong bg-canvas/50",
              aktif ? "cursor-crosshair" : "cursor-not-allowed opacity-70",
            )}
          >
            {/* canlı fare izi */}
            <FareIzi noktalar={sinyal.mouseSamples > 0 ? yakalayiciRef.current.iz : []} azMotion={azMotion} />
            {!aktif && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-slate-muted shadow-sm">
                  {t("dy.alan.ipucu")}
                </span>
              </div>
            )}
            {/* metin girişi */}
            <div className="absolute inset-x-4 bottom-4">
              <input
                type="text"
                disabled={!aktif}
                onKeyDown={alanTus}
                onKeyUp={alanTusBirak}
                placeholder={aktif ? t("dy.alan.girisAktif") : t("dy.alan.girisPasif")}
                aria-label={t("dy.alan.girisAria")}
                spellCheck={false}
                autoComplete="off"
                className="h-11 w-full rounded-2xl border border-line-strong bg-surface/95 px-4 text-sm text-slate-ink outline-none backdrop-blur transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint disabled:opacity-60"
              />
            </div>
          </div>
          {sinyal.pasted && (
            <NotKutusu ton="kirmizi" baslik={t("dy.yapistir.baslik")}>
              {t("dy.yapistir.metin")}
            </NotKutusu>
          )}
        </Panel>

        {/* ---------------------------------------------------- canlı skor dökümü */}
        <Panel baslik={t("dy.dokum.baslik")}>
          {!aktif ? (
            <p className="py-8 text-center text-sm text-slate-faint">{t("dy.dokum.bos")}</p>
          ) : (
            <div className="space-y-4">
              {/* skor barı */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-ink">{t("dy.dokum.skorEtiket")}</span>
                  <span className={cn("num font-semibold", insanMi ? "text-ok" : "text-danger2")}>%{yuzde}</span>
                </div>
                <Ilerleme deger={yuzde} ton={insanMi ? "ok" : "danger"} />
                <p className="mt-1.5 text-[12px] text-slate-muted">{t("dy.dokum.esikNot")}</p>
              </div>

              {/* kategori ayırt-edicilik radarı (faktör katkı büyüklüğü) */}
              {skor.factors.length >= 3 && (
                <div className="rounded-2xl border border-line bg-canvas/40 p-3">
                  <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
                    {t("dy.dokum.faktorBaslik")}
                  </div>
                  <div className="grid place-items-center">
                    <RadarGrafik eksenler={radarEksenleri} boyut={188} renk={insanMi ? "#16a34a" : "#dc2626"} />
                  </div>
                </div>
              )}

              {/* faktör listesi (her ScoreBreakdown.factor) */}
              <div className="space-y-1.5">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("dy.dokum.faktorBaslik")}</div>
                {skor.factors.length === 0 ? (
                  <p className="text-[13px] text-slate-faint">{t("dy.dokum.faktorBos")}</p>
                ) : (
                  skor.factors.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/40 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-lg", f.delta >= 0 ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2")}>
                          {KATEGORI_META[f.category].ikon}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-slate-ink">{faktorEtiketCeviri(f.label, dil)}</span>
                          <span className="block text-[11px] text-slate-faint">{t(KATEGORI_META[f.category].anahtar)}</span>
                        </span>
                      </span>
                      <span className={cn("num shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold", f.delta >= 0 ? "bg-ok-soft text-green-700" : "bg-danger-soft text-red-700")}>
                        {f.delta >= 0 ? "+" : ""}
                        {f.delta.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* ---------------------------------------------------- ham sinyal paneli */}
        <Panel baslik={t("dy.ham.baslik")}>
          {!aktif ? (
            <p className="py-8 text-center text-sm text-slate-faint">{t("dy.ham.bos")}</p>
          ) : (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <HamDeger etiket="mouseSamples" deger={sinyal.mouseSamples} />
                <HamDeger etiket="mousePathLength" deger={`${Math.round(sinyal.mousePathLength)} px`} />
                <HamDeger etiket="mouseSpeedVariance" deger={sinyal.mouseSpeedVariance.toFixed(3)} />
                <HamDeger etiket="mouseCorners" deger={sinyal.mouseCorners ?? 0} />
                <HamDeger etiket="mouseAccelVariance" deger={(sinyal.mouseAccelVariance ?? 0).toFixed(4)} />
                <HamDeger etiket="timeToFirstInteraction" deger={`${sinyal.timeToFirstInteraction} ms`} />
                <HamDeger etiket="timeToSubmit" deger={`${sinyal.timeToSubmit} ms`} />
                <HamDeger etiket="focusEvents" deger={sinyal.focusEvents} />
                <HamDeger etiket="scrollEvents" deger={sinyal.scrollEvents ?? 0} />
                <HamDeger etiket="visibilityChanges" deger={sinyal.visibilityChanges ?? 0} />
                <HamDeger etiket="hadTouch" deger={sinyal.hadTouch ? t("dy.ham.evet") : t("dy.ham.hayir")} />
                <HamDeger etiket="pasted" deger={sinyal.pasted ? t("dy.ham.evet") : t("dy.ham.hayir")} />
                <HamDeger etiket="mouseBeforeKey" deger={sinyal.mouseBeforeKey === undefined ? "—" : sinyal.mouseBeforeKey ? t("dy.ham.evet") : t("dy.ham.hayir")} />
                <HamDeger etiket="webdriver" deger={sinyal.webdriver ? "TRUE ⚠" : "false"} />
              </dl>

              {/* tuş aralığı histogramı */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
                  <Keyboard className="size-3.5" /> {t("dy.ham.histBaslik")}
                </div>
                {intervalHist.length === 0 ? (
                  <p className="text-[13px] text-slate-faint">{t("dy.ham.histBos")}</p>
                ) : (
                  <Histogram
                    yukseklik={80}
                    renk="#2f6fed"
                    kovalar={intervalHist.map((k) => ({ etiket: k.etiket, deger: k.sayi }))}
                  />
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* ---------------------------------------------------- arketip karşılaştırma */}
        <Panel baslik={t("dy.ark.baslik")} className="lg:col-span-2">
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("dy.ark.aciklama.a1")} <code className="rounded bg-canvas px-1 text-[12px]">scoreBehavior()</code> {t("dy.ark.aciklama.a2")}
          </p>

          {/* arketip skor karşılaştırma histogramı (0-100, insan/bot renkli) */}
          <div className="mb-4 rounded-2xl border border-line bg-canvas/40 p-4">
            <Histogram yukseklik={110} kovalar={arketipHist} />
          </div>

          {aktif && enYakinArketip && (
            <NotKutusu ton={enYakinArketip.arketip.beklenen === "insan" ? "yesil" : "sari"} baslik={t("dy.ark.enYakinBaslik")}>
              {t("dy.ark.enYakin")
                .replace("{ad}", enYakinArketip.arketip.ad)
                .replace("{karar}", enYakinArketip.arketip.beklenen === "insan" ? t("dy.karar.insan") : t("dy.karar.bot"))
                .replace("{aciklama}", enYakinArketip.arketip.aciklama)}
            </NotKutusu>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* canlı imza kartı */}
            <div className={cn("rounded-2xl border-2 p-4", insanMi && aktif ? "border-ok/40 bg-ok-soft/30" : aktif ? "border-danger2/40 bg-danger-soft/30" : "border-line bg-canvas/30")}>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
                  <MousePointerClick className="size-4 text-brand-600" /> {t("dy.ark.senCanli")}
                </span>
                {aktif && <Badge ton={insanMi ? "yesil" : "kirmizi"}>{insanMi ? t("dy.karar.insan") : t("dy.karar.bot")}</Badge>}
              </div>
              <div className={cn("num text-3xl font-bold", aktif ? (insanMi ? "text-ok" : "text-danger2") : "text-slate-faint")}>
                {aktif ? `%${yuzde}` : "—"}
              </div>
              <ul className="mt-3 space-y-1 text-[11px] text-slate-muted">
                <li>{t("dy.ark.varyans")} <span className="num text-slate-ink">{sinyal.mouseSpeedVariance.toFixed(3)}</span></li>
                <li>{t("dy.ark.kose")} <span className="num text-slate-ink">{sinyal.mouseCorners ?? 0}</span></li>
                <li>{t("dy.ark.tusVurusu")} <span className="num text-slate-ink">{sinyal.keyIntervals.length + (sinyal.keyIntervals.length > 0 ? 1 : 0)}</span></li>
              </ul>
            </div>

            {/* 3 arketip kartı */}
            {kiyasArketipleri.map(({ arketip, sonuc }) => (
              <div key={arketip.kimlik} className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
                    {arketip.beklenen === "insan" ? <User className="size-4 text-ok" /> : <Bot className="size-4 text-danger2" />}
                    {arketip.ad}
                  </span>
                  <Badge ton={sonuc.humanLikely ? "yesil" : "kirmizi"}>{sonuc.humanLikely ? t("dy.karar.insan") : t("dy.karar.bot")}</Badge>
                </div>
                <div className={cn("num text-3xl font-bold", sonuc.humanLikely ? "text-ok" : "text-danger2")}>%{Math.round(sonuc.score * 100)}</div>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-muted">
                  <li>{t("dy.ark.varyans")} <span className="num text-slate-ink">{arketip.sinyal.mouseSpeedVariance.toFixed(3)}</span></li>
                  <li>{t("dy.ark.kose")} <span className="num text-slate-ink">{arketip.sinyal.mouseCorners ?? "—"}</span></li>
                  <li>{t("dy.ark.tusVurusu")} <span className="num text-slate-ink">{arketip.sinyal.keyIntervals.length}</span></li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-1">
                  {arketip.etiketler.map((e) => (
                    <span key={e} className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] text-slate-muted">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ---------------------------------------------------- açıklama */}
      <Panel baslik={t("dy.acik.baslik")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AciklamaKart
            ikon={<Waypoints className="size-4" />}
            baslik={t("dy.acik.fare.baslik")}
            metin={t("dy.acik.fare.metin")}
          />
          <AciklamaKart
            ikon={<Keyboard className="size-4" />}
            baslik={t("dy.acik.tus.baslik")}
            metin={t("dy.acik.tus.metin")}
          />
          <AciklamaKart
            ikon={<Timer className="size-4" />}
            baslik={t("dy.acik.zaman.baslik")}
            metin={t("dy.acik.zaman.metin")}
          />
          <AciklamaKart
            ikon={<Fingerprint className="size-4" />}
            baslik={t("dy.acik.butun.baslik")}
            metin={t("dy.acik.butun.metin")}
          />
          <AciklamaKart
            ikon={<MousePointerClick className="size-4" />}
            baslik={t("dy.acik.sira.baslik")}
            metin={t("dy.acik.sira.metin")}
          />
          <AciklamaKart
            ikon={<Info className="size-4" />}
            baslik={t("dy.acik.neden.baslik")}
            metin={t("dy.acik.neden.metin")}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ alt bileşenler */

/** Tek ham telemetri satırı (etiket + monospace değer). */
function HamDeger({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate font-mono text-[11px] text-slate-faint">{etiket}</dt>
      <dd className="num truncate text-[15px] font-semibold text-slate-ink">{deger}</dd>
    </div>
  );
}

/** Açıklama kartı (sinyal → bot ele verme). */
function AciklamaKart({ ikon, baslik, metin }: { ikon: React.ReactNode; baslik: string; metin: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/30 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">{ikon}</span>
        <span className="text-[13px] font-semibold text-slate-ink">{baslik}</span>
      </div>
      <p className="text-[12.5px] leading-relaxed text-slate-muted">{metin}</p>
    </div>
  );
}

/**
 * Fare izi görselleştirmesi — yakalanan gerçek yörünge (yalnızca çizim; motora
 * girmez). İnsan yolu organik eğri; bot yolu düz. SVG polyline + son nokta glow.
 */
function FareIzi({ noktalar, azMotion }: { noktalar: IzNoktasi[]; azMotion: boolean }) {
  if (noktalar.length < 2) return null;
  const d = noktalar.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const son = noktalar[noktalar.length - 1];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="izGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#4a41e8" />
        </linearGradient>
      </defs>
      <polyline
        points={d}
        fill="none"
        stroke="url(#izGrad)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* son konum — canlı imleç */}
      <circle cx={son.x} cy={son.y} r={5} fill="#4a41e8">
        {!azMotion && <animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite" />}
      </circle>
    </svg>
  );
}
