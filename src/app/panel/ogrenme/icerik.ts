/**
 * Öğrenme Merkezi — statik içerik kaynağı.
 *
 * Buradaki tüm metinler Specter'ın GERÇEK özelliklerini/API'lerini anlatır
 * (ghost-font CAPTCHA, /api/v1/{challenge,verify,passive,siteverify} uçları,
 * widget data-* öznitelikleri, veylify-verified olayı, webhook HMAC imzası,
 * kural motoru, AI ajan politikaları). Placeholder/lorem değil.
 *
 * Not: Sabit veri; DB'ye bağlı değil. Server component güvenle import eder.
 */

export type Zorluk = "baslangic" | "orta" | "ileri";

export const ZORLUK_ETIKET: Record<Zorluk, string> = {
  baslangic: "Başlangıç",
  orta: "Orta",
  ileri: "İleri",
};

export const ZORLUK_TON: Record<Zorluk, "yesil" | "sari" | "kirmizi"> = {
  baslangic: "yesil",
  orta: "sari",
  ileri: "kirmizi",
};

/* ------------------------------------------------------------------ Hızlı başlangıç yolu */
export interface BaslangicAdim {
  no: number;
  baslik: string;
  aciklama: string;
  href: string;
  hrefEtiket: string;
  sure: string;
  ikon: string; // lucide adı
}

export const HIZLI_BASLANGIC: BaslangicAdim[] = [
  {
    no: 1,
    baslik: "Bir site oluştur",
    aciklama:
      "Siteler bölümünden yeni bir site ekle. Veylify sana bir public anahtar (pk_live_…) ve bir gizli anahtar (sk_live_…) üretir. Public anahtar widget'a, gizli anahtar backend doğrulamasına gider.",
    href: "/panel/siteler",
    hrefEtiket: "Siteler'e git",
    sure: "1 dk",
    ikon: "Globe",
  },
  {
    no: 2,
    baslik: "Widget'ı ekle",
    aciklama:
      "Formuna tek satır <script> ve bir <div class=\"veylify\" data-sitekey=\"…\"> koy. Widget, ghost-font challenge'ı Shadow DOM içinde otomatik monte eder ve gizli veylify-token alanını forma ekler.",
    href: "/panel/gelistirici",
    hrefEtiket: "Snippet'i al",
    sure: "3 dk",
    ikon: "Code",
  },
  {
    no: 3,
    baslik: "Test alanında dene",
    aciklama:
      "API Test Alanı'nda challenge → verify → siteverify akışını gerçek anahtarlarınla canlı çalıştır. Davranış skorunu ve dönen verification token'ı gör.",
    href: "/panel/test-alani",
    hrefEtiket: "Test Alanı'nı aç",
    sure: "2 dk",
    ikon: "FlaskConical",
  },
  {
    no: 4,
    baslik: "Backend doğrulamasını bağla ve canlıya al",
    aciklama:
      "Formu işleyen sunucunda /api/v1/siteverify'ı sk_live anahtarınla çağır. success:true dönerse isteği kabul et. pk_test'ten pk_live'a geçince koruman yayında.",
    href: "/panel/entegrasyonlar",
    hrefEtiket: "Entegrasyonlar",
    sure: "5 dk",
    ikon: "Rocket",
  },
];

/* ------------------------------------------------------------------ Rehber kategorileri */
export interface Kategori {
  key: string;
  ad: string;
  aciklama: string;
  ikon: string; // lucide adı
  makaleSayisi: number;
}

