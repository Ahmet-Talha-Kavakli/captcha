"use client";

/**
 * Platform Yönetici Konsolu — istemci arayüzü.
 * =============================================
 * Salt-okunur operasyon görünümü + temsili operasyonel kontroller. Özellik
 * bayrakları localStorage'da tutulur (demo; production'da merkezi bir bayrak
 * servisi olurdu). Yıkıcı işlem yoktur.
 */
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ServerCog,
  Users2,
  Globe,
  ShieldBan,
  Activity,
  Wallet,
  HeartPulse,
  Bot,
  Flag,
  Database,
  Cpu,
  CircleDot,
  AlertTriangle,
  TrendingUp,
  Lock,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { Panel, StatKart, Badge, Ulke, DurumRozeti, Tablo, Avatar, Ilerleme, useToast, type Kolon } from "@/components/panel/kit";
import {
  TrendGrafik,
  DonutDagilim,
  CografyaBar,
  KorumaSkoru,
  SkorCubugu,
} from "@/components/panel/grafikler";
import { Gauge as GaugeGost, IsiMatris } from "@/components/panel/grafikler-ek";
import type { Plan } from "@/lib/specter/plans";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { adminCeviri } from "./admin.i18n";

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ tipler */

export interface HesapSatir {
  id: string;
  ad: string;
  email: string;
  plan: Plan;
  renk: string;
  siteSayisi: number;
  olay30g: number;
  engellenen30g: number;
  ekipSayisi: number;
  tokenSayisi: number;
  kuralSayisi: number;
  durum: "aktif" | "bosta";
  olusturuldu: number;
  sonGorulme: number;
}

export interface AdminVeri {
  toplamHesap: number;
  toplamKullanici: number;
  toplamSite: number;
  dogrulanmamisSite: number;
  toplamOlay30g: number;
  toplamEngellenen30g: number;
  toplamDogrulanan30g: number;
  toplamChallenge30g: number;
  toplamAktifKampanya: number;
  toplamKritikAcikUyari: number;
  toplamToken: number;
  toplamKural: number;
  toplamEkipUye: number;
  botOran: number;
  engelOran: number;
  saglikSkoru: number;
  planSayim: Record<Plan, number>;
  planFiyatTl: Record<Plan, number>;
  mrrTl: number;
  hesaplar: HesapSatir[];
  enTehditliUlkeler: { kod: string; ad: string; deger: number }[];
  buyukKampanyalar: {
    id: string;
    ad: string;
    site: string;
    durum: string;
    toplamIstek: number;
    engellenen: number;
    zirveRps: number;
    ulkeler: string[];
  }[];
  gunler: string[];
  gunlukIssued: number[];
  gunlukBlocked: number[];
  kayitSayimlari: {
    kullanicilar: number;
    siteler: number;
    kurallar: number;
    tokenlar: number;
    ekip: number;
    kampanyalar: number;
  };
}

/* ------------------------------------------------------------------ yardımcılar */

/* Plan enum → ton/renk (etiket t("plan.<enum>") ile ayrıca alınır). */
const PLAN_META: Record<Plan, { ton: "gri" | "brand" | "mavi"; renk: string }> = {
  free: { ton: "gri", renk: "#94a3b8" },
  pro: { ton: "brand", renk: "#4a41e8" },
  scale: { ton: "mavi", renk: "#2f6fed" },
};

/* Kampanya durum enum → ton (etiket t("kamp.durum.<enum>") ile alınır). */
const KAMPANYA_DURUM_TON: Record<string, "kirmizi" | "yesil" | "sari"> = {
  active: "kirmizi",
  mitigated: "yesil",
  monitoring: "sari",
};

/** Kısa sayı biçimi — yerele-duyarlı (12,3 B / 4,5 Mn). */
function kisaSayi(n: number, loc: string, birler: string, milyonlar: string): string {
  const a = Math.abs(n);
  const ondalik = (x: number, mod: number) =>
    x.toLocaleString(loc, { minimumFractionDigits: mod ? 1 : 0, maximumFractionDigits: 1 });
  if (a >= 1_000_000) return ondalik(n / 1_000_000, a % 1_000_000) + " " + milyonlar;
  if (a >= 1_000) return ondalik(n / 1_000, a % 1_000) + " " + birler;
  return n.toLocaleString(loc);
}

