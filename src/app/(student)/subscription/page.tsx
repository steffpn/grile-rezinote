import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getSubscriptionDetails } from "@/lib/stripe/actions"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { ManageSubscription } from "@/components/subscription/ManageSubscription"

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const details = await getSubscriptionDetails(user.id)
  const access = await checkSubscriptionAccess(user.id)

  // No subscription record at all — go to pricing
  if (!details) {
    redirect("/pricing")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Gestioneaza abonamentul</h1>

      <div className="space-y-6">
        <SubscriptionStatus
          status={details.status}
          planType={details.planType}
          currentPeriodEnd={details.currentPeriodEnd}
          cancelAtPeriodEnd={details.cancelAtPeriodEnd}
          trialDaysRemaining={access.trialDaysRemaining}
        />

        <ManageSubscription
          status={details.status}
          planType={details.planType}
          cancelAtPeriodEnd={details.cancelAtPeriodEnd}
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
