import * as React from "react"

import { cn } from "@/lib/utils"

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Afișează un dot pulsator în stânga (default true). */
  pulse?: boolean
  /** Culoarea dot-ului — default `--neon`. */
  dotColor?: "neon" | "warm" | "danger"
}

/**
 * Eyebrow — pill mono cu border + dot pulsator.
 *
 * Spec: § 2 Hero (eyebrow) și folosit ca status indicator pe orice ecran cu
 * un strip "live" sau status header. Format: pill `--bg-2` border `--line`,
 * radius 999, padding 6/14, conținut mono 11.5px tracking 0.1em uppercase
 * `--fg-dim`. Dot 6×6 cu glow și `pulse 2s infinite`.
 */
export function Eyebrow({
  className,
  pulse = true,
  dotColor = "neon",
  children,
  ...props
}: EyebrowProps) {
  const dotClass =
    dotColor === "warm"
      ? "bg-warm shadow-[0_0_8px_var(--warm)]"
      : dotColor === "danger"
        ? "bg-danger shadow-[0_0_8px_var(--danger)]"
        : "bg-neon shadow-[0_0_8px_var(--neon)]"

  return (
    <div
      data-slot="eyebrow"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line bg-bg-2 px-3.5 py-1.5",
        "font-mono text-[11.5px] uppercase tracking-mono-tight text-fg-dim",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "size-[6px] shrink-0 rounded-full",
          dotClass,
          pulse && "pulse-dot",
        )}
      />
      <span className="leading-none">{children}</span>
    </div>
  )
}
