"use client";

/**
 * Kampanya İlişkilendirme — İstemci
 * ==================================
 * Kümelenmiş kampanyaları zengin kartlar + Gantt-benzeri zaman çizelgesi
 * olarak gösterir. Kartta ad, tehdit rozeti, durum, sofistike bar, SVG
 * sparkline ve ASN/ülke çipleri. Tıkla → örnek IP'ler + zirve + açıklama.
 *
 * DÜRÜSTLÜK: Kampanyalar gerçek olaylardan sezgisel kümelemeyle çıkarılır;
 * etiketler buluşsal gruplamadır, gerçek isimli tehdit gruplarına atıf değil.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Crosshair,
  Radar,
  ShieldAlert,
  Link2,
  Search,
  ChevronDown,
  Server,
  Globe,
  Clock,
  Fingerprint,
  Activity,
  ArrowRight,
  Info,
  Zap,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, DurumRozeti, Ilerleme } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { ceviri } from "@/lib/i18n/panel";
import type { Kampanya, KampanyaOzet, TehditSeviyesi, KampanyaDurum } from "./kumele";
import {
  kampanyaCeviri,
  kampanyaAd,
  kampanyaAciklama,
  tehditEtiket,
  durumEtiket,
  sinyalMetin,
  KMP_LOCALE,
} from "./kampanya.i18n";

/* ------------------------------------------------------------------ eşlemeler */

const TEHDIT_RENK: Record<TehditSeviyesi, string> = {
  düşük: "#64748b",
  orta: "#d97706",
  yüksek: "#ea580c",
  kritik: "#dc2626",
};
const TEHDIT_BADGE: Record<TehditSeviyesi, "gri" | "sari" | "kirmizi"> = {
  düşük: "gri",
  orta: "sari",
  yüksek: "kirmizi",
  kritik: "kirmizi",
};
const DURUM_TON: Record<KampanyaDurum, "ok" | "warn" | "gri"> = {
  aktif: "ok",
  sönümleniyor: "warn",
  kapandı: "gri",
};

