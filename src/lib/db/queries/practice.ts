import { db } from "@/lib/db"
import {
  chapters,
  questions,
  options,
  attempts,
  attemptAnswers,
} from "@/lib/db/schema"
import { eq, inArray, isNull, and, asc, sql, desc } from "drizzle-orm"

/**
 * Get non-archived chapters with question counts for practice test configuration.
 */
export async function getChaptersForPractice() {
  const chapterList = await db
    .select({
      id: chapters.id,
      name: chapters.name,
      sortOrder: chapters.sortOrder,
    })
    .from(chapters)
    .where(isNull(chapters.archivedAt))
    .orderBy(asc(chapters.sortOrder))

  // Get question counts per chapter (non-archived questions only)
  const stats = await db
    .select({
      chapterId: questions.chapterId,
      questionCount: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(isNull(questions.archivedAt))
    .groupBy(questions.chapterId)

  const statsMap = new Map(
    stats.map((s) => [s.chapterId, s.questionCount])
  )

  return chapterList.map((ch) => ({
    id: ch.id,
    name: ch.name,
    sortOrder: ch.sortOrder,
    questionCount: statsMap.get(ch.id) ?? 0,
  }))
}

/**
 * Get a question with its correct option labels for scoring.
 */
export async function getQuestionWithCorrectOptions(questionId: string) {
  const [question] = await db
    .select({
      id: questions.id,
      type: questions.type,
      sourceBook: questions.sourceBook,
      sourcePage: questions.sourcePage,
    })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1)

  if (!question) throw new Error(`Question not found: ${questionId}`)

  const correctOpts = await db
    .select({ label: options.label })
    .from(options)
    .where(and(eq(options.questionId, questionId), eq(options.isCorrect, true)))

  return {
    ...question,
    correctOptions: correctOpts.map((o) => o.label),
  }
}

/**
 * Get attempt with all its questions (in order) and existing answers.
 * Used for loading/resuming a practice test.
 */
export async function getAttemptWithQuestions(
  attemptId: string,
  userId: string
) {
  // Fetch attempt, verify ownership
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1)

  if (!attempt) return null

  // Fetch questions in the stored order
  const questionOrder = attempt.questionOrder ?? []
  if (questionOrder.length === 0) return { attempt, questions: [], answers: new Map() }

  // Fetch all questions in one query
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

  // Build question map for ordering
  const questionMap = new Map(questionRows.map((q) => [q.id, q]))

  // Order questions according to questionOrder
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

  // Fetch existing answers for this attempt
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
  }
}

/**
 * Get attempt with questions and correct options (for results page).
 * Only returns correct options when attempt is completed.
 */
export async function getAttemptResults(attemptId: string, userId: string) {
  const data = await getAttemptWithQuestions(attemptId, userId)
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

  return {
    ...data,
    correctOptions: correctByQuestion,
  }
}

/**
 * Get in-progress practice attempts for a user.
 */
export async function getInProgressAttempts(userId: string) {
  const inProgressAttempts = await db
    .select({
      id: attempts.id,
      type: attempts.type,
      feedbackMode: attempts.feedbackMode,
      questionCount: attempts.questionCount,
      chapterIds: attempts.chapterIds,
      startedAt: attempts.startedAt,
      questionOrder: attempts.questionOrder,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.status, "in_progress"),
        sql`${attempts.type} IN ('practice_chapter', 'practice_mixed')`
      )
    )
    .orderBy(desc(attempts.startedAt))

  if (inProgressAttempts.length === 0) return []

  // Get answered counts for all attempts in a single query
  const attemptIds = inProgressAttempts.map((a) => a.id)
  const answerCounts = await db
    .select({
      attemptId: attemptAnswers.attemptId,
      count: sql<number>`count(*)::int`,
    })
    .from(attemptAnswers)
    .where(inArray(attemptAnswers.attemptId, attemptIds))
    .groupBy(attemptAnswers.attemptId)

  const countMap = new Map(answerCounts.map((r) => [r.attemptId, r.count]))

  return inProgressAttempts.map((attempt) => ({
    ...attempt,
    answeredCount: countMap.get(attempt.id) ?? 0,
    totalQuestions: attempt.questionOrder?.length ?? 0,
  }))
}
