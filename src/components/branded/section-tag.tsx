import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * SectionTag — eyebrow folosit pentru titluri de secțiuni.
 *
 * Spec: § 6 Killer · § 8 Features · etc.
 * Format: `▸ TEXT UPPERCASE` în mono 11px tracking 0.18em, culoare `--neon`,
 * cu prefix `▸ ` la 60% opacity.
 *
 * Tone-uri:
 * - `accent` (default) → text + prefix neon
 * - `mute` → text fg-mute, prefix păstrat la neon
 */
const sectionTagVariants = cva(
  "inline-block font-mono text-[11px] uppercase tracking-mono-wider before:content-['▸_'] before:opacity-60",
  {
    variants: {
      tone: {
        accent: "text-neon before:text-neon",
        mute: "text-fg-mute before:text-neon",
      },
    },
    defaultVariants: {
      tone: "accent",
    },
  },
)

export interface SectionTagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof sectionTagVariants> {}

export function SectionTag({
  className,
  tone,
  children,
  ...props
}: SectionTagProps) {
  return (
    <span
      data-slot="section-tag"
      className={cn(sectionTagVariants({ tone }), className)}
      {...props}
    >
      {children}
    </span>
  )
}
