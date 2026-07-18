/**
 * Specter Edge — Yönlendirme & geo-steering motoru (SAF)
 * ======================================================
 * Çok-bölge edge dağıtımının çekirdek mantığı: bir isteğin coğrafyasını
 * (ISO2 ülke kodu) alıp büyük-çember (haversine) mesafesiyle en yakın PoP'a
 * yönlendirmek, PoP başına yük dağıtmak, kapasiteye göre sağlık kararı vermek,
 * bir PoP düşerse trafiğin nereye devrileceğini (failover) planlamak ve
 * anycast ağırlık dağılımını türetmek.
 *
 * DETERMİNİZM: Bu dosya tamamen SAF'tır — Date.now / Math.random / argümansız
 * new Date YOKTUR. Aynı girdi her zaman aynı çıktıyı verir. Böylece sunucu
 * render'ı ile istemci hidrasyonu birebir aynı olur.
 *
 * Bağımlılık: yalnızca ULKE_KOORDINAT (salt-okunur koordinat tablosu). PoP
 * konumları çağıran tarafça (lat/lon) geçirilir — bu modül DB'ye dokunmaz.
 */

import { ULKE_KOORDINAT } from "./ulke-koordinat";

/* ------------------------------------------------------------------ tipler */

/** Yönlendirme için gereken asgari PoP arayüzü (pops.ts'teki Pop ile uyumlu). */
export interface YonPop {
  kod: string;
  lat: number;
  lon: number;
  /** Kapasite kullanımı taban değeri (%) — mevcut yük buna eklenir. */
  kapasite: number;
  /** Bu PoP'un işleyebileceği tepe istek/sn (RPS) — headroom hesabı için. */
  rps: number;
  /** Bakımdaki/pasif PoP yönlendirmeye dahil edilmez. */
  durum?: "saglikli" | "dejenere" | "bakim";
}

/** Bir PoP'a düşen yük özeti. */
export interface PopYuk {
  kod: string;
  /** Bu PoP'a yönlenen olay sayısı. */
  olay: number;
  /** Toplam trafiğe göre pay (0..100). */
  pay: number;
}

/** popSaglik çıktısı — kapasiteye göre trafik-ışığı. */
export interface SaglikDurum {
  /** yeşil = rahat, sarı = uyarı eşiği, kırmızı = doygun/aşırı. */
  seviye: "yesil" | "sari" | "kirmizi";
  /** Tahmini toplam kapasite kullanımı (%). */
  kullanim: number;
  /** 100'e kalan boşluk (%). */
  headroom: number;
}

/** failoverPlan çıktısı — düşen PoP'un trafiğinin dağıtımı. */
export interface FailoverHedef {
  kod: string;
  /** Bu hedefe devrilen olay sayısı. */
  devralinan: number;
  /** Düşen trafiğin bu hedefe giden yüzdesi (0..100). */
  pay: number;
  /** Düşen PoP'a olan mesafe (km) — yakınlık sırası. */
  mesafeKm: number;
}

/* ------------------------------------------------------------------ haversine */

const DUNYA_YARICAP_KM = 6371;

function derece2radyan(d: number): number {
  return (d * Math.PI) / 180;
}

/**
 * İki coğrafi nokta arasındaki büyük-çember (haversine) mesafesi — km.
 * Saf: yalnızca Math.sin/cos/sqrt/atan2 kullanır (rastgelelik yok).
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = derece2radyan(lat2 - lat1);
  const dLon = derece2radyan(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(derece2radyan(lat1)) *
      Math.cos(derece2radyan(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return DUNYA_YARICAP_KM * c;
}

/* ------------------------------------------------------------------ enYakinPop */

/**
 * Bir ülkenin (ISO2) en yakın PoP'unu büyük-çember mesafeyle bulur.
 * Bakımdaki PoP'lar yönlendirme dışıdır. Koordinatı bilinmeyen ülke veya
 * uygun PoP yoksa null döner. Eşitlikte kod'a göre kararlı (deterministik).
 *
 * @returns { pop, mesafeKm } — en yakın PoP ve mesafesi, ya da null.
 */
export function enYakinPop(
  ulkeKodu: string,
  poplar: YonPop[],
): { pop: YonPop; mesafeKm: number } | null {
  const koord = ULKE_KOORDINAT[ulkeKodu?.toUpperCase()];
  if (!koord) return null;
  const [lat, lon] = koord;

  const uygun = poplar.filter((p) => p.durum !== "bakim");
  if (uygun.length === 0) return null;

  let enIyi: YonPop | null = null;
  let enIyiMesafe = Infinity;
  for (const p of uygun) {
    const d = haversineKm(lat, lon, p.lat, p.lon);
    // < ile ilk kazananı tut; eşitlikte kod alfabetik küçük olan öne geçsin.
    if (d < enIyiMesafe || (d === enIyiMesafe && enIyi && p.kod < enIyi.kod)) {
      enIyiMesafe = d;
      enIyi = p;
    }
  }
  return enIyi ? { pop: enIyi, mesafeKm: Math.round(enIyiMesafe) } : null;
}

