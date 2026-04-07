"use client"

import { useActionState, useState } from "react"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChapterSelector } from "./ChapterSelector"
import { createPracticeAttempt } from "@/lib/actions/practice"
import { Rocket } from "lucide-react"

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
    null
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
        value={selectedChapterIds.length === 1 ? "practice_chapter" : "practice_mixed"}
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

      <div className="space-y-6">
        {/* Wrong answers only toggle */}
        {wrongAnswerCount > 0 && (
          <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={wrongAnswersOnly}
                  onChange={(e) => setWrongAnswersOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                />
                <div>
                  <span className="font-semibold">Doar intrebari gresite</span>
                  <p className="text-sm text-muted-foreground">
                    Exerseaza doar intrebarile la care ai gresit anterior ({wrongAnswerCount} disponibile)
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
        )}

        {/* Chapter Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Alege capitolele</CardTitle>
          </CardHeader>
          <CardContent>
            <ChapterSelector
              chapters={chapters}
              selectedIds={selectedChapterIds}
              onChange={setSelectedChapterIds}
              selectedSubchapters={selectedSubchapters}
              onChangeSubchapters={setSelectedSubchapters}
            />
          </CardContent>
        </Card>

        {/* Question Count */}
        {!wrongAnswersOnly && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Numar de intrebari</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop: native select */}
              <div className="hidden sm:block">
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Alege numarul de intrebari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 intrebari</SelectItem>
                    <SelectItem value="20">20 intrebari</SelectItem>
                    <SelectItem value="50">50 intrebari</SelectItem>
                    <SelectItem value="100">100 intrebari</SelectItem>
                    <SelectItem value="999">Toate intrebarile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile: vaul drawer */}
              <div className="sm:hidden">
                <Drawer.Root>
                  <Drawer.Trigger asChild>
                    <button
                      type="button"
                      className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-input bg-background px-4 text-sm"
                    >
                      <span>
                        {questionCount === "999"
                          ? "Toate intrebarile"
                          : `${questionCount} intrebari`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </button>
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl border bg-background">
                      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
                      <div className="p-4">
                        <Drawer.Title className="mb-3 text-base font-semibold">
                          Numar de intrebari
                        </Drawer.Title>
                        <div className="space-y-1 pb-6">
                          {[
                            { v: "10", l: "10 intrebari" },
                            { v: "20", l: "20 intrebari" },
                            { v: "50", l: "50 intrebari" },
                            { v: "100", l: "100 intrebari" },
                            { v: "999", l: "Toate intrebarile" },
                          ].map((opt) => (
                            <Drawer.Close key={opt.v} asChild>
                              <button
                                type="button"
                                onClick={() => setQuestionCount(opt.v)}
                                className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-left text-sm hover:bg-accent"
                              >
                                <span>{opt.l}</span>
                                {questionCount === opt.v && (
                                  <Check className="h-4 w-4 text-primary" />
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
              {selectedChapterIds.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedQuestionCount} intrebari disponibile.
                  {effectiveCount < parseInt(questionCount) &&
                    ` Se vor folosi ${effectiveCount} intrebari.`}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feedback Mode */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Mod de feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={feedbackMode}
              onValueChange={setFeedbackMode}
              className="space-y-3"
            >
              <div className="flex min-h-[44px] items-start gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-accent/50">
                <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                <Label htmlFor="immediate" className="cursor-pointer">
                  <div className="font-semibold">Feedback imediat</div>
                  <p className="text-sm text-muted-foreground">
                    Vezi raspunsul corect dupa fiecare intrebare
                  </p>
                </Label>
              </div>
              <div className="flex min-h-[44px] items-start gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-accent/50">
                <RadioGroupItem value="deferred" id="deferred" className="mt-1" />
                <Label htmlFor="deferred" className="cursor-pointer">
                  <div className="font-semibold">Feedback la final</div>
                  <p className="text-sm text-muted-foreground">
                    Vezi toate rezultatele la finalul testului
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Error Display */}
        {state?.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {typeof state.error === "string"
              ? state.error
              : Object.values(state.error).flat().join(", ")}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="min-h-[52px] w-full rounded-xl gradient-primary border-0 text-white text-base shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
          disabled={selectedChapterIds.length === 0 || isPending}
        >
          {isPending ? (
            "Se creeaza testul..."
          ) : (
            <>
              <Rocket className="mr-2 h-5 w-5" />
              Incepe testul
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
