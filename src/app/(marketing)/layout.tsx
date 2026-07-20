import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { landingDil } from "@/lib/i18n/landing-sunucu";
import { currentUser } from "@/lib/auth";
import { clerkYapili } from "@/lib/clerk-durum";

/**
 * Pazarlama düzeni — Server Component. Ziyaretçinin dilini çözer + oturum
 * durumunu (Clerk VEYA cookie) belirler. Giriş yapılmışsa Navbar "Ücretsiz
 * başla" yerine profil avatarı + "Panel" gösterir.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const dil = await landingDil();

  // Oturum durumu (currentUser hem Clerk hem cookie'yi çözer). Profil resmi
  // Clerk'ten (Google avatarı) gelir; yoksa isim baş harfi + renk kullanılır.
  //
  // PERFORMANS: burada yalnızca "giriş yapmış mı + adı ne" bilgisi gerekir;
  // saniyelik tazelik gerekmez. `taze:false` TTL'li hafif okuma yapar — aksi
  // halde HER anonim landing ziyaretçisi tüm DB blob'unu indirip sayfa
  // sunucuda 20sn+ sürüyordu (reklam trafiği için ölümcül).
  const user = await currentUser({ taze: false });
  let avatarUrl: string | null = null;
  if (user && clerkYapili()) {
    try {
      const { currentUser: clerkCurrentUser } = await import("@clerk/nextjs/server");
      const ck = await clerkCurrentUser();
      avatarUrl = ck?.imageUrl ?? null;
    } catch {
      /* Clerk erişilemiyor → avatar renkli baş harfe düşer */
    }
  }
  const oturum = user
    ? {
        isim: user.name || user.email.split("@")[0],
        avatarUrl,
        avatarColor: user.avatarColor,
      }
    : null;

  return (
    // Navbar overflow-clip'in DIŞINDA — yoksa `overflow-x-clip` ata elementi
    // sticky konumlamayı bozar (navbar scroll'da sabit kalmaz). Yatay taşma
    // koruması yalnız içeriğe (main) uygulanır.
    <div className="bg-[#f4f1ea] text-veylify-950">
      <Navbar dil={dil} oturum={oturum} />
      <div className="overflow-x-clip">
        <main>{children}</main>
        <Footer dil={dil} />
      </div>
    </div>
  );
}
