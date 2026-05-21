"use client"

import { Flag } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"
import { QuestionOptionGroup } from "@/components/practice/QuestionOptionGroup"
import { formatQuestionType } from "@/lib/format/question-type"

interface QuestionOption {
  label: string
  text: string
}

interface ExamQuestionProps {
  question: {
    id: string
    text: string
    type: "CS" | "CM"
    chapterName?: string | null
    subchapter?: string | null
    options: QuestionOption[]
  }
  questionNumber: number
  totalQuestions: number
  selected: string[]
  onAnswer: (questionId: string, selected: string[]) => void
  onFlag: (questionId: string) => void
  isFlagged: boolean
}

/**
 * ExamQuestion — variant simplificat al QuestionCard pentru contextul de
 * examen: fără feedback (forward-only), fără verify button. Aceeași anatomie
 * (header mono · subchapter · text · opțiuni A-E).
 *
 * Spec § 3.5 — întrebare centered max-w 720, opțiuni gap 6.
 */
export function ExamQuestion({
  question,
  questionNumber,
  totalQuestions,
  selected,
  onAnswer,
  onFlag,
  isFlagged,
}: ExamQuestionProps) {
  return (
    <div
      data-protected="question"
      className="rounded-[14px] border border-line bg-bg-2"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <MonoLabel size="body" tone="mute">
            Întrebarea {questionNumber}{" "}
            <span className="text-fg-mute/70">/ {totalQuestions}</span>
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
      <div className="space-y-5 p-5 sm:p-6">
        {(question.chapterName || question.subchapter) && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {question.chapterName && (
              <MonoLabel size="cell" tone="accent">
                {question.chapterName}
              </MonoLabel>
            )}
            {question.chapterName && question.subchapter && (
              <span className="font-mono text-[10px] text-fg-mute/60">·</span>
            )}
            {question.subchapter && (
              <MonoLabel size="cell" tone="mute">
                {question.subchapter}
              </MonoLabel>
            )}
          </div>
        )}
        <p className="break-words text-[15px] leading-[1.55] text-fg sm:text-[16px]">
          {question.text}
        </p>

        <QuestionOptionGroup
          questionType={question.type}
          options={question.options}
          selected={selected}
          onChange={(newSelected) => onAnswer(question.id, newSelected)}
          disabled={false}
        />
      </div>
    </div>
  )
}
