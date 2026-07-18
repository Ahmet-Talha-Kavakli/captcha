"use client";

/**
 * Specter — Çapraz-Site Federe Korelasyon (Federated Threat Intelligence)
 * ======================================================================
 * Bir saldırgan tek sitende engellendiğinde vazgeçmez; aynı IP/ASN ile
 * DİĞER sitelerine geçer. Tek-site görünürlüğü bu yatay hedeflemeyi kaçırır:
 * her site kendi başına düşük risk görür, oysa AYNI saldırgan hesabındaki
 * birden çok siteyi vurmaktadır. Specter tüm sitelerini BİRLİKTE korur —
 * federe-korelasyon motoru (federeKorelasyon) çapraz-site varlıkları
 * (IP/ASN) birleştirir, yayılmayı ve KOORDİNASYON skorunu çıkarır. Tek
 * sitede görünmeyen kampanya, siteler arası görünür hale gelir.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `federe-korelasyon` motorundan
 * türetilir. page.tsx SERVER'da hesaplar, buraya hazır FedereRapor prop gelir.
 *
 * Tasarım: KorelasyonBolumu / IliskiGrafigiBolumu ile birebir aynı dil —
 * Panel + krem kartlar (bg-canvas), tabular-nums, rounded kartlar;
 * framer-motion rise (azHareket → sade). whileInView/viewport YOK.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Network,
  Globe,
  Boxes,
  Fingerprint,
  Server,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Crosshair,
  Radio,
  Bot,
  Layers,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { RadarGrafik, Gauge as GaugeGorsel } from "@/components/panel/grafikler-ek";
import type {
  FedereRapor,
  FedereVarlik,
  VarlikTip,
} from "@/lib/specter/federe-korelasyon";

/* ================================================================== Sabitler */

/** Baskın bot sınıfı → TR ad (bilinmeyenler ham gösterilir). */
const SINIF_AD: Record<string, string> = {
  scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik Denemesi",
  automation: "Otomasyon",
  ai_agent: "AI Ajanı",
  ddos: "DDoS",
  spam: "Spam",
  bot: "Bot",
  crawler: "Tarayıcı",
};

/** Varlık tipi → TR etiket + ikon. */
const TIP_TANIM: Record<VarlikTip, { ad: string; ikon: React.ElementType }> = {
  ip: { ad: "IP adresi", ikon: Fingerprint },
  asn: { ad: "ASN / Ağ", ikon: Server },
  parmakizi: { ad: "Cihaz parmak-izi", ikon: Fingerprint },
};

/** Tehdit seviyesi → renk paleti (hex + rozet tonu + etiket). */
const TEHDIT_TANIM: Record<
  FedereVarlik["tehdit"],
  { hex: string; rozet: "kirmizi" | "sari" | "yesil"; etiket: string }
