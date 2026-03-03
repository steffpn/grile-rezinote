import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; isPositive: boolean }
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 animate-in fade-in",
      className
    )}>
      <div className="absolute inset-0 gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/5">
          {icon}
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
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
      </CardContent>
    </Card>
  )
}
