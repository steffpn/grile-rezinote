"use server"

import { redirect } from "next/navigation"
import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth"
import { auth } from "@/lib/auth"
import { hasUsedTrialBefore } from "@/lib/subscription/trial"
import { STRIPE_CONFIG } from "@/lib/stripe/config"
import {
  authLimiter,
  signupLimiter,
  passwordResetLimiter,
} from "@/lib/rate-limit"
import { headers } from "next/headers"

async function getClientKey(prefix: string): Promise<string> {
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  return `${prefix}:${ip}`
}

export type AuthState = {
  error?: string
  errors?: Record<string, string[]>
  success?: boolean
} | null

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const key = await getClientKey("signup")
  if (!(await signupLimiter.check(key))) {
    return { error: "Prea multe incercari. Te rugam sa astepti si sa reincerci mai tarziu." }
  }

  const result = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    yearOfStudy: formData.get("yearOfStudy"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, result.data.email))
    .limit(1)

  if (existing) {
    return { error: "Exista deja un cont cu aceasta adresa de email" }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(result.data.password, 12)

  // Trial-abuse prevention: if this email has already consumed a trial in the
  // past (even on a since-deleted account), pre-set trialStartedAt far enough
  // in the past so the new account starts in "expired" state and must subscribe.
  const alreadyUsedTrial = await hasUsedTrialBefore(result.data.email)
  const trialStartedAt = alreadyUsedTrial
    ? new Date(Date.now() - (STRIPE_CONFIG.trialDays + 1) * 24 * 60 * 60 * 1000)
    : null

  // Create user
  await db.insert(users).values({
    email: result.data.email,
    passwordHash,
    fullName: result.data.name,
    yearOfStudy: result.data.yearOfStudy,
    trialStartedAt,
  })

  // Auto-login after signup
  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    })
  } catch {
    // If auto-login fails, redirect to login
    redirect("/login")
  }

  redirect("/dashboard")
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const key = await getClientKey("login")
  if (!(await authLimiter.check(key))) {
    return { error: "Prea multe incercari de autentificare. Te rugam sa astepti 15 minute." }
  }

  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    })
  } catch {
    return { error: "Email sau parola incorecta" }
  }

  redirect("/dashboard")
}

export async function logout(): Promise<never> {
  await signOut({ redirect: false })
  redirect("/login")
}

export async function forgotPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const key = await getClientKey("forgot")
  if (!(await passwordResetLimiter.check(key))) {
    // Always return success to not reveal limiter state to attackers
    return { success: true }
  }

  const result = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Find user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, result.data.email))
    .limit(1)

  if (user) {
    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    })

    // TODO: Send email with reset link
    // For now, log the token (in production, use a proper email service)
    console.log(
      `Password reset link: ${process.env.NEXT_PUBLIC_SITE_URL}/update-password?token=${token}`
    )
  }

  // Always return success to not reveal if email exists
  return { success: true }
}

export async function updatePassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Rate-limit token submission to defeat token brute-force.
  const key = await getClientKey("update-password")
  if (!(await passwordResetLimiter.check(key))) {
    return { error: "Prea multe incercari. Te rugam sa astepti si sa reincerci." }
  }

  const result = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Check for reset token or authenticated session
  const token = formData.get("token") as string | null

  let userId: string | null = null

  if (token) {
    // Token-based reset
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1)

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { error: "Link-ul de resetare a expirat sau a fost deja folosit" }
    }

    userId = resetToken.userId

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id))
  } else {
    // Session-based password update
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Nu esti autentificat" }
    }
    userId = session.user.id
  }

  // Hash and update password
  const passwordHash = await bcrypt.hash(result.data.password, 12)
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId))

  redirect("/dashboard")
}
