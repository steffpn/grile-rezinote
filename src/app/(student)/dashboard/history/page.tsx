import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { History } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnswerHistoryTable } from "@/components/dashboard/answer-history-table"
import { fetchAnswerHistory, fetchChapters } from "@/lib/actions/dashboard"

export const metadata: Metadata = {
  title: "Istoric | Dashboard | grile-ReziNOTE",
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1
  const search = typeof params.q === "string" ? params.q : undefined
  const chapterId = typeof params.chapter === "string" && params.chapter !== "all" ? params.chapter : undefined
  const correct = typeof params.correct === "string" && params.correct !== "all" ? params.correct : undefined
  const typeFilter = typeof params.type === "string" ? params.type : undefined

  const [historyData, chapters] = await Promise.all([
    fetchAnswerHistory(page, 20, search, chapterId, correct, undefined, undefined, typeFilter),
    fetchChapters(),
  ])

  const hasAnyData = historyData.total > 0 || search || chapterId || correct

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Istoric Raspunsuri</h1>
        <p className="text-sm text-muted-foreground">
          Revizuieste raspunsurile tale anterioare
        </p>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Inca nu ai raspuns la nicio intrebare
            </h2>
            <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">
              Incepe un test de practica pentru a-ti construi istoricul!
            </p>
            <Button asChild>
              <Link href="/practice">Incepe un test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Suspense>
          <AnswerHistoryTable data={historyData} chapters={chapters} />
        </Suspense>
      )}

      {/* Summary footer */}
      {historyData.total > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Total: {historyData.total} raspunsuri
        </p>
      )}
    </div>
  )
}
