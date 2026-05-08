import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Verificare email — grile-ReziNOTE",
}

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 grid size-16 place-items-center rounded-full bg-neon/12 text-neon">
          <Mail className="size-7" />
        </div>

        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-fg">
          Verifică email-ul.
        </h1>

        <p className="mt-2 text-[14px] leading-[1.55] text-fg-dim">
          Am trimis un link de confirmare la adresa ta. Accesează-l pentru a
          activa contul.
        </p>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-mono text-fg-mute">
          Nu ai primit? Verifică folder-ul de spam.
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
