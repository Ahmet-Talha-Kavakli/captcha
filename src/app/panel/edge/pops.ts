/**
 * Specter Edge Ağı — PoP (Point of Presence) sabit kataloğu
 * =========================================================
 * Specter'ın küresel anycast edge ağını temsil eden deterministik PoP
 * listesi. Gerçek bir kenar ağının (Cloudflare/Fastly seviyesi) izlediği
 * metrikler: bölge, konum, sağlık, gecikme (p50/p95/p99), kapasite
 * kullanımı ve trafik payı. Değerler sabittir (rastgele değil) — böylece
 * her sunucu render'ında ve her worker'da aynı görüntü çıkar.
 *
 * Bu modül yalnızca /panel/edge içinde kullanılır; DB'ye dokunmaz.
 */

/** Coğrafi bölge (kıta grubu). */
export type EdgeBolge = "avrupa" | "kuzey-amerika" | "asya" | "guney-amerika" | "okyanusya" | "afrika";

/** Bir PoP'un sağlık durumu. */
export type PopDurum = "saglikli" | "dejenere" | "bakim";

export interface Pop {
  /** Kısa kod (IATA benzeri havaalanı kodu — edge ağlarında standart). */
  kod: string;
  /** Şehir adı (Türkçe). */
  sehir: string;
  /** ISO2 ülke kodu (bayrak için). */
  ulke: string;
  /** Bağlı olduğu bölge grubu. */
  bolge: EdgeBolge;
  /** Sağlık durumu. */
  durum: PopDurum;
  /** Bölge-içi ortalama gecikme (ms) — en yakın kullanıcıya. */
  gecikme: number;
  /** p50 / p95 / p99 gecikme (ms). */
  p50: number;
  p95: number;
  p99: number;
  /** Bu PoP'tan geçen global trafik payı (%). Tüm PoP'ların toplamı ~100. */
  trafikPay: number;
  /** Kapasite kullanımı (%). */
  kapasite: number;
  /** Saniyedeki işlenen istek (RPS) — kabaca trafik payıyla orantılı. */
  rps: number;
  /** Yaklaşık enlem/boylam (dünya SVG üzerinde nokta konumu için). */
  lat: number;
  lon: number;
  /** Bu PoP'a bağlı upstream sağlayıcı / omurga (bilgi amaçlı). */
  omurga: string;
}

/** Bölge → Türkçe etiket. */
export const BOLGE_AD: Record<EdgeBolge, string> = {
  avrupa: "Avrupa",
  "kuzey-amerika": "Kuzey Amerika",
  asya: "Asya-Pasifik",
  "guney-amerika": "Güney Amerika",
  okyanusya: "Okyanusya",
  afrika: "Afrika / Orta Doğu",
};

/** Bölge → grafik/harita rengi (krem-uyumlu, brand ailesi). */
export const BOLGE_RENK: Record<EdgeBolge, string> = {
  avrupa: "#2f6fed",
  "kuzey-amerika": "#7c74ff",
  asya: "#0ea5a4",
  "guney-amerika": "#d97706",
  okyanusya: "#db2777",
  afrika: "#16a34a",
};

/** Durum → rozet tonu + etiket. */
export const DURUM_META: Record<PopDurum, { ton: "ok" | "warn" | "danger" | "gri"; etiket: string; nabiz: boolean }> = {
  saglikli: { ton: "ok", etiket: "Sağlıklı", nabiz: true },
  dejenere: { ton: "warn", etiket: "Dejenere", nabiz: true },
  bakim: { ton: "gri", etiket: "Bakımda", nabiz: false },
};

/**
 * Specter küresel edge PoP kataloğu — 16 lokasyon, 6 bölge.
 * Değerler gerçekçi ama tamamen sabittir (deterministik).
 */
