/**
 * Specter — Katman Öz-Ayar (Closed-Loop Layer Auto-Tuning)
 * ========================================================
 * Geri-besleme döngüsünün SON halkası: katman-geribesleme motoru gerçek
 * katman-hit verisinden "hangi bot türü hangi katmanı tetikliyor?" öğrenir;
 * bu motor o öğrenmeyi SOMUT ayar önerilerine çevirir:
 *
 *   • Bir tür bir katmanı güçlü tetikliyorsa (yüksek oran) → o katman o tür
 *     için KRİTİK; hassasiyeti korunmalı/artırılmalı.
 *   • Bir tür bir katmanı hiç tetiklemiyorsa → o katman o tür için ETKİSİZ;
 *     başka katmana güvenilmeli (kaynağı boşa harcama).
 *   • Bir tür hiçbir katmana yakalanmıyorsa → SAVUNMA BOŞLUĞU; yeni kural/
 *     katman gerekir (kritik öneri).
 *
 * Öneriler ADAPTIF ZORLUĞA geri beslenir: kritik-katman türleri için taban
 * zorluk yükseltilir. Öneri motoru saf/deterministik; uygulama insan onaylı.
 *
 * Date.now/Math.random YOK — girdi geri-besleme sonucundan.
 */
import type { GeriBeslemeSonuc, KatmanId } from "@/lib/specter/katman-geribesleme";

export type OneriTur = "guclendir" | "koru" | "gereksiz" | "bosluk";

export interface AyarOnerisi {
  /** Hedef bot türü. */
  botClass: string;
  /** İlgili katman (boşluk önerisinde null). */
  katman: KatmanId | null;
  tur: OneriTur;
  /** Bu türün bu katmanı tetikleme oranı (0-1). */
  oran: number;
  /** Öneri gerekçesi (i18n key + veri; TR referans). */
  gerekce: string;
  /** Öncelik (yüksek = önce ele al). */
  oncelik: number;
  /** Önerilen taban-zorluk deltası (adaptif zorluğa uygulanacak, bit). */
  zorlukDelta: number;
}

export interface OzAyarSonuc {
  gercekVeri: boolean;
  oneriler: AyarOnerisi[];
  /** Kritik boşluk sayısı (yakalanamayan tür). */
  bosluk: number;
  /** Güçlendirme önerisi sayısı. */
  guclendir: number;
  /** Öz-ayar sağlık skoru (0-100): boşluk az + katmanlar dengeli = yüksek. */
  ayarSkoru: number;
}

/** Güçlü tetikleme eşiği (oran) — bu üstü "kritik katman". */
const GUCLU_ORAN = 0.5;

/**
 * Geri-besleme sonucundan katman öz-ayar önerileri üretir.
 */
export function katmanOzAyar(gb: GeriBeslemeSonuc): OzAyarSonuc {
  if (!gb.gercekVeri) {
    return { gercekVeri: false, oneriler: [], bosluk: 0, guclendir: 0, ayarSkoru: 0 };
  }

  const oneriler: AyarOnerisi[] = [];

  // 1) Çapraz-tablodan tür×katman önerileri
  for (const c of gb.capraz) {
    if (c.oran >= GUCLU_ORAN) {
      // Bu katman bu tür için kritik → güçlendir/koru
      const guclu = c.oran >= 0.7;
      oneriler.push({
        botClass: c.botClass, katman: c.katman,
        tur: guclu ? "guclendir" : "koru",
        oran: c.oran,
        gerekce: guclu
          ? `${c.botClass} olaylarının %${Math.round(c.oran * 100)}'i ${c.katman} katmanına takıldı — bu tür için kritik katman.`
          : `${c.botClass} için ${c.katman} etkili (%${Math.round(c.oran * 100)}); hassasiyeti korunmalı.`,
        oncelik: guclu ? Math.round(c.oran * 100) : Math.round(c.oran * 60),
        zorlukDelta: guclu ? 2 : 1,
      });
    }
  }

  // 2) Savunma boşlukları → kritik "bosluk" önerisi (en yüksek öncelik)
  for (const b of gb.bosluklar) {
    oneriler.push({
      botClass: b.botClass, katman: null, tur: "bosluk", oran: 0,
      gerekce: `${b.botClass} (${b.olay} olay) hiçbir savunma katmanına yakalanmadı — savunma boşluğu; yeni kural/katman gerekir.`,
      oncelik: 100 + b.olay, // boşluklar her zaman en üstte
      zorlukDelta: 3,
    });
  }

  // 3) Etkisiz katman-tür kombinasyonları (bir tür var ama bir katman onu hiç
  //    yakalamıyor) → "gereksiz" bilgi önerisi (düşük öncelik, kaynak tasarrufu)
  const turler = [...new Set(gb.capraz.map((c) => c.botClass))];
  const gorulen = new Set(gb.capraz.map((c) => `${c.botClass}|${c.katman}`));
  const KATMANLAR: KatmanId[] = ["ghost-font", "honeypot", "tutarlilik", "pow"];
  for (const t of turler) {
    for (const k of KATMANLAR) {
      if (!gorulen.has(`${t}|${k}`)) {
        oneriler.push({
          botClass: t, katman: k, tur: "gereksiz", oran: 0,
          gerekce: `${k} katmanı ${t} türünü hiç yakalamadı — bu tür için diğer katmanlara güvenilebilir.`,
          oncelik: 10, zorlukDelta: 0,
        });
      }
    }
  }

  oneriler.sort((a, b) => b.oncelik - a.oncelik);

  const bosluk = oneriler.filter((o) => o.tur === "bosluk").length;
  const guclendir = oneriler.filter((o) => o.tur === "guclendir").length;

  // Ayar skoru: boşluk yoksa yüksek; boşluk arttıkça düşer; güçlü katman-eşleşmesi bonus.
  const kritikEslesme = oneriler.filter((o) => o.tur === "guclendir" || o.tur === "koru").length;
  const ayarSkoru = Math.max(0, Math.min(100, 100 - bosluk * 25 + Math.min(20, kritikEslesme * 4)));

  return { gercekVeri: true, oneriler, bosluk, guclendir, ayarSkoru };
}

export const ONERI_TON: Record<OneriTur, "yesil" | "sari" | "kirmizi" | "gri"> = {
  guclendir: "kirmizi", koru: "yesil", gereksiz: "gri", bosluk: "kirmizi",
};
