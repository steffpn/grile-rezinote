import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import {
  MonoLabel,
  ScorePill,
  SectionTag,
} from "@/components/branded"
import { fetchTrends } from "@/lib/actions/dashboard"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tendințe | Dashboard | grile-ReziNOTE",
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

  const hasData =
    trends7.length > 0 || trends30.length > 0 || trends90.length > 0

  const sections = [
    {
      label: "01 / 7d",
      title: "Ultima săptămână",
      data: trends7,
      trend: computeTrendDirection(trends7),
      height: 220,
    },
    {
      label: "02 / 30d",
      title: "Ultima lună",
      data: trends30,
      trend: computeTrendDirection(trends30),
      height: 280,
    },
    {
      label: "03 / 90d",
      title: "Ultimele 3 luni",
      data: trends90,
      trend: computeTrendDirection(trends90),
      height: 280,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTag>Tendințe</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Evoluția acurateței.
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
            Compară perioadele scurte (7 zile) cu cele lungi (90 zile) pentru
            a vedea dacă te aproprii sau te depărtezi de target.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Suspense>
            <DataTypeToggle />
          </Suspense>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <TrendingUp className="size-6" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-fg">
            Tendințele tale vor apărea aici.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Rezolvă teste în zile diferite pentru a urmări evoluția acurateței.
          </p>
          <Button asChild className="mt-6">
            <Link href="/practice">
              Începe un test
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <TrendSection
              key={section.label}
              label={section.label}
              title={section.title}
              data={section.data}
              trend={section.trend}
              height={section.height}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TrendSection({
  label,
  title,
  data,
  trend,
  height,
}: {
  label: string
  title: string
  data: { date: string; totalQuestions: number; correctCount: number; accuracyPct: number }[]
  trend: ReturnType<typeof computeTrendDirection>
  height: number
}) {
  const tone =
    trend.average >= 70 ? "pos" : trend.average >= 50 ? "neutral" : "neg"

  return (
    <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <MonoLabel size="cell">{label}</MonoLabel>
          <h3 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
            {title}
          </h3>
        </div>
        {data.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-[12px] text-fg-mute">
            <ScorePill tone={tone} size="sm">
              media {trend.average}%
            </ScorePill>
            <DirectionBadge
              direction={trend.direction}
              difference={trend.difference}
            />
          </div>
        )}
      </div>
      <TrendChart data={data} height={height} />
    </section>
  )
}

function DirectionBadge({
  direction,
  difference,
}: {
  direction: "up" | "down" | "stable"
  difference: number
}) {
  if (direction === "stable") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11.5px] uppercase tracking-mono-tight text-fg-mute">
        <span className="size-1.5 rounded-full bg-fg-mute" /> stabilă
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11.5px] uppercase tracking-mono-tight",
        direction === "up" ? "text-neon" : "text-warm",
      )}
    >
      {direction === "up" ? (
        <ArrowUp className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      )}
      {direction === "up" ? "+" : "-"}
      {difference}%
    </span>
  )
}
