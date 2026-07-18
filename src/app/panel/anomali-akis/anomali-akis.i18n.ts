/**
 * Anomali Akışı sayfası — yerel çeviri sözlüğü + motor-metni yeniden türetme.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` ve motor kütüphanesi `src/lib/specter/anomaly.ts`
 * DEĞİŞTİRİLMEZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine
 * düşer.
 *
 * MOTOR-METNİ SORUNU
 * ------------------
 * `anomaliTespit()` (lib) her anomali için Türkçe `baslik/aciklama/oneri`
 * üretir; içine sayılar (istek adedi, yüzde, z-skor, ort. skor) ve `cografya`
 * türünde ülke kodu gömülüdür. Lib'i düzenleyemediğimiz için: enum `tur`
 * değerine göre yerel şablon seçilir ve Türkçe metinden regex ile SAYI
 * TOKEN'LARI çıkarılıp yeniden yerleştirilir (bkz. anomaliMetin). Böylece
 * çeviri tamamen istemci tarafında, lib'e dokunmadan yapılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "aa.serit.baslik": "Gerçek-zaman anomali konsolu.",
    "aa.serit.aciklama":
      "Gelen trafik canlı izlenir; ani hız sıçraması, yeni coğrafya/ASN, bot-oranı yükselişi ve skor düşüşü belirir belirmez şiddetiyle işaretlenir. Batch tespitten daha derin, sürekli akan bir NOC/SOC görünümü.",

    // Komuta bandı
    "aa.komuta.baslik": "Anomali Akış Konsolu",
    "aa.canli": "canlı",
    "aa.duraklatildi": "duraklatıldı",
    "aa.duraklat": "Duraklat",
    "aa.devamEt": "Devam et",
    "aa.tehditSeviyesi": "Tehdit seviyesi",
    "aa.olayHizi": "Olay hızı",
    "aa.sicrama": "Sıçrama",
    "aa.olaySn": "olay/sn",
    "aa.botHizi": "Bot hızı",
    "aa.botSn": "bot/sn",
    "aa.botOrani": "bot oranı %{n}",
    "aa.taban": "taban ~{n}/sn",
    "aa.buOturum": "Bu oturum",
    "aa.anomali": "anomali",
    "aa.izlendi": "{olay} olay · {bot} bot izlendi",

    // Seviye etiketleri
    "aa.seviye.kritik": "Kritik",
    "aa.seviye.yuksek": "Yüksek",
    "aa.seviye.orta": "Orta",
    "aa.seviye.dusuk": "Düşük",

    // Özet kartları
    "aa.kart.akistaAnomali": "Akıştaki anomali",
    "aa.kart.canliTehdit": "Canlı tehdit skoru",
    "aa.kart.anlikBot": "Anlık bot oranı",
    "aa.kart.izlenenOlay": "İzlenen olay (tohum)",

    // Akış paneli
    "aa.panel.canliAkis": "Canlı anomali akışı",
    "aa.izleniyor": "izleniyor",
    "aa.bos.baslik": "Akış temiz — anomali yok.",
    "aa.bos.aciklama": "Trafik izleniyor. Bir sapma belirdiğinde anında burada görünecek.",

    // Yan panel
    "aa.panel.turDagilim": "Anomali türü dağılımı",
    "aa.turYok": "Henüz anomali türü yok.",
    "aa.panel.hizliEylemler": "Hızlı eylemler",
    "aa.hizli.aciklama": "Anomaliye tepki ver: kural öner, zorluğu artır ya da kaynağı incele.",
    "aa.eylem.kuralAd": "Kural önerileri",
    "aa.eylem.kuralDesc": "AI destekli kural teklifleri",
    "aa.eylem.zorlukAd": "Adaptif zorluk",
    "aa.eylem.zorlukDesc": "Challenge sıkılığını artır",
    "aa.eylem.tehditAd": "Tehdit istihbaratı",
    "aa.eylem.tehditDesc": "Saldırgan IP'leri incele",
    "aa.dipnot": "Bu konsol batch anomali motorunu ({n} olay tohumu) canlı akış üzerinde sürekli yeniden çalıştırır. Aynı anomali 90 sn içinde tekrar listelenmez (gürültü bastırma).",

    // Şiddet etiketleri (enum: kritik/yuksek/orta/dusuk)
    "aa.siddet.kritik": "Kritik",
    "aa.siddet.yuksek": "Yüksek",
    "aa.siddet.orta": "Orta",
    "aa.siddet.dusuk": "Düşük",

    // Anomali türü etiketleri (enum: tur)
    "aa.tur.trafik_artis": "Trafik artışı",
    "aa.tur.trafik_dus": "Trafik düşüşü",
    "aa.tur.bot_orani": "Bot oranı",
    "aa.tur.cografya": "Coğrafya kayması",
    "aa.tur.skor_dusus": "Skor düşüşü",
    "aa.tur.ai_ajan": "AI ajan",
    "aa.tur.yeni_asn": "Yeni ASN",

    // Satır eylem kısayolları (enum tur → hedef)
    "aa.satirEylem.tehdit": "Tehdit istihbaratı",
    "aa.satirEylem.zorluk": "Adaptif zorluk",
    "aa.satirEylem.kural": "Kural önerileri",

    // --- Motor-metni yeniden türetilmiş başlık/açıklama/öneri şablonları ---
    "aa.motor.trafik_artis.baslik": "Trafik ani yükselişi",
    "aa.motor.trafik_artis.aciklama": "Son saatte {istek} istek — normalin {kat}× üstünde (z={z}).",
    "aa.motor.trafik_artis.oneri": "Koordineli bir kampanya olabilir; Tehdit İstihbaratı'nı ve kural motorunu kontrol et.",
    "aa.motor.trafik_dus.baslik": "Trafik ani düşüşü",
    "aa.motor.trafik_dus.aciklama": "Son saatte trafik normalin %{yuzde} altında (z={z}).",
    "aa.motor.trafik_dus.oneri": "Widget entegrasyonu veya site erişilebilirliğini doğrula.",
    "aa.motor.bot_orani.baslik": "Bot oranı sıçraması",
    "aa.motor.bot_orani.aciklama": "Bot oranı %{a} → %{b} yükseldi.",
    "aa.motor.bot_orani.oneri": "Yeni bir bot dalgası başlamış olabilir; agresif kural veya challenge modu düşün.",
    "aa.motor.cografya.baslik": "{ulke} kaynaklı ani yoğunlaşma",
    "aa.motor.cografya.aciklama": "Son saatteki isteklerin %{a}'i {ulke} kaynaklı (normalde %{b}).",
    "aa.motor.cografya.oneri": "Coğrafi kural veya {ulke} için ek doğrulama düşünülebilir.",
    "aa.motor.ai_ajan.baslik": "AI ajan taraması yoğunlaştı",
    "aa.motor.ai_ajan.aciklama": "AI ajan trafiği %{a} → %{b} arttı.",
    "aa.motor.ai_ajan.oneri": "AI Ajan İstihbaratı'ndan politikaları gözden geçir; eğitim botlarını engelle.",
    "aa.motor.skor_dusus.baslik": "Ortalama insanlık skoru düştü",
    "aa.motor.skor_dusus.aciklama": "Ort. skor {a} → {b} (daha çok otomasyon).",
    "aa.motor.skor_dusus.oneri": "Davranış eşiğini yükseltmeyi veya görünmez modu sıkılaştırmayı değerlendir.",
  },

  en: {
    "aa.serit.baslik": "Real-time anomaly console.",
    "aa.serit.aciklama":
      "Incoming traffic is watched live; sudden rate spikes, new geography/ASN, rising bot ratio and score drops are flagged with their severity the moment they appear. A continuously streaming NOC/SOC view, deeper than batch detection.",

    "aa.komuta.baslik": "Anomaly Stream Console",
    "aa.canli": "live",
    "aa.duraklatildi": "paused",
    "aa.duraklat": "Pause",
    "aa.devamEt": "Resume",
    "aa.tehditSeviyesi": "Threat level",
    "aa.olayHizi": "Event rate",
    "aa.sicrama": "Spike",
    "aa.olaySn": "events/s",
    "aa.botHizi": "Bot rate",
    "aa.botSn": "bots/s",
    "aa.botOrani": "bot ratio {n}%",
    "aa.taban": "baseline ~{n}/s",
    "aa.buOturum": "This session",
    "aa.anomali": "anomalies",
    "aa.izlendi": "{olay} events · {bot} bots observed",

    "aa.seviye.kritik": "Critical",
    "aa.seviye.yuksek": "High",
    "aa.seviye.orta": "Medium",
    "aa.seviye.dusuk": "Low",

    "aa.kart.akistaAnomali": "Anomalies in stream",
    "aa.kart.canliTehdit": "Live threat score",
    "aa.kart.anlikBot": "Current bot ratio",
    "aa.kart.izlenenOlay": "Observed events (seed)",

    "aa.panel.canliAkis": "Live anomaly stream",
    "aa.izleniyor": "watching",
    "aa.bos.baslik": "Stream clear — no anomalies.",
    "aa.bos.aciklama": "Traffic is being watched. The moment a deviation appears it will show up here.",

    "aa.panel.turDagilim": "Anomaly type distribution",
    "aa.turYok": "No anomaly types yet.",
    "aa.panel.hizliEylemler": "Quick actions",
    "aa.hizli.aciklama": "Respond to the anomaly: propose a rule, raise difficulty or inspect the source.",
    "aa.eylem.kuralAd": "Rule suggestions",
    "aa.eylem.kuralDesc": "AI-assisted rule proposals",
    "aa.eylem.zorlukAd": "Adaptive difficulty",
    "aa.eylem.zorlukDesc": "Tighten challenge strictness",
    "aa.eylem.tehditAd": "Threat intelligence",
    "aa.eylem.tehditDesc": "Inspect attacker IPs",
    "aa.dipnot": "This console continuously re-runs the batch anomaly engine (seeded with {n} events) over the live stream. The same anomaly is not re-listed within 90s (noise suppression).",

    "aa.siddet.kritik": "Critical",
    "aa.siddet.yuksek": "High",
    "aa.siddet.orta": "Medium",
    "aa.siddet.dusuk": "Low",

    "aa.tur.trafik_artis": "Traffic spike",
    "aa.tur.trafik_dus": "Traffic drop",
    "aa.tur.bot_orani": "Bot ratio",
    "aa.tur.cografya": "Geography shift",
    "aa.tur.skor_dusus": "Score drop",
    "aa.tur.ai_ajan": "AI agent",
    "aa.tur.yeni_asn": "New ASN",

    "aa.satirEylem.tehdit": "Threat intelligence",
    "aa.satirEylem.zorluk": "Adaptive difficulty",
    "aa.satirEylem.kural": "Rule suggestions",

    "aa.motor.trafik_artis.baslik": "Sudden traffic spike",
    "aa.motor.trafik_artis.aciklama": "{istek} requests in the last hour — {kat}× above normal (z={z}).",
    "aa.motor.trafik_artis.oneri": "May be a coordinated campaign; check Threat Intelligence and the rule engine.",
    "aa.motor.trafik_dus.baslik": "Sudden traffic drop",
    "aa.motor.trafik_dus.aciklama": "Traffic in the last hour is {yuzde}% below normal (z={z}).",
    "aa.motor.trafik_dus.oneri": "Verify the widget integration or site availability.",
    "aa.motor.bot_orani.baslik": "Bot ratio surge",
    "aa.motor.bot_orani.aciklama": "Bot ratio rose {a}% → {b}%.",
    "aa.motor.bot_orani.oneri": "A new bot wave may have started; consider an aggressive rule or challenge mode.",
    "aa.motor.cografya.baslik": "Sudden concentration from {ulke}",
    "aa.motor.cografya.aciklama": "{a}% of last-hour requests originate from {ulke} (normally {b}%).",
    "aa.motor.cografya.oneri": "Consider a geo rule or extra verification for {ulke}.",
    "aa.motor.ai_ajan.baslik": "AI agent scanning intensified",
    "aa.motor.ai_ajan.aciklama": "AI agent traffic rose {a}% → {b}%.",
    "aa.motor.ai_ajan.oneri": "Review policies in AI Agent Intelligence; block training bots.",
    "aa.motor.skor_dusus.baslik": "Average humanity score dropped",
    "aa.motor.skor_dusus.aciklama": "Avg. score {a} → {b} (more automation).",
    "aa.motor.skor_dusus.oneri": "Consider raising the behavior threshold or tightening invisible mode.",
  },

  de: {
    "aa.serit.baslik": "Echtzeit-Anomaliekonsole.",
    "aa.serit.aciklama":
      "Eingehender Traffic wird live überwacht; plötzliche Ratenspitzen, neue Geografie/ASN, steigender Bot-Anteil und Score-Einbrüche werden mit ihrem Schweregrad markiert, sobald sie auftreten. Eine kontinuierlich fließende NOC/SOC-Ansicht, tiefer als die Batch-Erkennung.",

    "aa.komuta.baslik": "Anomalie-Stream-Konsole",
    "aa.canli": "live",
    "aa.duraklatildi": "pausiert",
    "aa.duraklat": "Pause",
    "aa.devamEt": "Fortsetzen",
    "aa.tehditSeviyesi": "Bedrohungsstufe",
    "aa.olayHizi": "Ereignisrate",
    "aa.sicrama": "Spitze",
    "aa.olaySn": "Ereignisse/s",
    "aa.botHizi": "Bot-Rate",
    "aa.botSn": "Bots/s",
    "aa.botOrani": "Bot-Anteil {n}%",
    "aa.taban": "Basis ~{n}/s",
    "aa.buOturum": "Diese Sitzung",
    "aa.anomali": "Anomalien",
    "aa.izlendi": "{olay} Ereignisse · {bot} Bots beobachtet",

    "aa.seviye.kritik": "Kritisch",
    "aa.seviye.yuksek": "Hoch",
    "aa.seviye.orta": "Mittel",
    "aa.seviye.dusuk": "Niedrig",

    "aa.kart.akistaAnomali": "Anomalien im Stream",
    "aa.kart.canliTehdit": "Live-Bedrohungsscore",
    "aa.kart.anlikBot": "Aktueller Bot-Anteil",
    "aa.kart.izlenenOlay": "Beobachtete Ereignisse (Seed)",

    "aa.panel.canliAkis": "Live-Anomalie-Stream",
    "aa.izleniyor": "wird überwacht",
    "aa.bos.baslik": "Stream sauber — keine Anomalien.",
    "aa.bos.aciklama": "Traffic wird überwacht. Sobald eine Abweichung auftritt, erscheint sie hier.",

    "aa.panel.turDagilim": "Verteilung der Anomalietypen",
    "aa.turYok": "Noch keine Anomalietypen.",
    "aa.panel.hizliEylemler": "Schnellaktionen",
    "aa.hizli.aciklama": "Auf die Anomalie reagieren: Regel vorschlagen, Schwierigkeit erhöhen oder Quelle prüfen.",
    "aa.eylem.kuralAd": "Regelvorschläge",
    "aa.eylem.kuralDesc": "KI-gestützte Regelvorschläge",
    "aa.eylem.zorlukAd": "Adaptive Schwierigkeit",
    "aa.eylem.zorlukDesc": "Challenge-Strenge erhöhen",
    "aa.eylem.tehditAd": "Bedrohungsdaten",
    "aa.eylem.tehditDesc": "Angreifer-IPs prüfen",
    "aa.dipnot": "Diese Konsole führt die Batch-Anomalie-Engine (mit {n} Ereignissen initialisiert) kontinuierlich über den Live-Stream aus. Dieselbe Anomalie wird innerhalb von 90 s nicht erneut gelistet (Rauschunterdrückung).",

    "aa.siddet.kritik": "Kritisch",
    "aa.siddet.yuksek": "Hoch",
    "aa.siddet.orta": "Mittel",
    "aa.siddet.dusuk": "Niedrig",

    "aa.tur.trafik_artis": "Traffic-Spitze",
    "aa.tur.trafik_dus": "Traffic-Einbruch",
    "aa.tur.bot_orani": "Bot-Anteil",
    "aa.tur.cografya": "Geografie-Verschiebung",
    "aa.tur.skor_dusus": "Score-Einbruch",
    "aa.tur.ai_ajan": "KI-Agent",
    "aa.tur.yeni_asn": "Neue ASN",

    "aa.satirEylem.tehdit": "Bedrohungsdaten",
    "aa.satirEylem.zorluk": "Adaptive Schwierigkeit",
    "aa.satirEylem.kural": "Regelvorschläge",

    "aa.motor.trafik_artis.baslik": "Plötzliche Traffic-Spitze",
    "aa.motor.trafik_artis.aciklama": "{istek} Anfragen in der letzten Stunde — {kat}× über normal (z={z}).",
    "aa.motor.trafik_artis.oneri": "Möglicherweise eine koordinierte Kampagne; Bedrohungsdaten und Regel-Engine prüfen.",
    "aa.motor.trafik_dus.baslik": "Plötzlicher Traffic-Einbruch",
    "aa.motor.trafik_dus.aciklama": "Traffic in der letzten Stunde liegt {yuzde}% unter normal (z={z}).",
    "aa.motor.trafik_dus.oneri": "Widget-Integration oder Website-Verfügbarkeit überprüfen.",
    "aa.motor.bot_orani.baslik": "Anstieg des Bot-Anteils",
    "aa.motor.bot_orani.aciklama": "Bot-Anteil stieg von {a}% auf {b}%.",
    "aa.motor.bot_orani.oneri": "Eine neue Bot-Welle könnte begonnen haben; aggressive Regel oder Challenge-Modus erwägen.",
    "aa.motor.cografya.baslik": "Plötzliche Konzentration aus {ulke}",
    "aa.motor.cografya.aciklama": "{a}% der Anfragen der letzten Stunde stammen aus {ulke} (normalerweise {b}%).",
    "aa.motor.cografya.oneri": "Geo-Regel oder zusätzliche Verifizierung für {ulke} erwägen.",
    "aa.motor.ai_ajan.baslik": "KI-Agent-Scanning verstärkt",
    "aa.motor.ai_ajan.aciklama": "KI-Agent-Traffic stieg von {a}% auf {b}%.",
    "aa.motor.ai_ajan.oneri": "Richtlinien in KI-Agent-Daten prüfen; Trainingsbots blockieren.",
    "aa.motor.skor_dusus.baslik": "Durchschnittlicher Menschlichkeits-Score gesunken",
    "aa.motor.skor_dusus.aciklama": "Durchschn. Score {a} → {b} (mehr Automatisierung).",
    "aa.motor.skor_dusus.oneri": "Verhaltensschwelle erhöhen oder unsichtbaren Modus verschärfen.",
  },

  fr: {
    "aa.serit.baslik": "Console d'anomalies en temps réel.",
    "aa.serit.aciklama":
      "Le trafic entrant est surveillé en direct ; les pics de débit soudains, les nouvelles géographies/ASN, la hausse du taux de bots et les chutes de score sont signalés avec leur gravité dès leur apparition. Une vue NOC/SOC en flux continu, plus fine que la détection par lots.",

    "aa.komuta.baslik": "Console de flux d'anomalies",
    "aa.canli": "en direct",
    "aa.duraklatildi": "en pause",
    "aa.duraklat": "Pause",
    "aa.devamEt": "Reprendre",
    "aa.tehditSeviyesi": "Niveau de menace",
    "aa.olayHizi": "Débit d'événements",
    "aa.sicrama": "Pic",
    "aa.olaySn": "évén./s",
    "aa.botHizi": "Débit de bots",
    "aa.botSn": "bots/s",
    "aa.botOrani": "taux de bots {n}%",
    "aa.taban": "référence ~{n}/s",
    "aa.buOturum": "Cette session",
    "aa.anomali": "anomalies",
    "aa.izlendi": "{olay} événements · {bot} bots observés",

    "aa.seviye.kritik": "Critique",
    "aa.seviye.yuksek": "Élevé",
    "aa.seviye.orta": "Moyen",
    "aa.seviye.dusuk": "Faible",

    "aa.kart.akistaAnomali": "Anomalies dans le flux",
    "aa.kart.canliTehdit": "Score de menace en direct",
    "aa.kart.anlikBot": "Taux de bots actuel",
    "aa.kart.izlenenOlay": "Événements observés (amorce)",

    "aa.panel.canliAkis": "Flux d'anomalies en direct",
    "aa.izleniyor": "surveillance",
    "aa.bos.baslik": "Flux propre — aucune anomalie.",
    "aa.bos.aciklama": "Le trafic est surveillé. Dès qu'un écart apparaît, il s'affiche ici.",

    "aa.panel.turDagilim": "Répartition des types d'anomalies",
    "aa.turYok": "Aucun type d'anomalie pour l'instant.",
    "aa.panel.hizliEylemler": "Actions rapides",
    "aa.hizli.aciklama": "Réagir à l'anomalie : proposer une règle, augmenter la difficulté ou inspecter la source.",
    "aa.eylem.kuralAd": "Suggestions de règles",
    "aa.eylem.kuralDesc": "Propositions de règles assistées par IA",
    "aa.eylem.zorlukAd": "Difficulté adaptative",
    "aa.eylem.zorlukDesc": "Renforcer la rigueur des défis",
    "aa.eylem.tehditAd": "Renseignement sur les menaces",
    "aa.eylem.tehditDesc": "Inspecter les IP attaquantes",
    "aa.dipnot": "Cette console réexécute en continu le moteur d'anomalies par lots (amorcé avec {n} événements) sur le flux en direct. La même anomalie n'est pas relistée sous 90 s (suppression du bruit).",

    "aa.siddet.kritik": "Critique",
    "aa.siddet.yuksek": "Élevé",
    "aa.siddet.orta": "Moyen",
    "aa.siddet.dusuk": "Faible",

    "aa.tur.trafik_artis": "Pic de trafic",
    "aa.tur.trafik_dus": "Chute de trafic",
    "aa.tur.bot_orani": "Taux de bots",
    "aa.tur.cografya": "Décalage géographique",
    "aa.tur.skor_dusus": "Chute de score",
    "aa.tur.ai_ajan": "Agent IA",
    "aa.tur.yeni_asn": "Nouvel ASN",

    "aa.satirEylem.tehdit": "Renseignement sur les menaces",
    "aa.satirEylem.zorluk": "Difficulté adaptative",
    "aa.satirEylem.kural": "Suggestions de règles",

    "aa.motor.trafik_artis.baslik": "Pic de trafic soudain",
    "aa.motor.trafik_artis.aciklama": "{istek} requêtes sur la dernière heure — {kat}× au-dessus de la normale (z={z}).",
    "aa.motor.trafik_artis.oneri": "Peut être une campagne coordonnée ; vérifiez le Renseignement sur les menaces et le moteur de règles.",
    "aa.motor.trafik_dus.baslik": "Chute de trafic soudaine",
    "aa.motor.trafik_dus.aciklama": "Le trafic de la dernière heure est {yuzde}% sous la normale (z={z}).",
    "aa.motor.trafik_dus.oneri": "Vérifiez l'intégration du widget ou la disponibilité du site.",
    "aa.motor.bot_orani.baslik": "Poussée du taux de bots",
    "aa.motor.bot_orani.aciklama": "Le taux de bots est passé de {a}% à {b}%.",
    "aa.motor.bot_orani.oneri": "Une nouvelle vague de bots a peut-être commencé ; envisagez une règle agressive ou le mode défi.",
    "aa.motor.cografya.baslik": "Concentration soudaine depuis {ulke}",
    "aa.motor.cografya.aciklama": "{a}% des requêtes de la dernière heure proviennent de {ulke} (normalement {b}%).",
    "aa.motor.cografya.oneri": "Envisagez une règle géo ou une vérification supplémentaire pour {ulke}.",
    "aa.motor.ai_ajan.baslik": "Le balayage par agents IA s'est intensifié",
    "aa.motor.ai_ajan.aciklama": "Le trafic d'agents IA est passé de {a}% à {b}%.",
    "aa.motor.ai_ajan.oneri": "Revoyez les politiques dans Renseignement Agent IA ; bloquez les bots d'entraînement.",
    "aa.motor.skor_dusus.baslik": "Le score d'humanité moyen a chuté",
    "aa.motor.skor_dusus.aciklama": "Score moyen {a} → {b} (plus d'automatisation).",
    "aa.motor.skor_dusus.oneri": "Envisagez d'augmenter le seuil comportemental ou de renforcer le mode invisible.",
  },

  es: {
    "aa.serit.baslik": "Consola de anomalías en tiempo real.",
    "aa.serit.aciklama":
      "El tráfico entrante se vigila en vivo; los picos repentinos de tasa, la nueva geografía/ASN, el aumento del ratio de bots y las caídas de puntuación se marcan con su gravedad en cuanto aparecen. Una vista NOC/SOC en flujo continuo, más profunda que la detección por lotes.",

    "aa.komuta.baslik": "Consola de flujo de anomalías",
    "aa.canli": "en vivo",
    "aa.duraklatildi": "en pausa",
    "aa.duraklat": "Pausar",
    "aa.devamEt": "Reanudar",
    "aa.tehditSeviyesi": "Nivel de amenaza",
    "aa.olayHizi": "Tasa de eventos",
    "aa.sicrama": "Pico",
    "aa.olaySn": "eventos/s",
    "aa.botHizi": "Tasa de bots",
    "aa.botSn": "bots/s",
    "aa.botOrani": "ratio de bots {n}%",
    "aa.taban": "base ~{n}/s",
    "aa.buOturum": "Esta sesión",
    "aa.anomali": "anomalías",
    "aa.izlendi": "{olay} eventos · {bot} bots observados",

    "aa.seviye.kritik": "Crítico",
    "aa.seviye.yuksek": "Alto",
    "aa.seviye.orta": "Medio",
    "aa.seviye.dusuk": "Bajo",

    "aa.kart.akistaAnomali": "Anomalías en el flujo",
    "aa.kart.canliTehdit": "Puntuación de amenaza en vivo",
    "aa.kart.anlikBot": "Ratio de bots actual",
    "aa.kart.izlenenOlay": "Eventos observados (semilla)",

    "aa.panel.canliAkis": "Flujo de anomalías en vivo",
    "aa.izleniyor": "vigilando",
    "aa.bos.baslik": "Flujo limpio — sin anomalías.",
    "aa.bos.aciklama": "El tráfico se está vigilando. En cuanto aparezca una desviación, se mostrará aquí.",

    "aa.panel.turDagilim": "Distribución de tipos de anomalía",
    "aa.turYok": "Aún no hay tipos de anomalía.",
    "aa.panel.hizliEylemler": "Acciones rápidas",
    "aa.hizli.aciklama": "Responde a la anomalía: propón una regla, aumenta la dificultad o inspecciona la fuente.",
    "aa.eylem.kuralAd": "Sugerencias de reglas",
    "aa.eylem.kuralDesc": "Propuestas de reglas asistidas por IA",
    "aa.eylem.zorlukAd": "Dificultad adaptativa",
    "aa.eylem.zorlukDesc": "Endurecer el rigor de los retos",
    "aa.eylem.tehditAd": "Inteligencia de amenazas",
    "aa.eylem.tehditDesc": "Inspeccionar IP atacantes",
    "aa.dipnot": "Esta consola reejecuta continuamente el motor de anomalías por lotes (sembrado con {n} eventos) sobre el flujo en vivo. La misma anomalía no se vuelve a listar en 90 s (supresión de ruido).",

    "aa.siddet.kritik": "Crítico",
    "aa.siddet.yuksek": "Alto",
    "aa.siddet.orta": "Medio",
    "aa.siddet.dusuk": "Bajo",

    "aa.tur.trafik_artis": "Pico de tráfico",
    "aa.tur.trafik_dus": "Caída de tráfico",
    "aa.tur.bot_orani": "Ratio de bots",
    "aa.tur.cografya": "Cambio geográfico",
    "aa.tur.skor_dusus": "Caída de puntuación",
    "aa.tur.ai_ajan": "Agente IA",
    "aa.tur.yeni_asn": "Nuevo ASN",

    "aa.satirEylem.tehdit": "Inteligencia de amenazas",
    "aa.satirEylem.zorluk": "Dificultad adaptativa",
    "aa.satirEylem.kural": "Sugerencias de reglas",

    "aa.motor.trafik_artis.baslik": "Pico de tráfico repentino",
    "aa.motor.trafik_artis.aciklama": "{istek} solicitudes en la última hora — {kat}× por encima de lo normal (z={z}).",
    "aa.motor.trafik_artis.oneri": "Podría ser una campaña coordinada; revisa Inteligencia de amenazas y el motor de reglas.",
    "aa.motor.trafik_dus.baslik": "Caída de tráfico repentina",
    "aa.motor.trafik_dus.aciklama": "El tráfico de la última hora está un {yuzde}% por debajo de lo normal (z={z}).",
    "aa.motor.trafik_dus.oneri": "Verifica la integración del widget o la disponibilidad del sitio.",
    "aa.motor.bot_orani.baslik": "Repunte del ratio de bots",
    "aa.motor.bot_orani.aciklama": "El ratio de bots subió del {a}% al {b}%.",
    "aa.motor.bot_orani.oneri": "Puede haber comenzado una nueva oleada de bots; considera una regla agresiva o el modo reto.",
    "aa.motor.cografya.baslik": "Concentración repentina desde {ulke}",
    "aa.motor.cografya.aciklama": "El {a}% de las solicitudes de la última hora proceden de {ulke} (normalmente {b}%).",
    "aa.motor.cografya.oneri": "Considera una regla geográfica o verificación adicional para {ulke}.",
    "aa.motor.ai_ajan.baslik": "El escaneo de agentes IA se intensificó",
    "aa.motor.ai_ajan.aciklama": "El tráfico de agentes IA subió del {a}% al {b}%.",
    "aa.motor.ai_ajan.oneri": "Revisa las políticas en Inteligencia de Agentes IA; bloquea los bots de entrenamiento.",
    "aa.motor.skor_dusus.baslik": "La puntuación media de humanidad cayó",
    "aa.motor.skor_dusus.aciklama": "Puntuación media {a} → {b} (más automatización).",
    "aa.motor.skor_dusus.oneri": "Considera subir el umbral de comportamiento o endurecer el modo invisible.",
  },
};

export function anomaliCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}

/** {token} yer tutucularını değerlerle doldurur (eksik/undefined token korunur). */
function doldur(sablon: string, degerler: Record<string, string | undefined>): string {
  return sablon.replace(/\{(\w+)\}/g, (_, k) => degerler[k] ?? `{${k}}`);
}

