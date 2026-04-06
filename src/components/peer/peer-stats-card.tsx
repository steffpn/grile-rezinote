"use client"

import { motion } from "framer-motion"
import {
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  Target,
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import type { PeerAggregateStats } from "@/types/peer"

interface PeerStatsCardProps {
  stats: PeerAggregateStats
}

export function PeerStatsCard({ stats }: PeerStatsCardProps) {
  // Percentile-style score (0-100). Used for the progress ring.
  const percentile = stats.userPercentile ?? 0

  const items = [
    {
      label: "Scorul tau",
      number: stats.userBestScore,
      icon: Trophy,
      highlight:
        stats.userBestScore !== null && stats.userBestScore > stats.meanScore,
    },
    {
      label: "Media",
      number: Math.round(stats.meanScore),
      icon: BarChart3,
      highlight: false,
    },
    {
      label: "Mediana",
      number: Math.round(stats.medianScore),
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "Clasament",
      number: stats.userRank,
      suffix:
        stats.userRank !== null ? ` / ${stats.totalParticipants}` : "",
      icon: Users,
      highlight: false,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <GlassCard padding="lg">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Statistici comparative
          </h3>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto,1fr]">
          {/* Percentile ring */}
          <div className="flex items-center justify-center">
            <ProgressRing value={percentile} size={120} strokeWidth={10}>
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums bg-gradient-to-br from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                  {stats.userPercentile !== null ? (
                    <AnimatedCounter value={Math.round(percentile)} suffix="%" />
                  ) : (
                    "-"
                  )}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Percentila
                </div>
              </div>
            </ProgressRing>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-emerald-400/20 hover:bg-emerald-500/[0.04]"
                >
                  <Icon
                    className={`mb-1.5 h-4 w-4 ${
                      item.highlight ? "text-emerald-400" : "text-muted-foreground"
                    }`}
                  />
                  <div
                    className={`text-lg font-bold tabular-nums ${
                      item.highlight ? "text-emerald-400" : "text-foreground"
                    }`}
                  >
                    {item.number !== null && item.number !== undefined ? (
                      <AnimatedCounter
                        value={item.number}
                        suffix={item.suffix}
                      />
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
