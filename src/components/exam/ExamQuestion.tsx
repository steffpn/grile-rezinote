"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import { Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "@/components/practice/QuestionOptionGroup"

interface QuestionOption {
  label: string
  text: string
}

interface ExamQuestionProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    options: QuestionOption[]
  }
  questionNumber: number
  totalQuestions: number
  selected: string[]
  onAnswer: (questionId: string, selected: string[]) => void
  onFlag: (questionId: string) => void
  isFlagged: boolean
}

export function ExamQuestion({
  question,
  questionNumber,
  totalQuestions,
  selected,
  onAnswer,
  onFlag,
  isFlagged,
}: ExamQuestionProps) {
  return (
    <Card data-protected="question">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold sm:text-lg">
            Intrebarea {questionNumber}/{totalQuestions}
          </span>
          <Badge
            variant="outline"
            className={cn(
              question.type === "CS"
                ? "border-primary/30 bg-primary/5 text-primary rounded-full text-[11px] font-semibold"
                : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[11px] font-semibold"
            )}
          >
            {question.type}
          </Badge>
        </div>
        <Toggle
          pressed={isFlagged}
          onPressedChange={() => onFlag(question.id)}
          size="sm"
          aria-label="Marcheaza intrebarea"
          className={cn(
            isFlagged &&
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
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
          disabled={false}
        />
      </CardContent>
    </Card>
  )
}
