"use server"

import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { attempts, attemptAnswers, questions, options } from "@/lib/db/schema"
import { eq, and, inArray, isNull, sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { scoreQuestion } from "@/lib/scoring/engine"
import type { QuestionType } from "@/lib/scoring/types"
import {
  practiceConfigSchema,
  submitAnswerSchema,
} from "@/lib/validations/practice"
import { getQuestionWithCorrectOptions } from "@/lib/db/queries/practice"

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Select questions with proportional distribution across chapters.
 */
function selectQuestionsProportional(
  questionsByChapter: Map<string, string[]>,
  requestedCount: number
): string[] {
  const totalAvailable = Array.from(questionsByChapter.values()).reduce(
    (sum, qs) => sum + qs.length,
    0
  )
  const actualCount = Math.min(requestedCount, totalAvailable)

  if (actualCount === totalAvailable) {
    // Take all and shuffle
    const all = Array.from(questionsByChapter.values()).flat()
    return shuffle(all)
  }

  const selected: string[] = []
  const remaining = new Map<string, string[]>()

  // Shuffle within each chapter first
  for (const [chapterId, qIds] of questionsByChapter) {
    remaining.set(chapterId, shuffle(qIds))
  }

  // Proportional allocation: floor for each chapter
  let allocated = 0
  const allocations = new Map<string, number>()

  for (const [chapterId, qIds] of remaining) {
    const proportion = qIds.length / totalAvailable
    const count = Math.floor(proportion * actualCount)
    allocations.set(chapterId, count)
    allocated += count
  }

  // Distribute remainder to chapters with most remaining questions
  let remainder = actualCount - allocated
  const chaptersBySize = Array.from(remaining.entries()).sort(
    (a, b) => b[1].length - a[1].length
  )

  for (const [chapterId] of chaptersBySize) {
    if (remainder <= 0) break
    allocations.set(chapterId, (allocations.get(chapterId) ?? 0) + 1)
    remainder--
  }

  // Pick questions from each chapter
  for (const [chapterId, count] of allocations) {
    const chapterQs = remaining.get(chapterId) ?? []
    selected.push(...chapterQs.slice(0, count))
  }

  return shuffle(selected)
}

/**
 * Create a new practice attempt.
 *
 * REQUIRES: Active subscription or valid trial period.
 */
export async function createPracticeAttempt(formData: FormData) {
  const user = await getCurrentUser()

  // Verify subscription/trial access
  const access = await checkSubscriptionAccess(user.id)
  if (!access.hasAccess) {
    redirect("/subscription")
  }

  const rawData = {
    type: formData.get("type") as string,
    chapterIds: JSON.parse((formData.get("chapterIds") as string) || "[]"),
    questionCount: parseInt(formData.get("questionCount") as string, 10),
    feedbackMode: formData.get("feedbackMode") as string,
    wrongAnswersOnly: formData.get("wrongAnswersOnly") === "true",
  }

  const parsed = practiceConfigSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const config = parsed.data

  let questionPool: string[]

  if (config.wrongAnswersOnly) {
    // Get unmastered wrong answers for selected chapters
    const wrongAnswerQuery = sql`
      WITH wrong_questions AS (
        SELECT DISTINCT aa.question_id
        FROM attempt_answers aa
        JOIN attempts a ON aa.attempt_id = a.id
        WHERE a.user_id = ${user.id}
          AND aa.is_correct = false
      ),
      recent_answers AS (
        SELECT
          aa.question_id,
          aa.is_correct,
          ROW_NUMBER() OVER (PARTITION BY aa.question_id ORDER BY aa.answered_at DESC) as rn
        FROM attempt_answers aa
        JOIN attempts a ON aa.attempt_id = a.id
        WHERE a.user_id = ${user.id}
          AND aa.question_id IN (SELECT question_id FROM wrong_questions)
      ),
      mastery_check AS (
        SELECT
          question_id,
          CASE WHEN
            COUNT(*) FILTER (WHERE rn <= 2 AND is_correct = true) = 2
          THEN true ELSE false END as is_mastered
        FROM recent_answers
        GROUP BY question_id
      )
      SELECT mc.question_id
      FROM mastery_check mc
      JOIN questions q ON mc.question_id = q.id
      WHERE mc.is_mastered = false
        AND q.archived_at IS NULL
        ${config.chapterIds.length > 0 ? sql`AND q.chapter_id IN ${sql.raw(`('${config.chapterIds.join("','")}')`)}` : sql``}
    `

    const wrongResults = await db.execute(wrongAnswerQuery)
    questionPool = (wrongResults as unknown as Array<{ question_id: string }>).map(
      (r) => r.question_id
    )
  } else {
    // Get questions from selected chapters
    const eligibleQuestions = await db
      .select({ id: questions.id, chapterId: questions.chapterId })
      .from(questions)
      .where(
        and(
          inArray(questions.chapterId, config.chapterIds),
          isNull(questions.archivedAt)
        )
      )

    // Group by chapter for proportional distribution
    const byChapter = new Map<string, string[]>()
    for (const q of eligibleQuestions) {
      if (!byChapter.has(q.chapterId)) {
        byChapter.set(q.chapterId, [])
      }
      byChapter.get(q.chapterId)!.push(q.id)
    }

    questionPool = selectQuestionsProportional(byChapter, config.questionCount)
  }

  if (questionPool.length === 0) {
    return { error: { chapterIds: ["Nu exista intrebari disponibile pentru selectia facuta"] } }
  }

  // Create attempt
  const [attempt] = await db
    .insert(attempts)
    .values({
      userId: user.id,
      type: config.type,
      feedbackMode: config.feedbackMode,
      chapterIds: config.chapterIds,
      questionCount: questionPool.length,
      questionOrder: questionPool,
      status: "in_progress",
    })
    .returning({ id: attempts.id })

  redirect(`/practice/${attempt.id}`)
}

/**
 * Submit an answer for a practice test question.
 */
export async function submitAnswer(data: {
  attemptId: string
  questionId: string
  selectedOptions: string[]
}) {
  const user = await getCurrentUser()

  const parsed = submitAnswerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Date invalide" }
  }

  // Verify attempt belongs to user and is in progress
  const [attempt] = await db
    .select({ id: attempts.id, status: attempts.status })
    .from(attempts)
    .where(and(eq(attempts.id, data.attemptId), eq(attempts.userId, user.id)))
    .limit(1)

  if (!attempt) {
    return { error: "Test negasit" }
  }
  if (attempt.status !== "in_progress") {
    return { error: "Testul este deja finalizat" }
  }

  // Get question details for scoring
  const question = await getQuestionWithCorrectOptions(data.questionId)
  const result = scoreQuestion(
    question.type as QuestionType,
    data.questionId,
    data.selectedOptions,
    question.correctOptions
  )

  // Check if answer already exists (update) or is new (insert)
  const [existing] = await db
    .select({ id: attemptAnswers.id })
    .from(attemptAnswers)
    .where(
      and(
        eq(attemptAnswers.attemptId, data.attemptId),
        eq(attemptAnswers.questionId, data.questionId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(attemptAnswers)
      .set({
        selectedOptions: data.selectedOptions,
        isCorrect: result.score > 0,
        score: result.score,
        answeredAt: new Date(),
      })
      .where(eq(attemptAnswers.id, existing.id))
  } else {
    await db.insert(attemptAnswers).values({
      attemptId: data.attemptId,
      questionId: data.questionId,
      selectedOptions: data.selectedOptions,
      isCorrect: result.score > 0,
      score: result.score,
    })
  }

  return {
    isCorrect: result.score > 0,
    score: result.score,
    maxScore: result.maxScore,
    correctOptions: question.correctOptions,
    sourceBook: question.sourceBook,
    sourcePage: question.sourcePage,
    questionType: question.type,
  }
}

/**
 * Complete a practice attempt, calculating final score.
 */
export async function completePracticeAttempt(attemptId: string) {
  const user = await getCurrentUser()

  // Verify ownership and status
  const [attempt] = await db
    .select({ id: attempts.id, status: attempts.status })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, user.id)))
    .limit(1)

  if (!attempt) {
    return { error: "Test negasit" }
  }
  if (attempt.status !== "in_progress") {
    return { error: "Testul este deja finalizat" }
  }

  // Calculate total score from all answers
  const answers = await db
    .select({
      score: attemptAnswers.score,
      questionId: attemptAnswers.questionId,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId))

  // Get question types to calculate max scores
  const questionIds = answers.map((a) => a.questionId)
  let maxScore = 0

  if (questionIds.length > 0) {
    const questionTypes = await db
      .select({ id: questions.id, type: questions.type })
      .from(questions)
      .where(inArray(questions.id, questionIds))

    const typeMap = new Map(questionTypes.map((q) => [q.id, q.type]))

    for (const a of answers) {
      const type = typeMap.get(a.questionId)
      maxScore += type === "CS" ? 4 : 5
    }
  }

  const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0)

  // Update attempt
  await db
    .update(attempts)
    .set({
      score: totalScore,
      maxScore,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(attempts.id, attemptId))

  return {
    success: true,
    score: totalScore,
    maxScore,
  }
}
