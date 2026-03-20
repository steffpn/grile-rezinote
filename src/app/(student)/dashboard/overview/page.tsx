import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Target, FileQuestion, ClipboardCheck, Flame, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { ChapterRadar } from "@/components/dashboard/radar-chart"
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import { MotivationCard } from "@/components/motivation/motivation-card"
import { AnimatedStatGrid, AnimatedStatItem, AnimatedSection } from "@/components/motion/dashboard-animations"
import {
  fetchDashboardOverview,
  fetchTrends,
  fetchChapterStats,
} from "@/lib/actions/dashboard"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

function mapTypeFilter(type?: string): string | undefined {
  if (!type || type === "all") return undefined
  if (type === "practice") return "practice_chapter"
  return type
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const rangeParam = typeof params.range === "string" ? params.range : "30"
  const typeParam = typeof params.type === "string" ? params.type : undefined
  const typeFilter = mapTypeFilter(typeParam)

  const days = rangeParam === "all" ? 365 : rangeParam === "7" ? 7 : 30

  const [overview, trends, chapterStats] = await Promise.all([
    fetchDashboardOverview(undefined, undefined, typeFilter),
    fetchTrends(days, typeFilter),
    fetchChapterStats(undefined, undefined, typeFilter),
  ])

  const hasData = overview.stats.totalQuestions > 0

  return (
    <div className="space-y-8">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Progresul tau in pregatirea pentru rezidentiat
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
        /* Empty state */
        <Card className="border-dashed border-2 border-emerald-500/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10">
              <Sparkles className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">
              Incepe-ti aventura!
            </h2>
            <p className="mb-8 mt-2 max-w-sm text-sm text-muted-foreground">
              Completeaza primul test de practica si urmareste-ti progresul aici.
            </p>
            <Button size="lg" className="rounded-full gradient-primary border-0 text-white shadow-lg hover:shadow-xl transition-shadow px-8" asChild>
              <Link href="/practice">Incepe un test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat Cards */}
          <AnimatedStatGrid className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AnimatedStatItem>
              <StatCard
                label="Acuratete"
                value={`${overview.stats.accuracyPct}%`}
                icon={<Target className="h-6 w-6 text-emerald-400" />}
              />
            </AnimatedStatItem>
            <AnimatedStatItem>
              <StatCard
                label="Intrebari"
                value={overview.stats.totalQuestions}
                icon={<FileQuestion className="h-6 w-6 text-teal-400" />}
              />
            </AnimatedStatItem>
            <AnimatedStatItem>
              <StatCard
                label="Teste"
                value={overview.stats.totalTests}
                icon={<ClipboardCheck className="h-6 w-6 text-cyan-400" />}
              />
            </AnimatedStatItem>
            <AnimatedStatItem>
              <StatCard
                label="Serie"
                value={`${overview.streak} zile`}
                icon={<Flame className="h-6 w-6 text-accent-warm" />}
              />
            </AnimatedStatItem>
          </AnimatedStatGrid>

          {/* Daily Motivation */}
          <AnimatedSection delay={0.3}>
            <Suspense fallback={null}>
              <MotivationCard />
            </Suspense>
          </AnimatedSection>

          {/* Charts Grid */}
          <AnimatedSection delay={0.4} className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/[0.06] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Evolutia Acuratetii</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={trends} height={280} />
              </CardContent>
            </Card>

            <Card className="border-white/[0.06] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Puncte Forte per Capitol</CardTitle>
              </CardHeader>
              <CardContent>
                <ChapterRadar data={chapterStats} />
              </CardContent>
            </Card>
          </AnimatedSection>
        </>
      )}
    </div>
  )
}
