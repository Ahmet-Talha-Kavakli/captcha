/**
 * Specter — Uyum Çerçeveleri & Kontroller
 * ========================================
 * SOC 2, ISO 27001, KVKK ve GDPR uyum çerçevelerinin kontrol katalogları ve
 * her kontrolün Specter'daki karşılık gelen özellik/kanıtı. Kurumsal
 * müşteriler denetim hazırlığını buradan izler (Vanta/Drata benzeri).
 *
 * NOT: Deterministik, temsili kontrol seti. Gerçek denetim resmi bir süreçtir;
 * bu modül hazırlık ve öz-değerlendirme aracıdır.
 */

export type CerceveKey = "soc2" | "iso27001" | "kvkk" | "gdpr";
export type KontrolDurum = "tamam" | "kismi" | "eksik" | "gecerli-degil";

export interface Kontrol {
  id: string;
  ad: string;
  aciklama: string;
  /** Specter'ın bu kontrolü nasıl karşıladığı (kanıt). */
  kanit: string;
  durum: KontrolDurum;
  kategori: string;
}

export interface Cerceve {
  key: CerceveKey;
  ad: string;
  tamAd: string;
  aciklama: string;
  renk: string;
  ikon: string;
  kontroller: Kontrol[];
}

export const CERCEVELER: Cerceve[] = [
  {
    key: "soc2",
    ad: "SOC 2",
    tamAd: "SOC 2 Type II",
    aciklama: "Güvenlik, erişilebilirlik ve gizlilik güven hizmet kriterleri.",
    renk: "#2f6fed",
    ikon: "ShieldCheck",
    kontroller: [
      { id: "CC6.1", ad: "Mantıksal erişim kontrolü", aciklama: "Yetkisiz erişim engellenir.", kanit: "Rol-bazlı erişim kontrolü (RBAC) — 4 rol × 6 yetenek izin matrisi.", durum: "tamam", kategori: "Erişim" },
      { id: "CC6.6", ad: "Aktarımda şifreleme", aciklama: "Veri aktarımı şifrelenir.", kanit: "Tüm API uçları HTTPS; webhook'lar HMAC-SHA256 imzalı.", durum: "tamam", kategori: "Şifreleme" },
      { id: "CC6.7", ad: "Kimlik doğrulama", aciklama: "Güçlü kimlik doğrulama uygulanır.", kanit: "Cookie oturum + scrypt parola + 2FA (TOTP) desteği.", durum: "tamam", kategori: "Kimlik" },
      { id: "CC7.2", ad: "Anomali tespiti", aciklama: "Anormal aktivite izlenir.", kanit: "Gerçek-zaman anomali tespit motoru (z-skor + davranış biyometrisi).", durum: "tamam", kategori: "İzleme" },
      { id: "CC7.3", ad: "Olay müdahalesi", aciklama: "Güvenlik olayları yönetilir.", kanit: "Olay Yönetimi modülü (atama/durum/timeline/MTTR).", durum: "tamam", kategori: "Müdahale" },
      { id: "CC8.1", ad: "Değişiklik yönetimi", aciklama: "Değişiklikler kaydedilir.", kanit: "Değişmez denetim günlüğü (SHA-256 hash zinciri, WORM).", durum: "tamam", kategori: "Denetim" },
      { id: "A1.2", ad: "Erişilebilirlik izleme", aciklama: "Servis sağlığı izlenir.", kanit: "Uptime & Servis Sağlığı modülü (%99.9 SLA, 90g geçmiş).", durum: "tamam", kategori: "Erişilebilirlik" },
      { id: "C1.1", ad: "Veri sınıflandırma", aciklama: "Gizli veri korunur.", kanit: "Sırlar maskeli yedekleme; ownerId veri izolasyonu.", durum: "kismi", kategori: "Gizlilik" },
    ],
  },
  {
    key: "iso27001",
    ad: "ISO 27001",
    tamAd: "ISO/IEC 27001:2022",
    aciklama: "Bilgi güvenliği yönetim sistemi (BGYS) standardı.",
    renk: "#7c3aed",
    ikon: "Award",
    kontroller: [
      { id: "A.5.15", ad: "Erişim kontrolü", aciklama: "Erişim iş ihtiyacına göre.", kanit: "RBAC + rol önizleme + yetenek matrisi.", durum: "tamam", kategori: "Erişim" },
      { id: "A.8.16", ad: "İzleme faaliyetleri", aciklama: "Ağlar ve sistemler izlenir.", kanit: "Canlı trafik (SSE) + tehdit istihbaratı + edge ağı izleme.", durum: "tamam", kategori: "İzleme" },
      { id: "A.8.23", ad: "Web filtreleme", aciklama: "Kötü niyetli trafik filtrelenir.", kanit: "Kural motoru + tehdit besleme (Tor/bulletproof/botnet) + AI ajan filtresi.", durum: "tamam", kategori: "Filtreleme" },
      { id: "A.8.24", ad: "Kriptografi kullanımı", aciklama: "Şifreleme politikası uygulanır.", kanit: "HMAC token imzalama, nonce replay koruması, ghost-font.", durum: "tamam", kategori: "Kripto" },
      { id: "A.5.7", ad: "Tehdit istihbaratı", aciklama: "Tehdit bilgisi toplanır.", kanit: "AI ajan istihbaratı + global tehdit haritası + besleme.", durum: "tamam", kategori: "İstihbarat" },
      { id: "A.8.15", ad: "Loglama", aciklama: "Olaylar loglanır.", kanit: "Denetim günlüğü (hash zinciri) + gerçek kullanım ölçümü.", durum: "tamam", kategori: "Loglama" },
      { id: "A.5.30", ad: "İş sürekliliği", aciklama: "BT hazırlığı sağlanır.", kanit: "Veri yedekleme/geri yükleme + çok-bölgeli edge + failover.", durum: "kismi", kategori: "Süreklilik" },
    ],
  },
  {
    key: "kvkk",
    ad: "KVKK",
    tamAd: "6698 Sayılı Kişisel Verilerin Korunması Kanunu",
    aciklama: "Türkiye kişisel veri koruma mevzuatı.",
    renk: "#16a34a",
    ikon: "Landmark",
    kontroller: [
      { id: "M.12", ad: "Veri güvenliği", aciklama: "Uygun güvenlik tedbirleri.", kanit: "Şifreleme + erişim kontrolü + anomali tespiti + denetim.", durum: "tamam", kategori: "Güvenlik" },
      { id: "M.11", ad: "Veri taşınabilirliği", aciklama: "İlgili kişi verisini alabilir.", kanit: "Veri dışa aktarma (JSON) — hesap yapılandırma ihracı.", durum: "tamam", kategori: "Haklar" },
      { id: "M.7", ad: "Veri silme/imha", aciklama: "Veri talep üzerine silinir.", kanit: "Hesap silme — tüm bağlı veriyi kalıcı temizler.", durum: "tamam", kategori: "İmha" },
      { id: "M.4", ad: "Veri minimizasyonu", aciklama: "Amaçla sınırlı veri.", kanit: "Ghost-font kişisel veri toplamaz; yalnızca davranış sinyalleri.", durum: "tamam", kategori: "İlke" },
      { id: "M.10", ad: "Aydınlatma", aciklama: "İlgili kişi bilgilendirilir.", kanit: "Widget gizlilik/şartlar linkleri; şeffaf sinyal toplama.", durum: "kismi", kategori: "Şeffaflık" },
      { id: "VERBIS", ad: "VERBİS kaydı", aciklama: "Veri sorumluları siciline kayıt.", kanit: "Manuel süreç — Veylify kanıt sağlar ama kayıt kullanıcı sorumluluğunda.", durum: "gecerli-degil", kategori: "Kayıt" },
    ],
  },
  {
    key: "gdpr",
    ad: "GDPR",
    tamAd: "Genel Veri Koruma Tüzüğü (AB)",
    aciklama: "Avrupa Birliği veri koruma tüzüğü.",
    renk: "#d97706",
    ikon: "Globe",
    kontroller: [
      { id: "Art.32", ad: "İşleme güvenliği", aciklama: "Uygun teknik tedbirler.", kanit: "Şifreleme + RBAC + izleme + değişmez log.", durum: "tamam", kategori: "Güvenlik" },
      { id: "Art.20", ad: "Veri taşınabilirliği", aciklama: "Yapılandırılmış veri ihracı.", kanit: "JSON yedekleme dışa aktarma.", durum: "tamam", kategori: "Haklar" },
      { id: "Art.17", ad: "Unutulma hakkı", aciklama: "Silme talebi.", kanit: "Hesap silme akışı.", durum: "tamam", kategori: "Haklar" },
      { id: "Art.25", ad: "Tasarımda gizlilik", aciklama: "Privacy by design.", kanit: "Ghost-font ilkesi; minimum veri; sır maskeleme.", durum: "tamam", kategori: "İlke" },
      { id: "Art.33", ad: "İhlal bildirimi", aciklama: "72 saat içinde bildirim.", kanit: "Olay yönetimi + bildirim merkezi + entegrasyonlar (Slack/e-posta).", durum: "kismi", kategori: "İhlal" },
    ],
  },
];

/** Bir çerçevenin hazırlık skorunu hesapla (tamam=1, kısmi=0.5, eksik=0, N/A hariç). */
export function hazirlikSkoru(c: Cerceve): { skor: number; tamam: number; kismi: number; eksik: number; toplam: number } {
  const sayilan = c.kontroller.filter((k) => k.durum !== "gecerli-degil");
  const tamam = sayilan.filter((k) => k.durum === "tamam").length;
  const kismi = sayilan.filter((k) => k.durum === "kismi").length;
  const eksik = sayilan.filter((k) => k.durum === "eksik").length;
  const skor = sayilan.length ? Math.round(((tamam + kismi * 0.5) / sayilan.length) * 100) : 0;
  return { skor, tamam, kismi, eksik, toplam: sayilan.length };
}
