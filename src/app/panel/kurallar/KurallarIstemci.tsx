"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, GitBranch, Zap, Lock, Sparkles, Check, ChevronUp, ChevronDown, Bot, BarChart3, ShieldCheck, ShieldAlert, Layers, TrendingUp, Ban, ShieldQuestion, Flag, Globe, Network, Fingerprint, Route } from "lucide-react";
import { motion } from "framer-motion";
import { PanelBaslik, Badge, Modal, Alan, Girdi, Alan2, Secim, Ilerleme, BosDurum, SatirMenu, useToast, Tablo, type Kolon } from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { PlanKilit } from "@/components/panel/PlanKilit";
import { DonutDagilim, MiniSpark } from "@/components/panel/grafikler";
import { RULE_TEMPLATES, KATEGORI_ETIKET } from "@/lib/specter/rule-templates";
import { AI_AJANLAR, AI_KATEGORI_ETIKET } from "@/lib/specter/ai-agents";
import type { Dil } from "@/lib/i18n/panel";
import { kurallarCeviri } from "./kurallar.i18n";
import { cn } from "@/lib/cn";

interface Rule {
  id: string;
  siteId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  field: string;
  op: string;
  value: string;
  action: string;
  hits: number;
  system: boolean;
}

/**
 * Alan/operatör/aksiyon anahtar listeleri. Bunlar kural motorunun ENUM
 * DEĞERLERİDİR (mantıkta kullanılır) — asla çevrilmez. Görüntü etiketi
 * `t("kr.field."+key)` / `t("kr.op."+key)` / `t("kr.action."+key)` ile üretilir.
 */
const FIELD_KEYS = ["ip", "country", "asn", "ua", "path", "score", "botClass", "rate", "aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"] as const;
const OP_KEYS = ["eq", "neq", "contains", "gt", "lt", "in"] as const;
const ACTION_KEYS = ["allow", "challenge", "block", "flag"] as const;
const ACTION_TON: Record<string, "yesil" | "sari" | "kirmizi" | "gri"> = { allow: "yesil", challenge: "sari", block: "kirmizi", flag: "gri" };

/** Aksiyon → lucide ikon (rozet + dağılım görselleri). */
const AKSIYON_IKON: Record<string, typeof Flag> = { allow: ShieldCheck, challenge: ShieldQuestion, block: Ban, flag: Flag };
/** Aksiyon → grafik rengi (donut / spark). */
const AKSIYON_RENK: Record<string, string> = { allow: "#16a34a", challenge: "#d97706", block: "#dc2626", flag: "#6b6a63" };

/**
 * Kural alanını insan-okur bir "tür"e eşler: ağ, coğrafya, yol, bot-sınıfı,
 * AI-parmak izi. Tür dağılımı donutunda ve tür rozetlerinde kullanılır.
 */
const ALAN_TUR: Record<string, { anahtar: string; renk: string; ikon: typeof Flag }> = {
  ip: { anahtar: "ag", renk: "#2f6fed", ikon: Network },
  asn: { anahtar: "ag", renk: "#2f6fed", ikon: Network },
  rate: { anahtar: "ag", renk: "#2f6fed", ikon: Network },
  httpVersion: { anahtar: "ag", renk: "#2f6fed", ikon: Network },
  country: { anahtar: "cografya", renk: "#0891b2", ikon: Globe },
  path: { anahtar: "yol", renk: "#7c3aed", ikon: Route },
  ua: { anahtar: "yol", renk: "#7c3aed", ikon: Route },
  score: { anahtar: "bot", renk: "#d97706", ikon: Bot },
  botClass: { anahtar: "bot", renk: "#d97706", ikon: Bot },
  aiAgent: { anahtar: "ai", renk: "#db2777", ikon: Fingerprint },
  aiCategory: { anahtar: "ai", renk: "#db2777", ikon: Fingerprint },
  headless: { anahtar: "ai", renk: "#db2777", ikon: Fingerprint },
  tlsMismatch: { anahtar: "ai", renk: "#db2777", ikon: Fingerprint },
};
const TUR_VARSAYILAN = { anahtar: "ag", renk: "#6b6a63", ikon: Layers };

/** AI-ajan spesifik alanlar (değer girişi özel bileşenle yapılır). */
const AI_FIELDS = new Set(["aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"]);
/** Boolean alanlar (true/false). */
const BOOL_FIELDS = new Set(["headless", "tlsMismatch"]);

/** Bir kural koşulunu insan-okur biçimde etiketler (AI alanları için özel). */
function kosulEtiket(field: string, op: string, value: string, t: (k: string) => string): { alan: string; op: string; deger: string } {
  const alan = t("kr.field." + field) || field;
  const opEt = t("kr.op." + op);
  if (field === "aiAgent") {
    const a = AI_AJANLAR.find((x) => x.id === value);
    return { alan, op: opEt, deger: a ? a.urun : value };
  }
  if (field === "aiCategory") {
    return { alan, op: opEt, deger: AI_KATEGORI_ETIKET[value as keyof typeof AI_KATEGORI_ETIKET] || value };
  }
  if (BOOL_FIELDS.has(field)) {
    return { alan, op: opEt, deger: value === "true" ? t("kr.evet") : t("kr.hayir") };
  }
  return { alan, op: opEt, deger: value };
}

