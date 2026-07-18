/**
 * Specter — Kapalı-Döngü Otomatik Savunma Düzeltme Motoru
 * =======================================================
 * `kural-oneri.ts` gözlemlenen tehditlerden kural TASLAĞI üretir ama o kuralın
 * güvenli olup olmadığını KANITLAMAZ. Bu motor bir adım öteye gider: her aday
 * kuralı `sandbox.ts` motoruyla GERÇEK trafik yakalamalarına karşı çalıştırıp
 * DOĞRULAR. Yalnızca şu koşulu geçen kurallar onaylanır:
 *     net savunma iyileşmesi > 0  VE  regresyon = 0  VE  yanlış-pozitif ≈ 0
 * Yani "bu kuralı eklersen hiçbir yakaladığın saldırıyı kaçırmazsın, hiçbir
 * meşru kullanıcıyı engellemezsin, net savunma artar" garantisi.
 *
 * DÖNGÜ (kapalı-döngü):
 *   1) Gözlemlenen olaylardan savunma BOŞLUĞU bul (kötü sınıfta olup şu an
 *      yeterince engellenmeyen trafik yoğunlukları).
 *   2) Her boşluk için somut bir aday kural SENTEZLE.
 *   3) Adayı "canlı-kurallar + aday" olarak TÜM sandbox yakalamalarında çalıştır.
 *   4) Sonuç güvenliyse ONAYLA ve birikimli yama setine ekle (bir sonraki aday
 *      önceki onaylananların ÜSTÜNE doğrulanır — kümülatif güvenlik).
 *   5) Onaylanmayan adayları REDDEDİLEN olarak gerekçesiyle raporla.
 *
 * Saf/deterministik: Date.now/Math.random YOK — sandbox yakalamaları tohumlu.
 */
import type { BotEvent, Rule, RuleField, RuleOp, RuleAction } from "@/lib/db/schema";
import { YAKALAMALAR, sandboxCalistir } from "@/lib/specter/sandbox";

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);
const IYI = new Set(["human", "good_bot"]);

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/* --------------------------------------------------------- 1) Boşluk tespiti */

export interface SavunmaBosluk {
  id: string;
  tur: "asn" | "botClass" | "country";
  field: RuleField;
  value: string;
  /** Bu boşlukta gözlemlenen kötü olay sayısı. */
  kotuSayi: number;
  /** Bu boşlukta gözlemlenen meşru olay sayısı (yanlış-pozitif uyarısı). */
  insanSayi: number;
  /** Kötü olayların meşrulara oranı — ne kadar yüksekse o kadar güvenli hedef. */
  saflik: number;
  aciklama: string;
}

/** Bir olay değerinin kanonik ASN kısa etiketi (AS9009 M247 → AS9009). */
function asnKisa(asn: string): string {
  const m = asn.match(/^AS\d+/);
  return m ? m[0] : asn.split(" ")[0];
}

/**
 * Gözlemlenen olaylardan somut savunma boşlukları çıkarır: kötü trafiğin
 * yoğunlaştığı ASN / bot sınıfı / ülke değerleri (saflık = kötü/(kötü+insan)).
 * Yalnızca yeterince yoğun ve yeterince "saf" (düşük meşru karışım) hedefler.
 */
