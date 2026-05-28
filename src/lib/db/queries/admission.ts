import { db } from "@/lib/db"
import { specialties, admissionData } from "@/lib/db/schema"
import { eq, isNull, asc, desc } from "drizzle-orm"

/**
 * Get all non-archived specialties ordered by sortOrder
 */
export async function getSpecialties() {
  return db
    .select({
      id: specialties.id,
      name: specialties.name,
      description: specialties.description,
      sortOrder: specialties.sortOrder,
      archivedAt: specialties.archivedAt,
      createdAt: specialties.createdAt,
    })
    .from(specialties)
    .where(isNull(specialties.archivedAt))
    .orderBy(asc(specialties.sortOrder), asc(specialties.name))
}

/**
 * Get all specialties including archived ones
 */
export async function getAllSpecialties() {
  return db
    .select({
      id: specialties.id,
      name: specialties.name,
      description: specialties.description,
      sortOrder: specialties.sortOrder,
      archivedAt: specialties.archivedAt,
      createdAt: specialties.createdAt,
    })
    .from(specialties)
    .orderBy(asc(specialties.sortOrder), asc(specialties.name))
}

/**
 * Get a single specialty by ID
 */
export async function getSpecialtyById(id: string) {
  const [specialty] = await db
    .select()
    .from(specialties)
    .where(eq(specialties.id, id))
    .limit(1)
  return specialty ?? null
}

/**
 * Get all admission data joined with specialty names
 */
export async function getAdmissionData() {
  return db
    .select({
      id: admissionData.id,
      specialtyId: admissionData.specialtyId,
      specialtyName: specialties.name,
      umf: admissionData.umf,
      year: admissionData.year,
      thresholdScore: admissionData.thresholdScore,
      availableSpots: admissionData.availableSpots,
      createdAt: admissionData.createdAt,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .orderBy(asc(specialties.name), asc(admissionData.umf), desc(admissionData.year))
}

/**
 * Distinct UMF values across admission_data, for filter dropdowns and
 * autocomplete in the admin edit form.
 */
export async function getDistinctUmfs(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ umf: admissionData.umf })
    .from(admissionData)
    .orderBy(asc(admissionData.umf))
  return rows.map((r) => r.umf).filter((u): u is string => !!u && u.length > 0)
}

/**
 * Get admission data for the comparison feature (only non-archived specialties)
 */
export async function getAdmissionDataForComparison() {
  return db
    .select({
      id: admissionData.id,
      specialtyId: admissionData.specialtyId,
      specialtyName: specialties.name,
      year: admissionData.year,
      thresholdScore: admissionData.thresholdScore,
      availableSpots: admissionData.availableSpots,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .where(isNull(specialties.archivedAt))
    .orderBy(asc(specialties.name), asc(admissionData.year))
}

/**
 * Get admission data structured for the explorer charts.
 *
 * Each specialty groups its data points by (year, umf). The chart consumes one
 * line per specialty per UMF, and the table renders one row per (specialty,
 * UMF, year).
 */
export async function getAdmissionDataForExplorer() {
  const data = await db
    .select({
      specialtyId: admissionData.specialtyId,
      specialtyName: specialties.name,
      umf: admissionData.umf,
      year: admissionData.year,
      thresholdScore: admissionData.thresholdScore,
      availableSpots: admissionData.availableSpots,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .where(isNull(specialties.archivedAt))
    .orderBy(asc(specialties.name), asc(admissionData.umf), asc(admissionData.year))

  // Group by specialty for chart rendering
  const grouped = new Map<
    string,
    {
      id: string
      name: string
      data: {
        umf: string | null
        year: number
        thresholdScore: number
        availableSpots: number
      }[]
    }
  >()

  for (const row of data) {
    // INNER JOIN guarantees specialtyId is non-null at runtime.
    const specialtyId = row.specialtyId!
    if (!grouped.has(specialtyId)) {
      grouped.set(specialtyId, {
        id: specialtyId,
        name: row.specialtyName,
        data: [],
      })
    }
    grouped.get(specialtyId)!.data.push({
      umf: row.umf,
      year: row.year,
      thresholdScore: row.thresholdScore,
      availableSpots: row.availableSpots,
    })
  }

  return Array.from(grouped.values())
}

/**
 * Get the distinct UMF names present in admission_data, in display order.
 */
export async function getAvailableUmfs(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ umf: admissionData.umf })
    .from(admissionData)
    .orderBy(asc(admissionData.umf))
  return rows.map((r) => r.umf).filter((u): u is string => u != null)
}

/**
 * Get distinct available years from admission data
 */
export async function getAvailableYears() {
  const rows = await db
    .selectDistinct({ year: admissionData.year })
    .from(admissionData)
    .orderBy(asc(admissionData.year))
  return rows.map((r) => r.year)
}

/**
 * Get active (non-archived) specialties for filter dropdowns
 */
export async function getActiveSpecialties() {
  return db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties)
    .where(isNull(specialties.archivedAt))
    .orderBy(asc(specialties.name))
}