/** HTTP sürüm seçenekleri. */
const HTTP_VERSIONS = ["h2", "h3", "http/1.1"];

export function KurallarIstemci({ dil, sites, rules: ilk, plan = "pro" }: { dil: Dil; sites: { id: string; name: string }[]; rules: Rule[]; plan?: string }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => kurallarCeviri(k, dil);
  const [rules, setRules] = useState(ilk);
  const [modal, setModal] = useState(false);
  const [sablonModal, setSablonModal] = useState(false);
  const [siteFilter, setSiteFilter] = useState(sites[0]?.id || "all");

  const [form, setForm] = useState({ name: "", description: "", field: "score", op: "lt", value: "", action: "challenge", priority: 10 });

  // Topluluk (veya başka modül) "?ekle=<alan>:<deger>" ile gelirse: yeni-kural
  // modalını o IOC için "engelle" ön-dolgusuyla aç. Böylece proaktif engelleme
  // gerçek kural yazımına akar (sessiz no-op değil).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ham = new URLSearchParams(window.location.search).get("ekle");
    if (!ham) return;
    const ayrac = ham.indexOf(":");
    const alan = ayrac > 0 ? ham.slice(0, ayrac) : "ip";
    const deger = ayrac > 0 ? ham.slice(ayrac + 1) : ham;
    const gecerliAlan = (FIELD_KEYS as readonly string[]).includes(alan) ? alan : "ip";
    setForm({
      name: t("kr.proaktifKuralAdi").replace("{deger}", deger),
      description: t("kr.proaktifKuralAciklama"),
      field: gecerliAlan,
      op: "eq",
      value: deger,
      action: "block",
      priority: 5,
    });
    setModal(true);
    // URL'yi temizle (yenilemede modal tekrar açılmasın).
    window.history.replaceState(null, "", window.location.pathname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Alan değişince operatör + değer için makul varsayılan seç (AI alanları eq + ilk seçenek).
  function alanDegistir(field: string) {
    if (field === "aiAgent") setForm((f) => ({ ...f, field, op: "eq", value: AI_AJANLAR[0]?.id || "gptbot" }));
    else if (field === "aiCategory") setForm((f) => ({ ...f, field, op: "eq", value: Object.keys(AI_KATEGORI_ETIKET)[0] }));
    else if (BOOL_FIELDS.has(field)) setForm((f) => ({ ...f, field, op: "eq", value: "true" }));
    else if (field === "httpVersion") setForm((f) => ({ ...f, field, op: "eq", value: HTTP_VERSIONS[0] }));
    else setForm((f) => ({ ...f, field, value: "" }));
  }

  async function sablonEkle(key: string, name: string) {
    if (siteFilter === "all") return;
    try {
      const res = await fetch("/api/rules/template", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteId: siteFilter, key }) });
      if (res.ok) {
        const { rule } = await res.json();
        setRules((p) => [...p, rule]);
        goster({ tip: "basari", baslik: t("kr.toastEklendi"), aciklama: name });
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("kr.toastEklenemedi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("kr.toastBaglantiHatasi") });
    }
  }

  const eklenmisSablonlar = new Set(rules.filter((r) => r.siteId === siteFilter).map((r) => r.name));

  const filtreli = rules.filter((r) => siteFilter === "all" || r.siteId === siteFilter).sort((a, b) => a.priority - b.priority);
  const maxHit = Math.max(...rules.map((r) => r.hits), 1);

  async function toggle(r: Rule) {
    const yeni = !r.enabled;
    setRules((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: yeni } : x)));
    try {
      const res = await fetch(`/api/rules/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: yeni }) });
      if (!res.ok) throw new Error();
      goster({ tip: "basari", baslik: yeni ? t("kr.toastEtkin") : t("kr.toastDurdu") });
    } catch {
      // Başarısızsa iyimser değişikliği geri al ve kullanıcıyı bilgilendir.
      setRules((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: !yeni } : x)));
      goster({ tip: "hata", baslik: t("kr.toastGuncellenemedi") });
    }
  }

  // Önceliği yukarı/aşağı taşı — komşu kuralla priority değerlerini takas et.
  async function tasi(r: Rule, yon: "yukari" | "asagi") {
    const liste = rules.filter((x) => x.siteId === r.siteId).sort((a, b) => a.priority - b.priority);
    const idx = liste.findIndex((x) => x.id === r.id);
    const hedefIdx = yon === "yukari" ? idx - 1 : idx + 1;
    if (hedefIdx < 0 || hedefIdx >= liste.length) return;
    const komsu = liste[hedefIdx];
    const pR = r.priority, pK = komsu.priority;
    setRules((p) => p.map((x) => (x.id === r.id ? { ...x, priority: pK } : x.id === komsu.id ? { ...x, priority: pR } : x)));
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/rules/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority: pK }) }),
        fetch(`/api/rules/${komsu.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority: pR }) }),
      ]);
      if (!a.ok || !b.ok) throw new Error();
    } catch {
      // Sıralama sunucuda değişmediyse iyimser takası geri al.
      setRules((p) => p.map((x) => (x.id === r.id ? { ...x, priority: pR } : x.id === komsu.id ? { ...x, priority: pK } : x)));
      goster({ tip: "hata", baslik: t("kr.toastSiralamaBasarisiz") });
    }
  }

  async function sil(r: Rule) {
    if (r.system) {
      goster({ tip: "hata", baslik: t("kr.toastSistemSilinemez") });
      return;
    }
    const yedek = rules;
    setRules((p) => p.filter((x) => x.id !== r.id));
    try {
      const res = await fetch(`/api/rules/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      goster({ tip: "basari", baslik: t("kr.toastSilindi") });
    } catch {
      setRules(yedek);
      goster({ tip: "hata", baslik: t("kr.toastSilinemedi") });
    }
  }

  const [olusturBusy, setOlusturBusy] = useState(false);

  async function olustur() {
    if (!form.name.trim() || siteFilter === "all" || olusturBusy) return;
    setOlusturBusy(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, siteId: siteFilter }),
      });
      if (res.ok) {
        const { rule } = await res.json();
        setRules((p) => [...p, rule]);
        setModal(false);
        setForm({ name: "", description: "", field: "score", op: "lt", value: "", action: "challenge", priority: 10 });
        goster({ tip: "basari", baslik: t("kr.toastOlusturuldu") });
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        goster({ tip: "hata", baslik: t("kr.toastOlusturulamadi"), aciklama: j.error });
      }
    } catch {
      goster({ tip: "hata", baslik: t("kr.toastBaglantiHatasi") });
    } finally {
      setOlusturBusy(false);
    }
  }

  const kolonlar: Kolon<Rule>[] = [
    {
      baslik: t("kr.kolonOncelik"),
      render: (r) => {
        // Satırın filtreli listedeki konumu — sınırdaki oklar devre dışı görünür.
        const idx = filtreli.findIndex((x) => x.id === r.id);
        const ustDevre = idx <= 0;
        const altDevre = idx < 0 || idx >= filtreli.length - 1;
        return (
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col">
              <button
                onClick={() => tasi(r, "yukari")}
                disabled={ustDevre}
                className="rounded text-slate-300 transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-slate-300"
                title={t("kr.yukariTasi")}
                aria-label={t("kr.yukariTasi")}
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                onClick={() => tasi(r, "asagi")}
                disabled={altDevre}
                className="rounded text-slate-300 transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-slate-300"
                title={t("kr.asagiTasi")}
                aria-label={t("kr.asagiTasi")}
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
            <span className="font-mono text-[12px] text-slate-faint">#{r.priority}</span>
          </div>
        );
      },
    },
    {
      baslik: t("kr.kolonKural"),
      render: (r) => (
        <div className={cn(!r.enabled && "opacity-55")}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-ink">{r.name}</span>
            {r.system && <Lock className="size-3 text-slate-faint" />}
            {!r.enabled && (
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint ring-1 ring-inset ring-line-strong">
                {t("kr.pasif")}
              </span>
            )}
          </div>
          <div className="text-[12px] text-slate-muted">{r.description}</div>
        </div>
      ),
    },
    {
      baslik: t("kr.kolonKosul"),
      render: (r) => {
        const k = kosulEtiket(r.field, r.op, r.value, t);
        const ai = AI_FIELDS.has(r.field);
        return (
          <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-canvas px-2 py-1 font-mono text-[11.5px] ring-1 ring-inset ring-line">
            {ai && <Bot className="size-3 shrink-0 text-brand-500" />}
            <span className="text-slate-muted">{k.alan}</span>
            <span className="text-slate-faint">{k.op}</span>
            <span className="truncate font-semibold text-brand-700">{k.deger}</span>
          </span>
        );
      },
    },
    {
      baslik: t("kr.kolonAksiyon"),
      render: (r) => {
        const A = AKSIYON_IKON[r.action] ?? Flag;
        return (
          <Badge ton={ACTION_TON[r.action]}>
            <A className="size-3" /> {t("kr.action." + r.action)}
          </Badge>
        );
      },
    },
    {
      baslik: t("kr.kolonTetiklenme"),
      render: (r) => {
        const aktifTon = r.action === "block" ? "#dc2626" : r.action === "challenge" ? "#d97706" : "#2f6fed";
        return (
          <div className="flex w-40 items-center gap-2.5">
            <div className={cn("h-8 w-20 shrink-0", (r.hits === 0 || !r.enabled) && "opacity-40")}>
              {r.hits > 0 ? (
                <MiniSpark tohum={r.id + r.name} renk={aktifTon} yukseklik={32} />
              ) : (
                <div className="flex h-full items-center">
                  <div className="h-px w-full bg-line-strong" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1">
                <Ilerleme
                  deger={r.hits > 0 ? Math.max(6, (r.hits / maxHit) * 100) : 0}
                  ton={r.action === "block" ? "danger" : r.action === "challenge" ? "warn" : "brand"}
                />
              </div>
              <span className={cn("block text-right font-mono text-[11px] tabular-nums", r.hits === 0 ? "text-slate-faint" : "text-slate-ink")}>
                {r.hits.toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
        );
      },
    },
    { baslik: t("kr.kolonDurum"), render: (r) => <Toggle on={r.enabled} onChange={() => toggle(r)} /> },
    {
      baslik: "",
      render: (r) => <SatirMenu aksiyonlar={[{ ad: r.system ? t("kr.kilitli") : t("kr.sil"), onClick: () => sil(r), tehlike: !r.system }]} />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        baslik={t("kr.baslik")}
        aciklama={t("kr.aciklama")}
        aksiyon={
          <>
            <Button variant="outline" size="sm" onClick={() => setSablonModal(true)} disabled={siteFilter === "all"}>
              <Sparkles className="size-4" /> {t("kr.sablonlar")}
            </Button>
            <Button size="sm" onClick={() => setModal(true)} disabled={siteFilter === "all"}>
              <Plus className="size-4" /> {t("kr.yeniKural")}
            </Button>
          </>
        }
      />

      <PlanKilit
        plan={plan}
        ozellik="kural_motoru"
        aciklama="Gelişmiş kural motoru Pro planında açılır. Koşullu eylemler, öncelik sıralaması ve site-bazlı özel kurallar tanımlamak için yükseltin."
      >
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-slate-muted">{t("kr.site")}</span>
        <select aria-label={t("kr.siteSec")} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="h-9 rounded-xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-400">
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {filtreli.length > 0 && <KuralAnalitigi rules={filtreli} t={t} />}

      {filtreli.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <BosDurum
            ikon={<GitBranch className="size-8" />}
            baslik={t("kr.bosBaslik")}
            aciklama={t("kr.bosAciklama")}
            aksiyon={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => setSablonModal(true)} disabled={siteFilter === "all"}><Sparkles className="size-4" /> {t("kr.sablonlardanBasla")}</Button>
                <Button size="sm" variant="outline" onClick={() => setModal(true)} disabled={siteFilter === "all"}><Plus className="size-4" /> {t("kr.sifirdanKural")}</Button>
              </div>
            }
          />
          {/* Zengin boş-durum: hızlı-uygula şablon önizleme kartları */}
          {siteFilter !== "all" && (
            <div className="border-t border-line px-6 py-5">
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                <Sparkles className="size-3.5 text-brand-500" /> {t("kr.bosOnerilen")}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {RULE_TEMPLATES.slice(0, 6).map((sb, i) => {
                  const tur = ALAN_TUR[sb.field] ?? TUR_VARSAYILAN;
                  const T = tur.ikon;
                  return (
                    <motion.button
                      key={sb.key}
                      initial={{ y: 8 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => sablonEkle(sb.key, sb.name)}
                      className="group flex items-start gap-3 rounded-xl border border-line bg-canvas/50 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `${tur.renk}18`, color: tur.renk }}>
                        <T className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-medium text-slate-ink">{sb.name}</span>
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-muted">{sb.description}</div>
                        <div className="mt-1.5">
                          <Badge ton={ACTION_TON[sb.action]}>
                            {(() => { const A = AKSIYON_IKON[sb.action] ?? Flag; return <A className="size-3" />; })()}
                            {t("kr.action." + sb.action)}
                          </Badge>
                        </div>
                      </div>
                      <Plus className="size-4 shrink-0 text-slate-faint transition group-hover:text-brand-600" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Tablo kolonlar={kolonlar} veri={filtreli} />
      )}

      {siteFilter !== "all" && <KuralPlayground siteId={siteFilter} kuralSayisi={filtreli.filter((r) => r.enabled).length} t={t} goster={goster} />}
      </PlanKilit>

      <Modal acik={modal} kapat={() => setModal(false)} baslik={t("kr.modalBaslik")} aciklama={t("kr.modalAciklama")} genislik="max-w-xl">
        <div className="space-y-4">
          <Alan etiket={t("kr.alanKuralAdi")}>
            <Girdi value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("kr.phKuralAdi")} autoFocus />
          </Alan>
          <Alan etiket={t("kr.alanAciklama")} opsiyonel>
            <Alan2 rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("kr.phAciklama")} />
          </Alan>
          <div className="grid grid-cols-3 gap-3">
            <Alan etiket={t("kr.alanAlan")}>
              <Secim value={form.field} onChange={(e) => alanDegistir(e.target.value)}>
                <optgroup label={t("kr.optgAgIstek")}>
                  {["ip", "country", "asn", "ua", "path", "score", "botClass", "rate"].map((k) => <option key={k} value={k}>{t("kr.field." + k)}</option>)}
                </optgroup>
                <optgroup label={t("kr.optgAiParmak")}>
                  {["aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"].map((k) => <option key={k} value={k}>{t("kr.field." + k)}</option>)}
                </optgroup>
              </Secim>
            </Alan>
            <Alan etiket={t("kr.alanOperator")}>
              <Secim value={form.op} onChange={(e) => setForm({ ...form, op: e.target.value })} disabled={BOOL_FIELDS.has(form.field)}>
                {OP_KEYS.map((k) => <option key={k} value={k}>{t("kr.op." + k)}</option>)}
              </Secim>
            </Alan>
            <Alan etiket={t("kr.alanDeger")}>
              {form.field === "aiAgent" ? (
                <Secim value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}>
                  {AI_AJANLAR.map((a) => <option key={a.id} value={a.id}>{a.urun} ({a.operator})</option>)}
                </Secim>
              ) : form.field === "aiCategory" ? (
                <Secim value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}>
                  {Object.entries(AI_KATEGORI_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Secim>
              ) : BOOL_FIELDS.has(form.field) ? (
                <Secim value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}>
                  <option value="true">{t("kr.evet")}</option>
                  <option value="false">{t("kr.hayir")}</option>
                </Secim>
              ) : form.field === "httpVersion" ? (
                <Secim value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}>
                  {HTTP_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </Secim>
              ) : (
                <Girdi value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={t("kr.phDeger")} />
              )}
            </Alan>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket={t("kr.alanAksiyon")}>
              <Secim value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                {ACTION_KEYS.map((k) => <option key={k} value={k}>{t("kr.action." + k)}</option>)}
              </Secim>
            </Alan>
            <Alan etiket={t("kr.alanOncelik")}>
              <Girdi type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </Alan>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>{t("kr.iptal")}</Button>
            <Button onClick={olustur} disabled={!form.name.trim() || olusturBusy}>
              <Zap className="size-4" /> {olusturBusy ? t("kr.olusturuluyor") : t("kr.kuraliOlustur")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Şablon galerisi */}
      <Modal acik={sablonModal} kapat={() => setSablonModal(false)} baslik={t("kr.sablonModalBaslik")} aciklama={t("kr.sablonModalAciklama")} genislik="max-w-2xl">
        <div className="space-y-2.5">
          {RULE_TEMPLATES.map((sb) => {
            const ekli = eklenmisSablonlar.has(sb.name);
            return (
              <div key={sb.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-ink">{sb.name}</span>
                    <Badge ton="gri">{KATEGORI_ETIKET[sb.kategori]}</Badge>
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-muted">{sb.description}</div>
                </div>
                {ekli ? (
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-ok"><Check className="size-4" /> {t("kr.ekli")}</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => sablonEkle(sb.key, sb.name)}>
                    <Plus className="size-3.5" /> {t("kr.ekle")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- Analitik */

/** Üst KPI şeridindeki tek büyük metrik kutusu. */
function KpiKutu({
  etiket, deger, alt, ikon, tonSoft, tonText, delta, gecikme = 0,
}: {
  etiket: string; deger: string; alt?: string;
  ikon: React.ReactNode; tonSoft: string; tonText: string;
  delta?: { yon: "up" | "down"; metin: string; iyi: boolean }; gecikme?: number;
}) {
  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-xl" style={{ background: tonSoft, color: tonText }}>
          {ikon}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
              delta.iyi ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2",
            )}
          >
            <TrendingUp className={cn("size-3", delta.yon === "down" && "rotate-180")} />
            {delta.metin}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-[26px] font-bold leading-none tracking-tight text-slate-ink num">{deger}</div>
        <div className="mt-1.5 text-[12px] font-medium text-slate-muted">{etiket}</div>
        {alt && <div className="mt-0.5 text-[11px] text-slate-faint">{alt}</div>}
      </div>
    </motion.div>
  );
}

/**
 * Kural etkinliği paneli: ferah KPI şeridi + aksiyon/tür dağılım donutları +
 * en çok tetiklenen kurallar. Tümü verili site kurallarından (hits) türetilir.
 */
function KuralAnalitigi({ rules, t }: { rules: Rule[]; t: (k: string) => string }) {
  const aktif = rules.filter((r) => r.enabled);
  const toplamHit = rules.reduce((s, r) => s + r.hits, 0);
  const engelHit = rules.filter((r) => r.action === "block").reduce((s, r) => s + r.hits, 0);
  const dogrulaHit = rules.filter((r) => r.action === "challenge").reduce((s, r) => s + r.hits, 0);
  const izinHit = rules.filter((r) => r.action === "allow").reduce((s, r) => s + r.hits, 0);
  const aiKurallar = rules.filter((r) => AI_FIELDS.has(r.field) || r.field === "botClass");
  const aiHit = aiKurallar.reduce((s, r) => s + r.hits, 0);
  const aiPay = toplamHit ? Math.round((aiHit / toplamHit) * 100) : 0;
  const kacan = izinHit + rules.filter((r) => r.action === "flag").reduce((s, r) => s + r.hits, 0);

  const enCok = [...rules].filter((r) => r.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 5);
  const maxHit = Math.max(...enCok.map((r) => r.hits), 1);
  const enEtkili = enCok[0] ?? null;

  // Aksiyon dağılımı (tetiklenmeye göre) — donut segmentleri.
  const aksiyonSeg = (["block", "challenge", "allow", "flag"] as const)
    .map((a) => ({ etiket: t("kr.action." + a), deger: rules.filter((r) => r.action === a).reduce((s, r) => s + r.hits, 0), renk: AKSIYON_RENK[a] }))
    .filter((s) => s.deger > 0);

  // Kural türü dağılımı (kural SAYISINA göre) — donut segmentleri.
  const turSayac = new Map<string, { deger: number; renk: string }>();
  for (const r of rules) {
    const tur = ALAN_TUR[r.field] ?? TUR_VARSAYILAN;
    const mevcut = turSayac.get(tur.anahtar);
    if (mevcut) mevcut.deger += 1;
    else turSayac.set(tur.anahtar, { deger: 1, renk: tur.renk });
  }
  const turSeg = [...turSayac.entries()]
    .map(([anahtar, v]) => ({ etiket: t("kr.tur." + anahtar), deger: v.deger, renk: v.renk }))
    .sort((a, b) => b.deger - a.deger);

  const kartlar = [
    { etiket: t("kr.anToplamKural"), deger: rules.length.toLocaleString("tr-TR"), alt: t("kr.anAktifPasif").replace("{a}", String(aktif.length)).replace("{p}", String(rules.length - aktif.length)), ikon: <Layers className="size-4.5" />, tonSoft: "#eaf1fe", tonText: "#2f6fed" },
    { etiket: t("kr.anAktifKural"), deger: aktif.length.toLocaleString("tr-TR"), alt: t("kr.anGuvenlikAcik"), ikon: <ShieldCheck className="size-4.5" />, tonSoft: "#e7f6ec", tonText: "#16a34a", delta: { yon: "up" as const, metin: "%100", iyi: true } },
    { etiket: t("kr.anToplamTetiklenme"), deger: kisaSayi(toplamHit), alt: t("kr.anSon24"), ikon: <Zap className="size-4.5" />, tonSoft: "#fdf1e3", tonText: "#d97706", delta: { yon: "up" as const, metin: "%12", iyi: true } },
    { etiket: t("kr.anKacanIstek"), deger: kisaSayi(kacan), alt: t("kr.anIzinIsaret"), ikon: <ShieldAlert className="size-4.5" />, tonSoft: "#fdeaea", tonText: "#dc2626", delta: { yon: "down" as const, metin: "%4", iyi: true } },
    { etiket: t("kr.anAiPay"), deger: `%${aiPay}`, alt: t("kr.anAiKuralSayi").replace("{n}", String(aiKurallar.length)), ikon: <Bot className="size-4.5" />, tonSoft: "#fce8f1", tonText: "#db2777" },
  ];

  return (
    <div className="space-y-4">
      {/* Ferah KPI şeridi */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kartlar.map((k, i) => (
          <KpiKutu key={k.etiket} {...k} gecikme={i * 0.04} />
        ))}
      </div>

      {/* Dağılım donutları — aksiyon + tür (FARKLI görsel dil) */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-danger-soft text-danger2"><Ban className="size-4" /></span>
            <h3 className="text-sm font-semibold text-slate-ink">{t("kr.anAksiyonDagilim")}</h3>
          </div>
          {aksiyonSeg.length > 0 ? (
            <DonutDagilim segmentler={aksiyonSeg} />
          ) : (
            <div className="grid h-40 place-items-center text-[13px] text-slate-faint">{t("kr.anHenuzYok")}</div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Layers className="size-4" /></span>
            <h3 className="text-sm font-semibold text-slate-ink">{t("kr.anTurDagilim")}</h3>
          </div>
          {turSeg.length > 0 ? (
            <DonutDagilim segmentler={turSeg} />
          ) : (
            <div className="grid h-40 place-items-center text-[13px] text-slate-faint">{t("kr.anHenuzYok")}</div>
          )}
        </div>

        {/* En etkili kural öne çıkan kart */}
        <div className="flex flex-col rounded-2xl border border-line bg-gradient-to-br from-brand-50/60 to-surface p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white"><TrendingUp className="size-4" /></span>
            <h3 className="text-sm font-semibold text-slate-ink">{t("kr.anEnEtkili")}</h3>
          </div>
          {enEtkili ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-1.5">
                {(() => { const T = (ALAN_TUR[enEtkili.field] ?? TUR_VARSAYILAN).ikon; return <T className="size-3.5 shrink-0 text-brand-600" />; })()}
                <span className="truncate text-[15px] font-semibold text-slate-ink">{enEtkili.name}</span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-[12px] text-slate-muted">{enEtkili.description}</div>
              <div className="mt-auto pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold tabular-nums text-slate-ink num">{enEtkili.hits.toLocaleString("tr-TR")}</div>
                    <div className="text-[11px] text-slate-faint">{t("kr.anTetiklenme")}</div>
                  </div>
                  <Badge ton={ACTION_TON[enEtkili.action]}>
                    {(() => { const A = AKSIYON_IKON[enEtkili.action] ?? Flag; return <A className="size-3" />; })()}
                    {t("kr.action." + enEtkili.action)}
                  </Badge>
                </div>
                <div className="mt-3 h-8">
                  <MiniSpark tohum={enEtkili.id + "hero"} renk={AKSIYON_RENK[enEtkili.action]} yukseklik={32} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 place-items-center text-center text-[13px] text-slate-faint">{t("kr.anHenuzYok")}</div>
          )}
        </div>
      </div>

      {/* En çok tetiklenen 5 kural */}
      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><BarChart3 className="size-4" /></span>
          <h3 className="text-sm font-semibold text-slate-ink">{t("kr.anEnCok")}</h3>
          <span className="ml-auto text-[12px] text-slate-faint">{t("kr.anAltbilgi").replace("{dogrulama}", dogrulaHit.toLocaleString("tr-TR")).replace("{ai}", String(aiKurallar.length))}</span>
        </div>
        <div className="p-5">
          {enCok.length === 0 ? (
            <div className="text-[13px] text-slate-faint">{t("kr.anHenuzYok")}</div>
          ) : (
            <div className="space-y-3">
              {enCok.map((r, i) => {
                const tur = ALAN_TUR[r.field] ?? TUR_VARSAYILAN;
                const T = tur.ikon;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ y: 6 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold tabular-nums" style={{ background: `${tur.renk}18`, color: tur.renk }}>
                      {i + 1}
                    </span>
                    <div className="flex w-40 shrink-0 items-center gap-1.5 truncate text-[13px] text-slate-ink sm:w-52">
                      <T className="size-3 shrink-0" style={{ color: tur.renk }} />
                      <span className="truncate font-medium">{r.name}</span>
                    </div>
                    <div className="flex-1"><Ilerleme deger={(r.hits / maxHit) * 100} ton={r.action === "block" ? "danger" : r.action === "challenge" ? "warn" : "brand"} /></div>
                    <span className="w-16 shrink-0 text-right font-mono text-[12px] tabular-nums text-slate-muted">{r.hits.toLocaleString("tr-TR")}</span>
                    <Badge ton={ACTION_TON[r.action]}>
                      {(() => { const A = AKSIYON_IKON[r.action] ?? Flag; return <A className="size-3" />; })()}
                      {t("kr.action." + r.action)}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kısa Türkçe sayı biçimi (B/Mn) — büyük tetiklenme sayıları için. */
function kisaSayi(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(a % 1_000_000 ? 1 : 0).replace(".", ",") + "Mn";
  if (a >= 1_000) return (n / 1_000).toFixed(a % 1_000 ? 1 : 0).replace(".", ",") + "B";
  return n.toLocaleString("tr-TR");
}

/* ---------------------------------------------------------------- Playground */
function KuralPlayground({ siteId, kuralSayisi, t, goster }: { siteId: string; kuralSayisi: number; t: (k: string) => string; goster: ReturnType<typeof useToast>["goster"] }) {
  const [senaryo, setSenaryo] = useState({ ip: "185.220.101.5", country: "RU", asn: "AS9009 M247 (VPN)", ua: "python-requests/2.31", path: "/login", score: 0.15, botClass: "automation", headless: false, tlsMismatch: false });
  const [sonuc, setSonuc] = useState<{ action: string; decidedBy: { ruleName: string } | null; matched: { ruleName: string; action: string }[]; evaluated: number; sinyaller?: { aiAgentId: string; aiCategory: string; headless: boolean; tlsUaUyumsuz: boolean; httpVersion: string } } | null>(null);
  const [test, setTest] = useState(false);

  const PRESETLER = [
    { ad: t("kr.presetVpnBotu"), v: { ip: "185.220.101.5", country: "RU", asn: "AS9009 M247 (VPN)", ua: "python-requests/2.31", path: "/login", score: 0.12, botClass: "automation", headless: false, tlsMismatch: true } },
    { ad: t("kr.presetGercekInsan"), v: { ip: "88.240.12.4", country: "TR", asn: "AS9121 Turk Telekom", ua: "Mozilla/5.0 Chrome/124", path: "/", score: 0.88, botClass: "human", headless: false, tlsMismatch: false } },
    { ad: "GPTBot", v: { ip: "20.15.240.10", country: "US", asn: "AS8075 Microsoft", ua: "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)", path: "/api/products", score: 0.3, botClass: "ai_agent", headless: false, tlsMismatch: false } },
    { ad: "ChatGPT-User", v: { ip: "20.15.240.11", country: "US", asn: "AS8075 Microsoft", ua: "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)", path: "/blog/post", score: 0.4, botClass: "ai_agent", headless: false, tlsMismatch: false } },
    { ad: t("kr.presetHeadlessAjan"), v: { ip: "159.203.10.4", country: "US", asn: "AS14061 DigitalOcean", ua: "Mozilla/5.0 HeadlessChrome/124", path: "/checkout", score: 0.35, botClass: "automation", headless: true, tlsMismatch: false } },
    { ad: "Googlebot", v: { ip: "66.249.66.1", country: "US", asn: "AS15169 Google LLC", ua: "Googlebot/2.1", path: "/", score: 0.5, botClass: "good_bot", headless: false, tlsMismatch: false } },
  ];

  async function calistir() {
    if (test) return;
    setTest(true);
    try {
      const res = await fetch("/api/rules/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteId, ...senaryo }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSonuc(data);
    } catch {
      goster({ tip: "hata", baslik: t("kr.pgSimBasarisiz") });
    } finally {
      setTest(false);
    }
  }

  const ACTION_TON: Record<string, "yesil" | "sari" | "kirmizi" | "gri"> = { allow: "yesil", challenge: "sari", block: "kirmizi", flag: "gri" };

  return (
    <div className="mt-2 rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Zap className="size-4" /></span>
          <h3 className="text-sm font-semibold text-slate-ink">{t("kr.pgBaslik")}</h3>
        </div>
        <span className="text-[12px] text-slate-faint">{t("kr.pgAktifKural").replace("{n}", String(kuralSayisi))}</span>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-[12px] font-medium text-slate-muted">{t("kr.pgHazirSenaryolar")}</div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PRESETLER.map((p) => (
              <button key={p.ad} onClick={() => { setSenaryo(p.v); setSonuc(null); }} className="rounded-full border border-line-strong px-3 py-1.5 text-[12px] text-slate-muted transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                {p.ad}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Alan etiket={t("kr.field.ua")}><Girdi value={senaryo.ua} onChange={(e) => setSenaryo({ ...senaryo, ua: e.target.value })} placeholder="GPTBot/1.1 / HeadlessChrome / Mozilla…" /></Alan>
            </div>
            <Alan etiket={t("kr.field.ip")}><Girdi value={senaryo.ip} onChange={(e) => setSenaryo({ ...senaryo, ip: e.target.value })} /></Alan>
            <Alan etiket={t("kr.field.country")}><Girdi value={senaryo.country} onChange={(e) => setSenaryo({ ...senaryo, country: e.target.value })} /></Alan>
            <Alan etiket={t("kr.field.asn")}><Girdi value={senaryo.asn} onChange={(e) => setSenaryo({ ...senaryo, asn: e.target.value })} /></Alan>
            <Alan etiket={t("kr.field.path")}><Girdi value={senaryo.path} onChange={(e) => setSenaryo({ ...senaryo, path: e.target.value })} /></Alan>
            <Alan etiket={t("kr.field.score")}><Girdi type="number" step="0.05" min="0" max="1" value={senaryo.score} onChange={(e) => setSenaryo({ ...senaryo, score: parseFloat(e.target.value) })} /></Alan>
            <Alan etiket={t("kr.field.botClass")}>
              <Secim value={senaryo.botClass} onChange={(e) => setSenaryo({ ...senaryo, botClass: e.target.value })}>
                {["human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam"].map((b) => <option key={b} value={b}>{b}</option>)}
              </Secim>
            </Alan>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 text-[13px] text-slate-muted">
              <Toggle on={senaryo.headless} onChange={() => setSenaryo({ ...senaryo, headless: !senaryo.headless })} /> {t("kr.pgHeadlessZorla")}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-muted">
              <Toggle on={senaryo.tlsMismatch} onChange={() => setSenaryo({ ...senaryo, tlsMismatch: !senaryo.tlsMismatch })} /> {t("kr.pgTlsUyumsuz")}
            </label>
          </div>
          <Button className="mt-4 w-full" onClick={calistir} disabled={test}>
            <Zap className="size-4" /> {test ? t("kr.pgDegerlendiriliyor") : t("kr.pgCalistir")}
          </Button>
        </div>

        <div className="rounded-xl border border-line bg-canvas/40 p-5">
          {sonuc ? (
            <div>
              <div className="mb-4 text-center">
                <div className="text-[12px] text-slate-muted">{t("kr.pgNihaiKarar")}</div>
                <div className="mt-2">
                  <Badge ton={ACTION_TON[sonuc.action]}>
                    <span className="text-[15px] font-bold">{t("kr.action." + sonuc.action)}</span>
                  </Badge>
                </div>
                {sonuc.decidedBy && <div className="mt-2 text-[13px] text-slate-muted">{t("kr.pgKarar")} <span className="font-medium text-slate-ink">{sonuc.decidedBy.ruleName}</span></div>}
                {!sonuc.decidedBy && <div className="mt-2 text-[13px] text-slate-muted">{t("kr.pgEslesmedi")}</div>}
              </div>
              {sonuc.sinyaller && (
                <div className="mb-4 flex flex-wrap justify-center gap-1.5 border-t border-line pt-4">
                  {sonuc.sinyaller.aiAgentId && (
                    <Badge ton="mavi"><Bot className="size-3" /> {AI_AJANLAR.find((a) => a.id === sonuc.sinyaller!.aiAgentId)?.urun || sonuc.sinyaller.aiAgentId}</Badge>
                  )}
                  {sonuc.sinyaller.aiCategory && (
                    <Badge ton="gri">{AI_KATEGORI_ETIKET[sonuc.sinyaller.aiCategory as keyof typeof AI_KATEGORI_ETIKET] || sonuc.sinyaller.aiCategory}</Badge>
                  )}
                  {sonuc.sinyaller.headless && <Badge ton="kirmizi">{t("kr.field.headless")}</Badge>}
                  {sonuc.sinyaller.tlsUaUyumsuz && <Badge ton="kirmizi">{t("kr.pgTlsUyumsuz")}</Badge>}
                  <Badge ton="gri">{sonuc.sinyaller.httpVersion}</Badge>
                </div>
              )}
              <div className="border-t border-line pt-4">
                <div className="mb-2 text-[12px] font-medium text-slate-muted">{t("kr.pgIz").replace("{n}", String(sonuc.evaluated))}</div>
                {sonuc.matched.length === 0 ? (
                  <div className="text-[13px] text-slate-faint">{t("kr.pgHicbiriEslesmedi")}</div>
                ) : (
                  <div className="space-y-1.5">
                    {sonuc.matched.map((m, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px]">
                        <span className="text-slate-ink">{m.ruleName}</span>
                        <Badge ton={ACTION_TON[m.action]}>{t("kr.action." + m.action)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><Zap className="size-6" /></span>
              <p className="mt-3 max-w-[220px] text-[13px] text-slate-muted">{t("kr.pgBosMesaj")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
