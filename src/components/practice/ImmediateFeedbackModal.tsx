"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackData {
  questionNumber: number
  isCorrect: boolean
  score: number
  maxScore: number
  correctOptions: string[]
  questionType: "CS" | "CM"
  sourceBook: string | null
  sourcePage: string | null
}

interface ImmediateFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  feedback: FeedbackData | null
}

export function ImmediateFeedbackModal({
  isOpen,
  onClose,
  feedback,
}: ImmediateFeedbackModalProps) {
  if (!feedback) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 rounded-t-lg",
            feedback.isCorrect ? "bg-green-500" : "bg-red-500"
          )}
        />
        <DialogHeader className="items-center pt-4">
          <div
            className={cn(
              "mb-3 flex h-16 w-16 items-center justify-center rounded-full",
              feedback.isCorrect
                ? "bg-green-100 dark:bg-green-900"
                : "bg-red-100 dark:bg-red-900"
            )}
          >
            {feedback.isCorrect ? (
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            )}
          </div>
          <DialogTitle
            className={cn(
              "text-xl",
              feedback.isCorrect
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            )}
          >
            {feedback.isCorrect ? "Corect!" : "Gresit!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-lg text-muted-foreground">
            {feedback.score}/{feedback.maxScore} puncte
          </p>

          {!feedback.isCorrect && (
            <div className="space-y-3 text-left">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Raspunsul corect:
                </p>
                <p className="font-semibold">
                  {feedback.correctOptions.join(", ")}
                </p>
              </div>

              {(feedback.sourceBook || feedback.sourcePage) && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                  <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-800 dark:text-amber-200">
                    Sursa: {feedback.sourceBook}
                    {feedback.sourcePage && `, pag. ${feedback.sourcePage}`}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button onClick={onClose} className="w-full" size="lg">
            Continua
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
