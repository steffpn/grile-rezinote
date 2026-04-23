"use server"

import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessRanking } from "@/lib/subscription/gating"
import {
  getPeerRankings,
  getPeerAggregateStats,
  getScoreDistribution,
  getUserPeerOptIn,
  togglePeerOptIn,
} from "@/lib/db/queries/peer"
import type { PeerComparisonData, PeerAggregateStats } from "@/types/peer"

/**
 * Fetch full peer comparison data. PREMIUM-only feature — FREE and PRO users
 * see the ranking page replaced by an upgrade blocker at the page level, but
 * we gate here too as defense in depth.
 * If user is opted-in, returns rankings + distribution + stats.
 * If not opted-in, returns stats only (user can see general stats without participating).
 */
export async function fetchPeerComparison(): Promise<PeerComparisonData> {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!canAccessRanking(access.tier)) {
    throw new Error(
      "Clasamentul este disponibil doar pentru utilizatorii PREMIUM."
    )
  }
  const userOptedIn = await getUserPeerOptIn(user.id)

  if (userOptedIn) {
    const [rankings, stats, distribution] = await Promise.all([
      getPeerRankings(user.id),
      getPeerAggregateStats(user.id),
      getScoreDistribution(user.id),
    ])

    return { rankings, stats, distribution, userOptedIn }
  }

  // Not opted in — still show aggregate stats
  const stats = await getPeerAggregateStats(user.id)

  return {
    rankings: [],
    stats,
    distribution: [],
    userOptedIn,
  }
}

/**
 * Toggle peer ranking participation.
 */
export async function togglePeerParticipation(
  optIn: boolean
): Promise<{ success: boolean; optedIn: boolean }> {
  const user = await getCurrentUser()
  await togglePeerOptIn(user.id, optIn)
  return { success: true, optedIn: optIn }
}

/**
 * Fetch just aggregate peer stats (lightweight, for post-test results).
 */
export async function fetchPeerStats(): Promise<PeerAggregateStats> {
  const user = await getCurrentUser()
  return getPeerAggregateStats(user.id)
}
