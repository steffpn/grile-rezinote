export type QuestionType = "CS" | "CM"

/**
 * Romanian display label for a question type.
 *   CS  →  Complement simplu
 *   CM  →  Complement multiplu
 *
 * Use this everywhere the type is shown to a student/end user.
 * Internal/admin code may keep using the short codes.
 */
export function formatQuestionType(type: QuestionType | string): string {
  if (type === "CS") return "Complement simplu"
  if (type === "CM") return "Complement multiplu"
  return type
}

/** Shorter variant for tight UI (badges, table cells). */
export function formatQuestionTypeShort(type: QuestionType | string): string {
  if (type === "CS") return "Complement simplu"
  if (type === "CM") return "Complement multiplu"
  return type
}
