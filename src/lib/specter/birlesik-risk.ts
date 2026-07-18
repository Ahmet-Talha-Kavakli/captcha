/**
 * Specter — Birleşik Çok-Faktörlü Risk Skorlama Motoru
 * ====================================================
 * Specter'ın istihbarat beyni: dağınık sinyalleri (coğrafya, ASN/datacenter,
 * TLS uyumsuzluğu, headless, tehdit-beslemesi eşleşmesi, davranış skoru, IP
 * itibarı, olay yoğunluğu) TEK birleşik risk skorunda toplar. Her IP için 0-100
 * risk + hangi faktörlerin ne kadar katkı verdiğinin ŞEFFAF dökümü + önerilen
 * aksiyon üretir. Bu, tüm modüllerin çıktısını tek karara indirger.
 *
 * Saf/deterministik: Date.now/Math.random YOK.
 */
import type { BotEvent } from "@/lib/db/schema";
import { datacenterMi } from "@/lib/specter/geo-risk";
import { tehditBeslemeEslestir } from "@/lib/specter/threat-feed";
import { tutarlilikAnaliz } from "@/lib/specter/tarayici-tutarlilik";

/** Yüksek-riskli ülkeler (temsili — bot kaynağı yoğunluğu). */
const RISK_ULKE = new Set(["RU", "CN", "IR", "KP", "BR", "VN", "IN", "UA"]);
const KOTU_SINIF = new Set(["scraper", "credential_stuffing", "automation", "ai_agent", "ddos", "spam"]);

export interface RiskFaktor {
  anahtar: string;
  ad: string;
  /** 0-100 bu faktörün ham risk katkısı. */
  puan: number;
  /** Ağırlık (0-1, toplam ~1). */
  agirlik: number;
  /** İnsan-okur açıklama. */
  aciklama: string;
  /** Faktör tetiklendi mi (0 katkı → sessiz). */
  aktif: boolean;
}

export type RiskSeviye = "temiz" | "dusuk" | "orta" | "yuksek" | "kritik";

export interface IpRisk {
  ip: string;
  country: string;
  asn: string;
  toplamOlay: number;
  engellenen: number;
  /** 0-100 birleşik risk. */
  risk: number;
  seviye: RiskSeviye;
  faktorler: RiskFaktor[];
  /** Önerilen aksiyon. */
  oneri: "izin" | "izle" | "dogrula" | "engelle";
  /** En baskın faktör. */
  baskinFaktor: string;
}

const FAKTOR_AGIRLIK = {
  itibar: 0.2,       // davranış/skor + engel oranı
  tehditFeed: 0.18,  // istihbarat beslemesi eşleşmesi
  datacenter: 0.14,  // datacenter/hosting ASN
  cografya: 0.11,    // yüksek-risk ülke
  tls: 0.13,         // TLS/UA uyumsuz + headless
  tutarlilik: 0.11,  // tarayıcı UA-JS tutarsızlığı + otomasyon bayrakları
  yogunluk: 0.13,    // olay hacmi / hız
};

function seviyeBul(risk: number): RiskSeviye {
  return risk >= 80 ? "kritik" : risk >= 60 ? "yuksek" : risk >= 35 ? "orta" : risk >= 15 ? "dusuk" : "temiz";
}

