/**
 * Specter — AI Ajan İstihbarat Veritabanı
 * ========================================
 * Ürünün ANA vaadi: "siteleri yapay zekadan koru". Bu dosya, internetteki
 * bilinen AI crawler / ajan / veri-kazıma botlarının gerçek imza kataloğudur.
 * Panel (AI Ajan İstihbaratı modülü), kural motoru ve widget bu veriyi kullanır.
 *
 * Her kayıt gerçek bir AI operatörünün ilan ettiği User-Agent, doğrulama
 * yöntemi, robots.txt token'ı, amacı ve Specter'ın önerdiği varsayılan
 * politikayı içerir. Bilgiler kamuya açık dokümantasyona dayanır.
 */

export type AiKategori =
  | "model_egitimi" // sayfaları LLM eğitimi için toplar
  | "canli_getirme" // kullanıcı sorusuna cevaben canlı sayfa çeker (RAG)
  | "arama_indeksi" // AI arama motoru indeksleme
  | "ajan_tarayici" // otonom ajan / browser-use / operator
  | "veri_kaziyici"; // ticari veri kazıma

export type AiPolitika = "izin" | "dogrula" | "engelle";

export interface AiAjan {
  id: string;
  operator: string; // OpenAI, Anthropic, Google...
  urun: string; // GPTBot, ClaudeBot...
  ua: string; // ilan edilen User-Agent imzası
  uaEslesme: string[]; // UA içinde aranacak alt-dizeler (küçük harf)
  kategori: AiKategori;
  amac: string; // ne için tarıyor
  robotsToken: string; // robots.txt'te kullanılan token
  dogrulama: "ip_aralik" | "reverse_dns" | "yok"; // kimlik doğrulama yöntemi
  ipYayin?: string; // resmi IP aralığı yayını (varsa)
  saygiRobots: boolean; // robots.txt'e uyduğunu ilan ediyor mu
  risk: "dusuk" | "orta" | "yuksek" | "kritik"; // içerik sahibi için risk
  onerilenPolitika: AiPolitika;
  aciklama: string; // Specter'ın notu / neden bu politika
  logo: string; // operator marka rengi (hex) — rozet için
  ilk: string; // ilk görülme (yıl)
}

