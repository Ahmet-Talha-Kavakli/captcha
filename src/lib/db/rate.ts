/**
 * Specter — Basit In-Memory Rate Limiter
 * ---------------------------------------
 * Public challenge/verify uçlarını kötüye kullanıma karşı korur.
 * Süreç-içi pencere sayacı (tek-instance için yeterli; ölçekte Redis'e
 * taşınır).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  const ok = b.count <= limit;
  return { ok, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt };
}

/**
 * IP başına son 60sn istek sayısını takip eder (rate kuralları için).
 * rate-limit'ten farklı: burada sadece sayar, engellemez — kural motoru
 * "rate > N" koşulunu değerlendirebilsin diye.
 */
const rateCounters = new Map<string, number[]>();
export function trackRate(ip: string): number {
  const now = Date.now();
  const arr = (rateCounters.get(ip) || []).filter((t) => t > now - 60_000);
  arr.push(now);
  rateCounters.set(ip, arr);
  // bellek temizliği
  if (rateCounters.size > 5000) {
    for (const [k, v] of rateCounters) if (!v.some((t) => t > now - 60_000)) rateCounters.delete(k);
  }
  return arr.length;
}
