import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import { fetchTrends } from "@/lib/actions/dashboard"

export const metadata: Metadata = {
  title: "Tendinte | Dashboard | grile-ReziNOTE",
}

function mapTypeFilter(type?: string): string | undefined {
  if (!type || type === "all") return undefined
  if (type === "practice") return "practice_chapter"
  return type
}

function computeTrendDirection(data: { accuracyPct: number }[]): {
  direction: "up" | "down" | "stable"
  difference: number
  average: number
} {
  if (data.length < 2) {
    const avg = data.length === 1 ? data[0].accuracyPct : 0
    return { direction: "stable", difference: 0, average: avg }
  }

  const mid = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, mid)
  const secondHalf = data.slice(mid)

  const avgFirst =
    firstHalf.reduce((sum, d) => sum + d.accuracyPct, 0) / firstHalf.length
  const avgSecond =
    secondHalf.reduce((sum, d) => sum + d.accuracyPct, 0) / secondHalf.length

  const diff = Math.round((avgSecond - avgFirst) * 10) / 10
  const overall =
    data.reduce((sum, d) => sum + d.accuracyPct, 0) / data.length

  return {
    direction: diff > 2 ? "up" : diff < -2 ? "down" : "stable",
    difference: Math.abs(diff),
    average: Math.round(overall * 10) / 10,
  }
}

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const typeParam = typeof params.type === "string" ? params.type : undefined
  const typeFilter = mapTypeFilter(typeParam)

  const [trends7, trends30, trends90] = await Promise.all([
    fetchTrends(7, typeFilter),
    fetchTrends(30, typeFilter),
    fetchTrends(90, typeFilter),
  ])

  const hasData = trends7.length > 0 || trends30.length > 0 || trends90.length > 0

  const trend7 = computeTrendDirection(trends7)
  const trend30 = computeTrendDirection(trends30)
  const trend90 = computeTrendDirection(trends90)

  const sections = [
    {
      title: "Ultima saptamana",
      data: trends7,
      trend: trend7,
      height: 250,
    },
    {
      title: "Ultima luna",
      data: trends30,
      trend: trend30,
      height: 300,
    },
    {
      title: "Ultimele 3 luni",
      data: trends90,
      trend: trend90,
      height: 300,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tendinte</h1>
          <p className="text-sm text-muted-foreground">
            Evolutia acuratetii pe diferite perioade de timp
          </p>
        </div>
        <Suspense>
          <DataTypeToggle />
        </Suspense>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Completeaza teste pe parcursul mai multor zile
            </h2>
            <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">
              Tendintele tale vor aparea aici dupa ce vei rezolva teste in zile
              diferite.
            </p>
            <Button asChild>
              <Link href="/practice">Incepe un test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={section.data} height={section.height} />
              {section.data.length > 0 && (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Acuratete medie: <strong>{section.trend.average}%</strong>
                  </span>
                  {section.trend.direction === "up" && (
                    <span className="text-green-600 dark:text-green-400">
                      In crestere cu {section.trend.difference}%
                    </span>
                  )}
                  {section.trend.direction === "down" && (
                    <span className="text-orange-600 dark:text-orange-400">
                      In scadere cu {section.trend.difference}%
                    </span>
                  )}
                  {section.trend.direction === "stable" && (
                    <span className="text-muted-foreground">Stabila</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
