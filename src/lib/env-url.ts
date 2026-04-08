/**
 * Resolves the canonical public app URL.
 *
 * Reads, in order of preference:
 *   1. NEXT_PUBLIC_APP_URL  (legacy name, still used by Stripe + CSRF checks)
 *   2. NEXT_PUBLIC_SITE_URL (the name set in Railway production)
 *   3. AUTH_URL             (fallback — same origin that NextAuth uses)
 *
 * Throws at call time if none are set, so callers must handle the absence
 * (or make sure the env is configured before the code path runs).
 */
export function getAppUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    undefined
  )
}
