"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "@/components/practice/QuestionOptionGroup"
import { formatQuestionType } from "@/lib/format/question-type"

interface QuestionOption {
  label: string
  text: string
}

interface ExamReviewQuestionProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    sourceBook: string | null
    sourcePage: string | null
    options: QuestionOption[]
  }
  questionNumber: number
  answer: {
    selectedOptions: string[]
    isCorrect: boolean | null
    score: number | null
  } | null
  correctOptions: string[]
  isExpanded: boolean
  onToggle: () => void
}

export function ExamReviewQuestion({
  question,
  questionNumber,
  answer,
  correctOptions,
  isExpanded,
  onToggle,
}: ExamReviewQuestionProps) {
  const isAnswered = answer !== null && answer.isCorrect !== null
  const isCorrect = answer?.isCorrect === true

  return (
    <Card
      className={cn(
        "transition-all",
        isAnswered
          ? isCorrect
            ? "border-green-300 dark:border-green-700"
            : "border-red-300 dark:border-red-700"
          : "border-muted"
      )}
    >
      <CardHeader className="pb-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-bold">Intrebarea {questionNumber}</span>
            <Badge
              variant="outline"
              className={cn(
                question.type === "CS"
                  ? "border-primary/30 bg-primary/5 text-primary rounded-full text-[11px] font-semibold"
                  : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[11px] font-semibold"
              )}
            >
              {formatQuestionType(question.type)}
            </Badge>
            {isAnswered ? (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className={cn(
                  isCorrect && "bg-green-600 hover:bg-green-700"
                )}
              >
                {isCorrect ? "Corect" : "Gresit"}
                {answer?.score !== null && ` (${answer.score} pct)`}
              </Badge>
            ) : (
              <Badge variant="secondary">Neraspuns</Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          <p className="text-base leading-relaxed break-words">{question.text}</p>

          <QuestionOptionGroup
            questionType={question.type}
            options={question.options}
            selected={answer?.selectedOptions ?? []}
            onChange={() => {}}
            disabled
            correctOptions={correctOptions}
            showResults
          />

          {/* Source reference for incorrect answers */}
          {!isCorrect &&
            isAnswered &&
            (question.sourceBook || question.sourcePage) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-800 dark:text-amber-200">
                  Sursa: {question.sourceBook}
                  {question.sourcePage && `, pag. ${question.sourcePage}`}
                </span>
              </div>
            )}
        </CardContent>
      )}
    </Card>
  )
}
