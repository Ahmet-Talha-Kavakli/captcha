# Veylify — Canlıya Çıkış (Dağıtım) Rehberi

AI botlarına karşı ghost-font doğrulama platformu. Kendi kalıcı JSON DB'si +
cookie-oturumu ile çalışır — canlıya çıkmak için **zorunlu dış servis yoktur**.

## 1. Ön koşullar
- Node.js 20+ (öneri: 20 LTS veya 22)
- `veylify.com` domaini (alındı) → DNS'i hosting sağlayıcıya yönlendir

## 2. Ortam değişkenleri
Zorunlu env **yoktur**. Site kökü/marka bilgisi `src/lib/marka.ts` sabitinden
gelir (canonical/OG/sitemap/robots hepsi buradan beslenir). Alan adı değişirse
yalnızca `marka.ts` düzenlenir.

Opsiyonel entegrasyonlar için `.env.example` → `.env.local`:
```bash
cp .env.example .env.local
```
- SMTP_* (opsiyonel — iletişim formu e-postası; boşsa loglanır)

## 3. Yerel doğrulama
```bash
npm install
npm run build        # üretim derlemesi — hata 0 olmalı
npm start            # 127.0.0.1:3033
npm test             # e2e + güvenlik + edge testleri
```
> Not: `localhost` yerine `127.0.0.1` kullan (uzun başlık → HTTP 431 önlemi).
> Scriptler zaten `-H 127.0.0.1` ile başlatır.

## 4. Dağıtım seçenekleri

### A) Vercel (en hızlı)
1. Repo'yu Vercel'e bağla.
2. Environment Variables: `NEXT_PUBLIC_SITE_URL` = `https://veylify.com`.
3. Build Command `next build`, Output otomatik.
4. Domain: `veylify.com` + `www.veylify.com` (www → apex yönlendir).
> Uyarı: JSON DB `data/veylify.json` dosyaya yazar. Vercel'in dosya sistemi
> **kalıcı değildir** (serverless). Kalıcılık için: (a) Vercel yerine kalıcı
> diskli bir sunucu/VPS/Fly.io/Railway kullan, ya da (b) DB katmanını
> (`src/lib/db/db.ts`) Postgres'e taşı — tüm erişim tek repository'den geçer.

### B) Kalıcı disk (VPS / Fly.io / Railway) — ÖNERİLEN
- `npm run build && npm start`
- `data/` dizinini kalıcı diske/volume'a bağla (JSON DB burada yaşar).
- Reverse proxy (Nginx/Caddy) → 127.0.0.1:3033, TLS sertifikası.

## 5. Domain & SEO sonrası
- `robots.ts` ve `sitemap.ts` `NEXT_PUBLIC_SITE_URL`'den beslenir (marka.ts fallback).
- Google Search Console + Bing Webmaster'a `https://veylify.com/sitemap.xml` gönder.
- `public/llms.txt` ve `public/.well-known/security.txt` otomatik yayınlanır.

## 6. Demo hesabı
- Giriş: `demo@specter.dev` / `specter123` (test + demo bu hesaba bağlı — değiştirme).

## 7. Widget entegrasyonu (müşteri sitesi)
```html
<script src="https://veylify.com/specter.js" async defer></script>
```
Sunucu-taraflı doğrulama:
```bash
curl -X POST https://api.veylify.com/api/v1/siteverify \
  -H "X-Api-Key: <SITE_ANAHTARI>" \
  -d '{"token":"<KULLANICI_TOKENI>"}'
```
