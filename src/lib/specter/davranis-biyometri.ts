/**
 * Specter — Davranışsal Biyometri İstatistik Motoru
 * =================================================
 * Ghost-font kodun doğru girilmesi tek sinyal değildir. Widget, kullanıcının
 * DAVRANIŞINI de toplar: tuş-basma süreleri (dwell), tuşlar-arası aralıklar
 * (flight), fare hızı/ivmesi, dokunuş basıncı. İnsan davranışı DOĞAL bir imza
 * taşır — yüksek ama yapısal varyans, pürüzsüz ivme, doğal entropi. Bot ise iki
 * uçtan birine düşer:
 *   • FAZLA DÜZENLİ: sabit gecikmeler (script), varyans ~0, entropi düşük.
 *   • FAZLA RASTGELE: uniform gürültü enjekte edilmiş, insan-dışı düz dağılım,
 *     mikro-duraklama/düzeltme yok.
 *
 * Bu motor ham sinyal dizilerinden istatistiksel özellikler çıkarır ve bir
 * "insanlık skoru" + hangi sinyalin ele verdiğini üretir. Yöntemler: varyasyon
 * katsayısı (CV), Shannon entropisi, ardışık-fark düzenliliği, insan referans
 * dağılımına KS-benzeri mesafe, ivme pürüzsüzlüğü (jerk).
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi sinyal dizileri.
 */

/** Ham davranış sinyalleri (widget'ın topladığı). */
export interface DavranisSinyal {
  /** Tuş-basılı-tutma süreleri (ms). */
  dwell: number[];
  /** Tuşlar-arası uçuş süreleri (ms). */
  flight: number[];
  /** Fare hız örnekleri (px/ms). */
  fareHiz: number[];
  /** Dokunuş basıncı örnekleri (0-1) — mobilde. */
  basinc?: number[];
  /** Toplam gönderim süresi (ms) — form dolum hızı. */
  toplamSure: number;
}

/* ------------------------------------------------------- İstatistik yardımcıları */

function ort(x: number[]): number {
  return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0;
}

function stdSapma(x: number[]): number {
  if (x.length < 2) return 0;
  const m = ort(x);
  const v = x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1);
  return Math.sqrt(v);
}

/** Varyasyon katsayısı: std/ort. İnsan tuşlamada ~0.25-0.6; bot ~0 (script) ya da >1 (gürültü). */
function cv(x: number[]): number {
  const m = ort(x);
  return m > 0 ? stdSapma(x) / m : 0;
}

/**
 * Çarpıklık (skewness). İnsan tuş-aralıkları sağa-çarpıktır (pozitif: çoğu kısa,
 * ara-sıra uzun duraklamalar) — log-normal/exp benzeri. Uniform enjekte gürültü
 * ~simetriktir (çarpıklık ~0). Bu, "yüksek varyans ama insan-DIŞI düz dağılım"
 * olan gürültü-botunu ele verir; entropi/CV tek başına yakalayamaz.
 */
function carpiklik(x: number[]): number {
  if (x.length < 3) return 0;
  const m = ort(x);
  const sd = stdSapma(x);
  if (sd === 0) return 0;
  const n = x.length;
  const s3 = x.reduce((a, b) => a + ((b - m) / sd) ** 3, 0) / n;
  return s3;
}

/** Bir dizinin Shannon entropisi (normalize histogram, bit). Yüksek=çeşitli, düşük=tekdüze. */
function entropi(x: number[], kova = 8): number {
  if (x.length === 0) return 0;
  const min = Math.min(...x), max = Math.max(...x);
  if (max === min) return 0;
  const say = new Array(kova).fill(0);
  for (const v of x) {
    let i = Math.floor(((v - min) / (max - min)) * kova);
    if (i >= kova) i = kova - 1;
    say[i]++;
  }
  let h = 0;
  for (const c of say) {
    if (c === 0) continue;
    const p = c / x.length;
    h -= p * Math.log2(p);
  }
  return h / Math.log2(kova); // 0-1 normalize
}

/**
 * Ardışık-fark düzenliliği: |Δ| değerlerinin CV'si. Script sabit adımlarla
 * ilerler (Δ neredeyse sabit → düzenlilik yüksek → insan-dışı). İnsanın Δ'sı
 * düzensizdir. Döndürülen: 0 (tam düzenli/bot) .. 1 (düzensiz/insan).
 */
function ardisikDuzensizlik(x: number[]): number {
  if (x.length < 3) return 0.5;
  const d: number[] = [];
  for (let i = 1; i < x.length; i++) d.push(Math.abs(x[i] - x[i - 1]));
  const c = cv(d);
  return Math.max(0, Math.min(1, c)); // yüksek CV → düzensiz → insan
}

