/**
 * Specter — Kota & Kullanım Tahmin Motoru (saf, deterministik)
 * ============================================================
 * Ay-sonu kullanımı ÖNGÖRMEK ve kapasite planı çıkarmak için istatistiksel
 * çekirdek. /panel/maliyet'teki basit "ortalama × ay-günü" projeksiyonunun
 * çok ötesinde: 3 ayrı yöntem, güven aralığı, trend yönü ve tükeniş günü.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   "Bugün" bilgisi (gunGecti / ayToplamGun) DAİMA parametre olarak dışarıdan
 *   verilir. Böylece aynı girdi → daima aynı çıktı; birim test edilebilir.
 */

import type { PlanTanim } from "./plans";

/* ------------------------------------------------------------------ İstatistik yardımcıları */

/**
 * En küçük kareler (least-squares) doğrusal regresyon.
 * x ekseni 0,1,2,… (gün indeksi) kabul edilir; y = seri değerleri.
 * Dönüş: { egim, kesim } → tahmin(x) = egim*x + kesim.
 *
 * egim > 0  → kullanım artıyor,  egim < 0 → azalıyor.
 */
export function linerRegresyon(seri: number[]): { egim: number; kesim: number } {
  const n = seri.length;
  if (n === 0) return { egim: 0, kesim: 0 };
  if (n === 1) return { egim: 0, kesim: seri[0] };

  let toplamX = 0;
  let toplamY = 0;
  let toplamXY = 0;
  let toplamXX = 0;
  for (let i = 0; i < n; i++) {
    toplamX += i;
    toplamY += seri[i];
    toplamXY += i * seri[i];
    toplamXX += i * i;
  }
  const payda = n * toplamXX - toplamX * toplamX;
  // payda 0 ise (tek benzersiz x) düz doğru: eğim 0, kesim ortalama.
  if (payda === 0) return { egim: 0, kesim: toplamY / n };

  const egim = (n * toplamXY - toplamX * toplamY) / payda;
  const kesim = (toplamY - egim * toplamX) / n;
  return { egim, kesim };
}

/**
 * Hareketli ortalama (kayan pencere). Gürültüyü yumuşatır; ilk noktalarda
 * pencere kısaltılır (kenar etkisi yerine mevcut veriyle ortalama).
 * `pencere` >= 1 olmalı; değilse serinin kopyası döner.
 */
export function hareketliOrtalama(seri: number[], pencere: number): number[] {
  if (pencere <= 1 || seri.length === 0) return [...seri];
  const sonuc: number[] = [];
  for (let i = 0; i < seri.length; i++) {
    const bas = Math.max(0, i - pencere + 1);
    let toplam = 0;
    for (let j = bas; j <= i; j++) toplam += seri[j];
    sonuc.push(toplam / (i - bas + 1));
  }
  return sonuc;
}

/** Ortalama (boş seride 0). */
function ortalama(seri: number[]): number {
  if (seri.length === 0) return 0;
  return seri.reduce((a, b) => a + b, 0) / seri.length;
}

/* ------------------------------------------------------------------ Tahmin çekirdeği */

/** Trend yönü etiketi (regresyon eğiminden). */
export type TrendYonu = "artıyor" | "azalıyor" | "sabit";

/** Kullanılan yöntemin makine anahtarı. */
export type YontemAnahtar = "basit" | "regresyon" | "agirlikli";

/** Tek bir tahmin yönteminin sonucu. */
export interface YontemSonuc {
  anahtar: YontemAnahtar;
  /** İnsan-okur yöntem adı. */
  ad: string;
  /** Yöntemin ürettiği tahmini günlük kullanım hızı (adet/gün). */
  gunlukHiz: number;
  /** Ay sonunda ulaşılacak toplam tahmini kullanım. */
  aySonuTahmin: number;
  /** Kota aşımı (aşılmıyorsa 0). */
  asim: number;
  /**
   * Kotanın tükeneceği (ayın kaçıncı günü) — bu ay tükenmiyorsa null.
   * gunGecti'ye kadarki gerçek kullanım korunur; kalan günler yöntem hızıyla
   * ileri sayılır ve kotayı geçtiği ilk gün döner.
   */
  tukenisGunu: number | null;
  /** Yöntemin ne yaptığını anlatan kısa eğitim notu. */
  aciklama: string;
}

