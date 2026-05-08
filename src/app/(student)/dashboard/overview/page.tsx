import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Lock, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { ChapterRadar } from "@/components/dashboard/radar-chart"
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector"
import { DataTypeToggle } from "@/components/dashboard/data-type-toggle"
import { MotivationCard } from "@/components/motivation/motivation-card"
import {
  AnimatedSection,
} from "@/components/motion/dashboard-animations"
import {
  DashboardWindow,
  DashboardWindowCell,
  DashboardWindowGrid,
  MonoLabel,
  PercentBar,
  ScorePill,
  SectionTag,
} from "@/components/branded"
import {
  fetchDashboardOverview,
  fetchTrends,
  fetchChapterStats,
} from "@/lib/actions/dashboard"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessChapterStats } from "@/lib/subscription/gating"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

function mapTypeFilter(type?: string): string | undefined {
  if (!type || type === "all") return undefined
  if (type === "practice") return "practice_chapter"
  return type
}

/**
 * Pretty-print durata de la ultimul răspuns ca status mono.
 */
function formatLastActivity(streak: number): string {
  if (streak === 0) return "fără activitate"
  if (streak === 1) return "azi"
  return `${streak} zile consecutive`
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Layout already gates FREE users out — here we only decide whether the
  // chapter radar (PREMIUM-only) renders or is replaced by an upgrade card.
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  const params = await searchParams
  const rangeParam = typeof params.range === "string" ? params.range : "30"
  const typeParam = typeof params.type === "string" ? params.type : undefined
  const typeFilter = mapTypeFilter(typeParam)

  const days = rangeParam === "all" ? 365 : rangeParam === "7" ? 7 : 30

  const hasChapterAccess = canAccessChapterStats(access.tier)

  const [overview, trends, chapterStats] = await Promise.all([
    fetchDashboardOverview(undefined, undefined, typeFilter),
    fetchTrends(days, typeFilter),
    hasChapterAccess
      ? fetchChapterStats(undefined, undefined, typeFilter)
      : Promise.resolve([]),
  ])

  const hasData = overview.stats.totalQuestions > 0
  const accuracy = overview.stats.accuracyPct
  const accuracyTone = accuracy >= 70 ? "pos" : accuracy >= 50 ? "neutral" : "neg"

  return (
    <div className="space-y-8">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTag>Dashboard</SectionTag>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Progresul tău, în clar.
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
            Cât de mult, cât de des, cât de bine. Filtrează pe interval sau tip
            de test pentru a izola pattern-uri.
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
        /* Empty state */
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2 px-6 py-20 text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-neon/12 text-neon">
            <Sparkles className="size-7" />
          </div>
          <h2 className="text-[24px] font-bold tracking-[-0.02em] text-fg">
            Începe-ți aventura.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Completează primul test de practică și urmărește-ți progresul aici.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/practice">
                Începe un test
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero metric — DashboardWindow chrome */}
          <DashboardWindow
            title={
              <span>
                dashboard.tsx ·{" "}
                <span className="text-fg-dim">last {days} days</span>
              </span>
            }
            status={
              <>
                <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]" />
                <MonoLabel size="body" tone="accent">
                  {formatLastActivity(overview.streak)}
                </MonoLabel>
              </>
            }
          >
            <DashboardWindowGrid cols={4}>
              {/* Hero metric: accuracy */}
              <DashboardWindowCell colSpan={2}>
                <MonoLabel size="cell">Acuratețe globală</MonoLabel>
                <div className="mt-3 font-mono text-[80px] font-semibold leading-none tracking-[-0.05em] text-fg">
                  {accuracy}
                  <span className="text-fg-mute">%</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ScorePill tone={accuracyTone}>
                    {overview.stats.correctAnswers} / {overview.stats.totalQuestions} corecte
                  </ScorePill>
                  <MonoLabel size="body">
                    {overview.stats.totalTests} {overview.stats.totalTests === 1 ? "test" : "teste"}
                  </MonoLabel>
                </div>
              </DashboardWindowCell>

              {/* Streak */}
              <DashboardWindowCell>
                <MonoLabel size="cell">Serie zile</MonoLabel>
                <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                  {overview.streak}
                </div>
                <PercentBar
                  value={Math.min(100, (overview.streak / 30) * 100)}
                  className="mt-4"
                />
                <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                  {overview.streak >= 30
                    ? "≥ 30 zile · constant"
                    : `mai sunt ${30 - overview.streak} zile până la 30`}
                </div>
              </DashboardWindowCell>

              {/* Total questions */}
              <DashboardWindowCell>
                <MonoLabel size="cell">Întrebări totale</MonoLabel>
                <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                  {overview.stats.totalQuestions.toLocaleString("ro-RO")}
                </div>
                <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-fg-mute">
                  <span>medie</span>
                  <span className="text-fg">
                    {overview.stats.totalTests > 0
                      ? Math.round(
                          overview.stats.totalQuestions /
                            overview.stats.totalTests,
                        )
                      : 0}
                  </span>
                  <span>per test</span>
                </div>
              </DashboardWindowCell>
            </DashboardWindowGrid>
          </DashboardWindow>

          {/* Daily motivation */}
          <AnimatedSection delay={0.05}>
            <Suspense fallback={null}>
              <MotivationCard />
            </Suspense>
          </AnimatedSection>

          {/* Charts grid */}
          <AnimatedSection delay={0.1} className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[14px] border border-line bg-bg-2 p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <MonoLabel size="cell">Evoluția acurateței</MonoLabel>
                  <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg">
                    Ultimele {days} zile
                  </h3>
                </div>
                <ScorePill tone={accuracyTone} size="sm">
                  {accuracy}%
                </ScorePill>
              </div>
              <TrendChart data={trends} height={240} />
            </div>

            {hasChapterAccess ? (
              <div className="rounded-[14px] border border-line bg-bg-2 p-6">
                <div className="mb-4">
                  <MonoLabel size="cell">Per capitol</MonoLabel>
                  <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg">
                    Puncte forte vs slabe
                  </h3>
                </div>
                <ChapterRadar data={chapterStats} />
              </div>
            ) : (
              <div className="flex flex-col rounded-[14px] border border-line bg-bg-2 p-6">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <MonoLabel size="cell">Per capitol</MonoLabel>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg">
                      Puncte forte vs slabe
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-[3px] bg-warm/15 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight text-warm">
                    <Lock className="size-2.5" aria-hidden />
                    PREMIUM
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <p className="max-w-xs text-[14px] leading-[1.55] text-fg-dim">
                    Deblochează analiza detaliată pe capitole și subcapitole cu
                    PREMIUM.
                  </p>
                  <Button asChild className="mt-6" size="sm">
                    <Link href="/pricing">
                      <Sparkles className="size-3.5" />
                      Treci la PREMIUM
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </AnimatedSection>
        </>
      )}
    </div>
  )
}

