import { MARKA } from "@/lib/marka";
import { PLANLAR } from "@/lib/specter/plans";

/**
 * JsonLd — yapılandırılmış veri (schema.org). Arama motorları + AI arama
 * motorları (GEO) için Organization / WebSite / SoftwareApplication ve
 * opsiyonel FAQPage şemalarını tek bir @graph içinde basar.
 *
 * Tüm alanlar MARKA sabitlerinden beslenir; hardcode domain yoktur.
 */

type Sss = { s: string; c: string };

export function JsonLd({ sss }: { sss?: Sss[] }) {
  // Logo — gerçekten var olan dosya (public/brand/logo-baykus-512.png). Önceden
  // olmayan /brand/logo.png'e işaret ediyordu → kırık structured-data görseli.
  const logo = `${MARKA.url}/brand/logo-baykus-512.png`;
  const og = `${MARKA.url}/opengraph-image`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${MARKA.url}/#organization`,
      name: MARKA.ad,
      url: MARKA.url,
      logo: {
        "@type": "ImageObject",
        url: logo,
        width: 512,
        height: 512,
      },
      description: `${MARKA.ad}, ghost-font (temporal dithering) teknolojisiyle web sitelerini AI botlarından koruyan insan doğrulama / CAPTCHA platformudur.`,
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: MARKA.destekEposta,
        availableLanguage: ["Turkish", "English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${MARKA.url}/#website`,
      name: MARKA.ad,
      url: MARKA.url,
      inLanguage: "tr-TR",
      description: MARKA.sloganTr,
      publisher: { "@id": `${MARKA.url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${MARKA.url}/blog?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${MARKA.url}/#software`,
      name: MARKA.ad,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      url: MARKA.url,
      image: og,
      description: `AI botlarına karşı ghost-font CAPTCHA: insanın gördüğü, makinenin göremediği görünmez doğrulama katmanı. Davranışsal analiz, kural motoru ve görünmez mod ile.`,
      inLanguage: "tr-TR",
      publisher: { "@id": `${MARKA.url}/#organization` },
      // Fiyatlar plans.ts'ten (tek kaynak). Free = 0 ₺; Pro = 990 ₺/ay. Ölçek
      // planı "Özel" (sayısal fiyat yok) → structured-data'ya dahil edilmez.
      offers: [
        {
          "@type": "Offer",
          name: PLANLAR.free.ad,
          price: "0",
          priceCurrency: "TRY",
          description: "Başlangıç planı ücretsiz — kredi kartı gerekmez.",
          availability: "https://schema.org/InStock",
          url: `${MARKA.url}/pricing`,
        },
        {
          "@type": "Offer",
          name: PLANLAR.pro.ad,
          price: "990",
          priceCurrency: "TRY",
          description: "Büyüme planı — aylık, üretim ölçeğinde bot koruması.",
          availability: "https://schema.org/InStock",
          url: `${MARKA.url}/pricing`,
        },
      ],
    },
  ];

  if (sss && sss.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${MARKA.url}/#faq`,
      mainEntity: sss.map((q) => ({
        "@type": "Question",
        name: q.s,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.c,
        },
      })),
    });
  }

  const data = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD güvenli: yalnız statik marka + SSS metni.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
