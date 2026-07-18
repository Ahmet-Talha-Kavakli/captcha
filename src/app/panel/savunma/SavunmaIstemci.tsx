"use client";

/**
 * Savunma Katmanları (Defense Layers Overview) — istemci görünümü.
 * ===============================================================
 * Specter'ın 4 katmanlı savunmasını (Ghost-Font, Honeypot, Tarayıcı
 * Tutarlılık, İşlem Kanıtı) tek premium ekranda gösterir: özet kartlar,
 * katman-yığını görselleştirmesi, katmanlı-savunma açıklayıcısı ve dürüstlük
 * notu. Tüm metin t() ile 5 dile bağlanır; sayılar Intl (SV_YEREL) ile
 * yerele-duyarlı biçimlenir. prefers-reduced-motion saygı görür.
 */
import { motion, useReducedMotion } from "framer-motion";
import {
  ScanEye, Bug, Fingerprint, Cpu, ShieldCheck, Layers, Info,
  ArrowUpRight, Activity, Gauge, Radar, Lock,
} from "lucide-react";
import { Panel, StatKart, Badge, Ilerleme, Tooltip } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  ZORLUK_TON,
  type SavunmaGenel, type SavunmaKatman, type KatmanId,
} from "@/lib/specter/savunma-katmanlari";
import { savunmaCeviri, SV_YEREL } from "./savunma.i18n";

/** Katman-id → ikon bileşeni (görev spesine göre). */
const KATMAN_IKON: Record<KatmanId, typeof ScanEye> = {
  "ghost-font": ScanEye,
  honeypot: Bug,
  tutarlilik: Fingerprint,
  pow: Cpu,
};

/** Katman-id → ilgili katmanın kendi panel rotası. */
const KATMAN_ROTA: Record<KatmanId, string> = {
  "ghost-font": "/panel/ocr-kanit",
  honeypot: "/panel/tuzak",
  tutarlilik: "/panel/tutarlilik",
  pow: "/panel/is-kaniti",
};

/** ZORLUK_TON değeri ("sari"|"kirmizi"|"brand") → Badge tonu. */
const BADGE_TON: Record<(typeof ZORLUK_TON)[keyof typeof ZORLUK_TON], "sari" | "kirmizi" | "brand"> = {
  sari: "sari",
  kirmizi: "kirmizi",
  brand: "brand",
};

/** ZORLUK_TON değeri → Ilerleme çubuğu tonu. */
const ILERLEME_TON: Record<(typeof ZORLUK_TON)[keyof typeof ZORLUK_TON], "brand" | "warn" | "danger"> = {
  sari: "warn",
  kirmizi: "danger",
  brand: "brand",
};

/** Katman-id → kart aksan zemin/metin sınıfları (ikon rozeti için). */
const KATMAN_AKSAN: Record<KatmanId, string> = {
  "ghost-font": "bg-brand-50 text-brand-600 ring-brand-100",
  honeypot: "bg-danger-soft text-red-600 ring-red-200",
  tutarlilik: "bg-warn-soft text-amber-600 ring-amber-200",
  pow: "bg-blue-50 text-blue-600 ring-blue-200",
};

