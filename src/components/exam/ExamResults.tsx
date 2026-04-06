"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NumberTicker } from "@/components/practice/NumberTicker"
import { Confetti } from "@/components/practice/Confetti"

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

  const celebrate = percentage >= 70

  return (
    <div className="space-y-6">
      <Confetti show={celebrate} />
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Rezultate Simulare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="text-5xl font-bold tabular-nums">
              <NumberTicker value={score} />
              <span className="text-muted-foreground">/{maxScore}</span>
            </p>
            <p className="mt-1 text-2xl text-muted-foreground">
              <NumberTicker value={percentage} />% puncte
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0, transformOrigin: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <Progress value={percentage} className="h-3" />
          </motion.div>

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
        <CardContent className="space-y-4">
          {chapterBreakdown.map((chapter, idx) => {
            const tone =
              chapter.percentage >= 80
                ? "from-emerald-500 to-teal-400"
                : chapter.percentage >= 50
                  ? "from-amber-500 to-yellow-400"
                  : "from-rose-500 to-red-400"
            const txt =
              chapter.percentage >= 80
                ? "text-emerald-600 dark:text-emerald-400"
                : chapter.percentage >= 50
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
            return (
              <div key={chapter.chapterId} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium truncate">{chapter.chapterName}</span>
                  <span className={cn("font-semibold tabular-nums", txt)}>
                    {chapter.correctCount}/{chapter.totalQuestions} · {chapter.percentage}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${chapter.percentage}%` }}
                    transition={{
                      duration: 1.1,
                      delay: 0.15 + idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn("h-full rounded-full bg-gradient-to-r", tone)}
                  />
                </div>
              </div>
            )
          })}
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
