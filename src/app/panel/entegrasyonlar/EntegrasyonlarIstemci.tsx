"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plug, Check, Send, Trash2, ExternalLink, Power } from "lucide-react";
import { Panel, StatKart, Badge, Modal, Alan, Girdi, DurumRozeti, useToast, SatirMenu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { ENTEGRASYON_KATALOG, OLAY_TURLERI } from "@/lib/specter/integrations";
import type { Dil } from "@/lib/i18n/panel";
import { entegrasyonlarCeviri } from "./entegrasyonlar.i18n";
import { cn } from "@/lib/cn";
import { DonutDagilim } from "@/components/panel/grafikler";

/** Katalog türünü işlevsel kategoriye eşle (yalnızca gruplama/gösterim). */
const TUR_KATEGORI: Record<string, "bildirim" | "otomasyon" | "siem"> = {
  slack: "bildirim", discord: "bildirim", teams: "bildirim", email: "bildirim",
  zapier: "otomasyon", pagerduty: "siem",
};

const KATEGORI_SIRA = [
  { key: "bildirim" as const, adKey: "en.kat.bildirim", altKey: "en.kat.bildirimAlt", renk: "#2f6fed" },
  { key: "otomasyon" as const, adKey: "en.kat.otomasyon", altKey: "en.kat.otomasyonAlt", renk: "#7c3aed" },
  { key: "siem" as const, adKey: "en.kat.siem", altKey: "en.kat.siemAlt", renk: "#d97706" },
];

interface Baglanti {
  id: string; tur: string; ad: string; hedef: string; olaylar: string[];
  aktif: boolean; lastStatus: number | null; lastDelivery: number | null; gonderilen: number;
}

function goreli(ts: number | null, t: (k: string) => string): string {
  if (!ts) return t("en.goreli.hic");
  const dk = Math.floor((Date.now() - ts) / 60000);
  if (dk < 1) return t("en.goreli.azOnce");
  if (dk < 60) return `${dk}${t("en.goreli.dk")}`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa}${t("en.goreli.sa")}`;
  return `${Math.floor(sa / 24)}${t("en.goreli.g")}`;
}

export function EntegrasyonlarIstemci({ baglantilar: ilk, dil }: { baglantilar: Baglanti[]; dil: Dil }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => entegrasyonlarCeviri(k, dil);
  const [baglantilar, setBaglantilar] = useState(ilk);
  const [modal, setModal] = useState<(typeof ENTEGRASYON_KATALOG)[number] | null>(null);
  const [ad, setAd] = useState("");
  const [hedef, setHedef] = useState("");
  const [secOlaylar, setSecOlaylar] = useState<string[]>(["bot.blocked", "campaign.started"]);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const katalogMap = Object.fromEntries(ENTEGRASYON_KATALOG.map((k) => [k.tur, k]));

  function modalAc(k: (typeof ENTEGRASYON_KATALOG)[number]) {
    setModal(k); setAd(k.ad + t("en.modal.kanalSoneki")); setHedef(""); setSecOlaylar(["bot.blocked", "campaign.started"]);
  }

  async function bagla() {
    if (!modal) return;
    setGonderiliyor(true);
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tur: modal.tur, ad, hedef, olaylar: secOlaylar }),
    });
    setGonderiliyor(false);
    if (res.ok) {
      const { integration } = await res.json();
      setBaglantilar((p) => [{ ...integration }, ...p]);
      setModal(null);
      goster({ tip: "basari", baslik: `${modal.ad} ${t("en.toast.baglandi")}` });
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: t("en.toast.baglanamadi") }));
      goster({ tip: "hata", baslik: t("en.toast.baglanamadi"), aciklama: error });
    }
  }

  async function test(b: Baglanti) {
    goster({ tip: "bilgi", baslik: t("en.toast.testGonderiliyor") });
    const res = await fetch("/api/integrations", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, action: "test" }),
    });
    const d = await res.json().catch(() => ({ ok: false }));
    goster(d.ok ? { tip: "basari", baslik: t("en.toast.testGonderildi") } : { tip: "hata", baslik: `${t("en.toast.testHata")} (${d.status ?? t("en.toast.hata")})` });
    router.refresh();
  }

  async function toggle(b: Baglanti) {
    setBaglantilar((p) => p.map((x) => (x.id === b.id ? { ...x, aktif: !x.aktif } : x)));
    await fetch("/api/integrations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id }) });
  }

  async function kaldir(b: Baglanti) {
    setBaglantilar((p) => p.filter((x) => x.id !== b.id));
    await fetch("/api/integrations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id }) });
    goster({ tip: "basari", baslik: t("en.toast.kaldirildi") });
    router.refresh();
  }

  const aktifSayi = baglantilar.filter((b) => b.aktif).length;
  const toplamGonderi = baglantilar.reduce((a, b) => a + b.gonderilen, 0);
  const pasifSayi = baglantilar.length - aktifSayi;

  // Kategoriye göre bağlı kanal dağılımı (donut segmentleri).
  const kategoriDagilim = KATEGORI_SIRA.map((kat) => ({
    etiket: t(kat.adKey),
    deger: baglantilar.filter((b) => TUR_KATEGORI[b.tur] === kat.key).length,
    renk: kat.renk,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Plug className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("en.tanit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("en.tanit.aciklama")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={baglantilar.length} etiket={t("en.ozet.bagli")} ikon={<Plug className="size-5" />} tone="brand" />
        <StatKart sayi={aktifSayi} etiket={t("en.ozet.aktif")} tone="ok" />
        <StatKart sayi={toplamGonderi.toLocaleString("tr-TR")} etiket={t("en.ozet.gonderilen")} ikon={<Send className="size-5" />} />
        <StatKart sayi={ENTEGRASYON_KATALOG.length} etiket={t("en.ozet.platform")} />
      </div>

      {/* görsel panolar: bağlantı durumu + kategori dağıtımı (yalnızca bağlıysa) */}
      {baglantilar.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-1 text-[14px] font-semibold text-slate-ink">{t("en.gorsel.durumBaslik")}</div>
            <div className="mb-3 text-[12px] text-slate-muted">{t("en.gorsel.durumAlt")}</div>
            <DonutDagilim
              merkezEtiket={t("en.gorsel.baglanti")}
              segmentler={[
                { etiket: t("en.durum.aktif"), deger: aktifSayi, renk: "#16a34a" },
                { etiket: t("en.durum.duraklatildi"), deger: pasifSayi, renk: "#9a948a" },
              ]}
            />
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-1 text-[14px] font-semibold text-slate-ink">{t("en.gorsel.dagitimBaslik")}</div>
            <div className="mb-3 text-[12px] text-slate-muted">{t("en.gorsel.dagitimAlt")}</div>
            <DonutDagilim merkezEtiket={t("en.gorsel.baglanti")} segmentler={kategoriDagilim} />
          </div>
        </div>
      )}

      {/* bağlayıcı galerisi — kategori gruplu */}
      <Panel baslik={t("en.bolum.yeni")}>
        <div className="space-y-5">
          {KATEGORI_SIRA.map((kat) => {
            const grup = ENTEGRASYON_KATALOG.filter((k) => TUR_KATEGORI[k.tur] === kat.key);
            if (grup.length === 0) return null;
            return (
              <div key={kat.key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: kat.renk }} />
                  <span className="text-[12px] font-bold uppercase tracking-wide text-slate-faint">{t(kat.adKey)}</span>
                  <span className="text-[11.5px] text-slate-faint">· {t(kat.altKey)}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grup.map((k) => {
                    const bagliSayi = baglantilar.filter((b) => b.tur === k.tur).length;
                    return (
                      <button key={k.tur} onClick={() => modalAc(k)} className="group relative flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-brand-300 hover:shadow-card">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: k.renk }}>
                          <Plug className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-ink">{k.ad}</span>
                            {bagliSayi > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-1.5 py-0.5 text-[10px] font-semibold text-ok">
                                <Check className="size-2.5" /> {bagliSayi}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[12.5px] text-slate-muted">{t(`en.platform.${k.tur}`)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* bağlı entegrasyonlar */}
      {baglantilar.length > 0 && (
        <Panel baslik={t("en.bolum.bagli")}>
          <div className="space-y-3">
            {baglantilar.map((b) => {
              const k = katalogMap[b.tur];
              return (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: k?.renk ?? "#2f6fed" }}><Plug className="size-4.5" /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-ink">{b.ad}</span>
                        <Badge ton="gri">{k?.ad ?? b.tur}</Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-muted">
                        <span className="truncate font-mono">{b.hedef.length > 40 ? b.hedef.slice(0, 40) + "…" : b.hedef}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {b.olaylar.map((o) => <span key={o} className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate-muted">{OLAY_TURLERI.find((x) => x.key === o) ? t(`en.olay.${o}`) : o}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-[12px]">
                      <DurumRozeti ton={b.aktif ? "ok" : "gri"} etiket={b.aktif ? t("en.durum.aktif") : t("en.durum.duraklatildi")} nabiz={b.aktif} />
                      <div className="mt-1 text-slate-faint">{t("en.satir.son")} {goreli(b.lastDelivery, t)} · {b.gonderilen} {t("en.satir.gonderi")}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => test(b)}><Send className="size-4" /> {t("en.btn.test")}</Button>
                    <SatirMenu aksiyonlar={[
                      { ad: b.aktif ? t("en.btn.duraklat") : t("en.btn.etkinlestir"), onClick: () => toggle(b) },
                      { ad: t("en.btn.kaldir"), onClick: () => kaldir(b), tehlike: true },
                    ]} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* kurulum modalı */}
      <Modal acik={!!modal} kapat={() => setModal(null)} baslik={modal ? `${modal.ad} ${t("en.modal.bagla")}` : ""} aciklama={modal ? t(`en.platform.${modal.tur}`) : undefined}>
        {modal && (
          <div className="space-y-4">
            <Alan etiket={t("en.modal.baglantiAdi")}>
              <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t("en.modal.baglantiAdiOrnek")} />
            </Alan>
            <Alan etiket={modal.hedefEtiket}>
              <Girdi value={hedef} onChange={(e) => setHedef(e.target.value)} placeholder={modal.ornekHedef} className="font-mono text-[12px]" />
            </Alan>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("en.modal.hangiOlaylar")}</span>
              <div className="space-y-1.5">
                {OLAY_TURLERI.map((o) => {
                  const sec = secOlaylar.includes(o.key);
                  return (
                    <button key={o.key} onClick={() => setSecOlaylar((p) => sec ? p.filter((x) => x !== o.key) : [...p, o.key])} className={cn("flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] transition", sec ? "border-brand-300 bg-brand-50" : "border-line hover:bg-canvas")}>
                      <span className={cn("grid size-4 place-items-center rounded border", sec ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>{sec && <Check className="size-3" />}</span>
                      <span className="flex-1 text-slate-ink">{t(`en.olay.${o.key}`)}</span>
                      <Badge ton={o.onem === "kritik" ? "kirmizi" : o.onem === "uyari" ? "sari" : "mavi"}>{t(`en.onem.${o.onem}`)}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-[12px] text-brand-800">
              <ExternalLink className="size-3.5 shrink-0" />
              {modal.tur === "email" ? t("en.modal.emailIpucu") : `${modal.ad} ${t("en.modal.webhookIpucu")}`}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModal(null)}>{t("en.btn.iptal")}</Button>
              <Button onClick={bagla} disabled={gonderiliyor}><Power className="size-4" /> {gonderiliyor ? t("en.btn.baglaniyor") : t("en.btn.bagla")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