export const KATEGORILER: Kategori[] = [
  {
    key: "baslangic",
    ad: "Başlangıç",
    aciklama: "Veylify nedir, ghost-font CAPTCHA nasıl çalışır, hesap ve site kurulumu.",
    ikon: "Rocket",
    makaleSayisi: 3,
  },
  {
    key: "entegrasyon",
    ad: "Entegrasyon",
    aciklama: "Widget kurulumu, React/Vue/Angular bileşenleri ve backend siteverify.",
    ikon: "Code",
    makaleSayisi: 4,
  },
  {
    key: "kural-motoru",
    ad: "Kural Motoru",
    aciklama: "İlk kuralını yaz, koşul ve aksiyonlar, kural sırası ve öncelik.",
    ikon: "GitBranch",
    makaleSayisi: 2,
  },
  {
    key: "ai-ajan",
    ad: "AI Ajan Koruması",
    aciklama: "GPTBot, ClaudeBot ve diğer ajanları tespit et; izin/doğrula/engelle politikaları.",
    ikon: "Bot",
    makaleSayisi: 2,
  },
  {
    key: "webhook",
    ad: "Webhook & Entegrasyonlar",
    aciklama: "Olay webhook'ları, HMAC imza doğrulama, Slack/SIEM'e bağlama.",
    ikon: "Webhook",
    makaleSayisi: 2,
  },
  {
    key: "guvenlik",
    ad: "Güvenlik & Uyum",
    aciklama: "Anahtar yönetimi, KVKK/GDPR, erişilebilirlik (WCAG) ve görünmez mod.",
    ikon: "Shield",
    makaleSayisi: 2,
  },
  {
    key: "api",
    ad: "API Referansı",
    aciklama: "challenge, verify, passive, siteverify uçları; hata kodları ve rate limitler.",
    ikon: "FileText",
    makaleSayisi: 3,
  },
];

/* ------------------------------------------------------------------ Makaleler / rehberler */
export interface Makale {
  slug: string;
  baslik: string;
  ozet: string;
  kategori: string; // Kategori.key
  kategoriAd: string;
  zorluk: Zorluk;
  okuma: string; // "5 dk"
  onecikan?: boolean;
  /** Detay gövdesi: sıralı bloklar (paragraf / başlık / liste / not / kod). */
  govde: Blok[];
}

export type Blok =
  | { tip: "p"; metin: string }
  | { tip: "h"; metin: string }
  | { tip: "liste"; ogeler: string[] }
  | { tip: "not"; ton: "bilgi" | "sari" | "yesil"; baslik?: string; metin: string }
  | { tip: "kod"; dil: string; baslik?: string; kod: string };

