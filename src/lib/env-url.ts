/**
 * Resolves the canonical public app URL.
 *
 * Reads, in order of preference:
 *   1. NEXT_PUBLIC_APP_URL  (legacy name, still used by Stripe + CSRF checks)
 *   2. NEXT_PUBLIC_SITE_URL (the name set in Railway production)
 *   3. AUTH_URL             (fallback — same origin that NextAuth uses)
 *
 * Defensive: if the env value is missing the scheme (e.g.
 * "www.grile-rezinote.ro" instead of "https://www.grile-rezinote.ro"),
 * it's auto-prefixed with "https://" so new URL() calls don't crash.
 * Trailing slashes are stripped.
 *
 * Returns undefined if no env var is set.
 */
export function getAppUrl(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL

  if (!raw) return undefined

  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!trimmed) return undefined

  // Already has a scheme → return as-is.
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // Bare host like "www.grile-rezinote.ro" → assume https.
  return `https://${trimmed}`
}
