"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot, ShieldCheck, GraduationCap, Search, X, ExternalLink, CircleCheck,
  ShieldAlert, Ban, TriangleAlert, Fingerprint, Activity, Flame, Radar as RadarIkon,
  CheckCircle2, SlashSquare, Copy, Download, FileCode2, Info,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast, useScrollKilit } from "@/components/panel/kit";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { AiKategori, AiPolitika } from "@/lib/specter/ai-agents";
import { aiRobotsUret, aiPolitikaOzet } from "@/lib/specter/ai-agents";
import type { Dil } from "@/lib/i18n/panel";
import { aiajanlarCeviri } from "./aiajanlar.i18n";
import { DonutDagilim, TrendGrafik, MiniSpark } from "@/components/panel/grafikler";
import { IsiMatris, Gauge as GaugeGost } from "@/components/panel/grafikler-ek";

/** t yardımcı tipi — alt bileşenlere prop olarak geçirilir. */
type Ceviri = (anahtar: string) => string;

/* Enum→anahtar eşlemeleri: enum DEĞERİ (API/filtre) çevrilmez, sadece
 * görüntü etiketi t() ile çözülür. Böylece mantık dokunulmadan kalır. */
const KATEGORI_ANAHTAR: Record<AiKategori, string> = {
  model_egitimi: "ai.kat.model_egitimi",
  canli_getirme: "ai.kat.canli_getirme",
  arama_indeksi: "ai.kat.arama_indeksi",
  ajan_tarayici: "ai.kat.ajan_tarayici",
  veri_kaziyici: "ai.kat.veri_kaziyici",
};
const POLITIKA_ANAHTAR: Record<AiPolitika, string> = {
  izin: "ai.pol.izin",
  dogrula: "ai.pol.dogrula",
  engelle: "ai.pol.engelle",
};
const POLITIKA_TAM_ANAHTAR: Record<AiPolitika, string> = {
  izin: "ai.polTam.izin",
  dogrula: "ai.polTam.dogrula",
  engelle: "ai.polTam.engelle",
};
const RISK_ANAHTAR: Record<string, string> = {
  dusuk: "ai.risk.dusuk",
  orta: "ai.risk.orta",
  yuksek: "ai.risk.yuksek",
  kritik: "ai.risk.kritik",
};

interface AjanVeri {
  id: string; operator: string; urun: string; ua: string; kategori: AiKategori;
  amac: string; robotsToken: string; dogrulama: string; ipYayin?: string;
  saygiRobots: boolean; risk: "dusuk" | "orta" | "yuksek" | "kritik";
  onerilenPolitika: AiPolitika; aciklama: string; logo: string; ilk: string;
  istat: { toplam: number; son7: number; engellenen: number; dogrulanan: number; izin: number; sonGorulme: number | null; enYol: string | null };
  politika: string;
}

/* Filtre kategorileri — key enum DEĞERİ (filtre mantığı), etiket anahtarı t() ile çözülür. */
const KATEGORILER: { key: AiKategori | "hepsi"; anahtar: string }[] = [
  { key: "hepsi", anahtar: "ai.kat.hepsi" },
  { key: "model_egitimi", anahtar: "ai.kat.model_egitimi" },
  { key: "canli_getirme", anahtar: "ai.kat.canli_getirme" },
  { key: "arama_indeksi", anahtar: "ai.kat.arama_indeksi" },
  { key: "ajan_tarayici", anahtar: "ai.kat.ajan_tarayici" },
  { key: "veri_kaziyici", anahtar: "ai.kat.veri_kaziyici" },
];

const RISK_TON: Record<string, "gri" | "sari" | "kirmizi"> = {
  dusuk: "gri", orta: "sari", yuksek: "kirmizi", kritik: "kirmizi",
};

/* Görsel türetme için salt-okunur eşlemeler (mantık/filtre DEĞİL, sunum). */
const RISK_SKOR: Record<string, number> = { dusuk: 25, orta: 55, yuksek: 80, kritik: 96 };
const KATEGORI_RENK: Record<AiKategori, string> = {
  model_egitimi: "#dc2626",
  canli_getirme: "#2f6fed",
  arama_indeksi: "#16a34a",
  ajan_tarayici: "#7c3aed",
  veri_kaziyici: "#d97706",
};

