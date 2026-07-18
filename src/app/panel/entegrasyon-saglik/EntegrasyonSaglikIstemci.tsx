"use client";

/**
 * Entegrasyon Sağlık & Test Konsolu — istemci
 * ============================================
 * Bağlı entegrasyonların (Slack/Discord/Teams/webhook/PagerDuty/e-posta/Zapier)
 * teslimat sağlığını izler, her biri için CANLI test-atışı yapar (gerçek
 * /api/integrations PATCH · action:test), kurulum doğrulamasını ve olay-tipi
 * kapsamasını gösterir. Katalog/kurulum ekranı ayrıdır (/panel/entegrasyonlar);
 * burası sağlık/test görünümüdür (Zapier/n8n tarzı bağlantı gözlemlenebilirliği).
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, PlugZap, Send, CheckCircle2, AlertTriangle, XCircle, Circle,
  ShieldCheck, Radio, ExternalLink, RefreshCw, PauseCircle, Zap, Inbox, ArrowRight,
} from "lucide-react";
import {
  Panel, StatKart, Badge, DurumRozeti, BosDurum, NotKutusu, Ilerleme, useToast,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { ENTEGRASYON_KATALOG, OLAY_TURLERI } from "@/lib/specter/integrations";
import {
  type EntegrasyonSaglik, type FiloOzet, type OlayKapsama, type SaglikDurum,
  durumTon,
} from "@/lib/specter/entegrasyon-saglik";
import type { Dil } from "@/lib/i18n/panel";
import { esCeviri } from "./entegrasyon-saglik.i18n";
import { cn } from "@/lib/cn";

/* Platform meta: renk + ad (katalogdan). */
const KATALOG = Object.fromEntries(ENTEGRASYON_KATALOG.map((k) => [k.tur, k]));

/** t yardımcısı tipi (çeviri fonksiyonu). */
type Ceviri = (anahtar: string) => string;

/* Göreli zaman (istemci — canlı; sunucu `now`'una göre değil, gerçek "şimdi"). */
function goreli(ts: number | null, t: Ceviri): string {
  if (!ts) return t("es.zaman.hic");
  const dk = Math.floor((Date.now() - ts) / 60000);
  if (dk < 1) return t("es.zaman.azOnce");
  if (dk < 60) return t("es.zaman.dkOnce").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("es.zaman.saOnce").replace("{n}", String(sa));
  return t("es.zaman.gunOnce").replace("{n}", String(Math.floor(sa / 24)));
}

/* Durum → çevrili etiket (lib durumEtiket TR yerine istemcide türetilir; enum güvenli). */
function durumEtiketCevrili(durum: SaglikDurum, t: Ceviri): string {
  return t(`es.durum.${durum}`);
}

/* Durum → ikon. */
function DurumIkon({ durum, className }: { durum: SaglikDurum; className?: string }) {
  if (durum === "saglikli") return <CheckCircle2 className={cn("text-ok", className)} />;
  if (durum === "uyari") return <AlertTriangle className={cn("text-warn", className)} />;
  if (durum === "bozuk") return <XCircle className={cn("text-danger2", className)} />;
  return <PauseCircle className={cn("text-slate-faint", className)} />;
}

const SKOR_RENK = (s: number) => (s >= 85 ? "#16a34a" : s >= 65 ? "#2f6fed" : s >= 45 ? "#d97706" : "#dc2626");
const ONEM_TON = (o: string): "kirmizi" | "sari" | "mavi" => (o === "kritik" ? "kirmizi" : o === "uyari" ? "sari" : "mavi");

/** Bir entegrasyonun canlı test sonucu (istemci-yerel durum). */
interface TestSonuc {
  durum: "calisiyor" | "basari" | "hata";
  status?: number;
  ts: number;
}

