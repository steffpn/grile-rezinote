import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

interface WrongAnswer {
  questionId: string
  questionText: string
  questionType: "CS" | "CM"
  chapterName: string
  chapterId: string
  lastAnsweredAt: Date
  totalAttempts: number
  correctCount: number
  incorrectCount: number
}

interface WrongAnswerStats {
  totalUnmastered: number
  totalMastered: number
  byChapter: Array<{ chapterId: string; chapterName: string; count: number }>
}

/**
 * Get unmastered wrong answers for a user.
 * A question is "mastered" when the last 2 answers are both correct.
 * Returns questions that have at least one wrong answer and are NOT mastered.
 */
export async function getUnmasteredWrongAnswers(
  userId: string,
  chapterFilter?: string[]
): Promise<WrongAnswer[]> {
  const chapterCondition =
    chapterFilter && chapterFilter.length > 0
      ? sql`AND q.chapter_id IN (${sql.join(
          chapterFilter.map((id) => sql`${id}`),
          sql`, `
        )})`
      : sql``

  const result = await db.execute(sql`
    WITH user_answers AS (
      SELECT
        aa.question_id,
        aa.is_correct,
        aa.answered_at,
        ROW_NUMBER() OVER (PARTITION BY aa.question_id ORDER BY aa.answered_at DESC) as rn
      FROM attempt_answers aa
      JOIN attempts a ON aa.attempt_id = a.id
      WHERE a.user_id = ${userId}
        AND aa.is_correct IS NOT NULL
    ),
    wrong_questions AS (
      -- Exclude retired questions AND questions in archived chapters so the
      -- "Greșelile mele" count, per-chapter breakdown and playable list all
      -- stay consistent and never resurface questions from a retired chapter
      -- (archiving a chapter only sets chapters.archived_at, not the questions').
      SELECT DISTINCT ua.question_id
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE ua.is_correct = false
        AND q.archived_at IS NULL
        AND c.archived_at IS NULL
    ),
    mastery_check AS (
      SELECT
        ua.question_id,
        CASE WHEN
          COUNT(*) FILTER (WHERE ua.rn <= 2 AND ua.is_correct = true) = 2
        THEN true ELSE false END as is_mastered
      FROM user_answers ua
      WHERE ua.question_id IN (SELECT question_id FROM wrong_questions)
      GROUP BY ua.question_id
    ),
    answer_stats AS (
      SELECT
        question_id,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE is_correct = true) as correct_count,
        COUNT(*) FILTER (WHERE is_correct = false) as incorrect_count,
        MAX(answered_at) as last_answered_at
      FROM user_answers
      GROUP BY question_id
    )
    SELECT
      q.id as question_id,
      q.text as question_text,
      q.type as question_type,
      c.name as chapter_name,
      c.id as chapter_id,
      ast.last_answered_at,
      ast.total_attempts,
      ast.correct_count,
      ast.incorrect_count
    FROM mastery_check mc
    JOIN questions q ON mc.question_id = q.id
    JOIN chapters c ON q.chapter_id = c.id
    JOIN answer_stats ast ON mc.question_id = ast.question_id
    WHERE mc.is_mastered = false
      AND q.archived_at IS NULL
      ${chapterCondition}
    ORDER BY ast.last_answered_at DESC
  `)

  return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
    questionId: row.question_id as string,
    questionText: row.question_text as string,
    questionType: row.question_type as "CS" | "CM",
    chapterName: row.chapter_name as string,
    chapterId: row.chapter_id as string,
    lastAnsweredAt: new Date(row.last_answered_at as string),
    totalAttempts: Number(row.total_attempts),
    correctCount: Number(row.correct_count),
    incorrectCount: Number(row.incorrect_count),
  }))
}

/**
 * Get wrong answer statistics for a user.
 */
