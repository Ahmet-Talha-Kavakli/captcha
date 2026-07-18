import type { Dil } from "@/lib/i18n/panel";

/**
 * Kullanıcı Yolculuğu & Dönüşüm Hunisi sayfasına özel i18n sözlüğü.
 * "ky." namespace'li anahtarlar. Doğal/native çeviriler; veri (sayı, yüzde,
 * enum değeri) çevrilmez.
 *
 * ÖNEMLİ: Motor (src/lib/specter/kullanici-yolculuk.ts) TR metin üretir
 * (huni aşama adları/açıklamaları, öneriler). Motor DÜZENLENMEZ; bu metinler
 * burada sabit anahtarlar üzerinden istemci tarafında yeniden türetilir.
 * Huni aşamaları sabit sıralı olduğundan indeks-anahtarla ("ky.insan.0")
 * eşlenir; öneriler ise motorun mantığı istemcide sayısal `sonuc`tan yeniden
 * çalıştırılarak çevrilir.
 *
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Başlık şeridi ---
    "ky.intro.baslik": "Botları eledin — ama insanı kaybettin mi?",
    "ky.intro.metin":
      "Koruma güvenliği artırır; yanlış kurgulanırsa gerçek kullanıcı da kaçar. Bu huni insan ve bot yolculuğunu AYIRIR: insan akıcı geçip dönüşüyor mu, bot erkenden duruyor mu? {surtunme} ve {denge} ile optimize et.",
    "ky.intro.surtunme": "Sürtünme kaybı",
    "ky.intro.denge": "denge skoru",

    // --- Özet stat kartları ---
    "ky.stat.insanDonusum": "İnsan dönüşümü",
    "ky.stat.surtunmeKaybi": "Sürtünme kaybı",
    "ky.stat.botSizinti": "Bot sızıntısı",
    "ky.stat.dengeSkoru": "Denge skoru",

    // --- Huni kartları ---
    "ky.huni.insan.baslik": "İnsan yolculuğu",
    "ky.huni.insan.alt": "Akıcı geçip dönüşmeli",
    "ky.huni.bot.baslik": "Bot yolculuğu",
    "ky.huni.bot.alt": "Erkenden durmalı (sızıntı=kötü)",
    "ky.huni.gecis": "geçiş",

    // --- İnsan huni aşamaları (motor sırasıyla) ---
    "ky.insan.0.ad": "Geliş",
    "ky.insan.0.aciklama": "Siteye gelen meşru kullanıcılar.",
    "ky.insan.1.ad": "Doğrulama gösterildi",
    "ky.insan.1.aciklama": "Ghost-font challenge veya davranış kontrolü görenler.",
    "ky.insan.2.ad": "Çözdü",
    "ky.insan.2.aciklama": "Doğrulamayı başarıyla tamamlayanlar.",
    "ky.insan.3.ad": "Geçti",
    "ky.insan.3.aciklama": "Korumadan geçip siteye erişenler.",
    "ky.insan.4.ad": "Dönüşüm",
    "ky.insan.4.aciklama": "Hedef aksiyonu (kayıt/satın alma) tamamlayanlar.",

    // --- Bot huni aşamaları (motor sırasıyla) ---
    "ky.bot.0.ad": "Bot geliş",
    "ky.bot.0.aciklama": "Tespit edilen bot/otomasyon istekleri.",
    "ky.bot.1.ad": "Doğrulamaya takıldı",
    "ky.bot.1.aciklama": "Challenge'a tabi tutulan botlar.",
    "ky.bot.2.ad": "Engellendi",
    "ky.bot.2.aciklama": "Kesin engellenen botlar.",
    "ky.bot.3.ad": "Geçti (kaçan)",
    "ky.bot.3.aciklama": "Savunmadan kaçıp geçen botlar — sızıntı.",

    // --- Öneriler paneli ---
    "ky.oneri.baslik": "Denge önerileri",
    "ky.oneri.surtunmeYuksek.baslik": "Yüksek sürtünme kaybı",
    "ky.oneri.surtunmeYuksek.metin":
      "İnsanların %{n}'i doğrulamada takılıp düşüyor. Görünmez modu genişlet veya zorluğu düşür.",
    "ky.oneri.surtunmeDusuk.baslik": "Düşük sürtünme",
    "ky.oneri.surtunmeDusuk.metin": "İnsan akışı akıcı — doğrulama kullanıcıyı fazla yormuyor.",
    "ky.oneri.botSizinti.baslik": "Bot sızıntısı var",
    "ky.oneri.botSizinti.metin":
      "Botların %{n}'i savunmadan geçiyor. Daha agresif kural veya birleşik risk eşiği uygula.",
    "ky.oneri.botEtkili.baslik": "Bot filtresi etkili",
    "ky.oneri.botEtkili.metin": "Botların çok azı geçebiliyor — savunma sıkı.",
    "ky.oneri.denge.baslik": "Denge iyileştirilebilir",
    "ky.oneri.denge.metin":
      "Güvenlik ile kullanıcı deneyimi arasındaki denge optimize edilebilir — adaptif zorluğu ayarla.",

    // --- CTA linkleri ---
    "ky.cta.zorluk": "Adaptif zorluğu ayarla",
    "ky.cta.surtunme": "Sürtünme analizi",
    "ky.cta.risk": "Birleşik risk",
  },

  en: {
    "ky.intro.baslik": "You filtered out the bots — but did you lose the humans?",
    "ky.intro.metin":
      "Protection boosts security; misconfigured, it also drives real users away. This funnel SEPARATES the human and bot journeys: are humans flowing through and converting, do bots stop early? Optimize with {surtunme} and {denge}.",
    "ky.intro.surtunme": "friction loss",
    "ky.intro.denge": "balance score",

    "ky.stat.insanDonusum": "Human conversion",
    "ky.stat.surtunmeKaybi": "Friction loss",
    "ky.stat.botSizinti": "Bot leakage",
    "ky.stat.dengeSkoru": "Balance score",

    "ky.huni.insan.baslik": "Human journey",
    "ky.huni.insan.alt": "Should flow through and convert",
    "ky.huni.bot.baslik": "Bot journey",
    "ky.huni.bot.alt": "Should stop early (leakage = bad)",
    "ky.huni.gecis": "pass-through",

    "ky.insan.0.ad": "Arrival",
    "ky.insan.0.aciklama": "Legitimate users landing on the site.",
    "ky.insan.1.ad": "Verification shown",
    "ky.insan.1.aciklama": "Those shown a ghost-font challenge or behavioral check.",
    "ky.insan.2.ad": "Solved",
    "ky.insan.2.aciklama": "Those who completed verification successfully.",
    "ky.insan.3.ad": "Passed",
    "ky.insan.3.aciklama": "Those who cleared protection and reached the site.",
    "ky.insan.4.ad": "Conversion",
    "ky.insan.4.aciklama": "Those who completed the target action (sign-up/purchase).",

    "ky.bot.0.ad": "Bot arrival",
    "ky.bot.0.aciklama": "Detected bot/automation requests.",
    "ky.bot.1.ad": "Hit verification",
    "ky.bot.1.aciklama": "Bots subjected to a challenge.",
    "ky.bot.2.ad": "Blocked",
    "ky.bot.2.aciklama": "Bots that were definitively blocked.",
    "ky.bot.3.ad": "Passed (escaped)",
    "ky.bot.3.aciklama": "Bots that slipped past the defense — leakage.",

    "ky.oneri.baslik": "Balance recommendations",
    "ky.oneri.surtunmeYuksek.baslik": "High friction loss",
    "ky.oneri.surtunmeYuksek.metin":
      "{n}% of humans get stuck at verification and drop off. Expand invisible mode or lower the difficulty.",
    "ky.oneri.surtunmeDusuk.baslik": "Low friction",
    "ky.oneri.surtunmeDusuk.metin": "The human flow is smooth — verification isn't wearing users out.",
    "ky.oneri.botSizinti.baslik": "Bot leakage present",
    "ky.oneri.botSizinti.metin":
      "{n}% of bots slip past the defense. Apply a more aggressive rule or a unified-risk threshold.",
    "ky.oneri.botEtkili.baslik": "Bot filter is effective",
    "ky.oneri.botEtkili.metin": "Very few bots get through — the defense is tight.",
    "ky.oneri.denge.baslik": "Balance can be improved",
    "ky.oneri.denge.metin":
      "The balance between security and user experience can be optimized — tune the adaptive difficulty.",

    "ky.cta.zorluk": "Adjust adaptive difficulty",
    "ky.cta.surtunme": "Friction analysis",
    "ky.cta.risk": "Unified risk",
  },

  de: {
    "ky.intro.baslik": "Du hast die Bots aussortiert — aber die Menschen verloren?",
    "ky.intro.metin":
      "Schutz erhöht die Sicherheit; falsch konfiguriert vertreibt er auch echte Nutzer. Dieser Trichter TRENNT die Mensch- und Bot-Reise: Fließen Menschen durch und konvertieren, stoppen Bots früh? Optimiere mit {surtunme} und {denge}.",
    "ky.intro.surtunme": "Reibungsverlust",
    "ky.intro.denge": "Balance-Score",

    "ky.stat.insanDonusum": "Menschliche Conversion",
    "ky.stat.surtunmeKaybi": "Reibungsverlust",
    "ky.stat.botSizinti": "Bot-Durchlass",
    "ky.stat.dengeSkoru": "Balance-Score",

    "ky.huni.insan.baslik": "Menschliche Reise",
    "ky.huni.insan.alt": "Sollte durchfließen und konvertieren",
    "ky.huni.bot.baslik": "Bot-Reise",
    "ky.huni.bot.alt": "Sollte früh stoppen (Durchlass = schlecht)",
    "ky.huni.gecis": "Durchlauf",

    "ky.insan.0.ad": "Ankunft",
    "ky.insan.0.aciklama": "Legitime Nutzer, die auf der Website ankommen.",
    "ky.insan.1.ad": "Verifizierung angezeigt",
    "ky.insan.1.aciklama": "Diejenigen mit Ghost-Font-Challenge oder Verhaltensprüfung.",
    "ky.insan.2.ad": "Gelöst",
    "ky.insan.2.aciklama": "Diejenigen, die die Verifizierung erfolgreich abgeschlossen haben.",
    "ky.insan.3.ad": "Durchgekommen",
    "ky.insan.3.aciklama": "Diejenigen, die den Schutz passiert und die Website erreicht haben.",
    "ky.insan.4.ad": "Conversion",
    "ky.insan.4.aciklama": "Diejenigen, die die Zielaktion (Anmeldung/Kauf) abgeschlossen haben.",

    "ky.bot.0.ad": "Bot-Ankunft",
    "ky.bot.0.aciklama": "Erkannte Bot-/Automatisierungsanfragen.",
    "ky.bot.1.ad": "An Verifizierung gescheitert",
    "ky.bot.1.aciklama": "Bots, die einer Challenge unterzogen wurden.",
    "ky.bot.2.ad": "Blockiert",
    "ky.bot.2.aciklama": "Endgültig blockierte Bots.",
    "ky.bot.3.ad": "Durchgekommen (entkommen)",
    "ky.bot.3.aciklama": "Bots, die an der Abwehr vorbeigeschlüpft sind — Durchlass.",

    "ky.oneri.baslik": "Balance-Empfehlungen",
    "ky.oneri.surtunmeYuksek.baslik": "Hoher Reibungsverlust",
    "ky.oneri.surtunmeYuksek.metin":
      "{n}% der Menschen bleiben bei der Verifizierung hängen und springen ab. Erweitere den unsichtbaren Modus oder senke die Schwierigkeit.",
    "ky.oneri.surtunmeDusuk.baslik": "Geringe Reibung",
    "ky.oneri.surtunmeDusuk.metin": "Der menschliche Fluss ist geschmeidig — die Verifizierung ermüdet die Nutzer nicht.",
    "ky.oneri.botSizinti.baslik": "Bot-Durchlass vorhanden",
    "ky.oneri.botSizinti.metin":
      "{n}% der Bots schlüpfen an der Abwehr vorbei. Wende eine aggressivere Regel oder einen Unified-Risk-Schwellenwert an.",
    "ky.oneri.botEtkili.baslik": "Bot-Filter ist wirksam",
    "ky.oneri.botEtkili.metin": "Nur sehr wenige Bots kommen durch — die Abwehr ist dicht.",
    "ky.oneri.denge.baslik": "Balance lässt sich verbessern",
    "ky.oneri.denge.metin":
      "Die Balance zwischen Sicherheit und Nutzererlebnis lässt sich optimieren — passe die adaptive Schwierigkeit an.",

    "ky.cta.zorluk": "Adaptive Schwierigkeit anpassen",
    "ky.cta.surtunme": "Reibungsanalyse",
    "ky.cta.risk": "Einheitliches Risiko",
  },

  fr: {
    "ky.intro.baslik": "Vous avez filtré les bots — mais avez-vous perdu les humains ?",
    "ky.intro.metin":
      "La protection renforce la sécurité ; mal configurée, elle fait aussi fuir les vrais utilisateurs. Cet entonnoir SÉPARE le parcours humain et celui des bots : les humains passent-ils fluidement et convertissent-ils, les bots s'arrêtent-ils tôt ? Optimisez avec {surtunme} et {denge}.",
    "ky.intro.surtunme": "la perte par friction",
    "ky.intro.denge": "le score d'équilibre",

    "ky.stat.insanDonusum": "Conversion humaine",
    "ky.stat.surtunmeKaybi": "Perte par friction",
    "ky.stat.botSizinti": "Fuite de bots",
    "ky.stat.dengeSkoru": "Score d'équilibre",

    "ky.huni.insan.baslik": "Parcours humain",
    "ky.huni.insan.alt": "Doit passer fluidement et convertir",
    "ky.huni.bot.baslik": "Parcours des bots",
    "ky.huni.bot.alt": "Doit s'arrêter tôt (fuite = mauvais)",
    "ky.huni.gecis": "passage",

    "ky.insan.0.ad": "Arrivée",
    "ky.insan.0.aciklama": "Utilisateurs légitimes arrivant sur le site.",
    "ky.insan.1.ad": "Vérification affichée",
    "ky.insan.1.aciklama": "Ceux ayant vu un défi ghost-font ou un contrôle comportemental.",
    "ky.insan.2.ad": "Résolu",
    "ky.insan.2.aciklama": "Ceux ayant réussi la vérification.",
    "ky.insan.3.ad": "Passé",
    "ky.insan.3.aciklama": "Ceux ayant franchi la protection et atteint le site.",
    "ky.insan.4.ad": "Conversion",
    "ky.insan.4.aciklama": "Ceux ayant accompli l'action cible (inscription/achat).",

    "ky.bot.0.ad": "Arrivée des bots",
    "ky.bot.0.aciklama": "Requêtes de bots/automatisation détectées.",
    "ky.bot.1.ad": "Bloqué à la vérification",
    "ky.bot.1.aciklama": "Bots soumis à un défi.",
    "ky.bot.2.ad": "Bloqué",
    "ky.bot.2.aciklama": "Bots définitivement bloqués.",
    "ky.bot.3.ad": "Passé (échappé)",
    "ky.bot.3.aciklama": "Bots ayant échappé à la défense — fuite.",

    "ky.oneri.baslik": "Recommandations d'équilibre",
    "ky.oneri.surtunmeYuksek.baslik": "Perte par friction élevée",
    "ky.oneri.surtunmeYuksek.metin":
      "{n}% des humains restent bloqués à la vérification et abandonnent. Élargissez le mode invisible ou réduisez la difficulté.",
    "ky.oneri.surtunmeDusuk.baslik": "Faible friction",
    "ky.oneri.surtunmeDusuk.metin": "Le flux humain est fluide — la vérification ne fatigue pas les utilisateurs.",
    "ky.oneri.botSizinti.baslik": "Fuite de bots présente",
    "ky.oneri.botSizinti.metin":
      "{n}% des bots échappent à la défense. Appliquez une règle plus agressive ou un seuil de risque unifié.",
    "ky.oneri.botEtkili.baslik": "Filtre anti-bots efficace",
    "ky.oneri.botEtkili.metin": "Très peu de bots passent — la défense est solide.",
    "ky.oneri.denge.baslik": "L'équilibre peut être amélioré",
    "ky.oneri.denge.metin":
      "L'équilibre entre sécurité et expérience utilisateur peut être optimisé — ajustez la difficulté adaptative.",

    "ky.cta.zorluk": "Ajuster la difficulté adaptative",
    "ky.cta.surtunme": "Analyse de friction",
    "ky.cta.risk": "Risque unifié",
  },

  es: {
    "ky.intro.baslik": "Filtraste los bots — ¿pero perdiste a los humanos?",
    "ky.intro.metin":
      "La protección aumenta la seguridad; mal configurada, también ahuyenta a los usuarios reales. Este embudo SEPARA el recorrido humano del de los bots: ¿los humanos fluyen y convierten, los bots se detienen pronto? Optimiza con {surtunme} y {denge}.",
    "ky.intro.surtunme": "la pérdida por fricción",
    "ky.intro.denge": "la puntuación de equilibrio",

    "ky.stat.insanDonusum": "Conversión humana",
    "ky.stat.surtunmeKaybi": "Pérdida por fricción",
    "ky.stat.botSizinti": "Fuga de bots",
    "ky.stat.dengeSkoru": "Puntuación de equilibrio",

    "ky.huni.insan.baslik": "Recorrido humano",
    "ky.huni.insan.alt": "Debe fluir y convertir",
    "ky.huni.bot.baslik": "Recorrido de bots",
    "ky.huni.bot.alt": "Debe detenerse pronto (fuga = malo)",
    "ky.huni.gecis": "paso",

    "ky.insan.0.ad": "Llegada",
    "ky.insan.0.aciklama": "Usuarios legítimos que llegan al sitio.",
    "ky.insan.1.ad": "Verificación mostrada",
    "ky.insan.1.aciklama": "Quienes vieron un desafío ghost-font o un control de comportamiento.",
    "ky.insan.2.ad": "Resuelto",
    "ky.insan.2.aciklama": "Quienes completaron la verificación con éxito.",
    "ky.insan.3.ad": "Pasó",
    "ky.insan.3.aciklama": "Quienes superaron la protección y accedieron al sitio.",
    "ky.insan.4.ad": "Conversión",
    "ky.insan.4.aciklama": "Quienes completaron la acción objetivo (registro/compra).",

    "ky.bot.0.ad": "Llegada de bots",
    "ky.bot.0.aciklama": "Solicitudes de bots/automatización detectadas.",
    "ky.bot.1.ad": "Frenado en la verificación",
    "ky.bot.1.aciklama": "Bots sometidos a un desafío.",
    "ky.bot.2.ad": "Bloqueado",
    "ky.bot.2.aciklama": "Bots bloqueados definitivamente.",
    "ky.bot.3.ad": "Pasó (escapó)",
    "ky.bot.3.aciklama": "Bots que se escabulleron de la defensa — fuga.",

    "ky.oneri.baslik": "Recomendaciones de equilibrio",
    "ky.oneri.surtunmeYuksek.baslik": "Pérdida por fricción alta",
    "ky.oneri.surtunmeYuksek.metin":
      "El {n}% de los humanos se atasca en la verificación y abandona. Amplía el modo invisible o reduce la dificultad.",
    "ky.oneri.surtunmeDusuk.baslik": "Fricción baja",
    "ky.oneri.surtunmeDusuk.metin": "El flujo humano es fluido — la verificación no agota a los usuarios.",
    "ky.oneri.botSizinti.baslik": "Hay fuga de bots",
    "ky.oneri.botSizinti.metin":
      "El {n}% de los bots se escapa de la defensa. Aplica una regla más agresiva o un umbral de riesgo unificado.",
    "ky.oneri.botEtkili.baslik": "El filtro de bots es eficaz",
    "ky.oneri.botEtkili.metin": "Muy pocos bots logran pasar — la defensa es sólida.",
    "ky.oneri.denge.baslik": "El equilibrio puede mejorar",
    "ky.oneri.denge.metin":
      "El equilibrio entre seguridad y experiencia de usuario puede optimizarse — ajusta la dificultad adaptativa.",

    "ky.cta.zorluk": "Ajustar dificultad adaptativa",
    "ky.cta.surtunme": "Análisis de fricción",
    "ky.cta.risk": "Riesgo unificado",
  },
};

export function yolculukCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
