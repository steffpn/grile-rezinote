"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react"
import { TIER_DISPLAY, type PlanTier } from "@/lib/subscription/tiers"

const tierOrder: PlanTier[] = ["FREE", "PRO", "PREMIUM"]

const tierIcon: Record<PlanTier, typeof Sparkles> = {
  FREE: Sparkles,
  PRO: Sparkles,
  PREMIUM: Crown,
}

export function PricingPreview() {
  return (
    <section id="pricing" className="relative py-20 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Planuri si preturi
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Alege planul{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                potrivit pentru tine
              </span>
            </h2>
            <p className="mt-4 text-pretty text-base text-white/50 sm:text-lg">
              Indiferent de nivelul tau actual, ai instrumentele necesare sa
              obtii un scor competitiv la Rezidentiat.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {tierOrder.map((tier, i) => {
            const display = TIER_DISPLAY[tier]
            const Icon = tierIcon[tier]
            const isPopular = display.popular
            const isPremium = tier === "PREMIUM"

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                whileHover={{ y: -4 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all sm:p-8 ${
                  isPopular
                    ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/30"
                    : isPremium
                      ? "border-amber-400/30 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03]"
                      : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-px left-0 right-0 mx-auto w-fit rounded-b-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Cel mai popular
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isPremium
                        ? "bg-gradient-to-br from-amber-400/20 to-orange-500/20 ring-1 ring-amber-300/30"
                        : isPopular
                          ? "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 ring-1 ring-emerald-300/30"
                          : "bg-white/[0.04] ring-1 ring-white/10"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isPremium
                          ? "text-amber-300"
                          : isPopular
                            ? "text-emerald-300"
                            : "text-white/70"
                      }`}
                    />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {tier}
                  </h3>
                </div>

                <p className="mb-5 text-sm text-white/55">{display.tagline}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {display.monthlyPrice}
                    </span>
                    {tier !== "FREE" && (
                      <span className="text-base text-white/45">RON</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    {tier === "FREE"
                      ? "Pentru totdeauna"
                      : "/luna · 20% reducere la plata anuala"}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-2.5">
                  {display.features.slice(0, 5).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-white/70"
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          isPremium
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {display.features.length > 5 && (
                    <li className="flex items-start gap-2 text-sm text-white/45">
                      <span className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="italic">
                        + {display.features.length - 5} alte beneficii
                      </span>
                    </li>
                  )}
                </ul>

                <Link
                  href={tier === "FREE" ? "/signup" : "/pricing"}
                  className={`group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    isPopular
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                      : isPremium
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
                        : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/25"
                  }`}
                >
                  {display.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center text-sm text-white/40"
        >
          7 zile trial PRO gratuit la primul abonament · Anulezi oricand · Fara
          costuri ascunse
        </motion.p>
      </div>
    </section>
  )
}
