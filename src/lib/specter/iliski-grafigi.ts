/**
 * Specter — Saldırgan İlişki Grafiği (Attacker Relationship Graph)
 * ===============================================================
 * Bireysel IP'ler yanıltıcıdır: bir botnet onlarca IP kullanır ama AYNI cihaz
 * parmak izini, ASN'i veya davranış imzasını paylaşır. Bu modül olaylardan bir
 * İLİŞKİ GRAFİĞİ kurar — düğümler (IP / ASN / fingerprint) ve onları bağlayan
 * kenarlar (birlikte-görülme) — ve bağlı bileşenleri (kümeleri) çıkarır. Bir
 * küme = koordineli bir saldırgan grubu (muhtemel botnet).
 *
 * Yöntem: birleşik-bul (union-find). İki IP aynı fingerprint VEYA aynı ASN'i
 * paylaşıyorsa bağlıdır. Bağlı IP'ler bir kümedir → tek bir düşman.
 */
import type { BotEvent } from "@/lib/db/schema";

export type DugumTur = "ip" | "asn" | "fingerprint";

export interface GrafDugum {
  id: string; // "ip:1.2.3.4" gibi türlü anahtar
  tur: DugumTur;
  etiket: string; // gösterilecek değer
  /** Bu düğümle ilişkili olay sayısı (boyut). */
  agirlik: number;
  country?: string;
  /** Kötü mü (engel oranı yüksek / düşük skor). */
  kotu: boolean;
}

export interface GrafKenar {
  kaynak: string;
  hedef: string;
  /** Kaç olayla bağlı (kalınlık). */
  agirlik: number;
}

export interface Kume {
  id: string;
  ipler: string[];
  asnler: string[];
  fingerprintler: string[];
  ulkeler: string[];
  toplamOlay: number;
  engellenen: number;
  minSkor: number;
  dominantBotClass: string;
  /** Kümenin tehdit skoru 0-100. */
  tehditSkoru: number;
  /** Neden bağlı — paylaşılan sinyaller (insan-okur). */
  baglar: string[];
  /** Küme büyüklüğü sınıfı. */
  boyut: "tekil" | "kucuk" | "orta" | "buyuk";
}

/* ------------------------------------------------------------ Union-Find */

class BirlesikBul {
  private ebeveyn = new Map<string, string>();
  bul(x: string): string {
    if (!this.ebeveyn.has(x)) this.ebeveyn.set(x, x);
    let kok = x;
    while (this.ebeveyn.get(kok) !== kok) kok = this.ebeveyn.get(kok)!;
    // yol sıkıştırma
    let cur = x;
    while (this.ebeveyn.get(cur) !== kok) {
      const sonraki = this.ebeveyn.get(cur)!;
      this.ebeveyn.set(cur, kok);
      cur = sonraki;
    }
    return kok;
  }
  birlestir(a: string, b: string): void {
    const ka = this.bul(a), kb = this.bul(b);
    if (ka !== kb) this.ebeveyn.set(ka, kb);
  }
  kokler(): Set<string> {
    const s = new Set<string>();
    for (const k of this.ebeveyn.keys()) s.add(this.bul(k));
    return s;
  }
}

const KOTU_SINIFLAR = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

/** FNV-1a deterministik hash (küme id'si için). */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

export interface GrafSonuc {
  kumeler: Kume[];
  /** En büyük kümenin (görselleştirme için) düğüm+kenarları. */
  odakGraf: { dugumler: GrafDugum[]; kenarlar: GrafKenar[] } | null;
  ozet: { toplamKume: number; botnetKume: number; enBuyukKume: number; iliskiliIp: number };
}

/**
 * Olaylardan ilişki grafiği + kümeler çıkarır.
 * Yalnızca kötü/şüpheli olaylar dikkate alınır (insan/iyi-bot hariç).
 */
