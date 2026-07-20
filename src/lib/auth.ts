/**
 * Veylify — Sunucu Auth Yardımcıları (ÇİFT MODLU)
 * ------------------------------------------------
 * 1) Clerk oturumu: Clerk ile giriş yapan kullanıcı — Clerk kimliği yerel
 *    User modeline eşlenir (just-in-time). Birincil yol.
 * 2) Cookie oturumu: kendi httpOnly cookie-session — demo hesabı + widget
 *    test akışları + geriye uyum. Clerk oturumu yoksa bu devreye girer.
 *
 * currentUser() imzası KORUNUR (User | null) — 180+ çağrı yeri değişmez.
 */

import { cookies, headers } from "next/headers";
import { auth as clerkAuth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { Sessions, Users, blobHazirla, blobFlush } from "./db/db";
import type { User } from "./db/schema";

export const SESSION_COOKIE = "specter_session";

/** Mevcut istekteki kullanıcıyı çözer (yoksa null). Önce Clerk, sonra cookie. */
export async function currentUser(opts?: { taze?: boolean }): Promise<User | null> {
  // Supabase modunda state'i TAZE yükle (zorla) — auth kritik; başka instance'ın
  // (login) yazdığı session/kullanıcı bu istekte kesin görünsün.
  //
  // PERFORMANS: `zorla=true` TTL'i atlar, yani HER istekte tüm blob indirilir.
  // Bu yalnızca oturumun kesin güncel olması gereken yerlerde (panel, API,
  // login sonrası) gerekli. Landing gibi salt "giriş yapmış mı" bilgisini
  // kullanan yüksek-trafikli sayfalarda `taze:false` geçilir → TTL'li hafif
  // okuma; aksi halde her anonim ziyaretçi tüm DB'yi indirip sayfa 20sn+ sürer.
  await blobHazirla(opts?.taze !== false);
  // 1) Clerk oturumu var mı?
  try {
    const { userId } = await clerkAuth();
    if (userId) {
      const yerel = Users.byClerkId(userId);
      if (yerel) return yerel;
      // İlk kez görülüyor → Clerk profilinden yerel User üret.
      const ck = await clerkCurrentUser();
      if (ck) {
        const email =
          ck.primaryEmailAddress?.emailAddress ||
          ck.emailAddresses?.[0]?.emailAddress ||
          `${userId}@clerk.local`;
        const name =
          [ck.firstName, ck.lastName].filter(Boolean).join(" ") ||
          ck.username ||
          email.split("@")[0];
        return Users.clerkSenkron({ clerkId: userId, email, name });
      }
    }
  } catch {
    // Clerk yapılandırılmamış/erişilemiyor → cookie moduna düş.
  }
  // 2) Kendi cookie oturumu (demo + geriye uyum).
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return Sessions.resolve(token);
}

/** Oturum açar: session üretir + cookie yazar. */
export async function startSession(userId: string): Promise<void> {
  await blobHazirla(); // cache Supabase'den yüklü olsun (session seed'e yazılmasın)
  const token = Sessions.create(userId);
  const store = await cookies();
  // Secure yalnızca gerçekten HTTPS üzerinden gelen istekte set edilir;
  // aksi halde localhost/http'de tarayıcı cookie'yi reddeder.
  const hdrs = await headers();
  const isHttps =
    hdrs.get("x-forwarded-proto") === "https" ||
    (hdrs.get("origin") || "").startsWith("https://");
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  Users.touch(userId);
  // Session'ı Supabase'e SENKRON yaz → sonraki istek (panel) onu kesin görür.
  await blobFlush();
}

/** Oturumu kapatır. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  Sessions.destroy(token);
  store.delete(SESSION_COOKIE);
}
