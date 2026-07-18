/**
 * Specter — CAPTCHA Sürtünme & Çözüm Analitiği (motor)
 * =====================================================
 * Bu modül, meşru insanların ghost-font challenge'ından NE KADAR İYİ
 * geçtiğini ölçen SAF (pure) bir hesap katmanıdır — bir UX-kalite motoru.
 *
 * Ana fikir: Güvenlik ile sürtünme arasında bir denge vardır.
 *   - Zorluk artarsa bot brute-force alanı büyür (güvenlik ↑) ama gerçek
 *     insan da bulmacayı çözmekte zorlanır (çözüm oranı ↓, terk ↑).
 *   - Zorluk düşerse insan akıcı geçer (sürtünme ↓) ama koruma zayıflar.
 * Bu motor bu dengeyi sayısallaştırır: çözüm hunisi, sürtünme skoru,
 * günlük trend ve zorluk-bazlı sürtünme tablosu.
 *
 * DETERMİNİZM: Bu dosyada Date.now(), Math.random() veya argümansız
 * `new Date()` KULLANILMAZ. Tüm çıktı yalnızca girdilere bağlıdır. Böylece
 * hem sunucu hem test aynı girdi için birebir aynı sonucu üretir.
 *
 * ÖLÇÜLEN vs MODELLENEN:
 *   - ÖLÇÜLEN: çözüm/terk oranı, gösterim, günlük trend (UsageCounter'dan
 *     gerçek sayaçlar) ve insan-çözüm tahmini (BotEvent verdict'lerinden).
 *   - MODELLENEN: zorluk-bazlı beklenen çözüm oranı + ortalama çözüm süresi.
 *     BotEvent'te gerçek "çözüm süresi" alanı YOKTUR (yalnızca `latency` =
 *     ağ yanıt süresi var, kullanıcının bulmacayı çözme süresi değil). Bu
 *     yüzden süre, skordan/zorluktan deterministik türetilir ve dürüstçe
 *     "modellenmiş" olarak işaretlenir.
 */

import type { UsageCounter, BotEvent } from "@/lib/db/schema";
import { difficultyLength, type Difficulty } from "./challenge";

/* ------------------------------------------------------------------ Çözüm hunisi */

export interface CozumHunisi {
  /** Kullanıcıya gösterilen challenge sayısı (issued). */
  gosterildi: number;
  /** Doğrulamayı çözüp geçen (verified/allowed) sayı. */
  cozuldu: number;
  /** Engellenen (bot/şüpheli) sayı. */
  engellendi: number;
  /** Terk edilen (yaklaşık): gösterilen − çözülen − engellenen. */
  terkedildi: number;
  /** Çözüm oranı: çözülen / gösterilen (0..100). */
  cozumOran: number;
  /** Terk oranı: terk / gösterilen (0..100). */
  terkOran: number;
}

/**
 * UsageCounter dizisinden çözüm hunisini kurar.
 *
 * TERK YAKLAŞIMI (varsayım): UsageCounter'da açık bir "abandoned" sayacı
 * yoktur. Terk, geriye kalan miktar olarak yaklaşıklanır:
 *     terk = gösterilen − çözülen − engellenen
 * Sezgi: bir challenge gösterildiyse üç sonuçtan biri olur → çözüldü,
 * engellendi (bot) ya da kullanıcı vazgeçti (terk). "challenged" (henüz
 * sonuçlanmamış / tekrar denenen) durumlar da bu artık içinde toplanır,
 * bu yüzden bu gerçek bir alt sınır değil YAKLAŞIK bir üst-terk ölçüsüdür.
 * Negatife düşmemesi için 0'da kırpılır.
 */
export function cozumHunisi(usage: UsageCounter[]): CozumHunisi {
  let gosterildi = 0;
  let cozuldu = 0;
  let engellendi = 0;
  for (const u of usage) {
    gosterildi += u.issued;
    cozuldu += u.verified;
    engellendi += u.blocked;
  }
  const terkedildi = Math.max(0, gosterildi - cozuldu - engellendi);
  const cozumOran = gosterildi > 0 ? (cozuldu / gosterildi) * 100 : 0;
  const terkOran = gosterildi > 0 ? (terkedildi / gosterildi) * 100 : 0;
  return {
    gosterildi,
    cozuldu,
    engellendi,
    terkedildi,
    cozumOran: Math.round(cozumOran * 10) / 10,
    terkOran: Math.round(terkOran * 10) / 10,
  };
}

/* ------------------------------------------------------------------ Sürtünme skoru */

export type SurtunmeSeviye = "düşük" | "orta" | "yüksek";

export interface SurtunmeSonuc {
  /** 0..100 sürtünme skoru. DÜŞÜK = az sürtünme = iyi UX. */
  skor: number;
  seviye: SurtunmeSeviye;
  yorum: string;
}

