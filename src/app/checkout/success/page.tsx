import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { getCheckoutSession } from "@/lib/stripe/actions"
import { TIER_DISPLAY, type PlanTier } from "@/lib/subscription/tiers"

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

  const tier: PlanTier = session?.tier ?? "PRO"
  const cycleLabel = session?.planType === "annual" ? "Anual" : "Lunar"
  const periodEnd = session?.currentPeriodEnd
    ? session.currentPeriodEnd.toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const features = TIER_DISPLAY[tier].features

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">
        Abonament activat cu succes!
      </h1>

      <p className="mb-8 text-muted-foreground">
        Planul <strong>{tier}</strong> ({cycleLabel}) este acum activ.
        {periodEnd && <> Urmatoarea facturare: {periodEnd}.</>}
      </p>

      <div className="mb-8 w-full rounded-lg border bg-card p-6 text-left">
        <h2 className="mb-4 font-semibold">Ce ai deblocat:</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
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
