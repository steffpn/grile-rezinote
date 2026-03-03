"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Check, X } from "lucide-react"
import Link from "next/link"
import { QuestionOptionGroup } from "./QuestionOptionGroup"

interface QuestionOption {
  label: string
  text: string
}

interface Question {
  id: string
  text: string
  type: "CS" | "CM"
  sourceBook: string | null
  sourcePage: string | null
  options: QuestionOption[]
}

interface AnswerData {
  selectedOptions: string[]
  isCorrect: boolean | null
  score: number | null
}

interface DeferredResultsProps {
  attempt: {
    score: number | null
    maxScore: number | null
    completedAt: Date | null
  }
  questions: Question[]
  answers: Map<string, AnswerData>
  correctOptions: Map<string, string[]>
}

export function DeferredResults({
  attempt,
  questions,
  answers,
  correctOptions,
}: DeferredResultsProps) {
  const score = attempt.score ?? 0
  const maxScore = attempt.maxScore ?? 0
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const correctCount = questions.filter((q) => {
    const ans = answers.get(q.id)
    return ans?.isCorrect === true
  }).length

  const incorrectCount = questions.filter((q) => {
    const ans = answers.get(q.id)
    return ans?.isCorrect === false
  }).length

  const unansweredCount = questions.length - correctCount - incorrectCount

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Rezultate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold">
              {score}/{maxScore}
            </p>
            <p className="text-lg text-muted-foreground">
              {percentage}% puncte
            </p>
          </div>

          <Progress value={percentage} className="h-3" />

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-600" />
              <span>{correctCount} corecte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <X className="h-4 w-4 text-red-600" />
              <span>{incorrectCount} gresite</span>
            </div>
            {unansweredCount > 0 && (
              <span className="text-muted-foreground">
                {unansweredCount} neraspunse
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detalii pe intrebari</h2>

        {questions.map((question, index) => {
          const answer = answers.get(question.id)
          const correct = correctOptions.get(question.id) ?? []
          const isCorrect = answer?.isCorrect === true
          const isAnswered = answer?.isCorrect !== null && answer?.isCorrect !== undefined

          return (
            <Card
              key={question.id}
              className={
                isAnswered
                  ? isCorrect
                    ? "border-green-300 dark:border-green-700"
                    : "border-red-300 dark:border-red-700"
                  : "border-muted"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Intrebarea {index + 1}</span>
                  <Badge
                    variant="outline"
                    className={
                      question.type === "CS"
                        ? "border-primary/30 bg-primary/5 text-primary rounded-full text-[11px] font-semibold"
                        : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[11px] font-semibold"
                    }
                  >
                    {question.type}
                  </Badge>
                  {isAnswered && (
                    <Badge
                      variant={isCorrect ? "default" : "destructive"}
                      className={
                        isCorrect ? "bg-green-600 hover:bg-green-700" : ""
                      }
                    >
                      {isCorrect ? "Corect" : "Gresit"}
                      {answer?.score !== null && ` (${answer.score} pct)`}
                    </Badge>
                  )}
                  {!isAnswered && (
                    <Badge variant="secondary">Neraspuns</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-base">{question.text}</p>

                <QuestionOptionGroup
                  questionType={question.type}
                  options={question.options}
                  selected={answer?.selectedOptions ?? []}
                  onChange={() => {}}
                  disabled
                  correctOptions={correct}
                  showResults
                />

                {/* Source for incorrect */}
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
            </Card>
          )
        })}
      </div>

      {/* Back button */}
      <div className="flex justify-center pb-8">
        <Button asChild size="lg">
          <Link href="/practice">Inapoi la teste</Link>
        </Button>
      </div>
    </div>
  )
}
