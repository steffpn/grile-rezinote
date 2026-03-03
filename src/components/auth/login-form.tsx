"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { login, type AuthState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full rounded-xl gradient-primary border-0 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
      disabled={pending}
    >
      {pending ? "Se conecteaza..." : "Autentificare"}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(login, null)

  return (
    <Card className="w-full max-w-md border-border/50 shadow-xl shadow-primary-500/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary-500/25">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Bine ai revenit!</CardTitle>
        <CardDescription>Conecteaza-te la contul tau</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="exemplu@email.com"
              className="rounded-xl"
              required
            />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parola</Label>
            <Input
              id="password"
              name="password"
              type="password"
              className="rounded-xl"
              required
            />
            {state?.errors?.password && (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <SubmitButton />
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Ai uitat parola?
        </Link>
        <div className="text-muted-foreground">
          Nu ai cont?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Inregistreaza-te
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
