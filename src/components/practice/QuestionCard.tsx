"use client"

import { forwardRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Flag, BookOpen, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "./QuestionOptionGroup"
import { formatQuestionType } from "@/lib/format/question-type"

interface QuestionOption {
  label: string
  text: string
}

interface Feedback {
  isCorrect: boolean
  correctOptions: string[]
  sourceBook: string | null
  sourcePage: string | null
}

interface QuestionCardProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    subchapter?: string | null
    options: QuestionOption[]
  }
  questionNumber: number
  selected: string[]
  onAnswer: (questionId: string, selected: string[]) => void
  onVerify?: (questionId: string) => void
  onFlag: (questionId: string) => void
  isFlagged: boolean
  isAnswered: boolean
  disabled?: boolean
  feedback?: Feedback
  showResults?: boolean
  isVerifying?: boolean
}

export const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(
  function QuestionCard(
    {
      question,
      questionNumber,
      selected,
      onAnswer,
      onVerify,
      onFlag,
      isFlagged,
      isAnswered,
      disabled = false,
      feedback,
      showResults = false,
      isVerifying = false,
    },
    ref
  ) {
    return (
      <Card
        ref={ref}
        id={`question-${question.id}`}
        data-protected="question"
        className={cn(
          "border-border/50 transition-all duration-300",
          showResults && feedback?.isCorrect && "border-green-400 bg-green-50/30 dark:border-green-600 dark:bg-green-950/20",
          showResults && feedback && !feedback.isCorrect && "border-red-400 bg-red-50/30 dark:border-red-600 dark:bg-red-950/20"
        )}
      >
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-lg font-bold tracking-tight">
              Intrebarea {questionNumber}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[11px] font-semibold",
                question.type === "CS"
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400"
              )}
            >
              {formatQuestionType(question.type)}
            </Badge>
            {showResults && feedback && (
              <Badge
                variant={feedback.isCorrect ? "default" : "destructive"}
                className={cn(
                  "rounded-full text-[11px]",
                  feedback.isCorrect && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {feedback.isCorrect ? "Corect" : "Gresit"}
              </Badge>
            )}
          </div>
          <Toggle
            pressed={isFlagged}
            onPressedChange={() => onFlag(question.id)}
            size="sm"
            aria-label="Marcheaza intrebarea"
            className={cn(
              "rounded-lg",
              isFlagged && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            )}
          >
            <Flag className="h-4 w-4" />
          </Toggle>
        </CardHeader>

        <CardContent className="space-y-4">
          {question.subchapter && (
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/80 break-words">
              {question.subchapter}
            </p>
          )}
          <p className="text-base leading-relaxed break-words">{question.text}</p>

          <QuestionOptionGroup
            questionType={question.type}
            options={question.options}
            selected={selected}
            onChange={(newSelected) => onAnswer(question.id, newSelected)}
            disabled={disabled || showResults}
            correctOptions={feedback?.correctOptions}
            showResults={showResults}
          />

          {/* Verify button for CM questions with immediate feedback */}
          {onVerify && !isAnswered && !showResults && selected.length > 0 && (
            <Button
              onClick={() => onVerify(question.id)}
              disabled={isVerifying}
              className="w-full rounded-xl gradient-primary border-0 text-white shadow-md"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isVerifying ? "Se verifica..." : "Verifica raspunsul"}
            </Button>
          )}

          {/* Source reference for incorrect answers */}
          {feedback && !feedback.isCorrect && (feedback.sourceBook || feedback.sourcePage) && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-800 dark:text-amber-200">
                Sursa: {feedback.sourceBook}
                {feedback.sourcePage && `, pag. ${feedback.sourcePage}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
