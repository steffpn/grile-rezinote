import * as React from "react"

import { cn } from "@/lib/utils"

export interface HeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valori 0-4 per celulă (5 trepte de la `--bg-3` la `--neon`). */
  cells: number[]
  /** Numărul de coloane. Default 20 (vezi mini-bento). */
  cols?: number
  /** Tooltip-uri opționale per celulă (ex: "21 oct · 3 simulări"). */
  labels?: string[]
  /** Aria label la nivel de container. */
  ariaLabel?: string
}

const CELL_TONES = [
  // 5 trepte oklch — păstrăm același hue (162), variem L și C.
  "bg-bg-3",
  "bg-[oklch(0.30_0.06_162)]",
  "bg-[oklch(0.45_0.12_162)]",
  "bg-[oklch(0.62_0.16_162)]",
  "bg-neon",
] as const

/**
 * Heatmap — grid cu 5 trepte de culoare. Folosit pentru:
 * - Streak zilnic (mini-bento landing — cols 20)
 * - Activitate săptămânală în statistici (cols 53 = un an, GitHub-style)
 *
 * Spec: § 8 Mini bento → "04 / Streak — Heat map zilnic".
 */
export function Heatmap({
  className,
  cells,
  cols = 20,
  labels,
  ariaLabel,
  ...props
}: HeatmapProps) {
  return (
    <div
      data-slot="heatmap"
      role="img"
      aria-label={ariaLabel ?? `Heatmap cu ${cells.length} valori`}
      className={cn("grid w-full gap-[2px]", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      {...props}
    >
      {cells.map((value, i) => {
        const tone = CELL_TONES[Math.max(0, Math.min(4, value | 0))]
        return (
          <span
            key={i}
            title={labels?.[i]}
            aria-hidden
            className={cn(
              "aspect-square rounded-[1px] transition-transform hover:scale-110",
              tone,
            )}
          />
        )
      })}
    </div>
  )
}