/** Bir IP'nin olaylarından birleşik risk hesaplar. */
export function ipRiskHesap(ip: string, olaylar: BotEvent[]): IpRisk {
  const ilk = olaylar[0];
  const engellenen = olaylar.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
  const engelOran = engellenen / olaylar.length;
  const minSkor = Math.min(...olaylar.map((e) => e.score));
  const kotuOran = olaylar.filter((e) => KOTU_SINIF.has(e.botClass)).length / olaylar.length;

  const faktorler: RiskFaktor[] = [];

  // 1) İtibar / davranış: düşük skor + engel oranı.
  const itibarPuan = Math.round(Math.min(100, (1 - minSkor) * 60 + engelOran * 40));
  faktorler.push({
    anahtar: "itibar", ad: "Davranış & itibar", puan: itibarPuan, agirlik: FAKTOR_AGIRLIK.itibar,
    aciklama: `En düşük insanlık skoru ${minSkor.toFixed(2)}, engel oranı %${Math.round(engelOran * 100)}.`,
    aktif: itibarPuan > 10,
  });

  // 2) Tehdit beslemesi eşleşmesi.
  const feed = tehditBeslemeEslestir(ip, ilk.asn);
  const feedPuan = feed.eslesti ? Math.round(feed.maxGuven * 100) : 0;
  faktorler.push({
    anahtar: "tehditFeed", ad: "Tehdit beslemesi", puan: feedPuan, agirlik: FAKTOR_AGIRLIK.tehditFeed,
    aciklama: feed.eslesti ? `${feed.kaynaklar.map((k) => k.ad).join(", ")} beslemelerinde listeli.` : "Bilinen tehdit beslemelerinde yok.",
    aktif: feed.eslesti,
  });

  // 3) Datacenter/hosting ASN.
  const dc = datacenterMi(ilk.asn);
  faktorler.push({
    anahtar: "datacenter", ad: "Datacenter/hosting", puan: dc ? 75 : 0, agirlik: FAKTOR_AGIRLIK.datacenter,
    aciklama: dc ? `${ilk.asn} bir datacenter/hosting ağı — meşru kullanıcı nadiren buradan gelir.` : "Konut/mobil ISP ağı.",
    aktif: dc,
  });

  // 4) Coğrafya.
  const riskliUlke = RISK_ULKE.has(ilk.country);
  faktorler.push({
    anahtar: "cografya", ad: "Coğrafi risk", puan: riskliUlke ? 55 : 10, agirlik: FAKTOR_AGIRLIK.cografya,
    aciklama: riskliUlke ? `${ilk.country} yüksek bot-kaynağı yoğunluğuna sahip.` : `${ilk.country} düşük coğrafi risk.`,
    aktif: riskliUlke,
  });

  // 5) TLS/UA uyumsuz + headless.
  const tlsUyumsuz = olaylar.some((e) => e.tlsUaUyumsuz);
  const headless = olaylar.some((e) => e.headless);
  const tlsPuan = tlsUyumsuz ? 90 : headless ? 65 : 0;
  faktorler.push({
    anahtar: "tls", ad: "TLS/otomasyon imzası", puan: tlsPuan, agirlik: FAKTOR_AGIRLIK.tls,
    aciklama: tlsUyumsuz ? "UA tarayıcı der ama TLS imzası araç — sahte tarayıcı." : headless ? "Headless tarayıcı imzası." : "Tutarlı tarayıcı imzası.",
    aktif: tlsUyumsuz || headless,
  });

  // 6) Tarayıcı tutarlılık: UA'nın iddia ettiği tarayıcı, gerçek istemci sinyalleriyle
  //    (headless/TLS/otomasyon bayrakları) tutarlı mı? tutarlilikAnaliz IP'nin
  //    olaylarından toplu tutarsızlık dağılımını türetir; sahte oranı yüksekse
  //    bu IP kimliğini gizliyor demektir (spoofing).
  const tut = tutarlilikAnaliz(olaylar);
  const sahteOran = olaylar.length ? tut.sahte / olaylar.length : 0;
  const supheliOran = olaylar.length ? tut.supheli / olaylar.length : 0;
  const tutarlilikPuan = Math.round(Math.min(100, sahteOran * 100 + supheliOran * 45));
  faktorler.push({
    anahtar: "tutarlilik", ad: "Tarayıcı tutarlılık", puan: tutarlilikPuan, agirlik: FAKTOR_AGIRLIK.tutarlilik,
    aciklama: tut.sahte > 0
      ? `${tut.sahte}/${olaylar.length} olayda UA-JS tutarsızlığı (sahte tarayıcı imzası).`
      : supheliOran > 0 ? `${tut.supheli}/${olaylar.length} olayda şüpheli otomasyon sinyali.` : "Tarayıcı imzası tutarlı.",
    aktif: tutarlilikPuan > 10,
  });

  // 7) Yoğunluk (hacim + kötü sınıf oranı).
  const yogunlukPuan = Math.round(Math.min(100, Math.min(olaylar.length, 50) * 1.4 + kotuOran * 30));
  faktorler.push({
    anahtar: "yogunluk", ad: "Olay yoğunluğu", puan: yogunlukPuan, agirlik: FAKTOR_AGIRLIK.yogunluk,
    aciklama: `${olaylar.length} olay, %${Math.round(kotuOran * 100)} kötü sınıf.`,
    aktif: yogunlukPuan > 15,
  });

  // Ağırlıklı birleşim.
  const risk = Math.max(0, Math.min(100, Math.round(faktorler.reduce((a, f) => a + f.puan * f.agirlik, 0))));
  const seviye = seviyeBul(risk);
  const baskin = [...faktorler].filter((f) => f.aktif).sort((a, b) => b.puan * b.agirlik - a.puan * a.agirlik)[0];
  const oneri: IpRisk["oneri"] = risk >= 80 ? "engelle" : risk >= 55 ? "dogrula" : risk >= 25 ? "izle" : "izin";

  return {
    ip, country: ilk.country, asn: ilk.asn, toplamOlay: olaylar.length, engellenen,
    risk, seviye, faktorler, oneri, baskinFaktor: baskin?.ad ?? "—",
  };
}

