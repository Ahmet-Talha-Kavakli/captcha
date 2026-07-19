import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthMixfont } from "../../AuthMixfont";
import { clerkYapili } from "@/lib/clerk-durum";

export const metadata = { title: "Kayıt ol" };

/**
 * Kayıt sayfası. Clerk yapılandırılmışsa Clerk <SignUp>; aksi halde (env yok/
 * placeholder → <SignUp> boş render eder) kendi kayıt formumuza (AuthMixfont →
 * /api/auth/register) DÜŞÜLÜR. Böylece kayıt her koşulda çalışır.
 */
export default function KayitPage() {
  if (!clerkYapili()) {
    return (
      <Suspense>
        <AuthMixfont mode="sign-up" />
      </Suspense>
    );
  }
  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-6">
      <Link href="/" aria-label="Ana sayfa">
        <Logo size={30} />
      </Link>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-zinc-200/70 rounded-2xl",
          },
        }}
      />
      <p className="text-center text-[13px] text-slate-500">
        Sadece denemek mi istiyorsun?{" "}
        <Link href="/demo-giris" className="font-medium text-brand-600 hover:underline">
          Demo hesabıyla gir
        </Link>
      </p>
    </div>
  );
}
