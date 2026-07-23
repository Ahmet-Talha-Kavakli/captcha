/**
 * TEK SEFERLİK: Supabase'deki şişkin state blob'unu küçültür.
 * ==========================================================
 * Sorun: veylify_state.data içindeki `events` dizisi ~7200 olay = blob'un %97'si
 * (~3.5 MB). Her okuma/yazma bu boyutu ağdan geçiriyor → Free plan egress kotası
 * (5 GB) aşıldı, yazmalar 4 sn timeout'ta abort oluyor, LOGIN ÇALIŞMIYOR.
 *
 * Çözüm: events'i son N (varsayılan 1200) ile kırp + ağır/gereksiz alanları koru,
 * blob'u geri yaz. db.ts zaten runtime'da 1200 tavanı uyguluyor; bu script mevcut
 * ŞİŞKİN kaydı bir kez düzeltir. Çalıştır: node scripts/blob-kucult.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const KOK = join(__dir, "..");

// .env.local'den SUPABASE değişkenlerini oku (dotenv bağımlılığı olmadan).
function envOku() {
  const p = join(KOK, ".env.local");
  const out = {};
  if (existsSync(p)) {
    for (const satir of readFileSync(p, "utf8").split("\n")) {
      const m = satir.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = envOku();
const URL = (process.env.SUPABASE_URL || env.SUPABASE_URL || "").trim();
const KEY = (process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY || "").trim();
const TAVAN = Number(process.argv[2]) || 1200;

if (!URL || !KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_KEY bulunamadı (.env.local).");
  process.exit(1);
}

const base = `${URL}/rest/v1/veylify_state`;
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

console.log("→ Blob indiriliyor…");
const t0 = Date.now();
const r = await fetch(`${base}?id=eq.main&select=data`, { headers: h });
if (!r.ok) { console.error("Okuma hatası:", r.status, await r.text()); process.exit(1); }
const rows = await r.json();
if (!rows.length) { console.error("Kayıt yok (id=main)."); process.exit(1); }
const data = rows[0].data;
const oncekiOlay = (data.events || []).length;
const raw = JSON.stringify(data);
console.log(`  indirildi: ${(raw.length / 1048576).toFixed(2)} MB, ${oncekiOlay} olay, ${Date.now() - t0}ms`);

// events'i son TAVAN ile kırp (en yeni korunur — ekleme sırası sondan).
if (Array.isArray(data.events) && data.events.length > TAVAN) {
  data.events = data.events.slice(data.events.length - TAVAN);
}
const yeni = JSON.stringify(data);
console.log(`→ Kırpıldı: ${oncekiOlay} → ${data.events.length} olay, yeni boyut ${(yeni.length / 1048576).toFixed(2)} MB`);

console.log("→ Geri yazılıyor…");
const t1 = Date.now();
const w = await fetch(`${base}?id=eq.main`, {
  method: "PATCH",
  headers: { ...h, Prefer: "return=minimal" },
  body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
});
if (!w.ok) { console.error("Yazma hatası:", w.status, await w.text()); process.exit(1); }
console.log(`✓ Tamam. Yazma ${Date.now() - t1}ms. Egress ~${((raw.length - yeni.length) / raw.length * 100).toFixed(0)}% azaldı.`);
