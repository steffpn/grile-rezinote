"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { createCheckoutSessionForTier } from "@/lib/stripe/actions"
import type { BillingCycle, PlanTier } from "@/lib/subscription/tiers"

interface PricingCardProps {
  tier: PlanTier
  cycle: BillingCycle
  /** Formatted monthly-equivalent price (e.g., "119", "95", "—"). */
  displayPrice: string
  /** Line under the price (e.g., "/luna" or "/luna, platit anual"). */
  periodLabel: string
  /** Crossed-out original monthly price when showing annual discount. */
  originalMonthlyPrice?: string
  /** Badge text (e.g., "20% reducere"). Empty when none. */
  discountBadge?: string
  /** Tagline shown under the tier name. */
  tagline: string
  features: string[]
  cta: string
  popular?: boolean
  /** Whether the current user is already logged in (affects FREE CTA destination). */
  isAuthenticated: boolean
}

export function PricingCard({
  tier,
  cycle,
  displayPrice,
  periodLabel,
  originalMonthlyPrice,
  discountBadge,
  tagline,
  features,
  cta,
  popular = false,
  isAuthenticated,
}: PricingCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubscribe() {
    if (tier === "FREE") return
    startTransition(async () => {
      await createCheckoutSessionForTier(tier, cycle)
    })
  }

  const freeHref = isAuthenticated ? "/dashboard" : "/signup"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow sm:p-8 ${
        popular
          ? "border-primary/70 shadow-lg ring-2 ring-primary/40 hover:shadow-xl hover:shadow-primary/15"
          : "border-border hover:shadow-lg"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-semibold text-white shadow">
          <Sparkles className="h-3 w-3" />
          Cel mai popular
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-tight">{tier}</h3>
          {discountBadge && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {discountBadge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">
            {displayPrice}
          </span>
          {tier !== "FREE" && (
            <span className="text-lg text-muted-foreground">RON</span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
        {originalMonthlyPrice && (
          <p className="mt-1 text-sm text-muted-foreground line-through">
            {originalMonthlyPrice} RON/luna
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {tier === "FREE" ? (
        <Link
          href={freeHref}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          {cta}
        </Link>
      ) : (
        <form action={handleSubscribe}>
          <button
            type="submit"
            disabled={isPending}
            className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              popular
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isPending ? "Se incarca..." : cta}
          </button>
        </form>
      )}
    </motion.div>
  )
}
