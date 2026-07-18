/**
 * Specter — Coğrafi Tehdit Isı Haritası motoru (SAF)
 * ===================================================
 * BotEvent akışını ülke/bölge düzeyinde "tehdit yoğunluğu" ısı haritasına
 * dönüştürür. Canlı Saldırı Haritası (/panel/harita) anlık PoP işaretçileri
 * gösterirken; bu modül choropleth-benzeri bir YOĞUNLUK skorunu, zaman-dilimli
 * evrimini ve ülke drill-down'ını üretir.
 *
 * DETERMİNİZM: Bu dosya SAF'tır — Date.now / Math.random / new Date YOKTUR.
 * Zamanla ilgili her hesap için çağıran `bugun` (ms epoch) geçirir. Böylece
 * test edilebilir ve sunucu/istemci arasında tutarlıdır.
 *
 * Yoğunluk puanı (0-100) üç bileşenden harmanlanır:
 *   1. Bot hacmi     — o ülkedeki insan-dışı olay sayısının log-ölçekli payı
 *   2. Engelleme oranı — engellenen+doğrulanan / toplam (tehdit yüzdesi)
 *   3. Düşük skor      — ortalama insanlık skorunun tersi (bot-benzeri trafik)
 * Ağırlıklar sabit; sonuç 0..100 arası clamp'lenir.
 */

/* --------------------------------------------------------------- girdi tipi */

/**
 * Motorun ihtiyaç duyduğu minimal olay şekli. `Events.forOwner` tam BotEvent
 * döndürür ama biz yalnızca şu alanları okuruz — böylece lib bağımsız ve test
 * edilebilir kalır.
 */
export interface GeoOlay {
  ts: number;
  country: string; // ISO2
  asn: string;
  botClass: string;
  verdict: string;
  score: number; // 0..1 insanlık skoru (düşük = bot)
}

/* --------------------------------------------------------------- yardımcılar */

/** İnsan/iyi-bot dışındaki her sınıf "tehdit sınıfı" (bot) sayılır. */
export function botMu(botClass: string): boolean {
  return botClass !== "human" && botClass !== "good_bot";
}

/** Engellenen VEYA doğrulanan (challenged) → aktif tehdit yanıtı. */
function engellendiMi(verdict: string): boolean {
  return verdict === "blocked" || verdict === "challenged";
}

/** Sayıyı [alt, ust] aralığına sıkıştır. */
function kelepce(x: number, alt: number, ust: number): number {
  return x < alt ? alt : x > ust ? ust : x;
}

/* --------------------------------------------------------------- ülke yoğunluğu */

export interface UlkeYogunluk {
  /** ISO2 ülke kodu. */
  ulke: string;
  /** Toplam olay sayısı. */
  toplam: number;
  /** İnsan-dışı (bot) olay sayısı. */
  bot: number;
  /** Engellenen + doğrulanan olay sayısı. */
  engellenen: number;
  /** Bot oranı (bot / toplam), 0..1. */
  botOran: number;
  /** Engelleme oranı (engellenen / toplam), 0..1. */
  engelOran: number;
  /** Ortalama insanlık skoru (0..1). Düşük = bot-benzeri. */
  ortSkor: number;
  /** Harmanlanmış yoğunluk puanı 0..100 (ısı haritası tonu bundan). */
  yogunlukPuan: number;
  /** En çok olay üreten ASN (ham metin, örn "AS15169 Google LLC"). */
  topAsn: string | null;
  /** Baskın tehdit sınıfı (bot sınıfları içinde en yaygın; yoksa null). */
  dominantBotClass: string | null;
  /** ASN → olay sayısı (drill-down için, azalan sıralı sonradan üretilir). */
  asnSayac: Record<string, number>;
  /** Bot sınıfı → olay sayısı (drill-down kırılımı). */
  botSinifSayac: Record<string, number>;
}

/** Bir ülke toplayıcısını hazırlar. */
function bosUlke(ulke: string): UlkeYogunluk {
  return {
    ulke,
    toplam: 0,
    bot: 0,
    engellenen: 0,
    botOran: 0,
    engelOran: 0,
    ortSkor: 0,
    yogunlukPuan: 0,
    topAsn: null,
    dominantBotClass: null,
    asnSayac: {},
    botSinifSayac: {},
  };
}

