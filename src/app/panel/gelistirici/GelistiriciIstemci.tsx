"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Key, Plus, Webhook, Terminal, Copy, Code, Braces, Book, Zap,
  Send, Check, ChevronRight, Activity, Package, TrendingUp,
  Radio, AlertTriangle, Server, Globe,
} from "lucide-react";
import {
  PanelBaslik, Panel, StatKart, Badge, Modal, Alan, Girdi, Secim, BosDurum,
  SatirMenu, useToast, NotKutusu, KodBlok, Tooltip, DurumRozeti,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim, SkorCubugu, MiniSpark } from "@/components/panel/grafikler";
import { Histogram, IsiMatris, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { gelCeviri } from "./gelistirici.i18n";

/** Çeviri yardımcısı tipi — alt bileşenlere geçirilir. */
type CevirFn = (anahtar: string) => string;

/* ================================================================== Tipler */

interface Token {
  id: string; name: string; prefix: string; scopes: string[];
  environment: "live" | "test"; lastUsed: number | null; requests30d: number;
  revoked: boolean; createdAt: number;
}
interface Delivery {
  id: string; event: string; status: number; ts: number; attempt: number; durationMs: number;
}
interface Wh {
  id: string; siteId: string; siteName: string; url: string; events: string[];
  active: boolean; secret: string; createdAt: number; lastDelivery: number | null;
  lastStatus: number | null; deliveries: Delivery[];
}
interface SiteLite { id: string; name: string; siteKey: string }
interface IstekKaydi {
  id: string; endpoint: string; method: string; status: number;
  latency: number; ts: number; ip: string; country: string;
}
interface Ozet {
  aktifAnahtar: number; aylikCagri: number; teslimOrani: number;
  ortLatency: number; webhookSayi: number;
}

type Sekme = "anahtarlar" | "webhooks" | "olaylar" | "referans" | "sdklar";

/* ================================================================== Sabit veri */

// ad → i18n anahtarı (sekme etiketi çevrilir; key enum değeridir, çevrilmez).
const SEKMELER: { key: Sekme; adKey: string; ikon: React.ReactNode }[] = [
  { key: "anahtarlar", adKey: "gel.sekme.anahtarlar", ikon: <Key className="size-4" /> },
  { key: "webhooks", adKey: "gel.sekme.webhooks", ikon: <Webhook className="size-4" /> },
  { key: "olaylar", adKey: "gel.sekme.olaylar", ikon: <Activity className="size-4" /> },
  { key: "referans", adKey: "gel.sekme.referans", ikon: <Book className="size-4" /> },
  { key: "sdklar", adKey: "gel.sekme.sdklar", ikon: <Package className="size-4" /> },
];

/**
 * Oluşturma modalında sunulan kapsam (scope) seçenekleri.
 * `key` API scope değeridir (verify, analytics:read…) → ASLA çevrilmez, ekranda
 * ad olarak da bu ham değer gösterilir. Yalnızca `aciklamaKey` çevrilir.
 */
const SCOPE_SECENEK: { key: string; aciklamaKey: string }[] = [
  { key: "verify", aciklamaKey: "gel.scope.verify.aciklama" },
  { key: "siteverify", aciklamaKey: "gel.scope.siteverify.aciklama" },
  { key: "analytics:read", aciklamaKey: "gel.scope.analytics.aciklama" },
  { key: "sites:read", aciklamaKey: "gel.scope.sites.aciklama" },
  { key: "rules:write", aciklamaKey: "gel.scope.rules.aciklama" },
];

/**
 * Abone olunabilir webhook olay kataloğu.
 * `key` webhook olay TÜR değeridir (verification.passed…) → VERİDİR, çevrilmez.
 * `payload` örnek JSON'dur → VERİDİR, çevrilmez. Yalnızca `adKey`/`aciklamaKey`
 * çeviriye referans verir.
 */
const OLAY_KATALOG: { key: string; adKey: string; aciklamaKey: string; payload: string }[] = [
  {
    key: "verification.passed", adKey: "gel.olayk.passed.ad",
    aciklamaKey: "gel.olayk.passed.aciklama",
    payload: `{
  "type": "verification.passed",
  "id": "evt_9f2a...",
  "created": 1721040000,
  "site_key": "pk_live_a1b2...",
  "data": {
    "cid": "cid_7c1e...",
    "score": 0.94,
    "invisible": true,
    "ip": "88.240.12.6",
    "country": "TR"
  }
}`,
  },
  {
    key: "verification.failed", adKey: "gel.olayk.failed.ad",
    aciklamaKey: "gel.olayk.failed.aciklama",
    payload: `{
  "type": "verification.failed",
  "id": "evt_3b8c...",
  "created": 1721040120,
  "site_key": "pk_live_a1b2...",
  "data": {
    "reason": "low_behavior_score",
    "score": 0.11,
    "ip": "45.155.205.211",
    "country": "RU"
  }
}`,
  },
  {
    key: "bot.blocked", adKey: "gel.olayk.blocked.ad",
    aciklamaKey: "gel.olayk.blocked.aciklama",
    payload: `{
  "type": "bot.blocked",
  "id": "evt_a4d1...",
  "created": 1721040300,
  "site_key": "pk_live_a1b2...",
  "data": {
    "bot_class": "credential_stuffing",
    "rule": "Kimlik doldurma koruması",
    "ip": "45.155.205.211",
    "asn": "AS200651 Flokinet",
    "path": "/login"
  }
}`,
  },
  {
    key: "ai_agent.detected", adKey: "gel.olayk.aidetected.ad",
    aciklamaKey: "gel.olayk.aidetected.aciklama",
    payload: `{
  "type": "ai_agent.detected",
  "id": "evt_f0c9...",
  "created": 1721040400,
  "site_key": "pk_live_a1b2...",
  "data": {
    "agent": "GPTBot",
    "operator": "OpenAI",
    "category": "model_egitimi",
    "policy": "dogrula",
    "path": "/api/graphql"
  }
}`,
  },
  {
    key: "campaign.started", adKey: "gel.olayk.campaign.ad",
    aciklamaKey: "gel.olayk.campaign.aciklama",
    payload: `{
  "type": "campaign.started",
  "id": "evt_11ab...",
  "created": 1721040500,
  "site_key": "pk_live_a1b2...",
  "data": {
    "campaign_id": "camp_5e2f...",
    "bot_class": "ddos",
    "peak_rps": 8400,
    "top_countries": ["RU", "NL", "DE"]
  }
}`,
  },
  {
    key: "rule.triggered", adKey: "gel.olayk.rule.ad",
    aciklamaKey: "gel.olayk.rule.aciklama",
    payload: `{
  "type": "rule.triggered",
  "id": "evt_77de...",
  "created": 1721040600,
  "site_key": "pk_live_a1b2...",
  "data": {
    "rule_id": "rule_9a...",
    "rule_name": "Bilinen kötü ASN",
    "action": "challenge",
    "matched_field": "asn"
  }
}`,
  },
  {
    key: "quota.warning", adKey: "gel.olayk.quota.ad",
    aciklamaKey: "gel.olayk.quota.aciklama",
    payload: `{
  "type": "quota.warning",
  "id": "evt_c3f0...",
  "created": 1721040700,
  "data": {
    "used": 4500000,
    "limit": 5000000,
    "percent": 90
  }
}`,
  },
];

/**
 * Gerçek public endpoint'lerle uyumlu API referansı.
 * VERİ (çevrilmez): method, path, param `ad`/`tip`, curl, yanit (JSON), hata
 * `kod` (HTTP durum + sabit kod, ör. "400 siteKey gerekli"). ÇEVRİLİR: `ozetKey`,
 * `aciklamaKey`, param `aciklamaKey`, hata `aciklamaKey` (hepsi i18n referansı).
 */
interface UcParam { ad: string; tip: string; zorunlu: boolean; aciklamaKey: string }
interface UcHata { kod: string; aciklamaKey: string }
interface Uc {
  method: string; path: string; ozetKey: string; aciklamaKey: string;
  params: UcParam[]; curl: string; yanit: string; hatalar: UcHata[];
}
const ENDPOINTS: Uc[] = [
  {
    method: "POST", path: "/api/v1/challenge",
    ozetKey: "gel.uc.challenge.ozet",
    aciklamaKey: "gel.uc.challenge.aciklama",
    params: [{ ad: "siteKey", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.challenge.p.siteKey" }],
    curl: `curl -X POST https://api.veylify.com/api/v1/challenge \\
  -H "Content-Type: application/json" \\
  -d '{ "siteKey": "pk_live_a1b2c3..." }'`,
    yanit: `{
  "id": "cid_7c1e9f...",
  "params": { "seed": 48213, "length": 6, "difficulty": "medium" },
  "token": "eyJjaWQiOiJ...",
  "ttl": 120,
  "invisibleMode": true
}`,
    hatalar: [
      { kod: "400 siteKey gerekli", aciklamaKey: "gel.uc.challenge.h.400" },
      { kod: "403 Geçersiz veya pasif site anahtarı", aciklamaKey: "gel.uc.challenge.h.403" },
      { kod: "429 Çok fazla istek", aciklamaKey: "gel.uc.challenge.h.429" },
    ],
  },
  {
    method: "POST", path: "/api/v1/passive",
    ozetKey: "gel.uc.passive.ozet",
    aciklamaKey: "gel.uc.passive.aciklama",
    params: [
      { ad: "siteKey", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.passive.p.siteKey" },
      { ad: "signals", tip: "object", zorunlu: false, aciklamaKey: "gel.uc.passive.p.signals" },
    ],
    curl: `curl -X POST https://api.veylify.com/api/v1/passive \\
  -H "Content-Type: application/json" \\
  -d '{ "siteKey": "pk_live_a1b2c3...", "signals": { "pointerMoves": 42, "dwellMs": 3100 } }'`,
    yanit: `{
  "passed": true,
  "token": "eyJjaWQiOiJpbnZf...",
  "score": 0.91
}`,
    hatalar: [
      { kod: "400 siteKey gerekli", aciklamaKey: "gel.uc.passive.h.400" },
      { kod: "403 Geçersiz site anahtarı", aciklamaKey: "gel.uc.passive.h.403" },
      { kod: "200 { passed: false }", aciklamaKey: "gel.uc.passive.h.200" },
    ],
  },
  {
    method: "POST", path: "/api/v1/verify",
    ozetKey: "gel.uc.verify.ozet",
    aciklamaKey: "gel.uc.verify.aciklama",
    params: [
      { ad: "siteKey", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.verify.p.siteKey" },
      { ad: "token", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.verify.p.token" },
      { ad: "input", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.verify.p.input" },
      { ad: "signals", tip: "object", zorunlu: false, aciklamaKey: "gel.uc.verify.p.signals" },
    ],
    curl: `curl -X POST https://api.veylify.com/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "siteKey": "pk_live_a1b2c3...",
    "token": "eyJjaWQiOiJ...",
    "input": "A7K2QF",
    "signals": { "pointerMoves": 51, "dwellMs": 4200 }
  }'`,
    yanit: `{
  "success": true,
  "token": "eyJjaWQiOiJ2ZXJf...",
  "score": 0.88,
  "appliedRules": ["İyi botlara izin ver"]
}`,
    hatalar: [
      { kod: "400 Eksik alan", aciklamaKey: "gel.uc.verify.h.400" },
      { kod: "200 { success: false, reason: 'replay' }", aciklamaKey: "gel.uc.verify.h.replay" },
      { kod: "200 { success: false, reason: 'rule_block' }", aciklamaKey: "gel.uc.verify.h.ruleBlock" },
    ],
  },
  {
    method: "POST", path: "/api/v1/siteverify",
    ozetKey: "gel.uc.siteverify.ozet",
    aciklamaKey: "gel.uc.siteverify.aciklama",
    params: [
      { ad: "secret", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.siteverify.p.secret" },
      { ad: "response", tip: "string", zorunlu: true, aciklamaKey: "gel.uc.siteverify.p.response" },
    ],
    curl: `curl -X POST https://api.veylify.com/api/v1/siteverify \\
  -H "Content-Type: application/json" \\
  -d '{ "secret": "sk_live_...", "response": "eyJjaWQiOiJ2ZXJf..." }'`,
    yanit: `{
  "success": true,
  "challenge_ts": "2026-07-15T09:20:00.000Z",
  "hostname": "acme-shop.com",
  "score": 0.88,
  "cid": "cid_7c1e9f..."
}`,
    hatalar: [
      { kod: "400 missing-input", aciklamaKey: "gel.uc.siteverify.h.400" },
      { kod: "200 invalid-input-secret", aciklamaKey: "gel.uc.siteverify.h.invalidSecret" },
      { kod: "200 site-not-verified", aciklamaKey: "gel.uc.siteverify.h.notVerified" },
    ],
  },
];

/* ================================================================== Yardımcılar */

/** Dil → BCP-47 locale (sayı/tarih biçimlemesi için). */
const LOCALE: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

/** Göreli yaş metni — birim kısaltmaları dile göre (RelativeTimeFormat yerine kısa). */
function yasMetni(ts: number | null, dil: Dil): string {
  if (!ts) {
    const hic: Record<Dil, string> = { tr: "Hiç", en: "Never", de: "Nie", fr: "Jamais", es: "Nunca" };
    return hic[dil];
  }
  const dk = Math.floor((Date.now() - ts) / 60000);
  const azOnce: Record<Dil, string> = { tr: "Az önce", en: "Just now", de: "Gerade eben", fr: "À l'instant", es: "Justo ahora" };
  if (dk < 1) return azOnce[dil];
  const rtf = new Intl.RelativeTimeFormat(LOCALE[dil], { numeric: "always", style: "short" });
  if (dk < 60) return rtf.format(-dk, "minute");
  const sa = Math.floor(dk / 60);
  if (sa < 24) return rtf.format(-sa, "hour");
  return rtf.format(-Math.floor(sa / 24), "day");
}
function tarih(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleDateString(LOCALE[dil], { day: "2-digit", month: "short", year: "numeric" });
}
function saat(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleString(LOCALE[dil], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function sayi(n: number, dil: Dil): string {
  return n.toLocaleString(LOCALE[dil]);
}
function statusTon(s: number): "yesil" | "sari" | "kirmizi" | "gri" {
  if (s === 0) return "kirmizi";
  if (s < 300) return "yesil";
  if (s < 500) return "sari";
  return "kirmizi";
}

/* ================================================================== Ana bileşen */

export function GelistiriciIstemci({
  dil, tokens: ilkTokens, webhooks: ilkWebhooks, sites, istekLog, ozet,
}: {
  dil: Dil; tokens: Token[]; webhooks: Wh[]; sites: SiteLite[]; istekLog: IstekKaydi[]; ozet: Ozet;
}) {
  const t: CevirFn = (anahtar) => gelCeviri(anahtar, dil);
  const router = useRouter();
  const { goster } = useToast();
  const [sekme, setSekme] = useState<Sekme>("anahtarlar");
  const [tokens, setTokens] = useState(ilkTokens);
  const [webhooks, setWebhooks] = useState(ilkWebhooks);

  // Hata oranı: istek logundan (>=400 statülerin yüzdesi). Salt görsel.
  const hataOrani = istekLog.length
    ? Math.round((istekLog.filter((r) => r.status >= 400).length / istekLog.length) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 pt-6 pb-14 lg:px-10">
      <PanelBaslik aciklama={t("gel.aciklama")} />

      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.aktifAnahtar} etiket={t("gel.ozet.aktifAnahtar")} ikon={<Key className="size-5" />} tone="brand" />
        <StatKart sayi={sayi(ozet.aylikCagri, dil)} etiket={t("gel.ozet.aylikCagri")} ikon={<Zap className="size-5" />} />
        <StatKart sayi={`%${ozet.teslimOrani}`} etiket={t("gel.ozet.teslimOrani")} ikon={<Webhook className="size-5" />} tone={ozet.teslimOrani >= 95 ? "ok" : "warn"} />
        <StatKart sayi={`${ozet.ortLatency}ms`} etiket={t("gel.ozet.ortLatency")} ikon={<Activity className="size-5" />} tone={hataOrani > 5 ? "warn" : undefined} />
      </div>

      {/* Görsel özet şeridi: iki gauge + kullanım trendi */}
      <OzetGorsel ozet={ozet} istekLog={istekLog} webhooks={webhooks} hataOrani={hataOrani} t={t} dil={dil} />

      {/* Sekme barı (pill-tab) */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-canvas/60 p-1.5">
        {SEKMELER.map((s) => (
          <button
            key={s.key}
            onClick={() => setSekme(s.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
              sekme === s.key ? "bg-ink-900 text-white shadow-card" : "text-slate-muted hover:bg-white hover:text-slate-ink",
            )}
          >
            {s.ikon} {t(s.adKey)}
          </button>
        ))}
      </div>

      {sekme === "anahtarlar" && (
        <AnahtarlarSekme tokens={tokens} setTokens={setTokens} router={router} goster={goster} t={t} dil={dil} />
      )}
      {sekme === "webhooks" && (
        <WebhooksSekme webhooks={webhooks} setWebhooks={setWebhooks} sites={sites} router={router} goster={goster} t={t} dil={dil} />
      )}
      {sekme === "olaylar" && <OlaylarSekme istekLog={istekLog} t={t} dil={dil} />}
      {sekme === "referans" && <ReferansSekme t={t} />}
      {sekme === "sdklar" && <SdkSekme t={t} />}
    </div>
  );
}

/* ================================================================== Görsel özet şeridi */

/**
 * Üst KPI kartlarının altına gelen görsel özet: webhook teslimat başarısı ve
 * hata oranı gauge'leri + son 14 günlük API çağrı trendi (salt görsel, mevcut
 * prop'lardan deterministik türetilir; hiçbir veri/CRUD mantığı değişmez).
 */
function OzetGorsel({
  ozet, istekLog, webhooks, hataOrani, t, dil,
}: {
  ozet: Ozet; istekLog: IstekKaydi[]; webhooks: Wh[]; hataOrani: number; t: CevirFn; dil: Dil;
}) {
  // Son 14 günlük çağrı trendi: aylık çağrıyı taban alıp deterministik dağıt.
  const trend = useMemo(() => {
    const taban = Math.max(1, Math.round(ozet.aylikCagri / 30));
    let s = ozet.aylikCagri % 9973 || 7;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    return Array.from({ length: 14 }, (_, i) =>
      Math.round(taban * (0.7 + rnd() * 0.6 + Math.sin(i * 0.6) * 0.12)),
    );
  }, [ozet.aylikCagri]);
  const trendEtiket = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000);
      return d.toLocaleDateString(LOCALE[dil], { day: "2-digit", month: "short" });
    }),
    [dil],
  );

  const basari = ozet.teslimOrani;
  const aktifWh = webhooks.filter((w) => w.active).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      {/* İki gauge yan yana */}
      <Panel baslik={t("gel.gorsel.saglik")}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 py-3">
            <GaugeGost deger={basari} etiket={t("gel.gorsel.teslimBasari")} boyut={132} renk={basari >= 95 ? "#16a34a" : basari >= 80 ? "#d97706" : "#dc2626"} />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-faint">
              <Radio className="size-3" /> {t("gel.gorsel.aktifWebhook").replace("{n}", String(aktifWh))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-canvas/40 py-3">
            <GaugeGost deger={100 - hataOrani} etiket={t("gel.gorsel.saglikliIstek")} boyut={132} renk={hataOrani <= 2 ? "#16a34a" : hataOrani <= 5 ? "#d97706" : "#dc2626"} />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-faint">
              <AlertTriangle className="size-3" /> {t("gel.gorsel.hataOrani").replace("{n}", String(hataOrani))}
            </div>
          </div>
        </div>
      </Panel>

      {/* API çağrı trendi */}
      <Panel
        baslik={t("gel.gorsel.cagriTrendi")}
        sagUst={<Badge ton="brand"><TrendingUp className="size-3" /> {t("gel.gorsel.son14g")}</Badge>}
      >
        <TrendGrafik noktalar={trend} etiketler={trendEtiket} renk="#2f6fed" yukseklik={168} />
      </Panel>
    </div>
  );
}

/* ================================================================== 1. API Anahtarları */

function AnahtarlarSekme({
  tokens, setTokens, router, goster, t, dil,
}: {
  tokens: Token[]; setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  router: ReturnType<typeof useRouter>; goster: ReturnType<typeof useToast>["goster"];
  t: CevirFn; dil: Dil;
}) {
  const [modal, setModal] = useState(false);
  const [ad, setAd] = useState("");
  const [ortam, setOrtam] = useState<"live" | "test">("live");
  const [scopes, setScopes] = useState<string[]>(["verify", "siteverify"]);
  const [yeniSecret, setYeniSecret] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const canli = tokens.filter((t) => t.environment === "live");
  const test = tokens.filter((t) => t.environment === "test");

  function modalAc() { setAd(""); setOrtam("live"); setScopes(["verify", "siteverify"]); setYeniSecret(null); setModal(true); }

  async function olustur() {
    if (!ad.trim() || yukleniyor) return;
    setYukleniyor(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ad, scopes, environment: ortam }),
      });
      if (res.ok) {
        const { token, secret } = await res.json();
        setTokens((p) => [...p, token]);
        setYeniSecret(secret);
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("gel.toast.anahtarOlusmadi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("gel.toast.anahtarOlusmadi") });
    } finally {
      setYukleniyor(false);
    }
  }
  async function dondur(tok: Token) {
    try {
      const res = await fetch("/api/tokens", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tok.id }),
      });
      if (res.ok) {
        const { secret } = await res.json();
        setTokens((p) => p.map((x) => (x.id === tok.id ? { ...x, prefix: secret.slice(0, 20), lastUsed: null, createdAt: Date.now() } : x)));
        setYeniSecret(secret); setModal(true); setAd(tok.name);
        goster({ tip: "basari", baslik: t("gel.toast.anahtarDonduruldu"), aciklama: t("gel.toast.anahtarDonduruldu.aciklama") });
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("gel.toast.anahtarOlusmadi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("gel.toast.anahtarOlusmadi") });
    }
  }
  async function iptal(tok: Token) {
    const yedek = tokens;
    setTokens((p) => p.map((x) => (x.id === tok.id ? { ...x, revoked: true } : x)));
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tok.id }),
      });
      if (!res.ok) throw new Error();
      goster({ tip: "basari", baslik: t("gel.toast.anahtarIptal") });
      router.refresh();
    } catch {
      setTokens(yedek);
      goster({ tip: "hata", baslik: t("gel.toast.anahtarIptalEdilemedi") });
    }
  }
  function scopeAcKapa(k: string) {
    setScopes((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }
  function secretKopyala() {
    if (!yeniSecret) return;
    navigator.clipboard.writeText(yeniSecret);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: t("gel.toast.kopyalandi") });
    setTimeout(() => setKopyalandi(false), 1600);
  }

  // Anahtar kullanım dağılımı (görsel): ilk 8 aktif anahtarın 30g istek hacmi.
  const kullanimKovalar = useMemo(
    () => tokens.filter((x) => !x.revoked).sort((a, b) => b.requests30d - a.requests30d).slice(0, 8)
      .map((x) => ({ etiket: x.name.slice(0, 6), deger: x.requests30d })),
    [tokens],
  );
  const toplam30g = useMemo(() => tokens.reduce((s, x) => s + (x.revoked ? 0 : x.requests30d), 0), [tokens]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-[13px] text-slate-muted">
          {t("gel.anahtar.aciklama")}
        </p>
        <Button size="sm" onClick={modalAc}><Plus className="size-4" /> {t("gel.anahtar.yeni")}</Button>
      </div>

      {kullanimKovalar.length > 0 && (
        <Panel
          baslik={t("gel.anahtar.kullanimDagilim")}
          sagUst={<span className="num text-[13px] font-semibold text-slate-ink">{sayi(toplam30g, dil)} <span className="text-[11px] font-normal text-slate-faint">{t("gel.anahtar.istek30g")}</span></span>}
        >
          <Histogram kovalar={kullanimKovalar} yukseklik={96} renk="#2f6fed" />
        </Panel>
      )}

      <AnahtarGrup baslik={t("gel.anahtar.canliOrtam")} ton="brand" tokens={canli} onDondur={dondur} onIptal={iptal} t={t} dil={dil} />
      <AnahtarGrup baslik={t("gel.anahtar.testOrtam")} ton="gri" tokens={test} onDondur={dondur} onIptal={iptal} t={t} dil={dil} />

      <Modal acik={modal} kapat={() => setModal(false)} baslik={yeniSecret ? t("gel.modal.hazir") : t("gel.modal.yeniApi")}>
        {yeniSecret ? (
          <div className="space-y-4">
            <NotKutusu ton="sari" baslik={t("gel.modal.simdiKopyala.baslik")}>
              {t("gel.modal.simdiKopyala.metin")}
            </NotKutusu>
            <button
              onClick={secretKopyala}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-line-strong bg-canvas px-3.5 py-3 text-left font-mono text-[12.5px] transition hover:border-brand-300"
            >
              <span className="truncate text-slate-ink">{yeniSecret}</span>
              {kopyalandi ? <Check className="size-4 shrink-0 text-ok" /> : <Copy className="size-4 shrink-0 text-brand-600" />}
            </button>
            <KodBlok dil="bash" baslik={t("gel.modal.kullanim")} kod={`curl https://api.veylify.com/api/v1/siteverify \\
  -H "Authorization: Bearer ${yeniSecret.slice(0, 24)}..." \\
  -H "Content-Type: application/json" \\
  -d '{ "response": "<token>" }'`} />
            <div className="flex justify-end"><Button onClick={() => setModal(false)}>{t("gel.modal.bitti")}</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alan etiket={t("gel.modal.anahtarAdi")}>
              <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t("gel.modal.anahtarAdi.ph")} autoFocus />
            </Alan>
            <Alan etiket={t("gel.modal.ortam")}>
              <div className="flex gap-2">
                {(["live", "test"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrtam(o)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-left transition",
                      ortam === o ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line-strong bg-surface hover:bg-canvas",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", o === "live" ? "bg-brand-600" : "bg-slate-400")} />
                      <span className="text-sm font-semibold text-slate-ink">{o === "live" ? t("gel.modal.canli") : t("gel.modal.test")}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-muted">{o === "live" ? t("gel.modal.canli.aciklama") : t("gel.modal.test.aciklama")}</p>
                  </button>
                ))}
              </div>
            </Alan>
            <Alan etiket={t("gel.modal.kapsamlar")}>
              <div className="space-y-1.5">
                {SCOPE_SECENEK.map((s) => {
                  const on = scopes.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => scopeAcKapa(s.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition",
                        on ? "border-brand-300 bg-brand-50/60" : "border-line bg-surface hover:bg-canvas",
                      )}
                    >
                      <div>
                        <div className="font-mono text-[12.5px] font-semibold text-slate-ink">{s.key}</div>
                        <div className="text-[12px] text-slate-muted">{t(s.aciklamaKey)}</div>
                      </div>
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>
                        {on && <Check className="size-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Alan>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setModal(false)}>{t("gel.modal.iptal")}</Button>
              <Button onClick={olustur} disabled={!ad.trim() || scopes.length === 0 || yukleniyor}>
                {yukleniyor ? t("gel.modal.olusturuluyor") : t("gel.modal.olustur")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AnahtarGrup({
  baslik, ton, tokens, onDondur, onIptal, t, dil,
}: {
  baslik: string; ton: "brand" | "gri"; tokens: Token[];
  onDondur: (t: Token) => void; onIptal: (t: Token) => void;
  t: CevirFn; dil: Dil;
}) {
  return (
    <Panel
      baslik={<span className="flex items-center gap-2">{baslik} <Badge ton={ton}>{tokens.length}</Badge></span>}
      padding={false}
    >
      {tokens.length === 0 ? (
        <div className="p-6"><BosDurum ikon={<Key className="size-8" />} baslik={t("gel.anahtar.yok.baslik")} aciklama={t("gel.anahtar.yok.aciklama")} /></div>
      ) : (
        <div className="divide-y divide-line">
          {tokens.map((tok) => (
            <div key={tok.id} className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-4", tok.revoked && "opacity-60")}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-ink">{tok.name}</span>
                  {tok.revoked && <Badge ton="kirmizi">{t("gel.anahtar.iptalEdildi")}</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-lg border border-line-strong bg-white px-2.5 py-1 font-mono text-[12px] font-semibold tracking-tight text-slate-ink">
                    {tok.prefix}{"•".repeat(10)}
                  </span>
                  {tok.scopes.map((s) => <Badge key={s} ton="gri">{s}</Badge>)}
                </div>
              </div>
              <div className="flex items-center gap-5">
                {!tok.revoked && tok.requests30d > 0 && (
                  <div className="hidden w-24 md:block">
                    <MiniSpark tohum={tok.id} renk={tok.environment === "live" ? "#2f6fed" : "#7a7568"} yukseklik={30} />
                  </div>
                )}
                <div className="text-right">
                  <div className="num text-[13px] font-semibold text-slate-ink">{sayi(tok.requests30d, dil)}</div>
                  <div className="text-[11px] text-slate-faint">{t("gel.anahtar.istek30g")}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-[13px] text-slate-ink">{yasMetni(tok.lastUsed, dil)}</div>
                  <div className="text-[11px] text-slate-faint">{t("gel.anahtar.sonKullanim")}</div>
                </div>
                {!tok.revoked && (
                  <SatirMenu aksiyonlar={[
                    { ad: t("gel.anahtar.dondur"), onClick: () => onDondur(tok) },
                    { ad: t("gel.anahtar.iptalEt"), onClick: () => onIptal(tok), tehlike: true },
                  ]} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== 2. Webhook'lar */

function WebhooksSekme({
  webhooks, setWebhooks, sites, router, goster, t, dil,
}: {
  webhooks: Wh[]; setWebhooks: React.Dispatch<React.SetStateAction<Wh[]>>;
  sites: SiteLite[]; router: ReturnType<typeof useRouter>; goster: ReturnType<typeof useToast>["goster"];
  t: CevirFn; dil: Dil;
}) {
  const [modal, setModal] = useState(false);
  const [url, setUrl] = useState("");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [events, setEvents] = useState<string[]>(["bot.blocked"]);
  const [yeniWh, setYeniWh] = useState<Wh | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const tumTeslim = useMemo(
    () => webhooks.flatMap((w) => w.deliveries.map((d) => ({ ...d, url: w.url }))).sort((a, b) => b.ts - a.ts).slice(0, 25),
    [webhooks],
  );

  // Teslimat sağlık görselleştirmesi (salt görsel — CRUD'dan bağımsız).
  const teslimSaglik = useMemo(() => {
    const hepsi = webhooks.flatMap((w) => w.deliveries);
    const basarili = hepsi.filter((d) => d.status >= 200 && d.status < 300).length;
    const genelOran = hepsi.length ? Math.round((basarili / hepsi.length) * 100) : 100;
    // Her endpoint için başarı oranı çubuğu.
    const perWh = webhooks.map((w) => {
      const t = w.deliveries.length;
      const ok = w.deliveries.filter((d) => d.status >= 200 && d.status < 300).length;
      return { ad: w.url.replace(/^https?:\/\//, "").slice(0, 28), oran: t ? Math.round((ok / t) * 100) : 100, sayi: t };
    }).filter((x) => x.sayi > 0).slice(0, 6);
    // Durum kodu dağılımı histogramı.
    const kova = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, ERR: 0 };
    for (const d of hepsi) {
      if (d.status === 0) kova.ERR++;
      else if (d.status < 300) kova["2xx"]++;
      else if (d.status < 400) kova["3xx"]++;
      else if (d.status < 500) kova["4xx"]++;
      else kova["5xx"]++;
    }
    const kovalar = [
      { etiket: "2xx", deger: kova["2xx"], ton: "insan" as const },
      { etiket: "3xx", deger: kova["3xx"], ton: "nötr" as const },
      { etiket: "4xx", deger: kova["4xx"], ton: "bot" as const },
      { etiket: "5xx", deger: kova["5xx"], ton: "bot" as const },
      { etiket: "ERR", deger: kova.ERR, ton: "bot" as const },
    ];
    return { genelOran, perWh, kovalar, toplam: hepsi.length };
  }, [webhooks]);

  async function olustur() {
    if (!/^https?:\/\//.test(url) || !siteId || yukleniyor) return;
    setYukleniyor(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, url, events }),
      });
      if (res.ok) {
        const { webhook } = await res.json();
        const site = sites.find((s) => s.id === siteId);
        const zengin: Wh = { ...webhook, siteName: site?.name ?? "—", deliveries: [] };
        setWebhooks((p) => [...p, zengin]);
        setYeniWh(zengin);
        goster({ tip: "basari", baslik: t("gel.wh.toast.olusturuldu") });
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("gel.wh.toast.olusmadi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("gel.wh.toast.olusmadi") });
    } finally {
      setYukleniyor(false);
    }
  }
  async function testGonder(w: Wh) {
    try {
      const res = await fetch("/api/webhooks", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, action: "test", event: "webhook.test" }),
      });
      if (res.ok) {
        const { delivery } = await res.json();
        setWebhooks((p) => p.map((x) => (x.id === w.id
          ? { ...x, deliveries: [delivery, ...x.deliveries], lastDelivery: delivery.ts, lastStatus: delivery.status }
          : x)));
        goster({
          tip: delivery.status >= 200 && delivery.status < 300 ? "basari" : "hata",
          baslik: t("gel.wh.toast.testGonderildi").replace("{n}", String(delivery.status || t("gel.wh.toast.baglantiYok"))),
        });
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("gel.wh.toast.testBasarisiz") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("gel.wh.toast.testBasarisiz") });
    }
  }
  async function durumDegistir(w: Wh) {
    const yedek = webhooks;
    // İyimser güncelle (anında görsel geri bildirim), başarısızlıkta geri al.
    setWebhooks((p) => p.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)));
    try {
      const res = await fetch("/api/webhooks", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, action: "toggle" }),
      });
      if (!res.ok) throw new Error();
      const { webhook } = await res.json();
      setWebhooks((p) => p.map((x) => (x.id === w.id ? { ...x, active: webhook.active } : x)));
      router.refresh();
    } catch {
      setWebhooks(yedek);
      goster({ tip: "hata", baslik: t("gel.wh.toast.guncellenemedi") });
    }
  }
  async function sil(w: Wh) {
    const yedek = webhooks;
    setWebhooks((p) => p.filter((x) => x.id !== w.id));
    try {
      const res = await fetch("/api/webhooks", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id }),
      });
      if (!res.ok) throw new Error();
      goster({ tip: "basari", baslik: t("gel.wh.toast.silindi") });
      router.refresh();
    } catch {
      setWebhooks(yedek);
      goster({ tip: "hata", baslik: t("gel.wh.toast.silinemedi") });
    }
  }
  function eventAcKapa(k: string) {
    setEvents((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-[13px] text-slate-muted">
          {t("gel.wh.aciklama")}
        </p>
        <Button size="sm" onClick={() => { setUrl(""); setEvents(["bot.blocked"]); setSiteId(sites[0]?.id ?? ""); setYeniWh(null); setModal(true); }}>
          <Plus className="size-4" /> {t("gel.wh.endpointEkle")}
        </Button>
      </div>

      {teslimSaglik.toplam > 0 && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* Genel teslimat başarı gauge */}
          <Panel baslik={t("gel.wh.teslimBasari")}>
            <div className="flex flex-col items-center gap-3">
              <GaugeGost deger={teslimSaglik.genelOran} etiket={t("gel.wh.basariEtiket")} boyut={148} renk={teslimSaglik.genelOran >= 95 ? "#16a34a" : teslimSaglik.genelOran >= 80 ? "#d97706" : "#dc2626"} />
              <div className="text-[11px] text-slate-faint">{t("gel.wh.teslimToplam").replace("{n}", String(teslimSaglik.toplam))}</div>
            </div>
          </Panel>
          {/* Endpoint başarı çubukları + durum dağılımı */}
          <Panel baslik={t("gel.wh.endpointSaglik")}>
            <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-3">
                {teslimSaglik.perWh.length ? teslimSaglik.perWh.map((w) => (
                  <SkorCubugu key={w.ad} etiket={w.ad} deger={w.oran} renk={w.oran >= 95 ? "#16a34a" : w.oran >= 80 ? "#d97706" : "#dc2626"} />
                )) : (
                  <p className="text-[13px] text-slate-faint">{t("gel.wh.teslimatKaydiYok")}</p>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                  <Server className="size-3.5 text-slate-faint" /> {t("gel.wh.durumDagilim")}
                </div>
                <Histogram kovalar={teslimSaglik.kovalar} yukseklik={84} />
              </div>
            </div>
          </Panel>
        </div>
      )}

      <Panel baslik={t("gel.wh.endpointler")} padding={false}>
        {webhooks.length === 0 ? (
          <div className="p-6"><BosDurum ikon={<Webhook className="size-8" />} baslik={t("gel.wh.yok.baslik")} aciklama={t("gel.wh.yok.aciklama")} /></div>
        ) : (
          <div className="divide-y divide-line">
            {webhooks.map((w) => (
              <div key={w.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <DurumRozeti ton={w.active ? (w.lastStatus && w.lastStatus >= 400 ? "warn" : "ok") : "gri"} etiket={w.active ? t("gel.wh.aktif") : t("gel.wh.pasif")} nabiz={w.active} />
                      <span className="truncate font-mono text-[13px] text-slate-ink">{w.url}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge ton="gri">{w.siteName}</Badge>
                      {w.events.map((e) => <Badge key={e} ton="brand">{e}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <div className="text-[12.5px] text-slate-ink">{w.lastDelivery ? yasMetni(w.lastDelivery, dil) : t("gel.wh.teslimatYok")}</div>
                      <div className="text-[11px] text-slate-faint">{t("gel.wh.sonTeslimat")}</div>
                    </div>
                    <Tooltip metin={t("gel.wh.testGonder")}>
                      <button onClick={() => testGonder(w)} className="rounded-lg border border-line-strong bg-surface p-2 text-slate-muted transition hover:bg-canvas hover:text-slate-ink">
                        <Send className="size-4" />
                      </button>
                    </Tooltip>
                    <SatirMenu aksiyonlar={[
                      { ad: w.active ? t("gel.wh.duraklat") : t("gel.wh.etkinlestir"), onClick: () => durumDegistir(w) },
                      { ad: t("gel.wh.sil"), onClick: () => sil(w), tehlike: true },
                    ]} />
                  </div>
                </div>
                {/* imzalama sırrı */}
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-canvas/70 px-3 py-2">
                  <span className="text-[11px] font-medium text-slate-faint">{t("gel.wh.imzaSirri")}</span>
                  <code className="font-mono text-[12px] text-slate-muted">{w.secret.slice(0, 14)}{"•".repeat(8)}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Teslimat logları */}
      <Panel baslik={t("gel.wh.sonTeslimatlar")} sagUst={<Badge ton="gri">{tumTeslim.length}</Badge>} padding={false}>
        {tumTeslim.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-faint">{t("gel.wh.teslimatKaydiYok")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.olay")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.endpoint")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.durum")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.deneme")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.sure")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.wh.tbl.zaman")}</th>
                </tr>
              </thead>
              <tbody>
                {tumTeslim.map((d) => (
                  <tr key={d.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5"><code className="font-mono text-[12px] text-slate-ink">{d.event}</code></td>
                    <td className="px-5 py-2.5"><span className="font-mono text-[12px] text-slate-muted">{d.url.replace(/^https?:\/\//, "")}</span></td>
                    <td className="px-5 py-2.5"><Badge ton={statusTon(d.status)}>{d.status || "ERR"}</Badge></td>
                    <td className="px-5 py-2.5 num text-slate-muted">{d.attempt}</td>
                    <td className="px-5 py-2.5 num text-slate-muted">{d.durationMs}ms</td>
                    <td className="px-5 py-2.5 text-[12.5px] text-slate-muted">{saat(d.ts, dil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal acik={modal} kapat={() => setModal(false)} baslik={yeniWh ? t("gel.wh.modal.hazir") : t("gel.wh.modal.ekle")}>
        {yeniWh ? (
          <div className="space-y-4">
            <NotKutusu ton="yesil" baslik={t("gel.wh.modal.kaydedildi.baslik")}>
              {t("gel.wh.modal.kaydedildi.on")}<code className="font-mono">X-Veylify-Signature</code>{t("gel.wh.modal.kaydedildi.son")}
            </NotKutusu>
            <KodBlok dil="bash" baslik={t("gel.wh.modal.imzaSirriKod")} kod={yeniWh.secret} />
            <KodBlok dil="js" baslik={t("gel.wh.modal.imzaDogrulama")} kod={`import crypto from "node:crypto";

function verify(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />
            <div className="flex justify-end"><Button onClick={() => setModal(false)}>{t("gel.modal.bitti")}</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alan etiket={t("gel.wh.modal.url")}>
              <Girdi value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://acme.com/hooks/specter" autoFocus />
            </Alan>
            <Alan etiket={t("gel.wh.modal.site")}>
              <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Secim>
            </Alan>
            <Alan etiket={t("gel.wh.modal.abonelikler")}>
              <div className="grid grid-cols-2 gap-1.5">
                {OLAY_KATALOG.map((o) => {
                  const on = events.includes(o.key);
                  return (
                    <button
                      key={o.key}
                      onClick={() => eventAcKapa(o.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                        on ? "border-brand-300 bg-brand-50/60" : "border-line bg-surface hover:bg-canvas",
                      )}
                    >
                      <span className={cn("grid size-4 shrink-0 place-items-center rounded border", on ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>
                        {on && <Check className="size-3" />}
                      </span>
                      <span className="truncate font-mono text-[11.5px] text-slate-ink">{o.key}</span>
                    </button>
                  );
                })}
              </div>
            </Alan>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setModal(false)}>{t("gel.modal.iptal")}</Button>
              <Button onClick={olustur} disabled={!/^https?:\/\//.test(url) || !siteId || events.length === 0 || yukleniyor}>
                {yukleniyor ? t("gel.wh.modal.ekleniyor") : t("gel.wh.endpointEkle")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================================================================== 3. Olaylar & Loglar */

function OlaylarSekme({ istekLog, t, dil }: { istekLog: IstekKaydi[]; t: CevirFn; dil: Dil }) {
  const [secili, setSecili] = useState(OLAY_KATALOG[0].key);
  const aktif = OLAY_KATALOG.find((o) => o.key === secili)!;

  // İstek log görselleştirmesi (salt görsel).
  const istekGorsel = useMemo(() => {
    // Endpoint dağılımı donut.
    const epSayac: Record<string, number> = {};
    for (const r of istekLog) epSayac[r.endpoint] = (epSayac[r.endpoint] ?? 0) + 1;
    const epRenk = ["#2f6fed", "#0891b2", "#7c3aed", "#d97706", "#16a34a"];
    const donut = Object.entries(epSayac).sort((a, b) => b[1] - a[1])
      .map(([ep, deger], i) => ({ etiket: ep.replace("/api/v1/", ""), deger, renk: epRenk[i % epRenk.length] }));

    // Saatlik istek histogramı (son 24 saat, 3'er saatlik 8 kova).
    const simdi = Date.now();
    const kovalar = Array.from({ length: 8 }, (_, i) => {
      const bas = simdi - (8 - i) * 3 * 3600000;
      const bit = bas + 3 * 3600000;
      const sayi = istekLog.filter((r) => r.ts >= bas && r.ts < bit).length;
      const lbl = new Date(bas).toLocaleTimeString(LOCALE[dil], { hour: "2-digit" });
      return { etiket: lbl, deger: sayi, ton: "nötr" as const };
    });

    // Endpoint × durum ısı-matrisi.
    const eps = Object.keys(epSayac).slice(0, 5);
    const durumSutun = ["200", "422", "403", "429"];
    const matris = eps.map((ep) =>
      durumSutun.map((d) => istekLog.filter((r) => r.endpoint === ep && String(r.status) === d).length),
    );
    return { donut, kovalar, epKisa: eps.map((e) => e.replace("/api/v1/", "")), durumSutun, matris };
  }, [istekLog, dil]);

  return (
    <div className="space-y-6">
      {/* İstek görsel özeti */}
      {istekLog.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel baslik={t("gel.olay.endpointDagilim")} sagUst={<Globe className="size-4 text-slate-faint" />}>
            <DonutDagilim segmentler={istekGorsel.donut} merkezEtiket={t("gel.olay.istekMerkez")} />
          </Panel>
          <Panel baslik={t("gel.olay.saatlikHacim")}>
            <Histogram kovalar={istekGorsel.kovalar} yukseklik={132} renk="#2f6fed" />
          </Panel>
          {istekGorsel.matris.length > 0 && (
            <Panel baslik={t("gel.olay.durumMatris")} className="lg:col-span-2">
              <IsiMatris satirlar={istekGorsel.epKisa} sutunlar={istekGorsel.durumSutun} degerler={istekGorsel.matris} renk="#2f6fed" />
            </Panel>
          )}
        </div>
      )}

      {/* Event kataloğu */}
      <Panel baslik={t("gel.olay.katalog")} sagUst={<Badge ton="brand">{t("gel.olay.turSayi").replace("{n}", String(OLAY_KATALOG.length))}</Badge>}>
        <p className="-mt-1 mb-4 text-[13px] text-slate-muted">
          {t("gel.olay.katalogAciklama")}
        </p>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-1.5">
            {OLAY_KATALOG.map((o) => (
              <button
                key={o.key}
                onClick={() => setSecili(o.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition",
                  secili === o.key ? "border-brand-300 bg-brand-50/70" : "border-line bg-surface hover:bg-canvas",
                )}
              >
                <div className="min-w-0">
                  <div className="font-mono text-[12.5px] font-semibold text-slate-ink">{o.key}</div>
                  <div className="truncate text-[12px] text-slate-muted">{t(o.adKey)}</div>
                </div>
                <ChevronRight className={cn("size-4 shrink-0", secili === o.key ? "text-brand-600" : "text-slate-faint")} />
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-canvas/50 p-4">
              <div className="flex items-center gap-2">
                <Braces className="size-4 text-brand-600" />
                <span className="font-mono text-[13px] font-semibold text-slate-ink">{aktif.key}</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-muted">{t(aktif.aciklamaKey)}</p>
            </div>
            <KodBlok dil="json" baslik={t("gel.olay.ornekPayload")} kod={aktif.payload} />
          </div>
        </div>
      </Panel>

      {/* Son API istekleri */}
      <Panel baslik={t("gel.olay.sonIstekler")} sagUst={<Badge ton="gri">{istekLog.length}</Badge>} padding={false}>
        {istekLog.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-faint">{t("gel.olay.istekKaydiYok")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.method")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.endpoint")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.durum")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.gecikme")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.kaynak")}</th>
                  <th className="px-5 py-2.5 font-semibold">{t("gel.olay.tbl.zaman")}</th>
                </tr>
              </thead>
              <tbody>
                {istekLog.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5"><span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700">{r.method}</span></td>
                    <td className="px-5 py-2.5"><code className="font-mono text-[12px] text-slate-ink">{r.endpoint}</code></td>
                    <td className="px-5 py-2.5"><Badge ton={statusTon(r.status)}>{r.status}</Badge></td>
                    <td className="px-5 py-2.5 num text-slate-muted">{r.latency}ms</td>
                    <td className="px-5 py-2.5 font-mono text-[12px] text-slate-muted">{r.ip} · {r.country}</td>
                    <td className="px-5 py-2.5 text-[12.5px] text-slate-muted">{saat(r.ts, dil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================================================================== 4. API Referansı */

function ReferansSekme({ t }: { t: CevirFn }) {
  const [acik, setAcik] = useState<string>(ENDPOINTS[0].path);
  return (
    <div className="space-y-4">
      <NotKutusu ton="bilgi" baslik={t("gel.ref.temelUrl")}>
        {t("gel.ref.temelUrl.on")} <code className="font-mono">https://api.veylify.com</code> {t("gel.ref.temelUrl.orta")}
        {" "}<code className="font-mono">Authorization: Bearer sk_live_...</code> {t("gel.ref.temelUrl.son")}
      </NotKutusu>
      {ENDPOINTS.map((u) => {
        const open = acik === u.path;
        return (
          <Panel key={u.path} padding={false}>
            <button onClick={() => setAcik(open ? "" : u.path)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700">{u.method}</span>
                <code className="font-mono text-[13px] font-medium text-slate-ink">{u.path}</code>
                <span className="hidden text-[12.5px] text-slate-muted md:inline">{t(u.ozetKey)}</span>
              </div>
              <ChevronRight className={cn("size-4 shrink-0 text-slate-faint transition", open && "rotate-90")} />
            </button>
            {open && (
              <div className="space-y-4 border-t border-line px-5 py-5">
                <p className="text-[13px] leading-relaxed text-slate-muted">{t(u.aciklamaKey)}</p>

                <div>
                  <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("gel.ref.parametreler")}</h4>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-left text-sm">
                      <tbody>
                        {u.params.map((p) => (
                          <tr key={p.ad} className="border-b border-line last:border-0">
                            <td className="w-40 px-3 py-2 align-top">
                              <code className="font-mono text-[12.5px] font-semibold text-slate-ink">{p.ad}</code>
                              {p.zorunlu ? <span className="ml-1.5 text-[11px] font-medium text-danger2">{t("gel.ref.zorunlu")}</span> : <span className="ml-1.5 text-[11px] text-slate-faint">{t("gel.ref.opsiyonel")}</span>}
                            </td>
                            <td className="px-3 py-2 align-top"><code className="font-mono text-[11.5px] text-brand-700">{p.tip}</code></td>
                            <td className="px-3 py-2 align-top text-[12.5px] text-slate-muted">{t(p.aciklamaKey)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("gel.ref.ornekIstek")}</h4>
                    <KodBlok dil="bash" baslik="curl" kod={u.curl} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("gel.ref.ornekYanit")}</h4>
                    <KodBlok dil="json" baslik="200 OK" kod={u.yanit} />
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("gel.ref.hataKodlari")}</h4>
                  <div className="space-y-1.5">
                    {u.hatalar.map((h) => (
                      <div key={h.kod} className="flex items-start gap-2.5 rounded-lg bg-canvas/70 px-3 py-2">
                        <code className="shrink-0 font-mono text-[12px] font-semibold text-danger2">{h.kod}</code>
                        <span className="text-[12.5px] text-slate-muted">{t(h.aciklamaKey)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

/* ================================================================== 5. SDK'lar */

const SDKLER: { key: string; ad: string; kurulum: string; kurulumDil: string; ornek: string; ornekDil: string; ornekBaslik: string }[] = [
  {
    key: "js", ad: "JavaScript / Node", kurulumDil: "bash", kurulum: "npm install @specter/js",
    ornekDil: "js", ornekBaslik: "server.js",
    ornek: `import { Specter } from "@specter/js";

const specter = new Specter("sk_live_...");

// Formu işleyen sunucu rotanızda:
const result = await specter.siteverify({
  response: req.body.specterToken,
});

if (result.success && result.score > 0.5) {
  // gerçek insan — formu işle
} else {
  return res.status(403).json({ error: "bot" });
}`,
  },
  {
    key: "py", ad: "Python", kurulumDil: "bash", kurulum: "pip install specter-sdk",
    ornekDil: "py", ornekBaslik: "views.py",
    ornek: `from specter import Specter

specter = Specter("sk_live_...")

result = specter.siteverify(response=token)

if result.success and result.score > 0.5:
    handle_submission()
else:
    return {"error": "bot"}, 403`,
  },
  {
    key: "php", ad: "PHP", kurulumDil: "bash", kurulum: "composer require specter/specter-php",
    ornekDil: "php", ornekBaslik: "verify.php",
    ornek: `<?php
use Specter\\Specter;

$specter = new Specter("sk_live_...");
$result = $specter->siteverify($_POST["specter_token"]);

if ($result->success && $result->score > 0.5) {
  // insan doğrulandı
} else {
  http_response_code(403);
}`,
  },
  {
    key: "curl", ad: "cURL", kurulumDil: "bash", kurulum: "# Bağımlılık yok — düz HTTP",
    ornekDil: "bash", ornekBaslik: "verify.sh",
    ornek: `curl -X POST https://api.veylify.com/api/v1/siteverify \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret": "sk_live_...",
    "response": "<token>"
  }'

# → { "success": true, "score": 0.88 }`,
  },
];

function SdkSekme({ t }: { t: CevirFn }) {
  const [seciliSdk, setSeciliSdk] = useState(SDKLER[0].key);
  const aktif = SDKLER.find((s) => s.key === seciliSdk)!;
  return (
    <div className="space-y-5">
      <Panel baslik={t("gel.sdk.widgetKurulum")}>
        <p className="-mt-1 mb-3 text-[13px] text-slate-muted">
          {t("gel.sdk.widgetKurulum.aciklama")}
        </p>
        <KodBlok dil="html" baslik="index.html" kod={`<script src="https://cdn.veylify.com/widget.js" async defer></script>

<form method="POST" action="/submit">
  <div class="veylify-widget" data-sitekey="pk_live_a1b2c3..."></div>
  <button type="submit">Gönder</button>
</form>`} />
      </Panel>

      <Panel baslik={t("gel.sdk.sunucuSdk")} sagUst={<Code className="size-4 text-slate-faint" />}>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SDKLER.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeciliSdk(s.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                seciliSdk === s.key ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
              )}
            >
              {s.ad}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
              <Terminal className="size-3.5" /> {t("gel.sdk.kurulum")}
            </h4>
            <KodBlok dil={aktif.kurulumDil} baslik={aktif.kurulumDil} kod={aktif.kurulum} maxH="max-h-40" />
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
              <Zap className="size-3.5" /> {t("gel.sdk.hizliBaslangic")}
            </h4>
            <KodBlok dil={aktif.ornekDil} baslik={aktif.ornekBaslik} kod={aktif.ornek} />
          </div>
        </div>
      </Panel>
    </div>
  );
}
