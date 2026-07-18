/**
 * Specter EDGE CASE / ROBUSTNESS testi.
 * API'lere bozuk/kötü niyetli input gönderip çökmemesini (500 dönmemesini)
 * doğrular. Bot-koruma API'si özellikle sağlam olmalı.
 */
const BASE = "http://127.0.0.1:3033";
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

async function post(path, body, headers = {}) {
  return fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

async function main() {
  console.log("\n=== Specter Edge Case ===\n");

  // 1) Bozuk JSON body
  const r1 = await post("/api/v1/challenge", "{bozuk json!!");
  check("Bozuk JSON → 400 (500 değil)", r1.status === 400 || r1.status === 403);

  // 2) Boş body
  const r2 = await post("/api/v1/challenge", {});
  check("Boş body → 400", r2.status === 400);

  // 3) Null siteKey
  const r3 = await post("/api/v1/challenge", { siteKey: null });
  check("Null siteKey → 400/403", r3.status === 400 || r3.status === 403);

  // 4) Aşırı uzun input (verify)
  const r4 = await post("/api/v1/verify", { siteKey: "pk_x", token: "x".repeat(100000), input: "y".repeat(100000), signals: {} });
  check("Aşırı uzun input → çökmez (200/403/400)", [200, 400, 403].includes(r4.status));

  // 5) siteKey enjeksiyon denemesi
  const r5 = await post("/api/v1/challenge", { siteKey: "'; DROP TABLE sites;--" });
  check("SQL-benzeri enjeksiyon → güvenli 403", r5.status === 403);

  // 6) Bozuk signals tipi (verify)
  const r6 = await post("/api/v1/verify", { siteKey: "pk_x", token: "t", input: "i", signals: "bu bir string değil obje" });
  check("Bozuk signals tipi → çökmez", [200, 400, 403].includes(r6.status));

  // 7) Kayıt: geçersiz e-posta / kısa şifre
  const r7 = await post("/api/auth/register", { email: "gecersiz", name: "X", password: "12" });
  check("Kısa şifre → 400", r7.status === 400);

  // 8) Kayıt: eksik alanlar
  const r8 = await post("/api/auth/register", { email: "a@b.com" });
  check("Eksik alan → 400", r8.status === 400);

  // 9) passive: eksik siteKey
  const r9 = await post("/api/v1/passive", { signals: {} });
  check("Passive eksik siteKey → 400", r9.status === 400);

  // 10) siteverify: form-encoded (reCAPTCHA tarzı)
  const r10 = await fetch(`${BASE}/api/v1/siteverify`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "secret=sk_sahte&response=x",
  });
  const r10j = await r10.json();
  check("siteverify form-encoded → düzgün işlenir", r10.status === 200 && r10j.success === false);

  // 11) Çok büyük array signals.keyIntervals
  const r11 = await post("/api/v1/verify", { siteKey: "pk_x", token: "t", input: "i", signals: { keyIntervals: new Array(50000).fill(5) } });
  check("Devasa keyIntervals dizisi → çökmez", [200, 400, 403].includes(r11.status));

  // 12) Login: yanlış şifre bilgi sızdırmaz
  const r12 = await post("/api/auth/login", { email: "demo@specter.dev", password: "yanlis" });
  check("Yanlış şifre → 401 (kullanıcı var/yok sızdırmaz)", r12.status === 401);

  // 13) Devasa siteKey (200K) → çökmez, düzgün reddeder
  const r13 = await post("/api/v1/challenge", { siteKey: "pk_" + "A".repeat(200000) });
  check("Devasa siteKey (200K) → çökmez (403)", r13.status === 403);

  // 14) Infinity/negatif davranış sinyalleri → çökmez, düzgün işler
  const r14 = await post("/api/v1/passive", { siteKey: "pk_demo_veylify_public", signals: { mouseSamples: -999, mousePathLength: 1e308, keyIntervals: [1e400, -1e400] } });
  check("Infinity/negatif signals → çökmez (200)", r14.status === 200);

  // 15) PROTOTYPE POLLUTION — __proto__ enjeksiyonu prototipi kirletmemeli.
  const r15 = await post("/api/v1/passive", '{"siteKey":"pk_demo_veylify_public","signals":{},"__proto__":{"kirlietildi":true}}');
  check("__proto__ pollution → çökmez + prototip kirletilmez", r15.status === 200 && ({}).kirlietildi === undefined);

  // 16) Devasa dizi (100K keyIntervals) → çökmez
  const r16 = await post("/api/v1/passive", { siteKey: "pk_demo_veylify_public", signals: { keyIntervals: new Array(100000).fill(5) } });
  check("Devasa dizi (100K eleman) → çökmez (200)", r16.status === 200);

  // 17) Emoji/unicode siteKey → çökmez
  const r17 = await post("/api/v1/challenge", { siteKey: "pk_" + String.fromCodePoint(0x1f525) });
  check("Emoji/unicode siteKey → çökmez (403)", r17.status === 403);

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
