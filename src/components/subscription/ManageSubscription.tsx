"use client"

import { useState, useTransition } from "react"
import { ArrowRight, CreditCard, RefreshCw, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MonoLabel } from "@/components/branded"
import {
  cancelSubscription,
  createPortalSession,
  reactivateSubscription,
  switchSubscriptionPlan,
} from "@/lib/stripe/actions"
import type { BillingCycle, PlanTier } from "@/lib/subscription/tiers"
import { cn } from "@/lib/utils"

interface ManageSubscriptionProps {
  status: string
  tier: PlanTier
  planType: string | null
  cancelAtPeriodEnd: boolean
}

function ManageCard({
  label,
  title,
  description,
  children,
  tone = "default",
}: {
  label: string
  title: string
  description: string
  children: React.ReactNode
  tone?: "default" | "highlight" | "danger"
}) {
  return (
    <section
      className={cn(
        "rounded-[14px] border p-5 sm:p-6",
        tone === "highlight" && "border-neon/30 bg-neon/6",
        tone === "danger" && "border-danger/25 bg-danger/6",
        tone === "default" && "border-line bg-bg-2",
      )}
    >
      <MonoLabel size="cell">{label}</MonoLabel>
      <h3 className="mt-1.5 text-[16px] font-semibold tracking-[-0.015em] text-fg">
        {title}
      </h3>
      <p className="mt-1 text-[13.5px] leading-[1.55] text-fg-dim">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function ManageSubscription({
  status,
  tier,
  planType,
  cancelAtPeriodEnd,
}: ManageSubscriptionProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const isActive = status === "active" || status === "trialing"
  const isCancelling = cancelAtPeriodEnd && isActive

  function runAction(fn: () => Promise<unknown>, successText: string) {
    startTransition(async () => {
      try {
        await fn()
        setMessage({ type: "success", text: successText })
        window.location.reload()
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "A apărut o eroare. Încearcă din nou.",
        })
      }
    })
  }

  function handleCancel() {
    setShowCancelConfirm(false)
    runAction(
      () => cancelSubscription(),
      "Abonamentul se va anula la sfârșitul perioadei de facturare.",
    )
  }

  function handleReactivate() {
    runAction(
      () => reactivateSubscription(),
      "Abonamentul a fost reactivat cu succes.",
    )
  }

  function handleSwitchCycle() {
    if (tier === "FREE") return
    const newCycle: BillingCycle =
      planType === "monthly" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan(tier, newCycle),
      "Ciclul de facturare a fost schimbat.",
    )
  }

  function handleUpgradeToPremium() {
    const cycle: BillingCycle = planType === "annual" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan("PREMIUM", cycle),
      "Ai trecut la PREMIUM.",
    )
  }

  function handleDowngradeToPro() {
    const cycle: BillingCycle = planType === "annual" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan("PRO", cycle),
      "Ai trecut la PRO. Diferența se va regla la următoarea facturare.",
    )
  }

  function handleOpenPortal() {
    startTransition(async () => {
      try {
        const { url } = await createPortalSession()
        window.location.href = url
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "Nu s-a putut deschide portalul.",
        })
      }
    })
  }

  if (!isActive || tier === "FREE") {
    return null
  }

  return (
    <div className="space-y-3">
      {message && (
        <div
          role="alert"
          className={cn(
            "rounded-[10px] border px-3.5 py-3 text-[13px]",
            message.type === "success"
              ? "border-neon/30 bg-neon/8 text-fg"
              : "border-danger/30 bg-danger/10 text-danger",
          )}
        >
          {message.text}
        </div>
      )}

      {/* Upgrade / downgrade between tiers */}
      {tier === "PRO" && (
        <ManageCard
          label="Upgrade"
          title="Treci la PREMIUM"
          description="Deblochează dashboard-ul pe capitole și subcapitole, clasamentele între utilizatori și modulul Admitere cu estimarea șanselor."
          tone="highlight"
        >
          <Button onClick={handleUpgradeToPremium} disabled={isPending}>
            <Sparkles className="size-4" />
            {isPending ? "Se procesează..." : "Fă upgrade la PREMIUM"}
          </Button>
        </ManageCard>
      )}

      {tier === "PREMIUM" && (
        <ManageCard
          label="Downgrade"
          title="Treci la PRO"
          description="Pierzi accesul la analiza pe capitole/subcapitole, clasamente și modulul Admitere. Diferența de preț se reglează prin proratare."
        >
          <Button
            variant="outline"
            onClick={handleDowngradeToPro}
            disabled={isPending}
          >
            {isPending ? "Se procesează..." : "Treci la PRO"}
          </Button>
        </ManageCard>
      )}

      {/* Stripe portal */}
      <ManageCard
        label="Card & facturi"
        title="Gestionează în Stripe"
        description="Actualizează metoda de plată, descarcă facturile și vezi istoricul plăților în portalul Stripe."
      >
        <Button
          variant="outline"
          onClick={handleOpenPortal}
          disabled={isPending}
        >
          <CreditCard className="size-4" />
          {isPending ? "Se deschide..." : "Deschide portalul Stripe"}
          <ArrowRight className="size-3.5" />
        </Button>
      </ManageCard>

      {/* Switch billing cycle */}
      <ManageCard
        label="Ciclu facturare"
        title={
          planType === "monthly"
            ? "Treci la anual și economisește"
            : "Treci la lunar"
        }
        description={
          planType === "monthly"
            ? "Treci la abonamentul anual și economisește 20%."
            : "Treci la abonamentul lunar. Diferența se reglează prin proratare."
        }
      >
        <Button
          variant={planType === "monthly" ? "default" : "secondary"}
          onClick={handleSwitchCycle}
          disabled={isPending}
        >
          <RefreshCw className="size-4" />
          {isPending
            ? "Se procesează..."
            : planType === "monthly"
              ? "Treci la plata anuală"
              : "Treci la plata lunară"}
        </Button>
      </ManageCard>

      {/* Cancel / Reactivate */}
      <ManageCard
        label={isCancelling ? "Reactivare" : "Anulare"}
        title={
          isCancelling
            ? "Reactivează abonamentul"
            : "Anulează abonamentul"
        }
        description={
          isCancelling
            ? "Abonamentul tău este programat să se anuleze. Poți reactiva pentru a continua fără întrerupere."
            : "Dacă anulezi, vei avea acces până la sfârșitul perioadei de facturare curente, apoi contul trece pe FREE."
        }
        tone={isCancelling ? "highlight" : "danger"}
      >
        {isCancelling ? (
          <Button onClick={handleReactivate} disabled={isPending}>
            <Sparkles className="size-4" />
            {isPending ? "Se procesează..." : "Reactivează"}
          </Button>
        ) : showCancelConfirm ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="size-4" />
              {isPending ? "Se procesează..." : "Confirm anularea"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              disabled={isPending}
            >
              Renunță
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(true)}
            className="border-danger/40 text-danger hover:bg-danger/8"
          >
            <X className="size-4" />
            Anulează abonamentul
          </Button>
        )}
      </ManageCard>
    </div>
  )
}
