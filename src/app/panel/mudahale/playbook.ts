/**
 * Specter — Olay Müdahale Playbook Motoru (saf yardımcı)
 * =====================================================
 * SOC olay-müdahale runbook'ları. Her saldırı türü için önceden yazılmış,
 * fazlara ayrılmış (tespit → sınırlama → engelleme → doğrulama → kapanış)
 * adım-adım müdahale planı. PagerDuty/Torq runbook mantığı.
 *
 * Bu dosya SAF/DETERMINISTIK'tir: DB yazımı yok, rastgelelik yok. Gerçek
 * trafik (BotEvent) yalnızca HANGI playbook'un ŞU AN tetiklendiğini saymak
 * için okunur (playbookTetikle). Adımı işaretlemek yalnızca operatörün
 * niyetini kaydeder — üretimde bir mutasyon yapmaz (istemci bunu net söyler).
 *
 * NOT: src/lib/specter/* dosyaları yasak; bu yardımcı panel-yerelidir.
 */

import type { BotClass } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Tipler */

/** Müdahale fazları — SOC yaşam döngüsü (sabit sıra). */
export type Faz = "tespit" | "sınırlama" | "engelleme" | "doğrulama" | "kapanış";

/** Fazların kanonik sırası — playbook adımları bu düzeni izler. */
export const FAZ_SIRA: Faz[] = ["tespit", "sınırlama", "engelleme", "doğrulama", "kapanış"];

/** Faz insan-okur etiketleri (istemci UI için). */
export const FAZ_ETIKET: Record<Faz, string> = {
  tespit: "Tespit",
  sınırlama: "Sınırlama",
  engelleme: "Engelleme",
  doğrulama: "Doğrulama",
  kapanış: "Kapanış",
};

/** Bir adımdan kimin sorumlu olduğu. */
export type Sorumlu = "Specter" | "Operatör" | "Güvenlik Ekibi";

/** Playbook şiddet seviyesi. */
export type Siddet = "kritik" | "yuksek" | "orta";

/** Tek bir müdahale adımı. */
export interface Adim {
  /** Playbook içinde 1'den artan sıra numarası (fazlar bu sırayla dizilir). */
  sira: number;
  /** Adımın ait olduğu müdahale fazı. */
  faz: Faz;
  /** Kısa adım başlığı. */
  baslik: string;
  /** Somut, uygulanabilir aksiyon (ne yapılacağı). */
  aksiyon: string;
  /** Specter bunu otomatik yapabilir mi (true) yoksa elle mi (false). */
  otomatik: boolean;
  /** Bu adımdan sorumlu taraf. */
  sorumlu: Sorumlu;
  /** Tahmini süre (dakika). */
  tahminiDk: number;
  /** İlgili Specter panel bağlantısı (adımı yürütmek için) — opsiyonel. */
  ilgiliPanel?: string;
}

/** Tam bir olay-müdahale playbook'u (bir saldırı türüne karşılık). */
export interface Playbook {
  id: string;
  /** Playbook adı. */
  ad: string;
  /** Tetikleyici saldırı türü (insan-okur). */
  tetikleyici: string;
  /** Bu playbook'u tetikleyen bot sınıfları (gerçek olaylarla eşleşir). */
  botClasslar: BotClass[];
  /** Şiddet seviyesi. */
  siddet: Siddet;
  /** Kısa açıklama — ne zaman çalıştırılır. */
  aciklama: string;
  /** Tüm playbook için tahmini toplam süre (dakika). */
  tahminiSure: number;
  /** Sıralı adımlar (faz düzeninde). */
  adimlar: Adim[];
}

/* ------------------------------------------------------------------ Katalog */

/**
 * PLAYBOOKLAR — 6 önceden yazılmış runbook. Her biri gerçekçi, fazlara
 * ayrılmış SOC müdahale adımları içerir. Adım sıraları fazlar boyunca
 * artar (tespit → … → kapanış).
 */