/**
 * Sürtünme skoru: meşru kullanıcının yaşadığı zorluğu 0..100 ölçekler.
 * DÜŞÜK skor = az sürtünme = iyi UX; YÜKSEK skor = kullanıcı kaybı riski.
 *
 * Bileşenler:
 *   - Düşük çözüm oranı → sürtünme ↑  (çözemeyen kullanıcı = sürtünme)
 *   - Yüksek terk oranı → sürtünme ↑  (vazgeçen kullanıcı = en net sürtünme)
 *   - Uzun ortalama çözüm süresi (opsiyonel, saniye) → sürtünme ↑
 *
 * Ağırlıklar: terk en ağır (kullanıcıyı doğrudan kaybettirir), sonra çözüm
 * açığı, sonra süre. Süre verilmezse ağırlığı yeniden dağıtılır.
 */
export function surtunmeSkoru(cozumOran: number, terkOran: number, ortSure?: number): SurtunmeSonuc {
  const co = clamp(cozumOran, 0, 100);
  const to = clamp(terkOran, 0, 100);

  // Çözüm açığı: 100 = herkes çözdü (açık 0). 0 = kimse çözemedi (açık 100).
  const cozumAcigi = 100 - co;

  // Süre cezası: ~4 sn'ye kadar rahat (0 ceza), ~14 sn'de tavan (100). Süre
  // yoksa bu bileşen devre dışı ve ağırlığı diğerlerine dağıtılır.
  const sureVar = typeof ortSure === "number" && Number.isFinite(ortSure);
  const sureCeza = sureVar ? clamp(((ortSure as number) - 4) / 10 * 100, 0, 100) : 0;

  let skor: number;
  if (sureVar) {
    // terk %50, çözüm açığı %35, süre %15
    skor = to * 0.5 + cozumAcigi * 0.35 + sureCeza * 0.15;
  } else {
    // Süre yok → terk %60, çözüm açığı %40
    skor = to * 0.6 + cozumAcigi * 0.4;
  }
  skor = Math.round(clamp(skor, 0, 100));

  const seviye: SurtunmeSeviye = skor >= 60 ? "yüksek" : skor >= 30 ? "orta" : "düşük";
  const yorum =
    seviye === "yüksek"
      ? "Yüksek sürtünme: meşru kullanıcıların önemli bir kısmı zorlanıyor veya vazgeçiyor. Zorluğu düşürmeyi ya da görünmez modu değerlendir."
      : seviye === "orta"
        ? "Orta sürtünme: koruma çalışıyor ama bir miktar kullanıcı kaybı var. Zorluk/eşik ince ayarı dönüşümü artırabilir."
        : "Düşük sürtünme: gerçek kullanıcılar akıcı geçiyor. UX sağlıklı; güvenlik yeterliyse mevcut ayarı koru.";

  return { skor, seviye, yorum };
}

/* ------------------------------------------------------------------ İnsan çözüm tahmini */

export interface InsanCozumTahmin {
  /** İnsan/iyi-bot sınıfında toplam olay. */
  insanOlay: number;
  /** Bunlardan challenge'a maruz kalan (challenged verdict'i alan) sayı. */
  challengeGoren: number;
  /** Challenge sonrası geçtiği tahmin edilen (allowed) sayı. */
  gecti: number;
  /** Tahmini insan çözüm oranı (geçti / challengeGoren, 0..100). */
  tahminiOran: number;
  /** Ortalama insanlık skoru (0..1) — güven göstergesi. */
  ortSkor: number;
}

/**
 * İnsan çözüm deneyimini BotEvent akışından tahmin eder.
 *
 * DÜRÜST YAKLAŞIM: Tek bir olay hem "challenged" hem "allowed" olamaz
 * (verdict tekildir), dolayısıyla "önce challenge gördü, sonra geçti"
 * ilişkisini olay-bazında birebir izleyemeyiz. Bunun yerine insan/iyi-bot
 * sınıfındaki olayları verdict'e göre toplarız:
 *   - allowed  → sürtünmesiz ya da challenge'ı çözüp geçti kabul edilir.
 *   - challenged → challenge gösterildi (henüz/başka olayda sonuçlanmış).
 *   - blocked/flagged → geçemedi.
 * Tahmini çözüm oranı = allowed / (allowed + challenged) — yani challenge'a
 * maruz kalan insanların ne oranda nihayetinde geçtiğinin YAKLAŞIĞIdır.
 * Bu bir üst-tahmindir; kesin çözüm süresi ölçülemez.
 */
