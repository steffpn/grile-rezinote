"use client"

import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { createCheckoutSession } from "@/lib/stripe/actions"
import { useTransition } from "react"

interface PricingCardProps {
  name: string
  price: string
  period: string
  priceId: string
  features: string[]
  popular?: boolean
  discount?: string
  originalPrice?: string
}

export function PricingCard({
  name,
  price,
  period,
  priceId,
  features,
  popular = false,
  discount,
  originalPrice,
}: PricingCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubscribe() {
    startTransition(async () => {
      await createCheckoutSession(priceId)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className={`relative flex flex-col rounded-lg border p-8 transition-shadow ${
        popular
          ? "border-primary shadow-lg ring-1 ring-primary hover:shadow-xl hover:shadow-primary/15"
          : "border-border hover:shadow-lg"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Cel mai popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold">{name}</h3>
        {discount && (
          <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
            {discount}
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-lg text-muted-foreground">RON</span>
        </div>
        <p className="text-sm text-muted-foreground">{period}</p>
        {originalPrice && (
          <p className="mt-1 text-sm text-muted-foreground line-through">
            {originalPrice} RON/luna
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <form action={handleSubscribe}>
        <button
          type="submit"
          disabled={isPending}
          className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            popular
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isPending ? "Se incarca..." : "Aboneaza-te"}
        </button>
      </form>
    </motion.div>
  )
}
