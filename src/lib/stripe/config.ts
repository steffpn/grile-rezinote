import { getAppUrl } from "@/lib/env-url"

export const STRIPE_CONFIG = {
  // Tier-aware price IDs (source of truth for checkout + webhook tier mapping).
  proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  proAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  premiumMonthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  premiumAnnualPriceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  currency: "ron" as const,
  // 7 days — applies to both PRO and PREMIUM trials.
  trialDays: 7,
  get successUrl() {
    return `${getAppUrl() ?? ""}/checkout/success`
  },
  get cancelUrl() {
    return `${getAppUrl() ?? ""}/pricing`
  },
} as const