/**
 * Motor-metni yeniden türetme.
 * ---------------------------
 * Lib (`anomaliTespit`) her anomali için TÜRKÇE baslik/aciklama/oneri üretir;
 * içine sayı ve (cografya için) ülke kodu gömülüdür. Lib'e dokunmadan
 * çevirmek için: `tur` enum'una göre yerel şablonu seç, Türkçe kaynaktan
 * regex ile TOKEN'ları (sayı/yüzde/z/ülke) çıkar, yerel şablona yerleştir.
 *
 * Kaynak biçimleri (anomaly.ts):
 *   trafik_artis  → "Son saatte {istek} istek — normalin {kat}× üstünde (z={z})."
 *   trafik_dus    → "Son saatte trafik normalin %{yuzde} altında (z={z})."
 *   bot_orani     → "Bot oranı %{a} → %{b} yükseldi."
 *   cografya      → baslik: "{ulke} kaynaklı ani yoğunlaşma"
 *                   aciklama: "Son saatteki isteklerin %{a}'i {ulke} kaynaklı (normalde %{b})."
 *   ai_ajan       → "AI ajan trafiği %{a} → %{b} arttı."
 *   skor_dusus    → "Ort. skor {a} → {b} (daha çok otomasyon)."
 *
 * Herhangi bir biçim beklenmedikse (lib değişirse) TR kaynak metne düşülür —
 * asla boş/hatalı gösterim olmaz.
 */
