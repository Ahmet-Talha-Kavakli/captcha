"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  ScrollText,
  Server,
  Gauge,
  Search,
  X,
  Check,
  CheckCheck,
  Clock,
  MapPin,
  Crosshair,
  Plus,
  Circle,
  PlayCircle,
  CheckCircle2,
  MinusCircle,
  UserPlus,
  MessageSquarePlus,
  Timer,
  Flame,
  Inbox,
  ExternalLink,
  TrendingUp,
  ShieldQuestion,
} from "lucide-react";
import {
  PanelBaslik,
  Panel,
  Badge,
  Avatar,
  BosDurum,
  useToast,
  useScrollKilit,
} from "@/components/panel/kit";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { uyarilarCeviri } from "./uyarilar.i18n";

/* ------------------------------------------------------------------ tipler */

interface TimelineEntry {
  ts: number;
  actor: string;
  action: string;
  note?: string;
}
interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  ts: number;
  read: boolean;
  category: "saldiri" | "anomali" | "politika" | "sistem" | "kota";
  status: "acik" | "inceleniyor" | "cozuldu" | "yoksayildi";
  assignee: string | null;
  priority: "p1" | "p2" | "p3" | "p4";
  sourceIp?: string;
  relatedCampaignId?: string;
  timeline: TimelineEntry[];
  acknowledgedAt?: number;
  resolvedAt?: number;
}
interface Uye {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
  status: string;
}
interface Kampanya {
  id: string;
  name: string;
  status: string;
}
type Durum = Alert["status"];

/* ------------------------------------------------------------------ sabitler */

const SEV_TON: Record<Alert["severity"], "kirmizi" | "sari" | "brand" | "gri"> = {
  critical: "kirmizi",
  high: "sari",
  medium: "brand",
  low: "gri",
};
// Şiddet etiketleri i18n anahtarları (enum değeri korunur, sadece görünen metin çevrilir).
const SEV_ANAHTAR: Record<Alert["severity"], string> = {
  critical: "uy.sev.critical",
  high: "uy.sev.high",
  medium: "uy.sev.medium",
  low: "uy.sev.low",
};
const SEV_NOKTA: Record<Alert["severity"], string> = {
  critical: "bg-danger2",
  high: "bg-warn",
  medium: "bg-brand-600",
  low: "bg-slate-400",
};
// Kategori enum değerleri sabit; etiketler i18n anahtarına eşlenir.
const KAT_ANAHTAR: Record<Alert["category"], string> = {
  saldiri: "uy.kat.saldiri",
  anomali: "uy.kat.anomali",
  politika: "uy.kat.politika",
  sistem: "uy.kat.sistem",
  kota: "uy.kat.kota",
};
const KAT_IKON: Record<Alert["category"], React.ReactNode> = {
  saldiri: <ShieldAlert className="size-4" />,
  anomali: <Activity className="size-4" />,
  politika: <ScrollText className="size-4" />,
  sistem: <Server className="size-4" />,
  kota: <Gauge className="size-4" />,
};
// Kategori ikon rozeti renkleri (her kategori kendi görsel kimliğinde).
const KAT_ROZET: Record<Alert["category"], string> = {
  saldiri: "bg-danger-soft text-danger2 ring-red-100",
  anomali: "bg-warn-soft text-amber-600 ring-amber-100",
  politika: "bg-brand-50 text-brand-600 ring-brand-100",
  sistem: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  kota: "bg-violet-50 text-violet-600 ring-violet-100",
};
const PRI_ETIKET: Record<Alert["priority"], string> = { p1: "P1", p2: "P2", p3: "P3", p4: "P4" };
const PRI_TON: Record<Alert["priority"], string> = {
  p1: "bg-danger-soft text-red-700 ring-red-200",
  p2: "bg-warn-soft text-amber-700 ring-amber-200",
  p3: "bg-brand-50 text-brand-700 ring-brand-100",
  p4: "bg-slate-100 text-slate-600 ring-slate-200",
};
// Durum enum değerleri sabit; etiketler i18n anahtarına eşlenir.
const DURUM_ANAHTAR: Record<Durum, string> = {
  acik: "uy.durum.acik",
  inceleniyor: "uy.durum.inceleniyor",
  cozuldu: "uy.durum.cozuldu",
  yoksayildi: "uy.durum.yoksayildi",
};
const DURUM_TON: Record<Durum, "kirmizi" | "sari" | "yesil" | "gri"> = {
  acik: "kirmizi",
  inceleniyor: "sari",
  cozuldu: "yesil",
  yoksayildi: "gri",
};

