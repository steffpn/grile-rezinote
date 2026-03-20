/**
 * Seed realistic test data for the admin user.
 * Creates practice tests and simulations with varied scores over the past 30 days.
 *
 * Usage: node scripts/seed-test-data.mjs [DATABASE_URL]
 */

import postgres from "postgres"

const DB_URL = process.argv[2] || process.env.DATABASE_URL
if (!DB_URL) {
  console.error("Usage: node scripts/seed-test-data.mjs <DATABASE_URL>")
  process.exit(1)
}

const sql = postgres(DB_URL)

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59))
  return d
}

async function main() {
  // 1. Find admin user
  const [admin] = await sql`SELECT id FROM users WHERE is_superadmin = true LIMIT 1`
  if (!admin) {
    console.error("No admin user found!")
    process.exit(1)
  }
  console.log(`Admin user: ${admin.id}`)

  // 2. Get chapters and questions
  const chapters = await sql`SELECT id, name FROM chapters WHERE archived_at IS NULL ORDER BY sort_order`
  console.log(`Found ${chapters.length} chapters`)

  const allQuestions = await sql`
    SELECT q.id, q.chapter_id, q.type
    FROM questions q
    WHERE q.archived_at IS NULL
    ORDER BY random()
  `
  console.log(`Found ${allQuestions.length} questions`)

  if (allQuestions.length === 0) {
    console.error("No questions in database!")
    process.exit(1)
  }

  // Group questions by chapter
  const byChapter = new Map()
  for (const q of allQuestions) {
    if (!byChapter.has(q.chapter_id)) byChapter.set(q.chapter_id, [])
    byChapter.get(q.chapter_id).push(q)
  }

  // Get correct options for all questions
  const allOptions = await sql`
    SELECT question_id, label, is_correct
    FROM options
    WHERE question_id IN ${sql(allQuestions.map(q => q.id))}
  `
  const correctByQ = new Map()
  for (const o of allOptions) {
    if (!correctByQ.has(o.question_id)) correctByQ.set(o.question_id, [])
    if (o.is_correct) correctByQ.get(o.question_id).push(o.label)
  }

  // 3. Clean existing test data for admin
  console.log("\nCleaning old test data for admin...")
  const oldAttempts = await sql`SELECT id FROM attempts WHERE user_id = ${admin.id}`
  if (oldAttempts.length > 0) {
    const ids = oldAttempts.map(a => a.id)
    await sql`DELETE FROM attempt_answers WHERE attempt_id = ANY(${ids})`
    await sql`DELETE FROM attempts WHERE id = ANY(${ids})`
    console.log(`  Deleted ${oldAttempts.length} old attempts`)
  }

  // 4. Create practice tests over the past 30 days
  const practiceTests = []

  // 12 practice tests spread over 30 days with improving accuracy
  for (let i = 0; i < 12; i++) {
    const day = 30 - Math.floor((i / 12) * 30) // spread from 30 days ago to today
    const startedAt = daysAgo(day)
    const completedAt = new Date(startedAt.getTime() + randomInt(5, 25) * 60000) // 5-25 min

    // Pick 1-2 chapters
    const numChapters = randomInt(1, 2)
    const selectedChapters = shuffle(chapters).slice(0, numChapters)
    const chapterIds = selectedChapters.map(c => c.id)

    // Get questions from those chapters
    let pool = []
    for (const cid of chapterIds) {
      pool.push(...(byChapter.get(cid) || []))
    }

    const questionCount = Math.min(randomInt(10, 25), pool.length)
    const selectedQuestions = shuffle(pool).slice(0, questionCount)

    // Accuracy improves over time (40% → 75%)
    const baseAccuracy = 0.40 + (i / 12) * 0.35

    practiceTests.push({
      type: "practice_chapter",
      startedAt,
      completedAt,
      chapterIds,
      questions: selectedQuestions,
      accuracy: baseAccuracy,
      feedbackMode: i % 3 === 0 ? "deferred" : "immediate",
    })
  }

  // 5. Create 3 simulations
  const simulations = []
  const csQuestions = allQuestions.filter(q => q.type === "CS")
  const cmQuestions = allQuestions.filter(q => q.type === "CM")

  for (let i = 0; i < 3; i++) {
    const day = 25 - i * 10 // day 25, 15, 5
    const startedAt = daysAgo(day)
    const completedAt = new Date(startedAt.getTime() + randomInt(90, 180) * 60000) // 1.5-3 hours

    // Pick up to 50 CS + 150 CM (or whatever is available)
    const cs = shuffle(csQuestions).slice(0, Math.min(50, csQuestions.length))
    const cm = shuffle(cmQuestions).slice(0, Math.min(150, cmQuestions.length))
    const simQs = [...cs, ...cm]

    // Accuracy improves: 35% → 55%
    const accuracy = 0.35 + (i / 3) * 0.20

    simulations.push({
      type: "simulation",
      startedAt,
      completedAt,
      chapterIds: chapters.map(c => c.id),
      questions: simQs,
      accuracy,
      feedbackMode: "deferred",
      timeLimit: 14400, // 4 hours
    })
  }

  // 6. Insert all attempts
  const allTests = [...practiceTests, ...simulations]
  let totalAttempts = 0
  let totalAnswers = 0

  for (const test of allTests) {
    const questionOrder = test.questions.map(q => q.id)

    // Insert attempt
    const [attempt] = await sql`
      INSERT INTO attempts (id, user_id, type, started_at, completed_at, time_limit, feedback_mode, chapter_ids, question_count, question_order, status, score, max_score)
      VALUES (
        gen_random_uuid(),
        ${admin.id},
        ${test.type},
        ${test.startedAt},
        ${test.completedAt},
        ${test.timeLimit || null},
        ${test.feedbackMode},
        ${test.chapterIds},
        ${test.questions.length},
        ${questionOrder},
        'completed',
        0,
        0
      )
      RETURNING id
    `

    let totalScore = 0
    let maxScore = 0

    // Insert answers
    for (let qi = 0; qi < test.questions.length; qi++) {
      const q = test.questions[qi]
      const correct = correctByQ.get(q.id) || ["A"]
      const qMaxScore = q.type === "CS" ? 4 : 5
      maxScore += qMaxScore

      // Determine if correct based on accuracy + some randomness
      const rand = Math.random()
      const isCorrect = rand < test.accuracy

      let selectedOptions
      let score

      if (isCorrect) {
        selectedOptions = correct
        score = qMaxScore
      } else {
        // Wrong answer - pick a wrong option
        const allLabels = ["A", "B", "C", "D", "E"]
        const wrongLabels = allLabels.filter(l => !correct.includes(l))

        if (q.type === "CS") {
          // Pick one wrong answer
          selectedOptions = [wrongLabels[randomInt(0, wrongLabels.length - 1)] || "A"]
          score = 0
        } else {
          // CM: partial credit possible, but mostly wrong
          if (rand < test.accuracy * 0.5) {
            // Partially correct (some right, some wrong)
            const partial = correct.slice(0, Math.ceil(correct.length / 2))
            selectedOptions = [...partial, wrongLabels[0] || "A"]
            score = Math.max(0, Math.floor(qMaxScore * 0.4))
          } else {
            // Completely wrong
            selectedOptions = wrongLabels.length > 0 ? [wrongLabels[0]] : ["A"]
            score = 0
          }
        }
      }

      totalScore += score

      const answeredAt = new Date(
        test.startedAt.getTime() +
        ((test.completedAt.getTime() - test.startedAt.getTime()) * (qi + 1)) / test.questions.length
      )

      await sql`
        INSERT INTO attempt_answers (id, attempt_id, question_id, selected_options, is_correct, score, answered_at)
        VALUES (gen_random_uuid(), ${attempt.id}, ${q.id}, ${selectedOptions}, ${isCorrect}, ${score}, ${answeredAt})
      `
      totalAnswers++
    }

    // Update attempt with final score
    await sql`
      UPDATE attempts SET score = ${totalScore}, max_score = ${maxScore} WHERE id = ${attempt.id}
    `

    totalAttempts++
    const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    console.log(`  ${test.type}: ${test.questions.length} questions, ${totalScore}/${maxScore} (${pct}%) — ${test.startedAt.toLocaleDateString()}`)
  }

  console.log(`\nDone! Created ${totalAttempts} attempts with ${totalAnswers} answers.`)
  await sql.end()
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
