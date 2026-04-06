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

function truncateName(name: string, maxLength: number = 15): string {
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
    <div className="rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      <div className="font-semibold text-foreground">{fullName}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
            }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
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
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <RadarIcon className="h-8 w-8 opacity-40" />
        <span className="text-sm">
          Completeaza teste pentru a vedea punctele tale forte
        </span>
      </div>
    )
  }

  const cohortMap = new Map(
    (cohort ?? []).map((c) => [c.chapterName, c.accuracyPct])
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
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadarChart data={chartData}>
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.15} />
            </radialGradient>
            <radialGradient id="cohortFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.05} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="currentColor" opacity={0.12} />
          <PolarAngleAxis
            dataKey="chapter"
            tick={{ fill: "currentColor", opacity: 0.6, fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "currentColor", opacity: 0.4, fontSize: 10 }}
            stroke="currentColor"
            strokeOpacity={0.1}
          />
          {showCohort && (
            <Radar
              name="Cohorta"
              dataKey="cohort"
              stroke="#94a3b8"
              fill="url(#cohortFill)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              animationDuration={1100}
            />
          )}
          <Radar
            name="Tu"
            dataKey="accuracy"
            stroke="#10b981"
            fill="url(#radarFill)"
            strokeWidth={2.5}
            animationDuration={1200}
            style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.4))" }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
