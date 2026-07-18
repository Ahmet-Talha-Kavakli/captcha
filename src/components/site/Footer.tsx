import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MARKA } from "@/lib/marka";
import { landingCeviri, LANDING_VARSAYILAN, type LandingDil } from "@/lib/i18n/landing";

export function Footer({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  return (
    <footer className="border-t border-veylify-100 bg-veylify-50/40 px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo size={28} tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              {t("footer.slogan")}
            </p>
          </div>
          <FooterCol
            title={t("footer.urun")}
            links={[
              [t("nav.ozellikler"), "/ozellikler"],
              [t("nav.nasil"), "/nasil-calisir"],
              [t("nav.cozumler"), "/cozumler"],
              [t("fiyat.rozet"), "/fiyatlandirma"],
              [t("nav.demo"), "/demo"],
              ["Status", "/durum"],
            ]}
          />
          <FooterCol
            title={t("footer.sirket")}
            links={[
              ["Hakkımızda", "/hakkimizda"],
              ["Blog", "/blog"],
              ["Güvenlik", "/guvenlik"],
              ["İletişim", "/iletisim"],
            ]}
          />
          <FooterCol
            title={t("footer.yasal")}
            links={[
              ["Gizlilik", "/gizlilik"],
              ["KVKK", "/kvkk"],
              ["Kullanım şartları", "/sartlar"],
              ["Dokümanlar", "/panel/gelistirici"],
              ["Panel", "/panel"],
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-veylify-100 pt-6 text-sm text-slate-400 sm:flex-row">
          <span>© 2026 {MARKA.ad}. {t("footer.haklar")}</span>
          <Link href="/durum" className="flex items-center gap-2 transition hover:text-veylify-600">
            <span className="pulse-ring h-2 w-2 rounded-full bg-emerald-500" />
            {t("footer.sistemler")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-bold text-veylify-950">{title}</h4>
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
