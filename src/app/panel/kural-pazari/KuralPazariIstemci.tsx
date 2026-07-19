"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { Store, Star, Download, Check, Shield, Search, X, ChevronRight, Sparkles } from "lucide-react";
import { Panel, StatKart, Badge, Modal, Secim, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { KURAL_PAKETLERI, type KuralPaketi } from "@/lib/specter/rule-marketplace";
import type { Dil } from "@/lib/i18n/panel";
import { pazarCeviri } from "./kural-pazari.i18n";
import { cn } from "@/lib/cn";

function LucideIkon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

const SEKTORLER = ["hepsi", "e-ticaret", "saas", "medya", "fintech", "api", "genel"] as const;
const AKSIYON_TON: Record<string, "kirmizi" | "sari" | "yesil"> = { block: "kirmizi", challenge: "sari", allow: "yesil", flag: "sari" };

export function KuralPazariIstemci({ dil, sites }: { dil: Dil; sites: { id: string; name: string }[] }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => pazarCeviri(k, dil);
  const sektorEtiket = (s: KuralPaketi["sektor"]) => t(`pz.sektor.${s}`);
  const paketAd = (p: KuralPaketi) => t(`pz.pak.${p.key}.ad`);
  const paketAciklama = (p: KuralPaketi) => t(`pz.pak.${p.key}.aciklama`);
  const paketEtki = (p: KuralPaketi) => t(`pz.pak.${p.key}.etki`);
  const kuralAd = (p: KuralPaketi, i: number) => t(`pz.kural.${p.key}.k${i}.ad`);
  const kuralAciklama = (p: KuralPaketi, i: number) => t(`pz.kural.${p.key}.k${i}.aciklama`);
  const [sektor, setSektor] = useState<(typeof SEKTORLER)[number]>("hepsi");
  const [q, setQ] = useState("");
  const [detay, setDetay] = useState<KuralPaketi | null>(null);
  const [kurModal, setKurModal] = useState<KuralPaketi | null>(null);
  const [seciliSite, setSeciliSite] = useState(sites[0]?.id ?? "");
  const [kuruluyor, setKuruluyor] = useState(false);

  const filtreli = useMemo(() => {
    return KURAL_PAKETLERI.filter((p) => {
      if (sektor !== "hepsi" && p.sektor !== sektor) return false;
      if (q) {
        const alt = q.toLocaleLowerCase("tr");
        const ad = paketAd(p).toLocaleLowerCase("tr");
        const acik = paketAciklama(p).toLocaleLowerCase("tr");
        if (!ad.includes(alt) && !acik.includes(alt)) return false;
      }
      return true;
    }).sort((a, b) => Number(b.onecikan ?? false) - Number(a.onecikan ?? false) || b.kurulum - a.kurulum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektor, q, dil]);

  const toplamKurulum = KURAL_PAKETLERI.reduce((a, p) => a + p.kurulum, 0);
  const ortPuan = (KURAL_PAKETLERI.reduce((a, p) => a + p.puan, 0) / KURAL_PAKETLERI.length).toFixed(1);

  async function kur() {
    if (!kurModal || !seciliSite) return;
    setKuruluyor(true);
    const res = await fetch("/api/rules/paket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paketKey: kurModal.key, siteId: seciliSite }),
    });
    setKuruluyor(false);
    if (res.ok) {
      const d = await res.json();
      setKurModal(null);
      goster({ tip: "basari", baslik: t("pz.toastEklendi").replace("{n}", String(d.eklenen)), aciklama: t("pz.toastKuruldu").replace("{ad}", paketAd(kurModal)) });
      router.push("/panel/kurallar");
    } else {
      const { error } = await res.json().catch(() => ({ error: t("pz.toastKurulamadiVarsayilan") }));
      goster({ tip: "hata", baslik: t("pz.toastKurulamadiBaslik"), aciklama: error });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Store className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("pz.tanitimBaslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("pz.tanitimAciklama")}</p>
          <p className="mt-1 text-[12px] text-slate-faint">{t("pz.ornekNot")}</p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={KURAL_PAKETLERI.length} etiket={t("pz.statHazirPaket")} ikon={<Store className="size-5" />} tone="brand" />
        <StatKart sayi={toplamKurulum.toLocaleString("tr-TR")} etiket={t("pz.statToplamKurulum")} ikon={<Download className="size-5" />} />
        <StatKart sayi={ortPuan} etiket={t("pz.statOrtPuan")} ikon={<Star className="size-5" />} tone="warn" />
        <StatKart sayi={SEKTORLER.length - 1} etiket={t("pz.statSektor")} />
      </div>

      {/* filtre */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("pz.araLabel")} placeholder={t("pz.araPlaceholder")} className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SEKTORLER.map((s) => (
            <button key={s} onClick={() => setSektor(s)} className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition", sektor === s ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100")}>
              {s === "hepsi" ? t("pz.sektorTumu") : sektorEtiket(s)}
            </button>
          ))}
        </div>
      </div>

      {/* paket galerisi */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtreli.map((p) => (
          <div key={p.key} className="group flex flex-col rounded-3xl border border-line bg-surface p-5 transition hover:border-brand-300 hover:shadow-card">
            <div className="flex items-start justify-between">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><LucideIkon name={p.ikon} className="size-5" /></span>
              {p.onecikan && <Badge ton="brand"><Sparkles className="size-3" /> {t("pz.rozetOneCikan")}</Badge>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <h3 className="font-semibold text-slate-ink">{paketAd(p)}</h3>
            </div>
            <p className="mt-1 line-clamp-2 flex-1 text-[13px] leading-relaxed text-slate-muted">{paketAciklama(p)}</p>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-faint">
              <span className="flex items-center gap-1" title={t("pz.ornekNot")}>
                <Star className="size-3.5 text-amber-500" /> {p.puan}
                <span className="text-[9px] uppercase tracking-wide text-slate-faint/80">{t("pz.ornekRozet")}</span>
              </span>
              <span className="flex items-center gap-1" title={t("pz.ornekNot")}>
                <Download className="size-3.5" /> {p.kurulum.toLocaleString("tr-TR")}
                <span className="text-[9px] uppercase tracking-wide text-slate-faint/80">{t("pz.ornekRozet")}</span>
              </span>
              <Badge ton="gri">{sektorEtiket(p.sektor)}</Badge>
            </div>
            <div className="mt-2 text-[11px] text-slate-faint">{t("pz.kuralIcerir").replace("{n}", String(p.kurallar.length))}</div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetay(p)}>{t("pz.incele")} <ChevronRight className="size-3.5" /></Button>
              <Button size="sm" className="flex-1" onClick={() => { setKurModal(p); setSeciliSite(sites[0]?.id ?? ""); }}><Download className="size-4" /> {t("pz.kur")}</Button>
            </div>
          </div>
        ))}
      </div>

      {/* detay modalı */}
      <Modal acik={!!detay} kapat={() => setDetay(null)} baslik={detay ? paketAd(detay) : undefined} aciklama={detay ? paketAciklama(detay) : undefined} genislik="max-w-2xl">
        {detay && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <Badge ton="brand">{sektorEtiket(detay.sektor)}</Badge>
              <span className="flex items-center gap-1 text-slate-muted"><Star className="size-3.5 text-amber-500" /> {detay.puan} {t("pz.puanEki")}</span>
              <span className="flex items-center gap-1 text-slate-muted"><Download className="size-3.5" /> {detay.kurulum.toLocaleString("tr-TR")} {t("pz.kurulumEki")}</span>
            </div>
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-[13px] text-brand-800">
              <div className="mb-0.5 flex items-center gap-1.5 font-semibold"><Shield className="size-3.5" /> {t("pz.beklenenEtki")}</div>
              {paketEtki(detay)}
            </div>
            <div>
              <div className="mb-2 text-[13px] font-semibold text-slate-ink">{t("pz.icerdigiKurallar").replace("{n}", String(detay.kurallar.length))}</div>
              <div className="space-y-2">
                {detay.kurallar.map((k, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-slate-ink">{kuralAd(detay, i)}</div>
                      <div className="text-[12px] text-slate-muted">{kuralAciklama(detay, i)}</div>
                    </div>
                    <Badge ton={AKSIYON_TON[k.action]}>{t(`pz.action.${k.action}`)}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setDetay(null)}>{t("pz.kapat")}</Button>
              <Button onClick={() => { setKurModal(detay); setDetay(null); setSeciliSite(sites[0]?.id ?? ""); }}><Download className="size-4" /> {t("pz.buPaketiKur")}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* kurulum modalı */}
      <Modal acik={!!kurModal} kapat={() => setKurModal(null)} baslik={kurModal ? t("pz.kurBasligi").replace("{ad}", paketAd(kurModal)) : ""} aciklama={kurModal ? t("pz.kurAciklama").replace("{n}", String(kurModal.kurallar.length)) : ""}>
        {kurModal && (
          <div className="space-y-4">
            {sites.length === 0 ? (
              <div className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-amber-800">{t("pz.onceSite")}</div>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("pz.hangiSite")}</span>
                <Secim value={seciliSite} onChange={(e) => setSeciliSite(e.target.value)}>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Secim>
              </label>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-[12px] text-brand-800">
              <Check className="size-3.5 shrink-0" /> {t("pz.aktifNot")}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setKurModal(null)}>{t("pz.iptal")}</Button>
              <Button onClick={kur} disabled={kuruluyor || sites.length === 0}><Download className="size-4" /> {kuruluyor ? t("pz.kuruluyor") : t("pz.kur")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
