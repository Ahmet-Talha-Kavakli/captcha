/**
 * Specter — E-posta Özet Motoru
 * ==============================
 * Bir hesabın haftalık güvenlik özetini (engellenen bot, AI ajan trafiği,
 * kampanyalar, koruma skoru, öne çıkan tehditler) toplayıp gönderime hazır
 * bir HTML e-posta gövdesi üretir. Bildirim tercihleriyle (User.notificationPrefs)
 * bağlıdır; gerçek gönderim ayrı bir SMTP katmanıyla yapılır (burada gövde
 * üretimi + tercih kontrolü).
 */

import { Events, Campaigns, Users } from "@/lib/db/db";
import { korumaOzeti } from "@/lib/ozet";
import { MARKA } from "@/lib/marka";

export interface OzetVeri {
  hafta: string;
  koruma: number;
  toplamIstek: number;
  engellenen: number;
  aiAjan: number;
  kritikOlay: number;
  ustUlke: { kod: string; sayi: number } | null;
  aktifKampanya: number;
}

/** Bir hesabın son 7 günlük güvenlik özet verisini topla. */
export function ozetVeriToparla(ownerId: string): OzetVeri {
  const events = Events.forOwner(ownerId, 4000);
  const gun7 = Date.now() - 7 * 864e5;
  const son7 = events.filter((e) => e.ts >= gun7);
  const engellenen = son7.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
  const aiAjan = son7.filter((e) => e.botClass === "ai_agent").length;
  const ozet = korumaOzeti(ownerId);

  // En çok saldıran ülke
  const ulke: Record<string, number> = {};
  for (const e of son7) if (e.verdict === "blocked") ulke[e.country] = (ulke[e.country] || 0) + 1;
  const ustUlkeGiris = Object.entries(ulke).sort((a, b) => b[1] - a[1])[0];

  const kampanyalar = Campaigns.forOwner(ownerId).filter((c) => c.status === "active");

  return {
    hafta: yeniTarih(),
    koruma: ozet.skor,
    toplamIstek: son7.length,
    engellenen,
    aiAjan,
    kritikOlay: ozet.kritikUyari,
    ustUlke: ustUlkeGiris ? { kod: ustUlkeGiris[0], sayi: ustUlkeGiris[1] } : null,
    aktifKampanya: kampanyalar.length,
  };
}

function yeniTarih(): string {
  // buildSeed/testler Date.now() kullanır; burada ISO haftası basitçe tarih.
  const d = new Date();
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Özet veriden gönderime hazır HTML e-posta gövdesi üret. Inline CSS
 * (e-posta istemcileri harici stil desteklemez), marka renkleri.
 */
export function digestHtmlUret(ad: string, veri: OzetVeri): string {
  const kart = (etiket: string, deger: string, renk: string) =>
    `<td style="padding:16px;background:#faf9f4;border:1px solid #e6e1d5;border-radius:12px;text-align:center;">
       <div style="font-size:26px;font-weight:700;color:${renk};line-height:1;">${deger}</div>
       <div style="font-size:12px;color:#6b6a63;margin-top:6px;">${etiket}</div>
     </td>`;

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:12px 0 20px;">
      <span style="display:inline-flex;align-items:center;gap:8px;font-size:20px;font-weight:800;color:#1a1a18;">
        <span style="display:inline-block;width:28px;height:28px;background:#1c1b19;border-radius:8px;"></span> ${MARKA.ad}
      </span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6e1d5;border-radius:20px;padding:28px;">
      <h1 style="margin:0 0 4px;font-size:22px;color:#1a1a18;">Haftalık güvenlik özeti</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b6a63;">Merhaba ${ad}, ${veri.hafta} itibarıyla sitelerin böyle korundu:</p>

      <table width="100%" cellspacing="8" cellpadding="0" style="border-collapse:separate;">
        <tr>
          ${kart("Koruma skoru", `${veri.koruma}/100`, "#2f6fed")}
          ${kart("Engellenen tehdit", veri.engellenen.toLocaleString("tr-TR"), "#dc2626")}
        </tr>
        <tr>
          ${kart("AI ajan trafiği", veri.aiAjan.toLocaleString("tr-TR"), "#d97706")}
          ${kart("Toplam istek", veri.toplamIstek.toLocaleString("tr-TR"), "#1a1a18")}
        </tr>
      </table>

      ${veri.aktifKampanya > 0 || veri.kritikOlay > 0
      ? `<div style="margin-top:20px;padding:14px;background:#fee2e2;border-radius:12px;color:#dc2626;font-size:14px;">
           ⚠️ ${veri.aktifKampanya} aktif kampanya ve ${veri.kritikOlay} kritik uyarı var. Panelden inceleyin.
         </div>`
      : `<div style="margin-top:20px;padding:14px;background:#dcfce7;border-radius:12px;color:#16803c;font-size:14px;">
           ✓ Bu hafta kritik bir olay yaşanmadı. Koruman sorunsuz çalıştı.
         </div>`}

      ${veri.ustUlke
      ? `<p style="margin:16px 0 0;font-size:13px;color:#6b6a63;">En çok engellenen kaynak: <b>${veri.ustUlke.kod}</b> (${veri.ustUlke.sayi} istek).</p>`
      : ""}

      <a href="${MARKA.url}/panel" style="display:inline-block;margin-top:22px;background:#1c1b19;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;">Panele git →</a>
    </div>
    <p style="text-align:center;margin:18px 0 0;font-size:12px;color:#9c9a90;">
      ${MARKA.ad} · AI botlarına karşı ghost-font koruması<br/>
      Bu özeti almak istemiyorsan bildirim tercihlerinden kapatabilirsin.
    </p>
  </div></body></html>`;
}

/**
 * Kullanıcının haftalık özet e-postası ist+ istemediğini kontrol et.
 * notificationPrefs varsa "haftalik" olayının email kanalına bakar.
 */
export function digestIstiyorMu(ownerId: string): boolean {
  const u = Users.byId(ownerId);
  const prefs = u?.notificationPrefs;
  if (!prefs) return true; // varsayılan: açık
  // prefs yapısı: { [olay]: { email, webhook, panel } } — esnek okuma.
  const p = prefs as unknown as Record<string, { email?: boolean } | undefined>;
  const haftalik = p["haftalik"] ?? p["ozet"] ?? p["weekly"];
  return haftalik?.email !== false;
}

/** Bir hesap için tam özet e-postasını üret (gövde + alıcı + gönderilmeli mi). */
export function digestHazirla(ownerId: string): { gonder: boolean; alici: string; konu: string; html: string } | null {
  const u = Users.byId(ownerId);
  if (!u) return null;
  const veri = ozetVeriToparla(ownerId);
  return {
    gonder: digestIstiyorMu(ownerId),
    alici: u.email,
    konu: `[${MARKA.ad}] Haftalık güvenlik özeti — ${veri.engellenen.toLocaleString("tr-TR")} tehdit engellendi`,
    html: digestHtmlUret(u.name, veri),
  };
}
