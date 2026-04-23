import { cache } from "react"
import { db } from "@/lib/db"
import { subscriptions, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { STRIPE_CONFIG } from "@/lib/stripe/config"
import type { PlanTier } from "./tiers"

export type SubscriptionAccess = {
  hasAccess: boolean
  status: "active" | "trialing" | "trial_available" | "expired" | "none"
  /**
   * Product tier granting the access. During trial this is PRO (trial unlocks
   * PRO features; PREMIUM stays aspirational). When hasAccess=false this is FREE.
   */
  tier: PlanTier
  trialDaysRemaining?: number
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  planType?: string | null
}

/**
 * Tier granted to trial users. PRO (not PREMIUM) so PREMIUM features stay
 * as an upgrade incentive even during trial.
 */
const TRIAL_TIER: PlanTier = "PRO"

/**
 * Checks the subscription access status for a user.
 * Cached per request — layout and page share the same result.
 */
export const checkSubscriptionAccess = cache(async function checkSubscriptionAccess(
  userId: string
): Promise<SubscriptionAccess> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  // Active paid subscription — unlocks whatever tier the user purchased.
  if (sub?.status === "active") {
    return {
      hasAccess: true,
      status: "active",
      tier: sub.planTier,
      currentPeriodEnd: sub.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      planType: sub.planType,
    }
  }

  // Stripe-managed trial (subscription in trialing status).
  if (sub?.status === "trialing" && sub.currentPeriodEnd) {
    if (sub.currentPeriodEnd > new Date()) {
      const daysRemaining = Math.ceil(
        (sub.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return {
        hasAccess: true,
        status: "trialing",
        tier: sub.planTier,
        trialDaysRemaining: daysRemaining,
        currentPeriodEnd: sub.currentPeriodEnd,
      }
    }
  }

  // Server-side trial (independent of Stripe — pre-checkout goodwill trial).
  const [user] = await db
    .select({ trialStartedAt: users.trialStartedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return { hasAccess: false, status: "none", tier: "FREE" }
  }

  // Never started trial — allow access, trial will start on first feature use.
  if (!user.trialStartedAt) {
    return { hasAccess: true, status: "trial_available", tier: TRIAL_TIER }
  }

  const trialEndDate = new Date(
    user.trialStartedAt.getTime() +
      STRIPE_CONFIG.trialDays * 24 * 60 * 60 * 1000
  )

  if (trialEndDate > new Date()) {
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return {
      hasAccess: true,
      status: "trialing",
      tier: TRIAL_TIER,
      trialDaysRemaining: daysRemaining,
    }
  }

  // Trial expired and no active subscription → user drops back to FREE.
  // FREE has limited access (20 questions/day), so hasAccess is TRUE.
  // The legacy `status: "expired"` is preserved for any code still reading it,
  // but callers should branch on `tier` going forward.
  return { hasAccess: true, status: "expired", tier: "FREE" }
})
