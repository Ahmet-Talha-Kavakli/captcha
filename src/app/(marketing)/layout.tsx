import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { landingDil } from "@/lib/i18n/landing-sunucu";

/**
 * Pazarlama düzeni — Server Component. Ziyaretçinin dilini (IP/coğrafya +
 * Accept-Language; middleware'in yazdığı cookie) çözer ve Navbar/Footer'a
 * geçirir. Landing sayfaları da kendi içinde landingDil() çağırıp çevirir.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const dil = await landingDil();
  return (
    // Navbar overflow-clip'in DIŞINDA — yoksa `overflow-x-clip` ata elementi
    // sticky konumlamayı bozar (navbar scroll'da sabit kalmaz). Yatay taşma
    // koruması yalnız içeriğe (main) uygulanır.
    <div className="bg-[#f4f1ea] text-veylify-950">
      <Navbar dil={dil} />
      <div className="overflow-x-clip">
        <main>{children}</main>
        <Footer dil={dil} />
      </div>
    </div>
  );
}
