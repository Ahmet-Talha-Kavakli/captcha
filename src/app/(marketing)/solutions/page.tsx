import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Eye, Check, ShoppingCart, FileText, Server, LogIn,
  ShieldCheck, Sparkles, Layers,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka, Gorsel } from "@/components/site/gorseller";
import { VuruStat, OzellikIzgara } from "@/components/site/illustrasyonlar";
import { MARKA } from "@/lib/marka";

export const metadata: Metadata = {
  title: "Çözümler",
  description:
    "E-ticaret, içerik siteleri, API/SaaS ve login sayfaları için Veylify çözümleri: fiyat kazıma, AI eğitim-verisi hırsızlığı, kimlik doldurma ve DDoS'a karşı koruma.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: `Çözümler — ${MARKA.ad}`,
    description:
      "E-ticaret, içerik, API/SaaS ve login sayfaları için: fiyat kazıma, AI veri hırsızlığı ve kimlik doldurmaya karşı koruma.",
    url: `${MARKA.url}/solutions`,
    type: "website",
    locale: "tr_TR",
    siteName: MARKA.ad,
  },
};

export default function CozumlerPage() {
  return (
    <>
      <Hero />
      <MetrikSerit />
      <Senaryolar />
      <HerkesIcin />
      <FinalCta />
    </>
  );
}

/* ============================================================ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-16 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal>
            <Badge variant="indigo">
              <ShieldCheck className="size-3.5" /> Çözümler
            </Badge>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
              Her sektörün <Highlight variant="gradient">kendi bot problemi</Highlight> var
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
              E-ticaret fiyatını korur, içerik siteni AI hırsızlığından savunur, API'ni
              kimlik doldurmadan korur. Veylify aynı platformda her senaryoya uyarlanır —
              tek entegrasyon, sana özel politikalar.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700"
              >
                Ücretsiz başla <ArrowRight className="size-[18px]" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-veylify-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:border-veylify-300 hover:bg-veylify-50"
              >
                <Eye className="size-[18px]" /> Canlı demo
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={2} className="zn-float">
          {/* clay leopar — sektöre özel çözümler; krem zeminle dikişsiz */}
          <Gorsel ad="cozum-leopar" alt="Veylify sektör çözümleri" oran="4/3" oncelik />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ METRİK ŞERİT */
function MetrikSerit() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Sektörden bağımsız, ölçülü sonuç
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-4">
          <Reveal delay={1}><VuruStat deger="%40" etiket="tipik trafikte bot payı" /></Reveal>
          <Reveal delay={2}><VuruStat deger="%98" etiket="kazıma girişimi engellendi" /></Reveal>
          <Reveal delay={3}><VuruStat deger="%99.4" etiket="gerçek kullanıcı geçiş oranı" /></Reveal>
          <Reveal delay={4}><VuruStat deger="48ms" etiket="karar başına gecikme" /></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- yeniden kullanılabilir senaryo bloğu ---------- */