export const MAKALELER: Makale[] = [
  {
    slug: "ghost-font-nasil-calisir",
    baslik: "Ghost-font CAPTCHA nasıl çalışır?",
    ozet:
      "Veylify'ın çekirdeği: kodu ekranda gösterip DOM'da ve ekran görüntüsünde görünmez bırakan temporal dithering tekniği.",
    kategori: "baslangic",
    kategoriAd: "Başlangıç",
    zorluk: "baslangic",
    okuma: "6 dk",
    onecikan: true,
    govde: [
      {
        tip: "p",
        metin:
          "Klasik CAPTCHA'lar kodu bir görsele yazar. Bir bot ekran görüntüsü alıp OCR ile okur ve geçer. Veylify bunu tersine çevirir: kod hiçbir zaman tek bir karede tam görünmez.",
      },
      { tip: "h", metin: "Temporal dithering" },
      {
        tip: "p",
        metin:
          "Widget, challenge'ı bir <canvas> üzerine çizer. Her karakter, birden fazla kare boyunca titreşen (dithered) piksellerden oluşur. İnsan gözü kareleri birleştirip kodu net okur; ama tek bir kareyi yakalayan bir ekran görüntüsü yalnızca gürültü içerir.",
      },
      {
        tip: "liste",
        ogeler: [
          "DOM'da metin yok — sayfa kaynağında veya erişilebilirlik ağacında kod bulunmaz.",
          "Tek kare = anlamsız gürültü, bu yüzden screenshot + OCR çalışmaz.",
          "Canvas Shadow DOM içinde izole; sayfanın CSS'i widget'ı etkilemez.",
        ],
      },
      { tip: "h", metin: "Davranış skoru ile birleşir" },
      {
        tip: "p",
        metin:
          "Kodun doğru girilmesi tek sinyal değildir. Widget fare hareketi, tuş zamanlaması ve gönderim süresi gibi davranış sinyallerini toplar ve 0–1 arası bir skor üretir. verify yanıtındaki score alanı budur.",
      },
      {
        tip: "not",
        ton: "bilgi",
        baslik: "Erişilebilirlik",
        metin:
          "Ghost-font'u göremeyen kullanıcılar için widget 🔊 sesli mod sunar: kod tonlarla çalınır. prefers-reduced-motion açıksa ses modu öne çıkarılır.",
      },
    ],
  },
  {
    slug: "ilk-sitenizi-olusturun",
    baslik: "İlk sitenizi oluşturun ve anahtarları anlayın",
    ozet:
      "pk_live / sk_live / whsec_ anahtarlarının farkı, nereye konur, hangisi gizli tutulur.",
    kategori: "baslangic",
    kategoriAd: "Başlangıç",
    zorluk: "baslangic",
    okuma: "4 dk",
    govde: [
      {
        tip: "p",
        metin:
          "Siteler bölümünden bir site oluşturduğunuzda Veylify üç tür anahtar üretir. Doğru anahtarı doğru yere koymak güvenliğin temelidir.",
      },
      {
        tip: "liste",
        ogeler: [
          "pk_live_… / pk_test_… — Site (public) anahtarı. Tarayıcıda, widget'ın data-sitekey'inde kullanılır. Herkese açık olması sorun değildir.",
          "sk_live_… / sk_test_… — Gizli anahtar. YALNIZCA backend'de /siteverify çağrısında kullanılır. Asla istemciye koymayın.",
          "whsec_… — Webhook secret. Gelen webhook'ların HMAC imzasını doğrulamak için kullanılır.",
        ],
      },
      {
        tip: "not",
        ton: "sari",
        baslik: "test vs live",
        metin:
          "Geliştirirken pk_test/sk_test kullanın — kotaya yazmaz, gerçek trafiği etkilemez. Canlıya alırken pk_live/sk_live'a geçin.",
      },
      {
        tip: "p",
        metin:
          "Anahtarlar sızarsa Geliştirici bölümünden döndürebilirsiniz (rotate). Gizli anahtarı ortam değişkeninde tutun, koda gömmeyin.",
      },
    ],
  },
  {
    slug: "widget-ekle-html",
    baslik: "Widget'ı bir HTML formuna ekleyin",
    ozet:
      "Tek <script> ve tek <div> ile ghost-font korumasını herhangi bir forma monte edin.",
    kategori: "entegrasyon",
    kategoriAd: "Entegrasyon",
    zorluk: "baslangic",
    okuma: "5 dk",
    onecikan: true,
    govde: [
      {
        tip: "p",
        metin:
          "Widget framework-siz çalışır. Sayfaya specter.js'i ekleyin ve korumak istediğiniz forma data-sitekey taşıyan bir .specter elemanı koyun. Widget onu otomatik bulup monte eder.",
      },
      {
        tip: "kod",
        dil: "html",
        baslik: "signup.html",
        kod: `<form method="POST" action="/signup">
  <input name="email" type="email" required />

  <!-- Widget buraya monte olur; gizli "veylify-token" alanini kendisi ekler -->
  <div class="veylify" data-sitekey="pk_live_xxxxxxxx" data-lang="tr"></div>

  <button type="submit">Kaydol</button>
</form>

<script src="https://veylify.com/veylify.js" async defer></script>`,
      },
      { tip: "h", metin: "Doğrulama olayını dinleyin" },
      {
        tip: "p",
        metin:
          "Doğrulama başarılı olduğunda widget, eleman üzerinde veylify-verified olayını yayınlar (bubbling). Örneğin gönder butonunu bu olayda etkinleştirebilirsiniz.",
      },
      {
        tip: "kod",
        dil: "javascript",
        kod: `document.querySelector(".veylify").addEventListener("veylify-verified", function (e) {
  console.log("Dogrulandi:", e.detail); // { success, token, score, ... }
  document.querySelector("button[type=submit]").disabled = false;
});`,
      },
      {
        tip: "not",
        ton: "bilgi",
        baslik: "data-* öznitelikleri",
        metin:
          "data-sitekey (zorunlu), data-lang (tr/en), data-response-field (gizli input adı, varsayılan veylify-token).",
      },
    ],
  },
  {
    slug: "backend-siteverify",
    baslik: "Backend'de token'ı /siteverify ile doğrulayın",
    ozet:
      "Güvenlik backend'den gelir: widget yalnızca istemci taraflıdır. Node örneğiyle token teyidi.",
    kategori: "entegrasyon",
    kategoriAd: "Entegrasyon",
    zorluk: "orta",
    okuma: "6 dk",
    onecikan: true,
    govde: [
      {
        tip: "p",
        metin:
          "Widget forma bir veylify-token yazar. Bu token'a güvenmeden önce backend'iniz onu gizli anahtarıyla /api/v1/siteverify'a sormalıdır. reCAPTCHA'nın siteverify muadilidir.",
      },
      {
        tip: "kod",
        dil: "javascript",
        baslik: "Express — signup handler",
        kod: `app.post("/signup", async (req, res) => {
  const token = req.body["veylify-token"];

  const r = await fetch("https://api.veylify.com/api/v1/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.SPECTER_SECRET, response: token }),
  });
  const data = await r.json();

  if (!data.success) {
    return res.status(400).json({ error: "dogrulama_basarisiz", codes: data["error-codes"] });
  }
  // Istege bagli: dusuk skoru ek incelemeye alin
  if (data.score < 0.5) console.warn("dusuk skor:", data.score);

  // ... kaydi olustur
  res.json({ ok: true });
});`,
      },
      {
        tip: "not",
        ton: "sari",
        baslik: "Kritik kural",
        metin:
          "sk_live anahtarını asla istemciye göndermeyin. siteverify çağrısı yalnızca sunucudan yapılmalıdır; aksi halde koruma anlamsızlaşır.",
      },
      {
        tip: "p",
        metin:
          "success:false döndüğünde error-codes dizisine bakın: invalid-input-response (bozuk token), timeout-or-duplicate (süresi dolmuş veya tekrar kullanılmış), invalid-input-secret (yanlış gizli anahtar).",
      },
    ],
  },
  {
    slug: "ilk-kuralinizi-yazin",
    baslik: "İlk kuralınızı yazın",
    ozet:
      "Kural motorunun mantığı: koşul → aksiyon. Bir ülkeyi doğrulamaya zorlayan basit bir kural.",
    kategori: "kural-motoru",
    kategoriAd: "Kural Motoru",
    zorluk: "orta",
    okuma: "5 dk",
    govde: [
      {
        tip: "p",
        metin:
          "Kural motoru her istek için sinyalleri (ülke, IP itibarı, davranış skoru, user-agent, yol) değerlendirir ve bir aksiyon uygular: allow (izin), challenge (doğrula), block (engelle) veya flag (işaretle).",
      },
      { tip: "h", metin: "Örnek: riskli skoru doğrulamaya zorla" },
      {
        tip: "liste",
        ogeler: [
          "Koşul: davranış skoru < 0.5",
          "Aksiyon: challenge (görünür ghost-font göster)",
          "Sonuç: şüpheli oturumlar CAPTCHA'yı çözmek zorunda kalır, temiz trafik akıcı geçer.",
        ],
      },
      {
        tip: "not",
        ton: "bilgi",
        baslik: "Sıra önemlidir",
        metin:
          "Kurallar yukarıdan aşağıya değerlendirilir; ilk eşleşen aksiyon uygulanır. Geniş engelleme kurallarını dar izin kurallarının altına koyun.",
      },
      {
        tip: "p",
        metin:
          "Hazır bir yapılandırmayla başlamak isterseniz Kural Pazarı'ndan sektörünüze uygun bir paketi tek tıkla kurabilir, sonra Kurallar sayfasından ince ayar yapabilirsiniz.",
      },
    ],
  },
  {
    slug: "gptbot-engelle",
    baslik: "GPTBot ve AI ajanlarını yönetin",
    ozet:
      "GPTBot, ClaudeBot, PerplexityBot gibi ajanları tespit edin; her biri için izin/doğrula/engelle politikası belirleyin.",
    kategori: "ai-ajan",
    kategoriAd: "AI Ajan Koruması",
    zorluk: "orta",
    okuma: "5 dk",
    onecikan: true,
    govde: [
      {
        tip: "p",
        metin:
          "Veylify, bilinen AI ajanlarını user-agent imzalarından tanır ve kategorilere ayırır (model eğitimi, arama, asistan). AI Ajan İstihbaratı bölümünde her ajanın trafiğini, engellenen/izin verilen oranını ve en çok vurduğu yolu görürsünüz.",
      },
      {
        tip: "liste",
        ogeler: [
          "İzin ver — ajanın içeriğinize erişmesine izin verin (ör. arama endeksleme).",
          "Doğrula — ajana challenge sunun; çoğu ajan çözemez, gerçek tarayıcılar geçer.",
          "Engelle — isteği tümüyle reddedin (ör. model eğitimi kazımasını durdurun).",
        ],
      },
      {
        tip: "not",
        ton: "yesil",
        baslik: "Öneri",
        metin:
          "İçeriğinizin izinsiz model eğitiminde kullanılmasını istemiyorsanız, kategori 'model_egitimi' olan ajanlar için varsayılan politikayı Engelle yapın; arama ajanlarını İzin ver'de bırakın.",
      },
    ],
  },
  {
    slug: "webhook-imza-dogrula",
    baslik: "Webhook imzasını doğrulayın",
    ozet:
      "Gelen webhook'ların gerçekten Veylify'dan geldiğini HMAC-SHA256 ile timing-safe olarak kanıtlayın.",
    kategori: "webhook",
    kategoriAd: "Webhook & Entegrasyonlar",
    zorluk: "ileri",
    okuma: "7 dk",
    govde: [
      {
        tip: "p",
        metin:
          "bot.blocked veya ai_agent.detected gibi bir olay olduğunda Veylify, kayıtlı endpoint'inize imzalı bir POST gönderir. X-Veylify-Signature başlığını doğrulamadan gövdeye güvenmeyin.",
      },
      {
        tip: "p",
        metin:
          "İmza formatı: t=<ts>,v1=<hmac>. HMAC, ham gövde baytları üzerinden hesaplanır: HMAC_SHA256(\"<ts>.<rawBody>\", whsec).",
      },
      {
        tip: "kod",
        dil: "javascript",
        baslik: "Express — raw body ile doğrulama",
        kod: `const crypto = require("crypto");

// ONEMLI: ham govdeyi alin (express.raw), JSON.parse'tan ONCE
app.post("/webhooks/specter", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.header("X-Veylify-Signature") || "";
  const [tPart, v1Part] = sig.split(",");
  const ts = tPart.replace("t=", "");
  const sent = v1Part.replace("v1=", "");

  // 1) Replay korumasi: 5 dakikadan eski imzalari reddet
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return res.status(400).end();

  // 2) Beklenen imzayi ham govde ile hesapla
  const expected = crypto
    .createHmac("sha256", process.env.SPECTER_WEBHOOK_SECRET)
    .update(ts + "." + req.body.toString("utf8"))
    .digest("hex");

  // 3) Timing-safe karsilastir
  const ok = crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
  if (!ok) return res.status(400).end();

  const event = JSON.parse(req.body.toString("utf8"));
  console.log("Dogrulanan olay:", event.type, event.data);
  res.status(200).end();
});`,
      },
      {
        tip: "not",
        ton: "sari",
        baslik: "Yaygın hata",
        metin:
          "İmzayı JSON'a çevirdikten sonra yeniden serialize edilmiş gövdeyle hesaplamayın; boşluk/anahtar sırası değişir ve imza tutmaz. Her zaman HAM baytları kullanın.",
      },
      {
        tip: "p",
        metin:
          "2xx dönene kadar Veylify üstel geri çekilmeyle en fazla 3 kez yeniden dener. Endpoint'iniz idempotent olmalı (aynı event.id iki kez gelebilir).",
      },
    ],
  },
  {
    slug: "gorunmez-mod",
    baslik: "Görünmez mod: kullanıcıyı hiç rahatsız etmeyin",
    ozet:
      "passive ucu ile temiz trafik CAPTCHA görmeden geçer; yalnızca şüpheli oturumlara challenge sunulur.",
    kategori: "guvenlik",
    kategoriAd: "Güvenlik & Uyum",
    zorluk: "orta",
    okuma: "4 dk",
    govde: [
      {
        tip: "p",
        metin:
          "Görünmez modda widget önce /api/v1/passive'i dener. Bu uç challenge GÖSTERMEDEN yalnızca davranış sinyalleri ve kural motoruyla karar verir.",
      },
      {
        tip: "liste",
        ogeler: [
          "passed:true → kullanıcı hiç CAPTCHA görmez, verification token doğrudan verilir.",
          "passed:false, reason:needs_challenge → widget görünür ghost-font'a düşer.",
        ],
      },
      {
        tip: "not",
        ton: "bilgi",
        baslik: "Denge",
        metin:
          "Görünmez mod sürtünmeyi sıfıra indirir ama riskli trafiği yakalamak için iyi ayarlanmış kurallara ve davranış eşiklerine dayanır. Denemeler bölümünde eşikleri A/B test edebilirsiniz.",
      },
    ],
  },
  {
    slug: "api-hata-kodlari",
    baslik: "API hata kodlarını ve rate limitleri anlayın",
    ozet:
      "verify reason değerleri, siteverify error-codes ve uç başına rate limitlerin tam listesi.",
    kategori: "api",
    kategoriAd: "API Referansı",
    zorluk: "ileri",
    okuma: "5 dk",
    govde: [
      { tip: "h", metin: "verify başarısızlık nedenleri" },
      {
        tip: "liste",
        ogeler: [
          "bad_answer — girilen kod yanlış.",
          "low_behavior_score — davranış skoru eşiğin altında.",
          "expired — challenge token'ının süresi doldu (ttl 120s).",
          "bad_signature — token imzası geçersiz (kurcalanmış).",
          "replay — token daha önce kullanılmış.",
          "rule_block — bir kural isteği engelledi.",
        ],
      },
      { tip: "h", metin: "siteverify error-codes" },
      {
        tip: "liste",
        ogeler: [
          "missing-input — secret veya response eksik (400).",
          "invalid-input-secret — gizli anahtar tanınmadı.",
          "invalid-input-response — token geçersiz/bozuk.",
          "timeout-or-duplicate — token süresi doldu veya tekrar kullanıldı.",
          "site-not-verified — alan adı sahipliği doğrulanmamış.",
        ],
      },
      {
        tip: "not",
        ton: "sari",
        baslik: "Rate limitler (site başına)",
        metin:
          "challenge 120/dk, verify 240/dk, passive 300/dk. Aylık kota aşımında ücretsiz plan 429 quota_exceeded döner; ücretli plan overage ile devam eder (X-Veylify-Quota: overage).",
      },
    ],
  },
];

