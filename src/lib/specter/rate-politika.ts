/**
 * Specter — Hız Limiti & Kota Politikası Motoru (SAF)
 * ===================================================
 * Bu dosya SAF bir hesaplama motorudur: hiçbir yan etki, hiçbir `Date.now()`,
 * `Math.random()` veya argümansız `new Date()` YOKTUR. Tüm zaman/rastgelelik
 * dışarıdan (parametre olarak) verilir. Böylece deterministik ve test edilebilir.
 *
 * Amaç: `src/lib/db/rate.ts` içindeki gerçek-zaman token-bucket limiter'ı
 * (rateLimit/trackRate) TAMAMLAMAK — onu değiştirmeden politika modelleme,
 * simülasyon ve projeksiyon sağlamak. Buradaki fonksiyonlar "ne olurdu"
 * sorusunu yanıtlar; canlı zorlama runtime limiter'da kalır.
 *
 * Ayrıca `src/lib/specter/plans.ts` içindeki gerçek `kotaDurumu` / `PLANLAR`
 * ile uyumludur: kota aşım davranışı ("block" | "overage") oradan gelir; bu
 * motor o davranışın kullanıcıya ne anlama geldiğini projekte eder.
 */

/* ------------------------------------------------------------------ Kademeler */

/** Bir hız-limiti kademesinde uygulanacak aksiyon türü. */
export type HizAksiyon = "yavaslat" | "challenge" | "engelle";

export interface HizLimitKademesi {
  /** Kademe anahtarı (stabil, i18n/analitik için). */
  key: string;
  /** Görünen ad (Türkçe). */
  ad: string;
  /** Dakika başına izin verilen istek (limit). */
  istekDk: number;
  /** Kayan pencere uzunluğu (saniye). Simülasyon bu pencerede sayar. */
  pencereSn: number;
  /** Kısa açıklama — kime uygun. */
  aciklama: string;
  /** Limit aşılınca uygulanacak aksiyon. */
  aksiyon: HizAksiyon;
}

/**
 * Temsili hız-limiti kademeleri. Bunlar gerçek dünyada yaygın kullanılan
 * hazır ayarları modeller; site-başına özel limit ileride kural motoruyla
 * (Kurallar > `rate` alanı) yapılandırılabilir.
 *
 * Gevşek → Çok sıkı doğru sırada tutulur (kademeOner ikili arama benzeri
 * mantıkla en gevşek yeterli kademeyi seçer).
 */
export const HIZ_LIMIT_KADEMELERI: HizLimitKademesi[] = [
  {
    key: "gevsek",
    ad: "Gevşek",
    istekDk: 300,
    pencereSn: 60,
    aciklama: "Yüksek meşru trafik (kampanya, API entegrasyonu). Yalnızca aşırı sel durdurulur.",
    aksiyon: "yavaslat",
  },
  {
    key: "dengeli",
    ad: "Dengeli",
    istekDk: 100,
    pencereSn: 60,
    aciklama: "Çoğu üretim sitesi için varsayılan denge: meşru zirveleri boğmadan kötüye kullanımı kırar.",
    aksiyon: "challenge",
  },
  {
    key: "siki",
    ad: "Sıkı",
    istekDk: 30,
    pencereSn: 60,
    aciklama: "Hassas uçlar (giriş, ödeme, OTP). Otomasyon ve kaba-kuvvet için düşük tolerans.",
    aksiyon: "challenge",
  },
  {
    key: "cok-siki",
    ad: "Çok sıkı",
    istekDk: 10,
    pencereSn: 60,
    aciklama: "Kritik/az-trafikli uçlar. Limit aşan her istek doğrudan engellenir.",
    aksiyon: "engelle",
  },
];

/** Aksiyonun kullanıcıya dönük Türkçe açıklaması. */
export function aksiyonAciklama(aksiyon: HizAksiyon): string {
  switch (aksiyon) {
    case "yavaslat":
      return "Limit üstü istekler yavaşlatılır (yanıt geciktirilir), reddedilmez.";
    case "challenge":
      return "Limit üstü isteklere challenge (görünmez/görünür doğrulama) sunulur.";
    case "engelle":
      return "Limit üstü istekler doğrudan reddedilir (HTTP 429).";
  }
}

/* ------------------------------------------------------------------ Simülasyon */

export interface RateSimuleSonuc {
  /** Toplam gelen istek. */
  toplam: number;
  /** Kayan-pencere limiti içinde geçen (izin verilen) istek. */
  gecen: number;
  /** Limit aşımı nedeniyle engellenen/kısıtlanan istek. */
  engellenen: number;
  /** Engelleme oranı (0..1). */
  engelOran: number;
  /** Pencere boyunca gözlemlenen en yüksek anlık pencere-içi istek sayısı. */
  tepeAnlik: number;
}

