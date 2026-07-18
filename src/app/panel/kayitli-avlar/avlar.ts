/**
 * Specter — Kayıtlı Avlar (Saved Hunts) Yerel Yardımcıları
 * ========================================================
 * Bu dosya, /panel/tehdit-avi'deki CANLI av konsolunun üzerine "kaydedilmiş +
 * zamanlanmış" bir katman ekler. Her kayıtlı av, aslında adlandırılmış bir DSL
 * sorgu dizesi + meta veridir. Çalıştırmak, tehdit-avi.ts'teki `tehditAvi`
 * fonksiyonunu çağırmaktan ibarettir — SORGU AYRIŞTIRMA YENİDEN YAZILMAZ.
 *
 * Saf/deterministik: Date.now / Math.random YOK. Tüm sonuçlar yalnızca
 * (av, events) girdisine bağlıdır.
 *
 * NOT (dürüstlük): "Zamanlanmış" avlar burada TEMSİLEN tutulur. Gerçek bir
 * zamanlayıcı (cron) sunucu tarafında ayrı çalışır; bu katman, avın ŞU AN
 * çalıştırılsa neyle eşleşeceğini/tetikleneceğini gösterir.
 */
import type { BotEvent } from "@/lib/db/schema";
import { tehditAvi, sorguAyristir } from "@/lib/specter/tehdit-avi";

/** Bir avın ait olduğu tehdit kategorisi (filtre + gruplama için). */
export type AvKategori = "kimlik" | "kazima" | "ai" | "atlatma" | "ddos" | "kesif";

/** Şiddet seviyesi (rozet rengi + kritik tetik hesabı). */
export type AvSiddet = "kritik" | "yuksek" | "orta" | "dusuk";

/** Zamanlanmış av tekrar sıklığı. */
export type AvSiklik = "5dk" | "saatlik" | "günlük";

/** Kaydedilmiş, yeniden kullanılabilir bir tehdit avı tanımı. */
export interface KayitliAv {
  id: string;
  /** İnsan-dostu ad. */
  ad: string;
  /** Ne aradığının kısa açıklaması. */
  aciklama: string;
  /** tehdit-avi.ts'in ayrıştırabildiği GEÇERLİ bir DSL sorgu dizesi. */
  sorgu: string;
  kategori: AvKategori;
  siddet: AvSiddet;
  /** Zamanlanmış mı (periyodik çalışıp uyarı üretir mi). */
  zamanli: boolean;
  /** Zamanlıysa tekrar sıklığı (değilse yok). */
  sikligi?: AvSiklik;
  /** Serbest etiketler (arama + gruplama). */
  etiketler: string[];
}

/**
 * Bir avın kaç eşleşmede "tetiklendi" (uyarı) sayılacağı eşiği. Bu sayının
 * üstündeki eşleşme, avın şu an ateşlendiği anlamına gelir. Şiddete göre daha
 * hassas eşikler: kritik avlar 1 eşleşmede bile tetiklenir.
 */
export function tetikEsigi(av: KayitliAv): number {
  switch (av.siddet) {
    case "kritik":
      return 1;
    case "yuksek":
      return 3;
    case "orta":
      return 8;
    case "dusuk":
      return 20;
  }
}

/* ------------------------------------------------------------------ Hazır av paketi */

/**
 * HAZIR_AVLAR — kutudan çıkan uzman tehdit avı paketi.
 * Her `sorgu`, tehdit-avi.ts DSL sözdizimine UYGUNDUR (alan:değer, alan<N,
 * alan>N, alan!=değer, AND/OR, serbest kelime). Geçerli alanlar: ip, country,
 * asn, ua, path, method, botClass, verdict, score, latency, ja3, headless,
 * engine, fingerprint, tls.
 */
