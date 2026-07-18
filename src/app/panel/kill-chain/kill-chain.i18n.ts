/**
 * Saldırı Zinciri (Kill-Chain) sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer.
 *
 * NOT: Aşama (Asama) ve tehdit enum değerleri asla çevrilmez; lib bunları
 * anahtar olarak üretir. Görünen etiketler burada enum-anahtarına göre
 * yeniden türetilir (kc.asama.* ve kc.tehdit.*).
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama kutusu
    "kc.aciklama.baslik": "Tek olay gürültüdür; saldırı aşamalı bir zincirdir.",
    "kc.aciklama.govde":
      "Her saldırganın (IP) olayları zamana dizilir ve MITRE/Kill-Chain mantığıyla aşamalara eşlenir: {asamalar}. Veylify'ın zinciri {vurgu} ölçülür — erken kesme (keşif/tarama) mükemmel savunmadır; geç kesme veya hiç kesmeme risklidir.",
    "kc.aciklama.vurgu": "hangi aşamada kestiği",

    // Boş durum
    "kc.bos.baslik": "Yeniden yapılandırılacak saldırı zinciri yok",
    "kc.bos.govde":
      "Gözlemlenen {n} olayda çok-adımlı otomasyon zinciri (aynı IP, ≥2 kötü istek) bulunamadı. Saldırı geldikçe zincirler burada belirir.",

    // Özet kartlar
    "kc.ozet.zincir": "Saldırı zinciri",
    "kc.ozet.durdurulan": "Durdurulan zincir",
    "kc.ozet.ileri": "Sömürü/sızmaya ulaşan",
    "kc.ozet.kesme": "Ort. kesme aşaması (düşük=iyi)",

    // Huni paneli
    "kc.huni.baslik": "Saldırı aşaması hunisi (kill-chain funnel)",
    "kc.huni.aciklama":
      "Her aşamaya kaç zincir ulaştı ve kaçı burada kesildi. Sağlıklı savunmada zincirler erken aşamalarda kesilir; huni hızla daralır.",
    "kc.huni.kesildi": "{n} kesildi",
    "kc.huni.dipnot":
      "{sira}. Sağdaki “kesildi”, zincirin ilk block/challenge aldığı aşamayı sayar.",

    // Savunma silueti (radar)
    "kc.radar.baslik": "Savunma silueti",
    "kc.radar.aciklama":
      "Zincirlerin yüzde kaçı her aşamaya ulaştı. Sağlıklı savunmada siluet erken aşamalara sıkışır, iç aşamalara doğru hızla küçülür.",
    "kc.radar.lejant": "Aşamaya ulaşan zincir oranı",

    // Erken kesme skoru (gauge)
    "kc.gauge.baslik": "Erken kesme skoru",
    "kc.gauge.aciklama":
      "Zincirleri ortalama ne kadar erken kestiğimizin puanı (100 = ilk aşamada kesildi, düşük = geç). Erken kesme mükemmel savunmadır.",
    "kc.gauge.skor": "erken kesme",
    "kc.gauge.kesilen": "Kesilen zincir",
    "kc.gauge.gecen": "Geçen zincir",

    // Aşama kartları (MITRE-tarzı)
    "kc.matris.baslik": "Saldırı aşaması kartları",
    "kc.matris.aciklama":
      "Kill-chain'in her aşaması, taktik açıklaması ve bu aşamaya ulaşan / burada kesilen zincir sayısıyla.",
    "kc.matris.taktik": "Taktik",
    "kc.matris.ulasan": "ulaştı",

    // En tehlikeli zincir timeline
    "kc.timeline.baslik": "En tehlikeli zincir — adım adım",
    "kc.timeline.adim": "{n} adım",
    "kc.timeline.dipnot":
      "Makas simgesi, savunmanın saldırıyı kestiği (block/challenge) adımı gösterir.",

    // Zincir paneli
    "kc.zincirler.baslik": "Yeniden yapılandırılmış zincirler ({n})",

    // Yöntem notu
    "kc.yontem":
      "Zincirler gerçek gözlemlenen olaylardan yeniden yapılandırılır: aynı IP'nin istekleri zamana dizilir, her istek yol/UA/botClass/skor sinyallerinden bir saldırı aşamasına eşlenir. Aşama eşlemesi buluşsaldır (MITRE/Kill-Chain mantığı); kesme aşaması gerçek verdict'lerden (block/challenge) belirlenir.",

    // Zincir kartı
    "kc.kart.kesildiEk": "'de kesildi",
    "kc.kart.durdurulmadi": "durdurulmadı",
    "kc.kart.adim": "{n} adım",
    "kc.kart.ulasildi": "ulaşıldı",
    "kc.kart.burdaKesildi": "burada kesildi",

    // Aşama etiketleri (enum-anahtarına göre — enum değeri asla çevrilmez)
    "kc.asama.kesif": "Keşif",
    "kc.asama.tarama": "Tarama",
    "kc.asama.silahlanma": "Silahlanma",
    "kc.asama.erisim": "Erişim denemesi",
    "kc.asama.somuru": "Sömürü",
    "kc.asama.sizma": "Sızma / Kalıcılık",

    // Tehdit etiketleri (enum değeri düşük/orta/yüksek/kritik; görünen ad)
    "kc.tehdit.düşük": "düşük",
    "kc.tehdit.orta": "orta",
    "kc.tehdit.yüksek": "yüksek",
    "kc.tehdit.kritik": "kritik",
  },

  en: {
    "kc.aciklama.baslik": "A single event is noise; an attack is a staged chain.",
    "kc.aciklama.govde":
      "Each attacker's (IP) events are ordered in time and mapped to stages with MITRE/Kill-Chain logic: {asamalar}. We measure {vurgu} — cutting early (recon/scan) is perfect defense; cutting late or never is risky.",
    "kc.aciklama.vurgu": "at which stage Veylify cuts the chain",

    "kc.bos.baslik": "No attack chain to reconstruct",
    "kc.bos.govde":
      "No multi-step automation chain (same IP, ≥2 malicious requests) was found across the {n} observed events. Chains will appear here as attacks arrive.",

    "kc.ozet.zincir": "Attack chains",
    "kc.ozet.durdurulan": "Chains stopped",
    "kc.ozet.ileri": "Reached exploit/exfil",
    "kc.ozet.kesme": "Avg. cut stage (lower=better)",

    "kc.huni.baslik": "Attack stage funnel (kill-chain funnel)",
    "kc.huni.aciklama":
      "How many chains reached each stage and how many were cut here. In a healthy defense, chains are cut at early stages; the funnel narrows fast.",
    "kc.huni.kesildi": "{n} cut",
    "kc.huni.dipnot":
      "{sira}. On the right, “cut” counts the stage where the chain first got a block/challenge.",

    "kc.radar.baslik": "Defense silhouette",
    "kc.radar.aciklama":
      "What share of chains reached each stage. In a healthy defense the silhouette clusters at early stages and shrinks fast toward inner ones.",
    "kc.radar.lejant": "Share of chains reaching a stage",

    "kc.gauge.baslik": "Early-cut score",
    "kc.gauge.aciklama":
      "How early on average we cut chains (100 = cut at the first stage, low = late). Cutting early is perfect defense.",
    "kc.gauge.skor": "early cut",
    "kc.gauge.kesilen": "Chains cut",
    "kc.gauge.gecen": "Chains passed",

    "kc.matris.baslik": "Attack stage cards",
    "kc.matris.aciklama":
      "Each kill-chain stage, with its tactic description and how many chains reached it / were cut here.",
    "kc.matris.taktik": "Tactic",
    "kc.matris.ulasan": "reached",

    "kc.timeline.baslik": "Most dangerous chain — step by step",
    "kc.timeline.adim": "{n} steps",
    "kc.timeline.dipnot":
      "The scissors icon marks the step where the defense cut the attack (block/challenge).",

    "kc.zincirler.baslik": "Reconstructed chains ({n})",

    "kc.yontem":
      "Chains are reconstructed from real observed events: requests from the same IP are ordered in time, and each request is mapped to an attack stage from path/UA/botClass/score signals. Stage mapping is heuristic (MITRE/Kill-Chain logic); the cut stage is determined from actual verdicts (block/challenge).",

    "kc.kart.kesildiEk": " cut",
    "kc.kart.durdurulmadi": "not stopped",
    "kc.kart.adim": "{n} steps",
    "kc.kart.ulasildi": "reached",
    "kc.kart.burdaKesildi": "cut here",

    "kc.asama.kesif": "Reconnaissance",
    "kc.asama.tarama": "Scanning",
    "kc.asama.silahlanma": "Weaponization",
    "kc.asama.erisim": "Access attempt",
    "kc.asama.somuru": "Exploitation",
    "kc.asama.sizma": "Exfiltration / Persistence",

    "kc.tehdit.düşük": "low",
    "kc.tehdit.orta": "medium",
    "kc.tehdit.yüksek": "high",
    "kc.tehdit.kritik": "critical",
  },

  de: {
    "kc.aciklama.baslik": "Ein einzelnes Ereignis ist Rauschen; ein Angriff ist eine gestaffelte Kette.",
    "kc.aciklama.govde":
      "Die Ereignisse jedes Angreifers (IP) werden zeitlich geordnet und mit MITRE/Kill-Chain-Logik Phasen zugeordnet: {asamalar}. Wir messen, {vurgu} — frühes Kappen (Aufklärung/Scan) ist perfekte Verteidigung; spätes oder gar kein Kappen ist riskant.",
    "kc.aciklama.vurgu": "in welcher Phase Veylify die Kette kappt",

    "kc.bos.baslik": "Keine Angriffskette zu rekonstruieren",
    "kc.bos.govde":
      "In den {n} beobachteten Ereignissen wurde keine mehrstufige Automatisierungskette (gleiche IP, ≥2 bösartige Anfragen) gefunden. Ketten erscheinen hier, sobald Angriffe eintreffen.",

    "kc.ozet.zincir": "Angriffsketten",
    "kc.ozet.durdurulan": "Gestoppte Ketten",
    "kc.ozet.ileri": "Erreichte Ausnutzung/Exfil",
    "kc.ozet.kesme": "Ø Kappungsphase (niedriger=besser)",

    "kc.huni.baslik": "Angriffsphasen-Trichter (Kill-Chain-Funnel)",
    "kc.huni.aciklama":
      "Wie viele Ketten jede Phase erreichten und wie viele hier gekappt wurden. In einer gesunden Verteidigung werden Ketten in frühen Phasen gekappt; der Trichter verengt sich schnell.",
    "kc.huni.kesildi": "{n} gekappt",
    "kc.huni.dipnot":
      "{sira}. Rechts zählt „gekappt“ die Phase, in der die Kette erstmals einen Block/Challenge erhielt.",

    "kc.radar.baslik": "Verteidigungssilhouette",
    "kc.radar.aciklama":
      "Welcher Anteil der Ketten jede Phase erreichte. In einer gesunden Verteidigung ballt sich die Silhouette in frühen Phasen und schrumpft nach innen schnell.",
    "kc.radar.lejant": "Anteil der Ketten, die eine Phase erreichen",

    "kc.gauge.baslik": "Früh-Kappungs-Score",
    "kc.gauge.aciklama":
      "Wie früh wir Ketten im Schnitt kappen (100 = in der ersten Phase gekappt, niedrig = spät). Frühes Kappen ist perfekte Verteidigung.",
    "kc.gauge.skor": "früh gekappt",
    "kc.gauge.kesilen": "Gekappte Ketten",
    "kc.gauge.gecen": "Durchgelassene Ketten",

    "kc.matris.baslik": "Angriffsphasen-Karten",
    "kc.matris.aciklama":
      "Jede Kill-Chain-Phase mit ihrer Taktikbeschreibung und wie viele Ketten sie erreichten / hier gekappt wurden.",
    "kc.matris.taktik": "Taktik",
    "kc.matris.ulasan": "erreicht",

    "kc.timeline.baslik": "Gefährlichste Kette — Schritt für Schritt",
    "kc.timeline.adim": "{n} Schritte",
    "kc.timeline.dipnot":
      "Das Scheren-Symbol markiert den Schritt, in dem die Verteidigung den Angriff kappte (Block/Challenge).",

    "kc.zincirler.baslik": "Rekonstruierte Ketten ({n})",

    "kc.yontem":
      "Ketten werden aus real beobachteten Ereignissen rekonstruiert: Anfragen derselben IP werden zeitlich geordnet, und jede Anfrage wird anhand von Pfad-/UA-/botClass-/Score-Signalen einer Angriffsphase zugeordnet. Die Phasenzuordnung ist heuristisch (MITRE/Kill-Chain-Logik); die Kappungsphase wird aus tatsächlichen Verdicts (Block/Challenge) bestimmt.",

    "kc.kart.kesildiEk": " gekappt",
    "kc.kart.durdurulmadi": "nicht gestoppt",
    "kc.kart.adim": "{n} Schritte",
    "kc.kart.ulasildi": "erreicht",
    "kc.kart.burdaKesildi": "hier gekappt",

    "kc.asama.kesif": "Aufklärung",
    "kc.asama.tarama": "Scannen",
    "kc.asama.silahlanma": "Bewaffnung",
    "kc.asama.erisim": "Zugriffsversuch",
    "kc.asama.somuru": "Ausnutzung",
    "kc.asama.sizma": "Exfiltration / Persistenz",

    "kc.tehdit.düşük": "niedrig",
    "kc.tehdit.orta": "mittel",
    "kc.tehdit.yüksek": "hoch",
    "kc.tehdit.kritik": "kritisch",
  },

  fr: {
    "kc.aciklama.baslik": "Un événement isolé est du bruit ; une attaque est une chaîne par étapes.",
    "kc.aciklama.govde":
      "Les événements de chaque attaquant (IP) sont ordonnés dans le temps et associés à des étapes selon la logique MITRE/Kill-Chain : {asamalar}. Nous mesurons {vurgu} — couper tôt (reconnaissance/balayage) est une défense parfaite ; couper tard ou jamais est risqué.",
    "kc.aciklama.vurgu": "à quelle étape Veylify coupe la chaîne",

    "kc.bos.baslik": "Aucune chaîne d'attaque à reconstruire",
    "kc.bos.govde":
      "Aucune chaîne d'automatisation multi-étapes (même IP, ≥2 requêtes malveillantes) n'a été trouvée parmi les {n} événements observés. Les chaînes apparaîtront ici à mesure que les attaques arriveront.",

    "kc.ozet.zincir": "Chaînes d'attaque",
    "kc.ozet.durdurulan": "Chaînes stoppées",
    "kc.ozet.ileri": "Ayant atteint exploitation/exfil",
    "kc.ozet.kesme": "Étape de coupure moy. (bas=mieux)",

    "kc.huni.baslik": "Entonnoir des étapes d'attaque (kill-chain funnel)",
    "kc.huni.aciklama":
      "Combien de chaînes ont atteint chaque étape et combien ont été coupées ici. Dans une défense saine, les chaînes sont coupées aux étapes précoces ; l'entonnoir se resserre vite.",
    "kc.huni.kesildi": "{n} coupées",
    "kc.huni.dipnot":
      "{sira}. À droite, « coupée » compte l'étape où la chaîne a reçu son premier block/challenge.",

    "kc.radar.baslik": "Silhouette de défense",
    "kc.radar.aciklama":
      "Quelle part des chaînes a atteint chaque étape. Dans une défense saine, la silhouette se concentre sur les étapes précoces et se réduit vite vers les internes.",
    "kc.radar.lejant": "Part des chaînes atteignant une étape",

    "kc.gauge.baslik": "Score de coupure précoce",
    "kc.gauge.aciklama":
      "À quel point nous coupons les chaînes tôt en moyenne (100 = coupée à la première étape, bas = tard). Couper tôt est une défense parfaite.",
    "kc.gauge.skor": "coupure précoce",
    "kc.gauge.kesilen": "Chaînes coupées",
    "kc.gauge.gecen": "Chaînes passées",

    "kc.matris.baslik": "Cartes des étapes d'attaque",
    "kc.matris.aciklama":
      "Chaque étape de la kill-chain, avec sa description de tactique et le nombre de chaînes l'ayant atteinte / coupées ici.",
    "kc.matris.taktik": "Tactique",
    "kc.matris.ulasan": "atteinte",

    "kc.timeline.baslik": "Chaîne la plus dangereuse — étape par étape",
    "kc.timeline.adim": "{n} étapes",
    "kc.timeline.dipnot":
      "L'icône ciseaux marque l'étape où la défense a coupé l'attaque (block/challenge).",

    "kc.zincirler.baslik": "Chaînes reconstruites ({n})",

    "kc.yontem":
      "Les chaînes sont reconstruites à partir d'événements réels observés : les requêtes d'une même IP sont ordonnées dans le temps, et chaque requête est associée à une étape d'attaque selon les signaux chemin/UA/botClass/score. L'association d'étape est heuristique (logique MITRE/Kill-Chain) ; l'étape de coupure est déterminée à partir des verdicts réels (block/challenge).",

    "kc.kart.kesildiEk": " coupée",
    "kc.kart.durdurulmadi": "non stoppée",
    "kc.kart.adim": "{n} étapes",
    "kc.kart.ulasildi": "atteinte",
    "kc.kart.burdaKesildi": "coupée ici",

    "kc.asama.kesif": "Reconnaissance",
    "kc.asama.tarama": "Balayage",
    "kc.asama.silahlanma": "Armement",
    "kc.asama.erisim": "Tentative d'accès",
    "kc.asama.somuru": "Exploitation",
    "kc.asama.sizma": "Exfiltration / Persistance",

    "kc.tehdit.düşük": "faible",
    "kc.tehdit.orta": "moyen",
    "kc.tehdit.yüksek": "élevé",
    "kc.tehdit.kritik": "critique",
  },

  es: {
    "kc.aciklama.baslik": "Un solo evento es ruido; un ataque es una cadena por etapas.",
    "kc.aciklama.govde":
      "Los eventos de cada atacante (IP) se ordenan en el tiempo y se asignan a etapas con lógica MITRE/Kill-Chain: {asamalar}. Medimos {vurgu} — cortar temprano (reconocimiento/escaneo) es una defensa perfecta; cortar tarde o nunca es arriesgado.",
    "kc.aciklama.vurgu": "en qué etapa Veylify corta la cadena",

    "kc.bos.baslik": "No hay cadena de ataque que reconstruir",
    "kc.bos.govde":
      "No se encontró ninguna cadena de automatización de múltiples pasos (misma IP, ≥2 solicitudes maliciosas) entre los {n} eventos observados. Las cadenas aparecerán aquí a medida que lleguen los ataques.",

    "kc.ozet.zincir": "Cadenas de ataque",
    "kc.ozet.durdurulan": "Cadenas detenidas",
    "kc.ozet.ileri": "Que alcanzaron explotación/exfil",
    "kc.ozet.kesme": "Etapa de corte media (menor=mejor)",

    "kc.huni.baslik": "Embudo de etapas de ataque (kill-chain funnel)",
    "kc.huni.aciklama":
      "Cuántas cadenas alcanzaron cada etapa y cuántas se cortaron aquí. En una defensa sana, las cadenas se cortan en etapas tempranas; el embudo se estrecha rápido.",
    "kc.huni.kesildi": "{n} cortadas",
    "kc.huni.dipnot":
      "{sira}. A la derecha, «cortada» cuenta la etapa donde la cadena recibió su primer block/challenge.",

    "kc.radar.baslik": "Silueta de defensa",
    "kc.radar.aciklama":
      "Qué porcentaje de cadenas alcanzó cada etapa. En una defensa sana, la silueta se agrupa en etapas tempranas y se reduce rápido hacia las internas.",
    "kc.radar.lejant": "Porcentaje de cadenas que alcanzan una etapa",

    "kc.gauge.baslik": "Puntuación de corte temprano",
    "kc.gauge.aciklama":
      "Cuán temprano cortamos las cadenas de media (100 = cortada en la primera etapa, bajo = tarde). Cortar temprano es una defensa perfecta.",
    "kc.gauge.skor": "corte temprano",
    "kc.gauge.kesilen": "Cadenas cortadas",
    "kc.gauge.gecen": "Cadenas que pasaron",

    "kc.matris.baslik": "Tarjetas de etapas de ataque",
    "kc.matris.aciklama":
      "Cada etapa de la kill-chain, con su descripción de táctica y cuántas cadenas la alcanzaron / se cortaron aquí.",
    "kc.matris.taktik": "Táctica",
    "kc.matris.ulasan": "alcanzó",

    "kc.timeline.baslik": "Cadena más peligrosa — paso a paso",
    "kc.timeline.adim": "{n} pasos",
    "kc.timeline.dipnot":
      "El icono de tijeras marca el paso donde la defensa cortó el ataque (block/challenge).",

    "kc.zincirler.baslik": "Cadenas reconstruidas ({n})",

    "kc.yontem":
      "Las cadenas se reconstruyen a partir de eventos reales observados: las solicitudes de la misma IP se ordenan en el tiempo y cada solicitud se asigna a una etapa de ataque según las señales de ruta/UA/botClass/puntuación. La asignación de etapa es heurística (lógica MITRE/Kill-Chain); la etapa de corte se determina a partir de los verdicts reales (block/challenge).",

    "kc.kart.kesildiEk": " cortada",
    "kc.kart.durdurulmadi": "no detenida",
    "kc.kart.adim": "{n} pasos",
    "kc.kart.ulasildi": "alcanzada",
    "kc.kart.burdaKesildi": "cortada aquí",

    "kc.asama.kesif": "Reconocimiento",
    "kc.asama.tarama": "Escaneo",
    "kc.asama.silahlanma": "Armamentización",
    "kc.asama.erisim": "Intento de acceso",
    "kc.asama.somuru": "Explotación",
    "kc.asama.sizma": "Exfiltración / Persistencia",

    "kc.tehdit.düşük": "bajo",
    "kc.tehdit.orta": "medio",
    "kc.tehdit.yüksek": "alto",
    "kc.tehdit.kritik": "crítico",
  },
};

export function killChainCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
