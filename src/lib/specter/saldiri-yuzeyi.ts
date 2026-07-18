/**
 * Specter — Saldırı Yüzeyi Analizi Motoru (saf, deterministik)
 * ============================================================
 * Gözlemlenen gerçek trafikten HANGİ yolların/endpoint'lerin en çok saldırıya
 * uğradığını ve her birinin ne kadar AÇIK (maruz) olduğunu puanlar. Amaç:
 * güvenlik ekibinin saldırı yüzeyini bir "endpoint maruziyet konsolu" gibi
 * görüp en yüksek değerli hedeflere (auth/admin/api/ödeme) daha sıkı kural
 * bağlamasını sağlamak.
 *
 * NEDEN DEĞERLİ?
 *   - Botlar rastgele gezmez; login, admin, /api ve ödeme uçlarını hedefler.
 *     Bunlar en yüksek değerli hedeflerdir (credential stuffing, kazıma,
 *     yetki-yükseltme). Yol bazında bot oranı + engelleme oranı + hacim +
 *     yolun "hassaslığı" birleşince gerçek maruziyet ortaya çıkar.
 *   - Yol normalizasyonu kritik: /api/users/1 ve /api/users/2 aynı endpoint'tir.
 *     Sayısal ID'ler :id ile toplanmazsa saldırı bir sürü tekil yola dağılır ve
 *     hiçbiri "yoğun saldırı altında" görünmez. Toplayınca gerçek sıcak-nokta
 *     belirginleşir.
 *
 * TASARIM İLKESİ — SAF & DETERMİNİSTİK:
 *   Bu dosyada `Date.now()`, argümansız `new Date()` ya da `Math.random()` YOK.
 *   Girdi (olaylar) aynıysa çıktı DAİMA aynıdır → birim test edilebilir. Tüm
 *   sıralamalar kararlı (eşitlikte ikincil anahtar) yapılır.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

export type YolKategori = "kimlik" | "yonetim" | "api" | "odeme" | "icerik";
export type MaruzetSeviye = "dusuk" | "orta" | "yuksek" | "kritik";

/** Tek bir (normalize edilmiş) yolun risk/maruziyet profili. */
export interface YolRisk {
  /** Normalize edilmiş yol, örn "/api/users/:id" (query yok, ID'ler :id). */
  yol: string;
  kategori: YolKategori;
  toplam: number; // toplam istek
  bot: number; // bot sınıfı olay sayısı
  engellenen: number; // blocked verdict sayısı
  botOran: number; // 0..1 — bot sınıfı olayların oranı
  ortSkor: number; // 0..1 — ortalama insanlık skoru (düşük = bot)
  benzersizIp: number; // tekil IP sayısı
  baskinBotClass: BotClass; // en sık görülen bot sınıfı
  baskinMethod: string; // en sık HTTP method
  ortLatency: number; // ortalama yanıt süresi (ms)
  /** Verdict kırılımı (allowed/blocked/challenged/flagged). */
  verdictKirilim: Record<Verdict, number>;
  /** En çok saldıran ülkeler (bot olayları) — azalan, ilk 5. */
  saldiriUlkeleri: { ulke: string; adet: number }[];
  maruzetSkoru: number; // 0..100 — açıklık/risk
  seviye: MaruzetSeviye;
}

/** Saldırı yüzeyi özeti (üst-seviye kartlar için). */
export interface YuzeyOzet {
  toplamYol: number;
  yuksekRiskYol: number; // seviye yuksek+kritik
  enCokSaldirilanYol: YolRisk | null;
  toplamBotIstek: number;
  kimlikYolSayisi: number;
}

/* ------------------------------------------------------------------ Sabitler */

/** Kategori tespiti için anahtar kelimeler (yol küçük-harfe çevrilir). */
const KIMLIK_KELIME = ["login", "signin", "sign-in", "auth", "oauth", "register", "signup", "sign-up", "password", "sifre", "parola", "token", "session", "otp", "2fa", "mfa", "logout"];
const YONETIM_KELIME = ["admin", "dashboard", "panel", "internal", "manage", "console", "wp-admin", "sudo", "root", "backoffice"];
const ODEME_KELIME = ["checkout", "pay", "payment", "odeme", "cart", "sepet", "billing", "invoice", "fatura", "subscribe", "subscription", "order", "siparis"];

