"use client";

/**
 * SOC Ekip İş Akışı & Vaka Yönetimi — İstemci
 * ============================================
 * Jira/PagerDuty benzeri güvenlik vaka yönetimi:
 *  - Özet: açık vaka, ort MTTR, SLA ihlali, çözülen.
 *  - Vaka kuyruğu: durum kolonlarına ayrılmış kanban; her kartta öncelik
 *    rozeti, atanan avatar, canlı SLA sayaç barı, kaynak, ilgili playbook.
 *  - Ekip panosu: analist iş yükü + workload bar.
 *  - SLA & performans: MTTR, SLA uyum %, backlog yaşlanma + öncelik dağılımı
 *    (elle SVG barlar).
 *  - Etkileşim: durum değiştir, ata, önceliğe/atanana göre filtrele — hepsi
 *    OTURUM-YERELİ (localStorage), iyimser, üretimi mutasyona uğratmaz.
 *
 * DÜRÜSTLÜK: Vakalar gerçek yüksek-şiddetli olaylardan otomatik tohumlanır.
 * Ekip listesi + atamalar TEMSİLİ bir demo iş akışıdır. Durum yalnızca bu
 * tarayıcıda (localStorage) saklanır; sunucu/DB değişmez.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server,
  BookOpen,
  Filter,
  ArrowRight,
  Info,
  Gauge,
  UserPlus,
  Layers,
} from "lucide-react";
import { Panel, StatKart, Badge, Avatar, Ilerleme, NotKutusu, useToast, Tooltip } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { ekipCeviri } from "./ekip-akis.i18n";
import {
  type Vaka,
  type EkipMetrik,
  type Oncelik,
  type VakaDurum,
  type Analist,
  DURUM_SIRA,
  TAKIM,
  slaDurumu,
  ekipMetrikleri,
} from "./vaka";

/** Yerel çeviri fonksiyonu tipi (t) — alt bileşenlere geçirilir. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ enum → çeviri anahtarı eşleme */

/** Durum enum → yerel çeviri anahtarı (DURUM_ETIKET lib'i yerine). */
function durumEtiket(durum: VakaDurum, t: Ceviri): string {
  return t(`durum.${durum}`);
}
/** Öncelik enum → "Pn — <çeviri>" (ONCELIK_ETIKET lib'i yerine, enum değeri sabit kalır). */
function oncelikEtiket(oncelik: Oncelik, t: Ceviri): string {
  return `${oncelik} — ${t(`oncelik.${oncelik}`)}`;
}
/** Analist rolü enum → yerel çeviri anahtarı. */
function rolEtiket(rol: Analist["rol"], t: Ceviri): string {
  const anahtar = rol === "Kıdemli Analist" ? "rol.kidemli" : rol === "Yönetici" ? "rol.yonetici" : "rol.analist";
  return t(anahtar);
}

/* ------------------------------------------------------------------ Sabitler / eşleme */

const LS_ANAHTAR = "specter.vakalar.v1";

/** localStorage'da tutulan oturum-yerel geçersiz-kılmalar (vaka id → durum/atanan). */
type OturumDurum = Record<string, { durum?: VakaDurum; atanan?: string | null }>;

const ONCELIK_RENK: Record<Oncelik, string> = {
  P1: "#dc2626",
  P2: "#ea580c",
  P3: "#d97706",
  P4: "#64748b",
};
const ONCELIK_BADGE: Record<Oncelik, "kirmizi" | "sari" | "gri"> = {
  P1: "kirmizi",
  P2: "kirmizi",
  P3: "sari",
  P4: "gri",
};
const DURUM_TON: Record<VakaDurum, "brand" | "sari" | "mavi" | "gri" | "yesil"> = {
  yeni: "brand",
  triyaj: "sari",
  devam: "mavi",
  beklemede: "gri",
  cozuldu: "yesil",
};

