"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MoreHorizontal,
  Pencil,
  Archive,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  FolderInput,
  Download,
  X,
  Loader2,
  Filter,
  CheckCircle2,
} from "lucide-react"
import {
  archiveQuestion,
  restoreQuestion,
  bulkArchiveQuestions,
  bulkRestoreQuestions,
  bulkMoveQuestions,
  getQuestionOptions,
  type QuestionSortBy,
  type SortDir,
} from "@/lib/actions/questions"
import { exportQuestionsExcel } from "@/lib/actions/import-export"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"

interface QuestionRow {
  id: string
  text: string
  type: "CS" | "CM"
  chapterId: string
  chapterName: string | null
  subchapter: string | null
  sourceBook: string | null
  sourcePage: string | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface OptionRow {
  id: string
  label: string
  text: string
  isCorrect: boolean
}

interface QuestionTableProps {
  questions: QuestionRow[]
  total: number
  page: number
  pageSize: number
  chapters: Array<{ id: string; name: string }>
  subchapters: string[]
  sourceBooks: string[]
  filters: {
    chapterId?: string
    subchapter?: string
    type?: string
    sourceBook?: string
    search?: string
    status?: string
    sortBy?: string
    sortDir?: string
  }
}

const ALL = "__all__"
const PAGE_SIZES = [10, 20, 50, 100, 200]

const COL_DEFS: Array<{
  key: QuestionSortBy
  label: string
  className?: string
  sortable: boolean
}> = [
  { key: "text", label: "Întrebare", className: "w-[40%]", sortable: true },
  { key: "type", label: "Tip", className: "w-[80px]", sortable: true },
  { key: "chapter", label: "Capitol", className: "w-[18%]", sortable: true },
  {
    key: "subchapter",
    label: "Subcapitol",
    className: "w-[16%]",
    sortable: true,
  },
  {
    key: "sourceBook",
    label: "Sursă",
    className: "w-[16%]",
    sortable: true,
  },
  {
    key: "updatedAt",
    label: "Actualizat",
    className: "w-[100px]",
    sortable: true,
  },
]

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("ro-RO", {
    year: "2-digit",
    month: "short",
    day: "2-digit",
  })
}

