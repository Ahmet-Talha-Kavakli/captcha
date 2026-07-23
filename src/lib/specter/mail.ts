import "server-only";
import net from "node:net";
import tls from "node:tls";

/**
 * Veylify — Sıfır-Bağımlılık SMTP İstemcisi
 * =========================================
 * Node'un yerleşik `net`/`tls`'i ile ham SMTP konuşur — nodemailer vb. paket
 * GEREKTİRMEZ. STARTTLS (587) ve implicit TLS (465) destekler, AUTH LOGIN yapar.
 *
 * ENV (.env.local):
 *   SMTP_HOST, SMTP_PORT(=587), SMTP_USER, SMTP_PASS, SMTP_FROM
 *   (SMTP_SECURE=1 → 465 implicit TLS)
 *
 * SMTP_HOST boşsa gönderim yapılmaz: e-posta konsola loglanır (dev/vitrin) ve
 * `{ gonderildi:false, sebep:"smtp-yapılandırılmamış" }` döner. Böylece uygulama
 * her ortamda çalışır; canlıda env dolduğunda gerçek gönderim devreye girer.
 */

export interface MailIstek {
  kime: string;
  konu: string;
  html: string;
  metin?: string;
}

export interface MailSonuc {
  gonderildi: boolean;
  sebep?: string;
}

interface SmtpAyar {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
  secure: boolean;
}

function ayarOku(): SmtpAyar | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  return {
    host,
    port,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS?.trim() || undefined,
    from: process.env.SMTP_FROM?.trim() || "Veylify <no-reply@veylify.com>",
    secure: process.env.SMTP_SECURE?.trim() === "1" || port === 465,
  };
}

/** SMTP yapılandırılmış mı (canlı gönderim mümkün mü)? */
export function mailAktif(): boolean {
  return ayarOku() !== null;
}

/** "Veylify <a@b.com>" → "a@b.com" (zarf adresi için). */
function adresCek(s: string): string {
  const m = s.match(/<([^>]+)>/);
  return m ? m[1] : s.trim();
}

