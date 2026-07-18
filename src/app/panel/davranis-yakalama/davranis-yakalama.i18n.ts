/**
 * Davranış Yakalama Stüdyosu — YEREL sayfa sözlüğü.
 * =====================================================
 * Bu dosya YALNIZCA /panel/davranis-yakalama istemci bileşeninin kullanıcıya
 * görünen KROM/ETİKET metinlerini 5 dile taşır (tr/en/de/fr/es).
 * Paylaşılan `@/lib/i18n/panel` sözlüğüne DOKUNMAZ; sadece `Dil` tipini ondan alır.
 *
 * ÖNEMLİ (güvenlik / veri):
 *  - Enum DEĞERLERİ hiçbir zaman çevrilmez:
 *    · BehaviorFactor.category (hareket/ritim/zamanlama/cihaz/butunluk) → KATEGORI
 *      etiketi "dy.kat.*" ANAHTARI ile çözülür (görüntü çevrilir, değer sabit).
 *    · Arketip.beklenen ("insan"/"bot") → "dy.karar.*" anahtarıyla çözülür.
 *  - Motor faktör ETİKETLERİ (scoreBehavior'ın ürettiği TR `label` metinleri)
 *    lib'de kalır; burada TR label → çeviri ("dy.faktor.<tr-metin>") eşlemesiyle
 *    istemci tarafında YENİDEN türetilir. Lib DEĞİŞTİRİLMEZ.
 *  - Ham sinyal alan adları (mouseSamples, keyIntervals, webdriver…) ve arketip
 *    katalog verisi (ad, açıklama, etiketler, sinyal değerleri) VERİ'dir — çevrilmez.
 *  - Sayısal/zamanlama değerleri (ms, px, eşik yüzdeleri) veridir; yalnızca
 *    sayı biçimi Intl ile yerelleştirilir.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Başlık (breadcrumb + PanelUst)
    "dy.baslik": "Davranış Yakalama",
    "dy.baslik.uzun": "Davranış Yakalama Stüdyosu",

    // Tanıtım şeridi
    "dy.serit.baslik": "Kendi davranışını canlı yakala, gerçek motor seni skorlasın.",
    "dy.serit.a1": "Aşağıdaki alanda fareni oynat ve yaz. Veylify widget'ının topladığı",
    "dy.serit.a2": "aynı",
    "dy.serit.a3": "biyometrik sinyaller tarayıcında yakalanır ve gerçek",
    "dy.serit.a4":
      "motoruna beslenir. Doğal hareket eden bir insan yüksek skor alır; hiçbir şey yapmamak ya da yapıştırmak bot gibi görünür.",

    // Kontrol + özet
    "dy.durum.etkin": "Yakalama etkin — canlı",
    "dy.durum.beklemede": "Yakalama beklemede",
    "dy.karar.insanOlasi": "İnsan olası",
    "dy.karar.botOlasi": "Bot olası",
    "dy.dugme.baslat": "Yakalamayı başlat",
    "dy.dugme.sifirla": "Sıfırla",

    // Başlatma toast'ı
    "dy.toast.baslik": "Yakalama başladı",
    "dy.toast.aciklama": "Fareyi oynat, alana yaz — motor seni canlı skorluyor.",

    // Canlı skor kartları
    "dy.kart.skor": "Canlı insanlık skoru",
    "dy.kart.guven": "Motor güveni",
    "dy.kart.fareOrnegi": "Fare örneği",
    "dy.kart.tusVurusu": "Tuş vuruşu",

    // Yakalama alanı
    "dy.alan.baslik": "Canlı yakalama alanı",
    "dy.alan.aciklama":
      "Fareni bu kutunun içinde doğal biçimde gezdir, sonra metin kutusuna değişken bir ritimle bir şeyler yaz. Aşağıdaki iz ve skor anında güncellenir.",
    "dy.alan.ipucu": "Yakalamayı başlat, sonra fareni buraya getir",
    "dy.alan.girisAktif": "Buraya değişken ritimle yaz…",
    "dy.alan.girisPasif": "Önce yakalamayı başlat",
    "dy.alan.girisAria": "Davranış yakalama giriş alanı",
    "dy.yapistir.baslik": "Yapıştırma tespit edildi",
    "dy.yapistir.metin":
      "Girişi yapıştırdın — motor bunu bir enjeksiyon işareti olarak −0.15 puanla cezalandırır. Botlar çözümü sıklıkla dışarıdan yapıştırır.",

    // Canlı skor dökümü
    "dy.dokum.baslik": "Canlı skor & faktör dökümü",
    "dy.dokum.bos": "Yakalama başlatılınca motor kararı burada canlı belirir.",
    "dy.dokum.skorEtiket": "İnsanlık skoru",
    "dy.dokum.esikNot": "Eşik: %45. Motor 0.5 nötr başlar; her sinyal ±puan ekler.",
    "dy.dokum.faktorBaslik": "Motorun okuduğu faktörler",
    "dy.dokum.faktorBos": "Henüz yeterli sinyal yok — fareyi oynat ve yaz.",

    // Kategori etiketleri (enum→anahtar)
    "dy.kat.hareket": "Hareket",
    "dy.kat.ritim": "Ritim",
    "dy.kat.zamanlama": "Zamanlama",
    "dy.kat.cihaz": "Cihaz",
    "dy.kat.butunluk": "Bütünlük",

    // Ham sinyal paneli
    "dy.ham.baslik": "Ham sinyal telemetrisi",
    "dy.ham.bos": "Yakalanan ham BehaviorSignals değerleri burada canlı akar.",
    "dy.ham.evet": "evet",
    "dy.ham.hayir": "hayır",
    "dy.ham.histBaslik": "keyIntervals dağılımı (ms)",
    "dy.ham.histBos": "Yazmaya başla — tuş aralıkları burada dağılım oluşturur.",

    // Arketip karşılaştırma
    "dy.ark.baslik": "Arketip karşılaştırması",
    "dy.ark.aciklama.a1": "Canlı imzan, gerçek motordan geçmiş temsili arketiplerle kıyaslanır. Aynı",
    "dy.ark.aciklama.a2":
      "motoru hem seni hem arketipleri skorlar — böylece insan imzanın botlardan nasıl ayrıldığını görürsün.",
    "dy.ark.enYakinBaslik": "Canlı imzana en yakın profil",
    "dy.ark.enYakin": "Şu an skorun, {ad} arketibine en yakın ({karar} profili). {aciklama}",
    "dy.ark.senCanli": "Sen (canlı)",
    "dy.ark.varyans": "varyans:",
    "dy.ark.kose": "köşe/düzeltme:",
    "dy.ark.tusVurusu": "tuş vuruşu:",

    // Karar etiketleri (enum→anahtar; arketip.beklenen)
    "dy.karar.insan": "insan",
    "dy.karar.bot": "bot",

    // Açıklama paneli
    "dy.acik.baslik": "Her sinyal botları nasıl ele verir?",
    "dy.acik.fare.baslik": "Fare yolu & varyans",
    "dy.acik.fare.metin":
      "İnsan faresi eğrisel gider, sürekli mikro-düzeltme yapar (yüksek köşe sayısı) ve hızı düzensizdir (yüksek varyans). Bot düz çizgi çeker; varyans ≈0, köşe 0.",
    "dy.acik.tus.baslik": "Tuş ritmi & dwell",
    "dy.acik.tus.metin":
      "İnsan tuş aralıkları (CV) değişkendir, basılı-kalma süreleri 40–220 ms arasında dalgalanır. Bot sabit aralıkla (CV≈0) ve insan-üstü hızda (ör. ~3 ms dwell) yazar.",
    "dy.acik.zaman.baslik": "Zamanlama",
    "dy.acik.zaman.metin":
      "Challenge'a bakmadan <400 ms içinde submit ya da <80 ms'de ilk etkileşim otomasyon işaretidir. İnsan önce görür, düşünür, sonra yazar.",
    "dy.acik.butun.baslik": "Bütünlük bayrakları",
    "dy.acik.butun.metin":
      "navigator.webdriver=true tek başına −0.35 puanla headless tarayıcıyı ele verir. Saat dilimi/coğrafya uyumsuzluğu proxy/otomasyona işaret eder.",
    "dy.acik.sira.baslik": "Etkileşim sırası",
    "dy.acik.sira.metin":
      "İnsan önce fareyle input'a gider, sonra yazar (mouseBeforeKey=true). Bot doğrudan alana yazar — fare hiç oynamaz.",
    "dy.acik.neden.baslik": "Neden taklit edilemez?",
    "dy.acik.neden.metin":
      "Bir bot bu sinyallerin BİRİNİ taklit edebilir; ama doğal jitter/varyans, dwell dağılımı ve etkileşim sırasını AYNI ANDA ölçekte üretmek pahalı ve kusurludur. Motor onlarca zayıf sinyali birleştirir.",

    // Motor faktör etiketleri (TR label → çeviri; lib'den YENİDEN türetilir)
    "dy.faktor.fare/dokunma hareketi yok": "fare/dokunma hareketi yok",
    "dy.faktor.doğal fare hareketi": "doğal fare hareketi",
    "dy.faktor.insansı yol düzeltmeleri": "insansı yol düzeltmeleri",
    "dy.faktor.düz/robotik fare yolu": "düz/robotik fare yolu",
    "dy.faktor.doğal ivme değişimi": "doğal ivme değişimi",
    "dy.faktor.sabit ivme (otomasyon)": "sabit ivme (otomasyon)",
    "dy.faktor.mekanik/sabit tuş ritmi": "mekanik/sabit tuş ritmi",
    "dy.faktor.insansı tuş ritmi": "insansı tuş ritmi",
    "dy.faktor.insan-üstü yazma hızı": "insan-üstü yazma hızı",
    "dy.faktor.doğal tuş basma süreleri": "doğal tuş basma süreleri",
    "dy.faktor.sentetik tuş süreleri": "sentetik tuş süreleri",
    "dy.faktor.challenge'a bakmadan submit": "challenge'a bakmadan submit",
    "dy.faktor.makul çözüm süresi": "makul çözüm süresi",
    "dy.faktor.anında etkileşim (otomasyon)": "anında etkileşim (otomasyon)",
    "dy.faktor.doğal etkileşim sırası": "doğal etkileşim sırası",
    "dy.faktor.fare olmadan doğrudan yazma": "fare olmadan doğrudan yazma",
    "dy.faktor.yapıştırma tespit edildi": "yapıştırma tespit edildi",
    "dy.faktor.sayfa odak etkileşimi": "sayfa odak etkileşimi",
    "dy.faktor.sayfa gezinme (scroll)": "sayfa gezinme (scroll)",
    "dy.faktor.sekme etkileşimi": "sekme etkileşimi",
    "dy.faktor.gerçek cihaz hareketi (mobil)": "gerçek cihaz hareketi (mobil)",
    "dy.faktor.navigator.webdriver = true": "navigator.webdriver = true",
    "dy.faktor.saat dilimi/coğrafya uyumsuz": "saat dilimi/coğrafya uyumsuz",
    "dy.faktor.insansı girdi çeşitliliği": "insansı girdi çeşitliliği",
  },

  en: {
    "dy.baslik": "Behavior Capture",
    "dy.baslik.uzun": "Behavior Capture Studio",

    "dy.serit.baslik": "Capture your own behavior live and let the real engine score you.",
    "dy.serit.a1": "Move your mouse and type in the area below. The",
    "dy.serit.a2": "same",
    "dy.serit.a3": "biometric signals collected by the Veylify widget are captured in your browser and fed to the real",
    "dy.serit.a4":
      "engine. A person moving naturally scores high; doing nothing or pasting looks like a bot.",

    "dy.durum.etkin": "Capture on — live",
    "dy.durum.beklemede": "Capture idle",
    "dy.karar.insanOlasi": "Likely human",
    "dy.karar.botOlasi": "Likely bot",
    "dy.dugme.baslat": "Start capture",
    "dy.dugme.sifirla": "Reset",

    "dy.toast.baslik": "Capture started",
    "dy.toast.aciklama": "Move the mouse, type in the area — the engine is scoring you live.",

    "dy.kart.skor": "Live humanity score",
    "dy.kart.guven": "Engine confidence",
    "dy.kart.fareOrnegi": "Mouse samples",
    "dy.kart.tusVurusu": "Keystrokes",

    "dy.alan.baslik": "Live capture area",
    "dy.alan.aciklama":
      "Move your mouse naturally inside this box, then type something into the text field with a varied rhythm. The trail and score below update instantly.",
    "dy.alan.ipucu": "Start capture, then bring your mouse here",
    "dy.alan.girisAktif": "Type here with a varied rhythm…",
    "dy.alan.girisPasif": "Start capture first",
    "dy.alan.girisAria": "Behavior capture input field",
    "dy.yapistir.baslik": "Paste detected",
    "dy.yapistir.metin":
      "You pasted the input — the engine penalizes this by −0.15 as an injection signal. Bots often paste the solution from outside.",

    "dy.dokum.baslik": "Live score & factor breakdown",
    "dy.dokum.bos": "Once capture starts, the engine's decision appears here live.",
    "dy.dokum.skorEtiket": "Humanity score",
    "dy.dokum.esikNot": "Threshold: 45%. The engine starts neutral at 0.5; each signal adds ± points.",
    "dy.dokum.faktorBaslik": "Factors the engine read",
    "dy.dokum.faktorBos": "Not enough signal yet — move the mouse and type.",

    "dy.kat.hareket": "Movement",
    "dy.kat.ritim": "Rhythm",
    "dy.kat.zamanlama": "Timing",
    "dy.kat.cihaz": "Device",
    "dy.kat.butunluk": "Integrity",

    "dy.ham.baslik": "Raw signal telemetry",
    "dy.ham.bos": "The captured raw BehaviorSignals values stream here live.",
    "dy.ham.evet": "yes",
    "dy.ham.hayir": "no",
    "dy.ham.histBaslik": "keyIntervals distribution (ms)",
    "dy.ham.histBos": "Start typing — key intervals build a distribution here.",

    "dy.ark.baslik": "Archetype comparison",
    "dy.ark.aciklama.a1": "Your live signature is compared against representative archetypes run through the real engine. The same",
    "dy.ark.aciklama.a2":
      "engine scores both you and the archetypes — so you can see how a human signature differs from bots.",
    "dy.ark.enYakinBaslik": "Closest profile to your live signature",
    "dy.ark.enYakin": "Right now your score is closest to the {ad} archetype (a {karar} profile). {aciklama}",
    "dy.ark.senCanli": "You (live)",
    "dy.ark.varyans": "variance:",
    "dy.ark.kose": "corners/corrections:",
    "dy.ark.tusVurusu": "keystrokes:",

    "dy.karar.insan": "human",
    "dy.karar.bot": "bot",

    "dy.acik.baslik": "How does each signal give bots away?",
    "dy.acik.fare.baslik": "Mouse path & variance",
    "dy.acik.fare.metin":
      "A human mouse curves, constantly making micro-corrections (high corner count) and its speed is irregular (high variance). A bot draws a straight line; variance ≈0, corners 0.",
    "dy.acik.tus.baslik": "Key rhythm & dwell",
    "dy.acik.tus.metin":
      "Human key intervals (CV) vary and dwell times fluctuate between 40–220 ms. A bot types at a fixed interval (CV≈0) and superhuman speed (e.g. ~3 ms dwell).",
    "dy.acik.zaman.baslik": "Timing",
    "dy.acik.zaman.metin":
      "Submitting in <400 ms without looking at the challenge, or a first interaction in <80 ms, is an automation sign. A human sees, thinks, then types.",
    "dy.acik.butun.baslik": "Integrity flags",
    "dy.acik.butun.metin":
      "navigator.webdriver=true alone gives away a headless browser with −0.35. A timezone/geo mismatch points to a proxy/automation.",
    "dy.acik.sira.baslik": "Interaction order",
    "dy.acik.sira.metin":
      "A human first moves to the input with the mouse, then types (mouseBeforeKey=true). A bot types straight into the field — the mouse never moves.",
    "dy.acik.neden.baslik": "Why can't it be faked?",
    "dy.acik.neden.metin":
      "A bot can fake ONE of these signals; but producing natural jitter/variance, dwell distribution and interaction order ALL AT ONCE, at scale, is expensive and flawed. The engine combines dozens of weak signals.",

    "dy.faktor.fare/dokunma hareketi yok": "no mouse/touch movement",
    "dy.faktor.doğal fare hareketi": "natural mouse movement",
    "dy.faktor.insansı yol düzeltmeleri": "human-like path corrections",
    "dy.faktor.düz/robotik fare yolu": "straight/robotic mouse path",
    "dy.faktor.doğal ivme değişimi": "natural acceleration variation",
    "dy.faktor.sabit ivme (otomasyon)": "constant acceleration (automation)",
    "dy.faktor.mekanik/sabit tuş ritmi": "mechanical/fixed key rhythm",
    "dy.faktor.insansı tuş ritmi": "human-like key rhythm",
    "dy.faktor.insan-üstü yazma hızı": "superhuman typing speed",
    "dy.faktor.doğal tuş basma süreleri": "natural key dwell times",
    "dy.faktor.sentetik tuş süreleri": "synthetic key times",
    "dy.faktor.challenge'a bakmadan submit": "submit without reading the challenge",
    "dy.faktor.makul çözüm süresi": "reasonable solve time",
    "dy.faktor.anında etkileşim (otomasyon)": "instant interaction (automation)",
    "dy.faktor.doğal etkileşim sırası": "natural interaction order",
    "dy.faktor.fare olmadan doğrudan yazma": "typing directly without mouse",
    "dy.faktor.yapıştırma tespit edildi": "paste detected",
    "dy.faktor.sayfa odak etkileşimi": "page focus interaction",
    "dy.faktor.sayfa gezinme (scroll)": "page navigation (scroll)",
    "dy.faktor.sekme etkileşimi": "tab interaction",
    "dy.faktor.gerçek cihaz hareketi (mobil)": "real device motion (mobile)",
    "dy.faktor.navigator.webdriver = true": "navigator.webdriver = true",
    "dy.faktor.saat dilimi/coğrafya uyumsuz": "timezone/geo mismatch",
    "dy.faktor.insansı girdi çeşitliliği": "human-like input variety",
  },

  de: {
    "dy.baslik": "Verhaltenserfassung",
    "dy.baslik.uzun": "Studio für Verhaltenserfassung",

    "dy.serit.baslik": "Erfasse dein eigenes Verhalten live und lass die echte Engine dich bewerten.",
    "dy.serit.a1": "Bewege deine Maus und tippe im Bereich unten. Die",
    "dy.serit.a2": "gleichen",
    "dy.serit.a3": "biometrischen Signale, die das Veylify-Widget sammelt, werden in deinem Browser erfasst und der echten",
    "dy.serit.a4":
      "Engine zugeführt. Wer sich natürlich bewegt, erzielt eine hohe Bewertung; nichts zu tun oder einzufügen wirkt wie ein Bot.",

    "dy.durum.etkin": "Erfassung aktiv — live",
    "dy.durum.beklemede": "Erfassung im Leerlauf",
    "dy.karar.insanOlasi": "Wahrscheinlich Mensch",
    "dy.karar.botOlasi": "Wahrscheinlich Bot",
    "dy.dugme.baslat": "Erfassung starten",
    "dy.dugme.sifirla": "Zurücksetzen",

    "dy.toast.baslik": "Erfassung gestartet",
    "dy.toast.aciklama": "Bewege die Maus, tippe im Bereich — die Engine bewertet dich live.",

    "dy.kart.skor": "Live-Menschlichkeitswert",
    "dy.kart.guven": "Engine-Zuversicht",
    "dy.kart.fareOrnegi": "Maus-Samples",
    "dy.kart.tusVurusu": "Tastenanschläge",

    "dy.alan.baslik": "Live-Erfassungsbereich",
    "dy.alan.aciklama":
      "Bewege deine Maus natürlich in diesem Feld und tippe dann etwas mit variablem Rhythmus in das Textfeld. Spur und Wert unten aktualisieren sich sofort.",
    "dy.alan.ipucu": "Erfassung starten, dann Maus hierher bewegen",
    "dy.alan.girisAktif": "Tippe hier mit variablem Rhythmus…",
    "dy.alan.girisPasif": "Zuerst die Erfassung starten",
    "dy.alan.girisAria": "Eingabefeld für Verhaltenserfassung",
    "dy.yapistir.baslik": "Einfügen erkannt",
    "dy.yapistir.metin":
      "Du hast die Eingabe eingefügt — die Engine bestraft dies mit −0,15 als Injektionssignal. Bots fügen die Lösung oft von außen ein.",

    "dy.dokum.baslik": "Live-Wert & Faktoraufschlüsselung",
    "dy.dokum.bos": "Sobald die Erfassung startet, erscheint die Entscheidung der Engine hier live.",
    "dy.dokum.skorEtiket": "Menschlichkeitswert",
    "dy.dokum.esikNot": "Schwelle: 45 %. Die Engine startet neutral bei 0,5; jedes Signal fügt ±Punkte hinzu.",
    "dy.dokum.faktorBaslik": "Von der Engine gelesene Faktoren",
    "dy.dokum.faktorBos": "Noch nicht genug Signal — bewege die Maus und tippe.",

    "dy.kat.hareket": "Bewegung",
    "dy.kat.ritim": "Rhythmus",
    "dy.kat.zamanlama": "Timing",
    "dy.kat.cihaz": "Gerät",
    "dy.kat.butunluk": "Integrität",

    "dy.ham.baslik": "Rohsignal-Telemetrie",
    "dy.ham.bos": "Die erfassten rohen BehaviorSignals-Werte fließen hier live durch.",
    "dy.ham.evet": "ja",
    "dy.ham.hayir": "nein",
    "dy.ham.histBaslik": "keyIntervals-Verteilung (ms)",
    "dy.ham.histBos": "Fang an zu tippen — Tastenintervalle bilden hier eine Verteilung.",

    "dy.ark.baslik": "Archetyp-Vergleich",
    "dy.ark.aciklama.a1": "Deine Live-Signatur wird mit repräsentativen Archetypen verglichen, die durch die echte Engine laufen. Dieselbe",
    "dy.ark.aciklama.a2":
      "Engine bewertet sowohl dich als auch die Archetypen — so siehst du, wie sich eine menschliche Signatur von Bots unterscheidet.",
    "dy.ark.enYakinBaslik": "Nächstes Profil zu deiner Live-Signatur",
    "dy.ark.enYakin": "Dein Wert liegt gerade am nächsten am Archetyp {ad} (ein {karar}-Profil). {aciklama}",
    "dy.ark.senCanli": "Du (live)",
    "dy.ark.varyans": "Varianz:",
    "dy.ark.kose": "Ecken/Korrekturen:",
    "dy.ark.tusVurusu": "Tastenanschläge:",

    "dy.karar.insan": "Mensch",
    "dy.karar.bot": "Bot",

    "dy.acik.baslik": "Wie verrät jedes Signal die Bots?",
    "dy.acik.fare.baslik": "Mausbahn & Varianz",
    "dy.acik.fare.metin":
      "Eine menschliche Maus verläuft kurvig, macht ständig Mikrokorrekturen (hohe Eckenzahl) und ihre Geschwindigkeit ist unregelmäßig (hohe Varianz). Ein Bot zieht eine gerade Linie; Varianz ≈0, Ecken 0.",
    "dy.acik.tus.baslik": "Tastenrhythmus & Dwell",
    "dy.acik.tus.metin":
      "Menschliche Tastenintervalle (CV) variieren, Anschlagzeiten schwanken zwischen 40–220 ms. Ein Bot tippt mit festem Intervall (CV≈0) und übermenschlicher Geschwindigkeit (z. B. ~3 ms Dwell).",
    "dy.acik.zaman.baslik": "Timing",
    "dy.acik.zaman.metin":
      "Ein Absenden in <400 ms ohne Blick auf die Challenge oder eine erste Interaktion in <80 ms ist ein Automatisierungszeichen. Ein Mensch sieht, denkt, dann tippt er.",
    "dy.acik.butun.baslik": "Integritäts-Flags",
    "dy.acik.butun.metin":
      "navigator.webdriver=true allein verrät mit −0,35 einen Headless-Browser. Ein Zeitzonen-/Geo-Konflikt deutet auf einen Proxy/Automatisierung hin.",
    "dy.acik.sira.baslik": "Interaktionsreihenfolge",
    "dy.acik.sira.metin":
      "Ein Mensch bewegt sich zuerst mit der Maus zum Eingabefeld und tippt dann (mouseBeforeKey=true). Ein Bot tippt direkt ins Feld — die Maus bewegt sich nie.",
    "dy.acik.neden.baslik": "Warum lässt es sich nicht fälschen?",
    "dy.acik.neden.metin":
      "Ein Bot kann EINES dieser Signale fälschen; aber natürlichen Jitter/Varianz, Dwell-Verteilung und Interaktionsreihenfolge ALLE GLEICHZEITIG im Maßstab zu erzeugen, ist teuer und fehlerhaft. Die Engine kombiniert Dutzende schwacher Signale.",

    "dy.faktor.fare/dokunma hareketi yok": "keine Maus-/Berührungsbewegung",
    "dy.faktor.doğal fare hareketi": "natürliche Mausbewegung",
    "dy.faktor.insansı yol düzeltmeleri": "menschenähnliche Bahnkorrekturen",
    "dy.faktor.düz/robotik fare yolu": "gerade/robotische Mausbahn",
    "dy.faktor.doğal ivme değişimi": "natürliche Beschleunigungsvariation",
    "dy.faktor.sabit ivme (otomasyon)": "konstante Beschleunigung (Automatisierung)",
    "dy.faktor.mekanik/sabit tuş ritmi": "mechanischer/fester Tastenrhythmus",
    "dy.faktor.insansı tuş ritmi": "menschenähnlicher Tastenrhythmus",
    "dy.faktor.insan-üstü yazma hızı": "übermenschliche Tippgeschwindigkeit",
    "dy.faktor.doğal tuş basma süreleri": "natürliche Tastenanschlagzeiten",
    "dy.faktor.sentetik tuş süreleri": "synthetische Tastenzeiten",
    "dy.faktor.challenge'a bakmadan submit": "Absenden ohne Blick auf die Challenge",
    "dy.faktor.makul çözüm süresi": "angemessene Lösungszeit",
    "dy.faktor.anında etkileşim (otomasyon)": "sofortige Interaktion (Automatisierung)",
    "dy.faktor.doğal etkileşim sırası": "natürliche Interaktionsreihenfolge",
    "dy.faktor.fare olmadan doğrudan yazma": "direktes Tippen ohne Maus",
    "dy.faktor.yapıştırma tespit edildi": "Einfügen erkannt",
    "dy.faktor.sayfa odak etkileşimi": "Seitenfokus-Interaktion",
    "dy.faktor.sayfa gezinme (scroll)": "Seitennavigation (Scroll)",
    "dy.faktor.sekme etkileşimi": "Tab-Interaktion",
    "dy.faktor.gerçek cihaz hareketi (mobil)": "echte Gerätebewegung (mobil)",
    "dy.faktor.navigator.webdriver = true": "navigator.webdriver = true",
    "dy.faktor.saat dilimi/coğrafya uyumsuz": "Zeitzonen-/Geo-Konflikt",
    "dy.faktor.insansı girdi çeşitliliği": "menschenähnliche Eingabevielfalt",
  },

  fr: {
    "dy.baslik": "Capture de comportement",
    "dy.baslik.uzun": "Studio de capture de comportement",

    "dy.serit.baslik": "Capturez votre propre comportement en direct et laissez le vrai moteur vous noter.",
    "dy.serit.a1": "Bougez votre souris et tapez dans la zone ci-dessous. Les",
    "dy.serit.a2": "mêmes",
    "dy.serit.a3": "signaux biométriques collectés par le widget Veylify sont capturés dans votre navigateur et transmis au vrai moteur",
    "dy.serit.a4":
      ". Une personne qui bouge naturellement obtient un score élevé ; ne rien faire ou coller ressemble à un bot.",

    "dy.durum.etkin": "Capture activée — en direct",
    "dy.durum.beklemede": "Capture en attente",
    "dy.karar.insanOlasi": "Humain probable",
    "dy.karar.botOlasi": "Bot probable",
    "dy.dugme.baslat": "Démarrer la capture",
    "dy.dugme.sifirla": "Réinitialiser",

    "dy.toast.baslik": "Capture démarrée",
    "dy.toast.aciklama": "Bougez la souris, tapez dans la zone — le moteur vous note en direct.",

    "dy.kart.skor": "Score d'humanité en direct",
    "dy.kart.guven": "Confiance du moteur",
    "dy.kart.fareOrnegi": "Échantillons de souris",
    "dy.kart.tusVurusu": "Frappes de touche",

    "dy.alan.baslik": "Zone de capture en direct",
    "dy.alan.aciklama":
      "Bougez votre souris naturellement dans cette boîte, puis tapez quelque chose dans le champ de texte avec un rythme varié. La trace et le score ci-dessous se mettent à jour instantanément.",
    "dy.alan.ipucu": "Démarrez la capture, puis amenez votre souris ici",
    "dy.alan.girisAktif": "Tapez ici avec un rythme varié…",
    "dy.alan.girisPasif": "Démarrez d'abord la capture",
    "dy.alan.girisAria": "Champ de saisie de capture de comportement",
    "dy.yapistir.baslik": "Collage détecté",
    "dy.yapistir.metin":
      "Vous avez collé la saisie — le moteur la pénalise de −0,15 comme signal d'injection. Les bots collent souvent la solution depuis l'extérieur.",

    "dy.dokum.baslik": "Score en direct & répartition des facteurs",
    "dy.dokum.bos": "Une fois la capture démarrée, la décision du moteur apparaît ici en direct.",
    "dy.dokum.skorEtiket": "Score d'humanité",
    "dy.dokum.esikNot": "Seuil : 45 %. Le moteur démarre neutre à 0,5 ; chaque signal ajoute ± points.",
    "dy.dokum.faktorBaslik": "Facteurs lus par le moteur",
    "dy.dokum.faktorBos": "Pas encore assez de signal — bougez la souris et tapez.",

    "dy.kat.hareket": "Mouvement",
    "dy.kat.ritim": "Rythme",
    "dy.kat.zamanlama": "Timing",
    "dy.kat.cihaz": "Appareil",
    "dy.kat.butunluk": "Intégrité",

    "dy.ham.baslik": "Télémétrie du signal brut",
    "dy.ham.bos": "Les valeurs brutes BehaviorSignals capturées défilent ici en direct.",
    "dy.ham.evet": "oui",
    "dy.ham.hayir": "non",
    "dy.ham.histBaslik": "distribution keyIntervals (ms)",
    "dy.ham.histBos": "Commencez à taper — les intervalles de touches forment une distribution ici.",

    "dy.ark.baslik": "Comparaison d'archétypes",
    "dy.ark.aciklama.a1": "Votre signature en direct est comparée à des archétypes représentatifs passés par le vrai moteur. Le même",
    "dy.ark.aciklama.a2":
      "moteur note à la fois vous et les archétypes — vous voyez ainsi comment une signature humaine se distingue des bots.",
    "dy.ark.enYakinBaslik": "Profil le plus proche de votre signature en direct",
    "dy.ark.enYakin": "Pour l'instant votre score est le plus proche de l'archétype {ad} (un profil {karar}). {aciklama}",
    "dy.ark.senCanli": "Vous (en direct)",
    "dy.ark.varyans": "variance :",
    "dy.ark.kose": "angles/corrections :",
    "dy.ark.tusVurusu": "frappes :",

    "dy.karar.insan": "humain",
    "dy.karar.bot": "bot",

    "dy.acik.baslik": "Comment chaque signal trahit-il les bots ?",
    "dy.acik.fare.baslik": "Trajectoire de souris & variance",
    "dy.acik.fare.metin":
      "Une souris humaine décrit une courbe, fait sans cesse des micro-corrections (nombre d'angles élevé) et sa vitesse est irrégulière (variance élevée). Un bot trace une ligne droite ; variance ≈0, angles 0.",
    "dy.acik.tus.baslik": "Rythme de touches & dwell",
    "dy.acik.tus.metin":
      "Les intervalles de touches humains (CV) varient et les durées d'appui fluctuent entre 40 et 220 ms. Un bot tape à intervalle fixe (CV≈0) et à vitesse surhumaine (ex. ~3 ms de dwell).",
    "dy.acik.zaman.baslik": "Timing",
    "dy.acik.zaman.metin":
      "Soumettre en <400 ms sans regarder le défi, ou une première interaction en <80 ms, est un signe d'automatisation. Un humain voit, réfléchit, puis tape.",
    "dy.acik.butun.baslik": "Indicateurs d'intégrité",
    "dy.acik.butun.metin":
      "navigator.webdriver=true à lui seul trahit un navigateur headless avec −0,35. Un décalage fuseau horaire/géo indique un proxy/une automatisation.",
    "dy.acik.sira.baslik": "Ordre d'interaction",
    "dy.acik.sira.metin":
      "Un humain va d'abord au champ avec la souris, puis tape (mouseBeforeKey=true). Un bot tape directement dans le champ — la souris ne bouge jamais.",
    "dy.acik.neden.baslik": "Pourquoi est-ce infalsifiable ?",
    "dy.acik.neden.metin":
      "Un bot peut falsifier UN de ces signaux ; mais produire le jitter/la variance naturels, la distribution de dwell et l'ordre d'interaction TOUS EN MÊME TEMPS, à grande échelle, est coûteux et imparfait. Le moteur combine des dizaines de signaux faibles.",

    "dy.faktor.fare/dokunma hareketi yok": "aucun mouvement de souris/tactile",
    "dy.faktor.doğal fare hareketi": "mouvement de souris naturel",
    "dy.faktor.insansı yol düzeltmeleri": "corrections de trajectoire humaines",
    "dy.faktor.düz/robotik fare yolu": "trajectoire de souris droite/robotique",
    "dy.faktor.doğal ivme değişimi": "variation d'accélération naturelle",
    "dy.faktor.sabit ivme (otomasyon)": "accélération constante (automatisation)",
    "dy.faktor.mekanik/sabit tuş ritmi": "rythme de touches mécanique/fixe",
    "dy.faktor.insansı tuş ritmi": "rythme de touches humain",
    "dy.faktor.insan-üstü yazma hızı": "vitesse de frappe surhumaine",
    "dy.faktor.doğal tuş basma süreleri": "durées d'appui naturelles",
    "dy.faktor.sentetik tuş süreleri": "durées de touches synthétiques",
    "dy.faktor.challenge'a bakmadan submit": "soumission sans regarder le défi",
    "dy.faktor.makul çözüm süresi": "temps de résolution raisonnable",
    "dy.faktor.anında etkileşim (otomasyon)": "interaction instantanée (automatisation)",
    "dy.faktor.doğal etkileşim sırası": "ordre d'interaction naturel",
    "dy.faktor.fare olmadan doğrudan yazma": "frappe directe sans souris",
    "dy.faktor.yapıştırma tespit edildi": "collage détecté",
    "dy.faktor.sayfa odak etkileşimi": "interaction de focus de page",
    "dy.faktor.sayfa gezinme (scroll)": "navigation de page (défilement)",
    "dy.faktor.sekme etkileşimi": "interaction d'onglet",
    "dy.faktor.gerçek cihaz hareketi (mobil)": "mouvement d'appareil réel (mobile)",
    "dy.faktor.navigator.webdriver = true": "navigator.webdriver = true",
    "dy.faktor.saat dilimi/coğrafya uyumsuz": "décalage fuseau horaire/géo",
    "dy.faktor.insansı girdi çeşitliliği": "variété d'entrées humaine",
  },

  es: {
    "dy.baslik": "Captura de comportamiento",
    "dy.baslik.uzun": "Estudio de captura de comportamiento",

    "dy.serit.baslik": "Captura tu propio comportamiento en vivo y deja que el motor real te puntúe.",
    "dy.serit.a1": "Mueve el ratón y escribe en el área de abajo. Las",
    "dy.serit.a2": "mismas",
    "dy.serit.a3": "señales biométricas que recopila el widget de Veylify se capturan en tu navegador y se envían al motor real",
    "dy.serit.a4":
      ". Una persona que se mueve con naturalidad obtiene una puntuación alta; no hacer nada o pegar parece un bot.",

    "dy.durum.etkin": "Captura activa — en vivo",
    "dy.durum.beklemede": "Captura en espera",
    "dy.karar.insanOlasi": "Probablemente humano",
    "dy.karar.botOlasi": "Probablemente bot",
    "dy.dugme.baslat": "Iniciar captura",
    "dy.dugme.sifirla": "Restablecer",

    "dy.toast.baslik": "Captura iniciada",
    "dy.toast.aciklama": "Mueve el ratón, escribe en el área — el motor te puntúa en vivo.",

    "dy.kart.skor": "Puntuación de humanidad en vivo",
    "dy.kart.guven": "Confianza del motor",
    "dy.kart.fareOrnegi": "Muestras de ratón",
    "dy.kart.tusVurusu": "Pulsaciones de tecla",

    "dy.alan.baslik": "Área de captura en vivo",
    "dy.alan.aciklama":
      "Mueve el ratón con naturalidad dentro de este cuadro y luego escribe algo en el campo de texto con un ritmo variado. La traza y la puntuación de abajo se actualizan al instante.",
    "dy.alan.ipucu": "Inicia la captura y luego trae el ratón aquí",
    "dy.alan.girisAktif": "Escribe aquí con un ritmo variado…",
    "dy.alan.girisPasif": "Inicia primero la captura",
    "dy.alan.girisAria": "Campo de entrada de captura de comportamiento",
    "dy.yapistir.baslik": "Pegado detectado",
    "dy.yapistir.metin":
      "Pegaste la entrada — el motor lo penaliza con −0,15 como señal de inyección. Los bots suelen pegar la solución desde fuera.",

    "dy.dokum.baslik": "Puntuación en vivo y desglose de factores",
    "dy.dokum.bos": "Cuando la captura comienza, la decisión del motor aparece aquí en vivo.",
    "dy.dokum.skorEtiket": "Puntuación de humanidad",
    "dy.dokum.esikNot": "Umbral: 45 %. El motor empieza neutral en 0,5; cada señal suma ± puntos.",
    "dy.dokum.faktorBaslik": "Factores que leyó el motor",
    "dy.dokum.faktorBos": "Aún no hay suficiente señal — mueve el ratón y escribe.",

    "dy.kat.hareket": "Movimiento",
    "dy.kat.ritim": "Ritmo",
    "dy.kat.zamanlama": "Tiempo",
    "dy.kat.cihaz": "Dispositivo",
    "dy.kat.butunluk": "Integridad",

    "dy.ham.baslik": "Telemetría de señal en bruto",
    "dy.ham.bos": "Los valores en bruto de BehaviorSignals capturados fluyen aquí en vivo.",
    "dy.ham.evet": "sí",
    "dy.ham.hayir": "no",
    "dy.ham.histBaslik": "distribución de keyIntervals (ms)",
    "dy.ham.histBos": "Empieza a escribir — los intervalos de tecla forman una distribución aquí.",

    "dy.ark.baslik": "Comparación de arquetipos",
    "dy.ark.aciklama.a1": "Tu firma en vivo se compara con arquetipos representativos procesados por el motor real. El mismo",
    "dy.ark.aciklama.a2":
      "motor puntúa tanto a ti como a los arquetipos — así ves cómo una firma humana se diferencia de los bots.",
    "dy.ark.enYakinBaslik": "Perfil más cercano a tu firma en vivo",
    "dy.ark.enYakin": "Ahora mismo tu puntuación está más cerca del arquetipo {ad} (un perfil {karar}). {aciklama}",
    "dy.ark.senCanli": "Tú (en vivo)",
    "dy.ark.varyans": "varianza:",
    "dy.ark.kose": "esquinas/correcciones:",
    "dy.ark.tusVurusu": "pulsaciones:",

    "dy.karar.insan": "humano",
    "dy.karar.bot": "bot",

    "dy.acik.baslik": "¿Cómo delata cada señal a los bots?",
    "dy.acik.fare.baslik": "Trayectoria del ratón y varianza",
    "dy.acik.fare.metin":
      "El ratón humano describe una curva, hace microcorrecciones constantes (recuento de esquinas alto) y su velocidad es irregular (varianza alta). Un bot traza una línea recta; varianza ≈0, esquinas 0.",
    "dy.acik.tus.baslik": "Ritmo de tecla y dwell",
    "dy.acik.tus.metin":
      "Los intervalos de tecla humanos (CV) varían y los tiempos de pulsación fluctúan entre 40 y 220 ms. Un bot escribe a intervalo fijo (CV≈0) y a velocidad sobrehumana (p. ej. ~3 ms de dwell).",
    "dy.acik.zaman.baslik": "Tiempo",
    "dy.acik.zaman.metin":
      "Enviar en <400 ms sin mirar el desafío, o una primera interacción en <80 ms, es una señal de automatización. Un humano ve, piensa y luego escribe.",
    "dy.acik.butun.baslik": "Indicadores de integridad",
    "dy.acik.butun.metin":
      "navigator.webdriver=true por sí solo delata un navegador headless con −0,35. Un desajuste de zona horaria/geo apunta a un proxy/automatización.",
    "dy.acik.sira.baslik": "Orden de interacción",
    "dy.acik.sira.metin":
      "Un humano primero va al campo con el ratón y luego escribe (mouseBeforeKey=true). Un bot escribe directamente en el campo — el ratón nunca se mueve.",
    "dy.acik.neden.baslik": "¿Por qué no se puede falsificar?",
    "dy.acik.neden.metin":
      "Un bot puede falsificar UNA de estas señales; pero producir el jitter/varianza natural, la distribución de dwell y el orden de interacción TODO A LA VEZ, a escala, es caro e imperfecto. El motor combina docenas de señales débiles.",

    "dy.faktor.fare/dokunma hareketi yok": "sin movimiento de ratón/táctil",
    "dy.faktor.doğal fare hareketi": "movimiento de ratón natural",
    "dy.faktor.insansı yol düzeltmeleri": "correcciones de trayectoria humanas",
    "dy.faktor.düz/robotik fare yolu": "trayectoria de ratón recta/robótica",
    "dy.faktor.doğal ivme değişimi": "variación de aceleración natural",
    "dy.faktor.sabit ivme (otomasyon)": "aceleración constante (automatización)",
    "dy.faktor.mekanik/sabit tuş ritmi": "ritmo de tecla mecánico/fijo",
    "dy.faktor.insansı tuş ritmi": "ritmo de tecla humano",
    "dy.faktor.insan-üstü yazma hızı": "velocidad de escritura sobrehumana",
    "dy.faktor.doğal tuş basma süreleri": "tiempos de pulsación naturales",
    "dy.faktor.sentetik tuş süreleri": "tiempos de tecla sintéticos",
    "dy.faktor.challenge'a bakmadan submit": "envío sin mirar el desafío",
    "dy.faktor.makul çözüm süresi": "tiempo de resolución razonable",
    "dy.faktor.anında etkileşim (otomasyon)": "interacción instantánea (automatización)",
    "dy.faktor.doğal etkileşim sırası": "orden de interacción natural",
    "dy.faktor.fare olmadan doğrudan yazma": "escritura directa sin ratón",
    "dy.faktor.yapıştırma tespit edildi": "pegado detectado",
    "dy.faktor.sayfa odak etkileşimi": "interacción de foco de página",
    "dy.faktor.sayfa gezinme (scroll)": "navegación de página (desplazamiento)",
    "dy.faktor.sekme etkileşimi": "interacción de pestaña",
    "dy.faktor.gerçek cihaz hareketi (mobil)": "movimiento de dispositivo real (móvil)",
    "dy.faktor.navigator.webdriver = true": "navigator.webdriver = true",
    "dy.faktor.saat dilimi/coğrafya uyumsuz": "desajuste de zona horaria/geo",
    "dy.faktor.insansı girdi çeşitliliği": "variedad de entrada humana",
  },
};

/** Davranış Yakalama yerel çeviri yardımcısı: anahtar bulunamazsa TR'ye düşer. */
export function davranisYakalamaCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}

/** Motor faktör etiketini (lib'in ürettiği TR `label`) aktif dile çevirir.
 *  Lib DEĞİŞTİRİLMEZ; çeviri "dy.faktor.<tr-label>" anahtarıyla türetilir.
 *  Eşleşme yoksa TR label aynen döner (asla boş kalmaz). */
export function faktorEtiketCeviri(trLabel: string, dil: Dil): string {
  const anahtar = `dy.faktor.${trLabel}`;
  return sozluk[dil]?.[anahtar] ?? trLabel;
}
