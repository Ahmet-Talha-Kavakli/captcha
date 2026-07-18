"use client";

/**
 * Ghost-Font Zorluk Laboratuvarı — İstemci (canlı görsel lab)
 * ===========================================================
 * MERKEZ PARÇA: operatörün sürdüğü parametrelerle GERÇEK ghost-font tekniğini
 * (temporal dithering) canlı bir <canvas>'ta render eden animasyon. Teknik,
 * src/lib/specter/ghostfont.ts ve public/specter.js'teki GhostField ile AYNI
 * fiziği yansıtır (mock DEĞİL):
 *   - Metin bir binary mask'e çevrilir (buildTextMask ile aynı yaklaşım).
 *   - Her hücreye sabit deterministik faz kayması (statik-analize dirençli).
 *   - Harf ve arka plan hücreleri ZIT FAZda titreşir (counter-phase).
 *   - Her kare, (x,y,frame) hash gürültüsüyle eşiklenir → tek kare gürültü,
 *     zaman-ortalama harf net. İnsan gözü kareleri entegre eder → okur; OCR
 *     tek kare görür → kör.
 * Fark: sabit zorluk profili yerine ditherHz / kontrast / gürültü / boyut
 * operatörden gelir; canvas canlı güncellenir.
 *
 * SKORLAR saf lab.ts'ten gelir (deterministik). Animasyon rAF/time kullanır
 * (canlı görsel demo) ama skorlamaya karışmaz.
 *
 * DÜRÜSTLÜK: OCR direnci ve okunabilirlik MODELLENMİŞ tahminlerdir; canvas ise
 * gerçek tekniğin sadık bir görsel demosudur (kanıt değil, gösterim).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlaskConical,
  Eye,
  ScanLine,
  Sparkles,
  Info,
  Gauge,
  Waves,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { labCeviri } from "./zorluk-lab.i18n";
import {
  KonfigVarsayilan,
  ocrDirenci,
  insanOkunabilirlik,
  dengeSkoru,
  onerilenKonfig,
  ornekMetin,
  type Konfig,
  type KarakterSeti,
} from "./lab";

/* ------------------------------------------------------------------ Render çekirdeği
 * Aşağıdaki iki fonksiyon, gerçek motorun (ghostfont.ts / specter.js) mantığını
 * birebir yansıtır. Buraya kopyalandılar çünkü lib/specter salt-okunurdur ve
 * DOM/canvas'a bağlı GhostField sınıfı doğrudan yeniden kullanılamaz; teknik
 * aynıdır.
 */

/** Deterministik 0..1 gürültü — (x, satır). ghostfont.ts pseudoNoise ile aynı
 * (zıt-akış: satır sürekli kaydırılır, harf yukarı / zemin aşağı akar). */
function pseudoNoise(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff;
  return (h % 10000) / 10000;
}

/** Metni hücre-mask'ine çevirir (buildTextMask yaklaşımı: offscreen çiz + örnekle). */
function metinMaskesi(
  text: string,
  cols: number,
  rows: number,
  cell: number,
): Uint8Array {
  const w = cols * cell;
  const h = rows * cell;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const FONT =
    '"Arial Black", "Apple Symbols", "Segoe UI Symbol", Arial, sans-serif';
  const spaced = text.split("").join(" ");
  let fontSize = Math.floor(h * 0.62);
  ctx.font = `800 ${fontSize}px ${FONT}`;
  const tw = ctx.measureText(spaced).width;
  const hedef = w * 0.86;
  if (tw > hedef) {
    fontSize = Math.floor(fontSize * (hedef / tw));
    ctx.font = `800 ${fontSize}px ${FONT}`;
  }
  ctx.fillText(spaced, w / 2, h / 2 + fontSize * 0.02);
  const img = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = Math.floor(c * cell + cell / 2);
      const py = Math.floor(r * cell + cell / 2);
      mask[r * cols + c] = img[(py * w + px) * 4] > 110 ? 1 : 0;
    }
  }
  return mask;
}

/**
 * Konfigürasyonu gerçek render parametrelerine çevirir (fizik ile tutarlı):
 *   - cell     = boyut (px)
 *   - refresh  = ditherHz'den kare tazeleme hızı (t*refresh); motorla aynı ölçek
 *   - letterBase/bgBase = kontrasttan taban doluluk (0.5 ± fark/2)
 *   - letterAmp/bgAmp   = gürültüden titreşim genliği
 *   - coh      = gürültü senkronu bozar; boyut güçlendirir
 */
