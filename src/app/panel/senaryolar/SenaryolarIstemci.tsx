"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ShoppingCart, LogIn, Server, FileText, MessageSquare, CreditCard, Gauge, UserPlus,
  ChevronRight, ArrowRight, X, Check, ShieldCheck, Bot, TrendingDown, TrendingUp,
  Sparkles, Zap, Target, Layers,
} from "lucide-react";
import { Secim, useToast, useScrollKilit, Badge } from "@/components/panel/kit";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { RULE_TEMPLATES } from "@/lib/specter/rule-templates";
import { AI_AJANLAR, type AiAjan } from "@/lib/specter/ai-agents";
import type { Dil } from "@/lib/i18n/panel";
import { senaryolarCeviri } from "./senaryolar.i18n";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGost } from "@/components/panel/grafikler-ek";

interface Site { id: string; name: string }

/**
 * Çeviri yardımcısı türü — alt bileşenlere prop olarak iletilir.
 * `t(anahtar, { n: 3 })` enterpolasyon için `{n}` gibi yer-tutucuları değiştirir.
 */
type CevirFn = (anahtar: string, ikame?: Record<string, string | number>) => string;

/**
 * Bir şablon metnini `{anahtar}` yer-tutucularından bölerek React düğümleriyle
 * dokur (bold site adı gibi inline vurguları korumak için). Düz metin parçaları
 * olduğu gibi, yer-tutucular verilen düğümlerle değiştirilir.
 */
