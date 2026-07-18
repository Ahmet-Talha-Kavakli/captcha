import Link from "next/link";
import type { Metadata } from "next";
import {
  Mail, MessageSquare, Clock, LifeBuoy, Building2, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";
import { IletisimForm } from "./IletisimForm";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Veylify ekibiyle iletişime geçin. Satış, teknik destek veya iş birliği talepleriniz için formu doldurun; iş günü içinde 24 saatte yanıt veriyoruz.",
};

export default function IletisimPage() {
  return (
    <>
      <Hero />
      <IcerikBolum />
      <SssKisa />
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
            <MessageSquare className="size-3.5" /> İletişim
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            Sizi <Highlight variant="gradient">dinliyoruz</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
            Satış, teknik destek, entegrasyon ya da iş birliği — her ne olursa olsun ekibimiz
            sorunuza gerçek bir yanıt verir. Formu doldurun, size 24 saat içinde dönelim.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function IcerikBolum() {
  return (
    <section className="px-5 py-14 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Sol: iletişim kanalları */}
        <Reveal className="space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950">
            Bize ulaşın
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-600">
            En hızlı yanıt için formu kullanın. Aciliyet durumunda destek e-postamıza doğrudan
            yazabilirsiniz.
          </p>

          <div className="mt-6 space-y-3">
            <KanalKart
              ikon={Mail}
              baslik="Destek e-postası"
              deger={MARKA.destekEposta}
              href={`mailto:${MARKA.destekEposta}`}
              alt="Teknik ve genel sorular için"
            />
            <KanalKart
              ikon={LifeBuoy}
              baslik="Yardım merkezi"
              deger="Panel içi canlı asistan"
              href="/panel"
              alt="Hesabınızdaki Veylify Zeka asistanı"
            />
            <KanalKart
              ikon={Building2}
              baslik="Merkez"
              deger="İstanbul, Türkiye"
              alt="Uzaktan çalışan, İstanbul merkezli ekip"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-veylify-100 bg-veylify-50/40 p-5">
            <div className="flex items-center gap-2 text-[13px] font-bold text-veylify-700">
              <Clock className="size-4" /> Yanıt süresi vaadimiz
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Tüm mesajlara <strong>iş günü içinde en geç 24 saatte</strong> dönüş yaparız.
              Ölçek planında özel destek kanalı ve daha hızlı SLA sunulur.
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-veylify-100 bg-white p-4 text-[13px] text-slate-500">
            <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-veylify-600" />
            Paylaştığınız bilgiler yalnızca talebinizi yanıtlamak için kullanılır; üçüncü
            taraflarla paylaşılmaz. Ayrıntı için{" "}
            <Link href="/gizlilik" className="font-semibold text-veylify-700 underline underline-offset-2">
              Gizlilik Politikası
            </Link>
            .
          </div>
        </Reveal>

        {/* Sağ: form */}
        <Reveal delay={1}>
          <div className="rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/60 to-white p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)] sm:p-8">
            <h3 className="text-[17px] font-extrabold text-veylify-950">Mesaj gönderin</h3>
            <p className="mt-1 mb-6 text-[13.5px] text-slate-500">
              Alanları doldurun; en kısa sürede size dönüş yapalım.
            </p>
            <IletisimForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function KanalKart({
  ikon: Ikon,
  baslik,
  deger,
  href,
  alt,
}: {
  ikon: typeof Mail;
  baslik: string;
  deger: string;
  href?: string;
  alt: string;
}) {
  const ic = (
    <div className="flex items-center gap-3.5 rounded-2xl border border-veylify-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(79,70,229,0.35)]">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
        <Ikon className="size-[19px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{baslik}</div>
        <div className="truncate text-[15px] font-bold text-veylify-950">{deger}</div>
        <div className="text-[12.5px] text-slate-500">{alt}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{ic}</Link> : ic;
}

function SssKisa() {
  const sorular: [string, string][] = [
    [
      "Deneme için kredi kartı gerekiyor mu?",
      "Hayır. Ücretsiz planla kart bilgisi vermeden başlayabilir, kurulumun tamamını test edebilirsiniz.",
    ],
    [
      "Ölçek / özel fiyat teklifi alabilir miyim?",
      "Evet. Yüksek hacimli veya özel SLA ihtiyaçlarınız için formda konuya “Ölçek” yazmanız yeterli.",
    ],
    [
      "Entegrasyon desteği veriyor musunuz?",
      "Panel içi dokümanlar ve canlı asistanın yanı sıra, ekibimiz entegrasyon sürecinde size eşlik eder.",
    ],
    [
      "Verilerim nerede tutuluyor?",
      "Doğrulama akışı stateless çalışır ve KVKK/GDPR uyumludur. Ayrıntı için Gizlilik ve KVKK sayfalarına bakın.",
    ],
  ];
  return (
    <section className="border-t border-veylify-100 bg-veylify-50/30 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Sık sorulan sorular
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sorular.map(([s, c], i) => (
            <Reveal key={s} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
              <div className="h-full rounded-2xl border border-veylify-100 bg-white p-5">
                <h3 className="text-[15px] font-bold text-veylify-950">{s}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{c}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
          >
            Ücretsiz hesap oluştur <ArrowRight className="size-[18px]" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
