"use client"

import { forwardRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import { Flag, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "./QuestionOptionGroup"

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
    options: QuestionOption[]
  }
  questionNumber: number
  selected: string[]
  onAnswer: (questionId: string, selected: string[]) => void
  onFlag: (questionId: string) => void
  isFlagged: boolean
  isAnswered: boolean
  disabled?: boolean
  feedback?: Feedback
  showResults?: boolean
}

export const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(
  function QuestionCard(
    {
      question,
      questionNumber,
      selected,
      onAnswer,
      onFlag,
      isFlagged,
      isAnswered,
      disabled = false,
      feedback,
      showResults = false,
    },
    ref
  ) {
    return (
      <Card
        ref={ref}
        id={`question-${question.id}`}
        className={cn(
          "transition-all",
          showResults && feedback?.isCorrect && "border-green-300 dark:border-green-700",
          showResults && feedback && !feedback.isCorrect && "border-red-300 dark:border-red-700"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              Intrebarea {questionNumber}
            </span>
            <Badge
              variant="outline"
              className={cn(
                question.type === "CS"
                  ? "border-teal-500 text-teal-700 dark:text-teal-300"
                  : "border-purple-500 text-purple-700 dark:text-purple-300"
              )}
            >
              {question.type}
            </Badge>
            {showResults && feedback && (
              <Badge
                variant={feedback.isCorrect ? "default" : "destructive"}
                className={cn(
                  feedback.isCorrect && "bg-green-600 hover:bg-green-700"
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
              isFlagged && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            )}
          >
            <Flag className="h-4 w-4" />
          </Toggle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">{question.text}</p>

          <QuestionOptionGroup
            questionType={question.type}
            options={question.options}
            selected={selected}
            onChange={(newSelected) => onAnswer(question.id, newSelected)}
            disabled={disabled || showResults}
            correctOptions={feedback?.correctOptions}
            showResults={showResults}
          />

          {/* Source reference for incorrect answers */}
          {feedback && !feedback.isCorrect && (feedback.sourceBook || feedback.sourcePage) && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
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
