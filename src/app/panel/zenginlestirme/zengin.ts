/**
 * Tehdit Göstergesi Zenginleştirme Motoru — SAF & DETERMİNİSTİK
 * =============================================================
 * Ham gözlem göstergelerini (saldıran IP'ler, ASN'ler) otomatik olarak
 * TÜRETİLMİŞ bağlamla zenginleştirir: ağ tipi, itibar, ilk/son görülme,
 * güven skoru, tehdit seviyesi, önerilen aksiyon ve etiketler.
 *
 * FELSEFE — DÜRÜST ZENGİNLEŞTİRME:
 *   Buradaki hiçbir alan sahte bir harici tehdit-istihbaratı API'sinden gelmez.
 *   HEPSİ, sahibin GERÇEK gözlemlediği trafikten (BotEvent) + IP itibar
 *   kayıtlarından (IpReputation) + deterministik sezgilerden (ASN anahtar-
 *   kelime sınıflandırması, botClass karışımı) türetilir. Bu, VirusTotal/
 *   GreyNoise tarzı bir "ham IOC → zenginleştirilmiş, aksiyona dönüşebilir
 *   istihbarat" boru hattıdır; ancak veri kaynağı konusunda dürüsttür.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   "Şimdi" kavramı, olayların en büyük ts'inden türetilir. Türetilmiş ama
 *   sabit olması gereken değerler için FNV-1a hash kullanılır. Aynı girdi →
 *   daima aynı çıktı; birim test edilebilir. Tüm sıralamalar kararlıdır.
 */

