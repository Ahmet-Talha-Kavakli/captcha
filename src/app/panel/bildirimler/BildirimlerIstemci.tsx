"use client";

/**
 * Specter — Bildirim Merkezi (istemci)
 * =====================================
 * Tam sayfa gelen-kutusu: özet kartları, filtre (Tümü/Okunmamış/Kritik +
 * kategori + arama), gün-gruplu liste, okundu/okunmadı, toplu işlemler.
 *
 * Uyarılar (Olay Yönetimi) modülünden FARKI: burası kullanıcıya yönelik TÜM
 * bildirimleri (güvenlik + kota + ekip + rapor + sistem) birleşik gösterir;
 * uyarılar bunun yalnızca güvenlik/incident alt kümesidir. Çakışma yok —
 * güvenlik kategorisindeki bir bildirime tıklanınca ilgili olay/tehdit sayfasına
 * gider; incident yaşam döngüsü (atama/çözme) orada yönetilir.
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Archive,
  Filter,
  Search,
  ShieldAlert,
  Server,
  Users as UsersIcon,
  Gauge,
  FileText,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { StatKart, BosDurum, useToast, Tooltip } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { bildirimlerCeviri } from "./bildirimler.i18n";
import type { MerkezBildirim, BildirimKategori } from "@/lib/ozet";

/* ------------------------------------------------------------------ sabitler */

const KAT_IKON: Record<BildirimKategori, React.ReactNode> = {
  guvenlik: <ShieldAlert className="size-[18px]" />,
  sistem: <Server className="size-[18px]" />,
  ekip: <UsersIcon className="size-[18px]" />,
  kota: <Gauge className="size-[18px]" />,
  rapor: <FileText className="size-[18px]" />,
};
/** İkon rozetinin şiddet/kategori rengi. */
const SEV_ROZET: Record<MerkezBildirim["severity"], string> = {
  critical: "bg-danger-soft text-danger2 ring-red-200",
  high: "bg-warn-soft text-amber-700 ring-amber-200",
  medium: "bg-brand-50 text-brand-600 ring-brand-100",
  low: "bg-slate-100 text-slate-500 ring-slate-200",
};
type Filtre = "all" | "unread" | "critical";

/** Durum sekmeleri — etiket enum anahtarından üretilir (çeviri: "bl.filtre.*"). */
const FILTRE_SIRA: Filtre[] = ["all", "unread", "critical"];

const KAT_SIRA: BildirimKategori[] = ["guvenlik", "sistem", "ekip", "kota", "rapor"];

/* ------------------------------------------------------------------ yardımcı */

/** Göreli yaş metni — çeviriden gelen şablona sayı gömülür. */
function yasHesap(ts: number, t: (k: string) => string): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("bl.zaman.simdi");
  if (dk < 60) return t("bl.zaman.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("bl.zaman.sa").replace("{n}", String(sa));
  const g = Math.floor(sa / 24);
  return t("bl.zaman.gun").replace("{n}", String(g));
}

/** Bir zaman damgasını gün grubuna ata (Bugün / Dün / Bu hafta / Daha eski). */
function gunGrubu(ts: number): "bugun" | "dun" | "hafta" | "eski" {
  const now = new Date();
  const bugunBas = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const gun = 86400000;
  if (ts >= bugunBas) return "bugun";
  if (ts >= bugunBas - gun) return "dun";
  if (ts >= bugunBas - 7 * gun) return "hafta";
  return "eski";
}
const GRUP_SIRA: ("bugun" | "dun" | "hafta" | "eski")[] = ["bugun", "dun", "hafta", "eski"];

/* ------------------------------------------------------------------ ana bileşen */

