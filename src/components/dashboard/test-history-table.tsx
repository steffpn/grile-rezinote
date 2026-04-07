"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExternalLink } from "lucide-react"
import { EmptyTableState } from "@/components/dashboard/empty-state"
import type { TestHistoryResult, TestHistoryRow } from "@/types/dashboard"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

interface TestHistoryTableProps {
  data: TestHistoryResult
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "practice_chapter":
      return "Practica"
    case "practice_mixed":
      return "Practica Mix"
    case "simulation":
      return "Simulare"
    default:
      return type
  }
}

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "simulation":
      return "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400"
    default:
      return "border-primary/30 bg-primary/5 text-primary"
  }
}

function getResultsPath(row: TestHistoryRow): string {
  if (row.type === "simulation") {
    return `/exam/${row.attemptId}/results`
  }
  return `/practice/${row.attemptId}/results`
}

function getAccuracyColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (pct >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export function TestHistoryTable({ data }: TestHistoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(data.total / data.pageSize)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      if (key !== "page") {
        params.delete("page")
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={searchParams.get("type") ?? "all"}
          onValueChange={(v) => updateParam("type", v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toate tipurile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            <SelectItem value="practice_chapter">Practica</SelectItem>
            <SelectItem value="simulation">Simulare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {data.rows.length === 0 ? (
        <EmptyTableState
          title="Niciun test gasit"
          description="Ajusteaza filtrele sau incepe un test nou pentru a popula istoricul."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="w-28">Data</TableHead>
                <TableHead className="w-24">Tip</TableHead>
                <TableHead className="hidden sm:table-cell">Capitole</TableHead>
                <TableHead className="w-24 text-center">Intrebari</TableHead>
                <TableHead className="hidden md:table-cell w-24 text-center">Scor</TableHead>
                <TableHead className="w-24 text-center">Acuratete</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow
                  key={row.attemptId}
                  className="group/row border-white/[0.04] transition-colors duration-200 hover:bg-emerald-500/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
                >
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{format(new Date(row.completedAt), "dd MMM yyyy", { locale: ro })}</div>
                    <div className="text-xs">{format(new Date(row.completedAt), "HH:mm")}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[11px] font-semibold ${getTypeBadgeClass(row.type)}`}
                    >
                      {getTypeLabel(row.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {row.chapterNames.length <= 2 ? (
                        row.chapterNames.map((name, i) => (
                          <span
                            key={i}
                            className="inline-block max-w-[200px] truncate text-sm text-muted-foreground"
                            title={name}
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span
                          className="text-sm text-muted-foreground"
                          title={row.chapterNames.join(", ")}
                        >
                          {row.chapterNames.length} capitole
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <span className="font-medium">{row.correctCount}</span>
                    <span className="text-muted-foreground">/{row.questionCount}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center text-sm">
                    {row.score != null && row.maxScore != null ? (
                      <>
                        <span className="font-medium">{row.score}</span>
                        <span className="text-muted-foreground">/{row.maxScore}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-semibold ${getAccuracyColor(row.accuracyPct)}`}>
                      {row.accuracyPct}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      asChild
                    >
                      <Link href={getResultsPath(row)} title="Vezi rezultatele">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {data.page} din {totalPages} ({data.total} teste)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => updateParam("page", String(data.page - 1))}
            >
              Anterioara
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => updateParam("page", String(data.page + 1))}
            >
              Urmatoarea
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
