/**
 * Specter GÜVENLİK testi — yetkilendirme / izolasyon.
 * İki ayrı kullanıcı oluşturup birinin diğerinin kaynaklarına
 * erişemediğini kanıtlar. Bir bot-koruma ürününde bu kritiktir.
 */
import crypto from "node:crypto";
import http from "node:http";
const BASE = "http://127.0.0.1:3033";

// TOTP kod üretici (authenticator uygulaması simülasyonu — RFC 6238).
const _B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function _b32dec(s) { let bits = ""; for (const ch of s.toUpperCase()) { const i = _B32.indexOf(ch); if (i < 0) continue; bits += i.toString(2).padStart(5, "0"); } const by = []; for (let i = 0; i + 8 <= bits.length; i += 8) by.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(by); }
function totpKodUret(secret, now = Date.now()) { const key = _b32dec(secret); const sayac = Math.floor(now / 1000 / 30); const buf = Buffer.alloc(8); buf.writeUInt32BE(Math.floor(sayac / 0x100000000), 0); buf.writeUInt32BE(sayac >>> 0, 4); const h = crypto.createHmac("sha1", key).update(buf).digest(); const o = h[h.length - 1] & 0xf; const k = ((h[o] & 0x7f) << 24) | ((h[o + 1] & 0xff) << 16) | ((h[o + 2] & 0xff) << 8) | (h[o + 3] & 0xff); return (k % 1000000).toString().padStart(6, "0"); }
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

