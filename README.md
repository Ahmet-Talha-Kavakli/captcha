# Veylify 👻

**Yapay zekaya karşı ghost-font koruması.** Geliştiricilerin sitelerini AI botlarından koruyan, temporal-dithering tabanlı CAPTCHA + doğrulama SaaS'ı.

> AI botlar bugün reCAPTCHA ve hCaptcha'yı saniyeler içinde çözüyor. Veylify, insanın gördüğü ile makinenin okuduğunu ayırarak botları yeniden dışarıda tutar.

---

## Neden Veylify?

Klasik CAPTCHA'lar artık AI vision modelleriyle geçiliyor. Veylify üç katmanlı bir savunma kurar:

1. **Ghost-font (temporal dithering)** — Kod, hareketli nokta gürültüsüne gömülür. Her karede metin ile arka plan aynı istatistiksel yoğunluktadır; tek bir kareye bakan OCR/vision modeli yalnızca gürültü görür. İnsan görme sistemi kareler arası tutarlı titreşimi yakalayıp harfleri okur. **Sır tek karede değil, harekettedir.**
2. **Davranışsal analiz** — Fare, klavye ritmi ve zamanlamadan 0–1 insanlık skoru üretilir. Vision-bot kodu doğru okusa bile insan gibi davranamaz.
3. **Kural motoru** — IP itibarı, ASN, coğrafya, hız ve bot sınıfına göre öncelikli allow/challenge/block kararları.

**Görünmez mod** (reCAPTCHA v3 / Turnstile muadili): davranış skoru yüksek kullanıcılar hiç CAPTCHA görmez.

---

## Hızlı başlangıç

```bash
npm install
npm run dev          # http://127.0.0.1:3033
```

> **Not:** `localhost` yerine `127.0.0.1` kullanın (tarayıcı cookie birikimi 431 hatası verebilir). `dev`/`start` scriptleri bunu otomatik ayarlar.

**Demo hesap:** `demo@specter.dev` / `specter123`

### Siteye entegrasyon (3 satır)

```html
<!-- Formunuzun içine -->
<div class="veylify" data-sitekey="pk_live_..."></div>
<script src="https://cdn.veylify.com/veylify.js" async defer></script>
```

**Opsiyonel öznitelikler:**

```html
<div class="veylify"
     data-sitekey="pk_live_..."
     data-lang="tr"          <!-- tr|en|de|fr|es|ar|ru|pt (varsayılan: sayfa dili) -->
     data-theme="auto"       <!-- light|dark|auto -->
     data-callback="onOk">   <!-- doğrulanınca window.onOk(token, sonuc) çağrılır -->
</div>
```

Doğrulama sonucu iki yolla alınır: `data-callback` (yukarıdaki gibi) veya
`veylify-verified` event'i (`el.addEventListener("veylify-verified", e => e.detail.token)`).
Widget Shadow DOM izole, katı CSP uyumlu, klavye + ekran-okuyucu erişilebilir,
mobil-responsive ve 8 dilde (Arapça RTL dahil) çalışır.

```js
// Backend'de doğrula (reCAPTCHA /siteverify muadili)
const res = await fetch("https://api.veylify.com/api/v1/siteverify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secret: "sk_live_...", response: req.body["veylify-token"] }),
});
if (!(await res.json()).success) return res.status(403).send("Doğrulama başarısız");
```

`public/ornek.html` gerçek bir form entegrasyon örneğidir.

---

## Mimari

| Katman | Konum |
|--------|-------|
| Ghost-font motoru (temporal dithering) | `src/lib/specter/ghostfont.ts`, `public/specter.js` |
| Kural motoru | `src/lib/specter/rule-engine.ts`, `rule-templates.ts` |
| Davranış skoru | `src/lib/specter/behavior.ts` |
| HMAC token + nonce | `src/lib/specter/crypto.ts` |
| Public API | `src/app/api/v1/{challenge,passive,verify,siteverify}` |
| Panel (123+ modül) | `src/app/panel/*` |
| Veri (JSON DB) | `src/lib/db/*` |
| Landing | `src/app/(marketing)/*` |

**Panel modülleri:** Genel Bakış · Canlı Trafik · Tehdit İstihbaratı · Kampanyalar · Kurallar · Siteler · Analitik · Veylify Zeka (AI asistan) · Uyarılar · Denetim · Ekip · Geliştirici · Ayarlar.

## API

| Uç | Açıklama |
|----|----------|
| `POST /api/v1/challenge` | Ghost-font challenge üret |
| `POST /api/v1/passive` | Görünmez mod (davranışla doğrula) |
| `POST /api/v1/verify` | Çözüm + davranış + kural değerlendir |
| `POST /api/v1/siteverify` | Sunucu tarafı token teyidi |

---

## Test

```bash
npm test              # tüm suite (113 test: e2e + güvenlik + edge + vision)
npm run test:e2e      # uçtan-uca akış + adversarial (49)
npm run test:security # kimlik/yetki/izolasyon + token/2FA/CORS/plan (44)
npm run test:edge     # bozuk input + prototype-pollution + bilgi-ifşası (19)
npm run test:vision   # gerçek Tesseract OCR körlük kanıtı (ghost-font %0)
```

Server `127.0.0.1:3033`'te çalışırken çalıştırın.

## Stack

Next.js 16 · React 19 · Tailwind v4 · TypeScript · framer-motion · lucide-react. Grafikler elle SVG. Sıfır-bağımlılık JSON DB. Cookie auth. Dil: Türkçe.
