import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthMixfont } from "../../AuthMixfont";
import { clerkYapili } from "@/lib/clerk-durum";

export const metadata = { title: "Giriş" };

/**
 * Giriş sayfası. Clerk GERÇEKTEN yapılandırılmışsa (geçerli publishable key)
 * Clerk <SignIn> kullanılır; aksi halde (üretimde env yok/placeholder ise
 * <SignIn> BOŞ render eder → kullanıcı formu göremez, panele giremez) kendi
 * e-posta/şifre formumuza (AuthMixfont → /api/auth/login) DÜŞÜLÜR. Böylece
 * Clerk kurulu olsun olmasın giriş her zaman çalışır.
 */
export default function GirisPage() {
  if (!clerkYapili()) {
    return (
      <Suspense>
        <AuthMixfont mode="sign-in" />
      </Suspense>
    );
  }
  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-6">
      <Link href="/" aria-label="Ana sayfa">
        <Logo size={30} />
      </Link>
      <SignIn
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
