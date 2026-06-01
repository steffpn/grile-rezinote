"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { chapters, questions, options } from "@/lib/db/schema"
import {
  eq,
  isNull,
  isNotNull,
  ilike,
  and,
  or,
  asc,
  desc,
  count,
  inArray,
  type SQL,
} from "drizzle-orm"
import { questionSchema, type QuestionInput } from "@/lib/validations/question"
import { getCurrentAdmin, logAudit } from "@/lib/db/queries/admin"

export type QuestionSortBy =
  | "createdAt"
  | "updatedAt"
  | "chapter"
  | "subchapter"
  | "type"
  | "sourceBook"
  | "text"

export type SortDir = "asc" | "desc"

export interface QuestionFilters {
  chapterId?: string
  subchapter?: string
  type?: "CS" | "CM"
  sourceBook?: string
  search?: string
  status?: "active" | "archived" | "all"
  // Independent of status: filter by whether the row was retired via the
  // bulk "review & retire" action (reviewedAt set) or not.
  reviewed?: "yes" | "no"
  sortBy?: QuestionSortBy
  sortDir?: SortDir
  page?: number
  pageSize?: number
}

function buildWhereClause(filters: QuestionFilters): SQL | undefined {
  const conds: SQL[] = []
  const status = filters.status ?? "active"
  if (status === "active") conds.push(isNull(questions.archivedAt))
  if (status === "archived") conds.push(isNotNull(questions.archivedAt))
  if (filters.reviewed === "yes") conds.push(isNotNull(questions.reviewedAt))
  if (filters.reviewed === "no") conds.push(isNull(questions.reviewedAt))
  if (filters.chapterId) conds.push(eq(questions.chapterId, filters.chapterId))
  if (filters.subchapter)
    conds.push(eq(questions.subchapter, filters.subchapter))
  if (filters.type) conds.push(eq(questions.type, filters.type))
  if (filters.sourceBook)
    conds.push(eq(questions.sourceBook, filters.sourceBook))
  if (filters.search) {
    const term = `%${filters.search}%`
    const orExpr = or(
      ilike(questions.text, term),
      ilike(questions.subchapter, term),
      ilike(questions.sourceBook, term),
    )
    if (orExpr) conds.push(orExpr)
  }
  if (conds.length === 0) return undefined
  return and(...conds)
}

function buildOrderBy(sortBy: QuestionSortBy, dir: SortDir) {
  const fn = dir === "asc" ? asc : desc
  switch (sortBy) {
    case "chapter":
      return [fn(chapters.sortOrder), asc(questions.createdAt)]
    case "subchapter":
      return [fn(questions.subchapter), asc(questions.createdAt)]
    case "type":
      return [fn(questions.type), desc(questions.createdAt)]
    case "sourceBook":
      return [fn(questions.sourceBook), asc(questions.createdAt)]
    case "text":
      return [fn(questions.text)]
    case "updatedAt":
      return [fn(questions.updatedAt)]
    case "createdAt":
    default:
      return [fn(questions.createdAt)]
  }
}

export async function getQuestions(filters: QuestionFilters = {}) {
  await getCurrentAdmin()

  const {
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortDir = "desc",
  } = filters
  const offset = (page - 1) * pageSize

  const whereClause = buildWhereClause(filters)

  const questionList = await db
    .select({
      id: questions.id,
      text: questions.text,
      type: questions.type,
      chapterId: questions.chapterId,
      chapterName: chapters.name,
      chapterSortOrder: chapters.sortOrder,
      subchapter: questions.subchapter,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
      archivedAt: questions.archivedAt,
      reviewedAt: questions.reviewedAt,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
    })
    .from(questions)
    .leftJoin(chapters, eq(questions.chapterId, chapters.id))
    .where(whereClause)
    .orderBy(...buildOrderBy(sortBy, sortDir))
    .limit(pageSize)
    .offset(offset)

  const [totalResult] = await db
    .select({ value: count() })
    .from(questions)
    .where(whereClause)

  return {
    questions: questionList,
    total: totalResult?.value ?? 0,
    page,
    pageSize,
  }
}

/**
 * Distinct values for the subchapter filter dropdown. Scoped by chapter
 * when one is selected to keep the list tight; otherwise all subchapters
 * across active chapters.
 */
export async function getDistinctSubchapters(
  chapterId?: string,
): Promise<string[]> {
  await getCurrentAdmin()

  const conds: SQL[] = [
    isNull(questions.archivedAt),
    isNotNull(questions.subchapter),
  ]
  if (chapterId) conds.push(eq(questions.chapterId, chapterId))

  const rows = await db
    .selectDistinct({ subchapter: questions.subchapter })
    .from(questions)
    .where(and(...conds))
    .orderBy(asc(questions.subchapter))

  return rows
    .map((r) => r.subchapter)
    .filter((s): s is string => !!s && s.length > 0)
}

