"use client";

/**
 * Olay Müdahale Playbook Motoru — istemci (yeniden tasarlandı).
 * =============================================================
 * Operatör aktif bir olay sırasında bir playbook seçer, fazlara ayrılmış
 * adım listesini interaktif bir kontrol listesi olarak yürütür ve ilerlemeyi
 * izler. Adım işaretlemek OTURUM-YERELDIR (localStorage) ve üretimde bir
 * mutasyon YAPMAZ — yalnızca operatörün niyet/ilerleme kaydıdır (net etiketli).
 *
 * Tetik tespiti GERÇEKTIR: sunucudan gelen tetik sayıları gerçek son 500 olayın
 * bot sınıflarından hesaplanır.
 *
 * Tasarım hedefi: premium bir SOC aracı (PagerDuty/Torq) hissi — temiz kart
 * grid'i, ilerleme halkası, faz zaman çizelgesi, ikonlu rozetler, ölçülü
 * framer-motion giriş animasyonları. Tüm veri/mantık playbook.ts'ten gelir;
 * bu dosya yalnızca sunum katmanıdır (playbook.ts DEĞİŞTİRİLMEDİ).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Siren, ShieldAlert, ShieldCheck, Search, Ban, CheckCircle2, Flag,
  Zap, Bot, Cpu, KeyRound, UserX, Radar, ArrowRight, Cog, Hand,
  ExternalLink, RotateCcw, Clock, Circle, Sparkles, AlertTriangle,
  Flame, ListChecks,
} from "lucide-react";
import { Panel, Badge, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { mudahaleCeviri } from "./mudahale.i18n";
import {
  PLAYBOOKLAR, FAZ_SIRA, playbookIlerleme, otomasyonOrani,
  type Playbook, type Faz, type Siddet, type Sorumlu,
} from "./playbook";

/**
 * Çeviri yardımcısı türü — alt bileşenlere prop olarak iletilir.
 * `t(anahtar)` mevcut dile göre çevirir; sayısal enterpolasyon için ikinci
 * argümanla `{n}` gibi yer-tutucular değiştirilir.
 */
type CevirFn = (anahtar: string, ikame?: Record<string, string | number>) => string;

/**
 * Bir şablon metnini `{anahtar}` yer-tutucularından bölerek React düğümleriyle
 * dokur. Vurgulu (bold) segmentleri korumak için kullanılır — düz metin
 * parçaları olduğu gibi, yer-tutucular ise verilen düğümlerle değiştirilir.
 */
