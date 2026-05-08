"use client"

import { motion } from "framer-motion"
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Radar as RadarIcon } from "lucide-react"

import type { ChapterStats } from "@/types/dashboard"

interface ChapterRadarProps {
  data: ChapterStats[]
  /** Optional cohort series for "you vs cohort" overlay. */
  cohort?: { chapterName: string; accuracyPct: number }[]
}

function truncateName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 3) + "..."
}

interface TooltipBits {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    name?: string
    value?: number
    color?: string
    payload?: { fullName?: string }
  }>
}

function CustomTooltip({ active, payload }: TooltipBits) {
  if (!active || !payload || payload.length === 0) return null
  const fullName = payload[0]?.payload?.fullName ?? ""
  return (
    <div className="rounded-[8px] border border-line bg-bg-2/95 px-3 py-2 font-mono text-[11px] shadow-dashboard backdrop-blur-xl">
      <div className="text-fg">{fullName}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="mt-1 flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
          <span className="text-fg-mute">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-fg">
            {p.value ?? 0}%
          </span>
        </div>
      ))}
    </div>
  )
}

export function ChapterRadar({ data, cohort }: ChapterRadarProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-fg-mute">
        <RadarIcon className="size-8 opacity-50" />
        <span className="font-mono text-[11px] uppercase tracking-mono">
          fără date încă
        </span>
      </div>
    )
  }

  const cohortMap = new Map(
    (cohort ?? []).map((c) => [c.chapterName, c.accuracyPct]),
  )

  const chartData = data.map((d) => ({
    chapter: truncateName(d.chapterName),
    fullName: d.chapterName,
    accuracy: d.accuracyPct,
    cohort: cohortMap.get(d.chapterName),
    fullMark: 100,
  }))

  const showCohort = cohort && cohort.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <ResponsiveContainer width="100%" height={320} minWidth={0}>
        <RechartsRadarChart data={chartData} outerRadius="72%">
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.84 0.21 162)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="oklch(0.74 0.18 162)" stopOpacity={0.12} />
            </radialGradient>
            <radialGradient id="cohortFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.55 0.015 95)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(0.55 0.015 95)" stopOpacity={0.05} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="oklch(0.26 0.018 165)" />
          <PolarAngleAxis
            dataKey="chapter"
            tick={{
              fill: "oklch(0.74 0.012 95)",
              fontSize: 10,
            }}
            fontFamily="var(--font-sans)"
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{
              fill: "oklch(0.55 0.015 95)",
              fontSize: 9,
            }}
            stroke="oklch(0.26 0.018 165)"
            strokeOpacity={0.4}
            fontFamily="var(--font-mono)"
          />
          {showCohort && (
            <Radar
              name="cohorta"
              dataKey="cohort"
              stroke="oklch(0.55 0.015 95)"
              fill="url(#cohortFill)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              animationDuration={1100}
            />
          )}
          <Radar
            name="tu"
            dataKey="accuracy"
            stroke="oklch(0.84 0.21 162)"
            fill="url(#radarFill)"
            strokeWidth={2}
            animationDuration={1200}
            style={{ filter: "drop-shadow(0 0 6px oklch(0.84 0.21 162 / 0.4))" }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
