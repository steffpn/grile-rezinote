"use server"

import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { attempts, attemptAnswers, questions, options } from "@/lib/db/schema"
import { eq, and, inArray, isNull, sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { assertSameOrigin } from "@/lib/security/csrf"
import { scoreQuestion } from "@/lib/scoring/engine"
import type { QuestionType, QuestionScore } from "@/lib/scoring/types"
import { batchSaveSchema, submitExamSchema } from "@/lib/validations/exam"
import { getExamDuration } from "@/lib/db/queries/exam"

const GRACE_PERIOD_SECONDS = 60

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
 * Create a new exam simulation attempt.
 * Draws 50 CS + 150 CM questions randomly from entire question bank.
 * Redirects to the exam page.
 *
 * REQUIRES: Active subscription or valid trial period.
 */
export async function createExamAttempt() {
  await assertSameOrigin()
  const user = await getCurrentUser()

  // Verify subscription/trial access
  const access = await checkSubscriptionAccess(user.id)
  if (!access.hasAccess) {
    redirect("/subscription")
  }

  // Get configurable exam duration
  const duration = await getExamDuration()

  // Draw 50 CS questions randomly
  const csQuestions = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.type, "CS"), isNull(questions.archivedAt)))
    .orderBy(sql`RANDOM()`)
    .limit(50)

  // Draw 150 CM questions randomly
  const cmQuestions = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.type, "CM"), isNull(questions.archivedAt)))
    .orderBy(sql`RANDOM()`)
    .limit(150)

  if (csQuestions.length < 50 || cmQuestions.length < 150) {
    return {
      error:
        "Nu sunt suficiente intrebari in baza de date. Sunt necesare minim 50 CS si 150 CM.",
    }
  }

  // Fixed order: 50 CS first, then 150 CM (matches real exam format)
  const questionOrder = [
    ...csQuestions.map((q) => q.id),
    ...cmQuestions.map((q) => q.id),
  ]

  // Generate deterministic shuffle seed for option shuffling
  const shuffleSeed = Math.floor(Math.random() * 2147483647)

  // Create attempt
  const [attempt] = await db
    .insert(attempts)
    .values({
      userId: user.id,
      type: "simulation",
      timeLimit: duration,
      feedbackMode: "deferred",
      questionCount: questionOrder.length,
      questionOrder,
      shuffleSeed,
      status: "in_progress",
    })
    .returning({ id: attempts.id })

  redirect(`/exam/${attempt.id}`)
}

/**
 * Batch save answers during exam simulation.
 * Does NOT compute scores — only persists selected options.
 * Enforces deadline + grace period.
 */
export async function batchSaveAnswers(data: {
  attemptId: string
  answers: Record<string, string[]>
}) {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const parsed = batchSaveSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Date invalide" }
  }

  // Verify attempt ownership and status
  const [attempt] = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      type: attempts.type,
      startedAt: attempts.startedAt,
      timeLimit: attempts.timeLimit,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.id, data.attemptId),
        eq(attempts.userId, user.id),
        eq(attempts.type, "simulation")
      )
    )
    .limit(1)

  if (!attempt) {
    return { error: "Examenul nu a fost gasit" }
  }
  if (attempt.status !== "in_progress") {
    return { error: "Examenul este deja finalizat" }
  }

  // Check deadline + grace period
  const deadlineWithGrace = new Date(
    attempt.startedAt.getTime() +
      (attempt.timeLimit ?? 14400) * 1000 +
      GRACE_PERIOD_SECONDS * 1000
  )
  if (new Date() > deadlineWithGrace) {
    return { error: "Timpul a expirat" }
  }

  // Upsert each answer (no scoring during exam)
  let savedCount = 0
  for (const [questionId, selectedOptions] of Object.entries(data.answers)) {
    const [existing] = await db
      .select({ id: attemptAnswers.id })
      .from(attemptAnswers)
      .where(
        and(
          eq(attemptAnswers.attemptId, data.attemptId),
          eq(attemptAnswers.questionId, questionId)
        )
      )
      .limit(1)

    if (existing) {
      await db
        .update(attemptAnswers)
        .set({
          selectedOptions,
          answeredAt: new Date(),
        })
        .where(eq(attemptAnswers.id, existing.id))
    } else {
      await db.insert(attemptAnswers).values({
        attemptId: data.attemptId,
        questionId,
        selectedOptions,
      })
    }
    savedCount++
  }

  return { success: true as const, savedCount }
}

/**
 * Submit (complete) an exam simulation.
 * Scores all answers using the scoring engine and marks attempt as completed.
 * Enforces deadline + grace period.
 */
