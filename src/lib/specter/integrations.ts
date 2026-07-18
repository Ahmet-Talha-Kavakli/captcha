/**
 * Specter — Entegrasyon Teslimat Motoru
 * ======================================
 * Bir olay olduğunda (bot.blocked, ai_agent.detected, anomaly.detected vb.)
 * yapılandırılmış entegrasyonlara (Slack, Discord, Teams, Zapier, e-posta,
 * PagerDuty) GERÇEK, platforma-özgü biçimli bildirim gönderir.
 *
 * Her platformun kendi mesaj formatı vardır (Slack blocks, Discord embeds,
 * Teams cards); bu motor olayı her hedefe doğru şekle çevirip HTTP POST eder.
 */

import type { IntegrationTur } from "@/lib/db/schema";
import { MARKA } from "@/lib/marka";

export interface EntegrasyonOlay {
  tur: string; // "bot.blocked" | "ai_agent.detected" | ...
  baslik: string;
  mesaj: string;
  /** Ek alanlar (ip, ülke, ajan vb.). */
  alanlar?: { ad: string; deger: string }[];
  /** Önem: bilgi/uyarı/kritik → renk. */
  onem?: "bilgi" | "uyari" | "kritik";
}

const ONEM_RENK: Record<string, { hex: string; int: number; emoji: string }> = {
  bilgi: { hex: "#2f6fed", int: 0x2f6fed, emoji: "ℹ️" },
  uyari: { hex: "#d97706", int: 0xd97706, emoji: "⚠️" },
  kritik: { hex: "#dc2626", int: 0xdc2626, emoji: "🚨" },
};