/**
 * İvme pürüzsüzlüğü (jerk): fare hızının ikinci farkının büyüklüğü. İnsan faresi
 * pürüzsüz ivmelenir (düşük jerk); teleport/lineer bot hareketi ya sıfır-jerk
 * (çok düz) ya ani sıçramalıdır. İnsanımsı orta jerk → skor yüksek.
 */
function jerkInsanimsi(hiz: number[]): number {
  if (hiz.length < 4) return 0.5;
  const ivme: number[] = [];
  for (let i = 1; i < hiz.length; i++) ivme.push(hiz[i] - hiz[i - 1]);
  const jerk: number[] = [];
  for (let i = 1; i < ivme.length; i++) jerk.push(Math.abs(ivme[i] - ivme[i - 1]));
  const mJerk = ort(jerk);
  const mHiz = ort(hiz.map(Math.abs)) || 1;
  const oran = mJerk / mHiz; // normalize jerk
  // İnsan bandı ~0.1-0.7; çok düşük (robotik düz) ya da çok yüksek (titrek) şüpheli.
  if (oran < 0.03) return 0.12;      // aşırı pürüzsüz/lineer → bot
  if (oran > 1.2) return 0.12;        // aşırı titrek → sentetik gürültü (bot)
  if (oran > 0.7) return 0.4;         // sınırda titrek → şüpheli
  return Math.max(0.5, Math.min(1, 1 - Math.abs(oran - 0.35) / 1.2));
}

/**
 * İnsan referans dağılımına KS-benzeri mesafe. İnsan flight süreleri log-normal
 * benzeri sağa-çarpık; uniform ya da tek-tepe dağılımlar sapar. Döndürülen: 0
 * (insana yakın) .. 1 (uzak). Basit: gözlenen CDF ile referans arasındaki max fark.
 */
function ksReferansMesafe(flight: number[]): number {
  if (flight.length < 4) return 0.5;
  const sirali = [...flight].sort((a, b) => a - b);
  const m = ort(flight);
  if (m <= 0) return 1;
  // Referans: insan flight'ı ~exp dağılımı (oran 1/m). CDF_ref(t)=1-e^(-t/m).
  let maxFark = 0;
  for (let i = 0; i < sirali.length; i++) {
    const empCdf = (i + 1) / sirali.length;
    const refCdf = 1 - Math.exp(-sirali[i] / m);
    maxFark = Math.max(maxFark, Math.abs(empCdf - refCdf));
  }
  return Math.max(0, Math.min(1, maxFark));
}

/* ------------------------------------------------------- Özellik & skor */

export interface OzellikKatki {
  ad: string;
  /** Ham özellik değeri (gösterim için). */
  deger: number;
  /** İnsanlık katkısı 0-1 (1=çok insanımsı). */
  insanimsilik: number;
  /** Bu özellik ne ölçtüğünün açıklaması. */
  aciklama: string;
  /** İnsan referans bandı (gösterim). */
  band: string;
}

export interface BiyometriSonuc {
  /** Nihai insanlık skoru 0-1 (1=kesin insan). */
  insanlikSkoru: number;
  /** Sınıf. */
  sinif: "insan" | "şüpheli" | "bot";
  /** Her özelliğin katkısı (açıklanabilirlik). */
  katkilar: OzellikKatki[];
  /** En çok ele veren sinyal (en düşük insanımsılık). */
  zayifSinyal: string;
  /** Kısa gerekçe. */
  gerekce: string;
}

/**
 * Ham davranış sinyallerini analiz edip insanlık skoru + açıklanabilir katkılar
 * üretir. Ağırlıklar deterministik; her özellik 0-1 insanımsılığa eşlenir.
 */
