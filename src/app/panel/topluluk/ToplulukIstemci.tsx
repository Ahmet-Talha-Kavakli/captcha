"use client";

/**
 * Topluluk İstihbaratı — istemci konsolu (kolektif savunma).
 * ==========================================================
 * Ağ-etkisi savunma yüzeyi: gözlemlediğin kötü IOC'leri anonim olarak
 * topluluğa katkılar, karşılığında toplu istihbaratı tüketirsin.
 *
 * BÖLÜMLER
 *   1. Ağ özeti        — katkı, doğrulanmış tehdit, besleme boyutu, katkı puanı.
 *   2. Katkılarım       — gerçek IOC tablosu + IOC-başına & global paylaşım anahtarı.
 *   3. Topluluk istihbaratı — temsili topluluk beslemesi (sende olmayanlar dahil, proaktif).
 *   4. Doğrulanmış tehditler — hem sende hem toplulukta işaretli (daha hızlı aksiyon).
 *   5. Karşılıklılık     — give-get ağ-etkisi değer çerçevesi.
 *   6. Gizlilik & ayarlar — ne paylaşılıyor (anonim, IOC-yalnız), opt-in, dürüst ifşa.
 *
 * KALICILIK: Paylaşım tercihleri + paylaşılan IOC listesi localStorage'da
 * ("specter_topluluk"). SSR-güvenli: window/localStorage yalnızca effect/handler
 * içinde typeof kontrolüyle kullanılır.
 *
 * DÜRÜSTLÜK: Senin katkıların GERÇEK (gözlemlerinden). Topluluk toplamı
 * TEMSİLİ — deterministik olarak IOC hash'inden sentezlenir; gerçek başka
 * müşteri iddiası yoktur ("Specter topluluk ağı — temsili").
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Share2, ShieldCheck, Network, Radar, Lock, Info, Check, X,
  Globe, Fingerprint, Server, ArrowRight, Sparkles, Award,
  ShieldAlert, PlusCircle, Radio, HandHeart, EyeOff, CheckCircle2,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, NotKutusu, Ilerleme, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  toplulukZenginlestir, toplulukOzet, karsilastir, karsiliklilik,
  DOGRULAMA_ESIGI, TOPLULUK_DUGUM_SAYISI,
  type KendiKatki, type IocTur, type ToplulukKategori,
} from "@/lib/specter/topluluk";
import type { Dil } from "@/lib/i18n/panel";
import { toplulukCeviri } from "./topluluk.i18n";

/* ------------------------------------------------------------------ Kalıcılık */

const DEPO_ANAHTAR = "specter_topluluk";
const DEPO_SURUM = 1;

/** localStorage'da tutulan tam durum. */
interface DepoDurum {
  /** Global topluluğa-katkı anahtarı (ana opt-in). */
  paylasimAcik: boolean;
  /** IOC-başına paylaşım kararı: iocId → true (paylaş). Yoksa global karar geçerli. */
  iocPaylasim: Record<string, boolean>;
  /** Otomatik: yeni gözlemlenen IOC'ler de otomatik paylaşılsın mı. */
  otomatikPaylas: boolean;
  v: number;
}

function varsayilanDepo(): DepoDurum {
  return { paylasimAcik: true, iocPaylasim: {}, otomatikPaylas: true, v: DEPO_SURUM };
}

/* ------------------------------------------------------------------ Küçük yardımcılar */

/** Dil → BCP-47 yerel ayarı (sayı/tarih biçimlemesi için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** epoch ms → yerelleştirilmiş kısa tarih ("12 Tem 2026" vb.). */
function tarihStr(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleDateString(YEREL[dil], { day: "numeric", month: "short", year: "numeric" });
}

/** IOC türüne göre ikon. */
function TurIkon({ tur, className }: { tur: IocTur; className?: string }) {
  if (tur === "ip") return <Globe className={className} />;
  if (tur === "asn") return <Server className={className} />;
  return <Fingerprint className={className} />;
}

/** Kategori rozeti tonu. */
function kategoriTon(k: ToplulukKategori): "kirmizi" | "sari" | "mavi" | "gri" {
  if (k === "botnet" || k === "ddos" || k === "credential_stuffing") return "kirmizi";
  if (k === "scanner" || k === "scraper") return "sari";
  if (k === "proxy_abuse") return "mavi";
  return "gri";
}

/** Güven yüzdesi rengi. */
function guvenRenk(g: number): string {
  if (g >= 0.85) return "#dc2626";
  if (g >= 0.6) return "#d97706";
  return "#64748b";
}

