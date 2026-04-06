"use server"

import { db } from "@/lib/db"
import { chapters, questions, options } from "@/lib/db/schema"
import { eq, isNull, asc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin, logAudit } from "@/lib/db/queries/admin"
import {
  importRowSchema,
  type ImportRow,
  type ImportResult,
} from "@/lib/validations/import"
import ExcelJS from "exceljs"

const BATCH_SIZE = 50
const MAX_IMPORT_ROWS = 5000

export async function importQuestions(
  rows: ImportRow[]
): Promise<ImportResult> {
  const admin = await getCurrentAdmin()

  // Hard cap on payload size to prevent OOM/DoS via huge imports.
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      imported: 0,
      updated: 0,
      errors: [
        {
          row: 0,
          message: `Maxim ${MAX_IMPORT_ROWS} randuri per import (primit ${rows.length}).`,
        },
      ],
    }
  }

  const errors: { row: number; message: string }[] = []
  const validRows: Array<{ data: ImportRow; rowNum: number }> = []

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const parsed = importRowSchema.safeParse(rows[i])
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

  // Resolve chapter names to IDs
  const allChapters = await db
    .select({ id: chapters.id, name: chapters.name })
    .from(chapters)
    .where(isNull(chapters.archivedAt))

  const chapterMap = new Map(
    allChapters.map((c) => [c.name.toLowerCase(), c.id])
  )

  const resolvedRows: Array<{
    data: ImportRow
    rowNum: number
    chapterId: string
  }> = []

  for (const { data, rowNum } of validRows) {
    const chapterId = chapterMap.get(data.chapter_name.toLowerCase())
    if (!chapterId) {
      errors.push({
        row: rowNum,
        message: `Capitol necunoscut: "${data.chapter_name}"`,
      })
    } else {
      resolvedRows.push({ data, rowNum, chapterId })
    }
  }

  let imported = 0
  let updated = 0

  // Process in batches
  for (let i = 0; i < resolvedRows.length; i += BATCH_SIZE) {
    const batch = resolvedRows.slice(i, i + BATCH_SIZE)

    await db.transaction(async (tx) => {
      for (const { data, chapterId } of batch) {
        const correctAnswers = data.correct_answers
          .split(",")
          .map((a) => a.trim().toUpperCase())

        const optionsData = [
          { label: "A", text: data.option_a },
          { label: "B", text: data.option_b },
          { label: "C", text: data.option_c },
          { label: "D", text: data.option_d },
          { label: "E", text: data.option_e },
        ].map((opt) => ({
          ...opt,
          isCorrect: correctAnswers.includes(opt.label),
        }))

        if (data.id) {
          // Try to update existing question
          const [existing] = await tx
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.id, data.id))
            .limit(1)

          if (existing) {
            // Update question
            await tx
              .update(questions)
              .set({
                chapterId,
                text: data.question_text,
                type: data.type,
                sourceBook: data.source_book || null,
                sourcePage: data.source_page || null,
                updatedAt: new Date(),
                archivedAt: null, // Restore if archived
              })
              .where(eq(questions.id, data.id))

            // Replace options
            await tx.delete(options).where(eq(options.questionId, data.id))
            await tx.insert(options).values(
              optionsData.map((opt) => ({
                questionId: data.id!,
                label: opt.label,
                text: opt.text,
                isCorrect: opt.isCorrect,
              }))
            )

            await logAudit(admin.id, "update", "question", data.id, {
              source: "import",
            })
            updated++
            continue
          }
        }

        // Create new question
        const [newQuestion] = await tx
          .insert(questions)
          .values({
            chapterId,
            text: data.question_text,
            type: data.type,
            sourceBook: data.source_book || null,
            sourcePage: data.source_page || null,
          })
          .returning({ id: questions.id })

        await tx.insert(options).values(
          optionsData.map((opt) => ({
            questionId: newQuestion.id,
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
          }))
        )

        await logAudit(admin.id, "create", "question", newQuestion.id, {
          source: "import",
        })
        imported++
      }
    })
  }

  revalidatePath("/admin/questions")
  revalidatePath("/admin")

  return { imported, updated, errors }
}

interface ExportQuestion {
  id: string
  chapter_name: string
  question_text: string
  type: "CS" | "CM"
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answers: string
  source_book: string
  source_page: string
}

async function getExportData(
  chapterId?: string
): Promise<ExportQuestion[]> {
  await getCurrentAdmin()

  const conditions = [isNull(questions.archivedAt)]
  if (chapterId) conditions.push(eq(questions.chapterId, chapterId))

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0]

  const questionList = await db
    .select({
      id: questions.id,
      text: questions.text,
      type: questions.type,
      chapterId: questions.chapterId,
      chapterName: chapters.name,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
    })
    .from(questions)
    .leftJoin(chapters, eq(questions.chapterId, chapters.id))
    .where(whereClause)
    .orderBy(asc(chapters.sortOrder), asc(questions.createdAt))

  const result: ExportQuestion[] = []

  for (const q of questionList) {
    const opts = await db
      .select({ label: options.label, text: options.text, isCorrect: options.isCorrect })
      .from(options)
      .where(eq(options.questionId, q.id))
      .orderBy(asc(options.label))

    const optMap = new Map(opts.map((o) => [o.label, o]))
    const correctLabels = opts
      .filter((o) => o.isCorrect)
      .map((o) => o.label)
      .join(",")

    result.push({
      id: q.id,
      chapter_name: q.chapterName ?? "",
      question_text: q.text,
      type: q.type,
      option_a: optMap.get("A")?.text ?? "",
      option_b: optMap.get("B")?.text ?? "",
      option_c: optMap.get("C")?.text ?? "",
      option_d: optMap.get("D")?.text ?? "",
      option_e: optMap.get("E")?.text ?? "",
      correct_answers: correctLabels,
      source_book: q.sourceBook ?? "",
      source_page: q.sourcePage ?? "",
    })
  }

  return result
}

export async function exportQuestionsCSV(chapterId?: string) {
  return getExportData(chapterId)
}

export async function exportQuestionsExcel(
  chapterId?: string
): Promise<string> {
  const data = await getExportData(chapterId)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Intrebari")

  sheet.columns = [
    { header: "id", key: "id", width: 38 },
    { header: "chapter_name", key: "chapter_name", width: 25 },
    { header: "question_text", key: "question_text", width: 60 },
    { header: "type", key: "type", width: 8 },
    { header: "option_a", key: "option_a", width: 30 },
    { header: "option_b", key: "option_b", width: 30 },
    { header: "option_c", key: "option_c", width: 30 },
    { header: "option_d", key: "option_d", width: 30 },
    { header: "option_e", key: "option_e", width: 30 },
    { header: "correct_answers", key: "correct_answers", width: 15 },
    { header: "source_book", key: "source_book", width: 25 },
    { header: "source_page", key: "source_page", width: 10 },
  ]

  // Bold header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.commit()

  for (const row of data) {
    sheet.addRow(row)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  // Return as base64 for client download
  return Buffer.from(buffer).toString("base64")
}
