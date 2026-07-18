/**
 * Specter — İşlem Kanıtı (Proof-of-Work / Hesaplama Zorluğu)
 * =========================================================
 * PoW, isteği KABUL ETMEDEN ÖNCE istemciye küçük bir HESAPLAMA BULMACASI
 * çözdüren bir savunmadır (hashcash / Cloudflare / Anubis mantığı). Sunucu bir
 * "hedef zorluk" (baştaki sıfır-bit sayısı) yayınlar; istemci, hash'i bu hedefi
 * karşılayan bir "nonce" bulana kadar deneme yapmak zorundadır. Bulmaca:
 *
 *   • İNSAN için görünmezdir: bir kez ~50-500 ms bekler, fark etmez.
 *   • BOT için pahalıdır: milyonlarca istek yapan saldırgan, bulmacayı
 *     milyonlarca kez çözmek zorundadır → CPU/saat maliyeti patlar → caydırılır.
 *
 * Yani PoW, HACİM saldırılarını (kimlik doldurma, kazıma, DDoS) EKONOMİK olarak
 * pahalılaştırır; tekil meşru kullanıcıya neredeyse hiç maliyet bindirmez.
 *
 * ADAPTİF ZORLUK: bot olasılığı yükseldikçe (davranış skoru düştükçe) hedef
 * sıfır-bit sayısını artırırız. Şüpheli/bot trafiği daha ağır bulmaca çözer,
 * temiz insan trafiği hafif bulmaca çözer. Böylece sürtünme yalnızca riskli
 * trafiğe biner.
 *
 * SAFLIK: Bu modül deterministiktir (Date.now / Math.random YOKTUR — tüm çıktı
 * GİRDİLERDEN türetilir). Doğrulama GERÇEK hashcash'tir: powDogrula, istemci
 * hash'ini SHA-256(seed:nonce) ile YENİDEN HESAPLAYIP eşleştirir (crypto.hash)
 * ve ancak sonra baştaki sıfır-bit hedefini denetler. Bu iki-adım şarttır —
 * yalnızca sıfır-bit saymak, uydurma "0000…"-hash ile CPU'suz bypass'a açıktır.
 *
 * DÜRÜSTLÜK NOTU: Zorluk seçimi ve doğrulama GERÇEK bir mekanizmadır. Ekonomi
 * rakamları (saat maliyeti, caydırıcılık katı) ise gözlemlenen olay hacmine
 * dayanan MODEL/gösterim amaçlı tahminlerdir — kesin ölçüm değil.
 */
import crypto from "node:crypto";
import type { BotEvent } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sabitler / model parametreleri */

/**
 * Referans donanım varsayımı: modern bir istemci ~1 milyon hash/saniye
 * (SHA-256, tek çekirdek, JS/WebCrypto) üretebilir. Bulmaca maliyeti
 * 2^bit deneme olduğundan, gecikme = 2^bit / HASH_HIZI_SN.
 * Bu SEKTÖR REFERANS TAHMİNİDİR; kesin değil, model amaçlı.
 */
export const HASH_HIZI_SN = 1_000_000; // hash/saniye (tek istemci, tahmini)

/** İnsan trafiği için taban hedef bit (görünmez: ~65 ms). */
export const TABAN_ZORLUK_BIT = 16;
/** Hedef bitin bineceği tavan (aşırı sürtünmeyi önlemek için). */
export const AZAMI_ZORLUK_BIT = 26;

/* ------------------------------------------------------------------ Tipler */

/** Zorluk katmanı (görsel + gruplama için ayrık enum). */
export type ZorlukKatman = "insan" | "supheli" | "muhtemel_bot" | "bot";

/** powZorluk çıktısı — bir istek için seçilen bulmaca zorluğu. */
export interface ZorlukSecim {
  /** Hedef baştaki sıfır-bit sayısı (hash bunu karşılamalı). */
  hedefBit: number;
  /** Beklenen deneme sayısı (2^bit) — istemcinin ortalama iş yükü. */
  tahminiDeneme: number;
  /** İnsanın tek seferde bekleyeceği tahmini gecikme (ms). */
  insanGecikmeMs: number;
  /** Bu zorluk, taban zorluğa göre botun maliyetini kaç kat yükseltir. */
  botMaliyetKat: number;
  /** Hangi katmana düştüğü. */
  katman: ZorlukKatman;
}

/** powDogrula çıktısı — bir çözümün geçerlilik denetimi. */
export interface DogrulamaSonuc {
  /** Çözüm geçerli mi (baştaki sıfır bitleri >= gerekli zorluk). */
  gecerli: boolean;
  /** Hash'te fiilen kaç baştaki sıfır-bit var. */
  oncekiSifirBit: number;
}

