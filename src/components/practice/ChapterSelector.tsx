"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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

  function toggleAll() {
    if (allSelected) onChange([])
    else onChange(chapters.map((ch) => ch.id))
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
        <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
          {allSelected ? "Deselecteaza toate" : "Selecteaza toate"}
        </Button>
        <AnimatePresence mode="wait">
          {selectedIds.length > 0 && (
            <motion.span
              key={selectedQuestionCount}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground tabular-nums"
            >
              Total: {selectedQuestionCount} intrebari din {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "capitol" : "capitole"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {chapters.map((chapter) => {
          const isSelected = selectedIds.includes(chapter.id)
          return (
            <motion.button
              key={chapter.id}
              type="button"
              onClick={() => toggleChapter(chapter.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className={cn(
                "group relative flex min-h-[64px] items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]"
                  : "border-border/60 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30",
                )}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="flex-1 text-sm font-medium">{chapter.name}</span>
              <Badge variant="secondary" className="shrink-0 text-[11px]">
                {chapter.questionCount}
              </Badge>
            </motion.button>
          )
        })}
      </div>

      {chapters.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nu exista capitole disponibile.
        </p>
      )}
    </div>
  )
}