/**
 * Maruziyet puanına "hassaslık" katkısı: yol ne kadar değerli hedefse o kadar
 * yüksek. Botlar bu uçları orantısız hedefler; korumasız kalmaları en büyük
 * risktir. (0..1 aralığı; puanlamada ağırlıklandırılır.)
 */
const KATEGORI_HASSASLIK: Record<YolKategori, number> = {
  kimlik: 1.0, // login/auth — credential stuffing hedefi (en yüksek)
  yonetim: 0.95, // admin/dashboard — yetki-yükseltme hedefi
  odeme: 0.85, // checkout/cart — dolandırıcılık/kart-deneme hedefi
  api: 0.7, // /api — kazıma/otomasyon hedefi
  icerik: 0.3, // genel içerik — düşük değer
};

/* ------------------------------------------------------------------ Yardımcılar */

/** 0..1'e sıkıştır (savunmacı; NaN → 0). */
function kis01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 0..100'e sıkıştır ve yuvarla. */
function puan100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const c = v < 0 ? 0 : v > 100 ? 100 : v;
  return Math.round(c);
}

/** Bir olayın botClass'ı "human" değilse bot sayılır. */
function botMu(botClass: BotClass): boolean {
  return botClass !== "human";
}

/** 0..100 maruziyet puanını seviyeye çevirir. */
export function maruzetSeviye(puan: number): MaruzetSeviye {
  if (puan >= 75) return "kritik";
  if (puan >= 50) return "yuksek";
  if (puan >= 25) return "orta";
  return "dusuk";
}

/** Maruziyet seviyesi için tutarlı renk (grafikler + rozetler ile uyumlu). */
export function maruzetRenk(seviye: MaruzetSeviye): string {
  switch (seviye) {
    case "kritik":
      return "#dc2626"; // kırmızı
    case "yuksek":
      return "#ea580c"; // turuncu
    case "orta":
      return "#d97706"; // amber
    default:
      return "#16a34a"; // yeşil
  }
}

/**
 * Bir yolu kategoriye ayır. Sıra önemli: en yüksek değerli (kimlik) önce
 * kontrol edilir ki /admin/login → "kimlik" değil, önce anlamlı eşleşme
 * kazansın. Aslında kimlik > yonetim > odeme > api sırası maruziyet önceliğini
 * de yansıtır.
 */
export function yolKategori(path: string): YolKategori {
  const p = (path ?? "").toLowerCase();
  if (KIMLIK_KELIME.some((k) => p.includes(k))) return "kimlik";
  if (YONETIM_KELIME.some((k) => p.includes(k))) return "yonetim";
  if (ODEME_KELIME.some((k) => p.includes(k))) return "odeme";
  // /api yol segmenti (başta veya bir bölüm olarak) → api.
  if (/(^|\/)api(\/|$)/.test(p)) return "api";
  return "icerik";
}

/**
 * Bir yolu gruplama için normalize et:
 *   1) query string ("?...") ve fragment ("#...") atılır,
 *   2) sonundaki "/" (kök hariç) kırpılır,
 *   3) sayısal ID segmentleri (/user/123) → :id ile toplanır,
 *   4) UUID / uzun hex / uzun base-token benzeri segmentler de :id olur,
 *   5) boşsa "/" döner.
 * Böylece /api/users/1 ve /api/users/2 → "/api/users/:id" birleşir; saldırı
 * tek bir sıcak-noktada toplanır.
 */
