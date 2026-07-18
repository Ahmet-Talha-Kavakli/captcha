/**
 * Specter — Hesap Sağlığı & Kullanım Olgunluğu Motoru (SAF)
 * =========================================================
 * Bu modül, hesabın koruma kurulumunun ne kadar SAĞLIKLI ve ne kadar İYİ
 * BENİMSENMİŞ (adoption) olduğunu 0-100 arası ağırlıklı boyutlardan hesaplar.
 * Müşteri Başarısı / yönetici bakış açısıdır: "bu hesabı bırakma (churn)
 * riskinde mi, kurulumun neresi eksik?".
 *
 * SAFLIK SÖZLEŞMESİ
 * -----------------
 * Bu dosyada `Date.now()`, `Math.random()` veya argümansız `new Date()` YOKTUR.
 * Tarih matematiği için tüm zaman referansları dışarıdan `bugun` (epoch ms)
 * olarak geçer. Böylece motor tamamen deterministiktir ve test edilebilir.
 * (Belirli bir gün-anahtarı için `new Date(ts)` kullanımı deterministiktir —
 * argümansız çağrı değildir.)
 */

/** Bir boyutun durum sınıfı (renk/rozet için). */
export type SaglikDurum = "iyi" | "orta" | "zayif";

/** Churn (bırakma) risk seviyesi. */
export type ChurnSeviye = "dusuk" | "orta" | "yuksek";

/** Genel sağlık olgunluk seviyesi (skordan türetilir). */
export type SaglikSeviyeAd = "mükemmel" | "iyi" | "gelişmeli" | "riskli";

/** Tek bir sağlık boyutunun sonucu. */
export interface SaglikBoyut {
  /** Kararlı anahtar (i18n/link eşlemesi için). */
  anahtar: "kurulum" | "kullanim" | "yapilandirma" | "yonetisim" | "operasyon";
  /** İnsan-okur ad. */
  ad: string;
  /** 0-100 boyut skoru. */
  skor: number;
  /** Ağırlık (0-1, tüm boyutların toplamı 1). */
  agirlik: number;
  /** Durum sınıfı. */
  durum: SaglikDurum;
  /** Bu boyutu iyileştirmek için eyleme-dönük öneri. */
  oneri: string;
  /** Önerinin götürdüğü panel yolu (varsa). */
  link?: string;
  /** Kısa gerekçe ölçütleri (kullanıcıya "neden bu skor" göstermek için). */
  ayrinti: string[];
}

/** Çürüm/churn risk sonucu. */
export interface ChurnSonuc {
  seviye: ChurnSeviye;
  /** 0-100 risk puanı (yüksek = daha riskli). */
  puan: number;
  /** Riski yükselten somut nedenler. */
  nedenler: string[];
  /** Riski düşürmek için önerilen aksiyonlar. */
  aksiyonlar: string[];
}

/** Motorun ürettiği tam sonuç. */
export interface SaglikSonuc {
  /** 0-100 ağırlıklı genel sağlık/olgunluk skoru. */
  skor: number;
  /** Skordan türetilen seviye. */
  seviye: SaglikSeviyeAd;
  /** Tüm boyutlar (görüntüleme sırasıyla). */
  boyutlar: SaglikBoyut[];
  /** Churn risk değerlendirmesi. */
  churn: ChurnSonuc;
  /** Öncelikli sonraki adımlar (en zayıf boyutların önerileri, zayıflığa göre sıralı). */
  sonrakiAdimlar: { anahtar: SaglikBoyut["anahtar"]; ad: string; oneri: string; link?: string; skor: number }[];
  /** Motora giren özetlenmiş sinyaller (şeffaflık / hata ayıklama için). */
  sinyaller: {
    kotaOran: number;
    sonAktiflikGun: number;
    aktifGunSayisi: number;
    aylikKullanim: number;
  };
}

/** Motorun beklediği girdi (repo'lardan sayfa tarafında toplanır). */
export interface SaglikGirdi {
  /** Hesabın planı (kota bandı için). */
  plan: string;
  /** Aylık doğrulama kotası (planTanim.dogrulamaKotasi). */
  kota: number;
  /** Son 30 gündeki toplam issued (kullanılan doğrulama). */
  aylikKullanim: number;

  /** Site verileri. */
  siteSayisi: number;
  dogrulanmisSite: number;
  /** Trafik almış (en az 1 issued) benzersiz site sayısı — widget entegre mi? */
  trafikliSite: number;

  /** Kural verileri. */
  kuralSayisi: number;
  /** Kullanıcı-tanımlı (system olmayan) kural sayısı. */
  ozelKural: number;

