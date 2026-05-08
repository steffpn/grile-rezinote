import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * MonoLabel — span mono uppercase tracking, folosit peste tot pentru:
 * eyebrows simple, cell labels (dashboard), statuses, build numbers.
 *
 * Spec: § Typography → Cell label / Section tag.
 *
 * Sizes:
 * - `cell` 10px (cell labels în dashboard, foot text)
 * - `eyebrow` 11px (default — section tags, panel labels)
 * - `body` 12px (ticker, footer copy mono)
 *
 * Tones:
 * - `mute` (default) → `--fg-mute`
 * - `dim` → `--fg-dim`
 * - `accent` → `--neon`
 * - `fg` → `--fg`
 */
const monoLabelVariants = cva(
  "font-mono uppercase",
  {
    variants: {
      size: {
        cell: "text-[10px] tracking-mono",
        eyebrow: "text-[11px] tracking-mono",
        body: "text-[12px] tracking-mono-tight",
      },
      tone: {
        mute: "text-fg-mute",
        dim: "text-fg-dim",
        accent: "text-neon",
        fg: "text-fg",
        warm: "text-warm",
        danger: "text-danger",
      },
    },
    defaultVariants: {
      size: "eyebrow",
      tone: "mute",
    },
  },
)

export interface MonoLabelProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof monoLabelVariants> {
  /** Element HTML de randat — default `span`. Folosește `"div"` pentru block-level. */
  as?: React.ElementType
}

export function MonoLabel({
  className,
  size,
  tone,
  as: As = "span",
  ...props
}: MonoLabelProps) {
  return (
    <As
      data-slot="mono-label"
      className={cn(monoLabelVariants({ size, tone }), className)}
      {...props}
    />
  )
}

export { monoLabelVariants }
