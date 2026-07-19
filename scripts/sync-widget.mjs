#!/usr/bin/env node
/**
 * Widget tek-kaynak senkronu
 * ==========================
 * `public/specter.js` TEK KAYNAKTIR. `public/veylify.js` onun birebir
 * kopyasıdır (marka adı geçişi için iki CDN yolu da desteklenir). Elle iki
 * dosyayı senkron tutmak drift üretiyordu; bu script build/dev öncesi
 * otomatik kopyalar. Yalnızca `specter.js` düzenlenir.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const kaynak = join(kok, "public", "specter.js");
const hedef = join(kok, "public", "veylify.js");

const icerik = readFileSync(kaynak, "utf8");
let mevcut = "";
try { mevcut = readFileSync(hedef, "utf8"); } catch { /* yok */ }

if (icerik === mevcut) {
  console.log("[sync-widget] veylify.js zaten güncel.");
} else {
  writeFileSync(hedef, icerik);
  console.log("[sync-widget] veylify.js ← specter.js senkronlandı.");
}
