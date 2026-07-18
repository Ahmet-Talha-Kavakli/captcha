import Link from "next/link";
import type { Metadata } from "next";
import { MARKA } from "@/lib/marka";
import { HukukiHero, Bolum, HukukiAltCta } from "../gizlilik/page";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Veylify aydınlatma metni: veri sorumlusu, işleme amaçları, aktarım ve ilgili kişi hakları.",
  alternates: { canonical: "/kvkk" },
  openGraph: {
    title: `KVKK Aydınlatma Metni — ${MARKA.ad}`,
    description: "6698 sayılı KVKK kapsamında Veylify aydınlatma metni ve ilgili kişi hakları.",
    url: `${MARKA.url}/kvkk`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

const GUNCELLEME = "16 Temmuz 2026";

export default function KvkkPage() {
  return (
    <>
      <HukukiHero
        rozet="KVKK"
        baslik="KVKK Aydınlatma"
        vurgu="Metni"
        aciklama={`6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, veri sorumlusu sıfatıyla ${MARKA.ad} tarafından kişisel verilerinizin işlenmesine ilişkin aydınlatma metnidir.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Veri Sorumlusu">
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel
              verileriniz veri sorumlusu sıfatıyla {MARKA.ad} tarafından aşağıda açıklanan
              kapsamda işlenmektedir. İletişim: {MARKA.domain}, {MARKA.destekEposta} — İstanbul,
              Türkiye.
            </p>
          </Bolum>

          <Bolum n="2" baslik="İşlenen Kişisel Veriler">
            <ul>
              <li><strong>Kimlik ve iletişim:</strong> Ad, soyad, e-posta adresi, (varsa) şirket unvanı.</li>
              <li><strong>Müşteri işlem:</strong> Hesap ayarları, talep ve destek kayıtları, kullanım tercihleri.</li>
              <li><strong>İşlem güvenliği:</strong> IP adresi, tarayıcı/UA bilgisi, TLS parmak izi ve doğrulama davranış sinyalleri.</li>
              <li><strong>Finans:</strong> Ücretli planlarda fatura bilgileri (ödeme, güvenli üçüncü taraf sağlayıcılar aracılığıyla alınır).</li>
            </ul>
          </Bolum>

          <Bolum n="3" baslik="Kişisel Verilerin İşlenme Amaçları">
            <ul>
              <li>Hizmet sözleşmesinin kurulması ve ifası, hesabın oluşturulup yönetilmesi.</li>
              <li>Bot tespiti, doğrulama kararlarının üretilmesi ve bilgi güvenliğinin sağlanması.</li>
              <li>Talep ve şikâyetlerin karşılanması, sizinle iletişim kurulması.</li>
              <li>Hizmetin geliştirilmesi ile istatistiksel analiz ve raporlama.</li>
              <li>Hukuki yükümlülüklerin yerine getirilmesi ve yetkili makam taleplerinin karşılanması.</li>
            </ul>
          </Bolum>

          <Bolum n="4" baslik="İşlemenin Hukuki Sebepleri">
            <p>Kişisel verileriniz, KVKK m.5 ve m.6 uyarınca aşağıdaki hukuki sebeplere dayanılarak işlenir:</p>
            <ul>
              <li>Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması.</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi.</li>
              <li>Bir hakkın tesisi, kullanılması veya korunması için işlemenin zorunlu olması.</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaati.</li>
              <li>Gerektiğinde açık rızanızın alınması.</li>
            </ul>
          </Bolum>

          <Bolum n="5" baslik="Kişisel Verilerin Aktarılması">
            <p>
              Kişisel verileriniz; hizmetin sunulması amacıyla barındırma ve altyapı
              sağlayıcılarına, yasal yükümlülükler kapsamında yetkili kamu kurum ve kuruluşlarına,
              KVKK m.8 ve m.9’daki şartlara uygun olarak aktarılabilir. Yurt dışına aktarım söz
              konusu olduğunda, Kanun’un öngördüğü güvenceler sağlanır.
            </p>
          </Bolum>

          <Bolum n="6" baslik="Toplama Yöntemi">
            <p>
              Kişisel verileriniz; web sitesi ve panel üzerinden elektronik ortamda, doğrulama
              hizmetinin çalışması sırasında otomatik yollarla ve iletişim kanallarımıza
              ilettiğiniz bildirimler aracılığıyla toplanır.
            </p>
          </Bolum>

          <Bolum n="7" baslik="İlgili Kişinin Hakları (KVKK m.11)">
            <p>KVKK’nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul>
              <li>Kişisel verinizin işlenip işlenmediğini öğrenme.</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
              <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
              <li>KVKK’da öngörülen şartlarla silinmesini veya yok edilmesini isteme.</li>
              <li>Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
              <li>Yalnızca otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme.</li>
              <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
            </ul>
          </Bolum>

          <Bolum n="8" baslik="Başvuru Yolu">
            <p>
              Yukarıdaki haklarınıza ilişkin taleplerinizi{" "}
              <a href={`mailto:${MARKA.destekEposta}`} className="font-semibold text-veylify-700">
                {MARKA.destekEposta}
              </a>{" "}
              adresine iletebilir veya{" "}
              <Link href="/iletisim" className="font-semibold text-veylify-700">
                iletişim formumuz
              </Link>{" "}
              üzerinden başvurabilirsiniz. Başvurunuz, talebin niteliğine göre en geç otuz gün
              içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi
              hâlinde Kurul’ca belirlenen tarife uygulanabilir.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}
