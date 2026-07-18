/**
 * Specter AI-VISION testi — ghost-font'un OCR/vision modellerine karşı
 * dayanıklılığını GERÇEK bir OCR motoruyla (Tesseract) kanıtlar.
 *
 * Yöntem:
 *   1. Bir kod (5 karakter) seçilir.
 *   2. NORMAL net font ile bir PNG üretilir (kontrol grubu).
 *   3. GHOST-FONT tek karesi (statik screenshot — botun gördüğü) üretilir.
 *   4. Tesseract OCR ikisini de okur.
 *   5. Kanıt: OCR normal metni yüksek doğrulukla okur; ghost-font tek
 *      karesini okuyamaz (metin gürültüye karışmıştır).
 *
 * Bu, "ghost-font gerçekten AI'ı durduruyor mu?" sorusunu bilimsel
 * olarak cevaplar. Ghost-font'un sırrı harekettedir; tek kare = kör.
 */
import { createCanvas } from "@napi-rs/canvas";
import Tesseract from "tesseract.js";
import fs from "node:fs";

const CHARSET = "34679ACDEFHJKLMNPRTUVWXY";
const OUT = "/tmp/specter-vision";
fs.mkdirSync(OUT, { recursive: true });

// --- Ghost-font çekirdeği (widget/motor ile birebir) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pseudoNoise(x, y, f) {
  let h = (x * 374761393 + y * 668265263 + f * 1274126177) & 0x7fffffff;
  h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff;
  return (h % 10000) / 10000;
}
function buildMask(ctx2, text, cols, rows, cell) {
  const w = cols * cell, h = rows * cell;
  const off = createCanvas(w, h);
  const c = off.getContext("2d");
  c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
  let fs2 = Math.floor(h * 0.62);
  c.font = `900 ${fs2}px sans-serif`;
  const tw = c.measureText(text).width, hedef = w * 0.9;
  if (tw > hedef) { fs2 = Math.floor(fs2 * (hedef / tw)); c.font = `900 ${fs2}px sans-serif`; }
  c.fillText(text, w / 2, h / 2);
  const img = c.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
    const px = Math.floor(col * cell + cell / 2), py = Math.floor(r * cell + cell / 2);
    mask[r * cols + col] = img[(py * w + px) * 4] > 128 ? 1 : 0;
  }
  return mask;
}

// Gerçek üretim profilleri — src/lib/specter/ghostfont.ts DIFFICULTY_PROFILES
// ile BİREBİR aynı. Testin gerçek zorluk davranışını ölçmesi için buraya
// yansıtıldı (low daha az agresif → OCR'a en "kolay" seviye; yine de körlemeli).
const PROFILLER = {
  low:    { cell: 5, coh: 0.97, flow: 0.9, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.34, bgAmp: 0.10 },
  medium: { cell: 4, coh: 0.95, flow: 1.3, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.30, bgAmp: 0.12 },
  high:   { cell: 3, coh: 0.92, flow: 1.8, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.26, bgAmp: 0.14 },
};

/**
 * Ghost-font TEK karesini GERÇEK üretim algoritmasıyla üretir (ghostfont.ts
 * render metoduyla aynı eşik matematiği). Botun gördüğü statik screenshot.
 * `zorluk` gerçek profili seçer → her seviyenin OCR direnci ayrı ölçülür.
 */
function ghostFrame(text, seed, zorluk = "medium", W = 400, H = 130) {
  const p = PROFILLER[zorluk] || PROFILLER.medium;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const cell = p.cell, cols = Math.floor(W / cell), rows = Math.floor(H / cell);
  const mask = buildMask(ctx, text, cols, rows, cell);
  const phase = new Float32Array(cols * rows);
  let s = 0x9e3779b9;
  for (let i = 0; i < phase.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; phase[i] = s / 0x7fffffff; }
  // Tek an (bir screenshot) — botun gördüğü kare. ghostfont.ts render(t) ile aynı eşik.
  const t = 1234, sn = t * 0.001;
  const asagi = sn * p.flow, yukari = sn * p.flow * 1.1;
  ctx.fillStyle = "#dfe6ea"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b1120";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, harf = mask[i] === 1;
    const akisSatir = harf ? r + yukari : r - asagi;
    const satirTam = Math.floor(akisSatir), satirKesir = akisSatir - satirTam;
    const g0 = pseudoNoise(c, satirTam, 0), g1 = pseudoNoise(c, satirTam + 1, 0);
    const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
    const fazTemel = harf ? yukari : asagi;
    const fazHucre = (fazTemel + phase[i] * (1 - p.coh)) % 1;
    const dalga = Math.sin(fazHucre * 6.2831853);
    const esik = harf ? p.letterBase + dalga * p.letterAmp * p.coh : p.bgBase - dalga * p.bgAmp * p.coh;
    if (gurultu < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
  }
  return canvas;
}

