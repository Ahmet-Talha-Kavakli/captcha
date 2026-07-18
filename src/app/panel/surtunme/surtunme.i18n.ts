import type { Dil } from "@/lib/i18n/panel";

/**
 * Sürtünme Analizi sayfasına özel i18n sözlüğü.
 * "su." namespace'li anahtarlar. Doğal/native çeviriler; veri (sayı, yüzde,
 * enum değeri) çevrilmez.
 *
 * ÖNEMLİ: Motor (src/lib/specter/surtunme.ts) bazı TR metinleri üretir:
 *   - surtunme.seviye  → "düşük"|"orta"|"yüksek" (enum benzeri) → anahtar-eşlemi
 *   - surtunme.yorum   → seviyeden yeniden türetilir
 *   - zorluk[].etiket / not → zorluk[].zorluk enum'undan (low/medium/high) türetilir
 *   - oneri[].baslik / metin → mantık istemcide sayısal veriden yeniden çalıştırılır
 * Motor DÜZENLENMEZ; bu metinler burada sabit anahtarlarla çevrilir.
 *
 * TR kaynak/otorite; anahtar bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 */
const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // --- Giriş şeridi ---
    "su.intro.baslik": "Gerçek kullanıcılar challenge'dan ne kadar rahat geçiyor?",
    "su.intro.metin":
      "Bu konsol, ghost-font doğrulamasının meşru insanlara yüklediği sürtünmeyi ölçer: çözüm oranı, terk, çözüm süresi ve zorluğa göre sürtünme. Fazla sürtünme gerçek kullanıcıyı kaybettirir — güvenlik ile UX'i burada dengele.",

    // --- Stat kartları ---
    "su.stat.cozumOran": "Çözüm oranı",
    "su.stat.terkOran": "Terk oranı (yaklaşık)",
    "su.stat.surtunmeSkoru": "Sürtünme skoru",
    "su.stat.gosterim": "Gösterim sayısı (30g)",

    // --- Sürtünme seviyeleri (enum: düşük/orta/yüksek) ---
    "su.seviye.düşük": "düşük",
    "su.seviye.orta": "orta",
    "su.seviye.yüksek": "yüksek",

    // --- Sürtünme yorumu şeridi ---
    "su.yorum.baslik": "Sürtünme: {seviye}",
    "su.yorum.skor": "skor {skor}/100",
    "su.yorum.ipucu": "düşük skor = az sürtünme = iyi UX",
    "su.yorum.düşük":
      "Düşük sürtünme: gerçek kullanıcılar akıcı geçiyor. UX sağlıklı; güvenlik yeterliyse mevcut ayarı koru.",
    "su.yorum.orta":
      "Orta sürtünme: koruma çalışıyor ama bir miktar kullanıcı kaybı var. Zorluk/eşik ince ayarı dönüşümü artırabilir.",
    "su.yorum.yüksek":
      "Yüksek sürtünme: meşru kullanıcıların önemli bir kısmı zorlanıyor veya vazgeçiyor. Zorluğu düşürmeyi ya da görünmez modu değerlendir.",

    // --- Çözüm hunisi ---
    "su.huni.baslik": "Çözüm hunisi",
    "su.huni.bos": "Henüz gösterim yok — challenge gösterildikçe huni dolar.",
    "su.huni.gosterildi": "Gösterildi",
    "su.huni.gosterildi.alt": "Kullanıcıya sunulan challenge",
    "su.huni.cozuldu": "Çözüldü",
    "su.huni.cozuldu.alt": "Doğrulamayı geçen",
    "su.huni.engellendi": "Engellendi",
    "su.huni.engellendi.alt": "Bot / şüpheli",
    "su.huni.terkedildi": "Terk edildi",
    "su.huni.terkedildi.alt": "Çözülmeden bırakılan (yaklaşık)",
    "su.huni.dipnot":
      "Terk = gösterilen − çözülen − engellenen. Açık bir \"terk\" sayacı olmadığından bu bir {yaklasim}; sonuçlanmamış / tekrar denenen challenge'lar da bu artık içinde toplanır.",
    "su.huni.dipnot.yaklasim": "yaklaşımdır",

    // --- Günlük trend ---
    "su.trend.baslik": "Günlük çözüm oranı (%)",
    "su.trend.dipnot":
      "Günlük çözüm oranı = o günün çözülen / gösterilen. Düşen bir eğri, artan sürtünmenin erken sinyalidir.",

    // --- İnsan çözüm tahmini ---
    "su.insan.baslik": "İnsan çözüm deneyimi (tahmin)",
    "su.insan.insanOlay": "İnsan/iyi-bot olayı",
    "su.insan.challengeGoren": "Challenge'a maruz kalan",
    "su.insan.tahminiOran": "Tahmini geçiş oranı",
    "su.insan.ortSure": "Ort. çözüm süresi (modellenmiş)",
    "su.insan.ortSkor": "Ort. insanlık skoru (0–1)",
    "su.insan.sn": "sn",
    "su.insan.dipnot":
      "Tek olay hem \"challenge gördü\" hem \"geçti\" olamayacağından bu bir {tahmin}: geçiş oranı = allowed / (allowed + challenged). Çözüm süresi ise skordan deterministik {modellenmis} (gerçek süre alanı yoktur).",
    "su.insan.dipnot.tahmin": "tahmindir",
    "su.insan.dipnot.modellenmis": "modellenmiştir",

    // --- Zorluk-bazlı sürtünme ---
    "su.zorluk.baslik": "Zorluğa göre sürtünme (modellenmiş)",
    "su.zorluk.th.zorluk": "Zorluk",
    "su.zorluk.th.uzunluk": "Kod uzunluğu",
    "su.zorluk.th.cozum": "Beklenen çözüm",
    "su.zorluk.th.sure": "Ort. süre",
    "su.zorluk.th.surtunme": "Sürtünme",
    "su.zorluk.th.not": "Not",
    "su.zorluk.sweet": "sweet-spot",
    "su.zorluk.hane": "hane",
    "su.zorluk.sn": "sn",
    // Zorluk etiketleri (enum: low/medium/high)
    "su.zorluk.etiket.low": "Düşük",
    "su.zorluk.etiket.medium": "Orta",
    "su.zorluk.etiket.high": "Yüksek",
    // Zorluk notları (enum: low/medium/high)
    "su.zorluk.not.low": "En akıcı. Mobil ve erişilebilirlik dostu; koruma yeterliyse ideal sweet-spot.",
    "su.zorluk.not.medium": "Dengeli. Çoğu site için güvenlik/UX açısından önerilen varsayılan.",
    "su.zorluk.not.high": "En güçlü koruma ama gözle görülür sürtünme. Yalnızca yüksek-risk akışlar için.",
    "su.zorluk.dip.baslik": "Önerilen denge:",
    "su.zorluk.dip.metin":
      "{etiket} zorluk ({uzunluk} hane) — yeterli koruma, en az sürtünme. Kod uzadıkça insan okuma hatası ve süre artar; değerler temsili modeldir.",
    "su.zorluk.dip.buton": "Zorluğu ayarla",

    // --- Öneriler ---
    "su.oneri.baslik": "Öneriler — UX ile güvenliği dengele",
    "su.oneri.azalt.baslik": "Sürtünmeyi azalt",
    "su.oneri.azalt.metin":
      "Sürtünme skoru yüksek. Adaptif Zorluk'tan zorluğu düşürmeyi veya görünmez modu açmayı değerlendir — gerçek kullanıcı kaybını azaltır.",
    "su.oneri.inceAyar.baslik": "İnce ayar fırsatı",
    "su.oneri.inceAyar.metin":
      "Orta düzey sürtünme var. Zorluğu bir kademe düşürmek dönüşümü artırırken güvenliği çoğu senaryoda korur.",
    "su.oneri.sikilastir.baslik": "Koruma sıkılaştırılabilir",
    "su.oneri.sikilastir.metin":
      "Neredeyse her istek geçiyor ve engelleme oranı çok düşük. Çok az bot yakalanıyor olabilir; zorluğu veya davranış eşiğini artırmayı değerlendir.",
    "su.oneri.terk.baslik": "Terk oranı yüksek",
    "su.oneri.terk.metin":
      "Gösterilen challenge'ların önemli kısmı çözülmeden kalıyor. Kullanıcıya daha net yönerge veya daha kolay bir challenge türü (ör. sayı/yön) sürtünmeyi azaltabilir.",
    "su.oneri.insanDusuk.baslik": "İnsan geçiş oranı düşük",
    "su.oneri.insanDusuk.metin":
      "Challenge gören meşru kullanıcıların tahmini geçiş oranı düşük. Zorluk seviyesi meşru trafiğe fazla ağır olabilir.",
    "su.oneri.saglikli.baslik": "Denge sağlıklı",
    "su.oneri.saglikli.metin":
      "Çözüm oranı ve sürtünme dengeli görünüyor. Gerçek kullanıcılar akıcı geçerken koruma da çalışıyor. Mevcut yapılandırmayı koru.",

    // --- Ölçülen vs modellenen notu ---
    "su.dogruluk.olculen": "Ölçülen:",
    "su.dogruluk.modellenen": "Modellenen:",
    "su.dogruluk.metin":
      " çözüm/terk oranı, gösterim, günlük trend (gerçek UsageCounter sayaçları) ve insan-geçiş tahmini (BotEvent verdict'leri). {modellenen} çözüm süresi ve zorluğa göre beklenen çözüm oranı — bunlar temsili UX beklentileridir, gerçek son-kullanıcı ölçümü değildir. Plan: {plan}.",
  },

  en: {
    "su.intro.baslik": "How smoothly do real users get through the challenge?",
    "su.intro.metin":
      "This console measures the friction that ghost-font verification imposes on legitimate humans: solve rate, abandonment, solve time, and friction by difficulty. Too much friction loses real users — balance security and UX here.",

    "su.stat.cozumOran": "Solve rate",
    "su.stat.terkOran": "Abandonment rate (approx.)",
    "su.stat.surtunmeSkoru": "Friction score",
    "su.stat.gosterim": "Impressions (30d)",

    "su.seviye.düşük": "low",
    "su.seviye.orta": "medium",
    "su.seviye.yüksek": "high",

    "su.yorum.baslik": "Friction: {seviye}",
    "su.yorum.skor": "score {skor}/100",
    "su.yorum.ipucu": "low score = less friction = good UX",
    "su.yorum.düşük":
      "Low friction: real users flow through smoothly. UX is healthy; if security is sufficient, keep the current setting.",
    "su.yorum.orta":
      "Medium friction: protection is working but there's some user loss. Fine-tuning difficulty/threshold can lift conversion.",
    "su.yorum.yüksek":
      "High friction: a significant share of legitimate users struggle or give up. Consider lowering difficulty or enabling invisible mode.",

    "su.huni.baslik": "Solve funnel",
    "su.huni.bos": "No impressions yet — the funnel fills as challenges are shown.",
    "su.huni.gosterildi": "Shown",
    "su.huni.gosterildi.alt": "Challenge presented to the user",
    "su.huni.cozuldu": "Solved",
    "su.huni.cozuldu.alt": "Passed verification",
    "su.huni.engellendi": "Blocked",
    "su.huni.engellendi.alt": "Bot / suspicious",
    "su.huni.terkedildi": "Abandoned",
    "su.huni.terkedildi.alt": "Left unsolved (approx.)",
    "su.huni.dipnot":
      "Abandoned = shown − solved − blocked. As there's no explicit \"abandoned\" counter, this is an {yaklasim}; unresolved / retried challenges are also collected in this remainder.",
    "su.huni.dipnot.yaklasim": "approximation",

    "su.trend.baslik": "Daily solve rate (%)",
    "su.trend.dipnot":
      "Daily solve rate = that day's solved / shown. A declining curve is an early signal of rising friction.",

    "su.insan.baslik": "Human solve experience (estimate)",
    "su.insan.insanOlay": "Human/good-bot event",
    "su.insan.challengeGoren": "Exposed to a challenge",
    "su.insan.tahminiOran": "Estimated pass rate",
    "su.insan.ortSure": "Avg. solve time (modeled)",
    "su.insan.ortSkor": "Avg. humanity score (0–1)",
    "su.insan.sn": "s",
    "su.insan.dipnot":
      "Since a single event can't be both \"saw a challenge\" and \"passed\", this is an {tahmin}: pass rate = allowed / (allowed + challenged). Solve time is deterministically {modellenmis} from the score (there is no real time field).",
    "su.insan.dipnot.tahmin": "estimate",
    "su.insan.dipnot.modellenmis": "modeled",

    "su.zorluk.baslik": "Friction by difficulty (modeled)",
    "su.zorluk.th.zorluk": "Difficulty",
    "su.zorluk.th.uzunluk": "Code length",
    "su.zorluk.th.cozum": "Expected solve",
    "su.zorluk.th.sure": "Avg. time",
    "su.zorluk.th.surtunme": "Friction",
    "su.zorluk.th.not": "Note",
    "su.zorluk.sweet": "sweet spot",
    "su.zorluk.hane": "digits",
    "su.zorluk.sn": "s",
    "su.zorluk.etiket.low": "Low",
    "su.zorluk.etiket.medium": "Medium",
    "su.zorluk.etiket.high": "High",
    "su.zorluk.not.low": "Smoothest. Mobile- and accessibility-friendly; the ideal sweet spot if protection suffices.",
    "su.zorluk.not.medium": "Balanced. The recommended default for most sites in security/UX terms.",
    "su.zorluk.not.high": "Strongest protection but visible friction. Only for high-risk flows.",
    "su.zorluk.dip.baslik": "Recommended balance:",
    "su.zorluk.dip.metin":
      "{etiket} difficulty ({uzunluk} digits) — enough protection, least friction. As the code lengthens, human reading errors and time rise; values are a representative model.",
    "su.zorluk.dip.buton": "Adjust difficulty",

    "su.oneri.baslik": "Recommendations — balance UX with security",
    "su.oneri.azalt.baslik": "Reduce friction",
    "su.oneri.azalt.metin":
      "The friction score is high. Consider lowering difficulty in Adaptive Difficulty or enabling invisible mode — it reduces real user loss.",
    "su.oneri.inceAyar.baslik": "Fine-tuning opportunity",
    "su.oneri.inceAyar.metin":
      "There's medium-level friction. Lowering difficulty one notch lifts conversion while preserving security in most scenarios.",
    "su.oneri.sikilastir.baslik": "Protection can be tightened",
    "su.oneri.sikilastir.metin":
      "Almost every request passes and the block rate is very low. Very few bots may be caught; consider raising difficulty or the behavioral threshold.",
    "su.oneri.terk.baslik": "High abandonment rate",
    "su.oneri.terk.metin":
      "A significant share of shown challenges is left unsolved. Clearer instructions or an easier challenge type (e.g. number/direction) can reduce friction.",
    "su.oneri.insanDusuk.baslik": "Low human pass rate",
    "su.oneri.insanDusuk.metin":
      "The estimated pass rate of legitimate users who saw a challenge is low. The difficulty level may be too heavy for legitimate traffic.",
    "su.oneri.saglikli.baslik": "Balance is healthy",
    "su.oneri.saglikli.metin":
      "Solve rate and friction look balanced. Real users flow through smoothly while protection also works. Keep the current configuration.",

    "su.dogruluk.olculen": "Measured:",
    "su.dogruluk.modellenen": "Modeled:",
    "su.dogruluk.metin":
      " solve/abandonment rate, impressions, daily trend (real UsageCounter counters) and human-pass estimate (BotEvent verdicts). {modellenen} solve time and expected solve rate by difficulty — these are representative UX expectations, not real end-user measurements. Plan: {plan}.",
  },

  de: {
    "su.intro.baslik": "Wie reibungslos kommen echte Nutzer durch die Challenge?",
    "su.intro.metin":
      "Diese Konsole misst die Reibung, die die Ghost-Font-Verifizierung legitimen Menschen auferlegt: Lösungsrate, Abbruch, Lösungszeit und Reibung nach Schwierigkeit. Zu viel Reibung kostet echte Nutzer — balanciere hier Sicherheit und UX.",

    "su.stat.cozumOran": "Lösungsrate",
    "su.stat.terkOran": "Abbruchrate (ca.)",
    "su.stat.surtunmeSkoru": "Reibungs-Score",
    "su.stat.gosterim": "Impressionen (30 T)",

    "su.seviye.düşük": "niedrig",
    "su.seviye.orta": "mittel",
    "su.seviye.yüksek": "hoch",

    "su.yorum.baslik": "Reibung: {seviye}",
    "su.yorum.skor": "Score {skor}/100",
    "su.yorum.ipucu": "niedriger Score = weniger Reibung = gute UX",
    "su.yorum.düşük":
      "Geringe Reibung: Echte Nutzer kommen reibungslos durch. Die UX ist gesund; wenn die Sicherheit ausreicht, behalte die aktuelle Einstellung bei.",
    "su.yorum.orta":
      "Mittlere Reibung: Der Schutz funktioniert, aber es gibt etwas Nutzerverlust. Feinabstimmung von Schwierigkeit/Schwelle kann die Conversion steigern.",
    "su.yorum.yüksek":
      "Hohe Reibung: Ein erheblicher Teil legitimer Nutzer hat Mühe oder gibt auf. Erwäge, die Schwierigkeit zu senken oder den unsichtbaren Modus zu aktivieren.",

    "su.huni.baslik": "Lösungstrichter",
    "su.huni.bos": "Noch keine Impressionen — der Trichter füllt sich, sobald Challenges gezeigt werden.",
    "su.huni.gosterildi": "Angezeigt",
    "su.huni.gosterildi.alt": "Dem Nutzer präsentierte Challenge",
    "su.huni.cozuldu": "Gelöst",
    "su.huni.cozuldu.alt": "Verifizierung bestanden",
    "su.huni.engellendi": "Blockiert",
    "su.huni.engellendi.alt": "Bot / verdächtig",
    "su.huni.terkedildi": "Abgebrochen",
    "su.huni.terkedildi.alt": "Ungelöst verlassen (ca.)",
    "su.huni.dipnot":
      "Abgebrochen = angezeigt − gelöst − blockiert. Da es keinen expliziten \"Abbruch\"-Zähler gibt, ist dies eine {yaklasim}; unabgeschlossene / erneut versuchte Challenges werden ebenfalls in diesem Rest erfasst.",
    "su.huni.dipnot.yaklasim": "Näherung",

    "su.trend.baslik": "Tägliche Lösungsrate (%)",
    "su.trend.dipnot":
      "Tägliche Lösungsrate = gelöst / angezeigt des Tages. Eine fallende Kurve ist ein frühes Signal steigender Reibung.",

    "su.insan.baslik": "Menschliche Lösungserfahrung (Schätzung)",
    "su.insan.insanOlay": "Mensch-/Good-Bot-Ereignis",
    "su.insan.challengeGoren": "Einer Challenge ausgesetzt",
    "su.insan.tahminiOran": "Geschätzte Durchlassrate",
    "su.insan.ortSure": "Ø Lösungszeit (modelliert)",
    "su.insan.ortSkor": "Ø Menschlichkeits-Score (0–1)",
    "su.insan.sn": "s",
    "su.insan.dipnot":
      "Da ein einzelnes Ereignis nicht zugleich \"sah eine Challenge\" und \"kam durch\" sein kann, ist dies eine {tahmin}: Durchlassrate = allowed / (allowed + challenged). Die Lösungszeit ist deterministisch aus dem Score {modellenmis} (es gibt kein echtes Zeitfeld).",
    "su.insan.dipnot.tahmin": "Schätzung",
    "su.insan.dipnot.modellenmis": "modelliert",

    "su.zorluk.baslik": "Reibung nach Schwierigkeit (modelliert)",
    "su.zorluk.th.zorluk": "Schwierigkeit",
    "su.zorluk.th.uzunluk": "Codelänge",
    "su.zorluk.th.cozum": "Erwartete Lösung",
    "su.zorluk.th.sure": "Ø Zeit",
    "su.zorluk.th.surtunme": "Reibung",
    "su.zorluk.th.not": "Notiz",
    "su.zorluk.sweet": "Sweet Spot",
    "su.zorluk.hane": "Stellen",
    "su.zorluk.sn": "s",
    "su.zorluk.etiket.low": "Niedrig",
    "su.zorluk.etiket.medium": "Mittel",
    "su.zorluk.etiket.high": "Hoch",
    "su.zorluk.not.low": "Am reibungslosesten. Mobil- und barrierefreundlich; der ideale Sweet Spot, wenn der Schutz ausreicht.",
    "su.zorluk.not.medium": "Ausgewogen. Der empfohlene Standard für die meisten Sites in puncto Sicherheit/UX.",
    "su.zorluk.not.high": "Stärkster Schutz, aber sichtbare Reibung. Nur für risikoreiche Abläufe.",
    "su.zorluk.dip.baslik": "Empfohlene Balance:",
    "su.zorluk.dip.metin":
      "{etiket} Schwierigkeit ({uzunluk} Stellen) — genug Schutz, geringste Reibung. Je länger der Code, desto mehr menschliche Lesefehler und Zeit; die Werte sind ein repräsentatives Modell.",
    "su.zorluk.dip.buton": "Schwierigkeit anpassen",

    "su.oneri.baslik": "Empfehlungen — UX mit Sicherheit ausbalancieren",
    "su.oneri.azalt.baslik": "Reibung reduzieren",
    "su.oneri.azalt.metin":
      "Der Reibungs-Score ist hoch. Erwäge, in der adaptiven Schwierigkeit die Schwierigkeit zu senken oder den unsichtbaren Modus zu aktivieren — das reduziert den Verlust echter Nutzer.",
    "su.oneri.inceAyar.baslik": "Feinabstimmungs-Chance",
    "su.oneri.inceAyar.metin":
      "Es gibt mittlere Reibung. Die Schwierigkeit um eine Stufe zu senken steigert die Conversion und erhält in den meisten Szenarien die Sicherheit.",
    "su.oneri.sikilastir.baslik": "Schutz kann verschärft werden",
    "su.oneri.sikilastir.metin":
      "Fast jede Anfrage kommt durch und die Blockrate ist sehr niedrig. Es werden womöglich sehr wenige Bots erwischt; erwäge, die Schwierigkeit oder die Verhaltensschwelle zu erhöhen.",
    "su.oneri.terk.baslik": "Hohe Abbruchrate",
    "su.oneri.terk.metin":
      "Ein erheblicher Teil der gezeigten Challenges bleibt ungelöst. Klarere Anweisungen oder ein einfacherer Challenge-Typ (z. B. Zahl/Richtung) können die Reibung senken.",
    "su.oneri.insanDusuk.baslik": "Niedrige menschliche Durchlassrate",
    "su.oneri.insanDusuk.metin":
      "Die geschätzte Durchlassrate legitimer Nutzer, die eine Challenge sahen, ist niedrig. Die Schwierigkeitsstufe könnte für legitimen Traffic zu hoch sein.",
    "su.oneri.saglikli.baslik": "Balance ist gesund",
    "su.oneri.saglikli.metin":
      "Lösungsrate und Reibung wirken ausgewogen. Echte Nutzer kommen reibungslos durch, während der Schutz ebenfalls greift. Behalte die aktuelle Konfiguration bei.",

    "su.dogruluk.olculen": "Gemessen:",
    "su.dogruluk.modellenen": "Modelliert:",
    "su.dogruluk.metin":
      " Lösungs-/Abbruchrate, Impressionen, Tagestrend (echte UsageCounter-Zähler) und Mensch-Durchlass-Schätzung (BotEvent-Verdicts). {modellenen} Lösungszeit und erwartete Lösungsrate nach Schwierigkeit — dies sind repräsentative UX-Erwartungen, keine echten Endnutzer-Messungen. Plan: {plan}.",
  },

  fr: {
    "su.intro.baslik": "Avec quelle fluidité les vrais utilisateurs franchissent-ils le défi ?",
    "su.intro.metin":
      "Cette console mesure la friction que la vérification ghost-font impose aux humains légitimes : taux de résolution, abandon, temps de résolution et friction selon la difficulté. Trop de friction fait perdre de vrais utilisateurs — équilibrez sécurité et UX ici.",

    "su.stat.cozumOran": "Taux de résolution",
    "su.stat.terkOran": "Taux d'abandon (approx.)",
    "su.stat.surtunmeSkoru": "Score de friction",
    "su.stat.gosterim": "Impressions (30 j)",

    "su.seviye.düşük": "faible",
    "su.seviye.orta": "moyenne",
    "su.seviye.yüksek": "élevée",

    "su.yorum.baslik": "Friction : {seviye}",
    "su.yorum.skor": "score {skor}/100",
    "su.yorum.ipucu": "score faible = moins de friction = bonne UX",
    "su.yorum.düşük":
      "Friction faible : les vrais utilisateurs passent avec fluidité. L'UX est saine ; si la sécurité suffit, conservez le réglage actuel.",
    "su.yorum.orta":
      "Friction moyenne : la protection fonctionne mais il y a une certaine perte d'utilisateurs. Affiner la difficulté/le seuil peut augmenter la conversion.",
    "su.yorum.yüksek":
      "Friction élevée : une part importante des utilisateurs légitimes peine ou abandonne. Envisagez de baisser la difficulté ou d'activer le mode invisible.",

    "su.huni.baslik": "Entonnoir de résolution",
    "su.huni.bos": "Aucune impression pour l'instant — l'entonnoir se remplit à mesure que les défis sont affichés.",
    "su.huni.gosterildi": "Affiché",
    "su.huni.gosterildi.alt": "Défi présenté à l'utilisateur",
    "su.huni.cozuldu": "Résolu",
    "su.huni.cozuldu.alt": "A passé la vérification",
    "su.huni.engellendi": "Bloqué",
    "su.huni.engellendi.alt": "Bot / suspect",
    "su.huni.terkedildi": "Abandonné",
    "su.huni.terkedildi.alt": "Laissé non résolu (approx.)",
    "su.huni.dipnot":
      "Abandon = affiché − résolu − bloqué. Faute d'un compteur \"abandon\" explicite, il s'agit d'une {yaklasim} ; les défis non aboutis / réessayés sont aussi regroupés dans ce reste.",
    "su.huni.dipnot.yaklasim": "approximation",

    "su.trend.baslik": "Taux de résolution quotidien (%)",
    "su.trend.dipnot":
      "Taux de résolution quotidien = résolus / affichés du jour. Une courbe descendante est un signal précoce d'une friction croissante.",

    "su.insan.baslik": "Expérience de résolution humaine (estimation)",
    "su.insan.insanOlay": "Événement humain/bon-bot",
    "su.insan.challengeGoren": "Exposé à un défi",
    "su.insan.tahminiOran": "Taux de passage estimé",
    "su.insan.ortSure": "Temps de résolution moyen (modélisé)",
    "su.insan.ortSkor": "Score d'humanité moyen (0–1)",
    "su.insan.sn": "s",
    "su.insan.dipnot":
      "Un même événement ne pouvant être à la fois \"a vu un défi\" et \"est passé\", ceci est une {tahmin} : taux de passage = allowed / (allowed + challenged). Le temps de résolution est {modellenmis} de manière déterministe à partir du score (il n'existe pas de champ de temps réel).",
    "su.insan.dipnot.tahmin": "estimation",
    "su.insan.dipnot.modellenmis": "modélisé",

    "su.zorluk.baslik": "Friction selon la difficulté (modélisée)",
    "su.zorluk.th.zorluk": "Difficulté",
    "su.zorluk.th.uzunluk": "Longueur du code",
    "su.zorluk.th.cozum": "Résolution attendue",
    "su.zorluk.th.sure": "Temps moyen",
    "su.zorluk.th.surtunme": "Friction",
    "su.zorluk.th.not": "Note",
    "su.zorluk.sweet": "sweet spot",
    "su.zorluk.hane": "chiffres",
    "su.zorluk.sn": "s",
    "su.zorluk.etiket.low": "Faible",
    "su.zorluk.etiket.medium": "Moyenne",
    "su.zorluk.etiket.high": "Élevée",
    "su.zorluk.not.low": "La plus fluide. Adaptée au mobile et à l'accessibilité ; le sweet spot idéal si la protection suffit.",
    "su.zorluk.not.medium": "Équilibrée. La valeur par défaut recommandée pour la plupart des sites en termes de sécurité/UX.",
    "su.zorluk.not.high": "Protection la plus forte mais friction visible. Uniquement pour les flux à haut risque.",
    "su.zorluk.dip.baslik": "Équilibre recommandé :",
    "su.zorluk.dip.metin":
      "Difficulté {etiket} ({uzunluk} chiffres) — protection suffisante, friction minimale. Plus le code s'allonge, plus les erreurs de lecture humaines et le temps augmentent ; les valeurs sont un modèle représentatif.",
    "su.zorluk.dip.buton": "Ajuster la difficulté",

    "su.oneri.baslik": "Recommandations — équilibrer UX et sécurité",
    "su.oneri.azalt.baslik": "Réduire la friction",
    "su.oneri.azalt.metin":
      "Le score de friction est élevé. Envisagez de baisser la difficulté dans Difficulté adaptative ou d'activer le mode invisible — cela réduit la perte de vrais utilisateurs.",
    "su.oneri.inceAyar.baslik": "Opportunité d'affinage",
    "su.oneri.inceAyar.metin":
      "Il y a une friction moyenne. Baisser la difficulté d'un cran augmente la conversion tout en préservant la sécurité dans la plupart des scénarios.",
    "su.oneri.sikilastir.baslik": "La protection peut être renforcée",
    "su.oneri.sikilastir.metin":
      "Presque toutes les requêtes passent et le taux de blocage est très faible. Très peu de bots sont peut-être attrapés ; envisagez d'augmenter la difficulté ou le seuil comportemental.",
    "su.oneri.terk.baslik": "Taux d'abandon élevé",
    "su.oneri.terk.metin":
      "Une part importante des défis affichés reste non résolue. Des instructions plus claires ou un type de défi plus simple (ex. chiffre/direction) peuvent réduire la friction.",
    "su.oneri.insanDusuk.baslik": "Taux de passage humain faible",
    "su.oneri.insanDusuk.metin":
      "Le taux de passage estimé des utilisateurs légitimes ayant vu un défi est faible. Le niveau de difficulté est peut-être trop lourd pour le trafic légitime.",
    "su.oneri.saglikli.baslik": "L'équilibre est sain",
    "su.oneri.saglikli.metin":
      "Le taux de résolution et la friction semblent équilibrés. Les vrais utilisateurs passent avec fluidité tandis que la protection fonctionne aussi. Conservez la configuration actuelle.",

    "su.dogruluk.olculen": "Mesuré :",
    "su.dogruluk.modellenen": "Modélisé :",
    "su.dogruluk.metin":
      " taux de résolution/abandon, impressions, tendance quotidienne (compteurs UsageCounter réels) et estimation du passage humain (verdicts BotEvent). {modellenen} temps de résolution et taux de résolution attendu selon la difficulté — ce sont des attentes UX représentatives, pas des mesures réelles d'utilisateurs finaux. Plan : {plan}.",
  },

  es: {
    "su.intro.baslik": "¿Con qué fluidez superan los usuarios reales el desafío?",
    "su.intro.metin":
      "Esta consola mide la fricción que la verificación ghost-font impone a los humanos legítimos: tasa de resolución, abandono, tiempo de resolución y fricción por dificultad. Demasiada fricción hace perder usuarios reales — equilibra seguridad y UX aquí.",

    "su.stat.cozumOran": "Tasa de resolución",
    "su.stat.terkOran": "Tasa de abandono (aprox.)",
    "su.stat.surtunmeSkoru": "Puntuación de fricción",
    "su.stat.gosterim": "Impresiones (30 d)",

    "su.seviye.düşük": "baja",
    "su.seviye.orta": "media",
    "su.seviye.yüksek": "alta",

    "su.yorum.baslik": "Fricción: {seviye}",
    "su.yorum.skor": "puntuación {skor}/100",
    "su.yorum.ipucu": "puntuación baja = menos fricción = buena UX",
    "su.yorum.düşük":
      "Fricción baja: los usuarios reales pasan con fluidez. La UX es sana; si la seguridad es suficiente, mantén el ajuste actual.",
    "su.yorum.orta":
      "Fricción media: la protección funciona pero hay cierta pérdida de usuarios. Afinar la dificultad/el umbral puede aumentar la conversión.",
    "su.yorum.yüksek":
      "Fricción alta: una parte importante de los usuarios legítimos tiene dificultades o abandona. Considera bajar la dificultad o activar el modo invisible.",

    "su.huni.baslik": "Embudo de resolución",
    "su.huni.bos": "Aún no hay impresiones — el embudo se llena a medida que se muestran los desafíos.",
    "su.huni.gosterildi": "Mostrado",
    "su.huni.gosterildi.alt": "Desafío presentado al usuario",
    "su.huni.cozuldu": "Resuelto",
    "su.huni.cozuldu.alt": "Superó la verificación",
    "su.huni.engellendi": "Bloqueado",
    "su.huni.engellendi.alt": "Bot / sospechoso",
    "su.huni.terkedildi": "Abandonado",
    "su.huni.terkedildi.alt": "Dejado sin resolver (aprox.)",
    "su.huni.dipnot":
      "Abandono = mostrado − resuelto − bloqueado. Al no haber un contador explícito de \"abandono\", esto es una {yaklasim}; los desafíos no concluidos / reintentados también se agrupan en este resto.",
    "su.huni.dipnot.yaklasim": "aproximación",

    "su.trend.baslik": "Tasa de resolución diaria (%)",
    "su.trend.dipnot":
      "Tasa de resolución diaria = resueltos / mostrados del día. Una curva descendente es una señal temprana de fricción creciente.",

    "su.insan.baslik": "Experiencia de resolución humana (estimación)",
    "su.insan.insanOlay": "Evento humano/buen-bot",
    "su.insan.challengeGoren": "Expuesto a un desafío",
    "su.insan.tahminiOran": "Tasa de paso estimada",
    "su.insan.ortSure": "Tiempo medio de resolución (modelado)",
    "su.insan.ortSkor": "Puntuación media de humanidad (0–1)",
    "su.insan.sn": "s",
    "su.insan.dipnot":
      "Como un mismo evento no puede ser a la vez \"vio un desafío\" y \"pasó\", esto es una {tahmin}: tasa de paso = allowed / (allowed + challenged). El tiempo de resolución se {modellenmis} de forma determinista a partir de la puntuación (no existe un campo de tiempo real).",
    "su.insan.dipnot.tahmin": "estimación",
    "su.insan.dipnot.modellenmis": "modela",

    "su.zorluk.baslik": "Fricción por dificultad (modelada)",
    "su.zorluk.th.zorluk": "Dificultad",
    "su.zorluk.th.uzunluk": "Longitud del código",
    "su.zorluk.th.cozum": "Resolución esperada",
    "su.zorluk.th.sure": "Tiempo medio",
    "su.zorluk.th.surtunme": "Fricción",
    "su.zorluk.th.not": "Nota",
    "su.zorluk.sweet": "sweet spot",
    "su.zorluk.hane": "dígitos",
    "su.zorluk.sn": "s",
    "su.zorluk.etiket.low": "Baja",
    "su.zorluk.etiket.medium": "Media",
    "su.zorluk.etiket.high": "Alta",
    "su.zorluk.not.low": "La más fluida. Compatible con móvil y accesibilidad; el sweet spot ideal si la protección basta.",
    "su.zorluk.not.medium": "Equilibrada. El valor predeterminado recomendado para la mayoría de sitios en términos de seguridad/UX.",
    "su.zorluk.not.high": "La protección más fuerte pero con fricción visible. Solo para flujos de alto riesgo.",
    "su.zorluk.dip.baslik": "Equilibrio recomendado:",
    "su.zorluk.dip.metin":
      "Dificultad {etiket} ({uzunluk} dígitos) — protección suficiente, mínima fricción. Cuanto más largo el código, más errores de lectura humanos y tiempo; los valores son un modelo representativo.",
    "su.zorluk.dip.buton": "Ajustar dificultad",

    "su.oneri.baslik": "Recomendaciones — equilibra UX y seguridad",
    "su.oneri.azalt.baslik": "Reducir la fricción",
    "su.oneri.azalt.metin":
      "La puntuación de fricción es alta. Considera bajar la dificultad en Dificultad adaptativa o activar el modo invisible — reduce la pérdida de usuarios reales.",
    "su.oneri.inceAyar.baslik": "Oportunidad de ajuste fino",
    "su.oneri.inceAyar.metin":
      "Hay fricción de nivel medio. Bajar la dificultad un nivel aumenta la conversión mientras preserva la seguridad en la mayoría de los escenarios.",
    "su.oneri.sikilastir.baslik": "La protección puede reforzarse",
    "su.oneri.sikilastir.metin":
      "Casi todas las solicitudes pasan y la tasa de bloqueo es muy baja. Puede que se atrapen muy pocos bots; considera aumentar la dificultad o el umbral de comportamiento.",
    "su.oneri.terk.baslik": "Tasa de abandono alta",
    "su.oneri.terk.metin":
      "Una parte importante de los desafíos mostrados queda sin resolver. Instrucciones más claras o un tipo de desafío más sencillo (p. ej. número/dirección) pueden reducir la fricción.",
    "su.oneri.insanDusuk.baslik": "Tasa de paso humano baja",
    "su.oneri.insanDusuk.metin":
      "La tasa de paso estimada de los usuarios legítimos que vieron un desafío es baja. El nivel de dificultad puede ser demasiado pesado para el tráfico legítimo.",
    "su.oneri.saglikli.baslik": "El equilibrio es sano",
    "su.oneri.saglikli.metin":
      "La tasa de resolución y la fricción parecen equilibradas. Los usuarios reales pasan con fluidez mientras la protección también funciona. Mantén la configuración actual.",

    "su.dogruluk.olculen": "Medido:",
    "su.dogruluk.modellenen": "Modelado:",
    "su.dogruluk.metin":
      " tasa de resolución/abandono, impresiones, tendencia diaria (contadores UsageCounter reales) y estimación de paso humano (veredictos BotEvent). {modellenen} tiempo de resolución y tasa de resolución esperada por dificultad — estas son expectativas de UX representativas, no mediciones reales de usuarios finales. Plan: {plan}.",
  },
};

export function surtunmeCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
