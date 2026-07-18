/**
 * Specter — Global Panel Arama
 * =============================
 * Bir hesabın tüm varlıklarında (siteler, kurallar, IP itibarı, kampanyalar,
 * ekip, entegrasyonlar, AI ajanları, denemeler) birleşik arama yapar. Komut
 * paleti ve global arama çubuğu bu motoru kullanır — kullanıcı tek yerden
 * her şeyi bulur.
 */

import { Sites, Rules, IpRep, Campaigns, Team, Integrations, Experiments } from "@/lib/db/db";
import { AI_AJANLAR } from "@/lib/specter/ai-agents";

export type AramaTur = "site" | "kural" | "ip" | "kampanya" | "ekip" | "entegrasyon" | "ai_ajan" | "deney";

export interface AramaSonuc {
  tur: AramaTur;
  turAd: string;
  baslik: string;
  altBaslik: string;
  href: string;
  /** İkon adı (lucide) — istemci çözer. */
  ikon: string;
  /** Eşleşme skoru (yüksek = daha alakalı). */
  skor: number;
}

const TUR_META: Record<AramaTur, { ad: string; ikon: string }> = {
  site: { ad: "Site", ikon: "Globe" },
  kural: { ad: "Kural", ikon: "GitBranch" },
  ip: { ad: "IP adresi", ikon: "ShieldAlert" },
  kampanya: { ad: "Kampanya", ikon: "Crosshair" },
  ekip: { ad: "Ekip üyesi", ikon: "Users" },
  entegrasyon: { ad: "Entegrasyon", ikon: "Plug" },
  ai_ajan: { ad: "AI ajanı", ikon: "Bot" },
  deney: { ad: "Deneme", ikon: "FlaskConical" },
};

/** Metin eşleşme skoru: tam=3, başlangıç=2, içerik=1, yok=0. */
function eslesme(metin: string, sorgu: string): number {
  const m = metin.toLowerCase();
  const q = sorgu.toLowerCase();
  if (!q) return 0;
  if (m === q) return 3;
  if (m.startsWith(q)) return 2;
  if (m.includes(q)) return 1;
  return 0;
}

/**
 * Hesabın tüm varlıklarında ara. Boş sorgu → boş sonuç.
 * limit ile sonuç sayısı sınırlanır (varsayılan 20).
 */
export function globalAra(ownerId: string, sorgu: string, limit = 20): AramaSonuc[] {
  const q = sorgu.trim();
  if (q.length < 1) return [];
  const sonuclar: AramaSonuc[] = [];
  const ekle = (tur: AramaTur, baslik: string, altBaslik: string, href: string, skor: number) => {
    if (skor > 0) sonuclar.push({ tur, turAd: TUR_META[tur].ad, baslik, altBaslik, href, ikon: TUR_META[tur].ikon, skor });
  };

  // Siteler
  for (const s of Sites.forOwner(ownerId)) {
    const skor = Math.max(eslesme(s.name, q), ...s.domains.map((d) => eslesme(d, q)), eslesme(s.siteKey, q) * 2);
    ekle("site", s.name, s.domains.join(", ") || "site", `/panel/siteler/${s.id}`, skor);
  }

  // Kurallar
  for (const r of Rules.forOwner(ownerId)) {
    const skor = Math.max(eslesme(r.name, q), eslesme(r.description, q), eslesme(String(r.value), q));
    ekle("kural", r.name, r.description || `${r.field} ${r.op} ${r.value}`, "/panel/kurallar", skor);
  }

  // IP itibarı (kötü ün IP'ler — global itibar tablosu)
  for (const ip of IpRep.forOwner().slice(0, 300)) {
    const skor = Math.max(eslesme(ip.ip, q) * 2, eslesme(ip.asn, q), eslesme(ip.country, q));
    ekle("ip", ip.ip, `${ip.country} · ${ip.asn} · tehdit ${ip.threatScore}`, `/panel/tehdit/${encodeURIComponent(ip.ip)}`, skor);
  }

  // Kampanyalar
  for (const c of Campaigns.forOwner(ownerId)) {
    const skor = Math.max(eslesme(c.name, q), eslesme(c.botClass, q));
    ekle("kampanya", c.name, `${c.botClass} · ${c.status}`, `/panel/tehdit/kampanyalar/${c.id}`, skor);
  }

  // Ekip
  for (const t of Team.forOwner(ownerId)) {
    const skor = Math.max(eslesme(t.name, q), eslesme(t.email, q), eslesme(t.role, q));
    ekle("ekip", t.name, `${t.email} · ${t.role}`, "/panel/ekip", skor);
  }

  // Entegrasyonlar
  for (const i of Integrations.forOwner(ownerId)) {
    const skor = Math.max(eslesme(i.ad, q), eslesme(i.tur, q));
    ekle("entegrasyon", i.ad, i.tur, "/panel/entegrasyonlar", skor);
  }

  // Denemeler
  for (const e of Experiments.forOwner(ownerId)) {
    const skor = eslesme(e.name, q);
    ekle("deney", e.name, e.status, "/panel/denemeler", skor);
  }

  // AI ajan kataloğu (statik — herkese açık)
  for (const a of AI_AJANLAR) {
    const skor = Math.max(eslesme(a.urun, q), eslesme(a.operator, q));
    ekle("ai_ajan", a.urun, a.operator, "/panel/ai-ajanlar", skor);
  }

  // Skora göre sırala, limitle.
  return sonuclar.sort((a, b) => b.skor - a.skor).slice(0, limit);
}
