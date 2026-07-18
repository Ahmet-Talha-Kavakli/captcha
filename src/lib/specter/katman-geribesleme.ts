/**
 * Specter — Saldırgan Geri-Besleme Döngüsü (Layer Feedback Loop)
 * =============================================================
 * verify akışı artık her olaya GERÇEK katman-hit'lerini (katmanHitler) yazıyor.
 * Bu motor o gerçek veriden ÖĞRENİR: hangi bot türü hangi savunma katmanını en
 * çok tetikliyor? Hangi katman hangi tür için en etkili? Katmanlar birbirini ne
 * kadar tamamlıyor (örtüşme az = her katman farklı tehdit yakalıyor = iyi)?
 *
 * Çıktı, adaptif savunmayı gerçek gözlemle ince-ayarlamak için kullanılır:
 * bir tür belirli bir katmana çok yakalanıyorsa o katman o tür için kritiktir;
 * hiçbir katmana yakalanmayan tür = savunma boşluğu (yeni katman gerekebilir).
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

export type KatmanId = "ghost-font" | "honeypot" | "tutarlilik" | "pow";
export const KATMANLAR: KatmanId[] = ["ghost-font", "honeypot", "tutarlilik", "pow"];

/** Bot türü × katman çapraz-hücresi. */
export interface CaprazHucre {
  botClass: string;
  katman: KatmanId;
  /** Bu tür + bu katmanın kaç kez birlikte tetiklendiği. */
  sayi: number;
  /** Bu türün tüm hit'leri içindeki oran (0-1). */
  oran: number;
}

/** Bir katmanın etkinlik özeti. */
export interface KatmanEtkinlik {
  katman: KatmanId;
  /** Toplam tetiklenme. */
  toplam: number;
  /** En çok yakaladığı bot türü. */
  baskinTur: string | null;
  /** Bu katmanın YALNIZ yakaladığı (başka katman görmediği) olay sayısı —
   *  yüksekse bu katman benzersiz değer katıyor demektir. */
  benzersiz: number;
}

/** İki katmanın ne sıklıkta birlikte tetiklendiği (örtüşme). */
export interface OrtusmeHucre {
  a: KatmanId;
  b: KatmanId;
  /** İkisinin birlikte tetiklendiği olay sayısı. */
  birlikte: number;
}

export interface GeriBeslemeSonuc {
  /** Gerçek katman-hit verisi var mı (yoksa sonuç boş/anlamsız). */
  gercekVeri: boolean;
  /** Toplam katman-hit taşıyan olay. */
  hitliOlay: number;
  capraz: CaprazHucre[];
  katmanlar: KatmanEtkinlik[];
  ortusmeler: OrtusmeHucre[];
  /** Hiçbir katmana yakalanmayan kötü türler (savunma boşluğu). */
  bosluklar: { botClass: string; olay: number }[];
  /** En etkili katman (en çok benzersiz yakalama). */
  enEtkili: KatmanId | null;
}

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

/**
 * Gerçek katman-hit olaylarından geri-besleme analizi çıkarır.
 */
export function katmanGeriBesleme(events: BotEvent[]): GeriBeslemeSonuc {
  const hitli = events.filter((e) => (e.katmanHitler?.length ?? 0) > 0);
  const gercekVeri = hitli.length > 0;

  // Bot türü × katman sayacı
  const caprazMap = new Map<string, number>(); // "botClass|katman" -> sayi
  const turToplam = new Map<string, number>(); // botClass -> toplam hit
  const katmanToplam = new Map<KatmanId, number>();
  const katmanBenzersiz = new Map<KatmanId, number>();
  const ortusmeMap = new Map<string, number>(); // "a|b" -> birlikte

  for (const e of hitli) {
    const hitler = (e.katmanHitler ?? []).filter((h): h is KatmanId => KATMANLAR.includes(h as KatmanId));
    for (const k of hitler) {
      const ck = `${e.botClass}|${k}`;
      caprazMap.set(ck, (caprazMap.get(ck) ?? 0) + 1);
      turToplam.set(e.botClass, (turToplam.get(e.botClass) ?? 0) + 1);
      katmanToplam.set(k, (katmanToplam.get(k) ?? 0) + 1);
    }
    // Benzersiz: yalnız 1 katman tetiklendiyse o katman benzersiz yakaladı
    if (hitler.length === 1) {
      katmanBenzersiz.set(hitler[0], (katmanBenzersiz.get(hitler[0]) ?? 0) + 1);
    }
    // Örtüşme: her katman çifti
    for (let i = 0; i < hitler.length; i++) {
      for (let j = i + 1; j < hitler.length; j++) {
        const [a, b] = [hitler[i], hitler[j]].sort();
        const ok = `${a}|${b}`;
        ortusmeMap.set(ok, (ortusmeMap.get(ok) ?? 0) + 1);
      }
    }
  }

  const capraz: CaprazHucre[] = [...caprazMap.entries()].map(([key, sayi]) => {
    const [botClass, katman] = key.split("|") as [string, KatmanId];
    return { botClass, katman, sayi, oran: sayi / (turToplam.get(botClass) || 1) };
  }).sort((a, b) => b.sayi - a.sayi);

  const katmanlar: KatmanEtkinlik[] = KATMANLAR.map((k) => {
    // Bu katmanın baskın türü
    const turler = capraz.filter((c) => c.katman === k).sort((a, b) => b.sayi - a.sayi);
    return {
      katman: k,
      toplam: katmanToplam.get(k) ?? 0,
      baskinTur: turler[0]?.botClass ?? null,
      benzersiz: katmanBenzersiz.get(k) ?? 0,
    };
  });

  const ortusmeler: OrtusmeHucre[] = [...ortusmeMap.entries()]
    .map(([key, birlikte]) => {
      const [a, b] = key.split("|") as [KatmanId, KatmanId];
      return { a, b, birlikte };
    })
    .sort((a, b) => b.birlikte - a.birlikte);

  // Savunma boşlukları: hitli olmayan kötü türler
  const yakalananTurler = new Set(hitli.map((e) => e.botClass));
  const boslukMap = new Map<string, number>();
  for (const e of events) {
    if (KOTU.has(e.botClass) && !yakalananTurler.has(e.botClass)) {
      boslukMap.set(e.botClass, (boslukMap.get(e.botClass) ?? 0) + 1);
    }
  }
  const bosluklar = [...boslukMap.entries()]
    .map(([botClass, olay]) => ({ botClass, olay }))
    .sort((a, b) => b.olay - a.olay);

  const enEtkili = [...katmanlar].sort((a, b) => b.benzersiz - a.benzersiz)[0]?.benzersiz
    ? [...katmanlar].sort((a, b) => b.benzersiz - a.benzersiz)[0].katman
    : null;

  return {
    gercekVeri, hitliOlay: hitli.length, capraz, katmanlar, ortusmeler, bosluklar, enEtkili,
  };
}
