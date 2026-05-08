"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

import { forgotPassword, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  AuthError,
  AuthHeader,
  FieldError,
} from "./auth-shell"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Se trimite..." : "Trimite link de resetare"}
    </Button>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    forgotPassword,
    null,
  )

  if (state?.success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <Mail className="size-6" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-fg">
            Verifică email-ul.
          </h1>
          <p className="mt-2 text-[14px] leading-[1.55] text-fg-dim">
            Dacă există un cont cu această adresă, vei primi un link pentru
            resetarea parolei.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-mono text-fg-mute hover:text-neon"
          >
            <ArrowLeft className="size-3" />
            Înapoi la autentificare
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Resetare parolă."
        subtitle="Introdu adresa de email pentru a primi linkul de resetare."
      />

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

        <SubmitButton />
      </form>

      <p className="mt-7 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-mono text-fg-mute hover:text-neon"
        >
          <ArrowLeft className="size-3" />
          Înapoi la autentificare
        </Link>
      </p>
    </AuthCard>
  )
}
