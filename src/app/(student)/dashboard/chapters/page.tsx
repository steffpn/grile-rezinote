import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChapterCard } from "@/components/dashboard/chapter-card"
import { HeatMap } from "@/components/dashboard/heat-map"
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import { MonoLabel, SectionTag } from "@/components/branded"
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
      <div className="space-y-8">
        <div>
          <SectionTag>Statistici per capitol</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Vezi exact unde stai.
          </h1>
        </div>
        <UpgradeBlocker
          requiredTier="PREMIUM"
          title="Analiză pe capitole și subcapitole"
          description="Dashboard-ul avansat îți arată exact unde stai pe fiecare capitol și subcapitol. Identifică zonele slabe și concentrează-te pe ele."
          benefits={[
            "Acuratețe per capitol și per subcapitol",
            "Hartă de activitate (heatmap) pentru fiecare capitol",
            "Sparklines de evoluție pe fiecare capitol",
            "Sortare automată de la capitolele slabe la cele puternice",
            "Recomandări de învățare bazate pe punctele slabe identificate",
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
    (a, b) => a.accuracyPct - b.accuracyPct,
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

  // Compute top forte / slabe (top 3 fiecare)
  const sortedDesc = [...chapterStats].sort(
    (a, b) => b.accuracyPct - a.accuracyPct,
  )
  const topForte = sortedDesc.slice(0, 3)
  const topSlabe = sortedChapters.slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTag>Per capitol</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Unde ești puternic, unde nu.
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
            Capitolele sortate de la cel mai slab la cel mai puternic. Click
            pentru detalii și sparkline.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Suspense>
            <TimeRangeSelector />
          </Suspense>
          <Suspense>
            <DataTypeToggle />
          </Suspense>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <BookOpen className="size-6" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-fg">
            Statistici pe capitole, în curând.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Răspunde la întrebări din diferite capitole pentru a vedea
            statisticile.
          </p>
          <Button asChild className="mt-6">
            <Link href="/practice">
              Începe un test
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Top forte / slabe summary */}
          {chapterStats.length > 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TopList
                eyebrow="Top forte"
                tone="pos"
                items={topForte.map((c) => ({
                  name: c.chapterName,
                  pct: c.accuracyPct,
                }))}
              />
              <TopList
                eyebrow="Top slabe"
                tone="danger"
                items={topSlabe.map((c) => ({
                  name: c.chapterName,
                  pct: c.accuracyPct,
                }))}
              />
            </div>
          )}

          {/* Chapter Cards Grid */}
          <section>
            <div className="mb-3">
              <MonoLabel size="cell">Toate capitolele · sortate ascendent</MonoLabel>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {sortedChapters.map((chapter) => (
                <ChapterCard
                  key={chapter.chapterId}
                  chapter={chapter}
                  sparklineData={sparklineMap.get(chapter.chapterId)}
                />
              ))}
            </div>
          </section>

          {/* Heatmap */}
          {uniqueDates.length > 0 && (
            <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
              <div className="mb-4">
                <MonoLabel size="cell">Activitate · capitole × zile</MonoLabel>
                <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
                  Hartă de activitate
                </h2>
              </div>
              <HeatMap
                data={heatmapData}
                chapters={uniqueChapters}
                dates={uniqueDates}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}

function TopList({
  eyebrow,
  tone,
  items,
}: {
  eyebrow: string
  tone: "pos" | "danger"
  items: { name: string; pct: number }[]
}) {
  return (
    <div className="rounded-[14px] border border-line bg-bg-2 p-5">
      <MonoLabel size="cell" tone={tone === "pos" ? "accent" : "danger"}>
        {eyebrow}
      </MonoLabel>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-2 text-[14px]"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="font-mono text-[11px] text-fg-mute">
                #{i + 1}
              </span>
              <span className="truncate text-fg">{item.name}</span>
            </span>
            <span
              className={
                tone === "pos"
                  ? "font-mono text-[13px] font-semibold text-neon"
                  : "font-mono text-[13px] font-semibold text-danger"
              }
            >
              {item.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
