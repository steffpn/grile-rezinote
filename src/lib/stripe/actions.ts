"use server"

import { redirect } from "next/navigation"
import { stripe } from "./client"
import { STRIPE_CONFIG } from "./config"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { subscriptions, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hasUsedTrialBefore } from "@/lib/subscription/trial"
import {
  getStripePriceId,
  resolveStripePriceId,
  type BillingCycle,
  type PlanTier,
} from "@/lib/subscription/tiers"

/**
 * Gets or creates a Stripe customer for a user.
 * Links the Stripe customer ID to the local subscriptions table.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (sub?.stripeCustomerId) {
    return sub.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Upsert subscription record with customer ID
  if (sub) {
    // Update existing record
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: customer.id })
      .where(eq(subscriptions.userId, userId))
  } else {
    // Create new record
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId: customer.id,
      status: "inactive",
    })
  }

  return customer.id
}

/**
 * Creates a Stripe Checkout Session for a given tier + billing cycle.
 *
 * Trial logic: attaches `trial_period_days` ONLY for users who haven't
 * already consumed their free trial (tracked both via `users.trialStartedAt`
 * and the persistent `trial_history` table). This prevents users from
 * stacking a 7-day server-side trial onto a 7-day Stripe trial.
 */
export async function createCheckoutSessionForTier(
  tier: Exclude<PlanTier, "FREE">,
  cycle: BillingCycle
) {
  const session = await auth()

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login")
  }

  const priceId = getStripePriceId(tier, cycle)
  if (!priceId) {
    throw new Error(
      `Stripe price ID missing for ${tier} ${cycle}. Check env vars.`
    )
  }

  const customerId = await getOrCreateCustomer(
    session.user.id,
    session.user.email
  )

  // Only offer the free trial to users who haven't used one before.
  const [userRow] = await db
    .select({ trialStartedAt: users.trialStartedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const alreadyUsedTrial =
    Boolean(userRow?.trialStartedAt) ||
    (await hasUsedTrialBefore(session.user.email))

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    metadata: { userId: session.user.id, planTier: tier },
    ...(alreadyUsedTrial
      ? {}
      : {
          subscription_data: {
            trial_period_days: STRIPE_CONFIG.trialDays,
          },
        }),
  })

  redirect(checkoutSession.url!)
}

/**
 * Retrieves checkout session details for the success page.
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    const subscription = session.subscription as
      | {
          id: string
          status: string
          items: {
            data: Array<{
              current_period_end: number
              price: { id: string; recurring?: { interval: string } }
            }>
          }
        }
      | null

    const priceId = subscription?.items?.data[0]?.price?.id
    const resolved = priceId ? resolveStripePriceId(priceId) : null

    return {
      status: subscription?.status ?? "unknown",
      tier: resolved?.tier ?? null,
      planType:
        subscription?.items?.data[0]?.price?.recurring?.interval === "year"
          ? "annual"
          : "monthly",
      currentPeriodEnd: subscription?.items?.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
    }
  } catch {
    return null
  }
}

/**
 * Cancels the user's subscription at the end of the current billing period.
 */
export async function cancelSubscription() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Nu esti autentificat")
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  if (!sub?.stripeSubscriptionId) {
    throw new Error("Nu exista un abonament activ")
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true })
    .where(eq(subscriptions.userId, session.user.id))

  return {
    success: true,
    currentPeriodEnd: sub.currentPeriodEnd,
  }
}

/**
 * Reactivates a subscription that was set to cancel at period end.
 */
export async function reactivateSubscription() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Nu esti autentificat")
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  if (!sub?.stripeSubscriptionId) {
    throw new Error("Nu exista un abonament activ")
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: false })
    .where(eq(subscriptions.userId, session.user.id))

  return { success: true }
}

/**
 * Switches to a different tier/cycle combination mid-subscription.
 * Used by the management page for upgrades (PRO → PREMIUM) and cycle changes.
 */
export async function switchSubscriptionPlan(
  tier: Exclude<PlanTier, "FREE">,
  cycle: BillingCycle
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Nu esti autentificat")
  }

  const newPriceId = getStripePriceId(tier, cycle)
  if (!newPriceId) {
    throw new Error(
      `Stripe price ID missing for ${tier} ${cycle}. Check env vars.`
    )
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  if (!sub?.stripeSubscriptionId) {
    throw new Error("Nu exista un abonament activ")
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    sub.stripeSubscriptionId
  )
  const itemId = stripeSubscription.items.data[0]?.id

  if (!itemId) {
    throw new Error("Nu s-a gasit elementul abonamentului")
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "create_prorations",
  })

  // Local DB will be updated by webhook when Stripe confirms.
  return { success: true }
}

/**
 * Gets detailed subscription information for management page.
 */
export async function getSubscriptionDetails(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (!sub) {
    return null
  }

  return {
    status: sub.status,
    tier: sub.planTier,
    planType: sub.planType,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
  }
}
