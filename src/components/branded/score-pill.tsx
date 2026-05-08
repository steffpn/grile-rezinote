import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * ScorePill — badge mono pentru delte de scor / metrici.
 *
 * Spec: § 4 Dashboard mock (cell-score) — `↑ +62 vs anterior`.
 * Folosit oriunde apare un delta numeric (rezultat simulare, ranking,
 * comparison views).
 *
 * Tone-uri:
 * - `pos`  → `--neon` cu fundal neon/12 (default)
 * - `neg`  → `--warm` cu fundal warm/12
 * - `danger` → `--danger` cu fundal danger/14
 * - `neutral` → `--fg-dim` cu fundal bg-3
 */
const scorePillVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] px-2.5 py-1 font-mono text-[12px] leading-none",
  {
    variants: {
      tone: {
        pos: "bg-neon/12 text-neon",
        neg: "bg-warm/12 text-warm",
        danger: "bg-danger/14 text-danger",
        neutral: "bg-bg-3 text-fg-dim",
      },
      size: {
        sm: "px-2 py-[3px] text-[11px]",
        md: "px-2.5 py-1 text-[12px]",
      },
    },
    defaultVariants: {
      tone: "pos",
      size: "md",
    },
  },
)

export interface ScorePillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof scorePillVariants> {
  /** Auto-prefix săgeată în funcție de tonul. Setează `false` pentru a controla manual. */
  arrow?: boolean
}

export function ScorePill({
  className,
  tone = "pos",
  size,
  arrow = false,
  children,
  ...props
}: ScorePillProps) {
  const arrowChar = tone === "pos" ? "↑" : tone === "neg" || tone === "danger" ? "↓" : "·"
  return (
    <span
      data-slot="score-pill"
      className={cn(scorePillVariants({ tone, size }), className)}
      {...props}
    >
      {arrow && <span aria-hidden>{arrowChar}</span>}
      {children}
    </span>
  )
}

export { scorePillVariants }
