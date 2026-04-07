"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { login, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:brightness-110 transition-all h-12"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Se conecteaza...
        </>
      ) : (
        <>
          Autentificare
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(login, null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bine ai revenit!</h1>
        <p className="mt-2 text-sm text-white/40">
          Conecteaza-te la contul tau pentru a continua pregatirea
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-white/60">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="exemplu@email.com"
            className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-base text-white placeholder:text-white/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 md:text-base"
            required
          />
          {state?.errors?.email && (
            <p className="text-xs text-red-400">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm text-white/60">
              Parola
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/30 transition-colors hover:text-emerald-400"
            >
              Ai uitat parola?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-base text-white placeholder:text-white/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 md:text-base"
            required
          />
          {state?.errors?.password && (
            <p className="text-xs text-red-400">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>

      <div className="mt-8 text-center text-sm text-white/30">
        Nu ai cont?{" "}
        <Link
          href="/signup"
          className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Inregistreaza-te
        </Link>
      </div>
    </div>
  )
}
