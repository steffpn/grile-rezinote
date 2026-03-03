"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "@/components/practice/QuestionOptionGroup"

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
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">Intrebarea {questionNumber}</span>
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
          <p className="text-base leading-relaxed">{question.text}</p>

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
