"use server"

import { redirect } from "next/navigation"
import { stripe } from "./client"
import { STRIPE_CONFIG } from "./config"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
 * Creates a Stripe Checkout Session for subscription.
 * Redirects the user to Stripe Hosted Checkout.
 */
export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const customerId = await getOrCreateCustomer(user.id, user.email!)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    metadata: { userId: user.id },
  })

  redirect(session.url!)
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
          items: { data: Array<{ current_period_end: number; price: { recurring?: { interval: string } } }> }
        }
      | null

    return {
      status: subscription?.status ?? "unknown",
      planType: subscription?.items?.data[0]?.price?.recurring?.interval === "year"
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Nu esti autentificat")
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
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
    .where(eq(subscriptions.userId, user.id))

  return {
    success: true,
    currentPeriodEnd: sub.currentPeriodEnd,
  }
}

/**
 * Reactivates a subscription that was set to cancel at period end.
 */
export async function reactivateSubscription() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Nu esti autentificat")
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
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
    .where(eq(subscriptions.userId, user.id))

  return { success: true }
}

/**
 * Switches the billing cycle between monthly and annual.
 */
export async function switchBillingCycle(newPriceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Nu esti autentificat")
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  if (!sub?.stripeSubscriptionId) {
    throw new Error("Nu exista un abonament activ")
  }

  // Get current subscription to find the item ID
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

  // Local DB will be updated by webhook when Stripe confirms
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
    planType: sub.planType,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
  }
}
