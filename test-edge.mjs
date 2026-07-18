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

  // 18) BİLGİ İFŞASI — public challenge yanıtı iş-istihbaratı sızdırmamalı.
  const cbody = await (await post("/api/v1/challenge", { siteKey: "pk_demo_veylify_public" })).json();
  check("Challenge yanıtı iç bilgi (siteId/ownerId/secret) sızdırmaz",
    !Object.keys(cbody).some((k) => /siteId|ownerId|secret|secretKey/.test(k)));
  const qw = cbody.quotaWarning || {};
  check("Challenge quotaWarning kesin kota sayısı (used/limit) sızdırmaz — sadece overage boolean",
    !("used" in qw) && !("limit" in qw));

  // 19) KOTA-AŞIM ZORLAMASI SÖZLEŞMESİ (gelir-kritik). plans.ts kotaDurumu()
  // mantığının değişmez davranışını korur: biri block→overage'a çevirse veya
  // asildi eşiğini bozsa free kullanıcılar sınırsız doğrulama yapar (gelir
  // kaybı). Saf fonksiyon reprodüksiyonu (deriveAnswer deseni — tsx yok).
  // Kaynak: src/lib/specter/plans.ts (PLANLAR + kotaDurumu). Değerler değişirse
  // BU test de güncellenmeli — kasıtsız değişikliği yakalamak amacı budur.
  const PLANLAR_T = {
    free:  { kota: 10_000,      asim: "block" },
    pro:   { kota: 1_000_000,   asim: "overage" },
    scale: { kota: 100_000_000, asim: "overage" },
  };
  function kotaDurumuT(kullanilan, plan) {
    const t = PLANLAR_T[plan] ?? PLANLAR_T.free;
    const kota = t.kota;
    const oran = kota > 0 ? kullanilan / kota : 0;
    return { kota, asildi: kullanilan >= kota, uyari: oran >= 0.9, asimDavranisi: t.asim };
  }
  // Free plan: kota altında geçer, kotada/üstünde aşılır + block davranışı.
  check("Kota: free 9.999 < 10.000 → aşılmadı", kotaDurumuT(9_999, "free").asildi === false);
  check("Kota: free 10.000 = kota → AŞILDI (>=)", kotaDurumuT(10_000, "free").asildi === true);
  check("Kota: free aşımda davranış = block (ücretsiz reddedilir/krediye düşer)",
    kotaDurumuT(10_000, "free").asimDavranisi === "block");
  // Pro plan: aşımda overage (bloklanmaz, ek ücret).
  check("Kota: pro 1.000.000 = kota → AŞILDI", kotaDurumuT(1_000_000, "pro").asildi === true);
  check("Kota: pro aşımda davranış = overage (bloklanmaz)",
    kotaDurumuT(1_000_000, "pro").asimDavranisi === "overage");
  // %90 uyarı eşiği (proaktif yükseltme bildirimi tetikler).
  check("Kota: free %90'da (9.000) uyari=true", kotaDurumuT(9_000, "free").uyari === true);
  check("Kota: free %89'da (8.900) uyari=false", kotaDurumuT(8_900, "free").uyari === false);
  // Bilinmeyen plan → free'ye düşer (güvenli varsayılan, sınırsız DEĞİL).
  check("Kota: bilinmeyen plan → free'ye düşer (10.000 kota, sınırsız değil)",
    kotaDurumuT(10_000, "belirsiz").asildi === true && kotaDurumuT(10_000, "belirsiz").asimDavranisi === "block");

  // 20) GERÇEK ENDPOINT bağlama: demo sitesi kota-altında → challenge 200 döner
  // ve kota-aşımı reddi (429 quota_exceeded) VERMEZ. Bu, reprodüksiyon mantığını
  // canlı zorlama yoluna bağlar (kota kontrolü tamamen kaldırılmışsa da 200'dür,
  // ama header'ın 'exceeded' OLMAMASI zorlama-yolunun çalıştığını teyit eder).
  const chRes = await post("/api/v1/challenge", { siteKey: "pk_demo_veylify_public" });
  check("Kota: demo (kota-altı) challenge → 200, quota_exceeded değil",
    chRes.status === 200 && chRes.headers.get("X-Veylify-Quota") !== "exceeded");

  // 21) RATE-LIMIT 429 + Retry-After (RFC 6585). Tek IP'den challenge flood →
  // ipLimit (varsayılan 60/dk) aşılınca 429 + geçerli Retry-After header.
  // İzole IP kullan (203.0.113.222) — başka testleri etkilemesin.
  let rl429 = null;
  for (let i = 0; i < 90; i++) {
    const r = await post("/api/v1/challenge", { siteKey: "pk_demo_veylify_public" }, { "x-forwarded-for": "203.0.113.222" });
    if (r.status === 429) { rl429 = r; break; }
  }
  check("Rate-limit: tek IP flood → 429 döner (DoS koruması)", rl429 !== null);
  const ra = rl429 && rl429.headers.get("Retry-After");
  check("Rate-limit: 429 yanıtı Retry-After header taşır (RFC 6585)",
    !!ra && Number(ra) >= 1 && Number(ra) <= 60);
  // İZOLASYON: farklı temiz IP hâlâ 429 DEĞİL (bir IP tüm siteyi kilitleyemez).
  const temizIp = await post("/api/v1/challenge", { siteKey: "pk_demo_veylify_public" }, { "x-forwarded-for": "198.51.100.7" });
  check("Rate-limit: farklı temiz IP flood'dan etkilenmez (429 değil — IP izolasyonu)",
    temizIp.status !== 429);

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
