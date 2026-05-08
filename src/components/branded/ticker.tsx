import * as React from "react"

import { cn } from "@/lib/utils"

export interface TickerItem {
  /** Eticheta dim (ex: "grile"). */
  label: string
  /** Valoarea highlight (ex: "12.847"). */
  value: React.ReactNode
  /** Tendință opțională — adaugă o săgeată neon la sfârșit. */
  trend?: "up" | "down"
  /** Marchează valoarea cu accent neon (ex: "ultima admitere"). */
  accent?: boolean
}

export interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Eticheta din stânga. Default "▸ LIVE". */
  liveLabel?: React.ReactNode
  /** Slot-uri de date afișate inline. */
  items: TickerItem[]
  /** Densitate vizuală — gap între item-uri. */
  dense?: boolean
}

/**
 * Ticker — bară mono orizontală cu indicator LIVE și listă de metrici.
 *
 * Spec: § 5 Ticker — `--bg-2` border `--line`, radius 10, padding 14/20,
 * mono 12. Reutilizabil pentru orice ecran care vrea metrici live (dashboard,
 * admin overview, marketing nav).
 */
export function Ticker({
  className,
  liveLabel,
  items,
  dense = false,
  ...props
}: TickerProps) {
  return (
    <div
      data-slot="ticker"
      className={cn(
        "flex items-center overflow-hidden rounded-[10px] border border-line bg-bg-2 px-5 py-3.5",
        "font-mono text-[12px]",
        dense ? "gap-5" : "gap-8",
        className,
      )}
      {...props}
    >
      <span className="shrink-0 text-neon">{liveLabel ?? "▸ LIVE"}</span>
      <div
        className={cn(
          "flex flex-1 items-center whitespace-nowrap text-fg-dim",
          dense ? "gap-5" : "gap-8",
        )}
      >
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span>{item.label}</span>
            <span className={cn(item.accent ? "text-neon" : "text-fg")}>
              {item.value}
            </span>
            {item.trend === "up" && (
              <span className="text-neon" aria-hidden>
                ↑
              </span>
            )}
            {item.trend === "down" && (
              <span className="text-warm" aria-hidden>
                ↓
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
