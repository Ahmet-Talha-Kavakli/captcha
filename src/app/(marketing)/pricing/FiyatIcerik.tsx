"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANLAR as PLAN_KAYNAK, ODEME_HAZIR } from "@/lib/specter/plans";
import {
  ArrowRight, Eye, Check, Sparkles, Plus, Minus, ShieldCheck,
  CreditCard, Headphones, RefreshCw, Lock, Coins, Zap,
} from "lucide-react";
import { Badge, Highlight, Reveal } from "@/components/site/primitives";
import { IzgaraArka, Gorsel } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";

export function FiyatIcerik() {
  return (
    <>
      <Hero />
      <Planlar />
      <KrediPaketleri />
      <GuvenSerit />
      <KarsilastirmaTablosu />
      <Sss />
      <FinalCta />
    </>
  );
}

/* ============================================================ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 pb-14 lg:px-8 lg:pt-24">
      <IzgaraArka />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-veylify-200/50 to-violet-200/40 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge variant="indigo">
            <Sparkles className="size-3.5" /> Fiyatlandırma
          </Badge>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-veylify-950 sm:text-[52px]">
            Basit, şeffaf, <Highlight variant="gradient">ölçeklenen</Highlight>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
            Ücretsiz başlayın, büyüdükçe yükseltin. Gizli ücret yok, kredi kartı
            gerekmez, istediğiniz an iptal edebilirsiniz.
          </p>
        </Reveal>
        <Reveal delay={2}>
          <Gorsel ad="fiyat-hero" alt="Veylify fiyatlandırma" oran="4/3" className="mx-auto mt-8 w-full max-w-xs" />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ PLANLAR */
