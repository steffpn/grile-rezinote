import Link from "next/link"
import { Lock, Sparkles, Crown } from "lucide-react"
import type { PlanTier } from "@/lib/subscription/tiers"
import { TIER_DISPLAY } from "@/lib/subscription/tiers"
import { StartTrialBlockerButton } from "./StartTrialBlockerButton"

interface UpgradeBlockerProps {
  /** Tier required to unlock the feature. */
  requiredTier: Exclude<PlanTier, "FREE">
  /** Short title describing the gated feature (e.g. "Simulari de examen"). */
  title: string
  /** One-line pitch explaining what the user gets. */
  description: string
  /** Optional bullet list of benefits. Falls back to the tier's default features. */
  benefits?: string[]
  /**
   * Optional secondary action — e.g., for FREE users blocked from the
   * dashboard we want to nudge them toward /practice (their one available
   * feature) rather than only offer an upgrade.
   */
  alternativeAction?: {
    href: string
    label: string
  }
  /**
   * Show a "Start 7-day PRO trial" button alongside the upgrade CTA when the
   * user hasn't used their trial yet. Only meaningful for PRO gates — the
   * trial is PRO-only, so PREMIUM blockers never show it.
   */
  showStartTrial?: boolean
}

/**
 * In-page soft paywall shown when a logged-in user's tier is below what a
 * feature requires. Renders the upgrade value prop inline instead of
 * redirecting, so users understand what they'd unlock.
 */
export function UpgradeBlocker({
  requiredTier,
  title,
  description,
  benefits,
  alternativeAction,
  showStartTrial = false,
}: UpgradeBlockerProps) {
  const display = TIER_DISPLAY[requiredTier]
  const bullets = benefits ?? display.features
  const Icon = requiredTier === "PREMIUM" ? Crown : Sparkles

  const gradientClass =
    requiredTier === "PREMIUM"
      ? "from-amber-400 via-orange-500 to-rose-500"
      : "from-emerald-500 via-teal-500 to-cyan-500"

  const accentRing =
    requiredTier === "PREMIUM"
      ? "ring-amber-400/30"
      : "ring-emerald-500/30"

  // Trial CTA only makes sense for PRO gates — trial unlocks PRO, not PREMIUM.
  const canShowTrial = showStartTrial && requiredTier === "PRO"

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm ring-1 ${accentRing}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            requiredTier === "PREMIUM"
              ? "radial-gradient(60% 50% at 50% 10%, rgba(245,158,11,0.15), transparent 70%)"
              : "radial-gradient(60% 50% at 50% 10%, rgba(16,185,129,0.14), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClass} shadow-lg`}
        >
          <Lock className="h-6 w-6 text-white" />
        </div>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
          <Icon className="h-3.5 w-3.5" />
          Disponibil in planul {requiredTier}
        </div>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          {description}
        </p>

        <ul className="mt-6 w-full max-w-md space-y-2 text-left">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-foreground/90"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${gradientClass}`}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          {canShowTrial && <StartTrialBlockerButton />}
          <Link
            href="/pricing"
            className={`group inline-flex h-11 items-center justify-center gap-2 rounded-xl ${
              canShowTrial
                ? "border border-border bg-background/50 text-foreground backdrop-blur hover:bg-accent"
                : `bg-gradient-to-r ${gradientClass} text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl`
            } px-7 text-sm font-semibold transition-all`}
          >
            {!canShowTrial && (
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            )}
            {canShowTrial ? "Vezi toate planurile" : display.cta}
          </Link>
          {alternativeAction && (
            <Link
              href={alternativeAction.href}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-7 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-accent"
            >
              {alternativeAction.label}
            </Link>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {canShowTrial
            ? "7 zile gratuit · Fara card · Anulezi oricand"
            : "Poti anula oricand · Proratare automata la upgrade"}
        </p>
      </div>
    </div>
  )
}
