import { db } from "@/lib/db"
import {
  attempts,
  attemptAnswers,
  questions,
  chapters,
  options,
} from "@/lib/db/schema"
import { eq, and, gte, lte, sql, isNull, inArray, asc } from "drizzle-orm"
import type {
  OverallStats,
  ChapterStats,
  DailyTrend,
  HeatmapCell,
  AnswerHistoryRow,
  AnswerHistoryResult,
  DateRange,
  AttemptTypeFilter,
} from "@/types/dashboard"

function buildTypeCondition(typeFilter?: AttemptTypeFilter) {
  if (!typeFilter || typeFilter === "all") return sql`true`
  if (typeFilter === "practice_chapter" || typeFilter === "practice_mixed") {
    return sql`${attempts.type} IN ('practice_chapter', 'practice_mixed')`
  }
  return eq(attempts.type, typeFilter)
}

function buildDateCondition(dateRange?: DateRange) {
  if (!dateRange) return sql`true`
  return and(
    gte(attempts.completedAt, dateRange.from),
    lte(attempts.completedAt, dateRange.to)
  )!
}

/**
 * Get overall dashboard statistics for a user.
 */
export async function getOverallStats(
  userId: string,
  dateRange?: DateRange,
  typeFilter?: AttemptTypeFilter
): Promise<OverallStats> {
  const result = await db
    .select({
      totalTests: sql<number>`count(DISTINCT ${attempts.id})::int`,
      totalQuestions: sql<number>`count(${attemptAnswers.id})::int`,
      correctAnswers: sql<number>`count(*) FILTER (WHERE ${attemptAnswers.isCorrect} = true)::int`,
    })
    .from(attempts)
    .innerJoin(attemptAnswers, eq(attemptAnswers.attemptId, attempts.id))
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.status, "completed"),
        buildTypeCondition(typeFilter),
        buildDateCondition(dateRange)
      )
    )

  const row = result[0] ?? { totalTests: 0, totalQuestions: 0, correctAnswers: 0 }
  const accuracyPct =
    row.totalQuestions > 0
      ? Math.round((row.correctAnswers / row.totalQuestions) * 100 * 10) / 10
      : 0

  return {
    totalTests: row.totalTests,
    totalQuestions: row.totalQuestions,
    correctAnswers: row.correctAnswers,
    accuracyPct,
  }
}

/**
 * Get per-chapter statistics for a user.
 */
export async function getChapterStats(
  userId: string,
  dateRange?: DateRange,
  typeFilter?: AttemptTypeFilter
): Promise<ChapterStats[]> {
  const result = await db
    .select({
      chapterId: questions.chapterId,
      chapterName: chapters.name,
      totalQuestions: sql<number>`count(DISTINCT ${attemptAnswers.questionId})::int`,
      correctAnswers: sql<number>`count(*) FILTER (WHERE ${attemptAnswers.isCorrect} = true)::int`,
      totalAnswers: sql<number>`count(${attemptAnswers.id})::int`,
    })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
    .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
    .innerJoin(chapters, eq(questions.chapterId, chapters.id))
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.status, "completed"),
        isNull(chapters.archivedAt),
        buildTypeCondition(typeFilter),
        buildDateCondition(dateRange)
      )
    )
    .groupBy(questions.chapterId, chapters.name)
    .orderBy(chapters.name)

  return result.map((row) => ({
    ...row,
    accuracyPct:
      row.totalAnswers > 0
        ? Math.round((row.correctAnswers / row.totalAnswers) * 100 * 10) / 10
        : 0,
  }))
}

/**
 * Get daily trend data for a user.
 */
