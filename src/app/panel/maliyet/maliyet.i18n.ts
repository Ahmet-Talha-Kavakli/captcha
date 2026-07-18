/**
 * Maliyet & Fatura sayfası — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `src/lib/specter/plans.ts`
 * DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ
 * --------------
 * Plan `key` ("free" | "pro" | "scale") kararlı enum'dur; asla çevrilmez.
 * Plan ADI ("Ücretsiz"/"Pro"/"Scale") ve FİYATI ("₺0"/"₺990/ay"/"Özel") lib'de
 * Türkçe/temsili tutulur; burada `key` ile eşlenip yeniden türetilir:
 *   - "Ücretsiz" → çevrilir; "Pro"/"Scale" marka adı olarak korunur.
 *   - Fiyat: para birimi (₺, sayı) VERİDİR; yalnızca "/ay" son eki ve "Özel"
 *     kelimesi çevrilir (key-map ile yeniden kurulur).
 * Diğer tüm sayılar/₺/yüzde VERİ olarak kalır; yalnızca yerelleştirilmiş biçimlenir.
 */
import type { Dil } from "@/lib/i18n/panel";
import { planTanim } from "@/lib/specter/plans";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı / kırıntı
    "ma.baslik": "Maliyet & Fatura",

    // Üst özet kartları
    "ma.ozet.mevcutPlan": "Mevcut plan · {fiyat}",
    "ma.ozet.buAyKullanilan": "Bu ay kullanılan",
    "ma.ozet.aySonuOngoru": "Ay sonu öngörü",
    "ma.ozet.ongorulenEkUcret": "Öngörülen ek ücret",

    // Kullanım trendi paneli
    "ma.trend.baslik": "Kullanım trendi (30 gün)",
    "ma.trend.gunlukOrt": "Günlük ortalama:",
    "ma.trend.aySonu": "Ay sonu:",

    // Ay sonu projeksiyonu paneli
    "ma.proj.baslik": "Ay sonu projeksiyonu",
    "ma.proj.mevcutKullanim": "Mevcut kullanım",
    "ma.proj.ongorulen": "Öngörülen (ay sonu)",
    "ma.proj.asim":
      "Kotayı ~{asim} doğrulama aşman öngörülüyor. {ekUcret}",
    "ma.proj.asimEkUcret": "Tahmini ek ücret ₺{n}.",
    "ma.proj.asimYukselt": "Planı yükseltmeyi değerlendir.",
    "ma.proj.yeterli": "Kotan bu ay için yeterli görünüyor. Ek ücret öngörülmüyor.",

    // Optimizasyon önerisi kartı
    "ma.oneri.baslik": "Maliyet optimizasyonu önerisi",
    "ma.oneri.yukselt":
      "Kullanımın {plan} planına daha uygun ({kota} doğrulama, {fiyat}). Yükselerek ek ücretlerden kaçınabilirsin.",
    "ma.oneri.dusur":
      "Kotanın çok altında kalıyorsun. Daha uygun bir plana geçerek tasarruf edebilirsin.",
    "ma.oneri.planiYonet": "Planı yönet",

    // Plan uygunluğu paneli
    "ma.plan.baslik": "Plan uygunluğu",
    "ma.plan.aciklama":
      "Öngörülen ay-sonu kullanımın ({tahmin} doğrulama) her plana göre değerlendirmesi.",
    "ma.plan.mevcut": "Mevcut",
    "ma.plan.kotaAy": "{kota} doğrulama/ay",
    "ma.plan.yeter": "Kullanımına yeter",
    "ma.plan.asim": "Aşım olur",

    // Plan adı / fiyat yeniden türetme (key-map)
    "ma.planAd.free": "Ücretsiz",
    "ma.planAd.pro": "Pro",
    "ma.planAd.scale": "Scale",
    "ma.fiyatEk.ay": "/ay",
    "ma.fiyatEk.ozel": "Özel",
  },

  en: {
    "ma.baslik": "Cost & Billing",

    "ma.ozet.mevcutPlan": "Current plan · {fiyat}",
    "ma.ozet.buAyKullanilan": "Used this month",
    "ma.ozet.aySonuOngoru": "End-of-month projection",
    "ma.ozet.ongorulenEkUcret": "Projected overage",

    "ma.trend.baslik": "Usage trend (30 days)",
    "ma.trend.gunlukOrt": "Daily average:",
    "ma.trend.aySonu": "End of month:",

    "ma.proj.baslik": "End-of-month projection",
    "ma.proj.mevcutKullanim": "Current usage",
    "ma.proj.ongorulen": "Projected (end of month)",
    "ma.proj.asim":
      "You're projected to exceed the quota by ~{asim} verifications. {ekUcret}",
    "ma.proj.asimEkUcret": "Estimated overage ₺{n}.",
    "ma.proj.asimYukselt": "Consider upgrading your plan.",
    "ma.proj.yeterli": "Your quota looks sufficient for this month. No overage projected.",

    "ma.oneri.baslik": "Cost optimization recommendation",
    "ma.oneri.yukselt":
      "Your usage fits the {plan} plan better ({kota} verifications, {fiyat}). Upgrading lets you avoid overage charges.",
    "ma.oneri.dusur":
      "You're staying well below your quota. Switching to a more suitable plan could save money.",
    "ma.oneri.planiYonet": "Manage plan",

    "ma.plan.baslik": "Plan fit",
    "ma.plan.aciklama":
      "Assessment of your projected end-of-month usage ({tahmin} verifications) against each plan.",
    "ma.plan.mevcut": "Current",
    "ma.plan.kotaAy": "{kota} verifications/mo",
    "ma.plan.yeter": "Covers your usage",
    "ma.plan.asim": "Overage occurs",

    "ma.planAd.free": "Free",
    "ma.planAd.pro": "Pro",
    "ma.planAd.scale": "Scale",
    "ma.fiyatEk.ay": "/mo",
    "ma.fiyatEk.ozel": "Custom",
  },

  de: {
    "ma.baslik": "Kosten & Abrechnung",

    "ma.ozet.mevcutPlan": "Aktueller Plan · {fiyat}",
    "ma.ozet.buAyKullanilan": "Diesen Monat genutzt",
    "ma.ozet.aySonuOngoru": "Monatsend-Prognose",
    "ma.ozet.ongorulenEkUcret": "Prognostizierte Mehrkosten",

    "ma.trend.baslik": "Nutzungstrend (30 Tage)",
    "ma.trend.gunlukOrt": "Täglicher Durchschnitt:",
    "ma.trend.aySonu": "Monatsende:",

    "ma.proj.baslik": "Monatsend-Prognose",
    "ma.proj.mevcutKullanim": "Aktuelle Nutzung",
    "ma.proj.ongorulen": "Prognostiziert (Monatsende)",
    "ma.proj.asim":
      "Es wird prognostiziert, dass du das Kontingent um ~{asim} Verifizierungen überschreitest. {ekUcret}",
    "ma.proj.asimEkUcret": "Geschätzte Mehrkosten ₺{n}.",
    "ma.proj.asimYukselt": "Erwäge ein Upgrade deines Plans.",
    "ma.proj.yeterli": "Dein Kontingent scheint für diesen Monat auszureichen. Keine Mehrkosten prognostiziert.",

    "ma.oneri.baslik": "Kostenoptimierungs-Empfehlung",
    "ma.oneri.yukselt":
      "Deine Nutzung passt besser zum {plan}-Plan ({kota} Verifizierungen, {fiyat}). Mit einem Upgrade vermeidest du Mehrkosten.",
    "ma.oneri.dusur":
      "Du bleibst deutlich unter deinem Kontingent. Ein Wechsel zu einem passenderen Plan könnte Kosten sparen.",
    "ma.oneri.planiYonet": "Plan verwalten",

    "ma.plan.baslik": "Plan-Eignung",
    "ma.plan.aciklama":
      "Bewertung deiner prognostizierten Monatsend-Nutzung ({tahmin} Verifizierungen) gegenüber jedem Plan.",
    "ma.plan.mevcut": "Aktuell",
    "ma.plan.kotaAy": "{kota} Verifizierungen/Mon.",
    "ma.plan.yeter": "Deckt deine Nutzung",
    "ma.plan.asim": "Mehrkosten entstehen",

    "ma.planAd.free": "Kostenlos",
    "ma.planAd.pro": "Pro",
    "ma.planAd.scale": "Scale",
    "ma.fiyatEk.ay": "/Mon.",
    "ma.fiyatEk.ozel": "Individuell",
  },

  fr: {
    "ma.baslik": "Coût & facturation",

    "ma.ozet.mevcutPlan": "Forfait actuel · {fiyat}",
    "ma.ozet.buAyKullanilan": "Utilisé ce mois-ci",
    "ma.ozet.aySonuOngoru": "Projection de fin de mois",
    "ma.ozet.ongorulenEkUcret": "Dépassement prévu",

    "ma.trend.baslik": "Tendance d'utilisation (30 jours)",
    "ma.trend.gunlukOrt": "Moyenne quotidienne :",
    "ma.trend.aySonu": "Fin de mois :",

    "ma.proj.baslik": "Projection de fin de mois",
    "ma.proj.mevcutKullanim": "Utilisation actuelle",
    "ma.proj.ongorulen": "Prévu (fin de mois)",
    "ma.proj.asim":
      "Vous devriez dépasser le quota d'environ {asim} vérifications. {ekUcret}",
    "ma.proj.asimEkUcret": "Dépassement estimé ₺{n}.",
    "ma.proj.asimYukselt": "Envisagez de mettre à niveau votre forfait.",
    "ma.proj.yeterli": "Votre quota semble suffisant pour ce mois-ci. Aucun dépassement prévu.",

    "ma.oneri.baslik": "Recommandation d'optimisation des coûts",
    "ma.oneri.yukselt":
      "Votre utilisation correspond mieux au forfait {plan} ({kota} vérifications, {fiyat}). Passer à ce forfait vous évite les frais de dépassement.",
    "ma.oneri.dusur":
      "Vous restez bien en dessous de votre quota. Passer à un forfait plus adapté pourrait vous faire économiser.",
    "ma.oneri.planiYonet": "Gérer le forfait",

    "ma.plan.baslik": "Adéquation du forfait",
    "ma.plan.aciklama":
      "Évaluation de votre utilisation prévue de fin de mois ({tahmin} vérifications) par rapport à chaque forfait.",
    "ma.plan.mevcut": "Actuel",
    "ma.plan.kotaAy": "{kota} vérifications/mois",
    "ma.plan.yeter": "Couvre votre utilisation",
    "ma.plan.asim": "Dépassement",

    "ma.planAd.free": "Gratuit",
    "ma.planAd.pro": "Pro",
    "ma.planAd.scale": "Scale",
    "ma.fiyatEk.ay": "/mois",
    "ma.fiyatEk.ozel": "Sur mesure",
  },

  es: {
    "ma.baslik": "Costo & facturación",

    "ma.ozet.mevcutPlan": "Plan actual · {fiyat}",
    "ma.ozet.buAyKullanilan": "Usado este mes",
    "ma.ozet.aySonuOngoru": "Proyección de fin de mes",
    "ma.ozet.ongorulenEkUcret": "Exceso previsto",

    "ma.trend.baslik": "Tendencia de uso (30 días)",
    "ma.trend.gunlukOrt": "Promedio diario:",
    "ma.trend.aySonu": "Fin de mes:",

    "ma.proj.baslik": "Proyección de fin de mes",
    "ma.proj.mevcutKullanim": "Uso actual",
    "ma.proj.ongorulen": "Previsto (fin de mes)",
    "ma.proj.asim":
      "Se proyecta que superes la cuota en ~{asim} verificaciones. {ekUcret}",
    "ma.proj.asimEkUcret": "Exceso estimado ₺{n}.",
    "ma.proj.asimYukselt": "Considera mejorar tu plan.",
    "ma.proj.yeterli": "Tu cuota parece suficiente para este mes. No se prevé exceso.",

    "ma.oneri.baslik": "Recomendación de optimización de costos",
    "ma.oneri.yukselt":
      "Tu uso encaja mejor con el plan {plan} ({kota} verificaciones, {fiyat}). Al mejorar evitas cargos por exceso.",
    "ma.oneri.dusur":
      "Te mantienes muy por debajo de tu cuota. Cambiar a un plan más adecuado podría ahorrarte dinero.",
    "ma.oneri.planiYonet": "Gestionar plan",

    "ma.plan.baslik": "Idoneidad del plan",
    "ma.plan.aciklama":
      "Evaluación de tu uso proyectado de fin de mes ({tahmin} verificaciones) frente a cada plan.",
    "ma.plan.mevcut": "Actual",
    "ma.plan.kotaAy": "{kota} verificaciones/mes",
    "ma.plan.yeter": "Cubre tu uso",
    "ma.plan.asim": "Ocurre exceso",

    "ma.planAd.free": "Gratis",
    "ma.planAd.pro": "Pro",
    "ma.planAd.scale": "Scale",
    "ma.fiyatEk.ay": "/mes",
    "ma.fiyatEk.ozel": "Personalizado",
  },
};

