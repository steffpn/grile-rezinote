import { Suspense } from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessGeneralDashboard } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  // FREE users don't get the dashboard — render a single upgrade blocker
  // instead of the sidebar + children. Sub-pages (chapters, ranking) still
  // layer their own PREMIUM gates on top when reached by PRO users.
  if (!canAccessGeneralDashboard(access.tier)) {
    return (
      <div className="mx-auto max-w-3xl p-4 lg:p-6">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Progresul tau in pregatirea pentru rezidentiat
          </p>
        </div>
        <UpgradeBlocker
          requiredTier="PRO"
          title="Dashboard cu progres si statistici"
          description="Urmareste-ti evolutia in timp: acuratete, numar de intrebari, serii zilnice si trend-uri. Planul FREE nu include dashboard-ul."
          benefits={[
            "Statistici generale: acuratete, intrebari, teste, serie zile",
            "Evolutia acuratetii in timp (grafic)",
            "Filtrare pe interval de timp si tip de test",
            "Istoricul complet al testelor si raspunsurilor",
            'Functia "Greselile mele" pentru a invata din erori',
          ]}
          alternativeAction={{
            href: "/practice",
            label: "Incepe un test practic",
          }}
          showStartTrial={access.trialAvailable}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Suspense>
        <DashboardSidebar tier={access.tier} />
      </Suspense>
      <main className="flex-1 overflow-auto">
        {/* Mobile header with menu trigger is inside DashboardSidebar */}
        <div className="p-4 lg:p-6 lg:pl-2">{children}</div>
      </main>
    </div>
  )
}
