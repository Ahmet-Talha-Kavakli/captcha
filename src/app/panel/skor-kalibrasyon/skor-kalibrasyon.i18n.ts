import type { Dil } from "@/lib/i18n/panel";

/**
 * Skor Kalibrasyonu sayfasına özel i18n sözlüğü (yalnızca bu modül kullanır).
 * "sk." namespace'li anahtarlar. Doğal/native çeviriler; veri (ECE/PSI sayıları,
 * olay sayısı, yüzde) çevrilmez — yalnızca görüntü etiketleri çevrilir.
 *
 * Durum enum değerleri (iyi/orta/zayif · kararli/izlemede/drift ·
 * kayma/belirgin-kayma) asla çevrilmez; paylaşılan skor-kalibrasyon.ts'ten
 * yalnızca DURUM_RENK (renk verisi) alınır, etiketler burada anahtar-eşlemesiyle
 * (enum → çeviri anahtarı) çevrilir.
 *
 * Interpolasyon: "{n}" yer tutucusu `.replace("{n}", ...)` ile doldurulur.
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Başlık ---
    "sk.baslik": "Model Kalibrasyonu & Drift İzleme",

    // --- Açıklama şeridi ---
    "sk.giris.baslik": 'Model "%90 eminim" diyorsa gerçekten %90 doğru mu?',
    "sk.giris.metin.1": "İki model-sağlık metriği:",
    "sk.giris.kalibrasyon": "Kalibrasyon",
    "sk.giris.kalibrasyon.aciklama":
      "(tahmin edilen olasılık gerçek oranla uyuşuyor mu — güvenilirlik diyagramı + ECE)",
    "sk.giris.ve": "ve",
    "sk.giris.drift": "Drift",
    "sk.giris.drift.aciklama":
      "(trafik deseni referans döneme göre kaydı mı — PSI). Bozulma varsa model yeniden değerlendirilmeli.",

    // --- Özet kartları ---
    "sk.ozet.ece": "ECE (kalibrasyon hatası)",
    "sk.ozet.kalibDurum": "Kalibrasyon durumu",
    "sk.ozet.psi": "Genel PSI (drift)",
    "sk.ozet.driftDurum": "Drift durumu",

    // --- Kalibrasyon durumu (enum → etiket) ---
    "sk.kalib.iyi": "İyi kalibre",
    "sk.kalib.orta": "Orta",
    "sk.kalib.zayif": "Zayıf kalibre",

    // --- Drift durumu (enum → etiket) ---
    "sk.drift.kararli": "Kararlı",
    "sk.drift.izlemede": "İzlemede",
    "sk.drift.drift": "Drift tespit",

    // --- Özellik drift durumu (enum → etiket) ---
    "sk.oz.kararli": "Kararlı",
    "sk.oz.kayma": "Hafif kayma",
    "sk.oz.belirgin-kayma": "Belirgin kayma",

    // --- Özellik adları (lib'deki TR adların anahtar karşılığı) ---
    "sk.ozellik.skor": "İnsanlık skoru dağılımı",
    "sk.ozellik.sinif": "Bot sınıfı dağılımı",
    "sk.ozellik.karar": "Karar dağılımı",

    // --- Özellik detay metinleri (lib'deki TR detayın anahtar karşılığı) ---
    "sk.detay.kararli": "Dağılım kararlı.",
    "sk.detay.kayma": "Hafif kayma — izle.",
    "sk.detay.belirgin-kayma": "Belirgin kayma — modeli yeniden değerlendir.",

    // --- Güvenilirlik diyagramı paneli ---
    "sk.diyagram.baslik": "Güvenilirlik diyagramı (kalibrasyon)",
    "sk.diyagram.aciklama":
      "Her skor kovasında modelin tahmini (mavi) ile gerçek bot oranı (kırmızı). İkisi ne kadar örtüşürse model o kadar kalibre.",
    "sk.diyagram.baloncuk": "{aralik}: tahmin %{tahmin} / gerçek %{gercek} ({sayi} olay)",
    "sk.diyagram.legend.tahmin": "Model tahmini",
    "sk.diyagram.legend.gercek": "Gerçek bot oranı",
    "sk.diyagram.iyi": 'ECE {ece} — skorlar güvenilir. "%X eminim" gerçekten %X doğru.',
    "sk.diyagram.kotu":
      "ECE {ece} — model olasılıkları gerçekle tam uyuşmuyor; eşikleri yeniden ayarlamayı düşün.",

    // --- Drift (PSI) paneli ---
    "sk.psi.baslik": "Özellik drift'i (PSI)",
    "sk.psi.aciklama":
      "Referans dönem ({ref} olay) vs güncel dönem ({gun} olay) dağılım kayması.",
    "sk.psi.not":
      "PSI <0,1 kararlı · 0,1–0,25 izle · >0,25 belirgin drift (modeli yeniden değerlendir).",

    // --- Eylem şeridi ---
    "sk.eylem.baslik": "Model sağlığı dikkat gerektiriyor",
    "sk.eylem.drift":
      "Trafik deseni belirgin biçimde kaydı — davranış eşiklerini ve adaptif zorluğu güncel dağılıma göre yeniden ayarla.",
    "sk.eylem.kalib": "Skor eşiklerini kalibre et; ML açıklanabilirlik ile kararları incele.",
    "sk.eylem.zorluk": "Adaptif zorluk",
    "sk.eylem.mlaciklama": "ML açıklanabilirlik",

    // --- Yöntem notu ---
    "sk.yontem":
      "<b>ECE</b> (Expected Calibration Error): skor kovaları arasında tahmin-gerçek farkının ağırlıklı ortalaması. <b>PSI</b> (Population Stability Index): iki dönemin dağılımı arasındaki fark. Her ikisi de {toplam} gerçek olaydan hesaplandı.",
  },

  en: {
    "sk.baslik": "Model Calibration & Drift Monitoring",

    "sk.giris.baslik": 'When the model says "90% sure", is it really 90% right?',
    "sk.giris.metin.1": "Two model-health metrics:",
    "sk.giris.kalibrasyon": "Calibration",
    "sk.giris.kalibrasyon.aciklama":
      "(does the predicted probability match the actual rate — reliability diagram + ECE)",
    "sk.giris.ve": "and",
    "sk.giris.drift": "Drift",
    "sk.giris.drift.aciklama":
      "(has the traffic pattern shifted from the reference period — PSI). If degraded, the model should be re-evaluated.",

    "sk.ozet.ece": "ECE (calibration error)",
    "sk.ozet.kalibDurum": "Calibration status",
    "sk.ozet.psi": "Overall PSI (drift)",
    "sk.ozet.driftDurum": "Drift status",

    "sk.kalib.iyi": "Well calibrated",
    "sk.kalib.orta": "Moderate",
    "sk.kalib.zayif": "Poorly calibrated",

    "sk.drift.kararli": "Stable",
    "sk.drift.izlemede": "Watching",
    "sk.drift.drift": "Drift detected",

    "sk.oz.kararli": "Stable",
    "sk.oz.kayma": "Slight shift",
    "sk.oz.belirgin-kayma": "Significant shift",

    "sk.ozellik.skor": "Humanity score distribution",
    "sk.ozellik.sinif": "Bot class distribution",
    "sk.ozellik.karar": "Verdict distribution",

    "sk.detay.kararli": "Distribution is stable.",
    "sk.detay.kayma": "Slight shift — keep watching.",
    "sk.detay.belirgin-kayma": "Significant shift — re-evaluate the model.",

    "sk.diyagram.baslik": "Reliability diagram (calibration)",
    "sk.diyagram.aciklama":
      "In each score bucket, the model's prediction (blue) vs the actual bot rate (red). The more they overlap, the better calibrated the model.",
    "sk.diyagram.baloncuk": "{aralik}: prediction {tahmin}% / actual {gercek}% ({sayi} events)",
    "sk.diyagram.legend.tahmin": "Model prediction",
    "sk.diyagram.legend.gercek": "Actual bot rate",
    "sk.diyagram.iyi": 'ECE {ece} — scores are reliable. "X% sure" really is X% right.',
    "sk.diyagram.kotu":
      "ECE {ece} — model probabilities don't fully match reality; consider re-tuning the thresholds.",

    "sk.psi.baslik": "Feature drift (PSI)",
    "sk.psi.aciklama":
      "Distribution shift: reference period ({ref} events) vs current period ({gun} events).",
    "sk.psi.not":
      "PSI <0.1 stable · 0.1–0.25 watch · >0.25 significant drift (re-evaluate the model).",

    "sk.eylem.baslik": "Model health needs attention",
    "sk.eylem.drift":
      "The traffic pattern has shifted significantly — retune behavior thresholds and adaptive difficulty to the current distribution.",
    "sk.eylem.kalib": "Calibrate the score thresholds; review decisions with ML explainability.",
    "sk.eylem.zorluk": "Adaptive difficulty",
    "sk.eylem.mlaciklama": "ML explainability",

    "sk.yontem":
      "<b>ECE</b> (Expected Calibration Error): the weighted average of the prediction-vs-actual gap across score buckets. <b>PSI</b> (Population Stability Index): the difference between the distributions of two periods. Both are computed from {toplam} real events.",
  },

  de: {
    "sk.baslik": "Modellkalibrierung & Drift-Überwachung",

    "sk.giris.baslik": 'Wenn das Modell "zu 90 % sicher" sagt — stimmt es wirklich zu 90 %?',
    "sk.giris.metin.1": "Zwei Modellgesundheits-Metriken:",
    "sk.giris.kalibrasyon": "Kalibrierung",
    "sk.giris.kalibrasyon.aciklama":
      "(stimmt die vorhergesagte Wahrscheinlichkeit mit der tatsächlichen Rate überein — Zuverlässigkeitsdiagramm + ECE)",
    "sk.giris.ve": "und",
    "sk.giris.drift": "Drift",
    "sk.giris.drift.aciklama":
      "(hat sich das Traffic-Muster gegenüber dem Referenzzeitraum verschoben — PSI). Bei Verschlechterung sollte das Modell neu bewertet werden.",

    "sk.ozet.ece": "ECE (Kalibrierungsfehler)",
    "sk.ozet.kalibDurum": "Kalibrierungsstatus",
    "sk.ozet.psi": "Gesamt-PSI (Drift)",
    "sk.ozet.driftDurum": "Drift-Status",

    "sk.kalib.iyi": "Gut kalibriert",
    "sk.kalib.orta": "Mittel",
    "sk.kalib.zayif": "Schlecht kalibriert",

    "sk.drift.kararli": "Stabil",
    "sk.drift.izlemede": "Beobachtung",
    "sk.drift.drift": "Drift erkannt",

    "sk.oz.kararli": "Stabil",
    "sk.oz.kayma": "Leichte Verschiebung",
    "sk.oz.belirgin-kayma": "Deutliche Verschiebung",

    "sk.ozellik.skor": "Verteilung des Menschlichkeits-Scores",
    "sk.ozellik.sinif": "Verteilung der Bot-Klassen",
    "sk.ozellik.karar": "Verteilung der Urteile",

    "sk.detay.kararli": "Verteilung ist stabil.",
    "sk.detay.kayma": "Leichte Verschiebung — beobachten.",
    "sk.detay.belirgin-kayma": "Deutliche Verschiebung — Modell neu bewerten.",

    "sk.diyagram.baslik": "Zuverlässigkeitsdiagramm (Kalibrierung)",
    "sk.diyagram.aciklama":
      "In jedem Score-Behälter die Vorhersage des Modells (blau) vs die tatsächliche Bot-Rate (rot). Je mehr sie sich überschneiden, desto besser kalibriert ist das Modell.",
    "sk.diyagram.baloncuk": "{aralik}: Vorhersage {tahmin} % / tatsächlich {gercek} % ({sayi} Ereignisse)",
    "sk.diyagram.legend.tahmin": "Modellvorhersage",
    "sk.diyagram.legend.gercek": "Tatsächliche Bot-Rate",
    "sk.diyagram.iyi": 'ECE {ece} — Scores sind zuverlässig. "X % sicher" ist wirklich X % richtig.',
    "sk.diyagram.kotu":
      "ECE {ece} — Modellwahrscheinlichkeiten stimmen nicht ganz mit der Realität überein; Schwellenwerte neu justieren.",

    "sk.psi.baslik": "Merkmals-Drift (PSI)",
    "sk.psi.aciklama":
      "Verteilungsverschiebung: Referenzzeitraum ({ref} Ereignisse) vs aktueller Zeitraum ({gun} Ereignisse).",
    "sk.psi.not":
      "PSI <0,1 stabil · 0,1–0,25 beobachten · >0,25 deutliche Drift (Modell neu bewerten).",

    "sk.eylem.baslik": "Modellgesundheit erfordert Aufmerksamkeit",
    "sk.eylem.drift":
      "Das Traffic-Muster hat sich deutlich verschoben — Verhaltensschwellen und adaptive Schwierigkeit auf die aktuelle Verteilung neu justieren.",
    "sk.eylem.kalib": "Score-Schwellen kalibrieren; Entscheidungen mit ML-Erklärbarkeit prüfen.",
    "sk.eylem.zorluk": "Adaptive Schwierigkeit",
    "sk.eylem.mlaciklama": "ML-Erklärbarkeit",

    "sk.yontem":
      "<b>ECE</b> (Expected Calibration Error): der gewichtete Durchschnitt der Vorhersage-Ist-Differenz über die Score-Behälter. <b>PSI</b> (Population Stability Index): der Unterschied zwischen den Verteilungen zweier Zeiträume. Beide werden aus {toplam} echten Ereignissen berechnet.",
  },

  fr: {
    "sk.baslik": "Calibration du modèle & surveillance de dérive",

    "sk.giris.baslik": 'Quand le modèle dit "sûr à 90 %", est-il vraiment juste à 90 % ?',
    "sk.giris.metin.1": "Deux métriques de santé du modèle :",
    "sk.giris.kalibrasyon": "Calibration",
    "sk.giris.kalibrasyon.aciklama":
      "(la probabilité prédite correspond-elle au taux réel — diagramme de fiabilité + ECE)",
    "sk.giris.ve": "et",
    "sk.giris.drift": "Dérive",
    "sk.giris.drift.aciklama":
      "(le motif de trafic a-t-il changé par rapport à la période de référence — PSI). En cas de dégradation, le modèle doit être réévalué.",

    "sk.ozet.ece": "ECE (erreur de calibration)",
    "sk.ozet.kalibDurum": "État de calibration",
    "sk.ozet.psi": "PSI global (dérive)",
    "sk.ozet.driftDurum": "État de dérive",

    "sk.kalib.iyi": "Bien calibré",
    "sk.kalib.orta": "Moyen",
    "sk.kalib.zayif": "Mal calibré",

    "sk.drift.kararli": "Stable",
    "sk.drift.izlemede": "Sous surveillance",
    "sk.drift.drift": "Dérive détectée",

    "sk.oz.kararli": "Stable",
    "sk.oz.kayma": "Léger décalage",
    "sk.oz.belirgin-kayma": "Décalage marqué",

    "sk.ozellik.skor": "Distribution du score d'humanité",
    "sk.ozellik.sinif": "Distribution des classes de bots",
    "sk.ozellik.karar": "Distribution des verdicts",

    "sk.detay.kararli": "La distribution est stable.",
    "sk.detay.kayma": "Léger décalage — à surveiller.",
    "sk.detay.belirgin-kayma": "Décalage marqué — réévaluer le modèle.",

    "sk.diyagram.baslik": "Diagramme de fiabilité (calibration)",
    "sk.diyagram.aciklama":
      "Dans chaque tranche de score, la prédiction du modèle (bleu) vs le taux réel de bots (rouge). Plus elles se recouvrent, mieux le modèle est calibré.",
    "sk.diyagram.baloncuk": "{aralik} : prédiction {tahmin} % / réel {gercek} % ({sayi} événements)",
    "sk.diyagram.legend.tahmin": "Prédiction du modèle",
    "sk.diyagram.legend.gercek": "Taux réel de bots",
    "sk.diyagram.iyi": 'ECE {ece} — les scores sont fiables. "X % sûr" est vraiment juste à X %.',
    "sk.diyagram.kotu":
      "ECE {ece} — les probabilités du modèle ne correspondent pas tout à fait à la réalité ; envisagez de réajuster les seuils.",

    "sk.psi.baslik": "Dérive des caractéristiques (PSI)",
    "sk.psi.aciklama":
      "Décalage de distribution : période de référence ({ref} événements) vs période actuelle ({gun} événements).",
    "sk.psi.not":
      "PSI <0,1 stable · 0,1–0,25 surveiller · >0,25 dérive marquée (réévaluer le modèle).",

    "sk.eylem.baslik": "La santé du modèle requiert attention",
    "sk.eylem.drift":
      "Le motif de trafic a nettement changé — réajustez les seuils de comportement et la difficulté adaptative à la distribution actuelle.",
    "sk.eylem.kalib": "Calibrez les seuils de score ; examinez les décisions avec l'explicabilité ML.",
    "sk.eylem.zorluk": "Difficulté adaptative",
    "sk.eylem.mlaciklama": "Explicabilité ML",

    "sk.yontem":
      "<b>ECE</b> (Expected Calibration Error) : la moyenne pondérée de l'écart prédiction-réel sur les tranches de score. <b>PSI</b> (Population Stability Index) : la différence entre les distributions de deux périodes. Les deux sont calculés à partir de {toplam} événements réels.",
  },

  es: {
    "sk.baslik": "Calibración del modelo & monitoreo de deriva",

    "sk.giris.baslik": 'Cuando el modelo dice "90 % seguro", ¿acierta realmente el 90 %?',
    "sk.giris.metin.1": "Dos métricas de salud del modelo:",
    "sk.giris.kalibrasyon": "Calibración",
    "sk.giris.kalibrasyon.aciklama":
      "(¿la probabilidad predicha coincide con la tasa real — diagrama de fiabilidad + ECE?)",
    "sk.giris.ve": "y",
    "sk.giris.drift": "Deriva",
    "sk.giris.drift.aciklama":
      "(¿el patrón de tráfico se ha desplazado respecto al periodo de referencia — PSI?). Si se degrada, el modelo debe reevaluarse.",

    "sk.ozet.ece": "ECE (error de calibración)",
    "sk.ozet.kalibDurum": "Estado de calibración",
    "sk.ozet.psi": "PSI general (deriva)",
    "sk.ozet.driftDurum": "Estado de deriva",

    "sk.kalib.iyi": "Bien calibrado",
    "sk.kalib.orta": "Medio",
    "sk.kalib.zayif": "Mal calibrado",

    "sk.drift.kararli": "Estable",
    "sk.drift.izlemede": "En observación",
    "sk.drift.drift": "Deriva detectada",

    "sk.oz.kararli": "Estable",
    "sk.oz.kayma": "Ligero desplazamiento",
    "sk.oz.belirgin-kayma": "Desplazamiento marcado",

    "sk.ozellik.skor": "Distribución del puntaje de humanidad",
    "sk.ozellik.sinif": "Distribución de clases de bots",
    "sk.ozellik.karar": "Distribución de veredictos",

    "sk.detay.kararli": "La distribución es estable.",
    "sk.detay.kayma": "Ligero desplazamiento — vigilar.",
    "sk.detay.belirgin-kayma": "Desplazamiento marcado — reevaluar el modelo.",

    "sk.diyagram.baslik": "Diagrama de fiabilidad (calibración)",
    "sk.diyagram.aciklama":
      "En cada cubo de puntaje, la predicción del modelo (azul) vs la tasa real de bots (rojo). Cuanto más se superponen, mejor calibrado está el modelo.",
    "sk.diyagram.baloncuk": "{aralik}: predicción {tahmin} % / real {gercek} % ({sayi} eventos)",
    "sk.diyagram.legend.tahmin": "Predicción del modelo",
    "sk.diyagram.legend.gercek": "Tasa real de bots",
    "sk.diyagram.iyi": 'ECE {ece} — los puntajes son fiables. "X % seguro" realmente acierta el X %.',
    "sk.diyagram.kotu":
      "ECE {ece} — las probabilidades del modelo no coinciden del todo con la realidad; considera reajustar los umbrales.",

    "sk.psi.baslik": "Deriva de características (PSI)",
    "sk.psi.aciklama":
      "Desplazamiento de distribución: periodo de referencia ({ref} eventos) vs periodo actual ({gun} eventos).",
    "sk.psi.not":
      "PSI <0,1 estable · 0,1–0,25 vigilar · >0,25 deriva marcada (reevaluar el modelo).",

    "sk.eylem.baslik": "La salud del modelo requiere atención",
    "sk.eylem.drift":
      "El patrón de tráfico se ha desplazado notablemente — reajusta los umbrales de comportamiento y la dificultad adaptativa a la distribución actual.",
    "sk.eylem.kalib": "Calibra los umbrales de puntaje; revisa las decisiones con explicabilidad ML.",
    "sk.eylem.zorluk": "Dificultad adaptativa",
    "sk.eylem.mlaciklama": "Explicabilidad ML",

    "sk.yontem":
      "<b>ECE</b> (Expected Calibration Error): el promedio ponderado de la diferencia predicción-real entre los cubos de puntaje. <b>PSI</b> (Population Stability Index): la diferencia entre las distribuciones de dos periodos. Ambos se calculan a partir de {toplam} eventos reales.",
  },
};

/** Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer. */
export function skorKalibrasyonCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