/**
 * Kayan pencere hız-limiti simülasyonu.
 *
 * `istekDizisi`: saniye-başına gelen istek sayısı (index = saniye). Örn.
 * [5, 5, 200, 3] → 0. sn 5 istek, 2. sn 200 istek (patlama).
 *
 * `limitDk`: dakika başına limit (kademedeki istekDk).
 * `pencereSn`: kayan pencere uzunluğu (saniye).
 *
 * Limit, pencereye ölçeklenir: pencereLimit = limitDk * (pencereSn / 60).
 * Her saniyede, o saniyeyi bitiren son `pencereSn` saniyelik kayan pencerede
 * kaç istek geçebileceğine bakılır; pencere kotası dolunca o saniyedeki fazla
 * istekler engellenir. Bu, gerçek token-bucket/kayan-pencere davranışını
 * yakından modeller ve deterministiktir.
 */
export function rateSimule(
  istekDizisi: number[],
  limitDk: number,
  pencereSn: number,
): RateSimuleSonuc {
  const dizi = (istekDizisi ?? []).map((n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0));
  const toplam = dizi.reduce((a, n) => a + n, 0);
  const pencere = Math.max(1, Math.floor(pencereSn));
  // Pencereye ölçeklenmiş limit (en az 1).
  const pencereLimit = Math.max(1, Math.round(limitDk * (pencere / 60)));

  let gecen = 0;
  let engellenen = 0;
  let tepeAnlik = 0;

  // Her saniyeyi sırayla işle; kayan pencerede "şu ana kadar geçenleri" say.
  // gecenPencere[i] = i. saniyede geçen (allow edilen) istek sayısı — pencere
  // içi toplamı hesaplamak için tutulur.
  const gecenPencere: number[] = new Array(dizi.length).fill(0);

  for (let i = 0; i < dizi.length; i++) {
    // [i - pencere + 1 .. i-1] aralığındaki GEÇEN istekleri topla.
    const basla = Math.max(0, i - pencere + 1);
    let penceredekiGecen = 0;
    for (let j = basla; j < i; j++) penceredekiGecen += gecenPencere[j];

    // Bu saniyede pencere kotasında kalan kapasite.
    const kalanKapasite = Math.max(0, pencereLimit - penceredekiGecen);
    const bugelen = dizi[i];
    const buGecen = Math.min(bugelen, kalanKapasite);
    gecenPencere[i] = buGecen;
    gecen += buGecen;
    engellenen += bugelen - buGecen;

    // Anlık pencere yükü (bu saniye dahil gelen toplam) tepe takibi.
    const penceredekiToplam = penceredekiGecen + bugelen;
    if (penceredekiToplam > tepeAnlik) tepeAnlik = penceredekiToplam;
  }

  return {
    toplam,
    gecen,
    engellenen,
    engelOran: toplam > 0 ? engellenen / toplam : 0,
    tepeAnlik,
  };
}

/* ------------------------------------------------------------------ Kota aşımı */

export interface KotaAsimSenaryoSonuc {
  /**
   * Kotanın tükeneceği tahmini gün sayısı (bugünden itibaren). Zaten aşılmışsa
   * 0; günlük kullanım 0 ise ve kota dolmamışsa null (asla tükenmez).
   */
  tukenisGun: number | null;
  /** Ay sonu (30 gün) projeksiyonunda kotayı aşacak istek miktarı (0 = aşım yok). */
  asimMiktar: number;
  /** Aşım davranışının kullanıcıya dönük Türkçe açıklaması. */
  asimDavranisiAciklama: string;
  /**
   * Overage (fazla-kullanım) planlarında tahmini ek maliyet. Sadece
   * asimDavranisi === "overage" ve aşım varsa üretilir; birim fiyat
   * dışarıdan verilir (varsayılan 1000 istek başına ₺2).
   */
  tahminEkMaliyet?: number;
}

/**
 * Kota tükenişi ve tükenme sonrası davranış projeksiyonu.
 *
 * `kullanilan`: mevcut dönem kullanımı.
 * `kota`: dönem kotası (plandan).
 * `gunlukOrt`: gözlemlenen günlük ortalama kullanım.
 * `asimDavranisi`: plandan gelen davranış ("block" | "overage").
 * `birimUcret1000`: overage planlarında 1000 istek başına ₺ (varsayılan 2).
 *
 * SAF: bugünün tarihine bakmaz; "bugünden itibaren kaç gün" olarak döner.
 */