  /** AI ajan politikası sayısı (aiPolicies anahtar adedi). */
  aiPolitikaSayisi: number;
  /** Bağlı ve aktif entegrasyon sayısı. */
  aktifEntegrasyon: number;

  /** Ekip & yönetişim. */
  ekipUyeSayisi: number;
  aktifTokenSayisi: number;
  /** Denetim günlüğü kayıt sayısı (yönetişim etkinliği göstergesi). */
  denetimKayitSayisi: number;

  /** Operasyonel. */
  acikKritikAlarm: number;
  toplamAlarm: number;
  cozulenAlarm: number;

  /** Kullanım penceresindeki gün-bazlı kayıt sayısı (kaç ayrı gün aktif). */
  aktifGunSayisi: number;
  /** Son aktiflikten bu yana geçen tam gün (bugun - sonAktivite). */
  sonAktiflikGun: number;
}

/* ---------------------------------------------------------------- yardımcılar */

/** 0-100 aralığına kırp ve yuvarlak tamsayı yap. */
function kirp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Skordan durum sınıfı: 70+ iyi, 40+ orta, altı zayıf. */
function durumBul(skor: number): SaglikDurum {
  return skor >= 70 ? "iyi" : skor >= 40 ? "orta" : "zayif";
}

/**
 * Kullanım bandı puanı: benimsenme ne çok düşük ne de kotaya dayalı olmalı.
 * - oran < 0.02  → neredeyse hiç kullanılmıyor (benimsenmemiş) → düşük puan
 * - 0.10–0.75    → sağlıklı bant → tam puan
 * - > 0.90       → kotaya dayanmış (riskli) → puan düşer
 */
function kotaBantPuani(oran: number): number {
  if (oran <= 0) return 0;
  if (oran < 0.1) return 25 + (oran / 0.1) * 60; // 0→25, 0.1→85
  if (oran <= 0.75) return 100; // sağlıklı bant
  if (oran <= 0.9) return 100 - ((oran - 0.75) / 0.15) * 20; // 0.75→100, 0.9→80
  if (oran < 1) return 80 - ((oran - 0.9) / 0.1) * 30; // 0.9→80, 1.0→50
  return 45; // kota aşımı — sürekli baskı
}

/* ---------------------------------------------------------------- boyut hesaplayıcılar */

/** 1) Kurulum tamlığı: site doğrulama + widget (trafik) + kural tanımı. */
function boyutKurulum(g: SaglikGirdi): SaglikBoyut {
  const ayrinti: string[] = [];
  // Üç eşit alt-ölçüt: doğrulanmış site oranı, trafik oranı, en az bir kural.
  const dogrulamaOran = g.siteSayisi > 0 ? g.dogrulanmisSite / g.siteSayisi : 0;
  const trafikOran = g.siteSayisi > 0 ? g.trafikliSite / g.siteSayisi : 0;
  const kuralVar = g.kuralSayisi > 0 ? 1 : 0;

  const skor = kirp((dogrulamaOran * 40) + (trafikOran * 35) + (kuralVar * 25));

  if (g.siteSayisi === 0) ayrinti.push("Henüz site eklenmemiş");
  else {
    ayrinti.push(`${g.dogrulanmisSite}/${g.siteSayisi} site doğrulandı`);
    ayrinti.push(`${g.trafikliSite}/${g.siteSayisi} site canlı trafik alıyor`);
  }
  ayrinti.push(kuralVar ? `${g.kuralSayisi} kural tanımlı` : "Kural tanımlanmamış");

  let oneri: string;
  let link: string | undefined;
  if (g.siteSayisi === 0) {
    oneri = "İlk siteni ekleyip doğrula — koruma ancak doğrulamadan sonra devreye girer.";
    link = "/panel/siteler";
  } else if (dogrulamaOran < 1) {
    oneri = "Doğrulanmamış sitelerin sahiplik doğrulamasını tamamla.";
    link = "/panel/siteler";
  } else if (trafikOran < 1) {
    oneri = "Koruma kod parçacığını (widget) trafik almayan sitelere yerleştir.";
    link = "/panel/gelistirici";
  } else if (!kuralVar) {
    oneri = "En az bir koruma kuralı tanımla.";
    link = "/panel/kurallar";
  } else {
    oneri = "Kurulum tamam — tüm siteler doğrulanmış ve entegre.";
    link = "/panel/siteler";
  }

  return { anahtar: "kurulum", ad: "Kurulum Tamlığı", skor, agirlik: 0.25, durum: durumBul(skor), oneri, link, ayrinti };
}