export function bosluklariBul(events: BotEvent[]): SavunmaBosluk[] {
  const grupla = (
    tur: SavunmaBosluk["tur"], field: RuleField, anahtar: (e: BotEvent) => string, deger: (e: BotEvent) => string,
  ): SavunmaBosluk[] => {
    const map = new Map<string, { value: string; kotu: number; insan: number }>();
    for (const e of events) {
      const k = anahtar(e);
      if (!k) continue;
      let g = map.get(k);
      if (!g) { g = { value: deger(e), kotu: 0, insan: 0 }; map.set(k, g); }
      if (KOTU.has(e.botClass)) g.kotu++;
      else if (IYI.has(e.botClass)) g.insan++;
    }
    const out: SavunmaBosluk[] = [];
    for (const [k, g] of map) {
      const toplam = g.kotu + g.insan;
      if (g.kotu < 4) continue; // yeterince yoğun değil
      const saflik = toplam ? g.kotu / toplam : 0;
      if (saflik < 0.85) continue; // meşru karışım fazla → riskli hedef, atla
      out.push({
        id: `bosluk-${tur}-${hash(k)}`, tur, field, value: g.value, kotuSayi: g.kotu, insanSayi: g.insan,
        saflik: Math.round(saflik * 100) / 100,
        aciklama: `${g.kotu} kötü isteğin kaynağı (${Math.round(saflik * 100)}% saf, ${g.insan} meşru).`,
      });
    }
    return out.sort((a, b) => b.kotuSayi - a.kotuSayi);
  };

  const asn = grupla("asn", "asn", (e) => asnKisa(e.asn), (e) => asnKisa(e.asn));
  const bot = grupla("botClass", "botClass", (e) => (KOTU.has(e.botClass) ? e.botClass : ""), (e) => e.botClass);
  const ulke = grupla("country", "country", (e) => e.country, (e) => e.country);

  // En güvenli/etkili hedefler önce: bot sınıfı (en genel), sonra ASN, sonra ülke.
  return [...bot, ...asn, ...ulke];
}

/* ------------------------------------------------------- 2) Aday kural sentezi */

export interface AdayKural {
  bosluk: SavunmaBosluk;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  ad: string;
}

/** Bir boşluğu somut bir aday kurala çevirir. */
function adaySentezle(bosluk: SavunmaBosluk): AdayKural {
  // Bot sınıfı ve ASN için block; ülke için (meşru trafik olabileceğinden) challenge.
  const action: RuleAction = bosluk.tur === "country" ? "challenge" : "block";
  const op: RuleOp = bosluk.tur === "asn" ? "contains" : "eq";
  const ad =
    bosluk.tur === "botClass" ? `${bosluk.value} sınıfını engelle`
    : bosluk.tur === "asn" ? `${bosluk.value} ağını engelle`
    : `${bosluk.value} ülkesini doğrula`;
  return { bosluk, field: bosluk.field, op, value: bosluk.value, action, ad };
}

/* ---------------------------------------------- 3-4) Sandbox ile doğrula & onayla */

export interface DuzeltmeSonuc {
  aday: AdayKural;
  /** Bu aday için tüm yakalamaların birleşik sandbox metrikleri. */
  toplamIyilesme: number;
  toplamRegresyon: number;
  toplamYanlisPozitif: number;
  /** Baz→aday ortalama net etkinlik değişimi (puan). */
  ortNetDegisim: number;
  /** Onaylandı mı: iyileşme>0 ve regresyon=0 ve yanlış-pozitif=0. */
  onaylandi: boolean;
  /** İnsan-okur karar gerekçesi. */
  gerekce: string;
  /** Yakalama başına kısa özet. */
  yakalamaDetay: { ad: string; iyilesme: number; regresyon: number; yanlisPozitif: number; net: number }[];
}

export interface OtoDuzeltmeRaporu {
  onaylanan: DuzeltmeSonuc[];
  reddedilen: DuzeltmeSonuc[];
  boslukSayisi: number;
  /** Onaylanan kuralların canlıya uygulanırsa üreteceği toplam yama seti. */
  yamaSeti: Rule[];
  ozet: {
    denenenAday: number;
    onaylanan: number;
    reddedilen: number;
    /** Onaylanan kuralların birleşik net etkinlik katkısı (puan). */
    netKazanim: number;
    engellenenTahmini: number;
  };
}

function ruleYap(aday: AdayKural, siteId: string, oncelik: number): Rule {
  return {
    id: `oto-${hash(aday.value + aday.field)}`, siteId,
    name: aday.ad, enabled: true, priority: oncelik,
    field: aday.field, op: aday.op, value: aday.value, action: aday.action,
    hits: 0, createdAt: 0, system: false,
  } as Rule;
}

