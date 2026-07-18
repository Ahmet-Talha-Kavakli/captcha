"use client";

/**
 * Tehdit Göstergesi Zenginleştirme Konsolu — istemci.
 * Ham IOC → zenginleştirilmiş, aksiyona dönüşebilir istihbarat. Her göstergeyi
 * genişletilebilir zengin bir kartta gösterir: tehdit rozeti, ağ-tipi rozeti,
 * güven çubuğu, bayrak, itibar, ilişkili bot sınıfları, türetilmiş etiketler,
 * önerilen aksiyon. Genişletince tam zenginleştirme (ilk/son görülme, olay
 * sayısı, tehdit gerekçesi, kampanya ipucu) açılır.
 *
 * DÜRÜSTLÜK: Tüm zenginleştirme GÖZLEMLENEN trafikten + deterministik
 * sezgilerden (ASN anahtar-kelime sınıflandırması, botClass karışımı) türetilir;
 * canlı harici tehdit-istihbaratı beslemesi çağrısı YAPILMAZ (açıkça etiketli).
 */

import { useMemo, useState } from "react";
import {
  ScanSearch, Server, ShieldAlert, Globe2, Radar, Info, ChevronDown, ChevronUp,
  Search, Filter, ArrowUpRight, Network, Layers, Gauge, Clock, Boxes, Sparkles,
  Ban, Eye, ShieldQuestion, Tag,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ULKE_AD } from "@/lib/flag";
import type { Dil } from "@/lib/i18n/panel";
import { zgCeviri } from "./zenginlestirme.i18n";
import type {
  ZenginGosterge, ZenginOzet, TehditSeviye, AgTipi, OnerilenAksiyon, GostergeTip,
} from "./zengin";

/**
 * ENUM GÜVENLİĞİ — etiket eşlemeleri i18n'e taşındı.
 * Gösterim adları artık key-map üzerinden `t("<namespace>." + enumDeğeri)` ile
 * çevrilir (aşağıda). Yalnızca TON/RENK/İKON gibi STİL eşlemeleri sabit kalır;
 * bunlar enum değerlerini gösterim metnine değil, görsel stile eşler.
 */
const TEHDIT_TON: Record<TehditSeviye, "yesil" | "sari" | "kirmizi"> = {
  temiz: "yesil", şüpheli: "sari", kötü: "kirmizi", kritik: "kirmizi",
};
const TEHDIT_RENK: Record<TehditSeviye, string> = {
  temiz: "#16a34a", şüpheli: "#d97706", kötü: "#ea580c", kritik: "#dc2626",
};

const AG_TON: Record<AgTipi, "kirmizi" | "sari" | "yesil" | "mavi" | "gri"> = {
  "barındırma": "kirmizi", "VPN/proxy": "sari", "konut": "yesil",
  "mobil": "mavi", "bilinmeyen": "gri",
};
const AG_IKON: Record<AgTipi, React.ReactNode> = {
  "barındırma": <Server className="size-3.5" />,
  "VPN/proxy": <Network className="size-3.5" />,
  "konut": <Globe2 className="size-3.5" />,
  "mobil": <Radar className="size-3.5" />,
  "bilinmeyen": <Boxes className="size-3.5" />,
};

const AKSIYON_IKON: Record<OnerilenAksiyon, React.ReactNode> = {
  izle: <Eye className="size-3.5" />,
  doğrula: <ShieldQuestion className="size-3.5" />,
  engelle: <Ban className="size-3.5" />,
};

/* ---- Küçük yardımcılar ---- */
function ulkeAd(kod: string) {
  return ULKE_AD[kod] ?? kod;
}

function goreliZaman(ts: number, simdi: number, t: (a: string) => string): string {
  const fark = Math.max(0, simdi - ts);
  const dk = Math.round(fark / 60000);
  if (dk < 1) return t("zaman.azOnce");
  if (dk < 60) return t("zaman.dk").replace("{n}", String(dk));
  const sa = Math.round(dk / 60);
  if (sa < 24) return t("zaman.sa").replace("{n}", String(sa));
  const gun = Math.round(sa / 24);
  return t("zaman.gun").replace("{n}", String(gun));
}

/* ---- Güven çubuğu ---- */
function GuvenCubugu({ deger }: { deger: number }) {
  const renk = deger >= 70 ? "#16a34a" : deger >= 45 ? "#d97706" : "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${deger}%`, background: renk }} />
      </div>
      <span className="num text-[12px] font-semibold text-slate-muted">{deger}</span>
    </div>
  );
}

