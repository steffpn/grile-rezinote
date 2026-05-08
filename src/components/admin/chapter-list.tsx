"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Archive,
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { MonoLabel } from "@/components/branded"
import { ChapterForm } from "./chapter-form"
import {
  archiveChapter,
  reorderChapters,
  restoreChapter,
} from "@/lib/actions/chapters"
import { cn } from "@/lib/utils"

interface ChapterData {
  id: string
  name: string
  description: string | null
  sortOrder: number
  archivedAt: Date | null
  questionCount: number
  csCount: number
  cmCount: number
  subchapters: { name: string; count: number }[]
}

interface ChapterListProps {
  chapters: ChapterData[]
}

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number | string
  tone?: "default" | "accent" | "warm"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-mono-tight",
        tone === "accent" && "bg-neon/12 text-neon",
        tone === "warm" && "bg-warm/12 text-warm",
        tone === "default" && "bg-bg-3 text-fg-dim",
      )}
    >
      <span>{label}</span>
      <span className="text-fg">{value}</span>
    </span>
  )
}

function SortableChapterRow({
  chapter,
  onEdit,
  onArchive,
}: {
  chapter: ChapterData
  onEdit: () => void
  onArchive: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasSubs = chapter.subchapters && chapter.subchapters.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-[10px] border border-line bg-bg-2 transition-colors hover:border-line-2",
        isDragging &&
          "border-neon shadow-[0_0_0_1px_var(--neon),0_8px_24px_-12px_oklch(0.84_0.21_162/0.4)]",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          aria-label="Reordonează"
          className="cursor-grab touch-none rounded-[6px] p-1 text-fg-mute transition-colors hover:bg-bg-3 hover:text-neon hover:shadow-[0_0_8px_var(--neon)]"
        >
          <GripVertical className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14.5px] font-medium text-fg">
            {chapter.name}
          </h3>
          {chapter.description && (
            <p className="truncate text-[12.5px] text-fg-mute">
              {chapter.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <StatChip label="∑" value={chapter.questionCount} />
          <StatChip label="CS" value={chapter.csCount} tone="accent" />
          <StatChip label="CM" value={chapter.cmCount} tone="warm" />
          {hasSubs && (
            <StatChip label="sub" value={chapter.subchapters.length} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {hasSubs && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Ascunde subcapitole" : "Vezi subcapitole"}
              aria-expanded={expanded}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            title="Editează"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onArchive}
            title="Arhivează"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      </div>

      {expanded && hasSubs && (
        <div className="border-t border-line bg-bg-3/30 px-4 py-3">
          <MonoLabel size="cell">Subcapitole</MonoLabel>
          <ul className="mt-2 space-y-1">
            {chapter.subchapters.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-[6px] px-2 py-1.5 text-[13px] hover:bg-bg-3"
              >
                <span className="min-w-0 flex-1 break-words text-fg-dim">
                  {s.name}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ChapterList({ chapters: initialChapters }: ChapterListProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editChapter, setEditChapter] = useState<ChapterData | null>(null)
  const [items, setItems] = useState(initialChapters)

  const activeChapters = items.filter((c) => !c.archivedAt)
  const archivedChapters = items.filter((c) => c.archivedAt)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = activeChapters.findIndex((c) => c.id === active.id)
    const newIndex = activeChapters.findIndex((c) => c.id === over.id)

    const reordered = arrayMove(activeChapters, oldIndex, newIndex)
    setItems([...reordered, ...archivedChapters])

    await reorderChapters(reordered.map((c) => c.id))
  }

  async function handleArchive(id: string) {
    if (!confirm("Ești sigur că vrei să arhivezi acest capitol?")) return
    await archiveChapter(id)
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archivedAt: new Date() } : c)),
    )
  }

  async function handleRestore(id: string) {
    await restoreChapter(id)
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archivedAt: null } : c)),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={() => {
            setEditChapter(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Adaugă capitol
        </Button>
        {archivedChapters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived
              ? "Ascunde arhivate"
              : `Arhivate · ${archivedChapters.length}`}
          </Button>
        )}
      </div>

      {activeChapters.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <p className="text-[14px] text-fg-dim">
            Niciun capitol. Adaugă primul pentru a începe.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeChapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {activeChapters.map((chapter) => (
                <SortableChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  onEdit={() => {
                    setEditChapter(chapter)
                    setFormOpen(true)
                  }}
                  onArchive={() => handleArchive(chapter.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showArchived && archivedChapters.length > 0 && (
        <div className="space-y-2">
          <MonoLabel size="cell">Capitole arhivate</MonoLabel>
          {archivedChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-center gap-3 rounded-[10px] border border-dashed border-line-2 bg-bg-2/40 px-4 py-3 opacity-70"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-medium text-fg-dim">
                  {chapter.name}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(chapter.id)}
              >
                <RotateCcw className="size-3.5" />
                Restaurează
              </Button>
            </div>
          ))}
        </div>
      )}

      <ChapterForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditChapter(null)
        }}
        chapter={editChapter ?? undefined}
      />
    </div>
  )
}
