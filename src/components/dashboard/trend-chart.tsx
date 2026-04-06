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
import type { DailyTrend } from "@/types/dashboard"
import { TrendingUp } from "lucide-react"

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
  payload?: Array<{ dataKey?: string | number; value?: number; payload?: { totalQuestions?: number } }>
  label?: string | number
}

function CustomTooltip({ active, payload, label }: TooltipBits) {
  if (!active || !payload || payload.length === 0) return null
  const accuracy = payload.find((p) => p.dataKey === "accuracyPct")?.value
  const total = payload[0]?.payload?.totalQuestions
  return (
    <div className="rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      <div className="font-semibold text-foreground">
        {formatDate(String(label))}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span className="text-muted-foreground">Acuratete</span>
        <span className="ml-auto font-semibold tabular-nums text-emerald-400">
          {accuracy ?? 0}%
        </span>
      </div>
      {typeof total === "number" && (
        <div className="mt-0.5 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-400/60" />
          <span className="text-muted-foreground">Intrebari</span>
          <span className="ml-auto font-semibold tabular-nums">{total}</span>
        </div>
      )}
    </div>
  )
}

export function TrendChart({ data, height = 300 }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-muted-foreground"
        style={{ height }}
      >
        <TrendingUp className="h-8 w-8 opacity-40" />
        <span className="text-sm">Nicio activitate inca</span>
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
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="60%" stopColor="#14b8a6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="accuracyStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="currentColor"
            opacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", opacity: 0.5, fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", opacity: 0.5, fontSize: 11 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey="accuracyPct"
            stroke="url(#accuracyStroke)"
            fill="url(#accuracyFill)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            animationDuration={1200}
            activeDot={{
              r: 5,
              fill: "#10b981",
              stroke: "#fff",
              strokeWidth: 2,
              style: { filter: "drop-shadow(0 0 6px rgba(16,185,129,0.7))" },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