> = {
  "kritik": { hex: "#dc2626", rozet: "kirmizi", etiket: "Kritik" },
  "yüksek": { hex: "#ea580c", rozet: "kirmizi", etiket: "Yüksek" },
  "orta":   { hex: "#d97706", rozet: "sari",    etiket: "Orta" },
  "düşük":  { hex: "#16a34a", rozet: "yesil",   etiket: "Düşük" },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

function sinifAd(s: string): string {
  return SINIF_AD[s] ?? s.replace(/_/g, " ");
}

/** Site id'sini kısa, okunur bir etikete indirger. */
function siteKisa(siteId: string): string {
  const s = siteId.replace(/^site_/, "");
  return s.length > 10 ? `${s.slice(0, 10)}…` : s;
}

/** Bölümü rise ile saran motion sarmalayıcı (KorelasyonBolumu ile aynı). */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok";
}) {
  const renk = ton === "danger" ? "text-danger2" : ton === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="text-[12px] tabular-nums text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Metrik hücresi */

function Metrik({
  ikon: Ikon,
  etiket,
  children,
}: {
  ikon: React.ElementType;
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-slate-ink">
        {children}
      </div>
    </div>
  );
}

/* ================================================================== Site dağılım görseli */

/**
 * Varlığın site-başına istek dağılımı: her site bir bar. Yayılma ne kadar
 * genişse (kaç farklı site) ve dengeli ise o kadar koordineli bir kampanya.
 * Sadece motorun ürettiği siteDagilim'i görselleştirir — sayı uydurma yok.
 */
function SiteDagilim({
  dagilim,
  hex,
  azHareket,
}: {
  dagilim: FedereVarlik["siteDagilim"];
  hex: string;
  azHareket: boolean;
}) {
  const maks = Math.max(1, ...dagilim.map((d) => d.istek));
  return (
    <div className="mt-3.5 border-t border-line/70 pt-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Layers className="size-3" />
        Site başına yayılma — bu saldırgan hangi siteleri vurdu
      </div>
      <div className="space-y-1.5">
        {dagilim.map((d, i) => {
          const oran = Math.round((d.istek / maks) * 100);
          return (
            <div key={d.siteId} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 truncate font-mono text-[11px] text-slate-muted" title={d.siteId}>
                {siteKisa(d.siteId)}
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: hex }}
                  initial={azHareket ? false : { width: 0 }}
                  animate={azHareket ? undefined : { width: `${Math.max(6, oran)}%` }}
                  transition={{ duration: 0.6, delay: azHareket ? 0 : 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-ink">
                {sayi(d.istek)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== Varlık kartı */

function VarlikKart({
  varlik,
  azHareket,
  acik,
  onToggle,
}: {
  varlik: FedereVarlik;
  azHareket: boolean;
  acik: boolean;
  onToggle: () => void;
}) {
  const tipTanim = TIP_TANIM[varlik.tip];
  const TipIkon = tipTanim.ikon;
  const tehdit = TEHDIT_TANIM[varlik.tehdit];
  const vurgulu = varlik.tehdit === "kritik" || varlik.tehdit === "yüksek";
  const kritik = varlik.tehdit === "kritik";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-canvas/40 p-4 pl-5 transition",
        vurgulu ? "border-red-200 bg-danger-soft/25" : "border-line",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
    >
      {/* Isı-renkli sol şerit — tehdit seviyesine göre (görsel sıcaklık ipucu) */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: tehdit.hex }}
        aria-hidden
      />

      {/* Üst şerit: varlık değeri + tip + tehdit + koordinasyon — TIKLANABİLİR (drill-down) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${varlik.deger} çapraz-site saldırgan detayını ${acik ? "kapat" : "aç"}`}
        className="flex w-full flex-wrap items-start justify-between gap-3 rounded-lg text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${tehdit.hex}14`,
              color: tehdit.hex,
              borderColor: `${tehdit.hex}33`,
            }}
          >
            <TipIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-mono text-[13px] font-semibold text-slate-ink">{varlik.deger}</span>
              <Badge ton={tehdit.rozet}>
                {kritik && <Flame className="size-3" />}
                {tehdit.etiket}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-slate-muted">
              {tipTanim.ad} · <span className="font-medium">{sinifAd(varlik.botClass)}</span>
            </p>
          </div>
        </div>

        {/* Koordinasyon skoru pili */}
        <div className="flex shrink-0 items-start gap-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <Crosshair className="size-3.5 text-slate-faint" />
              <span className="text-[15px] font-bold tabular-nums" style={{ color: tehdit.hex }}>
                %{varlik.koordinasyon}
              </span>
            </div>
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">koordinasyon</span>
          </div>
          <ChevronDown className={cn("mt-1 size-4 shrink-0 text-slate-faint transition-transform", acik && "rotate-180")} />
        </div>
      </button>

      {/* Drill-down detay — tıklayınca açılır */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3.5">
              {/* Federe olmanın özü: kaç siteye vurdu — büyük vurgu */}
              <div
                className="mb-3.5 flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ background: `${tehdit.hex}0d`, borderColor: `${tehdit.hex}2e` }}
              >
                <Share2 className="size-5 shrink-0" style={{ color: tehdit.hex }} />
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold leading-none tabular-nums" style={{ color: tehdit.hex }}>
                    {sayi(varlik.siteSayisi)}
                  </span>
                  <span className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: tehdit.hex }}>
                    siteye vurdu
                  </span>
                </div>
                <span className="ml-auto text-right text-[11px] leading-tight text-slate-muted">
                  Tek sitende engellensen bile
                  <br />
                  diğerlerine geçmeye çalıştı
                </span>
              </div>

              {/* Metrikler */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Metrik ikon={Network} etiket="Etkilenen site">
                  {sayi(varlik.siteSayisi)}
                </Metrik>
                <Metrik ikon={Boxes} etiket="Toplam istek">
                  {sayi(varlik.toplamIstek)}
                </Metrik>
                <Metrik ikon={Bot} etiket="Bot sınıfı">
                  <span className="truncate">{sinifAd(varlik.botClass)}</span>
                </Metrik>
                <Metrik ikon={Server} etiket="ASN">
                  <span className="truncate font-mono text-[12px]">{varlik.asn || "—"}</span>
                </Metrik>
              </div>

              {/* Kaynak ülke */}
              {varlik.country && (
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                    <Globe className="size-3" />
                    Kaynak
                  </span>
                  <Ulke kod={varlik.country} />
                </div>
              )}

              {/* Site başına dağılım görseli */}
              {varlik.siteDagilim.length > 0 && (
                <SiteDagilim dagilim={varlik.siteDagilim} hex={tehdit.hex} azHareket={azHareket} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kapalıyken ipucu */}
      {!acik && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Detay için tıklayın
        </p>
      )}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function FedereBolumu({ rapor, azHareket }: { rapor: FedereRapor; azHareket: boolean }) {
  const { cokSite, siteSayisi, ipVarliklar, asnVarliklar, ozet } = rapor;
  const [acikId, setAcikId] = useState<string | null>(null);

  // Çapraz-saldırgan IP + ASN varlıklarını birleştir, koordinasyona göre sırala, ilk 8.
  const tumVarliklar = [...ipVarliklar, ...asnVarliklar];
  const gosterilecek = [...tumVarliklar]
    .sort((a, b) => b.koordinasyon - a.koordinasyon || b.siteSayisi - a.siteSayisi)
    .slice(0, 8);
  const kritikVar = ozet.kritikVarlik > 0;

  /* --- Görsel özet türetimleri (yalnızca mevcut motor verisinden) --- */
  // Tehdit kategorisi radar profili: çapraz-site varlıkların bot sınıfı bazında
  // toplam isteği → her eksen 0-100'e normalize. "Bu topluluk hangi tehdit
  // kategorilerinde yoğunlaşıyor" profilini tek bakışta gösterir.
  const kategoriIstek = new Map<string, number>();
  for (const v of tumVarliklar) {
    kategoriIstek.set(v.botClass, (kategoriIstek.get(v.botClass) ?? 0) + v.toplamIstek);
  }
  const radarMaks = Math.max(1, ...kategoriIstek.values());
  const radarEksenler = [...kategoriIstek.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([sinif, istek]) => ({
      etiket: sinifAd(sinif),
      deger: Math.round((istek / radarMaks) * 100),
    }));

  // Federe katkı Gauge: koordineli kampanyaların ortalama koordinasyon skoru —
  // "topluluk istihbaratının bu tehditleri ne kadar net gördüğü".
  const ortKoordinasyon = tumVarliklar.length
    ? Math.round(tumVarliklar.reduce((a, v) => a + v.koordinasyon, 0) / tumVarliklar.length)
    : 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Share2} metin="Çapraz-Site Federe Korelasyon" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(siteSayisi)} site korunuyor</span>
            <Badge ton={kritikVar ? "kirmizi" : "brand"}>
              <Radio className="size-3" />
              Federe İstihbarat
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Bir saldırgan tek sitende engellendiğinde vazgeçmez — aynı IP/ASN ile
          diğer sitelerine de geçer. Veylify tüm sitelerini <span className="font-medium text-slate-ink">birlikte</span> korur:
          aynı saldırganın birden çok siteni vurduğunu tespit eder ve federe
          istihbarat üretir. Tek sitede görünmeyen kampanya, siteler arası görünür.
        </p>

        {cokSite ? (
          <>
            {/* Özet şeridi */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <OzetHap
                ikon={Crosshair}
                etiket="Çapraz-saldırgan"
                deger={sayi(ozet.caprazSaldirgan)}
                ton={ozet.caprazSaldirgan > 0 ? "danger" : "ink"}
              />
              <OzetHap
                ikon={Flame}
                etiket="Koordineli kampanya"
                deger={sayi(ozet.koordineliKampanya)}
                ton={ozet.koordineliKampanya > 0 ? "danger" : "ink"}
              />
              <OzetHap
                ikon={Share2}
                etiket="En geniş yayılma"
                deger={ozet.enGenisYayilma > 0 ? `${sayi(ozet.enGenisYayilma)} site` : "—"}
              />
              <OzetHap ikon={Network} etiket="Etkilenen site" deger={sayi(ozet.etkilenenSite)} />
            </div>

            {/* Ferah görsel özet: solda topluluk tehdit-kategorisi radar profili,
                sağda federe-katkı gauge. Bu bölümün görsel dili RADAR — diğer iki
                bölümden (donut) farklı. */}
            {radarEksenler.length >= 3 && (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                {/* Radar — çapraz-site topluluğun tehdit kategori profili */}
                <div className="rounded-2xl border border-line bg-canvas/40 p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                    <Crosshair className="size-3.5" />
                    Topluluk tehdit profili — hangi kategorilerde yoğunlaşıyor
                  </div>
                  <div className="grid place-items-center">
                    <RadarGrafik eksenler={radarEksenler} boyut={240} renk="#dc2626" />
                  </div>
                </div>

                {/* Federe katkı gauge + kısa anlatı */}
                <div className="grid place-items-center rounded-2xl border border-line bg-canvas/40 p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                    <Radio className="size-3.5" />
                    Ortalama koordinasyon
                  </div>
                  <GaugeGorsel
                    deger={ortKoordinasyon}
                    etiket={ortKoordinasyon >= 60 ? "koordineli kampanya" : ortKoordinasyon >= 30 ? "orta örtüşme" : "dağınık"}
                    boyut={170}
                    renk={ortKoordinasyon >= 60 ? "#dc2626" : ortKoordinasyon >= 30 ? "#d97706" : "#16a34a"}
                  />
                  <p className="mt-1 max-w-[15rem] text-center text-[11px] leading-snug text-slate-muted">
                    Çapraz-site varlıkların ortalama koordinasyon skoru — federe
                    istihbaratın bu tehditleri ne kadar net gördüğü.
                  </p>
                </div>
              </div>
            )}

            {/* Çapraz-saldırgan varlık kartları */}
            {gosterilecek.length === 0 ? (
              <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
                <ShieldCheck className="mb-2 size-7 text-ok" />
                <p className="text-[13px] font-medium text-slate-muted">Çapraz-site saldırgan yok</p>
                <p className="mt-0.5 text-[12px] text-slate-faint">
                  Aynı IP/ASN birden çok siteni vurmaya başladığında federe kampanyalar burada belirir.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {gosterilecek.map((v, i) => {
                  const anahtar = `${v.tip}-${v.deger}`;
                  return (
                    <Bolum key={anahtar} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.03}>
                      <VarlikKart
                        varlik={v}
                        azHareket={azHareket}
                        acik={acikId === anahtar}
                        onToggle={() => setAcikId(acikId === anahtar ? null : anahtar)}
                      />
                    </Bolum>
                  );
                })}
              </div>
            )}

            {/* Tehdit lejantı */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
              <span className="font-medium uppercase tracking-wide">Yayılma tehdidi:</span>
              {(["düşük", "orta", "yüksek", "kritik"] as FedereVarlik["tehdit"][]).map((t) => {
                const tan = TEHDIT_TANIM[t];
                return (
                  <span key={t} className="inline-flex items-center gap-1.5 text-slate-muted">
                    <span className="size-2.5 rounded-full" style={{ background: tan.hex }} />
                    {tan.etiket}
                  </span>
                );
              })}
              <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-red-700">
                <Share2 className="size-3.5" />
                Ne kadar çok siteye yayıldıysa o kadar kritik
              </span>
            </div>
          </>
        ) : (
          /* Tek-site boş durumu */
          <div className="grid place-items-center rounded-2xl border border-dashed border-line py-14 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Network className="size-6" />
            </span>
            <p className="text-[14px] font-semibold text-slate-ink">Federe korelasyon çok-siteli hesaplarda etkinleşir</p>
            <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-muted">
              Şu an <span className="font-medium text-slate-ink">{sayi(siteSayisi)}</span> site korunuyor.
              İkinci siteni eklediğinde Veylify, aynı saldırganın siteler arasında
              dolaştığını tespit edip federe tehdit istihbaratı üretmeye başlar.
            </p>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}
