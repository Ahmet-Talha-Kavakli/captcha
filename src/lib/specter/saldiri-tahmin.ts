/**
 * Specter — Saldırı Tahmini & Erken Uyarı Motoru
 * ================================================
 * Yakın-gelecekteki bot/saldırı hacmini son zaman-serisinden öngörür ve
 * yaklaşan saldırı dalgalarına karşı erken uyarı üretir.
 *
 * Yaklaşım: klasik ve deterministik bir tahmin katmanı —
 *   - üssel düzeltme (exponential smoothing) → serinin "seviyesi"
 *   - en-küçük-kareler eğimi (least-squares slope) → "trend"
 *   - seviye + trend ile ileri projeksiyon (Holt tarzı, sade)
 *   - güven bandı: son artıkların (residual) std sapmasına göre ±1.96σ
 *
 * Erken uyarı: temel çizgiye (mean + 2σ) göre son eğim + tahmin eşiği
 * aşarsa dalga uyarısı; ayrıca son kova rolling ortalamanın çok üstündeyse
 * ani sıçrama (spike) tespiti.
 *
 * TAMAMEN SAF (pure): Date.now / Math.random / argümansız new Date YOK.
 * Tüm zaman/seri girdileri parametre olarak geçilir → determinizm garanti.
 * Gerçek üründe bu Prophet/ARIMA/LSTM olurdu; burada bağımlılıksız,
 * yeniden-üretilebilir bir çekirdek.
 */

/* ------------------------------------------------------------------ Tipler */

export type TrendYonu = "artıyor" | "azalıyor" | "sabit";
export type UyariSiddet = "izle" | "uyari" | "kritik";

/** Bir tahmin kovası için güven aralığı (alt/üst sınır). */
export interface GuvenBandi {
  alt: number;
  ust: number;
}

/** Tahmin çıktısı: ileri kovalar + güven bandı + trend özeti. */
export interface TahminSonuc {
  /** Gelecek `ufuk` kova için öngörülen hacim. */
  tahmin: number[];
  /** Her tahmin kovası için ±güven bandı. */
  guvenBandi: GuvenBandi[];
  /** Serinin genel yönü. */
  trendYonu: TrendYonu;
  /** İvme: eğimin büyüklüğü (kova başına birim değişim). */
  ivme: number;
}

/** Erken uyarı çıktısı. */
export interface ErkenUyari {
  /** Uyarı tetiklendi mi. */
  tetiklendi: boolean;
  /** Şiddet seviyesi. */
  siddet: UyariSiddet;
  /** İnsan-okur başlık. */
  baslik: string;
  /** Açıklama. */
  aciklama: string;
  /** Öngörülen zirve değeri (tahmin ufkundaki en yüksek nokta). */
  ongorulenZirve: number;
  /** Zirveye tahmini kaç kova (saat) kaldı. Tetiklenmezse null. */
  zirveKova: number | null;
  /** Temel çizgi (mean + 2σ) — eşiğin görünür kılınması için. */
  esik: number;
  /** Ani sıçrama tespit edildi mi (son kova >> rolling ortalama). */
  aniSicrama: boolean;
  /** Sıçrama çarpanı (son kova / rolling ortalama). */
  sicramaKat: number;
}

/** Saat-bazlı (hour-of-day) mevsimsellik profili. */
export interface MevsimsellikSonuc {
  /** Yeterli veri var mı (profil güvenilir mi). */
  yeterli: boolean;
  /** 24 slotluk ortalama profil (index 0 = saat 00, … 23 = saat 23). */
  profil: number[];
  /** En yoğun saatler (profil değeri ortalamanın belirgin üstünde). */
  yogunSaatler: number[];
  /** En yoğun tek saat (index). Veri yoksa null. */
  zirveSaat: number | null;
}

/* ------------------------------------------------------------------ Temel istatistik yardımcıları */

/** Bir serinin ortalaması (boş seri → 0). */
function ortalama(seri: number[]): number {
  if (!seri.length) return 0;
  return seri.reduce((a, b) => a + b, 0) / seri.length;
}

/** Bir serinin std sapması (nüfus; boş/tek eleman → 0). */
function stdSapma(seri: number[]): number {
  if (seri.length < 2) return 0;
  const ort = ortalama(seri);
  const varyans = seri.reduce((a, b) => a + (b - ort) ** 2, 0) / seri.length;
  return Math.sqrt(varyans);
}