/** Intl BCP-47 karşılıkları (sayı/₺ biçimi için). */
export const MA_LOCALE: Record<Dil, string> = {
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

/** Plan adı — `key` (enum) ile eşlenir, çevrilir. Marka adları (Pro/Scale) korunur. */
export function planAdi(key: string, dil: Dil): string {
  return maliyetCeviri(`ma.planAd.${key}`, dil);
}

/**
 * Plan fiyatı — SAYI + para birimi plans.ts'ten (tek kaynak) TÜRETİLİR; böylece
 * maliyet ekranı landing/fatura ile daima tutarlıdır. Yalnızca "/ay" son-eki ve
 * "Özel" kelimesi dile göre çevrilir (i18n `ma.fiyatEk.*` ile). Örn plans.ts
 * "₺990/ay" → tr "₺990/ay", en "₺990/mo".
 */
export function planFiyati(key: string, dil: Dil): string {
  const p = planTanim(key); // free/pro/scale → PlanTanim (bilinmeyen key → free)
  const ham = p.fiyat; // "₺0" | "₺990/ay" | "Özel"
  if (ham === "Özel") return maliyetCeviri("ma.fiyatEk.ozel", dil);
  if (!ham.includes("/ay")) return ham; // "₺0" — son-ek yok, aynen
  const tutar = ham.replace("/ay", "");
  return `${tutar}${maliyetCeviri("ma.fiyatEk.ay", dil)}`;
}
