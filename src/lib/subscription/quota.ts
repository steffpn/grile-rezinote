import { sql, eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { attemptAnswers, attempts } from "@/lib/db/schema"
import type { PlanTier } from "./tiers"
import { getDailyQuestionLimit } from "./gating"

/**
 * Timezone used for "today" windows. Quota resets at local midnight in this
 * timezone so a Romanian user's quota behaves predictably regardless of server
 * locale.
 */
const QUOTA_TIMEZONE = "Europe/Bucharest"

/**
 * Returns the number of questions the user has answered today (local time
 * in QUOTA_TIMEZONE). Used to enforce the FREE-tier 20-questions-per-day limit.
 *
 * Counts distinct (attempt_id, question_id) rows with answered_at falling on
 * today's local date. Both practice and exam answers count against the same
 * budget.
 */
export async function getQuestionsAnsweredToday(
  userId: string
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
    .where(
      and(
        eq(attempts.userId, userId),
        sql`(${attemptAnswers.answeredAt} AT TIME ZONE ${QUOTA_TIMEZONE})::date = (NOW() AT TIME ZONE ${QUOTA_TIMEZONE})::date`
      )
    )

  return rows[0]?.count ?? 0
}

/**
 * Computes remaining questions for the user's tier today.
 * Returns null for tiers with unlimited access (PRO/PREMIUM).
 */
export async function getRemainingDailyQuota(
  userId: string,
  tier: PlanTier
): Promise<number | null> {
  const limit = getDailyQuestionLimit(tier)
  if (limit === null) return null

  const used = await getQuestionsAnsweredToday(userId)
  return Math.max(0, limit - used)
}

export type QuotaCheckResult =
  | { ok: true; remaining: number | null; limit: number | null }
  | { ok: false; remaining: number; limit: number; used: number }

/**
 * Checks whether the user has quota left to start a session of `requestedCount`
 * questions. Returns a structured result so callers can produce tier-aware UX
 * (e.g., capping at remaining, or blocking with "upgrade" copy).
 */
export async function checkDailyQuota(
  userId: string,
  tier: PlanTier,
  requestedCount: number
): Promise<QuotaCheckResult> {
  const limit = getDailyQuestionLimit(tier)
  if (limit === null) {
    return { ok: true, remaining: null, limit: null }
  }

  const used = await getQuestionsAnsweredToday(userId)
  const remaining = Math.max(0, limit - used)

  if (requestedCount > remaining) {
    return { ok: false, remaining, limit, used }
  }

  return { ok: true, remaining, limit }
}
