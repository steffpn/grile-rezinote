/**
 * Centralised feature-gate helpers. Pages and actions should reach for these
 * rather than testing `tier === "PRO"` inline — so if the feature matrix ever
 * shifts, there is exactly one place to update.
 */

import type { PlanTier } from "./tiers"
import { TIER_FEATURES, hasTierAtLeast } from "./tiers"

export function canAccessSimulations(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].simulations
}

export function canAccessMyMistakes(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].myMistakes
}

export function canAccessTestHistory(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].testHistory
}

export function canAccessGeneralDashboard(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].generalDashboard
}

export function canAccessChapterStats(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].chapterStats
}

export function canAccessSubchapterStats(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].subchapterStats
}

export function canAccessRanking(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].ranking
}

export function canAccessAdmissionModule(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].admissionModule
}

export function canAccessAdmissionChance(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].admissionChanceEstimate
}

export function canAccessAdvancedMistakeAnalysis(tier: PlanTier): boolean {
  return TIER_FEATURES[tier].advancedMistakeAnalysis
}

/** Minimum tier that unlocks a given feature — used to render "Upgrade to X" CTAs. */
export function minimumTierFor(feature: FeatureName): PlanTier {
  return FEATURE_MINIMUM_TIER[feature]
}

export type FeatureName =
  | "simulations"
  | "myMistakes"
  | "testHistory"
  | "generalDashboard"
  | "chapterStats"
  | "subchapterStats"
  | "ranking"
  | "admissionModule"
  | "admissionChance"
  | "advancedMistakeAnalysis"

const FEATURE_MINIMUM_TIER: Record<FeatureName, PlanTier> = {
  simulations: "PRO",
  myMistakes: "PRO",
  testHistory: "PRO",
  generalDashboard: "PRO",
  chapterStats: "PREMIUM",
  subchapterStats: "PREMIUM",
  ranking: "PREMIUM",
  admissionModule: "PREMIUM",
  admissionChance: "PREMIUM",
  advancedMistakeAnalysis: "PREMIUM",
}

/** Returns the daily question quota for a tier. null means unlimited. */
export function getDailyQuestionLimit(tier: PlanTier): number | null {
  return TIER_FEATURES[tier].dailyQuestionLimit
}

export { hasTierAtLeast }
