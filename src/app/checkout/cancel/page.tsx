import Link from "next/link"
import { XCircle } from "lucide-react"

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="mb-2 text-2xl font-bold">Plata a fost anulata</h1>

      <p className="mb-8 text-muted-foreground">
        Nu ai fost taxat. Poti reveni oricand pentru a te abona.
      </p>

      <div className="flex gap-4">
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Inapoi la planuri
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Inapoi la dashboard
        </Link>
      </div>
    </div>
  )
}
