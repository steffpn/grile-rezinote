import * as React from "react"

import { cn } from "@/lib/utils"

export interface PercentBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Procent 0-100. Valori în afara intervalului sunt clamped. */
  value: number
  /** Înălțimea barei — default 6px (spec percentilă). */
  thickness?: number
  /** Indică un threshold (linie verticală warm peste bar) — procent 0-100. */
  threshold?: number
  /** Stil pentru bar-ul plin. */
  variant?: "gradient" | "neon" | "warm"
  /** Aria label custom (default include valoarea). */
  ariaLabel?: string
}

/**
 * PercentBar — bar minimal cu fundal `--bg-3` și fill gradient `oklch(0.4 0.1 162)` → `--neon`.
 *
 * Spec: § 4 Percentilă · § 6 Killer-vis · folosit pentru orice metric 0-100
 * (percentilă, completion, time-used, capitol mastery).
 *
 * `threshold` adaugă o linie verticală warm peste bar — folosit la pragurile
 * de admitere ca să arate unde e cut-off-ul vs scorul user-ului.
 */
export function PercentBar({
  className,
  value,
  thickness = 6,
  threshold,
  variant = "gradient",
  ariaLabel,
  ...props
}: PercentBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const fillStyle: React.CSSProperties = {
    width: `${clamped}%`,
  }

  const fillBg =
    variant === "gradient"
      ? "bg-[linear-gradient(90deg,oklch(0.4_0.1_162),var(--neon))]"
      : variant === "warm"
        ? "bg-warm"
        : "bg-neon"

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${clamped.toFixed(0)}%`}
      data-slot="percent-bar"
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-bg-3",
        className,
      )}
      style={{ height: thickness }}
      {...props}
    >
      <div
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 rounded-full", fillBg)}
        style={fillStyle}
      />
      {threshold != null && (
        <div
          aria-hidden
          className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-warm"
          style={{ left: `${Math.max(0, Math.min(100, threshold))}%` }}
        />
      )}
    </div>
  )
}

export interface SegmentBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Numărul de segmente. */
  total: number
  /** Câte segmente sunt pline. */
  filled: number
  /** Index-ul segmentului "current" (highlighted). */
  current?: number
  /** Lățimea per segment — auto dacă nu setezi. */
  segmentClass?: string
}

/**
 * SegmentBar — variantă cu segmente discrete (folosit la timer / progres
 * întrebări la simulator).
 *
 * Spec: § 8 Features (timer block) — 20 segmente cu cele pline `--neon-2`,
 * curent `--neon` cu glow.
 */
export function SegmentBar({
  className,
  total,
  filled,
  current,
  segmentClass,
  ...props
}: SegmentBarProps) {
  return (
    <div
      data-slot="segment-bar"
      className={cn("flex w-full gap-[2px]", className)}
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={total}
      {...props}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled
        const isCurrent = i === current
        return (
          <span
            key={i}
            aria-hidden
            className={cn(
              "h-[6px] flex-1 rounded-[1px] transition-colors",
              isCurrent
                ? "bg-neon shadow-[0_0_8px_var(--neon)]"
                : isFilled
                  ? "bg-neon-2"
                  : "bg-bg-3",
              segmentClass,
            )}
          />
        )
      })}
    </div>
  )
}
