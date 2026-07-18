/**
 * Specter — Şeffaf Koruma Skoru Motoru
 * ====================================
 * Koruma skorunu tek bir sihirli sayı olarak DEĞİL, ağırlıklı alt-sistemlerin
 * şeffaf bir bileşimi olarak hesaplar (guven-merkezi güven-skoru modeli gibi).
 * Her alt-sistem: 0-100 skor + ağırlık + "neden bu skor" açıklaması + iyileştirme
 * önerisi taşır. Böylece kullanıcı skorun NEDEN o olduğunu ve nasıl yükselteceğini
 * görür — yüzeysel bir gösterge değil, eyleme dönük bir teşhis.
 *
 * Alt-sistemler (ağırlık):
 *   Tehdit tespiti (0.30) — engelleme etkinliği (blok oranı 0.30 hedefe göre)
 *   Kapsama (0.25)        — sitelerin izleme-dışı (aktif koruma) oranı
 *   Kural sağlığı (0.20)  — aktif kural + AI politikası varlığı/çeşitliliği
 *   Olay yönetimi (0.15)  — açık kritik olay yok + hızlı çözüm
 *   Yapılandırma (0.10)   — doğrulanmış alan adı + entegrasyon
 */

export interface SkorAltSistem {
  anahtar: string;
  ad: string;
  skor: number; // 0-100
  agirlik: number; // 0-1 (toplam 1)
  aciklama: string; // neden bu skor
  oneri: string | null; // nasıl yükseltilir (tamsa null)
  renk: string;
}

export interface KorumaSkoruSonuc {
  skor: number; // 0-100 ağırlıklı bileşim
  seviye: "Güçlü" | "İyi" | "Orta" | "Zayıf";
  altSistemler: SkorAltSistem[];
  /** Skoru en çok düşüren alt-sistem (varsa) — "önce şunu düzelt". */
  enZayifHalka: SkorAltSistem | null;
  /** Potansiyel: tüm öneriler uygulanırsa ulaşılabilecek skor. */
  potansiyel: number;
}

export interface SkorGirdi {
  siteSayisi: number;
  aktifKorumaSite: number; // mode !== "monitor"
  dogrulanmisSite: number;
  blockRate: number; // 0..1 (30g)
  aktifKural: number;
  ozelKural: number; // sistem olmayan
  aiPolitikaSayisi: number;
  acikKritikOlay: number;
  cozulenOlay: number;
  toplamOlay: number;
  ortMttrDk: number | null; // ortalama çözüm süresi (dk)
  entegrasyonSayisi: number;
}

function renkSkor(s: number): string {
  return s >= 85 ? "#16a34a" : s >= 65 ? "#2f6fed" : s >= 45 ? "#d97706" : "#dc2626";
}

