"use client";

/**
 * Adaptif Zorluk A/B Optimizasyon Motoru — İstemci
 * ================================================
 * Optimizely/VWO tarzı deneyleme deneyimi, güvenliğe uygulanmış: yarışan zorluk
 * politikalarını gerçek trafiğe göre karşılaştırır, kazananı istatistiksel olarak
 * gösterir ve uygulanabilir öneri sunar. Grafikler elle inline SVG.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal, Trophy, Shield, UserCheck, Sigma, Target, Info,
  ArrowRight, TrendingDown, Gauge, CheckCircle2, AlertTriangle,
  Scale, Radar as RadarIkon, GitBranch, PieChart,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { Gauge as GaugeGost, RadarGrafik } from "@/components/panel/grafikler-ek";
import { DonutDagilim, TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { optimCeviri } from "./zorluk-optim.i18n";
import type { PolitikaSonuc, KazananSonuc, Oneri, Politika } from "./optim";

interface Props {
  sonuclar: PolitikaSonuc[];
  kazanan: KazananSonuc | null;
  oneri: Oneri | null;
  olaySayisi: number;
  dil: Dil;
}

const yuzde = (v: number, k = 1) => `${(v * 100).toFixed(k)}%`;

/** Dil → BCP-47 sayı/tarih biçimlendirme yereli. */
const YEREL: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

