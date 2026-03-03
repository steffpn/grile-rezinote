/**
 * Admission comparison logic.
 * Compares a student's exam score against historical admission thresholds.
 */

export type AdmissionYearResult = {
  year: number
  threshold: number
  spots: number
  admitted: boolean
}

export type SpecialtyAdmissionResult = {
  specialty: { id: string; name: string }
  years: AdmissionYearResult[]
  admittedCount: number
  totalYears: number
}

export type AdmissionComparisonResult = {
  results: SpecialtyAdmissionResult[]
  totalSpecialties: number
  admittedSpecialties: number
  userScore: number
}

export type AdmissionDataRow = {
  specialtyId: string
  specialtyName: string
  year: number
  thresholdScore: number
  availableSpots: number
}

/**
 * Compare a user's exam score against historical admission thresholds.
 * Returns per-specialty, per-year admission results.
 *
 * A specialty counts as "admitted" if the student would have been admitted
 * in the majority of available years (admittedCount > totalYears / 2).
 */
export function compareAdmission(
  userScore: number,
  admissionData: AdmissionDataRow[]
): AdmissionComparisonResult {
  // Group by specialty
  const bySpecialty = new Map<string, AdmissionDataRow[]>()
  for (const row of admissionData) {
    const existing = bySpecialty.get(row.specialtyId) ?? []
    existing.push(row)
    bySpecialty.set(row.specialtyId, existing)
  }

  const results: SpecialtyAdmissionResult[] = []

  for (const [specialtyId, entries] of bySpecialty) {
    const sortedEntries = entries.sort((a, b) => a.year - b.year)

    const years: AdmissionYearResult[] = sortedEntries.map((entry) => ({
      year: entry.year,
      threshold: entry.thresholdScore,
      spots: entry.availableSpots,
      admitted: userScore >= entry.thresholdScore,
    }))

    const admittedCount = years.filter((y) => y.admitted).length

    results.push({
      specialty: {
        id: specialtyId,
        name: entries[0].specialtyName,
      },
      years,
      admittedCount,
      totalYears: years.length,
    })
  }

  // Sort alphabetically by specialty name
  results.sort((a, b) => a.specialty.name.localeCompare(b.specialty.name, "ro"))

  // A specialty counts as "admitted" if admitted in majority of years
  const admittedSpecialties = results.filter(
    (r) => r.admittedCount > r.totalYears / 2
  ).length

  return {
    results,
    totalSpecialties: results.length,
    admittedSpecialties,
    userScore,
  }
}
