/**
 * Specter — Honeypot Tuzak Alanları (Honeypot Trap Fields)
 * =======================================================
 * AMAÇ: İnsanların ASLA görmediği/dokunmadığı ama ham DOM/HTML'i ayrıştıran
 * botların doldurduğu veya izlediği görünmez form alanları / linkler. Bir
 * honeypot ile herhangi bir etkileşim → NEREDEYSE KESİN bot kanıtıdır ve
 * YANLIŞ-POZİTİF riski ~sıfırdır: gerçek bir kullanıcı gizli bir alanı
 * göremez, klavye/ekran-okuyucu ile ona ulaşamaz, dolayısıyla dolduramaz.
 *
 * NEDEN ~0 YANLIŞ-POZİTİF?
 *  - Alan görsel olarak gizlenir (display:none / ekran-dışı / opaklık:0).
 *  - `tabindex="-1"` ile klavye sekme sırasından çıkarılır.
 *  - `aria-hidden="true"` ile ekran-okuyuculardan gizlenir (erişilebilirlik
 *    güvenliği: gerçek/engelli kullanıcı bu alanı hiç algılamaz).
 *  - `autocomplete="off"` ile tarayıcı otomatik-doldurucusu tetiklenmez.
 *  Sonuç: yalnızca DOM'u kör-ayrıştıran botlar bu alanları doldurur.
 *
 * SAF (pure) motor: next/headers yok, Date.now/Math.random yok, argümansız
 * `new Date` yok. Aynı girdi → aynı çıktı (determinist). Zaman/rastgelelik
 * gerektiren her şey çağıran taraftan (page.tsx) parametre olarak gelir.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ============================================================== TÜRLER */

/** Honeypot tuzak türü. */
export type TuzakTur =
  | "gizli-alan" // hidden-input: gerçek formda görünmeyen, botun doldurduğu input
  | "yem-alan" // bait-field: sahte "website"/"phone" gibi otomatik-doldurucuyu kandıran alan
  | "gizli-link" // css-hidden-link: robots-disallow yola giden görünmez tuzak-link
  | "aria-onay-kutusu" // aria-hidden-checkbox: botun işaretlediği görünmez onay kutusu
  | "zaman-tuzagi"; // timing-trap: form insan için imkânsız hızda gönderildi

/** Alanın nasıl görünmez kılındığı (erişilebilirlik açısından da güvenli olan yöntemler). */
export type GorunmezlikYontemi = "display-none" | "offscreen" | "aria" | "zero-opacity";

/** Motorun verdiği karar. */
export type HoneypotKarar = "temiz" | "supheli" | "bot-kesin";

/** Tek bir honeypot tuzak tanımı (katalog kaydı). */
export interface TuzakTanim {
  id: string;
  ad: string;
  aciklama: string;
  tur: TuzakTur;
  gorunmezlikYontemi: GorunmezlikYontemi;
  /** Bu tuzağın tipik olarak yakaladığı bot türü (insan-okur). */
  yakalananBotTuru: string;
  /** Yanlış-pozitif riski — honeypot'larda her zaman "çok-düşük". */
  yanlisPozitifRiski: "çok-düşük";
}

/** Çalışma zamanında gözlenen tekil honeypot etkileşimi. */
export interface HoneypotEtkilesim {
  tuzakId: string;
  /** Tuzak tetiklendi mi (alan dolduruldu / link izlendi / onay işaretlendi). */
  tetiklendi: boolean;
  /** Botun tuzağa yazdığı değer (varsa) — kanıt olarak saklanır. */
  deger?: string;
}

/** `honeypotDegerlendir` çıktısı. */
export interface HoneypotSonuc {
  tetiklenenSayi: number;
  /** 0..100 bot güveni — HERHANGİ bir honeypot isabeti çok yüksek olur. */
  botKaniti: number;
  tetiklenenTuzaklar: TuzakTanim[];
  karar: HoneypotKarar;
}

/** `honeypotAnaliz` — tuzak başına (çıkarımsal) etkinlik istatistiği. */
export interface TuzakEtkinlik {
  tuzak: TuzakTanim;
  /** Bu tuzağı tetiklediği ÇIKARSANAN olay sayısı. */
  tetiklenme: number;
  /** Yakalanan (bot olarak sınıflanan) olay sayısı. */
  yakalananBot: number;
  /** Honeypot'ların temel özelliği: yanlış-pozitif her zaman 0. */
  yanlisPozitif: 0;
}

/** `honeypotAnaliz` özet bloğu. */
export interface HoneypotOzet {
  toplamTuzak: number;
  aktifTuzak: number;
  /** Gözlenen trafikte honeypot ile yakalanabilecek tahmini bot sayısı. */
  yakalananBotTahmini: number;
  /** Kapsama oranı: yakalanan bot / toplam bot (0..1). */
  kapsamaOrani: number;
}

