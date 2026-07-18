/**
 * AI Ajan Doğrulama — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `aiDogrulamaCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ: enum değerleri (kategori/risk/durum/yöntem/aksiyon id'leri) asla
 * çevrilmez; burada enum-id → çeviri KEY-MAP'leri tutulur ("yontem.ip_aralik",
 * "kategori.model_egitimi", "risk.yuksek", "durum.dogrulandi", "aksiyon.engelle").
 * Lib'deki TR etiket-map'leri (AI_KATEGORI_ETIKET vb.) DÜZENLENMEDEN, istemci tarafı
 * enum id ile bu anahtarlardan yeniden türetilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // başlık (panel.ts'te birebir eşleşen nav anahtarı yok → yerel)
    "x.baslik": "AI Ajan Doğrulama",

    // açıklama şeridi
    "aciklama.baslik": "User-Agent yalan söyleyebilir — IP söyleyemez.",
    "aciklama.metin":
      "Kötü kazıyıcılar UA'larına \"GPTBot\" yazıp meşru bot taklidi yapar. Veylify, iddia edilen her AI ajanını operatörün resmi IP aralığı veya ters-DNS kaydıyla doğrular; eşleşmeyen {sahte} yakalar.",
    "aciklama.sahte": "sahte ajanları",

    // özet kartları
    "ozet.iddia": "AI ajan iddiası ({n} olay)",
    "ozet.dogrulanan": "Doğrulanan (gerçek)",
    "ozet.sahte": "Yakalanan sahte ajan",
    "ozet.oran": "Sahte oranı",

    // canlı doğrulama aracı
    "arac.baslik": "Canlı doğrulama aracı",
    "arac.ipucu": "UA + IP gir, gerçek mi test et",
    "arac.ua": "User-Agent",
    "arac.ip": "Kaynak IP",
    "arac.ptr": "Ters-DNS / PTR (ops.)",
    "arac.gercekGptbot": "Gerçek GPTBot",
    "arac.sahteGptbot": "Sahte GPTBot",
    "arac.perplexity": "Perplexity (PTR)",
    "arac.dogrula": "Doğrula",
    "arac.dogrulaniyor": "Doğrulanıyor…",
    "arac.hata": "Doğrulama yapılamadı",
    "arac.sonucBos": "Sonuç burada görünecek",
    "arac.kanit": "Kanıt:",
    "arac.onerilenAksiyon": "Önerilen aksiyon",

    // yakalanan sahte ajanlar
    "sahteTablo.baslik": "Yakalanan sahte ajanlar ({n})",
    "sahteTablo.ip": "IP",
    "sahteTablo.ulke": "Ülke",
    "sahteTablo.iddia": "İddia edilen",
    "sahteTablo.zaman": "Zaman",
    "sahteTablo.incele": "İncele",
    "sahteTablo.sahtePrefix": "sahte",
    "sahteTablo.tehdit": "Tehdit",

    // doğrulama kataloğu
    "katalog.baslik": "Doğrulama kataloğu",
    "katalog.aciklama":
      "Her AI ajanı için Veylify'ın kullandığı doğrulama yöntemi ve senin trafiğinde gözlemlenen gerçek/sahte sayısı.",
    "katalog.risk": "Risk:",
    "katalog.gercek": "gerçek",
    "katalog.sahte": "sahte",
    "katalog.resmiIp": "Resmi IP yayını",

    // nasıl çalışır şeridi
    "nasil.baslik": "Doğrulama, kural motoruna bağlanır",
    "nasil.metin":
      "\"Doğrula\" aksiyonu alan AI ajanlarını yalnızca IP/DNS doğrulanınca geçir; sahte olanları otomatik engelle. AI politikalarını AI Ajan İstihbaratı'ndan yönet.",
    "nasil.buton": "AI ajan politikaları",

    // enum: doğrulama yöntemi
    "yontem.ip_aralik": "IP aralığı",
    "yontem.reverse_dns": "Ters-DNS",
    "yontem.yok": "Yok",

    // enum: kategori
    "kategori.model_egitimi": "Model eğitimi",
    "kategori.canli_getirme": "Canlı getirme",
    "kategori.arama_indeksi": "Arama indeksi",
    "kategori.ajan_tarayici": "Otonom ajan",
    "kategori.veri_kaziyici": "Veri kazıyıcı",

    // enum: risk
    "risk.dusuk": "Düşük",
    "risk.orta": "Orta",
    "risk.yuksek": "Yüksek",
    "risk.kritik": "Kritik",

    // enum: doğrulama durumu
    "durum.dogrulandi": "Doğrulandı",
    "durum.sahte": "Sahte (spoof)",
    "durum.dogrulanamaz": "Doğrulanamaz",
    "durum.ptr_yok": "PTR bekliyor",

    // enum: önerilen aksiyon
    "aksiyon.izin": "İzin ver",
    "aksiyon.dogrula": "Doğrula",
    "aksiyon.engelle": "Engelle",

    // sonuç açıklaması (API lib TR döner; istemci enum+kanıttan yeniden türetir)
    "sonuc.dogrulandi.ip": "Kaynak IP operatörün resmi aralığında ({kanit}). Gerçek ajan.",
    "sonuc.dogrulandi.dns": "Ters-DNS kaydı operatör alan adıyla bitiyor. Gerçek ajan.",
    "sonuc.sahte.ip": "User-Agent bu ajanı iddia ediyor ama IP operatörün resmi aralıklarının HİÇBİRİNDE değil. SAHTE ajan — muhtemelen taklit eden kazıyıcı.",
    "sonuc.sahte.dns": "Ters-DNS kaydı operatör alan adıyla eşleşmiyor. SAHTE ajan.",
    "sonuc.dogrulanamaz": "Operatör doğrulanabilir IP aralığı/DNS yayınlamıyor. User-Agent'a güvenilemez; davranışla değerlendirin.",
    "sonuc.ptr_yok": "Doğrulama için ters-DNS (PTR) gerekli ama sağlanmadı. Çözülene kadar güvenli değil.",
  },
  en: {
    "x.baslik": "AI Agent Verification",

    "aciklama.baslik": "A User-Agent can lie — an IP can't.",
    "aciklama.metin":
      "Malicious scrapers put \"GPTBot\" in their UA to impersonate a legitimate bot. Veylify verifies every claimed AI agent against the operator's official IP range or reverse-DNS record; it catches the {sahte} that don't match.",
    "aciklama.sahte": "fake agents",

    "ozet.iddia": "AI agent claims ({n} events)",
    "ozet.dogrulanan": "Verified (real)",
    "ozet.sahte": "Fake agents caught",
    "ozet.oran": "Fake rate",

    "arac.baslik": "Live verification tool",
    "arac.ipucu": "Enter a UA + IP, test if it's real",
    "arac.ua": "User-Agent",
    "arac.ip": "Source IP",
    "arac.ptr": "Reverse-DNS / PTR (opt.)",
    "arac.gercekGptbot": "Real GPTBot",
    "arac.sahteGptbot": "Fake GPTBot",
    "arac.perplexity": "Perplexity (PTR)",
    "arac.dogrula": "Verify",
    "arac.dogrulaniyor": "Verifying…",
    "arac.hata": "Verification failed",
    "arac.sonucBos": "The result will appear here",
    "arac.kanit": "Evidence:",
    "arac.onerilenAksiyon": "Recommended action",

    "sahteTablo.baslik": "Fake agents caught ({n})",
    "sahteTablo.ip": "IP",
    "sahteTablo.ulke": "Country",
    "sahteTablo.iddia": "Claimed",
    "sahteTablo.zaman": "Time",
    "sahteTablo.incele": "Inspect",
    "sahteTablo.sahtePrefix": "fake",
    "sahteTablo.tehdit": "Threat",

    "katalog.baslik": "Verification catalog",
    "katalog.aciklama":
      "For each AI agent, the verification method Veylify uses and the real/fake counts observed in your traffic.",
    "katalog.risk": "Risk:",
    "katalog.gercek": "real",
    "katalog.sahte": "fake",
    "katalog.resmiIp": "Official IP publication",

    "nasil.baslik": "Verification wires into the rule engine",
    "nasil.metin":
      "Let AI agents with a \"Verify\" action through only once IP/DNS checks out; block fakes automatically. Manage AI policies from AI Agent Intelligence.",
    "nasil.buton": "AI agent policies",

    "yontem.ip_aralik": "IP range",
    "yontem.reverse_dns": "Reverse-DNS",
    "yontem.yok": "None",

    "kategori.model_egitimi": "Model training",
    "kategori.canli_getirme": "Live fetch",
    "kategori.arama_indeksi": "Search index",
    "kategori.ajan_tarayici": "Autonomous agent",
    "kategori.veri_kaziyici": "Data scraper",

    "risk.dusuk": "Low",
    "risk.orta": "Medium",
    "risk.yuksek": "High",
    "risk.kritik": "Critical",

    "durum.dogrulandi": "Verified",
    "durum.sahte": "Fake (spoof)",
    "durum.dogrulanamaz": "Unverifiable",
    "durum.ptr_yok": "Awaiting PTR",

    "aksiyon.izin": "Allow",
    "aksiyon.dogrula": "Verify",
    "aksiyon.engelle": "Block",

    "sonuc.dogrulandi.ip": "The source IP is in the operator's official range ({kanit}). Real agent.",
    "sonuc.dogrulandi.dns": "The reverse-DNS record ends with the operator domain. Real agent.",
    "sonuc.sahte.ip": "The User-Agent claims this agent, but the IP is in NONE of the operator's official ranges. FAKE agent — likely an impersonating scraper.",
    "sonuc.sahte.dns": "The reverse-DNS record does not match the operator domain. FAKE agent.",
    "sonuc.dogrulanamaz": "The operator publishes no verifiable IP range/DNS. The User-Agent can't be trusted; assess by behavior.",
    "sonuc.ptr_yok": "Reverse-DNS (PTR) is required for verification but was not provided. Not safe until resolved.",
  },
  de: {
    "x.baslik": "KI-Agenten-Verifizierung",

    "aciklama.baslik": "Ein User-Agent kann lügen — eine IP nicht.",
    "aciklama.metin":
      "Bösartige Scraper tragen \"GPTBot\" in ihren UA ein, um einen legitimen Bot vorzutäuschen. Veylify prüft jeden behaupteten KI-Agenten anhand des offiziellen IP-Bereichs oder Reverse-DNS-Eintrags des Betreibers und erkennt die {sahte}, die nicht übereinstimmen.",
    "aciklama.sahte": "gefälschten Agenten",

    "ozet.iddia": "KI-Agenten-Behauptungen ({n} Ereignisse)",
    "ozet.dogrulanan": "Verifiziert (echt)",
    "ozet.sahte": "Erkannte Fälschungen",
    "ozet.oran": "Fälschungsrate",

    "arac.baslik": "Live-Verifizierungstool",
    "arac.ipucu": "UA + IP eingeben, auf Echtheit prüfen",
    "arac.ua": "User-Agent",
    "arac.ip": "Quell-IP",
    "arac.ptr": "Reverse-DNS / PTR (opt.)",
    "arac.gercekGptbot": "Echter GPTBot",
    "arac.sahteGptbot": "Gefälschter GPTBot",
    "arac.perplexity": "Perplexity (PTR)",
    "arac.dogrula": "Verifizieren",
    "arac.dogrulaniyor": "Wird verifiziert…",
    "arac.hata": "Verifizierung fehlgeschlagen",
    "arac.sonucBos": "Das Ergebnis erscheint hier",
    "arac.kanit": "Nachweis:",
    "arac.onerilenAksiyon": "Empfohlene Aktion",

    "sahteTablo.baslik": "Erkannte Fälschungen ({n})",
    "sahteTablo.ip": "IP",
    "sahteTablo.ulke": "Land",
    "sahteTablo.iddia": "Behauptet",
    "sahteTablo.zaman": "Zeit",
    "sahteTablo.incele": "Untersuchen",
    "sahteTablo.sahtePrefix": "gefälschter",
    "sahteTablo.tehdit": "Bedrohung",

    "katalog.baslik": "Verifizierungskatalog",
    "katalog.aciklama":
      "Für jeden KI-Agenten die von Veylify verwendete Verifizierungsmethode und die in Ihrem Traffic beobachtete Anzahl echter/gefälschter.",
    "katalog.risk": "Risiko:",
    "katalog.gercek": "echt",
    "katalog.sahte": "gefälscht",
    "katalog.resmiIp": "Offizielle IP-Veröffentlichung",

    "nasil.baslik": "Verifizierung greift in die Regel-Engine",
    "nasil.metin":
      "Lassen Sie KI-Agenten mit \"Verifizieren\"-Aktion erst durch, wenn IP/DNS stimmen; blockieren Sie Fälschungen automatisch. Verwalten Sie KI-Richtlinien über die KI-Agenten-Analyse.",
    "nasil.buton": "KI-Agenten-Richtlinien",

    "yontem.ip_aralik": "IP-Bereich",
    "yontem.reverse_dns": "Reverse-DNS",
    "yontem.yok": "Keine",

    "kategori.model_egitimi": "Modelltraining",
    "kategori.canli_getirme": "Live-Abruf",
    "kategori.arama_indeksi": "Suchindex",
    "kategori.ajan_tarayici": "Autonomer Agent",
    "kategori.veri_kaziyici": "Daten-Scraper",

    "risk.dusuk": "Niedrig",
    "risk.orta": "Mittel",
    "risk.yuksek": "Hoch",
    "risk.kritik": "Kritisch",

    "durum.dogrulandi": "Verifiziert",
    "durum.sahte": "Gefälscht (Spoof)",
    "durum.dogrulanamaz": "Nicht verifizierbar",
    "durum.ptr_yok": "Wartet auf PTR",

    "aksiyon.izin": "Zulassen",
    "aksiyon.dogrula": "Verifizieren",
    "aksiyon.engelle": "Blockieren",

    "sonuc.dogrulandi.ip": "Die Quell-IP liegt im offiziellen Bereich des Betreibers ({kanit}). Echter Agent.",
    "sonuc.dogrulandi.dns": "Der Reverse-DNS-Eintrag endet mit der Betreiberdomain. Echter Agent.",
    "sonuc.sahte.ip": "Der User-Agent behauptet diesen Agenten, doch die IP liegt in KEINEM der offiziellen Bereiche des Betreibers. GEFÄLSCHTER Agent — vermutlich ein imitierender Scraper.",
    "sonuc.sahte.dns": "Der Reverse-DNS-Eintrag stimmt nicht mit der Betreiberdomain überein. GEFÄLSCHTER Agent.",
    "sonuc.dogrulanamaz": "Der Betreiber veröffentlicht keinen verifizierbaren IP-Bereich/DNS. Dem User-Agent kann nicht vertraut werden; anhand des Verhaltens bewerten.",
    "sonuc.ptr_yok": "Reverse-DNS (PTR) ist zur Verifizierung erforderlich, wurde aber nicht bereitgestellt. Bis zur Auflösung nicht sicher.",
  },
  fr: {
    "x.baslik": "Vérification d'agent IA",

    "aciklama.baslik": "Un User-Agent peut mentir — pas une IP.",
    "aciklama.metin":
      "Les scrapers malveillants inscrivent \"GPTBot\" dans leur UA pour usurper un bot légitime. Veylify vérifie chaque agent IA revendiqué face à la plage d'IP officielle ou l'enregistrement reverse-DNS de l'opérateur ; il repère les {sahte} qui ne correspondent pas.",
    "aciklama.sahte": "faux agents",

    "ozet.iddia": "Revendications d'agent IA ({n} événements)",
    "ozet.dogrulanan": "Vérifiés (réels)",
    "ozet.sahte": "Faux agents détectés",
    "ozet.oran": "Taux de faux",

    "arac.baslik": "Outil de vérification en direct",
    "arac.ipucu": "Saisissez un UA + IP, testez son authenticité",
    "arac.ua": "User-Agent",
    "arac.ip": "IP source",
    "arac.ptr": "Reverse-DNS / PTR (fac.)",
    "arac.gercekGptbot": "Vrai GPTBot",
    "arac.sahteGptbot": "Faux GPTBot",
    "arac.perplexity": "Perplexity (PTR)",
    "arac.dogrula": "Vérifier",
    "arac.dogrulaniyor": "Vérification…",
    "arac.hata": "Échec de la vérification",
    "arac.sonucBos": "Le résultat s'affichera ici",
    "arac.kanit": "Preuve :",
    "arac.onerilenAksiyon": "Action recommandée",

    "sahteTablo.baslik": "Faux agents détectés ({n})",
    "sahteTablo.ip": "IP",
    "sahteTablo.ulke": "Pays",
    "sahteTablo.iddia": "Revendiqué",
    "sahteTablo.zaman": "Heure",
    "sahteTablo.incele": "Inspecter",
    "sahteTablo.sahtePrefix": "faux",
    "sahteTablo.tehdit": "Menace",

    "katalog.baslik": "Catalogue de vérification",
    "katalog.aciklama":
      "Pour chaque agent IA, la méthode de vérification utilisée par Veylify et le nombre de réels/faux observés dans votre trafic.",
    "katalog.risk": "Risque :",
    "katalog.gercek": "réels",
    "katalog.sahte": "faux",
    "katalog.resmiIp": "Publication IP officielle",

    "nasil.baslik": "La vérification se branche au moteur de règles",
    "nasil.metin":
      "Ne laissez passer les agents IA avec une action \"Vérifier\" qu'une fois l'IP/DNS validé ; bloquez les faux automatiquement. Gérez les politiques IA depuis Renseignement agents IA.",
    "nasil.buton": "Politiques d'agent IA",

    "yontem.ip_aralik": "Plage d'IP",
    "yontem.reverse_dns": "Reverse-DNS",
    "yontem.yok": "Aucune",

    "kategori.model_egitimi": "Entraînement de modèle",
    "kategori.canli_getirme": "Récupération en direct",
    "kategori.arama_indeksi": "Index de recherche",
    "kategori.ajan_tarayici": "Agent autonome",
    "kategori.veri_kaziyici": "Scraper de données",

    "risk.dusuk": "Faible",
    "risk.orta": "Moyen",
    "risk.yuksek": "Élevé",
    "risk.kritik": "Critique",

    "durum.dogrulandi": "Vérifié",
    "durum.sahte": "Faux (spoof)",
    "durum.dogrulanamaz": "Invérifiable",
    "durum.ptr_yok": "En attente de PTR",

    "aksiyon.izin": "Autoriser",
    "aksiyon.dogrula": "Vérifier",
    "aksiyon.engelle": "Bloquer",

    "sonuc.dogrulandi.ip": "L'IP source est dans la plage officielle de l'opérateur ({kanit}). Agent réel.",
    "sonuc.dogrulandi.dns": "L'enregistrement reverse-DNS se termine par le domaine de l'opérateur. Agent réel.",
    "sonuc.sahte.ip": "Le User-Agent revendique cet agent, mais l'IP n'est dans AUCUNE des plages officielles de l'opérateur. Faux agent — probablement un scraper usurpateur.",
    "sonuc.sahte.dns": "L'enregistrement reverse-DNS ne correspond pas au domaine de l'opérateur. Faux agent.",
    "sonuc.dogrulanamaz": "L'opérateur ne publie aucune plage d'IP/DNS vérifiable. Le User-Agent n'est pas fiable ; évaluez par le comportement.",
    "sonuc.ptr_yok": "Le reverse-DNS (PTR) est requis pour la vérification mais n'a pas été fourni. Non sûr jusqu'à résolution.",
  },
  es: {
    "x.baslik": "Verificación de agente IA",

    "aciklama.baslik": "Un User-Agent puede mentir — una IP no.",
    "aciklama.metin":
      "Los scrapers maliciosos ponen \"GPTBot\" en su UA para suplantar a un bot legítimo. Veylify verifica cada agente IA reclamado contra el rango de IP oficial o el registro reverse-DNS del operador; detecta los {sahte} que no coinciden.",
    "aciklama.sahte": "agentes falsos",

    "ozet.iddia": "Reclamaciones de agente IA ({n} eventos)",
    "ozet.dogrulanan": "Verificados (reales)",
    "ozet.sahte": "Agentes falsos detectados",
    "ozet.oran": "Tasa de falsos",

    "arac.baslik": "Herramienta de verificación en vivo",
    "arac.ipucu": "Introduce un UA + IP, comprueba si es real",
    "arac.ua": "User-Agent",
    "arac.ip": "IP de origen",
    "arac.ptr": "Reverse-DNS / PTR (opc.)",
    "arac.gercekGptbot": "GPTBot real",
    "arac.sahteGptbot": "GPTBot falso",
    "arac.perplexity": "Perplexity (PTR)",
    "arac.dogrula": "Verificar",
    "arac.dogrulaniyor": "Verificando…",
    "arac.hata": "Error de verificación",
    "arac.sonucBos": "El resultado aparecerá aquí",
    "arac.kanit": "Prueba:",
    "arac.onerilenAksiyon": "Acción recomendada",

    "sahteTablo.baslik": "Agentes falsos detectados ({n})",
    "sahteTablo.ip": "IP",
    "sahteTablo.ulke": "País",
    "sahteTablo.iddia": "Reclamado",
    "sahteTablo.zaman": "Hora",
    "sahteTablo.incele": "Inspeccionar",
    "sahteTablo.sahtePrefix": "falso",
    "sahteTablo.tehdit": "Amenaza",

    "katalog.baslik": "Catálogo de verificación",
    "katalog.aciklama":
      "Para cada agente IA, el método de verificación que usa Veylify y el número de reales/falsos observados en tu tráfico.",
    "katalog.risk": "Riesgo:",
    "katalog.gercek": "reales",
    "katalog.sahte": "falsos",
    "katalog.resmiIp": "Publicación IP oficial",

    "nasil.baslik": "La verificación se conecta al motor de reglas",
    "nasil.metin":
      "Deja pasar a los agentes IA con acción \"Verificar\" solo cuando la IP/DNS coincida; bloquea los falsos automáticamente. Gestiona las políticas de IA desde Inteligencia de agentes IA.",
    "nasil.buton": "Políticas de agente IA",

    "yontem.ip_aralik": "Rango de IP",
    "yontem.reverse_dns": "Reverse-DNS",
    "yontem.yok": "Ninguno",

    "kategori.model_egitimi": "Entrenamiento de modelo",
    "kategori.canli_getirme": "Recuperación en vivo",
    "kategori.arama_indeksi": "Índice de búsqueda",
    "kategori.ajan_tarayici": "Agente autónomo",
    "kategori.veri_kaziyici": "Scraper de datos",

    "risk.dusuk": "Bajo",
    "risk.orta": "Medio",
    "risk.yuksek": "Alto",
    "risk.kritik": "Crítico",

    "durum.dogrulandi": "Verificado",
    "durum.sahte": "Falso (spoof)",
    "durum.dogrulanamaz": "No verificable",
    "durum.ptr_yok": "Esperando PTR",

    "aksiyon.izin": "Permitir",
    "aksiyon.dogrula": "Verificar",
    "aksiyon.engelle": "Bloquear",

    "sonuc.dogrulandi.ip": "La IP de origen está en el rango oficial del operador ({kanit}). Agente real.",
    "sonuc.dogrulandi.dns": "El registro reverse-DNS termina con el dominio del operador. Agente real.",
    "sonuc.sahte.ip": "El User-Agent reclama este agente, pero la IP no está en NINGUNO de los rangos oficiales del operador. Agente FALSO — probablemente un scraper suplantador.",
    "sonuc.sahte.dns": "El registro reverse-DNS no coincide con el dominio del operador. Agente FALSO.",
    "sonuc.dogrulanamaz": "El operador no publica un rango de IP/DNS verificable. No se puede confiar en el User-Agent; evalúa por comportamiento.",
    "sonuc.ptr_yok": "El reverse-DNS (PTR) es necesario para la verificación pero no se proporcionó. No es seguro hasta resolverlo.",
  },
};

/** Anahtarı hedef dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function aiDogrulamaCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
