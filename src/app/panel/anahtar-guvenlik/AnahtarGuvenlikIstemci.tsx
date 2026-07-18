"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck, ShieldAlert, RotateCw, ScanLine, AlertTriangle, Check, Copy, Trash2, Clock } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { DURUM_RENK, ROTASYON_ONERI_GUN, ROTASYON_KRITIK_GUN } from "@/lib/specter/anahtar-guvenlik";
import type { AnahtarGuvenlik, AnahtarOzet } from "@/lib/specter/anahtar-guvenlik";
import type { Dil } from "@/lib/i18n/panel";
import { anahtarGuvenlikCeviri } from "./anahtar-guvenlik.i18n";
import { cn } from "@/lib/cn";

/**
 * Uyarı satırının anlamsal tonu — sunucudan gelen TR metnini string ile eşlemek
 * yerine, uyarıları analiz verisinden yeniden türetip her satıra tip veriyoruz.
 * Böylece çeviri de doğal olur (metin eşleşmesine bağlı kalmaz).
 */
type UyariTon = "tehlike" | "uyari" | "guvenli";
interface UyariSatir { metin: string; ton: UyariTon; }

/** Geniş/riskli kapsamlar (lib ile aynı liste; enum/değer değil, veri hijyeni kontrolü). */
const GENIS_KAPSAM = new Set(["*", "admin", "full", "write:all", "tüm"]);

