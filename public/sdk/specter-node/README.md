# @veylify/node

Veylify'ın **resmi Node.js SDK'sı**. Sunucu tarafında iki temel işi yapar:

1. **`siteverify`** — Widget'ın döndürdüğü doğrulama token'ını backend'inizde teyit eder (reCAPTCHA `/siteverify` muadili).
2. **`verifyWebhook`** — Veylify'dan gelen webhook'ların HMAC-SHA256 imzasını doğrular (`X-Veylify-Signature: t=<ts>,v1=<hmac>`).

Sıfır bağımlılık. Node 18+ (yerleşik `fetch` ve `crypto`). Hem CommonJS hem ESM.

> **Geriye uyum:** Eski `SpecterClient` / `SpecterError` adları `VeylifyClient` / `VeylifyError`'ın takma adı olarak korunur; mevcut entegrasyonlar çalışmaya devam eder.

---

## Kurulum

```bash
npm install @veylify/node
```

## Hızlı başlangıç — siteverify

Kullanıcı formunuzu gönderdiğinde, widget gizli bir alana (varsayılan `veylify-token`) doğrulama token'ı yazar. Backend'inizde bu token'ı **secret key'inizle** teyit edin:

```js
const { VeylifyClient } = require("@veylify/node");

const veylify = new VeylifyClient({
  secret: process.env.VEYLIFY_SECRET_KEY, // sk_live_… / sk_test_…
});

app.post("/signup", async (req, res) => {
  const token = req.body["veylify-token"];
  const result = await veylify.siteverify(veylify.secret, token);

  if (!result.success) {
    return res.status(403).json({
      error: "Doğrulama başarısız",
      codes: result.error_codes, // ["invalid-input-response"] vb.
    });
  }

  // result.score  → davranış skoru (0..1)
  // result.hostname, result.challenge_ts, result.cid de mevcut
  res.json({ ok: true, score: result.score });
});
```

ESM:

```js
import { VeylifyClient } from "@veylify/node";
const veylify = new VeylifyClient({ secret: process.env.VEYLIFY_SECRET_KEY });
```

### Yanıt şekli (`SiteverifyResult`)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `success` | `boolean` | Token geçerli mi |
| `challenge_ts` | `string` | Challenge'ın ISO-8601 zamanı |
| `hostname` | `string` | Token'ın verildiği site adı |
| `score` | `number` | Davranış skoru (0..1) |
| `cid` | `string` | Challenge id |
| `error-codes` / `error_codes` | `string[]` | Başarısızlıkta hata kodları |

Olası hata kodları: `missing-input`, `invalid-input-secret`, `site-not-verified`, `invalid-input-response`, `timeout-or-duplicate`.

---

## Express middleware

Tek satırda korumaya alın:

```js
const { VeylifyClient } = require("@veylify/node");
const veylify = new VeylifyClient({ secret: process.env.VEYLIFY_SECRET_KEY });

// Token'ı doğrular, req.veylify'a sonucu yazar, başarısızsa 403 döner.
app.post("/signup", veylify.express({ minScore: 0.5 }), (req, res) => {
  res.json({ ok: true, score: req.veylify.score });
});
```

Seçenekler: `field` (varsayılan `"veylify-token"`), `secret`, `minScore`, `onFail(req, res)`.

> Geriye uyum için sonuç `req.specter`'a da yazılır.

---

## Webhook imza doğrulama

Veylify, bir olay olduğunda (ör. `bot.blocked`, `ai_agent.detected`) endpoint'inize imzalı bir POST gönderir. İmzayı **her zaman doğrulayın** — böylece isteğin gerçekten Veylify'dan geldiğinden emin olursunuz.

> **Önemli:** İmza HAM gövde baytları üzerinden hesaplanır. Gövdeyi JSON'a parse etmeden önce ham string'i yakalayın.

### Express (ham gövde ile)

```js
const express = require("express");
const { VeylifyClient } = require("@veylify/node");

const app = express();
const WEBHOOK_SECRET = process.env.VEYLIFY_WEBHOOK_SECRET;

app.post(
  "/webhooks/veylify",
  express.raw({ type: "application/json" }), // HAM gövde şart
  (req, res) => {
    const signature = req.header("X-Veylify-Signature");
    const rawBody = req.body; // Buffer

    if (!VeylifyClient.verifyWebhook(rawBody, signature, WEBHOOK_SECRET)) {
      return res.status(400).send("Geçersiz imza");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    switch (event.type) {
      case "bot.blocked":
        console.log("Bot engellendi:", event.data);
        break;
      case "ai_agent.detected":
        console.log("AI ajan tespit edildi:", event.data);
        break;
    }
    res.json({ received: true });
  }
);
```

Veya tek adımda doğrula + parse et (`constructEvent`):

```js
const veylify = new VeylifyClient();
try {
  const event = veylify.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  // event.type, event.id, event.created, event.data
} catch (err) {
  return res.status(400).send("Geçersiz imza");
}
```

### İmza şeması

```
X-Veylify-Signature: t=<unix-saniye>,v1=<hmac-sha256-hex>

hmac = HMAC_SHA256( `${t}.${rawBody}`, webhookSecret )
```

- Zaman damgası **saniye** cinsindendir.
- Tolerans varsayılanı **300 sn** (replay koruması). `verifyWebhook(..., { toleranceSeconds })` ile değiştirilebilir.
- Karşılaştırma **timing-safe**'tir (`crypto.timingSafeEqual`).

---

## API

- `new VeylifyClient({ secret?, baseUrl?, timeout?, fetch? })`
- `client.siteverify(secret, response) → Promise<SiteverifyResult>`
- `client.verifyWebhook(body, header, secret, { toleranceSeconds? }) → boolean`
- `VeylifyClient.verifyWebhook(...)` — statik (client'sız)
- `client.constructEvent(body, header, secret, opts?) → VeylifyWebhookEvent` (geçersizse fırlatır)
- `client.express({ field?, secret?, minScore?, onFail? }) → middleware`

## Lisans

MIT
