# veylify

Veylify'ın **resmi Python SDK'sı**. Sunucu tarafında:

1. **`siteverify`** — Widget'ın döndürdüğü doğrulama token'ını backend'inizde teyit eder (reCAPTCHA `/siteverify` muadili).
2. **`verify_webhook`** — Veylify webhook'larının HMAC-SHA256 imzasını timing-safe doğrular (`X-Veylify-Signature: t=<ts>,v1=<hmac>`).

Sıfır üçüncü-parti bağımlılık (yalnızca standart kütüphane). Python 3.8+.

> **Geriye uyum:** Eski `specter` paketi ve `SpecterClient` / `SpecterError` adları takma ad olarak korunur (`from specter import SpecterClient` hâlâ çalışır); mevcut entegrasyonlar bozulmaz.

---

## Kurulum

```bash
pip install veylify
```

## Hızlı başlangıç — siteverify

```python
from veylify import VeylifyClient

client = VeylifyClient(secret="sk_live_...")  # veya VEYLIFY_SECRET_KEY env

result = client.siteverify(token)  # token = widget'ın yazdığı veylify-token
if not result.success:
    # result.error_codes → ["invalid-input-response"] vb.
    raise ValueError("Doğrulama başarısız")

print(result.score)      # davranış skoru (0..1)
print(result.hostname)   # token'ın verildiği site
print(result.cid)        # challenge id
```

### `SiteverifyResult` alanları

| Alan | Tip | Açıklama |
|------|-----|----------|
| `success` | `bool` | Token geçerli mi |
| `challenge_ts` | `str \| None` | Challenge'ın ISO-8601 zamanı |
| `hostname` | `str \| None` | Site adı |
| `score` | `float \| None` | Davranış skoru (0..1) |
| `cid` | `str \| None` | Challenge id |
| `error_codes` | `list[str]` | Başarısızlıkta hata kodları |
| `raw` | `dict` | Ham API yanıtı |

Hata kodları: `missing-input`, `invalid-input-secret`, `site-not-verified`, `invalid-input-response`, `timeout-or-duplicate`.

---

## Flask

```python
from flask import Flask, g
from veylify import VeylifyClient
from veylify.client import flask_protect

app = Flask(__name__)
veylify = VeylifyClient(secret="sk_live_...")

@app.post("/signup")
@flask_protect(veylify, min_score=0.5)   # token'ı doğrular, başarısızsa 403
def signup():
    return {"ok": True, "score": g.veylify.score}
```

## Django

```python
from django.http import JsonResponse
from veylify import VeylifyClient
from veylify.client import django_protect

veylify = VeylifyClient(secret="sk_live_...")

@django_protect(veylify, min_score=0.5)
def signup(request):
    return JsonResponse({"ok": True, "score": request.veylify.score})
```

---

## Webhook imza doğrulama

Veylify, bir olay (ör. `bot.blocked`, `ai_agent.detected`) olduğunda imzalı bir POST gönderir. İmzayı **her zaman doğrulayın**.

> **Önemli:** İmza HAM gövde baytları üzerinden hesaplanır. Doğrulamayı JSON parse'tan **önce**, ham gövdeyle yapın.

### Flask

```python
from flask import Flask, request
from veylify import verify_webhook, construct_event

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_..."

@app.post("/webhooks/veylify")
def veylify_webhook():
    raw = request.get_data()  # HAM bytes — parse ETMEYİN
    sig = request.headers.get("X-Veylify-Signature")

    if not verify_webhook(raw, sig, WEBHOOK_SECRET):
        return "Geçersiz imza", 400

    event = construct_event(raw, sig, WEBHOOK_SECRET)  # doğrula + parse
    if event["type"] == "bot.blocked":
        print("Bot engellendi:", event["data"])
    elif event["type"] == "ai_agent.detected":
        print("AI ajan:", event["data"])
    return {"received": True}
```

### Django

```python
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from veylify import verify_webhook

@csrf_exempt
def veylify_webhook(request):
    raw = request.body  # HAM bytes
    sig = request.headers.get("X-Veylify-Signature")
    if not verify_webhook(raw, sig, "whsec_..."):
        return HttpResponse("Geçersiz imza", status=400)
    ...
    return JsonResponse({"received": True})
```

### İmza şeması

```
X-Veylify-Signature: t=<unix-saniye>,v1=<hmac-sha256-hex>

hmac = HMAC_SHA256(f"{t}.{raw_body}", webhook_secret)
```

- Zaman damgası **saniye** cinsinden.
- Varsayılan tolerans **300 sn** — `verify_webhook(..., tolerance_seconds=…)` ile değiştirin.
- Karşılaştırma `hmac.compare_digest` ile **timing-safe**.

---

## API

- `VeylifyClient(secret=None, base_url="https://api.veylify.com", timeout=8.0)`
- `client.siteverify(response, secret=None) -> SiteverifyResult`
- `verify_webhook(body, header, secret, tolerance_seconds=300) -> bool`
- `construct_event(body, header, secret, tolerance_seconds=300) -> dict` (geçersizse `VeylifyError`)
- `flask_protect(client, field_name="veylify-token", min_score=0.0)`
- `django_protect(client, field_name="veylify-token", min_score=0.0)`

## Lisans

MIT