export function kotaAsimSenaryo(
  kullanilan: number,
  kota: number,
  gunlukOrt: number,
  asimDavranisi: "block" | "overage",
  birimUcret1000 = 2,
): KotaAsimSenaryoSonuc {
  const kul = Math.max(0, kullanilan);
  const k = Math.max(0, kota);
  const gunluk = Math.max(0, gunlukOrt);
  const kalan = Math.max(0, k - kul);

  // Tükeniş günü.
  let tukenisGun: number | null;
  if (kul >= k) tukenisGun = 0;
  else if (gunluk <= 0) tukenisGun = null;
  else tukenisGun = Math.ceil(kalan / gunluk);

  // 30 günlük projeksiyon → dönem sonu tahmini kullanım.
  const donemSonuTahmin = kul + gunluk * 30;
  const asimMiktar = Math.max(0, Math.round(donemSonuTahmin - k));

  let asimDavranisiAciklama: string;
  let tahminEkMaliyet: number | undefined;

  if (asimDavranisi === "block") {
    asimDavranisiAciklama =
      "Kota dolduğunda fazla istekler REDDEDİLİR (HTTP 429). Doğrulama durur; koruma pasifleşmez ama yeni challenge üretilmez. Plan yükseltilmeli.";
  } else {
    asimDavranisiAciklama =
      "Kota dolduğunda hizmet KESİLMEZ; fazla kullanım (overage) faturaya eklenir. Kesintisiz koruma sürer.";
    if (asimMiktar > 0) {
      // 1000 istek başına birim ücret.
      tahminEkMaliyet = Math.round((asimMiktar / 1000) * birimUcret1000 * 100) / 100;
    }
  }

  return { tukenisGun, asimMiktar, asimDavranisiAciklama, tahminEkMaliyet };
}

/* ------------------------------------------------------------------ Kademe önerisi */

export interface KademeOneriSonuc {
  /** Önerilen kademenin key'i. */
  oneriKey: string;
  /** Önerilen kademe nesnesi. */
  kademe: HizLimitKademesi;
  /** Öneri gerekçesi (Türkçe). */
  gerekce: string;
}

/**
 * Gözlemlenen tepe RPS'e (saniye başına istek) göre kademe önerir.
 *
 * İlke: meşru zirveyi boğma, seli durdur. Tepe RPS'i dakikalık istek yüküne
 * çevir (tepeRps * 60) ve buna ~2x baş-boşluk (headroom) ekle; bu yükü
 * BOĞMAYAN en SIKI kademeyi seç. Böylece:
 *   - Düşük trafik → sıkı kademe (kötüye kullanıma karşı sağlam).
 *   - Yüksek meşru zirve → daha gevşek kademe (yanlış-pozitif yok).
 *
 * Deterministik: yalnızca girdi RPS'e bağlı, rastgelelik yok.
 */
export function kademeOner(gozlemlenenTepeRps: number): KademeOneriSonuc {
  const rps = Number.isFinite(gozlemlenenTepeRps) && gozlemlenenTepeRps > 0 ? gozlemlenenTepeRps : 0;
  // Meşru zirveyi karşılayacak dakikalık istek ihtiyacı + %100 baş-boşluk.
  const gerekenDk = Math.ceil(rps * 60 * 2);

  // Gevşekten sıkıya doğru sıralı kademeler arasında, gerekenDk'yı karşılayan
  // (istekDk >= gerekenDk) en SIKI kademeyi bul. En gevşek kademe bile
  // yetmezse (aşırı zirve) en gevşeği öner.
  const sirali = [...HIZ_LIMIT_KADEMELERI].sort((a, b) => b.istekDk - a.istekDk); // gevşek→sıkı
  let secili = sirali[0]; // en gevşek (fallback)
  for (const kademe of sirali) {
    if (kademe.istekDk >= gerekenDk) secili = kademe; // yeterli → daha sıkıya inmeyi dene
    else break; // artık yetmiyor → bir öncekinde kal
  }

  let gerekce: string;
  if (rps <= 0) {
    gerekce = "Anlamlı trafik gözlenmedi; kötüye kullanıma karşı sağlam bir varsayılan olarak sıkı kademe önerildi.";
    // Trafik yoksa dengeli-üstü sıkı öner (varsayılan güvenli taban).
    secili = HIZ_LIMIT_KADEMELERI.find((k) => k.key === "dengeli") ?? secili;
  } else {
    gerekce = `Gözlemlenen tepe ${rps.toFixed(1)} istek/sn (~${Math.round(rps * 60)} istek/dk). Meşru zirveyi boğmamak için ${(2).toFixed(0)}x baş-boşluk bırakıldı; bu yükü karşılayan en sıkı kademe "${secili.ad}".`;
  }

  return { oneriKey: secili.key, kademe: secili, gerekce };
}

/* ------------------------------------------------------------------ Yardımcılar (UI) */

/**
 * UI simülatörü için sentetik bir patlama (burst) serisi üretir. SAF ve
 * deterministik: verilen `tabanRps` düz taban, ortada `tepeRps` yüksekliğinde
 * bir zirve. `saniye` toplam pencere uzunluğu.
 *
 * Örn. tabanRps=5, tepeRps=200, saniye=10 → düz 5'ler, ortada 200'lük zirve.
 */
export function patlamaSerisi(tabanRps: number, tepeRps: number, saniye = 10): number[] {
  const n = Math.max(1, Math.floor(saniye));
  const taban = Math.max(0, Math.floor(tabanRps));
  const tepe = Math.max(taban, Math.floor(tepeRps));
  const zirveIdx = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => {
    if (i === zirveIdx) return tepe;
    // Zirveye komşu saniyelerde yarı-tepe (gerçekçi kabarma).
    if (i === zirveIdx - 1 || i === zirveIdx + 1) return Math.round((taban + tepe) / 2);
    return taban;
  });
}
