/**
 * Specter — Kullanıcı Yolculuğu & Dönüşüm Hunisi Motoru
 * ====================================================
 * Koruma güvenliği artırır ama YANLIŞ kurgulanırsa gerçek kullanıcıyı da kaybettirir.
 * Bu motor, korunan kullanıcının yolculuğunu modelleyerek her aşamadaki düşüşü
 * (drop-off) gösterir: geliş → doğrulama gösterildi → çözüldü → geçti → başarı.
 * İnsan ve bot akışlarını AYIRIR — böylece "botları eledim ama insan da mı kaçtı?"
 * sorusuna net cevap verir. Sürtünme kaybını ölçer.
 *
 * Saf/deterministik: Date.now/Math.random YOK. Veri Usage sayaçları + olaylardan.
 */
import type { BotEvent } from "@/lib/db/schema";

export interface HuniAsama {
  ad: string;
  sayi: number;
  /** Bir önceki aşamaya göre geçiş oranı %. */
  gecisOran: number;
  /** Bir önceki aşamadan düşen sayı. */
  dusen: number;
  aciklama: string;
}

export interface YolculukSonuc {
  /** İnsan yolculuğu hunisi. */
  insanHuni: HuniAsama[];
  /** Bot yolculuğu hunisi (savunmanın istediği: erkenden dursun). */
  botHuni: HuniAsama[];
  /** İnsan uçtan-uca dönüşüm oranı %. */
  insanDonusum: number;
  /** Bot geçiş oranı % (düşük iyi). */
  botGecis: number;
  /** Sürtünme kaybı: doğrulama yüzünden kaybedilen tahmini insan %. */
  surtunmeKaybi: number;
  /** Savunma dengesi skoru 0-100 (yüksek insan-geçiş + düşük bot-geçiş). */
  dengeSkoru: number;
  vurgular: { etiket: string; deger: string }[];
}

const KOTU = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

function huniAsama(ad: string, sayi: number, oncekiSayi: number, aciklama: string): HuniAsama {
  const gecisOran = oncekiSayi > 0 ? Math.round((sayi / oncekiSayi) * 1000) / 10 : 0;
  return { ad, sayi, gecisOran, dusen: Math.max(0, oncekiSayi - sayi), aciklama };
}

/**
 * Olaylardan insan ve bot dönüşüm hunilerini kurar.
 * Aşamalar (verdict + score ile modellenir):
 *   geliş → doğrulama-gösterildi → çözüldü → geçti(allowed) → başarı(dönüşüm)
 */
