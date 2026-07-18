/**
 * Otomatik Düzeltme sayfası — yerel i18n sözlüğü.
 *
 * Panel geneli `ceviri()` yerine bu yerel `odCeviri()` kullanılır; böylece
 * sayfaya özgü uzun metinler ana sözlüğü şişirmez. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ:
 *   - `action.*` anahtarları RuleAction enum değerlerini (allow/challenge/block/
 *     flag) çevirir; enum değerleri asla çevrilmez, yalnızca gösterim etiketi.
 *     Böylece lib'deki ACTION_ETIKET'e dokunmadan istemci tarafında yeniden
 *     türetilir.
 *   - `tur.*` anahtarları SavunmaBosluk["tur"] enum değerlerini (asn/botClass/
 *     country) çevirir; aynı gerekçeyle lib'deki TUR_ETIKET yerine kullanılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // açıklama şeridi
    "aciklama.baslik": "Boşluğu bul → kural üret → sandbox'ta kanıtla → sadece güvenli olanı öner.",
    "aciklama.p1a": "Sıradan kural önerisi \"bu kural şunu yakalar\" der ama",
    "aciklama.p1kanit": "kanıtlamaz",
    "aciklama.p1b": ". Bu motor her aday kuralı",
    "aciklama.sandbox": "sandbox",
    "aciklama.p1c": "'ta canlı kurallarının üstüne birikimli çalıştırır ve yalnızca",
    "aciklama.p1garanti": "net savunma artışı + 0 regresyon + 0 yanlış-pozitif",
    "aciklama.p1d": "garantileyen kuralları onaylar. Yani \"eklersen hiçbir şey bozulmaz, savunma artar\" ispatı.",

    // boş durum
    "bos.baslik": "Otomatik iyileştirme için belirgin boşluk yok",
    "bos.metin": "Gözlemlenen {olay} olayda mevcut {kural} kuralın kapatmadığı yoğun ve saf bir tehdit kümesi bulunamadı. Trafik değiştikçe yeniden çalıştır.",

    // özet statlar
    "stat.onaylanan": "Onaylanan kural",
    "stat.reddedilen": "Reddedilen aday",
    "stat.netKazanim": "Net savunma kazanımı (puan)",
    "stat.engellenen": "Tahmini engellenecek istek",

    // onaylanan yama seti
    "onay.baslik": "Onaylanan yama seti ({n})",
    "onay.bos": "Hiçbir aday güvenlik kapısından geçemedi — hepsi regresyon ya da yanlış-pozitif üretti.",
    "onay.uygulanabilir": "{n} kural güvenle uygulanabilir",
    "onay.uygulanabilirAlt": "Hepsi sandbox'ta doğrulandı: 0 regresyon, 0 yanlış-pozitif. Uygulama üretime dokunmaz — onay senin.",
    "onay.yamaButon": "Yama seti (.txt)",
    "onay.kurallarButon": "Kurallar ekranı",

    // reddedilen
    "red.baslik": "Reddedilen adaylar ({n})",
    "red.aciklama": "Bu kurallar sentezlendi ama sandbox doğrulamasını geçemedi — motor onları senin yerine eledi. Kör kural eklemenin önlediği hatalar bunlar.",

    // yöntem notu
    "not.a": "Boşluklar",
    "not.gercek": "gerçek gözlemlenen olaylardan",
    "not.b": "(kötü trafiğin yoğunlaştığı, meşru karışımı düşük ASN/bot-sınıfı/ülke) çıkarılır; her aday kural",
    "not.c": "motorunda temsili trafik yakalamalarına karşı doğrulanır. Onay tamamen sende — motor kural",
    "not.onerir": "önerir",
    "not.d": ", üretime yazmaz.",

    // sonuç kartı
    "kart.puan": "+{n} puan",
    "kart.eger": "EĞER",
    "kart.sandboxDetay": "Sandbox detayı",
    "kart.sandboxDogrulama": "Sandbox doğrulaması ({n} yakalama)",
    "kart.kol.yakalama": "Yakalama",
    "kart.kol.iyilesme": "İyileşme",
    "kart.kol.regresyon": "Regresyon",
    "kart.kol.yanlisPoz": "Yanlış-poz",
    "kart.kol.net": "Net",

    // enum: RuleAction (gösterim etiketi — enum değeri değil)
    "action.allow": "İzin ver",
    "action.challenge": "Doğrula",
    "action.block": "Engelle",
    "action.flag": "İşaretle",

    // enum: SavunmaBosluk["tur"]
    "tur.asn": "ASN / Ağ",
    "tur.botClass": "Bot sınıfı",
    "tur.country": "Ülke",

    // yama .txt (indirilen dosya içeriği)
    "yama.baslik": "SPECTER — OTOMATİK DÜZELTME YAMA SETİ",
    "yama.gozlem": "Gözlemlenen olay: {olay} · Mevcut kural: {kural}",
    "yama.onaySatir": "Onaylanan kural: {onay} / {aday} aday",
    "yama.kazanim": "Net savunma kazanımı: +{kazanim} puan · Tahmini engellenecek: {engel} istek",
    "yama.onayBaslik": "ONAYLANAN KURALLAR (sandbox-doğrulanmış, 0 regresyon 0 yanlış-pozitif):",
    "yama.redBaslik": "REDDEDİLEN ADAYLAR (güvenli değil):",
    "yama.not": "Not: Her kural sandbox motorunda canlı kuralların üstüne birikimli doğrulandı. Uygulama üretime dokunmaz; onay senin.",
    "yama.puan": "puan",
    "yama.eger": "EĞER",
    "yama.dosyaAd": "oto-duzeltme-yama.txt",
  },

  en: {
    "aciklama.baslik": "Find the gap → synthesize a rule → prove it in the sandbox → only recommend the safe ones.",
    "aciklama.p1a": "An ordinary rule suggestion says \"this rule catches that\" but never",
    "aciklama.p1kanit": "proves it",
    "aciklama.p1b": ". This engine runs each candidate rule",
    "aciklama.sandbox": "sandbox",
    "aciklama.p1c": " cumulatively on top of your live rules and only",
    "aciklama.p1garanti": "net defense gain + 0 regressions + 0 false positives",
    "aciklama.p1d": "approves the rules that guarantee it. In other words, proof that \"adding this breaks nothing and increases defense.\"",

    "bos.baslik": "No clear gap to auto-remediate",
    "bos.metin": "Across the {olay} observed events, no dense, pure threat cluster left uncovered by your {kural} existing rules was found. Re-run as traffic shifts.",

    "stat.onaylanan": "Approved rules",
    "stat.reddedilen": "Rejected candidates",
    "stat.netKazanim": "Net defense gain (points)",
    "stat.engellenen": "Estimated requests blocked",

    "onay.baslik": "Approved patch set ({n})",
    "onay.bos": "No candidate cleared the safety gate — all produced regressions or false positives.",
    "onay.uygulanabilir": "{n} rules can be applied safely",
    "onay.uygulanabilirAlt": "All validated in the sandbox: 0 regressions, 0 false positives. Applying never touches production — the approval is yours.",
    "onay.yamaButon": "Patch set (.txt)",
    "onay.kurallarButon": "Rules screen",

    "red.baslik": "Rejected candidates ({n})",
    "red.aciklama": "These rules were synthesized but failed sandbox validation — the engine culled them for you. These are the mistakes that adding a blind rule would have caused.",

    "not.a": "Gaps are derived from",
    "not.gercek": "real observed events",
    "not.b": "(ASN/bot-class/country where bad traffic concentrates and the legitimate mix is low); each candidate rule is validated in the",
    "not.c": "engine against representative traffic captures. The approval is entirely yours — the engine",
    "not.onerir": "recommends",
    "not.d": " rules, it never writes to production.",

    "kart.puan": "+{n} points",
    "kart.eger": "IF",
    "kart.sandboxDetay": "Sandbox detail",
    "kart.sandboxDogrulama": "Sandbox validation ({n} captures)",
    "kart.kol.yakalama": "Capture",
    "kart.kol.iyilesme": "Improvement",
    "kart.kol.regresyon": "Regression",
    "kart.kol.yanlisPoz": "False pos.",
    "kart.kol.net": "Net",

    "action.allow": "Allow",
    "action.challenge": "Challenge",
    "action.block": "Block",
    "action.flag": "Flag",

    "tur.asn": "ASN / Network",
    "tur.botClass": "Bot class",
    "tur.country": "Country",

    "yama.baslik": "SPECTER — AUTO-REMEDIATION PATCH SET",
    "yama.gozlem": "Observed events: {olay} · Existing rules: {kural}",
    "yama.onaySatir": "Approved rules: {onay} / {aday} candidates",
    "yama.kazanim": "Net defense gain: +{kazanim} points · Estimated blocked: {engel} requests",
    "yama.onayBaslik": "APPROVED RULES (sandbox-validated, 0 regressions 0 false positives):",
    "yama.redBaslik": "REJECTED CANDIDATES (not safe):",
    "yama.not": "Note: Each rule was validated cumulatively on top of your live rules in the sandbox engine. Applying never touches production; the approval is yours.",
    "yama.puan": "points",
    "yama.eger": "IF",
    "yama.dosyaAd": "auto-remediation-patch.txt",
  },

  de: {
    "aciklama.baslik": "Lücke finden → Regel erzeugen → in der Sandbox beweisen → nur die sicheren empfehlen.",
    "aciklama.p1a": "Ein gewöhnlicher Regelvorschlag sagt \"diese Regel fängt das ab\", aber",
    "aciklama.p1kanit": "beweist es nie",
    "aciklama.p1b": ". Diese Engine führt jede Kandidatenregel",
    "aciklama.sandbox": "Sandbox",
    "aciklama.p1c": " kumulativ zusätzlich zu Ihren Live-Regeln aus und genehmigt nur",
    "aciklama.p1garanti": "Netto-Abwehrgewinn + 0 Regressionen + 0 Fehlalarme",
    "aciklama.p1d": "die Regeln, die dies garantieren. Also der Beweis: \"Das Hinzufügen bricht nichts und erhöht die Abwehr.\"",

    "bos.baslik": "Keine klare Lücke zur automatischen Behebung",
    "bos.metin": "Über die {olay} beobachteten Ereignisse wurde kein dichtes, reines Bedrohungscluster gefunden, das von Ihren {kural} bestehenden Regeln nicht abgedeckt wird. Bei sich änderndem Traffic erneut ausführen.",

    "stat.onaylanan": "Genehmigte Regeln",
    "stat.reddedilen": "Abgelehnte Kandidaten",
    "stat.netKazanim": "Netto-Abwehrgewinn (Punkte)",
    "stat.engellenen": "Geschätzt blockierte Anfragen",

    "onay.baslik": "Genehmigtes Patch-Set ({n})",
    "onay.bos": "Kein Kandidat hat das Sicherheitstor passiert — alle erzeugten Regressionen oder Fehlalarme.",
    "onay.uygulanabilir": "{n} Regeln können sicher angewendet werden",
    "onay.uygulanabilirAlt": "Alle in der Sandbox validiert: 0 Regressionen, 0 Fehlalarme. Die Anwendung berührt niemals die Produktion — die Freigabe liegt bei Ihnen.",
    "onay.yamaButon": "Patch-Set (.txt)",
    "onay.kurallarButon": "Regeln-Ansicht",

    "red.baslik": "Abgelehnte Kandidaten ({n})",
    "red.aciklama": "Diese Regeln wurden synthetisiert, bestanden aber die Sandbox-Validierung nicht — die Engine hat sie für Sie aussortiert. Das sind die Fehler, die eine blinde Regel verursacht hätte.",

    "not.a": "Lücken werden aus",
    "not.gercek": "echten beobachteten Ereignissen",
    "not.b": "abgeleitet (ASN/Bot-Klasse/Land, wo sich schlechter Traffic konzentriert und der legitime Anteil gering ist); jede Kandidatenregel wird in der",
    "not.c": "-Engine gegen repräsentative Traffic-Erfassungen validiert. Die Freigabe liegt vollständig bei Ihnen — die Engine",
    "not.onerir": "empfiehlt",
    "not.d": " Regeln, sie schreibt niemals in die Produktion.",

    "kart.puan": "+{n} Punkte",
    "kart.eger": "WENN",
    "kart.sandboxDetay": "Sandbox-Detail",
    "kart.sandboxDogrulama": "Sandbox-Validierung ({n} Erfassungen)",
    "kart.kol.yakalama": "Erfassung",
    "kart.kol.iyilesme": "Verbesserung",
    "kart.kol.regresyon": "Regression",
    "kart.kol.yanlisPoz": "Fehlalarm",
    "kart.kol.net": "Netto",

    "action.allow": "Zulassen",
    "action.challenge": "Prüfen",
    "action.block": "Blockieren",
    "action.flag": "Markieren",

    "tur.asn": "ASN / Netzwerk",
    "tur.botClass": "Bot-Klasse",
    "tur.country": "Land",

    "yama.baslik": "SPECTER — AUTO-BEHEBUNG PATCH-SET",
    "yama.gozlem": "Beobachtete Ereignisse: {olay} · Bestehende Regeln: {kural}",
    "yama.onaySatir": "Genehmigte Regeln: {onay} / {aday} Kandidaten",
    "yama.kazanim": "Netto-Abwehrgewinn: +{kazanim} Punkte · Geschätzt blockiert: {engel} Anfragen",
    "yama.onayBaslik": "GENEHMIGTE REGELN (Sandbox-validiert, 0 Regressionen 0 Fehlalarme):",
    "yama.redBaslik": "ABGELEHNTE KANDIDATEN (nicht sicher):",
    "yama.not": "Hinweis: Jede Regel wurde in der Sandbox-Engine kumulativ zusätzlich zu Ihren Live-Regeln validiert. Die Anwendung berührt niemals die Produktion; die Freigabe liegt bei Ihnen.",
    "yama.puan": "Punkte",
    "yama.eger": "WENN",
    "yama.dosyaAd": "auto-behebung-patch.txt",
  },

  fr: {
    "aciklama.baslik": "Trouver l'écart → synthétiser une règle → la prouver dans le bac à sable → ne recommander que les sûres.",
    "aciklama.p1a": "Une suggestion de règle ordinaire dit \"cette règle attrape cela\" mais ne le",
    "aciklama.p1kanit": "prouve jamais",
    "aciklama.p1b": ". Ce moteur exécute chaque règle candidate",
    "aciklama.sandbox": "bac à sable",
    "aciklama.p1c": " de façon cumulative par-dessus vos règles actives et n'approuve que",
    "aciklama.p1garanti": "gain de défense net + 0 régression + 0 faux positif",
    "aciklama.p1d": "les règles qui le garantissent. Autrement dit, la preuve que \"l'ajouter ne casse rien et augmente la défense.\"",

    "bos.baslik": "Aucun écart clair à corriger automatiquement",
    "bos.metin": "Sur les {olay} événements observés, aucun cluster de menaces dense et pur non couvert par vos {kural} règles existantes n'a été trouvé. Relancez à mesure que le trafic évolue.",

    "stat.onaylanan": "Règles approuvées",
    "stat.reddedilen": "Candidats rejetés",
    "stat.netKazanim": "Gain de défense net (points)",
    "stat.engellenen": "Requêtes bloquées estimées",

    "onay.baslik": "Jeu de correctifs approuvé ({n})",
    "onay.bos": "Aucun candidat n'a franchi la barrière de sécurité — tous ont produit des régressions ou des faux positifs.",
    "onay.uygulanabilir": "{n} règles peuvent être appliquées en toute sécurité",
    "onay.uygulanabilirAlt": "Toutes validées dans le bac à sable : 0 régression, 0 faux positif. L'application ne touche jamais la production — l'approbation vous revient.",
    "onay.yamaButon": "Jeu de correctifs (.txt)",
    "onay.kurallarButon": "Écran des règles",

    "red.baslik": "Candidats rejetés ({n})",
    "red.aciklama": "Ces règles ont été synthétisées mais ont échoué à la validation du bac à sable — le moteur les a écartées pour vous. Voici les erreurs qu'ajouter une règle à l'aveugle aurait causées.",

    "not.a": "Les écarts sont dérivés d'",
    "not.gercek": "événements réels observés",
    "not.b": "(ASN/classe de bot/pays où le mauvais trafic se concentre et le mélange légitime est faible) ; chaque règle candidate est validée dans le moteur",
    "not.c": "contre des captures de trafic représentatives. L'approbation vous revient entièrement — le moteur",
    "not.onerir": "recommande",
    "not.d": " des règles, il n'écrit jamais en production.",

    "kart.puan": "+{n} points",
    "kart.eger": "SI",
    "kart.sandboxDetay": "Détail du bac à sable",
    "kart.sandboxDogrulama": "Validation du bac à sable ({n} captures)",
    "kart.kol.yakalama": "Capture",
    "kart.kol.iyilesme": "Amélioration",
    "kart.kol.regresyon": "Régression",
    "kart.kol.yanlisPoz": "Faux pos.",
    "kart.kol.net": "Net",

    "action.allow": "Autoriser",
    "action.challenge": "Vérifier",
    "action.block": "Bloquer",
    "action.flag": "Signaler",

    "tur.asn": "ASN / Réseau",
    "tur.botClass": "Classe de bot",
    "tur.country": "Pays",

    "yama.baslik": "SPECTER — JEU DE CORRECTIFS DE CORRECTION AUTOMATIQUE",
    "yama.gozlem": "Événements observés : {olay} · Règles existantes : {kural}",
    "yama.onaySatir": "Règles approuvées : {onay} / {aday} candidats",
    "yama.kazanim": "Gain de défense net : +{kazanim} points · Blocage estimé : {engel} requêtes",
    "yama.onayBaslik": "RÈGLES APPROUVÉES (validées en bac à sable, 0 régression 0 faux positif) :",
    "yama.redBaslik": "CANDIDATS REJETÉS (non sûrs) :",
    "yama.not": "Remarque : chaque règle a été validée de façon cumulative par-dessus vos règles actives dans le moteur de bac à sable. L'application ne touche jamais la production ; l'approbation vous revient.",
    "yama.puan": "points",
    "yama.eger": "SI",
    "yama.dosyaAd": "correction-automatique-patch.txt",
  },

  es: {
    "aciklama.baslik": "Encuentra el hueco → sintetiza una regla → pruébala en el sandbox → recomienda solo las seguras.",
    "aciklama.p1a": "Una sugerencia de regla corriente dice \"esta regla atrapa aquello\" pero nunca lo",
    "aciklama.p1kanit": "demuestra",
    "aciklama.p1b": ". Este motor ejecuta cada regla candidata",
    "aciklama.sandbox": "sandbox",
    "aciklama.p1c": " de forma acumulativa sobre tus reglas activas y solo aprueba",
    "aciklama.p1garanti": "ganancia neta de defensa + 0 regresiones + 0 falsos positivos",
    "aciklama.p1d": "las reglas que lo garantizan. Es decir, la prueba de que \"añadirla no rompe nada y aumenta la defensa.\"",

    "bos.baslik": "No hay un hueco claro que corregir automáticamente",
    "bos.metin": "En los {olay} eventos observados no se encontró ningún clúster de amenazas denso y puro sin cubrir por tus {kural} reglas existentes. Vuelve a ejecutar a medida que cambie el tráfico.",

    "stat.onaylanan": "Reglas aprobadas",
    "stat.reddedilen": "Candidatas rechazadas",
    "stat.netKazanim": "Ganancia neta de defensa (puntos)",
    "stat.engellenen": "Solicitudes bloqueadas estimadas",

    "onay.baslik": "Conjunto de parches aprobado ({n})",
    "onay.bos": "Ninguna candidata superó la barrera de seguridad — todas produjeron regresiones o falsos positivos.",
    "onay.uygulanabilir": "{n} reglas pueden aplicarse con seguridad",
    "onay.uygulanabilirAlt": "Todas validadas en el sandbox: 0 regresiones, 0 falsos positivos. Aplicarlas nunca toca producción — la aprobación es tuya.",
    "onay.yamaButon": "Conjunto de parches (.txt)",
    "onay.kurallarButon": "Pantalla de reglas",

    "red.baslik": "Candidatas rechazadas ({n})",
    "red.aciklama": "Estas reglas se sintetizaron pero no pasaron la validación del sandbox — el motor las descartó por ti. Estos son los errores que habría causado añadir una regla a ciegas.",

    "not.a": "Los huecos se derivan de",
    "not.gercek": "eventos reales observados",
    "not.b": "(ASN/clase de bot/país donde se concentra el tráfico malo y la mezcla legítima es baja); cada regla candidata se valida en el motor",
    "not.c": "contra capturas de tráfico representativas. La aprobación es totalmente tuya — el motor",
    "not.onerir": "recomienda",
    "not.d": " reglas, nunca escribe en producción.",

    "kart.puan": "+{n} puntos",
    "kart.eger": "SI",
    "kart.sandboxDetay": "Detalle del sandbox",
    "kart.sandboxDogrulama": "Validación del sandbox ({n} capturas)",
    "kart.kol.yakalama": "Captura",
    "kart.kol.iyilesme": "Mejora",
    "kart.kol.regresyon": "Regresión",
    "kart.kol.yanlisPoz": "Falso pos.",
    "kart.kol.net": "Neto",

    "action.allow": "Permitir",
    "action.challenge": "Verificar",
    "action.block": "Bloquear",
    "action.flag": "Marcar",

    "tur.asn": "ASN / Red",
    "tur.botClass": "Clase de bot",
    "tur.country": "País",

    "yama.baslik": "SPECTER — CONJUNTO DE PARCHES DE CORRECCIÓN AUTOMÁTICA",
    "yama.gozlem": "Eventos observados: {olay} · Reglas existentes: {kural}",
    "yama.onaySatir": "Reglas aprobadas: {onay} / {aday} candidatas",
    "yama.kazanim": "Ganancia neta de defensa: +{kazanim} puntos · Bloqueo estimado: {engel} solicitudes",
    "yama.onayBaslik": "REGLAS APROBADAS (validadas en sandbox, 0 regresiones 0 falsos positivos):",
    "yama.redBaslik": "CANDIDATAS RECHAZADAS (no seguras):",
    "yama.not": "Nota: cada regla se validó de forma acumulativa sobre tus reglas activas en el motor de sandbox. Aplicarlas nunca toca producción; la aprobación es tuya.",
    "yama.puan": "puntos",
    "yama.eger": "SI",
    "yama.dosyaAd": "correccion-automatica-patch.txt",
  },
};

/** Otomatik Düzeltme sayfası için yerel çeviri yardımcısı. */
export function odCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
