import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { getCheckoutSession } from "@/lib/stripe/actions"

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/pricing")
  }

  const session = await getCheckoutSession(sessionId)

  const planName = session?.planType === "annual" ? "Anual" : "Lunar"
  const periodEnd = session?.currentPeriodEnd
    ? session.currentPeriodEnd.toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">
        Abonament activat cu succes!
      </h1>

      <p className="mb-8 text-muted-foreground">
        Planul tau <strong>{planName}</strong> este acum activ.
        {periodEnd && <> Urmatoarea facturare: {periodEnd}.</>}
      </p>

      <div className="mb-8 w-full rounded-lg border bg-card p-6 text-left">
        <h2 className="mb-4 font-semibold">Ce ai deblocat:</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Acces la toate grilele din banca de intrebari
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Simulari de examen nelimitate
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Statistici detaliate per capitol
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Comparatie cu praguri de admitere
          </li>
        </ul>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Incepe sa practici
      </Link>
    </div>
  )
}