export function korumaSkoruHesap(g: SkorGirdi): KorumaSkoruSonuc {
  const alt: SkorAltSistem[] = [];

  // 1) Tehdit tespiti — blok oranı 0.30 hedefe göre (etkinlik).
  const tespit = Math.min(100, Math.round((g.blockRate / 0.3) * 100));
  alt.push({
    anahtar: "tespit",
    ad: "Tehdit tespiti",
    skor: tespit,
    agirlik: 0.3,
    aciklama:
      g.blockRate > 0
        ? `Son 30 günde trafiğin %${(g.blockRate * 100).toFixed(1)}'i engellendi/doğrulandı. Hedef etkinlik %30 blok oranı.`
        : "Henüz anlamlı engelleme yok — trafik akmaya başladığında bu skor gerçek verilerle dolar.",
    oneri: tespit < 80 ? "Daha agresif kurallar ekle veya davranış eşiğini yükselt." : null,
    renk: renkSkor(tespit),
  });

  // 2) Kapsama — aktif korumadaki site oranı.
  const kapsama = g.siteSayisi ? Math.round((g.aktifKorumaSite / g.siteSayisi) * 100) : 0;
  alt.push({
    anahtar: "kapsama",
    ad: "Kapsama",
    skor: kapsama,
    agirlik: 0.25,
    aciklama: g.siteSayisi
      ? `${g.aktifKorumaSite}/${g.siteSayisi} sitede aktif koruma açık (kalanı yalnızca izleme modunda).`
      : "Henüz site eklenmedi.",
    oneri: kapsama < 100 && g.siteSayisi > 0 ? "İzleme modundaki siteleri aktif korumaya al." : g.siteSayisi === 0 ? "İlk siteni ekle." : null,
    renk: renkSkor(kapsama),
  });

  // 3) Kural sağlığı — aktif kural + AI politikası varlığı/çeşitliliği.
  let kural = 0;
  if (g.aktifKural > 0) kural += 40;
  if (g.ozelKural > 0) kural += 25;
  if (g.aktifKural >= 5) kural += 15;
  if (g.aiPolitikaSayisi > 0) kural += 20;
  kural = Math.min(100, kural);
  alt.push({
    anahtar: "kural",
    ad: "Kural sağlığı",
    skor: kural,
    agirlik: 0.2,
    aciklama: `${g.aktifKural} aktif kural (${g.ozelKural} özel), ${g.aiPolitikaSayisi} AI ajan politikası tanımlı.`,
    oneri:
      kural < 80
        ? g.ozelKural === 0
          ? "Kural pazarından bir sektör paketi kur veya gelişmiş kural oluşturucuyla özel kural yaz."
          : g.aiPolitikaSayisi === 0
            ? "AI ajanlar için izin/engel politikası ayarla."
            : "Daha fazla kural ekleyerek kapsamı genişlet."
        : null,
    renk: renkSkor(kural),
  });

  // 4) Olay yönetimi — açık kritik olay cezası + çözüm oranı + MTTR.
  let olay = 100;
  olay -= g.acikKritikOlay * 15; // her açık kritik olay 15 puan
  const cozumOran = g.toplamOlay ? g.cozulenOlay / g.toplamOlay : 1;
  olay = Math.round(olay * (0.6 + 0.4 * cozumOran)); // çözüm oranı %40 ağırlıklı
  if (g.ortMttrDk !== null && g.ortMttrDk > 240) olay -= 10; // 4 saatten yavaş çözüm cezası
  olay = Math.max(0, Math.min(100, olay));
  alt.push({
    anahtar: "olay",
    ad: "Olay yönetimi",
    skor: olay,
    agirlik: 0.15,
    aciklama:
      g.toplamOlay > 0
        ? `${g.acikKritikOlay} açık kritik olay, çözüm oranı %${Math.round(cozumOran * 100)}${g.ortMttrDk !== null ? `, ort. çözüm ${Math.round(g.ortMttrDk)} dk` : ""}.`
        : "Kaydedilmiş güvenlik olayı yok — sistem sakin.",
    oneri: g.acikKritikOlay > 0 ? "Açık kritik olayları incele ve çöz." : olay < 80 ? "Bekleyen olayları çözüme kavuştur." : null,
    renk: renkSkor(olay),
  });

  // 5) Yapılandırma — doğrulanmış alan adı + entegrasyon.
  let yapi = 0;
  const dogrulamaOran = g.siteSayisi ? g.dogrulanmisSite / g.siteSayisi : 0;
  yapi += Math.round(dogrulamaOran * 60);
  if (g.entegrasyonSayisi > 0) yapi += 40;
  yapi = Math.min(100, yapi);
  alt.push({
    anahtar: "yapi",
    ad: "Yapılandırma",
    skor: yapi,
    agirlik: 0.1,
    aciklama: `${g.dogrulanmisSite}/${g.siteSayisi || 0} alan adı doğrulandı, ${g.entegrasyonSayisi} entegrasyon bağlı.`,
    oneri:
      yapi < 100
        ? dogrulamaOran < 1 && g.siteSayisi > 0
          ? "Doğrulanmamış alan adlarını DNS TXT ile doğrula."
          : g.entegrasyonSayisi === 0
            ? "Slack/Discord/webhook entegrasyonu bağla — olaylardan anında haberdar ol."
            : null
        : null,
    renk: renkSkor(yapi),
  });

  // Ağırlıklı bileşim.
  const skor = Math.max(0, Math.min(100, Math.round(alt.reduce((a, s) => a + s.skor * s.agirlik, 0))));
  const seviye = skor >= 85 ? "Güçlü" : skor >= 65 ? "İyi" : skor >= 45 ? "Orta" : "Zayıf";

  // En zayıf halka: ağırlık×eksik-puan en yüksek olan (skoru en çok düşüren).
  const onerililer = alt.filter((s) => s.oneri);
  const enZayifHalka =
    onerililer.length > 0
      ? onerililer.reduce((en, s) => (s.agirlik * (100 - s.skor) > en.agirlik * (100 - en.skor) ? s : en))
      : null;

  // Potansiyel: her önerili alt-sistem 100'e çıkarsa ulaşılacak skor.
  const potansiyel = Math.max(
    skor,
    Math.min(
      100,
      Math.round(alt.reduce((a, s) => a + (s.oneri ? 100 : s.skor) * s.agirlik, 0)),
    ),
  );

  return { skor, seviye, altSistemler: alt, enZayifHalka, potansiyel };
}
