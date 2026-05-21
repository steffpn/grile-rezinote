/**
 * Generates psql-ready SQL files from xlsx question banks.
 * Output: scripts/sql/04-import-pedo.sql, 05-import-protetica.sql
 *
 * Usage: node scripts/gen-import-sql.mjs
 */
import ExcelJS from "exceljs"
import { writeFileSync, statSync } from "fs"
import { randomUUID } from "crypto"

const CONFIGS = [
  {
    file: "grile_pedo_final.xlsx",
    chapter: "Pedodonție",
    sqlNum: "04",
    sqlName: "pedo",
  },
  {
    file: "grile_protetica_final.xlsx",
    chapter: "Protetica",
    sqlNum: "05",
    sqlName: "protetica",
  },
]

function escSql(s) {
  if (s == null) return ""
  return String(s).replace(/'/g, "''")
}

function norm(v) {
  if (v == null) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

function typeCode(v) {
  const t = norm(v).toUpperCase()
  if (t === "A" || t === "CS") return "CS"
  if (t === "B" || t === "CM") return "CM"
  return null
}

function parseCorrect(raw) {
  if (!raw) return new Set()
  return new Set(
    String(raw)
      .toUpperCase()
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

async function readBank(file) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  const ws = wb.worksheets[0]

  const questions = []
  const errors = []

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const subchapter = norm(row.getCell(2).value)
    const text = norm(row.getCell(3).value)
    const type = typeCode(row.getCell(4).value)
    const opts = [
      { label: "A", text: norm(row.getCell(5).value) },
      { label: "B", text: norm(row.getCell(6).value) },
      { label: "C", text: norm(row.getCell(7).value) },
      { label: "D", text: norm(row.getCell(8).value) },
      { label: "E", text: norm(row.getCell(9).value) },
    ]
    const correctSet = parseCorrect(row.getCell(10).value)
    const sourceBook = norm(row.getCell(11).value)
    const sourcePage = norm(row.getCell(12).value)

    if (!text) {
      errors.push(`row ${r}: no text`)
      continue
    }
    if (!type) {
      errors.push(`row ${r}: bad type "${row.getCell(4).value}"`)
      continue
    }
    if (opts.some((o) => !o.text)) {
      errors.push(`row ${r}: empty option`)
      continue
    }
    if (correctSet.size === 0) {
      errors.push(`row ${r}: no correct answers`)
      continue
    }
    let badLabel = false
    for (const c of correctSet) {
      if (!["A", "B", "C", "D", "E"].includes(c)) {
        errors.push(`row ${r}: bad correct label "${c}"`)
        badLabel = true
      }
    }
    if (badLabel) continue
    if (type === "CS" && correctSet.size !== 1) {
      errors.push(`row ${r}: CS must have 1 correct (found ${correctSet.size})`)
      continue
    }

    questions.push({
      id: randomUUID(),
      subchapter: subchapter || null,
      text,
      type,
      sourceBook,
      sourcePage: sourcePage || null,
      opts: opts.map((o) => ({ ...o, isCorrect: correctSet.has(o.label) })),
    })
  }

  return { questions, errors }
}

function buildSql(cfg, questions) {
  const lines = []
  lines.push(
    "-- ─────────────────────────────────────────────────────────────────────────────",
  )
  lines.push(`-- Import grile: ${cfg.chapter}`)
  lines.push(
    "-- ─────────────────────────────────────────────────────────────────────────────",
  )
  lines.push(`-- Generated from ${cfg.file}`)
  lines.push(`-- Total questions: ${questions.length}`)
  lines.push(`-- Total options:   ${questions.length * 5}`)
  lines.push("--")
  lines.push(`-- Aborts if chapter "${cfg.chapter}" already exists.`)
  lines.push("--")
  lines.push("-- Usage:")
  lines.push(
    `--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/${cfg.sqlNum}-import-${cfg.sqlName}.sql`,
  )
  lines.push(
    "-- ─────────────────────────────────────────────────────────────────────────────",
  )
  lines.push("")
  lines.push("SET client_encoding TO 'UTF8';")
  lines.push("")
  lines.push("BEGIN;")
  lines.push("")
  lines.push("-- 1. Refuse if chapter exists already.")
  lines.push("DO $$")
  lines.push("BEGIN")
  lines.push(
    `  IF EXISTS (SELECT 1 FROM chapters WHERE name = '${cfg.chapter}') THEN`,
  )
  lines.push(
    `    RAISE EXCEPTION 'Chapter "${cfg.chapter}" already exists — refusing to re-import.';`,
  )
  lines.push("  END IF;")
  lines.push("END $$;")
  lines.push("")
  lines.push("-- 2. Insert chapter (sort_order = max + 1) and capture its id.")
  lines.push("INSERT INTO chapters (name, sort_order)")
  lines.push(
    `VALUES ('${cfg.chapter}', (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM chapters))`,
  )
  lines.push("RETURNING id AS chapter_id \\gset")
  lines.push("")
  lines.push(
    `-- 3. Bulk-insert all ${questions.length} questions with pre-generated UUIDs.`,
  )
  lines.push(
    "INSERT INTO questions (id, chapter_id, subchapter, text, type, source_book, source_page) VALUES",
  )
  const qRows = questions.map(
    (q) =>
      `  ('${q.id}', :'chapter_id', ` +
      (q.subchapter ? `'${escSql(q.subchapter)}'` : "NULL") +
      `, '${escSql(q.text)}', '${q.type}', '${escSql(q.sourceBook)}', ` +
      (q.sourcePage ? `'${escSql(q.sourcePage)}'` : "NULL") +
      ")",
  )
  lines.push(qRows.join(",\n") + ";")
  lines.push("")
  lines.push(`-- 4. Bulk-insert all ${questions.length * 5} options.`)
  lines.push("INSERT INTO options (question_id, label, text, is_correct) VALUES")
  const oRows = []
  for (const q of questions) {
    for (const o of q.opts) {
      oRows.push(
        `  ('${q.id}', '${o.label}', '${escSql(o.text)}', ${o.isCorrect ? "TRUE" : "FALSE"})`,
      )
    }
  }
  lines.push(oRows.join(",\n") + ";")
  lines.push("")
  lines.push("-- 5. Sanity check.")
  lines.push("\\echo ''")
  lines.push(
    "\\echo '── Import summary ────────────────────────────────────────────────────────'",
  )
  lines.push(
    `SELECT COUNT(*)::int AS inserted_questions FROM questions WHERE source_book = '${cfg.chapter}';`,
  )
  lines.push(
    `SELECT COUNT(*)::int AS inserted_options FROM options o JOIN questions q ON q.id = o.question_id WHERE q.source_book = '${cfg.chapter}';`,
  )
  lines.push("")
  lines.push("COMMIT;")

  return lines.join("\n")
}

async function main() {
  for (const cfg of CONFIGS) {
    console.log(`Reading ${cfg.file}…`)
    const { questions, errors } = await readBank(cfg.file)
    console.log(
      `  valid: ${questions.length} | errors: ${errors.length}`,
    )
    if (errors.length > 0) {
      console.log("  first 5 errors:")
      for (const e of errors.slice(0, 5)) console.log(`   - ${e}`)
    }
    const outFile = `scripts/sql/${cfg.sqlNum}-import-${cfg.sqlName}.sql`
    writeFileSync(outFile, buildSql(cfg, questions))
    const kb = (statSync(outFile).size / 1024).toFixed(1)
    console.log(`  → wrote ${outFile} (${kb} KB)\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
