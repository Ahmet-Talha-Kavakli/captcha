/**
 * Specter — Koruma Kapsamı & Maruz-Kalma Haritası (saf, deterministik)
 * ===================================================================
 * Bu YEREL yardımcı, gözlemlenen gerçek trafikten HANGİ yolların Specter widget'ı
 * tarafından fiilen KORUNDUĞUNU, hangilerinin AÇIK (botların hiç challenge görmeden
 * geçebildiği) olduğunu çıkarır. Yani bir "kapsam boşluğu haritası".
 *
 * NEDEN AYRI BİR BAKIŞ (saldiri-yuzeyi'nden farkı):
 *   - /panel/saldiri-yuzeyi bir yolun NE KADAR SALDIRIYA UĞRADIĞINI (risk sırası)
 *     ölçer. Burası ise o yola gelen bot trafiğinin NE KADARININ FİİLEN KORUMAYA
 *     TAKILDIĞINI (challenged/blocked) ölçer. Bir yol hem çok saldırı alıp HEM DE
 *     korumasız (botların çoğu "allowed") olabilir = kritik maruziyet deliği.
 *   - Bir bot-koruma ürünü ancak kapsamı kadar güçlüdür: korumasız bir /api/login,
 *     tüm ürünün sızdırdığı bir deliktir. Bu modül o delikleri bulur.
 *
 * ÇEKİRDEK SEZGİ:
 *   Bir yola botlar geliyor ama verdict'lerin çoğu "allowed" ise → o yolda widget
 *   fiilen devrede değil (ya entegre edilmemiş ya kural yok ya monitor modu). Bu
 *   bir KAPSAM DELİĞİDİR. Hassas bir yolsa (login/auth/api/checkout/admin…) KRİTİK.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   Girdi (olaylar) aynıysa çıktı DAİMA aynıdır → birim test edilebilir. Tüm
 *   sıralamalar kararlı (eşitlikte ikincil anahtar) yapılır.
 *
 * DÜRÜSTLÜK NOTU:
 *   Kapsam, gerçek trafikte gözlemlenen verdict'lerden ÇIKARILIR. Henüz hiç bot
 *   trafiği görmemiş bir yol "güvenli" değildir; sadece "henüz test edilmedi"dir.
 *   Bunu ayrı bir durumla (`test_edilmedi`) işaretleriz — yanlış güven vermemek için.
 */

