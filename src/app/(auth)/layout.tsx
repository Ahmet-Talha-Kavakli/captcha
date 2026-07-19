import Link from "next/link";
import { VeylifyMark } from "@/components/ui/Logo";
import { Gorsel } from "@/components/site/gorseller";
import { MARKA } from "@/lib/marka";

/**
 * Auth düzeni — Higgsfield tarzı SPLIT-SCREEN.
 * SOL (yalnız lg+): büyük clay görsel paneli (auth-panel.webp) + üstte marka
 * + altta kısa slogan; hafif indigo gradient zemin, çerçevesiz/dikişsiz.
 * SAĞ: mevcut giriş/kayıt formu (kendi max-w'siyle) dikey ortalanmış.
 * Mobilde split yok — sadece sağdaki form ortada görünür.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* SOL panel — sadece lg+. Zemin görselle BİREBİR krem (#f4f1ea) → dikişsiz;
          üstte yumuşak indigo ışıma renk katar ama görselin kremi kutu gibi durmaz. */}
      <aside className="relative hidden overflow-hidden bg-[#f4f1ea] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-20 -z-0 size-80 rounded-full bg-veylify-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-20 -z-0 size-80 rounded-full bg-violet-200/25 blur-3xl" />
        {/* TEK büyük marka — görselin üstünde, ortalanmış (kullanıcı isteği). */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10">
          <Link href="/" className="mb-2 inline-flex items-center gap-3">
            <VeylifyMark size={44} />
            <span className="font-display text-[26px] font-extrabold tracking-tight text-veylify-950">
              {MARKA.ad}
            </span>
          </Link>
          <Gorsel
            ad="auth-panel"
            alt={MARKA.ad}
            oran="4/5"
            oncelik
            className="w-full max-w-[440px]"
          />
        </div>

        {/* alt slogan */}
        <div className="relative z-10 px-10 pb-12">
          <h2 className="max-w-[420px] text-[26px] font-bold leading-tight tracking-tight text-veylify-950">
            AI botlarına karşı insan doğrulama.
          </h2>
          <p className="mt-3 max-w-[400px] text-[15px] leading-relaxed text-veylify-900/70">
            {MARKA.sloganTr} — sitenizi ghost-font teknolojisiyle koruyun.
          </p>
        </div>
      </aside>

      {/* SAĞ panel — form */}
      <main className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-5 py-14 lg:min-h-0">
        {children}
      </main>
    </div>
  );
}