function aciklamaParcalari(
  sablon: string,
  dugumler: Record<string, React.ReactNode>,
): React.ReactNode[] {
  const parcalar = sablon.split(/(\{[a-zA-Z]+\})/g);
  return parcalar.map((p, i) => {
    const eslesme = p.match(/^\{([a-zA-Z]+)\}$/);
    if (eslesme && dugumler[eslesme[1]] !== undefined) {
      return <span key={i}>{dugumler[eslesme[1]]}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

/** Bir dil için `t` üreticisi — enterpolasyonu (`{anahtar}` → değer) uygular. */
function cevirYap(dil: Dil): CevirFn {
  return (anahtar, ikame) => {
    let s = mudahaleCeviri(anahtar, dil);
    if (ikame) {
      for (const [k, v] of Object.entries(ikame)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}

/** Sunucudan gelen, gerçek trafiğe bağlı tetik durumu (playbook id başına). */
export interface TetikOzet {
  id: string;
  tetikSayisi: number;
  aktif: boolean;
}

const DEPO_ANAHTAR = "specter.mudahale.v1";

/* ------------------------------------------------------------------ görsel eşlemeler */

const PLAYBOOK_IKON: Record<string, React.ReactNode> = {
  "kimlik-doldurma": <KeyRound className="size-5" />,
  "ddos-sel": <Zap className="size-5" />,
  "kaziyici-kampanya": <Bot className="size-5" />,
  "ai-egitim-tarama": <Cpu className="size-5" />,
  "hesap-ele-gecirme": <UserX className="size-5" />,
  "supheli-otomasyon": <Radar className="size-5" />,
};

/** Şiddet meta: badge tonu, ikon ve vurgu rengi (halka/aksan için). Etiket
 * ENUM GÜVENLİĞİ gereği burada tutulmaz; istemci `t("siddet."+siddet)` ile türetir. */
const SIDDET_META: Record<
  Siddet,
  { ton: "kirmizi" | "sari" | "mavi"; ikon: React.ReactNode; renk: string }
> = {
  kritik: { ton: "kirmizi", ikon: <Flame className="size-3.5" />, renk: "#dc2626" },
  yuksek: { ton: "sari", ikon: <AlertTriangle className="size-3.5" />, renk: "#d97706" },
  orta: { ton: "mavi", ikon: <ShieldAlert className="size-3.5" />, renk: "#2f6fed" },
};

const FAZ_IKON: Record<Faz, React.ReactNode> = {
  tespit: <Search className="size-4" />,
  sınırlama: <ShieldAlert className="size-4" />,
  engelleme: <Ban className="size-4" />,
  doğrulama: <CheckCircle2 className="size-4" />,
  kapanış: <Flag className="size-4" />,
};

const SORUMLU_TON: Record<Sorumlu, "brand" | "mavi" | "sari"> = {
  Specter: "brand",
  Operatör: "mavi",
  "Güvenlik Ekibi": "sari",
};

/* ------------------------------------------------------------------ İlerleme halkası
 * Kompakt dairesel gösterge — kart ve başlık için "gerçek araç" hissi verir. */
function IlerlemeHalka({
  yuzde,
  boyut = 44,
  kalinlik = 4,
  renk = "#4a41e8",
  ustyazi,
}: {
  yuzde: number;
  boyut?: number;
  kalinlik?: number;
  renk?: string;
  ustyazi?: React.ReactNode;
}) {
  const azalt = useReducedMotion();
  const guvenli = Math.max(0, Math.min(100, Number.isFinite(yuzde) ? yuzde : 0));
  const r = 50 - kalinlik * 2;
  const cevre = 2 * Math.PI * r;
  const dolu = (guvenli / 100) * cevre;
  const bitti = guvenli >= 100;
  const cizgi = bitti ? "#16a34a" : renk;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: boyut, height: boyut }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eceae2" strokeWidth={kalinlik} />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={cizgi}
          strokeWidth={kalinlik} strokeLinecap="round" strokeDasharray={cevre}
          initial={azalt ? false : { strokeDashoffset: cevre }}
          animate={{ strokeDashoffset: cevre - dolu }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center leading-none">
        {ustyazi ?? (
          <span className="num text-[11px] font-bold text-slate-ink">
            {bitti ? <CheckCircle2 className="size-4 text-green-600" /> : `%${guvenli}`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ ana bileşen */

export function MudahaleIstemci({ dil, tetikOzet, toplamOlay }: { dil: Dil; tetikOzet: TetikOzet[]; toplamOlay: number }) {
  const azalt = useReducedMotion();
  const t = useMemo(() => cevirYap(dil), [dil]);
  // BCP-47 sayı biçimlendirici (olay sayısı gibi veriler için).
  const nf = useMemo(() => new Intl.NumberFormat(dil), [dil]);
  // Tamamlanan adımlar: playbook id → tamamlanan sıra numaraları.
  const [durum, setDurum] = useState<Record<string, number[]>>({});
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [yuklendi, setYuklendi] = useState(false);

  // localStorage'dan yükle.
  useEffect(() => {
    try {
      const ham = localStorage.getItem(DEPO_ANAHTAR);
      if (ham) setDurum(JSON.parse(ham));
    } catch { /* yok say */ }
    setYuklendi(true);
  }, []);

  // Değişince kaydet.
  useEffect(() => {
    if (!yuklendi) return;
    try { localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(durum)); } catch { /* yok say */ }
  }, [durum, yuklendi]);

  // Tetik durumunu id ile hızlı eriş.
  const tetikHarita = useMemo(() => {
    const m = new Map<string, TetikOzet>();
    for (const t of tetikOzet) m.set(t.id, t);
    return m;
  }, [tetikOzet]);

  // Playbook'ları tetik sayısına göre sırala (aktif olanlar üstte).
  const siraliPlaybooklar = useMemo(() => {
    return [...PLAYBOOKLAR].sort((a, b) => {
      const ta = tetikHarita.get(a.id)?.tetikSayisi ?? 0;
      const tb = tetikHarita.get(b.id)?.tetikSayisi ?? 0;
      return tb - ta;
    });
  }, [tetikHarita]);

  const aktifSayi = tetikOzet.filter((t) => t.aktif).length;
  const enAcil = siraliPlaybooklar.find((p) => tetikHarita.get(p.id)?.aktif) ?? null;

  // Yürütülmekte olan (0 < ilerleme < 100) playbook sayısı — üst şeritte gösterilir.
  const yurutulenSayi = useMemo(
    () =>
      PLAYBOOKLAR.filter((p) => {
        const y = playbookIlerleme(p, durum[p.id] ?? []).yuzde;
        return y > 0 && y < 100;
      }).length,
    [durum],
  );

  const secili = useMemo(
    () => PLAYBOOKLAR.find((p) => p.id === seciliId) ?? null,
    [seciliId],
  );

  function adimToggle(pbId: string, sira: number) {
    setDurum((d) => {
      const mevcut = d[pbId] ?? [];
      const yeni = mevcut.includes(sira) ? mevcut.filter((s) => s !== sira) : [...mevcut, sira];
      return { ...d, [pbId]: yeni };
    });
  }

  function sifirla(pbId: string) {
    setDurum((d) => ({ ...d, [pbId]: [] }));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Siren className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {/* Bold segmentleri korumak için cümle yer-tutuculardan yeniden kurulur;
                metin dile göre değişir, vurgular ({fazlar}/{simdi}/{gercek}) inline gelir. */}
            {aciklamaParcalari(
              t("aciklama.metin", { n: nf.format(toplamOlay) }),
              {
                fazlar: <b key="f">{t("aciklama.fazlar")}</b>,
                simdi: <b key="s">{t("aciklama.simdi")}</b>,
                gercek: <b key="g">{t("aciklama.gercek")}</b>,
              },
            )}
          </p>
        </div>
      </div>

      {/* AKTİF OLAY banner'ı */}
      {enAcil && (
        <motion.div
          initial={azalt ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-red-200 bg-danger-soft px-5 py-4"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-danger2" />
          <div className="flex items-start gap-3 pl-1.5">
            <span className="relative mt-0.5 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger2 opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-danger2" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                {t("banner.tespit", { ad: t(`pb.${enAcil.id}.tetikleyici`) })}
              </p>
              <p className="mt-0.5 text-[13px] text-red-700">
                {t("banner.eslesen", {
                  n: nf.format(tetikHarita.get(enAcil.id)?.tetikSayisi ?? 0),
                  ad: t(`pb.${enAcil.id}.ad`),
                })}
              </p>
            </div>
          </div>
          <Button size="sm" variant="danger" onClick={() => setSeciliId(enAcil.id)}>
            {t("banner.ac")} <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}

      {/* özet şeridi — kompakt, ikonlu metrik kartları */}
      <div className="grid gap-4 sm:grid-cols-3">
        <OzetKart
          ikon={<ShieldCheck className="size-5" />}
          sayi={PLAYBOOKLAR.length}
          etiket={t("ozet.hazir")}
          ton="brand"
        />
        <OzetKart
          ikon={<Siren className="size-5" />}
          sayi={aktifSayi}
          etiket={t("ozet.tetiklenen")}
          ton={aktifSayi > 0 ? "danger" : "ok"}
          nabiz={aktifSayi > 0}
        />
        <OzetKart
          ikon={<ListChecks className="size-5" />}
          sayi={yurutulenSayi}
          etiket={t("ozet.yurutulen")}
          ton={yurutulenSayi > 0 ? "warn" : "gri"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* playbook kataloğu — kart grid'i */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-semibold text-slate-ink">{t("katalog.baslik")}</h3>
            <span className="num text-[12px] text-slate-faint">{t("katalog.runbook", { n: PLAYBOOKLAR.length })}</span>
          </div>
          <div className="space-y-3">
            {siraliPlaybooklar.map((p, i) => {
              const tr = tetikHarita.get(p.id);
              const sm = SIDDET_META[p.siddet];
              const ilerleme = playbookIlerleme(p, durum[p.id] ?? []);
              const seciliMi = p.id === seciliId;
              const basladi = ilerleme.yuzde > 0;
              return (
                <motion.button
                  key={p.id}
                  initial={azalt ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.24) }}
                  onClick={() => setSeciliId(p.id)}
                  className={cn(
                    "group w-full rounded-2xl border bg-surface p-4 text-left transition",
                    seciliMi
                      ? "border-brand-400 ring-4 ring-brand-100"
                      : "border-line hover:border-line-strong hover:bg-canvas hover:shadow-card",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl transition",
                        tr?.aktif ? "bg-danger-soft text-danger2" : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
                      )}
                    >
                      {PLAYBOOK_IKON[p.id]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-ink">{t(`pb.${p.id}.ad`)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-faint">{t(`pb.${p.id}.tetikleyici`)}</p>
                    </div>
                    {basladi && (
                      <IlerlemeHalka yuzde={ilerleme.yuzde} boyut={38} kalinlik={5} renk={sm.renk} />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge ton={sm.ton}>{sm.ikon} {t(`siddet.${p.siddet}`)}</Badge>
                    <Badge ton="gri">{t("katalog.adim", { n: p.adimlar.length })}</Badge>
                    <Badge ton="gri"><Clock className="size-3" /> {t("katalog.sure", { n: p.tahminiSure })}</Badge>
                    {tr?.aktif && (
                      <Badge ton="kirmizi"><Siren className="size-3" /> {t("katalog.tetikleniyor", { n: tr.tetikSayisi })}</Badge>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* çalıştırıcı */}
        <div>
          {secili ? (
            <PlaybookCalistirici
              key={secili.id}
              t={t}
              playbook={secili}
              tamamlanan={durum[secili.id] ?? []}
              tetik={tetikHarita.get(secili.id)}
              onToggle={(sira) => adimToggle(secili.id, sira)}
              onSifirla={() => sifirla(secili.id)}
            />
          ) : (
            <BosSecim t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ özet kartı */

function OzetKart({
  ikon, sayi, etiket, ton, nabiz,
}: {
  ikon: React.ReactNode;
  sayi: string | number;
  etiket: string;
  ton: "brand" | "danger" | "ok" | "warn" | "gri";
  nabiz?: boolean;
}) {
  const stil: Record<string, { kutu: string; sayi: string }> = {
    brand: { kutu: "bg-brand-50 text-brand-600", sayi: "text-slate-ink" },
    danger: { kutu: "bg-danger-soft text-danger2", sayi: "text-danger2" },
    ok: { kutu: "bg-ok-soft text-green-700", sayi: "text-slate-ink" },
    warn: { kutu: "bg-warn-soft text-amber-700", sayi: "text-amber-700" },
    gri: { kutu: "bg-slate-100 text-slate-500", sayi: "text-slate-ink" },
  };
  const s = stil[ton];
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5">
      <span className={cn("relative grid size-11 shrink-0 place-items-center rounded-2xl", s.kutu)}>
        {nabiz && <span className="absolute inline-flex size-full animate-ping rounded-2xl bg-danger2/30" />}
        <span className="relative">{ikon}</span>
      </span>
      <div className="min-w-0">
        <div className={cn("num text-3xl font-bold leading-none", s.sayi)}>{sayi}</div>
        <p className="mt-1 truncate text-[13px] text-slate-muted">{etiket}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ boş seçim */

function BosSecim({ t }: { t: CevirFn }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Siren className="size-7" />
      </span>
      <h3 className="text-lg font-semibold text-slate-ink">{t("bos.baslik")}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-muted">
        {t("bos.metin")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {FAZ_SIRA.map((faz, i) => (
          <div key={faz} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-500">
              {FAZ_IKON[faz]} {t(`faz.${faz}`)}
            </span>
            {i < FAZ_SIRA.length - 1 && <ArrowRight className="size-3.5 text-slate-300" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ çalıştırıcı */

function PlaybookCalistirici({
  t, playbook, tamamlanan, tetik, onToggle, onSifirla,
}: {
  t: CevirFn;
  playbook: Playbook;
  tamamlanan: number[];
  tetik?: TetikOzet;
  onToggle: (sira: number) => void;
  onSifirla: () => void;
}) {
  const azalt = useReducedMotion();
  const ilerleme = useMemo(() => playbookIlerleme(playbook, tamamlanan), [playbook, tamamlanan]);
  const oto = useMemo(() => otomasyonOrani(playbook), [playbook]);
  const tamamSet = useMemo(() => new Set(tamamlanan), [tamamlanan]);
  const sm = SIDDET_META[playbook.siddet];

  // Aktif faz: sıradaki adımın fazı (hepsi bittiyse "kapanış").
  const aktifFaz: Faz = ilerleme.sonrakiAdim?.faz ?? "kapanış";

  // Adımları faza göre grupla (faz sırasında).
  const fazGruplari = useMemo(
    () => FAZ_SIRA.map((faz) => ({ faz, adimlar: playbook.adimlar.filter((a) => a.faz === faz) })).filter((g) => g.adimlar.length > 0),
    [playbook],
  );

  const bitenSayi = playbook.adimlar.length - ilerleme.kalanAdim;

  return (
    <div className="space-y-5">
      {/* başlık kartı */}
      <Panel padding>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* ilerleme halkası + ikon overlay */}
            <div className="relative grid shrink-0 place-items-center">
              <IlerlemeHalka yuzde={ilerleme.yuzde} boyut={64} kalinlik={5} renk={sm.renk} ustyazi={<span />} />
              <span
                className={cn(
                  "absolute grid size-9 place-items-center rounded-xl",
                  tetik?.aktif ? "bg-danger-soft text-danger2" : "bg-brand-50 text-brand-600",
                )}
              >
                {PLAYBOOK_IKON[playbook.id]}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-ink">{t(`pb.${playbook.id}.ad`)}</h2>
                <Badge ton={sm.ton}>{sm.ikon} {t(`siddet.${playbook.siddet}`)}</Badge>
                {tetik?.aktif && (
                  <Badge ton="kirmizi"><Siren className="size-3" /> {t("cal.aktif", { n: tetik.tetikSayisi })}</Badge>
                )}
              </div>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-muted">{t(`pb.${playbook.id}.aciklama`)}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onSifirla}>
            <RotateCcw className="size-4" /> {t("cal.sifirla")}
          </Button>
        </div>

        {/* metrik şeridi */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetrikKutu
            ikon={<ListChecks className="size-3.5" />}
            etiket={t("cal.metrik.ilerleme")}
            deger={`${bitenSayi}/${playbook.adimlar.length}`}
            altyazi={ilerleme.yuzde === 100 ? t("cal.metrik.ilerleme.tamam") : t("cal.metrik.ilerleme.kaldi", { n: ilerleme.kalanAdim })}
            renk={ilerleme.yuzde === 100 ? "#16a34a" : sm.renk}
            barYuzde={ilerleme.yuzde}
          />
          <MetrikKutu
            ikon={<Cog className="size-3.5" />}
            etiket={t("cal.metrik.otomasyon")}
            deger={`%${oto.yuzde}`}
            altyazi={t("cal.metrik.otomasyon.alt", { oto: oto.otomatik, manuel: oto.manuel })}
            renk="#4a41e8"
            barYuzde={oto.yuzde}
          />
          <MetrikKutu
            ikon={<Clock className="size-3.5" />}
            etiket={t("cal.metrik.sure")}
            deger={t("cal.metrik.sure.deger", { n: playbook.tahminiSure })}
            altyazi={t("cal.metrik.sure.alt", { n: playbook.adimlar.length })}
          />
        </div>

        {/* faz zaman çizelgesi — bağlı segmentli timeline */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-faint">
            <span className="uppercase tracking-wide">{t("cal.fazakisi")}</span>
          </div>
          <div className="flex items-center">
            {FAZ_SIRA.map((faz, i) => {
              const bitti = ilerleme.tamamlananFaz.includes(faz);
              const aktifMi = faz === aktifFaz && ilerleme.yuzde < 100;
              return (
                <div key={faz} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-full ring-1 transition",
                        bitti
                          ? "bg-ok text-white ring-ok"
                          : aktifMi
                            ? "bg-brand-600 text-white ring-brand-600 shadow-[0_0_0_4px] shadow-brand-100"
                            : "bg-surface text-slate-400 ring-line-strong",
                      )}
                    >
                      {bitti ? <CheckCircle2 className="size-4" /> : FAZ_IKON[faz]}
                    </span>
                    <span
                      className={cn(
                        "whitespace-nowrap text-[11px] font-medium",
                        bitti ? "text-green-700" : aktifMi ? "text-brand-700" : "text-slate-400",
                      )}
                    >
                      {t(`faz.${faz}`)}
                    </span>
                  </div>
                  {i < FAZ_SIRA.length - 1 && (
                    <div className="mx-1 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", bitti ? "w-full bg-ok" : "w-0")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* dürüstlük etiketi */}
      <NotKutusu ton="sari" baslik={t("not.baslik")}>
        {t("not.metin.a")} <b>{t("not.metin.b")}</b> {t("not.metin.c")}
      </NotKutusu>

      {/* adım kontrol listesi (faza göre) */}
      <div className="space-y-4">
        {fazGruplari.map(({ faz, adimlar }, gi) => {
          const fazBitti = ilerleme.tamamlananFaz.includes(faz);
          const fazAktif = faz === aktifFaz && ilerleme.yuzde < 100;
          const fazBiten = adimlar.filter((a) => tamamSet.has(a.sira)).length;
          return (
            <motion.div
              key={faz}
              initial={azalt ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(gi * 0.05, 0.2) }}
              className={cn(
                "overflow-hidden rounded-3xl border bg-surface transition",
                fazAktif ? "border-brand-200 shadow-card" : "border-line",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-5 py-3.5",
                  fazBitti ? "bg-ok-soft/40" : fazAktif ? "bg-brand-50/50" : "bg-canvas/30",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-xl",
                      fazBitti ? "bg-ok text-white" : fazAktif ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {fazBitti ? <CheckCircle2 className="size-4" /> : FAZ_IKON[faz]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-ink">{t(`faz.${faz}`)}</span>
                      {fazAktif && <Badge ton="brand"><Sparkles className="size-3" /> {t("faz.suanki")}</Badge>}
                      {fazBitti && <Badge ton="yesil"><CheckCircle2 className="size-3" /> {t("faz.tamam")}</Badge>}
                    </div>
                  </div>
                </div>
                <span className="num text-[12px] font-medium text-slate-faint">
                  {fazBiten}/{adimlar.length}
                </span>
              </div>

              <ul className="divide-y divide-line">
                {adimlar.map((a) => {
                  const bitti = tamamSet.has(a.sira);
                  return (
                    <li
                      key={a.sira}
                      className={cn("flex gap-3.5 px-5 py-4 transition", bitti && "bg-ok-soft/20")}
                    >
                      <button
                        onClick={() => onToggle(a.sira)}
                        aria-pressed={bitti}
                        aria-label={bitti ? t("adim.isaretKaldir") : t("adim.isaretle")}
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition active:scale-90",
                          bitti
                            ? "border-ok bg-ok text-white"
                            : "border-line-strong bg-surface text-transparent hover:border-brand-400 hover:bg-brand-50",
                        )}
                      >
                        {bitti ? <CheckCircle2 className="size-4" /> : <Circle className="size-3 opacity-0" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="num text-[11px] font-semibold text-slate-faint">#{a.sira}</span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              bitti ? "text-slate-muted line-through" : "text-slate-ink",
                            )}
                          >
                            {t(`pb.${playbook.id}.s${a.sira}.baslik`)}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{t(`pb.${playbook.id}.s${a.sira}.aksiyon`)}</p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <Badge ton={a.otomatik ? "brand" : "gri"}>
                            {a.otomatik ? <Cog className="size-3" /> : <Hand className="size-3" />}
                            {a.otomatik ? t("adim.otomatik") : t("adim.manuel")}
                          </Badge>
                          <Badge ton={SORUMLU_TON[a.sorumlu]}>{t(`sorumlu.${a.sorumlu}`)}</Badge>
                          <Badge ton="gri"><Clock className="size-3" /> {t("adim.dk", { n: a.tahminiDk })}</Badge>
                          {a.ilgiliPanel && (
                            <Link
                              href={a.ilgiliPanel}
                              className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-medium text-slate-ink transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                            >
                              <ExternalLink className="size-3" /> {t("adim.ilgiliPanel")}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {ilerleme.yuzde === 100 && (
        <motion.div
          initial={azalt ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-ok-soft px-5 py-4"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ok text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-green-800">{t("bitti.baslik")}</p>
            <p className="mt-0.5 text-[13px] text-green-700">
              {t("bitti.metin")}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ metrik kutusu
 * Başlık kartındaki üç metrik için tutarlı, mini-bar destekli kompakt kutu. */
function MetrikKutu({
  ikon, etiket, deger, altyazi, renk, barYuzde,
}: {
  ikon: React.ReactNode;
  etiket: string;
  deger: string;
  altyazi: string;
  renk?: string;
  barYuzde?: number;
}) {
  const azalt = useReducedMotion();
  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] text-slate-muted">{ikon} {etiket}</span>
        <span className="num text-sm font-bold" style={{ color: renk ?? "#2a2a28" }}>{deger}</span>
      </div>
      {typeof barYuzde === "number" ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full"
            style={{ background: renk ?? "#4a41e8" }}
            initial={azalt ? false : { width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, barYuzde))}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      ) : (
        <div className="mt-2 h-1.5" />
      )}
      <p className="mt-1.5 text-[11px] text-slate-faint">{altyazi}</p>
    </div>
  );
}