function renderParam(k: Konfig) {
  // KOHERANS-TABANLI (motor ile aynı ilke): letterBase ≈ bgBase (doluluk eşit →
  // tek karede kod gizli). Ayrım sadece SENKRON kırpışmadan gelir: harf genliği
  // (letterAmp) yüksek + zemin genliği (bgAmp) düşük + coh yüksek. hucreKontrast
  // artınca harf-zemin genlik farkı (koherans gücü) artar.
  const letterBase = 0.5;
  const bgBase = 0.5;
  const kontrast = Math.max(0, Math.min(1, k.hucreKontrast));
  const letterAmp = 0.2 + kontrast * 0.24;          // koherans sinyali (harf senkron salınımı)
  const bgAmp = Math.max(0.06, 0.16 - k.gurultu * 0.12); // zemin salınımı düşük tutulur
  // ditherHz → flow: yön-akış hızı (satır/sn). 8 Hz ≈ 0.9, 40 Hz ≈ 2.0 aralığı.
  const flow = 0.7 + (k.ditherHz / 40) * 1.3;
  const coh = Math.max(0.7, Math.min(0.98, 0.97 - k.gurultu * 0.2 + (k.boyut - 4) * 0.01));
  return { cell: Math.max(2, Math.round(k.boyut)), letterBase, bgBase, letterAmp, bgAmp, flow, coh };
}

/**
 * Bir kareyi verilen canvas bağlamına çizer. GhostField.render mantığıyla aynı:
 * harf hücreleri letterBase ± dalga, arka plan bgBase ∓ dalga (zıt faz);
 * gürültü < eşik ise hücre doldurulur. `donuk` verilirse frame sabitlenir
 * (tek-kare "OCR ne görür" görünümü).
 */
