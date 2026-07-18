/**
 * Specter — Entegrasyon Sağlık Hesaplayıcı (SAF / deterministik)
 * ==============================================================
 * Bağlı entegrasyonların (Slack/Discord/Teams/webhook/PagerDuty/e-posta/Zapier)
 * teslimat sağlığını, kurulum doğrulamasını ve olay-tipi kapsamasını hesaplar.
 *
 * SAFLIK KURALI: Bu dosyadaki HİÇBİR fonksiyon `Date.now()`, `Math.random()`
 * veya argümansız `new Date()` çağırmaz. "Şimdi" (now) her zaman dışarıdan
 * parametre olarak verilir → aynı girdi her zaman aynı çıktıyı üretir
 * (test edilebilir, sunucu/istemci tutarlı).
 *
 * Entegrasyon modeli alanları (schema.ts · Integration):
 *   id, ownerId, tur, ad, hedef, olaylar[], aktif,
 *   createdAt, lastDelivery (number|null), lastStatus (number|null), gonderilen
 */

import type { Integration, IntegrationTur } from "@/lib/db/schema";
import { OLAY_TURLERI } from "./integrations";

/** Bir entegrasyonun sağlık durumu (renk/sıralama için ayrık sınıflar). */
export type SaglikDurum = "saglikli" | "uyari" | "bozuk" | "pasif";

/** Sağlık eşiği: bir teslimat "eski" sayılır mı (varsayılan 24 saat). */
export const BAYAT_ESIK_MS = 24 * 60 * 60 * 1000;
/** Uyarı eşiği: son teslimat bu süreden eskiyse (ama başarısız değilse) "uyarı". */
export const UYARI_ESIK_MS = 72 * 60 * 60 * 1000;

/** HTTP durum kodu başarılı (2xx) mı? 0 = bağlantı hatası. */
export function basariliMi(status: number | null): boolean {
  return status !== null && status >= 200 && status < 300;
}

/** Bir entegrasyonun tek bir kurulum doğrulama kontrolü. */
export interface DogrulamaKontrol {
  /** Kontrol anahtarı (stabil). */
  anahtar: "hedef" | "olay" | "aktif" | "teslimat";
  /** İnsan-okur etiket. */
  etiket: string;
  /** Geçti mi? */
  gecti: boolean;
  /** Kritik mi (bu geçmezse entegrasyon işe yaramaz) yoksa uyarı mı. */
  kritik: boolean;
  /** Neden geçmedi / geçti (kısa açıklama). */
  detay: string;
}

/** Tek bir entegrasyonun hesaplanmış sağlık raporu. */
export interface EntegrasyonSaglik {
  id: string;
  tur: IntegrationTur;
  ad: string;
  hedef: string;
  /** Maskeli hedef (URL/e-posta gizlenmiş — panelde gösterilir). */
  hedefMaskeli: string;
  olaylar: string[];
  aktif: boolean;
  lastDelivery: number | null;
  lastStatus: number | null;
  gonderilen: number;
  /** Hesaplanmış durum sınıfı. */
  durum: SaglikDurum;
  /** 0..100 sağlık skoru. */
  skor: number;
  /** Son teslimatın yaşı (ms) — hiç teslimat yoksa null. */
  yasMs: number | null;
  /** Kurulum doğrulama kontrolleri. */
  kontroller: DogrulamaKontrol[];
  /** Kaç doğrulama kontrolü geçti / toplam. */
  gecenKontrol: number;
  toplamKontrol: number;
}

/** Filo (tüm entegrasyonlar) özet metrikleri. */
export interface FiloOzet {
  toplam: number;
  aktif: number;
  saglikli: number;
  uyari: number;
  bozuk: number;
  pasif: number;
  /** Toplam gönderilen bildirim. */
  toplamGonderi: number;
  /** Ortalama sağlık skoru (0..100). */
  ortSkor: number;
  /** En az bir entegrasyonda kurulum kritik-hatası var mı. */
  kritikHataVar: boolean;
}

/** Olay-tipi kapsama satırı: bir olayı hangi entegrasyonlar taşıyor. */
export interface OlayKapsama {
  key: string;
  ad: string;
  onem: "bilgi" | "uyari" | "kritik";
  /** Bu olaya abone AKTİF entegrasyon sayısı. */
  aktifKanal: number;
  /** Bu olaya abone (aktif+pasif) toplam entegrasyon sayısı. */
  toplamKanal: number;
  /** Aktif kanalı olan entegrasyon adları. */
  kanallar: string[];
  /** Kapsanıyor mu (en az bir AKTİF kanal var mı). */
  kapsandi: boolean;
}

/**
 * Bir hedefi (webhook URL veya e-posta) güvenli biçimde maskeler.
 * URL: şema + host görünür, yol/token kısaltılır. E-posta: yerel kısım kısılır.
 */