/**
 * Kapalı-döngü çalıştırma. Gözlemlenen olaylardan boşluk bulur, aday kurallar
 * sentezler, her birini TÜM sandbox yakalamalarında birikimli olarak doğrular ve
 * yalnızca güvenli olanları onaylar.
 *
 * @param events kullanıcının gözlemlenen olayları (boşluk tespiti için)
 * @param canliKurallar kullanıcının şu anki canlı kuralları (baz)
 */
export function otoDuzeltmeCalistir(events: BotEvent[], canliKurallar: Rule[]): OtoDuzeltmeRaporu {
  const bosluklar = bosluklariBul(events);
  const adaylar = bosluklar.map(adaySentezle);
  const siteId = canliKurallar[0]?.siteId ?? "site";

  const onaylanan: DuzeltmeSonuc[] = [];
  const reddedilen: DuzeltmeSonuc[] = [];
  // Kümülatif kabul edilen kurallar — her yeni aday bunların ÜSTÜNE doğrulanır.
  const kabulEdilen: Rule[] = [];

  let oncelikSayac = (canliKurallar.reduce((m, r) => Math.max(m, r.priority), 0)) + 1;

  for (const aday of adaylar) {
    // Zaten canlıda ya da kabul edilende aynı alan+değer varsa atla.
    const cakisiyor = [...canliKurallar, ...kabulEdilen].some(
      (r) => r.field === aday.field && r.value.toLowerCase() === aday.value.toLowerCase() && r.enabled,
    );
    if (cakisiyor) continue;

    const yeniKural = ruleYap(aday, siteId, oncelikSayac);
    const bazSeti = [...canliKurallar, ...kabulEdilen];
    const adaySeti = [...bazSeti, yeniKural];

    let topIy = 0, topReg = 0, topFp = 0, netTop = 0;
    const detay: DuzeltmeSonuc["yakalamaDetay"] = [];
    for (const yak of YAKALAMALAR) {
      const s = sandboxCalistir(yak, bazSeti, adaySeti);
      topIy += s.iyilesme; topReg += s.regresyon; topFp += s.yanlisPozitif; netTop += s.netDegisim;
      detay.push({ ad: yak.ad, iyilesme: s.iyilesme, regresyon: s.regresyon, yanlisPozitif: s.yanlisPozitif, net: s.netDegisim });
    }
    const ortNet = Math.round((netTop / YAKALAMALAR.length) * 10) / 10;
    const onay = topIy > 0 && topReg === 0 && topFp === 0;

    const gerekce = onay
      ? `${topIy} kaçan saldırı yakalanıyor, 0 regresyon, 0 yanlış-pozitif — güvenle uygulanabilir.`
      : topReg > 0 ? `${topReg} regresyon üretiyor (yakaladığın saldırıyı kaçırır) — reddedildi.`
      : topFp > 0 ? `${topFp} meşru kullanıcıyı engelliyor (yanlış-pozitif) — reddedildi.`
      : `Ölçülebilir savunma iyileşmesi yok — reddedildi.`;

    const sonuc: DuzeltmeSonuc = {
      aday, toplamIyilesme: topIy, toplamRegresyon: topReg, toplamYanlisPozitif: topFp,
      ortNetDegisim: ortNet, onaylandi: onay, gerekce, yakalamaDetay: detay,
    };

    if (onay) {
      onaylanan.push(sonuc);
      kabulEdilen.push(yeniKural);
      oncelikSayac++;
    } else {
      reddedilen.push(sonuc);
    }
  }

  const netKazanim = Math.round(onaylanan.reduce((a, s) => a + s.ortNetDegisim, 0) * 10) / 10;
  const engellenenTahmini = onaylanan.reduce((a, s) => a + s.aday.bosluk.kotuSayi, 0);

  return {
    onaylanan, reddedilen, boslukSayisi: bosluklar.length, yamaSeti: kabulEdilen,
    ozet: {
      denenenAday: onaylanan.length + reddedilen.length,
      onaylanan: onaylanan.length, reddedilen: reddedilen.length,
      netKazanim, engellenenTahmini,
    },
  };
}

export const TUR_ETIKET: Record<SavunmaBosluk["tur"], string> = {
  asn: "ASN / Ağ", botClass: "Bot sınıfı", country: "Ülke",
};
