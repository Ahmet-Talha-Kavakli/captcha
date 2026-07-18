/**
 * Specter — Değişmezlik Defteri & Tahrifat-Kanıtlı Denetim İzi
 * ===========================================================
 * Uyumluluk (KVKK/SOC2/ISO) için "kim ne zaman ne yaptı" kaydı yetmez — o kaydın
 * SONRADAN DEĞİŞTİRİLMEDİĞİ de kanıtlanmalı. Bu defter hash-ZİNCİRİ kullanır
 * (blockchain'in temel fikri): her giriş, bir ÖNCEKİ girişin hash'ini içerir.
 *
 *   hash_n = H( hash_{n-1} + kayit_n )
 *
 * Bir kaydı değiştirirsen onun hash'i değişir → sonraki tüm girişlerin
 * "öncekiHash" alanı artık uyuşmaz → zincir KIRILIR ve tahrifat kesin tespit
 * edilir. Ayrıca tüm girişlerden bir Merkle-benzeri kök hash türetilir; tek bir
 * kök değeri tüm defterin bütünlüğünü özetler.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi kayıtlardan. Kriptografik
 * hash yerine hızlı, bağımlılıksız FNV-1a + karıştırma kullanılır (demo bütünlük;
 * üretimde SHA-256 önerilir — dürüst not).
 */

export interface DenetimKaydi {
  ts: number;
  aktor: string;      // kullanıcı/sistem
  eylem: string;      // "kural.olustur", "site.sil", "giris" ...
  hedef: string;      // etkilenen kaynak
  detay: string;
}

export interface ZincirGiris extends DenetimKaydi {
  indeks: number;
  oncekiHash: string;
  hash: string;
}

