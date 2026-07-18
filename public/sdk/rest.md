# Veylify REST API — Ham HTTP Referansı

Bir SDK kullanmıyorsanız, Veylify'ın tüm public uçlarını doğrudan HTTP ile çağırabilirsiniz. Bu, tüm resmi SDK'ların sardığı gerçek sözleşmedir.

**Temel URL:** `https://api.veylify.com`

## Anahtarlar

| Anahtar | Önek | Nerede kullanılır | Gizli mi |
|---------|------|-------------------|----------|
| Site (public) key | `pk_live_…` / `pk_test_…` | Tarayıcı/widget, `siteKey` | Hayır (herkese açık) |
| Secret key | `sk_live_…` / `sk_test_…` | Backend, `/siteverify` | **Evet** |
| Webhook secret | `whsec_…` | Webhook imza doğrulama | **Evet** |

---

## 1. POST /api/v1/challenge

Widget çağırır. Yeni bir ghost-font challenge üretir. **Backend'inizden çağırmanıza gerek yoktur** — widget halleder.

**İstek (JSON):**
```json
{ "siteKey": "pk_live_xxxxxxxx" }
```

**Yanıt (200):**
```json
{
  "id": "cid_ab12cd34",
  "params": { "seed": 1234567, "length": 5, "difficulty": "medium" },
  "token": "<imzalı-challenge-token>",
  "ttl": 120,
  "invisibleMode": false
}
```

Hata: `400` (siteKey eksik), `403` (geçersiz/pasif site), `429` (rate limit veya `quota_exceeded`).

**cURL:**
```bash
curl -X POST https://api.veylify.com/api/v1/challenge \
  -H "Content-Type: application/json" \
  -d '{"siteKey":"pk_live_xxxxxxxx"}'
```

---

## 2. POST /api/v1/verify

Widget, kullanıcının çözümü + davranış sinyalleri + challenge token'ı ile çağırır. Başarılıysa, backend'in `/siteverify` ile teyit edeceği **verification token'ı** döner.

**İstek (JSON):**
```json
{
  "siteKey": "pk_live_xxxxxxxx",
  "token": "<challenge-token>",
  "input": "K7X9A",
  "signals": { "mouseSamples": 42, "timeToSubmit": 5300, "...": "..." }
}
```

**Yanıt — başarılı (200):**
```json
{
  "success": true,
  "token": "<verification-token>",
  "score": 0.87,
  "appliedRules": []
}
```

**Yanıt — başarısız (200):**
```json
{ "success": false, "reason": "low_behavior_score", "score": 0.12 }
```

`reason` değerleri: `bad_answer`, `low_behavior_score`, `expired`, `bad_signature`, `replay`, `rule_block`.

---

## 3. POST /api/v1/passive

Görünmez mod. Challenge GÖSTERMEDEN yalnızca davranış + kural motoruyla karar verir. Widget önce bunu dener.

**İstek (JSON):**
```json
{ "siteKey": "pk_live_xxxxxxxx", "signals": { "...": "..." } }
```

**Yanıt — geçti (200):**
```json
{ "passed": true, "token": "<verification-token>", "score": 0.91 }
```

**Yanıt — challenge gerekli (200):**
```json
{ "passed": false, "reason": "needs_challenge", "score": 0.4 }
```

---

## 4. POST /api/v1/siteverify  ← BACKEND BURAYI ÇAĞIRIR

reCAPTCHA `/siteverify` muadili. Form gönderildiğinde, **backend'iniz** widget'ın döndürdüğü verification token'ı secret key'inizle teyit eder.

**İstek — form-encoded VEYA JSON:**

```
secret=sk_live_xxxxxxxx
response=<verification-token>
```

veya

```json
{ "secret": "sk_live_xxxxxxxx", "response": "<verification-token>" }
```

**Yanıt — başarılı (200):**
```json
{
  "success": true,
  "challenge_ts": "2026-07-16T10:20:30.000Z",
  "hostname": "Örnek Site",
  "score": 0.87,
  "cid": "cid_ab12cd34"
}
```

**Yanıt — başarısız (200 veya 400):**
```json
{ "success": false, "error-codes": ["invalid-input-response"] }
```

Hata kodları:

| Kod | Anlamı |
|-----|--------|
| `missing-input` | secret veya response eksik (400) |
| `invalid-input-secret` | Secret key tanınmadı |
| `site-not-verified` | Alan adı sahipliği doğrulanmamış |
| `invalid-input-response` | Token geçersiz/bozuk |
| `timeout-or-duplicate` | Token süresi doldu veya tekrar kullanıldı |

**cURL (form):**
```bash
curl -X POST https://api.veylify.com/api/v1/siteverify \
  -d "secret=sk_live_xxxxxxxx" \
  --data-urlencode "response=<verification-token>"
```

**cURL (JSON):**
```bash
curl -X POST https://api.veylify.com/api/v1/siteverify \
  -H "Content-Type: application/json" \
  -d '{"secret":"sk_live_xxxxxxxx","response":"<verification-token>"}'
```

---

## 5. Webhook'lar

Veylify, bir olay (`bot.blocked`, `ai_agent.detected`, …) olduğunda kayıtlı endpoint'inize imzalı bir POST gönderir.

**Gönderilen başlıklar:**
```
Content-Type: application/json
User-Agent: Veylify-Webhook/1.0
X-Veylify-Signature: t=1721124030,v1=5f3a…e9b1
```

**Gövde (event zarfı):**
```json
{
  "type": "bot.blocked",
  "id": "evt_ab12cd34ef56",
  "created": 1721124030,
  "data": {
    "site_key": "pk_live_xxxxxxxx",
    "reason": "low_behavior_score",
    "score": 0.08,
    "ip": "203.0.113.10",
    "country": "TR",
    "path": "/signup"
  }
}
```

### İmza doğrulama (dil-bağımsız)

```
imza     = "t=<ts>,v1=<hmac>"
hmac     = HMAC_SHA256( "<ts>.<rawBody>", webhookSecret )   // hex
```

1. `X-Veylify-Signature` başlığını `t` ve `v1` olarak ayrıştırın.
2. `abs(now_seconds - t) <= 300` olduğunu doğrulayın (replay koruması).
3. `HMAC_SHA256("<t>.<rawBody>", secret)` hesaplayın — **ham gövde baytları** ile.
4. Sonucu `v1` ile **timing-safe** karşılaştırın (`hmac.compare_digest` / `hash_equals` / `crypto.timingSafeEqual`).

2xx yanıt dönene kadar Veylify üstel geri çekilmeyle en fazla 3 kez yeniden dener.

---

## Notlar

- Tüm public uçlar CORS'u origin'e göre yansıtır; widget cross-origin çağrılabilir.
- Rate limit: challenge 120/dk, verify 240/dk, passive 300/dk (site başına).
- Aylık kota aşımında ücretsiz plan `429 quota_exceeded` döner; ücretli plan overage ile devam eder (`X-Veylify-Quota: overage`).
