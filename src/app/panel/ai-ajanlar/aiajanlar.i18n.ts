/**
 * AI Ajan İstihbaratı paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/ai-ajanlar istemci bileşenlerinin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik):
 *  - Enum DEĞERLERİ ("izin"/"dogrula"/"engelle" politika, kategori anahtarları,
 *    risk anahtarları) hiçbir zaman çevrilmez — API'ye POST edilen ve
 *    filtrelemeyi süren değerler bunlardır.
 *  - Kategori/politika/risk ETİKETLERİ enum→anahtar eşlemesiyle çözülür:
 *    değer "model_egitimi" → t("ai.kat.model_egitimi"). Böylece görüntü çevrilir,
 *    mantık değişmez.
 *  - Ajan katalog verisi (GPTBot, ClaudeBot… ürün adı, operator, UA, robots
 *    token'ı, amac, aciklama, IP yayını, ilk yıl) VERİ'dir — çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb + PanelUst)
    "ai.baslik": "AI Ajan İstihbaratı",

    // Açıklama şeridi
    "ai.serit.baslik": "İnternet trafiğinin büyük kısmı artık AI ajanlarından geliyor.",
    "ai.serit.aciklama":
      "Veylify, sitenizi tarayan her AI botunu tanır ve nasıl davranacağınızı siz belirlersiniz — içeriğinizi eğitime kaptırmayın, sunucunuzu koruyun.",

    // Özet KPI etiketleri
    "ai.kpi.istek": "AI ajan isteği (30g)",
    "ai.kpi.tespit": "Tespit edilen ajan",
    "ai.kpi.engellenen": "Engellenen AI isteği",
    "ai.kpi.egitim": "Model eğitim taraması",

    // Boş durum (henüz AI trafiği yok)
    "ai.bos.baslik": "Henüz AI ajan trafiği tespit edilmedi",
    "ai.bos.aciklama":
      "Widget canlıya alınınca GPTBot, Claude, Perplexity gibi ajanların ziyaretleri burada belirir. Aşağıdaki katalogdan şimdiden politikanı ayarlayabilirsin — ilk ziyaret anında uygulanır.",
    "ai.bos.entegre": "Widget'ı entegre et",

    // Filtre barı
    "ai.filtre.araEtiket": "AI ajan ara",
    "ai.filtre.araYer": "Ajan veya operatör ara (GPTBot, Anthropic…)",
    "ai.filtre.eslesmeYok": "Bu filtreyle eşleşen ajan yok.",

    // Kategori etiketleri (enum → anahtar; VALUE çevrilmez)
    "ai.kat.hepsi": "Tümü",
    "ai.kat.model_egitimi": "Model eğitimi",
    "ai.kat.canli_getirme": "Canlı getirme",
    "ai.kat.arama_indeksi": "Arama indeksi",
    "ai.kat.ajan_tarayici": "Otonom ajan",
    "ai.kat.veri_kaziyici": "Veri kazıyıcı",

    // Politika etiketleri (enum → anahtar)
    "ai.pol.izin": "İzin",
    "ai.pol.dogrula": "Doğrula",
    "ai.pol.engelle": "Engelle",
    // Politika tam etiketi (Specter önerisi + toast)
    "ai.polTam.izin": "İzin ver",
    "ai.polTam.dogrula": "Doğrula",
    "ai.polTam.engelle": "Engelle",

    // Risk etiketleri (enum → anahtar) — "… risk" son eki UI'da eklenir
    "ai.risk.dusuk": "Düşük",
    "ai.risk.orta": "Orta",
    "ai.risk.yuksek": "Yüksek",
    "ai.risk.kritik": "Kritik",
    "ai.risk.sonEk": "risk",

    // Kart
    "ai.kart.robotsUyari": "robots.txt saygısı yok",
    "ai.kart.detayEtiket": "{urun} ajan detayı",
    "ai.kart.30gIstek": "30g istek",
    "ai.kart.engellenen": "Engellenen",
    "ai.kart.sonGorulme": "Son görülme",
    "ai.kart.politika": "Politika",

    // Yaş metni (son görülme)
    "ai.yas.gorulmedi": "Görülmedi",
    "ai.yas.dk": "{n}dk önce",
    "ai.yas.sa": "{n}s önce",
    "ai.yas.g": "{n}g önce",

    // Çekmece (drawer)
    "ai.drawer.kapat": "Kapat",
    "ai.drawer.korumaPolitikasi": "Koruma politikası",
    "ai.drawer.oneriOn": "Veylify önerisi:",
    "ai.drawer.trafik": "Trafik (son 30 gün)",
    "ai.drawer.toplamIstek": "Toplam istek",
    "ai.drawer.son7": "Son 7 gün",
    "ai.drawer.engellenen": "Engellenen",
    "ai.drawer.dogrulanan": "Doğrulanan",
    "ai.drawer.enYol": "En çok vurulan yol",
    "ai.drawer.imzaDogrulama": "İmza & doğrulama",
    "ai.drawer.userAgent": "User-Agent",
    "ai.drawer.robotsToken": "robots.txt token",
    "ai.drawer.kimlikDogrulama": "Kimlik doğrulama",
    "ai.drawer.dogRolIp": "Resmi IP aralığı",
    "ai.drawer.dogRolDns": "Reverse DNS",
    "ai.drawer.dogRolYok": "Yok (taklit riski)",
    "ai.drawer.robotsSaygi": "robots.txt'e saygı",
    "ai.drawer.robotsEvet": "Evet (ilan ediyor)",
    "ai.drawer.robotsHayir": "Hayır — yok sayabilir",
    "ai.drawer.ilkGorulme": "İlk görülme",
    "ai.drawer.ipYayin": "Resmi IP aralığı yayını",
    "ai.drawer.kuralAc": "Bu ajan için kural motorunu aç",

    // Toast
    "ai.toast.kaydedilemedi": "Politika kaydedilemedi",

    // KPI delta / alt etiket
    "ai.kpi.deltaIstek": "geçen 7 güne göre",
    "ai.kpi.deltaEngel": "engelleme oranı",
    "ai.kpi.altKatalog": "katalogda izlenen ajan",

    // Kategori dağılımı bölümü
    "ai.dagilim.baslik": "Kategoriye göre AI trafiği",
    "ai.dagilim.aciklama": "Son 30 günde sitenizi tarayan ajanlar amaçlarına göre gruplandı.",
    "ai.dagilim.bosluk": "Ajan trafiği görülünce dağılım burada canlanır.",

    // Risk kıyas bölümü
    "ai.risk.baslikBolum": "Ajan × risk ısı haritası",
    "ai.risk.aciklamaBolum": "En yoğun ajanların risk profili: koyu hücre daha yüksek maruziyet.",
    "ai.risk.sutunTrafik": "Trafik",
    "ai.risk.sutunEngel": "Engel",
    "ai.risk.sutunRisk": "Risk",
    "ai.risk.sutunRobots": "robots",
    "ai.risk.bosluk": "Isı haritası ilk ajan trafiğiyle dolar.",

    // Zaman serisi
    "ai.robots.baslik": "robots.txt oluştur — politikandan",
    "ai.robots.aciklama": "Panelde verdiğin izin/doğrula/engelle kararları anında gerçek bir robots.txt'e dönüşür. Kopyala, sitenin köküne koy. robots.txt naziktir; Veylify uymayan AI'ları AYRICA aktif engeller — iki katmanlı savunma.",
    "ai.robots.kopyala": "Kopyala",
    "ai.robots.kopyalandi": "robots.txt panoya kopyalandı",
    "ai.robots.kopyaHata": "Kopyalanamadı",
    "ai.robots.indirildi": "robots.txt indirildi",
    "ai.robots.canli": "canlı — politikayla güncellenir",
    "ai.robots.ozetIzin": "izin",
    "ai.robots.ozetDogrula": "doğrula",
    "ai.robots.ozetEngelle": "engelle",
    "ai.robots.not": "robots.txt yalnızca kurallara uyan AI'ları etkiler. Veylify, robots'u yok sayan botları verify/passive akışında gerçekten yakalar ve engeller.",
    "ai.seri.baslik": "AI trafiği zaman serisi",
    "ai.seri.aciklama": "Eğitim taraması ile canlı/arama getirmesinin son 14 günlük seyri.",
    "ai.seri.egitim": "Model eğitimi",
    "ai.seri.getirme": "Canlı & arama",

    // En agresif crawler'lar
    "ai.agresif.baslik": "En agresif 3 crawler",
    "ai.agresif.aciklama": "En çok istek üreten ajanlar — hızlı politika ayarı için öne çıkarıldı.",
    "ai.agresif.istek": "istek / 30g",
    "ai.agresif.bosluk": "Trafik biriktikçe en aktif ajanlar burada listelenir.",

    // Kart ek etiketler
    "ai.kart.trend7": "7g eğilim",
    "ai.kart.robotsSaygili": "robots.txt'e uyar",
    "ai.kart.robotsSaymaz": "robots.txt'i yok sayar",
    "ai.kart.riskSkor": "Risk skoru",
  },

  en: {
    "ai.baslik": "AI Agent Intelligence",

    "ai.serit.baslik": "The majority of internet traffic now comes from AI agents.",
    "ai.serit.aciklama":
      "Veylify recognizes every AI bot that crawls your site and lets you decide how it behaves — keep your content out of training sets and protect your server.",

    "ai.kpi.istek": "AI agent requests (30d)",
    "ai.kpi.tespit": "Detected agents",
    "ai.kpi.engellenen": "Blocked AI requests",
    "ai.kpi.egitim": "Model-training crawls",

    "ai.bos.baslik": "No AI agent traffic detected yet",
    "ai.bos.aciklama":
      "Once your widget goes live, visits from agents like GPTBot, Claude and Perplexity appear here. You can set your policy from the catalog below right now — it applies from their very first visit.",
    "ai.bos.entegre": "Integrate the widget",

    "ai.filtre.araEtiket": "Search AI agents",
    "ai.filtre.araYer": "Search agent or operator (GPTBot, Anthropic…)",
    "ai.filtre.eslesmeYok": "No agents match this filter.",

    "ai.kat.hepsi": "All",
    "ai.kat.model_egitimi": "Model training",
    "ai.kat.canli_getirme": "Live fetch",
    "ai.kat.arama_indeksi": "Search index",
    "ai.kat.ajan_tarayici": "Autonomous agent",
    "ai.kat.veri_kaziyici": "Data scraper",

    "ai.pol.izin": "Allow",
    "ai.pol.dogrula": "Challenge",
    "ai.pol.engelle": "Block",
    "ai.polTam.izin": "Allow",
    "ai.polTam.dogrula": "Challenge",
    "ai.polTam.engelle": "Block",

    "ai.risk.dusuk": "Low",
    "ai.risk.orta": "Medium",
    "ai.risk.yuksek": "High",
    "ai.risk.kritik": "Critical",
    "ai.risk.sonEk": "risk",

    "ai.kart.robotsUyari": "Does not respect robots.txt",
    "ai.kart.detayEtiket": "{urun} agent details",
    "ai.kart.30gIstek": "30d requests",
    "ai.kart.engellenen": "Blocked",
    "ai.kart.sonGorulme": "Last seen",
    "ai.kart.politika": "Policy",

    "ai.yas.gorulmedi": "Not seen",
    "ai.yas.dk": "{n}m ago",
    "ai.yas.sa": "{n}h ago",
    "ai.yas.g": "{n}d ago",

    "ai.drawer.kapat": "Close",
    "ai.drawer.korumaPolitikasi": "Protection policy",
    "ai.drawer.oneriOn": "Veylify recommends:",
    "ai.drawer.trafik": "Traffic (last 30 days)",
    "ai.drawer.toplamIstek": "Total requests",
    "ai.drawer.son7": "Last 7 days",
    "ai.drawer.engellenen": "Blocked",
    "ai.drawer.dogrulanan": "Challenged",
    "ai.drawer.enYol": "Most-hit path",
    "ai.drawer.imzaDogrulama": "Signature & verification",
    "ai.drawer.userAgent": "User-Agent",
    "ai.drawer.robotsToken": "robots.txt token",
    "ai.drawer.kimlikDogrulama": "Identity verification",
    "ai.drawer.dogRolIp": "Official IP range",
    "ai.drawer.dogRolDns": "Reverse DNS",
    "ai.drawer.dogRolYok": "None (spoofing risk)",
    "ai.drawer.robotsSaygi": "Respects robots.txt",
    "ai.drawer.robotsEvet": "Yes (declared)",
    "ai.drawer.robotsHayir": "No — may ignore it",
    "ai.drawer.ilkGorulme": "First seen",
    "ai.drawer.ipYayin": "Official IP range publication",
    "ai.drawer.kuralAc": "Open the rule engine for this agent",

    "ai.toast.kaydedilemedi": "Could not save policy",

    "ai.kpi.deltaIstek": "vs. previous 7 days",
    "ai.kpi.deltaEngel": "block rate",
    "ai.kpi.altKatalog": "agents tracked in catalog",

    "ai.dagilim.baslik": "AI traffic by category",
    "ai.dagilim.aciklama": "Agents that crawled your site in the last 30 days, grouped by intent.",
    "ai.dagilim.bosluk": "The distribution comes alive once agent traffic appears.",

    "ai.risk.baslikBolum": "Agent × risk heat map",
    "ai.risk.aciklamaBolum": "Risk profile of the busiest agents: darker cell means higher exposure.",
    "ai.risk.sutunTrafik": "Traffic",
    "ai.risk.sutunEngel": "Blocked",
    "ai.risk.sutunRisk": "Risk",
    "ai.risk.sutunRobots": "robots",
    "ai.risk.bosluk": "The heat map fills with the first agent traffic.",

    "ai.robots.baslik": "Generate robots.txt — from your policy",
    "ai.robots.aciklama": "Your allow/verify/block decisions instantly become a real robots.txt. Copy it to your site root. robots.txt is a polite request; Veylify ALSO actively blocks non-compliant AI — two-layer defense.",
    "ai.robots.kopyala": "Copy",
    "ai.robots.kopyalandi": "robots.txt copied to clipboard",
    "ai.robots.kopyaHata": "Copy failed",
    "ai.robots.indirildi": "robots.txt downloaded",
    "ai.robots.canli": "live — updates with policy",
    "ai.robots.ozetIzin": "allow",
    "ai.robots.ozetDogrula": "verify",
    "ai.robots.ozetEngelle": "block",
    "ai.robots.not": "robots.txt only affects compliant AI. Veylify actually catches and blocks bots that ignore robots via the verify/passive flow.",
    "ai.seri.baslik": "AI traffic time series",
    "ai.seri.aciklama": "Training crawls vs. live/search fetches over the last 14 days.",
    "ai.seri.egitim": "Model training",
    "ai.seri.getirme": "Live & search",

    "ai.agresif.baslik": "Top 3 most aggressive crawlers",
    "ai.agresif.aciklama": "Agents generating the most requests — surfaced for quick policy tuning.",
    "ai.agresif.istek": "requests / 30d",
    "ai.agresif.bosluk": "The most active agents appear here as traffic builds up.",

    "ai.kart.trend7": "7d trend",
    "ai.kart.robotsSaygili": "respects robots.txt",
    "ai.kart.robotsSaymaz": "ignores robots.txt",
    "ai.kart.riskSkor": "Risk score",
  },

  de: {
    "ai.baslik": "KI-Agenten-Analyse",

    "ai.serit.baslik": "Der Großteil des Internetverkehrs stammt inzwischen von KI-Agenten.",
    "ai.serit.aciklama":
      "Veylify erkennt jeden KI-Bot, der Ihre Website crawlt, und Sie entscheiden über sein Verhalten — halten Sie Ihre Inhalte aus dem Training heraus und schützen Sie Ihren Server.",

    "ai.kpi.istek": "KI-Agenten-Anfragen (30 T)",
    "ai.kpi.tespit": "Erkannte Agenten",
    "ai.kpi.engellenen": "Blockierte KI-Anfragen",
    "ai.kpi.egitim": "Modelltrainings-Crawls",

    "ai.bos.baslik": "Noch kein KI-Agenten-Verkehr erkannt",
    "ai.bos.aciklama":
      "Sobald Ihr Widget live ist, erscheinen hier Besuche von Agenten wie GPTBot, Claude und Perplexity. Sie können Ihre Richtlinie bereits jetzt im Katalog unten festlegen — sie greift ab dem ersten Besuch.",
    "ai.bos.entegre": "Widget integrieren",

    "ai.filtre.araEtiket": "KI-Agenten suchen",
    "ai.filtre.araYer": "Agent oder Betreiber suchen (GPTBot, Anthropic…)",
    "ai.filtre.eslesmeYok": "Keine Agenten passen zu diesem Filter.",

    "ai.kat.hepsi": "Alle",
    "ai.kat.model_egitimi": "Modelltraining",
    "ai.kat.canli_getirme": "Live-Abruf",
    "ai.kat.arama_indeksi": "Suchindex",
    "ai.kat.ajan_tarayici": "Autonomer Agent",
    "ai.kat.veri_kaziyici": "Daten-Scraper",

    "ai.pol.izin": "Zulassen",
    "ai.pol.dogrula": "Prüfen",
    "ai.pol.engelle": "Blockieren",
    "ai.polTam.izin": "Zulassen",
    "ai.polTam.dogrula": "Prüfen",
    "ai.polTam.engelle": "Blockieren",

    "ai.risk.dusuk": "Niedrig",
    "ai.risk.orta": "Mittel",
    "ai.risk.yuksek": "Hoch",
    "ai.risk.kritik": "Kritisch",
    "ai.risk.sonEk": "Risiko",

    "ai.kart.robotsUyari": "Beachtet robots.txt nicht",
    "ai.kart.detayEtiket": "{urun} Agentendetails",
    "ai.kart.30gIstek": "Anfragen (30 T)",
    "ai.kart.engellenen": "Blockiert",
    "ai.kart.sonGorulme": "Zuletzt gesehen",
    "ai.kart.politika": "Richtlinie",

    "ai.yas.gorulmedi": "Nicht gesehen",
    "ai.yas.dk": "vor {n} Min.",
    "ai.yas.sa": "vor {n} Std.",
    "ai.yas.g": "vor {n} T",

    "ai.drawer.kapat": "Schließen",
    "ai.drawer.korumaPolitikasi": "Schutzrichtlinie",
    "ai.drawer.oneriOn": "Veylify empfiehlt:",
    "ai.drawer.trafik": "Verkehr (letzte 30 Tage)",
    "ai.drawer.toplamIstek": "Anfragen gesamt",
    "ai.drawer.son7": "Letzte 7 Tage",
    "ai.drawer.engellenen": "Blockiert",
    "ai.drawer.dogrulanan": "Geprüft",
    "ai.drawer.enYol": "Meistbesuchter Pfad",
    "ai.drawer.imzaDogrulama": "Signatur & Verifizierung",
    "ai.drawer.userAgent": "User-Agent",
    "ai.drawer.robotsToken": "robots.txt-Token",
    "ai.drawer.kimlikDogrulama": "Identitätsprüfung",
    "ai.drawer.dogRolIp": "Offizieller IP-Bereich",
    "ai.drawer.dogRolDns": "Reverse DNS",
    "ai.drawer.dogRolYok": "Keine (Spoofing-Risiko)",
    "ai.drawer.robotsSaygi": "Beachtet robots.txt",
    "ai.drawer.robotsEvet": "Ja (deklariert)",
    "ai.drawer.robotsHayir": "Nein — ignoriert sie möglicherweise",
    "ai.drawer.ilkGorulme": "Erstmals gesehen",
    "ai.drawer.ipYayin": "Veröffentlichung des offiziellen IP-Bereichs",
    "ai.drawer.kuralAc": "Regel-Engine für diesen Agenten öffnen",

    "ai.toast.kaydedilemedi": "Richtlinie konnte nicht gespeichert werden",

    "ai.kpi.deltaIstek": "ggü. den letzten 7 Tagen",
    "ai.kpi.deltaEngel": "Blockrate",
    "ai.kpi.altKatalog": "im Katalog verfolgte Agenten",

    "ai.dagilim.baslik": "KI-Traffic nach Kategorie",
    "ai.dagilim.aciklama": "Agenten, die Ihre Website in den letzten 30 Tagen gecrawlt haben, nach Zweck gruppiert.",
    "ai.dagilim.bosluk": "Die Verteilung wird lebendig, sobald Agent-Traffic auftritt.",

    "ai.risk.baslikBolum": "Agent-×-Risiko-Heatmap",
    "ai.risk.aciklamaBolum": "Risikoprofil der aktivsten Agenten: dunklere Zelle bedeutet höhere Exposition.",
    "ai.risk.sutunTrafik": "Traffic",
    "ai.risk.sutunEngel": "Blockiert",
    "ai.risk.sutunRisk": "Risiko",
    "ai.risk.sutunRobots": "robots",
    "ai.risk.bosluk": "Die Heatmap füllt sich mit dem ersten Agent-Traffic.",

    "ai.robots.baslik": "robots.txt erstellen — aus Ihrer Richtlinie",
    "ai.robots.aciklama": "Ihre Entscheidungen werden sofort zu einer echten robots.txt. Kopieren Sie sie ins Site-Root. robots.txt ist eine höfliche Bitte; Veylify blockiert nicht konforme KI AUCH aktiv.",
    "ai.robots.kopyala": "Kopieren",
    "ai.robots.kopyalandi": "robots.txt kopiert",
    "ai.robots.kopyaHata": "Kopieren fehlgeschlagen",
    "ai.robots.indirildi": "robots.txt heruntergeladen",
    "ai.robots.canli": "live — aktualisiert mit Richtlinie",
    "ai.robots.ozetIzin": "erlauben",
    "ai.robots.ozetDogrula": "prüfen",
    "ai.robots.ozetEngelle": "blockieren",
    "ai.robots.not": "robots.txt betrifft nur konforme KI. Veylify fängt Bots, die robots ignorieren, tatsächlich ab.",
    "ai.seri.baslik": "KI-Traffic-Zeitreihe",
    "ai.seri.aciklama": "Trainings-Crawls vs. Live-/Such-Abrufe der letzten 14 Tage.",
    "ai.seri.egitim": "Modelltraining",
    "ai.seri.getirme": "Live & Suche",

    "ai.agresif.baslik": "Die 3 aggressivsten Crawler",
    "ai.agresif.aciklama": "Agenten mit den meisten Anfragen — für schnelle Richtlinienanpassung hervorgehoben.",
    "ai.agresif.istek": "Anfragen / 30 T",
    "ai.agresif.bosluk": "Die aktivsten Agenten erscheinen hier, sobald Traffic entsteht.",

    "ai.kart.trend7": "7-T-Trend",
    "ai.kart.robotsSaygili": "beachtet robots.txt",
    "ai.kart.robotsSaymaz": "ignoriert robots.txt",
    "ai.kart.riskSkor": "Risikowert",
  },

  fr: {
    "ai.baslik": "Renseignement sur les agents IA",

    "ai.serit.baslik": "La majeure partie du trafic Internet provient désormais d'agents IA.",
    "ai.serit.aciklama":
      "Veylify reconnaît chaque bot IA qui explore votre site et vous décidez de son comportement — préservez votre contenu de l'entraînement et protégez votre serveur.",

    "ai.kpi.istek": "Requêtes d'agents IA (30 j)",
    "ai.kpi.tespit": "Agents détectés",
    "ai.kpi.engellenen": "Requêtes IA bloquées",
    "ai.kpi.egitim": "Explorations d'entraînement",

    "ai.bos.baslik": "Aucun trafic d'agent IA détecté pour l'instant",
    "ai.bos.aciklama":
      "Dès que votre widget est en ligne, les visites d'agents comme GPTBot, Claude et Perplexity apparaissent ici. Vous pouvez définir votre politique dès maintenant depuis le catalogue ci-dessous — elle s'applique dès la première visite.",
    "ai.bos.entegre": "Intégrer le widget",

    "ai.filtre.araEtiket": "Rechercher des agents IA",
    "ai.filtre.araYer": "Rechercher un agent ou un opérateur (GPTBot, Anthropic…)",
    "ai.filtre.eslesmeYok": "Aucun agent ne correspond à ce filtre.",

    "ai.kat.hepsi": "Tous",
    "ai.kat.model_egitimi": "Entraînement de modèle",
    "ai.kat.canli_getirme": "Récupération en direct",
    "ai.kat.arama_indeksi": "Index de recherche",
    "ai.kat.ajan_tarayici": "Agent autonome",
    "ai.kat.veri_kaziyici": "Extracteur de données",

    "ai.pol.izin": "Autoriser",
    "ai.pol.dogrula": "Vérifier",
    "ai.pol.engelle": "Bloquer",
    "ai.polTam.izin": "Autoriser",
    "ai.polTam.dogrula": "Vérifier",
    "ai.polTam.engelle": "Bloquer",

    "ai.risk.dusuk": "Faible",
    "ai.risk.orta": "Moyen",
    "ai.risk.yuksek": "Élevé",
    "ai.risk.kritik": "Critique",
    "ai.risk.sonEk": "risque",

    "ai.kart.robotsUyari": "Ne respecte pas robots.txt",
    "ai.kart.detayEtiket": "Détails de l'agent {urun}",
    "ai.kart.30gIstek": "Requêtes (30 j)",
    "ai.kart.engellenen": "Bloquées",
    "ai.kart.sonGorulme": "Vu pour la dernière fois",
    "ai.kart.politika": "Politique",

    "ai.yas.gorulmedi": "Jamais vu",
    "ai.yas.dk": "il y a {n} min",
    "ai.yas.sa": "il y a {n} h",
    "ai.yas.g": "il y a {n} j",

    "ai.drawer.kapat": "Fermer",
    "ai.drawer.korumaPolitikasi": "Politique de protection",
    "ai.drawer.oneriOn": "Veylify recommande :",
    "ai.drawer.trafik": "Trafic (30 derniers jours)",
    "ai.drawer.toplamIstek": "Requêtes totales",
    "ai.drawer.son7": "7 derniers jours",
    "ai.drawer.engellenen": "Bloquées",
    "ai.drawer.dogrulanan": "Vérifiées",
    "ai.drawer.enYol": "Chemin le plus visité",
    "ai.drawer.imzaDogrulama": "Signature & vérification",
    "ai.drawer.userAgent": "User-Agent",
    "ai.drawer.robotsToken": "Jeton robots.txt",
    "ai.drawer.kimlikDogrulama": "Vérification d'identité",
    "ai.drawer.dogRolIp": "Plage d'IP officielle",
    "ai.drawer.dogRolDns": "DNS inversé",
    "ai.drawer.dogRolYok": "Aucune (risque d'usurpation)",
    "ai.drawer.robotsSaygi": "Respecte robots.txt",
    "ai.drawer.robotsEvet": "Oui (déclaré)",
    "ai.drawer.robotsHayir": "Non — peut l'ignorer",
    "ai.drawer.ilkGorulme": "Première apparition",
    "ai.drawer.ipYayin": "Publication de la plage d'IP officielle",
    "ai.drawer.kuralAc": "Ouvrir le moteur de règles pour cet agent",

    "ai.toast.kaydedilemedi": "Impossible d'enregistrer la politique",

    "ai.kpi.deltaIstek": "vs. 7 jours précédents",
    "ai.kpi.deltaEngel": "taux de blocage",
    "ai.kpi.altKatalog": "agents suivis au catalogue",

    "ai.dagilim.baslik": "Trafic IA par catégorie",
    "ai.dagilim.aciklama": "Agents ayant exploré votre site sur les 30 derniers jours, groupés par intention.",
    "ai.dagilim.bosluk": "La répartition s'anime dès qu'un trafic d'agent apparaît.",

    "ai.risk.baslikBolum": "Carte thermique agent × risque",
    "ai.risk.aciklamaBolum": "Profil de risque des agents les plus actifs : cellule plus sombre = exposition plus forte.",
    "ai.risk.sutunTrafik": "Trafic",
    "ai.risk.sutunEngel": "Bloqué",
    "ai.risk.sutunRisk": "Risque",
    "ai.risk.sutunRobots": "robots",
    "ai.risk.bosluk": "La carte thermique se remplit avec le premier trafic d'agent.",

    "ai.robots.baslik": "Générer robots.txt — depuis votre politique",
    "ai.robots.aciklama": "Vos décisions deviennent instantanément un vrai robots.txt. Copiez-le à la racine. robots.txt est une demande polie ; Veylify bloque AUSSI activement l'IA non conforme.",
    "ai.robots.kopyala": "Copier",
    "ai.robots.kopyalandi": "robots.txt copié",
    "ai.robots.kopyaHata": "Échec de la copie",
    "ai.robots.indirildi": "robots.txt téléchargé",
    "ai.robots.canli": "en direct — mis à jour avec la politique",
    "ai.robots.ozetIzin": "autoriser",
    "ai.robots.ozetDogrula": "vérifier",
    "ai.robots.ozetEngelle": "bloquer",
    "ai.robots.not": "robots.txt n'affecte que l'IA conforme. Veylify capture réellement les bots qui l'ignorent.",
    "ai.seri.baslik": "Série temporelle du trafic IA",
    "ai.seri.aciklama": "Explorations d'entraînement vs. récupérations en direct/recherche sur 14 jours.",
    "ai.seri.egitim": "Entraînement de modèle",
    "ai.seri.getirme": "Direct & recherche",

    "ai.agresif.baslik": "Top 3 des crawlers les plus agressifs",
    "ai.agresif.aciklama": "Agents générant le plus de requêtes — mis en avant pour un réglage rapide.",
    "ai.agresif.istek": "requêtes / 30 j",
    "ai.agresif.bosluk": "Les agents les plus actifs apparaissent ici à mesure que le trafic augmente.",

    "ai.kart.trend7": "tendance 7 j",
    "ai.kart.robotsSaygili": "respecte robots.txt",
    "ai.kart.robotsSaymaz": "ignore robots.txt",
    "ai.kart.riskSkor": "Score de risque",
  },

  es: {
    "ai.baslik": "Inteligencia de agentes IA",

    "ai.serit.baslik": "La mayor parte del tráfico de Internet proviene ya de agentes de IA.",
    "ai.serit.aciklama":
      "Veylify reconoce cada bot de IA que rastrea tu sitio y tú decides cómo se comporta — mantén tu contenido fuera del entrenamiento y protege tu servidor.",

    "ai.kpi.istek": "Solicitudes de agentes IA (30 d)",
    "ai.kpi.tespit": "Agentes detectados",
    "ai.kpi.engellenen": "Solicitudes IA bloqueadas",
    "ai.kpi.egitim": "Rastreos de entrenamiento",

    "ai.bos.baslik": "Aún no se ha detectado tráfico de agentes IA",
    "ai.bos.aciklama":
      "En cuanto tu widget esté activo, las visitas de agentes como GPTBot, Claude y Perplexity aparecerán aquí. Puedes definir tu política desde el catálogo de abajo ahora mismo — se aplica desde su primera visita.",
    "ai.bos.entegre": "Integrar el widget",

    "ai.filtre.araEtiket": "Buscar agentes IA",
    "ai.filtre.araYer": "Buscar agente u operador (GPTBot, Anthropic…)",
    "ai.filtre.eslesmeYok": "Ningún agente coincide con este filtro.",

    "ai.kat.hepsi": "Todos",
    "ai.kat.model_egitimi": "Entrenamiento de modelos",
    "ai.kat.canli_getirme": "Obtención en vivo",
    "ai.kat.arama_indeksi": "Índice de búsqueda",
    "ai.kat.ajan_tarayici": "Agente autónomo",
    "ai.kat.veri_kaziyici": "Extractor de datos",

    "ai.pol.izin": "Permitir",
    "ai.pol.dogrula": "Verificar",
    "ai.pol.engelle": "Bloquear",
    "ai.polTam.izin": "Permitir",
    "ai.polTam.dogrula": "Verificar",
    "ai.polTam.engelle": "Bloquear",

    "ai.risk.dusuk": "Bajo",
    "ai.risk.orta": "Medio",
    "ai.risk.yuksek": "Alto",
    "ai.risk.kritik": "Crítico",
    "ai.risk.sonEk": "riesgo",

    "ai.kart.robotsUyari": "No respeta robots.txt",
    "ai.kart.detayEtiket": "Detalles del agente {urun}",
    "ai.kart.30gIstek": "Solicitudes (30 d)",
    "ai.kart.engellenen": "Bloqueadas",
    "ai.kart.sonGorulme": "Visto por última vez",
    "ai.kart.politika": "Política",

    "ai.yas.gorulmedi": "No visto",
    "ai.yas.dk": "hace {n} min",
    "ai.yas.sa": "hace {n} h",
    "ai.yas.g": "hace {n} d",

    "ai.drawer.kapat": "Cerrar",
    "ai.drawer.korumaPolitikasi": "Política de protección",
    "ai.drawer.oneriOn": "Veylify recomienda:",
    "ai.drawer.trafik": "Tráfico (últimos 30 días)",
    "ai.drawer.toplamIstek": "Solicitudes totales",
    "ai.drawer.son7": "Últimos 7 días",
    "ai.drawer.engellenen": "Bloqueadas",
    "ai.drawer.dogrulanan": "Verificadas",
    "ai.drawer.enYol": "Ruta más visitada",
    "ai.drawer.imzaDogrulama": "Firma y verificación",
    "ai.drawer.userAgent": "User-Agent",
    "ai.drawer.robotsToken": "Token robots.txt",
    "ai.drawer.kimlikDogrulama": "Verificación de identidad",
    "ai.drawer.dogRolIp": "Rango de IP oficial",
    "ai.drawer.dogRolDns": "DNS inverso",
    "ai.drawer.dogRolYok": "Ninguna (riesgo de suplantación)",
    "ai.drawer.robotsSaygi": "Respeta robots.txt",
    "ai.drawer.robotsEvet": "Sí (declarado)",
    "ai.drawer.robotsHayir": "No — puede ignorarlo",
    "ai.drawer.ilkGorulme": "Primera aparición",
    "ai.drawer.ipYayin": "Publicación del rango de IP oficial",
    "ai.drawer.kuralAc": "Abrir el motor de reglas para este agente",

    "ai.toast.kaydedilemedi": "No se pudo guardar la política",

    "ai.kpi.deltaIstek": "vs. 7 días anteriores",
    "ai.kpi.deltaEngel": "tasa de bloqueo",
    "ai.kpi.altKatalog": "agentes rastreados en el catálogo",

    "ai.dagilim.baslik": "Tráfico de IA por categoría",
    "ai.dagilim.aciklama": "Agentes que rastrearon tu sitio en los últimos 30 días, agrupados por intención.",
    "ai.dagilim.bosluk": "La distribución cobra vida cuando aparece tráfico de agentes.",

    "ai.risk.baslikBolum": "Mapa de calor agente × riesgo",
    "ai.risk.aciklamaBolum": "Perfil de riesgo de los agentes más activos: celda más oscura = mayor exposición.",
    "ai.risk.sutunTrafik": "Tráfico",
    "ai.risk.sutunEngel": "Bloqueado",
    "ai.risk.sutunRisk": "Riesgo",
    "ai.risk.sutunRobots": "robots",
    "ai.risk.bosluk": "El mapa de calor se llena con el primer tráfico de agentes.",

    "ai.robots.baslik": "Generar robots.txt — desde tu política",
    "ai.robots.aciklama": "Tus decisiones se convierten al instante en un robots.txt real. Cópialo a la raíz del sitio. robots.txt es una petición cortés; Veylify TAMBIÉN bloquea activamente la IA no conforme.",
    "ai.robots.kopyala": "Copiar",
    "ai.robots.kopyalandi": "robots.txt copiado",
    "ai.robots.kopyaHata": "Error al copiar",
    "ai.robots.indirildi": "robots.txt descargado",
    "ai.robots.canli": "en vivo — se actualiza con la política",
    "ai.robots.ozetIzin": "permitir",
    "ai.robots.ozetDogrula": "verificar",
    "ai.robots.ozetEngelle": "bloquear",
    "ai.robots.not": "robots.txt solo afecta a la IA conforme. Veylify realmente atrapa a los bots que lo ignoran.",
    "ai.seri.baslik": "Serie temporal de tráfico de IA",
    "ai.seri.aciklama": "Rastreos de entrenamiento vs. recuperaciones en vivo/búsqueda en 14 días.",
    "ai.seri.egitim": "Entrenamiento de modelo",
    "ai.seri.getirme": "En vivo y búsqueda",

    "ai.agresif.baslik": "Los 3 crawlers más agresivos",
    "ai.agresif.aciklama": "Agentes que generan más solicitudes — destacados para ajuste rápido de políticas.",
    "ai.agresif.istek": "solicitudes / 30 d",
    "ai.agresif.bosluk": "Los agentes más activos aparecen aquí a medida que crece el tráfico.",

    "ai.kart.trend7": "tendencia 7 d",
    "ai.kart.robotsSaygili": "respeta robots.txt",
    "ai.kart.robotsSaymaz": "ignora robots.txt",
    "ai.kart.riskSkor": "Puntuación de riesgo",
  },
};

/** Anahtarı verilen dile çevir. Bulunamazsa TR'ye, o da yoksa anahtara düşer. */
export function aiajanlarCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
