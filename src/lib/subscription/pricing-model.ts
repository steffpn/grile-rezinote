/**
 * Shared, client-safe pricing presentation model + display resolvers.
 *
 * Lives apart from any Stripe/server code so BOTH the server price fetch
 * (`@/lib/stripe/tier-pricing`) and the client UIs (`/pricing` and the landing
 * pricing section) can import the same types and formatting logic. This is the
 * single source of truth for how a price renders, so the two pages can never
 * show different numbers again.
 */
import type { BillingCycle, PlanTier } from "@/lib/subscription/tiers"

export type TierPriceData = {
  monthlyAmount: number | null
  annualAmount: number | null
  annualMonthlyEquivalent: number | null
}

export type PricingCardModel = {
  tier: PlanTier
  tagline: string
  features: string[]
  cta: string
  popular?: boolean
  prices: TierPriceData
  /** Display fallback when the Stripe price is not configured yet. */
  fallbackMonthlyPrice: number
  annualDiscountPct: number
}

/** Formatted monthly-equivalent price string for the selected cycle. */
export function resolveDisplayPrice(
  t: PricingCardModel,
  cycle: BillingCycle,
): string {
  if (t.tier === "FREE") return "0"

  if (cycle === "monthly") {
    const amount = t.prices.monthlyAmount ?? t.fallbackMonthlyPrice
    return amount.toString()
  }

  // Annual — show monthly-equivalent price.
  if (t.prices.annualMonthlyEquivalent != null) {
    return t.prices.annualMonthlyEquivalent.toString()
  }

  // Fallback computed from the discount if Stripe is not configured yet.
  const fallback = Math.round(t.fallbackMonthlyPrice * (1 - t.annualDiscountPct))
  return fallback.toString()
}

export function resolvePeriodLabel(tier: PlanTier, cycle: BillingCycle): string {
  if (tier === "FREE") return "Pentru totdeauna"
  return cycle === "monthly" ? "/luna" : "/luna, platit anual"
}

/** Crossed-out original monthly price when showing the annual discount. */
export function resolveOriginalPrice(
  t: PricingCardModel,
  cycle: BillingCycle,
): string | undefined {
  if (t.tier === "FREE" || cycle !== "annual") return undefined
  const amount = t.prices.monthlyAmount ?? t.fallbackMonthlyPrice
  return amount.toString()
}

export function resolveDiscountBadge(
  t: PricingCardModel,
  cycle: BillingCycle,
): string | undefined {
  if (t.tier === "FREE") return undefined
  if (cycle !== "annual") return undefined
  return "20% reducere"
}

/** Total billed up front for the annual plan, in whole RON (e.g. 1140). */
export function resolveAnnualTotal(
  t: PricingCardModel,
): number | undefined {
  if (t.tier === "FREE") return undefined
  if (t.prices.annualAmount != null) return t.prices.annualAmount
  // Fallback: 12 × discounted monthly.
  return Math.round(t.fallbackMonthlyPrice * (1 - t.annualDiscountPct)) * 12
}