/* ------------------------------------------------------------------ 1) Hareketli ortalama */

/**
 * Basit hareketli ortalama (SMA). Her nokta, kendisi ve önceki `pencere-1`
 * noktanın ortalamasıdır (kenar: eldeki kadarını kullanır). Çıktı, girdiyle
 * aynı uzunluktadır. Gürültüyü yumuşatmak için.
 */
export function hareketliOrtalama(seri: number[], pencere: number): number[] {
  const p = Math.max(1, Math.floor(pencere));
  const cikti: number[] = [];
  for (let i = 0; i < seri.length; i++) {
    const bas = Math.max(0, i - p + 1);
    const dilim = seri.slice(bas, i + 1);
    cikti.push(ortalama(dilim));
  }
  return cikti;
}

/* ------------------------------------------------------------------ 2) Üssel düzeltme */

/**
 * Üssel düzeltme (exponential smoothing). alfa ∈ (0,1]: yüksek = son
 * gözlemlere daha duyarlı. Çıktı girdiyle aynı uzunlukta; son eleman,
 * serinin güncel "seviye" tahminidir.
 *   S₀ = x₀ ;  Sₜ = α·xₜ + (1-α)·Sₜ₋₁
 */
export function usselDuzeltme(seri: number[], alfa: number): number[] {
  if (!seri.length) return [];
  const a = Math.min(1, Math.max(0.001, alfa));
  const cikti: number[] = [seri[0]];
  for (let i = 1; i < seri.length; i++) {
    cikti.push(a * seri[i] + (1 - a) * cikti[i - 1]);
  }
  return cikti;
}

/* ------------------------------------------------------------------ 3) Lineer eğim (trend) */

/**
 * En-küçük-kareler doğrusunun eğimi (trend). x = 0,1,2,… indeksleri.
 * Pozitif = artan trend, negatif = azalan. Yeterli/anlamlı veri yoksa 0.
 *   eğim = Σ(xᵢ-x̄)(yᵢ-ȳ) / Σ(xᵢ-x̄)²
 */
export function linerEgim(seri: number[]): number {
  const n = seri.length;
  if (n < 2) return 0;
  const xOrt = (n - 1) / 2; // 0..n-1 indekslerinin ortalaması
  const yOrt = ortalama(seri);
  let pay = 0;
  let payda = 0;
  for (let i = 0; i < n; i++) {
    pay += (i - xOrt) * (seri[i] - yOrt);
    payda += (i - xOrt) ** 2;
  }
  if (payda === 0) return 0;
  return pay / payda;
}

/* ------------------------------------------------------------------ 4) Saldırı tahmini */

/**
 * Gelecekteki `ufuk` kovanın bot/engellenen hacmini öngör.
 *
 * Yöntem (Holt tarzı, sade):
 *   - Seviye: üssel düzeltmenin son değeri (α=0.4, son gözlemlere makul duyarlı).
 *   - Trend: son yarım pencerenin lineer eğimi (yakın-dönem momentum).
 *   - Projeksiyon: seviye + trend·(k) ; k = 1..ufuk (negatife kırpılır).
 *   - Güven bandı: son artıkların std'sine göre ±1.96σ, ufukla hafif genişler.
 *
 * Deterministik: yalnızca girdi serisine bağlı.
 */