export function BildirimlerIstemci({ bildirimler: ilk, dil }: { bildirimler: MerkezBildirim[]; dil: Dil }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = useCallback((k: string) => bildirimlerCeviri(k, dil), [dil]);

  // Yerel durum: okundu bayrakları (alert'ler API'ye yazar; sistem türevleri
  // oturum içinde yerel tutulur) + arşivlenmişler (gizlenir).
  const [okunanlar, setOkunanlar] = useState<Set<string>>(
    () => new Set(ilk.filter((b) => b.read).map((b) => b.id)),
  );
  const [arsivli, setArsivli] = useState<Set<string>>(new Set());
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [filtre, setFiltre] = useState<Filtre>("all");
  const [katFiltre, setKatFiltre] = useState<BildirimKategori | "all">("all");
  const [sorgu, setSorgu] = useState("");

  const okunduMu = useCallback((b: MerkezBildirim) => okunanlar.has(b.id), [okunanlar]);

  // Arşivlenmemiş taban liste.
  const taban = useMemo(() => ilk.filter((b) => !arsivli.has(b.id)), [ilk, arsivli]);

  /* --- özet sayılar --- */
  const ozet = useMemo(() => {
    const now = Date.now();
    const bugunBas = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    let okunmamis = 0;
    let bugun = 0;
    let kritik = 0;
    for (const b of taban) {
      if (!okunanlar.has(b.id)) okunmamis++;
      if (b.ts >= bugunBas) bugun++;
      if (b.severity === "critical" && !okunanlar.has(b.id)) kritik++;
    }
    void now;
    return { okunmamis, bugun, kritik, toplam: taban.length };
  }, [taban, okunanlar]);

  /* --- kategori sayaçları (filtre çipleri için) --- */
  const katSayi = useMemo(() => {
    const m = new Map<BildirimKategori, number>();
    for (const b of taban) m.set(b.kategori, (m.get(b.kategori) ?? 0) + 1);
    return m;
  }, [taban]);

  /* --- filtrelenmiş liste --- */
  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return taban.filter((b) => {
      if (filtre === "unread" && okunanlar.has(b.id)) return false;
      if (filtre === "critical" && b.severity !== "critical") return false;
      if (katFiltre !== "all" && b.kategori !== katFiltre) return false;
      if (q && !(b.title.toLowerCase().includes(q) || b.message.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [taban, filtre, katFiltre, sorgu, okunanlar]);

  /* --- gün-gruplu --- */
  const gruplar = useMemo(() => {
    const m = new Map<"bugun" | "dun" | "hafta" | "eski", MerkezBildirim[]>();
    for (const b of filtreli) {
      const g = gunGrubu(b.ts);
      const arr = m.get(g) ?? [];
      arr.push(b);
      m.set(g, arr);
    }
    return GRUP_SIRA.filter((g) => m.has(g)).map((g) => ({ grup: g, items: m.get(g)! }));
  }, [filtreli]);

  /* --- kalıcılık: alert kaynaklarını API'ye yaz --- */
  const yazOkundu = useCallback(async (ids: string[]) => {
    // Yalnızca gerçek alert kayıtları API'ye yazılır (sistem türevleri yerel).
    const alertIds = ilk.filter((b) => ids.includes(b.id) && b.kaynak === "alert").map((b) => b.id);
    if (!alertIds.length) return;
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertIds.length === 1 ? { id: alertIds[0] } : { ids: alertIds }),
    }).catch(() => {});
  }, [ilk]);

  /* --- işlemler --- */
  const okuIsaretle = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setOkunanlar((p) => {
        const n = new Set(p);
        ids.forEach((i) => n.add(i));
        return n;
      });
      void yazOkundu(ids);
    },
    [yazOkundu],
  );

  async function tumunuOku() {
    const hepsi = taban.filter((b) => !okunanlar.has(b.id)).map((b) => b.id);
    if (!hepsi.length) {
      goster({ tip: "bilgi", baslik: t("bl.toast.zatenOkundu") });
      return;
    }
    setOkunanlar((p) => {
      const n = new Set(p);
      hepsi.forEach((i) => n.add(i));
      return n;
    });
    // Verimli: tek istekle sunucudaki tüm alert'leri okundu yap.
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    goster({ tip: "basari", baslik: t("bl.toast.tumuOkundu"), aciklama: t("bl.toast.adet").replace("{n}", String(hepsi.length)) });
  }

  function seciliOku() {
    const ids = [...secili];
    okuIsaretle(ids);
    setSecili(new Set());
    goster({ tip: "basari", baslik: t("bl.toast.seciliOkundu"), aciklama: t("bl.toast.adet").replace("{n}", String(ids.length)) });
  }

  function seciliArsivle() {
    const ids = [...secili];
    // Arşiv okundu da sayılır (görünmez olur).
    okuIsaretle(ids);
    setArsivli((p) => {
      const n = new Set(p);
      ids.forEach((i) => n.add(i));
      return n;
    });
    setSecili(new Set());
    goster({ tip: "basari", baslik: t("bl.toast.arsivlendi"), aciklama: t("bl.toast.arsivGizlendi").replace("{n}", String(ids.length)) });
  }

  function secimDegis(id: string) {
    setSecili((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function bildirimeTikla(b: MerkezBildirim) {
    okuIsaretle([b.id]);
    if (b.href) router.push(b.href);
  }

  const hepsiSeciliMi = filtreli.length > 0 && filtreli.every((b) => secili.has(b.id));
  function tumunuSec() {
    if (hepsiSeciliMi) setSecili(new Set());
    else setSecili(new Set(filtreli.map((b) => b.id)));
  }

  return (
    <div className="space-y-6">
      {/* ---- özet kartları ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.okunmamis} etiket={t("bl.ozet.okunmamis")} ikon={<BellRing className="size-5" />} tone={ozet.okunmamis ? "brand" : undefined} />
        <StatKart sayi={ozet.bugun} etiket={t("bl.ozet.bugun")} ikon={<Bell className="size-5" />} />
        <StatKart sayi={ozet.kritik} etiket={t("bl.ozet.kritik")} ikon={<ShieldAlert className="size-5" />} tone={ozet.kritik ? "danger" : undefined} />
        <StatKart sayi={ozet.toplam} etiket={t("bl.ozet.toplam")} ikon={<Inbox className="size-5" />} />
      </div>

      {/* ---- filtre çubuğu ---- */}
      <div className="rounded-3xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* durum sekmeleri */}
          <div className="flex items-center gap-1 rounded-full border border-line bg-canvas/50 p-1">
            {FILTRE_SIRA.map((s) => (
              <button
                key={s}
                onClick={() => setFiltre(s)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                  filtre === s ? "bg-surface text-slate-ink shadow-card" : "text-slate-muted hover:text-slate-ink",
                )}
              >
                {t("bl.filtre." + s)}
                {s === "unread" && ozet.okunmamis > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white num">{ozet.okunmamis}</span>
                )}
              </button>
            ))}
          </div>

          {/* arama */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={t("bl.ara.placeholder")}
              aria-label={t("bl.ara.aria")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
        </div>

        {/* kategori çipleri */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-faint">
            <Filter className="size-3.5" /> {t("bl.kategori.baslik")}
          </span>
          <Cip aktif={katFiltre === "all"} onClick={() => setKatFiltre("all")}>
            {t("bl.kategori.hepsi")} <span className="num opacity-60">{taban.length}</span>
          </Cip>
          {KAT_SIRA.filter((k) => (katSayi.get(k) ?? 0) > 0).map((k) => (
            <Cip key={k} aktif={katFiltre === k} onClick={() => setKatFiltre(k)}>
              {t("kat." + k)} <span className="num opacity-60">{katSayi.get(k)}</span>
            </Cip>
          ))}
        </div>
      </div>

      {/* ---- toplu işlem barı ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-muted">
          <input
            type="checkbox"
            checked={hepsiSeciliMi}
            onChange={tumunuSec}
            disabled={filtreli.length === 0}
            className="size-4 rounded border-line-strong accent-brand-600"
          />
          {secili.size > 0 ? t("bl.toplu.secili").replace("{n}", String(secili.size)) : t("bl.toplu.tumunuSec")}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {secili.size > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={seciliOku}>
                <Check className="size-4" /> {t("bl.toplu.seciliOku")}
              </Button>
              <Button size="sm" variant="outline" onClick={seciliArsivle}>
                <Archive className="size-4" /> {t("bl.toplu.arsivle")}
              </Button>
            </>
          )}
          <Button size="sm" variant="accent" onClick={tumunuOku} disabled={ozet.okunmamis === 0}>
            <CheckCheck className="size-4" /> {t("bl.toplu.tumunuOku")}
          </Button>
        </div>
      </div>

      {/* ---- liste (gün-gruplu) ---- */}
      {filtreli.length === 0 ? (
        <BosDurum
          ikon={<Bell className="size-7" />}
          baslik={t("bl.bos.baslik")}
          aciklama={
            sorgu || filtre !== "all" || katFiltre !== "all"
              ? t("bl.bos.filtre")
              : t("bl.bos.temiz")
          }
          aksiyon={
            sorgu || filtre !== "all" || katFiltre !== "all" ? (
              <Button size="sm" variant="outline" onClick={() => { setSorgu(""); setFiltre("all"); setKatFiltre("all"); }}>
                {t("bl.bos.temizle")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {gruplar.map(({ grup, items }) => (
            <div key={grup}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-faint">{t("grup." + grup)}</h3>
                <span className="text-[12px] text-slate-faint num">{items.length}</span>
              </div>
              <div className="overflow-hidden rounded-3xl border border-line bg-surface">
                <AnimatePresence initial={false}>
                  {items.map((b) => {
                    const okundu = okunduMu(b);
                    const sec = secili.has(b.id);
                    return (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "group relative flex items-start gap-3 border-b border-line px-4 py-4 transition last:border-0 sm:px-5",
                          okundu ? "bg-surface" : "bg-brand-50/30",
                          "hover:bg-canvas/70",
                        )}
                      >
                        {/* okunmamış sol şeridi */}
                        {!okundu && <span className="absolute left-0 top-0 h-full w-1 bg-brand-600" />}

                        {/* seçim kutusu */}
                        <input
                          type="checkbox"
                          checked={sec}
                          onChange={() => secimDegis(b.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={t("bl.satir.sec")}
                          className="mt-2 size-4 shrink-0 rounded border-line-strong accent-brand-600"
                        />

                        {/* ikon rozeti */}
                        <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset", SEV_ROZET[b.severity])}>
                          {KAT_IKON[b.kategori]}
                        </span>

                        {/* içerik (tıklanabilir) */}
                        <button
                          onClick={() => bildirimeTikla(b)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("truncate text-[14px]", okundu ? "font-medium text-slate-ink" : "font-semibold text-slate-ink")}>
                              {b.title}
                            </span>
                            {!okundu && <span className="size-2 shrink-0 rounded-full bg-brand-600" />}
                            <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted">{t("kat." + b.kategori)}</span>
                            {(b.severity === "critical" || b.severity === "high") && (
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                  b.severity === "critical" ? "bg-danger-soft text-red-700 ring-red-200" : "bg-warn-soft text-amber-700 ring-amber-200",
                                )}
                              >
                                {t("sev." + b.severity)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-muted">{b.message}</p>
                          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-faint">
                            <span>{yasHesap(b.ts, t)}</span>
                            {b.href && (
                              <span className="flex items-center gap-0.5 text-brand-600 opacity-0 transition group-hover:opacity-100">
                                {t("bl.satir.ac")} <ChevronRight className="size-3.5" />
                              </span>
                            )}
                          </div>
                        </button>

                        {/* okundu işaretle (satır aksiyonu) */}
                        {!okundu && (
                          <Tooltip metin={t("bl.satir.okunduIsaretle")} yon="sol">
                            <button
                              onClick={(e) => { e.stopPropagation(); okuIsaretle([b.id]); }}
                              aria-label={t("bl.satir.okunduIsaretle")}
                              className="mt-1 grid size-8 shrink-0 place-items-center rounded-full text-slate-faint opacity-0 transition hover:bg-brand-50 hover:text-brand-600 group-hover:opacity-100"
                            >
                              <Check className="size-4" />
                            </button>
                          </Tooltip>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Cip */
function Cip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition",
        aktif
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-line bg-surface text-slate-muted hover:border-line-strong hover:text-slate-ink",
      )}
    >
      {children}
    </button>
  );
}
