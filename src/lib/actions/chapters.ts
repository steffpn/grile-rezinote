"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { chapters, questions } from "@/lib/db/schema"
import { eq, isNull, asc, sql, and, max } from "drizzle-orm"
import { chapterSchema } from "@/lib/validations/chapter"
import { getCurrentAdmin, logAudit } from "@/lib/db/queries/admin"

export async function getChaptersWithStats() {
  const admin = await getCurrentAdmin()

  const chapterList = await db
    .select({
      id: chapters.id,
      name: chapters.name,
      description: chapters.description,
      sortOrder: chapters.sortOrder,
      archivedAt: chapters.archivedAt,
      createdAt: chapters.createdAt,
    })
    .from(chapters)
    .orderBy(asc(chapters.sortOrder))

  // Get question stats per chapter
  const stats = await db
    .select({
      chapterId: questions.chapterId,
      total: sql<number>`count(*)::int`,
      csCount: sql<number>`count(*) filter (where ${questions.type} = 'CS')::int`,
      cmCount: sql<number>`count(*) filter (where ${questions.type} = 'CM')::int`,
    })
    .from(questions)
    .where(isNull(questions.archivedAt))
    .groupBy(questions.chapterId)

  const statsMap = new Map(
    stats.map((s) => [
      s.chapterId,
      { total: s.total, csCount: s.csCount, cmCount: s.cmCount },
    ])
  )

  // Per-(chapter, subchapter) breakdown
  const subRows = await db
    .select({
      chapterId: questions.chapterId,
      subchapter: questions.subchapter,
      count: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(isNull(questions.archivedAt))
    .groupBy(questions.chapterId, questions.subchapter)

  const subsByChapter = new Map<
    string,
    Array<{ name: string; count: number }>
  >()
  for (const row of subRows) {
    if (!row.subchapter) continue
    if (!subsByChapter.has(row.chapterId)) subsByChapter.set(row.chapterId, [])
    subsByChapter.get(row.chapterId)!.push({
      name: row.subchapter,
      count: row.count,
    })
  }
  for (const list of subsByChapter.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "ro"))
  }

  return chapterList.map((ch) => ({
    ...ch,
    questionCount: statsMap.get(ch.id)?.total ?? 0,
    csCount: statsMap.get(ch.id)?.csCount ?? 0,
    cmCount: statsMap.get(ch.id)?.cmCount ?? 0,
    subchapters: subsByChapter.get(ch.id) ?? [],
  }))
}

export async function createChapter(formData: FormData) {
  const admin = await getCurrentAdmin()

  const parsed = chapterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Get next sort order
  const [maxOrder] = await db
    .select({ value: max(chapters.sortOrder) })
    .from(chapters)

  const nextOrder = (maxOrder?.value ?? -1) + 1

  const [newChapter] = await db
    .insert(chapters)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      sortOrder: nextOrder,
    })
    .returning({ id: chapters.id })

  await logAudit(admin.id, "create", "chapter", newChapter.id, {
    name: parsed.data.name,
    description: parsed.data.description,
  })

  revalidatePath("/admin/chapters")
  revalidatePath("/admin")
  return { success: true, id: newChapter.id }
}

export async function updateChapter(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()

  const parsed = chapterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Fetch old values for audit
  const [old] = await db
    .select({ name: chapters.name, description: chapters.description })
    .from(chapters)
    .where(eq(chapters.id, id))

  await db
    .update(chapters)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      updatedAt: new Date(),
    })
    .where(eq(chapters.id, id))

  await logAudit(admin.id, "update", "chapter", id, {
    name: { old: old?.name, new: parsed.data.name },
    description: { old: old?.description, new: parsed.data.description },
  })

  revalidatePath("/admin/chapters")
  revalidatePath("/admin")
  return { success: true }
}

export async function archiveChapter(id: string) {
  const admin = await getCurrentAdmin()

  await db
    .update(chapters)
    .set({ archivedAt: new Date() })
    .where(eq(chapters.id, id))

  await logAudit(admin.id, "delete", "chapter", id)

  revalidatePath("/admin/chapters")
  revalidatePath("/admin")
  return { success: true }
}

export async function restoreChapter(id: string) {
  const admin = await getCurrentAdmin()

  await db
    .update(chapters)
    .set({ archivedAt: null })
    .where(eq(chapters.id, id))

  await logAudit(admin.id, "restore", "chapter", id)

  revalidatePath("/admin/chapters")
  revalidatePath("/admin")
  return { success: true }
}

export async function reorderChapters(orderedIds: string[]) {
  const admin = await getCurrentAdmin()

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(chapters)
        .set({ sortOrder: i })
        .where(eq(chapters.id, orderedIds[i]))
    }
  })

  await logAudit(admin.id, "reorder", "chapter", orderedIds[0], {
    newOrder: orderedIds,
  })

  revalidatePath("/admin/chapters")
  return { success: true }
}
