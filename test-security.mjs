/**
 * Specter GÜVENLİK testi — yetkilendirme / izolasyon.
 * İki ayrı kullanıcı oluşturup birinin diğerinin kaynaklarına
 * erişemediğini kanıtlar. Bir bot-koruma ürününde bu kritiktir.
 */
const BASE = "http://127.0.0.1:3033";
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

async function kayit(email) {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "U", password: "test123" }),
  });
  return (r.headers.get("set-cookie") || "").split(";")[0];
}

async function main() {
  console.log("\n=== Specter Güvenlik ===\n");
  const jarA = await kayit(`a${Date.now()}@x.dev`);
  const jarB = await kayit(`b${Date.now()}@x.dev`);

  // A bir site + kural oluşturur
  const { site } = await (await fetch(`${BASE}/api/sites`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ name: "a-site.com", domains: "localhost" }),
  })).json();
  const { rule } = await (await fetch(`${BASE}/api/rules`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ siteId: site.id, name: "A kuralı", field: "score", op: "lt", value: "0.2", action: "block" }),
  })).json();

  // B, A'nın sitesini görememelidir
  const bSites = await (await fetch(`${BASE}/api/sites`, { headers: { Cookie: jarB } })).json();
  check("B, A'nın sitesini listede görmez", !bSites.sites.some((s) => s.id === site.id));

  // B, A'nın sitesini PATCH edememelidir
  const patchB = await fetch(`${BASE}/api/sites/${site.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: jarB },
    body: JSON.stringify({ name: "ele geçirildi" }),
  });
  check("B, A'nın sitesini düzenleyemez (404)", patchB.status === 404);

  // B, A'nın sitesini silememelidir
  const delB = await fetch(`${BASE}/api/sites/${site.id}`, { method: "DELETE", headers: { Cookie: jarB } });
  check("B, A'nın sitesini silemez (404)", delB.status === 404);

  // B, A'nın kuralını silememelidir
  const ruleDelB = await fetch(`${BASE}/api/rules/${rule.id}`, { method: "DELETE", headers: { Cookie: jarB } });
  check("B, A'nın kuralını silemez (403/404)", ruleDelB.status === 403 || ruleDelB.status === 404);

  // B, A'nın site simülasyonunu çalıştıramamalıdır
  const simB = await fetch(`${BASE}/api/rules/simulate`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarB },
    body: JSON.stringify({ siteId: site.id, score: 0.1 }),
  });
  check("B, A'nın kurallarını simüle edemez (400)", simB.status === 400);

  // Oturumsuz erişim reddedilmeli
  const anon = await fetch(`${BASE}/api/sites`);
  check("Oturumsuz /api/sites → 401", anon.status === 401);

  const anonPanel = await fetch(`${BASE}/panel/kurallar`, { redirect: "manual" });
  check("Oturumsuz /panel → giriş'e yönlendirir", anonPanel.status === 307);

  // secretKey başkasının site verifisinde işe yaramamalı (yanlış secret)
  const wrongVerify = await fetch(`${BASE}/api/v1/siteverify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: "sk_sahte", response: "x" }),
  });
  const wv = await wrongVerify.json();
  check("Sahte secret ile siteverify → başarısız", wv.success === false);

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
