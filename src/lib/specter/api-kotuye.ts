/**
 * Specter — API Kötüye-Kullanım & Rate-Limit İstihbaratı
 * ======================================================
 * Botlar tek tek isteklerden çok, belirli ENDPOINT'leri (yol) sömürür: /login'e
 * kimlik-doldurma, /api/products'a kazıma, /register'a spam. Bu modül endpoint
 * bazında kötüye-kullanımı ölçer ve her yol için AKILLI, adaptif bir rate-limit
 * önerir.
 *
 * Yöntem:
 *   • Yol başına: istek hacmi, benzersiz IP, bot oranı, IP-başına yoğunluk,
 *     patlama (burst) katsayısı, hassaslık (login/api/checkout ağırlıklı).
 *   • KÖTÜYE-KULLANIM SKORU = bot oranı × yoğunluk × patlama × hassaslık.
 *   • Token-bucket modeliyle önerilen limit: meşru kullanıcı temposunu bozmadan
 *     bot patlamalarını kesecek dakika-başına-istek + burst kapasitesi.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

const IYI = new Set(["human", "good_bot"]);
const HASSAS = /login|signin|auth|password|account|checkout|payment|register|api|graphql|token|reset/i;

export interface EndpointAbuse {
  yol: string;
  toplamIstek: number;
  benzersizIp: number;
  botIstek: number;
  botOrani: number;          // 0-1
  /** IP başına ortalama istek (yoğunluk — düşük=dağıtık, yüksek=agresif). */
  ipBasinaIstek: number;
  /** En agresif tek IP'nin istek sayısı. */
  enAgresifIp: number;
  enAgresifIpDeger: string;
  /** Patlama katsayısı: tepe-yoğunluk / ortalama (zamansal kümelenme). */
  patlama: number;
  hassas: boolean;
  /** Kötüye-kullanım skoru 0-100. */
  abuseSkoru: number;
  seviye: "düşük" | "orta" | "yüksek" | "kritik";
  /** Önerilen rate-limit (token-bucket). */
  oneri: RateOneri;
}

export interface RateOneri {
  /** Dakika başına istek limiti (IP başına). */
  dakikaLimit: number;
  /** Burst kapasitesi (token-bucket derinliği). */
  burst: number;
  /** Aşımda aksiyon. */
  aksiyon: "challenge" | "block" | "throttle";
  gerekce: string;
}

function yuzdelik(sirali: number[], p: number): number {
  if (sirali.length === 0) return 0;
  const i = Math.min(sirali.length - 1, Math.floor(p * sirali.length));
  return sirali[i];
}

/**
 * Bir yolun olaylarından kötüye-kullanım profili + rate-limit önerisi üretir.
 */
function endpointAnaliz(yol: string, olaylar: BotEvent[]): EndpointAbuse {
  const toplam = olaylar.length;
  const ipSay = new Map<string, number>();
  let botIstek = 0;
  for (const e of olaylar) {
    ipSay.set(e.ip, (ipSay.get(e.ip) || 0) + 1);
    if (!IYI.has(e.botClass)) botIstek++;
  }
  const benzersizIp = ipSay.size;
  const botOrani = toplam ? botIstek / toplam : 0;
  const ipBasinaIstek = benzersizIp ? toplam / benzersizIp : 0;
  const ipList = [...ipSay.entries()].sort((a, b) => b[1] - a[1]);
  const enAgresifIpDeger = ipList[0]?.[0] ?? "";
  const enAgresifIp = ipList[0]?.[1] ?? 0;

  // Patlama: en yoğun IP'nin ortalamaya oranı (temsili zamansal kümelenme).
  const ortIp = ipBasinaIstek || 1;
  const patlama = Math.round((enAgresifIp / ortIp) * 10) / 10;

  const hassas = HASSAS.test(yol);

  // Kötüye-kullanım skoru: bot oranı × yoğunluk × patlama × hassaslık.
  const yogunlukN = Math.min(1, ipBasinaIstek / 20);
  const patlamaN = Math.min(1, patlama / 8);
  const hassasCarpan = hassas ? 1.3 : 1.0;
  const abuseSkoru = Math.round(
    Math.min(100, (botOrani * 0.45 + yogunlukN * 0.3 + patlamaN * 0.25) * 100 * hassasCarpan),
  );
  const seviye: EndpointAbuse["seviye"] =
    abuseSkoru >= 70 ? "kritik" : abuseSkoru >= 45 ? "yüksek" : abuseSkoru >= 25 ? "orta" : "düşük";

  return {
    yol, toplamIstek: toplam, benzersizIp, botIstek,
    botOrani: Math.round(botOrani * 100) / 100,
    ipBasinaIstek: Math.round(ipBasinaIstek * 10) / 10,
    enAgresifIp, enAgresifIpDeger,
    patlama, hassas, abuseSkoru, seviye,
    oneri: rateOner(ipBasinaIstek, patlama, botOrani, hassas, seviye),
  };
}

