"use client";

/**
 * Webhook Teslimat İzleme — istemci konsolu (Svix/Hookdeck tarzı)
 * ==============================================================
 * Özet · uç nokta sağlık matrisi · teslimat akışı (filtreli) · DLQ (ölü mektup)
 * · retry backoff görselleştirmesi · HMAC imza doğrulama · başarı trendi.
 *
 * Tüm hesaplar saf `webhook-izleme.ts` katmanından gelir. Yeniden-deneme
 * butonları istemci-tarafı simülasyondur (gerçek teslim motoru sunucudadır);
 * bu dürüstçe belirtilir.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Webhook,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Skull,
  RotateCw,
  ShieldCheck,
  Timer,
  Activity,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Panel, StatKart, Badge, KodBlok, useToast, Tooltip } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, IsiMatris, Gauge } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { wmCeviri } from "./webhook-izleme.i18n";
import type { WebhookDelivery } from "@/lib/db/schema";
import {
  teslimatSinifla,
  ucNoktaIstatistik,
  dlqTespit,
  teslimatOzeti,
  backoffProgrami,
  basariTrendi,
  backoffEtiket,
  RETRY_BACKOFF_MS,
  MAKS_DENEME,
  type TeslimatSinif,
  type UcNoktaSaglik,
} from "@/lib/specter/webhook-izleme";

export interface UcNoktaVeri {
  id: string;
  url: string;
  siteAdi: string;
  events: string[];
  aktif: boolean;
  createdAt: number;
  secretOnek: string;
  imzaBaslik: string;
  teslimatlar: WebhookDelivery[];
}

/** Bu modülün çeviri kısayolu tipi. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ yardımcılar */