export function SavunmaIstemci({ genel, dil }: { genel: SavunmaGenel; dil: Dil }) {
  const azalt = useReducedMotion();
  const t = (k: string) => savunmaCeviri(k, dil);
  const loc = SV_YEREL[dil];
  const sayi = (n: number) => n.toLocaleString(loc);
  const ondalik = (n: number, d = 1) => n.toLocaleString(loc, { maximumFractionDigits: d });

  // Sağlık skoru tonu (sağlıklı → ok, orta → warn).
  const saglikTon: "ok" | "warn" | "brand" =
    genel.saglik >= 85 ? "ok" : genel.saglik >= 70 ? "brand" : "warn";

  // Katman-derinliği notu (rozet açıklaması) — {n} yer tutucusu doldurulur.
  // Sayaçlar gerçek katman-hit verisinden geliyorsa dürüst "gerçek" notunu,
  // yoksa (eski olaylar) "çıkarımsal" notunu göster.
  const notMetni = (genel.gercekVeri ? t("sv.notGercek") : t("sv.not")).replace("{n}", sayi(genel.toplamOlay));

  const gir = (i: number) =>
    azalt
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* Açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("sv.katmanlar.baslik")}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-muted">{t("sv.aciklama")}</p>
        </div>
      </div>

      {/* Özet kartlar (4 stat) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={sayi(genel.toplamOlay)}
          etiket={t("sv.stat.toplamOlay")}
          ikon={<Activity className="size-5" />}
          tone="brand"
        />
        <StatKart
          sayi={sayi(genel.toplamYakalanan)}
          etiket={t("sv.stat.yakalanan")}
          ikon={<Radar className="size-5" />}
          tone={genel.toplamYakalanan > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ondalik(genel.ortDerinlik)}
          etiket={t("sv.stat.derinlik")}
          ikon={<Layers className="size-5" />}
          tone="brand"
        />
        {/* Sağlık: büyük skor + halka yerine kompakt yüzde-çubuk */}
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-faint"><Gauge className="size-5" /></span>
              <span
                className={cn(
                  "num text-[38px] font-bold leading-none",
                  saglikTon === "ok" ? "text-ok" : saglikTon === "warn" ? "text-warn" : "text-brand-700",
                )}
              >
                {sayi(genel.saglik)}
                <span className="text-[20px] font-semibold text-slate-faint">/100</span>
              </span>
            </div>
            <Tooltip metin={t("sv.derinlik.olcum")}>
              <Info className="size-4 text-slate-faint" />
            </Tooltip>
          </div>
          <p className="mt-2 text-sm text-slate-muted">{t("sv.stat.saglik")}</p>
          <div className="mt-3">
            <Ilerleme deger={genel.saglik} ton={saglikTon === "warn" ? "warn" : saglikTon === "ok" ? "ok" : "brand"} />
          </div>
        </div>
      </div>

      {/* Katman yığını — 4 katman kartı */}
      <div>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Layers className="size-4 text-slate-faint" />
          <h3 className="text-[15px] font-semibold text-slate-ink">{t("sv.katmanlar.baslik")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {genel.katmanlar.map((katman, i) => (
            <KatmanKarti key={katman.id} katman={katman} sira={i} t={t} sayi={sayi} anim={gir(i)} />
          ))}
        </div>
      </div>

      {/* Katmanlı-savunma açıklayıcı */}
      <Panel baslik={t("sv.derinlik.baslik")}>
        <p className="text-[13px] leading-relaxed text-slate-muted">{t("sv.derinlik.aciklama")}</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { ikon: Lock, k: "nokta1" },
            { ikon: Layers, k: "nokta2" },
            { ikon: Cpu, k: "nokta3" },
          ].map(({ ikon: Ikon, k }, i) => (
            <motion.div
              key={k}
              {...gir(i)}
              className="rounded-2xl border border-line bg-canvas/40 p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Ikon className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-ink">{t(`sv.derinlik.${k}.baslik`)}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">{t(`sv.derinlik.${k}.aciklama`)}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* Dürüstlük notu */}
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/50 px-5 py-4">
        <Info className="mt-0.5 size-5 shrink-0 text-slate-faint" />
        <p
          className="text-[13px] leading-relaxed text-slate-muted [&_b]:font-semibold [&_b]:text-slate-ink"
          dangerouslySetInnerHTML={{ __html: notMetni }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ KatmanKarti */
function KatmanKarti({
  katman,
  sira,
  t,
  sayi,
  anim,
}: {
  katman: SavunmaKatman;
  sira: number;
  t: (k: string) => string;
  sayi: (n: number) => string;
  anim: Record<string, unknown>;
}) {
  const Ikon = KATMAN_IKON[katman.id];
  const tonKod = ZORLUK_TON[katman.zorluk];
  const rota = KATMAN_ROTA[katman.id];
  const ad = t(`sv.katman.${katman.id}.ad`);

  return (
    <motion.div
      {...anim}
      className="group relative flex flex-col rounded-3xl border border-line bg-surface p-6 transition hover:border-line-strong"
    >
      {/* Sıra numarası (yığın hissi) */}
      <span className="absolute right-5 top-5 num text-[13px] font-semibold tabular-nums text-slate-faint">
        {String(sira + 1).padStart(2, "0")}
      </span>

      {/* Üst: ikon + ad + zorluk rozeti */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset",
            KATMAN_AKSAN[katman.id],
          )}
        >
          <Ikon className="size-[22px]" />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-semibold text-slate-ink">{ad}</h4>
            <Badge ton={BADGE_TON[tonKod]}>{t(`sv.zorluk.${katman.zorluk}`)}</Badge>
          </div>
          {/* Yanıtladığı soru */}
          <p className="mt-1 text-[13px] italic text-slate-muted">“{t(`sv.katman.${katman.id}.soru`)}”</p>
        </div>
      </div>

      {/* Ne yaptığı */}
      <p className="mt-4 text-[13px] leading-relaxed text-slate-muted">
        {t(`sv.katman.${katman.id}.aciklama`)}
      </p>

      {/* Kapsama çubuğu */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[12px]">
          <span className="font-medium text-slate-muted">{t("sv.kart.kapsama")}</span>
          <span className="num font-semibold text-slate-ink">%{sayi(katman.kapsama)}</span>
        </div>
        <Ilerleme deger={katman.kapsama} ton={ILERLEME_TON[tonKod]} />
      </div>

      {/* Yakalanan + atlatma notu */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-2xl bg-canvas/50 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-medium text-slate-muted">{t("sv.kart.yakalanan")}</span>
            <span className="num text-[20px] font-bold leading-none text-slate-ink">{sayi(katman.yakalanan)}</span>
          </div>
        </div>
        <Tooltip metin={t(`sv.katman.${katman.id}.atlatma`)} yon="ust">
          <span className="inline-flex cursor-help items-center gap-1.5 text-[12px] font-medium text-slate-muted">
            <Info className="size-3.5" />
            {t("sv.kart.atlatma")}
          </span>
        </Tooltip>
      </div>

      {/* Alt: canlı pill + katman paneline link */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        {katman.aktif && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-ok" />
            </span>
            {t("sv.kart.canli")}
          </span>
        )}
        <a
          href={rota}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition hover:text-brand-800"
        >
          {t("sv.kart.detay")}
          <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </motion.div>
  );
}
