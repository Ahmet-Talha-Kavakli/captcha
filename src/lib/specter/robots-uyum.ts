/**
 * Specter — robots.txt Uyum Denetleyici (Compliance Auditor)
 * =========================================================
 * AMAÇ: robots.txt'e uyduğunu İLAN EDEN AI botlarının gerçekte uyup
 * uymadığını, gözlenen trafikten tespit etmek. Bir bot "GPTBot robots.txt'e
 * saygı gösterir" der ama korumalı (Disallow) bir yola istek atmışsa → bu
 * bir İHLAL'dir. Bu motor, kataloğumuzdaki `saygiRobots` taahhüdünü canlı
 * olaylarla karşılaştırıp yalan söyleyen botları ortaya çıkarır.
 *
 * SAF (pure) motor: next/headers yok, Date.now/Math.random yok, argümansız
 * `new Date` yok. Aynı girdi → aynı çıktı (determinist). Zaman veya rastgelelik
 * gerektiren her şey çağıran taraftan (page.tsx) parametre olarak gelir.
 */

import { aiAjanTespit, type AiAjan } from "./ai-agents";

/** Gözlenen olayın motorun ihtiyaç duyduğu minimum şekli (BotEvent alt-kümesi). */
export interface UyumOlay {
  ua: string;
  path: string;
}

/**
 * Temsili robots.txt politikası: hemen her sitede Disallow ile korunan,
 * botların uğramaması gereken tipik yollar. Prefix eşleşmesiyle uygulanır
 * (robots.txt de prefix mantığıyla çalışır).
 *
 * NOT: Bu, gerçek bir sitenin robots.txt'i DEĞİL — sektörde yaygın korunan
 * yolların temsili bir kümesidir. Site-başına gerçek robots.txt bağlama
 * gelecekteki bir geliştirmedir (page/istemci'de dürüstçe belirtilir).
 */
export const VARSAYILAN_KORUMALI_YOLLAR: string[] = [
  "/admin",
  "/api",
  "/hesabim",
  "/checkout",
  "/private",
  "/wp-admin",
  "/.git",
  "/internal",
];

/**
 * Bir yol, verilen Disallow kurallarından herhangi biriyle prefix eşleşiyor
 * mu? robots.txt semantiği: "Disallow: /admin" → /admin, /admin/, /admin/x
 * hepsini kapsar. Sorgu dizesi (?...) ve büyük/küçük harf normalize edilir.
 */
export function yolYasakMi(path: string, kurallar: string[]): boolean {
  if (!path) return false;
  // Sorgu ve fragment'ı at, küçük harfe indir.
  const temiz = path.split("?")[0].split("#")[0].toLowerCase();
  return kurallar.some((k) => {
    const kural = k.toLowerCase();
    return temiz === kural || temiz.startsWith(kural.endsWith("/") ? kural : kural + "/") || temiz.startsWith(kural);
  });
}

/** Bir ajanın uyum durumu. */
export type UyumDurum =
  | "uyumlu" // robots'a saygı taahhüdü var VE hiç ihlal yok
  | "ihlal" // robots'a saygı taahhüdü var AMA korumalı yola istek attı (YALAN)
  | "taahhut_yok"; // robots'a saygı taahhüdü hiç yok (uyum beklenmiyor ama izlenir)

/** İhlal edilen tek bir yol + kaç kez vurulduğu. */
export interface IhlalYol {
  path: string;
  sayi: number;
}

/** Ajan bazlı uyum satırı. */
export interface AjanUyum {
  id: string;
  urun: string;
  operator: string;
  logo: string;
  saygiRobots: boolean;
  /** Bu ajana ait toplam gözlenen istek (30 gün penceresi çağırandan gelir). */
  toplam: number;
  /** Korumalı (Disallow) yola giden istek sayısı = ihlal sayısı. */
  ihlal: number;
  /** Uyum oranı = 1 - ihlal/toplam (0..1). Toplam 0 ise 1 (temiz). */
  uyumOrani: number;
  /** Hangi korumalı yollara kaç kez gidildi (çoktan aza sıralı). */
  ihlalYollar: IhlalYol[];
  durum: UyumDurum;
}

/** Genel özet. */
export interface UyumOzet {
  toplamAiIstek: number;
  toplamIhlal: number;
  /** Taahhüt ettiği hâlde ihlal eden ajan sayısı (asıl bulgu). */
  ihlalliAjan: number;
  /** Trafiği olan, taahhütlü ajanların ortalama uyum oranı (0..1). */
  ortUyum: number;
}

export interface UyumRaporu {
  ajanlar: AjanUyum[];
  ozet: UyumOzet;
}

/** Ajan başına biriktirilen ham sayaç. */
interface AjanSayac {
  ajan: AiAjan;
  toplam: number;
  ihlal: number;
  yollar: Map<string, number>;
}

