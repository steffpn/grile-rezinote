"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
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
import { formatQuestionType } from "@/lib/format/question-type"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnswerDetailDialog } from "@/components/dashboard/answer-detail-dialog"
import { EmptyTableState } from "@/components/dashboard/empty-state"
import type { AnswerHistoryResult, AnswerHistoryRow } from "@/types/dashboard"
import { format } from "date-fns"

interface AnswerHistoryTableProps {
  data: AnswerHistoryResult
  chapters: Array<{ id: string; name: string }>
}

function truncateText(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export function AnswerHistoryTable({
  data,
  chapters,
}: AnswerHistoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerHistoryRow | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")

  const totalPages = Math.ceil(data.total / data.pageSize)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      // Reset to page 1 when filters change (except page param itself)
      if (key !== "page") {
        params.delete("page")
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("q") ?? ""
      if (searchInput !== currentSearch) {
        updateParam("q", searchInput || null)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, searchParams, updateParam])

  const handleRowClick = (answer: AnswerHistoryRow) => {
    setSelectedAnswer(answer)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cauta dupa textul intrebarii..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={searchParams.get("chapter") ?? "all"}
          onValueChange={(v) => updateParam("chapter", v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toate capitolele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate capitolele</SelectItem>
            {chapters.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("correct") ?? "all"}
          onValueChange={(v) => updateParam("correct", v)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Toate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="true">Corecte</SelectItem>
            <SelectItem value="false">Gresite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {data.rows.length === 0 ? (
        <EmptyTableState
          title="Niciun rezultat"
          description="Incearca alti termeni de cautare sau alte filtre."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <Table className="min-w-[480px]">
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="w-24">Data</TableHead>
                <TableHead>Intrebare</TableHead>
                <TableHead className="hidden sm:table-cell w-32">
                  Capitol
                </TableHead>
                <TableHead className="hidden md:table-cell w-16">Tip</TableHead>
                <TableHead className="w-20">Rezultat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow
                  key={row.answerId}
                  className="group/row cursor-pointer border-white/[0.04] transition-colors duration-200 hover:bg-emerald-500/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(row.answeredAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="min-w-[160px] max-w-[260px] whitespace-normal">
                    <span className="line-clamp-2 text-sm" title={row.questionText}>
                      {row.questionText}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[150px] whitespace-normal">
                    <span className="line-clamp-1 text-sm text-muted-foreground">
                      {row.chapterName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {formatQuestionType(row.questionType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.isCorrect === true ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {row.isCorrect === true ? "Corect" : "Gresit"}
                    </Badge>
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
            Pagina {data.page} din {totalPages} ({data.total} raspunsuri)
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

      {/* Detail Dialog */}
      <AnswerDetailDialog
        answer={selectedAnswer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
