"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"

import { login, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleButton } from "./google-button"
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthFootLink,
  AuthHeader,
  FieldError,
} from "./auth-shell"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Se conectează...
        </>
      ) : (
        <>
          Autentificare
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(login, null)

  return (
    <AuthCard>
      <AuthHeader
        title="Bine ai revenit."
        subtitle="Conectează-te la cont și continuă pregătirea."
      />

      <GoogleButton callbackUrl="/dashboard" />

      <AuthDivider />

      <form action={formAction} className="space-y-5">
        {state?.error && <AuthError message={state.error} />}

        <div>
          <Label
            htmlFor="email"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="exemplu@email.com"
            aria-invalid={!!state?.errors?.email}
            required
          />
          <FieldError message={state?.errors?.email?.[0]} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-[13px] font-medium text-fg-dim"
            >
              Parolă
            </Label>
            <Link
              href="/forgot-password"
              className="font-mono text-[11px] uppercase tracking-mono text-fg-mute hover:text-neon"
            >
              Ai uitat?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!state?.errors?.password}
            required
          />
          <FieldError message={state?.errors?.password?.[0]} />
        </div>

        <SubmitButton />
      </form>

      <AuthFootLink
        prompt="Nu ai cont?"
        href="/signup"
        cta="Înregistrează-te"
      />
    </AuthCard>
  )
}
