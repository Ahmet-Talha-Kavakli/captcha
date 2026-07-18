"use client";

/**
 * Saldırı Tahmini & Erken Uyarı — istemci konsolu.
 * Öngörücü bir SOC ekranı: erken-uyarı bandı, tahmin grafiği (gerçek + tahmin
 * + güven bandı), istatistik kartları, saat-bazlı ısı profili ve "ne yapmalı"
 * önerileri. Tüm hesap sunucuda (saf motor) yapıldı; burada yalnızca sunum.
 *
 * i18n: metinler yerel sözlükten (saldiri-tahmin.i18n.ts) gelir. Lib'in dinamik
 * ürettiği uyarı başlık/açıklaması İSTEMCİDE yeniden türetilir (lib DEĞİŞMEZ).
 */

import { useMemo } from "react";
import {
  Siren,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Gauge,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGost, IsiMatris } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { saldiriTahminCeviri, YEREL_BCP47 } from "./saldiri-tahmin.i18n";
import type {
  TahminSonuc,
  ErkenUyari,
  MevsimsellikSonuc,
  UyariSiddet,
  TrendYonu,
} from "@/lib/specter/saldiri-tahmin";

interface Props {
  saatlikBot: number[];
  tahmin: TahminSonuc;
  uyari: ErkenUyari;
  mevsim: MevsimsellikSonuc;
  mevcutHiz: number;
  sonSaatDilimi: number;
  gunlukGunler: string[];
  gunlukBot: number[];
  gunlukTahmin: TahminSonuc;
  veriVar: boolean;
  dil: Dil;
}

/* Şiddet → renk/sınıf eşlemesi (banner + rozet). Etiket çeviriden gelir. */
const SIDDET_META: Record<
  UyariSiddet,
  { renk: string; zeminSinif: string; kenarSinif: string; metinSinif: string }
> = {
  izle: {
    renk: "#2f6fed",
    zeminSinif: "bg-brand-50/70",
    kenarSinif: "border-brand-200",
    metinSinif: "text-brand-700",
  },
  uyari: {
    renk: "#d97706",
    zeminSinif: "bg-warn-soft",
    kenarSinif: "border-amber-200",
    metinSinif: "text-amber-700",
  },
  kritik: {
    renk: "#dc2626",
    zeminSinif: "bg-danger-soft",
    kenarSinif: "border-red-200",
    metinSinif: "text-red-700",
  },
};

/* Trend yönü → ikon + renk. */
const TREND_META: Record<TrendYonu, { ikon: React.ReactNode; renk: string; ton: "danger" | "ok" | "brand" }> = {
  artıyor: { ikon: <TrendingUp className="size-5" />, renk: "#dc2626", ton: "danger" },
  azalıyor: { ikon: <TrendingDown className="size-5" />, renk: "#16a34a", ton: "ok" },
  sabit: { ikon: <Minus className="size-5" />, renk: "#2f6fed", ton: "brand" },
};

/** Saati "03:00" biçimine getir. */
function saatEtiket(s: number): string {
  return `${String(((s % 24) + 24) % 24).padStart(2, "0")}:00`;
}

