"use client";

import Link from "next/link";
import {
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  Users,
  Wrench,
  Gauge,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { KorumaSkoru, TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { SaglikSonuc, SaglikBoyut, ChurnSeviye, SaglikSeviyeAd, SaglikGirdi } from "@/lib/specter/hesap-saglik";
import type { Dil } from "@/lib/i18n/panel";
import { hesapSaglikCeviri } from "./hesap-saglik.i18n";

type Ceviri = (anahtar: string) => string;
type BoyutAnahtar = SaglikBoyut["anahtar"];

/* Boyut anahtarı → ikon eşlemesi. */
const BOYUT_IKON: Record<BoyutAnahtar, React.ComponentType<{ className?: string }>> = {
  kurulum: Layers,
  kullanim: Activity,
  yapilandirma: Wrench,
  yonetisim: Users,
  operasyon: Gauge,
};

/* Durum → renk (grafiklerdeki eşiklerle uyumlu). */
function durumRenk(skor: number): string {
  return skor >= 70 ? "#16a34a" : skor >= 40 ? "#d97706" : "#dc2626";
}

/* Durum rozeti tonu (SaglikDurum enum → ton; ad çevrilir). */
const DURUM_TON: Record<SaglikBoyut["durum"], "yesil" | "sari" | "kirmizi"> = {
  iyi: "yesil",
  orta: "sari",
  zayif: "kirmizi",
};

/* Olgunluk seviyesi rozet tonu (SaglikSeviyeAd enum → ton; ad çevrilir). */
const SEVIYE_TON: Record<SaglikSeviyeAd, "yesil" | "sari" | "kirmizi" | "mavi"> = {
  mükemmel: "yesil",
  iyi: "mavi",
  gelişmeli: "sari",
  riskli: "kirmizi",
};

/* Churn seviyesi rozet tonu + renk (ChurnSeviye enum → ton; ad çevrilir). */
const CHURN_TON: Record<ChurnSeviye, { ton: "yesil" | "sari" | "kirmizi"; renk: string }> = {
  dusuk: { ton: "yesil", renk: "#16a34a" },
  orta: { ton: "sari", renk: "#d97706" },
  yuksek: { ton: "kirmizi", renk: "#dc2626" },
};

/* Kısa {n}/{a}/{b} yer tutucu değiştirici. */
function ara(metin: string, degerler: Record<string, string | number>): string {
  let s = metin;
  for (const [k, v] of Object.entries(degerler)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/**
 * Boyut AYRINTI ölçütlerini ham girdi sinyallerinden yeniden kur.
 * lib'deki boyutKurulum/…/boyutOperasyon `ayrinti` üretimini birebir yansıtır
 * (lib TR string'i kullanılmaz — anahtardan çevrilir).
 */
function boyutAyrinti(anahtar: BoyutAnahtar, g: SaglikGirdi, t: Ceviri): string[] {
  if (anahtar === "kurulum") {
    const a: string[] = [];
    if (g.siteSayisi === 0) a.push(t("hs.ay.siteYok"));
    else {
      a.push(ara(t("hs.ay.siteDogrulandi"), { a: g.dogrulanmisSite, b: g.siteSayisi }));
      a.push(ara(t("hs.ay.siteTrafik"), { a: g.trafikliSite, b: g.siteSayisi }));
    }
    a.push(g.kuralSayisi > 0 ? ara(t("hs.ay.kuralTanimli"), { n: g.kuralSayisi }) : t("hs.ay.kuralYok"));
    return a;
  }
  if (anahtar === "kullanim") {
    const oran = g.kota > 0 ? g.aylikKullanim / g.kota : 0;
    return [
      ara(t("hs.ay.kotaKullanildi"), { n: Math.round(oran * 100) }),
      ara(t("hs.ay.aktifGun"), { n: g.aktifGunSayisi }),
      g.sonAktiflikGun <= 0 ? t("hs.ay.bugunAktif") : ara(t("hs.ay.sonAktiflik"), { n: g.sonAktiflikGun }),
    ];
  }
  if (anahtar === "yapilandirma") {
    return [
      ara(t("hs.ay.ozelKural"), { n: g.ozelKural }),
      ara(t("hs.ay.aiPolitika"), { n: g.aiPolitikaSayisi }),
      g.aktifEntegrasyon > 0 ? ara(t("hs.ay.entVar"), { n: g.aktifEntegrasyon }) : t("hs.ay.entYok"),
    ];
  }
  if (anahtar === "yonetisim") {
    return [
      ara(t("hs.ay.ekipUye"), { n: g.ekipUyeSayisi }),
      g.aktifTokenSayisi > 0 ? ara(t("hs.ay.tokenVar"), { n: g.aktifTokenSayisi }) : t("hs.ay.tokenYok"),
      ara(t("hs.ay.denetim"), { n: g.denetimKayitSayisi }),
    ];
  }
  // operasyon
  const cozulmeOran = g.toplamAlarm > 0 ? g.cozulenAlarm / g.toplamAlarm : 1;
  return [
    g.acikKritikAlarm > 0 ? ara(t("hs.ay.acikKritik"), { n: g.acikKritikAlarm }) : t("hs.ay.acikKritikYok"),
    ara(t("hs.ay.cozuldu"), { a: g.cozulenAlarm, b: g.toplamAlarm }),
    ara(t("hs.ay.cozulmeOran"), { n: Math.round(cozulmeOran * 100) }),
  ];
}

/**
 * Boyut ÖNERİSİNİ ham sinyallerden yeniden kur (lib branch mantığını yansıtır).
 */
function boyutOneri(anahtar: BoyutAnahtar, g: SaglikGirdi, t: Ceviri): string {
  if (anahtar === "kurulum") {
    const dogrulamaOran = g.siteSayisi > 0 ? g.dogrulanmisSite / g.siteSayisi : 0;
    const trafikOran = g.siteSayisi > 0 ? g.trafikliSite / g.siteSayisi : 0;
    if (g.siteSayisi === 0) return t("hs.on.kurulum.siteYok");
    if (dogrulamaOran < 1) return t("hs.on.kurulum.dogrulama");
    if (trafikOran < 1) return t("hs.on.kurulum.trafik");
    if (g.kuralSayisi === 0) return t("hs.on.kurulum.kural");
    return t("hs.on.kurulum.tamam");
  }
  if (anahtar === "kullanim") {
    const oran = g.kota > 0 ? g.aylikKullanim / g.kota : 0;
    if (g.aylikKullanim === 0) return t("hs.on.kullanim.sifir");
    if (oran > 0.9) return t("hs.on.kullanim.kota");
    if (oran < 0.1) return t("hs.on.kullanim.dusuk");
    if (g.sonAktiflikGun >= 7) return t("hs.on.kullanim.hareketsiz");
    return t("hs.on.kullanim.saglikli");
  }
  if (anahtar === "yapilandirma") {
    if (g.ozelKural < 3) return t("hs.on.yapi.kural");
    if (g.aiPolitikaSayisi < 3) return t("hs.on.yapi.ai");
    if (g.aktifEntegrasyon === 0) return t("hs.on.yapi.ent");
    return t("hs.on.yapi.derin");
  }
  if (anahtar === "yonetisim") {
    if (g.ekipUyeSayisi < 2) return t("hs.on.yon.ekip");
    if (g.aktifTokenSayisi === 0) return t("hs.on.yon.token");
    if (g.denetimKayitSayisi < 10) return t("hs.on.yon.denetim");
    return t("hs.on.yon.saglam");
  }
  // operasyon
  const cozulmeOran = g.toplamAlarm > 0 ? g.cozulenAlarm / g.toplamAlarm : 1;
  if (g.acikKritikAlarm > 0) return ara(t("hs.on.op.kritik"), { n: g.acikKritikAlarm });
  if (cozulmeOran < 0.6 && g.toplamAlarm > 0) return t("hs.on.op.cozulme");
  return t("hs.on.op.saglikli");
}

/**
 * Churn NEDEN + AKSİYON listelerini ham sinyallerden yeniden kur
 * (lib churnRiski branch mantığını birebir yansıtır).
 */
function churnMetinler(g: SaglikGirdi, skor: number, t: Ceviri): { nedenler: string[]; aksiyonlar: string[] } {
  const nedenler: string[] = [];
  const aksiyonlar: string[] = [];
  const kotaOran = g.kota > 0 ? g.aylikKullanim / g.kota : 0;

  if (skor < 40) {
    nedenler.push(t("hs.cn.benimsemeCokDusuk"));
    aksiyonlar.push(t("hs.ak.onboarding"));
  } else if (skor < 60) {
    nedenler.push(t("hs.cn.benimsemeSinirli"));
    aksiyonlar.push(t("hs.ak.eksikKurulum"));
  }

  if (kotaOran >= 0.9) {
    nedenler.push(t("hs.cn.kotaDayali"));
    aksiyonlar.push(t("hs.ak.planKota"));
  } else if (kotaOran > 0 && kotaOran < 0.03) {
    nedenler.push(t("hs.cn.kullanimSifir"));
    aksiyonlar.push(t("hs.ak.trafikYay"));
  }

  if (g.sonAktiflikGun >= 14) {
    nedenler.push(ara(t("hs.cn.uykuda"), { n: g.sonAktiflikGun }));
    aksiyonlar.push(t("hs.ak.entegreDogrula"));
  } else if (g.sonAktiflikGun >= 7) {
    nedenler.push(ara(t("hs.cn.dusukEtkinlik"), { n: g.sonAktiflikGun }));
    aksiyonlar.push(t("hs.ak.widgetKontrol"));
  }

  if (g.acikKritikAlarm > 0) {
    nedenler.push(ara(t("hs.cn.acikKritik"), { n: g.acikKritikAlarm }));
    aksiyonlar.push(t("hs.ak.kritikKapat"));
  }

  if (g.ekipUyeSayisi < 2) {
    nedenler.push(t("hs.cn.tekKisi"));
    aksiyonlar.push(t("hs.ak.ekipDavet"));
  }

  if (nedenler.length === 0) {
    nedenler.push(t("hs.cn.yok"));
    aksiyonlar.push(t("hs.ak.surdur"));
  }

  return { nedenler, aksiyonlar };
}

export function HesapSaglikIstemci({
  sonuc,
  trend,
  planAd,
  workspaceAd,
  girdi,
  dil,
}: {
  sonuc: SaglikSonuc;
  trend: { gun: string; deger: number }[];
  planAd: string;
  workspaceAd: string;
  girdi: SaglikGirdi;
  dil: Dil;
}) {
  const t = (anahtar: string) => hesapSaglikCeviri(anahtar, dil);
  const churn = CHURN_TON[sonuc.churn.seviye];
  const churnAd = t(`hs.churn.${sonuc.churn.seviye}`);
  const seviyeAd = t(`hs.seviye.${sonuc.seviye}`);
  const churnMetin = churnMetinler(girdi, sonuc.skor, t);

  const trendDeger = trend.map((t2) => t2.deger);
  const trendEtiket = trend.map((t2) => {
    const [, ay, gun] = t2.gun.split("-");
    return `${gun}.${ay}`;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi — dürüst çerçeveleme: KENDİ hesabının sağlığı */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <HeartPulse className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {ara(t("hs.serit.baslik"), { ws: workspaceAd })}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("hs.serit.aciklama") }} />
        </div>
      </div>

      {/* üst özet: skor halkası + seviye + churn */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Panel className="grid place-items-center">
          <div className="flex flex-col items-center gap-3 py-2">
            <KorumaSkoru skor={sonuc.skor} boyut={188} />
            <div className="flex items-center gap-2">
              <Badge ton={SEVIYE_TON[sonuc.seviye]}>{ara(t("hs.rozet.olgunluk"), { ad: seviyeAd })}</Badge>
              <Badge ton={churn.ton}>{churnAd}</Badge>
            </div>
            <p className="text-[12px] text-slate-faint">{ara(t("hs.plan"), { ad: planAd })}</p>
          </div>
        </Panel>

        {/* boyut mini-kartları */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {sonuc.boyutlar.map((b) => {
            const Ikon = BOYUT_IKON[b.anahtar];
            const renk = durumRenk(b.skor);
            return (
              <div key={b.anahtar} className="flex flex-col rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span
                    className="grid size-9 place-items-center rounded-xl"
                    style={{ background: `${renk}18`, color: renk }}
                  >
                    <Ikon className="size-4.5" />
                  </span>
                  <span className="num text-[20px] font-bold" style={{ color: renk }}>
                    {b.skor}
                  </span>
                </div>
                <div className="mt-2.5 text-[13px] font-semibold leading-tight text-slate-ink">{t(`hs.boyut.${b.anahtar}`)}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full transition-all" style={{ width: `${b.skor}%`, background: renk }} />
                </div>
                <div className="mt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                  {ara(t("hs.agirlik"), { n: Math.round(b.agirlik * 100) })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* churn risk paneli */}
      <Panel baslik={t("hs.churn.baslik")}>
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border p-5" style={{ borderColor: `${churn.renk}40`, background: `${churn.renk}0d` }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5" style={{ color: churn.renk }} />
              <span className="text-[15px] font-semibold" style={{ color: churn.renk }}>
                {churnAd}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              <span className="num text-[44px] font-bold leading-none" style={{ color: churn.renk }}>
                {sonuc.churn.puan}
              </span>
              <span className="mb-1 text-[13px] text-slate-muted">{t("hs.churn.riskPuani")}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full" style={{ width: `${sonuc.churn.puan}%`, background: churn.renk }} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                {t("hs.churn.yuksesltenler")}
              </div>
              <ul className="space-y-1.5">
                {churnMetin.nedenler.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-ink">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: churn.renk }} />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("hs.churn.neYapmali")}</div>
              <ul className="space-y-1.5">
                {churnMetin.aksiyonlar.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-muted">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Panel>

      {/* boyut kırılımı — bar + öneri + link */}
      <Panel baslik={t("hs.kirilim.baslik")}>
        <div className="space-y-3">
          {sonuc.boyutlar.map((b) => {
            const Ikon = BOYUT_IKON[b.anahtar];
            const renk = durumRenk(b.skor);
            const ayrinti = boyutAyrinti(b.anahtar, girdi, t);
            const oneri = boyutOneri(b.anahtar, girdi, t);
            return (
              <div key={b.anahtar} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${renk}18`, color: renk }}>
                    <Ikon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-ink">{t(`hs.boyut.${b.anahtar}`)}</span>
                      <Badge ton={DURUM_TON[b.durum]}>{t(`hs.durum.${b.durum}`)}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-faint">{ara(t("hs.katki"), { n: Math.round(b.agirlik * 100) })}</div>
                  </div>
                  <span className="num ml-auto text-[24px] font-bold" style={{ color: renk }}>
                    {b.skor}
                  </span>
                </div>

                {/* ilerleme çubuğu */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full transition-all" style={{ width: `${b.skor}%`, background: renk }} />
                </div>

                {/* ayrıntı ölçütleri */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {ayrinti.map((a, i) => (
                    <span key={i} className="text-[12px] text-slate-muted">
                      · {a}
                    </span>
                  ))}
                </div>

                {/* öneri + link */}
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-canvas/50 px-3.5 py-2.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                  <p className="flex-1 text-[12.5px] text-slate-ink">{oneri}</p>
                  {b.link && (
                    <Link
                      href={b.link}
                      className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-brand-700 hover:text-brand-800"
                    >
                      {t("hs.kirilim.git")} <ChevronRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* kullanım-sağlığı trendi + sonraki adımlar */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel baslik={t("hs.trend.baslik")}>
          <p className="mb-3 -mt-1 text-[13px] text-slate-muted">
            {t("hs.trend.aciklama")}
          </p>
          <TrendGrafik noktalar={trendDeger} etiketler={trendEtiket} renk="#2f6fed" yukseklik={220} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniOlcut
              ikon={<TrendingUp className="size-4" />}
              etiket={t("hs.trend.aylik")}
              deger={sonuc.sinyaller.aylikKullanim.toLocaleString(dil)}
            />
            <MiniOlcut
              ikon={<Activity className="size-4" />}
              etiket={t("hs.trend.aktifGun")}
              deger={String(sonuc.sinyaller.aktifGunSayisi)}
            />
            <MiniOlcut
              ikon={<ShieldCheck className="size-4" />}
              etiket={t("hs.trend.kota")}
              deger={`%${Math.round(sonuc.sinyaller.kotaOran * 100)}`}
            />
          </div>
        </Panel>

        <Panel baslik={t("hs.adimlar.baslik")}>
          {sonuc.sonrakiAdimlar.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-10 text-center">
              <CheckCircle2 className="mb-3 size-10 text-ok" />
              <p className="text-[14px] font-semibold text-slate-ink">{t("hs.adimlar.hepsiIyi")}</p>
              <p className="mt-1 max-w-xs text-[12.5px] text-slate-muted">
                {t("hs.adimlar.hepsiIyiAlt")}
              </p>
            </div>
          ) : (
            <ol className="space-y-2.5">
              {sonuc.sonrakiAdimlar.map((a, i) => {
                const renk = durumRenk(a.skor);
                return (
                  <li key={a.anahtar}>
                    <Link
                      href={a.link ?? "#"}
                      className="group flex items-start gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 transition hover:border-line-strong hover:bg-canvas"
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
                        style={{ background: renk }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-ink">{t(`hs.boyut.${a.anahtar}`)}</span>
                          <span className="num text-[11px] font-medium" style={{ color: renk }}>
                            {a.skor}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-muted">{boyutOneri(a.anahtar, girdi, t)}</p>
                      </div>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span dangerouslySetInnerHTML={{ __html: t("hs.not") }} />
      </div>
    </div>
  );
}

/* Küçük ölçüt rozeti (trend altı). */
function MiniOlcut({ ikon, etiket, deger }: { ikon: React.ReactNode; etiket: string; deger: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-slate-faint">{ikon}</div>
      <div className="num mt-1.5 text-[20px] font-bold text-slate-ink">{deger}</div>
      <div className="text-[11px] text-slate-muted">{etiket}</div>
    </div>
  );
}
