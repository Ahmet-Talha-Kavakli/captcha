/**
 * Specter — API Anahtarı Güvenlik & Rotasyon Analizi
 * ==================================================
 * API anahtarları sessiz risklerdir: eski, hiç döndürülmemiş, geniş kapsamlı ya
 * da sızmış bir anahtar tüm hesabı tehlikeye atar. Bu modül her anahtarın güvenlik
 * duruşunu puanlar (yaş / son-rotasyon / kapsam hijyeni / sızıntı / kullanım) ve
 * eyleme dönük uyarılar üretir: "şu anahtar 210 gündür döndürülmedi — döndür",
 * "sızmış anahtar aktif — HEMEN döndür/iptal et".
 *
 * Saf/deterministik: `bugun` parametre olarak geçer, Date.now KULLANILMAZ.
 */
import type { ApiToken } from "@/lib/db/schema";

const GUN = 86400000;
/** Bu yaştan sonra rotasyon önerilir (90 gün en iyi uygulama). */
export const ROTASYON_ONERI_GUN = 90;
/** Bu yaştan sonra rotasyon KRİTİK (180 gün). */
export const ROTASYON_KRITIK_GUN = 180;

export type AnahtarDurum = "saglikli" | "eskiyor" | "kritik" | "sizmis" | "kullanilmiyor" | "iptal";

export interface AnahtarGuvenlik {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  scopes: string[];
  /** Son rotasyondan (yoksa oluşturmadan) bu yana geçen gün. */
  yasGun: number;
  rotationCount: number;
  lastUsedGun: number | null; // son kullanımdan bu yana gün
  leaked: boolean;
  leakSource?: string;
  revoked: boolean;
  durum: AnahtarDurum;
  /** 0-100 güvenlik skoru (yüksek = güvenli). */
  guvenlikSkoru: number;
  /** Eyleme dönük uyarılar. */
  uyarilar: string[];
  /** Önerilen eylem. */
  oneri: "yok" | "dondur" | "iptal";
}

/** Geniş/riskli kapsamlar (az-ayrıcalık ilkesine aykırı). */
const GENIS_KAPSAM = new Set(["*", "admin", "full", "write:all", "tüm"]);

export function anahtarGuvenlikAnaliz(token: ApiToken, bugun: number): AnahtarGuvenlik {
  const referans = token.lastRotatedAt ?? token.createdAt;
  const yasGun = Math.max(0, Math.floor((bugun - referans) / GUN));
  const lastUsedGun = token.lastUsed ? Math.max(0, Math.floor((bugun - token.lastUsed) / GUN)) : null;
  const uyarilar: string[] = [];

  let skor = 100;
  let durum: AnahtarDurum = "saglikli";
  let oneri: "yok" | "dondur" | "iptal" = "yok";

  if (token.revoked) {
    return {
      id: token.id, name: token.name, prefix: token.prefix, environment: token.environment,
      scopes: token.scopes, yasGun, rotationCount: token.rotationCount ?? 0, lastUsedGun,
      leaked: false, revoked: true, durum: "iptal", guvenlikSkoru: 0,
      uyarilar: ["Bu anahtar iptal edilmiş — artık çalışmıyor."], oneri: "yok",
    };
  }

  // Sızıntı — en yüksek öncelik.
  if (token.leaked) {
    durum = "sizmis";
    oneri = "dondur";
    skor -= 70;
    uyarilar.push(`Sızıntı tespit edildi${token.leakSource ? ` (${token.leakSource})` : ""} — HEMEN döndür veya iptal et.`);
  }

  // Yaş / rotasyon.
  if (yasGun >= ROTASYON_KRITIK_GUN) {
    if (durum === "saglikli") durum = "kritik";
    if (oneri === "yok") oneri = "dondur";
    skor -= 40;
    uyarilar.push(`${yasGun} gündür döndürülmedi (kritik eşik ${ROTASYON_KRITIK_GUN}g) — döndür.`);
  } else if (yasGun >= ROTASYON_ONERI_GUN) {
    if (durum === "saglikli") durum = "eskiyor";
    if (oneri === "yok") oneri = "dondur";
    skor -= 20;
    uyarilar.push(`${yasGun} gündür döndürülmedi (öneri ${ROTASYON_ONERI_GUN}g) — döndürmeyi düşün.`);
  }

  // Kapsam hijyeni.
  const genis = token.scopes.filter((s) => GENIS_KAPSAM.has(s.toLowerCase()));
  if (genis.length > 0) {
    skor -= 15;
    uyarilar.push(`Geniş kapsam (${genis.join(", ")}) — az-ayrıcalık ilkesine göre daralt.`);
  }
  if (token.scopes.length === 0) {
    skor -= 5;
    uyarilar.push("Kapsam tanımsız — açık kapsamlar belirle.");
  }

  // Kullanılmıyor (canlı ama 60+ gün sessiz).
  if (lastUsedGun !== null && lastUsedGun >= 60 && token.environment === "live") {
    if (durum === "saglikli") durum = "kullanilmiyor";
    skor -= 10;
    uyarilar.push(`${lastUsedGun} gündür kullanılmıyor — gereksizse iptal et (saldırı yüzeyini küçült).`);
    if (oneri === "yok") oneri = "iptal";
  }
  // Hiç kullanılmamış + eski.
  if (lastUsedGun === null && yasGun >= 30) {
    skor -= 8;
    uyarilar.push("Hiç kullanılmamış — gereksizse iptal et.");
  }

  if (uyarilar.length === 0) uyarilar.push("Güvenli — güncel ve dar kapsamlı.");

  return {
    id: token.id, name: token.name, prefix: token.prefix, environment: token.environment,
    scopes: token.scopes, yasGun, rotationCount: token.rotationCount ?? 0, lastUsedGun,
    leaked: !!token.leaked, leakSource: token.leakSource, revoked: false,
    durum, guvenlikSkoru: Math.max(0, Math.min(100, skor)), uyarilar, oneri,
  };
}

export interface AnahtarOzet {
  toplam: number;
  saglikli: number;
  dondurulmeli: number; // eskiyor + kritik + sızmış
  sizmis: number;
  ortSkor: number;
  enEski: number; // gün
}

export function anahtarOzet(analizler: AnahtarGuvenlik[]): AnahtarOzet {
  const aktif = analizler.filter((a) => !a.revoked);
  const dondurulmeli = aktif.filter((a) => a.oneri === "dondur").length;
  const sizmis = aktif.filter((a) => a.leaked).length;
  const ortSkor = aktif.length ? Math.round(aktif.reduce((s, a) => s + a.guvenlikSkoru, 0) / aktif.length) : 100;
  const enEski = aktif.reduce((m, a) => Math.max(m, a.yasGun), 0);
  return {
    toplam: aktif.length,
    saglikli: aktif.filter((a) => a.durum === "saglikli").length,
    dondurulmeli, sizmis, ortSkor, enEski,
  };
}

export const DURUM_ETIKET: Record<AnahtarDurum, string> = {
  saglikli: "Sağlıklı", eskiyor: "Eskiyor", kritik: "Kritik yaş", sizmis: "Sızmış", kullanilmiyor: "Atıl", iptal: "İptal",
};
export const DURUM_RENK: Record<AnahtarDurum, string> = {
  saglikli: "#16a34a", eskiyor: "#d97706", kritik: "#dc2626", sizmis: "#dc2626", kullanilmiyor: "#64748b", iptal: "#94a3b8",
};
