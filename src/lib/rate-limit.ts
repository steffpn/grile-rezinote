/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments and development. For multi-instance
 * production, replace the Map below with a Redis-backed store (Upstash, etc.).
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 5 })
 *   if (!limiter.check(key)) throw new Error("Too many requests")
 */

type Bucket = number[]

const stores = new Map<string, Map<string, Bucket>>()

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number
  /** Max requests allowed per key inside the window. */
  max: number
  /** Logical namespace so different limiters do not collide. */
  namespace: string
}

export interface RateLimiter {
  check(key: string): boolean
  remaining(key: string): number
  reset(key: string): void
}

export function createRateLimiter(opts: RateLimitOptions): RateLimiter {
  if (!stores.has(opts.namespace)) {
    stores.set(opts.namespace, new Map())
  }
  const store = stores.get(opts.namespace)!

  function prune(bucket: Bucket, now: number): Bucket {
    const cutoff = now - opts.windowMs
    while (bucket.length > 0 && bucket[0] < cutoff) {
      bucket.shift()
    }
    return bucket
  }

  return {
    check(key: string): boolean {
      const now = Date.now()
      const bucket = prune(store.get(key) ?? [], now)
      if (bucket.length >= opts.max) {
        store.set(key, bucket)
        return false
      }
      bucket.push(now)
      store.set(key, bucket)
      return true
    },
    remaining(key: string): number {
      const now = Date.now()
      const bucket = prune(store.get(key) ?? [], now)
      return Math.max(0, opts.max - bucket.length)
    },
    reset(key: string): void {
      store.delete(key)
    },
  }
}

// Pre-configured limiters for the most attacked surfaces.
export const authLimiter = createRateLimiter({
  namespace: "auth",
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
})

export const signupLimiter = createRateLimiter({
  namespace: "signup",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
})

export const passwordResetLimiter = createRateLimiter({
  namespace: "password-reset",
  windowMs: 60 * 60 * 1000,
  max: 5,
})

export const webhookLimiter = createRateLimiter({
  namespace: "webhook",
  windowMs: 60 * 1000,
  max: 100,
})
