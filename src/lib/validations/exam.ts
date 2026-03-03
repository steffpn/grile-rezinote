import { z } from "zod"

export const batchSaveSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(
    z.string().uuid(),
    z.array(z.string().regex(/^[A-E]$/, "Optiunea trebuie sa fie A-E"))
  ),
})

export type BatchSaveInput = z.infer<typeof batchSaveSchema>

export const submitExamSchema = z.object({
  attemptId: z.string().uuid(),
})

export type SubmitExamInput = z.infer<typeof submitExamSchema>