export function anomaliMetin(
  a: { tur: string; baslik: string; aciklama: string; oneri: string | null },
  dil: Dil,
): { baslik: string; aciklama: string; oneri: string | null } {
  const t = (k: string) => anomaliCeviri(k, dil);
  // Türkçe kaynaktan tüm ondalık/tam sayıları sırayla topla.
  const sayilar = (s: string) => (s.match(/-?\d+(?:[.,]\d+)?/g) ?? []);
  // cografya: ülke kodu başlığın ilk kelimesidir ("TR kaynaklı ...").
  const ulkeEsle = a.baslik.match(/^(\S+)\s+kaynaklı/);
  const ulke = ulkeEsle?.[1] ?? "";

  try {
    switch (a.tur) {
      case "trafik_artis": {
        const [istek, kat, z] = sayilar(a.aciklama);
        return {
          baslik: t("aa.motor.trafik_artis.baslik"),
          aciklama: doldur(t("aa.motor.trafik_artis.aciklama"), { istek, kat, z }),
          oneri: t("aa.motor.trafik_artis.oneri"),
        };
      }
      case "trafik_dus": {
        const [yuzde, z] = sayilar(a.aciklama);
        return {
          baslik: t("aa.motor.trafik_dus.baslik"),
          aciklama: doldur(t("aa.motor.trafik_dus.aciklama"), { yuzde, z }),
          oneri: t("aa.motor.trafik_dus.oneri"),
        };
      }
      case "bot_orani": {
        const [av, bv] = sayilar(a.aciklama);
        return {
          baslik: t("aa.motor.bot_orani.baslik"),
          aciklama: doldur(t("aa.motor.bot_orani.aciklama"), { a: av, b: bv }),
          oneri: t("aa.motor.bot_orani.oneri"),
        };
      }
      case "cografya": {
        const [av, bv] = sayilar(a.aciklama);
        return {
          baslik: doldur(t("aa.motor.cografya.baslik"), { ulke }),
          aciklama: doldur(t("aa.motor.cografya.aciklama"), { a: av, b: bv, ulke }),
          oneri: doldur(t("aa.motor.cografya.oneri"), { ulke }),
        };
      }
      case "ai_ajan": {
        const [av, bv] = sayilar(a.aciklama);
        return {
          baslik: t("aa.motor.ai_ajan.baslik"),
          aciklama: doldur(t("aa.motor.ai_ajan.aciklama"), { a: av, b: bv }),
          oneri: t("aa.motor.ai_ajan.oneri"),
        };
      }
      case "skor_dusus": {
        const [av, bv] = sayilar(a.aciklama);
        return {
          baslik: t("aa.motor.skor_dusus.baslik"),
          aciklama: doldur(t("aa.motor.skor_dusus.aciklama"), { a: av, b: bv }),
          oneri: t("aa.motor.skor_dusus.oneri"),
        };
      }
    }
  } catch {
    /* biçim beklenmedik — TR kaynağa düş */
  }
  // Bilinmeyen tür / beklenmedik biçim: motor kaynağını aynen göster.
  return { baslik: a.baslik, aciklama: a.aciklama, oneri: a.oneri };
}
