/**
 * Specter — Savunma Derinliği (Defense-in-Depth) Katman Analizi (saf, deterministik)
 * =================================================================================
 * Bu YEREL yardımcı (src/lib/specter DEĞİL), gözlemlenen gerçek tehdit trafiğinin
 * Specter'ın KATMANLI savunmasından nasıl süzüldüğünü çıkarır. Trafik sırayla
 * bir dizi filtreden geçer (edge rate-limit → IP itibarı → TLS/parmak izi →
 * davranış skoru → ghost-font challenge → kural motoru) ve HER katman bir kısım
 * tehdidi durdurur; kalanı bir sonraki katmana geçer. Bu bir "huni" (funnel).
 *
 * NEDEN AYRI BİR BAKIŞ:
 *   - /panel/birlesik-risk bir olayın TOPLAM risk skorunu (çok-faktörlü) verir.
 *   - /panel/kapsam bir YOLUN ne kadar korunduğunu (kapsam boşluğu) verir.
 *   - BURASI ise savunmanın SIRALI KATMANLARINI ve her katmanın yakalama oranını
 *     gösterir. Amaç: Specter'ın tek bir arıza noktası (single point of failure)
 *     olmadığını, katmanlı bir savunma (defense-in-depth) olduğunu kanıtlamak.
 *     Bir katman bir tehdidi kaçırsa bir sonraki yakalar; kümülatif koruma her
 *     katmanla derinleşir.
 *
 * ÇEKİRDEK SEZGİ — DÜRÜST ATFETME (attribution):
 *   Durdurulan her tehdit, onu durduracak İLK (sıradaki en erken) katmana atfedilir.
 *   Örn hacim/rate sinyali olan bir tehdit edge katmanına, kötü ASN itibar
 *   katmanına, TLS/UA uyumsuzluğu veya headless parmak izi katmanına, düşük skor
 *   davranış katmanına, challenge verdict'i ghost-font katmanına, kural eşleşmesi
 *   kural motoruna atfedilir. Bir tehdit birden çok sinyale sahipse EN ERKEN
 *   katman kredilendirilir (çünkü huni sırasında önce o durdururdu).
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   Girdi (olaylar) aynıysa çıktı DAİMA aynıdır → birim test edilebilir.
 *
 * DÜRÜSTLÜK NOTU:
 *   Katman atfı gerçek olay SİNYALLERİNDEN deterministik çıkarılır. Bir tehdit
 *   o katmanın sinyaline sahip olduğu için o katmana kredilendirilir — gerçek
 *   canlı ürün de aynı katmanda durdururdu. Hiçbir katmanın sinyaline uymayan
 *   ama yine de durdurulmuş (challenged/blocked) bir tehdit "kural motoru"na
 *   (son geniş ağ) düşer; hiçbir katmana takılmadan geçen (verdict allowed) bir
 *   tehdit ise "sızan tehdit" olarak dürüstçe işaretlenir — yanlış güven vermeyiz.
 */