export function yolNormalize(path: string): string {
  let p = (path ?? "").trim();
  if (!p) return "/";
  // query + fragment at
  const soru = p.indexOf("?");
  if (soru >= 0) p = p.slice(0, soru);
  const kare = p.indexOf("#");
  if (kare >= 0) p = p.slice(0, kare);
  if (!p) return "/";
  // baştaki "/" garanti
  if (!p.startsWith("/")) p = "/" + p;
  // segmentlere ayır ve her segmenti değerlendir
  const segmentler = p.split("/").filter((s) => s.length > 0);
  const normalize = segmentler.map((seg) => {
    // salt sayısal → :id
    if (/^\d+$/.test(seg)) return ":id";
    // UUID (8-4-4-4-12) → :id
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ":id";
    // uzun saf-hex (>=16, ör. token/hash) → :id
    if (/^[0-9a-f]{16,}$/i.test(seg)) return ":id";
    // rakam içeren uzun karışık token (>=12 ve içinde rakam varsa, ör. slug-123abc)
    if (seg.length >= 12 && /\d/.test(seg) && /^[a-z0-9._-]+$/i.test(seg)) return ":id";
    return seg.toLowerCase();
  });
  const sonuc = "/" + normalize.join("/");
  return sonuc === "/" ? "/" : sonuc;
}

/**
 * Bir olay grubundan baskın (en sık) botClass'ı bulur. Kararlı: eşit sayıda
 * ise alfabetik olarak ilk gelen seçilir (deterministik). Grup boşsa "human".
 */
