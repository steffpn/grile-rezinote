"use server"

import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessMyMistakes } from "@/lib/subscription/gating"
import {
  getUnmasteredWrongAnswers,
  getWrongAnswerStats,
} from "@/lib/db/queries/wrong-answers"

/**
 * Get the current user's unmastered wrong answers.
 * Requires PRO or PREMIUM — FREE users are blocked server-side.
 */
export async function getMyMistakes(chapterFilter?: string[]) {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!canAccessMyMistakes(access.tier)) {
    throw new Error(
      'Functia "Greselile mele" este disponibila doar pentru PRO si PREMIUM.'
    )
  }
  return getUnmasteredWrongAnswers(user.id, chapterFilter)
}

/**
 * Get wrong answer statistics for the current user.
 * Requires PRO or PREMIUM.
 */
export async function getMyMistakesStats() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!canAccessMyMistakes(access.tier)) {
    throw new Error(
      'Functia "Greselile mele" este disponibila doar pentru PRO si PREMIUM.'
    )
  }
  return getWrongAnswerStats(user.id)
}