export function saldiriTahmin(saatlikSeri: number[], ufuk: number): TahminSonuc {
  const h = Math.max(1, Math.floor(ufuk));
  const temiz = saatlikSeri.filter((v) => Number.isFinite(v));

  // Yetersiz veri: düz (naif) tahmin — son değer ya da 0.
  if (temiz.length < 3) {
    const seviye = temiz.length ? temiz[temiz.length - 1] : 0;
    return {
      tahmin: Array.from({ length: h }, () => Math.max(0, Math.round(seviye))),
      guvenBandi: Array.from({ length: h }, () => ({
        alt: Math.max(0, Math.round(seviye)),
        ust: Math.max(0, Math.round(seviye)),
      })),
      trendYonu: "sabit",
      ivme: 0,
    };
  }

  // Seviye: üssel düzeltmenin son değeri.
  const duzeltme = usselDuzeltme(temiz, 0.4);
  const seviye = duzeltme[duzeltme.length - 1];

  // Trend: son yarının (en az 4 nokta) eğimi → yakın momentum.
  const pencere = Math.max(4, Math.floor(temiz.length / 2));
  const sonPencere = temiz.slice(-pencere);
  const egim = linerEgim(sonPencere);

  // Artık std'si: düzeltme ile gerçek arasındaki farkların dağılımı.
  const artiklar = temiz.map((v, i) => v - duzeltme[i]);
  const sigma = stdSapma(artiklar);

  // Projeksiyon + güven bandı.
  const tahmin: number[] = [];
  const guvenBandi: GuvenBandi[] = [];
  for (let k = 1; k <= h; k++) {
    const ham = seviye + egim * k;
    const deger = Math.max(0, ham);
    // Bant ufukla √k oranında genişler (belirsizlik uzağa gidince artar).
    const yariBant = 1.96 * sigma * Math.sqrt(k);
    tahmin.push(Math.round(deger));
    guvenBandi.push({
      alt: Math.max(0, Math.round(deger - yariBant)),
      ust: Math.max(0, Math.round(deger + yariBant)),
    });
  }

  // Trend yönü: eğimi serinin ölçeğine göre değerlendir (gürültü eşiği).
  const olcek = Math.max(1, ortalama(temiz));
  const oransalEgim = egim / olcek;
  let trendYonu: TrendYonu = "sabit";
  if (oransalEgim > 0.05) trendYonu = "artıyor";
  else if (oransalEgim < -0.05) trendYonu = "azalıyor";

  return { tahmin, guvenBandi, trendYonu, ivme: egim };
}

/* ------------------------------------------------------------------ 5) Erken uyarı */

/**
 * Yaklaşan saldırı dalgasını sezin. İki bağımsız sinyal:
 *   A) Dalga: geçmiş temel çizgi (mean + 2σ) aşılıyor mu — mevcut son kova
 *      ya da tahmin ufkundaki herhangi bir nokta eşiği geçiyorsa uyarı.
 *   B) Ani sıçrama: son kova, rolling ortalamanın belirgin katı üstündeyse.
 *
 * Şiddet, eşiğin ne kadar aşıldığına (kaç σ üstü) göre kademelenir.
 * Deterministik: yalnızca seri + tahmine bağlı.
 */
export function erkenUyari(seri: number[], tahmin: number[]): ErkenUyari {
  const temiz = seri.filter((v) => Number.isFinite(v));
  const tahminTemiz = tahmin.filter((v) => Number.isFinite(v));

  // Varsayılan: sistem sakin.
  const sakin: ErkenUyari = {
    tetiklendi: false,
    siddet: "izle",
    baslik: "Sistem sakin",
    aciklama: "Yakın gelecekte anormal bir saldırı dalgası öngörülmüyor.",
    ongorulenZirve: tahminTemiz.length ? Math.max(...tahminTemiz) : 0,
    zirveKova: null,
    esik: 0,
    aniSicrama: false,
    sicramaKat: 1,
  };

  if (temiz.length < 4) return sakin;

  // Temel çizgi: son kova hariç geçmişin ortalama + 2σ'sı.
  const gecmis = temiz.slice(0, -1);
  const sonKova = temiz[temiz.length - 1];
  const taban = ortalama(gecmis);
  const sigma = stdSapma(gecmis);
  const esik = taban + 2 * sigma;

  // Rolling ortalama (son 6 kova hariç son kova) — ani sıçrama referansı.
  const rollingDilim = temiz.slice(Math.max(0, temiz.length - 7), temiz.length - 1);
  const rolling = ortalama(rollingDilim) || taban || 1;
  const sicramaKat = sonKova / (rolling || 1);
  const aniSicrama = rollingDilim.length >= 3 && sonKova >= 8 && sicramaKat >= 2.5;

  // Öngörülen zirve: (son kova + tahmin) içindeki en yüksek nokta.
  const birlesik = [sonKova, ...tahminTemiz];
  let zirveDeger = birlesik[0];
  let zirveIdx = 0;
  for (let i = 0; i < birlesik.length; i++) {
    if (birlesik[i] > zirveDeger) {
      zirveDeger = birlesik[i];
      zirveIdx = i;
    }
  }
  // zirveIdx=0 → şu an (son kova); >=1 → tahmin ufkunda k=zirveIdx kova sonra.
  const zirveKova = zirveIdx; // 0 = şimdi, k = k saat sonra

  // Eşik aşımı: son kova veya herhangi bir tahmin noktası eşiği geçiyor mu.
  const asanTahmin = tahminTemiz.some((v) => v > esik);
  const esikAsimi = (sigma > 0 && (sonKova > esik || asanTahmin));

  if (!esikAsimi && !aniSicrama) return { ...sakin, esik: Math.round(esik) };

  // Kaç σ üstünde (şiddet için) — zirveyi baz al.
  const sigmaUstu = sigma > 0 ? (zirveDeger - taban) / sigma : 0;
  let siddet: UyariSiddet = "izle";
  if (sigmaUstu >= 4 || sicramaKat >= 4) siddet = "kritik";
  else if (sigmaUstu >= 2.5 || aniSicrama) siddet = "uyari";
  else siddet = "izle";

  // Başlık + açıklama.
  let baslik: string;
  let aciklama: string;
  if (aniSicrama && zirveKova === 0) {
    baslik = "Ani saldırı sıçraması";
    aciklama = `Son kovada hacim, yakın ortalamanın ${sicramaKat.toFixed(1)}× üstüne fırladı (${Math.round(
      sonKova,
    )} olay). Aktif bir dalga başlamış olabilir.`;
  } else if (zirveKova === 0) {
    baslik = "Saldırı dalgası aktif";
    aciklama = `Mevcut hacim (${Math.round(sonKova)} olay) temel eşiği (${Math.round(
      esik,
    )}) aşıyor. Dalga şu anda tepe noktasında.`;
  } else {
    baslik = "Saldırı dalgası yaklaşıyor";
    aciklama = `Tahmini zirve ~${Math.round(zirveDeger)} olay, ~${zirveKova} saat içinde. Temel eşik ${Math.round(
      esik,
    )} olarak aşılıyor.`;
  }

  return {
    tetiklendi: true,
    siddet,
    baslik,
    aciklama,
    ongorulenZirve: Math.round(zirveDeger),
    zirveKova,
    esik: Math.round(esik),
    aniSicrama,
    sicramaKat: Number(sicramaKat.toFixed(2)),
  };
}