export async function getDailyTrends(
  userId: string,
  days: number = 30,
  typeFilter?: AttemptTypeFilter
): Promise<DailyTrend[]> {
  const typeCondition =
    !typeFilter || typeFilter === "all"
      ? sql``
      : typeFilter === "practice_chapter" || typeFilter === "practice_mixed"
        ? sql`AND a.type IN ('practice_chapter', 'practice_mixed')`
        : sql`AND a.type = ${typeFilter}`

  const result = await db.execute(sql`
    SELECT
      DATE(aa.answered_at) as date,
      COUNT(*)::int as total_questions,
      COUNT(*) FILTER (WHERE aa.is_correct = true)::int as correct_count,
      ROUND(
        COUNT(*) FILTER (WHERE aa.is_correct = true)::numeric /
        NULLIF(COUNT(*), 0) * 100, 1
      )::float as accuracy_pct
    FROM attempt_answers aa
    JOIN attempts a ON aa.attempt_id = a.id
    WHERE a.user_id = ${userId}
      AND a.status = 'completed'
      AND aa.answered_at >= NOW() - INTERVAL '1 day' * ${days}
      ${typeCondition}
    GROUP BY DATE(aa.answered_at)
    ORDER BY date
  `)

  return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
    date: String(row.date),
    totalQuestions: Number(row.total_questions),
    correctCount: Number(row.correct_count),
    accuracyPct: Number(row.accuracy_pct ?? 0),
  }))
}

/**
 * Get heatmap data: chapter x date grid with accuracy.
 */
export async function getHeatmapData(
  userId: string,
  days: number = 30,
  typeFilter?: AttemptTypeFilter
): Promise<HeatmapCell[]> {
  const typeCondition =
    !typeFilter || typeFilter === "all"
      ? sql``
      : typeFilter === "practice_chapter" || typeFilter === "practice_mixed"
        ? sql`AND a.type IN ('practice_chapter', 'practice_mixed')`
        : sql`AND a.type = ${typeFilter}`

  const result = await db.execute(sql`
    SELECT
      q.chapter_id,
      c.name as chapter_name,
      DATE(aa.answered_at) as date,
      ROUND(
        COUNT(*) FILTER (WHERE aa.is_correct = true)::numeric /
        NULLIF(COUNT(*), 0) * 100, 1
      )::float as accuracy_pct,
      COUNT(*)::int as question_count
    FROM attempt_answers aa
    JOIN attempts a ON aa.attempt_id = a.id
    JOIN questions q ON aa.question_id = q.id
    JOIN chapters c ON q.chapter_id = c.id
    WHERE a.user_id = ${userId}
      AND a.status = 'completed'
      AND aa.answered_at >= NOW() - INTERVAL '1 day' * ${days}
      AND c.archived_at IS NULL
      ${typeCondition}
    GROUP BY q.chapter_id, c.name, DATE(aa.answered_at)
    ORDER BY c.name, date
  `)

  return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
    chapterId: String(row.chapter_id),
    chapterName: String(row.chapter_name),
    date: String(row.date),
    accuracyPct: row.accuracy_pct != null ? Number(row.accuracy_pct) : null,
    questionCount: Number(row.question_count),
  }))
}

/**
 * Get streak count: consecutive days with activity from today backwards.
 */
export async function getStreakCount(userId: string): Promise<number> {
  const result = await db.execute(sql`
    WITH activity_dates AS (
      SELECT DISTINCT DATE(aa.answered_at) as activity_date
      FROM attempt_answers aa
      JOIN attempts a ON aa.attempt_id = a.id
      WHERE a.user_id = ${userId}
        AND a.status = 'completed'
      ORDER BY activity_date DESC
    ),
    streak AS (
      SELECT
        activity_date,
        activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int as grp
      FROM activity_dates
      WHERE activity_date >= CURRENT_DATE - INTERVAL '365 days'
    )
    SELECT COUNT(*)::int as streak_count
    FROM streak
    WHERE grp = (
      SELECT grp FROM streak WHERE activity_date = CURRENT_DATE
      UNION ALL
      SELECT grp FROM streak WHERE activity_date = CURRENT_DATE - INTERVAL '1 day'
      LIMIT 1
    )
  `)

  const row = (result as unknown as Array<Record<string, unknown>>)[0]
  return Number(row?.streak_count ?? 0)
}