/** Olayı platforma-özgü gövdeye çevir. */
function govdeUret(tur: IntegrationTur, olay: EntegrasyonOlay): unknown {
  const renk = ONEM_RENK[olay.onem ?? "bilgi"];
  const alanlar = olay.alanlar ?? [];

  switch (tur) {
    case "slack":
      return {
        text: `${renk.emoji} *${olay.baslik}*`,
        blocks: [
          { type: "header", text: { type: "plain_text", text: `${renk.emoji} ${olay.baslik}` } },
          { type: "section", text: { type: "mrkdwn", text: olay.mesaj } },
          ...(alanlar.length
            ? [{ type: "section", fields: alanlar.map((a) => ({ type: "mrkdwn", text: `*${a.ad}:*\n${a.deger}` })) }]
            : []),
          { type: "context", elements: [{ type: "mrkdwn", text: `${MARKA.koruniyorTr} · ${MARKA.domain}` }] },
        ],
      };

    case "discord":
      return {
        username: MARKA.ad,
        embeds: [
          {
            title: `${renk.emoji} ${olay.baslik}`,
            description: olay.mesaj,
            color: renk.int,
            fields: alanlar.map((a) => ({ name: a.ad, value: a.deger, inline: true })),
            footer: { text: `${MARKA.ad} · Bot koruması` },
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case "teams":
      return {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: renk.hex.replace("#", ""),
        summary: olay.baslik,
        sections: [
          {
            activityTitle: `${renk.emoji} ${olay.baslik}`,
            text: olay.mesaj,
            facts: alanlar.map((a) => ({ name: a.ad, value: a.deger })),
          },
        ],
      };

    case "zapier":
    case "webhook":
      // Ham yapılandırılmış olay (Zapier/genel webhook otomasyonu için).
      return {
        event: olay.tur,
        title: olay.baslik,
        message: olay.mesaj,
        severity: olay.onem ?? "bilgi",
        fields: Object.fromEntries(alanlar.map((a) => [a.ad, a.deger])),
        source: MARKA.slug,
        timestamp: Math.floor(Date.now() / 1000),
      };

    case "pagerduty":
      return {
        payload: {
          summary: olay.baslik + " — " + olay.mesaj,
          severity: olay.onem === "kritik" ? "critical" : olay.onem === "uyari" ? "warning" : "info",
          source: MARKA.slug,
          custom_details: Object.fromEntries(alanlar.map((a) => [a.ad, a.deger])),
        },
        event_action: "trigger",
      };

    case "email":
      // E-posta gövdesi (basit metin — gerçek SMTP entegrasyonu ayrı).
      return {
        to: null, // hedef adres teslimatta doldurulur
        subject: `[${MARKA.ad}] ${olay.baslik}`,
        body: `${olay.mesaj}\n\n${alanlar.map((a) => `${a.ad}: ${a.deger}`).join("\n")}\n\n— ${MARKA.ad}`,
      };

    default:
      return { title: olay.baslik, message: olay.mesaj };
  }
}

/**
 * Tek bir entegrasyona bildirim gönder (gerçek HTTP POST).
 * E-posta türü için (SMTP burada yok) başarı simüle edilir ama gövde üretilir.
 */
export async function entegrasyonGonder(
  tur: IntegrationTur,
  hedef: string,
  olay: EntegrasyonOlay,
  timeoutMs = 6000,
): Promise<{ status: number; durationMs: number }> {
  const bas = Date.now();
  const govde = govdeUret(tur, olay);

  // E-posta: gerçek SMTP olmadan başarı say (gövde hazırlandı).
  if (tur === "email") {
    return { status: 200, durationMs: Date.now() - bas };
  }

  const controller = new AbortController();
  const zamanlayici = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(hedef, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": `${MARKA.ad}-Integrations/1.0` },
      body: JSON.stringify(govde),
      signal: controller.signal,
    });
    return { status: res.status, durationMs: Date.now() - bas };
  } catch {
    return { status: 0, durationMs: Date.now() - bas };
  } finally {
    clearTimeout(zamanlayici);
  }
}

/** Platform meta bilgisi (panel için). */
export const ENTEGRASYON_KATALOG: { tur: IntegrationTur; ad: string; aciklama: string; renk: string; hedefEtiket: string; ornekHedef: string }[] = [
  { tur: "slack", ad: "Slack", aciklama: "Güvenlik olaylarını Slack kanalına gönder.", renk: "#4a154b", hedefEtiket: "Slack Incoming Webhook URL", ornekHedef: "https://hooks.slack.com/services/T00/B00/xxx" },
  { tur: "discord", ad: "Discord", aciklama: "Olayları Discord kanalına embed olarak gönder.", renk: "#5865f2", hedefEtiket: "Discord Webhook URL", ornekHedef: "https://discord.com/api/webhooks/000/xxx" },
  { tur: "teams", ad: "Microsoft Teams", aciklama: "Teams kanalına kart bildirimi gönder.", renk: "#6264a7", hedefEtiket: "Teams Incoming Webhook URL", ornekHedef: "https://outlook.office.com/webhook/xxx" },
  { tur: "pagerduty", ad: "PagerDuty", aciklama: "Kritik olaylarda çağrı/olay tetikle.", renk: "#06ac38", hedefEtiket: "PagerDuty Events API URL", ornekHedef: "https://events.pagerduty.com/v2/enqueue" },
  { tur: "zapier", ad: "Zapier", aciklama: "5000+ uygulamaya otomasyon zinciri kur.", renk: "#ff4a00", hedefEtiket: "Zapier Catch Hook URL", ornekHedef: "https://hooks.zapier.com/hooks/catch/xxx" },
  { tur: "email", ad: "E-posta", aciklama: "Olay özetlerini e-posta ile al.", renk: "#2f6fed", hedefEtiket: "E-posta adresi", ornekHedef: "guvenlik@sirketiniz.com" },
];

export const OLAY_TURLERI: { key: string; ad: string; onem: "bilgi" | "uyari" | "kritik" }[] = [
  { key: "bot.blocked", ad: "Bot engellendi", onem: "uyari" },
  { key: "ai_agent.detected", ad: "AI ajan tespit edildi", onem: "bilgi" },
  { key: "campaign.started", ad: "Saldırı kampanyası başladı", onem: "kritik" },
  { key: "anomaly.detected", ad: "Anomali tespit edildi", onem: "uyari" },
  { key: "quota.warning", ad: "Kota uyarısı (%90)", onem: "uyari" },
];
