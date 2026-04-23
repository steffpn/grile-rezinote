"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/get-user"
import { assertSameOrigin } from "@/lib/security/csrf"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { startTrial, hasUsedTrialBefore } from "@/lib/subscription/trial"

export type StartTrialResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Explicit opt-in trigger for the 7-day PRO trial. Replaces the old implicit
 * "layout auto-starts trial on first feature use" flow — users now click a
 * button in the upgrade blocker / FREE banner to start their trial, which
 * matches what the pricing page actually advertises and avoids the "where
 * did my PRO features go on day 8" surprise.
 *
 * Safe to call multiple times — no-ops if the trial was already started or
 * previously consumed (via `trial_history` hash match).
 */
export async function startMyTrial(): Promise<StartTrialResult> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  // Already started on this account?
  const [fresh] = await db
    .select({ trialStartedAt: users.trialStartedAt, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!fresh) {
    return { success: false, error: "Cont negasit." }
  }

  if (fresh.trialStartedAt) {
    return {
      success: false,
      error: "Ai folosit deja perioada de trial pe acest cont.",
    }
  }

  // Trial-abuse check: previously used under this email (possibly on a deleted
  // account)? Block here too.
  if (await hasUsedTrialBefore(fresh.email)) {
    return {
      success: false,
      error:
        "Perioada de trial a fost deja folosita pentru aceasta adresa de email.",
    }
  }

  await startTrial(user.id)
  revalidatePath("/", "layout")
  return { success: true }
}
