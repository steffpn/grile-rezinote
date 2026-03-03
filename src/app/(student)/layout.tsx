import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"
import { createClient } from "@/lib/supabase/server"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { startTrial } from "@/lib/subscription/trial"
import { PaywallOverlay } from "@/components/paywall/PaywallOverlay"
import { PwaInstallPrompt } from "@/components/pwa/install-prompt"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

const studentLinks = [
  { href: "/", label: "Acasa" },
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
      {/* Trial banner */}
      {subscriptionAccess?.status === "trialing" &&
        subscriptionAccess.trialDaysRemaining !== undefined && (
          <div className="border-b bg-blue-50 px-4 py-2 text-center text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
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
