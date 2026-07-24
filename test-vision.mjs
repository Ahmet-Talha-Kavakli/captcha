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
// AKAN-KOHERENT-DALGA profilleri — ghostfont.ts DIFFICULTY_PROFILES ile BİREBİR.
const PROFILLER = {
  low:    { cell: 7, flow: 0.26, pulse: 1.05, dalgaBoyu: 0.06, letterBase: 0.595, bgBase: 0.405, letterAmp: 0.55, bgAmp: 0.015 },
  medium: { cell: 6, flow: 0.30, pulse: 1.15, dalgaBoyu: 0.07, letterBase: 0.585, bgBase: 0.415, letterAmp: 0.55, bgAmp: 0.02 },
  high:   { cell: 5, flow: 0.40, pulse: 1.35, dalgaBoyu: 0.09, letterBase: 0.565, bgBase: 0.435, letterAmp: 0.53, bgAmp: 0.03 },
};

/**
 * Ghost-font TEK karesini GERÇEK üretim algoritmasıyla üretir (ghostfont.ts
 * render metoduyla aynı eşik matematiği). Botun gördüğü statik screenshot.
 * `zorluk` gerçek profili seçer → her seviyenin OCR direnci ayrı ölçülür.
 */
// Decoy tuzak metinleri — veylify.js DECOY_METINLER ile birebir.
const DECOY_METINLER = ["ERISIM RED", "BASARISIZ", "GECERSIZ", "ENGELLENDI", "ACCESS DENIED", "BLOCKED", "ROBOT", "HATA 403", "REDDEDILDI"];
function decoyContent(seed) { return DECOY_METINLER[(seed >>> 3) % DECOY_METINLER.length]; }

