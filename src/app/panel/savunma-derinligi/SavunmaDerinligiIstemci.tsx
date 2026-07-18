"use client";

/**
 * Savunma Derinliği — istemci konsolu (Defense-in-Depth).
 * =======================================================
 * "Hiçbir tek katman kusursuz değildir; ama katmanlı savunma, herhangi birinin
 * kaçırdığını yakalar." Bu ekran, gözlemlenen gerçek tehdit trafiğinin Specter'ın
 * SIRALI savunma katmanlarından (edge → itibar → parmak izi → davranış →
 * ghost-font → kural motoru) nasıl süzüldüğünü bir HUNİ olarak gösterir. Her
 * katman bir kısım tehdidi durdurur, kalanı bir sonrakine geçirir; kümülatif
 * koruma her katmanla derinleşir. Böylece Specter'ın tek arıza noktası olmadığı,
 * derinlemesine bir savunma olduğu kanıtlanır.
 *
 * DÜRÜSTLÜK: Katman atfı gerçek olay sinyallerinden DETERMİNİSTİK çıkarılır — bir
 * tehdit, onu durduracak EN ERKEN katmana kredilenir. Hiçbir katmana takılmadan
 * geçenler (sızan) dürüstçe işaretlenir; yanlış güven verilmez.
 */

