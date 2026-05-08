"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DashboardWindow,
  DashboardWindowCell,
  DashboardWindowGrid,
  MonoLabel,
  PercentBar,
  ScorePill,
  SectionTag,
} from "@/components/branded"
import { Confetti } from "@/components/practice/Confetti"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"
import { cn } from "@/lib/utils"

import { ChapterBreakdownChart } from "./ChapterBreakdownChart"
import { ExamReviewQuestion } from "./ExamReviewQuestion"
import { ScoreDistribution } from "./ScoreDistribution"
import { mockBellCurve } from "./score-distribution-data"

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
    id: string
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
  return `${h}:${m.toString().padStart(2, "0")}`
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

  // CS / CM breakdown
  const csQuestions = questions.filter((q) => q.type === "CS")
  const cmQuestions = questions.filter((q) => q.type === "CM")

  const csCorrect = csQuestions.filter(
    (q) => answers.get(q.id)?.isCorrect === true,
  ).length
  const cmCorrect = cmQuestions.filter(
    (q) => answers.get(q.id)?.isCorrect === true,
  ).length

  const csScore = csQuestions.reduce(
    (sum, q) => sum + (answers.get(q.id)?.score ?? 0),
    0,
  )
  const cmScore = cmQuestions.reduce(
    (sum, q) => sum + (answers.get(q.id)?.score ?? 0),
    0,
  )

  const correctCount = questions.filter(
    (q) => answers.get(q.id)?.isCorrect === true,
  ).length
  const incorrectCount = questions.filter(
    (q) => answers.get(q.id)?.isCorrect === false,
  ).length
  const unansweredCount = questions.length - correctCount - incorrectCount

  // Time stats — folosim time used / time limit pentru segments
  const timeTakenSeconds = attempt.completedAt
    ? Math.floor(
        (new Date(attempt.completedAt).getTime() -
          new Date(attempt.startedAt).getTime()) /
          1000,
      )
    : 0
  const timeLimitSeconds = attempt.timeLimit ?? 14400
  const timeRemainingSeconds = Math.max(0, timeLimitSeconds - timeTakenSeconds)
  const timeUsedPct = Math.min(100, (timeTakenSeconds / timeLimitSeconds) * 100)

  // Mock distribution curve (until cohort data is available)
  const distributionCurve = useMemo(
    () => mockBellCurve(720, 80, 500, 950),
    [],
  )
  const cohortMean = 720

  // Chart data pentru ChapterBreakdownChart
  const chapterChartData = chapterBreakdown.map((c) => ({
    chapterId: c.chapterId,
    chapterName: c.chapterName,
    totalQuestions: c.totalQuestions,
    correctCount: c.correctCount,
    percentage: c.percentage,
  }))

  // Greșeli (incorrect answers)
  const wrongQuestions = questions.filter((q) => {
    const ans = answers.get(q.id)
    return ans && ans.isCorrect === false
  })

  // Tone overall
  const overallTone =
    percentage >= 70 ? "pos" : percentage >= 50 ? "neutral" : "neg"
  const celebrate = percentage >= 70

  // Expanded mistakes state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Format completed date
  const completedAt = attempt.completedAt
    ? new Date(attempt.completedAt)
    : null
  const dateLabel = completedAt
    ? completedAt.toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
      })
    : "—"
  const timeLabel = completedAt
    ? completedAt.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

  return (
    <div className="space-y-6">
      <Confetti show={celebrate} />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionTag>Rezultat simulare</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[38px]">
            {percentage >= 70 ? (
              <>
                Felicitări.{" "}
                <span className="text-neon">Ai trecut testul.</span>
              </>
            ) : percentage >= 50 ? (
              <>
                Aproape acolo.{" "}
                <span className="text-warm">Mai sunt zone de lucrat.</span>
              </>
            ) : (
              <>
                Mai ai de muncă.{" "}
                <span className="text-danger">Vezi unde ai pierdut puncte.</span>
              </>
            )}
          </h1>
        </div>
        <ShareStoryButton attemptId={attempt.id} label="Distribuie" />
      </div>

      {/* Hero metric — DashboardWindow */}
      <DashboardWindow
        title={
          <span>
            simulare-{dateLabel}.tsx ·{" "}
            <span className="text-fg-dim">last attempt</span>
          </span>
        }
        status={
          <>
            <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]" />
            <MonoLabel size="body" tone="accent">
              finalizat {timeLabel}
            </MonoLabel>
          </>
        }
      >
        <DashboardWindowGrid cols={4}>
          {/* Score hero */}
          <DashboardWindowCell colSpan={2}>
            <MonoLabel size="cell">Scor total · max {maxScore}</MonoLabel>
            <div className="mt-3 font-mono text-[80px] font-semibold leading-none tracking-[-0.05em] text-fg sm:text-[96px]">
              {score}
              <span className="text-fg-mute">/{maxScore}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ScorePill tone={overallTone}>{percentage}% puncte</ScorePill>
              <MonoLabel size="body">
                CS <span className="text-fg">{csScore}</span> · CM{" "}
                <span className="text-fg">{cmScore}</span>
              </MonoLabel>
            </div>
          </DashboardWindowCell>

          {/* Acuratețe per întrebare */}
          <DashboardWindowCell>
            <MonoLabel size="cell">Acuratețe</MonoLabel>
            <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
              {questions.length > 0
                ? Math.round((correctCount / questions.length) * 100)
                : 0}
              <span className="text-fg-mute">%</span>
            </div>
            <PercentBar
              value={(correctCount / Math.max(1, questions.length)) * 100}
              className="mt-4"
            />
            <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
              <span className="text-neon">{correctCount}</span> /{" "}
              {questions.length} corecte
            </div>
          </DashboardWindowCell>

          {/* Timp folosit */}
          <DashboardWindowCell>
            <MonoLabel size="cell">Timp folosit</MonoLabel>
            <div className="mt-3 font-mono text-[36px] font-medium leading-none tracking-[-0.03em] text-fg">
              {formatDuration(timeTakenSeconds)}
              <span className="text-fg-mute">
                /{formatDuration(timeLimitSeconds)}
              </span>
            </div>
            <div className="mt-4 flex gap-[2px]">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = i < Math.floor(timeUsedPct / 10)
                return (
                  <span
                    key={i}
                    aria-hidden
                    className={cn(
                      "h-[18px] flex-1 rounded-[1px]",
                      filled ? "bg-neon-2" : "bg-bg-3",
                    )}
                  />
                )
              })}
            </div>
            <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
              {formatDuration(timeRemainingSeconds)} rămas nefolosit
            </div>
          </DashboardWindowCell>

          {/* Distribution chart */}
          <DashboardWindowCell colSpan={4}>
            <MonoLabel size="cell">Distribuția scorurilor</MonoLabel>
            <div className="mt-3">
              <ScoreDistribution
                curve={distributionCurve}
                userScore={score}
                cohortMean={cohortMean}
                height={180}
              />
            </div>
          </DashboardWindowCell>

          {/* Quick stats footer */}
          <DashboardWindowCell colSpan={4}>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <StatPill label="Corecte" value={correctCount} tone="pos" />
              <StatPill label="Greșite" value={incorrectCount} tone="danger" />
              <StatPill
                label="Nealese"
                value={unansweredCount}
                tone="neutral"
              />
              <span className="ml-auto font-mono text-[11px] uppercase tracking-mono text-fg-mute">
                CS {csCorrect}/50 · CM {cmCorrect}/150
              </span>
            </div>
          </DashboardWindowCell>
        </DashboardWindowGrid>
      </DashboardWindow>

      {/* Admitere — placeholder cu disclaimer (date reale vin via PREMIUM) */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div>
            <SectionTag>Admiterea ta</SectionTag>
            <p className="mt-1.5 text-[14px] text-fg-dim">
              Comparație cu pragurile reale 2025 — disponibil cu PREMIUM.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-warm/15 px-2 py-1 font-mono text-[10px] uppercase tracking-mono-tight text-warm">
            <Lock className="size-2.5" /> PREMIUM
          </span>
        </div>
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-8 text-center">
          <p className="mx-auto max-w-md text-[14px] leading-[1.55] text-fg-dim">
            Vezi instant dacă ai fi fost admis la oricare din cele{" "}
            <span className="text-fg">6 UMF-uri</span> din România. Praguri din
            2021–2025, calculul exact al diferenței față de prag, recomandări
            per capitol pentru +50 puncte.
          </p>
          <Button asChild className="mt-5" size="lg">
            <Link href="/pricing">Treci la PREMIUM</Link>
          </Button>
        </div>
      </section>

      {/* Tabs detail */}
      <section>
        <Tabs defaultValue="chapter">
          <TabsList variant="line" className="border-b border-line">
            <TabsTrigger value="chapter">Per capitol</TabsTrigger>
            <TabsTrigger value="mistakes">
              Greșeli{" "}
              <span className="ml-1 font-mono text-[10.5px] text-fg-mute">
                {wrongQuestions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="compare">Comparativ</TabsTrigger>
          </TabsList>

          <TabsContent value="chapter" className="pt-6">
            <div className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
              <ChapterBreakdownChart entries={chapterChartData} />
            </div>
          </TabsContent>

          <TabsContent value="mistakes" className="pt-6">
            {wrongQuestions.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
                <p className="text-[14px] text-fg-dim">
                  Nu ai greșit nicio întrebare. 💚
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {wrongQuestions.map((q, idx) => {
                  const ans = answers.get(q.id) ?? null
                  const correct = correctOptions.get(q.id) ?? []
                  const num = questions.findIndex((qq) => qq.id === q.id) + 1
                  return (
                    <ExamReviewQuestion
                      key={q.id}
                      question={q}
                      questionNumber={num}
                      answer={ans}
                      correctOptions={correct}
                      isExpanded={expandedIds.has(q.id) || idx === 0}
                      onToggle={() => toggleExpand(q.id)}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="pt-6">
            <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
              <SectionTag>În curând</SectionTag>
              <p className="mt-3 mx-auto max-w-md text-[14px] leading-[1.55] text-fg-dim">
                Slider istoric simulări precedente — vezi cum a evoluat scorul
                tău în timp. Disponibil după a doua simulare completă.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Review window notice */}
      <div className="flex items-start gap-3 rounded-[10px] border border-warm/30 bg-warm/8 p-3.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-warm/12 text-warm">
          <Lock className="size-3.5" />
        </span>
        <div className="min-w-0 text-[13px] leading-[1.55]">
          <span className="text-fg">Fereastră de revizuire · 30 minute.</span>{" "}
          <span className="text-fg-dim">
            Detaliile întrebărilor rămân vizibile doar 30 minute după
            finalizare. După, doar sumarul.
          </span>
        </div>
      </div>

      {/* Back */}
      <div className="flex justify-center pt-2">
        <Button asChild variant="outline" size="lg">
          <Link href="/exam">
            <ArrowLeft className="size-4" />
            Înapoi la simulări
          </Link>
        </Button>
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "pos" | "danger" | "neutral"
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "font-mono text-[28px] font-semibold leading-none tracking-[-0.03em]",
          tone === "pos" && "text-neon",
          tone === "danger" && "text-danger",
          tone === "neutral" && "text-fg-mute",
        )}
      >
        {value}
      </span>
      <MonoLabel size="cell">{label}</MonoLabel>
    </div>
  )
}
