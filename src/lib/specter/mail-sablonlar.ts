import "server-only";
import { MARKA } from "@/lib/marka";

/**
 * Marka-tutarlı e-posta HTML şablonları (tablo-tabanlı, e-posta istemcileri
 * için güvenli inline stil). Tüm şablonlar `kabuk()` ile sarılır.
 */

function kabuk(baslik: string, govde: string): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a18;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6e1d5;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 32px 12px;">
          <span style="font-size:18px;font-weight:700;color:#1a1a18;">🦉 ${MARKA.ad}</span>
        </td></tr>
        <tr><td style="padding:0 32px 8px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#1a1a18;">${baslik}</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;font-size:14px;line-height:1.6;color:#4a4640;">
          ${govde}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f0ece3;font-size:12px;color:#9c9a90;">
          ${MARKA.ad} · ${MARKA.sloganTr}<br>
          <a href="${MARKA.url}" style="color:#2f6fed;text-decoration:none;">${MARKA.domain}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buton(metin: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr><td style="border-radius:10px;background:#2f6fed;">
    <a href="${url}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${metin}</a>
  </td></tr></table>`;
}

/** Kayıt hoşgeldin maili. */
export function hosgeldinMail(ad: string): { konu: string; html: string; metin: string } {
  const govde = `
    <p>Merhaba ${ad},</p>
    <p><strong>${MARKA.ad}</strong>'e hoş geldin! Artık sitelerini AI botlarına ve otomasyona karşı
    ghost-font teknolojisiyle koruyabilirsin — insan gözünün okuduğu, OCR'ın kör kaldığı bir katman.</p>
    <p>İlk siteni ekleyip widget'ı entegre etmek 10 dakikadan az sürer:</p>
    ${buton("Panele git", `${MARKA.url}/panel`)}
    <p style="color:#9c9a90;font-size:13px;">Bir sorun olursa bu e-postayı yanıtlaman yeterli.</p>`;
  return {
    konu: `${MARKA.ad}'e hoş geldin, ${ad} 🦉`,
    html: kabuk("Hesabın hazır", govde),
    metin: `Merhaba ${ad}, ${MARKA.ad}'e hoş geldin! Panel: ${MARKA.url}/panel`,
  };
}

/** Hesap askıya alındı bilgilendirmesi. */
export function askiMail(ad: string, neden: string): { konu: string; html: string; metin: string } {
  const govde = `
    <p>Merhaba ${ad},</p>
    <p>Hesabın <strong>askıya alındı</strong>. Neden:</p>
    <p style="padding:12px 16px;background:#fdf1e3;border-radius:8px;color:#b45309;">${neden}</p>
    <p>Bunun bir hata olduğunu düşünüyorsan bu e-postayı yanıtlayarak bizimle iletişime geç.</p>`;
  return {
    konu: `${MARKA.ad} — hesabın askıya alındı`,
    html: kabuk("Hesap askıya alındı", govde),
    metin: `Merhaba ${ad}, hesabın askıya alındı. Neden: ${neden}`,
  };
}

/** Referral daveti — davet edilene gönderilir. */
export function davetMail(davetEdenAd: string, davetLinki: string, odulKredi: number): { konu: string; html: string; metin: string } {
  const govde = `
    <p>Merhaba,</p>
    <p><strong>${davetEdenAd}</strong> seni <strong>${MARKA.ad}</strong>'e davet ediyor — sitelerini
    AI botlarına karşı koruyan ghost-font CAPTCHA platformu.</p>
    <p>Bu davetle kaydolursan <strong>${odulKredi} kredi</strong> hediye kazanırsın:</p>
    ${buton("Daveti kabul et", davetLinki)}
    <p style="color:#9c9a90;font-size:13px;">Link çalışmıyorsa: ${davetLinki}</p>`;
  return {
    konu: `${davetEdenAd} seni ${MARKA.ad}'e davet etti 🎁`,
    html: kabuk("Bir davetin var", govde),
    metin: `${davetEdenAd} seni ${MARKA.ad}'e davet etti. ${odulKredi} kredi kazan: ${davetLinki}`,
  };
}