/* ---- İtibar çubuğu (0 temiz .. 100 kötü) ---- */
function ItibarCubugu({ deger }: { deger: number }) {
  const renk = deger >= 70 ? "#dc2626" : deger >= 40 ? "#ea580c" : "#16a34a";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${deger}%`, background: renk }} />
      </div>
      <span className="num text-[12px] font-semibold" style={{ color: renk }}>{deger}</span>
    </div>
  );
}

/* ---- Zenginleştirilmiş gösterge kartı (genişletilebilir) ---- */
function GostergeKart({ g, simdi, t }: { g: ZenginGosterge; simdi: number; t: (a: string) => string }) {
  const [acik, setAcik] = useState(false);
  const tipEtiket = t("tip." + g.tip);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface transition",
        g.tehdit === "kritik" ? "border-red-200" : "border-line hover:border-line-strong",
      )}
    >
      {/* --- Üst şerit (özet) --- */}
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* tehdit renk şeridi */}
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: TEHDIT_RENK[g.tehdit] }}
        >
          {g.tip === "asn" ? <Server className="size-4.5" /> : <ScanSearch className="size-4.5" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-faint">
              {tipEtiket}
            </span>
            <span className="num truncate text-[15px] font-semibold text-slate-ink">{g.deger}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge ton={TEHDIT_TON[g.tehdit]}>{t("tehdit." + g.tehdit)}</Badge>
            <Badge ton={AG_TON[g.agTipi]}>
              <span className="inline-flex items-center gap-1">{AG_IKON[g.agTipi]} {t("ag." + g.agTipi)}</span>
            </Badge>
            <Ulke kod={g.ulke} />
            {g.olaySayisi >= 30 && <Badge ton="gri">{t("kart.yuksekHacim")}</Badge>}
          </div>
        </div>

        {/* güven + itibar (geniş ekran) */}
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-faint">
            <Gauge className="size-3" /> {t("kart.guven")} <GuvenCubugu deger={g.guven} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-faint">
            <ShieldAlert className="size-3" /> {t("kart.itibar")} <ItibarCubugu deger={g.itibar} />
          </div>
        </div>

        {/* önerilen aksiyon rozeti */}
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold md:inline-flex",
            g.onerilenAksiyon === "engelle"
              ? "bg-danger-soft text-red-700"
              : g.onerilenAksiyon === "doğrula"
                ? "bg-warn-soft text-amber-700"
                : "bg-slate-100 text-slate-600",
          )}
        >
          {AKSIYON_IKON[g.onerilenAksiyon]} {t("aksiyon." + g.onerilenAksiyon)}
        </span>

        {acik ? (
          <ChevronUp className="size-4 shrink-0 text-slate-faint" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-faint" />
        )}
      </button>

      {/* --- Genişletilmiş zenginleştirme (raw → enriched şeffaf) --- */}
      {acik && (
        <div className="border-t border-line px-4 py-4">
          {/* türetilmiş alan ızgarası */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <ZAlan ikon={<Clock className="size-3.5" />} etiket={t("alan.ilkGorulme")} deger={goreliZaman(g.ilkGorulme, simdi, t)} />
            <ZAlan ikon={<Clock className="size-3.5" />} etiket={t("alan.sonGorulme")} deger={goreliZaman(g.sonGorulme, simdi, t)} />
            <ZAlan ikon={<Layers className="size-3.5" />} etiket={t("alan.olaySayisi")} deger={String(g.olaySayisi)} vurgu />
            <ZAlan ikon={<Boxes className="size-3.5" />} etiket={t("alan.tekilIp")} deger={String(g.tekilIp)} />
            <ZAlan ikon={<Network className="size-3.5" />} etiket={t("alan.asn")} deger={g.asn} genis />
            <ZAlan ikon={<Globe2 className="size-3.5" />} etiket={t("alan.baskinUlke")} deger={`${ulkeAd(g.ulke)} (${g.ulke})`} />
            <ZAlan ikon={<Gauge className="size-3.5" />} etiket={t("alan.guven")} deger={`${g.guven}/100`} />
            <ZAlan ikon={<ShieldAlert className="size-3.5" />} etiket={t("alan.itibar")} deger={`${g.itibar}/100`} />
          </div>

          {/* ilişkili bot sınıfları */}
          {g.iliskiliBotClass.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-faint">
                <Radar className="size-3.5" /> {t("kart.iliskiliBot")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.iliskiliBotClass.map((bc) => (
                  <Badge key={bc} ton="gri">{t("botClass." + bc)}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* türetilmiş etiketler */}
          {g.etiketler.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-faint">
                <Tag className="size-3.5" /> {t("kart.turetilmisEtiket")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.etiketler.map((e) => (
                  <span key={e} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* neden bu tehdit — türetme gerekçesi (şeffaflık) */}
          <div className="mt-4 rounded-xl border border-line bg-canvas/50 px-3.5 py-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-ink">
              <Info className="size-3.5 text-brand-600" /> {t("kart.nedenTehdit")}
            </div>
            <ul className="space-y-1 text-[13px] leading-relaxed text-slate-muted">
              {g.gerekce.map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-400" />
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-start gap-1.5 border-t border-line pt-2 text-[12px] text-slate-faint">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-brand-500" />
              <span><span className="font-medium text-slate-muted">{t("kart.kampanyaIpucu")}</span> {g.kampanyaIpucu}</span>
            </div>
          </div>

          {/* aksiyon CTA */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] text-slate-faint">
              {t("kart.onerilenAksiyon")}{" "}
              <span className="font-semibold text-slate-ink">{t("aksiyon." + g.onerilenAksiyon)}</span>
            </span>
            <Button
              variant={g.onerilenAksiyon === "engelle" ? "danger" : "outline"}
              size="sm"
              href={`/panel/kurallar?field=${g.tip === "asn" ? "asn" : "ip"}&value=${encodeURIComponent(g.deger)}`}
            >
              {AKSIYON_IKON[g.onerilenAksiyon]} {t("kart.kuralOlustur")} <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Genişletilmiş kart içi tek türetilmiş alan. */
function ZAlan({
  ikon, etiket, deger, vurgu, genis,
}: {
  ikon: React.ReactNode; etiket: string; deger: string; vurgu?: boolean; genis?: boolean;
}) {
  return (
    <div className={cn(genis && "col-span-2")}>
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        {ikon} {etiket}
      </div>
      <div className={cn("mt-0.5 truncate text-[13px]", vurgu ? "num font-bold text-slate-ink" : "font-medium text-slate-ink")}>
        {deger}
      </div>
    </div>
  );
}

/* ---- Ağ tipi dağılım çubuğu ---- */
function AgDagilimSatir({ tip, sayi, toplam, t }: { tip: AgTipi; sayi: number; toplam: number; t: (a: string) => string }) {
  const yuzde = toplam ? Math.round((sayi / toplam) * 100) : 0;
  const renk =
    tip === "barındırma" ? "#dc2626" : tip === "VPN/proxy" ? "#ea580c" :
    tip === "konut" ? "#16a34a" : tip === "mobil" ? "#2563eb" : "#94a3b8";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-ink">
          <span className="grid size-5 place-items-center rounded-md" style={{ background: renk + "1a", color: renk }}>
            {AG_IKON[tip]}
          </span>
          {t("ag." + tip)}
        </span>
        <span className="num text-slate-muted">{sayi} <span className="text-slate-faint">(%{yuzde})</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${yuzde}%`, background: renk }} />
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */
export function ZenginlestirmeIstemci({
  gostergeler,
  ozet,
  dil,
}: {
  gostergeler: ZenginGosterge[];
  ozet: ZenginOzet;
  dil: Dil;
}) {
  const t = (anahtar: string) => zgCeviri(anahtar, dil);
  const [sorgu, setSorgu] = useState("");
  const [tipFiltre, setTipFiltre] = useState<"hepsi" | GostergeTip>("hepsi");
  const [yalnizTehdit, setYalnizTehdit] = useState(false);

  // "Şimdi" — dış saat yerine gözlemlerin en yeni ts'i (deterministik gösterim).
  const simdi = useMemo(
    () => gostergeler.reduce((m, g) => Math.max(m, g.sonGorulme), 0) || 0,
    [gostergeler],
  );

  const tehditMi = (t: TehditSeviye) => t === "kötü" || t === "kritik";

  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return gostergeler.filter((g) => {
      if (tipFiltre !== "hepsi" && g.tip !== tipFiltre) return false;
      if (yalnizTehdit && !tehditMi(g.tehdit)) return false;
      if (!q) return true;
      return (
        g.deger.toLowerCase().includes(q) ||
        g.asn.toLowerCase().includes(q) ||
        g.ulke.toLowerCase().includes(q) ||
        g.etiketler.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [gostergeler, sorgu, tipFiltre, yalnizTehdit]);

  // Oto-engelleme adayları: kötü+kritik VE yüksek güven (>=70).
  const otoAdaylar = useMemo(
    () => gostergeler.filter((g) => tehditMi(g.tehdit) && g.guven >= 70).slice(0, 12),
    [gostergeler],
  );

  const agToplam = ozet.toplam;
  const agSirasi: AgTipi[] = ["barındırma", "VPN/proxy", "konut", "mobil", "bilinmeyen"];

  return (
    <div className="space-y-6">
      {/* Dürüstlük etiketi — vurgulu segmentler i18n parçalarından kurulur */}
      <NotKutusu ton="bilgi" baslik={t("not.baslik")}>
        {t("not.metin.a")} <strong>{t("not.metin.gozlem")}</strong> {t("not.metin.b")}
        {t("not.metin.turetilir") && <strong> {t("not.metin.turetilir")}</strong>}
        {t("not.metin.c")} <em>{t("not.metin.besleme")}</em>{" "}
        {t("not.metin.d")}
      </NotKutusu>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplam} etiket={t("stat.toplam")} ikon={<ScanSearch className="size-5" />} />
        <StatKart sayi={ozet.kritik} etiket={t("stat.kritik")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.otoEngellenebilir} etiket={t("stat.oto")} ikon={<Ban className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.ortGuven} etiket={t("stat.ortGuven")} ikon={<Gauge className="size-5" />} tone="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol: gösterge listesi (2 kolon) */}
        <div className="lg:col-span-2">
          <Panel
            baslik={t("liste.baslik").replace("{n}", String(filtreli.length))}
            sagUst={
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-slate-muted">
                <input
                  type="checkbox"
                  checked={yalnizTehdit}
                  onChange={(e) => setYalnizTehdit(e.target.checked)}
                  className="size-3.5 accent-brand-600"
                />
                <Filter className="size-3.5" /> {t("liste.yalnizTehdit")}
              </label>
            }
          >
            {/* arama + tip filtresi */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
                <input
                  value={sorgu}
                  onChange={(e) => setSorgu(e.target.value)}
                  placeholder={t("liste.ara")}
                  aria-label={t("liste.araAria")}
                  className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
                />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-line-strong bg-surface p-1">
                {(["hepsi", "ip", "asn"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTipFiltre(tf)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                      tipFiltre === tf ? "bg-ink-900 text-white" : "text-slate-muted hover:bg-canvas",
                    )}
                  >
                    {tf === "hepsi" ? t("filtre.hepsi") : tf === "ip" ? t("tip.ip") : t("tip.asn")}
                  </button>
                ))}
              </div>
            </div>

            {filtreli.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/40 px-6 py-16 text-center">
                <ScanSearch className="mx-auto mb-3 size-8 text-slate-faint" />
                <p className="text-sm font-medium text-slate-ink">{t("liste.bosBaslik")}</p>
                <p className="mt-1 text-[13px] text-slate-muted">
                  {t("liste.bosMetin")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtreli.map((g) => (
                  <GostergeKart key={`${g.tip}:${g.deger}`} g={g} simdi={simdi} t={t} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Sağ: ağ tipi dağılımı + oto-engelleme adayları */}
        <div className="space-y-6">
          {/* Ağ tipi dağılımı */}
          <Panel baslik={t("dagilim.baslik")}>
            <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">
              {t("dagilim.metin")}
            </p>
            <div className="space-y-3.5">
              {agSirasi
                .filter((at) => ozet.agTipiDagilim[at] > 0)
                .map((at) => (
                  <AgDagilimSatir key={at} tip={at} sayi={ozet.agTipiDagilim[at]} toplam={agToplam} t={t} />
                ))}
            </div>
            <div className="mt-4 rounded-xl bg-danger-soft px-3 py-2.5 text-[12px] text-red-800">
              <span className="font-semibold">
                {ozet.agTipiDagilim["barındırma"] + ozet.agTipiDagilim["VPN/proxy"]}
              </span>{" "}
              {t("dagilim.uyari.a")}
            </div>
          </Panel>

          {/* Oto-engelleme adayları */}
          <Panel
            baslik={t("oto.baslik")}
            sagUst={<Badge ton="kirmizi">{otoAdaylar.length}</Badge>}
          >
            <p className="mb-3 text-[13px] leading-relaxed text-slate-muted">
              {t("oto.metin")}
            </p>
            {otoAdaylar.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong bg-canvas/40 px-4 py-6 text-center text-[13px] text-slate-faint">
                {t("oto.bos")}
              </p>
            ) : (
              <div className="space-y-2">
                {otoAdaylar.map((g) => (
                  <div
                    key={`oto:${g.tip}:${g.deger}`}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas/30 px-3 py-2.5"
                  >
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-white"
                      style={{ background: TEHDIT_RENK[g.tehdit] }}
                    >
                      {g.tip === "asn" ? <Server className="size-3.5" /> : <ScanSearch className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="num truncate text-[13px] font-semibold text-slate-ink">{g.deger}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-faint">
                        <span>{t("ag." + g.agTipi)}</span>·<span>{t("oto.guven")} {g.guven}</span>·<span>{t("oto.itibar")} {g.itibar}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/panel/kurallar?field=${g.tip === "asn" ? "asn" : "ip"}&value=${encodeURIComponent(g.deger)}`}
                    >
                      {t("oto.kural")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-line pt-3">
              <Button variant="accent" size="sm" href="/panel/oto-duzeltme" className="w-full">
                <Sparkles className="size-3.5" /> {t("oto.git")}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
