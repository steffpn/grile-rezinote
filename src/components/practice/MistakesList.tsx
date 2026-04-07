"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { formatQuestionType } from "@/lib/format/question-type"
import {
  AlertTriangle,
  BookOpen,
  Target,
  TrendingDown,
  Sparkles,
  ArrowRight,
} from "lucide-react"

interface Mistake {
  questionId: string
  questionText: string
  questionType: "CS" | "CM"
  chapterName: string
  chapterId: string
  lastAnsweredAt: Date
  totalAttempts: number
  correctCount: number
  incorrectCount: number
}

interface ChapterWithCount {
  id: string
  name: string
  count: number
}

interface MistakesListProps {
  mistakes: Mistake[]
  chapters: ChapterWithCount[]
}

export function MistakesList({ mistakes, chapters }: MistakesListProps) {
  if (mistakes.length === 0) {
    return (
      <div className="space-y-4 text-center py-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10">
          <Sparkles className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold">
          Felicitari! Nu ai intrebari gresite de revizuit.
        </h2>
        <p className="text-muted-foreground">
          Continua cu teste practice pentru a-ti imbunatati cunostintele.
        </p>
        <Button asChild className="rounded-full gradient-primary border-0 text-white shadow-md">
          <Link href="/practice">Inapoi la teste</Link>
        </Button>
      </div>
    )
  }

  // Compute statistics
  const totalMistakes = mistakes.length
  const csMistakes = mistakes.filter((m) => m.questionType === "CS").length
  const cmMistakes = mistakes.filter((m) => m.questionType === "CM").length
  const totalAttempts = mistakes.reduce((sum, m) => sum + m.totalAttempts, 0)
  const totalCorrect = mistakes.reduce((sum, m) => sum + m.correctCount, 0)
  const totalIncorrect = mistakes.reduce((sum, m) => sum + m.incorrectCount, 0)
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  // Sort chapters by count descending
  const sortedChapters = [...chapters].sort((a, b) => b.count - a.count)
  const maxChapterCount = sortedChapters.length > 0 ? sortedChapters[0].count : 1

  // Difficulty: questions with most incorrect answers
  const hardestQuestions = [...mistakes]
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold">
            {totalMistakes} intrebari de revizuit
          </p>
          <p className="text-sm text-muted-foreground">
            Raspunde corect de 2 ori consecutiv pentru a elimina o intrebare
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="group rounded-full gradient-primary border-0 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Link href="/practice?wrongAnswersOnly=true">
            Exerseaza greselile
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/10 sm:h-12 sm:w-12">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Gresite
              </p>
              <p className="text-2xl font-bold">{totalMistakes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/10 sm:h-12 sm:w-12">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acuratete
              </p>
              <p className="text-2xl font-bold">{overallAccuracy}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/10 sm:h-12 sm:w-12">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                CS / CM
              </p>
              <p className="text-2xl font-bold">
                {csMistakes}/{cmMistakes}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/10 sm:h-12 sm:w-12">
              <TrendingDown className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Incercari
              </p>
              <p className="text-2xl font-bold">{totalAttempts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapter breakdown */}
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Gresite per capitol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedChapters.map((ch) => {
            const pct = Math.round((ch.count / maxChapterCount) * 100)
            return (
              <div key={ch.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-4">{ch.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold">{ch.count}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 rounded-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <Link href={`/practice?wrongAnswersOnly=true&chapters=${ch.id}`}>
                        Exerseaza
                      </Link>
                    </Button>
                  </div>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Hardest questions (no question text shown — just stats) */}
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Cele mai dificile intrebari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hardestQuestions.map((m, i) => {
              const accuracy =
                m.totalAttempts > 0
                  ? Math.round((m.correctCount / m.totalAttempts) * 100)
                  : 0
              return (
                <div
                  key={m.questionId}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.06] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          m.questionType === "CS"
                            ? "border-primary/30 bg-primary/5 text-primary rounded-full text-[10px] font-semibold"
                            : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-semibold"
                        }
                      >
                        {formatQuestionType(m.questionType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {m.chapterName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-red-400">
                        {m.incorrectCount} gresite
                      </span>
                      <span className="text-emerald-400">
                        {m.correctCount} corecte
                      </span>
                      <span className="text-muted-foreground">
                        {accuracy}% acuratete
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Progress value={accuracy} className="h-1.5 w-16" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info notice */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
            Textul intrebarilor nu este afisat aici pentru protectie anti-copiere. Apasa &quot;Exerseaza greselile&quot; pentru a le rezolva din nou in cadrul unui test.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