/** 2) Aktif kullanım: trafik hacmi, aktif gün sayısı, sağlıklı kota bandı. */
function boyutKullanim(g: SaglikGirdi): SaglikBoyut {
  const oran = g.kota > 0 ? g.aylikKullanim / g.kota : 0;
  const bantPuan = kotaBantPuani(oran);

  // Aktif gün: son 30 günde kaç ayrı gün trafik oldu (0-30 → 0-100).
  const gunPuan = Math.min(100, (g.aktifGunSayisi / 20) * 100);

  // Son aktiflik: 0 gün = taze, 14+ gün = ölü.
  const tazelik = g.sonAktiflikGun <= 1 ? 100 : g.sonAktiflikGun >= 14 ? 0 : 100 - ((g.sonAktiflikGun - 1) / 13) * 100;

  const skor = kirp(bantPuan * 0.5 + gunPuan * 0.3 + tazelik * 0.2);

  const ayrinti = [
    `Kotanın %${Math.round(oran * 100)}'i kullanıldı`,
    `Son 30 günde ${g.aktifGunSayisi} aktif gün`,
    g.sonAktiflikGun <= 0 ? "Bugün aktif" : `Son aktiflik ${g.sonAktiflikGun} gün önce`,
  ];

  let oneri: string;
  let link = "/panel/analitik";
  if (g.aylikKullanim === 0) {
    oneri = "Hesap hiç doğrulama üretmiyor — entegrasyonu canlıya al ve trafik akıt.";
    link = "/panel/test-alani";
  } else if (oran > 0.9) {
    oneri = "Kotaya dayandın — planı yükselt ki koruma engellenmeye başlamasın.";
    link = "/panel/maliyet";
  } else if (oran < 0.1) {
    oneri = "Kullanım çok düşük — korumayı daha fazla trafiğe/uç noktaya yay.";
    link = "/panel/siteler";
  } else if (g.sonAktiflikGun >= 7) {
    oneri = "Bir haftadır trafik yok — entegrasyonun hâlâ canlı olduğunu doğrula.";
    link = "/panel/trafik";
  } else {
    oneri = "Kullanım sağlıklı bantta — düzenli ve dengeli.";
  }

  return { anahtar: "kullanim", ad: "Aktif Kullanım", skor, agirlik: 0.25, durum: durumBul(skor), oneri, link, ayrinti };
}

/** 3) Yapılandırma derinliği: özel kural, AI politikası, entegrasyon. */
function boyutYapilandirma(g: SaglikGirdi): SaglikBoyut {
  // Özel kural: 5+ tam puan. AI politika: 3+ tam. Entegrasyon: 1+ tam.
  const kuralPuan = Math.min(100, (g.ozelKural / 5) * 100);
  const aiPuan = Math.min(100, (g.aiPolitikaSayisi / 3) * 100);
  const entPuan = g.aktifEntegrasyon > 0 ? 100 : 0;

  const skor = kirp(kuralPuan * 0.45 + aiPuan * 0.3 + entPuan * 0.25);

  const ayrinti = [
    `${g.ozelKural} özel kural`,
    `${g.aiPolitikaSayisi} AI ajan politikası`,
    g.aktifEntegrasyon > 0 ? `${g.aktifEntegrasyon} aktif entegrasyon` : "Entegrasyon bağlı değil",
  ];

  let oneri: string;
  let link: string;
  if (g.ozelKural < 3) {
    oneri = "Kendi trafiğine özel koruma kuralları ekle — hazır varsayılanlar yetmez.";
    link = "/panel/kurallar";
  } else if (g.aiPolitikaSayisi < 3) {
    oneri = "AI ajanları için politika belirle (izin ver / doğrula / engelle).";
    link = "/panel/ai-ajanlar";
  } else if (g.aktifEntegrasyon === 0) {
    oneri = "Slack/Discord/Webhook entegrasyonu bağla — olaylardan haberdar ol.";
    link = "/panel/entegrasyonlar";
  } else {
    oneri = "Yapılandırma derin — kurallar, AI politikaları ve entegrasyonlar hazır.";
    link = "/panel/kurallar";
  }

  return { anahtar: "yapilandirma", ad: "Yapılandırma Derinliği", skor, agirlik: 0.2, durum: durumBul(skor), oneri, link, ayrinti };
}

