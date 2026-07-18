"use client";

/**
 * Komuta Merkezi — SOC Savaş Odası Konsolu (istemci)
 * ===================================================
 * Aktif saldırı anında operatörün TEK EKRANDAN tehdit fotoğrafını izleyip
 * anlık savunma aksiyonu aldığı "war room". Dört bölge:
 *   1) Tehdit durum panosu (üst)   — canlı sayaçlar + DEFCON savunma seviyesi
 *   2) Canlı saldırı akışı (orta)  — gelen istekler + satır-içi anlık aksiyon
 *   3) Komuta paneli (yan)         — duruş, batch aksiyonlar, olay aç
 *   4) Top saldırganlar (yan)      — canlı-sıralı ASN/ülke/IP + tek-tık engelle
 *   5) Olay günlüğü (alt)          — operatörün bu oturumda kurduğu aksiyon kuyruğu
 *
 * DÜRÜSTLÜK NOTU
 * ==============
 * - Tehdit FOTOĞRAFI gerçek olaylardan hesaplanır (sunucuda anlik.ts).
 * - Canlı "akış" bu GERÇEK olayların interval ile yeniden oynatılmasıdır
 *   (trafik/canli-konsol deseni) — uydurma trafik yok.
 * - Operatör AKSIYONLARI bu oturuma özeldir: yerel kuyruğa (localStorage
 *   `specter.komuta.v1`) yazılır ve sayaçları iyimser günceller. Üretimdeki
 *   canlı kurallara "Uygula" ile senkronlanacak niyet kuyruğu olarak açıkça
 *   etiketlenir — henüz production kuralları DEĞİŞTİRMEZ.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, ShieldAlert, Ban, Globe, Server, Activity, Zap, Gauge, Siren,
  ShieldHalf, Lock, ShieldCheck, Plus, Trash2, X, Cpu, Crosshair,
  Play, Pause, ListChecks, AlertTriangle, ChevronRight, Layers,
} from "lucide-react";
import { Ulke } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Histogram, RadarGrafik } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kmCeviri } from "./komuta-merkezi.i18n";
import { botSinifGorsel } from "@/components/panel/bot-sinif-gorsel";
import type { TehditFoto, SaldirganSatir, Senaryo } from "./anlik";

/** Çeviri yardımcısı tipi — alt bileşenlere geçirilir. */
type CevirFn = (anahtar: string) => string;

/* ------------------------------------------------------------------ Tipler */

/** Sunucudan gelen düz akış olayı (canlı replay kaynağı). */
export interface AkisOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  asn: string;
  path: string;
  method: string;
  botClass: string;
  verdict: string;
  score: number;
}

/** Operatörün oturum boyunca kurduğu aksiyon/olay kaydı (kalıcı — localStorage). */
interface KomutaKayit {
  /** Oturum-yerel monotonik id (Date.now DEĞİL — deterministik). */
  id: number;
  /** Kayıt zamanı (epoch ms) — kayıt handler içinde üretilir (istemci-yalnız). */
  ts: number;
  /** Kayıt türü. */
  tur: "ip" | "asn" | "ulke" | "durus" | "batch" | "vpn" | "olay" | "senaryo";
  /** İnsan-okur özet. */
  ozet: string;
  /** İlgili hedef (IP/ASN/ülke/senaryo) — varsa. */
  hedef?: string;
}

/** Kalıcı oturum durumu (localStorage şeması). */
interface KomutaDurum {
  kayitlar: KomutaKayit[];
  sonrakiId: number;
  durus: Durus;
  vpnDogrula: boolean;
  engelliIp: string[];
  engelliAsn: string[];
  engelliUlke: string[];
  karantinaSenaryo: string[];
}

type Durus = "normal" | "yukseltilmis" | "kilitli";

const DEPO_ANAHTAR = "specter.komuta.v1";
const MAX_AKIS = 60; // akışta tutulan en fazla satır
const REPLAY_MS = 1600; // gerçek olayların yeniden-oynatma aralığı

/* ------------------------------------------------------------------ Etiketler */

/** botClass enum değeri → çeviri anahtarı (enum DEĞERİ asla çevrilmez). */
const BOT_ETIKET_ANAHTAR: Record<string, string> = {
  human: "km.bot.human", good_bot: "km.bot.good_bot", automation: "km.bot.automation",
  scraper: "km.bot.scraper", credential_stuffing: "km.bot.credential_stuffing",
  ai_agent: "km.bot.ai_agent", ddos: "km.bot.ddos", spam: "km.bot.spam",
};

/** verdict enum değeri → çeviri anahtarı. */
const VERDICT_ETIKET_ANAHTAR: Record<string, string> = {
  allowed: "km.verdict.allowed", blocked: "km.verdict.blocked",
  challenged: "km.verdict.challenged", flagged: "km.verdict.flagged",
};

/** botClass/verdict etiketini dile göre üret (bilinmeyen değer ham döner). */
function botEtiket(sinif: string, t: CevirFn): string {
  const a = BOT_ETIKET_ANAHTAR[sinif];
  return a ? t(a) : sinif;
}
function verdictEtiket(verdict: string, t: CevirFn): string {
  const a = VERDICT_ETIKET_ANAHTAR[verdict];
  return a ? t(a) : verdict;
}

