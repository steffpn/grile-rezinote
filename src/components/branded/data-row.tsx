import * as React from "react"

import { cn } from "@/lib/utils"

export interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slotul stâng — nume / titlu / icon + label. */
  name: React.ReactNode
  /** Slotul mijlociu — meta info (ex: "prag 821"). Mono, dim. */
  meta?: React.ReactNode
  /** Slotul drept — delta / valoare numerică (ex: ScorePill, sau text mono). */
  trail?: React.ReactNode
  /** Stil "out" → muted text peste tot rândul (ex: "sub prag"). */
  muted?: boolean
}

/**
 * DataRow — pattern `1fr auto auto`, gap 14, padding 9/0, border-bottom line.
 *
 * Spec: § 4 Listă admitere · § 6 Killer-vis row · folosit în orice listă
 * comparativă (admitere, ranking, top-capitole, settings tables).
 *
 * Construit ca grid pentru aliniere consistentă a coloanelor între rânduri.
 */
export function DataRow({
  className,
  name,
  meta,
  trail,
  muted = false,
  ...props
}: DataRowProps) {
  return (
    <div
      data-slot="data-row"
      data-muted={muted || undefined}
      className={cn(
        "grid grid-cols-[1fr_auto_auto] items-center gap-x-3.5 border-b border-line py-2.5 text-[13px] last:border-b-0",
        muted ? "text-fg-mute" : "text-fg",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 truncate">{name}</div>
      {meta != null ? (
        <div className="font-mono text-[11.5px] text-fg-mute">{meta}</div>
      ) : (
        <div />
      )}
      {trail != null ? <div className="ml-2 text-right">{trail}</div> : <div />}
    </div>
  )
}

export interface DataRowDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean
}

/**
 * DataRowDot — bullet 6×6 folosit înainte de nume în liste de admitere.
 * Activ → neon cu glow. Inactiv → gri.
 */
export function DataRowDot({
  className,
  active = true,
  ...props
}: DataRowDotProps) {
  return (
    <span
      aria-hidden
      data-slot="data-row-dot"
      className={cn(
        "inline-block size-[6px] shrink-0 rounded-[1px]",
        active
          ? "bg-neon shadow-[0_0_6px_var(--neon)]"
          : "bg-[oklch(0.42_0.02_165)]",
        className,
      )}
      {...props}
    />
  )
}