function baskinBotClass(events: BotEvent[]): BotClass {
  const sayac = new Map<BotClass, number>();
  for (const e of events) sayac.set(e.botClass, (sayac.get(e.botClass) ?? 0) + 1);
  let enIyi: BotClass = "human";
  let enCok = -1;
  for (const [k, v] of [...sayac.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (v > enCok) {
      enCok = v;
      enIyi = k;
    }
  }
  return enIyi;
}

/** En sık HTTP method (kararlı: eşitlikte alfabetik ilk). Boşsa "GET". */
function baskinMethod(events: BotEvent[]): string {
  const sayac = new Map<string, number>();
  for (const e of events) {
    const m = (e.method || "GET").toUpperCase();
    sayac.set(m, (sayac.get(m) ?? 0) + 1);
  }
  let enIyi = "GET";
  let enCok = -1;
  for (const [k, v] of [...sayac.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (v > enCok) {
      enCok = v;
      enIyi = k;
    }
  }
  return enIyi;
}

/* ------------------------------------------------------------------ Ana analiz */

/**
 * Olayları normalize edilmiş yola göre grupla ve her yol için risk/maruziyet
 * profili üret. Maruziyet skoru şu bileşenlerden türetilir (0..100):
 *   - bot oranı (0..1)         → ağırlık 0.34
 *   - engelleme oranı (0..1)   → ağırlık 0.20  (aktif saldırı sinyali)
 *   - hacim (log-ölçekli 0..1) → ağırlık 0.16  (görünürlük/maruziyet yüzeyi)
 *   - kategori hassaslığı(0..1)→ ağırlık 0.30  (yolun değerli-hedef oluşu)
 * Kararlı sıralama: maruzetSkoru ↓, sonra toplam ↓, sonra yol alfabetik.
 */
export function yolAnaliz(events: BotEvent[]): YolRisk[] {
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

  // Hacim normalizasyonu için en yüksek toplam (log ölçek referansı).
  let maxToplam = 1;
  for (const arr of gruplar.values()) if (arr.length > maxToplam) maxToplam = arr.length;
  const logMax = Math.log10(maxToplam + 1) || 1;

  const sonuc: YolRisk[] = [];
  for (const [yol, grup] of gruplar.entries()) {
    const toplam = grup.length;
    const kategori = yolKategori(yol);

    let bot = 0;
    let engellenen = 0;
    let skorTop = 0;
    let latencyTop = 0;
    const ipSet = new Set<string>();
    const verdictKirilim: Record<Verdict, number> = { allowed: 0, blocked: 0, challenged: 0, flagged: 0 };
    const ulkeSayac = new Map<string, number>();

    for (const e of grup) {
      if (botMu(e.botClass)) {
        bot++;
        // Saldırı ülkelerini yalnızca bot olaylarından say (gerçek saldırgan coğrafyası).
        const u = e.country || "??";
        ulkeSayac.set(u, (ulkeSayac.get(u) ?? 0) + 1);
      }
      if (e.verdict === "blocked") engellenen++;
      verdictKirilim[e.verdict] = (verdictKirilim[e.verdict] ?? 0) + 1;
      skorTop += kis01(e.score);
      latencyTop += Number.isFinite(e.latency) ? e.latency : 0;
      if (e.ip) ipSet.add(e.ip);
    }

    const botOran = toplam ? bot / toplam : 0;
    const engelOran = toplam ? engellenen / toplam : 0;
    const ortSkor = toplam ? skorTop / toplam : 0;
    const ortLatency = toplam ? Math.round(latencyTop / toplam) : 0;
    const hacimNorm = kis01(Math.log10(toplam + 1) / logMax);
    const hassaslik = KATEGORI_HASSASLIK[kategori];

    // Maruziyet: 0..1 ağırlıklı bileşim → 0..100.
    const ham =
      0.34 * kis01(botOran) +
      0.2 * kis01(engelOran) +
      0.16 * hacimNorm +
      0.3 * hassaslik;
    const maruzetSkoru = puan100(ham * 100);

    // En çok saldıran ülkeler (kararlı: adet ↓, sonra ülke alfabetik), ilk 5.
    const saldiriUlkeleri = [...ulkeSayac.entries()]
      .map(([ulke, adet]) => ({ ulke, adet }))
      .sort((a, b) => (b.adet - a.adet) || (a.ulke < b.ulke ? -1 : a.ulke > b.ulke ? 1 : 0))
      .slice(0, 5);

    sonuc.push({
      yol,
      kategori,
      toplam,
      bot,
      engellenen,
      botOran,
      ortSkor,
      benzersizIp: ipSet.size,
      baskinBotClass: baskinBotClass(grup),
      baskinMethod: baskinMethod(grup),
      ortLatency,
      verdictKirilim,
      saldiriUlkeleri,
      maruzetSkoru,
      seviye: maruzetSeviye(maruzetSkoru),
    });
  }

  // Maruziyet ↓, toplam ↓, yol alfabetik ↑ (kararlı sıralama).
  sonuc.sort(
    (a, b) =>
      b.maruzetSkoru - a.maruzetSkoru ||
      b.toplam - a.toplam ||
      (a.yol < b.yol ? -1 : a.yol > b.yol ? 1 : 0),
  );
  return sonuc;
}

/** Yol risk listesinden üst-seviye özet üretir (kartlar için). */
export function yuzeyOzet(yolRiskler: YolRisk[]): YuzeyOzet {
  let toplamBotIstek = 0;
  let yuksekRiskYol = 0;
  let kimlikYolSayisi = 0;
  let enCok: YolRisk | null = null;

  for (const y of yolRiskler) {
    toplamBotIstek += y.bot;
    if (y.seviye === "yuksek" || y.seviye === "kritik") yuksekRiskYol++;
    if (y.kategori === "kimlik") kimlikYolSayisi++;
    // "En çok saldırılan" = en yüksek bot istek sayısı (kararlı: sonra maruziyet).
    if (!enCok || y.bot > enCok.bot || (y.bot === enCok.bot && y.maruzetSkoru > enCok.maruzetSkoru)) {
      enCok = y;
    }
  }

  return {
    toplamYol: yolRiskler.length,
    yuksekRiskYol,
    enCokSaldirilanYol: enCok,
    toplamBotIstek,
    kimlikYolSayisi,
  };
}

/* ------------------------------------------------------------------ Kategori kırılımı */

export interface KategoriDagilim {
  kategori: YolKategori;
  yolSayisi: number;
  toplam: number; // toplam istek
  bot: number; // toplam bot istek
  botOran: number; // 0..1
}

/**
 * Kategori bazında istek + saldırı dağılımı (kimlik/yonetim/api/odeme/icerik).
 * Kırılım panelindeki küçük çubuklar / donut için. Kararlı sıra: hassaslık ↓.
 */
export function kategoriDagilim(yolRiskler: YolRisk[]): KategoriDagilim[] {
  const kategoriler: YolKategori[] = ["kimlik", "yonetim", "odeme", "api", "icerik"];
  const harita = new Map<YolKategori, KategoriDagilim>();
  for (const k of kategoriler) harita.set(k, { kategori: k, yolSayisi: 0, toplam: 0, bot: 0, botOran: 0 });

  for (const y of yolRiskler) {
    const d = harita.get(y.kategori)!;
    d.yolSayisi++;
    d.toplam += y.toplam;
    d.bot += y.bot;
  }
  for (const d of harita.values()) d.botOran = d.toplam ? d.bot / d.toplam : 0;

  // Hassaslık sırasıyla döndür (kimlik en üstte); boş kategoriler de kalsın
  // ki UI'da tüm kategoriler görünsün.
  return kategoriler.map((k) => harita.get(k)!);
}

/** Kategori için görsel renk (kırılım çubukları/donut). */
export function kategoriRenk(kategori: YolKategori): string {
  switch (kategori) {
    case "kimlik":
      return "#dc2626"; // kırmızı — en yüksek değer
    case "yonetim":
      return "#ea580c"; // turuncu
    case "odeme":
      return "#d97706"; // amber
    case "api":
      return "#2f6fed"; // mavi
    default:
      return "#6b7280"; // gri — içerik
  }
}

/** Kategori için lucide ikon adı (UI dinamik çözer). */
export function kategoriIkon(kategori: YolKategori): string {
  switch (kategori) {
    case "kimlik":
      return "KeyRound";
    case "yonetim":
      return "ShieldAlert";
    case "odeme":
      return "CreditCard";
    case "api":
      return "Code";
    default:
      return "FileText";
  }
}

/** Kategori için Türkçe insan-okur etiket. */
export function kategoriEtiket(kategori: YolKategori): string {
  switch (kategori) {
    case "kimlik":
      return "Kimlik";
    case "yonetim":
      return "Yönetim";
    case "odeme":
      return "Ödeme";
    case "api":
      return "API";
    default:
      return "İçerik";
  }
}

/* ==================================================================
 * SALDIRI YÜZEYİ KIRILIMI (Attack Surface Breakdown)
 * ==================================================================
 *
 * Yukarıdaki `yolAnaliz`/`yuzeyOzet` maruziyet-odaklı endpoint konsoludur.
 * Aşağıdaki `saldiriYuzeyi` motoru ise saldırı yüzeyini FARKLI EKSENLERDE
 * kırar: bot sınıfları, en çok hedeflenen yollar, HTTP yöntemleri, protokol
 * sürümleri ve TLS parmak izleri (ja3). Amaç, "saldırgan hangi kapılardan,
 * hangi araçlarla, hangi protokolle ve hangi imzayla giriyor" sorusunu tek
 * bir kırılım nesnesinde toplamak.
 *
 * NEDEN GERÇEK VERİ?
 *   Her sayı doğrudan events dizisinden gelir — uydurma, rastgele veya
 *   zaman-bağımlı değer yoktur. Bir path'in risk skoru gerçek bot sınıflı
 *   olay oranıdır; bir ja3'ün bot oranı o parmak izinin gerçek olaylarındaki
 *   bot yoğunluğudur. Böylece panel ölçülmüş saldırı yüzeyini gösterir.
 *
 * DETERMİNİZM
 *   `Date.now()` / `Math.random()` KULLANILMAZ. "Şu an" gerekirse çağıran
 *   parametre olarak geçirir; buradaki tüm zaman bilgisi events'in `ts`
 *   alanından gelir (enSonGoruldu). Aynı girdi → aynı çıktı.
 *
 * BOŞ GİRDİ
 *   Boş events dizisi çökmeyen güvenli boş yapı döndürür.
 */

/* --- Sabitler (kırılım motoru) --- */

/**
 * "Bot sınıfı" sayılan botClass değerleri. `human` ve `good_bot` meşru
 * kabul edilir; geri kalanı düşmanca/otomatik saldırı yüzeyidir.
 * (Not: yukarıdaki `botMu(botClass)` yardımcısı "human değilse bot" der ve
 * good_bot'u da bota sayar; bu kırılım motoru bilinçli olarak good_bot'u
 * meşru sayar — o yüzden ayrı bir yardımcı kullanılır.)
 */
const KIRILIM_BOT_SINIFLARI: ReadonlySet<BotClass> = new Set<BotClass>([
  "automation",
  "scraper",
  "credential_stuffing",
  "ai_agent",
  "ddos",
  "spam",
]);

/** Bir olayın "engellenen" sayılıp sayılmadığı (verdict). */
const KIRILIM_ENGELLENEN: ReadonlySet<Verdict> = new Set<Verdict>(["blocked", "flagged"]);

/** Bu kırılım için bir olayın bot sınıflı olup olmadığı. */
function kirilimBotMu(e: BotEvent): boolean {
  return KIRILIM_BOT_SINIFLARI.has(e.botClass);
}

/** Güvenli yüzde (payda 0 → 0). */
function kirilimYuzde(pay: number, payda: number): number {
  if (payda <= 0) return 0;
  return (pay / payda) * 100;
}

/** Güvenli oran 0..1 (payda 0 → 0). */
function kirilimOran(pay: number, payda: number): number {
  if (payda <= 0) return 0;
  return pay / payda;
}

/** Deterministik yuvarlama. */
function kirilimYuvarla(n: number, basamak = 2): number {
  const k = 10 ** basamak;
  return Math.round(n * k) / k;
}

/* --- Tipler (kırılım motoru) --- */

/** Bir bot sınıfının saldırı yüzeyi kırılımı. */
export interface BotSinifiKirilim {
  /** botClass değeri (ör. "scraper"). */
  sinif: BotClass;
  /** Bu sınıfa ait toplam olay sayısı. */
  olay: number;
  /** Bunlardan engellenen (blocked|flagged) olay sayısı. */
  engellenen: number;
  /** engellenen / olay (0..1). */
  oran: number;
  /** Bu sınıftan en son görülen olayın ts değeri (yoksa 0). */
  enSonGoruldu: number;
}

/** En çok hedeflenen bir path'in kırılımı. */
export interface YolYuzeyKirilim {
  /** İstek yolu (path). */
  path: string;
  /** Bu path'e düşen toplam olay sayısı. */
  olay: number;
  /** Bunlardan bot sınıflı olay sayısı. */
  botOlay: number;
  /** botOlay / olay * 100 — path'in risk skoru (0..100). */
  riskSkoru: number;
}

/** Bir HTTP method'unun dağılımı. */
export interface YontemKirilim {
  /** HTTP method (GET/POST/...); büyük harfe normalize edilir. */
  method: string;
  /** Bu method'a ait olay sayısı. */
  olay: number;
  /** olay / toplam olay * 100 (0..100). */
  oran: number;
}

/** Bir HTTP protokol sürümünün dağılımı. */
export interface ProtokolKirilim {
  /** Protokol sürümü (ör. "h2", "h3", "http/1.1", "bilinmiyor"). */
  surum: string;
  /** Bu sürüme ait olay sayısı. */
  olay: number;
  /** olay / toplam olay * 100 (0..100). */
  oran: number;
}

/** Bir JA3 TLS parmak izinin saldırı yoğunluğu. */
export interface TlsParmakiziKirilim {
  /** JA3 hash. */
  ja3: string;
  /** Bu parmak izine ait olay sayısı. */
  olay: number;
  /** Bu parmak izindeki bot sınıflı olay oranı (0..100). */
  botOran: number;
}

/** Saldırı yüzeyi kırılımı üst özeti. */
export interface SaldiriYuzeyiOzet {
  /** Farklı (benzersiz) path sayısı — yüzeyin genişliği. */
  toplamYuzey: number;
  /** Risk skoru en yüksek path (yoksa null). */
  enRiskliYol: YolYuzeyKirilim | null;
  /** En az bir bot sınıflı olay içeren path'lerin, tüm path'lere oranı (0..100). */
  botluYuzeyOran: number;
}

/** `saldiriYuzeyi` motorunun tam çıktısı. */
export interface SaldiriYuzeyi {
  /** Bot sınıfı kırılımları — olay sayısına göre azalan. */
  botSiniflari: BotSinifiKirilim[];
  /** En çok hedeflenen path'ler — olay sayısına göre azalan, top 8. */
  yollar: YolYuzeyKirilim[];
  /** HTTP method dağılımı — olay sayısına göre azalan. */
  yontemler: YontemKirilim[];
  /** Protokol (httpVersion) dağılımı — olay sayısına göre azalan. */
  protokoller: ProtokolKirilim[];
  /** En sık 5 JA3 parmak izi (ja3 tanımlı olaylar üzerinden) — olay sayısına göre azalan. */
  tlsParmakizi: TlsParmakiziKirilim[];
  /** Üst özet. */
  ozet: SaldiriYuzeyiOzet;
}

/* --- Boş yapı --- */

/** Boş, çökmeyen güvenli varsayılan çıktı. */
function bosSaldiriYuzeyi(): SaldiriYuzeyi {
  return {
    botSiniflari: [],
    yollar: [],
    yontemler: [],
    protokoller: [],
    tlsParmakizi: [],
    ozet: { toplamYuzey: 0, enRiskliYol: null, botluYuzeyOran: 0 },
  };
}

/* --- Ana motor --- */

/**
 * Ham bot olaylarından saldırı yüzeyi kırılımını hesaplar (Attack Surface
 * Breakdown). Bot sınıfları, hedeflenen yollar, HTTP yöntemleri, protokol
 * sürümleri ve TLS (ja3) parmak izleri eksenlerinde saf/deterministik kırılım.
 *
 * @param events Ham bot olayları (bir siteye ait, önceden filtrelenmiş olabilir).
 * @returns Deterministik `SaldiriYuzeyi` — boş girdi güvenli boş yapı döndürür.
 */
export function saldiriYuzeyi(events: BotEvent[]): SaldiriYuzeyi {
  if (!events || events.length === 0) {
    return bosSaldiriYuzeyi();
  }

  const toplam = events.length;

  const sinifMap = new Map<BotClass, { olay: number; engellenen: number; enSon: number }>();
  const yolMap = new Map<string, { path: string; olay: number; botOlay: number }>();
  const yontemMap = new Map<string, number>();
  const protokolMap = new Map<string, number>();
  const ja3Map = new Map<string, { ja3: string; olay: number; botOlay: number }>();

  for (const e of events) {
    const bot = kirilimBotMu(e);
    const engellenen = KIRILIM_ENGELLENEN.has(e.verdict);

    /* Bot sınıfları */
    {
      const cur = sinifMap.get(e.botClass) ?? { olay: 0, engellenen: 0, enSon: 0 };
      cur.olay += 1;
      if (engellenen) cur.engellenen += 1;
      if (e.ts > cur.enSon) cur.enSon = e.ts;
      sinifMap.set(e.botClass, cur);
    }

    /* Yollar */
    {
      const path = e.path ?? "";
      const cur = yolMap.get(path) ?? { path, olay: 0, botOlay: 0 };
      cur.olay += 1;
      if (bot) cur.botOlay += 1;
      yolMap.set(path, cur);
    }

    /* Yöntemler — büyük harfe normalize */
    {
      const method = (e.method ?? "").toUpperCase() || "BILINMIYOR";
      yontemMap.set(method, (yontemMap.get(method) ?? 0) + 1);
    }

    /* Protokoller — undefined → "bilinmiyor" */
    {
      const surum = e.httpVersion ?? "bilinmiyor";
      protokolMap.set(surum, (protokolMap.get(surum) ?? 0) + 1);
    }

    /* TLS parmak izi — sadece ja3 tanımlı olaylar */
    if (e.ja3 !== undefined && e.ja3 !== null && e.ja3 !== "") {
      const cur = ja3Map.get(e.ja3) ?? { ja3: e.ja3, olay: 0, botOlay: 0 };
      cur.olay += 1;
      if (bot) cur.botOlay += 1;
      ja3Map.set(e.ja3, cur);
    }
  }

  /* botSiniflari: olaya göre azalan (eşitlikte sinif adı ile deterministik) */
  const botSiniflari: BotSinifiKirilim[] = Array.from(sinifMap.entries())
    .map(([sinif, v]) => ({
      sinif,
      olay: v.olay,
      engellenen: v.engellenen,
      oran: kirilimYuvarla(kirilimOran(v.engellenen, v.olay), 4),
      enSonGoruldu: v.enSon,
    }))
    .sort((a, b) => b.olay - a.olay || a.sinif.localeCompare(b.sinif));

  /* yollar: olaya göre azalan, top 8 */
  const yollar: YolYuzeyKirilim[] = Array.from(yolMap.values())
    .map((v) => ({
      path: v.path,
      olay: v.olay,
      botOlay: v.botOlay,
      riskSkoru: kirilimYuvarla(kirilimYuzde(v.botOlay, v.olay), 2),
    }))
    .sort((a, b) => b.olay - a.olay || a.path.localeCompare(b.path))
    .slice(0, 8);

  /* yontemler: olaya göre azalan */
  const yontemler: YontemKirilim[] = Array.from(yontemMap.entries())
    .map(([method, olay]) => ({ method, olay, oran: kirilimYuvarla(kirilimYuzde(olay, toplam), 2) }))
    .sort((a, b) => b.olay - a.olay || a.method.localeCompare(b.method));

  /* protokoller: olaya göre azalan */
  const protokoller: ProtokolKirilim[] = Array.from(protokolMap.entries())
    .map(([surum, olay]) => ({ surum, olay, oran: kirilimYuvarla(kirilimYuzde(olay, toplam), 2) }))
    .sort((a, b) => b.olay - a.olay || a.surum.localeCompare(b.surum));

  /* tlsParmakizi: en sık 5 ja3 */
  const tlsParmakizi: TlsParmakiziKirilim[] = Array.from(ja3Map.values())
    .map((v) => ({ ja3: v.ja3, olay: v.olay, botOran: kirilimYuvarla(kirilimYuzde(v.botOlay, v.olay), 2) }))
    .sort((a, b) => b.olay - a.olay || a.ja3.localeCompare(b.ja3))
    .slice(0, 5);

  /* ozet */
  const toplamYuzey = yolMap.size;

  // enRiskliYol: TÜM path'ler üzerinden en yüksek riskSkoru (top-8 ile sınırlı değil).
  // Eşitlikte daha çok olaya sahip olan, sonra path adı ile deterministik.
  let enRiskliYol: YolYuzeyKirilim | null = null;
  for (const v of yolMap.values()) {
    const aday: YolYuzeyKirilim = {
      path: v.path,
      olay: v.olay,
      botOlay: v.botOlay,
      riskSkoru: kirilimYuvarla(kirilimYuzde(v.botOlay, v.olay), 2),
    };
    if (
      enRiskliYol === null ||
      aday.riskSkoru > enRiskliYol.riskSkoru ||
      (aday.riskSkoru === enRiskliYol.riskSkoru && aday.olay > enRiskliYol.olay) ||
      (aday.riskSkoru === enRiskliYol.riskSkoru &&
        aday.olay === enRiskliYol.olay &&
        aday.path.localeCompare(enRiskliYol.path) < 0)
    ) {
      enRiskliYol = aday;
    }
  }

  // botluYuzeyOran: en az bir bot sınıflı olay içeren path'lerin oranı.
  let botluPath = 0;
  for (const v of yolMap.values()) {
    if (v.botOlay > 0) botluPath += 1;
  }
  const botluYuzeyOran = kirilimYuvarla(kirilimYuzde(botluPath, toplamYuzey), 2);

  return {
    botSiniflari,
    yollar,
    yontemler,
    protokoller,
    tlsParmakizi,
    ozet: { toplamYuzey, enRiskliYol, botluYuzeyOran },
  };
}