const VERDICT_STIL: Record<string, { nokta: string; pill: string }> = {
  allowed: { nokta: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  blocked: { nokta: "bg-red-400", pill: "bg-red-500/15 text-red-300 ring-red-500/30" },
  challenged: { nokta: "bg-amber-400", pill: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  flagged: { nokta: "bg-slate-400", pill: "bg-slate-500/20 text-slate-300 ring-slate-500/30" },
};

/** DEFCON seviyesi → görsel kimlik (1 = en kritik). Ad "DEFCON n" veridir;
 *  açıklama dile göre çevrilir (aciklamaAnahtar). */
const DEFCON_STIL: Record<number, { ad: string; renk: string; bar: string; aciklamaAnahtar: string }> = {
  1: { ad: "DEFCON 1", renk: "text-red-300", bar: "bg-red-500", aciklamaAnahtar: "km.defcon.1.aciklama" },
  2: { ad: "DEFCON 2", renk: "text-orange-300", bar: "bg-orange-500", aciklamaAnahtar: "km.defcon.2.aciklama" },
  3: { ad: "DEFCON 3", renk: "text-amber-300", bar: "bg-amber-500", aciklamaAnahtar: "km.defcon.3.aciklama" },
  4: { ad: "DEFCON 4", renk: "text-lime-300", bar: "bg-lime-500", aciklamaAnahtar: "km.defcon.4.aciklama" },
  5: { ad: "DEFCON 5", renk: "text-emerald-300", bar: "bg-emerald-500", aciklamaAnahtar: "km.defcon.5.aciklama" },
};

/** durus enum değeri → çeviri anahtarı. */
const DURUS_ETIKET_ANAHTAR: Record<Durus, string> = {
  normal: "km.durus.normal", yukseltilmis: "km.durus.yukseltilmis", kilitli: "km.durus.kilitli",
};

/* ------------------------------------------------------------------ Yardımcılar */

function saatBicim(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** ASN dizesinden okunur kısa ad ("AS15169 Google LLC" → "Google LLC"). */
function asnAd(asn: string): string {
  const m = asn.match(/^AS\d+\s+(.*)$/);
  return m ? m[1] : asn;
}

/** Varsayılan (temiz) oturum durumu. */
function bosDurum(): KomutaDurum {
  return {
    kayitlar: [],
    sonrakiId: 1,
    durus: "normal",
    vpnDogrula: false,
    engelliIp: [],
    engelliAsn: [],
    engelliUlke: [],
    karantinaSenaryo: [],
  };
}

/* ------------------------------------------------------------------ Ana bileşen */

export function KomutaMerkeziIstemci({
  foto,
  akisOlaylari,
  kuralSayisi,
  dil,
}: {
  foto: TehditFoto;
  akisOlaylari: AkisOlay[];
  kuralSayisi: number;
  dil: Dil;
}) {
  const t = useCallback((anahtar: string) => kmCeviri(anahtar, dil), [dil]);

  /* ----- Kalıcı oturum durumu (localStorage) ----- */
  const [durum, setDurum] = useState<KomutaDurum>(bosDurum);
  const yuklendiRef = useRef(false);

  // İlk yüklemede depodan oku (yalnızca istemci).
  useEffect(() => {
    try {
      const ham = localStorage.getItem(DEPO_ANAHTAR);
      if (ham) {
        const p = JSON.parse(ham) as Partial<KomutaDurum>;
        setDurum({ ...bosDurum(), ...p });
      }
    } catch {
      /* bozuk depo → varsayılan */
    }
    yuklendiRef.current = true;
  }, []);

  // Değişince kaydet (ilk yükleme tamamlanmadan yazma).
  useEffect(() => {
    if (!yuklendiRef.current) return;
    try {
      localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(durum));
    } catch {
      /* kota / gizli mod → yok say */
    }
  }, [durum]);

  /* ----- Canlı akış: GERÇEK olayların interval ile yeniden oynatılması ----- */
  const [akis, setAkis] = useState<AkisOlay[]>(() => akisOlaylari.slice(0, 12));
  const [canli, setCanli] = useState(true);
  const [oturumAkan, setOturumAkan] = useState(0);
  const [engellenenDk, setEngellenenDk] = useState(0);
  const imlecRef = useRef(0); // gerçek olay dizisinde ilerleyen imleç

  // Hareket-azalt tercihi (nabız/animasyonlar için).
  const [azHareket, setAzHareket] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uygula = () => setAzHareket(mq.matches);
    uygula();
    mq.addEventListener?.("change", uygula);
    return () => mq.removeEventListener?.("change", uygula);
  }, []);

  useEffect(() => {
    if (!canli || akisOlaylari.length === 0) return;
    const t = setInterval(() => {
      setAkis((onceki) => {
        // Gerçek olay listesinde ilerle; sona gelince başa dön (döngüsel replay).
        const idx = imlecRef.current % akisOlaylari.length;
        imlecRef.current = idx + 1;
        const kaynak = akisOlaylari[idx];
        // Yeniden-oynatmada ts'i "şimdi"ye yakın tut ki akış canlı hissettirsin.
        // (Bu bir sunum zaman damgasıdır; olayın kendisi gerçektir.)
        const yeni: AkisOlay = { ...kaynak, id: `${kaynak.id}#${imlecRef.current}`, ts: Date.now() };
        if (yeni.verdict === "blocked") setEngellenenDk((n) => n + 1);
        return [yeni, ...onceki].slice(0, MAX_AKIS);
      });
      setOturumAkan((n) => n + 1);
    }, REPLAY_MS);
    return () => clearInterval(t);
  }, [canli, akisOlaylari]);

  /* ----- İyimser sayaç sapmaları (operatör aksiyonlarından) ----- */
  // Engelleme aksiyonları "engellenen" sayacını iyimser artırır.
  const [ekEngel, setEkEngel] = useState(0);

  /* ----- Kayıt ekleyici (oturum kuyruğu) ----- */
  const kayitEkle = useCallback((tur: KomutaKayit["tur"], ozet: string, hedef?: string) => {
    setDurum((d) => {
      const kayit: KomutaKayit = { id: d.sonrakiId, ts: Date.now(), tur, ozet, hedef };
      return { ...d, sonrakiId: d.sonrakiId + 1, kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
  }, []);

  /* ----- Aksiyonlar (hepsi oturum-yerel; Date.now yalnız handler içinde) ----- */

  const ipEngelle = useCallback((ip: string) => {
    setDurum((d) => {
      if (d.engelliIp.includes(ip)) return d;
      const kayit: KomutaKayit = { id: d.sonrakiId, ts: Date.now(), tur: "ip", ozet: t("km.log.ipEngellendi").replace("{n}", ip), hedef: ip };
      return { ...d, sonrakiId: d.sonrakiId + 1, engelliIp: [ip, ...d.engelliIp], kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
    setEkEngel((n) => n + 1);
  }, [t]);

  const asnEngelle = useCallback((asn: string) => {
    setDurum((d) => {
      if (d.engelliAsn.includes(asn)) return d;
      const kayit: KomutaKayit = { id: d.sonrakiId, ts: Date.now(), tur: "asn", ozet: t("km.log.asnEngellendi").replace("{n}", asnAd(asn)), hedef: asn };
      return { ...d, sonrakiId: d.sonrakiId + 1, engelliAsn: [asn, ...d.engelliAsn], kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
    setEkEngel((n) => n + 3);
  }, [t]);

  const ulkeEngelle = useCallback((ulke: string) => {
    setDurum((d) => {
      if (d.engelliUlke.includes(ulke)) return d;
      const kayit: KomutaKayit = { id: d.sonrakiId, ts: Date.now(), tur: "ulke", ozet: t("km.log.ulkeEngellendi").replace("{n}", ulke), hedef: ulke };
      return { ...d, sonrakiId: d.sonrakiId + 1, engelliUlke: [ulke, ...d.engelliUlke], kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
    setEkEngel((n) => n + 2);
  }, [t]);

  const durusAyarla = useCallback((durus: Durus) => {
    setDurum((d) => {
      if (d.durus === durus) return d;
      const kayit: KomutaKayit = {
        id: d.sonrakiId, ts: Date.now(), tur: "durus",
        ozet: t("km.log.durus").replace("{n}", t(DURUS_ETIKET_ANAHTAR[durus])),
      };
      return { ...d, sonrakiId: d.sonrakiId + 1, durus, kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
  }, [t]);

  const vpnToggle = useCallback(() => {
    setDurum((d) => {
      const yeniDeger = !d.vpnDogrula;
      const kayit: KomutaKayit = {
        id: d.sonrakiId, ts: Date.now(), tur: "vpn",
        ozet: yeniDeger ? t("km.log.vpnAcik") : t("km.log.vpnKapali"),
      };
      return { ...d, sonrakiId: d.sonrakiId + 1, vpnDogrula: yeniDeger, kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
  }, [t]);

  const kotuAsnBatch = useCallback(() => {
    setDurum((d) => {
      const eklenecek = foto.bilinenKotuAsn.filter((a) => !d.engelliAsn.includes(a));
      if (!eklenecek.length) return d;
      const kayit: KomutaKayit = {
        id: d.sonrakiId, ts: Date.now(), tur: "batch",
        ozet: t("km.log.batch").replace("{n}", String(eklenecek.length)),
      };
      return { ...d, sonrakiId: d.sonrakiId + 1, engelliAsn: [...eklenecek, ...d.engelliAsn], kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
    setEkEngel((n) => n + foto.bilinenKotuAsn.length * 3);
  }, [foto.bilinenKotuAsn, t]);

  const senaryoKarantina = useCallback((sinif: string) => {
    setDurum((d) => {
      if (d.karantinaSenaryo.includes(sinif)) return d;
      const kayit: KomutaKayit = {
        id: d.sonrakiId, ts: Date.now(), tur: "senaryo",
        ozet: t("km.log.senaryoKarantina").replace("{n}", botEtiket(sinif, t)), hedef: sinif,
      };
      return { ...d, sonrakiId: d.sonrakiId + 1, karantinaSenaryo: [sinif, ...d.karantinaSenaryo], kayitlar: [kayit, ...d.kayitlar].slice(0, 120) };
    });
    setEkEngel((n) => n + 5);
  }, [t]);

  /* ----- Olay aç modalı ----- */
  const [olayModal, setOlayModal] = useState(false);

  const gunlukTemizle = useCallback(() => setDurum(bosDurum()), []);

  /* ----- Türetilmiş sayaçlar ----- */
  // Aktif tehdit: fotoğraftaki benzersiz tehdit IP + oturumda engellenen benzersiz hedef.
  const engelliToplam = durum.engelliIp.length + durum.engelliAsn.length * 3 + durum.engelliUlke.length;
  const engellenenSayac = foto.karar.blocked + ekEngel;
  const acikOlaySayisi = durum.kayitlar.filter((k) => k.tur === "olay").length;

  const defcon = DEFCON_STIL[foto.defcon] ?? DEFCON_STIL[5];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-6 pt-6 pb-10 lg:px-10">
      {/* ===================== Üst komuta bandı (koyu) ===================== */}
      <div className="overflow-hidden rounded-3xl border border-line bg-slate-ink text-white shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.06] text-red-300">
              <Radio className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold tracking-tight">{t("km.baslik")}</h1>
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-300 ring-1 ring-inset ring-red-500/30">
                  <span className="relative flex size-2">
                    {canli && !azHareket && <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />}
                    <span className={cn("relative inline-flex size-2 rounded-full", canli ? "bg-red-400" : "bg-slate-500")} />
                  </span>
                  {canli ? t("km.canli") : t("km.durdu")}
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] text-white/50">{t("km.altbaslik")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCanli((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition",
                canli ? "bg-white/10 text-white hover:bg-white/15" : "bg-emerald-600 text-white hover:bg-emerald-500",
              )}
            >
              {canli ? <><Pause className="size-3.5" /> {t("km.akisiDurdur")}</> : <><Play className="size-3.5" /> {t("km.akisiSurdur")}</>}
            </button>
            <button
              onClick={() => setOlayModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-500"
            >
              <Siren className="size-3.5" /> {t("km.olayAc")}
            </button>
          </div>
        </div>

        {/* Durum panosu — büyük canlı sayaçlar + DEFCON */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-5">
          <PanoSayac ikon={<Crosshair className="size-4" />} etiket={t("km.pano.aktifTehditIp")} deger={foto.benzersizTehditIp} ton="danger" />
          <PanoSayac ikon={<Ban className="size-4" />} etiket={t("km.pano.engellenen")} deger={engellenenSayac} ton="danger" />
          <PanoSayac ikon={<Zap className="size-4" />} etiket={t("km.pano.engellenenDk")} deger={engellenenDk} ton="warn" alt={t("km.pano.canliAkistan")} />
          <PanoSayac ikon={<Siren className="size-4" />} etiket={t("km.pano.acikOlay")} deger={acikOlaySayisi} ton={acikOlaySayisi > 0 ? "warn" : "ok"} />
          {/* DEFCON kartı */}
          <div className="bg-slate-ink px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] text-white/50"><Gauge className="size-4" /> {t("km.pano.savunmaSeviyesi")}</span>
            </div>
            <div className={cn("mt-1.5 text-[22px] font-bold leading-none", defcon.renk)}>{defcon.ad}</div>
            <div className="mt-2 flex gap-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition",
                    n >= foto.defcon ? (DEFCON_STIL[n]?.bar ?? "bg-white/20") : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">{t(defcon.aciklamaAnahtar)}</p>
          </div>
        </div>
      </div>

      {/* ===================== Ana ızgara: akış | yan sütun ===================== */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* -------- Canlı saldırı akışı -------- */}
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-3xl border border-line bg-slate-ink text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
              <span className="flex items-center gap-2 text-[14px] font-semibold">
                <Activity className="size-4 text-red-300" /> {t("km.akis.baslik")}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/50">{t("km.akis.satir").replace("{n}", String(akis.length))}</span>
              </span>
              <span className="text-[11.5px] text-white/40">{t("km.akis.oturumBilgi").replace("{n}", String(oturumAkan))}</span>
            </div>

            {/* Kolon başlıkları */}
            <div className="hidden grid-cols-[70px_92px_110px_130px_1fr_190px] gap-2 border-b border-white/[0.06] px-5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/35 lg:grid">
              <span>{t("km.akis.kol.saat")}</span><span>{t("km.akis.kol.karar")}</span><span>{t("km.akis.kol.sinif")}</span><span>{t("km.akis.kol.ip")}</span><span>{t("km.akis.kol.asnYol")}</span><span className="text-right">{t("km.akis.kol.aksiyon")}</span>
            </div>

            <div className="max-h-[52vh] overflow-y-auto">
              {akis.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Radio className="mb-3 size-8 text-white/20" />
                  <p className="text-sm font-medium text-white/60">{t("km.akis.bekleniyor")}</p>
                  <p className="mt-1 text-[12px] text-white/30">{t("km.akis.bekleniyorAlt")}</p>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {akis.map((e) => (
                      <AkisSatir
                        key={e.id}
                        olay={e}
                        t={t}
                        azHareket={azHareket}
                        ipEngelli={durum.engelliIp.includes(e.ip)}
                        asnEngelli={durum.engelliAsn.includes(e.asn)}
                        ulkeEngelli={durum.engelliUlke.includes(e.country)}
                        onIp={() => ipEngelle(e.ip)}
                        onAsn={() => asnEngelle(e.asn)}
                        onUlke={() => ulkeEngelle(e.country)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>

          {/* Aktif saldırı senaryoları (botClass kümelemesi) */}
          <section className="rounded-3xl border border-line bg-surface">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-ink">
                <Layers className="size-4 text-brand-600" /> {t("km.senaryo.baslik")}
              </h3>
              <span className="text-[12px] text-slate-faint">{t("km.senaryo.altbaslik")}</span>
            </div>
            <div className="px-6 pb-6">
              {foto.senaryolar.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-faint">{t("km.senaryo.yok")}</p>
              ) : (
                <>
                  {/* Senaryo hacim histogramı — kart tekrarı yerine tek bakışta
                      senaryolar arası büyüklük kıyaslaması (farklı görsel dil). */}
                  {foto.senaryolar.length > 1 && (
                    <div className="mb-5 rounded-2xl border border-line bg-canvas/40 px-4 pt-4 pb-3">
                      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                        <Layers className="size-3.5" /> {t("km.senaryo.hacimBaslik")}
                      </div>
                      <Histogram
                        yukseklik={72}
                        kovalar={foto.senaryolar.slice(0, 8).map((s) => ({
                          etiket: botEtiket(s.sinif, t),
                          deger: s.adet,
                          ton: "bot",
                        }))}
                      />
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {foto.senaryolar.slice(0, 4).map((s) => (
                      <SenaryoKart
                        key={s.sinif}
                        senaryo={s}
                        t={t}
                        karantinada={durum.karantinaSenaryo.includes(s.sinif)}
                        onKarantina={() => senaryoKarantina(s.sinif)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* -------- Yan sütun: komuta paneli + top saldırganlar -------- */}
        <div className="flex flex-col gap-5">
          {/* Komuta paneli */}
          <section className="rounded-3xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-ink">
                <ShieldHalf className="size-4 text-brand-600" /> {t("km.komuta.baslik")}
              </h3>
              <p className="mt-0.5 text-[12px] text-slate-muted">{t("km.komuta.altbaslik")}</p>
            </div>
            <div className="space-y-4 px-5 py-4">
              {/* Savunma duruşu */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
                  <Lock className="size-3.5" /> {t("km.komuta.savunmaDurusu")}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <DurusButon aktif={durum.durus === "normal"} ton="ok" ad={t("km.durus.normal")} onClick={() => durusAyarla("normal")} />
                  <DurusButon aktif={durum.durus === "yukseltilmis"} ton="warn" ad={t("km.durus.yukseltilmis")} onClick={() => durusAyarla("yukseltilmis")} />
                  <DurusButon aktif={durum.durus === "kilitli"} ton="danger" ad={t("km.durus.kilitli")} onClick={() => durusAyarla("kilitli")} />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-faint">
                  {durum.durus === "kilitli"
                    ? t("km.komuta.durus.kilitliAciklama")
                    : durum.durus === "yukseltilmis"
                    ? t("km.komuta.durus.yukseltilmisAciklama")
                    : t("km.komuta.durus.normalAciklama")}
                </p>
              </div>

              {/* VPN/proxy doğrula toggle */}
              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-line bg-canvas/40 px-3.5 py-3">
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-slate-ink">{t("km.komuta.vpnBaslik")}</span>
                  <span className="mt-0.5 block text-[11.5px] text-slate-muted">{t("km.komuta.vpnAciklama")}</span>
                </span>
                <button
                  role="switch"
                  aria-checked={durum.vpnDogrula}
                  onClick={vpnToggle}
                  className={cn(
                    "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
                    durum.vpnDogrula ? "bg-brand-600" : "bg-slate-300",
                  )}
                >
                  <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition", durum.vpnDogrula ? "left-[22px]" : "left-0.5")} />
                </button>
              </label>

              {/* Batch: bilinen kötü ASN engelle */}
              <button
                onClick={kotuAsnBatch}
                disabled={foto.bilinenKotuAsn.length === 0}
                className="flex w-full items-center justify-between gap-2 rounded-2xl border border-red-200 bg-danger-soft px-3.5 py-3 text-left transition hover:bg-red-100 disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-red-700"><Ban className="size-3.5" /> {t("km.komuta.kotuAsnBaslik")}</span>
                  <span className="mt-0.5 block text-[11.5px] text-red-600/80">{t("km.komuta.kotuAsnAciklama").replace("{n}", String(foto.bilinenKotuAsn.length))}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-red-400" />
              </button>

              {/* Olay aç */}
              <Button variant="danger" size="sm" className="w-full" onClick={() => setOlayModal(true)}>
                <Siren className="size-4" /> {t("km.komuta.yeniOlayAc")}
              </Button>

              {/* Dürüstlük etiketi */}
              <p className="rounded-xl border border-amber-200 bg-warn-soft px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
                <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" />
                {t("km.komuta.durustluk").replace("{n}", String(kuralSayisi))}
              </p>
            </div>
          </section>

          {/* Karar dağılımı — verdict kompozisyonu (donut halka, bar tekrarını kırar) */}
          <KararDagilimi foto={foto} t={t} />

          {/* Top saldırganlar */}
          <TopSaldirganlar
            foto={foto}
            durum={durum}
            t={t}
            onIp={ipEngelle}
            onAsn={asnEngelle}
            onUlke={ulkeEngelle}
          />
        </div>
      </div>

      {/* ===================== Olay günlüğü (alt) ===================== */}
      <section className="rounded-3xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-3.5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-ink">
            <ListChecks className="size-4 text-brand-600" /> {t("km.gunluk.baslik")}
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-muted">{t("km.gunluk.kayit").replace("{n}", String(durum.kayitlar.length))}</span>
          </h3>
          <div className="flex items-center gap-3 text-[12px] text-slate-muted">
            <span className="flex items-center gap-1"><Ban className="size-3.5 text-danger2" /> {t("km.gunluk.hedefKuyruk").replace("{n}", String(engelliToplam))}</span>
            {durum.kayitlar.length > 0 && (
              <button onClick={gunlukTemizle} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-danger2 transition hover:bg-danger-soft">
                <Trash2 className="size-3.5" /> {t("km.gunluk.temizle")}
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[38vh] overflow-y-auto px-3 py-2">
          {durum.kayitlar.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-faint">
              {t("km.gunluk.bos")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {durum.kayitlar.map((k) => (
                <GunlukSatir key={k.id} kayit={k} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Olay aç modalı */}
      <OlayModal
        acik={olayModal}
        kapat={() => setOlayModal(false)}
        foto={foto}
        t={t}
        onAc={(baslik, siddet) => {
          kayitEkle("olay", t("km.log.olayAcildi").replace("{s}", siddet).replace("{b}", baslik));
          setOlayModal(false);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Duruş butonu */
function DurusButon({
  aktif, ton, ad, onClick,
}: {
  aktif: boolean; ton: "ok" | "warn" | "danger"; ad: string; onClick: () => void;
}) {
  const aktifStil = ton === "danger"
    ? "border-red-300 bg-danger-soft text-red-700"
    : ton === "warn"
    ? "border-amber-300 bg-warn-soft text-amber-700"
    : "border-emerald-300 bg-ok-soft text-ok";
  return (
    <button
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        "rounded-xl border px-2 py-2 text-[12.5px] font-semibold transition",
        aktif ? aktifStil : "border-line bg-canvas/40 text-slate-muted hover:border-line-strong hover:text-slate-ink",
      )}
    >
      {ad}
    </button>
  );
}

/* ------------------------------------------------------------------ Pano sayacı */
function PanoSayac({
  ikon, etiket, deger, ton, alt,
}: {
  ikon: React.ReactNode; etiket: string; deger: number; ton: "danger" | "warn" | "ok"; alt?: string;
}) {
  const renk = ton === "danger" ? "text-red-300" : ton === "warn" ? "text-amber-300" : "text-emerald-300";
  return (
    <div className="bg-slate-ink px-5 py-4">
      <span className="flex items-center gap-1.5 text-[11.5px] text-white/50">{ikon} {etiket}</span>
      <div className={cn("mt-1.5 text-[28px] font-bold leading-none tabular-nums num", renk)}>{deger.toLocaleString("tr-TR")}</div>
      {alt && <p className="mt-1 text-[11px] text-white/35">{alt}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Akış satırı */
function AkisSatir({
  olay, t, azHareket, ipEngelli, asnEngelli, ulkeEngelli, onIp, onAsn, onUlke,
}: {
  olay: AkisOlay;
  t: CevirFn;
  azHareket: boolean;
  ipEngelli: boolean;
  asnEngelli: boolean;
  ulkeEngelli: boolean;
  onIp: () => void;
  onAsn: () => void;
  onUlke: () => void;
}) {
  const stil = VERDICT_STIL[olay.verdict] ?? VERDICT_STIL.flagged;
  const skorYuzde = Math.round(olay.score * 100);
  return (
    <motion.li
      layout={!azHareket}
      initial={azHareket ? false : { opacity: 0, y: -8, backgroundColor: "rgba(239,68,68,0.10)" }}
      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.4 }}
      className="border-b border-white/[0.05]"
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-5 py-2.5 lg:grid-cols-[70px_92px_110px_130px_1fr_190px]">
        {/* Saat */}
        <span className="num order-1 hidden text-[12px] font-medium text-white/45 tabular-nums lg:block">{saatBicim(olay.ts)}</span>
        {/* Karar */}
        <span className={cn("order-2 hidden w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset lg:inline-flex", stil.pill)}>
          <span className={cn("size-1.5 rounded-full", stil.nokta)} /> {verdictEtiket(olay.verdict, t)}
        </span>
        {/* Sınıf */}
        <span className="order-3 hidden text-[12.5px] text-white/70 lg:block">{botEtiket(olay.botClass, t)}</span>
        {/* IP + skor (birinci sütun mobilde) */}
        <span className="order-1 flex min-w-0 flex-col lg:contents">
          <span className="num truncate text-[12.5px] font-semibold text-white/90">{olay.ip}</span>
          <span className="truncate text-[11px] text-white/40 lg:hidden">{asnAd(olay.asn)}</span>
        </span>
        {/* ASN · Yol */}
        <span className="order-4 hidden min-w-0 items-center gap-1.5 text-[12px] text-white/45 lg:flex">
          <span className={cn("num truncate", skorYuzde < 40 ? "text-red-300" : "text-white/45")}>{asnAd(olay.asn)}</span>
          <span className="truncate text-white/30">{olay.path}</span>
        </span>
        {/* Aksiyonlar */}
        <span className="order-2 flex shrink-0 items-center justify-end gap-1 lg:order-5">
          <AksiyonMini etiket="IP" title={t("km.aksiyon.ipEngelle").replace("{n}", olay.ip)} aktif={ipEngelli} onClick={onIp} ikon={<Ban className="size-3" />} />
          <AksiyonMini etiket="ASN" title={t("km.aksiyon.asnEngelle").replace("{n}", asnAd(olay.asn))} aktif={asnEngelli} onClick={onAsn} ikon={<Server className="size-3" />} />
          <AksiyonMini etiket={<Ulke kod={olay.country} />} title={t("km.aksiyon.ulkeEngelle").replace("{n}", olay.country)} aktif={ulkeEngelli} onClick={onUlke} ikon={<Globe className="size-3" />} />
        </span>
      </div>
    </motion.li>
  );
}

/** Akış satırı içi minik aksiyon butonu (engelle). */
function AksiyonMini({
  etiket, title, aktif, onClick, ikon,
}: {
  etiket: React.ReactNode; title: string; aktif: boolean; onClick: () => void; ikon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-semibold transition",
        aktif
          ? "bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30"
          : "bg-white/[0.06] text-white/60 hover:bg-red-500/15 hover:text-red-300",
      )}
    >
      {aktif ? <ShieldCheck className="size-3" /> : ikon}
      <span className="max-w-[42px] truncate">{etiket}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ Senaryo kartı */
function SenaryoKart({
  senaryo, t, karantinada, onKarantina,
}: {
  senaryo: Senaryo; t: CevirFn; karantinada: boolean; onKarantina: () => void;
}) {
  const engelYuzde = Math.round(senaryo.engelOran * 100);
  const g = botSinifGorsel(senaryo.sinif);
  const Ikon = g.ikon;
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-ink">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg" style={{ background: g.soft, color: g.renk }}>
              <Ikon className="size-3.5" strokeWidth={2.2} />
            </span>
            <span className="truncate">{botEtiket(senaryo.sinif, t)}</span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-slate-muted">
            {t("km.senaryo.ipSayi").replace("{n}", String(senaryo.benzersizIp))} · {senaryo.baslicaAsn ? asnAd(senaryo.baslicaAsn) : t("km.senaryo.karisikKaynak")}
          </p>
        </div>
        <span className="num shrink-0 rounded-lg bg-white px-2 py-1 text-[16px] font-bold text-slate-ink ring-1 ring-line">{senaryo.adet}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full" style={{ width: `${engelYuzde}%`, background: g.renk }} />
        </div>
        <span className="num text-[11px] font-medium text-slate-muted">{t("km.senaryo.engel").replace("{n}", String(engelYuzde))}</span>
      </div>
      <button
        onClick={onKarantina}
        disabled={karantinada}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition",
          karantinada
            ? "bg-ok-soft text-ok"
            : "bg-ink-900 text-white hover:bg-ink-800",
        )}
      >
        {karantinada ? <><ShieldCheck className="size-3.5" /> {t("km.senaryo.karantinada")}</> : <><Lock className="size-3.5" /> {t("km.senaryo.karantinaAl")}</>}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ Karar dağılımı */
/** Verdict kompozisyonu — donut halka. Tehdit fotoğrafındaki gerçek karar
 *  sayaçlarını (blocked/challenged/allowed/flagged) tek bakışta gösterir. */
function KararDagilimi({ foto, t }: { foto: TehditFoto; t: CevirFn }) {
  const k = foto.karar;
  const segmentler = [
    { etiket: t("km.verdict.blocked"), deger: k.blocked, renk: "#dc2626" },
    { etiket: t("km.verdict.challenged"), deger: k.challenged, renk: "#d97706" },
    { etiket: t("km.verdict.allowed"), deger: k.allowed, renk: "#16a34a" },
    { etiket: t("km.verdict.flagged"), deger: k.flagged, renk: "#64748b" },
  ];
  // Senaryo engel-oranı radarı — 3+ senaryo varsa savunma etkinliğini
  // (her sınıfta ne kadar engellenebiliyor) tek bakışta gösterir.
  const radarEksenler = foto.senaryolar
    .slice(0, 6)
    .map((s) => ({ etiket: botEtiket(s.sinif, t), deger: Math.round(s.engelOran * 100) }));
  return (
    <section className="rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-ink">
          <Gauge className="size-4 text-brand-600" /> {t("km.akis.kol.karar")}
        </h3>
      </div>
      <div className="px-5 py-4">
        <DonutDagilim segmentler={segmentler} merkezEtiket={t("km.akis.kol.karar")} />
        {/* Senaryo bazlı engel-oranı radarı (donut'tan farklı görsel dil). */}
        {radarEksenler.length >= 3 && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
              <ShieldCheck className="size-3.5" /> {t("km.karar.engelProfil")}
            </div>
            <div className="grid place-items-center">
              <RadarGrafik eksenler={radarEksenler} boyut={196} renk="#dc2626" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Top saldırganlar */
function TopSaldirganlar({
  foto, durum, t, onIp, onAsn, onUlke,
}: {
  foto: TehditFoto;
  durum: KomutaDurum;
  t: CevirFn;
  onIp: (ip: string) => void;
  onAsn: (asn: string) => void;
  onUlke: (ulke: string) => void;
}) {
  const [sekme, setSekme] = useState<"asn" | "ulke" | "ip">("asn");
  const veri: SaldirganSatir[] = sekme === "asn" ? foto.topAsn : sekme === "ulke" ? foto.topUlke : foto.topIp;
  const engelli = (s: SaldirganSatir) =>
    sekme === "asn" ? durum.engelliAsn.includes(s.anahtar)
      : sekme === "ulke" ? durum.engelliUlke.includes(s.anahtar)
      : durum.engelliIp.includes(s.anahtar);
  const engelle = (s: SaldirganSatir) =>
    sekme === "asn" ? onAsn(s.anahtar) : sekme === "ulke" ? onUlke(s.anahtar) : onIp(s.anahtar);
  const maks = Math.max(1, ...veri.map((v) => v.toplam));

  return (
    <section className="rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-ink">
          <Crosshair className="size-4 text-brand-600" /> {t("km.top.baslik")}
        </h3>
        <p className="mt-0.5 text-[12px] text-slate-muted">{t("km.top.altbaslik")}</p>
      </div>
      {/* Sekme */}
      <div className="flex gap-1 border-b border-line px-3 py-2">
        {([["asn", t("km.top.sekme.asn"), <Server key="a" className="size-3.5" />], ["ulke", t("km.top.sekme.ulke"), <Globe key="u" className="size-3.5" />], ["ip", t("km.top.sekme.ip"), <Cpu key="i" className="size-3.5" />]] as const).map(([k, ad, ik]) => (
          <button
            key={k}
            onClick={() => setSekme(k)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition",
              sekme === k ? "bg-brand-50 text-brand-700" : "text-slate-muted hover:bg-canvas",
            )}
          >
            {ik} {ad}
          </button>
        ))}
      </div>
      {/* Görsel özet — sekmeye göre farklı dil: hacim histogramı (üst şerit).
          Liste bar tekrarını üstten kırar, tek bakışta zirveyi gösterir. */}
      {veri.length > 1 && (
        <div className="border-b border-line px-5 pt-3.5 pb-2">
          <Histogram
            yukseklik={54}
            kovalar={veri.slice(0, 8).map((s) => ({
              etiket: sekme === "asn" ? asnAd(s.anahtar).slice(0, 6) : sekme === "ip" ? s.anahtar.split(".").slice(0, 2).join(".") : s.anahtar,
              deger: s.toplam,
              ton: s.tehdit / (s.toplam || 1) > 0.5 ? "bot" : "nötr",
            }))}
          />
        </div>
      )}
      <ul className="divide-y divide-line">
        {veri.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-slate-faint">{t("km.top.bosBoyut")}</li>
        ) : (
          veri.map((s) => {
            const bloke = engelli(s);
            return (
              <li key={s.anahtar} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-ink">
                    {sekme === "ulke" ? <Ulke kod={s.anahtar} /> : (
                      <span className="num truncate">{sekme === "asn" ? asnAd(s.anahtar) : s.anahtar}</span>
                    )}
                    {sekme !== "ulke" && s.ulke && <Ulke kod={s.ulke} />}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {/* Katmanlı bar: toplam hacim (nötr zemin) + tehdit payı
                        (kırmızı dolu). Tek-düz bar tekrarını kırar; tehdit
                        yoğunluğunu tek bakışta gösterir. */}
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-brand-600/25"
                      style={{ width: `${Math.max(6, Math.round((s.toplam / maks) * 100))}%` }}
                    >
                      <div
                        className="h-full rounded-full bg-danger2/80"
                        style={{ width: `${Math.round((s.tehdit / (s.toplam || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="num ml-auto shrink-0 text-[11px] text-slate-muted">{s.tehdit}/{s.toplam}</span>
                  </div>
                </div>
                <button
                  onClick={() => engelle(s)}
                  disabled={bloke}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                    bloke ? "bg-ok-soft text-ok" : "bg-danger-soft text-red-700 hover:bg-red-100",
                  )}
                >
                  {bloke ? <><ShieldCheck className="size-3.5" /> {t("km.top.engelli")}</> : <><Ban className="size-3.5" /> {t("km.top.engelle")}</>}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ Günlük satırı */
const TUR_STIL: Record<KomutaKayit["tur"], { ikon: React.ReactNode; renk: string }> = {
  ip: { ikon: <Ban className="size-3.5" />, renk: "bg-danger-soft text-red-700" },
  asn: { ikon: <Server className="size-3.5" />, renk: "bg-danger-soft text-red-700" },
  ulke: { ikon: <Globe className="size-3.5" />, renk: "bg-danger-soft text-red-700" },
  batch: { ikon: <Layers className="size-3.5" />, renk: "bg-danger-soft text-red-700" },
  durus: { ikon: <Lock className="size-3.5" />, renk: "bg-brand-50 text-brand-700" },
  vpn: { ikon: <ShieldHalf className="size-3.5" />, renk: "bg-brand-50 text-brand-700" },
  senaryo: { ikon: <ShieldAlert className="size-3.5" />, renk: "bg-warn-soft text-amber-700" },
  olay: { ikon: <Siren className="size-3.5" />, renk: "bg-warn-soft text-amber-700" },
};

function GunlukSatir({ kayit }: { kayit: KomutaKayit }) {
  const stil = TUR_STIL[kayit.tur];
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", stil.renk)}>{stil.ikon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-ink">{kayit.ozet}</span>
      <span className="num shrink-0 text-[11.5px] text-slate-faint tabular-nums">{saatBicim(kayit.ts)}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ Olay aç modalı */
/** Şiddet seviyesi enum anahtarı → çeviri anahtarı (görüntü için). */
const SIDDET_ANAHTAR = ["kritik", "yuksek", "orta"] as const;
type SiddetKey = (typeof SIDDET_ANAHTAR)[number];
function siddetEtiket(key: SiddetKey, t: CevirFn): string {
  return t(`km.siddet.${key}`);
}

function OlayModal({
  acik, kapat, foto, t, onAc,
}: {
  acik: boolean;
  kapat: () => void;
  foto: TehditFoto;
  t: CevirFn;
  onAc: (baslik: string, siddet: string) => void;
}) {
  const [baslik, setBaslik] = useState("");
  const [siddet, setSiddet] = useState<SiddetKey>("yuksek");

  // Modal açılınca öneri başlık doldur (fotoğraftan).
  useEffect(() => {
    if (acik) {
      const enSenaryo = foto.senaryolar[0];
      setBaslik(enSenaryo ? t("km.modal.oneriDalga").replace("{n}", botEtiket(enSenaryo.sinif, t)) : t("km.modal.oneriInceleme"));
      setSiddet(foto.defcon <= 2 ? "kritik" : "yuksek");
    }
  }, [acik, foto, t]);

  if (!acik) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-line bg-surface shadow-lift"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-ink"><Siren className="size-5 text-danger2" /> {t("km.modal.baslik")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-muted">{t("km.modal.altbaslik")}</p>
          </div>
          <button onClick={kapat} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"><X className="size-5" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("km.modal.olayBasligi")}</span>
            <input
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder={t("km.modal.baslikPlaceholder")}
              className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("km.modal.siddet")}</span>
            <div className="grid grid-cols-3 gap-1.5">
              {SIDDET_ANAHTAR.map((s) => (
                <button
                  key={s}
                  onClick={() => setSiddet(s)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-[13px] font-medium transition",
                    siddet === s ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line bg-canvas/40 text-slate-muted hover:border-line-strong",
                  )}
                >
                  {siddetEtiket(s, t)}
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-xl border border-amber-200 bg-warn-soft px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" />
            {t("km.modal.durustluk")}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <Button variant="outline" size="sm" onClick={kapat}>{t("km.modal.vazgec")}</Button>
          <Button variant="danger" size="sm" onClick={() => onAc(baslik.trim() || t("km.modal.adsizOlay"), siddetEtiket(siddet, t))}>
            <Plus className="size-4" /> {t("km.modal.olayiAc")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
