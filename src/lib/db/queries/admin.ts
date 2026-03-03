import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, auditLogs } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

/**
 * Verify that the given user ID belongs to a superadmin.
 * Redirects to /dashboard if not.
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

  if (!user || !user.isSuperadmin) {
    redirect("/dashboard")
  }

  return user
}

/**
 * Get the current authenticated admin user.
 * Creates Supabase client, gets auth user, verifies superadmin status.
 * Redirects if not authenticated or not superadmin.
 */
export async function getCurrentAdmin() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  return requireSuperadmin(authUser.id)
}

/**
 * Log an admin action to the audit trail.
 */
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId,
    changes: changes ? JSON.stringify(changes) : null,
  })
}
