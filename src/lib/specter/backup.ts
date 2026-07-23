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
import type { Rule } from "@/lib/db/schema";

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

export interface RestoreSonuc {
  ok: boolean;
  hata?: string;
  geriYuklenen: { kural: number; aiPolitika: number };
  atlanan: { kural: number; sebep?: string };
}

/**
 * Yedekten GÜVENLİ geri yükleme. Yalnızca maskelenmemiş ve güvenli veriyi
 * geri yükler: KURALLAR (kullanıcının mevcut bir sitesine bağlanır) + AI
 * POLİTİKALARI. Siteler/webhooklar SIRLARI maskeli olduğundan geri yüklenmez
 * (yanlış/kırık gizli anahtarla site oluşturmayı önler) — dürüstçe atlanır.
 * Yıkıcı DEĞİLDİR: mevcut kurallar silinmez, yedektekiler EKLENİR.
 */
export function yedektenGeriYukle(ownerId: string, veri: unknown): RestoreSonuc {
  const dogr = yedekDogrula(veri);
  if (!dogr.gecerli) {
    return { ok: false, hata: dogr.hata, geriYuklenen: { kural: 0, aiPolitika: 0 }, atlanan: { kural: 0 } };
  }
  const y = veri as Yedek;
  const siteler = Sites.forOwner(ownerId);
  if (siteler.length === 0) {
    return {
      ok: false,
      hata: "Kuralları bağlayacak bir siteniz yok. Önce bir site ekleyin.",
      geriYuklenen: { kural: 0, aiPolitika: 0 },
      atlanan: { kural: Array.isArray(y.kurallar) ? y.kurallar.length : 0, sebep: "site-yok" },
    };
  }
  const gecerliSiteIds = new Set(siteler.map((s) => s.id));
  const varsayilanSite = siteler[0].id;

  let kuralSayi = 0;
  for (const ham of (y.kurallar ?? []) as Record<string, unknown>[]) {
    if (!ham || typeof ham !== "object" || typeof ham.name !== "string") continue;
    // siteId geçerli mi? Değilse ilk siteye bağla (hesaplar arası taşınabilirlik).
    const siteId = typeof ham.siteId === "string" && gecerliSiteIds.has(ham.siteId) ? ham.siteId : varsayilanSite;
    Rules.create({
      siteId,
      name: String(ham.name),
      description: typeof ham.description === "string" ? ham.description : "",
      enabled: ham.enabled !== false,
      priority: typeof ham.priority === "number" ? ham.priority : 100,
      field: (ham.field ?? "path") as Rule["field"],
      op: (ham.op ?? "eq") as Rule["op"],
      value: typeof ham.value === "string" ? ham.value : "",
      action: (ham.action ?? "challenge") as Rule["action"],
      kosulGrup: ham.kosulGrup as Rule["kosulGrup"],
    });
    kuralSayi++;
  }

  // AI politikaları (maskesiz, güvenli) — toplu uygula.
  let aiSayi = 0;
  if (y.aiPolitikalari && typeof y.aiPolitikalari === "object") {
    const gecerli = Object.fromEntries(
      Object.entries(y.aiPolitikalari).filter(([, v]) => typeof v === "string"),
    );
    aiSayi = Object.keys(gecerli).length;
    if (aiSayi > 0) Users.setAiPolicies(ownerId, gecerli);
  }

  return {
    ok: true,
    geriYuklenen: { kural: kuralSayi, aiPolitika: aiSayi },
    atlanan: { kural: (y.kurallar?.length ?? 0) - kuralSayi },
  };
}
