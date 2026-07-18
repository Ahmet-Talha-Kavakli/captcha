/**
 * Maliyet Optimizasyonu sayfası — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `src/lib/specter/maliyet-optim.ts`
 * DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * MOTOR-METNİ SORUNU
 * ------------------
 * Lib (`maliyet-optim.ts`) her israf kategorisi / dağılım segmenti / öneri için
 * Türkçe metin üretir; içinde sayılar gömülüdür. Lib'i düzenleyemediğimiz için:
 *   - İsraf kategorileri `key` (enum) ile eşlenir → ad/açıklama/CTA çevrilir;
 *     `key` değeri asla çevrilmez (label-map → key-map).
 *   - Dağılım segmentleri `key` (enum) ile eşlenir → ad çevrilir.
 *   - Öneriler `key` (enum) ile eşlenir → başlık/açıklama/güvenlik notu/CTA
 *     çevrilir; başlıktaki SAYI `o.kotaTasarruf`tan (veri) türetilip yerleştirilir.
 * Sayılar/₺/tarih VERİ olarak kalır; yalnızca yerelleştirilmiş biçimlenir.
 */
import type { Dil } from "@/lib/i18n/panel";
import { TEKRAR_PENCERE_MS } from "@/lib/specter/maliyet-optim";

/** İsraf/segment/öneri için lib'den gelen kararlı anahtar tipleri. */
type IsrafKey = "gereksiz_challenge" | "dusuk_deger" | "tekrar_dogrulama";
type SegmentKey = "gercek_tehdit" | "insan_challenge" | "iyi_bot" | "israf";

