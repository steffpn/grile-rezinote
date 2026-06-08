"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BillingCycle } from "@/lib/subscription/tiers"
import {
  resolveDisplayPrice,
  resolveOriginalPrice,
  resolveAnnualTotal,
  type PricingCardModel,
} from "@/lib/subscription/pricing-model"

interface LandingPricingProps {
  tiers: PricingCardModel[]
}

/**
 * Landing pricing section, styled in the landing's neon system. Prices flow in
 * from the server (`getTierPricing`) — the SAME source `/pricing` uses — so the
 * two pages can never show different numbers. Paid CTAs route to `/pricing`
 * where the real Stripe checkout lives.
 */
export function LandingPricing({ tiers }: LandingPricingProps) {
  const [cycle, setCycle] = useState<BillingCycle>("annual")

  return (
    <div className="space-y-10">
      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-line bg-bg-2 p-1 font-mono text-[12px] uppercase tracking-mono-tight">
          <button
            type="button"
            aria-pressed={cycle === "monthly"}
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-full px-5 py-2 transition-colors",
              cycle === "monthly"
                ? "bg-neon text-bg"
                : "text-fg-mute hover:text-fg",
            )}
          >
            Lunar
          </button>
          <button
            type="button"
            aria-pressed={cycle === "annual"}
            onClick={() => setCycle("annual")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-5 py-2 transition-colors",
              cycle === "annual"
                ? "bg-neon text-bg"
                : "text-fg-mute hover:text-fg",
            )}
          >
            Anual
            <span
              className={cn(
                "rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-bold tracking-mono-tight",
                cycle === "annual"
                  ? "bg-bg/20 text-bg"
                  : "bg-neon/15 text-neon",
              )}
            >
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => {
          const isFree = t.tier === "FREE"
          const isPopular = Boolean(t.popular)
          const price = resolveDisplayPrice(t, cycle)
          const original = resolveOriginalPrice(t, cycle)
          const annualTotal =
            cycle === "annual" ? resolveAnnualTotal(t) : undefined
          const href = isFree ? "/signup?source=landing-pricing" : "/pricing"

          return (
            <div
              key={t.tier}
              className={cn(
                "relative flex flex-col rounded-[18px] border bg-bg-2 p-8",
                isPopular
                  ? "border-neon/40 shadow-killer ring-1 ring-neon/30"
                  : "border-line",
              )}
            >
              {isPopular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-[6px] bg-neon px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-mono-tight text-bg">
                  Cel mai popular
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[15px] font-bold uppercase tracking-mono text-fg">
                  {t.tier}
                </h3>
                {cycle === "annual" && !isFree && (
                  <span className="rounded-[3px] bg-neon/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-mono-tight text-neon">
                    −20%
                  </span>
                )}
              </div>
              <p className="mt-1.5 min-h-[34px] text-[13px] leading-[1.4] text-fg-dim">
                {t.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="font-mono text-[52px] font-semibold leading-none tracking-[-0.04em] text-fg">
                  {price}
                </span>
                {!isFree && (
                  <span className="font-mono text-[20px] text-fg-dim">RON</span>
                )}
              </div>
              <div className="mt-1.5 min-h-[18px] font-mono text-[12px] text-fg-mute">
                {isFree
                  ? "Pentru totdeauna"
                  : cycle === "monthly"
                    ? "pe lună · facturat lunar"
                    : `pe lună · ${annualTotal ?? ""} RON anual`}
                {original && (
                  <>
                    {" · "}
                    <s className="opacity-50">{original} RON</s>
                  </>
                )}
              </div>

              <ul className="my-6 flex flex-col gap-2.5 border-y border-line py-5 text-[13.5px]">
                {t.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-fg-dim"
                  >
                    <span className="mt-0.5 shrink-0 text-neon">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  asChild
                  size="lg"
                  variant={isPopular ? "default" : "outline"}
                  className="w-full"
                >
                  <Link href={href}>{t.cta}</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-mono-tight text-fg-mute">
        7 zile trial gratuit · card cerut doar la final · anulezi oricând
      </p>
    </div>
  )
}
