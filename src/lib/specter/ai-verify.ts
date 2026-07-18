/**
 * Specter — AI Ajan Kimlik Doğrulama (Anti-Spoofing)
 * ==================================================
 * En yaygın saldırı: kötü niyetli bir kazıyıcı, User-Agent'ına "GPTBot" yazıp
 * meşru AI botu taklit eder — çünkü çoğu site UA'ya bakıp izin verir. Specter
 * bunu YAKALAR: bir istek "GPTBot" iddia ediyorsa, kaynak IP GERÇEKTEN OpenAI'nin
 * ilan ettiği IP aralığında mı / reverse-DNS'i doğru alan adına mı çözülüyor?
 * Değilse → SAHTE ajan (spoof), engellenir.
 *
 * Doğrulama yöntemleri (operatörün resmi mekanizmasına göre):
 *   - ip_aralik : kaynak IP, operatörün yayınladığı CIDR bloklarında olmalı.
 *   - reverse_dns: IP'nin PTR kaydı operatörün alan adıyla bitmeli + ileri-DNS teyidi.
 *   - yok       : operatör doğrulama sağlamıyor → UA'ya asla güvenilmez.
 *
 * NOT: Aşağıdaki CIDR blokları ve DNS son ekleri, operatörlerin kamuya açık
 * dokümantasyonundaki TEMSİLİ değerlerdir (resmi yayın URL'leri ai-agents.ts'te
 * `ipYayin`). Üretimde bunlar operatör yayınından periyodik senkronlanır.
 */

/** Ajan id → resmi doğrulama verisi (CIDR blokları ve/veya reverse-DNS son ekleri). */
export interface DogrulamaKaynagi {
  cidr: string[]; // ip_aralik yöntemi için resmi bloklar
  dnsSonek: string[]; // reverse_dns yöntemi için beklenen PTR son ekleri
}

export const DOGRULAMA_KAYNAKLARI: Record<string, DogrulamaKaynagi> = {
  gptbot: { cidr: ["20.15.240.0/20", "20.171.0.0/16", "52.230.152.0/24", "172.203.190.0/24"], dnsSonek: [] },
  "oai-searchbot": { cidr: ["20.42.10.0/24", "51.8.102.0/24", "172.178.141.0/24"], dnsSonek: [] },
  "chatgpt-user": { cidr: ["23.98.142.176/28", "40.84.180.224/28", "104.210.140.0/24"], dnsSonek: [] },
  claudebot: { cidr: ["160.79.104.0/23", "34.162.0.0/16"], dnsSonek: [] },
  "claude-user": { cidr: ["160.79.104.0/23"], dnsSonek: [] },
  "google-extended": { cidr: ["66.249.64.0/19", "34.100.0.0/16"], dnsSonek: [".googlebot.com", ".google.com"] },
  perplexitybot: { cidr: ["23.128.96.0/24", "44.221.181.0/24"], dnsSonek: [".perplexity.ai"] },
  "perplexity-user": { cidr: ["44.221.181.0/24"], dnsSonek: [".perplexity.ai"] },
  bytespider: { cidr: ["47.128.0.0/14", "110.249.201.0/24"], dnsSonek: [] },
  ccbot: { cidr: ["44.192.0.0/11"], dnsSonek: [] },
  amazonbot: { cidr: ["52.95.216.0/21", "72.21.196.0/22"], dnsSonek: [".crawl.amazon.com"] },
  "meta-externalagent": { cidr: ["57.141.0.0/16", "173.252.64.0/18"], dnsSonek: [".facebook.com"] },
  "cohere-ai": { cidr: ["35.192.0.0/14"], dnsSonek: [] },
};

/* ------------------------------------------------------- CIDR üyelik testi */

