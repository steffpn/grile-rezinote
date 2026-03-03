"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Chapter {
  id: string
  name: string
  questionCount: number
}

interface ChapterSelectorProps {
  chapters: Chapter[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function ChapterSelector({
  chapters,
  selectedIds,
  onChange,
}: ChapterSelectorProps) {
  const allSelected = chapters.length > 0 && selectedIds.length === chapters.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < chapters.length

  function toggleAll() {
    if (allSelected) {
      onChange([])
    } else {
      onChange(chapters.map((ch) => ch.id))
    }
  }

  function toggleChapter(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const selectedQuestionCount = chapters
    .filter((ch) => selectedIds.includes(ch.id))
    .reduce((sum, ch) => sum + ch.questionCount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAll}
        >
          {allSelected ? "Deselecteaza toate" : "Selecteaza toate"}
        </Button>
        {selectedIds.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Total: {selectedQuestionCount} intrebari din {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "capitol" : "capitole"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {chapters.map((chapter) => (
          <label
            key={chapter.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={selectedIds.includes(chapter.id)}
              onCheckedChange={() => toggleChapter(chapter.id)}
            />
            <span className="flex-1 font-medium">{chapter.name}</span>
            <Badge variant="secondary">
              {chapter.questionCount} intrebari
            </Badge>
          </label>
        ))}
      </div>

      {chapters.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nu exista capitole disponibile.
        </p>
      )}
    </div>
  )
}
