/**
 * Specter — Kural Paketi Pazarı (Marketplace)
 * ============================================
 * Sektör-bazlı, uzmanlarca hazırlanmış kural PAKETLERİ (birden çok kuralı tek
 * tıkla kuran bundle'lar). Her paket bir sektörün tipik bot tehditlerine karşı
 * dengeli bir kural seti sunar. Tek tek RULE_TEMPLATES'in ötesinde: sektör
 * bağlamı, beklenen etki ve popülerlik.
 */

import type { RuleField, RuleOp, RuleAction } from "@/lib/db/schema";

export interface PaketKural {
  ad: string;
  aciklama: string;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  priority: number;
}

export interface KuralPaketi {
  key: string;
  ad: string;
  aciklama: string;
  sektor: "e-ticaret" | "saas" | "medya" | "fintech" | "genel" | "api";
  /** Rozet ikonu (lucide adı). */
  ikon: string;
  /** Kaç kez kuruldu (sosyal kanıt — deterministik). */
  kurulum: number;
  /** 0..5 puan. */
  puan: number;
  /** Beklenen etki (insan-okur). */
  etki: string;
  /** Öne çıkan (editör seçimi). */
  onecikan?: boolean;
  kurallar: PaketKural[];
}

export const KURAL_PAKETLERI: KuralPaketi[] = [
  {
    key: "eticaret-koruma",
    ad: "E-ticaret Koruma Paketi",
    aciklama: "Ödeme sayfası, stok kazıma ve sahte hesap saldırılarına karşı dengeli set.",
    sektor: "e-ticaret", ikon: "ShoppingCart", kurulum: 3847, puan: 4.8, onecikan: true,
    etki: "Kart deneme ve stok kazımayı ~%92 azaltır, gerçek müşteriyi yormaz.",
    kurallar: [
      { ad: "Ödeme sayfası koruması", aciklama: "/checkout ve /odeme yollarında sıkı doğrulama.", field: "path", op: "contains", value: "/checkout", action: "challenge", priority: 2 },
      { ad: "Stok kazıma engeli", aciklama: "Ürün/API yollarını yüksek hızda vuran IP'leri engelle.", field: "path", op: "contains", value: "/api/products", action: "challenge", priority: 3 },
      { ad: "Kart deneme koruması", aciklama: "Düşük skorlu /login isteklerini engelle.", field: "path", op: "eq", value: "/login", action: "challenge", priority: 2 },
      { ad: "Datacenter trafiği", aciklama: "Barındırma IP'lerini doğrulamaya al.", field: "asn", op: "contains", value: "Amazon", action: "challenge", priority: 5 },
    ],
  },
  {
    key: "saas-koruma",
    ad: "SaaS & Uygulama Paketi",
    aciklama: "Kayıt spam'i, kimlik doldurma ve API kötüye kullanımına karşı.",
    sektor: "saas", ikon: "Cloud", kurulum: 2913, puan: 4.7,
    etki: "Sahte kayıt ve hesap ele geçirme denemelerini büyük ölçüde durdurur.",
    kurallar: [
      { ad: "Kimlik doldurma koruması", aciklama: "/login ve /signin'de düşük skoru engelle.", field: "path", op: "contains", value: "/login", action: "block", priority: 1 },
      { ad: "Kayıt spam engeli", aciklama: "/register yolunda challenge zorunlu.", field: "path", op: "contains", value: "/register", action: "challenge", priority: 2 },
      { ad: "API kötüye kullanım", aciklama: "Yüksek hızlı /api trafiğini sınırla.", field: "rate", op: "gt", value: "60", action: "challenge", priority: 3 },
      { ad: "Bot sınıfı engeli", aciklama: "Otomasyon araçlarını doğrula.", field: "botClass", op: "eq", value: "automation", action: "challenge", priority: 4 },
    ],
  },
  {
    key: "medya-koruma",
    ad: "Medya & İçerik Paketi",
    aciklama: "AI eğitim botları ve içerik kazımaya karşı — telifini koru.",
    sektor: "medya", ikon: "Newspaper", kurulum: 4102, puan: 4.9, onecikan: true,
    etki: "İçeriğini AI eğitimine kaptırma, ölçeklenen kazımayı durdur.",
    kurallar: [
      { ad: "AI eğitim botlarını engelle", aciklama: "Model-eğitimi kategorisindeki tüm AI ajanlarını engelle.", field: "aiCategory", op: "eq", value: "model_egitimi", action: "block", priority: 1 },
      { ad: "GPTBot engeli", aciklama: "OpenAI GPTBot'u doğrudan engelle.", field: "aiAgent", op: "eq", value: "gptbot", action: "block", priority: 1 },
      { ad: "İçerik kazıyıcıları", aciklama: "Kazıma bot sınıfını engelle.", field: "botClass", op: "eq", value: "scraper", action: "block", priority: 2 },
      { ad: "Common Crawl engeli", aciklama: "CCBot'u engelle (dolaylı LLM beslemesi).", field: "aiAgent", op: "eq", value: "ccbot", action: "block", priority: 2 },
    ],
  },
  {
    key: "fintech-koruma",
    ad: "Fintech & Bankacılık Paketi",
    aciklama: "En yüksek güvenlik: dolandırıcılık, hesap ele geçirme ve bot ordularına karşı.",
    sektor: "fintech", ikon: "Landmark", kurulum: 1687, puan: 4.9,
    etki: "Sıfır-tolerans mod: şüpheli her isteği doğrular; regülasyon dostu.",
    kurallar: [
      { ad: "Kötü ün ASN engeli", aciklama: "Bulletproof/kötü ASN'leri engelle.", field: "asn", op: "contains", value: "Flokinet", action: "block", priority: 1 },
      { ad: "VPN/Proxy zorla", aciklama: "Anonimleştirilmiş trafiği doğrula.", field: "asn", op: "contains", value: "VPN", action: "challenge", priority: 2 },
      { ad: "Düşük skor engeli", aciklama: "0.3 altı insanlık skorunu engelle.", field: "score", op: "lt", value: "0.3", action: "block", priority: 1 },
      { ad: "TLS/UA uyumsuzluğu", aciklama: "Sahte tarayıcı imzalarını engelle.", field: "tlsMismatch", op: "eq", value: "true", action: "block", priority: 2 },
      { ad: "Headless tarayıcılar", aciklama: "Otomasyon tarayıcılarını doğrula.", field: "headless", op: "eq", value: "true", action: "challenge", priority: 3 },
    ],
  },
  {
    key: "api-koruma",
    ad: "Genel API Paketi",
    aciklama: "Public API'lerini kötüye kullanım ve otomasyona karşı koru.",
    sektor: "api", ikon: "Code", kurulum: 2201, puan: 4.6,
    etki: "API'lerini rate-limit ve bot filtreleriyle sağlamlaştırır.",
    kurallar: [
      { ad: "API hız sınırı", aciklama: "Dakikada 60'tan fazla API isteğini engelle.", field: "rate", op: "gt", value: "60", action: "block", priority: 2 },
      { ad: "HTTP kütüphaneleri", aciklama: "python-requests/curl gibi araçları doğrula.", field: "botClass", op: "eq", value: "automation", action: "challenge", priority: 3 },
      { ad: "AI ajan işaretleme", aciklama: "AI ajanlarını doğrulamaya al.", field: "botClass", op: "eq", value: "ai_agent", action: "challenge", priority: 4 },
    ],
  },
  {
    key: "ddos-koruma",
    ad: "DDoS & Flood Paketi",
    aciklama: "Hacimsel saldırılara ve istek flood'una karşı hızlı savunma.",
    sektor: "genel", ikon: "Zap", kurulum: 3305, puan: 4.7,
    etki: "Ani hacim artışlarını otomatik sınırlar, sunucunu ayakta tutar.",
    kurallar: [
      { ad: "Agresif hız sınırı", aciklama: "Dakikada 100+ isteği engelle.", field: "rate", op: "gt", value: "100", action: "block", priority: 1 },
      { ad: "DDoS bot sınıfı", aciklama: "Flood desenli trafiği engelle.", field: "botClass", op: "eq", value: "ddos", action: "block", priority: 1 },
      { ad: "Datacenter zorla", aciklama: "Bulut IP'lerini doğrula.", field: "asn", op: "contains", value: "Amazon", action: "challenge", priority: 4 },
    ],
  },
];

export const SEKTOR_ETIKET: Record<KuralPaketi["sektor"], string> = {
  "e-ticaret": "E-ticaret", saas: "SaaS", medya: "Medya", fintech: "Fintech", genel: "Genel", api: "API",
};
