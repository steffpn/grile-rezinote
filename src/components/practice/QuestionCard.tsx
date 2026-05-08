"use client"

import { forwardRef } from "react"
import { BookOpen, CheckCircle2, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"
import { formatQuestionType } from "@/lib/format/question-type"

import { QuestionOptionGroup } from "./QuestionOptionGroup"

interface QuestionOption {
  label: string
  text: string
}

interface Feedback {
  isCorrect: boolean
  correctOptions: string[]
  sourceBook: string | null
  sourcePage: string | null
}

interface QuestionCardProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    subchapter?: string | null
    options: QuestionOption[]
  }
  questionNumber: number
  selected: string[]
  onAnswer: (questionId: string, selected: string[]) => void
  onVerify?: (questionId: string) => void
  onFlag: (questionId: string) => void
  isFlagged: boolean
  isAnswered: boolean
  disabled?: boolean
  feedback?: Feedback
  showResults?: boolean
  isVerifying?: boolean
}

export const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(
  function QuestionCard(
    {
      question,
      questionNumber,
      selected,
      onAnswer,
      onVerify,
      onFlag,
      isFlagged,
      isAnswered,
      disabled = false,
      feedback,
      showResults = false,
      isVerifying = false,
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        id={`question-${question.id}`}
        data-protected="question"
        className={cn(
          "rounded-[14px] border bg-bg-2 transition-all",
          // outer state border
          showResults && feedback?.isCorrect && "border-neon/40",
          showResults && feedback && !feedback.isCorrect && "border-danger/40",
          !showResults && "border-line",
        )}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <MonoLabel size="body" tone="mute">
              Întrebarea {questionNumber}
            </MonoLabel>
            <span
              className={cn(
                "rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight",
                question.type === "CS"
                  ? "bg-neon/12 text-neon"
                  : "bg-warm/12 text-warm",
              )}
            >
              {formatQuestionType(question.type)}
            </span>
            {showResults && feedback && (
              <span
                className={cn(
                  "rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight",
                  feedback.isCorrect
                    ? "bg-neon/14 text-neon"
                    : "bg-danger/14 text-danger",
                )}
              >
                {feedback.isCorrect ? "Corect" : "Greșit"}
              </span>
            )}
          </div>
          <Toggle
            pressed={isFlagged}
            onPressedChange={() => onFlag(question.id)}
            size="sm"
            aria-label="Marchează întrebarea"
            className={cn(
              "rounded-[7px]",
              isFlagged && "bg-warm/15 text-warm hover:bg-warm/20",
            )}
          >
            <Flag className="size-4" />
          </Toggle>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {question.subchapter && (
            <MonoLabel size="cell" tone="accent">
              {question.subchapter}
            </MonoLabel>
          )}
          <p className="break-words text-[15px] leading-[1.55] text-fg">
            {question.text}
          </p>

          <QuestionOptionGroup
            questionType={question.type}
            options={question.options}
            selected={selected}
            onChange={(newSelected) => onAnswer(question.id, newSelected)}
            disabled={disabled || showResults}
            correctOptions={feedback?.correctOptions}
            showResults={showResults}
          />

          {/* Verify button for CM questions with immediate feedback */}
          {onVerify && !isAnswered && !showResults && selected.length > 0 && (
            <Button
              onClick={() => onVerify(question.id)}
              disabled={isVerifying}
              size="lg"
              className="w-full"
            >
              <CheckCircle2 className="size-4" />
              {isVerifying ? "Se verifică..." : "Verifică răspunsul"}
            </Button>
          )}

          {/* Source reference */}
          {feedback &&
            (feedback.sourceBook || feedback.sourcePage) && (
              <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-bg-3 px-3.5 py-2.5">
                <BookOpen className="size-4 shrink-0 text-fg-mute" />
                <span className="text-[13px] italic text-fg-mute">
                  Sursa: {feedback.sourceBook}
                  {feedback.sourcePage && `, pag. ${feedback.sourcePage}`}
                </span>
              </div>
            )}
        </div>
      </div>
    )
  },
)
