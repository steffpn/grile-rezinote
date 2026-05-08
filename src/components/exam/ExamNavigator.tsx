"use client"

import { useState } from "react"
import { Flag, Grid3X3, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"

interface NavigatorQuestion {
  id: string
  number: number
}

interface ExamNavigatorProps {
  questions: NavigatorQuestion[]
  answeredIds: Set<string>
  flaggedIds: Set<string>
  currentQuestionId: string
  /** Dacă lipsește, navigatorul e read-only (forward-only mode). */
  onNavigate?: (questionId: string) => void
}

function NavigatorGrid({
  questions,
  answeredIds,
  flaggedIds,
  currentQuestionId,
  onNavigate,
}: ExamNavigatorProps) {
  // Spec § 3.5 — grid 200 cells 24×24, layout 20 col × 10 rows pentru a
  // încăpea elegant într-o coloană de ~520px desktop.
  return (
    <div className="space-y-4">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: "repeat(20, minmax(0, 1fr))",
        }}
      >
        {questions.map((q) => {
          const isAnswered = answeredIds.has(q.id)
          const isFlagged = flaggedIds.has(q.id)
          const isCurrent = q.id === currentQuestionId
          const navigable = onNavigate != null && !isCurrent

          return (
            <button
              key={q.id}
              type="button"
              onClick={navigable ? () => onNavigate(q.id) : undefined}
              disabled={!navigable && !isCurrent}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Întrebarea ${q.number}${
                isAnswered ? ", răspuns" : ", neselectată"
              }${isFlagged ? ", marcată" : ""}`}
              className={cn(
                "relative aspect-square min-h-[20px] rounded-[3px] font-mono text-[9.5px] leading-none transition-colors",
                // Default: neselectată
                !isAnswered &&
                  !isFlagged &&
                  "bg-bg-3 text-fg-mute",
                // Answered (no flag): neon
                isAnswered && !isFlagged && "bg-neon/20 text-neon",
                // Flagged + answered: warm
                isFlagged && isAnswered && "bg-warm/20 text-warm",
                // Flagged only: warm-mute
                isFlagged && !isAnswered && "bg-warm/12 text-warm",
                // Current: neon solid + glow
                isCurrent &&
                  "bg-neon text-bg shadow-[0_0_0_2px_var(--neon),0_0_8px_var(--neon)]",
                navigable && "cursor-pointer hover:brightness-110",
              )}
            >
              {q.number}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <LegendItem swatch="bg-neon/20" label="Răspuns" />
        <LegendItem swatch="bg-warm/12" label="Marcat" />
        <LegendItem swatch="bg-bg-3" label="Neselectat" />
        <LegendItem swatch="bg-neon shadow-[0_0_4px_var(--neon)]" label="Curent" />
      </div>

      {/* Counters */}
      <div className="flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-fg-mute">
        <span>
          <span className="text-fg">{answeredIds.size}</span>
          <span> / {questions.length} răspunse</span>
        </span>
        {flaggedIds.size > 0 && (
          <span className="inline-flex items-center gap-1">
            <Flag className="size-3" />
            {flaggedIds.size} marcate
          </span>
        )}
      </div>
    </div>
  )
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
      <span className={cn("size-3 rounded-[2px]", swatch)} aria-hidden />
      {label}
    </div>
  )
}

export function ExamNavigator(props: ExamNavigatorProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleNavigate = props.onNavigate
    ? (questionId: string) => {
        props.onNavigate?.(questionId)
        setSheetOpen(false)
      }
    : undefined

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Grid3X3 className="size-3.5" />
          Navigator
          <span className="font-mono text-[10.5px] text-fg-mute">
            {props.answeredIds.size}/{props.questions.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-[560px] gap-0 border-line bg-bg-2 p-0 sm:max-w-[560px]"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <SheetTitle className="text-[16px] font-semibold tracking-[-0.015em] text-fg">
            Navigator întrebări
          </SheetTitle>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="rounded-[6px] p-1 text-fg-mute hover:bg-bg-3 hover:text-fg"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="mb-3">
            <MonoLabel size="cell">200 grile · vedere globală</MonoLabel>
          </div>
          <NavigatorGrid {...props} onNavigate={handleNavigate} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