/** Zengin tahmin çıktısı. */
export interface KotaTahmin {
  /** Ayın geçen günü (dahil). */
  gunGecti: number;
  /** Ayın toplam gün sayısı. */
  ayToplamGun: number;
  /** Aylık doğrulama kotası. */
  kota: number;
  /** Bu ay şimdiye kadarki gerçekleşen kullanım. */
  mevcutKullanim: number;
  /** Şimdiye kadarki günlük gerçek ortalama. */
  gunlukOrtalama: number;
  /** Üç yöntemin sonuçları (basit / regresyon / ağırlıklı). */
  yontemler: YontemSonuc[];
  /** Seçilen (önerilen) yöntem — dengeli tahmin (medyan ay-sonu). */
  secilen: YontemSonuc;
  /** Güven aralığı: 3 yöntemin ay-sonu tahminlerinin min/max bandı. */
  guvenAraligi: { alt: number; ust: number; genislik: number };
  /** Trend yönü (regresyon eğiminden). */
  trendYonu: TrendYonu;
  /** Regresyon eğimi (adet/gün — trendin hızı). */
  egim: number;
  /** Kota bu ay tükenecek mi (seçilen yönteme göre). */
  tukenecek: boolean;
  /** Seçilen yönteme göre tükeniş günü (yoksa null). */
  tukenisGunu: number | null;
}

/**
 * Bir günlük-hız verildiğinde tükeniş gününü hesapla.
 * mevcutKullanim gunGecti'ye kadar birikmiştir; kalan her gün +hiz eklenir.
 * Kotayı geçtiği ilk günü döndürür (1..ayToplamGun) — geçmiyorsa null.
 */
function tukenisHesapla(
  mevcutKullanim: number,
  gunlukHiz: number,
  gunGecti: number,
  ayToplamGun: number,
  kota: number,
): number | null {
  // Zaten aşılmışsa: tükeniş = geçen gün (bugün).
  if (mevcutKullanim >= kota) return Math.max(1, gunGecti);
  if (gunlukHiz <= 0) return null; // artmıyorsa asla tükenmez.
  let birikim = mevcutKullanim;
  for (let gun = gunGecti + 1; gun <= ayToplamGun; gun++) {
    birikim += gunlukHiz;
    if (birikim >= kota) return gun;
  }
  return null;
}

/**
 * Ay-sonu projeksiyonunu bir günlük-hızdan üret:
 *   mevcut (gunGecti güne kadar) + kalan gün × hız.
 */
function aySonuHesapla(
  mevcutKullanim: number,
  gunlukHiz: number,
  gunGecti: number,
  ayToplamGun: number,
): number {
  const kalanGun = Math.max(0, ayToplamGun - gunGecti);
  return Math.round(mevcutKullanim + kalanGun * gunlukHiz);
}

/**
 * Ana tahmin fonksiyonu.
 *
 * @param gunlukSeri  Bu ayın günlük kullanım serisi (gün-1 … gün-gunGecti).
 *                    Eleman sayısı >= gunGecti olmalı; fazlası (önceki günler)
 *                    trend/regresyon için kullanılır ama "mevcut kullanım"
 *                    yalnızca son `gunGecti` günden toplanır.
 * @param gunGecti    Ayın geçen günü (bugün dahil).
 * @param ayToplamGun Ayın toplam gün sayısı.
 * @param kota        Aylık doğrulama kotası.
 */
