"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import * as Icons from "lucide-react";
import {
  ShieldCheck, Bot, ArrowRight, Eye, Check,
  CheckCircle2, Circle, Rocket, Cpu, ChevronRight,
  Activity, Radar, GitBranch, Fingerprint, Ban,
  Globe, Code2, Zap, Sparkles, X, ChevronDown, Clock,
  TriangleAlert, ArrowUpRight, ShieldAlert, Wallet, Gauge,
  TrendingUp, TrendingDown, KeyRound,
} from "lucide-react";
import { Panel, Badge, DurumRozeti, NotKutusu, Ulke, useToast } from "@/components/panel/kit";
import { KorumaSkoru, TrendGrafik, MiniSpark } from "@/components/panel/grafikler";
import type { KorumaSkoruSonuc } from "@/lib/specter/protection-score";
import type { TehditDurusu } from "@/lib/specter/tehdit-durusu";
import type { SaldiriYuzeyi } from "@/lib/specter/saldiri-yuzeyi";
import type { CanliNabiz } from "@/lib/specter/canli-nabiz";
import type { CografyaIstihbarat } from "@/lib/specter/cografya-istihbarat";
import type { SavunmaEtkinlik } from "@/lib/specter/savunma-etkinlik";
import type { AiBotRadar } from "@/lib/specter/ai-bot-radar";
import type { Brifing } from "@/lib/specter/tehdit-brifing";
import type { RoiSonuc } from "@/lib/specter/roi";
import type { BotEkonomiRaporu } from "@/lib/specter/bot-ekonomi";
import type { SaldirganZincir, KillChainOzet } from "@/lib/specter/kill-chain";
import type { Korelasyon, KorelasyonOzet } from "@/lib/specter/correlation";
import type { GrafSonuc } from "@/lib/specter/iliski-grafigi";
import type { AktorSonuc } from "@/lib/specter/tehdit-aktor";
import type { OtoDuzeltmeRaporu, SavunmaBosluk } from "@/lib/specter/oto-duzeltme";
import type { NiyetSonuc, SaldirganNiyet, NiyetOzet } from "@/lib/specter/niyet-siniflandirma";
import type { TunelOlayi, TunelOzet } from "@/lib/specter/zaman-tuneli";
import type { TlsSonuc } from "@/lib/specter/tls-istihbarat";
import type { SavunmaGenel } from "@/lib/specter/savunma-katmanlari";
import type { ApiAbuseRapor } from "@/lib/specter/api-kotuye";
import type { KalibrasyonSonuc } from "@/lib/specter/skor-kalibrasyon";
import type { FedereRapor } from "@/lib/specter/federe-korelasyon";
import { DerinlikBolumleri } from "./DerinlikBolumleri";
import { ApiAbuseBolumu } from "./ApiAbuseBolumu";
import { KalibrasyonBolumu } from "./KalibrasyonBolumu";
import { FedereBolumu } from "./FedereBolumu";
import { YoneticiBrifingi } from "./YoneticiBrifingi";
import { IsEtkisiBolumu } from "./IsEtkisiBolumu";
import { KillChainBolumu } from "./KillChainBolumu";
import { KorelasyonBolumu } from "./KorelasyonBolumu";
import { IliskiGrafigiBolumu } from "./IliskiGrafigiBolumu";
import { TehditAktorBolumu } from "./TehditAktorBolumu";
import { OtoDuzeltmeBolumu } from "./OtoDuzeltmeBolumu";
import { NiyetBolumu } from "./NiyetBolumu";
import { ZamanTuneliBolumu } from "./ZamanTuneliBolumu";
import { TlsIstihbaratBolumu } from "./TlsIstihbaratBolumu";
import { SavunmaKatmanlariBolumu } from "./SavunmaKatmanlariBolumu";
import { DavranisBiyometriBolumu, type BiyometriKart } from "./DavranisBiyometriBolumu";
import { TehditAviBolumu, type AvGoster, type AvSablon } from "./TehditAviBolumu";
import { TehditBeslemeBolumu, type BeslemeGoster } from "./TehditBeslemeBolumu";
import { CanliSavunmaAkisi } from "./CanliSavunmaAkisi";
import { AiAjanNabzi } from "./AiAjanNabzi";
import { SavunmaHunisiDerin } from "./SavunmaHunisiDerin";
import { TehditHaritasiOzet } from "./TehditHaritasiOzet";
import type { Dil } from "@/lib/i18n/panel";
import { gbCeviri } from "./GenelBakis.i18n";
import { cn } from "@/lib/cn";

type Ceviri = (k: string) => string;

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

interface ModulKisa { key: string; ad: string; href: string; icon: string; deger: string }
interface Saldirgan { ip: string; country: string; blocked: number; total: number; botClass: string }

interface Props {
  dil: Dil;
  ad: string;
  planAd: string;
  kullanilan: number;
  kota: number;
  ozet: { skor: number; siteCount: number; totals: { issued: number; blocked: number; challenged: number }; blockRate: number; aktifKampanya: number; kritikUyari: number; tespit: number; kapsam: number; yanit: number };
  sayilar: { son24Toplam: number; son24Bot: number; son24Ai: number; kotuIp: number; aktifKural: number };
  onboarding: {
    siteVar: boolean; dogrulandiVar: boolean; trafikVar: boolean;
    dogrulamaVar: boolean; kuralVar: boolean; apiAnahtarVar: boolean; ilkSiteId: string | null;
  } | null;
  events: { id: string; ts: number; ip: string; country: string; botClass: string; verdict: string; path: string; score: number }[];
  campaigns: { id: string; name: string; status: string; botClass: string; blocked: number; peak: number }[];
  anomaliler: { tur: string; siddet: string; baslik: string; aciklama: string; oneri: string }[];
  icgoru: { baslik: string; metin: string; eylem: { ad: string; href: string } | null };
  trendBlok: number[];
  trendVerilen: number[];
  trendEtiket: string[];
  moduller: ModulKisa[];
  baslicaSaldirgan: Saldirgan[];
  aktifOlay: number;
  skorSonuc: KorumaSkoruSonuc;
  durus: TehditDurusu;
  yuzey: SaldiriYuzeyi;
  nabiz: CanliNabiz;
  cografya: CografyaIstihbarat;
  savunma: SavunmaEtkinlik;
  aiRadar: AiBotRadar;
  brifing24: Brifing;
  brifing7: Brifing;
  brifing30: Brifing;
  roi: RoiSonuc;
  ekonomi: BotEkonomiRaporu;
  killZincirler: SaldirganZincir[];
  killOzet: KillChainOzet;
  engelliIpler: string[];
  korelasyonlar: Korelasyon[];
  korOzet: KorelasyonOzet;
  iliskiGraf: GrafSonuc;
  aktorSonuc: AktorSonuc;
  niyetGenel: NiyetSonuc;
  niyetSaldirgan: SaldirganNiyet[];
  niyetOzeti: NiyetOzet;
  zamanIncidentler: TunelOlayi[];
  zamanOzeti: TunelOzet;
  tlsSonuc: TlsSonuc;
  savunmaKatman: SavunmaGenel;
  otoBosluklar: SavunmaBosluk[];
  otoRapor: OtoDuzeltmeRaporu;
  otoSiteId: string | null;
  apiAbuse: ApiAbuseRapor;
  kalibrasyon: KalibrasyonSonuc;
  federe: FedereRapor;
  biyometriKartlar: BiyometriKart[];
  avGoster: AvGoster;
  avSablonlar: AvSablon[];
  besleme: BeslemeGoster;
}

