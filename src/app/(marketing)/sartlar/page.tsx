import Link from "next/link";
import type { Metadata } from "next";
import { MARKA } from "@/lib/marka";
import { HukukiHero, Bolum, HukukiAltCta } from "../gizlilik/page";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description:
    "Veylify hizmetlerinin kullanımına ilişkin şartlar: hizmet tanımı, yükümlülükler, fikri mülkiyet, sorumluluk reddi, fesih ve uygulanacak hukuk.",
  alternates: { canonical: "/sartlar" },
  openGraph: {
    title: `Kullanım Şartları — ${MARKA.ad}`,
    description: "Veylify hizmetlerinin kullanımına ilişkin şartlar ve koşullar.",
    url: `${MARKA.url}/sartlar`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

const GUNCELLEME = "16 Temmuz 2026";

export default function SartlarPage() {
  return (
    <>
      <HukukiHero
        rozet="Şartlar"
        baslik="Kullanım"
        vurgu="Şartları"
        aciklama={`Bu şartlar, ${MARKA.ad} hizmetlerini kullanımınızı düzenler. Hizmeti kullanarak bu koşulları kabul etmiş sayılırsınız.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Taraflar ve Kabul">
            <p>
              Bu Kullanım Şartları (“Şartlar”), {MARKA.ad} ({MARKA.domain}, “Hizmet”) ile
              hizmeti kullanan gerçek veya tüzel kişi (“Kullanıcı”) arasındaki ilişkiyi düzenler.
              Hesap oluşturarak veya hizmeti kullanarak bu Şartları okuduğunuzu, anladığınızı ve
              kabul ettiğinizi beyan edersiniz. Şartları kabul etmiyorsanız hizmeti
              kullanmamalısınız.
            </p>
          </Bolum>

          <Bolum n="2" baslik="Hizmet Tanımı">
            <p>
              {MARKA.ad}, web sitelerini yapay zeka botlarından ve otomatik kötüye kullanımdan
              koruyan bir doğrulama ve bot yönetim platformudur. Hizmet; ghost-font doğrulama,
              davranış analizi, kural motoru, coğrafi/ASN istihbaratı ve raporlama gibi bileşenleri
              içerir. Hizmetin kapsamı, geliştirilmesi amacıyla zaman zaman güncellenebilir.
            </p>
          </Bolum>

          <Bolum n="3" baslik="Hesap ve Güvenlik">
            <ul>
              <li>Hesap bilgilerinizin doğru ve güncel olmasından siz sorumlusunuz.</li>
              <li>Hesap kimlik bilgilerinizin gizliliğini korumak ve yetkisiz erişimi önlemek sizin sorumluluğunuzdadır.</li>
              <li>Hesabınız altında gerçekleşen tüm faaliyetlerden siz sorumlu olursunuz.</li>
              <li>Yetkisiz bir erişim fark ederseniz derhal bize bildirmelisiniz.</li>
            </ul>
          </Bolum>

          <Bolum n="4" baslik="Kullanıcı Yükümlülükleri">
            <p>Hizmeti kullanırken aşağıdakileri yapmamayı kabul edersiniz:</p>
            <ul>
              <li>Yürürlükteki mevzuata veya üçüncü kişi haklarına aykırı biçimde kullanmak.</li>
              <li>Hizmeti tersine mühendisliğe tabi tutmak, kopyalamak veya izinsiz yeniden satmak.</li>
              <li>Altyapıya zarar verecek, aşırı yük bindirecek veya güvenliği tehlikeye atacak eylemlerde bulunmak.</li>
              <li>Hizmeti yasa dışı içerik barındıran veya kötü amaçlı sistemleri korumak için kullanmak.</li>
            </ul>
          </Bolum>

          <Bolum n="5" baslik="Ücretlendirme ve Ödeme">
            <p>
              Ücretsiz ve ücretli planlar sunulur. Ücretli planlarda ücretler, seçtiğiniz plan ve
              kullanım hacmine göre belirlenir; faturalandırma dönemsel olarak yapılır. Vergiler,
              aksi belirtilmedikçe fiyatlara dâhil değildir. Plan koşulları{" "}
              <Link href="/fiyatlandirma" className="font-semibold text-veylify-700">
                Fiyatlandırma
              </Link>{" "}
              sayfasında yer alır.
            </p>
          </Bolum>

          <Bolum n="6" baslik="Fikri Mülkiyet">
            <p>
              {MARKA.ad} markası, logosu, ghost-font teknolojisi, yazılımı, arayüzü ve tüm ilgili
              içerik {MARKA.ad}’a aittir ve fikri mülkiyet mevzuatıyla korunur. Bu Şartlar size,
              hizmeti sözleşmeye uygun kullanmanız için sınırlı, münhasır olmayan ve devredilemez
              bir kullanım hakkı tanır; mülkiyet devri anlamına gelmez. Kendi içeriğinizin
              mülkiyeti sizde kalır.
            </p>
          </Bolum>

          <Bolum n="7" baslik="Hizmet Sürekliliği">
            <p>
              Hizmetin kesintisiz ve hatasız olması için makul çabayı gösteririz; ancak bakım,
              güncelleme veya kontrolümüz dışındaki nedenlerle geçici kesintiler yaşanabilir.
              Ölçek planında ayrı bir hizmet seviyesi taahhüdü (SLA) sunulabilir.
            </p>
          </Bolum>

          <Bolum n="8" baslik="Sorumluluğun Sınırlandırılması ve Garanti Reddi">
            <p>
              Hizmet “olduğu gibi” ve “mevcut haliyle” sunulur. Yürürlükteki mevzuatın izin
              verdiği ölçüde, dolaylı, arızi veya sonuç niteliğindeki zararlardan (kâr kaybı, veri
              kaybı, iş kesintisi dâhil) sorumlu tutulamayız. Her hâlükârda toplam sorumluluğumuz,
              talebin doğduğu tarihten önceki on iki ayda hizmet için ödediğiniz tutarla sınırlıdır.
              Hiçbir bot koruma çözümü %100 güvenlik garantisi veremez.
            </p>
          </Bolum>

          <Bolum n="9" baslik="Askıya Alma ve Fesih">
            <p>
              Bu Şartların ihlali hâlinde hesabınızı askıya alabilir veya sonlandırabiliriz. Siz
              de dilediğiniz zaman hesabınızı kapatarak sözleşmeyi feshedebilirsiniz. Fesihten
              sonra, yasal saklama yükümlülükleri saklı kalmak kaydıyla verileriniz silinir veya
              anonimleştirilir.
            </p>
          </Bolum>

          <Bolum n="10" baslik="Değişiklikler">
            <p>
              Bu Şartları zaman zaman güncelleyebiliriz. Önemli değişikliklerde sizi bilgilendirir,
              güncel sürümü bu sayfada yayımlarız. Değişiklik sonrası hizmeti kullanmaya devam
              etmeniz, güncel Şartları kabul ettiğiniz anlamına gelir.
            </p>
          </Bolum>

          <Bolum n="11" baslik="Uygulanacak Hukuk ve Yetki">
            <p>
              Bu Şartlar Türkiye Cumhuriyeti hukukuna tabidir. Şartlardan doğabilecek
              uyuşmazlıkların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri
              yetkilidir.
            </p>
          </Bolum>

          <Bolum n="12" baslik="İletişim">
            <p>
              Şartlarla ilgili sorularınız için{" "}
              <a href={`mailto:${MARKA.destekEposta}`} className="font-semibold text-veylify-700">
                {MARKA.destekEposta}
              </a>{" "}
              adresine yazabilirsiniz.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}
