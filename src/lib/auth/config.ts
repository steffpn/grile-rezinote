import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { hasUsedTrialBefore } from "@/lib/subscription/trial"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

// =============================================================================
// TODO PRE-PROD (Google OAuth):
// Before going live on the production domain (e.g. rezinot.ro), you MUST:
//   1. Add the production origin to "Authorized JavaScript origins" in the
//      Google Cloud Console OAuth client (currently only the Railway URL is
//      configured).
//   2. Add the production callback URL to "Authorized redirect URIs":
//        https://<prod-domain>/api/auth/callback/google
//   3. Set the AUTH_URL env var on the production host to the production
//      origin so NextAuth generates the correct callback during sign-in.
//   4. Move the Google OAuth consent screen from "Testing" to "Production"
//      so users outside the test list can sign in.
// =============================================================================

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // We rely on Google's verified email so we can safely link to existing
      // accounts created via the credentials provider.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider already verified the user inside `authorize`.
      if (account?.provider !== "google") return true
      if (!user.email) return false

      // Find existing user by email (works for both prior credentials users
      // and prior Google logins).
      const [existing] = await db
        .select({
          id: users.id,
          googleId: users.googleId,
          fullName: users.fullName,
          image: users.image,
        })
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1)

      if (existing) {
        // Backfill googleId / image / name from the OAuth profile if missing.
        const updates: Partial<typeof users.$inferInsert> = {}
        if (!existing.googleId && account.providerAccountId) {
          updates.googleId = account.providerAccountId
        }
        if (!existing.image && (user.image ?? null)) {
          updates.image = user.image as string
        }
        if (!existing.fullName && (user.name ?? null)) {
          updates.fullName = user.name as string
        }
        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, existing.id))
        }
        // Pin our internal id onto the user object so the jwt callback uses it.
        ;(user as { id?: string }).id = existing.id
        return true
      }

      // Brand new account → create it. Apply trial-history check so users
      // who already consumed a free trial under this email cannot reset it
      // by signing in with Google.
      const alreadyUsedTrial = await hasUsedTrialBefore(user.email)
      const trialStartedAt = alreadyUsedTrial
        ? new Date(
            Date.now() - (STRIPE_CONFIG.trialDays + 1) * 24 * 60 * 60 * 1000
          )
        : null

      const fullName =
        (user.name as string | undefined) ??
        (profile?.name as string | undefined) ??
        user.email.split("@")[0]

      const [created] = await db
        .insert(users)
        .values({
          email: user.email,
          // No local password — Google handles authentication.
          passwordHash: null,
          fullName,
          googleId: account.providerAccountId,
          image: (user.image as string | undefined) ?? null,
          trialStartedAt,
        })
        .returning({ id: users.id })

      ;(user as { id?: string }).id = created.id
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const pathname = request.nextUrl.pathname

      const publicAuthRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/verify-email",
        "/update-password",
      ]

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && publicAuthRoutes.some((r) => pathname.startsWith(r))) {
        return Response.redirect(new URL("/dashboard", request.nextUrl))
      }

      // Protect app routes
      const protectedPrefixes = [
        "/dashboard",
        "/practice",
        "/exam",
        "/admission",
        "/subscription",
        "/admin",
      ]

      if (!isLoggedIn && protectedPrefixes.some((p) => pathname.startsWith(p))) {
        return Response.redirect(new URL("/login", request.nextUrl))
      }

      return true
    },
  },
  trustHost: true,
  // Force secure cookies in production (Railway is behind an HTTPS proxy).
  // Also pin sameSite=lax so the OAuth redirect back from Google can attach
  // the PKCE cookie — the default "strict" eats the cookie on cross-site
  // redirects and causes pkceCodeVerifier parse errors.
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.pkce.code_verifier"
          : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
      },
    },
    state: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.state"
          : "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
      },
    },
  },
}