/** `honeypotAnaliz` tam çıktısı. */
export interface HoneypotAnalizRapor {
  tuzaklar: TuzakEtkinlik[];
  ozet: HoneypotOzet;
}

/* ============================================================== KATALOG */

/**
 * TUZAKLAR — desteklenen honeypot tuzak türleri kataloğu.
 * Her tanım gerçek, sektörde yaygın kullanılan bir anti-bot tekniğidir.
 */
export const TUZAKLAR: TuzakTanim[] = [
  {
    id: "gizli-alan",
    ad: "Gizli Alan (Hidden Input)",
    aciklama:
      "Forma eklenen, CSS ile gizlenmiş bir metin girdisi. Gerçek kullanıcı göremez; ham HTML'i dolduran botlar buraya değer yazar.",
    tur: "gizli-alan",
    gorunmezlikYontemi: "display-none",
    yakalananBotTuru: "Naif form-botları, spam gönderen otomasyonlar",
    yanlisPozitifRiski: "çok-düşük",
  },
  {
    id: "yem-alan",
    ad: "Yem Alan (Bait Field)",
    aciklama:
      "Gerçek formun göstermediği ama otomatik-doldurucuları baştan çıkaran sahte alan (ör. 'website', 'phone', 'company_url'). Botlar bilindik ad görüp doldurur.",
    tur: "yem-alan",
    gorunmezlikYontemi: "offscreen",
    yakalananBotTuru: "Otomatik-doldurucu botlar, kimlik-doldurma denemeleri",
    yanlisPozitifRiski: "çok-düşük",
  },
  {
    id: "gizli-link",
    ad: "Gizli Link (CSS-Hidden Link)",
    aciklama:
      "robots.txt'te Disallow edilmiş bir yola giden, görsel olarak gizli tuzak-link. İnsan tıklayamaz; kör tarama yapan crawler'lar bu linki izler.",
    tur: "gizli-link",
    gorunmezlikYontemi: "offscreen",
    yakalananBotTuru: "Scraper / crawler, robots.txt'i yok sayan botlar",
    yanlisPozitifRiski: "çok-düşük",
  },
  {
    id: "aria-onay-kutusu",
    ad: "ARIA-Gizli Onay Kutusu",
    aciklama:
      "aria-hidden + display:none ile gizlenmiş bir onay kutusu. Ekran-okuyucu bile algılamaz; DOM'daki her input'u işaretleyen botlar bunu tetikler.",
    tur: "aria-onay-kutusu",
    gorunmezlikYontemi: "aria",
    yakalananBotTuru: "Form-doldurma otomasyonu, headless tarayıcı botları",
    yanlisPozitifRiski: "çok-düşük",
  },
  {
    id: "zaman-tuzagi",
    ad: "Zaman Tuzağı (Timing Trap)",
    aciklama:
      "Formun render edilmesiyle gönderilmesi arası süre insan için imkânsız derecede kısaysa (ör. <1sn) bu bir bot sinyalidir. Görünmez zaman-damgası alanıyla ölçülür.",
    tur: "zaman-tuzagi",
    gorunmezlikYontemi: "zero-opacity",
    yakalananBotTuru: "Hızlı-gönderen otomasyonlar, script'li form-bombardımanı",
    yanlisPozitifRiski: "çok-düşük",
  },
];

/** id → TuzakTanim hızlı arama. */
const TUZAK_HARITA: Record<string, TuzakTanim> = Object.fromEntries(
  TUZAKLAR.map((t) => [t.id, t]),
);

/* ============================================================== RENK HARİTALARI */

/** Tuzak türüne göre rozet tonu (kit Badge tonlarıyla uyumlu). */
export const TUR_TON: Record<TuzakTur, "brand" | "gri" | "yesil" | "sari" | "kirmizi" | "mavi"> = {
  "gizli-alan": "mavi",
  "yem-alan": "brand",
  "gizli-link": "sari",
  "aria-onay-kutusu": "yesil",
  "zaman-tuzagi": "kirmizi",
};

/** Karara göre rozet tonu + hex renk. */
export const KARAR_TON: Record<HoneypotKarar, { ton: "yesil" | "sari" | "kirmizi"; renk: string }> = {
  temiz: { ton: "yesil", renk: "#16a34a" },
  supheli: { ton: "sari", renk: "#d97706" },
  "bot-kesin": { ton: "kirmizi", renk: "#dc2626" },
};

/** Görünmezlik yöntemi → insan-okur etiket anahtarı (i18n istemcide çözülür). */
export const YONTEM_ETIKET: Record<GorunmezlikYontemi, string> = {
  "display-none": "display:none",
  offscreen: "ekran-dışı (offscreen)",
  aria: "aria-hidden",
  "zero-opacity": "opaklık:0",
};

