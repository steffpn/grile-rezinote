"use server"

import { db } from "@/lib/db"
import { chapters, questions, options } from "@/lib/db/schema"
import { eq, isNull, asc, and, or, ilike, inArray, type SQL } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin, logAudit } from "@/lib/db/queries/admin"
import {
  importRowSchema,
  IMPORT_COLUMNS,
  type ImportColumn,
  type ImportRow,
  type ImportResult,
} from "@/lib/validations/import"
import ExcelJS from "exceljs"

const BATCH_SIZE = 50
const MAX_IMPORT_ROWS = 5000

export async function importQuestions(
  rows: ImportRow[],
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
          message: `Maxim ${MAX_IMPORT_ROWS} rânduri per import (primit ${rows.length}).`,
        },
      ],
    }
  }

  const errors: { row: number; message: string; column?: string }[] = []
  const validRows: Array<{ data: ImportRow; rowNum: number }> = []

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const parsed = importRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      errors.push({
        row: i + 2, // +2 for 1-indexed + header row
        message: issue?.message ?? "Eroare de validare",
        column: issue?.path?.[0] ? String(issue.path[0]) : undefined,
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
    allChapters.map((c) => [c.name.toLowerCase(), c.id]),
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
        column: "chapter_name",
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
          .split(/[,;\s]+/)
          .map((a) => a.trim().toUpperCase())
          .filter(Boolean)

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
                subchapter: data.subchapter || null,
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
              })),
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
            subchapter: data.subchapter || null,
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
          })),
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
  subchapter: string
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

export interface ExportFilters {
  chapterId?: string
  subchapter?: string
  type?: "CS" | "CM"
  sourceBook?: string
  search?: string
  includeArchived?: boolean
  /** When set, all other filters are ignored and only these questions ship. */
  ids?: string[]
}

