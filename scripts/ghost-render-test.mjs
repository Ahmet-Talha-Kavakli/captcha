/**
 * GERÇEK-RENDER TESTİ (gerçek font mask + gerçek canvas)
 * ======================================================
 * Yeni "akan koherent dalga" motorunu gerçek harflerle çizer ve iki çıktı üretir:
 *   1) tekkare-*.png  — botun gördüğü TEK kare (OCR bunu okumaya çalışır → kör olmalı)
 *   2) insan-*.png    — 24 karenin İNSAN-BENZERİ birleşimi. İnsan gözü flicker'ı
 *      birleştirir; biz de kareleri "hareket-koherans" ağırlığıyla birleştirip
 *      (senkron oynayan harf hücreleri belirginleşir) insanın gördüğünü taklit ederiz.
 *
 * Sonra Tesseract ile tek kareyi okuyup körlüğü ölçer.
 * Kullanım: node scripts/ghost-render-test.mjs
 */
import { createCanvas } from "@napi-rs/canvas";
import Tesseract from "tesseract.js";
import fs from "node:fs";

const OUT = "/tmp/ghost-test";
fs.mkdirSync(OUT, { recursive: true });

const PROFILLER = {
  low:    { cell: 5, flow: 0.6, pulse: 1.6, dalgaBoyu: 0.16, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.50, bgAmp: 0.10 },
  medium: { cell: 4, flow: 0.9, pulse: 2.0, dalgaBoyu: 0.18, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.46, bgAmp: 0.12 },
  high:   { cell: 3, flow: 1.2, pulse: 2.4, dalgaBoyu: 0.22, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.40, bgAmp: 0.14 },
};

function pseudoNoise(x, y) {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h & 0x7fffffff;
  return (h % 10000) / 10000;
}

/** Gerçek font ile harf mask'i üret (tarayıcıdaki buildTextMask ile aynı mantık). */
function buildMask(text, cols, rows, cell) {
  const w = cols * cell, h = rows * cell;
  const off = createCanvas(w, h);
  const c = off.getContext("2d");
  c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
  const spaced = text.split("").join(" ");
  let fs2 = Math.floor(h * 0.62);
  c.font = `900 ${fs2}px sans-serif`;
  const tw = c.measureText(spaced).width, hedef = w * 0.86;
  if (tw > hedef) { fs2 = Math.floor(fs2 * (hedef / tw)); c.font = `900 ${fs2}px sans-serif`; }
  c.fillText(spaced, w / 2, h / 2);
  const img = c.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
    const px = Math.floor(col * cell + cell / 2), py = Math.floor(r * cell + cell / 2);
    mask[r * cols + col] = img[(py * w + px) * 4] > 110 ? 1 : 0;
  }
  return mask;
}

/** YENİ motor: bir hücre bu karede dolu mu? (akan koherent dalga) */
function hucre(prof, mask, phase, cols, r, c, i, sn) {
  const harf = mask[i] === 1;
  const kayma = harf ? -sn * prof.flow : sn * prof.flow * 0.6;
  const akisSatir = r + kayma;
  const satirTam = Math.floor(akisSatir);
  const satirKesir = akisSatir - satirTam;
  const g0 = pseudoNoise(c, satirTam), g1 = pseudoNoise(c, satirTam + 1);
  const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
  let esik;
  if (harf) {
    const dalga = Math.sin((r * prof.dalgaBoyu - sn * prof.pulse) * 6.2831853);
    esik = prof.letterBase + dalga * prof.letterAmp;
  } else {
    const dalga = Math.sin(((sn * prof.pulse * 0.6 + phase[i]) % 1) * 6.2831853);
    esik = prof.bgBase + dalga * prof.bgAmp;
  }
  return gurultu < esik ? 1 : 0;
}

function fazUret(N) {
  const phase = new Float32Array(N);
  let s = 0x9e3779b9;
  for (let i = 0; i < N; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; phase[i] = s / 0x7fffffff; }
  return phase;
}

/** Bir kareyi PNG olarak çiz (koyu zemin, açık nokta — marka). */
function kareCiz(prof, mask, phase, cols, rows, sn) {
  const cell = prof.cell, w = cols * cell, h = rows * cell;
  const cv = createCanvas(w, h), ctx = cv.getContext("2d");
  ctx.fillStyle = "#0a1220"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#dfe7f5";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (hucre(prof, mask, phase, cols, r, c, i, sn)) ctx.fillRect(c * cell, r * cell, cell, cell);
  }
  return cv;
}