/**
 * Gözlenen olayları temsili robots.txt politikasıyla karşılaştırır ve
 * ajan-başına uyum raporu üretir.
 *
 * MANTIK (ajan başına):
 *  - Olayın UA'sı bir AI ajanına eşleşiyorsa saydırılır.
 *  - Olayın yolu korumalı (Disallow) ise → o ajan için bir "ihlal".
 *  - `saygiRobots === true` olan ajan ihlal yaptıysa → durum "ihlal" (YALAN).
 *  - `saygiRobots === false` olan ajan → durum "taahhut_yok" (uyum sözü yok).
 *  - Taahhütlü ve ihlalsiz ajan → "uyumlu".
 *
 * Determinist: sıralamalar sabit (ihlal→toplam→id) yapılır, zaman kullanılmaz.
 */
export function robotsUyumAnaliz(olaylar: UyumOlay[], kurallar: string[]): UyumRaporu {
  const sayaclar = new Map<string, AjanSayac>();

  for (const olay of olaylar) {
    const ajan = aiAjanTespit((olay.ua || "").toLowerCase());
    if (!ajan) continue;

    let s = sayaclar.get(ajan.id);
    if (!s) {
      s = { ajan, toplam: 0, ihlal: 0, yollar: new Map() };
      sayaclar.set(ajan.id, s);
    }
    s.toplam++;

    if (yolYasakMi(olay.path, kurallar)) {
      s.ihlal++;
      // İhlal edilen yolu, eşleşen KURAL prefix'i altında topla (dağınık
      // alt-yollar tek satırda toplansın: /admin/x, /admin/y → /admin).
      const anahtar = ihlalKuralAnahtari(olay.path, kurallar);
      s.yollar.set(anahtar, (s.yollar.get(anahtar) || 0) + 1);
    }
  }

  const ajanlar: AjanUyum[] = [];
  for (const s of sayaclar.values()) {
    const uyumOrani = s.toplam > 0 ? 1 - s.ihlal / s.toplam : 1;
    const durum: UyumDurum = !s.ajan.saygiRobots
      ? "taahhut_yok"
      : s.ihlal > 0
        ? "ihlal"
        : "uyumlu";

    const ihlalYollar: IhlalYol[] = [...s.yollar.entries()]
      .map(([path, sayi]) => ({ path, sayi }))
      // Determinist: çoktan aza, eşitlikte alfabetik.
      .sort((a, b) => b.sayi - a.sayi || a.path.localeCompare(b.path));

    ajanlar.push({
      id: s.ajan.id,
      urun: s.ajan.urun,
      operator: s.ajan.operator,
      logo: s.ajan.logo,
      saygiRobots: s.ajan.saygiRobots,
      toplam: s.toplam,
      ihlal: s.ihlal,
      uyumOrani,
      ihlalYollar,
      durum,
    });
  }

  // Determinist sıralama: önce ihlal edenler (durum), sonra ihlal sayısı,
  // sonra toplam, sonra id. Böylece "yalan söyleyen bot" en üstte görünür.
  const durumSira: Record<UyumDurum, number> = { ihlal: 0, taahhut_yok: 1, uyumlu: 2 };
  ajanlar.sort(
    (a, b) =>
      durumSira[a.durum] - durumSira[b.durum] ||
      b.ihlal - a.ihlal ||
      b.toplam - a.toplam ||
      a.id.localeCompare(b.id),
  );

  const toplamAiIstek = ajanlar.reduce((t, a) => t + a.toplam, 0);
  const toplamIhlal = ajanlar.reduce((t, a) => t + a.ihlal, 0);
  const ihlalliAjan = ajanlar.filter((a) => a.durum === "ihlal").length;

  // Ortalama uyum: yalnızca taahhütlü + trafiği olan ajanlar üzerinden.
  const taahhutluAktif = ajanlar.filter((a) => a.saygiRobots && a.toplam > 0);
  const ortUyum =
    taahhutluAktif.length > 0
      ? taahhutluAktif.reduce((t, a) => t + a.uyumOrani, 0) / taahhutluAktif.length
      : 1;

  return {
    ajanlar,
    ozet: { toplamAiIstek, toplamIhlal, ihlalliAjan, ortUyum },
  };
}

/**
 * İhlal edilen bir yolu, eşleştiği KORUMALI kural prefix'iyle etiketle.
 * Böylece /admin/users ve /admin/logs tek "/admin" satırında toplanır; hangi
 * kural ihlal edildi net görülür. Birden fazla kural eşleşirse en uzun (en
 * spesifik) prefix seçilir.
 */
function ihlalKuralAnahtari(path: string, kurallar: string[]): string {
  const temiz = path.split("?")[0].split("#")[0].toLowerCase();
  let enIyi = "";
  for (const k of kurallar) {
    const kural = k.toLowerCase();
    const eslesti =
      temiz === kural || temiz.startsWith(kural.endsWith("/") ? kural : kural + "/") || temiz.startsWith(kural);
    if (eslesti && kural.length > enIyi.length) enIyi = kural;
  }
  return enIyi || temiz;
}

/** Uyum durumu etiketleri (UI). */
export const UYUM_DURUM_ETIKET: Record<UyumDurum, string> = {
  uyumlu: "Uyumlu",
  ihlal: "İHLAL",
  taahhut_yok: "Taahhüt yok",
};