/* ============================================================== DEĞERLENDİR */

/**
 * honeypotDegerlendir — çalışma zamanı honeypot etkileşimlerini karara bağlar.
 *
 * TEMEL KURAL: HERHANGİ bir honeypot tetiklenmesi neredeyse kesin bot kanıtıdır.
 * Tek bir gizli-alan doldurma bile botKaniti'ni ~100'e çıkarır ve karar
 * "bot-kesin" olur. Hiçbir tetiklenme yoksa "temiz" (botKaniti 0).
 *
 * Determinist: yalnızca girdi etkileşimlerine bakar; zaman/rastgelelik yok.
 */
export function honeypotDegerlendir(etkilesimler: HoneypotEtkilesim[]): HoneypotSonuc {
  const tetiklenenler = etkilesimler.filter((e) => e.tetiklendi);
  // Benzersiz tuzak tanımları (aynı tuzak birden çok kez gelebilir).
  const tuzakIdler = Array.from(new Set(tetiklenenler.map((e) => e.tuzakId)));
  const tetiklenenTuzaklar = tuzakIdler
    .map((id) => TUZAK_HARITA[id])
    .filter((t): t is TuzakTanim => Boolean(t));

  const tetiklenenSayi = tetiklenenler.length;

  if (tetiklenenSayi === 0) {
    return { tetiklenenSayi: 0, botKaniti: 0, tetiklenenTuzaklar: [], karar: "temiz" };
  }

  // Tek isabet → 96; ikinci ve sonraki her benzersiz tuzak +2 (tavan 100).
  // Honeypot'un doğası gereği tek isabet bile "bot-kesin" eşiğinin üstündedir.
  const botKaniti = Math.min(100, 96 + (tuzakIdler.length - 1) * 2);

  return {
    tetiklenenSayi,
    botKaniti,
    tetiklenenTuzaklar,
    karar: "bot-kesin",
  };
}

/* ============================================================== ANALİZ */

/**
 * Hangi bot sınıfının hangi tuzağı ÇIKARIMSAL olarak tetikleyeceğini eşler.
 * Bu, gözlenen trafikten türetilen KAPSAMA tahminidir (gerçek honeypot
 * isabeti değil) — page/istemci'de dürüstçe "çıkarımsal kapsama" etiketiyle
 * gösterilir.
 */
const SINIF_TUZAK: Partial<Record<BotClass, string[]>> = {
  // Kazıyıcılar kör crawl yapar → gizli linkleri izler.
  scraper: ["gizli-link", "gizli-alan"],
  // Selenium/Puppeteer/Playwright DOM'daki her input'u doldurur/işaretler.
  automation: ["aria-onay-kutusu", "gizli-alan", "zaman-tuzagi"],
  // Kimlik-doldurma botları form alanlarını (yem dahil) hızlıca doldurur.
  credential_stuffing: ["yem-alan", "zaman-tuzagi"],
  // Spam botları bilindik yem alanlarını doldurur.
  spam: ["yem-alan", "gizli-alan"],
  // DDoS/flood: imkânsız hızda istek → zaman tuzağı.
  ddos: ["zaman-tuzagi"],
  // AI ajanları HTML'i ayrıştırır; gizli linki ve yem alanı görebilir.
  ai_agent: ["gizli-link", "yem-alan"],
};

/** Bu verdict, olayın "yakalanmış" (engellenmiş/işaretlenmiş) sayılması için mi? */
function yakalandiMi(verdict: Verdict): boolean {
  return verdict === "blocked" || verdict === "flagged" || verdict === "challenged";
}

/**
 * honeypotAnaliz — BotEvent[]'ten honeypot KAPSAMASINI simüle eder.
 *
 * Gözlenen olayların botClass/verdict'inden, hangi olayların hangi honeypot'ları
 * TETİKLEYECEĞİNİ çıkarır ve tuzak-başına etkinlik + genel özet üretir.
 *
 * DÜRÜSTLÜK: Bu gerçek honeypot isabeti değil, gözlenen trafikten türetilen
 * ÇIKARIMSAL kapsamadır. yanlisPozitif her tuzakta 0 — honeypot'un tanımsal
 * özelliği. Determinist: yalnızca events'e bakar.
 */
