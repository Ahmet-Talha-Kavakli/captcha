/**
 * Specter — Hazır Kural Şablonları
 * Sık kullanılan güvenlik kurallarını tek tıkla eklemek için.
 */
import type { RuleField, RuleOp, RuleAction } from "@/lib/db/schema";

export interface RuleTemplate {
  key: string;
  name: string;
  description: string;
  kategori: "bot" | "cografya" | "hiz" | "ag" | "ai";
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  priority: number;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    key: "block-vpn",
    name: "VPN & anonim ağları engelle",
    description: "Bilinen VPN/proxy ASN'lerinden gelen istekleri challenge'a tabi tut.",
    kategori: "ag",
    field: "asn", op: "contains", value: "VPN", action: "challenge", priority: 5,
  },
  {
    key: "block-datacenter",
    name: "Veri merkezi trafiğini zorla",
    description: "AWS/DigitalOcean/Hetzner gibi barındırma IP'lerini doğrulamaya al.",
    kategori: "ag",
    field: "asn", op: "contains", value: "Amazon", action: "challenge", priority: 6,
  },
  {
    key: "ai-agents",
    name: "AI ajanlarını işaretle",
    description: "GPTBot/ClaudeBot gibi AI ajan trafiğini tespit et ve doğrula.",
    kategori: "bot", field: "botClass", op: "eq", value: "ai_agent", action: "challenge", priority: 3,
  },
  {
    key: "credential-stuffing",
    name: "Kimlik doldurma koruması",
    description: "/login yolunda düşük skorlu otomasyonu engelle.",
    kategori: "bot", field: "path", op: "eq", value: "/login", action: "challenge", priority: 4,
  },
  {
    key: "rate-limit",
    name: "Hız sınırı (agresif)",
    description: "Dakikada 60'tan fazla istek atan IP'leri engelle.",
    kategori: "hiz", field: "rate", op: "gt", value: "60", action: "block", priority: 2,
  },
  {
    key: "low-score",
    name: "Çok düşük skoru engelle",
    description: "İnsanlık skoru 0.15'in altındaki istekleri doğrudan engelle.",
    kategori: "bot", field: "score", op: "lt", value: "0.15", action: "block", priority: 1,
  },
  {
    key: "geo-high-risk",
    name: "Yüksek riskli coğrafya",
    description: "Yoğun bot kaynağı ülkelerden gelen trafiği doğrula.",
    kategori: "cografya", field: "country", op: "in", value: "RU,CN,VN", action: "challenge", priority: 7,
  },
  {
    key: "allow-good-bots",
    name: "İyi botlara izin ver",
    description: "Googlebot/Bingbot gibi meşru tarayıcıları engelleme.",
    kategori: "bot", field: "botClass", op: "eq", value: "good_bot", action: "allow", priority: 0,
  },

  /* ------------------------------------------------------------------ AI-ajan spesifik şablonlar (v13) */
  {
    key: "block-gptbot",
    name: "GPTBot'u engelle",
    description: "OpenAI GPTBot'un içeriğinizi model eğitimi için toplamasını engeller.",
    kategori: "ai", field: "aiAgent", op: "eq", value: "gptbot", action: "block", priority: 2,
  },
  {
    key: "block-training-bots",
    name: "Tüm model-eğitimi botlarını engelle",
    description: "GPTBot/ClaudeBot/Google-Extended vb. eğitim amaçlı tüm AI ajanlarını engeller.",
    kategori: "ai", field: "aiCategory", op: "eq", value: "model_egitimi", action: "block", priority: 2,
  },
  {
    key: "challenge-headless",
    name: "Headless tarayıcıları doğrula",
    description: "Puppeteer/Playwright/HeadlessChrome imzalı otonom ajanları doğrulamaya alır.",
    kategori: "ai", field: "headless", op: "eq", value: "true", action: "challenge", priority: 3,
  },
  {
    key: "block-tls-mismatch",
    name: "TLS/UA uyumsuzluğunu engelle",
    description: "UA tarayıcı iddiasında ama TLS parmak izi araç olan (UA taklidi) istekleri engeller.",
    kategori: "ai", field: "tlsMismatch", op: "eq", value: "true", action: "block", priority: 1,
  },
  {
    key: "allow-live-fetch",
    name: "AI canlı-getirme botlarına izin ver",
    description: "ChatGPT-User/Claude-User gibi kullanıcı kaynaklı canlı getirme ajanlarına izin verir.",
    kategori: "ai", field: "aiCategory", op: "eq", value: "canli_getirme", action: "allow", priority: 4,
  },
];

export const KATEGORI_ETIKET: Record<string, string> = {
  bot: "Bot koruması", cografya: "Coğrafya", hiz: "Hız sınırı", ag: "Ağ / ASN", ai: "AI ajanı",
};