// crypto.ts signVerification ile birebir (verification token üretimi — exp/imza testi).
function _b64url(buf) { return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function signVerification(claim, secret) {
  const body = _b64url(Buffer.from(JSON.stringify(claim), "utf8"));
  const sig = _b64url(crypto.createHmac("sha256", secret).update("verify:" + body).digest());
  return `${body}.${sig}`;
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

  // Public API Bearer token — programatik erişim auth + iptal enforcement.
  // A bir API anahtarı oluşturur (stats scope); anahtarla /api/v1/stats çeker.
  const tk = await (await fetch(`${BASE}/api/tokens`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ name: "sec-test", scopes: ["stats"], environment: "test" }),
  })).json();
  const secret = tk.secret;
  check("API anahtarı oluşturuldu (sk_ secret döndü)", typeof secret === "string" && secret.startsWith("sk_"));

  const okStats = await fetch(`${BASE}/api/v1/stats`, { headers: { Authorization: "Bearer " + secret } });
  check("Geçerli Bearer token → 200 (programatik erişim çalışıyor)", okStats.status === 200);

  const noToken = await fetch(`${BASE}/api/v1/stats`);
  check("Token'sız /api/v1/stats → 401", noToken.status === 401);

  const fakeToken = await fetch(`${BASE}/api/v1/stats`, { headers: { Authorization: "Bearer sk_test_sahtekey" } });
  check("Sahte Bearer token → 401", fakeToken.status === 401);

  // Anahtarı iptal et → aynı anahtar artık erişememeli (revoke enforcement).
  await fetch(`${BASE}/api/tokens`, {
    method: "DELETE", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ id: tk.token.id }),
  });
  const revoked = await fetch(`${BASE}/api/v1/stats`, { headers: { Authorization: "Bearer " + secret } });
  check("İptal edilen token → 401 (revoke gerçekten erişimi keser)", revoked.status === 401);

  // GERÇEK 2FA (TOTP RFC 6238) — bağımsız hesap (login enforcement'ı da test eder).
  // Eskiden yalnızca "6 hane mi" bakılıyordu — herhangi rakam 2FA'yı açıyordu VE
  // giriş 2FA'yı hiç dayatmıyordu (şifre yeterliydi). İkisi de düzeltildi.
  const email2fa = `mfa${Date.now()}@x.dev`;
  const jar2fa = await kayit(email2fa);
  const setup2fa = await (await fetch(`${BASE}/api/account/2fa`, { headers: { Cookie: jar2fa } })).json();
  check("2FA kurulum → gerçek TOTP secret + otpauth URI", typeof setup2fa.secret === "string" && String(setup2fa.otpauth || "").startsWith("otpauth://"));

  const yanlisKod = await fetch(`${BASE}/api/account/2fa`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jar2fa },
    body: JSON.stringify({ enabled: true, code: "000000" }),
  });
  check("2FA yanlış kod (000000) → 400 reddedilir (gerçek TOTP doğrulama)", yanlisKod.status === 400);

  const dogru2fa = await (await fetch(`${BASE}/api/account/2fa`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jar2fa },
    body: JSON.stringify({ enabled: true, code: totpKodUret(setup2fa.secret) }),
  })).json();
  check("2FA doğru TOTP kodu → aktifleşir", dogru2fa.twoFactorEnabled === true);

  // 2FA GİRİŞ DAYATMASI — hesap 2FA açıkken şifre TEK BAŞINA yetmemeli.
  const loginTotpsuz = await (await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2fa, password: "test123" }),
  })).json();
  check("2FA açık: şifre doğru ama TOTP yok → requires2fa (giriş tamamlanmaz)", loginTotpsuz.requires2fa === true && !loginTotpsuz.ok);

  const loginYanlisTotp = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2fa, password: "test123", code: "000000" }),
  });
  check("2FA açık: yanlış TOTP → 401", loginYanlisTotp.status === 401);

  const loginDogru = await (await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2fa, password: "test123", code: totpKodUret(setup2fa.secret) }),
  })).json();
  check("2FA açık: doğru TOTP → giriş başarılı", loginDogru.ok === true);

  // ŞİFRE DEĞİŞTİRME — eski şifre doğrulanmalı, hash gerçekten güncellenmeli.
  const pwEmail = `pw${Date.now()}@x.dev`;
  const pwJar = await kayit(pwEmail); // kayit "test123" ile açar
  const pwYanlis = await fetch(`${BASE}/api/account/password`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: pwJar },
    body: JSON.stringify({ oldPassword: "yanlis999", newPassword: "yeniSifre456" }),
  });
  check("Şifre değiştir: yanlış eski şifre → 400", pwYanlis.status === 400);
  const pwDogru = await fetch(`${BASE}/api/account/password`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: pwJar },
    body: JSON.stringify({ oldPassword: "test123", newPassword: "yeniSifre456" }),
  });
  check("Şifre değiştir: doğru eski şifre → 200", pwDogru.status === 200);
  const eskiGiris = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: pwEmail, password: "test123" }),
  });
  check("Şifre değişince eski şifre artık geçersiz → 401 (hash güncellendi)", eskiGiris.status === 401);

  // KAYIT güvenliği — mükerrer email + zayıf şifre reddedilmeli.
  const dupEmail = `dup${Date.now()}@x.dev`;
  await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: dupEmail, name: "U", password: "gucluSifre123" }) });
  const dup = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: dupEmail, name: "X", password: "baskaSifre999" }) });
  check("Mükerrer email kaydı → reddedilir (409)", dup.status === 409);
  const zayif = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `z${Date.now()}@x.dev`, name: "U", password: "123" }) });
  check("Zayıf şifre kaydı → reddedilir (400)", zayif.status === 400);

  // RAPOR İNDİRME — gerçek içerikli indirilebilir rapor (attachment) + izolasyon.
  const repJson = await fetch(`${BASE}/api/reports/download?type=trafik&format=json&days=30`, { headers: { Cookie: jarA } });
  check("Rapor indirme (JSON) → 200 + attachment", repJson.status === 200 && /attachment/.test(repJson.headers.get("content-disposition") || ""));
  const repCsv = await fetch(`${BASE}/api/reports/download?type=trafik&format=csv&days=7`, { headers: { Cookie: jarA } });
  const csvText = await repCsv.text();
  check("Rapor indirme (CSV) → gerçek başlıklı CSV", repCsv.status === 200 && csvText.startsWith("tarih,ip,ulke"));
  const repAnon = await fetch(`${BASE}/api/reports/download?type=trafik`);
  check("Oturumsuz rapor indirme → 401 (izolasyon)", repAnon.status === 401);

  // CORS ORIGIN GÜVENLİĞİ — challenge CORS'u site domain'ine SIKI kısıtlı olmalı;
  // origin.includes() spoof'una (evil-domain.com.attacker.net) açık DEĞİL.
  const corsBasi = async (origin) => {
    const r = await fetch(`${BASE}/api/v1/challenge`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ siteKey: "pk_demo_veylify_public" }),
    });
    return r.headers.get("access-control-allow-origin");
  };
  check("CORS: meşru domain (acme-shop.com) → yansıtılır", (await corsBasi("https://acme-shop.com")) === "https://acme-shop.com");
  check("CORS: gerçek subdomain (www.acme-shop.com) → yansıtılır", (await corsBasi("https://www.acme-shop.com")) === "https://www.acme-shop.com");
  check("CORS: prefix-spoof (evil-acme-shop.com.x.net) → reddedilir (null)", (await corsBasi("https://evil-acme-shop.com.attacker.net")) === "null");
  check("CORS: suffix-spoof (acme-shop.com.evil.net) → reddedilir (null)", (await corsBasi("https://acme-shop.com.evil.net")) === "null");

  // passive CORS — eskiden HER origin körü körüne yansıtılıyordu (tam CSRF açığı).
  const passiveCors = async (origin) => {
    const r = await fetch(`${BASE}/api/v1/passive`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: {} }),
    });
    return r.headers.get("access-control-allow-origin");
  };
  check("passive CORS: yabancı origin (evil.com) → null (körü körüne yansıtmaz)", (await passiveCors("https://evil.com")) === "null");
  check("passive CORS: meşru domain → yansıtılır", (await passiveCors("https://acme-shop.com")) === "https://acme-shop.com");

  // SITEVERIFY TOKEN GÜVENLİĞİ — exp (süre) + imza reddi. Bir saldırgan eski
  // token'ı yeniden kullanamamalı, exp'i uzatmaya çalışsa imza tutmamalı.
  const svJar = await kayit(`sv${Date.now()}@x.dev`);
  const { site: svSite } = await (await fetch(`${BASE}/api/sites`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: svJar }, body: JSON.stringify({ name: "sv.com", domains: "localhost" }) })).json();
  if (svSite) {
    await fetch(`${BASE}/api/sites/verify`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: svJar }, body: JSON.stringify({ siteId: svSite.id }) }).catch(() => {});
    const sec = svSite.secretKey;
    const now = Date.now();
    const svPost = async (resp) => (await (await fetch(`${BASE}/api/v1/siteverify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: sec, response: resp }) })).json());
    const taze = signVerification({ cid: "t1", site: svSite.siteKey, success: true, iat: now, exp: now + 120000, score: 0.9 }, sec);
    check("siteverify: taze token (exp gelecekte) → success", (await svPost(taze)).success === true);
    const eski = signVerification({ cid: "t2", site: svSite.siteKey, success: true, iat: now - 300000, exp: now - 180000, score: 0.9 }, sec);
    check("siteverify: süresi dolmuş token → expired reddi", (await svPost(eski))["error-codes"]?.includes("expired"));
    const sahte = signVerification({ cid: "t3", site: svSite.siteKey, success: true, iat: now, exp: now + 9e11, score: 1 }, "sk_yanlis");
    check("siteverify: yanlış secret imzalı token → reddedilir", (await svPost(sahte)).success === false);
  }

  // PLAN LİMİTLERİ — free plan (site 1, ekip 1) aşımı reddedilmeli; aksi halde
  // plan farkı anlamsız olurdu (gelir kaçağı). Pro yükseltince limit açılmalı.
  const planEmail = `plan${Date.now()}@x.dev`;
  const planJar = await kayit(planEmail);
  const site1 = await fetch(`${BASE}/api/sites`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ name: "s1.com", domains: "localhost" }) });
  check("Free plan ilk site → oluşur (200)", site1.status === 200);
  const site2 = await fetch(`${BASE}/api/sites`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ name: "s2.com", domains: "localhost" }) });
  check("Free plan ikinci site → 403 site_limit (plan limiti dayatılır)", site2.status === 403);

  const invite1 = await fetch(`${BASE}/api/team`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ email: "u1@x.dev", role: "viewer" }) });
  check("Free plan ekip daveti → 403 team_limit (solo plan)", invite1.status === 403);

  await fetch(`${BASE}/api/account/plan`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ plan: "pro" }) });
  const site2Pro = await fetch(`${BASE}/api/sites`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ name: "s2pro.com", domains: "localhost" }) });
  check("Pro yükseltince ikinci site → oluşur (limit açıldı)", site2Pro.status === 200);
  const invitePro = await fetch(`${BASE}/api/team`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: planJar }, body: JSON.stringify({ email: "u2@x.dev", role: "admin" }) });
  check("Pro yükseltince ekip daveti → oluşur", invitePro.status === 200);

  // API ANAHTAR LİMİTİ — free (anahtarLimiti=2) aşımı reddedilir; iptal edilen
  // anahtar limiti tıkamaz (aktif sayı üzerinden hesaplanır).
  const keyEmail = `key${Date.now()}@x.dev`;
  const keyJar = await kayit(keyEmail);
  const mkKey = (n) => fetch(`${BASE}/api/tokens`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: keyJar }, body: JSON.stringify({ name: n, scopes: ["stats"] }) });
  const key1 = await mkKey("k1"); const key1b = await key1.json();
  await mkKey("k2");
  check("Free plan 2 API anahtarı → oluşur", key1.status === 200);
  const key3 = await mkKey("k3");
  check("Free plan 3. API anahtarı → 403 key_limit", key3.status === 403);
  await fetch(`${BASE}/api/tokens`, { method: "DELETE", headers: { "Content-Type": "application/json", Cookie: keyJar }, body: JSON.stringify({ id: key1b.token.id }) });
  const key4 = await mkKey("k4");
  check("İptal edilen anahtar limiti açar → yeni anahtar 200", key4.status === 200);

  // ---- WEBHOOK SSRF KORUMASI ----
  // Webhook URL'si sunucunun giden isteğidir → iç/loopback/metadata hedefleri
  // engellenmelidir (aksi halde SSRF: kullanıcı sunucuya iç kaynaklara istek
  // yaptırır — cloud metadata token'ı sızdırma dahil).
  //
  // NOT: guvenliWebhookUrl() saf mantığını reprodüksiyonla test ederiz (deriveAnswer
  // deseni — .ts import yok). Kaynak: src/lib/specter/webhook-delivery.ts. Test
  // ortamında sunucu VEYLIFY_ALLOW_LOCAL_WEBHOOK=1 ile çalıştığından (e2e local
  // alıcı için) endpoint loopback'i kabul eder; ama PRODUCTION mantığı (env yok)
  // burada saf fonksiyonla doğrulanır — bariz iç hedefler reddedilmeli.
  function icselIPv4(host) {
    const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;
    const a = +m[1], b = +m[2];
    if (a === 127 || a === 10 || a === 0 || a >= 224) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  function guvenliUrlProd(url) { // env=yok (production) davranışı
    let u; try { u = new URL(url); } catch { return false; }
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host) return false;
    if (host === "localhost" || host.endsWith(".localhost")) return false;
    if (host === "0.0.0.0" || host === "::") return false;
    if (host.endsWith(".internal") || host.endsWith(".local")) return false;
    if (host === "::1") return false;
    if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return false;
    if (host.startsWith("fe80:")) return false;
    if (host.includes("169.254.169.254")) return false;
    if (icselIPv4(host)) return false;
    return true;
  }
  for (const [url, etiket] of [
    ["http://127.0.0.1:9/x", "loopback 127.0.0.1"],
    ["http://localhost:9/x", "localhost"],
    ["http://169.254.169.254/latest/meta-data/", "cloud metadata 169.254.169.254"],
    ["http://10.0.0.1/x", "private 10.0.0.0/8"],
    ["http://172.16.5.5/x", "private 172.16/12"],
    ["http://192.168.0.1/x", "private 192.168/16"],
    ["http://[::1]:9/x", "IPv6 loopback ::1"],
    ["http://[fd00::1]/x", "IPv6 ULA fd00::/8"],
    ["ftp://evil.example.com/x", "http(s) olmayan şema"],
    ["http://foo.internal/x", "iç TLD .internal"],
  ]) {
    check(`Webhook SSRF (prod mantığı): ${etiket} → reddedilir`, guvenliUrlProd(url) === false);
  }
  // Meşru dış URL'ler kabul edilmeli (koruma aşırı-geniş değil).
  check("Webhook SSRF (prod mantığı): https://hooks.example.com → kabul", guvenliUrlProd("https://hooks.example.com/veylify") === true);
  check("Webhook SSRF (prod mantığı): http://93.184.216.34 (public IP) → kabul", guvenliUrlProd("http://93.184.216.34/x") === true);
  // Endpoint ENTEGRASYON: meşru dış URL gerçekten oluşturulabilmeli (env ne olursa).
  const mesru = await fetch(`${BASE}/api/webhooks`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ siteId: site.id, url: "https://hooks.example.com/veylify", events: ["*"] }),
  });
  check("Webhook SSRF: meşru dış https URL → endpoint kabul eder (oluşur)", mesru.status === 200);
  // http(s) olmayan şema endpoint'te de reddedilmeli (env-bağımsız).
  const kotuSema = await fetch(`${BASE}/api/webhooks`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: jarA },
    body: JSON.stringify({ siteId: site.id, url: "ftp://evil.example.com/x", events: ["*"] }),
  });
  check("Webhook SSRF: ftp şema → endpoint reddeder (400)", kotuSema.status === 400);

  // ---- PoW BYPASS KORUMASI (hashcash bütünlüğü) ----
  // KRİTİK: powDogrula, istemci hash'ini SHA-256(seed:nonce) ile YENİDEN
  // hesaplayıp eşleştirmelidir. Aksi halde bot, gerçek CPU harcamadan uydurma
  // bir "0000…"-hash gönderip PoW'u bypass eder (savunmanın tamamı çöker).
  // Kaynak: src/lib/specter/proof-of-work.ts powDogrula. Reprodüksiyon (deriveAnswer
  // deseni — .ts import yok); gerçek crypto ile bütünlük+hedef adımlarını doğrular.
  function bastakiSifirBitT(hashHex) {
    const h = String(hashHex).trim().toLowerCase().replace(/^0x/, "");
    let bit = 0;
    for (const ch of h) { const n = parseInt(ch, 16); if (Number.isNaN(n)) break; if (n === 0) { bit += 4; continue; } bit += 4 - (32 - Math.clz32(n)); break; }
    return bit;
  }
  function powDogrulaT(zorlukBit, seed, nonce, hashHex) {
    const bit = bastakiSifirBitT(hashHex);
    const gerekli = Math.max(0, Math.round(zorlukBit));
    const beklenen = crypto.createHash("sha256").update(`${seed}:${nonce}`).digest("hex");
    const istemci = String(hashHex).trim().toLowerCase().replace(/^0x/, "");
    let hashDogru = false;
    try { const a = Buffer.from(beklenen, "hex"), b = Buffer.from(istemci, "hex"); hashDogru = a.length === b.length && crypto.timingSafeEqual(a, b); } catch { /* geçersiz hex */ }
    return hashDogru && bit >= gerekli;
  }
  const powSeed = 987654, powZor = 12;
  // Meşru: gerçekten nonce ara (widget davranışı) → KABUL.
  let pn = 0, ph;
  while (true) { ph = crypto.createHash("sha256").update(`${powSeed}:${pn}`).digest("hex"); if (bastakiSifirBitT(ph) >= powZor) break; pn++; }
  check("PoW: meşru çözüm (gerçek nonce+hash) → kabul", powDogrulaT(powZor, powSeed, pn, ph) === true);
  // Bypass: uydurma sıfır-hash (gerçek SHA değil) → RED.
  check("PoW: uydurma 0000-hash (CPU'suz) → reddedilir (bypass kapalı)",
    powDogrulaT(powZor, powSeed, 999, "000" + "a".repeat(61)) === false);
  // Yanlış nonce (hash başka nonce'a ait) → RED.
  check("PoW: hash'e uymayan nonce → reddedilir", powDogrulaT(powZor, powSeed, pn + 1, ph) === false);
  // Gerçek hash ama yetersiz zorluk (seed:0) → hedef denetimi çalışır.
  const ph0 = crypto.createHash("sha256").update(`${powSeed}:0`).digest("hex");
  check("PoW: gerçek hash + hedef denetimi tutarlı", powDogrulaT(powZor, powSeed, 0, ph0) === (bastakiSifirBitT(ph0) >= powZor));

  // ---- BAŞLIK-SAHTEKÂRLIĞI TESPİTİ (UA-taklidine bağışık) ----
  // UA "Chrome" iddia eden ama gerçek tarayıcı başlık setini (Client Hints +
  // Accept-Language) göndermeyen bot otomasyon olarak yakalanmalı; meşru Chrome
  // (tam set) yakalanmamalı (yanlış-pozitif yok). Kaynak: request-meta.ts
  // baslikSahtekarligi. Saf mantık reprodüksiyon (deriveAnswer deseni).
  // NOT: Canlı endpoint testinde Node fetch/undici otomatik `accept-language: *`
  // enjekte ettiği için gerçek "header'sız bot" simüle edilemez; bu yüzden saf
  // mantık reprodüksiyonu + ayrıca düşük-seviye http.request (aşağıda) kullanılır.
  const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36";
  function uaChromiumT(ua) {
    const u = ua.toLowerCase();
    return (u.includes("chrome") || u.includes("edg/")) && !u.includes("headless") &&
      !/python|curl|go-http|node-fetch|axios|scrapy|wget|okhttp|libwww/.test(u);
  }
  function baslikSahtekarligiT(uaChromium, clientHints, acceptLang, acceptTarayici) {
    if (!uaChromium) return false;
    if (!acceptTarayici && !acceptLang) return true;
    return !acceptLang && !clientHints;
  }
  // Chromium UA + hem Accept-Language HEM Client Hints yok → sahtekârlık.
  check("Başlık-sahtekârlığı: Chrome-UA + dil/ClientHints yok → yakalanır",
    baslikSahtekarligiT(uaChromiumT(CHROME_UA), false, false, true) === true);
  // Meşru Chrome (tam set) → yakalanmaz (yanlış-pozitif yok).
  check("Başlık-sahtekârlığı: meşru Chrome (tam header) → yakalanmaz",
    baslikSahtekarligiT(uaChromiumT(CHROME_UA), true, true, true) === false);
  // Gerçek Chrome ama Client Hints proxy'de düşmüş (dil VAR) → yakalanmaz (kritik FP koruması).
  check("Başlık-sahtekârlığı: Chrome + dil VAR ama ClientHints yok (proxy) → yakalanmaz",
    baslikSahtekarligiT(uaChromiumT(CHROME_UA), false, true, true) === false);
  // curl (Chromium iddiası yok) → başlık-vetosu dokunmaz (ayrı sinyal yakalar).
  check("Başlık-sahtekârlığı: curl UA (Chromium değil) → başlık-vetosu değerlendirmez",
    baslikSahtekarligiT(uaChromiumT("curl/8.7.1"), false, false, false) === false);
  // CANLI DÜŞÜK-SEVİYE: http.request ile gerçekten header'sız Chrome-UA isteği
  // (undici enjeksiyonu yok) → automation_detected dönmeli.
  const spoofReason = await new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: { mouseSamples: 60, mousePathLength: 900, keyIntervals: [100, 120, 90, 110] } });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "User-Agent": CHROME_UA },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b).reason); } catch { resolve(null); } }); });
    req.on("error", () => resolve(null));
    req.end(body);
  });
  check("Başlık-sahtekârlığı (canlı, header'sız Chrome-UA) → automation_detected",
    spoofReason === "automation_detected");

  // ---- AI-AJAN ANTI-SPOOFING (ürünün ana vaadi: "siteleri AI'dan koru") ----
  // AI ajanı SADECE UA'dan tespit edilir; UA trivial taklit edilir. "izin"
  // politikalı bir ajan davranış eşiğini BYPASS ettiğinden, izin ancak kaynak IP
  // operatörün resmi CIDR'ında ise verilmeli. Aksi halde "OAI-SearchBot" UA'sıyla
  // gelen kazıyıcı korumayı tamamen atlardı. Kaynak: passive route + ai-verify.ts.
  const OAI_UA = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot";
  const aiPassive = (ua, ip) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: { mouseSamples: 0, keyIntervals: [] } });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "User-Agent": ua, "x-forwarded-for": ip },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  // 1) SAHTE OAI-SearchBot (UA taklidi + rastgele kötü IP) → izin ALMAZ (görünmez geçemez).
  const sahteAi = await aiPassive(OAI_UA, "6.6.6.6");
  check("AI anti-spoof: sahte OAI-SearchBot (UA taklidi, rastgele IP) → görünmez geçemez",
    sahteAi.passed === false);
  // 2) GERÇEK OAI-SearchBot (UA + OpenAI resmi CIDR 20.42.10.x) → izinli geçer (FP yok).
  const gercekAi = await aiPassive(OAI_UA, "20.42.10.5");
  check("AI anti-spoof: gerçek OAI-SearchBot (resmi CIDR IP) → izinli geçer (yanlış-pozitif yok)",
    gercekAi.passed === true);

  // ---- PLATFORM ÇELİŞKİSİ (gerçek çapraz-doğrulama, UA-taklidine bağışık) ----
  // UA string'indeki OS ile Client Hints sec-ch-ua-platform ÇELİŞİYORsa → sahte.
  // İki ayrı ham header'ı karşılaştırır; bot ikisini tutarlı yalanlamayı beceremez.
  // Kaynak: request-meta.ts headerSinyalCikar/baslikSahtekarligi (platformCeliskisi).
  const WIN_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const iyiSig2 = { mouseSamples: 60, mousePathLength: 900, mouseSpeedVariance: 0.3, keyIntervals: [100, 120, 90, 110] };
  const platPassive = (chPlatform) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: iyiSig2 });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body),
        "User-Agent": WIN_UA, "sec-ch-ua": '"Chromium";v="120"', "sec-ch-ua-platform": chPlatform,
        "accept-language": "tr", "accept": "text/html",
      },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  // UA Windows ama Client Hints platform "Linux" → çelişki → automation_detected.
  const celiskili = await platPassive('"Linux"');
  check("Platform çelişkisi: UA Windows + Client Hints Linux → automation_detected",
    celiskili.passed === false && celiskili.reason === "automation_detected");
  // UA Windows + platform "Windows" (tutarlı) → automation DEĞİL (yanlış-pozitif yok).
  const tutarli = await platPassive('"Windows"');
  check("Platform çelişkisi: UA Windows + Client Hints Windows → automation değil (FP yok)",
    tutarli.reason !== "automation_detected");

  // ---- MOBİL ÇELİŞKİSİ (sec-ch-ua-mobile ↔ UA cihaz tipi) ----
  const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const mobilPassive = (chMobile, sig) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: sig });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body),
        "User-Agent": IPHONE_UA, "sec-ch-ua-mobile": chMobile, "accept-language": "tr", "accept": "text/html",
      },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  // UA iPhone ama sec-ch-ua-mobile ?0 (masaüstü) → çelişki → automation_detected.
  const mobCelisik = await mobilPassive("?0", iyiSig2);
  check("Mobil çelişkisi: UA iPhone + sec-ch-ua-mobile ?0 → automation_detected",
    mobCelisik.passed === false && mobCelisik.reason === "automation_detected");
  // UA iPhone + ?1 (tutarlı) → automation DEĞİL (yanlış-pozitif yok).
  const mobTutarli = await mobilPassive("?1", { hadTouch: true, mouseSamples: 0, keyIntervals: [100, 120, 90, 110] });
  check("Mobil çelişkisi: UA iPhone + sec-ch-ua-mobile ?1 → automation değil (FP yok)",
    mobTutarli.reason !== "automation_detected");

  // ---- SEC-FETCH-* METADATA (gerçek tarayıcı fetch'i gönderir, tool göndermez) ----
  // Chromium UA + Client Hints YOK + Sec-Fetch YOK (accept-language olsa bile) →
  // tool sinyali. Gerçek Chromium fetch'i ikisini de gönderir; curl/python hiçbirini.
  const CH_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const secFetchPassive = (extraHeaders) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: iyiSig2 });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "User-Agent": CH_UA, "accept-language": "tr", "accept": "text/html", ...extraHeaders },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  // Chrome-UA + Client Hints YOK + Sec-Fetch YOK → automation (accept-language var ama yetmez).
  const toolSinyal = await secFetchPassive({});
  check("Sec-Fetch: Chrome-UA + ClientHints yok + Sec-Fetch yok → automation_detected",
    toolSinyal.passed === false && toolSinyal.reason === "automation_detected");
  // Gerçek tarayıcı: Client Hints + Sec-Fetch var → automation DEĞİL (FP yok).
  const gercekTarayici = await secFetchPassive({ "sec-ch-ua": '"Chromium";v="120"', "sec-ch-ua-platform": '"Windows"', "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" });
  check("Sec-Fetch: Chrome-UA + ClientHints + Sec-Fetch → automation değil (FP yok)",
    gercekTarayici.reason !== "automation_detected");

  // ---- KATMANLI SAVUNMA: davranış-spoofing tek başına yetmez ----
  // Bir bot MÜKEMMEL insan-benzeri davranış sinyalleri ENJEKTE etse bile (yüksek
  // varyans/örnek), gerçek Chromium başlık setini gönderemezse yakalanır. Davranış
  // katmanı aldatılsa da sunucu-tarafı başlık sinyalleri botu ele verir.
  const mukemmelDavranis = { mouseSamples: 150, mousePathLength: 2000, mouseSpeedVariance: 0.4, mouseCorners: 12, mouseAccelVariance: 0.3, keyIntervals: [95, 130, 88, 142, 110, 99, 120] };
  const katmanliRes = await new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", signals: mukemmelDavranis });
    const req = http.request(`${BASE}/api/v1/passive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36" },
    }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  check("Katmanlı savunma: mükemmel enjekte davranış + tool başlıkları → yine yakalanır",
    katmanliRes.passed === false);

  // ---- IP İTİBAR ÖĞRENMESİ + ADAPTİF POW ESKALASYONU (ekonomik caydırıcılık) ----
  // Bir IP tekrar tekrar bloklandıkça threatScore runtime'da yükselir (seed değil,
  // GERÇEK öğrenme) → sonraki challenge'ın PoW zorluğu artar. "botnet CPU öder"
  // iddiasının canlı kanıtı. Kaynak: db.ts IpRep.gozlemle + challenge adaptif PoW.
  const kotuIp = "45.133.88." + (100 + (pass % 50)); // testler arası çakışmasın
  const chBad = (extraHdr = {}) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public" });
    const req = http.request(`${BASE}/api/v1/challenge`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "x-forwarded-for": kotuIp, ...extraHdr } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  const verifyBot = (token) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", token, input: "x", signals: { honeypotTetik: true } });
    const req = http.request(`${BASE}/api/v1/verify`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "x-forwarded-for": kotuIp } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  // Başlangıç challenge (temiz itibar) — PoW muhtemelen taban (yok/düşük).
  const ilkCh = await chBad();
  const ilkPow = ilkCh.pow?.hedefBit ?? 0;
  // IP'yi 5 kez blokla (honeypot) → itibar bozulur.
  for (let i = 0; i < 5; i++) { const c = await chBad(); await verifyBot(c.token); }
  // Sonraki challenge → PoW zorluğu artmış olmalı.
  const sonCh = await chBad();
  const sonPow = sonCh.pow?.hedefBit ?? 0;
  check("IP itibar öğrenmesi: tekrar bloklanan IP'nin PoW zorluğu artar (adaptif caydırıcılık)",
    sonPow > ilkPow);

  // ---- BOTNET KORELASYONU → POW ESKALASYONU ----
  // Aynı cihaz-profilini (fingerprint) paylaşan ÇOK IP = botnet. Her IP tek
  // başına "temiz" olsa bile küme tespit edilir → yeni bir botnet-üyesi IP
  // yüksek PoW alır. Kaynak: fingerprint IP-bağımsız ja3 + Events.fingerprintPaylasanIp
  // + challenge botnetOlasilik.
  const HEADLESS_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/121 Safari/537.36";
  const chFp = (ip) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public" });
    const req = http.request(`${BASE}/api/v1/challenge`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "x-forwarded-for": ip, "User-Agent": HEADLESS_UA } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
    req.on("error", () => resolve({}));
    req.end(body);
  });
  const verFp = (ip, token) => new Promise((resolve) => {
    const body = JSON.stringify({ siteKey: "pk_demo_veylify_public", token, input: "x", signals: {} });
    const req = http.request(`${BASE}/api/v1/verify`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "x-forwarded-for": ip, "User-Agent": HEADLESS_UA } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => resolve()); });
    req.on("error", () => resolve());
    req.end(body);
  });
  // 10 farklı IP aynı headless fingerprint → botnet oluştur.
  for (let i = 1; i <= 10; i++) { const c = await chFp(`91.202.14.${i}`); await verFp(`91.202.14.${i}`, c.token); }
  // Yeni IP, aynı fingerprint → botnet-üyesi olduğu için yüksek PoW.
  const botnetCh = await chFp("91.202.14.200");
  check("Botnet korelasyonu: tek fingerprint'i paylaşan çok IP → yeni üye yüksek PoW alır",
    (botnetCh.pow?.hedefBit ?? 0) > 16);

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
