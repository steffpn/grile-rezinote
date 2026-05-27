"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  Download,
  Loader2,
  FileText,
  FileSpreadsheet,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  exportQuestionsCSV,
  exportQuestionsExcel,
  type ExportOptions,
} from "@/lib/actions/import-export"
import { getDistinctSubchapters } from "@/lib/actions/questions"
import {
  IMPORT_COLUMNS,
  COLUMN_LABELS,
  type ImportColumn,
} from "@/lib/validations/import"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"
import Papa from "papaparse"

interface Chapter {
  id: string
  name: string
}

interface Props {
  chapters: Chapter[]
  sourceBooks: string[]
}

const ALL = "__all__"

// Columns toggled OFF by default to reduce noise — admins can opt in.
const DEFAULT_HIDDEN: ImportColumn[] = []

export function ExportControls({ chapters, sourceBooks }: Props) {
  // ── Filters ─────────────────────────────────────────────────────────
  const [chapterId, setChapterId] = useState<string>(ALL)
  const [subchapter, setSubchapter] = useState<string>(ALL)
  const [type, setType] = useState<string>(ALL)
  const [sourceBook, setSourceBook] = useState<string>(ALL)
  const [search, setSearch] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)

  // ── Subchapter options — depend on chapter selection ────────────────
  const [subchapters, setSubchapters] = useState<string[]>([])
  const [isLoadingSubs, startSubsTransition] = useTransition()
  useEffect(() => {
    startSubsTransition(async () => {
      const list = await getDistinctSubchapters(
        chapterId === ALL ? undefined : chapterId,
      )
      setSubchapters(list)
    })
    // Reset selected subchapter if chapter changes.
    setSubchapter(ALL)
  }, [chapterId])

  // ── Column selection ───────────────────────────────────────────────
  const [selectedCols, setSelectedCols] = useState<Set<ImportColumn>>(
    () => new Set(IMPORT_COLUMNS.filter((c) => !DEFAULT_HIDDEN.includes(c))),
  )

  const toggleCol = (col: ImportColumn) => {
    setSelectedCols((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  const selectAll = () => setSelectedCols(new Set(IMPORT_COLUMNS))
  const selectNone = () => setSelectedCols(new Set())
  const resetCols = () =>
    setSelectedCols(
      new Set(IMPORT_COLUMNS.filter((c) => !DEFAULT_HIDDEN.includes(c))),
    )

  // ── Build options for server actions ────────────────────────────────
  const buildOptions = (): ExportOptions => ({
    chapterId: chapterId === ALL ? undefined : chapterId,
    subchapter: subchapter === ALL ? undefined : subchapter,
    type: type === ALL ? undefined : (type as "CS" | "CM"),
    sourceBook: sourceBook === ALL ? undefined : sourceBook,
    search: search.trim() || undefined,
    includeArchived,
    columns: IMPORT_COLUMNS.filter((c) => selectedCols.has(c)),
  })

  // ── File-name helper ───────────────────────────────────────────────
  const fileNameLabel = useMemo(() => {
    if (chapterId !== ALL) {
      const ch = chapters.find((c) => c.id === chapterId)
      if (ch) return ch.name
    }
    return "toate"
  }, [chapterId, chapters])

  const getFileName = (ext: string) => {
    const date = new Date().toISOString().split("T")[0]
    const sanitized = fileNameLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
    return `grile_${sanitized}_${date}.${ext}`
  }

  // ── Export handlers ────────────────────────────────────────────────
  const [busy, setBusy] = useState<null | "csv" | "xlsx">(null)

  const handleExportCSV = async () => {
    if (selectedCols.size === 0) return
    setBusy("csv")
    try {
      const data = await exportQuestionsCSV(buildOptions())
      if (data.length === 0) {
        alert("Nu există întrebări pentru filtrele alese.")
        return
      }
      const csv = Papa.unparse(data)
      const bom = "﻿"
      const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = getFileName("csv")
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Eroare la exportul CSV. Încearcă din nou.")
    } finally {
      setBusy(null)
    }
  }

  const handleExportExcel = async () => {
    if (selectedCols.size === 0) return
    setBusy("xlsx")
    try {
      const base64 = await exportQuestionsExcel(buildOptions())
      if (!base64) {
        alert("Nu există întrebări pentru filtrele alese.")
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
      a.href = url
      a.download = getFileName("xlsx")
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Eroare la exportul Excel. Încearcă din nou.")
    } finally {
      setBusy(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <MonoLabel size="cell">Filtre</MonoLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-fg-dim">Capitol</Label>
            <Select value={chapterId} onValueChange={setChapterId}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-fg-dim">
              Subcapitol{" "}
              {isLoadingSubs && (
                <Loader2 className="ml-1 inline size-3 animate-spin text-fg-mute" />
              )}
            </Label>
            <Select
              value={subchapter}
              onValueChange={setSubchapter}
              disabled={subchapters.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    subchapters.length === 0
                      ? "Niciunul disponibil"
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-fg-dim">Tip</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toate</SelectItem>
                <SelectItem value="CS">CS</SelectItem>
                <SelectItem value="CM">CM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-fg-dim">Carte sursă</Label>
            <Select value={sourceBook} onValueChange={setSourceBook}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toate</SelectItem>
                {sourceBooks.map((sb) => (
                  <SelectItem key={sb} value={sb}>
                    {sb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[12px] text-fg-dim">Caută în text</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-mute" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cuvânt cheie în enunț, subcapitol sau carte"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-fg-dim">
          <input
            type="checkbox"
            className="size-4 rounded border-line accent-neon"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Include și întrebările arhivate
        </label>
      </div>

      {/* Columns */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <MonoLabel size="cell">Coloane</MonoLabel>
            <p className="mt-1 text-[12px] text-fg-mute">
              {selectedCols.size} din {IMPORT_COLUMNS.length} selectate
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Toate
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Niciuna
            </Button>
            <Button variant="ghost" size="sm" onClick={resetCols}>
              Default
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORT_COLUMNS.map((col) => (
            <label
              key={col}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[6px] border border-line bg-bg-2 px-3 py-1.5 text-[13px] transition-colors hover:border-line-2",
                selectedCols.has(col) && "border-neon/40 bg-neon/5",
              )}
            >
              <input
                type="checkbox"
                className="size-4 rounded border-line accent-neon"
                checked={selectedCols.has(col)}
                onChange={() => toggleCol(col)}
              />
              <span className="min-w-0 flex-1 truncate text-fg">
                {COLUMN_LABELS[col]}
              </span>
              <code className="shrink-0 font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
                {col}
              </code>
            </label>
          ))}
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={!!busy || selectedCols.size === 0}
        >
          {busy === "csv" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Exportă CSV
        </Button>

        <Button
          onClick={handleExportExcel}
          disabled={!!busy || selectedCols.size === 0}
        >
          {busy === "xlsx" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-4" />
          )}
          Exportă XLSX
        </Button>

        <p className="text-[11.5px] text-fg-mute">
          <Download className="mr-1 inline-block size-3" />
          CSV-ul include BOM UTF-8 pentru diacritice; XLSX-ul are header
          îngheț și păstrează diacriticele nativ.
        </p>
      </div>
    </div>
  )
}
