/**
 * ROI & Değer paneli — YEREL sayfa sözlüğü.
 * =========================================
 * Bu dosya YALNIZCA /panel/roi istemci bileşeninin kullanıcıya görünen KROM/ETİKET
 * metinlerini 5 dile taşır (tr/en/de/fr/es). Paylaşılan `@/lib/i18n/panel`
 * sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik & veri):
 *  - ₺ para birimi, birim maliyetler, engellenen sayıları, ROI çarpanı/yüzdesi VERİ'dir
 *    — çevrilmez; sayılar yerele-duyarlı Intl ile biçimlenir.
 *  - Bot sınıfı botClass ENUM değeridir — asla çevrilmez. Kalem ADI ("Kimlik doldurma")
 *    ve maliyet AÇIKLAMASI lib BIRIM_MALIYETLER'den gelir; burada botClass→anahtar
 *    eşlemesiyle yeniden türetilir (lib düzenlenmeden). Sınıflandırılmayan kalem
 *    botClass "diger" anahtarını kullanır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb kısa ad nav.roi'den; bu descriptive h1)
    "roi.baslik": "Yatırım Getirisi & Önlenen Maliyet",

    // Kahraman ROI kartı
    "roi.kahraman.ustbaslik": "Veylify'ın sana kazandırdığı",
    "roi.kahraman.altbaslik": "bu ay net kazanç · <b>{n}</b> bot engellendi",
    "roi.kahraman.roiCarpani": "ROI çarpanı",
    "roi.kahraman.yillik": "yıllık projeksiyon",
    "roi.kahraman.geriOdeme": "Geri ödeme",
    "roi.kahraman.gun": "gün",
    "roi.kahraman.getiriYuzde": "net getiri",

    // Önce/sonra karşılaştırma akışı
    "roi.karsilastir.baslik": "Veylify olmasa vs Veylify ile",
    "roi.karsilastir.olmasa": "Veylify olmasa",
    "roi.karsilastir.olmasa.alt": "bu ay üstlenilecek bot maliyeti",
    "roi.karsilastir.botAkin": "bot bu maliyeti üretirdi",
    "roi.karsilastir.ucret": "Veylify ücreti",
    "roi.karsilastir.ucret.alt": "{plan} · aylık sabit",
    "roi.karsilastir.sabitMaliyet": "hacimden bağımsız sabit gider",
    "roi.karsilastir.netKazanc": "net kazanç",
    "roi.karsilastir.net": "Net kazanç",
    "roi.karsilastir.net.alt": "cebinde kalan (aylık)",
    "roi.karsilastir.getiri": "getiri",

    // Maliyet kırılımı donut
    "roi.donut.baslik": "Önlenen maliyet · saldırı türüne göre",
    "roi.donut.merkez": "₺ önlenen",
    "roi.donut.aciklama": "Toplam önlenen maliyetin saldırı sınıfları arasındaki dağılımı — en pahalı tehdidi bir bakışta gösterir.",

    // Özet kartlar
    "roi.kpi.onlenen": "Önlenen maliyet (aylık)",
    "roi.kpi.engellenen": "Engellenen bot",
    "roi.kpi.ucret": "Veylify ücreti · {plan}",
    "roi.kpi.ortDeger": "Engel başına değer",

    // Kalem dökümü + trend
    "roi.dokum.baslik": "Önlenen maliyet dökümü",
    "roi.dokum.rapor": "ROI raporu",
    "roi.dokum.bos": "Henüz engellenen bot yok.",
    "roi.trend.baslik": "Önlenen maliyet trendi (30 gün)",
    "roi.trend.toplam": "30g toplam önlenen:",
    "roi.trend.tasarruf": "her engellenen bot = tasarruf",

    // Karşılaştırma bandı
    "roi.kar.olmadan": "Veylify olmadan",
    "roi.kar.olmadan.alt": "aylık bot maliyeti",
    "roi.kar.ucret": "Veylify ücreti",
    "roi.kar.ucret.alt": "aylık",
    "roi.kar.net": "Net kazanç",
    "roi.kar.net.alt": "aylık",

    // Yöntem notu
    "roi.not":
      "Birim maliyetler sektör-temsili tahminlerdir (kimlik doldurma ₺4.2, DDoS ₺2.6, AI ajan ₺1.4, kazıyıcı ₺0.9/olay…) — kamuya açık bot-maliyet çalışmalarından modellenmiştir. Bu bir <b>karar-destek</b> metriğidir, kesin muhasebe değildir. Gerçek değer sektörünüze ve içerik/işlem değerinize göre değişir.",

    // Toast + rapor
    "roi.toast.indi": "ROI raporu indirildi",
    "roi.rapor.baslik": "ZENTRY — ROI & ÖNLENEN MALİYET RAPORU",
    "roi.rapor.plan": "Plan",
    "roi.rapor.toplamBot": "Toplam engellenen bot",
    "roi.rapor.onlenen": "Önlenen maliyet (aylık)",
    "roi.rapor.ucret": "Veylify ücreti (aylık)",
    "roi.rapor.net": "Net kazanç (aylık)",
    "roi.rapor.roi": "ROI",
    "roi.rapor.ucretsiz": "∞ (ücretsiz plan)",
    "roi.rapor.yillik": "Yıllık net projeksiyon",
    "roi.rapor.dokum": "KALEM DÖKÜMÜ:",
    "roi.rapor.notSatir": "NOT: Birim maliyetler sektör-temsili tahminlerdir; karar-destek metriğidir.",
    "roi.rapor.dosya": "specter-roi-raporu.txt",

    // Kalem ADI (lib BIRIM_MALIYETLER.ad — botClass→anahtar ile türetilir)
    "roi.kalem.credential_stuffing": "Kimlik doldurma",
    "roi.kalem.scraper": "Kazıyıcı",
    "roi.kalem.ddos": "DDoS",
    "roi.kalem.ai_agent": "AI ajan",
    "roi.kalem.spam": "Spam",
    "roi.kalem.automation": "Otomasyon",
    "roi.kalem.diger": "Diğer bot",

    // Kalem AÇIKLAMASI (lib BIRIM_MALIYETLER.aciklama)
    "roi.kalemAci.credential_stuffing": "Hesap ele geçirme, dolandırıcılık ve destek maliyeti.",
    "roi.kalemAci.scraper": "Bant genişliği, fiyat/içerik hırsızlığı, rakip istihbaratı.",
    "roi.kalemAci.ddos": "Altyapı ölçekleme, kesinti ve mitigasyon maliyeti.",
    "roi.kalemAci.ai_agent": "İzinsiz içerik toplama / model eğitimi değer kaybı.",
    "roi.kalemAci.spam": "Moderasyon, itibar ve teslimat maliyeti.",
    "roi.kalemAci.automation": "Kaynak tüketimi ve kötüye kullanım.",
    "roi.kalemAci.diger": "Sınıflandırılmamış engellenen otomasyon.",
  },

  en: {
    "roi.baslik": "Return on Investment & Prevented Cost",

    "roi.kahraman.ustbaslik": "What Veylify earned you",
    "roi.kahraman.altbaslik": "net gain this month · <b>{n}</b> bots blocked",
    "roi.kahraman.roiCarpani": "ROI multiple",
    "roi.kahraman.yillik": "annual projection",
    "roi.kahraman.geriOdeme": "Payback",
    "roi.kahraman.gun": "days",
    "roi.kahraman.getiriYuzde": "net return",

    "roi.karsilastir.baslik": "Without Veylify vs with Veylify",
    "roi.karsilastir.olmasa": "Without Veylify",
    "roi.karsilastir.olmasa.alt": "bot cost you'd absorb this month",
    "roi.karsilastir.botAkin": "bots would produce this cost",
    "roi.karsilastir.ucret": "Veylify fee",
    "roi.karsilastir.ucret.alt": "{plan} · fixed monthly",
    "roi.karsilastir.sabitMaliyet": "fixed cost, independent of volume",
    "roi.karsilastir.netKazanc": "net gain",
    "roi.karsilastir.net": "Net gain",
    "roi.karsilastir.net.alt": "kept in your pocket (monthly)",
    "roi.karsilastir.getiri": "return",

    "roi.donut.baslik": "Prevented cost · by attack type",
    "roi.donut.merkez": "₺ prevented",
    "roi.donut.aciklama": "How the total prevented cost splits across attack classes — shows the most expensive threat at a glance.",

    "roi.kpi.onlenen": "Prevented cost (monthly)",
    "roi.kpi.engellenen": "Bots blocked",
    "roi.kpi.ucret": "Veylify fee · {plan}",
    "roi.kpi.ortDeger": "Value per block",

    "roi.dokum.baslik": "Prevented-cost breakdown",
    "roi.dokum.rapor": "ROI report",
    "roi.dokum.bos": "No bots blocked yet.",
    "roi.trend.baslik": "Prevented-cost trend (30 days)",
    "roi.trend.toplam": "30d total prevented:",
    "roi.trend.tasarruf": "every blocked bot = savings",

    "roi.kar.olmadan": "Without Veylify",
    "roi.kar.olmadan.alt": "monthly bot cost",
    "roi.kar.ucret": "Veylify fee",
    "roi.kar.ucret.alt": "monthly",
    "roi.kar.net": "Net gain",
    "roi.kar.net.alt": "monthly",

    "roi.not":
      "Unit costs are industry-representative estimates (credential stuffing ₺4.2, DDoS ₺2.6, AI agent ₺1.4, scraper ₺0.9/event…) — modeled from public bot-cost studies. This is a <b>decision-support</b> metric, not exact accounting. The real value varies with your industry and your content/transaction value.",

    "roi.toast.indi": "ROI report downloaded",
    "roi.rapor.baslik": "ZENTRY — ROI & PREVENTED-COST REPORT",
    "roi.rapor.plan": "Plan",
    "roi.rapor.toplamBot": "Total bots blocked",
    "roi.rapor.onlenen": "Prevented cost (monthly)",
    "roi.rapor.ucret": "Veylify fee (monthly)",
    "roi.rapor.net": "Net gain (monthly)",
    "roi.rapor.roi": "ROI",
    "roi.rapor.ucretsiz": "∞ (free plan)",
    "roi.rapor.yillik": "Annual net projection",
    "roi.rapor.dokum": "LINE-ITEM BREAKDOWN:",
    "roi.rapor.notSatir": "NOTE: Unit costs are industry-representative estimates; a decision-support metric.",
    "roi.rapor.dosya": "specter-roi-report.txt",

    "roi.kalem.credential_stuffing": "Credential stuffing",
    "roi.kalem.scraper": "Scraper",
    "roi.kalem.ddos": "DDoS",
    "roi.kalem.ai_agent": "AI agent",
    "roi.kalem.spam": "Spam",
    "roi.kalem.automation": "Automation",
    "roi.kalem.diger": "Other bot",

    "roi.kalemAci.credential_stuffing": "Account takeover, fraud and support cost.",
    "roi.kalemAci.scraper": "Bandwidth, price/content theft, competitor intelligence.",
    "roi.kalemAci.ddos": "Infrastructure scaling, downtime and mitigation cost.",
    "roi.kalemAci.ai_agent": "Unauthorized content harvesting / model-training value loss.",
    "roi.kalemAci.spam": "Moderation, reputation and deliverability cost.",
    "roi.kalemAci.automation": "Resource consumption and abuse.",
    "roi.kalemAci.diger": "Unclassified blocked automation.",
  },

  de: {
    "roi.baslik": "Kapitalrendite & verhinderte Kosten",

    "roi.kahraman.ustbaslik": "Was Veylify Ihnen eingebracht hat",
    "roi.kahraman.altbaslik": "Nettogewinn diesen Monat · <b>{n}</b> Bots blockiert",
    "roi.kahraman.roiCarpani": "ROI-Faktor",
    "roi.kahraman.yillik": "Jahresprojektion",
    "roi.kahraman.geriOdeme": "Amortisation",
    "roi.kahraman.gun": "Tage",
    "roi.kahraman.getiriYuzde": "Nettorendite",

    "roi.karsilastir.baslik": "Ohne Veylify vs mit Veylify",
    "roi.karsilastir.olmasa": "Ohne Veylify",
    "roi.karsilastir.olmasa.alt": "Bot-Kosten, die Sie diesen Monat tragen würden",
    "roi.karsilastir.botAkin": "Bots würden diese Kosten erzeugen",
    "roi.karsilastir.ucret": "Veylify-Gebühr",
    "roi.karsilastir.ucret.alt": "{plan} · monatlich fix",
    "roi.karsilastir.sabitMaliyet": "Fixkosten, unabhängig vom Volumen",
    "roi.karsilastir.netKazanc": "Nettogewinn",
    "roi.karsilastir.net": "Nettogewinn",
    "roi.karsilastir.net.alt": "was Ihnen bleibt (monatlich)",
    "roi.karsilastir.getiri": "Rendite",

    "roi.donut.baslik": "Verhinderte Kosten · nach Angriffstyp",
    "roi.donut.merkez": "₺ verhindert",
    "roi.donut.aciklama": "Wie sich die verhinderten Gesamtkosten auf die Angriffsklassen verteilen — zeigt die teuerste Bedrohung auf einen Blick.",

    "roi.kpi.onlenen": "Verhinderte Kosten (monatlich)",
    "roi.kpi.engellenen": "Blockierte Bots",
    "roi.kpi.ucret": "Veylify-Gebühr · {plan}",
    "roi.kpi.ortDeger": "Wert pro Blockierung",

    "roi.dokum.baslik": "Aufschlüsselung der verhinderten Kosten",
    "roi.dokum.rapor": "ROI-Bericht",
    "roi.dokum.bos": "Noch keine Bots blockiert.",
    "roi.trend.baslik": "Trend der verhinderten Kosten (30 Tage)",
    "roi.trend.toplam": "30 T. gesamt verhindert:",
    "roi.trend.tasarruf": "jeder blockierte Bot = Ersparnis",

    "roi.kar.olmadan": "Ohne Veylify",
    "roi.kar.olmadan.alt": "monatliche Bot-Kosten",
    "roi.kar.ucret": "Veylify-Gebühr",
    "roi.kar.ucret.alt": "monatlich",
    "roi.kar.net": "Nettogewinn",
    "roi.kar.net.alt": "monatlich",

    "roi.not":
      "Stückkosten sind branchenrepräsentative Schätzungen (Credential Stuffing ₺4,2, DDoS ₺2,6, KI-Agent ₺1,4, Scraper ₺0,9/Ereignis…) — modelliert aus öffentlichen Bot-Kosten-Studien. Dies ist eine <b>Entscheidungshilfe</b>-Metrik, keine exakte Buchhaltung. Der reale Wert variiert je nach Branche und Ihrem Inhalts-/Transaktionswert.",

    "roi.toast.indi": "ROI-Bericht heruntergeladen",
    "roi.rapor.baslik": "ZENTRY — ROI- & VERHINDERTE-KOSTEN-BERICHT",
    "roi.rapor.plan": "Plan",
    "roi.rapor.toplamBot": "Blockierte Bots gesamt",
    "roi.rapor.onlenen": "Verhinderte Kosten (monatlich)",
    "roi.rapor.ucret": "Veylify-Gebühr (monatlich)",
    "roi.rapor.net": "Nettogewinn (monatlich)",
    "roi.rapor.roi": "ROI",
    "roi.rapor.ucretsiz": "∞ (kostenloser Plan)",
    "roi.rapor.yillik": "Jährliche Nettoprojektion",
    "roi.rapor.dokum": "POSTEN-AUFSCHLÜSSELUNG:",
    "roi.rapor.notSatir": "HINWEIS: Stückkosten sind branchenrepräsentative Schätzungen; eine Entscheidungshilfe-Metrik.",
    "roi.rapor.dosya": "specter-roi-bericht.txt",

    "roi.kalem.credential_stuffing": "Credential Stuffing",
    "roi.kalem.scraper": "Scraper",
    "roi.kalem.ddos": "DDoS",
    "roi.kalem.ai_agent": "KI-Agent",
    "roi.kalem.spam": "Spam",
    "roi.kalem.automation": "Automatisierung",
    "roi.kalem.diger": "Anderer Bot",

    "roi.kalemAci.credential_stuffing": "Kontoübernahme, Betrug und Supportkosten.",
    "roi.kalemAci.scraper": "Bandbreite, Preis-/Inhaltsdiebstahl, Wettbewerbsaufklärung.",
    "roi.kalemAci.ddos": "Infrastrukturskalierung, Ausfall- und Mitigationskosten.",
    "roi.kalemAci.ai_agent": "Unbefugte Inhaltserfassung / Modelltrainings-Wertverlust.",
    "roi.kalemAci.spam": "Moderations-, Reputations- und Zustellkosten.",
    "roi.kalemAci.automation": "Ressourcenverbrauch und Missbrauch.",
    "roi.kalemAci.diger": "Nicht klassifizierte blockierte Automatisierung.",
  },

  fr: {
    "roi.baslik": "Retour sur investissement et coût évité",

    "roi.kahraman.ustbaslik": "Ce que Veylify vous a rapporté",
    "roi.kahraman.altbaslik": "gain net ce mois-ci · <b>{n}</b> bots bloqués",
    "roi.kahraman.roiCarpani": "Multiple de ROI",
    "roi.kahraman.yillik": "projection annuelle",
    "roi.kahraman.geriOdeme": "Amortissement",
    "roi.kahraman.gun": "jours",
    "roi.kahraman.getiriYuzde": "rendement net",

    "roi.karsilastir.baslik": "Sans Veylify vs avec Veylify",
    "roi.karsilastir.olmasa": "Sans Veylify",
    "roi.karsilastir.olmasa.alt": "coût des bots que vous absorberiez ce mois-ci",
    "roi.karsilastir.botAkin": "bots produiraient ce coût",
    "roi.karsilastir.ucret": "Frais Veylify",
    "roi.karsilastir.ucret.alt": "{plan} · fixe mensuel",
    "roi.karsilastir.sabitMaliyet": "coût fixe, indépendant du volume",
    "roi.karsilastir.netKazanc": "gain net",
    "roi.karsilastir.net": "Gain net",
    "roi.karsilastir.net.alt": "ce qu'il vous reste (mensuel)",
    "roi.karsilastir.getiri": "rendement",

    "roi.donut.baslik": "Coût évité · par type d'attaque",
    "roi.donut.merkez": "₺ évité",
    "roi.donut.aciklama": "Répartition du coût total évité entre les classes d'attaque — montre la menace la plus coûteuse en un coup d'œil.",

    "roi.kpi.onlenen": "Coût évité (mensuel)",
    "roi.kpi.engellenen": "Bots bloqués",
    "roi.kpi.ucret": "Frais Veylify · {plan}",
    "roi.kpi.ortDeger": "Valeur par blocage",

    "roi.dokum.baslik": "Détail du coût évité",
    "roi.dokum.rapor": "Rapport ROI",
    "roi.dokum.bos": "Aucun bot bloqué pour l'instant.",
    "roi.trend.baslik": "Tendance du coût évité (30 jours)",
    "roi.trend.toplam": "Total évité sur 30 j :",
    "roi.trend.tasarruf": "chaque bot bloqué = économie",

    "roi.kar.olmadan": "Sans Veylify",
    "roi.kar.olmadan.alt": "coût mensuel des bots",
    "roi.kar.ucret": "Frais Veylify",
    "roi.kar.ucret.alt": "mensuel",
    "roi.kar.net": "Gain net",
    "roi.kar.net.alt": "mensuel",

    "roi.not":
      "Les coûts unitaires sont des estimations représentatives du secteur (credential stuffing ₺4,2, DDoS ₺2,6, agent IA ₺1,4, scraper ₺0,9/événement…) — modélisés à partir d'études publiques sur le coût des bots. Il s'agit d'une métrique d'<b>aide à la décision</b>, pas d'une comptabilité exacte. La valeur réelle varie selon votre secteur et la valeur de votre contenu/transaction.",

    "roi.toast.indi": "Rapport ROI téléchargé",
    "roi.rapor.baslik": "ZENTRY — RAPPORT ROI & COÛT ÉVITÉ",
    "roi.rapor.plan": "Plan",
    "roi.rapor.toplamBot": "Total de bots bloqués",
    "roi.rapor.onlenen": "Coût évité (mensuel)",
    "roi.rapor.ucret": "Frais Veylify (mensuel)",
    "roi.rapor.net": "Gain net (mensuel)",
    "roi.rapor.roi": "ROI",
    "roi.rapor.ucretsiz": "∞ (forfait gratuit)",
    "roi.rapor.yillik": "Projection nette annuelle",
    "roi.rapor.dokum": "DÉTAIL DES POSTES :",
    "roi.rapor.notSatir": "NOTE : les coûts unitaires sont des estimations représentatives du secteur ; une métrique d'aide à la décision.",
    "roi.rapor.dosya": "specter-rapport-roi.txt",

    "roi.kalem.credential_stuffing": "Credential stuffing",
    "roi.kalem.scraper": "Scraper",
    "roi.kalem.ddos": "DDoS",
    "roi.kalem.ai_agent": "Agent IA",
    "roi.kalem.spam": "Spam",
    "roi.kalem.automation": "Automatisation",
    "roi.kalem.diger": "Autre bot",

    "roi.kalemAci.credential_stuffing": "Prise de contrôle de compte, fraude et coût de support.",
    "roi.kalemAci.scraper": "Bande passante, vol de prix/contenu, intelligence concurrentielle.",
    "roi.kalemAci.ddos": "Mise à l'échelle de l'infrastructure, interruption et coût d'atténuation.",
    "roi.kalemAci.ai_agent": "Collecte de contenu non autorisée / perte de valeur d'entraînement de modèle.",
    "roi.kalemAci.spam": "Coût de modération, de réputation et de délivrabilité.",
    "roi.kalemAci.automation": "Consommation de ressources et abus.",
    "roi.kalemAci.diger": "Automatisation bloquée non classée.",
  },

  es: {
    "roi.baslik": "Retorno de la inversión y costo evitado",

    "roi.kahraman.ustbaslik": "Lo que Veylify te ha generado",
    "roi.kahraman.altbaslik": "ganancia neta este mes · <b>{n}</b> bots bloqueados",
    "roi.kahraman.roiCarpani": "Múltiplo de ROI",
    "roi.kahraman.yillik": "proyección anual",
    "roi.kahraman.geriOdeme": "Amortización",
    "roi.kahraman.gun": "días",
    "roi.kahraman.getiriYuzde": "retorno neto",

    "roi.karsilastir.baslik": "Sin Veylify vs con Veylify",
    "roi.karsilastir.olmasa": "Sin Veylify",
    "roi.karsilastir.olmasa.alt": "costo de bots que absorberías este mes",
    "roi.karsilastir.botAkin": "bots producirían este costo",
    "roi.karsilastir.ucret": "Tarifa de Veylify",
    "roi.karsilastir.ucret.alt": "{plan} · fijo mensual",
    "roi.karsilastir.sabitMaliyet": "costo fijo, independiente del volumen",
    "roi.karsilastir.netKazanc": "ganancia neta",
    "roi.karsilastir.net": "Ganancia neta",
    "roi.karsilastir.net.alt": "lo que queda en tu bolsillo (mensual)",
    "roi.karsilastir.getiri": "retorno",

    "roi.donut.baslik": "Costo evitado · por tipo de ataque",
    "roi.donut.merkez": "₺ evitado",
    "roi.donut.aciklama": "Cómo se reparte el costo total evitado entre las clases de ataque — muestra la amenaza más costosa de un vistazo.",

    "roi.kpi.onlenen": "Costo evitado (mensual)",
    "roi.kpi.engellenen": "Bots bloqueados",
    "roi.kpi.ucret": "Tarifa de Veylify · {plan}",
    "roi.kpi.ortDeger": "Valor por bloqueo",

    "roi.dokum.baslik": "Desglose del costo evitado",
    "roi.dokum.rapor": "Informe de ROI",
    "roi.dokum.bos": "Aún no hay bots bloqueados.",
    "roi.trend.baslik": "Tendencia del costo evitado (30 días)",
    "roi.trend.toplam": "Total evitado en 30 d:",
    "roi.trend.tasarruf": "cada bot bloqueado = ahorro",

    "roi.kar.olmadan": "Sin Veylify",
    "roi.kar.olmadan.alt": "costo mensual de bots",
    "roi.kar.ucret": "Tarifa de Veylify",
    "roi.kar.ucret.alt": "mensual",
    "roi.kar.net": "Ganancia neta",
    "roi.kar.net.alt": "mensual",

    "roi.not":
      "Los costos unitarios son estimaciones representativas del sector (credential stuffing ₺4,2, DDoS ₺2,6, agente de IA ₺1,4, scraper ₺0,9/evento…) — modelados a partir de estudios públicos sobre el costo de los bots. Es una métrica de <b>apoyo a la decisión</b>, no una contabilidad exacta. El valor real varía según tu sector y el valor de tu contenido/transacción.",

    "roi.toast.indi": "Informe de ROI descargado",
    "roi.rapor.baslik": "ZENTRY — INFORME DE ROI Y COSTO EVITADO",
    "roi.rapor.plan": "Plan",
    "roi.rapor.toplamBot": "Total de bots bloqueados",
    "roi.rapor.onlenen": "Costo evitado (mensual)",
    "roi.rapor.ucret": "Tarifa de Veylify (mensual)",
    "roi.rapor.net": "Ganancia neta (mensual)",
    "roi.rapor.roi": "ROI",
    "roi.rapor.ucretsiz": "∞ (plan gratuito)",
    "roi.rapor.yillik": "Proyección neta anual",
    "roi.rapor.dokum": "DESGLOSE POR PARTIDA:",
    "roi.rapor.notSatir": "NOTA: los costos unitarios son estimaciones representativas del sector; una métrica de apoyo a la decisión.",
    "roi.rapor.dosya": "specter-informe-roi.txt",

    "roi.kalem.credential_stuffing": "Credential stuffing",
    "roi.kalem.scraper": "Scraper",
    "roi.kalem.ddos": "DDoS",
    "roi.kalem.ai_agent": "Agente de IA",
    "roi.kalem.spam": "Spam",
    "roi.kalem.automation": "Automatización",
    "roi.kalem.diger": "Otro bot",

    "roi.kalemAci.credential_stuffing": "Robo de cuenta, fraude y costo de soporte.",
    "roi.kalemAci.scraper": "Ancho de banda, robo de precios/contenido, inteligencia competitiva.",
    "roi.kalemAci.ddos": "Escalado de infraestructura, inactividad y costo de mitigación.",
    "roi.kalemAci.ai_agent": "Recolección de contenido no autorizada / pérdida de valor de entrenamiento de modelos.",
    "roi.kalemAci.spam": "Costo de moderación, reputación y entregabilidad.",
    "roi.kalemAci.automation": "Consumo de recursos y abuso.",
    "roi.kalemAci.diger": "Automatización bloqueada sin clasificar.",
  },
};

export function roiCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
