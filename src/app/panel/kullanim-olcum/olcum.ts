/**
 * Specter — Kullanım Ölçümü & SLA Takibi (saf, deterministik)
 * ===========================================================
 * Her ciddi SaaS'ın omurgası: hesabın GERÇEK kullanımını (doğrulama, API
 * çağrısı, korunan istek) plan kotasına karşı ölçer, ay-sonu faturayı
 * projeksiyonlar, SLA taahhütlerini (çalışma süresi %, engelleme gecikmesi
 * p95, destek yanıtı) izler; ihlalde ödenmesi gereken kredileri hesaplar.
 *
 * Bu, /panel/roi (değer/tasarruf), /panel/uptime (servis çalışma süresi),
 * /panel/kota-tahmin (kota öngörüsü) ve /panel/maliyet-optim (birim maliyet)
 * modüllerinden AYRIDIR: burada ODAK, gerçek kullanım vs plan kotası +
 * FATURA projeksiyonu + SLA UYUMU & KREDİ'dir. Tamamlayıcıdır.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   "Şimdi" ve dönem bilgisi olayların en büyük zaman damgasından (max ts)
 *   türetilir; böylece aynı girdi → daima aynı çıktı, birim test edilebilir.
 *   Sunucu (page.tsx) yalnızca ham olayları ve seçilen planı geçer.
 */

import type { BotEvent } from "@/lib/db/schema";
import { PLANLAR as KAYNAK_PLANLAR, type Plan } from "@/lib/specter/plans";

/* ------------------------------------------------------------------ Plan kataloğu */

/**
 * Kullanım-ölçümü + SLA açısından bir plan tanımı. Plan KİMLİĞİ / ADI / KOTASI
 * / TABAN FİYATI tek kaynaktan (`src/lib/specter/plans.ts`) TÜRETİLİR — böylece
 * panelde gösterilen kota/ad landing sözüyle ve faturayla daima tutarlıdır.
 * Bu modül yalnızca ölçüm-özel alanları EKLER: SLA taahhütleri (uptime/gecikme/
 * destek) + aşım birim fiyatı. Bu SLA rakamları tipik SaaS sözleşme değerleridir.
 */
export interface OlcumPlan {
  id: "baslangic" | "buyume" | "kurumsal";
  ad: string;
  /** Aylık doğrulama kotası (verification/ay). */
  aylikKota: number;
  /** Aylık taban ücret (TL). 0 = ücretsiz. */
  fiyat: number;
  /** Aşımda doğrulama başına ek ücret (TL) — taban kotanın üstü için. */
  asimBirimFiyat: number;
  /** SLA: taahhüt edilen aylık çalışma süresi yüzdesi (ör. 99.9). */
  slaUptime: number;
  /** SLA: taahhüt edilen engelleme gecikmesi p95 üst sınırı (ms). */
  slaLatencyP95: number;
  /** SLA: taahhüt edilen destek ilk-yanıt süresi (saat). */
  destekYaniti: number;
}

/**
 * Plan kataloğu. Kimlik/ad/kota/taban-fiyat plans.ts'ten (free/pro/scale)
 * TÜRETİLİR; bu modül SLA taahhütleri + aşım birim fiyatını EKLER. Böylece
 * panelde gösterilen kota/ad/fiyat landing + fatura ile daima tutarlıdır.
 *
 * NOT: scale planı "Özel" (sözleşmeye bağlı) fiyatlı ve pratik-sınırsız kotalı
 * olduğundan, ölçüm/fatura ekranı için temsili bir kurumsal taban (kota/fiyat)
 * kullanılır — plan ADI yine tek kaynaktan gelir (tutarlılık için kritik olan).
 */
const OLCUM_EK: Record<Plan, {
  id: OlcumPlan["id"];
  fiyat: number;
  aylikKota: number;
  asimBirimFiyat: number;
  slaUptime: number;
  slaLatencyP95: number;
  destekYaniti: number;
}> = {
  // Ücretsiz plan aşamaz (block) — aşım ücretlendirilmez.
  free: { id: "baslangic", fiyat: 0, aylikKota: KAYNAK_PLANLAR.free.dogrulamaKotasi, asimBirimFiyat: 0, slaUptime: 99.5, slaLatencyP95: 250, destekYaniti: 48 },
  // Büyüme: taban fiyat plans.ts'ten (₺990); 1.000 doğrulama başına ~₺0,9 aşım.
  pro: { id: "buyume", fiyat: Number(KAYNAK_PLANLAR.pro.fiyat.replace(/[^\d]/g, "")) || 0, aylikKota: KAYNAK_PLANLAR.pro.dogrulamaKotasi, asimBirimFiyat: 0.0009, slaUptime: 99.9, slaLatencyP95: 150, destekYaniti: 12 },
  // Ölçek: "Özel" fiyatlı — ölçüm ekranı için temsili kurumsal taban.
  scale: { id: "kurumsal", fiyat: 2_900, aylikKota: 5_000_000, asimBirimFiyat: 0.0006, slaUptime: 99.95, slaLatencyP95: 100, destekYaniti: 4 },
};

