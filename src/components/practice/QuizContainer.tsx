"use client"

import { useState, useRef, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { QuestionCard } from "./QuestionCard"
import { QuestionNavigator } from "./QuestionNavigator"
import { ImmediateFeedbackModal } from "./ImmediateFeedbackModal"
import { submitAnswer, completePracticeAttempt } from "@/lib/actions/practice"

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

interface FeedbackData {
  isCorrect: boolean
  correctOptions: string[]
  sourceBook: string | null
  sourcePage: string | null
  score: number
  maxScore: number
  questionType: "CS" | "CM"
}

interface QuizContainerProps {
  attemptId: string
  questions: Question[]
  feedbackMode: "immediate" | "deferred"
  initialAnswers: Map<string, AnswerData>
}

export function QuizContainer({
  attemptId,
  questions,
  feedbackMode,
  initialAnswers,
}: QuizContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
        .filter(([_, ans]) => ans.isCorrect !== null)
        .map(([qId]) => qId)
    )
  })
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())

  // Feedback state
  const [feedbackData, setFeedbackData] = useState<Map<string, FeedbackData>>(new Map())
  const [currentFeedback, setCurrentFeedback] = useState<
    (FeedbackData & { questionNumber: number }) | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Refs for scrolling
  const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const scrollToQuestion = useCallback((questionId: string) => {
    const el = questionRefs.current.get(questionId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  const scrollToNextUnanswered = useCallback(() => {
    const nextUnanswered = questions.find(
      (q) => !answeredIds.has(q.id)
    )
    if (nextUnanswered) {
      scrollToQuestion(nextUnanswered.id)
    }
  }, [questions, answeredIds, scrollToQuestion])

  // Submit answer to server and process feedback
  async function submitAndProcess(questionId: string, selectedOptions: string[]) {
    setIsSubmitting(true)

    try {
      const result = await submitAnswer({
        attemptId,
        questionId,
        selectedOptions,
      })

      if ("error" in result) {
        console.error("Submit answer error:", result.error)
        return
      }

      // Mark as answered
      setAnsweredIds((prev) => {
        const next = new Set(prev)
        next.add(questionId)
        return next
      })

      const feedback: FeedbackData = {
        isCorrect: result.isCorrect,
        correctOptions: result.correctOptions,
        sourceBook: result.sourceBook,
        sourcePage: result.sourcePage,
        score: result.score,
        maxScore: result.maxScore,
        questionType: result.questionType as "CS" | "CM",
      }

      // Store feedback
      setFeedbackData((prev) => {
        const next = new Map(prev)
        next.set(questionId, feedback)
        return next
      })

      // Show immediate feedback modal
      if (feedbackMode === "immediate") {
        const questionNumber = questions.findIndex((q) => q.id === questionId) + 1
        setCurrentFeedback({ ...feedback, questionNumber })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAnswer(questionId: string, selectedOptions: string[]) {
    // Update local state immediately
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, selectedOptions)
      return next
    })

    // Don't submit if no options selected
    if (selectedOptions.length === 0) return

    // For CM questions with immediate feedback, wait for explicit "Verify" click
    const question = questions.find((q) => q.id === questionId)
    if (feedbackMode === "immediate" && question?.type === "CM") {
      return
    }

    await submitAndProcess(questionId, selectedOptions)
  }

  // Called when user clicks "Verifica raspunsul" on a CM question
  async function handleVerify(questionId: string) {
    const selectedOptions = answers.get(questionId)
    if (!selectedOptions || selectedOptions.length === 0) return
    await submitAndProcess(questionId, selectedOptions)
  }

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

  function handleFeedbackClose() {
    setCurrentFeedback(null)
    scrollToNextUnanswered()
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      const result = await completePracticeAttempt(attemptId)
      if (result && "error" in result) {
        console.error("Complete error:", result.error)
        return
      }

      if (feedbackMode === "deferred") {
        startTransition(() => {
          router.push(`/practice/${attemptId}/results`)
        })
      } else {
        startTransition(() => {
          router.push(`/practice/${attemptId}/results`)
        })
      }
    } finally {
      setIsCompleting(false)
    }
  }

  const progressPercent =
    questions.length > 0
      ? Math.round((answeredIds.size / questions.length) * 100)
      : 0

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-4 pb-20 md:pb-4">
        {/* Top bar */}
        <div className="sticky top-0 z-30 space-y-2 border-b bg-background pb-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {answeredIds.size}/{questions.length} intrebari raspunse
            </span>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || isPending}
              variant={answeredIds.size === questions.length ? "default" : "outline"}
            >
              {isCompleting || isPending ? "Se finalizeaza..." : "Termina testul"}
            </Button>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => {
            const questionFeedback = feedbackData.get(question.id)
            const showFeedback =
              feedbackMode === "immediate" && questionFeedback !== undefined

            return (
              <QuestionCard
                key={question.id}
                ref={(el) => {
                  if (el) questionRefs.current.set(question.id, el)
                }}
                question={{
                  id: question.id,
                  text: question.text,
                  type: question.type,
                  options: question.options.map((o) => ({
                    label: o.label,
                    text: o.text,
                  })),
                }}
                questionNumber={index + 1}
                selected={answers.get(question.id) ?? []}
                onAnswer={handleAnswer}
                onVerify={
                  feedbackMode === "immediate" && question.type === "CM"
                    ? handleVerify
                    : undefined
                }
                onFlag={handleFlag}
                isFlagged={flaggedIds.has(question.id)}
                isAnswered={answeredIds.has(question.id)}
                disabled={isSubmitting}
                isVerifying={isSubmitting}
                feedback={
                  showFeedback && questionFeedback
                    ? {
                        isCorrect: questionFeedback.isCorrect,
                        correctOptions: questionFeedback.correctOptions,
                        sourceBook: questionFeedback.sourceBook ?? question.sourceBook,
                        sourcePage: questionFeedback.sourcePage ?? question.sourcePage,
                      }
                    : undefined
                }
                showResults={showFeedback}
              />
            )
          })}
        </div>
      </div>

      {/* Navigator */}
      <div className="w-48 shrink-0">
        <QuestionNavigator
          questions={questions.map((q, i) => ({ id: q.id, number: i + 1 }))}
          answeredIds={answeredIds}
          flaggedIds={flaggedIds}
          onNavigate={scrollToQuestion}
        />
      </div>

      {/* Immediate feedback modal */}
      {feedbackMode === "immediate" && (
        <ImmediateFeedbackModal
          isOpen={currentFeedback !== null}
          onClose={handleFeedbackClose}
          feedback={currentFeedback}
        />
      )}
    </div>
  )
}
