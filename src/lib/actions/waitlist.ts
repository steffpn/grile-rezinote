"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { waitlistLimiter } from "@/lib/rate-limit"
import { waitlistSchema } from "@/lib/validations/waitlist"

export type WaitlistState = { error?: string; success?: boolean } | null

async function clientKey(): Promise<string> {
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  return `waitlist:${ip}`
}

/**
 * Add an email to the pre-launch waitlist. Idempotent — re-submitting the same
 * address is a no-op (no duplicate, still reports success). Rate-limited per IP
 * and protected by a honeypot field against drive-by bots.
 */
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  // Honeypot: a hidden field real users never fill. If it has a value it's a
  // bot — pretend success so it doesn't learn the real validation rules.
  if (((formData.get("company") as string | null) ?? "").length > 0) {
    return { success: true }
  }

  if (!(await waitlistLimiter.check(await clientKey()))) {
    return { error: "Prea multe încercări. Încearcă din nou mai târziu." }
  }

  const parsed = waitlistSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source"),
  })
  if (!parsed.success) {
    return { error: "Adresa de email nu este validă." }
  }

  const email = parsed.data.email.trim().toLowerCase()

  try {
    await db
      .insert(waitlist)
      .values({ email, source: parsed.data.source ?? null })
      .onConflictDoNothing()
  } catch (err) {
    console.error("[waitlist] insert failed:", err)
    return { error: "Ceva n-a mers. Încearcă din nou." }
  }

  return { success: true }
}