export const PLANLAR: OlcumPlan[] = (["free", "pro", "scale"] as Plan[]).map((k) => {
  const kaynak = KAYNAK_PLANLAR[k];
  const ek = OLCUM_EK[k];
  return {
    id: ek.id,
    ad: kaynak.ad,
    aylikKota: ek.aylikKota,
    fiyat: ek.fiyat,
    asimBirimFiyat: ek.asimBirimFiyat,
    slaUptime: ek.slaUptime,
    slaLatencyP95: ek.slaLatencyP95,
    destekYaniti: ek.destekYaniti,
  };
});

/** id → plan haritası (hızlı erişim). */
export const PLAN_MAP = new Map(PLANLAR.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ Yardımcılar */

/** Bir zaman damgasının gün anahtarı (UTC, YYYY-MM-DD). */
function gunKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** p-yüzdelik (nearest-rank) — boş seride 0. `dizi` sıralı olmak zorunda değil. */
function yuzdelik(degerler: number[], p: number): number {
  if (degerler.length === 0) return 0;
  const sirali = [...degerler].sort((a, b) => a - b);
  // nearest-rank: ceil(p/100 * N) → 1-tabanlı sıra
  const sira = Math.max(1, Math.ceil((p / 100) * sirali.length));
  return sirali[sira - 1];
}

/** Ortalama (boş seride 0). */
function ortalama(degerler: number[]): number {
  if (degerler.length === 0) return 0;
  return degerler.reduce((a, b) => a + b, 0) / degerler.length;
}

/* ------------------------------------------------------------------ Kullanım ölçümü */

/** Kullanım-ölçüm sonucu. */
export interface KullanimSonuc {
  /** Bu dönemde (ay) şimdiye kadar ölçülen gerçek doğrulama (olay) sayısı. */
  kullanilanDogrulama: number;
  /** Kotanın yüzde kaçı kullanıldı (0..1+; 1'i aşarsa taşma). */
  kotaYuzde: number;
  /** Ay-sonu projeksiyonu: mevcut + kalan gün × günlük hız (run-rate). */
  projeksiyon: number;
  /** Projeksiyon kotayı aşıyor mu (aşım riski). */
  asimRiski: boolean;
  /** Projeksiyona göre aşılacak doğrulama miktarı (aşmıyorsa 0). */
  asimMiktari: number;
  /** Dönemde kalan gün sayısı. */
  kalanGun: number;
  /** Dönemin geçen günü (1-tabanlı). */
  gecenGun: number;
  /** Dönemin toplam gün sayısı (ayın gün sayısı). */
  toplamGun: number;
  /** Günlük ortalama kullanım (run-rate — adet/gün). */
  gunlukOrt: number;
  /** Türetilmiş API çağrısı sayısı (korunan her istek ≈ doğrulama + skorlama). */
  apiCagri: number;
  /** Korunan istek sayısı (= toplam olay; doğrulama ile eşdeğer temel). */
  korunanIstek: number;
  /** Fatura tahmini (taban + aşım) — bkz. faturaProjeksiyon. */
  faturaTahmini: number;
  /** Günlük kullanım serisi (grafik için; dönem başından geçen güne). */
  gunlukSeri: number[];
  /** Günlük seri etiketleri (MM-DD). */
  gunEtiketleri: string[];
}

/**
 * API çağrısı türetme çarpanı: her korunan istek, doğrulama akışında
 * ortalama ~2 API çağrısına (challenge iste + doğrula) denk gelir. Görünmez
 * modda tek atış olsa da challenge/rotasyon senaryolarında artar; 2.0 makul
 * bir temsili orandır (varsayım, dürüstçe etiketlenir).
 */
const API_CARPAN = 2.0;

/**
 * Gerçek olaylardan kullanımı ölç ve ay-sonunu projeksiyonla.
 *
 * "Şimdi", olayların en büyük ts'inden türetilir (saf). Dönem = o ts'in
 * takvim ayı. Yalnızca bu aya düşen olaylar "mevcut kullanım" sayılır;
 * günlük hız bu ayın geçen günlerinden hesaplanır ve kalan günlere uzatılır.
 *
 * @param events Hesabın ham olayları (Events.forOwner çıktısı — sıralı olması gerekmez).
 * @param plan   Ölçülecek plan (kota + fiyat + aşım birimi).
 */
export function kullanimOlc(events: BotEvent[], plan: OlcumPlan): KullanimSonuc {
  // "Şimdi" = en büyük olay ts'i. Olay yoksa 0 (boş hesap → sıfır kullanım).
  let simdiMs = 0;
  for (const e of events) if (e.ts > simdiMs) simdiMs = e.ts;

  const simdi = new Date(simdiMs || 0);
  const yil = simdi.getUTCFullYear();
  const ay = simdi.getUTCMonth();
  // Ayın ilk gününün epoch'u (UTC) — bu aya ait olay filtresi için sınır.
  const ayBasiMs = Date.UTC(yil, ay, 1);
  // Ayın toplam gün sayısı (bir sonraki ayın 0. günü = bu ayın son günü).
  const toplamGun = new Date(Date.UTC(yil, ay + 1, 0)).getUTCDate();
  // Geçen gün (bu ay içindeki gün numarası, 1-tabanlı).
  const gecenGun = simdiMs > 0 ? simdi.getUTCDate() : 1;
  const kalanGun = Math.max(0, toplamGun - gecenGun);

  // Bu aya düşen olaylar = mevcut kullanım (korunan istek / doğrulama).
  const buAyOlaylar = events.filter((e) => e.ts >= ayBasiMs && e.ts <= simdiMs);
  const kullanilanDogrulama = buAyOlaylar.length;

  // Günlük seri: ayın 1. gününden geçen güne kadar her günün olay sayısı.
  const gunlukSeri: number[] = [];
  const gunEtiketleri: string[] = [];
  const gunSayac: Record<string, number> = {};
  for (const e of buAyOlaylar) {
    const k = gunKey(e.ts);
    gunSayac[k] = (gunSayac[k] || 0) + 1;
  }
  for (let g = 1; g <= gecenGun; g++) {
    const key = gunKey(Date.UTC(yil, ay, g));
    gunlukSeri.push(gunSayac[key] || 0);
    gunEtiketleri.push(key.slice(5)); // MM-DD
  }

  // Günlük hız (run-rate): bu ayki gerçek ortalama. Geçen gün 0 olamaz.
  const gunlukOrt = kullanilanDogrulama / Math.max(1, gecenGun);

  // Ay-sonu projeksiyonu: mevcut + kalan gün × günlük hız.
  const projeksiyon = Math.round(kullanilanDogrulama + kalanGun * gunlukOrt);

  const kotaYuzde = plan.aylikKota > 0 ? kullanilanDogrulama / plan.aylikKota : 0;
  const asimMiktari = Math.max(0, projeksiyon - plan.aylikKota);
  const asimRiski = asimMiktari > 0;

  // Türetilmiş metrikler.
  const korunanIstek = kullanilanDogrulama;
  const apiCagri = Math.round(kullanilanDogrulama * API_CARPAN);

  // Fatura tahmini: taban + projeksiyona göre aşım ücreti.
  const faturaTahmini = faturaHesap(projeksiyon, plan).toplam;

  return {
    kullanilanDogrulama,
    kotaYuzde,
    projeksiyon,
    asimRiski,
    asimMiktari,
    kalanGun,
    gecenGun,
    toplamGun,
    gunlukOrt: Math.round(gunlukOrt),
    apiCagri,
    korunanIstek,
    faturaTahmini,
    gunlukSeri,
    gunEtiketleri,
  };
}

/* ------------------------------------------------------------------ Fatura projeksiyonu */

/** Fatura kalem dökümü. */
export interface FaturaDokum {
  /** Aylık taban ücret. */
  taban: number;
  /** Kotayı aşan doğrulama miktarı (0 ise aşım yok). */
  asimMiktari: number;
  /** Aşım kaleminin toplam ücreti. */
  asimUcret: number;
  /** Toplam fatura = taban + aşım. */
  toplam: number;
  /** Aşım ücretlendiriliyor mu (ücretsiz planda aşım bloklanır, ücret yok). */
  asimUcretli: boolean;
}

/**
 * Verili bir kullanım (genelde projeksiyon) için fatura dökümü.
 * Ücretsiz planda (asimBirimFiyat = 0) aşım bloklanır → ücret yok; kullanım
 * kotada kesilir. Ücretli planlarda kota üstü, birim fiyatla ücretlendirilir.
 */
export function faturaHesap(kullanim: number, plan: OlcumPlan): FaturaDokum {
  const asimMiktari = Math.max(0, kullanim - plan.aylikKota);
  const asimUcretli = plan.asimBirimFiyat > 0;
  const asimUcret = asimUcretli ? Math.round(asimMiktari * plan.asimBirimFiyat) : 0;
  return {
    taban: plan.fiyat,
    asimMiktari,
    asimUcret,
    toplam: plan.fiyat + asimUcret,
    asimUcretli,
  };
}

/* ------------------------------------------------------------------ SLA takibi */

/** Tek bir SLA metriğinin uyum durumu. */
export type SlaDurumu = "karşılanıyor" | "risk" | "ihlal";

/** Bir SLA metriğinin taahhüt vs gerçekleşen değerlendirmesi. */
export interface SlaDurum {
  /** Metrik makine anahtarı. */
  anahtar: "uptime" | "latency" | "support";
  /** İnsan-okur metrik adı. */
  metrik: string;
  /** Taahhüt edilen değer (sözleşme hedefi). */
  taahhut: number;
  /** Gözlemlenen gerçek değer (olaylardan türetilmiş). */
  gerceklesen: number;
  /** Birim etiketi (%, ms, sa). */
  birim: string;
  /** Yüksek değer mi iyi (uptime) yoksa düşük mü (latency/support). */
  yuksekIyi: boolean;
  /** Uyum durumu. */
  durum: SlaDurumu;
  /** İhlalde ödenmesi gereken kredi yüzdesi (aylık ücretin %'si). */
  kredi: number;
  /** Kısa insan-okur açıklama. */
  aciklama: string;
}

/**
 * Çalışma süresi kredi çizelgesi (tipik SaaS SLA). Gerçekleşen uptime
 * taahhüdün ne kadar altındaysa o kadar kredi. Eşikler AWS/Cloudflare tarzı.
 */
function uptimeKredi(gerceklesen: number, taahhut: number): number {
  if (gerceklesen >= taahhut) return 0;
  if (gerceklesen >= 99.0) return 10;
  if (gerceklesen >= 95.0) return 25;
  return 100; // %95 altı → tam ay kredisi
}

/** Gecikme (p95) kredi çizelgesi: taahhüt aşıldıkça kademeli kredi. */
function latencyKredi(gerceklesen: number, taahhut: number): number {
  if (gerceklesen <= taahhut) return 0;
  const asimOran = gerceklesen / taahhut;
  if (asimOran <= 1.25) return 5;
  if (asimOran <= 1.5) return 10;
  return 25;
}

/** Destek yanıtı kredi çizelgesi: hedef saat aşıldıkça kredi. */
function supportKredi(gerceklesen: number, taahhut: number): number {
  if (gerceklesen <= taahhut) return 0;
  const asimOran = gerceklesen / taahhut;
  if (asimOran <= 1.5) return 5;
  if (asimOran <= 2) return 10;
  return 15;
}

/** Bir kredi ve taahhüt-farkından durum etiketi türet. */
function durumTuret(kredi: number, riskteMi: boolean): SlaDurumu {
  if (kredi > 0) return "ihlal";
  return riskteMi ? "risk" : "karşılanıyor";
}

/**
 * Gerçek olaylardan SLA metriklerini türet ve uyum + kredi hesapla.
 *
 * - uptime: başarısız (5xx-benzeri) sinyal yerine, gözlemlenen olaylar
 *   içinde "hizmet-hatası" sayılabilecek durumların oranından türetilir.
 *   Bu platformda gerçek hata kodu tutulmuyor; bu yüzden gecikme dağılımının
 *   en kötü kuyruğunu (aşırı gecikme = fiili kesinti) proxy alırız: p99'un
 *   taahhüt gecikmesinin >4 katı olduğu olaylar "downtime dakikası" sayılır.
 *   Bu, dürüstçe "gözlem-türevi" olarak etiketlenmelidir.
 * - latency p95: doğrudan event.latency dağılımının 95. yüzdeliği (gerçek).
 * - support: gözlemlenen olay yoğunluğundan türetilen temsili ilk-yanıt.
 *
 * @param events Ham olaylar (event.latency alanı p95 için kullanılır).
 * @param plan   SLA taahhütlerini taşıyan plan.
 */
export function slaTakip(events: BotEvent[], plan: OlcumPlan): SlaDurum[] {
  const gecikmeler = events.map((e) => e.latency).filter((n) => typeof n === "number" && n >= 0);
  const p95 = Math.round(yuzdelik(gecikmeler, 95));
  const p99 = yuzdelik(gecikmeler, 99);

  /* --- uptime türevi --- */
  // "Fiili kesinti" proxy'si: taahhüt p95'in 4 katından yavaş olaylar servis
  // hatası kabul edilir. Bu olayların oranı → downtime oranı → uptime %.
  const kesintiEsigi = plan.slaLatencyP95 * 4;
  const kesintiSayisi = events.filter((e) => e.latency > kesintiEsigi).length;
  const gozlem = Math.max(1, events.length);
  const kesintiOran = kesintiSayisi / gozlem;
  // Uptime = 100 − kesinti oranı (yüzde). 2 ondalık.
  const uptimeGercek = Math.round((100 - kesintiOran * 100) * 100) / 100;

  /* --- support türevi --- */
  // Gözlemlenen olay hacmi arttıkça yanıt gecikmesi artar (yük baskısı).
  // Temsili: taban destek süresi × (1 + hacim baskısı). Hacim baskısı,
  // günlük ~ortalama olay yoğunluğunun bir fonksiyonu (deterministik).
  const gunSet = new Set(events.map((e) => gunKey(e.ts)));
  const gunAdedi = Math.max(1, gunSet.size);
  const gunlukHacim = events.length / gunAdedi;
  // Her 5.000 günlük olay, ilk-yanıtı yaklaşık %10 uzatır (varsayım, sınırlı).
  const baski = Math.min(1.5, gunlukHacim / 5000 * 0.1);
  const supportGercek = Math.round(plan.destekYaniti * (1 + baski) * 10) / 10;

  /* --- metrikleri paketle --- */
  const uptimeKrediDeg = uptimeKredi(uptimeGercek, plan.slaUptime);
  const uptimeRisk = uptimeGercek < plan.slaUptime + 0.05 && uptimeGercek >= plan.slaUptime;

  const latencyKrediDeg = latencyKredi(p95, plan.slaLatencyP95);
  const latencyRisk = p95 <= plan.slaLatencyP95 && p95 >= plan.slaLatencyP95 * 0.9;

  const supportKrediDeg = supportKredi(supportGercek, plan.destekYaniti);
  const supportRisk = supportGercek <= plan.destekYaniti && supportGercek >= plan.destekYaniti * 0.9;

  return [
    {
      anahtar: "uptime",
      metrik: "Çalışma süresi",
      taahhut: plan.slaUptime,
      gerceklesen: uptimeGercek,
      birim: "%",
      yuksekIyi: true,
      durum: durumTuret(uptimeKrediDeg, uptimeRisk),
      kredi: uptimeKrediDeg,
      aciklama:
        "Aşırı gecikmeli (taahhüt p95'in 4 katından yavaş) olaylar fiili kesinti sayılır; oranı çalışma süresini düşürür.",
    },
    {
      anahtar: "latency",
      metrik: "Engelleme gecikmesi (p95)",
      taahhut: plan.slaLatencyP95,
      gerceklesen: p95,
      birim: "ms",
      yuksekIyi: false,
      durum: durumTuret(latencyKrediDeg, latencyRisk),
      kredi: latencyKrediDeg,
      aciklama: `Gerçek olay gecikmelerinin 95. yüzdeliği. p99: ${Math.round(p99)} ms.`,
    },
    {
      anahtar: "support",
      metrik: "Destek ilk-yanıt",
      taahhut: plan.destekYaniti,
      gerceklesen: supportGercek,
      birim: "sa",
      yuksekIyi: false,
      durum: durumTuret(supportKrediDeg, supportRisk),
      kredi: supportKrediDeg,
      aciklama: "Gözlemlenen olay hacminin yarattığı yük baskısından türetilen temsili ilk-yanıt süresi.",
    },
  ];
}

/* ------------------------------------------------------------------ Ölçüm özeti */

/** Genel ölçüm + SLA özeti. */
export interface OlcumOzet {
  /** Bu dönem kullanılan doğrulama. */
  kullanilanDogrulama: number;
  /** Ay-sonu projeksiyon. */
  projeksiyon: number;
  /** Fatura projeksiyonu (taban + aşım). */
  faturaTahmini: number;
  /** Toplam türetilmiş API çağrısı. */
  apiCagri: number;
  /** Genel SLA uyumu: tüm metrikler karşılanıyorsa "karşılanıyor",
   * herhangi biri ihlalse "ihlal", aksi halde "risk". */
  slaUyum: SlaDurumu;
  /** İhlal eden SLA metriği sayısı. */
  ihlalSayisi: number;
  /** Toplam kredi yüzdesi (tüm ihlallerin kredi toplamı, aylık ücretin %'si). */
  toplamKrediYuzde: number;
  /** Toplam kredi tutarı (TL) = aylık ücret × toplam kredi yüzdesi. */
  toplamKrediTutar: number;
}

/** Kullanım + SLA sonuçlarından genel özet çıkar. */
export function olcumOzet(kullanim: KullanimSonuc, sla: SlaDurum[], plan: OlcumPlan): OlcumOzet {
  const ihlaller = sla.filter((s) => s.durum === "ihlal");
  const riskler = sla.filter((s) => s.durum === "risk");
  const slaUyum: SlaDurumu = ihlaller.length > 0 ? "ihlal" : riskler.length > 0 ? "risk" : "karşılanıyor";
  const toplamKrediYuzde = sla.reduce((a, s) => a + s.kredi, 0);
  // Kredi tabanı = aylık taban ücret (aşım hariç). Ücretsiz planda 0.
  const toplamKrediTutar = Math.round(plan.fiyat * (toplamKrediYuzde / 100));

  return {
    kullanilanDogrulama: kullanim.kullanilanDogrulama,
    projeksiyon: kullanim.projeksiyon,
    faturaTahmini: kullanim.faturaTahmini,
    apiCagri: kullanim.apiCagri,
    slaUyum,
    ihlalSayisi: ihlaller.length,
    toplamKrediYuzde,
    toplamKrediTutar,
  };
}

/* ------------------------------------------------------------------ Plan karşılaştırma */

/** Bir üst plana yükseltme önerisi (kotaya yaklaşırken). */
export interface YukseltmeOneri {
  /** Yükseltme gerekli/önerilir mi. */
  onerilir: boolean;
  /** Önerilen plan (yoksa null — zaten en üstte ya da gerek yok). */
  hedef: OlcumPlan | null;
  /** Öneri gerekçesi (insan-okur). */
  gerekce: string;
}

/**
 * Projeksiyona göre yükseltme önerisi.
 * Öneri: mevcut plan projeksiyonu aşıyorsa VEYA %90+ dolduysa, projeksiyonu
 * sığdıran en küçük üst plan önerilir.
 */
export function yukseltmeOneri(kullanim: KullanimSonuc, mevcut: OlcumPlan): YukseltmeOneri {
  const yaklasiyor = kullanim.kotaYuzde >= 0.9;
  const asiyor = kullanim.asimRiski;
  const sirali = [...PLANLAR].sort((a, b) => a.aylikKota - b.aylikKota);
  const idx = sirali.findIndex((p) => p.id === mevcut.id);

  if (!asiyor && !yaklasiyor) {
    return {
      onerilir: false,
      hedef: null,
      gerekce: "Mevcut plan tahmini ay-sonu kullanımını rahatça karşılıyor. Yükseltme gerekmez.",
    };
  }
  // Projeksiyonu sığdıran, mevcuttan büyük en küçük plan.
  const hedef = sirali.find((p, i) => i > idx && kullanim.projeksiyon <= p.aylikKota) ?? null;
  if (!hedef) {
    return {
      onerilir: asiyor,
      hedef: null,
      gerekce: asiyor
        ? "Projeksiyon en yüksek planın kotasını da aşıyor; kurumsal aşım anlaşması gerekli."
        : "Kotanın sonuna yaklaşıyorsun ama daha üst bir kademe yok.",
    };
  }
  return {
    onerilir: true,
    hedef,
    gerekce: asiyor
      ? `Ay-sonu projeksiyonun (${kullanim.projeksiyon.toLocaleString("tr-TR")}) mevcut kotayı aşıyor. ${hedef.ad} planı bu kullanımı sığdırır ve aşım ücretinden kaçınmanı sağlar.`
      : `Kotanın %${Math.round(kullanim.kotaYuzde * 100)}'ini kullandın. ${hedef.ad} planına geçmek büyüme için tampon sağlar.`,
  };
}
