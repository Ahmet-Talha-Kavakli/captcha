/**
 * Specter — Coğrafi & ASN İstihbaratı (Geo & ASN Intel)
 * =====================================================
 *
 * NE YAPAR
 * --------
 * Bu saf/deterministik motor, canlı bot olay akışını (`BotEvent[]`) alır ve
 * trafiğin *nereden* geldiğine dair istihbarat çıkarır: hangi ülkeler, hangi
 * ağlar (ASN), ve bunların ne kadarı bot. Üç eksende özet üretir:
 *
 *   1. Ülke istihbaratı  — her ülke için olay/bot/engellenen sayısı, bot oranı
 *      ve türetilen tehdit seviyesi (dusuk/orta/yuksek).
 *   2. ASN istihbaratı    — her otonom sistem (ağ sağlayıcı) için trafik ve bot
 *      yoğunluğu; en riskli ağlar (bot oranı × hacim) öne alınır.
 *   3. Datacenter sinyali — trafiğin ne kadarı bulut/datacenter ASN'lerinden
 *      geliyor. Datacenter kaynaklı istek güçlü bir bot işaretidir (gerçek
 *      insanlar residential/mobil ağlardan gelir; sunuculardan değil).
 *
 * NEDEN GERÇEK VERİ
 * -----------------
 * Hiçbir değer uydurulmaz veya rastgele üretilmez. Tüm sayımlar doğrudan
 * gerçek olayların `country`, `asn`, `botClass` ve `verdict` alanlarından
 * türetilir. Böylece panelde gösterilen "en tehditkâr ülke" ya da "datacenter
 * oranı" gibi metrikler platformun gerçekten gözlemlediği trafiği yansıtır —
 * dekoratif/placeholder değildir. Deterministiktir: aynı girdi → aynı çıktı.
 * `Date.now()` / `Math.random()` KULLANILMAZ; zaman gerekirse dışarıdan
 * `simdi` parametresi olarak alınır (bu motorda zaman kıyası gerekmez).
 *
 * BAĞIMSIZLIK
 * -----------
 * Dış bağımlılık yoktur; yalnızca şema tipleri import edilir. Boş olay
 * dizisinde çökmez, güvenli/nötr bir varsayılan döndürür.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sabitler */

/**
 * ASN dizesinde geçtiğinde ilgili ağın bir datacenter / bulut sağlayıcı
 * olduğunu güçlü biçimde işaret eden isim parçaları. Datacenter kaynaklı
 * trafik meşru son-kullanıcı trafiği değildir → bot işareti.
 */
const DATACENTER_SAGLAYICILAR = [
  "Amazon",
  "Google",
  "DigitalOcean",
  "OVH",
  "Hetzner",
  "Microsoft",
  "Linode",
  "M247",
] as const;

/** Bir olayın "bot" (meşru olmayan) sayılıp sayılmayacağını belirleyen sınıflar.
 * human ve good_bot dışındaki her şey tehdit trafiği olarak değerlendirilir. */
const BOT_SINIFLAR: ReadonlySet<BotClass> = new Set<BotClass>([
  "automation",
  "scraper",
  "credential_stuffing",
  "ai_agent",
  "ddos",
  "spam",
]);

/** Engellenmiş sayılan verdict değerleri. */
const ENGELLENEN_VERDICTLER: ReadonlySet<Verdict> = new Set<Verdict>(["blocked"]);

/** Tehdit seviyesi eşikleri (bot oranına göre). */
const ESIK_ORTA = 0.3; // botOran < 0.3 → dusuk
const ESIK_YUKSEK = 0.6; // botOran < 0.6 → orta, üzeri → yuksek

/* ------------------------------------------------------------------ Tipler */

/** Bir ülke için türetilmiş tehdit seviyesi. */
export type TehditSeviyesi = "dusuk" | "orta" | "yuksek";

/** Tek bir ülkenin coğrafi istihbarat özeti. */
export interface UlkeIstihbarat {
  /** ISO2 ülke kodu (ör. "TR", "US"). */
  kod: string;
  /** Bu ülkeden gelen toplam olay sayısı. */
  olay: number;
  /** Bunlardan bot (meşru olmayan) olanların sayısı. */
  bot: number;
  /** Engellenen (blocked) olay sayısı. */
  engellenen: number;
  /** Bot oranı (bot / olay), 0..1. */
  botOran: number;
  /** Bot oranından türetilen tehdit seviyesi. */
  tehditSeviyesi: TehditSeviyesi;
}

