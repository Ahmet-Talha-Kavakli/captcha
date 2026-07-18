"use client";

/**
 * Gerçek-Zaman Tehdit Yayını — CANLI SSE tüketicisi (amiral gemisi).
 * =================================================================
 * Bu panelin farkı: GERÇEK server-sent-events. Tarayıcı tek bir uzun-yaşayan
 * `EventSource("/api/live/stream")` bağlantısı açar; sunucu ~2sn'de bir
 * SAHİBİN gerçek olay akışından yeni olayları `data: {events:[...]}` biçiminde
 * İTER. Burada setInterval ile sahte akış YOK — canlılık tamamen sunucudan
 * push edilen olaylardan gelir.
 *
 * Bağlantı yaşam döngüsü açıkça gösterilir:
 *   - bağlanıyor (sarı nabız) → EventSource kuruluyor
 *   - canlı (yeşil nabız)     → `ready` el sıkışması alındı / veri akıyor
 *   - kesildi (kırmızı)       → onerror; EventSource kendiliğinden yeniden bağlanır
 *
 * Veri kaynağı SALT-OKUNUR olarak tüketilir (/api/live/stream, mevcut SSE
 * uç noktası). Duraklat/Sürdür bağlantıyı fiziksel olarak kapatıp yeniden açar.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadioTower, Play, Pause, Trash2, Ban, ShieldCheck, ShieldAlert,
  Bot, Activity, Globe, Zap, Eye, Wifi, WifiOff,
} from "lucide-react";
import { Panel, StatKart, DurumRozeti, NotKutusu, Ulke } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { canliYayinCeviri } from "./canli-yayin.i18n";

/* ------------------------------------------------------------------ Tipler */
/** Akıştan gelen ham olay (sunucu `/api/live/stream` bunu iter). */
interface AkisOlay {
  id: string;
  ts: number;
  ip?: string;
  country?: string;
  botClass?: string;
  verdict?: string;
  path?: string;
  score?: number;
}

type BaglantiDurumu = "baglaniyor" | "canli" | "kesildi";

const MAX_AKIS = 50; // akışta bellekte tutulan en fazla olay (eskiler düşer)
const SPARK_PENCERE = 30; // olay/sn grafiğinde tutulan saniye örneği

/* ------------------------------------------------------------------ Etiketler
 * Not: bot-sınıfı ve verdict etiketleri artık ETİKET-haritası değil; enum
 * anahtarı üzerinden çeviriden gelir (bkz. `t("bot." + …)` / `t("verdict." + …)`).
 * Aşağıdaki VERDICT_STIL yalnızca RENK/İKON taşır — metin içermez. */