export function honeypotAnaliz(events: BotEvent[]): HoneypotAnalizRapor {
  // Sayaçları hazırla.
  const tetiklenmeSayac: Record<string, number> = {};
  const yakalananSayac: Record<string, number> = {};
  for (const t of TUZAKLAR) {
    tetiklenmeSayac[t.id] = 0;
    yakalananSayac[t.id] = 0;
  }

  // İnsan/iyi-bot olmayan olaylar honeypot adaylarıdır.
  const botOlaylar = events.filter((e) => e.botClass !== "human" && e.botClass !== "good_bot");
  // Aynı olay birden çok tuzak tarafından yakalanmış sayılmasın diye
  // benzersiz olay kimliği kümesi tutulur (kapsama tahmini için).
  const yakalananOlayIdler = new Set<string>();

  for (const e of botOlaylar) {
    const tuzakIdler = SINIF_TUZAK[e.botClass];
    if (!tuzakIdler || tuzakIdler.length === 0) continue;
    const yak = yakalandiMi(e.verdict);
    for (const tid of tuzakIdler) {
      tetiklenmeSayac[tid] += 1;
      if (yak) yakalananSayac[tid] += 1;
    }
    if (yak) yakalananOlayIdler.add(e.id);
  }

  const tuzaklar: TuzakEtkinlik[] = TUZAKLAR.map((t) => ({
    tuzak: t,
    tetiklenme: tetiklenmeSayac[t.id],
    yakalananBot: yakalananSayac[t.id],
    yanlisPozitif: 0 as const,
  }));

  const aktifTuzak = tuzaklar.filter((t) => t.tetiklenme > 0).length;
  const yakalananBotTahmini = yakalananOlayIdler.size;
  const toplamBot = botOlaylar.length;
  const kapsamaOrani = toplamBot > 0 ? yakalananBotTahmini / toplamBot : 0;

  return {
    tuzaklar,
    ozet: {
      toplamTuzak: TUZAKLAR.length,
      aktifTuzak,
      yakalananBotTahmini,
      kapsamaOrani,
    },
  };
}

/* ============================================================== WIDGET KODU */

/**
 * honeypotWidgetKod — müşterinin formuna gömeceği GERÇEK HTML parçasını üretir.
 *
 * ERİŞİLEBİLİRLİK GÜVENLİĞİ: Alanlar gerçek/engelli kullanıcılara zarar
 * vermeyecek şekilde işaretlenir:
 *   - aria-hidden="true"  → ekran-okuyucular alanı hiç duyurmaz
 *   - tabindex="-1"       → klavye sekme sırasına girmez
 *   - autocomplete="off"  → tarayıcı otomatik-doldurucusu tetiklenmez
 *   - display:none / off-screen → görsel olarak hiç görünmez
 * Böylece SADECE ham DOM'u kör-ayrıştıran botlar tuzağa düşer; insan asla.
 *
 * Determinist: siteKey dışında girdi yok, rastgelelik yok.
 */
export function honeypotWidgetKod(siteKey: string): string {
  const anahtar = siteKey || "SITE_ANAHTARINIZ";
  return `<!-- Specter Honeypot Tuzak Alanları -->
<!-- Bu alanları formunuzun İÇİNE, </form> etiketinden hemen önce ekleyin. -->
<!-- Erişilebilirlik: aria-hidden + tabindex=-1 + autocomplete=off →
     gerçek/engelli kullanıcılar bu alanları asla göremez veya dolduramaz;
     yalnızca ham HTML'i ayrıştıran botlar doldurur (~0 yanlış-pozitif). -->
<div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden">
  <!-- Gizli alan: gerçek formda olmayan, botun doldurduğu metin girdisi -->
  <label for="sp_hp_a">Bu alanı boş bırakın</label>
  <input type="text" id="sp_hp_a" name="sp_hp_a"
         tabindex="-1" autocomplete="off" value="">

  <!-- Yem alan: otomatik-doldurucuyu kandıran sahte "website" alanı -->
  <input type="text" id="sp_hp_website" name="website"
         tabindex="-1" autocomplete="off" value="">

  <!-- ARIA-gizli onay kutusu: botun işaretlediği görünmez kutu -->
  <input type="checkbox" id="sp_hp_ok" name="sp_hp_ok"
         tabindex="-1" autocomplete="off">

  <!-- Zaman tuzağı: form render zamanı (sunucu doldurur/JS damgalar) -->
  <input type="hidden" id="sp_hp_ts" name="sp_hp_ts" value="">
</div>

<!-- Veylify yükleyici: tuzakları izler ve sonucu Veylify'e raporlar -->
<script src="https://cdn.veylify.com/honeypot.js"
        data-site-key="${anahtar}"
        data-hp-fields="sp_hp_a,website,sp_hp_ok"
        data-hp-timestamp="sp_hp_ts"
        defer></script>
<script>
  // Zaman damgasını render anında bas (insan için imkânsız hızlı gönderimi ölçmek üzere)
  document.getElementById('sp_hp_ts').value = Date.now();
</script>
`;
}
