"use client";

import { useState } from "react";
import { Search, ShieldCheck, Radar, EyeOff, Sparkles, Copy, Check, FileJson, Code2, Play, Terminal } from "lucide-react";
import { Panel, Secim, useToast } from "@/components/panel/kit";
import { MarkaLogo } from "@/components/panel/MarkaLogo";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { testAlaniCeviri } from "./test-alani.i18n";

interface Site { id: string; name: string; siteKey: string; secretKey: string }

/* Endpoint sekmeleri — metot/uc veri olarak kalır; ad/açıklama çeviri anahtarıdır. */
const SEKMELER = [
  { key: "challenge", adKey: "ta.sekme.challenge.ad", icon: Search, uc: "/api/v1/challenge", metot: "POST", aciklamaKey: "ta.sekme.challenge.aciklama" },
  { key: "verify", adKey: "ta.sekme.verify.ad", icon: ShieldCheck, uc: "/api/v1/verify", metot: "POST", aciklamaKey: "ta.sekme.verify.aciklama" },
  { key: "passive", adKey: "ta.sekme.passive.ad", icon: EyeOff, uc: "/api/v1/passive", metot: "POST", aciklamaKey: "ta.sekme.passive.aciklama" },
  { key: "siteverify", adKey: "ta.sekme.siteverify.ad", icon: Radar, uc: "/api/v1/siteverify", metot: "POST", aciklamaKey: "ta.sekme.siteverify.aciklama" },
] as const;

/* Kod dilleri — ad/marka veri (dil adları çevrilmez). */
const DILLER = [
  { key: "python", ad: "Python", marka: "python" },
  { key: "javascript", ad: "JavaScript", marka: "javascript" },
  { key: "shell", ad: "cURL", marka: "curl" },
] as const;

