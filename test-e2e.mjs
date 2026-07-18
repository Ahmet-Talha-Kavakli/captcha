/**
 * Specter uçtan-uca akış testi (API seviyesi, tarayıcısız).
 * Ghost-font motorunu yeniden üretip gerçek challenge→verify→siteverify
 * zincirini doğrular.
 */
const BASE = "http://127.0.0.1:3033";

// Widget/motor ile birebir aynı çekirdek — cevabı türetmek için.
const CHARSET = "34679ACDEFHJKLMNPRTUVWXY".split("");
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function deriveAnswer(seed, len) {
  const r = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  let o = "";
  for (let i = 0; i < len; i++) o += CHARSET[Math.floor(r() * CHARSET.length)];
  return o;
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

async function main() {
  console.log("\n=== Specter E2E ===\n");

  // 1) Kayıt
  const email = `test${Date.now()}@specter.dev`;
  let jar = "";
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "Test Kullanıcı", password: "test123" }),
  });
  const setCookie = reg.headers.get("set-cookie");
  if (setCookie) jar = setCookie.split(";")[0];
  check("Kayıt başarılı + session cookie", reg.ok && jar.includes("specter_session"));

  // 2) Site oluştur
  const siteRes = await fetch(`${BASE}/api/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ name: "test-app.com", domains: "localhost", difficulty: "medium" }),
  });
  const { site } = await siteRes.json();
  check("Site oluşturuldu + pk_/sk_ anahtarları", !!site && site.siteKey.startsWith("pk_") && site.secretKey.startsWith("sk_"));

  // 2b) Domain sahiplik doğrulaması (localhost dev alanı otomatik geçer)
  const dogRes = await fetch(`${BASE}/api/sites/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ siteId: site.id, method: "dns" }),
  });
  const dog = await dogRes.json();
  check("Domain sahiplik doğrulandı (dev alanı)", dog.verified === true || dog.status === "verified" || dog.success === true);

  // 3) Challenge al
  const chalRes = await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost" },
    body: JSON.stringify({ siteKey: site.siteKey }),
  });
  const chal = await chalRes.json();
  check("Challenge üretildi (token + seed, cevap YOK)", !!chal.token && !!chal.params?.seed && chal.answer === undefined);

  // 4) İnsan gibi doğru cevap + iyi davranış → başarı
  const answer = deriveAnswer(chal.params.seed, chal.params.length);
  const goodSignals = {
    mouseSamples: 40, mousePathLength: 300, mouseSpeedVariance: 0.3,
    keyIntervals: [120, 180, 95, 210, 140], timeToFirstInteraction: 800,
    timeToSubmit: 3200, hadTouch: false, focusEvents: 1, pasted: false,
  };
  const verRes = await fetch(`${BASE}/api/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, token: chal.token, input: answer, signals: goodSignals }),
  });
  const ver = await verRes.json();
  check("İnsan (doğru cevap + iyi davranış) → success", ver.success === true && !!ver.token);

  // 5) Sunucu teyidi (/siteverify)
  const svRes = await fetch(`${BASE}/api/v1/siteverify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: site.secretKey, response: ver.token }),
  });
  const sv = await svRes.json();
  check("Sunucu teyidi (siteverify) başarılı", sv.success === true && typeof sv.score === "number");

  // 6) Bot: doğru cevap AMA davranış yok → düşük skorla reddedilmeli
  const chal2 = await (await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey }),
  })).json();
  const answer2 = deriveAnswer(chal2.params.seed, chal2.params.length);
  const botSignals = {
    mouseSamples: 0, mousePathLength: 0, mouseSpeedVariance: 0,
    keyIntervals: [5, 5, 5, 5], timeToFirstInteraction: 10,
    timeToSubmit: 120, hadTouch: false, focusEvents: 0, pasted: true,
  };
  const botVer = await (await fetch(`${BASE}/api/v1/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, token: chal2.token, input: answer2, signals: botSignals }),
  })).json();
  check("Bot (doğru cevap ama davranış yok) → engellendi", botVer.success === false && botVer.reason === "low_behavior_score");

  // 7) Yanlış cevap → reddedilmeli
  const chal3 = await (await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey }),
  })).json();
  const wrongVer = await (await fetch(`${BASE}/api/v1/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, token: chal3.token, input: "XXXXX", signals: goodSignals }),
  })).json();
  check("Yanlış cevap → wrong_answer", wrongVer.success === false && wrongVer.reason === "wrong_answer");

  // 8) Replay: aynı token 2. kez → reddedilmeli
  const chal4 = await (await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey }),
  })).json();
  const answer4 = deriveAnswer(chal4.params.seed, chal4.params.length);
  await fetch(`${BASE}/api/v1/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, token: chal4.token, input: answer4, signals: goodSignals }),
  });
  const replay = await (await fetch(`${BASE}/api/v1/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, token: chal4.token, input: answer4, signals: goodSignals }),
  })).json();
  check("Replay (token tekrar kullanımı) → reddedildi", replay.success === false);

  // 9) Geçersiz site key
  const badKey = await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: "pk_sahte" }),
  });
  check("Geçersiz site key → 403", badKey.status === 403);

  // 10) Kural oluştur (yeni motor)
  const ruleRes = await fetch(`${BASE}/api/rules`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ siteId: site.id, name: "Test kural", field: "score", op: "lt", value: "0.3", action: "block" }),
  });
  const ruleData = await ruleRes.json();
  check("Kural oluşturuldu (kural motoru)", ruleRes.ok && ruleData.rule?.id);

  // 11) AI asistan yanıt üretiyor
  const askRes = await fetch(`${BASE}/api/assistant`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ soru: "Koruma skorum nasıl?" }),
  });
  const ask = await askRes.json();
  check("Specter Zeka yanıt üretti", askRes.ok && typeof ask.cevap === "string" && ask.cevap.length > 20);

  // 12) Kural simülasyon: VPN + düşük skor → block
  const simRes = await fetch(`${BASE}/api/rules/simulate`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ siteId: site.id, asn: "AS9009 M247 (VPN)", score: 0.1, botClass: "automation" }),
  });
  const sim = await simRes.json();
  check("Kural simülasyon (VPN+düşük skor → engel)", simRes.ok && (sim.action === "block" || sim.action === "challenge"));

  // 13) Görünmez mod: davranış zayıfsa challenge iste (bu sitede invisible kapalı olabilir → invisible_disabled de kabul)
  const passRes = await fetch(`${BASE}/api/v1/passive`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteKey: site.siteKey, signals: { mouseSamples: 0, keyIntervals: [5, 5], timeToSubmit: 50, pasted: true } }),
  });
  const passData = await passRes.json();
  check("Görünmez mod (zayıf davranış → geçmez)", passData.passed === false);

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
