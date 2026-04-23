"use server"

import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessChapterStats } from "@/lib/subscription/gating"
import {
  getOverallStats,
  getChapterStats,
  getDailyTrends,
  getHeatmapData,
  getStreakCount,
  getAnswerHistory,
  getTestHistory,
  getChaptersForFilter,
} from "@/lib/db/queries/dashboard"
import type {
  DashboardOverview,
  ChapterStats,
  DailyTrend,
  HeatmapCell,
  AnswerHistoryResult,
  TestHistoryResult,
  DateRange,
  AttemptTypeFilter,
} from "@/types/dashboard"

function parseTypeFilter(value?: string): AttemptTypeFilter | undefined {
  const valid: AttemptTypeFilter[] = [
    "practice_chapter",
    "practice_mixed",
    "simulation",
    "all",
  ]
  if (value && valid.includes(value as AttemptTypeFilter)) {
    return value as AttemptTypeFilter
  }
  return undefined
}

function parseDateRange(from?: string, to?: string): DateRange | undefined {
  if (!from || !to) return undefined
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return undefined
  return { from: fromDate, to: toDate }
}

/**
 * Fetch dashboard overview stats + streak.
 */
export async function fetchDashboardOverview(
  dateFrom?: string,
  dateTo?: string,
  typeFilter?: string
): Promise<DashboardOverview> {
  const user = await getCurrentUser()
  const dateRange = parseDateRange(dateFrom, dateTo)
  const filter = parseTypeFilter(typeFilter)

  const [stats, streak] = await Promise.all([
    getOverallStats(user.id, dateRange, filter),
    getStreakCount(user.id),
  ])

  return { stats, streak }
}

/**
 * Fetch per-chapter statistics.
 * PREMIUM-only: chapter-level analytics are the paid differentiator.
 * Returns an empty array for lower tiers so pages that embed this widget
 * (e.g., the overview radar) can render an upgrade state without crashing.
 */
export async function fetchChapterStats(
  dateFrom?: string,
  dateTo?: string,
  typeFilter?: string
): Promise<ChapterStats[]> {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!canAccessChapterStats(access.tier)) return []

  const dateRange = parseDateRange(dateFrom, dateTo)
  const filter = parseTypeFilter(typeFilter)

  return getChapterStats(user.id, dateRange, filter)
}

/**
 * Fetch daily trend data.
 */
export async function fetchTrends(
  days: number = 30,
  typeFilter?: string
): Promise<DailyTrend[]> {
  const user = await getCurrentUser()
  const filter = parseTypeFilter(typeFilter)
  const safeDays = Math.max(1, Math.min(365, days))

  return getDailyTrends(user.id, safeDays, filter)
}

/**
 * Fetch heatmap data (per-chapter activity grid).
 * PREMIUM-only — mirrors fetchChapterStats gating.
 */
export async function fetchHeatmapData(
  days: number = 30,
  typeFilter?: string
): Promise<HeatmapCell[]> {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!canAccessChapterStats(access.tier)) return []

  const filter = parseTypeFilter(typeFilter)
  const safeDays = Math.max(1, Math.min(365, days))

  return getHeatmapData(user.id, safeDays, filter)
}

/**
 * Fetch paginated answer history.
 */
export async function fetchAnswerHistory(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  chapterId?: string,
  correct?: string,
  dateFrom?: string,
  dateTo?: string,
  typeFilter?: string
): Promise<AnswerHistoryResult> {
  const user = await getCurrentUser()
  const dateRange = parseDateRange(dateFrom, dateTo)
  const filter = parseTypeFilter(typeFilter)

  const correctBool =
    correct === "true" ? true : correct === "false" ? false : undefined

  return getAnswerHistory(user.id, {
    page: Math.max(1, page),
    pageSize: Math.max(1, Math.min(100, pageSize)),
    search: search || undefined,
    chapterId: chapterId || undefined,
    correct: correctBool,
    dateRange,
    typeFilter: filter,
  })
}

/**
 * Fetch paginated test history.
 */
export async function fetchTestHistory(
  page: number = 1,
  pageSize: number = 20,
  typeFilter?: string
): Promise<TestHistoryResult> {
  const user = await getCurrentUser()
  const filter = parseTypeFilter(typeFilter)

  return getTestHistory(user.id, {
    page: Math.max(1, page),
    pageSize: Math.max(1, Math.min(100, pageSize)),
    typeFilter: filter,
  })
}

/**
 * Fetch chapters for filter dropdowns.
 */
export async function fetchChapters(): Promise<
  Array<{ id: string; name: string }>
> {
  await getCurrentUser() // ensure authenticated
  return getChaptersForFilter()
}
