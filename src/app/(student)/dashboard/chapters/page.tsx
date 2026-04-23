import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChapterCard } from "@/components/dashboard/chapter-card"
import { HeatMap } from "@/components/dashboard/heat-map"
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import { fetchChapterStats, fetchHeatmapData } from "@/lib/actions/dashboard"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessChapterStats } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export const metadata: Metadata = {
  title: "Capitole | Dashboard | grile-ReziNOTE",
}

function mapTypeFilter(type?: string): string | undefined {
  if (!type || type === "all") return undefined
  if (type === "practice") return "practice_chapter"
  return type
}

export default async function ChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!canAccessChapterStats(access.tier)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Statistici per Capitol</h1>
          <p className="text-sm text-muted-foreground">
            Acuratete si progres pentru fiecare capitol
          </p>
        </div>
        <UpgradeBlocker
          requiredTier="PREMIUM"
          title="Analiza pe capitole si subcapitole"
          description="Dashboard-ul avansat iti arata exact unde stai pe fiecare capitol si subcapitol. Identifica zonele slabe si concentreaza-te pe ele."
          benefits={[
            "Acuratete per capitol si per subcapitol",
            "Harta de activitate (heatmap) pentru fiecare capitol",
            "Sparklines de evolutie pe fiecare capitol",
            "Sortare automata de la capitolele slabe la cele puternice",
            "Recomandari de invatare bazate pe punctele slabe identificate",
          ]}
        />
      </div>
    )
  }

  const params = await searchParams
  const rangeParam = typeof params.range === "string" ? params.range : "30"
  const typeParam = typeof params.type === "string" ? params.type : undefined
  const typeFilter = mapTypeFilter(typeParam)

  const days = rangeParam === "all" ? 365 : rangeParam === "7" ? 7 : 30

  const [chapterStats, heatmapData] = await Promise.all([
    fetchChapterStats(undefined, undefined, typeFilter),
    fetchHeatmapData(days, typeFilter),
  ])

  // Sort chapters by accuracy ascending (weakest first)
  const sortedChapters = [...chapterStats].sort(
    (a, b) => a.accuracyPct - b.accuracyPct
  )

  // Compute sparkline data per chapter from heatmap data
  const sparklineMap = new Map<string, { value: number }[]>()
  for (const cell of heatmapData) {
    if (!sparklineMap.has(cell.chapterId)) {
      sparklineMap.set(cell.chapterId, [])
    }
    if (cell.accuracyPct !== null) {
      sparklineMap.get(cell.chapterId)!.push({ value: cell.accuracyPct })
    }
  }

  // Extract unique chapters and dates for heatmap
  const uniqueChapters = [...new Set(heatmapData.map((c) => c.chapterName))].sort()
  const uniqueDates = [...new Set(heatmapData.map((c) => c.date))].sort()

  const hasData = chapterStats.length > 0

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statistici per Capitol</h1>
          <p className="text-sm text-muted-foreground">
            Acuratete si progres pentru fiecare capitol
          </p>
        </div>
        <div className="flex gap-2">
          <Suspense>
            <TimeRangeSelector />
          </Suspense>
          <Suspense>
            <DataTypeToggle />
          </Suspense>
        </div>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Completeaza teste pentru a vedea statisticile pe capitole
            </h2>
            <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">
              Raspunde la intrebari din diferite capitole pentru a-ti urmari progresul.
            </p>
            <Button asChild>
              <Link href="/practice">Incepe un test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Chapter Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedChapters.map((chapter) => (
              <ChapterCard
                key={chapter.chapterId}
                chapter={chapter}
                sparklineData={sparklineMap.get(chapter.chapterId)}
              />
            ))}
          </div>

          {/* Heatmap */}
          {uniqueDates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Harta Activitatii</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatMap
                  data={heatmapData}
                  chapters={uniqueChapters}
                  dates={uniqueDates}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
