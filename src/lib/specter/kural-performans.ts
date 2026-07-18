/**
 * Specter — Kural Performans & İsabet Analitiği Motoru
 * ====================================================
 * "Hangi kuralım gerçekten çalışıyor, hangisi ölü?" — her kuralın GERÇEK
 * etkinliğini olay verisinden ölçer: kaç kez tetiklendi, ne yakaladı (bot vs
 * insan = yanlış-pozitif riski), ölü mü (0 isabet), gereksiz mi. Kuralları
 * değere göre sıralar; budama/iyileştirme önerileri üretir.
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import { ruleMatches, type RequestContext } from "@/lib/specter/rule-engine";
import type { Rule, BotEvent, BotClass } from "@/lib/db/schema";

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

export interface KuralPerformans {
  id: string;
  ad: string;
  enabled: boolean;
  system: boolean;
  action: string;
  field: string;
  op: string;
  value: string;
  priority: number;
  /** Bu kuralın olaylarda gerçek tetiklenme sayısı. */
  isabet: number;
  /** Yakalanan olayların bot oranı (yüksek = iyi). */
  botOran: number;
  /** Yakalanan insan sayısı (yanlış-pozitif). */
  insanIsabet: number;
  /** Yanlış-pozitif riski var mı. */
  yanlisPozitif: boolean;
  /** Kuralın gölgelendiği (üst-öncelikli kural her şeyi kapıyor) — asla karar vermez. */
  golgede: boolean;
  /** Değer skoru 0-100 (isabet + saflık − yanlış-pozitif). */
  degerSkoru: number;
  durum: "yuksek-deger" | "aktif" | "dusuk-isabet" | "olu" | "riskli" | "golgede" | "pasif";
  oneri: string | null;
}

/** Bir olayı kural motoruna girdi olarak çevirir. */
function olayCtx(e: BotEvent): RequestContext {
  return {
    ip: e.ip, country: e.country, asn: e.asn, ua: e.ua, path: e.path,
    score: e.score, botClass: e.botClass as BotClass, rate: 0,
    aiAgentId: e.botClass === "ai_agent" ? "ai" : "", aiCategory: "",
    headless: e.headless, tlsUaUyumsuz: e.tlsUaUyumsuz, httpVersion: e.httpVersion,
  };
}

export interface PerformansSonuc {
  kurallar: KuralPerformans[];
  ozet: {
    toplam: number;
    aktif: number;
    olu: number; // 0 isabet
    riskli: number; // yanlış-pozitif
    golgede: number;
    ortDegerSkoru: number;
    toplamIsabet: number;
  };
}

/**
 * Kuralların gerçek olaylardaki performansını analiz eder.
 * @param rules kullanıcının kuralları (öncelik sırası önemli).
 * @param events gerçek olaylar.
 */
export function kuralPerformans(rules: Rule[], events: BotEvent[]): PerformansSonuc {
  const sirali = [...rules].sort((a, b) => a.priority - b.priority);
  const ctxler = events.map(olayCtx);
  const kurallar: KuralPerformans[] = [];

  for (const rule of sirali) {
    let isabet = 0, botIsabet = 0, insanIsabet = 0;
    let golgeIsabet = 0; // bu kural eşleşti ama daha üst kural zaten karar verdi

    for (let i = 0; i < events.length; i++) {
      if (!ruleMatches(ctxler[i], rule)) continue;
      // Bu olayda daha yüksek öncelikli (bu kuraldan önceki) bir terminal kural eşleşti mi?
      let ustKararVerdi = false;
      for (const ust of sirali) {
        if (ust.id === rule.id) break;
        if (ust.enabled && ust.action !== "flag" && ruleMatches(ctxler[i], ust)) { ustKararVerdi = true; break; }
      }
      if (ustKararVerdi && rule.action !== "flag") { golgeIsabet++; continue; }
      isabet++;
      if (events[i].botClass === "human" || events[i].botClass === "good_bot") insanIsabet++;
      else if (KOTU.has(events[i].botClass)) botIsabet++;
    }

    const botOran = isabet > 0 ? Math.round((botIsabet / isabet) * 100) : 0;
    const yanlisPozitif = insanIsabet > 0 && insanIsabet > isabet * 0.05;
    // Gölgede: hiç etkili isabet yok ama gölge-isabet çok (üst kural kapıyor).
    const golgede = rule.enabled && rule.action !== "flag" && isabet === 0 && golgeIsabet >= 5;

    // Değer skoru: isabet hacmi (log) + bot saflığı − yanlış-pozitif cezası.
    const hacimPuan = Math.min(60, Math.round(Math.log10(isabet + 1) * 30));
    const saflikPuan = Math.round(botOran * 0.35);
    const cezaYP = yanlisPozitif ? 30 : 0;
    const degerSkoru = Math.max(0, Math.min(100, hacimPuan + saflikPuan - cezaYP));

    let durum: KuralPerformans["durum"];
    let oneri: string | null = null;
    if (!rule.enabled) { durum = "pasif"; }
    else if (golgede) { durum = "golgede"; oneri = "Üst-öncelikli bir kural bu kuralın trafiğini zaten yakalıyor — sil veya önceliğini yükselt."; }
    else if (yanlisPozitif) { durum = "riskli"; oneri = `${insanIsabet} insan isteği yakalanıyor — koşulları daralt veya "engelle" yerine "doğrula" kullan.`; }
    else if (isabet === 0) { durum = "olu"; oneri = "Hiç tetiklenmedi — gereksizse sil (kural setini sadeleştir)."; }
    else if (degerSkoru >= 70) { durum = "yuksek-deger"; }
    else if (isabet < 5) { durum = "dusuk-isabet"; oneri = "Az tetikleniyor — kapsamı genişletmeyi veya kaldırmayı değerlendir."; }
    else { durum = "aktif"; }

    kurallar.push({
      id: rule.id, ad: rule.name, enabled: rule.enabled, system: rule.system,
      action: rule.action, field: rule.field, op: rule.op, value: rule.value, priority: rule.priority,
      isabet, botOran, insanIsabet, yanlisPozitif, golgede, degerSkoru, durum, oneri,
    });
  }

  kurallar.sort((a, b) => b.degerSkoru - a.degerSkoru || b.isabet - a.isabet);

  const aktifKurallar = kurallar.filter((k) => k.enabled);
  return {
    kurallar,
    ozet: {
      toplam: kurallar.length,
      aktif: aktifKurallar.length,
      olu: kurallar.filter((k) => k.durum === "olu").length,
      riskli: kurallar.filter((k) => k.durum === "riskli").length,
      golgede: kurallar.filter((k) => k.durum === "golgede").length,
      ortDegerSkoru: aktifKurallar.length ? Math.round(aktifKurallar.reduce((a, k) => a + k.degerSkoru, 0) / aktifKurallar.length) : 0,
      toplamIsabet: kurallar.reduce((a, k) => a + k.isabet, 0),
    },
  };
}

export const DURUM_ETIKET: Record<KuralPerformans["durum"], string> = {
  "yuksek-deger": "Yüksek değer", aktif: "Aktif", "dusuk-isabet": "Düşük isabet",
  olu: "Ölü kural", riskli: "Yanlış-pozitif riski", golgede: "Gölgede", pasif: "Pasif",
};
export const DURUM_RENK: Record<KuralPerformans["durum"], string> = {
  "yuksek-deger": "#16a34a", aktif: "#2f6fed", "dusuk-isabet": "#d97706",
  olu: "#94a3b8", riskli: "#dc2626", golgede: "#a16207", pasif: "#94a3b8",
};
