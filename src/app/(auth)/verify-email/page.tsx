import type { Metadata } from "next"
import Link from "next/link"
import { Mail } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Verificare email — grile-ReziNOTE",
}

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold">Verifica-ti email-ul</h1>

        <p className="text-muted-foreground">
          Am trimis un email de confirmare la adresa ta. Acceseaza linkul din
          email pentru a-ti activa contul.
        </p>

        <p className="text-sm text-muted-foreground">
          Nu ai primit email-ul? Verifica folderul de spam.
        </p>

        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Inapoi la autentificare
        </Link>
      </CardContent>
    </Card>
  )
}
