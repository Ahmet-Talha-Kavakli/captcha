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

/** Ghost-font TEK karesini üretir (botun gördüğü statik screenshot). */
function ghostFrame(text, seed, W = 400, H = 130) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const cell = 3, cols = Math.floor(W / cell), rows = Math.floor(H / cell);
  const mask = buildMask(ctx, text, cols, rows, cell);
  const phase = new Float32Array(cols * rows);
  let s = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < phase.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; phase[i] = (s / 0x7fffffff) * Math.PI * 2; }
  const density = 0.5, contrast = 0.52;
  const t = 1234; // rastgele TEK an (bir screenshot)
  const tt = t * 0.006;
  ctx.fillStyle = "#dfe6ea"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b1120";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, faz = phase[i];
    const esik = mask[i] ? density + Math.sin(tt * 2.1 + faz) * contrast * 0.5 : density + Math.sin(tt * 0.9 + faz * 1.7) * contrast * 0.5;
    if (pseudoNoise(c, r, Math.floor(tt * 3)) < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
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
  const N = 5; // 5 kod test et
  let normalTop = 0, ghostTop = 0;
  const detay = [];

  for (let k = 0; k < N; k++) {
    let kod = "";
    for (let i = 0; i < 5; i++) kod += CHARSET[Math.floor(rng() * CHARSET.length)];
    const seed = Math.floor(rng() * 0xffffffff);

    const nOku = await ocr(worker, normalFrame(kod), `normal-${k}`);
    const gOku = await ocr(worker, ghostFrame(kod, seed), `ghost-${k}`);
    const nB = benzerlik(nOku, kod);
    const gB = benzerlik(gOku, kod);
    normalTop += nB; ghostTop += gB;
    detay.push({ kod, nOku: nOku.replace(/\s/g, ""), nB, gOku: gOku.replace(/\s/g, ""), gB });
    console.log(`  Kod "${kod}":`);
    console.log(`    Normal font → OCR okudu: "${nOku.replace(/\s/g, "")}"  (%${(nB * 100).toFixed(0)} doğru)`);
    console.log(`    Ghost-font  → OCR okudu: "${gOku.replace(/\s/g, "") || "(boş/gürültü)"}"  (%${(gB * 100).toFixed(0)} doğru)`);
  }

  await worker.terminate();

  const nOrt = (normalTop / N) * 100;
  const gOrt = (ghostTop / N) * 100;
  console.log("\n--- SONUÇ ---");
  console.log(`  Normal metin OCR doğruluğu : %${nOrt.toFixed(1)}  (OCR sağlıklı çalışıyor)`);
  console.log(`  Ghost-font OCR doğruluğu   : %${gOrt.toFixed(1)}  (tek kare = botun gördüğü)`);
  const dusus = nOrt > 0 ? ((nOrt - gOrt) / nOrt) * 100 : 0;
  console.log(`  → Ghost-font OCR başarısını %${dusus.toFixed(1)} düşürdü.`);
  console.log(`  PNG kanıtları: ${OUT}/`);

  // Kanıt: normal yüksek (OCR çalışıyor), ghost düşük (bot kör)
  const basarili = nOrt >= 60 && gOrt <= 40;
  console.log(`\n=== ${basarili ? "✓ KANITLANDI: Ghost-font OCR'ı kör ediyor" : "✗ beklenmeyen sonuç"} ===\n`);
  process.exit(basarili ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
