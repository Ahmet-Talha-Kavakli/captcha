"use client";

import { useState } from "react";
import Link from "next/link";
import { UserSearch, ShieldAlert, Crosshair, Target, Search, ArrowRight, Fingerprint, Globe, Server, ChevronDown } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import { SEVIYE_RENK, AKTOR_PROFILLERI } from "@/lib/specter/tehdit-aktor";
import type { AktorAtif } from "@/lib/specter/tehdit-aktor";
import type { Dil } from "@/lib/i18n/panel";
import { aktorCeviri } from "./tehdit-aktor.i18n";
import { cn } from "@/lib/cn";

const LOCALE: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

function zaman(ts: number, dil: Dil) { return new Date(ts).toLocaleString(LOCALE[dil]); }

// Motorun döndürdüğü Türkçe profil adı → profil id (dağılım/en-aktif çevirisi için).
const AD_ID = new Map(AKTOR_PROFILLERI.map((p) => [p.ad, p.id]));

export function TehditAktorIstemci({
  atiflar, ozet, dil,
}: {
  atiflar: AktorAtif[];
  ozet: { toplamAktor: number; gelismisAktor: number; profilDagilim: { ad: string; sayi: number }[]; enAktifProfil: string };
  dil: Dil;
}) {
  const t = (k: string) => aktorCeviri(k, dil);
  // Türkçe profil adını (motordan gelen) id üzerinden çevir; eşleşmezse ("—" vb.) olduğu gibi bırak.
  const profilAdCevir = (ad: string) => { const id = AD_ID.get(ad); return id ? t(`profil.${id}.ad`) : ad; };
  const [sorgu, setSorgu] = useState("");
  const [acik, setAcik] = useState<string | null>(atiflar[0]?.id ?? null);

  const filtreli = atiflar.filter((a) =>
    !sorgu || `${profilAdCevir(a.profil.ad)} ${a.dominantSinif} ${a.asnler.join(" ")} ${a.ulkeler.join(" ")}`.toLowerCase().includes(sorgu.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <UserSearch className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("intro.title")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("intro.body.1")}<b>{t("intro.body.actor")}</b>{t("intro.body.2")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamAktor} etiket={t("stat.detected")} ikon={<UserSearch className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.gelismisAktor} etiket={t("stat.advanced")} ikon={<ShieldAlert className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.profilDagilim.length} etiket={t("stat.distinct")} ikon={<Target className="size-5" />} />
        <StatKart sayi={profilAdCevir(ozet.enAktifProfil)} etiket={t("stat.mostActive")} ikon={<Crosshair className="size-5" />} />
      </div>

      {/* profil dağılımı */}
      {ozet.profilDagilim.length > 0 && (
        <Panel baslik={t("panel.distribution")}>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ozet.profilDagilim.map((p) => (
              <div key={p.ad} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className="text-[13px] font-medium text-slate-ink">{profilAdCevir(p.ad)}</span>
                <Badge ton="mavi">{p.sayi} {t("badge.group")}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* arama */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
          <Search className="size-4 text-slate-faint" />
          <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("search.placeholder")} className="w-48 bg-transparent text-[13px] outline-none" aria-label={t("search.aria")} />
        </div>
      </div>

      {/* aktör atıfları */}
      <div className="space-y-3">
        {filtreli.length === 0 && <Panel baslik={t("panel.noActor")}><p className="py-8 text-center text-sm text-slate-muted">{t("empty")}</p></Panel>}
        {filtreli.map((a) => {
          const acikMi = acik === a.id;
          return (
            <div key={a.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
              <button onClick={() => setAcik(acikMi ? null : a.id)} className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-canvas/40">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: SEVIYE_RENK[a.profil.seviye] }}><UserSearch className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-ink">{t(`profil.${a.profil.id}.ad`)}</span>
                    <Badge ton={a.profil.seviye === "gelişmiş" ? "kirmizi" : a.profil.seviye === "organize" ? "sari" : "gri"}>{t(`sev.${a.profil.seviye}`)}</Badge>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{t("confidence")} %{a.guven}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-slate-muted">{t(`profil.${a.profil.id}.aciklama`)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-faint">
                    <span>{a.toplamOlay} {t("events")} · {a.benzersizIp} IP</span>
                    <span className="flex items-center gap-1">{a.ulkeler.slice(0, 4).map((u) => <Ulke key={u} kod={u} />)}</span>
                    <span>{t(`profil.${a.profil.id}.motivasyon`)}</span>
                  </div>
                </div>
                <ChevronDown className={cn("size-5 shrink-0 text-slate-faint transition", acikMi && "rotate-180")} />
              </button>
              {acikMi && (
                <div className="border-t border-line bg-canvas/30 px-6 py-4">
                  <div className="grid gap-5 lg:grid-cols-3">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint"><Fingerprint className="size-3.5" /> {t("ioc")}</div>
                      <div className="space-y-1.5">
                        {a.gostergeler.map((g) => (
                          <div key={g} className="flex items-start gap-1.5 text-[12.5px] text-slate-ink"><Crosshair className="mt-0.5 size-3 shrink-0 text-danger2" /> {g}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint"><Target className="size-3.5" /> {t("ttp")}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {a.profil.ttp.map((tp, ti) => <span key={tp} className="rounded-full bg-canvas px-2.5 py-1 text-[11.5px] text-slate-muted">{t(`ttp.${a.profil.id}.${ti}`)}</span>)}
                      </div>
                    </div>
                    <div className="space-y-2 text-[12.5px]">
                      <div className="flex items-center gap-1.5 text-slate-muted"><Server className="size-3.5 shrink-0" /> {a.asnler.slice(0, 2).join(", ") || "—"}</div>
                      <div className="flex items-start gap-1.5 text-slate-muted"><Globe className="mt-0.5 size-3.5 shrink-0" /> {t("target")}: {a.hedefYollar.slice(0, 3).join(", ")}</div>
                      <div className="text-slate-faint">{t("first")}: {zaman(a.ilkGorulme, dil)}</div>
                      <div className="text-slate-faint">{t("last")}: {zaman(a.sonGorulme, dil)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href="/panel/kural-oneri" className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-ink-800">{t("cta.rule")} <ArrowRight className="size-3.5" /></Link>
                    <Link href="/panel/iliski-grafigi" className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700">{t("cta.graph")} <ArrowRight className="size-3.5" /></Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
