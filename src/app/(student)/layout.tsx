import type { Metadata } from "next"
import { AppShell, type NavLink } from "@/components/shared/app-shell"
import { getAuthUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { startTrial } from "@/lib/subscription/trial"
import { PwaInstallPrompt } from "@/components/pwa/install-prompt"
import { AntiCopy } from "@/components/shared/anti-copy"
import { hasTierAtLeast, type PlanTier } from "@/lib/subscription/tiers"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

type LinkSpec = Omit<NavLink, "locked" | "requiredTier"> & {
  requiredTier: PlanTier
}

const linkSpecs: LinkSpec[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste Practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greselile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM" },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  let subscriptionAccess: Awaited<ReturnType<typeof checkSubscriptionAccess>> | null =
    null

  if (user) {
    subscriptionAccess = await checkSubscriptionAccess(user.id)

    // Start trial on first paid feature access.
    if (subscriptionAccess.status === "trial_available") {
      await startTrial(user.id)
      subscriptionAccess = await checkSubscriptionAccess(user.id)
    }
  }

  const tier = subscriptionAccess?.tier ?? "FREE"

  const links: NavLink[] = linkSpecs.map((spec) => ({
    href: spec.href,
    label: spec.label,
    requiredTier: spec.requiredTier,
    locked: !hasTierAtLeast(tier, spec.requiredTier),
  }))

  return (
    <AppShell
      links={links}
      userEmail={user?.email ?? null}
      showMobileTabBar
    >
      <AntiCopy />
      {/* Trial banner */}
      {subscriptionAccess?.status === "trialing" &&
        subscriptionAccess.trialDaysRemaining !== undefined && (
          <div className="border-b border-emerald-500/20 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Trial gratuit{" "}
            <strong>
              ({subscriptionAccess.tier})
            </strong>
            :{" "}
            <strong>
              {subscriptionAccess.trialDaysRemaining}{" "}
              {subscriptionAccess.trialDaysRemaining === 1 ? "zi" : "zile"}{" "}
              ramase
            </strong>
            .{" "}
            <a
              href="/pricing"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              Aboneaza-te acum
            </a>
          </div>
        )}

      {/* FREE-tier quota banner */}
      {subscriptionAccess?.tier === "FREE" &&
        subscriptionAccess.status !== "trialing" && (
          <div className="border-b border-amber-500/20 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 sm:text-sm">
            Planul FREE: 20 intrebari / zi, fara simulari si statistici.{" "}
            <a href="/pricing" className="font-semibold underline">
              Activeaza PRO sau PREMIUM
            </a>
          </div>
        )}

      {children}

      {/* PWA install prompt for mobile users */}
      <PwaInstallPrompt />
    </AppShell>
  )
}
