"use client"

import { motion } from "framer-motion"
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

interface TooltipBits {
  active?: boolean
  payload?: Array<{ value?: number; payload?: { isUserBin?: boolean } }>
  label?: string | number
}

function CustomTooltip({ active, payload, label }: TooltipBits) {
  if (!active || !payload || payload.length === 0) return null
  const isUserBin = payload[0]?.payload?.isUserBin === true
  return (
    <div className="rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      <div className="font-semibold text-foreground">Interval: {String(label)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isUserBin ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-slate-400/60"
          }`}
        />
        <span className="text-muted-foreground">Participanti</span>
        <span className="ml-auto font-semibold tabular-nums">
          {payload[0].value ?? 0}
        </span>
      </div>
      {isUserBin && (
        <div className="mt-1 text-[10px] font-semibold text-emerald-400">
          Pozitia ta
        </div>
      )}
    </div>
  )
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <BarChart
          data={distribution}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="distUser" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="distOther" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(148,163,184,0.55)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.15)" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(16,185,129,0.06)" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={900}>
            {distribution.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isUserBin ? "url(#distUser)" : "url(#distOther)"}
                style={
                  entry.isUserBin
                    ? { filter: "drop-shadow(0 0 10px rgba(16,185,129,0.5))" }
                    : undefined
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasUserBin && (
        <p className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-gradient-to-b from-emerald-400 to-teal-600 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          Pozitia ta in distributie
        </p>
      )}
    </motion.div>
  )
}
