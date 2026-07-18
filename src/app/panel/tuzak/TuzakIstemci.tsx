"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bug,
  EyeOff,
  ShieldCheck,
  Target,
  Link2,
  CheckSquare,
  Clock,
  TextCursorInput,
  Code2,
  Info,
  Sparkles,
} from "lucide-react";
import { Panel, StatKart, Badge, KodBlok, NotKutusu, BosDurum, Tablo, type Kolon } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import {
  TUZAKLAR,
  TUR_TON,
  YONTEM_ETIKET,
  honeypotWidgetKod,
  type TuzakEtkinlik,
  type HoneypotOzet,
  type TuzakTur,
} from "@/lib/specter/honeypot";
import type { Dil } from "@/lib/i18n/panel";
import { tuzakCeviri } from "./tuzak.i18n";

/** Dil koduna karşılık gelen BCP-47 yerel etiketi (sayı biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/** Tuzak türüne göre ikon (enum-güvenli). */
const TUR_IKON: Record<TuzakTur, React.ReactNode> = {
  "gizli-alan": <TextCursorInput className="size-4" />,
  "yem-alan": <Target className="size-4" />,
  "gizli-link": <Link2 className="size-4" />,
  "aria-onay-kutusu": <CheckSquare className="size-4" />,
  "zaman-tuzagi": <Clock className="size-4" />,
};

