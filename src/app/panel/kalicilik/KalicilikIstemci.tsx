"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Repeat,
  History,
  ShieldAlert,
  RotateCcw,
  Search,
  ChevronDown,
  Server,
  Fingerprint,
  Route,
  CalendarDays,
  ArrowRight,
  Ban,
  Network,
  GitBranch,
  Clock,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kalicilikCeviri } from "./kalicilik.i18n";
import {
  TEHDIT_RENK,
  OTURUM_BOSLUK_MS,
  type KaliciSaldirgan,
  type KaliciTehdit,
  type KalicilikOzet,
  type Verdict,
} from "./kalici";

/* ------------------------------------------------------------------ yardımcılar */
type Ceviri = (anahtar: string) => string;

/** BCP-47 dil kodu eşlemesi (Intl biçimlendirme için). */
const BCP47: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

function zaman(ts: number, dil: Dil) {
  return new Date(ts).toLocaleString(BCP47[dil], { dateStyle: "medium", timeStyle: "short" });
}
function kisaTarih(ts: number, dil: Dil) {
  return new Date(ts).toLocaleDateString(BCP47[dil], { day: "2-digit", month: "short" });
}
function sureMetni(ms: number, t: Ceviri): string {
  const gun = ms / (24 * 60 * 60 * 1000);
  if (gun >= 1) return `${Math.round(gun * 10) / 10} ${t("kl.sure.gun")}`;
  const saat = ms / (60 * 60 * 1000);
  if (saat >= 1) return `${Math.round(saat * 10) / 10} ${t("kl.sure.saat")}`;
  return `${Math.max(1, Math.round(ms / 60000))} ${t("kl.sure.dk")}`;
}

/** Verdict → şerit rengi (oturum zaman çizelgesi noktaları için). */
const KARAR_RENK: Record<Verdict, string> = {
  allowed: "#16a34a",
  challenged: "#d97706",
  blocked: "#dc2626",
  flagged: "#7c3aed",
};

/** Karar (Verdict) enum → çeviri anahtarı. Enum değeri asla çevrilmez. */
const KARAR_ANAHTAR: Record<Verdict, string> = {
  allowed: "kl.karar.allowed",
  challenged: "kl.karar.challenged",
  blocked: "kl.karar.blocked",
  flagged: "kl.karar.flagged",
};

/** Tehdit sınıfı (KaliciTehdit) enum → çeviri anahtarı. Enum değeri korunur. */
const TEHDIT_ANAHTAR: Record<KaliciTehdit, string> = {
  "geçici": "kl.tehdit.geçici",
  tekrarlayan: "kl.tehdit.tekrarlayan",
  "inatçı": "kl.tehdit.inatçı",
  "kalıcı-tehdit": "kl.tehdit.kalıcı-tehdit",
};

const tonForTehdit = (t: KaliciSaldirgan["tehdit"]) =>
  t === "kalıcı-tehdit" ? "kirmizi" : t === "inatçı" ? "sari" : t === "tekrarlayan" ? "mavi" : "gri";

/* ------------------------------------------------------------------ Oturum zaman şeridi
 * Bir saldırganın dönüş oturumlarını ilk→son yayılımına göre yatay bir şeride
 * yerleştirir; her nokta bir "dönüş"tür, kararına göre renklidir. */
