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
import { GripVertical, Pencil, Archive, RotateCcw, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ChapterForm } from "./chapter-form"
import {
  archiveChapter,
  restoreChapter,
  reorderChapters,
} from "@/lib/actions/chapters"

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
      className="rounded-lg border bg-card"
    >
      <div className="flex items-center gap-3 p-4 hover:bg-accent/50">
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Reordoneaza"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{chapter.name}</h3>
          {chapter.description && (
            <p className="text-sm text-muted-foreground truncate">
              {chapter.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {chapter.questionCount} intrebari
          </Badge>
          <Badge variant="outline" className="text-xs">
            CS: {chapter.csCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            CM: {chapter.cmCount}
          </Badge>
          {hasSubs && (
            <Badge variant="outline" className="text-xs">
              {chapter.subchapters.length} subcapitole
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasSubs && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Ascunde subcapitole" : "Vezi subcapitole"}
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} title="Editeaza">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onArchive}
            title="Arhiveaza"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && hasSubs && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subcapitole
          </p>
          <ul className="space-y-1">
            {chapter.subchapters.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
              >
                <span className="min-w-0 flex-1 break-words text-foreground/90">
                  {s.name}
                </span>
                <Badge variant="outline" className="shrink-0 text-[10px] tabular-nums">
                  {s.count}
                </Badge>
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
    })
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
    if (!confirm("Esti sigur ca vrei sa arhivezi acest capitol?")) return
    await archiveChapter(id)
    setItems((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, archivedAt: new Date() } : c
      )
    )
  }

  async function handleRestore(id: string) {
    await restoreChapter(id)
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archivedAt: null } : c))
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditChapter(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Adauga Capitol
          </Button>
        </div>
        {archivedChapters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Ascunde arhivate" : `Arhivate (${archivedChapters.length})`}
          </Button>
        )}
      </div>

      {activeChapters.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Niciun capitol. Adauga primul capitol pentru a incepe.
          </p>
        </Card>
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
          <h3 className="text-sm font-medium text-muted-foreground">
            Capitole arhivate
          </h3>
          {archivedChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-center gap-3 rounded-lg border border-dashed p-4 opacity-60"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{chapter.name}</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(chapter.id)}
              >
                <RotateCcw className="mr-2 h-3 w-3" />
                Restaureaza
              </Button>
            </div>
          ))}
        </div>
      )}

      <ChapterForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditChapter(null) }}
        chapter={editChapter ?? undefined}
      />
    </div>
  )
}