export function AnahtarGuvenlikIstemci({
  dil, analizler, ozet,
}: {
  dil: Dil;
  analizler: AnahtarGuvenlik[];
  ozet: AnahtarOzet;
}) {
  const t = (anahtar: string) => anahtarGuvenlikCeviri(anahtar, dil);
  const { goster } = useToast();
  const [durum, setDurum] = useState<Record<string, "dondur" | "tara">>({});
  const [yeniSecret, setYeniSecret] = useState<Record<string, string>>({});
  const [yerelLeaked, setYerelLeaked] = useState<Record<string, string>>({});

  /** Analiz verisinden yerelleştirilmiş uyarı satırlarını yeniden türet (lib'deki mantıkla aynı). */
  function uyariSatirlari(a: AnahtarGuvenlik, leakSource?: string): UyariSatir[] {
    if (a.revoked) return [{ metin: t("ag.uyari.iptalEdilmis"), ton: "tehlike" }];
    const satirlar: UyariSatir[] = [];
    const kaynak = a.leakSource ?? leakSource;
    if (a.leaked || leakSource) {
      satirlar.push({
        metin: t("ag.uyari.sizintiTespit").replace("{v}", kaynak ? ` (${kaynak})` : ""),
        ton: "tehlike",
      });
    }
    if (a.yasGun >= ROTASYON_KRITIK_GUN) {
      satirlar.push({ metin: t("ag.uyari.kritikYas").replace("{n}", String(a.yasGun)).replace("{k}", String(ROTASYON_KRITIK_GUN)), ton: "tehlike" });
    } else if (a.yasGun >= ROTASYON_ONERI_GUN) {
      satirlar.push({ metin: t("ag.uyari.oneriYas").replace("{n}", String(a.yasGun)).replace("{k}", String(ROTASYON_ONERI_GUN)), ton: "uyari" });
    }
    const genis = a.scopes.filter((s) => GENIS_KAPSAM.has(s.toLowerCase()));
    if (genis.length > 0) {
      satirlar.push({ metin: t("ag.uyari.genisKapsam").replace("{v}", genis.join(", ")), ton: "uyari" });
    }
    if (a.scopes.length === 0) {
      satirlar.push({ metin: t("ag.uyari.kapsamTanimsiz"), ton: "uyari" });
    }
    if (a.lastUsedGun !== null && a.lastUsedGun >= 60 && a.environment === "live") {
      satirlar.push({ metin: t("ag.uyari.kullanilmiyor").replace("{n}", String(a.lastUsedGun)), ton: "uyari" });
    }
    if (a.lastUsedGun === null && a.yasGun >= 30) {
      satirlar.push({ metin: t("ag.uyari.hicKullanilmamis"), ton: "uyari" });
    }
    if (satirlar.length === 0) satirlar.push({ metin: t("ag.uyari.guvenli"), ton: "guvenli" });
    return satirlar;
  }

  async function eylem(id: string, e: "dondur" | "sizinti-tara") {
    setDurum((p) => ({ ...p, [id]: e === "dondur" ? "dondur" : "tara" }));
    try {
      const r = await fetch(`/api/tokens/${id}/guvenlik`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eylem: e }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error();
      if (e === "dondur") {
        setYeniSecret((p) => ({ ...p, [id]: d.secret }));
        goster({ tip: "basari", baslik: t("ag.toast.dondurulduBaslik"), aciklama: t("ag.toast.dondurulduAciklama") });
      } else {
        if (d.sizmis) {
          setYerelLeaked((p) => ({ ...p, [id]: d.source }));
          goster({ tip: "hata", baslik: t("ag.toast.sizintiVarBaslik"), aciklama: t("ag.toast.sizintiVarAciklama").replace("{v}", d.source) });
        } else {
          goster({ tip: "basari", baslik: t("ag.toast.sizintiYokBaslik"), aciklama: t("ag.toast.sizintiYokAciklama") });
        }
      }
    } catch {
      goster({ tip: "hata", baslik: t("ag.toast.hataBaslik") });
    } finally {
      setDurum((p) => { const y = { ...p }; delete y[id]; return y; });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ag.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("ag.aciklama.metin1")}<b>{t("ag.aciklama.vurgu")}</b>.
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam} etiket={t("ag.ozet.aktif")} ikon={<KeyRound className="size-5" />} />
        <StatKart sayi={`%${ozet.ortSkor}`} etiket={t("ag.ozet.ortSkor")} ikon={<ShieldCheck className="size-5" />} tone={ozet.ortSkor >= 80 ? "ok" : ozet.ortSkor >= 50 ? "warn" : "danger"} />
        <StatKart sayi={ozet.dondurulmeli} etiket={t("ag.ozet.dondurulmeli")} ikon={<RotateCw className="size-5" />} tone={ozet.dondurulmeli > 0 ? "warn" : "ok"} />
        <StatKart sayi={ozet.sizmis} etiket={t("ag.ozet.sizmis")} ikon={<ShieldAlert className="size-5" />} tone={ozet.sizmis > 0 ? "danger" : "ok"} />
      </div>

      {/* sızıntı uyarı bandı */}
      {ozet.sizmis > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger-soft bg-danger-soft/40 px-5 py-4 text-danger2">
          <ShieldAlert className="size-5 shrink-0" />
          <span className="text-[13.5px] font-medium">{t("ag.uyariBand").replace("{n}", String(ozet.sizmis))}</span>
        </div>
      )}

      {/* anahtar listesi */}
      <div className="space-y-4">
        {analizler.length === 0 && (
          <Panel baslik={t("ag.bos.baslik")}>
            <div className="py-8 text-center">
              <KeyRound className="mx-auto mb-2 size-10 text-slate-300" />
              <p className="text-sm text-slate-muted">{t("ag.bos.metin")}</p>
              <Link href="/panel/gelistirici" className="mt-3 inline-flex text-[13px] font-medium text-brand-600 hover:text-brand-700">{t("ag.bos.link")}</Link>
            </div>
          </Panel>
        )}
        {analizler.map((a) => {
          const leaked = a.leaked || yerelLeaked[a.id];
          const leakSource = a.leakSource || yerelLeaked[a.id];
          const gorselDurum = yerelLeaked[a.id] && a.durum !== "iptal" ? "sizmis" : a.durum;
          const satirlar = uyariSatirlari(a, yerelLeaked[a.id]);
          return (
            <div key={a.id} className={cn("overflow-hidden rounded-3xl border bg-surface p-5", leaked ? "border-danger-soft" : "border-line")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: DURUM_RENK[gorselDurum] }}>
                    {leaked ? <ShieldAlert className="size-5" /> : <KeyRound className="size-5" />}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold text-slate-ink">{a.name}</span>
                      <Badge ton={a.environment === "live" ? "kirmizi" : "gri"}>{a.environment === "live" ? t("ag.ortam.canli") : t("ag.ortam.test")}</Badge>
                      <Badge ton={gorselDurum === "saglikli" ? "yesil" : gorselDurum === "sizmis" || gorselDurum === "kritik" ? "kirmizi" : gorselDurum === "iptal" ? "gri" : "sari"}>{t(`ag.durum.${gorselDurum}`)}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
                      <span className="font-mono">{a.prefix}••••</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> {t("ag.meta.yasinda").replace("{n}", String(a.yasGun))}{a.rotationCount > 0 ? t("ag.meta.dondurulduSuffix").replace("{n}", String(a.rotationCount)) : t("ag.meta.hicDondurulmedi")}</span>
                      <span>{a.lastUsedGun === null ? t("ag.meta.hicKullanilmadi") : t("ag.meta.kullanildi").replace("{n}", String(a.lastUsedGun))}</span>
                      <span>{t("ag.meta.kapsam").replace("{v}", a.scopes.join(", ") || "—")}</span>
                    </div>
                  </div>
                </div>
                {!a.revoked && (
                  <div className="text-right">
                    <div className="num text-[22px] font-bold" style={{ color: a.guvenlikSkoru >= 80 ? "#16a34a" : a.guvenlikSkoru >= 50 ? "#d97706" : "#dc2626" }}>{a.guvenlikSkoru}</div>
                    <div className="text-[11px] text-slate-faint">{t("ag.meta.guvenlikSkoru")}</div>
                  </div>
                )}
              </div>

              {/* uyarılar */}
              {!a.revoked && (
                <div className="mt-3 space-y-1.5">
                  {satirlar.map((u, i) => (
                    <div key={i} className={cn("flex items-start gap-2 text-[12.5px]", u.ton === "tehlike" ? "text-danger2" : u.ton === "guvenli" ? "text-ok" : "text-slate-muted")}>
                      {u.ton === "guvenli" ? <Check className="mt-0.5 size-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />} {u.metin}
                    </div>
                  ))}
                </div>
              )}

              {/* yeni secret gösterimi */}
              {yeniSecret[a.id] && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-ok-soft px-3 py-2.5">
                  <span className="flex-1 truncate font-mono text-[12px] text-green-800">{yeniSecret[a.id]}</span>
                  <button onClick={() => { navigator.clipboard.writeText(yeniSecret[a.id]); goster({ tip: "basari", baslik: t("ag.toast.kopyalandi") }); }} className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-green-700"><Copy className="mr-1 inline size-3" /> {t("ag.secret.kopyala")}</button>
                </div>
              )}

              {/* eylemler */}
              {!a.revoked && !yeniSecret[a.id] && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => eylem(a.id, "dondur")} disabled={!!durum[a.id]} variant={a.oneri === "dondur" || leaked ? "accent" : "outline"}>
                    <RotateCw className="size-4" /> {durum[a.id] === "dondur" ? t("ag.eylem.donduruluyor") : t("ag.eylem.dondur")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => eylem(a.id, "sizinti-tara")} disabled={!!durum[a.id]}>
                    <ScanLine className="size-4" /> {durum[a.id] === "tara" ? t("ag.eylem.taraniyor") : t("ag.eylem.sizintiTara")}
                  </Button>
                  <Link href="/panel/gelistirici" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink">
                    <Trash2 className="size-4" /> {t("ag.eylem.yonet")}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* en iyi uygulamalar */}
      <Panel baslik={t("ag.ipucu.baslik")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Ipucu baslik={t("ag.ipucu.1.baslik")} metin={t("ag.ipucu.1.metin")} />
          <Ipucu baslik={t("ag.ipucu.2.baslik")} metin={t("ag.ipucu.2.metin")} />
          <Ipucu baslik={t("ag.ipucu.3.baslik")} metin={t("ag.ipucu.3.metin")} />
          <Ipucu baslik={t("ag.ipucu.4.baslik")} metin={t("ag.ipucu.4.metin")} />
        </div>
      </Panel>
    </div>
  );
}

function Ipucu({ baslik, metin }: { baslik: string; metin: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><ShieldCheck className="size-3.5 text-brand-600" /> {baslik}</div>
      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{metin}</p>
    </div>
  );
}