export function EntegrasyonSaglikIstemci({
  saglikList: ilk,
  ozet: ilkOzet,
  kapsama,
  now,
  dil,
}: {
  saglikList: EntegrasyonSaglik[];
  ozet: FiloOzet;
  kapsama: OlayKapsama[];
  now: number;
  dil: Dil;
}) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (anahtar: string) => esCeviri(anahtar, dil);
  const [saglikList] = useState(ilk);
  const [ozet] = useState(ilkOzet);
  const [testSonuc, setTestSonuc] = useState<Record<string, TestSonuc>>({});
  const [tumTest, setTumTest] = useState(false);
  void now;

  const bosMu = saglikList.length === 0;

  /* Boşluk (kapsanmayan olay) sayısı — özellikle kritik olanlar. */
  const kapsanmayan = useMemo(() => kapsama.filter((k) => !k.kapsandi), [kapsama]);
  const kritikBosluk = useMemo(() => kapsanmayan.filter((k) => k.onem === "kritik"), [kapsanmayan]);

  /** Tek bir entegrasyona GERÇEK test bildirimi gönderir (/api/integrations PATCH). */
  async function testGonder(s: EntegrasyonSaglik): Promise<boolean> {
    setTestSonuc((p) => ({ ...p, [s.id]: { durum: "calisiyor", ts: Date.now() } }));
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, action: "test" }),
      });
      const d = await res.json().catch(() => ({ ok: false, status: 0 }));
      const basarili = !!d.ok;
      setTestSonuc((p) => ({
        ...p,
        [s.id]: { durum: basarili ? "basari" : "hata", status: d.status, ts: Date.now() },
      }));
      return basarili;
    } catch {
      // Ağ/istisna → nazikçe hata durumu.
      setTestSonuc((p) => ({ ...p, [s.id]: { durum: "hata", status: 0, ts: Date.now() } }));
      return false;
    }
  }

  /** Tek test + toast + sunucu tazeleme. */
  async function tekliTest(s: EntegrasyonSaglik) {
    goster({ tip: "bilgi", baslik: t("es.toast.testEdiliyor").replace("{ad}", s.ad) });
    const ok = await testGonder(s);
    goster(
      ok
        ? { tip: "basari", baslik: t("es.toast.teslimEdildi"), aciklama: t("es.toast.calisiyor").replace("{ad}", s.ad) }
        : { tip: "hata", baslik: t("es.toast.teslimEdilemedi"), aciklama: t("es.toast.ulasilamadi").replace("{ad}", s.ad) },
    );
    router.refresh();
  }

  /** Tüm AKTİF entegrasyonları sırayla test et (canlı sağlık taraması). */
  async function tumunuTest() {
    const hedefler = saglikList.filter((s) => s.aktif);
    if (hedefler.length === 0) {
      goster({ tip: "bilgi", baslik: t("es.toast.aktifYok") });
      return;
    }
    setTumTest(true);
    let basari = 0;
    for (const s of hedefler) {
      // Sıralı: hedef sunucuları aynı anda bombalamamak için.
      const ok = await testGonder(s);
      if (ok) basari++;
    }
    setTumTest(false);
    goster({
      tip: basari === hedefler.length ? "basari" : "bilgi",
      baslik: t("es.toast.taramaTamam")
        .replace("{basari}", String(basari))
        .replace("{toplam}", String(hedefler.length)),
    });
    router.refresh();
  }

  /* --------------------------------------------------------- BOŞ DURUM */
  if (bosMu) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
        <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
          <Activity className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-slate-ink">{t("es.bos.baslik")}</p>
            <p className="mt-0.5 text-[13px] text-slate-muted">
              {t("es.bos.metin")}
            </p>
          </div>
        </div>
        <BosDurum
          ikon={<PlugZap className="size-7" />}
          baslik={t("es.bos.durumBaslik")}
          aciklama={t("es.bos.durumMetin")}
          aksiyon={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button href="/panel/entegrasyonlar"><PlugZap className="size-4" /> {t("es.bos.baglaBtn")}</Button>
              <Button variant="outline" href="/panel/bildirim-kanali"><Radio className="size-4" /> {t("es.bos.yonlendirBtn")}</Button>
            </div>
          }
        />
      </div>
    );
  }

  /* --------------------------------------------------------- DOLU DURUM */
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım + tüm test */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-slate-ink">{t("es.intro.baslik")}</p>
            <p className="mt-0.5 max-w-2xl text-[13px] text-slate-muted">
              {t("es.intro.metin")}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={tumunuTest} disabled={tumTest}>
          <RefreshCw className={cn("size-4", tumTest && "animate-spin")} /> {tumTest ? t("es.taraniyor") : t("es.tumTest")}
        </Button>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam} etiket={t("es.ozet.toplam")} ikon={<PlugZap className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.aktif} etiket={t("es.ozet.aktif")} ikon={<Zap className="size-5" />} tone="ok" />
        <StatKart sayi={ozet.saglikli} etiket={t("es.ozet.saglikli")} ikon={<CheckCircle2 className="size-5" />} tone={ozet.saglikli === ozet.aktif ? "ok" : "warn"} />
        <StatKart sayi={ozet.bozuk} etiket={t("es.ozet.sonBasarisiz")} ikon={<XCircle className="size-5" />} tone={ozet.bozuk > 0 ? "danger" : "ok"} />
      </div>

      {/* filo sağlık şeridi */}
      <Panel baslik={t("es.filo.baslik")}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-4">
            <span className="num text-[38px] font-bold leading-none" style={{ color: SKOR_RENK(ozet.ortSkor) }}>%{ozet.ortSkor}</span>
            <div>
              <div className="text-[14px] font-semibold text-slate-ink">{t("es.filo.ortSkor")}</div>
              <div className="text-[13px] text-slate-muted">{t("es.filo.toplamGonderi").replace("{n}", ozet.toplamGonderi.toLocaleString(dil))}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DagilimRozet ton="ok" sayi={ozet.saglikli} etiket={t("es.durum.saglikli")} />
            <DagilimRozet ton="warn" sayi={ozet.uyari} etiket={t("es.durum.uyari")} />
            <DagilimRozet ton="danger" sayi={ozet.bozuk} etiket={t("es.durum.bozuk")} />
            <DagilimRozet ton="gri" sayi={ozet.pasif} etiket={t("es.durum.pasif")} />
          </div>
        </div>
        {ozet.kritikHataVar && (
          <div className="mt-4">
            <NotKutusu ton="kirmizi" baslik={t("es.filo.kurulumHataBaslik")}>
              {t("es.filo.kurulumHataMetin")}
            </NotKutusu>
          </div>
        )}
      </Panel>

      {/* olay tipi kapsama */}
      <Panel baslik={t("es.kapsama.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("es.kapsama.metin")}
        </p>
        {kritikBosluk.length > 0 && (
          <div className="mb-4">
            <NotKutusu ton="sari" baslik={t("es.kapsama.kritikBaslik").replace("{n}", String(kritikBosluk.length))}>
              {t("es.kapsama.kritikMetin").replace("{liste}", kritikBosluk.map((k) => t(`es.olay.${k.key}`)).join(", "))}
            </NotKutusu>
          </div>
        )}
        <div className="space-y-2">
          {kapsama.map((k) => (
            <div key={k.key} className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
              k.kapsandi ? "border-line bg-surface" : "border-amber-200 bg-warn-soft/50",
            )}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", k.kapsandi ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
                  {k.kapsandi ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium text-slate-ink">{t(`es.olay.${k.key}`)}</span>
                    <span className="font-mono text-[11px] text-slate-faint">{k.key}</span>
                    <Badge ton={ONEM_TON(k.onem)}>{t(`es.onem.${k.onem}`)}</Badge>
                  </div>
                  {k.kapsandi ? (
                    <div className="mt-0.5 truncate text-[12px] text-slate-muted">{k.kanallar.join(" · ")}</div>
                  ) : (
                    <div className="mt-0.5 text-[12px] text-amber-700">{t("es.kapsama.kanalYok")}</div>
                  )}
                </div>
              </div>
              <div className="text-right text-[12px] text-slate-muted">
                <span className="num font-semibold text-slate-ink">{k.aktifKanal}</span> {t("es.kapsama.aktif")}
                {k.toplamKanal > k.aktifKanal && <span className="text-slate-faint"> {t("es.kapsama.toplam").replace("{n}", String(k.toplamKanal))}</span>} {t("es.kapsama.kanal")}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* entegrasyon sağlık matrisi */}
      <Panel baslik={t("es.matris.baslik")}>
        <div className="space-y-3">
          {saglikList.map((s) => {
            const k = KATALOG[s.tur];
            const ts = testSonuc[s.id];
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-2xl border bg-surface p-4 transition",
                  s.durum === "bozuk" ? "border-red-200" : s.durum === "uyari" ? "border-amber-200" : "border-line",
                )}
              >
                {/* üst satır: platform + durum + test */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: k?.renk ?? "#2f6fed" }}>
                      <PlugZap className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-ink">{s.ad}</span>
                        <Badge ton="gri">{k?.ad ?? s.tur}</Badge>
                        <DurumRozeti ton={durumTon(s.durum)} etiket={durumEtiketCevrili(s.durum, t)} nabiz={s.durum === "saglikli"} />
                      </div>
                      <div className="mt-1 truncate font-mono text-[12px] text-slate-muted">{s.hedefMaskeli}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.olaylar.map((o) => (
                          <span key={o} className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate-muted">
                            {OLAY_TURLERI.find((x) => x.key === o) ? t(`es.olay.${o}`) : o}
                          </span>
                        ))}
                        {s.olaylar.length === 0 && <span className="text-[11px] text-danger2">{t("es.matris.olaySecilmemis")}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <DurumIkon durum={s.durum} className="size-4" />
                      <span className="num text-[15px] font-bold" style={{ color: SKOR_RENK(s.skor) }}>%{s.skor}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => tekliTest(s)}
                      disabled={ts?.durum === "calisiyor" || tumTest}
                    >
                      {ts?.durum === "calisiyor"
                        ? <><RefreshCw className="size-4 animate-spin" /> {t("es.matris.gonderiliyor")}</>
                        : <><Send className="size-4" /> {t("es.matris.testGonder")}</>}
                    </Button>
                  </div>
                </div>

                {/* sağlık göstergesi */}
                <div className="mt-3.5">
                  <Ilerleme deger={s.skor} ton={s.durum === "saglikli" ? "ok" : s.durum === "uyari" ? "warn" : s.durum === "bozuk" ? "danger" : "brand"} />
                </div>

                {/* teslimat metrikleri */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metrik etiket={t("es.metrik.sonTeslimat")} deger={goreli(s.lastDelivery, t)} />
                  <Metrik
                    etiket={t("es.metrik.durumKodu")}
                    deger={s.lastStatus === null ? "—" : s.lastStatus === 0 ? t("es.metrik.baglantiHatasi") : `HTTP ${s.lastStatus}`}
                    ton={s.lastStatus === null ? undefined : s.lastStatus >= 200 && s.lastStatus < 300 ? "ok" : "danger"}
                  />
                  <Metrik etiket={t("es.metrik.gonderilen")} deger={s.gonderilen.toLocaleString(dil)} />
                  <Metrik etiket={t("es.metrik.kurulum")} deger={t("es.metrik.gecti").replace("{gecen}", String(s.gecenKontrol)).replace("{toplam}", String(s.toplamKontrol))} ton={s.gecenKontrol === s.toplamKontrol ? "ok" : undefined} />
                </div>

                {/* canlı test sonucu */}
                {ts && ts.durum !== "calisiyor" && (
                  <div className={cn(
                    "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px]",
                    ts.durum === "basari" ? "border-green-200 bg-ok-soft text-green-800" : "border-red-200 bg-danger-soft text-red-800",
                  )}>
                    {ts.durum === "basari" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                    <span>
                      {ts.durum === "basari"
                        ? t("es.test.teslimEdildi").replace("{ek}", ts.status ? ` (HTTP ${ts.status})` : "")
                        : t("es.test.basarisiz").replace("{ek}", ts.status ? ` (${ts.status === 0 ? t("es.metrik.baglantiHatasi") : "HTTP " + ts.status})` : "")}
                    </span>
                  </div>
                )}

                {/* kurulum doğrulama checklist */}
                <div className="mt-3 rounded-xl border border-line bg-canvas/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                    <ShieldCheck className="size-3.5" /> {t("es.dogrulama.baslik")}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {s.kontroller.map((c) => (
                      <div key={c.anahtar} className="flex items-start gap-2">
                        <span className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md",
                          c.gecti ? "bg-ok-soft text-ok" : c.kritik ? "bg-danger-soft text-danger2" : "bg-warn-soft text-warn",
                        )}>
                          {c.gecti ? <CheckCircle2 className="size-3" /> : c.kritik ? <XCircle className="size-3" /> : <AlertTriangle className="size-3" />}
                        </span>
                        <div className="min-w-0">
                          {/* c.etiket / c.detay lib motorundan gelir (canlı sayı içerir) → veri olarak TR kalır. */}
                          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-ink">
                            {c.etiket}
                            {c.kritik && !c.gecti && <Badge ton="kirmizi">{t("es.dogrulama.kritik")}</Badge>}
                          </div>
                          <div className="text-[11.5px] leading-snug text-slate-muted">{c.detay}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* teslimat geçmişi özeti (dürüst — veri seyrekse öyle söyle) */}
      <Panel baslik={t("es.teslimat.baslik")}>
        <TeslimatOzeti saglikList={saglikList} t={t} dil={dil} />
      </Panel>

      {/* alt bağlantılar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BaglantiKart
          ikon={<PlugZap className="size-5" />}
          baslik={t("es.alt.ekleBaslik")}
          aciklama={t("es.alt.ekleMetin")}
          href="/panel/entegrasyonlar"
        />
        <BaglantiKart
          ikon={<Radio className="size-5" />}
          baslik={t("es.alt.yonlendirBaslik")}
          aciklama={t("es.alt.yonlendirMetin")}
          href="/panel/bildirim-kanali"
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span dangerouslySetInnerHTML={{ __html: t("es.dipnot") }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- alt parçalar */

function DagilimRozet({ ton, sayi, etiket }: { ton: "ok" | "warn" | "danger" | "gri"; sayi: number; etiket: string }) {
  const stil = {
    ok: "bg-ok-soft text-green-700 ring-green-200",
    warn: "bg-warn-soft text-amber-700 ring-amber-200",
    danger: "bg-danger-soft text-red-700 ring-red-200",
    gri: "bg-slate-100 text-slate-600 ring-slate-200",
  }[ton];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ring-1 ring-inset", stil)}>
      <span className="num text-[15px] font-bold">{sayi}</span> {etiket}
    </span>
  );
}

function Metrik({ etiket, deger, ton }: { etiket: string; deger: string; ton?: "ok" | "danger" }) {
  const renk = ton === "ok" ? "text-ok" : ton === "danger" ? "text-danger2" : "text-slate-ink";
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="text-[11px] text-slate-faint">{etiket}</div>
      <div className={cn("mt-0.5 truncate text-[13px] font-semibold", renk)}>{deger}</div>
    </div>
  );
}

