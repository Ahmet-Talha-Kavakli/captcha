/**
 * Specter — Saldırgan Niyet & Motivasyon Sınıflandırma
 * ====================================================
 * "Bu saldırgan NE İSTİYOR?" Bir botu engellemek yetmez; NEDEN geldiğini bilmek
 * savunmayı hedefler. Gözlemlenen davranıştan (hedef yollar, botClass, hacim,
 * zamanlama, coğrafya) saldırganın MOTİVASYONUNU çıkarırız:
 *
 *   • finansal   — hesap ele geçirme, ödeme/checkout kötüye kullanımı, kart deneme.
 *   • veri       — içerik/fiyat kazıma, veri hasadı, AI eğitim toplama.
 *   • yikim      — hizmet kesintisi (DDoS), kaynak tüketimi.
 *   • kesif      — zafiyet tarama, endpoint numaralandırma, keşif.
 *   • kotuye     — spam, sahte kayıt, içerik enjeksiyonu.
 *
 * Yöntem: Bayes-benzeri kanıt birikimi. Her motivasyonun bir ÖNSEL olasılığı
 * vardır; her gözlem (kanıt) motivasyonların olabilirliğini (likelihood) çarpar;
 * log-uzayında toplanıp softmax ile normalize edilir. Sonuç: motivasyon dağılımı
 * + en olası niyet + güven + katkı sağlayan kanıtlar (açıklanabilirlik).
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

export type Motivasyon = "finansal" | "veri" | "yikim" | "kesif" | "kotuye";

export const MOTIVASYON_META: Record<Motivasyon, { ad: string; aciklama: string; renk: string; ikon: string }> = {
  finansal: { ad: "Finansal kazanç", aciklama: "Hesap ele geçirme, ödeme/kart kötüye kullanımı", renk: "#dc2626", ikon: "Banknote" },
  veri:     { ad: "Veri hasadı",      aciklama: "İçerik/fiyat kazıma, AI eğitim toplama", renk: "#7c3aed", ikon: "Database" },
  yikim:    { ad: "Hizmet yıkımı",    aciklama: "DDoS, kaynak tüketimi, kesinti", renk: "#ea580c", ikon: "Bomb" },
  kesif:    { ad: "Keşif / tarama",   aciklama: "Zafiyet tarama, endpoint numaralandırma", renk: "#0891b2", ikon: "Radar" },
  kotuye:   { ad: "Kötüye kullanım",  aciklama: "Spam, sahte kayıt, içerik enjeksiyonu", renk: "#d97706", ikon: "Megaphone" },
};

const MOTIVASYONLAR: Motivasyon[] = ["finansal", "veri", "yikim", "kesif", "kotuye"];

/** Önsel (prior) olasılıklar — tipik saldırı dağılımı (toplam 1). */
const ONSEL: Record<Motivasyon, number> = {
  finansal: 0.28, veri: 0.30, yikim: 0.12, kesif: 0.18, kotuye: 0.12,
};

const YOL_FINANSAL = /login|signin|auth|password|account|checkout|payment|card|wallet|balance|transfer|order/i;
const YOL_VERI = /product|price|fiyat|urun|catalog|api|graphql|export|\.json|feed|search|list|scrape/i;
const YOL_KESIF = /admin|\.env|config|backup|\.git|wp-|phpmyadmin|debug|test|\.bak|sitemap|robots/i;
const YOL_KOTUYE = /register|signup|comment|contact|review|upload|submit|post|form/i;

const ARAC_UA = /python|curl|wget|go-http|java|scrapy|libwww|http-client/i;
const AI_UA = /gptbot|claudebot|perplexity|ccbot|bytespider|ai/i;

export interface NiyetKanit {
  ad: string;
  /** Hangi motivasyonu ne kadar destekledi (log-likelihood katkısı). */
  etkiler: Partial<Record<Motivasyon, number>>;
  detay: string;
}