export function biyometriAnaliz(s: DavranisSinyal): BiyometriSonuc {
  const katkilar: OzellikKatki[] = [];

  // 1) Dwell varyasyonu — insan ~0.15-0.7 CV; script ~0 (sabit), gürültü >1.
  // Çift-yönlü bant: hem çok düşük (script) hem çok yüksek (enjekte gürültü) şüpheli.
  const dwellCv = cv(s.dwell);
  const dwellInsan = bandSkoru(dwellCv, 0.08, 0.15, 0.7, 1.1);
  katkilar.push({
    ad: "Tuş-basma varyansı (dwell CV)", deger: yuv(dwellCv), insanimsilik: dwellInsan,
    aciklama: "İnsan her tuşu farklı süre basar (yapısal varyans); script sabit (~0), gürültü-bot aşırı yüksek (>1).", band: "0.15–0.7",
  });

  // 2) Flight entropisi — insan yapısal-çeşitli; bot tekdüze (~0) YA DA aşırı düz-uniform (~1).
  // Uniform gürültü entropiyi 1'e çıkarır ama insan dağılımı 1 DEĞİL yapısaldır (~0.6-0.9).
  const flightEnt = entropi(s.flight);
  const flightInsan = bandSkoru(flightEnt, 0.35, 0.55, 0.9, 0.99);
  katkilar.push({
    ad: "Aralık entropisi (flight)", deger: yuv(flightEnt), insanimsilik: flightInsan,
    aciklama: "Aralık dağılımı çeşitliliği; bot tekdüze (~0) veya insan-dışı düz-uniform (~1). İnsan yapısal orta-yüksek.", band: "0.55–0.9",
  });

  // 3) Ardışık düzensizlik — insan düzensiz, script sabit adım.
  const duzensiz = ardisikDuzensizlik(s.flight.length >= 3 ? s.flight : s.dwell);
  katkilar.push({
    ad: "Ardışık ritim düzensizliği", deger: yuv(duzensiz), insanimsilik: bandSkoru(duzensiz, 0.15, 0.3, 0.9, 1.0),
    aciklama: "Script sabit gecikmelerle ilerler (Δ sabit); insan ritmi düzensizdir.", band: "0.3–0.9",
  });

  // 4) Fare jerk pürüzsüzlüğü.
  const jerk = jerkInsanimsi(s.fareHiz);
  katkilar.push({
    ad: "Fare ivme pürüzsüzlüğü (jerk)", deger: yuv(jerk), insanimsilik: jerk,
    aciklama: "İnsan faresi pürüzsüz ivmelenir; teleport/lineer bot düz veya sıçramalı.", band: "insanımsı bant",
  });

  // 5) Dağılım şekli: KS mesafesi + çarpıklık. İnsan flight'ı sağa-çarpık
  //    (çarpıklık >0.4, çoğu kısa + ara-sıra uzun); uniform gürültü simetriktir
  //    (çarpıklık ~0) — yüksek varyanslı gürültü-botunu asıl ele veren sinyal.
  const ks = ksReferansMesafe(s.flight);
  const carp = carpiklik(s.flight);
  const ksInsan = bandSkoru(1 - ks, 0.4, 0.55, 0.9, 1.0);
  const carpInsan = carp >= 0.4 ? 1 : carp >= 0.1 ? 0.3 + 0.7 * ((carp - 0.1) / 0.3) : 0.12; // simetrik/sola → bot
  const sekilInsan = Math.min(ksInsan, carpInsan); // ikisi de tutmalı
  katkilar.push({
    ad: "Dağılım şekli (çarpıklık + KS)", deger: yuv(carp), insanimsilik: sekilInsan,
    aciklama: "İnsan aralıkları sağa-çarpıktır (çoğu kısa, ara-sıra uzun); uniform enjekte gürültü simetriktir (çarpıklık ~0).", band: "çarpıklık >0.4",
  });

  // 6) Basınç varyansı (mobil) — varsa.
  if (s.basinc && s.basinc.length >= 3) {
    const bCv = cv(s.basinc);
    katkilar.push({
      ad: "Dokunuş basıncı varyansı", deger: yuv(bCv), insanimsilik: bandSkoru(bCv, 0.05, 0.12, 0.5, 0.8),
      aciklama: "Gerçek parmak basıncı doğal dalgalanır; emüle dokunuş sabittir.", band: "0.12–0.5",
    });
  }

  // 7) Form dolum hızı — insan-dışı HIZLI gönderim şüpheli; yavaş gönderim normaldir.
  // ms/karakter: <60 → bot temposu; 60-140 geçiş; >140 rahat insan.
  const karSayi = Math.max(1, s.dwell.length);
  const msKarakter = s.toplamSure / karSayi;
  const hizInsan = msKarakter < 40 ? 0.1
    : msKarakter < 60 ? 0.1 + 0.5 * ((msKarakter - 40) / 20)
    : msKarakter < 140 ? 0.6 + 0.4 * ((msKarakter - 60) / 80)
    : 1;
  katkilar.push({
    ad: "Form dolum hızı", deger: Math.round(msKarakter), insanimsilik: Math.min(1, hizInsan),
    aciklama: "Karakter başına süre (ms). İnsan-dışı hızlı gönderim (<40ms/kar) otomasyona işaret; yavaş normaldir.", band: ">60 ms/kar",
  });

  // Ağırlıklı ortalama insanlık skoru.
  const agirlik: Record<string, number> = {
    "Tuş-basma varyansı (dwell CV)": 1.3,
    "Aralık entropisi (flight)": 1.2,
    "Ardışık ritim düzensizliği": 1.0,
    "Fare ivme pürüzsüzlüğü (jerk)": 1.1,
    "Dağılım şekli (çarpıklık + KS)": 1.5,
    "Dokunuş basıncı varyansı": 0.7,
    "Form dolum hızı": 1.4,
  };
  let toplamA = 0, toplamW = 0;
  for (const k of katkilar) {
    const w = agirlik[k.ad] ?? 1;
    toplamA += k.insanimsilik * w;
    toplamW += w;
  }
  const skor = toplamW > 0 ? toplamA / toplamW : 0.5;

  const sirali = [...katkilar].sort((a, b) => a.insanimsilik - b.insanimsilik);
  const zayif = sirali[0];
  const sinif: BiyometriSonuc["sinif"] = skor >= 0.65 ? "insan" : skor >= 0.4 ? "şüpheli" : "bot";

  const gerekce =
    sinif === "insan" ? "Davranış sinyalleri doğal insan imzasıyla tutarlı: yapısal varyans, pürüzsüz ivme, doğal entropi."
    : sinif === "bot" ? `Otomasyon imzası: en zayıf sinyal "${zayif.ad}" (insanımsılık ${yuv(zayif.insanimsilik)}). ${zayif.insanimsilik < 0.2 ? "Aşırı düzenlilik/insan-dışı desen." : "İnsan referansından sapma."}`
    : `Karışık sinyaller — "${zayif.ad}" zayıf. Ek doğrulama (ghost-font challenge) önerilir.`;

  return {
    insanlikSkoru: yuv(skor), sinif, katkilar, zayifSinyal: zayif.ad, gerekce,
  };
}

