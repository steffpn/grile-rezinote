"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"

import { signup, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Se creează contul...
        </>
      ) : (
        <>
          Începe gratuit
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  )
}

const yearOptions = [
  { value: "1", label: "Anul 1" },
  { value: "2", label: "Anul 2" },
  { value: "3", label: "Anul 3" },
  { value: "4", label: "Anul 4" },
  { value: "5", label: "Anul 5" },
  { value: "6", label: "Anul 6" },
]

export function SignupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signup, null)

  // Shared marketing consent state. Default OFF — GDPR requires explicit opt-in
  // for marketing communications, so the box is unchecked until the user ticks
  // it. For the credentials path it goes through FormData; for Google it gets
  // persisted to a short-lived cookie that the auth `signIn` callback reads
  // when creating the new user.
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="7 zile gratuit · fără card"
        title="Creează-ți contul."
        subtitle="Începe pregătirea pentru rezidențiat în câteva secunde."
      />

      <GoogleButton
        label="Înregistrează-te cu Google"
        callbackUrl="/dashboard"
        marketingOptIn={marketingOptIn}
      />

      <AuthDivider />

      <form action={formAction} className="space-y-4">
        {state?.error && <AuthError message={state.error} />}

        <div>
          <Label
            htmlFor="name"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Nume complet
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ion Popescu"
            aria-invalid={!!state?.errors?.name}
            required
          />
          <FieldError message={state?.errors?.name?.[0]} />
        </div>

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
          <Label
            htmlFor="password"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Parolă
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
            htmlFor="yearOfStudy"
            className="mb-1.5 block text-[13px] font-medium text-fg-dim"
          >
            Anul de studiu
          </Label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            required
            aria-invalid={!!state?.errors?.yearOfStudy}
            defaultValue=""
            className="h-10 w-full rounded-[7px] border border-line bg-bg-3 px-3 text-[14px] text-fg outline-none transition-colors focus-visible:border-neon focus-visible:ring-2 focus-visible:ring-neon/25"
          >
            <option value="" disabled className="bg-bg-2 text-fg-mute">
              Selectează anul
            </option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-2">
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError message={state?.errors?.yearOfStudy?.[0]} />
        </div>

        {/* Marketing consent — opt-in. */}
        <div className="flex items-start gap-3 rounded-[7px] border border-line bg-bg-3/40 p-3">
          <Checkbox
            id="marketingOptIn"
            checked={marketingOptIn}
            onCheckedChange={(checked) =>
              setMarketingOptIn(checked === true)
            }
            className="mt-0.5 border-line-2 data-[state=checked]:border-neon data-[state=checked]:bg-neon data-[state=checked]:text-bg"
          />
          <input
            type="hidden"
            name="marketingOptIn"
            value={marketingOptIn ? "true" : "false"}
          />
          <Label
            htmlFor="marketingOptIn"
            className="text-[12px] leading-relaxed text-fg-dim"
          >
            Primesc newsletter, sfaturi de învățare și noutăți. Te poți
            dezabona oricând din profil.
          </Label>
        </div>

        <p className="text-center font-mono text-[11px] leading-relaxed tracking-mono-tight text-fg-mute">
          Prin crearea contului accept{" "}
          <Link
            href="/legal/terms"
            target="_blank"
            className="text-neon underline-offset-2 hover:underline"
          >
            Termenii
          </Link>{" "}
          și{" "}
          <Link
            href="/legal/privacy"
            target="_blank"
            className="text-neon underline-offset-2 hover:underline"
          >
            Politica
          </Link>
          .
        </p>

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>

      <AuthFootLink prompt="Ai deja cont?" href="/login" cta="Autentifică-te" />
    </AuthCard>
  )
}
