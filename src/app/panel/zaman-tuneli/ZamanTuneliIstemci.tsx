"use client";

/**
 * Saldırı Zaman Tüneli — İstemci (adli olay yeniden-kurgu konsolu).
 * Genel zaman çizelgesi + incident seçimi + kill-chain yeniden-kurgu +
 * katılımcılar + anlatı + kronolojik oynatma.
 */
import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, RotateCcw, SkipForward, Clock, ShieldCheck, Bot, Activity,
  Search, GitCommitHorizontal, Crosshair, Radar, Users, AlertTriangle,
  ScanSearch, KeyRound, Network, Database, Siren,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, DurumRozeti } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  FAZ_RENK,
  type TunelOlayi, type TunelOzet, type ZamanKovasi, type Faz, type FazKaydi,
} from "@/lib/specter/zaman-tuneli";
import type { Dil } from "@/lib/i18n/panel";
import {
  zamanTuneliCeviri, baslikYeniden, botEtiket, fazAciklamaYeniden, anlatiYeniden,
} from "./zaman-tuneli.i18n";

/** Sayfa geneli çeviri kısayolu tipi (alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/** Dil kodu → Intl yerel etiketi (sayı/tarih biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ Yardımcılar */

const SIDDET_TON: Record<string, "kirmizi" | "sari" | "mavi" | "gri"> = {
  kritik: "kirmizi", yuksek: "sari", orta: "mavi", dusuk: "gri",
};

/** Şiddet enum değeri → çeviri anahtarı (değer sabit kalır, ad çevrilir). */
function siddetAd(s: string, t: Ceviri): string {
  const anahtar = `zt.siddet.${s}`;
  const cev = t(anahtar);
  return cev === anahtar ? s : cev;
}

/** Faz enum değeri → yerel etiket. */
function fazEtiket(faz: Faz, t: Ceviri): string {
  return t(`zt.faz.${faz}`);
}

/** Verdict enum değeri → yerel etiket. */
function verdictAd(v: string, t: Ceviri): string {
  const anahtar = `zt.verdict.${v}`;
  const cev = t(anahtar);
  return cev === anahtar ? v : cev;
}

/** Faz → lucide ikon. */
const FAZ_IKON: Record<Faz, React.ComponentType<{ className?: string }>> = {
  kesif: ScanSearch,
  erisim_denemesi: KeyRound,
  yayilma: Network,
  veri_cikarma: Database,
  etki: Siren,
};

const VERDICT_RENK: Record<string, string> = {
  blocked: "#dc2626", challenged: "#d97706", flagged: "#7c3aed", allowed: "#16a34a",
};