/**
 * Distinct source-book values used across active questions.
 */
export async function getDistinctSourceBooks(): Promise<string[]> {
  await getCurrentAdmin()

  const rows = await db
    .selectDistinct({ sourceBook: questions.sourceBook })
    .from(questions)
    .where(and(isNull(questions.archivedAt), isNotNull(questions.sourceBook)))
    .orderBy(asc(questions.sourceBook))

  return rows
    .map((r) => r.sourceBook)
    .filter((s): s is string => !!s && s.length > 0)
}

/**
 * Fetch options for a single question — used by the inline preview row
 * in the admin table (lazy-loaded so the list query stays light).
 */
export async function getQuestionOptions(id: string) {
  await getCurrentAdmin()

  return db
    .select({
      id: options.id,
      label: options.label,
      text: options.text,
      isCorrect: options.isCorrect,
    })
    .from(options)
    .where(eq(options.questionId, id))
    .orderBy(asc(options.label))
}

export async function getQuestionById(id: string) {
  await getCurrentAdmin()

  const [question] = await db
    .select({
      id: questions.id,
      chapterId: questions.chapterId,
      subchapter: questions.subchapter,
      text: questions.text,
      type: questions.type,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
      archivedAt: questions.archivedAt,
    })
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1)

  if (!question || question.archivedAt) return null

  const questionOptions = await db
    .select({
      id: options.id,
      label: options.label,
      text: options.text,
      isCorrect: options.isCorrect,
    })
    .from(options)
    .where(eq(options.questionId, id))
    .orderBy(asc(options.label))

  return { ...question, options: questionOptions }
}

export async function createQuestion(data: QuestionInput) {
  const admin = await getCurrentAdmin()

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const result = await db.transaction(async (tx) => {
    const [question] = await tx
      .insert(questions)
      .values({
        chapterId: parsed.data.chapterId,
        text: parsed.data.text,
        type: parsed.data.type,
        sourceBook: parsed.data.sourceBook || null,
        sourcePage: parsed.data.sourcePage || null,
      })
      .returning({ id: questions.id })

    await tx.insert(options).values(
      parsed.data.options.map((opt, i) => ({
        questionId: question.id,
        label: String.fromCharCode(65 + i), // A, B, C, D, E
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    )

    return question
  })

  await logAudit(admin.id, "create", "question", result.id, {
    chapterId: parsed.data.chapterId,
    type: parsed.data.type,
    text: parsed.data.text.substring(0, 100),
  })

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true, id: result.id }
}

export async function updateQuestion(id: string, data: QuestionInput) {
  const admin = await getCurrentAdmin()

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // Fetch old for audit
  const [old] = await db
    .select({ text: questions.text, type: questions.type })
    .from(questions)
    .where(eq(questions.id, id))

  await db.transaction(async (tx) => {
    await tx
      .update(questions)
      .set({
        chapterId: parsed.data.chapterId,
        text: parsed.data.text,
        type: parsed.data.type,
        sourceBook: parsed.data.sourceBook || null,
        sourcePage: parsed.data.sourcePage || null,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))

    // Delete old options and re-insert (simpler than diffing individual option updates)
    await tx.delete(options).where(eq(options.questionId, id))

    await tx.insert(options).values(
      parsed.data.options.map((opt, i) => ({
        questionId: id,
        label: String.fromCharCode(65 + i),
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    )
  })

  await logAudit(admin.id, "update", "question", id, {
    text: { old: old?.text?.substring(0, 100), new: parsed.data.text.substring(0, 100) },
    type: { old: old?.type, new: parsed.data.type },
  })

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true }
}

export async function archiveQuestion(id: string) {
  const admin = await getCurrentAdmin()

  await db
    .update(questions)
    .set({ archivedAt: new Date() })
    .where(eq(questions.id, id))

  await logAudit(admin.id, "delete", "question", id)

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true }
}

export async function restoreQuestion(id: string) {
  const admin = await getCurrentAdmin()

  // Clear reviewedAt too: restoring fully un-retires the question, so it
  // becomes eligible for user tests again and loses the "revizuită" badge.
  // Keeps the reviewed ⟹ archived invariant (never reviewed-but-active).
  await db
    .update(questions)
    .set({ archivedAt: null, reviewedAt: null })
    .where(eq(questions.id, id))

  await logAudit(admin.id, "restore", "question", id)

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true }
}

const MAX_BULK = 1000

/**
 * Soft-archive many questions at once.
 */
export async function bulkArchiveQuestions(ids: string[]) {
  const admin = await getCurrentAdmin()
  if (ids.length === 0) return { success: true, count: 0 }
  if (ids.length > MAX_BULK)
    return { error: `Maxim ${MAX_BULK} întrebări per acțiune.` }

  await db
    .update(questions)
    .set({ archivedAt: new Date() })
    .where(inArray(questions.id, ids))

  for (const id of ids) {
    await logAudit(admin.id, "delete", "question", id, { source: "bulk" })
  }

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true, count: ids.length }
}

// Sentinel entity id for audit entries describing a bulk operation over many
// rows rather than one entity (audit_logs.entity_id is NOT NULL).
const BULK_AUDIT_ENTITY_ID = "00000000-0000-0000-0000-000000000000"

/**
 * Soft-archive AND mark-reviewed every ACTIVE question matching the given
 * filters (chapter / subchapter / type / source / search). With no filters
 * this retires the entire active bank. Unlike bulkArchiveQuestions there is no
 * id list and no 1000 cap — it targets whatever the admin is currently
 * filtering.
 *
 * Sets archivedAt + reviewedAt together (reviewed ⟹ archived), so the rows
 * drop out of every practice/simulation pool immediately while staying intact
 * for historical stats and already-taken attempts (which load by snapshot).
 * Writes a single summary audit entry, not one per row.
 */
export async function bulkArchiveAllActiveQuestions(
  filters: QuestionFilters = {},
) {
  const admin = await getCurrentAdmin()

  // Always scope to active rows; reuse the table's filter builder so the
  // affected set matches exactly what the admin sees.
  const where =
    buildWhereClause({ ...filters, status: "active" }) ??
    isNull(questions.archivedAt)

  const now = new Date()
  const updated = await db
    .update(questions)
    .set({ archivedAt: now, reviewedAt: now })
    .where(where)
    .returning({ id: questions.id })

  await logAudit(admin.id, "delete", "question", BULK_AUDIT_ENTITY_ID, {
    source: "bulk_review_all",
    count: updated.length,
    filters: {
      chapterId: filters.chapterId,
      subchapter: filters.subchapter,
      type: filters.type,
      sourceBook: filters.sourceBook,
      search: filters.search,
      reviewed: filters.reviewed,
    },
  })

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true as const, count: updated.length }
}

