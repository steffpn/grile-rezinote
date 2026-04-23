"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/get-user"
import { assertSameOrigin } from "@/lib/security/csrf"

const CURRENT_YEAR = new Date().getFullYear()

/** Max exam score: 50 CS × 4 + 150 CM × 5 = 950. */
const MAX_EXAM_SCORE = 950

const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Numele trebuie sa aiba cel putin 2 caractere")
    .max(120, "Numele este prea lung"),
  yearOfStudy: z
    .number()
    .int()
    .min(1, "Anul de studiu trebuie sa fie intre 1 si 6")
    .max(6, "Anul de studiu trebuie sa fie intre 1 si 6")
    .nullable(),
  graduationYear: z
    .number()
    .int()
    .min(CURRENT_YEAR - 1, `Anul absolvirii nu poate fi inainte de ${CURRENT_YEAR - 1}`)
    .max(CURRENT_YEAR + 10, `Anul absolvirii pare prea indepartat`)
    .nullable(),
  targetScore: z
    .number()
    .int()
    .min(0)
    .max(MAX_EXAM_SCORE, `Scorul maxim posibil este ${MAX_EXAM_SCORE}`)
    .nullable(),
  targetSpecialtyIds: z.array(z.string().uuid()).max(10),
  marketingOptIn: z.boolean(),
  peerOptIn: z.boolean(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export type ProfileUpdateResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Persists the user's profile. All fields optional-to-clear except fullName
 * (kept required since it shows up across the app).
 */
export async function updateProfile(
  input: ProfileUpdateInput
): Promise<ProfileUpdateResult> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const parsed = profileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Datele introduse nu sunt valide.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const data = parsed.data

  await db
    .update(users)
    .set({
      fullName: data.fullName,
      yearOfStudy: data.yearOfStudy,
      graduationYear: data.graduationYear,
      targetScore: data.targetScore,
      targetSpecialtyIds:
        data.targetSpecialtyIds.length > 0 ? data.targetSpecialtyIds : null,
      marketingOptIn: data.marketingOptIn,
      peerOptIn: data.peerOptIn,
    })
    .where(eq(users.id, user.id))

  return { success: true }
}