/** Tekrar penceresi (dk) — açıklama şablonlarına gömülür. */
const TEKRAR_DK = Math.round(TEKRAR_PENCERE_MS / 60000);

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Giriş şeridi
    "mo.serit.baslik": "Bot koruması için FinOps: harcadığın her doğrulamayı hesaba kat.",
    "mo.serit.aciklama":
      "Kotanın ve compute'un nereye gittiğini gör, israfı bul (insanları gereksiz zorlama, tekrar doğrulama, düşük-değer kurallar) ve güvenliği bozmadan maliyeti kıs. Plan: {plan}.",

    // Üst özet kartları
    "mo.ozet.verimlilik": "Verimlilik skoru",
    "mo.ozet.israfOran": "İsraf oranı (compute)",
    "mo.ozet.aylikIsraf": "Aylık tahmini israf",
    "mo.ozet.potansiyel": "Potansiyel tasarruf/ay",

    // Verimlilik paneli
    "mo.verim.baslik": "Verimlilik skoru",
    "mo.verim.verimli": "Verimli",
    "mo.verim.iyi": "İyi",
    "mo.verim.orta": "Orta",
    "mo.verim.israfli": "İsraflı",
    "mo.verim.aciklama":
      "Değerli doğrulamaların (gerçek tehdit + şüpheli challenge) toplam compute'a oranı. Yükseldikçe kotan işe yarıyor.",
    "mo.verim.toplamCompute": "Toplam compute (CU)",
    "mo.verim.israfCompute": "İsraf compute (CU)",

    // Kaynak dağılımı
    "mo.dagilim.baslik": "Kaynak dağılımı — kota/compute nereye gidiyor?",
    "mo.dagilim.not":
      "Turuncu dilim (israf) ne kadar büyükse, kotanın o kadarı işe yaramayan doğrulamaya gidiyor demektir.",

    // Segment adları (key-map)
    "mo.seg.gercek_tehdit": "Gerçek tehdit engelleme",
    "mo.seg.insan_challenge": "İnsan challenge",
    "mo.seg.iyi_bot": "İyi-bot / temiz geçiş",
    "mo.seg.israf": "İsraf (boşa harcanan)",

    // İsraf analizi
    "mo.israf.baslik": "İsraf analizi",
    "mo.israf.rozet": "{tl}/ay · {kota} kota",
    "mo.israf.temiz": "Temiz",
    "mo.israf.dogrulama": "doğrulama",
    "mo.israf.kota": "kota",

    // İsraf kategorileri (key-map)
    "mo.kat.gereksiz_challenge.ad": "Gereksiz challenge",
    "mo.kat.gereksiz_challenge.aciklama":
      "İyi skorlu (insan/iyi-bot) trafiğe gösterilen challenge/block. Pahalı compute + kullanıcı sürtünmesi + kayıp dönüşüm.",
    "mo.kat.gereksiz_challenge.cta": "Görünmez modu aç",
    "mo.kat.dusuk_deger.ad": "Düşük-değer doğrulama",
    "mo.kat.dusuk_deger.aciklama":
      "Zaten temiz (yüksek skor) trafiğe yapılan doğrulama. Tehdit yokken kota yakar; allowlist ile ucuzlatılabilir.",
    "mo.kat.dusuk_deger.cta": "İyi-bot allowlist kur",
    "mo.kat.tekrar_dogrulama.ad": "Tekrar-doğrulama",
    "mo.kat.tekrar_dogrulama.aciklama":
      "Aynı IP'nin {dk} dk içinde birden çok kez doğrulanması. İlk doğrulama önbelleklenip tekrarı atlanabilir.",
    "mo.kat.tekrar_dogrulama.cta": "Doğrulama önbelleği ekle",

    // Optimizasyon önerileri
    "mo.oneri.baslik": "Optimizasyon önerileri",
    "mo.oneri.rozet": "{n} öneri",
    "mo.oneri.bosBaslik": "Belirgin bir israf bulunamadı.",
    "mo.oneri.bosAciklama": "Koruma yapılandırman şu an verimli görünüyor.",

    // Öncelik etiketleri (key-map)
    "mo.oncelik.yuksek": "Yüksek öncelik",
    "mo.oncelik.orta": "Orta öncelik",
    "mo.oncelik.dusuk": "Düşük öncelik",

    // Öneri metinleri (key-map; {n} = kotaTasarruf)
    "mo.on.gorunmez_mod.baslik": "Görünmez mod ile {n} gereksiz challenge azalt",
    "mo.on.gorunmez_mod.aciklama":
      "İyi skorlu insan trafiğine challenge gösterme; arka planda sessiz skorla. Pahalı widget compute'u ortadan kalkar, sürtünme sıfırlanır.",
    "mo.on.gorunmez_mod.guvenlik":
      "Güvenlik korunur: düşük skorlu trafik yine tam challenge alır; yalnızca YÜKSEK skorlu (kanıtlı insan) trafiğe sürtünme kaldırılır.",
    "mo.on.gorunmez_mod.cta": "Adaptif Zorluğu aç",
    "mo.on.iyi_bot_allowlist.baslik": "İyi-bot allowlist ile {n} doğrulama tasarruf",
    "mo.on.iyi_bot_allowlist.aciklama":
      "Doğrulanmış iyi-botları (arama motorları, izleme) ve yüksek-itibarlı IP'leri allowlist'e al; her istekte yeniden skorlama.",
    "mo.on.iyi_bot_allowlist.guvenlik":
      "Düşük risk: allowlist yalnızca kanıtlı iyi-bot ve doğrulanmış itibar içindir; şüpheli trafik kapsam dışıdır.",
    "mo.on.iyi_bot_allowlist.cta": "Kural oluştur",
    "mo.on.dogrulama_onbellek.baslik": "Doğrulama önbelleği ile {n} tekrar doğrulama ele",
    "mo.on.dogrulama_onbellek.aciklama":
      "Aynı IP/fingerprint {dk} dk içinde tekrar geldiğinde ilk kararı önbellekten dön; yeniden skorlama.",
    "mo.on.dogrulama_onbellek.guvenlik":
      "Güvenlik nötr: önbellek yalnızca kısa pencerede geçerlidir; itibar değişirse veya süre dolarsa yeniden tam doğrulama yapılır.",
    "mo.on.dogrulama_onbellek.cta": "Hız & kota politikası",
    "mo.on.kural_budama.baslik": "Düşük-değer kuralları buda",
    "mo.on.kural_budama.aciklama":
      "Nadiren tetiklenen ama her istekte değerlendirilen kuralları kaldır; kural değerlendirme compute'unu azalt.",
    "mo.on.kural_budama.guvenlik":
      "Güvenlik korunur: yalnızca uzun süredir hiç eşleşmeyen (ölü) kurallar önerilir; aktif koruma kuralları dokunulmaz.",
    "mo.on.kural_budama.cta": "Kural performansına git",

    // Tasarruf projeksiyonu
    "mo.proj.baslik": "Tasarruf projeksiyonu — tüm öneriler uygulanırsa",
    "mo.proj.verimlilik": "Verimlilik skoru",
    "mo.proj.puan": "↑ {n} puan",
    "mo.proj.aylikMaliyet": "Aylık tahmini maliyet",
    "mo.proj.toplamTasarruf": "Toplam tasarruf",
    "mo.proj.kotaKurtarilir": "{n} kota/ay kurtarılır",
    "mo.proj.aylikKota": "Aylık kota kullanımı",
    "mo.proj.aciklama":
      "Önerilen optimizasyonlar uygulanırsa aylık {n} doğrulama kotası boşa gitmez — bu, kota aşımını ve plan yükseltme baskısını erteler.",
    "mo.proj.adaptifZorluk": "Adaptif zorluk",
    "mo.proj.maliyetFatura": "Maliyet & fatura",

    // 30g trend
    "mo.trend.baslik": "30 günlük maliyet trendi (tahmini ₺/gün)",
    "mo.trend.aciklama":
      "Günlük tahmini maliyet = kota birimi × doğrulama + compute (verdict ağırlıklı) × compute birimi.",

    // Birim maliyet + not
    "mo.birim.baslik": "Kullanılan birim-maliyet modeli",
    "mo.birim.kota": "1 kota birimi (doğrulama)",
    "mo.birim.compute": "1 compute birimi (CU)",
    "mo.birim.challenge": "Challenge ağırlığı",
    "mo.birim.block": "Block ağırlığı",
    "mo.birim.gecis": "Geçiş (allowed) ağırlığı",
    "mo.not.baslik": "Bu sayılar temsili FinOps tahminleridir",
    "mo.not.govde":
      "Birim maliyetler (kota + compute) temsili değerlerdir; kesin fatura tutarı değildir. Amaç, harcamanın nereye gittiğini ve nerede israf olduğunu görünür kılmaktır. Challenge, interaktif widget + davranış biyometrisi + OCR direnci içerdiği için en pahalı kalem olarak modellenir. Gerçek maliyetler planına ve trafik karışımına göre değişir — kararları vermeden önce {link} ile karşılaştır.",
    "mo.not.link": "Maliyet & Fatura",
  },

  en: {
    "mo.serit.baslik": "FinOps for bot protection: account for every verification you spend.",
    "mo.serit.aciklama":
      "See where your quota and compute go, find waste (needlessly challenging humans, re-verification, low-value rules) and cut cost without breaking security. Plan: {plan}.",

    "mo.ozet.verimlilik": "Efficiency score",
    "mo.ozet.israfOran": "Waste ratio (compute)",
    "mo.ozet.aylikIsraf": "Est. monthly waste",
    "mo.ozet.potansiyel": "Potential savings/mo",

    "mo.verim.baslik": "Efficiency score",
    "mo.verim.verimli": "Efficient",
    "mo.verim.iyi": "Good",
    "mo.verim.orta": "Fair",
    "mo.verim.israfli": "Wasteful",
    "mo.verim.aciklama":
      "The ratio of valuable verifications (real threats + suspicious challenges) to total compute. The higher it is, the more your quota is put to work.",
    "mo.verim.toplamCompute": "Total compute (CU)",
    "mo.verim.israfCompute": "Wasted compute (CU)",

    "mo.dagilim.baslik": "Resource distribution — where do quota/compute go?",
    "mo.dagilim.not":
      "The bigger the orange slice (waste), the more of your quota goes to verifications that do no work.",

    "mo.seg.gercek_tehdit": "Real threat blocking",
    "mo.seg.insan_challenge": "Human challenge",
    "mo.seg.iyi_bot": "Good-bot / clean pass",
    "mo.seg.israf": "Waste (spent in vain)",

    "mo.israf.baslik": "Waste analysis",
    "mo.israf.rozet": "{tl}/mo · {kota} quota",
    "mo.israf.temiz": "Clean",
    "mo.israf.dogrulama": "verifications",
    "mo.israf.kota": "quota",

    "mo.kat.gereksiz_challenge.ad": "Unnecessary challenge",
    "mo.kat.gereksiz_challenge.aciklama":
      "Challenge/block shown to well-scored (human/good-bot) traffic. Expensive compute + user friction + lost conversion.",
    "mo.kat.gereksiz_challenge.cta": "Enable invisible mode",
    "mo.kat.dusuk_deger.ad": "Low-value verification",
    "mo.kat.dusuk_deger.aciklama":
      "Verification on already-clean (high-score) traffic. Burns quota with no threat present; can be made cheaper with an allowlist.",
    "mo.kat.dusuk_deger.cta": "Set up good-bot allowlist",
    "mo.kat.tekrar_dogrulama.ad": "Re-verification",
    "mo.kat.tekrar_dogrulama.aciklama":
      "The same IP verified multiple times within {dk} min. The first verification can be cached and the repeat skipped.",
    "mo.kat.tekrar_dogrulama.cta": "Add verification cache",

    "mo.oneri.baslik": "Optimization recommendations",
    "mo.oneri.rozet": "{n} recommendations",
    "mo.oneri.bosBaslik": "No notable waste found.",
    "mo.oneri.bosAciklama": "Your protection configuration looks efficient right now.",

    "mo.oncelik.yuksek": "High priority",
    "mo.oncelik.orta": "Medium priority",
    "mo.oncelik.dusuk": "Low priority",

    "mo.on.gorunmez_mod.baslik": "Cut {n} unnecessary challenges with invisible mode",
    "mo.on.gorunmez_mod.aciklama":
      "Don't show a challenge to well-scored human traffic; score silently in the background. The expensive widget compute disappears and friction goes to zero.",
    "mo.on.gorunmez_mod.guvenlik":
      "Security is preserved: low-score traffic still gets a full challenge; friction is removed only for HIGH-score (proven human) traffic.",
    "mo.on.gorunmez_mod.cta": "Enable Adaptive Difficulty",
    "mo.on.iyi_bot_allowlist.baslik": "Save {n} verifications with a good-bot allowlist",
    "mo.on.iyi_bot_allowlist.aciklama":
      "Allowlist verified good bots (search engines, monitoring) and high-reputation IPs; stop re-scoring on every request.",
    "mo.on.iyi_bot_allowlist.guvenlik":
      "Low risk: the allowlist is only for proven good bots and verified reputation; suspicious traffic is out of scope.",
    "mo.on.iyi_bot_allowlist.cta": "Create rule",
    "mo.on.dogrulama_onbellek.baslik": "Eliminate {n} re-verifications with a verification cache",
    "mo.on.dogrulama_onbellek.aciklama":
      "When the same IP/fingerprint returns within {dk} min, serve the first decision from cache instead of re-scoring.",
    "mo.on.dogrulama_onbellek.guvenlik":
      "Security neutral: the cache is valid only within a short window; if reputation changes or it expires, a full verification runs again.",
    "mo.on.dogrulama_onbellek.cta": "Rate & quota policy",
    "mo.on.kural_budama.baslik": "Prune low-value rules",
    "mo.on.kural_budama.aciklama":
      "Remove rules that rarely fire but are evaluated on every request; reduce rule-evaluation compute.",
    "mo.on.kural_budama.guvenlik":
      "Security is preserved: only long-dead (never-matching) rules are suggested; active protection rules are untouched.",
    "mo.on.kural_budama.cta": "Go to rule performance",

    "mo.proj.baslik": "Savings projection — if all recommendations are applied",
    "mo.proj.verimlilik": "Efficiency score",
    "mo.proj.puan": "↑ {n} points",
    "mo.proj.aylikMaliyet": "Est. monthly cost",
    "mo.proj.toplamTasarruf": "Total savings",
    "mo.proj.kotaKurtarilir": "{n} quota/mo saved",
    "mo.proj.aylikKota": "Monthly quota usage",
    "mo.proj.aciklama":
      "If the recommended optimizations are applied, {n} verification quota per month won't be wasted — this defers quota overruns and upgrade pressure.",
    "mo.proj.adaptifZorluk": "Adaptive difficulty",
    "mo.proj.maliyetFatura": "Cost & billing",

    "mo.trend.baslik": "30-day cost trend (est. ₺/day)",
    "mo.trend.aciklama":
      "Daily estimated cost = quota unit × verification + compute (verdict-weighted) × compute unit.",

    "mo.birim.baslik": "Unit-cost model used",
    "mo.birim.kota": "1 quota unit (verification)",
    "mo.birim.compute": "1 compute unit (CU)",
    "mo.birim.challenge": "Challenge weight",
    "mo.birim.block": "Block weight",
    "mo.birim.gecis": "Pass (allowed) weight",
    "mo.not.baslik": "These figures are representative FinOps estimates",
    "mo.not.govde":
      "Unit costs (quota + compute) are representative values, not an exact bill. The goal is to make visible where spending goes and where waste occurs. Challenge is modeled as the most expensive item because it includes the interactive widget + behavioral biometrics + OCR resistance. Real costs vary with your plan and traffic mix — compare with {link} before deciding.",
    "mo.not.link": "Cost & Billing",
  },

  de: {
    "mo.serit.baslik": "FinOps für Bot-Schutz: Berücksichtige jede Verifizierung, die du ausgibst.",
    "mo.serit.aciklama":
      "Sieh, wohin dein Kontingent und Compute fließen, finde Verschwendung (Menschen unnötig herausfordern, Neuverifizierung, Regeln mit geringem Wert) und senke die Kosten, ohne die Sicherheit zu beeinträchtigen. Plan: {plan}.",

    "mo.ozet.verimlilik": "Effizienz-Score",
    "mo.ozet.israfOran": "Verschwendungsquote (Compute)",
    "mo.ozet.aylikIsraf": "Gesch. monatl. Verschwendung",
    "mo.ozet.potansiyel": "Mögliche Einsparung/Mon.",

    "mo.verim.baslik": "Effizienz-Score",
    "mo.verim.verimli": "Effizient",
    "mo.verim.iyi": "Gut",
    "mo.verim.orta": "Mittel",
    "mo.verim.israfli": "Verschwenderisch",
    "mo.verim.aciklama":
      "Das Verhältnis wertvoller Verifizierungen (echte Bedrohungen + verdächtige Challenges) zum Gesamt-Compute. Je höher, desto mehr leistet dein Kontingent.",
    "mo.verim.toplamCompute": "Gesamt-Compute (CU)",
    "mo.verim.israfCompute": "Verschwendetes Compute (CU)",

    "mo.dagilim.baslik": "Ressourcenverteilung — wohin gehen Kontingent/Compute?",
    "mo.dagilim.not":
      "Je größer das orange Segment (Verschwendung), desto mehr deines Kontingents fließt in Verifizierungen, die nichts bewirken.",

    "mo.seg.gercek_tehdit": "Echte Bedrohungsblockierung",
    "mo.seg.insan_challenge": "Menschliche Challenge",
    "mo.seg.iyi_bot": "Good-Bot / sauberer Durchlass",
    "mo.seg.israf": "Verschwendung (umsonst)",

    "mo.israf.baslik": "Verschwendungsanalyse",
    "mo.israf.rozet": "{tl}/Mon. · {kota} Kontingent",
    "mo.israf.temiz": "Sauber",
    "mo.israf.dogrulama": "Verifizierungen",
    "mo.israf.kota": "Kontingent",

    "mo.kat.gereksiz_challenge.ad": "Unnötige Challenge",
    "mo.kat.gereksiz_challenge.aciklama":
      "Challenge/Block, der gut bewertetem (Mensch/Good-Bot) Traffic gezeigt wird. Teures Compute + Nutzerreibung + verlorene Conversion.",
    "mo.kat.gereksiz_challenge.cta": "Unsichtbaren Modus aktivieren",
    "mo.kat.dusuk_deger.ad": "Verifizierung mit geringem Wert",
    "mo.kat.dusuk_deger.aciklama":
      "Verifizierung von bereits sauberem (hoch bewertetem) Traffic. Verbraucht Kontingent ohne Bedrohung; per Allowlist günstiger.",
    "mo.kat.dusuk_deger.cta": "Good-Bot-Allowlist einrichten",
    "mo.kat.tekrar_dogrulama.ad": "Neuverifizierung",
    "mo.kat.tekrar_dogrulama.aciklama":
      "Dieselbe IP wird innerhalb von {dk} Min. mehrfach verifiziert. Die erste Verifizierung kann zwischengespeichert und die Wiederholung übersprungen werden.",
    "mo.kat.tekrar_dogrulama.cta": "Verifizierungs-Cache hinzufügen",

    "mo.oneri.baslik": "Optimierungsempfehlungen",
    "mo.oneri.rozet": "{n} Empfehlungen",
    "mo.oneri.bosBaslik": "Keine nennenswerte Verschwendung gefunden.",
    "mo.oneri.bosAciklama": "Deine Schutzkonfiguration wirkt aktuell effizient.",

    "mo.oncelik.yuksek": "Hohe Priorität",
    "mo.oncelik.orta": "Mittlere Priorität",
    "mo.oncelik.dusuk": "Niedrige Priorität",

    "mo.on.gorunmez_mod.baslik": "{n} unnötige Challenges mit unsichtbarem Modus reduzieren",
    "mo.on.gorunmez_mod.aciklama":
      "Zeige gut bewertetem menschlichem Traffic keine Challenge; bewerte still im Hintergrund. Das teure Widget-Compute entfällt, die Reibung geht auf null.",
    "mo.on.gorunmez_mod.guvenlik":
      "Sicherheit bleibt erhalten: Niedrig bewerteter Traffic erhält weiterhin die volle Challenge; die Reibung wird nur für HOCH bewerteten (nachweislich menschlichen) Traffic entfernt.",
    "mo.on.gorunmez_mod.cta": "Adaptive Schwierigkeit aktivieren",
    "mo.on.iyi_bot_allowlist.baslik": "{n} Verifizierungen mit einer Good-Bot-Allowlist sparen",
    "mo.on.iyi_bot_allowlist.aciklama":
      "Setze verifizierte Good-Bots (Suchmaschinen, Monitoring) und IPs mit hoher Reputation auf die Allowlist; kein erneutes Bewerten bei jeder Anfrage.",
    "mo.on.iyi_bot_allowlist.guvenlik":
      "Geringes Risiko: Die Allowlist gilt nur für nachweisliche Good-Bots und verifizierte Reputation; verdächtiger Traffic ist ausgeschlossen.",
    "mo.on.iyi_bot_allowlist.cta": "Regel erstellen",
    "mo.on.dogrulama_onbellek.baslik": "{n} Neuverifizierungen mit einem Verifizierungs-Cache eliminieren",
    "mo.on.dogrulama_onbellek.aciklama":
      "Wenn dieselbe IP/Fingerprint innerhalb von {dk} Min. zurückkehrt, liefere die erste Entscheidung aus dem Cache statt neu zu bewerten.",
    "mo.on.dogrulama_onbellek.guvenlik":
      "Sicherheitsneutral: Der Cache gilt nur in einem kurzen Fenster; ändert sich die Reputation oder läuft er ab, wird erneut voll verifiziert.",
    "mo.on.dogrulama_onbellek.cta": "Rate- & Kontingentrichtlinie",
    "mo.on.kural_budama.baslik": "Regeln mit geringem Wert entfernen",
    "mo.on.kural_budama.aciklama":
      "Entferne Regeln, die selten auslösen, aber bei jeder Anfrage ausgewertet werden; reduziere das Regel-Auswertungs-Compute.",
    "mo.on.kural_budama.guvenlik":
      "Sicherheit bleibt erhalten: Nur seit Langem tote (nie passende) Regeln werden vorgeschlagen; aktive Schutzregeln bleiben unberührt.",
    "mo.on.kural_budama.cta": "Zur Regelleistung",

    "mo.proj.baslik": "Einsparungsprognose — wenn alle Empfehlungen umgesetzt werden",
    "mo.proj.verimlilik": "Effizienz-Score",
    "mo.proj.puan": "↑ {n} Punkte",
    "mo.proj.aylikMaliyet": "Gesch. monatl. Kosten",
    "mo.proj.toplamTasarruf": "Gesamteinsparung",
    "mo.proj.kotaKurtarilir": "{n} Kontingent/Mon. gespart",
    "mo.proj.aylikKota": "Monatliche Kontingentnutzung",
    "mo.proj.aciklama":
      "Werden die empfohlenen Optimierungen umgesetzt, werden monatlich {n} Verifizierungs-Kontingente nicht verschwendet — das verschiebt Kontingentüberschreitungen und Upgrade-Druck.",
    "mo.proj.adaptifZorluk": "Adaptive Schwierigkeit",
    "mo.proj.maliyetFatura": "Kosten & Abrechnung",

    "mo.trend.baslik": "30-Tage-Kostentrend (gesch. ₺/Tag)",
    "mo.trend.aciklama":
      "Tägliche geschätzte Kosten = Kontingenteinheit × Verifizierung + Compute (verdict-gewichtet) × Compute-Einheit.",

    "mo.birim.baslik": "Verwendetes Stückkostenmodell",
    "mo.birim.kota": "1 Kontingenteinheit (Verifizierung)",
    "mo.birim.compute": "1 Compute-Einheit (CU)",
    "mo.birim.challenge": "Challenge-Gewicht",
    "mo.birim.block": "Block-Gewicht",
    "mo.birim.gecis": "Durchlass-(allowed-)Gewicht",
    "mo.not.baslik": "Diese Zahlen sind repräsentative FinOps-Schätzungen",
    "mo.not.govde":
      "Stückkosten (Kontingent + Compute) sind repräsentative Werte, keine exakte Rechnung. Ziel ist es, sichtbar zu machen, wohin die Ausgaben gehen und wo Verschwendung entsteht. Challenge wird als teuerster Posten modelliert, da sie das interaktive Widget + Verhaltensbiometrie + OCR-Resistenz umfasst. Reale Kosten variieren je nach Plan und Traffic-Mix — vergleiche vor Entscheidungen mit {link}.",
    "mo.not.link": "Kosten & Abrechnung",
  },

  fr: {
    "mo.serit.baslik": "FinOps pour la protection contre les bots : comptez chaque vérification que vous dépensez.",
    "mo.serit.aciklama":
      "Voyez où vont votre quota et votre compute, repérez le gaspillage (défier inutilement des humains, revérification, règles à faible valeur) et réduisez les coûts sans nuire à la sécurité. Forfait : {plan}.",

    "mo.ozet.verimlilik": "Score d'efficacité",
    "mo.ozet.israfOran": "Taux de gaspillage (compute)",
    "mo.ozet.aylikIsraf": "Gaspillage mensuel est.",
    "mo.ozet.potansiyel": "Économies potentielles/mois",

    "mo.verim.baslik": "Score d'efficacité",
    "mo.verim.verimli": "Efficace",
    "mo.verim.iyi": "Bon",
    "mo.verim.orta": "Moyen",
    "mo.verim.israfli": "Gaspilleur",
    "mo.verim.aciklama":
      "Le ratio des vérifications utiles (menaces réelles + challenges suspects) sur le compute total. Plus il est élevé, plus votre quota est mis à profit.",
    "mo.verim.toplamCompute": "Compute total (CU)",
    "mo.verim.israfCompute": "Compute gaspillé (CU)",

    "mo.dagilim.baslik": "Répartition des ressources — où vont quota/compute ?",
    "mo.dagilim.not":
      "Plus la part orange (gaspillage) est grande, plus votre quota va à des vérifications qui ne servent à rien.",

    "mo.seg.gercek_tehdit": "Blocage de menace réelle",
    "mo.seg.insan_challenge": "Challenge humain",
    "mo.seg.iyi_bot": "Bon bot / passage propre",
    "mo.seg.israf": "Gaspillage (en pure perte)",

    "mo.israf.baslik": "Analyse du gaspillage",
    "mo.israf.rozet": "{tl}/mois · {kota} quota",
    "mo.israf.temiz": "Propre",
    "mo.israf.dogrulama": "vérifications",
    "mo.israf.kota": "quota",

    "mo.kat.gereksiz_challenge.ad": "Challenge inutile",
    "mo.kat.gereksiz_challenge.aciklama":
      "Challenge/blocage montré à un trafic bien noté (humain/bon bot). Compute coûteux + friction utilisateur + conversion perdue.",
    "mo.kat.gereksiz_challenge.cta": "Activer le mode invisible",
    "mo.kat.dusuk_deger.ad": "Vérification à faible valeur",
    "mo.kat.dusuk_deger.aciklama":
      "Vérification sur un trafic déjà propre (score élevé). Brûle du quota sans menace ; peut être rendue moins chère avec une allowlist.",
    "mo.kat.dusuk_deger.cta": "Configurer l'allowlist de bons bots",
    "mo.kat.tekrar_dogrulama.ad": "Revérification",
    "mo.kat.tekrar_dogrulama.aciklama":
      "La même IP vérifiée plusieurs fois en {dk} min. La première vérification peut être mise en cache et la répétition ignorée.",
    "mo.kat.tekrar_dogrulama.cta": "Ajouter un cache de vérification",

    "mo.oneri.baslik": "Recommandations d'optimisation",
    "mo.oneri.rozet": "{n} recommandations",
    "mo.oneri.bosBaslik": "Aucun gaspillage notable trouvé.",
    "mo.oneri.bosAciklama": "Votre configuration de protection semble efficace pour l'instant.",

    "mo.oncelik.yuksek": "Priorité élevée",
    "mo.oncelik.orta": "Priorité moyenne",
    "mo.oncelik.dusuk": "Priorité faible",

    "mo.on.gorunmez_mod.baslik": "Réduire {n} challenges inutiles avec le mode invisible",
    "mo.on.gorunmez_mod.aciklama":
      "Ne montrez pas de challenge au trafic humain bien noté ; notez silencieusement en arrière-plan. Le compute coûteux du widget disparaît et la friction tombe à zéro.",
    "mo.on.gorunmez_mod.guvenlik":
      "La sécurité est préservée : le trafic à faible score reçoit toujours un challenge complet ; la friction n'est retirée que pour le trafic à score ÉLEVÉ (humain prouvé).",
    "mo.on.gorunmez_mod.cta": "Activer la Difficulté adaptative",
    "mo.on.iyi_bot_allowlist.baslik": "Économiser {n} vérifications avec une allowlist de bons bots",
    "mo.on.iyi_bot_allowlist.aciklama":
      "Mettez en allowlist les bons bots vérifiés (moteurs de recherche, surveillance) et les IP à haute réputation ; arrêtez de re-noter à chaque requête.",
    "mo.on.iyi_bot_allowlist.guvenlik":
      "Faible risque : l'allowlist ne concerne que les bons bots prouvés et la réputation vérifiée ; le trafic suspect est hors périmètre.",
    "mo.on.iyi_bot_allowlist.cta": "Créer une règle",
    "mo.on.dogrulama_onbellek.baslik": "Éliminer {n} revérifications avec un cache de vérification",
    "mo.on.dogrulama_onbellek.aciklama":
      "Lorsque la même IP/empreinte revient en {dk} min, servez la première décision depuis le cache au lieu de re-noter.",
    "mo.on.dogrulama_onbellek.guvenlik":
      "Neutre pour la sécurité : le cache n'est valide que dans une courte fenêtre ; si la réputation change ou qu'il expire, une vérification complète est relancée.",
    "mo.on.dogrulama_onbellek.cta": "Politique de débit & quota",
    "mo.on.kural_budama.baslik": "Élaguer les règles à faible valeur",
    "mo.on.kural_budama.aciklama":
      "Supprimez les règles qui se déclenchent rarement mais sont évaluées à chaque requête ; réduisez le compute d'évaluation des règles.",
    "mo.on.kural_budama.guvenlik":
      "La sécurité est préservée : seules les règles mortes de longue date (jamais correspondantes) sont suggérées ; les règles de protection actives restent intactes.",
    "mo.on.kural_budama.cta": "Aller à la performance des règles",

    "mo.proj.baslik": "Projection d'économies — si toutes les recommandations sont appliquées",
    "mo.proj.verimlilik": "Score d'efficacité",
    "mo.proj.puan": "↑ {n} points",
    "mo.proj.aylikMaliyet": "Coût mensuel est.",
    "mo.proj.toplamTasarruf": "Économies totales",
    "mo.proj.kotaKurtarilir": "{n} quota/mois économisé",
    "mo.proj.aylikKota": "Utilisation mensuelle du quota",
    "mo.proj.aciklama":
      "Si les optimisations recommandées sont appliquées, {n} quota de vérification par mois ne sera pas gaspillé — cela reporte les dépassements de quota et la pression de mise à niveau.",
    "mo.proj.adaptifZorluk": "Difficulté adaptative",
    "mo.proj.maliyetFatura": "Coût & facturation",

    "mo.trend.baslik": "Tendance des coûts sur 30 jours (est. ₺/jour)",
    "mo.trend.aciklama":
      "Coût quotidien estimé = unité de quota × vérification + compute (pondéré par verdict) × unité de compute.",

    "mo.birim.baslik": "Modèle de coût unitaire utilisé",
    "mo.birim.kota": "1 unité de quota (vérification)",
    "mo.birim.compute": "1 unité de compute (CU)",
    "mo.birim.challenge": "Poids du challenge",
    "mo.birim.block": "Poids du blocage",
    "mo.birim.gecis": "Poids du passage (allowed)",
    "mo.not.baslik": "Ces chiffres sont des estimations FinOps représentatives",
    "mo.not.govde":
      "Les coûts unitaires (quota + compute) sont des valeurs représentatives, pas une facture exacte. Le but est de rendre visible où va la dépense et où se produit le gaspillage. Le challenge est modélisé comme le poste le plus coûteux car il inclut le widget interactif + la biométrie comportementale + la résistance OCR. Les coûts réels varient selon votre forfait et votre mix de trafic — comparez avec {link} avant de décider.",
    "mo.not.link": "Coût & Facturation",
  },

  es: {
    "mo.serit.baslik": "FinOps para protección de bots: contabiliza cada verificación que gastas.",
    "mo.serit.aciklama":
      "Ve a dónde van tu cuota y tu compute, encuentra el desperdicio (desafiar innecesariamente a humanos, reverificación, reglas de bajo valor) y reduce el costo sin romper la seguridad. Plan: {plan}.",

    "mo.ozet.verimlilik": "Puntuación de eficiencia",
    "mo.ozet.israfOran": "Tasa de desperdicio (compute)",
    "mo.ozet.aylikIsraf": "Desperdicio mensual est.",
    "mo.ozet.potansiyel": "Ahorro potencial/mes",

    "mo.verim.baslik": "Puntuación de eficiencia",
    "mo.verim.verimli": "Eficiente",
    "mo.verim.iyi": "Bueno",
    "mo.verim.orta": "Regular",
    "mo.verim.israfli": "Derrochador",
    "mo.verim.aciklama":
      "La proporción de verificaciones valiosas (amenazas reales + challenges sospechosos) sobre el compute total. Cuanto más alta, más rinde tu cuota.",
    "mo.verim.toplamCompute": "Compute total (CU)",
    "mo.verim.israfCompute": "Compute desperdiciado (CU)",

    "mo.dagilim.baslik": "Distribución de recursos — ¿a dónde van cuota/compute?",
    "mo.dagilim.not":
      "Cuanto más grande sea la porción naranja (desperdicio), más de tu cuota va a verificaciones que no sirven.",

    "mo.seg.gercek_tehdit": "Bloqueo de amenaza real",
    "mo.seg.insan_challenge": "Challenge humano",
    "mo.seg.iyi_bot": "Buen bot / paso limpio",
    "mo.seg.israf": "Desperdicio (en vano)",

    "mo.israf.baslik": "Análisis de desperdicio",
    "mo.israf.rozet": "{tl}/mes · {kota} cuota",
    "mo.israf.temiz": "Limpio",
    "mo.israf.dogrulama": "verificaciones",
    "mo.israf.kota": "cuota",

    "mo.kat.gereksiz_challenge.ad": "Challenge innecesario",
    "mo.kat.gereksiz_challenge.aciklama":
      "Challenge/bloqueo mostrado a tráfico bien puntuado (humano/buen bot). Compute costoso + fricción de usuario + conversión perdida.",
    "mo.kat.gereksiz_challenge.cta": "Activar modo invisible",
    "mo.kat.dusuk_deger.ad": "Verificación de bajo valor",
    "mo.kat.dusuk_deger.aciklama":
      "Verificación sobre tráfico ya limpio (puntuación alta). Quema cuota sin amenaza; puede abaratarse con una allowlist.",
    "mo.kat.dusuk_deger.cta": "Configurar allowlist de buenos bots",
    "mo.kat.tekrar_dogrulama.ad": "Reverificación",
    "mo.kat.tekrar_dogrulama.aciklama":
      "La misma IP verificada varias veces en {dk} min. La primera verificación puede almacenarse en caché y omitir la repetición.",
    "mo.kat.tekrar_dogrulama.cta": "Añadir caché de verificación",

    "mo.oneri.baslik": "Recomendaciones de optimización",
    "mo.oneri.rozet": "{n} recomendaciones",
    "mo.oneri.bosBaslik": "No se encontró desperdicio notable.",
    "mo.oneri.bosAciklama": "Tu configuración de protección parece eficiente ahora mismo.",

    "mo.oncelik.yuksek": "Prioridad alta",
    "mo.oncelik.orta": "Prioridad media",
    "mo.oncelik.dusuk": "Prioridad baja",

    "mo.on.gorunmez_mod.baslik": "Reduce {n} challenges innecesarios con el modo invisible",
    "mo.on.gorunmez_mod.aciklama":
      "No muestres un challenge al tráfico humano bien puntuado; puntúa en silencio en segundo plano. El costoso compute del widget desaparece y la fricción baja a cero.",
    "mo.on.gorunmez_mod.guvenlik":
      "La seguridad se preserva: el tráfico de baja puntuación sigue recibiendo un challenge completo; la fricción solo se elimina para el tráfico de puntuación ALTA (humano comprobado).",
    "mo.on.gorunmez_mod.cta": "Activar Dificultad adaptativa",
    "mo.on.iyi_bot_allowlist.baslik": "Ahorra {n} verificaciones con una allowlist de buenos bots",
    "mo.on.iyi_bot_allowlist.aciklama":
      "Añade a la allowlist los buenos bots verificados (motores de búsqueda, monitoreo) e IP de alta reputación; deja de repuntuar en cada solicitud.",
    "mo.on.iyi_bot_allowlist.guvenlik":
      "Riesgo bajo: la allowlist es solo para buenos bots comprobados y reputación verificada; el tráfico sospechoso queda fuera de alcance.",
    "mo.on.iyi_bot_allowlist.cta": "Crear regla",
    "mo.on.dogrulama_onbellek.baslik": "Elimina {n} reverificaciones con un caché de verificación",
    "mo.on.dogrulama_onbellek.aciklama":
      "Cuando la misma IP/huella vuelve en {dk} min, sirve la primera decisión desde el caché en lugar de repuntuar.",
    "mo.on.dogrulama_onbellek.guvenlik":
      "Neutral para la seguridad: el caché solo es válido en una ventana corta; si la reputación cambia o expira, se ejecuta de nuevo una verificación completa.",
    "mo.on.dogrulama_onbellek.cta": "Política de tasa & cuota",
    "mo.on.kural_budama.baslik": "Poda reglas de bajo valor",
    "mo.on.kural_budama.aciklama":
      "Elimina las reglas que rara vez se activan pero se evalúan en cada solicitud; reduce el compute de evaluación de reglas.",
    "mo.on.kural_budama.guvenlik":
      "La seguridad se preserva: solo se sugieren reglas muertas desde hace tiempo (que nunca coinciden); las reglas de protección activas no se tocan.",
    "mo.on.kural_budama.cta": "Ir al rendimiento de reglas",

    "mo.proj.baslik": "Proyección de ahorro — si se aplican todas las recomendaciones",
    "mo.proj.verimlilik": "Puntuación de eficiencia",
    "mo.proj.puan": "↑ {n} puntos",
    "mo.proj.aylikMaliyet": "Costo mensual est.",
    "mo.proj.toplamTasarruf": "Ahorro total",
    "mo.proj.kotaKurtarilir": "{n} cuota/mes ahorrada",
    "mo.proj.aylikKota": "Uso mensual de cuota",
    "mo.proj.aciklama":
      "Si se aplican las optimizaciones recomendadas, {n} cuota de verificación al mes no se desperdiciará — esto pospone los excesos de cuota y la presión de actualización.",
    "mo.proj.adaptifZorluk": "Dificultad adaptativa",
    "mo.proj.maliyetFatura": "Costo & facturación",

    "mo.trend.baslik": "Tendencia de costos a 30 días (est. ₺/día)",
    "mo.trend.aciklama":
      "Costo diario estimado = unidad de cuota × verificación + compute (ponderado por veredicto) × unidad de compute.",

    "mo.birim.baslik": "Modelo de costo unitario utilizado",
    "mo.birim.kota": "1 unidad de cuota (verificación)",
    "mo.birim.compute": "1 unidad de compute (CU)",
    "mo.birim.challenge": "Peso del challenge",
    "mo.birim.block": "Peso del bloqueo",
    "mo.birim.gecis": "Peso del paso (allowed)",
    "mo.not.baslik": "Estas cifras son estimaciones FinOps representativas",
    "mo.not.govde":
      "Los costos unitarios (cuota + compute) son valores representativos, no una factura exacta. El objetivo es hacer visible a dónde va el gasto y dónde ocurre el desperdicio. El challenge se modela como el elemento más caro porque incluye el widget interactivo + biometría de comportamiento + resistencia OCR. Los costos reales varían según tu plan y mezcla de tráfico — compara con {link} antes de decidir.",
    "mo.not.link": "Costo & Facturación",
  },
};

