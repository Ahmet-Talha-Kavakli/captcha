"use client";

/**
 * Çok-Site Kural Dağıtım & Senkronizasyon konsolu (istemci).
 * ==========================================================
 * Ajanslar/MSP'ler için filo kural yönetimi:
 *  - Kapsama matrisi (merkez parça): satır=benzersiz kural, sütun=site, hücre=✓/−.
 *  - Toplu dağıtım: seçili kuralları seçili hedeflere POST /api/rules ile kopyala.
 *  - Drift analizi: her site için "eksik kurallar" + tek-tık ekle.
 *  - Master set senkronu: birleşimi tüm sitelere yay (onay adımı + dürüst not).
 *
 * Dağıtım GERÇEKTİR: mevcut `/api/rules` POST'una her (kural × hedef site) için
 * çağrı yapar; sitede zaten varsa (imza eşleşmesi) atlar. Kısmi başarısızlıkları
 * sayar ve toast + satır durumuyla dürüstçe raporlar.
 */

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CopyPlus, Network, Check, Minus, ArrowRight, AlertTriangle,
  GitCompareArrows, Layers, Sparkles, Loader2, ShieldCheck, CircleAlert, Info,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu, useToast, Modal } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kuralDagitimCeviri } from "./kural-dagitim.i18n";
import type {
  KapsamaMatrisi, SiteDrift, MasterSet, KuralTohum,
} from "@/lib/specter/kural-dagitim";

/** Yerel çeviri fonksiyonu tipi (alt bileşenlere geçirilir). */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ Prop türleri */

interface SiteMeta {
  id: string;
  name: string;
  mode: "monitor" | "challenge" | "block";
  verified: boolean;
  kuralSayisi: number;
}
interface DriftSonuc {
  siteler: SiteDrift[];
  toplamEksik: number;
  driftliSite: number;
}
interface Props {
  dil: Dil;
  siteMeta: SiteMeta[];
  matris: KapsamaMatrisi;
  drift: DriftSonuc;
  master: MasterSet;
  /** imza → dağıtılabilir tohum (her benzersiz kuralı içerir; sunucudan gelir). */
  tohumHaritasi: Record<string, KuralTohum>;
}

/* ------------------------------------------------------------------ API yardımcı */

/** Tek bir kuralı tek bir hedef siteye POST eder. Başarı → true. */
async function kuralDagit(siteId: string, tohum: KuralTohum): Promise<boolean> {
  try {
    const r = await fetch("/api/rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, ...tohum }),
    });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return !!(j && j.rule);
  } catch {
    return false;
  }
}

/** Bir dağıtım işinin ilerleme durumu. */
interface Ilerleme {
  toplam: number;
  yapilan: number;
  basarili: number;
  hatali: number;
  atlanan: number;
}

/* ------------------------------------------------------------------ Ana bileşen */

