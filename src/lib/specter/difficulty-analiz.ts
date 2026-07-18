/**
 * Specter — Adaptif Zorluk Analizi
 * ================================
 * Ghost-font challenge zorluğu SABİT değildir: her istekte, o IP'nin itibarına +
 * davranış skoruna + otomasyon işaretine göre `adaptiveDifficulty` ile CANLI
 * ölçeklenir (kötü sinyal → daha uzun/zor challenge, temiz insan → daha kısa/kolay).
 *
 * Bu modül, o motoru GÖRSELLEŞTİRİR: gerçek gözlemlenen trafiğe (olaylar + IP
 * itibarı) motoru uygulayıp zorluk dağılımını ve "neden bu zorluk" kırılımını
 * çıkarır. Böylece adaptif savunma dekoratif değil, ÖLÇÜLEBİLİR olur.
 */
import { adaptiveDifficulty, difficultyLength, type Difficulty } from "./challenge";
import type { BotEvent, IpReputation, Site } from "@/lib/db/schema";

export interface ZorlukDagilim {
  low: number;
  medium: number;
  high: number;
  toplam: number;
}

export interface ZorlukSebep {
  /** Zorluğu yükselten sinyal. */
  etiket: string;
  /** Bu sinyalden etkilenen olay sayısı. */
  sayi: number;
  /** +kademe etkisi (yaklaşık). */
  etki: string;
}

export interface ZorlukAnaliz {
  dagilim: ZorlukDagilim;
  /** Taban zorluğa göre kaç istek YÜKSELTİLDİ / DÜŞÜRÜLDÜ. */
  yukseltilen: number;
  dusurulen: number;
  /** Ortalama kod uzunluğu (adaptasyon sonrası). */
  ortUzunluk: number;
  /** Zorluğu tetikleyen başlıca sebepler. */
  sebepler: ZorlukSebep[];
}

/** IpReputation.threatScore (0=temiz..100=kötü) → ipReputation (0..1, yüksek=iyi). */
function itibarNormalize(rep: IpReputation | undefined): number {
  if (!rep) return 0.6; // bilinmiyor → nötr-iyi
  return Math.max(0, Math.min(1, 1 - rep.threatScore / 100));
}

/** Olayın botClass/score'undan davranış skoru ve otomasyon işareti türet. */
function sinyalTuret(e: BotEvent): { behaviorScore: number; automationFlag: boolean } {
  const otomasyon = e.botClass === "automation" || e.botClass === "scraper" || e.botClass === "credential_stuffing" || e.botClass === "ddos";
  return { behaviorScore: e.score, automationFlag: otomasyon };
}

/**
 * Gerçek olaylara adaptif zorluk motorunu uygulayıp dağılımı çıkarır.
 * baseByPath: taban zorluk site.difficulty'den gelir.
 */
export function zorlukAnaliz(
  events: BotEvent[],
  ipRep: Map<string, IpReputation>,
  baseDifficulty: Difficulty,
): ZorlukAnaliz {
  const dagilim: ZorlukDagilim = { low: 0, medium: 0, high: 0, toplam: 0 };
  let yukseltilen = 0;
  let dusurulen = 0;
  let uzunlukTop = 0;

  const sebepSay = { otomasyon: 0, kotuItibar: 0, dusukDavranis: 0 };
  const KADEME: Record<Difficulty, number> = { low: 0, medium: 1, high: 2 };

  for (const e of events) {
    const rep = ipRep.get(e.ip);
    const ipReputation = itibarNormalize(rep);
    const { behaviorScore, automationFlag } = sinyalTuret(e);

    if (automationFlag) sebepSay.otomasyon++;
    if (ipReputation < 0.3) sebepSay.kotuItibar++;
    if (behaviorScore < 0.3) sebepSay.dusukDavranis++;

    const zorluk = adaptiveDifficulty(baseDifficulty, {
      behaviorScore,
      ipReputation,
      automationFlag,
    });
    dagilim[zorluk]++;
    dagilim.toplam++;
    uzunlukTop += difficultyLength(zorluk);

    const fark = KADEME[zorluk] - KADEME[baseDifficulty];
    if (fark > 0) yukseltilen++;
    else if (fark < 0) dusurulen++;
  }

  const sebepler: ZorlukSebep[] = [
    { etiket: "Otomasyon imzası", sayi: sebepSay.otomasyon, etki: "+2 kademe" },
    { etiket: "Kötü IP itibarı", sayi: sebepSay.kotuItibar, etki: "+1 kademe" },
    { etiket: "Düşük davranış skoru", sayi: sebepSay.dusukDavranis, etki: "+1 kademe" },
  ].filter((s) => s.sayi > 0).sort((a, b) => b.sayi - a.sayi);

  return {
    dagilim,
    yukseltilen,
    dusurulen,
    ortUzunluk: dagilim.toplam ? Math.round((uzunlukTop / dagilim.toplam) * 10) / 10 : 0,
    sebepler,
  };
}

/** Tek bir hayali istek için zorluğu + gerekçesini döndürür (canlı simülatör). */
export function zorlukSimule(
  baseDifficulty: Difficulty,
  signals: { behaviorScore: number; ipReputation: number; automationFlag: boolean; recentFailures: number },
): { zorluk: Difficulty; uzunluk: number; gerekce: string[] } {
  const zorluk = adaptiveDifficulty(baseDifficulty, signals);
  const gerekce: string[] = [];
  if (signals.automationFlag) gerekce.push("Otomasyon imzası tespit edildi → +2 kademe");
  if (signals.ipReputation < 0.3) gerekce.push("Kötü IP itibarı → +1 kademe");
  if (signals.behaviorScore < 0.3) gerekce.push("Düşük davranış skoru → +1 kademe");
  if (signals.recentFailures >= 2) gerekce.push(`${signals.recentFailures} ardışık başarısızlık → +1 kademe`);
  if (gerekce.length === 0 && signals.behaviorScore >= 0.85 && signals.ipReputation >= 0.7) {
    gerekce.push("Net insan sinyali (yüksek davranış + temiz IP) → −1 kademe (kolaylaştırıldı)");
  }
  if (gerekce.length === 0) gerekce.push("Nötr sinyaller → taban zorluk korundu");
  return { zorluk, uzunluk: difficultyLength(zorluk), gerekce };
}

export const ZORLUK_ETIKET: Record<Difficulty, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
export const ZORLUK_RENK: Record<Difficulty, string> = { low: "#16a34a", medium: "#2f6fed", high: "#dc2626" };

/** Site tipini dışarı sızdırmadan taban zorluk okumak için yardımcı. */
export function siteTaban(site: Pick<Site, "difficulty">): Difficulty {
  return site.difficulty;
}
