"use client";

/**
 * Specter — Tehdit Avı (Threat Hunting)
 * =====================================
 * SIEM-tarzı sorgulanabilir olay dili. Analist ham olayları serbestçe sorgular:
 *   botClass:scraper AND country:RU
 *   score<0.3 AND verdict:blocked
 *   headless:true OR tls:true
 * Dil: `alan:değer` (içerir/eşittir), `alan>N` / `alan<N` (sayısal), tırnaklı
 * değerler, AND/OR. Hazır av şablonları tek tıkla çalışır. Bu bölüm örnek bir
 * sorgunun GERÇEK sonucunu (kaç eşleşme, örnek olaylar, dağılım özeti) gösterir
 * ve hazır şablonları listeler.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `tehdit-avi` motorundan (tehditAvi +
 * AV_SABLONLARI) türetilir; SERVER'da çalıştırılıp buraya hazır AvGoster prop
 * gelir.
 *
 * GÖRSEL DİL: "av terminali" — bulgu-şiddet DONUT + kapsama/tespit GAUGE + av
 * şablonları renkli KART IZGARASI (monoton bar/liste değil). framer-motion rise
 * (azHareket → sade). whileInView / viewport / opacity-fade YOK.
 */

import { motion } from "framer-motion";
import {
  Search,
  Terminal,
  Boxes,
  Server,
  Globe,
  Bot,
  Ban,
  Filter,
  ShieldCheck,
  Crosshair,
  Target,
  Radar,
  KeyRound,
  Cpu,
  Sparkles,
  Worm,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, Ulke } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge } from "@/components/panel/grafikler-ek";
import type { AvSonuc } from "@/lib/specter/tehdit-avi";

/* ================================================================== Tipler */

/** Server'da hesaplanan tek av örneği: sorgu + sonuç. */
export interface AvGoster {
  sorgu: string;
  aciklama: string;
  sonuc: AvSonuc;
}

/** Hazır şablon (motorun AV_SABLONLARI'ndan). */
export interface AvSablon {
  ad: string;
  sorgu: string;
  aciklama: string;
  eslesme: number;
}

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

const BOT_ETIKET: Record<string, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam",
  bot: "Bot", crawler: "Tarayıcı",
};

const VERDICT_TON: Record<string, "kirmizi" | "yesil" | "sari" | "gri"> = {
  blocked: "kirmizi", allowed: "yesil", challenged: "sari",
};
const VERDICT_AD: Record<string, string> = {
  blocked: "Engellendi", allowed: "İzin", challenged: "Doğrulandı", flagged: "İşaretlendi",
};

/** Karar → donut segment rengi (şiddet). */
const KARAR_RENK: Record<string, string> = {
  blocked: "#dc2626", challenged: "#d97706", allowed: "#16a34a", flagged: "#2f6fed",
};

/**
 * Bir av şablonunun sorgusundan kategori kimliği çıkar (renk + ikon). Motor
 * kategori vermiyor; sorgu içeriğinden dürüst çıkarım yapılır.
 */
function sablonKategori(s: AvSablon): { ad: string; hex: string; soft: string; ikon: React.ElementType } {
  const q = `${s.sorgu} ${s.ad}`.toLowerCase();
  if (/credential|kimlik|login/.test(q)) return { ad: "Hesap ele geçirme", hex: "#db2777", soft: "#fce8f1", ikon: KeyRound };
  if (/ai_agent|ai ajan/.test(q)) return { ad: "AI trafiği", hex: "#0891b2", soft: "#e2f5f9", ikon: Sparkles };
  if (/headless|puppeteer|playwright/.test(q)) return { ad: "Headless bot", hex: "#7c3aed", soft: "#f1ebfe", ikon: Cpu };
  if (/tls|sahte|fake/.test(q)) return { ad: "Sahte tarayıcı", hex: "#dc2626", soft: "#fdeaea", ikon: ShieldCheck };
  if (/python|curl|go-http|araç/.test(q)) return { ad: "Araç trafiği", hex: "#d97706", soft: "#fdf1e3", ikon: Worm };
  if (/score|skor|blocked|engellenen/.test(q)) return { ad: "Yüksek güven engel", hex: "#ea580c", soft: "#fdeee3", ikon: Ban };
  return { ad: "Genel av", hex: "#2f6fed", soft: "#eaf1fe", ikon: Target };
}

/** Path'i karta sığacak şekilde kısalt. */
function pathKisa(p: string, uzunluk = 32): string {
  if (!p) return "—";
  return p.length <= uzunluk ? p : `${p.slice(0, uzunluk - 1)}…`;
}

/** Bölümü rise ile saran motion sarmalayıcı. */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Ferah KPI */

