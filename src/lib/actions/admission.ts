"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { specialties, admissionData } from "@/lib/db/schema"
import { eq, and, isNull, max, sql, ne } from "drizzle-orm"
import { getCurrentAdmin, logAudit } from "@/lib/db/queries/admin"
import {
  specialtySchema,
  admissionDataSchema,
  admissionImportRowSchema,
  type AdmissionImportRow,
  type AdmissionImportResult,
} from "@/lib/validations/admission"

// ==========================================
// Specialty CRUD
// ==========================================

export async function createSpecialty(formData: FormData) {
  const admin = await getCurrentAdmin()

  const parsed = specialtySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const normalizedName = parsed.data.name.trim()

  // Friendly pre-check before hitting the UNIQUE INDEX on
  // lower(trim(name)) (migration 0004) — without it the user would only
  // see a generic Postgres error from the failed insert.
  const [conflict] = await db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties)
    .where(sql`lower(trim(${specialties.name})) = ${normalizedName.toLowerCase()}`)
    .limit(1)

  if (conflict) {
    return {
      error: {
        name: [
          `Există deja o specialitate cu acest nume: "${conflict.name}".`,
        ],
      },
    }
  }

  // Get next sort order
  const [maxOrder] = await db
    .select({ value: max(specialties.sortOrder) })
    .from(specialties)

  const nextOrder = (maxOrder?.value ?? -1) + 1

  const [newSpecialty] = await db
    .insert(specialties)
    .values({
      name: normalizedName,
      description: parsed.data.description || null,
      sortOrder: nextOrder,
    })
    .returning({ id: specialties.id })

  await logAudit(admin.id, "create", "specialty", newSpecialty.id, {
    name: normalizedName,
    description: parsed.data.description,
  })

  revalidatePath("/admin/specialties")
  return { success: true, id: newSpecialty.id }
}

export async function updateSpecialty(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()

  const parsed = specialtySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const normalizedName = parsed.data.name.trim()

  // Pre-check: another row already owns this name (case-insensitive).
  const [conflict] = await db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties)
    .where(
      and(
        sql`lower(trim(${specialties.name})) = ${normalizedName.toLowerCase()}`,
        ne(specialties.id, id),
      ),
    )
    .limit(1)

  if (conflict) {
    return {
      error: {
        name: [
          `Există deja o specialitate cu acest nume: "${conflict.name}".`,
        ],
      },
    }
  }

  // Fetch old values for audit
  const [old] = await db
    .select({ name: specialties.name, description: specialties.description })
    .from(specialties)
    .where(eq(specialties.id, id))

  await db
    .update(specialties)
    .set({
      name: normalizedName,
      description: parsed.data.description || null,
    })
    .where(eq(specialties.id, id))

  await logAudit(admin.id, "update", "specialty", id, {
    name: { old: old?.name, new: normalizedName },
    description: { old: old?.description, new: parsed.data.description },
  })

  revalidatePath("/admin/specialties")
  return { success: true }
}

export async function archiveSpecialty(id: string) {
  const admin = await getCurrentAdmin()

  await db
    .update(specialties)
    .set({ archivedAt: new Date() })
    .where(eq(specialties.id, id))

  await logAudit(admin.id, "delete", "specialty", id)

  revalidatePath("/admin/specialties")
  return { success: true }
}

export async function restoreSpecialty(id: string) {
  const admin = await getCurrentAdmin()

  await db
    .update(specialties)
    .set({ archivedAt: null })
    .where(eq(specialties.id, id))

  await logAudit(admin.id, "restore", "specialty", id)

  revalidatePath("/admin/specialties")
  return { success: true }
}

// ==========================================
// Admission Data CRUD
// ==========================================

export async function createAdmissionEntry(data: {
  specialtyId: string
  year: number
  thresholdScore: number
  availableSpots: number
}) {
  const admin = await getCurrentAdmin()

  const parsed = admissionDataSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Get specialty name for denormalized field
  const [specialty] = await db
    .select({ name: specialties.name })
    .from(specialties)
    .where(eq(specialties.id, parsed.data.specialtyId))
    .limit(1)

  if (!specialty) {
    return { error: { specialtyId: ["Specialitatea nu exista"] } }
  }

  const [entry] = await db
    .insert(admissionData)
    .values({
      specialtyId: parsed.data.specialtyId,
      specialty: specialty.name,
      year: parsed.data.year,
      thresholdScore: parsed.data.thresholdScore,
      availableSpots: parsed.data.availableSpots,
    })
    .returning({ id: admissionData.id })

  await logAudit(admin.id, "create", "admission_data", entry.id, {
    specialty: specialty.name,
    year: parsed.data.year,
    thresholdScore: parsed.data.thresholdScore,
    availableSpots: parsed.data.availableSpots,
  })

  revalidatePath("/admin/admission-data")
  return { success: true, id: entry.id }
}