/** Basit anahtar (toggle) bileşeni. */
function Anahtar({ acik, degistir, etiket }: { acik: boolean; degistir: () => void; etiket?: string }) {
  return (
    <button
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      onClick={degistir}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        acik ? "bg-brand-600" : "bg-slate-300",
      )}
    >
      <span className={cn("inline-block size-4.5 translate-x-0.5 rounded-full bg-white shadow transition-transform", acik && "translate-x-[22px]")} />
    </button>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */

export function ToplulukIstemci({ dil, katkilar, kullaniciAdi }: { dil: Dil; katkilar: KendiKatki[]; kullaniciAdi: string }) {
  const t = (k: string) => toplulukCeviri(k, dil);
  const { goster } = useToast();
  const [depo, setDepo] = useState<DepoDurum>(varsayilanDepo);
  const [yuklendi, setYuklendi] = useState(false);
  const [turFiltre, setTurFiltre] = useState<IocTur | "hepsi">("hepsi");

  // localStorage yükle (yalnızca istemci).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(DEPO_ANAHTAR);
      if (ham) {
        const p = JSON.parse(ham) as DepoDurum;
        if (p && p.v === DEPO_SURUM) setDepo({ ...varsayilanDepo(), ...p });
      }
    } catch {
      /* bozuk kayıt → varsayılan */
    }
    setYuklendi(true);
  }, []);

  // Kaydet (yüklendikten sonra).
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(depo));
    } catch {
      /* kota/erişim hatası → yoksay */
    }
  }, [depo, yuklendi]);

  /** Bir IOC şu an paylaşılıyor mu (IOC kararı > global karar). */
  const paylasiliyorMu = useCallback(
    (id: string) => {
      if (id in depo.iocPaylasim) return depo.iocPaylasim[id];
      return depo.paylasimAcik;
    },
    [depo],
  );

  /** Paylaşılan IOC id kümesi (karşılıklılık için). */
  const paylasilanSet = useMemo(() => {
    const s = new Set<string>();
    for (const k of katkilar) if (paylasiliyorMu(k.id)) s.add(k.id);
    return s;
  }, [katkilar, paylasiliyorMu]);

  // Deterministik türetmeler (topluluk.ts).
  const ozet = useMemo(() => toplulukOzet(katkilar), [katkilar]);
  const kars = useMemo(() => karsilastir(katkilar), [katkilar]);
  const kar = useMemo(() => karsiliklilik(katkilar, paylasilanSet), [katkilar, paylasilanSet]);

  // Katkıları topluluk verisiyle zenginleştir (tablo + doğrulanmışlar).
  const zengin = useMemo(
    () => katkilar.map((k) => ({ ...k, topluluk: toplulukZenginlestir(k.tur, k.deger, { sendeGozlem: k.gozlem }) })),
    [katkilar],
  );
  const dogrulanmis = useMemo(() => zengin.filter((z) => z.topluluk.dogrulandi), [zengin]);

  const filtreliKatki = useMemo(
    () => (turFiltre === "hepsi" ? zengin : zengin.filter((z) => z.tur === turFiltre)),
    [zengin, turFiltre],
  );

  const paylasilanSayi = paylasilanSet.size;

  /* --- Aksiyonlar --- */

  function globalDegistir() {
    setDepo((d) => {
      const yeni = !d.paylasimAcik;
      // Global değişince IOC-başına istisnaları temizle (net davranış).
      goster({
        tip: yeni ? "basari" : "bilgi",
        baslik: yeni ? t("toast.acikBaslik") : t("toast.kapaliBaslik"),
        aciklama: yeni ? t("toast.acikAciklama") : t("toast.kapaliAciklama"),
      });
      return { ...d, paylasimAcik: yeni, iocPaylasim: {} };
    });
  }

  function iocDegistir(id: string) {
    setDepo((d) => {
      const suan = id in d.iocPaylasim ? d.iocPaylasim[id] : d.paylasimAcik;
      return { ...d, iocPaylasim: { ...d.iocPaylasim, [id]: !suan } };
    });
  }

  function hepsiniPaylas() {
    setDepo((d) => {
      const yeni: Record<string, boolean> = {};
      for (const k of katkilar) yeni[k.id] = true;
      return { ...d, paylasimAcik: true, iocPaylasim: yeni };
    });
    goster({ tip: "basari", baslik: t("toast.tumuBaslik"), aciklama: t("toast.tumuAciklama").replace("{n}", String(katkilar.length)) });
  }

  function proaktifEngelle(deger: string) {
    // Gerçek kural yazımı Kurallar modülünde; burada niyet + geri bildirim.
    goster({
      tip: "basari",
      baslik: t("toast.engelleBaslik"),
      aciklama: t("toast.engelleAciklama").replace("{deger}", deger),
    });
  }

  const kademeRenk =
    ozet.kademe === "Platin" ? "#6366f1" : ozet.kademe === "Altın" ? "#d97706" : ozet.kademe === "Gümüş" ? "#64748b" : "#a16207";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Network className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama")}
          </p>
        </div>
      </div>

      {/* 1. Ağ özeti */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.katkiSayisi} etiket={t("kart.katkiIoc")} ikon={<Share2 className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.dogrulanmisSayisi} etiket={t("kart.dogrulanmis")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={kars.bosluklar.length} etiket={t("kart.proaktif")} ikon={<Radar className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.katkiPuani} etiket={`${t("kart.katkiPuani")} · ${t(`kademe.${ozet.kademe}`)}`} ikon={<Award className="size-5" />} />
      </div>

      {/* Temsili ağ durumu şeridi */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Radio className="size-5" /></span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-ink">{t("ag.ad")}</span>
              <Badge ton="gri">{t("ag.temsili")}</Badge>
            </div>
            <p className="text-[13px] text-slate-muted">
              <span className="num font-semibold text-slate-ink">{TOPLULUK_DUGUM_SAYISI.toLocaleString(YEREL[dil])}</span> {t("ag.dugum")} ·{" "}
              <span className="num font-semibold text-slate-ink">{ozet.toplulukBeslemeBoyutu.toLocaleString(YEREL[dil])}</span> {t("ag.havuz")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset" style={{ color: kademeRenk, background: `${kademeRenk}14`, borderColor: kademeRenk }}>
            <Award className="mr-1 inline size-3.5" /> {t(`kademe.${ozet.kademe}`)} {t("ag.katkici")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-slate-muted">{t("ag.katki")}</span>
            <Anahtar acik={depo.paylasimAcik} degistir={globalDegistir} etiket={t("ag.katki")} />
          </div>
        </div>
      </div>

      {/* 2. Katkılarım */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Share2 className="size-4 text-brand-600" /> {t("katki.baslik")}
            <Badge ton="yesil">{t("katki.gercekVerin")}</Badge>
          </span>
        }
        sagUst={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full bg-canvas p-1 sm:flex">
              {(["hepsi", "ip", "asn", "fingerprint"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTurFiltre(tf)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition",
                    turFiltre === tf ? "bg-surface text-slate-ink shadow-sm" : "text-slate-muted hover:text-slate-ink",
                  )}
                >
                  {tf === "hepsi" ? t("katki.hepsi") : tf === "fingerprint" ? t("katki.parmakIzi") : tf.toUpperCase()}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={hepsiniPaylas}>
              <Share2 className="size-4" /> {t("katki.tumunuPaylas")}
            </Button>
          </div>
        }
      >
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-canvas/50 px-3.5 py-2.5 text-[12.5px] text-slate-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
          <span>
            {t("katki.anonimNot.1")} <b>{t("katki.anonimNot.2")}</b> {t("katki.anonimNot.3")}{" "}
            <b className="num">{paylasilanSayi}</b> / {katkilar.length} {t("katki.anonimNot.4")}
          </span>
        </div>

        {katkilar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-12 text-center">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ShieldCheck className="size-6" /></span>
            <p className="text-[15px] font-semibold text-slate-ink">{t("katki.bosBaslik")}</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-muted">
              {t("katki.bosAciklama")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40 text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  <th className="px-4 py-3">{t("katki.th.gosterge")}</th>
                  <th className="px-4 py-3">{t("katki.th.tur")}</th>
                  <th className="px-4 py-3 text-right">{t("katki.th.gozlem")}</th>
                  <th className="px-4 py-3">{t("katki.th.tehdit")}</th>
                  <th className="px-4 py-3">{t("katki.th.guven")}</th>
                  <th className="px-4 py-3">{t("katki.th.topluluk")}</th>
                  <th className="px-4 py-3 text-center">{t("katki.th.paylas")}</th>
                </tr>
              </thead>
              <tbody>
                {filtreliKatki.map((z) => (
                  <tr key={z.id} className="border-b border-line last:border-0 transition hover:bg-canvas/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-canvas text-slate-muted"><TurIkon tur={z.tur} className="size-3.5" /></span>
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[12.5px] font-medium text-slate-ink">{z.deger}</div>
                          <div className="text-[11px] text-slate-faint">{z.etiket}{z.ulke ? "" : ""}</div>
                        </div>
                        {z.tur === "ip" && z.ulke && <Ulke kod={z.ulke} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-muted">{t(`tur.${z.tur}`)}</td>
                    <td className="px-4 py-3 text-right num font-medium text-slate-ink">{z.gozlem.toLocaleString(YEREL[dil])}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full" style={{ width: `${z.tehditSkoru}%`, background: guvenRenk(z.tehditSkoru / 100) }} />
                        </div>
                        <span className="num text-[12px] text-slate-muted">{z.tehditSkoru}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="num text-[13px] font-semibold" style={{ color: guvenRenk(z.onerilenGuven) }}>%{Math.round(z.onerilenGuven * 100)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {z.topluluk.dogrulandi ? (
                        <Badge ton="kirmizi"><ShieldAlert className="size-3" /> {z.topluluk.dugumSayisi} {t("katki.dugum")}</Badge>
                      ) : (
                        <span className="text-[12px] text-slate-faint">{t("katki.yalnizSende")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Anahtar acik={paylasiliyorMu(z.id)} degistir={() => iocDegistir(z.id)} etiket={t("katki.paylasAria").replace("{deger}", z.deger)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 3. Topluluk istihbaratı (temsili besleme) */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Globe className="size-4 text-brand-600" /> {t("besleme.baslik")}
            <Badge ton="gri">{t("besleme.rozet")}</Badge>
          </span>
        }
      >
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-warn-soft px-3.5 py-2.5 text-[12.5px] text-amber-800">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t("besleme.uyari")}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kars.havuz.slice(0, 12).map((h) => (
            <div
              key={h.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                h.sendeVar ? "border-line bg-surface" : "border-amber-200 bg-warn-soft/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-slate-muted"><TurIkon tur={h.tur} className="size-4" /></span>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[12.5px] font-semibold text-slate-ink">{h.deger}</div>
                    <div className="text-[11px] text-slate-faint">{h.etiket}</div>
                  </div>
                </div>
                {h.sendeVar ? (
                  <Badge ton="yesil"><Check className="size-3" /> {t("besleme.sendeVar")}</Badge>
                ) : (
                  <Badge ton="sari">{t("besleme.yeni")}</Badge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge ton={kategoriTon(h.topluluk.kategori)}>{t(`kategori.${h.topluluk.kategori}`)}</Badge>
                <span className="num text-[11px] text-slate-faint">{h.topluluk.dugumSayisi} {t("besleme.dugum")}</span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-muted">
                  <span>{t("besleme.kureselGuven")}</span>
                  <span className="num font-semibold" style={{ color: guvenRenk(h.topluluk.toplulukGuven) }}>%{Math.round(h.topluluk.toplulukGuven * 100)}</span>
                </div>
                <Ilerleme deger={h.topluluk.toplulukGuven * 100} ton={h.topluluk.toplulukGuven >= 0.85 ? "danger" : "warn"} />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-slate-faint">
                <span>{t("besleme.ilkGorulme").replace("{tarih}", tarihStr(h.topluluk.kureselIlkGorulme, dil))}</span>
                {!h.sendeVar && (
                  <button onClick={() => proaktifEngelle(h.deger)} className="flex items-center gap-1 font-medium text-brand-700 transition hover:text-brand-800">
                    <PlusCircle className="size-3.5" /> {t("besleme.engelle")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Topluluk-doğrulanmış tehditler */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-ok" /> {t("dogru.baslik")}
          </span>
        }
      >
        <p className="mb-3 text-[13px] text-slate-muted">
          {t("dogru.aciklama")}
        </p>
        {dogrulanmis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-10 text-center text-[13px] text-slate-muted">
            {t("dogru.bos")}
          </div>
        ) : (
          <div className="space-y-2">
            {dogrulanmis.slice(0, 8).map((z) => (
              <div key={z.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="grid size-8 place-items-center rounded-lg bg-ok-soft text-ok"><CheckCircle2 className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] font-semibold text-slate-ink">{z.deger}</span>
                    <Badge ton={kategoriTon(z.topluluk.kategori)}>{t(`kategori.${z.topluluk.kategori}`)}</Badge>
                    {z.tur === "ip" && z.ulke && <Ulke kod={z.ulke} />}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-slate-faint">
                    {t("dogru.satir")
                      .replace("{gozlem}", String(z.gozlem))
                      .replace("{dugum}", String(z.topluluk.dugumSayisi))
                      .replace("{tur}", t(`tur.${z.tur}`))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="num text-[15px] font-bold" style={{ color: guvenRenk(z.topluluk.toplulukGuven) }}>%{Math.round(z.topluluk.toplulukGuven * 100)}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-faint">{t("dogru.birlesikGuven")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 5. Karşılıklılık (give-get) */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <HandHeart className="size-4 text-brand-600" /> {t("kar.baslik")}
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          {/* Verilen */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Share2 className="size-4 text-brand-600" /> {t("kar.katkiliyorsun")}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="num text-[38px] font-bold leading-none text-slate-ink">{kar.verilen}</span>
              <span className="text-[13px] text-slate-muted">{t("kar.iocPaylasimda")}</span>
            </div>
            <p className="mt-2 text-[12px] text-slate-faint">
              {t("kar.verilenAciklama")}
            </p>
          </div>

          {/* Ok */}
          <div className="flex items-center justify-center">
            <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <ArrowRight className="size-6" />
            </span>
          </div>

          {/* Kazanılan */}
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Radar className="size-4 text-brand-600" /> {t("kar.kazaniyorsun")}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="num text-[38px] font-bold leading-none text-brand-700">{kar.kazanilan}</span>
              <span className="text-[13px] text-slate-muted">{t("kar.proaktifEngelleme")}</span>
            </div>
            <p className="mt-2 text-[12px] text-slate-faint">
              {t("kar.kazanilanAciklama")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="num text-[22px] font-bold text-slate-ink">{kar.dogrulanan}</div>
            <div className="text-[12px] text-slate-muted">{t("kar.dogrulanan")}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="num text-[22px] font-bold text-slate-ink">{kar.agEtkisiOrani}×</div>
            <div className="text-[12px] text-slate-muted">{t("kar.kaldirac")}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="num text-[22px] font-bold text-slate-ink">{ozet.katkiPuani}</div>
            <div className="text-[12px] text-slate-muted">{t("kar.katkiPuani")}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-[22px] font-bold" style={{ color: kademeRenk }}>{t(`kademe.${ozet.kademe}`)}</div>
            <div className="text-[12px] text-slate-muted">{t("kar.kademe")}</div>
          </div>
        </div>

        <NotKutusu ton="bilgi" baslik={t("kar.notBaslik")}>
          {t("kar.not.1")} <b>{kullaniciAdi}</b> {t("kar.not.2")}
        </NotKutusu>
      </Panel>

      {/* 6. Gizlilik & ayarlar */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Lock className="size-4 text-slate-muted" /> {t("giz.baslik")}
          </span>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2 text-[14px] font-medium text-slate-ink">
                  <Share2 className="size-4 text-brand-600" /> {t("giz.katkiBaslik")}
                </div>
                <p className="mt-1 text-[12.5px] text-slate-muted">{t("giz.katkiAciklama")}</p>
              </div>
              <Anahtar acik={depo.paylasimAcik} degistir={globalDegistir} etiket={t("giz.katkiBaslik")} />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2 text-[14px] font-medium text-slate-ink">
                  <Sparkles className="size-4 text-brand-600" /> {t("giz.otomatikBaslik")}
                </div>
                <p className="mt-1 text-[12.5px] text-slate-muted">{t("giz.otomatikAciklama")}</p>
              </div>
              <Anahtar acik={depo.otomatikPaylas} degistir={() => setDepo((d) => ({ ...d, otomatikPaylas: !d.otomatikPaylas }))} etiket={t("giz.otomatikBaslik")} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-slate-ink">
              <EyeOff className="size-4 text-slate-muted" /> {t("giz.neBaslik")}
            </div>
            <ul className="space-y-2 text-[12.5px]">
              <li className="flex items-start gap-2 text-slate-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" /> {t("giz.evet.1")}</li>
              <li className="flex items-start gap-2 text-slate-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" /> {t("giz.evet.2")}</li>
              <li className="flex items-start gap-2 text-slate-muted"><X className="mt-0.5 size-3.5 shrink-0 text-danger2" /> {t("giz.hayir.1")}</li>
              <li className="flex items-start gap-2 text-slate-muted"><X className="mt-0.5 size-3.5 shrink-0 text-danger2" /> {t("giz.hayir.2")}</li>
              <li className="flex items-start gap-2 text-slate-muted"><X className="mt-0.5 size-3.5 shrink-0 text-danger2" /> {t("giz.hayir.3")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[12.5px] text-slate-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            <b>{t("giz.ifsaBaslik")}</b> {t("giz.ifsa")}
          </span>
        </div>
      </Panel>
    </div>
  );
}