/**
 * Bir değeri insan bandına göre 0-1 insanımsılığa eşler. Bant [b2,b3] içinde tam
 * insan (1); [b1,b2] ve [b3,b4] geçişli; dışında düşük. Trapez üyelik.
 */
function bandSkoru(x: number, b1: number, b2: number, b3: number, b4: number): number {
  if (x <= b1 || x >= b4) return 0.12;
  if (x >= b2 && x <= b3) return 1;
  if (x < b2) return 0.12 + 0.88 * ((x - b1) / (b2 - b1));
  return 0.12 + 0.88 * ((b4 - x) / (b4 - b3));
}

function yuv(n: number): number { return Math.round(n * 1000) / 1000; }

/* ------------------------------------------------------- Hazır örnek profiller */

/** Deterministik "rastgele" — indeks tohumlu (Math.random YOK). */
function tohum(i: number, tuz: number): number {
  const x = Math.sin(i * 12.9898 + tuz * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export type OrnekTur = "insan" | "script-bot" | "gurultu-bot" | "mobil-insan";

/** Bir örnek tür için gerçekçi sentetik sinyal üretir (demo/görselleştirme). */
export function ornekSinyal(tur: OrnekTur, n = 12): DavranisSinyal {
  if (tur === "script-bot") {
    // Sabit gecikmeler — çok düşük varyans.
    return {
      dwell: Array.from({ length: n }, () => 45 + tohum(1, 1) * 2),
      flight: Array.from({ length: n }, () => 60),
      fareHiz: Array.from({ length: 20 }, (_, i) => 5 + (i % 2)), // lineer/düz
      toplamSure: n * 105,
    };
  }
  if (tur === "gurultu-bot") {
    // Uniform gürültü — insan-dışı düz/simetrik dağılım, aşırı titrek (yüksek-jerk) fare.
    // Komşu örnekler zıt yönlü → jerk patlar; flight uniform-simetrik → çarpıklık ~0.
    return {
      dwell: Array.from({ length: n }, (_, i) => 20 + tohum(i, 2) * 400),
      flight: Array.from({ length: n }, (_, i) => 100 + tohum(i, 3) * 400),
      fareHiz: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 2 : 38) + tohum(i, 4) * 20),
      toplamSure: n * 90,
    };
  }
  if (tur === "mobil-insan") {
    return {
      dwell: Array.from({ length: n }, (_, i) => 90 + tohum(i, 5) * 70),
      flight: Array.from({ length: n }, (_, i) => 120 + tohum(i, 6) * 180 * (1 + tohum(i, 9))),
      fareHiz: Array.from({ length: 16 }, (_, i) => 2 + tohum(i, 7) * 6 + Math.sin(i / 2) * 2),
      basinc: Array.from({ length: n }, (_, i) => 0.4 + tohum(i, 8) * 0.35),
      toplamSure: n * 260,
    };
  }
  // insan (masaüstü): yapısal varyans, sağa-çarpık flight, pürüzsüz fare.
  return {
    dwell: Array.from({ length: n }, (_, i) => 70 + tohum(i, 10) * 60),
    flight: Array.from({ length: n }, (_, i) => 90 + tohum(i, 11) * 140 * (0.6 + tohum(i, 12)) + (tohum(i, 13) > 0.85 ? 300 : 0)),
    fareHiz: Array.from({ length: 22 }, (_, i) => 3 + Math.sin(i / 3) * 3 + tohum(i, 14) * 2),
    toplamSure: n * 240,
  };
}

export const SINIF_RENK: Record<BiyometriSonuc["sinif"], string> = {
  insan: "#16a34a", "şüpheli": "#d97706", bot: "#dc2626",
};
