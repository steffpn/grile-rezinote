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
            <Badge variant={isCorrect ? "default" : "destructive"}>
              {isCorrect ? "Corect" : "Gresit"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question info */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Intrebare ({answer.questionType})
            </p>
            <p className="mt-1">{answer.questionText}</p>
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

          {/* Student's answer */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Raspunsul tau:
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {answer.selectedOptions.length > 0 ? (
                answer.selectedOptions.map((opt) => {
                  const isOptionCorrect = answer.correctOptions.includes(opt)
                  return (
                    <Badge
                      key={opt}
                      variant={isOptionCorrect ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {opt}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  Niciun raspuns selectat
                </span>
              )}
            </div>
          </div>

          {/* Correct answer */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Raspuns corect:
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {answer.correctOptions.map((opt) => (
                <Badge
                  key={opt}
                  variant="default"
                  className="bg-green-600 text-sm hover:bg-green-700"
                >
                  {opt}
                </Badge>
              ))}
            </div>
          </div>

          {/* Score */}
          {answer.score !== null && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Scor: <span className="font-bold">{answer.score}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
