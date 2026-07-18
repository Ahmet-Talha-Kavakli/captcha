"use client";

/**
 * ApiSurumIstemci — API Sürümleme & Değişiklik Günlüğü merkezi (istemci)
 * =====================================================================
 * Bölümler:
 *   1. Sürüm genel bakış        → v1 (kararlı) + v2 (beta) kartları
 *   2. Sürümleme konvansiyonu   → path (/v1) + tarih başlığı (Specter-Version)
 *   3. Değişiklik günlüğü        → tür filtreli ters-kronolojik zaman çizelgesi
 *   4. Endpoint sürüm matrisi    → gerçek uçlar × sürüm × durum
 *   5. Kullanımdan kaldırma       → sunset tarihi + göç kılavuzu (before/after)
 *   6. "Neler değişti" diff       → sürüm atlaması için istek/yanıt farkı
 *   7. Sürüm sabitleme            → header/path ile pinleme + politika notu
 *
 * NOT: Değişiklik günlüğü tarihleri ürünün evrimini TEMSİLİ olarak yansıtır.
 * Endpoint matrisi ve kod örnekleri src/app/api/v1/ altındaki GERÇEK uçlarla
 * (challenge / passive / verify / siteverify) hizalıdır.
 */

import { useMemo, useState } from "react";
import {
  GitPullRequest,
  Check,
  X,
  Clock,
  Sparkles,
  Wrench,
  Bug,
  AlertTriangle,
  Ban,
  CircleDot,
  Copy,
  Pin,
  Layers,
  ShieldCheck,
  Info,
  Minus,
  Plus,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu, KodBlok, useToast } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { apiSurumCeviri } from "./apisurum.i18n";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";

/* ------------------------------------------------------------------ tipler */

/** Değişiklik günlüğü giriş türleri (renkli rozetler). */
type DegisimTuru = "yeni" | "iyilestirme" | "duzeltme" | "kirici" | "kaldirma";

/** Sürüm/endpoint durum enum'u — DEĞER asla çevrilmez, etiketi t() ile türetilir. */
type SurumDurum = "kararli" | "beta" | "kaldirildi";

interface GunlukGirisi {
  tarih: string; // ISO — hem veri hem çeviri anahtarı (as.g.<tarih>.*)
  surum: string; // v1 / v2 (beta) / 2026-05-01 tarih pini — VERİ, çevrilmez
  tur: DegisimTuru;
}

interface SurumBilgi {
  ad: string; // v1 / v2 (beta) — VERİ (sürüm numarası), çevrilmez
  anahtar: "v1" | "v2"; // etiket/açıklama çeviri anahtarı için
  taban: string; // taban URL — VERİ, çevrilmez
  durum: SurumDurum;
  yayin: string; // ISO tarih — VERİ
  guncel?: boolean;
}

/** Bir endpoint'in belirli bir sürümdeki durumu. */
type MatrisDurum = "var" | "beta" | "planlanan" | "degisti" | "kaldirildi" | "yok";

interface EndpointSatir {
  metot: string; // HTTP metodu — VERİ, çevrilmez
  yol: string; // endpoint yolu — VERİ; özet çeviri anahtarı da bundan türer
  ozetAnahtar: string; // as.ep.<x>
  durum: SurumDurum;
  v1: MatrisDurum;
  v2: MatrisDurum;
}

/* ------------------------------------------------------------------ veri: sürümler */

const SURUMLER: SurumBilgi[] = [
  {
    ad: "v1",
    anahtar: "v1",
    taban: "https://api.veylify.com/api/v1",
    durum: "kararli",
    yayin: "2025-09-01",
    guncel: true,
  },
  {
    ad: "v2 (beta)",
    anahtar: "v2",
    taban: "https://api.veylify.com/api/v2",
    durum: "beta",
    yayin: "2026-06-15",
  },
];

/* ------------------------------------------------------------------ veri: değişiklik günlüğü
 * Ters-kronolojik. Bot-koruma API'sine özgü, akla yatkin girişler. */