export async function submitExam(attemptId: string) {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const parsed = submitExamSchema.safeParse({ attemptId })
  if (!parsed.success) {
    return { error: "Date invalide" }
  }

  // Verify attempt ownership and status
  const [attempt] = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      type: attempts.type,
      startedAt: attempts.startedAt,
      timeLimit: attempts.timeLimit,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, user.id),
        eq(attempts.type, "simulation")
      )
    )
    .limit(1)

  if (!attempt) {
    return { error: "Examenul nu a fost gasit" }
  }
  if (attempt.status !== "in_progress") {
    return { error: "Examenul este deja finalizat" }
  }

  // Check deadline + grace period
  const deadlineWithGrace = new Date(
    attempt.startedAt.getTime() +
      (attempt.timeLimit ?? 14400) * 1000 +
      GRACE_PERIOD_SECONDS * 1000
  )
  if (new Date() > deadlineWithGrace) {
    return { error: "Timpul a expirat. Examenul nu mai poate fi trimis." }
  }

  // Fetch all saved answers
  const answerRows = await db
    .select({
      id: attemptAnswers.id,
      questionId: attemptAnswers.questionId,
      selectedOptions: attemptAnswers.selectedOptions,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId))

  // Get question details for scoring
  const questionIds = answerRows.map((a) => a.questionId)

  // Get question types
  const questionTypeRows =
    questionIds.length > 0
      ? await db
          .select({ id: questions.id, type: questions.type })
          .from(questions)
          .where(inArray(questions.id, questionIds))
      : []
  const questionTypeMap = new Map(
    questionTypeRows.map((q) => [q.id, q.type as QuestionType])
  )

  // Get correct options for all answered questions
  const correctOptionRows =
    questionIds.length > 0
      ? await db
          .select({ questionId: options.questionId, label: options.label })
          .from(options)
          .where(
            and(
              inArray(options.questionId, questionIds),
              eq(options.isCorrect, true)
            )
          )
      : []

  const correctByQuestion = new Map<string, string[]>()
  for (const opt of correctOptionRows) {
    if (!correctByQuestion.has(opt.questionId)) {
      correctByQuestion.set(opt.questionId, [])
    }
    correctByQuestion.get(opt.questionId)!.push(opt.label)
  }

  // Score each answer
  const questionScores: QuestionScore[] = []
  for (const answer of answerRows) {
    const type = questionTypeMap.get(answer.questionId)
    const correctOptions = correctByQuestion.get(answer.questionId) ?? []

    if (!type) continue

    const result = scoreQuestion(
      type,
      answer.questionId,
      answer.selectedOptions ?? [],
      correctOptions
    )

    questionScores.push(result)

    // Update answer with score
    await db
      .update(attemptAnswers)
      .set({
        isCorrect: result.score > 0,
        score: result.score,
      })
      .where(eq(attemptAnswers.id, answer.id))
  }

  // Calculate totals
  const totalScore = questionScores.reduce((sum, qs) => sum + qs.score, 0)

  // Max score from all questions in the exam (not just answered ones)
  const allQuestionOrder = attempt.type === "simulation" ? 200 : 0
  // CS: 50 * 4 = 200, CM: 150 * 5 = 750, Total: 950
  const maxScore = 950

  // Update attempt as completed
  await db
    .update(attempts)
    .set({
      score: totalScore,
      maxScore,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(attempts.id, attemptId))

  return { success: true as const, score: totalScore, maxScore }
}

/**
 * Check if an exam can be resumed or has expired.
 * If expired (past deadline without grace), auto-submits.
 */
export async function resumeExam(attemptId: string) {
  const user = await getCurrentUser()

  const [attempt] = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      type: attempts.type,
      startedAt: attempts.startedAt,
      timeLimit: attempts.timeLimit,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, user.id),
        eq(attempts.type, "simulation")
      )
    )
    .limit(1)

  if (!attempt) {
    return { error: "Examenul nu a fost gasit" }
  }
  if (attempt.status !== "in_progress") {
    return { error: "Examenul este deja finalizat" }
  }

  const now = new Date()
  const deadlineMs =
    attempt.startedAt.getTime() + (attempt.timeLimit ?? 14400) * 1000

  // If past deadline (not grace — check if timer expired)
  if (now.getTime() > deadlineMs) {
    // Check if still within grace period
    const graceDeadlineMs = deadlineMs + GRACE_PERIOD_SECONDS * 1000
    if (now.getTime() <= graceDeadlineMs) {
      // Within grace — auto-submit
      await submitExam(attemptId)
      return { expired: true as const }
    } else {
      // Past grace — still auto-submit but the submit will also handle this
      await submitExam(attemptId)
      return { expired: true as const }
    }
  }

  const remainingSeconds = Math.max(
    0,
    Math.floor((deadlineMs - now.getTime()) / 1000)
  )

  return { active: true as const, remainingSeconds }
}
