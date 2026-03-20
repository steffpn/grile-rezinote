"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X, Clock, Info } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

interface ChapterBreakdown {
  chapterId: string
  chapterName: string
  totalQuestions: number
  correctCount: number
  score: number
  maxScore: number
  percentage: number
}

interface ExamResultsProps {
  attempt: {
    score: number | null
    maxScore: number | null
    startedAt: Date
    completedAt: Date | null
    timeLimit: number | null
  }
  questions: Question[]
  answers: Map<string, AnswerData>
  correctOptions: Map<string, string[]>
  chapterBreakdown: ChapterBreakdown[]
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function ExamResults({
  attempt,
  questions,
  answers,
  correctOptions,
  chapterBreakdown,
}: ExamResultsProps) {

  const score = attempt.score ?? 0
  const maxScore = attempt.maxScore ?? 950
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  // Compute CS/CM breakdown
  const csQuestions = questions.filter((q) => q.type === "CS")
  const cmQuestions = questions.filter((q) => q.type === "CM")

  const csCorrect = csQuestions.filter(
    (q) => answers.get(q.id)?.isCorrect === true
  ).length
  const cmCorrect = cmQuestions.filter(
    (q) => answers.get(q.id)?.isCorrect === true
  ).length

  const csScore = csQuestions.reduce(
    (sum, q) => sum + (answers.get(q.id)?.score ?? 0),
    0
  )
  const cmScore = cmQuestions.reduce(
    (sum, q) => sum + (answers.get(q.id)?.score ?? 0),
    0
  )

  const correctCount = questions.filter(
    (q) => answers.get(q.id)?.isCorrect === true
  ).length
  const incorrectCount = questions.filter(
    (q) => answers.get(q.id)?.isCorrect === false
  ).length
  const unansweredCount = questions.length - correctCount - incorrectCount

  // Time stats
  const timeTakenSeconds = attempt.completedAt
    ? Math.floor(
        (new Date(attempt.completedAt).getTime() -
          new Date(attempt.startedAt).getTime()) /
          1000
      )
    : 0
  const timeRemainingSeconds = Math.max(
    0,
    (attempt.timeLimit ?? 14400) - timeTakenSeconds
  )

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Rezultate Simulare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold">
              {score}/{maxScore}
            </p>
            <p className="mt-1 text-2xl text-muted-foreground">
              {percentage}% puncte
            </p>
          </div>

          <Progress value={percentage} className="h-3" />

          {/* CS / CM breakdown */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3 text-center">
              <Badge
                variant="outline"
                className="mb-1 border-primary/30 bg-primary/5 text-primary rounded-full text-[11px] font-semibold"
              >
                CS
              </Badge>
              <p className="text-lg font-semibold">
                {csCorrect}/50 corecte
              </p>
              <p className="text-sm text-muted-foreground">
                {csScore}/200 puncte
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Badge
                variant="outline"
                className="mb-1 border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[11px] font-semibold"
              >
                CM
              </Badge>
              <p className="text-lg font-semibold">
                {cmCorrect}/150 corecte
              </p>
              <p className="text-sm text-muted-foreground">
                {cmScore}/750 puncte
              </p>
            </div>
          </div>

          {/* Quick stats */}
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

          {/* Time stats */}
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Timp utilizat: {formatDuration(timeTakenSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                Timp ramas: {formatDuration(timeRemainingSeconds)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Rezultate pe capitole</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capitol</TableHead>
                <TableHead className="text-center">Intrebari</TableHead>
                <TableHead className="text-center">Corecte</TableHead>
                <TableHead className="text-center">Scor</TableHead>
                <TableHead className="text-center">Acuratete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapterBreakdown.map((chapter) => (
                <TableRow key={chapter.chapterId}>
                  <TableCell className="font-medium">
                    {chapter.chapterName}
                  </TableCell>
                  <TableCell className="text-center">
                    {chapter.totalQuestions}
                  </TableCell>
                  <TableCell className="text-center">
                    {chapter.correctCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {chapter.score}/{chapter.maxScore}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "font-medium",
                        chapter.percentage >= 80 &&
                          "text-green-600 dark:text-green-400",
                        chapter.percentage >= 50 &&
                          chapter.percentage < 80 &&
                          "text-yellow-600 dark:text-yellow-400",
                        chapter.percentage < 50 &&
                          "text-red-600 dark:text-red-400"
                      )}
                    >
                      {chapter.percentage}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              Poti revizui detaliile raspunsurilor in Dashboard &rarr; Istoric doar in primele 30 de minute de la finalizarea simularii. Dupa aceasta perioada, doar sumarul ramane vizibil.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back button */}
      <div className="flex justify-center pb-8">
        <Button asChild size="lg">
          <Link href="/exam">Inapoi la simulari</Link>
        </Button>
      </div>
    </div>
  )
}
