import { Suspense } from "react";
import { AuthMixfont } from "../AuthMixfont";

export const metadata = { title: "Demo Giriş" };

/**
 * Demo giriş — kendi cookie-auth akışı (demo@specter.dev / vitrin + test).
 * Gerçek kullanıcılar Clerk üzerinden /login ile girer; bu sayfa yalnız
 * demo/deneme hesabı ve test-otomasyonu için korunur.
 */
export default function DemoGirisPage() {
  return (
    <Suspense>
      <AuthMixfont mode="sign-in" />
    </Suspense>
  );
}
