"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { ScoreDistributionBin } from "@/types/peer"

interface ScoreDistributionProps {
  distribution: ScoreDistributionBin[]
}

export function ScoreDistribution({ distribution }: ScoreDistributionProps) {
  if (distribution.length === 0 || distribution.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Nu sunt suficiente date pentru grafic.
        </p>
      </div>
    )
  }

  const hasUserBin = distribution.some((d) => d.isUserBin)

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={distribution}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value ?? 0, "Participanti"]}
            labelFormatter={(label: unknown) => `Interval: ${String(label)}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {distribution.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isUserBin
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.3)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasUserBin && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />
          Pozitia ta in distributie
        </p>
      )}
    </div>
  )
}
