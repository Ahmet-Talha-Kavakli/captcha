"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FlaskConical, Play, ShieldCheck, ShieldAlert, TrendingUp, TrendingDown,
  Info, ArrowRight, Plus, Trash2, ToggleLeft, ToggleRight, GitCompareArrows, Download, AlertTriangle, Check,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  YAKALAMALAR, sandboxCalistir, DIFF_RENK,
  type SandboxSonuc, type IstekDiff,
} from "@/lib/specter/sandbox";
import type { Rule, RuleAction, RuleField, RuleOp } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { sandboxCeviri } from "./sandbox.i18n";

/** Taslak kural — canlı Rule'un düzenlenebilir kopyası + kaynak işareti. */
interface TaslakKural extends Rule {
  _yeni?: boolean;
}

const KARAR_TON: Record<SandboxSonuc["karar"], "yesil" | "sari" | "kirmizi"> = {
  dagit: "yesil", dikkatli: "sari", durdur: "kirmizi",
};

const ALAN_SECENEK: RuleField[] = ["botClass", "country", "score", "rate", "path", "asn", "headless", "tlsMismatch", "ua", "ip"];
const OP_SECENEK: RuleOp[] = ["eq", "neq", "contains", "gt", "lt", "in"];
const AKSIYON_SECENEK: RuleAction[] = ["allow", "challenge", "block", "flag"];

