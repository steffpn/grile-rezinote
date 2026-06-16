"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { waitlistLimiter } from "@/lib/rate-limit"
import { waitlistSchema } from "@/lib/validations/waitlist"
import { sendEmail } from "@/lib/email/client"
import { waitlistWelcomeEmail } from "@/lib/email/templates"
import { isRegistrationOpen } from "@/lib/launch"

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

  // The waitlist only collects sign-ups pre-launch. Once registration opens
  // there is nothing to wait for — and, crucially, the early-bird PREMIUM perk
  // (granted from waitlist membership at account creation) must stay limited to
  // people who joined before launch. So we stop accepting new entries here.
  if (isRegistrationOpen()) {
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

  let inserted: { id: string }[]
  try {
    inserted = await db
      .insert(waitlist)
      .values({ email, source: parsed.data.source ?? null })
      .onConflictDoNothing()
      .returning({ id: waitlist.id })
  } catch (err) {
    console.error("[waitlist] insert failed:", err)
    return { error: "Ceva n-a mers. Încearcă din nou." }
  }

  // Send the early-bird welcome only on the FIRST sign-up — re-submitting an
  // address already on the list returns no row (ON CONFLICT DO NOTHING), so we
  // don't re-email. Best-effort: the row is saved regardless of email outcome.
  if (inserted.length > 0) {
    const { subject, html } = waitlistWelcomeEmail({
      code: process.env.EARLYBIRD_PROMO_CODE ?? null,
    })
    const res = await sendEmail({ to: email, subject, html })
    if (!res.ok) {
      console.warn("[waitlist] welcome email did not send:", res.error)
    }
  }

  return { success: true }
}
