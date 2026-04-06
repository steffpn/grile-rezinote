/**
 * Distributed rate limiter backed by Upstash Redis.
 *
 * All limiters share a single Redis client. Sliding-window algorithm.
 * Safe across multiple Next.js instances / serverless invocations.
 *
 * Usage:
 *   if (!(await authLimiter.check(key))) {
 *     return { error: "Too many requests" }
 *   }
 *
 * Required env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

export interface RateLimiter {
  check(key: string): Promise<boolean>
}

function makeLimiter(
  prefix: string,
  max: number,
  windowSeconds: number
): RateLimiter {
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    prefix,
    analytics: true,
  })

  return {
    async check(key: string): Promise<boolean> {
      try {
        const { success } = await rl.limit(key)
        return success
      } catch (err) {
        // Fail-open on Redis outage so legitimate users are not locked out.
        // The outage itself is logged for ops follow-up.
        console.error(`[rate-limit] redis error in ${prefix}:`, err)
        return true
      }
    },
  }
}

// Login attempts: 10 per 15 minutes per IP.
export const authLimiter = makeLimiter("auth", 10, 15 * 60)

// Account creation: 5 per hour per IP.
export const signupLimiter = makeLimiter("signup", 5, 60 * 60)

// Forgot/update password: 5 per hour per IP.
export const passwordResetLimiter = makeLimiter("password-reset", 5, 60 * 60)

// Stripe webhook: 100 per minute per source IP — well above legitimate volume,
// but caps invalid-signature spam DoS.
export const webhookLimiter = makeLimiter("webhook", 100, 60)
