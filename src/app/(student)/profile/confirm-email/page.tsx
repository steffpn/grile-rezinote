import Link from "next/link"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { confirmEmailChange } from "@/lib/actions/account"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ConfirmEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const result = token
    ? await confirmEmailChange(token)
    : { success: false, error: "Lipseste tokenul de confirmare." }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {result.success ? (
        <>
          <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="mb-2 text-2xl font-semibold">
            Adresa de email a fost schimbata
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Vei folosi noua adresa la urmatoarea autentificare.
          </p>
        </>
      ) : (
        <>
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-semibold">
            Nu am putut confirma schimbarea
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{result.error}</p>
        </>
      )}

      <Link
        href="/profile"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Inapoi la profil
      </Link>
    </div>
  )
}