/* ------------------------------------------------------------------ trafikYonlendir */

/** trafikYonlendir'e giren olayın asgari şekli (BotEvent ile uyumlu). */
export interface YonOlay {
  country: string;
}

/**
 * Olay akışını en yakın-PoP mantığıyla dağıtır; PoP başına yük döndürür.
 * Yönlendirilemeyen olaylar (koordinatı olmayan ülke) sayaç dışında bırakılır
 * ama `yonlendirilemeyen` alanında raporlanır.
 *
 * @returns { yukler, toplam, yonlendirilemeyen } — kod→PoPYuk haritası +
 *   toplam yönlenen olay + yönlendirilemeyen olay sayısı.
 */
export function trafikYonlendir(
  events: YonOlay[],
  poplar: YonPop[],
): { yukler: PopYuk[]; toplam: number; yonlendirilemeyen: number } {
  const sayac = new Map<string, number>();
  for (const p of poplar) sayac.set(p.kod, 0);

  let toplam = 0;
  let yonlendirilemeyen = 0;
  for (const e of events) {
    const hedef = enYakinPop(e.country, poplar);
    if (!hedef) {
      yonlendirilemeyen++;
      continue;
    }
    sayac.set(hedef.pop.kod, (sayac.get(hedef.pop.kod) ?? 0) + 1);
    toplam++;
  }

  const bolen = toplam || 1;
  const yukler: PopYuk[] = poplar.map((p) => {
    const olay = sayac.get(p.kod) ?? 0;
    return { kod: p.kod, olay, pay: Math.round((olay / bolen) * 1000) / 10 };
  });
  return { yukler, toplam, yonlendirilemeyen };
}

/* ------------------------------------------------------------------ popSaglik */

/**
 * Bir PoP'un sağlık/kapasite durumunu, taban kapasite kullanımı ile bu tur
 * düşen ek yükü birleştirerek verir. Ek yük, PoP'a düşen trafik payının
 * kapasite baskısına çevrilmesiyle modellenir (pay ne kadar yüksekse baskı o
 * kadar artar). Saf ve deterministik.
 *
 * @param pop  Değerlendirilecek PoP (taban kapasite % içerir).
 * @param yuk  Bu PoP'a düşen trafik payı (0..100). trafikYonlendir'in payı.
 */
export function popSaglik(pop: YonPop, yuk: number): SaglikDurum {
  // Ek baskı: trafik payının yarısı kadar kapasiteye eklenir (yumuşak model).
  const ekBaski = Math.max(0, yuk) * 0.5;
  const kullanim = Math.min(100, Math.round(pop.kapasite + ekBaski));
  const headroom = Math.max(0, 100 - kullanim);
  // Dejenere PoP zaten stres altında → eşikler bir kademe sıkılaşır.
  const dejenere = pop.durum === "dejenere";
  const kirmiziEsik = dejenere ? 78 : 85;
  const sariEsik = dejenere ? 60 : 68;
  const seviye: SaglikDurum["seviye"] =
    kullanim >= kirmiziEsik ? "kirmizi" : kullanim >= sariEsik ? "sari" : "yesil";
  return { seviye, kullanim, headroom };
}

/* ------------------------------------------------------------------ failoverPlan */

/**
 * Bir PoP düşerse (dusukPop), onun trafiğinin nereye devrileceğini planlar.
 * Kalan (bakımda/düşen olmayan) PoP'lar mesafeye göre sıralanır; düşen
 * trafik, yakınlık ağırlığı (1/mesafe) ile en yakın komşulara dağıtılır.
 * Böylece en yakın komşu en büyük payı alır — gerçek health-check failover'ı
 * gibi. Saf ve deterministik.
 *
 * @param dusukPop  Düşen (kapatılan) PoP.
 * @param poplar    Tüm PoP kataloğu (dusukPop dahil).
 * @param dusukOlay Düşen PoP'un dağıtılacak olay sayısı (varsayılan 0).
 */
