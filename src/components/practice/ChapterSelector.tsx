"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SubchapterOption {
  name: string
  questionCount: number
}

export interface Chapter {
  id: string
  name: string
  questionCount: number
  subchapters?: SubchapterOption[]
}

interface ChapterSelectorProps {
  chapters: Chapter[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  selectedSubchapters: string[]
  onChangeSubchapters: (names: string[]) => void
}

export function ChapterSelector({
  chapters,
  selectedIds,
  onChange,
  selectedSubchapters,
  onChangeSubchapters,
}: ChapterSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const allSelected =
    chapters.length > 0 && selectedIds.length === chapters.length

  const subchaptersByChapter = useMemo(() => {
    const map = new Map<string, SubchapterOption[]>()
    for (const c of chapters) map.set(c.id, c.subchapters ?? [])
    return map
  }, [chapters])

  function toggleAll() {
    if (allSelected) {
      onChange([])
      onChangeSubchapters([])
    } else {
      onChange(chapters.map((ch) => ch.id))
      onChangeSubchapters([])
    }
  }

  function toggleChapter(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
      // Drop subchapters that belong to this chapter
      const subs = subchaptersByChapter.get(id) ?? []
      const subNames = new Set(subs.map((s) => s.name))
      onChangeSubchapters(
        selectedSubchapters.filter((name) => !subNames.has(name))
      )
    } else {
      onChange([...selectedIds, id])
    }
  }

  function toggleSubchapter(chapterId: string, name: string) {
    // Make sure the parent chapter is selected when picking a subchapter.
    if (!selectedIds.includes(chapterId)) {
      onChange([...selectedIds, chapterId])
    }
    if (selectedSubchapters.includes(name)) {
      onChangeSubchapters(selectedSubchapters.filter((n) => n !== name))
    } else {
      onChangeSubchapters([...selectedSubchapters, name])
    }
  }

  // Effective question count taking subchapter filter into account.
  const selectedQuestionCount = useMemo(() => {
    let total = 0
    for (const ch of chapters) {
      if (!selectedIds.includes(ch.id)) continue
      const subs = ch.subchapters ?? []
      const picked = subs.filter((s) => selectedSubchapters.includes(s.name))
      if (picked.length > 0) {
        total += picked.reduce((sum, s) => sum + s.questionCount, 0)
      } else {
        total += ch.questionCount
      }
    }
    return total
  }, [chapters, selectedIds, selectedSubchapters])

  return (
    <div className="space-y-4">
      {/* Action button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggleAll}
        className="min-h-[40px]"
      >
        {allSelected ? "Deselecteaza toate" : "Selecteaza toate"}
      </Button>

      {/* Total — always its own line, below the button */}
      <AnimatePresence mode="wait">
        {selectedIds.length > 0 && (
          <motion.p
            key={`${selectedIds.length}-${selectedQuestionCount}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-sm text-muted-foreground tabular-nums"
          >
            Total:{" "}
            <span className="font-semibold text-foreground">
              {selectedQuestionCount}
            </span>{" "}
            intrebari din {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "capitol" : "capitole"}
            {selectedSubchapters.length > 0 && (
              <span className="text-muted-foreground/80">
                {" "}
                · {selectedSubchapters.length} subcapitole
              </span>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Chapter list */}
      <div className="grid gap-2 sm:grid-cols-2">
        {chapters.map((chapter) => {
          const isSelected = selectedIds.includes(chapter.id)
          const subs = subchaptersByChapter.get(chapter.id) ?? []
          const isExpanded = expandedId === chapter.id
          const pickedSubsInChapter = subs.filter((s) =>
            selectedSubchapters.includes(s.name)
          ).length

          return (
            <div
              key={chapter.id}
              className={cn(
                "rounded-xl border transition-colors",
                isSelected
                  ? "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]"
                  : "border-border/60 hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              <div className="flex items-stretch">
                <motion.button
                  type="button"
                  onClick={() => toggleChapter(chapter.id)}
                  whileTap={{ scale: 0.99 }}
                  className="flex flex-1 items-center gap-3 p-3 text-left min-h-[64px]"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 22,
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="flex-1 text-sm font-medium break-words">
                    {chapter.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[11px]"
                  >
                    {pickedSubsInChapter > 0
                      ? `${pickedSubsInChapter}/${subs.length}`
                      : chapter.questionCount}
                  </Badge>
                </motion.button>

                {subs.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((cur) =>
                        cur === chapter.id ? null : chapter.id
                      )
                    }
                    aria-label={
                      isExpanded ? "Ascunde subcapitole" : "Vezi subcapitole"
                    }
                    aria-expanded={isExpanded}
                    className="flex w-11 shrink-0 items-center justify-center border-l border-border/60 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Subchapter list */}
              <AnimatePresence initial={false}>
                {isExpanded && subs.length > 0 && (
                  <motion.div
                    key="subs"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-border/40"
                  >
                    <ul className="p-2 space-y-1">
                      {subs.map((s) => {
                        const checked = selectedSubchapters.includes(s.name)
                        return (
                          <li key={s.name}>
                            <button
                              type="button"
                              onClick={() =>
                                toggleSubchapter(chapter.id, s.name)
                              }
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors min-h-[40px]",
                                checked
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                                  checked
                                    ? "border-emerald-400 bg-emerald-500 text-white"
                                    : "border-muted-foreground/30"
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              <span className="flex-1 break-words leading-snug">
                                {s.name}
                              </span>
                              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                {s.questionCount}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                      {subs.length > 0 && (
                        <li className="px-2 pt-1 text-[11px] text-muted-foreground/70">
                          {pickedSubsInChapter === 0
                            ? "Lasa nebifat = toate subcapitolele"
                            : `${pickedSubsInChapter}/${subs.length} subcapitole bifate`}
                        </li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
