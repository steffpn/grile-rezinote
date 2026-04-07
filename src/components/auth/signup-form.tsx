"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { signup, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2 } from "lucide-react"
import { GoogleButton } from "./google-button"

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
          Se creeaza contul...
        </>
      ) : (
        <>
          Creeaza cont
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signup, null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Creeaza-ti contul</h1>
        <p className="mt-2 text-sm text-white/40">
          Incepe pregatirea pentru rezidentiat in cateva secunde
        </p>
      </div>

      <GoogleButton label="Inregistreaza-te cu Google" callbackUrl="/dashboard" />

      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-white/[0.06]" />
        <span className="px-3 text-[11px] uppercase tracking-wider text-white/30">
          sau
        </span>
        <div className="flex-1 border-t border-white/[0.06]" />
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-white/60">
            Nume complet
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Ion Popescu"
            className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-base text-white placeholder:text-white/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 md:text-base"
            required
          />
          {state?.errors?.name && (
            <p className="text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>

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
            <p className="text-xs text-red-400">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-white/60">
            Parola
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-base text-white placeholder:text-white/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 md:text-base"
            required
          />
          <p className="text-xs text-white/25">
            Minim 8 caractere, cel putin o litera si o cifra
          </p>
          {state?.errors?.password && (
            <p className="text-xs text-red-400">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearOfStudy" className="text-sm text-white/60">
            Anul de studiu
          </Label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            required
            className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-base text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:border-emerald-500/40 focus-visible:ring-1 focus-visible:ring-emerald-500/20"
          >
            <option value="" className="bg-[#0a0a0f] text-white/40">Selecteaza anul</option>
            <option value="1" className="bg-[#0a0a0f]">Anul 1</option>
            <option value="2" className="bg-[#0a0a0f]">Anul 2</option>
            <option value="3" className="bg-[#0a0a0f]">Anul 3</option>
            <option value="4" className="bg-[#0a0a0f]">Anul 4</option>
            <option value="5" className="bg-[#0a0a0f]">Anul 5</option>
            <option value="6" className="bg-[#0a0a0f]">Anul 6</option>
          </select>
          {state?.errors?.yearOfStudy && (
            <p className="text-xs text-red-400">
              {state.errors.yearOfStudy[0]}
            </p>
          )}
        </div>

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-white/30">
        Ai deja cont?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Autentifica-te
        </Link>
      </div>
    </div>
  )
}
