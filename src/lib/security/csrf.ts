import { headers } from "next/headers"

/**
 * Defense-in-depth CSRF check for server actions and route handlers.
 *
 * Next.js already enforces same-origin for server actions in modern versions,
 * but this gives us an explicit, fail-closed verification that future
 * configuration changes (custom rewrites, exotic deployments) cannot silently
 * weaken.
 *
 * Throws if the request did not originate from one of our own hosts.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers()

  const origin = h.get("origin") ?? h.get("referer")
  if (!origin) {
    // No Origin header at all — block. Legitimate browser POSTs always send one.
    throw new Error("Origin header missing")
  }

  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https"
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) {
    throw new Error("Host header missing")
  }

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw new Error("Invalid origin")
  }

  const allowedHosts = new Set<string>([host])
  // Optional: allow an env-supplied app URL too (useful in preview deployments).
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      allowedHosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host)
    } catch {
      // ignore malformed env
    }
  }

  if (!allowedHosts.has(originHost)) {
    throw new Error(`Cross-origin request rejected (${proto}://${originHost})`)
  }
}
