/**
 * Savunma Derinliği (Defense-in-Depth) sayfası — yerel çeviri sözlüğü.
 *
 * Sadece bu sayfaya özgü kullanıcı-görünür metinleri içerir. Paylaşılan
 * `src/lib/i18n/panel.ts` sözlüğüne DOKUNMAZ. Anahtar bulunamazsa TR'ye,
 * o da yoksa anahtarın kendisine düşer (eksik çeviri asla boş görünmez).
 *
 * Katman güvenliği: KatmanId enum DEĞERLERİ ("edge-rate-limit", "ip-itibar"…)
 * asla çevrilmez; katman adı/açıklama/yakalar metinleri "sd.katman.<id>.*"
 * anahtarlarıyla render sırasında çevrilir. Böylece katman.ts veri motoru
 * TR-yalın kalır. Sayılar/yüzdeler/oranlar veridir; {n} ile araya sokulur.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // Özet kartlar
    "sd.kart.savunmaKatmani": "Savunma katmanı",
    "sd.kart.yakalanan": "Yakalanan tehdit · {n} koruma",
    "sd.kart.sizan": "Sızan tehdit (tüm katmanları geçen)",
    "sd.kart.derinlik": "Koruma derinliği (ort. katman)",

    // Boş durum
    "sd.bos.baslik": "Henüz tehdit trafiği yok",
    "sd.bos.aciklama": "Katmanlı savunma hunisi, gözlemlenen gerçek tehdit olaylarından kurulur. Siteniz trafik görmeye başlayınca her katmanın kaç tehdit yakaladığı burada belirir.",

    // Huni (centerpiece)
    "sd.huni.baslik": "Katmanlı Savunma Hunisi",
    "sd.huni.sagUst": "{giren} tehdit girer · {sizan} sızar",
    "sd.huni.aciklama": "Tüm tehdit trafiği en üstten girer. Her katman kendi sinyaline uyan tehditleri durdurur (koyu dilim), kalanı bir alttaki katmana geçirir. Huni daraldıkça geriye daha az tehdit kalır — kümülatif koruma her katmanda derinleşir.",
    "sd.huni.giris": "{n} tehdit girişi",
    "sd.huni.gordu": "{n} gördü",
    "sd.huni.yakaladi": "{n} yakaladı",
    "sd.huni.gecti": "{n} geçti",
    "sd.huni.sizinti": "{n} tehdit tüm katmanları geçti (sızıntı)",
    "sd.huni.sifirSizinti": "Sıfır sızıntı — her tehdit bir katmanda durduruldu",

    // Katman detayları
    "sd.detay.baslik": "Katman Detayları",
    "sd.detay.katman": "KATMAN {n}",
    "sd.detay.yakalar": "Yakalar: {n}",
    "sd.detay.yakalanan": "yakalanan · {n} toplam",
    "sd.detay.buKatmanda": "bu katmanda",
    "sd.detay.kumulatif": "Kümülatif koruma (bu katmana kadar)",

    // Sızıntı analizi
    "sd.sizinti.baslik": "Sızıntı Analizi",
    "sd.sizinti.gecti": "tehdit tüm katmanları geçti",
    "sd.sizinti.aciklamaOn": "Bu tehditler hiçbir katmanın sinyaline takılmadı ve verdict'leri \"izin verildi\" idi — yani gözlemlenen kapatılması gereken açık. Toplam tehdidin ",
    "sd.sizinti.aciklamaSon": "'ini oluşturuyor. Yeni bir kural ya da daha sıkı bir davranış eşiği bu boşluğu bir sonraki katmana taşıyabilir.",
    "sd.sizinti.yakalanan": "Yakalanan",
    "sd.sizinti.sizan": "Sızan",
    "sd.sizinti.sifirBaslik": "Sıfır sızıntı",
    "sd.sizinti.sifirAciklama": "Gözlemlenen her tehdit katmanlardan birinde durduruldu. Hiçbir tehdit huninin sonuna kadar ulaşmadı — savunma derinliği tam kapsama sağlıyor.",
    "sd.sizinti.kumulatifRozet": "{n} kümülatif koruma",

    // Neden derinlik
    "sd.neden.baslik": "Neden Savunma Derinliği?",
    "sd.neden.p1On": "Hiçbir tek katman kusursuz değildir. Bir edge sınırı yavaş kazıyıcıları kaçırır; bir parmak izi filtresi taze bir botnet'i tanımaz; bir kural bir gün geç yazılır. Katmanlı savunma tam da bunun içindir: ",
    "sd.neden.p1Vurgu": "bir katmanın kaçırdığını bir sonraki yakalar.",
    "sd.neden.p2On": "Bu trafikte savunma ",
    "sd.neden.p2Katman": "{n} katman",
    "sd.neden.p2Orta": " derin ve ortalama bir tehdit ",
    "sd.neden.p2Katmanda": "{n}. katmanda",
    "sd.neden.p2Durduruluyor": " durduruluyor. Katmanlar birlikte tehditlerin ",
    "sd.neden.p2Elerken": "'ini elerken, tek bir katman bunun yalnızca bir kısmını yakalardı.",
    "sd.neden.enEtkili": "En etkili katman",
    "sd.neden.enEtkiliDeger": "{ad} · {n} tehdit",
    "sd.neden.durustlukOn": "Dürüstlük:",
    "sd.neden.durustlukSon": " Katman atfı, gerçek olay sinyallerinden deterministik çıkarılır — her tehdit onu durduracak EN ERKEN katmana kredilenir. Sayılar gözlemlenen olaylardan gelir; sızanlar dürüstçe işaretlenir.",

    // Katman adları (KatmanId → ad)
    "sd.katman.edge-rate-limit.ad": "Edge Hız Sınırı",
    "sd.katman.ip-itibar.ad": "IP İtibarı",
    "sd.katman.tls-parmakizi.ad": "TLS Parmak İzi",
    "sd.katman.davranis-skoru.ad": "Davranış Skoru",
    "sd.katman.ghost-font-challenge.ad": "Ghost-Font Challenge",
    "sd.katman.kural-motoru.ad": "Kural Motoru",

    // Katman açıklamaları
    "sd.katman.edge-rate-limit.aciklama": "İlk savunma hattı. Ağ kenarında hacim/hız temelli seller ve kaba-kuvvet dalgaları daha uygulamaya varmadan kesilir.",
    "sd.katman.ip-itibar.aciklama": "Kaynak IP ve ASN itibarı. Bilinen kötü ağlar, veri-merkezi/proxy blokları ve itibarsız kaynaklar erkenden elenir.",
    "sd.katman.tls-parmakizi.aciklama": "TLS el-sıkışma imzası ve tarayıcı parmak izi. UA Chrome derken TLS Python olan sahte istemciler ve headless otomasyon ifşa olur.",
    "sd.katman.davranis-skoru.aciklama": "İstemci davranışından türetilen insanlık skoru. İnsan-benzeri etkileşim üretemeyen, düşük skorlu otomasyon burada yakalanır.",
    "sd.katman.ghost-font-challenge.aciklama": "Veylify'ın imza savunması. OCR'ı %100 kör eden temporal-dithering ghost-font challenge; makine çözemez, insan geçer.",
    "sd.katman.kural-motoru.aciklama": "Son geniş ağ. Önceki katmanları geçen ama özel politika kurallarına (path, ülke, AI-ajan…) takılan artık tehditleri toplar.",

    // Katman "yakalar" sinyalleri
    "sd.katman.edge-rate-limit.yakalar": "Yüksek hacim / rate taşkını (DDoS, flood, kaba kuvvet)",
    "sd.katman.ip-itibar.yakalar": "Kötü ASN / itibarsız IP (datacenter, botnet, kötü ağ)",
    "sd.katman.tls-parmakizi.yakalar": "TLS/UA uyumsuzluğu, headless tarayıcı, otomasyon imzası",
    "sd.katman.davranis-skoru.yakalar": "Düşük insanlık skoru (insan-dışı etkileşim örüntüsü)",
    "sd.katman.ghost-font-challenge.yakalar": "Challenge'a takılan otomasyon (OCR/bot çözemez)",
    "sd.katman.kural-motoru.yakalar": "Özel kural eşleşmesi (politika ihlali) + artık tehdit",
  },

  en: {
    "sd.kart.savunmaKatmani": "Defense layers",
    "sd.kart.yakalanan": "Threats caught · {n} protection",
    "sd.kart.sizan": "Leaked threats (passed every layer)",
    "sd.kart.derinlik": "Protection depth (avg. layer)",

    "sd.bos.baslik": "No threat traffic yet",
    "sd.bos.aciklama": "The layered defense funnel is built from observed real threat events. Once your site starts seeing traffic, how many threats each layer catches appears here.",

    "sd.huni.baslik": "Layered Defense Funnel",
    "sd.huni.sagUst": "{giren} threats enter · {sizan} leak",
    "sd.huni.aciklama": "All threat traffic enters at the top. Each layer stops threats matching its signal (dark slice) and passes the rest to the layer below. As the funnel narrows, fewer threats remain — cumulative protection deepens at every layer.",
    "sd.huni.giris": "{n} threat intake",
    "sd.huni.gordu": "saw {n}",
    "sd.huni.yakaladi": "caught {n}",
    "sd.huni.gecti": "{n} passed",
    "sd.huni.sizinti": "{n} threats passed every layer (leak)",
    "sd.huni.sifirSizinti": "Zero leak — every threat was stopped at a layer",

    "sd.detay.baslik": "Layer Details",
    "sd.detay.katman": "LAYER {n}",
    "sd.detay.yakalar": "Catches: {n}",
    "sd.detay.yakalanan": "caught · {n} of total",
    "sd.detay.buKatmanda": "at this layer",
    "sd.detay.kumulatif": "Cumulative protection (up to this layer)",

    "sd.sizinti.baslik": "Leak Analysis",
    "sd.sizinti.gecti": "threats passed every layer",
    "sd.sizinti.aciklamaOn": "These threats matched no layer's signal and their verdict was \"allowed\" — an observed gap that needs closing. They make up ",
    "sd.sizinti.aciklamaSon": " of total threats. A new rule or a stricter behavior threshold could push this gap to the next layer.",
    "sd.sizinti.yakalanan": "Caught",
    "sd.sizinti.sizan": "Leaked",
    "sd.sizinti.sifirBaslik": "Zero leak",
    "sd.sizinti.sifirAciklama": "Every observed threat was stopped at one of the layers. No threat reached the end of the funnel — defense in depth provides full coverage.",
    "sd.sizinti.kumulatifRozet": "{n} cumulative protection",

    "sd.neden.baslik": "Why Defense in Depth?",
    "sd.neden.p1On": "No single layer is flawless. An edge limit misses slow scrapers; a fingerprint filter won't recognize a fresh botnet; a rule gets written a day too late. That's exactly what layered defense is for: ",
    "sd.neden.p1Vurgu": "what one layer misses, the next one catches.",
    "sd.neden.p2On": "In this traffic, defense is ",
    "sd.neden.p2Katman": "{n} layers",
    "sd.neden.p2Orta": " deep, and an average threat is stopped at the ",
    "sd.neden.p2Katmanda": "{n} layer",
    "sd.neden.p2Durduruluyor": ". Together the layers eliminate ",
    "sd.neden.p2Elerken": " of threats, while a single layer would catch only a fraction of that.",
    "sd.neden.enEtkili": "Most effective layer",
    "sd.neden.enEtkiliDeger": "{ad} · {n} threats",
    "sd.neden.durustlukOn": "Honesty:",
    "sd.neden.durustlukSon": " Layer attribution is derived deterministically from real event signals — each threat is credited to the EARLIEST layer that would stop it. The numbers come from observed events; leaks are flagged honestly.",

    "sd.katman.edge-rate-limit.ad": "Edge Rate Limit",
    "sd.katman.ip-itibar.ad": "IP Reputation",
    "sd.katman.tls-parmakizi.ad": "TLS Fingerprint",
    "sd.katman.davranis-skoru.ad": "Behavior Score",
    "sd.katman.ghost-font-challenge.ad": "Ghost-Font Challenge",
    "sd.katman.kural-motoru.ad": "Rule Engine",

    "sd.katman.edge-rate-limit.aciklama": "First line of defense. At the network edge, volume/rate-based floods and brute-force waves are cut before they ever reach the application.",
    "sd.katman.ip-itibar.aciklama": "Source IP and ASN reputation. Known-bad networks, datacenter/proxy ranges and disreputable sources are eliminated early.",
    "sd.katman.tls-parmakizi.aciklama": "TLS handshake signature and browser fingerprint. Fake clients that claim Chrome in the UA but speak Python in TLS, and headless automation, are exposed.",
    "sd.katman.davranis-skoru.aciklama": "A humanity score derived from client behavior. Low-scoring automation that can't produce human-like interaction is caught here.",
    "sd.katman.ghost-font-challenge.aciklama": "Veylify's signature defense. A temporal-dithering ghost-font challenge that blinds OCR 100%; machines can't solve it, humans pass.",
    "sd.katman.kural-motoru.aciklama": "The final wide net. Collects residual threats that passed earlier layers but trip custom policy rules (path, country, AI agent…).",

    "sd.katman.edge-rate-limit.yakalar": "High volume / rate flooding (DDoS, flood, brute force)",
    "sd.katman.ip-itibar.yakalar": "Bad ASN / disreputable IP (datacenter, botnet, bad network)",
    "sd.katman.tls-parmakizi.yakalar": "TLS/UA mismatch, headless browser, automation signature",
    "sd.katman.davranis-skoru.yakalar": "Low humanity score (non-human interaction pattern)",
    "sd.katman.ghost-font-challenge.yakalar": "Automation caught by the challenge (OCR/bots can't solve)",
    "sd.katman.kural-motoru.yakalar": "Custom rule match (policy violation) + residual threat",
  },

  de: {
    "sd.kart.savunmaKatmani": "Verteidigungsschichten",
    "sd.kart.yakalanan": "Erfasste Bedrohungen · {n} Schutz",
    "sd.kart.sizan": "Durchgesickerte Bedrohungen (alle Schichten passiert)",
    "sd.kart.derinlik": "Schutztiefe (Ø Schicht)",

    "sd.bos.baslik": "Noch kein Bedrohungsverkehr",
    "sd.bos.aciklama": "Der mehrschichtige Verteidigungstrichter wird aus beobachteten echten Bedrohungsereignissen aufgebaut. Sobald Ihre Website Traffic sieht, erscheint hier, wie viele Bedrohungen jede Schicht abfängt.",

    "sd.huni.baslik": "Mehrschichtiger Verteidigungstrichter",
    "sd.huni.sagUst": "{giren} Bedrohungen treten ein · {sizan} sickern durch",
    "sd.huni.aciklama": "Der gesamte Bedrohungsverkehr tritt oben ein. Jede Schicht stoppt Bedrohungen, die ihrem Signal entsprechen (dunkles Segment), und leitet den Rest an die darunterliegende Schicht weiter. Während der Trichter schmaler wird, bleiben weniger Bedrohungen übrig — der kumulative Schutz vertieft sich mit jeder Schicht.",
    "sd.huni.giris": "{n} Bedrohungseingang",
    "sd.huni.gordu": "sah {n}",
    "sd.huni.yakaladi": "fing {n}",
    "sd.huni.gecti": "{n} passiert",
    "sd.huni.sizinti": "{n} Bedrohungen passierten alle Schichten (Leck)",
    "sd.huni.sifirSizinti": "Null Leck — jede Bedrohung wurde an einer Schicht gestoppt",

    "sd.detay.baslik": "Schichtdetails",
    "sd.detay.katman": "SCHICHT {n}",
    "sd.detay.yakalar": "Fängt: {n}",
    "sd.detay.yakalanan": "erfasst · {n} vom Gesamt",
    "sd.detay.buKatmanda": "auf dieser Schicht",
    "sd.detay.kumulatif": "Kumulativer Schutz (bis zu dieser Schicht)",

    "sd.sizinti.baslik": "Leck-Analyse",
    "sd.sizinti.gecti": "Bedrohungen passierten alle Schichten",
    "sd.sizinti.aciklamaOn": "Diese Bedrohungen entsprachen keinem Schichtsignal und ihr Urteil war \"erlaubt\" — eine beobachtete Lücke, die geschlossen werden muss. Sie machen ",
    "sd.sizinti.aciklamaSon": " der Gesamtbedrohungen aus. Eine neue Regel oder eine strengere Verhaltensschwelle könnte diese Lücke auf die nächste Schicht verlagern.",
    "sd.sizinti.yakalanan": "Erfasst",
    "sd.sizinti.sizan": "Durchgesickert",
    "sd.sizinti.sifirBaslik": "Null Leck",
    "sd.sizinti.sifirAciklama": "Jede beobachtete Bedrohung wurde an einer der Schichten gestoppt. Keine Bedrohung erreichte das Ende des Trichters — die Tiefenverteidigung bietet vollständige Abdeckung.",
    "sd.sizinti.kumulatifRozet": "{n} kumulativer Schutz",

    "sd.neden.baslik": "Warum Tiefenverteidigung?",
    "sd.neden.p1On": "Keine einzelne Schicht ist makellos. Ein Edge-Limit verpasst langsame Scraper; ein Fingerprint-Filter erkennt ein frisches Botnet nicht; eine Regel wird einen Tag zu spät geschrieben. Genau dafür ist die mehrschichtige Verteidigung da: ",
    "sd.neden.p1Vurgu": "was eine Schicht verpasst, fängt die nächste ab.",
    "sd.neden.p2On": "In diesem Traffic ist die Verteidigung ",
    "sd.neden.p2Katman": "{n} Schichten",
    "sd.neden.p2Orta": " tief, und eine durchschnittliche Bedrohung wird auf der ",
    "sd.neden.p2Katmanda": "{n}. Schicht",
    "sd.neden.p2Durduruluyor": " gestoppt. Zusammen eliminieren die Schichten ",
    "sd.neden.p2Elerken": " der Bedrohungen, während eine einzelne Schicht nur einen Bruchteil davon abfangen würde.",
    "sd.neden.enEtkili": "Effektivste Schicht",
    "sd.neden.enEtkiliDeger": "{ad} · {n} Bedrohungen",
    "sd.neden.durustlukOn": "Ehrlichkeit:",
    "sd.neden.durustlukSon": " Die Schichtzuordnung wird deterministisch aus echten Ereignissignalen abgeleitet — jede Bedrohung wird der FRÜHESTEN Schicht gutgeschrieben, die sie stoppen würde. Die Zahlen stammen aus beobachteten Ereignissen; Lecks werden ehrlich markiert.",

    "sd.katman.edge-rate-limit.ad": "Edge-Ratenlimit",
    "sd.katman.ip-itibar.ad": "IP-Reputation",
    "sd.katman.tls-parmakizi.ad": "TLS-Fingerabdruck",
    "sd.katman.davranis-skoru.ad": "Verhaltensscore",
    "sd.katman.ghost-font-challenge.ad": "Ghost-Font-Challenge",
    "sd.katman.kural-motoru.ad": "Regel-Engine",

    "sd.katman.edge-rate-limit.aciklama": "Erste Verteidigungslinie. Am Netzwerkrand werden volumen-/ratenbasierte Fluten und Brute-Force-Wellen abgeschnitten, bevor sie die Anwendung erreichen.",
    "sd.katman.ip-itibar.aciklama": "Reputation von Quell-IP und ASN. Bekannt schädliche Netzwerke, Datacenter-/Proxy-Bereiche und unseriöse Quellen werden früh ausgesondert.",
    "sd.katman.tls-parmakizi.aciklama": "TLS-Handshake-Signatur und Browser-Fingerabdruck. Gefälschte Clients, die im UA Chrome behaupten, aber im TLS Python sprechen, sowie Headless-Automatisierung werden entlarvt.",
    "sd.katman.davranis-skoru.aciklama": "Ein aus dem Client-Verhalten abgeleiteter Menschlichkeits-Score. Niedrig bewertete Automatisierung, die keine menschenähnliche Interaktion erzeugen kann, wird hier gefangen.",
    "sd.katman.ghost-font-challenge.aciklama": "Veylifys Signatur-Verteidigung. Eine Temporal-Dithering-Ghost-Font-Challenge, die OCR zu 100 % blendet; Maschinen können sie nicht lösen, Menschen bestehen sie.",
    "sd.katman.kural-motoru.aciklama": "Das letzte weite Netz. Sammelt Restbedrohungen, die frühere Schichten passiert haben, aber gegen benutzerdefinierte Richtlinienregeln (Pfad, Land, KI-Agent…) verstoßen.",

    "sd.katman.edge-rate-limit.yakalar": "Hohes Volumen / Rate-Flooding (DDoS, Flood, Brute Force)",
    "sd.katman.ip-itibar.yakalar": "Schädliches ASN / unseriöse IP (Datacenter, Botnet, schädliches Netz)",
    "sd.katman.tls-parmakizi.yakalar": "TLS/UA-Diskrepanz, Headless-Browser, Automatisierungssignatur",
    "sd.katman.davranis-skoru.yakalar": "Niedriger Menschlichkeits-Score (nicht-menschliches Interaktionsmuster)",
    "sd.katman.ghost-font-challenge.yakalar": "Von der Challenge gefangene Automatisierung (OCR/Bots können nicht lösen)",
    "sd.katman.kural-motoru.yakalar": "Benutzerdefinierte Regelübereinstimmung (Richtlinienverstoß) + Restbedrohung",
  },

  fr: {
    "sd.kart.savunmaKatmani": "Couches de défense",
    "sd.kart.yakalanan": "Menaces interceptées · {n} de protection",
    "sd.kart.sizan": "Menaces infiltrées (ayant franchi toutes les couches)",
    "sd.kart.derinlik": "Profondeur de protection (couche moy.)",

    "sd.bos.baslik": "Aucun trafic de menace pour l'instant",
    "sd.bos.aciklama": "L'entonnoir de défense en couches est construit à partir d'événements de menace réels observés. Dès que votre site commence à voir du trafic, le nombre de menaces interceptées par chaque couche apparaît ici.",

    "sd.huni.baslik": "Entonnoir de défense en couches",
    "sd.huni.sagUst": "{giren} menaces entrent · {sizan} s'infiltrent",
    "sd.huni.aciklama": "Tout le trafic de menace entre par le haut. Chaque couche arrête les menaces correspondant à son signal (segment foncé) et transmet le reste à la couche inférieure. À mesure que l'entonnoir se rétrécit, il reste moins de menaces — la protection cumulative s'approfondit à chaque couche.",
    "sd.huni.giris": "{n} entrée de menaces",
    "sd.huni.gordu": "a vu {n}",
    "sd.huni.yakaladi": "a intercepté {n}",
    "sd.huni.gecti": "{n} passées",
    "sd.huni.sizinti": "{n} menaces ont franchi toutes les couches (infiltration)",
    "sd.huni.sifirSizinti": "Zéro infiltration — chaque menace a été arrêtée à une couche",

    "sd.detay.baslik": "Détails des couches",
    "sd.detay.katman": "COUCHE {n}",
    "sd.detay.yakalar": "Intercepte : {n}",
    "sd.detay.yakalanan": "interceptées · {n} du total",
    "sd.detay.buKatmanda": "à cette couche",
    "sd.detay.kumulatif": "Protection cumulative (jusqu'à cette couche)",

    "sd.sizinti.baslik": "Analyse d'infiltration",
    "sd.sizinti.gecti": "menaces ont franchi toutes les couches",
    "sd.sizinti.aciklamaOn": "Ces menaces ne correspondaient au signal d'aucune couche et leur verdict était « autorisé » — une faille observée à combler. Elles représentent ",
    "sd.sizinti.aciklamaSon": " des menaces totales. Une nouvelle règle ou un seuil comportemental plus strict pourrait déplacer cette faille vers la couche suivante.",
    "sd.sizinti.yakalanan": "Interceptées",
    "sd.sizinti.sizan": "Infiltrées",
    "sd.sizinti.sifirBaslik": "Zéro infiltration",
    "sd.sizinti.sifirAciklama": "Chaque menace observée a été arrêtée à l'une des couches. Aucune menace n'a atteint la fin de l'entonnoir — la défense en profondeur assure une couverture totale.",
    "sd.sizinti.kumulatifRozet": "{n} de protection cumulative",

    "sd.neden.baslik": "Pourquoi la défense en profondeur ?",
    "sd.neden.p1On": "Aucune couche unique n'est parfaite. Une limite edge rate les scrapers lents ; un filtre d'empreinte ne reconnaît pas un botnet récent ; une règle est écrite un jour trop tard. C'est précisément à cela que sert la défense en couches : ",
    "sd.neden.p1Vurgu": "ce qu'une couche laisse passer, la suivante l'intercepte.",
    "sd.neden.p2On": "Dans ce trafic, la défense est profonde de ",
    "sd.neden.p2Katman": "{n} couches",
    "sd.neden.p2Orta": " et une menace moyenne est arrêtée à la ",
    "sd.neden.p2Katmanda": "couche {n}",
    "sd.neden.p2Durduruluyor": ". Ensemble, les couches éliminent ",
    "sd.neden.p2Elerken": " des menaces, alors qu'une seule couche n'en intercepterait qu'une fraction.",
    "sd.neden.enEtkili": "Couche la plus efficace",
    "sd.neden.enEtkiliDeger": "{ad} · {n} menaces",
    "sd.neden.durustlukOn": "Honnêteté :",
    "sd.neden.durustlukSon": " L'attribution de couche est dérivée de manière déterministe à partir de signaux d'événements réels — chaque menace est créditée à la couche la PLUS PRÉCOCE qui l'arrêterait. Les chiffres proviennent d'événements observés ; les infiltrations sont signalées honnêtement.",

    "sd.katman.edge-rate-limit.ad": "Limite de débit Edge",
    "sd.katman.ip-itibar.ad": "Réputation IP",
    "sd.katman.tls-parmakizi.ad": "Empreinte TLS",
    "sd.katman.davranis-skoru.ad": "Score comportemental",
    "sd.katman.ghost-font-challenge.ad": "Défi Ghost-Font",
    "sd.katman.kural-motoru.ad": "Moteur de règles",

    "sd.katman.edge-rate-limit.aciklama": "Première ligne de défense. À la périphérie du réseau, les déluges basés sur le volume/débit et les vagues de force brute sont coupés avant même d'atteindre l'application.",
    "sd.katman.ip-itibar.aciklama": "Réputation de l'IP source et de l'ASN. Les réseaux connus comme malveillants, les plages datacenter/proxy et les sources peu fiables sont éliminés tôt.",
    "sd.katman.tls-parmakizi.aciklama": "Signature de handshake TLS et empreinte du navigateur. Les faux clients qui annoncent Chrome dans l'UA mais parlent Python en TLS, ainsi que l'automatisation headless, sont démasqués.",
    "sd.katman.davranis-skoru.aciklama": "Un score d'humanité dérivé du comportement du client. L'automatisation à faible score, incapable de produire une interaction humaine, est interceptée ici.",
    "sd.katman.ghost-font-challenge.aciklama": "La défense signature de Veylify. Un défi ghost-font à tramage temporel qui aveugle l'OCR à 100 % ; les machines ne peuvent pas le résoudre, les humains le passent.",
    "sd.katman.kural-motoru.aciklama": "Le dernier grand filet. Collecte les menaces résiduelles ayant franchi les couches précédentes mais déclenchant des règles de politique personnalisées (chemin, pays, agent IA…).",

    "sd.katman.edge-rate-limit.yakalar": "Volume élevé / inondation de débit (DDoS, flood, force brute)",
    "sd.katman.ip-itibar.yakalar": "ASN malveillant / IP peu fiable (datacenter, botnet, réseau malveillant)",
    "sd.katman.tls-parmakizi.yakalar": "Incohérence TLS/UA, navigateur headless, signature d'automatisation",
    "sd.katman.davranis-skoru.yakalar": "Faible score d'humanité (schéma d'interaction non humain)",
    "sd.katman.ghost-font-challenge.yakalar": "Automatisation interceptée par le défi (OCR/bots ne peuvent pas résoudre)",
    "sd.katman.kural-motoru.yakalar": "Correspondance de règle personnalisée (violation de politique) + menace résiduelle",
  },

  es: {
    "sd.kart.savunmaKatmani": "Capas de defensa",
    "sd.kart.yakalanan": "Amenazas capturadas · {n} de protección",
    "sd.kart.sizan": "Amenazas filtradas (que pasaron todas las capas)",
    "sd.kart.derinlik": "Profundidad de protección (capa prom.)",

    "sd.bos.baslik": "Aún no hay tráfico de amenazas",
    "sd.bos.aciklama": "El embudo de defensa en capas se construye a partir de eventos de amenaza reales observados. Cuando tu sitio empiece a ver tráfico, aquí aparecerá cuántas amenazas captura cada capa.",

    "sd.huni.baslik": "Embudo de defensa en capas",
    "sd.huni.sagUst": "{giren} amenazas entran · {sizan} se filtran",
    "sd.huni.aciklama": "Todo el tráfico de amenazas entra por arriba. Cada capa detiene las amenazas que coinciden con su señal (segmento oscuro) y pasa el resto a la capa inferior. A medida que el embudo se estrecha, quedan menos amenazas — la protección acumulativa se profundiza en cada capa.",
    "sd.huni.giris": "{n} entrada de amenazas",
    "sd.huni.gordu": "vio {n}",
    "sd.huni.yakaladi": "capturó {n}",
    "sd.huni.gecti": "{n} pasaron",
    "sd.huni.sizinti": "{n} amenazas pasaron todas las capas (filtración)",
    "sd.huni.sifirSizinti": "Cero filtración — cada amenaza se detuvo en una capa",

    "sd.detay.baslik": "Detalles de capa",
    "sd.detay.katman": "CAPA {n}",
    "sd.detay.yakalar": "Captura: {n}",
    "sd.detay.yakalanan": "capturadas · {n} del total",
    "sd.detay.buKatmanda": "en esta capa",
    "sd.detay.kumulatif": "Protección acumulativa (hasta esta capa)",

    "sd.sizinti.baslik": "Análisis de filtración",
    "sd.sizinti.gecti": "amenazas pasaron todas las capas",
    "sd.sizinti.aciklamaOn": "Estas amenazas no coincidieron con la señal de ninguna capa y su veredicto fue «permitido» — una brecha observada que hay que cerrar. Constituyen ",
    "sd.sizinti.aciklamaSon": " del total de amenazas. Una nueva regla o un umbral de comportamiento más estricto podría trasladar esta brecha a la siguiente capa.",
    "sd.sizinti.yakalanan": "Capturadas",
    "sd.sizinti.sizan": "Filtradas",
    "sd.sizinti.sifirBaslik": "Cero filtración",
    "sd.sizinti.sifirAciklama": "Cada amenaza observada se detuvo en una de las capas. Ninguna amenaza llegó al final del embudo — la defensa en profundidad ofrece cobertura total.",
    "sd.sizinti.kumulatifRozet": "{n} de protección acumulativa",

    "sd.neden.baslik": "¿Por qué defensa en profundidad?",
    "sd.neden.p1On": "Ninguna capa individual es perfecta. Un límite edge se le escapan los scrapers lentos; un filtro de huella no reconoce una botnet reciente; una regla se escribe un día tarde. Para eso sirve exactamente la defensa en capas: ",
    "sd.neden.p1Vurgu": "lo que una capa deja pasar, la siguiente lo captura.",
    "sd.neden.p2On": "En este tráfico, la defensa tiene ",
    "sd.neden.p2Katman": "{n} capas",
    "sd.neden.p2Orta": " de profundidad, y una amenaza promedio se detiene en la ",
    "sd.neden.p2Katmanda": "capa {n}",
    "sd.neden.p2Durduruluyor": ". Juntas, las capas eliminan ",
    "sd.neden.p2Elerken": " de las amenazas, mientras que una sola capa capturaría solo una fracción de eso.",
    "sd.neden.enEtkili": "Capa más efectiva",
    "sd.neden.enEtkiliDeger": "{ad} · {n} amenazas",
    "sd.neden.durustlukOn": "Honestidad:",
    "sd.neden.durustlukSon": " La atribución de capa se deriva de forma determinista a partir de señales de eventos reales — cada amenaza se acredita a la capa MÁS TEMPRANA que la detendría. Los números provienen de eventos observados; las filtraciones se marcan honestamente.",

    "sd.katman.edge-rate-limit.ad": "Límite de tasa Edge",
    "sd.katman.ip-itibar.ad": "Reputación de IP",
    "sd.katman.tls-parmakizi.ad": "Huella TLS",
    "sd.katman.davranis-skoru.ad": "Puntuación de comportamiento",
    "sd.katman.ghost-font-challenge.ad": "Desafío Ghost-Font",
    "sd.katman.kural-motoru.ad": "Motor de reglas",

    "sd.katman.edge-rate-limit.aciklama": "Primera línea de defensa. En el borde de la red, las inundaciones basadas en volumen/tasa y las oleadas de fuerza bruta se cortan antes de llegar a la aplicación.",
    "sd.katman.ip-itibar.aciklama": "Reputación de la IP de origen y del ASN. Las redes conocidas como maliciosas, los rangos de datacenter/proxy y las fuentes sin reputación se eliminan temprano.",
    "sd.katman.tls-parmakizi.aciklama": "Firma del handshake TLS y huella del navegador. Los clientes falsos que dicen Chrome en el UA pero hablan Python en TLS, y la automatización headless, quedan al descubierto.",
    "sd.katman.davranis-skoru.aciklama": "Una puntuación de humanidad derivada del comportamiento del cliente. La automatización de baja puntuación que no puede producir interacción humana se captura aquí.",
    "sd.katman.ghost-font-challenge.aciklama": "La defensa insignia de Veylify. Un desafío ghost-font de tramado temporal que ciega el OCR al 100 %; las máquinas no pueden resolverlo, los humanos lo pasan.",
    "sd.katman.kural-motoru.aciklama": "La última red amplia. Reúne las amenazas residuales que pasaron las capas anteriores pero activan reglas de política personalizadas (ruta, país, agente IA…).",

    "sd.katman.edge-rate-limit.yakalar": "Alto volumen / inundación de tasa (DDoS, flood, fuerza bruta)",
    "sd.katman.ip-itibar.yakalar": "ASN malicioso / IP sin reputación (datacenter, botnet, red maliciosa)",
    "sd.katman.tls-parmakizi.yakalar": "Incompatibilidad TLS/UA, navegador headless, firma de automatización",
    "sd.katman.davranis-skoru.yakalar": "Baja puntuación de humanidad (patrón de interacción no humano)",
    "sd.katman.ghost-font-challenge.yakalar": "Automatización capturada por el desafío (OCR/bots no pueden resolver)",
    "sd.katman.kural-motoru.yakalar": "Coincidencia de regla personalizada (violación de política) + amenaza residual",
  },
};

export function sdCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
