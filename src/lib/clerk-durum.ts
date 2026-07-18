/**
 * Clerk GERÇEKTEN kullanılabilir mi? Clerk <SignIn>/<SignUp> yalnızca HEM
 * publishable key HEM secret key düzgün kurulu + backend erişilebilir olduğunda
 * form render eder. Üretimde bunlardan biri eksik/yanlış olduğunda bileşenler
 * SESSİZCE BOŞ kalır → kullanıcı giriş formunu göremez, panele giremez (yaşanan
 * bug). Bu durumda uygulama kendi cookie-auth formuna (AuthMixfont → /api/auth/*)
 * düşmeli — bizim auth sistemimiz gerçek ve bağımsız çalışır.
 *
 * GÜVENLİ VARSAYILAN: Clerk yalnızca HER İKİ anahtar da mevcut VE açıkça
 * etkinleştirilmişse (VEYLIFY_CLERK=1) kullanılır. Aksi halde kendi formumuz —
 * böylece "key var ama backend yarım kurulu" senaryosu kullanıcıyı kilitlemez.
 * Sunucu-tarafı; ağ çağrısı yok.
 */
export function clerkYapili(): boolean {
  // Açık opt-in olmadan Clerk KULLANILMAZ — kendi güvenilir formumuz varsayılan.
  if (process.env.VEYLIFY_CLERK !== "1") return false;
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const sk = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  if (!/^pk_(test|live)_/.test(pk)) return false;
  if (!/^sk_(test|live)_/.test(sk)) return false;
  if (/x{6,}|your[_-]?key|changeme|placeholder|buraya/i.test(pk + sk)) return false;
  return true;
}
