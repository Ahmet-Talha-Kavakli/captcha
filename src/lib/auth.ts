/**
 * Specter — Sunucu Auth Yardımcıları
 * -----------------------------------
 * Cookie-tabanlı gerçek oturum yönetimi. Session token httpOnly
 * cookie'de tutulur; DB'de token -> userId eşlemesi vardır.
 */

import { cookies, headers } from "next/headers";
import { Sessions, Users } from "./db/db";
import type { User } from "./db/schema";

export const SESSION_COOKIE = "specter_session";

/** Mevcut istekteki kullanıcıyı çözer (yoksa null). */
export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return Sessions.resolve(token);
}

/** Oturum açar: session üretir + cookie yazar. */
export async function startSession(userId: string): Promise<void> {
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
}

/** Oturumu kapatır. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  Sessions.destroy(token);
  store.delete(SESSION_COOKIE);
}
