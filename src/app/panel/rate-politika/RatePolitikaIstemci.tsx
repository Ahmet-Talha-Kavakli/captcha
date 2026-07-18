"use client";

import { useMemo, useState } from "react";
import {
  Gauge,
  TimerReset,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Snail,
  Info,
  ArrowRight,
  TrendingDown,
  CircleDollarSign,
  CalendarClock,
  Sliders,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { rpCeviri } from "./rate-politika.i18n";
import {
  rateSimule,
  patlamaSerisi,
  type HizLimitKademesi,
  type HizAksiyon,
} from "@/lib/specter/rate-politika";

/* ------------------------------------------------------------------ tipler */

interface KotaVeri {
  planAd: string;
  planFiyat: string;
  kota: number;
  kullanilan: number;
  oran: number;
  kalan: number;
  asildi: boolean;
  uyari: boolean;
  asimDavranisi: "block" | "overage";
}

interface SenaryoVeri {
  tukenisGun: number | null;
  asimMiktar: number;
  asimDavranisiAciklama: string;
  tahminEkMaliyet?: number;
  gunlukOrt: number;
}

interface PlanKarsilastirmaSatir {
  key: string;
  ad: string;
  fiyat: string;
  kota: number;
  asimDavranisi: "block" | "overage";
  mevcut: boolean;
}

interface Props {
  dil: Dil;
  kademeler: HizLimitKademesi[];
  oneriKey: string;
  oneriGerekce: string;
  gozlemlenenTepeRps: number;
  kota: KotaVeri;
  senaryo: SenaryoVeri;
  planKarsilastirma: PlanKarsilastirmaSatir[];
  grafik: {
    gunlukSeri: number[];
    gunEtiket: string[];
    gunlukKotaTavan: number;
  };
  siteSayisi: number;
}

/* ------------------------------------------------------------------ aksiyon meta */

/**
 * Aksiyon meta — enum GÜVENLİĞİ: `ad` burada YOK; görünen etiket
 * "rp.aksiyon.<enum>" anahtarıyla çeviriden gelir (ikon/ton/renk dil-bağımsız).
 */
const AKSIYON_META: Record<
  HizAksiyon,
  { ikon: React.ReactNode; ton: "sari" | "brand" | "kirmizi"; renk: string }
> = {
  yavaslat: { ikon: <Snail className="size-3.5" />, ton: "sari", renk: "#d97706" },
  challenge: { ikon: <ShieldCheck className="size-3.5" />, ton: "brand", renk: "#2f6fed" },
  engelle: { ikon: <Ban className="size-3.5" />, ton: "kirmizi", renk: "#dc2626" },
};

/** BCP-47 dil kodu (sayı biçimlendirme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ================================================================== bileşen */

export function RatePolitikaIstemci({
  dil,
  kademeler,
  oneriKey,
  oneriGerekce,
  gozlemlenenTepeRps,
  kota,
  senaryo,
  planKarsilastirma,
  grafik,
  siteSayisi,
}: Props) {
  const t = (k: string) => rpCeviri(k, dil);
  const sayi = (n: number) => n.toLocaleString(BCP47[dil]);
  // Kademe adı/açıklaması lib'den TR gelir; enum key'iyle yeniden türet.
  const kademeAd = (key: string) => t(`rp.kademe.${key}`);
  const kademeAciklama = (key: string) => t(`rp.kademeAciklama.${key}`);
  // Aksiyon etiketi (enum → çeviri).
  const aksiyonAd = (a: HizAksiyon) => t(`rp.aksiyon.${a}`);

  /* Öneri gerekçesi lib'de TR üretilir (interpolasyonlu); lib'i değiştirmeden
     client'ta yeniden türet. Anlamlı trafik yoksa "trafikYok", varsa sayıları
     ve önerilen kademe adını yerine koyarak "var" metnini kullan. */
  const oneriKademeAd = kademeAd(oneriKey);
  const oneriGerekceMetin =
    gozlemlenenTepeRps <= 0
      ? t("rp.oneriGerekce.trafikYok")
      : t("rp.oneriGerekce.var")
          .replace("{rps}", gozlemlenenTepeRps.toFixed(1))
          .replace("{dk}", sayi(Math.round(gozlemlenenTepeRps * 60)))
          .replace("{kademe}", oneriKademeAd);
  // `oneriGerekce` prop'u (lib TR metni) artık kullanılmıyor; enum güvenliği için
  // görünen metin yukarıda yeniden türetildi.
  void oneriGerekce;

  // Aşım davranışı açıklaması (enum → çeviri; lib TR metni yerine).
  const asimAciklama = t(`rp.asimAciklama.${kota.asimDavranisi}`);

  // Simülatör durumu: kaydırıcıyla ayarlanan gelen tepe RPS.
  const [gelenRps, setGelenRps] = useState<number>(120);

  // Sentetik 10 saniyelik patlama serisi: taban = zirvenin ~%10'u.
  const seri = useMemo(
    () => patlamaSerisi(Math.max(1, Math.round(gelenRps * 0.1)), gelenRps, 10),
    [gelenRps],
  );

  // Her kademe için simülasyon sonucu (canlı).
  const simSonuclar = useMemo(
    () =>
      kademeler.map((k) => ({
        kademe: k,
        sonuc: rateSimule(seri, k.istekDk, k.pencereSn),
      })),
    [kademeler, seri],
  );

  // Kota yüzde (0..100+, oran 2'de sınırlı geliyor).
  const kotaYuzde = Math.round(kota.oran * 100);
  const kotaRenk = kota.asildi ? "#dc2626" : kota.uyari ? "#d97706" : "#16a34a";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* giriş bandı */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Gauge className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("rp.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("rp.giris.metin")}</p>
        </div>
      </div>

      {/* özet istatistikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`${gozlemlenenTepeRps.toFixed(1)}/${t("rp.birim.sn")}`}
          etiket={t("rp.kart.tepeTrafik")}
          ikon={<Zap className="size-5" />}
        />
        <StatKart
          sayi={`%${Math.min(kotaYuzde, 999)}`}
          etiket={t("rp.kart.kotaKullanim")}
          tone={kota.asildi ? "danger" : kota.uyari ? "warn" : "ok"}
          ikon={<Gauge className="size-5" />}
        />
        <StatKart
          sayi={senaryo.tukenisGun === null ? "—" : t("rp.kart.gunBirim").replace("{n}", String(senaryo.tukenisGun))}
          etiket={t("rp.kart.tukenisKalan")}
          tone={senaryo.tukenisGun !== null && senaryo.tukenisGun <= 7 ? "warn" : undefined}
          ikon={<CalendarClock className="size-5" />}
        />
        <StatKart
          sayi={kota.asimDavranisi === "overage" ? t("rp.deger.fazlaKullanim") : t("rp.deger.red429")}
          etiket={t("rp.kart.asimDavranis")}
          tone={kota.asimDavranisi === "overage" ? "ok" : "danger"}
          ikon={kota.asimDavranisi === "overage" ? <CircleDollarSign className="size-5" /> : <Ban className="size-5" />}
        />
      </div>

      {/* =============================================== BÖLÜM 1: Hız limiti kademeleri */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <TimerReset className="size-4 text-brand-600" /> {t("rp.kademeler.baslik")}
          </span>
        }
      >
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("rp.kademeler.metin")} <b>{t("rp.kademeler.onerilenVurgu")}</b> {t("rp.kademeler.metinSon")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kademeler.map((k) => {
            const m = AKSIYON_META[k.aksiyon];
            const onerilen = k.key === oneriKey;
            return (
              <div
                key={k.key}
                className={cn(
                  "relative rounded-3xl border bg-surface p-5 transition",
                  onerilen ? "border-brand-400 shadow-card ring-1 ring-brand-200" : "border-line hover:border-line-strong",
                )}
              >
                {onerilen && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {t("rp.kademeler.onerilenRozet")}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-ink">{kademeAd(k.key)}</span>
                  <Badge ton={m.ton}>
                    {m.ikon} {aksiyonAd(k.aksiyon)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="num text-[30px] font-bold leading-none text-slate-ink">{sayi(k.istekDk)}</span>
                  <span className="text-[13px] text-slate-muted">{t("rp.kademeler.istekDk")}</span>
                </div>
                <div className="mt-1 text-[12px] text-slate-faint">{t("rp.kademeler.pencere").replace("{n}", String(k.pencereSn))}</div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-muted">{kademeAciklama(k.key)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <NotKutusu ton="bilgi" baslik={t("rp.kademeler.oneriGerekceBaslik")}>
            {oneriGerekceMetin}
          </NotKutusu>
        </div>
      </Panel>

      {/* =============================================== Simülatör */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Sliders className="size-4 text-brand-600" /> {t("rp.sim.baslik")}
          </span>
        }
      >
        <p className="mb-4 text-[13px] text-slate-muted">{t("rp.sim.metin")}</p>

        {/* kaydırıcı */}
        <div className="mb-6 rounded-2xl border border-line bg-canvas/40 p-5">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="gelenRps" className="text-[13px] font-medium text-slate-ink">
              {t("rp.sim.gelenTrafik")}
            </label>
            <span className="num text-[15px] font-bold text-brand-700">{sayi(gelenRps)} {t("rp.sim.istekSn")}</span>
          </div>
          <input
            id="gelenRps"
            type="range"
            min={5}
            max={500}
            step={5}
            value={gelenRps}
            onChange={(e) => setGelenRps(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label={t("rp.sim.ariaGelen")}
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-faint">
            <span>{t("rp.sim.sakin")}</span>
            <span>{t("rp.sim.orta")}</span>
            <span>{t("rp.sim.sel")}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {seri.map((v, i) => {
              const oran = v / Math.max(...seri, 1);
              return (
                <span
                  key={i}
                  className="flex h-8 flex-1 items-end overflow-hidden rounded-md bg-white"
                  title={t("rp.sim.serpme").replace("{i}", String(i)).replace("{n}", sayi(v))}
                >
                  <span
                    className="w-full rounded-md bg-brand-400/70"
                    style={{ height: `${Math.max(6, oran * 100)}%` }}
                  />
                </span>
              );
            })}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-faint">
            {t("rp.sim.seriNot").replace("{n}", sayi(seri.reduce((a, b) => a + b, 0)))}
          </div>
        </div>

        {/* kademe başına simülasyon sonucu */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {simSonuclar.map(({ kademe, sonuc }) => {
            const m = AKSIYON_META[kademe.aksiyon];
            const gecOran = sonuc.toplam > 0 ? sonuc.gecen / sonuc.toplam : 1;
            const onerilen = kademe.key === oneriKey;
            return (
              <div
                key={kademe.key}
                className={cn(
                  "rounded-2xl border p-4",
                  onerilen ? "border-brand-300 bg-brand-50/40" : "border-line bg-surface",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-ink">{kademeAd(kademe.key)}</span>
                  <span className="num text-[12px] text-slate-faint">{sayi(kademe.istekDk)}/{t("rp.kademeler.istekDk").split("/")[1] ?? "dk"}</span>
                </div>

                {/* geçen/engellenen bar */}
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-canvas">
                  <span className="h-full bg-ok" style={{ width: `${gecOran * 100}%` }} />
                  <span className="h-full" style={{ width: `${(1 - gecOran) * 100}%`, background: m.renk }} />
                </div>

                <div className="mt-3 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-muted">
                      <span className="size-2 rounded-full bg-ok" /> {t("rp.sim.gecen")}
                    </span>
                    <span className="num font-semibold text-slate-ink">{sayi(sonuc.gecen)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-muted">
                      <span className="size-2 rounded-full" style={{ background: m.renk }} /> {aksiyonAd(kademe.aksiyon)}
                    </span>
                    <span className="num font-semibold" style={{ color: m.renk }}>
                      {sayi(sonuc.engellenen)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-1.5">
                    <span className="text-slate-faint">{t("rp.sim.kisitlamaOrani")}</span>
                    <span className="num font-semibold text-slate-ink">
                      %{(sonuc.engelOran * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <NotKutusu ton="sari" baslik={t("rp.sim.nasilOkunurBaslik")}>
            {t("rp.sim.nasilOkunur1")}
            <b> “{aksiyonAd(simSonuclar[0]?.kademe.aksiyon ?? "yavaslat")}/{aksiyonAd("challenge")}/{aksiyonAd("engelle")}”</b>{" "}
            {t("rp.sim.nasilOkunur2")}
          </NotKutusu>
        </div>
      </Panel>

      {/* =============================================== BÖLÜM 2: Kota aşım politikası */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          baslik={
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-brand-600" /> {t("rp.kota.baslik").replace("{plan}", kota.planAd)}
            </span>
          }
        >
          {/* kota barı */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <div className="num text-[28px] font-bold leading-none" style={{ color: kotaRenk }}>
                  {sayi(kota.kullanilan)}
                  <span className="text-[15px] font-medium text-slate-faint"> / {sayi(kota.kota)}</span>
                </div>
                <div className="mt-1 text-[12px] text-slate-muted">{t("rp.kota.donemKullanilan")}</div>
              </div>
              <Badge ton={kota.asildi ? "kirmizi" : kota.uyari ? "sari" : "yesil"}>
                {t("rp.kota.kullanildi").replace("{pct}", String(Math.min(kotaYuzde, 999)))}
              </Badge>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, kotaYuzde)}%`, background: kotaRenk }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-slate-faint">
              <span>{t("rp.kota.kalan").replace("{n}", sayi(kota.kalan))}</span>
              <span>{t("rp.kota.gunlukOrt").replace("{n}", sayi(senaryo.gunlukOrt))}</span>
            </div>
          </div>

          {/* tükeniş + davranış */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
                <CalendarClock className="size-4 text-brand-600" /> {t("rp.kota.tahminiTukenis")}
              </div>
              <div className="mt-2 num text-[24px] font-bold text-slate-ink">
                {senaryo.tukenisGun === null
                  ? t("rp.kota.tukenmez")
                  : senaryo.tukenisGun === 0
                    ? t("rp.kota.kotaDolu")
                    : t("rp.kota.gun").replace("{n}", String(senaryo.tukenisGun))}
              </div>
              <p className="mt-1 text-[12px] text-slate-muted">
                {senaryo.tukenisGun === null ? t("rp.kota.tukenmezMetin") : t("rp.kota.tukenisMetin")}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink">
                {kota.asimDavranisi === "overage" ? (
                  <CircleDollarSign className="size-4 text-ok" />
                ) : (
                  <Ban className="size-4 text-danger2" />
                )}
                {t("rp.kota.dolunca")}
              </div>
              <div className="mt-2">
                <Badge ton={kota.asimDavranisi === "overage" ? "yesil" : "kirmizi"}>
                  {kota.asimDavranisi === "overage" ? t("rp.kota.fazlaKullanimUcret") : t("rp.kota.istekRed")}
                </Badge>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-muted">{asimAciklama}</p>
            </div>
          </div>

          {/* aşım projeksiyonu */}
          {senaryo.asimMiktar > 0 && (
            <div className="mt-3">
              <NotKutusu ton={kota.asimDavranisi === "overage" ? "yesil" : "kirmizi"}>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <TrendingDown className="size-4 shrink-0" />
                  {t("rp.kota.projBaslik")} <b>{sayi(senaryo.asimMiktar)}</b> {t("rp.kota.projIstekAsar")}
                  {kota.asimDavranisi === "overage" && senaryo.tahminEkMaliyet !== undefined ? (
                    <span>
                      {t("rp.kota.tahminiEkFatura")} <b>₺{sayi(senaryo.tahminEkMaliyet)}</b> {t("rp.kota.birimNot")}
                    </span>
                  ) : (
                    <span>{t("rp.kota.reddedilecek")}</span>
                  )}
                </span>
              </NotKutusu>
            </div>
          )}
        </Panel>

        {/* plan karşılaştırma */}
        <Panel baslik={t("rp.plan.baslik")}>
          <div className="space-y-2.5">
            {planKarsilastirma.map((p) => (
              <div
                key={p.key}
                className={cn(
                  "rounded-2xl border p-3.5",
                  p.mevcut ? "border-brand-300 bg-brand-50/40" : "border-line bg-surface",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-ink">
                    {p.ad}
                    {p.mevcut && <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("rp.plan.mevcut")}</span>}
                  </span>
                  <span className="text-[12px] text-slate-muted">{p.fiyat}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <span className="num text-slate-muted">{t("rp.plan.aylik").replace("{n}", sayi(p.kota))}</span>
                  <Badge ton={p.asimDavranisi === "overage" ? "yesil" : "kirmizi"}>
                    {p.asimDavranisi === "overage" ? (
                      <>
                        <CircleDollarSign className="size-3" /> {t("rp.plan.fazlaKullanim")}
                      </>
                    ) : (
                      <>
                        <Ban className="size-3" /> {t("rp.plan.red429")}
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-faint">{t("rp.plan.not")}</p>
        </Panel>
      </div>

      {/* =============================================== BÖLÜM 3: Kullanım - kota grafiği */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <Gauge className="size-4 text-brand-600" /> {t("rp.grafik.baslik")}
          </span>
        }
      >
        <p className="mb-3 text-[13px] text-slate-muted">
          {t("rp.grafik.metinBas")}{" "}
          <span className="num font-medium text-slate-ink">{sayi(grafik.gunlukKotaTavan)}</span>{t("rp.grafik.metinSon")}
        </p>
        <TrendGrafik
          noktalar={grafik.gunlukSeri}
          seriler={[grafik.gunlukSeri, grafik.gunEtiket.map(() => grafik.gunlukKotaTavan)]}
          renkler={["#2f6fed", "#c9c4b6"]}
          seriEtiketleri={[t("rp.grafik.seriKullanim"), t("rp.grafik.seriTavan")]}
          etiketler={grafik.gunEtiket}
          yukseklik={260}
        />
      </Panel>

      {/* dürüst not + özel limit ipucu */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            {t("rp.not.metin1")} <b>{t("rp.not.temsili")}</b>. {t("rp.not.metin2")}{" "}
            <b>{t("rp.not.kurallar")}</b> {t("rp.not.metin3")}{" "}
            <code className="rounded bg-white px-1 py-0.5 text-[11px]">rate</code> {t("rp.not.metin4")}{" "}
            {siteSayisi > 0 && <>{t("rp.not.siteVar").replace("{n}", sayi(siteSayisi))}</>}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4">
          <div className="text-[13px]">
            <div className="font-semibold text-slate-ink">{t("rp.ipucu.baslik")}</div>
            <div className="mt-0.5 text-slate-muted">
              <code className="rounded bg-white px-1 py-0.5 text-[11px]">rate &gt; N</code> {t("rp.ipucu.metinBas")}
            </div>
          </div>
          <Button href="/panel/kurallar" variant="outline" size="sm">
            {t("rp.ipucu.buton")} <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
