import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/get-user"
import {
  getChaptersForPractice,
  getInProgressAttempts,
} from "@/lib/db/queries/practice"
import { getWrongAnswerStats } from "@/lib/db/queries/wrong-answers"
import { PracticeConfigForm } from "@/components/practice/PracticeConfigForm"
import { Button } from "@/components/ui/button"
import {
  MonoLabel,
  PercentBar,
  SectionTag,
} from "@/components/branded"

export default async function PracticePage() {
  const user = await getCurrentUser()

  const [chapters, inProgressAttempts, wrongStats] = await Promise.all([
    getChaptersForPractice(),
    getInProgressAttempts(user.id),
    getWrongAnswerStats(user.id),
  ])

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <SectionTag>Teste practice</SectionTag>
        <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Antrenament țintit.
        </h1>
        <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
          Alege capitolele, alege numărul de întrebări, alege modul de
          feedback. Vezi exact unde ești slab.
        </p>
      </div>

      {/* In-progress attempts */}
      {inProgressAttempts.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <MonoLabel size="cell">În progres</MonoLabel>
            <MonoLabel size="body" tone="dim">
              {inProgressAttempts.length}{" "}
              {inProgressAttempts.length === 1 ? "test" : "teste"}
            </MonoLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgressAttempts.map((attempt) => {
              const pct = Math.round(
                (attempt.answeredCount / attempt.totalQuestions) * 100,
              )
              return (
                <div
                  key={attempt.id}
                  className="group rounded-[12px] border border-line bg-bg-2 p-4 transition-colors hover:border-line-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[3px] bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-fg-dim">
                        {attempt.type === "practice_chapter"
                          ? "Capitol"
                          : "Amestecat"}
                      </span>
                      <span className="rounded-[3px] bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-fg-mute">
                        {attempt.feedbackMode === "immediate"
                          ? "Imediat"
                          : "La final"}
                      </span>
                    </div>
                    <Button asChild size="sm" className="shrink-0">
                      <Link href={`/practice/${attempt.id}`}>
                        Continuă
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[13px] text-fg">
                      {attempt.answeredCount}
                      <span className="text-fg-mute">
                        {" / "}
                        {attempt.totalQuestions}
                      </span>{" "}
                      întrebări
                    </span>
                    <span className="font-mono text-[11px] tracking-mono-tight text-fg-mute">
                      {pct}%
                    </span>
                  </div>
                  <PercentBar value={pct} className="mt-2.5" thickness={4} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* New test configuration */}
      <PracticeConfigForm
        chapters={chapters}
        wrongAnswerCount={wrongStats.totalUnmastered}
      />
    </div>
  )
}
