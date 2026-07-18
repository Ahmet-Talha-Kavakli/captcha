/**
 * Specter — Maliyet Optimizasyonu & Kaynak Verimliliği
 * =====================================================
 * "Bot koruması için FinOps" motoru. Doğrulama kotasının / compute'un NEREYE
 * harcandığını analiz eder, İSRAFı bulur (gereksiz challenge, düşük-değer
 * doğrulama, tekrar-doğrulama) ve güvenliği bozmadan maliyeti kısacak
 * OPTİMİZASYON önerileri üretir.
 *
 * SAFLIK KURALI: Bu modül tamamen deterministiktir. Date.now / Math.random
 * KULLANILMAZ. Tüm girdiler dışarıdan (Usage / Events) parametre olarak gelir;
 * çıktılar yalnızca girdiye bağlıdır. Böylece testler ve önbellek tutarlıdır.
 *
 * BİRİM-MALİYET MODELİ (temsili FinOps tahmini — kesin fatura değil)
 * -----------------------------------------------------------------
 * Her doğrulama (issued) iki kalem harcar:
 *   1) KOTA: 1 doğrulama = 1 kota birimi (plan aylık kotasından düşer).
 *   2) COMPUTE: doğrulamanın türüne göre değişen ağırlıklı işlem birimi (CU).
 *      Bir "geçiş" (allowed) hafif skorlama; bir "challenge" tam widget +
 *      biyometri + OCR direnci = çok daha pahalı; bir "block" orta maliyet.
 * Temsili ₺ birim maliyeti aşağıda sabit olarak tanımlıdır (BIRIM_TL).
 * Amaç mutlak fatura değil, harcamanın NEREYE gittiğini ve nerede İSRAF
 * olduğunu göstermektir.
 */

import type { UsageCounter, BotEvent } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Birim maliyet modeli */

/**
 * Verdict başına compute birimi (CU). Challenge en pahalı kalem: kullanıcıya
 * widget gösterilir, davranış biyometrisi toplanır, OCR direnci hesaplanır.
 * Geçiş (allowed) ucuz arka-plan skorlaması; block orta (kural değerlendirme).
 */
export const COMPUTE_BIRIMI: Record<"allowed" | "challenged" | "blocked" | "flagged", number> = {
  allowed: 1, // hafif pasif skorlama
  challenged: 6, // tam interaktif widget + biyometri + OCR (en pahalı)
  blocked: 2, // kural değerlendirme + kayıt
  flagged: 1.5, // izle + işaretle
};

/** Temsili ₺ birim maliyetleri (FinOps tahmini — gerçek fatura değil). */
export const BIRIM_TL = {
  /** 1 kota birimi (1 doğrulama) temsili ₺ maliyeti. */
  kotaBirim: 0.0025,
  /** 1 compute birimi (CU) temsili ₺ maliyeti. */
  computeBirim: 0.0008,
} as const;

/** Kısa/uzun pencere: aynı IP bu kadar ms içinde tekrar doğrulanırsa "tekrar" sayılır. */
export const TEKRAR_PENCERE_MS = 5 * 60 * 1000; // 5 dakika
/** "İyi skor" eşiği: bu skorun üstündeki bir istek insan/temiz kabul edilir. */
export const IYI_SKOR = 0.7;
/** Bir doğrulamayı "compute + kota" toplam ₺ maliyetine çeviren yardımcı. */
export function dogrulamaMaliyetTL(verdict: keyof typeof COMPUTE_BIRIMI): number {
  return BIRIM_TL.kotaBirim + COMPUTE_BIRIMI[verdict] * BIRIM_TL.computeBirim;
}

/* ------------------------------------------------------------------ Tipler */

/** Usage toplamı (30g). */
export interface KullanimToplam {
  issued: number;
  verified: number; // allowed
  blocked: number;
  challenged: number;
}

/** Tek bir israf kategorisi bulgusu. */
export interface IsrafKategori {
  /** Kategori anahtarı. */
  key: "gereksiz_challenge" | "dusuk_deger" | "tekrar_dogrulama";
  /** İnsan-okur ad. */
  ad: string;
  /** Kısa açıklama (neden israf). */
  aciklama: string;
  /** İsraf sayılan doğrulama adedi. */
  adet: number;
  /** Boşa giden kota birimi. */
  kotaIsraf: number;
  /** Boşa giden compute birimi (CU). */
  computeIsraf: number;
  /** Tahmini ₺ israf (kota + compute). */
  tlIsraf: number;
  /** Düzeltme için gidilecek panel yolu. */
  duzeltmeHref: string;
  /** Düzeltme CTA metni. */
  duzeltmeEtiket: string;
}