function tl(n: number, loc: string): string {
  return "₺" + n.toLocaleString(loc);
}

function goreliZaman(ts: number, t: (k: string) => string): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("zaman.azOnce");
  if (dk < 60) return t("zaman.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("zaman.sa").replace("{n}", String(sa));
  const gun = Math.floor(sa / 24);
  return t("zaman.gun").replace("{n}", String(gun));
}

/* --- özellik bayrakları (localStorage, temsili operasyonel kontrol) --- */

interface Bayrak {
  key: string;
  /** i18n taban anahtarı: t(`${i18n}.ad`) ve t(`${i18n}.aciklama`) */
  i18n: string;
  varsayilan: boolean;
}
const BAYRAKLAR: Bayrak[] = [
  { key: "yeni-kayit", i18n: "bayrak.yeniKayit", varsayilan: true },
  { key: "bakim-modu", i18n: "bayrak.bakimModu", varsayilan: false },
  { key: "ai-dogrulama-beta", i18n: "bayrak.aiDogrulama", varsayilan: false },
  { key: "edge-otoscale", i18n: "bayrak.edgeOtoscale", varsayilan: true },
  { key: "yeni-onboarding", i18n: "bayrak.yeniOnboarding", varsayilan: false },
];

const BAYRAK_LS = "specter.admin.flags";

function bayraklariOku(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(BAYRAK_LS) || "{}");
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ ana bileşen */

