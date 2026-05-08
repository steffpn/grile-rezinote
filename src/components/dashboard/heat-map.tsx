"use client"

import { useState } from "react"

import type { HeatmapCell } from "@/types/dashboard"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"

interface HeatMapProps {
  data: HeatmapCell[]
  chapters: string[]
  dates: string[]
}

/** 5 trepte oklch — mapate la accuracy. */
const TONES = [
  "bg-bg-3", // null / no activity
  "bg-[oklch(0.30_0.06_162)]", // <40%
  "bg-[oklch(0.45_0.12_162)]", // 40-59%
  "bg-[oklch(0.62_0.16_162)]", // 60-79%
  "bg-neon", // 80%+
] as const

function bucketFor(accuracy: number | null): number {
  if (accuracy === null) return 0
  if (accuracy >= 80) return 4
  if (accuracy >= 60) return 3
  if (accuracy >= 40) return 2
  return 1
}

function getLabel(accuracy: number | null): string {
  if (accuracy === null) return "Fără activitate"
  if (accuracy >= 80) return "Excelent"
  if (accuracy >= 60) return "Bun"
  if (accuracy >= 40) return "Mediu"
  return "Slab"
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/**
 * HeatMap pe capitole × zile cu paleta brand (5 trepte de la `--bg-3` la
 * `--neon`). Spec § 3.7 Statistici · § 8 mini-bento.
 */
export function HeatMap({ data, chapters, dates }: HeatMapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    content: string
  } | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center font-mono text-[11px] uppercase tracking-mono text-fg-mute">
        Nicio activitate
      </div>
    )
  }

  // Build lookup map
  const cellMap = new Map<string, HeatmapCell>()
  for (const cell of data) {
    cellMap.set(`${cell.chapterName}-${cell.date}`, cell)
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <MonoLabel size="cell">Legendă</MonoLabel>
        <div className="flex items-center gap-1.5">
          {TONES.map((tone, i) => (
            <span
              key={i}
              aria-hidden
              className={cn("size-3 rounded-[2px]", tone)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `160px repeat(${dates.length}, minmax(12px, 1fr))`,
        }}
      >
        <div />
        {dates.map((date, i) =>
          i % 7 === 0 ? (
            <div
              key={date}
              className="text-center font-mono text-[10px] text-fg-mute"
            >
              {formatDateShort(date)}
            </div>
          ) : (
            <div key={date} />
          ),
        )}

        {chapters.map((chapter) => (
          <div key={chapter} className="contents">
            <div
              className="truncate pr-2 text-[12px] leading-4 text-fg-dim"
              title={chapter}
            >
              {chapter}
            </div>
            {dates.map((date) => {
              const cell = cellMap.get(`${chapter}-${date}`)
              const accuracy = cell?.accuracyPct ?? null
              const tone = TONES[bucketFor(accuracy)]
              const questionCount = cell?.questionCount ?? 0
              return (
                <div
                  key={`${chapter}-${date}`}
                  className={cn(
                    "h-4 w-full min-w-[12px] cursor-pointer rounded-[2px] transition-transform hover:scale-110",
                    tone,
                  )}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      content: `${chapter}\n${formatDateShort(date)}\n${getLabel(
                        accuracy,
                      )}${accuracy !== null ? ` · ${accuracy}%` : ""}\n${questionCount} întrebări`,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-[8px] border border-line bg-bg-2/95 px-3 py-2 font-mono text-[11px] shadow-dashboard backdrop-blur-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.content.split("\n").map((line, i) => (
            <div
              key={i}
              className={i === 0 ? "font-semibold text-fg" : "text-fg-dim"}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
