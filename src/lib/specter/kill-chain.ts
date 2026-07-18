/**
 * Specter — Saldırı Zinciri (Kill-Chain) Yeniden Yapılandırma
 * ==========================================================
 * Tek tek olaylar gürültüdür; bir saldırı ise AŞAMALI bir zincirdir. Lockheed
 * Martin Cyber Kill-Chain / MITRE ATT&CK mantığıyla, bir saldırganın (IP)
 * olaylarını zaman sırasına dizip her isteği bir SALDIRI AŞAMASINA eşleriz:
 *
 *   1) Keşif       — site haritası/robots/genel gezinme (düşük yoğunluk).
 *   2) Tarama      — endpoint/parametre tarama, yol numaralandırma.
 *   3) Silahlanma  — araç imzası (python/curl/headless), otomasyon hazırlığı.
 *   4) Erişim      — /login /api gibi hassas yollara kimlik-denemesi.
 *   5) Sömürü      — düşük skorlu yoğun otomasyon, credential-stuffing/DDoS.
 *   6) Sızma/Kalıcılık — veri çekme (/api/export), tekrarlı yüksek-hacim.
 *
 * Her saldırgan için zincirin NE KADAR İLERLEDİĞİNİ ve Specter'ın onu HANGİ
 * AŞAMADA KESTİĞİNİ (ilk block/challenge) çıkarırız. Erken kesme = iyi savunma.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

export type Asama = "kesif" | "tarama" | "silahlanma" | "erisim" | "somuru" | "sizma";

export const ASAMA_SIRA: Asama[] = ["kesif", "tarama", "silahlanma", "erisim", "somuru", "sizma"];

export const ASAMA_META: Record<Asama, { ad: string; sira: number; aciklama: string; renk: string }> = {
  kesif:      { ad: "Keşif",              sira: 1, aciklama: "Site haritası, robots, genel gezinme", renk: "#64748b" },
  tarama:     { ad: "Tarama",             sira: 2, aciklama: "Endpoint/parametre numaralandırma", renk: "#0891b2" },
  silahlanma: { ad: "Silahlanma",         sira: 3, aciklama: "Araç imzası, otomasyon hazırlığı", renk: "#7c3aed" },
  erisim:     { ad: "Erişim denemesi",    sira: 4, aciklama: "Hassas yollara kimlik denemesi", renk: "#d97706" },
  somuru:     { ad: "Sömürü",             sira: 5, aciklama: "Yoğun otomasyon, cred-stuffing/DDoS", renk: "#dc2626" },
  sizma:      { ad: "Sızma / Kalıcılık",  sira: 6, aciklama: "Veri çekme, tekrarlı yüksek-hacim", renk: "#9333ea" },
};

const HASSAS = /login|signin|auth|password|account|admin|checkout|payment|token|session/i;
const API = /api|graphql|\.json|export|download|scrape/i;
const ARAC_UA = /python|curl|wget|go-http|java|libwww|scrapy|http-client|bot|headless/i;
const KESIF_YOL = /robots|sitemap|\.well-known|^\/$|favicon/i;

/** Bir tek olayı saldırı aşamasına eşler (sinyal öncelik sırası: yüksek aşama önce). */
function olayAsama(e: BotEvent): Asama {
  const yol = e.path || "/";
  const ua = e.ua || "";
  const dusukSkor = e.score < 0.35;

  // Keşif: robots/sitemap/anasayfa — YOL önce (botClass ne olursa olsun ilk temas).
  if (KESIF_YOL.test(yol)) return "kesif";
  // Sızma: API/export + otomasyon.
  if (API.test(yol) && (dusukSkor || ARAC_UA.test(ua)) && /export|download|scrape|\.json/i.test(yol)) return "sizma";
  // Sömürü: hassas yol + çok düşük skor / DDoS / cred-stuffing.
  if (e.botClass === "ddos" || e.botClass === "credential_stuffing") return "somuru";
  if (dusukSkor && (HASSAS.test(yol) || API.test(yol))) return "somuru";
  // Erişim: hassas yola erişim denemesi.
  if (HASSAS.test(yol)) return "erisim";
  // Silahlanma: araç/headless imzası (keşif/hassas olmayan yolda).
  if (ARAC_UA.test(ua) || e.botClass === "automation" || e.botClass === "scraper") return "silahlanma";
  // Varsayılan: tarama.
  return "tarama";
}

export interface ZincirAdim {
  asama: Asama;
  ts: number;
  path: string;
  verdict: string;
  botClass: string;
  /** Savunma bu adımda saldırıyı kesti mi (block/challenge). */
  kesildi: boolean;
}

export interface SaldirganZincir {
  ip: string;
  asn: string;
  country: string;
  olaySayisi: number;
  /** Zincirin ulaştığı en ileri aşama. */
  ilerlemeAsama: Asama;
  ilerlemeSira: number; // 1-6
  /** Specter'ın ilk kestiği aşama (varsa). */
  kesilenAsama: Asama | null;
  kesilenSira: number | null;
  /** Zincir kesildi mi (herhangi block/challenge). */
  durduruldu: boolean;
  /** Sıralı adımlar. */
  adimlar: ZincirAdim[];
  /** Ulaşılan benzersiz aşamalar (görselleştirme için). */
  ulasilanAsamalar: Asama[];
  /** Tehdit seviyesi: ne kadar ilerlediyse + durdurulmadıysa o kadar yüksek. */
  tehdit: "düşük" | "orta" | "yüksek" | "kritik";
}

