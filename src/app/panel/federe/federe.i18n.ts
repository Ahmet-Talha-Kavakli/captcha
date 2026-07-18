import type { Dil } from "@/lib/i18n/panel";

// Federe (çapraz-site) korelasyon paneli için yerel sözlük.
// Enum değerleri (tehdit seviyeleri, varlık tipleri) burada anahtar olarak
// çevrilir; ham veri (IP/ASN/site/parmak-izi) çeviriye girmez.
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    baslik: "Federe (Çapraz-Site) Tehdit Korelasyonu",
    kirinti: "Federe Korelasyon",

    // çok-site gerekli boş durumu
    bosBaslik: "Federe korelasyon için en az 2 site gerekir",
    bosMetin: "Hesabında şu an {n} site var. Çapraz-site korelasyon, aynı saldırganın birden fazla siteni hedeflediğini ortaya çıkarır — ikinci siteni ekleyince koordineli kampanyalar burada belirir.",

    // açıklama şeridi
    aciklamaBaslik: "Tek sitede zararsız — {n} sitede koordineli.",
    aciklamaMetin: "Bir saldırgan tek sitende düşük profil gösterebilir; ama aynı IP/ASN/cihaz imzası <b>birden fazla siteni</b> hedefliyorsa bu koordineli bir operasyondur. Federe korelasyon tüm siteler arasında ortak saldırgan altyapısını birleştirir — tek-site görünürlüğünün kaçırdığı kampanyaları ortaya çıkarır.",

    // özet kartları
    ozetCapraz: "Çapraz-site saldırgan (IP)",
    ozetKoordineli: "Koordineli kampanya (≥60)",
    ozetYayilma: "En geniş yayılma (site)",
    ozetEtkilenen: "Etkilenen site",

    // varlık tipi etiketleri (TIP_ETIKET yerine — lib düzenlenmeden)
    tip_ip: "IP adresi",
    tip_asn: "ASN / Ağ",
    tip_parmakizi: "Cihaz parmak-izi",

    // tehdit seviyesi etiketleri (enum güvenliği — ham değer değil)
    tehdit_düşük: "düşük",
    "tehdit_orta": "orta",
    "tehdit_yüksek": "yüksek",
    "tehdit_kritik": "kritik",

    // varlık listesi
    listeBaslik: "Çapraz-site {tip} ({n})",
    listeBos: "Bu türde çapraz-site varlık yok — {tip} birden fazla siteye yayılmamış.",
    site: "site",
    koord: "koord",
    sitePerIstek: "Site başına istek ({bot})",
    vuruldu: "vuruldu",
    temiz: "temiz",
    varlikNot: "Bu {tip} {n} farklı sitene {istek} istekle vurdu. Tek sitede fark edilmeyebilirdi; federe görünüm koordineli hedeflemeyi ortaya çıkardı. Kural/oto-düzeltme ile hesabın genelinde engelle.",

    // yöntem notu
    yontemNot: "Korelasyon <b>gerçek gözlemlenen olaylardan</b> hesaplanır: her IP/ASN/parmak-izi kaç farklı sitene vurdu (yalnızca kötü/otomasyon trafiği). <b>Koordinasyon skoru</b> = yayılma (site sayısı) × yoğunluk (istek) × siteler-arası dengeli dağılım. Yüksek skor + geniş yayılma = koordineli, hesabını hedefleyen kampanya.",
  },
  en: {
    baslik: "Federated (Cross-Site) Threat Correlation",
    kirinti: "Federated Correlation",

    bosBaslik: "Federated correlation requires at least 2 sites",
    bosMetin: "Your account currently has {n} site. Cross-site correlation reveals when the same attacker targets more than one of your sites — coordinated campaigns will surface here once you add a second site.",

    aciklamaBaslik: "Harmless on one site — coordinated across {n}.",
    aciklamaMetin: "An attacker may keep a low profile on a single site of yours; but if the same IP/ASN/device signature is targeting <b>more than one of your sites</b>, it's a coordinated operation. Federated correlation unifies shared attacker infrastructure across all your sites — surfacing the campaigns that single-site visibility misses.",

    ozetCapraz: "Cross-site attacker (IP)",
    ozetKoordineli: "Coordinated campaign (≥60)",
    ozetYayilma: "Widest spread (sites)",
    ozetEtkilenen: "Affected sites",

    tip_ip: "IP address",
    tip_asn: "ASN / Network",
    tip_parmakizi: "Device fingerprint",

    tehdit_düşük: "low",
    "tehdit_orta": "medium",
    "tehdit_yüksek": "high",
    "tehdit_kritik": "critical",

    listeBaslik: "Cross-site {tip} ({n})",
    listeBos: "No cross-site entities of this type — {tip} hasn't spread across multiple sites.",
    site: "sites",
    koord: "coord",
    sitePerIstek: "Requests per site ({bot})",
    vuruldu: "hit",
    temiz: "clean",
    varlikNot: "This {tip} hit {n} different sites with {istek} requests. It might have gone unnoticed on a single site; the federated view exposed the coordinated targeting. Block it account-wide with a rule/auto-remediation.",

    yontemNot: "Correlation is computed from <b>real observed events</b>: how many distinct sites each IP/ASN/fingerprint hit (bad/automation traffic only). <b>Coordination score</b> = spread (site count) × intensity (requests) × balanced cross-site distribution. High score + wide spread = a coordinated campaign targeting your account.",
  },
  de: {
    baslik: "Föderierte (standortübergreifende) Bedrohungskorrelation",
    kirinti: "Föderierte Korrelation",

    bosBaslik: "Föderierte Korrelation erfordert mindestens 2 Websites",
    bosMetin: "Ihr Konto hat derzeit {n} Website. Die standortübergreifende Korrelation deckt auf, wenn derselbe Angreifer mehrere Ihrer Websites ins Visier nimmt — koordinierte Kampagnen erscheinen hier, sobald Sie eine zweite Website hinzufügen.",

    aciklamaBaslik: "Harmlos auf einer Website — koordiniert über {n} hinweg.",
    aciklamaMetin: "Ein Angreifer kann auf einer einzelnen Website unauffällig bleiben; wenn jedoch dieselbe IP-/ASN-/Gerätesignatur <b>mehrere Ihrer Websites</b> angreift, handelt es sich um eine koordinierte Operation. Die föderierte Korrelation vereint die gemeinsame Angreiferinfrastruktur über alle Ihre Websites hinweg — und deckt die Kampagnen auf, die einer standortbezogenen Sicht entgehen.",

    ozetCapraz: "Standortübergreifender Angreifer (IP)",
    ozetKoordineli: "Koordinierte Kampagne (≥60)",
    ozetYayilma: "Größte Ausbreitung (Websites)",
    ozetEtkilenen: "Betroffene Websites",

    tip_ip: "IP-Adresse",
    tip_asn: "ASN / Netzwerk",
    tip_parmakizi: "Geräte-Fingerabdruck",

    tehdit_düşük: "niedrig",
    "tehdit_orta": "mittel",
    "tehdit_yüksek": "hoch",
    "tehdit_kritik": "kritisch",

    listeBaslik: "Standortübergreifend {tip} ({n})",
    listeBos: "Keine standortübergreifenden Objekte dieses Typs — {tip} hat sich nicht über mehrere Websites verbreitet.",
    site: "Websites",
    koord: "Koord",
    sitePerIstek: "Anfragen pro Website ({bot})",
    vuruldu: "getroffen",
    temiz: "sauber",
    varlikNot: "Dieses {tip} traf {n} verschiedene Websites mit {istek} Anfragen. Auf einer einzelnen Website wäre es womöglich unbemerkt geblieben; die föderierte Sicht hat die koordinierte Ausrichtung offengelegt. Blockieren Sie es kontoweit per Regel/Auto-Behebung.",

    yontemNot: "Die Korrelation wird aus <b>tatsächlich beobachteten Ereignissen</b> berechnet: wie viele verschiedene Websites jede IP/jedes ASN/jeder Fingerabdruck getroffen hat (nur bösartiger/automatisierter Verkehr). <b>Koordinationswert</b> = Ausbreitung (Anzahl Websites) × Intensität (Anfragen) × ausgewogene standortübergreifende Verteilung. Hoher Wert + große Ausbreitung = koordinierte, auf Ihr Konto gerichtete Kampagne.",
  },
  fr: {
    baslik: "Corrélation fédérée des menaces (inter-sites)",
    kirinti: "Corrélation fédérée",

    bosBaslik: "La corrélation fédérée nécessite au moins 2 sites",
    bosMetin: "Votre compte comporte actuellement {n} site. La corrélation inter-sites révèle lorsqu'un même attaquant vise plusieurs de vos sites — les campagnes coordonnées apparaîtront ici dès que vous ajouterez un second site.",

    aciklamaBaslik: "Inoffensif sur un seul site — coordonné sur {n}.",
    aciklamaMetin: "Un attaquant peut garder un profil discret sur un seul de vos sites ; mais si la même signature IP/ASN/appareil cible <b>plusieurs de vos sites</b>, il s'agit d'une opération coordonnée. La corrélation fédérée unifie l'infrastructure d'attaque commune sur l'ensemble de vos sites — révélant les campagnes qu'une visibilité par site laisse échapper.",

    ozetCapraz: "Attaquant inter-sites (IP)",
    ozetKoordineli: "Campagne coordonnée (≥60)",
    ozetYayilma: "Diffusion la plus large (sites)",
    ozetEtkilenen: "Sites touchés",

    tip_ip: "Adresse IP",
    tip_asn: "ASN / Réseau",
    tip_parmakizi: "Empreinte de l'appareil",

    tehdit_düşük: "faible",
    "tehdit_orta": "moyen",
    "tehdit_yüksek": "élevé",
    "tehdit_kritik": "critique",

    listeBaslik: "{tip} inter-sites ({n})",
    listeBos: "Aucune entité inter-sites de ce type — {tip} ne s'est pas propagé sur plusieurs sites.",
    site: "sites",
    koord: "coord",
    sitePerIstek: "Requêtes par site ({bot})",
    vuruldu: "touché",
    temiz: "propre",
    varlikNot: "Ce {tip} a frappé {n} sites différents avec {istek} requêtes. Cela aurait pu passer inaperçu sur un seul site ; la vue fédérée a révélé le ciblage coordonné. Bloquez-le à l'échelle du compte via une règle/remédiation automatique.",

    yontemNot: "La corrélation est calculée à partir d'<b>événements réellement observés</b> : combien de sites distincts chaque IP/ASN/empreinte a frappés (trafic malveillant/automatisé uniquement). <b>Score de coordination</b> = diffusion (nombre de sites) × intensité (requêtes) × répartition équilibrée entre les sites. Score élevé + large diffusion = campagne coordonnée visant votre compte.",
  },
  es: {
    baslik: "Correlación federada de amenazas (entre sitios)",
    kirinti: "Correlación federada",

    bosBaslik: "La correlación federada requiere al menos 2 sitios",
    bosMetin: "Tu cuenta tiene actualmente {n} sitio. La correlación entre sitios revela cuándo el mismo atacante ataca varios de tus sitios — las campañas coordinadas aparecerán aquí en cuanto añadas un segundo sitio.",

    aciklamaBaslik: "Inofensivo en un solo sitio — coordinado en {n}.",
    aciklamaMetin: "Un atacante puede mantener un perfil bajo en uno solo de tus sitios; pero si la misma firma de IP/ASN/dispositivo ataca <b>varios de tus sitios</b>, se trata de una operación coordinada. La correlación federada unifica la infraestructura de ataque compartida en todos tus sitios — revelando las campañas que la visibilidad de un solo sitio pasa por alto.",

    ozetCapraz: "Atacante entre sitios (IP)",
    ozetKoordineli: "Campaña coordinada (≥60)",
    ozetYayilma: "Mayor propagación (sitios)",
    ozetEtkilenen: "Sitios afectados",

    tip_ip: "Dirección IP",
    tip_asn: "ASN / Red",
    tip_parmakizi: "Huella del dispositivo",

    tehdit_düşük: "bajo",
    "tehdit_orta": "medio",
    "tehdit_yüksek": "alto",
    "tehdit_kritik": "crítico",

    listeBaslik: "{tip} entre sitios ({n})",
    listeBos: "No hay entidades entre sitios de este tipo — {tip} no se ha propagado por varios sitios.",
    site: "sitios",
    koord: "coord",
    sitePerIstek: "Solicitudes por sitio ({bot})",
    vuruldu: "impactado",
    temiz: "limpio",
    varlikNot: "Este {tip} impactó {n} sitios distintos con {istek} solicitudes. En un solo sitio podría haber pasado inadvertido; la vista federada reveló el ataque coordinado. Bloquéalo en toda la cuenta con una regla/corrección automática.",

    yontemNot: "La correlación se calcula a partir de <b>eventos realmente observados</b>: cuántos sitios distintos impactó cada IP/ASN/huella (solo tráfico malicioso/automatizado). <b>Puntuación de coordinación</b> = propagación (número de sitios) × intensidad (solicitudes) × distribución equilibrada entre sitios. Puntuación alta + amplia propagación = campaña coordinada dirigida a tu cuenta.",
  },
};

export function fedCeviri(anahtar: string, dil: Dil) {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
