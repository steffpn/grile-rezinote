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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            Intrebarea {questionNumber}/{totalQuestions}
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