import type { BotEvent, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Katman kimlikleri */

/** Sıralı savunma katmanı kimliği (huni sırasıyla). */
export type KatmanId =
  | "edge-rate-limit" // 1. Edge hız/hacim sınırı
  | "ip-itibar" // 2. IP itibarı / ASN
  | "tls-parmakizi" // 3. TLS parmak izi / headless tespiti
  | "davranis-skoru" // 4. Davranış (insanlık) skoru
  | "ghost-font-challenge" // 5. Ghost-font challenge
  | "kural-motoru"; // 6. Kural motoru (son geniş ağ)

/** Bir savunma katmanının statik tanımı. */
export interface Katman {
  id: KatmanId;
  ad: string;
  aciklama: string;
  /** Hangi sinyali yakalar (insan-okur). */
  yakalar: string;
  /** lucide-react ikon adı (istemci eşler). */
  ikon: string;
  /** Katman rengi (huni bandı + rozet ile tutarlı). */
  renk: string;
}

/**
 * Sıralı savunma katmanları. Trafik yukarıdan (edge) girer, aşağı doğru süzülür.
 * Her katman kendi sinyaline uyan tehditleri durdurur; kalanı sonrakine geçer.
 * Sıra ÖNEMLİDİR: atfetme "ilk eşleşen katman" mantığıyla bu diziyi izler.
 */
export const KATMANLAR: Katman[] = [
  {
    id: "edge-rate-limit",
    ad: "Edge Hız Sınırı",
    aciklama: "İlk savunma hattı. Ağ kenarında hacim/hız temelli seller ve kaba-kuvvet dalgaları daha uygulamaya varmadan kesilir.",
    yakalar: "Yüksek hacim / rate taşkını (DDoS, flood, kaba kuvvet)",
    ikon: "Gauge",
    renk: "#6366f1", // veylify-500 — edge (marka indigo ailesi)
  },
  {
    id: "ip-itibar",
    ad: "IP İtibarı",
    aciklama: "Kaynak IP ve ASN itibarı. Bilinen kötü ağlar, veri-merkezi/proxy blokları ve itibarsız kaynaklar erkenden elenir.",
    yakalar: "Kötü ASN / itibarsız IP (datacenter, botnet, kötü ağ)",
    ikon: "Globe",
    renk: "#4f46e5", // indigo-600 — itibar
  },
  {
    id: "tls-parmakizi",
    ad: "TLS Parmak İzi",
    aciklama: "TLS el-sıkışma imzası ve tarayıcı parmak izi. UA Chrome derken TLS Python olan sahte istemciler ve headless otomasyon ifşa olur.",
    yakalar: "TLS/UA uyumsuzluğu, headless tarayıcı, otomasyon imzası",
    ikon: "Fingerprint",
    renk: "#7c3aed", // violet-600 — parmak izi
  },
  {
    id: "davranis-skoru",
    ad: "Davranış Skoru",
    aciklama: "İstemci davranışından türetilen insanlık skoru. İnsan-benzeri etkileşim üretemeyen, düşük skorlu otomasyon burada yakalanır.",
    yakalar: "Düşük insanlık skoru (insan-dışı etkileşim örüntüsü)",
    ikon: "Activity",
    renk: "#db2777", // pink-600 — davranış
  },
  {
    id: "ghost-font-challenge",
    ad: "Ghost-Font Challenge",
    aciklama: "Veylify'ın imza savunması. OCR'ı %100 kör eden temporal-dithering ghost-font challenge; makine çözemez, insan geçer.",
    yakalar: "Challenge'a takılan otomasyon (OCR/bot çözemez)",
    ikon: "Ghost",
    renk: "#d97706", // amber-600 — challenge
  },
  {
    id: "kural-motoru",
    ad: "Kural Motoru",
    aciklama: "Son geniş ağ. Önceki katmanları geçen ama özel politika kurallarına (path, ülke, AI-ajan…) takılan artık tehditleri toplar.",
    yakalar: "Özel kural eşleşmesi (politika ihlali) + artık tehdit",
    ikon: "SlidersHorizontal",
    renk: "#16a34a", // green-600 — kurallar
  },
];

/** Katman id → tanım (hızlı erişim). */
const KATMAN_INDEX: Record<KatmanId, Katman> = KATMANLAR.reduce(
  (acc, k) => {
    acc[k.id] = k;
    return acc;
  },
  {} as Record<KatmanId, Katman>,
);

/** Katman tanımını id ile getir. */
export function katmanTanim(id: KatmanId): Katman {
  return KATMAN_INDEX[id];
}

/* ------------------------------------------------------------------ Sonuç tipleri */

/** Huni içinde tek bir katmanın sonucu. */
export interface KatmanSonuc {
  katman: Katman;
  /** Bu katmana kadar gelen (giren) tehdit sayısı. */
  giren: number;
  /** Bu katmanın yakaladığı (durdurduğu) tehdit sayısı. */
  yakalanan: number;
  /** Bu katmandan bir sonrakine geçen tehdit sayısı (giren - yakalanan). */
  gecen: number;
  /** Bu katmanın toplam tehdit içindeki yakalama payı (0..1). */
  yakalamaPayi: number;
  /** Bu katmana KADAR (dahil) kümülatif yakalanan tehdit sayısı. */
  kumulatifYakalanan: number;
  /** Kümülatif koruma oranı (bu katmana kadar yakalananlar / toplam tehdit, 0..1). */
  kumulatifYakalama: number;
}

/** Savunma derinliği üst-seviye özeti (kartlar için). */
export interface DerinlikOzet {
  /** Toplam savunma katmanı sayısı. */
  toplamKatman: number;
  /** Analiz edilen toplam tehdit sayısı. */
  toplamTehdit: number;
  /** Tüm katmanların toplamda yakaladığı tehdit sayısı. */
  toplamYakalanan: number;
  /** Hiçbir katmana takılmadan sonuna ulaşan (sızan) tehdit sayısı. */
  sizanTehdit: number;
  /** Genel koruma oranı (toplamYakalanan / toplamTehdit, 0..1). */
  korumaOrani: number;
  /**
   * Koruma derinliği: ortalama bir tehdit kaçıncı katmanda durduruluyor
   * (1..N). Yakalananlar üzerinden ağırlıklı ortalama katman sırası. Düşük =
   * tehditler erken (ucuz) elenir; yüksek = savunma derinlere kadar çalışır.
   */
  korumaDerinligi: number;
  /** En çok tehdit yakalayan katman (kararlı: yakalanan ↓, sonra sıra). */
  enEtkiliKatman: KatmanSonuc | null;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** 0..1'e sıkıştır (savunmacı; NaN → 0). */
function kis01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Bir olay "tehdit" mi? Savunma derinliği yalnızca kötücül trafiği izler.
 * human = gerçek kullanıcı, good_bot = Googlebot/Bingbot gibi meşru botlar →
 * ikisi de tehdit sayılmaz. Kalan tüm sınıflar (otomasyon/kazıyıcı/kimlik-
 * denemesi/ai/ddos/spam) savunmanın süzmesi beklenen tehdit trafiğidir.
 */
export function tehditMi(botClass: BotClass): boolean {
  return botClass !== "human" && botClass !== "good_bot";
}

/**
 * Rate/hacim temelli bir edge sinyali var mı? DDoS sınıfı doğrudan hacimseldir;
 * ayrıca tetiklenen kurallar arasında rate/flood/hız/hacim geçen tehditler de
 * edge katmanına aittir (edge rate-limit onları kenarda keserdi).
 */
function edgeSinyali(e: BotEvent): boolean {
  if (e.botClass === "ddos") return true;
  const kurallar = (e.triggeredRules ?? []).join(" ").toLowerCase();
  return /rate|rat[ae]|flood|hacim|hız|hiz|dakika|per-min|per_min|burst|taşkın|taskin|limit/.test(kurallar);
}

/**
 * IP itibarı sinyali var mı? ASN metni bilinen datacenter/hosting/proxy/tor/vpn
 * sağlayıcılarına işaret ediyorsa ya da tetiklenen kurallar itibar/asn/ülke
 * temelliyse (geo-blok, itibar listesi) itibar katmanına aittir.
 */
function itibarSinyali(e: BotEvent): boolean {
  const asn = (e.asn ?? "").toLowerCase();
  if (/amazon|aws|google cloud|gcp|digitalocean|ovh|hetzner|linode|vultr|azure|alibaba|tencent|datacenter|hosting|colo|m247|leaseweb|contabo|choopa/.test(asn)) {
    return true;
  }
  const kurallar = (e.triggeredRules ?? []).join(" ").toLowerCase();
  return /itibar|reputation|asn|datacenter|proxy|tor|vpn|geo|ülke|ulke|country|blocklist|kara-liste|karaliste/.test(kurallar);
}

/**
 * TLS/parmak izi sinyali var mı? tlsUaUyumsuz bayrağı, headless bayrağı,
 * otomasyon bayrakları ya da tetiklenen kurallar tls/parmak-izi/headless
 * temelliyse parmak izi katmanına aittir.
 */
function parmakIziSinyali(e: BotEvent): boolean {
  if (e.tlsUaUyumsuz) return true;
  if (e.headless) return true;
  if (Array.isArray(e.automationFlags) && e.automationFlags.length > 0) return true;
  if (e.engine === "None") return true;
  const kurallar = (e.triggeredRules ?? []).join(" ").toLowerCase();
  return /tls|ja3|ja4|parmak|fingerprint|headless|webdriver|cdp|otomasyon|automation|selenium|puppeteer|playwright/.test(kurallar);
}

/**
 * Davranış skoru sinyali var mı? İnsanlık skoru düşükse (< eşik) davranış
 * katmanı onu yakalar. Skor 0..1; 0.35 altı insan-dışı örüntü sayılır.
 */
const DAVRANIS_ESIK = 0.35;
function davranisSinyali(e: BotEvent): boolean {
  return Number.isFinite(e.score) && e.score < DAVRANIS_ESIK;
}

/**
 * Ghost-font challenge sinyali var mı? verdict "challenged" ise tehdit tam da
 * bu katmanda (challenge'a takılıp) durdurulmuştur.
 */
function challengeSinyali(e: BotEvent): boolean {
  return e.verdict === "challenged";
}

/**
 * Kural motoru sinyali var mı? Tetiklenmiş en az bir kural varsa (özel politika
 * eşleşmesi) kural motoru onu durdurur. Kural motoru aynı zamanda son geniş ağ:
 * durdurulmuş (blocked) ama başka hiçbir sinyale uymayan tehditler de buraya düşer.
 */
function kuralSinyali(e: BotEvent): boolean {
  if (Array.isArray(e.triggeredRules) && e.triggeredRules.length > 0) return true;
  // Son geniş ağ: durdurulmuş ama başka sinyali olmayan artık tehdit.
  if (e.verdict === "blocked" || e.verdict === "flagged") return true;
  return false;
}

/**
 * Bir tehdidi durduracak İLK (en erken) katmanı belirle. Huni sırasını izler;
 * ilk uyan katmanı döndürür. Hiçbir katmana uymuyorsa null → tehdit sızmıştır.
 */
export function atfet(e: BotEvent): KatmanId | null {
  if (edgeSinyali(e)) return "edge-rate-limit";
  if (itibarSinyali(e)) return "ip-itibar";
  if (parmakIziSinyali(e)) return "tls-parmakizi";
  if (davranisSinyali(e)) return "davranis-skoru";
  if (challengeSinyali(e)) return "ghost-font-challenge";
  if (kuralSinyali(e)) return "kural-motoru";
  return null;
}

/* ------------------------------------------------------------------ Ana analiz */

/**
 * Olaylardan katmanlı savunma hunisini kurar. Her tehdit onu durduracak ilk
 * katmana atfedilir; huni katman-katman daralır. Sızanlar (hiçbir katmana
 * takılmayan) huniden çıkar.
 *
 * Dönen dizi KATMANLAR sırasındadır (edge → kural motoru). Her katman için:
 *   giren   = bu katmana ulaşan tehdit (önceki katmanların geçirdiği),
 *   yakalanan = bu katmanın durdurduğu,
 *   gecen   = sonrakine geçen,
 *   kümülatif yakalama = bu katmana kadar yakalananların toplam paya oranı.
 */
export function katmanAnaliz(events: BotEvent[]): KatmanSonuc[] {
  // Yalnızca tehdit olaylarını atfet; her tehdit ilk uyan katmana kredilenir.
  const yakalananSayac: Record<KatmanId, number> = {
    "edge-rate-limit": 0,
    "ip-itibar": 0,
    "tls-parmakizi": 0,
    "davranis-skoru": 0,
    "ghost-font-challenge": 0,
    "kural-motoru": 0,
  };
  let toplamTehdit = 0;

  for (const e of events) {
    if (!tehditMi(e.botClass)) continue;
    toplamTehdit++;
    const katmanId = atfet(e);
    if (katmanId) yakalananSayac[katmanId]++;
    // katmanId null ise: hiçbir katmana takılmadı → sızan (huni sonunda hesaplanır).
  }

  // Huniyi sırayla ör: giren, yakalanan, geçen.
  const sonuc: KatmanSonuc[] = [];
  let giren = toplamTehdit; // ilk katman TÜM tehditleri görür
  let kumulatif = 0;
  for (const katman of KATMANLAR) {
    const yakalanan = yakalananSayac[katman.id];
    const gecen = Math.max(0, giren - yakalanan);
    kumulatif += yakalanan;
    sonuc.push({
      katman,
      giren,
      yakalanan,
      gecen,
      yakalamaPayi: toplamTehdit ? kis01(yakalanan / toplamTehdit) : 0,
      kumulatifYakalanan: kumulatif,
      kumulatifYakalama: toplamTehdit ? kis01(kumulatif / toplamTehdit) : 0,
    });
    giren = gecen; // sonraki katman yalnızca geçenleri görür
  }
  return sonuc;
}

/**
 * Katman sonuçlarından + toplam tehditten üst-seviye derinlik özeti üretir.
 * korumaDerinligi: yakalananların katman sırasıyla ağırlıklı ortalaması (1..N);
 * ortalama tehdidin kaç katman derinde durdurulduğunu verir.
 */
export function derinlikOzet(katmanlar: KatmanSonuc[], toplamTehdit: number): DerinlikOzet {
  let toplamYakalanan = 0;
  let agirlikliDerinlikToplam = 0; // Σ (katman-sırası × yakalanan)
  let enEtkiliKatman: KatmanSonuc | null = null;

  katmanlar.forEach((k, i) => {
    const sira = i + 1; // 1-tabanlı katman derinliği
    toplamYakalanan += k.yakalanan;
    agirlikliDerinlikToplam += sira * k.yakalanan;

    // En etkili = en çok yakalayan katman. Kararlı: yakalanan ↓, sonra erken sıra.
    if (k.yakalanan > 0) {
      if (!enEtkiliKatman || k.yakalanan > enEtkiliKatman.yakalanan) {
        enEtkiliKatman = k;
      }
    }
  });

  const sizanTehdit = Math.max(0, toplamTehdit - toplamYakalanan);
  const korumaOrani = toplamTehdit ? kis01(toplamYakalanan / toplamTehdit) : 0;
  // Derinlik yalnızca yakalananlar üzerinden anlamlıdır (sızanların katmanı yok).
  const korumaDerinligi = toplamYakalanan ? agirlikliDerinlikToplam / toplamYakalanan : 0;

  return {
    toplamKatman: katmanlar.length,
    toplamTehdit,
    toplamYakalanan,
    sizanTehdit,
    korumaOrani,
    korumaDerinligi,
    enEtkiliKatman,
  };
}