/** Normal net metin (kontrol grubu — OCR bunu okuyabilmeli). */
function normalFrame(text, W = 400, H = 130) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "900 70px sans-serif";
  ctx.fillText(text, W / 2, H / 2);
  return canvas;
}

function benzerlik(a, b) {
  a = (a || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  let eslesme = 0;
  for (let i = 0; i < b.length; i++) if (a[i] === b[i]) eslesme++;
  return eslesme / b.length;
}

async function ocr(worker, canvas, ad) {
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(`${OUT}/${ad}.png`, buf);
  const { data } = await worker.recognize(buf);
  return (data.text || "").trim();
}

async function main() {
  console.log("\n=== Specter AI-Vision Testi (Tesseract OCR) ===\n");
  console.log("Ghost-font tek karesini gerçek OCR ile okumaya çalışıyoruz…\n");

  const worker = await Tesseract.createWorker("eng");
  await worker.setParameters({ tessedit_char_whitelist: CHARSET });

  const rng = mulberry32(20260716);
  const N = 6; // her zorlukta 6 kod
  // Aynı kod+seed setini 3 zorlukta da kullan (adil karşılaştırma).
  const testler = [];
  for (let k = 0; k < N; k++) {
    let kod = "";
    for (let i = 0; i < 5; i++) kod += CHARSET[Math.floor(rng() * CHARSET.length)];
    testler.push({ kod, seed: Math.floor(rng() * 0xffffffff) });
  }

  // Kontrol grubu: normal net font (OCR bunu okuyabilmeli).
  let normalTop = 0;
  for (let k = 0; k < N; k++) {
    const nOku = await ocr(worker, normalFrame(testler[k].kod), `normal-${k}`);
    normalTop += benzerlik(nOku, testler[k].kod);
  }
  const nOrt = (normalTop / N) * 100;

  // Ghost-font: HER ZORLUK ayrı ölçülür (low en az agresif — kritik test).
  const ZORLUKLAR = ["low", "medium", "high"];
  const sonuc = {};
  for (const z of ZORLUKLAR) {
    let ghostTop = 0;
    console.log(`  [${z.toUpperCase()}] zorluk:`);
    for (let k = 0; k < N; k++) {
      const { kod, seed } = testler[k];
      const gOku = await ocr(worker, ghostFrame(kod, seed, z), `ghost-${z}-${k}`);
      const gB = benzerlik(gOku, kod);
      ghostTop += gB;
      console.log(`    "${kod}" → OCR: "${gOku.replace(/\s/g, "") || "(gürültü)"}" (%${(gB * 100).toFixed(0)})`);
    }
    sonuc[z] = (ghostTop / N) * 100;
  }

  await worker.terminate();

  console.log("\n--- SONUÇ ---");
  console.log(`  Normal metin OCR doğruluğu : %${nOrt.toFixed(1)}  (kontrol — OCR sağlıklı)`);
  for (const z of ZORLUKLAR) {
    console.log(`  Ghost-font [${z}] OCR doğruluğu: %${sonuc[z].toFixed(1)}`);
  }

  // Kanıt: normal yüksek (OCR çalışıyor) VE HER zorluk düşük (en zayıf 'low' dahil
  // bot kör). low OCR'a en dirençsiz seviyedir; o bile ≤%40 ise sistem sağlam.
  const enKotu = Math.max(...ZORLUKLAR.map((z) => sonuc[z]));
  const basarili = nOrt >= 60 && enKotu <= 40;
  console.log(`\n  En yüksek (en zayıf) ghost doğruluğu: %${enKotu.toFixed(1)} (${enKotu <= 40 ? "≤%40 hedef ✓" : "RİSK: OCR okuyabiliyor"})`);
  console.log(`\n=== ${basarili ? "✓ KANITLANDI: Ghost-font TÜM zorluklarda OCR'ı kör ediyor" : "✗ beklenmeyen sonuç"} ===\n`);
  process.exit(basarili ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
