"use client";

/**
 * Veri Saklama & KVKK/GDPR Silme Otomasyonu — istemci konsolu.
 * ===========================================================
 * Bir gizlilik-operasyonları konsolu (OneTrust benzeri):
 *   1. Saklama politikaları — kategori-başına saklama süresi + eylem (sil/anonimleştir),
 *      gerçek kayıt sayısı ve "kaç kayıt süreyi aştı" (canlı).
 *   2. Silme takvimi — yaklaşan otomatik silme/anonimleştirme çalışmaları.
 *   3. Veri-konusu talebi (DSR) — silme/erişim talebi kuyruğu, KVKK 30-gün SLA sayacı,
 *      yaşam döngüsü aksiyonları (işleme al / tamamla / reddet).
 *   4. Anonimleştirme önizlemesi — IP maskeleme + tanımlayıcı hash before/after.
 *   5. Uyum özeti — karşılanan KVKK/GDPR maddeleri.
 *
 * KALICILIK: Saklama politikaları ve DSR kuyruğu localStorage'da tutulur
 * ("specter_veri_saklama"). Bu, bir ayar/talep yüzeyi için dürüst bir yaklaşımdır.
 * SSR-güvenli: window/localStorage yalnızca effect/handler içinde, typeof
 * kontrolüyle kullanılır. Gerçek silme işleri SUNUCUDA zamanlanmış koşar.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DatabaseZap, Trash2, Check, Clock, CalendarClock,
  UserRoundX, Send, Info, Lock, Sparkles, RotateCcw, ArrowRight, Ban, PlayCircle,
} from "lucide-react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { Panel, StatKart, Badge, NotKutusu, useToast, Girdi, Secim, Alan2 } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { DonutDagilim } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { vsCeviri } from "./veri-saklama.i18n";
import {
  VERI_KATEGORILERI, silmeTahmini,
  ipAnonimlestir, tanimlayiciHashle, dsrOlustur, dsrIsle, dsrSla,
  sonrakiCalisma, KVKK_SLA_GUN,
  type DsrTalep, type DsrTur, type DsrDurum,
} from "@/lib/specter/veri-saklama";

/** dil → BCP-47 (sayı/tarih biçimlemesi için). */
const YEREL: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/* ------------------------------------------------------------------ Tipler */

interface AyakIzi { adet: number; enEskiGun: number }

/** localStorage'da tutulan tam durum. */
interface DepoDurum {
  /** kategori key → { gun, eylem, otomatik } */
  politikalar: Record<string, { gun: number; eylem: "sil" | "anonimlestir"; otomatik: boolean }>;
  /** DSR talep kuyruğu. */
  talepler: DsrTalep[];
  v: number;
}

const DEPO_ANAHTAR = "specter_veri_saklama";
const DEPO_SURUM = 1;

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

/** Varsayılan politika haritası (kategori kataloğundan türetilir). */
function varsayilanPolitikalar(): DepoDurum["politikalar"] {
  const p: DepoDurum["politikalar"] = {};
  for (const k of VERI_KATEGORILERI) {
    p[k.key] = { gun: k.varsayilanGun, eylem: k.varsayilanEylem, otomatik: true };
  }
  return p;
}

/** epoch ms → "12 Tem 2026" biçimi (yerelleştirilmiş, deterministik gösterim). */
function tarihStr(ts: number, yerel: string): string {
  return new Date(ts).toLocaleDateString(yerel, { day: "numeric", month: "short", year: "numeric" });
}

/* ------------------------------------------------------------------ Ana bileşen */