export function KuralDagitimIstemci({ dil, siteMeta, matris, drift, master, tohumHaritasi }: Props) {
  const { goster } = useToast();
  const router = useRouter();
  const t: Ceviri = (anahtar) => kuralDagitimCeviri(anahtar, dil);

  const tekSite = siteMeta.length <= 1;

  // Toplu dağıtım seçimleri: kural imzaları + hedef site id'leri.
  const [seciliImzalar, setSeciliImzalar] = useState<Set<string>>(new Set());
  const [seciliHedefler, setSeciliHedefler] = useState<Set<string>>(new Set());
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  // Master onay modalı.
  const [masterOnay, setMasterOnay] = useState(false);

  const siteAdlari = useMemo(
    () => Object.fromEntries(siteMeta.map((s) => [s.id, s.name])),
    [siteMeta],
  );

  /* --------------------------------------------------- seçim yardımcıları */
  const imzaToggle = useCallback((imza: string) => {
    setSeciliImzalar((p) => {
      const n = new Set(p);
      if (n.has(imza)) n.delete(imza);
      else n.add(imza);
      return n;
    });
  }, []);
  const hedefToggle = useCallback((siteId: string) => {
    setSeciliHedefler((p) => {
      const n = new Set(p);
      if (n.has(siteId)) n.delete(siteId);
      else n.add(siteId);
      return n;
    });
  }, []);

  // Seçili imzalardan tohum + hangi sitelerde zaten var haritası.
  const seciliSatirlar = useMemo(
    () => matris.satirlar.filter((s) => seciliImzalar.has(s.imza)),
    [matris.satirlar, seciliImzalar],
  );

  // Planlanan işlem sayısı (seçili kural × seçili hedef, zaten var olan atlanır).
  const planlanan = useMemo(() => {
    let olustur = 0;
    let atla = 0;
    for (const satir of seciliSatirlar) {
      for (const hedef of seciliHedefler) {
        if (satir.hucreler[hedef]?.var) atla++;
        else olustur++;
      }
    }
    return { olustur, atla };
  }, [seciliSatirlar, seciliHedefler]);

  /* --------------------------------------------------- toplu dağıtım */
  async function topluDagit() {
    if (calisiyor) return;
    // (kural, hedef) çiftlerini kur; zaten var olanları atla.
    const isler: { siteId: string; tohum: KuralTohum }[] = [];
    let atlanan = 0;
    for (const satir of seciliSatirlar) {
      const tohum = tohumHaritasi[satir.imza];
      if (!tohum) continue;
      for (const hedef of seciliHedefler) {
        if (satir.hucreler[hedef]?.var) {
          atlanan++;
          continue;
        }
        isler.push({ siteId: hedef, tohum });
      }
    }
    if (isler.length === 0) {
      goster({ tip: "bilgi", baslik: t("toast.yeniYok.baslik"), aciklama: t("toast.yeniYok.aciklama") });
      return;
    }
    await isleriYurut(isler, atlanan, () => {
      setSeciliImzalar(new Set());
      setSeciliHedefler(new Set());
    });
  }

  /* --------------------------------------------------- drift onarımı (tek kural) */
  async function driftEkle(siteId: string, tohum: KuralTohum, ad: string) {
    if (calisiyor) return;
    setCalisiyor(true);
    setIlerleme({ toplam: 1, yapilan: 0, basarili: 0, hatali: 0, atlanan: 0 });
    const ok = await kuralDagit(siteId, tohum);
    setIlerleme({ toplam: 1, yapilan: 1, basarili: ok ? 1 : 0, hatali: ok ? 0 : 1, atlanan: 0 });
    setCalisiyor(false);
    if (ok) {
      goster({ tip: "basari", baslik: t("toast.eklendi.baslik"), aciklama: `"${ad}" → ${siteAdlari[siteId] ?? siteId}` });
      router.refresh();
    } else {
      goster({ tip: "hata", baslik: t("toast.eklenemedi.baslik"), aciklama: t("toast.eklenemedi.aciklama") });
    }
    setTimeout(() => setIlerleme(null), 1600);
  }

  /* --------------------------------------------------- master senkronu */
  async function masterSenkronla() {
    setMasterOnay(false);
    const isler: { siteId: string; tohum: KuralTohum }[] = [];
    for (const k of master.kurallar) {
      for (const siteId of k.eksikSiteler) {
        isler.push({ siteId, tohum: k.tohum });
      }
    }
    if (isler.length === 0) {
      goster({ tip: "bilgi", baslik: t("toast.masterSenkron.baslik") });
      return;
    }
    await isleriYurut(isler, 0);
  }

  /* --------------------------------------------------- ortak yürütücü */
  async function isleriYurut(
    isler: { siteId: string; tohum: KuralTohum }[],
    atlanan: number,
    bitince?: () => void,
  ) {
    setCalisiyor(true);
    let basarili = 0;
    let hatali = 0;
    setIlerleme({ toplam: isler.length, yapilan: 0, basarili: 0, hatali: 0, atlanan });
    // Sıralı yürüt (JSON DB yazımı sıralı; yarış olmasın + ilerleme net).
    for (let i = 0; i < isler.length; i++) {
      const ok = await kuralDagit(isler[i].siteId, isler[i].tohum);
      if (ok) basarili++;
      else hatali++;
      setIlerleme({ toplam: isler.length, yapilan: i + 1, basarili, hatali, atlanan });
    }
    setCalisiyor(false);
    if (hatali === 0) {
      goster({
        tip: "basari",
        baslik: t("toast.tamamlandi.baslik"),
        aciklama:
          t("toast.tamamlandi.aciklama").replace("{n}", String(basarili)) +
          (atlanan ? t("toast.tamamlandi.atlandi").replace("{n}", String(atlanan)) : "") + ".",
      });
    } else if (basarili > 0) {
      goster({
        tip: "bilgi",
        baslik: t("toast.kismi.baslik"),
        aciklama:
          t("toast.kismi.aciklama").replace("{a}", String(basarili)).replace("{b}", String(hatali)) +
          (atlanan ? t("toast.kismi.atlandi").replace("{n}", String(atlanan)) : "") + ".",
      });
    } else {
      goster({ tip: "hata", baslik: t("toast.basarisiz.baslik"), aciklama: t("toast.basarisiz.aciklama").replace("{n}", String(hatali)) });
    }
    bitince?.();
    router.refresh();
    setTimeout(() => setIlerleme(null), 2400);
  }

  /* --------------------------------------------------- türetilmiş sayılar */
  const tamSenkronSite = drift.siteler.filter((s) => s.eksikler.length === 0).length;
  const kapsamaYuzde = matris.benzersizKural > 0
    ? Math.round((matris.tamKapsananKural / matris.benzersizKural) * 100)
    : 100;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş bandı */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Network className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("band.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("band.metin")}</p>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={siteMeta.length} etiket={t("ozet.korunanSite")} ikon={<Layers className="size-5" />} />
        <StatKart sayi={matris.benzersizKural} etiket={t("ozet.benzersizKural")} ikon={<GitCompareArrows className="size-5" />} />
        <StatKart
          sayi={drift.driftliSite}
          etiket={t("ozet.driftliSite")}
          ikon={<AlertTriangle className="size-5" />}
          tone={drift.driftliSite > 0 ? "warn" : "ok"}
        />
        <StatKart
          sayi={tamSenkronSite}
          etiket={t("ozet.tamSenkron")}
          ikon={<ShieldCheck className="size-5" />}
          tone={tamSenkronSite === siteMeta.length ? "ok" : undefined}
        />
      </div>

      {tekSite && (
        <NotKutusu ton="bilgi" baslik={t("tekSite.baslik")}>
          {t("tekSite.metin")}
        </NotKutusu>
      )}

      {/* İlerleme çubuğu (aktif işlem) */}
      {ilerleme && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-ink">
              {calisiyor ? <Loader2 className="size-4 animate-spin text-brand-600" /> : <Check className="size-4 text-ok" />}
              {calisiyor ? t("ilerleme.suruyor") : t("ilerleme.bitti")}
            </span>
            <span className="num text-slate-muted">
              {ilerleme.yapilan}/{ilerleme.toplam} · <span className="text-ok">{ilerleme.basarili} ✓</span>
              {ilerleme.hatali > 0 && <span className="text-danger2"> · {ilerleme.hatali} ✗</span>}
              {ilerleme.atlanan > 0 && <span className="text-slate-faint"> · {ilerleme.atlanan} {t("ilerleme.atlandi")}</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className={cn("h-full rounded-full transition-all", ilerleme.hatali > 0 ? "bg-warn" : "bg-brand-600")}
              style={{ width: `${ilerleme.toplam ? (ilerleme.yapilan / ilerleme.toplam) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ===================================================== KAPSAMA MATRİSİ */}
      <Panel
        baslik={t("matris.baslik")}
        sagUst={
          <span className="flex items-center gap-2 text-[13px] text-slate-muted">
            <span className="num font-semibold text-slate-ink">%{kapsamaYuzde}</span> {t("matris.tamKapsama")}
          </span>
        }
      >
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("matris.aciklama.on")} <span className="text-ok">✓</span> {t("matris.aciklama.var")}
          <span className="text-slate-faint"> −</span> {t("matris.aciklama.yok")}
        </p>

        {matris.satirlar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/30 px-6 py-12 text-center text-sm text-slate-muted">
            {t("matris.bos")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-10 bg-surface px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-faint">
                    {t("matris.kolon.kural")}
                  </th>
                  {siteMeta.map((s) => {
                    const hedefMi = seciliHedefler.has(s.id);
                    return (
                      <th key={s.id} className="px-2 py-2 text-center align-bottom">
                        <button
                          onClick={() => hedefToggle(s.id)}
                          className={cn(
                            "mx-auto flex w-[92px] flex-col items-center gap-1 rounded-xl border px-1.5 py-2 transition",
                            hedefMi ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200" : "border-line hover:border-line-strong hover:bg-canvas",
                          )}
                          title={t("matris.hedefSecTitle").replace("{ad}", s.name)}
                        >
                          <span className="max-w-[84px] truncate text-[12px] font-semibold text-slate-ink">{s.name}</span>
                          <span className="flex items-center gap-1">
                            <ModRozet mode={s.mode} t={t} />
                          </span>
                          <span className={cn("text-[10px] font-medium", hedefMi ? "text-brand-700" : "text-slate-faint")}>
                            {hedefMi ? t("matris.hedefSecili") : t("matris.kuralSayisi").replace("{n}", String(s.kuralSayisi))}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matris.satirlar.map((satir) => {
                  const secili = seciliImzalar.has(satir.imza);
                  return (
                    <tr key={satir.imza} className={cn("border-b border-line last:border-0 transition", secili && "bg-brand-50/40")}>
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5">
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={secili}
                            onChange={() => imzaToggle(satir.imza)}
                            className="mt-0.5 size-4 shrink-0 accent-brand-600"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium text-slate-ink">{satir.ad}</span>
                              <AksiyonRozet action={satir.action} t={t} />
                              {satir.tamKapsama ? (
                                <Badge ton="yesil">{t("matris.rozet.tam")}</Badge>
                              ) : (
                                <Badge ton="sari">{satir.varSayisi}/{satir.toplamSite}</Badge>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-faint">{satir.kosulOzet}</span>
                          </span>
                        </label>
                      </td>
                      {siteMeta.map((s) => {
                        const hucre = satir.hucreler[s.id];
                        const varMi = hucre?.var ?? false;
                        const bosluk = !varMi;
                        return (
                          <td
                            key={s.id}
                            className={cn(
                              "px-2 py-2.5 text-center",
                              bosluk && "bg-warn-soft/40",
                            )}
                          >
                            {varMi ? (
                              <span
                                className={cn(
                                  "inline-grid size-6 place-items-center rounded-md",
                                  hucre?.enabled === false ? "bg-slate-100 text-slate-400" : "bg-ok-soft text-ok",
                                )}
                                title={hucre?.enabled === false ? t("matris.hucre.varPasif") : t("matris.hucre.var")}
                              >
                                <Check className="size-3.5" />
                              </span>
                            ) : (
                              <span className="inline-grid size-6 place-items-center rounded-md text-slate-300" title={t("matris.hucre.yok")}>
                                <Minus className="size-3.5" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Toplu dağıtım eylem çubuğu */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-3">
          <div className="text-[13px] text-slate-muted">
            <span className="font-semibold text-slate-ink">{seciliImzalar.size}</span> {t("toplu.kural")}
            <span className="font-semibold text-slate-ink"> {seciliHedefler.size}</span> {t("toplu.hedefSite")}
            {(seciliImzalar.size > 0 && seciliHedefler.size > 0) && (
              <span className="ml-2">
                → <span className="font-semibold text-brand-700">{planlanan.olustur}</span> {t("toplu.olusturulacak")}
                {planlanan.atla > 0 && <span className="text-slate-faint"> {t("toplu.zatenVar").replace("{n}", String(planlanan.atla))}</span>}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={topluDagit}
            disabled={calisiyor || seciliImzalar.size === 0 || seciliHedefler.size === 0 || planlanan.olustur === 0}
          >
            {calisiyor ? <Loader2 className="size-4 animate-spin" /> : <CopyPlus className="size-4" />}
            {t("toplu.dagit")}
          </Button>
        </div>
      </Panel>

      {/* ===================================================== DRIFT ANALİZİ */}
      <Panel baslik={t("drift.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("drift.aciklama.on")} <b>{t("drift.aciklama.eksik")}</b> {t("drift.aciklama.son")} <b>{t("drift.aciklama.ozgun")}</b> {t("drift.aciklama.ozgunSon")}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {drift.siteler.map((sd) => {
            const meta = siteMeta.find((m) => m.id === sd.siteId);
            const temiz = sd.eksikler.length === 0;
            return (
              <div key={sd.siteId} className={cn("rounded-2xl border bg-surface p-4", temiz ? "border-line" : "border-amber-200")}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("grid size-8 place-items-center rounded-lg", temiz ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
                      {temiz ? <ShieldCheck className="size-4" /> : <CircleAlert className="size-4" />}
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-ink">{sd.siteAd}</div>
                      <div className="text-[12px] text-slate-faint">
                        {t("drift.kuralAdet").replace("{n}", String(sd.mevcutSayisi))}{meta && ` · ${t(`mod.${meta.mode}`)}`}
                      </div>
                    </div>
                  </div>
                  {temiz ? (
                    <Badge ton="yesil">{t("drift.rozet.senkron")}</Badge>
                  ) : (
                    <Badge ton="sari">{t("drift.rozet.eksik").replace("{n}", String(sd.eksikler.length))}</Badge>
                  )}
                </div>

                {temiz ? (
                  <p className="rounded-xl bg-canvas/50 px-3 py-2.5 text-[12.5px] text-slate-muted">
                    {t("drift.temizMetin")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {sd.eksikler.map((e) => (
                      <li key={e.imza} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/30 px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-medium text-slate-ink">{e.ad}</span>
                            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {t("drift.sitedeVar").replace("{n}", String(e.kaynakSayisi))}
                            </span>
                          </div>
                          <div className="truncate font-mono text-[11px] text-slate-faint">{e.kosulOzet}</div>
                        </div>
                        <button
                          onClick={() => driftEkle(sd.siteId, e.tohum, e.ad)}
                          disabled={calisiyor}
                          className="flex shrink-0 items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                        >
                          <ArrowRight className="size-3.5" /> {t("drift.ekle")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {sd.ozgunler.length > 0 && (
                  <div className="mt-3 border-t border-line pt-2.5">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                      {t("drift.yalnizBuSitede").replace("{n}", String(sd.ozgunler.length))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sd.ozgunler.map((o) => (
                        <span key={o.imza} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600" title={o.kosulOzet}>
                          {o.ad}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ===================================================== MASTER SET SENKRONU */}
      <Panel
        baslik={t("master.baslik")}
        sagUst={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMasterOnay(true)}
            disabled={calisiyor || master.toplamOlusturulacak === 0}
          >
            <Sparkles className="size-4" /> {t("master.senkronla")}
          </Button>
        }
      >
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("master.aciklama.on")} <b>{t("master.aciklama.birlesim")}</b> {t("master.aciklama.son")}
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl bg-canvas/40 p-4">
          <div>
            <div className="num text-[28px] font-bold text-slate-ink">{master.kurallar.length}</div>
            <div className="text-[12px] text-slate-muted">{t("master.kuraliEtiket")}</div>
          </div>
          <div className="h-9 w-px bg-line" />
          <div>
            <div className={cn("num text-[28px] font-bold", master.toplamOlusturulacak > 0 ? "text-brand-700" : "text-ok")}>
              {master.toplamOlusturulacak}
            </div>
            <div className="text-[12px] text-slate-muted">{t("master.olusturulacakEtiket")}</div>
          </div>
          {master.toplamOlusturulacak === 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-[13px] font-medium text-ok">
              <ShieldCheck className="size-4" /> {t("master.tamSenkron")}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {master.kurallar.map((k) => (
            <div key={k.imza} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[13px] font-medium text-slate-ink">{k.ad}</span>
                  <AksiyonRozet action={k.action} t={t} />
                </div>
                <div className="truncate font-mono text-[11px] text-slate-faint">{k.kosulOzet}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-[12px]">
                <span className="text-slate-muted">
                  <span className="num font-semibold text-slate-ink">{k.varSayisi}</span>/{siteMeta.length} {t("master.sitede")}
                </span>
                {k.eksikSiteler.length > 0 ? (
                  <Badge ton="sari">{t("master.rozet.eksik").replace("{n}", String(k.eksikSiteler.length))}</Badge>
                ) : (
                  <Badge ton="yesil">{t("master.rozet.tam")}</Badge>
                )}
              </div>
            </div>
          ))}
          {master.kurallar.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong bg-canvas/30 px-4 py-8 text-center text-sm text-slate-muted">
              {t("master.bos")}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-canvas/30 px-4 py-3 text-[12.5px] text-slate-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            {t("master.durustNot.on")} <b>{t("master.durustNot.eksikOlusturur")}</b>{t("master.durustNot.son")}
          </span>
        </div>
      </Panel>

      {/* Master onay modalı */}
      <Modal
        acik={masterOnay}
        kapat={() => setMasterOnay(false)}
        baslik={t("modal.baslik")}
        aciklama={t("modal.aciklama")}
      >
        <div className="space-y-4">
          <p className="text-[14px] text-slate-ink">
            {t("modal.govde")}{" "}
            <b className="text-brand-700">{master.toplamOlusturulacak}</b>{" "}
            {t("modal.govdeSon").replace("{a}", String(master.kurallar.length)).replace("{b}", String(siteMeta.length))}
          </p>
          <div className="rounded-xl bg-canvas/50 px-4 py-3 text-[13px] text-slate-muted">
            <div className="mb-1.5 font-semibold text-slate-ink">{t("modal.dagilimBaslik")}</div>
            <ul className="space-y-1">
              {siteMeta.map((s) => {
                const eksik = master.kurallar.filter((k) => k.eksikSiteler.includes(s.id)).length;
                return (
                  <li key={s.id} className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className={cn("num font-medium", eksik > 0 ? "text-brand-700" : "text-ok")}>
                      {eksik > 0 ? t("modal.siteEksik").replace("{n}", String(eksik)) : t("modal.siteSenkron")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setMasterOnay(false)}>{t("modal.vazgec")}</Button>
            <Button size="sm" onClick={masterSenkronla}>
              <Sparkles className="size-4" /> {t("modal.olustur").replace("{n}", String(master.toplamOlusturulacak))}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ Küçük parçalar */

function ModRozet({ mode, t }: { mode: "monitor" | "challenge" | "block"; t: Ceviri }) {
  // ENUM GÜVENLİĞİ: enum id sabittir; yalnızca sınıf/etiket eşlemesi id ile türetilir.
  const cls = {
    monitor: "bg-slate-100 text-slate-500",
    challenge: "bg-warn-soft text-amber-700",
    block: "bg-danger-soft text-red-700",
  }[mode];
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase", cls)}>{t(`mod.${mode}`)}</span>;
}

function AksiyonRozet({ action, t }: { action: string; t: Ceviri }) {
  // ENUM GÜVENLİĞİ: aksiyon id sabittir; ton id ile eşlenir, etiket key-map'ten türetilir.
  const ton: Record<string, "yesil" | "sari" | "kirmizi" | "mavi"> = {
    allow: "yesil", challenge: "sari", block: "kirmizi", flag: "mavi",
  };
  const bilinen = ton[action];
  return <Badge ton={bilinen ?? "gri"}>{bilinen ? t(`aksiyon.${action}`) : action}</Badge>;
}
