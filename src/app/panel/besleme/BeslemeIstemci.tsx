"use client";

/**
 * Specter — Tehdit İstihbarat Beslemeleri Konsolu (istemci)
 * =========================================================
 * Mevcut besleme motorunu (src/lib/specter/threat-feed.ts) kurumsal bir
 * konsolla yüzeye çıkarır: besleme kataloğu + sahibin trafiğinde eşleşen
 * kötü-niyetli IP'ler + zenginleştirme boru hattının açıklaması.
 *
 * Beslemeler Specter tarafından derlenmiş/simüle temsili istihbarattır
 * (canlı üçüncü-taraf abonelik değildir) — bunu dürüstçe belirtiriz.
 */
import Link from "next/link";
import { useMemo } from "react";
import {
  Rss,
  Globe,
  Shield,
  Server,
  Bot,
  ShieldAlert,
  Mail,
  Radar,
  Database,
  Activity,
  RefreshCw,
  Info,
  ArrowRight,
  Gauge,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Panel, StatKart, Badge, DurumRozeti, Ulke, Tablo, type Kolon } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { BeslemeKaynak } from "@/lib/specter/threat-feed";
import type { Dil } from "@/lib/i18n/panel";
import { beslemeCeviri } from "./besleme.i18n";
import type { EslesenIpSatiri } from "./page";

/** Dil → BCP-47 yerel etiketi (Intl sayı biçimlendirme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* --------------------------------------------------------------- Tipler */
interface BeslemeVeri {
  kaynak: BeslemeKaynak;
  ad: string;
  aciklama: string;
  guven: number;
  guncellemeGun: number;
  kayitSayisi: number;
  seninEslesme: number;
}

interface Props {
  dil: Dil;
  beslemeler: BeslemeVeri[];
  eslesenler: EslesenIpSatiri[];
  ozet: { toplamKayit: number; aktifBesleme: number; enGuncelGun: number };
  toplamEslesenIp: number;
}

/* --------------------------------------------------------------- Kaynak → ikon + renk */
/* Kaynak enum'una göre ikon/renk/zemin. ETİKET burada TUTULMAZ — çeviri
 * `t("kaynak.<enum>")` ile yapılır (enum güvenliği: değer asla çevrilmez). */
const KAYNAK_META: Record<
  BeslemeKaynak,
  {
    ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    renk: string;
    zemin: string;
  }
> = {
  tor: { ikon: Globe, renk: "#7c3aed", zemin: "bg-violet-50" },
  vpn: { ikon: Shield, renk: "#2f6fed", zemin: "bg-blue-50" },
  datacenter: { ikon: Server, renk: "#0891b2", zemin: "bg-cyan-50" },
  bulletproof: { ikon: ShieldAlert, renk: "#dc2626", zemin: "bg-red-50" },
  botnet: { ikon: Bot, renk: "#b91c1c", zemin: "bg-rose-50" },
  spam: { ikon: Mail, renk: "#d97706", zemin: "bg-amber-50" },
  scanner: { ikon: Radar, renk: "#059669", zemin: "bg-emerald-50" },
};

/* --------------------------------------------------------------- Yardımcılar */
function sayiBicim(n: number, yerel: string): string {
  return n.toLocaleString(yerel);
}

/** Tazelik metni — çeviri sözlüğünden, `{n}` interpolasyonuyla. */
function gunOnce(gun: number, t: (k: string) => string): string {
  if (gun <= 0) return t("taze.bugun");
  if (gun === 1) return t("taze.birGun");
  return t("taze.gun").replace("{n}", String(gun));
}

function skorRenk(s: number): string {
  return s >= 80 ? "#dc2626" : s >= 60 ? "#ea580c" : s >= 40 ? "#d97706" : "#2f6fed";
}

const KAYNAK_TON: Record<BeslemeKaynak, "brand" | "gri" | "yesil" | "sari" | "kirmizi" | "mavi"> = {
  tor: "brand",
  vpn: "mavi",
  datacenter: "mavi",
  bulletproof: "kirmizi",
  botnet: "kirmizi",
  spam: "sari",
  scanner: "yesil",
};

