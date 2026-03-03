import { db } from "@/lib/db"
import { users, attempts } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import type {
  PeerRankingEntry,
  PeerAggregateStats,
  ScoreDistributionBin,
} from "@/types/peer"

/**
 * Get all opted-in users ranked by best simulation score.
 * Only includes completed simulations from opted-in users.
 */
export async function getPeerRankings(
  currentUserId: string
): Promise<PeerRankingEntry[]> {
  const result = await db.execute(sql`
    WITH simulation_scores AS (
      SELECT
        a.user_id,
        MAX(a.score) as best_score,
        MAX(a.max_score) as max_possible
      FROM ${attempts} a
      JOIN ${users} u ON a.user_id = u.id
      WHERE a.type = 'simulation'
        AND a.status = 'completed'
        AND u.peer_opt_in = true
      GROUP BY a.user_id
    ),
    ranked AS (
      SELECT
        user_id,
        best_score,
        max_possible,
        RANK() OVER (ORDER BY best_score DESC) as rank,
        COUNT(*) OVER () as total_participants
      FROM simulation_scores
    )
    SELECT
      user_id,
      best_score,
      max_possible,
      rank::int,
      total_participants::int,
      CASE
        WHEN total_participants <= 1 THEN 100.0
        ELSE ROUND((1.0 - (rank - 1)::numeric / (total_participants - 1)) * 100, 1)
      END as percentile
    FROM ranked
    ORDER BY rank ASC
  `)

  return (result as Array<Record<string, unknown>>).map((row) => ({
    userId: row.user_id as string,
    bestScore: Number(row.best_score),
    maxPossible: Number(row.max_possible),
    rank: Number(row.rank),
    totalParticipants: Number(row.total_participants),
    percentile: Number(row.percentile),
    isCurrentUser: (row.user_id as string) === currentUserId,
  }))
}

/**
 * Get aggregate statistics: mean, median, total participants, and current user's position.
 * Aggregate stats include ALL simulation completers (not just opted-in) for accuracy.
 */
export async function getPeerAggregateStats(
  currentUserId: string
): Promise<PeerAggregateStats> {
  // Get aggregate stats from all completers
  const aggregateResult = await db.execute(sql`
    WITH user_scores AS (
      SELECT user_id, MAX(score) as best_score
      FROM ${attempts}
      WHERE type = 'simulation' AND status = 'completed'
      GROUP BY user_id
    )
    SELECT
      COALESCE(ROUND(AVG(best_score)::numeric, 1), 0) as mean_score,
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY best_score), 0) as median_score,
      COUNT(*)::int as total_participants
    FROM user_scores
  `)

  const aggRow = (aggregateResult as Array<Record<string, unknown>>)[0] ?? {
    mean_score: 0,
    median_score: 0,
    total_participants: 0,
  }

  // Get current user's rank and best score
  const userResult = await db.execute(sql`
    WITH user_scores AS (
      SELECT user_id, MAX(score) as best_score
      FROM ${attempts}
      WHERE type = 'simulation' AND status = 'completed'
      GROUP BY user_id
    ),
    ranked AS (
      SELECT
        user_id,
        best_score,
        RANK() OVER (ORDER BY best_score DESC) as rank,
        COUNT(*) OVER () as total
      FROM user_scores
    )
    SELECT best_score, rank::int, total::int
    FROM ranked
    WHERE user_id = ${currentUserId}
  `)

  const userRow = (userResult as Array<Record<string, unknown>>)[0]
  const totalParticipants = Number(aggRow.total_participants)

  let userPercentile: number | null = null
  if (userRow) {
    const userRank = Number(userRow.rank)
    userPercentile =
      totalParticipants <= 1
        ? 100
        : Math.round(
            (1 - (userRank - 1) / (totalParticipants - 1)) * 100 * 10
          ) / 10
  }

  return {
    meanScore: Number(aggRow.mean_score),
    medianScore: Number(aggRow.median_score),
    totalParticipants,
    userBestScore: userRow ? Number(userRow.best_score) : null,
    userRank: userRow ? Number(userRow.rank) : null,
    userPercentile,
  }
}

/**
 * Get score distribution as histogram bins (10 bins, 0-10% through 90-100%).
 */
export async function getScoreDistribution(
  currentUserId: string
): Promise<ScoreDistributionBin[]> {
  // Get user's bin first
  const userBinResult = await db.execute(sql`
    WITH user_scores AS (
      SELECT user_id, MAX(score) as best_score, MAX(max_score) as max_possible
      FROM ${attempts}
      WHERE type = 'simulation' AND status = 'completed'
      GROUP BY user_id
    )
    SELECT
      CASE
        WHEN max_possible = 0 THEN 0
        ELSE FLOOR((best_score::numeric / max_possible) * 10)::int
      END as bin_index
    FROM user_scores
    WHERE user_id = ${currentUserId}
  `)

  const userBinIndex =
    (userBinResult as Array<Record<string, unknown>>)[0] != null
      ? Math.min(Number((userBinResult as Array<Record<string, unknown>>)[0].bin_index), 9)
      : -1

  // Get distribution
  const result = await db.execute(sql`
    WITH user_scores AS (
      SELECT user_id, MAX(score) as best_score, MAX(max_score) as max_possible
      FROM ${attempts}
      WHERE type = 'simulation' AND status = 'completed'
      GROUP BY user_id
    ),
    binned AS (
      SELECT
        CASE
          WHEN max_possible = 0 THEN 0
          ELSE LEAST(FLOOR((best_score::numeric / max_possible) * 10)::int, 9)
        END as bin_index
      FROM user_scores
    ),
    all_bins AS (
      SELECT generate_series(0, 9) as bin_index
    )
    SELECT
      ab.bin_index,
      COALESCE(COUNT(b.bin_index), 0)::int as count
    FROM all_bins ab
    LEFT JOIN binned b ON ab.bin_index = b.bin_index
    GROUP BY ab.bin_index
    ORDER BY ab.bin_index
  `)

  const binLabels = [
    "0-10%",
    "10-20%",
    "20-30%",
    "30-40%",
    "40-50%",
    "50-60%",
    "60-70%",
    "70-80%",
    "80-90%",
    "90-100%",
  ]

  return (result as Array<Record<string, unknown>>).map((row) => {
    const idx = Number(row.bin_index)
    return {
      bin: binLabels[idx] ?? `${idx * 10}-${(idx + 1) * 10}%`,
      binIndex: idx,
      count: Number(row.count),
      isUserBin: idx === userBinIndex,
    }
  })
}

/**
 * Get user's peer opt-in status.
 */
export async function getUserPeerOptIn(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ peerOptIn: users.peerOptIn })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row?.peerOptIn ?? false
}

/**
 * Toggle user's peer opt-in status.
 */
export async function togglePeerOptIn(
  userId: string,
  optIn: boolean
): Promise<void> {
  await db
    .update(users)
    .set({ peerOptIn: optIn })
    .where(eq(users.id, userId))
}