/** Bir olay kümesinden kanıtları toplar (davranış özellikleri). */
function kanitToplama(events: BotEvent[]): NiyetKanit[] {
  const n = events.length || 1;
  const kanitlar: NiyetKanit[] = [];

  // Yol dağılımı.
  const say = (re: RegExp) => events.filter((e) => re.test(e.path || "")).length / n;
  const finYol = say(YOL_FINANSAL), veriYol = say(YOL_VERI), kesifYol = say(YOL_KESIF), kotuyeYol = say(YOL_KOTUYE);
  if (finYol > 0.15) kanitlar.push({ ad: "Finansal yol hedefleme", etkiler: { finansal: 1.4 * finYol }, detay: `İsteklerin %${Math.round(finYol * 100)}'i login/ödeme/hesap yollarına.` });
  if (veriYol > 0.2) kanitlar.push({ ad: "Veri/API yol hedefleme", etkiler: { veri: 1.3 * veriYol }, detay: `İsteklerin %${Math.round(veriYol * 100)}'i ürün/fiyat/API yollarına.` });
  if (kesifYol > 0.08) kanitlar.push({ ad: "Hassas/keşif yolları", etkiler: { kesif: 1.6 * kesifYol }, detay: `admin/.env/config/backup gibi yollara erişim denemesi (%${Math.round(kesifYol * 100)}).` });
  if (kotuyeYol > 0.15) kanitlar.push({ ad: "Kayıt/form yolları", etkiler: { kotuye: 1.2 * kotuyeYol }, detay: `register/comment/upload yollarına yoğunluk (%${Math.round(kotuyeYol * 100)}).` });

  // botClass dağılımı.
  const bc = (c: string) => events.filter((e) => e.botClass === c).length / n;
  const cred = bc("credential_stuffing"), scr = bc("scraper"), ddos = bc("ddos"), ai = bc("ai_agent"), spam = bc("spam");
  if (cred > 0.1) kanitlar.push({ ad: "Kimlik-doldurma sınıfı", etkiler: { finansal: 1.8 * cred }, detay: `Trafiğin %${Math.round(cred * 100)}'i credential_stuffing.` });
  if (scr > 0.15) kanitlar.push({ ad: "Kazıyıcı sınıfı", etkiler: { veri: 1.5 * scr }, detay: `Trafiğin %${Math.round(scr * 100)}'i scraper.` });
  if (ddos > 0.08) kanitlar.push({ ad: "DDoS sınıfı", etkiler: { yikim: 2.0 * ddos }, detay: `Trafiğin %${Math.round(ddos * 100)}'i ddos.` });
  if (ai > 0.1) kanitlar.push({ ad: "AI-ajan sınıfı", etkiler: { veri: 1.2 * ai }, detay: `Trafiğin %${Math.round(ai * 100)}'i ai_agent (eğitim toplama).` });
  if (spam > 0.1) kanitlar.push({ ad: "Spam sınıfı", etkiler: { kotuye: 1.6 * spam }, detay: `Trafiğin %${Math.round(spam * 100)}'i spam.` });

  // Hacim yoğunluğu — yıkım göstergesi (aynı kaynaktan çok sayıda istek).
  if (n > 40) kanitlar.push({ ad: "Yüksek istek hacmi", etkiler: { yikim: Math.min(1.5, n / 200), finansal: 0.3 }, detay: `${n} istek gözlemlendi — kaynak tüketimi/kaba kuvvet göstergesi.` });

  // UA imzası.
  const aracPay = events.filter((e) => ARAC_UA.test(e.ua || "")).length / n;
  const aiPay = events.filter((e) => AI_UA.test(e.ua || "")).length / n;
  if (aracPay > 0.3) kanitlar.push({ ad: "Otomasyon aracı UA", etkiler: { veri: 0.6, kesif: 0.4 }, detay: `İsteklerin %${Math.round(aracPay * 100)}'i script/araç UA (python/curl).` });
  if (aiPay > 0.15) kanitlar.push({ ad: "AI tarayıcı UA", etkiler: { veri: 0.9 }, detay: `Bildirilen AI botu UA'ları (gptbot/claudebot vb.).` });

  // Düşük skor yoğunluğu — kaba kuvvet/otomasyon.
  const dusukSkor = events.filter((e) => e.score < 0.25).length / n;
  if (dusukSkor > 0.4) kanitlar.push({ ad: "Yaygın düşük skor", etkiler: { finansal: 0.4, yikim: 0.4 }, detay: `İsteklerin %${Math.round(dusukSkor * 100)}'i çok düşük insanlık skoru.` });

  return kanitlar;
}

export interface NiyetSonuc {
  /** Her motivasyonun olasılığı (softmax, toplam 1). */
  dagilim: { motivasyon: Motivasyon; olasilik: number }[];
  /** En olası motivasyon. */
  niyet: Motivasyon;
  /** Güven 0-100 (en olası ile ikinci arası fark). */
  guven: number;
  /** Katkı sağlayan kanıtlar. */
  kanitlar: NiyetKanit[];
  /** İnsan-okur gerekçe. */
  gerekce: string;
  toplamOlay: number;
}

