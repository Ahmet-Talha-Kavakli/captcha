/**
 * Specter — Saldırı Sandbox'ı & Kural Regresyon Motoru
 * ====================================================
 * "Bu yeni kuralı canlıya almadan önce ne kıracağını görmek istiyorum."
 *
 * Sandbox, kayıtlı bir TRAFİK YAKALAMASINI (gerçek/sentetik istek akışı) alır ve
 * onu İKİ ayrı kural setine karşı üretime hiç dokunmadan yeniden oynatır:
 *   • BAZ   = şu an canlıda olan kurallar
 *   • ADAY  = düzenlemekte olduğun taslak kurallar
 * Her istek iki sette de `evaluateRules` ile değerlendirilir; kararlar eşleştirilir
 * ve bir DIFF çıkarılır:
 *   - iyilesme : bazda kaçan/zayıf, adayda doğru bloklanan istek  (savunma güçlendi)
 *   - regresyon: bazda doğru bloklanan, adayda kaçan/zayıflayan istek (TEHLİKE)
 *   - yanlisPozitifRisk: bazda izinli insan trafiği adayda bloklanıyor (meşru kullanıcı zarar görür)
 *   - degismeyen: karar aynı
 *
 * Her senaryo için "beklenen doğru aksiyon" bilinir (block/challenge/allow), böylece
 * savunma etkinliği ve yanlış-pozitif riski nesnel ölçülür. Tamamen saf/deterministik
 * — üretim DB'sine yazmaz, yalnızca in-memory değerlendirme yapar.
 */
import { evaluateRules, type RequestContext } from "@/lib/specter/rule-engine";
import type { Rule, RuleAction } from "@/lib/db/schema";

/* ----------------------------------------------------------- Trafik yakalama */

/** Sandbox'a beslenen tek bir istek — beklenen doğru aksiyonuyla etiketli. */
export interface YakalamaIstek {
  ctx: RequestContext;
  /** Bu istek meşru mu (insan/iyi-bot) yoksa saldırgan mı. */
  mesru: boolean;
  /** İdeal savunmanın bu isteğe vermesi gereken aksiyon. */
  beklenen: RuleAction;
  /** Hangi senaryodan geldiği (raporlama için). */
  senaryo: string;
}

export interface TrafikYakalama {
  id: string;
  ad: string;
  aciklama: string;
  istekler: YakalamaIstek[];
}

