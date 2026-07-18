"use client";

/**
 * Widget Yerelleştirme Merkezi — YerellestirmeIstemci.tsx
 * =======================================================
 * Ghost-font widget'ının kullanıcı-yüzeyli metinlerini ÇOK dile taşımayı
 * yöneten Crowdin/Lokalise tarzı bir konsol. /panel/dil'i tekrarlamaz;
 * onu tamamlar: 12 hedef dil, GERÇEK eksik takibi (tamamlanma matrisi),
 * RTL düzen çevirmeli canlı önizleme, dize düzenleyici ve locale bundle
 * (JSON) dışa aktarımı.
 *
 * DÜRÜSTLÜK: TR/EN/DE/FR/ES/AR/RU/PT/HE tam ve gerçek çevrilidir (çekirdek
 * diller widget'ta çalışıyor). ZH/JA/HI kasıtlı KISMÎdir (topluluk çevirisi
 * bekliyor). Düzenlemeler yalnızca bu oturuma özeldir (localStorage) — canlı
 * widget'ı değiştirmez; katkı akışını simüle eder.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Languages, Globe, ShieldCheck, Lock, RotateCw, Volume2, Check, Download,
  AlertTriangle, Search, Pencil, RotateCcw, Users, ArrowLeftRight, FileJson2,
} from "lucide-react";
import {
  Panel, StatKart, Badge, Ilerleme, KodBlok, NotKutusu, useToast,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  DILLER, ANAHTARLAR, ANAHTAR_KODLARI, CEVIRILER, DIL_HARITA,
  yerellestirmeOzet,
  type Dil,
} from "./yerel";
import type { Dil as PanelDil } from "@/lib/i18n/panel";
import { yerelCeviri } from "./yerellestirme.i18n";

const DEPO = "specter.yerel.v1";

/** Oturum-yerel düzenleme deposu tipi: {dilKod: {anahtar: metin}}. */
type Duzenlemeler = Record<string, Record<string, string>>;