/* ------------------------------------------------------------------ Kod kütüphanesi */
export interface KodOrnek {
  key: string;
  baslik: string;
  aciklama: string;
  dil: string;
  kod: string;
}

export const KOD_ORNEKLERI: KodOrnek[] = [
  {
    key: "html-widget",
    baslik: "HTML — widget montajı",
    aciklama: "Tek script + tek div. Widget gizli veylify-token alanını forma ekler.",
    dil: "html",
    kod: `<form method="POST" action="/signup">
  <input name="email" type="email" required />
  <div class="veylify" data-sitekey="pk_live_xxxxxxxx" data-lang="tr"></div>
  <button type="submit">Kaydol</button>
</form>
<script src="https://veylify.com/veylify.js" async defer></script>`,
  },
  {
    key: "react",
    baslik: "React — SpecterWidget bileşeni",
    aciklama: "specter.js'i bir kez yükler, elemanı render eder, veylify-verified olayını yakalar.",
    dil: "jsx",
    kod: `import { useEffect, useRef } from "react";

export function SpecterWidget({ siteKey, lang = "tr", onVerified }) {
  const ref = useRef(null);

  useEffect(() => {
    const id = "specter-sdk";
    const mount = () => window.Specter && window.Specter.render(ref.current);
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.src = "https://veylify.com/veylify.js";
      s.async = true; s.defer = true; s.onload = mount;
      document.body.appendChild(s);
    } else { mount(); }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onVerified) return;
    const h = (e) => onVerified(e.detail);
    el.addEventListener("veylify-verified", h);
    return () => el.removeEventListener("veylify-verified", h);
  }, [onVerified]);

  return <div ref={ref} className="specter" data-sitekey={siteKey} data-lang={lang} />;
}`,
  },
  {
    key: "node-siteverify",
    baslik: "Node.js — backend siteverify",
    aciklama: "Form gönderiminde token'ı gizli anahtarla teyit et. Güvenlik buradan gelir.",
    dil: "javascript",
    kod: `const token = req.body["veylify-token"];

const r = await fetch("https://api.veylify.com/api/v1/siteverify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secret: process.env.SPECTER_SECRET, response: token }),
});
const data = await r.json();

if (!data.success) {
  return res.status(400).json({ error: "dogrulama_basarisiz", codes: data["error-codes"] });
}
// data.score ile ek risk kararlari alabilirsiniz`,
  },
  {
    key: "python-siteverify",
    baslik: "Python — Flask siteverify",
    aciklama: "requests ile token doğrulama; başarısızsa isteği reddet.",
    dil: "python",
    kod: `import os, requests
from flask import request, jsonify

@app.post("/signup")
def signup():
    token = request.form.get("veylify-token")
    r = requests.post(
        "https://api.veylify.com/api/v1/siteverify",
        json={"secret": os.environ["SPECTER_SECRET"], "response": token},
        timeout=5,
    )
    data = r.json()
    if not data.get("success"):
        return jsonify(error="dogrulama_basarisiz", codes=data.get("error-codes")), 400
    # data["score"] ile risk kararlari
    return jsonify(ok=True)`,
  },
  {
    key: "curl-challenge",
    baslik: "cURL — ham challenge çağrısı",
    aciklama: "Widget bunu otomatik yapar; akışı elle görmek için.",
    dil: "bash",
    kod: `curl -X POST https://api.veylify.com/api/v1/challenge \\
  -H "Content-Type: application/json" \\
  -d '{"siteKey":"pk_live_xxxxxxxx"}'`,
  },
  {
    key: "webhook-verify",
    baslik: "Node.js — webhook HMAC doğrulama",
    aciklama: "Ham gövde + timing-safe karşılaştırma + 5 dk replay penceresi.",
    dil: "javascript",
    kod: `const crypto = require("crypto");

app.post("/webhooks/specter", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.header("X-Veylify-Signature") || "";
  const ts = (sig.split(",")[0] || "").replace("t=", "");
  const sent = (sig.split(",")[1] || "").replace("v1=", "");

  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return res.status(400).end();

  const expected = crypto
    .createHmac("sha256", process.env.SPECTER_WEBHOOK_SECRET)
    .update(ts + "." + req.body.toString("utf8"))
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected)))
    return res.status(400).end();

  const event = JSON.parse(req.body.toString("utf8"));
  // event.type: "bot.blocked" | "ai_agent.detected" | ...
  res.status(200).end();
});`,
  },
];

