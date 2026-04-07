import { db } from "@/lib/db"
import {
  siteSettings,
  attempts,
  attemptAnswers,
  questions,
  options,
  chapters,
} from "@/lib/db/schema"
import { eq, and, inArray, isNull, asc, sql } from "drizzle-orm"

const DEFAULT_EXAM_DURATION_SECONDS = 14400 // 4 hours

/**
 * Get the configured exam duration in seconds.
 * Falls back to 4 hours (14400 seconds) if not set.
 */
export async function getExamDuration(): Promise<number> {
  const [setting] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "exam_duration_seconds"))
    .limit(1)

  if (!setting) return DEFAULT_EXAM_DURATION_SECONDS

  const parsed = parseInt(setting.value, 10)
  return isNaN(parsed) ? DEFAULT_EXAM_DURATION_SECONDS : parsed
}

/**
 * Get an exam attempt with all its questions and saved answers.
 * Only returns simulation-type attempts. Includes deadline and shuffleSeed.
 */
export async function getExamAttemptWithQuestions(
  attemptId: string,
  userId: string
) {
  // Fetch attempt, verify ownership and type
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, userId),
        eq(attempts.type, "simulation")
      )
    )
    .limit(1)

  if (!attempt) return null

  // Compute deadline
  const deadline = new Date(
    attempt.startedAt.getTime() + (attempt.timeLimit ?? DEFAULT_EXAM_DURATION_SECONDS) * 1000
  )

  // Fetch questions in stored order
  const questionOrder = attempt.questionOrder ?? []
  if (questionOrder.length === 0) {
    return { attempt, questions: [], answers: new Map(), deadline }
  }

  // Fetch all questions
  const questionRows = await db
    .select({
      id: questions.id,
      text: questions.text,
      type: questions.type,
      chapterId: questions.chapterId,
      subchapter: questions.subchapter,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
    })
    .from(questions)
    .where(inArray(questions.id, questionOrder))

  // Fetch options for all questions
  const optionRows = await db
    .select({
      id: options.id,
      questionId: options.questionId,
      label: options.label,
      text: options.text,
    })
    .from(options)
    .where(inArray(options.questionId, questionOrder))
    .orderBy(asc(options.label))

  // Group options by question
  const optionsByQuestion = new Map<
    string,
    Array<{ id: string; label: string; text: string }>
  >()
  for (const opt of optionRows) {
    if (!optionsByQuestion.has(opt.questionId)) {
      optionsByQuestion.set(opt.questionId, [])
    }
    optionsByQuestion.get(opt.questionId)!.push({
      id: opt.id,
      label: opt.label,
      text: opt.text,
    })
  }

  // Build ordered questions
  const questionMap = new Map(questionRows.map((q) => [q.id, q]))
  const orderedQuestions = questionOrder
    .map((qId) => {
      const q = questionMap.get(qId)
      if (!q) return null
      return {
        ...q,
        options: optionsByQuestion.get(qId) ?? [],
      }
    })
    .filter(Boolean) as Array<{
    id: string
    text: string
    type: "CS" | "CM"
    chapterId: string
    subchapter: string | null
    sourceBook: string | null
    sourcePage: string | null
    options: Array<{ id: string; label: string; text: string }>
  }>

  // Fetch existing answers
  const answerRows = await db
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId))

  const answerMap = new Map(
    answerRows.map((a) => [
      a.questionId,
      {
        selectedOptions: a.selectedOptions ?? [],
        isCorrect: a.isCorrect,
        score: a.score,
      },
    ])
  )

  return {
    attempt,
    questions: orderedQuestions,
    answers: answerMap,
    deadline,
  }
}

/**
 * Get exam results with per-chapter breakdown.
 * Only returns data for completed simulation attempts.
 */
export async function getExamResults(attemptId: string, userId: string) {
  const data = await getExamAttemptWithQuestions(attemptId, userId)
  if (!data || data.attempt.status !== "completed") return null

  // Fetch correct options for all questions
  const questionIds = data.questions.map((q) => q.id)
  const correctOptionRows = await db
    .select({
      questionId: options.questionId,
      label: options.label,
    })
    .from(options)
    .where(
      and(
        inArray(options.questionId, questionIds),
        eq(options.isCorrect, true)
      )
    )

  const correctByQuestion = new Map<string, string[]>()
  for (const opt of correctOptionRows) {
    if (!correctByQuestion.has(opt.questionId)) {
      correctByQuestion.set(opt.questionId, [])
    }
    correctByQuestion.get(opt.questionId)!.push(opt.label)
  }

  // Get chapter names for breakdown
  const chapterIds = [...new Set(data.questions.map((q) => q.chapterId))]
  const chapterRows = await db
    .select({ id: chapters.id, name: chapters.name })
    .from(chapters)
    .where(inArray(chapters.id, chapterIds))

  const chapterNameMap = new Map(chapterRows.map((c) => [c.id, c.name]))

  // Build per-chapter breakdown
  const chapterStats = new Map<
    string,
    { totalQuestions: number; correctCount: number; score: number; maxScore: number }
  >()

  for (const q of data.questions) {
    const stats = chapterStats.get(q.chapterId) ?? {
      totalQuestions: 0,
      correctCount: 0,
      score: 0,
      maxScore: 0,
    }

    stats.totalQuestions++
    stats.maxScore += q.type === "CS" ? 4 : 5

    const answer = data.answers.get(q.id)
    if (answer) {
      if (answer.isCorrect) stats.correctCount++
      stats.score += answer.score ?? 0
    }

    chapterStats.set(q.chapterId, stats)
  }

  const chapterBreakdown = Array.from(chapterStats.entries()).map(
    ([chapterId, stats]) => ({
      chapterId,
      chapterName: chapterNameMap.get(chapterId) ?? "Necunoscut",
      totalQuestions: stats.totalQuestions,
      correctCount: stats.correctCount,
      score: stats.score,
      maxScore: stats.maxScore,
      percentage:
        stats.maxScore > 0
          ? Math.round((stats.score / stats.maxScore) * 100)
          : 0,
    })
  )

  // Sort by chapter name
  chapterBreakdown.sort((a, b) => a.chapterName.localeCompare(b.chapterName))

  return {
    ...data,
    correctOptions: correctByQuestion,
    chapterBreakdown,
  }
}

/**
 * Get in-progress simulation attempt for a user (if any).
 */
export async function getInProgressExam(userId: string) {
  const [exam] = await db
    .select({
      id: attempts.id,
      startedAt: attempts.startedAt,
      timeLimit: attempts.timeLimit,
      questionCount: attempts.questionCount,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.type, "simulation"),
        eq(attempts.status, "in_progress")
      )
    )
    .limit(1)

  return exam ?? null
}
