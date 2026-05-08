"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { MonoLabel, PercentBar, ScorePill } from "@/components/branded"
import { Sparkline } from "@/components/dashboard/sparkline"
import { cn } from "@/lib/utils"
import type { ChapterStats } from "@/types/dashboard"

interface ChapterCardProps {
  chapter: ChapterStats
  sparklineData?: { value: number }[]
}

function toneFor(accuracy: number) {
  if (accuracy >= 70) return "pos" as const
  if (accuracy >= 40) return "neutral" as const
  return "danger" as const
}

export function ChapterCard({ chapter, sparklineData }: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tone = toneFor(chapter.accuracyPct)

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full rounded-[12px] border border-line bg-bg-2 p-4 text-left transition-colors hover:border-line-2"
    >
      {/* Collapsed view */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-fg">
            {chapter.chapterName}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] tracking-mono-tight text-fg-mute">
            {chapter.totalAnswers} întrebări încercate
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScorePill tone={tone} size="sm">
            {chapter.accuracyPct}%
          </ScorePill>
          <ChevronDown
            className={cn(
              "size-4 text-fg-mute transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Expanded view */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          expanded ? "mt-4 max-h-72 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-4 border-t border-line pt-3.5">
          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="flex items-center gap-2">
              <MonoLabel size="cell">Tendință</MonoLabel>
              <Sparkline data={sparklineData} />
            </div>
          )}

          {/* Detailed stats */}
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Întrebări unice"
              value={chapter.totalQuestions}
            />
            <Stat
              label="Corecte"
              value={chapter.correctAnswers}
              tone="pos"
            />
            <Stat
              label="Greșite"
              value={chapter.totalAnswers - chapter.correctAnswers}
              tone="danger"
            />
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
              <span>Acuratețe</span>
              <span className="text-fg">{chapter.accuracyPct}%</span>
            </div>
            <PercentBar value={chapter.accuracyPct} thickness={6} />
          </div>
        </div>
      </div>
    </button>
  )
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "pos" | "danger"
}) {
  return (
    <div className="rounded-[8px] border border-line bg-bg-3 p-2.5 text-center">
      <div
        className={cn(
          "font-mono text-[18px] font-medium leading-none",
          tone === "pos" && "text-neon",
          tone === "danger" && "text-danger",
          tone === "default" && "text-fg",
        )}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-mono-tight text-fg-mute">
        {label}
      </div>
    </div>
  )
}