export function QuestionTable({
  questions,
  total,
  page,
  pageSize,
  chapters,
  subchapters,
  sourceBooks,
  filters,
}: QuestionTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.search ?? "")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [optionsCache, setOptionsCache] = useState<Map<string, OptionRow[]>>(
    new Map(),
  )
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string>("")
  const [bulkBusy, setBulkBusy] = useState<
    null | "archive" | "restore" | "move" | "export"
  >(null)

  const totalPages = Math.ceil(total / pageSize) || 1
  const status = filters.status ?? "active"
  const sortBy = (filters.sortBy ?? "createdAt") as QuestionSortBy
  const sortDir = (filters.sortDir ?? "desc") as SortDir

  // ── URL helpers ─────────────────────────────────────────────────────
  const applyFilters = useCallback(
    (
      patch: Partial<{
        chapterId: string
        subchapter: string
        type: string
        sourceBook: string
        search: string
        status: string
        sortBy: string
        sortDir: string
        page: string
        pageSize: string
      }>,
    ) => {
      const merged = { ...filters, ...patch }
      const params = new URLSearchParams()
      if (merged.chapterId && merged.chapterId !== ALL)
        params.set("chapterId", merged.chapterId)
      if (merged.subchapter && merged.subchapter !== ALL)
        params.set("subchapter", merged.subchapter)
      if (merged.type && merged.type !== ALL) params.set("type", merged.type)
      if (merged.sourceBook && merged.sourceBook !== ALL)
        params.set("sourceBook", merged.sourceBook)
      if (merged.search) params.set("search", merged.search)
      if (merged.status && merged.status !== "active")
        params.set("status", merged.status)
      if (merged.sortBy && merged.sortBy !== "createdAt")
        params.set("sortBy", merged.sortBy)
      if (merged.sortDir && merged.sortDir !== "desc")
        params.set("sortDir", merged.sortDir)
      // Reset page to 1 whenever the result set could change
      const changedFilters =
        patch.chapterId !== undefined ||
        patch.subchapter !== undefined ||
        patch.type !== undefined ||
        patch.sourceBook !== undefined ||
        patch.search !== undefined ||
        patch.status !== undefined ||
        patch.sortBy !== undefined ||
        patch.sortDir !== undefined ||
        patch.pageSize !== undefined
      const nextPage = changedFilters ? "1" : (patch.page ?? String(page))
      if (nextPage !== "1") params.set("page", nextPage)
      if (patch.pageSize) params.set("pageSize", patch.pageSize)
      else if (pageSize !== 20) params.set("pageSize", String(pageSize))

      // Clear selection when navigating to a new result set.
      setSelected(new Set())

      startTransition(() => {
        router.push(`/admin/questions?${params.toString()}`)
      })
    },
    [filters, page, pageSize, router],
  )

  const handleSort = (col: QuestionSortBy) => {
    if (sortBy === col) {
      applyFilters({ sortDir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      applyFilters({
        sortBy: col,
        sortDir: col === "createdAt" || col === "updatedAt" ? "desc" : "asc",
      })
    }
  }

  const resetAll = () => {
    setSearch("")
    setSelected(new Set())
    startTransition(() => router.push("/admin/questions"))
  }

  const hasActiveFilters =
    (filters.chapterId && filters.chapterId !== ALL) ||
    (filters.subchapter && filters.subchapter !== ALL) ||
    (filters.type && filters.type !== ALL) ||
    (filters.sourceBook && filters.sourceBook !== ALL) ||
    (filters.status && filters.status !== "active") ||
    !!filters.search

  // ── Selection ───────────────────────────────────────────────────────
  const allPageSelected =
    questions.length > 0 && questions.every((q) => selected.has(q.id))
  const somePageSelected =
    questions.some((q) => selected.has(q.id)) && !allPageSelected

  const togglePageAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        for (const q of questions) next.delete(q.id)
      } else {
        for (const q of questions) next.add(q.id)
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  // ── Inline preview ──────────────────────────────────────────────────
  const handleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null)
      return
    }
    setExpanded(id)
    if (!optionsCache.has(id)) {
      try {
        const opts = await getQuestionOptions(id)
        setOptionsCache((prev) => {
          const next = new Map(prev)
          next.set(id, opts)
          return next
        })
      } catch {
        // soft-fail; row will show "could not load"
      }
    }
  }

  // ── Single-row actions ──────────────────────────────────────────────
  async function handleArchive(id: string) {
    if (!confirm("Ești sigur că vrei să arhivezi această întrebare?")) return
    await archiveQuestion(id)
    startTransition(() => router.refresh())
  }

  async function handleRestore(id: string) {
    await restoreQuestion(id)
    startTransition(() => router.refresh())
  }

  // ── Bulk actions ────────────────────────────────────────────────────
  const selectedIds = useMemo(() => Array.from(selected), [selected])

  async function handleBulkArchive() {
    if (
      !confirm(
        `Arhivezi ${selectedIds.length} întrebări? Pot fi restaurate ulterior.`,
      )
    )
      return
    setBulkBusy("archive")
    try {
      await bulkArchiveQuestions(selectedIds)
      clearSelection()
      startTransition(() => router.refresh())
    } finally {
      setBulkBusy(null)
    }
  }

  async function handleBulkRestore() {
    setBulkBusy("restore")
    try {
      await bulkRestoreQuestions(selectedIds)
      clearSelection()
      startTransition(() => router.refresh())
    } finally {
      setBulkBusy(null)
    }
  }

  async function handleBulkMove() {
    if (!moveTarget) return
    setBulkBusy("move")
    try {
      const res = await bulkMoveQuestions(selectedIds, moveTarget)
      if ("error" in res && res.error) {
        alert(res.error)
        return
      }
      setMoveOpen(false)
      setMoveTarget("")
      clearSelection()
      startTransition(() => router.refresh())
    } finally {
      setBulkBusy(null)
    }
  }

  async function handleBulkExport() {
    setBulkBusy("export")
    try {
      const base64 = await exportQuestionsExcel({ ids: selectedIds })
      if (!base64) {
        alert("Nu am putut exporta selecția.")
        return
      }
      const bin = atob(base64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const d = new Date().toISOString().split("T")[0]
      a.href = url
      a.download = `grile_selectie_${selectedIds.length}_${d}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Eroare la export. Încearcă din nou.")
    } finally {
      setBulkBusy(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-[12px] border border-line bg-bg-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-mute" />
            <Input
              placeholder="Caută în enunț, subcapitol, sursă…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ search })
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.chapterId ?? ALL}
            onValueChange={(v) =>
              applyFilters({ chapterId: v, subchapter: ALL })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toate capitolele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toate capitolele</SelectItem>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.subchapter ?? ALL}
            onValueChange={(v) => applyFilters({ subchapter: v })}
            disabled={subchapters.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={
                  subchapters.length === 0
                    ? "(fără subcapitol)"
                    : "Toate subcapitolele"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toate subcapitolele</SelectItem>
              {subchapters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type ?? ALL}
            onValueChange={(v) => applyFilters({ type: v })}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toate</SelectItem>
              <SelectItem value="CS">CS</SelectItem>
              <SelectItem value="CM">CM</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sourceBook ?? ALL}
            onValueChange={(v) => applyFilters({ sourceBook: v })}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Sursă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toate sursele</SelectItem>
              {sourceBooks.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? "active"}
            onValueChange={(v) => applyFilters({ status: v })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Arhivate</SelectItem>
              <SelectItem value="all">Toate</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <X className="size-3.5" />
              Resetează
            </Button>
          )}

          <div className="ml-auto flex shrink-0 gap-2">
            <Button asChild>
              <Link href="/admin/questions/new">
                <Plus className="size-4" />
                Adaugă întrebare
              </Link>
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-fg-mute">
            <Filter className="size-3.5" />
            <span>
              <strong className="text-fg">{total}</strong>{" "}
              {total === 1 ? "întrebare" : "întrebări"} găsite
            </span>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-neon/40 bg-neon/5 px-4 py-2.5 shadow-[0_2px_12px_-4px_oklch(0.84_0.21_162/0.3)] backdrop-blur">
          <div className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="size-4 text-neon" />
            <span className="font-medium text-fg">
              {selected.size} selectate
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-fg-mute"
            >
              <X className="size-3.5" />
              Deselectează
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={!!bulkBusy}
            >
              {bulkBusy === "export" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export selecție
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoveOpen(true)}
              disabled={!!bulkBusy}
            >
              <FolderInput className="size-3.5" />
              Mută în capitol
            </Button>
            {status === "archived" ? (
              <Button size="sm" onClick={handleBulkRestore} disabled={!!bulkBusy}>
                {bulkBusy === "restore" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                Restaurează
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkArchive}
                disabled={!!bulkBusy}
              >
                {bulkBusy === "archive" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Archive className="size-3.5" />
                )}
                Arhivează
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className={cn(
          "overflow-hidden rounded-[12px] border border-line bg-bg-2",
          isPending && "opacity-60",
        )}
      >
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-[13.5px]">
            <thead className="sticky top-0 z-10 border-b border-line bg-bg-2">
              <tr className="text-left font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
                <th className="w-[40px] px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer rounded border-line accent-neon"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected
                    }}
                    onChange={togglePageAll}
                    aria-label="Selectează tot ce e pe pagină"
                  />
                </th>
                <th className="w-[28px] px-1 py-2.5" />
                {COL_DEFS.map((c) => {
                  const active = sortBy === c.key
                  return (
                    <th
                      key={c.key}
                      className={cn("px-3 py-2.5", c.className)}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-bg-3 hover:text-fg",
                          active && "text-neon",
                        )}
                      >
                        {c.label}
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    </th>
                  )
                })}
                <th className="w-[44px] px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-12 text-center text-fg-dim"
                  >
                    Nicio întrebare găsită pentru filtrele alese.
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const isExpanded = expanded === q.id
                  const isArchived = !!q.archivedAt
                  const isChecked = selected.has(q.id)
                  const opts = optionsCache.get(q.id)
                  return (
                    <Row
                      key={q.id}
                      q={q}
                      isExpanded={isExpanded}
                      isChecked={isChecked}
                      isArchived={isArchived}
                      opts={opts}
                      onToggleCheck={() => toggleOne(q.id)}
                      onExpand={() => handleExpand(q.id)}
                      onArchive={() => handleArchive(q.id)}
                      onRestore={() => handleRestore(q.id)}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-fg-mute">
          <strong className="text-fg">{total}</strong>{" "}
          {total === 1 ? "întrebare" : "întrebări"} · pagina {page} din{" "}
          {totalPages}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-fg-mute">
            <span>Pe pagină</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => applyFilters({ pageSize: v })}
            >
              <SelectTrigger className="h-8 w-[78px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => applyFilters({ page: String(page - 1) })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => applyFilters({ page: String(page + 1) })}
            >
              Următor
            </Button>
          </div>
        </div>
      </div>

      {/* Move-to-chapter modal */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mută {selected.size} întrebări</DialogTitle>
            <DialogDescription>
              Selectează capitolul țintă. Subcapitolul rămâne neschimbat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Alege capitolul…" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleBulkMove}
              disabled={!moveTarget || bulkBusy === "move"}
            >
              {bulkBusy === "move" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FolderInput className="size-4" />
              )}
              Mută
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({
  q,
  isExpanded,
  isChecked,
  isArchived,
  opts,
  onToggleCheck,
  onExpand,
  onArchive,
  onRestore,
}: {
  q: QuestionRow
  isExpanded: boolean
  isChecked: boolean
  isArchived: boolean
  opts: OptionRow[] | undefined
  onToggleCheck: () => void
  onExpand: () => void
  onArchive: () => void
  onRestore: () => void
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-line/60 transition-colors",
          isChecked
            ? "bg-neon/[0.04]"
            : "hover:bg-bg-3/40",
          isArchived && "opacity-60",
        )}
      >
        <td className="px-3 py-2.5 align-top">
          <input
            type="checkbox"
            className="size-4 cursor-pointer rounded border-line accent-neon"
            checked={isChecked}
            onChange={onToggleCheck}
            aria-label="Selectează această întrebare"
          />
        </td>
        <td className="px-1 py-2.5 align-top">
          <button
            type="button"
            onClick={onExpand}
            className="rounded p-0.5 text-fg-mute hover:bg-bg-3 hover:text-fg"
            aria-label={isExpanded ? "Ascunde preview" : "Vezi preview"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        </td>
        <td className="px-3 py-2.5 align-top">
          <p className="line-clamp-2 text-fg">{q.text}</p>
          {isArchived && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-[3px] bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-fg-mute">
              arhivată
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 align-top">
          <Badge variant={q.type === "CS" ? "default" : "secondary"}>
            {q.type}
          </Badge>
        </td>
        <td className="px-3 py-2.5 align-top text-fg-dim">
          {q.chapterName ?? "—"}
        </td>
        <td className="px-3 py-2.5 align-top text-fg-mute">
          {q.subchapter ?? "—"}
        </td>
        <td className="px-3 py-2.5 align-top text-fg-mute">
          {q.sourceBook ? (
            <span title={q.sourceBook}>
              {q.sourceBook}
              {q.sourcePage ? `, p.${q.sourcePage}` : ""}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="px-3 py-2.5 align-top font-mono text-[11px] tracking-mono-tight text-fg-mute">
          {fmtDate(q.updatedAt)}
        </td>
        <td className="px-3 py-2.5 align-top">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/questions/${q.id}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  Editează
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExpand}>
                <ChevronDown className="mr-2 size-4" />
                {isExpanded ? "Ascunde preview" : "Preview inline"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isArchived ? (
                <DropdownMenuItem onClick={onRestore}>
                  <RotateCcw className="mr-2 size-4" />
                  Restaurează
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={onArchive}
                  className="text-destructive"
                >
                  <Archive className="mr-2 size-4" />
                  Arhivează
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-line/60 bg-bg-3/30">
          <td colSpan={9} className="px-6 py-4">
            {opts ? (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
                  {q.text}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {opts.map((o) => (
                    <div
                      key={o.id}
                      className={cn(
                        "flex items-start gap-3 rounded-[6px] border px-3 py-2 text-[13px]",
                        o.isCorrect
                          ? "border-neon/40 bg-neon/5"
                          : "border-line bg-bg-2",
                      )}
                    >
                      <span className="shrink-0 font-mono text-[12px] tracking-mono-tight text-fg-mute">
                        {o.label})
                      </span>
                      <span className="min-w-0 flex-1 text-fg">{o.text}</span>
                      {o.isCorrect && (
                        <Badge
                          variant="outline"
                          className="border-neon text-[10px] text-neon"
                        >
                          corect
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[12px] text-fg-mute">
                  <MonoLabel size="cell">Capitol</MonoLabel>
                  <span>{q.chapterName ?? "—"}</span>
                  {q.subchapter && (
                    <>
                      <span>·</span>
                      <MonoLabel size="cell">Sub</MonoLabel>
                      <span>{q.subchapter}</span>
                    </>
                  )}
                  {q.sourceBook && (
                    <>
                      <span>·</span>
                      <MonoLabel size="cell">Sursă</MonoLabel>
                      <span>
                        {q.sourceBook}
                        {q.sourcePage ? `, p.${q.sourcePage}` : ""}
                      </span>
                    </>
                  )}
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/questions/${q.id}/edit`}>
                        <Pencil className="size-3.5" />
                        Editează
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-fg-mute">
                <Loader2 className="size-3.5 animate-spin" />
                Se încarcă opțiunile…
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
