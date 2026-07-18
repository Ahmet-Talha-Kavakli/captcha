/**
 * Olay Müdahale Playbook Motoru — yerel i18n sözlüğü.
 *
 * Panel deseni: her sayfa kendi düz sözlüğünü taşır; `mudahaleCeviri(anahtar, dil)`
 * hedef dile, bulunamazsa TR'ye, o da yoksa anahtarın kendisine düşer.
 *
 * ENUM GÜVENLİĞİ: enum/id değerleri (playbook id, faz, şiddet, sorumlu) asla
 * çevrilmez; burada id/faz → çeviri KEY-MAP'leri tutulur:
 *   - "faz.tespit" … "faz.kapanış"          (playbook.ts FAZ_ETIKET karşılığı)
 *   - "siddet.kritik" / "siddet.yuksek" …    (Siddet enum'u)
 *   - "sorumlu.Specter" / "sorumlu.Operatör" (Sorumlu enum'u)
 *   - "pb.<id>.ad" / ".tetikleyici" / ".aciklama"  (playbook metinleri)
 *   - "pb.<id>.s<sira>.baslik" / ".aksiyon"        (adım metinleri)
 * Lib (playbook.ts) DÜZENLENMEDEN, istemci tarafı bu anahtarlardan yeniden türetir.
 *
 * Sayısal değerler (adım sayısı, dakika, yüzde, olay sayısı) VERİDİR; çevrilmez,
 * BCP-47 ile biçimlendirilir. Enterpolasyon `.replace("{n}", …)` ile yapılır.
 */
import type { Dil } from "@/lib/i18n/panel";

