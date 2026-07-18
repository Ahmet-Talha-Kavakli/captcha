"use client";

/**
 * Specter Panel UI Kit — Sentinel DNA
 * ====================================
 * Kartlar shadow-card + 1px border-line + rounded-2xl. Vurgu indigo
 * (brand-600). Butonlar siyah (ink) veya indigo (accent). Grafik yok
 * (elle SVG ayrı dosyada). Tek font Inter.
 */
import Link from "next/link";
import { cn } from "@/lib/cn";
import { bayrak } from "@/lib/flag";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, MoreHorizontal, Copy, Check, Search } from "lucide-react";
import { useState, useRef, useEffect, createContext, useContext, useCallback } from "react";
import { useOdakTuzak } from "@/lib/a11y/odak-tuzak";

/* ------------------------------------------------------------------ Panel */
export function Panel({
  baslik,
  sagUst,
  children,
  className,
  padding = true,
}: {
  baslik?: React.ReactNode;
  sagUst?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section className={cn("rounded-3xl border border-line bg-surface shadow-card", className)}>
      {baslik && (
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[15px] font-semibold text-slate-ink">{baslik}</h3>
          {sagUst}
        </div>
      )}
      <div className={cn(padding && (baslik ? "px-6 pb-6" : "p-6"))}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ PanelBaslik
 * Başlık artık Topbar'da (Tavily birebir). Burada yalnızca açıklama + sağ
 * üst aksiyon barı gösterilir; `baslik` prop'u geriye-uyumluluk için var
 * ama görsel olarak render edilmez. */
export function PanelBaslik({
  baslik,
  aciklama,
  aksiyon,
}: {
  baslik?: string;
  aciklama?: string;
  aksiyon?: React.ReactNode;
}) {
  void baslik;
  if (!aciklama && !aksiyon) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {aciklama ? <p className="max-w-2xl text-[15px] text-slate-muted">{aciklama}</p> : <span />}
      {aksiyon && <div className="flex items-center gap-2">{aksiyon}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ StatKart */
export function StatKart({
  sayi,
  etiket,
  href,
  ikon,
  delta,
  tone,
}: {
  sayi: string | number;
  etiket: string;
  href?: string;
  ikon?: React.ReactNode;
  delta?: { value: string; up: boolean; good?: boolean };
  tone?: "brand" | "danger" | "ok" | "warn";
}) {
  const toneColor =
    tone === "danger" ? "text-danger2" : tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-slate-ink";
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {ikon && <span className="text-slate-faint">{ikon}</span>}
          <span className={cn("text-[38px] font-bold leading-none num", toneColor)}>{sayi}</span>
        </div>
        {href ? (
          <ChevronRight className="size-5 text-slate-faint transition group-hover:translate-x-0.5 group-hover:text-slate-muted" />
        ) : delta ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-medium",
              (delta.good ?? delta.up) ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2",
            )}
          >
            {delta.up ? "↑" : "↓"} {delta.value}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-muted">{etiket}</p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-3xl border border-line bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">{inner}</div>;
}

/* ------------------------------------------------------------------ Badge */
export function Badge({
  children,
  ton = "gri",
}: {
  children: React.ReactNode;
  ton?: "brand" | "gri" | "yesil" | "sari" | "kirmizi" | "mavi";
}) {
  const tonlar: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    gri: "bg-slate-100 text-slate-600 ring-slate-200",
    yesil: "bg-ok-soft text-green-700 ring-green-200",
    sari: "bg-warn-soft text-amber-700 ring-amber-200",
    kirmizi: "bg-danger-soft text-red-700 ring-red-200",
    mavi: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tonlar[ton],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ VerdictRozet
 * Bot kararlarını (izin/doğrula/engelle/işaretle) ikonlu renkli hap olarak gösterir.
 * "gerçek veri" hissi verir — düz metin yerine anlamlı, tutarlı görsel dil. */
export function VerdictRozet({ verdict, boyut = "md" }: { verdict: string; boyut?: "sm" | "md" }) {
  const v = verdict.toLowerCase();
  const harita: Record<string, { ad: string; ikon: React.ReactNode; sinif: string; nokta: string }> = {
    allowed:    { ad: "İzin verildi", ikon: <IconCheck />, sinif: "bg-ok-soft text-green-700 ring-green-200", nokta: "bg-ok" },
    challenged: { ad: "Doğrulandı",  ikon: <IconShield />, sinif: "bg-warn-soft text-amber-700 ring-amber-200", nokta: "bg-warn" },
    blocked:    { ad: "Engellendi",  ikon: <IconBan />, sinif: "bg-danger-soft text-red-700 ring-red-200", nokta: "bg-danger2" },
    flagged:    { ad: "İşaretlendi", ikon: <IconFlag />, sinif: "bg-blue-50 text-blue-700 ring-blue-200", nokta: "bg-blue-500" },
  };
  const m = harita[v] ?? { ad: verdict, ikon: <IconDot />, sinif: "bg-slate-100 text-slate-600 ring-slate-200", nokta: "bg-slate-400" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
      boyut === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
      m.sinif,
    )}>
      <span className="[&>svg]:size-3.5">{m.ikon}</span>
      {m.ad}
    </span>
  );
}
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>; }
function IconShield() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>; }
function IconBan() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>; }
function IconFlag() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>; }
function IconDot() { return <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>; }

