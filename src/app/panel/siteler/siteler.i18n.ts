/**
 * Siteler paneli — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/siteler istemci bileşenlerinin (SitelerIstemci +
 * DogrulamaAdimi) kullanıcıya görünen metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik): Site oluşturma formu enum DEĞERLERİNİ POST eder
 * (difficulty: low/medium/high, mode: monitor/challenge/block). Bu sözlük
 * SADECE görüntü ETİKETLERİNİ çevirir — enum değerleri, alan adları, site
 * anahtarları, IP'ler, token'lar ve sayılar hiçbir zaman çevrilmez.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Sayfa başlığı & açıklama
    "st.baslik": "Siteler",
    "st.aciklama": "Veylify ile koruduğun uygulamalar. Her site kendi anahtar çiftine ve kural setine sahiptir.",
    "st.yeniSite": "Yeni site",

    // Boş durum
    "st.bosBaslik": "Henüz site yok",
    "st.bosAciklama": "Korumaya buradan başlanır: siteni ekle, alan adını doğrula ve birkaç satır kodla Veylify korumasını canlıya al.",
    "st.ilkSite": "İlk siteyi oluştur",

    // Site kartı — rozetler
    "st.aktif": "Aktif",
    "st.pasif": "Pasif",
    "st.dogrulamaBekliyor": "Doğrulama bekliyor",
    "st.gorunmez": "Görünmez",

    // Koruma modu etiketleri
    "st.modIzleme": "İzleme",
    "st.modDogrulama": "Doğrulama",
    "st.modEngelleme": "Engelleme",

    // Site kartı — mini istatistikler
    "st.statDogrulama": "Doğrulama",
    "st.statEngellenen": "Engellenen",
    "st.statBotOrani": "Bot oranı",

    // Üst özet KPI
    "st.ozetToplam": "Toplam site",
    "st.ozetKorunan": "Aktif koruma",
    "st.ozetDogrulanan": "Doğrulanan",
    "st.ozetEngellenen": "Engellenen (30g)",
    // Kart görsel
    "st.korumaSkoru": "Koruma skoru",
    "st.korumaPasif": "Koruma pasif",
    "st.trafik30g": "30 günlük trafik",
    "st.dogrulandi": "Doğrulandı",
    "st.widgetAktif": "Widget aktif",
    "st.widgetPasif": "Widget pasif",

    // Yeni site modalı
    "st.modalOlusturBaslik": "Yeni site oluştur",
    "st.modalDogrulaBaslik": "Alan adı sahipliğini doğrula",
    "st.modalDogrulaAciklama": "Koruma yalnızca sahipliği kanıtlanan alan adlarında etkinleşir.",
    "st.siteAdi": "Site adı",
    "st.izinliAlanlar": "İzinli alan adları",
    "st.zorluk": "Zorluk",
    "st.zorlukDusuk": "Düşük",
    "st.zorlukOrta": "Orta",
    "st.zorlukYuksek": "Yüksek",
    "st.korumaModu": "Koruma modu",
    "st.iptal": "İptal",
    "st.devamEt": "Devam et",
    "st.olusturuluyor": "Oluşturuluyor…",

    // Toast mesajları
    "st.hataOlusturulamadi": "Site oluşturulamadı",
    "st.basariDogrulandi": "Alan adı doğrulandı",
    "st.basariKorumaAktif": "Koruma aktif.",

    // DogrulamaAdimi — yöntemler
    "st.yontemDns": "DNS TXT kaydı",
    "st.yontemDnsIpucu": "En güvenilir. Alan adı DNS panelinize bir TXT kaydı ekleyin.",
    "st.yontemMeta": "HTML meta etiketi",
    "st.yontemMetaIpucu": "Ana sayfanızın <head> bölümüne bir meta etiketi ekleyin.",
    "st.yontemFile": ".well-known dosyası",
    "st.yontemFileIpucu": "Sitenizin köküne küçük bir doğrulama dosyası yükleyin.",

    // DogrulamaAdimi — kod bloğu etiketleri
    "st.etiketTxt": "TXT kaydı",
    "st.etiketMeta": "Meta etiketi",
    "st.etiketFile": "Dosya içeriği",

    // DogrulamaAdimi — not kutusu
    "st.notSahiplikBaslik": "{domain} sahipliğini kanıtlayın",
    "st.notSahiplikMetin1": "Aşağıdaki yöntemlerden birini uygulayın. Kanıtı yerleştirdikten sonra",
    "st.notSahiplikDogrula": "Doğrula",
    "st.notSahiplikMetin2": " deyin. Doğrulanana kadar bu sitenin koruması pasif kalır.",

    // DogrulamaAdimi — durum & butonlar
    "st.durumBeklemedeBaslik": "Doğrulama beklemede",
    "st.durumVarsayilan": "Doğrulama tamamlanamadı. Kaydı ekleyip tekrar deneyin.",
    "st.sonraYaparim": "Sonra yaparım",
    "st.dogrula": "Doğrula",
    "st.kontrolEdiliyor": "Kontrol ediliyor…",

    // DogrulamaAdimi — kopyalama & toast
    "st.kopyala": "Kopyala",
    "st.kopyalandi": "Kopyalandı",
    "st.toastHenuzBaslik": "Henüz doğrulanamadı",
    "st.toastHenuzAciklama": "DNS yayılması birkaç dakika sürebilir.",

    // DNS snippet alan etiketleri
    "st.snippetTip": "Tip",
    "st.snippetHost": "Host",
    "st.snippetHostAlt": "veya",
    "st.snippetDeger": "Değer",
  },

  en: {
    "st.baslik": "Sites",
    "st.aciklama": "The applications you protect with Veylify. Each site has its own key pair and rule set.",
    "st.yeniSite": "New site",

    "st.bosBaslik": "No sites yet",
    "st.bosAciklama": "Protection starts here: add your site, verify the domain, and take Veylify live with just a few lines of code.",
    "st.ilkSite": "Create your first site",

    "st.aktif": "Active",
    "st.pasif": "Inactive",
    "st.dogrulamaBekliyor": "Awaiting verification",
    "st.gorunmez": "Invisible",

    "st.modIzleme": "Monitor",
    "st.modDogrulama": "Challenge",
    "st.modEngelleme": "Block",

    "st.statDogrulama": "Verifications",
    "st.statEngellenen": "Blocked",
    "st.statBotOrani": "Bot rate",

    "st.ozetToplam": "Total sites",
    "st.ozetKorunan": "Active protection",
    "st.ozetDogrulanan": "Verified",
    "st.ozetEngellenen": "Blocked (30d)",
    "st.korumaSkoru": "Protection score",
    "st.korumaPasif": "Protection inactive",
    "st.trafik30g": "30-day traffic",
    "st.dogrulandi": "Verified",
    "st.widgetAktif": "Widget active",
    "st.widgetPasif": "Widget inactive",

    "st.modalOlusturBaslik": "Create a new site",
    "st.modalDogrulaBaslik": "Verify domain ownership",
    "st.modalDogrulaAciklama": "Protection is only enabled for domains whose ownership is proven.",
    "st.siteAdi": "Site name",
    "st.izinliAlanlar": "Allowed domains",
    "st.zorluk": "Difficulty",
    "st.zorlukDusuk": "Low",
    "st.zorlukOrta": "Medium",
    "st.zorlukYuksek": "High",
    "st.korumaModu": "Protection mode",
    "st.iptal": "Cancel",
    "st.devamEt": "Continue",
    "st.olusturuluyor": "Creating…",

    "st.hataOlusturulamadi": "Site could not be created",
    "st.basariDogrulandi": "Domain verified",
    "st.basariKorumaAktif": "Protection is active.",

    "st.yontemDns": "DNS TXT record",
    "st.yontemDnsIpucu": "Most reliable. Add a TXT record to your domain's DNS panel.",
    "st.yontemMeta": "HTML meta tag",
    "st.yontemMetaIpucu": "Add a meta tag to the <head> section of your homepage.",
    "st.yontemFile": ".well-known file",
    "st.yontemFileIpucu": "Upload a small verification file to your site's root.",

    "st.etiketTxt": "TXT record",
    "st.etiketMeta": "Meta tag",
    "st.etiketFile": "File contents",

    "st.notSahiplikBaslik": "Prove ownership of {domain}",
    "st.notSahiplikMetin1": "Apply one of the methods below. Once you've placed the proof, click",
    "st.notSahiplikDogrula": "Verify",
    "st.notSahiplikMetin2": ". This site's protection stays inactive until it's verified.",

    "st.durumBeklemedeBaslik": "Verification pending",
    "st.durumVarsayilan": "Verification could not be completed. Add the record and try again.",
    "st.sonraYaparim": "I'll do it later",
    "st.dogrula": "Verify",
    "st.kontrolEdiliyor": "Checking…",

    "st.kopyala": "Copy",
    "st.kopyalandi": "Copied",
    "st.toastHenuzBaslik": "Not verified yet",
    "st.toastHenuzAciklama": "DNS propagation can take a few minutes.",

    "st.snippetTip": "Type",
    "st.snippetHost": "Host",
    "st.snippetHostAlt": "or",
    "st.snippetDeger": "Value",
  },

  de: {
    "st.baslik": "Websites",
    "st.aciklama": "Die Anwendungen, die du mit Veylify schützt. Jede Website hat ihr eigenes Schlüsselpaar und Regelwerk.",
    "st.yeniSite": "Neue Website",

    "st.bosBaslik": "Noch keine Websites",
    "st.bosAciklama": "Der Schutz beginnt hier: Füge deine Website hinzu, verifiziere die Domain und schalte Veylify mit wenigen Zeilen Code live.",
    "st.ilkSite": "Erste Website erstellen",

    "st.aktif": "Aktiv",
    "st.pasif": "Inaktiv",
    "st.dogrulamaBekliyor": "Verifizierung ausstehend",
    "st.gorunmez": "Unsichtbar",

    "st.modIzleme": "Überwachen",
    "st.modDogrulama": "Prüfen",
    "st.modEngelleme": "Blockieren",

    "st.statDogrulama": "Verifizierungen",
    "st.statEngellenen": "Blockiert",
    "st.statBotOrani": "Bot-Rate",

    "st.ozetToplam": "Sites gesamt",
    "st.ozetKorunan": "Aktiver Schutz",
    "st.ozetDogrulanan": "Verifiziert",
    "st.ozetEngellenen": "Blockiert (30 T.)",
    "st.korumaSkoru": "Schutz-Score",
    "st.korumaPasif": "Schutz inaktiv",
    "st.trafik30g": "Traffic (30 Tage)",
    "st.dogrulandi": "Verifiziert",
    "st.widgetAktif": "Widget aktiv",
    "st.widgetPasif": "Widget inaktiv",

    "st.modalOlusturBaslik": "Neue Website erstellen",
    "st.modalDogrulaBaslik": "Domain-Eigentum verifizieren",
    "st.modalDogrulaAciklama": "Der Schutz wird nur für Domains aktiviert, deren Eigentum nachgewiesen ist.",
    "st.siteAdi": "Website-Name",
    "st.izinliAlanlar": "Zulässige Domains",
    "st.zorluk": "Schwierigkeit",
    "st.zorlukDusuk": "Niedrig",
    "st.zorlukOrta": "Mittel",
    "st.zorlukYuksek": "Hoch",
    "st.korumaModu": "Schutzmodus",
    "st.iptal": "Abbrechen",
    "st.devamEt": "Weiter",
    "st.olusturuluyor": "Wird erstellt…",

    "st.hataOlusturulamadi": "Website konnte nicht erstellt werden",
    "st.basariDogrulandi": "Domain verifiziert",
    "st.basariKorumaAktif": "Schutz ist aktiv.",

    "st.yontemDns": "DNS-TXT-Eintrag",
    "st.yontemDnsIpucu": "Am zuverlässigsten. Füge einen TXT-Eintrag in deinem DNS-Panel hinzu.",
    "st.yontemMeta": "HTML-Meta-Tag",
    "st.yontemMetaIpucu": "Füge ein Meta-Tag im <head>-Bereich deiner Startseite hinzu.",
    "st.yontemFile": ".well-known-Datei",
    "st.yontemFileIpucu": "Lade eine kleine Verifizierungsdatei in das Stammverzeichnis deiner Website hoch.",

    "st.etiketTxt": "TXT-Eintrag",
    "st.etiketMeta": "Meta-Tag",
    "st.etiketFile": "Dateiinhalt",

    "st.notSahiplikBaslik": "Eigentum von {domain} nachweisen",
    "st.notSahiplikMetin1": "Wende eine der folgenden Methoden an. Klicke nach dem Platzieren des Nachweises auf",
    "st.notSahiplikDogrula": "Verifizieren",
    "st.notSahiplikMetin2": ". Der Schutz dieser Website bleibt inaktiv, bis sie verifiziert ist.",

    "st.durumBeklemedeBaslik": "Verifizierung ausstehend",
    "st.durumVarsayilan": "Verifizierung konnte nicht abgeschlossen werden. Füge den Eintrag hinzu und versuche es erneut.",
    "st.sonraYaparim": "Später erledigen",
    "st.dogrula": "Verifizieren",
    "st.kontrolEdiliyor": "Wird geprüft…",

    "st.kopyala": "Kopieren",
    "st.kopyalandi": "Kopiert",
    "st.toastHenuzBaslik": "Noch nicht verifiziert",
    "st.toastHenuzAciklama": "Die DNS-Verbreitung kann einige Minuten dauern.",

    "st.snippetTip": "Typ",
    "st.snippetHost": "Host",
    "st.snippetHostAlt": "oder",
    "st.snippetDeger": "Wert",
  },

  fr: {
    "st.baslik": "Sites",
    "st.aciklama": "Les applications que vous protégez avec Veylify. Chaque site possède sa propre paire de clés et son jeu de règles.",
    "st.yeniSite": "Nouveau site",

    "st.bosBaslik": "Aucun site pour l'instant",
    "st.bosAciklama": "La protection commence ici : ajoutez votre site, vérifiez le domaine et mettez Veylify en ligne en quelques lignes de code.",
    "st.ilkSite": "Créer votre premier site",

    "st.aktif": "Actif",
    "st.pasif": "Inactif",
    "st.dogrulamaBekliyor": "En attente de vérification",
    "st.gorunmez": "Invisible",

    "st.modIzleme": "Surveiller",
    "st.modDogrulama": "Défier",
    "st.modEngelleme": "Bloquer",

    "st.statDogrulama": "Vérifications",
    "st.statEngellenen": "Bloqués",
    "st.statBotOrani": "Taux de bots",

    "st.ozetToplam": "Sites au total",
    "st.ozetKorunan": "Protection active",
    "st.ozetDogrulanan": "Vérifiés",
    "st.ozetEngellenen": "Bloqués (30 j)",
    "st.korumaSkoru": "Score de protection",
    "st.korumaPasif": "Protection inactive",
    "st.trafik30g": "Trafic sur 30 jours",
    "st.dogrulandi": "Vérifié",
    "st.widgetAktif": "Widget actif",
    "st.widgetPasif": "Widget inactif",

    "st.modalOlusturBaslik": "Créer un nouveau site",
    "st.modalDogrulaBaslik": "Vérifier la propriété du domaine",
    "st.modalDogrulaAciklama": "La protection n'est activée que pour les domaines dont la propriété est prouvée.",
    "st.siteAdi": "Nom du site",
    "st.izinliAlanlar": "Domaines autorisés",
    "st.zorluk": "Difficulté",
    "st.zorlukDusuk": "Faible",
    "st.zorlukOrta": "Moyenne",
    "st.zorlukYuksek": "Élevée",
    "st.korumaModu": "Mode de protection",
    "st.iptal": "Annuler",
    "st.devamEt": "Continuer",
    "st.olusturuluyor": "Création…",

    "st.hataOlusturulamadi": "Le site n'a pas pu être créé",
    "st.basariDogrulandi": "Domaine vérifié",
    "st.basariKorumaAktif": "La protection est active.",

    "st.yontemDns": "Enregistrement DNS TXT",
    "st.yontemDnsIpucu": "Le plus fiable. Ajoutez un enregistrement TXT dans votre panneau DNS.",
    "st.yontemMeta": "Balise meta HTML",
    "st.yontemMetaIpucu": "Ajoutez une balise meta dans la section <head> de votre page d'accueil.",
    "st.yontemFile": "Fichier .well-known",
    "st.yontemFileIpucu": "Téléversez un petit fichier de vérification à la racine de votre site.",

    "st.etiketTxt": "Enregistrement TXT",
    "st.etiketMeta": "Balise meta",
    "st.etiketFile": "Contenu du fichier",

    "st.notSahiplikBaslik": "Prouvez la propriété de {domain}",
    "st.notSahiplikMetin1": "Appliquez l'une des méthodes ci-dessous. Une fois la preuve en place, cliquez sur",
    "st.notSahiplikDogrula": "Vérifier",
    "st.notSahiplikMetin2": ". La protection de ce site reste inactive tant qu'il n'est pas vérifié.",

    "st.durumBeklemedeBaslik": "Vérification en attente",
    "st.durumVarsayilan": "La vérification n'a pas pu être effectuée. Ajoutez l'enregistrement et réessayez.",
    "st.sonraYaparim": "Je le ferai plus tard",
    "st.dogrula": "Vérifier",
    "st.kontrolEdiliyor": "Vérification…",

    "st.kopyala": "Copier",
    "st.kopyalandi": "Copié",
    "st.toastHenuzBaslik": "Pas encore vérifié",
    "st.toastHenuzAciklama": "La propagation DNS peut prendre quelques minutes.",

    "st.snippetTip": "Type",
    "st.snippetHost": "Hôte",
    "st.snippetHostAlt": "ou",
    "st.snippetDeger": "Valeur",
  },

  es: {
    "st.baslik": "Sitios",
    "st.aciklama": "Las aplicaciones que proteges con Veylify. Cada sitio tiene su propio par de claves y conjunto de reglas.",
    "st.yeniSite": "Nuevo sitio",

    "st.bosBaslik": "Aún no hay sitios",
    "st.bosAciklama": "La protección empieza aquí: añade tu sitio, verifica el dominio y pon Veylify en marcha con solo unas líneas de código.",
    "st.ilkSite": "Crear tu primer sitio",

    "st.aktif": "Activo",
    "st.pasif": "Inactivo",
    "st.dogrulamaBekliyor": "Pendiente de verificación",
    "st.gorunmez": "Invisible",

    "st.modIzleme": "Monitorear",
    "st.modDogrulama": "Desafiar",
    "st.modEngelleme": "Bloquear",

    "st.statDogrulama": "Verificaciones",
    "st.statEngellenen": "Bloqueados",
    "st.statBotOrani": "Tasa de bots",

    "st.ozetToplam": "Sitios totales",
    "st.ozetKorunan": "Protección activa",
    "st.ozetDogrulanan": "Verificados",
    "st.ozetEngellenen": "Bloqueados (30 d)",
    "st.korumaSkoru": "Puntuación de protección",
    "st.korumaPasif": "Protección inactiva",
    "st.trafik30g": "Tráfico de 30 días",
    "st.dogrulandi": "Verificado",
    "st.widgetAktif": "Widget activo",
    "st.widgetPasif": "Widget inactivo",

    "st.modalOlusturBaslik": "Crear un nuevo sitio",
    "st.modalDogrulaBaslik": "Verificar la propiedad del dominio",
    "st.modalDogrulaAciklama": "La protección solo se activa en los dominios cuya propiedad está comprobada.",
    "st.siteAdi": "Nombre del sitio",
    "st.izinliAlanlar": "Dominios permitidos",
    "st.zorluk": "Dificultad",
    "st.zorlukDusuk": "Baja",
    "st.zorlukOrta": "Media",
    "st.zorlukYuksek": "Alta",
    "st.korumaModu": "Modo de protección",
    "st.iptal": "Cancelar",
    "st.devamEt": "Continuar",
    "st.olusturuluyor": "Creando…",

    "st.hataOlusturulamadi": "No se pudo crear el sitio",
    "st.basariDogrulandi": "Dominio verificado",
    "st.basariKorumaAktif": "La protección está activa.",

    "st.yontemDns": "Registro DNS TXT",
    "st.yontemDnsIpucu": "El más fiable. Añade un registro TXT en el panel DNS de tu dominio.",
    "st.yontemMeta": "Etiqueta meta HTML",
    "st.yontemMetaIpucu": "Añade una etiqueta meta en la sección <head> de tu página de inicio.",
    "st.yontemFile": "Archivo .well-known",
    "st.yontemFileIpucu": "Sube un pequeño archivo de verificación a la raíz de tu sitio.",

    "st.etiketTxt": "Registro TXT",
    "st.etiketMeta": "Etiqueta meta",
    "st.etiketFile": "Contenido del archivo",

    "st.notSahiplikBaslik": "Demuestra la propiedad de {domain}",
    "st.notSahiplikMetin1": "Aplica uno de los métodos siguientes. Una vez colocada la prueba, haz clic en",
    "st.notSahiplikDogrula": "Verificar",
    "st.notSahiplikMetin2": ". La protección de este sitio permanece inactiva hasta que se verifique.",

    "st.durumBeklemedeBaslik": "Verificación pendiente",
    "st.durumVarsayilan": "No se pudo completar la verificación. Añade el registro e inténtalo de nuevo.",
    "st.sonraYaparim": "Lo haré más tarde",
    "st.dogrula": "Verificar",
    "st.kontrolEdiliyor": "Comprobando…",

    "st.kopyala": "Copiar",
    "st.kopyalandi": "Copiado",
    "st.toastHenuzBaslik": "Aún no verificado",
    "st.toastHenuzAciklama": "La propagación DNS puede tardar unos minutos.",

    "st.snippetTip": "Tipo",
    "st.snippetHost": "Host",
    "st.snippetHostAlt": "o",
    "st.snippetDeger": "Valor",
  },
};

export function sitelerCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr[anahtar] ?? anahtar;
}
