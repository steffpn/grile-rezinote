import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { MonoLabel } from "@/components/branded"
import type { PlanTier } from "@/lib/subscription/tiers"
import { cn } from "@/lib/utils"

interface SubscriptionStatusProps {
  status: string
  tier: PlanTier
  planType: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialDaysRemaining?: number
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activ",
  trialing: "Trial",
  cancelling: "Se anulează",
  expired: "Expirat",
  inactive: "Inactiv",
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-neon/14 text-neon",
  trialing: "bg-neon/12 text-neon",
  cancelling: "bg-warm/15 text-warm",
  expired: "bg-danger/15 text-danger",
  inactive: "bg-bg-3 text-fg-mute",
}

const TIER_TONE: Record<PlanTier, string> = {
  FREE: "bg-bg-3 text-fg-dim",
  PRO: "bg-neon/14 text-neon",
  PREMIUM: "bg-warm/14 text-warm",
}

export function SubscriptionStatus({
  status,
  tier,
  planType,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  trialDaysRemaining,
}: SubscriptionStatusProps) {
  const displayStatus =
    cancelAtPeriodEnd && status === "active"
      ? "cancelling"
      : status === "cancelled"
        ? "expired"
        : status

  const isPlainFree = tier === "FREE" && status !== "trialing"

  const cycleLabel =
    planType === "annual" ? "Anual" : planType === "monthly" ? "Lunar" : null

  return (
    <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <MonoLabel size="cell">Plan curent</MonoLabel>
          <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.015em] text-fg">
            Starea abonamentului
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-[3px] px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-mono-tight",
              TIER_TONE[tier],
            )}
          >
            {tier}
          </span>
          {!isPlainFree && (
            <span
              className={cn(
                "rounded-[3px] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-mono-tight",
                STATUS_TONE[displayStatus] ?? STATUS_TONE.inactive,
              )}
            >
              {STATUS_LABELS[displayStatus] ?? displayStatus}
            </span>
          )}
        </div>
      </div>

      <dl className="mt-5 space-y-2.5 text-[14px]">
        {cycleLabel && (
          <Row label="Ciclu de facturare" value={cycleLabel} />
        )}
        {currentPeriodEnd && (
          <Row
            label={cancelAtPeriodEnd ? "Acces până la" : "Următoarea facturare"}
            value={formatDate(currentPeriodEnd)}
          />
        )}
        {trialDaysRemaining !== undefined && trialDaysRemaining > 0 && (
          <Row
            label="Zile rămase trial"
            value={
              <span className="font-mono text-neon">
                {trialDaysRemaining}
              </span>
            }
          />
        )}
      </dl>

      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="mt-5 flex items-start gap-2.5 rounded-[10px] border border-warm/30 bg-warm/8 px-3.5 py-3 text-[13px] leading-[1.55]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warm" />
          <span className="text-fg-dim">
            Abonamentul se va anula pe{" "}
            <span className="text-fg">{formatDate(currentPeriodEnd)}</span>.
            Vei avea acces până atunci, apoi contul trece pe FREE.
          </span>
        </div>
      )}

      {tier === "FREE" && status !== "trialing" && (
        <div className="mt-5 rounded-[10px] border border-neon/25 bg-neon/8 px-3.5 py-3 text-[13px] leading-[1.55]">
          <span className="text-fg-dim">
            Plan FREE · 20 întrebări/zi.{" "}
          </span>
          <Link
            href="/pricing"
            className="font-medium text-neon underline-offset-2 hover:underline"
          >
            Activează PRO sau PREMIUM
          </Link>{" "}
          <span className="text-fg-dim">pentru acces complet.</span>
        </div>
      )}

      {displayStatus === "expired" && tier !== "FREE" && (
        <div className="mt-5 rounded-[10px] border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] leading-[1.55] text-fg-dim">
          Abonamentul a expirat.{" "}
          <Link
            href="/pricing"
            className="font-medium text-danger underline-offset-2 hover:underline"
          >
            Reabonează-te
          </Link>{" "}
          pentru a recupera accesul.
        </div>
      )}
    </section>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-fg-mute">{label}</dt>
      <dd className="font-mono text-[13px] text-fg">{value}</dd>
    </div>
  )
}
