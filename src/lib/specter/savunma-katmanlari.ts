/**
 * Specter — Savunma Katmanları Genel Durumu (Defense Layers Overview)
 * ===================================================================
 * Specter'ın çok-katmanlı savunması TEK ekranda: her katmanın ne yaptığı,
 * gözlemlenen trafikte ne kadar tehdit yakaladığı ve katmanların birbirini
 * nasıl tamamladığı. Sektör-lideri (Cloudflare/DataDome) katmanlı-savunma
 * (defense-in-depth) mimarisini şeffaf biçimde gösterir.
 *
 * 4 katman:
 *   1. Ghost-font       — hareketli-nokta challenge; "insan mı okuyor?" (OCR-kör)
 *   2. Honeypot         — görünmez tuzak alan; bot doldurur, insan asla (sıfır-YP)
 *   3. Tarayıcı tutarlılık — UA-JS çapraz-doğrulama; "iddia ettiğin tarayıcı mısın?"
 *   4. Proof-of-Work    — adaptif CPU-bulmaca; yüksek-hacim botu ekonomik caydırır
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";
import { tutarlilikAnaliz } from "@/lib/specter/tarayici-tutarlilik";

export type KatmanId = "ghost-font" | "honeypot" | "tutarlilik" | "pow";

export interface SavunmaKatman {
  id: KatmanId;
  /** Katmanın hangi soruyu yanıtladığı (i18n key ile çevrilir; TR referans). */
  soru: string;
  /** Bu katmanın gözlemlenen trafikte yakaladığı/etkilediği olay sayısı. */
  yakalanan: number;
  /** Katmanın bu trafikteki kapsama oranı (0-100). */
  kapsama: number;
  /** Katman canlı ve entegre mi (hepsi entegre — statik true). */
  aktif: boolean;
  /** Atlatma zorluğu (düşük/orta/yüksek — savunma gücü göstergesi). */
  zorluk: "orta" | "yuksek" | "kritik";
}

export interface SavunmaGenel {
  katmanlar: SavunmaKatman[];
  toplamOlay: number;
  /** En az bir katmanın yakaladığı benzersiz tehdit olayı. */
  toplamYakalanan: number;
  /** Katman-derinliği: ortalama kaç katmanın bir tehdidi yakaladığı. */
  ortDerinlik: number;
  /** Genel savunma sağlığı (0-100). */
  saglik: number;
  /** Sayaçlar gerçek katman-hit verisinden mi (true) yoksa çıkarımsal mı (false). */
  gercekVeri: boolean;
}

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

/**
 * Gözlemlenen olaylardan 4 katmanın kapsamasını türetir. Ghost-font/honeypot
 * verdict+bayraklardan, tutarlılık tutarlilikAnaliz'den, PoW düşük-skor/otomasyon
 * kombinasyonundan çıkarılır (dürüst: gerçek katman-hit sayacı değil, gözlemlenen
 * trafikten çıkarımsal kapsama).
 */
export function savunmaGenel(events: BotEvent[]): SavunmaGenel {
  const toplam = events.length || 1;
  const kotu = events.filter((e) => KOTU.has(e.botClass));

  // GERÇEK katman-hit'leri: verify akışı artık her olaya hangi katmanların
  // gerçekten tetiklendiğini (katmanHitler) yazıyor. Bu alanı taşıyan olay
  // varsa gerçek sayaç kullanılır; yoksa (eski olaylar) çıkarımsal tahmine düşer.
  const gercekVar = events.some((e) => (e.katmanHitler?.length ?? 0) > 0);
  const gercekHit = (id: KatmanId) => events.filter((e) => (e.katmanHitler ?? []).includes(id)).length;

  // Ghost-font: gerçek hit ya da (fallback) challenge edilen/engellenen olaylar.
  const ghost = gercekVar
    ? gercekHit("ghost-font")
    : events.filter((e) => e.verdict === "challenged" || e.verdict === "blocked").length;

  // Honeypot: gerçek hit ya da (fallback) kural-adı/sınıf tahmini.
  const honeypot = gercekVar
    ? gercekHit("honeypot")
    : events.filter((e) =>
        (e.triggeredRules ?? []).some((r) => /honeypot/i.test(r)) ||
        (e.botClass === "automation" || e.botClass === "scraper") && e.verdict === "blocked",
      ).length;

  // Tutarlılık: gerçek hit ya da (fallback) tutarlilikAnaliz sahte+şüpheli.
  const tut = tutarlilikAnaliz(events);
  const tutarlilik = gercekVar ? gercekHit("tutarlilik") : tut.sahte + tut.supheli;

  // PoW: gerçek hit ya da (fallback) düşük-skorlu olaylar.
  const pow = gercekVar
    ? gercekHit("pow")
    : events.filter((e) => e.score < 0.35).length;

  const katman = (
    id: KatmanId, soru: string, yakalanan: number,
    zorluk: SavunmaKatman["zorluk"],
  ): SavunmaKatman => ({
    id, soru, yakalanan, kapsama: Math.round((yakalanan / toplam) * 100), aktif: true, zorluk,
  });

  const katmanlar: SavunmaKatman[] = [
    katman("ghost-font", "İnsan mı okuyor?", ghost, "kritik"),
    katman("honeypot", "Görünmez tuzağa düştü mü?", honeypot, "yuksek"),
    katman("tutarlilik", "İddia ettiğin tarayıcı mısın?", tutarlilik, "yuksek"),
    katman("pow", "CPU maliyetini ödedi mi?", pow, "orta"),
  ];

  // Katman-derinliği: her kötü olay için kaç katmanın onu potansiyel yakaladığı.
  let derinlikTop = 0;
  for (const e of kotu) {
    let d = 0;
    if (e.verdict === "challenged" || e.verdict === "blocked") d++;
    if ((e.botClass === "automation" || e.botClass === "scraper")) d++;
    if (e.tlsUaUyumsuz || e.headless) d++;
    if (e.score < 0.35) d++;
    derinlikTop += d;
  }
  const ortDerinlik = kotu.length ? Math.round((derinlikTop / kotu.length) * 10) / 10 : 0;

  const toplamYakalanan = events.filter((e) =>
    e.verdict === "challenged" || e.verdict === "blocked" || KOTU.has(e.botClass),
  ).length;

  // Sağlık: 4 katman entegre (baz 60) + katman-derinliği bonusu (max +40).
  const saglik = Math.min(100, 60 + Math.round((ortDerinlik / 4) * 40));

  return {
    katmanlar, toplamOlay: events.length, toplamYakalanan, ortDerinlik, saglik,
    gercekVeri: gercekVar,
  };
}

export const ZORLUK_TON: Record<SavunmaKatman["zorluk"], "sari" | "kirmizi" | "brand"> = {
  orta: "sari", yuksek: "kirmizi", kritik: "brand",
};
