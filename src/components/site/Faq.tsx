"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Highlight, Badge, Reveal } from "./primitives";

export const SORULAR = [
  {
    s: "Ghost-font tam olarak nasıl çalışıyor?",
    c: "Kod, hareketli nokta gürültüsüne (temporal dithering) gömülür. Her karede metin bölgesi ile arka plan aynı istatistiksel yoğunluktadır — tek bir kareye bakan OCR/vision modeli sadece rastgele gürültü görür. İnsan görme sistemi ise kareler arası tutarlı titreşimi yakalayıp harfleri okur. Sır tek karede değil, harekettedir.",
  },
  {
    s: "AI ekran görüntüsü alıp video olarak analiz edemez mi?",
    c: "Çok sayıda kareyi zaman içinde hizalayıp analiz etmek, tek bir OCR çağrısından kat kat pahalı ve kırılgandır. Üstüne davranışsal analiz + kural motoru eklendiğinde, botun hem görsel çözümü hem de insan-benzeri etkileşimi taklit etmesi gerekir — bu, otomasyonun ekonomisini bozar.",
  },
  {
    s: "reCAPTCHA'dan geçiş zor mu?",
    c: "Hayır. Veylify API'si reCAPTCHA ile uyumludur: frontend'e bir div + script, backend'de /siteverify çağrısı. Mevcut doğrulama akışını neredeyse hiç değiştirmeden geçebilirsin. Ortalama entegrasyon süresi 10 dakikadır.",
  },
  {
    s: "Görünmez mod gerçek kullanıcıları yorar mı?",
    c: "Tam tersi. Görünmez modda davranış skoru yüksek kullanıcılar hiç CAPTCHA görmez — sürtünmesiz geçer. Yalnızca şüpheli davranış sergileyen istekler ghost-font challenge'a düşer. Bu, reCAPTCHA v3 / Turnstile mantığının Veylify karşılığıdır.",
  },
  {
    s: "Kullanıcı verisi üçüncü taraflara gönderiliyor mu?",
    c: "Hayır. Doğrulama HMAC imzalı stateless token'larla yapılır; challenge cevabı asla düz metin olarak ağda gezmez. KVKK/GDPR uyumlu, Türkçe destekli bir altyapı sunuyoruz.",
  },
  {
    s: "Erişilebilirlik (accessibility) ne olacak?",
    c: "Ghost-font görsel bir challenge olduğu için, görünmez mod çoğu meşru kullanıcıyı hiç challenge'a sokmaz. Ayrıca yol haritamızda ekran okuyucu uyumlu sesli-alternatif doğrulama bulunuyor.",
  },
];

export function Faq() {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="text-center">
          <Reveal>
            <Badge variant="indigo">SSS</Badge>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-veylify-950 sm:text-4xl">
              Sık sorulan <Highlight variant="gradient">sorular</Highlight>
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 space-y-3">
          {SORULAR.map((q, i) => {
            const on = acik === i;
            return (
              <Reveal key={i} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="overflow-hidden rounded-2xl border border-veylify-100 bg-white transition hover:border-veylify-200">
                  <button
                    onClick={() => setAcik(on ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={on}
                  >
                    <span className="font-semibold text-veylify-950">{q.s}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-veylify-50 text-veylify-600 ring-1 ring-veylify-100">
                      {on ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  {on && <div className="px-6 pb-5 leading-relaxed text-slate-600">{q.c}</div>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