/** powEkonomi çıktısı — saldırgan maliyet modeli. */
export interface EkonomiSonuc {
  /** Tek bir çözümün insana maliyeti (saniye). */
  insanMaliyetSn: number;
  /** Saldırganın tüm hacmi çözmesi için toplam CPU-saat. */
  botToplamSaatMaliyet: number;
  /** Saldırının kaç kat yavaşladığı (bulmaca olmadan → bulmacayla). */
  saldiriEngeli: number;
  /** Caydırıcılık katı (insan tek maliyetine göre botun toplam maliyeti). */
  caydiricilikKat: number;
}

/** powDagitim: tek katmanın dağılımdaki payı. */
export interface KatmanDagilim {
  katman: ZorlukKatman;
  hedefBit: number;
  /** Bu katmana düşen olay sayısı. */
  olaySayisi: number;
  /** Toplam içindeki yüzde (0-100). */
  yuzde: number;
  /** Bu katmandaki olayların saldırgana yüklediği tahmini CPU-saat. */
  saatMaliyet: number;
}

/** powDagitim çıktısı — tüm olay kümesinin zorluk dağılımı + toplam maliyet. */
export interface DagilimRaporu {
  katmanlar: KatmanDagilim[];
  toplamOlay: number;
  /** Kötü/şüpheli sayılan (insan-dışı katmanlardaki) olay sayısı. */
  supheliOlay: number;
  /** Saldırgana yüklenen toplam tahmini CPU-saat maliyeti. */
  toplamSaatMaliyet: number;
  /** Ortalama hedef bit (tüm olaylar üzerinden). */
  ortHedefBit: number;
}

/* ------------------------------------------------------------------ Katman renk/etiket haritası */

/** Katman → görsel ton (kit Badge/DurumRozeti tonlarıyla uyumlu anahtarlar). */
export const KATMAN_RENK: Record<ZorlukKatman, { ton: "ok" | "warn" | "danger" | "brand"; nokta: string }> = {
  insan: { ton: "ok", nokta: "bg-ok" },
  supheli: { ton: "warn", nokta: "bg-warn" },
  muhtemel_bot: { ton: "danger", nokta: "bg-danger2" },
  bot: { ton: "danger", nokta: "bg-danger2" },
};

/** Katman sırası (görsel dağılım çizerken sabit sıra). */
export const KATMAN_SIRA: ZorlukKatman[] = ["insan", "supheli", "muhtemel_bot", "bot"];

/* ------------------------------------------------------------------ Yardımcılar (saf) */

/**
 * Bir hex dizesindeki BAŞTAKI SIFIR BİT sayısını sayar. Örn:
 *   "000abc..." → her '0' nibble = 4 bit → 3×4 = 12; 'a' = 1010, baştan 0 yok.
 *   → 12 baştaki sıfır bit.
 * Saf hex ayrıştırması; crypto kütüphanesi gerektirmez.
 */
export function bastakiSifirBit(hashHex: string): number {
  // Olası "0x" önekini ve boşlukları temizle, küçük harfe indir.
  const h = hashHex.trim().toLowerCase().replace(/^0x/, "");
  let bit = 0;
  for (const ch of h) {
    const nibble = parseInt(ch, 16);
    if (Number.isNaN(nibble)) break; // hex-dışı karakter → dur
    if (nibble === 0) {
      bit += 4; // bütün nibble sıfır → 4 bit
      continue;
    }
    // İlk sıfır-olmayan nibble: içindeki baştaki sıfır bitlerini say (0..3).
    // 32 - clz32(nibble) = nibble'ın anlamlı bit sayısı; 4 - o = baştaki sıfır.
    bit += 4 - (32 - Math.clz32(nibble));
    break; // ilk sıfır-olmayan nibble'dan sonra dururuz
  }
  return bit;
}

/** Bit sayısını katmana çevir (zorluk eşiklerine göre). */
function katmanBul(bit: number): ZorlukKatman {
  if (bit <= 16) return "insan";
  if (bit <= 20) return "supheli";
  if (bit <= 24) return "muhtemel_bot";
  return "bot";
}

/* ------------------------------------------------------------------ 1) Adaptif zorluk */

/**
 * powZorluk — bot olasılığına göre adaptif bulmaca zorluğu seçer.
 * @param botOlasilik 0..1 (yüksek = bot); tipik olarak `1 - score`.
 * @param tabanZorluk taban hedef bit (varsayılan TABAN_ZORLUK_BIT = 16).
 *
 * Mantık: insan (~0 bot-olasılık) taban bitte kalır (~16 bit, görünmez);
 * şüpheli ~20 bit; muhtemel-bot ~24 bit. Bot olasılığı arttıkça hedef bit
 * lineer büyür, tavana (AZAMI_ZORLUK_BIT) sıkışır.
 */
