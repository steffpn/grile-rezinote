"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import crypto from "crypto"
import { eq, and, gt, isNull, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  users,
  attempts,
  attemptAnswers,
  subscriptions,
  auditLogs,
  passwordResetTokens,
  sessions,
  emailChangeTokens,
} from "@/lib/db/schema"
import { signOut } from "@/lib/auth"
import { getCurrentUser } from "@/lib/auth/get-user"
import { assertSameOrigin } from "@/lib/security/csrf"
import { stripe } from "@/lib/stripe/client"
import { sendEmail, appUrl } from "@/lib/email/client"
import {
  emailChangeVerifyEmail,
  accountDeletedEmail,
} from "@/lib/email/templates"

/**
 * Hard-deletes the user's account and all associated data:
 *   - cancels active Stripe subscription immediately (no period grace)
 *   - removes Stripe customer record
 *   - deletes attempts + attempt_answers (via FK cascade once migration runs;
 *     also enumerated explicitly here for safety)
 *   - deletes subscriptions, audit_logs, password_reset_tokens, sessions
 *   - deletes the user row
 *
 * Intentionally does NOT delete `trial_history` — that pseudonymous record
 * (SHA-256 of email) survives by design to prevent re-signup trial abuse.
 *
 * The user must confirm by typing their own email address.
 */
const deleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
})

export async function deleteAccount(input: {
  confirmEmail: string
}): Promise<{ success: boolean; error?: string }> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Adresa de email invalida." }
  }
  if (parsed.data.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return {
      success: false,
      error: "Adresa de email confirmata nu coincide cu cea a contului.",
    }
  }

  // Cancel and delete the Stripe customer (best-effort; never block deletion)
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  if (sub?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (err) {
      console.warn("[deleteAccount] stripe sub cancel failed:", err)
    }
  }
  if (sub?.stripeCustomerId) {
    try {
      await stripe.customers.del(sub.stripeCustomerId)
    } catch (err) {
      console.warn("[deleteAccount] stripe customer delete failed:", err)
    }
  }

  // Delete dependent rows (FK constraints in current schema do not all
  // cascade; explicit deletion is safe even after the migration adds cascades).
  const userAttempts = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(eq(attempts.userId, user.id))
  for (const a of userAttempts) {
    await db.delete(attemptAnswers).where(eq(attemptAnswers.attemptId, a.id))
  }
  await db.delete(attempts).where(eq(attempts.userId, user.id))
  await db.delete(subscriptions).where(eq(subscriptions.userId, user.id))
  await db.delete(auditLogs).where(eq(auditLogs.userId, user.id))
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))
  await db.delete(emailChangeTokens).where(eq(emailChangeTokens.userId, user.id))
  await db.delete(sessions).where(eq(sessions.userId, user.id))

  const fullName = user.fullName
  const emailToNotify = user.email

  await db.delete(users).where(eq(users.id, user.id))

  // Best-effort confirmation email after the row is gone.
  void sendEmail({
    to: emailToNotify,
    ...accountDeletedEmail({ fullName }),
  })

  await signOut({ redirect: false })
  return { success: true }
}

/**
 * Builds a JSON export of everything we hold on the user (Article 15 / 20).
 * Returns the JSON string + a suggested filename. The client wraps it in a
 * Blob and triggers download.
 */
export async function exportAccountData(): Promise<{
  filename: string
  json: string
}> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  const userAttempts = await db
    .select()
    .from(attempts)
    .where(eq(attempts.userId, user.id))
  const attemptIds = userAttempts.map((a) => a.id)
  const allAnswers = attemptIds.length
    ? await db
        .select()
        .from(attemptAnswers)
        .where(inArray(attemptAnswers.attemptId, attemptIds))
    : []

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  const payload = {
    exportedAt: new Date().toISOString(),
    note: "Acest fisier contine toate datele personale stocate de grile-ReziNOTE despre contul tau (GDPR Articolul 15 si 20). Pastreaza-l in siguranta.",
    profile: profile && {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      yearOfStudy: profile.yearOfStudy,
      graduationYear: profile.graduationYear,
      targetScore: profile.targetScore,
      targetSpecialtyIds: profile.targetSpecialtyIds,
      marketingOptIn: profile.marketingOptIn,
      marketingOptInAt: profile.marketingOptInAt,
      peerOptIn: profile.peerOptIn,
      trialStartedAt: profile.trialStartedAt,
      googleId: profile.googleId,
      image: profile.image,
      createdAt: profile.createdAt,
    },
    subscription: sub && {
      status: sub.status,
      planTier: sub.planTier,
      planType: sub.planType,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      createdAt: sub.createdAt,
    },
    attempts: userAttempts.map((a) => ({
      id: a.id,
      type: a.type,
      score: a.score,
      maxScore: a.maxScore,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      timeLimit: a.timeLimit,
      feedbackMode: a.feedbackMode,
      chapterIds: a.chapterIds,
      questionCount: a.questionCount,
      status: a.status,
    })),
    attemptAnswers: allAnswers.map((a) => ({
      attemptId: a.attemptId,
      questionId: a.questionId,
      selectedOptions: a.selectedOptions,
      isCorrect: a.isCorrect,
      score: a.score,
      answeredAt: a.answeredAt,
    })),
  }

  return {
    filename: `grile-rezinote-export-${new Date().toISOString().slice(0, 10)}.json`,
    json: JSON.stringify(payload, null, 2),
  }
}

