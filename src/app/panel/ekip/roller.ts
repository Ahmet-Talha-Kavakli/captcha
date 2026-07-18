/**
 * Specter — Rol & İzin Matrisi (tek kaynak)
 * ==========================================
 * 4 rol × 6 yetenek. Bu tablo hem görsel matriste hem de sunucu tarafında
 * (davet/rol değişikliği yetki kontrolü) kullanılır. İnce izinler
 * TeamCapability anahtarlarıyla ifade edilir.
 */
import type { Role, TeamCapability } from "@/lib/db/schema";

export interface RolTanim {
  anahtar: Role;
  ad: string;
  aciklama: string;
  /** Rozet tonu (kit Badge). */
  ton: "brand" | "mavi" | "gri";
  /** Bu rolün doğal olarak sahip olduğu yetenekler. */
  yetenekler: TeamCapability[];
}

export interface YetenekTanim {
  anahtar: TeamCapability;
  ad: string;
  aciklama: string;
}

/** Matris sütunları — insan-okur yetenek adları. */
export const YETENEKLER: YetenekTanim[] = [
  { anahtar: "sites.manage", ad: "Site yönetimi", aciklama: "Site ekleme, çıkarma ve koruma yapılandırması." },
  { anahtar: "rules.edit", ad: "Kural düzenleme", aciklama: "Koruma kurallarını oluşturma, düzenleme ve silme." },
  { anahtar: "incidents.resolve", ad: "Olay çözümleme", aciklama: "Olayları atama, inceleme ve kapatma." },
  { anahtar: "team.manage", ad: "Ekip yönetimi", aciklama: "Üye davet etme, rol değiştirme ve çıkarma." },
  { anahtar: "apikeys.manage", ad: "API anahtarları", aciklama: "API anahtarı oluşturma ve döndürme." },
  { anahtar: "billing.manage", ad: "Faturalandırma", aciklama: "Plan, ödeme yöntemi ve fatura yönetimi." },
];

/** 4 rol — artan yetkiyle. */
export const ROLLER: RolTanim[] = [
  {
    anahtar: "viewer",
    ad: "İzleyici",
    aciklama: "Panoları, olayları ve analitikleri salt-okunur görüntüler. Hiçbir değişiklik yapamaz.",
    ton: "gri",
    yetenekler: [],
  },
  {
    anahtar: "analyst",
    ad: "Analist",
    aciklama: "Kuralları düzenler ve olayları çözümler. Günlük güvenlik operasyonunun sahibi.",
    ton: "mavi",
    yetenekler: ["rules.edit", "incidents.resolve"],
  },
  {
    anahtar: "admin",
    ad: "Yönetici",
    aciklama: "Faturalandırma dışında her şeye erişir; site, kural, ekip ve API anahtarlarını yönetir.",
    ton: "brand",
    yetenekler: ["sites.manage", "rules.edit", "incidents.resolve", "team.manage", "apikeys.manage"],
  },
  {
    anahtar: "owner",
    ad: "Sahip",
    aciklama: "Faturalandırma dahil tam erişim. Her hesapta yalnızca bir sahip bulunur; devredilebilir.",
    ton: "brand",
    yetenekler: ["sites.manage", "rules.edit", "incidents.resolve", "team.manage", "apikeys.manage", "billing.manage"],
  },
];

export const ROL_ETIKET: Record<Role, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  analyst: "Analist",
  viewer: "İzleyici",
};

const ROL_MAP = new Map<Role, RolTanim>(ROLLER.map((r) => [r.anahtar, r]));

/** Bir rolün belirli bir yeteneğe (varsayılan olarak) sahip olup olmadığı. */
export function rolYetenekli(rol: Role, yetenek: TeamCapability): boolean {
  return ROL_MAP.get(rol)?.yetenekler.includes(yetenek) ?? false;
}

/**
 * Bir üyenin efektif izinleri: rol varsayılanları + üyeye özel eklenen
 * izinler (permissions). Set olarak döner.
 */
export function efektifIzinler(rol: Role, ekstra?: TeamCapability[]): Set<TeamCapability> {
  const set = new Set<TeamCapability>(ROL_MAP.get(rol)?.yetenekler ?? []);
  for (const y of ekstra ?? []) set.add(y);
  return set;
}