export const PLAYBOOKLAR: Playbook[] = [
  /* --- 1) Kimlik Doldurma Dalgası --- */
  {
    id: "kimlik-doldurma",
    ad: "Kimlik Doldurma Dalgası",
    tetikleyici: "Credential Stuffing Surge",
    botClasslar: ["credential_stuffing"],
    siddet: "kritik",
    aciklama:
      "Çalınmış kullanıcı-adı/parola listeleriyle giriş uçlarına toplu deneme. Hesap ele geçirmeye (ATO) evrilmeden sınırla ve engelle.",
    tahminiSure: 34,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "Giriş uçlarındaki başarısız-oran patlamasını doğrula",
        aksiyon: "Canlı konsolda /login yolundaki 401/başarısız oranını ve credential_stuffing kararlarını incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "Kaynak ASN ve ülke yoğunluğunu çıkar",
        aksiyon: "Saldırının yoğunlaştığı ASN'leri ve coğrafyaları tespit et; botnet mi tek-kaynak mı ayırt et.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 4,
        ilgiliPanel: "/panel/geo-risk",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "Giriş ucuna agresif rate-limit uygula",
        aksiyon: "IP başına dakikalık istek eşiğini düşür; ani artışları geçici olarak yavaşlat.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/rate-politika",
      },
      {
        sira: 4, faz: "sınırlama",
        baslik: "Şüpheli oturumlara zorunlu challenge",
        aksiyon: "Düşük insanlık skorlu giriş isteklerine görünmez/aktif challenge zorla.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 2,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 5, faz: "engelleme",
        baslik: "Kötü ASN/IP kümesini engelle",
        aksiyon: "Tespit edilen saldırgan ASN ve IP aralıklarını engelleme kuralına ekle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 5,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 6, faz: "doğrulama",
        baslik: "Başarısız-oranın normale döndüğünü teyit et",
        aksiyon: "Sınırlama sonrası giriş başarısız-oranını izle; ele geçirilen hesap var mı kontrol et.",
        otomatik: false, sorumlu: "Güvenlik Ekibi", tahminiDk: 8,
        ilgiliPanel: "/panel/hesap-saglik",
      },
      {
        sira: 7, faz: "kapanış",
        baslik: "Olayı belgele ve geçici kuralları gözden geçir",
        aksiyon: "Müdahaleyi denetim günlüğüne işle; geçici rate-limit/engelleri kalıcı mı yapacağına karar ver.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 9,
        ilgiliPanel: "/panel/denetim-export",
      },
    ],
  },

  /* --- 2) DDoS Sel Saldırısı --- */
  {
    id: "ddos-sel",
    ad: "DDoS Sel Saldırısı",
    tetikleyici: "DDoS Flood",
    botClasslar: ["ddos"],
    siddet: "kritik",
    aciklama:
      "Kaynağı tüketmeye yönelik yüksek-hacimli istek seli. Servisi ayakta tutmak için hızla sınırla, kötü kaynakları engelle.",
    tahminiSure: 28,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "İstek hacmi patlamasını ve RPS zirvesini doğrula",
        aksiyon: "Canlı konsolda saniyelik istek (RPS) eğrisini ve ddos kararlarının payını incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 2,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "Saldırı yüzeyini ve hedef yolları belirle",
        aksiyon: "En çok vurulan yolları ve kaynak ASN dağılımını çıkar; hacimsel mi uygulama-katmanı mı ayırt et.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/saldiri-yuzeyi",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "Global rate-limit ve koruma modunu yükselt",
        aksiyon: "Site koruma modunu 'block'a yaklaştır; global istek eşiğini geçici olarak sıkılaştır.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/rate-politika",
      },
      {
        sira: 4, faz: "engelleme",
        baslik: "Saldırgan ASN/coğrafyayı toplu engelle",
        aksiyon: "Selin geldiği ASN ve yüksek-riskli ülkeleri engelleme kuralıyla kapat.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 5,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 5, faz: "engelleme",
        baslik: "Edge/CDN önünde ek koruma iste",
        aksiyon: "Hacim taşarsa üst-katman (edge) sağlayıcıda challenge/kara-liste devreye al.",
        otomatik: false, sorumlu: "Güvenlik Ekibi", tahminiDk: 6,
        ilgiliPanel: "/panel/edge",
      },
      {
        sira: 6, faz: "doğrulama",
        baslik: "Servis sağlığının stabilize olduğunu teyit et",
        aksiyon: "Uptime ve gecikme metriklerinin normale döndüğünü, meşru trafiğin geçtiğini doğrula.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 5,
        ilgiliPanel: "/panel/uptime",
      },
      {
        sira: 7, faz: "kapanış",
        baslik: "Geçici sıkılaştırmaları geri al ve raporla",
        aksiyon: "Sel dindikten sonra abartılı eşikleri normale çek; olay sonrası rapor üret.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/rapor-studyo",
      },
    ],
  },

  /* --- 3) Kazıyıcı Kampanyası --- */
  {
    id: "kaziyici-kampanya",
    ad: "Kazıyıcı Kampanyası",
    tetikleyici: "Scraper Campaign",
    botClasslar: ["scraper", "automation"],
    siddet: "yuksek",
    aciklama:
      "İçeriği/fiyatı sistemli kazıyan otomasyon botları. Veri kaçışını sınırla, headless/otomasyon imzalarını engelle.",
    tahminiSure: 26,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "Kazıma desenini ve hedef içeriği doğrula",
        aksiyon: "Sıralı/derin gezinme desenlerini, scraper ve automation kararlarını canlı konsolda incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "Headless/otomasyon imzalarını çıkar",
        aksiyon: "TLS/UA uyumsuzluğu, webdriver ve headless sinyallerini parmak izi istihbaratından topla.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 4,
        ilgiliPanel: "/panel/tls-istihbarat",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "Kazıma yollarına oturum-başı kota koy",
        aksiyon: "Yoğun kazınan uçlara sayfalama/kota sınırı ve yavaşlatma uygula.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/rate-politika",
      },
      {
        sira: 4, faz: "engelleme",
        baslik: "Headless & TLS-uyumsuz trafiği engelle",
        aksiyon: "headless=true ve TLS/UA uyumsuz koşullarını yakalayan engelleme kuralı oluştur.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 5,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 5, faz: "doğrulama",
        baslik: "Kuralı sandbox'ta test et, yan-etki yok",
        aksiyon: "Yeni engelleme kuralını sandbox'ta örnek olaylara karşı çalıştır; meşru bot (Googlebot) etkilenmiyor mu doğrula.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 4,
        ilgiliPanel: "/panel/sandbox",
      },
      {
        sira: 6, faz: "doğrulama",
        baslik: "Kazıma hacminin düştüğünü teyit et",
        aksiyon: "Engelleme sonrası scraper/automation kararlarının azaldığını izle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 7, faz: "kapanış",
        baslik: "Kuralı kalıcılaştır ve olayı belgele",
        aksiyon: "Etkili kuralı kalıcı yap; müdahaleyi denetim izine işle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 3,
        ilgiliPanel: "/panel/denetim-export",
      },
    ],
  },

  /* --- 4) AI Eğitim Taraması --- */
  {
    id: "ai-egitim-tarama",
    ad: "AI Eğitim Taraması",
    tetikleyici: "AI-Training Crawl",
    botClasslar: ["ai_agent"],
    siddet: "orta",
    aciklama:
      "Model eğitimi için içeriği toplayan AI ajan tarayıcıları (GPTBot/ClaudeBot vb.). Politika uygula, izinsiz taramayı engelle.",
    tahminiSure: 22,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "AI ajan trafiğini ve kategorisini doğrula",
        aksiyon: "ai_agent kararlarını, hangi ajanların (model-eğitimi kategorisi) tarama yaptığını incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/tehdit-aktor",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "robots.txt uyumunu kontrol et",
        aksiyon: "Ajanların robots yönergelerine uyup uymadığını, izinsiz yol taraması olup olmadığını denetle.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/robots-uyum",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "AI ajan politikasını 'doğrula'ya çek",
        aksiyon: "İzinsiz eğitim taraması yapan ajanları 'izin' yerine 'doğrula' politikasına al.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 2,
        ilgiliPanel: "/panel/ai-dogrulama",
      },
      {
        sira: 4, faz: "engelleme",
        baslik: "Model-eğitimi kategorisini engelle",
        aksiyon: "aiCategory=model_egitimi koşulunu yakalayan engelleme kuralı uygula (canlı-getirmeyi bozmadan).",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 5, faz: "doğrulama",
        baslik: "Meşru AI getirmenin etkilenmediğini teyit et",
        aksiyon: "Canlı-getirme/arama-indeksi ajanlarının hâlâ geçtiğini, yalnızca eğitim taramasının kesildiğini doğrula.",
        otomatik: false, sorumlu: "Güvenlik Ekibi", tahminiDk: 6,
        ilgiliPanel: "/panel/robots-uyum",
      },
      {
        sira: 6, faz: "kapanış",
        baslik: "Politikayı belgele ve paydaşları bilgilendir",
        aksiyon: "AI erişim politikasını güncelle; kararı denetim günlüğüne işle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/denetim-export",
      },
    ],
  },

  /* --- 5) Hesap Ele Geçirme (ATO) --- */
  {
    id: "hesap-ele-gecirme",
    ad: "Hesap Ele Geçirme (ATO)",
    tetikleyici: "Account Takeover",
    botClasslar: ["credential_stuffing", "automation"],
    siddet: "kritik",
    aciklama:
      "Başarılı giriş sonrası ele geçirilen hesaplarda anormal davranış. Oturumları kes, hesapları koru, kök nedeni kapat.",
    tahminiSure: 38,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "Şüpheli başarılı girişleri ve oturum anomalilerini doğrula",
        aksiyon: "Yeni-cihaz/coğrafya sıçraması olan başarılı girişleri ve oturum güvenlik anomalilerini incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 4,
        ilgiliPanel: "/panel/oturum-guvenlik",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "Etkilenen hesap kümesini çıkar",
        aksiyon: "Hesap sağlığı panelinde risk skoru yükselen hesapları listele; etki alanını belirle.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 5,
        ilgiliPanel: "/panel/hesap-saglik",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "Şüpheli oturumları geçersiz kıl",
        aksiyon: "Ele geçirilmiş oturumları zorla sonlandır; hassas işlemler için ek doğrulama iste.",
        otomatik: false, sorumlu: "Güvenlik Ekibi", tahminiDk: 6,
        ilgiliPanel: "/panel/oturum-guvenlik",
      },
      {
        sira: 4, faz: "sınırlama",
        baslik: "Etkilenen hesaplara parola sıfırlama zorla",
        aksiyon: "Riskli hesaplarda parola sıfırlama ve MFA yeniden-kayıt akışını tetikle.",
        otomatik: false, sorumlu: "Güvenlik Ekibi", tahminiDk: 8,
        ilgiliPanel: "/panel/hesap-saglik",
      },
      {
        sira: 5, faz: "engelleme",
        baslik: "Kaynak IP/ASN'leri engelle",
        aksiyon: "Ele geçirmenin geldiği IP ve ASN'leri engelleme kuralına ekle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 6, faz: "doğrulama",
        baslik: "Anormal aktivitenin durduğunu teyit et",
        aksiyon: "Korunan hesaplarda anormal işlemlerin kesildiğini, yeni ele geçirme olmadığını izle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 7,
        ilgiliPanel: "/panel/oturum-guvenlik",
      },
      {
        sira: 7, faz: "kapanış",
        baslik: "Olayı raporla ve kalıcı korumaları planla",
        aksiyon: "Etki, zaman çizelgesi ve alınan aksiyonları belgele; kalıcı ATO korumasını planla.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/rapor-studyo",
      },
    ],
  },

  /* --- 6) Şüpheli Otomasyon Artışı (jenerik) --- */
  {
    id: "supheli-otomasyon",
    ad: "Şüpheli Otomasyon Artışı",
    tetikleyici: "Suspicious Automation Spike",
    botClasslar: ["automation", "spam"],
    siddet: "orta",
    aciklama:
      "Sınıflandırması netleşmemiş ama insan-dışı otomasyon/spam artışı. Sınıflandır, sınırla, uygun playbook'a yönlendir.",
    tahminiSure: 20,
    adimlar: [
      {
        sira: 1, faz: "tespit",
        baslik: "Otomasyon/spam artışını doğrula",
        aksiyon: "automation ve spam kararlarındaki ani yükselişi ve zaman desenini canlı konsolda incele.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 2,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 2, faz: "tespit",
        baslik: "Saldırıyı sınıflandır (hangi türe yakın?)",
        aksiyon: "Hedef yollar ve imzalara bakarak kazıma/kimlik-doldurma/DDoS'e mi kaydığını belirle.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/anomali-akis",
      },
      {
        sira: 3, faz: "sınırlama",
        baslik: "Geçici rate-limit ve gözlem moduna al",
        aksiyon: "Şüpheli kaynaklara geçici rate-limit koy; koruma modunu 'monitor'dan 'challenge'a yükselt.",
        otomatik: true, sorumlu: "Specter", tahminiDk: 3,
        ilgiliPanel: "/panel/rate-politika",
      },
      {
        sira: 4, faz: "engelleme",
        baslik: "Netleşen kötü kaynakları engelle",
        aksiyon: "Doğrulanan zararlı IP/ASN'leri engelle; belirsizleri gözlemde tut.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/kurallar",
      },
      {
        sira: 5, faz: "doğrulama",
        baslik: "Artışın düştüğünü ve yanlış-pozitif olmadığını teyit et",
        aksiyon: "Şüpheli trafiğin azaldığını, meşru kullanıcıların engellenmediğini doğrula.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/canli-konsol",
      },
      {
        sira: 6, faz: "kapanış",
        baslik: "Uygun özel playbook'a devret ve belgele",
        aksiyon: "Tür netleştiyse ilgili özel playbook'u başlat; müdahaleyi denetim günlüğüne işle.",
        otomatik: false, sorumlu: "Operatör", tahminiDk: 4,
        ilgiliPanel: "/panel/denetim-export",
      },
    ],
  },
];

