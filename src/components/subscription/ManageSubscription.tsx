"use client"

import { useTransition, useState } from "react"
import {
  cancelSubscription,
  reactivateSubscription,
  switchBillingCycle,
} from "@/lib/stripe/actions"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

interface ManageSubscriptionProps {
  status: string
  planType: string | null
  cancelAtPeriodEnd: boolean
}

export function ManageSubscription({
  status,
  planType,
  cancelAtPeriodEnd,
}: ManageSubscriptionProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const isActive = status === "active"
  const isCancelling = cancelAtPeriodEnd && isActive

  function handleCancel() {
    setShowCancelConfirm(false)
    startTransition(async () => {
      try {
        await cancelSubscription()
        setMessage({
          type: "success",
          text: "Abonamentul se va anula la sfarsitul perioadei de facturare.",
        })
        // Reload to reflect new state
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

  function handleReactivate() {
    startTransition(async () => {
      try {
        await reactivateSubscription()
        setMessage({
          type: "success",
          text: "Abonamentul a fost reactivat cu succes!",
        })
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

  function handleSwitch() {
    const newPriceId =
      planType === "monthly"
        ? STRIPE_CONFIG.annualPriceId
        : STRIPE_CONFIG.monthlyPriceId

    startTransition(async () => {
      try {
        await switchBillingCycle(newPriceId)
        setMessage({
          type: "success",
          text: "Planul a fost schimbat cu succes!",
        })
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

  if (!isActive) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
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

      {/* Switch billing cycle */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-2 font-semibold">Schimba planul</h3>
        {planType === "monthly" ? (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Treci la abonamentul anual si economiseste. Platesti pentru 8
              luni, primesti 12.
            </p>
            <button
              onClick={handleSwitch}
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Se proceseaza..." : "Treci la planul anual"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Treci la abonamentul lunar. Diferenta de pret se calculeaza
              automat.
            </p>
            <button
              onClick={handleSwitch}
              disabled={isPending}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Se proceseaza..." : "Treci la planul lunar"}
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
              Abonamentul tau este programat sa se anuleze. Poti reactiva pentru
              a continua fara intrerupere.
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
              facturare curente.
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