/** Bir olay kümesinden saldırgan niyetini Bayes-benzeri çıkarır. */
export function niyetSiniflandir(events: BotEvent[]): NiyetSonuc {
  const kanitlar = kanitToplama(events);

  // Log-uzayında: log(önsel) + Σ kanıt katkısı.
  const logSkor: Record<Motivasyon, number> = {} as never;
  for (const m of MOTIVASYONLAR) logSkor[m] = Math.log(ONSEL[m]);
  for (const k of kanitlar) {
    for (const m of MOTIVASYONLAR) {
      const e = k.etkiler[m];
      if (e) logSkor[m] += e; // log-likelihood katkısı
    }
  }

  // Softmax → olasılık dağılımı.
  const maxLog = Math.max(...MOTIVASYONLAR.map((m) => logSkor[m]));
  const exp = MOTIVASYONLAR.map((m) => ({ m, v: Math.exp(logSkor[m] - maxLog) }));
  const toplam = exp.reduce((a, b) => a + b.v, 0) || 1;
  const dagilim = exp
    .map(({ m, v }) => ({ motivasyon: m, olasilik: Math.round((v / toplam) * 1000) / 1000 }))
    .sort((a, b) => b.olasilik - a.olasilik);

  const niyet = dagilim[0].motivasyon;
  const fark = dagilim[0].olasilik - (dagilim[1]?.olasilik ?? 0);
  const guven = Math.round(Math.min(100, fark * 100 + dagilim[0].olasilik * 40));

  const meta = MOTIVASYON_META[niyet];
  const enGuclu = [...kanitlar].sort((a, b) => (b.etkiler[niyet] ?? 0) - (a.etkiler[niyet] ?? 0))[0];
  const gerekce = kanitlar.length === 0
    ? "Yeterli ayırt edici davranış kanıtı yok — niyet önsel dağılıma yakın."
    : `En olası niyet: ${meta.ad} (%${Math.round(dagilim[0].olasilik * 100)}). ${enGuclu ? `Başlıca kanıt: ${enGuclu.detay}` : ""}`;

  return { dagilim, niyet, guven, kanitlar, gerekce, toplamOlay: events.length };
}

/* ---------------------------------------------- Saldırgan (IP/ASN) bazında niyet */

export interface SaldirganNiyet {
  anahtar: string; // IP veya ASN
  tip: "ip" | "asn";
  olaySayisi: number;
  country: string;
  sonuc: NiyetSonuc;
}

/** Top saldırganları (IP) niyet bazında sınıflandırır. */
export function saldirganNiyetleri(events: BotEvent[], enFazla = 12): SaldirganNiyet[] {
  const IYI = new Set(["human", "good_bot"]);
  const grup = new Map<string, BotEvent[]>();
  for (const e of events) {
    if (IYI.has(e.botClass)) continue;
    if (!grup.has(e.ip)) grup.set(e.ip, []);
    grup.get(e.ip)!.push(e);
  }
  const out: SaldirganNiyet[] = [];
  for (const [ip, list] of grup) {
    if (list.length < 3) continue;
    out.push({ anahtar: ip, tip: "ip", olaySayisi: list.length, country: list[0].country, sonuc: niyetSiniflandir(list) });
  }
  out.sort((a, b) => b.olaySayisi - a.olaySayisi);
  return out.slice(0, enFazla);
}

export interface NiyetOzet {
  toplamSaldirgan: number;
  dagilim: { motivasyon: Motivasyon; sayi: number; oran: number }[];
  baskinNiyet: Motivasyon | null;
  genelNiyet: NiyetSonuc;
}

export function niyetOzet(events: BotEvent[], saldirganlar: SaldirganNiyet[]): NiyetOzet {
  const say = new Map<Motivasyon, number>(MOTIVASYONLAR.map((m) => [m, 0]));
  for (const s of saldirganlar) say.set(s.sonuc.niyet, (say.get(s.sonuc.niyet) || 0) + 1);
  const toplam = saldirganlar.length || 1;
  const dagilim = MOTIVASYONLAR
    .map((m) => ({ motivasyon: m, sayi: say.get(m) || 0, oran: Math.round(((say.get(m) || 0) / toplam) * 1000) / 10 }))
    .sort((a, b) => b.sayi - a.sayi);
  const baskin = dagilim[0]?.sayi > 0 ? dagilim[0].motivasyon : null;
  return { toplamSaldirgan: saldirganlar.length, dagilim, baskinNiyet: baskin, genelNiyet: niyetSiniflandir(events) };
}
