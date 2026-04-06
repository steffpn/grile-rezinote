"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ExamTimer } from "./ExamTimer"
import { ExamQuestion } from "./ExamQuestion"
import { SubmitConfirmModal } from "./SubmitConfirmModal"
import { batchSaveAnswers, submitExam } from "@/lib/actions/exam"
import { ChevronRight, Send } from "lucide-react"

interface QuestionOption {
  label: string
  text: string
}

interface Question {
  id: string
  text: string
  type: "CS" | "CM"
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
        .map(([qId]) => qId)
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
        <ExamTimer deadline={deadline} onTimeUp={handleTimeUp} />

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>

          {isSaving && (
            <span className="hidden text-xs text-muted-foreground animate-pulse sm:inline">
              Salvare...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="hidden text-xs text-muted-foreground sm:inline">Salvat</span>
          )}

          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="min-h-[44px] gap-2 text-xs sm:text-sm"
          >
            <Send className="h-3.5 w-3.5" />
            Trimite
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current question */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="px-2 sm:px-0"
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
      <div className="flex justify-end px-2 pb-20 sm:px-0 md:pb-4">
        {isLastQuestion ? (
          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="min-h-[48px] gap-2 px-8 text-base"
          >
            <Send className="h-4 w-4" />
            Trimite examenul
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!currentHasAnswer}
            className="min-h-[48px] gap-2 px-8 text-base"
          >
            Urmatoarea
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Submit confirmation modal */}
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
