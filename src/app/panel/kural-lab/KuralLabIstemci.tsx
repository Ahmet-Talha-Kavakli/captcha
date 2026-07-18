"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlaskConical, Play, ShieldCheck, ShieldX, ShieldAlert, Flag, Zap, Globe,
  Server, Fingerprint, Bot, Gauge, ListChecks, CheckCircle2, XCircle, MinusCircle,
  ChevronRight, Layers, Sparkles, Terminal, RotateCcw, Copy,
} from "lucide-react";
import { Panel, StatKart, Badge, Secim, KodBlok, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { MarkaLogo } from "@/components/panel/MarkaLogo";
import { cn } from "@/lib/cn";
import {
  ruleMatches, grupOzet, FIELD_ETIKET, OP_ETIKET, ACTION_ETIKET,
  type RequestContext,
} from "@/lib/specter/rule-engine";
import type { RuleAction, RuleField, RuleOp, BotClass, RuleKosulGrup } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { kuralLabCeviri } from "./kural-lab.i18n";

/** Bu modülde her yerde kullanılan çeviri imzası. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ Tipler */

/** Sunucudan gelen sadeleştirilmiş kural (izmi çizmek için gereken alanlar). */
interface LabKural {
  id: string;
  ad: string;
  aciklama: string;
  enabled: boolean;
  priority: number;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  kosulGrup: RuleKosulGrup | null;
  system: boolean;
}

interface Site {
  id: string;
  ad: string;
}

/** /api/rules/simulate yanıtı. */
interface SimYanit {
  action: RuleAction;
  decidedBy: { ruleId: string; ruleName: string; action: RuleAction } | null;
  matched: { ruleId: string; ruleName: string; action: RuleAction }[];
  evaluated: number;
  sinyaller: {
    aiAgentId: string;
    aiCategory: string;
    headless: boolean;
    tlsUaUyumsuz: boolean;
    httpVersion: string;
  };
}

/** İstek bestecinin tuttuğu tüm alanlar. */
interface Istek {
  ip: string;
  country: string;
  asn: string;
  ua: string;
  path: string;
  score: number;
  botClass: BotClass;
  headless: boolean;
  tlsMismatch: boolean;
  rate: number;
  httpVersion: string;
}

/* ------------------------------------------------------------------ Sabitler */

// kod = enum değeri (motor/filtre mantığı — çevrilmez); adKey = i18n etiketi.
const ULKELER: { kod: string; adKey: string }[] = [
  { kod: "TR", adKey: "klab.ulke.TR" }, { kod: "US", adKey: "klab.ulke.US" }, { kod: "DE", adKey: "klab.ulke.DE" },
  { kod: "GB", adKey: "klab.ulke.GB" }, { kod: "FR", adKey: "klab.ulke.FR" }, { kod: "NL", adKey: "klab.ulke.NL" },
  { kod: "RU", adKey: "klab.ulke.RU" }, { kod: "CN", adKey: "klab.ulke.CN" }, { kod: "IN", adKey: "klab.ulke.IN" },
  { kod: "BR", adKey: "klab.ulke.BR" }, { kod: "SG", adKey: "klab.ulke.SG" }, { kod: "IR", adKey: "klab.ulke.IR" },
  { kod: "UA", adKey: "klab.ulke.UA" }, { kod: "VN", adKey: "klab.ulke.VN" },
];

// kod = BotClass enum (çevrilmez); adKey = i18n etiketi.
const BOT_SINIFLARI: { kod: BotClass; adKey: string }[] = [
  { kod: "human", adKey: "klab.sinif.human" },
  { kod: "good_bot", adKey: "klab.sinif.good_bot" },
  { kod: "automation", adKey: "klab.sinif.automation" },
  { kod: "scraper", adKey: "klab.sinif.scraper" },
  { kod: "credential_stuffing", adKey: "klab.sinif.credential_stuffing" },
  { kod: "ai_agent", adKey: "klab.sinif.ai_agent" },
  { kod: "ddos", adKey: "klab.sinif.ddos" },
  { kod: "spam", adKey: "klab.sinif.spam" },
];

const HTTP_SURUMLERI = ["h2", "h3", "http/1.1"];

/**
 * User-Agent hazır kalıpları (çip'ler).
 * ad = teknik/ürün adı (python-requests, GPTBot… çevrilmez); adKey varsa çevrilir.
 * marka = MarkaLogo amblemi (teknoloji/araç logosu); yoksa emoji ikonu kullanılır.
 */
const UA_KALIPLAR: { ad: string; adKey?: string; ikon?: string; marka?: string; ua: string }[] = [
  { ad: "Chrome", adKey: "klab.ua.chrome", ikon: "🌐", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
  { ad: "python-requests", marka: "python", ua: "python-requests/2.31.0" },
  { ad: "GPTBot", ikon: "🤖", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot" },
  { ad: "ClaudeBot", ikon: "📘", ua: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
  { ad: "Headless Chrome", adKey: "klab.ua.headless", ikon: "👻", ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36" },
  { ad: "curl", marka: "curl", ua: "curl/8.4.0" },
];

/** Toplu test senaryoları — her biri simulate'ten geçirilir. */
interface Senaryo {
  key: string;
  adKey: string;
  aciklamaKey: string;
  istek: Partial<Istek>;
}
const SENARYOLAR: Senaryo[] = [
  {
    key: "temiz",
    adKey: "klab.senaryo.temiz.ad",
    aciklamaKey: "klab.senaryo.temiz.aciklama",
    istek: { ip: "88.230.10.5", country: "TR", asn: "AS9121 Turk Telekom", ua: UA_KALIPLAR[0].ua, path: "/", score: 0.94, botClass: "human", headless: false, tlsMismatch: false, rate: 3, httpVersion: "h2" },
  },
  {
    key: "python",
    adKey: "klab.senaryo.python.ad",
    aciklamaKey: "klab.senaryo.python.aciklama",
    istek: { ip: "45.79.12.88", country: "US", asn: "AS63949 Akamai Linode", ua: UA_KALIPLAR[1].ua, path: "/api/data", score: 0.12, botClass: "scraper", headless: false, tlsMismatch: true, rate: 40, httpVersion: "http/1.1" },
  },
  {
    key: "gptbot",
    adKey: "klab.senaryo.gptbot.ad",
    aciklamaKey: "klab.senaryo.gptbot.aciklama",
    istek: { ip: "20.171.207.10", country: "US", asn: "AS8075 Microsoft Azure", ua: UA_KALIPLAR[2].ua, path: "/blog", score: 0.5, botClass: "ai_agent", headless: false, tlsMismatch: false, rate: 8, httpVersion: "h2" },
  },
  {
    key: "kimlik",
    adKey: "klab.senaryo.kimlik.ad",
    aciklamaKey: "klab.senaryo.kimlik.aciklama",
    istek: { ip: "185.220.101.7", country: "RU", asn: "AS200019 AlexHost", ua: UA_KALIPLAR[5].ua, path: "/login", score: 0.05, botClass: "credential_stuffing", headless: false, tlsMismatch: true, rate: 120, httpVersion: "http/1.1" },
  },
  {
    key: "headless",
    adKey: "klab.senaryo.headless.ad",
    aciklamaKey: "klab.senaryo.headless.aciklama",
    istek: { ip: "3.120.55.201", country: "DE", asn: "AS16509 Amazon AWS", ua: UA_KALIPLAR[4].ua, path: "/urunler", score: 0.2, botClass: "automation", headless: true, tlsMismatch: true, rate: 25, httpVersion: "h2" },
  },
  {
    key: "ddos",
    adKey: "klab.senaryo.ddos.ad",
    aciklamaKey: "klab.senaryo.ddos.aciklama",
    istek: { ip: "103.152.36.44", country: "VN", asn: "AS0 Unknown", ua: UA_KALIPLAR[5].ua, path: "/", score: 0.02, botClass: "ddos", headless: false, tlsMismatch: false, rate: 900, httpVersion: "http/1.1" },
  },
];

/* ------------------------------------------------------------------ Aksiyon görselleri */

// adKey = aksiyon etiketi i18n anahtarı (etiket t() ile çözülür); ton/renk/ikon görsel sabit.
const ACTION_META: Record<RuleAction, { adKey: string; renk: string; bg: string; ring: string; ikon: React.ReactNode; ton: "yesil" | "sari" | "kirmizi" | "mavi" }> = {
  allow: { adKey: "klab.aksiyon.allow", renk: "#16a34a", bg: "bg-ok-soft", ring: "ring-green-200", ikon: <ShieldCheck className="size-full" />, ton: "yesil" },
  challenge: { adKey: "klab.aksiyon.challenge", renk: "#d97706", bg: "bg-warn-soft", ring: "ring-amber-200", ikon: <ShieldAlert className="size-full" />, ton: "sari" },
  block: { adKey: "klab.aksiyon.block", renk: "#dc2626", bg: "bg-danger-soft", ring: "ring-red-200", ikon: <ShieldX className="size-full" />, ton: "kirmizi" },
  flag: { adKey: "klab.aksiyon.flag", renk: "#2f6fed", bg: "bg-blue-50", ring: "ring-blue-200", ikon: <Flag className="size-full" />, ton: "mavi" },
};

/* ------------------------------------------------------------------ İz durumu */
type IzDurum = "eslesti" | "eslesmedi" | "kesildi" | "pasif";

/** Bir kuralın istekteki değerlendirme sonucu (adım adım iz). */
interface IzSatir {
  kural: LabKural;
  durum: IzDurum;
  /** Bu kural nihai kararı verdi mi. */
  kararVerdi: boolean;
}

/**
 * Değerlendirme izini üretir: kuralları GERÇEK motorla (ruleMatches) sırayla
 * dener. İlk TERMINAL (flag olmayan) eşleşme kararı verir; ondan sonraki
 * kurallar "kesildi" (kısa-devre) sayılır. flag eşleşmeleri akışı durdurmaz.
 *
 * ctx: türetilmiş sinyalleri (aiAgentId/headless/tls/httpVersion) simulate
 * yanıtından alır ki motorla birebir aynı sonucu versin.
 */
function iziUret(kurallar: LabKural[], ctx: RequestContext): IzSatir[] {
  // Yalnızca aktif kurallar, öncelik artan (motorla aynı sıralama).
  const aktif = kurallar.filter((k) => k.enabled).sort((a, b) => a.priority - b.priority);
  const pasif = kurallar.filter((k) => !k.enabled);

  const iz: IzSatir[] = [];
  let kararVerildi = false;

  for (const k of aktif) {
    if (kararVerildi) {
      // Terminal karardan sonra: kısa-devre — değerlendirilmedi.
      iz.push({ kural: k, durum: "kesildi", kararVerdi: false });
      continue;
    }
    const eslesti = ruleMatches(ctx, k as unknown as Parameters<typeof ruleMatches>[1]);
    if (eslesti) {
      const terminal = k.action !== "flag";
      iz.push({ kural: k, durum: "eslesti", kararVerdi: terminal });
      if (terminal) kararVerildi = true; // ilk terminal karar akışı bitirir
    } else {
      iz.push({ kural: k, durum: "eslesmedi", kararVerdi: false });
    }
  }

  // Pasif kurallar en sona (motor bunları hiç değerlendirmez).
  for (const k of pasif) iz.push({ kural: k, durum: "pasif", kararVerdi: false });
  return iz;
}

/** Kuralın koşulunu insan-okur metne çevirir (grup varsa özet, yoksa tekil). */
function kuralOzet(k: LabKural): string {
  if (k.kosulGrup) return grupOzet(k.kosulGrup);
  return `${FIELD_ETIKET[k.field]} ${OP_ETIKET[k.op]} "${k.value}"`;
}

/* ================================================================== Bileşen */

export function KuralLabIstemci({
  dil,
  siteler,
  varsayilanSiteId,
  varsayilanKurallar,
}: {
  dil: Dil;
  siteler: Site[];
  varsayilanSiteId: string;
  varsayilanKurallar: LabKural[];
}) {
  const { goster } = useToast();
  const t = (anahtar: string) => kuralLabCeviri(anahtar, dil);

  const [siteId, setSiteId] = useState(varsayilanSiteId);
  const [kurallar, setKurallar] = useState<LabKural[]>(varsayilanKurallar);
  const [istek, setIstek] = useState<Istek>({
    ip: "45.79.12.88",
    country: "US",
    asn: "AS63949 Akamai Linode",
    ua: UA_KALIPLAR[1].ua,
    path: "/api/data",
    score: 0.15,
    botClass: "scraper",
    headless: false,
    tlsMismatch: true,
    rate: 40,
    httpVersion: "http/1.1",
  });

  const [yanit, setYanit] = useState<SimYanit | null>(null);
  const [degerleniyor, setDegerleniyor] = useState(false);
  const [otoDegerle, setOtoDegerle] = useState(true);

  // Toplu test durumu.
  const [topluSonuc, setTopluSonuc] = useState<Record<string, SimYanit | "hata" | null>>({});
  const [topluCalisiyor, setTopluCalisiyor] = useState(false);

  const guncelSite = siteler.find((s) => s.id === siteId);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://veylify.com";

  /* ---- alan güncelleme yardımcısı ---- */
  const alan = useCallback(<K extends keyof Istek>(k: K, v: Istek[K]) => {
    setIstek((p) => ({ ...p, [k]: v }));
  }, []);

  /* ---- site değişince o sitenin kurallarını çek ---- */
  useEffect(() => {
    // İlk yüklemede varsayılan siteyi tekrar çekmeye gerek yok (sunucu verdi).
    if (siteId === varsayilanSiteId) {
      setKurallar(varsayilanKurallar);
      return;
    }
    let iptal = false;
    (async () => {
      try {
        const res = await fetch(`/api/kural-lab/rules?siteId=${encodeURIComponent(siteId)}`);
        const data = await res.json();
        if (!iptal && Array.isArray(data.kurallar)) setKurallar(data.kurallar as LabKural[]);
      } catch {
        if (!iptal) goster({ tip: "hata", baslik: t("klab.toast.kuralSetiAlinamadi") });
      }
    })();
    return () => { iptal = true; };
  }, [siteId, varsayilanSiteId, varsayilanKurallar, goster]);

  /* ---- tek istek değerlendirme (simulate) ---- */
  const degerlendir = useCallback(async () => {
    if (!siteId) return;
    setDegerleniyor(true);
    try {
      const res = await fetch(`/api/rules/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, ...istek }),
      });
      const data = await res.json();
      if (res.ok) setYanit(data as SimYanit);
      else { setYanit(null); goster({ tip: "hata", baslik: t("klab.toast.degerlendirmeBasarisiz"), aciklama: data?.error }); }
    } catch {
      setYanit(null);
      goster({ tip: "hata", baslik: t("klab.toast.baglantiHatasi") });
    }
    setDegerleniyor(false);
  }, [siteId, istek, goster]);

  /* ---- oto-değerlendirme (debounce) ---- */
  const ilkRef = useRef(true);
  useEffect(() => {
    if (!otoDegerle) return;
    const t = setTimeout(() => { degerlendir(); }, ilkRef.current ? 0 : 380);
    ilkRef.current = false;
    return () => clearTimeout(t);
    // istek/siteId/kurallar değişince yeniden değerlendir
  }, [otoDegerle, degerlendir, kurallar]);

  /* ---- değerlendirme izi (yanıttaki türetilmiş sinyallerle) ---- */
  const iz = useMemo<IzSatir[]>(() => {
    // Motorla birebir aynı olsun diye türetilmiş sinyalleri simulate yanıtından
    // al; yoksa (henüz değerlendirilmediyse) kaba istemci varsayımlarını kullan.
    const s = yanit?.sinyaller;
    const ctx: RequestContext = {
      ip: istek.ip,
      country: istek.country,
      asn: istek.asn,
      ua: istek.ua,
      path: istek.path,
      score: istek.score,
      botClass: istek.botClass,
      rate: istek.rate,
      aiAgentId: s?.aiAgentId ?? "",
      aiCategory: s?.aiCategory ?? "",
      headless: s ? s.headless : istek.headless,
      tlsUaUyumsuz: s ? s.tlsUaUyumsuz : istek.tlsMismatch,
      httpVersion: s ? s.httpVersion : istek.httpVersion,
    };
    return iziUret(kurallar, ctx);
  }, [kurallar, istek, yanit]);

  const aktifSayi = useMemo(() => kurallar.filter((k) => k.enabled).length, [kurallar]);
  const eslesenSayi = iz.filter((s) => s.durum === "eslesti").length;
  const kesilenSayi = iz.filter((s) => s.durum === "kesildi").length;

  /* ---- toplu test ---- */
  const topluCalistir = useCallback(async () => {
    if (!siteId) return;
    setTopluCalisiyor(true);
    setTopluSonuc(Object.fromEntries(SENARYOLAR.map((s) => [s.key, null])));
    // Her senaryoyu simulate'ten geçir (paralel).
    const girisler = await Promise.all(
      SENARYOLAR.map(async (sen) => {
        try {
          const res = await fetch(`/api/rules/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId, ...sen.istek }),
          });
          const data = await res.json();
          return [sen.key, res.ok ? (data as SimYanit) : "hata"] as const;
        } catch {
          return [sen.key, "hata"] as const;
        }
      }),
    );
    setTopluSonuc(Object.fromEntries(girisler));
    setTopluCalisiyor(false);
    goster({ tip: "basari", baslik: t("klab.toast.topluTamamlandi"), aciklama: t("klab.toast.topluTamamlandiAlt").replace("{n}", String(SENARYOLAR.length)) });
  }, [siteId, goster]);

  /* ---- bir senaryoyu bestecinin içine yükle ---- */
  const senaryoYukle = useCallback((sen: Senaryo) => {
    setIstek((p) => ({ ...p, ...sen.istek }));
    goster({ tip: "bilgi", baslik: t("klab.toast.senaryoYuklendi").replace("{ad}", t(sen.adKey)) });
  }, [goster]);

  /* ---- paylaşılabilir snippet ---- */
  const govde = useMemo(() => ({
    siteId,
    ip: istek.ip, country: istek.country, asn: istek.asn, ua: istek.ua, path: istek.path,
    score: istek.score, botClass: istek.botClass, headless: istek.headless,
    tlsMismatch: istek.tlsMismatch, rate: istek.rate, httpVersion: istek.httpVersion,
  }), [siteId, istek]);

  const curlKod = useMemo(() =>
    `curl -X POST ${origin}/api/rules/simulate \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(govde)}'`,
    [origin, govde]);
  const jsonKod = useMemo(() => JSON.stringify(govde, null, 2), [govde]);

  const [snippetTur, setSnippetTur] = useState<"curl" | "json">("curl");

  const sifirla = useCallback(() => {
    setIstek({
      ip: "1.2.3.4", country: "TR", asn: "AS0 Unknown", ua: "Mozilla/5.0",
      path: "/", score: 0.5, botClass: "human", headless: false, tlsMismatch: false, rate: 0, httpVersion: "h2",
    });
    goster({ tip: "bilgi", baslik: t("klab.toast.besteciSifirlandi") });
  }, [goster]);

  const nihai = yanit ? ACTION_META[yanit.action] : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("klab.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {(() => {
              // {b}…{/b} işaretlerini <b> ile parçala (native, XSS'siz).
              const parcalar = t("klab.intro.aciklama").split(/\{b\}|\{\/b\}/);
              return parcalar.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>));
            })()}
          </p>
        </div>
      </div>

      {/* üst özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={nihai ? t(nihai.adKey) : "—"}
          etiket={t("klab.ozet.nihaiKarar")}
          ikon={<span style={{ color: nihai?.renk }}><Zap className="size-5" /></span>}
          tone={yanit?.action === "block" ? "danger" : yanit?.action === "allow" ? "ok" : yanit?.action === "challenge" ? "warn" : "brand"}
        />
        <StatKart sayi={aktifSayi} etiket={t("klab.ozet.aktifKural")} ikon={<ListChecks className="size-5" />} />
        <StatKart sayi={eslesenSayi} etiket={t("klab.ozet.eslesenKural")} tone={eslesenSayi > 0 ? "warn" : "ok"} ikon={<CheckCircle2 className="size-5" />} />
        <StatKart sayi={kesilenSayi} etiket={t("klab.ozet.kisaDevre")} ikon={<MinusCircle className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ============================ SOL: İstek besteci ============================ */}
        <Panel baslik={<span className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" /> {t("klab.besteci.baslik")}</span>}
          sagUst={<Button variant="ghost" size="sm" onClick={sifirla}><RotateCcw className="size-3.5" /> {t("klab.besteci.sifirla")}</Button>}>
          {/* site */}
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-ink">{t("klab.besteci.site")}</label>
          <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mb-4">
            {siteler.length === 0 && <option value="">{t("klab.besteci.siteYok")}</option>}
            {siteler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </Secim>

          {/* UA kalıp çipleri */}
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-ink">{t("klab.besteci.uaKalip")}</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {UA_KALIPLAR.map((u) => (
              <button
                key={u.ad}
                onClick={() => alan("ua", u.ua)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition",
                  istek.ua === u.ua ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong hover:text-slate-ink",
                )}
              >
                {u.marka ? <MarkaLogo ad={u.marka} size={14} /> : <span>{u.ikon}</span>} {u.adKey ? t(u.adKey) : u.ad}
              </button>
            ))}
          </div>
          <textarea
            value={istek.ua}
            onChange={(e) => alan("ua", e.target.value)}
            rows={2}
            className="mb-4 w-full rounded-2xl border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-[12px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />

          {/* IP / path */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Server className="size-3.5 text-slate-faint" /> {t("klab.besteci.ip")}</label>
              <input value={istek.ip} onChange={(e) => alan("ip", e.target.value)} className="h-10 w-full rounded-2xl border border-line-strong bg-surface px-3.5 font-mono text-[13px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-ink">{t("klab.besteci.yol")}</label>
              <input value={istek.path} onChange={(e) => alan("path", e.target.value)} className="h-10 w-full rounded-2xl border border-line-strong bg-surface px-3.5 font-mono text-[13px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
          </div>

          {/* ülke / ASN */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Globe className="size-3.5 text-slate-faint" /> {t("klab.besteci.ulke")}</label>
              <Secim value={istek.country} onChange={(e) => alan("country", e.target.value)} className="h-10">
                {ULKELER.map((u) => <option key={u.kod} value={u.kod}>{u.kod} — {t(u.adKey)}</option>)}
              </Secim>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-ink">{t("klab.besteci.asn")}</label>
              <input value={istek.asn} onChange={(e) => alan("asn", e.target.value)} className="h-10 w-full rounded-2xl border border-line-strong bg-surface px-3.5 text-[13px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
          </div>

          {/* skor slider */}
          <div className="mb-4">
            <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-slate-ink">
              <span>{t("klab.besteci.skor")}</span>
              <span className="num rounded-md bg-canvas px-2 py-0.5 text-[12px]" style={{ color: istek.score < 0.2 ? "#dc2626" : istek.score < 0.45 ? "#d97706" : "#16a34a" }}>{istek.score.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={1} step={0.01} value={istek.score} onChange={(e) => alan("score", Number(e.target.value))} className="w-full accent-brand-600" />
            <div className="mt-1 flex justify-between text-[10px] text-slate-faint"><span>{t("klab.besteci.skorSol")}</span><span>{t("klab.besteci.skorSag")}</span></div>
          </div>

          {/* bot sınıfı / rate */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Bot className="size-3.5 text-slate-faint" /> {t("klab.besteci.botSinifi")}</label>
              <Secim value={istek.botClass} onChange={(e) => alan("botClass", e.target.value as BotClass)} className="h-10">
                {BOT_SINIFLARI.map((b) => <option key={b.kod} value={b.kod}>{t(b.adKey)}</option>)}
              </Secim>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Gauge className="size-3.5 text-slate-faint" /> {t("klab.besteci.hiz")}</label>
              <input type="number" min={0} value={istek.rate} onChange={(e) => alan("rate", Number(e.target.value))} className="h-10 w-full rounded-2xl border border-line-strong bg-surface px-3.5 num text-[13px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
          </div>

          {/* HTTP sürümü */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-ink">{t("klab.besteci.httpSurum")}</label>
            <div className="flex gap-1.5">
              {HTTP_SURUMLERI.map((h) => (
                <button key={h} onClick={() => alan("httpVersion", h)} className={cn("rounded-xl border px-3 py-1.5 text-[12px] font-medium transition", istek.httpVersion === h ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong")}>{h}</button>
              ))}
            </div>
          </div>

          {/* toggle'lar */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Anahtar etiket={t("klab.besteci.headless")} ikon={<Fingerprint className="size-3.5" />} acik={istek.headless} onToggle={() => alan("headless", !istek.headless)} />
            <Anahtar etiket={t("klab.besteci.tlsUyumsuz")} ikon={<Fingerprint className="size-3.5" />} acik={istek.tlsMismatch} onToggle={() => alan("tlsMismatch", !istek.tlsMismatch)} />
          </div>

          {/* değerlendir + oto */}
          <div className="flex items-center gap-3">
            <button onClick={degerlendir} disabled={degerleniyor || !siteId} className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl bg-ink-900 text-[14px] font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50">
              {degerleniyor ? t("klab.besteci.degerleniyor") : <><Play className="size-4" /> {t("klab.besteci.degerlendir")}</>}
            </button>
            <button onClick={() => setOtoDegerle((v) => !v)} className={cn("flex h-[46px] items-center gap-2 rounded-2xl border px-4 text-[13px] font-medium transition", otoDegerle ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-slate-muted")}>
              <span className={cn("size-2 rounded-full", otoDegerle ? "bg-brand-600" : "bg-slate-300")} /> {t("klab.besteci.oto")}
            </button>
          </div>
        </Panel>

        {/* ============================ SAĞ: Canlı değerlendirme + iz ============================ */}
        <div className="space-y-6">
          {/* nihai karar kartı */}
          <Panel padding>
            {!yanit ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FlaskConical className="mb-3 size-8 text-slate-faint" />
                <p className="text-sm text-slate-muted">{t("klab.karar.bosDurum")}</p>
              </div>
            ) : (
              <>
                <div className={cn("flex items-center gap-4 rounded-2xl p-5 ring-1", nihai!.bg, nihai!.ring)}>
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl p-3 text-white" style={{ background: nihai!.renk }}>
                    <span className="size-8">{nihai!.ikon}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{t("klab.karar.nihaiKarar")}</div>
                    <div className="text-[26px] font-bold leading-tight" style={{ color: nihai!.renk }}>{t(nihai!.adKey)}</div>
                    <div className="mt-0.5 text-[13px] text-slate-muted">
                      {yanit.decidedBy
                        ? <>{t("klab.karar.kararVeren")}<b className="text-slate-ink">{yanit.decidedBy.ruleName}</b></>
                        : <>{t("klab.karar.kuralEslesmedi")}</>}
                    </div>
                  </div>
                </div>

                {/* özet rakamlar */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-line bg-canvas/40 py-3">
                    <div className="num text-[20px] font-bold text-slate-ink">{yanit.evaluated}</div>
                    <div className="text-[11px] text-slate-muted">{t("klab.karar.aktifKural")}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 py-3">
                    <div className="num text-[20px] font-bold text-slate-ink">{yanit.matched.length}</div>
                    <div className="text-[11px] text-slate-muted">{t("klab.karar.eslesen")}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 py-3">
                    <div className="num text-[20px] font-bold text-slate-ink">{yanit.matched.filter((m) => m.action === "flag").length}</div>
                    <div className="text-[11px] text-slate-muted">{t("klab.karar.isaret")}</div>
                  </div>
                </div>

                {/* eşleşen kurallar */}
                {yanit.matched.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("klab.karar.eslesenKurallar")}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {yanit.matched.map((m) => (
                        <Badge key={m.ruleId} ton={ACTION_META[m.action].ton}>
                          {m.ruleName} · {ACTION_ETIKET[m.action]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* türetilen sinyaller */}
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("klab.karar.turetilenSinyaller")}</div>
                  <div className="grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-3">
                    <Sinyal etiket={t("klab.sinyal.aiAjani")} deger={yanit.sinyaller.aiAgentId || "—"} vurgu={!!yanit.sinyaller.aiAgentId} />
                    <Sinyal etiket={t("klab.sinyal.aiKategori")} deger={yanit.sinyaller.aiCategory || "—"} />
                    <Sinyal etiket={t("klab.sinyal.headless")} deger={yanit.sinyaller.headless ? t("klab.sinyal.evet") : t("klab.sinyal.hayir")} vurgu={yanit.sinyaller.headless} />
                    <Sinyal etiket={t("klab.sinyal.tlsUyumsuz")} deger={yanit.sinyaller.tlsUaUyumsuz ? t("klab.sinyal.evet") : t("klab.sinyal.hayir")} vurgu={yanit.sinyaller.tlsUaUyumsuz} />
                    <Sinyal etiket={t("klab.sinyal.http")} deger={yanit.sinyaller.httpVersion} />
                  </div>
                </div>
              </>
            )}
          </Panel>

          {/* değerlendirme izi */}
          <Panel baslik={<span className="flex items-center gap-2"><Layers className="size-4 text-brand-600" /> {t("klab.iz.baslik")}</span>}
            sagUst={<span className="text-[12px] text-slate-muted">{(() => { const p = t("klab.iz.sagUst").split(/\{b\}|\{\/b\}/); return p.map((x, i) => (i % 2 === 1 ? <b key={i}>{x}</b> : <span key={i}>{x}</span>)); })()}</span>}>
            {iz.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-faint">{t("klab.iz.kuralYok")}</p>
            ) : (
              <ol className="space-y-1.5">
                {iz.map((s, i) => <IzKarti key={s.kural.id} sira={i + 1} satir={s} t={t} />)}
              </ol>
            )}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-[11px] text-slate-muted">
              <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-ok" /> {t("klab.iz.lejant.eslesti")}</span>
              <span className="flex items-center gap-1"><XCircle className="size-3.5 text-slate-faint" /> {t("klab.iz.lejant.eslesmedi")}</span>
              <span className="flex items-center gap-1"><MinusCircle className="size-3.5 text-slate-300" /> {t("klab.iz.lejant.kesildi")}</span>
              <span className="flex items-center gap-1"><Zap className="size-3.5 text-brand-600" /> {t("klab.iz.lejant.kararVerildi")}</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* ============================ Toplu test ============================ */}
      <Panel baslik={<span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-600" /> {t("klab.toplu.baslik")}</span>}
        sagUst={<Button size="sm" onClick={topluCalistir} disabled={topluCalisiyor || !siteId}><Play className="size-4" /> {topluCalisiyor ? t("klab.toplu.calisiyor") : t("klab.toplu.tumunuCalistir")}</Button>}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("klab.toplu.aciklama").replace("{n}", String(SENARYOLAR.length))}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
                <th className="px-4 py-2.5 font-semibold">{t("klab.toplu.kol.senaryo")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("klab.toplu.kol.karar")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("klab.toplu.kol.kararVeren")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("klab.toplu.kol.eslesen")}</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {SENARYOLAR.map((sen) => {
                const r = topluSonuc[sen.key];
                const meta = r && r !== "hata" ? ACTION_META[r.action] : null;
                return (
                  <tr key={sen.key} className="border-b border-line last:border-0 transition hover:bg-canvas/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-ink">{t(sen.adKey)}</div>
                      <div className="text-[12px] text-slate-muted">{t(sen.aciklamaKey)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r === "hata" ? <span className="text-[12px] text-danger2">{t("klab.toplu.hata")}</span>
                        : r == null ? <span className="text-[12px] text-slate-faint">{topluCalisiyor ? "…" : "—"}</span>
                        : <Badge ton={meta!.ton}>{t(meta!.adKey)}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-muted">
                      {r && r !== "hata" ? (r.decidedBy?.ruleName ?? <span className="text-slate-faint">{t("klab.toplu.otomatik")}</span>) : "—"}
                    </td>
                    <td className="px-4 py-3 num text-[13px] text-slate-ink">
                      {r && r !== "hata" ? r.matched.length : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => senaryoYukle(sen)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-brand-700 transition hover:bg-brand-50">
                        {t("klab.toplu.yukle")} <ChevronRight className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ============================ Paylaşılabilir istek ============================ */}
      <Panel baslik={<span className="flex items-center gap-2"><Terminal className="size-4 text-brand-600" /> {t("klab.snippet.baslik")}</span>}
        sagUst={
          <div className="flex items-center gap-1 rounded-xl bg-canvas p-1">
            {(["curl", "json"] as const).map((tur) => (
              <button key={tur} onClick={() => setSnippetTur(tur)} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", snippetTur === tur ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted")}>
                {tur === "curl" ? "cURL" : "JSON"}
              </button>
            ))}
          </div>
        }>
        <p className="mb-3 text-[13px] text-slate-muted">
          {(() => {
            // {kod} yerine mono uç nokta göster (native).
            const p = t("klab.snippet.aciklama").split("{kod}");
            return <>{p[0]}<span className="font-mono text-[12px]">POST /api/rules/simulate</span>{p[1] ?? ""}</>;
          })()}
        </p>
        <KodBlok kod={snippetTur === "curl" ? curlKod : jsonKod} dil={snippetTur === "curl" ? "bash" : "json"} baslik={snippetTur === "curl" ? "cURL" : t("klab.snippet.istekGovdesi")} />
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(snippetTur === "curl" ? curlKod : jsonKod); goster({ tip: "basari", baslik: t("klab.toast.kopyalandi") }); }}>
            <Copy className="size-4" /> {t("klab.snippet.kopyala")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Alt bileşenler */

/** Küçük aç/kapa anahtarı. */
function Anahtar({ etiket, ikon, acik, onToggle }: { etiket: string; ikon: React.ReactNode; acik: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn("flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition", acik ? "border-brand-400 bg-brand-50" : "border-line hover:border-line-strong")}>
      <span className={cn("flex items-center gap-1.5 text-[13px] font-medium", acik ? "text-brand-700" : "text-slate-muted")}>{ikon} {etiket}</span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition", acik ? "bg-brand-600" : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-all", acik ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

/** Türetilen sinyal rozeti. */
function Sinyal({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", vurgu ? "border-danger-soft bg-danger-soft/40" : "border-line bg-canvas/40")}>
      <div className="text-[10px] uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className={cn("mt-0.5 truncate font-mono text-[12px] font-medium", vurgu ? "text-danger2" : "text-slate-ink")}>{deger}</div>
    </div>
  );
}

/** Değerlendirme izinin tek satırı (kural kartı). */
function IzKarti({ sira, satir, t }: { sira: number; satir: IzSatir; t: Ceviri }) {
  const { kural, durum, kararVerdi } = satir;
  const durumMeta: Record<IzDurum, { ikon: React.ReactNode; renk: string; kenar: string }> = {
    eslesti: { ikon: <CheckCircle2 className="size-4" />, renk: "text-ok", kenar: kararVerdi ? "border-brand-300 bg-brand-50/50 ring-1 ring-brand-200" : "border-green-200 bg-ok-soft/40" },
    eslesmedi: { ikon: <XCircle className="size-4" />, renk: "text-slate-faint", kenar: "border-line bg-surface" },
    kesildi: { ikon: <MinusCircle className="size-4" />, renk: "text-slate-300", kenar: "border-dashed border-line bg-canvas/30 opacity-70" },
    pasif: { ikon: <MinusCircle className="size-4" />, renk: "text-slate-300", kenar: "border-line bg-canvas/20 opacity-60" },
  };
  const m = durumMeta[durum];
  const am = ACTION_META[kural.action];
  return (
    <li className={cn("flex items-start gap-3 rounded-xl border px-3.5 py-2.5 transition", m.kenar)}>
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-canvas text-[11px] font-bold text-slate-faint num">{sira}</span>
      <span className={cn("mt-0.5 shrink-0", m.renk)}>{m.ikon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-[13px] font-semibold", durum === "kesildi" || durum === "pasif" ? "text-slate-muted line-through decoration-slate-300" : "text-slate-ink")}>{kural.ad}</span>
          <Badge ton={am.ton}>{ACTION_ETIKET[kural.action]}</Badge>
          {kararVerdi && <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white"><Zap className="size-3" /> {t("klab.iz.karar")}</span>}
          {kural.system && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{t("klab.iz.sistem")}</span>}
        </div>
        <div className="mt-0.5 font-mono text-[11.5px] text-slate-muted">{kuralOzet(kural)}</div>
        {durum === "kesildi" && <div className="mt-0.5 text-[11px] text-slate-faint">{t("klab.iz.kesildiAcik")}</div>}
        {durum === "pasif" && <div className="mt-0.5 text-[11px] text-slate-faint">{t("klab.iz.pasifAcik")}</div>}
      </div>
    </li>
  );
}
