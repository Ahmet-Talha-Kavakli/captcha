/**
 * Specter GÜVENLİK testi — yetkilendirme / izolasyon.
 * İki ayrı kullanıcı oluşturup birinin diğerinin kaynaklarına
 * erişemediğini kanıtlar. Bir bot-koruma ürününde bu kritiktir.
 */
import crypto from "node:crypto";
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

  console.log(`\n=== ${pass} geçti, ${fail} başarısız ===\n`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