/** Göreli zaman etiketi (ör. "3sa önce"). `simdi` prop'tan gelir (deterministik). */
function goreliZaman(ts: number, simdi: number, t: Ceviri): string {
  const fark = Math.max(0, simdi - ts);
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("wm.zaman.azOnce");
  if (dk < 60) return t("wm.zaman.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("wm.zaman.sa").replace("{n}", String(sa));
  const gun = Math.floor(sa / 24);
  return t("wm.zaman.gun").replace("{n}", String(gun));
}

/** Durum kodu → pill rengi sınıfları. Kod değerleri çevrilmez; yalnızca "bağlantı hatası" metni. */
function durumPill(status: number, t: Ceviri): { cls: string; etiket: string } {
  const s = teslimatSinifla(status);
  if (s === "basarili") return { cls: "bg-ok-soft text-green-700 ring-green-200", etiket: String(status) };
  if (s === "kalici-hata") return { cls: "bg-warn-soft text-amber-700 ring-amber-200", etiket: String(status) };
  return { cls: "bg-danger-soft text-red-700 ring-red-200", etiket: status === 0 ? t("wm.durum.baglantiHatasi") : String(status) };
}

/** Sağlık → ton/badge + i18n etiket anahtarı (enum `UcNoktaSaglik` çevrilmez). */
const SAGLIK_META: Record<UcNoktaSaglik, { ton: "ok" | "warn" | "danger"; etiketAnahtar: string; badge: "yesil" | "sari" | "kirmizi" }> = {
  saglikli: { ton: "ok", etiketAnahtar: "wm.saglik.saglikli", badge: "yesil" },
  bozuk: { ton: "warn", etiketAnahtar: "wm.saglik.bozuk", badge: "sari" },
  dlq: { ton: "danger", etiketAnahtar: "wm.saglik.dlq", badge: "kirmizi" },
};

/* ------------------------------------------------------------------ ana bileşen */

export function WebhookIzlemeIstemci({
  ucNoktalar,
  simdi,
  temsiliVeri,
  dil,
}: {
  ucNoktalar: UcNoktaVeri[];
  simdi: number;
  temsiliVeri: boolean;
  dil: Dil;
}) {
  const { goster } = useToast();
  const t = useCallback<Ceviri>((anahtar) => wmCeviri(anahtar, dil), [dil]);

  // Tüm teslimatları birleştir (özet + trend için).
  const tumTeslimatlar = useMemo(() => ucNoktalar.flatMap((u) => u.teslimatlar), [ucNoktalar]);
  const ozet = useMemo(() => teslimatOzeti(tumTeslimatlar), [tumTeslimatlar]);

  // Uç nokta başına istatistik (id → istatistik).
  const istatistikler = useMemo(
    () => new Map(ucNoktalar.map((u) => [u.id, ucNoktaIstatistik(u.teslimatlar)])),
    [ucNoktalar],
  );

  // DLQ öğeleri (uç noktayla ilişkili).
  const dlqOgeler = useMemo(
    () =>
      ucNoktalar.flatMap((u) =>
        dlqTespit(u.teslimatlar).map((oge) => ({ ...oge, ucNokta: u })),
      ),
    [ucNoktalar],
  );

  // Başarı trendi: son 14 kova × 12 saat.
  const trend = useMemo(
    () => basariTrendi(tumTeslimatlar, simdi, 14, 12 * 3600000),
    [tumTeslimatlar, simdi],
  );

  // Akış: tüm teslimatlar (uç nokta bilgisiyle), en yeni üstte.
  const akis = useMemo(
    () =>
      ucNoktalar
        .flatMap((u) => u.teslimatlar.map((d) => ({ d, u })))
        .sort((a, b) => b.d.ts - a.d.ts),
    [ucNoktalar],
  );

  // --- Filtreler ---
  const [durumFiltre, setDurumFiltre] = useState<"hepsi" | TeslimatSinif>("hepsi");
  const [ucFiltre, setUcFiltre] = useState<string>("hepsi");
  const [seciliImza, setSeciliImza] = useState<UcNoktaVeri | null>(ucNoktalar[0] ?? null);

  const filtreliAkis = useMemo(
    () =>
      akis.filter(({ d, u }) => {
        if (ucFiltre !== "hepsi" && u.id !== ucFiltre) return false;
        if (durumFiltre !== "hepsi" && teslimatSinifla(d.status) !== durumFiltre) return false;
        return true;
      }),
    [akis, durumFiltre, ucFiltre],
  );

  // Manuel yeniden deneme (istemci simülasyonu — gerçek motor sunucudadır).
  function yenidenDene(url: string, dlq = false) {
    goster({
      tip: "bilgi",
      baslik: dlq ? t("wm.toast.dlqBaslik") : t("wm.toast.normalBaslik"),
      aciklama: t("wm.toast.aciklama").replace("{url}", url),
    });
  }

  const saglikliSayi = [...istatistikler.values()].filter((s) => s.saglik === "saglikli").length;
  const bozukSayi = [...istatistikler.values()].filter((s) => s.saglik === "bozuk").length;

  // --- Durum sınıfı sayımları (histogram + donut + gauge için) ---
  const sinifSayim = useMemo(() => {
    let basarili = 0;
    let kaliciHata = 0;
    let geciciHata = 0;
    for (const d of tumTeslimatlar) {
      const s = teslimatSinifla(d.status);
      if (s === "basarili") basarili++;
      else if (s === "kalici-hata") kaliciHata++;
      else geciciHata++;
    }
    return { basarili, kaliciHata, geciciHata };
  }, [tumTeslimatlar]);

  // İnce durum-kodu grubu histogramı (2xx / 3xx / 4xx / 5xx / hata).
  const kodKovalari = useMemo(() => {
    const gruplar = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, hata: 0 };
    for (const d of tumTeslimatlar) {
      if (d.status === 0) gruplar.hata++;
      else if (d.status >= 200 && d.status < 300) gruplar["2xx"]++;
      else if (d.status >= 300 && d.status < 400) gruplar["3xx"]++;
      else if (d.status >= 400 && d.status < 500) gruplar["4xx"]++;
      else gruplar["5xx"]++;
    }
    return [
      { etiket: "2xx", deger: gruplar["2xx"], ton: "insan" as const },
      { etiket: "3xx", deger: gruplar["3xx"], ton: "nötr" as const },
      { etiket: "4xx", deger: gruplar["4xx"], ton: "bot" as const },
      { etiket: "5xx", deger: gruplar["5xx"], ton: "bot" as const },
      { etiket: t("wm.durum.baglantiHatasi"), deger: gruplar.hata, ton: "bot" as const },
    ];
  }, [tumTeslimatlar, t]);

  // Uç nokta × durum-sınıfı ısı-matris verisi.
  const isiSatirlar = useMemo(
    () => ucNoktalar.map((u) => (u.siteAdi || u.url).slice(0, 14)),
    [ucNoktalar],
  );
  const isiSutunlar = [t("wm.isi.basarili"), t("wm.isi.kaliciHata"), t("wm.isi.geciciHata")];
  const isiDegerler = useMemo(
    () =>
      ucNoktalar.map((u) => {
        let b = 0;
        let k = 0;
        let g = 0;
        for (const d of u.teslimatlar) {
          const s = teslimatSinifla(d.status);
          if (s === "basarili") b++;
          else if (s === "kalici-hata") k++;
          else g++;
        }
        return [b, k, g];
      }),
    [ucNoktalar],
  );

  // Gecikme sağlık skoru: ≤500ms tam sağlıklı (100), yükseldikçe düşer.
  const gecikmeSaglik = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, ozet.ortGecikme - 500) / 15)));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Webhook className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("wm.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("wm.giris.aciklama")}</p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ozet.toplamTeslimat.toLocaleString("tr-TR")}
          etiket={t("wm.ozet.toplam")}
          ikon={<Send className="size-5" />}
        />
        <StatKart
          sayi={`%${ozet.basariOrani}`}
          etiket={t("wm.ozet.basari")}
          ikon={<CheckCircle2 className="size-5" />}
          tone={ozet.basariOrani >= 95 ? "ok" : ozet.basariOrani >= 85 ? "warn" : "danger"}
        />
        <StatKart
          sayi={`${ozet.ortGecikme}ms`}
          etiket={t("wm.ozet.gecikme")}
          ikon={<Clock className="size-5" />}
          tone={ozet.ortGecikme <= 500 ? "ok" : "warn"}
        />
        <StatKart
          sayi={ozet.dlqSayisi}
          etiket={t("wm.ozet.dlq")}
          ikon={<Skull className="size-5" />}
          tone={ozet.dlqSayisi === 0 ? "ok" : "danger"}
        />
      </div>

      {temsiliVeri && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-warn-soft px-4 py-3 text-[13px] text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: t("wm.temsili") }} />
        </div>
      )}

      {/* teslimat sağlığı özeti: çift gauge + durum donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel baslik={t("wm.saglikOzet.baslik")} className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 py-5">
              <Gauge deger={ozet.basariOrani} etiket={t("wm.saglikOzet.gaugeAlt")} boyut={168} />
              <span className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-muted">
                <CheckCircle2 className="size-3.5 text-ok" /> {t("wm.saglikOzet.gauge")}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 py-5">
              <Gauge deger={gecikmeSaglik} etiket={t("wm.saglikOzet.gecikmeAlt")} boyut={168} />
              <span className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-muted">
                <Timer className="size-3.5 text-brand-600" /> {t("wm.saglikOzet.gecikmeGauge")} · {ozet.ortGecikme}ms
              </span>
            </div>
          </div>
        </Panel>

        <Panel baslik={t("wm.dagilim.baslik")}>
          <p className="mb-3 text-[12.5px] text-slate-muted">{t("wm.dagilim.aciklama")}</p>
          <DonutDagilim
            merkezEtiket={t("wm.ozet.toplam")}
            segmentler={[
              { etiket: t("wm.akis.basarili"), deger: sinifSayim.basarili, renk: "#16a34a" },
              { etiket: t("wm.akis.kaliciHata"), deger: sinifSayim.kaliciHata, renk: "#d97706" },
              { etiket: t("wm.akis.geciciHata"), deger: sinifSayim.geciciHata, renk: "#dc2626" },
            ]}
          />
        </Panel>
      </div>

      {/* durum kodu histogramı + uç nokta×durum ısı-matris */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel baslik={t("wm.dagilim.histoBaslik")}>
          <p className="mb-4 flex items-start gap-1.5 text-[12.5px] text-slate-muted">
            <Activity className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {t("wm.dagilim.histoAciklama")}
          </p>
          <Histogram kovalar={kodKovalari} yukseklik={130} />
        </Panel>

        <Panel baslik={t("wm.isi.baslik")}>
          <p className="mb-4 flex items-start gap-1.5 text-[12.5px] text-slate-muted">
            <Webhook className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {t("wm.isi.aciklama")}
          </p>
          {ucNoktalar.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-faint">{t("wm.matris.bos")}</div>
          ) : (
            <IsiMatris satirlar={isiSatirlar} sutunlar={isiSutunlar} degerler={isiDegerler} />
          )}
        </Panel>
      </div>

      {/* uç nokta sağlık matrisi */}
      <Panel
        baslik={t("wm.matris.baslik")}
        sagUst={
          <div className="flex items-center gap-2 text-[12px] text-slate-muted">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> {t("wm.matris.saglikli").replace("{n}", String(saglikliSayi))}</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warn" /> {t("wm.matris.bozuk").replace("{n}", String(bozukSayi))}</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger2" /> {t("wm.matris.dlq").replace("{n}", String(dlqOgeler.length))}</span>
          </div>
        }
      >
        {ucNoktalar.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-faint">{t("wm.matris.bos")}</div>
        ) : (
          <div className="space-y-3">
            {ucNoktalar.map((u) => {
              const s = istatistikler.get(u.id)!;
              const meta = SAGLIK_META[s.saglik];
              const oranRenk = s.basariOrani >= 95 ? "#16a34a" : s.basariOrani >= 85 ? "#d97706" : "#dc2626";
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Webhook className="size-4" />
                        </span>
                        <span className="truncate font-mono text-[13px] font-medium text-slate-ink">{u.url}</span>
                        <Badge ton={meta.badge}>{t(meta.etiketAnahtar)}</Badge>
                        {!u.aktif && <Badge ton="gri">{t("wm.matris.pasif")}</Badge>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-10">
                        <span className="text-[12px] text-slate-faint">{u.siteAdi}</span>
                        <span className="text-slate-faint">·</span>
                        {u.events.slice(0, 4).map((e) => (
                          <span key={e} className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-slate-muted">
                            {e}
                          </span>
                        ))}
                        {u.events.length > 4 && <span className="text-[11px] text-slate-faint">+{u.events.length - 4}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => yenidenDene(u.url)}>
                      <Send className="size-3.5" /> {t("wm.matris.testTeslimat")}
                    </Button>
                  </div>

                  {/* metrik satırı */}
                  <div className="mt-3 grid grid-cols-2 gap-3 pl-10 sm:grid-cols-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-muted">{t("wm.matris.basariOrani")}</span>
                        <span className="num font-semibold" style={{ color: oranRenk }}>%{s.basariOrani}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.basariOrani}%`, background: oranRenk }} />
                      </div>
                    </div>
                    <MetrikMini etiket={t("wm.matris.gecikme")} deger={`${s.ortGecikme} · ${s.p95Gecikme}ms`} />
                    <MetrikMini etiket={t("wm.matris.yenidenDeneme")} deger={`${s.yenidenDeneme}`} />
                    <div>
                      <div className="mb-1 text-[11px] text-slate-muted">{t("wm.matris.sonDurum")}</div>
                      {s.sonDurum === null ? (
                        <span className="text-[12px] text-slate-faint">—</span>
                      ) : (
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", durumPill(s.sonDurum, t).cls)}>
                          {durumPill(s.sonDurum, t).etiket}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* başarı trendi */}
      <Panel baslik={t("wm.trend.baslik")}>
        <div className="mb-2 flex items-center gap-2 text-[12px] text-slate-muted">
          <Activity className="size-4 text-brand-600" />
          {t("wm.trend.aciklama")}
        </div>
        <TrendGrafik noktalar={trend.oranlar} etiketler={trend.etiketler} renk="#16a34a" yukseklik={220} />
      </Panel>

      {/* teslimat akışı */}
      <Panel
        baslik={t("wm.akis.baslik")}
        sagUst={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-slate-faint" />
            <select
              value={durumFiltre}
              onChange={(e) => setDurumFiltre(e.target.value as typeof durumFiltre)}
              aria-label={t("wm.akis.durumFiltre")}
              className="rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[12px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              <option value="hepsi">{t("wm.akis.tumDurumlar")}</option>
              <option value="basarili">{t("wm.akis.basarili")}</option>
              <option value="kalici-hata">{t("wm.akis.kaliciHata")}</option>
              <option value="gecici-hata">{t("wm.akis.geciciHata")}</option>
            </select>
            <select
              value={ucFiltre}
              onChange={(e) => setUcFiltre(e.target.value)}
              aria-label={t("wm.akis.ucFiltre")}
              className="max-w-[220px] rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[12px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              <option value="hepsi">{t("wm.akis.tumUcNoktalar")}</option>
              {ucNoktalar.map((u) => (
                <option key={u.id} value={u.id}>{u.url}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                {[t("wm.akis.thOlay"), t("wm.akis.thUcNokta"), t("wm.akis.thDurum"), t("wm.akis.thDeneme"), t("wm.akis.thGecikme"), t("wm.akis.thZaman"), ""].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreliAkis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-faint">{t("wm.akis.filtreBos")}</td>
                </tr>
              ) : (
                filtreliAkis.slice(0, 60).map(({ d, u }) => {
                  const pill = durumPill(d.status, t);
                  const sinif = teslimatSinifla(d.status);
                  return (
                    <tr key={d.id} className="border-b border-line last:border-0 transition hover:bg-canvas/60">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-5 shrink-0 place-items-center rounded-md",
                              sinif === "basarili"
                                ? "bg-ok-soft text-green-700"
                                : sinif === "kalici-hata"
                                  ? "bg-warn-soft text-amber-700"
                                  : "bg-danger-soft text-red-700",
                            )}
                          >
                            {sinif === "basarili" ? (
                              <CheckCircle2 className="size-3" />
                            ) : sinif === "kalici-hata" ? (
                              <AlertTriangle className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                          </span>
                          <span className="font-mono text-[12px] text-slate-ink">{d.event}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[220px] truncate font-mono text-[11.5px] text-slate-muted" title={u.url}>{u.url}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", pill.cls)}>
                          {pill.etiket}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("num text-[12px]", d.attempt > 1 ? "font-semibold text-amber-700" : "text-slate-muted")}>
                          #{d.attempt}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="num text-[12px] text-slate-muted">{d.durationMs}ms</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-slate-faint">{goreliZaman(d.ts, simdi, t)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sinif !== "basarili" && (
                          <Tooltip metin={t("wm.akis.yenidenDeneTip")}>
                            <button
                              onClick={() => yenidenDene(u.url)}
                              className="rounded-lg p-1.5 text-slate-faint transition hover:bg-brand-50 hover:text-brand-600"
                              aria-label={t("wm.akis.yenidenDeneAria")}
                            >
                              <RotateCw className="size-3.5" />
                            </button>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtreliAkis.length > 60 && (
          <p className="mt-3 text-center text-[12px] text-slate-faint">{t("wm.akis.limit").replace("{n}", String(filtreliAkis.length))}</p>
        )}
      </Panel>

      {/* DLQ + backoff yan yana */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DLQ */}
        <Panel
          baslik={
            <span className="flex items-center gap-2">
              <Skull className="size-4 text-danger2" /> {t("wm.dlq.baslik")}
            </span>
          }
        >
          {dlqOgeler.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-12 text-center">
              <CheckCircle2 className="mb-2 size-8 text-ok" />
              <p className="text-sm font-medium text-slate-ink">{t("wm.dlq.temizBaslik")}</p>
              <p className="mt-0.5 text-[12px] text-slate-muted">{t("wm.dlq.temizAciklama")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dlqOgeler.map(({ sonKayit, zincir, denemeSayisi, ucNokta }) => (
                <div key={sonKayit.id} className="rounded-2xl border border-red-200 bg-danger-soft/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-medium text-slate-ink">{sonKayit.event}</span>
                        <Badge ton="kirmizi">{t("wm.dlq.denemeTukendi").replace("{n}", String(denemeSayisi))}</Badge>
                      </div>
                      <p className="mt-1 max-w-[280px] truncate font-mono text-[11px] text-slate-muted" title={ucNokta.url}>{ucNokta.url}</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => yenidenDene(ucNokta.url, true)}>
                      <RotateCw className="size-3.5" /> {t("wm.dlq.manuelDene")}
                    </Button>
                  </div>
                  {/* deneme geçmişi */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {zincir.map((d, i) => {
                      const pill = durumPill(d.status, t);
                      return (
                        <span key={d.id} className="flex items-center gap-1">
                          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset", pill.cls)}>
                            #{d.attempt} · {pill.etiket}
                          </span>
                          {i < zincir.length - 1 && <ArrowRight className="size-3 text-slate-faint" />}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-faint">
                    {t("wm.dlq.sonDeneme")
                      .replace("{zaman}", goreliZaman(sonKayit.ts, simdi, t))
                      .replace("{n}", String(denemeSayisi))
                      .replace("{maks}", String(MAKS_DENEME))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* backoff görselleştirmesi */}
        <Panel
          baslik={
            <span className="flex items-center gap-2">
              <Timer className="size-4 text-brand-600" /> {t("wm.backoff.baslik")}
            </span>
          }
        >
          <p className="mb-4 text-[13px] text-slate-muted">
            {t("wm.backoff.aciklama").replace("{maks}", String(MAKS_DENEME))}
          </p>
          <ol className="relative space-y-0">
            {/* İlk deneme */}
            <BackoffSatir sira={1} etiket={t("wm.backoff.ilkEtiket")} alt={t("wm.backoff.ilkAlt")} ilk />
            {backoffProgrami().map((adim) => (
              <BackoffSatir
                key={adim.deneme}
                sira={adim.deneme}
                etiket={t("wm.backoff.denemeEtiket").replace("{n}", String(adim.deneme))}
                alt={t("wm.backoff.denemeAlt").replace("{etiket}", adim.etiket)}
              />
            ))}
            {/* DLQ */}
            <BackoffSatir sira={MAKS_DENEME} etiket={t("wm.backoff.dlqEtiket")} alt={t("wm.backoff.dlqAlt")} dlq />
          </ol>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas/60 px-3 py-2 text-[11.5px] text-slate-muted">
            <Clock className="size-3.5 shrink-0" />
            {t("wm.backoff.pencere")
              .replace("{toplam}", backoffEtiket(RETRY_BACKOFF_MS.reduce((a, b) => a + b, 0)))
              .replace("{adimlar}", RETRY_BACKOFF_MS.map(backoffEtiket).join(" + "))}
          </div>
        </Panel>
      </div>

      {/* HMAC imza doğrulama */}
      <Panel
        baslik={
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-600" /> {t("wm.hmac.baslik")}
          </span>
        }
        sagUst={
          ucNoktalar.length > 1 && (
            <select
              value={seciliImza?.id ?? ""}
              onChange={(e) => setSeciliImza(ucNoktalar.find((u) => u.id === e.target.value) ?? null)}
              aria-label={t("wm.hmac.ucSec")}
              className="max-w-[220px] rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[12px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              {ucNoktalar.map((u) => (
                <option key={u.id} value={u.id}>{u.url}</option>
              ))}
            </select>
          )
        }
      >
        <p className="mb-3 text-[13px] text-slate-muted">
          {t("wm.hmac.aciklama1")} <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[12px]">X-Veylify-Signature</code> {t("wm.hmac.aciklama2")} <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[12px]">t=&lt;zaman&gt;,v1=&lt;hmac-sha256-hex&gt;</code>
        </p>

        {seciliImza && (
          <div className="mb-4 space-y-1.5 rounded-xl border border-line bg-canvas/40 p-3.5">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="font-semibold text-slate-muted">{t("wm.hmac.ucNokta")}</span>
              <span className="font-mono text-slate-ink">{seciliImza.url}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="font-semibold text-slate-muted">{t("wm.hmac.gizliAnahtar")}</span>
              <span className="font-mono text-slate-ink">{seciliImza.secretOnek}</span>
              <Badge ton="gri">{t("wm.hmac.maskeli")}</Badge>
            </div>
            <div className="flex flex-wrap items-start gap-2 text-[12px]">
              <span className="shrink-0 font-semibold text-slate-muted">{t("wm.hmac.ornekImza")}</span>
              <span className="break-all font-mono text-brand-700">{seciliImza.imzaBaslik}</span>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <KodBlok
            baslik={t("wm.hmac.nodeBaslik")}
            dil="javascript"
            kod={`const crypto = require("crypto");

// Specter panelindeki webhook gizli anahtarı (whsec_...)
const SECRET = process.env.SPECTER_WEBHOOK_SECRET;

function dogrula(rawBody, imzaBasligi, toleransSn = 300) {
  const parcalar = Object.fromEntries(
    imzaBasligi.split(",").map((p) => p.split("="))
  );
  const ts = Number(parcalar.t);
  const v1 = parcalar.v1;
  if (!ts || !v1) return false;

  // Tekrar (replay) saldırısına karşı zaman toleransı
  if (Math.abs(Date.now() / 1000 - ts) > toleransSn) return false;

  const beklenen = crypto
    .createHmac("sha256", SECRET)
    .update(ts + "." + rawBody)
    .digest("hex");

  // Zamanlama-güvenli karşılaştırma
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(beklenen, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Express örneği (ham gövde şart!)
app.post("/webhook", express.raw({ type: "*/*" }), (req, res) => {
  const imza = req.header("X-Veylify-Signature");
  if (!dogrula(req.body.toString(), imza)) {
    return res.status(401).send("gecersiz imza");
  }
  const olay = JSON.parse(req.body.toString());
  // ... olayı işle (bot.blocked, ai_agent.detected, ...)
  res.sendStatus(200);
});`}
          />
          <KodBlok
            baslik={t("wm.hmac.pythonBaslik")}
            dil="python"
            kod={`import hmac, hashlib, time

SECRET = os.environ["SPECTER_WEBHOOK_SECRET"]

def dogrula(raw_body: bytes, imza_basligi: str, tolerans_sn: int = 300) -> bool:
    parcalar = dict(p.split("=", 1) for p in imza_basligi.split(","))
    ts = int(parcalar.get("t", 0))
    v1 = parcalar.get("v1", "")
    if not ts or not v1:
        return False

    # Replay toleransı
    if abs(time.time() - ts) > tolerans_sn:
        return False

    beklenen = hmac.new(
        SECRET.encode(),
        f"{ts}.{raw_body.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()

    # Zamanlama-güvenli karşılaştırma
    return hmac.compare_digest(v1, beklenen)

# Flask örneği
@app.post("/webhook")
def webhook():
    imza = request.headers.get("X-Veylify-Signature", "")
    if not dogrula(request.get_data(), imza):
        return "gecersiz imza", 401
    olay = request.get_json()
    # ... olayi isle
    return "", 200`}
          />
        </div>
      </Panel>

      {/* not */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span dangerouslySetInnerHTML={{ __html: t("wm.not.metin") }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ alt bileşenler */

function MetrikMini({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-slate-muted">{etiket}</div>
      <div className="num text-[13px] font-semibold text-slate-ink">{deger}</div>
    </div>
  );
}

function BackoffSatir({
  sira,
  etiket,
  alt,
  ilk,
  dlq,
}: {
  sira: number;
  etiket: string;
  alt: string;
  ilk?: boolean;
  dlq?: boolean;
}) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* dikey çizgi */}
      <div className="absolute left-[13px] top-6 h-[calc(100%-1rem)] w-px bg-line last:hidden" />
      <span
        className={cn(
          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
          dlq ? "bg-danger-soft text-red-700 ring-1 ring-red-200" : ilk ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
        )}
      >
        {dlq ? <Skull className="size-3.5" /> : sira}
      </span>
      <div className="pt-0.5">
        <div className={cn("text-[13px] font-medium", dlq ? "text-red-700" : "text-slate-ink")}>{etiket}</div>
        <div className="text-[11.5px] text-slate-faint">{alt}</div>
      </div>
    </li>
  );
}