/**
 * Olay listesinden ülke bazlı yoğunluk haritası üretir (azalan yoğunluk sıralı).
 *
 * Yoğunluk puanı harmanı — deterministik ve monoton:
 *   hacimPuan   = log2(1 + bot) / log2(1 + enBuyukBot)   → 0..1 (ülkeler arası göreli)
 *   engelPuan   = engelOran                               → 0..1
 *   skorPuan    = 1 - ortSkor                             → 0..1 (düşük skor = yüksek tehdit)
 *   yogunluk    = 100 * (0.5*hacimPuan + 0.3*engelPuan + 0.2*skorPuan)
 *
 * Hacim log-ölçekli çünkü tek bir dev ülke diğerlerini "0"a ezmesin — göreli
 * ama okunur bir ısı dağılımı isteriz.
 */
export function ulkeYogunluk(olaylar: GeoOlay[]): UlkeYogunluk[] {
  const harita = new Map<string, UlkeYogunluk & { skorTop: number }>();

  for (const e of olaylar) {
    const kod = (e.country || "").toUpperCase();
    if (!kod) continue;
    let u = harita.get(kod);
    if (!u) {
      u = { ...bosUlke(kod), skorTop: 0 };
      harita.set(kod, u);
    }
    u.toplam++;
    u.skorTop += typeof e.score === "number" ? e.score : 0;
    if (botMu(e.botClass)) {
      u.bot++;
      u.botSinifSayac[e.botClass] = (u.botSinifSayac[e.botClass] ?? 0) + 1;
    }
    if (engellendiMi(e.verdict)) u.engellenen++;
    if (e.asn) u.asnSayac[e.asn] = (u.asnSayac[e.asn] ?? 0) + 1;
  }

  const liste = [...harita.values()];
  // Log-ölçekli hacim normalizasyonu için en büyük bot hacmini bul.
  const enBuyukBot = liste.reduce((m, u) => Math.max(m, u.bot), 0);
  const logPay = Math.log2(1 + enBuyukBot) || 1;

  const sonuc: UlkeYogunluk[] = liste.map((u) => {
    const botOran = u.toplam > 0 ? u.bot / u.toplam : 0;
    const engelOran = u.toplam > 0 ? u.engellenen / u.toplam : 0;
    const ortSkor = u.toplam > 0 ? u.skorTop / u.toplam : 1;

    const hacimPuan = enBuyukBot > 0 ? Math.log2(1 + u.bot) / logPay : 0;
    const skorPuan = 1 - ortSkor; // düşük skor → yüksek tehdit
    const yogunlukPuan = kelepce(
      Math.round(100 * (0.5 * hacimPuan + 0.3 * engelOran + 0.2 * skorPuan)),
      0,
      100,
    );

    // En yoğun ASN.
    let topAsn: string | null = null;
    let asnEnCok = -1;
    for (const [asn, n] of Object.entries(u.asnSayac)) {
      if (n > asnEnCok) {
        asnEnCok = n;
        topAsn = asn;
      }
    }
    // Baskın bot sınıfı.
    let dominantBotClass: string | null = null;
    let botEnCok = -1;
    for (const [cls, n] of Object.entries(u.botSinifSayac)) {
      if (n > botEnCok) {
        botEnCok = n;
        dominantBotClass = cls;
      }
    }

    return {
      ulke: u.ulke,
      toplam: u.toplam,
      bot: u.bot,
      engellenen: u.engellenen,
      botOran,
      engelOran,
      ortSkor,
      yogunlukPuan,
      topAsn,
      dominantBotClass,
      asnSayac: u.asnSayac,
      botSinifSayac: u.botSinifSayac,
    };
  });

  // Yoğunluk azalan; eşitlikte toplam hacim azalan; sonra ISO2 alfabetik
  // (deterministik bağ-çözümü).
  sonuc.sort(
    (a, b) =>
      b.yogunlukPuan - a.yogunlukPuan ||
      b.toplam - a.toplam ||
      a.ulke.localeCompare(b.ulke),
  );
  return sonuc;
}