/** Büyük, ferah üst-özet KPI kartı — sol renkli ikon çipi + iri sayı. */
function KpiKart({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  hex,
  soft,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  hex: string;
  soft: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: soft, color: hex }}>
        <Ikon className="size-[22px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none num text-slate-ink">{deger}</span>
          {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== Dağılım pili */

/** Bir alan dağılımını (ör. ülkeler) küçük etiket-sayı çipleri olarak gösterir. */
function DagilimSerit({
  etiket,
  ikon: Ikon,
  ogeler,
  ulke = false,
}: {
  etiket: string;
  ikon: React.ElementType;
  ogeler: { ad: string; sayi: number }[];
  ulke?: boolean;
}) {
  if (ogeler.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </span>
      {ogeler.slice(0, 5).map((o) => (
        <span
          key={o.ad}
          className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-muted ring-1 ring-inset ring-line"
        >
          {ulke ? <Ulke kod={o.ad} /> : <span className="truncate max-w-[120px]">{BOT_ETIKET[o.ad] ?? o.ad}</span>}
          <span className="tabular-nums text-slate-ink">{sayi(o.sayi)}</span>
        </span>
      ))}
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function TehditAviBolumu({
  av,
  sablonlar,
  azHareket,
}: {
  av: AvGoster;
  sablonlar: AvSablon[];
  azHareket: boolean;
}) {
  const { sorgu, aciklama, sonuc } = av;
  const ornekler = sonuc.eslesmeler.slice(0, 6);
  const varEslesme = sonuc.eslesme > 0;

  // Kapsama/tespit oranları (Gauge). toplam 0 olamaz mantıken ama koru.
  const toplamGuvenli = Math.max(1, sonuc.toplam);
  const kapsamaOran = Math.min(100, Math.round((sonuc.eslesme / toplamGuvenli) * 100));
  // Şablonların "canlı bulgu" oranı — kaç şablon eşleşme buldu.
  const canliSablon = sablonlar.filter((s) => s.eslesme > 0).length;
  const sablonTespitOran = sablonlar.length
    ? Math.round((canliSablon / sablonlar.length) * 100)
    : 0;

  // Bulgu şiddet donutu — sonuç kümesinin karar (verdict) dağılımı.
  const kararSegmentleri = sonuc.ozet.kararlar
    .map((k) => ({
      etiket: VERDICT_AD[k.ad] ?? k.ad,
      deger: k.sayi,
      renk: KARAR_RENK[k.ad] ?? "#6b6a63",
    }))
    .filter((s) => s.deger > 0);

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Crosshair} metin="Tehdit Avı" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{sayi(sonuc.toplam)} olay taranıyor</span>
            <Badge ton="brand">
              <Search className="size-3" />
              SIEM Sorgu
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          <span className="font-medium text-slate-ink">Ham olayları SIEM-tarzı bir sorgu diliyle avla.</span>{" "}
          <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[11.5px] text-slate-ink ring-1 ring-inset ring-line">alan:değer</code>{" "}
          içerir/eşittir, <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[11.5px] text-slate-ink ring-1 ring-inset ring-line">alan&gt;N</code>{" "}
          sayısal, AND/OR birleştirir. Analist bir hipotezi saniyeler içinde binlerce olaya karşı test eder.
        </p>

        {/* Ferah üst-özet KPI'ları */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiKart ikon={Target} etiket="Eşleşme" deger={sayi(sonuc.eslesme)} ek="bulgu" hex="#dc2626" soft="#fdeaea" />
          <KpiKart ikon={Server} etiket="Benzersiz IP" deger={sayi(sonuc.ozet.benzersizIp)} hex="#2f6fed" soft="#eaf1fe" />
          <KpiKart ikon={Bot} etiket="Sınıf çeşidi" deger={sayi(sonuc.ozet.sinifis.length)} hex="#7c3aed" soft="#f1ebfe" />
          <KpiKart ikon={Radar} etiket="Aktif şablon" deger={`${canliSablon}/${sablonlar.length}`} ek="bulgulu" hex="#0891b2" soft="#e2f5f9" />
        </div>

        {/* Çalışan örnek sorgu — av terminali */}
        <div className="mt-4 rounded-2xl border border-line bg-canvas/40 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            <Terminal className="size-3" />
            Çalıştırılan sorgu
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-900 px-3 py-2 font-mono text-[12.5px] text-emerald-300">
              {sorgu}
            </code>
            <span
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-[12.5px] font-semibold tabular-nums",
                varEslesme ? "bg-danger-soft text-danger2" : "bg-ok-soft text-ok",
              )}
            >
              {sayi(sonuc.eslesme)} eşleşme
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-muted">{aciklama}</p>
        </div>

        {/* GÖRSEL PANEL: şiddet donut + kapsama/tespit gauge */}
        {varEslesme && (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {/* Bulgu şiddet donutu */}
            <div className="rounded-2xl border border-line bg-canvas/40 p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                <Ban className="size-3" />
                Bulgu şiddeti — eşleşen olayların karar dağılımı
              </div>
              {kararSegmentleri.length > 0 ? (
                <DonutDagilim segmentler={kararSegmentleri} />
              ) : (
                <p className="py-6 text-center text-[12px] text-slate-faint">Karar dağılımı yok</p>
              )}
            </div>

            {/* Kapsama + tespit gauge ikilisi */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                  <Filter className="size-3" />
                  Av kapsaması
                </span>
                <Gauge deger={kapsamaOran} etiket="olay havuzu" boyut={132} renk="#dc2626" />
                <p className="mt-1 text-center text-[11px] leading-snug text-slate-muted">
                  Tüm olayların %{kapsamaOran}'i bu sorguyla işaretlendi.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
                  <Radar className="size-3" />
                  Şablon tespiti
                </span>
                <Gauge deger={sablonTespitOran} etiket="canlı bulgu" boyut={132} renk="#2f6fed" />
                <p className="mt-1 text-center text-[11px] leading-snug text-slate-muted">
                  {canliSablon}/{sablonlar.length} hazır av şablonu şu an bulgu üretiyor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sonuç dağılımı */}
        {varEslesme && (
          <div className="mt-3 space-y-2.5 rounded-2xl border border-line bg-canvas/40 p-4">
            <DagilimSerit etiket="Ülkeler" ikon={Globe} ogeler={sonuc.ozet.ulkeler} ulke />
            <DagilimSerit etiket="Bot sınıfı" ikon={Bot} ogeler={sonuc.ozet.sinifis} />
          </div>
        )}

        {/* Örnek eşleşen olaylar */}
        {ornekler.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Filter className="size-3" />
              Örnek eşleşen olaylar
            </div>
            <div className="overflow-hidden rounded-2xl border border-line">
              {ornekler.map((e, i) => (
                <div
                  key={e.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5",
                    i > 0 && "border-t border-line",
                  )}
                >
                  <span className="w-32 shrink-0 truncate font-mono text-[12px] font-medium text-slate-ink">{e.ip}</span>
                  <Ulke kod={e.country} />
                  <span className="text-[12px] text-slate-muted">{BOT_ETIKET[e.botClass] ?? e.botClass}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-slate-faint" title={e.path}>
                    {pathKisa(e.path)}
                  </span>
                  <span className="shrink-0 text-[11.5px] tabular-nums text-slate-faint">skor {e.score.toFixed(2)}</span>
                  <Badge ton={VERDICT_TON[e.verdict] ?? "gri"}>{VERDICT_AD[e.verdict] ?? e.verdict}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-line py-10 text-center">
            <ShieldCheck className="mb-2 size-7 text-ok" />
            <p className="text-[13px] font-medium text-slate-muted">Bu sorgu için eşleşen olay yok</p>
            <p className="mt-0.5 text-[12px] text-slate-faint">Farklı bir av şablonu deneyerek olay kümesini sorgula.</p>
          </div>
        )}

        {/* Hazır av şablonları — kategori-renkli KART IZGARASI */}
        {sablonlar.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Search className="size-3" />
              Hazır av şablonları — tek tıkla sorgu
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {sablonlar.map((s) => {
                const kat = sablonKategori(s);
                const Ikon = kat.ikon;
                const canli = s.eslesme > 0;
                return (
                  <div
                    key={s.ad}
                    className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-surface p-3.5 transition hover:-translate-y-0.5 hover:shadow-card"
                    style={{ borderColor: `${kat.hex}33` }}
                  >
                    {/* üst renkli şerit */}
                    <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: kat.hex }} />
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: kat.soft, color: kat.hex }}
                      >
                        <Ikon className="size-[18px]" />
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                          canli ? "text-white" : "bg-canvas text-slate-faint ring-1 ring-inset ring-line",
                        )}
                        style={canli ? { background: kat.hex } : undefined}
                      >
                        {canli && <Target className="size-3" />}
                        {sayi(s.eslesme)} bulgu
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-ink">{s.ad}</p>
                      <p
                        className="mt-0.5 text-[10.5px] font-medium uppercase tracking-wide"
                        style={{ color: kat.hex }}
                      >
                        {kat.ad}
                      </p>
                      <code className="mt-1 block truncate rounded-md bg-canvas px-1.5 py-1 font-mono text-[10.5px] text-slate-muted ring-1 ring-inset ring-line" title={s.sorgu}>
                        {s.sorgu}
                      </code>
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-muted">{s.aciklama}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </Bolum>
  );
}
