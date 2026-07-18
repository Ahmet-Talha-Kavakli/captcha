"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck, Check, X, AlertTriangle, Monitor, Smartphone, Server,
  KeyRound, Clock, RefreshCw, Repeat, LockKeyhole, MapPin, Info, Ban,
} from "lucide-react";
import { Panel, StatKart, Badge, DurumRozeti, useToast, Ulke, KodBlok } from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { oturumGuvenlikCeviri } from "./oturum-guvenlik.i18n";
import {
  guvenlikDurusu,
  oturumRiski,
  type TokenYasamDongusu,
  type GuvenlikDurusu,
  type DurusKontrol,
  type DurusSeviye,
  type OturumRisk,
  type HuniAsama,
  type OturumRiskGirdi,
} from "@/lib/specter/oturum-guvenlik";

/* ------------------------------------------------------------------ tipler */

/** t yardımcısının tipi. */
type Ceviri = (anahtar: string) => string;

interface Props {
  kullaniciAdi: string;
  ikiAdimli: boolean;
  issued: number;
  verified: number;
  yasamDongusu: TokenYasamDongusu;
  baslangicDurus: GuvenlikDurusu;
  siteSayisi: number;
  onerilenTokenTtlMs: number;
  onerilenMaxOturum: number;
  noncePencereMs: number;
  dil: Dil;
}

/** İstemci-tarafı oturum politikası (localStorage'da kalıcı). */
interface Politika {
  maxOturum: number;
  tokenTtlDk: number;
  yeniCihaz2fa: boolean;
  supheliKonumAskiya: boolean;
}

const POLITIKA_KEY = "specter.oturum-politika.v1";
const OTURUM_KEY = "specter.oturum-durum.v1";

/* ------------------------------------------------------------------ enum → çeviri anahtarı eşlemeleri
 * Enum değerleri (kontrol id, huni asama, seviye, risk) asla çevrilmez; lib'de
 * üretilen TR metinler bu anahtarlar üzerinden client-tarafında yeniden çevrilir
 * (paylaşılan oturum-guvenlik.ts'e DOKUNULMADAN). */

const SEVIYE_ANAHTAR: Record<DurusSeviye, string> = {
  guclu: "og.durus.seviye.guclu",
  iyi: "og.durus.seviye.iyi",
  orta: "og.durus.seviye.orta",
  zayif: "og.durus.seviye.zayif",
};

const RISK_META: Record<OturumRisk, { anahtar: string; ton: "yesil" | "sari" | "kirmizi" }> = {
  dusuk: { anahtar: "og.risk.dusuk", ton: "yesil" },
  orta: { anahtar: "og.risk.orta", ton: "sari" },
  yuksek: { anahtar: "og.risk.yuksek", ton: "kirmizi" },
};

/** Kontrol id → ad/açıklama/öneri anahtarları + interpolasyon gerektirenler. */
function kontrolAd(t: Ceviri, k: DurusKontrol): string {
  return t(`og.kontrol.${k.id}.ad`);
}
function kontrolAciklama(t: Ceviri, k: DurusKontrol, maxOturum: number): string {
  return t(`og.kontrol.${k.id}.aciklama`).replace("{max}", String(maxOturum));
}
function kontrolOneri(t: Ceviri, k: DurusKontrol, onerilenTtlDk: number): string {
  return t(`og.kontrol.${k.id}.oneri`).replace("{ttl}", String(onerilenTtlDk));
}

/** Huni aşama id → ad/açıklama anahtarları. */
function huniAd(t: Ceviri, h: HuniAsama): string {
  return t(`og.huni.${h.asama}.ad`);
}
function huniAciklama(t: Ceviri, h: HuniAsama): string {
  return t(`og.huni.${h.asama}.aciklama`);
}

/**
 * Oturum risk nedenlerini çevrilmiş olarak yeniden üretir. lib'in oturumRiski
 * nedenleri TR döndürdüğü için, aynı deterministik mantığı burada çeviriyle
 * kurarız (lib'e dokunmadan). ESKI_OTURUM_MS lib'de 30 gündür.
 */