/* ------------------------------------------------------------------ 6) Mevsimsellik (saat-bazlı profil) */

/**
 * Saat-bazlı (hour-of-day) saldırı desenini çıkar: seri, en eski kovadan en
 * yeni kovaya sıralı SAATLİK hacim olarak varsayılır; `sonSaatDilimi`, son
 * (en yeni) kovanın günün hangi saatine denk geldiğidir (0..23). Böylece her
 * kova doğru saat slotuna düşürülüp 24-slotluk ortalama profil kurulur.
 *
 * "Saldırılar genelde 03:00'te sıçrar" gibi içgörüler için. En az 24 kova
 * (bir tam gün) yoksa profil güvenilir sayılmaz.
 *
 * Deterministik: yalnızca seri + son-saat girdisine bağlı.
 */
export function mevsimsellik(saatlikSeri: number[], sonSaatDilimi = 0): MevsimsellikSonuc {
  const temiz = saatlikSeri.filter((v) => Number.isFinite(v));
  const yeterli = temiz.length >= 24;

  // 24 slot: toplam + sayaç → ortalama.
  const toplam = new Array(24).fill(0);
  const sayac = new Array(24).fill(0);
  const sonIdx = temiz.length - 1;
  const baz = ((sonSaatDilimi % 24) + 24) % 24;
  for (let i = 0; i < temiz.length; i++) {
    // i=sonIdx → baz saat; geriye gidince saat 1 azalır.
    const geri = sonIdx - i;
    const saat = ((baz - geri) % 24 + 24 * Math.ceil(geri / 24 + 1)) % 24;
    toplam[saat] += temiz[i];
    sayac[saat] += 1;
  }
  const profil = toplam.map((t, i) => (sayac[i] ? t / sayac[i] : 0));

  if (!yeterli) {
    return { yeterli: false, profil, yogunSaatler: [], zirveSaat: null };
  }

  // Yoğun saatler: profil değeri (ortalama + 1σ) üstünde olanlar.
  const ort = ortalama(profil);
  const sigma = stdSapma(profil);
  const esik = ort + sigma;
  const yogunSaatler: number[] = [];
  let zirveSaat = 0;
  for (let s = 0; s < 24; s++) {
    if (profil[s] > esik) yogunSaatler.push(s);
    if (profil[s] > profil[zirveSaat]) zirveSaat = s;
  }

  return { yeterli: true, profil, yogunSaatler, zirveSaat };
}
