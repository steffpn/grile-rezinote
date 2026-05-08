import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getSubscriptionDetails } from "@/lib/stripe/actions"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { ManageSubscription } from "@/components/subscription/ManageSubscription"
import { SectionTag } from "@/components/branded"

export default async function SubscriptionPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [details, access] = await Promise.all([
    getSubscriptionDetails(),
    checkSubscriptionAccess(session.user.id),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <SectionTag>Abonament</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Tu deții controlul.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Anulezi instant. Schimbi ciclul când vrei. Toate facturile, în
          portalul Stripe.
        </p>
      </div>

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

      <div className="space-y-2 pt-4 text-center">
        <Link
          href="/pricing"
          className="font-mono text-[11.5px] uppercase tracking-mono text-fg-mute hover:text-neon"
        >
          ▸ Vezi toate planurile disponibile
        </Link>
        <p className="font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
          Suport ·{" "}
          <a
            href="mailto:support@rezinote.ro"
            className="text-fg-dim hover:text-neon"
          >
            support@rezinote.ro
          </a>
        </p>
      </div>
    </div>
  )
}
