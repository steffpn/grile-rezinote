/**
 * Dev preview: ExamContainer fullscreen cu mock data — toate cele 200
 * grile, timer demo (3h fix), navigatorul cu states diferite.
 */
"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  ExamQuestion,
} from "@/components/exam/ExamQuestion"
import { ExamTimer } from "@/components/exam/ExamTimer"
import { ExamNavigator } from "@/components/exam/ExamNavigator"
import { SubmitConfirmModal } from "@/components/exam/SubmitConfirmModal"
import { MonoLabel } from "@/components/branded"
import { ChevronRight, Send } from "lucide-react"
import { cn } from "@/lib/utils"

const sampleQuestion = {
  id: "q-87",
  text: "Care dintre următoarele caracteristici este specifică unei pulpite acute purulente focale?",
  type: "CM" as const,
  subchapter: "Endodonție · Capitol 4",
  options: [
    { label: "A", text: "Durere spontană, intermitentă, ușor localizată" },
    {
      label: "B",
      text: "Durere provocată de termic, dispare la îndepărtarea stimulului",
    },
    { label: "C", text: "Durere acută cu iradiere și agravare nocturnă" },
    { label: "D", text: "Durere care se calmează la termic rece" },
    { label: "E", text: "Test de vitalitate negativ" },
  ],
}

// Mock 200 questions cu states variate
const totalQuestions = 200
const currentIndex = 86 // Întrebarea 87
const navigatorQuestions = Array.from({ length: totalQuestions }, (_, i) => ({
  id: `q-${i + 1}`,
  number: i + 1,
}))

// Răspunse: primele 86 (până la 87 exclusiv)
const answeredIds = new Set(
  Array.from({ length: 86 }, (_, i) => `q-${i + 1}`),
)
// Marcate: câteva exemple împrăștiate
const flaggedIds = new Set([
  "q-12",
  "q-23",
  "q-45",
  "q-67",
  "q-78",
  "q-91",
  "q-122",
  "q-145",
])

export default function ExamPreviewPage() {
  const [selected, setSelected] = useState<string[]>(["A"])
  const [flagged, setFlagged] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Deadline 2:34:12 din viitor
  const deadline = new Date(Date.now() + (2 * 3600 + 34 * 60 + 12) * 1000)

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-bg/[0.85] px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-[200px] items-center gap-3">
          <MonoLabel size="cell">Simulare</MonoLabel>
          <span className="hidden items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute sm:inline-flex">
            <span className="size-1.5 rounded-full bg-neon" />
            salvat
          </span>
        </div>

        <ExamTimer deadline={deadline} onTimeUp={() => {}} />

        <div className="flex min-w-[200px] items-center justify-end gap-2">
          <span className="hidden font-mono text-[12px] text-fg-mute sm:inline">
            <span className="text-fg">{currentIndex + 1}</span>
            <span> / {totalQuestions}</span>
          </span>
          <ExamNavigator
            questions={navigatorQuestions}
            answeredIds={answeredIds}
            flaggedIds={flaggedIds}
            currentQuestionId={`q-${currentIndex + 1}`}
          />
          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Trimite</span>
          </Button>
        </div>
      </header>

      {/* Progress bar — 200 segmente */}
      <div className="border-b border-line bg-bg-2/50 px-4 py-2 sm:px-6">
        <div className="flex w-full gap-[1px]">
          {navigatorQuestions.map((q, i) => {
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
          <ExamQuestion
            question={sampleQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={totalQuestions}
            selected={selected}
            onAnswer={(_id, sel) => setSelected(sel)}
            onFlag={() => setFlagged(!flagged)}
            isFlagged={flagged}
          />

          <div className="mt-6 flex justify-end">
            <Button size="lg" disabled={selected.length === 0}>
              Următoarea
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </main>

      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => setShowSubmitModal(false)}
        unansweredCount={totalQuestions - answeredIds.size - 1}
        totalQuestions={totalQuestions}
        isSubmitting={false}
      />
    </div>
  )
}
