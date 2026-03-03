import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  Target,
} from "lucide-react"
import type { PeerAggregateStats } from "@/types/peer"

interface PeerStatsCardProps {
  stats: PeerAggregateStats
}

export function PeerStatsCard({ stats }: PeerStatsCardProps) {
  const statItems = [
    {
      label: "Scorul tau",
      value:
        stats.userBestScore !== null ? String(stats.userBestScore) : "N/A",
      icon: Trophy,
      highlight: stats.userBestScore !== null && stats.userBestScore > stats.meanScore,
    },
    {
      label: "Media",
      value: String(Math.round(stats.meanScore)),
      icon: BarChart3,
      highlight: false,
    },
    {
      label: "Mediana",
      value: String(Math.round(stats.medianScore)),
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "Percentila ta",
      value:
        stats.userPercentile !== null
          ? `top ${(100 - stats.userPercentile).toFixed(0)}%`
          : "N/A",
      icon: Target,
      highlight: stats.userPercentile !== null && stats.userPercentile >= 50,
    },
    {
      label: "Clasament",
      value:
        stats.userRank !== null
          ? `${stats.userRank} / ${stats.totalParticipants}`
          : "N/A",
      icon: Users,
      highlight: false,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Statistici comparative</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <Icon
                  className={`h-5 w-5 ${
                    item.highlight
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-lg font-bold ${
                    item.highlight
                      ? "text-green-600 dark:text-green-400"
                      : ""
                  }`}
                >
                  {item.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