/* --------------------------------------------------------------- ısı rengi */

/** Bir yoğunluk kademesi (efsane/legend + rozet için). */
export interface IsiKademe {
  /** Alt sınır (dahil). */
  alt: number;
  /** Renk (hex). */
  renk: string;
  /** Türkçe etiket. */
  etiket: string;
}

/**
 * Yeşil → sarı → turuncu → kırmızı ısı ölçeği kademeleri (yüksekten düşüğe
 * kontrol edilir). `isiRengi` ve efsane bunu paylaşır → tutarlılık garanti.
 */
export const ISI_KADEMELERI: IsiKademe[] = [
  { alt: 80, renk: "#dc2626", etiket: "Kritik" }, // kırmızı
  { alt: 60, renk: "#ea580c", etiket: "Yüksek" }, // turuncu-kırmızı
  { alt: 40, renk: "#f59e0b", etiket: "Orta" }, // amber
  { alt: 20, renk: "#eab308", etiket: "Düşük" }, // sarı
  { alt: 0, renk: "#22c55e", etiket: "Asgari" }, // yeşil
];

/** Yoğunluk puanına (0-100) karşılık gelen ısı rengini döndürür. */
export function isiRengi(puan: number): string {
  const p = kelepce(puan, 0, 100);
  for (const k of ISI_KADEMELERI) {
    if (p >= k.alt) return k.renk;
  }
  return ISI_KADEMELERI[ISI_KADEMELERI.length - 1].renk;
}

/** Yoğunluk puanına karşılık gelen Türkçe kademe etiketini döndürür. */
export function isiEtiket(puan: number): string {
  const p = kelepce(puan, 0, 100);
  for (const k of ISI_KADEMELERI) {
    if (p >= k.alt) return k.etiket;
  }
  return ISI_KADEMELERI[ISI_KADEMELERI.length - 1].etiket;
}

/* --------------------------------------------------------------- zaman dilimleri */

export interface ZamanDilimi {
  /** Dilim başlangıcı (ms epoch, dahil). */
  baslangic: number;
  /** Dilim bitişi (ms epoch, hariç). */
  bitis: number;
  /** Bu dilime düşen olay sayısı. */
  olaySayisi: number;
  /** Bu dilim penceresindeki ülke yoğunlukları (azalan sıralı). */
  ulkeler: UlkeYogunluk[];
  /** ISO2 → yoğunluk puanı (haritayı hızla yeniden-tonlamak için). */
  puanHaritasi: Record<string, number>;
}

export interface ZamanDilimSonuc {
  /** Her biri kaydırıcıda bir adım olan dilimler (eskiden yeniye). */
  dilimler: ZamanDilimi[];
  /** Pencerenin toplam süresi (ms). */
  pencereMs: number;
}

/**
 * Olayları `bugun`'den geriye doğru `dilimSayisi` eşit zaman kovasına böler ve
 * her kova için ülke yoğunluğunu hesaplar. Kaydırıcıyı hareket ettirdikçe
 * tehdit coğrafyasının nasıl kaydığını göstermek için kullanılır.
 *
 * Pencere: son `pencereGun` gün (varsayılan 7). Dilimler eskiden yeniye
 * sıralanır (indeks 0 = en eski, son indeks = en yeni "şimdi").
 *
 * SAF: zaman referansı `bugun` parametresinden gelir.
 */
