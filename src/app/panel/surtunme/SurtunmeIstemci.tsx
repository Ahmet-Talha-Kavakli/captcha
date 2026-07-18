"use client";

/**
 * Sürtünme Analizi (istemci) — ghost-font challenge'ının UX-kalite konsolu.
 * Ölçülen (gerçek sayaç) ve modellenmiş (temsili) metrikler net ayrılır;
 * her modellenmiş bölümde dürüst not vardır.
 *
 * ÇEVİRİ: Motor bazı TR metinler üretir; bunlar burada sabit anahtarlarla
 * yeniden türetilir (bkz. surtunme.i18n.ts). Motor DÜZENLENMEZ.
 */
import { Gauge, TrendingDown, LogOut, Eye, ArrowRight, Info, AlertTriangle, ShieldAlert, Users, Clock } from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { surtunmeCeviri } from "./surtunme.i18n";
import type {
  CozumHunisi,
  SurtunmeSonuc,
  SurtunmeSeviye,
  InsanCozumTahmin,
  GunlukTrendNokta,
  ZorlukSurtunmeSatir,
} from "@/lib/specter/surtunme";

interface Props {
  huni: CozumHunisi;
  surtunme: SurtunmeSonuc;
  insan: InsanCozumTahmin;
  ortSure: number;
  trend: GunlukTrendNokta[];
  zorluk: ZorlukSurtunmeSatir[];
  planAd: string;
  dil: Dil;
}

/** Sayı biçimi için BCP-47 yerel kodları. */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Sürtünme skoruna göre renk (düşük = iyi = yeşil). */
function surtunmeRenk(skor: number): string {
  return skor >= 60 ? "#dc2626" : skor >= 30 ? "#d97706" : "#16a34a";
}

/**
 * Motorun `oneriler` mantığının birebir aynası — TR metin yerine sabit
 * anahtar döndürür. Böylece motor düzenlenmeden öneriler çevrilir.
 */
function oneriTuret(
  huni: CozumHunisi,
  surtunme: SurtunmeSonuc,
  insan: InsanCozumTahmin,
): { anahtar: string; tip: "bilgi" | "uyari" | "kritik" }[] {
  const list: { anahtar: string; tip: "bilgi" | "uyari" | "kritik" }[] = [];

  if (surtunme.seviye === "yüksek") list.push({ anahtar: "azalt", tip: "kritik" });
  else if (surtunme.seviye === "orta") list.push({ anahtar: "inceAyar", tip: "uyari" });

  const engelOran = huni.gosterildi > 0 ? (huni.engellendi / huni.gosterildi) * 100 : 0;
  if (huni.cozumOran >= 97 && engelOran < 3 && huni.gosterildi > 0) list.push({ anahtar: "sikilastir", tip: "uyari" });

  if (huni.terkOran >= 15) list.push({ anahtar: "terk", tip: "uyari" });

  if (insan.challengeGoren > 0 && insan.tahminiOran < 85) list.push({ anahtar: "insanDusuk", tip: "uyari" });

  if (list.length === 0) list.push({ anahtar: "saglikli", tip: "bilgi" });

  return list;
}

