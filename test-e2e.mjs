/**
 * Specter uçtan-uca akış testi (API seviyesi, tarayıcısız).
 * Ghost-font motorunu yeniden üretip gerçek challenge→verify→siteverify
 * zincirini doğrular.
 */
import http from "node:http";
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

  // 14) ADVERSARIAL — görünmez modda sahte-sinyal bypass'ı.
  // Demo site (pk_demo_veylify_public) invisibleMode AÇIK. İstemci sinyalleri
  // UYDURULABİLİR: bir bot mükemmel fare/tuş sinyalleri enjekte edip yüksek
  // skor toplayabilir. Ama navigator.webdriver=true bir 'ben botum' itirafıdır
  // ve kesin otomasyon vetosu tetiklemelidir — skor ne olursa olsun geçememeli.
  const DEMO = "pk_demo_veylify_public";
  const insansiSinyal = {
    mouseSamples: 60, mousePathLength: 840, mouseSpeedVariance: 0.12,
    mouseCorners: 7, mouseAccelVariance: 0.05, keyIntervals: [110, 145, 98, 167, 120],
    timeToSubmit: 3200, mouseBeforeKey: true, focusEvents: 2, scrollEvents: 4,
    hardwareConcurrency: 8, deviceMemory: 8,
  };
  // (a) Bot: mükemmel insan sinyali UYDURUR ama webdriver:true → VETO
  const sahteBot = await (await fetch(`${BASE}/api/v1/passive`, {
    method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120" },
    body: JSON.stringify({ siteKey: DEMO, signals: { ...insansiSinyal, webdriver: true } }),
  })).json();
  check("Sahte insan sinyali + webdriver:true → automation_detected (bypass kapalı)",
    sahteBot.passed === false && sahteBot.reason === "automation_detected");

  // (b) Gerçek insan: aynı sinyaller ama webdriver:false → GEÇER (false-positive yok)
  const gercekInsan = await (await fetch(`${BASE}/api/v1/passive`, {
    method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15" },
    body: JSON.stringify({ siteKey: DEMO, signals: { ...insansiSinyal, webdriver: false } }),
  })).json();
  check("Gerçek insan (webdriver:false, iyi davranış) → görünmez geçer",
    gercekInsan.passed === true);

  // 15) MEŞRU ARAMA BOTU — CIDR doğrulamalı allowlist.
  // Googlebot/Bingbot davranış sinyali üretmez; challenge'a düşerse müşterinin
  // SEO'su bozulur. UA + kaynak IP'nin operatör CIDR'inde olması BİRLİKTE
  // doğrulanır: gerçek Googlebot geçer, UA'yı taklit eden sahte bot geçemez.
  const gercekGooglebot = await (await fetch(`${BASE}/api/v1/passive`, {
    method: "POST", headers: { "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "x-forwarded-for": "66.249.66.1" },
    body: JSON.stringify({ siteKey: DEMO, signals: {} }),
  })).json();
  check("Gerçek Googlebot (Google CIDR) → görünmez geçer (SEO korunur)",
    gercekGooglebot.passed === true);

  const sahteGooglebot = await (await fetch(`${BASE}/api/v1/passive`, {
    method: "POST", headers: { "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "x-forwarded-for": "45.11.22.33" },
    body: JSON.stringify({ siteKey: DEMO, signals: {} }),
  })).json();
  check("Sahte Googlebot (UA taklidi, yanlış IP) → geçemez",
    sahteGooglebot.passed === false);

  // 16) DoS İZOLASYONU — rate-limit IP başına olmalı, site başına değil.
  // Bir saldırgan IP sınırı aşınca YALNIZCA kendi IP'si kilitlenmeli; aynı
  // sitedeki meşru kullanıcılar (farklı IP) hizmet almaya devam etmeli. Aksi
  // halde tek bir saldırgan tüm sitenin challenge servisini DoS'lardı.
  let saldirgan429 = false;
  for (let i = 0; i < 70; i++) {
    const r = await fetch(`${BASE}/api/v1/challenge`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({ siteKey: DEMO }),
    });
    if (r.status === 429) { saldirgan429 = true; }
  }
  check("Saldırgan IP challenge sınırını aşınca 429 alır", saldirgan429);

  const mesruKullanici = await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.42" },
    body: JSON.stringify({ siteKey: DEMO }),
  });
  check("Meşru kullanıcı (farklı IP) saldırıya rağmen hizmet alır (DoS izolasyonu)",
    mesruKullanici.status === 200);

  // 17) PoW TEHDİT-BESLEMESİ — bilinen kötü altyapı (Tor/botnet) challenge
  // alırken CPU maliyeti (proof-of-work) ödemeli; temiz IP ödememeli. Bu, yüksek
  // hacimli bot saldırısını ekonomik olarak caydırır. (Önce yalnızca yerel IP
  // itibarı kullanılıyordu; global tehdit beslemesi PoW'a bağlı DEĞİLDİ.)
  const temizPow = await (await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "8.8.4.4" },
    body: JSON.stringify({ siteKey: DEMO }),
  })).json();
  check("Temiz IP → PoW yok (insana görünmez, maliyet yok)", !temizPow.pow);

  const torPow = await (await fetch(`${BASE}/api/v1/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "185.220.101.9" },
    body: JSON.stringify({ siteKey: DEMO }),
  })).json();
  check("Tor IP → PoW dayatılır (CPU maliyeti, bot ekonomik caydırma)",
    !!torPow.pow && torPow.pow.hedefBit > 0);

  // 18) KURAL MOTORU KAPSAMI — site sahibinin yazdığı kurallar enforcement'a
  // yansımalı: farklı alanlar (asn/path/score) + block vs challenge ayrımı.
  // simulate endpoint'i GERÇEK rule-engine mantığını çalıştırır (mock değil).
  await fetch(`${BASE}/api/rules`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: jar }, body: JSON.stringify({ siteId: site.id, name: "kötü ASN", field: "asn", op: "contains", value: "AS999", action: "block" }) });
  await fetch(`${BASE}/api/rules`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: jar }, body: JSON.stringify({ siteId: site.id, name: "admin koru", field: "path", op: "contains", value: "/admin", action: "challenge" }) });
  const simEt = async (ctx) => (await (await fetch(`${BASE}/api/rules/simulate`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: jar }, body: JSON.stringify({ siteId: site.id, ...ctx }) })).json());
  const rAsn = await simEt({ asn: "AS99900 EvilCorp", score: 0.9, path: "/" });
  check("Kural: ASN eşleşmesi → block", rAsn.action === "block");
  const rPath = await simEt({ asn: "AS100 Good", score: 0.9, path: "/admin/panel" });
  check("Kural: path eşleşmesi → challenge (block'tan ayrı aksiyon)", rPath.action === "challenge");
  const rTemiz = await simEt({ asn: "AS100 Good", score: 0.9, path: "/" });
  check("Kural: eşleşmeyen temiz istek → allow", rTemiz.action === "allow");

  // 19) WEBHOOK TESLİMATI — bot engellenince müşteri backend'ine imzalı POST.
  // Local alıcı sunucu kur, webhook kaydet, bot engelle, POST + HMAC imza gelsin.
  let whAlinan = null;
  const whSrv = http.createServer((rq, rs) => {
    let b = ""; rq.on("data", (c) => (b += c));
    rq.on("end", () => {
      const imzaHeader = Object.keys(rq.headers).map((h) => (/sign|imza/i.test(h) ? rq.headers[h] : null)).filter(Boolean)[0];
      whAlinan = { body: b, imza: imzaHeader };
      rs.writeHead(200); rs.end("ok");
    });
  });
  await new Promise((r) => whSrv.listen(9871, r));
  const whReg = await (await fetch(`${BASE}/api/webhooks`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: jar }, body: JSON.stringify({ siteId: site.id, url: "http://127.0.0.1:9871/hook", events: ["bot.blocked"] }) })).json();
  check("Webhook kaydı oluşturuldu", !!whReg.webhook?.id);
  // Bot engelle: doğru cevap ama honeypot tetik → kesin bot → bot.blocked
  const whCh = await (await fetch(`${BASE}/api/v1/challenge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteKey: site.siteKey }) })).json();
  const whAns = deriveAnswer(whCh.params.seed, whCh.params.length);
  await fetch(`${BASE}/api/v1/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteKey: site.siteKey, token: whCh.token, input: whAns, signals: { mouseSamples: 0, keyIntervals: [5, 5], honeypotTetik: true } }) });
  await new Promise((r) => setTimeout(r, 1500)); // webhook fire-and-forget
  whSrv.close();
  check("Bot engellenince webhook POST teslim edildi", !!whAlinan);
  check("Webhook HMAC imza header'ı taşıyor (t=,v1=)", !!whAlinan && /t=\d+,v1=/.test(String(whAlinan.imza || "")));
  let whType = null;
  try { whType = JSON.parse(whAlinan.body).type; } catch { /* yok */ }
  check("Webhook gövdesi type=bot.blocked", whType === "bot.blocked");

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