/** Deterministik tohum (indeks bazlı, Math.random YOK). */
function tohum(i: number, tuz: number): number {
  const x = Math.sin(i * 12.9898 + tuz * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function ctx(p: Partial<RequestContext>): RequestContext {
  return {
    ip: "1.1.1.1", country: "US", asn: "AS0", ua: "Mozilla/5.0", path: "/",
    score: 0.5, botClass: "human", rate: 0, headless: false, tlsUaUyumsuz: false, httpVersion: "h2", ...p,
  };
}

/**
 * Hazır trafik yakalamaları. Her biri KARIŞIK trafik içerir: saldırı istekleri
 * + meşru insan/iyi-bot trafiği. Böylece sandbox hem savunma boşluğunu hem de
 * yanlış-pozitif (meşru kullanıcıyı engelleme) riskini ölçebilir.
 */
export const YAKALAMALAR: TrafikYakalama[] = [
  {
    id: "karma-saldiri", ad: "Karma Saldırı + Gerçek Trafik", aciklama: "Kimlik doldurma dalgası, kazıyıcılar ve normal ziyaretçiler aynı pencerede.",
    istekler: [
      // Kimlik doldurma botneti (saldırgan → block beklenir)
      ...Array.from({ length: 30 }, (_, i): YakalamaIstek => ({
        senaryo: "Kimlik doldurma", mesru: false, beklenen: "block",
        ctx: ctx({ ip: `45.11.${Math.floor(tohum(i, 1) * 255)}.${Math.floor(tohum(i, 2) * 255)}`, country: ["RU", "CN"][Math.floor(tohum(i, 3) * 2)], asn: "AS9009 M247", ua: "Mozilla/5.0", path: "/login", score: 0.08 + tohum(i, 4) * 0.12, botClass: "credential_stuffing", rate: 40 + Math.floor(tohum(i, 5) * 60) }),
      })),
      // Kazıyıcılar (saldırgan → block beklenir)
      ...Array.from({ length: 20 }, (_, i): YakalamaIstek => ({
        senaryo: "Kazıma", mesru: false, beklenen: "block",
        ctx: ctx({ ip: `185.220.${Math.floor(tohum(i, 6) * 255)}.${Math.floor(tohum(i, 7) * 255)}`, country: "NL", asn: "AS14061 DigitalOcean", ua: "python-requests/2.31", path: "/api/products", score: 0.15 + tohum(i, 8) * 0.1, botClass: "scraper", rate: 20 }),
      })),
      // Gerçek insanlar (meşru → allow beklenir)
      ...Array.from({ length: 40 }, (_, i): YakalamaIstek => ({
        senaryo: "Gerçek ziyaretçi", mesru: true, beklenen: "allow",
        ctx: ctx({ ip: `88.240.${Math.floor(tohum(i, 9) * 255)}.${Math.floor(tohum(i, 10) * 255)}`, country: ["TR", "DE", "US", "GB"][Math.floor(tohum(i, 11) * 4)], asn: "AS9121 Turk Telekom", ua: "Mozilla/5.0 (iPhone) Safari/17", path: ["/", "/urunler", "/sepet"][Math.floor(tohum(i, 12) * 3)], score: 0.78 + tohum(i, 13) * 0.2, botClass: "human", rate: 1 + Math.floor(tohum(i, 14) * 3) }),
      })),
    ],
  },
  {
    id: "ai-dalgasi", ad: "AI Ajan Dalgası", aciklama: "GPTBot/ClaudeBot içeriği toplarken meşru arama motoru botları da geziyor.",
    istekler: [
      // AI eğitim tarayıcıları (saldırgan/gri → challenge beklenir)
      ...Array.from({ length: 25 }, (_, i): YakalamaIstek => ({
        senaryo: "AI eğitim taraması", mesru: false, beklenen: "challenge",
        ctx: ctx({ ip: `20.15.${Math.floor(tohum(i, 15) * 255)}.${Math.floor(tohum(i, 16) * 255)}`, country: "US", asn: "AS8075 Microsoft", ua: "Mozilla/5.0 (compatible; GPTBot/1.1)", path: "/blog", score: 0.5, botClass: "ai_agent", aiAgentId: "gptbot", aiCategory: "model_egitimi" }),
      })),
      // Meşru arama motoru botu (iyi-bot → allow beklenir)
      ...Array.from({ length: 15 }, (_, i): YakalamaIstek => ({
        senaryo: "Arama motoru botu", mesru: true, beklenen: "allow",
        ctx: ctx({ ip: `66.249.${Math.floor(tohum(i, 17) * 255)}.${Math.floor(tohum(i, 18) * 255)}`, country: "US", asn: "AS15169 Google", ua: "Mozilla/5.0 (compatible; Googlebot/2.1)", path: "/", score: 0.7, botClass: "good_bot", aiAgentId: "googlebot", aiCategory: "arama" }),
      })),
      // Gerçek insanlar (meşru → allow beklenir)
      ...Array.from({ length: 30 }, (_, i): YakalamaIstek => ({
        senaryo: "Gerçek ziyaretçi", mesru: true, beklenen: "allow",
        ctx: ctx({ ip: `78.180.${Math.floor(tohum(i, 19) * 255)}.${Math.floor(tohum(i, 20) * 255)}`, country: "TR", asn: "AS9121 Turk Telekom", ua: "Mozilla/5.0 (Windows) Chrome/121", path: "/blog", score: 0.82 + tohum(i, 21) * 0.15, botClass: "human", rate: 2 }),
      })),
    ],
  },
  {
    id: "atlatma", ad: "Gizlenme & Atlatma", aciklama: "Sahte tarayıcı (TLS uyumsuz) ve headless kazıyıcılar imza atlatmaya çalışıyor.",
    istekler: [
      // Sahte tarayıcı (saldırgan → block beklenir)
      ...Array.from({ length: 20 }, (_, i): YakalamaIstek => ({
        senaryo: "Sahte tarayıcı (TLS)", mesru: false, beklenen: "block",
        ctx: ctx({ ip: `103.79.${Math.floor(tohum(i, 22) * 255)}.${Math.floor(tohum(i, 23) * 255)}`, country: ["CN", "VN"][Math.floor(tohum(i, 24) * 2)], asn: "AS4134 ChinaNet", ua: "Mozilla/5.0 (Windows NT 10.0) Chrome/120", path: "/api/data", score: 0.12, botClass: "automation", tlsUaUyumsuz: true }),
      })),
      // Headless (saldırgan → block beklenir)
      ...Array.from({ length: 20 }, (_, i): YakalamaIstek => ({
        senaryo: "Headless kazıma", mesru: false, beklenen: "block",
        ctx: ctx({ ip: `35.192.${Math.floor(tohum(i, 25) * 255)}.${Math.floor(tohum(i, 26) * 255)}`, country: "US", asn: "AS15169 Google Cloud", ua: "Mozilla/5.0 HeadlessChrome/120", path: "/dinamik", score: 0.2, botClass: "scraper", headless: true }),
      })),
      // Gerçek mobil kullanıcılar (meşru → allow beklenir)
      ...Array.from({ length: 30 }, (_, i): YakalamaIstek => ({
        senaryo: "Gerçek mobil", mesru: true, beklenen: "allow",
        ctx: ctx({ ip: `176.88.${Math.floor(tohum(i, 27) * 255)}.${Math.floor(tohum(i, 28) * 255)}`, country: "TR", asn: "AS34984 Superonline", ua: "Mozilla/5.0 (Android 14) Chrome/121", path: "/urunler", score: 0.75 + tohum(i, 29) * 0.2, botClass: "human", rate: 1 }),
      })),
    ],
  },
];

/* ----------------------------------------------------------- Değerlendirme */

/** Bir aksiyonun "savunma gücü": block > challenge > flag > allow. */
const GUC: Record<RuleAction, number> = { block: 3, challenge: 2, flag: 1, allow: 0 };

/** Bir isteğin tek bir kural setindeki sonucu. */
export interface IstekKarar {
  aksiyon: RuleAction;
  kararVeren: string | null; // kuralın adı ya da "otomatik (skor)"
  dogru: boolean; // beklenen aksiyonu karşıladı mı
}

/** Baz vs aday karşılaştırma sınıfı — bir isteğin diff türü. */
export type DiffTur = "iyilesme" | "regresyon" | "yanlis-pozitif" | "degismeyen-dogru" | "degismeyen-yanlis";

export interface IstekDiff {
  senaryo: string;
  mesru: boolean;
  beklenen: RuleAction;
  ip: string;
  path: string;
  botClass: string;
  baz: IstekKarar;
  aday: IstekKarar;
  tur: DiffTur;
}

/** Bir isteğin bir aksiyonu "doğru" mu? Meşru trafik için allow doğru; saldırı için beklenen ≥ challenge güç. */
function dogruMu(mesru: boolean, beklenen: RuleAction, aksiyon: RuleAction): boolean {
  if (mesru) return aksiyon === "allow" || aksiyon === "flag"; // meşru: engelleme/doğrulama YANLIŞ (sürtünme)
  return GUC[aksiyon] >= GUC[beklenen]; // saldırı: en az beklenen kadar sert olmalı
}

function karar(rules: Rule[], istek: YakalamaIstek): IstekKarar {
  const r = evaluateRules(rules, istek.ctx);
  return {
    aksiyon: r.action,
    kararVeren: r.decidedBy ? r.decidedBy.ruleName : "otomatik (skor)",
    dogru: dogruMu(istek.mesru, istek.beklenen, r.action),
  };
}

/** İki kararın diff türünü sınıflandırır. */
function diffTur(istek: YakalamaIstek, baz: IstekKarar, aday: IstekKarar): DiffTur {
  const bazGuc = GUC[baz.aksiyon];
  const adayGuc = GUC[aday.aksiyon];
  // Meşru trafik özel: aday onu daha sert davranırsa yanlış-pozitif riski.
  if (istek.mesru) {
    if (adayGuc > bazGuc) return "yanlis-pozitif"; // meşru kullanıcıya yeni sürtünme
    return baz.dogru && aday.dogru ? "degismeyen-dogru" : "degismeyen-yanlis";
  }
  // Saldırı trafiği:
  if (!baz.dogru && aday.dogru) return "iyilesme"; // kaçıyordu, artık yakalanıyor
  if (baz.dogru && !aday.dogru) return "regresyon"; // yakalanıyordu, artık kaçıyor
  return baz.dogru ? "degismeyen-dogru" : "degismeyen-yanlis";
}

export interface SenaryoKirilim {
  senaryo: string;
  toplam: number;
  bazDogru: number;
  adayDogru: number;
}

export interface SandboxSonuc {
  yakalamaId: string;
  yakalamaAd: string;
  toplam: number;
  /** Diff kırılımı sayıları. */
  iyilesme: number;
  regresyon: number;
  yanlisPozitif: number;
  degismeyenDogru: number;
  degismeyenYanlis: number;
  /** Baz savunma doğruluk oranı (%). */
  bazEtkinlik: number;
  /** Aday savunma doğruluk oranı (%). */
  adayEtkinlik: number;
  /** Net değişim (aday - baz), yüzde puan. */
  netDegisim: number;
  /** Dağıtım güvenli mi: regresyon=0 ve yanlış-pozitif kabul sınırında ve net≥0. */
  guvenli: boolean;
  /** İnsan-okur karar. */
  karar: "dagit" | "dikkatli" | "durdur";
  senaryoKirilim: SenaryoKirilim[];
  /** İlk N ilginç diff (regresyon + yanlış-pozitif önce, sonra iyileşme). */
  ornekDiffler: IstekDiff[];
}

/**
 * Bir trafik yakalamasını baz ve aday kural setlerine karşı yeniden oynatıp diff çıkarır.
 */
export function sandboxCalistir(yakalama: TrafikYakalama, bazKurallar: Rule[], adayKurallar: Rule[]): SandboxSonuc {
  const diffler: IstekDiff[] = [];
  const sayac: Record<DiffTur, number> = {
    "iyilesme": 0, "regresyon": 0, "yanlis-pozitif": 0, "degismeyen-dogru": 0, "degismeyen-yanlis": 0,
  };
  let bazDogruTop = 0, adayDogruTop = 0;
  const senaryoMap = new Map<string, SenaryoKirilim>();

  for (const istek of yakalama.istekler) {
    const baz = karar(bazKurallar, istek);
    const aday = karar(adayKurallar, istek);
    const tur = diffTur(istek, baz, aday);
    sayac[tur]++;
    if (baz.dogru) bazDogruTop++;
    if (aday.dogru) adayDogruTop++;

    let sk = senaryoMap.get(istek.senaryo);
    if (!sk) { sk = { senaryo: istek.senaryo, toplam: 0, bazDogru: 0, adayDogru: 0 }; senaryoMap.set(istek.senaryo, sk); }
    sk.toplam++;
    if (baz.dogru) sk.bazDogru++;
    if (aday.dogru) sk.adayDogru++;

    diffler.push({
      senaryo: istek.senaryo, mesru: istek.mesru, beklenen: istek.beklenen,
      ip: istek.ctx.ip, path: istek.ctx.path, botClass: istek.ctx.botClass, baz, aday, tur,
    });
  }

  const toplam = yakalama.istekler.length || 1;
  const bazEtkinlik = Math.round((bazDogruTop / toplam) * 1000) / 10;
  const adayEtkinlik = Math.round((adayDogruTop / toplam) * 1000) / 10;
  const netDegisim = Math.round((adayEtkinlik - bazEtkinlik) * 10) / 10;

  // Dağıtım kararı: hiçbir savunma regresyonu olmamalı; yanlış-pozitif küçük tolerans;
  // net etkinlik gerilememeli.
  const yanlisPozitifOran = sayac["yanlis-pozitif"] / toplam;
  let karar_: SandboxSonuc["karar"];
  if (sayac["regresyon"] > 0 || netDegisim < 0) karar_ = "durdur";
  else if (yanlisPozitifOran > 0.02) karar_ = "dikkatli";
  else karar_ = "dagit";
  const guvenli = karar_ === "dagit";

  // Örnek diff sıralaması: regresyon → yanlış-pozitif → iyileşme (en kritik önce).
  const oncelik: Record<DiffTur, number> = {
    "regresyon": 0, "yanlis-pozitif": 1, "iyilesme": 2, "degismeyen-yanlis": 3, "degismeyen-dogru": 4,
  };
  const ornekDiffler = [...diffler].sort((a, b) => oncelik[a.tur] - oncelik[b.tur]).slice(0, 24);

  return {
    yakalamaId: yakalama.id, yakalamaAd: yakalama.ad, toplam: yakalama.istekler.length,
    iyilesme: sayac["iyilesme"], regresyon: sayac["regresyon"], yanlisPozitif: sayac["yanlis-pozitif"],
    degismeyenDogru: sayac["degismeyen-dogru"], degismeyenYanlis: sayac["degismeyen-yanlis"],
    bazEtkinlik, adayEtkinlik, netDegisim, guvenli, karar: karar_,
    senaryoKirilim: [...senaryoMap.values()], ornekDiffler,
  };
}

export const DIFF_ETIKET: Record<DiffTur, string> = {
  "iyilesme": "İyileşme", "regresyon": "Regresyon", "yanlis-pozitif": "Yanlış pozitif",
  "degismeyen-dogru": "Değişmeyen (doğru)", "degismeyen-yanlis": "Değişmeyen (açık)",
};

export const DIFF_RENK: Record<DiffTur, string> = {
  "iyilesme": "#16a34a", "regresyon": "#dc2626", "yanlis-pozitif": "#d97706",
  "degismeyen-dogru": "#64748b", "degismeyen-yanlis": "#94a3b8",
};

export const KARAR_ETIKET: Record<SandboxSonuc["karar"], string> = {
  "dagit": "Dağıtıma hazır", "dikkatli": "Dikkatli dağıt", "durdur": "Dağıtma",
};
