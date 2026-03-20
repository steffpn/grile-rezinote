"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, Clock, Info } from "lucide-react"
import Link from "next/link"

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

      {/* 30-minute review window notice */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Fereastra de revizuire: 30 minute
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
              Poti revizui detaliile raspunsurilor in Dashboard &rarr; Istoric doar in primele 30 de minute de la finalizarea testului. Dupa aceasta perioada, doar sumarul ramane vizibil.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back button */}
      <div className="flex justify-center pb-8">
        <Button asChild size="lg">
          <Link href="/practice">Inapoi la teste</Link>
        </Button>
      </div>
    </div>
  )
}
