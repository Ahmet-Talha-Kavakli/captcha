import Link from "next/link";
import { X, GitBranch, AtSign, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { MARKA, FIRMA } from "@/lib/marka";
import { DilDegistirici } from "./DilDegistirici";
import { landingCeviri, LANDING_VARSAYILAN, type LandingDil } from "@/lib/i18n/landing";

const SOSYAL: [typeof X, string, string][] = [
  [X, "https://twitter.com", "Twitter / X"],
  [GitBranch, "https://github.com", "GitHub"],
  [AtSign, "https://linkedin.com", "LinkedIn"],
];

export function Footer({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  return (
    <footer className="border-t border-veylify-100 bg-veylify-50/40 px-5 pt-16 pb-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          {/* marka + açıklama + sosyal */}
          <div className="md:pr-6">
            <Logo size={30} tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              {t("footer.slogan")}
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-veylify-700 ring-1 ring-veylify-100">
              <ShieldCheck className="size-3.5" /> KVKK / GDPR uyumlu
            </div>
            <div className="mt-6 flex items-center gap-2.5">
              {SOSYAL.map(([Ikon, href, ad]) => (
                <a
                  key={ad}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ad}
                  className="grid size-9 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-veylify-100 transition hover:-translate-y-0.5 hover:text-veylify-600 hover:ring-veylify-200"
                >
                  <Ikon className="size-[17px]" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title={t("footer.urun")}
            links={[
              [t("nav.ozellikler"), "/features"],
              [t("nav.nasil"), "/how-it-works"],
              [t("nav.cozumler"), "/solutions"],
              [t("fiyat.rozet"), "/pricing"],
              [t("nav.demo"), "/demo"],
            ]}
          />
          <FooterCol
            title={t("footer.sirket")}
            links={[
              ["Hakkımızda", "/about"],
              ["Blog", "/blog"],
              ["Güvenlik", "/security"],
              ["İletişim", "/contact"],
            ]}
          />
          <FooterCol
            title="Kaynaklar"
            links={[
              ["Dokümanlar", "/panel/gelistirici"],
              ["Panel", "/panel"],
              ["Durum", "/durum"],
              ["Demo", "/demo"],
            ]}
          />
          <FooterCol
            title={t("footer.yasal")}
            links={[
              ["Gizlilik Politikası", "/gizlilik"],
              ["KVKK Aydınlatma", "/kvkk"],
              ["Kullanım Koşulları", "/sartlar"],
              ["Mesafeli Satış Sözleşmesi", "/mesafeli-satis"],
              ["İptal & İade", "/iade"],
              ["Teslimat", "/teslimat"],
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-veylify-100 pt-6 text-sm text-slate-400">
          <div className="flex flex-col items-center justify-between gap-1.5 text-center sm:flex-row sm:text-left">
            <span>{FIRMA.unvan}</span>
            <a href={`mailto:${FIRMA.eposta}`} className="transition hover:text-veylify-600">
              {FIRMA.eposta}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <span>© 2026 {MARKA.ad}. {t("footer.haklar")}</span>
          <div className="flex items-center gap-5">
            <Link href="/durum" className="flex items-center gap-2 transition hover:text-veylify-600">
              <span className="pulse-ring h-2 w-2 rounded-full bg-emerald-500" />
              {t("footer.sistemler")}
            </Link>
            <DilDegistirici dil={dil} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3.5 text-[13px] font-bold uppercase tracking-wide text-veylify-950">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-slate-500 transition hover:text-veylify-600">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
