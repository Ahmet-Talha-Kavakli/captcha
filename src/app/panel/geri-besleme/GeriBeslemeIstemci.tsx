"use client";

/**
 * Katman Geri-Besleme — istemci konsolu (Layer Feedback Loop).
 * ===========================================================
 * "Savunma katmanları gerçek yakalanan trafikten NE ÖĞRENİR?" Bu ekran,
 * gözlemlenen katman-hit'lerinden dört savunma katmanının (ghost-font,
 * honeypot, tutarlılık, işlem kanıtı) hangi bot türünü yakaladığını, her
 * katmanın etkinliğini, katmanların birbiriyle örtüşmesini ve hiçbir katmana
 * takılmayan tehditleri (savunma boşlukları) gösterir.
 *
 * DÜRÜSTLÜK: Tüm sayılar gerçek olay katman-hit'lerinden deterministik gelir.
 * Hiçbir katmana yakalanmayan kötü türler savunma boşluğu olarak açıkça
 * işaretlenir; yanlış güven verilmez. Veri yoksa temiz bir boş-durum çıkar.
 *
 * Enum güvenliği: KatmanId ("ghost-font"…) ve BotClass ("scraper"…) enum
 * DEĞERLERİ asla çevrilmez; yalnızca çeviri anahtar eki olarak kullanılır.
 * Sayı/oranlar Intl (GB_YEREL) ile yerelleştirilir.
 */

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Repeat2,
  Ghost,
  Bug,
  Fingerprint,
  Cpu,
  Trophy,
  Grid3x3,
  Layers,
  GitMerge,
  ShieldAlert,
  Info,
  Target,
  ArrowRight,
  SlidersHorizontal,
  ShieldPlus,
  ShieldOff,
  Ban,
  TrendingUp,
  Loader2,
  Check,
  Wand2,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme, Tooltip, NotKutusu, BosDurum, useToast } from "@/components/panel/kit";
import { RadarGrafik, Histogram } from "@/components/panel/grafikler-ek";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import type { GeriBeslemeSonuc, KatmanId } from "@/lib/specter/katman-geribesleme";
import { KATMANLAR } from "@/lib/specter/katman-geribesleme";
import type { OzAyarSonuc, OneriTur } from "@/lib/specter/katman-ozayar";
import { ONERI_TON } from "@/lib/specter/katman-ozayar";
import type { OzAyarEtkiSonuc } from "@/lib/specter/ozayar-etki";
import { ETKI_TON } from "@/lib/specter/ozayar-etki";
import { geriBeslemeCeviri, GB_YEREL } from "./geri-besleme.i18n";

/* Öneri türü → lucide ikon (görsel dil; enum asla çevrilmez). */
const ONERI_IKON: Record<OneriTur, React.ComponentType<{ className?: string }>> = {
  guclendir: TrendingUp,
  koru: ShieldPlus,
  gereksiz: Ban,
  bosluk: ShieldOff,
};

/* Katman id → lucide ikon (görsel dil; id asla çevrilmez). */
const KATMAN_IKON: Record<KatmanId, React.ComponentType<{ className?: string }>> = {
  "ghost-font": Ghost,
  honeypot: Bug,
  tutarlilik: Fingerprint,
  pow: Cpu,
};

/** Uygulanabilir öneri türleri (sunucu yalnızca bunları kurala çevirir). */
const UYGULANABILIR: ReadonlySet<OneriTur> = new Set<OneriTur>(["bosluk", "guclendir", "koru"]);
/** Öneri → uygulanmış-durum anahtarı (botClass|tur; re-render'da korunur). */
const oneriAnahtar = (botClass: string, tur: OneriTur) => `${botClass}|${tur}`;

