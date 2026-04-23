import Stripe from "stripe"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { resolveStripePriceId } from "@/lib/subscription/tiers"
import type { PlanTier } from "@/lib/subscription/tiers"

/**
 * Maps Stripe subscription status to local enum values.
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "trialing" | "cancelled" | "inactive" {
  switch (stripeStatus) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "canceled":
      return "cancelled"
    case "past_due":
    case "unpaid":
      return "inactive"
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "inactive"
    default:
      return "inactive"
  }
}

/**
 * Derives plan type (monthly/annual) from the subscription's price interval.
 */
function derivePlanType(
  subscription: Stripe.Subscription
): "monthly" | "annual" | null {
  const item = subscription.items?.data[0]
  if (!item?.price?.recurring?.interval) return null
  return item.price.recurring.interval === "year" ? "annual" : "monthly"
}

/**
 * Derives the product tier (PRO / PREMIUM) from the Stripe price ID.
 * Returns null if the price ID doesn't match any configured env var — the
 * caller should log a warning and leave the tier unchanged.
 */
function deriveTier(subscription: Stripe.Subscription): PlanTier | null {
  const priceId = subscription.items?.data[0]?.price?.id
  if (!priceId) return null
  const resolved = resolveStripePriceId(priceId)
  return resolved?.tier ?? null
}

/**
 * Gets current_period_end from subscription items (Stripe v20 API).
 * In the 2025+ API, current_period_end lives on SubscriptionItem, not Subscription.
 */
function getCurrentPeriodEnd(
  subscription: Stripe.Subscription
): Date | null {
  const item = subscription.items?.data[0]
  if (!item?.current_period_end) return null
  return new Date(item.current_period_end * 1000)
}

/**
 * Extracts the subscription ID from an invoice's parent field (Stripe v20 API).
 */
function getSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice
): string | null {
  const parent = invoice.parent
  if (!parent || parent.type !== "subscription_details") return null
  const sub = parent.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === "string" ? sub : sub.id
}

/**
 * Handles subscription created and updated events.
 * Upserts the subscription record in the database.
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  // Find user by stripe customer ID
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1)

  if (!existingSub) {
    // Customer not found in our DB — this can happen if checkout was created
    // outside our flow. Log and skip.
    console.warn(
      `Webhook: No subscription record found for Stripe customer ${customerId}`
    )
    return
  }

  const tier = deriveTier(subscription)
  if (!tier) {
    const priceId = subscription.items?.data[0]?.price?.id
    console.warn(
      `Webhook: Stripe price ID ${priceId} does not match any configured tier env var — planTier left unchanged for customer ${customerId}`
    )
  }

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      // Only update tier if we could resolve it; keep existing otherwise so we
      // don't accidentally downgrade a user when a stale price ID comes through.
      ...(tier ? { planTier: tier } : {}),
      planType: derivePlanType(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: getCurrentPeriodEnd(subscription),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

/**
 * Handles subscription deleted event.
 * Sets status to cancelled and drops the user back to FREE tier.
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      planTier: "FREE",
      cancelAtPeriodEnd: false,
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
}

/**
 * Handles invoice.payment_succeeded event.
 * Ensures subscription status is active after successful payment.
 */
export async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  await db
    .update(subscriptions)
    .set({ status: "active" })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
}

/**
 * Handles invoice.payment_failed event.
 * Logs the failure. The subscription status will be updated by
 * customer.subscription.updated webhook when Stripe changes it.
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)

  console.warn(
    `Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`
  )
  // Stripe will send customer.subscription.updated if status changes
  // (e.g., to past_due), which handleSubscriptionChange will process.
}
