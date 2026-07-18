"use client";

import { useMemo, useState } from "react";
import {
  ShieldAlert,
  Radar,
  Network,
  KeyRound,
  Crosshair,
  Activity,
  ChevronDown,
  Search,
  Fingerprint,
  Globe,
  Server,
  Clock,
  ArrowRight,
  CircleDot,
  ShieldX,
  Siren,
  Check,
  Layers,
} from "lucide-react";
import { Panel, StatKart, Badge, DurumRozeti, BosDurum, Ulke, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type {
  Korelasyon,
  KorelasyonOzet,
  KorelasyonSiddet,
  KorelasyonTur,
} from "@/lib/specter/correlation";
import type { Dil } from "@/lib/i18n/panel";
import { korelasyonCeviri, korelasyonBaslikCeviri, killchainCeviri } from "./korelasyon.i18n";

/** t yardımcı tipi — alt bileşenlere prop olarak geçirilir. */
type Ceviri = (anahtar: string) => string;

/* Enum→anahtar eşlemeleri: enum DEĞERİ (filtre/arama) çevrilmez; etiket t() ile. */
const TUR_ANAHTAR: Record<KorelasyonTur, string> = {
  kimlik_dogrulama_saldirisi: "ko.tur.kimlik_dogrulama_saldirisi",
  kazima_kampanyasi: "ko.tur.kazima_kampanyasi",
  dagitik_bot_agi: "ko.tur.dagitik_bot_agi",
  hedefli_endpoint_saldirisi: "ko.tur.hedefli_endpoint_saldirisi",
  ip_patlamasi: "ko.tur.ip_patlamasi",
};
const SIDDET_ANAHTAR: Record<KorelasyonSiddet, string> = {
  kritik: "ko.siddet.kritik",
  yuksek: "ko.siddet.yuksek",
  orta: "ko.siddet.orta",
  dusuk: "ko.siddet.dusuk",
};

/* ------------------------------------------------------------------ Meta */

const TUR_IKON: Record<KorelasyonTur, React.ReactNode> = {
  kimlik_dogrulama_saldirisi: <KeyRound className="size-4" />,
  kazima_kampanyasi: <Layers className="size-4" />,
  dagitik_bot_agi: <Network className="size-4" />,
  hedefli_endpoint_saldirisi: <Crosshair className="size-4" />,
  ip_patlamasi: <Radar className="size-4" />,
};

const SIDDET_META: Record<
  KorelasyonSiddet,
  { badge: "kirmizi" | "sari" | "mavi" | "gri"; nokta: string; ring: string; kenar: string }
> = {
  kritik: { badge: "kirmizi", nokta: "#dc2626", ring: "#dc2626", kenar: "border-l-red-500" },
  yuksek: { badge: "sari", nokta: "#ea580c", ring: "#ea580c", kenar: "border-l-orange-500" },
  orta: { badge: "mavi", nokta: "#2563eb", ring: "#2563eb", kenar: "border-l-blue-500" },
  dusuk: { badge: "gri", nokta: "#64748b", ring: "#64748b", kenar: "border-l-slate-400" },
};

function zaman(ts: number): string {
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saat(ts: number): string {
  return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** İki ts arası süreyi insan-okur biçimde (deterministik — Date.now yok). */
function sure(ms: number, t: Ceviri): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return t("ko.birim.sn").replace("{n}", String(s));
  const dk = Math.round(s / 60);
  if (dk < 60) return t("ko.birim.dk").replace("{n}", String(dk));
  const sa = Math.round(dk / 60);
  if (sa < 24) return t("ko.birim.sa").replace("{n}", String(sa));
  return t("ko.birim.g").replace("{n}", String(Math.round(sa / 24)));
}

/* ------------------------------------------------------------------ Güven halkası */

function GuvenHalka({ deger, renk }: { deger: number; renk: string }) {
  const r = 22;
  const cevre = 2 * Math.PI * r;
  const dolu = (deger / 100) * cevre;
  return (
    <div className="relative grid size-[58px] shrink-0 place-items-center">
      <svg viewBox="0 0 58 58" className="size-[58px] -rotate-90">
        <circle cx="29" cy="29" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-canvas" />
        <circle
          cx="29"
          cy="29"
          r={r}
          fill="none"
          stroke={renk}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dolu} ${cevre}`}
        />
      </svg>
      <span className="absolute num text-[13px] font-bold text-slate-ink">%{deger}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Kill-chain stepper */

function KillChain({ taktikler, siddet, dil }: { taktikler: string[]; siddet: KorelasyonSiddet; dil: Dil }) {
  const renk = SIDDET_META[siddet].nokta;
  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {taktikler.map((taktik, i) => (
        <div key={taktik} className="flex items-center">
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-canvas/60 px-2.5 py-1">
            <span
              className="grid size-4 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: renk }}
            >
              {i + 1}
            </span>
            <span className="text-[12px] font-medium text-slate-ink">{killchainCeviri(taktik, dil)}</span>
          </div>
          {i < taktikler.length - 1 && <ArrowRight className="mx-1 size-3.5 shrink-0 text-slate-faint" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Örnek olay tablosu */

function OrnekTablo({ kor, t }: { kor: Korelasyon; t: Ceviri }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/40 text-[11px] uppercase tracking-wide text-slate-faint">
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.zaman")}</th>
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.ip")}</th>
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.ulke")}</th>
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.path")}</th>
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.sinif")}</th>
            <th className="px-4 py-2.5 font-semibold">{t("ko.tablo.karar")}</th>
            <th className="px-4 py-2.5 text-right font-semibold">{t("ko.tablo.skor")}</th>
          </tr>
        </thead>
        <tbody>
          {kor.ornekOlaylar.map((e) => (
            <tr key={e.id} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap px-4 py-2.5 num text-[12.5px] text-slate-muted">{saat(e.ts)}</td>
              <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-ink">{e.ip}</td>
              <td className="px-4 py-2.5"><Ulke kod={e.country} /></td>
              <td className="px-4 py-2.5 font-mono text-[12px] text-slate-muted">{e.path}</td>
              <td className="px-4 py-2.5 text-[12.5px] text-slate-ink">{e.botClass}</td>
              <td className="px-4 py-2.5">
                <Badge ton={e.verdict === "blocked" ? "kirmizi" : e.verdict === "challenged" ? "sari" : e.verdict === "flagged" ? "mavi" : "yesil"}>
                  {e.verdict}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-right num text-[12.5px] font-medium text-slate-ink">
                {e.score.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ Korelasyon kartı */

function KorelasyonKart({ kor, dil, t }: { kor: Korelasyon; dil: Dil; t: Ceviri }) {
  const [acik, setAcik] = useState(false);
  const [olayDurum, setOlayDurum] = useState<"bos" | "yukleniyor" | "olustu">("bos");
  const { goster } = useToast();
  const m = SIDDET_META[kor.siddet];

  async function olayOlustur() {
    if (olayDurum !== "bos") return;
    setOlayDurum("yukleniyor");
    try {
      const r = await fetch("/api/korelasyon/olay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ korelasyonId: kor.id }),
      });
      if (!r.ok) throw new Error();
      setOlayDurum("olustu");
      goster({ tip: "basari", baslik: t("ko.toast.olustuBaslik"), aciklama: t("ko.toast.olustuAciklama") });
    } catch {
      setOlayDurum("bos");
      goster({ tip: "hata", baslik: t("ko.toast.olusturulamadi") });
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-line border-l-[3px] bg-surface transition", m.kenar)}>
      {/* başlık satırı */}
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-canvas/40"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {TUR_IKON[kor.tur]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-slate-ink">{korelasyonBaslikCeviri(kor.baslik, dil)}</span>
            <Badge ton={m.badge}>{t(SIDDET_ANAHTAR[kor.siddet])}</Badge>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {t(TUR_ANAHTAR[kor.tur])}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-muted">
            <span className="flex items-center gap-1"><Activity className="size-3.5" /> {kor.olaySayisi} {t("ko.kart.olay")}</span>
            <span className="flex items-center gap-1"><Fingerprint className="size-3.5" /> {kor.benzersizIp} {t("ko.kart.ip")}</span>
            <span className="flex items-center gap-1"><ShieldX className="size-3.5" /> %{Math.round(kor.engelOrani * 100)} {t("ko.kart.engel")}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {zaman(kor.sonGorulme)}</span>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <GuvenHalka deger={kor.guvenSkoru} renk={m.ring} />
          <ChevronDown className={cn("size-5 text-slate-faint transition", acik && "rotate-180")} />
        </div>
        <ChevronDown className={cn("size-5 shrink-0 text-slate-faint transition sm:hidden", acik && "rotate-180")} />
      </button>

      {/* genişleyen detay */}
      {acik && (
        <div className="space-y-5 border-t border-line bg-canvas/20 px-5 py-5">
          {/* kill-chain */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              <Crosshair className="size-3.5" /> {t("ko.detay.killchain")}
            </div>
            <KillChain taktikler={kor.taktikler} siddet={kor.siddet} dil={dil} />
          </div>

          {/* meta kutucukları */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaKutu ikon={<Fingerprint className="size-4" />} etiket={t("ko.detay.benzersizIp")} deger={String(kor.benzersizIp)} />
            <MetaKutu ikon={<Globe className="size-4" />} etiket={t("ko.detay.ulke")} deger={kor.ulkeler.map((u) => u).join(", ")} />
            <MetaKutu ikon={<Server className="size-4" />} etiket={t("ko.detay.asn")} deger={kor.asnler.length === 1 ? kor.asnler[0] : t("ko.detay.asnAg").replace("{n}", String(kor.asnler.length))} />
            <MetaKutu ikon={<Clock className="size-4" />} etiket={t("ko.detay.sure")} deger={sure(kor.sonGorulme - kor.ilkGorulme, t)} />
          </div>

          {/* güven + zaman aralığı */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <GuvenHalka deger={kor.guvenSkoru} renk={m.ring} />
              <div>
                <div className="text-[13px] font-semibold text-slate-ink">{t("ko.detay.guvenBaslik")}</div>
                <div className="text-[12px] text-slate-muted">
                  {t("ko.detay.guvenAlt")}
                </div>
              </div>
            </div>
            <div className="ml-auto text-right text-[12.5px] text-slate-muted">
              <div><span className="text-slate-faint">{t("ko.detay.ilkGorulme")}</span> <span className="num text-slate-ink">{zaman(kor.ilkGorulme)}</span></div>
              <div><span className="text-slate-faint">{t("ko.detay.sonGorulme")}</span> <span className="num text-slate-ink">{zaman(kor.sonGorulme)}</span></div>
            </div>
          </div>

          {/* hedeflenen path'ler */}
          {kor.pathler.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
                <Crosshair className="size-3.5" /> {t("ko.detay.endpointler")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kor.pathler.slice(0, 12).map((p) => (
                  <span key={p} className="rounded-lg border border-line bg-surface px-2 py-1 font-mono text-[12px] text-slate-ink">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* örnek olaylar */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              <Activity className="size-3.5" /> {t("ko.detay.ornekOlaylar").replace("{a}", String(kor.ornekOlaylar.length)).replace("{b}", String(kor.olaySayisi))}
            </div>
            <OrnekTablo kor={kor} t={t} />
          </div>

          {/* olay yönetimine aktar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-3">
            <div className="flex items-center gap-2 text-[12.5px] text-slate-muted">
              <Siren className="size-4 text-brand-600" />
              {t("ko.olay.aciklama")}
            </div>
            {olayDurum === "olustu" ? (
              <a href="/panel/uyarilar" className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3.5 py-2 text-[13px] font-semibold text-ok transition hover:brightness-95">
                <Check className="size-4" /> {t("ko.olay.olustu")}
              </a>
            ) : (
              <Button size="sm" onClick={olayOlustur} disabled={olayDurum === "yukleniyor"}>
                <Siren className="size-4" /> {olayDurum === "yukleniyor" ? t("ko.olay.olusturuluyor") : t("ko.olay.olustur")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaKutu({ ikon, etiket, deger }: { ikon: React.ReactNode; etiket: string; deger: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-faint">{ikon} {etiket}</div>
      <div className="mt-1 truncate text-[13px] font-semibold text-slate-ink" title={deger}>{deger || "—"}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */

const SIDDET_SIRA: KorelasyonSiddet[] = ["kritik", "yuksek", "orta", "dusuk"];

/** Alt bilgi notu — çeviri içinde "gerçek kurallarla" ifadesini kalınlaştırır. */
function notMetni(t: Ceviri): React.ReactNode {
  const tam = t("ko.not");
  const vurgu = t("ko.not.gercekKurallar");
  const idx = tam.indexOf(vurgu);
  if (idx === -1) return tam;
  return (
    <>
      {tam.slice(0, idx)}
      <b>{vurgu}</b>
      {tam.slice(idx + vurgu.length)}
    </>
  );
}

export function KorelasyonIstemci({
  korelasyonlar,
  ozet,
  toplamOlay,
  dil,
}: {
  korelasyonlar: Korelasyon[];
  ozet: KorelasyonOzet;
  toplamOlay: number;
  dil: Dil;
}) {
  const t = (anahtar: string) => korelasyonCeviri(anahtar, dil);
  const { goster } = useToast();
  const [siddetFiltre, setSiddetFiltre] = useState<KorelasyonSiddet | "hepsi">("hepsi");
  const [sorgu, setSorgu] = useState("");

  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    return korelasyonlar.filter((k) => {
      if (siddetFiltre !== "hepsi" && k.siddet !== siddetFiltre) return false;
      if (!q) return true;
      // Arama havuzu: çevrilmiş başlık + tür etiketi + VERİ (ülke/ASN/path/sınıf).
      const havuz = [
        korelasyonBaslikCeviri(k.baslik, dil),
        t(TUR_ANAHTAR[k.tur]),
        ...k.ulkeler,
        ...k.asnler,
        ...k.pathler,
        k.dominantBotClass,
      ]
        .join(" ")
        .toLowerCase();
      return havuz.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [korelasyonlar, siddetFiltre, sorgu, dil]);

  // Şiddet başına sayaç (filtre çubuğu rozetleri).
  const siddetSayim = useMemo(() => {
    const m: Record<string, number> = { hepsi: korelasyonlar.length };
    for (const s of SIDDET_SIRA) m[s] = korelasyonlar.filter((k) => k.siddet === s).length;
    return m;
  }, [korelasyonlar]);

  function raporIndir() {
    const satirlar: string[] = [];
    satirlar.push("=".repeat(76));
    satirlar.push(`  SPECTER — ${t("ko.rapor.baslik")}`);
    satirlar.push(
      `  ${korelasyonlar.length} ${t("ko.rapor.korelasyon")} · ${ozet.kritik} ${t("ko.rapor.kritik")} · ${ozet.etkilenenIp} ${t("ko.rapor.etkilenenIp")}`,
    );
    satirlar.push("=".repeat(76));
    satirlar.push("");
    for (const k of korelasyonlar) {
      satirlar.push(`[${t(SIDDET_ANAHTAR[k.siddet]).toUpperCase()}] ${korelasyonBaslikCeviri(k.baslik, dil)}`);
      satirlar.push(`   ${t("ko.rapor.tur")}: ${t(TUR_ANAHTAR[k.tur])} · ${t("ko.rapor.guven")}: %${k.guvenSkoru}`);
      satirlar.push(`   ${t("ko.rapor.olay")}: ${k.olaySayisi} · ${t("ko.rapor.benzersizIp")}: ${k.benzersizIp} · ${t("ko.rapor.engel")}: %${Math.round(k.engelOrani * 100)}`);
      satirlar.push(`   ${t("ko.rapor.ulke")}: ${k.ulkeler.join(", ")} · ${t("ko.rapor.asn")}: ${k.asnler.join(", ")}`);
      satirlar.push(`   ${t("ko.rapor.endpoint")}: ${k.pathler.join(", ")}`);
      satirlar.push(`   ${t("ko.rapor.zincir")}: ${k.taktikler.map((tk) => killchainCeviri(tk, dil)).join(" -> ")}`);
      satirlar.push(`   ${t("ko.rapor.ilk")}: ${zaman(k.ilkGorulme)}  ${t("ko.rapor.son")}: ${zaman(k.sonGorulme)}`);
      satirlar.push("");
    }
    const blob = new Blob(["﻿" + satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specter-korelasyon-raporu.txt";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("ko.toast.raporIndi") });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Radar className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ko.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("ko.serit.aciklama").replace("{n}", toplamOlay.toLocaleString("tr-TR"))}
          </p>
        </div>
      </div>

      {/* özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ozet.toplam}
          etiket={t("ko.kpi.korelasyon")}
          ikon={<Network className="size-5" />}
          tone={ozet.toplam > 0 ? "brand" : undefined}
        />
        <StatKart
          sayi={ozet.kritik}
          etiket={t("ko.kpi.kritik")}
          ikon={<ShieldAlert className="size-5" />}
          tone={ozet.kritik > 0 ? "danger" : "ok"}
        />
        <StatKart
          sayi={ozet.etkilenenIp.toLocaleString("tr-TR")}
          etiket={t("ko.kpi.etkilenenIp")}
          ikon={<Fingerprint className="size-5" />}
        />
        <StatKart
          sayi={ozet.aktifSaldiri}
          etiket={t("ko.kpi.aktif")}
          ikon={<Activity className="size-5" />}
          tone={ozet.aktifSaldiri > 0 ? "warn" : "ok"}
        />
      </div>

      {/* en yaygın tür bilgi şeridi */}
      {ozet.enYayginTur && (
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-[13px] text-slate-muted">
          <CircleDot className="size-4 text-brand-600" />
          {t("ko.enYaygin")}{" "}
          <span className="font-semibold text-slate-ink">{t(TUR_ANAHTAR[ozet.enYayginTur])}</span>
          {ozet.aktifSaldiri > 0 && (
            <span className="ml-auto">
              <DurumRozeti ton="danger" etiket={t("ko.aktifRozet").replace("{n}", String(ozet.aktifSaldiri))} nabiz />
            </span>
          )}
        </div>
      )}

      {/* filtre + arama + rapor */}
      <Panel
        baslik={t("ko.panel.baslik")}
        sagUst={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" href="/api/korelasyon?format=ndjson">
              {t("ko.btn.siem")}
            </Button>
            <Button variant="outline" size="sm" onClick={raporIndir}>
              {t("ko.btn.rapor")}
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* şiddet filtreleri */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["hepsi", ...SIDDET_SIRA] as const).map((s) => {
              const aktif = siddetFiltre === s;
              const etiket = s === "hepsi" ? t("ko.filtre.hepsi") : t(SIDDET_ANAHTAR[s]);
              return (
                <button
                  key={s}
                  onClick={() => setSiddetFiltre(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                    aktif
                      ? "border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                      : "border-line text-slate-muted hover:border-line-strong hover:text-slate-ink",
                  )}
                >
                  {s !== "hepsi" && (
                    <span className="size-2 rounded-full" style={{ background: SIDDET_META[s].nokta }} />
                  )}
                  {etiket}
                  <span className="num text-[11px] text-slate-faint">{siddetSayim[s] ?? 0}</span>
                </button>
              );
            })}
          </div>
          {/* arama */}
          <div className="relative sm:ml-auto sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={t("ko.ara.yer")}
              aria-label={t("ko.ara.etiket")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
        </div>

        {/* liste */}
        {korelasyonlar.length === 0 ? (
          <BosDurum
            ikon={<Radar className="size-7" />}
            baslik={t("ko.bos.yokBaslik")}
            aciklama={t("ko.bos.yokAciklama")}
          />
        ) : filtreli.length === 0 ? (
          <BosDurum
            ikon={<Search className="size-7" />}
            baslik={t("ko.bos.eslesmeBaslik")}
            aciklama={t("ko.bos.eslesmeAciklama")}
          />
        ) : (
          <div className="space-y-3">
            {filtreli.map((k) => (
              <KorelasyonKart key={k.id} kor={k} dil={dil} t={t} />
            ))}
          </div>
        )}
      </Panel>

      {/* not */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Radar className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{notMetni(t)}</span>
      </div>
    </div>
  );
}