export function GeriBeslemeIstemci({
  sonuc,
  ozAyar,
  etki,
  siteler,
  dil,
}: {
  sonuc: GeriBeslemeSonuc;
  ozAyar: OzAyarSonuc;
  etki: OzAyarEtkiSonuc;
  siteler: { id: string; name: string }[];
  dil: Dil;
}) {
  const t = (k: string) => geriBeslemeCeviri(k, dil);
  const azalt = useReducedMotion();
  const yerel = GB_YEREL[dil];
  const { goster } = useToast();

  // Seçili site (öneri kuralının uygulanacağı hedef); varsayılan ilk site.
  const [seciliSite, setSeciliSite] = useState<string>(siteler[0]?.id ?? "");
  // Şu an uygulanmakta olan öneri anahtarı (buton spinner + disable için).
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  // Uygulanmış öneriler — anahtar (botClass|tur) Set'i; re-render'da hayatta kalır.
  const [uygulanan, setUygulanan] = useState<Set<string>>(() => new Set());

  /**
   * Öneriyi gerçek kurala çevir: /api/oz-ayar/uygula'ya POST.
   * Başarı → başarı toast + kartı "uygulandı" işaretle. Hata → hata toast.
   * 409 (zaten var / öneri geçersiz) → bilgi toast + yine de uygulanmış say.
   */
  async function uygula(botClass: string, tur: OneriTur) {
    if (!seciliSite) return;
    const anahtar = oneriAnahtar(botClass, tur);
    setYukleniyor(anahtar);
    try {
      const res = await fetch("/api/oz-ayar/uygula", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId: seciliSite, botClass, tur }),
      });
      const veri = await res.json().catch(() => ({}));
      if (res.ok) {
        // Kural yazıldı → başarı toast + kalıcı "uygulandı" işareti.
        goster({ tip: "basari", baslik: t("gb.ozayar.basariToast"), aciklama: veri.mesaj });
        setUygulanan((s) => new Set(s).add(anahtar));
      } else if (res.status === 409) {
        // İdempotent: kural zaten var / öneri geçersizleşti — nazikçe uygulanmış say.
        goster({ tip: "bilgi", baslik: t("gb.ozayar.basariToast"), aciklama: veri.error });
        setUygulanan((s) => new Set(s).add(anahtar));
      } else {
        // 400/401/404 vb. → hata toast (sunucu mesajı).
        goster({ tip: "hata", baslik: t("gb.ozayar.hataToast"), aciklama: veri.error });
      }
    } catch {
      goster({ tip: "hata", baslik: t("gb.ozayar.hataToast") });
    } finally {
      setYukleniyor(null);
    }
  }

  /** Yerel sayı biçimleme. */
  const sayiBicim = useMemo(() => new Intl.NumberFormat(yerel), [yerel]);
  const nf = (n: number) => sayiBicim.format(n);
  /** Yerel yüzde (0-1 oran → tam sayı %). */
  const yuzde = (oran: number) => {
    const n = Math.round(oran * 100);
    return dil === "tr" ? `%${nf(n)}` : `${nf(n)}%`;
  };
  /** Katman/tür görünür etiketi (enum id → çeviri). */
  const katmanAd = (id: KatmanId) => t(`gb.katman.${id}`);
  const turAd = (enumDeger: string) => t(`gb.tur.${enumDeger}`);
  /** Şablon içine sayı sok ({n}, {sayi}, {oran}). */
  const doldur = (anahtar: string, degerler: Record<string, string | number>) => {
    let s = t(anahtar);
    for (const [k, v] of Object.entries(degerler)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };

  // ---- Boş durum (gercekVeri=false): dürüstçe hiçbir şey uydurmadan ----
  if (!sonuc.gercekVeri) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
        <BosDurum
          ikon={<Repeat2 className="size-8" />}
          baslik={t("gb.bos.baslik")}
          aciklama={t("gb.bos.aciklama")}
        />
      </div>
    );
  }

  // ---- Çapraz-tablo verisi: satır=bot türü, sütun=katman ----
  // Motor `capraz` düz listesini (botClass, katman) matris için indeksle.
  const caprazIndeks = useMemo(() => {
    const m = new Map<string, { sayi: number; oran: number }>();
    for (const c of sonuc.capraz) m.set(`${c.botClass}|${c.katman}`, { sayi: c.sayi, oran: c.oran });
    return m;
  }, [sonuc.capraz]);

  // Matriste görünecek bot türleri: hit'i olan türler, toplam hit'e göre sıralı.
  const turler = useMemo(() => {
    const toplam = new Map<string, number>();
    for (const c of sonuc.capraz) toplam.set(c.botClass, (toplam.get(c.botClass) ?? 0) + c.sayi);
    return [...toplam.entries()].sort((a, b) => b[1] - a[1]).map(([tur]) => tur);
  }, [sonuc.capraz]);

  // Isı gölgelemesi için en yüksek hücre sayısı (ölçek).
  const enYuksekHucre = useMemo(
    () => sonuc.capraz.reduce((m, c) => Math.max(m, c.sayi), 0),
    [sonuc.capraz],
  );

  // Örtüşme ölçeği + en çok benzersiz (bar ölçeği).
  const enYuksekOrtusme = useMemo(
    () => sonuc.ortusmeler.reduce((m, o) => Math.max(m, o.birlikte), 0),
    [sonuc.ortusmeler],
  );
  const enYuksekBenzersiz = useMemo(
    () => sonuc.katmanlar.reduce((m, k) => Math.max(m, k.benzersiz), 0),
    [sonuc.katmanlar],
  );
  const enEtkiliAd = sonuc.enEtkili ? katmanAd(sonuc.enEtkili) : t("gb.stat.enEtkiliYok");

  const fade = azalt
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Repeat2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p className="min-w-0 text-[13px] leading-relaxed text-slate-muted">{t("gb.aciklama")}</p>
      </div>

      {/* stat kartlar — ferah KPI şeridi */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatKart
          sayi={nf(sonuc.hitliOlay)}
          etiket={t("gb.stat.hitliOlay")}
          ikon={<Layers className="size-5" />}
          tone="brand"
        />
        <StatKart
          sayi={enEtkiliAd}
          etiket={t("gb.stat.enEtkili")}
          ikon={<Trophy className="size-5" />}
          tone="ok"
        />
        <StatKart
          sayi={nf(sonuc.katmanlar.length)}
          etiket={t("gb.katman.baslik")}
          ikon={<Grid3x3 className="size-5" />}
        />
        <StatKart
          sayi={nf(sonuc.bosluklar.length)}
          etiket={t("gb.bosluk.baslik")}
          ikon={<ShieldAlert className="size-5" />}
          tone={sonuc.bosluklar.length > 0 ? "danger" : "ok"}
        />
      </div>

      {/* === Bot türü × katman ısı matrisi === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <Grid3x3 className="size-4 text-slate-faint" />
              {t("gb.capraz.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.capraz.aciklama")}</p>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                    {t("gb.capraz.turKatman")}
                  </th>
                  {KATMANLAR.map((k) => {
                    const Ikon = KATMAN_IKON[k];
                    return (
                      <th
                        key={k}
                        className="px-3 py-2 text-center text-[11px] font-semibold text-slate-muted"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Ikon className="size-3.5 text-slate-faint" />
                          {katmanAd(k)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {turler.map((tur) => (
                  <tr key={tur}>
                    <td className="whitespace-nowrap px-3 py-2 text-[13px] font-medium text-slate-ink">
                      {turAd(tur)}
                    </td>
                    {KATMANLAR.map((k) => {
                      const h = caprazIndeks.get(`${tur}|${k}`);
                      const sayi = h?.sayi ?? 0;
                      // Isı yoğunluğu: 0 → soluk; enYuksekHucre → koyu brand.
                      const yogunluk = enYuksekHucre > 0 ? sayi / enYuksekHucre : 0;
                      const ipucu = sayi > 0
                        ? doldur("gb.capraz.hucre", { sayi: nf(sayi), oran: Math.round((h?.oran ?? 0) * 100) })
                        : t("gb.capraz.bosHucre");
                      return (
                        <td key={k} className="p-0">
                          <Tooltip metin={`${turAd(tur)} · ${katmanAd(k)} — ${ipucu}`}>
                            <div
                              className={cn(
                                "grid h-12 w-full min-w-[72px] place-items-center rounded-lg text-[13px] font-semibold tabular-nums transition",
                                sayi === 0
                                  ? "bg-canvas text-slate-faint"
                                  : yogunluk > 0.66
                                    ? "text-white"
                                    : yogunluk > 0.33
                                      ? "text-brand-800"
                                      : "text-brand-700",
                              )}
                              style={
                                sayi === 0
                                  ? undefined
                                  : { backgroundColor: `rgba(74, 65, 232, ${0.14 + yogunluk * 0.82})` }
                              }
                            >
                              {sayi > 0 ? nf(sayi) : "·"}
                            </div>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </motion.div>

      {/* === Katman etkinliği === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <Layers className="size-4 text-slate-faint" />
              {t("gb.katman.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.katman.aciklama")}</p>

          {/* Katman etkinlik profili — radar (benzersiz-yakalama payı). 3+ katman
              varsa çizilir; monoton çubuk tekrarını kırar, dengeyi bir bakışta verir. */}
          {sonuc.katmanlar.length >= 3 && (
            <div className="mb-5 flex flex-col items-center gap-4 rounded-2xl border border-line bg-canvas/40 p-4 sm:flex-row sm:justify-center">
              <RadarGrafik
                boyut={210}
                eksenler={sonuc.katmanlar.map((kat) => ({
                  etiket: katmanAd(kat.katman),
                  deger: enYuksekBenzersiz > 0 ? (kat.benzersiz / enYuksekBenzersiz) * 100 : 0,
                }))}
              />
              <div className="min-w-0 space-y-2 text-[12px] text-slate-muted sm:max-w-[200px]">
                <div className="text-[13px] font-semibold text-slate-ink">{t("gb.katman.benzersiz")}</div>
                {sonuc.katmanlar.map((kat) => {
                  const Ikon = KATMAN_IKON[kat.katman];
                  return (
                    <div key={kat.katman} className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-surface text-brand-600">
                        <Ikon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{katmanAd(kat.katman)}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-ink">{nf(kat.benzersiz)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {sonuc.katmanlar.map((kat) => {
              const Ikon = KATMAN_IKON[kat.katman];
              const enEtkiliMi = sonuc.enEtkili === kat.katman;
              const benzersizOran = enYuksekBenzersiz > 0 ? (kat.benzersiz / enYuksekBenzersiz) * 100 : 0;
              return (
                <div
                  key={kat.katman}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    enEtkiliMi ? "border-brand-200 bg-brand-50/50 ring-1 ring-brand-100" : "border-line bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-xl",
                          enEtkiliMi ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted",
                        )}
                      >
                        <Ikon className="size-4.5" />
                      </span>
                      <div>
                        <div className="text-[14px] font-semibold text-slate-ink">{katmanAd(kat.katman)}</div>
                        <div className="text-[12px] text-slate-faint">
                          {nf(kat.toplam)} {t("gb.katman.toplam")}
                        </div>
                      </div>
                    </div>
                    {enEtkiliMi && (
                      <Badge ton="brand">
                        <Trophy className="size-3" /> {t("gb.katman.enEtkiliRozet")}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-muted">{t("gb.katman.baskinTur")}</span>
                      {kat.baskinTur ? (
                        <Badge ton="gri">{turAd(kat.baskinTur)}</Badge>
                      ) : (
                        <span className="text-slate-faint">{t("gb.katman.baskinTurYok")}</span>
                      )}
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="text-slate-muted">{t("gb.katman.benzersiz")}</span>
                        <span className="font-semibold tabular-nums text-slate-ink">{nf(kat.benzersiz)}</span>
                      </div>
                      <Ilerleme deger={benzersizOran} ton={enEtkiliMi ? "brand" : "ok"} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </motion.div>

      {/* === Katman örtüşmesi === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <GitMerge className="size-4 text-slate-faint" />
              {t("gb.ortusme.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.ortusme.aciklama")}</p>
          {sonuc.ortusmeler.length === 0 ? (
            <NotKutusu ton="yesil">{t("gb.ortusme.bos")}</NotKutusu>
          ) : (
            <div className="space-y-4">
              {/* Örtüşme yoğunluğu — histogram (çift başına birlikte-yakalama).
                  Amber ton; alttaki liste ayrıntıyı verir, üst özet dağılımı. */}
              {sonuc.ortusmeler.length >= 2 && (
                <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                  <Histogram
                    yukseklik={96}
                    renk="#d97706"
                    kovalar={sonuc.ortusmeler.map((o) => ({
                      etiket: `${katmanAd(o.a).slice(0, 4)}·${katmanAd(o.b).slice(0, 4)}`,
                      deger: o.birlikte,
                    }))}
                  />
                </div>
              )}
              <div className="space-y-2.5">
              {sonuc.ortusmeler.map((o) => {
                const oran = enYuksekOrtusme > 0 ? (o.birlikte / enYuksekOrtusme) * 100 : 0;
                const IkonA = KATMAN_IKON[o.a];
                const IkonB = KATMAN_IKON[o.b];
                return (
                  <div
                    key={`${o.a}|${o.b}`}
                    className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-slate-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <IkonA className="size-4 text-slate-faint" />
                        {katmanAd(o.a)}
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-slate-faint" />
                      <span className="inline-flex items-center gap-1.5">
                        <IkonB className="size-4 text-slate-faint" />
                        {katmanAd(o.b)}
                      </span>
                    </div>
                    <div className="ml-auto flex w-40 shrink-0 items-center gap-3">
                      <Ilerleme deger={oran} ton="warn" />
                      <span className="w-24 shrink-0 text-right text-[12px] text-slate-muted">
                        <span className="font-semibold tabular-nums text-slate-ink">{nf(o.birlikte)}</span>{" "}
                        {t("gb.ortusme.birlikte")}
                      </span>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </Panel>
      </motion.div>

      {/* === Savunma boşlukları === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <ShieldAlert className="size-4 text-danger2" />
              {t("gb.bosluk.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.bosluk.aciklama")}</p>
          {sonuc.bosluklar.length === 0 ? (
            <NotKutusu ton="yesil">{t("gb.bosluk.bos")}</NotKutusu>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {sonuc.bosluklar.map((b) => (
                <div
                  key={b.botClass}
                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-danger-soft px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70 text-danger2">
                    <Target className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-red-800">{turAd(b.botClass)}</span>
                      <Badge ton="kirmizi">{t("gb.bosluk.uyari")}</Badge>
                    </div>
                    <div className="text-[12px] text-red-700">{doldur("gb.bosluk.olay", { n: nf(b.olay) })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>

      {/* === Katman Öz-Ayar Önerileri (kapalı-döngü self-tuning) === */}
      {ozAyar.gercekVeri && (
        <motion.div {...fade}>
          <Panel
            baslik={
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-slate-faint" />
                {t("gb.ozayar.baslik")}
              </span>
            }
          >
            <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.ozayar.aciklama")}</p>

            {/* Hedef site seçici: önerinin kurala çevrileceği site. Site yoksa uyarı. */}
            {siteler.length === 0 ? (
              <div className="mb-4">
                <NotKutusu ton="bilgi">{t("gb.ozayar.siteGerek")}</NotKutusu>
              </div>
            ) : (
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <label
                  htmlFor="ozayar-site"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-muted"
                >
                  <Wand2 className="size-3.5 text-slate-faint" />
                  {t("gb.ozayar.siteSec")}
                </label>
                <select
                  id="ozayar-site"
                  value={seciliSite}
                  onChange={(e) => setSeciliSite(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-slate-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                >
                  {siteler.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3 istatistik hapı: ayar skoru (halkalı) + boşluk + güçlendir */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Öz-ayar skoru — halka/skor */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                <SkorHalka deger={ozAyar.ayarSkoru} azalt={azalt} />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-ink">{t("gb.ozayar.skor")}</div>
                  <div className="text-[12px] text-slate-faint">{t("gb.ozayar.skorAlt")}</div>
                </div>
              </div>
              {/* Savunma boşluğu (kırmızı) */}
              <div
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl border p-4",
                  ozAyar.bosluk > 0 ? "border-red-200 bg-danger-soft" : "border-line bg-surface",
                )}
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl",
                    ozAyar.bosluk > 0 ? "bg-white/70 text-danger2" : "bg-canvas text-slate-muted",
                  )}
                >
                  <ShieldOff className="size-5" />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-[26px] font-bold leading-none num tabular-nums",
                      ozAyar.bosluk > 0 ? "text-danger2" : "text-slate-ink",
                    )}
                  >
                    {nf(ozAyar.bosluk)}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-muted">{t("gb.ozayar.bosluk")}</div>
                </div>
              </div>
              {/* Güçlendirilecek */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-brand-600">
                  <TrendingUp className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[26px] font-bold leading-none num tabular-nums text-slate-ink">
                    {nf(ozAyar.guclendir)}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-muted">{t("gb.ozayar.guclendir")}</div>
                </div>
              </div>
            </div>

            {/* Öneri türü dağılımı — donut halka (guclendir/koru/gereksiz/bosluk).
                Liste tekrarını kırar; kapalı-döngü karışımını bir bakışta verir. */}
            {ozAyar.oneriler.length > 0 && (() => {
              const turSayac: Record<OneriTur, number> = { guclendir: 0, koru: 0, gereksiz: 0, bosluk: 0 };
              for (const o of ozAyar.oneriler) turSayac[o.tur] = (turSayac[o.tur] ?? 0) + 1;
              const donutRenk: Record<OneriTur, string> = {
                guclendir: "#2f6fed",
                koru: "#16a34a",
                bosluk: "#dc2626",
                gereksiz: "#9c9a90",
              };
              const segmentler = (Object.keys(turSayac) as OneriTur[])
                .filter((k) => turSayac[k] > 0)
                .map((k) => ({ etiket: t(`gb.ozayar.tur.${k}`), deger: turSayac[k], renk: donutRenk[k] }));
              if (segmentler.length === 0) return null;
              return (
                <div className="mt-4 rounded-2xl border border-line bg-canvas/40 p-4">
                  <DonutDagilim segmentler={segmentler} merkezEtiket={t("gb.ozayar.baslik")} />
                </div>
              );
            })()}

            {/* Önceliklendirilmiş öneri listesi (motor zaten oncelik'e göre sıralı) */}
            <div className="mt-4 space-y-2.5">
              {ozAyar.oneriler.slice(0, 12).map((o, i) => {
                const Ikon = ONERI_IKON[o.tur];
                const ton = ONERI_TON[o.tur]; // "yesil"|"sari"|"kirmizi"|"gri" → Badge ton'u
                // Bu öneri kurala çevrilebilir mi? ("gereksiz" bilgi amaçlı, uygulanamaz)
                const uygulanabilir = UYGULANABILIR.has(o.tur);
                const anahtar = oneriAnahtar(o.botClass, o.tur);
                const uygulanmis = uygulanan.has(anahtar);
                const buYukleniyor = yukleniyor === anahtar;
                return (
                  <div
                    key={`${o.tur}|${o.botClass}|${o.katman ?? "-"}|${i}`}
                    className="flex items-start gap-3.5 rounded-xl border border-line bg-surface px-4 py-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                        o.tur === "bosluk" || o.tur === "guclendir"
                          ? "bg-danger-soft text-danger2"
                          : o.tur === "koru"
                            ? "bg-ok-soft text-green-700"
                            : "bg-canvas text-slate-muted",
                      )}
                    >
                      <Ikon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* tur rozeti (ONERI_TON → Badge; etiket tur'a göre) */}
                        <Badge ton={ton}>{t(`gb.ozayar.tur.${o.tur}`)}</Badge>
                        {/* bot türü etiketi (enum → gb.tur.<enum>) */}
                        <span className="text-[13px] font-semibold text-slate-ink">{turAd(o.botClass)}</span>
                        {/* hedef katman (varsa; enum → gb.katman.<KatmanId>) */}
                        {o.katman && (
                          <>
                            <ArrowRight className="size-3 shrink-0 text-slate-faint" />
                            <span className="text-[13px] font-medium text-slate-muted">{katmanAd(o.katman)}</span>
                          </>
                        )}
                        {/* zorluk delta hapı (yalnız pozitifse) */}
                        {o.zorlukDelta > 0 && (
                          <Badge ton="brand">
                            +{nf(o.zorlukDelta)} {t("gb.ozayar.zorluk")}
                          </Badge>
                        )}
                      </div>
                      {/* gerekçe: motor-üretimli TR anlatı + gömülü veri; olduğu gibi (veri) */}
                      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-muted">{o.gerekce}</p>

                      {/* Eylem halkası: uygulanabilir öneriler için "Uygula" butonu.
                          Uygulandıysa yeşil "Uygulandı ✓" hapı + Kurallara git linki.
                          "gereksiz" bilgi amaçlı — hiçbir buton çıkmaz (as-is). */}
                      {uygulanabilir && (
                        <div className="mt-2.5">
                          {uygulanmis ? (
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-green-700">
                                <Check className="size-3.5" />
                                {t("gb.ozayar.uygulandi")}
                              </span>
                              <a
                                href="/panel/kurallar"
                                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 transition hover:text-brand-700"
                              >
                                {t("gb.ozayar.kurallaraGit")}
                                <ArrowRight className="size-3" />
                              </a>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={buYukleniyor || !seciliSite}
                              onClick={() => uygula(o.botClass, o.tur)}
                            >
                              {buYukleniyor ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  {t("gb.ozayar.uygulaniyor")}
                                </>
                              ) : (
                                <>
                                  <Wand2 className="size-3.5" />
                                  {t("gb.ozayar.uygula")}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "+N daha" notu (ilk 12'nin ötesi varsa) */}
            {ozAyar.oneriler.length > 12 && (
              <p className="mt-3 text-[12px] text-slate-faint">
                {doldur("gb.ozayar.dahaFazla", { n: nf(ozAyar.oneriler.length - 12) })}
              </p>
            )}

            {/* Kapalı-döngü kısa açıklayıcı + dürüstlük notu:
                öneriler gerçek katman-hit verisinden deterministik;
                uygulama insan onaylı — üretimi kendiliğinden DEĞİŞTİRMEZ. */}
            <div className="mt-4 space-y-2.5">
              <NotKutusu ton="yesil">{t("gb.ozayar.kapali")}</NotKutusu>
              <NotKutusu ton="bilgi">{t("gb.ozayar.durustluk")}</NotKutusu>
            </div>
          </Panel>
        </motion.div>
      )}

      {/* === Öz-Ayar Etki Takibi (kapalı-döngü ölçüm: öner → uygula → ÖLÇ) === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <Activity className="size-4 text-slate-faint" />
              {t("gb.etki.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">{t("gb.etki.aciklama")}</p>

          {etki.bos ? (
            <NotKutusu ton="bilgi">{t("gb.etki.bos")}</NotKutusu>
          ) : (
            <>
              {/* 2 istatistik hapı: izlenen kural + etkili bulunan */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-brand-600">
                    <Activity className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[26px] font-bold leading-none num tabular-nums text-slate-ink">
                      {nf(etki.toplam)}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-muted">{t("gb.etki.toplam")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ok-soft text-green-700">
                    <Check className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[26px] font-bold leading-none num tabular-nums text-slate-ink">
                      {nf(etki.etkili)}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-muted">{t("gb.etki.etkili")}</div>
                  </div>
                </div>
              </div>

              {/* Kural etki kartları (motor createdAt'e göre yeni→eski sıralı) */}
              <div className="mt-4 space-y-2.5">
                {etki.etkiler.map((e) => {
                  // Hacim: negatif=iyi (yeşil, aşağı ok), pozitif=kötü (kırmızı, yukarı ok), 0=nötr.
                  const hacimIyi = e.hacimDegisim < 0;
                  const hacimKotu = e.hacimDegisim > 0;
                  const HacimIkon = hacimIyi ? ArrowDownRight : hacimKotu ? ArrowUpRight : Minus;
                  const hacimRenk = hacimIyi
                    ? "text-green-700"
                    : hacimKotu
                      ? "text-danger2"
                      : "text-slate-faint";
                  const hacimIsaret = e.hacimDegisim > 0 ? "+" : "";
                  const hacimMetin =
                    dil === "tr"
                      ? `%${hacimIsaret}${nf(e.hacimDegisim)}`
                      : `${hacimIsaret}${nf(e.hacimDegisim)}%`;
                  // Engel: pozitif=iyi (yeşil, daha çok engellendi), negatif=kötü (kırmızı).
                  const engelIyi = e.engelDegisim > 0;
                  const engelKotu = e.engelDegisim < 0;
                  const engelRenk = engelIyi
                    ? "text-green-700"
                    : engelKotu
                      ? "text-danger2"
                      : "text-slate-faint";
                  const engelIsaret = e.engelDegisim > 0 ? "+" : "";
                  return (
                    <div
                      key={e.ruleId}
                      className="rounded-xl border border-line bg-surface px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {/* etki kararı rozeti (ETKI_TON → Badge; etiket enum'a göre) */}
                        <Badge ton={ETKI_TON[e.etki]}>{t(`gb.etki.karar.${e.etki}`)}</Badge>
                        {/* hedef bot türü (enum → gb.tur.<enum>) */}
                        <span className="text-[13px] font-semibold text-slate-ink">{turAd(e.botClass)}</span>
                        {/* kural eylemi (ham enum değeri — çevrilmez) */}
                        <Badge ton="gri">{e.action}</Badge>
                      </div>

                      {/* öncesi → sonrası olay kıyası */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
                        <span className="inline-flex items-center gap-1.5 text-slate-muted">
                          <span className="text-slate-faint">{t("gb.etki.oncesi")}</span>
                          <span className="font-semibold tabular-nums text-slate-ink">{nf(e.oncesiOlay)}</span>
                          <ArrowRight className="size-3 shrink-0 text-slate-faint" />
                          <span className="text-slate-faint">{t("gb.etki.sonrasi")}</span>
                          <span className="font-semibold tabular-nums text-slate-ink">{nf(e.sonrasiOlay)}</span>
                          <span className="text-slate-faint">{t("gb.etki.olay")}</span>
                        </span>

                        {/* hacim değişimi (işaretli %) */}
                        <span className={cn("inline-flex items-center gap-1.5", hacimRenk)}>
                          <HacimIkon className="size-3.5 shrink-0" />
                          <span className="text-slate-faint">{t("gb.etki.hacim")}</span>
                          <span className="font-semibold tabular-nums">{hacimMetin}</span>
                        </span>

                        {/* engelleme değişimi (işaretli puan/pp) */}
                        <span className={cn("inline-flex items-center gap-1.5", engelRenk)}>
                          <span className="text-slate-faint">{t("gb.etki.engel")}</span>
                          <span className="font-semibold tabular-nums">
                            {engelIsaret}
                            {nf(e.engelDegisim)} {t("gb.etki.puan")}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dürüstlük notu: eşit öncesi/sonrası pencere; az örnekli kurallar işaretli */}
              <div className="mt-4">
                <NotKutusu ton="bilgi">{t("gb.etki.durustluk")}</NotKutusu>
              </div>
            </>
          )}
        </Panel>
      </motion.div>

      {/* === Derinlemesine savunma açıklayıcı === */}
      <motion.div {...fade}>
        <Panel
          baslik={
            <span className="inline-flex items-center gap-2">
              <Info className="size-4 text-slate-faint" />
              {t("gb.aciklayici.baslik")}
            </span>
          }
        >
          <div className="space-y-3 text-[13px] leading-relaxed text-slate-muted">
            <p>{t("gb.aciklayici.p1")}</p>
            <p>{t("gb.aciklayici.p2")}</p>
          </div>
          <div className="mt-4">
            <NotKutusu ton="bilgi">{t("gb.aciklayici.durustluk")}</NotKutusu>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}

/**
 * SkorHalka — öz-ayar sağlık skorunu (0-100) halka olarak gösterir.
 * Renk skora göre: düşük=kırmızı, orta=amber, yüksek=yeşil. Sayı gerçek veridir.
 * prefers-reduced-motion açıkken halka animasyonsuz çizilir.
 */
function SkorHalka({ deger, azalt }: { deger: number; azalt: boolean | null }) {
  const oran = Math.max(0, Math.min(100, deger)) / 100;
  const cevre = 2 * Math.PI * 20; // r=20
  const dolu = cevre * oran;
  // Skor bandına göre halka rengi (görsel dil; sayı değişmez).
  const renk = deger >= 70 ? "#16a34a" : deger >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 48 48" className="size-14 -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-canvas" />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={renk}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={azalt ? { strokeDashoffset: cevre - dolu } : { strokeDashoffset: cevre }}
          animate={{ strokeDashoffset: cevre - dolu }}
          transition={azalt ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[13px] font-bold tabular-nums text-slate-ink">{Math.round(deger)}</span>
    </div>
  );
}
