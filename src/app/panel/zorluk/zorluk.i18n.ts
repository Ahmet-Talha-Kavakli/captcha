import type { Dil } from "@/lib/i18n/panel";

/**
 * Adaptif Zorluk — yerel çeviri sözlüğü.
 * Enum değerleri (difficulty: low/medium/high, site.mode) asla çevrilmez;
 * istemcide anahtar→çeviri eşlemesiyle yeniden türetilir. Lib'in ürettiği
 * TR sebep/gerekçe metinleri de burada sabit anahtarlar üzerinden çevrilir
 * (lib düzenlenmez; TR string'i eşleme anahtarı olarak kullanılır).
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    baslik: "Adaptif Zorluk",

    // açıklama
    "aciklama.baslik": "Ghost-font zorluğu sabit değil — canlı uyarlanır.",
    "aciklama.metin":
      "Her istekte IP itibarı, davranış skoru ve otomasyon imzasına göre challenge zorluğu otomatik ölçeklenir: temiz insana kısa/kolay, şüpheli bota uzun/zor. Aşağıda son {n} olaya uygulanan gerçek dağılım.",

    // özet kartları
    "ozet.taban": "Taban zorluk",
    "ozet.yukseltilen": "Yükseltilen istek",
    "ozet.dusurulen": "Kolaylaştırılan istek",
    "ozet.ortUzunluk": "Ort. kod uzunluğu",

    // zorluk enum etiketleri
    "zorluk.low": "Düşük",
    "zorluk.medium": "Orta",
    "zorluk.high": "Yüksek",

    // dağılım
    "dagilim.baslik": "Zorluk dağılımı (gerçek trafik)",
    "dagilim.zorlukEk": "zorluk",
    "dagilim.taban": "taban",
    "dagilim.dipnot":
      "Yüksek zorluk kodları daha uzun (7 hane) → bot için brute-force alanı üstel büyür; insan yine tek bakışta okur.",

    // sebepler
    "sebep.baslik": "Zorluğu yükselten sebepler",
    "sebep.bos": "Bu dönemde zorluk yükselten sinyal yok — trafik temiz.",
    "sebep.istekEk": "{n} istek",
    // sebep etiketleri (lib TR string'i anahtar)
    "sebep.etiket.Otomasyon imzası": "Otomasyon imzası",
    "sebep.etiket.Kötü IP itibarı": "Kötü IP itibarı",
    "sebep.etiket.Düşük davranış skoru": "Düşük davranış skoru",
    // etki (kademe) etiketleri
    "etki.+2 kademe": "+2 kademe",
    "etki.+1 kademe": "+1 kademe",

    // simülatör
    "sim.baslik": "Canlı zorluk simülatörü",
    "sim.sagUst": "Sinyalleri değiştir, kararı gör",
    "sim.davranis": "Davranış skoru",
    "sim.davranisIpucu": "Yüksek = insansı, düşük = bot şüphesi",
    "sim.itibar": "IP itibarı",
    "sim.itibarIpucu": "Yüksek = temiz IP, düşük = kötü ün",
    "sim.ardisik": "Ardışık başarısızlık:",
    "sim.otomasyon": "Otomasyon imzası (navigator.webdriver)",
    "sim.uygulanacak": "Uygulanacak zorluk",
    "sim.haneliKod": "{n} haneli kod",
    // gerekçe metinleri (lib TR string'i anahtar; {n} interpolasyonlu olanlar ayrı)
    "gerekce.Otomasyon imzası tespit edildi → +2 kademe": "Otomasyon imzası tespit edildi → +2 kademe",
    "gerekce.Kötü IP itibarı → +1 kademe": "Kötü IP itibarı → +1 kademe",
    "gerekce.Düşük davranış skoru → +1 kademe": "Düşük davranış skoru → +1 kademe",
    "gerekce.ardisik": "{n} ardışık başarısızlık → +1 kademe",
    "gerekce.netInsan": "Net insan sinyali (yüksek davranış + temiz IP) → −1 kademe (kolaylaştırıldı)",
    "gerekce.notr": "Nötr sinyaller → taban zorluk korundu",

    // site tablosu
    "site.baslik": "Site başına taban zorluk",
    "site.sutunSite": "Site",
    "site.sutunMod": "Mod",
    "site.sutunTaban": "Taban zorluk",
    "site.sutunYonet": "Yönet",
    "site.bos": "Henüz site yok.",
    "site.dogrulandi": "Doğrulandı",
    "site.ayarlar": "Site ayarları",
    "site.dipnot":
      "Taban zorluk site detayından ayarlanır; adaptif motor bu tabanı istek başına canlı yukarı/aşağı kaydırır.",
    // mode enum etiketleri
    "mod.block": "Engelle",
    "mod.challenge": "Doğrula",
    "mod.monitor": "İzleme",

    // nasıl çalışır
    "cta.baslik": "Zorluk, tehdit istihbaratıyla birlikte çalışır",
    "cta.metin":
      "Tehdit beslemelerinde eşleşen IP'ler daha düşük itibar alır → adaptif motor onlara otomatik daha zor challenge sunar.",
    "cta.buton": "Tehdit beslemeleri",
    "cta.toast": "Tehdit beslemelerine gidiliyor",
  },

  en: {
    baslik: "Adaptive Difficulty",

    "aciklama.baslik": "Ghost-font difficulty isn't fixed — it adapts live.",
    "aciklama.metin":
      "On every request, challenge difficulty scales automatically based on IP reputation, behavior score, and automation signature: short/easy for a clean human, long/hard for a suspicious bot. Below is the real distribution applied to the last {n} events.",

    "ozet.taban": "Base difficulty",
    "ozet.yukseltilen": "Escalated requests",
    "ozet.dusurulen": "Eased requests",
    "ozet.ortUzunluk": "Avg. code length",

    "zorluk.low": "Low",
    "zorluk.medium": "Medium",
    "zorluk.high": "High",

    "dagilim.baslik": "Difficulty distribution (real traffic)",
    "dagilim.zorlukEk": "difficulty",
    "dagilim.taban": "base",
    "dagilim.dipnot":
      "High-difficulty codes are longer (7 digits) → the brute-force space grows exponentially for a bot; a human still reads it at a glance.",

    "sebep.baslik": "Reasons that raise difficulty",
    "sebep.bos": "No difficulty-raising signals this period — traffic is clean.",
    "sebep.istekEk": "{n} requests",
    "sebep.etiket.Otomasyon imzası": "Automation signature",
    "sebep.etiket.Kötü IP itibarı": "Bad IP reputation",
    "sebep.etiket.Düşük davranış skoru": "Low behavior score",
    "etki.+2 kademe": "+2 tiers",
    "etki.+1 kademe": "+1 tier",

    "sim.baslik": "Live difficulty simulator",
    "sim.sagUst": "Change signals, see the decision",
    "sim.davranis": "Behavior score",
    "sim.davranisIpucu": "High = human-like, low = bot suspicion",
    "sim.itibar": "IP reputation",
    "sim.itibarIpucu": "High = clean IP, low = bad reputation",
    "sim.ardisik": "Consecutive failures:",
    "sim.otomasyon": "Automation signature (navigator.webdriver)",
    "sim.uygulanacak": "Difficulty to apply",
    "sim.haneliKod": "{n}-digit code",
    "gerekce.Otomasyon imzası tespit edildi → +2 kademe": "Automation signature detected → +2 tiers",
    "gerekce.Kötü IP itibarı → +1 kademe": "Bad IP reputation → +1 tier",
    "gerekce.Düşük davranış skoru → +1 kademe": "Low behavior score → +1 tier",
    "gerekce.ardisik": "{n} consecutive failures → +1 tier",
    "gerekce.netInsan": "Clear human signal (high behavior + clean IP) → −1 tier (eased)",
    "gerekce.notr": "Neutral signals → base difficulty kept",

    "site.baslik": "Base difficulty per site",
    "site.sutunSite": "Site",
    "site.sutunMod": "Mode",
    "site.sutunTaban": "Base difficulty",
    "site.sutunYonet": "Manage",
    "site.bos": "No sites yet.",
    "site.dogrulandi": "Verified",
    "site.ayarlar": "Site settings",
    "site.dipnot":
      "Base difficulty is set from the site detail; the adaptive engine shifts this base up/down live per request.",
    "mod.block": "Block",
    "mod.challenge": "Challenge",
    "mod.monitor": "Monitor",

    "cta.baslik": "Difficulty works together with threat intelligence",
    "cta.metin":
      "IPs matching threat feeds get lower reputation → the adaptive engine automatically serves them harder challenges.",
    "cta.buton": "Threat feeds",
    "cta.toast": "Navigating to threat feeds",
  },

  de: {
    baslik: "Adaptive Schwierigkeit",

    "aciklama.baslik": "Ghost-Font-Schwierigkeit ist nicht fix — sie passt sich live an.",
    "aciklama.metin":
      "Bei jeder Anfrage skaliert die Challenge-Schwierigkeit automatisch anhand von IP-Reputation, Verhaltensscore und Automatisierungssignatur: kurz/leicht für einen sauberen Menschen, lang/schwer für einen verdächtigen Bot. Unten die reale Verteilung, angewendet auf die letzten {n} Ereignisse.",

    "ozet.taban": "Basisschwierigkeit",
    "ozet.yukseltilen": "Hochgestufte Anfragen",
    "ozet.dusurulen": "Erleichterte Anfragen",
    "ozet.ortUzunluk": "Durchschn. Codelänge",

    "zorluk.low": "Niedrig",
    "zorluk.medium": "Mittel",
    "zorluk.high": "Hoch",

    "dagilim.baslik": "Schwierigkeitsverteilung (realer Traffic)",
    "dagilim.zorlukEk": "Schwierigkeit",
    "dagilim.taban": "Basis",
    "dagilim.dipnot":
      "Codes hoher Schwierigkeit sind länger (7 Ziffern) → der Brute-Force-Raum wächst für einen Bot exponentiell; ein Mensch liest ihn dennoch auf einen Blick.",

    "sebep.baslik": "Gründe, die die Schwierigkeit erhöhen",
    "sebep.bos": "In diesem Zeitraum keine schwierigkeitserhöhenden Signale — der Traffic ist sauber.",
    "sebep.istekEk": "{n} Anfragen",
    "sebep.etiket.Otomasyon imzası": "Automatisierungssignatur",
    "sebep.etiket.Kötü IP itibarı": "Schlechte IP-Reputation",
    "sebep.etiket.Düşük davranış skoru": "Niedriger Verhaltensscore",
    "etki.+2 kademe": "+2 Stufen",
    "etki.+1 kademe": "+1 Stufe",

    "sim.baslik": "Live-Schwierigkeitssimulator",
    "sim.sagUst": "Signale ändern, die Entscheidung sehen",
    "sim.davranis": "Verhaltensscore",
    "sim.davranisIpucu": "Hoch = menschenähnlich, niedrig = Bot-Verdacht",
    "sim.itibar": "IP-Reputation",
    "sim.itibarIpucu": "Hoch = saubere IP, niedrig = schlechter Ruf",
    "sim.ardisik": "Aufeinanderfolgende Fehlversuche:",
    "sim.otomasyon": "Automatisierungssignatur (navigator.webdriver)",
    "sim.uygulanacak": "Anzuwendende Schwierigkeit",
    "sim.haneliKod": "{n}-stelliger Code",
    "gerekce.Otomasyon imzası tespit edildi → +2 kademe": "Automatisierungssignatur erkannt → +2 Stufen",
    "gerekce.Kötü IP itibarı → +1 kademe": "Schlechte IP-Reputation → +1 Stufe",
    "gerekce.Düşük davranış skoru → +1 kademe": "Niedriger Verhaltensscore → +1 Stufe",
    "gerekce.ardisik": "{n} aufeinanderfolgende Fehlversuche → +1 Stufe",
    "gerekce.netInsan": "Klares Menschsignal (hohes Verhalten + saubere IP) → −1 Stufe (erleichtert)",
    "gerekce.notr": "Neutrale Signale → Basisschwierigkeit beibehalten",

    "site.baslik": "Basisschwierigkeit pro Website",
    "site.sutunSite": "Website",
    "site.sutunMod": "Modus",
    "site.sutunTaban": "Basisschwierigkeit",
    "site.sutunYonet": "Verwalten",
    "site.bos": "Noch keine Websites.",
    "site.dogrulandi": "Verifiziert",
    "site.ayarlar": "Website-Einstellungen",
    "site.dipnot":
      "Die Basisschwierigkeit wird im Website-Detail festgelegt; die adaptive Engine verschiebt diese Basis pro Anfrage live nach oben/unten.",
    "mod.block": "Blockieren",
    "mod.challenge": "Verifizieren",
    "mod.monitor": "Überwachen",

    "cta.baslik": "Schwierigkeit arbeitet mit Bedrohungsanalyse zusammen",
    "cta.metin":
      "IPs, die mit Bedrohungs-Feeds übereinstimmen, erhalten eine niedrigere Reputation → die adaptive Engine bietet ihnen automatisch schwerere Challenges.",
    "cta.buton": "Bedrohungs-Feeds",
    "cta.toast": "Navigation zu Bedrohungs-Feeds",
  },

  fr: {
    baslik: "Difficulté adaptative",

    "aciklama.baslik": "La difficulté ghost-font n'est pas fixe — elle s'adapte en direct.",
    "aciklama.metin":
      "À chaque requête, la difficulté du challenge s'échelonne automatiquement selon la réputation IP, le score de comportement et la signature d'automatisation : court/facile pour un humain propre, long/difficile pour un bot suspect. Ci-dessous, la distribution réelle appliquée aux {n} derniers événements.",

    "ozet.taban": "Difficulté de base",
    "ozet.yukseltilen": "Requêtes renforcées",
    "ozet.dusurulen": "Requêtes allégées",
    "ozet.ortUzunluk": "Longueur moy. du code",

    "zorluk.low": "Faible",
    "zorluk.medium": "Moyenne",
    "zorluk.high": "Élevée",

    "dagilim.baslik": "Distribution de difficulté (trafic réel)",
    "dagilim.zorlukEk": "difficulté",
    "dagilim.taban": "base",
    "dagilim.dipnot":
      "Les codes de difficulté élevée sont plus longs (7 chiffres) → l'espace de force brute croît exponentiellement pour un bot ; un humain le lit toujours d'un coup d'œil.",

    "sebep.baslik": "Raisons qui augmentent la difficulté",
    "sebep.bos": "Aucun signal augmentant la difficulté sur cette période — le trafic est propre.",
    "sebep.istekEk": "{n} requêtes",
    "sebep.etiket.Otomasyon imzası": "Signature d'automatisation",
    "sebep.etiket.Kötü IP itibarı": "Mauvaise réputation IP",
    "sebep.etiket.Düşük davranış skoru": "Faible score de comportement",
    "etki.+2 kademe": "+2 paliers",
    "etki.+1 kademe": "+1 palier",

    "sim.baslik": "Simulateur de difficulté en direct",
    "sim.sagUst": "Modifiez les signaux, voyez la décision",
    "sim.davranis": "Score de comportement",
    "sim.davranisIpucu": "Élevé = humain, faible = suspicion de bot",
    "sim.itibar": "Réputation IP",
    "sim.itibarIpucu": "Élevé = IP propre, faible = mauvaise réputation",
    "sim.ardisik": "Échecs consécutifs :",
    "sim.otomasyon": "Signature d'automatisation (navigator.webdriver)",
    "sim.uygulanacak": "Difficulté à appliquer",
    "sim.haneliKod": "Code à {n} chiffres",
    "gerekce.Otomasyon imzası tespit edildi → +2 kademe": "Signature d'automatisation détectée → +2 paliers",
    "gerekce.Kötü IP itibarı → +1 kademe": "Mauvaise réputation IP → +1 palier",
    "gerekce.Düşük davranış skoru → +1 kademe": "Faible score de comportement → +1 palier",
    "gerekce.ardisik": "{n} échecs consécutifs → +1 palier",
    "gerekce.netInsan": "Signal humain net (comportement élevé + IP propre) → −1 palier (allégé)",
    "gerekce.notr": "Signaux neutres → difficulté de base conservée",

    "site.baslik": "Difficulté de base par site",
    "site.sutunSite": "Site",
    "site.sutunMod": "Mode",
    "site.sutunTaban": "Difficulté de base",
    "site.sutunYonet": "Gérer",
    "site.bos": "Aucun site pour l'instant.",
    "site.dogrulandi": "Vérifié",
    "site.ayarlar": "Paramètres du site",
    "site.dipnot":
      "La difficulté de base se règle depuis le détail du site ; le moteur adaptatif décale cette base vers le haut/bas en direct à chaque requête.",
    "mod.block": "Bloquer",
    "mod.challenge": "Vérifier",
    "mod.monitor": "Surveiller",

    "cta.baslik": "La difficulté fonctionne de concert avec le renseignement sur les menaces",
    "cta.metin":
      "Les IP correspondant aux flux de menaces obtiennent une réputation plus faible → le moteur adaptatif leur sert automatiquement des challenges plus difficiles.",
    "cta.buton": "Flux de menaces",
    "cta.toast": "Navigation vers les flux de menaces",
  },

  es: {
    baslik: "Dificultad adaptativa",

    "aciklama.baslik": "La dificultad ghost-font no es fija — se adapta en vivo.",
    "aciklama.metin":
      "En cada solicitud, la dificultad del challenge se escala automáticamente según la reputación de IP, la puntuación de comportamiento y la firma de automatización: corto/fácil para un humano limpio, largo/difícil para un bot sospechoso. Abajo, la distribución real aplicada a los últimos {n} eventos.",

    "ozet.taban": "Dificultad base",
    "ozet.yukseltilen": "Solicitudes elevadas",
    "ozet.dusurulen": "Solicitudes aligeradas",
    "ozet.ortUzunluk": "Long. media del código",

    "zorluk.low": "Baja",
    "zorluk.medium": "Media",
    "zorluk.high": "Alta",

    "dagilim.baslik": "Distribución de dificultad (tráfico real)",
    "dagilim.zorlukEk": "dificultad",
    "dagilim.taban": "base",
    "dagilim.dipnot":
      "Los códigos de dificultad alta son más largos (7 dígitos) → el espacio de fuerza bruta crece exponencialmente para un bot; un humano lo lee igual de un vistazo.",

    "sebep.baslik": "Razones que elevan la dificultad",
    "sebep.bos": "Sin señales que eleven la dificultad en este periodo — el tráfico está limpio.",
    "sebep.istekEk": "{n} solicitudes",
    "sebep.etiket.Otomasyon imzası": "Firma de automatización",
    "sebep.etiket.Kötü IP itibarı": "Mala reputación de IP",
    "sebep.etiket.Düşük davranış skoru": "Puntuación de comportamiento baja",
    "etki.+2 kademe": "+2 niveles",
    "etki.+1 kademe": "+1 nivel",

    "sim.baslik": "Simulador de dificultad en vivo",
    "sim.sagUst": "Cambia las señales, mira la decisión",
    "sim.davranis": "Puntuación de comportamiento",
    "sim.davranisIpucu": "Alta = humano, baja = sospecha de bot",
    "sim.itibar": "Reputación de IP",
    "sim.itibarIpucu": "Alta = IP limpia, baja = mala reputación",
    "sim.ardisik": "Fallos consecutivos:",
    "sim.otomasyon": "Firma de automatización (navigator.webdriver)",
    "sim.uygulanacak": "Dificultad a aplicar",
    "sim.haneliKod": "Código de {n} dígitos",
    "gerekce.Otomasyon imzası tespit edildi → +2 kademe": "Firma de automatización detectada → +2 niveles",
    "gerekce.Kötü IP itibarı → +1 kademe": "Mala reputación de IP → +1 nivel",
    "gerekce.Düşük davranış skoru → +1 kademe": "Puntuación de comportamiento baja → +1 nivel",
    "gerekce.ardisik": "{n} fallos consecutivos → +1 nivel",
    "gerekce.netInsan": "Señal humana clara (comportamiento alto + IP limpia) → −1 nivel (aligerado)",
    "gerekce.notr": "Señales neutrales → dificultad base mantenida",

    "site.baslik": "Dificultad base por sitio",
    "site.sutunSite": "Sitio",
    "site.sutunMod": "Modo",
    "site.sutunTaban": "Dificultad base",
    "site.sutunYonet": "Gestionar",
    "site.bos": "Aún no hay sitios.",
    "site.dogrulandi": "Verificado",
    "site.ayarlar": "Ajustes del sitio",
    "site.dipnot":
      "La dificultad base se ajusta desde el detalle del sitio; el motor adaptativo desplaza esta base hacia arriba/abajo en vivo por solicitud.",
    "mod.block": "Bloquear",
    "mod.challenge": "Verificar",
    "mod.monitor": "Monitorear",

    "cta.baslik": "La dificultad trabaja junto con la inteligencia de amenazas",
    "cta.metin":
      "Las IP que coinciden con las fuentes de amenazas obtienen menor reputación → el motor adaptativo les sirve automáticamente challenges más difíciles.",
    "cta.buton": "Fuentes de amenazas",
    "cta.toast": "Navegando a las fuentes de amenazas",
  },
};

export function zorlukCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