function altMetinParcalari(
  sablon: string,
  dugumler: Record<string, React.ReactNode>,
): React.ReactNode[] {
  const parcalar = sablon.split(/(\{[a-zA-Z]+\})/g);
  return parcalar.map((p, i) => {
    const eslesme = p.match(/^\{([a-zA-Z]+)\}$/);
    if (eslesme && dugumler[eslesme[1]] !== undefined) {
      return <span key={i}>{dugumler[eslesme[1]]}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

/** Bir dil için `t` üreticisi — `{anahtar}` yer-tutucularını değerlerle değiştirir. */
function cevirYap(dil: Dil): CevirFn {
  return (anahtar, ikame) => {
    let s = senaryolarCeviri(anahtar, dil);
    if (ikame) {
      for (const [k, v] of Object.entries(ikame)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}

type SenaryoKat = "eticaret" | "saas" | "medya" | "api";

interface Metrik { etiket: string; deger: string; yon: "iyi" | "kotu" | "notr" }

interface Senaryo {
  key: string;
  ad: string;
  desc: string;
  problem: string;
  cozum: string;
  icon: typeof ShoppingCart;
  kat: SenaryoKat;
  vurgu: boolean; // büyük kart mı
  /** Uygulanacak gerçek rule-template key'leri. */
  kurallar: string[];
  /** Hedeflenen AI ajan id'leri (ai-agents kataloğundan). */
  ajanlar?: string[];
  metrikler: Metrik[];
  adimlar: string[];
}

/** Kategori anahtar listesi — etiketler ENUM GÜVENLİĞİ gereği i18n'den
 * `t("kat."+kat)` ile türetilir; burada yalnızca yapısal sıra tutulur. */
const KAT_KEYLER: Array<"hepsi" | SenaryoKat> = ["hepsi", "eticaret", "saas", "medya", "api"];

/** Kategori görsel kimliği — renk (donut + kart aksanı) yalnızca GÖRSEL; etiket
 * i18n'den türer, enum güvenliği korunur. */
const KAT_GORSEL: Record<SenaryoKat, { renk: string; soft: string; kabuk: string }> = {
  eticaret: { renk: "#2f6fed", soft: "#eaf1fe", kabuk: "border-brand-100" },
  saas:     { renk: "#7c3aed", soft: "#f1ebfe", kabuk: "border-violet-100" },
  medya:    { renk: "#0891b2", soft: "#e2f5f9", kabuk: "border-teal-100" },
  api:      { renk: "#d97706", soft: "#fdf1e3", kabuk: "border-amber-100" },
};

/** Bir "-94%" / "<%1" / "korundu" gibi metrik değerinden gauge için 0-100 skoru
 * çıkarır. Yüzdesel iyileşme değerleri (negatif) mutlak değere alınır; sayısal
 * olmayanlar (korundu/nötr) için sabit gösterge döner. Yalnızca GÖRSEL — veriyi
 * değiştirmez. */
function metrikGauge(deger: string): number | null {
  const m = deger.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

/**
 * DÜRÜSTLÜK: `metrikler` alanındaki değerler (-94%, 8ms, korundu…) kullanıcının
 * kendi sitesinin ÖLÇÜMÜ DEĞİLDİR — benzer kurulumlara dayalı TEMSİLİ benchmark
 * referanslarıdır. UI'da gauge/kart/drawer'da "temsili" olarak açıkça etiketlenir;
 * gerçek etki kural uygulandıktan sonra Analitik'te görünür.
 */
const SENARYOLAR: Senaryo[] = [
  // --- Resmi (vurgu) senaryolar — KORUNDU + derinleştirildi ---
  {
    key: "ecommerce",
    ad: "E-ticaret Koruması",
    desc: "Ödeme ve sepet formlarını bot dolandırıcılığından koru",
    problem: "Sepete-ekle ve ödeme uçları bot saldırılarına açık: envanter tükendi-gösterimi, kart deneme (carding) ve fiyat kazıma satışı doğrudan vuruyor.",
    cozum: "Ödeme akışına görünmez davranış analizi + veri merkezi/VPN zorlaması ekleyerek gerçek müşteriyi yavaşlatmadan botu durdurur.",
    icon: ShoppingCart,
    kat: "eticaret",
    vurgu: true,
    kurallar: ["rate-limit", "block-datacenter", "low-score"],
    metrikler: [
      { etiket: "Carding denemesi", deger: "-94%", yon: "iyi" },
      { etiket: "Sahte sepet", deger: "-88%", yon: "iyi" },
      { etiket: "Müşteri sürtünmesi", deger: "<%1", yon: "notr" },
    ],
    adimlar: [
      "Ödeme ve sepet uçlarına görünmez challenge yerleştirilir.",
      "Veri merkezi (AWS/DO/Hetzner) IP'leri doğrulamaya alınır.",
      "İnsanlık skoru düşük istekler doğrudan engellenir.",
      "Gerçek müşteri hiçbir CAPTCHA görmez (görünmez mod).",
    ],
  },
  {
    key: "login",
    ad: "Giriş Koruması",
    desc: "Kimlik doldurma ve brute-force saldırılarını durdur",
    problem: "Sızmış parola listeleriyle /login uçlarına saniyede yüzlerce deneme yapılıyor; başarılı bir eşleşme hesap ele geçirmeye (ATO) dönüşüyor.",
    cozum: "Login yolunda hız-sınırı + VPN/anonim ağ zorlaması ile kimlik doldurma dalgasını daha ilk denemede yavaşlatır.",
    icon: LogIn,
    kat: "saas",
    vurgu: true,
    kurallar: ["credential-stuffing", "block-vpn", "rate-limit"],
    metrikler: [
      { etiket: "Başarısız giriş", deger: "-97%", yon: "iyi" },
      { etiket: "Hesap ele geçirme", deger: "0", yon: "iyi" },
      { etiket: "Engelleme gecikmesi", deger: "8ms", yon: "notr" },
    ],
    adimlar: [
      "/login yoluna dakikalık deneme hız-sınırı uygulanır.",
      "VPN / anonim ağ ASN'leri challenge'a tabi tutulur.",
      "Aynı fingerprint'ten yoğun deneme işaretlenir.",
      "Meşru kullanıcı normal akışta devam eder.",
    ],
  },
  {
    key: "api",
    ad: "API Koruması",
    desc: "Herkese açık API uçlarını scraper ve kötüye kullanımdan koru",
    problem: "Public API uçları (GraphQL/REST) sözleşmesiz istemciler tarafından toplu çekiliyor; maliyet ve veri sızıntısı artıyor.",
    cozum: "Agresif hız-sınırı + AI ajan tespiti ile otomatik istemcileri gerçek entegrasyonlardan ayırır.",
    icon: Server,
    kat: "api",
    vurgu: true,
    kurallar: ["rate-limit", "ai-agents", "block-datacenter"],
    ajanlar: ["operator-agent", "gptbot", "ccbot"],
    metrikler: [
      { etiket: "Yetkisiz çekim", deger: "-91%", yon: "iyi" },
      { etiket: "Sunucu maliyeti", deger: "-37%", yon: "iyi" },
      { etiket: "Meşru API isteği", deger: "korundu", yon: "notr" },
    ],
    adimlar: [
      "API uçlarına IP başına dakikalık hız-sınırı konur.",
      "AI ajan / headless imzaları tespit edilip doğrulanır.",
      "Veri merkezi trafiği zorlanır, sözleşmeli istemci beyaz listede.",
    ],
  },
  {
    key: "content",
    ad: "İçerik Kazımaya Karşı",
    desc: "Blog/katalog içeriğini AI scraper'lardan koru",
    problem: "Özgün içerik AI eğitim botları ve ticari scraper'lar tarafından toplanıp yeniden yayınlanıyor; içerik değeriniz eriyor.",
    cozum: "AI eğitim ajanlarını (GPTBot/ClaudeBot/CCBot) engelleyip yüksek riskli coğrafyaları doğrulayarak içeriğinizi eğitime kaptırmaz.",
    icon: FileText,
    kat: "medya",
    vurgu: true,
    kurallar: ["ai-agents", "geo-high-risk"],
    ajanlar: ["gptbot", "claudebot", "ccbot", "bytespider"],
    metrikler: [
      { etiket: "AI eğitim taraması", deger: "-96%", yon: "iyi" },
      { etiket: "İçerik kazıma", deger: "-89%", yon: "iyi" },
      { etiket: "Arama SEO etkisi", deger: "yok", yon: "notr" },
    ],
    adimlar: [
      "Model eğitimi botları (GPTBot, ClaudeBot, CCBot) engellenir.",
      "Yüksek riskli coğrafyalar doğrulamaya alınır.",
      "Googlebot/Bingbot beyaz listede — SEO etkilenmez.",
    ],
  },

  // --- YENİ senaryolar ---
  {
    key: "ai-training",
    ad: "AI Eğitim Botlarını Engelle",
    desc: "İçeriğinizi LLM eğitim veri setlerine kaptırmayın",
    problem: "GPTBot, ClaudeBot, CCBot, Bytespider gibi botlar sitenizi izniniz olmadan model eğitimi için topluyor. İçeriğiniz kalıcı olarak eğitim setine giriyor.",
    cozum: "AI Ajan İstihbaratı kataloğuna bağlı olarak tüm model-eğitimi sınıfı botları tek politikayla engeller; canlı-getirme (RAG) botlarına ise izin verebilirsiniz.",
    icon: Bot,
    kat: "medya",
    vurgu: false,
    kurallar: ["ai-agents"],
    ajanlar: ["gptbot", "claudebot", "google-extended", "meta-externalagent", "ccbot", "bytespider", "cohere-ai"],
    metrikler: [
      { etiket: "Eğitim taraması", deger: "-98%", yon: "iyi" },
      { etiket: "Kapsanan ajan", deger: "7 operatör", yon: "notr" },
      { etiket: "Arama trafiği", deger: "korundu", yon: "iyi" },
    ],
    adimlar: [
      "Model-eğitimi kategorisindeki tüm ajanlar tespit edilir.",
      "robots.txt'i yok sayan botlar (Bytespider) sıkı engellenir.",
      "AI ajan kuralı sitenize eklenir; katalogdan politika yönetilir.",
    ],
  },
  {
    key: "checkout",
    ad: "Ödeme Sayfası Koruması",
    desc: "Kart deneme (carding) ve ödeme fraud'unu durdur",
    problem: "Çalıntı kart listeleri, küçük tutarlı test işlemleriyle ödeme sayfanızda deneniyor (carding). Ceza/geri-ödeme (chargeback) ve işlemci cezaları birikiyor.",
    cozum: "Ödeme adımına en yüksek hassasiyette davranış analizi + hız-sınırı + veri merkezi zorlaması uygulayarak fraud denemelerini onaydan önce eler.",
    icon: CreditCard,
    kat: "eticaret",
    vurgu: false,
    kurallar: ["rate-limit", "low-score", "block-datacenter", "block-vpn"],
    metrikler: [
      { etiket: "Kart deneme", deger: "-95%", yon: "iyi" },
      { etiket: "Chargeback", deger: "-71%", yon: "iyi" },
      { etiket: "Dönüşüm etkisi", deger: "nötr", yon: "notr" },
    ],
    adimlar: [
      "Ödeme uçuna en katı davranış eşiği uygulanır.",
      "VPN + veri merkezi IP'leri zorunlu doğrulamaya alınır.",
      "Kart-başına deneme hızı sınırlanır.",
    ],
  },
  {
    key: "api-ratelimit",
    ad: "API Hız-Sınırı",
    desc: "Kötüye kullanımı ve maliyet patlamasını önle",
    problem: "Tek bir istemci saniyede yüzlerce istek atarak API'nizi boğuyor; hem servis kalitesi düşüyor hem faturanız şişiyor.",
    cozum: "IP ve fingerprint başına agresif hız-sınırı ile adil kullanımı korur, kötüye kullananı otomatik engeller.",
    icon: Gauge,
    kat: "api",
    vurgu: false,
    kurallar: ["rate-limit", "low-score"],
    metrikler: [
      { etiket: "Aşırı istek", deger: "-93%", yon: "iyi" },
      { etiket: "p95 gecikme", deger: "-42%", yon: "iyi" },
      { etiket: "Maliyet", deger: "-30%", yon: "iyi" },
    ],
    adimlar: [
      "IP başına dakikalık istek eşiği belirlenir (varsayılan 60).",
      "Eşiği aşan kaynaklar otomatik engellenir.",
      "Düşük skorlu otomasyon ayrıca elenir.",
    ],
  },
  {
    key: "comment-spam",
    ad: "Yorum & İnceleme Spam'i",
    desc: "Sahte yorum ve spam gönderimlerini engelle",
    problem: "Yorum, forum ve inceleme formları bot spam'i ve sahte 5-yıldız/kötüleme kampanyalarıyla doldu; itibar ve moderasyon yükü artıyor.",
    cozum: "Görünmez davranış analizi + coğrafya doğrulaması + hız-sınırı ile sahte gönderimleri kaynağında eler, gerçek kullanıcıya CAPTCHA göstermez.",
    icon: MessageSquare,
    kat: "medya",
    vurgu: false,
    kurallar: ["low-score", "geo-high-risk", "rate-limit"],
    metrikler: [
      { etiket: "Spam yorum", deger: "-92%", yon: "iyi" },
      { etiket: "Sahte inceleme", deger: "-85%", yon: "iyi" },
      { etiket: "Moderasyon yükü", deger: "-60%", yon: "iyi" },
    ],
    adimlar: [
      "Gönderim formuna görünmez davranış skoru eklenir.",
      "Yüksek riskli coğrafyalar doğrulamaya alınır.",
      "Aynı kaynaktan seri gönderim hız-sınırıyla engellenir.",
    ],
  },
  {
    key: "signup",
    ad: "Kayıt Formu Koruması",
    desc: "Sahte hesap oluşturmayı engelle",
    problem: "Bedava plan, deneme ve kupon istismarı için toplu sahte hesap açılıyor; kullanıcı metrikleriniz ve maliyetiniz bozuluyor.",
    cozum: "Kayıt uçuna davranış analizi + veri merkezi/VPN zorlaması ekleyerek toplu hesap üretimini durdurur.",
    icon: UserPlus,
    kat: "saas",
    vurgu: false,
    kurallar: ["low-score", "block-datacenter", "block-vpn"],
    metrikler: [
      { etiket: "Sahte kayıt", deger: "-90%", yon: "iyi" },
      { etiket: "Deneme istismarı", deger: "-83%", yon: "iyi" },
      { etiket: "Gerçek kayıt", deger: "korundu", yon: "notr" },
    ],
    adimlar: [
      "Kayıt formuna görünmez challenge eklenir.",
      "Veri merkezi ve VPN kaynakları zorlanır.",
      "Düşük skorlu toplu üretim engellenir.",
    ],
  },
];

export function SenaryolarIstemci({ dil, sites }: { dil: Dil; sites: Site[] }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = useMemo(() => cevirYap(dil), [dil]);
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [kat, setKat] = useState<"hepsi" | SenaryoKat>("hepsi");
  const [detay, setDetay] = useState<Senaryo | null>(null);
  const [uygulaniyor, setUygulaniyor] = useState(false);

  useScrollKilit(!!detay);

  const filtreli = useMemo(
    () => (kat === "hepsi" ? SENARYOLAR : SENARYOLAR.filter((s) => s.kat === kat)),
    [kat],
  );
  const vurgulu = filtreli.filter((s) => s.vurgu);
  const digerleri = filtreli.filter((s) => !s.vurgu);

  /** KPI şeridi + kategori donutu için toplam sayımlar (yalnızca GÖRSEL). */
  const ozet = useMemo(() => {
    const toplamKural = SENARYOLAR.reduce((a, s) => a + s.kurallar.length, 0);
    const ajanKapsam = new Set(SENARYOLAR.flatMap((s) => s.ajanlar ?? [])).size;
    const katSayim: Record<SenaryoKat, number> = { eticaret: 0, saas: 0, medya: 0, api: 0 };
    for (const s of SENARYOLAR) katSayim[s.kat]++;
    return { toplam: SENARYOLAR.length, toplamKural, ajanKapsam, katSayim };
  }, []);

  /** Donut segmentleri — kategori dağılımı (renkli). */
  const katSegmentler = useMemo(
    () =>
      (["eticaret", "saas", "medya", "api"] as SenaryoKat[]).map((k) => ({
        etiket: t(`kat.${k}`),
        deger: ozet.katSayim[k],
        renk: KAT_GORSEL[k].renk,
      })),
    [ozet, t],
  );

  /** Senaryo kurallarını gerçekten rule-template'ten uygular (mevcut akış korundu). */
  async function uygula(senaryo: Senaryo) {
    if (!siteId) {
      goster({ tip: "hata", baslik: t("toast.onceSite") });
      return;
    }
    setUygulaniyor(true);
    let eklenen = 0;
    for (const k of senaryo.kurallar) {
      const res = await fetch("/api/rules/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, key: k }),
      }).catch(() => null);
      if (res && res.ok) eklenen++;
    }
    setUygulaniyor(false);
    setDetay(null);
    if (eklenen > 0) {
      goster({
        tip: "basari",
        baslik: t("toast.uygulandi", { ad: t(`sen.${senaryo.key}.ad`) }),
        aciklama: t("toast.eklendi", { n: eklenen }),
      });
      router.push("/panel/kurallar");
    } else {
      goster({ tip: "hata", baslik: t("toast.eklenemedi"), aciklama: t("toast.dogrulanmali") });
    }
  }

  const secilenSite = sites.find((s) => s.id === siteId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 px-6 pt-6 pb-10 lg:px-10">
      {/* Açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.metin")}
          </p>
        </div>
      </div>

      {/* Üst özet: ferah KPI şeridi + kategori dağılım donutu */}
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { deger: ozet.toplam, etiket: t("kpi.senaryo"), ikon: Layers, renk: "#2f6fed", soft: "bg-brand-50", ct: "text-brand-600" },
            { deger: ozet.toplamKural, etiket: t("kpi.kural"), ikon: Zap, renk: "#d97706", soft: "bg-amber-50", ct: "text-amber-600" },
            { deger: ozet.ajanKapsam, etiket: t("kpi.ajan"), ikon: Bot, renk: "#4f46e5", soft: "bg-brand-50", ct: "text-brand-600" },
            { deger: 4, etiket: t("kpi.kategori"), ikon: Target, renk: "#7c3aed", soft: "bg-violet-50", ct: "text-violet-600" },
          ].map((k, i) => {
            const KIkon = k.ikon;
            return (
              <motion.div
                key={i}
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3.5 rounded-3xl border border-line bg-surface px-5 py-4 shadow-card"
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", k.soft, k.ct)}>
                  <KIkon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[26px] font-bold leading-none tabular-nums text-slate-ink">{k.deger}</div>
                  <div className="mt-1 truncate text-[12px] text-slate-muted">{k.etiket}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-3xl border border-line bg-surface px-5 py-4 shadow-card">
          <div className="min-w-0">
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("donut.baslik")}</div>
            <DonutDagilim segmentler={katSegmentler} merkezEtiket={t("kpi.senaryo").toLowerCase()} />
          </div>
        </div>
      </div>

      {/* Site seçici + kategori filtresi */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px] max-w-md flex-1">
          <label className="mb-1.5 block text-sm font-semibold text-slate-ink">{t("site.etiket")}</label>
          <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            {sites.length === 0 && <option>{t("site.yok")}</option>}
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Secim>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KAT_KEYLER.map((k) => (
            <button
              key={k}
              onClick={() => setKat(k)}
              className={cn(
                "rounded-full px-3.5 py-2 text-[13px] font-medium transition",
                kat === k ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
              )}
            >
              {t(`kat.${k}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Vurgulu senaryolar — büyük kartlar */}
      {vurgulu.length > 0 && (
        <div>
          <h2 className="mb-4 text-[22px] font-bold tracking-tight text-slate-ink">{t("bolum.oneCikan")}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {vurgulu.map((s, si) => {
              const Icon = s.icon;
              const kg = KAT_GORSEL[s.kat];
              // İlk "iyi" yönlü metriğin gauge skoru (yalnızca görsel özet).
              const anaMetrik = s.metrikler.find((m) => m.yon === "iyi") ?? s.metrikler[0];
              const gaugeSkor = anaMetrik ? metrikGauge(anaMetrik.deger) : null;
              return (
                <motion.button
                  key={s.key}
                  onClick={() => setDetay(s)}
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.4, delay: si * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-surface p-7 text-left transition hover:border-line-strong hover:shadow-card"
                >
                  {/* kategori renkli üst şerit */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: kg.renk }} />
                  <Icon className="pointer-events-none absolute -right-6 -top-4 size-40 text-slate-ink/[0.03]" strokeWidth={1} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="grid size-11 place-items-center rounded-2xl" style={{ background: kg.soft, color: kg.renk }}><Icon className="size-5" /></span>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: kg.soft, color: kg.renk }}
                        >
                          {t(`kat.${s.kat}`)}
                        </span>
                      </div>
                      <h3 className="text-[22px] font-bold text-slate-ink">{t(`sen.${s.key}.ad`)}</h3>
                      <p className="mt-2 max-w-sm leading-relaxed text-slate-muted">{t(`sen.${s.key}.desc`)}</p>
                    </div>
                    {/* ana metrik gauge — monoton bar yerine yarım-daire gösterge */}
                    {gaugeSkor !== null && (
                      <div className="hidden shrink-0 flex-col items-center sm:flex">
                        <GaugeGost deger={gaugeSkor} boyut={104} renk={kg.renk} etiket={t(`sen.${s.key}.m${s.metrikler.indexOf(anaMetrik)}.deger`)} />
                        <span className="-mt-1 max-w-[110px] text-center text-[10.5px] leading-tight text-slate-faint">
                          {t(`sen.${s.key}.m${s.metrikler.indexOf(anaMetrik)}.etiket`)}
                        </span>
                        <span className="mt-0.5 rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-faint">
                          {t("kart.temsili")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {/* hedef-AI rozetleri (varsa) — küçük renkli noktalarla */}
                      {s.ajanlar && s.ajanlar.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-700">
                          <Bot className="size-3.5" /> {t("kart.ajan", { n: s.ajanlar.length })}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[12px] font-medium text-slate-muted">
                        <Layers className="size-3.5" /> {t("kart.kural", { n: s.kurallar.length })}
                      </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand-600">
                      {t("kart.incele")} <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Diğer senaryolar — kompakt kartlar */}
      {digerleri.length > 0 && (
        <div>
          <h2 className="mb-4 text-[22px] font-bold tracking-tight text-slate-ink">{t("bolum.dahaFazla")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((s, si) => {
              const Icon = s.icon;
              const kg = KAT_GORSEL[s.kat];
              const anaMetrik = s.metrikler.find((m) => m.yon === "iyi") ?? s.metrikler[0];
              const gaugeSkor = anaMetrik ? metrikGauge(anaMetrik.deger) : null;
              return (
                <motion.button
                  key={s.key}
                  onClick={() => setDetay(s)}
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.35, delay: si * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-line bg-surface p-6 text-left transition hover:border-line-strong hover:shadow-card"
                >
                  {/* sol kategori renkli aksan çubuğu */}
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: kg.renk }} />
                  <div className="flex w-full items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl" style={{ background: kg.soft, color: kg.renk }}><Icon className="size-5" /></span>
                    {gaugeSkor !== null ? (
                      <div className="flex flex-col items-center">
                        <GaugeGost deger={gaugeSkor} boyut={72} renk={kg.renk} />
                        <span className="-mt-1 text-[9.5px] font-medium text-slate-faint">{t(`sen.${s.key}.m${s.metrikler.indexOf(anaMetrik)}.deger`)}</span>
                        <span className="text-[8.5px] uppercase tracking-wide text-slate-faint/80">{t("kart.temsili")}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: kg.soft, color: kg.renk }}>
                        {t(`kat.${s.kat}`)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-bold text-slate-ink">{t(`sen.${s.key}.ad`)}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-muted">{t(`sen.${s.key}.desc`)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11.5px] text-slate-muted">
                      <Layers className="size-3" /> {t("kart.kural", { n: s.kurallar.length })}
                    </span>
                    {s.ajanlar && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11.5px] text-brand-700">
                        <Bot className="size-3" /> {t("kart.ajan", { n: s.ajanlar.length })}
                      </span>
                    )}
                  </div>
                  <span className="mt-3 flex items-center gap-1 text-[13px] font-medium text-brand-600">
                    {t("kart.inceleUygula")} <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detay drawer */}
      <AnimatePresence>
        {detay && (
          <SenaryoDetay
            t={t}
            senaryo={detay}
            siteAdi={secilenSite?.name}
            uygulaniyor={uygulaniyor}
            onKapat={() => setDetay(null)}
            onUygula={() => uygula(detay)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------- Detay drawer */
function SenaryoDetay({
  t,
  senaryo,
  siteAdi,
  uygulaniyor,
  onKapat,
  onUygula,
}: {
  t: CevirFn;
  senaryo: Senaryo;
  siteAdi?: string;
  uygulaniyor: boolean;
  onKapat: () => void;
  onUygula: () => void;
}) {
  const Icon = senaryo.icon;
  const kurallar = senaryo.kurallar
    .map((k) => RULE_TEMPLATES.find((t) => t.key === k))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const ajanlar = (senaryo.ajanlar ?? [])
    .map((id) => AI_AJANLAR.find((a) => a.id === id))
    .filter((a): a is AiAjan => !!a);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onKapat}
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-full w-full max-w-xl flex-col bg-surface shadow-lift"
      >
        {/* Başlık */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="size-6" /></span>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge ton="gri">{t(`kat.${senaryo.kat}`)}</Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-ink">{t(`sen.${senaryo.key}.ad`)}</h2>
              <p className="mt-0.5 text-[13px] text-slate-muted">{t(`sen.${senaryo.key}.desc`)}</p>
            </div>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
            <X className="size-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Problem / Çözüm */}
          <div className="grid gap-3">
            <div className="rounded-2xl border border-red-100 bg-danger-soft/50 px-4 py-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-red-700">
                <Target className="size-3.5" /> {t("drawer.problem")}
              </div>
              <p className="text-[13px] leading-relaxed text-slate-ink">{t(`sen.${senaryo.key}.problem`)}</p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-brand-700">
                <ShieldCheck className="size-3.5" /> {t("drawer.cozum")}
              </div>
              <p className="text-[13px] leading-relaxed text-slate-ink">{t(`sen.${senaryo.key}.cozum`)}</p>
            </div>
          </div>

          {/* Beklenen etki metrikleri — TEMSİLİ benchmark (site ölçümü değil) */}
          <div>
            <h4 className="mb-1 text-sm font-semibold text-slate-ink">{t("drawer.beklenenEtki")}</h4>
            <p className="mb-2.5 text-[11.5px] leading-snug text-slate-faint">{t("drawer.beklenenEtkiNot")}</p>
            <div className="grid grid-cols-3 gap-3">
              {senaryo.metrikler.map((m, mi) => (
                <div key={mi} className="rounded-2xl border border-line bg-canvas px-3 py-3 text-center">
                  <div className={cn(
                    "flex items-center justify-center gap-1 text-lg font-bold tabular-nums",
                    m.yon === "iyi" ? "text-ok" : m.yon === "kotu" ? "text-danger2" : "text-slate-ink",
                  )}>
                    {m.yon === "iyi" && <TrendingDown className="size-4" />}
                    {m.yon === "kotu" && <TrendingUp className="size-4" />}
                    {t(`sen.${senaryo.key}.m${mi}.deger`)}
                  </div>
                  <div className="mt-1 text-[11.5px] leading-tight text-slate-muted">{t(`sen.${senaryo.key}.m${mi}.etiket`)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Adım adım ne olur */}
          <div>
            <h4 className="mb-2.5 text-sm font-semibold text-slate-ink">{t("drawer.neOlur")}</h4>
            <ol className="space-y-2.5">
              {senaryo.adimlar.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[12px] font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5 text-[13px] leading-relaxed text-slate-muted">{t(`sen.${senaryo.key}.a${i}`)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Eklenecek kurallar */}
          <div>
            <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-ink">
              <Zap className="size-4 text-brand-600" /> {t("drawer.eklenecekKurallar", { n: kurallar.length })}
            </h4>
            <div className="space-y-2">
              {kurallar.map((k) => (
                <div key={k.key} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-ink">{t(`kural.${k.key}.name`)}</span>
                      <span className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase",
                        k.action === "block" ? "bg-danger-soft text-red-700" : k.action === "challenge" ? "bg-warn-soft text-amber-700" : "bg-ok-soft text-green-700",
                      )}>
                        {/* action enum id → çeviri KEY-MAP (enum değeri asla çevrilmez) */}
                        {t(`action.${k.action}`)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{t(`kural.${k.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hedeflenen AI ajanları */}
          {ajanlar.length > 0 && (
            <div>
              <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-ink">
                <Bot className="size-4 text-brand-600" /> {t("drawer.hedefAjanlar", { n: ajanlar.length })}
              </h4>
              <div className="flex flex-wrap gap-2">
                {ajanlar.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1.5 text-[12px]">
                    <span className="size-2 rounded-full" style={{ background: a.logo }} />
                    {/* ürün adı marka → çevrilmez; risk enum id → t("risk."+a.risk) */}
                    <span className="font-medium text-slate-ink">{a.urun}</span>
                    <span className="text-slate-faint">· {t(`risk.${a.risk}`)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alt aksiyon */}
        <div className="border-t border-line px-6 py-4">
          <p className="mb-2.5 text-center text-[12px] text-slate-muted">
            {/* Site adı bold; cümle sırası dile göre değiştiği için yer-tutuculardan dokunur. */}
            {altMetinParcalari(
              t("drawer.altMetin", { n: kurallar.length }),
              { site: <span key="s" className="font-semibold text-slate-ink">{siteAdi ?? t("drawer.varsayilanSite")}</span> },
            )}
          </p>
          <button
            onClick={onUygula}
            disabled={uygulaniyor}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
          >
            {uygulaniyor ? t("drawer.uygulaniyor") : <>{t("drawer.uygula")} <ArrowRight className="size-4" /></>}
          </button>
        </div>
      </motion.aside>
    </div>
  );
}