export function powZorluk(botOlasilik: number, tabanZorluk: number = TABAN_ZORLUK_BIT): ZorlukSecim {
  const p = Math.max(0, Math.min(1, botOlasilik));
  const taban = Math.max(1, Math.round(tabanZorluk));
  // İnsan bandı: düşük bot-olasılığı (temiz trafik) tabanda kalır — meşru
  // kullanıcıya fazladan sürtünme bindirmeyiz. Ancak eşiğin (INSAN_ESIK)
  // üstünde zorluk lineer tırmanır.
  const INSAN_ESIK = 0.15;
  let hedefBit: number;
  if (p <= INSAN_ESIK) {
    hedefBit = taban;
  } else {
    // Kalan aralığı [esik..1] → [0..1] normalize edip taban+aralığa yay.
    const norm = (p - INSAN_ESIK) / (1 - INSAN_ESIK);
    const ek = Math.round(norm * (AZAMI_ZORLUK_BIT - taban));
    hedefBit = Math.min(AZAMI_ZORLUK_BIT, taban + ek);
  }

  const tahminiDeneme = Math.pow(2, hedefBit);
  const insanGecikmeMs = (tahminiDeneme / HASH_HIZI_SN) * 1000;
  // Botun maliyeti tabana göre kaç kat: 2^(hedef - taban).
  const botMaliyetKat = Math.pow(2, hedefBit - taban);

  return {
    hedefBit,
    tahminiDeneme,
    insanGecikmeMs: Math.round(insanGecikmeMs * 10) / 10,
    botMaliyetKat: Math.round(botMaliyetKat * 100) / 100,
    katman: katmanBul(hedefBit),
  };
}

/* ------------------------------------------------------------------ 2) Çözüm doğrulama */

/**
 * powDogrula — bir çözümü (seed + nonce + hash) doğrular. İKİ ADIM (hashcash):
 *   1) BÜTÜNLÜK: hash GERÇEKTEN SHA-256(seed:nonce) mı? Sunucu yeniden hesaplar
 *      ve istemci hash'iyle sabit-zamanlı karşılaştırır. Bu adım OLMADAN bot,
 *      hiç CPU harcamadan uydurma bir "0000…"-hash gönderip PoW'u bypass eder.
 *   2) HEDEF: doğrulanmış hash'in baştaki sıfır bitleri >= gerekli zorluk mu?
 *
 * @param zorlukBit gerekli baştaki sıfır-bit sayısı.
 * @param seed challenge'ın yayınladığı tohum (sunucu-tarafı; token'da taşınır).
 * @param nonce istemcinin bulduğu nonce.
 * @param hashHex istemcinin ürettiği hash (hex) — yeniden hesapla ve eşleştir.
 *
 * İstemci (widget) SHA-256(`${seed}:${nonce}`) hex üretir; sunucu birebir aynısını
 * hesaplar. Format değişirse İKİ taraf da güncellenmelidir (public/veylify.js +
 * public/specter.js: `enc.encode(seed + ":" + nonce)`).
 */
export function powDogrula(zorlukBit: number, seed: string, nonce: string, hashHex: string): DogrulamaSonuc {
  const oncekiSifirBit = bastakiSifirBit(hashHex);
  const gerekli = Math.max(0, Math.round(zorlukBit));
  // 1) BÜTÜNLÜK: hash === SHA-256(seed:nonce)? (uydurma-hash bypass'ı önler)
  const beklenen = crypto.createHash("sha256").update(`${seed}:${nonce}`).digest("hex");
  const istemci = String(hashHex).trim().toLowerCase().replace(/^0x/, "");
  let hashDogru = false;
  try {
    const a = Buffer.from(beklenen, "hex");
    const b = Buffer.from(istemci, "hex");
    hashDogru = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    hashDogru = false;
  }
  return {
    // Hem hash gerçek OLMALI hem hedef sıfır-biti karşılanmalı.
    gecerli: hashDogru && oncekiSifirBit >= gerekli,
    oncekiSifirBit,
  };
}

/* ------------------------------------------------------------------ 3) Saldırgan ekonomisi */

/**
 * powEkonomi — bir zorluk seviyesinde saldırgan maliyet modeli.
 * @param zorlukBit hedef bit.
 * @param saldiriHacmi saldırganın yapmak istediği istek sayısı (N).
 * @param cozumMs bir çözümün ortalama süresi (ms) — verilmezse 2^bit/hız'dan türetilir.
 *
 * İnsan tek bulmacayı bir kez çözer (küçük maliyet). Saldırgan N istek için
 * N bulmaca çözer → N × cozumMs toplam CPU süresi → CPU-saat. Caydırıcılık:
 * botun toplam maliyetinin, tek bir insanın maliyetine oranı.
 */
