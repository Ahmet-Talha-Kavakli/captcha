"use client";

/**
 * Denetim Dışa-Aktarım & Bütünlük — istemci görünümü
 * ===================================================
 * Mevcut Denetim ekranını (log görüntüleyici) TAMAMLAR: burada odak
 * (1) zincir bütünlüğü kanıtı ve (2) SIEM biçimlerine dışa-aktarımdır.
 * Log listesini burada TEKRARLAMAYIZ.
 */

import {
  ShieldCheck, ShieldAlert, FileDown, Download, Activity, AlertTriangle,
  Users2, CalendarRange, Link2, Layers, Server, Lock,
} from "lucide-react";
import { Panel, StatKart, Badge, KodBlok, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { exportCeviri, YEREL } from "./denetim-export.i18n";

/* --- Sunucudan gelen tipler (saf lib sonuçlarının serileştirilebilir hâli) --- */
interface ZincirSonuc {
  gecerli: boolean;
  kirikNoktalar: { seq: number; sebep: string }[];
  toplamKontrol: number;
}
interface DenetimOzet {
  toplam: number;
  kritik: number;
  kategoriler: { kategori: string; sayi: number }[];
  aktorler: { ad: string; sayi: number }[];
  ilkTs: number | null;
  sonTs: number | null;
}
interface Onizlemeler {
  ndjson: string;
  cef: string;
  json: string;
}

/* Dışa-aktarım biçimi kartlarının tanımı. Biçim adı (NDJSON/CEF/JSON) ve
   dosya uzantısı çevrilmez; hedef ve açıklama i18n anahtarından türetilir. */
type Bicim = "ndjson" | "cef" | "json";
const BICIMLER: Array<{ key: Bicim; ad: string; uzanti: string }> = [
  { key: "ndjson", ad: "NDJSON", uzanti: "ndjson" },
  { key: "cef", ad: "CEF", uzanti: "cef" },
  { key: "json", ad: "JSON", uzanti: "json" },
];

function tarihMetni(ts: number | null, dil: Dil): string {
  if (ts === null) return "—";
  return new Date(ts).toLocaleString(YEREL[dil]);
}

export function DenetimExportIstemci({
  dil,
  zincir,
  ozet,
  ilkSeq,
  sonSeq,
  onizlemeler,
}: {
  dil: Dil;
  zincir: ZincirSonuc;
  ozet: DenetimOzet;
  ilkSeq: number | null;
  sonSeq: number | null;
  onizlemeler: Onizlemeler;
}) {
  const { goster } = useToast();
  const saglam = zincir.gecerli;
  const t = (anahtar: string) => exportCeviri(anahtar, dil);
  // Kategori enum anahtarı → çevrili etiket (enum değeri veri; yalnızca etiket çevrilir).
  const katEtiket = (k: string) => t(`de.kat.${k}`);

  // Lib TR "sebep" metnini istemci-tarafında yeniden türet (lib düzenlenmez).
  // Veri (hash/seq) ham metinden çıkarılıp çevrili şablona yerleştirilir.
  const sebepMetni = (ham: string): string => {
    let m: RegExpMatchArray | null;
    if ((m = ham.match(/prevHash "(.*)" beklenirken "genesis"/)))
      return t("de.sebep.genesis").replace("{p}", m[1]);
    if ((m = ham.match(/seq (\d+) birden çok kez var/)))
      return t("de.sebep.yinelenen").replace("{s}", m[1]);
    if ((m = ham.match(/seq (\d+) ile (\d+) arasında (\d+) kayıt eksik/)))
      return t("de.sebep.bosluk").replace("{a}", m[1]).replace("{b}", m[2]).replace("{n}", m[3]);
    if ((m = ham.match(/seq (\d+), önceki seq (\d+)'den/)))
      return t("de.sebep.duzensiz").replace("{s}", m[1]).replace("{p}", m[2]);
    if ((m = ham.match(/prevHash "(.*)" ≠ önceki kaydın hash'i "(.*)"/)))
      return t("de.sebep.kopuk").replace("{p}", m[1]).replace("{h}", m[2]);
    return ham;
  };

  function indir(bicim: Bicim) {
    // Tarayıcıya indirmeyi API'ye bırak (Content-Disposition ile attachment).
    window.location.href = `/api/denetim/export?format=${bicim}`;
    goster({
      tip: "bilgi",
      baslik: t("de.toast.baslik").replace("{ad}", bicim.toUpperCase()),
      aciklama: t("de.toast.aciklama"),
    });
  }

  const enBuyukKat = Math.max(1, ...ozet.kategoriler.map((k) => k.sayi));
  const onizlemeMap: Record<Bicim, string> = onizlemeler;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Server className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("de.tanitimBaslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("de.tanitimMetin")}</p>
        </div>
      </div>

      {/* ============ ZİNCİR BÜTÜNLÜĞÜ KANITI ============ */}
      <section
        className={cn(
          "overflow-hidden rounded-3xl border",
          saglam ? "border-green-200 bg-ok-soft/40" : "border-red-200 bg-danger-soft/40",
        )}
      >
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div
            className={cn(
              "grid size-16 shrink-0 place-items-center rounded-2xl",
              saglam ? "bg-ok text-white" : "bg-danger2 text-white",
            )}
          >
            {saglam ? <ShieldCheck className="size-8" /> : <ShieldAlert className="size-8" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-xl font-bold", saglam ? "text-green-800" : "text-red-800")}>
                {saglam ? t("de.zincirDogrulandi") : t("de.zincirBozuldu")}
              </h2>
              <Badge ton={saglam ? "yesil" : "kirmizi"}>{saglam ? t("de.wormRozet") : t("de.kirilmaRozet").replace("{n}", String(zincir.kirikNoktalar.length))}</Badge>
            </div>
            <p className={cn("mt-1 text-[13.5px]", saglam ? "text-green-800/90" : "text-red-800/90")}>
              {saglam ? t("de.saglamMetin") : t("de.bozukMetin")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <Layers className="size-3.5 text-slate-faint" />
                <b className="text-slate-ink tabular-nums">{zincir.toplamKontrol}</b> {t("de.kayitKontrol")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <Link2 className="size-3.5 text-slate-faint" />
                {t("de.seqAraligi")}{" "}
                <b className="text-slate-ink tabular-nums">
                  {ilkSeq ?? "—"} → {sonSeq ?? "—"}
                </b>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-muted">
                <Lock className="size-3.5 text-slate-faint" />
                {t("de.genesisSon")}
              </span>
            </div>
          </div>
        </div>

        {/* Kırılma noktaları (yalnızca bozuksa) */}
        {!saglam && (
          <div className="border-t border-red-200/70 bg-surface/60 px-6 py-4">
            <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-red-700">{t("de.kirilmaNoktalari")}</div>
            <ul className="space-y-1.5">
              {zincir.kirikNoktalar.map((kn, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-danger-soft/50 px-3.5 py-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger2" />
                  <div className="min-w-0 text-[13px]">
                    <span className="font-mono font-semibold text-red-700">seq #{kn.seq}</span>
                    <span className="ml-2 text-red-800/90">{sebepMetni(kn.sebep)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Doğrulama yöntemi — dürüst not */}
        <div className="border-t border-line/60 bg-surface/50 px-6 py-3.5">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
            <span>
              <b className="text-slate-ink">{t("de.yontemBaslik")}</b> {t("de.yontemMetin1")} <b>{t("de.yontemBaglanti")}</b> {t("de.yontemMetin2")}{" "}
              <span className="font-mono">prevHash</span>{t("de.yontemMetin3")} <span className="font-mono">hash</span>{t("de.yontemMetin4")}{" "}
              <b>{t("de.yontemSira")}</b> {t("de.yontemMetin5")} <span className="font-mono">seq</span>{t("de.yontemMetin6")}
            </span>
          </p>
        </div>
      </section>

      {/* ============ ÖZET İSTATİSTİKLER ============ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam.toLocaleString(YEREL[dil])} etiket={t("de.stat.toplam")} ikon={<Activity className="size-5" />} />
        <StatKart
          sayi={ozet.kritik.toLocaleString(YEREL[dil])}
          etiket={t("de.stat.kritik")}
          ikon={<AlertTriangle className="size-5" />}
          tone={ozet.kritik > 0 ? "warn" : undefined}
        />
        <StatKart sayi={ozet.aktorler.length} etiket={t("de.stat.aktor")} ikon={<Users2 className="size-5" />} />
        <StatKart sayi={ozet.kategoriler.length} etiket={t("de.stat.kategori")} ikon={<Layers className="size-5" />} />
      </div>

      {/* Kategori dağılımı + Tarih aralığı & Top aktörler */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel baslik={t("de.kategoriDagilim")}>
          {ozet.kategoriler.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-faint">{t("de.henuzKayitYok")}</p>
          ) : (
            <ul className="space-y-2.5">
              {ozet.kategoriler.map((k) => (
                <li key={k.kategori} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[13px] text-slate-ink">{katEtiket(k.kategori)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${Math.round((k.sayi / enBuyukKat) * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-ink">
                    {k.sayi}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel baslik={t("de.zamanAraligi")}>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-3">
                <CalendarRange className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <div className="text-[13px]">
                  <div className="text-slate-muted">{t("de.ilkKayit")}</div>
                  <div className="font-medium tabular-nums text-slate-ink">{tarihMetni(ozet.ilkTs, dil)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-3">
                <CalendarRange className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <div className="text-[13px]">
                  <div className="text-slate-muted">{t("de.sonKayit")}</div>
                  <div className="font-medium tabular-nums text-slate-ink">{tarihMetni(ozet.sonTs, dil)}</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel baslik={t("de.enEtkinAktor")}>
            {ozet.aktorler.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-faint">{t("de.aktorYok")}</p>
            ) : (
              <ul className="space-y-2">
                {ozet.aktorler.slice(0, 5).map((a, i) => (
                  <li key={a.ad} className="flex items-center gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-[12px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-ink">{a.ad}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-slate-muted">{a.sayi}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* ============ DIŞA-AKTARIM BİÇİMLERİ ============ */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <FileDown className="size-4 text-brand-600" />
          <h2 className="text-[15px] font-semibold text-slate-ink">{t("de.siemBaslik")}</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {BICIMLER.map((b) => (
            <div key={b.key} className="flex flex-col rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-[17px] font-bold text-slate-ink">{b.ad}</span>
                <Badge ton="brand">{t(`de.bicim.${b.key}.hedef`)}</Badge>
              </div>
              <p className="mt-2 min-h-[76px] text-[13px] leading-relaxed text-slate-muted">{t(`de.bicim.${b.key}.aciklama`)}</p>

              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                  {t("de.onizlemeBaslik")}
                </div>
                {onizlemeMap[b.key].trim() ? (
                  <KodBlok kod={onizlemeMap[b.key]} baslik={t("de.ornekDosya").replace("{uzanti}", b.uzanti)} maxH="max-h-[220px]" />
                ) : (
                  <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/40 px-4 py-6 text-center text-[12.5px] text-slate-faint">
                    {t("de.onizlemeYok")}
                  </div>
                )}
              </div>

              <Button variant="primary" size="sm" className="mt-4 w-full" onClick={() => indir(b.key)}>
                <Download className="size-4" /> {t("de.indir").replace("{ad}", b.ad)}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Dürüst not — streaming gelecekte */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          {t("de.durustNot")
            .split(/(\{b0\}.*?\{b1\}|\{b2\}.*?\{b3\})/)
            .map((parca, i) => {
              const kalin = parca.match(/^\{b[02]\}(.*)\{b[13]\}$/);
              return kalin ? <b key={i}>{kalin[1]}</b> : parca;
            })}
        </span>
      </div>
    </div>
  );
}
