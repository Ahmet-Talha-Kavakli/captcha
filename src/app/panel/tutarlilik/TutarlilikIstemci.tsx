"use client";

import { useMemo, useState } from "react";
import {
  Fingerprint, ShieldCheck, ShieldAlert, ShieldX, Info, Check, X, ArrowRight, Play, Cpu,
} from "lucide-react";
import Link from "next/link";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  tarayiciTutarlilik, KARAR_RENK,
  type TutarlilikDagilim, type TutarlilikSonuc,
} from "@/lib/specter/tarayici-tutarlilik";
import { tutarlilikCeviri, TC_YEREL } from "./tutarlilik.i18n";
import type { Dil } from "@/lib/i18n/panel";

const KARAR_TON: Record<TutarlilikSonuc["karar"], "yesil" | "sari" | "kirmizi"> = {
  tutarli: "yesil", supheli: "sari", sahte: "kirmizi",
};

export function TutarlilikIstemci({ dil, dagilim }: { dil: Dil; dagilim: TutarlilikDagilim }) {
  const t = (k: string) => tutarlilikCeviri(k, dil);
  const nf = useMemo(() => new Intl.NumberFormat(TC_YEREL[dil]), [dil]);

  // Canlı denetleyici form durumu
  const [ua, setUa] = useState("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0 Safari/537.36");
  const [webdriver, setWebdriver] = useState(false);
  const [chromeNesnesi, setChromeNesnesi] = useState(true);
  const [deviceMemory, setDeviceMemory] = useState(8);
  const [webgl, setWebgl] = useState("NVIDIA GeForce RTX 3060");
  const [cekirdek, setCekirdek] = useState(8);
  const [eklenti, setEklenti] = useState(3);
  const [dilSayisi, setDilSayisi] = useState(2);
  const [piksel, setPiksel] = useState(1.5);
  const [sonuc, setSonuc] = useState<TutarlilikSonuc | null>(null);

  const denetle = () => {
    setSonuc(tarayiciTutarlilik({
      ua, webdriver, chromeNesnesi, deviceMemory: deviceMemory || undefined,
      webglSaticisi: webgl, hardwareConcurrency: cekirdek, eklentiSayisi: eklenti,
      dilSayisi, pikselOrani: piksel, sesOrnekOrani: 48000,
    }));
  };

  const maxAile = Math.max(1, ...dagilim.aileler.map((a) => a.sayi));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Fingerprint className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p className="text-[13px] text-slate-muted">{t("tc.aciklama")}</p>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={nf.format(dagilim.toplam)} etiket={t("tc.ozet.toplam")} ikon={<Fingerprint className="size-5" />} />
        <StatKart sayi={nf.format(dagilim.tutarli)} etiket={t("tc.ozet.tutarli")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={nf.format(dagilim.supheli)} etiket={t("tc.ozet.supheli")} ikon={<ShieldAlert className="size-5" />} tone="warn" />
        <StatKart sayi={nf.format(dagilim.sahte)} etiket={t("tc.ozet.sahte")} ikon={<ShieldX className="size-5" />} tone="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* aile dağılımı */}
        <Panel baslik={t("tc.aile.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("tc.aile.aciklama")}</p>
          <div className="space-y-3">
            {dagilim.aileler.map((a) => (
              <div key={a.aile}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium capitalize text-slate-ink">{a.aile}</span>
                  <span className="flex items-center gap-2 text-slate-muted">
                    <span className="num">{nf.format(a.sayi)} {t("tc.aile.olay")}</span>
                    {a.sahte > 0 && <Badge ton="kirmizi">{nf.format(a.sahte)} {t("tc.aile.sahte")}</Badge>}
                  </span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-l-full bg-brand-500" style={{ width: `${((a.sayi - a.sahte) / maxAile) * 100}%` }} />
                  <div className="h-full bg-danger2" style={{ width: `${(a.sahte / maxAile) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {dagilim.enCokSahteAile && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-red-700">
              <ShieldX className="size-4 shrink-0" /> {t("tc.encok")}: <b className="capitalize">{dagilim.enCokSahteAile}</b>
            </div>
          )}
          {/* TLS + headless mini kartlar */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-slate-ink">{t("tc.tls.baslik")}</p>
              <p className="num mt-0.5 text-[22px] font-bold text-danger2">{nf.format(dagilim.tlsUaUyumsuz)}</p>
              <p className="mt-0.5 text-[11px] text-slate-faint">{t("tc.tls.aciklama")}</p>
            </div>
            <div className="rounded-xl border border-line px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-slate-ink">{t("tc.headless.baslik")}</p>
              <p className="num mt-0.5 text-[22px] font-bold text-warn">{nf.format(dagilim.headless)}</p>
              <p className="mt-0.5 text-[11px] text-slate-faint">{t("tc.headless.aciklama")}</p>
            </div>
          </div>
        </Panel>

        {/* canlı denetleyici */}
        <Panel baslik={t("tc.sim.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">{t("tc.sim.aciklama")}</p>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-slate-muted">{t("tc.sim.ua")}</span>
              <input value={ua} onChange={(e) => setUa(e.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-[11.5px] text-slate-ink outline-none focus:border-brand-400" />
            </label>
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <Toggle etiket={t("tc.sim.webdriver")} deger={webdriver} setDeger={setWebdriver} tehlike />
              <Toggle etiket={t("tc.sim.chrome")} deger={chromeNesnesi} setDeger={setChromeNesnesi} />
              <Sayi etiket={t("tc.sim.devicememory")} deger={deviceMemory} setDeger={setDeviceMemory} />
              <Sayi etiket={t("tc.sim.cekirdek")} deger={cekirdek} setDeger={setCekirdek} />
              <Sayi etiket={t("tc.sim.eklenti")} deger={eklenti} setDeger={setEklenti} />
              <Sayi etiket={t("tc.sim.dil")} deger={dilSayisi} setDeger={setDilSayisi} />
              <label className="col-span-2 block">
                <span className="mb-1 block text-[12px] font-medium text-slate-muted">{t("tc.sim.webgl")}</span>
                <input value={webgl} onChange={(e) => setWebgl(e.target.value)} className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] text-slate-ink outline-none focus:border-brand-400" />
              </label>
            </div>
            <Button variant="accent" onClick={denetle} className="w-full justify-center">
              <Play className="size-4" /> {t("tc.sim.calistir")}
            </Button>
          </div>

          {sonuc && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${KARAR_RENK[sonuc.karar]}14` }}>
                <div>
                  <p className="text-[12px] text-slate-muted">{t("tc.sim.sonuc")}</p>
                  <p className="num text-[30px] font-bold leading-none" style={{ color: KARAR_RENK[sonuc.karar] }}>{sonuc.skor}</p>
                </div>
                <div className="text-right">
                  <Badge ton={KARAR_TON[sonuc.karar]}>{t(`tc.karar.${sonuc.karar}`)}</Badge>
                  <p className="mt-1 text-[11.5px] text-slate-faint capitalize">{t("tc.sim.ailesi")}: {sonuc.ailesi} · {sonuc.os}</p>
                </div>
              </div>
              {sonuc.enGucluKanit ? (
                <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12px] text-red-700">
                  <ShieldX className="mt-0.5 size-4 shrink-0" /><span><b>{t("tc.sim.kanit")}:</b> {sonuc.enGucluKanit}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-ok-soft px-3.5 py-2.5 text-[12px] text-green-700">
                  <ShieldCheck className="size-4 shrink-0" /> {t("tc.sim.kanityok")}
                </div>
              )}
              {/* kontrol listesi */}
              <div className="space-y-1.5">
                <p className="text-[12px] font-semibold text-slate-ink">{t("tc.kontrol.baslik")}</p>
                {sonuc.kontroller.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[12px]">
                    <div className="flex min-w-0 items-start gap-2">
                      {c.gecti
                        ? <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3" /></span>
                        : <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-danger-soft text-danger2"><X className="size-3" /></span>}
                      <div className="min-w-0">
                        <span className="font-medium text-slate-ink">{c.ad}</span>
                        {c.kritik && !c.gecti && <span className="ml-1.5 rounded bg-danger-soft px-1 text-[10px] font-semibold text-red-700">{t("tc.kontrol.kritik")}</span>}
                        <p className="text-[11px] text-slate-faint">{c.detay}</p>
                      </div>
                    </div>
                    <span className={cn("shrink-0 text-[11px] font-medium", c.gecti ? "text-ok" : "text-danger2")}>
                      {c.gecti ? t("tc.kontrol.gecti") : t("tc.kontrol.kaldi")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* nasıl çalışır */}
      <Panel baslik={t("tc.nasil.baslik")}>
        <div className="grid gap-3 sm:grid-cols-4">
          {["tc.nasil.1", "tc.nasil.2", "tc.nasil.3", "tc.nasil.4"].map((k, i) => (
            <div key={k} className="relative rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
              <span className="grid size-6 place-items-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-700">{i + 1}</span>
              <p className="mt-2 text-[12px] text-slate-muted">{t(k)}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* ghost-font bağlantısı */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="flex items-center gap-3">
          <Cpu className="size-6 text-brand-300" />
          <h3 className="text-[16px] font-semibold text-white">{t("tc.ghost.baglanti")}</h3>
        </div>
        <Link href="/panel/ocr-kanit" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">
          Ghost-Font <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("tc.not")}</span>
      </div>
    </div>
  );
}

function Toggle({ etiket, deger, setDeger, tehlike }: { etiket: string; deger: boolean; setDeger: (v: boolean) => void; tehlike?: boolean }) {
  return (
    <button onClick={() => setDeger(!deger)} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-left transition hover:bg-canvas">
      <span className="text-[12px] text-slate-ink">{etiket}</span>
      <span className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full transition", deger ? (tehlike ? "bg-danger2" : "bg-brand-600") : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-all", deger ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Sayi({ etiket, deger, setDeger }: { etiket: string; deger: number; setDeger: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate-muted">{etiket}</span>
      <input type="number" value={deger} onChange={(e) => setDeger(Number(e.target.value))} className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] text-slate-ink outline-none focus:border-brand-400" />
    </label>
  );
}
