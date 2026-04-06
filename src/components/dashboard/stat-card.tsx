import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Sparkline } from "@/components/dashboard/sparkline"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; isPositive: boolean }
  /** Optional sparkline rendered as a small mini-chart in the corner. */
  sparkline?: { value: number }[]
  className?: string
}

/**
 * Parses a value like "73%", "12 zile", 42 into { number, prefix, suffix }.
 * Fallback: render the raw string if no number is found.
 */
function parseValue(value: string | number): {
  number: number | null
  prefix: string
  suffix: string
} {
  if (typeof value === "number") {
    return { number: value, prefix: "", suffix: "" }
  }
  const match = value.match(/^(\D*)(-?\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return { number: null, prefix: value, suffix: "" }
  return {
    number: parseFloat(match[2].replace(",", ".")),
    prefix: match[1],
    suffix: match[3],
  }
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  sparkline,
  className,
}: StatCardProps) {
  const parsed = parseValue(value)
  const decimals =
    parsed.number !== null && !Number.isInteger(parsed.number) ? 1 : 0

  return (
    <GlassCard className={cn("min-h-[120px]", className)} padding="none">
      {/* Optional sparkline in the top-right corner */}
      {sparkline && sparkline.length > 1 && (
        <div className="pointer-events-none absolute right-3 top-3 opacity-70">
          <Sparkline data={sparkline} width={72} height={28} color="#10b981" />
        </div>
      )}

      <div className="flex items-center gap-4 p-5">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-400/20">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 blur-md" />
          <div className="relative">{icon}</div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight tabular-nums bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {parsed.number !== null ? (
                <AnimatedCounter
                  value={parsed.number}
                  prefix={parsed.prefix}
                  suffix={parsed.suffix}
                  decimals={decimals}
                />
              ) : (
                value
              )}
            </p>
            {trend && (
              <Badge
                variant={trend.isPositive ? "default" : "destructive"}
                className="text-[10px] font-semibold"
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </Badge>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
