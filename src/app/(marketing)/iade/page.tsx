import Link from "next/link";
import type { Metadata } from "next";
import { HukukiHero, Bolum, HukukiAltCta } from "@/app/(marketing)/gizlilik/page";
import { MARKA, FIRMA } from "@/lib/marka";
import { PLANLAR } from "@/lib/specter/plans";

export const metadata: Metadata = {
  title: "İptal, İade ve Cayma Hakkı Politikası",
  description:
    "Veylify iptal, iade ve cayma hakkı politikası: 14 günlük cayma hakkı, iade süresi ve yöntemi, dijital hizmet istisnası, abonelik iptali ve ücretsiz plan koşulları.",
  alternates: { canonical: `${MARKA.url}/iade` },
};

const GUNCELLEME = "19 Temmuz 2026";

export default function IadePage() {
  return (
    <>
      <HukukiHero
        rozet="İade ve Cayma"
        baslik="İptal, İade ve"
        vurgu="Cayma Hakkı"
        aciklama={`${MARKA.ad} dijital hizmet aboneliğine ilişkin cayma hakkı, iade süreçleri ve abonelik iptali koşullarını 6502 sayılı Kanun kapsamında açık ve adil biçimde açıklıyoruz.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Kapsam">
            <p>
              Bu politika, {MARKA.ad} ({MARKA.domain}) tarafından sunulan dijital hizmet
              aboneliklerine ilişkin iptal, iade ve cayma hakkı süreçlerini açıklar. Politika, 6502
              sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği ile{" "}
              <Link href="/mesafeli-satis" className="font-semibold text-veylify-700">
                Mesafeli Satış Sözleşmesi
              </Link>
              &apos;nin ayrılmaz bir parçasıdır.
            </p>
          </Bolum>

          <Bolum n="2" baslik="14 Günlük Cayma Hakkı">
            <p>
              Ücretli bir plana geçen tüketici müşteriler, satın alma (sözleşmenin kurulduğu) tarihten
              itibaren <strong>14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin ve
              cezai şart ödemeksizin cayma hakkına sahiptir.
            </p>
            <p className="mt-2">
              <strong>Koşul:</strong> Cayma hakkının bedelin tamamının iadesiyle sonuçlanabilmesi için
              hizmetin fiilen kullanılmaya başlanmamış olması gerekir. Hizmetin kullanımına
              başlandıysa aşağıdaki <strong>4. bölümdeki dijital hizmet istisnası</strong> uygulanır.
            </p>
          </Bolum>

          <Bolum n="3" baslik="Cayma Hakkı Nasıl Kullanılır?">
            <p>
              Cayma hakkınızı kullanmak için 14 günlük süre içinde aşağıdaki kanallardan birine yazılı
              başvuru yapmanız yeterlidir. Başvurunuzda hesap e-postanızı ve satın alma bilgisini
              belirtmeniz sürecin hızlanmasını sağlar.
            </p>
            <ul>
              <li>
                E-posta:{" "}
                <a href={`mailto:${FIRMA.eposta}`} className="font-semibold text-veylify-700">
                  {FIRMA.eposta}
                </a>
              </li>
              <li>
                KVKK / veri başvuruları için:{" "}
                <a href={`mailto:${FIRMA.kvkkEposta}`} className="font-semibold text-veylify-700">
                  {FIRMA.kvkkEposta}
                </a>
              </li>
              <li>
                İletişim formu:{" "}
                <Link href="/contact" className="font-semibold text-veylify-700">
                  {MARKA.domain}/contact
                </Link>
              </li>
              <li>Adres: {FIRMA.adres}</li>
              <li>Telefon: {FIRMA.telefon}</li>
            </ul>
          </Bolum>

          <Bolum n="4" baslik="Dijital Hizmet İstisnası">
            <p>
              {MARKA.ad}, fiziksel ürün değil, elektronik ortamda anında ifa edilen bir{" "}
              <strong>dijital hizmettir</strong>. Mesafeli Sözleşmeler Yönetmeliği uyarınca; elektronik
              ortamda anında ifa edilen hizmetlerde, tüketicinin onayıyla ifaya başlanması hâlinde{" "}
              <strong>cayma hakkı kullanılamaz</strong>.
            </p>
            <ul>
              <li>
                Ücretli plana geçişte, hizmetin cayma süresi dolmadan ifasına başlanmasına ve bu
                durumda cayma hakkının düşeceğine ilişkin <strong>ön onayınız</strong> alınır.
              </li>
              <li>
                Hizmeti <strong>kullanmaya başlamadıysanız</strong> 14 gün içinde tam iade alırsınız.
              </li>
              <li>
                Hizmeti <strong>kullanmaya başladıysanız</strong> cayma hakkı düşer; mevcut ödenmiş
                dönem sonuna kadar hizmetten yararlanmaya devam eder ve dilerseniz aboneliğinizi bir
                sonraki dönem için iptal edersiniz.
              </li>
            </ul>
          </Bolum>

          <Bolum n="5" baslik="İade Süresi ve Yöntemi">
            <p>
              Geçerli bir cayma / iade talebinin bize ulaşmasından itibaren en geç{" "}
              <strong>14 (on dört) gün</strong> içinde, tahsil edilen bedel{" "}
              <strong>aynı ödeme yöntemine</strong> (ödeme sırasında kullandığınız kredi kartı /
              ödeme aracına) iade edilir. İade işlemi için sizden ek bir masraf tahsil edilmez.
            </p>
            <p className="mt-2">
              İade tutarının kart ekstrenize / hesabınıza yansıma süresi, bankanızın veya ödeme
              kuruluşunun işlem sürelerine bağlı olarak birkaç iş günü sürebilir; bu süre
              SATICI&apos;nın kontrolü dışındadır.
            </p>
          </Bolum>

          <Bolum n="6" baslik="Abonelik İptali">
            <p>
              Aboneliğinizi <strong>istediğiniz zaman</strong> panel üzerinden veya bize başvurarak
              iptal edebilirsiniz.
            </p>
            <ul>
              <li>
                İptal, içinde bulunduğunuz ödenmiş dönemin sonunda yürürlüğe girer; dönem sonuna kadar
                hizmetten yararlanmaya devam edersiniz.
              </li>
              <li>
                İptal sonrası <strong>bir sonraki dönem için ücretlendirilmezsiniz</strong> ve otomatik
                yenileme durdurulur.
              </li>
              <li>
                İptal, geçmiş dönemlere ilişkin bir iade hakkı doğurmaz; yalnızca gelecek dönemlerin
                yenilenmesini durdurur. (14 günlük cayma hakkı kapsamındaki iade koşulları saklıdır.)
              </li>
            </ul>
          </Bolum>

          <Bolum n="7" baslik="Ücretsiz Plan">
            <p>
              {PLANLAR.free.ad} planı ({PLANLAR.free.fiyat}) tamamen ücretsizdir; herhangi bir tahsilat
              yapılmadığından bu plan için iade veya cayma süreci söz konusu değildir. Ücretsiz planı
              istediğiniz zaman kullanmayı bırakabilir veya hesabınızı kapatabilirsiniz.
            </p>
          </Bolum>

          <Bolum n="8" baslik="İstisnai Durumlar ve Adil Uygulama">
            <p>
              Teknik bir arıza, yanlış/mükerrer tahsilat veya SATICI kaynaklı bir hizmet kesintisi
              nedeniyle hizmetten yararlanamadığınız durumlarda, yukarıdaki cayma süresine bakılmaksızın
              adil bir çözüm (kısmi/tam iade veya süre uzatımı) sunmayı taahhüt ederiz. Bu tür
              taleplerinizi{" "}
              <a href={`mailto:${FIRMA.eposta}`} className="font-semibold text-veylify-700">
                {FIRMA.eposta}
              </a>{" "}
              adresine iletebilirsiniz.
            </p>
          </Bolum>

          <Bolum n="9" baslik="Uyuşmazlık Çözümü">
            <p>
              İade ve cayma süreçlerine ilişkin uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca belirlenen
              parasal sınırlar dâhilinde tüketicinin yerleşim yerindeki veya işlemin yapıldığı yerdeki{" "}
              <strong>Tüketici Hakem Heyetleri</strong> ve <strong>Tüketici Mahkemeleri</strong>{" "}
              yetkilidir.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}
