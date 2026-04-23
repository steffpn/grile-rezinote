"use client"

import { useTransition, useState } from "react"
import {
  cancelSubscription,
  reactivateSubscription,
  switchSubscriptionPlan,
} from "@/lib/stripe/actions"
import type { BillingCycle, PlanTier } from "@/lib/subscription/tiers"

interface ManageSubscriptionProps {
  status: string
  tier: PlanTier
  planType: string | null
  cancelAtPeriodEnd: boolean
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

  function runAction(
    fn: () => Promise<unknown>,
    successText: string
  ) {
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
              : "A aparut o eroare. Incearca din nou.",
        })
      }
    })
  }

  function handleCancel() {
    setShowCancelConfirm(false)
    runAction(
      () => cancelSubscription(),
      "Abonamentul se va anula la sfarsitul perioadei de facturare."
    )
  }

  function handleReactivate() {
    runAction(
      () => reactivateSubscription(),
      "Abonamentul a fost reactivat cu succes!"
    )
  }

  function handleSwitchCycle() {
    if (tier === "FREE") return
    const newCycle: BillingCycle = planType === "monthly" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan(tier, newCycle),
      "Ciclul de facturare a fost schimbat cu succes!"
    )
  }

  function handleUpgradeToPremium() {
    const cycle: BillingCycle = planType === "annual" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan("PREMIUM", cycle),
      "Ai trecut la PREMIUM cu succes!"
    )
  }

  function handleDowngradeToPro() {
    const cycle: BillingCycle = planType === "annual" ? "annual" : "monthly"
    runAction(
      () => switchSubscriptionPlan("PRO", cycle),
      "Ai trecut la PRO. Diferenta se va regla la urmatoarea facturare."
    )
  }

  if (!isActive || tier === "FREE") {
    return null
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upgrade / downgrade between tiers */}
      {tier === "PRO" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h3 className="mb-2 font-semibold">Treci la PREMIUM</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Deblocheaza dashboard-ul pe capitole si subcapitole, clasamentele
            intre utilizatori si modulul Admitere cu estimarea sanselor.
          </p>
          <button
            onClick={handleUpgradeToPremium}
            disabled={isPending}
            className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Se proceseaza..." : "Fa upgrade la PREMIUM"}
          </button>
        </div>
      )}

      {tier === "PREMIUM" && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 font-semibold">Downgrade la PRO</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Pierzi accesul la analiza pe capitole/subcapitole, clasamente si
            modulul Admitere. Diferenta de pret se regleaza prin proratare.
          </p>
          <button
            onClick={handleDowngradeToPro}
            disabled={isPending}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Se proceseaza..." : "Treci la PRO"}
          </button>
        </div>
      )}

      {/* Switch billing cycle */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-2 font-semibold">Schimba ciclul de facturare</h3>
        {planType === "monthly" ? (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Treci la abonamentul anual si economiseste 20%.
            </p>
            <button
              onClick={handleSwitchCycle}
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Se proceseaza..." : "Treci la plata anuala"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Treci la abonamentul lunar. Diferenta se regleaza prin proratare.
            </p>
            <button
              onClick={handleSwitchCycle}
              disabled={isPending}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Se proceseaza..." : "Treci la plata lunara"}
            </button>
          </div>
        )}
      </div>

      {/* Cancel / Reactivate */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-2 font-semibold">
          {isCancelling ? "Reactiveaza abonamentul" : "Anuleaza abonamentul"}
        </h3>

        {isCancelling ? (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Abonamentul tau este programat sa se anuleze. Poti reactiva
              pentru a continua fara intrerupere.
            </p>
            <button
              onClick={handleReactivate}
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Se proceseaza..." : "Reactiveaza abonamentul"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Daca anulezi, vei avea acces pana la sfarsitul perioadei de
              facturare curente, apoi contul tau trece pe planul FREE.
            </p>

            {showCancelConfirm ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Se proceseaza..." : "Confirm anularea"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isPending}
                  className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Renunta
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Anuleaza abonamentul
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
