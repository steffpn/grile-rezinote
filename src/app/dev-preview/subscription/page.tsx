/**
 * Dev preview: pagina /subscription cu mock data — status PRO active anual,
 * Manage cards, link suport.
 */
import Link from "next/link"

import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { ManageSubscription } from "@/components/subscription/ManageSubscription"
import { SectionTag } from "@/components/branded"

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM", locked: true },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

export default function SubscriptionPreview() {
  // 47 zile în viitor pentru next billing
  const nextBilling = new Date(Date.now() + 47 * 24 * 60 * 60 * 1000)

  return (
    <AppShell
      links={studentLinks}
      userEmail="ana.popescu@yahoo.com"
      showMobileTabBar
      context="student"
    >
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
          status="active"
          tier="PRO"
          planType="annual"
          currentPeriodEnd={nextBilling}
          cancelAtPeriodEnd={false}
        />

        <ManageSubscription
          status="active"
          tier="PRO"
          planType="annual"
          cancelAtPeriodEnd={false}
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
    </AppShell>
  )
}