export function VeriSaklamaIstemci({
  dil,
  bugun,
  ayakIzi,
  olayTsler,
  ornekIpler,
}: {
  dil: Dil;
  bugun: number;
  ayakIzi: Record<string, AyakIzi>;
  olayTsler: number[];
  ornekIpler: string[];
}) {
  const { goster } = useToast();
  const t = (k: string) => vsCeviri(k, dil);
  const yerel = YEREL[dil];
  // Kategori adı/açıklaması/yasal dayanağı lib'de TR veridir; anahtar-bazlı yeniden türetilir.
  const katAd = (key: string) => t(`vs.kat.${key}.ad`);
  const katAciklama = (key: string) => t(`vs.kat.${key}.aciklama`);
  const katYasal = (key: string) => t(`vs.kat.${key}.yasal`);
  const say = (n: number) => n.toLocaleString(yerel);
  const [yuklendi, setYuklendi] = useState(false);
  const [politikalar, setPolitikalar] = useState<DepoDurum["politikalar"]>(varsayilanPolitikalar);
  const [talepler, setTalepler] = useState<DsrTalep[]>([]);

  // --- Mount'ta localStorage'dan yükle (SSR-güvenli) ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(DEPO_ANAHTAR);
      if (ham) {
        const kayit = JSON.parse(ham) as Partial<DepoDurum>;
        // Politikaları varsayılanla birleştir (yeni kategori eklenirse kaybolmasın).
        const birlesik = varsayilanPolitikalar();
        if (kayit.politikalar) {
          for (const [k, v] of Object.entries(kayit.politikalar)) {
            if (birlesik[k] && v && typeof v.gun === "number") birlesik[k] = { ...birlesik[k], ...v };
          }
        }
        setPolitikalar(birlesik);
        if (Array.isArray(kayit.talepler)) setTalepler(kayit.talepler);
      }
    } catch {
      /* bozuk kayıt → varsayılan */
    }
    setYuklendi(true);
  }, []);

  // --- Değişince kaydet ---
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      const durum: DepoDurum = { politikalar, talepler, v: DEPO_SURUM };
      window.localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(durum));
    } catch {
      /* kota/erişim → yoksay */
    }
  }, [politikalar, talepler, yuklendi]);

  /* --------------------------------------------- Politika türev hesapları */

  // Her kategori için: yürürlükteki politika + footprint + kaç kayıt süreyi aştı.
  const kategoriSatirlari = useMemo(() => {
    return VERI_KATEGORILERI.map((kat) => {
      const pol = politikalar[kat.key] ?? { gun: kat.varsayilanGun, eylem: kat.varsayilanEylem, otomatik: true };
      const iz = ayakIzi[kat.key] ?? { adet: 0, enEskiGun: 0 };

      // Olay-tabanlı kategoriler için gerçek ts dağılımından tahmin;
      // toplulaştırılmış/kayıt-tabanlılar için yaş tahminine dayanan yaklaşık.
      let etkilenen: number;
      if (kat.key === "olay-loglari" || kat.key === "davranis-verisi") {
        etkilenen = silmeTahmini(olayTsler.map((ts) => ({ ts })), pol.gun, bugun, pol.eylem).etkilenen;
      } else if (kat.key === "ip-adresleri") {
        // IP benzersiz kümesi; olay ts dağılımıyla orantılı yaklaşık.
        const olayTah = silmeTahmini(olayTsler.map((ts) => ({ ts })), pol.gun, bugun, pol.eylem);
        const oran = olayTsler.length ? olayTah.etkilenen / olayTsler.length : 0;
        etkilenen = Math.round(iz.adet * oran);
      } else {
        // Kayıt-tabanlı (denetim/uyarı/kullanım): en eski yaş süreyi aştıysa
        // yaşa göre kaba oran. Gerçek silme sunucuda kesin hesaplanır.
        etkilenen = iz.enEskiGun > pol.gun ? Math.round(iz.adet * ((iz.enEskiGun - pol.gun) / Math.max(iz.enEskiGun, 1))) : 0;
      }

      const durum = iz.enEskiGun > pol.gun
        ? (pol.eylem === "anonimlestir" ? "anonimlestir" : "silinecek")
        : "saklamada";

      return { kat, pol, iz, etkilenen, durum: durum as "saklamada" | "silinecek" | "anonimlestir" };
    });
  }, [politikalar, ayakIzi, olayTsler, bugun]);

  const toplamKayit = useMemo(() => kategoriSatirlari.reduce((a, s) => a + s.iz.adet, 0), [kategoriSatirlari]);
  const toplamEtkilenen = useMemo(() => kategoriSatirlari.reduce((a, s) => a + s.etkilenen, 0), [kategoriSatirlari]);
  const otomatikSayisi = useMemo(() => kategoriSatirlari.filter((s) => s.pol.otomatik).length, [kategoriSatirlari]);

  /* --------------------------------------------- Görsel türevler (mevcut veriden) */

  // Kayıt hacminin kategoriye göre dağılımı (donut) — kategori renkleriyle.
  const kayitDagilim = useMemo(
    () =>
      kategoriSatirlari
        .filter((s) => s.iz.adet > 0)
        .map((s) => ({ etiket: katAd(s.kat.key), deger: s.iz.adet, renk: s.kat.renk }))
        .sort((a, b) => b.deger - a.deger),
    [kategoriSatirlari], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Saklama süresi görselleştirmesi — kategori-başına gün, en uzuna göre normalize.
  const saklamaCubuklari = useMemo(() => {
    const enUzun = Math.max(1, ...kategoriSatirlari.map((s) => s.pol.gun));
    return kategoriSatirlari
      .map((s) => ({
        key: s.kat.key,
        ad: katAd(s.kat.key),
        renk: s.kat.renk,
        ikon: s.kat.ikon,
        gun: s.pol.gun,
        oran: (s.pol.gun / enUzun) * 100,
        eylem: s.pol.eylem,
        durum: s.durum,
      }))
      .sort((a, b) => b.gun - a.gun);
  }, [kategoriSatirlari]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kişisel-veri oranı (veri minimizasyonu göstergesi) ve otomasyon kapsamı.
  const kisiselKayit = useMemo(
    () => kategoriSatirlari.filter((s) => s.kat.kisiselVeri).reduce((a, s) => a + s.iz.adet, 0),
    [kategoriSatirlari],
  );
  const kisiselOran = toplamKayit ? Math.round((kisiselKayit / toplamKayit) * 100) : 0;
  const otomasyonKapsam = Math.round((otomatikSayisi / VERI_KATEGORILERI.length) * 100);
  // "Süre içinde" kalan kayıt oranı — retention sağlık göstergesi.
  const saklamaSagligi = toplamKayit ? Math.round(((toplamKayit - toplamEtkilenen) / toplamKayit) * 100) : 100;

  /* --------------------------------------------- Silme takvimi */

  // Otomatik açık + süreyi aşan kayıt olan kategoriler → yaklaşan çalışma.
  const takvim = useMemo(() => {
    return kategoriSatirlari
      .filter((s) => s.pol.otomatik)
      .map((s) => ({
        kat: s.kat,
        etkilenen: s.etkilenen,
        eylem: s.pol.eylem,
        sonraki: sonrakiCalisma(bugun, 1), // günlük çalışma
      }))
      .sort((a, b) => b.etkilenen - a.etkilenen);
  }, [kategoriSatirlari, bugun]);

  /* --------------------------------------------- Politika değiştiriciler */

  const politikaGuncelle = useCallback((key: string, yama: Partial<{ gun: number; eylem: "sil" | "anonimlestir"; otomatik: boolean }>) => {
    setPolitikalar((p) => ({ ...p, [key]: { ...p[key], ...yama } }));
  }, []);

  function politikalariSifirla() {
    setPolitikalar(varsayilanPolitikalar());
    goster({ tip: "bilgi", baslik: t("vs.toast.sifirlandi") });
  }

  /* --------------------------------------------- DSR yönetimi */

  const [dsrTur, setDsrTur] = useState<DsrTur>("silme");
  const [dsrTanim, setDsrTanim] = useState("");
  const [dsrNot, setDsrNot] = useState("");

  function talepGonder(e: React.FormEvent) {
    e.preventDefault();
    const tanim = dsrTanim.trim();
    if (!tanim) {
      goster({ tip: "hata", baslik: t("vs.toast.tanimGerekli"), aciklama: t("vs.toast.tanimGerekliAcik") });
      return;
    }
    const id = `dsr_${bugun.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    const yeni = dsrOlustur({ tur: dsrTur, tanimlayici: tanim, not: dsrNot.trim() || undefined }, Date.now(), id);
    setTalepler((p) => [yeni, ...p]);
    setDsrTanim("");
    setDsrNot("");
    goster({ tip: "basari", baslik: t("vs.toast.kuyruga"), aciklama: t("vs.toast.kuyrugaAcik").replace("{n}", String(KVKK_SLA_GUN)) });
  }

  function talepGecir(id: string, hedef: DsrDurum) {
    setTalepler((p) => p.map((tl) => (tl.id === id ? dsrIsle(tl, hedef, Date.now()) : tl)));
    const etiket = hedef === "isleniyor" ? t("vs.toast.etiket.isleme") : hedef === "tamamlandi" ? t("vs.toast.etiket.tamam") : t("vs.toast.etiket.red");
    goster({ tip: hedef === "reddedildi" ? "bilgi" : "basari", baslik: t("vs.toast.talepDurum").replace("{etiket}", etiket) });
  }

  const acikTalepler = talepler.filter((t) => t.durum === "alindi" || t.durum === "isleniyor");
  const gecikmisTalepler = acikTalepler.filter((t) => dsrSla(t, bugun).gecikti);

  /* --------------------------------------------- Anonimleştirme önizleme */

  const [previewIp, setPreviewIp] = useState("");
  const ornekIp = previewIp.trim() || ornekIpler[0] || "185.220.101.34";
  const [previewMail, setPreviewMail] = useState("");
  const ornekMail = previewMail.trim() || "ziyaretci@ornek.com";

  /* --------------------------------------------- Uyum eşlemesi */

  // Madde/kod referansları veri olarak kalır; ad+açıklama çevrilir.
  const uyumMaddeleri = [
    { madde: "KVKK m.7 / GDPR Art.17", ad: t("vs.uyum.m1.ad"), aciklama: t("vs.uyum.m1.aciklama"), ok: true },
    { madde: "GDPR Art.5(1)(e)", ad: t("vs.uyum.m2.ad"), aciklama: t("vs.uyum.m2.aciklama"), ok: true },
    { madde: "KVKK m.4 / GDPR Art.5(1)(c)", ad: t("vs.uyum.m3.ad"), aciklama: t("vs.uyum.m3.aciklama"), ok: true },
    { madde: "KVKK m.11 / GDPR Art.15", ad: t("vs.uyum.m4.ad"), aciklama: t("vs.uyum.m4.aciklama"), ok: true },
    { madde: "KVKK 30 gün / GDPR Art.12(3)", ad: t("vs.uyum.m5.ad"), aciklama: t("vs.uyum.m5.aciklama"), ok: true },
    { madde: "GDPR Art.30", ad: t("vs.uyum.m6.ad"), aciklama: t("vs.uyum.m6.aciklama"), ok: true },
  ];

  // Karşılanan uyum maddesi oranı (gauge, 0-100).
  const uyumOrani = Math.round((uyumMaddeleri.filter((u) => u.ok).length / uyumMaddeleri.length) * 100);

  /* --------------------------------------------- Render */

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <DatabaseZap className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("vs.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("vs.intro.metin")}</p>
        </div>
      </div>

      {/* Özet istatistikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={say(toplamKayit)} etiket={t("vs.ozet.yonetilenKayit")} ikon={<DatabaseZap className="size-5" />} />
        <StatKart sayi={say(toplamEtkilenen)} etiket={t("vs.ozet.sureyiAsan")} ikon={<Trash2 className="size-5" />} tone={toplamEtkilenen > 0 ? "warn" : "ok"} />
        <StatKart sayi={`${otomatikSayisi}/${VERI_KATEGORILERI.length}`} etiket={t("vs.ozet.otomatikAktif")} ikon={<CalendarClock className="size-5" />} tone="ok" />
        <StatKart sayi={acikTalepler.length} etiket={t("vs.ozet.acikDsr")} ikon={<UserRoundX className="size-5" />} tone={gecikmisTalepler.length > 0 ? "danger" : acikTalepler.length > 0 ? "warn" : "ok"} />
      </div>

      {/* 0.5 Görsel gizlilik-operasyonları panosu */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Uyum sağlık gauge'ları */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card lg:col-span-4"
        >
          <span className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-muted">
            <Icons.ShieldCheck className="size-3.5 text-ok" /> {t("vs.gorsel.uyumSagligi")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-canvas/40 py-3">
              <GaugeGost deger={uyumOrani} etiket={t("vs.gorsel.uyum")} boyut={128} renk="#16a34a" />
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-canvas/40 py-3">
              <GaugeGost deger={otomasyonKapsam} etiket={t("vs.gorsel.otomasyon")} boyut={128} renk="#2f6fed" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-line bg-surface px-2 py-2">
              <div className="num text-[17px] font-bold text-slate-ink">%{saklamaSagligi}</div>
              <div className="text-[11px] text-slate-muted">{t("vs.gorsel.sureIcinde")}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-2 py-2">
              <div className="num text-[17px] font-bold text-slate-ink">%{kisiselOran}</div>
              <div className="text-[11px] text-slate-muted">{t("vs.gorsel.kisiselOran")}</div>
            </div>
          </div>
        </motion.div>

        {/* Kayıt hacmi dağılımı donut */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card lg:col-span-4"
        >
          <span className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-muted">
            <DatabaseZap className="size-3.5 text-brand-600" /> {t("vs.gorsel.kayitDagilim")}
          </span>
          {kayitDagilim.length > 0 ? (
            <DonutDagilim segmentler={kayitDagilim} merkezEtiket={t("vs.gorsel.kayitMerkez")} />
          ) : (
            <div className="grid h-40 place-items-center text-[12px] text-slate-faint">{t("vs.gorsel.veriYok")}</div>
          )}
        </motion.div>

        {/* Saklama süresi görselleştirme (yaşam-döngüsü şeridi) */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card lg:col-span-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-muted">
              <Clock className="size-3.5 text-brand-600" /> {t("vs.gorsel.saklamaSuresi")}
            </span>
            <span className="text-[11px] text-slate-faint">{t("vs.gorsel.gunEksen")}</span>
          </div>
          <div className="space-y-2.5">
            {saklamaCubuklari.map((c, i) => (
              <div key={c.key} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-md text-white" style={{ background: c.renk }}>
                  <LucideIkon name={c.ikon} className="size-3" />
                </span>
                <span className="w-24 shrink-0 truncate text-[11.5px] font-medium text-slate-muted">{c.ad}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.renk, opacity: 0.85 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.oran}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="num w-12 shrink-0 text-right text-[11.5px] font-semibold text-slate-ink">{c.gun}g</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 1. Saklama politikaları */}
      <Panel
        baslik={t("vs.pol.baslik")}
        sagUst={<Button variant="outline" size="sm" onClick={politikalariSifirla}><RotateCcw className="size-4" /> {t("vs.pol.varsayilanaDon")}</Button>}
      >
        <p className="mb-4 text-[13px] text-slate-muted">{t("vs.pol.aciklama")}</p>
        <div className="space-y-3">
          {kategoriSatirlari.map(({ kat, pol, iz, etkilenen, durum }) => (
            <div key={kat.key} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: kat.renk }}>
                    <LucideIkon name={kat.ikon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-ink">{katAd(kat.key)}</span>
                      {kat.kisiselVeri
                        ? <Badge ton="mavi">{t("vs.pol.kisiselVeri")}</Badge>
                        : <Badge ton="gri">{t("vs.pol.kisiselVeriDegil")}</Badge>}
                      {durum === "silinecek" && <Badge ton="kirmizi"><Trash2 className="size-3" /> {t("vs.pol.silinecek").replace("{n}", say(etkilenen))}</Badge>}
                      {durum === "anonimlestir" && <Badge ton="sari"><Sparkles className="size-3" /> {t("vs.pol.anonimlesecek").replace("{n}", say(etkilenen))}</Badge>}
                      {durum === "saklamada" && <Badge ton="yesil"><Check className="size-3" /> {t("vs.pol.sureIcinde")}</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-slate-muted">{katAciklama(kat.key)}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-[12px] text-brand-700"><Lock className="mt-0.5 size-3 shrink-0" /> {katYasal(kat.key)}</p>
                    <p className="mt-1 text-[12px] text-slate-faint">
                      {(() => {
                        // "{adet} kayıt · en eski {gun} günlük" → iki sayıyı vurgulu yerleştir.
                        const [once, arasi = "", sonra = ""] = t("vs.pol.kayitEnEski").split(/\{adet\}|\{gun\}/);
                        return (<>{once}<span className="num font-medium text-slate-muted">{say(iz.adet)}</span>{arasi}<span className="num font-medium text-slate-muted">{iz.enEskiGun}</span>{sonra}</>);
                      })()}
                    </p>
                  </div>
                </div>

                {/* Otomatik toggle */}
                <button
                  onClick={() => politikaGuncelle(kat.key, { otomatik: !pol.otomatik })}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                    pol.otomatik ? "bg-brand-600" : "bg-slate-300",
                  )}
                  aria-label={t("vs.pol.otomatikAria")}
                  title={pol.otomatik ? t("vs.pol.otomatikAcik") : t("vs.pol.otomatikKapali")}
                >
                  <span className={cn("inline-block size-5 transform rounded-full bg-white shadow transition", pol.otomatik ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>

              {/* Kontroller: saklama süresi slider + eylem seçimi */}
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-slate-muted">{t("vs.pol.saklamaSuresi")}</span>
                    <span className="num font-semibold text-slate-ink">
                      {pol.gun >= 30
                        ? t("vs.pol.gunAy").replace("{n}", String(pol.gun)).replace("{ay}", String(Math.round(pol.gun / 30)))
                        : t("vs.pol.gun").replace("{n}", String(pol.gun))}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={7}
                    max={730}
                    step={1}
                    value={pol.gun}
                    onChange={(e) => politikaGuncelle(kat.key, { gun: Number(e.target.value) })}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-canvas accent-brand-600"
                    aria-label={t("vs.pol.suresiAria").replace("{ad}", katAd(kat.key))}
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-faint">
                    <span>{t("vs.pol.tik.7g")}</span><span>{t("vs.pol.tik.90g")}</span><span>{t("vs.pol.tik.1y")}</span><span>{t("vs.pol.tik.2y")}</span>
                  </div>
                </div>
                <div className="sm:w-44">
                  <span className="mb-1.5 block text-[12px] font-medium text-slate-muted">{t("vs.pol.sonEylem")}</span>
                  <Secim
                    value={pol.eylem}
                    onChange={(e) => politikaGuncelle(kat.key, { eylem: e.target.value as "sil" | "anonimlestir" })}
                    className="h-10"
                    aria-label={t("vs.pol.sonEylemAria").replace("{ad}", katAd(kat.key))}
                  >
                    <option value="sil">{t("vs.pol.kaliciSil")}</option>
                    <option value="anonimlestir">{t("vs.pol.anonimlestir")}</option>
                  </Secim>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 2. Silme takvimi */}
      <Panel baslik={t("vs.tak.baslik")}>
        <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-muted">
          <CalendarClock className="size-4 text-brand-600" />
          {(() => {
            const [once, sonra = ""] = t("vs.tak.sonraki").split("{tarih}");
            return <span>{once}<b className="text-slate-ink">{tarihStr(sonrakiCalisma(bugun, 1), yerel)}</b>{sonra}</span>;
          })()}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
                <th className="px-4 py-2.5 font-semibold">{t("vs.tak.kategori")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("vs.tak.eylem")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("vs.tak.etkilenecek")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("vs.tak.sonrakiCalisma")}</th>
              </tr>
            </thead>
            <tbody>
              {takvim.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-faint">{t("vs.tak.bos")}</td></tr>
              ) : takvim.map(({ kat, etkilenen, eylem, sonraki }) => (
                <tr key={kat.key} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-slate-ink">
                      <span className="grid size-6 place-items-center rounded-md text-white" style={{ background: kat.renk }}><LucideIkon name={kat.ikon} className="size-3.5" /></span>
                      {katAd(kat.key)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {eylem === "anonimlestir"
                      ? <Badge ton="sari"><Sparkles className="size-3" /> {t("vs.pol.anonimlestir")}</Badge>
                      : <Badge ton="kirmizi"><Trash2 className="size-3" /> {t("vs.pol.kaliciSil")}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("num font-semibold", etkilenen > 0 ? "text-warn" : "text-slate-faint")}>
                      {etkilenen > 0 ? say(etkilenen) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-muted">
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-slate-faint" /> {tarihStr(sonraki, yerel)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 3. DSR — veri konusu talepleri */}
      <Panel baslik={t("vs.dsr.baslik")}>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Talep formu */}
          <form onSubmit={talepGonder} className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Send className="size-4 text-brand-600" /> {t("vs.dsr.yeniTalep")}
            </div>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-[12px] font-medium text-slate-muted">{t("vs.dsr.talepTuru")}</span>
              <Secim value={dsrTur} onChange={(e) => setDsrTur(e.target.value as DsrTur)} className="h-10">
                <option value="silme">{t("vs.dsr.tur.silme")}</option>
                <option value="erisim">{t("vs.dsr.tur.erisim")}</option>
                <option value="duzeltme">{t("vs.dsr.tur.duzeltme")}</option>
              </Secim>
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-[12px] font-medium text-slate-muted">{t("vs.dsr.tanimlayici")}</span>
              <Girdi value={dsrTanim} onChange={(e) => setDsrTanim(e.target.value)} placeholder={t("vs.dsr.tanimlayiciYer")} className="h-10" />
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-[12px] font-medium text-slate-muted">{t("vs.dsr.not")}</span>
              <Alan2 value={dsrNot} onChange={(e) => setDsrNot(e.target.value)} placeholder={t("vs.dsr.notYer")} rows={2} />
            </label>
            <Button type="submit" size="sm" className="w-full"><Send className="size-4" /> {t("vs.dsr.kuyrugaAl")}</Button>
            <p className="mt-2 text-[11px] text-slate-faint">{t("vs.dsr.slaBilgi").replace("{n}", String(KVKK_SLA_GUN))}</p>
          </form>

          {/* Talep kuyruğu */}
          <div>
            {talepler.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong text-center">
                <UserRoundX className="mb-3 size-8 text-slate-faint" />
                <p className="text-sm font-medium text-slate-ink">{t("vs.dsr.bosBaslik")}</p>
                <p className="mt-1 max-w-xs text-[12px] text-slate-muted">{t("vs.dsr.bosMetin")}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {talepler.map((talep) => {
                  const sla = dsrSla(talep, bugun);
                  return (
                    <div key={talep.id} className="rounded-2xl border border-line bg-surface p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <DsrDurumRozet durum={talep.durum} dil={dil} />
                            <span className="text-[12px] font-medium text-slate-muted">
                              {talep.tur === "silme" ? t("vs.dsr.turKisa.silme") : talep.tur === "erisim" ? t("vs.dsr.turKisa.erisim") : t("vs.dsr.turKisa.duzeltme")}
                            </span>
                            <span className="font-mono text-[12.5px] text-slate-ink">{talep.tanimlayici}</span>
                          </div>
                          <p className="mt-1 text-[11.5px] text-slate-faint">
                            {t("vs.dsr.alindi").replace("{tarih}", tarihStr(talep.alindiTs, yerel))}
                            {talep.bitisTs != null && t("vs.dsr.kapandi").replace("{tarih}", tarihStr(talep.bitisTs, yerel))}
                            {talep.not && ` · ${talep.not}`}
                          </p>
                        </div>
                        {/* SLA sayaç */}
                        <div className="text-right">
                          {sla.kapali ? (
                            <span className={cn("text-[12px] font-medium", sla.gecikti ? "text-danger2" : "text-ok")}>
                              {sla.gecikti ? t("vs.dsr.gecKapandi") : t("vs.dsr.slaIcinde")}
                            </span>
                          ) : (
                            <span className={cn("num text-[13px] font-semibold", sla.gecikti ? "text-danger2" : sla.kalanGun <= 7 ? "text-warn" : "text-slate-ink")}>
                              {sla.gecikti ? t("vs.dsr.gecikme").replace("{n}", String(Math.abs(sla.kalanGun))) : t("vs.dsr.kaldi").replace("{n}", String(sla.kalanGun))}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-faint">{t("vs.dsr.son").replace("{tarih}", tarihStr(sla.sonTarihTs, yerel))}</p>
                        </div>
                      </div>

                      {/* Yaşam döngüsü aksiyonları */}
                      {!sla.kapali && (
                        <div className="mt-2.5 flex flex-wrap gap-2 border-t border-line pt-2.5">
                          {talep.durum === "alindi" && (
                            <Button size="sm" variant="outline" onClick={() => talepGecir(talep.id, "isleniyor")}>
                              <PlayCircle className="size-3.5" /> {t("vs.dsr.islemeAl")}
                            </Button>
                          )}
                          {talep.durum === "isleniyor" && (
                            <Button size="sm" variant="success" onClick={() => talepGecir(talep.id, "tamamlandi")}>
                              <Check className="size-3.5" /> {t("vs.dsr.tamamla")}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => talepGecir(talep.id, "reddedildi")}>
                            <Ban className="size-3.5" /> {t("vs.dsr.reddet")}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* 4. Anonimleştirme önizleme */}
      <Panel baslik={t("vs.anon.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">{t("vs.anon.aciklama")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* IP maskeleme */}
          <div className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Icons.Globe className="size-4 text-brand-600" /> {t("vs.anon.ipBaslik")}
            </div>
            <Girdi value={previewIp} onChange={(e) => setPreviewIp(e.target.value)} placeholder={ornekIpler[0] || "185.220.101.34"} className="mb-3 h-10 font-mono" />
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate rounded-lg bg-danger-soft px-3 py-2 font-mono text-[13px] text-red-700 line-through">{ornekIp}</code>
              <ArrowRight className="size-4 shrink-0 text-slate-faint" />
              <code className="flex-1 truncate rounded-lg bg-ok-soft px-3 py-2 font-mono text-[13px] text-green-700">{ipAnonimlestir(ornekIp)}</code>
            </div>
            <p className="mt-2 text-[11px] text-slate-faint">{t("vs.anon.ipNot")}</p>
          </div>

          {/* Tanımlayıcı hash */}
          <div className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <Icons.Hash className="size-4 text-brand-600" /> {t("vs.anon.hashBaslik")}
            </div>
            <Girdi value={previewMail} onChange={(e) => setPreviewMail(e.target.value)} placeholder="ziyaretci@ornek.com" className="mb-3 h-10 font-mono" />
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate rounded-lg bg-danger-soft px-3 py-2 font-mono text-[13px] text-red-700 line-through">{ornekMail}</code>
              <ArrowRight className="size-4 shrink-0 text-slate-faint" />
              <code className="flex-1 truncate rounded-lg bg-ok-soft px-3 py-2 font-mono text-[13px] text-green-700">{tanimlayiciHashle(ornekMail)}</code>
            </div>
            <p className="mt-2 text-[11px] text-slate-faint">{t("vs.anon.hashNot")}</p>
          </div>
        </div>
      </Panel>

      {/* 5. Uyum özeti */}
      <Panel baslik={t("vs.uyum.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">{t("vs.uyum.aciklama")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {uyumMaddeleri.map((u) => (
            <div key={u.madde} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-ok-soft text-ok"><Check className="size-3.5" /></span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-slate-ink">{u.ad}</div>
                <div className="font-mono text-[11px] text-brand-700">{u.madde}</div>
                <p className="mt-0.5 text-[12px] text-slate-muted">{u.aciklama}</p>
              </div>
            </div>
          ))}
        </div>
        <NotKutusu ton="yesil" baslik={t("vs.uyum.notBaslik")}>
          <span dangerouslySetInnerHTML={{ __html: t("vs.uyum.notMetin") }} />
        </NotKutusu>
      </Panel>

      {/* Dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>
          <b>{t("vs.dust.baslik")}</b>{" "}
          <span dangerouslySetInnerHTML={{ __html: t("vs.dust.metin") }} />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ DSR durum rozeti */

function DsrDurumRozet({ durum, dil }: { durum: DsrDurum; dil: Dil }) {
  // Enum → i18n anahtarı (enum değeri asla çevrilmez, etiketi çözülür).
  const meta: Record<DsrDurum, { anahtar: string; ton: "gri" | "mavi" | "yesil" | "kirmizi"; ikon: React.ReactNode }> = {
    alindi: { anahtar: "vs.dsrDurum.alindi", ton: "gri", ikon: <Clock className="size-3" /> },
    isleniyor: { anahtar: "vs.dsrDurum.isleniyor", ton: "mavi", ikon: <PlayCircle className="size-3" /> },
    tamamlandi: { anahtar: "vs.dsrDurum.tamamlandi", ton: "yesil", ikon: <Check className="size-3" /> },
    reddedildi: { anahtar: "vs.dsrDurum.reddedildi", ton: "kirmizi", ikon: <Ban className="size-3" /> },
  };
  const m = meta[durum];
  return <Badge ton={m.ton}>{m.ikon} {vsCeviri(m.anahtar, dil)}</Badge>;
}