export function SandboxIstemci({ dil, bazKurallar }: { dil: Dil; bazKurallar: Rule[] }) {
  const t = (k: string) => sandboxCeviri(k, dil);
  const [yakalamaId, setYakalamaId] = useState(YAKALAMALAR[0].id);
  // Aday = bazın düzenlenebilir kopyası (üretime dokunulmaz).
  const [aday, setAday] = useState<TaslakKural[]>(() => bazKurallar.map((r) => ({ ...r })));
  const [calisti, setCalisti] = useState(false);

  const yakalama = useMemo(() => YAKALAMALAR.find((y) => y.id === yakalamaId)!, [yakalamaId]);

  const sonuc = useMemo<SandboxSonuc | null>(() => {
    if (!calisti) return null;
    return sandboxCalistir(yakalama, bazKurallar, aday.filter((r) => r._yeni ? true : true));
  }, [calisti, yakalama, bazKurallar, aday]);

  const kuralGuncelle = (id: string, yama: Partial<TaslakKural>) =>
    setAday((prev) => prev.map((r) => (r.id === id ? { ...r, ...yama } : r)));
  const kuralSil = (id: string) => setAday((prev) => prev.filter((r) => r.id !== id));
  const kuralEkle = () =>
    setAday((prev) => [
      ...prev,
      {
        id: `taslak-${prev.length}-${prev.reduce((a, r) => a + r.name.length, 0)}`,
        siteId: bazKurallar[0]?.siteId ?? "",
        name: t("editor.yeniKural"), enabled: true, priority: (prev.at(-1)?.priority ?? 0) + 1,
        field: "botClass", op: "eq", value: "scraper", action: "block",
        hits: 0, createdAt: 0, _yeni: true,
      } as TaslakKural,
    ]);
  const sifirla = () => { setAday(bazKurallar.map((r) => ({ ...r }))); setCalisti(false); };

  const degisiklikVar = useMemo(() => {
    if (aday.length !== bazKurallar.length) return true;
    return aday.some((a, i) => {
      const b = bazKurallar[i];
      return !b || a.enabled !== b.enabled || a.field !== b.field || a.op !== b.op || a.value !== b.value || a.action !== b.action;
    });
  }, [aday, bazKurallar]);

  const raporIndir = () => {
    if (!sonuc) return;
    const yakalamaAd = t(`yakalama.${sonuc.yakalamaId}.ad`);
    const satirlar = [
      t("rapor.baslik"),
      `${t("rapor.yakalama")}: ${yakalamaAd} (${sonuc.toplam} ${t("rapor.istek")})`,
      `${t("rapor.karar")}: ${t(`karar.${sonuc.karar}`).toUpperCase()}`,
      ``,
      `${t("rapor.bazEtkinlik")}: %${sonuc.bazEtkinlik}`,
      `${t("rapor.adayEtkinlik")}: %${sonuc.adayEtkinlik}  (${t("rapor.net")} ${sonuc.netDegisim >= 0 ? "+" : ""}${sonuc.netDegisim} ${t("rapor.puan")})`,
      ``,
      `${t("rapor.iyilesme")}: ${sonuc.iyilesme}  ${t("rapor.iyilesmeNot")}`,
      `${t("rapor.regresyon")}: ${sonuc.regresyon}  ${t("rapor.regresyonNot")} ${sonuc.regresyon > 0 ? t("rapor.tehlike") : ""}`,
      `${t("rapor.yanlisPozitif")}: ${sonuc.yanlisPozitif}  ${t("rapor.yanlisPozitifNot")}`,
      ``,
      t("rapor.senaryoKirilimi"),
      ...sonuc.senaryoKirilim.map((s) => `  ${t(`senaryo.${s.senaryo}`)}: ${t("serit.baz").toLowerCase()} ${s.bazDogru}/${s.toplam} → ${t("serit.aday").toLowerCase()} ${s.adayDogru}/${s.toplam}`),
      ``,
      t("rapor.not"),
    ];
    const blob = new Blob([satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sandbox-${sonuc.yakalamaId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklama.1")} <b>{t("serit.aciklama.iki")}</b> {t("serit.aciklama.2")}
            <b> {t("serit.baz")}</b> {t("serit.aciklama.3")} <b>{t("serit.aday")}</b> {t("serit.aciklama.4")} <b>{t("serit.regresyon")}</b> {t("serit.aciklama.5")}
            <b> {t("serit.yanlisPozitif")}</b> {t("serit.aciklama.6")}
          </p>
        </div>
      </div>

      {/* yakalama seçimi + çalıştır */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-slate-muted">{t("sec.yakalama")}</span>
            <select
              value={yakalamaId}
              onChange={(e) => { setYakalamaId(e.target.value); setCalisti(false); }}
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-slate-ink outline-none focus:border-brand-400"
            >
              {YAKALAMALAR.map((y) => (
                <option key={y.id} value={y.id}>{t(`yakalama.${y.id}.ad`)} ({y.istekler.length} {t("sec.istek")})</option>
              ))}
            </select>
          </label>
          <p className="max-w-md pb-1.5 text-[12px] text-slate-faint">{t(`yakalama.${yakalama.id}.aciklama`)}</p>
        </div>
        <div className="flex items-center gap-2">
          {degisiklikVar && <Badge ton="sari">{t("sec.degisiklikVar")}</Badge>}
          <Button variant="ghost" onClick={sifirla}>{t("sec.sifirla")}</Button>
          <Button variant="accent" onClick={() => setCalisti(true)}>
            <Play className="size-4" /> {t("sec.calistir")}
          </Button>
        </div>
      </div>

      {/* iki sütun: taslak editör | sonuç */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Aday kural editörü */}
        <Panel baslik={t("editor.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("editor.aciklama")}</p>
          <div className="space-y-2.5">
            {aday.length === 0 && (
              <p className="rounded-xl bg-canvas/50 px-4 py-6 text-center text-[13px] text-slate-faint">{t("editor.bos")}</p>
            )}
            {aday.map((r) => (
              <div key={r.id} className={cn("rounded-xl border px-3 py-2.5", r.enabled ? "border-line bg-white" : "border-dashed border-line bg-canvas/40 opacity-60")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <button onClick={() => kuralGuncelle(r.id, { enabled: !r.enabled })} title={r.enabled ? t("editor.devreDisi") : t("editor.etkinlestir")} className="shrink-0 text-brand-600">
                      {r.enabled ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5 text-slate-faint" />}
                    </button>
                    <input
                      value={r.name}
                      onChange={(e) => kuralGuncelle(r.id, { name: e.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-slate-ink outline-none"
                    />
                    {r._yeni && <Badge ton="mavi">{t("editor.yeni")}</Badge>}
                    {r.system && <Badge ton="gri">{t("editor.sistem")}</Badge>}
                  </div>
                  <button onClick={() => kuralSil(r.id)} title={t("editor.kaldir")} className="shrink-0 text-slate-faint hover:text-danger2"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="text-slate-faint">{t("editor.eger")}</span>
                  <select value={r.field} onChange={(e) => kuralGuncelle(r.id, { field: e.target.value as RuleField })} className="rounded-lg border border-line bg-white px-1.5 py-1 outline-none">
                    {ALAN_SECENEK.map((f) => <option key={f} value={f}>{t(`alan.${f}`)}</option>)}
                  </select>
                  <select value={r.op} onChange={(e) => kuralGuncelle(r.id, { op: e.target.value as RuleOp })} className="rounded-lg border border-line bg-white px-1.5 py-1 outline-none">
                    {OP_SECENEK.map((o) => <option key={o} value={o}>{t(`op.${o}`)}</option>)}
                  </select>
                  <input value={r.value} onChange={(e) => kuralGuncelle(r.id, { value: e.target.value })} className="w-24 rounded-lg border border-line bg-white px-2 py-1 outline-none" />
                  <span className="text-slate-faint">→</span>
                  <select value={r.action} onChange={(e) => kuralGuncelle(r.id, { action: e.target.value as RuleAction })} className={cn("rounded-lg border border-line px-1.5 py-1 font-medium outline-none", r.action === "block" ? "text-danger2" : r.action === "challenge" ? "text-warn" : r.action === "allow" ? "text-ok" : "text-slate-muted")}>
                    {AKSIYON_SECENEK.map((a) => <option key={a} value={a}>{t(`aksiyon.${a}`)}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button onClick={kuralEkle} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-200 py-2 text-[13px] font-medium text-brand-600 transition hover:bg-brand-50">
            <Plus className="size-4" /> {t("editor.taslakEkle")}
          </button>
        </Panel>

        {/* Sonuç */}
        <div className="space-y-5">
          {!sonuc ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 text-center">
              <GitCompareArrows className="size-9 text-slate-faint" />
              <p className="mt-3 text-[14px] font-medium text-slate-ink">{t("sonuc.bosBaslik")}</p>
              <p className="mt-1 max-w-xs text-[13px] text-slate-muted">{t("sonuc.bosAciklama.1")} <b>{t("sec.calistir")}</b> {t("sonuc.bosAciklama.2")}</p>
            </div>
          ) : (
            <>
              {/* karar bandı */}
              <div className={cn("flex items-center justify-between gap-4 rounded-2xl px-5 py-4", sonuc.karar === "dagit" ? "bg-ok-soft" : sonuc.karar === "dikkatli" ? "bg-warn-soft/50" : "bg-danger-soft")}>
                <div className="flex items-center gap-3">
                  {sonuc.karar === "dagit" ? <ShieldCheck className="size-7 text-ok" /> : sonuc.karar === "dikkatli" ? <AlertTriangle className="size-7 text-warn" /> : <ShieldAlert className="size-7 text-danger2" />}
                  <div>
                    <p className={cn("text-[15px] font-semibold", sonuc.karar === "dagit" ? "text-green-700" : sonuc.karar === "dikkatli" ? "text-amber-700" : "text-red-700")}>{t(`karar.${sonuc.karar}`)}</p>
                    <p className="text-[12.5px] text-slate-muted">
                      {sonuc.karar === "dagit" ? t("karar.dagitAciklama") : sonuc.karar === "dikkatli" ? t("karar.dikkatliAciklama") : sonuc.regresyon > 0 ? t("karar.durdurRegresyon").replace("{n}", String(sonuc.regresyon)) : t("karar.durdurNet")}
                    </p>
                  </div>
                </div>
                <button onClick={raporIndir} className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12.5px] font-medium text-slate-ink transition hover:bg-white">
                  <Download className="size-3.5" /> {t("karar.raporKisa")}
                </button>
              </div>

              {/* etkinlik kıyas */}
              <div className="grid grid-cols-3 gap-3">
                <StatKart sayi={`%${sonuc.bazEtkinlik}`} etiket={t("kart.bazEtkinlik")} ikon={<ShieldCheck className="size-5" />} />
                <StatKart sayi={`%${sonuc.adayEtkinlik}`} etiket={t("kart.adayEtkinlik")} ikon={<FlaskConical className="size-5" />} tone={sonuc.netDegisim >= 0 ? "ok" : "danger"} />
                <StatKart sayi={`${sonuc.netDegisim >= 0 ? "+" : ""}${sonuc.netDegisim}`} etiket={t("kart.netDegisim")} ikon={sonuc.netDegisim >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />} tone={sonuc.netDegisim > 0 ? "ok" : sonuc.netDegisim < 0 ? "danger" : "brand"} />
              </div>

              {/* diff kırılımı */}
              <Panel baslik={t("diffPanel.baslik")}>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["iyilesme", sonuc.iyilesme, "diff.iyilesme.aciklama"],
                    ["regresyon", sonuc.regresyon, "diff.regresyon.aciklama"],
                    ["yanlis-pozitif", sonuc.yanlisPozitif, "diff.yanlisPozitif.aciklama"],
                  ] as const).map(([tur, sayi, aciklamaKey]) => (
                    <div key={tur} className="rounded-xl border border-line px-3 py-2.5" style={{ borderLeftWidth: 3, borderLeftColor: DIFF_RENK[tur] }}>
                      <p className="num text-[26px] font-bold leading-none" style={{ color: DIFF_RENK[tur] }}>{sayi}</p>
                      <p className="mt-1 text-[12px] font-medium text-slate-ink">{t(`diff.${tur}`)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-faint">{t(aciklamaKey)}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>

      {/* senaryo kırılımı + örnek diffler (sonuç varsa) */}
      {sonuc && (
        <>
          <Panel baslik={t("senaryoPanel.baslik")}>
            <div className="space-y-3">
              {sonuc.senaryoKirilim.map((s) => {
                const bazP = Math.round((s.bazDogru / s.toplam) * 100);
                const adayP = Math.round((s.adayDogru / s.toplam) * 100);
                const artis = adayP - bazP;
                return (
                  <div key={s.senaryo}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-slate-ink">{t(`senaryo.${s.senaryo}`)} <span className="text-slate-faint">({s.toplam} {t("senaryoPanel.istek")})</span></span>
                      <span className="flex items-center gap-2">
                        <span className="num text-slate-muted">%{bazP} → <b className={artis > 0 ? "text-ok" : artis < 0 ? "text-danger2" : "text-slate-ink"}>%{adayP}</b></span>
                        {artis !== 0 && <Badge ton={artis > 0 ? "yesil" : "kirmizi"}>{artis > 0 ? "+" : ""}{artis} {t("senaryoPanel.puan")}</Badge>}
                      </span>
                    </div>
                    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full bg-slate-300" style={{ width: `${bazP}%` }} title={`${t("senaryoPanel.baz").toLowerCase()} %${bazP}`} />
                    </div>
                    <div className="mt-0.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full" style={{ width: `${adayP}%`, background: adayP >= bazP ? "#16a34a" : "#dc2626" }} title={`${t("senaryoPanel.aday").toLowerCase()} %${adayP}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] text-slate-faint"><span className="mr-2 inline-block size-2.5 rounded-sm bg-slate-300 align-middle" />{t("senaryoPanel.baz")} <span className="mx-2 inline-block size-2.5 rounded-sm bg-ok align-middle" />{t("senaryoPanel.aday")} {t("senaryoPanel.dipnot")}</p>
          </Panel>

          <Panel baslik={t("ornek.baslik").replace("{n}", String(sonuc.ornekDiffler.length))}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-slate-faint">
                    <th className="pb-2 font-medium">{t("ornek.th.fark")}</th>
                    <th className="pb-2 font-medium">{t("ornek.th.senaryo")}</th>
                    <th className="pb-2 font-medium">{t("ornek.th.istek")}</th>
                    <th className="pb-2 font-medium">{t("ornek.th.bazKarar")}</th>
                    <th className="pb-2 font-medium">{t("ornek.th.adayKarar")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sonuc.ornekDiffler.map((d, i) => (
                    <DiffSatir key={i} d={d} t={t} />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* eylem bandı */}
      {sonuc && sonuc.karar === "dagit" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
          <div className="max-w-xl">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Check className="size-5 text-ok" /> {t("eylem.baslik")}</h3>
            <p className="mt-1 text-[13px] text-white/60">{t("eylem.aciklama.1")} {sonuc.netDegisim >= 0 ? t("eylem.arttiVar") : t("eylem.arttiYok")}{t("eylem.aciklama.2")}</p>
          </div>
          <Link href="/panel/kurallar" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">{t("eylem.kurallarEkrani")} <ArrowRight className="size-3.5" /></Link>
        </div>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("yontem.1")} <b>{t("yontem.hicDokunmaz")}</b> {t("yontem.2")}<code className="rounded bg-canvas px-1">evaluateRules</code>{t("yontem.3")}</span>
      </div>
    </div>
  );
}

function DiffSatir({ d, t }: { d: IstekDiff; t: (k: string) => string }) {
  const renk = DIFF_RENK[d.tur];
  const AksiyonRozet = ({ a }: { a: RuleAction }) => (
    <Badge ton={a === "block" ? "kirmizi" : a === "challenge" ? "sari" : a === "allow" ? "yesil" : "gri"}>{t(`aksiyon.${a}`)}</Badge>
  );
  return (
    <tr className="border-b border-line/60">
      <td className="py-2"><span className="inline-flex items-center gap-1.5 font-medium" style={{ color: renk }}><span className="size-2 rounded-full" style={{ background: renk }} />{t(`diff.${d.tur}`)}</span></td>
      <td className="py-2 text-slate-muted">{t(`senaryo.${d.senaryo}`)}{d.mesru && <span className="ml-1 text-[11px] text-ok">{t("ornek.mesru")}</span>}</td>
      <td className="py-2"><span className="num text-slate-ink">{d.ip}</span> <span className="text-slate-faint">{d.path}</span></td>
      <td className="py-2"><AksiyonRozet a={d.baz.aksiyon} /></td>
      <td className="py-2"><AksiyonRozet a={d.aday.aksiyon} /></td>
    </tr>
  );
}