export function TuzakIstemci({
  tuzaklar,
  ozet,
  siteKey,
  dil,
}: {
  tuzaklar: TuzakEtkinlik[];
  ozet: HoneypotOzet;
  siteKey: string;
  dil: Dil;
}) {
  const t = (anahtar: string) => tuzakCeviri(anahtar, dil);
  const yerel = YEREL[dil];
  const azalt = useReducedMotion();

  const kod = honeypotWidgetKod(siteKey);
  const kapsamaYuzde = Math.round(ozet.kapsamaOrani * 100);
  const trafikVar = tuzaklar.some((tz) => tz.tetiklenme > 0);

  // Etkinlik tablosu kolonları.
  const kolonlar: Kolon<TuzakEtkinlik & { id: string }>[] = [
    {
      baslik: t("hp.kolon.tuzak"),
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-slate-faint">{TUR_IKON[r.tuzak.tur]}</span>
          <span className="font-medium text-slate-ink">{r.tuzak.ad}</span>
        </div>
      ),
    },
    {
      baslik: t("hp.kolon.tur"),
      render: (r) => <Badge ton={TUR_TON[r.tuzak.tur]}>{r.tuzak.tur}</Badge>,
    },
    {
      baslik: t("hp.kolon.tetiklenme"),
      className: "text-right",
      render: (r) => <span className="num tabular-nums text-slate-ink">{r.tetiklenme.toLocaleString(yerel)}</span>,
    },
    {
      baslik: t("hp.kolon.yakalanan"),
      className: "text-right",
      render: (r) => (
        <span className="num tabular-nums font-semibold text-red-700">{r.yakalananBot.toLocaleString(yerel)}</span>
      ),
    },
    {
      baslik: t("hp.kolon.yanlisPozitif"),
      className: "text-right",
      render: (r) => (
        <span className="inline-flex items-center gap-1 num tabular-nums font-semibold text-green-700">
          <ShieldCheck className="size-3.5" />
          {r.yanlisPozitif}
        </span>
      ),
    },
  ];

  const tabloVeri = tuzaklar.map((tz) => ({ ...tz, id: tz.tuzak.id }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi + alt başlık */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Bug className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("hp.nasil.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("hp.nasil.metin")}</p>
        </div>
      </div>

      {/* sıfır yanlış-pozitif vurgusu */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-ok-soft/50 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ok-soft text-green-700">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-green-800">{t("hp.sifirPozitif")}</span>
            <Badge ton="yesil">
              <Sparkles className="size-3" />
              {t("hp.sifirPozitif")}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-green-800/80">{t("hp.sifirPozitif.aciklama")}</p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamTuzak} etiket={t("hp.ozet.toplam")} ikon={<Bug className="size-4" />} />
        <StatKart sayi={ozet.aktifTuzak} etiket={t("hp.ozet.aktif")} ikon={<EyeOff className="size-4" />} tone="brand" />
        <StatKart
          sayi={ozet.yakalananBotTahmini.toLocaleString(yerel)}
          etiket={t("hp.ozet.yakalanan")}
          ikon={<Target className="size-4" />}
          tone="danger"
        />
        <StatKart sayi={`${kapsamaYuzde}%`} etiket={t("hp.ozet.kapsama")} ikon={<ShieldCheck className="size-4" />} tone="ok" />
      </div>

      {/* tuzak kataloğu kartları */}
      <Panel baslik={t("hp.katalog.baslik")}>
        <p className="mb-4 -mt-1 text-[13px] text-slate-muted">{t("hp.katalog.aciklama")}</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TUZAKLAR.map((tz, i) => (
            <motion.div
              key={tz.id}
              initial={azalt ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
              className="flex flex-col rounded-2xl border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    {TUR_IKON[tz.tur]}
                  </span>
                  <span className="text-[14px] font-semibold leading-tight text-slate-ink">{tz.ad}</span>
                </div>
                <Badge ton={TUR_TON[tz.tur]}>{tz.tur}</Badge>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-muted">{tz.aciklama}</p>
              <div className="mt-4 space-y-2 border-t border-line pt-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <EyeOff className="size-3.5 shrink-0 text-slate-faint" />
                  <span className="text-slate-faint">{t("hp.katalog.yontem")}:</span>
                  <span className="font-medium text-slate-ink">{YONTEM_ETIKET[tz.gorunmezlikYontemi]}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
                  <span className="text-slate-faint">{t("hp.katalog.yakalar")}:</span>
                  <span className="font-medium text-slate-ink">{tz.yakalananBotTuru}</span>
                </div>
              </div>
              <div className="mt-3">
                <Badge ton="yesil">
                  <ShieldCheck className="size-3" />
                  {t("hp.sifirPozitif")}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* tuzak başına etkinlik tablosu */}
      <Panel
        baslik={t("hp.etkinlik.baslik")}
        sagUst={
          <Badge ton="mavi">
            <Info className="size-3" />
            {t("hp.rozet.cikarimsal")}
          </Badge>
        }
      >
        <p className="mb-4 -mt-1 text-[13px] text-slate-muted">{t("hp.etkinlik.aciklama")}</p>
        {trafikVar ? (
          <Tablo<TuzakEtkinlik & { id: string }>
            kolonlar={kolonlar}
            veri={tabloVeri}
            bosMesaj={t("hp.etkinlik.bos")}
          />
        ) : (
          <BosDurum ikon={<Bug className="size-7" />} baslik={t("hp.etkinlik.bos")} />
        )}
      </Panel>

      {/* gömülebilir honeypot kodu */}
      <Panel baslik={t("hp.kod.baslik")}>
        <p className="mb-3 -mt-1 text-[13px] text-slate-muted">{t("hp.kod.aciklama")}</p>
        <div className="mb-4">
          <NotKutusu ton="yesil" baslik={t("hp.sifirPozitif")}>
            <span className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>{t("hp.kod.a11y")}</span>
            </span>
          </NotKutusu>
        </div>
        <KodBlok kod={kod} dil="html" baslik="honeypot.html" />
      </Panel>

      {/* dürüstlük notu */}
      <NotKutusu ton="bilgi" baslik={t("hp.dürüst.baslik")}>
        <span className="flex items-start gap-2">
          <Code2 className="mt-0.5 size-4 shrink-0" />
          <span>{t("hp.dürüst.metin")}</span>
        </span>
      </NotKutusu>
    </div>
  );
}
