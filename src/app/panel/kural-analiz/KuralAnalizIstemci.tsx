"use client";

/**
 * Kural Çakışma & Gölgeleme Analizi — istemci arayüzü.
 * Site seçici + özet kartları + genişleyebilir bulgu listesi + "sağlıklı"
 * boş durumu. Gerçek bir kural linter'ı gibi çalışır: her bulgu, karışan
 * kuralları öncelik çipleriyle gösterir, açıklama ve somut düzeltme önerisi
 * sunar, ilgili kuralları /panel/kurallar'a bağlar.
 */
import { useState } from "react";
import Link from "next/link";
import {
  ScanSearch, ShieldCheck, Layers, GitCompareArrows, CopyMinus, ChevronDown,
  ArrowRight, AlertTriangle, Info, EyeOff,
} from "lucide-react";
import { Panel, StatKart, Badge, BosDurum, Secim, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { KuralBulgu, BulguTur, BulguSiddet, AnalizOzet, BulguKural } from "@/lib/specter/rule-analysis";
import type { Dil } from "@/lib/i18n/panel";
import { kuralAnalizCeviri } from "./kural-analiz.i18n";

/** Çeviri yardımcısı tipi — alt bileşenlere geçirilir. */
type Ceviri = (anahtar: string) => string;

/** Sunucudan gelen, tek sitenin tüm analiz sonucu. */
export interface SiteAnaliz {
  siteId: string;
  siteAd: string;
  kuralSayisi: number;
  etkinSayisi: number;
  ozet: AnalizOzet;
  bulgular: KuralBulgu[];
  isaretleyenler: BulguKural[];
}

/* Enum değerleri çevrilmez; etiketler anahtar-eşleme ile üretilir. İkon/renk
 * gibi görsel meta enum'a bağlı kalır. */
const TUR_META: Record<BulguTur, { ikon: React.ReactNode; renk: string }> = {
  golgeleme: { ikon: <Layers className="size-4" />, renk: "text-danger2" },
  cakisma: { ikon: <GitCompareArrows className="size-4" />, renk: "text-warn" },
  yineleme: { ikon: <CopyMinus className="size-4" />, renk: "text-slate-muted" },
};

const SIDDET_TON: Record<BulguSiddet, "kirmizi" | "sari" | "gri"> = {
  yuksek: "kirmizi",
  orta: "sari",
  dusuk: "gri",
};

/** Bir kural referansını öncelik çipiyle gösterir; kurallar sayfasına bağlar. */
function KuralCip({ k }: { k: BulguKural }) {
  return (
    <Link
      href="/panel/kurallar"
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-1 text-[12.5px] font-medium text-slate-ink transition hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="grid size-4 place-items-center rounded bg-brand-100 text-[10px] font-bold text-brand-700 num">
        {k.priority}
      </span>
      {k.name}
    </Link>
  );
}

function BulguSatiri({ b, index, t }: { b: KuralBulgu; index: number; t: Ceviri }) {
  const [acik, setAcik] = useState(index === 0);
  const turMeta = TUR_META[b.tur];
  const turAd = t(`tur.${b.tur}`);
  const siddetTon = SIDDET_TON[b.siddet];
  const siddetAd = t(`siddet.${b.siddet}`);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-canvas/50"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            b.tur === "golgeleme" ? "bg-danger-soft" : b.tur === "cakisma" ? "bg-warn-soft" : "bg-slate-100",
            turMeta.renk,
          )}
        >
          {turMeta.ikon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-ink">{b.baslik}</span>
            <Badge ton={siddetTon}>{siddetAd}</Badge>
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">{turAd}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {b.kurallar.map((k) => (
              <span
                key={k.id}
                className="inline-flex items-center gap-1 text-[12px] text-slate-muted"
              >
                <span className="grid size-4 place-items-center rounded bg-slate-100 text-[10px] font-bold text-slate-600 num">
                  {k.priority}
                </span>
                {k.name}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-faint transition", acik && "rotate-180")} />
      </button>

      {acik && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          <p className="text-[13px] leading-relaxed text-slate-muted">{b.aciklama}</p>

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              {t("bulgu.karisanKurallar")}
            </div>
            <div className="flex flex-wrap gap-2">
              {b.kurallar.map((k) => (
                <KuralCip key={k.id} k={k} />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <div>
              <div className="text-[12px] font-bold uppercase tracking-wide text-brand-700">{t("bulgu.oneri")}</div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-ink">{b.oneri}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function KuralAnalizIstemci({ analizler, dil }: { analizler: SiteAnaliz[]; dil: Dil }) {
  const t = (anahtar: string) => kuralAnalizCeviri(anahtar, dil);
  const [seciliId, setSeciliId] = useState<string>(analizler[0]?.siteId ?? "");
  const secili = analizler.find((a) => a.siteId === seciliId) ?? analizler[0];

  // Hiç site yoksa erken çık.
  if (!secili) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-10 lg:px-10">
        <BosDurum
          ikon={<ScanSearch className="size-7" />}
          baslik={t("bosSite.baslik")}
          aciklama={t("bosSite.aciklama")}
          aksiyon={<Button href="/panel/siteler">{t("bosSite.aksiyon")}</Button>}
        />
      </div>
    );
  }

  const o = secili.ozet;
  const bulgular = secili.bulgular;
  // Şiddete göre sırala: yüksek → orta → düşük (deterministik).
  const siddetSira: Record<BulguSiddet, number> = { yuksek: 0, orta: 1, dusuk: 2 };
  const siraliBulgular = [...bulgular].sort((a, b) => siddetSira[a.siddet] - siddetSira[b.siddet]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <ScanSearch className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("serit.aciklamaOncesi")}
            <b>{t("serit.golgeledigi")}</b>{t("serit.golgeledigiSonrasi")}<b>{t("serit.celistigi")}</b>{t("serit.celistigiSonrasi")}
            <b>{t("serit.yineledigi")}</b>{t("serit.yineledigiSonrasi")}
          </p>
        </div>
      </div>

      {/* site seçici */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-ink">{t("site.etiket")}</span>
          <Secim
            value={secili.siteId}
            onChange={(e) => setSeciliId(e.target.value)}
            className="min-w-[240px]"
            aria-label={t("site.aria")}
          >
            {analizler.map((a) => (
              <option key={a.siteId} value={a.siteId}>
                {a.siteAd} — {t("site.kuralAdet").replace("{n}", String(a.kuralSayisi))}
                {a.ozet.toplam > 0 ? t("site.bulguAdet").replace("{n}", String(a.ozet.toplam)) : t("site.temiz")}
              </option>
            ))}
          </Secim>
        </label>
        <div className="pb-0.5 text-[13px] text-slate-muted">
          <span className="num font-semibold text-slate-ink">{secili.etkinSayisi}</span>{t("site.etkinOncesi")}
          <span className="num">{secili.kuralSayisi}</span>{t("site.toplamKuralSonrasi")}
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={o.toplam}
          etiket={t("kart.toplamBulgu")}
          ikon={<ScanSearch className="size-5" />}
          tone={o.toplam === 0 ? "ok" : o.golgeleme > 0 ? "danger" : "warn"}
        />
        <StatKart
          sayi={o.golgeleme}
          etiket={t("kart.golgelemeOlu")}
          ikon={<Layers className="size-5" />}
          tone={o.golgeleme > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={o.cakisma}
          etiket={t("kart.cakismaZit")}
          ikon={<GitCompareArrows className="size-5" />}
          tone={o.cakisma > 0 ? "warn" : "ok"}
        />
        <StatKart
          sayi={o.saglikli ? t("kart.saglikli") : t("kart.dikkat")}
          etiket={t("kart.saglikDurumu")}
          ikon={o.saglikli ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
          tone={o.saglikli ? "ok" : "warn"}
        />
      </div>

      {/* bulgu listesi veya sağlıklı boş durumu */}
      <Panel
        baslik={t("panel.bulgular").replace("{site}", secili.siteAd)}
        sagUst={
          bulgular.length > 0 ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-faint">
              <span className="flex items-center gap-1"><Layers className="size-3.5 text-danger2" /> {o.golgeleme}</span>
              <span className="flex items-center gap-1"><GitCompareArrows className="size-3.5 text-warn" /> {o.cakisma}</span>
              <span className="flex items-center gap-1"><CopyMinus className="size-3.5 text-slate-muted" /> {o.yineleme}</span>
            </div>
          ) : undefined
        }
      >
        {bulgular.length === 0 ? (
          <BosDurum
            ikon={<ShieldCheck className="size-7" />}
            baslik={t("bos.saglikliBaslik")}
            aciklama={
              secili.kuralSayisi === 0
                ? t("bos.hicKural")
                : t("bos.temiz")
            }
            aksiyon={
              secili.kuralSayisi === 0 ? (
                <Button href="/panel/kurallar">{t("bos.kuralEkle")}</Button>
              ) : (
                <Button variant="outline" href="/panel/kurallar">{t("bos.kurallariGoruntule")}</Button>
              )
            }
          />
        ) : (
          <div className="space-y-2.5">
            {siraliBulgular.map((b, i) => (
              <BulguSatiri key={`${b.tur}-${b.kurallar.map((k) => k.id).join("-")}-${i}`} b={b} index={i} t={t} />
            ))}
          </div>
        )}
      </Panel>

      {/* flag-only bilgi kutusu */}
      {secili.isaretleyenler.length > 0 && (
        <NotKutusu ton="bilgi" baslik={t("flag.baslik")}>
          <div className="flex items-start gap-2">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-[13px]">
                {t("flag.aciklamaOncesi").replace("{n}", String(secili.isaretleyenler.length))}<b>{t("flag.isaretler")}</b>{t("flag.aciklamaSonrasi")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {secili.isaretleyenler.map((k) => (
                  <KuralCip key={k.id} k={k} />
                ))}
              </div>
            </div>
          </div>
        </NotKutusu>
      )}

      {/* metodoloji notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span>
          {t("metod.oncesi")}<b>{t("metod.tekKosullu")}</b>{t("metod.orta")}
          <b>{t("metod.gelismisGrup")}</b>{t("metod.sonrasi")}
        </span>
      </div>
    </div>
  );
}