function BaglantiKart({ ikon, baslik, aciklama, href }: { ikon: React.ReactNode; baslik: string; aciklama: string; href: string }) {
  return (
    <a href={href} className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand-300 hover:shadow-card">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{ikon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-ink">{baslik}<ExternalLink className="size-3.5 text-slate-faint transition group-hover:text-brand-600" /></div>
        <div className="mt-0.5 text-[12.5px] text-slate-muted">{aciklama}</div>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </a>
  );
}

/** Teslimat geçmişi özeti — mevcut lastDelivery/gonderilen verisinden dürüst özet. */
function TeslimatOzeti({ saglikList, t, dil }: { saglikList: EntegrasyonSaglik[]; t: Ceviri; dil: Dil }) {
  const teslimatliOlan = saglikList.filter((s) => s.lastDelivery !== null);
  const toplamGonderi = saglikList.reduce((a, s) => a + s.gonderilen, 0);

  if (teslimatliOlan.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 px-4 py-4 text-[13px] text-slate-muted">
        <Inbox className="size-5 shrink-0 text-slate-faint" />
        <span dangerouslySetInnerHTML={{ __html: t("es.teslimat.bos") }} />
      </div>
    );
  }

  // En çok gönderim yapan + en son teslimat.
  const enAktif = [...saglikList].sort((a, b) => b.gonderilen - a.gonderilen)[0];
  const enSon = [...teslimatliOlan].sort((a, b) => (b.lastDelivery ?? 0) - (a.lastDelivery ?? 0))[0];
  const basarisiz = teslimatliOlan.filter((s) => s.lastStatus === null || s.lastStatus < 200 || s.lastStatus >= 300);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-[12px] text-slate-faint">{t("es.teslimat.toplamGonderilen")}</div>
          <div className="num mt-0.5 text-[22px] font-bold text-slate-ink">{toplamGonderi.toLocaleString(dil)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-[12px] text-slate-faint">{t("es.teslimat.enSon")}</div>
          <div className="mt-0.5 text-[14px] font-semibold text-slate-ink">{enSon.ad}</div>
          <div className="text-[12px] text-slate-muted">{goreli(enSon.lastDelivery, t)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-[12px] text-slate-faint">{t("es.teslimat.enCok")}</div>
          <div className="mt-0.5 text-[14px] font-semibold text-slate-ink">{enAktif.ad}</div>
          <div className="text-[12px] text-slate-muted">{t("es.teslimat.bildirim").replace("{n}", enAktif.gonderilen.toLocaleString(dil))}</div>
        </div>
      </div>
      {basarisiz.length > 0 ? (
        <NotKutusu ton="sari">
          {t("es.teslimat.basarisizNot")
            .replace("{n}", String(basarisiz.length))
            .replace("{liste}", basarisiz.map((s) => s.ad).join(", "))}
        </NotKutusu>
      ) : (
        <div className="flex items-center gap-2 text-[13px] text-green-700">
          <CheckCircle2 className="size-4" /> {t("es.teslimat.hepsiBasarili")}
        </div>
      )}
      <p className="flex items-start gap-1.5 text-[12px] text-slate-faint">
        <Circle className="mt-1 size-2.5 shrink-0 fill-slate-300 text-slate-300" />
        {t("es.teslimat.not")}
      </p>
    </div>
  );
}