/** BCP-47 yerel kodu (Intl biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Süreyi dile göre kısa etikete çevirir (dk/sa/g birimleri çevrilir). */
function sureEtiket(dk: number, t: Ceviri): string {
  const bDk = t("sure.dk");
  const bSa = t("sure.sa");
  const bG = t("sure.g");
  if (dk <= 0) return `0 ${bDk}`;
  if (dk < 60) return `${dk} ${bDk}`;
  const s = Math.floor(dk / 60);
  const k = dk % 60;
  if (s < 24) return k ? `${s} ${bSa} ${k} ${bDk}` : `${s} ${bSa}`;
  const g = Math.floor(s / 24);
  const ks = s % 24;
  return ks ? `${g} ${bG} ${ks} ${bSa}` : `${g} ${bG}`;
}
function tarih(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleString(YEREL[dil], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ SLA sayaç barı */

function SlaBar({ vaka, now, t }: { vaka: Vaka; now: number; t: Ceviri }) {
  const s = slaDurumu(vaka, now);
  const cozuldu = vaka.durum === "cozuldu";
  // Renk: yeşilden kırmızıya doğru tükendikçe.
  const renk = cozuldu
    ? "#10b981"
    : s.ihlal
      ? "#dc2626"
      : s.yuzde >= 80
        ? "#ea580c"
        : s.yuzde >= 55
          ? "#d97706"
          : "#10b981";
  const dolu = Math.min(100, s.yuzde);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="flex items-center gap-1 text-slate-muted">
          <Clock className="size-3" />
          {cozuldu ? t("sla.icindeKapandi") : s.ihlal ? t("sla.asildi") : t("sla.kaldi").replace("{sure}", sureEtiket(s.kalanDk, t))}
        </span>
        <span className={cn("num", s.ihlal && !cozuldu ? "text-danger2" : "text-slate-faint")}>%{s.yuzde}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${dolu}%`, background: renk }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Öncelik dağılım (SVG) */

function OncelikDagilim({ dagilim }: { dagilim: Record<Oncelik, number> }) {
  const siralar: Oncelik[] = ["P1", "P2", "P3", "P4"];
  const enb = Math.max(1, ...siralar.map((o) => dagilim[o]));
  return (
    <div className="space-y-3">
      {siralar.map((o) => {
        const v = dagilim[o];
        const w = (v / enb) * 100;
        return (
          <div key={o} className="flex items-center gap-3">
            <span className="w-6 text-[12px] font-semibold num" style={{ color: ONCELIK_RENK[o] }}>
              {o}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-lg bg-canvas">
              <div
                className="flex h-full items-center justify-end rounded-lg px-2 text-[11px] font-bold text-white transition-all"
                style={{ width: `${Math.max(w, v > 0 ? 12 : 0)}%`, background: ONCELIK_RENK[o] }}
              >
                {v > 0 ? v : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Backlog yaşlanma (SVG) */

/** Açık vakaları yaş kovalarına (SLA'ya göre normalize) dağıtıp bar çizer. */
function BacklogYaslanma({ vakalar, now, t }: { vakalar: Vaka[]; now: number; t: Ceviri }) {
  // Kovalar: taze (<%50), yaklaşıyor (%50-80), riskli (%80-100), ihlal (>%100).
  const kova = { taze: 0, yaklasan: 0, riskli: 0, ihlal: 0 };
  for (const v of vakalar) {
    if (v.durum === "cozuldu") continue;
    const s = slaDurumu(v, now);
    if (s.ihlal) kova.ihlal++;
    else if (s.yuzde >= 80) kova.riskli++;
    else if (s.yuzde >= 50) kova.yaklasan++;
    else kova.taze++;
  }
  const barlar = [
    { anahtar: "taze", ad: t("kova.taze"), deger: kova.taze, renk: "#10b981" },
    { anahtar: "yaklasan", ad: t("kova.yaklasan"), deger: kova.yaklasan, renk: "#d97706" },
    { anahtar: "riskli", ad: t("kova.riskli"), deger: kova.riskli, renk: "#ea580c" },
    { anahtar: "ihlal", ad: t("kova.ihlal"), deger: kova.ihlal, renk: "#dc2626" },
  ];
  const enb = Math.max(1, ...barlar.map((b) => b.deger));
  const g = 240;
  const y = 120;
  const bw = g / barlar.length;
  return (
    <div>
      <svg viewBox={`0 0 ${g} ${y}`} className="h-32 w-full" preserveAspectRatio="none" aria-hidden>
        {barlar.map((b, i) => {
          const h = (b.deger / enb) * (y - 20);
          return (
            <g key={b.anahtar}>
              <rect
                x={i * bw + bw * 0.18}
                y={y - 16 - h}
                width={bw * 0.64}
                height={Math.max(h, b.deger > 0 ? 3 : 0)}
                rx={3}
                fill={b.renk}
              />
              <text x={i * bw + bw / 2} y={y - 16 - h - 4} textAnchor="middle" className="num" fontSize="11" fill="#334155" fontWeight="700">
                {b.deger > 0 ? b.deger : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {barlar.map((b) => (
          <span key={b.anahtar} className="flex-1 text-center text-[11px] font-medium text-slate-muted">
            {b.ad}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Vaka kartı */

function VakaKart({
  vaka,
  now,
  onDurum,
  onAta,
  t,
}: {
  vaka: Vaka;
  now: number;
  onDurum: (id: string, durum: VakaDurum) => void;
  onAta: (id: string, atanan: string | null) => void;
  t: Ceviri;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white"
            style={{ background: ONCELIK_RENK[vaka.oncelik] }}
          >
            {vaka.oncelik}
          </span>
          <Badge ton="gri">{vaka.tur}</Badge>
        </div>
        <span className="num text-[11px] text-slate-faint">{vaka.etkilenenIstek} {t("kart.istek")}</span>
      </div>

      <h4 className="mt-2 text-[13.5px] font-semibold leading-snug text-slate-ink">{vaka.baslik}</h4>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-muted">
        <span className="inline-flex items-center gap-1 rounded bg-canvas px-1.5 py-0.5 font-medium">
          <Server className="size-3" />
          {vaka.kaynak}
        </span>
      </div>

      <Link
        href="/panel/mudahale"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline"
      >
        <BookOpen className="size-3" />
        {vaka.ilgiliPlaybook}
        <ArrowRight className="size-3" />
      </Link>

      <div className="mt-3">
        <SlaBar vaka={vaka} now={now} t={t} />
      </div>

      {/* Atanan + kontroller */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex items-center gap-1.5">
          {vaka.atanan ? (
            <>
              <Avatar ad={vaka.atanan} renk={TAKIM.find((t) => t.ad === vaka.atanan)?.renk} boyut={22} />
              <span className="text-[11px] font-medium text-slate-ink">{vaka.atanan}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-faint">
              <UserPlus className="size-3.5" />
              {t("kart.atanmadi")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <select
          value={vaka.durum}
          onChange={(e) => onDurum(vaka.id, e.target.value as VakaDurum)}
          aria-label={t("kart.durumDegistir")}
          className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-[11px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
        >
          {DURUM_SIRA.map((d) => (
            <option key={d} value={d}>
              {durumEtiket(d, t)}
            </option>
          ))}
        </select>
        <select
          value={vaka.atanan ?? ""}
          onChange={(e) => onAta(vaka.id, e.target.value || null)}
          aria-label={t("kart.analisteAta")}
          className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-[11px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
        >
          <option value="">{t("kart.atanmadi")}</option>
          {TAKIM.map((t) => (
            <option key={t.id} value={t.ad}>
              {t.ad}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Ana istemci */

export function EkipAkisIstemci({
  dil,
  vakalar: ilkVakalar,
  metrik: ilkMetrik,
  toplamOlay,
}: {
  dil: Dil;
  vakalar: Vaka[];
  metrik: EkipMetrik;
  toplamOlay: number;
}) {
  const { goster } = useToast();
  const t: Ceviri = (anahtar) => ekipCeviri(anahtar, dil);

  // Oturum-yerel geçersiz-kılmalar (durum/atanan) — localStorage.
  const [oturum, setOturum] = useState<OturumDurum>({});
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ANAHTAR);
      if (raw) setOturum(JSON.parse(raw) as OturumDurum);
    } catch {
      /* yok say */
    }
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (!yuklendi) return;
    try {
      localStorage.setItem(LS_ANAHTAR, JSON.stringify(oturum));
    } catch {
      /* yok say */
    }
  }, [oturum, yuklendi]);

  // Filtreler.
  const [oncelikFiltre, setOncelikFiltre] = useState<Oncelik | "hepsi">("hepsi");
  const [atananFiltre, setAtananFiltre] = useState<string>("hepsi");

  // "Şimdi" referansı: en yeni vaka güncellemesi (deterministik, canlı SLA için
  // gerçek saat kullanmayız — vakalar geçmiş olaylardan tohumludur). Böylece
  // SLA barları olay-zamanına göre tutarlı; gerçek saatle "hepsi ihlal" olmaz.
  const now = useMemo(() => {
    let m = 0;
    for (const v of ilkVakalar) {
      if (v.guncellendi > m) m = v.guncellendi;
      if (v.olusturuldu > m) m = v.olusturuldu;
    }
    return m;
  }, [ilkVakalar]);

  // Oturum geçersiz-kılmalarını uygula → efektif vakalar.
  const vakalar = useMemo(() => {
    return ilkVakalar.map((v) => {
      const o = oturum[v.id];
      if (!o) return v;
      const durum = o.durum ?? v.durum;
      // Durum çözüldüyse ve öncesinde çözülmemişse, çözüm anını now yap (MTTR
      // demoda anlamlı görünsün — dürüstçe: temsili çözüm süresi).
      const guncellendi = durum === "cozuldu" && v.durum !== "cozuldu" ? Math.max(v.guncellendi, now) : v.guncellendi;
      return { ...v, durum, atanan: o.atanan !== undefined ? o.atanan : v.atanan, guncellendi };
    });
  }, [ilkVakalar, oturum, now]);

  // Efektif metrikler (oturum durumuna göre yeniden hesapla).
  const metrik = useMemo(() => (yuklendi ? ekipMetrikleri(vakalar, now) : ilkMetrik), [vakalar, now, yuklendi, ilkMetrik]);

  // Filtreli görünüm.
  const filtreli = useMemo(() => {
    return vakalar.filter((v) => {
      if (oncelikFiltre !== "hepsi" && v.oncelik !== oncelikFiltre) return false;
      if (atananFiltre !== "hepsi") {
        if (atananFiltre === "atanmadi" && v.atanan) return false;
        if (atananFiltre !== "atanmadi" && v.atanan !== atananFiltre) return false;
      }
      return true;
    });
  }, [vakalar, oncelikFiltre, atananFiltre]);

  // Kolonlara ayır.
  const kolonlar = useMemo(() => {
    const m: Record<VakaDurum, Vaka[]> = { yeni: [], triyaj: [], devam: [], beklemede: [], cozuldu: [] };
    for (const v of filtreli) m[v.durum].push(v);
    return m;
  }, [filtreli]);

  // Ekip iş yükü: her analiste düşen AÇIK (çözülmemiş) vaka sayısı.
  const isYuku = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of TAKIM) m.set(t.ad, 0);
    for (const v of vakalar) {
      if (v.durum !== "cozuldu" && v.atanan && m.has(v.atanan)) m.set(v.atanan, (m.get(v.atanan) ?? 0) + 1);
    }
    return m;
  }, [vakalar]);
  const maxYuk = Math.max(1, ...[...isYuku.values()]);

  // --- Aksiyonlar (iyimser, oturum-yerel) ---
  function durumDegistir(id: string, durum: VakaDurum) {
    setOturum((p) => ({ ...p, [id]: { ...p[id], durum } }));
    goster({
      tip: "bilgi",
      baslik: t("toast.durumBaslik"),
      aciklama: t("toast.durumAciklama").replace("{durum}", durumEtiket(durum, t)),
    });
  }
  function ata(id: string, atanan: string | null) {
    setOturum((p) => ({ ...p, [id]: { ...p[id], atanan } }));
    goster({
      tip: "basari",
      baslik: atanan ? t("toast.atandiBaslik") : t("toast.atamaKaldirildiBaslik"),
      aciklama: atanan
        ? t("toast.atandiAciklama").replace("{ad}", atanan)
        : t("toast.atamaKaldirildiAciklama"),
    });
  }
  function sifirla() {
    setOturum({});
    goster({ tip: "bilgi", baslik: t("toast.sifirlaBaslik"), aciklama: t("toast.sifirlaAciklama") });
  }

  const hicVaka = ilkVakalar.length === 0;

  return (
    <div className="space-y-6">
      {/* Dürüstlük notu */}
      <NotKutusu ton="bilgi" baslik={t("not.baslik")}>
        {t("not.p1")} <strong>{t("not.gercekOlay").replace("{n}", toplamOlay.toLocaleString(YEREL[dil]))}</strong> {t("not.p2")}{" "}
        <strong>{t("not.temsili")}</strong> {t("not.p3")} <strong>{t("not.uretim")}</strong>.
      </NotKutusu>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={metrik.acik} etiket={t("ozet.acik")} ikon={<ShieldAlert className="size-4" />} tone={metrik.acik > 0 ? "warn" : "ok"} />
        <StatKart sayi={sureEtiket(metrik.ortMTTR, t)} etiket={t("ozet.mttr")} ikon={<Timer className="size-4" />} />
        <StatKart sayi={metrik.slaIhlal} etiket={t("ozet.slaIhlal")} ikon={<AlertTriangle className="size-4" />} tone={metrik.slaIhlal > 0 ? "danger" : "ok"} />
        <StatKart sayi={metrik.cozuldu} etiket={t("ozet.cozulen")} ikon={<CheckCircle2 className="size-4" />} tone="ok" />
      </div>

      {hicVaka ? (
        <Panel>
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Layers className="size-7" />
            </span>
            <h3 className="text-lg font-semibold text-slate-ink">{t("bos.baslik")}</h3>
            <p className="max-w-sm text-sm text-slate-muted">{t("bos.metin")}</p>
          </div>
        </Panel>
      ) : (
        <>
          {/* Filtreler */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-muted">
              <Filter className="size-4" />
              {t("filtre.etiket")}
            </span>
            <select
              value={oncelikFiltre}
              onChange={(e) => setOncelikFiltre(e.target.value as Oncelik | "hepsi")}
              aria-label={t("filtre.tumOncelik")}
              className="h-9 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              <option value="hepsi">{t("filtre.tumOncelik")}</option>
              {(["P1", "P2", "P3", "P4"] as Oncelik[]).map((o) => (
                <option key={o} value={o}>
                  {oncelikEtiket(o, t)}
                </option>
              ))}
            </select>
            <select
              value={atananFiltre}
              onChange={(e) => setAtananFiltre(e.target.value)}
              aria-label={t("filtre.tumAnalist")}
              className="h-9 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-slate-ink outline-none transition focus:border-brand-400"
            >
              <option value="hepsi">{t("filtre.tumAnalist")}</option>
              <option value="atanmadi">{t("filtre.atanmamis")}</option>
              {TAKIM.map((an) => (
                <option key={an.id} value={an.ad}>
                  {an.ad}
                </option>
              ))}
            </select>
            <span className="num text-[12px] text-slate-faint">{t("filtre.gosteriliyor").replace("{n}", String(filtreli.length))}</span>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={sifirla}>
                {t("filtre.sifirla")}
              </Button>
            </div>
          </div>

          {/* Kanban kuyruğu */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4" style={{ minWidth: "980px" }}>
              {DURUM_SIRA.map((durum) => (
                <div key={durum} className="flex-1" style={{ minWidth: "220px" }}>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Badge ton={DURUM_TON[durum]}>{durumEtiket(durum, t)}</Badge>
                    </div>
                    <span className="num text-[12px] font-semibold text-slate-faint">{kolonlar[durum].length}</span>
                  </div>
                  <div className="space-y-3 rounded-2xl bg-canvas/40 p-2">
                    {kolonlar[durum].length === 0 ? (
                      <div className="py-8 text-center text-[12px] text-slate-faint">{t("kart.kolonBos")}</div>
                    ) : (
                      kolonlar[durum].map((v) => (
                        <VakaKart key={v.id} vaka={v} now={now} onDurum={durumDegistir} onAta={ata} t={t} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ekip panosu + SLA/performans */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Ekip iş yükü */}
            <Panel baslik={t("ekip.baslik")} className="lg:col-span-2" sagUst={<span className="text-[11px] text-slate-faint">{t("ekip.temsili")}</span>}>
              <div className="space-y-3.5">
                {TAKIM.map((an) => {
                  const yuk = isYuku.get(an.ad) ?? 0;
                  const w = (yuk / maxYuk) * 100;
                  const asiri = yuk >= 4;
                  return (
                    <div key={an.id} className="flex items-center gap-3">
                      <Avatar ad={an.ad} renk={an.renk} boyut={34} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-slate-ink">{an.ad}</span>
                            <Badge ton={an.rol === "Yönetici" ? "mavi" : an.rol === "Kıdemli Analist" ? "brand" : "gri"}>
                              {rolEtiket(an.rol, t)}
                            </Badge>
                          </div>
                          <span className={cn("num text-[12px] font-semibold", asiri ? "text-danger2" : "text-slate-muted")}>
                            {t("ekip.acikVaka").replace("{n}", String(yuk))}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-canvas">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(w, yuk > 0 ? 6 : 0)}%`, background: asiri ? "#dc2626" : an.renk }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-slate-faint">{t("ekip.dipnot")}</p>
            </Panel>

            {/* Öncelik dağılımı */}
            <Panel baslik={t("dagilim.baslik")}>
              <OncelikDagilim dagilim={metrik.oncelikDagilim} />
              <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                  <Gauge className="size-3.5" />
                  {t("dagilim.slaUyumu")}
                </span>
                <span
                  className={cn(
                    "num text-[15px] font-bold",
                    metrik.slaUyum >= 90 ? "text-ok" : metrik.slaUyum >= 70 ? "text-warn" : "text-danger2",
                  )}
                >
                  %{metrik.slaUyum}
                </span>
              </div>
            </Panel>
          </div>

          {/* SLA & backlog performans */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              baslik={t("backlog.baslik")}
              sagUst={
                <Tooltip metin={t("backlog.tooltip")}>
                  <Info className="size-4 text-slate-faint" />
                </Tooltip>
              }
            >
              <BacklogYaslanma vakalar={vakalar} now={now} t={t} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
                  <span className="text-slate-muted">{t("backlog.enEski")}</span>
                  <span className="num font-semibold text-slate-ink">{sureEtiket(metrik.backlogYasi, t)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
                  <span className="text-slate-muted">{t("backlog.acikToplam")}</span>
                  <span className="num font-semibold text-slate-ink">
                    {metrik.acik} / {metrik.toplam}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel baslik={t("perf.baslik")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                    <Timer className="size-3.5" />
                    {t("perf.mttr")}
                  </div>
                  <div className="mt-1.5 num text-2xl font-bold text-slate-ink">{sureEtiket(metrik.ortMTTR, t)}</div>
                  <p className="mt-1 text-[11px] text-slate-faint">{t("perf.mttrAlt")}</p>
                </div>
                <div className="rounded-2xl border border-line bg-canvas/40 p-4">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-muted">
                    <CheckCircle2 className="size-3.5" />
                    {t("perf.cozumOrani")}
                  </div>
                  <div className="mt-1.5 num text-2xl font-bold text-slate-ink">
                    %{metrik.toplam > 0 ? Math.round((metrik.cozuldu / metrik.toplam) * 100) : 0}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-faint">{t("perf.cozumOraniAlt")}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-muted">{t("perf.slaUyumu")}</span>
                  <span className="num font-semibold text-slate-ink">%{metrik.slaUyum}</span>
                </div>
                <Ilerleme
                  deger={metrik.slaUyum}
                  ton={metrik.slaUyum >= 90 ? "ok" : metrik.slaUyum >= 70 ? "warn" : "danger"}
                />
              </div>
            </Panel>
          </div>

          {/* Vaka detay listesi (tam kaynak/açıklama — tablo altı) */}
          <Panel baslik={t("dokum.baslik")} sagUst={<span className="num text-[12px] text-slate-faint">{t("dokum.vaka").replace("{n}", String(vakalar.length))}</span>}>
            <div className="space-y-2.5">
              {[...vakalar]
                .sort((a, b) => {
                  const r: Record<Oncelik, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
                  return r[a.oncelik] - r[b.oncelik];
                })
                .map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: ONCELIK_RENK[v.oncelik] }}
                    >
                      {v.oncelik}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-ink">{v.baslik}</div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-muted">{v.aciklama}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-faint">
                        <Badge ton={ONCELIK_BADGE[v.oncelik]}>{durumEtiket(v.durum, t)}</Badge>
                        <span className="num">{t("dokum.olusturma").replace("{tarih}", tarih(v.olusturuldu, dil))}</span>
                        <span className="num">{t("dokum.guncelleme").replace("{tarih}", tarih(v.guncellendi, dil))}</span>
                        {v.ulkeler.length > 0 && <span>{t("dokum.ulkeler").replace("{liste}", v.ulkeler.join(", "))}</span>}
                      </div>
                    </div>
                    <Link
                      href="/panel/mudahale"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-[11px] font-medium text-slate-ink transition hover:bg-canvas"
                    >
                      <BookOpen className="size-3" />
                      {t("dokum.playbook")}
                    </Link>
                  </div>
                ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