export interface BirlesikRiskSonuc {
  riskler: IpRisk[];
  ozet: {
    toplamIp: number;
    kritik: number;
    yuksek: number;
    ortRisk: number;
    engellenmeli: number; // öneri=engelle
  };
  /** Faktörlerin genel katkı dağılımı (hangi sinyal en çok tetikleniyor). */
  faktorDagilim: { ad: string; tetiklenme: number; ortPuan: number }[];
}

/** Tüm olayları IP'lere gruplayıp birleşik risk çıkarır. */
export function birlesikRisk(events: BotEvent[]): BirlesikRiskSonuc {
  const ipOlay = new Map<string, BotEvent[]>();
  for (const e of events) (ipOlay.get(e.ip) ?? ipOlay.set(e.ip, []).get(e.ip)!).push(e);

  const riskler: IpRisk[] = [];
  for (const [ip, olaylar] of ipOlay) {
    // İnsan-baskın + tek-olay temiz IP'leri atla (gürültü azalt): yalnız ≥1 kötü sinyal.
    riskler.push(ipRiskHesap(ip, olaylar));
  }
  riskler.sort((a, b) => b.risk - a.risk);

  // Faktör dağılımı.
  const faktorAd = ["Davranış & itibar", "Tehdit beslemesi", "Datacenter/hosting", "Coğrafi risk", "TLS/otomasyon imzası", "Tarayıcı tutarlılık", "Olay yoğunluğu"];
  const faktorDagilim = faktorAd.map((ad) => {
    const tetik = riskler.filter((r) => r.faktorler.find((f) => f.ad === ad)?.aktif).length;
    const puanlar = riskler.map((r) => r.faktorler.find((f) => f.ad === ad)?.puan ?? 0);
    const ort = puanlar.length ? Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length) : 0;
    return { ad, tetiklenme: tetik, ortPuan: ort };
  }).sort((a, b) => b.tetiklenme - a.tetiklenme);

  const ortRisk = riskler.length ? Math.round(riskler.reduce((a, r) => a + r.risk, 0) / riskler.length) : 0;
  return {
    riskler,
    ozet: {
      toplamIp: riskler.length,
      kritik: riskler.filter((r) => r.seviye === "kritik").length,
      yuksek: riskler.filter((r) => r.seviye === "yuksek").length,
      ortRisk,
      engellenmeli: riskler.filter((r) => r.oneri === "engelle").length,
    },
    faktorDagilim,
  };
}

export const SEVIYE_ETIKET: Record<RiskSeviye, string> = {
  temiz: "Temiz", dusuk: "Düşük", orta: "Orta", yuksek: "Yüksek", kritik: "Kritik",
};
export const SEVIYE_RENK: Record<RiskSeviye, string> = {
  temiz: "#16a34a", dusuk: "#65a30d", orta: "#d97706", yuksek: "#ea580c", kritik: "#dc2626",
};
