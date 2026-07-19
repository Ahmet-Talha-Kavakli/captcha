import Link from "next/link";
import type { Metadata } from "next";
import { Shield, ArrowRight } from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Veylify gizlilik politikası: hangi verileri topladığımız, çerezler, saklama süreleri, üçüncü taraflar ve haklarınız hakkında ayrıntılı bilgi.",
};

const GUNCELLEME = "19 Temmuz 2026";

export default function GizlilikPage() {
  return (
    <>
      <HukukiHero
        rozet="Gizlilik"
        baslik="Gizlilik"
        vurgu="Politikası"
        aciklama={`${MARKA.ad} olarak gizliliğinize saygı duyuyoruz. Bu politika, hizmetlerimizi kullanırken hangi verilerin işlendiğini ve haklarınızı açıklar.`}
      />
      <div className="px-5 py-16 lg:px-8">
        <article className="prose-hukuki mx-auto max-w-3xl">
          <p className="text-[13px] text-slate-400">Son güncelleme: {GUNCELLEME}</p>

          <Bolum n="1" baslik="Kapsam">
            <p>
              Bu Gizlilik Politikası, {MARKA.ad} ({MARKA.domain}) web sitesini ve doğrulama
              hizmetlerini kullanan ziyaretçiler, hesap sahipleri ve müşterilerin işlenen
              kişisel verilerini kapsar. Hizmetimizi kullanarak bu politikada açıklanan
              uygulamaları kabul etmiş olursunuz.
            </p>
          </Bolum>

          <Bolum n="2" baslik="Topladığımız Veriler">
            <p>Aşağıdaki veri kategorilerini, yalnızca gerekli olduğu ölçüde işleriz:</p>
            <ul>
              <li>
                <strong>Hesap verileri:</strong> Ad, e-posta adresi, şifrelenmiş parola ve
                (varsa) şirket bilgisi.
              </li>
              <li>
                <strong>Kullanım verileri:</strong> Panel içi işlemler, tercih ayarları ve
                talep kayıtları.
              </li>
              <li>
                <strong>Doğrulama sinyalleri:</strong> Bot tespiti için IP adresi, tarayıcı/UA
                bilgisi, TLS parmak izi ve davranış sinyalleri. Bu sinyaller karar anında
                değerlendirilir; doğrulama akışımız stateless çalışır ve kişisel profilleme
                amacı taşımaz.
              </li>
              <li>
                <strong>İletişim verileri:</strong> İletişim formu veya destek talepleriyle
                bize ilettiğiniz bilgiler.
              </li>
            </ul>
          </Bolum>

          <Bolum n="3" baslik="Verileri Kullanma Amaçlarımız">
            <ul>
              <li>Hizmeti sunmak, hesabınızı yönetmek ve doğrulama kararları üretmek.</li>
              <li>Botları tespit edip engellemek ve hizmet güvenliğini sağlamak.</li>
              <li>Destek taleplerinizi yanıtlamak ve sizinle iletişim kurmak.</li>
              <li>Hizmet performansını ölçmek ve iyileştirmek.</li>
              <li>Yasal yükümlülüklere uymak.</li>
            </ul>
          </Bolum>

          <Bolum n="4" baslik="Çerezler ve Benzer Teknolojiler">
            <p>
              Web sitemizde ve panelimizde çerezler ve benzeri teknolojiler kullanırız. Çerezleri
              amaçlarına göre üç kategoride ele alırız:
            </p>
            <ul>
              <li>
                <strong>Zorunlu çerezler:</strong> Oturum yönetimi, kimlik doğrulama ve temel
                işlevsellik için gereklidir; devre dışı bırakılamaz. Bu çerezler olmadan giriş
                yapma ve panel kullanımı gibi temel işlevler çalışmaz.
              </li>
              <li>
                <strong>Tercih çerezleri:</strong> Dil seçimi gibi tercihlerinizi hatırlar.
              </li>
              <li>
                <strong>Analitik çerezler:</strong> Hizmeti iyileştirmek amacıyla
                anonimleştirilmiş kullanım istatistikleri toplar (bkz. Üçüncü Taraf Hizmetler —
                Google Analytics).
              </li>
            </ul>
            <p>
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz; ancak zorunlu
              çerezlerin devre dışı bırakılması bazı işlevleri etkileyebilir.
            </p>
          </Bolum>

          <Bolum n="5" baslik="Saklama Süreleri">
            <p>
              Kişisel verileri, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatın
              öngördüğü yasal saklama süreleri kadar muhafaza ederiz. Hesap verileri, hesabınız
              aktif olduğu sürece; doğrulama sinyalleri ise yalnızca güvenlik analizinin
              gerektirdiği kısa süre boyunca saklanır. Süre sonunda veriler silinir veya geri
              döndürülemez biçimde anonimleştirilir.
            </p>
          </Bolum>

          <Bolum n="6" baslik="Üçüncü Taraf Hizmetler ve Paylaşım">
            <p>
              Kişisel verilerinizi satmayız. Hizmetin sunulabilmesi için, veri işleyen sıfatıyla
              ve sözleşmeyle bağlı olarak aşağıdaki güvenilir üçüncü taraf hizmet sağlayıcılarla
              yalnızca gerekli ölçüde veri paylaşırız:
            </p>
            <ul>
              <li>
                <strong>Clerk:</strong> Kullanıcı kimlik doğrulama ve hesap yönetimi altyapısı
                (e-posta, oturum bilgileri).
              </li>
              <li>
                <strong>PayTR:</strong> Ücretli plan ödemelerinin güvenli biçimde alınması için
                ödeme altyapısı. Kart bilgileriniz PayTR’nin PCI-DSS uyumlu ortamında işlenir;
                tam kart verisi tarafımızca saklanmaz.
              </li>
              <li>
                <strong>Google Analytics:</strong> Anonimleştirilmiş kullanım istatistikleri ve
                site performans ölçümü.
              </li>
              <li>
                Hizmetin çalışması için gerekli barındırma ve altyapı sağlayıcıları.
              </li>
            </ul>
            <p>Bunların dışında verilerinizi yalnızca şu durumlarda paylaşabiliriz:</p>
            <ul>
              <li>Yasal bir yükümlülük veya yetkili makam talebi bulunduğunda.</li>
              <li>Açık rızanızın olduğu durumlarda.</li>
            </ul>
          </Bolum>

          <Bolum n="7" baslik="Veri Güvenliği">
            <p>
              Verilerinizi korumak için aktarımda TLS şifrelemesi, beklemede şifreleme, erişim
              denetimi ve düzenli güvenlik incelemeleri dâhil teknik ve idari tedbirler
              uygularız. Ayrıntı için{" "}
              <Link href="/security" className="font-semibold text-veylify-700">
                Güvenlik
              </Link>{" "}
              sayfamıza bakın.
            </p>
          </Bolum>

          <Bolum n="8" baslik="Haklarınız">
            <p>
              Kişisel verilerinize ilişkin olarak; erişim, düzeltme, silme, işlemeyi kısıtlama,
              itiraz ve veri taşınabilirliği haklarına sahipsiniz. KVKK kapsamındaki haklarınızın
              ayrıntısı için{" "}
              <Link href="/kvkk" className="font-semibold text-veylify-700">
                KVKK Aydınlatma Metni
              </Link>{" "}
              sayfamızı inceleyebilirsiniz.
            </p>
          </Bolum>

          <Bolum n="9" baslik="Değişiklikler">
            <p>
              Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde sizi
              bilgilendiririz; güncel sürüm her zaman bu sayfada yayımlanır.
            </p>
          </Bolum>

          <Bolum n="10" baslik="İletişim">
            <p>
              Gizlilikle ilgili her türlü soru ve talebiniz için{" "}
              <a href={`mailto:${MARKA.destekEposta}`} className="font-semibold text-veylify-700">
                {MARKA.destekEposta}
              </a>{" "}
              adresine yazabilir veya{" "}
              <Link href="/contact" className="font-semibold text-veylify-700">
                iletişim formumuzu
              </Link>{" "}
              kullanabilirsiniz.
            </p>
          </Bolum>
        </article>

        <HukukiAltCta />
      </div>
    </>
  );
}