/** FNV-1a tabanlı 64-bit-benzeri hex hash (bağımlılıksız). */
export function zincirHash(girdi: string): string {
  // İki FNV akışı → 16 haneli hex (çakışma direncini artırır).
  let h1 = 0x811c9dc5, h2 = 0x811c9dc5 ^ 0x5f5f5f5f;
  for (let i = 0; i < girdi.length; i++) {
    const c = girdi.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c + i; h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

/** Bir kaydın kanonik dizesi (hash girdisi). */
function kayitDize(k: DenetimKaydi): string {
  return `${k.ts}|${k.aktor}|${k.eylem}|${k.hedef}|${k.detay}`;
}

/** Kayıtlardan hash-zincirli defter oluşturur. */
export function defterKur(kayitlar: DenetimKaydi[]): ZincirGiris[] {
  const sirali = [...kayitlar].sort((a, b) => a.ts - b.ts);
  const zincir: ZincirGiris[] = [];
  let onceki = "0".repeat(16); // genesis
  for (let i = 0; i < sirali.length; i++) {
    const k = sirali[i];
    const hash = zincirHash(onceki + kayitDize(k));
    zincir.push({ ...k, indeks: i, oncekiHash: onceki, hash });
    onceki = hash;
  }
  return zincir;
}

export interface DogrulamaSonuc {
  gecerli: boolean;
  toplamGiris: number;
  /** İlk kırılan girişin indeksi (yoksa -1). */
  kirilanIndeks: number;
  /** Kırılma nedeni. */
  neden: string | null;
  /** Merkle-benzeri kök hash (tüm defterin bütünlük özeti). */
  kokHash: string;
  /** Zincirin doğrulanan yüzdesi. */
  butunlukYuzde: number;
}

/**
 * Zinciri yeniden hash'leyip bütünlüğü doğrular. Her girişin hash'ini yeniden
 * hesaplar ve hem kayıtlı hash'le hem de zincir bağlantısıyla karşılaştırır.
 */
export function defterDogrula(zincir: ZincirGiris[]): DogrulamaSonuc {
  let onceki = "0".repeat(16);
  let kirilan = -1;
  let neden: string | null = null;

  for (const g of zincir) {
    // Zincir bağı: girişin öncekiHash'i gerçekten önceki hash mi.
    if (g.oncekiHash !== onceki) {
      kirilan = g.indeks;
      neden = `Giriş #${g.indeks}: zincir bağı kopuk (öncekiHash uyuşmuyor) — önceki kayıt değiştirilmiş.`;
      break;
    }
    // Kayıt bütünlüğü: hash yeniden hesaplanınca aynı mı.
    const beklenen = zincirHash(g.oncekiHash + kayitDize(g));
    if (beklenen !== g.hash) {
      kirilan = g.indeks;
      neden = `Giriş #${g.indeks}: kayıt içeriği değiştirilmiş (hash uyuşmuyor).`;
      break;
    }
    onceki = g.hash;
  }

  const gecerli = kirilan === -1;
  const kokHash = merkleKok(zincir);
  const butunlukYuzde = zincir.length === 0 ? 100
    : gecerli ? 100
    : Math.round((kirilan / zincir.length) * 1000) / 10;

  return { gecerli, toplamGiris: zincir.length, kirilanIndeks: kirilan, neden, kokHash, butunlukYuzde };
}

/** Merkle-benzeri kök: tüm giriş hash'lerini ikişerli katmanlarla tek köke indirger. */
export function merkleKok(zincir: ZincirGiris[]): string {
  if (zincir.length === 0) return "0".repeat(16);
  let seviye = zincir.map((g) => g.hash);
  while (seviye.length > 1) {
    const sonraki: string[] = [];
    for (let i = 0; i < seviye.length; i += 2) {
      const sol = seviye[i];
      const sag = seviye[i + 1] ?? sol; // tek kalırsa kendisiyle eşle
      sonraki.push(zincirHash(sol + sag));
    }
    seviye = sonraki;
  }
  return seviye[0];
}

/**
 * Bir kaydı "kurcalar" (test/gösterim): belirtilen indeksteki kaydın detayını
 * değiştirir ama hash'i ESKİ bırakır → doğrulama bunu yakalamalı. Zincirin
 * geri kalanını (hash'ler dahil) DEĞİŞTİRMEDEN döndürür ki kopma görünür olsun.
 */
export function kurcalaSimule(zincir: ZincirGiris[], indeks: number, yeniDetay: string): ZincirGiris[] {
  return zincir.map((g) => (g.indeks === indeks ? { ...g, detay: yeniDetay } : g));
}

/* ------------------------------------------------- Örnek denetim kaydı üretimi */

const EYLEMLER = [
  { eylem: "giris", hedef: "oturum", detay: "Panel girişi" },
  { eylem: "kural.olustur", hedef: "kural", detay: "Yeni engelleme kuralı eklendi" },
  { eylem: "kural.guncelle", hedef: "kural", detay: "Kural eşiği değiştirildi" },
  { eylem: "site.olustur", hedef: "site", detay: "Yeni site kaydedildi" },
  { eylem: "anahtar.rotasyon", hedef: "apiKey", detay: "API anahtarı döndürüldü" },
  { eylem: "politika.degistir", hedef: "politika", detay: "Savunma duruşu güncellendi" },
  { eylem: "ip.engelle", hedef: "ip", detay: "IP kara listeye alındı" },
  { eylem: "export", hedef: "denetim", detay: "Denetim kaydı dışa aktarıldı" },
];

function tohum(i: number, tuz: number): number {
  const x = Math.sin(i * 12.9898 + tuz * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Gerçek denetim kaydı yoksa temsili bir defter üretir (tohumlu, deterministik).
 * enSonTs: "şimdi" referansı (gerçek olay ts'inden geçilir).
 */
export function ornekKayitlar(enSonTs: number, adet = 24, aktor = "demo@specter.dev"): DenetimKaydi[] {
  const SAAT = 3_600_000;
  return Array.from({ length: adet }, (_, i) => {
    const e = EYLEMLER[Math.floor(tohum(i, 1) * EYLEMLER.length)];
    return {
      ts: enSonTs - (adet - i) * SAAT * (1 + tohum(i, 2)),
      aktor: tohum(i, 3) > 0.85 ? "sistem" : aktor,
      eylem: e.eylem, hedef: e.hedef,
      detay: e.detay,
    };
  });
}
