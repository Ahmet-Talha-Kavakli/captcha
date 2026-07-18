/**
 * Specter — Gerçek-Zaman Tehdit Besleme (Threat Intelligence Feed)
 * =================================================================
 * Bilinen kötü niyetli altyapının güncel kataloğu: Tor çıkış düğümleri,
 * bilinen bulletproof/abuse ASN'leri, kötü ün IP blokları (CIDR), bilinen
 * saldırı imzaları. Gerçek üründe bu Spamhaus/AbuseIPDB/Tor Project/FireHOL
 * beslemelerinden periyodik senkronlanır; burada temsili ama gerçekçi bir
 * katalogla modelliyoruz.
 *
 * verify/passive/challenge akışları bir IP/ASN'i bu beslemeyle eşleştirip
 * anında karar verebilir (tanınan tehdit → yüksek zorluk/engel).
 */

export type BeslemeKaynak = "tor" | "vpn" | "datacenter" | "bulletproof" | "botnet" | "spam" | "scanner";

export interface BeslemeKaydi {
  kaynak: BeslemeKaynak;
  ad: string;
  aciklama: string;
  /** Güven (0..1) — bu kaynağın ne kadar kesin kötü olduğu. */
  guven: number;
  /** Son güncelleme (gün önce). */
  guncellemeGun: number;
  /** Kayıt sayısı (bu beslemede kaç IP/ASN). */
  kayitSayisi: number;
}

/** Aktif tehdit beslemeleri kataloğu (temsili gerçekçi). */
export const BESLEMELER: BeslemeKaydi[] = [
  { kaynak: "tor", ad: "Tor Çıkış Düğümleri", aciklama: "Tor ağının bilinen çıkış IP'leri — anonimleştirme.", guven: 0.95, guncellemeGun: 0, kayitSayisi: 1847 },
  { kaynak: "bulletproof", ad: "Kurşun-geçirmez Barındırma", aciklama: "Kötüye kullanım şikayetlerini yok sayan ASN'ler (Flokinet, vb.).", guven: 0.9, guncellemeGun: 1, kayitSayisi: 312 },
  { kaynak: "botnet", ad: "Aktif Botnet C2", aciklama: "Bilinen komuta-kontrol ve zombi ağı IP'leri.", guven: 0.92, guncellemeGun: 0, kayitSayisi: 5629 },
  { kaynak: "vpn", ad: "Ticari VPN/Proxy", aciklama: "Bilinen VPN ve proxy sağlayıcı IP aralıkları.", guven: 0.7, guncellemeGun: 2, kayitSayisi: 24518 },
  { kaynak: "datacenter", ad: "Veri Merkezi Aralıkları", aciklama: "Konut olmayan bulut/hosting IP'leri (AWS/GCP/OVH).", guven: 0.6, guncellemeGun: 1, kayitSayisi: 88240 },
  { kaynak: "scanner", ad: "İnternet Tarayıcıları", aciklama: "Kütle port/zafiyet tarayan bilinen kaynaklar.", guven: 0.85, guncellemeGun: 0, kayitSayisi: 3102 },
  { kaynak: "spam", ad: "Spam Kaynakları", aciklama: "Spamhaus/DBL benzeri bilinen spam gönderen IP'ler.", guven: 0.8, guncellemeGun: 1, kayitSayisi: 14903 },
];

// Bilinen kötü ASN parçaları (ad içinde eşleşme aranır).
const KOTU_ASN: { desen: RegExp; kaynak: BeslemeKaynak; guven: number }[] = [
  { desen: /flokinet|bulletproof/i, kaynak: "bulletproof", guven: 0.9 },
  { desen: /m247|datacamp|nordvpn|expressvpn|mullvad/i, kaynak: "vpn", guven: 0.72 },
  { desen: /amazon|aws|google cloud|gcp|digitalocean|hetzner|ovh|linode|vultr|selectel/i, kaynak: "datacenter", guven: 0.6 },
  { desen: /shodan|censys|binaryedge/i, kaynak: "scanner", guven: 0.85 },
];

// Bilinen kötü IP önekleri (CIDR /8-/16 kabaca) — temsili.
const KOTU_IP_ONEK: { onek: string; kaynak: BeslemeKaynak; guven: number }[] = [
  { onek: "185.220.", kaynak: "tor", guven: 0.95 },       // Tor çıkış bloğu
  { onek: "185.220.101.", kaynak: "tor", guven: 0.97 },
  { onek: "45.155.205.", kaynak: "bulletproof", guven: 0.9 },
  { onek: "193.42.33.", kaynak: "botnet", guven: 0.88 },
  { onek: "89.248.165.", kaynak: "scanner", guven: 0.85 },
  { onek: "141.98.11.", kaynak: "bulletproof", guven: 0.86 },
];

export interface BeslemeEslesme {
  eslesti: boolean;
  kaynaklar: { kaynak: BeslemeKaynak; ad: string; guven: number }[];
  /** En yüksek güven (0..1) — karar için. */
  maxGuven: number;
}

const KAYNAK_AD: Record<BeslemeKaynak, string> = {
  tor: "Tor çıkış düğümü", vpn: "VPN/Proxy", datacenter: "Veri merkezi",
  bulletproof: "Kurşun-geçirmez barındırma", botnet: "Botnet", spam: "Spam kaynağı", scanner: "Tarayıcı",
};

/**
 * Bir IP + ASN'i tehdit beslemeleriyle eşleştir. Birden çok kaynağa
 * uyabilir (ör. hem datacenter hem scanner). Karar için maxGuven kullanılır.
 */
export function tehditBeslemeEslestir(ip: string, asn: string): BeslemeEslesme {
  const kaynaklar: { kaynak: BeslemeKaynak; ad: string; guven: number }[] = [];

  for (const { onek, kaynak, guven } of KOTU_IP_ONEK) {
    if (ip.startsWith(onek)) kaynaklar.push({ kaynak, ad: KAYNAK_AD[kaynak], guven });
  }
  for (const { desen, kaynak, guven } of KOTU_ASN) {
    if (desen.test(asn)) kaynaklar.push({ kaynak, ad: KAYNAK_AD[kaynak], guven });
  }

  // Yinelenen kaynakları en yüksek güvenle tekilleştir.
  const tekil = new Map<BeslemeKaynak, { kaynak: BeslemeKaynak; ad: string; guven: number }>();
  for (const k of kaynaklar) {
    const v = tekil.get(k.kaynak);
    if (!v || k.guven > v.guven) tekil.set(k.kaynak, k);
  }
  const liste = [...tekil.values()].sort((a, b) => b.guven - a.guven);

  return {
    eslesti: liste.length > 0,
    kaynaklar: liste,
    maxGuven: liste.length ? liste[0].guven : 0,
  };
}

/** Beslemelerin toplam kapsamı (panel özeti için). */
export function beslemeOzeti(): { toplamKayit: number; aktifBesleme: number; enGuncelGun: number } {
  return {
    toplamKayit: BESLEMELER.reduce((a, b) => a + b.kayitSayisi, 0),
    aktifBesleme: BESLEMELER.length,
    enGuncelGun: Math.min(...BESLEMELER.map((b) => b.guncellemeGun)),
  };
}
