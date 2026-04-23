"use client"

import { useState } from "react"
import { PricingCard } from "./PricingCard"
import type { BillingCycle, PlanTier } from "@/lib/subscription/tiers"

type TierPriceData = {
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
  /** Display fallback when Stripe price not configured yet. */
  fallbackMonthlyPrice: number
  annualDiscountPct: number
}

interface BillingCycleToggleProps {
  tiers: PricingCardModel[]
  isAuthenticated: boolean
}

/**
 * Client-side toggle between monthly and annual billing. Re-renders pricing
 * cards with the selected cycle. All prices flow through props from the
 * server component so the client bundle never sees the Stripe secret.
 */
export function BillingCycleToggle({
  tiers,
  isAuthenticated,
}: BillingCycleToggleProps) {
  const [cycle, setCycle] = useState<BillingCycle>("annual")

  return (
    <div className="space-y-10">
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              cycle === "monthly"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lunar
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              cycle === "annual"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
        {tiers.map((t) => {
          const displayPrice = resolveDisplayPrice(t, cycle)
          const periodLabel = resolvePeriodLabel(t.tier, cycle)
          const originalMonthlyPrice = resolveOriginalPrice(t, cycle)
          const discountBadge = resolveDiscountBadge(t, cycle)

          return (
            <PricingCard
              key={t.tier}
              tier={t.tier}
              cycle={cycle}
              displayPrice={displayPrice}
              periodLabel={periodLabel}
              originalMonthlyPrice={originalMonthlyPrice}
              discountBadge={discountBadge}
              tagline={t.tagline}
              features={t.features}
              cta={t.cta}
              popular={t.popular}
              isAuthenticated={isAuthenticated}
            />
          )
        })}
      </div>
    </div>
  )
}

function resolveDisplayPrice(t: PricingCardModel, cycle: BillingCycle): string {
  if (t.tier === "FREE") return "0"

  if (cycle === "monthly") {
    const amount = t.prices.monthlyAmount ?? t.fallbackMonthlyPrice
    return amount.toString()
  }

  // Annual — show monthly-equivalent price
  if (t.prices.annualMonthlyEquivalent != null) {
    return t.prices.annualMonthlyEquivalent.toString()
  }

  // Fallback computed from the 20% discount if Stripe not configured yet.
  const fallback = Math.round(t.fallbackMonthlyPrice * (1 - t.annualDiscountPct))
  return fallback.toString()
}

function resolvePeriodLabel(tier: PlanTier, cycle: BillingCycle): string {
  if (tier === "FREE") return "Pentru totdeauna"
  return cycle === "monthly" ? "/luna" : "/luna, platit anual"
}

function resolveOriginalPrice(
  t: PricingCardModel,
  cycle: BillingCycle
): string | undefined {
  if (t.tier === "FREE" || cycle !== "annual") return undefined
  const amount = t.prices.monthlyAmount ?? t.fallbackMonthlyPrice
  return amount.toString()
}

function resolveDiscountBadge(
  t: PricingCardModel,
  cycle: BillingCycle
): string | undefined {
  if (t.tier === "FREE") return undefined
  if (cycle !== "annual") return undefined
  return "20% reducere"
}
