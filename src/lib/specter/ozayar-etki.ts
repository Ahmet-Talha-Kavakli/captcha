/**
 * Specter — Öz-Ayar Etki Takibi (Auto-Tune Impact Tracking)
 * =========================================================
 * Kapalı-döngünün ÖLÇÜM/GERİ-DOĞRULAMA halkası. Bir öz-ayar önerisi uygulanıp
 * kurala dönüştürüldükten sonra: gerçekten işe yaradı mı? Bu motor, her öz-ayar
 * kuralı için kural-oluşturma anının ÖNCESİ ve SONRASINDAKİ dönemi kıyaslar:
 * hedef bot türünün olay oranı düştü mü, engelleme arttı mı?
 *
 * Böylece döngü tamamlanır: öner → uygula → ÖLÇ → doğrula. Kullanıcı hangi
 * öz-ayarların işe yaradığını, hangilerinin etkisiz kaldığını görür.
 *
 * Saf/deterministik: Date.now/Math.random YOK — "şimdi" parametre olarak geçilir,
 * kıyas olay zaman damgalarından yapılır.
 */
import type { BotEvent, Rule } from "@/lib/db/schema";

/** Bir öz-ayar kuralının etki ölçümü. */
export interface OzAyarEtki {
  ruleId: string;
  ruleName: string;
  /** Hedef bot türü (kural value'su). */
  botClass: string;
  action: string;
  createdAt: number;
  /** Kural öncesi dönemde bu türün olay sayısı. */
  oncesiOlay: number;
  /** Kural sonrası dönemde bu türün olay sayısı. */
  sonrasiOlay: number;
  /** Öncesi dönemde bu türün engel oranı (0-1). */
  oncesiEngelOran: number;
  /** Sonrası dönemde bu türün engel oranı (0-1). */
  sonrasiEngelOran: number;
  /** Olay-hacmi değişimi (%). Negatif = azaldı (iyi). */
  hacimDegisim: number;
  /** Engelleme değişimi (yüzde puan). Pozitif = daha çok engellendi (iyi). */
  engelDegisim: number;
  /** Etki kararı. */
  etki: "etkili" | "notr" | "etkisiz" | "yetersiz-veri";
}

export interface OzAyarEtkiSonuc {
  etkiler: OzAyarEtki[];
  /** İzlenen öz-ayar kuralı sayısı. */
  toplam: number;
  /** Etkili bulunan sayı. */
  etkili: number;
  /** Öz-ayar kuralı hiç yok mu. */
  bos: boolean;
}

const ENGEL = new Set(["blocked", "challenged"]);

/** Bir kural öz-ayar tarafından mı üretildi (ad prefix'i + botClass eşitlik). */
function ozAyarKurali(r: Rule): boolean {
  return !r.system && r.field === "botClass" && r.op === "eq" && /^Öz-ayar:/.test(r.name);
}

/** Bir olay kümesinin bir bot türü için hacim + engel oranı. */
function turMetrik(events: BotEvent[], botClass: string) {
  const ilgili = events.filter((e) => e.botClass === botClass);
  const engel = ilgili.filter((e) => ENGEL.has(e.verdict)).length;
  return { olay: ilgili.length, engelOran: ilgili.length ? engel / ilgili.length : 0 };
}

/**
 * Öz-ayar kurallarının etkisini ölçer. Her kural için, kural-oluşturma anını
 * pivot alıp öncesi/sonrasındaki olayları kıyaslar. Kıyasın adil olması için
 * öncesi ve sonrası pencereleri EŞİT uzunlukta alınır (sonrası ne kadar geçtiyse
 * öncesi de o kadar geriye bakılır).
 *
 * @param events tüm olaylar
 * @param rules  tüm kurallar
 * @param simdi  "şimdi" zaman damgası (ms) — pencere hesabı için
 */
export function ozAyarEtki(events: BotEvent[], rules: Rule[], simdi: number): OzAyarEtkiSonuc {
  const ozKurallar = rules.filter(ozAyarKurali);
  const etkiler: OzAyarEtki[] = [];

  for (const r of ozKurallar) {
    const botClass = r.value;
    const gecen = simdi - r.createdAt; // kuraldan bu yana geçen süre
    // Sonrası penceresi = [createdAt, simdi]; öncesi = [createdAt - gecen, createdAt]
    // (eşit uzunlukta adil kıyas).
    const oncesiOlaylar = events.filter((e) => e.ts >= r.createdAt - gecen && e.ts < r.createdAt);
    const sonrasiOlaylar = events.filter((e) => e.ts >= r.createdAt && e.ts <= simdi);

    const onc = turMetrik(oncesiOlaylar, botClass);
    const son = turMetrik(sonrasiOlaylar, botClass);

    const hacimDegisim = onc.olay > 0
      ? Math.round(((son.olay - onc.olay) / onc.olay) * 100)
      : (son.olay > 0 ? 100 : 0);
    const engelDegisim = Math.round((son.engelOran - onc.engelOran) * 100);

    // Etki kararı: yeterli veri yoksa "yetersiz-veri"; hacim düştü VEYA engel
    // arttıysa "etkili"; ikisi de kötüleştiyse "etkisiz"; arada "notr".
    let etki: OzAyarEtki["etki"];
    if (onc.olay < 3 && son.olay < 3) {
      etki = "yetersiz-veri";
    } else if (hacimDegisim <= -15 || engelDegisim >= 15) {
      etki = "etkili";
    } else if (hacimDegisim >= 20 && engelDegisim <= 0) {
      etki = "etkisiz";
    } else {
      etki = "notr";
    }

    etkiler.push({
      ruleId: r.id, ruleName: r.name, botClass, action: r.action, createdAt: r.createdAt,
      oncesiOlay: onc.olay, sonrasiOlay: son.olay,
      oncesiEngelOran: onc.engelOran, sonrasiEngelOran: son.engelOran,
      hacimDegisim, engelDegisim, etki,
    });
  }

  etkiler.sort((a, b) => b.createdAt - a.createdAt);

  return {
    etkiler,
    toplam: etkiler.length,
    etkili: etkiler.filter((e) => e.etki === "etkili").length,
    bos: etkiler.length === 0,
  };
}

export const ETKI_TON: Record<OzAyarEtki["etki"], "yesil" | "sari" | "kirmizi" | "gri"> = {
  etkili: "yesil", notr: "sari", etkisiz: "kirmizi", "yetersiz-veri": "gri",
};