// Sekme `key` değerleri filtre mantığında kullanılır; `anahtar` sadece görünen metin.
const DURUM_SEKME: { key: Durum | "all" | "acik_grup"; anahtar: string }[] = [
  { key: "all", anahtar: "uy.sekme.tumu" },
  { key: "acik_grup", anahtar: "uy.sekme.aktif" },
  { key: "acik", anahtar: "uy.durum.acik" },
  { key: "inceleniyor", anahtar: "uy.durum.inceleniyor" },
  { key: "cozuldu", anahtar: "uy.durum.cozuldu" },
  { key: "yoksayildi", anahtar: "uy.durum.yoksayildi" },
];

/* ------------------------------------------------------------------ yardımcı */

function yasHesap(ts: number, t: (k: string) => string): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("uy.yas.simdi");
  if (dk < 60) return `${dk} ${t("uy.yas.dk")}`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} ${t("uy.yas.sa")}`;
  const gun = Math.floor(sa / 24);
  return `${gun} ${t("uy.yas.gun")}`;
}
function sureFormat(ms: number, t: (k: string) => string): string {
  const sa = ms / 3600000;
  if (sa < 1) return `${Math.round(ms / 60000)} ${t("uy.sure.dk")}`;
  if (sa < 24) return `${sa.toFixed(1)} ${t("uy.sure.sa")}`;
  return `${(sa / 24).toFixed(1)} ${t("uy.sure.gun")}`;
}

/* ------------------------------------------------------------------ ana bileşen */

export function UyarilarIstemci({
  alerts: ilk,
  team,
  campaigns,
  dil,
}: {
  alerts: Alert[];
  team: Uye[];
  campaigns: Kampanya[];
  dil: Dil;
}) {
  const t = useCallback((k: string) => uyarilarCeviri(k, dil), [dil]);
  const router = useRouter();
  const { goster } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>(ilk);
  const [durumFiltre, setDurumFiltre] = useState<Durum | "all" | "acik_grup">("acik_grup");
  const [katFiltre, setKatFiltre] = useState<Alert["category"] | "all">("all");
  const [priFiltre, setPriFiltre] = useState<Alert["priority"] | "all">("all");
  const [q, setQ] = useState("");
  const [seciliId, setSeciliId] = useState<string | null>(null);

  const uyeMap = useMemo(() => new Map(team.map((t) => [t.id, t])), [team]);
  const kampMap = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const atanabilir = useMemo(() => team.filter((t) => t.status === "active"), [team]);

  /* --- özet metrikler --- */
  const ozet = useMemo(() => {
    const acik = alerts.filter((a) => a.status === "acik" || a.status === "inceleniyor");
    const kritik = acik.filter((a) => a.severity === "critical" || a.priority === "p1");
    const cozulmus = alerts.filter((a) => a.status === "cozuldu" && a.resolvedAt);
    const mttrMs =
      cozulmus.length > 0
        ? cozulmus.reduce((s, a) => s + ((a.resolvedAt ?? a.ts) - a.ts), 0) / cozulmus.length
        : 0;
    // Bugün çözülen (gün başından beri resolvedAt).
    const gunBasi = new Date();
    gunBasi.setHours(0, 0, 0, 0);
    const bugunCozulen = alerts.filter((a) => a.resolvedAt && a.resolvedAt >= gunBasi.getTime()).length;
    // SLA riski: açık/inceleniyor & yüksek öncelik & yaşı 4 saati geçmiş olaylar.
    const slaEsik = 4 * 3600000;
    const slaRisk = acik.filter(
      (a) => (a.priority === "p1" || a.priority === "p2") && Date.now() - a.ts > slaEsik,
    ).length;
    // Bir haftalık delta (aktif olayların bu hafta vs geçen hafta açılışı).
    const haftaMs = 7 * 86400000;
    const buHafta = alerts.filter((a) => Date.now() - a.ts <= haftaMs).length;
    const gecenHafta = alerts.filter((a) => {
      const y = Date.now() - a.ts;
      return y > haftaMs && y <= 2 * haftaMs;
    }).length;
    const haftaDelta = buHafta - gecenHafta;
    return {
      acikSayi: acik.length,
      kritikSayi: kritik.length,
      mttrMs,
      cozulmusSayi: cozulmus.length,
      bugunCozulen,
      slaRisk,
      haftaDelta,
    };
  }, [alerts]);

  /* --- MTTR gauge skoru: 4 sa hedefine göre 0-100 (küçük süre = yüksek skor) --- */
  const mttrSkor = useMemo(() => {
    if (ozet.mttrMs <= 0) return 100;
    const hedefMs = 4 * 3600000;
    // Hedefin altındaysa 100'e yakın, katına çıktıkça düşer.
    return Math.max(0, Math.min(100, Math.round(100 - ((ozet.mttrMs - hedefMs) / hedefMs) * 40)));
  }, [ozet.mttrMs]);

  /* --- 7 günlük çift-seri trend (açılan vs çözülen olay/gün) --- */
  const trend = useMemo(() => {
    const acilan: number[] = [];
    const cozulen: number[] = [];
    const etiketler: string[] = [];
    for (let d = 6; d >= 0; d--) {
      const bas = new Date();
      bas.setHours(0, 0, 0, 0);
      bas.setDate(bas.getDate() - d);
      const basMs = bas.getTime();
      const son = basMs + 86400000;
      acilan.push(alerts.filter((a) => a.ts >= basMs && a.ts < son).length);
      cozulen.push(alerts.filter((a) => a.resolvedAt && a.resolvedAt >= basMs && a.resolvedAt < son).length);
      etiketler.push(bas.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }));
    }
    return { acilan, cozulen, etiketler };
  }, [alerts]);

  /* --- kategori dağılımı (aktif olaylar) --- */
  const katDagilim = useMemo(() => {
    const aktif = alerts.filter((a) => a.status === "acik" || a.status === "inceleniyor");
    const renk: Record<Alert["category"], string> = {
      saldiri: "#dc2626",
      anomali: "#d97706",
      politika: "#4a41e8",
      sistem: "#0891b2",
      kota: "#7c3aed",
    };
    return (Object.keys(KAT_ANAHTAR) as Alert["category"][])
      .map((k) => ({ etiket: t(KAT_ANAHTAR[k]), deger: aktif.filter((a) => a.category === k).length, renk: renk[k] }))
      .filter((s) => s.deger > 0);
  }, [alerts, t]);

  /* --- öncelik dağılımı (aktif olaylar, P1-P4 renkli) --- */
  const priDagilim = useMemo(() => {
    const aktif = alerts.filter((a) => a.status === "acik" || a.status === "inceleniyor");
    const renk: Record<Alert["priority"], string> = {
      p1: "#dc2626",
      p2: "#d97706",
      p3: "#2f6fed",
      p4: "#94a3b8",
    };
    return (["p1", "p2", "p3", "p4"] as Alert["priority"][])
      .map((p) => ({ etiket: PRI_ETIKET[p], deger: aktif.filter((a) => a.priority === p).length, renk: renk[p] }))
      .filter((s) => s.deger > 0);
  }, [alerts]);

  /* --- sekme sayaçları (durum bazlı rozet için) --- */
  const sekmeSayac = useMemo(() => {
    const say = (k: Durum | "all" | "acik_grup") => {
      if (k === "all") return alerts.length;
      if (k === "acik_grup") return alerts.filter((a) => a.status === "acik" || a.status === "inceleniyor").length;
      return alerts.filter((a) => a.status === k).length;
    };
    return Object.fromEntries(DURUM_SEKME.map((s) => [s.key, say(s.key)])) as Record<string, number>;
  }, [alerts]);

  /* --- filtreleme --- */
  const filtreli = useMemo(() => {
    return alerts.filter((a) => {
      if (durumFiltre === "acik_grup") {
        if (a.status !== "acik" && a.status !== "inceleniyor") return false;
      } else if (durumFiltre !== "all" && a.status !== durumFiltre) return false;
      if (katFiltre !== "all" && a.category !== katFiltre) return false;
      if (priFiltre !== "all" && a.priority !== priFiltre) return false;
      if (q) {
        const alt = q.toLocaleLowerCase("tr");
        const hedef = `${a.title} ${a.message} ${a.sourceIp ?? ""}`.toLocaleLowerCase("tr");
        if (!hedef.includes(alt)) return false;
      }
      return true;
    });
  }, [alerts, durumFiltre, katFiltre, priFiltre, q]);

  const secili = seciliId ? alerts.find((a) => a.id === seciliId) ?? null : null;
  const aktifFiltre = katFiltre !== "all" || priFiltre !== "all" || q.length > 0;

  /* --- mutasyonlar (optimistik + API) --- */
  const patch = useCallback(
    async (
      id: string,
      body: { status?: Durum; assignee?: string | null; note?: string },
      basariMesaj: string,
    ) => {
      try {
        const res = await fetch("/api/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...body }),
        });
        if (!res.ok) {
          goster({ tip: "hata", baslik: t("uy.mesaj.islemBasarisiz"), aciklama: t("uy.mesaj.tekrarDeneyin") });
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.alert) {
          setAlerts((p) => p.map((a) => (a.id === id ? { ...a, ...data.alert } : a)));
        }
        goster({ tip: "basari", baslik: basariMesaj });
        router.refresh();
      } catch {
        goster({ tip: "hata", baslik: t("uy.mesaj.islemBasarisiz"), aciklama: t("uy.mesaj.tekrarDeneyin") });
      }
    },
    [goster, router, t],
  );

  const durumDegistir = useCallback(
    (id: string, status: Durum) =>
      patch(
        id,
        { status },
        `${t("uy.mesaj.durumGuncellendiOne")}${t(DURUM_ANAHTAR[status])}${t("uy.mesaj.durumGuncellendiIki")}`,
      ),
    [patch, t],
  );
  const ata = useCallback(
    (id: string, memberId: string | null) =>
      patch(id, { assignee: memberId }, memberId ? t("uy.mesaj.atandi") : t("uy.mesaj.atamaKaldirildi")),
    [patch, t],
  );
  const notEkle = useCallback((id: string, note: string) => patch(id, { note }, t("uy.mesaj.notEklendi")), [patch, t]);

  async function tumunuOku() {
    const yedek = alerts;
    setAlerts((p) => p.map((a) => ({ ...a, read: true })));
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error();
      goster({ tip: "basari", baslik: t("uy.mesaj.tumuOkundu") });
      router.refresh();
    } catch {
      setAlerts(yedek);
      goster({ tip: "hata", baslik: t("uy.mesaj.islemBasarisiz"), aciklama: t("uy.mesaj.tekrarDeneyin") });
    }
  }

  const okunmamis = alerts.filter((a) => !a.read).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        baslik={t("uy.baslik")}
        aciklama={t("uy.aciklama")}
        aksiyon={
          okunmamis > 0 ? (
            <Button variant="outline" size="sm" onClick={tumunuOku}>
              <CheckCheck className="size-4" /> {t("uy.tumunuOku")}
            </Button>
          ) : undefined
        }
      />

      {/* ---------- üst KPI şeridi (ferah, 5 metrik) ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiKart
          ikon={<Inbox className="size-[18px]" />}
          ton="brand"
          deger={ozet.acikSayi}
          etiket={t("uy.ozet.aktif")}
          delta={
            ozet.haftaDelta !== 0
              ? { yon: ozet.haftaDelta > 0 ? "up" : "down", metin: `${Math.abs(ozet.haftaDelta)}`, iyi: ozet.haftaDelta < 0, alt: t("uy.delta.gecenHafta") }
              : undefined
          }
          gecikme={0}
        />
        <KpiKart
          ikon={<Flame className="size-[18px]" />}
          ton="danger"
          deger={ozet.kritikSayi}
          etiket={t("uy.ozet.kritik")}
          altMetin={ozet.kritikSayi === 0 ? t("uy.delta.acikYok") : undefined}
          gecikme={40}
        />
        <KpiKart
          ikon={<Timer className="size-[18px]" />}
          ton="ok"
          deger={ozet.mttrMs > 0 ? sureFormat(ozet.mttrMs, t) : "—"}
          etiket={t("uy.ozet.mttr")}
          gecikme={80}
        />
        <KpiKart
          ikon={<CheckCircle2 className="size-[18px]" />}
          ton="brand"
          deger={ozet.bugunCozulen}
          etiket={t("uy.ozet.bugun")}
          gecikme={120}
        />
        <KpiKart
          ikon={<ShieldQuestion className="size-[18px]" />}
          ton={ozet.slaRisk > 0 ? "warn" : "slate"}
          deger={ozet.slaRisk}
          etiket={t("uy.ozet.sla")}
          altMetin={ozet.slaRisk > 0 ? t("uy.sla.olay") : t("uy.sla.saglikli")}
          gecikme={160}
        />
      </div>

      {/* ---------- grafik ızgarası (her bölüm farklı görsel dil) ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* çift-seri trend — geniş */}
        <Panel baslik={t("uy.panel.trend")} className="lg:col-span-7" sagUst={<TrendGrafikRozet t={t} />}>
          <TrendGrafik
            noktalar={[]}
            seriler={[trend.acilan, trend.cozulen]}
            renkler={["#dc2626", "#16a34a"]}
            seriEtiketleri={[t("uy.panel.seriAcilan"), t("uy.panel.seriCozulen")]}
            etiketler={trend.etiketler}
            yukseklik={168}
          />
        </Panel>

        {/* MTTR gauge — dar, farklı görsel dil */}
        <Panel baslik={t("uy.panel.mttr")} className="lg:col-span-5">
          <div className="flex flex-col items-center justify-center gap-1 py-1">
            <GaugeGost deger={mttrSkor} boyut={180} etiket={ozet.mttrMs > 0 ? sureFormat(ozet.mttrMs, t) : "—"} />
            <span className="text-[12px] text-slate-faint">{t("uy.panel.mttrHedef")}</span>
          </div>
        </Panel>

        {/* öncelik dağılımı donut */}
        <Panel baslik={t("uy.panel.oncelik")} className="lg:col-span-6">
          {priDagilim.length > 0 ? (
            <DonutDagilim segmentler={priDagilim} />
          ) : (
            <div className="grid h-[160px] place-items-center text-[13px] text-slate-faint">{t("uy.aktifOlayYok")}</div>
          )}
        </Panel>

        {/* kategori dağılımı donut */}
        <Panel baslik={t("uy.panel.kategoriler")} className="lg:col-span-6">
          {katDagilim.length > 0 ? (
            <DonutDagilim segmentler={katDagilim} />
          ) : (
            <div className="grid h-[160px] place-items-center text-[13px] text-slate-faint">{t("uy.aktifOlayYok")}</div>
          )}
        </Panel>
      </div>

      {alerts.length === 0 ? (
        /* Hiç olay yok → "her şey yolunda" kutlama durumu. */
        <BosDurum
          ikon={<ShieldCheck className="size-8" />}
          baslik={t("uy.bos.herseyBaslik")}
          aciklama={t("uy.bos.herseyAciklama")}
          aksiyon={<Button size="sm" variant="outline" href="/panel/trafik"><Activity className="size-4" /> {t("uy.bos.canliTrafik")}</Button>}
        />
      ) : (
      <>
      {/* ---------- filtre barı ---------- */}
      <Panel padding>
        <div className="flex flex-wrap items-center gap-1.5">
          {DURUM_SEKME.map((s) => {
            const aktifMi = durumFiltre === s.key;
            const sayi = sekmeSayac[s.key] ?? 0;
            return (
              <button
                key={s.key}
                onClick={() => setDurumFiltre(s.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                  aktifMi ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100",
                )}
              >
                {t(s.anahtar)}
                <span
                  className={cn(
                    "inline-grid min-w-[20px] place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    aktifMi ? "bg-white/20 text-white" : "bg-white text-slate-muted ring-1 ring-inset ring-line",
                  )}
                >
                  {sayi}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              aria-label={t("uy.filtre.ara")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("uy.filtre.araPlaceholder")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <select
            aria-label={t("uy.filtre.kategoriAra")}
            value={katFiltre}
            onChange={(e) => setKatFiltre(e.target.value as Alert["category"] | "all")}
            className="h-10 rounded-2xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-400"
          >
            <option value="all">{t("uy.filtre.tumKategoriler")}</option>
            {(Object.keys(KAT_ANAHTAR) as Alert["category"][]).map((k) => (
              <option key={k} value={k}>
                {t(KAT_ANAHTAR[k])}
              </option>
            ))}
          </select>
          <select
            aria-label={t("uy.filtre.oncelikAra")}
            value={priFiltre}
            onChange={(e) => setPriFiltre(e.target.value as Alert["priority"] | "all")}
            className="h-10 rounded-2xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-400"
          >
            <option value="all">{t("uy.filtre.tumOncelikler")}</option>
            {(["p1", "p2", "p3", "p4"] as Alert["priority"][]).map((p) => (
              <option key={p} value={p}>
                {PRI_ETIKET[p]}
              </option>
            ))}
          </select>
          {aktifFiltre && (
            <button
              onClick={() => {
                setQ("");
                setKatFiltre("all");
                setPriFiltre("all");
              }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-danger2 hover:bg-danger-soft"
            >
              <X className="size-3.5" /> {t("uy.filtre.temizle")}
            </button>
          )}
        </div>
      </Panel>

      <div className="text-[13px] text-slate-muted">
        {filtreli.length.toLocaleString("tr-TR")} {t("uy.filtre.olaySayisi")} {(aktifFiltre || durumFiltre !== "all") && t("uy.filtre.filtreli")}
      </div>

      {/* ---------- olay listesi ---------- */}
      {filtreli.length === 0 ? (
        <BosDurum
          ikon={<Check className="size-8" />}
          baslik={t("uy.bos.filtreBaslik")}
          aciklama={t("uy.bos.filtreAciklama")}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {filtreli.map((a, i) => (
            <OlaySatiri
              key={a.id}
              a={a}
              uye={a.assignee ? uyeMap.get(a.assignee) : undefined}
              ilk={i === 0}
              onTikla={() => setSeciliId(a.id)}
              t={t}
            />
          ))}
        </div>
      )}
      </>
      )}

      {/* ---------- detay drawer ---------- */}
      <AnimatePresence>
        {secili && (
          <OlayDrawer
            a={secili}
            uye={secili.assignee ? uyeMap.get(secili.assignee) : undefined}
            kampanya={secili.relatedCampaignId ? kampMap.get(secili.relatedCampaignId) : undefined}
            atanabilir={atanabilir}
            uyeMap={uyeMap}
            kapat={() => setSeciliId(null)}
            durumDegistir={(s) => durumDegistir(secili.id, s)}
            ata={(mid) => ata(secili.id, mid)}
            notEkle={(n) => notEkle(secili.id, n)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ KPI kart (ferah şerit) */

function KpiKart({
  ikon,
  ton,
  deger,
  etiket,
  delta,
  altMetin,
  gecikme = 0,
}: {
  ikon: React.ReactNode;
  ton: "brand" | "danger" | "ok" | "warn" | "slate";
  deger: string | number;
  etiket: string;
  delta?: { yon: "up" | "down"; metin: string; iyi: boolean; alt: string };
  altMetin?: string;
  gecikme?: number;
}) {
  const renk = {
    brand: "bg-brand-50 text-brand-600",
    danger: "bg-danger-soft text-danger2",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    slate: "bg-slate-100 text-slate-500",
  }[ton];
  const sayiRenk = {
    brand: "text-slate-ink",
    danger: "text-danger2",
    ok: "text-slate-ink",
    warn: "text-warn",
    slate: "text-slate-ink",
  }[ton];
  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: gecikme / 1000, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-line bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", renk)}>{ikon}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta.iyi ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger2",
            )}
          >
            {delta.yon === "up" ? "↑" : "↓"} {delta.metin}
          </span>
        )}
      </div>
      <div className={cn("mt-3.5 text-[30px] font-bold leading-none num", sayiRenk)}>{deger}</div>
      <div className="mt-1.5 text-[12.5px] text-slate-muted">{etiket}</div>
      {(altMetin || delta?.alt) && (
        <div className="mt-0.5 text-[11px] text-slate-faint">{altMetin ?? delta?.alt}</div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ trend legend rozeti */

function TrendGrafikRozet({ t }: { t: (k: string) => string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-slate-muted">
      <TrendingUp className="size-3.5 text-brand-600" /> {t("uy.panel.seriAcilan")} · {t("uy.panel.seriCozulen")}
    </span>
  );
}

/* ------------------------------------------------------------------ olay satırı */

function OlaySatiri({
  a,
  uye,
  ilk,
  onTikla,
  t,
}: {
  a: Alert;
  uye?: Uye;
  ilk: boolean;
  onTikla: () => void;
  t: (k: string) => string;
}) {
  const aktifMi = a.status === "acik" || a.status === "inceleniyor";
  // Öncelik-renkli sol şerit.
  const seritRenk = {
    p1: "bg-danger2",
    p2: "bg-warn",
    p3: "bg-brand-600",
    p4: "bg-slate-300",
  }[a.priority];
  return (
    <button
      onClick={onTikla}
      className={cn(
        "group relative flex w-full items-center gap-4 py-4 pl-5 pr-5 text-left transition hover:bg-canvas/60",
        !ilk && "border-t border-line",
        !a.read && "bg-brand-50/30",
      )}
    >
      {/* öncelik-renkli sol şerit */}
      <span className={cn("absolute left-0 top-0 h-full w-1", seritRenk)} />

      {/* kategori ikon rozeti */}
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
          KAT_ROZET[a.category],
        )}
      >
        {KAT_IKON[a.category]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* severity nabız noktası */}
          <span className="relative flex size-2 shrink-0">
            {(a.severity === "critical" || a.severity === "high") && aktifMi && (
              <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", SEV_NOKTA[a.severity])} />
            )}
            <span className={cn("relative inline-flex size-2 rounded-full", SEV_NOKTA[a.severity])} />
          </span>
          <span className={cn("truncate text-[14px] font-semibold text-slate-ink", !a.read && "font-bold")}>{a.title}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", PRI_TON[a.priority])}>
            {PRI_ETIKET[a.priority]}
          </span>
          <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 sm:inline-flex">
            {t(KAT_ANAHTAR[a.category])}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-slate-muted">{a.message}</p>
      </div>

      {/* atanan avatar */}
      <div className="hidden w-24 shrink-0 items-center justify-end sm:flex">
        {uye ? (
          <span className="flex items-center gap-1.5">
            <Avatar ad={uye.name} renk={uye.avatarColor} boyut={24} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-faint">
            <UserPlus className="size-3.5" /> {t("uy.satir.atanmadi")}
          </span>
        )}
      </div>

      {/* geçen süre */}
      <span className="hidden w-16 shrink-0 items-center justify-end gap-1 text-right text-[12px] text-slate-faint num md:flex">
        <Clock className="size-3.5" /> {yasHesap(a.ts, t)}
      </span>

      {/* durum rozeti */}
      <span className="shrink-0">
        <Badge ton={DURUM_TON[a.status]}>{t(DURUM_ANAHTAR[a.status])}</Badge>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ drawer */

function OlayDrawer({
  a,
  uye,
  kampanya,
  atanabilir,
  uyeMap,
  kapat,
  durumDegistir,
  ata,
  notEkle,
  t,
}: {
  a: Alert;
  uye?: Uye;
  kampanya?: Kampanya;
  atanabilir: Uye[];
  uyeMap: Map<string, Uye>;
  kapat: () => void;
  durumDegistir: (s: Durum) => void;
  ata: (memberId: string | null) => void;
  notEkle: (note: string) => void;
  t: (k: string) => string;
}) {
  useScrollKilit(true);
  const [not, setNot] = useState("");

  const tumDurumAksiyonlari: { durum: Durum; ad: string; ikon: React.ReactNode; ton: string }[] = [
    { durum: "inceleniyor", ad: t("uy.aksiyon.incelemeAl"), ikon: <PlayCircle className="size-4" />, ton: "hover:bg-warn-soft hover:text-amber-700" },
    { durum: "cozuldu", ad: t("uy.aksiyon.coz"), ikon: <CheckCircle2 className="size-4" />, ton: "hover:bg-ok-soft hover:text-ok" },
    { durum: "yoksayildi", ad: t("uy.aksiyon.yoksay"), ikon: <MinusCircle className="size-4" />, ton: "hover:bg-slate-100 hover:text-slate-700" },
    { durum: "acik", ad: t("uy.aksiyon.yenidenAc"), ikon: <Circle className="size-4" />, ton: "hover:bg-danger-soft hover:text-red-700" },
  ];
  const durumAksiyonlari = tumDurumAksiyonlari.filter((d) => d.durum !== a.status);

  // Onayla butonu ayrı (henüz onaylanmadıysa öne çıkar).
  const onaylanabilir = !a.acknowledgedAt && a.status === "acik";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={kapat}
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-lift"
      >
        {/* öncelik-renkli üst şerit */}
        <span
          className={cn(
            "h-1 w-full shrink-0",
            a.priority === "p1" ? "bg-danger2" : a.priority === "p2" ? "bg-warn" : a.priority === "p3" ? "bg-brand-600" : "bg-slate-300",
          )}
        />

        {/* başlık */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge ton={SEV_TON[a.severity]}>{t(SEV_ANAHTAR[a.severity])}</Badge>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", PRI_TON[a.priority])}>
                {PRI_ETIKET[a.priority]}
              </span>
              <Badge ton={DURUM_TON[a.status]}>{t(DURUM_ANAHTAR[a.status])}</Badge>
            </div>
            <h2 className="text-[17px] font-semibold leading-tight text-slate-ink">{a.title}</h2>
            <p className="mt-0.5 text-[12px] text-slate-faint">
              {new Date(a.ts).toLocaleString("tr-TR")} · {yasHesap(a.ts, t)}
            </p>
          </div>
          <button onClick={kapat} className="shrink-0 rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* açıklama */}
          <p className="text-[14px] leading-relaxed text-slate-ink">{a.message}</p>

          {/* durum aksiyonları */}
          <div className="mt-5">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("uy.drawer.durum")}</div>
            <div className="flex flex-wrap gap-2">
              {onaylanabilir && (
                <button
                  onClick={() => durumDegistir("inceleniyor")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[13px] font-medium text-brand-700 transition hover:bg-brand-100"
                >
                  <Check className="size-4" /> {t("uy.aksiyon.onayla")}
                </button>
              )}
              {durumAksiyonlari.map((d) => (
                <button
                  key={d.durum}
                  onClick={() => durumDegistir(d.durum)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-2 text-[13px] font-medium text-slate-ink transition",
                    d.ton,
                  )}
                >
                  {d.ikon} {d.ad}
                </button>
              ))}
            </div>
          </div>

          {/* meta ızgara */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetaKutu etiket={t("uy.drawer.kategori")} deger={<span className="flex items-center gap-1.5">{KAT_IKON[a.category]} {t(KAT_ANAHTAR[a.category])}</span>} />
            <MetaKutu etiket={t("uy.drawer.oncelik")} deger={PRI_ETIKET[a.priority]} />
            {a.acknowledgedAt && (
              <MetaKutu etiket={t("uy.drawer.onaylandi")} deger={<span className="num">{yasHesap(a.acknowledgedAt, t)}</span>} />
            )}
            {a.resolvedAt && (
              <MetaKutu
                etiket={t("uy.drawer.cozumSuresi")}
                deger={<span className="num text-ok">{sureFormat(a.resolvedAt - a.ts, t)}</span>}
              />
            )}
          </div>

          {/* atama */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
              <UserPlus className="size-3.5" /> {t("uy.drawer.atanan")}
            </div>
            <div className="flex items-center gap-3">
              {uye && <Avatar ad={uye.name} renk={uye.avatarColor} boyut={32} />}
              <select
                aria-label={t("uy.drawer.olayAta")}
                value={a.assignee ?? ""}
                onChange={(e) => ata(e.target.value || null)}
                className="h-10 flex-1 rounded-2xl border border-line-strong bg-surface px-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">{t("uy.drawer.atanmadi")}</option>
                {atanabilir.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* kaynak IP */}
          {a.sourceIp && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
                <MapPin className="size-3.5" /> {t("uy.drawer.kaynakIp")}
              </div>
              <Link
                href={`/panel/tehdit/${encodeURIComponent(a.sourceIp)}`}
                className="group flex items-center justify-between rounded-2xl border border-line bg-canvas/60 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="num text-[14px] font-semibold tracking-tight text-slate-ink">{a.sourceIp}</span>
                <span className="flex items-center gap-1 text-[12px] font-medium text-brand-600">
                  {t("uy.drawer.incele")} <ExternalLink className="size-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          )}

          {/* ilgili kampanya */}
          {kampanya && (
            <div className="mt-5">
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("uy.drawer.ilgiliKampanya")}</div>
              <Link
                href="/panel/kampanyalar"
                className="group flex items-center justify-between rounded-2xl border border-line bg-canvas/60 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="flex items-center gap-2 text-[14px] font-medium text-slate-ink">
                  <Crosshair className="size-4 text-danger2" /> {kampanya.name}
                </span>
                <ExternalLink className="size-3.5 text-brand-600 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}

          {/* önerilen aksiyonlar */}
          <div className="mt-5">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">{t("uy.drawer.onerilenAksiyonlar")}</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" href="/panel/kurallar">
                <ScrollText className="size-4" /> {t("uy.drawer.kuralOlustur")}
              </Button>
              {a.sourceIp && (
                <Button variant="outline" size="sm" href={`/panel/tehdit/${encodeURIComponent(a.sourceIp)}`}>
                  <ShieldAlert className="size-4" /> {t("uy.drawer.ipEngelle")}
                </Button>
              )}
            </div>
          </div>

          {/* not ekleme */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
              <MessageSquarePlus className="size-3.5" /> {t("uy.drawer.notEkle")}
            </div>
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              placeholder={t("uy.drawer.notPlaceholder")}
              rows={3}
              className="w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="accent"
                size="sm"
                disabled={!not.trim()}
                onClick={() => {
                  notEkle(not.trim());
                  setNot("");
                }}
              >
                <Plus className="size-4" /> {t("uy.drawer.notEkle")}
              </Button>
            </div>
          </div>

          {/* zaman çizelgesi */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
              <Clock className="size-3.5" /> {t("uy.drawer.zamanCizelgesi")}
            </div>
            <ZamanCizelgesi timeline={[...a.timeline].sort((x, y) => y.ts - x.ts)} uyeMap={uyeMap} t={t} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ meta kutu */

function MetaKutu({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/50 px-4 py-3">
      <div className="text-[11px] font-medium text-slate-faint">{etiket}</div>
      <div className="mt-1 text-[14px] font-semibold text-slate-ink">{deger}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ zaman çizelgesi */

function eylemEtiket(action: string, t: (k: string) => string): { ad: string; renk: string } {
  if (action.startsWith("durum:")) {
    // `action` içindeki durum enum değeri veri; sadece görünen etiket çevrilir.
    const d = action.slice(6) as Durum;
    const ad = DURUM_ANAHTAR[d] ? t(DURUM_ANAHTAR[d]) : action;
    const renk =
      d === "cozuldu" ? "bg-ok" : d === "yoksayildi" ? "bg-slate-400" : d === "inceleniyor" ? "bg-warn" : "bg-danger2";
    return { ad: `${t("uy.tl.durumOk")}${ad}`, renk };
  }
  // Anahtarlar (action) veri; yalnızca `ad` (görünen metin) çevrilir.
  const map: Record<string, { ad: string; renk: string }> = {
    "oluşturuldu": { ad: t("uy.tl.olayAcildi"), renk: "bg-danger2" },
    "onayladı": { ad: t("uy.tl.onaylandi"), renk: "bg-brand-600" },
    "atandı": { ad: t("uy.tl.atandi"), renk: "bg-brand-600" },
    "atama-kaldırıldı": { ad: t("uy.tl.atamaKaldirildi"), renk: "bg-slate-400" },
    "not": { ad: t("uy.tl.not"), renk: "bg-violet-500" },
  };
  return map[action] ?? { ad: action, renk: "bg-slate-400" };
}

function ZamanCizelgesi({ timeline, uyeMap, t }: { timeline: TimelineEntry[]; uyeMap: Map<string, Uye>; t: (k: string) => string }) {
  if (!timeline.length) {
    return <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-slate-faint">{t("uy.drawer.kayitYok")}</div>;
  }
  return (
    <ol className="relative space-y-4 pl-6">
      {/* dikey çizgi */}
      <span className="absolute left-[6px] top-1.5 bottom-1.5 w-px bg-line" />
      {timeline.map((e, i) => {
        const { ad, renk } = eylemEtiket(e.action, t);
        // aktör bir üye adı olabilir; renk için eşleştir.
        const uye = [...uyeMap.values()].find((m) => m.name === e.actor);
        return (
          <li key={i} className="relative">
            <span
              className={cn("absolute -left-6 top-1 grid size-3 place-items-center rounded-full ring-4 ring-white", renk)}
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-semibold text-slate-ink">{ad}</span>
              <span className="text-[12px] text-slate-muted">
                · {uye ? uye.name : e.actor} · <span className="num text-slate-faint">{yasHesap(e.ts, t)}</span>
              </span>
            </div>
            {e.note && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-muted">{e.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