import { useMemo } from "react";
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Gauge,
  Globe,
  Fingerprint,
  Activity,
  Ghost,
  SlidersHorizontal,
  Info,
  ArrowDown,
  PartyPopper,
} from "lucide-react";
import { motion } from "framer-motion";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { RadarGrafik, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { sdCeviri } from "./savunma-derinligi.i18n";
import type { KatmanSonuc, DerinlikOzet, KatmanId } from "./katman";

/** Bir katman metnini id'e göre çevir (enum id asla çevrilmez; sadece anahtar
 *  eki olarak kullanılır). alan: "ad" | "aciklama" | "yakalar". */
function katmanCeviri(id: KatmanId, alan: "ad" | "aciklama" | "yakalar", dil: Dil): string {
  return sdCeviri(`sd.katman.${id}.${alan}`, dil);
}

/* Katman tanımındaki lucide ikon adını gerçek bileşene eşle. */
const IKONLAR: Record<string, React.ComponentType<{ className?: string }>> = {
  Gauge,
  Globe,
  Fingerprint,
  Activity,
  Ghost,
  SlidersHorizontal,
};
function KatmanIkon({ ad, className }: { ad: string; className?: string }) {
  const C = IKONLAR[ad] ?? Layers;
  return <C className={className} />;
}

/** Yüzde biçimle. TR "%42"; diğer diller "42%" (yerel yazım). */
function yuzde(oran: number, dil: Dil): string {
  const n = Math.round(oran * 100);
  return dil === "tr" ? `%${n}` : `${n}%`;
}

export function SavunmaDerinligiIstemci({
  katmanlar,
  ozet,
  dil,
}: {
  katmanlar: KatmanSonuc[];
  ozet: DerinlikOzet;
  dil: Dil;
}) {
  const t = (anahtar: string) => sdCeviri(anahtar, dil);
  const bosMu = ozet.toplamTehdit === 0;

  // Huni bantları için ölçek: en geniş bant = toplam tehdit (ilk katmanın gireni).
  const enGenis = katmanlar.length ? katmanlar[0].giren : 0;
  // Bant genişliklerini (giren hacme orantılı) hazırla; asgari görünür genişlik.
  const bantlar = useMemo(() => {
    return katmanlar.map((k) => {
      const oran = enGenis ? k.giren / enGenis : 0;
      // %46..%100 aralığına ölçekle: en dar bant bile ikon + iki satır metin +
      // sağdaki sayacı ÇAKIŞMADAN barındıracak asgari genişlikte kalır.
      const genislik = enGenis ? 46 + oran * 54 : 100;
      const yakalamaIci = k.giren ? k.yakalanan / k.giren : 0; // bant içinde yakalanan dilim
      return { k, genislik, yakalamaIci };
    });
  }, [katmanlar, enGenis]);

  const tr = dil === "tr";

  /* ---- Görsel türetmeler (SALT SUNUM) — mevcut katman sonuçlarından yeniden
   * biçimlendirilir; hiçbir yeni veri/mantık üretilmez. */
  const gorsel = useMemo(() => {
    // Radar eksenleri: her katmanın KATMAN-İÇİ yakalama etkinliği (yakalanan/giren, %).
    const radar = katmanlar.map((k) => ({
      etiket: katmanCeviri(k.katman.id, "ad", dil),
      deger: k.giren ? Math.round((k.yakalanan / k.giren) * 100) : 0,
    }));
    // Katman başına gauge (aynı katman-içi etkinlik).
    const gauge = katmanlar.map((k) => ({
      k,
      etkinlik: k.giren ? Math.round((k.yakalanan / k.giren) * 100) : 0,
    }));
    // En güçlü / en zayıf katman: yalnızca gerçekten tehdit GÖREN (giren>0)
    // katmanlar arasında katman-içi etkinliğe göre. Kararlı: eşitlikte erken sıra.
    const gorenler = katmanlar.filter((k) => k.giren > 0);
    let enGuclu: KatmanSonuc | null = null;
    let enZayif: KatmanSonuc | null = null;
    for (const k of gorenler) {
      const e = k.yakalanan / k.giren;
      if (!enGuclu || e > enGuclu.yakalanan / enGuclu.giren) enGuclu = k;
      if (!enZayif || e < enZayif.yakalanan / enZayif.giren) enZayif = k;
    }
    return { radar, gauge, enGuclu, enZayif };
  }, [katmanlar, dil]);

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- Özet kartlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ozet.toplamKatman}
          etiket={t("sd.kart.savunmaKatmani")}
          ikon={<Layers className="size-5" />}
          tone="brand"
        />
        <StatKart
          sayi={ozet.toplamYakalanan.toLocaleString(dil)}
          etiket={t("sd.kart.yakalanan").replace("{n}", yuzde(ozet.korumaOrani, dil))}
          ikon={<ShieldCheck className="size-5" />}
          tone="ok"
        />
        <StatKart
          sayi={ozet.sizanTehdit.toLocaleString(dil)}
          etiket={t("sd.kart.sizan")}
          ikon={<Droplets className="size-5" />}
          tone={ozet.sizanTehdit > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={bosMu ? "—" : ozet.korumaDerinligi.toFixed(1)}
          etiket={t("sd.kart.derinlik")}
          ikon={<Activity className="size-5" />}
          tone="warn"
        />
      </div>

      {bosMu ? (
        <Panel>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Layers className="size-10 text-slate-faint" />
            <p className="text-[15px] font-medium text-slate-ink">{t("sd.bos.baslik")}</p>
            <p className="max-w-md text-sm text-slate-muted">
              {t("sd.bos.aciklama")}
            </p>
          </div>
        </Panel>
      ) : (
        <>
          {/* ------------------------------------------- CENTERPIECE: Katman hunisi */}
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Layers className="size-4 text-brand-600" /> {t("sd.huni.baslik")}
              </span>
            }
            sagUst={
              <span className="text-[13px] text-slate-muted">
                {t("sd.huni.sagUst")
                  .replace("{giren}", enGenis.toLocaleString(dil))
                  .replace("{sizan}", ozet.sizanTehdit.toLocaleString(dil))}
              </span>
            }
          >
            <p className="mb-5 max-w-3xl text-sm text-slate-muted">
              {t("sd.huni.aciklama")}
            </p>

            <div className="mx-auto max-w-2xl space-y-1.5">
              {/* Giriş etiketi */}
              <div className="flex items-center justify-center gap-2 pb-1 text-[13px] font-medium text-slate-muted">
                <span>{t("sd.huni.giris").replace("{n}", enGenis.toLocaleString(dil))}</span>
                <ArrowDown className="size-4" />
              </div>

              {bantlar.map(({ k, genislik, yakalamaIci }, i) => (
                <div key={k.katman.id} className="flex flex-col items-center">
                  {/* Huni bandı — hacme orantılı genişlik, ortalı (funnel) */}
                  <div
                    className="relative flex h-16 items-center overflow-hidden rounded-xl border border-line shadow-sm transition-all"
                    style={{
                      width: `${genislik}%`,
                      background: `linear-gradient(180deg, ${k.katman.renk}14, ${k.katman.renk}0a)`,
                    }}
                  >
                    {/* Yakalanan dilim (bant içinde koyu renk dolgu, soldan) */}
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${Math.max(0, Math.min(100, yakalamaIci * 100))}%`,
                        background: `linear-gradient(180deg, ${k.katman.renk}, ${k.katman.renk}cc)`,
                      }}
                    />
                    {/* İçerik: ikon + ad + sayaç (dilimin üstünde) */}
                    <div className="relative z-10 flex w-full items-center gap-3 px-4">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/40"
                        style={{ background: k.katman.renk }}
                      >
                        <KatmanIkon ad={k.katman.ikon} className="size-4.5 text-white" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-semibold text-slate-ink">
                          {i + 1}. {katmanCeviri(k.katman.id, "ad", dil)}
                        </span>
                        <span className="text-[11px] text-slate-muted">
                          {t("sd.huni.gordu").replace("{n}", k.giren.toLocaleString(dil))}
                        </span>
                      </span>
                      <span className="ml-auto flex shrink-0 flex-col items-end">
                        <span className="text-[15px] font-bold num" style={{ color: k.katman.renk }}>
                          {k.yakalanan.toLocaleString(dil)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-muted">
                          {t("sd.huni.yakaladi").replace("{n}", yuzde(k.giren ? k.yakalanan / k.giren : 0, dil))}
                        </span>
                      </span>
                    </div>
                  </div>
                  {/* Katmanlar arası "geçen" oku */}
                  {i < bantlar.length - 1 && (
                    <div className="flex items-center gap-1.5 py-0.5 text-[11px] text-slate-faint">
                      <ArrowDown className="size-3" />
                      <span>{t("sd.huni.gecti").replace("{n}", k.gecen.toLocaleString(dil))}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Huni çıkışı: sızan tehdit */}
              <div className="flex flex-col items-center pt-1">
                <ArrowDown className="size-4 text-slate-faint" />
                <div
                  className={cn(
                    "mt-1 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium",
                    ozet.sizanTehdit > 0
                      ? "border-red-200 bg-danger-soft text-red-700"
                      : "border-green-200 bg-ok-soft text-green-700",
                  )}
                >
                  {ozet.sizanTehdit > 0 ? (
                    <>
                      <Droplets className="size-4" />
                      {t("sd.huni.sizinti").replace("{n}", ozet.sizanTehdit.toLocaleString(dil))}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      {t("sd.huni.sifirSizinti")}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* ------------------------------------------- Katman etkinliği radar + en güçlü/zayıf */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Radar: çok-eksenli katman etkinlik profili (2 sütun) */}
            <motion.div className="lg:col-span-2" initial={{ y: 8 }} animate={{ y: 0 }}>
              <Panel
                baslik={
                  <span className="flex items-center gap-2">
                    <Activity className="size-4 text-brand-600" />{" "}
                    {tr ? "Katman etkinlik profili" : "Layer effectiveness profile"}
                  </span>
                }
              >
                <p className="mb-3 text-[13px] text-slate-muted">
                  {tr
                    ? "Her eksen bir katmanın gördüğü trafiğin ne kadarını durdurduğunu (katman-içi yakalama %) gösterir. Geniş ve dengeli profil = derinlemesine savunma."
                    : "Each axis shows how much of the traffic a layer sees that it stops (in-layer catch %). A wide, balanced profile means true defense-in-depth."}
                </p>
                <div className="flex justify-center py-1">
                  <RadarGrafik eksenler={gorsel.radar} boyut={230} />
                </div>
              </Panel>
            </motion.div>

            {/* En güçlü / en zayıf katman özeti (3 sütun) */}
            <motion.div className="lg:col-span-3" initial={{ y: 8 }} animate={{ y: 0 }}>
              <Panel
                baslik={
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-brand-600" />{" "}
                    {tr ? "En güçlü ve en zayıf halka" : "Strongest and weakest link"}
                  </span>
                }
              >
                <p className="mb-4 text-[13px] text-slate-muted">
                  {tr
                    ? "Gördüğü trafiğe göre en yüksek ve en düşük yakalama etkinliğine sahip katmanlar. En zayıf halka, bir sonraki iyileştirme için doğal odak."
                    : "The layers with the highest and lowest catch effectiveness relative to the traffic they see. The weakest link is the natural focus for the next improvement."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { rol: tr ? "En güçlü halka" : "Strongest link", k: gorsel.enGuclu, ton: "ok" as const },
                    { rol: tr ? "En zayıf halka" : "Weakest link", k: gorsel.enZayif, ton: "warn" as const },
                  ].map(({ rol, k, ton }, idx) =>
                    k ? (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col gap-2 rounded-2xl border p-4",
                          ton === "ok" ? "border-green-200 bg-ok-soft/40" : "border-amber-200 bg-warn-soft/40",
                        )}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">{rol}</span>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/40"
                            style={{ background: k.katman.renk }}
                          >
                            <KatmanIkon ad={k.katman.ikon} className="size-4.5 text-white" />
                          </span>
                          <span className="min-w-0 text-[14px] font-semibold text-slate-ink">
                            {katmanCeviri(k.katman.id, "ad", dil)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-muted">
                            <span>{tr ? "Katman-içi etkinlik" : "In-layer effectiveness"}</span>
                            <span className="font-semibold num" style={{ color: k.katman.renk }}>
                              {yuzde(k.giren ? k.yakalanan / k.giren : 0, dil)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round((k.giren ? k.yakalanan / k.giren : 0) * 100)}%`,
                                background: k.katman.renk,
                              }}
                            />
                          </div>
                          <div className="mt-1.5 text-[11px] text-slate-muted">
                            {t("sd.huni.gordu").replace("{n}", k.giren.toLocaleString(dil))} ·{" "}
                            {t("sd.huni.yakaladi").replace("{n}", yuzde(k.giren ? k.yakalanan / k.giren : 0, dil))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={idx} className="grid place-items-center rounded-2xl border border-dashed border-line p-4 text-[13px] text-slate-faint">
                        {tr ? "Yeterli veri yok" : "Not enough data"}
                      </div>
                    ),
                  )}
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* ------------------------------------------- Katman etkinlik göstergeleri (gauge) */}
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Gauge className="size-4 text-brand-600" />{" "}
                {tr ? "Katman başına yakalama etkinliği" : "Catch effectiveness per layer"}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {gorsel.gauge.map(({ k, etkinlik }) => (
                <div
                  key={k.katman.id}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 p-3"
                >
                  <GaugeGost deger={etkinlik} boyut={116} renk={k.katman.renk} />
                  <span className="mt-1 flex items-center gap-1.5 text-center text-[11.5px] font-semibold text-slate-ink">
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-md"
                      style={{ background: k.katman.renk }}
                    >
                      <KatmanIkon ad={k.katman.ikon} className="size-3 text-white" />
                    </span>
                    <span className="truncate">{katmanCeviri(k.katman.id, "ad", dil)}</span>
                  </span>
                  <span className="text-[10.5px] text-slate-muted">
                    {t("sd.huni.gordu").replace("{n}", k.giren.toLocaleString(dil))}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* ------------------------------------------- Katman detayları */}
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-600" /> {t("sd.detay.baslik")}
              </span>
            }
          >
            <div className="space-y-3">
              {katmanlar.map((k, i) => {
                const katmanIciOran = k.giren ? k.yakalanan / k.giren : 0;
                return (
                  <div
                    key={k.katman.id}
                    className="rounded-2xl border border-line bg-canvas/40 p-4 transition hover:border-line-strong"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      {/* İkon rozet */}
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/40"
                        style={{ background: k.katman.renk }}
                      >
                        <KatmanIkon ad={k.katman.ikon} className="size-5 text-white" />
                      </span>

                      {/* Ad + açıklama + sinyal */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-faint">{t("sd.detay.katman").replace("{n}", String(i + 1))}</span>
                          <h4 className="text-[15px] font-semibold text-slate-ink">{katmanCeviri(k.katman.id, "ad", dil)}</h4>
                        </div>
                        <p className="mt-0.5 text-[13px] text-slate-muted">{katmanCeviri(k.katman.id, "aciklama", dil)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge ton="gri">{t("sd.detay.yakalar").replace("{n}", katmanCeviri(k.katman.id, "yakalar", dil))}</Badge>
                        </div>
                      </div>

                      {/* Sayaçlar */}
                      <div className="flex shrink-0 items-center gap-6">
                        <div className="text-right">
                          <div className="text-[22px] font-bold leading-none num" style={{ color: k.katman.renk }}>
                            {k.yakalanan.toLocaleString(dil)}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-muted">
                            {t("sd.detay.yakalanan").replace("{n}", yuzde(k.yakalamaPayi, dil))}
                          </div>
                        </div>
                        <div className="hidden text-right sm:block">
                          <div className="text-[15px] font-semibold leading-none text-slate-ink num">
                            {yuzde(katmanIciOran, dil)}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-muted">{t("sd.detay.buKatmanda")}</div>
                        </div>
                      </div>
                    </div>

                    {/* Kümülatif koruma çubuğu */}
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-muted">
                        <span>{t("sd.detay.kumulatif")}</span>
                        <span className="font-semibold num" style={{ color: k.katman.renk }}>
                          {yuzde(k.kumulatifYakalama, dil)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round(k.kumulatifYakalama * 100)}%`,
                            background: k.katman.renk,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* ------------------------------------------- Sızıntı analizi + Neden derinlik */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sızıntı analizi */}
            <Panel
              baslik={
                <span className="flex items-center gap-2">
                  {ozet.sizanTehdit > 0 ? (
                    <ShieldAlert className="size-4 text-danger2" />
                  ) : (
                    <PartyPopper className="size-4 text-ok" />
                  )}
                  {t("sd.sizinti.baslik")}
                </span>
              }
            >
              {ozet.sizanTehdit > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[40px] font-bold leading-none text-danger2 num">
                      {ozet.sizanTehdit.toLocaleString(dil)}
                    </span>
                    <span className="text-sm text-slate-muted">{t("sd.sizinti.gecti")}</span>
                  </div>
                  <p className="text-[13px] text-slate-muted">
                    {t("sd.sizinti.aciklamaOn")}
                    <span className="font-semibold text-danger2">
                      {yuzde(ozet.toplamTehdit ? ozet.sizanTehdit / ozet.toplamTehdit : 0, dil)}
                    </span>
                    {t("sd.sizinti.aciklamaSon")}
                  </p>
                  <div className="rounded-xl border border-line bg-canvas/40 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-[12px] text-slate-muted">
                      <span>{t("sd.sizinti.yakalanan")}</span>
                      <span>{t("sd.sizinti.sizan")}</span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full bg-ok"
                        style={{ width: `${Math.round(ozet.korumaOrani * 100)}%` }}
                      />
                      <div className="h-full flex-1 bg-danger2" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-green-700 num">{yuzde(ozet.korumaOrani, dil)}</span>
                      <span className="text-red-700 num">
                        {yuzde(ozet.toplamTehdit ? ozet.sizanTehdit / ozet.toplamTehdit : 0, dil)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-ok-soft">
                    <ShieldCheck className="size-7 text-ok" />
                  </span>
                  <p className="text-[15px] font-semibold text-slate-ink">{t("sd.sizinti.sifirBaslik")}</p>
                  <p className="max-w-sm text-[13px] text-slate-muted">
                    {t("sd.sizinti.sifirAciklama")}
                  </p>
                  <Badge ton="yesil">
                    <ShieldCheck className="size-3.5" /> {t("sd.sizinti.kumulatifRozet").replace("{n}", yuzde(ozet.korumaOrani, dil))}
                  </Badge>
                </div>
              )}
            </Panel>

            {/* Neden derinlik */}
            <Panel
              baslik={
                <span className="flex items-center gap-2">
                  <Info className="size-4 text-brand-600" /> {t("sd.neden.baslik")}
                </span>
              }
            >
              <div className="space-y-4 text-[13px] text-slate-muted">
                <p>
                  {t("sd.neden.p1On")}
                  <span className="font-medium text-slate-ink">
                    {t("sd.neden.p1Vurgu")}
                  </span>
                </p>
                <p>
                  {t("sd.neden.p2On")}
                  <span className="font-semibold text-slate-ink">{t("sd.neden.p2Katman").replace("{n}", String(ozet.toplamKatman))}</span>
                  {t("sd.neden.p2Orta")}
                  <span className="font-semibold text-slate-ink">
                    {t("sd.neden.p2Katmanda").replace("{n}", ozet.korumaDerinligi.toFixed(1))}
                  </span>
                  {t("sd.neden.p2Durduruluyor")}
                  <span className="font-semibold text-ok">{yuzde(ozet.korumaOrani, dil)}</span>
                  {t("sd.neden.p2Elerken")}
                </p>

                {/* En etkili katman vurgusu */}
                {ozet.enEtkiliKatman && (
                  <div className="rounded-xl border border-line bg-canvas/40 p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-8 items-center justify-center rounded-lg"
                        style={{ background: ozet.enEtkiliKatman.katman.renk }}
                      >
                        <KatmanIkon ad={ozet.enEtkiliKatman.katman.ikon} className="size-4 text-white" />
                      </span>
                      <div>
                        <div className="text-[12px] text-slate-muted">{t("sd.neden.enEtkili")}</div>
                        <div className="text-[14px] font-semibold text-slate-ink">
                          {t("sd.neden.enEtkiliDeger")
                            .replace("{ad}", katmanCeviri(ozet.enEtkiliKatman.katman.id, "ad", dil))
                            .replace("{n}", ozet.enEtkiliKatman.yakalanan.toLocaleString(dil))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <p className="rounded-xl border border-line bg-brand-50/50 p-3 text-[12px] text-slate-muted">
                  <span className="font-semibold text-slate-ink">{t("sd.neden.durustlukOn")}</span>{t("sd.neden.durustlukSon")}
                </p>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