export function AdminIstemci({ veri, dil }: { veri: AdminVeri; dil: Dil }) {
  const t = (k: string) => adminCeviri(k, dil);
  const { goster } = useToast();
  const loc = BCP47[dil];
  const kSayi = (n: number) => kisaSayi(n, loc, t("sayi.bin"), t("sayi.milyon"));
  const kTl = (n: number) => tl(n, loc);

  const [planFiltre, setPlanFiltre] = useState<"hepsi" | Plan>("hepsi");

  // Özellik bayrakları durumu (localStorage senkron).
  const [bayraklar, setBayraklar] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const kayitli = bayraklariOku();
    const baslangic: Record<string, boolean> = {};
    for (const b of BAYRAKLAR) baslangic[b.key] = kayitli[b.key] ?? b.varsayilan;
    setBayraklar(baslangic);
  }, []);
  const bayrakDegistir = useCallback(
    (key: string) => {
      setBayraklar((onceki) => {
        const yeniDeger = !onceki[key];
        const yeni = { ...onceki, [key]: yeniDeger };
        try {
          localStorage.setItem(BAYRAK_LS, JSON.stringify(yeni));
          // Kalıcılık onayı — kullanıcı değişikliğin gerçekten saklandığını görür.
          const bMeta = BAYRAKLAR.find((b) => b.key === key);
          const bAd = bMeta ? adminCeviri(`${bMeta.i18n}.ad`, dil) : key;
          goster({
            tip: "basari",
            baslik: adminCeviri(yeniDeger ? "bayrak.acildi" : "bayrak.kapandi", dil).replace("{ad}", bAd),
          });
        } catch {
          /* yok say */
        }
        return yeni;
      });
    },
    [dil, goster],
  );

  const filtreliHesaplar = useMemo(
    () => (planFiltre === "hepsi" ? veri.hesaplar : veri.hesaplar.filter((h) => h.plan === planFiltre)),
    [veri.hesaplar, planFiltre],
  );

  // Plan dağılımı donut segmentleri.
  const planSegmentler = useMemo(
    () =>
      (["pro", "scale", "free"] as Plan[])
        .map((p) => ({ etiket: t(`plan.${p}`), deger: veri.planSayim[p] ?? 0, renk: PLAN_META[p].renk }))
        .filter((s) => s.deger > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [veri.planSayim, dil],
  );

  const insanOran = veri.botOran > 0 ? 1 - veri.botOran : 1;

  // --- GÖRSEL TÜRETMELER (yalnızca mevcut veriyi OKUR; hiçbir mantık/CRUD değişmez) ---

  // Sistem durumu gauge şeridi — 4 ana operasyonel gösterge (mevcut sağlık paneliyle aynı hesap).
  const dogrulanmisOran =
    veri.toplamSite > 0 ? Math.round(((veri.toplamSite - veri.dogrulanmamisSite) / veri.toplamSite) * 100) : 100;
  const aktifHesapOran =
    veri.toplamHesap > 0 ? Math.round((veri.hesaplar.filter((h) => h.durum === "aktif").length / veri.toplamHesap) * 100) : 0;
  const durumGostergeler = [
    { etiket: t("durum.saglik"), deger: veri.saglikSkoru },
    { etiket: t("durum.insan"), deger: Math.round(insanOran * 100) },
    { etiket: t("durum.dogrulanmis"), deger: dogrulanmisOran },
    { etiket: t("durum.aktifHesap"), deger: aktifHesapOran },
  ];

  // Bayrak dağılım donutu — localStorage durumundan (SALT OKUR; toggle mantığı değişmez).
  const bayrakAcikSayi = BAYRAKLAR.filter((b) => bayraklar[b.key] ?? b.varsayilan).length;
  const bayrakKapaliSayi = BAYRAKLAR.length - bayrakAcikSayi;
  const bayrakSegmentler = [
    { etiket: t("bayrakDagilim.acik"), deger: bayrakAcikSayi, renk: "#2f6fed" },
    { etiket: t("bayrakDagilim.kapali"), deger: bayrakKapaliSayi, renk: "#cbd5e1" },
  ].filter((s) => s.deger > 0);

  // Bölgesel kaynak kullanım ısı-matrisi (temsili, deterministik — worker metrikleriyle aynı ruh).
  const kaynakSatirlar = [t("kaynak.cpu"), t("kaynak.bellek"), t("kaynak.ag"), t("kaynak.kuyruk")];
  const kaynakSutunlar = ["EU-W", "US-E", "US-W", "AP-SE", "SA-E"];
  const kaynakDegerler = [
    [58, 71, 44, 63, 39],
    [62, 55, 48, 70, 41],
    [47, 66, 52, 58, 35],
    [23, 31, 18, 44, 12],
  ];

  // Hesap tablosu kolonları.
  const kolonlar: Kolon<HesapSatir>[] = [
    {
      baslik: t("hesap.kol.hesap"),
      render: (h) => (
        <div className="flex items-center gap-2.5">
          <Avatar ad={h.ad} renk={h.renk} boyut={30} />
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-ink">{h.ad}</div>
            <div className="truncate text-[12px] text-slate-faint">{h.email}</div>
          </div>
        </div>
      ),
    },
    {
      baslik: t("hesap.kol.plan"),
      render: (h) => <Badge ton={PLAN_META[h.plan].ton}>{t(`plan.${h.plan}`)}</Badge>,
    },
    { baslik: t("hesap.kol.site"), className: "num text-right", render: (h) => h.siteSayisi },
    {
      baslik: t("hesap.kol.trafik"),
      className: "num text-right",
      render: (h) => <span className="font-medium">{kSayi(h.olay30g)}</span>,
    },
    {
      baslik: t("hesap.kol.engellenen"),
      className: "num text-right",
      render: (h) => <span className="text-danger2">{kSayi(h.engellenen30g)}</span>,
    },
    { baslik: t("hesap.kol.ekip"), className: "num text-right", render: (h) => h.ekipSayisi },
    { baslik: t("hesap.kol.anahtar"), className: "num text-right", render: (h) => h.tokenSayisi },
    {
      baslik: t("hesap.kol.durum"),
      render: (h) =>
        h.durum === "aktif" ? (
          <DurumRozeti ton="ok" etiket={t("hesap.durum.aktif")} nabiz />
        ) : (
          <DurumRozeti ton="gri" etiket={t("hesap.durum.bosta")} />
        ),
    },
    {
      baslik: t("hesap.kol.sonGorulme"),
      className: "text-right text-[12px] text-slate-faint",
      render: (h) => goreliZaman(h.sonGorulme, t),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* personel-uyarı bandı */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ServerCog className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("band.baslik")}</p>
          <p
            className="mt-0.5 text-[13px] text-slate-muted"
            dangerouslySetInnerHTML={{ __html: t("band.aciklama") }}
          />
        </div>
      </div>

      {/* --- platform özet kartları --- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatKart sayi={kSayi(veri.toplamHesap)} etiket={t("kpi.hesap")} ikon={<Users2 className="size-5" />} />
        <StatKart sayi={kSayi(veri.toplamSite)} etiket={t("kpi.site")} ikon={<Globe className="size-5" />} />
        <StatKart sayi={kSayi(veri.toplamOlay30g)} etiket={t("kpi.trafik")} ikon={<Activity className="size-5" />} />
        <StatKart
          sayi={kSayi(veri.toplamEngellenen30g)}
          etiket={t("kpi.engellenen")}
          ikon={<ShieldBan className="size-5" />}
          tone="danger"
        />
        <StatKart sayi={kTl(veri.mrrTl)} etiket={t("kpi.mrr")} ikon={<Wallet className="size-5" />} tone="ok" />
        <StatKart
          sayi={veri.saglikSkoru}
          etiket={t("kpi.saglik")}
          ikon={<HeartPulse className="size-5" />}
          tone={veri.saglikSkoru >= 80 ? "ok" : veri.saglikSkoru >= 55 ? "warn" : "danger"}
        />
      </div>

      {/* --- kapasite & büyüme trendi + sağlık --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel baslik={t("trend.baslik")} className="lg:col-span-2">
          <TrendGrafik
            noktalar={veri.gunlukIssued}
            seriler={[veri.gunlukIssued, veri.gunlukBlocked]}
            renkler={["#2f6fed", "#dc2626"]}
            seriEtiketleri={[t("trend.seri.istek"), t("trend.seri.engellenen")]}
            etiketler={veri.gunler.map((g) => g.slice(5))}
            yukseklik={240}
          />
          <p className="mt-3 text-[12.5px] text-slate-muted">
            {t("trend.not").replace("{n}", kSayi(Math.round(veri.toplamOlay30g / 30)))}
          </p>
        </Panel>

        <Panel baslik={t("saglik.baslik")}>
          <div className="flex flex-col items-center">
            <KorumaSkoru skor={veri.saglikSkoru} />
            <div className="mt-4 w-full space-y-3">
              <SkorCubugu
                etiket={t("saglik.dogrulanmisSite")}
                deger={dogrulanmisOran}
                renk="#16a34a"
              />
              <SkorCubugu etiket={t("saglik.insanTrafigi")} deger={Math.round(insanOran * 100)} renk="#2f6fed" />
              <SkorCubugu
                etiket={t("saglik.aktifHesap")}
                deger={aktifHesapOran}
                renk="#4a41e8"
              />
            </div>
          </div>
        </Panel>
      </div>

      {/* --- sistem durumu: gauge şeridi (skor-çubuğu monotonluğunu kırar) --- */}
      <Panel baslik={t("durum.baslik")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {durumGostergeler.map((g, i) => (
            <motion.div
              key={g.etiket}
              className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 py-4"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <GaugeGost deger={g.deger} boyut={128} />
              <span className="mt-1 text-center text-[12px] font-medium text-slate-muted">{g.etiket}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[12px] text-slate-faint">
          <HeartPulse className="mt-0.5 size-3.5 shrink-0 text-ok" />
          {t("durum.not")}
        </p>
      </Panel>

      {/* --- plan dağılımı + MRR kırılımı + küresel tehdit --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel baslik={t("plan.baslik")}>
          <DonutDagilim segmentler={planSegmentler} />
        </Panel>

        <Panel baslik={t("mrr.baslik")}>
          <div className="space-y-3">
            {(["scale", "pro", "free"] as Plan[]).map((p) => {
              const adet = veri.planSayim[p] ?? 0;
              const gelir = adet * veri.planFiyatTl[p];
              const oran = veri.mrrTl > 0 ? (gelir / veri.mrrTl) * 100 : 0;
              return (
                <div key={p}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-slate-muted">
                      <span className="size-2.5 rounded-full" style={{ background: PLAN_META[p].renk }} />
                      {t(`plan.${p}`)}
                      <span className="text-slate-faint">· {t("mrr.hesapCarpim").replace("{n}", String(adet)).replace("{tl}", kTl(veri.planFiyatTl[p]))}</span>
                    </span>
                    <span className="num font-semibold text-slate-ink">{kTl(gelir)}</span>
                  </div>
                  <Ilerleme deger={oran} ton={p === "scale" ? "brand" : p === "pro" ? "ok" : "warn"} />
                </div>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[13px] font-medium text-slate-ink">{t("mrr.toplam")}</span>
              <span className="num text-lg font-bold text-ok">{kTl(veri.mrrTl)}</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-faint">
              {t("mrr.not").replace("{tl}", kTl(veri.planFiyatTl.scale))}
            </p>
          </div>
        </Panel>

        <Panel baslik={t("cografya.baslik")}>
          <CografyaBar ulkeler={veri.enTehditliUlkeler} />
        </Panel>
      </div>

      {/* --- küresel tehdit duruşu özeti --- */}
      <Panel baslik={t("tehdit.baslik")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-slate-faint">
              <Bot className="size-4" />
              <span className="text-[12px] font-medium uppercase tracking-wide">{t("tehdit.botOran")}</span>
            </div>
            <div className="num mt-2 text-2xl font-bold text-slate-ink">%{Math.round(veri.botOran * 100)}</div>
            <div className="mt-1 text-[12px] text-slate-muted">{t("tehdit.botOranAlt")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-slate-faint">
              <ShieldBan className="size-4" />
              <span className="text-[12px] font-medium uppercase tracking-wide">{t("tehdit.toplamEngellenen")}</span>
            </div>
            <div className="num mt-2 text-2xl font-bold text-danger2">{kSayi(veri.toplamEngellenen30g)}</div>
            <div className="mt-1 text-[12px] text-slate-muted">{t("tehdit.toplamEngellenenAlt")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-slate-faint">
              <Activity className="size-4" />
              <span className="text-[12px] font-medium uppercase tracking-wide">{t("tehdit.aktifKampanya")}</span>
            </div>
            <div className="num mt-2 text-2xl font-bold text-warn">{veri.toplamAktifKampanya}</div>
            <div className="mt-1 text-[12px] text-slate-muted">{t("tehdit.aktifKampanyaAlt")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-slate-faint">
              <AlertTriangle className="size-4" />
              <span className="text-[12px] font-medium uppercase tracking-wide">{t("tehdit.acikKritik")}</span>
            </div>
            <div className="num mt-2 text-2xl font-bold text-danger2">{veri.toplamKritikAcikUyari}</div>
            <div className="mt-1 text-[12px] text-slate-muted">{t("tehdit.acikKritikAlt")}</div>
          </div>
        </div>

        {/* en büyük kampanyalar */}
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("kamp.baslik")}</div>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40 text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  <th className="px-4 py-2.5">{t("kamp.kol.kampanya")}</th>
                  <th className="px-4 py-2.5">{t("kamp.kol.site")}</th>
                  <th className="px-4 py-2.5">{t("kamp.kol.durum")}</th>
                  <th className="px-4 py-2.5 text-right">{t("kamp.kol.toplamIstek")}</th>
                  <th className="px-4 py-2.5 text-right">{t("kamp.kol.engellenen")}</th>
                  <th className="px-4 py-2.5 text-right">{t("kamp.kol.zirveRps")}</th>
                  <th className="px-4 py-2.5">{t("kamp.kol.cografya")}</th>
                </tr>
              </thead>
              <tbody>
                {veri.buyukKampanyalar.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-faint">
                      {t("kamp.bos")}
                    </td>
                  </tr>
                ) : (
                  veri.buyukKampanyalar.map((c) => {
                    const ton = KAMPANYA_DURUM_TON[c.durum] ?? ("gri" as const);
                    const durumEtiket = KAMPANYA_DURUM_TON[c.durum] ? t(`kamp.durum.${c.durum}`) : c.durum;
                    return (
                      <tr key={c.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-ink">{c.ad}</td>
                        <td className="px-4 py-3 text-slate-muted">{c.site}</td>
                        <td className="px-4 py-3">
                          <Badge ton={ton}>{durumEtiket}</Badge>
                        </td>
                        <td className="num px-4 py-3 text-right text-slate-ink">{kSayi(c.toplamIstek)}</td>
                        <td className="num px-4 py-3 text-right text-danger2">{kSayi(c.engellenen)}</td>
                        <td className="num px-4 py-3 text-right text-slate-ink">{c.zirveRps.toLocaleString(loc)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.ulkeler.slice(0, 3).map((u) => (
                              <Ulke key={u} kod={u} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* --- hesap tablosu --- */}
      <Panel
        baslik={t("hesap.baslik")}
        sagUst={
          <div className="flex items-center gap-1.5">
            {(["hepsi", "pro", "scale", "free"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlanFiltre(p)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12.5px] font-medium transition",
                  planFiltre === p
                    ? "bg-brand-600 text-white"
                    : "border border-line text-slate-muted hover:border-line-strong hover:text-slate-ink",
                )}
              >
                {p === "hepsi" ? t("hesap.filtre.hepsi") : t(`plan.${p}`)}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex items-center gap-2 text-[12.5px] text-slate-muted">
          <Search className="size-4 text-slate-faint" />
          <span>{t("hesap.arama").replace("{n}", String(filtreliHesaplar.length))}</span>
        </div>
        <Tablo
          kolonlar={kolonlar}
          veri={filtreliHesaplar}
          ara={(h) => `${h.ad} ${h.email} ${h.plan}`}
          araPlaceholder={t("hesap.araPlaceholder")}
          sayfaBoyu={15}
        />
      </Panel>

      {/* --- sistem operasyonu: özellik bayrakları + queue/worker + DB --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          baslik={t("bayrak.baslik")}
          sagUst={<Badge ton="sari">{t("bayrak.rozet")}</Badge>}
        >
          {/* bayrak dağılım donutu — açık/kapalı özeti (toggle mantığı değişmez) */}
          <div className="mb-4 rounded-2xl border border-line bg-canvas/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              <Flag className="size-3.5" />
              {t("bayrakDagilim.baslik")}
            </div>
            <DonutDagilim segmentler={bayrakSegmentler} merkezEtiket={t("bayrakDagilim.merkez")} />
          </div>
          <div className="space-y-1">
            {BAYRAKLAR.map((b) => {
              const acik = bayraklar[b.key] ?? b.varsayilan;
              const bAd = t(`${b.i18n}.ad`);
              return (
                <div
                  key={b.key}
                  className="flex items-start justify-between gap-4 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Flag className="size-3.5 text-slate-faint" />
                      <span className="text-[14px] font-medium text-slate-ink">{bAd}</span>
                      {b.key === "bakim-modu" && acik && <Badge ton="kirmizi">{t("bayrak.aktif")}</Badge>}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-slate-muted">{t(`${b.i18n}.aciklama`)}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={acik}
                    aria-label={bAd}
                    onClick={() => bayrakDegistir(b.key)}
                    className={cn(
                      "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
                      acik ? "bg-brand-600" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                        acik ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] text-slate-faint">
            {t("bayrak.not")}
          </p>
        </Panel>

        <div className="space-y-6">
          {/* queue / worker sağlığı (temsili) */}
          <Panel baslik={t("worker.baslik")}>
            <div className="space-y-3.5">
              {[
                { anahtar: "edge", deger: 98, ton: "ok" as const },
                { anahtar: "ingest", deger: 87, ton: "ok" as const },
                { anahtar: "webhook", deger: 72, ton: "warn" as const },
                { anahtar: "rapor", deger: 100, ton: "ok" as const },
              ].map((w) => (
                <div key={w.anahtar}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-slate-ink">
                      <Cpu className="size-3.5 text-slate-faint" />
                      {t(`worker.${w.anahtar}.ad`)}
                    </span>
                    <span className="num font-semibold text-slate-ink">%{w.deger}</span>
                  </div>
                  <Ilerleme deger={w.deger} ton={w.ton} />
                  <div className="mt-1 text-[11.5px] text-slate-faint">{t(`worker.${w.anahtar}.alt`)}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-slate-faint">{t("worker.not")}</p>
          </Panel>

          {/* DB & kayıt sayıları (GERÇEK toplamlar) */}
          <Panel baslik={t("db.baslik")}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { anahtar: "db.kullanici", deger: veri.kayitSayimlari.kullanicilar, ikon: <Users2 className="size-4" /> },
                { anahtar: "db.site", deger: veri.kayitSayimlari.siteler, ikon: <Globe className="size-4" /> },
                { anahtar: "db.kural", deger: veri.kayitSayimlari.kurallar, ikon: <CircleDot className="size-4" /> },
                { anahtar: "db.anahtar", deger: veri.kayitSayimlari.tokenlar, ikon: <Lock className="size-4" /> },
                { anahtar: "db.ekip", deger: veri.kayitSayimlari.ekip, ikon: <Users2 className="size-4" /> },
                { anahtar: "db.kampanya", deger: veri.kayitSayimlari.kampanyalar, ikon: <Activity className="size-4" /> },
              ].map((r) => (
                <div key={r.anahtar} className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">{r.ikon}</span>
                  <div>
                    <div className="num text-lg font-bold text-slate-ink">{r.deger.toLocaleString(loc)}</div>
                    <div className="text-[12px] text-slate-faint">{t(r.anahtar)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 text-[12.5px] text-slate-muted">
              <Database className="size-4 text-slate-faint" />
              <span>{t("db.not")}</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* --- bölgesel kaynak kullanımı (ısı-matris; liste tekrarını kırar) --- */}
      <Panel baslik={t("kaynak.baslik")}>
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <IsiMatris
            satirlar={kaynakSatirlar}
            sutunlar={kaynakSutunlar}
            degerler={kaynakDegerler}
            renk="#2f6fed"
          />
        </motion.div>
        <p className="mt-3 flex items-start gap-1.5 text-[12px] text-slate-faint">
          <Cpu className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
          {t("kaynak.aciklama")}
        </p>
      </Panel>

      {/* --- kapasite büyüme özeti (küçük statlar) --- */}
      <Panel baslik={t("kapasite.baslik")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <TrendingUp className="size-4 text-ok" />
            <div className="num mt-2 text-xl font-bold text-slate-ink">{kSayi(Math.round(veri.toplamOlay30g / 30))}</div>
            <div className="text-[12px] text-slate-muted">{t("kapasite.gunlukOrt")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <Globe className="size-4 text-brand-600" />
            <div className="num mt-2 text-xl font-bold text-slate-ink">{veri.dogrulanmamisSite}</div>
            <div className="text-[12px] text-slate-muted">{t("kapasite.dogrulanmamis")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <Users2 className="size-4 text-brand-600" />
            <div className="num mt-2 text-xl font-bold text-slate-ink">{veri.toplamKullanici.toLocaleString(loc)}</div>
            <div className="text-[12px] text-slate-muted">{t("kapasite.toplamKullanici")}</div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/40 p-4">
            <CircleDot className="size-4 text-brand-600" />
            <div className="num mt-2 text-xl font-bold text-slate-ink">{veri.toplamKural.toLocaleString(loc)}</div>
            <div className="text-[12px] text-slate-muted">{t("kapasite.aktifKural")}</div>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] text-slate-muted">
          {t("kapasite.not")}
        </p>
      </Panel>

      {/* --- dürüst rol-kapı notu --- */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span dangerouslySetInnerHTML={{ __html: t("rolkapi.not") }} />
      </div>
    </div>
  );
}