/* ============================================================ Ortak parçalar */

export function HukukiHero({
  rozet,
  baslik,
  vurgu,
  aciklama,
}: {
  rozet: string;
  baslik: string;
  vurgu: string;
  aciklama: string;
}) {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-10 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge variant="indigo">
            <Shield className="size-3.5" /> {rozet}
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-tight text-veylify-950 sm:text-[48px]">
            {baslik} <Highlight variant="gradient">{vurgu}</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-600">
            {aciklama}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Bolum({
  n,
  baslik,
  children,
}: {
  n: string;
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="section" className="mt-10 scroll-mt-24">
      <h2 className="flex items-baseline gap-3 text-[20px] font-extrabold tracking-tight text-veylify-950">
        <span className="text-[15px] font-mono text-veylify-400">{n}.</span>
        {baslik}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-600 [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </Reveal>
  );
}

export function HukukiAltCta() {
  return (
    <Reveal className="mx-auto mt-14 flex max-w-3xl flex-col items-start justify-between gap-4 rounded-2xl border border-veylify-100 bg-veylify-50/40 p-6 sm:flex-row sm:items-center">
      <div>
        <div className="text-[15px] font-bold text-veylify-950">Sorunuz mu var?</div>
        <div className="mt-0.5 text-[13.5px] text-slate-600">
          Ekibimiz yasal ve gizlilik sorularınızı yanıtlamaktan mutluluk duyar.
        </div>
      </div>
      <Link
        href="/contact"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-veylify-600 px-6 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-veylify-700"
      >
        Bize ulaşın <ArrowRight className="size-4" />
      </Link>
    </Reveal>
  );
}