export function TestAlaniIstemci({ dil, sites }: { dil: Dil; sites: Site[] }) {
  const t = (k: string) => testAlaniCeviri(k, dil);
  const { goster } = useToast();
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]["key"]>("challenge");
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [kodDil, setKodDil] = useState<(typeof DILLER)[number]["key"]>("python");
  const [sekmeIcerik, setSekmeIcerik] = useState<"code" | "response">("code");
  const [yanit, setYanit] = useState<string>("");
  const [durum, setDurum] = useState<{ kod: number; sure: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  const site = sites.find((s) => s.id === siteId);
  const aktifSekme = SEKMELER.find((s) => s.key === sekme)!;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://veylify.com";

  const kod = kodUret(kodDil, aktifSekme.uc, site?.siteKey || "pk_live_...", site?.secretKey || "sk_live_...", origin);
  const gosterilecek = sekmeIcerik === "code" ? kod : yanit || t("ta.yanitBekleniyor");

  function kopyala() {
    navigator.clipboard.writeText(sekmeIcerik === "code" ? kod : yanit);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: t("ta.toast.panoyaKopyalandi") });
    setTimeout(() => setKopyalandi(false), 1600);
  }

  async function gonder() {
    if (!site) return;
    setBusy(true);
    setSekmeIcerik("response");
    const t0 = performance.now();
    try {
      let body: Record<string, unknown> = {};
      if (sekme === "challenge") body = { siteKey: site.siteKey };
      else if (sekme === "passive") body = { siteKey: site.siteKey, signals: { mouseSamples: 40, keyIntervals: [130, 180, 110], timeToSubmit: 2400, focusEvents: 1 } };
      else if (sekme === "verify") {
        // önce gerçek challenge al, cevabı türet
        const chal = await (await fetch(`${origin}/api/v1/challenge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteKey: site.siteKey }) })).json();
        const cevap = deriveAnswer(chal.params.seed, chal.params.length);
        body = { siteKey: site.siteKey, token: chal.token, input: cevap, signals: { mouseSamples: 40, keyIntervals: [130, 180, 110, 150], timeToSubmit: 3000, focusEvents: 1 } };
      } else if (sekme === "siteverify") {
        body = { secret: site.secretKey, response: "<verification_token>" };
      }
      const res = await fetch(`${origin}${aktifSekme.uc}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setYanit(JSON.stringify(data, null, 2));
      setDurum({ kod: res.status, sure: Math.round(performance.now() - t0) });
      goster({ tip: res.ok ? "basari" : "hata", baslik: res.ok ? t("ta.toast.istekBasarili") : t("ta.toast.istekBasarisiz") });
    } catch {
      setYanit(`{\n  "error": "${t("ta.hata.gonderilemedi")}"\n}`);
      setDurum({ kod: 0, sure: Math.round(performance.now() - t0) });
      goster({ tip: "hata", baslik: t("ta.toast.baglantiHatasi") });
    }
    setBusy(false);
  }

  const durumTonu = durum ? (durum.kod >= 200 && durum.kod < 300 ? "ok" : "err") : null;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 pt-6 pb-10 lg:grid-cols-2 lg:px-10">
      {/* sol: form */}
      <Panel padding>
        {/* sekmeler */}
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl bg-canvas p-1.5">
          {SEKMELER.map((s) => {
            const Icon = s.icon;
            const aktif = sekme === s.key;
            return (
              <button key={s.key} onClick={() => { setSekme(s.key); setSekmeIcerik("code"); }} className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition", aktif ? "bg-surface text-brand-700 shadow-card" : "text-slate-muted hover:text-slate-ink")}>
                <Icon className="size-4" /> {t(s.adKey)}
              </button>
            );
          })}
        </div>

        {/* metot + endpoint çubuğu */}
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-line bg-canvas px-3 py-2.5">
          <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">{aktifSekme.metot}</span>
          <code className="num truncate text-[13px] text-slate-ink">{aktifSekme.uc}</code>
        </div>

        <p className="mb-5 text-sm text-slate-muted">{t(aktifSekme.aciklamaKey)}</p>

        <label className="mb-1.5 block text-sm font-semibold text-slate-ink">{t("ta.siteAnahtari")}</label>
        <Secim value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mb-5">
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Secim>

        {sekme !== "siteverify" && (
          <>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-ink">
              {t("ta.istekGovdesi")} <span className="rounded-md bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger2">{t("ta.otomatik")}</span>
            </label>
            <div className="mb-5 rounded-2xl border border-line bg-canvas p-4 num text-[12px] leading-relaxed text-slate-muted">
              {sekme === "challenge" && `{ "siteKey": "${site?.siteKey?.slice(0, 16) || "pk_live_"}…" }`}
              {sekme === "passive" && `{ "siteKey": "…", "signals": { mouseSamples, keyIntervals, … } }`}
              {sekme === "verify" && `{ "siteKey": "…", "token": "…", "input": "…", "signals": {…} }`}
            </div>
          </>
        )}

        <button
          onClick={gonder}
          disabled={busy || !site}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 text-[15px] font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
        >
          {busy ? t("ta.gonderiliyor") : <><Play className="size-4" /> {t("ta.istekGonder")}</>}
        </button>
      </Panel>

      {/* sağ: kod / yanıt */}
      <Panel padding={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="size-[18px] text-slate-muted" />
            <h3 className="text-[17px] font-bold text-slate-ink">{t("ta.ornekIstek")}</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-canvas p-1">
            <button onClick={() => setSekmeIcerik("code")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition", sekmeIcerik === "code" ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted")}>
              <Code2 className="size-3.5" /> {t("ta.kod")}
            </button>
            <button onClick={() => setSekmeIcerik("response")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition", sekmeIcerik === "response" ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted")}>
              <FileJson className="size-3.5" /> {t("ta.yanit")}
            </button>
          </div>
        </div>

        {sekmeIcerik === "code" && (
          <div className="px-6 pb-3">
            <div className="flex gap-1.5">
              {DILLER.map((d) => (
                <button key={d.key} onClick={() => setKodDil(d.key)} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition", kodDil === d.key ? "border-brand-200 bg-brand-50 text-brand-700" : "border-transparent text-slate-muted hover:bg-canvas")}>
                  <MarkaLogo ad={d.marka} size={17} /> {d.ad}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950">
            {/* kod bloğu üst çubuğu — pencere noktaları + kopyala */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                {sekmeIcerik === "code" ? (
                  <>
                    <MarkaLogo ad={DILLER.find((d) => d.key === kodDil)!.marka} size={15} />
                    <span className="text-[12px] font-medium text-white/60">{DILLER.find((d) => d.key === kodDil)!.ad}</span>
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                    <MarkaLogo ad="http" size={15} /> {t("ta.yanitGovdesi")}
                  </span>
                )}
                {sekmeIcerik === "response" && durum && (
                  <span className={cn("num ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", durumTonu === "ok" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>
                    {durum.kod || "ERR"} · {durum.sure}ms
                  </span>
                )}
              </div>
              <button onClick={kopyala} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition hover:bg-white/20">
                {kopyalandi ? <><Check className="size-3.5 text-emerald-300" /> {t("ta.kopyalandi")}</> : <><Copy className="size-3.5" /> {t("ta.kopyala")}</>}
              </button>
            </div>
            <pre className="max-h-[520px] overflow-auto p-5 text-[12.5px] leading-relaxed">
              <code className={cn("font-mono", sekmeIcerik === "code" ? "text-[#dbe4f0]" : "text-emerald-300")}>
                {gosterilecek}
              </code>
            </pre>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function kodUret(dil: string, uc: string, pk: string, sk: string, origin: string): string {
  if (dil === "python") {
    return `# pip install requests
import requests

res = requests.post("${origin}${uc}", json={
    "siteKey": "${pk}",
})
print(res.json())`;
  }
  if (dil === "javascript") {
    return `const res = await fetch("${origin}${uc}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ siteKey: "${pk}" }),
});
console.log(await res.json());`;
  }
  return `curl -X POST ${origin}${uc} \\
  -H "Content-Type: application/json" \\
  -d '{"siteKey":"${pk}"}'`;
}

// widget/motor ile birebir — verify testi için cevap türetme
function deriveAnswer(seed: number, len: number): string {
  const CH = "34679ACDEFHJKLMNPRTUVWXY";
  let a = (seed ^ 0x9e3779b9) >>> 0;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let o = "";
  for (let i = 0; i < len; i++) o += CH[Math.floor(next() * CH.length)];
  return o;
}

export { Sparkles };