/* ------------------------------------------------------------------ Video ipuçları (placeholder kartlar) */
export interface VideoIpucu {
  key: string;
  baslik: string;
  aciklama: string;
  sure: string;
  seviye: Zorluk;
  ikon: string;
}

export const VIDEOLAR: VideoIpucu[] = [
  {
    key: "tur",
    baslik: "Veylify paneline hızlı tur",
    aciklama: "Genel Bakış'tan Kurallar'a; panelin tüm modüllerinde 3 dakikalık gezinti.",
    sure: "3:12",
    seviye: "baslangic",
    ikon: "PlayCircle",
  },
  {
    key: "widget-kur",
    baslik: "5 dakikada widget kurulumu",
    aciklama: "Site oluştur, snippet'i kopyala, formuna ekle ve ilk doğrulamayı gör.",
    sure: "5:04",
    seviye: "baslangic",
    ikon: "PlayCircle",
  },
  {
    key: "kural-yaz",
    baslik: "Kural motoruyla derinlemesine",
    aciklama: "Koşul/aksiyon mantığı, sıra, davranış eşikleri ve gerçek senaryolar.",
    sure: "8:47",
    seviye: "orta",
    ikon: "PlayCircle",
  },
  {
    key: "webhook",
    baslik: "Webhook'ları güvenli bağlama",
    aciklama: "HMAC imza doğrulama, Slack'e olay akışı ve idempotent işleme.",
    sure: "6:30",
    seviye: "ileri",
    ikon: "PlayCircle",
  },
];

