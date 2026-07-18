import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Kayıt ol" };

/** Kayıt — Clerk <SignUp> (gerçek kimlik doğrulama). Marka temalı. */
export default function KayitPage() {
  return (
    <div className="flex flex-col items-center gap-6">
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
