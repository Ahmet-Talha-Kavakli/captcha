/**
 * Specter — Tehdit İstihbarat Brifing Üreteci
 * ===========================================
 * Yöneticiye/SOC ekibine sunulacak otomatik istihbarat brifingi. Dağınık verileri
 * (koruma özeti, anomaliler, korelasyonlar, coğrafya, bot sınıfları) SENTEZLER ve
 * bir üst-düzey anlatı + bulgular + önerilen aksiyonlar + tehdit seviyesi üretir.
 * "Bu dönem ne oldu, ne kadar ciddi, ne yapmalıyım" tek sayfada.
 *
 * Saf/deterministik: Date.now/Math.random YOK — girdi verisinden türetilir.
 */
import type { BotEvent } from "@/lib/db/schema";

export type BrifingDonem = "24s" | "7g" | "30g";
export type TehditSeviye = "sakin" | "izlemede" | "yuksek" | "kritik";

export interface BrifingBulgu {
  baslik: string;
  detay: string;
  siddet: "bilgi" | "uyari" | "kritik";
}

export interface BrifingGirdi {
  donem: BrifingDonem;
  toplamOlay: number;
  botOlay: number;
  engellenen: number;
  benzersizIp: number;
  enSaldirganUlkeler: { ulke: string; sayi: number }[];
  enYayginBotSinif: { sinif: string; sayi: number }[];
  anomaliSayi: number;
  korelasyonSayi: number;
  aktifKampanya: number;
  kritikOlay: number;
  korumaSkoru: number;
}

export interface Brifing {
  baslik: string;
  donemAd: string;
  tehditSeviye: TehditSeviye;
  /** Üst-düzey anlatı (2-3 cümle). */
  ozet: string;
  bulgular: BrifingBulgu[];
  oneriler: string[];
  /** Sayısal öne çıkanlar. */
  vurgular: { etiket: string; deger: string }[];
}

const DONEM_AD: Record<BrifingDonem, string> = { "24s": "Son 24 Saat", "7g": "Son 7 Gün", "30g": "Son 30 Gün" };
const SINIF_AD: Record<string, string> = {
  human: "insan", good_bot: "iyi bot", automation: "otomasyon", scraper: "kazıyıcı",
  credential_stuffing: "kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "spam",
};

function tehditSeviyeBul(g: BrifingGirdi): TehditSeviye {
  const botOran = g.toplamOlay ? g.botOlay / g.toplamOlay : 0;
  let puan = 0;
  puan += g.kritikOlay * 25;
  puan += g.aktifKampanya * 15;
  puan += g.anomaliSayi * 8;
  puan += botOran * 40;
  puan += g.korelasyonSayi * 5;
  return puan >= 70 ? "kritik" : puan >= 40 ? "yuksek" : puan >= 15 ? "izlemede" : "sakin";
}