function yasMetni(ts: number | null, t: Ceviri): string {
  if (!ts) return t("ai.yas.gorulmedi");
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 60) return t("ai.yas.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("ai.yas.sa").replace("{n}", String(sa));
  return t("ai.yas.g").replace("{n}", String(Math.floor(sa / 24)));
}

export function AiAjanlarIstemci({
  veri,
  ozet,
  dil,
}: {
  veri: AjanVeri[];
  ozet: { aiToplam: number; aktifSayi: number; engellenenToplam: number; egitimTrafik: number; toplamKatalog: number };
  dil: Dil;
}) {
  const t = (anahtar: string) => aiajanlarCeviri(anahtar, dil);
  const { goster } = useToast();
  const [kat, setKat] = useState<AiKategori | "hepsi">("hepsi");
  const [q, setQ] = useState("");
  const [secili, setSecili] = useState<AjanVeri | null>(null);
  const [politikalar, setPolitikalar] = useState<Record<string, string>>(
    Object.fromEntries(veri.map((v) => [v.id, v.politika])),
  );

  const filtreli = useMemo(() => {
    return veri.filter((v) => {
      if (kat !== "hepsi" && v.kategori !== kat) return false;
      if (q) {
        const alt = q.toLocaleLowerCase("tr");
        if (!v.urun.toLowerCase().includes(alt) && !v.operator.toLowerCase().includes(alt)) return false;
      }
      return true;
    }).sort((a, b) => b.istat.toplam - a.istat.toplam);
  }, [veri, kat, q]);

  const varTrafik = ozet.aiToplam > 0;

  /* AYRIŞTIRICI ÖZELLİK: panel kararlarından CANLI robots.txt üretimi.
   * Politika değiştikçe anında güncellenir; kopyalanıp siteye konur.
   * robots.txt naziktir — Veylify uymayan AI'ları ayrıca AKTİF engeller. */
  const robotsTxt = useMemo(() => aiRobotsUret(politikalar), [politikalar]);
  const polOzet = useMemo(() => aiPolitikaOzet(politikalar), [politikalar]);
  const robotsKopyala = () => {
    navigator.clipboard.writeText(robotsTxt).then(
      () => goster({ tip: "basari", baslik: t("ai.robots.kopyalandi") }),
      () => goster({ tip: "hata", baslik: t("ai.robots.kopyaHata") }),
    );
  };
  const robotsIndir = () => {
    const blob = new Blob([robotsTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("ai.robots.indirildi") });
  };

  /* Kategoriye göre trafik dağılımı (donut). Sunum türevi; veri değişmez. */
  const dagilim = useMemo(() => {
    const toplamlar: Record<AiKategori, number> = {
      model_egitimi: 0, canli_getirme: 0, arama_indeksi: 0, ajan_tarayici: 0, veri_kaziyici: 0,
    };
    for (const v of veri) toplamlar[v.kategori] += v.istat.toplam;
    return (Object.keys(toplamlar) as AiKategori[])
      .map((k) => ({ etiket: t(KATEGORI_ANAHTAR[k]), deger: toplamlar[k], renk: KATEGORI_RENK[k] }))
      .filter((s) => s.deger > 0)
      .sort((a, b) => b.deger - a.deger);
  }, [veri, dil]);

  /* En yoğun 6 ajan → ısı matris (trafik / engel / risk skoru). */
  const yogunlar = useMemo(
    () => [...veri].filter((v) => v.istat.toplam > 0).sort((a, b) => b.istat.toplam - a.istat.toplam).slice(0, 6),
    [veri],
  );
  const isiMatris = useMemo(() => {
    const maxTraf = Math.max(1, ...yogunlar.map((v) => v.istat.toplam));
    const maxEng = Math.max(1, ...yogunlar.map((v) => v.istat.engellenen));
    const satirlar = yogunlar.map((v) => v.urun);
    const degerler = yogunlar.map((v) => [
      Math.round((v.istat.toplam / maxTraf) * 100),
      Math.round((v.istat.engellenen / maxEng) * 100),
      RISK_SKOR[v.risk] ?? 40,
    ]);
    return { satirlar, degerler };
  }, [yogunlar]);

  /* En agresif 3 crawler. */
  const agresif = useMemo(
    () => [...veri].sort((a, b) => b.istat.toplam - a.istat.toplam).filter((v) => v.istat.toplam > 0).slice(0, 3),
    [veri],
  );

  /* AI trafiği zaman serisi — 14g eğitim vs canlı/arama. Tohum: gerçek toplamlar. */
  const seriler = useMemo(() => {
    const egitimTop = veri.filter((v) => v.kategori === "model_egitimi").reduce((s, v) => s + v.istat.toplam, 0);
    const getirmeTop = veri.filter((v) => v.kategori !== "model_egitimi").reduce((s, v) => s + v.istat.toplam, 0);
    const gunler = 14;
    const uret = (toplam: number, faz: number) => {
      const taban = toplam / gunler;
      return Array.from({ length: gunler }, (_, i) =>
        Math.max(0, Math.round(taban * (0.55 + 0.9 * (0.5 + 0.5 * Math.sin(i * 0.7 + faz))))),
      );
    };
    return { egitim: uret(egitimTop, 0), getirme: uret(getirmeTop, 1.6) };
  }, [veri]);

  /* KPI deltaları (son7 → 30g pencere kıyası, salt sunum). */
  const kpiDelta = useMemo(() => {
    const son7 = veri.reduce((s, v) => s + v.istat.son7, 0);
    const onceki = Math.max(0, ozet.aiToplam - son7);
    const oran = onceki > 0 ? Math.round(((son7 - onceki / 3) / (onceki / 3)) * 100) : 0;
    const engelOran = ozet.aiToplam > 0 ? Math.round((ozet.engellenenToplam / ozet.aiToplam) * 100) : 0;
    return { trafikUp: oran >= 0, trafikVal: `%${Math.abs(oran)}`, engelOran: `%${engelOran}` };
  }, [veri, ozet]);

  async function politikaAyarla(ajan: AjanVeri, yeni: string) {
    setPolitikalar((p) => ({ ...p, [ajan.id]: yeni }));
    const res = await fetch("/api/ai-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: ajan.id, policy: yeni }),
    });
    if (res.ok) {
      goster({ tip: "basari", baslik: `${ajan.urun} → ${t(POLITIKA_TAM_ANAHTAR[yeni as AiPolitika])}` });
    } else {
      setPolitikalar((p) => ({ ...p, [ajan.id]: ajan.politika }));
      goster({ tip: "hata", baslik: t("ai.toast.kaydedilemedi") });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Bot className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ai.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("ai.serit.aciklama")}
          </p>
        </div>
      </div>

      {/* özet KPI — ferah şerit, delta rozetli */}
      <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ozet.aiToplam.toLocaleString("tr-TR")}
          etiket={t("ai.kpi.istek")}
          ikon={<Bot className="size-5" />}
          tone="brand"
          delta={varTrafik ? { value: kpiDelta.trafikVal, up: kpiDelta.trafikUp, good: false } : undefined}
        />
        <StatKart
          sayi={`${ozet.aktifSayi} / ${ozet.toplamKatalog}`}
          etiket={t("ai.kpi.tespit")}
          ikon={<Fingerprint className="size-5" />}
        />
        <StatKart
          sayi={ozet.engellenenToplam.toLocaleString("tr-TR")}
          etiket={t("ai.kpi.engellenen")}
          ikon={<Ban className="size-5" />}
          tone="danger"
          delta={varTrafik ? { value: kpiDelta.engelOran, up: true, good: true } : undefined}
        />
        <StatKart
          sayi={ozet.egitimTrafik.toLocaleString("tr-TR")}
          etiket={t("ai.kpi.egitim")}
          ikon={<GraduationCap className="size-5" />}
          tone="warn"
        />
      </motion.div>

      {/* Görsel istihbarat kuşağı: kategori dağılımı + ajan×risk ısı haritası */}
      {varTrafik && (
        <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="grid gap-4 lg:grid-cols-2">
          {/* Kategori dağılımı DONUT */}
          <Panel baslik={t("ai.dagilim.baslik")} sagUst={<GraduationCap className="size-4 text-brand-600" />}>
            <p className="-mt-1 mb-4 text-[12.5px] text-slate-muted">{t("ai.dagilim.aciklama")}</p>
            {dagilim.length > 0 ? (
              <DonutDagilim segmentler={dagilim} />
            ) : (
              <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-line text-[12px] text-slate-faint">{t("ai.dagilim.bosluk")}</div>
            )}
          </Panel>

          {/* Ajan × risk ISI MATRİS */}
          <Panel baslik={t("ai.risk.baslikBolum")} sagUst={<RadarIkon className="size-4 text-brand-600" />}>
            <p className="-mt-1 mb-4 text-[12.5px] text-slate-muted">{t("ai.risk.aciklamaBolum")}</p>
            {isiMatris.satirlar.length > 0 ? (
              <IsiMatris
                satirlar={isiMatris.satirlar}
                sutunlar={[t("ai.risk.sutunTrafik"), t("ai.risk.sutunEngel"), t("ai.risk.sutunRisk")]}
                degerler={isiMatris.degerler}
              />
            ) : (
              <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-line text-[12px] text-slate-faint">{t("ai.risk.bosluk")}</div>
            )}
          </Panel>
        </motion.div>
      )}

      {/* AYRIŞTIRICI: politikadan CANLI robots.txt üretimi (rakiplerde yok) */}
      <motion.div initial={{ y: 10 }} animate={{ y: 0 }}>
        <Panel
          baslik={t("ai.robots.baslik")}
          sagUst={
            <div className="flex items-center gap-2">
              <button
                onClick={robotsKopyala}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-slate-ink transition hover:border-line-strong"
              >
                <Copy className="size-3.5" /> {t("ai.robots.kopyala")}
              </button>
              <button
                onClick={robotsIndir}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-700"
              >
                <Download className="size-3.5" /> robots.txt
              </button>
            </div>
          }
        >
          <p className="-mt-1 mb-3 text-[12.5px] text-slate-muted">{t("ai.robots.aciklama")}</p>
          <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 font-medium text-ok">
              <span className="size-1.5 rounded-full bg-ok" /> {polOzet.izin} {t("ai.robots.ozetIzin")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 font-medium text-warn">
              <span className="size-1.5 rounded-full bg-warn" /> {polOzet.dogrula} {t("ai.robots.ozetDogrula")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 font-medium text-danger2">
              <span className="size-1.5 rounded-full bg-danger2" /> {polOzet.engelle} {t("ai.robots.ozetEngelle")}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line-strong bg-ink-950">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
              <FileCode2 className="size-3.5 text-slate-400" />
              <span className="text-[12px] font-medium text-slate-300">/robots.txt</span>
              <span className="ml-auto text-[11px] text-slate-500">{t("ai.robots.canli")}</span>
            </div>
            <pre className="max-h-72 overflow-auto px-4 py-3.5 text-[12px] leading-relaxed">
              <code className="font-mono whitespace-pre text-[#c7d5e2]">{robotsTxt}</code>
            </pre>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-slate-faint">
            <Info className="mt-0.5 size-3.5 shrink-0" /> {t("ai.robots.not")}
          </p>
        </Panel>
      </motion.div>

      {/* AI trafiği zaman serisi (çoklu seri) */}
      {varTrafik && (
        <motion.div initial={{ y: 10 }} animate={{ y: 0 }}>
          <Panel baslik={t("ai.seri.baslik")} sagUst={<Activity className="size-4 text-brand-600" />}>
            <p className="-mt-1 mb-2 text-[12.5px] text-slate-muted">{t("ai.seri.aciklama")}</p>
            <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-full" style={{ background: "#dc2626" }} /> {t("ai.seri.egitim")}</span>
              <span className="flex items-center gap-1.5 text-slate-muted"><span className="size-2.5 rounded-full" style={{ background: "#2f6fed" }} /> {t("ai.seri.getirme")}</span>
            </div>
            <TrendGrafik
              noktalar={seriler.egitim}
              seriler={[seriler.egitim, seriler.getirme]}
              renkler={["#dc2626", "#2f6fed"]}
              seriEtiketleri={[t("ai.seri.egitim"), t("ai.seri.getirme")]}
              yukseklik={200}
            />
          </Panel>
        </motion.div>
      )}

      {/* En agresif 3 crawler — öne çıkan kart */}
      {varTrafik && agresif.length > 0 && (
        <motion.div initial={{ y: 10 }} animate={{ y: 0 }}>
          <div className="rounded-3xl border border-danger-soft bg-gradient-to-br from-danger-soft/50 via-surface to-surface p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-2xl bg-danger-soft text-danger2"><Flame className="size-4.5" /></span>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-ink">{t("ai.agresif.baslik")}</h3>
                <p className="text-[12.5px] text-slate-muted">{t("ai.agresif.aciklama")}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {agresif.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setSecili(a)}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
                >
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl text-[15px] font-bold text-white" style={{ background: a.logo }}>
                    {a.urun.charAt(0)}
                    <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-danger2 text-[10px] font-bold text-white">{i + 1}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-slate-ink">{a.urun}</div>
                    <div className="num text-[12px] text-slate-muted">
                      <b className="text-danger2">{a.istat.toplam.toLocaleString("tr-TR")}</b> {t("ai.agresif.istek")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Henüz AI trafiği görülmedi → açıklayıcı bilgilendirme (katalog yine gösterilir). */}
      {ozet.aiToplam === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Fingerprint className="size-5" /></span>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-ink">{t("ai.bos.baslik")}</h3>
              <p className="mt-0.5 max-w-lg text-[13px] text-slate-muted">{t("ai.bos.aciklama")}</p>
            </div>
          </div>
          <Link href="/panel/gelistirici" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-ink-800">
            {t("ai.bos.entegre")} <ExternalLink className="size-3.5" />
          </Link>
        </div>
      )}

      {/* filtre barı */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("ai.filtre.araEtiket")} placeholder={t("ai.filtre.araYer")} className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KATEGORILER.map((k) => (
            <button key={k.key} onClick={() => setKat(k.key)} className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition", kat === k.key ? "bg-brand-600 text-white" : "bg-canvas text-slate-muted hover:bg-slate-100")}>
              {t(k.anahtar)}
            </button>
          ))}
        </div>
      </div>

      {/* ajan kartları */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtreli.map((a) => (
          <AjanKart key={a.id} a={a} politika={politikalar[a.id]} onPolitika={(p) => politikaAyarla(a, p)} onAc={() => setSecili(a)} t={t} />
        ))}
        {filtreli.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-sm text-slate-muted">
            {t("ai.filtre.eslesmeYok")}
          </div>
        )}
      </div>

      <AnimatePresence>
        {secili && (
          <AjanDrawer
            a={secili}
            politika={politikalar[secili.id]}
            onPolitika={(p) => politikaAyarla(secili, p)}
            kapat={() => setSecili(null)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PolitikaSecici({ deger, onChange, kompakt, t }: { deger: string; onChange: (p: string) => void; kompakt?: boolean; t: Ceviri }) {
  // key = enum DEĞERİ (API'ye gider), etiket t() ile çözülür.
  const secenekler: { key: AiPolitika; ikon: React.ReactNode; renk: string }[] = [
    { key: "izin", ikon: <CircleCheck className="size-3.5" />, renk: "text-ok data-[on=true]:bg-ok-soft data-[on=true]:text-ok" },
    { key: "dogrula", ikon: <ShieldAlert className="size-3.5" />, renk: "text-warn data-[on=true]:bg-warn-soft data-[on=true]:text-amber-700" },
    { key: "engelle", ikon: <Ban className="size-3.5" />, renk: "text-danger2 data-[on=true]:bg-danger-soft data-[on=true]:text-danger2" },
  ];
  return (
    <div className={cn("inline-flex rounded-xl border border-line bg-canvas p-0.5", kompakt && "scale-95")}>
      {secenekler.map((s) => {
        const on = deger === s.key;
        return (
          <button
            key={s.key}
            data-on={on}
            onClick={(e) => { e.stopPropagation(); onChange(s.key); }}
            className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition", on ? s.renk : "text-slate-faint hover:text-slate-muted")}
          >
            {s.ikon} {t(POLITIKA_ANAHTAR[s.key])}
          </button>
        );
      })}
    </div>
  );
}

function AjanKart({ a, politika, onPolitika, onAc, t }: { a: AjanVeri; politika: string; onPolitika: (p: string) => void; onAc: () => void; t: Ceviri }) {
  const riskSkor = RISK_SKOR[a.risk] ?? 40;
  return (
    <div onClick={onAc} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAc(); } }} role="button" tabIndex={0} aria-label={t("ai.kart.detayEtiket").replace("{urun}", a.urun)} className="group cursor-pointer overflow-hidden rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* marka-renkli baş-harf rozeti */}
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-[17px] font-bold text-white shadow-sm" style={{ background: a.logo }}>
            {a.urun.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-slate-ink">{a.urun}</span>
              {!a.saygiRobots && <TriangleAlert className="size-3.5 shrink-0 text-warn" aria-label={t("ai.kart.robotsUyari")} />}
            </div>
            <div className="truncate text-[12.5px] text-slate-muted">{a.operator} · {t(KATEGORI_ANAHTAR[a.kategori])}</div>
          </div>
        </div>
        <Badge ton={RISK_TON[a.risk]}>{t(RISK_ANAHTAR[a.risk])} {t("ai.risk.sonEk")}</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-muted">{a.amac}</p>

      {/* risk skoru gauge + 7g trend spark yan yana */}
      <div className="mt-4 flex items-stretch gap-3">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-canvas/70 px-3 py-2">
          <GaugeGost deger={riskSkor} etiket={t("ai.kart.riskSkor")} boyut={104} renk={riskSkor >= 80 ? "#dc2626" : riskSkor >= 50 ? "#d97706" : "#16a34a"} />
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-2xl bg-canvas/70 px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-faint">
            <span>{t("ai.kart.trend7")}</span>
            <span className="num font-semibold text-slate-ink">{a.istat.son7.toLocaleString("tr-TR")}</span>
          </div>
          <MiniSpark tohum={`${a.id}-7g-${a.istat.son7}`} renk={a.istat.engellenen > 0 ? "#dc2626" : "#2f6fed"} yukseklik={34} />
          {/* robots-saygı göstergesi */}
          <div className={cn("mt-2 flex items-center gap-1.5 text-[11px] font-medium", a.saygiRobots ? "text-ok" : "text-warn")}>
            {a.saygiRobots ? <CheckCircle2 className="size-3.5" /> : <SlashSquare className="size-3.5" />}
            {a.saygiRobots ? t("ai.kart.robotsSaygili") : t("ai.kart.robotsSaymaz")}
          </div>
        </div>
      </div>

      {/* trafik istatistiği */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-canvas/70 p-3">
        <MiniStat etiket={t("ai.kart.30gIstek")} deger={a.istat.toplam.toLocaleString("tr-TR")} />
        <MiniStat etiket={t("ai.kart.engellenen")} deger={a.istat.engellenen.toLocaleString("tr-TR")} vurgu={a.istat.engellenen > 0 ? "danger" : undefined} />
        <MiniStat etiket={t("ai.kart.sonGorulme")} deger={yasMetni(a.istat.sonGorulme, t)} />
      </div>

      {/* stopPropagation: kart tıklamasının politika butonlarına yayılmasını engeller (etkileşim değil) */}
      <div className="mt-4 flex items-center justify-between" role="presentation" onClick={(e) => e.stopPropagation()}>
        <span className="text-[12px] font-medium text-slate-faint">{t("ai.kart.politika")}</span>
        <PolitikaSecici deger={politika} onChange={onPolitika} t={t} />
      </div>
    </div>
  );
}

function MiniStat({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: "danger" }) {
  return (
    <div>
      <div className={cn("num text-[15px] font-bold leading-none", vurgu === "danger" ? "text-danger2" : "text-slate-ink")}>{deger}</div>
      <div className="mt-1 text-[11px] text-slate-faint">{etiket}</div>
    </div>
  );
}

function AjanDrawer({ a, politika, onPolitika, kapat, t }: { a: AjanVeri; politika: string; onPolitika: (p: string) => void; kapat: () => void; t: Ceviri }) {
  useScrollKilit(true);
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-lift"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-bold text-white shadow-sm" style={{ background: a.logo }}>{a.urun.charAt(0)}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-ink">{a.urun}</h2>
              <p className="text-[13px] text-slate-muted">{a.operator} · {t(KATEGORI_ANAHTAR[a.kategori])}</p>
            </div>
          </div>
          <button onClick={kapat} aria-label={t("ai.drawer.kapat")} className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"><X className="size-5" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* politika kontrolü + risk gauge */}
          <div className="rounded-2xl border border-line bg-canvas/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-ink">{t("ai.drawer.korumaPolitikasi")}</span>
                <div className="mt-1"><Badge ton={RISK_TON[a.risk]}>{t(RISK_ANAHTAR[a.risk])} {t("ai.risk.sonEk")}</Badge></div>
              </div>
              <div className="shrink-0">
                <GaugeGost
                  deger={RISK_SKOR[a.risk] ?? 40}
                  etiket={t("ai.kart.riskSkor")}
                  boyut={112}
                  renk={(RISK_SKOR[a.risk] ?? 40) >= 80 ? "#dc2626" : (RISK_SKOR[a.risk] ?? 40) >= 50 ? "#d97706" : "#16a34a"}
                />
              </div>
            </div>
            <PolitikaSecici deger={politika} onChange={onPolitika} t={t} />
            <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
              <span>{t("ai.drawer.oneriOn")} <b className="text-slate-ink">{t(POLITIKA_TAM_ANAHTAR[a.onerilenPolitika])}</b>. {a.aciklama}</span>
            </p>
          </div>

          {/* trafik */}
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Activity className="size-4 text-brand-600" /> {t("ai.drawer.trafik")}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <BilgiKutu etiket={t("ai.drawer.toplamIstek")} deger={a.istat.toplam.toLocaleString("tr-TR")} />
              <BilgiKutu etiket={t("ai.drawer.son7")} deger={a.istat.son7.toLocaleString("tr-TR")} />
              <BilgiKutu etiket={t("ai.drawer.engellenen")} deger={a.istat.engellenen.toLocaleString("tr-TR")} ton="danger" />
              <BilgiKutu etiket={t("ai.drawer.dogrulanan")} deger={a.istat.dogrulanan.toLocaleString("tr-TR")} ton="warn" />
            </div>
            {a.istat.enYol && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-[13px]">
                <span className="text-slate-muted">{t("ai.drawer.enYol")}</span>
                <span className="num font-medium text-slate-ink">{a.istat.enYol}</span>
              </div>
            )}
          </div>

          {/* teknik istihbarat */}
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink"><Fingerprint className="size-4 text-brand-600" /> {t("ai.drawer.imzaDogrulama")}</h3>
            <div className="space-y-2">
              <SatirBilgi etiket={t("ai.drawer.userAgent")} deger={a.ua} mono />
              <SatirBilgi etiket={t("ai.drawer.robotsToken")} deger={a.robotsToken} mono />
              <SatirBilgi etiket={t("ai.drawer.kimlikDogrulama")} deger={a.dogrulama === "ip_aralik" ? t("ai.drawer.dogRolIp") : a.dogrulama === "reverse_dns" ? t("ai.drawer.dogRolDns") : t("ai.drawer.dogRolYok")} />
              <SatirBilgi etiket={t("ai.drawer.robotsSaygi")} deger={a.saygiRobots ? t("ai.drawer.robotsEvet") : t("ai.drawer.robotsHayir")} vurgu={!a.saygiRobots ? "danger" : undefined} />
              <SatirBilgi etiket={t("ai.drawer.ilkGorulme")} deger={a.ilk} />
            </div>
            {a.ipYayin && (
              <a href={a.ipYayin} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                {t("ai.drawer.ipYayin")} <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>

          {/* aksiyon */}
          <Link href={`/panel/kurallar`} className="flex items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-800">
            <ShieldAlert className="size-4" /> {t("ai.drawer.kuralAc")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function BilgiKutu({ etiket, deger, ton }: { etiket: string; deger: string; ton?: "danger" | "warn" }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className={cn("num text-lg font-bold leading-none", ton === "danger" ? "text-danger2" : ton === "warn" ? "text-warn" : "text-slate-ink")}>{deger}</div>
      <div className="mt-1 text-[11px] text-slate-faint">{etiket}</div>
    </div>
  );
}

function SatirBilgi({ etiket, deger, mono, vurgu }: { etiket: string; deger: string; mono?: boolean; vurgu?: "danger" }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="shrink-0 text-[13px] text-slate-muted">{etiket}</span>
      <span className={cn("text-right text-[13px] font-medium", mono && "font-mono text-[11.5px] tracking-tight", vurgu === "danger" ? "text-danger2" : "text-slate-ink")}>{deger}</span>
    </div>
  );
}