export function kotaTahmin(
  gunlukSeri: number[],
  gunGecti: number,
  ayToplamGun: number,
  kota: number,
): KotaTahmin {
  const gecti = Math.max(1, gunGecti);
  const toplamGun = Math.max(gecti, ayToplamGun);

  // Bu aya ait günler: serinin son `gecti` elemanı.
  const buAy = gunlukSeri.slice(-gecti);
  const mevcutKullanim = buAy.reduce((a, b) => a + b, 0);
  const gunlukOrtalama = mevcutKullanim / gecti;

  /* --- (a) Basit ortalama projeksiyon --- */
  const basitHiz = gunlukOrtalama;

  /* --- (b) Lineer regresyon projeksiyonu (trend-farkında) --- */
  // Tüm mevcut seri üzerinde regresyon; kalan günlerin hızı, ay-sonuna doğru
  // beklenen ortalama hız (bugünkü tahmini seviye ile ay-sonu seviyesinin
  // ortalaması) olarak alınır — böylece hızlanan trend yansır.
  const reg = linerRegresyon(buAy);
  const bugunSeviye = reg.egim * (gecti - 1) + reg.kesim;
  const aySonuSeviye = reg.egim * (toplamGun - 1) + reg.kesim;
  // Kalan günlerin ortalama beklenen günlük değeri (negatifse 0'a kırp).
  const regHiz = Math.max(0, (bugunSeviye + aySonuSeviye) / 2);

  /* --- (c) Son-7-gün ağırlıklı projeksiyon --- */
  // Son günlere daha çok ağırlık (doğrusal ağırlık: en yeni gün en ağır).
  const pencere = Math.min(7, buAy.length);
  const son = buAy.slice(-pencere);
  let agTop = 0;
  let agToplamAgirlik = 0;
  son.forEach((v, i) => {
    const w = i + 1; // 1,2,3… en yeni en ağır
    agTop += v * w;
    agToplamAgirlik += w;
  });
  const agirlikliHiz = agToplamAgirlik > 0 ? agTop / agToplamAgirlik : gunlukOrtalama;

  /* --- Yöntemleri paketle --- */
  function yap(
    anahtar: YontemAnahtar,
    ad: string,
    hiz: number,
    aciklama: string,
  ): YontemSonuc {
    const aySonuTahmin = aySonuHesapla(mevcutKullanim, hiz, gecti, toplamGun);
    return {
      anahtar,
      ad,
      gunlukHiz: Math.round(hiz),
      aySonuTahmin,
      asim: Math.max(0, aySonuTahmin - kota),
      tukenisGunu: tukenisHesapla(mevcutKullanim, hiz, gecti, toplamGun, kota),
      aciklama,
    };
  }

  const yontemler: YontemSonuc[] = [
    yap(
      "basit",
      "Basit ortalama",
      basitHiz,
      "Şimdiye kadarki günlük ortalamayı kalan günlere sabit uygular. En sade ve kararlı yöntem; trendi görmez.",
    ),
    yap(
      "regresyon",
      "Lineer regresyon",
      regHiz,
      "En küçük kareler doğrusuyla trendi yakalar. Kullanım hızlanıyor/yavaşlıyorsa bunu projeksiyona taşır.",
    ),
    yap(
      "agirlikli",
      "Son-7-gün ağırlıklı",
      agirlikliHiz,
      "Son 7 güne artan ağırlık verir; en güncel davranışa duyarlıdır, ani sıçramalara hızlı tepki verir.",
    ),
  ];

  /* --- Güven aralığı: 3 tahminin min/max bandı --- */
  const tahminler = yontemler.map((y) => y.aySonuTahmin);
  const alt = Math.min(...tahminler);
  const ust = Math.max(...tahminler);

  /* --- Seçilen yöntem: medyan ay-sonu tahminini veren yöntem (denge) --- */
  const sirali = [...yontemler].sort((a, b) => a.aySonuTahmin - b.aySonuTahmin);
  const secilen = sirali[1]; // 3 elemanın ortancası

  /* --- Trend yönü (regresyon eğiminden) — küçük eğimler "sabit" sayılır --- */
  const ortDuzey = Math.abs(gunlukOrtalama) || 1;
  const esik = ortDuzey * 0.02; // günlük ortalamanın %2'sinden küçük eğim = gürültü
  const trendYonu: TrendYonu =
    reg.egim > esik ? "artıyor" : reg.egim < -esik ? "azalıyor" : "sabit";

  return {
    gunGecti: gecti,
    ayToplamGun: toplamGun,
    kota,
    mevcutKullanim,
    gunlukOrtalama: Math.round(gunlukOrtalama),
    yontemler,
    secilen,
    guvenAraligi: { alt, ust, genislik: ust - alt },
    trendYonu,
    egim: reg.egim,
    tukenecek: secilen.tukenisGunu !== null,
    tukenisGunu: secilen.tukenisGunu,
  };
}