/** 4) Ekip & yönetişim: ekip üyesi, token, denetim etkinliği. */
function boyutYonetisim(g: SaglikGirdi): SaglikBoyut {
  // Ekip: 2+ üye tam puan (tek-kişi hesap risklidir). Token: 1+ tam.
  const ekipPuan = Math.min(100, (g.ekipUyeSayisi / 2) * 100);
  const tokenPuan = g.aktifTokenSayisi > 0 ? 100 : 0;
  const denetimPuan = Math.min(100, (g.denetimKayitSayisi / 10) * 100);

  const skor = kirp(ekipPuan * 0.4 + tokenPuan * 0.3 + denetimPuan * 0.3);

  const ayrinti = [
    `${g.ekipUyeSayisi} ekip üyesi`,
    g.aktifTokenSayisi > 0 ? `${g.aktifTokenSayisi} aktif API anahtarı` : "API anahtarı yok",
    `${g.denetimKayitSayisi} denetim kaydı`,
  ];

  let oneri: string;
  let link: string;
  if (g.ekipUyeSayisi < 2) {
    oneri = "En az bir ekip üyesi davet et — tek-kişi hesaplar operasyonel risk taşır.";
    link = "/panel/ekip";
  } else if (g.aktifTokenSayisi === 0) {
    oneri = "Programatik erişim için bir API anahtarı oluştur.";
    link = "/panel/gelistirici";
  } else if (g.denetimKayitSayisi < 10) {
    oneri = "Yönetişim etkinliği düşük — düzenli gözden geçirme ve değişiklik izini artır.";
    link = "/panel/denetim";
  } else {
    oneri = "Ekip ve yönetişim sağlam — üyeler, anahtarlar ve denetim izi mevcut.";
    link = "/panel/ekip";
  }

  return { anahtar: "yonetisim", ad: "Ekip & Yönetişim", skor, agirlik: 0.15, durum: durumBul(skor), oneri, link, ayrinti };
}

/** 5) Operasyonel sağlık: açık kritik alarm (kötü) + çözülme oranı. */
function boyutOperasyon(g: SaglikGirdi): SaglikBoyut {
  // Çözülme oranı: çözülen / toplam. Alarm yoksa nötr sağlıklı sayılır.
  const cozulmeOran = g.toplamAlarm > 0 ? g.cozulenAlarm / g.toplamAlarm : 1;
  // Açık kritik alarm ceza: her biri -25 puan (4+ → 0).
  const kritikCeza = Math.min(100, g.acikKritikAlarm * 25);

  const skor = kirp(cozulmeOran * 100 - kritikCeza);

  const ayrinti = [
    g.acikKritikAlarm > 0 ? `${g.acikKritikAlarm} açık kritik olay` : "Açık kritik olay yok",
    `${g.cozulenAlarm}/${g.toplamAlarm} olay çözüldü`,
    `Çözülme oranı %${Math.round(cozulmeOran * 100)}`,
  ];

  let oneri: string;
  let link = "/panel/uyarilar";
  if (g.acikKritikAlarm > 0) {
    oneri = `${g.acikKritikAlarm} açık kritik olayı incele ve çöz — koruma etkinliğini riske atıyor.`;
  } else if (cozulmeOran < 0.6 && g.toplamAlarm > 0) {
    oneri = "Bekleyen olayların çözülme oranı düşük — olay kuyruğunu temizle.";
  } else {
    oneri = "Operasyon sağlıklı — açık kritik olay yok, olaylar çözülüyor.";
  }

  return { anahtar: "operasyon", ad: "Operasyonel Sağlık", skor, agirlik: 0.15, durum: durumBul(skor), oneri, link, ayrinti };
}

/* ---------------------------------------------------------------- kamu API */

/** Genel sağlık/olgunluk skorunu ve tüm boyutları hesapla. */
export function saglikHesap(girdi: SaglikGirdi): SaglikSonuc {
  const boyutlar = [
    boyutKurulum(girdi),
    boyutKullanim(girdi),
    boyutYapilandirma(girdi),
    boyutYonetisim(girdi),
    boyutOperasyon(girdi),
  ];

  // Ağırlıklı toplam (ağırlıklar 1'e toplanır ama yine de normalize edelim).
  const agirlikToplam = boyutlar.reduce((a, b) => a + b.agirlik, 0) || 1;
  const skor = kirp(boyutlar.reduce((a, b) => a + b.skor * b.agirlik, 0) / agirlikToplam);

  const kotaOran = girdi.kota > 0 ? girdi.aylikKullanim / girdi.kota : 0;
  const churn = churnRiski({ skor, boyutlar } as SaglikSonuc, kotaOran, girdi.sonAktiflikGun, girdi);

  // Sonraki adımlar: en zayıf boyutlar önce (skoru düşük olan üstte),
  // yalnızca "iyi" olmayanları göster.
  const sonrakiAdimlar = boyutlar
    .filter((b) => b.durum !== "iyi")
    .sort((a, b) => a.skor - b.skor)
    .map((b) => ({ anahtar: b.anahtar, ad: b.ad, oneri: b.oneri, link: b.link, skor: b.skor }));

  return {
    skor,
    seviye: saglikSeviye(skor),
    boyutlar,
    churn,
    sonrakiAdimlar,
    sinyaller: {
      kotaOran,
      sonAktiflikGun: girdi.sonAktiflikGun,
      aktifGunSayisi: girdi.aktifGunSayisi,
      aylikKullanim: girdi.aylikKullanim,
    },
  };
}