export function YerellestirmeIstemci({ dil }: { dil: PanelDil }) {
  const t = (k: string) => yerelCeviri(k, dil);
  const { goster } = useToast();
  const [seciliKod, setSeciliKod] = useState<string>("en");
  const [duzenlemeler, setDuzenlemeler] = useState<Duzenlemeler>({});
  const [obekFiltre, setObekFiltre] = useState<string>("hepsi");
  const [ara, setAra] = useState("");
  const [yuklendi, setYuklendi] = useState(false);

  // Oturum-yerel düzenlemeleri yükle.
  useEffect(() => {
    try {
      const ham = localStorage.getItem(DEPO);
      if (ham) setDuzenlemeler(JSON.parse(ham));
    } catch {
      /* yoksay */
    }
    setYuklendi(true);
  }, []);

  // Değişiklikleri kalıcılaştır.
  useEffect(() => {
    if (!yuklendi) return;
    try {
      localStorage.setItem(DEPO, JSON.stringify(duzenlemeler));
    } catch {
      /* yoksay */
    }
  }, [duzenlemeler, yuklendi]);

  const secili = DIL_HARITA[seciliKod] ?? DILLER[0];

  /** Bir anahtarın etkin (düzenleme öncelikli) çeviri değeri. */
  const etkinDeger = useCallback(
    (dilKod: string, anahtar: string): string => {
      const d = duzenlemeler[dilKod]?.[anahtar];
      if (typeof d === "string") return d;
      return CEVIRILER[dilKod]?.[anahtar] ?? "";
    },
    [duzenlemeler],
  );

  /** Etkin değerlerle tamamlanma oranı (düzenlemeler dahil). */
  const etkinOran = useCallback(
    (dilKod: string): number => {
      const dolu = ANAHTAR_KODLARI.filter((k) => etkinDeger(dilKod, k).trim().length > 0).length;
      return Math.round((dolu / ANAHTAR_KODLARI.length) * 100);
    },
    [etkinDeger],
  );

  const etkinEksik = useCallback(
    (dilKod: string): number =>
      ANAHTAR_KODLARI.filter((k) => etkinDeger(dilKod, k).trim().length === 0).length,
    [etkinDeger],
  );

  // Özet — temel katalog (düzenleme öncesi gerçek durum).
  const ozet = useMemo(() => yerellestirmeOzet(), []);

  // Matris için diller: tamamlanma oranına göre azalan sırada.
  const sirali = useMemo(
    () => [...DILLER].sort((a, b) => etkinOran(b.kod) - etkinOran(a.kod)),
    [etkinOran],
  );

  // Düzenleyici satırları: öbek + arama filtresi.
  const gorunenAnahtarlar = useMemo(() => {
    const q = ara.trim().toLowerCase();
    return ANAHTARLAR.filter((a) => {
      if (obekFiltre !== "hepsi" && a.obek !== obekFiltre) return false;
      if (!q) return true;
      return (
        a.anahtar.toLowerCase().includes(q) ||
        a.aciklama.toLowerCase().includes(q) ||
        a.ornek.toLowerCase().includes(q) ||
        etkinDeger(seciliKod, a.anahtar).toLowerCase().includes(q)
      );
    });
  }, [ara, obekFiltre, seciliKod, etkinDeger]);

  // ------- aksiyonlar -------
  const dizeyiDegistir = (anahtar: string, metin: string) => {
    setDuzenlemeler((p) => ({
      ...p,
      [seciliKod]: { ...(p[seciliKod] ?? {}), [anahtar]: metin },
    }));
  };

  const dizeyiSifirla = (anahtar: string) => {
    setDuzenlemeler((p) => {
      const dilE = { ...(p[seciliKod] ?? {}) };
      delete dilE[anahtar];
      return { ...p, [seciliKod]: dilE };
    });
  };

  const dilDuzenlemeleriniSifirla = () => {
    setDuzenlemeler((p) => {
      const kopya = { ...p };
      delete kopya[seciliKod];
      return kopya;
    });
    goster({ tip: "bilgi", baslik: t("yl.duzen.sifirlandi").replace("{dil}", secili.yerelAd) });
  };

  const seciliDilDuzenlendi = Boolean(duzenlemeler[seciliKod] && Object.keys(duzenlemeler[seciliKod]).length);

  // Etkin bundle (düzenlemeler dahil) — dışa aktarım JSON'u.
  const etkinBundle = useMemo(() => {
    const dizeler: Record<string, string> = {};
    for (const k of ANAHTAR_KODLARI) {
      const v = etkinDeger(seciliKod, k);
      if (v.trim().length > 0) dizeler[k] = v;
    }
    return {
      _kod: seciliKod,
      _yerelAd: secili.yerelAd,
      _rtl: secili.rtl,
      _tamamlanma: etkinOran(seciliKod),
      ...dizeler,
    };
  }, [seciliKod, secili, etkinDeger, etkinOran]);

  const bundleJson = useMemo(() => JSON.stringify(etkinBundle, null, 2), [etkinBundle]);

  const bundleIndir = () => {
    const blob = new Blob([bundleJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `specter-locale-${seciliKod}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("yl.export.indirildi").replace("{dosya}", `specter-locale-${seciliKod}.json`) });
  };

  const embedSnippet = useMemo(
    () =>
      `<!-- ${t("yl.embed.yorum").replace("{dil}", secili.yerelAd).replace("{kod}", seciliKod)} -->\n` +
      `<div class="specter"\n     data-sitekey="pk_site_anahtariniz"\n     data-lang="${seciliKod}"${secili.rtl ? '\n     dir="rtl"' : ""}></div>\n` +
      `<script src="https://veylify.com/specter.js" async defer></script>`,
    [secili, seciliKod],
  );

  const seciliTam = etkinOran(seciliKod) === 100;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Globe className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("yl.intro.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("yl.intro.metin1").replace("{n}", String(ozet.toplamDil))}
            <b>{t("yl.intro.canliOnizle")}</b>{t("yl.intro.metin2")}<b>{t("yl.intro.jsonDisaAktar")}</b>{t("yl.intro.metin3")}
            <a href="/panel/dil" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2">
              {t("yl.intro.dilLink")}
            </a>
            {t("yl.intro.metin4")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamDil} etiket={t("yl.ozet.hedefDil")} ikon={<Globe className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.tamDil} etiket={t("yl.ozet.tamCevrili")} ikon={<Check className="size-5" />} tone="ok" />
        <StatKart sayi={ozet.rtlDil} etiket={t("yl.ozet.rtl")} ikon={<ArrowLeftRight className="size-5" />} />
        <StatKart sayi={`%${ozet.ortTamamlanma}`} etiket={t("yl.ozet.ortTamamlanma")} ikon={<Languages className="size-5" />} />
      </div>

      {/* İKİ SÜTUN: solda matris, sağda canlı önizleme + dışa aktarım */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* SOL: tamamlanma matrisi */}
        <Panel
          baslik={t("yl.matris.baslik")}
          sagUst={
            <span className="text-[12px] font-medium text-slate-faint">
              {t("yl.matris.sagUst").replace("{eksik}", String(ozet.eksikCeviriToplam)).replace("{anahtar}", String(ANAHTAR_KODLARI.length))}
            </span>
          }
        >
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("yl.matris.aciklama")}
          </p>
          <div className="space-y-1.5">
            {sirali.map((d) => (
              <MatrisSatir
                key={d.kod}
                t={t}
                dil={d}
                oran={etkinOran(d.kod)}
                eksik={etkinEksik(d.kod)}
                secili={d.kod === seciliKod}
                duzenlendi={Boolean(duzenlemeler[d.kod] && Object.keys(duzenlemeler[d.kod]).length)}
                onSec={() => setSeciliKod(d.kod)}
              />
            ))}
          </div>
        </Panel>

        {/* SAĞ: canlı önizleme */}
        <Panel
          baslik={
            <span className="flex items-center gap-2">
              {t("yl.onizle.baslik")}
              <span className="text-[13px] font-normal text-slate-muted" dir={secili.rtl ? "rtl" : "ltr"}>
                — {secili.bayrak} {secili.yerelAd}
              </span>
            </span>
          }
          sagUst={secili.rtl ? <Badge ton="mavi">{t("yl.rozet.rtl")}</Badge> : undefined}
        >
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("yl.onizle.aciklama1")}<code className="rounded bg-canvas px-1 py-0.5 text-[12px] font-medium text-brand-700">dir=&quot;rtl&quot;</code>{t("yl.onizle.aciklama2")}
          </p>
          <OnizlemeKart dil={secili} deger={(k) => etkinDeger(secili.kod, k)} />
          {!seciliTam && (
            <div className="mt-4">
              <NotKutusu ton="sari" baslik={t("yl.onizle.eksikBaslik")}>
                {t("yl.onizle.eksikMetin").replace("{n}", String(etkinEksik(secili.kod)))}
              </NotKutusu>
            </div>
          )}
        </Panel>
      </div>

      {/* DİZE DÜZENLEYİCİ */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Pencil className="size-4 text-brand-600" />
            {t("yl.duzen.baslik")} — {secili.bayrak} {secili.yerelAd}
          </span>
        }
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-slate-faint">
              {t("yl.duzen.durum").replace("{oran}", String(etkinOran(secili.kod))).replace("{eksik}", String(etkinEksik(secili.kod)))}
            </span>
            {seciliDilDuzenlendi && (
              <Button variant="outline" size="sm" onClick={dilDuzenlemeleriniSifirla}>
                <RotateCcw className="size-4" /> {t("yl.duzen.geriAl")}
              </Button>
            )}
          </div>
        }
      >
        {/* araç çubuğu: arama + öbek filtre */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder={t("yl.duzen.araPlaceholder")}
              aria-label={t("yl.duzen.araLabel")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {OBEKLER.map((o) => (
              <button
                key={o.kod}
                onClick={() => setObekFiltre(o.kod)}
                aria-pressed={obekFiltre === o.kod}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12.5px] font-medium transition",
                  obekFiltre === o.kod
                    ? "bg-ink-900 text-white"
                    : "border border-line text-slate-muted hover:bg-canvas",
                )}
              >
                {t(o.adKey)}
              </button>
            ))}
          </div>
        </div>

        {/* düzenleyici satırları */}
        <div className="space-y-2.5">
          {gorunenAnahtarlar.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-faint">{t("yl.duzen.eslesmeYok")}</p>
          ) : (
            gorunenAnahtarlar.map((a) => {
              const deger = etkinDeger(secili.kod, a.anahtar);
              const bos = deger.trim().length === 0;
              const duzenlendi = typeof duzenlemeler[secili.kod]?.[a.anahtar] === "string";
              return (
                <DizeSatir
                  key={a.anahtar}
                  t={t}
                  anahtar={a.anahtar}
                  aciklama={t(`yl.k.${a.anahtar}`)}
                  ornek={a.ornek}
                  deger={deger}
                  bos={bos}
                  duzenlendi={duzenlendi}
                  rtl={secili.rtl}
                  onDegis={(v) => dizeyiDegistir(a.anahtar, v)}
                  onSifirla={duzenlendi ? () => dizeyiSifirla(a.anahtar) : undefined}
                />
              );
            })
          )}
        </div>
      </Panel>

      {/* DIŞA AKTARIM + EMBED */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          baslik={
            <span className="flex items-center gap-2">
              <FileJson2 className="size-4 text-brand-600" />
              Locale bundle — {seciliKod}.json
            </span>
          }
          sagUst={
            <Button size="sm" onClick={bundleIndir}>
              <Download className="size-4" /> {t("yl.export.jsonIndir")}
            </Button>
          }
        >
          <p className="mb-3 text-[13px] text-slate-muted">
            {t("yl.export.aciklama").replace("{dil}", secili.yerelAd)}
          </p>
          <KodBlok kod={bundleJson} dil="json" baslik={`specter-locale-${seciliKod}.json`} maxH="max-h-[320px]" />
        </Panel>

        <Panel baslik={t("yl.embed.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">
            {t("yl.embed.aciklama1")}<code className="rounded bg-canvas px-1 py-0.5 text-[12px] font-medium text-brand-700">dir=&quot;rtl&quot;</code>{t("yl.embed.aciklama2")}
          </p>
          <KodBlok kod={embedSnippet} dil="html" baslik={`data-lang="${seciliKod}"`} />
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 px-4 py-3 text-[12.5px] text-slate-muted">
              <Users className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <span>
                <b>{t("yl.embed.topluluk")}</b>{t("yl.embed.toplulukMetin")}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Dürüstlük dipnotu */}
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/30 px-4 py-3 text-[12px] text-slate-faint">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          {t("yl.dipnot")}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ öbek filtreleri */
const OBEKLER = [
  { kod: "hepsi", adKey: "yl.obek.hepsi" },
  { kod: "challenge", adKey: "yl.obek.challenge" },
  { kod: "durum", adKey: "yl.obek.durum" },
  { kod: "erisilebilirlik", adKey: "yl.obek.erisilebilirlik" },
  { kod: "altbilgi", adKey: "yl.obek.altbilgi" },
];

/* ------------------------------------------------------------------ MatrisSatir */
function MatrisSatir({
  t, dil, oran, eksik, secili, duzenlendi, onSec,
}: {
  t: (k: string) => string;
  dil: Dil;
  oran: number;
  eksik: number;
  secili: boolean;
  duzenlendi: boolean;
  onSec: () => void;
}) {
  const tam = oran === 100;
  const ton = oran === 100 ? "ok" : oran >= 60 ? "warn" : "danger";
  return (
    <button
      onClick={onSec}
      aria-pressed={secili}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
        secili
          ? "border-brand-400 bg-brand-50/40 ring-1 ring-brand-200"
          : "border-line hover:border-line-strong hover:bg-canvas/60",
      )}
    >
      <span className="text-[24px] leading-none">{dil.bayrak}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-ink" dir={dil.rtl ? "rtl" : "ltr"}>
            {dil.yerelAd}
          </span>
          {dil.rtl && <Badge ton="mavi">{t("yl.rozet.rtl")}</Badge>}
          {duzenlendi && <Badge ton="brand">{t("yl.matris.duzenlendi")}</Badge>}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-muted">
          {dil.ad}
          <span className="font-mono text-[11px] text-slate-faint">· {dil.kod}</span>
          {!tam && <span className="text-slate-faint">· {t("yl.matris.eksik").replace("{n}", String(eksik))}</span>}
        </span>
      </span>
      <span className="hidden w-28 shrink-0 sm:block">
        <Ilerleme deger={oran} ton={ton} />
      </span>
      <span className="w-11 shrink-0 text-right">
        <Badge ton={tam ? "yesil" : oran >= 60 ? "sari" : "kirmizi"}>{oran}%</Badge>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ DizeSatir */
function DizeSatir({
  t, anahtar, aciklama, ornek, deger, bos, duzenlendi, rtl, onDegis, onSifirla,
}: {
  t: (k: string) => string;
  anahtar: string;
  aciklama: string;
  ornek: string;
  deger: string;
  bos: boolean;
  duzenlendi: boolean;
  rtl: boolean;
  onDegis: (v: string) => void;
  onSifirla?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition",
        bos ? "border-amber-200 bg-warn-soft/40" : "border-line bg-surface",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] font-medium text-slate-ink">
          {anahtar}
        </code>
        <span className="text-[12px] text-slate-muted">{aciklama}</span>
        {bos && (
          <Badge ton="sari">
            <AlertTriangle className="size-3" /> {t("yl.duzen.eksik")}
          </Badge>
        )}
        {duzenlendi && !bos && <Badge ton="brand">{t("yl.duzen.duzenlendi")}</Badge>}
        {onSifirla && (
          <button
            onClick={onSifirla}
            className="ml-auto flex items-center gap-1 text-[12px] font-medium text-slate-faint transition hover:text-slate-ink"
          >
            <RotateCcw className="size-3.5" /> {t("yl.duzen.sifirla")}
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* TR referans */}
        <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-faint">
            🇹🇷 {t("yl.duzen.trReferans")}
          </div>
          <p className="text-[13px] leading-relaxed text-slate-muted">{ornek}</p>
        </div>
        {/* çeviri girdisi */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-faint">
            <Pencil className="size-3" /> {t("yl.duzen.ceviri")}
          </div>
          <textarea
            value={deger}
            dir={rtl ? "rtl" : "ltr"}
            onChange={(e) => onDegis(e.target.value)}
            rows={2}
            placeholder={t("yl.duzen.ceviriPlaceholder")}
            className={cn(
              "w-full resize-y rounded-xl border bg-surface px-3 py-2 text-[13px] leading-relaxed text-slate-ink outline-none transition placeholder:text-slate-faint focus:ring-4 focus:ring-brand-100",
              bos ? "border-amber-300 focus:border-amber-400" : "border-line-strong focus:border-brand-400",
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ OnizlemeKart
 * Ghost-font doğrulama kartının görsel taklidi — seçili dilin ETKİN (düzenlenmiş)
 * metinleriyle. Boş dizeler İngilizce'ye düşer (widget'ın gerçek yedek davranışı).
 * RTL dillerde dir="rtl" ile tüm akış tersine döner. */
function OnizlemeKart({ dil, deger }: { dil: Dil; deger: (anahtar: string) => string }) {
  const rtl = dil.rtl;
  // yedek: boşsa İngilizce, o da yoksa TR referans
  const t = (k: string): string => {
    const v = deger(k);
    if (v.trim()) return v;
    return CEVIRILER.en?.[k] ?? CEVIRILER.tr?.[k] ?? "";
  };
  // RTL/CJK dillere göre örnek ghost-font içeriği
  const kodOrnek = rtl ? "٤٧٩A" : dil.kod === "zh" || dil.kod === "ja" ? "K7X4" : "K7X4";
  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="mx-auto w-[328px] max-w-full overflow-hidden rounded-[20px] text-[#e8eef7] shadow-[0_20px_60px_-18px_rgba(0,0,0,.65)] ring-1 ring-cyan-400/10"
      style={{ background: "radial-gradient(120% 140% at 0% 0%,#16233f 0%,#0c1526 45%,#080d18 100%)" }}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      {/* başlık */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#aebfd4]">
          <ShieldCheck className="size-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,.5)]" />
          {t("title")}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5ad1c4]">
          <Lock className="size-[11px]" />
          {t("secure")}
        </div>
      </div>

      {/* canvas taklidi */}
      <div className="relative px-4 pt-0.5">
        <div className="relative flex h-[104px] items-center justify-center overflow-hidden rounded-xl bg-[#0b1120] ring-1 ring-white/[0.07]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #234 1px, transparent 1px), radial-gradient(circle at 60% 70%, #2a3b52 1px, transparent 1px), radial-gradient(circle at 80% 20%, #1c3350 1px, transparent 1px)",
              backgroundSize: "6px 6px, 5px 5px, 7px 7px",
            }}
          />
          <span className="relative select-none font-mono text-[30px] font-black tracking-[0.35em] text-[#d4ecf7]/85 drop-shadow-[0_0_10px_rgba(103,232,249,.35)]">
            {kodOrnek}
          </span>
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 3px)",
            }}
          />
          {/* ses + yeni kod (RTL'de dir sayesinde karşıya geçer) */}
          <div className="absolute top-2.5 flex gap-1.5" style={rtl ? { left: 10 } : { right: 10 }}>
            <span
              title={t("audio")}
              className="grid size-[30px] place-items-center rounded-[9px] border border-white/[0.09] bg-[rgba(12,20,38,.72)] text-[#aebfd4]"
            >
              <Volume2 className="size-[15px]" />
            </span>
            <span
              title={t("reload")}
              className="grid size-[30px] place-items-center rounded-[9px] border border-white/[0.09] bg-[rgba(12,20,38,.72)] text-[#aebfd4]"
            >
              <RotateCw className="size-[15px]" />
            </span>
          </div>
        </div>
      </div>

      {/* input + doğrula */}
      <div className="flex gap-2.5 px-4 pt-3.5 pb-2.5">
        <div className="flex h-11 flex-1 items-center rounded-xl border border-white/10 bg-[rgba(9,14,26,.8)] px-3.5 text-[13px] text-[#54657f]">
          {t("placeholder")}
        </div>
        <div className="grid h-11 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#2ee0f5] to-[#06b6d4] px-5 text-[14px] font-extrabold text-[#042028]">
          {t("verify")}
        </div>
      </div>

      {/* kontrol mesajı (görünmez mod) */}
      <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] text-[#7387a0]">
        <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
        <span>{t("checking")}</span>
      </div>

      {/* alt bar */}
      <div className="flex items-center justify-between px-4 pb-3.5 pt-1 text-[11px] text-[#54657f]">
        <span className="flex items-center gap-1.5 font-bold text-[#8fa8bd]">
          <span className="size-[7px] rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          {t("protected")}
        </span>
        <span className="flex gap-2.5">
          <span>{t("privacy")}</span>
          <span>{t("terms")}</span>
        </span>
      </div>
    </div>
  );
}