// Sayısal değerler (ad/fiyat/kota/site) backend plans.ts'ten TÜRETİLİR — landing
// müşteriye vaat edilen sözdür ve backend enforcement ile birebir aynı olmalı.
// UI-özel metinler (ozet/cta/özellik açıklamaları) yerinde. plan adı daha önce
// "Kurumsal" idi, plans.ts/panel "Ölçek" ile çelişiyordu — türetme ile çözüldü.
function planSayi(n: number): string {
  return n >= 100000000 ? "Sınırsız" : n.toLocaleString("tr-TR");
}
// Karşılaştırma tablosu için kısaltılmış gösterim (10.000→10K, 1.000.000→1M).
function kisalt(n: number): string {
  if (n >= 100000000) return "Sınırsız";
  if (n >= 1000000) return `${n / 1000000}M`;
  if (n >= 1000) return `${n / 1000}K`;
  return String(n);
}
function Planlar() {
  const f = PLAN_KAYNAK.free, p = PLAN_KAYNAK.pro, s = PLAN_KAYNAK.scale;
  const planlar = [
    {
      ad: f.ad, fiyat: f.fiyat.replace("/ay", ""), period: "/ay", ozet: "Kişisel projeler ve denemeler için", vurgu: false, cta: "Ücretsiz başla",
      kredi: `${planSayi(f.dogrulamaKotasi)} doğrulama kredisi/ay dahil`,
      ozellikler: [`${planSayi(f.dogrulamaKotasi)} doğrulama/ay`, "Ghost-font CAPTCHA", `${f.siteLimiti} site`, "Temel analitik", "Topluluk desteği"],
    },
    {
      ad: p.ad, fiyat: p.fiyat.replace("/ay", ""), period: "/ay", ozet: "Büyüyen ürünler ve ekipler için", vurgu: true, cta: `${p.ad}'yi seç`, odemeli: true,
      kredi: `${planSayi(p.dogrulamaKotasi)} doğrulama kredisi/ay dahil`,
      ozellikler: [`${planSayi(p.dogrulamaKotasi)} doğrulama/ay`, "Tüm savunma katmanları", `${p.siteLimiti} site`, "Kural motoru + görünmez mod", "Coğrafi & ASN istihbaratı", "Webhook & Slack", "Öncelikli destek"],
    },
    {
      ad: s.ad, fiyat: s.fiyat, period: "", ozet: "Yüksek trafik, SLA ve uyum için", vurgu: false, cta: "İletişime geç",
      kredi: "Sınırsız doğrulama kredisi dahil",
      ozellikler: ["Sınırsız doğrulama", "Özel SLA + SSO/SAML", "Sınırsız site", "Adanmış çözüm mühendisi", "On-premise / özel bölge", "Denetim günlükleri & rol yönetimi"],
    },
  ];
  return (
    <section className="px-5 pb-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-3">
          {planlar.map((p, i) => (
            <Reveal key={p.ad} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 transition ${
                  p.vurgu
                    ? "border-veylify-600 bg-white shadow-[0_30px_70px_-30px_rgba(79,70,229,0.5)] ring-1 ring-veylify-600"
                    : "border-veylify-100 bg-white"
                }`}
              >
                {p.vurgu && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-veylify-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <Sparkles className="size-3" /> En popüler
                  </span>
                )}
                <h3 className="text-[15px] font-bold text-veylify-950">{p.ad}</h3>
                <p className="mt-1 text-[13px] text-slate-500">{p.ozet}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-veylify-950">{p.fiyat}</span>
                  <span className="text-[14px] text-slate-400">{p.period}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-veylify-50/70 px-3 py-2 text-[12.5px] font-semibold text-veylify-700 ring-1 ring-veylify-100">
                  <Coins className="size-3.5 shrink-0" /> {p.kredi}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.ozellikler.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-veylify-600" /> {o}
                    </li>
                  ))}
                </ul>
                {"odemeli" in p && p.odemeli && !ODEME_HAZIR ? (
                  <span className="mt-6 inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-veylify-100 px-5 py-3 text-[14px] font-semibold text-veylify-500">
                    Yakında
                  </span>
                ) : (
                  <Link
                    href={p.fiyat === "Özel" ? "/contact" : "/signup"}
                    className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                      p.vurgu
                        ? "bg-veylify-600 text-white hover:bg-veylify-700"
                        : "border border-veylify-200 bg-white text-veylify-700 hover:bg-veylify-50"
                    }`}
                  >
                    {p.cta} <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ KREDİ PAKETLERİ */
// Plan kotasını aşınca ya da kotasız ek doğrulama için satın alınan tek seferlik
// kredi paketleri. Kredi = 1 doğrulama isteği. Fiyatlar makul TL bandında.
function KrediPaketleri() {
  const paketler = [
    { kredi: "10.000", fiyat: "₺249", birim: "≈ ₺0,025 / doğrulama", ozet: "Kısa kampanya artışları için", vurgu: false },
    { kredi: "50.000", fiyat: "₺999", birim: "≈ ₺0,020 / doğrulama", ozet: "Düzenli ek trafik için", vurgu: true, rozet: "En avantajlı" },
    { kredi: "250.000", fiyat: "₺3.999", birim: "≈ ₺0,016 / doğrulama", ozet: "Yoğun dönem ve yüksek hacim", vurgu: false },
  ];
  return (
    <section className="px-5 pt-10 pb-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <Badge variant="indigo">
            <Coins className="size-3.5" /> Ek kredi paketleri
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-veylify-950 sm:text-3xl">
            Kotanı aşınca <Highlight variant="gradient">durma</Highlight>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Her paket tek seferlik satın alınır, süresi dolmaz. 1 kredi = 1 doğrulama.
            Aylık kotan bittiğinde otomatik olarak kredilerinden düşülür.
          </p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {paketler.map((k, i) => (
            <Reveal key={k.kredi} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 transition ${
                  k.vurgu
                    ? "border-veylify-600 bg-white shadow-[0_24px_60px_-30px_rgba(79,70,229,0.45)] ring-1 ring-veylify-600"
                    : "border-veylify-100 bg-white"
                }`}
              >
                {k.rozet && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-veylify-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <Zap className="size-3" /> {k.rozet}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                    <Coins className="size-[18px]" />
                  </span>
                  <div className="text-[15px] font-bold text-veylify-950">{k.kredi} kredi</div>
                </div>
                <p className="mt-3 text-[13px] text-slate-500">{k.ozet}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-veylify-950">{k.fiyat}</span>
                  <span className="text-[13px] text-slate-400">/ tek seferlik</span>
                </div>
                <div className="mt-1 text-[12.5px] font-medium text-veylify-600">{k.birim}</div>
                {ODEME_HAZIR ? (
                  <Link
                    href="/signup"
                    className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                      k.vurgu
                        ? "bg-veylify-600 text-white hover:bg-veylify-700"
                        : "border border-veylify-200 bg-white text-veylify-700 hover:bg-veylify-50"
                    }`}
                  >
                    Kredi satın al <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <span className="mt-6 inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-veylify-200 bg-veylify-50/60 px-5 py-3 text-[14px] font-semibold text-veylify-400">
                    Yakında
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-[13px] text-slate-500">
          Daha büyük hacim mi lazım?{" "}
          <Link href="/contact" className="font-semibold text-veylify-700 hover:text-veylify-800">
            Kurumsal kredi fiyatı için iletişime geç →
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ============================================================ GÜVEN ŞERİT */
function GuvenSerit() {
  const ogeler = [
    { ikon: CreditCard, metin: "Kredi kartı gerekmez" },
    { ikon: RefreshCw, metin: "İstediğin an iptal et" },
    { ikon: Lock, metin: "KVKK / GDPR uyumlu" },
    { ikon: Headphones, metin: "Türkçe destek" },
  ];
  return (
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Gorsel ad="fiyat-basla" alt="Ücretsiz başla" oran="1/1" className="mx-auto mb-6 w-36" />
        <div className="grid gap-3 rounded-2xl border border-veylify-100 bg-veylify-50/40 p-5 sm:grid-cols-4">
          {ogeler.map((o) => (
            <div key={o.metin} className="flex items-center justify-center gap-2.5 text-[13.5px] font-medium text-veylify-950">
              <span className="grid size-8 place-items-center rounded-lg bg-white text-veylify-600 ring-1 ring-veylify-100">
                <o.ikon className="size-[16px]" />
              </span>
              {o.metin}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ KARŞILAŞTIRMA TABLOSU */
type Hucre = boolean | string;
function KarsilastirmaTablosu() {
  const gruplar: { grup: string; satirlar: [string, Hucre, Hucre, Hucre][] }[] = [
    {
      grup: "Kullanım",
      // plans.ts'ten türetilir (tek kaynak) — kısaltılmış (10K/1M) gösterim.
      satirlar: [
        ["Aylık doğrulama", kisalt(PLAN_KAYNAK.free.dogrulamaKotasi), kisalt(PLAN_KAYNAK.pro.dogrulamaKotasi), "Sınırsız"],
        ["Site sayısı", String(PLAN_KAYNAK.free.siteLimiti), String(PLAN_KAYNAK.pro.siteLimiti), "Sınırsız"],
        ["Ekip üyesi", String(PLAN_KAYNAK.free.ekipLimiti), String(PLAN_KAYNAK.pro.ekipLimiti), "Sınırsız"],
      ],
    },
    {
      grup: "Savunma katmanları",
      satirlar: [
        ["Ghost-font CAPTCHA", true, true, true],
        ["Davranış biyometrisi", false, true, true],
        ["Kural motoru + playground", false, true, true],
        ["Görünmez mod", false, true, true],
        ["AI ajan kataloğu (15+)", false, true, true],
        ["Coğrafi & ASN istihbaratı", false, true, true],
        ["TLS parmak izi", false, true, true],
      ],
    },
    {
      grup: "Entegrasyon & analitik",
      satirlar: [
        ["reCAPTCHA uyumlu API", true, true, true],
        ["Webhook & Slack", false, true, true],
        ["Gerçek zamanlı analitik", "Temel", "Gelişmiş", "Gelişmiş"],
        ["Denetim günlükleri", false, false, true],
      ],
    },
    {
      grup: "Destek & uyum",
      satirlar: [
        ["Destek", "Topluluk", "Öncelikli", "Adanmış mühendis"],
        ["SLA", false, false, true],
        ["SSO / SAML", false, false, true],
        ["On-premise seçeneği", false, false, true],
      ],
    },
  ];
  const Hucre = ({ v }: { v: Hucre }) => {
    if (v === true) return <Check className="mx-auto size-5 text-emerald-500" />;
    if (v === false) return <span className="text-slate-300">—</span>;
    return <span className="text-[13px] font-medium text-veylify-950">{v}</span>;
  };
  return (
    <section className="border-y border-veylify-100 bg-veylify-50/30 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="indigo">Karşılaştırma</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Planları yan yana <Highlight variant="gradient">karşılaştır</Highlight>
          </h2>
          <Gorsel ad="fiyat-olcek" alt="Ölçek planı" oran="1/1" className="mx-auto mt-6 w-36" />
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-10 overflow-x-auto">
            <div className="min-w-[640px] overflow-hidden rounded-2xl border border-veylify-100 bg-white">
              {/* başlık */}
              <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr] items-center border-b border-veylify-100 bg-veylify-50/50 px-5 py-4 text-[13px] font-semibold">
                <span className="text-slate-500">Özellik</span>
                <span className="text-center text-slate-600">Başlangıç</span>
                <span className="text-center text-veylify-700">Büyüme</span>
                <span className="text-center text-slate-600">Ölçek</span>
              </div>
              {gruplar.map((g) => (
                <div key={g.grup}>
                  <div className="bg-veylify-50/30 px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-veylify-500">
                    {g.grup}
                  </div>
                  {g.satirlar.map(([ad, a, b, c], i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1.8fr_1fr_1fr_1fr] items-center border-b border-veylify-100/70 px-5 py-3 text-[14px] last:border-0"
                    >
                      <span className="font-medium text-veylify-950">{ad}</span>
                      <span className="text-center"><Hucre v={a} /></span>
                      <span className="text-center"><Hucre v={b} /></span>
                      <span className="text-center"><Hucre v={c} /></span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ SSS (kendi akordeonu) */
function Sss() {
  const sorular = [
    { s: "Ücretsiz plan gerçekten ücretsiz mi?", c: "Evet. Başlangıç planı süresiz ücretsizdir, kredi kartı gerektirmez. Ayda 10.000 doğrulamaya kadar ghost-font korumasını kullanabilirsiniz." },
    { s: "Doğrulama limitini aşarsam ne olur?", c: "Trafiğiniz asla aniden kesilmez. Limite yaklaştığınızda panelden ve e-postayla uyarılırsınız; dilerseniz bir üst plana yükseltirsiniz. Ölçek planında limit yoktur." },
    { s: "Plan değiştirmek kolay mı?", c: "Panelden tek tıkla yükseltip düşürebilirsiniz. Değişiklik anında geçerli olur; ara dönem farkı orantılı hesaplanır." },
    { s: "reCAPTCHA'dan geçiş yapabilir miyim?", c: "Evet. Veylify API'si reCAPTCHA ile uyumludur — çoğu durumda yalnızca siteverify uç noktasını değiştirmeniz yeterli. Ortalama geçiş süresi 10 dakikadır." },
    { s: "Ölçek planında neler farklı?", c: "SLA, SSO/SAML, adanmış çözüm mühendisi, denetim günlükleri, on-premise/özel bölge dağıtımı ve sınırsız kullanım. Fiyat trafiğinize göre şekillenir." },
    { s: "Faturalandırma nasıl işliyor?", c: "Aylık ya da yıllık faturalandırma seçebilirsiniz; yıllık ödemede indirim uygulanır. Tüm ödemeler güvenli ödeme altyapısı üzerinden işlenir." },
  ];
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <Badge variant="indigo">SSS</Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-veylify-950 sm:text-4xl">
            Sık sorulan sorular
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {sorular.map((q, i) => {
            const on = acik === i;
            return (
              <Reveal key={i} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="overflow-hidden rounded-2xl border border-veylify-100 bg-white">
                  <button
                    onClick={() => setAcik(on ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-veylify-950">{q.s}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                      {on ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  {on && <div className="px-6 pb-5 text-[14px] leading-relaxed text-slate-600">{q.c}</div>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ FINAL CTA */
function FinalCta() {
  return (
    <section className="px-5 pb-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-veylify-700 via-veylify-600 to-violet-600 px-8 py-16 text-center shadow-[0_40px_100px_-40px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
          <ShieldCheck className="size-3.5" /> {MARKA.koruniyorTr}
        </span>
        <h2 className="relative mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Bugün ücretsiz başlayın
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Kredi kartı olmadan kurun, ilk botu 10 dakikada durdurun. Büyüdükçe yükseltin.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-veylify-700 transition hover:-translate-y-0.5"
          >
            Ücretsiz başla <ArrowRight className="size-[18px]" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Eye className="size-[18px]" /> Önce demoyu gör
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
