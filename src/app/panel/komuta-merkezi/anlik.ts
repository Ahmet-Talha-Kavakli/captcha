/**
 * Komuta Merkezi — Anlık Tehdit Yardımcıları (saf, sunucu tarafı)
 * ===============================================================
 * GERÇEK olaylardan (BotEvent) türetilen tehdit fotoğrafını hesaplayan saf
 * fonksiyonlar. Yalnızca hesaplama yapar — hiçbir DB yazımı yoktur. Sunucu
 * sayfası (page.tsx) bu yardımcıları çağırıp istemciye düz veri gönderir.
 *
 * Not: src/lib/specter altına yeni kütüphane KOYMUYORUZ — komuta merkezine
 * özgü hesaplar burada, klasör-yerel tutulur.
 */

import type { BotEvent, IpReputation } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Bir saldırgan boyutu için sıralanmış satır (ASN / ülke / IP ortak biçim). */
export interface SaldirganSatir {
  /** Anahtar değer: ASN dizesi / ülke ISO2 / IP adresi. */
  anahtar: string;
  /** Toplam istek (bu boyutta). */
  toplam: number;
  /** Bunlardan tehdit sayılan (engellenen + doğrulanan + işaretlenen). */
  tehdit: number;
  /** Engellenen istek sayısı. */
  engellenen: number;
  /** Örnek ülke kodu (ASN/IP satırında bayrak için — en sık görülen). */
  ulke?: string;
}

/** botClass kümelemesinden çıkarılan aktif saldırı senaryosu. */
export interface Senaryo {
  /** botClass anahtarı (ör. "scraper"). */
  sinif: string;
  /** Bu senaryoya ait olay sayısı. */
  adet: number;
  /** Engellenen oran (0..1). */
  engelOran: number;
  /** En yoğun kaynak ASN (varsa). */
  baslicaAsn?: string;
  /** Kaç benzersiz IP bu senaryoda görüldü. */
  benzersizIp: number;
}

/** İstemciye gönderilen komple ilk tehdit fotoğrafı. */
export interface TehditFoto {
  /** Karar dağılımı sayaçları. */
  karar: { blocked: number; challenged: number; allowed: number; flagged: number };
  /** Toplam olay (pencere içindeki). */
  toplamOlay: number;
  /** Benzersiz saldırgan IP sayısı (insan olmayan). */
  benzersizTehditIp: number;
  /** En çok saldıran ASN'ler (azalan). */
  topAsn: SaldirganSatir[];
  /** En çok saldıran ülkeler (azalan). */
  topUlke: SaldirganSatir[];
  /** En çok saldıran IP'ler (azalan). */
  topIp: SaldirganSatir[];
  /** botClass kümelemesinden aktif senaryolar. */
  senaryolar: Senaryo[];
  /** Hesaplanan savunma seviyesi (DEFCON benzeri 1..5; 1 = en kritik). */
  defcon: number;
  /** IP itibar tablosundan "malicious"/"tor" bilinen kötü ASN'ler (batch engelleme için). */
  bilinenKotuAsn: string[];
}

/* ------------------------------------------------------------------ Sabitler */

/** Tehdit sayılan kararlar (insan-olmayan/şüpheli trafik). */
const TEHDIT_KARARLAR = new Set(["blocked", "challenged", "flagged"]);

/* ------------------------------------------------------------------ Yardımcılar */

/** Bir olayın tehdit sayılıp sayılmadığı (bot sınıfı veya karar). */
export function tehditMi(e: Pick<BotEvent, "verdict" | "botClass">): boolean {
  return TEHDIT_KARARLAR.has(e.verdict) || (e.botClass !== "human" && e.botClass !== "good_bot");
}

/**
 * Bir boyut (asn/country/ip) üzerinden olayları grupla, tehdit ağırlığına göre
 * sırala ve ilk `limit` satırı döndür. Her satır için engellenen sayısı ve en
 * sık görülen ülke de hesaplanır.
 */
function boyutSirala(
  olaylar: BotEvent[],
  anahtarSec: (e: BotEvent) => string,
  limit: number,
): SaldirganSatir[] {
  const harita = new Map<
    string,
    { toplam: number; tehdit: number; engellenen: number; ulkeler: Map<string, number> }
  >();
  for (const e of olaylar) {
    const k = anahtarSec(e);
    if (!k) continue;
    let g = harita.get(k);
    if (!g) {
      g = { toplam: 0, tehdit: 0, engellenen: 0, ulkeler: new Map() };
      harita.set(k, g);
    }
    g.toplam++;
    if (tehditMi(e)) g.tehdit++;
    if (e.verdict === "blocked") g.engellenen++;
    if (e.country) g.ulkeler.set(e.country, (g.ulkeler.get(e.country) ?? 0) + 1);
  }
  const satirlar: SaldirganSatir[] = [];
  for (const [anahtar, g] of harita) {
    // En sık görülen ülkeyi seç (bayrak göstermek için).
    let enUlke: string | undefined;
    let enSay = 0;
    for (const [u, s] of g.ulkeler) if (s > enSay) { enSay = s; enUlke = u; }
    satirlar.push({ anahtar, toplam: g.toplam, tehdit: g.tehdit, engellenen: g.engellenen, ulke: enUlke });
  }
  // Önce tehdit ağırlığı, sonra toplam hacme göre sırala.
  satirlar.sort((a, b) => b.tehdit - a.tehdit || b.toplam - a.toplam);
  return satirlar.slice(0, limit);
}