export const HAZIR_AVLAR: KayitliAv[] = [
  {
    id: "av-hizli-kimlik-doldurma",
    ad: "Hızlı kimlik doldurma",
    aciklama: "Login yoluna gelen kimlik doldurma (credential stuffing) trafiği.",
    sorgu: 'botClass:credential_stuffing AND path:/login',
    kategori: "kimlik",
    siddet: "kritik",
    zamanli: true,
    sikligi: "5dk",
    etiketler: ["login", "credential-stuffing", "hesap-devralma"],
  },
  {
    id: "av-datacenter-kaziyici",
    ad: "Datacenter kazıyıcıları",
    aciklama: "Datacenter ASN'lerinden gelen içerik kazıma (scraper) trafiği.",
    sorgu: 'botClass:scraper AND asn:datacenter',
    kategori: "kazima",
    siddet: "yuksek",
    zamanli: true,
    sikligi: "saatlik",
    etiketler: ["scraper", "datacenter", "kazima"],
  },
  {
    id: "av-sahte-tarayici-tls",
    ad: "Sahte tarayıcı (TLS uyumsuz)",
    aciklama: "UA kendini tarayıcı gösterir ama TLS parmak izi uyuşmaz.",
    sorgu: 'tls:true',
    kategori: "atlatma",
    siddet: "yuksek",
    zamanli: true,
    sikligi: "saatlik",
    etiketler: ["tls", "spoofing", "ja3"],
  },
  {
    id: "av-ai-egitim-botlari",
    ad: "AI eğitim botları",
    aciklama: "Model eğitimi için içerik toplayan AI ajan/crawler trafiği.",
    sorgu: 'botClass:ai_agent',
    kategori: "ai",
    siddet: "orta",
    zamanli: true,
    sikligi: "günlük",
    etiketler: ["ai", "gptbot", "model-egitimi"],
  },
  {
    id: "av-yuksek-risk-cografya",
    ad: "Yüksek-riskli coğrafya + düşük skor",
    aciklama: "Yüksek-riskli ülkelerden gelen, insanlık skoru çok düşük istekler.",
    sorgu: 'country:RU AND score<0.3',
    kategori: "kesif",
    siddet: "yuksek",
    zamanli: false,
    etiketler: ["cografya", "dusuk-skor", "risk"],
  },
  {
    id: "av-headless-otomasyon",
    ad: "Headless otomasyon",
    aciklama: "Puppeteer/Playwright/Selenium headless tarayıcı imzaları.",
    sorgu: 'headless:true',
    kategori: "atlatma",
    siddet: "yuksek",
    zamanli: true,
    sikligi: "saatlik",
    etiketler: ["headless", "puppeteer", "playwright"],
  },
  {
    id: "av-hassas-yol-kesfi",
    ad: "Hassas yol keşfi",
    aciklama: "Yönetim/API/env gibi hassas yolları yoklayan keşif trafiği.",
    sorgu: 'path:/admin OR path:/.env OR path:/wp-admin',
    kategori: "kesif",
    siddet: "yuksek",
    zamanli: true,
    sikligi: "5dk",
    etiketler: ["kesif", "admin", "env", "yol-tarama"],
  },
  {
    id: "av-python-arac-trafigi",
    ad: "Python/araç istemcileri",
    aciklama: "python-requests / curl / go-http gibi HTTP kütüphanesi istemcileri.",
    sorgu: 'ua:python OR ua:curl OR ua:go-http',
    kategori: "kazima",
    siddet: "orta",
    zamanli: false,
    etiketler: ["python", "curl", "kutuphane"],
  },
  {
    id: "av-ddos-yuksek-hacim",
    ad: "DDoS / yüksek-hacim engelleme",
    aciklama: "DDoS sınıfı, yüksek güvenle engellenmiş yoğun trafik.",
    sorgu: 'botClass:ddos AND verdict:blocked',
    kategori: "ddos",
    siddet: "kritik",
    zamanli: true,
    sikligi: "5dk",
    etiketler: ["ddos", "engellenen", "hacim"],
  },
  {
    id: "av-dusuk-skor-engellenen",
    ad: "Yüksek güvenli bot engellemeleri",
    aciklama: "Çok düşük insanlık skoruyla bot kabul edilip engellenen istekler.",
    sorgu: 'score<0.2 AND verdict:blocked',
    kategori: "atlatma",
    siddet: "orta",
    zamanli: false,
    etiketler: ["dusuk-skor", "engellenen", "yuksek-guven"],
  },
  {
    id: "av-motor-yok-otomasyon",
    ad: "Tarayıcı motoru yok (ham istemci)",
    aciklama: "Gerçek bir tarayıcı motoru raporlamayan (Blink/Gecko/WebKit değil) istemciler.",
    sorgu: 'engine:None',
    kategori: "atlatma",
    siddet: "dusuk",
    zamanli: false,
    etiketler: ["engine", "ham-istemci", "otomasyon"],
  },
  {
    id: "av-yavas-supheli",
    ad: "Yavaş + şüpheli trafik",
    aciklama: "Olağandışı yüksek gecikmeli, düşük skorlu şüpheli istekler.",
    sorgu: 'latency>2000 AND score<0.4',
    kategori: "kesif",
    siddet: "dusuk",
    zamanli: false,
    etiketler: ["gecikme", "anomali", "dusuk-skor"],
  },
];

/* ------------------------------------------------------------------ Çalıştırma */

/** Bir avın çalıştırma sonucu (özet + örnek eşleşmeler). */
export interface AvCalismaSonuc {
  av: KayitliAv;
  /** Toplam eşleşme sayısı. */
  eslesme: number;
  /** İlk N örnek eşleşme (UI'da göstermek için). */
  ornekler: BotEvent[];
  /** Eşik aşıldı mı → uyarı tetiklendi mi. */
  tetiklendi: boolean;
  /** Bu avın tetik eşiği (UI'da göstermek için). */
  esik: number;
}

/**
 * Tek bir avı olay kümesine karşı çalıştırır. Sorgu ayrıştırma + eşleştirme
 * TAMAMEN tehdit-avi.ts'e devredilir (tehditAvi).
 */
