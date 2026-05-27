"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  importQuestions,
  generateImportTemplate,
} from "@/lib/actions/import-export"
import {
  IMPORT_COLUMNS,
  COLUMN_LABELS,
  buildImportRow,
  importRowSchema,
  isBlankRow,
  type ImportRow,
} from "@/lib/validations/import"
import { ImportValidationReport } from "./import-validation-report"
import { MonoLabel } from "@/components/branded"
import { cn } from "@/lib/utils"
import Papa from "papaparse"
import ExcelJS from "exceljs"

interface RowState {
  rowNum: number // 1-indexed spreadsheet row (header = 1, data starts at 2)
  raw: ImportRow
  valid: boolean
  error?: string
  errorColumn?: string
}

interface ParsedData {
  fileName: string
  rows: RowState[]
}

type ImportResult = {
  imported: number
  updated: number
  errors: { row: number; message: string; column?: string }[]
}

type StatusFilter = "all" | "valid" | "invalid"

export function ImportUpload() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<
    null | "csv" | "xlsx"
  >(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setParsedData(null)
    setParseError(null)
    setResult(null)
    setStatusFilter("all")
    setExpandedRow(null)
  }

  // ── Parsers ──────────────────────────────────────────────────────────
  const parseCSV = useCallback((file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete(results) {
          if (results.errors.length > 0) {
            reject(
              new Error(
                `Eroare la parsarea CSV: ${results.errors[0].message}`,
              ),
            )
            return
          }
          resolve(results.data)
        },
        error(err: Error) {
          reject(new Error(`Eroare la parsarea CSV: ${err.message}`))
        },
      })
    })
  }, [])

  const parseExcel = useCallback(
    async (file: File): Promise<Record<string, string>[]> => {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)

      // Prefer "Întrebări" sheet, else first non-instructions sheet, else first.
      const sheet =
        workbook.getWorksheet("Întrebări") ||
        workbook.worksheets.find(
          (s) => !/instruc|help|read.?me/i.test(s.name),
        ) ||
        workbook.worksheets[0]
      if (!sheet) {
        throw new Error("Fișierul Excel nu conține nicio foaie de lucru")
      }

      const headerRow = sheet.getRow(1)
      const headers: string[] = []
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? "").trim()
      })

      const out: Record<string, string>[] = []
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const rowData: Record<string, string> = {}
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]
          if (header) {
            const v = cell.value
            // ExcelJS may give us rich-text objects, hyperlinks, etc.
            let text: string
            if (v == null) text = ""
            else if (typeof v === "object" && "text" in v) text = String((v as { text: unknown }).text)
            else if (typeof v === "object" && "richText" in v) {
              const rt = (v as { richText: { text: string }[] }).richText
              text = rt.map((p) => p.text).join("")
            } else text = String(v)
            rowData[header] = text.trim()
          }
        })
        out.push(rowData)
      })

      return out
    },
    [],
  )

  // ── File handling ────────────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      resetState()
      setIsParsing(true)

      try {
        const isExcel =
          file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
        const isCSV = file.name.endsWith(".csv")

        if (!isExcel && !isCSV) {
          setParseError("Format de fișier nesuportat. Folosește .csv sau .xlsx.")
          return
        }

        const rawRows = isExcel ? await parseExcel(file) : await parseCSV(file)

        if (rawRows.length === 0) {
          setParseError("Fișierul nu conține date (doar header-ul).")
          return
        }

        // Normalise + validate every row client-side so the preview is
        // accurate before we round-trip to the server.
        const rowStates: RowState[] = []
        rawRows.forEach((raw, idx) => {
          const canonical = buildImportRow(raw)
          if (isBlankRow(canonical)) return // skip silently
          const parsed = importRowSchema.safeParse(canonical)
          if (parsed.success) {
            rowStates.push({
              rowNum: idx + 2,
              raw: parsed.data,
              valid: true,
            })
          } else {
            const issue = parsed.error.issues[0]
            rowStates.push({
              rowNum: idx + 2,
              raw: canonical,
              valid: false,
              error: issue?.message ?? "Eroare de validare",
              errorColumn: issue?.path?.[0]
                ? String(issue.path[0])
                : undefined,
            })
          }
        })

        if (rowStates.length === 0) {
          setParseError("Fișierul nu conține rânduri valide (toate sunt goale).")
          return
        }

        setParsedData({ fileName: file.name, rows: rowStates })
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Eroare la parsarea fișierului",
        )
      } finally {
        setIsParsing(false)
      }
    },
    [parseCSV, parseExcel],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ""
    },
    [handleFile],
  )

  // ── Stats / filtered view ───────────────────────────────────────────
  const stats = useMemo(() => {
    if (!parsedData)
      return { total: 0, valid: 0, invalid: 0, creates: 0, updates: 0 }
    const total = parsedData.rows.length
    const valid = parsedData.rows.filter((r) => r.valid).length
    const invalid = total - valid
    const creates = parsedData.rows.filter((r) => r.valid && !r.raw.id).length
    const updates = parsedData.rows.filter((r) => r.valid && r.raw.id).length
    return { total, valid, invalid, creates, updates }
  }, [parsedData])

  const filteredRows = useMemo(() => {
    if (!parsedData) return []
    if (statusFilter === "valid")
      return parsedData.rows.filter((r) => r.valid)
    if (statusFilter === "invalid")
      return parsedData.rows.filter((r) => !r.valid)
    return parsedData.rows
  }, [parsedData, statusFilter])

  // ── Actions ─────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsedData) return
    const validRows = parsedData.rows.filter((r) => r.valid).map((r) => r.raw)
    if (validRows.length === 0) return
    setIsImporting(true)

    try {
      const importResult = await importQuestions(validRows)
      setResult(importResult)
      setParsedData(null)
    } catch {
      setResult({
        imported: 0,
        updated: 0,
        errors: [
          { row: 0, message: "Eroare neașteptată la import. Încearcă din nou." },
        ],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadCSVTemplate = () => {
    setIsDownloadingTemplate("csv")
    try {
      const headers = IMPORT_COLUMNS.join(",")
      const exampleRows = [
        [
          "",
          "Anatomie",
          "Oase craniene",
          '"Care sunt oasele craniului?"',
          "CM",
          "Frontal",
          "Parietal",
          "Temporal",
          "Occipital",
          "Sfenoid",
          '"A,B,C,D,E"',
          "Atlas Anatomie",
          "42",
        ].join(","),
        [
          "",
          "Endodonție",
          "Pulpitele acute",
          '"Pulpita acută seroasă este caracterizată prin:"',
          "CS",
          '"Durere intermitentă, calmată de cald"',
          '"Durere continuă, exacerbată de cald"',
          '"Absența durerii"',
          '"Durere doar la masticație"',
          '"Sângerare spontană"',
          "B",
          "Fontana - Endodonție",
          "118",
        ].join(","),
      ]
      const bom = "﻿"
      const csv = bom + headers + "\n" + exampleRows.join("\n") + "\n"
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "template_import_grile.csv"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloadingTemplate(null)
    }
  }

  const downloadXLSXTemplate = async () => {
    setIsDownloadingTemplate("xlsx")
    try {
      const base64 = await generateImportTemplate()
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "template_import_grile.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Nu am putut genera template-ul XLSX. Încearcă din nou.")
    } finally {
      setIsDownloadingTemplate(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Template + instructions */}
      <div className="rounded-[12px] border border-line bg-bg-3/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <MonoLabel size="cell">Template</MonoLabel>
            <p className="mt-1 text-[13.5px] leading-snug text-fg-dim">
              Coloanele acceptate (în orice ordine, alias-uri RO recunoscute):{" "}
              {IMPORT_COLUMNS.map((c, i) => (
                <span key={c}>
                  <code className="rounded bg-bg-3 px-1 py-0.5 font-mono text-[11px] tracking-mono-tight text-fg">
                    {c}
                  </code>
                  {i < IMPORT_COLUMNS.length - 1 && " · "}
                </span>
              ))}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
              disabled={!!isDownloadingTemplate}
            >
              <Download className="size-4" />
              CSV
            </Button>
            <Button
              size="sm"
              onClick={downloadXLSXTemplate}
              disabled={!!isDownloadingTemplate}
            >
              {isDownloadingTemplate === "xlsx" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              XLSX (recomandat)
            </Button>
          </div>
        </div>
      </div>

      {/* File upload zone */}
      {!parsedData && !result && (
        <div
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed p-12 transition-colors",
            isDragOver
              ? "border-neon bg-neon/5"
              : "border-line-2 hover:border-neon/50",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {isParsing ? (
            <>
              <Loader2 className="mb-4 size-12 animate-spin text-fg-mute" />
              <p className="text-sm text-fg-dim">Se parsează fișierul...</p>
            </>
          ) : (
            <>
              <Upload className="mb-4 size-12 text-fg-mute" />
              <p className="mb-1 text-[14px] font-medium text-fg">
                Trage fișierul aici sau apasă pentru a-l alege
              </p>
              <p className="text-[12px] text-fg-mute">
                .xlsx sau .csv · max 5000 rânduri
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 rounded-[12px] border border-destructive/50 bg-destructive/10 p-4">
          <X className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">{parseError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={resetState}
            >
              Încearcă din nou
            </Button>
          </div>
        </div>
      )}

      {/* Parsed data preview */}
      {parsedData && (
        <div className="space-y-4">
          {/* Summary header */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-bg-2 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileSpreadsheet className="size-8 shrink-0 text-neon" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-fg">
                  {parsedData.fileName}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-fg-mute">
                  <span>
                    <strong className="text-fg">{stats.total}</strong> rânduri
                  </span>
                  <span className="text-fg-mute">·</span>
                  <span className="text-neon">
                    {stats.valid} valide
                  </span>
                  {stats.invalid > 0 && (
                    <>
                      <span className="text-fg-mute">·</span>
                      <span className="text-destructive">
                        {stats.invalid} erori
                      </span>
                    </>
                  )}
                  {stats.valid > 0 && (
                    <>
                      <span className="text-fg-mute">·</span>
                      <span>
                        {stats.creates} noi / {stats.updates} actualizări
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={resetState}>
                Anulează
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={isImporting || stats.valid === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se importă...
                  </>
                ) : (
                  `Importă ${stats.valid} valide`
                )}
              </Button>
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-2">
            <MonoLabel size="cell">Filtru</MonoLabel>
            {(
              [
                { k: "all", label: `Toate · ${stats.total}` },
                { k: "valid", label: `Valide · ${stats.valid}` },
                { k: "invalid", label: `Erori · ${stats.invalid}` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.k}
                onClick={() => setStatusFilter(opt.k)}
                className={cn(
                  "rounded-[6px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-mono-tight transition-colors",
                  statusFilter === opt.k
                    ? "border-neon bg-neon/12 text-neon"
                    : "border-line bg-bg-2 text-fg-dim hover:border-line-2 hover:text-fg",
                )}
                disabled={
                  (opt.k === "invalid" && stats.invalid === 0) ||
                  (opt.k === "valid" && stats.valid === 0)
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Row preview table */}
          <div className="max-h-[500px] overflow-y-auto rounded-[12px] border border-line bg-bg-2">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 border-b border-line bg-bg-2">
                <tr className="text-left font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
                  <th className="w-[1%] px-3 py-2">·</th>
                  <th className="w-[60px] px-3 py-2">Rând</th>
                  <th className="w-[90px] px-3 py-2">Stare</th>
                  <th className="w-[18%] px-3 py-2">Capitol / Sub</th>
                  <th className="w-[50px] px-3 py-2">Tip</th>
                  <th className="px-3 py-2">Întrebare</th>
                  <th className="w-[100px] px-3 py-2">Corecte</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-fg-mute"
                    >
                      Nimic de afișat pentru acest filtru.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const expanded = expandedRow === r.rowNum
                    return (
                      <FragmentRow
                        key={r.rowNum}
                        row={r}
                        expanded={expanded}
                        onToggle={() =>
                          setExpandedRow(expanded ? null : r.rowNum)
                        }
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import result */}
      {result && (
        <ImportValidationReport
          imported={result.imported}
          updated={result.updated}
          errors={result.errors}
          onClose={resetState}
        />
      )}
    </div>
  )
}

function FragmentRow({
  row,
  expanded,
  onToggle,
}: {
  row: RowState
  expanded: boolean
  onToggle: () => void
}) {
  const r = row.raw
  return (
    <>
      <tr
        className={cn(
          "border-b border-line/60 transition-colors",
          row.valid ? "hover:bg-bg-3/40" : "bg-destructive/[0.04] hover:bg-destructive/[0.08]",
        )}
      >
        <td className="px-3 py-2 align-top">
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-0.5 text-fg-mute hover:bg-bg-3 hover:text-fg"
            aria-label={expanded ? "Ascunde detalii" : "Vezi detalii"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        </td>
        <td className="px-3 py-2 align-top font-mono text-[11px] tracking-mono-tight text-fg-mute">
          #{row.rowNum}
        </td>
        <td className="px-3 py-2 align-top">
          {row.valid ? (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-neon/12 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-neon">
              <CheckCircle2 className="size-3" />
              {r.id ? "update" : "nou"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight text-destructive">
              <AlertCircle className="size-3" />
              eroare
            </span>
          )}
        </td>
        <td className="px-3 py-2 align-top text-fg">
          <p className="truncate">{r.chapter_name || "—"}</p>
          {r.subchapter && (
            <p className="truncate text-[11.5px] text-fg-mute">
              {r.subchapter}
            </p>
          )}
        </td>
        <td className="px-3 py-2 align-top">
          <span className="font-mono text-[11px] tracking-mono-tight text-fg-dim">
            {r.type || "—"}
          </span>
        </td>
        <td className="px-3 py-2 align-top">
          <p className="line-clamp-2 text-fg">
            {r.question_text || (
              <span className="italic text-fg-mute">(gol)</span>
            )}
          </p>
          {!row.valid && row.error && (
            <p className="mt-1 text-[11.5px] text-destructive">
              {row.errorColumn && (
                <code className="mr-1 rounded bg-destructive/10 px-1 py-0.5 font-mono text-[10.5px]">
                  {row.errorColumn}
                </code>
              )}
              {row.error}
            </p>
          )}
        </td>
        <td className="px-3 py-2 align-top font-mono text-[11px] tracking-mono-tight text-fg-dim">
          {r.correct_answers || "—"}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-line/60 bg-bg-3/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {IMPORT_COLUMNS.map((col) => {
                const value = r[col]
                if (col === "question_text" || col === "id") return null
                return (
                  <div
                    key={col}
                    className={cn(
                      "rounded-[6px] border border-line bg-bg-2 px-3 py-2",
                      row.errorColumn === col &&
                        "border-destructive/60 bg-destructive/5",
                    )}
                  >
                    <MonoLabel size="cell">{COLUMN_LABELS[col]}</MonoLabel>
                    <p className="mt-1 break-words text-[13px] text-fg">
                      {value || (
                        <span className="italic text-fg-mute">—</span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
            {r.question_text && (
              <div className="mt-3 rounded-[6px] border border-line bg-bg-2 px-3 py-2">
                <MonoLabel size="cell">
                  {COLUMN_LABELS.question_text}
                </MonoLabel>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg">
                  {r.question_text}
                </p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
