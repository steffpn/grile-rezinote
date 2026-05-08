"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { updatePassword, type AuthState } from "@/lib/auth/actions"
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
      {pending ? "Se salvează..." : "Schimbă parola"}
    </Button>
  )
}

export function UpdatePasswordForm({ token }: { token?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    updatePassword,
    null,
  )

  return (
    <AuthCard>
      <AuthHeader
        title="Parolă nouă."
        subtitle="Alege o parolă pe care nu o folosești în altă parte."
      />

      <form action={formAction} className="space-y-5">
        {/* Pass reset token as hidden field */}
        {token && <input type="hidden" name="token" value={token} />}

        {state?.error && <AuthError message={state.error} />}

        <div>
          <Label
            htmlFor="password"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Parolă nouă
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state?.errors?.password}
            required
          />
          <p className="mt-1.5 font-mono text-[11px] tracking-mono text-fg-mute">
            min 8 · literă · cifră
          </p>
          <FieldError message={state?.errors?.password?.[0]} />
        </div>

        <div>
          <Label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Confirmă parola
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state?.errors?.confirmPassword}
            required
          />
          <FieldError message={state?.errors?.confirmPassword?.[0]} />
        </div>

        <SubmitButton />
      </form>
    </AuthCard>
  )
}