export function zamanDilimleri(
  olaylar: GeoOlay[],
  bugun: number,
  dilimSayisi = 8,
  pencereGun = 7,
): ZamanDilimSonuc {
  const pencereMs = pencereGun * 86400000;
  const baslangic = bugun - pencereMs;
  const dilimGenislik = pencereMs / dilimSayisi;

  // Her dilime olayları dağıt.
  const kovalar: GeoOlay[][] = Array.from({ length: dilimSayisi }, () => []);
  for (const e of olaylar) {
    if (e.ts < baslangic || e.ts > bugun) continue;
    let idx = Math.floor((e.ts - baslangic) / dilimGenislik);
    if (idx < 0) idx = 0;
    if (idx >= dilimSayisi) idx = dilimSayisi - 1; // bugun tam sınırda ise son kovaya
    kovalar[idx].push(e);
  }

  const dilimler: ZamanDilimi[] = kovalar.map((kova, i) => {
    const dilimBas = baslangic + i * dilimGenislik;
    const ulkeler = ulkeYogunluk(kova);
    const puanHaritasi: Record<string, number> = {};
    for (const u of ulkeler) puanHaritasi[u.ulke] = u.yogunlukPuan;
    return {
      baslangic: Math.round(dilimBas),
      bitis: Math.round(dilimBas + dilimGenislik),
      olaySayisi: kova.length,
      ulkeler,
      puanHaritasi,
    };
  });

  return { dilimler, pencereMs };
}

/* --------------------------------------------------------------- bölgesel özet */

/** Coğrafi bölge anahtarları (Türkçe etiketli). */
export type BolgeKey =
  | "avrupa"
  | "asya"
  | "amerika"
  | "afrika"
  | "ortadogu"
  | "diger";

export const BOLGE_ETIKET: Record<BolgeKey, string> = {
  avrupa: "Avrupa",
  asya: "Asya-Pasifik",
  amerika: "Amerika",
  afrika: "Afrika",
  ortadogu: "Ortadoğu & Orta Asya",
  diger: "Diğer",
};

/**
 * ISO2 → bölge eşlemesi. ulke-koordinat.ts'teki gruplama ile hizalı; kapsam
 * dışı ülkeler "diger"e düşer.
 */
const ULKE_BOLGE: Record<string, BolgeKey> = {
  // Avrupa
  TR: "avrupa", DE: "avrupa", FR: "avrupa", GB: "avrupa", NL: "avrupa",
  ES: "avrupa", IT: "avrupa", RU: "avrupa", UA: "avrupa", PL: "avrupa",
  SE: "avrupa", NO: "avrupa", FI: "avrupa", DK: "avrupa", IE: "avrupa",
  BE: "avrupa", CH: "avrupa", AT: "avrupa", CZ: "avrupa", RO: "avrupa",
  GR: "avrupa", PT: "avrupa", HU: "avrupa", BG: "avrupa", RS: "avrupa",
  // Ortadoğu & Orta Asya
  IR: "ortadogu", IL: "ortadogu", SA: "ortadogu", AE: "ortadogu", IQ: "ortadogu",
  QA: "ortadogu", KZ: "ortadogu", PK: "ortadogu", AF: "ortadogu",
  // Asya-Pasifik
  CN: "asya", IN: "asya", JP: "asya", KR: "asya", KP: "asya", ID: "asya",
  VN: "asya", TH: "asya", MY: "asya", SG: "asya", PH: "asya", TW: "asya",
  HK: "asya", BD: "asya", AU: "asya", NZ: "asya",
  // Amerika
  US: "amerika", CA: "amerika", MX: "amerika", BR: "amerika", AR: "amerika",
  CO: "amerika", CL: "amerika", PE: "amerika", VE: "amerika",
  // Afrika
  ZA: "afrika", NG: "afrika", EG: "afrika", KE: "afrika", MA: "afrika",
  DZ: "afrika", ET: "afrika", TN: "afrika", GH: "afrika",
};

/** Bir ISO2 kodunun bölgesini döndürür (bilinmiyorsa "diger"). */
export function ulkeBolge(kod: string): BolgeKey {
  return ULKE_BOLGE[(kod || "").toUpperCase()] ?? "diger";
}

export interface BolgeYogunluk {
  bolge: BolgeKey;
  etiket: string;
  toplam: number;
  bot: number;
  engellenen: number;
  botOran: number;
  engelOran: number;
  /** Bölgedeki ülkelerin hacim-ağırlıklı ortalama yoğunluk puanı (0-100). */
  yogunlukPuan: number;
  /** Bölgedeki farklı ülke sayısı. */
  ulkeSayisi: number;
  /** Bölgenin en yoğun ülkesi (ISO2). */
  enYogunUlke: string | null;
}