async function getExportData(
  filters: ExportFilters = {},
): Promise<ExportQuestion[]> {
  await getCurrentAdmin()

  const conditions: SQL[] = []
  if (filters.ids && filters.ids.length > 0) {
    conditions.push(inArray(questions.id, filters.ids))
  } else {
    if (!filters.includeArchived) conditions.push(isNull(questions.archivedAt))
    if (filters.chapterId)
      conditions.push(eq(questions.chapterId, filters.chapterId))
    if (filters.subchapter)
      conditions.push(eq(questions.subchapter, filters.subchapter))
    if (filters.type) conditions.push(eq(questions.type, filters.type))
    if (filters.sourceBook)
      conditions.push(eq(questions.sourceBook, filters.sourceBook))
    if (filters.search) {
      const term = `%${filters.search}%`
      const orExpr = or(
        ilike(questions.text, term),
        ilike(questions.subchapter, term),
        ilike(questions.sourceBook, term),
      )
      if (orExpr) conditions.push(orExpr)
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const questionList = await db
    .select({
      id: questions.id,
      text: questions.text,
      type: questions.type,
      chapterId: questions.chapterId,
      chapterName: chapters.name,
      subchapter: questions.subchapter,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
    })
    .from(questions)
    .leftJoin(chapters, eq(questions.chapterId, chapters.id))
    .where(whereClause)
    .orderBy(
      asc(chapters.sortOrder),
      asc(questions.subchapter),
      asc(questions.createdAt),
    )

  if (questionList.length === 0) return []

  // Batch-fetch all options for the selected question IDs in ONE query
  // instead of N+1 round-trips per question — much faster for big exports.
  const ids = questionList.map((q) => q.id)
  const allOpts = await db
    .select({
      questionId: options.questionId,
      label: options.label,
      text: options.text,
      isCorrect: options.isCorrect,
    })
    .from(options)
    .where(inArray(options.questionId, ids))
    .orderBy(asc(options.label))

  const optsByQ = new Map<string, typeof allOpts>()
  for (const opt of allOpts) {
    const bucket = optsByQ.get(opt.questionId) ?? []
    bucket.push(opt)
    optsByQ.set(opt.questionId, bucket)
  }

  const result: ExportQuestion[] = []
  for (const q of questionList) {
    const opts = optsByQ.get(q.id) ?? []
    const optMap = new Map(opts.map((o) => [o.label, o]))
    const correctLabels = opts
      .filter((o) => o.isCorrect)
      .map((o) => o.label)
      .join(",")

    result.push({
      id: q.id,
      chapter_name: q.chapterName ?? "",
      subchapter: q.subchapter ?? "",
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

function pickColumns(
  rows: ExportQuestion[],
  cols: readonly ImportColumn[],
): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {}
    for (const c of cols) out[c] = (r as unknown as Record<string, unknown>)[c]
    return out
  })
}

export interface ExportOptions extends ExportFilters {
  /** Subset of IMPORT_COLUMNS to include. Defaults to all. */
  columns?: ImportColumn[]
}

export async function exportQuestionsCSV(options: ExportOptions = {}) {
  const data = await getExportData(options)
  const cols = options.columns?.length ? options.columns : (IMPORT_COLUMNS as unknown as ImportColumn[])
  return pickColumns(data, cols)
}

export async function exportQuestionsExcel(
  options: ExportOptions = {},
): Promise<string> {
  const data = await getExportData(options)
  const cols = options.columns?.length ? options.columns : (IMPORT_COLUMNS as unknown as ImportColumn[])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Întrebări")

  const widthByCol: Record<ImportColumn, number> = {
    id: 38,
    chapter_name: 25,
    subchapter: 22,
    question_text: 60,
    type: 8,
    option_a: 30,
    option_b: 30,
    option_c: 30,
    option_d: 30,
    option_e: 30,
    correct_answers: 15,
    source_book: 25,
    source_page: 10,
  }

  sheet.columns = cols.map((key) => ({
    header: key,
    key,
    width: widthByCol[key] ?? 20,
  }))

  // Bold header row + freeze
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.commit()
  sheet.views = [{ state: "frozen", ySplit: 1 }]

  for (const row of data) {
    sheet.addRow(row)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer).toString("base64")
}

/**
 * Generate a rich XLSX template: bold/frozen header, column widths, a
 * "Type" data-validation list (CS/CM), three example rows, and a second
 * "Instrucțiuni" sheet with a quick field reference.
 */
export async function generateImportTemplate(): Promise<string> {
  await getCurrentAdmin()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "grile-ReziNOTE admin"
  workbook.created = new Date()

  // ── Sheet 1: Întrebări ──────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Întrebări")

  const cols: { key: ImportColumn; width: number }[] = [
    { key: "id", width: 38 },
    { key: "chapter_name", width: 25 },
    { key: "subchapter", width: 22 },
    { key: "question_text", width: 60 },
    { key: "type", width: 8 },
    { key: "option_a", width: 30 },
    { key: "option_b", width: 30 },
    { key: "option_c", width: 30 },
    { key: "option_d", width: 30 },
    { key: "option_e", width: 30 },
    { key: "correct_answers", width: 15 },
    { key: "source_book", width: 25 },
    { key: "source_page", width: 10 },
  ]

  sheet.columns = cols.map((c) => ({ header: c.key, key: c.key, width: c.width }))

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  }
  headerRow.alignment = { vertical: "middle", horizontal: "left" }
  headerRow.height = 22
  headerRow.commit()

  sheet.views = [{ state: "frozen", ySplit: 1 }]

  // Example rows
  const examples = [
    {
      id: "",
      chapter_name: "Anatomie",
      subchapter: "Oase craniene",
      question_text: "Care sunt oasele craniului?",
      type: "CM",
      option_a: "Frontal",
      option_b: "Parietal",
      option_c: "Temporal",
      option_d: "Occipital",
      option_e: "Sfenoid",
      correct_answers: "A,B,C,D,E",
      source_book: "Atlas Anatomie",
      source_page: "42",
    },
    {
      id: "",
      chapter_name: "Endodonție",
      subchapter: "Pulpitele acute",
      question_text: "Pulpita acută seroasă este caracterizată prin:",
      type: "CS",
      option_a: "Durere intermitentă, calmată de cald",
      option_b: "Durere continuă, exacerbată de cald",
      option_c: "Absența durerii",
      option_d: "Durere doar la masticație",
      option_e: "Sângerare spontană",
      correct_answers: "B",
      source_book: "Fontana - Endodonție",
      source_page: "118",
    },
    {
      id: "",
      chapter_name: "Parodontologie",
      subchapter: "Gingivite",
      question_text: "Gingivita cronică se caracterizează prin:",
      type: "CM",
      option_a: "Eritem gingival",
      option_b: "Sângerare la sondaj",
      option_c: "Pierdere de atașament",
      option_d: "Mobilitate dentară marcată",
      option_e: "Edem gingival",
      correct_answers: "A,B,E",
      source_book: "Zetu - Parodontologie",
      source_page: "55",
    },
  ]

  for (const ex of examples) {
    sheet.addRow(ex)
  }

  // Style example rows lightly so admins know they can delete
  for (let i = 2; i <= 4; i++) {
    const r = sheet.getRow(i)
    r.font = { italic: true, color: { argb: "FF6B7280" } }
    r.commit()
  }

  // Data validation for `type` column (5th column, key="type")
  const typeColIndex = cols.findIndex((c) => c.key === "type") + 1
  if (typeColIndex > 0) {
    const colLetter = sheet.getColumn(typeColIndex).letter
    // Apply to rows 2..1000 (admins rarely paste more than that at once)
    for (let r = 2; r <= 1000; r++) {
      sheet.getCell(`${colLetter}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"CS,CM"'],
        showErrorMessage: true,
        errorStyle: "stop",
        errorTitle: "Tip invalid",
        error: 'Folosește "CS" sau "CM"',
      }
    }
  }

  // ── Sheet 2: Instrucțiuni ──────────────────────────────────────────
  const help = workbook.addWorksheet("Instrucțiuni")
  help.columns = [
    { header: "Coloană", key: "col", width: 22 },
    { header: "Obligatoriu", key: "req", width: 13 },
    { header: "Format / exemplu", key: "fmt", width: 50 },
  ]
  const helpHeader = help.getRow(1)
  helpHeader.font = { bold: true }
  helpHeader.commit()

  const helpRows = [
    {
      col: "id",
      req: "nu",
      fmt: "UUID existent → actualizează întrebarea. Gol → creează una nouă.",
    },
    {
      col: "chapter_name",
      req: "DA",
      fmt: "Numele exact al unui capitol existent (case-insensitive). Aliase acceptate: Materie.",
    },
    {
      col: "subchapter",
      req: "nu",
      fmt: "Text liber, ex: \"Pulpitele acute\". Aliase: Capitol, Subcapitol.",
    },
    {
      col: "question_text",
      req: "DA",
      fmt: "Enunțul întrebării. Aliase: Enunț, Enunt, Întrebare.",
    },
    {
      col: "type",
      req: "DA",
      fmt: "CS = complement simplu (1 răspuns), CM = complement multiplu (≥2). Tradus auto din A→CS, B→CM.",
    },
    {
      col: "option_a … option_e",
      req: "DA",
      fmt: "Toate cele 5 opțiuni sunt obligatorii. Aliase: A, B, C, D, E.",
    },
    {
      col: "correct_answers",
      req: "DA",
      fmt: "Litere separate prin virgulă, ex: A,C,E. Aliase: Răspuns, Răspunsuri.",
    },
    {
      col: "source_book",
      req: "nu",
      fmt: "Cartea sursă (ex: \"Atlas Anatomie\"). Aliase: Carte, Sursă.",
    },
    {
      col: "source_page",
      req: "nu",
      fmt: "Pagină ca text, ex: \"42\" sau \"117-119\". Aliase: Pagină.",
    },
  ]
  for (const r of helpRows) help.addRow(r)
  help.getColumn("req").alignment = { horizontal: "center" }

  // Notes block under the table
  const noteStart = helpRows.length + 3
  help.getCell(`A${noteStart}`).value = "Note"
  help.getCell(`A${noteStart}`).font = { bold: true }
  const notes = [
    "• Prima linie din \"Întrebări\" trebuie să rămână header.",
    "• Coloanele pot fi în orice ordine; importatorul recunoaște numele.",
    "• Maxim 5000 rânduri / import.",
    "• Dacă pui un ID existent, întrebarea este actualizată și opțiunile rescrise.",
    "• Dacă lași ID-ul gol, se creează o întrebare nouă.",
  ]
  for (let i = 0; i < notes.length; i++) {
    help.getCell(`A${noteStart + 1 + i}`).value = notes[i]
    help.mergeCells(`A${noteStart + 1 + i}:C${noteStart + 1 + i}`)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer).toString("base64")
}
