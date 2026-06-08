import { stripe } from "@/lib/stripe/client"
import { STRIPE_CONFIG } from "@/lib/stripe/config"
import { TIER_DISPLAY, type PlanTier } from "@/lib/subscription/tiers"
import type { PricingCardModel } from "@/lib/subscription/pricing-model"

type LivePrice = {
  amount: number
  currency: string
  interval: string | null
}

async function fetchPrice(
  priceId: string | undefined,
): Promise<LivePrice | null> {
  if (!priceId || !process.env.STRIPE_SECRET_KEY) return null
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.unit_amount) return null
    return {
      amount: Math.round(price.unit_amount / 100),
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval ?? null,
    }
  } catch (err) {
    console.error("[pricing] stripe.prices.retrieve failed:", err)
    return null
  }
}

/**
 * Builds the per-tier pricing model from the LIVE Stripe prices, falling back
 * to {@link TIER_DISPLAY} when a price isn't configured. This is the single
 * server-side source of truth consumed by both `/pricing` and the landing
 * pricing section, so the two surfaces always render identical numbers.
 *
 * Prices are fetched server-side (never in the client bundle) so a tampered
 * client cannot misrepresent pricing.
 */
export async function getTierPricing(): Promise<PricingCardModel[]> {
  const [proMonthly, proAnnual, premiumMonthly, premiumAnnual] =
    await Promise.all([
      fetchPrice(STRIPE_CONFIG.proMonthlyPriceId),
      fetchPrice(STRIPE_CONFIG.proAnnualPriceId),
      fetchPrice(STRIPE_CONFIG.premiumMonthlyPriceId),
      fetchPrice(STRIPE_CONFIG.premiumAnnualPriceId),
    ])

  return (["FREE", "PRO", "PREMIUM"] as PlanTier[]).map((tier) => {
    const display = TIER_DISPLAY[tier]
    const live =
      tier === "PRO"
        ? { monthly: proMonthly, annual: proAnnual }
        : tier === "PREMIUM"
          ? { monthly: premiumMonthly, annual: premiumAnnual }
          : { monthly: null, annual: null }

    return {
      tier,
      tagline: display.tagline,
      features: display.features,
      cta: display.cta,
      popular: display.popular,
      fallbackMonthlyPrice: display.monthlyPrice,
      annualDiscountPct: display.annualDiscountPct,
      prices: {
        monthlyAmount: live.monthly?.amount ?? null,
        annualAmount: live.annual?.amount ?? null,
        annualMonthlyEquivalent: live.annual?.amount
          ? Math.round(live.annual.amount / 12)
          : null,
      },
    }
  })
}
