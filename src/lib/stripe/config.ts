export const STRIPE_CONFIG = {
  monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
  annualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
  currency: "ron" as const,
  // TODO PRE-PROD: revert to 7 days before production launch (currently extended for testing)
  trialDays: 45,
  get successUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`
  },
  get cancelUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
  },
} as const
