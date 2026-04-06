/**
 * Parse grile from DOCX and insert into Railway PostgreSQL.
 * Answer-anchored parser: finds each "Răspuns corect:" line, then works
 * backwards to extract question text and options.
 *
 * Usage: node scripts/import-grile.mjs "path/to/GRILE.docx" [DATABASE_URL] [--dry-run]
 */

import { readFileSync } from "fs"
import JSZip from "jszip"
import postgres from "postgres"

const DOCX_PATH = process.argv[2]
const DB_URL = process.argv[3] || process.env.DATABASE_URL
const DRY_RUN = process.argv.includes("--dry-run")

if (!DOCX_PATH) {
  console.error("Usage: node scripts/import-grile.mjs <docx-path> [DATABASE_URL] [--dry-run]")
  process.exit(1)
}

// ─── Extract text from DOCX ───
async function extractText(docxPath) {
  const buf = readFileSync(docxPath)
  const zip = await JSZip.loadAsync(buf)
  const xml = await zip.file("word/document.xml").async("string")

  const lines = []
  const paragraphs = xml.split(/<w:p[ >]/)
  for (const p of paragraphs) {
    const texts = []
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let m
    while ((m = re.exec(p)) !== null) {
      texts.push(m[1])
    }
    const line = texts.join("").trim()
    if (line) lines.push(line)
  }
  return lines
}

// ─── Detect chapter headers ───
function findChapters(lines) {
  const chapters = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (
      l === l.toUpperCase() &&
      l.length > 15 &&
      !/^[A-E][\.\)]/.test(l) &&
      !l.includes("RĂSPUNS") &&
      !/^\d+\./.test(l)
    ) {
      chapters.push({ name: l.trim(), lineIndex: i })
    }
  }
  return chapters
}

function getChapter(chapters, lineIdx) {
  let ch = null
  for (const c of chapters) {
    if (c.lineIndex <= lineIdx) ch = c.name
    else break
  }
  return ch || "Necategorizat"
}

// ─── Parse a page reference and strip it ───
function extractPage(text) {
  let page = null
  // "pag. 12" or "(pag. 12)" or "pag 12:" etc.
  const m = text.match(/\(?\s*pag\.?\s*(\d+)\s*\)?\s*:?\s*/)
  if (m) {
    page = m[1]
    text = text.replace(m[0], " ").trim()
  }
  return { text, page }
}

