"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MistakesFilter } from "./MistakesFilter"
import Link from "next/link"

interface Mistake {
  questionId: string
  questionText: string
  questionType: "CS" | "CM"
  chapterName: string
  chapterId: string
  lastAnsweredAt: Date
  totalAttempts: number
  correctCount: number
  incorrectCount: number
}

interface ChapterWithCount {
  id: string
  name: string
  count: number
}

interface MistakesListProps {
  mistakes: Mistake[]
  chapters: ChapterWithCount[]
}

export function MistakesList({ mistakes, chapters }: MistakesListProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])

  const filteredMistakes =
    selectedChapterIds.length === 0
      ? mistakes
      : mistakes.filter((m) => selectedChapterIds.includes(m.chapterId))

  if (mistakes.length === 0) {
    return (
      <div className="space-y-4 text-center py-12">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-semibold">
          Felicitari! Nu ai intrebari gresite de revizuit.
        </h2>
        <p className="text-muted-foreground">
          Continua cu teste practice pentru a-ti imbunatati cunostintele.
        </p>
        <Button asChild>
          <Link href="/practice">Inapoi la teste</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">
            {filteredMistakes.length} intrebari de revizuit
          </p>
          <p className="text-sm text-muted-foreground">
            Raspunde corect de 2 ori consecutiv pentru a elimina o intrebare
          </p>
        </div>
        <Button asChild>
          <Link
            href={`/practice?wrongAnswersOnly=true${
              selectedChapterIds.length > 0
                ? `&chapters=${selectedChapterIds.join(",")}`
                : ""
            }`}
          >
            Exerseaza greselile
          </Link>
        </Button>
      </div>

      {/* Chapter filter */}
      <MistakesFilter
        chapters={chapters}
        selectedChapterIds={selectedChapterIds}
        onChange={setSelectedChapterIds}
      />

      {/* Mistakes list */}
      <div className="space-y-3">
        {filteredMistakes.map((mistake) => (
          <Card key={mistake.questionId}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        mistake.questionType === "CS"
                          ? "border-primary/30 bg-primary/5 text-primary rounded-full text-[11px] font-semibold"
                          : "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-full text-[11px] font-semibold"
                      }
                    >
                      {mistake.questionType}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {mistake.chapterName}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-base">
                    {mistake.questionText}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Incercari: {mistake.totalAttempts}
                    </span>
                    <span className="text-green-600">
                      Corecte: {mistake.correctCount}
                    </span>
                    <span className="text-red-600">
                      Gresite: {mistake.incorrectCount}
                    </span>
                    <span>
                      Ultima: {new Date(mistake.lastAnsweredAt).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMistakes.length === 0 && selectedChapterIds.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nu ai intrebari gresite in capitolele selectate.
        </p>
      )}
    </div>
  )
}