export function hedefMaskele(hedef: string): string {
  if (!hedef) return "—";
  // E-posta
  if (!/^https?:\/\//i.test(hedef) && hedef.includes("@")) {
    const [yerel, alan] = hedef.split("@");
    const bas = yerel.slice(0, 2);
    return `${bas}${yerel.length > 2 ? "•••" : ""}@${alan}`;
  }
  try {
    const u = new URL(hedef);
    const yol = u.pathname.length > 12 ? u.pathname.slice(0, 8) + "…" : u.pathname;
    return `${u.protocol}//${u.host}${yol}${u.pathname.length > 1 ? "/•••" : ""}`;
  } catch {
    // URL değilse ortasını gizle.
    if (hedef.length <= 16) return hedef;
    return hedef.slice(0, 10) + "…" + hedef.slice(-4);
  }
}

/**
 * Tek bir entegrasyonun kurulum doğrulama kontrollerini üretir.
 * `now` deterministik teslimat-yaşı hesabı için gerekir.
 */
export function dogrulamaKontrolleri(ent: Integration, now: number): DogrulamaKontrol[] {
  const kontroller: DogrulamaKontrol[] = [];

  // 1) Hedef geçerli mi? (e-posta ise @ içermeli, değilse http(s) URL olmalı)
  const eposta = ent.tur === "email";
  const hedefGecerli = eposta
    ? /.+@.+\..+/.test(ent.hedef)
    : /^https?:\/\/.+/i.test(ent.hedef);
  kontroller.push({
    anahtar: "hedef",
    etiket: eposta ? "Geçerli e-posta adresi" : "Geçerli hedef URL",
    gecti: hedefGecerli,
    kritik: true,
    detay: hedefGecerli
      ? (eposta ? "E-posta adresi doğru biçimde." : "Hedef URL biçimi geçerli.")
      : (eposta ? "E-posta adresi geçersiz görünüyor." : "Hedef geçerli bir http(s) URL değil."),
  });

  // 2) En az bir olay tipi seçili mi?
  const olayVar = Array.isArray(ent.olaylar) && ent.olaylar.length > 0;
  kontroller.push({
    anahtar: "olay",
    etiket: "Olay tipi seçili",
    gecti: olayVar,
    kritik: true,
    detay: olayVar
      ? `${ent.olaylar.length} olay tipine abone.`
      : "Hiç olaya abone değil — bu entegrasyon asla tetiklenmez.",
  });

  // 3) Aktif mi? (pasifse kritik değil ama işlevsiz — uyarı)
  kontroller.push({
    anahtar: "aktif",
    etiket: "Entegrasyon aktif",
    gecti: ent.aktif,
    kritik: false,
    detay: ent.aktif ? "Bildirim gönderimi açık." : "Duraklatıldı — olaylar teslim edilmez.",
  });

  // 4) Son teslimat başarılı mı? (hiç teslimat yoksa henüz doğrulanmadı sayılır)
  const hicTeslimat = ent.lastDelivery === null;
  const sonBasarili = basariliMi(ent.lastStatus);
  kontroller.push({
    anahtar: "teslimat",
    etiket: "Son teslimat başarılı",
    gecti: sonBasarili,
    kritik: false,
    detay: hicTeslimat
      ? "Henüz test/teslimat yapılmadı. Canlı test göndererek doğrulayın."
      : sonBasarili
        ? `Son teslimat başarılı (HTTP ${ent.lastStatus}), ${goreliYas(now - (ent.lastDelivery ?? now))} önce.`
        : `Son teslimat başarısız (${ent.lastStatus === 0 ? "bağlantı hatası" : "HTTP " + ent.lastStatus}).`,
  });

  return kontroller;
}