function ghostFrame(text, seed, zorluk = "medium", decoyKullan = false, W = 400, H = 130) {
  const p = PROFILLER[zorluk] || PROFILLER.medium;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const cell = p.cell, cols = Math.floor(W / cell), rows = Math.floor(H / cell);
  const mask = buildMask(ctx, text, cols, rows, cell);
  // Decoy mask: statik sahte metin, sadece BOŞ bölgeleri kaplar (gerçek kod kazanır).
  const decoyMask = decoyKullan ? buildMask(ctx, decoyContent(seed), cols, rows, cell) : null;
  const phase = new Float32Array(cols * rows);
  let s = 0x9e3779b9;
  for (let i = 0; i < phase.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; phase[i] = s / 0x7fffffff; }
  // Tek an (bir screenshot) — botun gördüğü kare. ghostfont.ts render(t) ile aynı eşik.
  const t = 1234, sn = t * 0.001;
  const asagi = sn * p.flow, yukari = sn * p.flow;
  const zamanFaz = sn * p.pulse, TAU = 6.2831853;
  ctx.fillStyle = "#dfe6ea"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b1120";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, harf = mask[i] === 1;
    // TUZAK: hücre decoy'a ait ve gerçek harf değilse → STATİK yoğun desen
    // (ghostfont.ts ile birebir: eşik 0.74, akış yok → OCR "yazı" sanır).
    if (decoyMask && decoyMask[i] === 1 && !harf) {
      if (pseudoNoise(c * 2 + 1, r * 2 + 1, 0) < 0.74) ctx.fillRect(c * cell, r * cell, cell, cell);
      continue;
    }
    // AKAN-KOHERENT-DALGA (ghostfont.ts ile birebir): harf içinden yukarı akan
    // parlaklık dalgası (senkron), zemin dağınık titreşim. Tek karede harf ort.
    // doluluğu = zemin → OCR harfi ayırt edemez.
    const akisSatir = harf ? r + yukari : r - asagi;
    const satirTam = Math.floor(akisSatir), satirKesir = akisSatir - satirTam;
    const g0 = pseudoNoise(c, satirTam, 0), g1 = pseudoNoise(c, satirTam + 1, 0);
    const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
    let esik;
    if (harf) {
      const dalga = Math.sin((r * p.dalgaBoyu - zamanFaz) * TAU);
      esik = p.letterBase + dalga * p.letterAmp;
    } else {
      const dalga = Math.sin(((zamanFaz * 0.6 + phase[i]) % 1) * TAU);
      esik = p.bgBase + dalga * p.bgAmp;
    }
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

  // ── DECOY TUZAK KANITI ────────────────────────────────────────────
  // Decoy açıkken OCR, hareketsiz sahte metni (ör. "ROBOT"/"BLOCKED") "gerçek
  // kod" sanıp okur; gerçek kodu HÂLÂ bulamaz. Kanıt: (a) gerçek kod doğruluğu
  // yine düşük, (b) OCR çıktısında decoy metninin harfleri beliriyor → bot
  // yanlış yöne sürülüyor (sadece körleme değil, aktif YANILTMA).
  console.log("\n  [DECOY TUZAK] gerçek kod gizli + statik sahte metin:");
  let decoyGercekTop = 0, decoyIziSayaci = 0;
  for (let k = 0; k < N; k++) {
    const { kod, seed } = testler[k];
    const decoyMetin = decoyContent(seed).replace(/[^A-Z0-9]/g, "");
    const gOku = await ocr(worker, ghostFrame(kod, seed, "medium", true), `decoy-${k}`);
    const temiz = gOku.replace(/[^0-9A-Z]/g, "").toUpperCase();
    decoyGercekTop += benzerlik(gOku, kod);
    // decoy izi: OCR çıktısındaki harflerin decoy metninde geçme oranı
    const decoyHarfSet = new Set(decoyMetin.split(""));
    const iz = temiz.length ? temiz.split("").filter((ch) => decoyHarfSet.has(ch)).length / temiz.length : 0;
    if (iz >= 0.5) decoyIziSayaci++;
    console.log(`    "${kod}" (tuzak:"${decoyMetin}") → OCR: "${temiz || "(gürültü)"}" | gerçek-kod %${(benzerlik(gOku, kod) * 100).toFixed(0)}, tuzak-izi %${(iz * 100).toFixed(0)}`);
  }
  const decoyGercek = (decoyGercekTop / N) * 100;

  await worker.terminate();

  console.log("\n--- SONUÇ ---");
  console.log(`  Normal metin OCR doğruluğu : %${nOrt.toFixed(1)}  (kontrol — OCR sağlıklı)`);
  for (const z of ZORLUKLAR) {
    console.log(`  Ghost-font [${z}] OCR doğruluğu: %${sonuc[z].toFixed(1)}`);
  }
  console.log(`  Decoy'lu ghost gerçek-kod doğruluğu: %${decoyGercek.toFixed(1)}  (tuzak izi ${decoyIziSayaci}/${N} karede baskın)`);

  // Kanıt: normal yüksek (OCR çalışıyor) VE HER zorluk düşük (en zayıf 'low' dahil
  // bot kör). low OCR'a en dirençsiz seviyedir; o bile ≤%40 ise sistem sağlam.
  const enKotu = Math.max(...ZORLUKLAR.map((z) => sonuc[z]));
  // Başarı: OCR kontrolü sağlıklı (≥%60) + her zorluk düşük (≤%40) + decoy'lu
  // frame'de gerçek kod da bulunamıyor (≤%40) → decoy körlemeyi bozmuyor, güçlendiriyor.
  const basarili = nOrt >= 60 && enKotu <= 40 && decoyGercek <= 40;
  console.log(`\n  En yüksek (en zayıf) ghost doğruluğu: %${enKotu.toFixed(1)} (${enKotu <= 40 ? "≤%40 hedef ✓" : "RİSK: OCR okuyabiliyor"})`);
  console.log(`\n=== ${basarili ? "✓ KANITLANDI: Ghost-font TÜM zorluklarda OCR'ı kör ediyor" : "✗ beklenmeyen sonuç"} ===\n`);
  process.exit(basarili ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
