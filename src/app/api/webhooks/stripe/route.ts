import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe/client"
import { db } from "@/lib/db"
import { webhookEvents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  handleSubscriptionChange,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from "@/lib/stripe/webhook-handlers"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Idempotency check: skip already-processed events
  const [existing] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, event.id))
    .limit(1)

  if (existing) {
    return NextResponse.json({ received: true, deduplicated: true })
  }

  // Record event ID before processing to prevent duplicate handling
  try {
    await db.insert(webhookEvents).values({
      stripeEventId: event.id,
      type: event.type,
    })
  } catch {
    // Unique constraint violation means another request already inserted it
    return NextResponse.json({ received: true, deduplicated: true })
  }

  // Process event
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription
        )
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // Unhandled event type — acknowledge receipt
        break
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err)
    // Still return 200 to prevent Stripe from retrying.
    // The event is already recorded as processed.
  }

  return NextResponse.json({ received: true })
}
