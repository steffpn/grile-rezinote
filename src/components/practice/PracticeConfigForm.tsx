"use client"

import { useActionState, useState } from "react"
import { Drawer } from "vaul"
import { Check, ChevronDown, Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { MonoLabel } from "@/components/branded"
import { ChapterSelector } from "./ChapterSelector"
import { createPracticeAttempt } from "@/lib/actions/practice"

interface Chapter {
  id: string
  name: string
  questionCount: number
  subchapters?: { name: string; questionCount: number }[]
}

interface PracticeConfigFormProps {
  chapters: Chapter[]
  wrongAnswerCount?: number
}

function ConfigSection({
  label,
  title,
  children,
}: {
  label: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
      <div className="mb-4">
        <MonoLabel size="cell">{label}</MonoLabel>
        {title && (
          <h3 className="mt-1.5 text-[16px] font-semibold tracking-[-0.015em] text-fg">
            {title}
          </h3>
        )}
      </div>
      {children}
    </section>
  )
}

export function PracticeConfigForm({
  chapters,
  wrongAnswerCount = 0,
}: PracticeConfigFormProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
  const [selectedSubchapters, setSelectedSubchapters] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState("20")
  const [feedbackMode, setFeedbackMode] = useState("deferred")
  const [wrongAnswersOnly, setWrongAnswersOnly] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const result = await createPracticeAttempt(formData)
      return result
    },
    null,
  )

  const selectedQuestionCount = chapters
    .filter((ch) => selectedChapterIds.includes(ch.id))
    .reduce((sum, ch) => {
      const subs = ch.subchapters ?? []
      const picked = subs.filter((s) => selectedSubchapters.includes(s.name))
      return (
        sum +
        (picked.length > 0
          ? picked.reduce((a, s) => a + s.questionCount, 0)
          : ch.questionCount)
      )
    }, 0)

  const effectiveCount = wrongAnswersOnly
    ? wrongAnswerCount
    : Math.min(parseInt(questionCount) || 20, selectedQuestionCount)

  return (
    <form action={formAction}>
      {/* Hidden fields for server action */}
      <input
        type="hidden"
        name="type"
        value={
          selectedChapterIds.length === 1 ? "practice_chapter" : "practice_mixed"
        }
      />
      <input
        type="hidden"
        name="chapterIds"
        value={JSON.stringify(selectedChapterIds)}
      />
      <input
        type="hidden"
        name="subchapters"
        value={JSON.stringify(selectedSubchapters)}
      />
      <input
        type="hidden"
        name="questionCount"
        value={wrongAnswersOnly ? "999" : questionCount}
      />
      <input type="hidden" name="feedbackMode" value={feedbackMode} />
      <input
        type="hidden"
        name="wrongAnswersOnly"
        value={wrongAnswersOnly ? "true" : "false"}
      />

      <div className="space-y-4">
        {/* Wrong answers only toggle */}
        {wrongAnswerCount > 0 && (
          <div className="rounded-[14px] border border-warm/30 bg-warm/8 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={wrongAnswersOnly}
                onChange={(e) => setWrongAnswersOnly(e.target.checked)}
                className="mt-1 size-4 rounded border-line-2 bg-bg-3 accent-neon"
              />
              <div className="min-w-0">
                <span className="block text-[14px] font-semibold text-fg">
                  Doar întrebări greșite
                </span>
                <p className="mt-0.5 text-[13px] text-fg-dim">
                  Exersează doar întrebările la care ai greșit anterior ·{" "}
                  <span className="font-mono text-warm">
                    {wrongAnswerCount} disponibile
                  </span>
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Chapter Selection */}
        <ConfigSection label="01 / Capitole" title="Alege capitolele">
          <ChapterSelector
            chapters={chapters}
            selectedIds={selectedChapterIds}
            onChange={setSelectedChapterIds}
            selectedSubchapters={selectedSubchapters}
            onChangeSubchapters={setSelectedSubchapters}
          />
        </ConfigSection>

        {/* Question Count */}
        {!wrongAnswersOnly && (
          <ConfigSection label="02 / Volum" title="Număr de întrebări">
            {/* Desktop: native select */}
            <div className="hidden sm:block">
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="rounded-[7px] border-line bg-bg-3 text-[14px]">
                  <SelectValue placeholder="Alege numărul" />
                </SelectTrigger>
                <SelectContent className="border-line bg-bg-2">
                  <SelectItem value="10">10 întrebări</SelectItem>
                  <SelectItem value="20">20 întrebări</SelectItem>
                  <SelectItem value="50">50 întrebări</SelectItem>
                  <SelectItem value="100">100 întrebări</SelectItem>
                  <SelectItem value="999">Toate întrebările</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile: vaul drawer */}
            <div className="sm:hidden">
              <Drawer.Root>
                <Drawer.Trigger asChild>
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-between rounded-[7px] border border-line bg-bg-3 px-3.5 text-[14px] text-fg"
                  >
                    <span>
                      {questionCount === "999"
                        ? "Toate întrebările"
                        : `${questionCount} întrebări`}
                    </span>
                    <ChevronDown className="size-4 opacity-60" />
                  </button>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
                  <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[18px] border border-line bg-bg-2">
                    <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-line-2" />
                    <div className="p-4">
                      <Drawer.Title className="mb-3 text-[16px] font-semibold text-fg">
                        Număr de întrebări
                      </Drawer.Title>
                      <div className="space-y-1 pb-6">
                        {[
                          { v: "10", l: "10 întrebări" },
                          { v: "20", l: "20 întrebări" },
                          { v: "50", l: "50 întrebări" },
                          { v: "100", l: "100 întrebări" },
                          { v: "999", l: "Toate întrebările" },
                        ].map((opt) => (
                          <Drawer.Close key={opt.v} asChild>
                            <button
                              type="button"
                              onClick={() => setQuestionCount(opt.v)}
                              className="flex min-h-[48px] w-full items-center justify-between rounded-[8px] px-3.5 text-left text-[14px] text-fg-dim hover:bg-bg-3 hover:text-fg"
                            >
                              <span>{opt.l}</span>
                              {questionCount === opt.v && (
                                <Check className="size-4 text-neon" />
                              )}
                            </button>
                          </Drawer.Close>
                        ))}
                      </div>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            </div>

            {selectedChapterIds.length > 0 &&
              effectiveCount < parseInt(questionCount) && (
                <p className="mt-2.5 font-mono text-[11.5px] text-fg-mute">
                  Disponibile: {effectiveCount}{" "}
                  {effectiveCount === 1 ? "întrebare" : "întrebări"}.
                </p>
              )}
          </ConfigSection>
        )}

        {/* Feedback Mode */}
        <ConfigSection label="03 / Feedback" title="Când vezi rezultatele">
          <RadioGroup
            value={feedbackMode}
            onValueChange={setFeedbackMode}
            className="space-y-2.5"
          >
            <Label
              htmlFor="immediate"
              className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-bg-3 p-3.5 transition-colors hover:border-line-2 has-[[data-state=checked]]:border-neon has-[[data-state=checked]]:bg-neon/8"
            >
              <RadioGroupItem
                value="immediate"
                id="immediate"
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-fg">
                  Feedback imediat
                </div>
                <p className="mt-0.5 text-[12.5px] text-fg-dim">
                  Vezi răspunsul corect după fiecare întrebare.
                </p>
              </div>
            </Label>
            <Label
              htmlFor="deferred"
              className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-bg-3 p-3.5 transition-colors hover:border-line-2 has-[[data-state=checked]]:border-neon has-[[data-state=checked]]:bg-neon/8"
            >
              <RadioGroupItem
                value="deferred"
                id="deferred"
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-fg">
                  Feedback la final
                </div>
                <p className="mt-0.5 text-[12.5px] text-fg-dim">
                  Vezi toate rezultatele la finalul testului.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </ConfigSection>

        {/* Error Display */}
        {state?.error && (
          <div
            role="alert"
            className="rounded-[10px] border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] text-danger"
          >
            {typeof state.error === "string"
              ? state.error
              : Object.values(state.error).flat().join(", ")}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={
            (!wrongAnswersOnly && selectedChapterIds.length === 0) || isPending
          }
        >
          <Rocket className="size-4" />
          {isPending ? "Se creează testul..." : "Începe testul"}
        </Button>
      </div>
    </form>
  )
}