export function failoverPlan(
  dusukPop: YonPop,
  poplar: YonPop[],
  dusukOlay = 0,
): FailoverHedef[] {
  // Aday hedefler: düşen PoP değil, bakımda değil, dejenere değil (sağlıklılar).
  const adaylar = poplar.filter(
    (p) => p.kod !== dusukPop.kod && p.durum !== "bakim" && p.durum !== "dejenere",
  );
  if (adaylar.length === 0) return [];

  // Her adaya mesafe + yakınlık ağırlığı (1/(mesafe+1) — sıfır bölme koruması).
  const olculu = adaylar
    .map((p) => {
      const mesafeKm = Math.round(haversineKm(dusukPop.lat, dusukPop.lon, p.lat, p.lon));
      return { kod: p.kod, mesafeKm, agirlik: 1 / (mesafeKm + 1) };
    })
    .sort((a, b) => a.mesafeKm - b.mesafeKm || (a.kod < b.kod ? -1 : 1));

  const agirlikToplam = olculu.reduce((a, o) => a + o.agirlik, 0) || 1;

  // Olayları ağırlıkla dağıt; yuvarlama artığını en yakın komşuya ekle.
  let dagitilan = 0;
  const hedefler: FailoverHedef[] = olculu.map((o, i) => {
    const oran = o.agirlik / agirlikToplam;
    let devralinan = Math.floor(dusukOlay * oran);
    // Son eleman değilse artığı sona bırak; en yakın (ilk) komşuya kalanı ver.
    if (i === 0) devralinan = devralinan; // ilk eleman normal
    dagitilan += devralinan;
    return {
      kod: o.kod,
      devralinan,
      pay: Math.round(oran * 1000) / 10,
      mesafeKm: o.mesafeKm,
    };
  });
  // Yuvarlama kaybını en yakın komşuya (ilk) ekleyerek toplamı koru.
  const artik = dusukOlay - dagitilan;
  if (artik > 0 && hedefler.length > 0) hedefler[0].devralinan += artik;

  return hedefler;
}

/* ------------------------------------------------------------------ anycastDagilim */

/** anycastDagilim çıktısı — PoP başına anycast ağırlığı. */
export interface AnycastPay {
  kod: string;
  /** Anycast duyuru ağırlığı (0..100). Toplamları ~100. */
  agirlik: number;
}

/**
 * Anycast ağırlık dağılımı: her PoP'un aldığı trafik payını, aktif PoP'lar
 * arasında normalize edip temsili bir anycast ağırlığına çevirir. Bakımdaki
 * PoP'lar 0 ağırlık alır (anycast duyurusu çekilmiş sayılır). Saf.
 *
 * @param yukler PoP başına yük (trafikYonlendir çıktısı).
 * @param poplar Durum bilgisi için PoP kataloğu.
 */
export function anycastDagilim(yukler: PopYuk[], poplar: YonPop[]): AnycastPay[] {
  const durumHar = new Map(poplar.map((p) => [p.kod, p.durum]));
  const aktif = yukler.filter((y) => durumHar.get(y.kod) !== "bakim");
  const toplamOlay = aktif.reduce((a, y) => a + y.olay, 0);

  if (toplamOlay === 0) {
    // Olay yoksa aktif PoP'lara eşit ağırlık ver.
    const eşit = aktif.length ? Math.round((100 / aktif.length) * 10) / 10 : 0;
    return poplar.map((p) => ({
      kod: p.kod,
      agirlik: p.durum === "bakim" ? 0 : eşit,
    }));
  }

  return poplar.map((p) => {
    if (p.durum === "bakim") return { kod: p.kod, agirlik: 0 };
    const y = yukler.find((z) => z.kod === p.kod);
    const olay = y?.olay ?? 0;
    return { kod: p.kod, agirlik: Math.round((olay / toplamOlay) * 1000) / 10 };
  });
}

/* ------------------------------------------------------------------ kapasiteOzet */

/** kapasiteOzet çıktısı — ağ geneli kapasite başlık metrikleri. */
export interface KapasiteOzet {
  /** Aktif PoP'ların toplam tepe RPS kapasitesi. */
  toplamKapasiteRps: number;
  /** Şu anki toplam RPS (taban). */
  kullanilanRps: number;
  /** Ağ geneli boşluk (%). */
  headroomYuzde: number;
  /** En doygun (en az boşluğu olan) PoP kodu. */
  enDolu: string | null;
}

/**
 * Ağ geneli kapasite headroom özeti. RPS taban değerlerini, PoP kapasite
 * kullanımından çıkarımlanan tepe kapasiteye oranlar. Saf ve deterministik.
 *
 * Tepe kapasite tahmini: rps / (kapasite/100) — mevcut RPS'nin kapasite
 * kullanımına bölümü, o PoP'un teorik tavanını verir.
 */
export function kapasiteOzet(poplar: YonPop[]): KapasiteOzet {
  const aktif = poplar.filter((p) => p.durum !== "bakim");
  let toplamKapasiteRps = 0;
  let kullanilanRps = 0;
  let enDolu: string | null = null;
  let enDoluKullanim = -1;

  for (const p of aktif) {
    const oran = Math.max(1, p.kapasite) / 100;
    const tavan = Math.round(p.rps / oran);
    toplamKapasiteRps += tavan;
    kullanilanRps += p.rps;
    if (p.kapasite > enDoluKullanim) {
      enDoluKullanim = p.kapasite;
      enDolu = p.kod;
    }
  }

  const headroomYuzde =
    toplamKapasiteRps > 0
      ? Math.round((1 - kullanilanRps / toplamKapasiteRps) * 1000) / 10
      : 0;

  return { toplamKapasiteRps, kullanilanRps, headroomYuzde, enDolu };
}