const sozluk: Record<Dil, Record<string, string>> = {
  tr: {
    // başlık — panel.ts nav.incident ile eşleşir ("Olay Müdahale")
    "x.baslik": "Olay Müdahale",

    // açıklama şeridi
    "aciklama.baslik": "Saldırı türüne göre hazır müdahale runbook'ları.",
    "aciklama.metin":
      "Her saldırı türü için önceden yazılmış, fazlara ayrılmış bir müdahale planı ({fazlar}). Hangi playbook'un {simdi} gerektiği {gercek} ({n} olay) hesaplanır. Bir olay sırasında playbook'u aç, adımları yürüt, ilerlemeni izle.",
    "aciklama.fazlar": "tespit → sınırlama → engelleme → doğrulama → kapanış",
    "aciklama.simdi": "şu an",
    "aciklama.gercek": "GERÇEK trafikten",

    // aktif olay banner'ı
    "banner.tespit": "AKTİF OLAY — {ad} tespit edildi",
    "banner.eslesen": "Son trafikte {n} eşleşen olay. “{ad}” playbook'unu başlatman önerilir.",
    "banner.ac": "Playbook'u aç",

    // özet kartları
    "ozet.hazir": "Hazır playbook",
    "ozet.tetiklenen": "Şu an tetiklenen",
    "ozet.yurutulen": "Yürütülen runbook",

    // katalog
    "katalog.baslik": "Playbook kataloğu",
    "katalog.runbook": "{n} runbook",
    "katalog.adim": "{n} adım",
    "katalog.sure": "~{n} dk",
    "katalog.tetikleniyor": "tetikleniyor · {n}",

    // boş seçim
    "bos.baslik": "Bir playbook seç",
    "bos.metin":
      "Soldaki kataloğdan bir müdahale runbook'u aç. Aktif tetiklenen playbook'lar üstte listelenir; her birinin ilerlemesi kartındaki halkada görünür.",

    // çalıştırıcı — başlık kartı
    "cal.aktif": "aktif · {n} olay",
    "cal.sifirla": "Sıfırla",
    "cal.metrik.ilerleme": "İlerleme",
    "cal.metrik.ilerleme.tamam": "tamamlandı",
    "cal.metrik.ilerleme.kaldi": "{n} adım kaldı",
    "cal.metrik.otomasyon": "Otomasyon",
    "cal.metrik.otomasyon.alt": "{oto} oto · {manuel} manuel",
    "cal.metrik.sure": "Tahmini süre",
    "cal.metrik.sure.deger": "~{n} dk",
    "cal.metrik.sure.alt": "{n} adım toplam",
    "cal.fazakisi": "Faz akışı",

    // dürüstlük etiketi
    "not.baslik": "Bunlar rehber niteliğinde şablonlardır",
    "not.metin.a": "Bir adımı işaretlemek yalnızca",
    "not.metin.b": "niyeti ve ilerlemeyi",
    "not.metin.c":
      "kaydeder (bu tarayıcıda, oturum-yerel) — üretimde tek başına bir değişiklik yapmaz. Gerçek aksiyonu ilgili panelde uygularsın. Tetik tespiti ise gerçektir: gerçek son trafikten hesaplanır.",

    // faz başlıkları (çalıştırıcı)
    "faz.suanki": "şu anki faz",
    "faz.tamam": "tamam",

    // adım rozetleri
    "adim.otomatik": "Otomatik",
    "adim.manuel": "Manuel",
    "adim.dk": "~{n} dk",
    "adim.ilgiliPanel": "İlgili panel",
    "adim.isaretKaldir": "Tamamlandı işaretini kaldır",
    "adim.isaretle": "Tamamlandı işaretle",

    // tamamlandı bandı
    "bitti.baslik": "Tüm adımlar tamamlandı.",
    "bitti.metin": "Olayı denetim günlüğüne belgelemeyi ve geçici kuralları gözden geçirmeyi unutma.",

    // faz etiketleri (FAZ_ETIKET karşılığı)
    "faz.tespit": "Tespit",
    "faz.sınırlama": "Sınırlama",
    "faz.engelleme": "Engelleme",
    "faz.doğrulama": "Doğrulama",
    "faz.kapanış": "Kapanış",

    // şiddet
    "siddet.kritik": "Kritik",
    "siddet.yuksek": "Yüksek",
    "siddet.orta": "Orta",

    // sorumlu
    "sorumlu.Specter": "Veylify",
    "sorumlu.Operatör": "Operatör",
    "sorumlu.Güvenlik Ekibi": "Güvenlik Ekibi",

    // --- playbook 1: kimlik-doldurma ---
    "pb.kimlik-doldurma.ad": "Kimlik Doldurma Dalgası",
    "pb.kimlik-doldurma.tetikleyici": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.aciklama":
      "Çalınmış kullanıcı-adı/parola listeleriyle giriş uçlarına toplu deneme. Hesap ele geçirmeye (ATO) evrilmeden sınırla ve engelle.",
    "pb.kimlik-doldurma.s1.baslik": "Giriş uçlarındaki başarısız-oran patlamasını doğrula",
    "pb.kimlik-doldurma.s1.aksiyon": "Canlı konsolda /login yolundaki 401/başarısız oranını ve credential_stuffing kararlarını incele.",
    "pb.kimlik-doldurma.s2.baslik": "Kaynak ASN ve ülke yoğunluğunu çıkar",
    "pb.kimlik-doldurma.s2.aksiyon": "Saldırının yoğunlaştığı ASN'leri ve coğrafyaları tespit et; botnet mi tek-kaynak mı ayırt et.",
    "pb.kimlik-doldurma.s3.baslik": "Giriş ucuna agresif rate-limit uygula",
    "pb.kimlik-doldurma.s3.aksiyon": "IP başına dakikalık istek eşiğini düşür; ani artışları geçici olarak yavaşlat.",
    "pb.kimlik-doldurma.s4.baslik": "Şüpheli oturumlara zorunlu challenge",
    "pb.kimlik-doldurma.s4.aksiyon": "Düşük insanlık skorlu giriş isteklerine görünmez/aktif challenge zorla.",
    "pb.kimlik-doldurma.s5.baslik": "Kötü ASN/IP kümesini engelle",
    "pb.kimlik-doldurma.s5.aksiyon": "Tespit edilen saldırgan ASN ve IP aralıklarını engelleme kuralına ekle.",
    "pb.kimlik-doldurma.s6.baslik": "Başarısız-oranın normale döndüğünü teyit et",
    "pb.kimlik-doldurma.s6.aksiyon": "Sınırlama sonrası giriş başarısız-oranını izle; ele geçirilen hesap var mı kontrol et.",
    "pb.kimlik-doldurma.s7.baslik": "Olayı belgele ve geçici kuralları gözden geçir",
    "pb.kimlik-doldurma.s7.aksiyon": "Müdahaleyi denetim günlüğüne işle; geçici rate-limit/engelleri kalıcı mı yapacağına karar ver.",

    // --- playbook 2: ddos-sel ---
    "pb.ddos-sel.ad": "DDoS Sel Saldırısı",
    "pb.ddos-sel.tetikleyici": "DDoS Flood",
    "pb.ddos-sel.aciklama":
      "Kaynağı tüketmeye yönelik yüksek-hacimli istek seli. Servisi ayakta tutmak için hızla sınırla, kötü kaynakları engelle.",
    "pb.ddos-sel.s1.baslik": "İstek hacmi patlamasını ve RPS zirvesini doğrula",
    "pb.ddos-sel.s1.aksiyon": "Canlı konsolda saniyelik istek (RPS) eğrisini ve ddos kararlarının payını incele.",
    "pb.ddos-sel.s2.baslik": "Saldırı yüzeyini ve hedef yolları belirle",
    "pb.ddos-sel.s2.aksiyon": "En çok vurulan yolları ve kaynak ASN dağılımını çıkar; hacimsel mi uygulama-katmanı mı ayırt et.",
    "pb.ddos-sel.s3.baslik": "Global rate-limit ve koruma modunu yükselt",
    "pb.ddos-sel.s3.aksiyon": "Site koruma modunu 'block'a yaklaştır; global istek eşiğini geçici olarak sıkılaştır.",
    "pb.ddos-sel.s4.baslik": "Saldırgan ASN/coğrafyayı toplu engelle",
    "pb.ddos-sel.s4.aksiyon": "Selin geldiği ASN ve yüksek-riskli ülkeleri engelleme kuralıyla kapat.",
    "pb.ddos-sel.s5.baslik": "Edge/CDN önünde ek koruma iste",
    "pb.ddos-sel.s5.aksiyon": "Hacim taşarsa üst-katman (edge) sağlayıcıda challenge/kara-liste devreye al.",
    "pb.ddos-sel.s6.baslik": "Servis sağlığının stabilize olduğunu teyit et",
    "pb.ddos-sel.s6.aksiyon": "Uptime ve gecikme metriklerinin normale döndüğünü, meşru trafiğin geçtiğini doğrula.",
    "pb.ddos-sel.s7.baslik": "Geçici sıkılaştırmaları geri al ve raporla",
    "pb.ddos-sel.s7.aksiyon": "Sel dindikten sonra abartılı eşikleri normale çek; olay sonrası rapor üret.",

    // --- playbook 3: kaziyici-kampanya ---
    "pb.kaziyici-kampanya.ad": "Kazıyıcı Kampanyası",
    "pb.kaziyici-kampanya.tetikleyici": "Scraper Campaign",
    "pb.kaziyici-kampanya.aciklama":
      "İçeriği/fiyatı sistemli kazıyan otomasyon botları. Veri kaçışını sınırla, headless/otomasyon imzalarını engelle.",
    "pb.kaziyici-kampanya.s1.baslik": "Kazıma desenini ve hedef içeriği doğrula",
    "pb.kaziyici-kampanya.s1.aksiyon": "Sıralı/derin gezinme desenlerini, scraper ve automation kararlarını canlı konsolda incele.",
    "pb.kaziyici-kampanya.s2.baslik": "Headless/otomasyon imzalarını çıkar",
    "pb.kaziyici-kampanya.s2.aksiyon": "TLS/UA uyumsuzluğu, webdriver ve headless sinyallerini parmak izi istihbaratından topla.",
    "pb.kaziyici-kampanya.s3.baslik": "Kazıma yollarına oturum-başı kota koy",
    "pb.kaziyici-kampanya.s3.aksiyon": "Yoğun kazınan uçlara sayfalama/kota sınırı ve yavaşlatma uygula.",
    "pb.kaziyici-kampanya.s4.baslik": "Headless & TLS-uyumsuz trafiği engelle",
    "pb.kaziyici-kampanya.s4.aksiyon": "headless=true ve TLS/UA uyumsuz koşullarını yakalayan engelleme kuralı oluştur.",
    "pb.kaziyici-kampanya.s5.baslik": "Kuralı sandbox'ta test et, yan-etki yok",
    "pb.kaziyici-kampanya.s5.aksiyon": "Yeni engelleme kuralını sandbox'ta örnek olaylara karşı çalıştır; meşru bot (Googlebot) etkilenmiyor mu doğrula.",
    "pb.kaziyici-kampanya.s6.baslik": "Kazıma hacminin düştüğünü teyit et",
    "pb.kaziyici-kampanya.s6.aksiyon": "Engelleme sonrası scraper/automation kararlarının azaldığını izle.",
    "pb.kaziyici-kampanya.s7.baslik": "Kuralı kalıcılaştır ve olayı belgele",
    "pb.kaziyici-kampanya.s7.aksiyon": "Etkili kuralı kalıcı yap; müdahaleyi denetim izine işle.",

    // --- playbook 4: ai-egitim-tarama ---
    "pb.ai-egitim-tarama.ad": "AI Eğitim Taraması",
    "pb.ai-egitim-tarama.tetikleyici": "AI-Training Crawl",
    "pb.ai-egitim-tarama.aciklama":
      "Model eğitimi için içeriği toplayan AI ajan tarayıcıları (GPTBot/ClaudeBot vb.). Politika uygula, izinsiz taramayı engelle.",
    "pb.ai-egitim-tarama.s1.baslik": "AI ajan trafiğini ve kategorisini doğrula",
    "pb.ai-egitim-tarama.s1.aksiyon": "ai_agent kararlarını, hangi ajanların (model-eğitimi kategorisi) tarama yaptığını incele.",
    "pb.ai-egitim-tarama.s2.baslik": "robots.txt uyumunu kontrol et",
    "pb.ai-egitim-tarama.s2.aksiyon": "Ajanların robots yönergelerine uyup uymadığını, izinsiz yol taraması olup olmadığını denetle.",
    "pb.ai-egitim-tarama.s3.baslik": "AI ajan politikasını 'doğrula'ya çek",
    "pb.ai-egitim-tarama.s3.aksiyon": "İzinsiz eğitim taraması yapan ajanları 'izin' yerine 'doğrula' politikasına al.",
    "pb.ai-egitim-tarama.s4.baslik": "Model-eğitimi kategorisini engelle",
    "pb.ai-egitim-tarama.s4.aksiyon": "aiCategory=model_egitimi koşulunu yakalayan engelleme kuralı uygula (canlı-getirmeyi bozmadan).",
    "pb.ai-egitim-tarama.s5.baslik": "Meşru AI getirmenin etkilenmediğini teyit et",
    "pb.ai-egitim-tarama.s5.aksiyon": "Canlı-getirme/arama-indeksi ajanlarının hâlâ geçtiğini, yalnızca eğitim taramasının kesildiğini doğrula.",
    "pb.ai-egitim-tarama.s6.baslik": "Politikayı belgele ve paydaşları bilgilendir",
    "pb.ai-egitim-tarama.s6.aksiyon": "AI erişim politikasını güncelle; kararı denetim günlüğüne işle.",

    // --- playbook 5: hesap-ele-gecirme ---
    "pb.hesap-ele-gecirme.ad": "Hesap Ele Geçirme (ATO)",
    "pb.hesap-ele-gecirme.tetikleyici": "Account Takeover",
    "pb.hesap-ele-gecirme.aciklama":
      "Başarılı giriş sonrası ele geçirilen hesaplarda anormal davranış. Oturumları kes, hesapları koru, kök nedeni kapat.",
    "pb.hesap-ele-gecirme.s1.baslik": "Şüpheli başarılı girişleri ve oturum anomalilerini doğrula",
    "pb.hesap-ele-gecirme.s1.aksiyon": "Yeni-cihaz/coğrafya sıçraması olan başarılı girişleri ve oturum güvenlik anomalilerini incele.",
    "pb.hesap-ele-gecirme.s2.baslik": "Etkilenen hesap kümesini çıkar",
    "pb.hesap-ele-gecirme.s2.aksiyon": "Hesap sağlığı panelinde risk skoru yükselen hesapları listele; etki alanını belirle.",
    "pb.hesap-ele-gecirme.s3.baslik": "Şüpheli oturumları geçersiz kıl",
    "pb.hesap-ele-gecirme.s3.aksiyon": "Ele geçirilmiş oturumları zorla sonlandır; hassas işlemler için ek doğrulama iste.",
    "pb.hesap-ele-gecirme.s4.baslik": "Etkilenen hesaplara parola sıfırlama zorla",
    "pb.hesap-ele-gecirme.s4.aksiyon": "Riskli hesaplarda parola sıfırlama ve MFA yeniden-kayıt akışını tetikle.",
    "pb.hesap-ele-gecirme.s5.baslik": "Kaynak IP/ASN'leri engelle",
    "pb.hesap-ele-gecirme.s5.aksiyon": "Ele geçirmenin geldiği IP ve ASN'leri engelleme kuralına ekle.",
    "pb.hesap-ele-gecirme.s6.baslik": "Anormal aktivitenin durduğunu teyit et",
    "pb.hesap-ele-gecirme.s6.aksiyon": "Korunan hesaplarda anormal işlemlerin kesildiğini, yeni ele geçirme olmadığını izle.",
    "pb.hesap-ele-gecirme.s7.baslik": "Olayı raporla ve kalıcı korumaları planla",
    "pb.hesap-ele-gecirme.s7.aksiyon": "Etki, zaman çizelgesi ve alınan aksiyonları belgele; kalıcı ATO korumasını planla.",

    // --- playbook 6: supheli-otomasyon ---
    "pb.supheli-otomasyon.ad": "Şüpheli Otomasyon Artışı",
    "pb.supheli-otomasyon.tetikleyici": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.aciklama":
      "Sınıflandırması netleşmemiş ama insan-dışı otomasyon/spam artışı. Sınıflandır, sınırla, uygun playbook'a yönlendir.",
    "pb.supheli-otomasyon.s1.baslik": "Otomasyon/spam artışını doğrula",
    "pb.supheli-otomasyon.s1.aksiyon": "automation ve spam kararlarındaki ani yükselişi ve zaman desenini canlı konsolda incele.",
    "pb.supheli-otomasyon.s2.baslik": "Saldırıyı sınıflandır (hangi türe yakın?)",
    "pb.supheli-otomasyon.s2.aksiyon": "Hedef yollar ve imzalara bakarak kazıma/kimlik-doldurma/DDoS'e mi kaydığını belirle.",
    "pb.supheli-otomasyon.s3.baslik": "Geçici rate-limit ve gözlem moduna al",
    "pb.supheli-otomasyon.s3.aksiyon": "Şüpheli kaynaklara geçici rate-limit koy; koruma modunu 'monitor'dan 'challenge'a yükselt.",
    "pb.supheli-otomasyon.s4.baslik": "Netleşen kötü kaynakları engelle",
    "pb.supheli-otomasyon.s4.aksiyon": "Doğrulanan zararlı IP/ASN'leri engelle; belirsizleri gözlemde tut.",
    "pb.supheli-otomasyon.s5.baslik": "Artışın düştüğünü ve yanlış-pozitif olmadığını teyit et",
    "pb.supheli-otomasyon.s5.aksiyon": "Şüpheli trafiğin azaldığını, meşru kullanıcıların engellenmediğini doğrula.",
    "pb.supheli-otomasyon.s6.baslik": "Uygun özel playbook'a devret ve belgele",
    "pb.supheli-otomasyon.s6.aksiyon": "Tür netleştiyse ilgili özel playbook'u başlat; müdahaleyi denetim günlüğüne işle.",
  },

  en: {
    "x.baslik": "Incident Response",

    "aciklama.baslik": "Ready-made response runbooks by attack type.",
    "aciklama.metin":
      "A pre-written, phased response plan for each attack type ({fazlar}). Which playbook is needed {simdi} is computed {gercek} ({n} events). During an incident, open the playbook, work through the steps, and track your progress.",
    "aciklama.fazlar": "detection → containment → blocking → verification → closure",
    "aciklama.simdi": "right now",
    "aciklama.gercek": "from REAL traffic",

    "banner.tespit": "ACTIVE INCIDENT — {ad} detected",
    "banner.eslesen": "{n} matching events in recent traffic. Running the “{ad}” playbook is recommended.",
    "banner.ac": "Open playbook",

    "ozet.hazir": "Ready playbooks",
    "ozet.tetiklenen": "Triggering now",
    "ozet.yurutulen": "Runbooks in progress",

    "katalog.baslik": "Playbook catalog",
    "katalog.runbook": "{n} runbooks",
    "katalog.adim": "{n} steps",
    "katalog.sure": "~{n} min",
    "katalog.tetikleniyor": "triggering · {n}",

    "bos.baslik": "Select a playbook",
    "bos.metin":
      "Open a response runbook from the catalog on the left. Actively triggering playbooks are listed at the top; each one's progress appears in the ring on its card.",

    "cal.aktif": "active · {n} events",
    "cal.sifirla": "Reset",
    "cal.metrik.ilerleme": "Progress",
    "cal.metrik.ilerleme.tamam": "completed",
    "cal.metrik.ilerleme.kaldi": "{n} steps left",
    "cal.metrik.otomasyon": "Automation",
    "cal.metrik.otomasyon.alt": "{oto} auto · {manuel} manual",
    "cal.metrik.sure": "Estimated time",
    "cal.metrik.sure.deger": "~{n} min",
    "cal.metrik.sure.alt": "{n} steps total",
    "cal.fazakisi": "Phase flow",

    "not.baslik": "These are guidance templates",
    "not.metin.a": "Checking off a step only records",
    "not.metin.b": "intent and progress",
    "not.metin.c":
      "(in this browser, session-local) — it makes no change in production on its own. You apply the real action in the relevant panel. Trigger detection, however, is real: computed from actual recent traffic.",

    "faz.suanki": "current phase",
    "faz.tamam": "done",

    "adim.otomatik": "Automatic",
    "adim.manuel": "Manual",
    "adim.dk": "~{n} min",
    "adim.ilgiliPanel": "Related panel",
    "adim.isaretKaldir": "Unmark as completed",
    "adim.isaretle": "Mark as completed",

    "bitti.baslik": "All steps completed.",
    "bitti.metin": "Don't forget to document the incident in the audit log and review the temporary rules.",

    "faz.tespit": "Detection",
    "faz.sınırlama": "Containment",
    "faz.engelleme": "Blocking",
    "faz.doğrulama": "Verification",
    "faz.kapanış": "Closure",

    "siddet.kritik": "Critical",
    "siddet.yuksek": "High",
    "siddet.orta": "Medium",

    "sorumlu.Specter": "Veylify",
    "sorumlu.Operatör": "Operator",
    "sorumlu.Güvenlik Ekibi": "Security Team",

    "pb.kimlik-doldurma.ad": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.tetikleyici": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.aciklama":
      "Bulk login attempts using stolen username/password lists. Contain and block it before it escalates into account takeover (ATO).",
    "pb.kimlik-doldurma.s1.baslik": "Confirm the failure-rate spike on login endpoints",
    "pb.kimlik-doldurma.s1.aksiyon": "In the live console, review the 401/failure rate on the /login path and the credential_stuffing decisions.",
    "pb.kimlik-doldurma.s2.baslik": "Extract source ASN and country concentration",
    "pb.kimlik-doldurma.s2.aksiyon": "Identify the ASNs and geographies where the attack is concentrated; distinguish botnet from single-source.",
    "pb.kimlik-doldurma.s3.baslik": "Apply an aggressive rate-limit to the login endpoint",
    "pb.kimlik-doldurma.s3.aksiyon": "Lower the per-minute request threshold per IP; temporarily throttle sudden spikes.",
    "pb.kimlik-doldurma.s4.baslik": "Force a challenge on suspicious sessions",
    "pb.kimlik-doldurma.s4.aksiyon": "Force an invisible/active challenge on login requests with a low humanity score.",
    "pb.kimlik-doldurma.s5.baslik": "Block the malicious ASN/IP set",
    "pb.kimlik-doldurma.s5.aksiyon": "Add the detected attacker ASNs and IP ranges to a blocking rule.",
    "pb.kimlik-doldurma.s6.baslik": "Confirm the failure rate has returned to normal",
    "pb.kimlik-doldurma.s6.aksiyon": "Monitor the login failure rate after containment; check whether any accounts were compromised.",
    "pb.kimlik-doldurma.s7.baslik": "Document the incident and review temporary rules",
    "pb.kimlik-doldurma.s7.aksiyon": "Record the response in the audit log; decide whether to make the temporary rate-limits/blocks permanent.",

    "pb.ddos-sel.ad": "DDoS Flood Attack",
    "pb.ddos-sel.tetikleyici": "DDoS Flood",
    "pb.ddos-sel.aciklama":
      "A high-volume request flood aimed at exhausting resources. Rate-limit fast to keep the service up and block the malicious sources.",
    "pb.ddos-sel.s1.baslik": "Confirm the request-volume spike and RPS peak",
    "pb.ddos-sel.s1.aksiyon": "In the live console, review the requests-per-second (RPS) curve and the share of ddos decisions.",
    "pb.ddos-sel.s2.baslik": "Identify the attack surface and target paths",
    "pb.ddos-sel.s2.aksiyon": "Extract the most-hit paths and the source ASN distribution; distinguish volumetric from application-layer.",
    "pb.ddos-sel.s3.baslik": "Raise the global rate-limit and protection mode",
    "pb.ddos-sel.s3.aksiyon": "Move the site protection mode toward 'block'; temporarily tighten the global request threshold.",
    "pb.ddos-sel.s4.baslik": "Bulk-block the attacking ASN/geography",
    "pb.ddos-sel.s4.aksiyon": "Shut off the ASNs the flood originates from and high-risk countries with a blocking rule.",
    "pb.ddos-sel.s5.baslik": "Request additional protection at the edge/CDN",
    "pb.ddos-sel.s5.aksiyon": "If the volume overflows, enable a challenge/blocklist at the upstream (edge) provider.",
    "pb.ddos-sel.s6.baslik": "Confirm that service health has stabilized",
    "pb.ddos-sel.s6.aksiyon": "Verify that uptime and latency metrics have returned to normal and legitimate traffic is getting through.",
    "pb.ddos-sel.s7.baslik": "Roll back the temporary tightening and report",
    "pb.ddos-sel.s7.aksiyon": "Once the flood subsides, return the exaggerated thresholds to normal; produce a post-incident report.",

    "pb.kaziyici-kampanya.ad": "Scraper Campaign",
    "pb.kaziyici-kampanya.tetikleyici": "Scraper Campaign",
    "pb.kaziyici-kampanya.aciklama":
      "Automation bots systematically scraping content/prices. Limit data exfiltration and block headless/automation signatures.",
    "pb.kaziyici-kampanya.s1.baslik": "Confirm the scraping pattern and target content",
    "pb.kaziyici-kampanya.s1.aksiyon": "Review sequential/deep-crawl patterns and scraper and automation decisions in the live console.",
    "pb.kaziyici-kampanya.s2.baslik": "Extract headless/automation signatures",
    "pb.kaziyici-kampanya.s2.aksiyon": "Collect TLS/UA mismatch, webdriver, and headless signals from fingerprint intelligence.",
    "pb.kaziyici-kampanya.s3.baslik": "Set a per-session quota on scraping paths",
    "pb.kaziyici-kampanya.s3.aksiyon": "Apply pagination/quota limits and throttling to heavily scraped endpoints.",
    "pb.kaziyici-kampanya.s4.baslik": "Block headless & TLS-mismatched traffic",
    "pb.kaziyici-kampanya.s4.aksiyon": "Create a blocking rule that catches headless=true and TLS/UA-mismatch conditions.",
    "pb.kaziyici-kampanya.s5.baslik": "Test the rule in the sandbox — no side effects",
    "pb.kaziyici-kampanya.s5.aksiyon": "Run the new blocking rule against sample events in the sandbox; verify legitimate bots (Googlebot) are not affected.",
    "pb.kaziyici-kampanya.s6.baslik": "Confirm the scraping volume has dropped",
    "pb.kaziyici-kampanya.s6.aksiyon": "Monitor that scraper/automation decisions have decreased after blocking.",
    "pb.kaziyici-kampanya.s7.baslik": "Make the rule permanent and document the incident",
    "pb.kaziyici-kampanya.s7.aksiyon": "Make the effective rule permanent; record the response in the audit trail.",

    "pb.ai-egitim-tarama.ad": "AI Training Crawl",
    "pb.ai-egitim-tarama.tetikleyici": "AI-Training Crawl",
    "pb.ai-egitim-tarama.aciklama":
      "AI agent crawlers (GPTBot/ClaudeBot etc.) collecting content for model training. Apply policy and block unauthorized crawling.",
    "pb.ai-egitim-tarama.s1.baslik": "Confirm AI agent traffic and its category",
    "pb.ai-egitim-tarama.s1.aksiyon": "Review ai_agent decisions and which agents (model-training category) are crawling.",
    "pb.ai-egitim-tarama.s2.baslik": "Check robots.txt compliance",
    "pb.ai-egitim-tarama.s2.aksiyon": "Audit whether the agents obey robots directives and whether there is unauthorized path crawling.",
    "pb.ai-egitim-tarama.s3.baslik": "Set the AI agent policy to 'verify'",
    "pb.ai-egitim-tarama.s3.aksiyon": "Move agents doing unauthorized training crawls from 'allow' to a 'verify' policy.",
    "pb.ai-egitim-tarama.s4.baslik": "Block the model-training category",
    "pb.ai-egitim-tarama.s4.aksiyon": "Apply a blocking rule catching the aiCategory=model_training condition (without breaking live-fetch).",
    "pb.ai-egitim-tarama.s5.baslik": "Confirm legitimate AI fetching is unaffected",
    "pb.ai-egitim-tarama.s5.aksiyon": "Verify that live-fetch/search-index agents still get through and only the training crawl was cut off.",
    "pb.ai-egitim-tarama.s6.baslik": "Document the policy and inform stakeholders",
    "pb.ai-egitim-tarama.s6.aksiyon": "Update the AI access policy; record the decision in the audit log.",

    "pb.hesap-ele-gecirme.ad": "Account Takeover (ATO)",
    "pb.hesap-ele-gecirme.tetikleyici": "Account Takeover",
    "pb.hesap-ele-gecirme.aciklama":
      "Abnormal behavior on accounts taken over after a successful login. Cut sessions, protect accounts, and close the root cause.",
    "pb.hesap-ele-gecirme.s1.baslik": "Confirm suspicious successful logins and session anomalies",
    "pb.hesap-ele-gecirme.s1.aksiyon": "Review successful logins with a new-device/geography jump and session security anomalies.",
    "pb.hesap-ele-gecirme.s2.baslik": "Extract the affected account set",
    "pb.hesap-ele-gecirme.s2.aksiyon": "List accounts with a rising risk score in the account health panel; determine the impact scope.",
    "pb.hesap-ele-gecirme.s3.baslik": "Invalidate suspicious sessions",
    "pb.hesap-ele-gecirme.s3.aksiyon": "Force-terminate compromised sessions; require additional verification for sensitive operations.",
    "pb.hesap-ele-gecirme.s4.baslik": "Force a password reset on affected accounts",
    "pb.hesap-ele-gecirme.s4.aksiyon": "Trigger the password-reset and MFA re-enrollment flow on at-risk accounts.",
    "pb.hesap-ele-gecirme.s5.baslik": "Block the source IPs/ASNs",
    "pb.hesap-ele-gecirme.s5.aksiyon": "Add the IPs and ASNs the takeover originated from to a blocking rule.",
    "pb.hesap-ele-gecirme.s6.baslik": "Confirm the abnormal activity has stopped",
    "pb.hesap-ele-gecirme.s6.aksiyon": "Monitor that abnormal operations on protected accounts have ceased and no new takeover is occurring.",
    "pb.hesap-ele-gecirme.s7.baslik": "Report the incident and plan permanent protections",
    "pb.hesap-ele-gecirme.s7.aksiyon": "Document the impact, timeline, and actions taken; plan permanent ATO protection.",

    "pb.supheli-otomasyon.ad": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.tetikleyici": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.aciklama":
      "A non-human automation/spam surge that isn't yet clearly classified. Classify, contain, and route to the right playbook.",
    "pb.supheli-otomasyon.s1.baslik": "Confirm the automation/spam surge",
    "pb.supheli-otomasyon.s1.aksiyon": "Review the sudden rise in automation and spam decisions and the time pattern in the live console.",
    "pb.supheli-otomasyon.s2.baslik": "Classify the attack (which type is it closest to?)",
    "pb.supheli-otomasyon.s2.aksiyon": "Looking at target paths and signatures, determine whether it's drifting toward scraping/credential-stuffing/DDoS.",
    "pb.supheli-otomasyon.s3.baslik": "Apply a temporary rate-limit and move to observation mode",
    "pb.supheli-otomasyon.s3.aksiyon": "Put a temporary rate-limit on suspicious sources; raise the protection mode from 'monitor' to 'challenge'.",
    "pb.supheli-otomasyon.s4.baslik": "Block the sources that become clearly malicious",
    "pb.supheli-otomasyon.s4.aksiyon": "Block confirmed malicious IPs/ASNs; keep the uncertain ones under observation.",
    "pb.supheli-otomasyon.s5.baslik": "Confirm the surge has dropped and there are no false positives",
    "pb.supheli-otomasyon.s5.aksiyon": "Verify that the suspicious traffic has decreased and legitimate users are not being blocked.",
    "pb.supheli-otomasyon.s6.baslik": "Hand off to the appropriate dedicated playbook and document",
    "pb.supheli-otomasyon.s6.aksiyon": "If the type is now clear, start the relevant dedicated playbook; record the response in the audit log.",
  },

  de: {
    "x.baslik": "Vorfallreaktion",

    "aciklama.baslik": "Fertige Reaktions-Runbooks nach Angriffstyp.",
    "aciklama.metin":
      "Ein vorgefertigter, in Phasen gegliederter Reaktionsplan für jeden Angriffstyp ({fazlar}). Welches Playbook {simdi} nötig ist, wird {gercek} berechnet ({n} Ereignisse). Öffnen Sie das Playbook während eines Vorfalls, arbeiten Sie die Schritte ab und verfolgen Sie Ihren Fortschritt.",
    "aciklama.fazlar": "Erkennung → Eindämmung → Blockierung → Verifizierung → Abschluss",
    "aciklama.simdi": "gerade jetzt",
    "aciklama.gercek": "aus ECHTEM Traffic",

    "banner.tespit": "AKTIVER VORFALL — {ad} erkannt",
    "banner.eslesen": "{n} übereinstimmende Ereignisse im jüngsten Traffic. Es wird empfohlen, das Playbook „{ad}“ zu starten.",
    "banner.ac": "Playbook öffnen",

    "ozet.hazir": "Bereite Playbooks",
    "ozet.tetiklenen": "Wird gerade ausgelöst",
    "ozet.yurutulen": "Laufende Runbooks",

    "katalog.baslik": "Playbook-Katalog",
    "katalog.runbook": "{n} Runbooks",
    "katalog.adim": "{n} Schritte",
    "katalog.sure": "~{n} Min.",
    "katalog.tetikleniyor": "wird ausgelöst · {n}",

    "bos.baslik": "Ein Playbook auswählen",
    "bos.metin":
      "Öffnen Sie ein Reaktions-Runbook aus dem Katalog links. Aktiv ausgelöste Playbooks werden oben aufgeführt; der Fortschritt jedes einzelnen erscheint im Ring auf seiner Karte.",

    "cal.aktif": "aktiv · {n} Ereignisse",
    "cal.sifirla": "Zurücksetzen",
    "cal.metrik.ilerleme": "Fortschritt",
    "cal.metrik.ilerleme.tamam": "abgeschlossen",
    "cal.metrik.ilerleme.kaldi": "{n} Schritte übrig",
    "cal.metrik.otomasyon": "Automatisierung",
    "cal.metrik.otomasyon.alt": "{oto} auto · {manuel} manuell",
    "cal.metrik.sure": "Geschätzte Zeit",
    "cal.metrik.sure.deger": "~{n} Min.",
    "cal.metrik.sure.alt": "{n} Schritte gesamt",
    "cal.fazakisi": "Phasenablauf",

    "not.baslik": "Dies sind Vorlagen zur Orientierung",
    "not.metin.a": "Das Abhaken eines Schritts erfasst nur",
    "not.metin.b": "Absicht und Fortschritt",
    "not.metin.c":
      "(in diesem Browser, sitzungslokal) — es bewirkt allein keine Änderung in der Produktion. Die eigentliche Aktion führen Sie im jeweiligen Panel aus. Die Auslöse-Erkennung ist jedoch echt: berechnet aus tatsächlichem jüngstem Traffic.",

    "faz.suanki": "aktuelle Phase",
    "faz.tamam": "fertig",

    "adim.otomatik": "Automatisch",
    "adim.manuel": "Manuell",
    "adim.dk": "~{n} Min.",
    "adim.ilgiliPanel": "Zugehöriges Panel",
    "adim.isaretKaldir": "Als abgeschlossen abwählen",
    "adim.isaretle": "Als abgeschlossen markieren",

    "bitti.baslik": "Alle Schritte abgeschlossen.",
    "bitti.metin": "Vergessen Sie nicht, den Vorfall im Audit-Log zu dokumentieren und die temporären Regeln zu überprüfen.",

    "faz.tespit": "Erkennung",
    "faz.sınırlama": "Eindämmung",
    "faz.engelleme": "Blockierung",
    "faz.doğrulama": "Verifizierung",
    "faz.kapanış": "Abschluss",

    "siddet.kritik": "Kritisch",
    "siddet.yuksek": "Hoch",
    "siddet.orta": "Mittel",

    "sorumlu.Specter": "Veylify",
    "sorumlu.Operatör": "Operator",
    "sorumlu.Güvenlik Ekibi": "Sicherheitsteam",

    "pb.kimlik-doldurma.ad": "Credential-Stuffing-Welle",
    "pb.kimlik-doldurma.tetikleyici": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.aciklama":
      "Massenhafte Anmeldeversuche mit gestohlenen Benutzername/Passwort-Listen. Eindämmen und blockieren, bevor es zur Kontoübernahme (ATO) eskaliert.",
    "pb.kimlik-doldurma.s1.baslik": "Anstieg der Fehlerrate an den Login-Endpunkten bestätigen",
    "pb.kimlik-doldurma.s1.aksiyon": "Prüfen Sie in der Live-Konsole die 401-/Fehlerrate auf dem /login-Pfad und die credential_stuffing-Entscheidungen.",
    "pb.kimlik-doldurma.s2.baslik": "Quell-ASN und Länderkonzentration extrahieren",
    "pb.kimlik-doldurma.s2.aksiyon": "Ermitteln Sie die ASNs und Regionen, in denen sich der Angriff konzentriert; unterscheiden Sie Botnet von Einzelquelle.",
    "pb.kimlik-doldurma.s3.baslik": "Aggressives Rate-Limit auf den Login-Endpunkt anwenden",
    "pb.kimlik-doldurma.s3.aksiyon": "Senken Sie den Anfrage-Schwellenwert pro Minute je IP; drosseln Sie plötzliche Anstiege vorübergehend.",
    "pb.kimlik-doldurma.s4.baslik": "Verdächtige Sitzungen zwingend einer Challenge unterziehen",
    "pb.kimlik-doldurma.s4.aksiyon": "Erzwingen Sie eine unsichtbare/aktive Challenge bei Login-Anfragen mit niedrigem Menschlichkeits-Score.",
    "pb.kimlik-doldurma.s5.baslik": "Bösartiges ASN-/IP-Set blockieren",
    "pb.kimlik-doldurma.s5.aksiyon": "Fügen Sie die erkannten Angreifer-ASNs und IP-Bereiche einer Blockierregel hinzu.",
    "pb.kimlik-doldurma.s6.baslik": "Bestätigen, dass die Fehlerrate wieder normal ist",
    "pb.kimlik-doldurma.s6.aksiyon": "Überwachen Sie die Login-Fehlerrate nach der Eindämmung; prüfen Sie, ob Konten kompromittiert wurden.",
    "pb.kimlik-doldurma.s7.baslik": "Vorfall dokumentieren und temporäre Regeln überprüfen",
    "pb.kimlik-doldurma.s7.aksiyon": "Erfassen Sie die Reaktion im Audit-Log; entscheiden Sie, ob die temporären Rate-Limits/Blockierungen dauerhaft werden.",

    "pb.ddos-sel.ad": "DDoS-Flut-Angriff",
    "pb.ddos-sel.tetikleyici": "DDoS Flood",
    "pb.ddos-sel.aciklama":
      "Eine hochvolumige Anfrageflut zur Ressourcenerschöpfung. Schnell drosseln, um den Dienst am Laufen zu halten, und die bösartigen Quellen blockieren.",
    "pb.ddos-sel.s1.baslik": "Anstieg des Anfragevolumens und RPS-Spitze bestätigen",
    "pb.ddos-sel.s1.aksiyon": "Prüfen Sie in der Live-Konsole die Kurve der Anfragen pro Sekunde (RPS) und den Anteil der ddos-Entscheidungen.",
    "pb.ddos-sel.s2.baslik": "Angriffsfläche und Zielpfade bestimmen",
    "pb.ddos-sel.s2.aksiyon": "Extrahieren Sie die meistgetroffenen Pfade und die Quell-ASN-Verteilung; unterscheiden Sie volumetrisch von Anwendungsebene.",
    "pb.ddos-sel.s3.baslik": "Globales Rate-Limit und Schutzmodus erhöhen",
    "pb.ddos-sel.s3.aksiyon": "Nähern Sie den Site-Schutzmodus an 'block' an; verschärfen Sie den globalen Anfrage-Schwellenwert vorübergehend.",
    "pb.ddos-sel.s4.baslik": "Angreifer-ASN/-Region massenhaft blockieren",
    "pb.ddos-sel.s4.aksiyon": "Sperren Sie mit einer Blockierregel die ASNs, aus denen die Flut stammt, und Hochrisikoländer.",
    "pb.ddos-sel.s5.baslik": "Zusätzlichen Schutz am Edge/CDN anfordern",
    "pb.ddos-sel.s5.aksiyon": "Wenn das Volumen überläuft, aktivieren Sie eine Challenge/Sperrliste beim vorgelagerten (Edge-)Anbieter.",
    "pb.ddos-sel.s6.baslik": "Bestätigen, dass sich die Dienstintegrität stabilisiert hat",
    "pb.ddos-sel.s6.aksiyon": "Überprüfen Sie, dass Uptime- und Latenzmetriken wieder normal sind und legitimer Traffic durchkommt.",
    "pb.ddos-sel.s7.baslik": "Temporäre Verschärfungen zurücknehmen und berichten",
    "pb.ddos-sel.s7.aksiyon": "Setzen Sie nach Abklingen der Flut die überzogenen Schwellenwerte zurück; erstellen Sie einen Post-Incident-Bericht.",

    "pb.kaziyici-kampanya.ad": "Scraper-Kampagne",
    "pb.kaziyici-kampanya.tetikleyici": "Scraper Campaign",
    "pb.kaziyici-kampanya.aciklama":
      "Automatisierungs-Bots, die systematisch Inhalte/Preise scrapen. Datenabfluss begrenzen und Headless-/Automatisierungssignaturen blockieren.",
    "pb.kaziyici-kampanya.s1.baslik": "Scraping-Muster und Zielinhalt bestätigen",
    "pb.kaziyici-kampanya.s1.aksiyon": "Prüfen Sie in der Live-Konsole sequenzielle/tiefe Crawl-Muster sowie scraper- und automation-Entscheidungen.",
    "pb.kaziyici-kampanya.s2.baslik": "Headless-/Automatisierungssignaturen extrahieren",
    "pb.kaziyici-kampanya.s2.aksiyon": "Sammeln Sie TLS/UA-Diskrepanz, Webdriver- und Headless-Signale aus der Fingerprint-Intelligenz.",
    "pb.kaziyici-kampanya.s3.baslik": "Pro-Sitzung-Kontingent auf Scraping-Pfade setzen",
    "pb.kaziyici-kampanya.s3.aksiyon": "Wenden Sie Paginierungs-/Kontingentgrenzen und Drosselung auf stark gescrapte Endpunkte an.",
    "pb.kaziyici-kampanya.s4.baslik": "Headless- & TLS-inkonsistenten Traffic blockieren",
    "pb.kaziyici-kampanya.s4.aksiyon": "Erstellen Sie eine Blockierregel, die headless=true und TLS/UA-Diskrepanz-Bedingungen erfasst.",
    "pb.kaziyici-kampanya.s5.baslik": "Regel in der Sandbox testen — keine Nebenwirkungen",
    "pb.kaziyici-kampanya.s5.aksiyon": "Führen Sie die neue Blockierregel in der Sandbox gegen Beispielereignisse aus; prüfen Sie, dass legitime Bots (Googlebot) nicht betroffen sind.",
    "pb.kaziyici-kampanya.s6.baslik": "Bestätigen, dass das Scraping-Volumen gesunken ist",
    "pb.kaziyici-kampanya.s6.aksiyon": "Überwachen Sie, dass scraper-/automation-Entscheidungen nach der Blockierung abgenommen haben.",
    "pb.kaziyici-kampanya.s7.baslik": "Regel dauerhaft machen und Vorfall dokumentieren",
    "pb.kaziyici-kampanya.s7.aksiyon": "Machen Sie die wirksame Regel dauerhaft; erfassen Sie die Reaktion im Audit-Trail.",

    "pb.ai-egitim-tarama.ad": "KI-Trainings-Crawl",
    "pb.ai-egitim-tarama.tetikleyici": "AI-Training Crawl",
    "pb.ai-egitim-tarama.aciklama":
      "KI-Agent-Crawler (GPTBot/ClaudeBot usw.), die Inhalte fürs Modelltraining sammeln. Richtlinie anwenden und unautorisiertes Crawling blockieren.",
    "pb.ai-egitim-tarama.s1.baslik": "KI-Agent-Traffic und dessen Kategorie bestätigen",
    "pb.ai-egitim-tarama.s1.aksiyon": "Prüfen Sie ai_agent-Entscheidungen und welche Agenten (Kategorie Modelltraining) crawlen.",
    "pb.ai-egitim-tarama.s2.baslik": "robots.txt-Konformität prüfen",
    "pb.ai-egitim-tarama.s2.aksiyon": "Prüfen Sie, ob die Agenten die robots-Direktiven befolgen und ob unautorisiertes Pfad-Crawling stattfindet.",
    "pb.ai-egitim-tarama.s3.baslik": "KI-Agent-Richtlinie auf 'verifizieren' setzen",
    "pb.ai-egitim-tarama.s3.aksiyon": "Verschieben Sie Agenten mit unautorisiertem Trainings-Crawl von 'erlauben' auf eine 'verifizieren'-Richtlinie.",
    "pb.ai-egitim-tarama.s4.baslik": "Kategorie Modelltraining blockieren",
    "pb.ai-egitim-tarama.s4.aksiyon": "Wenden Sie eine Blockierregel an, die die Bedingung aiCategory=model_training erfasst (ohne Live-Fetch zu stören).",
    "pb.ai-egitim-tarama.s5.baslik": "Bestätigen, dass legitimes KI-Abrufen unbeeinträchtigt ist",
    "pb.ai-egitim-tarama.s5.aksiyon": "Prüfen Sie, dass Live-Fetch-/Suchindex-Agenten weiterhin durchkommen und nur der Trainings-Crawl unterbrochen wurde.",
    "pb.ai-egitim-tarama.s6.baslik": "Richtlinie dokumentieren und Stakeholder informieren",
    "pb.ai-egitim-tarama.s6.aksiyon": "Aktualisieren Sie die KI-Zugriffsrichtlinie; erfassen Sie die Entscheidung im Audit-Log.",

    "pb.hesap-ele-gecirme.ad": "Kontoübernahme (ATO)",
    "pb.hesap-ele-gecirme.tetikleyici": "Account Takeover",
    "pb.hesap-ele-gecirme.aciklama":
      "Auffälliges Verhalten bei nach erfolgreichem Login übernommenen Konten. Sitzungen kappen, Konten schützen und die Grundursache schließen.",
    "pb.hesap-ele-gecirme.s1.baslik": "Verdächtige erfolgreiche Logins und Sitzungsanomalien bestätigen",
    "pb.hesap-ele-gecirme.s1.aksiyon": "Prüfen Sie erfolgreiche Logins mit Neugerät-/Geografiesprung und Sitzungssicherheits-Anomalien.",
    "pb.hesap-ele-gecirme.s2.baslik": "Betroffene Kontenmenge extrahieren",
    "pb.hesap-ele-gecirme.s2.aksiyon": "Listen Sie im Kontogesundheits-Panel Konten mit steigendem Risiko-Score auf; bestimmen Sie den Wirkungsbereich.",
    "pb.hesap-ele-gecirme.s3.baslik": "Verdächtige Sitzungen ungültig machen",
    "pb.hesap-ele-gecirme.s3.aksiyon": "Beenden Sie kompromittierte Sitzungen zwangsweise; verlangen Sie zusätzliche Verifizierung für sensible Vorgänge.",
    "pb.hesap-ele-gecirme.s4.baslik": "Passwort-Reset für betroffene Konten erzwingen",
    "pb.hesap-ele-gecirme.s4.aksiyon": "Lösen Sie den Passwort-Reset- und MFA-Neuregistrierungs-Ablauf bei gefährdeten Konten aus.",
    "pb.hesap-ele-gecirme.s5.baslik": "Quell-IPs/-ASNs blockieren",
    "pb.hesap-ele-gecirme.s5.aksiyon": "Fügen Sie die IPs und ASNs, aus denen die Übernahme stammt, einer Blockierregel hinzu.",
    "pb.hesap-ele-gecirme.s6.baslik": "Bestätigen, dass die auffällige Aktivität gestoppt ist",
    "pb.hesap-ele-gecirme.s6.aksiyon": "Überwachen Sie, dass auffällige Vorgänge bei geschützten Konten eingestellt sind und keine neue Übernahme auftritt.",
    "pb.hesap-ele-gecirme.s7.baslik": "Vorfall melden und dauerhafte Schutzmaßnahmen planen",
    "pb.hesap-ele-gecirme.s7.aksiyon": "Dokumentieren Sie Auswirkung, Zeitleiste und getroffene Maßnahmen; planen Sie dauerhaften ATO-Schutz.",

    "pb.supheli-otomasyon.ad": "Verdächtiger Automatisierungsanstieg",
    "pb.supheli-otomasyon.tetikleyici": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.aciklama":
      "Ein nicht-menschlicher Automatisierungs-/Spam-Anstieg, der noch nicht klar klassifiziert ist. Klassifizieren, eindämmen und an das passende Playbook weiterleiten.",
    "pb.supheli-otomasyon.s1.baslik": "Automatisierungs-/Spam-Anstieg bestätigen",
    "pb.supheli-otomasyon.s1.aksiyon": "Prüfen Sie in der Live-Konsole den plötzlichen Anstieg bei automation- und spam-Entscheidungen und das Zeitmuster.",
    "pb.supheli-otomasyon.s2.baslik": "Angriff klassifizieren (welchem Typ am nächsten?)",
    "pb.supheli-otomasyon.s2.aksiyon": "Bestimmen Sie anhand von Zielpfaden und Signaturen, ob er zu Scraping/Credential-Stuffing/DDoS abdriftet.",
    "pb.supheli-otomasyon.s3.baslik": "Temporäres Rate-Limit anwenden und in den Beobachtungsmodus versetzen",
    "pb.supheli-otomasyon.s3.aksiyon": "Setzen Sie ein temporäres Rate-Limit auf verdächtige Quellen; erhöhen Sie den Schutzmodus von 'monitor' auf 'challenge'.",
    "pb.supheli-otomasyon.s4.baslik": "Klar bösartig werdende Quellen blockieren",
    "pb.supheli-otomasyon.s4.aksiyon": "Blockieren Sie bestätigte bösartige IPs/ASNs; halten Sie die unklaren unter Beobachtung.",
    "pb.supheli-otomasyon.s5.baslik": "Bestätigen, dass der Anstieg gesunken ist und keine Fehlalarme vorliegen",
    "pb.supheli-otomasyon.s5.aksiyon": "Überprüfen Sie, dass der verdächtige Traffic abgenommen hat und legitime Nutzer nicht blockiert werden.",
    "pb.supheli-otomasyon.s6.baslik": "An das passende dedizierte Playbook übergeben und dokumentieren",
    "pb.supheli-otomasyon.s6.aksiyon": "Wenn der Typ nun klar ist, starten Sie das entsprechende dedizierte Playbook; erfassen Sie die Reaktion im Audit-Log.",
  },

  fr: {
    "x.baslik": "Réponse aux incidents",

    "aciklama.baslik": "Runbooks de réponse prêts à l'emploi par type d'attaque.",
    "aciklama.metin":
      "Un plan de réponse pré-rédigé et découpé en phases pour chaque type d'attaque ({fazlar}). Le playbook requis {simdi} est calculé {gercek} ({n} événements). Pendant un incident, ouvrez le playbook, déroulez les étapes et suivez votre progression.",
    "aciklama.fazlar": "détection → confinement → blocage → vérification → clôture",
    "aciklama.simdi": "en ce moment",
    "aciklama.gercek": "à partir du trafic RÉEL",

    "banner.tespit": "INCIDENT ACTIF — {ad} détecté",
    "banner.eslesen": "{n} événements correspondants dans le trafic récent. Il est recommandé de lancer le playbook « {ad} ».",
    "banner.ac": "Ouvrir le playbook",

    "ozet.hazir": "Playbooks prêts",
    "ozet.tetiklenen": "Déclenchés maintenant",
    "ozet.yurutulen": "Runbooks en cours",

    "katalog.baslik": "Catalogue de playbooks",
    "katalog.runbook": "{n} runbooks",
    "katalog.adim": "{n} étapes",
    "katalog.sure": "~{n} min",
    "katalog.tetikleniyor": "déclenché · {n}",

    "bos.baslik": "Sélectionnez un playbook",
    "bos.metin":
      "Ouvrez un runbook de réponse depuis le catalogue à gauche. Les playbooks activement déclenchés sont listés en haut ; la progression de chacun apparaît dans l'anneau de sa carte.",

    "cal.aktif": "actif · {n} événements",
    "cal.sifirla": "Réinitialiser",
    "cal.metrik.ilerleme": "Progression",
    "cal.metrik.ilerleme.tamam": "terminé",
    "cal.metrik.ilerleme.kaldi": "{n} étapes restantes",
    "cal.metrik.otomasyon": "Automatisation",
    "cal.metrik.otomasyon.alt": "{oto} auto · {manuel} manuel",
    "cal.metrik.sure": "Temps estimé",
    "cal.metrik.sure.deger": "~{n} min",
    "cal.metrik.sure.alt": "{n} étapes au total",
    "cal.fazakisi": "Flux des phases",

    "not.baslik": "Ce sont des modèles à titre indicatif",
    "not.metin.a": "Cocher une étape enregistre seulement",
    "not.metin.b": "l'intention et la progression",
    "not.metin.c":
      "(dans ce navigateur, local à la session) — cela ne modifie rien en production à soi seul. Vous appliquez l'action réelle dans le panneau concerné. La détection de déclenchement, en revanche, est réelle : calculée à partir du trafic récent réel.",

    "faz.suanki": "phase actuelle",
    "faz.tamam": "terminé",

    "adim.otomatik": "Automatique",
    "adim.manuel": "Manuel",
    "adim.dk": "~{n} min",
    "adim.ilgiliPanel": "Panneau associé",
    "adim.isaretKaldir": "Décocher comme terminé",
    "adim.isaretle": "Marquer comme terminé",

    "bitti.baslik": "Toutes les étapes sont terminées.",
    "bitti.metin": "N'oubliez pas de documenter l'incident dans le journal d'audit et de revoir les règles temporaires.",

    "faz.tespit": "Détection",
    "faz.sınırlama": "Confinement",
    "faz.engelleme": "Blocage",
    "faz.doğrulama": "Vérification",
    "faz.kapanış": "Clôture",

    "siddet.kritik": "Critique",
    "siddet.yuksek": "Élevé",
    "siddet.orta": "Moyen",

    "sorumlu.Specter": "Veylify",
    "sorumlu.Operatör": "Opérateur",
    "sorumlu.Güvenlik Ekibi": "Équipe de sécurité",

    "pb.kimlik-doldurma.ad": "Vague de credential stuffing",
    "pb.kimlik-doldurma.tetikleyici": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.aciklama":
      "Tentatives de connexion en masse avec des listes d'identifiants/mots de passe volés. Confinez et bloquez avant que cela ne dégénère en prise de contrôle de compte (ATO).",
    "pb.kimlik-doldurma.s1.baslik": "Confirmer le pic du taux d'échec sur les points d'entrée de connexion",
    "pb.kimlik-doldurma.s1.aksiyon": "Dans la console en direct, examinez le taux d'échec/401 sur le chemin /login et les décisions credential_stuffing.",
    "pb.kimlik-doldurma.s2.baslik": "Extraire la concentration par ASN source et pays",
    "pb.kimlik-doldurma.s2.aksiyon": "Identifiez les ASN et zones géographiques où l'attaque se concentre ; distinguez botnet et source unique.",
    "pb.kimlik-doldurma.s3.baslik": "Appliquer une limitation de débit agressive au point d'entrée de connexion",
    "pb.kimlik-doldurma.s3.aksiyon": "Abaissez le seuil de requêtes par minute et par IP ; ralentissez temporairement les pics soudains.",
    "pb.kimlik-doldurma.s4.baslik": "Imposer un challenge aux sessions suspectes",
    "pb.kimlik-doldurma.s4.aksiyon": "Imposez un challenge invisible/actif aux requêtes de connexion à faible score d'humanité.",
    "pb.kimlik-doldurma.s5.baslik": "Bloquer l'ensemble d'ASN/IP malveillants",
    "pb.kimlik-doldurma.s5.aksiyon": "Ajoutez les ASN attaquants et plages d'IP détectés à une règle de blocage.",
    "pb.kimlik-doldurma.s6.baslik": "Confirmer le retour du taux d'échec à la normale",
    "pb.kimlik-doldurma.s6.aksiyon": "Surveillez le taux d'échec de connexion après le confinement ; vérifiez si des comptes ont été compromis.",
    "pb.kimlik-doldurma.s7.baslik": "Documenter l'incident et revoir les règles temporaires",
    "pb.kimlik-doldurma.s7.aksiyon": "Consignez la réponse dans le journal d'audit ; décidez de rendre permanents ou non les limites de débit/blocages temporaires.",

    "pb.ddos-sel.ad": "Attaque par inondation DDoS",
    "pb.ddos-sel.tetikleyici": "DDoS Flood",
    "pb.ddos-sel.aciklama":
      "Une inondation de requêtes à haut volume visant à épuiser les ressources. Limitez le débit rapidement pour maintenir le service et bloquez les sources malveillantes.",
    "pb.ddos-sel.s1.baslik": "Confirmer le pic du volume de requêtes et le sommet RPS",
    "pb.ddos-sel.s1.aksiyon": "Dans la console en direct, examinez la courbe des requêtes par seconde (RPS) et la part des décisions ddos.",
    "pb.ddos-sel.s2.baslik": "Déterminer la surface d'attaque et les chemins ciblés",
    "pb.ddos-sel.s2.aksiyon": "Extrayez les chemins les plus touchés et la répartition des ASN sources ; distinguez volumétrique et couche applicative.",
    "pb.ddos-sel.s3.baslik": "Relever la limitation de débit globale et le mode de protection",
    "pb.ddos-sel.s3.aksiyon": "Rapprochez le mode de protection du site de 'block' ; resserrez temporairement le seuil de requêtes global.",
    "pb.ddos-sel.s4.baslik": "Bloquer en masse l'ASN/la zone géographique attaquante",
    "pb.ddos-sel.s4.aksiyon": "Fermez avec une règle de blocage les ASN d'où provient l'inondation et les pays à haut risque.",
    "pb.ddos-sel.s5.baslik": "Demander une protection supplémentaire au niveau edge/CDN",
    "pb.ddos-sel.s5.aksiyon": "Si le volume déborde, activez un challenge/une liste de blocage chez le fournisseur en amont (edge).",
    "pb.ddos-sel.s6.baslik": "Confirmer que la santé du service s'est stabilisée",
    "pb.ddos-sel.s6.aksiyon": "Vérifiez que les métriques de disponibilité et de latence sont revenues à la normale et que le trafic légitime passe.",
    "pb.ddos-sel.s7.baslik": "Annuler les durcissements temporaires et rendre compte",
    "pb.ddos-sel.s7.aksiyon": "Une fois l'inondation apaisée, ramenez les seuils excessifs à la normale ; produisez un rapport post-incident.",

    "pb.kaziyici-kampanya.ad": "Campagne de scraping",
    "pb.kaziyici-kampanya.tetikleyici": "Scraper Campaign",
    "pb.kaziyici-kampanya.aciklama":
      "Bots d'automatisation qui scrapent systématiquement le contenu/les prix. Limitez l'exfiltration de données et bloquez les signatures headless/automatisation.",
    "pb.kaziyici-kampanya.s1.baslik": "Confirmer le schéma de scraping et le contenu ciblé",
    "pb.kaziyici-kampanya.s1.aksiyon": "Examinez dans la console en direct les schémas de navigation séquentielle/profonde et les décisions scraper et automation.",
    "pb.kaziyici-kampanya.s2.baslik": "Extraire les signatures headless/automatisation",
    "pb.kaziyici-kampanya.s2.aksiyon": "Recueillez les signaux de discordance TLS/UA, webdriver et headless depuis le renseignement d'empreintes.",
    "pb.kaziyici-kampanya.s3.baslik": "Poser un quota par session sur les chemins de scraping",
    "pb.kaziyici-kampanya.s3.aksiyon": "Appliquez des limites de pagination/quota et un ralentissement aux points d'entrée fortement scrapés.",
    "pb.kaziyici-kampanya.s4.baslik": "Bloquer le trafic headless et à discordance TLS",
    "pb.kaziyici-kampanya.s4.aksiyon": "Créez une règle de blocage qui capture les conditions headless=true et de discordance TLS/UA.",
    "pb.kaziyici-kampanya.s5.baslik": "Tester la règle dans le bac à sable — sans effets secondaires",
    "pb.kaziyici-kampanya.s5.aksiyon": "Exécutez la nouvelle règle de blocage contre des événements d'exemple dans le bac à sable ; vérifiez que les bots légitimes (Googlebot) ne sont pas affectés.",
    "pb.kaziyici-kampanya.s6.baslik": "Confirmer que le volume de scraping a chuté",
    "pb.kaziyici-kampanya.s6.aksiyon": "Surveillez la diminution des décisions scraper/automation après le blocage.",
    "pb.kaziyici-kampanya.s7.baslik": "Rendre la règle permanente et documenter l'incident",
    "pb.kaziyici-kampanya.s7.aksiyon": "Rendez permanente la règle efficace ; consignez la réponse dans la piste d'audit.",

    "pb.ai-egitim-tarama.ad": "Crawl d'entraînement IA",
    "pb.ai-egitim-tarama.tetikleyici": "AI-Training Crawl",
    "pb.ai-egitim-tarama.aciklama":
      "Crawleurs d'agents IA (GPTBot/ClaudeBot etc.) collectant du contenu pour l'entraînement de modèles. Appliquez une politique et bloquez le crawl non autorisé.",
    "pb.ai-egitim-tarama.s1.baslik": "Confirmer le trafic d'agents IA et sa catégorie",
    "pb.ai-egitim-tarama.s1.aksiyon": "Examinez les décisions ai_agent et quels agents (catégorie entraînement de modèle) crawlent.",
    "pb.ai-egitim-tarama.s2.baslik": "Vérifier la conformité au robots.txt",
    "pb.ai-egitim-tarama.s2.aksiyon": "Auditez si les agents respectent les directives robots et s'il y a un crawl de chemins non autorisé.",
    "pb.ai-egitim-tarama.s3.baslik": "Passer la politique des agents IA sur 'vérifier'",
    "pb.ai-egitim-tarama.s3.aksiyon": "Faites passer les agents effectuant un crawl d'entraînement non autorisé d'« autoriser » à une politique « vérifier ».",
    "pb.ai-egitim-tarama.s4.baslik": "Bloquer la catégorie entraînement de modèle",
    "pb.ai-egitim-tarama.s4.aksiyon": "Appliquez une règle de blocage capturant la condition aiCategory=model_training (sans casser la récupération en direct).",
    "pb.ai-egitim-tarama.s5.baslik": "Confirmer que la récupération IA légitime n'est pas affectée",
    "pb.ai-egitim-tarama.s5.aksiyon": "Vérifiez que les agents de récupération en direct/index de recherche passent toujours et que seul le crawl d'entraînement a été coupé.",
    "pb.ai-egitim-tarama.s6.baslik": "Documenter la politique et informer les parties prenantes",
    "pb.ai-egitim-tarama.s6.aksiyon": "Mettez à jour la politique d'accès IA ; consignez la décision dans le journal d'audit.",

    "pb.hesap-ele-gecirme.ad": "Prise de contrôle de compte (ATO)",
    "pb.hesap-ele-gecirme.tetikleyici": "Account Takeover",
    "pb.hesap-ele-gecirme.aciklama":
      "Comportement anormal sur des comptes pris en main après une connexion réussie. Coupez les sessions, protégez les comptes et fermez la cause racine.",
    "pb.hesap-ele-gecirme.s1.baslik": "Confirmer les connexions réussies suspectes et les anomalies de session",
    "pb.hesap-ele-gecirme.s1.aksiyon": "Examinez les connexions réussies avec saut de nouvel appareil/géographie et les anomalies de sécurité de session.",
    "pb.hesap-ele-gecirme.s2.baslik": "Extraire l'ensemble des comptes affectés",
    "pb.hesap-ele-gecirme.s2.aksiyon": "Listez dans le panneau de santé des comptes ceux dont le score de risque augmente ; déterminez le périmètre d'impact.",
    "pb.hesap-ele-gecirme.s3.baslik": "Invalider les sessions suspectes",
    "pb.hesap-ele-gecirme.s3.aksiyon": "Terminez de force les sessions compromises ; exigez une vérification supplémentaire pour les opérations sensibles.",
    "pb.hesap-ele-gecirme.s4.baslik": "Forcer une réinitialisation de mot de passe sur les comptes affectés",
    "pb.hesap-ele-gecirme.s4.aksiyon": "Déclenchez le flux de réinitialisation de mot de passe et de réinscription MFA sur les comptes à risque.",
    "pb.hesap-ele-gecirme.s5.baslik": "Bloquer les IP/ASN sources",
    "pb.hesap-ele-gecirme.s5.aksiyon": "Ajoutez à une règle de blocage les IP et ASN d'où provient la prise de contrôle.",
    "pb.hesap-ele-gecirme.s6.baslik": "Confirmer l'arrêt de l'activité anormale",
    "pb.hesap-ele-gecirme.s6.aksiyon": "Surveillez que les opérations anormales sur les comptes protégés ont cessé et qu'aucune nouvelle prise de contrôle n'a lieu.",
    "pb.hesap-ele-gecirme.s7.baslik": "Signaler l'incident et planifier des protections permanentes",
    "pb.hesap-ele-gecirme.s7.aksiyon": "Documentez l'impact, la chronologie et les actions menées ; planifiez une protection ATO permanente.",

    "pb.supheli-otomasyon.ad": "Hausse d'automatisation suspecte",
    "pb.supheli-otomasyon.tetikleyici": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.aciklama":
      "Une hausse d'automatisation/spam non humaine encore mal classifiée. Classifiez, confinez et orientez vers le bon playbook.",
    "pb.supheli-otomasyon.s1.baslik": "Confirmer la hausse d'automatisation/spam",
    "pb.supheli-otomasyon.s1.aksiyon": "Examinez dans la console en direct la montée soudaine des décisions automation et spam et le schéma temporel.",
    "pb.supheli-otomasyon.s2.baslik": "Classifier l'attaque (de quel type est-elle la plus proche ?)",
    "pb.supheli-otomasyon.s2.aksiyon": "En regardant les chemins ciblés et les signatures, déterminez si elle dérive vers scraping/credential stuffing/DDoS.",
    "pb.supheli-otomasyon.s3.baslik": "Appliquer une limitation de débit temporaire et passer en mode observation",
    "pb.supheli-otomasyon.s3.aksiyon": "Posez une limitation de débit temporaire sur les sources suspectes ; passez le mode de protection de 'monitor' à 'challenge'.",
    "pb.supheli-otomasyon.s4.baslik": "Bloquer les sources devenues clairement malveillantes",
    "pb.supheli-otomasyon.s4.aksiyon": "Bloquez les IP/ASN malveillants confirmés ; gardez les incertains sous observation.",
    "pb.supheli-otomasyon.s5.baslik": "Confirmer la baisse de la hausse et l'absence de faux positifs",
    "pb.supheli-otomasyon.s5.aksiyon": "Vérifiez que le trafic suspect a diminué et que les utilisateurs légitimes ne sont pas bloqués.",
    "pb.supheli-otomasyon.s6.baslik": "Transférer au playbook dédié approprié et documenter",
    "pb.supheli-otomasyon.s6.aksiyon": "Si le type est désormais clair, lancez le playbook dédié pertinent ; consignez la réponse dans le journal d'audit.",
  },

  es: {
    "x.baslik": "Respuesta a incidentes",

    "aciklama.baslik": "Runbooks de respuesta listos por tipo de ataque.",
    "aciklama.metin":
      "Un plan de respuesta preescrito y por fases para cada tipo de ataque ({fazlar}). Qué playbook se necesita {simdi} se calcula {gercek} ({n} eventos). Durante un incidente, abre el playbook, recorre los pasos y sigue tu progreso.",
    "aciklama.fazlar": "detección → contención → bloqueo → verificación → cierre",
    "aciklama.simdi": "ahora mismo",
    "aciklama.gercek": "a partir del tráfico REAL",

    "banner.tespit": "INCIDENTE ACTIVO — {ad} detectado",
    "banner.eslesen": "{n} eventos coincidentes en el tráfico reciente. Se recomienda ejecutar el playbook «{ad}».",
    "banner.ac": "Abrir playbook",

    "ozet.hazir": "Playbooks listos",
    "ozet.tetiklenen": "Activándose ahora",
    "ozet.yurutulen": "Runbooks en curso",

    "katalog.baslik": "Catálogo de playbooks",
    "katalog.runbook": "{n} runbooks",
    "katalog.adim": "{n} pasos",
    "katalog.sure": "~{n} min",
    "katalog.tetikleniyor": "activándose · {n}",

    "bos.baslik": "Selecciona un playbook",
    "bos.metin":
      "Abre un runbook de respuesta desde el catálogo de la izquierda. Los playbooks que se activan aparecen arriba; el progreso de cada uno se ve en el anillo de su tarjeta.",

    "cal.aktif": "activo · {n} eventos",
    "cal.sifirla": "Restablecer",
    "cal.metrik.ilerleme": "Progreso",
    "cal.metrik.ilerleme.tamam": "completado",
    "cal.metrik.ilerleme.kaldi": "quedan {n} pasos",
    "cal.metrik.otomasyon": "Automatización",
    "cal.metrik.otomasyon.alt": "{oto} auto · {manuel} manual",
    "cal.metrik.sure": "Tiempo estimado",
    "cal.metrik.sure.deger": "~{n} min",
    "cal.metrik.sure.alt": "{n} pasos en total",
    "cal.fazakisi": "Flujo de fases",

    "not.baslik": "Son plantillas orientativas",
    "not.metin.a": "Marcar un paso solo registra",
    "not.metin.b": "la intención y el progreso",
    "not.metin.c":
      "(en este navegador, local a la sesión) — por sí solo no realiza ningún cambio en producción. La acción real la aplicas en el panel correspondiente. La detección de activación, en cambio, es real: se calcula a partir del tráfico reciente real.",

    "faz.suanki": "fase actual",
    "faz.tamam": "hecho",

    "adim.otomatik": "Automático",
    "adim.manuel": "Manual",
    "adim.dk": "~{n} min",
    "adim.ilgiliPanel": "Panel relacionado",
    "adim.isaretKaldir": "Desmarcar como completado",
    "adim.isaretle": "Marcar como completado",

    "bitti.baslik": "Todos los pasos completados.",
    "bitti.metin": "No olvides documentar el incidente en el registro de auditoría y revisar las reglas temporales.",

    "faz.tespit": "Detección",
    "faz.sınırlama": "Contención",
    "faz.engelleme": "Bloqueo",
    "faz.doğrulama": "Verificación",
    "faz.kapanış": "Cierre",

    "siddet.kritik": "Crítico",
    "siddet.yuksek": "Alto",
    "siddet.orta": "Medio",

    "sorumlu.Specter": "Veylify",
    "sorumlu.Operatör": "Operador",
    "sorumlu.Güvenlik Ekibi": "Equipo de seguridad",

    "pb.kimlik-doldurma.ad": "Oleada de credential stuffing",
    "pb.kimlik-doldurma.tetikleyici": "Credential Stuffing Surge",
    "pb.kimlik-doldurma.aciklama":
      "Intentos masivos de inicio de sesión con listas de usuario/contraseña robadas. Contén y bloquea antes de que derive en una apropiación de cuenta (ATO).",
    "pb.kimlik-doldurma.s1.baslik": "Confirmar el pico de la tasa de fallos en los endpoints de inicio de sesión",
    "pb.kimlik-doldurma.s1.aksiyon": "En la consola en vivo, revisa la tasa de 401/fallos en la ruta /login y las decisiones credential_stuffing.",
    "pb.kimlik-doldurma.s2.baslik": "Extraer la concentración por ASN de origen y país",
    "pb.kimlik-doldurma.s2.aksiyon": "Identifica los ASN y las geografías donde se concentra el ataque; distingue botnet de fuente única.",
    "pb.kimlik-doldurma.s3.baslik": "Aplicar un límite de tasa agresivo al endpoint de inicio de sesión",
    "pb.kimlik-doldurma.s3.aksiyon": "Baja el umbral de solicitudes por minuto por IP; ralentiza temporalmente los picos repentinos.",
    "pb.kimlik-doldurma.s4.baslik": "Forzar un desafío en las sesiones sospechosas",
    "pb.kimlik-doldurma.s4.aksiyon": "Fuerza un desafío invisible/activo en las solicitudes de inicio de sesión con bajo puntaje de humanidad.",
    "pb.kimlik-doldurma.s5.baslik": "Bloquear el conjunto de ASN/IP maliciosos",
    "pb.kimlik-doldurma.s5.aksiyon": "Añade los ASN atacantes y rangos de IP detectados a una regla de bloqueo.",
    "pb.kimlik-doldurma.s6.baslik": "Confirmar que la tasa de fallos ha vuelto a la normalidad",
    "pb.kimlik-doldurma.s6.aksiyon": "Monitorea la tasa de fallos de inicio de sesión tras la contención; comprueba si se comprometió alguna cuenta.",
    "pb.kimlik-doldurma.s7.baslik": "Documentar el incidente y revisar las reglas temporales",
    "pb.kimlik-doldurma.s7.aksiyon": "Registra la respuesta en el log de auditoría; decide si hacer permanentes los límites de tasa/bloqueos temporales.",

    "pb.ddos-sel.ad": "Ataque de inundación DDoS",
    "pb.ddos-sel.tetikleyici": "DDoS Flood",
    "pb.ddos-sel.aciklama":
      "Una inundación de solicitudes de alto volumen orientada a agotar recursos. Limita el ritmo rápido para mantener el servicio en pie y bloquea las fuentes maliciosas.",
    "pb.ddos-sel.s1.baslik": "Confirmar el pico de volumen de solicitudes y el máximo de RPS",
    "pb.ddos-sel.s1.aksiyon": "En la consola en vivo, revisa la curva de solicitudes por segundo (RPS) y la proporción de decisiones ddos.",
    "pb.ddos-sel.s2.baslik": "Determinar la superficie de ataque y las rutas objetivo",
    "pb.ddos-sel.s2.aksiyon": "Extrae las rutas más golpeadas y la distribución de ASN de origen; distingue volumétrico de capa de aplicación.",
    "pb.ddos-sel.s3.baslik": "Elevar el límite de tasa global y el modo de protección",
    "pb.ddos-sel.s3.aksiyon": "Acerca el modo de protección del sitio a 'block'; endurece temporalmente el umbral de solicitudes global.",
    "pb.ddos-sel.s4.baslik": "Bloquear en masa el ASN/geografía atacante",
    "pb.ddos-sel.s4.aksiyon": "Cierra con una regla de bloqueo los ASN de los que proviene la inundación y los países de alto riesgo.",
    "pb.ddos-sel.s5.baslik": "Solicitar protección adicional en el edge/CDN",
    "pb.ddos-sel.s5.aksiyon": "Si el volumen se desborda, activa un desafío/lista de bloqueo en el proveedor de capa superior (edge).",
    "pb.ddos-sel.s6.baslik": "Confirmar que la salud del servicio se ha estabilizado",
    "pb.ddos-sel.s6.aksiyon": "Verifica que las métricas de disponibilidad y latencia han vuelto a la normalidad y que el tráfico legítimo pasa.",
    "pb.ddos-sel.s7.baslik": "Revertir los endurecimientos temporales y reportar",
    "pb.ddos-sel.s7.aksiyon": "Una vez que amaine la inundación, devuelve los umbrales excesivos a la normalidad; genera un informe posincidente.",

    "pb.kaziyici-kampanya.ad": "Campaña de scraping",
    "pb.kaziyici-kampanya.tetikleyici": "Scraper Campaign",
    "pb.kaziyici-kampanya.aciklama":
      "Bots de automatización que scrapean sistemáticamente contenido/precios. Limita la exfiltración de datos y bloquea las firmas headless/automatización.",
    "pb.kaziyici-kampanya.s1.baslik": "Confirmar el patrón de scraping y el contenido objetivo",
    "pb.kaziyici-kampanya.s1.aksiyon": "Revisa en la consola en vivo los patrones de navegación secuencial/profunda y las decisiones scraper y automation.",
    "pb.kaziyici-kampanya.s2.baslik": "Extraer las firmas headless/automatización",
    "pb.kaziyici-kampanya.s2.aksiyon": "Recopila las señales de discordancia TLS/UA, webdriver y headless desde la inteligencia de huellas.",
    "pb.kaziyici-kampanya.s3.baslik": "Poner una cuota por sesión en las rutas de scraping",
    "pb.kaziyici-kampanya.s3.aksiyon": "Aplica límites de paginación/cuota y ralentización a los endpoints muy scrapeados.",
    "pb.kaziyici-kampanya.s4.baslik": "Bloquear el tráfico headless y con discordancia TLS",
    "pb.kaziyici-kampanya.s4.aksiyon": "Crea una regla de bloqueo que capture las condiciones headless=true y de discordancia TLS/UA.",
    "pb.kaziyici-kampanya.s5.baslik": "Probar la regla en el sandbox — sin efectos secundarios",
    "pb.kaziyici-kampanya.s5.aksiyon": "Ejecuta la nueva regla de bloqueo contra eventos de ejemplo en el sandbox; verifica que los bots legítimos (Googlebot) no se ven afectados.",
    "pb.kaziyici-kampanya.s6.baslik": "Confirmar que el volumen de scraping ha bajado",
    "pb.kaziyici-kampanya.s6.aksiyon": "Monitorea que las decisiones scraper/automation han disminuido tras el bloqueo.",
    "pb.kaziyici-kampanya.s7.baslik": "Hacer permanente la regla y documentar el incidente",
    "pb.kaziyici-kampanya.s7.aksiyon": "Haz permanente la regla eficaz; registra la respuesta en la traza de auditoría.",

    "pb.ai-egitim-tarama.ad": "Rastreo de entrenamiento de IA",
    "pb.ai-egitim-tarama.tetikleyici": "AI-Training Crawl",
    "pb.ai-egitim-tarama.aciklama":
      "Rastreadores de agentes de IA (GPTBot/ClaudeBot, etc.) que recopilan contenido para el entrenamiento de modelos. Aplica política y bloquea el rastreo no autorizado.",
    "pb.ai-egitim-tarama.s1.baslik": "Confirmar el tráfico de agentes de IA y su categoría",
    "pb.ai-egitim-tarama.s1.aksiyon": "Revisa las decisiones ai_agent y qué agentes (categoría entrenamiento de modelo) están rastreando.",
    "pb.ai-egitim-tarama.s2.baslik": "Comprobar el cumplimiento de robots.txt",
    "pb.ai-egitim-tarama.s2.aksiyon": "Audita si los agentes obedecen las directivas de robots y si hay rastreo de rutas no autorizado.",
    "pb.ai-egitim-tarama.s3.baslik": "Poner la política de agentes de IA en 'verificar'",
    "pb.ai-egitim-tarama.s3.aksiyon": "Pasa los agentes que hacen rastreo de entrenamiento no autorizado de 'permitir' a una política de 'verificar'.",
    "pb.ai-egitim-tarama.s4.baslik": "Bloquear la categoría de entrenamiento de modelo",
    "pb.ai-egitim-tarama.s4.aksiyon": "Aplica una regla de bloqueo que capture la condición aiCategory=model_training (sin romper la obtención en vivo).",
    "pb.ai-egitim-tarama.s5.baslik": "Confirmar que la obtención legítima de IA no se ve afectada",
    "pb.ai-egitim-tarama.s5.aksiyon": "Verifica que los agentes de obtención en vivo/índice de búsqueda siguen pasando y que solo se cortó el rastreo de entrenamiento.",
    "pb.ai-egitim-tarama.s6.baslik": "Documentar la política e informar a las partes interesadas",
    "pb.ai-egitim-tarama.s6.aksiyon": "Actualiza la política de acceso de IA; registra la decisión en el log de auditoría.",

    "pb.hesap-ele-gecirme.ad": "Apropiación de cuenta (ATO)",
    "pb.hesap-ele-gecirme.tetikleyici": "Account Takeover",
    "pb.hesap-ele-gecirme.aciklama":
      "Comportamiento anómalo en cuentas apropiadas tras un inicio de sesión exitoso. Corta las sesiones, protege las cuentas y cierra la causa raíz.",
    "pb.hesap-ele-gecirme.s1.baslik": "Confirmar inicios de sesión exitosos sospechosos y anomalías de sesión",
    "pb.hesap-ele-gecirme.s1.aksiyon": "Revisa los inicios de sesión exitosos con salto de nuevo dispositivo/geografía y las anomalías de seguridad de sesión.",
    "pb.hesap-ele-gecirme.s2.baslik": "Extraer el conjunto de cuentas afectadas",
    "pb.hesap-ele-gecirme.s2.aksiyon": "Lista en el panel de salud de cuentas las que tienen un puntaje de riesgo en aumento; determina el alcance del impacto.",
    "pb.hesap-ele-gecirme.s3.baslik": "Invalidar las sesiones sospechosas",
    "pb.hesap-ele-gecirme.s3.aksiyon": "Termina de forma forzada las sesiones comprometidas; exige verificación adicional para operaciones sensibles.",
    "pb.hesap-ele-gecirme.s4.baslik": "Forzar un restablecimiento de contraseña en las cuentas afectadas",
    "pb.hesap-ele-gecirme.s4.aksiyon": "Activa el flujo de restablecimiento de contraseña y reinscripción MFA en las cuentas en riesgo.",
    "pb.hesap-ele-gecirme.s5.baslik": "Bloquear las IP/ASN de origen",
    "pb.hesap-ele-gecirme.s5.aksiyon": "Añade a una regla de bloqueo las IP y ASN de los que proviene la apropiación.",
    "pb.hesap-ele-gecirme.s6.baslik": "Confirmar que la actividad anómala se ha detenido",
    "pb.hesap-ele-gecirme.s6.aksiyon": "Monitorea que las operaciones anómalas en las cuentas protegidas han cesado y que no ocurre una nueva apropiación.",
    "pb.hesap-ele-gecirme.s7.baslik": "Reportar el incidente y planificar protecciones permanentes",
    "pb.hesap-ele-gecirme.s7.aksiyon": "Documenta el impacto, la cronología y las acciones tomadas; planifica una protección ATO permanente.",

    "pb.supheli-otomasyon.ad": "Aumento de automatización sospechosa",
    "pb.supheli-otomasyon.tetikleyici": "Suspicious Automation Spike",
    "pb.supheli-otomasyon.aciklama":
      "Un aumento de automatización/spam no humano aún no clasificado con claridad. Clasifica, contén y deriva al playbook adecuado.",
    "pb.supheli-otomasyon.s1.baslik": "Confirmar el aumento de automatización/spam",
    "pb.supheli-otomasyon.s1.aksiyon": "Revisa en la consola en vivo el ascenso repentino de las decisiones automation y spam y el patrón temporal.",
    "pb.supheli-otomasyon.s2.baslik": "Clasificar el ataque (¿a qué tipo se acerca más?)",
    "pb.supheli-otomasyon.s2.aksiyon": "Mirando las rutas objetivo y las firmas, determina si está derivando hacia scraping/credential stuffing/DDoS.",
    "pb.supheli-otomasyon.s3.baslik": "Aplicar un límite de tasa temporal y pasar a modo observación",
    "pb.supheli-otomasyon.s3.aksiyon": "Pon un límite de tasa temporal a las fuentes sospechosas; eleva el modo de protección de 'monitor' a 'challenge'.",
    "pb.supheli-otomasyon.s4.baslik": "Bloquear las fuentes que se vuelven claramente maliciosas",
    "pb.supheli-otomasyon.s4.aksiyon": "Bloquea las IP/ASN maliciosas confirmadas; mantén las inciertas bajo observación.",
    "pb.supheli-otomasyon.s5.baslik": "Confirmar que el aumento ha bajado y que no hay falsos positivos",
    "pb.supheli-otomasyon.s5.aksiyon": "Verifica que el tráfico sospechoso ha disminuido y que los usuarios legítimos no están siendo bloqueados.",
    "pb.supheli-otomasyon.s6.baslik": "Derivar al playbook dedicado apropiado y documentar",
    "pb.supheli-otomasyon.s6.aksiyon": "Si el tipo ya está claro, inicia el playbook dedicado pertinente; registra la respuesta en el log de auditoría.",
  },
};

/** Anahtarı hedef dile çevir; yoksa TR'ye, o da yoksa anahtara düşer. */
export function mudahaleCeviri(anahtar: string, dil: Dil): string {
  return sozluk[dil]?.[anahtar] ?? sozluk.tr?.[anahtar] ?? anahtar;
}
