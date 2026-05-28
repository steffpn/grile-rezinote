"use client"

import { useState, useCallback } from "react"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Papa from "papaparse"
import {
  importAdmissionData,
  exportAdmissionData,
} from "@/lib/actions/admission"
import type { AdmissionImportRow, AdmissionImportResult } from "@/lib/validations/admission"

interface SpecialtyOption {
  id: string
  name: string
}

interface AdmissionDataImportProps {
  specialties: SpecialtyOption[]
}

// Map Romanian or English column headers to schema fields
const COLUMN_MAP: Record<string, keyof AdmissionImportRow> = {
  specialitate: "specialty",
  specialty: "specialty",
  umf: "umf",
  universitate: "umf",
  facultate: "umf",
  an: "year",
  year: "year",
  "prag admitere": "thresholdScore",
  "prag": "thresholdScore",
  threshold_score: "thresholdScore",
  thresholdscore: "thresholdScore",
  threshold: "thresholdScore",
  "locuri disponibile": "availableSpots",
  locuri: "availableSpots",
  available_spots: "availableSpots",
  availablespots: "availableSpots",
  spots: "availableSpots",
}

function mapHeaders(
  row: Record<string, string>
): AdmissionImportRow | null {
  const mapped: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().trim()
    const field = COLUMN_MAP[normalizedKey]
    if (field) {
      mapped[field] = value
    }
  }

  if (!mapped.specialty || !mapped.umf || !mapped.year) return null

  return {
    specialty: String(mapped.specialty),
    umf: String(mapped.umf),
    year: Number(mapped.year),
    thresholdScore: Number(mapped.thresholdScore),
    availableSpots: Number(mapped.availableSpots),
  }
}