import type { BotEvent, IpReputation, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Zenginleştirilmiş göstergenin tipi (ne tür bir IOC). */
export type GostergeTip = "ip" | "asn" | "ulke";

/** Türetilen ağ tipi — meşru insan trafiği beklentisini belirler. */
export type AgTipi = "barındırma" | "VPN/proxy" | "konut" | "mobil" | "bilinmeyen";

/** Zenginleştirmeden çıkan tehdit seviyesi. */
export type TehditSeviye = "temiz" | "şüpheli" | "kötü" | "kritik";

/** Önerilen otomatik aksiyon. */
export type OnerilenAksiyon = "izle" | "doğrula" | "engelle";

/**
 * Tek bir zenginleştirilmiş gösterge (ham IOC + türetilmiş bağlam).
 * Her alan gözlemlenen veriden veya deterministik sezgiden gelir.
 */
export interface ZenginGosterge {
  /** Göstergenin değeri (IP adresi veya "AS…" ASN dizisi). */
  deger: string;
  /** Gösterge tipi. */
  tip: GostergeTip;
  /** Bu göstergeye ait ilk gözlem anı (epoch ms). */
  ilkGorulme: number;
  /** Bu göstergeye ait son gözlem anı (epoch ms). */
  sonGorulme: number;
  /** Toplam gözlemlenen olay sayısı. */
  olaySayisi: number;
  /** Baskın ülke (ISO2) — IP'de tekil, ASN'de en sık görülen. */
  ulke: string;
  /** İlişkili ASN dizisi (IP için o IP'nin ASN'i; ASN göstergesinde kendisi). */
  asn: string;
  /** Türetilen ağ tipi. */
  agTipi: AgTipi;
  /** İtibar skoru (0 temiz .. 100 kötü). IpReputation varsa ondan; yoksa botClass karışımından türetilir. */
  itibar: number;
  /** Güven skoru (0..100) — zenginleştirmenin ne kadar sağlam kanıta dayandığı. */
  guven: number;
  /** Türetilen tehdit seviyesi. */
  tehdit: TehditSeviye;
  /** Bu göstergede gözlemlenen bot sınıfları (en sıktan seyreke). */
  iliskiliBotClass: BotClass[];
  /** Önerilen otomatik aksiyon. */
  onerilenAksiyon: OnerilenAksiyon;
  /** Türetilmiş etiketler ("kötü-ASN", "yüksek-hacim", "çok-ülke" …). */
  etiketler: string[];
  /** İnsan-okur türetme gerekçesi (neden bu tehdit seviyesi). */
  gerekce: string[];
  /** İlişkili kampanya ipucu (baskın bot sınıfından türetilen kısa metin). */
  kampanyaIpucu: string;
  /** Bu gösterge kaç tekil IP kapsıyor (ASN göstergelerinde >1 olabilir). */
  tekilIp: number;
}

/** Ağ tipi dağılımı (özet kartı için). */
export type AgTipiDagilim = Record<AgTipi, number>;

/** Zenginleştirme özeti (üst-seviye kartlar). */
export interface ZenginOzet {
  toplam: number;
  kritik: number;
  kotu: number;
  /** Otomatik engellenebilir: kötü+kritik VE yüksek güven (>= 70). */
  otoEngellenebilir: number;
  agTipiDagilim: AgTipiDagilim;
  ortGuven: number;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** 0..100'e sıkıştır ve yuvarla. */
function puan100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const c = v < 0 ? 0 : v > 100 ? 100 : v;
  return Math.round(c);
}

/** 0..1'e sıkıştır (savunmacı). */
function kis01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * FNV-1a 32-bit hash (deterministik). Türetilmiş ama sabit olması gereken
 * değerler için (örn. gösterge kimliği tabanlı küçük dalgalanmalar) kullanılır.
 * Girdi aynıysa çıktı daima aynıdır.
 */
export function fnv1a(metin: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    // 32-bit FNV prime çarpımı (taşmasız).
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** "AS14061 DigitalOcean, LLC" → { kod: "AS14061", ad: "DigitalOcean, LLC" }. */
export function asnAyristir(asn: string): { kod: string; ad: string } {
  const m = /^\s*(AS\d+)\s*(.*)$/i.exec(asn ?? "");
  if (m) return { kod: m[1].toUpperCase(), ad: m[2].trim() || m[1].toUpperCase() };
  return { kod: asn || "AS?", ad: asn || "Bilinmeyen" };
}

/** Bir botClass "insan" değilse bot sayılır. */
function botMu(botClass: BotClass): boolean {
  return botClass !== "human";
}

/* ------------------------------------------------------------------ Ağ tipi sınıflandırıcı */

/** ASN adından ağ tipini türeten anahtar-kelime kümeleri (deterministik). */
const BARINDIRMA_ANAHTAR = [
  "digitalocean", "amazon", "aws", "google cloud", "google llc", "microsoft",
  "azure", "hetzner", "ovh", "linode", "akamai", "cloudflare", "vultr",
  "leaseweb", "contabo", "scaleway", "oracle", "alibaba", "tencent", "choopa",
  "datacamp", "hosting", "cloud", "server", "datacenter", "data center",
  "colocation", "colo", "vps", "dedicated", "host europe", "gigenet",
];

/** VPN/proxy operatörü anahtar kelimeleri (barındırmadan ÖNCE kontrol edilir). */
const VPN_ANAHTAR = [
  "vpn", "proxy", "m247", "nordvpn", "expressvpn", "surfshark", "mullvad",
  "private internet", "cyberghost", "protonvpn", "windscribe", " nym", "tor ",
  "anonymize", "anonymous", "datapacket", "packethub",
];

/** Mobil operatör anahtar kelimeleri. */
const MOBIL_ANAHTAR = [
  "mobile", "cellular", "gsm", "wireless", "3g", "4g", "lte", "5g",
  "vodafone", "turkcell", "t-mobile", "telefonica", "orange", "airtel",
  "verizon wireless", "at&t mobility", "reliance jio", "türk telekom mobil",
];

/** Konut/geniş bant ISP anahtar kelimeleri. */
const KONUT_ANAHTAR = [
  "türk telekom", "turk telekom", "ttnet", "superonline", "comcast",
  "spectrum", "at&t", "verizon", "cox", "charter", "deutsche telekom",
  "telecom", "broadband", "kabel", "fiber", "dsl", "residential", "isp",
  "communications", "telekomunikasyon", "net a.ş", "internet hizmetleri",
];

/**
 * ASN adından ağ tipini deterministik olarak sınıflandırır.
 * Öncelik sırası önemlidir: VPN/proxy → barındırma → mobil → konut.
 * (VPN operatörleri sık sık "cloud/hosting" gibi de görünür; önce onları yakala.)
 */
export function agTipiTespit(asn: string): AgTipi {
  const { ad } = asnAyristir(asn);
  const s = (" " + ad.toLowerCase() + " ");
  if (VPN_ANAHTAR.some((k) => s.includes(k))) return "VPN/proxy";
  if (BARINDIRMA_ANAHTAR.some((k) => s.includes(k))) return "barındırma";
  if (MOBIL_ANAHTAR.some((k) => s.includes(k))) return "mobil";
  if (KONUT_ANAHTAR.some((k) => s.includes(k))) return "konut";
  return "bilinmeyen";
}

/** IP itibar kategorisini ağ tipine eşle (kategori varsa ad-sezgisini ezer). */
function kategoriAgTipi(kategori: IpReputation["category"]): AgTipi | null {
  switch (kategori) {
    case "datacenter":
      return "barındırma";
    case "vpn":
    case "tor":
      return "VPN/proxy";
    default:
      return null; // clean/suspicious/malicious → ad-sezgisine bırak
  }
}

/* ------------------------------------------------------------------ İtibar & tehdit türetme */

/**
 * botClass karışımından itibar skoru türetir (0..100). IpReputation kaydı
 * yoksa devreye girer. Ağır bot sınıfları (credential_stuffing, ddos, scraper)
 * skoru yükseltir; human/good_bot düşürür.
 */
function botClassItibar(sayac: Map<BotClass, number>, toplam: number): number {
  if (!toplam) return 0;
  const agirlik: Record<BotClass, number> = {
    human: 0,
    good_bot: 5,
    automation: 55,
    scraper: 65,
    credential_stuffing: 88,
    ai_agent: 45,
    ddos: 92,
    spam: 70,
  };
  let toplamAgirlik = 0;
  for (const [k, c] of sayac) toplamAgirlik += agirlik[k] * c;
  return puan100(toplamAgirlik / toplam);
}

/** Baskın (en sık) bot sınıflarını sıralı döndürür (en çok → en az, kararlı). */
function botClassSirali(sayac: Map<BotClass, number>): BotClass[] {
  return [...sayac.entries()]
    .sort((a, z) => z[1] - a[1] || a[0].localeCompare(z[0]))
    .map(([k]) => k);
}

/** Baskın bot sınıfından kısa kampanya ipucu türet. */
function kampanyaIpucuTuret(baskin: BotClass | undefined): string {
  switch (baskin) {
    case "credential_stuffing":
      return "Kimlik doldurma kampanyası deseni (dağıtık giriş denemeleri).";
    case "scraper":
      return "İçerik kazıma kampanyası deseni (yüksek hacimli sayfa çekme).";
    case "ddos":
      return "Hacim/DDoS deseni (yoğun eşzamanlı istek).";
    case "ai_agent":
      return "AI ajan tarama deseni (model eğitimi / canlı getirme).";
    case "automation":
      return "Otomasyon aracı deseni (Selenium/Puppeteer/Playwright imzası).";
    case "spam":
      return "Spam/form kötüye kullanım deseni.";
    case "good_bot":
      return "Meşru bot (arama motoru / doğrulanmış tarayıcı).";
    case "human":
      return "İnsan trafiği baskın — düşük tehdit.";
    default:
      return "Belirgin bir kampanya deseni gözlemlenmedi.";
  }
}

/**
 * İtibar + botOran + ağ tipinden tehdit seviyesi türet. Barındırma/VPN
 * ağlarından gelen bot trafiği daha yüksek şüphe taşır (meşru insan oradan
 * gelmez).
 */
function tehditTuret(opts: {
  itibar: number;
  botOran: number;
  agTipi: AgTipi;
  engelOran: number;
}): TehditSeviye {
  const supheliAg = opts.agTipi === "barındırma" || opts.agTipi === "VPN/proxy";
  // Etkin tehdit puanı: itibar baskın, bot oranı + engel oranı + ağ şüphesi biner.
  let p = opts.itibar * 0.6 + opts.botOran * 100 * 0.25 + opts.engelOran * 100 * 0.15;
  if (supheliAg) p += 12;
  p = puan100(p);
  if (p >= 78) return "kritik";
  if (p >= 55) return "kötü";
  if (p >= 30) return "şüpheli";
  return "temiz";
}

/**
 * Tehdit + güvenden önerilen aksiyonu türet. Kritik tehdit, engelleme için
 * biraz daha düşük güven eşiği kabul eder (net kötücül desen); "kötü" için
 * eşik daha yüksektir (yanlış-pozitif maliyeti).
 */
function aksiyonTuret(tehdit: TehditSeviye, guven: number): OnerilenAksiyon {
  if (tehdit === "kritik" && guven >= 55) return "engelle";
  if (tehdit === "kötü" && guven >= 65) return "engelle";
  if (tehdit === "kötü" || tehdit === "kritik" || tehdit === "şüpheli") return "doğrula";
  return "izle";
}

/**
 * Güven skoru (0..100): zenginleştirmenin ne kadar sağlam kanıta dayandığı.
 * Daha çok olay + IP itibar kaydının varlığı + net ağ tipi güveni yükseltir.
 */
function guvenTuret(opts: {
  olaySayisi: number;
  itibarKaydiVar: boolean;
  agTipiBilinir: boolean;
  tekilIp: number;
}): number {
  // Hacim faktörü: 1 olayda ~0.2, 100+ olayda ~1'e doyar (log ölçek).
  const hacim = kis01(Math.log10(Math.max(1, opts.olaySayisi)) / Math.log10(100));
  let g = 30 + hacim * 45; // taban 30, hacimle +45
  if (opts.itibarKaydiVar) g += 15; // dış itibar kaydı kanıtı güçlendirir
  if (opts.agTipiBilinir) g += 8; // net ağ sınıflandırması
  if (opts.tekilIp >= 5) g += 5; // geniş IP tabanı (ASN için)
  return puan100(g);
}

/* ------------------------------------------------------------------ Ana boru hattı */

interface Biriktir {
  ilk: number;
  son: number;
  toplam: number;
  botSayi: number;
  engellenen: number;
  challenge: number;
  ipler: Set<string>;
  ulkeSayac: Map<string, number>;
  asnSayac: Map<string, number>;
  botClassSayac: Map<BotClass, number>;
}

function yeniBiriktir(): Biriktir {
  return {
    ilk: Number.POSITIVE_INFINITY,
    son: 0,
    toplam: 0,
    botSayi: 0,
    engellenen: 0,
    challenge: 0,
    ipler: new Set(),
    ulkeSayac: new Map(),
    asnSayac: new Map(),
    botClassSayac: new Map(),
  };
}

function biriktirEkle(b: Biriktir, e: BotEvent): void {
  b.toplam++;
  if (e.ts < b.ilk) b.ilk = e.ts;
  if (e.ts > b.son) b.son = e.ts;
  if (e.verdict === "blocked") b.engellenen++;
  if (e.verdict === "challenged") b.challenge++;
  if (botMu(e.botClass)) {
    b.botSayi++;
    b.botClassSayac.set(e.botClass, (b.botClassSayac.get(e.botClass) ?? 0) + 1);
  }
  if (e.ip) b.ipler.add(e.ip);
  if (e.country) {
    const u = e.country.toUpperCase();
    b.ulkeSayac.set(u, (b.ulkeSayac.get(u) ?? 0) + 1);
  }
  if (e.asn) b.asnSayac.set(e.asn, (b.asnSayac.get(e.asn) ?? 0) + 1);
}

/** Bir sayaç haritasından en sık anahtarı döndür (kararlı; boşsa fallback). */
function enSik<T>(sayac: Map<T, number>, fallback: T): T {
  let enIyi = fallback;
  let enCok = -1;
  for (const [k, c] of [...sayac.entries()].sort((a, z) =>
    typeof a[0] === "string" && typeof z[0] === "string" ? a[0].localeCompare(z[0] as string) : 0,
  )) {
    if (c > enCok) {
      enCok = c;
      enIyi = k;
    }
  }
  return enIyi;
}

/**
 * Bir birikimden zenginleştirilmiş göstergeyi kurar (IP veya ASN göstergesi
 * için ortak). `ipRepKayit` varsa (yalnız IP göstergesinde) itibarı ondan alır.
 */
function gostergeKur(
  deger: string,
  tip: GostergeTip,
  b: Biriktir,
  ipRepKayit: IpReputation | undefined,
): ZenginGosterge {
  const botOran = b.toplam ? b.botSayi / b.toplam : 0;
  const engelOran = b.toplam ? (b.engellenen + b.challenge) / b.toplam : 0;
  const baskinAsn = tip === "asn" ? deger : enSik(b.asnSayac, "AS? Bilinmeyen");
  const baskinUlke = enSik(b.ulkeSayac, "??");
  const tekilIp = tip === "ip" ? 1 : b.ipler.size;

  // Ağ tipi: IP itibar kategorisi (varsa) ad-sezgisini ezer; yoksa ASN adından.
  let agTipi = agTipiTespit(baskinAsn);
  if (ipRepKayit) {
    const kt = kategoriAgTipi(ipRepKayit.category);
    if (kt) agTipi = kt;
  }

  // İtibar: IpReputation kaydı varsa onun threatScore'u; yoksa botClass karışımı.
  const itibarKaydiVar = !!ipRepKayit;
  const itibar = ipRepKayit
    ? puan100(ipRepKayit.threatScore)
    : botClassItibar(b.botClassSayac, b.toplam);

  const tehdit = tehditTuret({ itibar, botOran, agTipi, engelOran });
  const guven = guvenTuret({
    olaySayisi: b.toplam,
    itibarKaydiVar,
    agTipiBilinir: agTipi !== "bilinmeyen",
    tekilIp,
  });
  const onerilenAksiyon = aksiyonTuret(tehdit, guven);
  const botClasslar = botClassSirali(b.botClassSayac);
  const kampanyaIpucu = kampanyaIpucuTuret(botClasslar[0]);

  // --- Türetilmiş etiketler ---
  const etiketler: string[] = [];
  if (agTipi === "barındırma") etiketler.push("kötü-ASN");
  if (agTipi === "VPN/proxy") etiketler.push("VPN/proxy");
  if (b.toplam >= 30) etiketler.push("yüksek-hacim");
  if (b.ulkeSayac.size >= 3) etiketler.push("çok-ülke");
  if (b.engellenen > 0) etiketler.push("engellenmiş");
  if (ipRepKayit && (ipRepKayit.category === "malicious" || ipRepKayit.category === "tor")) {
    etiketler.push(`itibar:${ipRepKayit.category}`);
  }
  if (botOran >= 0.8) etiketler.push("yoğun-bot");
  if (botClasslar[0] === "credential_stuffing") etiketler.push("kimlik-doldurma");
  if (botClasslar[0] === "scraper") etiketler.push("kazıyıcı");

  // --- İnsan-okur türetme gerekçesi (raw → enriched şeffaflığı) ---
  const gerekce: string[] = [];
  gerekce.push(
    `${b.toplam} gözlem, %${Math.round(botOran * 100)} bot sınıfı; ortalama engelleme/challenge oranı %${Math.round(engelOran * 100)}.`,
  );
  if (agTipi === "barındırma") {
    gerekce.push("Barındırma/veri-merkezi ağı — meşru son-kullanıcı buradan gelmez, şüphe yükseltildi.");
  } else if (agTipi === "VPN/proxy") {
    gerekce.push("VPN/proxy ağı — kaynak gizleme sinyali, şüphe yükseltildi.");
  } else if (agTipi === "konut") {
    gerekce.push("Konut ISP ağı — meşru trafikle uyumlu, tabanda düşük şüphe.");
  } else if (agTipi === "mobil") {
    gerekce.push("Mobil operatör ağı — paylaşımlı NAT nedeniyle temkinli değerlendirildi.");
  }
  if (itibarKaydiVar) {
    gerekce.push(`Dış IP itibar kaydı mevcut: kategori "${ipRepKayit!.category}", tehdit skoru ${Math.round(ipRepKayit!.threatScore)}.`);
  } else {
    gerekce.push("İtibar, gözlemlenen botClass karışımından türetildi (dış itibar kaydı yok).");
  }

  return {
    deger,
    tip,
    ilkGorulme: Number.isFinite(b.ilk) ? b.ilk : b.son,
    sonGorulme: b.son,
    olaySayisi: b.toplam,
    ulke: baskinUlke,
    asn: baskinAsn,
    agTipi,
    itibar,
    guven,
    tehdit,
    iliskiliBotClass: botClasslar,
    onerilenAksiyon,
    etiketler,
    gerekce,
    kampanyaIpucu,
    tekilIp,
  };
}

/**
 * Ham göstergeleri (gözlemlenen IP'ler + ASN'ler) otomatik zenginleştirir.
 *
 * - Her "anlamlı" saldıran IP için (en az bir bot olayı VEYA engel/challenge
 *   almış) bir IP göstergesi kurulur.
 * - Ayrıca en aktif ASN'ler için ayrı ASN göstergeleri kurulur (ağ-seviyesi
 *   tehdit görünürlüğü).
 *
 * Sonuç: önce tehdit seviyesi (kritik→temiz), sonra güven, sonra olay sayısı,
 * sonra değer (deterministik/kararlı) azalan sıralanır.
 */
export function gostergeleriZenginlestir(
  events: BotEvent[],
  ipRep: IpReputation[],
): ZenginGosterge[] {
  // IP → itibar kaydı (hızlı arama).
  const ipRepHarita = new Map<string, IpReputation>();
  for (const r of ipRep) ipRepHarita.set(r.ip, r);

  const ipBirikim = new Map<string, Biriktir>();
  const asnBirikim = new Map<string, Biriktir>();

  for (const e of events) {
    if (e.ip) {
      let b = ipBirikim.get(e.ip);
      if (!b) {
        b = yeniBiriktir();
        ipBirikim.set(e.ip, b);
      }
      biriktirEkle(b, e);
    }
    if (e.asn) {
      let b = asnBirikim.get(e.asn);
      if (!b) {
        b = yeniBiriktir();
        asnBirikim.set(e.asn, b);
      }
      biriktirEkle(b, e);
    }
  }

  const sonuc: ZenginGosterge[] = [];

  // --- IP göstergeleri: "anlamlı" olanlar (bot olayı ya da engel/challenge). ---
  for (const [ip, b] of ipBirikim) {
    const anlamli = b.botSayi > 0 || b.engellenen > 0 || b.challenge > 0 || ipRepHarita.has(ip);
    if (!anlamli) continue;
    sonuc.push(gostergeKur(ip, "ip", b, ipRepHarita.get(ip)));
  }

  // --- ASN göstergeleri: en az 2 olay görmüş her ASN (ağ-seviyesi görünürlük). ---
  for (const [asn, b] of asnBirikim) {
    if (b.toplam < 2) continue;
    sonuc.push(gostergeKur(asn, "asn", b, undefined));
  }

  // Kararlı sıralama: tehdit seviyesi → güven → olay sayısı → değer.
  const tehditSira: Record<TehditSeviye, number> = { kritik: 3, kötü: 2, şüpheli: 1, temiz: 0 };
  sonuc.sort(
    (a, z) =>
      tehditSira[z.tehdit] - tehditSira[a.tehdit] ||
      z.guven - a.guven ||
      z.olaySayisi - a.olaySayisi ||
      a.deger.localeCompare(z.deger),
  );
  return sonuc;
}

/** Boş ağ tipi dağılımı iskeleti. */
function bosAgDagilim(): AgTipiDagilim {
  return { "barındırma": 0, "VPN/proxy": 0, "konut": 0, "mobil": 0, "bilinmeyen": 0 };
}

/** Zenginleştirilmiş göstergelerden üst-seviye özet türetir. */
export function zenginlestirmeOzet(gostergeler: ZenginGosterge[]): ZenginOzet {
  const dagilim = bosAgDagilim();
  let kritik = 0;
  let kotu = 0;
  let otoEngellenebilir = 0;
  let guvenToplam = 0;

  for (const g of gostergeler) {
    dagilim[g.agTipi]++;
    if (g.tehdit === "kritik") kritik++;
    if (g.tehdit === "kötü") kotu++;
    if ((g.tehdit === "kötü" || g.tehdit === "kritik") && g.guven >= 70) otoEngellenebilir++;
    guvenToplam += g.guven;
  }

  return {
    toplam: gostergeler.length,
    kritik,
    kotu,
    otoEngellenebilir,
    agTipiDagilim: dagilim,
    ortGuven: gostergeler.length ? Math.round(guvenToplam / gostergeler.length) : 0,
  };
}
