import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyTableStateProps {
  title: string
  description?: string
  className?: string
}

/**
 * Compact empty state used inside table containers.
 * Custom inline SVG illustration (rows + magnifier) — no asset deps.
 */
export function EmptyTableState({
  title,
  description,
  className,
}: EmptyTableStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] py-14 text-center",
        className
      )}
    >
      <svg
        width="120"
        height="84"
        viewBox="0 0 120 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-4 opacity-80"
        aria-hidden
      >
        <defs>
          <linearGradient id="es-row" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(16,185,129,0.18)" />
            <stop offset="100%" stopColor="rgba(20,184,166,0.04)" />
          </linearGradient>
          <linearGradient id="es-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect x="10" y="14" width="100" height="10" rx="3" fill="url(#es-row)" />
        <rect x="10" y="32" width="80" height="10" rx="3" fill="url(#es-row)" />
        <rect x="10" y="50" width="64" height="10" rx="3" fill="url(#es-row)" />
        <circle
          cx="86"
          cy="58"
          r="14"
          fill="url(#es-glass)"
          stroke="#34d399"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <line
          x1="96"
          y1="68"
          x2="106"
          y2="78"
          stroke="#34d399"
          strokeOpacity="0.7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