/**
 * Get paginated answer history with search and filters.
 */
export async function getAnswerHistory(
  userId: string,
  opts: {
    page: number
    pageSize: number
    search?: string
    chapterId?: string
    correct?: boolean
    dateRange?: DateRange
    typeFilter?: AttemptTypeFilter
  }
): Promise<AnswerHistoryResult> {
  const conditions = [
    sql`a.user_id = ${userId}`,
    sql`a.status = 'completed'`,
  ]

  if (opts.search) {
    conditions.push(sql`q.text ILIKE ${"%" + opts.search + "%"}`)
  }
  if (opts.chapterId) {
    conditions.push(sql`q.chapter_id = ${opts.chapterId}`)
  }
  if (opts.correct !== undefined) {
    conditions.push(sql`aa.is_correct = ${opts.correct}`)
  }
  if (opts.dateRange) {
    conditions.push(sql`aa.answered_at >= ${opts.dateRange.from}`)
    conditions.push(sql`aa.answered_at <= ${opts.dateRange.to}`)
  }
  if (opts.typeFilter && opts.typeFilter !== "all") {
    if (
      opts.typeFilter === "practice_chapter" ||
      opts.typeFilter === "practice_mixed"
    ) {
      conditions.push(
        sql`a.type IN ('practice_chapter', 'practice_mixed')`
      )
    } else {
      conditions.push(sql`a.type = ${opts.typeFilter}`)
    }
  }

  const whereClause = sql.join(conditions, sql` AND `)
  const offset = (opts.page - 1) * opts.pageSize

  const rowsResult = await db.execute(sql`
    SELECT
      aa.id as answer_id,
      q.text as question_text,
      q.type as question_type,
      c.name as chapter_name,
      q.chapter_id as chapter_id,
      aa.selected_options,
      aa.is_correct,
      aa.score,
      aa.answered_at,
      a.type as attempt_type,
      ARRAY(
        SELECT o.label FROM options o
        WHERE o.question_id = q.id AND o.is_correct = true
        ORDER BY o.label
      ) as correct_options
    FROM attempt_answers aa
    JOIN attempts a ON aa.attempt_id = a.id
    JOIN questions q ON aa.question_id = q.id
    JOIN chapters c ON q.chapter_id = c.id
    WHERE ${whereClause}
    ORDER BY aa.answered_at DESC
    LIMIT ${opts.pageSize}
    OFFSET ${offset}
  `)

  const countResult = await db.execute(sql`
    SELECT COUNT(*)::int as total
    FROM attempt_answers aa
    JOIN attempts a ON aa.attempt_id = a.id
    JOIN questions q ON aa.question_id = q.id
    JOIN chapters c ON q.chapter_id = c.id
    WHERE ${whereClause}
  `)

  const total = Number(
    (countResult as unknown as Array<Record<string, unknown>>)[0]?.total ?? 0
  )

  const rows: AnswerHistoryRow[] = (
    rowsResult as unknown as Array<Record<string, unknown>>
  ).map((row) => ({
    answerId: String(row.answer_id),
    questionText: String(row.question_text),
    questionType: row.question_type as "CS" | "CM",
    chapterName: String(row.chapter_name),
    chapterId: String(row.chapter_id),
    selectedOptions: (row.selected_options as string[]) ?? [],
    correctOptions: (row.correct_options as string[]) ?? [],
    isCorrect: row.is_correct as boolean | null,
    score: row.score as number | null,
    answeredAt: new Date(row.answered_at as string).toISOString(),
    attemptType: String(row.attempt_type),
  }))

  return { rows, total, page: opts.page, pageSize: opts.pageSize }
}

/**
 * Get non-archived chapters for filter dropdowns.
 */
export async function getChaptersForFilter(): Promise<
  Array<{ id: string; name: string }>
> {
  return db
    .select({ id: chapters.id, name: chapters.name })
    .from(chapters)
    .where(isNull(chapters.archivedAt))
    .orderBy(asc(chapters.sortOrder))
}