/* ------------------------------------------------------------------ Tetikleme */

/**
 * Son olayları her playbook'un bot sınıflarıyla eşleştirip kaç olayın
 * eşleştiğini sayar. Eşik aşılırsa playbook "aktif" (gerçek trafikle
 * tetikleniyor) işaretlenir. Tetik sayısına göre azalan sıralanır.
 *
 * @param events  Gerçek BotEvent listesi (yalnızca botClass okunur).
 * @param esik    Aktif sayılması için minimum eşleşen olay sayısı.
 */
export interface TetikDurumu {
  playbook: Playbook;
  /** Bu playbook'un bot sınıflarıyla eşleşen olay sayısı. */
  tetikSayisi: number;
  /** Eşik aşıldı mı (gerçek trafikle şu an tetikleniyor mu). */
  aktif: boolean;
}

export function playbookTetikle(
  events: { botClass: BotClass }[],
  esik = 5,
): TetikDurumu[] {
  // Bot sınıfı başına olay say (tek geçiş).
  const sayac = new Map<BotClass, number>();
  for (const e of events) {
    sayac.set(e.botClass, (sayac.get(e.botClass) ?? 0) + 1);
  }
  const sonuc: TetikDurumu[] = PLAYBOOKLAR.map((p) => {
    const tetikSayisi = p.botClasslar.reduce((t, bc) => t + (sayac.get(bc) ?? 0), 0);
    return { playbook: p, tetikSayisi, aktif: tetikSayisi >= esik };
  });
  // Tetik sayısına göre azalan; eşitlikte katalog sırası korunur (kararlı).
  return sonuc.sort((a, b) => b.tetikSayisi - a.tetikSayisi);
}