function Senaryo({
  ikon: Ikon, etiket, baslik, vurgu, problem, cozumler, metrikler, gorsel, sagda = false,
}: {
  ikon: typeof ShoppingCart;
  etiket: string;
  baslik: string;
  vurgu: string;
  problem: string;
  cozumler: string[];
  metrikler: [string, string][];
  gorsel?: string;
  sagda?: boolean;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <Reveal className={sagda ? "lg:order-2" : ""}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-veylify-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-veylify-700 ring-1 ring-veylify-100">
          <Ikon className="size-3.5" /> {etiket}
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
          {baslik} <Highlight variant="gradient">{vurgu}</Highlight>
        </h3>
        {/* problem kartı */}
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <div className="text-[12px] font-bold uppercase tracking-wide text-red-600">Problem</div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-red-900/80">{problem}</p>
        </div>
        {/* çözüm listesi */}
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
          <div className="text-[12px] font-bold uppercase tracking-wide text-emerald-700">Veylify çözümü</div>
          <ul className="mt-2.5 space-y-2.5">
            {cozumler.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                <Check className="mt-0.5 size-[18px] shrink-0 text-emerald-600" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal delay={1} className={sagda ? "lg:order-1" : ""}>
        <div className="rounded-3xl border border-veylify-100 bg-gradient-to-br from-veylify-50/70 to-[#f4f1ea]/50 p-6 shadow-[0_24px_64px_-32px_rgba(79,70,229,0.3)]">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-veylify-600 shadow-[0_12px_28px_-14px_rgba(79,70,229,0.5)] ring-1 ring-veylify-100">
              <Ikon className="size-6" />
            </span>
            <div>
              <div className="text-[13px] font-bold text-veylify-950">{etiket}</div>
              <div className="text-[11.5px] text-slate-500">gerçek dünya etkisi</div>
            </div>
          </div>
          {gorsel && (
            <div className="mb-4 rounded-2xl bg-[#f4f1ea] p-4 ring-1 ring-veylify-100/70">
              <Gorsel ad={gorsel} alt={etiket} oran="1/1" className="mx-auto w-full max-w-[220px]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {metrikler.map(([d, e]) => (
              <VuruStat key={e} deger={d} etiket={e} />
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ============================================================ SENARYOLAR */
function Senaryolar() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-24">
        <Senaryo
          ikon={ShoppingCart}
          etiket="E-ticaret"
          baslik="Fiyat ve envanter kazımasını"
          vurgu="durdur"
          problem="Rakipler ve fiyat-botları katalogunuzu saniyeler içinde tarayıp dinamik fiyat ve stok bilgisini çalıyor. Kampanya stratejiniz daha yayınlanmadan sızıyor."
          cozumler={[
            "Ürün ve arama uç noktalarına kural motorlu hız sınırı",
            "Datacenter/VPN kaynaklı toplu tarama trafiğini engelle",
            "Ghost-font ile otomatik sepet ve stok-takip botlarını yaka",
            "Gerçek alıcının deneyimini hiç bozmadan koruma",
          ]}
          gorsel="cozum-eticaret"
          metrikler={[["%98", "kazıma engellendi"], ["-%40", "sunucu yükü"]]}
        />
        <Senaryo
          sagda
          ikon={FileText}
          etiket="İçerik siteleri"
          baslik="İçeriğini AI eğitim-verisi"
          vurgu="hırsızlığından koru"
          problem="GPTBot, ClaudeBot ve CCBot gibi crawler'lar makalelerinizi izniniz olmadan indirip AI modellerine eğitim verisi yapıyor. Emeğiniz, sizin bilginiz dışında ticarileştiriliyor."
          cozumler={[
            "15+ AI crawler'ı UA + TLS imzasıyla tanı ve engelle",
            "Hangi ajana izin vereceğini kural motoruyla sen seç",
            "Toplu içerik indirme desenlerini davranışla yakala",
            "robots.txt'nin ötesinde, gerçekten uygulanan koruma",
          ]}
          gorsel="cozum-icerik"
          metrikler={[["15+", "engellenen crawler"], ["%100", "OCR körlüğü"]]}
        />
        <Senaryo
          ikon={Server}
          etiket="API / SaaS"
          baslik="Kimlik doldurma ve DDoS'a"
          vurgu="karşı durur"
          problem="Herkese açık API'niz credential stuffing, hesap oluşturma spam'i ve hacimsel saldırıların hedefi. Her sahte istek para ve itibar yakıyor."
          cozumler={[
            "Uç nokta bazlı akıllı hız sınırı ve ani-artış tespiti",
            "reCAPTCHA uyumlu API ile mevcut akışa sorunsuz geçiş",
            "Botnet ve kötü amaçlı ASN trafiğini kaynağında ele",
            "Görünmez mod: gerçek istemciler hiç yavaşlamaz",
          ]}
          metrikler={[["%99", "sahte istek elendi"], ["48ms", "ek gecikme"]]}
        />
        <Senaryo
          sagda
          ikon={LogIn}
          etiket="Login sayfaları"
          baslik="Hesap devralmayı"
          vurgu="girişte kes"
          problem="Login formunuz otomatik deneme-yanılma ve çalıntı parola listeleriyle bombardımana tutuluyor. Klasik CAPTCHA'yı AI ajanları çoktan geçiyor."
          cozumler={[
            "Ghost-font: AI'nın okuyamadığı görsel doğrulama katmanı",
            "Davranış biyometrisiyle insan-bot ayrımı",
            "Şüpheli giriş denemelerinde adaptif challenge",
            "Meşru kullanıcı için sürtünmesiz, tek tık giriş",
          ]}
          metrikler={[["%97", "brute-force engellendi"], ["%99.4", "insan geçişi"]]}
        />
      </div>
    </section>
  );
}

/* ============================================================ HERKES İÇİN */
function HerkesIcin() {
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">
            <Layers className="size-3.5" /> Tek platform
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Farklı problemler, <Highlight variant="gradient">aynı savunma</Highlight>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            Sektörünüz ne olursa olsun aynı sekiz katmanı miras alırsınız; kural motoruyla
            yalnızca politikayı kendi ihtiyacınıza göre şekillendirirsiniz.
          </p>
        </Reveal>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          <Reveal><OzellikIzgara /></Reveal>
          <Reveal delay={1}>
            <ul className="space-y-4">
              {[
                ["Tek entegrasyon", "Bir kez kur, her senaryoya uygula — ayrı ürün almana gerek yok."],
                ["Kurala bağlı esneklik", "Aynı motor e-ticarette hız sınırı, içerikte crawler bloğu olur."],
                ["Ölçekten bağımsız", "Kişisel blog ya da milyonlarca istekli SaaS — aynı 48ms."],
                ["Türkçe destek & KVKK", "Yerli ekip, KVKK/GDPR uyumlu stateless doğrulama."],
              ].map(([b, m]) => (
                <li key={b} className="flex gap-3 rounded-2xl border border-veylify-100 bg-white p-4">
                  <Check className="mt-0.5 size-5 shrink-0 text-veylify-600" />
                  <div>
                    <div className="text-[15px] font-bold text-veylify-950">{b}</div>
                    <div className="mt-0.5 text-[13.5px] leading-relaxed text-slate-600">{m}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ FINAL CTA */
function FinalCta() {
  return (
    <section className="px-5 py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sizin senaryonuz için hazırız
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Hangi sektörde olursanız olun, botları durdurup gerçek kullanıcıyı geçiren
          korumayı 10 dakikada kurun.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Sparkles className="size-[18px]" /> Fiyatları gör
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
