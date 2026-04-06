import crypto from "crypto"
import { db } from "@/lib/db"
import { users, trialHistory } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

/**
 * Normalizes an email (lowercase, trimmed) and returns its SHA-256 hash.
 * Used as a stable identifier across signups for trial-abuse prevention.
 */
export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
}

/**
 * Returns true if the given email has previously consumed a free trial
 * (regardless of whether the original account still exists).
 */
export async function hasUsedTrialBefore(email: string): Promise<boolean> {
  const [record] = await db
    .select({ id: trialHistory.id })
    .from(trialHistory)
    .where(eq(trialHistory.emailHash, hashEmail(email)))
    .limit(1)
  return Boolean(record)
}

/**
 * Starts a free trial for a user by setting their trialStartedAt timestamp.
 * Should be called on first paid feature access.
 * Also records the email in trial_history to block future re-signup abuse.
 * Returns the trial end date.
 */
export async function startTrial(userId: string): Promise<Date> {
  const now = new Date()
  const trialEnd = new Date(
    now.getTime() + STRIPE_CONFIG.trialDays * 24 * 60 * 60 * 1000
  )

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  await db
    .update(users)
    .set({ trialStartedAt: now })
    .where(eq(users.id, userId))

  if (user?.email) {
    // Insert-or-ignore on unique emailHash so re-trial attempts are no-ops.
    await db
      .insert(trialHistory)
      .values({ emailHash: hashEmail(user.email) })
      .onConflictDoNothing({ target: trialHistory.emailHash })
  }

  return trialEnd
}

/**
 * Checks whether a trial is still active based on the start date.
 */
export function isTrialActive(trialStartedAt: Date | null): boolean {
  if (!trialStartedAt) return false
  const trialEnd = new Date(
    trialStartedAt.getTime() + STRIPE_CONFIG.trialDays * 24 * 60 * 60 * 1000
  )
  return trialEnd > new Date()
}

/**
 * Returns the number of days remaining in the trial.
 * Returns 0 if trial has expired.
 */
export function getTrialDaysRemaining(trialStartedAt: Date): number {
  const trialEnd = new Date(
    trialStartedAt.getTime() + STRIPE_CONFIG.trialDays * 24 * 60 * 60 * 1000
  )
  const remaining = Math.ceil(
    (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  return Math.max(0, remaining)
}