function saatSn(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function saatDk(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
/** UTC "HH:MM" — lib `anlatiUret` ile aynı biçim (anlatı zamanları için). */
function saatDkUTC(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
function tarih(ts: number, yerel: string): string {
  return new Date(ts).toLocaleDateString(yerel, { day: "2-digit", month: "short" });
}
/** Süre biçimlendir. Birim ekleri (sn/dk/sa) dile göre çevrilir. */
function sure(ms: number, t: Ceviri): string {
  const snEk = t("zt.birim.sn"), dkEk = t("zt.birim.dk"), saEk = t("zt.birim.sa");
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}${snEk}`;
  const dk = Math.floor(s / 60), k = s % 60;
  if (dk < 60) return k ? `${dk}${dkEk} ${k}${snEk}` : `${dk}${dkEk}`;
  const sa = Math.floor(dk / 60), mdk = dk % 60;
  return `${sa}${saEk} ${mdk}${dkEk}`;
}

/* ================================================================== Ana */

export function ZamanTuneliIstemci({
  dil, incidents, ozet, kovalar,
}: {
  dil: Dil;
  incidents: TunelOlayi[];
  ozet: TunelOzet;
  kovalar: ZamanKovasi[];
}) {
  const t = (anahtar: string) => zamanTuneliCeviri(anahtar, dil);
  const yerel = YEREL[dil];

  const [seciliId, setSeciliId] = useState<string | null>(incidents[0]?.id ?? null);
  const [sorgu, setSorgu] = useState("");

  const secili = incidents.find((i) => i.id === seciliId) ?? null;

  // Arama; çevrilmiş başlık + ham veri (ülke/ASN/bot) üzerinden.
  const filtreli = incidents.filter((i) =>
    !sorgu ||
    `${baslikYeniden(i.baslik, dil)} ${i.ulkeler.join(" ")} ${i.asnler.join(" ")} ${i.dominantBotClass}`
      .toLowerCase().includes(sorgu.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <GitCommitHorizontal className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("zt.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("zt.serit.aciklama.1")} <b>{t("zt.serit.aciklama.zincir")}</b>.{" "}
            {t("zt.serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamIncident} etiket={t("zt.ozet.yenidenKurulan")} ikon={<Crosshair className="size-5" />} />
        <StatKart sayi={ozet.kritik} etiket={t("zt.ozet.kritik")} ikon={<Siren className="size-5" />} tone={ozet.kritik > 0 ? "danger" : undefined} />
        <StatKart sayi={ozet.toplamKatilimci} etiket={t("zt.ozet.katilanIp")} ikon={<Users className="size-5" />} />
        <StatKart sayi={`%${Math.round(ozet.genelMitigasyon * 100)}`} etiket={t("zt.ozet.genelMitigasyon")} ikon={<ShieldCheck className="size-5" />} tone={ozet.genelMitigasyon >= 0.6 ? "ok" : "warn"} />
      </div>

      {/* genel zaman çizelgesi (scrubber) */}
      <GenelZamanCizelgesi kovalar={kovalar} incidents={incidents} seciliId={seciliId} onSec={setSeciliId} t={t} dil={dil} yerel={yerel} />

      {incidents.length === 0 ? (
        <Panel baslik={t("zt.panel.yenidenKurgu")}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Radar className="size-6" /></span>
            <h3 className="text-lg font-semibold text-slate-ink">{t("zt.bos.baslik")}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-muted">{t("zt.bos.aciklama")}</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* incident listesi */}
          <Panel baslik={t("zt.liste.baslik")} padding={false}>
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
                <Search className="size-4 text-slate-faint" />
                <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("zt.liste.ara")} className="w-full bg-transparent text-[13px] outline-none" aria-label={t("zt.liste.araAria")} />
              </div>
            </div>
            <div className="max-h-[620px] divide-y divide-line overflow-y-auto">
              {filtreli.length === 0 && <p className="py-8 text-center text-sm text-slate-muted">{t("zt.liste.bulunamadi")}</p>}
              {filtreli.map((i) => (
                <button key={i.id} onClick={() => setSeciliId(i.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-canvas/50", seciliId === i.id && "bg-brand-50/40")}>
                  <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", i.siddet === "kritik" ? "bg-danger-soft text-danger2" : i.siddet === "yuksek" ? "bg-warn-soft text-amber-700" : "bg-brand-50 text-brand-600")}>
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-ink">{baslikYeniden(i.baslik, dil)}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-faint">
                      <Badge ton={SIDDET_TON[i.siddet] ?? "gri"}>{siddetAd(i.siddet, t)}</Badge>
                      <span>{i.olaySayisi} {t("zt.liste.olay")}</span>·<span>{i.katilanIp} {t("zt.liste.ip")}</span>·<span>{sure(i.sureMs, t)}</span>
                    </div>
                    {/* mini faz şeridi */}
                    <div className="mt-1.5 flex gap-0.5">
                      {i.fazlar.map((f, fi) => (
                        <span key={fi} className="h-1.5 flex-1 rounded-full" style={{ background: FAZ_RENK[f.faz] }} title={fazEtiket(f.faz, t)} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          {/* seçili incident yeniden-kurgu */}
          {secili ? <OlayYenidenKurgu key={secili.id} inc={secili} t={t} dil={dil} yerel={yerel} /> : (
            <Panel baslik={t("zt.detay.baslik")}><p className="py-10 text-center text-sm text-slate-muted">{t("zt.detay.olaySec")}</p></Panel>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== Genel zaman çizelgesi */

function GenelZamanCizelgesi({
  kovalar, incidents, seciliId, onSec, t, dil, yerel,
}: {
  kovalar: ZamanKovasi[];
  incidents: TunelOlayi[];
  seciliId: string | null;
  onSec: (id: string) => void;
  t: Ceviri;
  dil: Dil;
  yerel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (!kovalar.length) {
    return (
      <Panel baslik={t("zt.gzc.baslik")}>
        <div className="grid h-40 place-items-center text-sm text-slate-faint">{t("zt.gzc.veriYok")}</div>
      </Panel>
    );
  }

  const enErken = kovalar[0].ts;
  const enGec = kovalar[kovalar.length - 1].ts;
  const aralik = Math.max(1, enGec - enErken);
  const maxToplam = Math.max(...kovalar.map((k) => k.toplam), 1);

  // Incident işaretçileri: doruk anını çizelge üzerinde konumlandır.
  const isaretler = incidents.map((i) => ({
    id: i.id,
    baslik: baslikYeniden(i.baslik, dil),
    siddet: i.siddet,
    sol: ((i.dorukTs - enErken) / aralik) * 100,
    baslangicSol: ((i.baslangic - enErken) / aralik) * 100,
    bitisSol: ((i.bitis - enErken) / aralik) * 100,
  }));

  const H = 120;

  return (
    <Panel baslik={t("zt.gzc.baslik")} sagUst={<span className="text-[11px] text-slate-faint">{tarih(enErken, yerel)} {saatDk(enErken)} — {tarih(enGec, yerel)} {saatDk(enGec)}</span>}>
      <div className="space-y-2">
        {/* incident bantları */}
        <div className="relative h-6">
          {isaretler.map((m) => {
            const g = Math.max(1.2, m.bitisSol - m.baslangicSol);
            const renk = m.siddet === "kritik" ? "#dc2626" : m.siddet === "yuksek" ? "#d97706" : "#2f6fed";
            return (
              <button
                key={m.id}
                onClick={() => onSec(m.id)}
                title={m.baslik}
                className={cn("absolute top-1 h-4 rounded-full transition-all", seciliId === m.id ? "ring-2 ring-offset-1 ring-brand-400" : "opacity-70 hover:opacity-100")}
                style={{ left: `${Math.min(98, m.baslangicSol)}%`, width: `${Math.min(g, 100)}%`, background: renk }}
              />
            );
          })}
        </div>

        {/* hacim grafiği — verdict kırılımlı stacked bar */}
        <div className="relative" onMouseLeave={() => setHover(null)}>
          <div className="flex items-end gap-px" style={{ height: H }} role="img" aria-label={t("zt.gzc.hacimAria")}>
            {kovalar.map((k, i) => {
              const h = (k.toplam / maxToplam) * 100;
              const engelH = k.toplam ? (k.engellenen / k.toplam) * 100 : 0;
              const dogH = k.toplam ? (k.dogrulanan / k.toplam) * 100 : 0;
              return (
                <div key={i} className="group relative flex flex-1 flex-col justify-end" style={{ height: "100%" }} onMouseEnter={() => setHover(i)}>
                  <div className="flex w-full flex-col overflow-hidden rounded-[2px]" style={{ height: `${h}%` }}>
                    <div className="w-full shrink-0" style={{ height: `${engelH}%`, background: "#dc2626" }} />
                    <div className="w-full shrink-0" style={{ height: `${dogH}%`, background: "#d97706" }} />
                    <div className="w-full grow" style={{ background: hover === i ? "#1e5bd0" : "#93b4f0" }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* hover tooltip */}
          {hover !== null && (
            <div className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-lift backdrop-blur-sm"
              style={{ left: `${((hover + 0.5) / kovalar.length) * 100}%` }}>
              <div className="mb-0.5 font-medium text-slate-muted">{saatDk(kovalar[hover].ts)}</div>
              <div className="flex items-center gap-3"><span className="text-slate-muted">{t("zt.gzc.toplam")}</span><span className="ml-auto font-semibold tabular-nums text-slate-ink">{kovalar[hover].toplam}</span></div>
              <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-slate-muted"><span className="size-2 rounded-full bg-[#dc2626]" />{t("zt.gzc.engel")}</span><span className="ml-auto font-semibold tabular-nums text-slate-ink">{kovalar[hover].engellenen}</span></div>
              <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-slate-muted"><span className="size-2 rounded-full bg-[#d97706]" />{t("zt.gzc.dogrulama")}</span><span className="ml-auto font-semibold tabular-nums text-slate-ink">{kovalar[hover].dogrulanan}</span></div>
            </div>
          )}
        </div>

        {/* zaman ekseni */}
        <div className="flex justify-between text-[10px] font-medium tabular-nums text-slate-faint">
          <span>{saatDk(enErken)}</span>
          <span>{saatDk(enErken + aralik / 2)}</span>
          <span>{saatDk(enGec)}</span>
        </div>

        {/* legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-muted">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#93b4f0]" />{t("zt.gzc.izin")}</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#d97706]" />{t("zt.gzc.dogrulama")}</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#dc2626]" />{t("zt.gzc.engel")}</span>
          <span className="ml-auto text-slate-faint">{t("zt.gzc.aciklama")}</span>
        </div>
      </div>
    </Panel>
  );
}

/* ================================================================== Olay yeniden-kurgu (centerpiece) */

function OlayYenidenKurgu({ inc, t, dil, yerel }: { inc: TunelOlayi; t: Ceviri; dil: Dil; yerel: string }) {
  // Oynatma: incident olayları üzerinde kronolojik ilerleme.
  const [adim, setAdim] = useState(inc.olaylar.length - 1); // başta hepsi görünür
  const [oynuyor, setOynuyor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Anlatıyı yerel dilde yeniden üret (lib'in `anlatiUret` mantığından,
  // incident'ın yapısal alanlarıyla — Türkçe metni ayrıştırmadan).
  const tirmanis = inc.fazlar.find((f) => f.faz === "erisim_denemesi" || f.faz === "veri_cikarma") ?? null;
  const anlati = anlatiYeniden(
    {
      ilkFaz: inc.fazlar[0]?.faz ?? null,
      ilkFazTs: inc.fazlar[0]?.ts ?? null,
      ilkUlke: inc.katilimcilar[0]?.country ?? null,
      tirmanisFaz: (tirmanis?.faz as "erisim_denemesi" | "veri_cikarma" | undefined) ?? null,
      tirmanisTs: tirmanis?.ts ?? null,
      ilkTepkiTs: inc.savunmaYaniti.ilkTepkiTs,
      mitigasyonOrani: inc.savunmaYaniti.mitigasyonOrani,
      olaySayisi: inc.olaySayisi,
      katilimciSayisi: inc.katilimcilar.length,
    },
    saatDkUTC,
    dil,
  );

  useEffect(() => {
    if (!oynuyor) return;
    if (adim >= inc.olaylar.length - 1) { setOynuyor(false); return; }
    timerRef.current = setTimeout(() => setAdim((a) => Math.min(a + 1, inc.olaylar.length - 1)), 320);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [oynuyor, adim, inc.olaylar.length]);

  function baslat() {
    if (adim >= inc.olaylar.length - 1) setAdim(0);
    setOynuyor(true);
  }

  // Oynatmanın o anki zamanı → hangi fazlara/olaylara kadar geldik.
  const suankiTs = inc.olaylar[adim]?.ts ?? inc.bitis;
  const gorunenOlay = adim + 1;

  // Her fazın oynatma anındaki ilerlemesi (0..1).
  const fazIlerleme = (f: FazKaydi): number => {
    if (suankiTs >= f.bitisTs) return 1;
    if (suankiTs < f.ts) return 0;
    const genislik = Math.max(1, f.bitisTs - f.ts);
    return (suankiTs - f.ts) / genislik;
  };

  const sav = inc.savunmaYaniti;

  return (
    <div className="space-y-6">
      {/* başlık + anlatı */}
      <Panel baslik={t("zt.kurgu.baslik")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-bold text-slate-ink">{baslikYeniden(inc.baslik, dil)}</span>
              <Badge ton={SIDDET_TON[inc.siddet] ?? "gri"}>{siddetAd(inc.siddet, t)}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-muted">
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> {tarih(inc.baslangic, yerel)} {saatSn(inc.baslangic)} → {saatSn(inc.bitis)}</span>
              <span className="flex items-center gap-1"><Activity className="size-3.5" /> {sure(inc.sureMs, t)} · {inc.olaySayisi} {t("zt.kurgu.olayEki")}</span>
              <span className="flex items-center gap-1"><Bot className="size-3.5" /> {botEtiket(inc.dominantBotClass, dil)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inc.ulkeler.slice(0, 6).map((u) => <Ulke key={u} kod={u} />)}
          </div>
        </div>

        {/* anlatı özeti */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-3.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><ScanSearch className="size-4" /></span>
          <div>
            <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">{t("zt.kurgu.adliAnlati")}</div>
            <p className="text-[13.5px] leading-relaxed text-slate-ink">{anlati}</p>
          </div>
        </div>
      </Panel>

      {/* KILL-CHAIN yeniden-kurgu */}
      <Panel
        baslik={t("zt.kurgu.killchain")}
        sagUst={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => { setOynuyor(false); setAdim(inc.olaylar.length - 1); }} title={t("zt.kurgu.sifirlaTitle")}>
              <RotateCcw className="size-4" /> {t("zt.kurgu.sifirla")}
            </Button>
            {oynuyor ? (
              <Button size="sm" onClick={() => setOynuyor(false)}><Pause className="size-4" /> {t("zt.kurgu.duraklat")}</Button>
            ) : (
              <Button size="sm" onClick={baslat}><Play className="size-4" /> {t("zt.kurgu.oynat")}</Button>
            )}
          </div>
        }
      >
        {/* oynatma scrubber */}
        <div className="mb-5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-faint">
            <span className="flex items-center gap-1.5"><SkipForward className="size-3.5" /> {t("zt.kurgu.olay")} {gorunenOlay} / {inc.olaylar.length}</span>
            <span className="num font-medium text-slate-muted">{saatSn(suankiTs)}</span>
          </div>
          <input
            type="range" min={0} max={Math.max(0, inc.olaylar.length - 1)} value={adim}
            onChange={(e) => { setOynuyor(false); setAdim(Number(e.target.value)); }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-canvas accent-brand-600"
            aria-label={t("zt.kurgu.oynatmaAria")}
          />
        </div>

        {/* faz dizisi — kronolojik dikey timeline */}
        <div className="space-y-0">
          {inc.fazlar.map((f, fi) => {
            const Ikon = FAZ_IKON[f.faz];
            const ilerleme = fazIlerleme(f);
            const aktif = suankiTs >= f.ts;
            const son = fi === inc.fazlar.length - 1;
            return (
              <div key={fi} className="relative flex gap-4">
                {/* sol raylı ikon + bağlayıcı çizgi */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn("grid size-11 shrink-0 place-items-center rounded-2xl border-2 transition-all", aktif ? "text-white" : "border-line bg-canvas text-slate-faint")}
                    style={aktif ? { background: FAZ_RENK[f.faz], borderColor: FAZ_RENK[f.faz] } : undefined}
                  >
                    <Ikon className="size-5" />
                  </span>
                  {!son && (
                    <span className="relative my-1 w-0.5 flex-1 rounded bg-line" style={{ minHeight: 44 }}>
                      <span className="absolute inset-x-0 top-0 rounded transition-all" style={{ height: `${ilerleme * 100}%`, background: FAZ_RENK[f.faz] }} />
                    </span>
                  )}
                </div>

                {/* faz içeriği */}
                <div className={cn("min-w-0 flex-1 pb-6 transition-opacity", aktif ? "opacity-100" : "opacity-50")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold tabular-nums text-slate-faint">{t("zt.kurgu.faz")} {fi + 1}</span>
                    <span className="text-[15px] font-semibold text-slate-ink">{fazEtiket(f.faz, t)}</span>
                    <span className="num text-[11px] text-slate-faint">{saatSn(f.ts)}{f.bitisTs > f.ts && ` → ${saatSn(f.bitisTs)}`}</span>
                    <Badge ton={f.faz === "etki" ? "kirmizi" : "gri"}>{f.olaySayisi} {t("zt.kurgu.olayEki")}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{fazAciklamaYeniden(f.faz, f.aciklama, dil)}</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-faint">{t(`zt.fazAlt.${f.faz}`)}</p>
                  {/* faz katılımcı IP'leri */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {f.ipler.slice(0, 8).map((ip) => (
                      <span key={ip} className="num rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-ink">{ip}</span>
                    ))}
                    {f.ipler.length > 8 && <span className="text-[11px] text-slate-faint">+{f.ipler.length - 8} {t("zt.liste.ip")}</span>}
                    <span className="ml-1 flex items-center gap-1 text-[11px]" style={{ color: VERDICT_RENK[f.baskinVerdict] }}>
                      <span className="size-1.5 rounded-full" style={{ background: VERDICT_RENK[f.baskinVerdict] }} />
                      {verdictAd(f.baskinVerdict, t)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* savunma yanıtı bandı (overlay) */}
        <div className="mt-2 rounded-2xl border border-line bg-canvas/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-ink"><ShieldCheck className="size-4 text-brand-600" /> {t("zt.sav.baslik")}</span>
            {sav.ilkTepkiTs !== null ? (
              <DurumRozeti ton="ok" etiket={t("zt.sav.ilkTepki").replace("{t}", saatSn(sav.ilkTepkiTs))} />
            ) : (
              <DurumRozeti ton="gri" etiket={t("zt.sav.tetiklenmedi")} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SavKutu etiket={t("zt.sav.engellendi")} deger={sav.engellenen} renk="#dc2626" />
            <SavKutu etiket={t("zt.sav.dogrulama")} deger={sav.dogrulanan} renk="#d97706" />
            <SavKutu etiket={t("zt.sav.isaretlendi")} deger={sav.isaretlenen} renk="#7c3aed" />
            <SavKutu etiket={t("zt.sav.izin")} deger={sav.izin} renk="#16a34a" />
          </div>
          {/* mitigasyon çubuğu */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-muted">{t("zt.sav.mitigasyonOrani")}</span>
              <span className="num font-semibold text-slate-ink">%{Math.round(sav.mitigasyonOrani * 100)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full transition-all" style={{ width: `${sav.mitigasyonOrani * 100}%`, background: sav.mitigasyonOrani >= 0.6 ? "#16a34a" : sav.mitigasyonOrani >= 0.3 ? "#d97706" : "#dc2626" }} />
            </div>
          </div>
        </div>
      </Panel>

      {/* katılımcılar */}
      <Panel baslik={t("zt.kat.baslik").replace("{n}", String(inc.katilimcilar.length))} sagUst={<span className="text-[11px] text-slate-faint">{t("zt.kat.sira")}</span>}>
        <div className="space-y-2">
          {inc.katilimcilar.slice(0, 20).map((k, ki) => {
            const KIkon = FAZ_IKON[k.ilkFaz];
            return (
              <div key={k.ip} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-canvas text-[11px] font-bold text-slate-muted">{ki + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                    <span className="num font-semibold text-slate-ink">{k.ip}</span>
                    <Ulke kod={k.country} />
                    <span className="truncate text-[11px] text-slate-faint">{k.asn}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-faint">
                    <span className="flex items-center gap-1" style={{ color: FAZ_RENK[k.ilkFaz] }}><KIkon className="size-3" /> {t("zt.kat.katildi").replace("{faz}", fazEtiket(k.ilkFaz, t))}</span>
                    ·<span>{k.olaySayisi} {t("zt.kat.olay")}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[12px] font-semibold text-slate-ink">{saatSn(k.ilkGorulme)}</div>
                  <div className="text-[10px] text-slate-faint">{t("zt.kat.engellendi").replace("{n}", String(Math.round(k.engelOrani * 100)))}</div>
                </div>
              </div>
            );
          })}
          {inc.katilimcilar.length > 20 && (
            <p className="pt-1 text-center text-[11px] text-slate-faint">{t("zt.kat.dahaFazla").replace("{n}", String(inc.katilimcilar.length - 20))}</p>
          )}
        </div>
      </Panel>

      {/* not */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          {t("zt.not.1")} <b>{t("zt.not.anlati")}</b> {t("zt.not.2")}
        </span>
      </div>
    </div>
  );
}

function SavKutu({ etiket, deger, renk }: { etiket: string; deger: number; renk: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: renk }} />
        <span className="text-[11px] text-slate-muted">{etiket}</span>
      </div>
      <div className="num mt-0.5 text-[20px] font-bold text-slate-ink">{deger}</div>
    </div>
  );
}
