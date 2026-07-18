import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, Lock, Server, KeyRound, FileCheck2, Bug, Mail, ArrowRight,
  ScrollText, Network, Eye,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";

const GUVENLIK_EPOSTA = `guvenlik@${MARKA.domain}`;

export const metadata: Metadata = {
  title: "Güvenlik",
  description:
    "Veylify güvenlik yaklaşımı: veri şifreleme, altyapı güvenliği, uyumluluk (SOC 2, ISO 27001, KVKK) ve sorumlu açıklama programı.",
  alternates: { canonical: "/guvenlik" },
  openGraph: {
    title: `Güvenlik — ${MARKA.ad}`,
    description: "Veri şifreleme, altyapı güvenliği, uyumluluk ve sorumlu açıklama programımız.",
    url: `${MARKA.url}/guvenlik`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function GuvenlikPage() {
  return (
    <>
      <Hero />
      <Katmanlar />
      <Uyumluluk />
      <SorumluAciklama />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-12 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge variant="indigo">
            <ShieldCheck className="size-3.5" /> Güvenlik
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            Güvenlik <Highlight variant="gradient">işimizin merkezinde</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            Bir güvenlik ürünü olarak kendi altyapımızı en yüksek standartlarda koruruz.
            Verilerinizi şifreler, erişimi sınırlar ve düzenli olarak denetleriz.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Katmanlar() {
  const kartlar = [
    { ikon: Lock, baslik: "Uçtan uca şifreleme", metin: "Tüm veri aktarımı TLS 1.2+ ile şifrelenir; beklemede veriler AES-256 ile korunur." },
    { ikon: Server, baslik: "Sağlamlaştırılmış altyapı", metin: "İzole ortamlar, en az yetki ilkesi ve ağ seviyesinde segmentasyonla korunan altyapı." },
    { ikon: KeyRound, baslik: "Erişim denetimi", metin: "Rol tabanlı yetkilendirme, zorunlu 2FA ve tüm hassas işlemler için denetim kaydı." },
    { ikon: Eye, baslik: "Veri minimizasyonu", metin: "Doğrulama akışı stateless çalışır; yalnızca gereken sinyaller, gereken süre kadar işlenir." },
    { ikon: Network, baslik: "İzleme ve tespit", metin: "7/24 anomali izleme, hız sınırlama ve otomatik tehdit tespiti ile sürekli gözetim." },
    { ikon: FileCheck2, baslik: "Yedekleme ve süreklilik", metin: "Düzenli, şifreli yedekler ve test edilmiş kurtarma planlarıyla iş sürekliliği." },
  ];
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Çok katmanlı <Highlight variant="gradient">savunma</Highlight>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Verilerinizi korumak için teknik ve idari tedbirleri birlikte uygularız.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kartlar.map((k, i) => (
            <Reveal key={k.baslik} delay={(((i % 3) + 1) as 1 | 2 | 3)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-25px_rgba(79,70,229,0.3)]">
                <span className="grid size-11 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                  <k.ikon className="size-5" />
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-veylify-950">{k.baslik}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{k.metin}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Uyumluluk() {
  const rozetler = [
    { kod: "SOC 2", durum: "Type II hedefliyoruz", metin: "Güvenlik, erişilebilirlik ve gizlilik kontrolleri için denetim sürecine hazırlanıyoruz." },
    { kod: "ISO 27001", durum: "Uyum yolunda", metin: "Bilgi güvenliği yönetim sistemimizi ISO 27001 çerçevesine göre yapılandırıyoruz." },
    { kod: "KVKK", durum: "Uyumlu", metin: "6698 sayılı Kanun'a uygun; stateless mimari ve veri minimizasyonu tasarımın parçası." },
    { kod: "GDPR", durum: "Uyumlu", metin: "AB Genel Veri Koruma Tüzüğü ilkeleriyle uyumlu veri işleme yaklaşımı." },
  ];
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <ScrollText className="size-3.5" /> Uyumluluk
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Standartlara <Highlight variant="gradient">bağlıyız</Highlight>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Uyumluluk sürekli bir yolculuktur. Aşağıda mevcut durumumuzu şeffafça paylaşıyoruz.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {rozetler.map((r, i) => (
            <Reveal key={r.kod} delay={(((i % 2) + 1) as 1 | 2)}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-veylify-100 bg-white p-6">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-veylify-500 to-violet-500 text-[13px] font-extrabold text-white">
                  {r.kod.split(" ")[0]}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-bold text-veylify-950">{r.kod}</h3>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                      {r.durum}
                    </span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{r.metin}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SorumluAciklama() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <Badge variant="indigo">
            <Bug className="size-3.5" /> Sorumlu Açıklama
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Güvenlik açığı mı buldunuz?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
            Güvenlik araştırmacılarının katkısına değer veririz. Bir zafiyet keşfettiyseniz,
            sorumlu açıklama (responsible disclosure) ilkeleri çerçevesinde bizimle paylaşın.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-veylify-100 bg-white p-6">
              <h3 className="text-[15px] font-bold text-veylify-950">Nasıl bildirilir?</h3>
              <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-slate-600 [&_li]:flex [&_li]:gap-2">
                <li><span className="text-veylify-500">•</span> Bulgunuzu, tekrar üretim adımlarıyla birlikte ayrıntılı biçimde iletin.</li>
                <li><span className="text-veylify-500">•</span> Düzeltme için bize makul bir süre tanıyın; açığı kamuya açıklamadan önce bekleyin.</li>
                <li><span className="text-veylify-500">•</span> Kullanıcı verisine erişmeyin, hizmeti aksatmayın, veri sızdırmayın.</li>
                <li><span className="text-veylify-500">•</span> İyi niyetli araştırmalara yasal işlem başlatmayız.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="flex h-full flex-col rounded-2xl border border-veylify-100 bg-white p-6">
              <h3 className="text-[15px] font-bold text-veylify-950">Ödül programı</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">
                Geçerli ve daha önce bildirilmemiş güvenlik açıkları için, etkisine göre teşekkür
                ve ödül (bug bounty) sunuyoruz. Değerlendirme, açığın ciddiyetine ve kalitesine
                göre yapılır.
              </p>
              <a
                href={`mailto:${GUVENLIK_EPOSTA}`}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-6 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-veylify-700"
              >
                <Mail className="size-4" /> {GUVENLIK_EPOSTA}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Güvenliğe önem veren bir korumayla çalışın
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Verilerinizi şifreleyen, gizliliğinizi koruyan ve botları durduran katmanı bugün kurun.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/gizlilik"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Lock className="size-[18px]" /> Gizlilik Politikası
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
