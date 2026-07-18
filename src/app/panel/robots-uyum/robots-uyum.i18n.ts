import type { Dil } from "@/lib/i18n/panel";

/**
 * robots.txt Uyum Denetleyici — yerel çeviri sözlüğü.
 * Anahtarlar sabit; değerler dile göre native çevrilir. Enum değerleri
 * (durum: uyumlu/ihlal/taahhut_yok, sebep türleri) asla çevrilmez —
 * istemcide anahtar→çeviri eşlemesiyle yeniden türetilir.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    baslik: "robots.txt Uyum Denetleyici",

    // açıklama şeridi
    "aciklama.soru": "robots.txt'e uyduğunu iddia eden botlar gerçekten uydu mu?",
    "aciklama.metin":
      "Gözlenen AI-bot trafiğini temsili bir robots.txt politikasıyla karşılaştırırız. Bir bot \"robots.txt'e saygı gösteririm\" der ama korumalı (Disallow) bir yola istek atmışsa — bu bir {ihlal} ve bot, uyum konusunda yalan söylüyor demektir.",
    "aciklama.ihlalVurgu": "ihlaldir",

    // özet kartları
    "ozet.aiIstek": "Gözlenen AI isteği (30g)",
    "ozet.ihlal": "Tespit edilen ihlal",
    "ozet.ihlalliAjan": "Taahhüdünü çiğneyen ajan",
    "ozet.ortUyum": "Ort. uyum oranı (taahhütlü)",

    // asıl bulgu vurgusu
    "bulgu.metin": "{n} ajan robots.txt'e saygı gösterdiğini iddia ederken korumalı yollara istek attı.",
    "bulgu.enKritik": "En kritik bulgu:",
    "bulgu.ihlalEk": "{n} ihlal",
    "bulgu.kuyruk": ". Aşağıdan hangi yolları çiğnediklerini genişletebilirsiniz.",

    // durum etiketleri (enum: UyumDurum)
    "durum.uyumlu": "Uyumlu",
    "durum.ihlal": "İHLAL",
    "durum.taahhut_yok": "Taahhüt yok",

    // ajan tablosu
    "ajan.baslik": "Ajan bazlı uyum",
    "ajan.bosBaslik": "Henüz AI-bot trafiği yok",
    "ajan.bosMetin":
      "Son 30 günde kataloğumuzdaki AI botlarından hiçbiri sitelerinize istek atmadı. Trafik geldikçe uyum analizi burada belirir.",
    "ajan.saygiTaahhut": "robots'a saygı taahhüdü",
    "ajan.taahhutYok": "uyum taahhüdü yok",
    "ajan.uyumEk": "%{n} uyum",
    "ajan.istek": "istek",
    "ajan.ihlal": "ihlal",
    "ajan.cignenenYollar": "Çiğnenen korumalı yollar",
    "ajan.istekSayi": "{n} istek",
    "ajan.celiskiUyari":
      "Bu ajan robots.txt'e uyduğunu ilan ediyor; yine de yukarıdaki korumalı yollara istek attı. Taahhüdü ile davranışı çelişiyor.",

    // nasıl davranmalı
    "cta.baslik": "Nasıl davranmalı?",
    "cta.engelleBaslik": "İhlal eden ajanı engelle",
    "cta.engelleMetin":
      "robots.txt'i çiğnediği kanıtlanan ajanlar için AI Ajan İstihbaratı'ndan \"Engelle\" politikası uygula. Taahhüdüne uymayan bir botun sözüne güvenmek yerine ağ katmanında durdur.",
    "cta.engelleButon": "AI Ajan İstihbaratı",
    "cta.kuralBaslik": "Yol bazlı kural ekle",
    "cta.kuralMetin1": "robots.txt bir rica; Veylify kuralı bir yaptırımdır. Korumalı yollara (ör.",
    "cta.kuralMetin2":
      ") gelen bot isteklerini yol bazlı bir kuralla zorunlu olarak engelle.",
    "cta.kuralButon": "Kural oluştur",

    // referans
    "ref.baslik": "Referans: korumalı yollar (temsili robots.txt)",
    "ref.metin":
      "Uyum analizi, aşağıdaki temsili {disallow} kurallarına dayanır. Bu yolların herhangi birine (ve alt yollarına) giden AI-bot isteği, bir uyum ihlali olarak sayılır.",
    "ref.disallowVurgu": "Disallow",
    "ref.uyari":
      "Bu, gerçek bir sitenin robots.txt dosyası değil; sektörde yaygın olarak korunan yolların {temsili} bir kümesidir. Her site için gerçek robots.txt'i çekip kural-kural karşılaştırmak (site-başına Disallow ayrıştırma) planlanan bir sonraki geliştirmedir. Mevcut analiz, gözlenen AI-bot trafiğini bu temsili politikayla dürüstçe kıyaslar.",
    "ref.temsiliVurgu": "temsili",
  },

  en: {
    baslik: "robots.txt Compliance Auditor",

    "aciklama.soru": "Did bots that claim to follow robots.txt actually follow it?",
    "aciklama.metin":
      "We compare observed AI-bot traffic against a representative robots.txt policy. If a bot says \"I respect robots.txt\" but sent a request to a protected (Disallow) path — that's a {ihlal} and the bot is lying about compliance.",
    "aciklama.ihlalVurgu": "violation",

    "ozet.aiIstek": "Observed AI requests (30d)",
    "ozet.ihlal": "Detected violations",
    "ozet.ihlalliAjan": "Agents breaking their pledge",
    "ozet.ortUyum": "Avg. compliance rate (pledged)",

    "bulgu.metin": "{n} agents claimed to respect robots.txt yet sent requests to protected paths.",
    "bulgu.enKritik": "Most critical finding:",
    "bulgu.ihlalEk": "{n} violations",
    "bulgu.kuyruk": ". Expand below to see which paths they broke.",

    "durum.uyumlu": "Compliant",
    "durum.ihlal": "VIOLATION",
    "durum.taahhut_yok": "No pledge",

    "ajan.baslik": "Compliance by agent",
    "ajan.bosBaslik": "No AI-bot traffic yet",
    "ajan.bosMetin":
      "In the last 30 days, none of the AI bots in our catalog sent requests to your sites. Compliance analysis will appear here as traffic arrives.",
    "ajan.saygiTaahhut": "pledges to respect robots",
    "ajan.taahhutYok": "no compliance pledge",
    "ajan.uyumEk": "{n}% compliant",
    "ajan.istek": "requests",
    "ajan.ihlal": "violations",
    "ajan.cignenenYollar": "Protected paths broken",
    "ajan.istekSayi": "{n} requests",
    "ajan.celiskiUyari":
      "This agent declares that it obeys robots.txt; yet it sent requests to the protected paths above. Its pledge contradicts its behavior.",

    "cta.baslik": "What should you do?",
    "cta.engelleBaslik": "Block the violating agent",
    "cta.engelleMetin":
      "For agents proven to break robots.txt, apply a \"Block\" policy from AI Agent Intelligence. Instead of trusting the word of a bot that ignores its pledge, stop it at the network layer.",
    "cta.engelleButon": "AI Agent Intelligence",
    "cta.kuralBaslik": "Add a path-based rule",
    "cta.kuralMetin1": "robots.txt is a request; a Veylify rule is enforcement. For protected paths (e.g.",
    "cta.kuralMetin2": ") mandatorily block incoming bot requests with a path-based rule.",
    "cta.kuralButon": "Create rule",

    "ref.baslik": "Reference: protected paths (representative robots.txt)",
    "ref.metin":
      "The compliance analysis is based on the representative {disallow} rules below. An AI-bot request to any of these paths (and their sub-paths) counts as a compliance violation.",
    "ref.disallowVurgu": "Disallow",
    "ref.uyari":
      "This is not a real site's robots.txt file; it is a {temsili} set of paths commonly protected across the industry. Fetching each site's real robots.txt and comparing rule by rule (per-site Disallow parsing) is a planned next improvement. The current analysis honestly compares observed AI-bot traffic against this representative policy.",
    "ref.temsiliVurgu": "representative",
  },

  de: {
    baslik: "robots.txt-Konformitätsprüfer",

    "aciklama.soru": "Haben Bots, die behaupten, robots.txt zu befolgen, es wirklich getan?",
    "aciklama.metin":
      "Wir vergleichen beobachteten KI-Bot-Traffic mit einer repräsentativen robots.txt-Richtlinie. Sagt ein Bot \"Ich respektiere robots.txt\", hat aber eine Anfrage an einen geschützten (Disallow) Pfad gesendet — dann ist das ein {ihlal} und der Bot lügt über seine Konformität.",
    "aciklama.ihlalVurgu": "Verstoß",

    "ozet.aiIstek": "Beobachtete KI-Anfragen (30 T.)",
    "ozet.ihlal": "Erkannte Verstöße",
    "ozet.ihlalliAjan": "Agenten, die ihr Versprechen brechen",
    "ozet.ortUyum": "Durchschn. Konformitätsrate (zugesagt)",

    "bulgu.metin": "{n} Agenten behaupteten, robots.txt zu respektieren, sendeten aber Anfragen an geschützte Pfade.",
    "bulgu.enKritik": "Kritischster Befund:",
    "bulgu.ihlalEk": "{n} Verstöße",
    "bulgu.kuyruk": ". Erweitern Sie unten, um zu sehen, welche Pfade sie verletzt haben.",

    "durum.uyumlu": "Konform",
    "durum.ihlal": "VERSTOSS",
    "durum.taahhut_yok": "Keine Zusage",

    "ajan.baslik": "Konformität nach Agent",
    "ajan.bosBaslik": "Noch kein KI-Bot-Traffic",
    "ajan.bosMetin":
      "In den letzten 30 Tagen hat keiner der KI-Bots aus unserem Katalog Anfragen an Ihre Websites gesendet. Die Konformitätsanalyse erscheint hier, sobald Traffic eintrifft.",
    "ajan.saygiTaahhut": "sagt zu, robots zu respektieren",
    "ajan.taahhutYok": "keine Konformitätszusage",
    "ajan.uyumEk": "{n}% konform",
    "ajan.istek": "Anfragen",
    "ajan.ihlal": "Verstöße",
    "ajan.cignenenYollar": "Verletzte geschützte Pfade",
    "ajan.istekSayi": "{n} Anfragen",
    "ajan.celiskiUyari":
      "Dieser Agent erklärt, dass er robots.txt befolgt; dennoch sendete er Anfragen an die oben genannten geschützten Pfade. Seine Zusage widerspricht seinem Verhalten.",

    "cta.baslik": "Was sollten Sie tun?",
    "cta.engelleBaslik": "Den verletzenden Agenten blockieren",
    "cta.engelleMetin":
      "Wenden Sie für Agenten, die nachweislich robots.txt brechen, eine \"Blockieren\"-Richtlinie aus der KI-Agenten-Analyse an. Statt dem Wort eines Bots zu vertrauen, der seine Zusage ignoriert, stoppen Sie ihn auf Netzwerkebene.",
    "cta.engelleButon": "KI-Agenten-Analyse",
    "cta.kuralBaslik": "Pfadbasierte Regel hinzufügen",
    "cta.kuralMetin1": "robots.txt ist eine Bitte; eine Veylify-Regel ist Durchsetzung. Für geschützte Pfade (z. B.",
    "cta.kuralMetin2": ") blockieren Sie eingehende Bot-Anfragen zwingend mit einer pfadbasierten Regel.",
    "cta.kuralButon": "Regel erstellen",

    "ref.baslik": "Referenz: geschützte Pfade (repräsentative robots.txt)",
    "ref.metin":
      "Die Konformitätsanalyse basiert auf den repräsentativen {disallow}-Regeln unten. Eine KI-Bot-Anfrage an einen dieser Pfade (und ihre Unterpfade) zählt als Konformitätsverstoß.",
    "ref.disallowVurgu": "Disallow",
    "ref.uyari":
      "Dies ist nicht die robots.txt-Datei einer echten Website; es ist eine {temsili} Menge von Pfaden, die branchenweit häufig geschützt werden. Die echte robots.txt jeder Website abzurufen und Regel für Regel zu vergleichen (Disallow-Parsing pro Website) ist eine geplante nächste Verbesserung. Die aktuelle Analyse vergleicht beobachteten KI-Bot-Traffic ehrlich mit dieser repräsentativen Richtlinie.",
    "ref.temsiliVurgu": "repräsentative",
  },

  fr: {
    baslik: "Auditeur de conformité robots.txt",

    "aciklama.soru": "Les bots qui prétendent respecter robots.txt l'ont-ils vraiment fait ?",
    "aciklama.metin":
      "Nous comparons le trafic de bots IA observé à une politique robots.txt représentative. Si un bot dit \"je respecte robots.txt\" mais a envoyé une requête vers un chemin protégé (Disallow) — c'est une {ihlal} et le bot ment sur sa conformité.",
    "aciklama.ihlalVurgu": "violation",

    "ozet.aiIstek": "Requêtes IA observées (30 j)",
    "ozet.ihlal": "Violations détectées",
    "ozet.ihlalliAjan": "Agents rompant leur engagement",
    "ozet.ortUyum": "Taux de conformité moy. (engagés)",

    "bulgu.metin": "{n} agents ont affirmé respecter robots.txt tout en envoyant des requêtes vers des chemins protégés.",
    "bulgu.enKritik": "Constat le plus critique :",
    "bulgu.ihlalEk": "{n} violations",
    "bulgu.kuyruk": ". Développez ci-dessous pour voir quels chemins ils ont enfreints.",

    "durum.uyumlu": "Conforme",
    "durum.ihlal": "VIOLATION",
    "durum.taahhut_yok": "Aucun engagement",

    "ajan.baslik": "Conformité par agent",
    "ajan.bosBaslik": "Aucun trafic de bot IA pour l'instant",
    "ajan.bosMetin":
      "Au cours des 30 derniers jours, aucun des bots IA de notre catalogue n'a envoyé de requêtes vers vos sites. L'analyse de conformité apparaîtra ici dès l'arrivée de trafic.",
    "ajan.saygiTaahhut": "s'engage à respecter robots",
    "ajan.taahhutYok": "aucun engagement de conformité",
    "ajan.uyumEk": "{n}% conforme",
    "ajan.istek": "requêtes",
    "ajan.ihlal": "violations",
    "ajan.cignenenYollar": "Chemins protégés enfreints",
    "ajan.istekSayi": "{n} requêtes",
    "ajan.celiskiUyari":
      "Cet agent déclare obéir à robots.txt ; il a pourtant envoyé des requêtes vers les chemins protégés ci-dessus. Son engagement contredit son comportement.",

    "cta.baslik": "Que devriez-vous faire ?",
    "cta.engelleBaslik": "Bloquer l'agent contrevenant",
    "cta.engelleMetin":
      "Pour les agents prouvés enfreindre robots.txt, appliquez une politique \"Bloquer\" depuis Renseignement agents IA. Au lieu de faire confiance à la parole d'un bot qui ignore son engagement, arrêtez-le au niveau réseau.",
    "cta.engelleButon": "Renseignement agents IA",
    "cta.kuralBaslik": "Ajouter une règle par chemin",
    "cta.kuralMetin1": "robots.txt est une demande ; une règle Veylify est une application. Pour les chemins protégés (p. ex.",
    "cta.kuralMetin2": ") bloquez obligatoirement les requêtes de bots entrantes avec une règle par chemin.",
    "cta.kuralButon": "Créer une règle",

    "ref.baslik": "Référence : chemins protégés (robots.txt représentatif)",
    "ref.metin":
      "L'analyse de conformité repose sur les règles {disallow} représentatives ci-dessous. Une requête de bot IA vers l'un de ces chemins (et leurs sous-chemins) compte comme une violation de conformité.",
    "ref.disallowVurgu": "Disallow",
    "ref.uyari":
      "Ceci n'est pas le fichier robots.txt d'un site réel ; c'est un ensemble {temsili} de chemins couramment protégés dans le secteur. Récupérer le vrai robots.txt de chaque site et comparer règle par règle (analyse Disallow par site) est une prochaine amélioration prévue. L'analyse actuelle compare honnêtement le trafic de bots IA observé à cette politique représentative.",
    "ref.temsiliVurgu": "représentatif",
  },

  es: {
    baslik: "Auditor de cumplimiento de robots.txt",

    "aciklama.soru": "¿Los bots que afirman seguir robots.txt realmente lo siguieron?",
    "aciklama.metin":
      "Comparamos el tráfico de bots IA observado con una política robots.txt representativa. Si un bot dice \"respeto robots.txt\" pero envió una solicitud a una ruta protegida (Disallow) — eso es una {ihlal} y el bot está mintiendo sobre su cumplimiento.",
    "aciklama.ihlalVurgu": "violación",

    "ozet.aiIstek": "Solicitudes IA observadas (30 d)",
    "ozet.ihlal": "Violaciones detectadas",
    "ozet.ihlalliAjan": "Agentes que rompen su compromiso",
    "ozet.ortUyum": "Tasa de cumplimiento prom. (comprometidos)",

    "bulgu.metin": "{n} agentes afirmaron respetar robots.txt pero enviaron solicitudes a rutas protegidas.",
    "bulgu.enKritik": "Hallazgo más crítico:",
    "bulgu.ihlalEk": "{n} violaciones",
    "bulgu.kuyruk": ". Expande abajo para ver qué rutas infringieron.",

    "durum.uyumlu": "Conforme",
    "durum.ihlal": "VIOLACIÓN",
    "durum.taahhut_yok": "Sin compromiso",

    "ajan.baslik": "Cumplimiento por agente",
    "ajan.bosBaslik": "Aún no hay tráfico de bots IA",
    "ajan.bosMetin":
      "En los últimos 30 días, ninguno de los bots IA de nuestro catálogo envió solicitudes a tus sitios. El análisis de cumplimiento aparecerá aquí a medida que llegue tráfico.",
    "ajan.saygiTaahhut": "se compromete a respetar robots",
    "ajan.taahhutYok": "sin compromiso de cumplimiento",
    "ajan.uyumEk": "{n}% conforme",
    "ajan.istek": "solicitudes",
    "ajan.ihlal": "violaciones",
    "ajan.cignenenYollar": "Rutas protegidas infringidas",
    "ajan.istekSayi": "{n} solicitudes",
    "ajan.celiskiUyari":
      "Este agente declara que obedece robots.txt; aun así envió solicitudes a las rutas protegidas de arriba. Su compromiso contradice su comportamiento.",

    "cta.baslik": "¿Qué deberías hacer?",
    "cta.engelleBaslik": "Bloquea al agente infractor",
    "cta.engelleMetin":
      "Para agentes que se ha probado que rompen robots.txt, aplica una política \"Bloquear\" desde Inteligencia de agentes IA. En lugar de confiar en la palabra de un bot que ignora su compromiso, deténlo en la capa de red.",
    "cta.engelleButon": "Inteligencia de agentes IA",
    "cta.kuralBaslik": "Añadir una regla por ruta",
    "cta.kuralMetin1": "robots.txt es una petición; una regla de Veylify es una imposición. Para rutas protegidas (p. ej.",
    "cta.kuralMetin2": ") bloquea obligatoriamente las solicitudes de bots entrantes con una regla por ruta.",
    "cta.kuralButon": "Crear regla",

    "ref.baslik": "Referencia: rutas protegidas (robots.txt representativo)",
    "ref.metin":
      "El análisis de cumplimiento se basa en las reglas {disallow} representativas de abajo. Una solicitud de bot IA a cualquiera de estas rutas (y sus subrutas) cuenta como una violación de cumplimiento.",
    "ref.disallowVurgu": "Disallow",
    "ref.uyari":
      "Este no es el archivo robots.txt de un sitio real; es un conjunto {temsili} de rutas comúnmente protegidas en el sector. Obtener el robots.txt real de cada sitio y compararlo regla por regla (análisis de Disallow por sitio) es una próxima mejora planeada. El análisis actual compara honestamente el tráfico de bots IA observado con esta política representativa.",
    "ref.temsiliVurgu": "representativo",
  },
};

export function robotsCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