/**
 * Initiates an email-change flow. The user enters a NEW email; we send a
 * verification link to that NEW address. Clicking the link calls
 * confirmEmailChange() which swaps the email on the user row.
 *
 * We do NOT update the email on the users row until the new address is
 * verified (so the old email remains valid for login until then).
 */
const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Adresa de email invalida"),
})

export async function requestEmailChange(input: {
  newEmail: string
}): Promise<{ success: boolean; error?: string }> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  const parsed = requestEmailChangeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Adresa de email invalida." }
  }

  const newEmail = parsed.data.newEmail
  if (newEmail === user.email.toLowerCase()) {
    return { success: false, error: "Aceasta este adresa actuala." }
  }

  // Conflict check
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1)
  if (conflict) {
    // Avoid leaking existence — return generic success but skip sending.
    return { success: true }
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Invalidate any prior pending change requests for this user.
  await db
    .delete(emailChangeTokens)
    .where(eq(emailChangeTokens.userId, user.id))

  await db.insert(emailChangeTokens).values({
    userId: user.id,
    newEmail,
    token,
    expiresAt,
  })

  const { subject, html } = emailChangeVerifyEmail({
    verifyUrl: `${appUrl()}/profile/confirm-email?token=${token}`,
    newEmail,
    fullName: user.fullName,
  })
  await sendEmail({ to: newEmail, subject, html })

  return { success: true }
}

/**
 * Confirms the pending email change by token. Called by the
 * /profile/confirm-email page. Marks the token used and rotates the user's
 * email atomically (best-effort — Postgres single-statement isolation is fine
 * here because tokens are single-use and we mark used before swapping).
 */
export async function confirmEmailChange(
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || token.length < 32) {
    return { success: false, error: "Token invalid." }
  }

  const [record] = await db
    .select()
    .from(emailChangeTokens)
    .where(
      and(
        eq(emailChangeTokens.token, token),
        isNull(emailChangeTokens.usedAt),
        gt(emailChangeTokens.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!record) {
    return { success: false, error: "Linkul a expirat sau a fost deja folosit." }
  }

  // Conflict check (someone may have grabbed the email since)
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, record.newEmail))
    .limit(1)
  if (conflict) {
    return {
      success: false,
      error: "Aceasta adresa este deja folosita de alt cont.",
    }
  }

  await db
    .update(emailChangeTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailChangeTokens.id, record.id))

  await db
    .update(users)
    .set({ email: record.newEmail })
    .where(eq(users.id, record.userId))

  return { success: true }
}

/**
 * Marketing-consent toggle on /profile updates the timestamp.
 * Exported for the ProfileForm to call when the switch flips.
 */
export async function setMarketingOptIn(
  optIn: boolean
): Promise<{ success: boolean }> {
  await assertSameOrigin()
  const user = await getCurrentUser()

  await db
    .update(users)
    .set({
      marketingOptIn: optIn,
      marketingOptInAt: optIn ? new Date() : null,
    })
    .where(eq(users.id, user.id))

  return { success: true }
}

/**
 * Quick check used by the unsubscribe link in marketing emails.
 * Logs the user out is not needed — auth gates the page.
 */
export async function unsubscribeMarketing(): Promise<void> {
  await assertSameOrigin()
  const user = await getCurrentUser()
  await db
    .update(users)
    .set({ marketingOptIn: false, marketingOptInAt: null })
    .where(eq(users.id, user.id))
  redirect("/profile?marketing=unsubscribed")
}