export const AI_AJANLAR: AiAjan[] = [
  {
    id: "gptbot",
    operator: "OpenAI",
    urun: "GPTBot",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
    uaEslesme: ["gptbot"],
    kategori: "model_egitimi",
    amac: "Web içeriğini gelecek GPT modellerinin eğitimi için toplar.",
    robotsToken: "GPTBot",
    dogrulama: "ip_aralik",
    ipYayin: "https://openai.com/gptbot-ranges.txt",
    saygiRobots: true,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "İçeriğiniz izniniz olmadan model eğitiminde kullanılabilir. Telif/özgün içerik siteleri için engelleme önerilir.",
    logo: "#10a37f",
    ilk: "2023",
  },
  {
    id: "oai-searchbot",
    operator: "OpenAI",
    urun: "OAI-SearchBot",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
    uaEslesme: ["oai-searchbot"],
    kategori: "arama_indeksi",
    amac: "ChatGPT Search sonuçlarında sitenizi göstermek için indeksler.",
    robotsToken: "OAI-SearchBot",
    dogrulama: "ip_aralik",
    saygiRobots: true,
    risk: "dusuk",
    onerilenPolitika: "izin",
    aciklama: "Arama görünürlüğü sağlar; trafik kazandırabilir. Genelde izin önerilir.",
    logo: "#10a37f",
    ilk: "2024",
  },
  {
    id: "chatgpt-user",
    operator: "OpenAI",
    urun: "ChatGPT-User",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    uaEslesme: ["chatgpt-user"],
    kategori: "canli_getirme",
    amac: "Kullanıcı ChatGPT'de bir bağlantıyı açtığında sayfayı canlı çeker.",
    robotsToken: "ChatGPT-User",
    dogrulama: "ip_aralik",
    saygiRobots: true,
    risk: "orta",
    onerilenPolitika: "dogrula",
    aciklama: "Gerçek kullanıcı isteğini temsil eder ama otomasyondur. Hız sınırı + doğrulama önerilir.",
    logo: "#10a37f",
    ilk: "2024",
  },
  {
    id: "claudebot",
    operator: "Anthropic",
    urun: "ClaudeBot",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +https://anthropic.com/claudebot",
    uaEslesme: ["claudebot", "anthropic-ai"],
    kategori: "model_egitimi",
    amac: "Claude modellerinin eğitimi için web içeriği toplar.",
    robotsToken: "ClaudeBot",
    dogrulama: "ip_aralik",
    ipYayin: "https://docs.anthropic.com/claude/docs/claudebot",
    saygiRobots: true,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "Model eğitimi amaçlı. Özgün içerik için engelleme önerilir.",
    logo: "#d97757",
    ilk: "2023",
  },
  {
    id: "claude-user",
    operator: "Anthropic",
    urun: "Claude-User",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Claude-User/1.0; +https://anthropic.com",
    uaEslesme: ["claude-user", "claude-web"],
    kategori: "canli_getirme",
    amac: "Claude kullanıcısının paylaştığı bağlantıyı canlı getirir (RAG).",
    robotsToken: "Claude-User",
    dogrulama: "ip_aralik",
    saygiRobots: true,
    risk: "orta",
    onerilenPolitika: "dogrula",
    aciklama: "Kullanıcı kaynaklı canlı getirme. Doğrulama + hız sınırı önerilir.",
    logo: "#d97757",
    ilk: "2024",
  },
  {
    id: "google-extended",
    operator: "Google",
    urun: "Google-Extended",
    ua: "Googlebot türevi (Gemini/Vertex eğitim kontrolü — robots token'ı)",
    uaEslesme: ["google-extended"],
    kategori: "model_egitimi",
    amac: "Gemini / Vertex AI eğitiminde içerik kullanımını kontrol eden token.",
    robotsToken: "Google-Extended",
    dogrulama: "reverse_dns",
    saygiRobots: true,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "Googlebot'tan ayrı token; engellemek arama sıralamanızı ETKİLEMEZ ama AI eğitimini durdurur.",
    logo: "#4285f4",
    ilk: "2023",
  },
  {
    id: "perplexitybot",
    operator: "Perplexity",
    urun: "PerplexityBot",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot",
    uaEslesme: ["perplexitybot"],
    kategori: "arama_indeksi",
    amac: "Perplexity AI arama motoru için sayfaları indeksler.",
    robotsToken: "PerplexityBot",
    dogrulama: "ip_aralik",
    saygiRobots: true,
    risk: "orta",
    onerilenPolitika: "dogrula",
    aciklama: "Kaynak göstererek trafik yollar ama içeriği özetler. Politika içerik türüne göre.",
    logo: "#20808d",
    ilk: "2024",
  },
  {
    id: "perplexity-user",
    operator: "Perplexity",
    urun: "Perplexity-User",
    ua: "Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai)",
    uaEslesme: ["perplexity-user"],
    kategori: "canli_getirme",
    amac: "Kullanıcı sorgusuna cevaben canlı sayfa getirir.",
    robotsToken: "Perplexity-User",
    dogrulama: "yok",
    saygiRobots: false,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "robots.txt'i yok saydığı raporlandı; UA taklidi riski yüksek. Sıkı doğrulama/engelleme önerilir.",
    logo: "#20808d",
    ilk: "2024",
  },
  {
    id: "bytespider",
    operator: "ByteDance",
    urun: "Bytespider",
    ua: "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
    uaEslesme: ["bytespider"],
    kategori: "model_egitimi",
    amac: "ByteDance/TikTok AI modelleri için agresif içerik toplama.",
    robotsToken: "Bytespider",
    dogrulama: "yok",
    saygiRobots: false,
    risk: "kritik",
    onerilenPolitika: "engelle",
    aciklama: "Çok agresif tarama, robots.txt'i sıkça yok sayar. Sunucu yükü riski. Engelleme kuvvetle önerilir.",
    logo: "#000000",
    ilk: "2023",
  },
  {
    id: "ccbot",
    operator: "Common Crawl",
    urun: "CCBot",
    ua: "CCBot/2.0 (https://commoncrawl.org/faq/)",
    uaEslesme: ["ccbot"],
    kategori: "veri_kaziyici",
    amac: "Açık veri kümesi; birçok LLM'in eğitim verisi buradan gelir.",
    robotsToken: "CCBot",
    dogrulama: "yok",
    saygiRobots: true,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "Doğrudan model değil ama arşivi tüm LLM eğitiminin dolaylı kaynağı. Engellemek dolaylı korur.",
    logo: "#1a1a18",
    ilk: "2016",
  },
  {
    id: "amazonbot",
    operator: "Amazon",
    urun: "Amazonbot",
    ua: "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)",
    uaEslesme: ["amazonbot"],
    kategori: "model_egitimi",
    amac: "Alexa / Amazon AI hizmetleri için içerik toplama.",
    robotsToken: "Amazonbot",
    dogrulama: "reverse_dns",
    saygiRobots: true,
    risk: "orta",
    onerilenPolitika: "dogrula",
    aciklama: "Orta risk; reverse DNS ile doğrulanabilir.",
    logo: "#ff9900",
    ilk: "2018",
  },
  {
    id: "meta-externalagent",
    operator: "Meta",
    urun: "meta-externalagent",
    ua: "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
    uaEslesme: ["meta-externalagent", "facebookbot", "meta-externalfetcher"],
    kategori: "model_egitimi",
    amac: "Llama modelleri ve Meta AI ürünleri için içerik toplama.",
    robotsToken: "meta-externalagent",
    dogrulama: "reverse_dns",
    saygiRobots: true,
    risk: "yuksek",
    onerilenPolitika: "engelle",
    aciklama: "Llama eğitimi. Özgün içerik için engelleme önerilir.",
    logo: "#0064e0",
    ilk: "2024",
  },
  {
    id: "cohere-ai",
    operator: "Cohere",
    urun: "cohere-ai",
    ua: "cohere-ai (+https://cohere.com)",
    uaEslesme: ["cohere-ai", "cohere-training-data-crawler"],
    kategori: "model_egitimi",
    amac: "Cohere kurumsal LLM'leri için içerik toplama.",
    robotsToken: "cohere-ai",
    dogrulama: "yok",
    saygiRobots: true,
    risk: "orta",
    onerilenPolitika: "dogrula",
    aciklama: "Kurumsal model eğitimi; orta hacim.",
    logo: "#39594c",
    ilk: "2023",
  },
  {
    id: "operator-agent",
    operator: "Otonom Ajanlar",
    urun: "Browser-use / Operator sınıfı",
    ua: "HeadlessChrome / Playwright / Puppeteer imzalı otonom ajan",
    uaEslesme: ["headlesschrome", "playwright", "puppeteer", "browser-use", "operator"],
    kategori: "ajan_tarayici",
    amac: "LLM güdümlü otonom ajanlar; form doldurur, satın alır, kazır.",
    robotsToken: "(yok — headless imza)",
    dogrulama: "yok",
    saygiRobots: false,
    risk: "kritik",
    onerilenPolitika: "engelle",
    aciklama: "İnsan taklidi yapan en tehlikeli sınıf. Ghost-font + davranış analizi burada devreye girer — asıl savunma hattımız.",
    logo: "#7c3aed",
    ilk: "2024",
  },
];

