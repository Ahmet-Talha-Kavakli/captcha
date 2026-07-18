"use client";

import { useState, useMemo } from "react";
import { Fingerprint, MousePointer, Keyboard, Clock, ShieldCheck, Bot, Sparkles, SlidersHorizontal, RotateCcw, Gauge as GaugeGost, Users, ScanFace, Radar } from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme } from "@/components/panel/kit";
import { Histogram, RadarGrafik, Gauge } from "@/components/panel/grafikler-ek";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import { scoreBehavior, emptySignals, type BehaviorSignals, type BehaviorFactor } from "@/lib/specter/behavior";
import { botSiniflandir } from "@/lib/specter/classifier";
import { ARKETIPLER, tumArketipSkorlari, AYARLANABILIR_ALANLAR, type Arketip } from "@/lib/specter/biyometri-profil";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { biyometriCeviri } from "./biyometri.i18n";

/** Dil → BCP-47 yerel etiketi (Intl sayı biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ENUM GÜVENLİĞİ: sınıf/kategori enum'ları çevrilmez; etiketleri "sinif.<enum>" /
 * "kategori.<enum>" key-map'lerinden t() ile türetilir. Renk enum'a bağlı veridir. */
interface Ozet { insan: number; supheli: number; bot: number; toplam: number; ortSkor: number }

const KATEGORI_RENK: Record<string, string> = {
  hareket: "#2f6fed", ritim: "#7c3aed", zamanlama: "#d97706", cihaz: "#16a34a", butunluk: "#dc2626",
};

/** Radar/özet için sabit kategori sırası (enum — çeviri "kategori.<k>"). */
const KATEGORI_SIRA: BehaviorFactor["category"][] = ["hareket", "ritim", "zamanlama", "cihaz", "butunluk"];

// Hazır senaryolar — gerçek scoreBehavior + ML sınıflandırıcı ile canlı çalışır.
// `id` stabil çeviri anahtarıdır (ad/aciklama t("senaryo.<id>.*") ile türetilir).
const SENARYOLAR: { id: string; ua: string; ip: number; path?: string; rate?: number; sinyal: Partial<BehaviorSignals> }[] = [
  {
    id: "insan",
    ua: "Mozilla/5.0 (Macintosh) Chrome/124", ip: 0.9,
    sinyal: { mouseSamples: 62, mousePathLength: 420, mouseSpeedVariance: 0.32, keyIntervals: [140, 190, 110, 170, 130], keyDwellTimes: [85, 120, 95, 110], timeToFirstInteraction: 720, timeToSubmit: 3600, mouseCorners: 7, mouseAccelVariance: 0.05, scrollEvents: 2, mouseBeforeKey: true, focusEvents: 1 },
  },
  {
    id: "headless",
    ua: "Mozilla/5.0 HeadlessChrome/124", ip: 0.4, path: "/api/products",
    sinyal: { mouseSamples: 0, keyIntervals: [12, 11, 13, 10], timeToFirstInteraction: 18, timeToSubmit: 190, webdriver: true, mouseBeforeKey: false },
  },
  {
    id: "script",
    ua: "python-requests/2.31", ip: 0.3, path: "/login",
    sinyal: { mouseSamples: 0, keyIntervals: [], timeToSubmit: 60, timeToFirstInteraction: 0 },
  },
  {
    id: "ddos",
    ua: "Go-http-client/2.0", ip: 0.1, rate: 220,
    sinyal: { mouseSamples: 0, keyIntervals: [], timeToSubmit: 40, timeToFirstInteraction: 0 },
  },
  {
    id: "mobil",
    ua: "Mozilla/5.0 (iPhone) Safari/17", ip: 0.85,
    sinyal: { hadTouch: true, deviceMotion: true, keyIntervals: [160, 210, 140, 180], keyDwellTimes: [90, 130, 100], timeToSubmit: 4200, focusEvents: 1, scrollEvents: 3 },
  },
];

