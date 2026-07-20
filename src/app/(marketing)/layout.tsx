import { cookies } from "next/headers";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { landingDil } from "@/lib/i18n/landing-sunucu";
import { currentUser, SESSION_COOKIE } from "@/lib/auth";
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
  // PERFORMANS — KRİTİK: Landing sitenin en yüksek trafikli yüzeyi (reklamdan
  // gelen HERKES burayı görür) ve ziyaretçilerin çoğu ANONİM. Oturum kanıtı
  // (cookie ya da Clerk) yoksa kullanıcıyı çözmeye çalışmak boşuna — ama
  // `currentUser()` yine de DB blob'unu indiriyordu. Bu, Supabase egress'ini
  // (3.3 MB × her ziyaret) patlatıp Free kotayı doldurdu ve tüm sayfaları
  // 20 sn'ye çıkardı. Artık: oturum kanıtı YOKSA DB'ye HİÇ gidilmez.
  const cookieDeposu = await cookies();
  const oturumKanitiVar =
    Boolean(cookieDeposu.get(SESSION_COOKIE)?.value) || // kendi cookie-oturumumuz
    Boolean(cookieDeposu.get("__session")?.value); // Clerk oturum cookie'si
  const user = oturumKanitiVar ? await currentUser({ taze: false }) : null;
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