export function powEkonomi(zorlukBit: number, saldiriHacmi: number, cozumMs?: number): EkonomiSonuc {
  const bit = Math.max(0, Math.round(zorlukBit));
  const N = Math.max(0, Math.round(saldiriHacmi));
  // Bir çözümün süresi (ms): verilmezse deneme/hız'dan türet.
  const tekMs = cozumMs != null && cozumMs > 0 ? cozumMs : (Math.pow(2, bit) / HASH_HIZI_SN) * 1000;

  const insanMaliyetSn = tekMs / 1000;
  const botToplamSn = insanMaliyetSn * N;
  const botToplamSaatMaliyet = botToplamSn / 3600;

  // Saldırı engeli: PoW yokken 1 istek ~ihmal edilebilir (0.05 ms varsayımı);
  // PoW ile tekMs. Engel = tekMs / basePowsuzMs.
  const powsuzMs = 0.05; // PoW'suz bir isteğin işlem maliyeti (tahmini)
  const saldiriEngeli = tekMs / powsuzMs;

  const caydiricilikKat = insanMaliyetSn > 0 ? botToplamSn / insanMaliyetSn : N;

  return {
    insanMaliyetSn: Math.round(insanMaliyetSn * 10000) / 10000,
    botToplamSaatMaliyet: Math.round(botToplamSaatMaliyet * 100) / 100,
    saldiriEngeli: Math.round(saldiriEngeli),
    caydiricilikKat: Math.round(caydiricilikKat),
  };
}

/* ------------------------------------------------------------------ 4) Olay dağılımı */

/**
 * powDagitim — gözlemlenen olayların HER BİRİNİN skoruna göre HANGİ zorluğu
 * alacağını simüle eder (botOlasilik = 1 - score), katmanlara gruplar ve
 * saldırgana yüklenen toplam tahmini CPU-saat maliyetini hesaplar.
 *
 * Böylece "gerçek trafiğime PoW uygulasaydım kime ne kadar bulmaca binerdi ve
 * hacim saldırganına toplam ne kadar maliyet çıkardı" sorusunu yanıtlar.
 * Saf/deterministik: verilen olaylar tek girdidir.
 */
export function powDagitim(events: BotEvent[]): DagilimRaporu {
  // Katman → biriktirici.
  const kova: Record<ZorlukKatman, { olay: number; saat: number; bitTop: number }> = {
    insan: { olay: 0, saat: 0, bitTop: 0 },
    supheli: { olay: 0, saat: 0, bitTop: 0 },
    muhtemel_bot: { olay: 0, saat: 0, bitTop: 0 },
    bot: { olay: 0, saat: 0, bitTop: 0 },
  };

  let toplamBit = 0;
  for (const e of events) {
    const skor = typeof e.score === "number" ? e.score : 1;
    const botOlasilik = 1 - Math.max(0, Math.min(1, skor));
    const z = powZorluk(botOlasilik);
    const k = z.katman;
    kova[k].olay += 1;
    kova[k].bitTop += z.hedefBit;
    toplamBit += z.hedefBit;
    // Bu tek olayın saldırgana maliyeti: bir çözümlük CPU-saat.
    const tekSaat = z.tahminiDeneme / HASH_HIZI_SN / 3600;
    kova[k].saat += tekSaat;
  }

  const toplamOlay = events.length;
  const toplamSaatMaliyet = KATMAN_SIRA.reduce((a, k) => a + kova[k].saat, 0);
  const supheliOlay = toplamOlay - kova.insan.olay;

  const katmanlar: KatmanDagilim[] = KATMAN_SIRA.map((k) => {
    const b = kova[k];
    // Katmanın temsili hedef biti: içindeki olayların ortalaması, yoksa eşik.
    const hedefBit = b.olay > 0 ? Math.round(b.bitTop / b.olay) : katmanEsikBit(k);
    return {
      katman: k,
      hedefBit,
      olaySayisi: b.olay,
      yuzde: toplamOlay > 0 ? Math.round((b.olay / toplamOlay) * 1000) / 10 : 0,
      saatMaliyet: Math.round(b.saat * 10000) / 10000,
    };
  });

  return {
    katmanlar,
    toplamOlay,
    supheliOlay,
    toplamSaatMaliyet: Math.round(toplamSaatMaliyet * 10000) / 10000,
    ortHedefBit: toplamOlay > 0 ? Math.round((toplamBit / toplamOlay) * 10) / 10 : 0,
  };
}

/** Katmanın temsili eşik biti (boş katman için görüntüleme amaçlı). */
function katmanEsikBit(k: ZorlukKatman): number {
  switch (k) {
    case "insan":
      return 16;
    case "supheli":
      return 20;
    case "muhtemel_bot":
      return 24;
    case "bot":
      return 26;
  }
}
