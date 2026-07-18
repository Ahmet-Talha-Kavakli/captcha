/**
 * originIzinli — CORS için GÜVENLİ origin ↔ izinli-domain eşleştirmesi.
 *
 * NEDEN: Önceki kontrol `origin.includes(domain)` idi — TEHLİKELİ GEVŞEK:
 *   domain="veylify.com" için şunlar da eşleşiyordu (spoof):
 *     https://evil-veylify.com.attacker.net  ✗
 *     https://veylify.com.evil.net           ✗
 *   Yani saldırgan izinli domain string'ini içeren HERHANGİ bir origin'den
 *   CORS'u geçebiliyordu (site-key kötüye kullanımı / CSRF).
 *
 * DOĞRU KURAL: origin'in HOST'u ya izinli domain'e TAM eşit olmalı, ya da onun
 * gerçek bir alt-alanı olmalı (host === "sub." + domain ile biten). String
 * `includes` DEĞİL. Şema (http/https) serbest (yerel geliştirme için).
 */

/** Origin string'inin host kısmını çıkar (şema + port atılır). null → geçersiz. */
function originHost(origin: string): string | null {
  try {
    const u = new URL(origin);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * origin, izinli domain listesinden birine güvenli biçimde uyuyor mu?
 * - "*" listede varsa her origin izinli (bilinçli açık site).
 * - Aksi halde: host === domain VEYA host, "."+domain ile biten gerçek alt-alan.
 */
export function originIzinli(origin: string | null, izinli: string[]): boolean {
  if (!origin) return false;
  if (izinli.includes("*")) return true;
  const host = originHost(origin);
  if (!host) return false;
  return izinli.some((d) => {
    const dom = d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!dom) return false;
    return host === dom || host.endsWith("." + dom);
  });
}