/** Her BehaviorFactor için eğitici referans — metin t("ref.<key>.*") ile türetilir. */
const FAKTOR_REFERANS: { key: string; kategori: BehaviorFactor["category"] }[] = [
  { key: "mouse", kategori: "hareket" },
  { key: "mouseCorners", kategori: "hareket" },
  { key: "accel", kategori: "hareket" },
  { key: "keyRhythm", kategori: "ritim" },
  { key: "keySpeed", kategori: "ritim" },
  { key: "dwell", kategori: "ritim" },
  { key: "submit", kategori: "zamanlama" },
  { key: "firstInt", kategori: "zamanlama" },
  { key: "order", kategori: "zamanlama" },
  { key: "paste", kategori: "butunluk" },
  { key: "focus", kategori: "cihaz" },
  { key: "motion", kategori: "cihaz" },
  { key: "webdriver", kategori: "butunluk" },
  { key: "tz", kategori: "butunluk" },
  { key: "mix", kategori: "cihaz" },
];

export function BiyometriIstemci({ dil, ozet, kovalar, faktorler }: { dil: Dil; ozet: Ozet; kovalar: number[]; faktorler: { ad: string; sayi: number }[] }) {
  const t = (k: string) => biyometriCeviri(k, dil);
  const yerel = YEREL[dil];
  const [senaryo, setSenaryo] = useState(0);

  const sonuc = useMemo(() => {
    const s: BehaviorSignals = { ...emptySignals(), ...SENARYOLAR[senaryo].sinyal };
    return scoreBehavior(s);
  }, [senaryo]);

  // ML ensemble sınıflandırıcı — aynı senaryoyu çok-sinyalli sınıflandır.
  const ml = useMemo(() => {
    const sn = SENARYOLAR[senaryo];
    return botSiniflandir({
      ua: sn.ua, behaviorScore: sonuc.score, ipReputation: sn.ip,
      headless: !!sn.sinyal.webdriver, path: sn.path, rate: sn.rate,
    });
  }, [senaryo, sonuc.score]);

  const insanOran = Math.round((ozet.insan / (ozet.toplam || 1)) * 100);

  // Galeri — tüm arketipleri gerçek motordan geçir.
  const galeri = useMemo(() => tumArketipSkorlari(), []);

  // Skor histogramı → Histogram bileşeni kovaları (bimodal insan/bot tonlaması).
  const histKovalar = useMemo(
    () =>
      kovalar.map((v, i) => ({
        etiket: (i / 10).toFixed(1),
        deger: v,
        ton: (i >= 6 ? "insan" : i < 4 ? "bot" : "nötr") as "insan" | "bot" | "nötr",
      })),
    [kovalar],
  );

  // Seçili senaryonun faktörlerini kategoriye topla → RADAR (0..100 ayırt edicilik).
  // Her kategorinin |delta| büyüklüğü o senaryoda ne kadar belirleyici olduğunu verir.
  const senaryoRadar = useMemo(() => {
    const topla: Record<string, number> = {};
    for (const f of sonuc.factors) topla[f.category] = (topla[f.category] ?? 0) + Math.abs(f.delta);
    const enBuyuk = Math.max(0.01, ...Object.values(topla));
    return KATEGORI_SIRA.map((k) => ({
      etiket: t(`kategori.${k}`),
      deger: Math.round(((topla[k] ?? 0) / enBuyuk) * 100),
    }));
  }, [sonuc, t]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Fingerprint className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("intro.metin")}</p>
        </div>
      </div>

      {/* özet: 3 sınıf KPI + güven gauge kartı (dağılım şeridiyle) */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_minmax(0,1.15fr)]">
        <StatKart sayi={ozet.insan.toLocaleString(yerel)} etiket={t("ozet.insan")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={ozet.supheli.toLocaleString(yerel)} etiket={t("ozet.supheli")} tone="warn" />
        <StatKart sayi={ozet.bot.toLocaleString(yerel)} etiket={t("ozet.bot")} ikon={<Bot className="size-5" />} tone="danger" />
        {/* güven kartı — insan oranını yarım-daire gauge ile göster + 3-sınıf mikro şerit */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-4">
            <Gauge deger={insanOran} etiket={t("ozet.oran")} boyut={124} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                <Users className="size-3.5 text-brand-600" /> {ozet.toplam.toLocaleString(yerel)}
              </div>
              {/* 3-sınıf oransal dağılım şeridi */}
              <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-canvas">
                {([
                  { v: ozet.insan, c: "#16a34a" },
                  { v: ozet.supheli, c: "#d97706" },
                  { v: ozet.bot, c: "#dc2626" },
                ] as const).map((s, i) => (
                  <div key={i} style={{ width: `${(s.v / (ozet.toplam || 1)) * 100}%`, background: s.c }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-slate-faint">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-ok" /> {t("dagilim.insan")}</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-warn" /> {t("dagilim.supheli")}</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-danger2" /> {t("dagilim.bot")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Canlı biyometri simülatörü */}
        <Panel baslik={t("motor.baslik")}>
          <p className="mb-4 text-sm text-slate-muted">{t("motor.aciklama")}</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {SENARYOLAR.map((sn, i) => (
              <button key={i} onClick={() => setSenaryo(i)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition", senaryo === i ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100")}>
                {t(`senaryo.${sn.id}.ad`)}
              </button>
            ))}
          </div>

          {/* skor göstergesi — gauge (0-100 insanlık) + karar rozeti + güven */}
          <div className="rounded-2xl border border-line bg-canvas/50 p-5">
            <div className="flex items-center gap-5">
              <Gauge deger={Math.round(sonuc.score * 100)} boyut={140} renk={sonuc.humanLikely ? "#16a34a" : "#dc2626"} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-slate-muted">{t(`senaryo.${SENARYOLAR[senaryo].id}.aciklama`)}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn("text-[30px] font-bold leading-none num", sonuc.humanLikely ? "text-ok" : "text-danger2")}>{sonuc.score.toFixed(2)}</span>
                  <Badge ton={sonuc.humanLikely ? "yesil" : "kirmizi"}>{sonuc.humanLikely ? t("motor.insan") : t("motor.bot")}</Badge>
                </div>
                <div className="mt-3"><Ilerleme deger={sonuc.confidence} ton={sonuc.humanLikely ? "ok" : "danger"} /></div>
                <div className="mt-1 text-[12px] text-slate-faint">{t("motor.guven").replace("{n}", String(sonuc.confidence))}</div>
              </div>
            </div>
          </div>

          {/* faktör dökümü */}
          <div className="mt-4 space-y-2">
            <div className="text-[13px] font-semibold text-slate-ink">{t("motor.faktorDokum").replace("{n}", String(sonuc.factors.length))}</div>
            {sonuc.factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
                <span className="flex items-center gap-2 text-[13px] text-slate-ink">
                  <span className="size-2 rounded-full" style={{ background: KATEGORI_RENK[f.category] }} />
                  {t(`faktor.${f.label}`)}
                </span>
                <span className={cn("num text-[13px] font-bold", f.delta > 0 ? "text-ok" : "text-danger2")}>
                  {f.delta > 0 ? "+" : ""}{f.delta.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Senaryo sinyal radarı — hangi kategori sinyalleri bu senaryoda ayırt edici */}
          <div className="mt-5 rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Radar className="size-4 text-brand-600" /> {t("motor.faktorDokum").replace("{n}", String(sonuc.factors.length)).replace(/\s*\(.*\)/, "")}</span>
            </div>
            <div className="grid place-items-center py-1">
              <RadarGrafik eksenler={senaryoRadar} boyut={210} renk={sonuc.humanLikely ? "#16a34a" : "#dc2626"} />
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10.5px] text-slate-faint">
              {KATEGORI_SIRA.map((k) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ background: KATEGORI_RENK[k] }} /> {t(`kategori.${k}`)}
                </span>
              ))}
            </div>
          </div>

          {/* ML ensemble sınıflandırıcı çıktısı — ikonlu sınıf olasılık barları */}
          <div className="mt-5 rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><ScanFace className="size-4 text-brand-600" /> {t("motor.ml")}</span>
              <Badge ton={ml.sinif === "human" ? "yesil" : "kirmizi"}>{t(`sinif.${ml.sinif}`)}</Badge>
            </div>
            {/* sınıf olasılıkları (en yüksek 4) — bot-sınıf görsel kimliğiyle */}
            <div className="space-y-2">
              {Object.entries(ml.olasiliklar).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, p]) => {
                const g = botSinifGorsel(c);
                const Ikon = g.ikon;
                const aktif = c === ml.sinif;
                return (
                  <div key={c}>
                    <div className="mb-0.5 flex items-center gap-1.5 text-[12px]">
                      <span className="grid size-4 place-items-center rounded" style={{ background: g.soft, color: g.renk }}>
                        <Ikon className="size-2.5" strokeWidth={2.4} />
                      </span>
                      <span className={cn("font-medium", aktif ? "text-slate-ink" : "text-slate-muted")}>{t(`sinif.${c}`)}</span>
                      <span className="num ml-auto text-slate-muted">%{(p * 100).toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p * 100}%`, background: aktif ? g.renk : "#c7cdd6" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 text-[11px] text-slate-faint">{t("motor.modelGuveni").replace("{n}", (ml.guven * 100).toFixed(0))} · {ml.katkilar.slice(0, 2).map((k) => t(`katki.${k.ozellik}`)).join(", ")}</div>
          </div>
        </Panel>

        <div className="space-y-6">
          {/* skor histogramı (bimodal kanıt) — Histogram bileşeni, insan/bot tonlu */}
          <Panel baslik={t("dagilim.baslik")}>
            <p className="mb-4 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("dagilim.aciklama") }} />
            <Histogram kovalar={histKovalar} yukseklik={158} />
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-muted">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger2" /> {t("dagilim.bot")}</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warn" /> {t("dagilim.supheli")}</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> {t("dagilim.insan")}</span>
            </div>
          </Panel>

          {/* bot başarısızlık faktörleri */}
          <Panel baslik={t("botfaktor.baslik")}>
            <p className="mb-3 text-[13px] text-slate-muted">{t("botfaktor.aciklama")}</p>
            <div className="space-y-2.5">
              {faktorler.slice(0, 6).map((f) => {
                const max = Math.max(...faktorler.map((x) => x.sayi), 1);
                return (
                  <div key={f.ad}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      {/* f.ad sunucudan gelen TR ID; key-map ile çevrilir */}
                      <span className="text-slate-ink">{t(`botfaktor.${f.ad}`)}</span>
                      <span className="num font-semibold text-slate-muted">{f.sayi.toLocaleString(yerel)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-danger2/80" style={{ width: `${(f.sayi / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {faktorler.length === 0 && <div className="py-6 text-center text-[13px] text-slate-faint">{t("botfaktor.bosVeri")}</div>}
            </div>
          </Panel>
        </div>
      </div>

      {/* İnteraktif imza analizörü — slider/toggle → canlı scoreBehavior() */}
      <ImzaAnalizor t={t} />

      {/* Arketip galerisi — gerçek motordan geçmiş davranış imzaları */}
      <ArketipGaleri galeri={galeri} t={t} />

      {/* Faktör referansı — motorun okuduğu her sinyalin eğitici açıklaması */}
      <Panel baslik={t("ref.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("ref.aciklama").replace("<code>", '<code class="rounded bg-canvas px-1 text-[11px]">') }} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAKTOR_REFERANS.map((f) => (
            <div key={f.key} className="rounded-2xl border border-line bg-canvas/40 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: KATEGORI_RENK[f.kategori] }} />
                <span className="text-[13px] font-semibold text-slate-ink">{t(`ref.${f.key}.baslik`)}</span>
                <span className="ml-auto rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate-faint">{t(`kategori.${f.kategori}`)}</span>
              </div>
              <p className="text-[12px] leading-relaxed text-slate-muted"><span className="font-medium text-slate-ink">{t("ref.olcer")}</span> {t(`ref.${f.key}.olcer`)}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-muted">
                <Bot className="mt-0.5 size-3.5 shrink-0 text-danger2" />
                <span><span className="font-medium text-danger2">{t("ref.botNeden")}</span> {t(`ref.${f.key}.botNeden`)}</span>
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* toplanan sinyaller açıklaması */}
      <Panel baslik={t("sinyal.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SinyalKart ikon={<MousePointer className="size-4" />} baslik={t("sinyal.fare.baslik")} ogeler={[t("sinyal.fare.1"), t("sinyal.fare.2"), t("sinyal.fare.3")]} />
          <SinyalKart ikon={<Keyboard className="size-4" />} baslik={t("sinyal.klavye.baslik")} ogeler={[t("sinyal.klavye.1"), t("sinyal.klavye.2"), t("sinyal.klavye.3")]} />
          <SinyalKart ikon={<Clock className="size-4" />} baslik={t("sinyal.zamanlama.baslik")} ogeler={[t("sinyal.zamanlama.1"), t("sinyal.zamanlama.2"), t("sinyal.zamanlama.3")]} />
          <SinyalKart ikon={<Fingerprint className="size-4" />} baslik={t("sinyal.cihaz.baslik")} ogeler={[t("sinyal.cihaz.1"), t("sinyal.cihaz.2"), t("sinyal.cihaz.3")]} />
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* İnteraktif imza analizörü — sinyalleri elle ayarla, canlı skor gör.        */
/* -------------------------------------------------------------------------- */
function ImzaAnalizor({ t }: { t: (k: string) => string }) {
  const [sinyal, setSinyal] = useState<BehaviorSignals>(() => ({ ...ARKETIPLER[0].sinyal }));
  const [aktifArketip, setAktifArketip] = useState<string | null>("dogal-insan");

  const sonuc = useMemo(() => scoreBehavior(sinyal), [sinyal]);

  const guncelle = (anahtar: keyof BehaviorSignals, deger: number | boolean) => {
    setSinyal((p) => ({ ...p, [anahtar]: deger }));
    setAktifArketip(null); // elle değişince arketip bağı kopar
  };
  const arketipYukle = (a: Arketip) => {
    setSinyal({ ...a.sinyal });
    setAktifArketip(a.kimlik);
  };

  const pozitif = sonuc.factors.filter((f) => f.delta > 0);
  const negatif = sonuc.factors.filter((f) => f.delta < 0);

  return (
    <Panel baslik={t("analiz.baslik")}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="flex-1 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("analiz.aciklama") }} />
        <button
          onClick={() => arketipYukle(ARKETIPLER[0])}
          className="flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12px] font-medium text-slate-muted transition hover:bg-slate-100"
        >
          <RotateCcw className="size-3.5" /> {t("analiz.sifirla")}
        </button>
      </div>

      {/* arketip hızlı yükleme çipleri */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {ARKETIPLER.map((a) => (
          <button
            key={a.kimlik}
            onClick={() => arketipYukle(a)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
              aktifArketip === a.kimlik ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
            )}
          >
            {a.beklenen === "insan" ? <ShieldCheck className="size-3.5" /> : <Bot className="size-3.5" />}
            {t(`arketip.${a.kimlik}.ad`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* SOL: kontroller */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
            <SlidersHorizontal className="size-4 text-brand-600" /> {t("analiz.sinyaller")}
          </div>
          <div className="space-y-3.5">
            {AYARLANABILIR_ALANLAR.map((alan) => {
              // lib'in TR etiket/ipucu'su anahtar bazlı key-map ile çevrilir
              const etiket = t(`alan.${String(alan.anahtar)}.etiket`);
              const ipucu = t(`alan.${String(alan.anahtar)}.ipucu`);
              if (alan.tip === "bool") {
                const deger = !!sinyal[alan.anahtar];
                return (
                  <div key={String(alan.anahtar)} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-slate-ink">{etiket}</div>
                      <div className="truncate text-[11px] text-slate-faint">{ipucu}</div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={deger}
                      aria-label={etiket}
                      onClick={() => guncelle(alan.anahtar, !deger)}
                      className={cn("relative h-5 w-9 shrink-0 rounded-full transition", deger ? "bg-brand-600" : "bg-slate-300")}
                    >
                      <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-all", deger ? "left-4" : "left-0.5")} />
                    </button>
                  </div>
                );
              }
              // sayı → slider
              const ham = sinyal[alan.anahtar];
              const deger = typeof ham === "number" ? ham : 0;
              return (
                <div key={String(alan.anahtar)}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-slate-ink" title={ipucu}>{etiket}</span>
                    <span className="num font-semibold text-slate-muted">{alan.adim && alan.adim < 1 ? deger.toFixed(2) : deger}</span>
                  </div>
                  <input
                    type="range"
                    min={alan.min}
                    max={alan.max}
                    step={alan.adim}
                    value={deger}
                    aria-label={etiket}
                    onChange={(e) => guncelle(alan.anahtar, Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-canvas accent-brand-600"
                  />
                  <div className="mt-0.5 text-[10.5px] text-slate-faint">{ipucu}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAĞ: canlı sonuç */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-canvas/50 p-5">
            <div className="flex items-center gap-5">
              <Gauge deger={Math.round(sonuc.score * 100)} boyut={132} renk={sonuc.humanLikely ? "#16a34a" : "#dc2626"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-muted"><GaugeGost className="size-3.5" /> {t("analiz.karar")}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("text-[34px] font-bold leading-none num", sonuc.humanLikely ? "text-ok" : "text-danger2")}>{sonuc.score.toFixed(2)}</span>
                  <Badge ton={sonuc.humanLikely ? "yesil" : "kirmizi"}>{sonuc.humanLikely ? t("motor.insan") : t("motor.bot")}</Badge>
                </div>
                <div className="mt-3"><Ilerleme deger={sonuc.confidence} ton={sonuc.humanLikely ? "ok" : "danger"} /></div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-faint">
                  <span>{t("analiz.guven").replace("{n}", String(sonuc.confidence))}</span>
                  <span>{t("analiz.esik")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* faktör dökümü: yardım eden / zarar veren */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-green-200 bg-ok-soft/40 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-green-700">
                <ShieldCheck className="size-3.5" /> {t("analiz.destekleyen").replace("{n}", String(pozitif.length))}
              </div>
              <div className="space-y-1.5">
                {pozitif.length === 0 && <div className="text-[11.5px] text-slate-faint">{t("analiz.pozitifYok")}</div>}
                {pozitif.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-ink">{t(`faktor.${f.label}`)}</span>
                    <span className="num font-bold text-ok">+{f.delta.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-danger-soft/40 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-red-700">
                <Bot className="size-3.5" /> {t("analiz.eleVeren").replace("{n}", String(negatif.length))}
              </div>
              <div className="space-y-1.5">
                {negatif.length === 0 && <div className="text-[11.5px] text-slate-faint">{t("analiz.negatifYok")}</div>}
                {negatif.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-ink">{t(`faktor.${f.label}`)}</span>
                    <span className="num font-bold text-danger2">{f.delta.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sonuc.reasons.length > 0 && (
            <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[11.5px] text-slate-muted">
              <span className="font-medium text-slate-ink">{t("analiz.gerekce")}</span> {sonuc.reasons.map((r) => t(`faktor.${r}`)).join(" · ")}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Arketip galerisi — her arketip gerçek motordan geçer, tıklanınca analizöre  */
/* değil (analizör kendi çipleriyle yükler); burada özet + mini bar gösterilir.*/
/* -------------------------------------------------------------------------- */
function ArketipGaleri({ galeri, t }: { galeri: ReturnType<typeof tumArketipSkorlari>; t: (k: string) => string }) {
  // Her arketip için karşılaştırılabilir 4 mini-metrik (0..1 normalize).
  const miniSinyaller = (s: BehaviorSignals) => [
    { ad: t("galeri.mini.fare"), v: Math.min(1, s.mousePathLength / 500), renk: KATEGORI_RENK.hareket },
    { ad: t("galeri.mini.ritim"), v: Math.min(1, s.keyIntervals.length / 6), renk: KATEGORI_RENK.ritim },
    { ad: t("galeri.mini.sure"), v: Math.min(1, s.timeToSubmit / 5000), renk: KATEGORI_RENK.zamanlama },
    { ad: t("galeri.mini.butunluk"), v: s.webdriver || s.timezoneMismatch ? 0.15 : (s.hadTouch || s.deviceMotion || s.mouseBeforeKey ? 0.9 : 0.5), renk: KATEGORI_RENK.butunluk },
  ];

  return (
    <Panel baslik={t("galeri.baslik")}>
      <p className="mb-5 flex items-center gap-1.5 text-[13px] text-slate-muted">
        <Sparkles className="size-4 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("galeri.aciklama") }} />
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galeri.map(({ arketip: a, sonuc: r }) => {
          const insan = r.humanLikely;
          return (
            <div key={a.kimlik} className={cn("rounded-2xl border p-4 transition", insan ? "border-green-200 bg-ok-soft/20" : "border-red-200 bg-danger-soft/20")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("grid size-8 place-items-center rounded-lg", insan ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2")}>
                    {insan ? <ShieldCheck className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  {/* lib ad → kimlik key-map ile çevrilir */}
                  <span className="text-[13.5px] font-semibold text-slate-ink">{t(`arketip.${a.kimlik}.ad`)}</span>
                </div>
                <Badge ton={insan ? "yesil" : "kirmizi"}>{insan ? t("motor.insan") : t("motor.bot")}</Badge>
              </div>

              {/* skor */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className={cn("text-[26px] font-bold leading-none num", insan ? "text-ok" : "text-danger2")}>{r.score.toFixed(2)}</span>
                <span className="text-[11px] text-slate-faint">{t("galeri.guven").replace("{n}", String(r.confidence))}</span>
                {r.beklentiyeUygun && <span className="ml-auto rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate-faint">{t("galeri.dogrulandi")}</span>}
              </div>

              {/* mini sinyal barları */}
              <div className="mt-3 space-y-1.5">
                {miniSinyaller(a.sinyal).map((m) => (
                  <div key={m.ad} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[10.5px] text-slate-muted">{m.ad}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full" style={{ width: `${m.v * 100}%`, background: m.renk }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* lib aciklama → kimlik key-map; etiketler → exact-TR key-map */}
              <p className="mt-3 text-[11.5px] leading-relaxed text-slate-muted">{t(`arketip.${a.kimlik}.aciklama`)}</p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {a.etiketler.map((e) => (
                  <span key={e} className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate-faint">{t(`etiket.${e}`)}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SinyalKart({ ikon, baslik, ogeler }: { ikon: React.ReactNode; baslik: string; ogeler: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">{ikon}</span>
        <span className="text-[13px] font-semibold text-slate-ink">{baslik}</span>
      </div>
      <ul className="space-y-1">
        {ogeler.map((o) => (
          <li key={o} className="flex items-start gap-1.5 text-[12px] text-slate-muted">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-500" /> {o}
          </li>
        ))}
      </ul>
    </div>
  );
}