/** Yaşı insan-okur biçime çevir (test/doğrulama detayı için, saf). */
function goreliYas(ms: number): string {
  const dk = Math.floor(ms / 60000);
  if (dk < 1) return "az";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa`;
  return `${Math.floor(sa / 24)} gün`;
}

/**
 * Tek bir entegrasyonun sağlık durumunu ve skorunu hesaplar (SAF).
 *
 * Durum mantığı:
 *   - pasif:     aktif değil (kullanıcı bilerek duraklatmış).
 *   - bozuk:     aktif + son teslimat başarısız (status 0 veya >=400).
 *   - uyari:     aktif + hiç teslimat yok, VEYA son başarı çok eski (> UYARI_ESIK).
 *   - saglikli:  aktif + son teslimat başarılı ve makul tazelikte.
 *
 * Skor (0..100): başarı durumu + tazelik + kurulum tamlığı bileşimi.
 */
export function entegrasyonSaglikHesapla(ent: Integration, now: number): EntegrasyonSaglik {
  const kontroller = dogrulamaKontrolleri(ent, now);
  const gecenKontrol = kontroller.filter((k) => k.gecti).length;
  const toplamKontrol = kontroller.length;
  const kritikHata = kontroller.some((k) => k.kritik && !k.gecti);

  const yasMs = ent.lastDelivery === null ? null : Math.max(0, now - ent.lastDelivery);
  const sonBasarili = basariliMi(ent.lastStatus);

  let durum: SaglikDurum;
  if (!ent.aktif) {
    durum = "pasif";
  } else if (ent.lastDelivery !== null && !sonBasarili) {
    // Aktif ama son teslimat açıkça başarısız → bozuk.
    durum = "bozuk";
  } else if (kritikHata) {
    // Kurulum kritik-eksik (hedef/olay) → işlevsiz → bozuk.
    durum = "bozuk";
  } else if (ent.lastDelivery === null) {
    // Henüz hiç teslimat yok → doğrulanmadı → uyarı.
    durum = "uyari";
  } else if (yasMs !== null && yasMs > UYARI_ESIK_MS) {
    // Son başarı çok eski → sessiz kalmış olabilir → uyarı.
    durum = "uyari";
  } else {
    durum = "saglikli";
  }

  // Skor bileşenleri
  let skor = 0;
  // Kurulum tamlığı: 40 puana kadar (geçen kontrol oranı).
  skor += Math.round((gecenKontrol / toplamKontrol) * 40);
  // Teslimat başarısı: 40 puan (son başarı) — hiç yoksa 15 (nötr).
  if (ent.lastDelivery === null) skor += 15;
  else if (sonBasarili) skor += 40;
  else skor += 0;
  // Tazelik: 20 puana kadar (yeni teslimat = tam puan, bayatladıkça azalır).
  if (ent.lastDelivery === null) {
    skor += 8; // nötr
  } else if (yasMs !== null) {
    if (yasMs <= BAYAT_ESIK_MS) skor += 20;
    else if (yasMs <= UYARI_ESIK_MS) skor += 12;
    else skor += 4;
  }
  // Pasif entegrasyon skoru tavanlanır (aktif değilse tam sağlık olamaz).
  if (!ent.aktif) skor = Math.min(skor, 45);
  skor = Math.max(0, Math.min(100, skor));

  return {
    id: ent.id,
    tur: ent.tur,
    ad: ent.ad,
    hedef: ent.hedef,
    hedefMaskeli: hedefMaskele(ent.hedef),
    olaylar: ent.olaylar,
    aktif: ent.aktif,
    lastDelivery: ent.lastDelivery,
    lastStatus: ent.lastStatus,
    gonderilen: ent.gonderilen,
    durum,
    skor,
    yasMs,
    kontroller,
    gecenKontrol,
    toplamKontrol,
  };
}

/** Bir liste entegrasyondan filo özeti hesaplar (SAF). */
export function filoOzeti(saglikliList: EntegrasyonSaglik[]): FiloOzet {
  const toplam = saglikliList.length;
  const aktif = saglikliList.filter((s) => s.aktif).length;
  const saglikli = saglikliList.filter((s) => s.durum === "saglikli").length;
  const uyari = saglikliList.filter((s) => s.durum === "uyari").length;
  const bozuk = saglikliList.filter((s) => s.durum === "bozuk").length;
  const pasif = saglikliList.filter((s) => s.durum === "pasif").length;
  const toplamGonderi = saglikliList.reduce((a, s) => a + s.gonderilen, 0);
  const ortSkor = toplam === 0 ? 0 : Math.round(saglikliList.reduce((a, s) => a + s.skor, 0) / toplam);
  const kritikHataVar = saglikliList.some((s) =>
    s.kontroller.some((k) => k.kritik && !k.gecti),
  );
  return { toplam, aktif, saglikli, uyari, bozuk, pasif, toplamGonderi, ortSkor, kritikHataVar };
}

/**
 * Olay-tipi kapsama analizini üretir: her tanımlı olay tipi için hangi
 * entegrasyonların (aktif/toplam) onu taşıdığını hesaplar. Kapsanmayan
 * kritik olaylar "boşluk" olarak fark edilebilsin diye. (SAF)
 */
export function olayKapsamaHesapla(entegrasyonlar: Integration[]): OlayKapsama[] {
  return OLAY_TURLERI.map((o) => {
    const abone = entegrasyonlar.filter((e) => e.olaylar.includes(o.key));
    const aktifAbone = abone.filter((e) => e.aktif);
    return {
      key: o.key,
      ad: o.ad,
      onem: o.onem,
      aktifKanal: aktifAbone.length,
      toplamKanal: abone.length,
      kanallar: aktifAbone.map((e) => e.ad),
      kapsandi: aktifAbone.length > 0,
    };
  });
}

/** Durum → panel rozet tonu (kit DurumRozeti/Badge ile ortak). */
export function durumTon(durum: SaglikDurum): "ok" | "warn" | "danger" | "gri" {
  return durum === "saglikli" ? "ok" : durum === "uyari" ? "warn" : durum === "bozuk" ? "danger" : "gri";
}

/** Durum → insan-okur etiket. */
export function durumEtiket(durum: SaglikDurum): string {
  return { saglikli: "Sağlıklı", uyari: "Uyarı", bozuk: "Bozuk", pasif: "Pasif" }[durum];
}
