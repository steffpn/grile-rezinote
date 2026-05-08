import { MonoLabel, PercentBar, ScorePill } from "@/components/branded"
import { cn } from "@/lib/utils"

export interface ChapterBreakdownEntry {
  chapterId: string
  chapterName: string
  /** Câte întrebări au fost incluse din capitol. */
  totalQuestions: number
  /** Câte au fost răspunse corect. */
  correctCount: number
  /** Procentaj 0-100. */
  percentage: number
}

interface ChapterBreakdownChartProps {
  entries: ChapterBreakdownEntry[]
  /** Procentaj cohortă comparativ — opțional. */
  cohortAverage?: number
}

/**
 * ChapterBreakdownChart — listă bar orizontală pe capitol cu PercentBar.
 *
 * Spec § 3.6 Rezultat simulare → Per capitol: bar chart orizontal cu
 * fiecare capitol + scor + media + delta.
 */
export function ChapterBreakdownChart({
  entries,
  cohortAverage,
}: ChapterBreakdownChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-fg-mute">
        <span className="font-mono text-[11px] uppercase tracking-mono">
          fără date de capitol
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const tone =
          entry.percentage >= 80
            ? "pos"
            : entry.percentage >= 50
              ? "neutral"
              : "danger"
        const delta =
          cohortAverage != null ? entry.percentage - cohortAverage : null
        return (
          <div key={entry.chapterId} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="truncate text-[14px] font-medium text-fg">
                {entry.chapterName}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11.5px] text-fg-mute">
                  {entry.correctCount}
                  <span className="text-fg-mute/60">/{entry.totalQuestions}</span>
                </span>
                <ScorePill tone={tone} size="sm">
                  {entry.percentage}%
                </ScorePill>
                {delta != null && (
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      delta >= 0 ? "text-neon" : "text-warm",
                    )}
                  >
                    {delta >= 0 ? `+${delta}` : delta} vs media
                  </span>
                )}
              </div>
            </div>
            <PercentBar
              value={entry.percentage}
              thickness={8}
              threshold={cohortAverage}
              variant={tone === "pos" ? "gradient" : tone === "neutral" ? "gradient" : "warm"}
            />
          </div>
        )
      })}
      {cohortAverage != null && (
        <div className="border-t border-line pt-3 font-mono text-[11px] uppercase tracking-mono-tight text-fg-mute">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-[2px] bg-warm" />
            media cohortei · {cohortAverage}%
          </span>
        </div>
      )}
      <div className="sr-only">
        <MonoLabel size="cell">Per capitol</MonoLabel>
      </div>
    </div>
  )
}
