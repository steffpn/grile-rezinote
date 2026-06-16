import { z } from "zod"

export const waitlistSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  // Where the sign-up came from (hero, final CTA, nav, closed signup page).
  // Purely for analytics — never shown to the user.
  source: z.string().max(64).optional().nullable(),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>
