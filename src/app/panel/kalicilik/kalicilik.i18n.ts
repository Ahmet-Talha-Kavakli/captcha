/**
 * Geri-Dönen Saldırganlar & Kalıcılık Takibi sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne ve yerel `kalici.ts` mantık dosyasına
 * DOKUNMAZ. Anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ: KaliciTehdit ("geçici" | "tekrarlayan" | "inatçı" |
 * "kalıcı-tehdit") ve Verdict ("allowed" | "challenged" | "blocked" |
 * "flagged") enum DEĞERLERİ asla çevrilmez — mantıkta ayrım anahtarı olarak
 * kalır. kalici.ts'teki TEHDIT_ETIKET TR etiketleri yerine, burada anahtar-
 * bazlı çeviri kullanılır (istemci tarafında yeniden türetilir).
 * IP / ASN / ülke kodları / zaman damgaları / sayılar VERİ olarak korunur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Açıklama şeridi
    "kl.giris.baslik": "Kim ısrarla geri geliyor? — Zamansal kalıcılık takibi.",
    "kl.giris.aciklama":
      "Bir kerelik bot gürültüdür. Burada, <b>engellenmesine rağmen zaman içinde tekrar tekrar dönen</b> saldırganları izleriz: kaç ayrı gün/oturumda geldiler, engelden sonra yeniden denediler mi ve tespitten kaçmak için UA/yolu nasıl mutasyona uğrattılar. Skor ne kadar yüksekse hasım o kadar kararlıdır.",

    // Özet kartlar
    "kl.ozet.toplam": "Kalıcı saldırgan (≥2 dönüş)",
    "kl.ozet.inatci": "İnatçı / kalıcı-tehdit",
    "kl.ozet.engel": "Engele rağmen döndü",
    "kl.ozet.ortDonus": "Ortalama dönüş sayısı",

    // Yöntem notu
    "kl.yontem.baslik": "Yöntem — dürüst etiketleme",
    "kl.yontem.metin":
      "Kalıcılık, tamamen <b>gerçek olay zaman damgalarından</b> türetilir (uydurma yok). Oturum (dönüş) sınırları bir boşluk sezgiseliyle çizilir: ardışık iki istek arası <b>{dk} dakikadan</b> uzun boşluk yeni bir dönüş sayılır. Yalnızca <b>≥2 ayrı oturumda</b> görülen saldırganlar listelenir — tek seferlikler elenir.",

    // Tehdit sınıfı etiketleri (KaliciTehdit anahtarları → metin)
    "kl.tehdit.geçici": "Geçici",
    "kl.tehdit.tekrarlayan": "Tekrarlayan",
    "kl.tehdit.inatçı": "İnatçı",
    "kl.tehdit.kalıcı-tehdit": "Kalıcı Tehdit",

    // Karar (Verdict) etiketleri (enum anahtarları → metin)
    "kl.karar.allowed": "İzin",
    "kl.karar.challenged": "Challenge",
    "kl.karar.blocked": "Engel",
    "kl.karar.flagged": "İşaretli",

    // İnatçılık dağılımı
    "kl.dagilim.baslik": "İnatçılık dağılımı",
    "kl.dagilim.aciklama":
      "Her nokta bir saldırgan: <b>sağa</b> = daha çok dönüş, <b>yukarı</b> = daha çok ayrı gün, <b>büyük</b> = daha çok istek. Sağ-üst köşeye yaklaşanlar en kararlı hasımlardır.",
    "kl.grafik.donusEkseni": "Dönüş (oturum) sayısı →",
    "kl.grafik.gunEkseni": "Aktif gün ↑",
    "kl.grafik.enKararli": "en kararlı",
    "kl.grafik.seritAria": "Dönüş oturumları zaman şeridi",
    "kl.grafik.dagilimAria": "Oturum sayısı ve aktif gün dağılım grafiği",
    "kl.grafik.donus": "Dönüş",
    "kl.grafik.istek": "istek",

    // Arama & liste başlığı
    "kl.arama.sonuc": "kalıcı saldırgan · inat skoruna göre sıralı",
    "kl.arama.placeholder": "IP / ASN / ülke ara…",
    "kl.arama.ara": "Ara",

    // Boş durum
    "kl.bos.baslik": "Geri-dönen saldırgan yok",
    "kl.bos.metin":
      "Şu an ≥2 ayrı oturumda dönen kötü niyetli saldırgan yok — trafik ya temiz ya da tümü tek seferlik.",

    // Saldırgan kartı — üst satır
    "kl.kart.mutasyon": "mutasyon",
    "kl.kart.donus": "dönüş",
    "kl.kart.ayriGun": "ayrı gün",
    "kl.kart.yayilim": "yayılım",
    "kl.kart.inatSkoru": "İnat skoru",

    // Engele-rağmen-dönüş callout ({e} = engellenme sayısı, {d} = dönüş sayısı)
    "kl.callout.engelRagmen": "{e} kez engellendi ama {d} kez geri döndü — savunmayı takmıyor.",

    // Genişletilmiş detay — zaman şeridi
    "kl.detay.seritBaslik": "Dönüş oturumları zaman şeridi",
    "kl.detay.seritNot": "· halka = o dönüşte engellendi · boyut = istek yoğunluğu",

    // Kalıcılık sinyalleri sütunu
    "kl.sinyal.baslik": "Kalıcılık sinyalleri",
    "kl.sinyal.toplamIstek": "Toplam istek",
    "kl.sinyal.engelChallenge": "Engel/challenge",
    "kl.sinyal.engelRagmen": "Engele rağmen dönüş",
    "kl.sinyal.baskinSinif": "Baskın sınıf",

    // Mutasyon / kaçış sütunu
    "kl.mutasyon.baslik": "Mutasyon / kaçış",
    "kl.mutasyon.farkliUA": "Farklı UA",
    "kl.mutasyon.farkliYol": "Farklı yol",
    "kl.mutasyon.kacisDenemesi": "Kaçış denemesi",
    "kl.mutasyon.evet": "Evet",
    "kl.mutasyon.hayir": "Hayır",
    "kl.mutasyon.aciklama":
      "Dönüşler arasında UA/yol değiştirdi — tespitten kaçmak için imzasını adapte ediyor.",

    // Altyapı & zaman sütunu
    "kl.altyapi.baslik": "Altyapı & zaman",
    "kl.altyapi.ilkGorulme": "İlk görülme: {t}",
    "kl.altyapi.sonGorulme": "Son görülme: {t}",
    "kl.altyapi.yayilim": "Yayılım: {s}",

    // Öneri / eskalasyon
    "kl.oneri.baslik": "Önerilen eskalasyon",
    "kl.oneri.yuksek":
      "Bu hasım engellere rağmen ısrarla dönüyor{m}. <b>Kalıcı IP engeli</b> uygula; botnet dönüşü için <b>{asn} düzeyinde engel</b> değerlendir.",
    "kl.oneri.yuksekMutasyon": " ve imzasını mutasyona uğratıyor",
    "kl.oneri.dusuk":
      "Düşük-orta kalıcılık — izlemeye devam et; dönüş sıklığı artarsa kural sertleştir.",
    "kl.oneri.kuralOner": "Engelleme kuralı öner",
    "kl.oneri.federe": "Federe (çapraz-site) kontrol",
    "kl.oneri.killChain": "Kill-chain izle",

    // En kararlı hasım
    "kl.enKararli.baslik": "En kararlı hasım",
    "kl.enKararli.ozet": "{d} dönüş · {g} gün · {s} boyunca {durum}. İnat skoru",
    "kl.enKararli.engelRagmen": "{n} kez engele rağmen döndü",
    "kl.enKararli.israrli": "ısrarlı",
    "kl.enKararli.kaliciEngel": "Kalıcı engel öner",

    // Süre birimleri
    "kl.sure.gun": "gün",
    "kl.sure.saat": "saat",
    "kl.sure.dk": "dk",
  },

  en: {
    "kl.giris.baslik": "Who keeps coming back? — Temporal persistence tracking.",
    "kl.giris.aciklama":
      "A one-off bot is noise. Here we track attackers that <b>return again and again over time despite being blocked</b>: on how many distinct days/sessions they came, whether they retried after a block, and how they mutated their UA/path to evade detection. The higher the score, the more determined the adversary.",

    "kl.ozet.toplam": "Persistent attackers (≥2 returns)",
    "kl.ozet.inatci": "Stubborn / persistent-threat",
    "kl.ozet.engel": "Returned despite a block",
    "kl.ozet.ortDonus": "Average number of returns",

    "kl.yontem.baslik": "Method — honest labeling",
    "kl.yontem.metin":
      "Persistence is derived entirely from <b>real event timestamps</b> (no fabrication). Session (return) boundaries are drawn with a gap heuristic: a gap longer than <b>{dk} minutes</b> between two consecutive requests counts as a new return. Only attackers seen in <b>≥2 distinct sessions</b> are listed — one-offs are filtered out.",

    "kl.tehdit.geçici": "Transient",
    "kl.tehdit.tekrarlayan": "Recurring",
    "kl.tehdit.inatçı": "Stubborn",
    "kl.tehdit.kalıcı-tehdit": "Persistent Threat",

    "kl.karar.allowed": "Allowed",
    "kl.karar.challenged": "Challenged",
    "kl.karar.blocked": "Blocked",
    "kl.karar.flagged": "Flagged",

    "kl.dagilim.baslik": "Persistence distribution",
    "kl.dagilim.aciklama":
      "Each dot is an attacker: <b>right</b> = more returns, <b>up</b> = more distinct days, <b>large</b> = more requests. Those closest to the top-right corner are the most determined adversaries.",
    "kl.grafik.donusEkseni": "Returns (sessions) →",
    "kl.grafik.gunEkseni": "Active days ↑",
    "kl.grafik.enKararli": "most determined",
    "kl.grafik.seritAria": "Return sessions timeline",
    "kl.grafik.dagilimAria": "Session count and active-days distribution chart",
    "kl.grafik.donus": "Return",
    "kl.grafik.istek": "requests",

    "kl.arama.sonuc": "persistent attackers · sorted by persistence score",
    "kl.arama.placeholder": "Search IP / ASN / country…",
    "kl.arama.ara": "Search",

    "kl.bos.baslik": "No returning attackers",
    "kl.bos.metin":
      "There are currently no malicious attackers returning in ≥2 distinct sessions — traffic is either clean or all one-off.",

    "kl.kart.mutasyon": "mutation",
    "kl.kart.donus": "returns",
    "kl.kart.ayriGun": "distinct days",
    "kl.kart.yayilim": "spread",
    "kl.kart.inatSkoru": "Persistence score",

    "kl.callout.engelRagmen": "Blocked {e} times but returned {d} times — ignoring the defenses.",

    "kl.detay.seritBaslik": "Return sessions timeline",
    "kl.detay.seritNot": "· ring = blocked on that return · size = request intensity",

    "kl.sinyal.baslik": "Persistence signals",
    "kl.sinyal.toplamIstek": "Total requests",
    "kl.sinyal.engelChallenge": "Block/challenge",
    "kl.sinyal.engelRagmen": "Returns despite block",
    "kl.sinyal.baskinSinif": "Dominant class",

    "kl.mutasyon.baslik": "Mutation / evasion",
    "kl.mutasyon.farkliUA": "Distinct UAs",
    "kl.mutasyon.farkliYol": "Distinct paths",
    "kl.mutasyon.kacisDenemesi": "Evasion attempt",
    "kl.mutasyon.evet": "Yes",
    "kl.mutasyon.hayir": "No",
    "kl.mutasyon.aciklama":
      "Changed UA/path between returns — adapting its signature to evade detection.",

    "kl.altyapi.baslik": "Infrastructure & timing",
    "kl.altyapi.ilkGorulme": "First seen: {t}",
    "kl.altyapi.sonGorulme": "Last seen: {t}",
    "kl.altyapi.yayilim": "Spread: {s}",

    "kl.oneri.baslik": "Recommended escalation",
    "kl.oneri.yuksek":
      "This adversary keeps returning despite blocks{m}. Apply a <b>persistent IP block</b>; consider an <b>{asn}-level block</b> for botnet returns.",
    "kl.oneri.yuksekMutasyon": " and mutates its signature",
    "kl.oneri.dusuk":
      "Low-to-medium persistence — keep monitoring; harden the rule if return frequency rises.",
    "kl.oneri.kuralOner": "Suggest a blocking rule",
    "kl.oneri.federe": "Federated (cross-site) check",
    "kl.oneri.killChain": "Track kill-chain",

    "kl.enKararli.baslik": "Most determined adversary",
    "kl.enKararli.ozet": "{d} returns · {g} days · over {s} {durum}. Persistence score",
    "kl.enKararli.engelRagmen": "returned {n} times despite a block",
    "kl.enKararli.israrli": "persistent",
    "kl.enKararli.kaliciEngel": "Suggest a persistent block",

    "kl.sure.gun": "days",
    "kl.sure.saat": "hours",
    "kl.sure.dk": "min",
  },

  de: {
    "kl.giris.baslik": "Wer kommt hartnäckig zurück? — Zeitliche Persistenz-Verfolgung.",
    "kl.giris.aciklama":
      "Ein einmaliger Bot ist Rauschen. Hier verfolgen wir Angreifer, die <b>trotz Blockierung im Laufe der Zeit immer wieder zurückkehren</b>: an wie vielen verschiedenen Tagen/Sitzungen sie kamen, ob sie nach einer Blockierung erneut versuchten und wie sie ihren UA/Pfad mutierten, um der Erkennung zu entgehen. Je höher der Score, desto entschlossener der Gegner.",

    "kl.ozet.toplam": "Persistente Angreifer (≥2 Rückkehren)",
    "kl.ozet.inatci": "Hartnäckig / Persistente Bedrohung",
    "kl.ozet.engel": "Trotz Blockierung zurückgekehrt",
    "kl.ozet.ortDonus": "Durchschnittliche Anzahl Rückkehren",

    "kl.yontem.baslik": "Methode — ehrliche Kennzeichnung",
    "kl.yontem.metin":
      "Die Persistenz wird ausschließlich aus <b>echten Ereignis-Zeitstempeln</b> abgeleitet (keine Erfindung). Sitzungs- (Rückkehr-)Grenzen werden mit einer Lücken-Heuristik gezogen: eine Lücke von mehr als <b>{dk} Minuten</b> zwischen zwei aufeinanderfolgenden Anfragen zählt als neue Rückkehr. Nur Angreifer, die in <b>≥2 verschiedenen Sitzungen</b> gesehen wurden, werden gelistet — Einmaltäter werden herausgefiltert.",

    "kl.tehdit.geçici": "Vorübergehend",
    "kl.tehdit.tekrarlayan": "Wiederkehrend",
    "kl.tehdit.inatçı": "Hartnäckig",
    "kl.tehdit.kalıcı-tehdit": "Persistente Bedrohung",

    "kl.karar.allowed": "Erlaubt",
    "kl.karar.challenged": "Challenge",
    "kl.karar.blocked": "Blockiert",
    "kl.karar.flagged": "Markiert",

    "kl.dagilim.baslik": "Persistenz-Verteilung",
    "kl.dagilim.aciklama":
      "Jeder Punkt ist ein Angreifer: <b>rechts</b> = mehr Rückkehren, <b>oben</b> = mehr verschiedene Tage, <b>groß</b> = mehr Anfragen. Die der oberen rechten Ecke am nächsten sind, sind die entschlossensten Gegner.",
    "kl.grafik.donusEkseni": "Rückkehren (Sitzungen) →",
    "kl.grafik.gunEkseni": "Aktive Tage ↑",
    "kl.grafik.enKararli": "am entschlossensten",
    "kl.grafik.seritAria": "Zeitleiste der Rückkehr-Sitzungen",
    "kl.grafik.dagilimAria": "Verteilungsdiagramm: Sitzungsanzahl und aktive Tage",
    "kl.grafik.donus": "Rückkehr",
    "kl.grafik.istek": "Anfragen",

    "kl.arama.sonuc": "persistente Angreifer · nach Persistenz-Score sortiert",
    "kl.arama.placeholder": "IP / ASN / Land suchen…",
    "kl.arama.ara": "Suchen",

    "kl.bos.baslik": "Keine zurückkehrenden Angreifer",
    "kl.bos.metin":
      "Derzeit gibt es keine böswilligen Angreifer, die in ≥2 verschiedenen Sitzungen zurückkehren — der Traffic ist entweder sauber oder komplett einmalig.",

    "kl.kart.mutasyon": "Mutation",
    "kl.kart.donus": "Rückkehren",
    "kl.kart.ayriGun": "verschiedene Tage",
    "kl.kart.yayilim": "Spanne",
    "kl.kart.inatSkoru": "Persistenz-Score",

    "kl.callout.engelRagmen": "{e}-mal blockiert, aber {d}-mal zurückgekehrt — ignoriert die Abwehr.",

    "kl.detay.seritBaslik": "Zeitleiste der Rückkehr-Sitzungen",
    "kl.detay.seritNot": "· Ring = bei dieser Rückkehr blockiert · Größe = Anfrage-Intensität",

    "kl.sinyal.baslik": "Persistenz-Signale",
    "kl.sinyal.toplamIstek": "Anfragen gesamt",
    "kl.sinyal.engelChallenge": "Block/Challenge",
    "kl.sinyal.engelRagmen": "Rückkehren trotz Block",
    "kl.sinyal.baskinSinif": "Dominante Klasse",

    "kl.mutasyon.baslik": "Mutation / Umgehung",
    "kl.mutasyon.farkliUA": "Verschiedene UAs",
    "kl.mutasyon.farkliYol": "Verschiedene Pfade",
    "kl.mutasyon.kacisDenemesi": "Umgehungsversuch",
    "kl.mutasyon.evet": "Ja",
    "kl.mutasyon.hayir": "Nein",
    "kl.mutasyon.aciklama":
      "Hat UA/Pfad zwischen den Rückkehren geändert — passt seine Signatur an, um der Erkennung zu entgehen.",

    "kl.altyapi.baslik": "Infrastruktur & Zeit",
    "kl.altyapi.ilkGorulme": "Zuerst gesehen: {t}",
    "kl.altyapi.sonGorulme": "Zuletzt gesehen: {t}",
    "kl.altyapi.yayilim": "Spanne: {s}",

    "kl.oneri.baslik": "Empfohlene Eskalation",
    "kl.oneri.yuksek":
      "Dieser Gegner kehrt trotz Blockierungen hartnäckig zurück{m}. Wende eine <b>persistente IP-Sperre</b> an; erwäge eine <b>Sperre auf {asn}-Ebene</b> für Botnet-Rückkehren.",
    "kl.oneri.yuksekMutasyon": " und mutiert seine Signatur",
    "kl.oneri.dusuk":
      "Geringe bis mittlere Persistenz — weiter überwachen; die Regel verschärfen, wenn die Rückkehrhäufigkeit steigt.",
    "kl.oneri.kuralOner": "Sperrregel vorschlagen",
    "kl.oneri.federe": "Föderierte (standortübergreifende) Prüfung",
    "kl.oneri.killChain": "Kill-Chain verfolgen",

    "kl.enKararli.baslik": "Entschlossenster Gegner",
    "kl.enKararli.ozet": "{d} Rückkehren · {g} Tage · über {s} {durum}. Persistenz-Score",
    "kl.enKararli.engelRagmen": "{n}-mal trotz Blockierung zurückgekehrt",
    "kl.enKararli.israrli": "hartnäckig",
    "kl.enKararli.kaliciEngel": "Persistente Sperre vorschlagen",

    "kl.sure.gun": "Tage",
    "kl.sure.saat": "Std.",
    "kl.sure.dk": "Min.",
  },

  fr: {
    "kl.giris.baslik": "Qui revient sans relâche ? — Suivi de persistance temporelle.",
    "kl.giris.aciklama":
      "Un bot ponctuel n'est que du bruit. Ici, nous suivons les attaquants qui <b>reviennent encore et encore au fil du temps malgré les blocages</b> : sur combien de jours/sessions distincts ils sont venus, s'ils ont réessayé après un blocage et comment ils ont muté leur UA/chemin pour échapper à la détection. Plus le score est élevé, plus l'adversaire est déterminé.",

    "kl.ozet.toplam": "Attaquants persistants (≥2 retours)",
    "kl.ozet.inatci": "Obstiné / menace persistante",
    "kl.ozet.engel": "Revenu malgré un blocage",
    "kl.ozet.ortDonus": "Nombre moyen de retours",

    "kl.yontem.baslik": "Méthode — étiquetage honnête",
    "kl.yontem.metin":
      "La persistance est entièrement dérivée des <b>horodatages réels des événements</b> (aucune fabrication). Les limites de session (retour) sont tracées avec une heuristique d'écart : un écart de plus de <b>{dk} minutes</b> entre deux requêtes consécutives compte comme un nouveau retour. Seuls les attaquants vus dans <b>≥2 sessions distinctes</b> sont listés — les cas ponctuels sont filtrés.",

    "kl.tehdit.geçici": "Transitoire",
    "kl.tehdit.tekrarlayan": "Récurrent",
    "kl.tehdit.inatçı": "Obstiné",
    "kl.tehdit.kalıcı-tehdit": "Menace persistante",

    "kl.karar.allowed": "Autorisé",
    "kl.karar.challenged": "Challenge",
    "kl.karar.blocked": "Bloqué",
    "kl.karar.flagged": "Signalé",

    "kl.dagilim.baslik": "Distribution de la persistance",
    "kl.dagilim.aciklama":
      "Chaque point est un attaquant : <b>à droite</b> = plus de retours, <b>en haut</b> = plus de jours distincts, <b>grand</b> = plus de requêtes. Ceux qui se rapprochent du coin supérieur droit sont les adversaires les plus déterminés.",
    "kl.grafik.donusEkseni": "Retours (sessions) →",
    "kl.grafik.gunEkseni": "Jours actifs ↑",
    "kl.grafik.enKararli": "le plus déterminé",
    "kl.grafik.seritAria": "Chronologie des sessions de retour",
    "kl.grafik.dagilimAria": "Graphique de distribution du nombre de sessions et des jours actifs",
    "kl.grafik.donus": "Retour",
    "kl.grafik.istek": "requêtes",

    "kl.arama.sonuc": "attaquants persistants · triés par score de persistance",
    "kl.arama.placeholder": "Rechercher IP / ASN / pays…",
    "kl.arama.ara": "Rechercher",

    "kl.bos.baslik": "Aucun attaquant récurrent",
    "kl.bos.metin":
      "Il n'y a actuellement aucun attaquant malveillant revenant dans ≥2 sessions distinctes — le trafic est soit propre, soit entièrement ponctuel.",

    "kl.kart.mutasyon": "mutation",
    "kl.kart.donus": "retours",
    "kl.kart.ayriGun": "jours distincts",
    "kl.kart.yayilim": "étalement",
    "kl.kart.inatSkoru": "Score de persistance",

    "kl.callout.engelRagmen": "Bloqué {e} fois mais revenu {d} fois — ignore les défenses.",

    "kl.detay.seritBaslik": "Chronologie des sessions de retour",
    "kl.detay.seritNot": "· anneau = bloqué lors de ce retour · taille = intensité des requêtes",

    "kl.sinyal.baslik": "Signaux de persistance",
    "kl.sinyal.toplamIstek": "Requêtes totales",
    "kl.sinyal.engelChallenge": "Blocage/challenge",
    "kl.sinyal.engelRagmen": "Retours malgré blocage",
    "kl.sinyal.baskinSinif": "Classe dominante",

    "kl.mutasyon.baslik": "Mutation / évasion",
    "kl.mutasyon.farkliUA": "UA distincts",
    "kl.mutasyon.farkliYol": "Chemins distincts",
    "kl.mutasyon.kacisDenemesi": "Tentative d'évasion",
    "kl.mutasyon.evet": "Oui",
    "kl.mutasyon.hayir": "Non",
    "kl.mutasyon.aciklama":
      "A changé d'UA/chemin entre les retours — adapte sa signature pour échapper à la détection.",

    "kl.altyapi.baslik": "Infrastructure & temps",
    "kl.altyapi.ilkGorulme": "Première vue : {t}",
    "kl.altyapi.sonGorulme": "Dernière vue : {t}",
    "kl.altyapi.yayilim": "Étalement : {s}",

    "kl.oneri.baslik": "Escalade recommandée",
    "kl.oneri.yuksek":
      "Cet adversaire revient sans relâche malgré les blocages{m}. Appliquez un <b>blocage d'IP persistant</b> ; envisagez un <b>blocage au niveau {asn}</b> pour les retours de botnet.",
    "kl.oneri.yuksekMutasyon": " et fait muter sa signature",
    "kl.oneri.dusuk":
      "Persistance faible à moyenne — continuez la surveillance ; durcissez la règle si la fréquence des retours augmente.",
    "kl.oneri.kuralOner": "Suggérer une règle de blocage",
    "kl.oneri.federe": "Contrôle fédéré (multi-sites)",
    "kl.oneri.killChain": "Suivre la kill-chain",

    "kl.enKararli.baslik": "Adversaire le plus déterminé",
    "kl.enKararli.ozet": "{d} retours · {g} jours · sur {s} {durum}. Score de persistance",
    "kl.enKararli.engelRagmen": "revenu {n} fois malgré un blocage",
    "kl.enKararli.israrli": "persistant",
    "kl.enKararli.kaliciEngel": "Suggérer un blocage persistant",

    "kl.sure.gun": "jours",
    "kl.sure.saat": "heures",
    "kl.sure.dk": "min",
  },

  es: {
    "kl.giris.baslik": "¿Quién vuelve una y otra vez? — Seguimiento de persistencia temporal.",
    "kl.giris.aciklama":
      "Un bot puntual es ruido. Aquí rastreamos a los atacantes que <b>vuelven una y otra vez a lo largo del tiempo a pesar de ser bloqueados</b>: en cuántos días/sesiones distintos vinieron, si reintentaron tras un bloqueo y cómo mutaron su UA/ruta para evadir la detección. Cuanto mayor sea la puntuación, más decidido es el adversario.",

    "kl.ozet.toplam": "Atacantes persistentes (≥2 retornos)",
    "kl.ozet.inatci": "Obstinado / amenaza persistente",
    "kl.ozet.engel": "Volvió a pesar de un bloqueo",
    "kl.ozet.ortDonus": "Número medio de retornos",

    "kl.yontem.baslik": "Método — etiquetado honesto",
    "kl.yontem.metin":
      "La persistencia se deriva íntegramente de <b>marcas de tiempo reales de eventos</b> (sin invención). Los límites de sesión (retorno) se trazan con una heurística de intervalos: un intervalo de más de <b>{dk} minutos</b> entre dos solicitudes consecutivas cuenta como un nuevo retorno. Solo se listan los atacantes vistos en <b>≥2 sesiones distintas</b> — los casos puntuales se filtran.",

    "kl.tehdit.geçici": "Transitorio",
    "kl.tehdit.tekrarlayan": "Recurrente",
    "kl.tehdit.inatçı": "Obstinado",
    "kl.tehdit.kalıcı-tehdit": "Amenaza persistente",

    "kl.karar.allowed": "Permitido",
    "kl.karar.challenged": "Challenge",
    "kl.karar.blocked": "Bloqueado",
    "kl.karar.flagged": "Marcado",

    "kl.dagilim.baslik": "Distribución de persistencia",
    "kl.dagilim.aciklama":
      "Cada punto es un atacante: <b>a la derecha</b> = más retornos, <b>arriba</b> = más días distintos, <b>grande</b> = más solicitudes. Los que se acercan a la esquina superior derecha son los adversarios más decididos.",
    "kl.grafik.donusEkseni": "Retornos (sesiones) →",
    "kl.grafik.gunEkseni": "Días activos ↑",
    "kl.grafik.enKararli": "el más decidido",
    "kl.grafik.seritAria": "Línea de tiempo de sesiones de retorno",
    "kl.grafik.dagilimAria": "Gráfico de distribución de número de sesiones y días activos",
    "kl.grafik.donus": "Retorno",
    "kl.grafik.istek": "solicitudes",

    "kl.arama.sonuc": "atacantes persistentes · ordenados por puntuación de persistencia",
    "kl.arama.placeholder": "Buscar IP / ASN / país…",
    "kl.arama.ara": "Buscar",

    "kl.bos.baslik": "No hay atacantes recurrentes",
    "kl.bos.metin":
      "Actualmente no hay atacantes maliciosos que vuelvan en ≥2 sesiones distintas — el tráfico está limpio o es todo puntual.",

    "kl.kart.mutasyon": "mutación",
    "kl.kart.donus": "retornos",
    "kl.kart.ayriGun": "días distintos",
    "kl.kart.yayilim": "extensión",
    "kl.kart.inatSkoru": "Puntuación de persistencia",

    "kl.callout.engelRagmen": "Bloqueado {e} veces pero volvió {d} veces — ignora las defensas.",

    "kl.detay.seritBaslik": "Línea de tiempo de sesiones de retorno",
    "kl.detay.seritNot": "· anillo = bloqueado en ese retorno · tamaño = intensidad de solicitudes",

    "kl.sinyal.baslik": "Señales de persistencia",
    "kl.sinyal.toplamIstek": "Solicitudes totales",
    "kl.sinyal.engelChallenge": "Bloqueo/challenge",
    "kl.sinyal.engelRagmen": "Retornos a pesar del bloqueo",
    "kl.sinyal.baskinSinif": "Clase dominante",

    "kl.mutasyon.baslik": "Mutación / evasión",
    "kl.mutasyon.farkliUA": "UA distintos",
    "kl.mutasyon.farkliYol": "Rutas distintas",
    "kl.mutasyon.kacisDenemesi": "Intento de evasión",
    "kl.mutasyon.evet": "Sí",
    "kl.mutasyon.hayir": "No",
    "kl.mutasyon.aciklama":
      "Cambió UA/ruta entre retornos — adapta su firma para evadir la detección.",

    "kl.altyapi.baslik": "Infraestructura y tiempo",
    "kl.altyapi.ilkGorulme": "Primera vez: {t}",
    "kl.altyapi.sonGorulme": "Última vez: {t}",
    "kl.altyapi.yayilim": "Extensión: {s}",

    "kl.oneri.baslik": "Escalada recomendada",
    "kl.oneri.yuksek":
      "Este adversario vuelve obstinadamente a pesar de los bloqueos{m}. Aplica un <b>bloqueo de IP persistente</b>; considera un <b>bloqueo a nivel {asn}</b> para retornos de botnet.",
    "kl.oneri.yuksekMutasyon": " y muta su firma",
    "kl.oneri.dusuk":
      "Persistencia baja-media — sigue monitoreando; endurece la regla si aumenta la frecuencia de retornos.",
    "kl.oneri.kuralOner": "Sugerir una regla de bloqueo",
    "kl.oneri.federe": "Comprobación federada (entre sitios)",
    "kl.oneri.killChain": "Seguir la kill-chain",

    "kl.enKararli.baslik": "Adversario más decidido",
    "kl.enKararli.ozet": "{d} retornos · {g} días · durante {s} {durum}. Puntuación de persistencia",
    "kl.enKararli.engelRagmen": "volvió {n} veces a pesar de un bloqueo",
    "kl.enKararli.israrli": "persistente",
    "kl.enKararli.kaliciEngel": "Sugerir un bloqueo persistente",

    "kl.sure.gun": "días",
    "kl.sure.saat": "horas",
    "kl.sure.dk": "min",
  },
};

/** Anahtar → çeviri; bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer. */
export function kalicilikCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