const ESKI_OTURUM_MS = 30 * 86400000;
function riskNedenleri(t: Ceviri, g: OturumRiskGirdi): string[] {
  if (g.buCihaz) return [t("og.neden.buCihaz")];
  const nedenler: string[] = [];
  if (!g.bilinenKonum) nedenler.push(t("og.neden.tanınmayanKonum"));
  if (!g.bilinenCihaz) nedenler.push(t("og.neden.tanınmayanCihaz"));
  if (g.yasMs > ESKI_OTURUM_MS) nedenler.push(t("og.neden.eskiOturum"));
  if (nedenler.length === 0) nedenler.push(t("og.neden.bilinen"));
  return nedenler;
}

/* ------------------------------------------------------------------ temsili oturumlar
 * Auth katmanı tek bir gerçek cookie oturumu tutar (bu cihaz). Çoklu-cihaz
 * listesi Auth0/Clerk tarzı bir OPS görünümü için TEMSİLİDİR; etiketler +
 * "sonlandırıldı" durumu localStorage'da kalıcıdır. Konum/IP/OS gibi alanlar
 * VERİdir (çevrilmez); `sonAktif` göreli-zaman anahtarı çeviriyle üretilir. */
interface OturumKaydi {
  id: string;
  cihaz: string;
  os: string;
  tarayici: string;
  tur: "masaustu" | "mobil" | "sunucu";
  konum: string;
  kod: string;
  ip: string;
  sonAktifAnahtar: string; // çevrilebilir göreli-zaman anahtarı
  yasGun: number;
  buCihaz: boolean;
  bilinenKonum: boolean;
  bilinenCihaz: boolean;
  aktif: boolean; // sonlandırılmadıysa true
}

const TEMSILI_OTURUMLAR: OturumKaydi[] = [
  { id: "s1", cihaz: "MacBook Pro", os: "macOS 15", tarayici: "Chrome 141", tur: "masaustu", konum: "İstanbul, TR", kod: "TR", ip: "88.240.12.4", sonAktifAnahtar: "og.zaman.simdi", yasGun: 0, buCihaz: true, bilinenKonum: true, bilinenCihaz: true, aktif: true },
  { id: "s2", cihaz: "iPhone 15", os: "iOS 18", tarayici: "Safari", tur: "mobil", konum: "İstanbul, TR", kod: "TR", ip: "88.240.12.9", sonAktifAnahtar: "og.zaman.saat2", yasGun: 3, buCihaz: false, bilinenKonum: true, bilinenCihaz: true, aktif: true },
  { id: "s3", cihaz: "Windows PC", os: "Windows 11", tarayici: "Edge 141", tur: "masaustu", konum: "Ankara, TR", kod: "TR", ip: "78.180.44.2", sonAktifAnahtar: "og.zaman.gun3", yasGun: 12, buCihaz: false, bilinenKonum: true, bilinenCihaz: false, aktif: true },
  { id: "s4", cihaz: "CI Runner", os: "Linux", tarayici: "specter-cli/1.4", tur: "sunucu", konum: "Frankfurt, DE", kod: "DE", ip: "45.83.12.7", sonAktifAnahtar: "og.zaman.saat6", yasGun: 45, buCihaz: false, bilinenKonum: false, bilinenCihaz: false, aktif: true },
];

/**
 * Göreli-zaman etiketleri sözlükte olmayan küçük görünüm dizileridir; sayılar
 * veri, biçim çeviriyle. Basitlik için burada tutulur (5 dil).
 */
const ZAMAN: Record<Dil, Record<string, string>> = {
  tr: { "og.zaman.simdi": "Şimdi", "og.zaman.saat2": "2 saat önce", "og.zaman.saat6": "6 saat önce", "og.zaman.gun3": "3 gün önce" },
  en: { "og.zaman.simdi": "Now", "og.zaman.saat2": "2 hours ago", "og.zaman.saat6": "6 hours ago", "og.zaman.gun3": "3 days ago" },
  de: { "og.zaman.simdi": "Jetzt", "og.zaman.saat2": "vor 2 Stunden", "og.zaman.saat6": "vor 6 Stunden", "og.zaman.gun3": "vor 3 Tagen" },
  fr: { "og.zaman.simdi": "Maintenant", "og.zaman.saat2": "il y a 2 heures", "og.zaman.saat6": "il y a 6 heures", "og.zaman.gun3": "il y a 3 jours" },
  es: { "og.zaman.simdi": "Ahora", "og.zaman.saat2": "hace 2 horas", "og.zaman.saat6": "hace 6 horas", "og.zaman.gun3": "hace 3 días" },
};