export const POPS: Pop[] = [
  // --- Avrupa ---
  { kod: "IST", sehir: "İstanbul", ulke: "TR", bolge: "avrupa", durum: "saglikli", gecikme: 8, p50: 8, p95: 22, p99: 41, trafikPay: 11.4, kapasite: 63, rps: 18400, lat: 41.0, lon: 28.98, omurga: "Türk Telekom / Equinix" },
  { kod: "FRA", sehir: "Frankfurt", ulke: "DE", bolge: "avrupa", durum: "saglikli", gecikme: 6, p50: 6, p95: 18, p99: 34, trafikPay: 13.8, kapasite: 71, rps: 22300, lat: 50.11, lon: 8.68, omurga: "DE-CIX / Interxion" },
  { kod: "AMS", sehir: "Amsterdam", ulke: "NL", bolge: "avrupa", durum: "saglikli", gecikme: 7, p50: 7, p95: 19, p99: 36, trafikPay: 9.1, kapasite: 58, rps: 14700, lat: 52.37, lon: 4.9, omurga: "AMS-IX / Nikhef" },
  { kod: "LHR", sehir: "Londra", ulke: "GB", bolge: "avrupa", durum: "dejenere", gecikme: 12, p50: 12, p95: 38, p99: 74, trafikPay: 8.3, kapasite: 84, rps: 13400, lat: 51.51, lon: -0.13, omurga: "LINX / Telehouse" },

  // --- Kuzey Amerika ---
  { kod: "IAD", sehir: "Virginia (Ashburn)", ulke: "US", bolge: "kuzey-amerika", durum: "saglikli", gecikme: 9, p50: 9, p95: 24, p99: 45, trafikPay: 12.6, kapasite: 67, rps: 20400, lat: 39.04, lon: -77.49, omurga: "Equinix DC / AWS us-east-1" },
  { kod: "EWR", sehir: "New York", ulke: "US", bolge: "kuzey-amerika", durum: "saglikli", gecikme: 10, p50: 10, p95: 27, p99: 49, trafikPay: 7.7, kapasite: 61, rps: 12400, lat: 40.71, lon: -74.0, omurga: "NYIIX / Telx" },
  { kod: "SFO", sehir: "San Francisco", ulke: "US", bolge: "kuzey-amerika", durum: "saglikli", gecikme: 11, p50: 11, p95: 29, p99: 52, trafikPay: 6.4, kapasite: 55, rps: 10300, lat: 37.62, lon: -122.38, omurga: "SFMIX / CoreSite" },
  { kod: "YYZ", sehir: "Toronto", ulke: "US", bolge: "kuzey-amerika", durum: "bakim", gecikme: 14, p50: 14, p95: 31, p99: 58, trafikPay: 3.1, kapasite: 22, rps: 5000, lat: 43.68, lon: -79.63, omurga: "TorIX / Cologix" },

  // --- Asya-Pasifik ---
  { kod: "SIN", sehir: "Singapur", ulke: "IN", bolge: "asya", durum: "saglikli", gecikme: 9, p50: 9, p95: 26, p99: 48, trafikPay: 6.9, kapasite: 64, rps: 11100, lat: 1.35, lon: 103.99, omurga: "SGIX / Equinix SG" },
  { kod: "NRT", sehir: "Tokyo", ulke: "CN", bolge: "asya", durum: "saglikli", gecikme: 10, p50: 10, p95: 28, p99: 51, trafikPay: 5.8, kapasite: 60, rps: 9400, lat: 35.55, lon: 140.39, omurga: "JPNAP / Equinix TY" },
  { kod: "BOM", sehir: "Mumbai", ulke: "IN", bolge: "asya", durum: "dejenere", gecikme: 15, p50: 15, p95: 44, p99: 88, trafikPay: 4.7, kapasite: 81, rps: 7600, lat: 19.09, lon: 72.87, omurga: "Extreme-IX / NIXI" },
  { kod: "HKG", sehir: "Hong Kong", ulke: "CN", bolge: "asya", durum: "saglikli", gecikme: 11, p50: 11, p95: 30, p99: 55, trafikPay: 3.9, kapasite: 57, rps: 6300, lat: 22.31, lon: 113.91, omurga: "HKIX / Mega-i" },

  // --- Güney Amerika ---
  { kod: "GRU", sehir: "São Paulo", ulke: "BR", bolge: "guney-amerika", durum: "saglikli", gecikme: 13, p50: 13, p95: 35, p99: 66, trafikPay: 4.2, kapasite: 59, rps: 6800, lat: -23.43, lon: -46.47, omurga: "IX.br / Equinix SP" },

  // --- Okyanusya ---
  { kod: "SYD", sehir: "Sydney", ulke: "US", bolge: "okyanusya", durum: "saglikli", gecikme: 12, p50: 12, p95: 33, p99: 61, trafikPay: 2.6, kapasite: 48, rps: 4200, lat: -33.87, lon: 151.21, omurga: "IX Australia / NextDC" },

  // --- Afrika / Orta Doğu ---
  { kod: "DXB", sehir: "Dubai", ulke: "TR", bolge: "afrika", durum: "saglikli", gecikme: 13, p50: 13, p95: 36, p99: 68, trafikPay: 2.4, kapasite: 44, rps: 3900, lat: 25.25, lon: 55.36, omurga: "UAE-IX / Equinix DX" },
  { kod: "JNB", sehir: "Johannesburg", ulke: "BR", bolge: "afrika", durum: "dejenere", gecikme: 18, p50: 18, p95: 52, p99: 104, trafikPay: 1.9, kapasite: 76, rps: 3100, lat: -26.13, lon: 28.24, omurga: "NAPAfrica / Teraco" },
];

/** Gecikme (ms) → renk kodu (edge kalitesi eşikleri). */
export function gecikmeRengi(ms: number): string {
  if (ms <= 10) return "#16a34a"; // mükemmel
  if (ms <= 15) return "#2f6fed"; // iyi
  if (ms <= 25) return "#d97706"; // orta
  return "#dc2626"; // yüksek
}

/** Gecikme (ms) → durum tonu (Ilerleme/rozet için). */
export function gecikmeTon(ms: number): "ok" | "brand" | "warn" | "danger" {
  if (ms <= 10) return "ok";
  if (ms <= 15) return "brand";
  if (ms <= 25) return "warn";
  return "danger";
}