// ─── Main parser ───
function parseQuestions(lines) {
  const questions = []
  const chapters = findChapters(lines)
  const labels = ["A", "B", "C", "D", "E"]

  // Find all answer line indices
  const answerIndices = []
  for (let i = 0; i < lines.length; i++) {
    if (/^Răspuns corect:\s*/i.test(lines[i])) {
      answerIndices.push(i)
    }
  }

  // For each answer, determine the block of lines that belong to this question.
  // The block starts right after the previous answer (or start of file/chapter).
  for (let ai = 0; ai < answerIndices.length; ai++) {
    const ansIdx = answerIndices[ai]
    const prevBoundary = ai > 0 ? answerIndices[ai - 1] + 1 : 0

    // Also check if a chapter header is between prevBoundary and ansIdx
    let blockStart = prevBoundary
    for (const ch of chapters) {
      if (ch.lineIndex >= prevBoundary && ch.lineIndex < ansIdx) {
        blockStart = ch.lineIndex + 1
      }
    }

    // Collect all lines in this question's block (excluding answer line)
    const block = []
    for (let j = blockStart; j < ansIdx; j++) {
      const l = lines[j].trim()
      if (l && !/^Răspuns corect:/i.test(l)) {
        block.push(l)
      }
    }

    if (block.length < 2) continue // Need at least question + 1 option

    // Parse answer line
    let ansText = lines[ansIdx].replace(/^Răspuns corect:\s*/i, "").trim()
    let sourcePage = null

    // Page might be in answer line
    const pageParsed = extractPage(ansText)
    ansText = pageParsed.text
    sourcePage = pageParsed.page

    const correctOptions = ansText
      .split(/\s*,\s*/)
      .map((s) => s.trim())
      .filter((s) => /^[A-E]$/.test(s))

    if (correctOptions.length === 0) continue

    // Now parse the block into question text + options
    let optionsMap = {}
    let questionLines = []

    // Strategy 1: Check for labeled options (A. text, B. text, ...)
    let firstOptIdx = -1
    for (let k = 0; k < block.length; k++) {
      if (/^[A-E][\.\)]\s+/.test(block[k])) {
        if (firstOptIdx === -1) firstOptIdx = k
        const m = block[k].match(/^([A-E])[\.\)]\s+(.+)/)
        if (m) optionsMap[m[1]] = m[2].trim()
      }
    }

    if (Object.keys(optionsMap).length >= 3) {
      questionLines = block.slice(0, firstOptIdx)
    }

    // Strategy 2: Check for inline options in a single line
    if (Object.keys(optionsMap).length < 3) {
      optionsMap = {}
      for (let k = 0; k < block.length; k++) {
        const inlineMatches = block[k].match(/[A-E]\.\s+/g)
        if (inlineMatches && inlineMatches.length >= 4) {
          const parts = block[k].split(/(?=[A-E]\.\s)/)
          questionLines = [...block.slice(0, k), parts[0].trim()].filter(Boolean)
          for (let p = 1; p < parts.length; p++) {
            const om = parts[p].match(/^([A-E])\.\s*(.+)/)
            if (om) optionsMap[om[1]] = om[2].trim()
          }
          break
        }
      }
    }

    // Strategy 3: Unlabeled options — first line is question, rest are options
    if (Object.keys(optionsMap).length < 3) {
      optionsMap = {}
      // First line(s) that end with : or ? or (pag. X) are the question
      // Remaining lines are options (assign A, B, C, D, E)
      let qEnd = 0

      // Find where the question ends (look for lines ending in : ? or containing pag.)
      for (let k = 0; k < block.length; k++) {
        const l = block[k]
        if (l.endsWith(":") || l.endsWith("?") || /pag\.?\s*\d+/.test(l) || l.includes("(") && l.includes(")")) {
          qEnd = k + 1
          break
        }
      }

      // If we couldn't find a clear question end, assume first line is question
      if (qEnd === 0) qEnd = 1

      // Remaining lines are options
      const optLines = block.slice(qEnd)
      if (optLines.length >= 3 && optLines.length <= 7) {
        questionLines = block.slice(0, qEnd)
        for (let k = 0; k < Math.min(optLines.length, 5); k++) {
          optionsMap[labels[k]] = optLines[k].trim()
        }
      }
    }

    // Strategy 4: If block has exactly 6 lines, first = question, rest = 5 options
    if (Object.keys(optionsMap).length < 3 && block.length === 6) {
      optionsMap = {}
      questionLines = [block[0]]
      for (let k = 1; k <= 5 && k < block.length; k++) {
        optionsMap[labels[k - 1]] = block[k].trim()
      }
    }

    // Strategy 5: If block has 7+ lines, try last 5 as options
    if (Object.keys(optionsMap).length < 3 && block.length >= 7) {
      optionsMap = {}
      questionLines = block.slice(0, block.length - 5)
      for (let k = 0; k < 5; k++) {
        optionsMap[labels[k]] = block[block.length - 5 + k].trim()
      }
    }

    if (Object.keys(optionsMap).length < 3) continue

    // Build question text
    let questionText = questionLines.join(" ").trim()
    questionText = questionText.replace(/^\d+[\.\)]\s*/, "").trim()

    // Extract page from question if not from answer
    if (!sourcePage) {
      const qp = extractPage(questionText)
      questionText = qp.text
      sourcePage = qp.page
    } else {
      // Still clean page refs from question text
      questionText = questionText.replace(/\(?\s*pag\.?\s*\d+\s*\)?\s*:?\s*/g, " ").trim()
    }

    questionText = questionText.replace(/:$/, "").trim()

    if (questionText.length < 8) continue

    const type = correctOptions.length > 1 ? "CM" : "CS"

    questions.push({
      text: questionText,
      type,
      chapter: getChapter(chapters, ansIdx),
      sourcePage,
      sourceBook: "Odontoterapie",
      options: labels
        .filter((l) => optionsMap[l])
        .map((label) => ({
          label,
          text: optionsMap[label],
          isCorrect: correctOptions.includes(label),
        })),
    })
  }

  return questions
}