export function yolculukAnaliz(events: BotEvent[]): YolculukSonuc {
  const insanlar = events.filter((e) => e.botClass === "human" || e.botClass === "good_bot");
  const botlar = events.filter((e) => KOTU.has(e.botClass));

  // --- İnsan hunisi ---
  const iGelis = insanlar.length;
  // Doğrulama gösterildi: challenge edilen ya da düşük-güven skorlular (invisible geçenler hariç).
  const iDogrulamaGosterildi = insanlar.filter((e) => e.verdict === "challenged" || e.score < 0.7).length;
  // Görünmez geçen + challenge'ı çözüp geçen insanlar (allowed).
  const iGecti = insanlar.filter((e) => e.verdict === "allowed").length;
  // Challenge gösterilenlerden çözenler (allowed olanlar arasında challenge görmüşler tahmini).
  const iCozdu = Math.min(iDogrulamaGosterildi, insanlar.filter((e) => e.verdict === "allowed").length);
  // Başarı (dönüşüm): geçen insanların hedef aksiyonu tamamladığı tahmini (temsili %78).
  const iBasari = Math.round(iGecti * 0.78);

  const insanHuni: HuniAsama[] = [
    huniAsama("Geliş", iGelis, iGelis, "Siteye gelen meşru kullanıcılar."),
    huniAsama("Doğrulama gösterildi", iDogrulamaGosterildi, iGelis, "Ghost-font challenge veya davranış kontrolü görenler."),
    huniAsama("Çözdü", iCozdu, Math.max(iDogrulamaGosterildi, 1), "Doğrulamayı başarıyla tamamlayanlar."),
    huniAsama("Geçti", iGecti, iGelis, "Korumadan geçip siteye erişenler."),
    huniAsama("Dönüşüm", iBasari, Math.max(iGecti, 1), "Hedef aksiyonu (kayıt/satın alma) tamamlayanlar."),
  ];

  // --- Bot hunisi (savunma erken durdurmalı) ---
  const bGelis = botlar.length;
  const bDogrulama = botlar.filter((e) => e.verdict === "challenged").length;
  const bEngellendi = botlar.filter((e) => e.verdict === "blocked").length;
  const bGecti = botlar.filter((e) => e.verdict === "allowed").length; // savunma kaçırdı
  const botHuni: HuniAsama[] = [
    huniAsama("Bot geliş", bGelis, bGelis, "Tespit edilen bot/otomasyon istekleri."),
    huniAsama("Doğrulamaya takıldı", bDogrulama, bGelis, "Challenge'a tabi tutulan botlar."),
    huniAsama("Engellendi", bEngellendi, bGelis, "Kesin engellenen botlar."),
    huniAsama("Geçti (kaçan)", bGecti, bGelis, "Savunmadan kaçıp geçen botlar — sızıntı."),
  ];

  const insanDonusum = iGelis > 0 ? Math.round((iBasari / iGelis) * 1000) / 10 : 0;
  const botGecis = bGelis > 0 ? Math.round((bGecti / bGelis) * 1000) / 10 : 0;
  // Sürtünme kaybı: challenge gösterilen ama geçemeyip düşen insanlar (terk).
  const iTerk = Math.max(0, iDogrulamaGosterildi - iCozdu);
  const surtunmeKaybi = iGelis > 0 ? Math.round((iTerk / iGelis) * 1000) / 10 : 0;
  // Denge: insan-geçiş yüksek + bot-geçiş düşük.
  const insanGecisOran = iGelis > 0 ? (iGecti / iGelis) * 100 : 0;
  const dengeSkoru = Math.max(0, Math.min(100, Math.round(insanGecisOran * 0.6 + (100 - botGecis) * 0.4)));

  return {
    insanHuni, botHuni, insanDonusum, botGecis, surtunmeKaybi, dengeSkoru,
    vurgular: [
      { etiket: "İnsan geliş", deger: iGelis.toLocaleString("tr-TR") },
      { etiket: "İnsan dönüşümü", deger: `%${insanDonusum}` },
      { etiket: "Sürtünme kaybı", deger: `%${surtunmeKaybi}` },
      { etiket: "Bot geçişi (sızıntı)", deger: `%${botGecis}` },
      { etiket: "Engellenen bot", deger: bEngellendi.toLocaleString("tr-TR") },
      { etiket: "Denge skoru", deger: `${dengeSkoru}/100` },
    ],
  };
}

/** Yolculuk için öneri üretir (denge/sürtünme durumuna göre). */
export function yolculukOneriler(s: YolculukSonuc): { baslik: string; metin: string; tip: "iyi" | "uyari" }[] {
  const o: { baslik: string; metin: string; tip: "iyi" | "uyari" }[] = [];
  if (s.surtunmeKaybi > 8) o.push({ baslik: "Yüksek sürtünme kaybı", metin: `İnsanların %${s.surtunmeKaybi}'i doğrulamada takılıp düşüyor. Görünmez modu genişlet veya zorluğu düşür.`, tip: "uyari" });
  else o.push({ baslik: "Düşük sürtünme", metin: "İnsan akışı akıcı — doğrulama kullanıcıyı fazla yormuyor.", tip: "iyi" });
  if (s.botGecis > 10) o.push({ baslik: "Bot sızıntısı var", metin: `Botların %${s.botGecis}'i savunmadan geçiyor. Daha agresif kural veya birleşik risk eşiği uygula.`, tip: "uyari" });
  else o.push({ baslik: "Bot filtresi etkili", metin: "Botların çok azı geçebiliyor — savunma sıkı.", tip: "iyi" });
  if (s.dengeSkoru < 60) o.push({ baslik: "Denge iyileştirilebilir", metin: "Güvenlik ile kullanıcı deneyimi arasındaki denge optimize edilebilir — adaptif zorluğu ayarla.", tip: "uyari" });
  return o;
}