export function iliskiGrafigi(events: BotEvent[]): GrafSonuc {
  const kotuOlaylar = events.filter((e) => KOTU_SINIFLAR.has(e.botClass) || e.score < 0.4);

  const uf = new BirlesikBul();
  // fingerprint → ilk gören ip; ASN → ilk gören ip. Aynı fp/asn'i gören IP'leri bağla.
  const fpTemsil = new Map<string, string>();
  const asnTemsil = new Map<string, string>();
  const baglar = new Map<string, Set<string>>(); // ip → paylaşılan bağ açıklamaları

  const ipOlay = new Map<string, BotEvent[]>();
  for (const e of kotuOlaylar) {
    (ipOlay.get(e.ip) ?? ipOlay.set(e.ip, []).get(e.ip)!).push(e);
    uf.bul(e.ip); // düğüm garanti
    // fingerprint bağı
    if (e.fingerprint) {
      const t = fpTemsil.get(e.fingerprint);
      if (t && t !== e.ip) { uf.birlestir(t, e.ip); ekleBag(baglar, e.ip, `parmak izi ${e.fingerprint.slice(0, 8)}`); ekleBag(baglar, t, `parmak izi ${e.fingerprint.slice(0, 8)}`); }
      else if (!t) fpTemsil.set(e.fingerprint, e.ip);
    }
    // ASN bağı
    if (e.asn) {
      const t = asnTemsil.get(e.asn);
      if (t && t !== e.ip) { uf.birlestir(t, e.ip); ekleBag(baglar, e.ip, e.asn); ekleBag(baglar, t, e.asn); }
      else if (!t) asnTemsil.set(e.asn, e.ip);
    }
  }

  // Kökleri kümelere çevir.
  const kokIpler = new Map<string, string[]>();
  for (const ip of ipOlay.keys()) {
    const kok = uf.bul(ip);
    (kokIpler.get(kok) ?? kokIpler.set(kok, []).get(kok)!).push(ip);
  }

  const kumeler: Kume[] = [];
  for (const [, ipler] of kokIpler) {
    const olaylar = ipler.flatMap((ip) => ipOlay.get(ip) ?? []);
    if (olaylar.length === 0) continue;
    const asnler = [...new Set(olaylar.map((e) => e.asn).filter(Boolean))];
    const fps = [...new Set(olaylar.map((e) => e.fingerprint).filter(Boolean))];
    const ulkeler = [...new Set(olaylar.map((e) => e.country))];
    const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    const minSkor = Math.min(...olaylar.map((e) => e.score));
    const sinifSay: Record<string, number> = {};
    for (const e of olaylar) sinifSay[e.botClass] = (sinifSay[e.botClass] || 0) + 1;
    const dominantBotClass = Object.entries(sinifSay).sort((a, b) => b[1] - a[1])[0][0];
    const engelOran = engellenen / olaylar.length;

    // Bağ açıklamaları (kümedeki tüm IP'lerin paylaştığı).
    const bagSet = new Set<string>();
    for (const ip of ipler) for (const b of baglar.get(ip) ?? []) bagSet.add(b);

    const tehditSkoru = Math.min(100, Math.round((1 - minSkor) * 40 + engelOran * 25 + Math.min(ipler.length, 10) * 3.5));
    const boyut: Kume["boyut"] = ipler.length >= 8 ? "buyuk" : ipler.length >= 4 ? "orta" : ipler.length >= 2 ? "kucuk" : "tekil";

    kumeler.push({
      id: `kume_${hash(ipler.sort().join(","))}`,
      ipler: ipler.sort(),
      asnler, fingerprintler: fps, ulkeler,
      toplamOlay: olaylar.length, engellenen, minSkor,
      dominantBotClass, tehditSkoru,
      baglar: [...bagSet].slice(0, 6),
      boyut,
    });
  }

  // Çok-IP'li (koordineli) kümeler önce.
  kumeler.sort((a, b) => b.ipler.length - a.ipler.length || b.tehditSkoru - a.tehditSkoru);

  // Odak graf: en büyük kümenin düğüm+kenarları (IP + ASN düğümleri).
  let odakGraf: GrafSonuc["odakGraf"] = null;
  const odak = kumeler.find((k) => k.ipler.length >= 2);
  if (odak) odakGraf = grafKur(odak, ipOlay);

  const botnetKume = kumeler.filter((k) => k.ipler.length >= 3).length;
  return {
    kumeler,
    odakGraf,
    ozet: {
      toplamKume: kumeler.length,
      botnetKume,
      enBuyukKume: kumeler[0]?.ipler.length ?? 0,
      iliskiliIp: kumeler.filter((k) => k.ipler.length >= 2).reduce((a, k) => a + k.ipler.length, 0),
    },
  };
}

function ekleBag(m: Map<string, Set<string>>, ip: string, bag: string) {
  (m.get(ip) ?? m.set(ip, new Set()).get(ip)!).add(bag);
}

/** Bir kümeyi görselleştirilebilir düğüm+kenar grafına çevirir (IP↔ASN yıldızı). */
function grafKur(kume: Kume, ipOlay: Map<string, BotEvent[]>): { dugumler: GrafDugum[]; kenarlar: GrafKenar[] } {
  const dugumler: GrafDugum[] = [];
  const kenarlar: GrafKenar[] = [];

  // ASN düğümleri (merkez).
  for (const asn of kume.asnler) {
    dugumler.push({ id: `asn:${asn}`, tur: "asn", etiket: asn, agirlik: 0, kotu: true });
  }
  // IP düğümleri + ASN'e kenar.
  for (const ip of kume.ipler) {
    const olaylar = ipOlay.get(ip) ?? [];
    const country = olaylar[0]?.country;
    const engel = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
    dugumler.push({ id: `ip:${ip}`, tur: "ip", etiket: ip, agirlik: olaylar.length, country, kotu: engel > 0 });
    const asn = olaylar[0]?.asn;
    if (asn) {
      const asnDugum = dugumler.find((d) => d.id === `asn:${asn}`);
      if (asnDugum) asnDugum.agirlik += olaylar.length;
      kenarlar.push({ kaynak: `ip:${ip}`, hedef: `asn:${asn}`, agirlik: olaylar.length });
    }
  }
  return { dugumler, kenarlar };
}

export const BOYUT_ETIKET: Record<Kume["boyut"], string> = {
  tekil: "Tekil", kucuk: "Küçük küme", orta: "Orta küme", buyuk: "Büyük ağ",
};