import type { BotEvent, BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Bir yolun koruma kapsamı durumu. */
export type KapsamDurum =
  | "korunuyor" // bot trafiğinin büyük çoğunluğu challenge/block'a takılıyor
  | "kismi" // kısmen korunuyor; kayda değer bir bot payı yine de geçiyor
  | "acik" // botlar çoğunlukla korumasız geçiyor (maruziyet deliği)
  | "test_edilmedi"; // bu yolda henüz bot trafiği yok → kapsam bilinmiyor

/** Tek bir (normalize edilmiş) yolun koruma kapsamı profili. */
export interface YolKapsam {
  /** Normalize edilmiş yol, örn "/api/users/:id" (query yok, ID'ler :id). */
  yol: string;
  toplamIstek: number; // yola gelen toplam istek
  botIstek: number; // bot sınıfı olay sayısı (human/good_bot hariç)
  meydanOkunan: number; // verdict === "challenged"
  engellenen: number; // verdict === "blocked"
  izinVerilen: number; // verdict === "allowed" (TÜM trafik)
  /** Bot trafiği içinde "allowed" olanlar — korumasız geçen botlar (delik hacmi). */
  korumasizBot: number;
  /**
   * Koruma oranı = (challenged + blocked) / botIstek. Yani bota gelen isteğin
   * ne kadarı fiilen korumaya (challenge/block) takıldı. 0..1. botIstek 0 ise 0.
   */
  korumaOrani: number;
  /** Yol trafiğinin ne kadarı bot (0..1) — yoğunluk göstergesi. */
  botYogunlugu: number;
  durum: KapsamDurum;
  /** Bu yol yüksek-değerli/hassas mı (login/auth/api/checkout/password/admin/register). */
  hassas: boolean;
  /** Açık + hassas = kritik delik (yanlış-negatifin en pahalıya patladığı yer). */
  kritik: boolean;
  /** Bu yolda görülen örnek bot sınıfları (kararlı sıra: adet ↓, sonra ad). */
  ornekBotClasslar: { botClass: BotClass; adet: number }[];
}

/** Kapsam üst-seviye özeti (kartlar için). */
export interface KapsamOzet {
  toplamYol: number;
  korunanYol: number; // durum === "korunuyor"
  acikYol: number; // durum === "acik"
  kismiYol: number; // durum === "kismi"
  testEdilmeyenYol: number; // durum === "test_edilmedi"
  /**
   * Genel kapsam oranı: TÜM bot trafiği içinde challenge/block'a takılanların
   * payı (bot hacmiyle ağırlıklı). 0..1. Toplam bot 0 ise 0.
   */
  genelKapsamOrani: number;
  /** En büyük açık: en çok korumasız bot trafiği sızdıran yol (varsa). */
  enBuyukAcik: YolKapsam | null;
  /** Tüm yollarda "allowed" geçen toplam bot isteği (kümülatif delik hacmi). */
  korumasizBotIstek: number;
  /** Açık + hassas yol sayısı (kritik delik sayısı). */
  kritikAcikYol: number;
}

/* ------------------------------------------------------------------ Sabitler */

/**
 * Hassas (yüksek-değerli) yol tespiti için anahtar kelimeler. Bir yolda bunlardan
 * biri geçerse, korumasız kalması KRİTİK sayılır (credential stuffing, yetki
 * yükseltme, dolandırıcılık, kazıma hedefleri).
 */
const HASSAS_KELIME = [
  "login",
  "signin",
  "sign-in",
  "auth",
  "oauth",
  "register",
  "signup",
  "sign-up",
  "password",
  "sifre",
  "parola",
  "checkout",
  "odeme",
  "payment",
  "pay",
  "admin",
  "api",
];

/**
 * Kapsam eşikleri: bot trafiğinin ne kadarı korumaya takılırsa hangi durum.
 *   korumaOrani >= 0.75 → korunuyor
 *   korumaOrani >= 0.35 → kismi
 *   korumaOrani <  0.35 → acik   (botların çoğu korumasız geçiyor)
 */
const KORUNUYOR_ESIK = 0.75;
const KISMI_ESIK = 0.35;

/* ------------------------------------------------------------------ Yardımcılar */

/** 0..1'e sıkıştır (savunmacı; NaN → 0). */
function kis01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Bir olay bot mu? Kapsam açısından "koruma altında olması beklenen" trafik
 * botlardır. human = gerçek kullanıcı, good_bot = Googlebot/Bingbot gibi meşru
 * botlar (bunları challenge etmek istemeyiz) → ikisi de "korunması gereken bot"
 * sayılmaz. Kalan tüm sınıflar (otomasyon/kazıyıcı/kimlik-denemesi/ai/ddos/spam)
 * korumanın yakalaması beklenen bot trafiğidir.
 */
function korunmasiBeklenenBot(botClass: BotClass): boolean {
  return botClass !== "human" && botClass !== "good_bot";
}

/** Bir yol hassas (yüksek-değerli) mı? Küçük harfe çevirip anahtar kelime arar. */
export function hassasYolMu(path: string): boolean {
  const p = (path ?? "").toLowerCase();
  return HASSAS_KELIME.some((k) => p.includes(k));
}

/**
 * Bir yolu gruplama için normalize et (saldiri-yuzeyi'ndeki mantıkla aynı ilke,
 * ama bu dosya bağımsız/saf kalsın diye burada yerel tutulur):
 *   1) query ("?...") ve fragment ("#...") atılır,
 *   2) baştaki "/" garanti,
 *   3) salt sayısal / UUID / uzun hex / rakam-içeren uzun token segmentleri :id olur,
 *   4) boşsa "/" döner.
 * Böylece /api/users/1 ve /api/users/2 → "/api/users/:id" birleşir; kapsam tek
 * endpoint bazında değerlendirilir.
 */
export function yolNormalize(path: string): string {
  let p = (path ?? "").trim();
  if (!p) return "/";
  const soru = p.indexOf("?");
  if (soru >= 0) p = p.slice(0, soru);
  const kare = p.indexOf("#");
  if (kare >= 0) p = p.slice(0, kare);
  if (!p) return "/";
  if (!p.startsWith("/")) p = "/" + p;
  const segmentler = p.split("/").filter((s) => s.length > 0);
  const normalize = segmentler.map((seg) => {
    if (/^\d+$/.test(seg)) return ":id";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ":id";
    if (/^[0-9a-f]{16,}$/i.test(seg)) return ":id";
    if (seg.length >= 12 && /\d/.test(seg) && /^[a-z0-9._-]+$/i.test(seg)) return ":id";
    return seg.toLowerCase();
  });
  const sonuc = "/" + normalize.join("/");
  return sonuc === "/" ? "/" : sonuc;
}

/** Koruma oranı + bot varlığından kapsam durumunu belirle. */
export function kapsamDurumu(korumaOrani: number, botIstek: number): KapsamDurum {
  // Bu yola henüz bot gelmediyse kapsam BİLİNEMEZ → yanlış güven verme.
  if (botIstek <= 0) return "test_edilmedi";
  if (korumaOrani >= KORUNUYOR_ESIK) return "korunuyor";
  if (korumaOrani >= KISMI_ESIK) return "kismi";
  return "acik";
}

/** Kapsam durumu için tutarlı renk (rozet + çubuk + donut ile uyumlu). */
export function durumRenk(durum: KapsamDurum): string {
  switch (durum) {
    case "korunuyor":
      return "#16a34a"; // yeşil
    case "kismi":
      return "#d97706"; // amber
    case "acik":
      return "#dc2626"; // kırmızı — maruziyet deliği
    default:
      return "#94a3b8"; // gri — henüz test edilmedi
  }
}

/** Kapsam durumu için Türkçe insan-okur etiket. */
export function durumEtiket(durum: KapsamDurum): string {
  switch (durum) {
    case "korunuyor":
      return "Korunuyor";
    case "kismi":
      return "Kısmi";
    case "acik":
      return "Açık";
    default:
      return "Henüz test edilmedi";
  }
}

/* ------------------------------------------------------------------ Ana analiz */

/**
 * Olayları normalize edilmiş yola göre grupla ve her yol için koruma kapsamı
 * profili üret.
 *
 * Sıralama (kararlı) — en acil olan en üstte gelsin diye:
 *   1) kritik (açık + hassas) delikler önce,
 *   2) sonra "açık" durum,
 *   3) sonra korumasız bot hacmi ↓ (en çok sızdıran),
 *   4) sonra toplam istek ↓,
 *   5) sonra yol alfabetik.
 */
export function kapsamHaritasi(events: BotEvent[]): YolKapsam[] {
  const gruplar = new Map<string, BotEvent[]>();
  for (const e of events) {
    const yol = yolNormalize(e.path);
    let arr = gruplar.get(yol);
    if (!arr) {
      arr = [];
      gruplar.set(yol, arr);
    }
    arr.push(e);
  }

  const sonuc: YolKapsam[] = [];
  for (const [yol, grup] of gruplar.entries()) {
    const toplamIstek = grup.length;

    let botIstek = 0;
    let meydanOkunan = 0;
    let engellenen = 0;
    let izinVerilen = 0;
    let korumasizBot = 0;
    // Yalnızca bot olaylarının sınıf dağılımı (örnek bot sınıfları için).
    const botClassSayac = new Map<BotClass, number>();
    // Bot trafiği içinde koruma (challenged/blocked) sayacı.
    let botKorunan = 0;

    for (const e of grup) {
      const bot = korunmasiBeklenenBot(e.botClass);
      if (e.verdict === "challenged") meydanOkunan++;
      else if (e.verdict === "blocked") engellenen++;
      else if (e.verdict === "allowed") izinVerilen++;

      if (bot) {
        botIstek++;
        botClassSayac.set(e.botClass, (botClassSayac.get(e.botClass) ?? 0) + 1);
        if (e.verdict === "challenged" || e.verdict === "blocked") {
          botKorunan++;
        } else if (e.verdict === "allowed") {
          // Botun korumasız geçtiği an — asıl delik. "flagged" ne korumasız ne
          // tam koruma olduğundan (sadece işaretlendi) delik saymıyoruz.
          korumasizBot++;
        }
      }
    }

    const korumaOrani = botIstek ? kis01(botKorunan / botIstek) : 0;
    const botYogunlugu = toplamIstek ? kis01(botIstek / toplamIstek) : 0;
    const durum = kapsamDurumu(korumaOrani, botIstek);
    const hassas = hassasYolMu(yol);
    // Kritik = fiilen açık VE hassas bir yol. "test_edilmedi" hassas olsa bile
    // kritik saymıyoruz (delik gözlemlenmedi; ayrı bir "kör nokta" durumu).
    const kritik = durum === "acik" && hassas;

    const ornekBotClasslar = [...botClassSayac.entries()]
      .map(([botClass, adet]) => ({ botClass, adet }))
      .sort((a, b) => b.adet - a.adet || (a.botClass < b.botClass ? -1 : a.botClass > b.botClass ? 1 : 0))
      .slice(0, 4);

    sonuc.push({
      yol,
      toplamIstek,
      botIstek,
      meydanOkunan,
      engellenen,
      izinVerilen,
      korumasizBot,
      korumaOrani,
      botYogunlugu,
      durum,
      hassas,
      kritik,
      ornekBotClasslar,
    });
  }

  // En acil olan en üstte: kritik → açık → korumasız hacim ↓ → toplam ↓ → yol.
  const durumSira: Record<KapsamDurum, number> = { acik: 0, kismi: 1, korunuyor: 2, test_edilmedi: 3 };
  sonuc.sort(
    (a, b) =>
      Number(b.kritik) - Number(a.kritik) ||
      durumSira[a.durum] - durumSira[b.durum] ||
      b.korumasizBot - a.korumasizBot ||
      b.toplamIstek - a.toplamIstek ||
      (a.yol < b.yol ? -1 : a.yol > b.yol ? 1 : 0),
  );
  return sonuc;
}

/** Yol kapsam listesinden üst-seviye özet üretir (kartlar için). */
export function kapsamOzet(yollar: YolKapsam[]): KapsamOzet {
  let korunanYol = 0;
  let acikYol = 0;
  let kismiYol = 0;
  let testEdilmeyenYol = 0;
  let kritikAcikYol = 0;
  let toplamBot = 0;
  let toplamBotKorunan = 0;
  let korumasizBotIstek = 0;
  let enBuyukAcik: YolKapsam | null = null;

  for (const y of yollar) {
    if (y.durum === "korunuyor") korunanYol++;
    else if (y.durum === "acik") acikYol++;
    else if (y.durum === "kismi") kismiYol++;
    else testEdilmeyenYol++;

    if (y.kritik) kritikAcikYol++;

    toplamBot += y.botIstek;
    // Bot hacmiyle ağırlıklı genel kapsam için: bu yolda korumaya takılan bot
    // isteği sayısı (korumaOrani'ndan deterministik geri-hesap).
    toplamBotKorunan += botKorunanPay(y);
    korumasizBotIstek += y.korumasizBot;

    // En büyük açık = en çok korumasız bot trafiği sızdıran yol. Kararlı:
    // korumasizBot ↓, sonra yol alfabetik. Sadece fiilen sızdıran yollar aday.
    if (y.korumasizBot > 0) {
      if (
        !enBuyukAcik ||
        y.korumasizBot > enBuyukAcik.korumasizBot ||
        (y.korumasizBot === enBuyukAcik.korumasizBot && y.yol < enBuyukAcik.yol)
      ) {
        enBuyukAcik = y;
      }
    }
  }

  const genelKapsamOrani = toplamBot ? kis01(toplamBotKorunan / toplamBot) : 0;

  return {
    toplamYol: yollar.length,
    korunanYol,
    acikYol,
    kismiYol,
    testEdilmeyenYol,
    genelKapsamOrani,
    enBuyukAcik,
    korumasizBotIstek,
    kritikAcikYol,
  };
}

/**
 * Bir yolun korunan bot payını (challenged+blocked bot isteği) korumaOrani'ndan
 * geri hesaplar. korumaOrani = botKorunan / botIstek olduğundan botKorunan =
 * round(korumaOrani * botIstek). Deterministik; genel kapsam oranını bot
 * hacmiyle ağırlıklamak için kullanılır.
 */
function botKorunanPay(y: YolKapsam): number {
  return Math.round(y.korumaOrani * y.botIstek);
}
