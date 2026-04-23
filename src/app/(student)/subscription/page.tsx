import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getSubscriptionDetails } from "@/lib/stripe/actions"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { ManageSubscription } from "@/components/subscription/ManageSubscription"

export default async function SubscriptionPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [details, access] = await Promise.all([
    getSubscriptionDetails(session.user.id),
    checkSubscriptionAccess(session.user.id),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Gestioneaza abonamentul</h1>

      <div className="space-y-6">
        <SubscriptionStatus
          status={details?.status ?? "inactive"}
          tier={access.tier}
          planType={details?.planType ?? null}
          currentPeriodEnd={details?.currentPeriodEnd ?? null}
          cancelAtPeriodEnd={details?.cancelAtPeriodEnd ?? false}
          trialDaysRemaining={access.trialDaysRemaining}
        />

        <ManageSubscription
          status={details?.status ?? "inactive"}
          tier={access.tier}
          planType={details?.planType ?? null}
          cancelAtPeriodEnd={details?.cancelAtPeriodEnd ?? false}
        />

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/pricing" className="underline hover:text-foreground">
            Vezi toate planurile disponibile
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ai nevoie de ajutor? Contacteaza-ne la{" "}
          <a
            href="mailto:support@rezinote.ro"
            className="underline hover:text-foreground"
          >
            support@rezinote.ro
          </a>
        </p>
      </div>
    </div>
  )
}
