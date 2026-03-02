import type { QuestionType, QuestionScore, ExamResult } from "./types"

const DEFAULT_OPTIONS = ["A", "B", "C", "D", "E"] as const

/**
 * CS (Complement Simplu) scoring.
 * 4 points if the single selected option matches the single correct option.
 * 0 points otherwise (wrong answer, empty selection, or multiple selections).
 */
export function scoreCS(
  selectedOptions: string[],
  correctOptions: string[]
): number {
  if (selectedOptions.length !== 1) return 0
  return selectedOptions[0] === correctOptions[0] ? 4 : 0
}

/**
 * CM (Complement Multiplu) scoring - Official Romanian formula.
 *
 * Per-option scoring: 1 point for each correctly-handled option:
 *   - Selected a correct option = +1 point
 *   - Did NOT select an incorrect option = +1 point
 *
 * Maximum 5 points per question (5 options: A-E).
 * Annulment: 0 points if selections < 2 or > 4.
 */
export function scoreCM(
  selectedOptions: string[],
  correctOptions: string[],
  allOptions: string[] = [...DEFAULT_OPTIONS]
): number {
  // Annulment check
  if (selectedOptions.length < 2 || selectedOptions.length > 4) return 0

  let score = 0
  for (const option of allOptions) {
    const isSelected = selectedOptions.includes(option)
    const isCorrect = correctOptions.includes(option)

    // 1 point if: selected a correct option OR did not select an incorrect option
    if ((isSelected && isCorrect) || (!isSelected && !isCorrect)) {
      score++
    }
  }
  return score
}

/**
 * Score a single question, delegating to the appropriate scoring function.
 */
export function scoreQuestion(
  type: QuestionType,
  questionId: string,
  selectedOptions: string[],
  correctOptions: string[]
): QuestionScore {
  if (type === "CS") {
    const score = scoreCS(selectedOptions, correctOptions)
    return {
      questionId,
      type,
      score,
      maxScore: 4,
      isAnnulled: false,
    }
  }

  // CM
  const isAnnulled =
    selectedOptions.length < 2 || selectedOptions.length > 4
  const score = scoreCM(selectedOptions, correctOptions)
  return {
    questionId,
    type,
    score,
    maxScore: 5,
    isAnnulled,
  }
}

/**
 * Calculate total exam score from individual question scores.
 * Maximum: 50 CS * 4 = 200 + 150 CM * 5 = 750 = 950 total.
 */
export function calculateExamScore(
  questionScores: QuestionScore[]
): ExamResult {
  let csScore = 0
  let cmScore = 0
  let csCount = 0
  let cmCount = 0

  for (const qs of questionScores) {
    if (qs.type === "CS") {
      csScore += qs.score
      csCount++
    } else {
      cmScore += qs.score
      cmCount++
    }
  }

  const total = csScore + cmScore
  const maxPossible = 950
  const percentage =
    maxPossible > 0
      ? Math.round((total / maxPossible) * 10000) / 100
      : 0

  return {
    total,
    maxPossible,
    percentage,
    csScore,
    cmScore,
    csCount,
    cmCount,
  }
}