function OturumSeridi({ s, dil, t }: { s: KaliciSaldirgan; dil: Dil; t: Ceviri }) {
  const span = Math.max(1, s.sonGorulme - s.ilkGorulme);
  const W = 720;
  const H = 56;
  const R = 7;
  const pad = 14;
  const ic = W - pad * 2;
  const x = (ts: number) => pad + ((ts - s.ilkGorulme) / span) * ic;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="min-w-[520px]" role="img" aria-label={t("kl.grafik.seritAria")}>
        {/* taban ekseni */}
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#e2e8f0" strokeWidth={2} />
        {/* uçlar */}
        <text x={pad} y={H - 4} fontSize={10} fill="#94a3b8">{kisaTarih(s.ilkGorulme, dil)}</text>
        <text x={W - pad} y={H - 4} fontSize={10} fill="#94a3b8" textAnchor="end">{kisaTarih(s.sonGorulme, dil)}</text>
        {/* oturum noktaları — boyut istek sayısıyla orantılı */}
        {s.oturumlar.map((o, i) => {
          const cx = x(o.baslangic);
          const r = Math.min(11, R + Math.log2(o.istekSayisi + 1));
          const renk = KARAR_RENK[o.karar];
          return (
            <g key={i}>
              {o.engellendi && <circle cx={cx} cy={H / 2} r={r + 3.5} fill="none" stroke={renk} strokeOpacity={0.35} strokeWidth={2} />}
              <circle cx={cx} cy={H / 2} r={r} fill={renk} fillOpacity={0.9}>
                <title>{`${t("kl.grafik.donus")} ${i + 1}: ${zaman(o.baslangic, dil)} · ${o.istekSayisi} ${t("kl.grafik.istek")} · ${t(KARAR_ANAHTAR[o.karar])}`}</title>
              </circle>
              <text x={cx} y={H / 2 - r - 4} fontSize={9} fill="#64748b" textAnchor="middle">{i + 1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ İnatçılık dağılım grafiği
 * Scatter: X = ayrı oturum (dönüş) sayısı, Y = aktif gün sayısı, nokta boyutu =
 * toplam istek, renk = tehdit sınıfı. Sağ-üst köşe = en kararlı hasım. */
function DagilimGrafigi({ saldirganlar, t }: { saldirganlar: KaliciSaldirgan[]; t: Ceviri }) {
  const W = 720;
  const H = 300;
  const m = { top: 18, right: 18, bottom: 40, left: 44 };
  const maxOturum = Math.max(3, ...saldirganlar.map((s) => s.oturumSayisi));
  const maxGun = Math.max(3, ...saldirganlar.map((s) => s.aktifGunSayisi));
  const maxIstek = Math.max(1, ...saldirganlar.map((s) => s.toplamIstek));
  const px = (v: number) => m.left + (v / maxOturum) * (W - m.left - m.right);
  const py = (v: number) => H - m.bottom - (v / maxGun) * (H - m.top - m.bottom);

  const xTicks = Array.from({ length: maxOturum + 1 }, (_, i) => i).filter((i) => i % Math.ceil(maxOturum / 6 || 1) === 0);
  const yTicks = Array.from({ length: maxGun + 1 }, (_, i) => i).filter((i) => i % Math.ceil(maxGun / 5 || 1) === 0);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="min-w-[560px]" role="img" aria-label={t("kl.grafik.dagilimAria")}>
        {/* ızgara + eksen etiketleri */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={m.left} y1={py(t)} x2={W - m.right} y2={py(t)} stroke="#f1f5f9" strokeWidth={1} />
            <text x={m.left - 8} y={py(t) + 3} fontSize={10} fill="#94a3b8" textAnchor="end">{t}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={px(t)} y={H - m.bottom + 16} fontSize={10} fill="#94a3b8" textAnchor="middle">{t}</text>
        ))}
        <line x1={m.left} y1={m.top} x2={m.left} y2={H - m.bottom} stroke="#cbd5e1" strokeWidth={1.5} />
        <line x1={m.left} y1={H - m.bottom} x2={W - m.right} y2={H - m.bottom} stroke="#cbd5e1" strokeWidth={1.5} />
        <text x={(W + m.left) / 2} y={H - 6} fontSize={11} fill="#64748b" textAnchor="middle" fontWeight={600}>{t("kl.grafik.donusEkseni")}</text>
        <text x={14} y={m.top + 4} fontSize={11} fill="#64748b" fontWeight={600} transform={`rotate(-90 14 ${(H) / 2})`} textAnchor="middle">{t("kl.grafik.gunEkseni")}</text>

        {/* "en kararlı" bölge işareti (sağ-üst) */}
        <text x={W - m.right - 4} y={m.top + 12} fontSize={10} fill="#dc2626" textAnchor="end" fontWeight={600}>{t("kl.grafik.enKararli")}</text>

        {/* noktalar */}
        {saldirganlar.map((s) => {
          const r = 5 + (s.toplamIstek / maxIstek) * 14;
          return (
            <circle
              key={s.ip}
              cx={px(s.oturumSayisi)}
              cy={py(s.aktifGunSayisi)}
              r={r}
              fill={TEHDIT_RENK[s.tehdit]}
              fillOpacity={0.28}
              stroke={TEHDIT_RENK[s.tehdit]}
              strokeWidth={1.5}
            >
              <title>{`${s.ip} · ${s.oturumSayisi} ${t("kl.grafik.donus")} · ${s.aktifGunSayisi} ${t("kl.sure.gun")} · ${s.toplamIstek} ${t("kl.grafik.istek")} · ${t(TEHDIT_ANAHTAR[s.tehdit])}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ ana istemci */
export function KalicilikIstemci({
  dil,
  saldirganlar,
  ozet,
}: {
  dil: Dil;
  saldirganlar: KaliciSaldirgan[];
  ozet: KalicilikOzet;
}) {
  const t: Ceviri = (anahtar) => kalicilikCeviri(anahtar, dil);
  const [sorgu, setSorgu] = useState("");
  const [acik, setAcik] = useState<string | null>(saldirganlar[0]?.ip ?? null);

  const filtreli = useMemo(
    () =>
      saldirganlar.filter(
        (s) =>
          !sorgu ||
          `${s.ip} ${s.asn} ${s.country} ${s.botClass} ${t(TEHDIT_ANAHTAR[s.tehdit])}`
            .toLowerCase()
            .includes(sorgu.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saldirganlar, sorgu, dil],
  );

  const enInatci = ozet.enInatci;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Repeat className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("kl.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("kl.giris.aciklama") }} />
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamKalici} etiket={t("kl.ozet.toplam")} ikon={<Repeat className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.inatciSayisi} etiket={t("kl.ozet.inatci")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.engelAsanSayisi} etiket={t("kl.ozet.engel")} ikon={<Ban className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.ortDonusSayisi} etiket={t("kl.ozet.ortDonus")} ikon={<RotateCcw className="size-5" />} />
      </div>

      {/* honestlik / yöntem notu */}
      <NotKutusu ton="bilgi" baslik={t("kl.yontem.baslik")}>
        <span
          dangerouslySetInnerHTML={{
            __html: t("kl.yontem.metin").replace("{dk}", String(Math.round(OTURUM_BOSLUK_MS / 60000))),
          }}
        />
      </NotKutusu>

      {/* İnatçılık dağılımı */}
      {saldirganlar.length > 0 && (
        <Panel baslik={t("kl.dagilim.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("kl.dagilim.aciklama") }} />
          <DagilimGrafigi saldirganlar={saldirganlar} t={t} />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-slate-muted">
            {(["kalıcı-tehdit", "inatçı", "tekrarlayan", "geçici"] as const).map((tehdit) => (
              <span key={tehdit} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: TEHDIT_RENK[tehdit] }} />
                {t(TEHDIT_ANAHTAR[tehdit])}
              </span>
            ))}
          </div>
        </Panel>
      )}

      {/* arama */}
      {saldirganlar.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-slate-muted">
            <span className="font-semibold text-slate-ink">{filtreli.length}</span> {t("kl.arama.sonuc")}
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
            <Search className="size-4 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={t("kl.arama.placeholder")}
              className="w-48 bg-transparent text-[13px] outline-none"
              aria-label={t("kl.arama.ara")}
            />
          </div>
        </div>
      )}

      {/* kalıcı saldırgan listesi */}
      <div className="space-y-3">
        {saldirganlar.length === 0 && (
          <Panel baslik={t("kl.bos.baslik")}>
            <p className="py-8 text-center text-sm text-slate-muted">{t("kl.bos.metin")}</p>
          </Panel>
        )}
        {filtreli.map((s) => {
          const acikMi = acik === s.ip;
          const renk = TEHDIT_RENK[s.tehdit];
          return (
            <div key={s.ip} className="overflow-hidden rounded-3xl border border-line bg-surface">
              <button
                onClick={() => setAcik(acikMi ? null : s.ip)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-canvas/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: renk }}>
                  <History className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-[15px] font-semibold text-slate-ink">{s.ip}</span>
                    <Ulke kod={s.country} />
                    <Badge ton={tonForTehdit(s.tehdit)}>{t(TEHDIT_ANAHTAR[s.tehdit])}</Badge>
                    {s.mutasyon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-200">
                        <GitBranch className="size-3" /> {t("kl.kart.mutasyon")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-faint">
                    <span className="inline-flex items-center gap-1"><RotateCcw className="size-3" /> {s.oturumSayisi} {t("kl.kart.donus")}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {s.aktifGunSayisi} {t("kl.kart.ayriGun")}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {sureMetni(s.yayilimMs, t)} {t("kl.kart.yayilim")}</span>
                    <span className="truncate">{s.asn || "—"}</span>
                  </div>
                </div>
                {/* inat skoru barı */}
                <div className="hidden w-40 shrink-0 sm:block">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-muted">{t("kl.kart.inatSkoru")}</span>
                    <span className="num font-bold" style={{ color: renk }}>{s.inatSkoru}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.inatSkoru}%`, background: renk }} />
                  </div>
                </div>
                <ChevronDown className={cn("size-5 shrink-0 text-slate-faint transition", acikMi && "rotate-180")} />
              </button>

              {/* engele-rağmen-dönüş callout (her zaman görünür, güçlü sinyal) */}
              {s.donusRagmenEngel > 0 && (
                <div className="mx-6 mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-danger-soft px-3.5 py-2 text-[12.5px] font-medium text-red-800">
                  <Ban className="size-4 shrink-0" />
                  {t("kl.callout.engelRagmen")
                    .replace("{e}", String(s.engellenmeSayisi))
                    .replace("{d}", String(s.donusRagmenEngel))}
                </div>
              )}

              {acikMi && (
                <div className="border-t border-line bg-canvas/30 px-6 py-4">
                  {/* oturum zaman şeridi */}
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                      <History className="size-3.5" /> {t("kl.detay.seritBaslik")}
                    </div>
                    <div className="rounded-2xl border border-line bg-surface px-3 py-2">
                      <OturumSeridi s={s} dil={dil} t={t} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-muted">
                      {(["blocked", "challenged", "flagged", "allowed"] as Verdict[]).map((v) => (
                        <span key={v} className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ background: KARAR_RENK[v] }} />
                          {t(KARAR_ANAHTAR[v])}
                        </span>
                      ))}
                      <span className="text-slate-faint">{t("kl.detay.seritNot")}</span>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-3">
                    <div className="space-y-2 text-[12.5px]">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Fingerprint className="size-3.5" /> {t("kl.sinyal.baslik")}
                      </div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.sinyal.toplamIstek")}</span><span className="num font-semibold text-slate-ink">{s.toplamIstek}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.sinyal.engelChallenge")}</span><span className="num font-semibold text-slate-ink">{s.engellenmeSayisi}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.sinyal.engelRagmen")}</span><span className="num font-semibold text-danger2">{s.donusRagmenEngel}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.sinyal.baskinSinif")}</span><span className="font-medium text-slate-ink">{s.botClass}</span></div>
                    </div>
                    <div className="space-y-2 text-[12.5px]">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <GitBranch className="size-3.5" /> {t("kl.mutasyon.baslik")}
                      </div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.mutasyon.farkliUA")}</span><span className="num font-semibold text-slate-ink">{s.uaCesitliligi}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-muted">{t("kl.mutasyon.farkliYol")}</span><span className="num font-semibold text-slate-ink">{s.yolCesitliligi}</span></div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-muted">{t("kl.mutasyon.kacisDenemesi")}</span>
                        <span className={cn("font-semibold", s.mutasyon ? "text-purple-700" : "text-slate-ink")}>{s.mutasyon ? t("kl.mutasyon.evet") : t("kl.mutasyon.hayir")}</span>
                      </div>
                      {s.mutasyon && (
                        <p className="text-[11.5px] leading-relaxed text-slate-muted">{t("kl.mutasyon.aciklama")}</p>
                      )}
                    </div>
                    <div className="space-y-2 text-[12.5px]">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                        <Server className="size-3.5" /> {t("kl.altyapi.baslik")}
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-muted"><Server className="mt-0.5 size-3.5 shrink-0" /> {s.asn || "—"}</div>
                      <div className="text-slate-faint">{t("kl.altyapi.ilkGorulme").replace("{t}", zaman(s.ilkGorulme, dil))}</div>
                      <div className="text-slate-faint">{t("kl.altyapi.sonGorulme").replace("{t}", zaman(s.sonGorulme, dil))}</div>
                      <div className="text-slate-faint">{t("kl.altyapi.yayilim").replace("{s}", sureMetni(s.yayilimMs, t))}</div>
                    </div>
                  </div>

                  {/* öneri / eskalasyon */}
                  <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-ink">
                      <ShieldAlert className="size-4 text-danger2" /> {t("kl.oneri.baslik")}
                    </div>
                    {s.tehdit === "kalıcı-tehdit" || s.tehdit === "inatçı" ? (
                      <p
                        className="text-[12.5px] leading-relaxed text-slate-muted"
                        dangerouslySetInnerHTML={{
                          __html: t("kl.oneri.yuksek")
                            .replace("{m}", s.mutasyon ? t("kl.oneri.yuksekMutasyon") : "")
                            .replace("{asn}", s.asn || "ASN"),
                        }}
                      />
                    ) : (
                      <p className="text-[12.5px] leading-relaxed text-slate-muted">{t("kl.oneri.dusuk")}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button href="/panel/kural-oneri" size="sm">
                        {t("kl.oneri.kuralOner")} <ArrowRight className="size-3.5" />
                      </Button>
                      <Link href="/panel/federe" className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700">
                        <Network className="size-3.5" /> {t("kl.oneri.federe")}
                      </Link>
                      <Link href="/panel/kill-chain" className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700">
                        <Route className="size-3.5" /> {t("kl.oneri.killChain")}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* en kararlı hasım vurgusu */}
      {enInatci && enInatci.inatSkoru >= 45 && (
        <Panel baslik={t("kl.enKararli.baslik")}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="num text-lg font-bold text-slate-ink">{enInatci.ip}</span>
                <Ulke kod={enInatci.country} />
                <Badge ton={tonForTehdit(enInatci.tehdit)}>{t(TEHDIT_ANAHTAR[enInatci.tehdit])}</Badge>
              </div>
              <p className="mt-1 text-[12.5px] text-slate-muted">
                {t("kl.enKararli.ozet")
                  .replace("{d}", String(enInatci.oturumSayisi))
                  .replace("{g}", String(enInatci.aktifGunSayisi))
                  .replace("{s}", sureMetni(enInatci.yayilimMs, t))
                  .replace(
                    "{durum}",
                    enInatci.donusRagmenEngel > 0
                      ? t("kl.enKararli.engelRagmen").replace("{n}", String(enInatci.donusRagmenEngel))
                      : t("kl.enKararli.israrli"),
                  )}{" "}
                <b style={{ color: TEHDIT_RENK[enInatci.tehdit] }}>{enInatci.inatSkoru}</b>.
              </p>
            </div>
            <div className="ml-auto">
              <Button href="/panel/kural-oneri" variant="danger" size="sm">
                {t("kl.enKararli.kaliciEngel")} <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