function zaman(ts: number, locale: string) {
  return new Date(ts).toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function tarih(ts: number, locale: string) {
  return new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

/* ------------------------------------------------------------------ SVG sparkline */

function Sparkline({ seri, renk }: { seri: Kampanya["zamanSerisi"]; renk: string }) {
  const g = 120;
  const y = 30;
  const enb = Math.max(1, ...seri.map((k) => k.sayi));
  const n = seri.length;
  const bw = g / n;
  return (
    <svg viewBox={`0 0 ${g} ${y}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      {seri.map((k, i) => {
        const h = (k.sayi / enb) * (y - 2);
        return (
          <rect
            key={i}
            x={i * bw + 0.5}
            y={y - h}
            width={Math.max(0.8, bw - 1)}
            height={h}
            rx={0.8}
            fill={renk}
            opacity={k.sayi === 0 ? 0.12 : 0.85}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ ana */

export function KampanyaIstemci({
  dil,
  kampanyalar,
  ozet,
  toplamOlay,
}: {
  dil: Dil;
  kampanyalar: Kampanya[];
  ozet: KampanyaOzet;
  toplamOlay: number;
}) {
  const t = (k: string) => kampanyaCeviri(k, dil);
  const locale = KMP_LOCALE[dil];
  const [sorgu, setSorgu] = useState("");
  const [acik, setAcik] = useState<string | null>(kampanyalar[0]?.id ?? null);

  // Kampanya adı seçili dilde yeniden türetilir (ASN/sağlayıcı veri kalır).
  const ad = (k: Kampanya) => kampanyaAd(k.asnlar[0] ?? "AS?", k.botClass, dil);

  const filtreli = kampanyalar.filter(
    (k) =>
      !sorgu ||
      `${ad(k)} ${k.botClass} ${k.asnlar.join(" ")} ${k.ulkeler.join(" ")} ${tehditEtiket(k.tehditSeviyesi, dil)} ${durumEtiket(k.durum, dil)}`
        .toLowerCase()
        .includes(sorgu.toLowerCase()),
  );

  // Gantt için global zaman aralığı.
  const enErken = kampanyalar.length ? Math.min(...kampanyalar.map((k) => k.ilkGorulme)) : 0;
  const enGec = kampanyalar.length ? Math.max(...kampanyalar.map((k) => k.sonGorulme)) : 1;
  const span = Math.max(1, enGec - enErken);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Radar className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("kmp.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("kmp.serit.aciklama")}</p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamKampanya} etiket={t("kmp.ozet.tespit")} ikon={<Crosshair className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.aktif} etiket={t("kmp.ozet.aktif")} ikon={<Activity className="size-5" />} tone="ok" />
        <StatKart sayi={ozet.kritik} etiket={t("kmp.ozet.kritik")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart
          sayi={`%${Math.round(ozet.iliskilendirmeOrani * 100)}`}
          etiket={t("kmp.ozet.iliski").replace("{n}", String(toplamOlay))}
          ikon={<Link2 className="size-5" />}
          tone="warn"
        />
      </div>

      {/* Gantt zaman çizelgesi */}
      {kampanyalar.length > 0 && (
        <Panel baslik={t("kmp.gantt.baslik")}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-slate-faint">
              <span>{tarih(enErken, locale)}</span>
              <span>{tarih(enGec, locale)}</span>
            </div>
            {kampanyalar.map((k) => {
              const solPct = ((k.ilkGorulme - enErken) / span) * 100;
              const genPct = Math.max(1.5, ((k.sonGorulme - k.ilkGorulme) / span) * 100);
              const renk = TEHDIT_RENK[k.tehditSeviyesi];
              return (
                <button
                  key={k.id}
                  onClick={() => setAcik(k.id)}
                  className="group flex w-full items-center gap-3 text-left"
                  title={`${ad(k)} — ${t("kmp.kart.olay").replace("{n}", String(k.olaySayisi))}`}
                >
                  <span className="w-40 shrink-0 truncate text-[12px] font-medium text-slate-muted group-hover:text-slate-ink">
                    {ad(k)}
                  </span>
                  <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <span
                      className="absolute inset-y-0 flex items-center rounded-full px-2 text-[10px] font-semibold text-white transition group-hover:brightness-110"
                      style={{ left: `${solPct}%`, width: `${genPct}%`, minWidth: 22, background: renk }}
                    >
                      <span className="truncate">{k.olaySayisi}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[11px] text-slate-faint">
            {(["düşük", "orta", "yüksek", "kritik"] as TehditSeviyesi[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: TEHDIT_RENK[s] }} /> {tehditEtiket(s, dil)}
              </span>
            ))}
          </div>
        </Panel>
      )}

      {/* arama */}
      {kampanyalar.length > 0 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
            <Search className="size-4 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={t("kmp.ara.placeholder")}
              className="w-52 bg-transparent text-[13px] outline-none"
              aria-label={ceviri("ortak.ara", dil)}
            />
          </div>
        </div>
      )}

      {/* kampanya kartları */}
      <div className="space-y-3">
        {kampanyalar.length === 0 && (
          <Panel baslik={t("kmp.bos.baslik")}>
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Radar className="size-8 text-slate-faint" />
              <p className="text-sm text-slate-muted">{t("kmp.bos.aciklama")}</p>
            </div>
          </Panel>
        )}
        {filtreli.length === 0 && kampanyalar.length > 0 && (
          <Panel baslik={t("kmp.eslesme.baslik")}>
            <p className="py-8 text-center text-sm text-slate-muted">{t("kmp.eslesme.aciklama")}</p>
          </Panel>
        )}
        {filtreli.map((k) => {
          const acikMi = acik === k.id;
          const renk = TEHDIT_RENK[k.tehditSeviyesi];
          return (
            <div key={k.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
              <button
                onClick={() => setAcik(acikMi ? null : k.id)}
                className="flex w-full items-start gap-4 px-6 py-4 text-left transition hover:bg-canvas/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: renk }}>
                  <Crosshair className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-ink">{ad(k)}</span>
                    <Badge ton={TEHDIT_BADGE[k.tehditSeviyesi]}>
                      {t("kmp.kart.tehdit").replace("{s}", tehditEtiket(k.tehditSeviyesi, dil))}
                    </Badge>
                    <DurumRozeti ton={DURUM_TON[k.durum]} etiket={durumEtiket(k.durum, dil)} nabiz={k.durum === "aktif"} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-faint">
                    <span className="inline-flex items-center gap-1">
                      <Activity className="size-3" /> {t("kmp.kart.olay").replace("{n}", String(k.olaySayisi))}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Fingerprint className="size-3" /> {t("kmp.kart.ip").replace("{n}", String(k.benzersizIp))}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />{" "}
                      {t("kmp.kart.saat").replace("{n}", k.sureSaat < 1 ? t("kmp.kart.saatKisa") : String(k.sureSaat))}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="size-3" /> {t("kmp.kart.zirve").replace("{n}", String(k.zirveSaat))}
                    </span>
                    <span className="inline-flex items-center gap-1">{zaman(k.ilkGorulme, locale)} → {zaman(k.sonGorulme, locale)}</span>
                  </div>
                  {/* sofistike + sparkline */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-faint">
                        <span>{t("kmp.kart.sofistikeSkor")}</span>
                        <span className="num text-slate-ink">{k.sofistikeSkor}/100</span>
                      </div>
                      <Ilerleme
                        deger={k.sofistikeSkor}
                        ton={k.sofistikeSkor >= 60 ? "danger" : k.sofistikeSkor >= 35 ? "warn" : "brand"}
                      />
                    </div>
                    <div className="hidden w-32 shrink-0 sm:block">
                      <div className="mb-1 text-[11px] font-medium text-slate-faint">{t("kmp.kart.aktivite")}</div>
                      <Sparkline seri={k.zamanSerisi} renk={renk} />
                    </div>
                  </div>
                  {/* çipler */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {k.asnlar.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-slate-muted"
                      >
                        <Server className="size-3" /> {a.split(" ")[0]}
                      </span>
                    ))}
                    {k.ulkeler.slice(0, 5).map((u) => (
                      <Ulke key={u} kod={u} />
                    ))}
                  </div>
                </div>
                <ChevronDown className={cn("mt-1 size-5 shrink-0 text-slate-faint transition", acikMi && "rotate-180")} />
              </button>

              {acikMi && (
                <div className="border-t border-line bg-canvas/30 px-6 py-4">
                  <p className="mb-4 text-[13px] leading-relaxed text-slate-muted">
                    {kampanyaAciklama(
                      {
                        olay: k.olaySayisi,
                        ip: k.benzersizIp,
                        asnSay: k.asnlar.length,
                        anaAsn: k.asnlar[0] ?? "AS?",
                        uaAnahtar: k.uaAileAnahtar,
                        sureSaat: k.sureSaat,
                        botClass: k.botClass,
                      },
                      dil,
                    )}
                  </p>
                  <div className="grid gap-5 lg:grid-cols-3">
                    {/* sinyaller */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Radar className="size-3.5" /> {t("kmp.det.sinyalBaslik")}
                      </div>
                      <div className="space-y-1.5">
                        {k.sinyaller.length === 0 && <div className="text-[12.5px] text-slate-faint">{t("kmp.det.sinyalYok")}</div>}
                        {k.sinyaller.map((s) => (
                          <div key={s.anahtar} className="flex items-start gap-1.5 text-[12.5px] text-slate-ink">
                            <Crosshair className="mt-0.5 size-3 shrink-0" style={{ color: renk }} /> {sinyalMetin(s, dil)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* örnek IP + hedef yollar */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Fingerprint className="size-3.5" /> {t("kmp.det.ornekIp")}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {k.ornekIpler.map((ip) => (
                          <Link
                            key={ip}
                            href={`/panel/tehdit/${ip}`}
                            className="rounded-md bg-canvas px-2 py-0.5 font-mono text-[11.5px] text-slate-ink transition hover:bg-brand-50 hover:text-brand-700"
                          >
                            {ip}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Globe className="size-3.5" /> {t("kmp.det.hedefYol")}
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {k.hedefYollar.map((y) => (
                          <div key={y} className="truncate font-mono text-[12px] text-slate-muted">{y}</div>
                        ))}
                      </div>
                    </div>
                    {/* yaşam döngüsü */}
                    <div className="space-y-2 text-[12.5px]">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Clock className="size-3.5" /> {t("kmp.det.yasamDongusu")}
                      </div>
                      <div className="flex justify-between text-slate-muted">
                        <span>{t("kmp.det.ilkGorulme")}</span> <span className="text-slate-ink">{zaman(k.ilkGorulme, locale)}</span>
                      </div>
                      <div className="flex justify-between text-slate-muted">
                        <span>{t("kmp.det.zirveAni")}</span> <span className="text-slate-ink">{zaman(k.zirveTs, locale)} ({k.zirveSaat})</span>
                      </div>
                      <div className="flex justify-between text-slate-muted">
                        <span>{t("kmp.det.sonGorulme")}</span> <span className="text-slate-ink">{zaman(k.sonGorulme, locale)}</span>
                      </div>
                      <div className="flex justify-between text-slate-muted">
                        <span>{t("kmp.det.baskinSinif")}</span> <span className="text-slate-ink">{k.botClass}</span>
                      </div>
                      <div className="flex justify-between text-slate-muted">
                        <span>{t("kmp.det.asnSayisi")}</span> <span className="text-slate-ink">{k.asnlar.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href="/panel/kural-oneri"
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-ink-800"
                    >
                      {t("kmp.det.kuralOner")} <ArrowRight className="size-3.5" />
                    </Link>
                    <Link
                      href="/panel/tehdit-aktor"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      {t("kmp.det.aktorProfil")} <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* dürüstlük notu */}
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 px-4 py-3 text-[12px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-slate-faint" />
        <span>{t("kmp.not")}</span>
      </div>
    </div>
  );
}
