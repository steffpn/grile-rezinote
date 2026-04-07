"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { QuestionCard } from "./QuestionCard"
import { ImmediateFeedbackModal } from "./ImmediateFeedbackModal"
import { submitAnswer, completePracticeAttempt } from "@/lib/actions/practice"
import { ChevronRight, CheckCircle } from "lucide-react"

interface QuestionOption {
  label: string
  text: string
}

interface Question {
  id: string
  text: string
  type: "CS" | "CM"
  subchapter: string | null
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
  isPartial?: boolean
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

  // Determine starting index: resume from the first unanswered question
  const getStartIndex = () => {
    for (let i = 0; i < questions.length; i++) {
      const ans = initialAnswers.get(questions[i].id)
      if (!ans || ans.isCorrect === null) return i
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
        .filter(([, ans]) => ans.isCorrect !== null)
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

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const currentIsAnswered = currentQuestion ? answeredIds.has(currentQuestion.id) : false

  // Forward-only navigation
  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, questions.length])

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
        toast.error("Nu am putut salva raspunsul")
        return
      }
      toast.success("Raspuns salvat")

      setAnsweredIds((prev) => {
        const next = new Set(prev)
        next.add(questionId)
        return next
      })

      const feedback: FeedbackData = {
        isCorrect: result.isCorrect,
        isPartial: (result as { isPartial?: boolean }).isPartial,
        correctOptions: result.correctOptions,
        sourceBook: result.sourceBook,
        sourcePage: result.sourcePage,
        score: result.score,
        maxScore: result.maxScore,
        questionType: result.questionType as "CS" | "CM",
      }

      setFeedbackData((prev) => {
        const next = new Map(prev)
        next.set(questionId, feedback)
        return next
      })

      if (feedbackMode === "immediate") {
        const questionNumber = questions.findIndex((q) => q.id === questionId) + 1
        setCurrentFeedback({ ...feedback, questionNumber })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAnswer(questionId: string, selectedOptions: string[]) {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, selectedOptions)
      return next
    })

    if (selectedOptions.length === 0) return

    const question = questions.find((q) => q.id === questionId)
    if (feedbackMode === "immediate" && question?.type === "CM") {
      return
    }

    await submitAndProcess(questionId, selectedOptions)
  }

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
    // Auto-advance to next question after closing feedback
    if (!isLastQuestion) {
      goNext()
    }
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      const result = await completePracticeAttempt(attemptId)
      if (result && "error" in result) {
        console.error("Complete error:", result.error)
        toast.error("Eroare la finalizare")
        return
      }
      toast.success("Test trimis cu succes")

      startTransition(() => {
        router.push(`/practice/${attemptId}/results`)
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const progressPercent =
    questions.length > 0
      ? Math.round((answeredIds.size / questions.length) * 100)
      : 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Top bar */}
      <div className="sticky top-0 z-30 space-y-2 rounded-b-xl border-b bg-background/95 px-3 pb-3 pt-2 backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tabular-nums sm:text-sm">
            <span className="hidden sm:inline">{answeredIds.size}/{questions.length} intrebari raspunse</span>
            <span className="sm:hidden">{answeredIds.size}/{questions.length} raspunse</span>
          </span>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
            {currentIndex + 1} / {questions.length}
          </span>
          <Button
            onClick={handleComplete}
            disabled={isCompleting || isPending}
            variant={answeredIds.size === questions.length ? "default" : "outline"}
            size="sm"
            className="min-h-[44px] text-xs sm:text-sm"
          >
            {isCompleting || isPending ? "Se finalizeaza..." : "Termina"}
          </Button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current question only */}
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
            <QuestionCard
            question={{
              id: currentQuestion.id,
              text: currentQuestion.text,
              type: currentQuestion.type,
              subchapter: currentQuestion.subchapter,
              options: currentQuestion.options.map((o) => ({
                label: o.label,
                text: o.text,
              })),
            }}
            questionNumber={currentIndex + 1}
            selected={answers.get(currentQuestion.id) ?? []}
            onAnswer={handleAnswer}
            onVerify={
              feedbackMode === "immediate" && currentQuestion.type === "CM"
                ? handleVerify
                : undefined
            }
            onFlag={handleFlag}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            isAnswered={answeredIds.has(currentQuestion.id)}
            disabled={isSubmitting}
            isVerifying={isSubmitting}
            feedback={
              feedbackMode === "immediate" && feedbackData.has(currentQuestion.id)
                ? {
                    isCorrect: feedbackData.get(currentQuestion.id)!.isCorrect,
                    correctOptions: feedbackData.get(currentQuestion.id)!.correctOptions,
                    sourceBook:
                      feedbackData.get(currentQuestion.id)!.sourceBook ??
                      currentQuestion.sourceBook,
                    sourcePage:
                      feedbackData.get(currentQuestion.id)!.sourcePage ??
                      currentQuestion.sourcePage,
                  }
                : undefined
            }
              showResults={feedbackMode === "immediate" && feedbackData.has(currentQuestion.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward-only navigation */}
      <div className="flex justify-end px-2 pb-20 sm:px-0 md:pb-4">
        {isLastQuestion ? (
          <Button
            onClick={handleComplete}
            disabled={isCompleting || isPending || !currentIsAnswered}
            className="min-h-[48px] gap-2 px-8 text-base"
          >
            <CheckCircle className="h-4 w-4" />
            Termina testul
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!currentIsAnswered}
            className="min-h-[48px] gap-2 px-8 text-base"
          >
            Urmatoarea
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
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