export function SurtunmeIstemci({ huni, surtunme, insan, ortSure, trend, zorluk, planAd, dil }: Props) {
  const t = (anahtar: string) => surtunmeCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const sayi = (n: number) => n.toLocaleString(yerel);
  // Seviye enum'unu (düşük/orta/yüksek) çevrilebilir etikete eşle.
  const seviyeEtiket = (s: SurtunmeSeviye) => t(`su.seviye.${s}`);

  const bosVeri = huni.gosterildi === 0;

  // Trend grafiği: günlük çözüm oranı serisi.
  const trendNoktalar = trend.map((tt) => tt.cozumOran);
  const trendEtiketler = trend.map((tt) => tt.gun.slice(5)); // MM-DD

  // En düşük sürtünmeli zorluk = önerilen sweet-spot (yeterli güvenlikle).
  const sweet = [...zorluk].sort((a, b) => a.surtunmeSkor - b.surtunmeSkor)[0];

  const oneri = oneriTuret(huni, surtunme, insan);

  const oneriRenk: Record<"bilgi" | "uyari" | "kritik", { border: string; bg: string; ikon: React.ReactNode }> = {
    kritik: { border: "border-danger-soft", bg: "bg-danger-soft/40", ikon: <ShieldAlert className="size-4 text-danger2" /> },
    uyari: { border: "border-warn-soft", bg: "bg-warn-soft/40", ikon: <AlertTriangle className="size-4 text-warn" /> },
    bilgi: { border: "border-brand-100", bg: "bg-brand-50/50", ikon: <Info className="size-4 text-brand-600" /> },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Gauge className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("su.intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("su.intro.metin")}</p>
        </div>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={`%${huni.cozumOran}`}
          etiket={t("su.stat.cozumOran")}
          ikon={<TrendingDown className="size-5" />}
          tone={huni.cozumOran >= 90 ? "ok" : huni.cozumOran >= 75 ? "warn" : "danger"}
        />
        <StatKart
          sayi={`%${huni.terkOran}`}
          etiket={t("su.stat.terkOran")}
          ikon={<LogOut className="size-5" />}
          tone={huni.terkOran <= 8 ? "ok" : huni.terkOran <= 15 ? "warn" : "danger"}
        />
        <StatKart
          sayi={surtunme.skor}
          etiket={`${t("su.stat.surtunmeSkoru")} · ${seviyeEtiket(surtunme.seviye)}`}
          ikon={<Gauge className="size-5" />}
          tone={surtunme.seviye === "düşük" ? "ok" : surtunme.seviye === "orta" ? "warn" : "danger"}
        />
        <StatKart sayi={sayi(huni.gosterildi)} etiket={t("su.stat.gosterim")} />
      </div>

      {/* Sürtünme skoru yorumu */}
      <div
        className="flex items-start gap-3 rounded-2xl border px-5 py-4"
        style={{ borderColor: surtunmeRenk(surtunme.skor) + "33", background: surtunmeRenk(surtunme.skor) + "0f" }}
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl text-white"
          style={{ background: surtunmeRenk(surtunme.skor) }}
        >
          <Gauge className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-slate-ink">
              {t("su.yorum.baslik").replace("{seviye}", seviyeEtiket(surtunme.seviye))}
            </span>
            <Badge ton={surtunme.seviye === "düşük" ? "yesil" : surtunme.seviye === "orta" ? "sari" : "kirmizi"}>
              {t("su.yorum.skor").replace("{skor}", String(surtunme.skor))}
            </Badge>
            <span className="text-[12px] text-slate-faint">{t("su.yorum.ipucu")}</span>
          </div>
          <p className="mt-1 text-[13px] text-slate-muted">{t(`su.yorum.${surtunme.seviye}`)}</p>
        </div>
      </div>

      {/* Çözüm hunisi */}
      <Panel baslik={t("su.huni.baslik")}>
        {bosVeri ? (
          <div className="grid h-40 place-items-center rounded-xl border border-dashed border-line text-[13px] text-slate-faint">
            {t("su.huni.bos")}
          </div>
        ) : (
          <div className="space-y-3">
            <HuniSatir etiket={t("su.huni.gosterildi")} alt={t("su.huni.gosterildi.alt")} deger={huni.gosterildi} taban={huni.gosterildi} renk="#2f6fed" ikon={<Eye className="size-4" />} yerel={yerel} />
            <HuniSatir etiket={t("su.huni.cozuldu")} alt={t("su.huni.cozuldu.alt")} deger={huni.cozuldu} taban={huni.gosterildi} renk="#16a34a" ikon={<ArrowRight className="size-4" />} yuzde={huni.cozumOran} yerel={yerel} />
            <HuniSatir etiket={t("su.huni.engellendi")} alt={t("su.huni.engellendi.alt")} deger={huni.engellendi} taban={huni.gosterildi} renk="#7c3aed" ikon={<ShieldAlert className="size-4" />} yerel={yerel} />
            <HuniSatir etiket={t("su.huni.terkedildi")} alt={t("su.huni.terkedildi.alt")} deger={huni.terkedildi} taban={huni.gosterildi} renk="#dc2626" ikon={<LogOut className="size-4" />} yuzde={huni.terkOran} yerel={yerel} />
          </div>
        )}
        <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-canvas/50 px-3 py-2 text-[12px] text-slate-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
          {(() => {
            const metin = t("su.huni.dipnot");
            const parcalar = metin.split(/(\{yaklasim\})/g);
            return parcalar.map((p, i) =>
              p === "{yaklasim}" ? <b key={i} className="mx-1">{t("su.huni.dipnot.yaklasim")}</b> : <span key={i}>{p}</span>,
            );
          })()}
        </p>
      </Panel>

      {/* Günlük çözüm-oranı trendi */}
      <Panel baslik={t("su.trend.baslik")}>
        <TrendGrafik
          noktalar={trendNoktalar}
          etiketler={trendEtiketler}
          renk="#16a34a"
          yukseklik={220}
        />
        <p className="mt-3 text-[12px] text-slate-faint">{t("su.trend.dipnot")}</p>
      </Panel>

      {/* İnsan çözüm tahmini */}
      <Panel baslik={t("su.insan.baslik")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat ikon={<Users className="size-4" />} deger={sayi(insan.insanOlay)} etiket={t("su.insan.insanOlay")} />
          <MiniStat ikon={<Eye className="size-4" />} deger={sayi(insan.challengeGoren)} etiket={t("su.insan.challengeGoren")} />
          <MiniStat ikon={<ArrowRight className="size-4" />} deger={`%${insan.tahminiOran}`} etiket={t("su.insan.tahminiOran")} tone={insan.tahminiOran >= 90 ? "ok" : insan.tahminiOran >= 80 ? "warn" : "danger"} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MiniStat ikon={<Clock className="size-4" />} deger={`${ortSure} ${t("su.insan.sn")}`} etiket={t("su.insan.ortSure")} />
          <MiniStat ikon={<Gauge className="size-4" />} deger={insan.ortSkor.toFixed(2)} etiket={t("su.insan.ortSkor")} />
        </div>
        <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-canvas/50 px-3 py-2 text-[12px] text-slate-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
          {(() => {
            const metin = t("su.insan.dipnot");
            const parcalar = metin.split(/(\{tahmin\}|\{modellenmis\})/g);
            return parcalar.map((p, i) =>
              p === "{tahmin}" ? <b key={i} className="mx-1">{t("su.insan.dipnot.tahmin")}</b> :
              p === "{modellenmis}" ? <b key={i} className="mx-1">{t("su.insan.dipnot.modellenmis")}</b> :
              <span key={i}>{p}</span>,
            );
          })()}
        </p>
      </Panel>

      {/* Zorluk-bazlı sürtünme */}
      <Panel baslik={t("su.zorluk.baslik")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="pb-2 pr-3 font-semibold">{t("su.zorluk.th.zorluk")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("su.zorluk.th.uzunluk")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("su.zorluk.th.cozum")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("su.zorluk.th.sure")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("su.zorluk.th.surtunme")}</th>
                <th className="pb-2 font-semibold">{t("su.zorluk.th.not")}</th>
              </tr>
            </thead>
            <tbody>
              {zorluk.map((z) => {
                const oneriliMi = sweet && z.zorluk === sweet.zorluk;
                // Etiket & not motorda TR üretilir → zorluk enum'undan (low/medium/high) çevrilir.
                const zEtiket = t(`su.zorluk.etiket.${z.zorluk}`);
                return (
                  <tr key={z.zorluk} className={cn("border-b border-line/60 last:border-0", oneriliMi && "bg-ok-soft/30")}>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 font-medium text-slate-ink">
                        {zEtiket}
                        {oneriliMi && <Badge ton="yesil">{t("su.zorluk.sweet")}</Badge>}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-muted">{z.uzunluk} {t("su.zorluk.hane")}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full bg-ok" style={{ width: `${z.beklenenCozumOran}%` }} />
                        </div>
                        <span className="tabular-nums text-slate-muted">%{z.beklenenCozumOran}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-muted">{z.ortCozumSure} {t("su.zorluk.sn")}</td>
                    <td className="py-2.5 pr-3">
                      <span className="font-semibold tabular-nums" style={{ color: surtunmeRenk(z.surtunmeSkor) }}>
                        {z.surtunmeSkor}
                      </span>
                    </td>
                    <td className="py-2.5 text-[12px] text-slate-muted">{t(`su.zorluk.not.${z.zorluk}`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas/50 px-4 py-3">
          <p className="text-[12px] text-slate-muted">
            <b>{t("su.zorluk.dip.baslik")}</b>{" "}
            {t("su.zorluk.dip.metin")
              .replace("{etiket}", sweet ? t(`su.zorluk.etiket.${sweet.zorluk}`) : "")
              .replace("{uzunluk}", String(sweet?.uzunluk ?? ""))}
          </p>
          <Button href="/panel/zorluk" variant="outline" size="sm">
            <Gauge className="size-4" /> {t("su.zorluk.dip.buton")}
          </Button>
        </div>
      </Panel>

      {/* Öneriler */}
      <Panel baslik={t("su.oneri.baslik")}>
        <div className="space-y-2.5">
          {oneri.map((o, i) => {
            const stil = oneriRenk[o.tip];
            return (
              <div key={i} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", stil.border, stil.bg)}>
                <span className="mt-0.5 shrink-0">{stil.ikon}</span>
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-ink">{t(`su.oneri.${o.anahtar}.baslik`)}</div>
                  <p className="mt-0.5 text-[12.5px] text-slate-muted">{t(`su.oneri.${o.anahtar}.metin`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Ölçülen vs modellenen dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          <b>{t("su.dogruluk.olculen")}</b>
          {(() => {
            const metin = t("su.dogruluk.metin").replace("{plan}", planAd);
            const parcalar = metin.split(/(\{modellenen\})/g);
            return parcalar.map((p, i) =>
              p === "{modellenen}" ? <b key={i}>{t("su.dogruluk.modellenen")}</b> : <span key={i}>{p}</span>,
            );
          })()}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Huni satırı */
function HuniSatir({
  etiket,
  alt,
  deger,
  taban,
  renk,
  ikon,
  yuzde,
  yerel,
}: {
  etiket: string;
  alt: string;
  deger: number;
  taban: number;
  renk: string;
  ikon: React.ReactNode;
  yuzde?: number;
  yerel: string;
}) {
  const oran = taban > 0 ? (deger / taban) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-2 text-slate-ink">
          <span className="grid size-6 place-items-center rounded-lg text-white" style={{ background: renk }}>
            {ikon}
          </span>
          <span className="font-medium">{etiket}</span>
          <span className="text-[11px] text-slate-faint">{alt}</span>
        </span>
        <span className="font-semibold tabular-nums text-slate-ink">
          {deger.toLocaleString(yerel)}
          {yuzde !== undefined && <span className="ml-1.5 text-[12px] font-normal text-slate-muted">%{yuzde}</span>}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(oran, deger > 0 ? 2 : 0)}%`, background: renk }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Mini stat */
function MiniStat({
  ikon,
  deger,
  etiket,
  tone,
}: {
  ikon: React.ReactNode;
  deger: string;
  etiket: string;
  tone?: "ok" | "warn" | "danger";
}) {
  const renk = tone === "danger" ? "text-danger2" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-slate-ink";
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-slate-faint">{ikon}</div>
      <div className={cn("mt-1.5 text-[24px] font-bold leading-none tabular-nums", renk)}>{deger}</div>
      <div className="mt-1 text-[12px] text-slate-muted">{etiket}</div>
    </div>
  );
}