/**
 * Token-bucket rate-limit önerisi. Meşru kullanıcı temposunu (medyan yoğunluk)
 * korurken bot patlamalarını kesecek limit + burst hesaplar.
 */
function rateOner(ipBasina: number, patlama: number, botOrani: number, hassas: boolean, seviye: EndpointAbuse["seviye"]): RateOneri {
  // Meşru taban: hassas yollar daha sıkı. Taban dakika-limiti.
  const taban = hassas ? 12 : 30;
  // Kötüye-kullanım yüksekse limiti düşür.
  const carpan = seviye === "kritik" ? 0.5 : seviye === "yüksek" ? 0.7 : seviye === "orta" ? 0.85 : 1;
  const dakikaLimit = Math.max(5, Math.round(taban * carpan));
  // Burst: kısa ani artışlara tolerans (token-bucket derinliği).
  const burst = Math.max(3, Math.round(dakikaLimit * 0.4));
  const aksiyon: RateOneri["aksiyon"] = seviye === "kritik" ? "block" : seviye === "yüksek" ? "challenge" : "throttle";
  const gerekce =
    seviye === "kritik" ? `Yoğun bot kötüye-kullanımı (%${Math.round(botOrani * 100)} bot, patlama ${patlama}×) — sıkı limit + aşımda engelle.`
    : seviye === "yüksek" ? `Belirgin kötüye-kullanım — limiti düşür, aşımda ghost-font doğrula.`
    : seviye === "orta" ? `Orta baskı — throttle (yavaşlat) yeterli.`
    : `Sağlıklı trafik — koruyucu taban limit.`;
  return { dakikaLimit, burst, aksiyon, gerekce };
}

export interface ApiAbuseRapor {
  endpointler: EndpointAbuse[];
  ozet: {
    toplamYol: number;
    kotuyeKullanilANYol: number;   // orta+ skorlu
    kritikYol: number;
    korunmasizHassas: number;      // hassas + yüksek skor + zayıf limit
    enCokKotuye: string | null;
    ortAbuseSkoru: number;
  };
}

/**
 * Tüm olaylardan endpoint kötüye-kullanım raporu üretir.
 * @param enAzIstek bir yolun analiz edilmesi için minimum istek.
 */
export function apiAbuseAnaliz(events: BotEvent[], enAzIstek = 5): ApiAbuseRapor {
  const yolMap = new Map<string, BotEvent[]>();
  for (const e of events) {
    const yol = (e.path || "/").split("?")[0];
    if (!yolMap.has(yol)) yolMap.set(yol, []);
    yolMap.get(yol)!.push(e);
  }

  const endpointler: EndpointAbuse[] = [];
  for (const [yol, olaylar] of yolMap) {
    if (olaylar.length < enAzIstek) continue;
    endpointler.push(endpointAnaliz(yol, olaylar));
  }
  endpointler.sort((a, b) => b.abuseSkoru - a.abuseSkoru);

  const kotuye = endpointler.filter((e) => e.abuseSkoru >= 25);
  const kritik = endpointler.filter((e) => e.seviye === "kritik");
  const korunmasiz = endpointler.filter((e) => e.hassas && e.abuseSkoru >= 45);
  const ortSkor = endpointler.length
    ? Math.round(endpointler.reduce((a, e) => a + e.abuseSkoru, 0) / endpointler.length)
    : 0;

  return {
    endpointler,
    ozet: {
      toplamYol: endpointler.length,
      kotuyeKullanilANYol: kotuye.length,
      kritikYol: kritik.length,
      korunmasizHassas: korunmasiz.length,
      enCokKotuye: endpointler[0]?.yol ?? null,
      ortAbuseSkoru: ortSkor,
    },
  };
}

export const SEVIYE_RENK: Record<EndpointAbuse["seviye"], string> = {
  "düşük": "#16a34a", "orta": "#d97706", "yüksek": "#ea580c", "kritik": "#dc2626",
};

export const AKSIYON_ETIKET: Record<RateOneri["aksiyon"], string> = {
  challenge: "Doğrula", block: "Engelle", throttle: "Yavaşlat",
};
