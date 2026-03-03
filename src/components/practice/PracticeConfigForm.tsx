"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChapterSelector } from "./ChapterSelector"
import { createPracticeAttempt } from "@/lib/actions/practice"

interface Chapter {
  id: string
  name: string
  questionCount: number
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
    .reduce((sum, ch) => sum + ch.questionCount, 0)

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
          <Card>
            <CardContent className="pt-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={wrongAnswersOnly}
                  onChange={(e) => setWrongAnswersOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Doar intrebari gresite</span>
                  <p className="text-sm text-muted-foreground">
                    Exerseaza doar intrebarile la care ai gresit anterior ({wrongAnswerCount} disponibile)
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
        )}

        {/* Chapter Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Alege capitolele</CardTitle>
          </CardHeader>
          <CardContent>
            <ChapterSelector
              chapters={chapters}
              selectedIds={selectedChapterIds}
              onChange={setSelectedChapterIds}
            />
          </CardContent>
        </Card>

        {/* Question Count */}
        {!wrongAnswersOnly && (
          <Card>
            <CardHeader>
              <CardTitle>Numar de intrebari</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle>Mod de feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={feedbackMode}
              onValueChange={setFeedbackMode}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                <Label htmlFor="immediate" className="cursor-pointer">
                  <div className="font-medium">Feedback imediat</div>
                  <p className="text-sm text-muted-foreground">
                    Vezi raspunsul corect dupa fiecare intrebare
                  </p>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="deferred" id="deferred" className="mt-1" />
                <Label htmlFor="deferred" className="cursor-pointer">
                  <div className="font-medium">Feedback la final</div>
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
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
          disabled={selectedChapterIds.length === 0 || isPending}
        >
          {isPending ? "Se creeaza testul..." : "Incepe testul"}
        </Button>
      </div>
    </form>
  )
}