/** Intl BCP-47 karşılıkları (sayı/₺ biçimi için). */
export const MO_LOCALE: Record<Dil, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

export function maliyetCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/* ------------------------------------------------------------------ Motor-metni yeniden türetme */

/** İsraf kategorisi metinleri — `key` (enum) ile eşlenir, çevrilir. */
export function israfKategoriMetin(key: IsrafKey, dil: Dil): { ad: string; aciklama: string; cta: string } {
  return {
    ad: maliyetCeviri(`mo.kat.${key}.ad`, dil),
    aciklama: maliyetCeviri(`mo.kat.${key}.aciklama`, dil).replace("{dk}", String(TEKRAR_DK)),
    cta: maliyetCeviri(`mo.kat.${key}.cta`, dil),
  };
}

/** Dağılım segmenti adı — `key` (enum) ile eşlenir, çevrilir. */
export function segmentAd(key: SegmentKey, dil: Dil): string {
  return maliyetCeviri(`mo.seg.${key}`, dil);
}

/** Öncelik etiketi — `oncelik` (enum) ile eşlenir, çevrilir. */
export function oncelikAd(oncelik: "yuksek" | "orta" | "dusuk", dil: Dil): string {
  return maliyetCeviri(`mo.oncelik.${oncelik}`, dil);
}

/**
 * Öneri metinleri — `key` (enum) ile eşlenir, çevrilir. Başlıktaki sayı
 * `kotaSayi` (veri) yerine yerelleştirilmiş biçimde yerleştirilir.
 */
export function oneriMetin(
  key: string,
  kotaSayi: number,
  dil: Dil,
): { baslik: string; aciklama: string; guvenlik: string; cta: string } {
  const n = kotaSayi.toLocaleString(MO_LOCALE[dil]);
  return {
    baslik: maliyetCeviri(`mo.on.${key}.baslik`, dil).replace("{n}", n),
    aciklama: maliyetCeviri(`mo.on.${key}.aciklama`, dil).replace("{dk}", String(TEKRAR_DK)),
    guvenlik: maliyetCeviri(`mo.on.${key}.guvenlik`, dil),
    cta: maliyetCeviri(`mo.on.${key}.cta`, dil),
  };
}