/* ------------------------------------------------------------------ Kapasite planlama */

/** Tek bir plan için kapasite uyum değerlendirmesi. */
export interface PlanKapasite {
  key: string;
  ad: string;
  fiyat: string;
  kota: number;
  /** Tahmini ay-sonu kullanım bu plana sığıyor mu. */
  yeterli: boolean;
  /** Kotaya göre boşluk yüzdesi (0..100). Negatifse aşım (0'a kırpılır). */
  bosluk: number;
  /** Tahmini kullanımın kota içindeki doluluk oranı (0..1+; 1'i aşarsa taşma). */
  dolulukOran: number;
  /** Mevcut kullanılan plan mı. */
  mevcut: boolean;
  /** Önerilen (en uygun) plan mı. */
  onerilen: boolean;
}

/** Kapasite planı çıktısı. */
export interface KapasitePlani {
  planlar: PlanKapasite[];
  /** Önerilen plan anahtarı (tahmini kullanımı en ekonomik karşılayan). */
  onerilenKey: string;
  /** Öneri gerekçesi (insan-okur). */
  gerekce: string;
}

/**
 * Tahmin edilen ay-sonu kullanımına göre plan-bazlı kapasite planı çıkar.
 * Önerilen plan: tahmini kullanımı SIĞDIRAN en küçük kotalı plan; hiçbiri
 * sığdırmıyorsa en büyük plan önerilir (aşım kaçınılmaz).
 */
export function kapasitePlani(
  tahmin: KotaTahmin,
  planlar: PlanTanim[],
  mevcutPlanKey: string,
): KapasitePlani {
  const hedef = tahmin.secilen.aySonuTahmin;

  // Kotaya göre küçükten büyüğe sırala (öneri için).
  const sirali = [...planlar].sort((a, b) => a.dogrulamaKotasi - b.dogrulamaKotasi);
  const sigan = sirali.find((p) => hedef <= p.dogrulamaKotasi);
  const onerilenKey = sigan ? sigan.key : sirali[sirali.length - 1].key;

  const list: PlanKapasite[] = planlar.map((p) => {
    const dolulukOran = p.dogrulamaKotasi > 0 ? hedef / p.dogrulamaKotasi : 0;
    const bosluk = Math.max(0, Math.round((1 - dolulukOran) * 100));
    return {
      key: p.key,
      ad: p.ad,
      fiyat: p.fiyat,
      kota: p.dogrulamaKotasi,
      yeterli: hedef <= p.dogrulamaKotasi,
      bosluk,
      dolulukOran,
      mevcut: p.key === mevcutPlanKey,
      onerilen: p.key === onerilenKey,
    };
  });

  let gerekce: string;
  if (onerilenKey === mevcutPlanKey) {
    gerekce = "Mevcut planın tahmini ay-sonu kullanımını rahatça karşılıyor. Yükseltme gerekmez.";
  } else if (sigan) {
    const mevcutPlan = planlar.find((p) => p.key === mevcutPlanKey);
    const mevcutYeterli = mevcutPlan ? hedef <= mevcutPlan.dogrulamaKotasi : false;
    gerekce = mevcutYeterli
      ? "Mevcut plan yetiyor; ancak tahmini kullanımı en ekonomik karşılayan plan aşağıda önerildi."
      : "Tahmini ay-sonu kullanımın mevcut kotayı aşıyor; önerilen plan bu kullanımı sığdıran en küçük kademe.";
  } else {
    gerekce = "Tahmini kullanım tüm planların kotasını aşıyor; en yüksek kademe önerildi, aşım ücreti kaçınılmaz.";
  }

  return { planlar: list, onerilenKey, gerekce };
}