/** UA dizesinden AI ajanı tespit et (küçük harfe çevrilmiş UA bekler). */
export function aiAjanTespit(uaLower: string): AiAjan | null {
  for (const a of AI_AJANLAR) {
    if (a.uaEslesme.some((e) => uaLower.includes(e))) return a;
  }
  return null;
}

export const AI_KATEGORI_ETIKET: Record<AiKategori, string> = {
  model_egitimi: "Model eğitimi",
  canli_getirme: "Canlı getirme",
  arama_indeksi: "Arama indeksi",
  ajan_tarayici: "Otonom ajan",
  veri_kaziyici: "Veri kazıyıcı",
};

export const AI_POLITIKA_ETIKET: Record<AiPolitika, string> = {
  izin: "İzin ver",
  dogrula: "Doğrula",
  engelle: "Engelle",
};

export const RISK_ETIKET: Record<AiAjan["risk"], string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
  kritik: "Kritik",
};

/**
 * Kullanıcının AI-ajan politikalarından GERÇEK, standartlara uygun bir
 * robots.txt üretir. Ayrıştırıcı özellik: panelde tek tıkla verilen kararlar
 * (izin/doğrula/engelle) siteye konulabilen gerçek bir dosyaya dönüşür.
 *
 *  - "engelle"  → Disallow: /            (o AI ajanı hiçbir yola giremez)
 *  - "dogrula"  → Disallow: korumalı yollar (hassas alanlar hariç açık)
 *  - "izin"     → Allow: /               (tam erişim)
 *
 * Politika belirtilmeyen ajanlar için ajanın `onerilenPolitika`'sı kullanılır.
 * robots.txt "nazik istek"tir; Veylify ayrıca AKTİF olarak engeller (robots'a
 * uymayan AI'ları verify/passive akışında yakalar) — iki katmanlı savunma.
 */
