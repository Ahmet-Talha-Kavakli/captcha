/**
 * Specter — Otomatik Kural Önerisi Motoru
 * =======================================
 * Kullanıcının kural yazmasını beklemek yerine, Specter GÖZLEMLENEN tehditlerden
 * OTOMATİK kural taslakları üretir: en saldırgan ülkeler/ASN'ler/IP'ler/yollar/
 * bot sınıfları analiz edilir, her biri için hazır bir kural (alan/op/değer/
 * aksiyon) + TAHMİNİ ETKİ (bu kural son N olayın kaçını yakalardı) hesaplanır.
 * Kullanıcı tek tıkla mevcut kurallarına ekler.
 *
 * Zaten var olan kurallarla ÇAKIŞAN öneriler elenir (aynı alan+değer varsa öneri
 * gösterilmez). Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent, Rule, RuleField, RuleOp, RuleAction } from "@/lib/db/schema";

export type OneriTur = "ulke" | "asn" | "ip" | "path" | "botClass" | "score";

export interface KuralOnerisi {
  id: string; // deterministik
  tur: OneriTur;
  baslik: string;
  aciklama: string;
  /** Öneri gerekçesi (veriden). */
  gerekce: string;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  priority: number;
  /** Bu kural son olaylarda kaç isteği yakalardı (tahmini etki). */
  etkiSayisi: number;
  /** Yakalananların yüzdesi. */
  etkiOran: number;
  /** Güven: bu önerinin ne kadar sağlam olduğu 0-100. */
  guven: number;
  /** İnsan trafiğini de yakalar mı (yanlış-pozitif riski). */
  yanlisPozitifRiski: boolean;
}

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/** Bir alan+op+değer zaten bir kuralda var mı (çakışma önleme). */
function zatenVar(rules: Rule[], field: RuleField, value: string): boolean {
  return rules.some((r) => r.enabled && r.field === field && r.value.toLowerCase() === value.toLowerCase());
}

/** Bir kural taslağının verilen olaylarda kaç kötü isteği + kaç insan isteği yakaladığını sayar. */
function etkiHesap(events: BotEvent[], field: RuleField, value: string): { kotu: number; insan: number } {
  let kotu = 0, insan = 0;
  const v = value.toLowerCase();
  for (const e of events) {
    let eslesir = false;
    switch (field) {
      case "country": eslesir = e.country.toLowerCase() === v; break;
      case "asn": eslesir = e.asn.toLowerCase().includes(v); break;
      case "ip": eslesir = e.ip === value; break;
      case "path": eslesir = e.path.toLowerCase() === v; break;
      case "botClass": eslesir = e.botClass === value; break;
      default: eslesir = false;
    }
    if (eslesir) {
      if (e.botClass === "human" || e.botClass === "good_bot") insan++;
      else kotu++;
    }
  }
  return { kotu, insan };
}

export interface OneriSonuc {
  oneriler: KuralOnerisi[];
  ozet: { toplam: number; yuksekEtki: number; toplamYakalanabilir: number };
}

/**
 * Olaylardan otomatik kural önerileri üretir. Mevcut kurallarla çakışanlar elenir.
 */
