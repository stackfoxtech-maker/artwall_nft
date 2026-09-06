/**
 * Rate limiter with an in-memory fixed-window store.
 *
 * This is per-instance only — good enough for a single Vercel function region
 * and for local dev. For production multi-region, set UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN and swap `store` for @upstash/ratelimit
 * (tracked in docs/production-readiness.md §04).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export async function checkRateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  let bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  const ok = bucket.count <= opts.limit;
  return { ok, remaining: Math.max(0, opts.limit - bucket.count), resetAt: bucket.resetAt };
}

// Opportunistic cleanup so the map doesn't grow unbounded in a long-lived process.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((v, k) => {
      if (v.resetAt <= now) store.delete(k);
    });
  }, 60_000).unref?.();
}