/** İNSAN GÖRÜŞÜ: 24 kareyi "hareket-koherans" ile birleştir. Bir hücrenin
 *  komşularıyla (dikey) SENKRON oynaması harfi belirginleştirir; rastgele
 *  zemin sönükleşir. Bu, insan görsel korteksinin motion-integration'ının
 *  basit bir taklididir. Gri tonlamalı bir "algı haritası" üretir. */
function insanGorusu(prof, mask, phase, cols, rows, kareSayi = 24) {
  const N = cols * rows;
  const seri = [];
  for (let k = 0; k < kareSayi; k++) {
    const sn = 0.1 + k * (1.6 / kareSayi);
    const kare = new Float32Array(N);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      kare[i] = hucre(prof, mask, phase, cols, r, c, i, sn);
    }
    seri.push(kare);
  }
  // Her hücre için: dikey komşularıyla zaman-korelasyonu (senkron akış gücü).
  const algi = new Float32Array(N);
  for (let r = 1; r < rows - 1; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, iu = (r - 1) * cols + c, id = (r + 1) * cols + c;
    // bu hücrenin zaman serisi ile üst+alt komşu ortalaması korelasyonu
    let a = [], b = [];
    for (let k = 0; k < kareSayi; k++) { a.push(seri[k][i]); b.push((seri[k][iu] + seri[k][id]) / 2); }
    const ma = a.reduce((x, y) => x + y, 0) / kareSayi, mb = b.reduce((x, y) => x + y, 0) / kareSayi;
    let num = 0, da = 0, db = 0;
    for (let k = 0; k < kareSayi; k++) { const x = a[k] - ma, y = b[k] - mb; num += x * y; da += x * x; db += y * y; }
    algi[i] = da > 0 && db > 0 ? Math.max(0, num / Math.sqrt(da * db)) : 0;
  }
  // Gri PNG çiz (yüksek koherans = parlak = insanın gördüğü harf).
  const cell = prof.cell, w = cols * cell, h = rows * cell;
  const cv = createCanvas(w, h), ctx = cv.getContext("2d");
  ctx.fillStyle = "#0a1220"; ctx.fillRect(0, 0, w, h);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = Math.min(1, algi[r * cols + c] * 1.4);
    if (v > 0.05) {
      const g = Math.floor(20 + v * 220);
      ctx.fillStyle = `rgb(${g},${g + 10},${Math.min(255, g + 30)})`;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  return cv;
}

async function main() {
  const kod = "7K3F9";
  const W = 340, H = 96;
  console.log(`\nKod: "${kod}"\n`);

  for (const [ad, prof] of Object.entries(PROFILLER)) {
    const cell = prof.cell;
    const cols = Math.floor(W / cell), rows = Math.floor(H / cell);
    const mask = buildMask(kod, cols, rows, cell);
    const phase = fazUret(cols * rows);

    // 1) Tek kare (bot)
    const tek = kareCiz(prof, mask, phase, cols, rows, 0.5);
    fs.writeFileSync(`${OUT}/tekkare-${ad}.png`, tek.toBuffer("image/png"));
    // 2) İnsan görüşü (koherans haritası)
    const insan = insanGorusu(prof, mask, phase, cols, rows);
    fs.writeFileSync(`${OUT}/insan-${ad}.png`, insan.toBuffer("image/png"));

    // 3) OCR tek kareyi okuyabiliyor mu? (körlük)
    const buf = tek.toBuffer("image/png");
    const { data } = await Tesseract.recognize(buf, "eng", { tessedit_char_whitelist: "34679ACDEFHJKLMNPRTUVWXY" });
    const okunan = (data.text || "").replace(/[^0-9A-Z]/gi, "").toUpperCase();
    const dogru = [...kod].filter((ch, i) => okunan[i] === ch).length;
    const ocrOran = Math.round((dogru / kod.length) * 100);
    console.log(`${ad.padEnd(7)} | OCR okudu: "${okunan.slice(0,8).padEnd(8)}" | doğruluk: %${ocrOran} ${ocrOran <= 20 ? "✓ kör" : "✗ okudu!"}`);
  }
  console.log(`\nGörseller: ${OUT}/  (tekkare-*.png = bot görüşü, insan-*.png = insan görüşü)\n`);
}
main();