export async function updateAdmissionEntry(
  id: string,
  data: {
    specialtyId: string
    year: number
    thresholdScore: number
    availableSpots: number
  }
) {
  const admin = await getCurrentAdmin()

  const parsed = admissionDataSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Get specialty name for denormalized field
  const [specialty] = await db
    .select({ name: specialties.name })
    .from(specialties)
    .where(eq(specialties.id, parsed.data.specialtyId))
    .limit(1)

  if (!specialty) {
    return { error: { specialtyId: ["Specialitatea nu exista"] } }
  }

  await db
    .update(admissionData)
    .set({
      specialtyId: parsed.data.specialtyId,
      specialty: specialty.name,
      year: parsed.data.year,
      thresholdScore: parsed.data.thresholdScore,
      availableSpots: parsed.data.availableSpots,
    })
    .where(eq(admissionData.id, id))

  await logAudit(admin.id, "update", "admission_data", id, {
    specialty: specialty.name,
    year: parsed.data.year,
    thresholdScore: parsed.data.thresholdScore,
    availableSpots: parsed.data.availableSpots,
  })

  revalidatePath("/admin/admission-data")
  return { success: true }
}

export async function deleteAdmissionEntry(id: string) {
  const admin = await getCurrentAdmin()

  await db.delete(admissionData).where(eq(admissionData.id, id))

  await logAudit(admin.id, "delete", "admission_data", id)

  revalidatePath("/admin/admission-data")
  return { success: true }
}

// ==========================================
// Bulk Import
// ==========================================

const BATCH_SIZE = 50

export async function importAdmissionData(
  rows: AdmissionImportRow[]
): Promise<AdmissionImportResult> {
  const admin = await getCurrentAdmin()

  const errors: { row: number; message: string }[] = []
  const validRows: Array<{ data: AdmissionImportRow; rowNum: number }> = []

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const parsed = admissionImportRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      errors.push({
        row: i + 2, // +2 for 1-indexed + header row
        message: issue?.message ?? "Eroare de validare",
      })
    } else {
      validRows.push({ data: parsed.data, rowNum: i + 2 })
    }
  }

  // Resolve specialty names to IDs
  const allSpecialties = await db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties)
    .where(isNull(specialties.archivedAt))

  const specialtyMap = new Map(
    allSpecialties.map((s) => [s.name.toLowerCase().trim(), s])
  )

  const resolvedRows: Array<{
    data: AdmissionImportRow
    specialtyId: string
    specialtyName: string
    rowNum: number
  }> = []

  for (const { data, rowNum } of validRows) {
    const match = specialtyMap.get(data.specialty.toLowerCase().trim())
    if (!match) {
      errors.push({
        row: rowNum,
        message: `Specialitatea "${data.specialty}" nu exista. Adaugati-o mai intai din pagina Specialitati.`,
      })
    } else {
      resolvedRows.push({
        data,
        specialtyId: match.id,
        specialtyName: match.name,
        rowNum,
      })
    }
  }

  // Insert in batches — upsert behavior: check for existing specialty+year
  let importedCount = 0

  for (let i = 0; i < resolvedRows.length; i += BATCH_SIZE) {
    const batch = resolvedRows.slice(i, i + BATCH_SIZE)

    for (const { data, specialtyId, specialtyName, rowNum } of batch) {
      try {
        // Check if entry already exists for this specialty+year
        const [existing] = await db
          .select({ id: admissionData.id })
          .from(admissionData)
          .where(
            and(
              eq(admissionData.specialtyId, specialtyId),
              eq(admissionData.year, data.year)
            )
          )
          .limit(1)

        if (existing) {
          // Update existing entry
          await db
            .update(admissionData)
            .set({
              thresholdScore: data.thresholdScore,
              availableSpots: data.availableSpots,
              specialty: specialtyName,
            })
            .where(eq(admissionData.id, existing.id))

          await logAudit(admin.id, "update", "admission_data", existing.id, {
            source: "import",
            specialty: specialtyName,
            year: data.year,
            thresholdScore: data.thresholdScore,
            availableSpots: data.availableSpots,
          })
        } else {
          // Insert new entry
          const [entry] = await db
            .insert(admissionData)
            .values({
              specialtyId,
              specialty: specialtyName,
              year: data.year,
              thresholdScore: data.thresholdScore,
              availableSpots: data.availableSpots,
            })
            .returning({ id: admissionData.id })

          await logAudit(admin.id, "create", "admission_data", entry.id, {
            source: "import",
            specialty: specialtyName,
            year: data.year,
            thresholdScore: data.thresholdScore,
            availableSpots: data.availableSpots,
          })
        }

        importedCount++
      } catch (err) {
        errors.push({
          row: rowNum,
          message: `Eroare la salvare: ${err instanceof Error ? err.message : "Eroare necunoscuta"}`,
        })
      }
    }
  }

  revalidatePath("/admin/admission-data")

  return {
    imported: importedCount,
    errors,
    total: rows.length,
  }
}

// ==========================================
// Export
// ==========================================

export async function exportAdmissionData() {
  await getCurrentAdmin()

  const data = await db
    .select({
      specialtyName: specialties.name,
      year: admissionData.year,
      thresholdScore: admissionData.thresholdScore,
      availableSpots: admissionData.availableSpots,
    })
    .from(admissionData)
    .innerJoin(specialties, eq(admissionData.specialtyId, specialties.id))
    .orderBy(specialties.name, admissionData.year)

  return data.map((d) => ({
    specialty: d.specialtyName,
    year: d.year,
    thresholdScore: d.thresholdScore,
    availableSpots: d.availableSpots,
  }))
}
