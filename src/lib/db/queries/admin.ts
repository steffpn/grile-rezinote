import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, auditLogs } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

/**
 * Whitelist of emails allowed to access /admin.
 *
 * Source of truth is the `ADMIN_EMAILS` env var (comma-separated). If
 * unset we fall back to the single platform owner, so a fresh deploy
 * with no env still grants admin to the right person.
 *
 * Everyone else — anon visitors, regular students, even DB rows where
 * `is_superadmin = true` — gets `notFound()` (404), not a redirect.
 *
 * To grant admin to a new account: add the email to `ADMIN_EMAILS`
 * on the host (Railway / `.env.local`) and redeploy. No DB write needed.
 */
const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  (process.env.ADMIN_EMAILS ?? "grile.rezinote@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
)

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.trim().toLowerCase())
}

/**
 * Verify that the given user ID belongs to an admin (whitelisted email).
 * Throws Next.js notFound() if not — yields a 404 instead of leaking
 * the existence of the admin surface.
 */
export async function requireSuperadmin(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isSuperadmin: users.isSuperadmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  return user
}

/**
 * Get the current authenticated admin user.
 * Returns the user record on success, or triggers notFound() (404) if
 * the visitor isn't signed in OR isn't on the admin whitelist.
 */
export async function getCurrentAdmin() {
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  return requireSuperadmin(session.user.id)
}

/**
 * Log an admin action to the audit trail.
 */
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId,
    changes: changes ? JSON.stringify(changes) : null,
  })
}
