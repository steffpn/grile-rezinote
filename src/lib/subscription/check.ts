import { cache } from "react"
import { db } from "@/lib/db"
import { subscriptions, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

export type SubscriptionAccess = {
  hasAccess: boolean
  status: "active" | "trialing" | "trial_available" | "expired" | "none"
  trialDaysRemaining?: number
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  planType?: string | null
}

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

  // Active subscription
  if (sub?.status === "active") {
    return {
      hasAccess: true,
      status: "active",
      currentPeriodEnd: sub.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      planType: sub.planType,
    }
  }

  // Trialing via Stripe (subscription with trialing status)
  if (sub?.status === "trialing" && sub.currentPeriodEnd) {
    if (sub.currentPeriodEnd > new Date()) {
      const daysRemaining = Math.ceil(
        (sub.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return {
        hasAccess: true,
        status: "trialing",
        trialDaysRemaining: daysRemaining,
        currentPeriodEnd: sub.currentPeriodEnd,
      }
    }
  }

  // Check server-side trial (independent of Stripe subscription)
  const [user] = await db
    .select({ trialStartedAt: users.trialStartedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return { hasAccess: false, status: "none" }
  }

  // Never started trial — allow access, trial will start on first feature use
  if (!user.trialStartedAt) {
    return { hasAccess: true, status: "trial_available" }
  }

  // Check if trial is still active
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
      trialDaysRemaining: daysRemaining,
    }
  }

  // Trial expired and no active subscription
  return { hasAccess: false, status: "expired" }
})