function kareCiz(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  cols: number,
  rows: number,
  cell: number,
  phase: Float32Array,
  t: number,
  rp: ReturnType<typeof renderParam>,
  donuk: number | null,
) {
  const w = cols * cell;
  const h = rows * cell;
  ctx.fillStyle = "#0a1220";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#d4ecf7";
  const coh = rp.coh;
  // ZIT-AKIŞ: zemin aşağı (+), harf yukarı (−). `donuk`=tek kare → akış 0
  // (OCR'ın gördüğü statik kare; yön ipucu yok).
  const sn = donuk !== null ? 0 : t * 0.001;
  const asagi = sn * rp.flow;
  const yukari = sn * rp.flow * 1.1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const harf = mask[i] === 1;
      const akisSatir = harf ? r + yukari : r - asagi;
      const satirTam = Math.floor(akisSatir);
      const satirKesir = akisSatir - satirTam;
      const g0 = pseudoNoise(c, satirTam);
      const g1 = pseudoNoise(c, satirTam + 1);
      const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
      const fazTemel = harf ? yukari : asagi;
      const fazHucre = (fazTemel + phase[i] * (1 - coh)) % 1;
      const dalga = Math.sin(fazHucre * 6.2831853);
      const esik = harf
        ? rp.letterBase + dalga * rp.letterAmp * coh
        : rp.bgBase - dalga * rp.bgAmp * coh;
      if (gurultu < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

/* ------------------------------------------------------------------ Canvas hook
 * Animasyonlu (rAF) canlı canvas + tek-kare (donuk) canvas'ları yönetir.
 * konfig veya metin değişince mask/phase yeniden kurulur; temizlikte rAF iptal.
 */
function useGhostCanvas(
  konfig: Konfig,
  metin: string,
  cssW: number,
  cssH: number,
) {
  const canliRef = useRef<HTMLCanvasElement>(null);
  const donukRef = useRef<HTMLCanvasElement>(null);
  // zaman-ortalama (birikimli) canvas — insanın gördüğü net hali gösterir.
  const ortRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canli = canliRef.current;
    const donuk = donukRef.current;
    const ort = ortRef.current;
    if (!canli || !donuk || !ort) return;

    const rp = renderParam(konfig);
    const cell = rp.cell;
    const cols = Math.floor(cssW / cell);
    const rows = Math.floor(cssH / cell);
    const mask = metinMaskesi(metin, cols, rows, cell);

    // Deterministik faz jitter'ı (ghostfont.ts ile aynı hash zinciri).
    const phase = new Float32Array(cols * rows);
    let s = 0x9e3779b9;
    for (let i = 0; i < phase.length; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      phase[i] = s / 0x7fffffff;
    }

    const ratio = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const setup = (cv: HTMLCanvasElement) => {
      cv.width = cols * cell * ratio;
      cv.height = rows * cell * ratio;
      cv.style.height = cssH + "px";
      const ctx = cv.getContext("2d")!;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return ctx;
    };
    const cxCanli = setup(canli);
    const cxDonuk = setup(donuk);
    const cxOrt = setup(ort);

    // TEK KARE (donuk): frame=0 sabit → OCR'ın gördüğü statik gürültü karesi.
    kareCiz(cxDonuk, mask, cols, rows, cell, phase, 0, rp, 0);

    // ZAMAN-ORTALAMA: birçok kareyi alfa ile üst üste bindir → insanın
    // entegrasyonunu taklit et; harf net belirir (gürültü ortalanır).
    const w = cols * cell;
    const h = rows * cell;
    cxOrt.fillStyle = "#0a1220";
    cxOrt.fillRect(0, 0, w, h);
    const N = 48; // biriktirilen kare sayısı (algısal entegrasyon)
    const acc = new Float32Array(cols * rows);
    for (let f = 0; f < N; f++) {
      const t = (f / N) * 2000; // zıt-akışın birkaç satır kaymasını kapsayan pencere
      const sn = t * 0.001;
      const asagi = sn * rp.flow;
      const yukari = sn * rp.flow * 1.1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const harf = mask[i] === 1;
          const akisSatir = harf ? r + yukari : r - asagi;
          const satirTam = Math.floor(akisSatir);
          const satirKesir = akisSatir - satirTam;
          const g0 = pseudoNoise(c, satirTam);
          const g1 = pseudoNoise(c, satirTam + 1);
          const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
          const fazTemel = harf ? yukari : asagi;
          const fazHucre = (fazTemel + phase[i] * (1 - rp.coh)) % 1;
          const dalga = Math.sin(fazHucre * 6.2831853);
          const esik = harf
            ? rp.letterBase + dalga * rp.letterAmp * rp.coh
            : rp.bgBase - dalga * rp.bgAmp * rp.coh;
          if (gurultu < esik) acc[i] += 1;
        }
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = acc[r * cols + c] / N; // 0..1 ortalama doluluk
        // Kontrastı biraz güçlendir (insan algısal eşiği) — sadece görsel.
        const g = Math.max(0, Math.min(1, (v - 0.32) / 0.42));
        const lum = Math.round(10 + g * 220);
        cxOrt.fillStyle = `rgb(${Math.round(lum * 0.85)},${Math.round(lum * 0.95)},${lum})`;
        cxOrt.fillRect(c * cell, r * cell, cell, cell);
      }
    }

    // CANLI animasyon döngüsü (gerçek ghost-font akışı).
    let raf = 0;
    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      kareCiz(cxCanli, mask, cols, rows, cell, phase, ts - start, rp, null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [konfig, metin, cssW, cssH]);

  return { canliRef, donukRef, ortRef };
}