/** Girdiden tam bir brifing üretir. */
export function brifingUret(g: BrifingGirdi): Brifing {
  const botOran = g.toplamOlay ? Math.round((g.botOlay / g.toplamOlay) * 100) : 0;
  const engelOran = g.botOlay ? Math.round((g.engellenen / g.botOlay) * 100) : 0;
  const seviye = tehditSeviyeBul(g);
  const enUlke = g.enSaldirganUlkeler[0];
  const enSinif = g.enYayginBotSinif[0];

  // Üst-düzey anlatı.
  const ozetParcalar: string[] = [];
  ozetParcalar.push(
    `${DONEM_AD[g.donem]} içinde ${g.toplamOlay.toLocaleString("tr-TR")} istek değerlendirildi; bunların %${botOran}'i (${g.botOlay.toLocaleString("tr-TR")}) bot/otomasyon olarak sınıflandırıldı ve %${engelOran}'i engellendi/doğrulandı.`,
  );
  if (enSinif) ozetParcalar.push(`En yaygın tehdit türü ${SINIF_AD[enSinif.sinif] ?? enSinif.sinif} (${enSinif.sayi.toLocaleString("tr-TR")} olay).`);
  if (enUlke) ozetParcalar.push(`En yoğun saldırgan coğrafya ${enUlke.ulke} (${enUlke.sayi.toLocaleString("tr-TR")} olay).`);
  if (seviye === "kritik") ozetParcalar.push("Tehdit seviyesi KRİTİK — acil müdahale gerekiyor.");
  else if (seviye === "yuksek") ozetParcalar.push("Tehdit seviyesi yüksek; savunmanın sıkılaştırılması önerilir.");
  else if (seviye === "sakin") ozetParcalar.push("Trafik büyük ölçüde normal seyrinde.");

  // Bulgular.
  const bulgular: BrifingBulgu[] = [];
  if (g.kritikOlay > 0) bulgular.push({ baslik: `${g.kritikOlay} kritik güvenlik olayı`, detay: "Açık kritik olaylar aktif — olay yönetiminden inceleyin.", siddet: "kritik" });
  if (g.aktifKampanya > 0) bulgular.push({ baslik: `${g.aktifKampanya} aktif saldırı kampanyası`, detay: "Koordineli saldırı desenleri sürüyor.", siddet: "kritik" });
  if (g.anomaliSayi > 0) bulgular.push({ baslik: `${g.anomaliSayi} anomali tespit edildi`, detay: "Trafik deseni normalden sapıyor.", siddet: g.anomaliSayi >= 3 ? "kritik" : "uyari" });
  if (g.korelasyonSayi > 0) bulgular.push({ baslik: `${g.korelasyonSayi} saldırı zinciri (korelasyon)`, detay: "Birden çok olay tek koordineli saldırıya bağlandı.", siddet: "uyari" });
  if (botOran >= 40) bulgular.push({ baslik: `Yüksek bot oranı (%${botOran})`, detay: "Trafiğin büyük kısmı otomatik — kaynak tüketimi ve risk yüksek.", siddet: "uyari" });
  if (enSinif && (enSinif.sinif === "credential_stuffing" || enSinif.sinif === "ddos")) {
    bulgular.push({ baslik: `${SINIF_AD[enSinif.sinif]} baskın tehdit`, detay: "Yüksek-risk saldırı türü öne çıkıyor.", siddet: "kritik" });
  }
  if (g.korumaSkoru < 60) bulgular.push({ baslik: `Koruma skoru düşük (${g.korumaSkoru}/100)`, detay: "Savunma yapılandırması güçlendirilmeli.", siddet: "uyari" });
  if (bulgular.length === 0) bulgular.push({ baslik: "Belirgin tehdit yok", detay: "Bu dönemde dikkat gerektiren bir olay tespit edilmedi.", siddet: "bilgi" });

  // Öneriler.
  const oneriler: string[] = [];
  if (g.kritikOlay > 0) oneriler.push("Açık kritik olayları önceliklendirip çözüme kavuşturun (Olay Yönetimi).");
  if (enSinif?.sinif === "credential_stuffing") oneriler.push("/login yolunda oran-limiti ve düşük-skor engelleme kuralı ekleyin.");
  if (enSinif?.sinif === "scraper") oneriler.push("Kazıma için ASN/datacenter tabanlı engelleme ve daha agresif challenge uygulayın.");
  if (enSinif?.sinif === "ai_agent") oneriler.push("AI Ajan İstihbaratı'ndan eğitim botları için engelleme politikası ayarlayın.");
  if (enUlke) oneriler.push(`${enUlke.ulke} ve diğer yüksek-risk coğrafyalar için coğrafi doğrulama kuralı değerlendirin.`);
  if (g.anomaliSayi > 0) oneriler.push("Anomali akışını inceleyip adaptif zorluğu yükseltin.");
  if (g.korumaSkoru < 60) oneriler.push("Kural pazarından sektör paketi kurarak kapsamı genişletin.");
  if (oneriler.length === 0) oneriler.push("Mevcut savunma yeterli görünüyor; izlemeyi sürdürün.");

  return {
    baslik: `Tehdit İstihbarat Brifingi — ${DONEM_AD[g.donem]}`,
    donemAd: DONEM_AD[g.donem],
    tehditSeviye: seviye,
    ozet: ozetParcalar.join(" "),
    bulgular,
    oneriler: oneriler.slice(0, 6),
    vurgular: [
      { etiket: "Toplam istek", deger: g.toplamOlay.toLocaleString("tr-TR") },
      { etiket: "Bot oranı", deger: `%${botOran}` },
      { etiket: "Engellenen", deger: g.engellenen.toLocaleString("tr-TR") },
      { etiket: "Benzersiz saldırgan IP", deger: g.benzersizIp.toLocaleString("tr-TR") },
      { etiket: "Anomali", deger: String(g.anomaliSayi) },
      { etiket: "Koruma skoru", deger: `${g.korumaSkoru}/100` },
    ],
  };
}

/** Olay dizisinden brifing girdisi toplar (donem filtreli). */
export function brifingGirdiTopla(events: BotEvent[], donem: BrifingDonem, simdi: number, ekstra: { anomaliSayi: number; korelasyonSayi: number; aktifKampanya: number; kritikOlay: number; korumaSkoru: number }): BrifingGirdi {
  const pencere = donem === "24s" ? 86400000 : donem === "7g" ? 7 * 86400000 : 30 * 86400000;
  const esik = simdi - pencere;
  const donemOlay = events.filter((e) => e.ts >= esik);
  const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);
  const botOlaylar = donemOlay.filter((e) => KOTU.has(e.botClass));
  const engellenen = donemOlay.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;

  const say = (fn: (e: BotEvent) => string, list: BotEvent[]) => {
    const m = new Map<string, number>();
    for (const e of list) { const k = fn(e); m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  return {
    donem,
    toplamOlay: donemOlay.length,
    botOlay: botOlaylar.length,
    engellenen,
    benzersizIp: new Set(botOlaylar.map((e) => e.ip)).size,
    enSaldirganUlkeler: say((e) => e.country, botOlaylar).slice(0, 5).map(([ulke, sayi]) => ({ ulke, sayi })),
    enYayginBotSinif: say((e) => e.botClass, botOlaylar).slice(0, 5).map(([sinif, sayi]) => ({ sinif, sayi })),
    ...ekstra,
  };
}

export const SEVIYE_ETIKET: Record<TehditSeviye, string> = { sakin: "Sakin", izlemede: "İzlemede", yuksek: "Yüksek", kritik: "Kritik" };
export const SEVIYE_RENK: Record<TehditSeviye, string> = { sakin: "#16a34a", izlemede: "#2f6fed", yuksek: "#ea580c", kritik: "#dc2626" };
