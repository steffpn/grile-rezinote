"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { ChevronRight, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MonoLabel } from "@/components/branded"
import { batchSaveAnswers, submitExam } from "@/lib/actions/exam"
import { cn } from "@/lib/utils"

import { ExamTimer } from "./ExamTimer"
import { ExamQuestion } from "./ExamQuestion"
import { ExamNavigator } from "./ExamNavigator"
import { SubmitConfirmModal } from "./SubmitConfirmModal"

interface QuestionOption {
  label: string
  text: string
}

interface Question {
  id: string
  text: string
  type: "CS" | "CM"
  subchapter: string | null
  options: QuestionOption[]
}

interface ExamContainerProps {
  attemptId: string
  questions: Question[]
  deadline: Date
  initialAnswers: Map<string, { selectedOptions: string[] }>
}

export function ExamContainer({
  attemptId,
  questions,
  deadline,
  initialAnswers,
}: ExamContainerProps) {
  const router = useRouter()

  // Determine starting index: resume from the first unanswered question
  const getStartIndex = () => {
    for (let i = 0; i < questions.length; i++) {
      const ans = initialAnswers.get(questions[i].id)
      if (!ans || ans.selectedOptions.length === 0) return i
    }
    return questions.length - 1
  }

  const [currentIndex, setCurrentIndex] = useState(getStartIndex)

  // Answer state
  const [answers, setAnswers] = useState<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>()
    for (const [qId, ans] of initialAnswers) {
      map.set(qId, ans.selectedOptions)
    }
    return map
  })

  const [answeredIds, setAnsweredIds] = useState<Set<string>>(() => {
    return new Set(
      Array.from(initialAnswers.entries())
        .filter(([, ans]) => ans.selectedOptions.length > 0)
        .map(([qId]) => qId),
    )
  })

  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())

  // Dirty tracking for batch save
  const dirtyAnswersRef = useRef<Map<string, string[]>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const isAutoSubmittingRef = useRef(false)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const currentHasAnswer = currentQuestion
    ? (answers.get(currentQuestion.id)?.length ?? 0) > 0
    : false

  // Forward-only navigation — no going back
  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, questions.length])

  // Handle answer selection
  function handleAnswer(questionId: string, selectedOptions: string[]) {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, selectedOptions)
      return next
    })

    dirtyAnswersRef.current.set(questionId, selectedOptions)

    if (selectedOptions.length > 0) {
      setAnsweredIds((prev) => {
        const next = new Set(prev)
        next.add(questionId)
        return next
      })
    } else {
      setAnsweredIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  // Handle flag toggle
  function handleFlag(questionId: string) {
    setFlaggedIds((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  // Flush dirty answers to server
  const flushDirtyAnswers = useCallback(async () => {
    if (dirtyAnswersRef.current.size === 0) return true

    const batch = Object.fromEntries(dirtyAnswersRef.current)
    dirtyAnswersRef.current.clear()

    setIsSaving(true)
    try {
      const result = await batchSaveAnswers({ attemptId, answers: batch })
      if (result && "error" in result) {
        for (const [k, v] of Object.entries(batch)) {
          dirtyAnswersRef.current.set(k, v)
        }
        return false
      }
      setLastSaved(new Date())
      return true
    } catch {
      for (const [k, v] of Object.entries(batch)) {
        dirtyAnswersRef.current.set(k, v)
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }, [attemptId])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyAnswersRef.current.size > 0 && !isAutoSubmittingRef.current) {
        flushDirtyAnswers()
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [flushDirtyAnswers])

  // Also flush when navigating to next question
  const handleNext = useCallback(() => {
    flushDirtyAnswers()
    goNext()
  }, [flushDirtyAnswers, goNext])

  // Timer expired - auto submit
  const handleTimeUp = useCallback(async () => {
    if (isAutoSubmittingRef.current) return
    isAutoSubmittingRef.current = true

    await flushDirtyAnswers()

    try {
      await submitExam(attemptId)
    } finally {
      router.push(`/exam/${attemptId}/results`)
    }
  }, [attemptId, flushDirtyAnswers, router])

  // Manual submit
  async function handleSubmitConfirm() {
    setIsSubmitting(true)
    try {
      await flushDirtyAnswers()

      const result = await submitExam(attemptId)
      if (result && "error" in result) {
        console.error("Submit error:", result.error)
        toast.error("Eroare la trimitere")
        setIsSubmitting(false)
        setShowSubmitModal(false)
        return
      }

      toast.success("Examen trimis cu succes")
      router.push(`/exam/${attemptId}/results`)
    } catch {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const unansweredCount = questions.length - answeredIds.size
  const progressPct = ((currentIndex + 1) / questions.length) * 100

  // Listă întrebări pentru navigator (pentru drawer view)
  const navigatorQuestions = questions.map((q, i) => ({
    id: q.id,
    number: i + 1,
  }))

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Top bar: timer center, counter dreapta, submit */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-bg/[0.85] px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-[200px] items-center gap-3">
          <MonoLabel size="cell">Simulare</MonoLabel>
          <SaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
        </div>

        <ExamTimer deadline={deadline} onTimeUp={handleTimeUp} />

        <div className="flex min-w-[200px] items-center justify-end gap-2">
          <span className="hidden font-mono text-[12px] text-fg-mute sm:inline">
            <span className="text-fg">{currentIndex + 1}</span>
            <span> / {questions.length}</span>
          </span>
          <ExamNavigator
            questions={navigatorQuestions}
            answeredIds={answeredIds}
            flaggedIds={flaggedIds}
            currentQuestionId={currentQuestion?.id ?? ""}
          />
          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Trimite</span>
          </Button>
        </div>
      </header>

      {/* Progress bar — 200 segmente fine */}
      <div className="border-b border-line bg-bg-2/50 px-4 py-2 sm:px-6">
        <div className="flex w-full gap-[1px]">
          {questions.map((q, i) => {
            const isAnswered = answeredIds.has(q.id)
            const isCurrent = i === currentIndex
            return (
              <span
                key={q.id}
                aria-hidden
                className={cn(
                  "h-[3px] flex-1 transition-colors",
                  isCurrent
                    ? "bg-neon shadow-[0_0_4px_var(--neon)]"
                    : isAnswered
                      ? "bg-neon-2"
                      : "bg-bg-3",
                )}
              />
            )
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
          <span>{Math.round(progressPct)}% parcurs</span>
          <span>
            <span className="text-fg-dim">{answeredIds.size}</span> răspunse ·{" "}
            <span className="text-warm">{flaggedIds.size}</span> marcate
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-[720px]">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <ExamQuestion
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                  selected={answers.get(currentQuestion.id) ?? []}
                  onAnswer={handleAnswer}
                  onFlag={handleFlag}
                  isFlagged={flaggedIds.has(currentQuestion.id)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forward-only navigation */}
          <div className="mt-6 flex justify-end">
            {isLastQuestion ? (
              <Button
                size="lg"
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
              >
                <Send className="size-4" />
                Trimite examenul
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!currentHasAnswer}
              >
                Următoarea
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitConfirm}
        unansweredCount={unansweredCount}
        totalQuestions={questions.length}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

function SaveIndicator({
  isSaving,
  lastSaved,
}: {
  isSaving: boolean
  lastSaved: Date | null
}) {
  if (isSaving) {
    return (
      <span className="hidden items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute sm:inline-flex">
        <span className="size-1.5 animate-pulse rounded-full bg-warm" />
        salvare
      </span>
    )
  }
  if (lastSaved) {
    return (
      <span className="hidden items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute sm:inline-flex">
        <span className="size-1.5 rounded-full bg-neon" />
        salvat
      </span>
    )
  }
  return null
}