export function kuralOnerileri(events: BotEvent[], mevcutKurallar: Rule[]): OneriSonuc {
  const kotuOlaylar = events.filter((e) => KOTU.has(e.botClass) || e.score < 0.35);
  const toplam = events.length || 1;
  const oneriler: KuralOnerisi[] = [];

  // Sayaç yardımcıları.
  const say = <T,>(list: T[], anahtar: (t: T) => string) => {
    const m = new Map<string, number>();
    for (const t of list) { const k = anahtar(t); if (k) m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const oneriEkle = (
    tur: OneriTur, field: RuleField, op: RuleOp, value: string, action: RuleAction, priority: number,
    baslik: string, aciklama: string, gerekce: string,
  ) => {
    if (zatenVar(mevcutKurallar, field, value)) return;
    const { kotu, insan } = etkiHesap(events, field, value);
    if (kotu < 3) return; // en az 3 kötü istek yakalamalı
    const etkiOran = Math.round((kotu / toplam) * 1000) / 10;
    const yanlisPozitif = insan > kotu * 0.1; // insan yakalanan kötünün %10'undan fazlaysa risk
    const guven = Math.min(100, Math.round(Math.min(kotu, 50) * 1.8 + (yanlisPozitif ? 0 : 15) - insan * 2));
    oneriler.push({
      id: `oneri_${hash(`${field}:${value}`)}`,
      tur, baslik, aciklama, gerekce,
      field, op, value, action, priority,
      etkiSayisi: kotu, etkiOran,
      guven: Math.max(10, guven),
      yanlisPozitifRiski: yanlisPozitif,
    });
  };

  // 1) En saldırgan ülkeler.
  for (const [ulke, sayi] of say(kotuOlaylar, (e) => e.country).slice(0, 4)) {
    if (sayi < 5) continue;
    oneriEkle("ulke", "country", "eq", ulke, "challenge", 8,
      `${ulke} kaynaklı trafiği doğrula`,
      `${ulke} ülkesinden gelen istekleri challenge'a tabi tut.`,
      `Son dönemde ${ulke}'den ${sayi} şüpheli/bot isteği geldi.`);
  }

  // 2) En saldırgan ASN'ler.
  for (const [asn, sayi] of say(kotuOlaylar, (e) => e.asn).slice(0, 4)) {
    if (sayi < 5) continue;
    // ASN adının ayırt edici bir parçasını değer olarak kullan (contains).
    const parca = asn.split(" ").slice(1).join(" ") || asn;
    oneriEkle("asn", "asn", "contains", parca, "block", 6,
      `${parca} ağını engelle`,
      `${asn} ağından gelen trafiği engelle (yüksek bot yoğunluğu).`,
      `Bu ASN'den ${sayi} kötü istek gözlemlendi.`);
  }

  // 3) En saldırgan tekil IP'ler.
  for (const [ip, sayi] of say(kotuOlaylar, (e) => e.ip).slice(0, 5)) {
    if (sayi < 8) continue; // tekil IP için daha yüksek eşik
    oneriEkle("ip", "ip", "eq", ip, "block", 2,
      `${ip} adresini engelle`,
      `Bu IP tek başına yoğun saldırı üretiyor; doğrudan engelle.`,
      `${ip} adresinden ${sayi} kötü istek geldi.`);
  }

  // 4) En çok saldırılan bot sınıfı (yüksek hacimliyse politika öner).
  for (const [sinif, sayi] of say(kotuOlaylar, (e) => e.botClass).slice(0, 3)) {
    if (sayi < 10) continue;
    oneriEkle("botClass", "botClass", "eq", sinif, sinif === "ai_agent" ? "challenge" : "block", 4,
      `${sinif} sınıfına politika uygula`,
      `${sinif} bot sınıfını ${sinif === "ai_agent" ? "doğrula" : "engelle"}.`,
      `${sayi} istek bu sınıfta tespit edildi.`);
  }

  // 5) Hedeflenen hassas yollar (auth/admin/api) — çok bot alan.
  const yolSay = say(kotuOlaylar.filter((e) => /login|admin|api|checkout|password|token/i.test(e.path)), (e) => e.path);
  for (const [yol, sayi] of yolSay.slice(0, 3)) {
    if (sayi < 5) continue;
    oneriEkle("path", "path", "eq", yol, "challenge", 3,
      `${yol} yolunu koru`,
      `Hassas ${yol} endpoint'ine gelen şüpheli trafiği doğrula.`,
      `${yol} yoluna ${sayi} bot isteği geldi.`);
  }

  // Etkiye göre sırala (yüksek yakalama + yüksek güven önce).
  oneriler.sort((a, b) => b.etkiSayisi - a.etkiSayisi || b.guven - a.guven);

  const yuksekEtki = oneriler.filter((o) => o.etkiSayisi >= 20 && !o.yanlisPozitifRiski).length;
  const toplamYakalanabilir = oneriler.reduce((a, o) => a + o.etkiSayisi, 0);

  return { oneriler, ozet: { toplam: oneriler.length, yuksekEtki, toplamYakalanabilir } };
}

export const ONERI_TUR_ETIKET: Record<OneriTur, string> = {
  ulke: "Ülke", asn: "Ağ (ASN)", ip: "IP adresi", path: "Endpoint", botClass: "Bot sınıfı", score: "Skor",
};
