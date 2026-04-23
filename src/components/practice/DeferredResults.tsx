"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, Clock } from "lucide-react"
import Link from "next/link"
import { NumberTicker } from "./NumberTicker"
import { Confetti } from "./Confetti"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"

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
    id: string
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

  const celebrate = percentage >= 70

  return (
    <div className="space-y-6">
      <Confetti show={celebrate} />
      {/* Score Summary */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Rezultate</CardTitle>
          <ShareStoryButton
            attemptId={attempt.id}
            label="Distribuie rezultatul"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="text-4xl font-bold tabular-nums sm:text-5xl">
              <NumberTicker value={score} />
              <span className="text-muted-foreground">/{maxScore}</span>
            </p>
            <p className="mt-1 text-lg text-muted-foreground">
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

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
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
