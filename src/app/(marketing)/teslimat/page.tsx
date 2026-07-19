import Link from "next/link";
import type { Metadata } from "next";
import { HukukiHero, Bolum, HukukiAltCta } from "@/app/(marketing)/gizlilik/page";
import { MARKA, FIRMA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Teslimat ve Hizmet Erişim Koşulları",
  description:
    "Veylify dijital hizmet teslimat ve erişim koşulları: ödeme onayı sonrası anında aktifleşme, panel ve API anahtarı erişimi, teslimat süresi ve destek koşulları.",
  alternates: { canonical: `${MARKA.url}/teslimat` },
};

const GUNCELLEME = "19 Temmuz 2026";

export default function TeslimatPage() {
  return (
    <>
      <HukukiHero
        rozet="Teslimat ve Erişim"
        baslik="Teslimat ve Hizmet"
        vurgu="Erişim Koşulları"
        aciklama={`${MARKA.ad} tamamen dijital bir hizmettir. Ödemeniz onaylandığı anda hesabınız aktifleşir; fiziksel teslimat yoktur. Erişim koşullarını burada açıklıyoruz.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Hizmetin Niteliği">
            <p>
              {MARKA.ad} ({MARKA.domain}), yapay zekâ botlarına karşı görünmez (ghost-font) doğrulama
              ve bot koruma sağlayan, tamamen elektronik ortamda sunulan bir <strong>dijital
              hizmettir</strong>. Hizmet, fiziksel bir ürün teslimi içermez; kargo, teslimat adresi
              veya fiziksel gönderim söz konusu değildir.
            </p>
          </Bolum>

          <Bolum n="2" baslik="Ödeme Onayı Sonrası Anında Aktifleşme">
            <p>
              Ücretli bir plana geçişte, ödemenizin ödeme kuruluşu (PayTR sanal POS / kredi kartı)
              tarafından onaylanmasının ardından hesabınız ve satın aldığınız plan{" "}
              <strong>anında (en geç birkaç dakika içinde) aktifleştirilir</strong>. Aktifleşme,
              ALICI&apos;nın sisteme kayıtlı e-posta adresine tanımlı hesap üzerinden gerçekleşir.
            </p>
            <p className="mt-2">
              Ücretsiz plan için ise herhangi bir ödeme gerekmeden, hesap oluşturur oluşturmaz
              erişim sağlanır.
            </p>
          </Bolum>

          <Bolum n="3" baslik="Erişim Kapsamı: Panel ve API Anahtarı">
            <p>Aktifleşme ile birlikte aşağıdakilere erişim kazanırsınız:</p>
            <ul>
              <li>
                <strong>Yönetim paneli:</strong> Sitelerinizi ve doğrulama ayarlarınızı yönettiğiniz,
                kullanım/analiz verilerini gördüğünüz kontrol paneli.
              </li>
              <li>
                <strong>API anahtarları / site anahtarı:</strong> Doğrulama akışını kendi sitenize
                entegre etmeniz için gerekli anahtarlar ve entegrasyon kodu.
              </li>
              <li>
                <strong>Plan özellikleri:</strong> Satın aldığınız plana bağlı olarak davranışsal
                analiz, kural motoru, webhook ve diğer özellikler.
              </li>
            </ul>
          </Bolum>

          <Bolum n="4" baslik="Teslimat (Erişim) Süresi">
            <p>
              Dijital hizmet olduğundan teslimat, erişimin sağlanması anlamına gelir ve ödeme onayı
              sonrası <strong>anında / en geç birkaç dakika</strong> içinde tamamlanır. Ödeme
              sisteminden kaynaklanan geçici gecikmeler dışında, aktifleşmenin makul süre içinde
              gerçekleşmemesi hâlinde SATICI, başvurunuz üzerine erişiminizi ivedilikle sağlar.
            </p>
          </Bolum>

          <Bolum n="5" baslik="Fiziksel Teslimat Bulunmaması">
            <p>
              Hizmet dijital olduğundan hiçbir fiziksel ürün gönderimi, kargo ücreti veya teslimat
              adresi bilgisi gerekmez. Bu nedenle kargo takibi, teslimat gecikmesi veya fiziksel iade
              gibi durumlar {MARKA.ad} için geçerli değildir. İade ve cayma koşulları için{" "}
              <Link href="/iade" className="font-semibold text-veylify-700">
                İptal, İade ve Cayma Hakkı Politikası
              </Link>
              &apos;na bakınız.
            </p>
          </Bolum>

          <Bolum n="6" baslik="Erişim Sorununda Destek">
            <p>
              Ödeme yaptığınız hâlde hesabınız aktifleşmediyse, panele veya API anahtarlarınıza
              erişemiyorsanız ya da entegrasyonda bir sorunla karşılaştıysanız, aşağıdaki kanallardan
              destek ekibimize ulaşabilirsiniz. Talebinizi mümkün olan en kısa sürede çözüme
              kavuştururuz.
            </p>
            <ul>
              <li>
                E-posta:{" "}
                <a href={`mailto:${FIRMA.eposta}`} className="font-semibold text-veylify-700">
                  {FIRMA.eposta}
                </a>
              </li>
              <li>
                İletişim formu:{" "}
                <Link href="/contact" className="font-semibold text-veylify-700">
                  {MARKA.domain}/contact
                </Link>
              </li>
              <li>Telefon: {FIRMA.telefon}</li>
              <li>
                <strong>Çalışma saatleri:</strong> {FIRMA.calismaSaatleri}
              </li>
            </ul>
          </Bolum>

          <Bolum n="7" baslik="Hizmet Sürekliliği">
            <p>
              SATICI, hizmetin kesintisiz ve güvenli sunulması için makul teknik ve idari tedbirleri
              alır. Planlı bakım, güncelleme veya SATICI&apos;nın kontrolü dışındaki nedenlerle
              (mücbir sebep, altyapı sağlayıcı kaynaklı kesintiler vb.) geçici erişim aksamaları
              olabilir. Bu tür durumlarda gerekli bilgilendirme yapılır ve hizmet en kısa sürede eski
              hâline getirilir.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}