function tehditHesap(ilerlemeSira: number, durduruldu: boolean, kesilenSira: number | null): SaldirganZincir["tehdit"] {
  if (durduruldu && kesilenSira !== null && kesilenSira <= 3) return "düşük"; // erken kesildi
  if (durduruldu && kesilenSira !== null && kesilenSira <= 4) return "orta";
  if (!durduruldu && ilerlemeSira >= 5) return "kritik"; // sömürü/sızmaya ulaştı ve durmadı
  if (ilerlemeSira >= 5) return "yüksek";
  return durduruldu ? "orta" : "yüksek";
}

/**
 * Olayları saldırgan (IP) bazında zincirlere dönüştürür. Yalnızca kötü/otomasyon
 * trafiği zincirlenir (insan/iyi-bot atlanır).
 */
export function killChainCikar(events: BotEvent[], enFazla = 40): SaldirganZincir[] {
  const IYI = new Set(["human", "good_bot"]);
  const grup = new Map<string, BotEvent[]>();
  for (const e of events) {
    if (IYI.has(e.botClass)) continue;
    if (!grup.has(e.ip)) grup.set(e.ip, []);
    grup.get(e.ip)!.push(e);
  }

  const zincirler: SaldirganZincir[] = [];
  for (const [ip, list] of grup) {
    if (list.length < 2) continue; // tek olay zincir değil
    const sirali = [...list].sort((a, b) => a.ts - b.ts);
    const adimlar: ZincirAdim[] = sirali.map((e) => {
      const asama = olayAsama(e);
      const kesildi = e.verdict === "blocked" || e.verdict === "challenged";
      return { asama, ts: e.ts, path: e.path, verdict: e.verdict, botClass: e.botClass, kesildi };
    });

    // İlerleme = ulaşılan en yüksek sıra.
    let ilerlemeSira = 1;
    let ilerlemeAsama: Asama = "kesif";
    for (const a of adimlar) {
      const s = ASAMA_META[a.asama].sira;
      if (s > ilerlemeSira) { ilerlemeSira = s; ilerlemeAsama = a.asama; }
    }

    // İlk kesme.
    const ilkKesme = adimlar.find((a) => a.kesildi) || null;
    const kesilenAsama = ilkKesme ? ilkKesme.asama : null;
    const kesilenSira = ilkKesme ? ASAMA_META[ilkKesme.asama].sira : null;
    const durduruldu = ilkKesme !== null;

    const ulasilan = [...new Set(adimlar.map((a) => a.asama))].sort((x, y) => ASAMA_META[x].sira - ASAMA_META[y].sira);

    zincirler.push({
      ip,
      asn: sirali[0].asn,
      country: sirali[0].country,
      olaySayisi: list.length,
      ilerlemeAsama, ilerlemeSira,
      kesilenAsama, kesilenSira, durduruldu,
      adimlar, ulasilanAsamalar: ulasilan,
      tehdit: tehditHesap(ilerlemeSira, durduruldu, kesilenSira),
    });
  }

  // En tehlikeli (en ileri + durdurulmamış) önce.
  const tehditPuan = (z: SaldirganZincir) => z.ilerlemeSira * 2 + (z.durduruldu ? 0 : 5) + z.olaySayisi / 100;
  zincirler.sort((a, b) => tehditPuan(b) - tehditPuan(a));
  return zincirler.slice(0, enFazla);
}

export interface KillChainOzet {
  toplamZincir: number;
  durdurulan: number;
  durdurulanOran: number;
  /** Sömürü/sızmaya ulaşan (kritik). */
  ileriUlasan: number;
  /** Aşama başına: kaç zincir bu aşamaya ulaştı + kaçı burada kesildi (huni). */
  asamaHunisi: { asama: Asama; ulasan: number; kesilen: number }[];
  /** Ortalama kesme aşaması (düşük=erken=iyi). */
  ortKesmeSira: number;
}

export function killChainOzet(zincirler: SaldirganZincir[]): KillChainOzet {
  const toplam = zincirler.length;
  const durdurulan = zincirler.filter((z) => z.durduruldu).length;
  const ileri = zincirler.filter((z) => z.ilerlemeSira >= 5).length;

  const asamaHunisi = ASAMA_SIRA.map((asama) => {
    const sira = ASAMA_META[asama].sira;
    const ulasan = zincirler.filter((z) => z.ilerlemeSira >= sira || z.ulasilanAsamalar.includes(asama)).length;
    const kesilen = zincirler.filter((z) => z.kesilenAsama === asama).length;
    return { asama, ulasan, kesilen };
  });

  const kesmeler = zincirler.filter((z) => z.kesilenSira !== null).map((z) => z.kesilenSira!);
  const ortKesmeSira = kesmeler.length ? Math.round((kesmeler.reduce((a, b) => a + b, 0) / kesmeler.length) * 10) / 10 : 0;

  return {
    toplamZincir: toplam,
    durdurulan,
    durdurulanOran: toplam ? Math.round((durdurulan / toplam) * 1000) / 10 : 0,
    ileriUlasan: ileri,
    asamaHunisi,
    ortKesmeSira,
  };
}

export const TEHDIT_RENK: Record<SaldirganZincir["tehdit"], string> = {
  "düşük": "#16a34a", "orta": "#d97706", "yüksek": "#ea580c", "kritik": "#dc2626",
};