export function insanCozumTahmin(events: BotEvent[]): InsanCozumTahmin {
  let insanOlay = 0;
  let allowed = 0;
  let challenged = 0;
  let skorTop = 0;
  for (const e of events) {
    if (e.botClass !== "human" && e.botClass !== "good_bot") continue;
    insanOlay++;
    skorTop += e.score;
    if (e.verdict === "allowed") allowed++;
    else if (e.verdict === "challenged") challenged++;
  }
  const challengeGoren = allowed + challenged;
  const tahminiOran = challengeGoren > 0 ? (allowed / challengeGoren) * 100 : 0;
  return {
    insanOlay,
    challengeGoren,
    gecti: allowed,
    tahminiOran: Math.round(tahminiOran * 10) / 10,
    ortSkor: insanOlay > 0 ? Math.round((skorTop / insanOlay) * 100) / 100 : 0,
  };
}

/* ------------------------------------------------------------------ Günlük trend */

export interface GunlukTrendNokta {
  gun: string; // YYYY-MM-DD
  gosterildi: number;
  cozuldu: number;
  /** O günün çözüm oranı (0..100). */
  cozumOran: number;
}

/**
 * Günlük çözüm-oranı serisi (grafik için). UsageCounter'lar gün bazında
 * toplanır (aynı güne düşen birden çok site birleştirilir) ve tarihe göre
 * artan sıralanır. Determinist: yalnızca girdideki `day` alanına bağlı.
 */
export function gunlukTrend(usage: UsageCounter[]): GunlukTrendNokta[] {
  const gunler = new Map<string, { gosterildi: number; cozuldu: number }>();
  for (const u of usage) {
    const g = gunler.get(u.day) ?? { gosterildi: 0, cozuldu: 0 };
    g.gosterildi += u.issued;
    g.cozuldu += u.verified;
    gunler.set(u.day, g);
  }
  return [...gunler.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([gun, v]) => ({
      gun,
      gosterildi: v.gosterildi,
      cozuldu: v.cozuldu,
      cozumOran: v.gosterildi > 0 ? Math.round((v.cozuldu / v.gosterildi) * 1000) / 10 : 0,
    }));
}

/* ------------------------------------------------------------------ Zorluk-bazlı sürtünme */

export interface ZorlukSurtunmeSatir {
  zorluk: Difficulty;
  /** İnsan-okur zorluk etiketi. */
  etiket: string;
  /** Bu zorlukta gösterilen kod uzunluğu (gerçek DIFFICULTY_LENGTH). */
  uzunluk: number;
  /** Modellenmiş beklenen insan çözüm oranı (0..100). */
  beklenenCozumOran: number;
  /** Modellenmiş ortalama çözüm süresi (saniye). */
  ortCozumSure: number;
  /** Bu zorluğun sürtünme skoru (surtunmeSkoru ile türetilmiş). */
  surtunmeSkor: number;
  /** Kısa değerlendirme. */
  not: string;
}

/**
 * Zorluk-bazlı temsili sürtünme tablosu.
 *
 * MODELLENMİŞTİR: Aşağıdaki beklenen çözüm oranı ve ortalama çözüm süresi
 * değerleri, gerçek kullanıcı ölçümü değil; ghost-font zorluğunun bilinen
 * etkisine dayanan TEMSİLİ insan-çözüm beklentileridir. Yalnızca `uzunluk`
 * gerçek koddan (difficultyLength) gelir:
 *     low = 4 hane (en kolay), medium = 5 hane, high = 7 hane (en zor).
 * Kod uzadıkça insanın doğru okuma olasılığı düşer, süre uzar → sürtünme ↑.
 * Değerler determinist sabittir; girdi almaz.
 */
export function zorlukSurtunme(): ZorlukSurtunmeSatir[] {
  // Zorluk başına modellenmiş insan-çözüm beklentileri (temsili).
  const model: Record<Difficulty, { etiket: string; beklenenCozumOran: number; ortCozumSure: number; not: string }> = {
    low: {
      etiket: "Düşük",
      beklenenCozumOran: 97,
      ortCozumSure: 4.5,
      not: "En akıcı. Mobil ve erişilebilirlik dostu; koruma yeterliyse ideal sweet-spot.",
    },
    medium: {
      etiket: "Orta",
      beklenenCozumOran: 91,
      ortCozumSure: 6.8,
      not: "Dengeli. Çoğu site için güvenlik/UX açısından önerilen varsayılan.",
    },
    high: {
      etiket: "Yüksek",
      beklenenCozumOran: 79,
      ortCozumSure: 10.5,
      not: "En güçlü koruma ama gözle görülür sürtünme. Yalnızca yüksek-risk akışlar için.",
    },
  };

  return (["low", "medium", "high"] as Difficulty[]).map((z) => {
    const m = model[z];
    // Zorluğa özgü sürtünme skoru: beklenen çözüm oranından terk yaklaşıklanır.
    const beklenenTerk = 100 - m.beklenenCozumOran;
    const s = surtunmeSkoru(m.beklenenCozumOran, beklenenTerk, m.ortCozumSure);
    return {
      zorluk: z,
      etiket: m.etiket,
      uzunluk: difficultyLength(z),
      beklenenCozumOran: m.beklenenCozumOran,
      ortCozumSure: m.ortCozumSure,
      surtunmeSkor: s.skor,
      not: m.not,
    };
  });
}