export function ZorlukOptimIstemci({ sonuclar, kazanan, oneri, olaySayisi, dil }: Props) {
  const t = (anahtar: string) => optimCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const sayi = (n: number) => n.toLocaleString(yerel);

  // ENUM GÜVENLİĞİ: politika id enum'dur; ad/açıklama key-map ile çevrilir.
  const polAd = (p: Politika) => t(`pol.ad.${p.id}`);
  const polAcik = (p: Politika) => t(`pol.acik.${p.id}`);
  const kazananId = kazanan?.kazanan.politika.id ?? null;
  const [seciliId, setSeciliId] = useState<string | null>(kazananId);
  const secili = sonuclar.find((s) => s.politika.id === seciliId) ?? kazanan?.kazanan ?? sonuclar[0] ?? null;

  const botToplam = sonuclar[0]?.botToplam ?? 0;
  const insanToplam = sonuclar[0]?.insanToplam ?? 0;

  // ---- Görsel türetmeler (yalnızca sunum; çekirdek veri/mantık değişmez) ----
  // Politikaların agresiflik (bot eşik) ekseni boyunca zorluk seviye dağılımı:
  // düşük / orta / yüksek zorluk bantlarına göre gruplanır (donut).
  const zorlukDagilim = useMemo(() => {
    const bant = (esik: number) => (esik < 0.4 ? "dusuk" : esik < 0.65 ? "orta" : "yuksek");
    const say = { dusuk: 0, orta: 0, yuksek: 0 };
    sonuclar.forEach((s) => {
      say[bant(s.politika.botEsik)] += 1;
    });
    return [
      { etiket: t("dagilim.dusuk"), deger: say.dusuk, renk: "#16a34a" },
      { etiket: t("dagilim.orta"), deger: say.orta, renk: "#2f6fed" },
      { etiket: t("dagilim.yuksek"), deger: say.yuksek, renk: "#dc2626" },
    ].filter((seg) => seg.deger > 0);
  }, [sonuclar, t]);

  // Başarı / sürtünme dengesi (0..100): kazananın bot yakalaması ile insan
  // sürtünmesinin dengelenmiş kompozit skoru — yüksek = iyi denge.
  const dengeSkoru = kazanan
    ? Math.round(
        Math.max(0, Math.min(100, kazanan.kazanan.botYakalama * 100 - kazanan.kazanan.insanSurtunmesi * 120)),
      )
    : 0;

  // Adaptif eğri: bot eşiği yükseldikçe bot yakalama ↑ ama insan sürtünmesi ↑.
  // Politikaları eşiğe göre sıralayıp iki seri olarak çizeriz.
  const adaptifSirali = useMemo(
    () => [...sonuclar].sort((a, b) => a.politika.botEsik - b.politika.botEsik),
    [sonuclar],
  );

  // Optimizasyon radarı: seçili politikanın çok-eksenli profili (0..100).
  const radarEksenleri = useMemo(() => {
    if (!secili) return [];
    const donKaybi = Math.max(0, Math.min(100, 100 - secili.tahminiDonusumKaybi * 8));
    const kapsama = botToplam > 0 ? (secili.botDurdurulan / botToplam) * 100 : 0;
    return [
      { etiket: t("radar.botYakalama"), deger: secili.botYakalama * 100 },
      { etiket: t("radar.insanDostu"), deger: Math.max(0, 100 - secili.insanSurtunmesi * 140) },
      { etiket: t("radar.donusum"), deger: donKaybi },
      { etiket: t("radar.kapsama"), deger: kapsama },
      { etiket: t("radar.netSkor"), deger: Math.max(0, Math.min(100, secili.netSkor)) },
    ];
  }, [secili, botToplam, t]);

  if (olaySayisi === 0 || !kazanan) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-10 lg:px-10">
        <Panel baslik={t("bos.baslik")}>
          <div className="py-12 text-center">
            <SlidersHorizontal className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="text-sm text-slate-muted">{t("bos.metin")}</p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş / motor açıklaması */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sigma className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("giris.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {sonuclar.length} {t("giris.metin.a")}{" "}
            <span className="font-semibold text-slate-ink num">{sayi(olaySayisi)}</span> {t("giris.metin.b")}{" "}
            <span className="font-medium">{t("giris.objektif")}</span>.{" "}
            {t("giris.metin.c")}
          </p>
        </div>
      </div>

      {/* ÖZET — kazanan */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={polAd(kazanan.kazanan.politika)}
          etiket={t("ozet.kazanan")}
          ikon={<Trophy className="size-5" />}
          tone="brand"
        />
        <StatKart
          sayi={`%${kazanan.guven.toFixed(0)}`}
          etiket={kazanan.anlamli ? t("ozet.guven.anlamli") : t("ozet.guven.yetersiz")}
          ikon={<Gauge className="size-5" />}
          tone={kazanan.anlamli ? "ok" : "warn"}
        />
        <StatKart
          sayi={yuzde(kazanan.kazanan.botYakalama, 0)}
          etiket={t("ozet.botYakalama")}
          ikon={<Shield className="size-5" />}
          tone="ok"
        />
        <StatKart
          sayi={yuzde(kazanan.kazanan.insanSurtunmesi, 1)}
          etiket={t("ozet.insanSurtunmesi")}
          ikon={<UserCheck className="size-5" />}
          tone={kazanan.kazanan.insanSurtunmesi > 0.1 ? "warn" : "ok"}
        />
      </div>

      {/* GÖRSEL ŞERİT — zorluk dağılım donut + denge gauge + adaptif eğri */}
      <div className="grid gap-4 lg:grid-cols-[260px_260px_1fr]">
        {/* Zorluk seviye dağılımı (donut) */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
            <PieChart className="size-4 text-brand-600" /> {t("gorsel.dagilimBaslik")}
          </div>
          <div className="mt-2 grid place-items-center">
            <DonutDagilim segmentler={zorlukDagilim} merkezEtiket={t("gorsel.politika")} />
          </div>
        </motion.div>

        {/* Başarı / sürtünme dengesi (gauge) */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
            <Scale className="size-4 text-brand-600" /> {t("gorsel.dengeBaslik")}
          </div>
          <div className="mt-2 flex flex-col items-center">
            <GaugeGost deger={dengeSkoru} etiket={t("gorsel.denge")} boyut={168} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-ok-soft px-2 py-2">
              <div className="num text-sm font-bold text-ok">{yuzde(kazanan.kazanan.botYakalama, 0)}</div>
              <div className="text-[10px] text-green-700">{t("gorsel.yakalama")}</div>
            </div>
            <div className="rounded-xl bg-warn-soft px-2 py-2">
              <div className="num text-sm font-bold text-warn">{yuzde(kazanan.kazanan.insanSurtunmesi, 1)}</div>
              <div className="text-[10px] text-amber-700">{t("gorsel.surtunme")}</div>
            </div>
          </div>
        </motion.div>

        {/* Adaptif eğri — eşik yükseldikçe yakalama vs sürtünme */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
              <GitBranch className="size-4 text-brand-600" /> {t("gorsel.adaptifBaslik")}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-faint">
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-1.5 w-3 rounded-full bg-ok" /> {t("gorsel.yakalama")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-1.5 w-3 rounded-full bg-warn" /> {t("gorsel.surtunme")}</span>
            </div>
          </div>
          <div className="mt-1">
            <TrendGrafik
              noktalar={[]}
              yukseklik={168}
              seriler={[
                adaptifSirali.map((s) => Math.round(s.botYakalama * 100)),
                adaptifSirali.map((s) => Math.round(s.insanSurtunmesi * 100)),
              ]}
              renkler={["#16a34a", "#d97706"]}
              seriEtiketleri={[t("gorsel.yakalama"), t("gorsel.surtunme")]}
              etiketler={adaptifSirali.map((s) => s.politika.botEsik.toFixed(2))}
            />
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-muted">{t("gorsel.adaptifNot")}</p>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* POLİTİKA KARŞILAŞTIRMA */}
        <Panel baslik={t("kars.baslik")} padding={false}>
          <div className="divide-y divide-line">
            {[...sonuclar]
              .sort((a, b) => b.netSkor - a.netSkor)
              .map((s) => {
                const kazandi = s.politika.id === kazananId;
                const secildi = s.politika.id === seciliId;
                return (
                  <button
                    key={s.politika.id}
                    onClick={() => setSeciliId(s.politika.id)}
                    className={cn(
                      "w-full px-5 py-4 text-left transition hover:bg-canvas/50",
                      secildi && "bg-brand-50/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-ink">{polAd(s.politika)}</span>
                        {kazandi && (
                          <Badge ton="yesil">
                            <Trophy className="size-3" /> {t("kars.kazanan")}
                          </Badge>
                        )}
                        <span className="text-[11.5px] text-slate-faint">{t("kars.esik").replace("{n}", s.politika.botEsik.toFixed(2))}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-faint">{t("kars.net")}</span>
                        <span
                          className={cn(
                            "num text-[15px] font-bold",
                            kazandi ? "text-brand-700" : "text-slate-ink",
                          )}
                        >
                          {s.netSkor.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Bot yakalama çubuğu (yeşil) */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11.5px]">
                          <span className="flex items-center gap-1 text-slate-muted">
                            <Shield className="size-3 text-ok" /> {t("kars.botYakalama")}
                          </span>
                          <span className="num font-medium text-slate-ink">{yuzde(s.botYakalama)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full bg-ok" style={{ width: yuzde(s.botYakalama, 0) }} />
                        </div>
                      </div>
                      {/* İnsan sürtünmesi çubuğu (amber) */}
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11.5px]">
                          <span className="flex items-center gap-1 text-slate-muted">
                            <UserCheck className="size-3 text-warn" /> {t("kars.insanSurtunmesi")}
                          </span>
                          <span className="num font-medium text-slate-ink">{yuzde(s.insanSurtunmesi)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full bg-warn" style={{ width: yuzde(s.insanSurtunmesi, 0) }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-4 text-[11.5px] text-slate-muted">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="size-3 text-danger2" />
                        {t("kars.donusumKaybi")}{" "}
                        <span className="num font-medium text-slate-ink">%{s.tahminiDonusumKaybi.toFixed(1)}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </Panel>

        {/* KADRAN GRAFİĞİ (scatter) */}
        <div className="space-y-6">
          <Panel baslik={t("kadran.baslik")}>
            <KadranGrafik sonuclar={sonuclar} kazananId={kazananId} seciliId={seciliId} onSec={setSeciliId} t={t} polAd={polAd} />
            <p className="mt-3 text-[12px] leading-relaxed text-slate-muted">
              {t("kadran.aciklama.a")}{" "}
              <span className="font-medium text-ok">{t("kadran.aciklama.solust")}</span> {t("kadran.aciklama.b")}
            </p>
          </Panel>

          {/* Seçili politika detayı */}
          {secili && (
            <Panel baslik={t("detay.baslik").replace("{n}", polAd(secili.politika))}>
              <p className="text-[13px] leading-relaxed text-slate-muted">{polAcik(secili.politika)}</p>
              {/* Optimizasyon radarı — çok-eksenli profil */}
              {radarEksenleri.length >= 3 && (
                <div className="mt-3 flex flex-col items-center rounded-2xl bg-canvas/40 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-muted">
                    <RadarIkon className="size-3.5 text-brand-600" /> {t("radar.baslik")}
                  </div>
                  <RadarGrafik eksenler={radarEksenleri} boyut={210} />
                </div>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <DetaySatir e={t("detay.botEsik")} v={secili.politika.botEsik.toFixed(2)} />
                <DetaySatir e={t("detay.agresiflik")} v={yuzde(secili.politika.agresiflik, 0)} />
                <DetaySatir e={t("detay.durdurulanBot")} v={`${secili.botDurdurulan} / ${botToplam}`} />
                <DetaySatir e={t("detay.surtunenInsan")} v={`${secili.insanSurtunen} / ${insanToplam}`} />
                <DetaySatir e={t("detay.dokunulanIstek")} v={sayi(secili.dokunulan)} />
                <DetaySatir e={t("detay.netSkor")} v={secili.netSkor.toFixed(1)} vurgu />
              </dl>
            </Panel>
          )}
        </div>
      </div>

      {/* KAZANAN & ÖNERİ */}
      <Panel
        baslik={t("kazoneri.baslik")}
        sagUst={
          kazanan.anlamli ? (
            <Badge ton="yesil">
              <CheckCircle2 className="size-3" /> {t("kazoneri.anlamli")}
            </Badge>
          ) : (
            <Badge ton="sari">
              <AlertTriangle className="size-3" /> {t("kazoneri.dahaVeri")}
            </Badge>
          )
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Trophy className="size-6" />
              </span>
              <div>
                <div className="text-lg font-semibold text-slate-ink">{polAd(kazanan.kazanan.politika)}</div>
                <div className="text-[13px] text-slate-muted">
                  {kazanan.ikinci ? (
                    <>
                      {t("kazoneri.runnerUp")} <span className="font-medium text-slate-ink">{polAd(kazanan.ikinci.politika)}</span> ·{" "}
                      {t("kazoneri.netFark.a")} <span className="num font-medium text-slate-ink">{kazanan.fark.toFixed(1)}</span> {t("kazoneri.netFark.b")}
                    </>
                  ) : (
                    t("kazoneri.tekPolitika")
                  )}
                </div>
              </div>
            </div>

            {/* ENUM GÜVENLİĞİ: gerekçe cümlesi kazanan'ın yapısal alanlarından yeniden kurulur. */}
            <p className="text-[14px] leading-relaxed text-slate-ink">
              {(kazanan.ikinci
                ? t(kazanan.anlamli ? "gerekce.anlamli" : "gerekce.belirsiz")
                    .replace("{ad}", polAd(kazanan.kazanan.politika))
                    .replace("{fark}", kazanan.fark.toFixed(1))
                    .replace("{guven}", kazanan.guven.toFixed(0))
                : t("gerekce.tekPolitika"))}
            </p>

            {/* İstatistiksel kanıt */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-canvas/40 p-4 sm:grid-cols-4">
              <IstSatir
                e={t("ist.guven")}
                v={`%${kazanan.guven.toFixed(1)}`}
                ton={kazanan.anlamli ? "ok" : "warn"}
              />
              <IstSatir e={t("ist.pDegeri")} v={kazanan.analiz.pDegeri.toFixed(4)} />
              <IstSatir
                e={t("ist.ci")}
                v={`%${(kazanan.yakalamaCi.alt * 100).toFixed(0)}–%${(kazanan.yakalamaCi.ust * 100).toFixed(0)}`}
              />
              <IstSatir
                e={t("ist.guc")}
                v={`%${kazanan.analiz.guc.toFixed(0)}`}
                ton={kazanan.analiz.yeterliOrnek ? "ok" : "warn"}
              />
            </div>

            {!kazanan.anlamli && (
              <NotKutusu ton="sari" baslik={t("not.baslik")}>
                {t("not.metin").replace("{guven}", kazanan.guven.toFixed(0))}
              </NotKutusu>
            )}
          </div>

          {/* Öneri kartı + CTA */}
          {oneri && (
            <div className="flex flex-col rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-brand-600" />
                <span className="text-[13px] font-semibold text-brand-700">{t("oneri.baslik")}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[13px] text-slate-muted">{t("oneri.botEsik")}</span>
                <span className="num text-3xl font-bold text-slate-ink">{oneri.onerilenEsik.toFixed(2)}</span>
              </div>
              {/* ENUM GÜVENLİĞİ: öneri metni oneri.yapisal alanlarından yeniden kurulur. */}
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate-muted">
                {t(oneri.guvenli ? "onerimetin.anlamli" : "onerimetin.belirsiz")
                  .replace("{ad}", polAd(oneri.politika))
                  .replace("{esik}", oneri.onerilenEsik.toFixed(2))
                  .replace("{yakalama}", oneri.yapisal.yakalamaYuzde)
                  .replace("{surtunme}", oneri.yapisal.surtunmeYuzde)
                  .replace("{ciAlt}", oneri.yapisal.ciAlt)
                  .replace("{ciUst}", oneri.yapisal.ciUst)
                  .replace("{guven}", oneri.yapisal.guven)}
              </p>
              <Button
                href="/panel/zorluk"
                variant={oneri.guvenli ? "accent" : "outline"}
                className="mt-4 w-full"
              >
                {oneri.guvenli ? t("oneri.uygula") : t("oneri.zorlukGor")}
                <ArrowRight className="size-4" />
              </Button>
              {!oneri.guvenli && (
                <p className="mt-2 text-center text-[11.5px] text-slate-faint">
                  {t("oneri.guvensizNot")}
                </p>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* SİMÜLASYON AÇIKLAMASI — dürüstlük */}
      <Panel baslik={t("sim.baslik")}>
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-slate-faint" />
          <div className="space-y-3 text-[13px] leading-relaxed text-slate-muted">
            <p>
              {t("sim.p1.a")} <span className="font-semibold text-slate-ink">{t("sim.p1.vurgu")}</span>{t("sim.p1.b")}{" "}
              <span className="num font-medium text-slate-ink">{sayi(olaySayisi)}</span> {t("sim.p1.c")}{" "}
              <span className="font-medium text-slate-ink">{t("sim.p1.replay")}</span>{t("sim.p1.d")}
            </p>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
                <span>
                  {t("sim.li1").split("{bot}")[0]}
                  <span className="font-medium text-slate-ink">{t("sim.li1.bot")}</span>
                  {t("sim.li1").split("{bot}")[1]}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ok" />
                <span>
                  {t("sim.li2.a")}{" "}
                  <span className="font-medium text-slate-ink">{t("sim.li2.vurgu")}</span> {t("sim.li2.b")}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn" />
                <span>
                  {t("sim.li3.a")} <span className="font-medium text-slate-ink">{t("sim.li3.vurgu")}</span>{" "}
                  {t("sim.li3.b")}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>
                  {t("sim.li4.a")}{" "}
                  <span className="font-medium text-slate-ink">{t("sim.li4.vurgu")}</span> {t("sim.li4.b")}
                </span>
              </li>
            </ul>
            <p className="text-[12px] text-slate-faint">
              {t("sim.not.a")}{" "}
              <a href="/panel/deney-analiz" className="font-medium text-brand-600 hover:underline">
                {t("sim.not.link")}
              </a>{" "}
              {t("sim.not.b")}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Kadran grafiği */

function KadranGrafik({
  sonuclar,
  kazananId,
  seciliId,
  onSec,
  t,
  polAd,
}: {
  sonuclar: PolitikaSonuc[];
  kazananId: string | null;
  seciliId: string | null;
  onSec: (id: string) => void;
  t: (anahtar: string) => string;
  polAd: (p: Politika) => string;
}) {
  const W = 320;
  const H = 260;
  const P = 34; // kenar boşluğu
  const iW = W - P * 2;
  const iH = H - P * 2;

  // X = insan sürtünmesi (0 sol → 1 sağ), Y = bot yakalama (0 alt → 1 üst).
  // En iyi = sol-üst. Sürtünme eksenini 0..en fazla, ama en az %60'lık alan ver.
  const maxSurtunme = Math.max(0.6, ...sonuclar.map((s) => s.insanSurtunmesi));
  // Nokta yarıçapı en fazla 7; merkezi (r + etiket/pay) kadar çizim alanına
  // kıstır ki daireler ve etiketleri çerçeve dışına taşmasın.
  const NOKTA_PAY = 12;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const x = (surtunme: number) =>
    clamp(P + (surtunme / maxSurtunme) * iW, P + NOKTA_PAY, W - P - NOKTA_PAY);
  const y = (yakalama: number) =>
    clamp(P + (1 - yakalama) * iH, P + NOKTA_PAY + 8, H - P - NOKTA_PAY);

  // Halo (zemin/krem renginde stroke) — etiket okunurluğu için ortak stil.
  const KREM = "#faf9f4";

  // Etiket çakışma çözümü: noktaları önce çiz, etiketleri konuma göre akıllı
  // yerleştir (üst yarıdaysa altına, alt yarıdaysa üstüne; sol/sağ yarıya göre
  // hizala) + daha önce yerleştirilmiş bir etikete yakınsa dikey olarak kaydır.
  const ortaY = P + iH / 2;
  const ortaX = P + iW / 2;
  const yerlesmis: { lx: number; ly: number }[] = [];
  const etiketKonum = (cx: number, cy: number, r: number) => {
    const ustYari = cy < ortaY;
    // Üst yarıdaki nokta → etiket altına; alt yarıdaki → üstüne (çerçeveye çarpmasın)
    let ly = ustYari ? cy + r + 11 : cy - r - 6;
    const anchor: "start" | "middle" | "end" = cx < ortaX - 20 ? "start" : cx > ortaX + 20 ? "end" : "middle";
    const lx = anchor === "start" ? cx - r - 2 : anchor === "end" ? cx + r + 2 : cx;
    // Çakışma: yakın x ve yakın y'de bir etiket varsa 12px aşağı it (gerekirse yukarı)
    let guard = 0;
    while (guard < 6 && yerlesmis.some((p) => Math.abs(p.lx - lx) < 60 && Math.abs(p.ly - ly) < 11)) {
      ly = ustYari ? ly + 12 : ly - 12;
      guard++;
    }
    // Çerçeve içinde tut
    ly = clamp(ly, P + 8, H - P - 2);
    yerlesmis.push({ lx, ly });
    return { lx, ly, anchor };
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full" role="img" aria-label={t("kadran.aria")}>
      {/* İyi bölge (sol-üst) hafif yeşil dolgu */}
      <rect x={P} y={P} width={iW / 2} height={iH / 2} fill="#16a34a" opacity={0.06} />
      <text
        x={P + 4}
        y={P + 12}
        fontSize="9"
        fill="#16a34a"
        fontWeight="600"
        paintOrder="stroke"
        stroke={KREM}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        {t("kadran.enIyiBolge")}
      </text>

      {/* Izgara + eksenler */}
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#e2e8f0" strokeWidth="1" />
      {/* Orta çizgiler */}
      <line x1={P + iW / 2} y1={P} x2={P + iW / 2} y2={H - P} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={P} y1={P + iH / 2} x2={W - P} y2={P + iH / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

      {/* Eksen etiketleri */}
      <text x={P - 6} y={P + 4} fontSize="8" fill="#94a3b8" textAnchor="end">
        %100
      </text>
      <text x={P - 6} y={H - P} fontSize="8" fill="#94a3b8" textAnchor="end">
        %0
      </text>
      <text
        x={12}
        y={H / 2}
        fontSize="9"
        fill="#64748b"
        textAnchor="middle"
        transform={`rotate(-90 12 ${H / 2})`}
        fontWeight="600"
      >
        {t("kadran.eksen.bot")}
      </text>
      <text x={W / 2} y={H - 6} fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="600">
        {t("kadran.eksen.insan")}
      </text>

      {/* Noktalar */}
      {sonuclar.map((s) => {
        const cx = x(s.insanSurtunmesi);
        const cy = y(s.botYakalama);
        const kazandi = s.politika.id === kazananId;
        const secildi = s.politika.id === seciliId;
        const r = kazandi ? 7 : 5;
        const { lx, ly, anchor } = etiketKonum(cx, cy, r);
        return (
          <g key={s.politika.id} className="cursor-pointer" onClick={() => onSec(s.politika.id)}>
            {secildi && <circle cx={cx} cy={cy} r={10} fill="none" stroke="#4a41e8" strokeWidth="1.5" opacity={0.5} />}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={kazandi ? "#16a34a" : "#4a41e8"}
              opacity={0.85}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <text
              x={lx}
              y={ly}
              fontSize="8.5"
              fill="#334155"
              textAnchor={anchor}
              fontWeight={kazandi ? "700" : "500"}
              paintOrder="stroke"
              stroke={KREM}
              strokeWidth={3}
              strokeLinejoin="round"
            >
              {polAd(s.politika)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ Küçük yardımcılar */

function DetaySatir({ e, v, vurgu }: { e: string; v: string; vurgu?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-canvas/50 px-3 py-2">
      <dt className="text-slate-muted">{e}</dt>
      <dd className={cn("num font-medium", vurgu ? "text-brand-700" : "text-slate-ink")}>{v}</dd>
    </div>
  );
}

function IstSatir({ e, v, ton }: { e: string; v: string; ton?: "ok" | "warn" }) {
  const renk = ton === "ok" ? "text-ok" : ton === "warn" ? "text-warn" : "text-slate-ink";
  return (
    <div>
      <div className="text-[11px] text-slate-faint">{e}</div>
      <div className={cn("num text-[15px] font-bold", renk)}>{v}</div>
    </div>
  );
}