/* ------------------------------------------------------------------ SSS */
export interface SSSOge {
  soru: string;
  cevap: string;
}

export const SSS: SSSOge[] = [
  {
    soru: "Veylify, reCAPTCHA'dan nasıl farklı?",
    cevap:
      "reCAPTCHA görsel bir kod gösterir; bir bot ekran görüntüsü alıp OCR ile çözebilir. Veylify'ın ghost-font'u temporal dithering kullanır — kod hiçbir tek karede tam görünmez ve DOM'da metin yoktur, bu yüzden screenshot+OCR saldırıları çalışmaz. Ayrıca /siteverify sözleşmesi reCAPTCHA'nınkiyle neredeyse aynı olduğundan geçiş kolaydır.",
  },
  {
    soru: "Widget'ı eklemek yeterli mi?",
    cevap:
      "Hayır. Widget yalnızca istemci taraflıdır ve bir veylify-token üretir. Gerçek güvenlik, backend'inizin bu token'ı gizli anahtarınızla /api/v1/siteverify'a teyit ettirmesinden gelir. siteverify çağrısı olmadan koruma atlatılabilir.",
  },
  {
    soru: "Kullanıcılar hiç CAPTCHA görmeden geçebilir mi?",
    cevap:
      "Evet. Görünmez modda widget önce /api/v1/passive'i dener; davranış skoru ve kurallar yeterse (passed:true) kullanıcı hiçbir challenge görmeden geçer. Yalnızca şüpheli oturumlar görünür ghost-font'a düşer.",
  },
  {
    soru: "GPTBot veya ClaudeBot gibi AI ajanlarını engelleyebilir miyim?",
    cevap:
      "Evet. AI Ajan İstihbaratı bölümünde bilinen ajanları user-agent imzasından tespit eder ve her biri için İzin ver / Doğrula / Engelle politikası belirlersiniz. Model eğitimi kategorisindeki ajanları engelleyip arama ajanlarına izin verebilirsiniz.",
  },
  {
    soru: "test ve live anahtarları arasındaki fark nedir?",
    cevap:
      "pk_test/sk_test geliştirme içindir: kotaya yazmaz ve gerçek trafiği etkilemez. Canlıya alırken pk_live/sk_live'a geçin. Anahtarları Geliştirici bölümünden yönetir, sızma durumunda döndürebilirsiniz.",
  },
  {
    soru: "Widget erişilebilir mi?",
    cevap:
      "Evet, WCAG uyumludur. Ghost-font'u göremeyenler için 🔊 sesli mod kodu tonlarla çalar; canvas role=\"img\" ve aria-label taşır, canlı-duyuru bölgeleri vardır. data-lang ile arayüz ve erişilebilirlik metinleri tr/en olarak uyarlanır.",
  },
  {
    soru: "Webhook'ların gerçekten Veylify'dan geldiğini nasıl bilirim?",
    cevap:
      "Her webhook X-Veylify-Signature başlığıyla gelir (t=<ts>,v1=<hmac>). HMAC-SHA256'yı whsec_ anahtarınızla ham gövde üzerinden hesaplayıp timing-safe karşılaştırın ve 5 dakikalık replay penceresini uygulayın. Detay için 'Webhook imzasını doğrulayın' rehberine bakın.",
  },
  {
    soru: "Rate limit veya kota aşarsam ne olur?",
    cevap:
      "Uç başına limitler site başınadır: challenge 120/dk, verify 240/dk, passive 300/dk. Aylık kota aşımında ücretsiz plan 429 quota_exceeded döner; ücretli planlar overage ile devam eder ve yanıt X-Veylify-Quota: overage başlığı taşır.",
  },
  {
    soru: "Bir kural neden beklediğim gibi tetiklenmiyor?",
    cevap:
      "Kurallar yukarıdan aşağıya değerlendirilir ve ilk eşleşen aksiyon uygulanır. Üstteki daha geniş bir kural isteği daha önce yakalıyor olabilir. Dar/özel izin kurallarını yukarı, geniş engelleme kurallarını aşağı taşıyın.",
  },
  {
    soru: "Hangi framework'leri destekliyor?",
    cevap:
      "Widget framework-siz çalışır; ayrıca React, Vue 3 ve Angular için hazır bileşen/direktif örnekleri vardır. Backend için Node, Python ve PHP SDK'ları ile ham REST örnekleri sunulur.",
  },
];
