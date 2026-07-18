"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Eye, EyeOff, ScanLine, Gauge, TrendingUp, Check, Bot, ArrowRight, Sparkles, Download } from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik } from "@/components/panel/grafikler";
import type { OcrMetrik } from "@/lib/specter/ocr-direnc";
import type { Dil } from "@/lib/i18n/panel";
import { ocrCeviri } from "./ocr-kanit.i18n";
import { cn } from "@/lib/cn";

type Zorluk = "low" | "medium" | "high";
interface Egri { kare: number; etkinKontrast: number }

const ZORLUK_RENK: Record<Zorluk, string> = { low: "#16a34a", medium: "#2f6fed", high: "#dc2626" };

export function OcrKanitIstemci({
  metrikler, ozet, egriler, dil,
}: {
  metrikler: OcrMetrik[];
  ozet: { okunabilirGaranti: boolean; minZamanKontrast: number; maxOcrDirenc: number; metrikler: OcrMetrik[] };
  egriler: Record<Zorluk, Egri[]>;
  dil: Dil;
}) {
  const t = (k: string) => ocrCeviri(k, dil);
  // Zorluk enum → yerelleştirilmiş etiket (lib'teki ZORLUK_ETIKET_OCR yerine).
  const zorlukEtiket = (z: Zorluk) => t(`ocr.zorluk.${z}`);
  const { goster } = useToast();
  const [zorluk, setZorluk] = useState<Zorluk>("medium");
  const secili = metrikler.find((m) => m.zorluk === zorluk)!;
  const egri = egriler[zorluk];

  function kanitIndir() {
    const evetHayir = (v: boolean) => (v ? t("ocr.rapor.evet") : t("ocr.rapor.hayir"));
    const satir: string[] = [];
    satir.push("=".repeat(66));
    satir.push(`  ${t("ocr.rapor.baslik")}`);
    satir.push("=".repeat(66));
    satir.push(`  ${t("ocr.rapor.okunabilirGaranti").replace("{v}", ozet.okunabilirGaranti ? t("ocr.rapor.garanti.evet") : t("ocr.rapor.garanti.hayir"))}`);
    satir.push(`  ${t("ocr.rapor.minKontrast").replace("{v}", String(ozet.minZamanKontrast))}`);
    satir.push(`  ${t("ocr.rapor.maxDirenc").replace("{v}", String(ozet.maxOcrDirenc))}`);
    satir.push("");
    for (const m of metrikler) {
      satir.push(`  [${zorlukEtiket(m.zorluk).toUpperCase()}]`);
      satir.push(`    ${t("ocr.rapor.zamanKontrast").replace("{v}", String(m.zamanKontrast))}`);
      satir.push(`    ${t("ocr.rapor.tekKareKontrast").replace("{v}", String(m.tekKareKontrast))}`);
      satir.push(`    ${t("ocr.rapor.tekKareSN").replace("{v}", String(m.tekKareSN))}`);
      satir.push(`    ${t("ocr.rapor.direnc").replace("{v}", String(m.ocrDirenc))}`);
      satir.push(`    ${t("ocr.rapor.okunabilir").replace("{v}", evetHayir(m.okunabilir))}`);
      satir.push("");
    }
    satir.push(`  ${t("ocr.rapor.yontem.1")}`);
    satir.push(`  ${t("ocr.rapor.yontem.2")}`);
    const blob = new Blob(["﻿" + satir.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "specter-ocr-direnc-kanit.txt"; a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("ocr.rapor.toast") });
  }

  const pt = t("ocr.birim.pt");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ocr.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("ocr.serit.aciklama.1")} <b>{t("ocr.serit.aciklama.entegre")}</b> {t("ocr.serit.aciklama.2")}
          </p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.okunabilirGaranti ? t("ocr.ozet.garanti") : t("ocr.ozet.riskli")} etiket={t("ocr.ozet.okunabilirlik")} ikon={<Eye className="size-5" />} tone={ozet.okunabilirGaranti ? "ok" : "danger"} />
        <StatKart sayi={`${ozet.minZamanKontrast}${pt}`} etiket={t("ocr.ozet.minKontrast")} ikon={<Gauge className="size-5" />} tone="brand" />
        <StatKart sayi={`%${ozet.maxOcrDirenc}`} etiket={t("ocr.ozet.maxDirenc")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={`${secili.tekKareKontrast}${pt}`} etiket={t("ocr.ozet.tekKare").replace("{z}", zorlukEtiket(zorluk))} ikon={<EyeOff className="size-5" />} tone="warn" />
      </div>

      {/* zorluk seçici */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-slate-muted">{t("ocr.zorluk.etiket")}</span>
        {(["low", "medium", "high"] as Zorluk[]).map((z) => (
          <button key={z} onClick={() => setZorluk(z)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", zorluk === z ? "bg-ink-900 text-white" : "bg-canvas text-slate-muted hover:text-slate-ink")}>
            {zorlukEtiket(z)}
          </button>
        ))}
      </div>

      {/* canlı görsel kanıt: hareket vs tek kare */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel baslik={t("ocr.gorsel.insan.baslik")}>
          <GhostKanit zorluk={zorluk} donuk={false} hareketliEtiket={t("ocr.canvas.hareketli")} donukEtiket={t("ocr.canvas.donuk")} />
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ok"><Check className="size-4" /> {t("ocr.gorsel.insan.alt")}</p>
        </Panel>
        <Panel baslik={t("ocr.gorsel.ocr.baslik")}>
          <GhostKanit zorluk={zorluk} donuk={true} hareketliEtiket={t("ocr.canvas.hareketli")} donukEtiket={t("ocr.canvas.donuk")} />
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-danger2"><Bot className="size-4" /> {t("ocr.gorsel.ocr.alt")}</p>
        </Panel>
      </div>

      {/* metrik kırılımı + kare birikim eğrisi */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel baslik={t("ocr.metrik.baslik").replace("{z}", zorlukEtiket(zorluk))}>
          <div className="space-y-3">
            <MetrikSatir etiket={t("ocr.metrik.zamanKontrast")} deger={`${secili.zamanKontrast} ${pt}`} alt={t("ocr.metrik.zamanKontrast.alt")} renk="#16a34a" oran={secili.zamanKontrast} />
            <MetrikSatir etiket={t("ocr.metrik.tekKare")} deger={`${secili.tekKareKontrast} ${pt}`} alt={t("ocr.metrik.tekKare.alt")} renk="#dc2626" oran={secili.tekKareKontrast} />
            <MetrikSatir etiket={t("ocr.metrik.sn")} deger={`${secili.tekKareSN}`} alt={t("ocr.metrik.sn.alt")} renk="#d97706" oran={Math.min(100, secili.tekKareSN * 100)} />
            <MetrikSatir etiket={t("ocr.metrik.direnc")} deger={`%${secili.ocrDirenc}`} alt={t("ocr.metrik.direnc.alt")} renk="#2f6fed" oran={secili.ocrDirenc} />
            <MetrikSatir etiket={t("ocr.metrik.koherens")} deger={secili.koherens.toFixed(2)} alt={t("ocr.metrik.koherens.alt")} renk="#6a97fb" oran={secili.koherens * 100} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ok-soft px-3.5 py-2.5 text-[12.5px] text-green-700">
            <ShieldCheck className="size-4 shrink-0" /> {t("ocr.metrik.garanti").replace("{v}", String(secili.zamanKontrast))}
          </div>
        </Panel>

        <Panel baslik={t("ocr.egri.baslik")}>
          <p className="mb-3 text-[13px] text-slate-muted">
            {t("ocr.egri.aciklama")}
          </p>
          <TrendGrafik
            noktalar={egri.map((e) => e.etkinKontrast)}
            etiketler={egri.map((e) => t("ocr.egri.kare").replace("{n}", String(e.kare)))}
            renk={ZORLUK_RENK[zorluk]}
            yukseklik={220}
          />
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-faint">
            <span className="flex items-center gap-1"><EyeOff className="size-3.5 text-danger2" /> {t("ocr.egri.ocr").replace("{v}", String(egri[0].etkinKontrast))}</span>
            <ArrowRight className="size-3.5" />
            <span className="flex items-center gap-1"><Eye className="size-3.5 text-ok" /> {t("ocr.egri.insan").replace("{v}", String(egri[egri.length - 1].etkinKontrast))}</span>
          </div>
        </Panel>
      </div>

      {/* tüm profiller tablosu */}
      <Panel baslik={t("ocr.tablo.baslik")} sagUst={<Button variant="outline" size="sm" onClick={kanitIndir}><Download className="size-4" /> {t("ocr.tablo.kanit")}</Button>} padding={false}>
        <div className="overflow-x-auto px-6 pb-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="py-2 pr-4">{t("ocr.tablo.th.zorluk")}</th>
                <th className="py-2 pr-4">{t("ocr.tablo.th.zamanKontrast")}</th>
                <th className="py-2 pr-4">{t("ocr.tablo.th.tekKare")}</th>
                <th className="py-2 pr-4">{t("ocr.tablo.th.sn")}</th>
                <th className="py-2 pr-4">{t("ocr.tablo.th.direnc")}</th>
                <th className="py-2">{t("ocr.tablo.th.okunabilir")}</th>
              </tr>
            </thead>
            <tbody>
              {metrikler.map((m) => (
                <tr key={m.zorluk} className="border-t border-line">
                  <td className="py-3 pr-4"><span className="inline-flex items-center gap-1.5 font-medium" style={{ color: ZORLUK_RENK[m.zorluk] }}><span className="size-2 rounded-full" style={{ background: ZORLUK_RENK[m.zorluk] }} />{zorlukEtiket(m.zorluk)}</span></td>
                  <td className="py-3 pr-4 num font-semibold text-ok">{m.zamanKontrast} {pt}</td>
                  <td className="py-3 pr-4 num font-semibold text-danger2">{m.tekKareKontrast} {pt}</td>
                  <td className="py-3 pr-4 num text-slate-ink">{m.tekKareSN}</td>
                  <td className="py-3 pr-4 num font-semibold text-brand-700">%{m.ocrDirenc}</td>
                  <td className="py-3">{m.okunabilir ? <Badge ton="yesil">{t("ocr.tablo.evet")}</Badge> : <Badge ton="kirmizi">{t("ocr.tablo.hayir")}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mx-6 mb-4 mt-1 flex items-center gap-2 rounded-xl bg-canvas/50 px-3.5 py-2.5 text-[12px] text-slate-muted">
          <ScanLine className="size-4 shrink-0 text-brand-600" />
          {t("ocr.tablo.dipnot")}
        </div>
      </Panel>

      {/* demo linki */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink-900 px-8 py-6">
        <div className="max-w-xl">
          <h3 className="text-[16px] font-semibold text-white">{t("ocr.demo.baslik")}</h3>
          <p className="mt-1 text-[13px] text-white/60">{t("ocr.demo.aciklama")}</p>
        </div>
        <Button href="/demo" variant="outline" size="sm">{t("ocr.demo.buton")} <ArrowRight className="size-3.5" /></Button>
      </div>
    </div>
  );
}

function MetrikSatir({ etiket, deger, alt, renk, oran }: { etiket: string; deger: string; alt: string; renk: string; oran: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-ink">{etiket}</span>
        <span className="num text-[13px] font-semibold" style={{ color: renk }}>{deger}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, oran)}%`, background: renk }} />
      </div>
      <p className="mt-0.5 text-[11.5px] text-slate-faint">{alt}</p>
    </div>
  );
}

/* Canlı ghost kanıt: küçük canvas'ta temporal-dithering render.
 * donuk=true → animasyon durur (tek kare = OCR girdisi simülasyonu).
 * Render mantığı BİREBİR korunur; yalnızca aria-label metinleri çevrilir. */
function GhostKanit({ zorluk, donuk, hareketliEtiket, donukEtiket }: { zorluk: Zorluk; donuk: boolean; hareketliEtiket: string; donukEtiket: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const prof = { low: { cell: 5, base: 0.7, bg: 0.3, amp: 0.2 }, medium: { cell: 4, base: 0.68, bg: 0.32, amp: 0.24 }, high: { cell: 3, base: 0.66, bg: 0.34, amp: 0.26 } }[zorluk];
    const cols = Math.floor(W / prof.cell), rows = Math.floor(H / prof.cell);

    // Metin maskesi ("SPECTER" kısaltması: "S3C").
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d")!;
    octx.fillStyle = "#000"; octx.fillRect(0, 0, W, H);
    octx.fillStyle = "#fff"; octx.textAlign = "center"; octx.textBaseline = "middle";
    octx.font = `800 ${Math.floor(H * 0.5)}px Arial Black, Arial, sans-serif`;
    octx.fillText("S3C", W / 2, H / 2);
    const img = octx.getImageData(0, 0, W, H).data;
    const mask = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const px = Math.floor(c * prof.cell + prof.cell / 2), py = Math.floor(r * prof.cell + prof.cell / 2);
      mask[r * cols + c] = img[(py * W + px) * 4] > 110 ? 1 : 0;
    }
    // Sabit faz (statik-analiz direnci).
    const phase = new Float32Array(cols * rows);
    for (let i = 0; i < phase.length; i++) phase[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;

    let raf = 0;
    const ciz = (t: number) => {
      ctx.fillStyle = "#0a1220"; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const harf = mask[i] === 1;
        const dalga = Math.sin(t * 0.006 + phase[i] * Math.PI * 2);
        const taban = harf ? prof.base : prof.bg;
        const doluluk = taban + dalga * prof.amp;
        if (Math.abs(Math.sin(phase[i] * 99 + t * 0.01)) < doluluk) {
          const parlak = harf ? 210 + dalga * 30 : 180 + dalga * 30;
          ctx.fillStyle = `rgb(${parlak * 0.8},${parlak * 0.92},${parlak})`;
          ctx.fillRect(c * prof.cell, r * prof.cell, prof.cell - 0.5, prof.cell - 0.5);
        }
      }
    };

    if (donuk || reduced) {
      ciz(1234); // sabit tek kare
      return;
    }
    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      ciz(ts - start);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [zorluk, donuk, reduced]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0a1220]">
      <canvas ref={ref} width={360} height={120} className="w-full" style={{ imageRendering: "pixelated" }} aria-label={donuk ? donukEtiket : hareketliEtiket} />
    </div>
  );
}
