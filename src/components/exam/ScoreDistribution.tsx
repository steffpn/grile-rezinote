"use client"

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import type { ScoreDistributionPoint } from "./score-distribution-data"

export type { ScoreDistributionPoint }

export interface ScoreDistributionProps {
  /** Curve data — pre-computed (server) sau mock pentru preview. */
  curve: ScoreDistributionPoint[]
  /** Scorul user-ului (linie albă verticală). */
  userScore: number
  /** Media (linie warm dashed verticală). */
  cohortMean: number
  /** Min/max afișate pe X. */
  domain?: [number, number]
  height?: number
}

/**
 * ScoreDistribution — bell curve chart cu user marker + cohort mean.
 *
 * Spec § 4 Dashboard mock (cell 4) — distribution chart cu fill gradient
 * neon, linie verticală albă pentru user, dashed warm pentru media.
 */
export function ScoreDistribution({
  curve,
  userScore,
  cohortMean,
  domain,
  height = 220,
}: ScoreDistributionProps) {
  // Expand the X domain so the user's score is always visible.
  // Default [500, 950] but pad down to userScore - 50 if they scored lower.
  const baseMin = 500
  const baseMax = 950
  const effectiveDomain: [number, number] = domain ?? [
    Math.min(baseMin, Math.floor((userScore - 50) / 50) * 50),
    baseMax,
  ]
  const tickStep = 100
  const ticks: number[] = []
  for (let t = effectiveDomain[0]; t <= effectiveDomain[1]; t += tickStep) {
    ticks.push(t)
  }
  if (ticks[ticks.length - 1] !== effectiveDomain[1]) {
    ticks.push(effectiveDomain[1])
  }
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={curve}
          margin={{ top: 14, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(0.84 0.21 162)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="oklch(0.84 0.21 162)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            dataKey="score"
            domain={effectiveDomain}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "oklch(0.55 0.015 95)", fontSize: 10 }}
            fontFamily="var(--font-mono)"
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Area
            type="monotone"
            dataKey="density"
            stroke="oklch(0.84 0.21 162)"
            strokeWidth={1.5}
            fill="url(#distFill)"
          />
          {/* Cohort mean (warm dashed) */}
          <ReferenceLine
            x={cohortMean}
            stroke="oklch(0.82 0.13 60)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `media · ${cohortMean}`,
              position: "top",
              fill: "oklch(0.82 0.13 60)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              dy: -2,
            }}
          />
          {/* User score (white solid) */}
          <ReferenceLine
            x={userScore}
            stroke="oklch(0.97 0.008 95)"
            strokeWidth={2}
            label={{
              value: `tu · ${userScore}`,
              position: "top",
              fill: "oklch(0.97 0.008 95)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              dy: -2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-3 bg-fg" /> tu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-px w-3 border-t border-dashed border-warm" />
          media
        </span>
      </div>
    </div>
  )
}

