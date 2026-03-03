"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExamTimer } from "./ExamTimer"
import { ExamQuestion } from "./ExamQuestion"
import { ExamNavigator } from "./ExamNavigator"
import { SubmitConfirmModal } from "./SubmitConfirmModal"
import { batchSaveAnswers, submitExam } from "@/lib/actions/exam"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

  // Current question index
  const [currentIndex, setCurrentIndex] = useState(0)

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

  // Navigation
  const goToQuestion = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)))
    },
    [questions.length]
  )

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, questions.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  // Navigate by question ID (from navigator grid)
  const navigateToQuestion = useCallback(
    (questionId: string) => {
      const idx = questions.findIndex((q) => q.id === questionId)
      if (idx >= 0) {
        setCurrentIndex(idx)
      }
    },
    [questions]
  )

  // Handle answer selection
  function handleAnswer(questionId: string, selectedOptions: string[]) {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, selectedOptions)
      return next
    })

    // Track dirty for batch save
    dirtyAnswersRef.current.set(questionId, selectedOptions)

    // Update answered set
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
        // Restore dirty answers on error for retry
        for (const [k, v] of Object.entries(batch)) {
          dirtyAnswersRef.current.set(k, v)
        }
        return false
      }
      setLastSaved(new Date())
      return true
    } catch {
      // Restore on network error
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

  // Timer expired - auto submit
  const handleTimeUp = useCallback(async () => {
    if (isAutoSubmittingRef.current) return
    isAutoSubmittingRef.current = true

    // Flush any remaining dirty answers
    await flushDirtyAnswers()

    // Submit the exam
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
      // Flush dirty answers first
      await flushDirtyAnswers()

      // Submit exam
      const result = await submitExam(attemptId)
      if (result && "error" in result) {
        console.error("Submit error:", result.error)
        setIsSubmitting(false)
        setShowSubmitModal(false)
        return
      }

      router.push(`/exam/${attemptId}/results`)
    } catch {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goPrev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev])

  const unansweredCount = questions.length - answeredIds.size

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-4 pb-20 md:pb-4">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-2 py-3">
          <ExamTimer deadline={deadline} onTimeUp={handleTimeUp} />

          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1}/{questions.length}
          </span>

          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Salvare...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-xs text-muted-foreground">Salvat</span>
            )}
            <Button
              size="sm"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
            >
              Trimite examenul
            </Button>
          </div>
        </div>

        {/* Current question */}
        {currentQuestion && (
          <ExamQuestion
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selected={answers.get(currentQuestion.id) ?? []}
            onAnswer={handleAnswer}
            onFlag={handleFlag}
            isFlagged={flaggedIds.has(currentQuestion.id)}
          />
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterioara
          </Button>

          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="gap-2"
          >
            Urmatoarea
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigator sidebar */}
      <div className="w-48 shrink-0">
        <ExamNavigator
          questions={questions.map((q, i) => ({ id: q.id, number: i + 1 }))}
          answeredIds={answeredIds}
          flaggedIds={flaggedIds}
          currentQuestionId={currentQuestion?.id ?? ""}
          onNavigate={navigateToQuestion}
        />
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
