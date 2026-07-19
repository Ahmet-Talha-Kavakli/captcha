import Link from "next/link";
import type { Metadata } from "next";
import { HukukiHero, Bolum, HukukiAltCta } from "@/app/(marketing)/gizlilik/page";
import { MARKA, FIRMA } from "@/lib/marka";
import { PLANLAR } from "@/lib/specter/plans";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "Veylify Mesafeli Satış Sözleşmesi: 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında taraflar, konu, ödeme, ifa, cayma hakkı ve yürürlük hükümleri.",
  alternates: { canonical: `${MARKA.url}/mesafeli-satis` },
};

const GUNCELLEME = "19 Temmuz 2026";

export default function MesafeliSatisPage() {
  return (
    <>
      <HukukiHero
        rozet="Mesafeli Satış"
        baslik="Mesafeli Satış"
        vurgu="Sözleşmesi"
        aciklama={`${MARKA.ad} dijital hizmet aboneliğinin uzaktan (elektronik ortamda) satışına ilişkin, 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında düzenlenmiş sözleşme.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Taraflar">
            <p>
              İşbu Mesafeli Satış Sözleşmesi (&quot;Sözleşme&quot;), aşağıda bilgileri yer alan
              SATICI ile hizmeti elektronik ortamda satın alan ALICI arasında, ALICI&apos;nın{" "}
              {MARKA.domain} üzerinden elektronik ortamda sipariş verdiği anda kurulmuştur.
            </p>
            <p className="mt-2">
              <strong>SATICI (Hizmet Sağlayıcı)</strong>
            </p>
            <ul>
              <li>
                <strong>Unvan:</strong> {FIRMA.unvan}
              </li>
              <li>
                <strong>Adres:</strong> {FIRMA.adres}
              </li>
              <li>
                <strong>Vergi Dairesi:</strong> {FIRMA.vergiDairesi}
              </li>
              <li>
                <strong>Vergi / TC Kimlik No:</strong> {FIRMA.vergiNo}
              </li>
              <li>
                <strong>MERSİS No:</strong> {FIRMA.mersis}
              </li>
              <li>
                <strong>Ticaret Sicil No:</strong> {FIRMA.ticaretSicilNo}
              </li>
              <li>
                <strong>Telefon:</strong> {FIRMA.telefon}
              </li>
              <li>
                <strong>E-posta:</strong>{" "}
                <a href={`mailto:${FIRMA.eposta}`} className="font-semibold text-veylify-700">
                  {FIRMA.eposta}
                </a>
              </li>
              <li>
                <strong>Web Sitesi:</strong>{" "}
                <a href={MARKA.url} className="font-semibold text-veylify-700">
                  {MARKA.domain}
                </a>
              </li>
            </ul>
            <p className="mt-2">
              <strong>ALICI (Tüketici / Müşteri)</strong>
            </p>
            <ul>
              <li>
                Ad-soyad / unvan, e-posta, fatura ve iletişim bilgileri: ALICI tarafından sipariş
                (üyelik / abonelik satın alma) sırasında sisteme girilen ve elektronik ortamda
                kayıt altına alınan bilgilerdir.
              </li>
            </ul>
            <p className="mt-2">
              SATICI ve ALICI, işbu Sözleşme&apos;de tek tek &quot;Taraf&quot;, birlikte
              &quot;Taraflar&quot; olarak anılacaktır.
            </p>
          </Bolum>

          <Bolum n="2" baslik="Konu">
            <p>
              İşbu Sözleşme&apos;nin konusu; ALICI&apos;nın, SATICI&apos;ya ait {MARKA.domain} web
              sitesi üzerinden elektronik ortamda siparişini verdiği, aşağıda nitelik ve satış
              fiyatı belirtilen dijital hizmetin (bot koruma / doğrulama aboneliği) satışı ve ifası
              ile ilgili olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
              Sözleşmeler Yönetmeliği hükümleri uyarınca Tarafların hak ve yükümlülüklerinin
              belirlenmesidir.
            </p>
          </Bolum>

          <Bolum n="3" baslik="Sözleşme Konusu Hizmet, Nitelikleri ve Fiyat">
            <p>
              Sözleşme konusu hizmet, {MARKA.ad} tarafından sunulan yapay zekâ botlarına karşı
              görünmez (ghost-font) doğrulama / bot koruma yazılım hizmetidir. Hizmet, fiziksel bir
              ürün teslimi içermeyen, tamamen elektronik ortamda sunulan bir <strong>dijital
              hizmettir</strong>. Hizmetin temel nitelikleri, kapsamı ve plan bazlı kotaları{" "}
              {MARKA.domain} üzerindeki fiyatlandırma ve ürün sayfalarında güncel olarak yer alır.
            </p>
            <p className="mt-2">Sunulan abonelik planları ve güncel fiyatları:</p>
            <ul>
              <li>
                <strong>{PLANLAR.free.ad} planı — {PLANLAR.free.fiyat}:</strong> Ücretsiz plan.
                Aylık {PLANLAR.free.dogrulamaKotasi.toLocaleString("tr-TR")} doğrulama kotası, temel
                koruma özellikleri. Herhangi bir ücret tahsil edilmez.
              </li>
              <li>
                <strong>{PLANLAR.pro.ad} planı — {PLANLAR.pro.fiyat}:</strong> Aylık abonelik.
                Aylık {PLANLAR.pro.dogrulamaKotasi.toLocaleString("tr-TR")} doğrulama kotası,
                gelişmiş davranışsal analiz, kural motoru, webhook ve API erişimi.
              </li>
              <li>
                <strong>{PLANLAR.scale.ad} planı — {PLANLAR.scale.fiyat}:</strong> Kurumsal ölçekli
                ihtiyaçlar için özel fiyatlandırmalı plan; SSO/SAML, SLA garantisi ve özel model
                dâhil kurumsal özellikler. Fiyat ve koşullar satış görüşmesi ile ayrıca belirlenir.
              </li>
            </ul>
            <p className="mt-2">
              Fiyatlara ilişkin vergiler (KDV vb.) satış anında ödeme ekranında açıkça gösterilir.
              Listelenen tutarlar, aksi belirtilmedikçe ilgili vergiler dâhil şekilde sunulur.
              SATICI, fiyatlarını ileriye dönük olarak değiştirme hakkını saklı tutar; ancak fiyat
              değişikliği, ALICI&apos;nın mevcut/ödenmiş abonelik dönemini etkilemez.
            </p>
          </Bolum>

          <Bolum n="4" baslik="Genel Hükümler">
            <ul>
              <li>
                ALICI, {MARKA.domain} üzerinde Sözleşme konusu hizmetin temel nitelikleri, satış
                fiyatı, ödeme şekli ve ifaya ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve
                elektronik ortamda gerekli teyidi verdiğini beyan eder.
              </li>
              <li>
                ALICI; işbu Sözleşme&apos;yi ve Ön Bilgilendirme Formu&apos;nu elektronik ortamda
                teyit etmekle, mesafeli sözleşmelerin akdinden önce SATICI tarafından ALICI&apos;ya
                verilmesi gereken adres, hizmetin temel özellikleri, fiyat ve ödeme bilgilerinin
                doğru ve eksiksiz olarak edinildiğini teyit etmiş olur.
              </li>
              <li>
                Sözleşme konusu hizmet, ALICI&apos;nın belirttiği e-posta adresine tanımlı hesap
                üzerinden elektronik ortamda ifa edilir.
              </li>
              <li>
                ALICI, hizmetin kullanımı sırasında SATICI&apos;nın{" "}
                <Link href="/terms" className="font-semibold text-veylify-700">
                  Kullanım Koşulları
                </Link>{" "}
                ve{" "}
                <Link href="/gizlilik" className="font-semibold text-veylify-700">
                  Gizlilik Politikası
                </Link>
                &apos;na uymayı kabul eder.
              </li>
              <li>
                18 yaşından küçük kişiler ile ayırt etme gücüne sahip olmayanlar SATICI&apos;dan
                hizmet satın alamaz. ALICI, işbu Sözleşme&apos;yi kabul ederken 18 yaşından büyük ve
                fiil ehliyetine sahip olduğunu beyan eder.
              </li>
            </ul>
          </Bolum>

          <Bolum n="5" baslik="Ödeme Şekli">
            <p>
              Ücretli plan bedelleri, {MARKA.domain} üzerinde sunulan güvenli ödeme altyapısı
              (PayTR sanal POS / kredi kartı) aracılığıyla, çevrim içi olarak tahsil edilir.
              Ödeme işlemleri, ilgili ödeme kuruluşunun güvenli altyapısı üzerinden gerçekleştirilir;
              SATICI, ALICI&apos;nın kart bilgilerini saklamaz.
            </p>
            <ul>
              <li>
                <strong>Aylık abonelik:</strong> {PLANLAR.pro.ad} planı, aksi belirtilmedikçe aylık
                dönemler hâlinde peşin olarak ücretlendirilir ve her dönem başında otomatik yenilenir.
              </li>
              <li>
                ALICI, aboneliğini istediği zaman panel üzerinden iptal edebilir; iptal, bir sonraki
                fatura döneminin başında yürürlüğe girer ve iptal sonrası dönem için ücret tahsil
                edilmez. Ayrıntı için{" "}
                <Link href="/iade" className="font-semibold text-veylify-700">
                  İptal, İade ve Cayma Hakkı Politikası
                </Link>
                &apos;na bakınız.
              </li>
              <li>
                Ödemenin herhangi bir nedenle gerçekleşmemesi/geri çekilmesi hâlinde SATICI,
                ücretli hizmete erişimi askıya alma veya durdurma hakkına sahiptir.
              </li>
            </ul>
          </Bolum>

          <Bolum n="6" baslik="Hizmetin İfası ve Teslimat (Dijital Erişim)">
            <p>
              Sözleşme konusu hizmet dijital nitelikte olduğundan fiziksel bir teslimat söz konusu
              değildir. Ödemenin onaylanmasının ardından ALICI&apos;nın hesabı ve satın alınan plan{" "}
              <strong>anında (en geç birkaç dakika içinde) aktifleştirilir</strong>; ALICI, panel,
              API anahtarları ve ilgili özelliklere derhâl erişim sağlar.
            </p>
            <p className="mt-2">
              İfaya ilişkin ayrıntılı koşullar için{" "}
              <Link href="/teslimat" className="font-semibold text-veylify-700">
                Teslimat ve Hizmet Erişim Koşulları
              </Link>{" "}
              sayfasına bakınız. Erişimde teknik bir sorun yaşanması hâlinde SATICI, ALICI&apos;nın
              başvurusu üzerine sorunu makul süre içinde giderir.
            </p>
          </Bolum>

          <Bolum n="7" baslik="Cayma Hakkı">
            <p>
              ALICI, işbu Sözleşme&apos;nin kurulduğu tarihten itibaren{" "}
              <strong>14 (on dört) gün</strong> içinde, herhangi bir gerekçe göstermeksizin ve cezai
              şart ödemeksizin Sözleşme&apos;den cayma hakkına sahiptir. Cayma hakkının kullanılması
              için bu süre içinde SATICI&apos;ya aşağıda belirtilen iletişim kanallarından yazılı
              olarak veya kalıcı veri saklayıcısı ile (e-posta) bildirimde bulunulması yeterlidir.
            </p>
            <p className="mt-2">
              <strong>ÖNEMLİ — Dijital hizmet istisnası ve ön onay:</strong> 6502 sayılı Kanun ve
              Mesafeli Sözleşmeler Yönetmeliği&apos;nin cayma hakkının istisnalarını düzenleyen
              hükümleri uyarınca; elektronik ortamda anında ifa edilen ve gayrimaddi mallara (dijital
              içerik/hizmet) ilişkin sözleşmelerde, hizmetin ifasına ALICI&apos;nın{" "}
              <strong>onayı ile başlanması hâlinde cayma hakkı kullanılamaz</strong>. ALICI, ücretli
              plana geçişte hizmetin cayma hakkı süresi dolmadan ifasına başlanmasını ve bu durumda
              cayma hakkını kaybedeceğini <strong>açıkça, ön onayla</strong> kabul eder.
            </p>
            <ul>
              <li>
                ALICI, ücretli hizmeti satın aldıktan sonra hizmeti <strong>kullanmaya
                başlamamışsa</strong> (aktifleştirilen dönemde doğrulama/koruma hizmetinden fiilen
                yararlanmamışsa), 14 gün içinde cayma hakkını kullanabilir ve ödediği bedelin tamamı
                iade edilir.
              </li>
              <li>
                ALICI, hizmeti <strong>kullanmaya başladıysa</strong> (yukarıdaki ön onay uyarınca
                ifaya başlanmışsa), dijital hizmet istisnası gereği cayma hakkı düşer. Bu durumda
                ALICI, mevcut dönem sonuna kadar hizmetten yararlanmaya devam eder ve dilerse
                aboneliğini bir sonraki dönem için iptal edebilir.
              </li>
            </ul>
            <p className="mt-2">
              <strong>Cayma bildirimi için iletişim:</strong>
            </p>
            <ul>
              <li>
                E-posta:{" "}
                <a href={`mailto:${FIRMA.eposta}`} className="font-semibold text-veylify-700">
                  {FIRMA.eposta}
                </a>
              </li>
              <li>Adres: {FIRMA.adres}</li>
              <li>Telefon: {FIRMA.telefon}</li>
            </ul>
            <p className="mt-2">
              Geçerli bir cayma bildiriminin SATICI&apos;ya ulaşmasını takip eden{" "}
              <strong>14 (on dört) gün</strong> içinde, tahsil edilen bedel, ALICI&apos;nın ödeme
              sırasında kullandığı ödeme aracına (aynı ödeme yöntemine) ek bir masraf yansıtılmaksızın
              iade edilir.
            </p>
          </Bolum>

          <Bolum n="8" baslik="Cayma Hakkının Kullanılamayacağı Haller">
            <p>
              Mesafeli Sözleşmeler Yönetmeliği&apos;nin ilgili hükümleri uyarınca, aşağıdaki
              durumlarda cayma hakkı kullanılamaz:
            </p>
            <ul>
              <li>
                Elektronik ortamda anında ifa edilen hizmetler ile ALICI&apos;ya anında teslim
                edilen gayrimaddi mallara (dijital içerik/hizmet) ilişkin sözleşmelerde,{" "}
                ALICI&apos;nın onayıyla ifasına başlanan hizmetler.
              </li>
              <li>
                ALICI&apos;nın istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak
                hazırlanan (kurumsal/özel yapılandırılmış) hizmet ve entegrasyonlar.
              </li>
              <li>Mevzuatta cayma hakkı istisnası olarak öngörülen diğer haller.</li>
            </ul>
          </Bolum>

          <Bolum n="9" baslik="Temerrüt Hükümleri">
            <p>
              ALICI, kredi kartı / ödeme aracı ile yapılan ödemelerde temerrüde düşmesi hâlinde,
              kart sahibinin bankası veya ilgili ödeme kuruluşu ile arasındaki sözleşme çerçevesinde
              faiz ve sair yükümlülüklerden sorumlu olacağını kabul eder. Ödemenin gerçekleşmemesi
              hâlinde SATICI, ücretli hizmeti askıya alma veya Sözleşme&apos;yi feshetme hakkına
              sahiptir. Tarafların 6502 sayılı Kanun ve ilgili mevzuattan doğan hakları saklıdır.
            </p>
          </Bolum>

          <Bolum n="10" baslik="Yetkili Mahkeme ve Uyuşmazlık Çözümü">
            <p>
              İşbu Sözleşme&apos;nin uygulanmasından doğabilecek uyuşmazlıklarda, Ticaret
              Bakanlığı&apos;nca her yıl belirlenen parasal sınırlar dâhilinde ALICI&apos;nın
              yerleşim yerindeki veya işlemin yapıldığı yerdeki <strong>Tüketici Hakem Heyetleri</strong>{" "}
              ile <strong>Tüketici Mahkemeleri</strong> yetkilidir. İşbu Sözleşme Türkiye Cumhuriyeti
              hukukuna tabidir.
            </p>
          </Bolum>

          <Bolum n="11" baslik="Yürürlük">
            <p>
              İşbu Sözleşme, ALICI tarafından elektronik ortamda okunup kabul edilerek onaylandığı
              ve siparişin (ücretli plana geçişin) SATICI tarafından teyit edildiği anda yürürlüğe
              girer. Sözleşme, 11 (on bir) maddeden ibaret olup Taraflarca elektronik ortamda
              teyit edilmiştir.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}
