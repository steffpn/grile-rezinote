"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { AnswerHistoryRow } from "@/types/dashboard"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface AnswerDetailDialogProps {
  answer: AnswerHistoryRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnswerDetailDialog({
  answer,
  open,
  onOpenChange,
}: AnswerDetailDialogProps) {
  if (!answer) return null

  const isCorrect = answer.isCorrect === true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalii Raspuns
            <Badge
              variant={isCorrect ? "default" : "destructive"}
              className={cn(
                "rounded-full text-[11px]",
                isCorrect && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isCorrect ? "Corect" : "Gresit"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            {/* Question info */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Intrebare ({answer.questionType})
              </p>
              <p className="mt-1 leading-relaxed">{answer.questionText}</p>
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Capitol: </span>
                <span className="font-medium">{answer.chapterName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Data: </span>
                <span className="font-medium">
                  {format(new Date(answer.answeredAt), "dd MMMM yyyy, HH:mm", {
                    locale: ro,
                  })}
                </span>
              </div>
            </div>

            <Separator />

            {/* All options with visual feedback */}
            <div className="space-y-2">
              {answer.allOptions.map((opt) => {
                const wasSelected = answer.selectedOptions.includes(opt.label)
                const isOptionCorrect = answer.correctOptions.includes(opt.label)
                const isWrong = wasSelected && !isOptionCorrect
                const isMissed = !wasSelected && isOptionCorrect

                return (
                  <div
                    key={opt.label}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                      isOptionCorrect && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20",
                      isWrong && "border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20",
                      !isOptionCorrect && !isWrong && "border-border/50 opacity-60"
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      wasSelected && isOptionCorrect && "bg-emerald-600 text-white",
                      isWrong && "bg-red-500 text-white",
                      isMissed && "bg-amber-500 text-white",
                      !wasSelected && !isOptionCorrect && "bg-muted text-muted-foreground"
                    )}>
                      {wasSelected && isOptionCorrect && <Check className="h-3.5 w-3.5" />}
                      {isWrong && <X className="h-3.5 w-3.5" />}
                      {!wasSelected && opt.label}
                    </div>

                    {/* Option text */}
                    <div className="flex-1 pt-0.5">
                      <span className="font-semibold">{opt.label}.</span>{" "}
                      {opt.text}
                    </div>

                    {/* Indicators */}
                    <div className="flex shrink-0 gap-1 pt-0.5">
                      {wasSelected && (
                        <Badge variant="outline" className={cn(
                          "rounded-full text-[10px]",
                          isOptionCorrect
                            ? "border-emerald-300 text-emerald-700 dark:text-emerald-400"
                            : "border-red-300 text-red-700 dark:text-red-400"
                        )}>
                          Ales
                        </Badge>
                      )}
                      {isMissed && (
                        <Badge variant="outline" className="rounded-full text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                          Corect
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Score */}
            {answer.score !== null && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">Scor</span>
                <span className="text-lg font-bold">{answer.score}</span>
              </div>
            )}

          </div>
      </DialogContent>
    </Dialog>
  )
}