/**
 * Churn (bırakma) riskini hesapla. Sağlık özeti + kota oranı + son aktiflik
 * temel sinyaller; opsiyonel tam girdiyle daha zengin nedenler üretilir.
 */
export function churnRiski(
  saglik: Pick<SaglikSonuc, "skor" | "boyutlar">,
  kotaOran: number,
  sonAktiflikGun: number,
  girdi?: SaglikGirdi,
): ChurnSonuc {
  const nedenler: string[] = [];
  const aksiyonlar: string[] = [];
  let puan = 0;

  // 1) Düşük benimsenme — genel sağlık skoru düşükse en büyük churn sinyali.
  if (saglik.skor < 40) {
    puan += 45;
    nedenler.push("Genel benimsenme çok düşük — hesap ürünü neredeyse hiç kullanmıyor.");
    aksiyonlar.push("Onboarding'i tamamla: site doğrula, widget yerleştir, ilk kuralı ekle.");
  } else if (saglik.skor < 60) {
    puan += 22;
    nedenler.push("Benimsenme sınırlı — kurulumun bazı temel adımları eksik.");
    aksiyonlar.push("Eksik kurulum ve yapılandırma adımlarını tamamla.");
  }

  // 2) Kotaya dayalı + block davranışı → engellenme riski (kötü deneyim).
  if (kotaOran >= 0.9) {
    puan += 25;
    nedenler.push("Kotaya dayanmış — plan yetersiz kalıyor, koruma engellenebilir.");
    aksiyonlar.push("Planı yükselt veya kota politikasını gözden geçir.");
  } else if (kotaOran > 0 && kotaOran < 0.03) {
    puan += 18;
    nedenler.push("Kullanım neredeyse sıfır — ürün değeri henüz hissedilmemiş.");
    aksiyonlar.push("Korumayı gerçek trafik alan uç noktalara yay.");
  }

  // 3) Hareketsizlik (inactivity).
  if (sonAktiflikGun >= 14) {
    puan += 25;
    nedenler.push(`${sonAktiflikGun} gündür hiç trafik yok — hesap uykuda.`);
    aksiyonlar.push("Entegrasyonun canlı olduğunu doğrula; kesinti varsa gider.");
  } else if (sonAktiflikGun >= 7) {
    puan += 12;
    nedenler.push(`${sonAktiflikGun} gündür düşük etkinlik.`);
    aksiyonlar.push("Trafik akışını ve widget kurulumunu kontrol et.");
  }

  // 4) Çözülmemiş olaylar (operasyonel).
  if (girdi && girdi.acikKritikAlarm > 0) {
    puan += Math.min(20, girdi.acikKritikAlarm * 8);
    nedenler.push(`${girdi.acikKritikAlarm} açık kritik olay çözülmeyi bekliyor.`);
    aksiyonlar.push("Açık kritik olayları önceliklendir ve kapat.");
  }

  // 5) Tek-kişi hesap — tek nokta bağımlılık, kurumsal olmayan kullanım.
  if (girdi && girdi.ekipUyeSayisi < 2) {
    puan += 8;
    nedenler.push("Tek-kişi hesap — ekip benimsemesi yok, bırakma kolay.");
    aksiyonlar.push("Ekip üyesi davet ederek kurumsal bağımlılığı artır.");
  }

  const p = Math.max(0, Math.min(100, Math.round(puan)));
  const seviye: ChurnSeviye = p >= 50 ? "yuksek" : p >= 25 ? "orta" : "dusuk";

  if (nedenler.length === 0) {
    nedenler.push("Belirgin churn sinyali yok — hesap sağlıklı ve benimsenmiş.");
    aksiyonlar.push("Mevcut sağlıklı kullanımı sürdür; düzenli gözden geçirme yeterli.");
  }

  return { seviye, puan: p, nedenler, aksiyonlar };
}

/** Genel skordan olgunluk seviyesi. */
export function saglikSeviye(skor: number): SaglikSeviyeAd {
  if (skor >= 85) return "mükemmel";
  if (skor >= 65) return "iyi";
  if (skor >= 40) return "gelişmeli";
  return "riskli";
}