export function SaldiriTahminIstemci({
  saatlikBot,
  tahmin,
  uyari,
  mevsim,
  mevcutHiz,
  sonSaatDilimi,
  gunlukGunler,
  gunlukBot,
  gunlukTahmin,
  veriVar,
  dil,
}: Props) {
  const t = (anahtar: string) => saldiriTahminCeviri(anahtar, dil);
  const yerel = YEREL_BCP47[dil];
  const nf = (n: number) => n.toLocaleString(yerel);

  const sm = SIDDET_META[uyari.siddet];
  const trendMeta = TREND_META[tahmin.trendYonu];
  const siddetEtiket = t(`siddet.${uyari.siddet}`);

  /* ---- Uyarı başlık/açıklamasını İSTEMCİDE yeniden türet (lib TR üretir) ----
   * Yapısal alanlardan (aniSicrama/zirveKova/sicramaKat/mevcutHiz/esik) çeviriyle
   * yeniden kur; sayılar yerel biçimde. mevcutHiz = lib'deki "sonKova" değeridir.
   */
  const { uyariBaslik, uyariAciklama } = useMemo(() => {
    if (!uyari.tetiklendi) {
      return {
        uyariBaslik: t("uyari.sakin.baslik"),
        uyariAciklama: t("uyari.sakin.aciklama"),
      };
    }
    if (uyari.aniSicrama && uyari.zirveKova === 0) {
      return {
        uyariBaslik: t("uyari.sicrama.baslik"),
        uyariAciklama: t("uyari.sicrama.aciklama")
          .replace("{kat}", uyari.sicramaKat.toFixed(1))
          .replace("{olay}", nf(Math.round(mevcutHiz))),
      };
    }
    if (uyari.zirveKova === 0) {
      return {
        uyariBaslik: t("uyari.aktif.baslik"),
        uyariAciklama: t("uyari.aktif.aciklama")
          .replace("{olay}", nf(Math.round(mevcutHiz)))
          .replace("{esik}", nf(uyari.esik)),
      };
    }
    return {
      uyariBaslik: t("uyari.yaklasiyor.baslik"),
      uyariAciklama: t("uyari.yaklasiyor.aciklama")
        .replace("{zirve}", nf(uyari.ongorulenZirve))
        .replace("{saat}", String(uyari.zirveKova ?? 0))
        .replace("{esik}", nf(uyari.esik)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uyari, mevcutHiz, dil]);

  /* ---- Tahmin grafiği için birleşik iki seri kur ----
   * Gözlemlenen (gerçek) ve tahmin serilerini AYNI x-ekseninde göster:
   *   - "gerçek" serisi: geçmiş kovalar + son gerçek noktadan sonra null/boşluk
   *   - "tahmin" serisi: geçmişte boş, son gerçek noktadan itibaren tahmin
   * TrendGrafik NaN'ı Number.isFinite ile eler; seriyi hizalı tutmak için
   * gözlem/tahmin kısımlarını NaN ile doldururuz (görsel olarak kesilir).
   * Ayrıca güven bandının üst sınırını daha açık bir üçüncü seri olarak çizeriz.
   */
  const { gercekSeri, tahminSeri, bantUstSeri, etiketler } = useMemo(() => {
    // Performans + okunabilirlik: son 48 gözlem kovasını göster.
    const gozlem = saatlikBot.slice(-48);
    const n = gozlem.length;
    const h = tahmin.tahmin.length;

    // Gözlem: gerçek değerler + tahmin bölgesinde NaN.
    const gercek = [...gozlem, ...new Array(h).fill(NaN)];
    // Köprü: tahmin serisi son gerçek noktadan başlasın (kopuk görünmesin).
    const sonGercek = n > 0 ? gozlem[n - 1] : 0;
    const tahminS = [...new Array(Math.max(0, n - 1)).fill(NaN), sonGercek, ...tahmin.tahmin];
    // Güven bandı üst sınırı (yalnızca tahmin bölgesinde).
    const bantUst = [
      ...new Array(Math.max(0, n - 1)).fill(NaN),
      sonGercek,
      ...tahmin.guvenBandi.map((b) => b.ust),
    ];

    // x-ekseni etiketleri: gözlem "-Nsa", tahmin "+Ksa".
    const etk: string[] = [];
    for (let i = 0; i < n; i++) etk.push(t("suffix.saatGeri").replace("{n}", String(n - 1 - i)));
    for (let k = 1; k <= h; k++) etk.push(t("suffix.saatIleri").replace("{n}", String(k)));

    return { gercekSeri: gercek, tahminSeri: tahminS, bantUstSeri: bantUst, etiketler: etk };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saatlikBot, tahmin, dil]);

  /* Günlük bağlam grafiği (Usage) — gözlem + 7 gün projeksiyon. */
  const { gunGercek, gunTahmin, gunEtiket } = useMemo(() => {
    const n = gunlukBot.length;
    const h = gunlukTahmin.tahmin.length;
    const gercek = [...gunlukBot, ...new Array(h).fill(NaN)];
    const sonGercek = n > 0 ? gunlukBot[n - 1] : 0;
    const tah = [...new Array(Math.max(0, n - 1)).fill(NaN), sonGercek, ...gunlukTahmin.tahmin];
    const etk = [
      ...gunlukGunler.map((g) => g.slice(5)),
      ...gunlukTahmin.tahmin.map((_, k) => t("suffix.gunIleri").replace("{n}", String(k + 1))),
    ];
    return { gunGercek: gercek, gunTahmin: tah, gunEtiket: etk };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunlukBot, gunlukTahmin, gunlukGunler, dil]);

  /* Isı profili için en yoğun saat ve max değer. */
  const isiMax = useMemo(() => Math.max(1, ...mevsim.profil), [mevsim.profil]);

  const tr = dil === "tr";

  /* ---- Görsel türetmeler (SALT SUNUM — hiçbir yeni veri/mantık üretmez) ----
   * Aşağıdaki değerler yalnızca mevcut tahmin/uyarı çıktılarından yeniden
   * biçimlendirilir; kaynak sayılar (tahmin, güvenBandi, profil…) değişmez.
   */
  const gorsel = useMemo(() => {
    // Risk olasılığı: öngörülen zirvenin temel eşiğe oranı, 0..100'e sıkıştırılır.
    // (Eşik = mean+2σ; zirve eşiği ne kadar aşıyorsa risk o kadar yüksek.)
    const esik = Math.max(1, uyari.esik);
    const zirveOran = uyari.ongorulenZirve / esik;
    const riskOlasilik = Math.max(0, Math.min(100, Math.round(zirveOran * 55)));

    // Güven skoru: tahmin güven bandının darlığı → dar bant = yüksek güven.
    const bant = tahmin.guvenBandi;
    const ortNokta =
      bant.length && tahmin.tahmin.length
        ? Math.max(1, tahmin.tahmin.reduce((a, b) => a + b, 0) / tahmin.tahmin.length)
        : 1;
    const ortGenislik =
      bant.length > 0
        ? bant.reduce((a, b) => a + Math.max(0, b.ust - b.alt), 0) / bant.length
        : 0;
    const guvenSkor = Math.max(
      5,
      Math.min(99, Math.round(100 - (ortGenislik / (ortNokta * 2)) * 100)),
    );

    // Zaman-dilimi olasılık dağılımı: 24 saatlik profili 4 blok'a topla (donut).
    // Her blok payı = o bloğun profil toplamı / genel toplam.
    const bloklar = [
      { ad: tr ? "Gece 00–06" : "Night 00–06", saatler: [0, 6], renk: "#4f46e5" },
      { ad: tr ? "Sabah 06–12" : "Morning 06–12", saatler: [6, 12], renk: "#2f6fed" },
      { ad: tr ? "Öğleden sonra 12–18" : "Afternoon 12–18", saatler: [12, 18], renk: "#d97706" },
      { ad: tr ? "Akşam 18–24" : "Evening 18–24", saatler: [18, 24], renk: "#dc2626" },
    ];
    const dilimler = bloklar.map((b) => {
      const toplam = mevsim.profil
        .slice(b.saatler[0], b.saatler[1])
        .reduce((a, v) => a + v, 0);
      return { etiket: b.ad, deger: Math.round(toplam * 10) / 10, renk: b.renk };
    });

    // Gün × saat-bloğu beklenen risk matrisi: gözlemlenen saatlik seriyi (72sa,
    // en yeni sonda) günlere ve 4 saat-bloğuna sar. Salt yeniden şekillendirme.
    const blokBaslik = tr ? ["00–06", "06–12", "12–18", "18–24"] : ["00–06", "06–12", "12–18", "18–24"];
    const seri = saatlikBot;
    const nSaat = seri.length;
    // Son kovanın günün saati sonSaatDilimi; her indeksin saatini geriye doğru çöz.
    const gunSayisi = Math.min(4, Math.ceil(nSaat / 24) || 1);
    const gunEtiketleri: string[] = [];
    for (let g = gunSayisi - 1; g >= 0; g--) {
      gunEtiketleri.push(g === 0 ? (tr ? "Bugün" : "Today") : (tr ? `-${g} gün` : `-${g}d`));
    }
    // matris[gun][blok] = o pencerenin beklenen ortalama olay yoğunluğu (0-100).
    const ham: number[][] = Array.from({ length: gunSayisi }, () => [0, 0, 0, 0]);
    const sayac: number[][] = Array.from({ length: gunSayisi }, () => [0, 0, 0, 0]);
    for (let i = 0; i < nSaat; i++) {
      const geri = nSaat - 1 - i; // 0 = en yeni
      const gun = Math.floor(geri / 24);
      if (gun >= gunSayisi) continue;
      const gunIdx = gunSayisi - 1 - gun; // matris satırı (üstte en eski)
      const saat = ((sonSaatDilimi - geri) % 24 + 24) % 24;
      const blok = Math.min(3, Math.floor(saat / 6));
      ham[gunIdx][blok] += seri[i];
      sayac[gunIdx][blok] += 1;
    }
    let hamMax = 1;
    for (let r = 0; r < gunSayisi; r++)
      for (let c = 0; c < 4; c++) {
        ham[r][c] = sayac[r][c] ? ham[r][c] / sayac[r][c] : 0;
        if (ham[r][c] > hamMax) hamMax = ham[r][c];
      }
    const matris = ham.map((satir) => satir.map((v) => Math.round((v / hamMax) * 100)));

    return {
      riskOlasilik,
      guvenSkor,
      dilimler,
      matrisSatir: gunEtiketleri,
      matrisSutun: blokBaslik,
      matris,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uyari, tahmin, mevsim.profil, saatlikBot, sonSaatDilimi, dil]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* ------------------------------------------------ Erken uyarı bandı */}
      <div
        className={cn(
          "flex items-start gap-4 rounded-2xl border px-5 py-4",
          uyari.tetiklendi ? sm.kenarSinif : "border-green-200",
          uyari.tetiklendi ? sm.zeminSinif : "bg-ok-soft",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl text-white",
          )}
          style={{ background: uyari.tetiklendi ? sm.renk : "#16a34a" }}
        >
          {uyari.tetiklendi ? <Siren className="size-6" /> : <ShieldCheck className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-[15px] font-semibold", uyari.tetiklendi ? sm.metinSinif : "text-green-800")}>
              {veriVar ? uyariBaslik : t("uyari.veriYok")}
            </p>
            {uyari.tetiklendi && (
              <Badge ton={uyari.siddet === "kritik" ? "kirmizi" : uyari.siddet === "uyari" ? "sari" : "mavi"}>
                {siddetEtiket}
              </Badge>
            )}
            {uyari.aniSicrama && (
              <Badge ton="kirmizi">
                <Zap className="size-3" /> {t("rozet.sicrama").replace("{kat}", String(uyari.sicramaKat))}
              </Badge>
            )}
          </div>
          <p className={cn("mt-1 text-[13px]", uyari.tetiklendi ? "text-slate-ink/80" : "text-green-800/80")}>
            {veriVar ? uyariAciklama : t("uyari.veriYok.aciklama")}
          </p>
          {uyari.tetiklendi && uyari.zirveKova !== null && uyari.zirveKova > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> {t("bant.zirveyeSaat").replace("{saat}", String(uyari.zirveKova))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> {t("bant.ongorulenZirve").replace("{n}", nf(uyari.ongorulenZirve))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="size-3.5" /> {t("bant.temelEsik").replace("{n}", nf(uyari.esik))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------ İstatistik kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={nf(mevcutHiz)}
          etiket={t("stat.mevcutHiz")}
          ikon={<Activity className="size-5" />}
        />
        <StatKart
          sayi={nf(uyari.ongorulenZirve)}
          etiket={uyari.zirveKova ? t("stat.tahminiZirveSaat").replace("{saat}", String(uyari.zirveKova)) : t("stat.tahminiZirve")}
          ikon={<TrendingUp className="size-5" />}
          tone={uyari.siddet === "kritik" ? "danger" : uyari.siddet === "uyari" ? "warn" : undefined}
        />
        <StatKart
          sayi={t(`trend.${tahmin.trendYonu}`)}
          etiket={t("stat.trendYonu").replace("{ivme}", `${tahmin.ivme >= 0 ? "+" : ""}${tahmin.ivme.toFixed(1)}`)}
          ikon={trendMeta.ikon}
          tone={trendMeta.ton === "danger" ? "danger" : trendMeta.ton === "ok" ? "ok" : undefined}
        />
        <StatKart
          sayi={uyari.tetiklendi ? siddetEtiket : t("stat.sakin")}
          etiket={t("stat.erkenUyariDurumu")}
          ikon={uyari.tetiklendi ? <Siren className="size-5" /> : <ShieldCheck className="size-5" />}
          tone={uyari.tetiklendi ? (uyari.siddet === "kritik" ? "danger" : "warn") : "ok"}
        />
      </div>

      {/* ------------------------------------------------ Tahmin grafiği */}
      <Panel
        baslik={t("grafik.baslik")}
        sagUst={
          <span className="flex items-center gap-2 text-[11px] text-slate-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: "#2f6fed" }} /> {t("grafik.gozlem")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: "#dc2626" }} /> {t("grafik.tahmin")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded opacity-50" style={{ background: "#f59e0b" }} /> {t("grafik.guvenUst")}
            </span>
          </span>
        }
      >
        <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-canvas/50 px-4 py-2.5 text-[12.5px] text-slate-muted">
          <span className="mt-0.5 inline-block size-2 shrink-0 rounded-full" style={{ background: sm.renk }} />
          <span>
            {t("grafik.aciklama.1")} <b className="text-slate-ink">{t("grafik.aciklama.gozlemlenen")}</b> {t("grafik.aciklama.2")}{" "}
            <b className="text-slate-ink">{t("grafik.aciklama.tahmin")}</b> {t("grafik.aciklama.3")}
          </span>
        </div>
        <TrendGrafik
          noktalar={[]}
          seriler={[gercekSeri, tahminSeri, bantUstSeri]}
          renkler={["#2f6fed", "#dc2626", "#f59e0b"]}
          seriEtiketleri={[t("grafik.gozlem"), t("grafik.tahmin"), t("grafik.guvenUst")]}
          etiketler={etiketler}
          yukseklik={280}
        />
      </Panel>

      {/* ------------------------------------------------ Risk göstergeleri + zaman-dilimi dağılımı */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Risk & güven gauge'ları (2 sütun) */}
        <motion.div className="lg:col-span-2" initial={{ y: 8 }} animate={{ y: 0 }}>
          <Panel baslik={tr ? "Öngörülen risk & tahmin güveni" : "Predicted risk & forecast confidence"}>
            <p className="mb-2 text-[13px] text-slate-muted">
              {tr
                ? "Öngörülen zirvenin temel eşiğe oranından türetilen risk olasılığı ve güven bandı darlığından türetilen tahmin güveni."
                : "Risk probability derived from the predicted peak relative to the baseline threshold, and forecast confidence from the tightness of the confidence band."}
            </p>
            <div className="grid grid-cols-2 place-items-center gap-2 py-2">
              <div className="flex flex-col items-center">
                <GaugeGost
                  deger={gorsel.riskOlasilik}
                  etiket={tr ? "risk olasılığı" : "risk probability"}
                  renk={
                    uyari.siddet === "kritik"
                      ? "#dc2626"
                      : uyari.siddet === "uyari"
                        ? "#d97706"
                        : "#2f6fed"
                  }
                />
                <span className="mt-1 text-[12px] font-medium text-slate-muted">
                  {uyari.tetiklendi ? siddetEtiket : t("stat.sakin")}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <GaugeGost deger={gorsel.guvenSkor} etiket={tr ? "tahmin güveni" : "forecast confidence"} />
                <span className="mt-1 text-[12px] font-medium text-slate-muted">
                  {t(`trend.${tahmin.trendYonu}`)}
                </span>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* Zaman-dilimi olasılık dağılımı (3 sütun, donut) */}
        <motion.div className="lg:col-span-3" initial={{ y: 8 }} animate={{ y: 0 }}>
          <Panel baslik={tr ? "Beklenen risk — zaman dilimi dağılımı" : "Expected risk — time-of-day distribution"}>
            <p className="mb-4 text-[13px] text-slate-muted">
              {tr
                ? "Günü dört dilime böler; gözlemlenen saatlik profile göre saldırı baskısının hangi pencerede yoğunlaştığını gösterir."
                : "Splits the day into four windows and shows where attack pressure concentrates based on the observed hourly profile."}
            </p>
            {gorsel.dilimler.some((d) => d.deger > 0) ? (
              <DonutDagilim segmentler={gorsel.dilimler} />
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-line py-10 text-center text-[13px] text-slate-faint">
                {tr ? "Dağılım için henüz yeterli profil verisi yok." : "Not enough profile data for a distribution yet."}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>

      {/* ------------------------------------------------ Gün × saat-bloğu beklenen risk ısı-matrisi */}
      <motion.div initial={{ y: 8 }} animate={{ y: 0 }}>
        <Panel baslik={tr ? "Gün × saat-bloğu beklenen risk matrisi" : "Day × time-block expected-risk matrix"}>
          <p className="mb-4 text-[13px] text-slate-muted">
            {tr
              ? "Gözlemlenen saldırı baskısı, gün ve dört saat-bloğuna göre bir ısı matrisinde. Koyu hücreler o pencerede beklenen yüksek riski işaret eder."
              : "Observed attack pressure laid out across days and four time blocks. Darker cells mark higher expected risk in that window."}
          </p>
          {gorsel.matris.some((r) => r.some((v) => v > 0)) ? (
            <IsiMatris
              satirlar={gorsel.matrisSatir}
              sutunlar={gorsel.matrisSutun}
              degerler={gorsel.matris}
            />
          ) : (
            <div className="grid place-items-center rounded-xl border border-dashed border-line py-10 text-center text-[13px] text-slate-faint">
              {tr ? "Matris için henüz yeterli saatlik veri yok." : "Not enough hourly data for the matrix yet."}
            </div>
          )}
        </Panel>
      </motion.div>

      {/* ------------------------------------------------ Saat-bazlı ısı profili + günlük bağlam */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Isı profili (3 sütun) */}
        <div className="lg:col-span-3">
          <Panel baslik={t("isi.baslik")}>
            {mevsim.yeterli ? (
              <>
                <p className="mb-4 text-[13px] text-slate-muted">
                  {t("isi.aciklama.1")}{" "}
                  {mevsim.zirveSaat !== null && (
                    <>
                      {t("isi.aciklama.enYogun").replace("{saat}", saatEtiket(mevsim.zirveSaat))}{" "}
                    </>
                  )}
                  {t("isi.aciklama.2")}
                </p>
                <div className="flex items-end gap-1" style={{ height: 150 }}>
                  {mevsim.profil.map((v, s) => {
                    const yogun = mevsim.yogunSaatler.includes(s);
                    const zirve = mevsim.zirveSaat === s;
                    const h = (v / isiMax) * 100;
                    return (
                      <div key={s} className="group relative flex flex-1 flex-col justify-end" style={{ height: "100%" }}>
                        <div
                          className="w-full rounded-t transition-all group-hover:opacity-80"
                          style={{
                            height: `${Math.max(2, h)}%`,
                            background: zirve ? "#dc2626" : yogun ? "#f59e0b" : "#c7d2e8",
                          }}
                        />
                        {/* hover değeri */}
                        <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2 py-1 text-[11px] shadow-lift backdrop-blur-sm group-hover:block">
                          <div className="font-medium text-slate-ink">{saatEtiket(s)}</div>
                          <div className="text-slate-muted">{t("isi.hoverOlay").replace("{n}", v.toFixed(1))}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* saat ekseni (0,6,12,18,23) */}
                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-faint">
                  {[0, 6, 12, 18, 23].map((s) => (
                    <span key={s}>{saatEtiket(s)}</span>
                  ))}
                </div>
                {/* yoğun saatler rozetleri */}
                {mevsim.yogunSaatler.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-medium text-slate-muted">{t("isi.yogunPencereler")}</span>
                    {mevsim.yogunSaatler.map((s) => (
                      <Badge key={s} ton={mevsim.zirveSaat === s ? "kirmizi" : "sari"}>
                        {saatEtiket(s)}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-line py-12 text-center text-[13px] text-slate-faint">
                <div>
                  <Clock className="mx-auto mb-2 size-6 text-slate-faint" />
                  {t("isi.bos.1")}
                  <br />
                  {t("isi.bos.2")}
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Günlük bağlam (2 sütun) */}
        <div className="lg:col-span-2">
          <Panel baslik={t("gunluk.baslik")}>
            <p className="mb-3 text-[13px] text-slate-muted">
              {t("gunluk.aciklama")}
            </p>
            <TrendGrafik
              noktalar={[]}
              seriler={[gunGercek, gunTahmin]}
              renkler={["#2f6fed", "#dc2626"]}
              seriEtiketleri={[t("gunluk.gozlem"), t("gunluk.tahmin")]}
              etiketler={gunEtiket}
              yukseklik={190}
            />
            <div className="mt-3 flex items-center justify-between rounded-xl bg-canvas/50 px-4 py-2.5 text-[12.5px]">
              <span className="text-slate-muted">{t("gunluk.7gunSonrasi")}</span>
              <span className="font-semibold tabular-nums text-slate-ink">
                {t("gunluk.olayGun").replace("{n}", nf(gunlukTahmin.tahmin[gunlukTahmin.tahmin.length - 1] ?? 0))}
              </span>
            </div>
          </Panel>
        </div>
      </div>

      {/* ------------------------------------------------ Ne yapmalı önerileri */}
      <Panel baslik={t("oneri.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {oneriler(uyari, tahmin, mevsim, t).map((o, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                o.oncelik === "yuksek" ? "border-red-200 bg-danger-soft/40" : o.oncelik === "orta" ? "border-amber-200 bg-warn-soft/40" : "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl",
                  o.oncelik === "yuksek" ? "bg-danger-soft text-danger2" : o.oncelik === "orta" ? "bg-warn-soft text-warn" : "bg-brand-50 text-brand-600",
                )}
              >
                {o.ikon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-ink">{o.baslik}</span>
                  {o.oncelik === "yuksek" && <Badge ton="kirmizi">{t("oneri.oncelikli")}</Badge>}
                </div>
                <p className="mt-1 text-[12.5px] text-slate-muted">{o.aciklama}</p>
                {o.href && (
                  <Button variant="outline" size="sm" href={o.href} className="mt-3">
                    {o.link} <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ------------------------------------------------ Yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Gauge className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span>
          {t("yontem.1")} <b className="text-slate-ink">{t("yontem.holt")}</b> {t("yontem.2")}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Öneri üretimi (tahmine bağlı) */

interface Oneri {
  baslik: string;
  aciklama: string;
  ikon: React.ReactNode;
  oncelik: "yuksek" | "orta" | "dusuk";
  href?: string;
  link?: string;
}

function oneriler(
  uyari: ErkenUyari,
  tahmin: TahminSonuc,
  mevsim: MevsimsellikSonuc,
  t: (anahtar: string) => string,
): Oneri[] {
  const liste: Oneri[] = [];

  // 1) Dalga yaklaşıyorsa: kuralları önceden sıkılaştır.
  if (uyari.tetiklendi) {
    liste.push({
      baslik: uyari.siddet === "kritik" ? t("oneri.simdiSikilastir.baslik") : t("oneri.oncedenSikilastir.baslik"),
      aciklama:
        uyari.zirveKova && uyari.zirveKova > 0
          ? t("oneri.sikilastir.aciklama.zirve").replace("{saat}", String(uyari.zirveKova))
          : t("oneri.sikilastir.aciklama.aktif"),
      ikon: <ShieldCheck className="size-4" />,
      oncelik: uyari.siddet === "kritik" ? "yuksek" : "orta",
      href: "/panel/kural-oneri",
      link: t("oneri.sikilastir.link"),
    });

    // 2) Adaptif zorluğu yükselt.
    liste.push({
      baslik: t("oneri.zorluk.baslik"),
      aciklama: t("oneri.zorluk.aciklama"),
      ikon: <Gauge className="size-4" />,
      oncelik: uyari.siddet === "kritik" ? "yuksek" : "orta",
      href: "/panel/zorluk",
      link: t("oneri.zorluk.link"),
    });
  } else {
    // Sakin durumda: hazır ol / gözlem öner.
    liste.push({
      baslik: t("oneri.sakin.baslik"),
      aciklama: t("oneri.sakin.aciklama"),
      ikon: <CheckCircle2 className="size-4" />,
      oncelik: "dusuk",
      href: "/panel/kural-oneri",
      link: t("oneri.sakin.link"),
    });
  }

  // 3) Trend artıyorsa ölçekleme uyarısı.
  if (tahmin.trendYonu === "artıyor") {
    liste.push({
      baslik: t("oneri.trend.baslik"),
      aciklama: t("oneri.trend.aciklama").replace("{ivme}", tahmin.ivme.toFixed(1)),
      ikon: <TrendingUp className="size-4" />,
      oncelik: "orta",
      href: "/panel/rate-politika",
      link: t("oneri.trend.link"),
    });
  }

  // 4) Mevsimsel pencere önerisi.
  if (mevsim.yeterli && mevsim.zirveSaat !== null) {
    liste.push({
      baslik: t("oneri.zirvePencere.baslik").replace("{saat}", saatEtiket(mevsim.zirveSaat)),
      aciklama: t("oneri.zirvePencere.aciklama"),
      ikon: <Clock className="size-4" />,
      oncelik: "dusuk",
      href: "/panel/zorluk",
      link: t("oneri.zirvePencere.link"),
    });
  }

  return liste;
}