/** Verdict → satır aksan rengi + rozet stili (metinsiz). */
const VERDICT_STIL: Record<string, { cizgi: string; pill: string; ikon: React.ReactNode }> = {
  allowed: { cizgi: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25", ikon: <ShieldCheck className="size-3.5" /> },
  blocked: { cizgi: "bg-red-400", pill: "bg-red-500/15 text-red-600 ring-red-500/25", ikon: <Ban className="size-3.5" /> },
  challenged: { cizgi: "bg-amber-400", pill: "bg-amber-500/15 text-amber-600 ring-amber-500/25", ikon: <ShieldAlert className="size-3.5" /> },
  flagged: { cizgi: "bg-slate-400", pill: "bg-slate-500/15 text-slate-600 ring-slate-500/25", ikon: <Activity className="size-3.5" /> },
};

/** Bot-sınıfı etiketi: bilinen enum ise çevir, aksi halde ham değeri göster.
 * (Çeviri sözlüğü eksik anahtarda anahtarın kendisini döndürdüğü için, bilinmeyen
 * sınıflarda "bot.xyz" görünmesin diye önce sözlükte anahtar var mı kontrol edilir.) */
function botEtiket(botClass: string | undefined, dil: Dil): string {
  if (!botClass) return "—";
  const cevrilmis = canliYayinCeviri("bot." + botClass, dil);
  // Anahtar sözlükte yoksa canliYayinCeviri "bot.<x>" döner → ham değere düş.
  return cevrilmis === "bot." + botClass ? botClass : cevrilmis;
}

function saatBicim(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ Sparkline
 * Olay/sn hızını canlı çizen satır-içi SVG. Bağımlılık yok; her yeni örnekte
 * yeniden çizilir. */
function Sparkline({ veri, renk = "#4a41e8" }: { veri: number[]; renk?: string }) {
  const G = 220, Y = 44;
  if (veri.length < 2) {
    return (
      <svg viewBox={`0 0 ${G} ${Y}`} className="h-11 w-full" preserveAspectRatio="none">
        <line x1="0" y1={Y - 1} x2={G} y2={Y - 1} stroke={renk} strokeOpacity="0.2" strokeWidth="1" />
      </svg>
    );
  }
  const enBuyuk = Math.max(1, ...veri);
  const adim = G / (veri.length - 1);
  const nokta = (v: number, i: number) => `${i * adim},${Y - (v / enBuyuk) * (Y - 6) - 3}`;
  const cizgi = veri.map((v, i) => nokta(v, i)).join(" ");
  const alan = `0,${Y} ${cizgi} ${G},${Y}`;
  return (
    <svg viewBox={`0 0 ${G} ${Y}`} className="h-11 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk} stopOpacity="0.28" />
          <stop offset="100%" stopColor={renk} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={alan} fill="url(#sparkGrad)" />
      <polyline points={cizgi} fill="none" stroke={renk} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(veri.length - 1) * adim} cy={Y - (veri[veri.length - 1] / enBuyuk) * (Y - 6) - 3} r="2.5" fill={renk} />
    </svg>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */
export function CanliYayinIstemci({
  ilk,
  dil,
}: {
  ilk: { toplam: number; engellenen: number; dogrulanan: number };
  dil: Dil;
}) {
  const t = useCallback((k: string) => canliYayinCeviri(k, dil), [dil]);
  const [durum, setDurum] = useState<BaglantiDurumu>("baglaniyor");
  const [akis, setAkis] = useState<AkisOlay[]>([]);
  const [duraklat, setDuraklat] = useState(false);

  // Oturum-içi canlı sayaçlar (akış açıldığından beri). İlk-boyama sayaçları
  // ayrı gösterilir; bunlar SIFIRDAN sayar → "bu oturumda görülen" dürüst olur.
  const [sayac, setSayac] = useState({ toplam: 0, engellenen: 0, dogrulanan: 0, izin: 0 });
  // botClass → adet (oturum içi dağılım).
  const [botDagilim, setBotDagilim] = useState<Record<string, number>>({});
  // olay/sn sparkline: her saniye kovası için o saniyedeki olay sayısı.
  const [spark, setSpark] = useState<number[]>([]);

  // Geçerli saniye kovası (sparkline biriktirme) — render tetiklemeden tutulur.
  const kovaRef = useRef<{ sn: number; adet: number }>({ sn: Math.floor(Date.now() / 1000), adet: 0 });
  const esRef = useRef<EventSource | null>(null);

  /* --------------------------------------------------- Olayları işle */
  const olaylariEkle = useCallback((yeni: AkisOlay[]) => {
    if (!yeni.length) return;
    // Akış listesi (en yeni üstte, MAX_AKIS ile sınırlı).
    setAkis((eski) => {
      const birlesik = [...yeni.slice().reverse(), ...eski];
      return birlesik.slice(0, MAX_AKIS);
    });
    // Canlı sayaçlar.
    setSayac((s) => {
      const d = { ...s };
      for (const e of yeni) {
        d.toplam += 1;
        if (e.verdict === "blocked") d.engellenen += 1;
        else if (e.verdict === "challenged") d.dogrulanan += 1;
        else if (e.verdict === "allowed") d.izin += 1;
      }
      return d;
    });
    // Bot-sınıfı dağılımı.
    setBotDagilim((d) => {
      const yeniD = { ...d };
      for (const e of yeni) {
        const k = e.botClass || "bilinmiyor";
        yeniD[k] = (yeniD[k] || 0) + 1;
      }
      return yeniD;
    });
    // Sparkline saniye kovası.
    const simdiSn = Math.floor(Date.now() / 1000);
    if (kovaRef.current.sn === simdiSn) {
      kovaRef.current.adet += yeni.length;
    } else {
      kovaRef.current = { sn: simdiSn, adet: yeni.length };
    }
  }, []);

  /* --------------------------------------------------- Sparkline saat darbesi
   * Her saniye o saniyenin kova değerini grafiğe iter (0 dahil → boşluk da
   * görünür). Bu bir zamanlayıcı ama VERİ ÜRETMEZ; yalnızca sunucudan gelen
   * gerçek olay hızını 1sn çözünürlükte örnekler. */
  useEffect(() => {
    const t = setInterval(() => {
      const simdiSn = Math.floor(Date.now() / 1000);
      const deger = kovaRef.current.sn === simdiSn ? kovaRef.current.adet : 0;
      setSpark((s) => [...s, deger].slice(-SPARK_PENCERE));
      // Kovayı bir sonraki saniyeye taşı (birikeni sıfırla).
      if (kovaRef.current.sn !== simdiSn) kovaRef.current = { sn: simdiSn, adet: 0 };
      else kovaRef.current = { sn: simdiSn + 1, adet: 0 };
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* --------------------------------------------------- EventSource yaşam döngüsü */
  useEffect(() => {
    if (duraklat) return; // duraklatıldıysa bağlantı açma

    setDurum("baglaniyor");
    const es = new EventSource("/api/live/stream");
    esRef.current = es;

    // `ready` el sıkışması → bağlantı kuruldu, CANLI.
    es.addEventListener("ready", () => setDurum("canli"));

    // Normal veri mesajları: {now, events:[...]}
    es.onmessage = (ev) => {
      setDurum("canli");
      try {
        const veri = JSON.parse(ev.data) as { events?: AkisOlay[] };
        if (veri.events?.length) olaylariEkle(veri.events);
      } catch {
        /* bozuk kare — atla */
      }
    };

    // Hata: bağlantı koptu. EventSource kendiliğinden yeniden bağlanmayı dener.
    es.onerror = () => {
      setDurum("kesildi");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [duraklat, olaylariEkle]);

  /* --------------------------------------------------- Aksiyonlar */
  const temizle = useCallback(() => {
    setAkis([]);
    setSayac({ toplam: 0, engellenen: 0, dogrulanan: 0, izin: 0 });
    setBotDagilim({});
    setSpark([]);
    kovaRef.current = { sn: Math.floor(Date.now() / 1000), adet: 0 };
  }, []);

  /* --------------------------------------------------- Türetilmiş değerler */
  const anlikHiz = spark.length ? spark[spark.length - 1] : 0;
  const ortHiz = useMemo(() => {
    if (!spark.length) return 0;
    const toplam = spark.reduce((a, b) => a + b, 0);
    return toplam / spark.length;
  }, [spark]);

  const botSirali = useMemo(() => {
    const enFazla = Math.max(1, ...Object.values(botDagilim));
    return Object.entries(botDagilim)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ k, v, oran: v / enFazla }));
  }, [botDagilim]);

  const durumRozet =
    durum === "canli"
      ? { ton: "ok" as const, etiket: t("cy.durum.canli"), nabiz: true }
      : durum === "baglaniyor"
      ? { ton: "warn" as const, etiket: t("cy.durum.baglaniyor"), nabiz: true }
      : { ton: "danger" as const, etiket: t("cy.durum.kesildi"), nabiz: true };

  /* --------------------------------------------------- Render */
  return (
    <div className="space-y-6">
      {/* Üst şerit: bağlantı durumu + kontroller */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "grid size-11 place-items-center rounded-2xl transition-colors",
              durum === "canli" ? "bg-ok-soft text-ok" : durum === "baglaniyor" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger2",
            )}
          >
            {durum === "kesildi" ? <WifiOff className="size-5" /> : <RadioTower className="size-5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-ink">{t("cy.serit.baslik")}</h2>
              <DurumRozeti ton={durumRozet.ton} etiket={durumRozet.etiket} nabiz={durumRozet.nabiz} />
            </div>
            <p className="mt-0.5 text-[13px] text-slate-muted">
              {t("cy.serit.aciklama.on")} <span className="font-medium text-slate-ink">{t("cy.serit.aciklama.sse")}</span> {t("cy.serit.aciklama.son")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={duraklat ? "success" : "outline"}
            size="sm"
            onClick={() => setDuraklat((v) => !v)}
          >
            {duraklat ? <Play className="size-4" /> : <Pause className="size-4" />}
            {duraklat ? t("cy.serit.surdur") : t("cy.serit.duraklat")}
          </Button>
          <Button variant="ghost" size="sm" onClick={temizle}>
            <Trash2 className="size-4" />
            {t("cy.serit.temizle")}
          </Button>
        </div>
      </div>

      {/* Canlı sayaçlar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={sayac.toplam}
          etiket={t("cy.sayac.gorulen")}
          ikon={<Activity className="size-4" />}
          tone="brand"
        />
        <StatKart
          sayi={sayac.engellenen}
          etiket={t("cy.sayac.engellenen")}
          ikon={<Ban className="size-4" />}
          tone="danger"
        />
        <StatKart
          sayi={sayac.dogrulanan}
          etiket={t("cy.sayac.dogrulanan")}
          ikon={<ShieldAlert className="size-4" />}
          tone="warn"
        />
        <StatKart
          sayi={anlikHiz}
          etiket={t("cy.sayac.anlik")}
          ikon={<Zap className="size-4" />}
          tone="ok"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol: canlı akış */}
        <Panel
          className="lg:col-span-2"
          baslik={
            <span className="flex items-center gap-2">
              <RadioTower className="size-4 text-brand-600" />
              {t("cy.akis.baslik")}
            </span>
          }
          sagUst={
            <span className="flex items-center gap-1.5 text-[12px] text-slate-faint">
              <Eye className="size-3.5" />
              {t("cy.akis.sonOlay").replace("{n}", String(MAX_AKIS))}
            </span>
          }
        >
          <div className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
            {akis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                  {durum === "canli" ? <Wifi className="size-6 animate-pulse" /> : <RadioTower className="size-6" />}
                </span>
                <p className="text-sm font-medium text-slate-ink">
                  {durum === "canli" ? t("cy.akis.canliBekleniyor") : durum === "baglaniyor" ? t("cy.akis.baglaniyor") : t("cy.akis.yenidenKuruluyor")}
                </p>
                <p className="mt-1 max-w-xs text-[13px] text-slate-muted">
                  {t("cy.akis.aciklama")}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {akis.map((e) => {
                  const stil = VERDICT_STIL[e.verdict || "flagged"] || VERDICT_STIL.flagged;
                  return (
                    <motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -24, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-canvas/40 py-2.5 pl-4 pr-3"
                    >
                      <span className={cn("absolute left-0 top-0 h-full w-1", stil.cizgi)} />
                      <span className="w-[62px] shrink-0 font-mono text-[12px] tabular-nums text-slate-muted">
                        {saatBicim(e.ts)}
                      </span>
                      {e.country && <Ulke kod={e.country} />}
                      <span className="w-[116px] shrink-0 truncate font-mono text-[12.5px] text-slate-ink">
                        {e.ip || "—"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12.5px] text-slate-muted">
                        <Bot className="size-3.5 text-slate-faint" />
                        {botEtiket(e.botClass, dil)}
                      </span>
                      <span className="hidden min-w-0 flex-1 truncate font-mono text-[12px] text-slate-faint md:inline">
                        {e.path || ""}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        {typeof e.score === "number" && (
                          <span className="font-mono text-[11.5px] tabular-nums text-slate-faint">
                            {(e.score * 100).toFixed(0)}
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            stil.pill,
                          )}
                        >
                          {stil.ikon}
                          {e.verdict ? (canliYayinCeviri("verdict." + e.verdict, dil)) : e.verdict}
                        </span>
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </Panel>

        {/* Sağ: hız sparkline + bot dağılımı */}
        <div className="space-y-6">
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-brand-600" />
                {t("cy.hiz.baslik")}
              </span>
            }
          >
            <Sparkline veri={spark} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wide text-slate-faint">{t("cy.hiz.anlik")}</div>
                <div className="mt-0.5 text-lg font-bold text-slate-ink num">{anlikHiz}</div>
                <div className="text-[11px] text-slate-faint">{t("cy.hiz.olaySn")}</div>
              </div>
              <div className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wide text-slate-faint">{t("cy.hiz.ortalama")}</div>
                <div className="mt-0.5 text-lg font-bold text-slate-ink num">{ortHiz.toFixed(1)}</div>
                <div className="text-[11px] text-slate-faint">{t("cy.hiz.sonNsn").replace("{n}", String(spark.length))}</div>
              </div>
            </div>
          </Panel>

          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Globe className="size-4 text-brand-600" />
                {t("cy.dagilim.baslik")}
              </span>
            }
          >
            {botSirali.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-faint">{t("cy.dagilim.bosVeri")}</p>
            ) : (
              <div className="space-y-2.5">
                {botSirali.map(({ k, v, oran }) => (
                  <div key={k}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="font-medium text-slate-ink">{botEtiket(k, dil)}</span>
                      <span className="font-mono tabular-nums text-slate-muted">{v}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                      <motion.div
                        className="h-full rounded-full bg-brand-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${oran * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Dürüstlük / bağlam notu — parçalar çeviriden gelir; kod literali (uç nokta
          adresi) ve strong/code işaretlemesi korunur. */}
      <NotKutusu ton="bilgi" baslik={t("cy.not.baslik")}>
        {t("cy.not.govde.1")} <strong>{t("cy.not.gercekAkis")}</strong>{t("cy.not.govde.2")}{" "}
        <strong>{t("cy.not.sse")}</strong> {t("cy.not.govde.3")}{" "}
        (<code className="rounded bg-white px-1 py-0.5 text-[12px]">/api/live/stream</code>){t("cy.not.govde.4")}{" "}
        <strong>{t("cy.not.sifirdan")}</strong> {t("cy.not.govde.5")}
        <span className="mt-1.5 block text-[12px] text-brand-700/80">
          {t("cy.not.ilkBoyama")
            .replace("{toplam}", String(ilk.toplam))
            .replace("{engellenen}", String(ilk.engellenen))
            .replace("{dogrulanan}", String(ilk.dogrulanan))}
        </span>
      </NotKutusu>
    </div>
  );
}