const GUNLUK: GunlukGirisi[] = [
  { tarih: "2026-06-15", surum: "v2 (beta)", tur: "yeni" },
  { tarih: "2026-05-20", surum: "2026-05-20", tur: "yeni" },
  { tarih: "2026-04-28", surum: "2026-04-28", tur: "yeni" },
  { tarih: "2026-04-10", surum: "2026-04-10", tur: "iyilestirme" },
  { tarih: "2026-03-15", surum: "2026-03-15", tur: "iyilestirme" },
  { tarih: "2026-02-02", surum: "2026-02-02", tur: "duzeltme" },
  { tarih: "2026-01-01", surum: "2026-01-01", tur: "iyilestirme" },
  { tarih: "2025-12-10", surum: "v1", tur: "yeni" },
  { tarih: "2025-11-05", surum: "v1", tur: "iyilestirme" },
  { tarih: "2025-10-14", surum: "v1", tur: "kirici" },
  { tarih: "2025-09-20", surum: "v1", tur: "kaldirma" },
  { tarih: "2025-09-01", surum: "v1", tur: "yeni" },
];

/* ------------------------------------------------------------------ veri: endpoint matrisi */

const ENDPOINTLER: EndpointSatir[] = [
  { metot: "POST", yol: "/challenge", ozetAnahtar: "as.ep.challenge", durum: "kararli", v1: "var", v2: "var" },
  { metot: "POST", yol: "/passive", ozetAnahtar: "as.ep.passive", durum: "kararli", v1: "var", v2: "degisti" }, // v2'de risk nesnesi döner
  { metot: "POST", yol: "/verify", ozetAnahtar: "as.ep.verify", durum: "kararli", v1: "var", v2: "degisti" },
  { metot: "POST", yol: "/siteverify", ozetAnahtar: "as.ep.siteverify", durum: "kararli", v1: "var", v2: "var" },
  { metot: "POST", yol: "/check", ozetAnahtar: "as.ep.check", durum: "kaldirildi", v1: "kaldirildi", v2: "yok" },
];

/* ------------------------------------------------------------------ veri: görsel-only telemetri
 * Aşağıdaki paylar/hacimler sürüm benimseme ve endpoint yükünü TEMSİLİ olarak
 * görselleştirmek içindir (donut / histogram / gauge). CRUD veya API sözleşmesi
 * ile ilişkileri yoktur; yalnızca panel görselini zenginleştirir. */

/** Sürüm başına istek payı (%) — v1 kararlı çoğunluk, v2 beta erken benimseme. */
const SURUM_PAY: { anahtar: "v1" | "v2"; pay: number; renk: string }[] = [
  { anahtar: "v1", pay: 87, renk: "#2f6fed" },
  { anahtar: "v2", pay: 13, renk: "#d97706" },
];

/** Endpoint başına 24s çağrı hacmi (bin) — histogram kovaları. */
const ENDPOINT_HACIM: Record<string, number> = {
  "/challenge": 128,
  "/passive": 94,
  "/verify": 210,
  "/siteverify": 176,
  "/check": 12, // kaldırılıyor — düşük artık trafik
};

/** v2 (beta) benimseme skoru 0-100 (gauge). */
const V2_BENIMSEME = 34;
/** v1 kararlılık/sağlık skoru 0-100 (gauge). */
const V1_SAGLIK = 96;

/* ------------------------------------------------------------------ tür meta */

/** Değişim türü meta — etiket (ad) t() ile türetilir; burada yalnızca görsel. */
const TUR_META: Record<
  DegisimTuru,
  { ikon: React.ReactNode; ton: "brand" | "yesil" | "sari" | "kirmizi" | "mavi" | "gri"; nokta: string }
> = {
  yeni: { ikon: <Sparkles className="size-3.5" />, ton: "yesil", nokta: "#16a34a" },
  iyilestirme: { ikon: <Wrench className="size-3.5" />, ton: "mavi", nokta: "#2563eb" },
  duzeltme: { ikon: <Bug className="size-3.5" />, ton: "brand", nokta: "#4a41e8" },
  kirici: { ikon: <AlertTriangle className="size-3.5" />, ton: "kirmizi", nokta: "#dc2626" },
  kaldirma: { ikon: <Ban className="size-3.5" />, ton: "sari", nokta: "#d97706" },
};

/** Türe karşılık gelen çeviri anahtarı. */
const TUR_ANAHTAR: Record<DegisimTuru, string> = {
  yeni: "as.tur.yeni",
  iyilestirme: "as.tur.iyilestirme",
  duzeltme: "as.tur.duzeltme",
  kirici: "as.tur.kirici",
  kaldirma: "as.tur.kaldirma",
};

