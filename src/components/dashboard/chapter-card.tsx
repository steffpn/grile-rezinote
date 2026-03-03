"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronDown } from "lucide-react"
import { Sparkline } from "@/components/dashboard/sparkline"
import { cn } from "@/lib/utils"
import type { ChapterStats } from "@/types/dashboard"

interface ChapterCardProps {
  chapter: ChapterStats
  sparklineData?: { value: number }[]
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  if (accuracy >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export function ChapterCard({ chapter, sparklineData }: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        {/* Collapsed view */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{chapter.chapterName}</h3>
            <p className="text-sm text-muted-foreground">
              {chapter.totalAnswers} intrebari incercate
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={cn("text-xs font-medium", getAccuracyColor(chapter.accuracyPct))}
              variant="outline"
            >
              {chapter.accuracyPct}%
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Expanded view */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "mt-4 max-h-60 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-3 border-t pt-3">
            {/* Sparkline */}
            {sparklineData && sparklineData.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tendinta:</span>
                <Sparkline data={sparklineData} />
              </div>
            )}

            {/* Detailed stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{chapter.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Intrebari unice</p>
              </div>
              <div>
                <p className="text-lg font-bold">{chapter.correctAnswers}</p>
                <p className="text-xs text-muted-foreground">Corecte</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {chapter.totalAnswers - chapter.correctAnswers}
                </p>
                <p className="text-xs text-muted-foreground">Gresite</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Acuratete</span>
                <span>{chapter.accuracyPct}%</span>
              </div>
              <Progress value={chapter.accuracyPct} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
