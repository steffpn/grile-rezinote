import { db } from "@/lib/db"
import { attempts, admissionData, specialties } from "@/lib/db/schema"
import { eq, and, isNull, sql, desc } from "drizzle-orm"

export type UmfChance = {
  umf: string
  yearsQualified: number
  yearsEvaluated: number
  qualifyingRate: number // 0–1
  avgThreshold: number
  latestThreshold: number
  latestYear: number
  /** True if user's best score >= latest year's threshold for this (specialty, UMF). */
  latestQualified: boolean
}

export type SpecialtyChance = {
  specialtyId: string
  specialtyName: string
  /** Aggregate stats across all UMFs for this specialty. */
  yearsQualified: number
  yearsEvaluated: number
  qualifyingRate: number // 0–1
  avgThreshold: number
  latestThreshold: number
  latestYear: number
  /** Per-UMF breakdown. */
  umfs: UmfChance[]
  /** Number of UMFs where user would have qualified in the latest year. */
  umfsQualifiedLatest: number
  /** Total UMFs evaluated in the latest year (typically 6 minus any N/A). */
  umfsTotalLatest: number
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

  // 2. Fetch admission thresholds per (specialty, UMF, year).
  const rows = await db
    .select({
      specialtyId: admissionData.specialtyId,
      specialtyName: specialties.name,
      umf: admissionData.umf,
      year: admissionData.year,
      threshold: admissionData.thresholdScore,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .where(isNull(specialties.archivedAt))
    .orderBy(specialties.name, admissionData.umf, desc(admissionData.year))

  // Group by specialty → UMF → entries.
  type Entry = { year: number; threshold: number }
  const bySpecialty = new Map<
    string,
    {
      name: string
      umfs: Map<string, Entry[]>
    }
  >()
  for (const r of rows) {
    // INNER JOIN with specialties guarantees specialtyId is non-null at runtime.
    const sid = r.specialtyId!
    const umfName = r.umf ?? "—"
    if (!bySpecialty.has(sid)) {
      bySpecialty.set(sid, { name: r.specialtyName, umfs: new Map() })
    }
    const specGroup = bySpecialty.get(sid)!
    if (!specGroup.umfs.has(umfName)) {
      specGroup.umfs.set(umfName, [])
    }
    specGroup.umfs.get(umfName)!.push({
      year: r.year,
      threshold: r.threshold,
    })
  }

  // 3. For each specialty, build per-UMF breakdown and aggregate stats.
  const specialtyResults: SpecialtyChance[] = []
  for (const [specialtyId, { name, umfs: umfMap }] of bySpecialty) {
    const umfChances: UmfChance[] = []
    let allYearsQualified = 0
    let allYearsEvaluated = 0
    let allThresholdSum = 0
    let latestYearOverall = 0
    let latestThresholdOverall = 0
    let umfsQualifiedLatest = 0
    let umfsTotalLatest = 0

    for (const [umf, entries] of umfMap) {
      if (entries.length === 0) continue
      const yearsEvaluated = entries.length
      const yearsQualified = entries.filter(
        (e) => bestScore >= e.threshold,
      ).length
      const qualifyingRate = yearsQualified / yearsEvaluated
      const avgThreshold =
        entries.reduce((s, e) => s + e.threshold, 0) / yearsEvaluated
      const latest = entries[0] // entries ordered year DESC
      const latestQualified = bestScore >= latest.threshold

      umfChances.push({
        umf,
        yearsQualified,
        yearsEvaluated,
        qualifyingRate,
        avgThreshold,
        latestThreshold: latest.threshold,
        latestYear: latest.year,
        latestQualified,
      })

      allYearsQualified += yearsQualified
      allYearsEvaluated += yearsEvaluated
      allThresholdSum += entries.reduce((s, e) => s + e.threshold, 0)
      if (latest.year > latestYearOverall) {
        latestYearOverall = latest.year
        latestThresholdOverall = latest.threshold
      }
      umfsTotalLatest++
      if (latestQualified) umfsQualifiedLatest++
    }

    if (umfChances.length === 0) continue

    // Sort UMFs by latest threshold ascending (easiest first).
    umfChances.sort((a, b) => a.latestThreshold - b.latestThreshold)

    specialtyResults.push({
      specialtyId,
      specialtyName: name,
      yearsQualified: allYearsQualified,
      yearsEvaluated: allYearsEvaluated,
      qualifyingRate:
        allYearsEvaluated === 0 ? 0 : allYearsQualified / allYearsEvaluated,
      avgThreshold:
        allYearsEvaluated === 0 ? 0 : allThresholdSum / allYearsEvaluated,
      latestThreshold: latestThresholdOverall,
      latestYear: latestYearOverall,
      umfs: umfChances,
      umfsQualifiedLatest,
      umfsTotalLatest,
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
