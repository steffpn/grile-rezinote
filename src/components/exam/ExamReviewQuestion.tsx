"use client"

import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"

import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "@/components/practice/QuestionOptionGroup"
import { formatQuestionType } from "@/lib/format/question-type"

interface QuestionOption {
  label: string
  text: string
}

interface ExamReviewQuestionProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    sourceBook: string | null
    sourcePage: string | null
    options: QuestionOption[]
  }
  questionNumber: number
  answer: {
    selectedOptions: string[]
    isCorrect: boolean | null
    score: number | null
  } | null
  correctOptions: string[]
  isExpanded: boolean
  onToggle: () => void
}

export function ExamReviewQuestion({
  question,
  questionNumber,
  answer,
  correctOptions,
  isExpanded,
  onToggle,
}: ExamReviewQuestionProps) {
  const isAnswered = answer !== null && answer.isCorrect !== null
  const isCorrect = answer?.isCorrect === true

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] border bg-bg-2 transition-colors",
        isAnswered
          ? isCorrect
            ? "border-neon/35"
            : "border-danger/35"
          : "border-line",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-bg-3/40"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <MonoLabel size="body" tone="mute">
            #{questionNumber}
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
          {isAnswered ? (
            <span
              className={cn(
                "rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight",
                isCorrect
                  ? "bg-neon/14 text-neon"
                  : "bg-danger/14 text-danger",
              )}
            >
              {isCorrect ? "Corect" : "Greșit"}
              {answer?.score !== null && ` · ${answer.score}p`}
            </span>
          ) : (
            <span className="rounded-[3px] bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-fg-mute">
              Neselectat
            </span>
          )}
          <span className="truncate text-[13px] text-fg-dim">
            {question.text}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="size-4 shrink-0 text-fg-mute" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-fg-mute" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-line p-4 sm:p-5">
          <p className="break-words text-[14.5px] leading-[1.55] text-fg">
            {question.text}
          </p>

          <QuestionOptionGroup
            questionType={question.type}
            options={question.options}
            selected={answer?.selectedOptions ?? []}
            onChange={() => {}}
            disabled
            correctOptions={correctOptions}
            showResults
          />

          {/* Source reference */}
          {!isCorrect &&
            isAnswered &&
            (question.sourceBook || question.sourcePage) && (
              <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-bg-3 px-3.5 py-2.5">
                <BookOpen className="size-4 shrink-0 text-fg-mute" />
                <span className="text-[13px] italic text-fg-mute">
                  Sursa: {question.sourceBook}
                  {question.sourcePage && `, pag. ${question.sourcePage}`}
                </span>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
