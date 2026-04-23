import { db } from "@/lib/db"
import { attempts, admissionData, specialties } from "@/lib/db/schema"
import { eq, and, isNull, sql, desc } from "drizzle-orm"

export type SpecialtyChance = {
  specialtyId: string
  specialtyName: string
  yearsQualified: number
  yearsEvaluated: number
  qualifyingRate: number // 0–1
  avgThreshold: number
  latestThreshold: number
  latestYear: number
}

export type AdmissionChanceReport = {
  hasSimulation: boolean
  bestScore: number | null
  maxScore: number | null
  avgScore: number | null
  simulationCount: number
  specialties: SpecialtyChance[]
  /** Overall qualifying rate averaged across all specialties (0–1). */
  overallRate: number
}

/**
 * Computes, for each specialty, how many of the past admission years the
 * user would have qualified in based on their best simulation score.
 *
 * Returns an empty report if the user hasn't completed a simulation yet —
 * the UI should render a "take a simulation to unlock" state.
 */
export async function getAdmissionChanceForUser(
  userId: string
): Promise<AdmissionChanceReport> {
  // 1. Fetch user's best + avg simulation score.
  const scoreRows = await db
    .select({
      best: sql<number | null>`MAX(${attempts.score})`,
      avg: sql<number | null>`AVG(${attempts.score})`,
      maxScore: sql<number | null>`MAX(${attempts.maxScore})`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.type, "simulation"),
        eq(attempts.status, "completed")
      )
    )

  const scoreRow = scoreRows[0]
  const bestScore = scoreRow?.best != null ? Number(scoreRow.best) : null
  const avgScore = scoreRow?.avg != null ? Number(scoreRow.avg) : null
  const maxScore = scoreRow?.maxScore != null ? Number(scoreRow.maxScore) : null
  const simulationCount = Number(scoreRow?.count ?? 0)

  if (bestScore == null || simulationCount === 0) {
    return {
      hasSimulation: false,
      bestScore: null,
      maxScore: null,
      avgScore: null,
      simulationCount: 0,
      specialties: [],
      overallRate: 0,
    }
  }

  // 2. Fetch admission thresholds per specialty, grouped across years.
  const rows = await db
    .select({
      specialtyId: admissionData.specialtyId,
      specialtyName: specialties.name,
      year: admissionData.year,
      threshold: admissionData.thresholdScore,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .where(isNull(specialties.archivedAt))
    .orderBy(specialties.name, desc(admissionData.year))

  // Group by specialty.
  const bySpecialty = new Map<
    string,
    {
      name: string
      entries: { year: number; threshold: number }[]
    }
  >()
  for (const r of rows) {
    const key = r.specialtyId
    if (!bySpecialty.has(key)) {
      bySpecialty.set(key, { name: r.specialtyName, entries: [] })
    }
    bySpecialty.get(key)!.entries.push({
      year: r.year,
      threshold: r.threshold,
    })
  }

  // 3. For each specialty, compute qualifying rate across its recorded years.
  const specialtyResults: SpecialtyChance[] = []
  for (const [specialtyId, { name, entries }] of bySpecialty) {
    if (entries.length === 0) continue
    const yearsEvaluated = entries.length
    const yearsQualified = entries.filter(
      (e) => bestScore >= e.threshold
    ).length
    const qualifyingRate =
      yearsEvaluated === 0 ? 0 : yearsQualified / yearsEvaluated
    const avgThreshold =
      entries.reduce((s, e) => s + e.threshold, 0) / yearsEvaluated
    const latest = entries[0] // entries are ordered year DESC

    specialtyResults.push({
      specialtyId,
      specialtyName: name,
      yearsQualified,
      yearsEvaluated,
      qualifyingRate,
      avgThreshold,
      latestThreshold: latest.threshold,
      latestYear: latest.year,
    })
  }

  // Sort: highest qualifying rate first (best shot first).
  specialtyResults.sort((a, b) => {
    if (b.qualifyingRate !== a.qualifyingRate)
      return b.qualifyingRate - a.qualifyingRate
    return a.avgThreshold - b.avgThreshold
  })

  const overallRate =
    specialtyResults.length === 0
      ? 0
      : specialtyResults.reduce((s, r) => s + r.qualifyingRate, 0) /
        specialtyResults.length

  return {
    hasSimulation: true,
    bestScore,
    maxScore,
    avgScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
    simulationCount,
    specialties: specialtyResults,
    overallRate,
  }
}