export function aiRobotsUret(
  aiPolicies: Record<string, string> | undefined,
  opts?: { korumaliYollar?: string[]; siteUrl?: string },
): string {
  const korumali = opts?.korumaliYollar?.length
    ? opts.korumaliYollar
    : ["/admin", "/api", "/hesap", "/checkout", "/login", "/wp-admin"];

  const satirlar: string[] = [
    "# Veylify — AI ajan erişim politikası",
    "# Panelde belirlenen kararlardan otomatik üretildi.",
    "# robots.txt naziktir; Veylify uymayan AI'ları ayrıca AKTİF engeller.",
    "",
  ];

  for (const a of AI_AJANLAR) {
    const pol = (aiPolicies?.[a.id] as AiPolitika) || a.onerilenPolitika;
    satirlar.push(`User-agent: ${a.robotsToken}`);
    if (pol === "engelle") {
      satirlar.push("Disallow: /");
    } else if (pol === "dogrula") {
      for (const y of korumali) satirlar.push(`Disallow: ${y}`);
      satirlar.push("Allow: /");
    } else {
      satirlar.push("Allow: /");
    }
    satirlar.push("");
  }

  // Bilinmeyen tüm diğer botlar için varsayılan (hassas alanlar korumalı).
  satirlar.push("User-agent: *");
  for (const y of korumali) satirlar.push(`Disallow: ${y}`);
  satirlar.push("");

  if (opts?.siteUrl) {
    satirlar.push(`Sitemap: ${opts.siteUrl.replace(/\/$/, "")}/sitemap.xml`);
  }

  return satirlar.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Politika özeti: kaç ajan izin/doğrula/engelle (panel rozetleri için). */
export function aiPolitikaOzet(
  aiPolicies: Record<string, string> | undefined,
): { izin: number; dogrula: number; engelle: number } {
  const o = { izin: 0, dogrula: 0, engelle: 0 };
  for (const a of AI_AJANLAR) {
    const pol = (aiPolicies?.[a.id] as AiPolitika) || a.onerilenPolitika;
    o[pol]++;
  }
  return o;
}