// ─── Insert into database ───
async function insertQuestions(questions, dbUrl) {
  const sql = postgres(dbUrl)

  console.log("\n🗑️  Cleaning old Odontoterapie data...")
  const oldQuestions = await sql`
    SELECT q.id, q.chapter_id FROM questions q WHERE q.source_book = 'Odontoterapie'
  `
  if (oldQuestions.length > 0) {
    const qIds = oldQuestions.map((q) => q.id)
    await sql`DELETE FROM attempt_answers WHERE question_id = ANY(${qIds})`
    await sql`DELETE FROM options WHERE question_id = ANY(${qIds})`
    await sql`DELETE FROM questions WHERE id = ANY(${qIds})`
    const chapterIds = [...new Set(oldQuestions.map((q) => q.chapter_id))]
    for (const cid of chapterIds) {
      const [remaining] = await sql`SELECT count(*) as c FROM questions WHERE chapter_id = ${cid}`
      if (Number(remaining.c) === 0) {
        await sql`DELETE FROM chapters WHERE id = ${cid}`
      }
    }
    console.log(`  Deleted ${oldQuestions.length} old questions`)
  }

  console.log(`\n📥 Inserting ${questions.length} questions...`)

  const chapterMap = new Map()
  for (const q of questions) {
    const ch = q.chapter || "Necategorizat"
    if (!chapterMap.has(ch)) chapterMap.set(ch, [])
    chapterMap.get(ch).push(q)
  }

  console.log(`\nChapters: ${chapterMap.size}`)
  for (const [name, qs] of chapterMap) {
    console.log(`  - ${name}: ${qs.length} (${qs.filter((q) => q.type === "CS").length} CS, ${qs.filter((q) => q.type === "CM").length} CM)`)
  }

  let totalInserted = 0
  let sortOrder = 0

  for (const [chapterName, chapterQuestions] of chapterMap) {
    const [chapter] = await sql`
      INSERT INTO chapters (id, name, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${chapterName}, ${sortOrder++}, NOW(), NOW())
      RETURNING id
    `

    for (const q of chapterQuestions) {
      const [question] = await sql`
        INSERT INTO questions (id, chapter_id, text, type, source_book, source_page, created_at, updated_at)
        VALUES (gen_random_uuid(), ${chapter.id}, ${q.text}, ${q.type}, ${q.sourceBook}, ${q.sourcePage}, NOW(), NOW())
        RETURNING id
      `
      for (const opt of q.options) {
        await sql`
          INSERT INTO options (id, question_id, label, text, is_correct)
          VALUES (gen_random_uuid(), ${question.id}, ${opt.label}, ${opt.text}, ${opt.isCorrect})
        `
      }
      totalInserted++
    }
  }

  console.log(`\n✅ Total inserted: ${totalInserted} questions`)
  await sql.end()
}

// ─── Main ───
async function main() {
  console.log(`📄 Parsing: ${DOCX_PATH}`)

  const lines = await extractText(DOCX_PATH)
  console.log(`  Extracted ${lines.length} text lines`)

  const questions = parseQuestions(lines)
  console.log(`\n  ✅ Parsed ${questions.length} questions`)

  const csCount = questions.filter((q) => q.type === "CS").length
  const cmCount = questions.filter((q) => q.type === "CM").length
  console.log(`  CS: ${csCount}, CM: ${cmCount}`)

  // Per-chapter breakdown
  const chapterMap = new Map()
  for (const q of questions) {
    if (!chapterMap.has(q.chapter)) chapterMap.set(q.chapter, 0)
    chapterMap.set(q.chapter, chapterMap.get(q.chapter) + 1)
  }
  console.log(`\n  Chapters:`)
  for (const [name, count] of chapterMap) {
    console.log(`    ${name}: ${count}`)
  }

  if (DRY_RUN) {
    // Show samples
    console.log("\n--- First 2 ---")
    for (const q of questions.slice(0, 2)) {
      console.log(`\n[${q.type}] ${q.text.substring(0, 120)}`)
      for (const o of q.options) {
        console.log(`  ${o.isCorrect ? "✓" : " "} ${o.label}. ${o.text.substring(0, 80)}`)
      }
    }
    console.log("\n--- Last 2 ---")
    for (const q of questions.slice(-2)) {
      console.log(`\n[${q.type}] ${q.text.substring(0, 120)}`)
      for (const o of q.options) {
        console.log(`  ${o.isCorrect ? "✓" : " "} ${o.label}. ${o.text.substring(0, 80)}`)
      }
    }
    console.log("\n⚠️  DRY RUN — no database changes made")
    return
  }

  if (!DB_URL) {
    console.error("\n❌ DATABASE_URL required (or use --dry-run)")
    process.exit(1)
  }

  await insertQuestions(questions, DB_URL)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