/**
 * Ülke yoğunluklarını bölgelere toplar. Bölge yoğunluk puanı hacim-ağırlıklı
 * ortalamadır (çok trafik alan ülke bölge tonunu daha çok etkiler).
 */
export function bolgeselOzet(ulkeler: UlkeYogunluk[]): BolgeYogunluk[] {
  const harita = new Map<
    BolgeKey,
    {
      toplam: number;
      bot: number;
      engellenen: number;
      puanAgirlikTop: number; // Σ(puan * toplam)
      agirlikTop: number; // Σ(toplam)
      ulkeler: Set<string>;
      enYogunUlke: string | null;
      enYogunPuan: number;
    }
  >();

  for (const u of ulkeler) {
    const bolge = ulkeBolge(u.ulke);
    let b = harita.get(bolge);
    if (!b) {
      b = {
        toplam: 0, bot: 0, engellenen: 0, puanAgirlikTop: 0, agirlikTop: 0,
        ulkeler: new Set(), enYogunUlke: null, enYogunPuan: -1,
      };
      harita.set(bolge, b);
    }
    b.toplam += u.toplam;
    b.bot += u.bot;
    b.engellenen += u.engellenen;
    b.puanAgirlikTop += u.yogunlukPuan * u.toplam;
    b.agirlikTop += u.toplam;
    b.ulkeler.add(u.ulke);
    if (u.yogunlukPuan > b.enYogunPuan) {
      b.enYogunPuan = u.yogunlukPuan;
      b.enYogunUlke = u.ulke;
    }
  }

  const sonuc: BolgeYogunluk[] = [...harita.entries()].map(([bolge, b]) => ({
    bolge,
    etiket: BOLGE_ETIKET[bolge],
    toplam: b.toplam,
    bot: b.bot,
    engellenen: b.engellenen,
    botOran: b.toplam > 0 ? b.bot / b.toplam : 0,
    engelOran: b.toplam > 0 ? b.engellenen / b.toplam : 0,
    yogunlukPuan: b.agirlikTop > 0 ? Math.round(b.puanAgirlikTop / b.agirlikTop) : 0,
    ulkeSayisi: b.ulkeler.size,
    enYogunUlke: b.enYogunUlke,
  }));

  sonuc.sort(
    (a, b) => b.yogunlukPuan - a.yogunlukPuan || b.toplam - a.toplam,
  );
  return sonuc;
}

/* --------------------------------------------------------------- genel özet */

export interface GeoIsiOzet {
  toplamOlay: number;
  toplamBot: number;
  toplamEngellenen: number;
  /** Trafik kaynağı farklı ülke sayısı. */
  ulkeSayisi: number;
  /** Genel bot oranı (0..1). */
  botOran: number;
  /** En yüksek yoğunluk puanına sahip ülke. */
  enYogunUlke: UlkeYogunluk | null;
  /** En yüksek yoğunluk puanına sahip bölge. */
  enYogunBolge: BolgeYogunluk | null;
  /** Kritik kademedeki (puan >= 80) ülke sayısı. */
  kritikUlkeSayisi: number;
}

/** Ülke + bölge yoğunluklarından üst-düzey özet üretir. */
export function geoIsiOzet(
  ulkeler: UlkeYogunluk[],
  bolgeler: BolgeYogunluk[],
): GeoIsiOzet {
  const toplamOlay = ulkeler.reduce((a, u) => a + u.toplam, 0);
  const toplamBot = ulkeler.reduce((a, u) => a + u.bot, 0);
  const toplamEngellenen = ulkeler.reduce((a, u) => a + u.engellenen, 0);
  return {
    toplamOlay,
    toplamBot,
    toplamEngellenen,
    ulkeSayisi: ulkeler.length,
    botOran: toplamOlay > 0 ? toplamBot / toplamOlay : 0,
    enYogunUlke: ulkeler[0] ?? null,
    enYogunBolge: bolgeler[0] ?? null,
    kritikUlkeSayisi: ulkeler.filter((u) => u.yogunlukPuan >= 80).length,
  };
}
