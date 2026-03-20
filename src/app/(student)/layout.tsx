import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"
import { getAuthUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { startTrial } from "@/lib/subscription/trial"
import { PaywallOverlay } from "@/components/paywall/PaywallOverlay"
import { PwaInstallPrompt } from "@/components/pwa/install-prompt"
import { AntiCopy } from "@/components/shared/anti-copy"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

const studentLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Teste Practice" },
  { href: "/exam", label: "Simulare" },
  { href: "/practice/mistakes", label: "Greselile mele" },
  { href: "/admission", label: "Admitere" },
  { href: "/subscription", label: "Abonament" },
]

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use cached auth — shared with page-level getCurrentUser() calls
  const user = await getAuthUser()

  let subscriptionAccess = null
  let showPaywall = false

  if (user) {
    subscriptionAccess = await checkSubscriptionAccess(user.id)

    // Start trial on first paid feature access
    if (subscriptionAccess.status === "trial_available") {
      await startTrial(user.id)
      // Re-check after starting trial
      subscriptionAccess = await checkSubscriptionAccess(user.id)
    }

    showPaywall = !subscriptionAccess.hasAccess
  }

  return (
    <AppShell links={studentLinks} userEmail={user?.email ?? null} showMobileTabBar>
      <AntiCopy />
      {/* Trial banner */}
      {subscriptionAccess?.status === "trialing" &&
        subscriptionAccess.trialDaysRemaining !== undefined && (
          <div className="border-b border-emerald-500/20 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Trial gratuit:{" "}
            <strong>
              {subscriptionAccess.trialDaysRemaining}{" "}
              {subscriptionAccess.trialDaysRemaining === 1 ? "zi" : "zile"}{" "}
              ramase
            </strong>
            .{" "}
            <a href="/pricing" className="underline hover:text-blue-900 dark:hover:text-blue-100">
              Aboneaza-te acum
            </a>
          </div>
        )}

      {children}

      {/* PWA install prompt for mobile users */}
      <PwaInstallPrompt />

      {/* Paywall overlay for expired users */}
      <PaywallOverlay isVisible={showPaywall} />
    </AppShell>
  )
}