export function avCalistir(av: KayitliAv, events: BotEvent[], ornekLimit = 6): AvCalismaSonuc {
  const sonuc = tehditAvi(av.sorgu, events, ornekLimit);
  const esik = tetikEsigi(av);
  return {
    av,
    eslesme: sonuc.eslesme,
    ornekler: sonuc.eslesmeler,
    tetiklendi: sonuc.eslesme >= esik,
    esik,
  };
}

/** tumAvlariCalistir çıktısının özeti (sayaç kartları için). */
export interface AvlarOzet {
  /** Toplam av sayısı. */
  toplamAv: number;
  /** Tetiklenen (eşiği aşan) av sayısı. */
  tetiklenen: number;
  /** Zamanlanmış av sayısı. */
  zamanliAv: number;
  /** Kritik şiddette VE tetiklenen av sayısı. */
  kritikTetik: number;
}

/** tumAvlariCalistir tam çıktısı. */
export interface AvlarCalismaCiktisi {
  sonuclar: AvCalismaSonuc[];
  ozet: AvlarOzet;
}

/**
 * Tüm avları çalıştırır, eşleşme sayısına göre azalan sıralar, özet üretir.
 */
export function tumAvlariCalistir(avlar: KayitliAv[], events: BotEvent[]): AvlarCalismaCiktisi {
  const sonuclar = avlar
    .map((av) => avCalistir(av, events))
    .sort((a, b) => b.eslesme - a.eslesme);

  const ozet: AvlarOzet = {
    toplamAv: avlar.length,
    tetiklenen: sonuclar.filter((s) => s.tetiklendi).length,
    zamanliAv: avlar.filter((a) => a.zamanli).length,
    kritikTetik: sonuclar.filter((s) => s.tetiklendi && s.av.siddet === "kritik").length,
  };

  return { sonuclar, ozet };
}

/**
 * avOzet — sayaçlar için hafif özet (çalıştırma yapmadan, sadece tanımlar
 * üzerinden). Kategori dağılımı ve şiddet dağılımı verir.
 */
export function avOzet(avlar: KayitliAv[]): {
  toplam: number;
  zamanli: number;
  kategoriDagilim: { kategori: AvKategori; sayi: number }[];
  siddetDagilim: { siddet: AvSiddet; sayi: number }[];
} {
  const katSay = new Map<AvKategori, number>();
  const sidSay = new Map<AvSiddet, number>();
  for (const a of avlar) {
    katSay.set(a.kategori, (katSay.get(a.kategori) ?? 0) + 1);
    sidSay.set(a.siddet, (sidSay.get(a.siddet) ?? 0) + 1);
  }
  return {
    toplam: avlar.length,
    zamanli: avlar.filter((a) => a.zamanli).length,
    kategoriDagilim: [...katSay.entries()]
      .map(([kategori, sayi]) => ({ kategori, sayi }))
      .sort((a, b) => b.sayi - a.sayi),
    siddetDagilim: [...sidSay.entries()]
      .map(([siddet, sayi]) => ({ siddet, sayi }))
      .sort((a, b) => b.sayi - a.sayi),
  };
}

/**
 * sorguGecerliMi — istemci tarafında (yeni av kaydederken) bir DSL sorgusunun
 * ayrıştırılabildiğini doğrular. sorguAyristir hata dizesi döndürebilir; ayrıca
 * hiç koşul üretmeyen (tamamen boş/anlamsız) sorguyu da geçersiz sayarız.
 */
export function sorguGecerliMi(sorgu: string): { gecerli: boolean; hata: string | null } {
  const q = sorgu.trim();
  if (!q) return { gecerli: false, hata: "Sorgu boş olamaz." };
  const sonuc = sorguAyristir(q);
  if (sonuc.hata) return { gecerli: false, hata: sonuc.hata };
  if (sonuc.kosullar.length === 0) return { gecerli: false, hata: "Geçerli bir koşul bulunamadı." };
  return { gecerli: true, hata: null };
}

/* ------------------------------------------------------------------ Etiketler (UI) */

/** Kategori → insan-dostu Türkçe etiket. */
export const KATEGORI_ETIKET: Record<AvKategori, string> = {
  kimlik: "Kimlik",
  kazima: "Kazıma",
  ai: "AI Botları",
  atlatma: "Atlatma",
  ddos: "DDoS",
  kesif: "Keşif",
};

/** Şiddet → insan-dostu Türkçe etiket. */
export const SIDDET_ETIKET: Record<AvSiddet, string> = {
  kritik: "Kritik",
  yuksek: "Yüksek",
  orta: "Orta",
  dusuk: "Düşük",
};

/** Sıklık → insan-dostu Türkçe etiket. */
export const SIKLIK_ETIKET: Record<AvSiklik, string> = {
  "5dk": "5 dakikada bir",
  saatlik: "Saatlik",
  "günlük": "Günlük",
};
