"use client"

import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { TrendingUp } from "lucide-react"

import type { DailyTrend } from "@/types/dashboard"

interface TrendChartProps {
  data: DailyTrend[]
  height?: number
}

const MONTHS = [
  "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Noi", "Dec",
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

interface TooltipBits {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    value?: number
    payload?: { totalQuestions?: number }
  }>
  label?: string | number
}

function CustomTooltip({ active, payload, label }: TooltipBits) {
  if (!active || !payload || payload.length === 0) return null
  const accuracy = payload.find((p) => p.dataKey === "accuracyPct")?.value
  const total = payload[0]?.payload?.totalQuestions
  return (
    <div className="rounded-[8px] border border-line bg-bg-2/95 px-3 py-2 font-mono text-[11px] shadow-dashboard backdrop-blur-xl">
      <div className="text-fg">{formatDate(String(label))}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]" />
        <span className="text-fg-mute">acuratețe</span>
        <span className="ml-auto font-semibold tabular-nums text-neon">
          {accuracy ?? 0}%
        </span>
      </div>
      {typeof total === "number" && (
        <div className="mt-0.5 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-neon-2/60" />
          <span className="text-fg-mute">întrebări</span>
          <span className="ml-auto font-semibold tabular-nums text-fg">
            {total}
          </span>
        </div>
      )}
    </div>
  )
}

export function TrendChart({ data, height = 300 }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-fg-mute"
        style={{ height }}
      >
        <TrendingUp className="size-8 opacity-50" />
        <span className="font-mono text-[11px] uppercase tracking-mono">
          fără activitate încă
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.84 0.21 162)" stopOpacity={0.4} />
              <stop offset="60%" stopColor="oklch(0.74 0.18 162)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="oklch(0.84 0.21 162)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="accuracyStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.74 0.18 162)" />
              <stop offset="100%" stopColor="oklch(0.84 0.21 162)" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="oklch(0.26 0.018 165)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "oklch(0.55 0.015 95)", fontSize: 10 }}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "oklch(0.55 0.015 95)", fontSize: 10 }}
            fontFamily="var(--font-mono)"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "oklch(0.84 0.21 162)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
              opacity: 0.5,
            }}
          />
          <Area
            type="monotone"
            dataKey="accuracyPct"
            stroke="url(#accuracyStroke)"
            fill="url(#accuracyFill)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            animationDuration={1200}
            activeDot={{
              r: 5,
              fill: "oklch(0.84 0.21 162)",
              stroke: "oklch(0.97 0.008 95)",
              strokeWidth: 2,
              style: {
                filter:
                  "drop-shadow(0 0 6px oklch(0.84 0.21 162 / 0.7))",
              },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