/** Tek bir ASN'nin (otonom sistem / ağ sağlayıcı) istihbarat özeti. */
export interface AsnIstihbarat {
  /** Ham ASN dizesi (ör. "AS15169 Google LLC"). */
  asn: string;
  /** Bu ağdan gelen toplam olay sayısı. */
  olay: number;
  /** Bunlardan bot olanların sayısı. */
  bot: number;
  /** Bot oranı (bot / olay), 0..1. */
  botOran: number;
  /** ASN dizesinden ayrıştırılan sağlayıcı adı (numara sonrası kısım). */
  saglayici: string;
}

/** Motorun ürettiği üst düzey özet. */
export interface CografyaOzet {
  /** Gözlemlenen benzersiz ülke sayısı. */
  ulkeSayisi: number;
  /** Gözlemlenen benzersiz ASN sayısı. */
  asnSayisi: number;
  /** En tehditkâr ülke kodu (botOran × olay skoru en yüksek); yoksa null. */
  enTehditkarUlke: string | null;
  /** Tüm trafik içinde datacenter ASN kaynaklı olayların oranı (0..1). */
  datacenterOran: number;
}

/** Coğrafi & ASN İstihbaratı motorunun tam çıktısı. */
export interface CografyaIstihbarat {
  /** Olay sayısına göre en yoğun ilk 10 ülke. */
  ulkeler: UlkeIstihbarat[];
  /** Risk skoruna (botOran × olay) göre en riskli ilk 8 ASN. */
  asnler: AsnIstihbarat[];
  /** Tehdit seviyesi "yuksek" olan ülkeler (ulkeler alt kümesi). */
  riskliBolgeler: UlkeIstihbarat[];
  /** Datacenter kaynaklı trafik oranı (0..1) — bot işareti. */
  datacenterOran: number;
  /** Üst düzey özet metrikleri. */
  ozet: CografyaOzet;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Bir olayın bot (meşru olmayan) sayılıp sayılmayacağını döndürür. */
function botMu(event: BotEvent): boolean {
  return BOT_SINIFLAR.has(event.botClass);
}

/** Bir olayın engellenmiş sayılıp sayılmayacağını döndürür. */
function engellendiMi(event: BotEvent): boolean {
  return ENGELLENEN_VERDICTLER.has(event.verdict);
}

/**
 * ASN dizesinden sağlayıcı adını ayrıştırır: baştaki "AS<numara>" jetonunu
 * atar, kalan kısmı sağlayıcı adı olarak döndürür.
 *   "AS15169 Google LLC" → "Google LLC"
 *   "AS14061"            → "AS14061" (isim yoksa ham dizeye düş)
 */
function saglayiciAdi(asn: string): string {
  const ham = (asn ?? "").trim();
  if (ham.length === 0) return "Bilinmeyen";
  // Baştaki AS<rakamlar> jetonunu (ve ardından gelen boşluğu) sök.
  const eslesme = ham.match(/^AS\d+\s+(.+)$/i);
  if (eslesme && eslesme[1].trim().length > 0) {
    return eslesme[1].trim();
  }
  return ham;
}

/** ASN dizesinin datacenter/bulut sağlayıcıya ait olup olmadığını tahmin eder. */
function datacenterMi(asn: string): boolean {
  const ham = asn ?? "";
  return DATACENTER_SAGLAYICILAR.some((isim) =>
    ham.toLowerCase().includes(isim.toLowerCase()),
  );
}

/** Bot oranından tehdit seviyesi türetir. */
function tehditSeviyesiHesapla(botOran: number): TehditSeviyesi {
  if (botOran < ESIK_ORTA) return "dusuk";
  if (botOran < ESIK_YUKSEK) return "orta";
  return "yuksek";
}

/** Güvenli oran: payda 0 ise 0 döndürür. */
function oran(pay: number, payda: number): number {
  return payda > 0 ? pay / payda : 0;
}

/* ------------------------------------------------------------------ Boş varsayılan */

/** Boş/güvenli istihbarat sonucu (olay yokken ya da erken çıkışta). */
function bosSonuc(): CografyaIstihbarat {
  return {
    ulkeler: [],
    asnler: [],
    riskliBolgeler: [],
    datacenterOran: 0,
    ozet: {
      ulkeSayisi: 0,
      asnSayisi: 0,
      enTehditkarUlke: null,
      datacenterOran: 0,
    },
  };
}

/* ------------------------------------------------------------------ Ana motor */

/**
 * Coğrafi & ASN İstihbaratı üretir.
 *
 * @param events Gerçek bot olay akışı. Boş dizide güvenli varsayılan döner.
 * @returns Ülke/ASN dağılımı, riskli bölgeler, datacenter oranı ve özet.
 */
export function cografyaIstihbarat(events: BotEvent[]): CografyaIstihbarat {
  if (!Array.isArray(events) || events.length === 0) {
    return bosSonuc();
  }

  /* --- Toplama: ülke başına sayaçlar --- */
  interface UlkeSayac {
    kod: string;
    olay: number;
    bot: number;
    engellenen: number;
  }
  const ulkeMap = new Map<string, UlkeSayac>();

  /* --- Toplama: ASN başına sayaçlar --- */
  interface AsnSayac {
    asn: string;
    olay: number;
    bot: number;
  }
  const asnMap = new Map<string, AsnSayac>();

  let toplamOlay = 0;
  let datacenterOlay = 0;

  for (const event of events) {
    if (!event) continue;
    toplamOlay += 1;

    const bot = botMu(event);
    const engel = engellendiMi(event);

    /* Ülke toplama (ISO2). Kod yoksa "??" bilinmeyen kovasına düşer. */
    const kod = (event.country ?? "").trim().toUpperCase() || "??";
    let uSayac = ulkeMap.get(kod);
    if (!uSayac) {
      uSayac = { kod, olay: 0, bot: 0, engellenen: 0 };
      ulkeMap.set(kod, uSayac);
    }
    uSayac.olay += 1;
    if (bot) uSayac.bot += 1;
    if (engel) uSayac.engellenen += 1;

    /* ASN toplama (ham dize anahtar). */
    const asnHam = (event.asn ?? "").trim() || "Bilinmeyen";
    let aSayac = asnMap.get(asnHam);
    if (!aSayac) {
      aSayac = { asn: asnHam, olay: 0, bot: 0 };
      asnMap.set(asnHam, aSayac);
    }
    aSayac.olay += 1;
    if (bot) aSayac.bot += 1;

    /* Datacenter sinyali. */
    if (datacenterMi(asnHam)) {
      datacenterOlay += 1;
    }
  }

  /* --- Ülke istihbaratı: oran + tehdit seviyesi, top 10 --- */
  const tumUlkeler: UlkeIstihbarat[] = Array.from(ulkeMap.values()).map((u) => {
    const botOran = oran(u.bot, u.olay);
    return {
      kod: u.kod,
      olay: u.olay,
      bot: u.bot,
      engellenen: u.engellenen,
      botOran,
      tehditSeviyesi: tehditSeviyesiHesapla(botOran),
    };
  });

  const ulkeler = [...tumUlkeler]
    .sort((a, b) => b.olay - a.olay || a.kod.localeCompare(b.kod))
    .slice(0, 10);

  /* --- ASN istihbaratı: risk skoru (botOran × olay), top 8 --- */
  const tumAsnler: AsnIstihbarat[] = Array.from(asnMap.values()).map((a) => {
    const botOran = oran(a.bot, a.olay);
    return {
      asn: a.asn,
      olay: a.olay,
      bot: a.bot,
      botOran,
      saglayici: saglayiciAdi(a.asn),
    };
  });

  const asnler = [...tumAsnler]
    .sort((a, b) => {
      const skorA = a.botOran * a.olay;
      const skorB = b.botOran * b.olay;
      return skorB - skorA || b.olay - a.olay || a.asn.localeCompare(b.asn);
    })
    .slice(0, 8);

  /* --- Riskli bölgeler: tehdit seviyesi "yuksek" olan ülkeler (tümünden) --- */
  const riskliBolgeler = [...tumUlkeler]
    .filter((u) => u.tehditSeviyesi === "yuksek")
    .sort((a, b) => b.botOran - a.botOran || b.olay - a.olay || a.kod.localeCompare(b.kod));

  /* --- En tehditkâr ülke: botOran × olay en yüksek --- */
  let enTehditkarUlke: string | null = null;
  let enYuksekSkor = -1;
  for (const u of tumUlkeler) {
    const skor = u.botOran * u.olay;
    if (skor > enYuksekSkor) {
      enYuksekSkor = skor;
      enTehditkarUlke = u.kod;
    }
  }

  const datacenterOran = oran(datacenterOlay, toplamOlay);

  return {
    ulkeler,
    asnler,
    riskliBolgeler,
    datacenterOran,
    ozet: {
      ulkeSayisi: ulkeMap.size,
      asnSayisi: asnMap.size,
      enTehditkarUlke,
      datacenterOran,
    },
  };
}