export function AdmissionDataImport({ specialties }: AdmissionDataImportProps) {
  const [parsedRows, setParsedRows] = useState<AdmissionImportRow[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [parseError, setParseError] = useState<string>("")
  const [importResult, setImportResult] = useState<AdmissionImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setParseError("")
    setParsedRows([])
    setImportResult(null)
    setFileName(file.name)

    try {
      if (file.name.endsWith(".csv")) {
        // CSV parsing with PapaParse
        const text = await file.text()
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        })

        if (result.errors.length > 0) {
          setParseError(
            `Eroare la parsarea CSV: ${result.errors[0].message}`
          )
          return
        }

        const rows: AdmissionImportRow[] = []
        for (const raw of result.data as Record<string, string>[]) {
          const mapped = mapHeaders(raw)
          if (mapped) rows.push(mapped)
        }

        if (rows.length === 0) {
          setParseError(
            "Nu s-au gasit date valide. Verificati ca fisierul contine coloanele: Specialitate, UMF, An, Prag admitere, Locuri disponibile"
          )
          return
        }

        setParsedRows(rows)
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Excel parsing with ExcelJS
        const ExcelJS = (await import("exceljs")).default
        const workbook = new ExcelJS.Workbook()
        const buffer = await file.arrayBuffer()
        await workbook.xlsx.load(buffer)

        const sheet = workbook.worksheets[0]
        if (!sheet || sheet.rowCount < 2) {
          setParseError("Fisierul Excel este gol sau nu contine date.")
          return
        }

        // Get headers from first row
        const headers: string[] = []
        sheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value ?? "").trim()
        })

        const rows: AdmissionImportRow[] = []
        for (let i = 2; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i)
          const rawRow: Record<string, string> = {}
          headers.forEach((header, idx) => {
            const cell = row.getCell(idx + 1)
            rawRow[header] = String(cell.value ?? "").trim()
          })

          const mapped = mapHeaders(rawRow)
          if (mapped) rows.push(mapped)
        }

        if (rows.length === 0) {
          setParseError(
            "Nu s-au gasit date valide. Verificati ca fisierul contine coloanele: Specialitate, UMF, An, Prag admitere, Locuri disponibile"
          )
          return
        }

        setParsedRows(rows)
      } else {
        setParseError("Format de fisier nesuportat. Folositi CSV sau Excel (.xlsx)")
      }
    } catch {
      setParseError("Eroare la citirea fisierului. Verificati formatul.")
    }
  }, [])

  async function handleImport() {
    if (parsedRows.length === 0) return
    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importAdmissionData(parsedRows)
      setImportResult(result)
      if (result.errors.length === 0) {
        setParsedRows([])
        setFileName("")
      }
    } finally {
      setIsImporting(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const data = await exportAdmissionData()
      // Generate CSV with UTF-8 BOM for Romanian diacritics in Excel.
      // Quote text columns so commas inside ("București (Carol Davila)") don't
      // break the row.
      const headers = [
        "Specialitate",
        "UMF",
        "An",
        "Prag admitere",
        "Locuri disponibile",
      ]
      const csvCell = (v: string | number) => {
        const s = String(v ?? "")
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const csvRows = data.map((d) =>
        [
          csvCell(d.specialty),
          csvCell(d.umf),
          d.year,
          d.thresholdScore,
          d.availableSpots,
        ].join(",")
      )
      const bom = "\uFEFF"
      const csv = bom + [headers.join(","), ...csvRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `date-admitere-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  function downloadTemplate() {
    const bom = "\uFEFF"
    const template =
      bom +
      "Specialitate,UMF,An,Prag admitere,Locuri disponibile\n" +
      'Ortodon\u021Bie \u0219i Ortopedie Dento-Facial\u0103,"Bucure\u0219ti (Carol Davila)",2025,890,0\n' +
      'Ortodon\u021Bie \u0219i Ortopedie Dento-Facial\u0103,Cluj-Napoca,2025,922,0\n' +
      'Pedodon\u021Bie,Ia\u0219i,2025,798,0\n'
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sablon-date-admitere.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Available specialties info */}
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-medium">
          Specialitati disponibile ({specialties.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <Badge key={s.id} variant="secondary">
              {s.name}
            </Badge>
          ))}
          {specialties.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nicio specialitate. Adaugati specialitati mai intai din pagina
              Specialitati.
            </p>
          )}
        </div>
      </Card>

      {/* Upload and template */}
      <div className="flex gap-3">
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <Card className="flex items-center gap-4 p-6 transition-colors hover:bg-accent/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {fileName || "Alege fisier CSV sau Excel"}
              </p>
              <p className="text-sm text-muted-foreground">
                Coloane: Specialitate, UMF, An, Prag admitere, Locuri disponibile
              </p>
            </div>
          </Card>
        </label>

        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Descarca sablon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "Se exporta..." : "Exporta date"}
          </Button>
        </div>
      </div>

      {/* Parse error */}
      {parseError && (
        <Card className="border-destructive p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{parseError}</p>
          </div>
        </Card>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Previzualizare ({parsedRows.length} randuri)
            </h3>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting
                ? "Se importa..."
                : `Importa ${parsedRows.length} intrari`}
            </Button>
          </div>

          <div className="max-h-64 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specialitate</TableHead>
                  <TableHead>UMF</TableHead>
                  <TableHead>An</TableHead>
                  <TableHead>Prag</TableHead>
                  <TableHead>Locuri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.slice(0, 10).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.specialty}</TableCell>
                    <TableCell>{row.umf}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.thresholdScore}</TableCell>
                    <TableCell>{row.availableSpots}</TableCell>
                  </TableRow>
                ))}
                {parsedRows.length > 10 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      ... si inca {parsedRows.length - 10} randuri
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <Card className="p-4">
          {importResult.errors.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                {importResult.imported} intrari importate cu succes!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {importResult.imported > 0 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm">
                    {importResult.imported} intrari importate cu succes
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {importResult.errors.length} erori:
                </p>
                <ul className="max-h-40 space-y-1 overflow-auto text-sm">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-destructive">
                      Randul {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
