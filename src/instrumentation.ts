/**
 * Next.js instrumentation — sunucu (Node runtime) başlarken BİR KEZ çalışır.
 * Supabase modunda state cache'ini önden yükler; böylece ilk istek geldiğinde
 * senkron `load()` dolu cache bulur (boş seed'e yazıp Supabase verisini ezme
 * yarışı engellenir). Edge runtime'da fs/supabase yüklenmez → yalnız Node'da.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { blobHazirla } = await import("./lib/db/db");
    await blobHazirla();
  }
}