/** Matris durumu meta — metin t() ile türetilir; burada yalnızca görsel. */
const MATRIS_META: Record<MatrisDurum, { ikon: React.ReactNode; anahtar: string; renk: string }> = {
  var: { ikon: <Check className="size-4" />, anahtar: "as.mat.var", renk: "text-ok" },
  beta: { ikon: <CircleDot className="size-4" />, anahtar: "as.mat.beta", renk: "text-brand-600" },
  planlanan: { ikon: <Clock className="size-4" />, anahtar: "as.mat.planlanan", renk: "text-slate-faint" },
  degisti: { ikon: <GitPullRequest className="size-4" />, anahtar: "as.mat.degisti", renk: "text-warn" },
  kaldirildi: { ikon: <Ban className="size-4" />, anahtar: "as.mat.kaldirildi", renk: "text-danger2" },
  yok: { ikon: <Minus className="size-4" />, anahtar: "as.mat.yok", renk: "text-slate-faint" },
};

/* ------------------------------------------------------------------ göç / diff kod örnekleri */

const GOC_ESKI = `# ESKİ — /api/v1/check (kullanımdan kaldırıldı, sunset 2026-03-31)
# Tek istekte hem cevabı hem token'ı gönderirdiniz; sunucu güvenilir değildi.
curl -X POST https://api.veylify.com/api/v1/check \\
  -H "Content-Type: application/json" \\
  -d '{
    "siteKey": "site_live_a1b2c3",
    "token": "eyJ...",
    "input": "7F3K9"
  }'

# Yanıt (istemci tarafında doğrulanamayan tek-adım)
# { "ok": true }`;

const GOC_YENI = `# YENİ — iki-fazlı akış: verify (istemci) + siteverify (sunucu)
# 1) Tarayıcıdaki widget doğrular ve imzalı verification token alır:
curl -X POST https://api.veylify.com/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "siteKey": "site_live_a1b2c3",
    "token": "eyJ...",
    "input": "7F3K9",
    "signals": { "mouse": 42, "dwell": 1830 }
  }'
# => { "success": true, "token": "<verification>", "score": 0.94 }

# 2) SUNUCUNUZ secret anahtarla teyit eder (güvenilir kaynak):
curl -X POST https://api.veylify.com/api/v1/siteverify \\
  -H "Content-Type: application/json" \\
  -d '{ "secret": "sk_live_...", "response": "<verification>" }'
# => { "success": true, "score": 0.94, "hostname": "...", "cid": "cid_..." }`;

const DIFF_V1 = `// v1 — POST /api/v1/passive başarı yanıtı
{
  "passed": true,
  "token": "<verification>",
  "score": 0.91
}`;

const DIFF_V2 = `// v2 (beta) — POST /api/v2/passive başarı yanıtı
{
  "passed": true,
  "token": "<verification>",
  "score": 0.91,                    // (korundu — geriye uyum)
  "risk": {                         // + yeni yapılandırılmış risk nesnesi
    "score": 9,                     // + 0–100 ters risk (düşük = güvenli)
    "level": "low",                 // + low | medium | high
    "reasons": []                   // + tetikleyen sinyaller
  },
  "ja4": "t13d1516h2_..."           // + JA4 TLS parmak izi
}`;

const PIN_PATH = `# Yol tabanlı sürümleme (major sürüm) — önerilen, en açık yöntem
curl -X POST https://api.veylify.com/api/v1/siteverify \\
  -H "Content-Type: application/json" \\
  -d '{ "secret": "sk_live_...", "response": "<token>" }'

# v2 beta'yı denemek için yalnızca yolu değiştirin:
#   https://api.veylify.com/api/v2/siteverify`;

const PIN_HEADER = `# Tarih tabanlı sabitleme (minor değişiklikler) — Veylify-Version başlığı
# Major sürüm (/v1) içinde küçük, geriye uyumlu değişiklikleri kontrol eder.
curl -X POST https://api.veylify.com/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -H "Veylify-Version: 2026-01-01" \\
  -d '{ "siteKey": "site_live_a1b2c3", "token": "eyJ...", "input": "7F3K9" }'

# Başlık yoksa: hesabınızın panelde ayarlı VARSAYILAN sürümü kullanılır.`;

/* ------------------------------------------------------------------ yardımcılar */

/** BCP-47 dil kodu eşlemesi (Intl biçimlendirme için). */
const BCP47: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