/* ------------------------------------------------------------------ Ortalama çözüm süresi (modellenmiş) */

/**
 * Gerçek "çözüm süresi" alanı olmadığından (BotEvent'te yalnızca `latency`
 * = ağ süresi var), insan olaylarından ortalama çözüm süresini deterministik
 * MODELLERİZ. Yaklaşım: insanlık skoru düştükçe (bulmaca zor okunmuş) süre
 * uzar. skor≈1 → ~4 sn, skor≈0 → ~14 sn. Bu bir tahmindir, ölçüm değil.
 */
export function modellenmisOrtSure(events: BotEvent[]): number {
  let n = 0;
  let top = 0;
  for (const e of events) {
    if (e.botClass !== "human" && e.botClass !== "good_bot") continue;
    if (e.verdict !== "allowed" && e.verdict !== "challenged") continue;
    n++;
    const s = clamp(e.score, 0, 1);
    top += 4 + (1 - s) * 10; // 4..14 sn
  }
  return n > 0 ? Math.round((top / n) * 10) / 10 : 0;
}

/* ------------------------------------------------------------------ Öneriler */

export interface Oneri {
  tip: "bilgi" | "uyari" | "kritik";
  baslik: string;
  metin: string;
}

/**
 * Sürtünme durumuna göre eyleme dönük öneriler üretir. UX ile güvenliği
 * dengeler: sürtünme yüksekse hafiflet, çözüm oranı aşırı yüksek ve koruma
 * zayıfsa sıkılaştır.
 */
export function oneriler(huni: CozumHunisi, surtunme: SurtunmeSonuc, insan: InsanCozumTahmin): Oneri[] {
  const list: Oneri[] = [];

  if (surtunme.seviye === "yüksek") {
    list.push({
      tip: "kritik",
      baslik: "Sürtünmeyi azalt",
      metin:
        "Sürtünme skoru yüksek. Adaptif Zorluk'tan zorluğu düşürmeyi veya görünmez modu açmayı değerlendir — gerçek kullanıcı kaybını azaltır.",
    });
  } else if (surtunme.seviye === "orta") {
    list.push({
      tip: "uyari",
      baslik: "İnce ayar fırsatı",
      metin:
        "Orta düzey sürtünme var. Zorluğu bir kademe düşürmek dönüşümü artırırken güvenliği çoğu senaryoda korur.",
    });
  }

  // Çözüm oranı çok yüksek + engelleme çok düşük → koruma gevşek olabilir.
  const engelOran = huni.gosterildi > 0 ? (huni.engellendi / huni.gosterildi) * 100 : 0;
  if (huni.cozumOran >= 97 && engelOran < 3 && huni.gosterildi > 0) {
    list.push({
      tip: "uyari",
      baslik: "Koruma sıkılaştırılabilir",
      metin:
        "Neredeyse her istek geçiyor ve engelleme oranı çok düşük. Çok az bot yakalanıyor olabilir; zorluğu veya davranış eşiğini artırmayı değerlendir.",
    });
  }

  if (huni.terkOran >= 15) {
    list.push({
      tip: "uyari",
      baslik: "Terk oranı yüksek",
      metin:
        "Gösterilen challenge'ların önemli kısmı çözülmeden kalıyor. Kullanıcıya daha net yönerge veya daha kolay bir challenge türü (ör. sayı/yön) sürtünmeyi azaltabilir.",
    });
  }

  if (insan.challengeGoren > 0 && insan.tahminiOran < 85) {
    list.push({
      tip: "uyari",
      baslik: "İnsan geçiş oranı düşük",
      metin:
        "Challenge gören meşru kullanıcıların tahmini geçiş oranı düşük. Zorluk seviyesi meşru trafiğe fazla ağır olabilir.",
    });
  }

  if (list.length === 0) {
    list.push({
      tip: "bilgi",
      baslik: "Denge sağlıklı",
      metin:
        "Çözüm oranı ve sürtünme dengeli görünüyor. Gerçek kullanıcılar akıcı geçerken koruma da çalışıyor. Mevcut yapılandırmayı koru.",
    });
  }

  return list;
}

/* ------------------------------------------------------------------ Yardımcı */

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return v < min ? min : v > max ? max : v;
}