/* ------------------------------------------------------------------ İlerleme */

/**
 * Verilen tamamlanan adım sıralarına göre bir playbook'un ilerlemesini
 * hesaplar (saf). Hangi fazlar tamamen bitti, sıradaki adım hangisi.
 */
export interface Ilerleme {
  /** Tamamlanma yüzdesi (0..100, tam sayı). */
  yuzde: number;
  /** Kalan (tamamlanmamış) adım sayısı. */
  kalanAdim: number;
  /** Tüm adımları tamamlanmış fazlar. */
  tamamlananFaz: Faz[];
  /** Sıradaki (ilk tamamlanmamış) adım — hepsi bittiyse null. */
  sonrakiAdim: Adim | null;
}

export function playbookIlerleme(playbook: Playbook, tamamlananSiralar: number[]): Ilerleme {
  const tamam = new Set(tamamlananSiralar);
  const toplam = playbook.adimlar.length;
  const bitenSayi = playbook.adimlar.filter((a) => tamam.has(a.sira)).length;
  const yuzde = toplam === 0 ? 0 : Math.round((bitenSayi / toplam) * 100);
  const kalanAdim = toplam - bitenSayi;

  // Bir faz "tamamlandı" ise o fazdaki TÜM adımlar işaretlenmiş demektir.
  const tamamlananFaz: Faz[] = FAZ_SIRA.filter((faz) => {
    const fazAdimlari = playbook.adimlar.filter((a) => a.faz === faz);
    return fazAdimlari.length > 0 && fazAdimlari.every((a) => tamam.has(a.sira));
  });

  // Sıradaki adım: sıra numarasına göre ilk tamamlanmamış olan.
  const sirali = [...playbook.adimlar].sort((a, b) => a.sira - b.sira);
  const sonrakiAdim = sirali.find((a) => !tamam.has(a.sira)) ?? null;

  return { yuzde, kalanAdim, tamamlananFaz, sonrakiAdim };
}

/**
 * Bir playbook'ta kaç adımın Specter tarafından otomatikleştirilebildiğini
 * ve otomasyon yüzdesini hesaplar (istemci "otomasyon vurgusu" için).
 */
export function otomasyonOrani(playbook: Playbook): { otomatik: number; manuel: number; yuzde: number } {
  const otomatik = playbook.adimlar.filter((a) => a.otomatik).length;
  const manuel = playbook.adimlar.length - otomatik;
  const yuzde = playbook.adimlar.length === 0 ? 0 : Math.round((otomatik / playbook.adimlar.length) * 100);
  return { otomatik, manuel, yuzde };
}