/** ISO tarihi seçili dile göre kısa ay biçiminde döndürür (Intl). */
function tarihBicim(iso: string, dil: Dil): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(BCP47[dil], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------ ana bileşen */

export function ApiSurumIstemci({ dil }: { dil: Dil }) {
  const { goster } = useToast();
  const t = (anahtar: string) => apiSurumCeviri(anahtar, dil);
  const [filtre, setFiltre] = useState<DegisimTuru | "hepsi">("hepsi");

  const gorunenGunluk = useMemo(
    () => (filtre === "hepsi" ? GUNLUK : GUNLUK.filter((g) => g.tur === filtre)),
    [filtre],
  );

  const kiriciSayi = GUNLUK.filter((g) => g.tur === "kirici" || g.tur === "kaldirma").length;
  const yeniSayi = GUNLUK.filter((g) => g.tur === "yeni").length;

  /** Durum enum → rozet metni. */
  const durumMetni = (d: SurumDurum) =>
    d === "kararli" ? t("as.durum.kararli") : d === "beta" ? t("as.durum.beta") : t("as.durum.kaldirildi");
  /** Durum enum → rozet tonu. */
  const durumTon = (d: SurumDurum) => (d === "kararli" ? "yesil" : d === "beta" ? "sari" : "gri");

  function tabanKopyala(taban: string) {
    navigator.clipboard.writeText(taban);
    goster({ tip: "basari", baslik: t("as.toast.baslik"), aciklama: taban });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <GitPullRequest className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("as.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("as.giris.aciklama")}</p>
        </div>
      </div>

      {/* özet istatistikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi="v1" etiket={t("as.stat.guncel")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi="v2" etiket={t("as.stat.beta")} ikon={<CircleDot className="size-5" />} tone="brand" />
        <StatKart sayi={yeniSayi} etiket={t("as.stat.yeni")} />
        <StatKart sayi={kiriciSayi} etiket={t("as.stat.kirici")} tone="warn" ikon={<AlertTriangle className="size-5" />} />
      </div>

      {/* 1. sürüm genel bakış */}
      <Panel baslik={t("as.gb.baslik")}>
        <div className="grid gap-4 lg:grid-cols-2">
          {SURUMLER.map((s) => (
            <div
              key={s.ad}
              className={cn(
                "rounded-2xl border bg-surface p-5",
                s.guncel ? "border-brand-300 ring-1 ring-brand-100" : "border-line",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-2xl text-white",
                      s.durum === "kararli" ? "bg-brand-600" : s.durum === "beta" ? "bg-amber-500" : "bg-slate-400",
                    )}
                  >
                    <Layers className="size-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-bold text-slate-ink">{s.ad}</span>
                      {s.guncel && <Badge ton="brand">{t("as.rozet.onerilen")}</Badge>}
                    </div>
                    <div className="text-[12px] text-slate-muted">{t(`as.surum.${s.anahtar}.etiket`)}</div>
                  </div>
                </div>
                <Badge ton={durumTon(s.durum)}>{durumMetni(s.durum)}</Badge>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-slate-muted">{t(`as.surum.${s.anahtar}.aciklama`)}</p>

              {/* benimseme / sağlık gauge + istek payı — monoton satır yerine gösterge */}
              <div className="mt-4 flex items-center gap-5 border-t border-line pt-3">
                <div className="flex flex-col items-center">
                  <GaugeGost
                    deger={s.anahtar === "v1" ? V1_SAGLIK : V2_BENIMSEME}
                    boyut={120}
                    renk={s.durum === "kararli" ? "#2f6fed" : "#d97706"}
                  />
                  <span className="-mt-1 text-[11px] font-medium text-slate-faint">
                    {s.anahtar === "v1" ? t("as.gauge.saglik") : t("as.gauge.benimseme")}
                  </span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-slate-muted">{t("as.gauge.istekPayi")}</span>
                    <span className="num text-[15px] font-bold text-slate-ink">
                      %{(SURUM_PAY.find((p) => p.anahtar === s.anahtar)?.pay ?? 0)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${SURUM_PAY.find((p) => p.anahtar === s.anahtar)?.pay ?? 0}%`,
                        background: s.durum === "kararli" ? "#2f6fed" : "#d97706",
                      }}
                    />
                  </div>
                  <p className="text-[11.5px] leading-snug text-slate-faint">
                    {s.anahtar === "v1" ? t("as.gauge.v1Not") : t("as.gauge.v2Not")}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium uppercase tracking-wide text-slate-faint">{t("as.gb.tabanUrl")}</span>
                  <button
                    onClick={() => tabanKopyala(s.taban)}
                    className="group inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1 font-mono text-[12px] text-slate-ink transition hover:bg-brand-50"
                  >
                    {s.taban}
                    <Copy className="size-3 text-slate-faint transition group-hover:text-brand-600" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium uppercase tracking-wide text-slate-faint">{t("as.gb.yayinTarihi")}</span>
                  <span className="num text-[13px] font-medium text-slate-ink">{tarihBicim(s.yayin, dil)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 1b. sürüm kullanımı & endpoint yükü — donut + histogram */}
      <Panel baslik={t("as.kullanim.baslik")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-8">
          {/* sürüm istek payı donutu */}
          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("as.kullanim.payBaslik")}</div>
            <DonutDagilim
              segmentler={SURUM_PAY.map((p) => ({
                etiket: p.anahtar === "v1" ? "v1 (kararlı)" : "v2 (beta)",
                deger: p.pay,
                renk: p.renk,
              }))}
              merkezEtiket="% pay"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-slate-muted">{t("as.kullanim.payNot")}</p>
          </div>

          {/* endpoint çağrı hacmi histogramı */}
          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("as.kullanim.hacimBaslik")}</span>
              <span className="text-[11px] text-slate-faint">{t("as.kullanim.hacimBirim")}</span>
            </div>
            <Histogram
              yukseklik={120}
              kovalar={ENDPOINTLER.map((e) => ({
                etiket: e.yol.replace("/", ""),
                deger: ENDPOINT_HACIM[e.yol] ?? 0,
                ton: e.durum === "kaldirildi" ? "bot" : e.v2 === "degisti" ? "nötr" : "insan",
              }))}
            />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-slate-muted">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#16a34a" }} />{t("as.kullanim.efsaneKararli")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#2f6fed" }} />{t("as.kullanim.efsaneDegisti")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#dc2626" }} />{t("as.kullanim.efsaneKaldirildi")}</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* 2. sürümleme konvansiyonu */}
      <Panel baslik={t("as.konv.baslik")}>
        <p
          className="mb-4 max-w-3xl text-[13px] leading-relaxed text-slate-muted [&_code]:font-mono [&_code]:text-slate-ink"
          dangerouslySetInnerHTML={{
            __html: t("as.konv.giris")
              .replace("{v1}", '<code class="font-mono text-slate-ink">/api/v1</code>')
              .replace("{v2}", '<code class="font-mono text-slate-ink">/api/v2</code>')
              .replace("{ver}", '<code class="font-mono text-slate-ink">Veylify-Version</code>'),
          }}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">1</span>
              {t("as.konv.yolBaslik")}
            </div>
            <p className="mt-2 text-[12.5px] text-slate-muted">{t("as.konv.yolAciklama")}</p>
            <code className="mt-3 block rounded-lg bg-ink-900 px-3 py-2 font-mono text-[12px] text-emerald-300">
              POST https://api.veylify.com/api/<b className="text-white">v1</b>/verify
            </code>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">2</span>
              {t("as.konv.baslikBaslik")}
            </div>
            <p className="mt-2 text-[12.5px] text-slate-muted">{t("as.konv.baslikAciklama")}</p>
            <code className="mt-3 block rounded-lg bg-ink-900 px-3 py-2 font-mono text-[12px] text-cyan-300">
              Veylify-Version: <b className="text-white">2026-01-01</b>
            </code>
          </div>
        </div>
      </Panel>

      {/* 3. değişiklik günlüğü zaman çizelgesi */}
      <Panel
        baslik={t("as.gunluk.baslik")}
        sagUst={
          <div className="flex flex-wrap items-center gap-1.5">
            <FiltreDugme aktif={filtre === "hepsi"} onClick={() => setFiltre("hepsi")}>
              {t("as.gunluk.tumu")}
            </FiltreDugme>
            {(Object.keys(TUR_META) as DegisimTuru[]).map((tur) => (
              <FiltreDugme key={tur} aktif={filtre === tur} onClick={() => setFiltre(tur)} nokta={TUR_META[tur].nokta}>
                {t(TUR_ANAHTAR[tur])}
              </FiltreDugme>
            ))}
          </div>
        }
      >
        {gorunenGunluk.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-faint">{t("as.gunluk.bosTur")}</div>
        ) : (
          <ol className="relative ml-2 space-y-6 border-l border-line pl-6">
            {gorunenGunluk.map((g, i) => {
              const m = TUR_META[g.tur];
              return (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[31px] top-1 grid size-5 place-items-center rounded-full ring-4 ring-surface"
                    style={{ background: m.nokta }}
                  >
                    <span className="text-white">{m.ikon}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-[12px] font-medium text-slate-faint">{tarihBicim(g.tarih, dil)}</span>
                    <Badge ton={m.ton}>
                      {m.ikon}
                      {t(TUR_ANAHTAR[g.tur])}
                    </Badge>
                    <span className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-muted">
                      {g.surum}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-[14px] font-semibold text-slate-ink">{t(`as.g.${g.tarih}.baslik`)}</h4>
                  <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-muted">{t(`as.g.${g.tarih}.aciklama`)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      {/* 4. endpoint sürüm matrisi */}
      <Panel baslik={t("as.matris.baslik")}>
        <p
          className="mb-4 max-w-3xl text-[13px] text-slate-muted [&_code]:font-mono [&_code]:text-slate-ink"
          dangerouslySetInnerHTML={{
            __html: t("as.matris.giris").replace(
              "{url}",
              '<code class="font-mono text-slate-ink">https://api.veylify.com/api/&lt;sürüm&gt;</code>',
            ),
          }}
        />
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("as.matris.thEndpoint")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("as.matris.thDurum")}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-faint">v1</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-faint">v2 (beta)</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTLER.map((e) => (
                <tr key={e.yol} className="border-b border-line last:border-0 hover:bg-canvas/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-700">
                        {e.metot}
                      </span>
                      <span className="font-mono text-[13px] font-medium text-slate-ink">{e.yol}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-muted">{t(e.ozetAnahtar)}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge ton={durumTon(e.durum)}>{durumMetni(e.durum)}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <MatrisHucre durum={e.v1} t={t} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <MatrisHucre durum={e.v2} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* açıklama */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-slate-muted">
          {(["var", "degisti", "beta", "kaldirildi", "yok"] as MatrisDurum[]).map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5">
              <span className={MATRIS_META[d].renk}>{MATRIS_META[d].ikon}</span>
              {t(MATRIS_META[d].anahtar)}
            </span>
          ))}
        </div>
      </Panel>

      {/* 5. kullanımdan kaldırma bildirimleri + göç kılavuzu */}
      <Panel baslik={t("as.kald.baslik")}>
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-warn-soft px-4 py-3">
          <Ban className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13px] font-semibold text-slate-ink">POST /api/v1/check</span>
              <Badge ton="kirmizi">{t("as.durum.kaldirildi")}</Badge>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-700">
                <Clock className="size-3.5" /> {t("as.kald.sunset").replace("{tarih}", tarihBicim("2026-03-31", dil))}
              </span>
            </div>
            <p
              className="mt-1 text-[13px] text-amber-800 [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: t("as.kald.uyari") }}
            />
          </div>
        </div>

        {/* deprecation zaman-çizelgesi — duyuru → sunset → kaldırıldı */}
        <div className="mb-5 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
          <div className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("as.kald.zamanBaslik")}</div>
          <div className="relative">
            {/* taban çizgi */}
            <div className="absolute left-0 right-0 top-[11px] h-0.5 bg-line" />
            <div className="absolute left-0 top-[11px] h-0.5 bg-amber-400" style={{ width: "100%" }} />
            <ol className="relative flex justify-between">
              {[
                { tarih: "2025-09-20", anahtar: "duyuru", renk: "#d97706", ton: "text-amber-700" },
                { tarih: "2026-03-31", anahtar: "sunset", renk: "#dc2626", ton: "text-red-700" },
                { tarih: "2026-03-31", anahtar: "kaldirildi", renk: "#dc2626", ton: "text-red-700" },
              ].map((a, i) => (
                <li key={i} className={cn("flex flex-col", i === 0 ? "items-start" : i === 2 ? "items-end" : "items-center")}>
                  <span className="size-6 rounded-full ring-4 ring-surface" style={{ background: a.renk }} />
                  <span className={cn("mt-2 text-[11.5px] font-semibold", a.ton)}>{t(`as.kald.asama.${a.anahtar}`)}</span>
                  <span className="num mt-0.5 text-[11px] text-slate-faint">{tarihBicim(a.tarih, dil)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("as.kald.gocBaslik")}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-danger2">
              <Minus className="size-3.5" /> {t("as.kald.once")}
            </div>
            <KodBlok dil="bash" baslik="/api/v1/check" kod={GOC_ESKI} maxH="max-h-[360px]" />
          </div>
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ok">
              <Plus className="size-3.5" /> {t("as.kald.sonra")}
            </div>
            <KodBlok dil="bash" baslik="verify + siteverify" kod={GOC_YENI} maxH="max-h-[360px]" />
          </div>
        </div>

        <NotKutusu ton="sari" baslik={t("as.kald.politikaBaslik")}>
          <span className="[&_code]:font-mono" dangerouslySetInnerHTML={{ __html: t("as.kald.politika") }} />
        </NotKutusu>
      </Panel>

      {/* 6. "neler değişti" diff görünümü */}
      <Panel baslik={t("as.diff.baslik")}>
        <p
          className="mb-4 max-w-3xl text-[13px] text-slate-muted [&_code]:font-mono [&_code]:text-slate-ink"
          dangerouslySetInnerHTML={{ __html: t("as.diff.giris") }}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-muted">
              <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-slate-ink">v1</span> {t("as.diff.mevcut")}
            </div>
            <KodBlok dil="json" baslik="v1 · /api/v1/passive" kod={DIFF_V1} maxH="max-h-[320px]" />
          </div>
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 text-[12px] font-semibold text-brand-700">
              <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-brand-700">v2</span> {t("as.diff.eklenen")}
            </div>
            <KodBlok dil="json" baslik="v2 · /api/v2/passive" kod={DIFF_V2} maxH="max-h-[320px]" />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <DiffOzet ton="ekle" metin="risk.score / risk.level / risk.reasons[]" />
          <DiffOzet ton="ekle" metin="ja4 — TLS" />
          <DiffOzet ton="koru" metin={t("as.diff.ozet.koru")} />
        </div>
      </Panel>

      {/* 7. sürüm sabitleme */}
      <Panel baslik={t("as.pin.baslik")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Pin className="size-4 text-brand-600" /> {t("as.pin.yolBaslik")}
            </div>
            <KodBlok dil="bash" baslik={t("as.pin.yolEtiket")} kod={PIN_PATH} maxH="max-h-[280px]" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Pin className="size-4 text-brand-600" /> {t("as.pin.baslikBaslik")}
            </div>
            <KodBlok dil="bash" baslik="Veylify-Version" kod={PIN_HEADER} maxH="max-h-[280px]" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <IlkeKart ikon={<ShieldCheck className="size-4" />} baslik={t("as.pin.ilke1.baslik")} aciklama={t("as.pin.ilke1.aciklama")} />
          <IlkeKart ikon={<Clock className="size-4" />} baslik={t("as.pin.ilke2.baslik")} aciklama={t("as.pin.ilke2.aciklama")} />
          <IlkeKart ikon={<Info className="size-4" />} baslik={t("as.pin.ilke3.baslik")} aciklama={t("as.pin.ilke3.aciklama")} />
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("as.durustluk") }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ alt bileşenler */

function FiltreDugme({
  aktif,
  onClick,
  nokta,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  nokta?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition",
        aktif
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-line bg-surface text-slate-muted hover:border-line-strong hover:text-slate-ink",
      )}
    >
      {nokta && <span className="size-2 rounded-full" style={{ background: nokta }} />}
      {children}
    </button>
  );
}

function MatrisHucre({ durum, t }: { durum: MatrisDurum; t: (anahtar: string) => string }) {
  const m = MATRIS_META[durum];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", m.renk)}>
      {m.ikon}
      <span className="hidden sm:inline">{t(m.anahtar)}</span>
    </span>
  );
}

function DiffOzet({ ton, metin }: { ton: "ekle" | "koru"; metin: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px]",
        ton === "ekle" ? "border-green-200 bg-ok-soft text-green-800" : "border-line bg-canvas/50 text-slate-muted",
      )}
    >
      {ton === "ekle" ? <Plus className="size-3.5 shrink-0" /> : <CircleDot className="size-3.5 shrink-0" />}
      <span className="font-mono">{metin}</span>
    </div>
  );
}

function IlkeKart({ ikon, baslik, aciklama }: { ikon: React.ReactNode; baslik: string; aciklama: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">{ikon}</span>
        {baslik}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-muted">{aciklama}</p>
    </div>
  );
}
