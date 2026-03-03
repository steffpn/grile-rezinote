"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuestionPreview } from "./question-preview"
import { createQuestion, updateQuestion } from "@/lib/actions/questions"
import { SOURCE_BOOKS } from "@/lib/constants/source-books"

interface OptionData {
  label: string
  text: string
  isCorrect: boolean
}

interface QuestionWithOptions {
  id: string
  chapterId: string
  text: string
  type: "CS" | "CM"
  sourceBook: string | null
  sourcePage: string | null
  options: Array<{
    id: string
    label: string
    text: string
    isCorrect: boolean
  }>
}

interface QuestionFormProps {
  question?: QuestionWithOptions
  chapters: Array<{ id: string; name: string }>
}

const LABELS = ["A", "B", "C", "D", "E"]

function getDefaultOptions(
  existing?: QuestionWithOptions["options"]
): OptionData[] {
  return LABELS.map((label) => {
    const opt = existing?.find((o) => o.label === label)
    return {
      label,
      text: opt?.text ?? "",
      isCorrect: opt?.isCorrect ?? false,
    }
  })
}

export function QuestionForm({ question, chapters }: QuestionFormProps) {
  const router = useRouter()
  const isEditing = !!question

  const [chapterId, setChapterId] = useState(question?.chapterId ?? "")
  const [questionText, setQuestionText] = useState(question?.text ?? "")
  const [type, setType] = useState<"CS" | "CM">(question?.type ?? "CS")
  const [questionOptions, setQuestionOptions] = useState<OptionData[]>(
    getDefaultOptions(question?.options)
  )
  const [sourceBook, setSourceBook] = useState(question?.sourceBook ?? "none")
  const [sourcePage, setSourcePage] = useState(question?.sourcePage ?? "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOptionTextChange(index: number, text: string) {
    setQuestionOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text } : opt))
    )
  }

  function handleOptionCorrectChange(index: number, isCorrect: boolean) {
    setQuestionOptions((prev) =>
      prev.map((opt, i) => {
        if (type === "CS") {
          // CS: only one correct answer (radio behavior)
          return { ...opt, isCorrect: i === index ? isCorrect : false }
        }
        // CM: multiple correct answers (checkbox behavior)
        return i === index ? { ...opt, isCorrect } : opt
      })
    )
  }

  function handleTypeChange(newType: "CS" | "CM") {
    setType(newType)
    if (newType === "CS") {
      // If switching to CS, keep only the first correct answer
      const firstCorrectIdx = questionOptions.findIndex((o) => o.isCorrect)
      setQuestionOptions((prev) =>
        prev.map((opt, i) => ({
          ...opt,
          isCorrect: i === firstCorrectIdx,
        }))
      )
    }
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError(null)

    const data = {
      chapterId,
      text: questionText,
      type,
      options: questionOptions,
      sourceBook: sourceBook && sourceBook !== "none" ? sourceBook : undefined,
      sourcePage: sourcePage || undefined,
    }

    try {
      const result = isEditing
        ? await updateQuestion(question.id, data)
        : await createQuestion(data)

      if (result && "error" in result) {
        const flatError = result.error
        if (typeof flatError === "object" && flatError !== null && "formErrors" in flatError) {
          const fe = flatError as { formErrors: string[]; fieldErrors: Record<string, string[]> }
          const messages = [
            ...fe.formErrors,
            ...Object.values(fe.fieldErrors).flat(),
          ]
          setError(messages.join(". "))
        } else {
          setError("Eroare la salvare")
        }
      } else {
        router.push("/admin/questions")
      }
    } catch {
      setError("Eroare neasteptata")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* Editor - Left side (60%) */}
      <div className="lg:col-span-3 space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Chapter Select */}
        <div className="space-y-2">
          <Label>Capitol</Label>
          <Select value={chapterId} onValueChange={setChapterId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteaza capitol..." />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <Label>Textul intrebarii</Label>
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Scrie intrebarea aici..."
            rows={3}
          />
        </div>

        {/* Type Toggle */}
        <div className="space-y-2">
          <Label>Tip intrebare</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "CS" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("CS")}
            >
              CS (Complement Simplu)
            </Button>
            <Button
              type="button"
              variant={type === "CM" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("CM")}
            >
              CM (Complement Multiplu)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {type === "CS"
              ? "Un singur raspuns corect"
              : "Cel putin 2 raspunsuri corecte"}
          </p>
        </div>

        {/* Options A-E */}
        <div className="space-y-3">
          <Label>Optiuni de raspuns</Label>
          {questionOptions.map((opt, i) => (
            <div key={opt.label} className="flex items-center gap-3">
              <span className="w-8 text-center font-medium text-muted-foreground">
                {opt.label})
              </span>
              <Input
                value={opt.text}
                onChange={(e) => handleOptionTextChange(i, e.target.value)}
                placeholder={`Optiunea ${opt.label}...`}
                className="flex-1"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type={type === "CS" ? "radio" : "checkbox"}
                  name={type === "CS" ? "correct-answer" : undefined}
                  checked={opt.isCorrect}
                  onChange={(e) =>
                    handleOptionCorrectChange(i, e.target.checked)
                  }
                  className="h-4 w-4"
                />
                Corect
              </label>
            </div>
          ))}
        </div>

        {/* Source Reference */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sursa (carte)</Label>
            <Select value={sourceBook} onValueChange={setSourceBook}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteaza carte..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fara sursa</SelectItem>
                {SOURCE_BOOKS.map((book) => (
                  <SelectItem key={book} value={book}>
                    {book}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pagina</Label>
            <Input
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
              placeholder="ex: 42"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Se salveaza..."
              : isEditing
                ? "Salveaza modificarile"
                : "Creeaza intrebarea"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/questions")}
          >
            Anuleaza
          </Button>
        </div>
      </div>

      {/* Preview - Right side (40%) */}
      <div className="lg:col-span-2">
        <QuestionPreview
          questionText={questionText}
          options={questionOptions}
          type={type}
          sourceBook={sourceBook}
          sourcePage={sourcePage}
        />
      </div>
    </div>
  )
}