/** Kaynak dağılımı tek segment. */
export interface DagilimSegment {
  key: "gercek_tehdit" | "insan_challenge" | "iyi_bot" | "israf";
  ad: string;
  /** Bu segmente giden compute birimi (CU). */
  compute: number;
  /** Bu segmente giden ₺. */
  tl: number;
  /** Toplam içindeki yüzde (0..100). */
  yuzde: number;
  renk: string;
}

/** Optimizasyon önerisi. */
export interface Oneri {
  key: string;
  baslik: string;
  aciklama: string;
  /** Tahmini kota tasarrufu (birim/ay). */
  kotaTasarruf: number;
  /** Tahmini ₺ tasarrufu (ay). */
  tlTasarruf: number;
  /** Toplam maliyete göre tasarruf yüzdesi (0..100). */
  tasarrufYuzde: number;
  /** Öncelik: yüksek tasarruf + düşük risk = yüksek öncelik. */
  oncelik: "yuksek" | "orta" | "dusuk";
  /** Güvenlik riski notu (dürüst): bu öneri güvenliği bozar mı? */
  guvenlikNotu: string;
  cta: { etiket: string; href: string };
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Usage listesini 30g toplamına indirger. */
export function kullanimToplami(usage: UsageCounter[]): KullanimToplam {
  return usage.reduce(
    (a, u) => ({
      issued: a.issued + u.issued,
      verified: a.verified + u.verified,
      blocked: a.blocked + u.blocked,
      challenged: a.challenged + u.challenged,
    }),
    { issued: 0, verified: 0, blocked: 0, challenged: 0 },
  );
}

/**
 * Toplam compute birimi (CU) tahmini — Usage sayaçlarından.
 * challenged + blocked + verified (allowed) karışımı ağırlıklı toplanır.
 */
export function toplamCompute(t: KullanimToplam): number {
  return (
    t.verified * COMPUTE_BIRIMI.allowed +
    t.challenged * COMPUTE_BIRIMI.challenged +
    t.blocked * COMPUTE_BIRIMI.blocked
  );
}

/* ------------------------------------------------------------------ İsraf analizi */

/**
 * İsraf analizi. Events örneklemi üzerinden üç israf türünü tespit eder ve
 * Usage toplamına oranlayarak 30g ölçeğine yükseltir (Events genelde son N
 * olay; Usage ise tam 30g sayacı). Böylece küçük örneklem tüm dönemi temsil eder.
 *
 * (a) gereksiz_challenge → iyi skorlu (IYI_SKOR üstü) insan/iyi-bot olduğu
 *     halde challenge veya block yemiş istekler. Bunlar hem kotayı hem de
 *     pahalı challenge compute'unu boşa harcar + kullanıcı sürtünmesi yaratır.
 * (b) dusuk_deger → zaten temiz (yüksek skor) trafikte yapılan allowed
 *     doğrulamalar: tehdit olmayan trafiği tekrar tekrar skorlamak düşük değer;
 *     görünmez mod / allowlist ile ucuzlatılabilir.
 * (c) tekrar_dogrulama → aynı IP'nin kısa pencere (TEKRAR_PENCERE_MS) içinde
 *     birden çok kez doğrulanması. İlk doğrulama meşru; sonrakiler tekrar =
 *     önbelleklenebilir/atlanabilir israf.
 */
export function israfAnaliz(usage: UsageCounter[], events: BotEvent[]): IsrafKategori[] {
  const t = kullanimToplami(usage);
  const orneklem = events.length;

  // Örneklem → 30g ölçek çarpanı. Events, Usage'ın issued'ından küçükse
  // bulunan israf oranını tüm dönemin issued'ına uygularız.
  const olcek = orneklem > 0 ? t.issued / orneklem : 0;

  // --- (a) gereksiz challenge: iyi skor + challenged/blocked verdict ---
  let gereksizChallengeOrnek = 0;
  // --- (b) düşük değer: iyi skor + allowed (zaten temiz trafiğe doğrulama) ---
  let dusukDegerOrnek = 0;
  // --- (c) tekrar doğrulama: aynı IP kısa pencerede >1 kez ---
  const ipSonTs = new Map<string, number>();
  let tekrarOrnek = 0;

  // Olayları zaman sırasına koy (tekrar penceresi doğru işlesin). Kopya
  // üzerinde sırala — girdiyi mutasyona uğratma (saflık/yan etkisiz).
  const sirali = [...events].sort((a, b) => a.ts - b.ts);
  for (const e of sirali) {
    const iyiSkor = e.score >= IYI_SKOR;
    const insanImsi = e.botClass === "human" || e.botClass === "good_bot";

    if (iyiSkor && insanImsi && (e.verdict === "challenged" || e.verdict === "blocked")) {
      gereksizChallengeOrnek++;
    }
    if (iyiSkor && insanImsi && e.verdict === "allowed") {
      dusukDegerOrnek++;
    }

    const onceki = ipSonTs.get(e.ip);
    if (onceki !== undefined && e.ts - onceki <= TEKRAR_PENCERE_MS) {
      tekrarOrnek++;
    }
    ipSonTs.set(e.ip, e.ts);
  }

  // Örneklemi 30g ölçeğine yükselt (yuvarla) ve GERÇEKÇİ tavanlarla sınırla:
  // İsraf, ilgili verdict'in gerçek 30g sayacını AŞAMAZ. Böylece küçük/aşırı
  // örneklem, dönemi olduğundan fazla temsil edemez (dürüst tahmin).
  const gereksizChallenge = Math.min(t.challenged, Math.round(gereksizChallengeOrnek * olcek));
  const dusukDeger = Math.min(t.verified, Math.round(dusukDegerOrnek * olcek));
  const tekrar = Math.min(t.verified, Math.round(tekrarOrnek * olcek));

  const kat = (
    key: IsrafKategori["key"],
    ad: string,
    aciklama: string,
    adet: number,
    verdictMaliyet: keyof typeof COMPUTE_BIRIMI,
    duzeltmeHref: string,
    duzeltmeEtiket: string,
  ): IsrafKategori => {
    const computeIsraf = adet * COMPUTE_BIRIMI[verdictMaliyet];
    const kotaIsraf = adet; // her doğrulama 1 kota birimi
    const tlIsraf = round2(kotaIsraf * BIRIM_TL.kotaBirim + computeIsraf * BIRIM_TL.computeBirim);
    return { key, ad, aciklama, adet, kotaIsraf, computeIsraf, tlIsraf, duzeltmeHref, duzeltmeEtiket };
  };

  return [
    kat(
      "gereksiz_challenge",
      "Gereksiz challenge",
      "İyi skorlu (insan/iyi-bot) trafiğe gösterilen challenge/block. Pahalı compute + kullanıcı sürtünmesi + kayıp dönüşüm.",
      gereksizChallenge,
      "challenged",
      "/panel/zorluk",
      "Görünmez modu aç",
    ),
    kat(
      "dusuk_deger",
      "Düşük-değer doğrulama",
      "Zaten temiz (yüksek skor) trafiğe yapılan doğrulama. Tehdit yokken kota yakar; allowlist ile ucuzlatılabilir.",
      dusukDeger,
      "allowed",
      "/panel/kurallar",
      "İyi-bot allowlist kur",
    ),
    kat(
      "tekrar_dogrulama",
      "Tekrar-doğrulama",
      `Aynı IP'nin ${Math.round(TEKRAR_PENCERE_MS / 60000)} dk içinde birden çok kez doğrulanması. İlk doğrulama önbelleklenip tekrarı atlanabilir.`,
      tekrar,
      "allowed",
      "/panel/rate-politika",
      "Doğrulama önbelleği ekle",
    ),
  ];
}

/* ------------------------------------------------------------------ Verimlilik skoru */

/**
 * Verimlilik skoru (0..100): "değerli" compute'un toplam compute'a oranı.
 * Değerli = gerçek tehdit engelleme (blocked) + gerçekten şüpheli challenge.
 * İsraf (gereksiz challenge + düşük değer + tekrar) bu orandan düşer.
 * Skor düştükçe: kotanın büyük kısmı işe yaramayan doğrulamalara gidiyor demektir.
 */
export function verimlilikSkoru(usage: UsageCounter[], events: BotEvent[]): {
  skor: number;
  israfYuzde: number;
  toplamCompute: number;
  israfCompute: number;
} {
  const t = kullanimToplami(usage);
  const toplam = toplamCompute(t);
  const israf = israfAnaliz(usage, events);
  const israfCompute = israf.reduce((a, k) => a + k.computeIsraf, 0);

  if (toplam <= 0) {
    return { skor: 0, israfYuzde: 0, toplamCompute: 0, israfCompute: 0 };
  }
  // İsraf toplam compute'u aşamaz (örneklem-ölçek gürültüsüne karşı sınırla).
  const sinirliIsraf = Math.min(israfCompute, toplam);
  const israfYuzde = (sinirliIsraf / toplam) * 100;
  const skor = Math.max(0, Math.min(100, Math.round(100 - israfYuzde)));
  return {
    skor,
    israfYuzde: round2(israfYuzde),
    toplamCompute: round2(toplam),
    israfCompute: round2(sinirliIsraf),
  };
}

/* ------------------------------------------------------------------ Kaynak dağılımı */

/**
 * Kaynak dağılımı: kotanın/compute'un nereye gittiği. Dört segment:
 *   gerçek-tehdit-engelleme / insan-challenge / iyi-bot / israf.
 * İsraf compute'u, ilgili segmentlerden düşülüp ayrı "israf" dilimine taşınır;
 * böylece kullanıcı "verimli harcama" ile "boşa harcama"yı yan yana görür.
 */
export function kaynakDagilim(usage: UsageCounter[], events: BotEvent[]): DagilimSegment[] {
  const t = kullanimToplami(usage);
  const israf = israfAnaliz(usage, events);
  const israfCompute = israf.reduce((a, k) => a + k.computeIsraf, 0);

  // Ham compute kalemleri.
  const engelCompute = t.blocked * COMPUTE_BIRIMI.blocked; // gerçek tehdit engelleme
  const challengeCompute = t.challenged * COMPUTE_BIRIMI.challenged; // insan challenge
  const iyiBotCompute = t.verified * COMPUTE_BIRIMI.allowed; // iyi/temiz geçiş

  const hamToplam = engelCompute + challengeCompute + iyiBotCompute;
  // İsraf, ham compute'u aşamaz.
  const israfSinirli = Math.min(israfCompute, hamToplam);

  // İsrafı orantılı olarak challenge + iyi-bot dilimlerinden düş (israfın
  // kaynağı ağırlıklı olarak bunlar). Engelleme "gerçek tehdit" olarak korunur.
  const israfKaynak = challengeCompute + iyiBotCompute || 1;
  const challengeDus = israfSinirli * (challengeCompute / israfKaynak);
  const iyiBotDus = israfSinirli * (iyiBotCompute / israfKaynak);

  const segmentlerHam: Array<Omit<DagilimSegment, "yuzde">> = [
    {
      key: "gercek_tehdit",
      ad: "Gerçek tehdit engelleme",
      compute: round2(engelCompute),
      tl: round2(engelCompute * BIRIM_TL.computeBirim),
      renk: "#dc2626",
    },
    {
      key: "insan_challenge",
      ad: "İnsan challenge",
      compute: round2(Math.max(0, challengeCompute - challengeDus)),
      tl: round2(Math.max(0, challengeCompute - challengeDus) * BIRIM_TL.computeBirim),
      renk: "#2f6fed",
    },
    {
      key: "iyi_bot",
      ad: "İyi-bot / temiz geçiş",
      compute: round2(Math.max(0, iyiBotCompute - iyiBotDus)),
      tl: round2(Math.max(0, iyiBotCompute - iyiBotDus) * BIRIM_TL.computeBirim),
      renk: "#16a34a",
    },
    {
      key: "israf",
      ad: "İsraf (boşa harcanan)",
      compute: round2(israfSinirli),
      tl: round2(israfSinirli * BIRIM_TL.computeBirim),
      renk: "#d97706",
    },
  ];

  const toplam = segmentlerHam.reduce((a, s) => a + s.compute, 0) || 1;
  return segmentlerHam.map((s) => ({ ...s, yuzde: round1((s.compute / toplam) * 100) }));
}

/* ------------------------------------------------------------------ Optimizasyon önerileri */

/**
 * Optimizasyon önerileri. İsraf bulgularını eyleme dönüştürür; her öneri
 * beklenen tasarrufla (kota + ₺ + %) ve DÜRÜST güvenlik notuyla gelir.
 * Öneriler tasarruf büyüklüğüne göre sıralanır (yüksek öncelik üstte).
 */
export function optimizasyonOnerileri(usage: UsageCounter[], events: BotEvent[]): Oneri[] {
  const t = kullanimToplami(usage);
  const toplamTL = t.issued * BIRIM_TL.kotaBirim + toplamCompute(t) * BIRIM_TL.computeBirim;
  const israf = israfAnaliz(usage, events);
  const byKey = (k: IsrafKategori["key"]) => israf.find((x) => x.key === k)!;

  const gc = byKey("gereksiz_challenge");
  const dd = byKey("dusuk_deger");
  const tk = byKey("tekrar_dogrulama");

  const oneriYap = (
    key: string,
    baslik: string,
    aciklama: string,
    kotaTasarruf: number,
    computeTasarruf: number,
    guvenlikNotu: string,
    cta: Oneri["cta"],
  ): Oneri => {
    const tl = round2(kotaTasarruf * BIRIM_TL.kotaBirim + computeTasarruf * BIRIM_TL.computeBirim);
    const yuzde = toplamTL > 0 ? round1((tl / toplamTL) * 100) : 0;
    const oncelik: Oneri["oncelik"] = yuzde >= 15 ? "yuksek" : yuzde >= 5 ? "orta" : "dusuk";
    return { key, baslik, aciklama, kotaTasarruf, tlTasarruf: tl, tasarrufYuzde: yuzde, oncelik, guvenlikNotu, cta };
  };

  const oneriler: Oneri[] = [];

  // 1) Görünmez mod: gereksiz challenge'ları sessiz skorlamaya çevir. Challenge
  //    compute'unun ~%80'i kurtulur (allowed compute'una iner). Kota da düşer.
  if (gc.adet > 0) {
    const challengeToAllowed = COMPUTE_BIRIMI.challenged - COMPUTE_BIRIMI.allowed;
    oneriler.push(
      oneriYap(
        "gorunmez_mod",
        `Görünmez mod ile ${gc.adet.toLocaleString("tr-TR")} gereksiz challenge azalt`,
        "İyi skorlu insan trafiğine challenge gösterme; arka planda sessiz skorla. Pahalı widget compute'u ortadan kalkar, sürtünme sıfırlanır.",
        // Kota kurtarma: bu doğrulamalar hâlâ yapılır ama düşük skorluları koruma
        // altında kalır; challenge'a özel ek kota tüketimi kalkar → yaklaşık adet.
        gc.adet,
        gc.adet * challengeToAllowed,
        "Güvenlik korunur: düşük skorlu trafik yine tam challenge alır; yalnızca YÜKSEK skorlu (kanıtlı insan) trafiğe sürtünme kaldırılır.",
        { etiket: "Adaptif Zorluğu aç", href: "/panel/zorluk" },
      ),
    );
  }

  // 2) İyi-bot allowlist: düşük-değer doğrulamaları allowlist ile atla.
  if (dd.adet > 0) {
    const kurtarilan = Math.round(dd.adet * 0.6); // temkinli: %60'ı allowlist'lenebilir
    oneriler.push(
      oneriYap(
        "iyi_bot_allowlist",
        `İyi-bot allowlist ile ${kurtarilan.toLocaleString("tr-TR")} doğrulama tasarruf`,
        "Doğrulanmış iyi-botları (arama motorları, izleme) ve yüksek-itibarlı IP'leri allowlist'e al; her istekte yeniden skorlama.",
        kurtarilan,
        kurtarilan * COMPUTE_BIRIMI.allowed,
        "Düşük risk: allowlist yalnızca kanıtlı iyi-bot ve doğrulanmış itibar içindir; şüpheli trafik kapsam dışıdır.",
        { etiket: "Kural oluştur", href: "/panel/kurallar" },
      ),
    );
  }

  // 3) Doğrulama önbelleği: tekrar-doğrulamaları kısa pencerede önbellekle.
  if (tk.adet > 0) {
    oneriler.push(
      oneriYap(
        "dogrulama_onbellek",
        `Doğrulama önbelleği ile ${tk.adet.toLocaleString("tr-TR")} tekrar doğrulama ele`,
        `Aynı IP/fingerprint ${Math.round(TEKRAR_PENCERE_MS / 60000)} dk içinde tekrar geldiğinde ilk kararı önbellekten dön; yeniden skorlama.`,
        tk.adet,
        tk.adet * COMPUTE_BIRIMI.allowed,
        "Güvenlik nötr: önbellek yalnızca kısa pencerede geçerlidir; itibar değişirse veya süre dolarsa yeniden tam doğrulama yapılır.",
        { etiket: "Hız & kota politikası", href: "/panel/rate-politika" },
      ),
    );
  }

  // 4) Düşük-değer kuralları buda: hiç iş görmeyen ama compute yakan kurallar.
  //    (Kural bazlı; israf toplamının küçük ama garantili bir dilimi.)
  const budamaKota = Math.round((dd.adet + tk.adet) * 0.1);
  if (budamaKota > 0) {
    oneriler.push(
      oneriYap(
        "kural_budama",
        "Düşük-değer kuralları buda",
        "Nadiren tetiklenen ama her istekte değerlendirilen kuralları kaldır; kural değerlendirme compute'unu azalt.",
        budamaKota,
        budamaKota * COMPUTE_BIRIMI.blocked,
        "Güvenlik korunur: yalnızca uzun süredir hiç eşleşmeyen (ölü) kurallar önerilir; aktif koruma kuralları dokunulmaz.",
        { etiket: "Kural performansına git", href: "/panel/kural-performans" },
      ),
    );
  }

  // Tasarruf büyüklüğüne göre azalan sırala (deterministik; eşitlikte key).
  return oneriler.sort((a, b) => b.tlTasarruf - a.tlTasarruf || a.key.localeCompare(b.key));
}

/* ------------------------------------------------------------------ Tasarruf projeksiyonu */

/**
 * Tasarruf projeksiyonu: tüm öneriler uygulanırsa aylık kota/₺ tasarrufu ve
 * YENİ verimlilik skoru. Kurtarılan compute toplam israftan düşülür.
 */
export function tasarrufProjeksiyon(usage: UsageCounter[], events: BotEvent[]): {
  toplamKotaTasarruf: number;
  toplamTLTasarruf: number;
  mevcutSkor: number;
  yeniSkor: number;
  mevcutAylikTL: number;
  yeniAylikTL: number;
} {
  const t = kullanimToplami(usage);
  const oneriler = optimizasyonOnerileri(usage, events);
  const vs = verimlilikSkoru(usage, events);

  const toplamKotaTasarruf = oneriler.reduce((a, o) => a + o.kotaTasarruf, 0);
  const toplamTLTasarruf = round2(oneriler.reduce((a, o) => a + o.tlTasarruf, 0));

  const mevcutAylikTL = round2(t.issued * BIRIM_TL.kotaBirim + toplamCompute(t) * BIRIM_TL.computeBirim);
  const yeniAylikTL = round2(Math.max(0, mevcutAylikTL - toplamTLTasarruf));

  // Yeni skor: israfın kurtarılan kısmı verimliye döner. Kurtarılan compute ~
  // önerilerin compute etkisi; basitçe israf compute'unu sıfıra doğru çekeriz.
  const kurtarilanCompute = Math.min(vs.israfCompute, vs.israfCompute); // tüm israf hedeflenir
  const yeniIsrafCompute = Math.max(0, vs.israfCompute - kurtarilanCompute);
  const yeniIsrafYuzde = vs.toplamCompute > 0 ? (yeniIsrafCompute / vs.toplamCompute) * 100 : 0;
  const yeniSkor = Math.max(0, Math.min(100, Math.round(100 - yeniIsrafYuzde)));

  return {
    toplamKotaTasarruf,
    toplamTLTasarruf,
    mevcutSkor: vs.skor,
    yeniSkor,
    mevcutAylikTL,
    yeniAylikTL,
  };
}

/* ------------------------------------------------------------------ Ufak yuvarlama yardımcıları */

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
