/**
 * Wipe-and-replace import for grile from an .xlsx file.
 *
 * Mapping (xlsx → DB):
 *   source_book   → chapters.name        (capitolul)
 *   chapter_name  → questions.subchapter (subcapitolul)
 *   question_text → questions.text
 *   type          → questions.type        (A → CS, B → CM)
 *   option_a..e   → options.text + label
 *   correct_answers (e.g. "A,C") → options.is_correct
 *   source_page   → questions.source_page
 *
 * What it deletes (in order, before importing):
 *   1. attempt_answers
 *   2. attempts
 *   3. options
 *   4. questions
 *   5. chapters
 *
 * USAGE
 *   node scripts/import-xlsx-grile.mjs <xlsx-path>            # uses DATABASE_URL from env
 *   node scripts/import-xlsx-grile.mjs <xlsx-path> --dry-run  # parse only, no DB writes
 *   DATABASE_URL=postgres://... node scripts/import-xlsx-grile.mjs <xlsx-path>
 *
 * Requires: xlsx + postgres packages (already in node_modules via deps).
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import XLSX from "xlsx"
import postgres from "postgres"
import { config as loadEnv } from "dotenv"

// Load .env / .env.local so DATABASE_URL is available when run via plain `node`.
loadEnv({ path: ".env.local" })
loadEnv({ path: ".env" })

const XLSX_PATH = process.argv[2]
const DRY_RUN = process.argv.includes("--dry-run")
const DB_URL = process.env.DATABASE_URL

if (!XLSX_PATH) {
  console.error("Usage: node scripts/import-xlsx-grile.mjs <xlsx-path> [--dry-run]")
  process.exit(1)
}
if (!DRY_RUN && !DB_URL) {
  console.error("DATABASE_URL is not set.")
  process.exit(1)
}

const REQUIRED_COLS = [
  "chapter_name",
  "question_text",
  "type",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_answers",
  "source_book",
  "source_page",
]

function normalizeStr(v) {
  if (v === null || v === undefined) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

/** Canonicalize a chapter name: trim, collapse whitespace, Title Case. */
function canonChapter(v) {
  const s = normalizeStr(v)
  if (!s) return ""
  return s
    .toLocaleLowerCase("ro-RO")
    .split(" ")
    .map((w) => (w ? w[0].toLocaleUpperCase("ro-RO") + w.slice(1) : w))
    .join(" ")
}

function parseTypeToCode(typeRaw) {
  const t = normalizeStr(typeRaw).toUpperCase()
  if (t === "A") return "CS"
  if (t === "B") return "CM"
  // tolerate already-correct values
  if (t === "CS" || t === "CM") return t
  return null
}

function parseCorrectAnswers(raw) {
  if (!raw) return new Set()
  return new Set(
    String(raw)
      .toUpperCase()
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

// ─── Read and parse xlsx ───────────────────────────────────────────────────
console.log(`📖 Reading ${XLSX_PATH}...`)
const fileBuf = readFileSync(resolve(XLSX_PATH))
const wb = XLSX.read(fileBuf, { type: "buffer" })
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })

if (rows.length === 0) {
  console.error("❌ No rows found in the sheet.")
  process.exit(1)
}

const missing = REQUIRED_COLS.filter((c) => !(c in rows[0]))
if (missing.length > 0) {
  console.error(`❌ Missing columns: ${missing.join(", ")}`)
  console.error(`   Found columns: ${Object.keys(rows[0]).join(", ")}`)
  process.exit(1)
}

console.log(`   Found ${rows.length} raw rows.`)

// ─── Validate + group ──────────────────────────────────────────────────────
const errors = []
const validRows = []
const chaptersByName = new Map() // name -> sortOrder index

