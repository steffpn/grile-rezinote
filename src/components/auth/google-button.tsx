"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoogleButtonProps {
  label?: string
  callbackUrl?: string
  className?: string
  /**
   * Optional marketing-consent value captured on the signup form. Persisted
   * to a short-lived cookie before the OAuth redirect so the NextAuth
   * `signIn` callback can apply it when creating the new user. Only relevant
   * on the signup page — the login page can omit it.
   */
  marketingOptIn?: boolean
}

/**
 * "Continua cu Google" button. Triggers NextAuth's Google OAuth flow.
 * On first sign-in, the server-side `signIn` callback in lib/auth/config.ts
 * creates the local user record (with trial-history check) automatically.
 */
export function GoogleButton({
  label = "Continua cu Google",
  callbackUrl = "/dashboard",
  className,
  marketingOptIn,
}: GoogleButtonProps) {
  const [pending, setPending] = useState(false)

  function onClick() {
    setPending(true)
    // Persist the marketing-consent choice through the OAuth redirect. The
    // cookie is SameSite=Lax so it survives the round-trip to Google and
    // back; TTL is capped at 15 minutes. Deleted server-side after use.
    if (typeof marketingOptIn === "boolean") {
      const value = marketingOptIn ? "true" : "false"
      document.cookie = `signup-marketing-consent=${value}; path=/; max-age=900; SameSite=Lax`
    }
    signIn("google", { callbackUrl })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white transition-all hover:border-white/15 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        // Official multicolor Google "G" logo.
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            fill="#EA4335"
          />
        </svg>
      )}
      {pending ? "Se conecteaza..." : label}
    </button>
  )
}