export async function bulkRestoreQuestions(ids: string[]) {
  const admin = await getCurrentAdmin()
  if (ids.length === 0) return { success: true, count: 0 }
  if (ids.length > MAX_BULK)
    return { error: `Maxim ${MAX_BULK} întrebări per acțiune.` }

  await db
    .update(questions)
    .set({ archivedAt: null, reviewedAt: null })
    .where(inArray(questions.id, ids))

  for (const id of ids) {
    await logAudit(admin.id, "restore", "question", id, { source: "bulk" })
  }

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true, count: ids.length }
}

/**
 * Move many questions to a different chapter at once.
 */
export async function bulkMoveQuestions(ids: string[], chapterId: string) {
  const admin = await getCurrentAdmin()
  if (ids.length === 0) return { success: true, count: 0 }
  if (ids.length > MAX_BULK)
    return { error: `Maxim ${MAX_BULK} întrebări per acțiune.` }

  const [target] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), isNull(chapters.archivedAt)))
    .limit(1)
  if (!target) return { error: "Capitolul țintă nu există sau e arhivat." }

  await db
    .update(questions)
    .set({ chapterId, updatedAt: new Date() })
    .where(inArray(questions.id, ids))

  for (const id of ids) {
    await logAudit(admin.id, "update", "question", id, {
      source: "bulk",
      chapterId,
    })
  }

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true, count: ids.length }
}

/**
 * Replace the subchapter on many questions at once (empty string clears).
 */
export async function bulkSetSubchapter(ids: string[], subchapter: string) {
  const admin = await getCurrentAdmin()
  if (ids.length === 0) return { success: true, count: 0 }
  if (ids.length > MAX_BULK)
    return { error: `Maxim ${MAX_BULK} întrebări per acțiune.` }

  await db
    .update(questions)
    .set({ subchapter: subchapter || null, updatedAt: new Date() })
    .where(inArray(questions.id, ids))

  for (const id of ids) {
    await logAudit(admin.id, "update", "question", id, {
      source: "bulk",
      subchapter,
    })
  }

  revalidatePath("/admin/questions")
  revalidatePath("/admin")
  return { success: true, count: ids.length }
}

export async function getChaptersForSelect() {
  await getCurrentAdmin()

  return db
    .select({ id: chapters.id, name: chapters.name })
    .from(chapters)
    .where(isNull(chapters.archivedAt))
    .orderBy(asc(chapters.sortOrder))
}