/** Basit satır-tabanlı SMTP diyaloğu (tek alıcı, tek mesaj). */
async function smtpGonder(ayar: SmtpAyar, istek: MailIstek): Promise<void> {
  const soket: net.Socket | tls.TLSSocket = ayar.secure
    ? tls.connect({ host: ayar.host, port: ayar.port, servername: ayar.host })
    : net.connect({ host: ayar.host, port: ayar.port });

  soket.setEncoding("utf8");
  soket.setTimeout(15000);

  let tamponSoket: net.Socket | tls.TLSSocket = soket;
  let tampon = "";
  let cozucu: ((s: string) => void) | null = null;
  let redci: ((e: Error) => void) | null = null;

  const dinleyiciTak = (s: net.Socket | tls.TLSSocket) => {
    s.on("data", (veri: string) => {
      tampon += veri;
      // Tam yanıt: "250 ..." (üçüncü karakter boşluk = son satır).
      const satirlar = tampon.split("\r\n").filter(Boolean);
      const son = satirlar[satirlar.length - 1];
      if (son && /^\d{3} /.test(son)) {
        const yanit = tampon;
        tampon = "";
        cozucu?.(yanit);
      }
    });
    s.on("error", (e) => redci?.(e));
    s.on("timeout", () => redci?.(new Error("SMTP zaman aşımı")));
  };
  dinleyiciTak(soket);

  const bekle = () => new Promise<string>((res, rej) => { cozucu = res; redci = rej; });
  const komut = async (satir: string, beklenen: number) => {
    tamponSoket.write(satir + "\r\n");
    const yanit = await bekle();
    const kod = Number(yanit.slice(0, 3));
    if (kod !== beklenen) throw new Error(`SMTP ${satir.split(" ")[0]} → ${yanit.trim().slice(0, 100)}`);
    return yanit;
  };

  try {
    await bekle(); // 220 karşılama
    const ehloYanit = await komut(`EHLO veylify`, 250);

    // STARTTLS (587 gibi düz bağlantılarda TLS'e yükselt) — yalnız sunucu
    // destekliyorsa (EHLO yanıtında STARTTLS varsa). Aksi halde düz devam.
    if (!ayar.secure && /STARTTLS/i.test(ehloYanit)) {
      await komut("STARTTLS", 220);
      const guvenli = tls.connect({ socket: soket, servername: ayar.host });
      guvenli.setEncoding("utf8");
      tamponSoket = guvenli;
      tampon = "";
      dinleyiciTak(guvenli);
      await new Promise<void>((res, rej) => {
        guvenli.once("secureConnect", () => res());
        guvenli.once("error", rej);
      });
      await komut(`EHLO veylify`, 250);
    }

    // AUTH LOGIN (kullanıcı/şifre varsa).
    if (ayar.user && ayar.pass) {
      await komut("AUTH LOGIN", 334);
      await komut(Buffer.from(ayar.user).toString("base64"), 334);
      await komut(Buffer.from(ayar.pass).toString("base64"), 235);
    }

    const fromAdres = adresCek(ayar.from);
    const toAdres = adresCek(istek.kime);
    await komut(`MAIL FROM:<${fromAdres}>`, 250);
    await komut(`RCPT TO:<${toAdres}>`, 250);
    await komut("DATA", 354);

    // Gövde: RFC 5322 başlıkları + HTML (+ opsiyonel metin alternatifi).
    const sinir = `=_veylify_${Math.abs(hashKisa(istek.konu + toAdres))}`;
    const govde = [
      `From: ${ayar.from}`,
      `To: ${istek.kime}`,
      `Subject: ${basitKodla(istek.konu)}`,
      `MIME-Version: 1.0`,
      istek.metin
        ? `Content-Type: multipart/alternative; boundary="${sinir}"`
        : `Content-Type: text/html; charset=UTF-8`,
      ``,
      ...(istek.metin
        ? [
            `--${sinir}`,
            `Content-Type: text/plain; charset=UTF-8`,
            ``,
            istek.metin,
            `--${sinir}`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            istek.html,
            `--${sinir}--`,
          ]
        : [istek.html]),
    ].join("\r\n");

    // Nokta-doldurma (satır başındaki "." → ".."), sonlandırıcı "\r\n.\r\n".
    const guvenliGovde = govde.replace(/\r\n\./g, "\r\n..");
    tamponSoket.write(guvenliGovde + "\r\n.\r\n");
    await bekle(); // 250 kabul
    await komut("QUIT", 221).catch(() => {});
  } finally {
    try { soket.destroy(); } catch { /* yok */ }
  }
}

/** UTF-8 konu başlığı için RFC 2047 kodlaması (Türkçe karakterler için). */
function basitKodla(s: string): string {
  if (/^[\x00-\x7F]*$/.test(s)) return s; // saf ASCII → düz
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

function hashKisa(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * E-posta gönder. SMTP yapılandırılmamışsa loglar ve `gonderildi:false` döner
 * (uygulama akışını KIRMAZ — kayıt/askıya vb. mail olmadan da devam eder).
 */
export async function mailGonder(istek: MailIstek): Promise<MailSonuc> {
  const ayar = ayarOku();
  if (!ayar) {
    console.info(`[mail] SMTP yapılandırılmamış — atlandı: "${istek.konu}" → ${istek.kime}`);
    return { gonderildi: false, sebep: "smtp-yapılandırılmamış" };
  }
  try {
    await smtpGonder(ayar, istek);
    console.info(`[mail] gönderildi: "${istek.konu}" → ${istek.kime}`);
    return { gonderildi: true };
  } catch (e) {
    console.error(`[mail] gönderilemedi: ${String(e).slice(0, 160)}`);
    return { gonderildi: false, sebep: String(e).slice(0, 120) };
  }
}
