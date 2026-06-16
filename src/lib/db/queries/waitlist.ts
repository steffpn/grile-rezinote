import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Whether an email is on the pre-launch waitlist. Used at account creation to
 * grant the early-bird perk. Emails are stored lowercased by joinWaitlist, so
 * we normalise here to match.
 */
export async function isEmailOnWaitlist(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.email, email.trim().toLowerCase()))
    .limit(1)
  return Boolean(row)
}
