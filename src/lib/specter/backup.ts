/**
 * Specter — Veri Dışa/İçe Aktarma (Yedekleme & Geri Yükleme)
 * ==========================================================
 * Bir hesabın yapılandırmasını (siteler, kurallar, ekip, entegrasyonlar,
 * webhook'lar, AI politikaları, deneyler) taşınabilir bir JSON yedeğine
 * çevirir ve geri yükler. KVKK/GDPR "veri taşınabilirliği" hakkını da
 * karşılar (hesabın tüm verisini dışa aktar).
 *
 * NOT: Yalnızca YAPILANDIRMA yedeklenir (sırlar maskelenir). Olay geçmişi
 * gibi türetilmiş/büyük veriler ayrı bir "tam ihraç" ile alınabilir.
 */

import {
  Sites, Rules, Team, Integrations, Webhooks, Users, Experiments,
} from "@/lib/db/db";

export interface YedekMeta {
  surum: 1;
  olusturuldu: number; // epoch ms
  hesap: { ad: string; email: string; plan: string };
  kapsam: { site: number; kural: number; ekip: number; entegrasyon: number; webhook: number; deney: number };
}

export interface Yedek {
  meta: YedekMeta;
  siteler: unknown[];
  kurallar: unknown[];
  ekip: unknown[];
  entegrasyonlar: unknown[];
  webhooklar: unknown[];
  aiPolitikalari: Record<string, string>;
  denemeler: unknown[];
}

/** Sırları maskele (secretKey/secret asla düz yedeklenmez). */
function maskele<T extends Record<string, unknown>>(obj: T, alanlar: string[]): T {
  const kopya = { ...obj } as Record<string, unknown>;
  for (const a of alanlar) {
    if (typeof kopya[a] === "string") kopya[a] = "***MASKELENDI***";
  }
  return kopya as T;
}

/** Bir hesabın yapılandırma yedeğini üret. */
export function yedekOlustur(ownerId: string): Yedek {
  const user = Users.byId(ownerId);
  const siteler = Sites.forOwner(ownerId).map((s) => maskele(s as unknown as Record<string, unknown>, ["secretKey"]));
  const kurallar = Rules.forOwner(ownerId);
  const ekip = Team.forOwner(ownerId).map((t) => maskele(t as unknown as Record<string, unknown>, []));
  const entegrasyonlar = Integrations.forOwner(ownerId).map((i) => maskele(i as unknown as Record<string, unknown>, ["hedef"]));
  const webhooklar = Webhooks.forOwner(ownerId).map((w) => maskele(w as unknown as Record<string, unknown>, ["secret"]));
  const denemeler = Experiments.forOwner(ownerId);

  return {
    meta: {
      surum: 1,
      olusturuldu: Date.now(),
      hesap: { ad: user?.name ?? "", email: user?.email ?? "", plan: user?.plan ?? "free" },
      kapsam: {
        site: siteler.length, kural: kurallar.length, ekip: ekip.length,
        entegrasyon: entegrasyonlar.length, webhook: webhooklar.length, deney: denemeler.length,
      },
    },
    siteler,
    kurallar,
    ekip,
    entegrasyonlar,
    webhooklar,
    aiPolitikalari: user?.aiPolicies ?? {},
    denemeler,
  };
}

export interface GeriYuklemeSonuc {
  gecerli: boolean;
  hata?: string;
  ozet?: { site: number; kural: number; entegrasyon: number };
}

/**
 * Bir yedek dosyasını doğrula (geri yükleme önizlemesi). Gerçek uygulama
 * çakışma çözümü + doğrulama gerektirir; burada güvenli bir doğrulama +
 * özet döndürüyoruz (yıkıcı geri yükleme yerine güvenli önizleme).
 */
export function yedekDogrula(veri: unknown): GeriYuklemeSonuc {
  if (!veri || typeof veri !== "object") return { gecerli: false, hata: "Geçersiz dosya biçimi." };
  const y = veri as Partial<Yedek>;
  if (!y.meta || y.meta.surum !== 1) return { gecerli: false, hata: "Desteklenmeyen yedek sürümü." };
  if (!Array.isArray(y.siteler) || !Array.isArray(y.kurallar)) return { gecerli: false, hata: "Yedek yapısı eksik veya bozuk." };
  return {
    gecerli: true,
    ozet: {
      site: y.siteler.length,
      kural: y.kurallar.length,
      entegrasyon: Array.isArray(y.entegrasyonlar) ? y.entegrasyonlar.length : 0,
    },
  };
}
