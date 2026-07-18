# veylify/veylify-php

Veylify'ın **resmi PHP SDK'sı**. Sunucu tarafında:

1. **`siteverify`** — Widget doğrulama token'ını backend'inizde teyit eder (reCAPTCHA `/siteverify` muadili).
2. **`verifyWebhook`** — Veylify webhook'larının HMAC-SHA256 imzasını `hash_hmac` + `hash_equals` ile timing-safe doğrular.

Üçüncü-parti bağımlılık yok. PHP 7.4+ (cURL varsa kullanır, yoksa `file_get_contents`).

> **Geriye uyum:** Eski `Veylify\Specter` sınıfı ve `Veylify\Laravel\SpecterMiddleware` korunur (yeni sınıfların takma adıdır); mevcut entegrasyonlar çalışmaya devam eder.

---

## Kurulum

```bash
composer require veylify/veylify-php
```

## Hızlı başlangıç — siteverify

```php
<?php
require 'vendor/autoload.php';

use Veylify\Veylify;

$veylify = new Veylify('sk_live_...'); // veya VEYLIFY_SECRET_KEY env

$token  = $_POST['veylify-token'] ?? '';
$result = $veylify->siteverify($token);

if (empty($result['success'])) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Doğrulama başarısız',
        'codes' => $result['error_codes'] ?? [], // ["invalid-input-response"] vb.
    ]);
    exit;
}

echo $result['score'];    // davranış skoru (0..1)
echo $result['hostname']; // token'ın verildiği site
echo $result['cid'];      // challenge id
```

Kısayol:

```php
$result = $veylify->verifyRequest($_POST); // "veylify-token" alanını okur
```

### Yanıt alanları

| Anahtar | Tip | Açıklama |
|---------|-----|----------|
| `success` | `bool` | Token geçerli mi |
| `challenge_ts` | `string` | Challenge'ın ISO-8601 zamanı |
| `hostname` | `string` | Site adı |
| `score` | `float` | Davranış skoru (0..1) |
| `cid` | `string` | Challenge id |
| `error_codes` / `error-codes` | `string[]` | Başarısızlıkta hata kodları |

Hata kodları: `missing-input`, `invalid-input-secret`, `site-not-verified`, `invalid-input-response`, `timeout-or-duplicate`.

---

## Laravel middleware

```php
// routes/web.php
use App\Http\Controllers\SignupController;

Route::post('/signup', SignupController::class)
    ->middleware(\Veylify\Laravel\VeylifyMiddleware::class);

// Alan adı + minimum skorla:
Route::post('/signup', SignupController::class)
    ->middleware('veylify:veylify-token,0.5');
```

`config/services.php`:

```php
'veylify' => [
    'secret' => env('VEYLIFY_SECRET_KEY'),
],
```

Controller içinde sonuç: `$request->get('veylify')`.

---

## Webhook imza doğrulama

Veylify bir olay (ör. `bot.blocked`, `ai_agent.detected`) olduğunda imzalı POST gönderir. İmzayı **her zaman** doğrulayın.

> **Önemli:** İmza HAM gövde üzerinden hesaplanır — `php://input` kullanın, `$_POST` değil.

```php
<?php
require 'vendor/autoload.php';

use Veylify\Veylify;

$body      = file_get_contents('php://input'); // HAM gövde
$signature = $_SERVER['HTTP_X_VEYLIFY_SIGNATURE'] ?? '';
$secret    = 'whsec_...';

if (!Veylify::verifyWebhook($body, $signature, $secret)) {
    http_response_code(400);
    echo 'Geçersiz imza';
    exit;
}

$event = Veylify::constructEvent($body, $signature, $secret); // doğrula + parse
switch ($event['type']) {
    case 'bot.blocked':
        error_log('Bot engellendi: ' . json_encode($event['data']));
        break;
    case 'ai_agent.detected':
        error_log('AI ajan: ' . json_encode($event['data']));
        break;
}
http_response_code(200);
echo json_encode(['received' => true]);
```

### İmza şeması

```
X-Veylify-Signature: t=<unix-saniye>,v1=<hmac-sha256-hex>

hmac = hash_hmac('sha256', "{t}.{rawBody}", $secret)
```

- Zaman damgası **saniye** cinsinden.
- Varsayılan tolerans **300 sn** — `verifyWebhook($body, $sig, $secret, $toleransSn)`.
- Karşılaştırma `hash_equals` ile **timing-safe**.

---

## API

- `new Veylify(string $secret = '', ?string $baseUrl = null, int $timeout = 8)`
- `$veylify->siteverify(string $response, ?string $secret = null): array`
- `$veylify->verifyRequest(array $requestBody, string $field = 'veylify-token'): array`
- `Veylify::verifyWebhook(string $body, string $header, string $secret, int $toleranceSeconds = 300): bool`
- `Veylify::constructEvent(string $body, string $header, string $secret, int $toleranceSeconds = 300): array`

## Lisans

MIT
