"use client"

import { useState } from "react"
import { PricingCard } from "./PricingCard"
import type { BillingCycle } from "@/lib/subscription/tiers"
import {
  resolveDisplayPrice,
  resolvePeriodLabel,
  resolveOriginalPrice,
  resolveDiscountBadge,
  type PricingCardModel,
} from "@/lib/subscription/pricing-model"

export type { PricingCardModel }

interface BillingCycleToggleProps {
  tiers: PricingCardModel[]
  isAuthenticated: boolean
  /** When false (pre-launch) anonymous CTAs point at the waitlist. */
  registrationOpen: boolean
}

/**
 * Client-side toggle between monthly and annual billing. Re-renders pricing
 * cards with the selected cycle. All prices flow through props from the
 * server component so the client bundle never sees the Stripe secret.
 */
export function BillingCycleToggle({
  tiers,
  isAuthenticated,
  registrationOpen,
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
              registrationOpen={registrationOpen}
            />
          )
        })}
      </div>
    </div>
  )
}
