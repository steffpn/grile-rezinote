/**
 * Single source of truth for subscription tiers.
 *
 * Three tiers (per product requirements):
 *   - FREE     — 20 intrebari/zi, fara simulari, fara statistici
 *   - PRO      — nelimitat + simulari + greselile mele + dashboard general
 *   - PREMIUM  — PRO + analiza pe capitole/subcapitole + clasament + admitere
 */

export type PlanTier = "FREE" | "PRO" | "PREMIUM"
export type BillingCycle = "monthly" | "annual"

export const PLAN_TIERS: readonly PlanTier[] = ["FREE", "PRO", "PREMIUM"] as const

const TIER_RANK: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
}

/** Returns true if `userTier` is at least `requiredTier` in the hierarchy. */
export function hasTierAtLeast(
  userTier: PlanTier,
  requiredTier: PlanTier
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier]
}

/** Daily question limit enforced for FREE users; null means unlimited. */
export const FREE_DAILY_QUESTION_LIMIT = 20

/**
 * Feature matrix per tier. Source of truth for what each tier unlocks.
 *
 * NOTE: `chapterStats` lives on PREMIUM only (moved from PRO per product
 * owner request — PRO keeps the general dashboard without per-chapter depth).
 */
export const TIER_FEATURES = {
  FREE: {
    chapterQuizzes: true,
    dailyQuestionLimit: FREE_DAILY_QUESTION_LIMIT as number | null,
    simulations: false,
    testHistory: false,
    myMistakes: false,
    generalDashboard: false,
    chapterStats: false,
    subchapterStats: false,
    ranking: false,
    admissionModule: false,
    admissionChanceEstimate: false,
    advancedMistakeAnalysis: false,
  },
  PRO: {
    chapterQuizzes: true,
    dailyQuestionLimit: null as number | null,
    simulations: true,
    testHistory: true,
    myMistakes: true,
    generalDashboard: true,
    chapterStats: false,
    subchapterStats: false,
    ranking: false,
    admissionModule: false,
    admissionChanceEstimate: false,
    advancedMistakeAnalysis: false,
  },
  PREMIUM: {
    chapterQuizzes: true,
    dailyQuestionLimit: null as number | null,
    simulations: true,
    testHistory: true,
    myMistakes: true,
    generalDashboard: true,
    chapterStats: true,
    subchapterStats: true,
    ranking: true,
    admissionModule: true,
    admissionChanceEstimate: true,
    advancedMistakeAnalysis: true,
  },
} as const

export type TierFeatures = (typeof TIER_FEATURES)[PlanTier]
export type FeatureKey = keyof TierFeatures

/**
 * Display metadata used by the pricing page and paywalls.
 * Prices here are fallbacks; the live source of truth is Stripe (fetched server-side).
 */
export const TIER_DISPLAY: Record<
  PlanTier,
  {
    name: string
    tagline: string
    description: string
    monthlyPrice: number
    annualDiscountPct: number
    popular?: boolean
    cta: string
    features: string[]
  }
> = {
  FREE: {
    name: "FREE",
    tagline: "Acces de baza",
    description: "Incepe gratuit si testeaza platforma",
    monthlyPrice: 0,
    annualDiscountPct: 0,
    cta: "Incepe gratuit",
    features: [
      "Acces limitat la grile pe capitole",
      "20 intrebari / zi",
      "Vizualizare partiala a continutului",
      "Fara simulari si statistici",
    ],
  },
  PRO: {
    name: "PRO",
    tagline: "Tot ce ai nevoie pentru a reusi",
    description: "Pregateste-te eficient cu acces complet",
    monthlyPrice: 119,
    annualDiscountPct: 0.2,
    popular: true,
    cta: "Activeaza PRO",
    features: [
      "Acces nelimitat la toate grilele pe capitole",
      "Simulari de examen cu cronometru real",
      "Dashboard cu progres general",
      "Istoric complet al testelor si raspunsurilor",
      'Functia "Greselile mele" — reia si corecteaza erorile',
      "Monitorizarea evolutiei tale in timp",
    ],
  },
  PREMIUM: {
    name: "PREMIUM",
    tagline: "Avantaj real in fata concurentei",
    description: "Depaseste nivelul standard si vezi unde te situezi",
    monthlyPrice: 179,
    annualDiscountPct: 0.2,
    cta: "Treci la PREMIUM",
    features: [
      "Tot ce include PRO",
      "Dashboard avansat cu analiza pe capitole si subcapitole",
      "Clasamente intre utilizatori si percentile",
      'Modul "Admitere" — afla unde te-ai fi clasat in anii precedenti',
      "Estimare sanse de admitere pe baza simularilor",
      "Analiza detaliata a greselilor si recomandari de invatare",
    ],
  },
}

/**
 * Resolves a Stripe price ID → { tier, cycle }.
 * Used by the webhook to tag DB rows with the correct tier.
 * Returns null for unknown price IDs (logged + skipped by the caller).
 */
export function resolveStripePriceId(priceId: string): {
  tier: Exclude<PlanTier, "FREE">
  cycle: BillingCycle
} | null {
  const env = {
    proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    proAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    premiumMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premiumAnnual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  }

  if (env.proMonthly && priceId === env.proMonthly)
    return { tier: "PRO", cycle: "monthly" }
  if (env.proAnnual && priceId === env.proAnnual)
    return { tier: "PRO", cycle: "annual" }
  if (env.premiumMonthly && priceId === env.premiumMonthly)
    return { tier: "PREMIUM", cycle: "monthly" }
  if (env.premiumAnnual && priceId === env.premiumAnnual)
    return { tier: "PREMIUM", cycle: "annual" }

  return null
}

/**
 * Returns the Stripe price ID for a given (tier, cycle). Null if env var is
 * missing — callers should treat this as a configuration error.
 */
export function getStripePriceId(
  tier: Exclude<PlanTier, "FREE">,
  cycle: BillingCycle
): string | null {
  const key =
    tier === "PRO"
      ? cycle === "monthly"
        ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.STRIPE_PRO_ANNUAL_PRICE_ID
      : cycle === "monthly"
        ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
        : process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
  return key ?? null
}
