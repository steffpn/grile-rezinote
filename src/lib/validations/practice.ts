import { z } from "zod"

export const practiceConfigSchema = z
  .object({
    type: z.enum(["practice_chapter", "practice_mixed"]),
    chapterIds: z.array(z.string().uuid()),
    // Optional subchapter filter — if provided, the practice draws only from
    // questions whose subchapter is one of these strings (within the selected
    // chapters). Empty array = no subchapter restriction.
    subchapters: z.array(z.string().min(1).max(200)).optional().default([]),
    questionCount: z
      .number()
      .int()
      .min(1, "Numarul de intrebari trebuie sa fie cel putin 1")
      .max(999, "Numarul de intrebari nu poate depasi 999"),
    feedbackMode: z.enum(["immediate", "deferred"]),
    wrongAnswersOnly: z.boolean().optional().default(false),
  })
  // A chapter selection is only required for the regular practice flow.
  // "Greselile mele" can run across the user's full mistake history with no
  // chapter filter at all.
  .refine(
    (data) => data.wrongAnswersOnly || data.chapterIds.length >= 1,
    {
      message: "Selecteaza cel putin un capitol",
      path: ["chapterIds"],
    }
  )

export type PracticeConfigInput = z.infer<typeof practiceConfigSchema>

export const submitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptions: z.array(
    z.string().regex(/^[A-E]$/, "Optiunea trebuie sa fie A-E")
  ),
})

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
