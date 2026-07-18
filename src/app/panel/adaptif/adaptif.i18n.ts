/**
 * Adaptif Öğrenme — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `adaptifCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * BAŞLIK: kırıntı "Adaptif Öğrenme" panel.ts'teki `nav.adaptive` ile birebir eşleşir
 * (page.tsx onu `ceviri("nav.adaptive", dil)` ile çözer). Üst başlık farklı olduğundan
 * (Geri-Besleme Döngüsü & Adaptif Eşik Öğrenme) burada yerel `x.ustBaslik` tutulur.
 *
 * ENUM GÜVENLİĞİ: sağlık durumu (optimal/ayarlanmali/kritik) bir enum'dur; asla
 * çevrilmez. Lib'deki DURUM_ETIKET kaldırılıp istemci tarafında enum id → KEY-MAP
 * ("durum.optimal" vb.) üzerinden yeniden türetilir. Sayılar/oranlar veri olarak kalır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // üst başlık (kırıntı nav.adaptive'ten gelir; bu ondan farklı)
    "x.ustBaslik": "Geri-Besleme Döngüsü & Adaptif Eşik Öğrenme",

    // durum etiketleri (enum key-map)
    "durum.optimal": "Optimal",
    "durum.ayarlanmali": "Ayarlanmalı",
    "durum.kritik": "Kritik sapma",

    // açıklama şeridi
    "aciklama.baslik": "Statik eşik eskir; saldırgan adapte olur — savunma da öğrenmeli.",
    "aciklama.metin":
      "Kapalı-döngü öğrenme: savunma kararlarının sonuçlarını (kaç bot kaçtı = yanlış-negatif, kaç insan engellendi = yanlış-pozitif) gözlemler, maliyet-ağırlıklı gradyan inişiyle karar eşiğini otomatik ayarlar. Bot kaçıyorsa eşik yükseltilir, insan engelleniyorsa düşürülür — {online}.",
    "aciklama.online": "online öğrenme",

    // özet kartları
    "ozet.optimalEsik": "Öğrenilen optimal eşik",
    "ozet.sapma": "Mevcut eşik sapması (0.50'den)",
    "ozet.f1": "Optimal F1 skoru",
    "ozet.saglik": "Geri-besleme sağlığı",

    // maliyet eğrisi paneli
    "egri.baslik": "Maliyet eğrisi & optimal eşik",
    "egri.aciklama":
      "Her aday eşikte maliyet (yanlış-pozitif + yanlış-negatif, ağırlıklı). Öğrenme bu eğrinin minimumunu bulur.",
    "egri.eksenEsik": "eşik →",
    "egri.efsaneMaliyet": "Maliyet (düşük iyi)",
    "egri.efsaneF1": "F1 (yüksek iyi)",
    "egri.efsaneOptimal": "Optimal eşik {esik}",

    // öğrenme yakınsaması paneli
    "yakinsama.baslik": "Öğrenme yakınsaması",
    "yakinsama.aciklama": "Gradyan inişi turları — eşik momentum ile optimuma yakınsar.",
    "yakinsama.maliyet": "maliyet {deger}",
    "yakinsama.altBilgi": "{tur} tur · {durum}",
    "yakinsama.yakinsadi": "yakınsadı ✓",
    "yakinsama.maxTur": "max tura ulaştı",

    // karar matrisi
    "matris.baslik": "Karar kalitesi: başlangıç → optimal",
    "matris.baslangicEsik": "Başlangıç eşik {esik}",
    "matris.ogrenilenEsik": "Öğrenilen eşik {esik}",
    "matris.iyilesme": "Öğrenilen eşik hata maliyetini {oran} düşürüyor.",
    "matris.tp": "Bot yakalandı (TP)",
    "matris.fn": "Bot kaçtı (FN)",
    "matris.fp": "İnsan engellendi (FP)",
    "matris.tn": "İnsan geçti (TN)",
    "matris.f1": "F1:",
    "matris.kesinlik": "Kesinlik:",
    "matris.maliyet": "Maliyet:",

    // öneri bandı
    "oneri.dengede": "Geri-besleme döngüsü dengede",
    "oneri.ayarOner": "Eşik ayarı öneriliyor",
    "oneri.zorlukLink": "Zorluk optimizasyonu",
    // öneri metni (lib'deki geriBeslemeSaglik.oneri istemcide yeniden türetilir)
    "oneri.optimal": "Eşik optimuma yakın — geri-besleme döngüsü dengede.",
    "oneri.ayar": "Eşiği {mevcut} → {optimal} olarak ayarla: maliyet {oran} düşer ({yon}).",
    "oneri.yonBot": "daha çok bot yakalanır",
    "oneri.yonInsan": "daha az insan engellenir",

    // yöntem notu
    "not.metin":
      "Eşik, {sayi} gerçek olayın skor dağılımından öğrenilir: her olayın gerçek etiketi (kötü sınıf mı) ile insanlık skoru kullanılır. Maliyet = yanlış-pozitif (insan engelleme, ×1.5) + yanlış-negatif (bot kaçırma, ×1.0). Öğrenme, sonlu-fark gradyanı + momentum ile maliyeti minimize eder; tarama-optimumuyla doğrulanır (yerel-minimum koruması).",
  },

  en: {
    "x.ustBaslik": "Feedback Loop & Adaptive Threshold Learning",

    "durum.optimal": "Optimal",
    "durum.ayarlanmali": "Needs tuning",
    "durum.kritik": "Critical drift",

    "aciklama.baslik": "A static threshold decays; the attacker adapts — so the defense must learn too.",
    "aciklama.metin":
      "Closed-loop learning: it observes the outcomes of defense decisions (how many bots escaped = false-negatives, how many humans were blocked = false-positives) and auto-tunes the decision threshold via cost-weighted gradient descent. If bots are escaping the threshold rises; if humans are blocked it drops — {online}.",
    "aciklama.online": "online learning",

    "ozet.optimalEsik": "Learned optimal threshold",
    "ozet.sapma": "Current threshold drift (from 0.50)",
    "ozet.f1": "Optimal F1 score",
    "ozet.saglik": "Feedback health",

    "egri.baslik": "Cost curve & optimal threshold",
    "egri.aciklama":
      "Cost at each candidate threshold (false-positive + false-negative, weighted). Learning finds the minimum of this curve.",
    "egri.eksenEsik": "threshold →",
    "egri.efsaneMaliyet": "Cost (lower is better)",
    "egri.efsaneF1": "F1 (higher is better)",
    "egri.efsaneOptimal": "Optimal threshold {esik}",

    "yakinsama.baslik": "Learning convergence",
    "yakinsama.aciklama": "Gradient-descent rounds — the threshold converges to the optimum with momentum.",
    "yakinsama.maliyet": "cost {deger}",
    "yakinsama.altBilgi": "{tur} rounds · {durum}",
    "yakinsama.yakinsadi": "converged ✓",
    "yakinsama.maxTur": "reached max rounds",

    "matris.baslik": "Decision quality: initial → optimal",
    "matris.baslangicEsik": "Initial threshold {esik}",
    "matris.ogrenilenEsik": "Learned threshold {esik}",
    "matris.iyilesme": "The learned threshold cuts error cost by {oran}.",
    "matris.tp": "Bot caught (TP)",
    "matris.fn": "Bot escaped (FN)",
    "matris.fp": "Human blocked (FP)",
    "matris.tn": "Human passed (TN)",
    "matris.f1": "F1:",
    "matris.kesinlik": "Precision:",
    "matris.maliyet": "Cost:",

    "oneri.dengede": "Feedback loop is balanced",
    "oneri.ayarOner": "Threshold adjustment recommended",
    "oneri.zorlukLink": "Difficulty optimization",
    "oneri.optimal": "The threshold is near the optimum — the feedback loop is balanced.",
    "oneri.ayar": "Set the threshold {mevcut} → {optimal}: cost drops by {oran} ({yon}).",
    "oneri.yonBot": "more bots are caught",
    "oneri.yonInsan": "fewer humans are blocked",

    "not.metin":
      "The threshold is learned from the score distribution of {sayi} real events: each event's ground-truth label (is it the bad class) and humanity score are used. Cost = false-positive (blocking a human, ×1.5) + false-negative (missing a bot, ×1.0). Learning minimizes cost with a finite-difference gradient + momentum; it is verified against the sweep-optimum (local-minimum protection).",
  },

  de: {
    "x.ustBaslik": "Rückkopplungsschleife & adaptives Schwellwert-Lernen",

    "durum.optimal": "Optimal",
    "durum.ayarlanmali": "Anpassung nötig",
    "durum.kritik": "Kritische Abweichung",

    "aciklama.baslik": "Ein statischer Schwellwert veraltet; der Angreifer passt sich an — also muss auch die Abwehr lernen.",
    "aciklama.metin":
      "Geschlossenes Lernen: Es beobachtet die Ergebnisse der Abwehrentscheidungen (wie viele Bots entkamen = falsch-negativ, wie viele Menschen blockiert wurden = falsch-positiv) und stellt den Entscheidungsschwellwert per kostengewichtetem Gradientenabstieg automatisch ein. Entkommen Bots, steigt der Schwellwert; werden Menschen blockiert, sinkt er — {online}.",
    "aciklama.online": "Online-Lernen",

    "ozet.optimalEsik": "Gelernter optimaler Schwellwert",
    "ozet.sapma": "Aktuelle Schwellwert-Abweichung (von 0,50)",
    "ozet.f1": "Optimaler F1-Wert",
    "ozet.saglik": "Rückkopplungs-Zustand",

    "egri.baslik": "Kostenkurve & optimaler Schwellwert",
    "egri.aciklama":
      "Kosten bei jedem Kandidaten-Schwellwert (falsch-positiv + falsch-negativ, gewichtet). Das Lernen findet das Minimum dieser Kurve.",
    "egri.eksenEsik": "Schwellwert →",
    "egri.efsaneMaliyet": "Kosten (niedriger ist besser)",
    "egri.efsaneF1": "F1 (höher ist besser)",
    "egri.efsaneOptimal": "Optimaler Schwellwert {esik}",

    "yakinsama.baslik": "Lern-Konvergenz",
    "yakinsama.aciklama": "Gradientenabstiegs-Runden — der Schwellwert konvergiert mit Momentum zum Optimum.",
    "yakinsama.maliyet": "Kosten {deger}",
    "yakinsama.altBilgi": "{tur} Runden · {durum}",
    "yakinsama.yakinsadi": "konvergiert ✓",
    "yakinsama.maxTur": "Maximale Runden erreicht",

    "matris.baslik": "Entscheidungsqualität: Start → optimal",
    "matris.baslangicEsik": "Start-Schwellwert {esik}",
    "matris.ogrenilenEsik": "Gelernter Schwellwert {esik}",
    "matris.iyilesme": "Der gelernte Schwellwert senkt die Fehlerkosten um {oran}.",
    "matris.tp": "Bot erwischt (TP)",
    "matris.fn": "Bot entkommen (FN)",
    "matris.fp": "Mensch blockiert (FP)",
    "matris.tn": "Mensch durchgelassen (TN)",
    "matris.f1": "F1:",
    "matris.kesinlik": "Präzision:",
    "matris.maliyet": "Kosten:",

    "oneri.dengede": "Rückkopplungsschleife ist im Gleichgewicht",
    "oneri.ayarOner": "Schwellwert-Anpassung empfohlen",
    "oneri.zorlukLink": "Schwierigkeitsoptimierung",
    "oneri.optimal": "Der Schwellwert liegt nahe am Optimum — die Rückkopplungsschleife ist im Gleichgewicht.",
    "oneri.ayar": "Schwellwert {mevcut} → {optimal} setzen: Kosten sinken um {oran} ({yon}).",
    "oneri.yonBot": "mehr Bots werden erwischt",
    "oneri.yonInsan": "weniger Menschen werden blockiert",

    "not.metin":
      "Der Schwellwert wird aus der Score-Verteilung von {sayi} realen Ereignissen gelernt: das Ground-Truth-Label jedes Ereignisses (gehört es zur schlechten Klasse) und der Menschlichkeits-Score werden genutzt. Kosten = falsch-positiv (Mensch blockieren, ×1,5) + falsch-negativ (Bot verpassen, ×1,0). Das Lernen minimiert die Kosten mit einem Finite-Differenzen-Gradienten + Momentum; es wird gegen das Sweep-Optimum verifiziert (Schutz vor lokalem Minimum).",
  },

  fr: {
    "x.ustBaslik": "Boucle de rétroaction & apprentissage adaptatif du seuil",

    "durum.optimal": "Optimal",
    "durum.ayarlanmali": "À ajuster",
    "durum.kritik": "Dérive critique",

    "aciklama.baslik": "Un seuil statique se périme ; l'attaquant s'adapte — la défense doit donc apprendre elle aussi.",
    "aciklama.metin":
      "Apprentissage en boucle fermée : il observe les résultats des décisions de défense (combien de bots ont échappé = faux négatifs, combien d'humains ont été bloqués = faux positifs) et ajuste automatiquement le seuil de décision par descente de gradient pondérée par le coût. Si des bots échappent, le seuil monte ; si des humains sont bloqués, il descend — {online}.",
    "aciklama.online": "apprentissage en ligne",

    "ozet.optimalEsik": "Seuil optimal appris",
    "ozet.sapma": "Dérive actuelle du seuil (par rapport à 0,50)",
    "ozet.f1": "Score F1 optimal",
    "ozet.saglik": "Santé de la rétroaction",

    "egri.baslik": "Courbe de coût & seuil optimal",
    "egri.aciklama":
      "Coût à chaque seuil candidat (faux positif + faux négatif, pondéré). L'apprentissage trouve le minimum de cette courbe.",
    "egri.eksenEsik": "seuil →",
    "egri.efsaneMaliyet": "Coût (plus bas c'est mieux)",
    "egri.efsaneF1": "F1 (plus haut c'est mieux)",
    "egri.efsaneOptimal": "Seuil optimal {esik}",

    "yakinsama.baslik": "Convergence de l'apprentissage",
    "yakinsama.aciklama": "Tours de descente de gradient — le seuil converge vers l'optimum avec l'élan.",
    "yakinsama.maliyet": "coût {deger}",
    "yakinsama.altBilgi": "{tur} tours · {durum}",
    "yakinsama.yakinsadi": "convergé ✓",
    "yakinsama.maxTur": "nombre max de tours atteint",

    "matris.baslik": "Qualité de décision : initial → optimal",
    "matris.baslangicEsik": "Seuil initial {esik}",
    "matris.ogrenilenEsik": "Seuil appris {esik}",
    "matris.iyilesme": "Le seuil appris réduit le coût d'erreur de {oran}.",
    "matris.tp": "Bot attrapé (VP)",
    "matris.fn": "Bot échappé (FN)",
    "matris.fp": "Humain bloqué (FP)",
    "matris.tn": "Humain passé (VN)",
    "matris.f1": "F1 :",
    "matris.kesinlik": "Précision :",
    "matris.maliyet": "Coût :",

    "oneri.dengede": "La boucle de rétroaction est équilibrée",
    "oneri.ayarOner": "Ajustement du seuil recommandé",
    "oneri.zorlukLink": "Optimisation de la difficulté",
    "oneri.optimal": "Le seuil est proche de l'optimum — la boucle de rétroaction est équilibrée.",
    "oneri.ayar": "Réglez le seuil {mevcut} → {optimal} : le coût baisse de {oran} ({yon}).",
    "oneri.yonBot": "plus de bots sont attrapés",
    "oneri.yonInsan": "moins d'humains sont bloqués",

    "not.metin":
      "Le seuil est appris à partir de la distribution des scores de {sayi} événements réels : l'étiquette de vérité terrain de chaque événement (appartient-il à la mauvaise classe) et le score d'humanité sont utilisés. Coût = faux positif (bloquer un humain, ×1,5) + faux négatif (rater un bot, ×1,0). L'apprentissage minimise le coût avec un gradient par différences finies + élan ; il est vérifié par rapport à l'optimum du balayage (protection contre le minimum local).",
  },

  es: {
    "x.ustBaslik": "Bucle de retroalimentación y aprendizaje adaptativo de umbral",

    "durum.optimal": "Óptimo",
    "durum.ayarlanmali": "Requiere ajuste",
    "durum.kritik": "Desviación crítica",

    "aciklama.baslik": "Un umbral estático caduca; el atacante se adapta — así que la defensa también debe aprender.",
    "aciklama.metin":
      "Aprendizaje en bucle cerrado: observa los resultados de las decisiones de defensa (cuántos bots escaparon = falsos negativos, cuántos humanos fueron bloqueados = falsos positivos) y ajusta automáticamente el umbral de decisión mediante descenso de gradiente ponderado por coste. Si los bots escapan, el umbral sube; si se bloquean humanos, baja — {online}.",
    "aciklama.online": "aprendizaje en línea",

    "ozet.optimalEsik": "Umbral óptimo aprendido",
    "ozet.sapma": "Desviación actual del umbral (desde 0,50)",
    "ozet.f1": "Puntuación F1 óptima",
    "ozet.saglik": "Salud de la retroalimentación",

    "egri.baslik": "Curva de coste y umbral óptimo",
    "egri.aciklama":
      "Coste en cada umbral candidato (falso positivo + falso negativo, ponderado). El aprendizaje encuentra el mínimo de esta curva.",
    "egri.eksenEsik": "umbral →",
    "egri.efsaneMaliyet": "Coste (menor es mejor)",
    "egri.efsaneF1": "F1 (mayor es mejor)",
    "egri.efsaneOptimal": "Umbral óptimo {esik}",

    "yakinsama.baslik": "Convergencia del aprendizaje",
    "yakinsama.aciklama": "Rondas de descenso de gradiente — el umbral converge al óptimo con impulso.",
    "yakinsama.maliyet": "coste {deger}",
    "yakinsama.altBilgi": "{tur} rondas · {durum}",
    "yakinsama.yakinsadi": "convergió ✓",
    "yakinsama.maxTur": "alcanzó el máximo de rondas",

    "matris.baslik": "Calidad de decisión: inicial → óptimo",
    "matris.baslangicEsik": "Umbral inicial {esik}",
    "matris.ogrenilenEsik": "Umbral aprendido {esik}",
    "matris.iyilesme": "El umbral aprendido reduce el coste de error en un {oran}.",
    "matris.tp": "Bot atrapado (VP)",
    "matris.fn": "Bot escapado (FN)",
    "matris.fp": "Humano bloqueado (FP)",
    "matris.tn": "Humano pasó (VN)",
    "matris.f1": "F1:",
    "matris.kesinlik": "Precisión:",
    "matris.maliyet": "Coste:",

    "oneri.dengede": "El bucle de retroalimentación está equilibrado",
    "oneri.ayarOner": "Se recomienda ajustar el umbral",
    "oneri.zorlukLink": "Optimización de dificultad",
    "oneri.optimal": "El umbral está cerca del óptimo — el bucle de retroalimentación está equilibrado.",
    "oneri.ayar": "Ajusta el umbral {mevcut} → {optimal}: el coste baja un {oran} ({yon}).",
    "oneri.yonBot": "se atrapan más bots",
    "oneri.yonInsan": "se bloquean menos humanos",

    "not.metin":
      "El umbral se aprende de la distribución de puntuaciones de {sayi} eventos reales: se usan la etiqueta de verdad de cada evento (¿es la clase mala?) y la puntuación de humanidad. Coste = falso positivo (bloquear a un humano, ×1,5) + falso negativo (dejar pasar un bot, ×1,0). El aprendizaje minimiza el coste con un gradiente de diferencias finitas + impulso; se verifica contra el óptimo del barrido (protección de mínimo local).",
  },
};

/** Anahtarı hedef dile çevir; bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function adaptifCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