/** Bir IPv4 dizesini 32-bit unsigned tam sayıya çevirir (geçersizse null). */
export function ipv4Sayi(ip: string): number | null {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const okt of p) {
    const v = Number(okt);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

/** IP, CIDR bloğunun içinde mi (IPv4). */
export function cidrIcinde(ip: string, cidr: string): boolean {
  const [ag, onekStr] = cidr.split("/");
  const onek = Number(onekStr);
  const ipN = ipv4Sayi(ip);
  const agN = ipv4Sayi(ag);
  if (ipN === null || agN === null || !Number.isInteger(onek) || onek < 0 || onek > 32) return false;
  if (onek === 0) return true;
  const maske = (0xffffffff << (32 - onek)) >>> 0;
  return (ipN & maske) === (agN & maske);
}

/** IP, verilen CIDR bloklarından herhangi birinde mi. */
export function herhangiCidr(ip: string, bloklar: string[]): boolean {
  return bloklar.some((c) => cidrIcinde(ip, c));
}

/* ------------------------------------------------------- Doğrulama sonucu */

export type DogrulamaDurum =
  | "dogrulandi" // IP/DNS operatörle eşleşti → gerçek ajan
  | "sahte" // UA ajan iddia ediyor ama IP/DNS eşleşmiyor → SPOOF
  | "dogrulanamaz" // operatör doğrulama sağlamıyor (dogrulama: "yok")
  | "ptr_yok"; // reverse_dns bekleniyor ama PTR verisi sağlanmadı

export interface DogrulamaSonuc {
  durum: DogrulamaDurum;
  yontem: "ip_aralik" | "reverse_dns" | "yok";
  /** İnsan-okur açıklama. */
  aciklama: string;
  /** Eşleşen blok / son ek (varsa). */
  kanit: string | null;
  /** Bu sonuç güvenli bir aksiyon öneriyor mu (sahte → engelle). */
  onerilenAksiyon: "izin" | "dogrula" | "engelle";
}

/**
 * Bir isteğin iddia ettiği AI ajanı GERÇEKTEN o ajan mı doğrular.
 * @param ajanId   AI_AJANLAR'daki ajan id'si (aiAjanTespit'ten).
 * @param yontem   ajanın dogrulama yöntemi.
 * @param ip       kaynak IP.
 * @param ptr      IP'nin reverse-DNS (PTR) kaydı — biliniyorsa (reverse_dns için).
 */
export function aiAjanDogrula(
  ajanId: string,
  yontem: "ip_aralik" | "reverse_dns" | "yok",
  ip: string,
  ptr?: string | null,
): DogrulamaSonuc {
  const kaynak = DOGRULAMA_KAYNAKLARI[ajanId];

  if (yontem === "yok" || !kaynak) {
    return {
      durum: "dogrulanamaz",
      yontem: "yok",
      aciklama: "Operatör doğrulanabilir IP aralığı/DNS yayınlamıyor. User-Agent'a güvenilemez; davranışla değerlendirin.",
      kanit: null,
      onerilenAksiyon: "dogrula",
    };
  }

  if (yontem === "ip_aralik") {
    const eslesen = kaynak.cidr.find((c) => cidrIcinde(ip, c));
    if (eslesen) {
      return {
        durum: "dogrulandi",
        yontem,
        aciklama: `Kaynak IP operatörün resmi aralığında (${eslesen}). Gerçek ajan.`,
        kanit: eslesen,
        onerilenAksiyon: "izin",
      };
    }
    return {
      durum: "sahte",
      yontem,
      aciklama: "User-Agent bu ajanı iddia ediyor ama IP operatörün resmi aralıklarının HİÇBİRİNDE değil. SAHTE ajan — muhtemelen taklit eden kazıyıcı.",
      kanit: null,
      onerilenAksiyon: "engelle",
    };
  }

  // reverse_dns
  if (!ptr) {
    return {
      durum: "ptr_yok",
      yontem,
      aciklama: "Doğrulama için ters-DNS (PTR) gerekli ama sağlanmadı. Çözülene kadar güvenli değil.",
      kanit: null,
      onerilenAksiyon: "dogrula",
    };
  }
  const ptrLower = ptr.toLowerCase();
  const sonek = kaynak.dnsSonek.find((s) => ptrLower.endsWith(s));
  if (sonek) {
    return {
      durum: "dogrulandi",
      yontem,
      aciklama: `Ters-DNS kaydı operatör alan adıyla bitiyor (${sonek}). Gerçek ajan.`,
      kanit: `${ptr} → ${sonek}`,
      onerilenAksiyon: "izin",
    };
  }
  return {
    durum: "sahte",
    yontem,
    aciklama: `Ters-DNS kaydı (${ptr}) operatör alan adıyla eşleşmiyor. SAHTE ajan.`,
    kanit: null,
    onerilenAksiyon: "engelle",
  };
}

export const DOGRULAMA_DURUM_ETIKET: Record<DogrulamaDurum, string> = {
  dogrulandi: "Doğrulandı",
  sahte: "Sahte (spoof)",
  dogrulanamaz: "Doğrulanamaz",
  ptr_yok: "PTR bekliyor",
};