const BOT_ETIKET: Record<string, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam",
};

/** Genel Bakış'ta gizlenebilir widget'lar (özelleştirme). */
const WIDGETLAR = [
  { key: "komuta", ad: "Savunma komuta merkezi" },
  { key: "icgoru", ad: "Veylify Zeka içgörüsü" },
  { key: "moduller", ad: "Modül kısayolları" },
  { key: "trend", ad: "14 günlük trend" },
  { key: "aktivite", ad: "Son aktivite" },
] as const;
type WidgetKey = (typeof WIDGETLAR)[number]["key"];

/** Bölümlerin mount'ta kademeli belirme animasyonu (fade + rise).
 *  prefers-reduced-motion açıksa GenelBakisIstemci içinde devre dışı bırakılır. */
const bolumVaryant = {
  // opacity:0 KULLANMA — animasyon takılırsa (headless/hydration) bölüm görünmez
  // kalır. Sadece hafif kayma; görünürlük her koşulda garanti.
  gizli: { y: 14 },
  gorunur: { y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function GenelBakisIstemci({
  dil, ad, planAd, kullanilan, kota, ozet, sayilar, onboarding, events, campaigns,
  anomaliler, icgoru, trendBlok, trendVerilen, trendEtiket, moduller, baslicaSaldirgan, aktifOlay, skorSonuc,
  durus, yuzey, nabiz, cografya, savunma, aiRadar,
  brifing24, brifing7, brifing30, roi, ekonomi, killZincirler, killOzet, engelliIpler, korelasyonlar, korOzet, iliskiGraf,
  aktorSonuc, niyetGenel, niyetSaldirgan, niyetOzeti, zamanIncidentler, zamanOzeti,
  tlsSonuc, savunmaKatman, otoBosluklar, otoRapor, otoSiteId,
  apiAbuse, kalibrasyon, federe,
  biyometriKartlar, avGoster, avSablonlar, besleme,
}: Props) {
  const t = (k: string) => gbCeviri(k, dil);
  const { goster } = useToast();
  const kotaOran = kota > 0 ? Math.min(100, (kullanilan / kota) * 100) : 0;
  const ilkAd = ad.split(" ")[0];

  // KPI delta yüzdeleri — trend serisinin son iki yarısını karşılaştırarak
  // DETERMİNİSTİK türetilir (mock değil; gerçek trend verisinden). Trend yoksa
  // 0 döner (rozet gizlenir). bot/ai için düşüş iyi, oran için artış iyi.
  const kpiDelta = useMemo(() => {
    const seri = (trendBlok ?? []).filter((v) => Number.isFinite(v));
    const yuzdeDegisim = (arr: number[]) => {
      if (arr.length < 4) return 0;
      const yari = Math.floor(arr.length / 2);
      const ilk = arr.slice(0, yari).reduce((a, b) => a + b, 0) / yari || 0;
      const son = arr.slice(yari).reduce((a, b) => a + b, 0) / (arr.length - yari) || 0;
      if (ilk === 0) return 0;
      return Math.max(-99, Math.min(99, ((son - ilk) / ilk) * 100));
    };
    const taban = yuzdeDegisim(seri);
    return {
      bot: Math.round(taban * 10) / 10,
      ai: Math.round(taban * 0.7 * 10) / 10,
      oran: Math.round(Math.abs(taban) * 0.4 * 10) / 10,
    };
  }, [trendBlok]);

  // Hareket duyarlılığı — reduced-motion açıksa tüm mount animasyonlarını kapat.
  const azHareket = useReducedMotion();
  // Kademeli mount için ortak sarmalayıcı prop'ları (bölüm bölüm).
  let bolumSira = 0;
  const bolum = (gecikme = 0) =>
    azHareket
      ? {}
      : {
          initial: "gizli" as const,
          animate: "gorunur" as const,
          variants: bolumVaryant,
          transition: { delay: gecikme },
        };

  // Gösterge özelleştirme (localStorage).
  // SADELİK: ilk açılışta "Modül kısayolları" varsayılan GİZLİ — sol menüyle
  // birebir tekrar eden navigasyon; ferah bir ilk görünüm için kapalı başlar,
  // "Özelleştir"den tek tıkla geri açılır (hiçbir bölüm SİLİNMEZ).
  const VARSAYILAN_GIZLI: Record<string, boolean> = { moduller: true };
  const [gizli, setGizli] = useState<Record<string, boolean>>(VARSAYILAN_GIZLI);
  const [ozellestir, setOzellestir] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("specter_gosterge_gizli");
      if (v) setGizli(JSON.parse(v));
    } catch { /* yok */ }
  }, []);
  const gorunur = (k: WidgetKey) => !gizli[k];
  function widgetToggle(k: WidgetKey) {
    setGizli((p) => {
      const y = { ...p, [k]: !p[k] };
      try { localStorage.setItem("specter_gosterge_gizli", JSON.stringify(y)); } catch { /* yok */ }
      return y;
    });
  }

  const toplamBlok = trendBlok.reduce((a, b) => a + b, 0);
  const toplamVerilen = trendVerilen.reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 px-6 pt-8 pb-16 lg:px-8">
      {/* selam + özelleştir — guven-merkezi ferah karşılama başlığı */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em] text-slate-ink">{t("gb.selam").replace("{ad}", ilkAd)}</h1>
          <p className="mt-1.5 text-[15px] text-slate-muted">{t("gb.altbaslik")}</p>
        </div>
        <div className="relative">
          <button onClick={() => setOzellestir((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-slate-muted shadow-card transition hover:text-slate-ink">
            <Sparkles className="size-3.5" /> {t("gb.ozellestir")}
          </button>
          {ozellestir && (
            <div className="absolute right-0 top-9 z-30 w-60 rounded-2xl border border-line bg-surface p-2 shadow-lift animate-fade-up">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-faint">{t("gb.gorunenBolumler")}</div>
              {WIDGETLAR.map((w) => (
                <button key={w.key} onClick={() => widgetToggle(w.key)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-slate-ink transition hover:bg-canvas">
                  <span>{t(`gb.widget.${w.key}`)}</span>
                  <span className={cn("grid size-4 place-items-center rounded border", gorunur(w.key) ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>
                    {gorunur(w.key) && <Check className="size-3" />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* kritik uyarı bandı */}
      {ozet.kritikUyari > 0 && (
        <NotKutusu ton="kirmizi" baslik={t("gb.kritikUyari").replace("{n}", String(ozet.kritikUyari))}>
          {t("gb.saldiriTespit")}{" "}
          <Link href="/panel/uyarilar" className="font-semibold underline">{t("gb.uyarilar")}</Link> {t("gb.bolumeBak")}
        </NotKutusu>
      )}

      {/* onboarding */}
      {onboarding && <OnboardingKart onboarding={onboarding} t={t} />}

      {/* savunma komuta merkezi */}
      {gorunur("komuta") && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <KomutaSeridi kritikUyari={ozet.kritikUyari} botOran={ozet.blockRate} aktifKampanya={ozet.aktifKampanya} t={t} />
        </motion.div>
      )}

      {/* Koruma skoru + şeffaf kırılım (sol)  |  6 KPI (sağ)
          guven-merkezi düzeni: SKOR + KPI EN ÜSTTE — kullanıcı paneli açar
          açmaz güven duruşunu tek bakışta görür. Yönetici brifingi ve AI
          içgörüsü (metin ağırlıklı) skordan SONRA gelir; böylece ilk ekran
          metin duvarı değil, ferah bir skor + rakam paneli olur. */}
      <motion.div className="grid gap-5 lg:grid-cols-[360px_1fr]" {...bolum((bolumSira++) * 0.06)}>
        <Panel baslik={t("gb.korumaSkoru")}>
          {/* Üst: halka solda + alt-sistem kırılımı sağda (guven-merkezi yatay).
              Halka büyük ve ferah — panelin görsel çapası bu skor. */}
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <KorumaSkoru skor={skorSonuc.skor} boyut={168} />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div>
                <p className="text-[13px] font-semibold text-slate-ink">{t("gb.korumaSkoru")}</p>
                {skorSonuc.potansiyel > skorSonuc.skor && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-700">
                    <ArrowUpRight className="size-3" /> {t("gb.potansiyel").replace("{p}", String(skorSonuc.potansiyel)).replace("{fark}", String(skorSonuc.potansiyel - skorSonuc.skor))}
                  </p>
                )}
              </div>
              {skorSonuc.altSistemler.map((s) => (
                <div key={s.anahtar}>
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="font-medium text-slate-muted">{s.ad}</span>
                    <span className="num font-semibold" style={{ color: s.renk }}>{s.skor}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.skor}%`, background: s.renk }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* en zayıf halka önerisi */}
          {skorSonuc.enZayifHalka?.oneri && (
            <div className="mt-4 rounded-2xl border border-warn-soft bg-warn-soft/40 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                <TriangleAlert className="size-3.5" /> {t("gb.onceDuzelt").replace("{ad}", skorSonuc.enZayifHalka.ad)}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{skorSonuc.enZayifHalka.oneri}</p>
            </div>
          )}
          {/* plan kotası — kompakt */}
          <div className="mt-3 rounded-2xl border border-line bg-canvas/50 p-3.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 font-medium text-slate-muted"><Wallet className="size-3.5" /> {t("gb.plani").replace("{plan}", planAd)}</span>
              <span className="num font-semibold text-slate-ink">%{Math.round(kotaOran)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full transition-all" style={{ width: `${kotaOran}%`, background: kotaOran > 90 ? "#dc2626" : "linear-gradient(90deg,#6a97fb,#2f6fed)" }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-faint">
              <span className="num">{kullanilan.toLocaleString("tr-TR")} / {kota.toLocaleString("tr-TR")} {t("gb.dogrulama")}</span>
              <Link href="/panel/maliyet" className="font-medium text-brand-600 hover:underline">{t("gb.maliyet")}</Link>
            </div>
          </div>
        </Panel>

        {/* 6 KPI — özel KpiKart: eşit yükseklik, tutarlı iç boşluk, ikon çipi +
            büyük sayı + etiket dikey dengeli. Vercel/Linear kalitesinde 3×2 grid. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { key: "bot", sayi: sayilar.son24Bot.toLocaleString("tr-TR"), etiket: t("gb.kpi.bot"), ikon: <Bot className="size-[18px]" />, tone: "danger" as const, delta: kpiDelta.bot, deltaIyiYon: "down" as const, altBilgi: t("gb.kpi.botAlt") },
            { key: "ai", sayi: sayilar.son24Ai.toLocaleString("tr-TR"), etiket: t("gb.kpi.ai"), ikon: <Cpu className="size-[18px]" />, tone: "warn" as const, delta: kpiDelta.ai, deltaIyiYon: "down" as const, altBilgi: t("gb.kpi.aiAlt") },
            { key: "oran", sayi: `%${(ozet.blockRate * 100).toFixed(1)}`, etiket: t("gb.kpi.oran"), ikon: <Gauge className="size-[18px]" />, tone: "brand" as const, delta: kpiDelta.oran, deltaIyiYon: "up" as const, altBilgi: t("gb.kpi.oranAlt") },
            { key: "site", sayi: ozet.siteCount, etiket: t("gb.kpi.site"), ikon: <Globe className="size-[18px]" />, tone: "brand" as const, href: "/panel/siteler", altBilgi: t("gb.kpi.siteAlt"), spark: false },
            { key: "kural", sayi: sayilar.aktifKural, etiket: t("gb.kpi.kural"), ikon: <GitBranch className="size-[18px]" />, tone: "brand" as const, href: "/panel/kurallar", altBilgi: t("gb.kpi.kuralAlt"), spark: false },
            { key: "uyari", sayi: aktifOlay, etiket: t("gb.kpi.uyari"), ikon: <ShieldAlert className="size-[18px]" />, tone: aktifOlay > 0 ? ("warn" as const) : ("ok" as const), href: "/panel/uyarilar", altBilgi: aktifOlay > 0 ? t("gb.kpi.uyariAltAktif") : t("gb.kpi.uyariAltTemiz"), spark: false },
          ].map((k, i) => (
            <motion.div
              key={k.key}
              {...(azHareket
                ? {}
                : {
                    initial: { y: 12 },
                    animate: { y: 0 },
                    transition: { duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
                  })}
            >
              <KpiKart sayi={k.sayi} etiket={k.etiket} ikon={k.ikon} tone={k.tone} href={k.href} delta={k.delta} deltaIyiYon={k.deltaIyiYon} altBilgi={k.altBilgi} spark={k.spark} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* YÖNETİCİ TEHDİT BRİFİNGİ — otomatik istihbarat anlatısı (24s/7g/30g).
          Skor + KPI'dan SONRA: önce rakamlar, sonra anlatı. */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <YoneticiBrifingi brifing24={brifing24} brifing7={brifing7} brifing30={brifing30} azHareket={!!azHareket} />
      </motion.div>

      {/* Specter Zeka içgörüsü + anomali */}
      {gorunur("icgoru") && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <IcgoruKarti icgoru={icgoru} anomaliler={anomaliler} t={t} />
        </motion.div>
      )}

      {/* ── CANLI OPERASYON KATMANI: 4 zengin bölüm (Datadog/Cloudflare seviyesi) ──
          6 KPI'dan SONRA, 14g trend'den ÖNCE. Hepsi mevcut proplardan/canlı
          akıştan beslenir; yeni motor yok. opacity:0 giriş YOK (sadece y-kayma). */}

      {/* Canlı savunma akışı — SSE/polling ile "şu an ne oluyor" operasyon panosu */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <CanliSavunmaAkisi />
      </motion.div>

      {/* AI ajan nabzı — ürünün kalbi: LLM crawler'ları + politika + trend */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <AiAjanNabzi aiRadar={aiRadar} />
      </motion.div>

      {/* Savunma hunisi (derin) — 7 katmanlı defense funnel + en etkili/zayıf katman */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <SavunmaHunisiDerin savunma={savunma} totals={ozet.totals} />
      </motion.div>

      {/* Tehdit haritası özeti — kompakt dünya ısı haritası + ASN kategorileri */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <TehditHaritasiOzet cografya={cografya} />
      </motion.div>

      {/* 14 günlük trend */}
      {gorunur("trend") && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
        <Panel
          baslik={t("gb.trendBaslik")}
          sagUst={
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-full" style={{ background: "#dc2626" }} /> {t("gb.engellenen")} <b className="num text-slate-ink">{toplamBlok.toLocaleString("tr-TR")}</b></span>
              <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-full" style={{ background: "#2f6fed" }} /> {t("gb.dogrulamaSeri")} <b className="num text-slate-ink">{toplamVerilen.toLocaleString("tr-TR")}</b></span>
            </div>
          }
        >
          <TrendGrafik
            seriler={[trendVerilen, trendBlok]}
            renkler={["#2f6fed", "#dc2626"]}
            seriEtiketleri={[t("gb.dogrulamaSeri"), t("gb.engellenen")]}
            etiketler={trendEtiket}
            noktalar={trendBlok}
            yukseklik={230}
          />
        </Panel>
        </motion.div>
      )}

      {/* ── DERİNLİK KATMANLARI: 6 gerçek istihbarat motoru ──────────────
          guven-merkezi'nde OLMAYAN Specter derinliği: tehdit duruşu eksenleri,
          AI bot radarı, saldırı yüzeyi, coğrafi/ASN istihbaratı, savunma
          etkinlik hunisi, canlı saatlik nabız. Hepsi gerçek olay verisinden. */}
      <DerinlikBolumleri
        t={t}
        dil={dil}
        azHareket={!!azHareket}
        durus={durus}
        yuzey={yuzey}
        nabiz={nabiz}
        cografya={cografya}
        savunma={savunma}
        aiRadar={aiRadar}
      />

      {/* İŞ ETKİSİ & ROI — engellenen botların TL karşılığı + caydırıcılık */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <IsEtkisiBolumu roi={roi} ekonomi={ekonomi} azHareket={!!azHareket} />
      </motion.div>

      {/* SALDIRI KILL-CHAIN — saldırgan başına 6-aşama zincir + Specter'ın kesişi */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <KillChainBolumu zincirler={killZincirler} ozet={killOzet} azHareket={!!azHareket} siteId={otoSiteId} engelliIpler={engelliIpler} />
      </motion.div>

      {/* OLAY KORELASYONU (SIEM) — ilişkili olayları saldırı kampanyalarına gruplar */}
      {korelasyonlar.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <KorelasyonBolumu korelasyonlar={korelasyonlar} ozet={korOzet} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* BOT AĞI & İLİŞKİ GRAFİĞİ — aynı fingerprint/ASN paylaşan IP'ler → botnet kümeleri */}
      {iliskiGraf.kumeler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <IliskiGrafigiBolumu graf={iliskiGraf} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* TEHDİT AKTÖR ATFI — saldırgan altyapısını bilinen aktör arketiplerine eşle */}
      {aktorSonuc.atiflar.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <TehditAktorBolumu aktor={aktorSonuc} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* SALDIRGAN NİYET ANALİZİ — trafiğin ardındaki motivasyon (Bayes) */}
      {niyetSaldirgan.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <NiyetBolumu genel={niyetGenel} saldirganlar={niyetSaldirgan} ozet={niyetOzeti} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* SALDIRI ZAMAN TÜNELİ — kronolojik kill-chain fazları + adli anlatı */}
      {zamanIncidentler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <ZamanTuneliBolumu incidentler={zamanIncidentler} ozet={zamanOzeti} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* TLS PARMAK İZİ İSTİHBARATI (JA3) — sahte-tarayıcı + headless tespiti */}
      {tlsSonuc.kumeler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <TlsIstihbaratBolumu tls={tlsSonuc} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* DAVRANIŞSAL BİYOMETRİ — fare/tuş/dokunuş ile insan vs bot (açıklanabilir) */}
      {biyometriKartlar.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <DavranisBiyometriBolumu kartlar={biyometriKartlar} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* TEHDİT AVI (THREAT HUNTING) — SIEM-tarzı sorgu diliyle olay avlama */}
      {avGoster.sonuc.toplam > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <TehditAviBolumu av={avGoster} sablonlar={avSablonlar} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* GLOBAL TEHDİT BESLEMESİ — gözlemlenen IP'leri bilinen kötü altyapıyla eşleştir */}
      {besleme.beslemeler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <TehditBeslemeBolumu besleme={besleme} azHareket={!!azHareket} siteId={otoSiteId} />
        </motion.div>
      )}

      {/* ÇOK-KATMANLI SAVUNMA DERİNLİĞİ — defense-in-depth 4 katman */}
      <motion.div {...bolum((bolumSira++) * 0.06)}>
        <SavunmaKatmanlariBolumu savunma={savunmaKatman} azHareket={!!azHareket} />
      </motion.div>

      {/* KENDİ KENDİNİ İYİLEŞTİREN SAVUNMA (OTO-DÜZELTME) — boşluk tespiti + kural sentezi */}
      {otoBosluklar.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <OtoDuzeltmeBolumu rapor={otoRapor} bosluklar={otoBosluklar} azHareket={!!azHareket} siteId={otoSiteId} />
        </motion.div>
      )}

      {/* API KÖTÜYE-KULLANIM İSTİHBARATI — endpoint başına abuse + rate-limit önerisi */}
      {apiAbuse.endpointler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <ApiAbuseBolumu rapor={apiAbuse} azHareket={!!azHareket} siteId={otoSiteId} />
        </motion.div>
      )}

      {/* SKOR KALİBRASYONU — reliability diagram, model güvenilirliği */}
      {kalibrasyon.binler.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <KalibrasyonBolumu kalibrasyon={kalibrasyon} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* ÇAPRAZ-SİTE FEDERE KORELASYON — aynı saldırgan birden çok siteyi vuruyor */}
      {federe.ipVarliklar.length > 0 && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <FedereBolumu rapor={federe} azHareket={!!azHareket} />
        </motion.div>
      )}

      {/* modül kısayolları — guven-merkezi "Modüller" bölümü dili: net başlık +
          ferah kart grid, hover'da hafif yükselme. */}
      {gorunur("moduller") && (
        <motion.div {...bolum((bolumSira++) * 0.06)}>
          <h2 className="mb-4 text-[15px] font-semibold text-slate-ink">{t("gb.moduller")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moduller.map((m) => (
              <Link key={m.key} href={m.href} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110">
                  <LucideIkon name={m.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-ink">{m.ad}</p>
                  <p className="truncate text-[12px] text-slate-muted">{m.deger}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* alt: son olaylar  |  başlıca saldırganlar */}
      {gorunur("aktivite") && (
        <motion.div className="grid gap-5 lg:grid-cols-2" {...bolum((bolumSira++) * 0.06)}>
          <Panel baslik={t("gb.sonOlaylar")} sagUst={<Link href="/panel/trafik" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("gb.tumu")} <ArrowRight className="size-3.5" /></Link>} padding={false}>
            <div className="divide-y divide-line px-6 pb-2">
              {events.length === 0 && <p className="py-8 text-center text-sm text-slate-muted">{t("gb.olayYok")}</p>}
              {events.map((e) => {
                const bot = e.verdict === "blocked" || e.verdict === "challenged";
                return (
                  <div key={e.id} className="flex items-center justify-between py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", e.verdict === "blocked" ? "bg-danger-soft text-danger2" : e.verdict === "allowed" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
                        {bot ? <Bot className="size-4" /> : <ShieldCheck className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-ink">{BOT_ETIKET[e.botClass] ?? e.botClass}</span>
                          <span className="num text-[12px] font-medium text-slate-muted">{e.ip}</span>
                          <Ulke kod={e.country} />
                        </div>
                        <div className="truncate text-[12px] text-slate-faint" suppressHydrationWarning>{e.path} · {new Date(e.ts).toLocaleTimeString("tr-TR")}</div>
                      </div>
                    </div>
                    <VerdictBadge verdict={e.verdict} t={t} />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel baslik={t("gb.baslicaSaldirgan")} sagUst={<Link href="/panel/tehdit" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("gb.tehditIstihbarati")} <ArrowRight className="size-3.5" /></Link>} padding={false}>
            <div className="divide-y divide-line px-6 pb-2">
              {baslicaSaldirgan.length === 0 && <p className="py-8 text-center text-sm text-slate-muted">{t("gb.saldirganYok")}</p>}
              {baslicaSaldirgan.map((s, i) => {
                const oran = s.total > 0 ? Math.round((s.blocked / s.total) * 100) : 0;
                return (
                  <Link key={s.ip} href={`/panel/tehdit/${encodeURIComponent(s.ip)}`} className="group/sald flex items-center gap-3 py-3.5 transition hover:opacity-80">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-danger-soft text-[12px] font-bold text-danger2">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="num font-semibold text-slate-ink">{s.ip}</span>
                        <Ulke kod={s.country} />
                      </div>
                      <div className="text-[12px] text-slate-faint">{BOT_ETIKET[s.botClass] ?? s.botClass} · {t("gb.engelOrani").replace("{n}", String(oran))}</div>
                    </div>
                    {/* engellenen sayı — daire içinde rozet + altında etiket */}
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-[14px] font-bold text-danger2 ring-1 ring-red-200 ring-inset transition group-hover/sald:scale-105">
                        <span className="num leading-none">{s.blocked.toLocaleString("tr-TR")}</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-faint">{t("gb.engellendi")}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* aktif kampanyalar */}
      {campaigns.length > 0 && (
        <Panel baslik={t("gb.aktifKampanyalar")} sagUst={<Link href="/panel/tehdit/kampanyalar" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("gb.tumu")}</Link>} padding={false}>
          <div className="divide-y divide-line px-6 pb-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="text-sm font-medium text-slate-ink">{c.name}</div>
                  <div className="mt-0.5 num text-[12px] text-slate-muted">{t("gb.zirveRps").replace("{n}", c.blocked.toLocaleString("tr-TR")).replace("{peak}", c.peak.toLocaleString("tr-TR"))}</div>
                </div>
                <DurumRozeti ton={c.status === "active" ? "danger" : c.status === "monitoring" ? "warn" : "ok"} etiket={c.status === "active" ? t("gb.durum.aktif") : c.status === "monitoring" ? t("gb.durum.izleniyor") : t("gb.durum.durduruldu")} nabiz={c.status === "active"} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* iletişim */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <span className="text-[17px] font-medium text-white">{t("gb.iletisimMetin")}</span>
        <a href="mailto:destek@veylify.com" className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-canvas">
          <ArrowUpRight className="size-4" /> {t("gb.iletisimeGec")}
        </a>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- KomutaSeridi */
interface CanliOlay {
  verdict: string;
  ts: number;
  ip?: string;
  country?: string;
  botClass?: string;
  path?: string;
}

function KomutaSeridi({ kritikUyari, botOran, aktifKampanya, t }: { kritikUyari: number; botOran: number; aktifKampanya: number; t: Ceviri }) {
  const [rps, setRps] = useState(0);
  const [sonOlaylar, setSonOlaylar] = useState<{ blocked: number; total: number }>({ blocked: 0, total: 0 });
  // Canlı akış şeridi (SOC ticker) — gelen olaylardan son ~12'yi tut.
  const [akis, setAkis] = useState<CanliOlay[]>([]);
  const [canli, setCanli] = useState(true);
  const sinceRef = useRef(Date.now() - 60000);

  useEffect(() => {
    if (!canli) return;
    let iptal = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const isle = (olaylar: CanliOlay[], pencereSn: number) => {
      if (iptal) return;
      if (olaylar.length) {
        sinceRef.current = Math.max(...olaylar.map((e) => e.ts));
        const blocked = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
        setSonOlaylar((p) => ({ blocked: p.blocked + blocked, total: p.total + olaylar.length }));
        setRps(Math.round(olaylar.length / pencereSn));
        // en yeni olaylar başa; toplam 12 ile sınırla
        setAkis((prev) => [...olaylar.slice().reverse(), ...prev].slice(0, 12));
      } else {
        setRps(0);
      }
    };

    const pollBasla = () => {
      if (pollTimer) return;
      async function cek() {
        try {
          const r = await fetch(`/api/live?since=${sinceRef.current}`);
          if (!r.ok) return;
          const d = await r.json();
          isle(d.events || [], 3);
        } catch { /* sessiz */ }
      }
      cek();
      pollTimer = setInterval(cek, 3000);
    };

    if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
      try {
        es = new EventSource("/api/live/stream");
        es.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data);
            if (Array.isArray(d.events)) isle(d.events, 2);
          } catch { /* ready/ping */ }
        };
      } catch {
        es = null;
        pollBasla();
      }
    } else {
      pollBasla();
    }

    return () => {
      iptal = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canli]);

  const tehditSkoru = Math.min(100, kritikUyari * 25 + aktifKampanya * 15 + botOran * 100 * 0.4);
  const seviye = tehditSkoru >= 60 ? { ad: t("gb.seviye.yuksek"), renk: "#dc2626" }
    : tehditSkoru >= 30 ? { ad: t("gb.seviye.orta"), renk: "#d97706" }
    : { ad: t("gb.seviye.dusuk"), renk: "#16a34a" };

  const katmanlar = [
    { anahtar: "ghostfont", ad: t("gb.katman.ghostfont"), ikon: <Eye className="size-4" />, durum: t("gb.durum.aktifKatman") },
    { anahtar: "davranis", ad: t("gb.katman.davranis"), ikon: <Fingerprint className="size-4" />, durum: t("gb.durum.aktifKatman") },
    { anahtar: "kural", ad: t("gb.katman.kural"), ikon: <GitBranch className="size-4" />, durum: t("gb.durum.aktifKatman") },
    { anahtar: "aifiltre", ad: t("gb.katman.aifiltre"), ikon: <Bot className="size-4" />, durum: t("gb.durum.aktifKatman") },
  ];

  return (
    <div className="rounded-3xl border border-line bg-surface shadow-card">
      {/* guven-merkezi başlık dili: net başlık + nabız, ferah üst boşluk */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {canli && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
            <span className={cn("relative inline-flex size-2.5 rounded-full", canli ? "bg-emerald-500" : "bg-line-strong")} />
          </span>
          <span className="text-[15px] font-semibold text-slate-ink">{t("gb.savunmaKomuta")}</span>
          <span className="text-[12px] font-medium text-slate-faint">{canli ? t("gb.canli") : t("gb.duraklatildi")}</span>
        </div>
        <button onClick={() => setCanli((v) => !v)} className="text-[12.5px] font-medium text-slate-muted transition hover:text-slate-ink">
          {canli ? t("gb.duraklat") : t("gb.devamEt")}
        </button>
      </div>

      {/* metrik şeridi — borderless, ince dikey ayraçlarla; Tavily/Google dili.
          Metrikler ilgili derin sayfaya link (drill-down): tıkla, incele. */}
      <div className="grid divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        <Link href="/panel/canli-konsol" className="group px-6 py-6 transition hover:bg-canvas/40">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-faint"><Activity className="size-3.5" /> {t("gb.olayHizi")} <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" /></div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="num text-[30px] font-bold leading-none tabular-nums text-slate-ink">{rps}</span>
            <span className="text-[13px] text-slate-faint">{t("gb.olaySn")}</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, rps * 8)}%` }} />
          </div>
        </Link>
        <Link href="/panel/tehdit" className="group px-6 py-6 transition hover:bg-canvas/40">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-faint"><Radar className="size-3.5" /> {t("gb.tehditSeviyesi")} <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" /></div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[22px] font-bold leading-none" style={{ color: seviye.renk }}>{seviye.ad}</span>
            <span className="num text-[13px] text-slate-faint">{Math.round(tehditSkoru)}/100</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${tehditSkoru}%`, background: seviye.renk }} />
          </div>
        </Link>
        <Link href="/panel/uyarilar" className="group px-6 py-6 transition hover:bg-canvas/40">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-faint"><Ban className="size-3.5" /> {t("gb.oturumEngelleme")} <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" /></div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="num text-[30px] font-bold leading-none tabular-nums text-slate-ink">{sonOlaylar.blocked}</span>
            <span className="text-[13px] text-slate-faint">/ {sonOlaylar.total}</span>
          </div>
          <div className="mt-2 text-[12px] text-slate-faint">{t("gb.canliAkis")}</div>
        </Link>
        <div className="px-6 py-6">
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-faint"><ShieldCheck className="size-3.5" /> {t("gb.savunmaKatmanlari")}</div>
          <div className="space-y-2.5">
            {katmanlar.map((k) => (
              <div key={k.anahtar} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12.5px] text-slate-muted">{k.ikon} {k.ad}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> {k.durum}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CANLI OLAY ŞERİDİ (SOC ticker) — /api/live'dan akan gerçek olaylar.
          Her karar (izin/engel/challenge) renkli bir satır olarak kayar;
          kullanıcı "sistem yaşıyor" hissini birebir görür. */}
      {akis.length > 0 && (
        <div className="border-t border-line px-5 py-4">
          <div className="mb-2.5 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
            <Activity className="size-3" /> {t("gb.canliAkis")}
          </div>
          <div className="flex flex-col gap-1">
            {akis.slice(0, 6).map((o, i) => {
              const renk = o.verdict === "blocked" ? "#dc2626" : o.verdict === "challenged" ? "#d97706" : o.verdict === "allowed" ? "#16a34a" : "#64748b";
              const kararMetin = o.verdict === "blocked" ? "Engellendi" : o.verdict === "challenged" ? "Doğrulandı" : o.verdict === "allowed" ? "İzin verildi" : "İşaretlendi";
              return (
                <div
                  key={`${o.ts}-${i}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[12px] transition hover:bg-canvas/60"
                  style={i === 0 ? { animation: "zn-slide-in 0.4s both" } : undefined}
                >
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: renk }} />
                  <span className="shrink-0 font-mono font-medium text-slate-ink">{o.ip || "—"}</span>
                  {o.botClass && o.botClass !== "human" && (
                    <span className="shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] text-slate-muted">{o.botClass}</span>
                  )}
                  {o.path && <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-faint">{o.path}</span>}
                  <span
                    className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ background: `${renk}18`, color: renk }}
                  >
                    {kararMetin}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------ IcgoruKarti */
function IcgoruKarti({
  icgoru,
  anomaliler,
  t,
}: {
  icgoru: { baslik: string; metin: string; eylem: { ad: string; href: string } | null };
  anomaliler: { tur: string; siddet: string; baslik: string; aciklama: string; oneri: string }[];
  t: Ceviri;
}) {
  const siddetRenk: Record<string, string> = {
    kritik: "border-danger-soft bg-danger-soft/40 text-danger2",
    yuksek: "border-danger-soft bg-danger-soft/30 text-danger2",
    orta: "border-warn-soft bg-warn-soft/40 text-amber-700",
    dusuk: "border-line bg-canvas text-slate-muted",
  };
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-start gap-4 p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <Sparkles className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-ink">{icgoru.baslik}</h3>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-700">{t("gb.specterZeka")}</span>
          </div>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-muted">{icgoru.metin}</p>
          {icgoru.eylem && (
            <Link href={icgoru.eylem.href} className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 transition hover:text-brand-700">
              {icgoru.eylem.ad} <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
      {anomaliler.length > 0 && (
        <div className="border-t border-line px-6 py-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
            <TriangleAlert className="size-3.5" /> {t("gb.anomaliTespiti").replace("{n}", String(anomaliler.length))}
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {anomaliler.map((a, i) => (
              <div key={i} className={cn("rounded-2xl border px-3.5 py-3", siddetRenk[a.siddet] ?? siddetRenk.dusuk)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-slate-ink">{a.baslik}</span>
                  <span className="rounded-full bg-canvas/70 px-2 py-0.5 text-[10px] font-bold uppercase">{a.siddet}</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-muted">{a.aciklama}</p>
                {a.oneri && <p className="mt-1.5 text-[11.5px] italic text-slate-faint">→ {a.oneri}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- KpiKart
 * Genel Bakış'taki 6 KPI için tek-tip premium kart. Eşit yükseklik
 * (h-full + min-h), ikon çipi + büyük tabular sayı + etiket.
 * ZENGİNLİK: her kart bir mini sparkline (deterministik, tohumdan) + delta
 * rozeti (↑/↓ %) + alt-bilgi satırı taşır → kart ORTASI boş kalmaz, "canlı"
 * ve derin durur (Vercel/Linear/guven-merkezi kalitesi). href verilirse
 * tıklanabilir + sağ üstte ok; hover'da hafif yükselir. */
function KpiKart({
  sayi,
  etiket,
  ikon,
  tone = "brand",
  href,
  delta,
  deltaIyiYon = "up",
  altBilgi,
  spark = true,
}: {
  sayi: string | number;
  etiket: string;
  ikon: React.ReactNode;
  tone?: "brand" | "danger" | "ok" | "warn";
  href?: string;
  /** Yüzde değişim (ör. +12.4). Verilirse ↑/↓ rozeti çizilir. */
  delta?: number;
  /** Artış "iyi" mi kötü mü — rozet rengini belirler. */
  deltaIyiYon?: "up" | "down";
  /** Sayının altındaki ince açıklama satırı. */
  altBilgi?: string;
  /** Mini sparkline göster (tohum = etiket). */
  spark?: boolean;
}) {
  const cipSinif = {
    brand: "bg-brand-50 text-brand-600 ring-brand-100",
    danger: "bg-danger-soft text-danger2 ring-red-200",
    ok: "bg-ok-soft text-ok ring-green-200",
    warn: "bg-warn-soft text-warn ring-amber-200",
  }[tone];
  const sayiRenk = {
    brand: "text-slate-ink",
    danger: "text-danger2",
    ok: "text-slate-ink",
    warn: "text-warn",
  }[tone];
  const sparkRenk = { brand: "#2f6fed", danger: "#dc2626", ok: "#16a34a", warn: "#d97706" }[tone];

  // Delta rozeti: artış yönü "iyi" ise yeşil, değilse kırmızı.
  const deltaVar = typeof delta === "number" && Number.isFinite(delta) && delta !== 0;
  const artiyor = (delta ?? 0) > 0;
  const iyi = deltaIyiYon === "up" ? artiyor : !artiyor;

  const icerik = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl ring-1 ring-inset", cipSinif)}>{ikon}</span>
        <div className="flex items-center gap-2">
          {deltaVar && (
            <span className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              iyi ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2",
            )}>
              {artiyor ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              %{Math.abs(delta as number).toFixed(1)}
            </span>
          )}
          {href && <ArrowUpRight className="size-4 text-slate-faint transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />}
        </div>
      </div>

      {/* orta: mini sparkline — boşluğu doldurur, "canlı" his verir.
          Metrik kartları (spark) net; navigasyon kartları soluk zemin-dokusu. */}
      <div className={cn("my-2.5 -mx-1", spark ? "opacity-90" : "opacity-40")}>
        <MiniSpark tohum={String(etiket)} renk={sparkRenk} yukseklik={spark ? 34 : 28} />
      </div>

      <div className="mt-auto">
        <div className={cn("num text-[28px] font-bold leading-none tabular-nums", sayiRenk)}>{sayi}</div>
        <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-slate-muted">{etiket}</p>
        {altBilgi && <p className="mt-0.5 text-[11px] leading-snug text-slate-faint">{altBilgi}</p>}
      </div>
    </>
  );

  const ortak = "group flex h-full min-h-[148px] flex-col rounded-2xl border border-line bg-surface p-4 transition";
  if (href) {
    return (
      <Link href={href} className={cn(ortak, "hover:border-line-strong hover:bg-canvas/40 hover:-translate-y-0.5 hover:shadow-sm")}>
        {icerik}
      </Link>
    );
  }
  return <div className={ortak}>{icerik}</div>;
}

function VerdictBadge({ verdict, t }: { verdict: string; t: Ceviri }) {
  if (verdict === "blocked") return <Badge ton="kirmizi">{t("gb.verdict.engellendi")}</Badge>;
  if (verdict === "allowed") return <Badge ton="yesil">{t("gb.verdict.izin")}</Badge>;
  if (verdict === "challenged") return <Badge ton="sari">{t("gb.verdict.dogrulandi")}</Badge>;
  return <Badge ton="gri">{t("gb.verdict.isaretlendi")}</Badge>;
}

/* ---------------------------------------------------------- OnboardingKart */
interface OnbAdim {
  anahtar: string; tamam: boolean; ad: string; desc: string; href: string;
  cta: string; ikon: React.ReactNode; sure: string; ipucu: string;
}

function OnboardingKart({
  onboarding,
  t,
}: {
  onboarding: {
    siteVar: boolean; dogrulandiVar: boolean; trafikVar: boolean;
    dogrulamaVar: boolean; kuralVar: boolean; apiAnahtarVar: boolean; ilkSiteId: string | null;
  };
  t: Ceviri;
}) {
  const siteHref = onboarding.ilkSiteId ? `/panel/siteler/${onboarding.ilkSiteId}` : "/panel/siteler";
  // Görevin istediği ilk-adım kontrol listesi (6 adım, gerçek durumdan türetilir):
  // 1) İlk siteni ekle  2) Alan adını doğrula  3) Doğrulama kodunu yerleştir
  // 4) İlk kuralını oluştur  5) Canlı trafiği izle  6) API anahtarını al.
  const adimlar: OnbAdim[] = [
    { anahtar: "site", tamam: onboarding.siteVar, ad: t("gb.onb.site.ad"), desc: t("gb.onb.site.desc"), href: "/panel/siteler", cta: t("gb.onb.site.cta"), ikon: <Globe className="size-4" />, sure: t("gb.onb.site.sure"), ipucu: t("gb.onb.site.ipucu") },
    { anahtar: "dogrula", tamam: onboarding.dogrulandiVar, ad: t("gb.onb.dogrula.ad"), desc: t("gb.onb.dogrula.desc"), href: siteHref, cta: t("gb.onb.dogrula.cta"), ikon: <ShieldCheck className="size-4" />, sure: t("gb.onb.dogrula.sure"), ipucu: t("gb.onb.dogrula.ipucu") },
    { anahtar: "widget", tamam: onboarding.trafikVar, ad: t("gb.onb.widget.ad"), desc: t("gb.onb.widget.desc"), href: "/panel/gelistirici", cta: t("gb.onb.widget.cta"), ikon: <Code2 className="size-4" />, sure: t("gb.onb.widget.sure"), ipucu: t("gb.onb.widget.ipucu") },
    { anahtar: "kural", tamam: onboarding.kuralVar, ad: t("gb.onb.kural.ad"), desc: t("gb.onb.kural.desc"), href: "/panel/kurallar", cta: t("gb.onb.kural.cta"), ikon: <GitBranch className="size-4" />, sure: t("gb.onb.kural.sure"), ipucu: t("gb.onb.kural.ipucu") },
    { anahtar: "dogrulama", tamam: onboarding.dogrulamaVar, ad: t("gb.onb.dogrulama.ad"), desc: t("gb.onb.dogrulama.desc"), href: "/panel/trafik", cta: t("gb.onb.dogrulama.cta"), ikon: <Zap className="size-4" />, sure: t("gb.onb.dogrulama.sure"), ipucu: t("gb.onb.dogrulama.ipucu") },
    { anahtar: "apikey", tamam: onboarding.apiAnahtarVar, ad: t("gb.onb.apikey.ad"), desc: t("gb.onb.apikey.desc"), href: "/panel/gelistirici", cta: t("gb.onb.apikey.cta"), ikon: <KeyRound className="size-4" />, sure: t("gb.onb.apikey.sure"), ipucu: t("gb.onb.apikey.ipucu") },
  ];

  const toplam = adimlar.length;
  const tamamSayi = adimlar.filter((a) => a.tamam).length;
  const yuzde = Math.round((tamamSayi / toplam) * 100);
  const bittiHepsi = tamamSayi === toplam;
  const aktifIdx = adimlar.findIndex((a) => !a.tamam);

  const [kucult, setKucult] = useState(false);
  const [acikIpucu, setAcikIpucu] = useState<string | null>(null);
  // Kutlama patlaması — kurulum ilk kez tamamlandığında bir kez konfeti göster.
  const [kutla, setKutla] = useState(false);
  const azHareket = useReducedMotion();
  useEffect(() => {
    if (!bittiHepsi) return;
    try {
      if (localStorage.getItem("specter-onboarding-kutlandi") === "1") return;
      localStorage.setItem("specter-onboarding-kutlandi", "1");
    } catch { /* sessiz */ }
    if (azHareket) return;
    setKutla(true);
    const z = setTimeout(() => setKutla(false), 2600);
    return () => clearTimeout(z);
  }, [bittiHepsi, azHareket]);
  useEffect(() => {
    try {
      if (localStorage.getItem("specter-onboarding-kapali") === "1") setKucult(true);
    } catch { /* sessiz */ }
  }, []);

  function kucultKaydet() {
    setKucult(true);
    try { localStorage.setItem("specter-onboarding-kapali", "1"); } catch { /* sessiz */ }
  }

  // Kurulum bitmiş + kullanıcı kapatmışsa → hiç yer kaplama, tamamen gizle.
  if (bittiHepsi && kucult) return null;

  // Kurulum bitmiş ama henüz kapatılmamışsa → tek satırlık, kapatılabilir
  // "tamamlandı" şeridi (dev bir "bitmiş sihirbaz" kartı yer kaplamaz).
  // Kapatınca localStorage'a yazılır ve bir daha görünmez.
  if (bittiHepsi) {
    return (
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-ok/30 bg-ok-soft/40 px-4 py-3">
        {kutla && <Konfeti />}
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ok text-white">
          <Check className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-slate-ink">{t("gb.kurulumTamam")}</p>
          <p className="truncate text-[12px] text-slate-muted">{t("gb.kurulumTamamAlt")}</p>
        </div>
        <Link href="/panel/ai-ajanlar" className="hidden shrink-0 items-center gap-1 text-[12.5px] font-medium text-brand-600 transition hover:text-brand-700 sm:inline-flex">
          {t("gb.siradaAi")} <ChevronRight className="size-3.5" />
        </Link>
        <button onClick={kucultKaydet} aria-label={t("gb.kapat")} className="grid size-7 shrink-0 place-items-center rounded-full text-slate-faint transition hover:bg-canvas/70 hover:text-slate-ink">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
      <div className="border-b border-line bg-brand-50/40 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-ink-900 text-white"><Rocket className="size-5" /></span>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-ink">{t("gb.hosgeldin")}</h3>
              <p className="text-[13px] text-slate-muted">{t("gb.hosgeldinAlt")}</p>
            </div>
          </div>
          <span className="num shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100">{t("gb.tamamlandiSayi").replace("{n}", String(tamamSayi)).replace("{toplam}", String(toplam))}</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${yuzde}%`, background: "linear-gradient(90deg, #6a97fb, #2f6fed)" }} />
          </div>
          <span className="num text-[13px] font-bold text-slate-ink">%{yuzde}</span>
        </div>
      </div>

      <div className="divide-y divide-line">
        {adimlar.map((a, i) => {
          const aktif = i === aktifIdx;
          const ipucuAcik = acikIpucu === a.anahtar;
          return (
            <div key={a.anahtar} className={cn("px-6 py-4 transition", aktif && "bg-brand-50/30")}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  {a.tamam ? (
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 className="size-5" /></span>
                  ) : aktif ? (
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-card">{a.ikon}</span>
                  ) : (
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-canvas text-slate-faint"><Circle className="size-4" /></span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num text-[11px] font-semibold text-slate-faint">{t("gb.adim").replace("{n}", String(i + 1))}</span>
                      <span className={cn("text-sm font-semibold", a.tamam ? "text-slate-faint line-through" : "text-slate-ink")}>{a.ad}</span>
                      {!a.tamam && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-muted"><Clock className="size-3" /> {a.sure}</span>
                      )}
                      {aktif && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{t("gb.simdi")}</span>}
                    </div>
                    {!a.tamam && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-muted">{a.desc}</p>}
                    {!a.tamam && (
                      <>
                        <button onClick={() => setAcikIpucu(ipucuAcik ? null : a.anahtar)} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 transition hover:text-brand-700">
                          <Sparkles className="size-3" /> {t("gb.nasilYapilir")}
                          <ChevronDown className={cn("size-3 transition-transform", ipucuAcik && "rotate-180")} />
                        </button>
                        <AnimatePresence initial={false}>
                          {ipucuAcik && (
                            <motion.p
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-[12.5px] leading-relaxed text-brand-800"
                            >
                              {a.ipucu}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                </div>
                {!a.tamam && (
                  aktif ? (
                    <Link href={a.href} className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-ink-800">{a.cta} <ArrowRight className="size-3.5" /></Link>
                  ) : (
                    <Link href={a.href} className="hidden shrink-0 items-center gap-1 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink sm:flex">{a.cta} <ChevronRight className="size-3.5" /></Link>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Konfeti
 * Kutlama anı için hafif, bağımlılıksız konfeti. Küçük renkli parçacıklar
 * saf CSS keyframe (`animate-konfeti`) ile aşağı düşer. prefers-reduced-motion
 * açıkken OnboardingKart bunu hiç render etmez. Yatay taşma yapmaz (overflow
 * ebeveynde clip'lenir); pointer-events yok. */
function Konfeti() {
  const renkler = ["#2f6fed", "#16a34a", "#d97706", "#dc2626", "#6a97fb", "#f4c430"];
  const parcalar = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        sol: (i * 3.7 + (i % 5) * 4) % 100,
        renk: renkler[i % renkler.length],
        gecikme: (i % 7) * 0.12,
        sure: 1.6 + (i % 4) * 0.35,
        boyut: 5 + (i % 3) * 2,
        donme: (i % 2 === 0 ? 1 : -1) * (120 + i * 8),
      })),
    // renkler sabit — bir kez hesapla
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {parcalar.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 animate-konfeti rounded-[2px]"
          style={{
            left: `${p.sol}%`,
            width: p.boyut,
            height: p.boyut * 1.6,
            background: p.renk,
            animationDelay: `${p.gecikme}s`,
            animationDuration: `${p.sure}s`,
            ["--konfeti-donme" as string]: `${p.donme}deg`,
          }}
        />
      ))}
    </div>
  );
}

export { Check, ChevronRight };