/* --------------------------------------------------------------- Bileşen */
export function BeslemeIstemci({ dil, beslemeler, eslesenler, ozet, toplamEslesenIp }: Props) {
  const t = (k: string) => beslemeCeviri(k, dil);
  const yerel = YEREL[dil];

  // Kataloğu, sahibin trafiğinde en çok eşleşen beslemeler üstte olacak
  // şekilde sırala; eşitlikte güvene göre.
  const sirali = useMemo(
    () => [...beslemeler].sort((a, b) => b.seninEslesme - a.seninEslesme || b.guven - a.guven),
    [beslemeler],
  );

  const kolonlar: Kolon<EslesenIpSatiri>[] = [
    {
      baslik: t("kol.ip"),
      render: (r) => (
        <Link
          href={`/panel/tehdit/${r.ip}`}
          className="group inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-brand-700 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {r.ip}
          <ExternalLink className="size-3 text-brand-400 opacity-0 transition group-hover:opacity-100" />
        </Link>
      ),
    },
    {
      baslik: t("kol.ulke"),
      render: (r) => <Ulke kod={r.country} />,
    },
    {
      baslik: t("kol.asn"),
      render: (r) => <span className="text-[12.5px] text-slate-muted">{r.asn}</span>,
      className: "max-w-[220px] truncate",
    },
    {
      baslik: t("kol.eslesenBesleme"),
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.kaynaklar.map((k) => (
            <Badge key={k.kaynak} ton={KAYNAK_TON[k.kaynak]}>
              {(() => {
                const Ikon = KAYNAK_META[k.kaynak].ikon;
                return <Ikon className="size-3" />;
              })()}
              {t(`kaynak.${k.kaynak}`)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      baslik: t("kol.tehditSkoru"),
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full"
              style={{ width: `${r.threatScore}%`, background: skorRenk(r.threatScore) }}
            />
          </div>
          <span className="num text-[12.5px] font-semibold" style={{ color: skorRenk(r.threatScore) }}>
            {r.threatScore}
          </span>
        </div>
      ),
    },
    {
      baslik: t("kol.istekEngel"),
      render: (r) => (
        <span className="num text-[12.5px] text-slate-muted">
          {sayiBicim(r.requests, yerel)} <span className="text-slate-faint">/</span>{" "}
          <span className="font-medium text-danger2">{sayiBicim(r.blocked, yerel)}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* tanıtım şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Rss className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("intro.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("intro.metin")}</p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={sayiBicim(ozet.toplamKayit, yerel)}
          etiket={t("ozet.toplamKayit")}
          ikon={<Database className="size-5" />}
        />
        <StatKart sayi={ozet.aktifBesleme} etiket={t("ozet.aktifBesleme")} ikon={<Layers className="size-5" />} />
        <StatKart
          sayi={toplamEslesenIp}
          etiket={t("ozet.eslesenIp")}
          ikon={<Activity className="size-5" />}
          tone={toplamEslesenIp > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ozet.enGuncelGun <= 0 ? t("ozet.bugun") : gunOnce(ozet.enGuncelGun, t)}
          etiket={t("ozet.enGuncel")}
          ikon={<RefreshCw className="size-5" />}
          tone="ok"
        />
      </div>

      {/* besleme kataloğu */}
      <Panel
        baslik={t("katalog.baslik")}
        sagUst={<DurumRozeti ton="ok" etiket={t("katalog.canliSenkron")} nabiz />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sirali.map((b) => {
            const meta = KAYNAK_META[b.kaynak];
            const Ikon = meta.ikon;
            return (
              <div
                key={b.kaynak}
                className="flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <span className={cn("grid size-11 place-items-center rounded-2xl", meta.zemin)}>
                    <Ikon className="size-5" style={{ color: meta.renk }} />
                  </span>
                  <DurumRozeti ton="ok" etiket={t("kart.canli")} nabiz />
                </div>

                {/* ad/açıklama lib'ten gelir; enum key-map ile yeniden türetilir */}
                <div className="mt-3.5 font-semibold text-slate-ink">{t(`besleme.${b.kaynak}.ad`)}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-muted">{t(`besleme.${b.kaynak}.aciklama`)}</p>

                {/* metrik satırı */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
                  <div>
                    <div className="num text-[17px] font-bold text-slate-ink">{sayiBicim(b.kayitSayisi, yerel)}</div>
                    <div className="text-[11px] text-slate-faint">{t("kart.kayit")}</div>
                  </div>
                  <div>
                    <div className="num text-[17px] font-bold" style={{ color: meta.renk }}>
                      %{Math.round(b.guven * 100)}
                    </div>
                    <div className="text-[11px] text-slate-faint">{t("kart.guven")}</div>
                  </div>
                </div>

                {/* alt bilgi: güncelleme + senin eşleşmen */}
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-faint">
                    <RefreshCw className="size-3" />
                    {gunOnce(b.guncellemeGun, t)}
                  </span>
                  {b.seninEslesme > 0 ? (
                    <Badge ton="kirmizi">
                      <Activity className="size-3" />
                      {t("kart.eslesme").replace("{n}", String(b.seninEslesme))}
                    </Badge>
                  ) : (
                    <Badge ton="gri">{t("kart.trafikYok")}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* eşleşen IP tablosu */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-ink">{t("tablo.baslik")}</h3>
            <p className="mt-0.5 text-[13px] text-slate-muted">{t("tablo.aciklama")}</p>
          </div>
          <Badge ton={toplamEslesenIp > 0 ? "kirmizi" : "gri"}>
            {t("tablo.rozet").replace("{n}", String(toplamEslesenIp))}
          </Badge>
        </div>

        <Tablo
          kolonlar={kolonlar}
          veri={eslesenler}
          sayfaBoyu={15}
          ara={(r) => `${r.ip} ${r.country} ${r.asn}`}
          araPlaceholder={t("tablo.ara")}
          bosMesaj={t("tablo.bos")}
        />
      </div>

      {/* nasıl çalışır boru hattı */}
      <Panel baslik={t("nasil.baslik")}>
        <div className="grid gap-3 lg:grid-cols-4">
          {[
            { ikon: Rss, no: "1" },
            { ikon: Gauge, no: "2" },
            { ikon: Shield, no: "3" },
            { ikon: ArrowRight, no: "4" },
          ].map((adim) => {
            const Ikon = adim.ikon;
            return (
              <div key={adim.no} className="rounded-2xl border border-line bg-canvas/40 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Ikon className="size-4" />
                </span>
                <div className="mt-3 text-[13px] font-semibold text-slate-ink">{t(`nasil.${adim.no}.baslik`)}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-muted">{t(`nasil.${adim.no}.metin`)}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-slate-muted">
          <span>{t("nasil.uclar")}</span>
          <Link
            href="/panel/zorluk"
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
          >
            {t("nasil.link.zorluk")} <ArrowRight className="size-3.5" />
          </Link>
          <span className="text-slate-faint">·</span>
          <Link
            href="/panel/kurallar"
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
          >
            {t("nasil.link.kurallar")} <ArrowRight className="size-3.5" />
          </Link>
          <span className="text-slate-faint">·</span>
          <Link
            href="/panel/tehdit"
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
          >
            {t("nasil.link.tehdit")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Panel>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span dangerouslySetInnerHTML={{ __html: t("not.metin") }} />
      </div>
    </div>
  );
}