/* ------------------------------------------------------------------ ana */

export function OturumGuvenlikIstemci(p: Props) {
  const { goster } = useToast();
  const t = (k: string) => oturumGuvenlikCeviri(k, p.dil);
  const tZaman = (k: string) => ZAMAN[p.dil]?.[k] ?? ZAMAN.tr[k] ?? k;
  const onerilenTtlDk = Math.round(p.onerilenTokenTtlMs / 60000);

  const [politika, setPolitika] = useState<Politika>({
    maxOturum: p.onerilenMaxOturum,
    tokenTtlDk: Math.round(p.onerilenTokenTtlMs / 60000),
    yeniCihaz2fa: true,
    supheliKonumAskiya: false,
  });
  const [oturumlar, setOturumlar] = useState<OturumKaydi[]>(TEMSILI_OTURUMLAR);
  const [yuklendi, setYuklendi] = useState(false);

  /* --- localStorage yükle (SSR-güvenli) --- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pr = window.localStorage.getItem(POLITIKA_KEY);
      if (pr) setPolitika((eski) => ({ ...eski, ...JSON.parse(pr) }));
      const orr = window.localStorage.getItem(OTURUM_KEY);
      if (orr) {
        const kapali: string[] = JSON.parse(orr);
        setOturumlar((eski) => eski.map((o) => (kapali.includes(o.id) ? { ...o, aktif: false } : o)));
      }
    } catch {
      /* bozuk kayıt — varsayılanla devam */
    }
    setYuklendi(true);
  }, []);

  /* --- politika kalıcılaştır --- */
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(POLITIKA_KEY, JSON.stringify(politika));
    } catch { /* kota/gizli mod */ }
  }, [politika, yuklendi]);

  const aktifOturumlar = useMemo(() => oturumlar.filter((o) => o.aktif), [oturumlar]);

  /* --- duruş skorunu canlı ayarlarla yeniden hesapla --- */
  const durus = useMemo(
    () =>
      guvenlikDurusu({
        ikiAdimli: p.ikiAdimli,
        oturumSayisi: aktifOturumlar.length,
        maxOturum: politika.maxOturum,
        tokenTtlMs: politika.tokenTtlDk * 60000,
        nonceReplay: true,
        yeniCihaz2fa: politika.yeniCihaz2fa,
        supheliKonumAskiya: politika.supheliKonumAskiya,
      }),
    [p.ikiAdimli, aktifOturumlar.length, politika],
  );

  // Huni her zaman gerçek issued/verified'a dayanır (politikadan bağımsız).
  const yd = p.yasamDongusu;

  const skorRenk = (s: number) => (s >= 90 ? "#16a34a" : s >= 70 ? "#2f6fed" : s >= 45 ? "#d97706" : "#dc2626");

  /* --- oturum sonlandırma (kalıcı) --- */
  function kapaliKaydet(kapali: string[]) {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(OTURUM_KEY, JSON.stringify(kapali)); } catch { /* yok */ }
  }
  function oturumSonlandir(id: string) {
    setOturumlar((eski) => {
      const yeni = eski.map((o) => (o.id === id ? { ...o, aktif: false } : o));
      kapaliKaydet(yeni.filter((o) => !o.aktif).map((o) => o.id));
      return yeni;
    });
    goster({ tip: "basari", baslik: t("og.toast.tekSonlandir") });
  }
  function tumDigerleriniSonlandir() {
    setOturumlar((eski) => {
      const yeni = eski.map((o) => (o.buCihaz ? o : { ...o, aktif: false }));
      kapaliKaydet(yeni.filter((o) => !o.aktif).map((o) => o.id));
      return yeni;
    });
    goster({ tip: "basari", baslik: t("og.toast.tumSonlandir") });
  }

  // Token yapısı kod bloğu — yorumlar çeviriyle üretilir; teknik terimler sabit.
  const tokenYapisi = `// Specter ${t("og.kod.baslik")}
//   ${t("og.kod.yapi")}  base64url(payload) + "." + base64url(sig)
payload = {
  cid:   "chl_a91f…",   // ${t("og.kod.cid")}
  seed:  3418872051,     // ${t("og.kod.seed")}
  len:   6,              // ${t("og.kod.len")}
  site:  "pk_live_…",    // ${t("og.kod.site")}
  iat:   ${t("og.kod.verildiMs")},  // ${t("og.kod.iat")}
  exp:   iat + ${politika.tokenTtlDk} * 60_000,  // ${t("og.kod.exp").replace("{ttl}", String(politika.tokenTtlDk))}
  nonce: "b7Kd…"         // ${t("og.kod.nonce")}
}
sig = HMAC_SHA256(secretKey, base64url(payload))

// ${t("og.kod.dogrulamada")}
//   1) ${t("og.kod.adim1")}
//   2) ${t("og.kod.adim2")}
//   3) ${t("og.kod.adim3")}
//   4) ${t("og.kod.adim4")}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <LockKeyhole className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("og.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("og.giris.metin")}</p>
        </div>
      </div>

      {/* özet istatistikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={`%${durus.skor}`} etiket={t("og.ozet.durusSkor")} ikon={<ShieldCheck className="size-5" />} tone={durus.skor >= 80 ? "ok" : durus.skor >= 45 ? "warn" : "danger"} />
        <StatKart sayi={aktifOturumlar.length} etiket={t("og.ozet.aktifOturum")} ikon={<Monitor className="size-5" />} tone="brand" />
        <StatKart sayi={yd.verilen.toLocaleString("tr-TR")} etiket={t("og.ozet.verilenToken")} ikon={<KeyRound className="size-5" />} />
        <StatKart sayi={yd.replayEngellenen.toLocaleString("tr-TR")} etiket={t("og.ozet.replayEngellendi")} ikon={<Ban className="size-5" />} tone="ok" />
      </div>

      {/* ===================== Güvenlik duruşu ===================== */}
      <Panel baslik={t("og.durus.baslik")}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          {/* skor halkası */}
          <div className="flex items-center gap-4 rounded-2xl bg-canvas/50 p-5 lg:w-72 lg:shrink-0">
            <DuvarSkor skor={durus.skor} renk={skorRenk(durus.skor)} />
            <div>
              <div className="text-[13px] font-semibold text-slate-ink">
                {t(SEVIYE_ANAHTAR[durus.seviye])} {t("og.durus.seviyeSonek")}
              </div>
              <div className="text-[12.5px] text-slate-muted">
                {t("og.durus.kontrolSayisi").replace("{gecen}", String(durus.gecen)).replace("{toplam}", String(durus.toplam))}
              </div>
            </div>
          </div>
          {/* kontrol listesi */}
          <div className="flex-1 space-y-2">
            {durus.kontroller.map((k) => (
              <div key={k.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg", k.gecti ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2")}>
                  {k.gecti ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-slate-ink">{kontrolAd(t, k)}</span>
                    <span className="text-[11px] text-slate-faint">{t("og.durus.puan").replace("{n}", String(k.agirlik))}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-slate-muted">
                    {k.gecti ? kontrolAciklama(t, k, politika.maxOturum) : kontrolOneri(t, k, onerilenTtlDk)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* ===================== Aktif oturumlar ===================== */}
      <Panel
        baslik={t("og.oturum.baslik")}
        sagUst={
          aktifOturumlar.length > 1 && (
            <Button variant="outline" size="sm" onClick={tumDigerleriniSonlandir}>
              <RefreshCw className="size-4" /> {t("og.oturum.tumDigerleri")}
            </Button>
          )
        }
        padding={false}
      >
        <div className="divide-y divide-line">
          {oturumlar.map((o) => {
            const riskGirdi: OturumRiskGirdi = { buCihaz: o.buCihaz, yasMs: o.yasGun * 86400000, bilinenKonum: o.bilinenKonum, bilinenCihaz: o.bilinenCihaz };
            const risk = oturumRiski(riskGirdi);
            const rm = RISK_META[risk.risk];
            const nedenler = riskNedenleri(t, riskGirdi);
            const Ikon = o.tur === "mobil" ? Smartphone : o.tur === "sunucu" ? Server : Monitor;
            return (
              <div key={o.id} className={cn("flex items-center justify-between px-6 py-4 transition", !o.aktif && "opacity-45")}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-slate-muted">
                    <Ikon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-ink">
                      {o.cihaz} · {o.tarayici}
                      {o.buCihaz && <Badge ton="yesil">{t("og.oturum.buCihaz")}</Badge>}
                      {!o.aktif ? <Badge ton="gri">{t("og.oturum.sonlandirildi")}</Badge> : <Badge ton={rm.ton}>{t(rm.anahtar)}</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-faint">
                      <span className="inline-flex items-center gap-1"><Ulke kod={o.kod} /> {o.konum}</span>
                      <span>· {o.os}</span>
                      <span className="num">· {o.ip}</span>
                      <span>· {tZaman(o.sonAktifAnahtar)}</span>
                    </div>
                    {o.aktif && !o.buCihaz && risk.risk !== "dusuk" && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-amber-700">
                        <AlertTriangle className="size-3.5" /> {nedenler.join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
                {o.aktif && !o.buCihaz && (
                  <button
                    onClick={() => oturumSonlandir(o.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-danger2 transition hover:bg-danger-soft"
                  >
                    <X className="size-3.5" /> {t("og.oturum.sonlandir")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-3.5 text-[12.5px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span dangerouslySetInnerHTML={{ __html: t("og.durustluk") }} />
      </div>

      {/* ===================== Token yaşam döngüsü ===================== */}
      <Panel baslik={t("og.token.baslik")}>
        {/* huni */}
        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          {yd.huni.map((h, i) => {
            const renk = h.asama === "dogrulandi" ? "#16a34a" : h.asama === "verildi" ? "#2f6fed" : h.asama === "replay_engellendi" ? "#dc2626" : "#d97706";
            return (
              <div key={h.asama} className="relative rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg text-white" style={{ background: renk }}>
                    {h.asama === "verildi" ? <KeyRound className="size-4" /> : h.asama === "dogrulandi" ? <Check className="size-4" /> : h.asama === "sure_doldu" ? <Clock className="size-4" /> : <Repeat className="size-4" />}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-ink">{i + 1}. {huniAd(t, h)}</span>
                </div>
                <div className="num mt-2 text-[24px] font-bold leading-none" style={{ color: renk }}>{h.adet.toLocaleString("tr-TR")}</div>
                <div className="mt-1 text-[11px] text-slate-faint">{t("og.token.oran").replace("{oran}", (h.oran * 100).toFixed(1))}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(2, h.oran * 100)}%`, background: renk }} />
                </div>
                <p className="mt-2 text-[11.5px] leading-snug text-slate-muted">{huniAciklama(t, h)}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl bg-canvas/50 p-4">
          <div>
            <div className="text-[12px] text-slate-faint">{t("og.token.basariOrani")}</div>
            <div className="num text-[22px] font-bold text-slate-ink">%{(yd.basariOrani * 100).toFixed(1)}</div>
          </div>
          <div className="h-9 w-px bg-line" />
          <div className="flex items-center gap-2 text-[12.5px] text-slate-muted">
            <ShieldCheck className="size-4 text-brand-600" />
            {t("og.token.hmacNot").replace("{ttl}", String(politika.tokenTtlDk))}
          </div>
        </div>

        <KodBlok baslik={t("og.token.kodBaslik")} dil="ts" kod={tokenYapisi} maxH="max-h-[520px]" />
      </Panel>

      {/* ===================== Replay / nonce koruması ===================== */}
      <Panel baslik={t("og.replay.baslik")}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <DurumRozeti ton="ok" etiket={t("og.replay.etkin")} nabiz />
              <span className="text-[13px] font-semibold text-slate-ink">{t("og.replay.nonce.baslik")}</span>
            </div>
            <p className="mt-2 text-[12.5px] text-slate-muted">
              {t("og.replay.nonce.metin1")} <span className="font-mono text-slate-ink">nonce</span> {t("og.replay.nonce.metin2")}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <DurumRozeti ton="ok" etiket={t("og.replay.etkin")} />
              <span className="text-[13px] font-semibold text-slate-ink">{t("og.replay.ttl.baslik")}</span>
            </div>
            <p className="mt-2 text-[12.5px] text-slate-muted">
              {t("og.replay.ttl.metin1")}{" "}
              <span className="font-mono text-slate-ink">{t("og.replay.ttl.dk").replace("{n}", String(Math.round(p.noncePencereMs / 60000)))}</span>
              {t("og.replay.ttl.metin2") ? ` ${t("og.replay.ttl.metin2")}` : ""}
              {" "}(<span className="font-mono text-slate-ink">iat → exp</span>). {t("og.replay.ttl.metin3")}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-ink">{t("og.replay.engellenen.baslik")}</span>
              <Ban className="size-4 text-danger2" />
            </div>
            <div className="num mt-2 text-[26px] font-bold text-danger2">{yd.replayEngellenen.toLocaleString("tr-TR")}</div>
            <p className="mt-1 text-[11.5px] text-slate-faint">{t("og.replay.engellenen.not")}</p>
          </div>
        </div>
      </Panel>

      {/* ===================== Oturum politikası ===================== */}
      <Panel baslik={t("og.politika.baslik")}>
        <div className="space-y-1">
          {/* max eşzamanlı oturum */}
          <PolitikaSatir
            ikon={<Monitor className="size-4.5" />}
            baslik={t("og.politika.maxOturum.baslik")}
            aciklama={t("og.politika.maxOturum.aciklama")}
          >
            <div className="flex items-center gap-2">
              <input
                type="range" min={1} max={10} value={politika.maxOturum}
                onChange={(e) => setPolitika((s) => ({ ...s, maxOturum: Number(e.target.value) }))}
                className="w-40 accent-brand-600"
              />
              <span className="num w-8 text-right text-[14px] font-semibold text-slate-ink">{politika.maxOturum}</span>
            </div>
          </PolitikaSatir>

          {/* token TTL */}
          <PolitikaSatir
            ikon={<Clock className="size-4.5" />}
            baslik={t("og.politika.ttl.baslik")}
            aciklama={t("og.politika.ttl.aciklama")}
          >
            <div className="flex items-center gap-1.5">
              {[2, 5, 10, 15].map((dk) => (
                <button
                  key={dk}
                  onClick={() => setPolitika((s) => ({ ...s, tokenTtlDk: dk }))}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                    politika.tokenTtlDk === dk ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-line",
                  )}
                >
                  {t("og.politika.ttl.dk").replace("{n}", String(dk))}
                </button>
              ))}
            </div>
          </PolitikaSatir>

          {/* yeni cihazda 2FA */}
          <PolitikaSatir
            ikon={<KeyRound className="size-4.5" />}
            baslik={t("og.politika.yeniCihaz.baslik")}
            aciklama={t("og.politika.yeniCihaz.aciklama")}
          >
            <Toggle on={politika.yeniCihaz2fa} onChange={(v) => setPolitika((s) => ({ ...s, yeniCihaz2fa: v }))} />
          </PolitikaSatir>

          {/* şüpheli konum */}
          <PolitikaSatir
            ikon={<MapPin className="size-4.5" />}
            baslik={t("og.politika.supheliKonum.baslik")}
            aciklama={t("og.politika.supheliKonum.aciklama")}
          >
            <Toggle on={politika.supheliKonumAskiya} onChange={(v) => setPolitika((s) => ({ ...s, supheliKonumAskiya: v }))} />
          </PolitikaSatir>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-faint">
          <Info className="size-3.5" /> {t("og.politika.not")}
        </p>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ skor halkası */
function DuvarSkor({ skor, renk }: { skor: number; renk: string }) {
  const cevre = 2 * Math.PI * 30;
  const dolu = (skor / 100) * cevre;
  return (
    <div className="relative grid size-20 shrink-0 place-items-center">
      <svg viewBox="0 0 72 72" className="size-20 -rotate-90">
        <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="7" className="text-line" />
        <circle cx="36" cy="36" r="30" fill="none" stroke={renk} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dolu} ${cevre}`} />
      </svg>
      <span className="num absolute text-[19px] font-bold" style={{ color: renk }}>{skor}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ politika satırı */
function PolitikaSatir({
  ikon, baslik, aciklama, children,
}: {
  ikon: React.ReactNode;
  baslik: string;
  aciklama: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-slate-muted">{ikon}</span>
        <div>
          <div className="text-[13.5px] font-medium text-slate-ink">{baslik}</div>
          <div className="text-[12.5px] text-slate-muted">{aciklama}</div>
        </div>
      </div>
      <div className="shrink-0 pl-12 sm:pl-0">{children}</div>
    </div>
  );
}