/* ------------------------------------------------------------------ DurumRozeti */
export function DurumRozeti({
  ton,
  etiket,
  nabiz,
}: {
  ton: "ok" | "warn" | "danger" | "gri" | "brand";
  etiket: string;
  nabiz?: boolean;
}) {
  const renk = {
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger2",
    gri: "bg-slate-400",
    brand: "bg-brand-600",
  }[ton];
  const metin = {
    ok: "text-green-700",
    warn: "text-amber-700",
    danger: "text-red-700",
    gri: "text-slate-600",
    brand: "text-brand-700",
  }[ton];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", metin)}>
      <span className="relative flex size-2.5">
        {nabiz && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", renk)} />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", renk)} />
      </span>
      {etiket}
    </span>
  );
}

/* ------------------------------------------------------------------ Ilerleme */
export function Ilerleme({ deger, ton = "brand" }: { deger: number; ton?: "brand" | "ok" | "warn" | "danger" }) {
  const renk = { brand: "bg-brand-600", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger2" }[ton];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div className={cn("h-full rounded-full transition-all", renk)} style={{ width: `${Math.max(0, Math.min(100, deger))}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ NotKutusu */
export function NotKutusu({
  ton = "bilgi",
  baslik,
  children,
}: {
  ton?: "bilgi" | "sari" | "kirmizi" | "yesil";
  baslik?: string;
  children: React.ReactNode;
}) {
  const stil = {
    bilgi: "border-brand-100 bg-brand-50 text-brand-800",
    sari: "border-amber-200 bg-warn-soft text-amber-800",
    kirmizi: "border-red-200 bg-danger-soft text-red-800",
    yesil: "border-green-200 bg-ok-soft text-green-800",
  }[ton];
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", stil)}>
      {baslik && <div className="mb-0.5 font-semibold">{baslik}</div>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ BosDurum */
export function BosDurum({
  ikon,
  baslik,
  aciklama,
  aksiyon,
}: {
  ikon?: React.ReactNode;
  baslik: string;
  aciklama?: string;
  aksiyon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white px-6 py-16 text-center">
      {ikon && <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">{ikon}</span>}
      <h3 className="text-lg font-semibold text-slate-ink">{baslik}</h3>
      {aciklama && <p className="mt-1.5 max-w-sm text-sm text-slate-muted">{aciklama}</p>}
      {aksiyon && <div className="mt-6">{aksiyon}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Modal + form */
export function Modal({
  acik,
  kapat,
  baslik,
  aciklama,
  children,
  genislik = "max-w-lg",
}: {
  acik: boolean;
  kapat: () => void;
  baslik?: string;
  aciklama?: string;
  children: React.ReactNode;
  genislik?: string;
}) {
  useScrollKilit(acik);
  // Erişilebilir başlık/açıklama için kararlı id'ler (aria-labelledby/-describedby).
  const baslikId = useRef(`modal-baslik-${Math.random().toString(36).slice(2, 9)}`).current;
  const aciklamaId = useRef(`modal-aciklama-${Math.random().toString(36).slice(2, 9)}`).current;
  // WCAG 2.1.2 / 2.4.3: odak tuzağı — modal açıkken Tab döngüsü içeride kalır,
  // kapanınca odak açılıştan önceki öğeye geri döner.
  const dialogRef = useRef<HTMLDivElement>(null);
  useOdakTuzak(dialogRef, acik);
  useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [acik, kapat]);

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={kapat}
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative w-full rounded-3xl border border-line bg-surface shadow-lift", genislik)}
            // WCAG 4.1.2 / 1.3.1: diyalog rolü + erişilebilir ad/açıklama bağla.
            role="dialog"
            aria-modal="true"
            aria-labelledby={baslik ? baslikId : undefined}
            aria-label={baslik ? undefined : "İletişim kutusu"}
            aria-describedby={aciklama ? aciklamaId : undefined}
          >
            {baslik && (
              <div className="flex items-start justify-between border-b border-line px-6 py-4">
                <div>
                  <h2 id={baslikId} className="text-lg font-semibold text-slate-ink">{baslik}</h2>
                  {aciklama && <p id={aciklamaId} className="mt-0.5 text-sm text-slate-muted">{aciklama}</p>}
                </div>
                <button onClick={kapat} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
                  <X className="size-5" />
                </button>
              </div>
            )}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Alan({ etiket, opsiyonel, children }: { etiket: string; opsiyonel?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-ink">
        {etiket} {opsiyonel && <span className="text-slate-faint">(opsiyonel)</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint";

export function Girdi(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Alan2(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "h-auto py-2.5", props.className)} />;
}
export function Secim(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

/* ------------------------------------------------------------------ SettingRow */
export function SettingRow2({
  baslik,
  aciklama,
  onerilen,
  children,
}: {
  baslik: string;
  aciklama?: string;
  onerilen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-slate-ink">{baslik}</span>
          {onerilen && <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-600">Önerilen</span>}
        </div>
        {aciklama && <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{aciklama}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Tablo (generic) */
export interface Kolon<T> {
  baslik: string;
  render: (satir: T) => React.ReactNode;
  className?: string;
}
export function Tablo<T extends { id: string }>({
  kolonlar,
  veri,
  onSatir,
  bosMesaj = "Kayıt yok.",
  sayfaBoyu,
  sayfaBoyuSecenekleri = [15, 30, 50, 100],
  ara,
  araPlaceholder = "Ara…",
}: {
  kolonlar: Kolon<T>[];
  veri: T[];
  onSatir?: (satir: T) => void;
  bosMesaj?: string;
  /** Verilirse sayfalama açılır (başlangıç sayfa boyutu). */
  sayfaBoyu?: number;
  /** Sayfa boyutu seçici için seçenekler. */
  sayfaBoyuSecenekleri?: number[];
  /** Verilirse arama çubuğu çıkar; satırı aranan metne göre filtreler. */
  ara?: (satir: T) => string;
  araPlaceholder?: string;
}) {
  const [sayfa, setSayfa] = useState(0);
  const [boyut, setBoyut] = useState(sayfaBoyu ?? 15);
  const [sorgu, setSorgu] = useState("");

  const filtreli = ara && sorgu.trim()
    ? veri.filter((r) => ara(r).toLowerCase().includes(sorgu.trim().toLowerCase()))
    : veri;
  const sayfaliMi = !!sayfaBoyu;
  const toplamSayfa = sayfaliMi ? Math.max(1, Math.ceil(filtreli.length / boyut)) : 1;
  const s = Math.min(sayfa, Math.max(0, toplamSayfa - 1));
  const gorunen = sayfaliMi ? filtreli.slice(s * boyut, s * boyut + boyut) : filtreli;

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      {ara && (
        <div className="border-b border-line px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => { setSorgu(e.target.value); setSayfa(0); }}
              placeholder={araPlaceholder}
              aria-label="Tabloda ara"
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/40">
              {kolonlar.map((k, i) => (
                <th key={i} className={cn("px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint", k.className)}>
                  {k.baslik}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gorunen.length === 0 ? (
              <tr>
                <td colSpan={kolonlar.length} className="px-5 py-12 text-center text-sm text-slate-faint">
                  {bosMesaj}
                </td>
              </tr>
            ) : (
              gorunen.map((satir) => (
                <tr
                  key={satir.id}
                  onClick={() => onSatir?.(satir)}
                  // WCAG 2.1.1: tıklanabilir satır klavyeden de tetiklenebilir olmalı.
                  {...(onSatir
                    ? {
                        role: "button",
                        tabIndex: 0,
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSatir(satir);
                          }
                        },
                      }
                    : {})}
                  className={cn(
                    "border-b border-line last:border-0 transition hover:bg-canvas/60",
                    onSatir && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400",
                  )}
                >
                  {kolonlar.map((k, i) => (
                    <td key={i} className={cn("px-5 py-3.5 text-slate-ink", k.className)}>
                      {k.render(satir)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sayfaliMi && (filtreli.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-slate-muted">
          <div className="flex items-center gap-3">
            <span className="num">
              {filtreli.length === 0 ? 0 : s * boyut + 1}–{Math.min((s + 1) * boyut, filtreli.length)} / {filtreli.length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-faint">Göster:</span>
              <select
                value={boyut}
                onChange={(e) => { setBoyut(Number(e.target.value)); setSayfa(0); }}
                aria-label="Sayfa başına kayıt"
                className="rounded-lg border border-line-strong bg-surface px-2 py-1 text-[13px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
              >
                {sayfaBoyuSecenekleri.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </span>
          </div>
          {toplamSayfa > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setSayfa(Math.max(0, s - 1))} disabled={s === 0} className="rounded-lg px-2.5 py-1.5 transition hover:bg-canvas disabled:opacity-40">
                ← Önceki
              </button>
              <span className="num px-2 font-medium text-slate-ink">
                {s + 1} / {toplamSayfa}
              </span>
              <button onClick={() => setSayfa(Math.min(toplamSayfa - 1, s + 1))} disabled={s >= toplamSayfa - 1} className="rounded-lg px-2.5 py-1.5 transition hover:bg-canvas disabled:opacity-40">
                Sonraki →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Avatar */
export function Avatar({ ad, renk, boyut = 32 }: { ad: string; renk?: string; boyut?: number }) {
  const bas = ad.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: boyut, height: boyut, background: renk || "#4a41e8", fontSize: boyut * 0.4 }}
    >
      {bas}
    </span>
  );
}

/* ------------------------------------------------------------------ Toast */
type Toast = { id: number; tip: "basari" | "hata" | "bilgi"; baslik: string; aciklama?: string };
const ToastCtx = createContext<{ goster: (t: Omit<Toast, "id">) => void }>({ goster: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastSaglayici({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const goster = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setItems((p) => [...p, { ...t, id }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ goster }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2.5">
        <AnimatePresence>
          {items.map((t) => {
            const renk = t.tip === "basari" ? "bg-ok" : t.tip === "hata" ? "bg-danger2" : "bg-brand-600";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-line bg-white p-3.5 shadow-lift"
              >
                <span className={cn("absolute left-0 top-0 h-full w-1", renk)} />
                <div className="pl-1">
                  <div className="text-sm font-semibold text-slate-ink">{t.baslik}</div>
                  {t.aciklama && <div className="mt-0.5 text-[13px] text-slate-muted">{t.aciklama}</div>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ SatirMenu */
export function SatirMenu({ aksiyonlar }: { aksiyonlar: { ad: string; onClick: () => void; tehlike?: boolean }[] }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAcik(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setAcik((v) => !v)}
        aria-label="Satır işlemleri"
        aria-haspopup="menu"
        aria-expanded={acik}
        className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {acik && (
        <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-line bg-white p-1.5 shadow-lift animate-fade-up">
          {aksiyonlar.map((a) => (
            <button
              key={a.ad}
              onClick={() => {
                a.onClick();
                setAcik(false);
              }}
              className={cn(
                "flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-canvas",
                a.tehlike ? "text-danger2" : "text-slate-ink",
              )}
            >
              {a.ad}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* dış-tık hook */
export function useDisari<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

/* ------------------------------------------------------------------ Ülke (bayrak + kod) */
export function Ulke({ kod, className }: { kod: string; className?: string }) {
  const b = bayrak(kod);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-ink", className)}>
      <span className="text-[13px] leading-none">{b}</span>
      {kod}
    </span>
  );
}

/* ------------------------------------------------------------------ KodBlok
 * Kaliteli kod bloğu: koyu editör zemini, macOS pencere noktaları, dil
 * etiketi, hafif sözdizimi renklendirme, kopyala butonu. */
function renklendir(kod: string, dil?: string): React.ReactNode[] {
  // Hafif ama etkili: yorum, string, sayı, anahtar kelime, curl bayrakları.
  const parcalar: React.ReactNode[] = [];
  const satirlar = kod.split("\n");
  const anahtar = /\b(const|let|var|function|return|import|from|export|await|async|new|if|else|for|true|false|null|def|print|curl|POST|GET|fetch)\b/g;
  satirlar.forEach((satir, si) => {
    let idx = 0;
    const parcalar2: React.ReactNode[] = [];
    // yorum satırı
    const yorumMi = /^\s*(#|\/\/)/.test(satir);
    if (yorumMi) {
      parcalar2.push(<span key="c" className="text-slate-500 italic">{satir}</span>);
    } else {
      // string'leri ve anahtarları işaretle
      const regex = /("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+\.?\d*\b)|(\bhttps?:\/\/[^\s"']+)/g;
      let m: RegExpExecArray | null;
      let son = 0;
      const kalanIsle = (metin: string, key: string) => {
        // anahtar kelime renklendir
        const segs: React.ReactNode[] = [];
        let last = 0; let km: RegExpExecArray | null;
        const rx = new RegExp(anahtar);
        while ((km = rx.exec(metin))) {
          if (km.index > last) segs.push(metin.slice(last, km.index));
          segs.push(<span key={key + km.index} className="text-brand-300">{km[0]}</span>);
          last = km.index + km[0].length;
        }
        if (last < metin.length) segs.push(metin.slice(last));
        return segs;
      };
      while ((m = regex.exec(satir))) {
        if (m.index > son) parcalar2.push(...kalanIsle(satir.slice(son, m.index), `k${si}-${son}`));
        if (m[1]) parcalar2.push(<span key={`s${si}-${m.index}`} className="text-emerald-300">{m[0]}</span>);
        else if (m[2]) parcalar2.push(<span key={`n${si}-${m.index}`} className="text-amber-300">{m[0]}</span>);
        else parcalar2.push(<span key={`u${si}-${m.index}`} className="text-cyan-300 underline decoration-cyan-300/30">{m[0]}</span>);
        son = m.index + m[0].length;
      }
      if (son < satir.length) parcalar2.push(...kalanIsle(satir.slice(son), `k${si}-end`));
    }
    parcalar.push(<span key={si}>{parcalar2}{si < satirlar.length - 1 ? "\n" : ""}</span>);
    void idx; void dil;
  });
  return parcalar;
}

export function KodBlok({
  kod,
  dil,
  baslik,
  className,
  maxH = "max-h-[420px]",
}: {
  kod: string;
  dil?: string;
  baslik?: string;
  className?: string;
  maxH?: string;
}) {
  const { goster } = useToast();
  const [kopyalandi, setKopyalandi] = useState(false);
  function kopyala() {
    navigator.clipboard.writeText(kod);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: "Kod kopyalandı" });
    setTimeout(() => setKopyalandi(false), 1600);
  }
  return (
    <div className={cn("group/kod overflow-hidden rounded-2xl bg-[#0c1424] shadow-lift ring-1 ring-white/5", className)}>
      {/* pencere şeridi */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </span>
          {(baslik || dil) && <span className="ml-2 text-[12px] font-medium text-slate-400">{baslik ?? dil}</span>}
        </div>
        <button
          onClick={kopyala}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.12] hover:text-white"
        >
          {kopyalandi ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {kopyalandi ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <pre className={cn("overflow-auto p-4 text-[12.5px] leading-relaxed", maxH)}>
        <code className="font-mono text-[#dbe4f0]">{renklendir(kod, dil)}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ Tooltip
 * İkon/buton üstüne gelince bilgilendirme balonu. CSS-only (group-hover),
 * erişilebilir (title fallback). `yon` ile konum. */
export function Tooltip({
  metin,
  yon = "ust",
  children,
  className,
}: {
  metin: string;
  yon?: "ust" | "alt" | "sol" | "sag";
  children: React.ReactNode;
  className?: string;
}) {
  const konum = {
    ust: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    alt: "top-full left-1/2 mt-2 -translate-x-1/2",
    sol: "right-full top-1/2 mr-2 -translate-y-1/2",
    sag: "left-full top-1/2 ml-2 -translate-y-1/2",
  }[yon];
  const okKonum = {
    ust: "left-1/2 top-full -mt-1 -translate-x-1/2",
    alt: "left-1/2 bottom-full -mb-1 -translate-x-1/2",
    sol: "top-1/2 left-full -ml-1 -translate-y-1/2",
    sag: "top-1/2 right-full -mr-1 -translate-y-1/2",
  }[yon];
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[999] whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lift transition-all duration-150 group-hover/tt:opacity-100",
          "scale-95 group-hover/tt:scale-100",
          konum,
        )}
      >
        {metin}
        <span className={cn("absolute size-1.5 rotate-45 bg-ink-900", okKonum)} />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ scroll-lock */
/** Modal/drawer açıkken arka plan sayfasının kaymasını engeller. */
export function useScrollKilit(aktif: boolean) {
  useEffect(() => {
    if (!aktif) return;
    const eski = document.body.style.overflow;
    const scrollBarGenislik = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarGenislik > 0) document.body.style.paddingRight = `${scrollBarGenislik}px`;
    return () => {
      document.body.style.overflow = eski;
      document.body.style.paddingRight = "";
    };
  }, [aktif]);
}