export async function getWrongAnswerStats(
  userId: string
): Promise<WrongAnswerStats> {
  const result = await db.execute(sql`
    WITH user_answers AS (
      SELECT
        aa.question_id,
        aa.is_correct,
        ROW_NUMBER() OVER (PARTITION BY aa.question_id ORDER BY aa.answered_at DESC) as rn
      FROM attempt_answers aa
      JOIN attempts a ON aa.attempt_id = a.id
      WHERE a.user_id = ${userId}
        AND aa.is_correct IS NOT NULL
    ),
    wrong_questions AS (
      -- Exclude retired questions AND questions in archived chapters so the
      -- "Greșelile mele" count, per-chapter breakdown and playable list all
      -- stay consistent and never resurface questions from a retired chapter
      -- (archiving a chapter only sets chapters.archived_at, not the questions').
      SELECT DISTINCT ua.question_id
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE ua.is_correct = false
        AND q.archived_at IS NULL
        AND c.archived_at IS NULL
    ),
    mastery_check AS (
      SELECT
        ua.question_id,
        CASE WHEN
          COUNT(*) FILTER (WHERE ua.rn <= 2 AND ua.is_correct = true) = 2
        THEN true ELSE false END as is_mastered
      FROM user_answers ua
      WHERE ua.question_id IN (SELECT question_id FROM wrong_questions)
      GROUP BY ua.question_id
    )
    SELECT
      COUNT(*) FILTER (WHERE mc.is_mastered = false) as total_unmastered,
      COUNT(*) FILTER (WHERE mc.is_mastered = true) as total_mastered
    FROM mastery_check mc
  `)

  const statsRow = (result as unknown as Array<Record<string, unknown>>)[0]

  // Get per-chapter breakdown for unmastered
  const chapterResult = await db.execute(sql`
    WITH user_answers AS (
      SELECT
        aa.question_id,
        aa.is_correct,
        ROW_NUMBER() OVER (PARTITION BY aa.question_id ORDER BY aa.answered_at DESC) as rn
      FROM attempt_answers aa
      JOIN attempts a ON aa.attempt_id = a.id
      WHERE a.user_id = ${userId}
        AND aa.is_correct IS NOT NULL
    ),
    wrong_questions AS (
      -- Exclude retired questions AND questions in archived chapters so the
      -- "Greșelile mele" count, per-chapter breakdown and playable list all
      -- stay consistent and never resurface questions from a retired chapter
      -- (archiving a chapter only sets chapters.archived_at, not the questions').
      SELECT DISTINCT ua.question_id
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE ua.is_correct = false
        AND q.archived_at IS NULL
        AND c.archived_at IS NULL
    ),
    mastery_check AS (
      SELECT
        ua.question_id,
        CASE WHEN
          COUNT(*) FILTER (WHERE ua.rn <= 2 AND ua.is_correct = true) = 2
        THEN true ELSE false END as is_mastered
      FROM user_answers ua
      WHERE ua.question_id IN (SELECT question_id FROM wrong_questions)
      GROUP BY ua.question_id
    )
    SELECT
      c.id as chapter_id,
      c.name as chapter_name,
      COUNT(*) as count
    FROM mastery_check mc
    JOIN questions q ON mc.question_id = q.id
    JOIN chapters c ON q.chapter_id = c.id
    WHERE mc.is_mastered = false
      AND q.archived_at IS NULL
    GROUP BY c.id, c.name
    ORDER BY c.name
  `)

  return {
    totalUnmastered: Number(statsRow?.total_unmastered ?? 0),
    totalMastered: Number(statsRow?.total_mastered ?? 0),
    byChapter: (chapterResult as unknown as Array<Record<string, unknown>>).map(
      (row) => ({
        chapterId: row.chapter_id as string,
        chapterName: row.chapter_name as string,
        count: Number(row.count),
      })
    ),
  }
}

/**
 * Get unmastered wrong answer question IDs for a user.
 * Used when creating a "wrong answers only" practice test.
 */
export async function getUnmasteredWrongAnswerIds(
  userId: string,
  chapterFilter?: string[]
): Promise<string[]> {
  const answers = await getUnmasteredWrongAnswers(userId, chapterFilter)
  return answers.map((a) => a.questionId)
}