/** botClass kümelemesinden aktif saldırı senaryolarını çıkar. */
function senaryolariCikar(olaylar: BotEvent[]): Senaryo[] {
  const harita = new Map<
    string,
    { adet: number; engellenen: number; asnlar: Map<string, number>; ipler: Set<string> }
  >();
  for (const e of olaylar) {
    // İnsan ve iyi bot senaryo sayılmaz — savaş odası yalnızca saldırılara bakar.
    if (e.botClass === "human" || e.botClass === "good_bot") continue;
    let g = harita.get(e.botClass);
    if (!g) {
      g = { adet: 0, engellenen: 0, asnlar: new Map(), ipler: new Set() };
      harita.set(e.botClass, g);
    }
    g.adet++;
    if (e.verdict === "blocked") g.engellenen++;
    if (e.asn) g.asnlar.set(e.asn, (g.asnlar.get(e.asn) ?? 0) + 1);
    if (e.ip) g.ipler.add(e.ip);
  }
  const senaryolar: Senaryo[] = [];
  for (const [sinif, g] of harita) {
    let baslicaAsn: string | undefined;
    let enSay = 0;
    for (const [a, s] of g.asnlar) if (s > enSay) { enSay = s; baslicaAsn = a; }
    senaryolar.push({
      sinif,
      adet: g.adet,
      engelOran: g.adet ? g.engellenen / g.adet : 0,
      baslicaAsn,
      benzersizIp: g.ipler.size,
    });
  }
  senaryolar.sort((a, b) => b.adet - a.adet);
  return senaryolar;
}

/**
 * Savunma seviyesini (DEFCON 1..5) tehdit yoğunluğundan türet.
 * 1 = en kritik (yoğun saldırı), 5 = sakin. Tehdit oranı + benzersiz saldırgan
 * IP sayısına dayalı deterministik eşikler.
 */
function defconHesapla(tehditOran: number, benzersizTehditIp: number): number {
  // Tehdit oranı ağırlıklı; benzersiz IP genişliği ek baskı yaratır.
  if (tehditOran >= 0.6 || benzersizTehditIp >= 40) return 1;
  if (tehditOran >= 0.45 || benzersizTehditIp >= 25) return 2;
  if (tehditOran >= 0.3 || benzersizTehditIp >= 15) return 3;
  if (tehditOran >= 0.15 || benzersizTehditIp >= 6) return 4;
  return 5;
}

/**
 * Ana giriş: gerçek olay listesi + IP itibarından komple tehdit fotoğrafı üret.
 */
export function tehditFotoOlustur(olaylar: BotEvent[], ipRep: IpReputation[]): TehditFoto {
  const karar = { blocked: 0, challenged: 0, allowed: 0, flagged: 0 };
  const tehditIpler = new Set<string>();
  for (const e of olaylar) {
    if (e.verdict in karar) karar[e.verdict as keyof typeof karar]++;
    if (tehditMi(e)) tehditIpler.add(e.ip);
  }

  const toplamOlay = olaylar.length;
  const tehditSayisi = olaylar.reduce((n, e) => n + (tehditMi(e) ? 1 : 0), 0);
  const tehditOran = toplamOlay ? tehditSayisi / toplamOlay : 0;

  // Bilinen kötü ASN'ler: itibar tablosunda malicious/tor kategorili IP'lerin ASN'leri.
  const kotuAsnSet = new Set<string>();
  for (const r of ipRep) {
    if ((r.category === "malicious" || r.category === "tor") && r.asn) kotuAsnSet.add(r.asn);
  }

  return {
    karar,
    toplamOlay,
    benzersizTehditIp: tehditIpler.size,
    topAsn: boyutSirala(olaylar, (e) => e.asn, 6),
    topUlke: boyutSirala(olaylar, (e) => e.country, 6),
    topIp: boyutSirala(olaylar.filter((e) => tehditMi(e)), (e) => e.ip, 6),
    senaryolar: senaryolariCikar(olaylar),
    defcon: defconHesapla(tehditOran, tehditIpler.size),
    bilinenKotuAsn: [...kotuAsnSet].slice(0, 12),
  };
}