for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const lineNo = i + 2 // 1-indexed + header

  const sourceBook = canonChapter(r.source_book)
  const subchapter = normalizeStr(r.chapter_name)
  const questionText = normalizeStr(r.question_text)
  const typeCode = parseTypeToCode(r.type)
  const correctSet = parseCorrectAnswers(r.correct_answers)
  const sourcePage = normalizeStr(r.source_page)

  if (!sourceBook) {
    errors.push(`row ${lineNo}: missing source_book (capitol)`)
    continue
  }
  if (!questionText) {
    errors.push(`row ${lineNo}: missing question_text`)
    continue
  }
  if (!typeCode) {
    errors.push(`row ${lineNo}: invalid type "${r.type}" (expected A/B/CS/CM)`)
    continue
  }

  const opts = [
    { label: "A", text: normalizeStr(r.option_a) },
    { label: "B", text: normalizeStr(r.option_b) },
    { label: "C", text: normalizeStr(r.option_c) },
    { label: "D", text: normalizeStr(r.option_d) },
    { label: "E", text: normalizeStr(r.option_e) },
  ]
  if (opts.some((o) => !o.text)) {
    errors.push(`row ${lineNo}: empty option(s)`)
    continue
  }
  if (correctSet.size === 0) {
    errors.push(`row ${lineNo}: no correct_answers`)
    continue
  }
  for (const c of correctSet) {
    if (!["A", "B", "C", "D", "E"].includes(c)) {
      errors.push(`row ${lineNo}: invalid correct answer "${c}"`)
    }
  }
  if (typeCode === "CS" && correctSet.size !== 1) {
    errors.push(
      `row ${lineNo}: type CS must have exactly 1 correct answer (found ${correctSet.size})`
    )
  }

  if (!chaptersByName.has(sourceBook)) {
    chaptersByName.set(sourceBook, chaptersByName.size)
  }

  validRows.push({
    sourceBook,
    subchapter: subchapter || null,
    questionText,
    typeCode,
    options: opts.map((o) => ({ ...o, isCorrect: correctSet.has(o.label) })),
    sourcePage: sourcePage || null,
  })
}

console.log(`   ✓ ${validRows.length} valid rows`)
if (errors.length > 0) {
  console.log(`   ⚠ ${errors.length} skipped:`)
  for (const e of errors.slice(0, 20)) console.log(`     - ${e}`)
  if (errors.length > 20) console.log(`     ... and ${errors.length - 20} more`)
}
console.log(`   📚 ${chaptersByName.size} unique chapters`)
for (const [name, idx] of chaptersByName) {
  const count = validRows.filter((r) => r.sourceBook === name).length
  console.log(`     ${idx + 1}. ${name} — ${count} questions`)
}

if (DRY_RUN) {
  console.log("\n✋ Dry run — no DB writes performed.")
  process.exit(0)
}

// ─── Wipe + insert ─────────────────────────────────────────────────────────
console.log("\n🗄  Connecting to database...")
const sql = postgres(DB_URL, { max: 1 })

try {
  await sql.begin(async (tx) => {
    console.log("🧹 Wiping existing content...")
    await tx`DELETE FROM attempt_answers`
    await tx`DELETE FROM attempts`
    await tx`DELETE FROM options`
    await tx`DELETE FROM questions`
    await tx`DELETE FROM chapters`
    console.log("   ✓ wiped attempt_answers, attempts, options, questions, chapters")

    console.log("📥 Inserting chapters...")
    const chapterIdByName = new Map()
    for (const [name, idx] of chaptersByName) {
      const [row] = await tx`
        INSERT INTO chapters (name, sort_order)
        VALUES (${name}, ${idx})
        RETURNING id
      `
      chapterIdByName.set(name, row.id)
    }
    console.log(`   ✓ ${chapterIdByName.size} chapters`)

    console.log("📥 Inserting questions + options...")
    let qInserted = 0
    let oInserted = 0
    for (const r of validRows) {
      const [q] = await tx`
        INSERT INTO questions (chapter_id, subchapter, text, type, source_book, source_page)
        VALUES (
          ${chapterIdByName.get(r.sourceBook)},
          ${r.subchapter},
          ${r.questionText},
          ${r.typeCode},
          ${r.sourceBook},
          ${r.sourcePage}
        )
        RETURNING id
      `
      qInserted++
      for (const opt of r.options) {
        await tx`
          INSERT INTO options (question_id, label, text, is_correct)
          VALUES (${q.id}, ${opt.label}, ${opt.text}, ${opt.isCorrect})
        `
        oInserted++
      }
      if (qInserted % 100 === 0) {
        console.log(`   ... ${qInserted}/${validRows.length}`)
      }
    }
    console.log(`   ✓ ${qInserted} questions, ${oInserted} options`)
  })

  console.log("\n✅ Import complete.")
} catch (err) {
  console.error("\n❌ Import failed — transaction rolled back.")
  console.error(err)
  process.exitCode = 1
} finally {
  await sql.end()
}