/* ------------------------------------------------------------------ Skor çubuğu */
function SkorCubugu({
  etiket,
  deger,
  renk,
  ikon,
}: {
  etiket: string;
  deger: number;
  renk: string;
  ikon: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-1.5 font-medium text-slate-ink">
          {ikon}
          {etiket}
        </span>
        <span className="num font-semibold text-slate-ink">{deger}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-300", renk)}
          style={{ width: `${deger}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Kaydırıcı */
function Kaydirici({
  etiket,
  deger,
  min,
  max,
  adim,
  birim,
  onChange,
}: {
  etiket: string;
  deger: number;
  min: number;
  max: number;
  adim: number;
  birim?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-ink">{etiket}</span>
        <span className="num text-slate-muted">
          {deger}
          {birim}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={adim}
        value={deger}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */
export function ZorlukLabIstemci({ dil }: { dil: Dil }) {
  const t = (anahtar: string) => labCeviri(anahtar, dil);
  const [konfig, setKonfig] = useState<Konfig>(KonfigVarsayilan);
  const metin = useMemo(() => ornekMetin(konfig.karakterSeti), [konfig.karakterSeti]);

  // Skorlar saf lab.ts'ten — deterministik (aynı konfig → aynı skor).
  const ocr = useMemo(() => ocrDirenci(konfig), [konfig]);
  const oku = useMemo(() => insanOkunabilirlik(konfig), [konfig]);
  const denge = useMemo(() => dengeSkoru(konfig), [konfig]);

  const { canliRef, donukRef, ortRef } = useGhostCanvas(konfig, metin, 300, 108);

  const guncelle = (yama: Partial<Konfig>) =>
    setKonfig((k) => ({ ...k, ...yama }));

  const oneriYukle = () => setKonfig(onerilenKonfig());
  const varsayilanaDon = () => setKonfig(KonfigVarsayilan);

  const dengeTon =
    denge.ton === "ideal"
      ? "yesil"
      : denge.ton === "iyi"
        ? "mavi"
        : denge.ton === "uyari"
          ? "sari"
          : "kirmizi";

  // ENUM GÜVENLİĞİ: denge.yargi lib'de TR üretilir; TON enum'undan yeniden türet.
  const dengeYargi = t(`yargi.${denge.ton === "kotu" ? "kotu" : denge.ton}`);

  // Karakter seti etiketleri enum id → key-map (lab.ts'teki TR harita yerine).
  const setEtiket: Record<KarakterSeti, string> = {
    kod: t("set.kod"),
    sayi: t("set.sayi"),
    karisik: t("set.karisik"),
  };

  const setler: KarakterSeti[] = ["kod", "sayi", "karisik"];

  return (
    <div className="space-y-5">
      {/* Üst özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={ocr}
          etiket={t("ozet.ocr")}
          ikon={<ScanLine className="size-4" />}
          tone={ocr >= 55 ? "ok" : "warn"}
        />
        <StatKart
          sayi={oku}
          etiket={t("ozet.oku")}
          ikon={<Eye className="size-4" />}
          tone={oku >= 55 ? "ok" : "danger"}
        />
        <StatKart
          sayi={denge.skor}
          etiket={t("ozet.denge")}
          ikon={<Gauge className="size-4" />}
          tone={denge.ton === "ideal" || denge.ton === "iyi" ? "ok" : "warn"}
        />
        <StatKart
          sayi={`${konfig.ditherHz}Hz`}
          etiket={t("ozet.dither")}
          ikon={<Waves className="size-4" />}
          tone="brand"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* SOL: Canlı canvas önizleme (merkez parça) */}
        <Panel
          baslik={
            <span className="flex items-center gap-2">
              <FlaskConical className="size-4 text-brand-600" />
              {t("onizleme.baslik")}
            </span>
          }
          sagUst={<Badge ton={dengeTon}>{dengeYargi}</Badge>}
        >
          <div className="space-y-4">
            {/* Ana canlı canvas */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0a1220] ring-1 ring-white/10">
              <canvas
                ref={canliRef}
                role="img"
                aria-label={t("onizleme.canli.aria")}
                className="block w-full"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0px,rgba(255,255,255,.03) 1px,transparent 1px,transparent 3px)",
                }}
              />
              <span className="absolute bottom-2 right-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-medium text-cyan-200 backdrop-blur">
                {t("onizleme.rozet.canli")}
              </span>
            </div>

            {/* Tek-kare vs zaman-ortalama — tekniğin GÖRSEL KANITI */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-ink">
                  <ScanLine className="size-3.5 text-danger2" />
                  {t("onizleme.tekKare.baslik")}
                </div>
                <div className="overflow-hidden rounded-xl bg-[#0a1220] ring-1 ring-white/10">
                  <canvas
                    ref={donukRef}
                    role="img"
                    aria-label={t("onizleme.tekKare.aria")}
                    className="block w-full"
                  />
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-muted">
                  {t("onizleme.tekKare.aciklama")}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-ink">
                  <Eye className="size-3.5 text-ok" />
                  {t("onizleme.ort.baslik")}
                </div>
                <div className="overflow-hidden rounded-xl bg-[#0a1220] ring-1 ring-white/10">
                  <canvas
                    ref={ortRef}
                    role="img"
                    aria-label={t("onizleme.ort.aria")}
                    className="block w-full"
                  />
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-muted">
                  {t("onizleme.ort.aciklama")}
                </p>
              </div>
            </div>

            {/* Skorlar — gerilim (dual-bar) */}
            <div className="space-y-3 rounded-2xl border border-line bg-canvas p-4">
              <SkorCubugu
                etiket={t("skor.ocr")}
                deger={ocr}
                renk="bg-brand-500"
                ikon={<ScanLine className="size-3.5 text-brand-600" />}
              />
              <SkorCubugu
                etiket={t("skor.oku")}
                deger={oku}
                renk="bg-ok"
                ikon={<Eye className="size-3.5 text-ok" />}
              />
              <p className="pt-1 text-[12px] leading-snug text-slate-muted">
                <span className="font-medium text-slate-ink">
                  {t("gerilim.etiket")}
                </span>{" "}
                {t("gerilim.metin")}
              </p>
            </div>
          </div>
        </Panel>

        {/* SAĞ: Parametre kontrolleri */}
        <div className="space-y-5">
          <Panel baslik={t("param.baslik")}>
            <div className="space-y-4">
              <Kaydirici
                etiket={t("param.dither")}
                deger={konfig.ditherHz}
                min={6}
                max={48}
                adim={1}
                birim=" Hz"
                onChange={(v) => guncelle({ ditherHz: v })}
              />
              <Kaydirici
                etiket={t("param.kontrast")}
                deger={Math.round(konfig.hucreKontrast * 100)}
                min={20}
                max={100}
                adim={1}
                birim="%"
                onChange={(v) => guncelle({ hucreKontrast: v / 100 })}
              />
              <Kaydirici
                etiket={t("param.gurultu")}
                deger={Math.round(konfig.gurultu * 100)}
                min={0}
                max={100}
                adim={1}
                birim="%"
                onChange={(v) => guncelle({ gurultu: v / 100 })}
              />
              <Kaydirici
                etiket={t("param.kare")}
                deger={konfig.kareSayisi}
                min={2}
                max={32}
                adim={1}
                onChange={(v) => guncelle({ kareSayisi: v })}
              />
              <Kaydirici
                etiket={t("param.boyut")}
                deger={konfig.boyut}
                min={2}
                max={8}
                adim={1}
                birim=" px"
                onChange={(v) => guncelle({ boyut: v })}
              />

              {/* Karakter seti seçici */}
              <div>
                <div className="mb-1.5 text-[13px] font-medium text-slate-ink">
                  {t("param.set.baslik")}
                </div>
                <div className="flex gap-2">
                  {setler.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => guncelle({ karakterSeti: s })}
                      className={cn(
                        "flex-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                        konfig.karakterSeti === s
                          ? "border-brand-400 bg-brand-50 text-brand-700"
                          : "border-line bg-surface text-slate-muted hover:bg-canvas",
                      )}
                    >
                      {setEtiket[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="accent" onClick={oneriYukle}>
                  <Sparkles className="size-4" />
                  {t("param.oneriYukle")}
                </Button>
                <Button size="sm" variant="outline" onClick={varsayilanaDon}>
                  {t("param.varsayilan")}
                </Button>
              </div>
            </div>
          </Panel>

          {/* Nasıl çalışır */}
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Info className="size-4 text-slate-muted" />
                {t("nasil.baslik")}
              </span>
            }
          >
            <ol className="space-y-2.5 text-[13px] leading-relaxed text-slate-muted">
              <li>
                <span className="font-medium text-slate-ink">1.</span> {t("nasil.1")}
              </li>
              <li>
                <span className="font-medium text-slate-ink">2.</span>{" "}
                {t("nasil.2a")} <em>{t("nasil.2em")}</em> {t("nasil.2b")}
              </li>
              <li>
                <span className="font-medium text-slate-ink">3.</span> {t("nasil.3")}
              </li>
              <li>
                <span className="font-medium text-slate-ink">4.</span> {t("nasil.4")}
              </li>
            </ol>
            <p className="mt-4 rounded-xl border border-line bg-canvas p-3 text-[11.5px] leading-snug text-slate-muted">
              <span className="font-medium text-slate-ink">
                {t("nasil.durustluk.etiket")}
              </span>{" "}
              {t("nasil.durustluk.metin")}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
