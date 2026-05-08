import { Suspense } from "react"

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessGeneralDashboard } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"
import { SectionTag } from "@/components/branded"

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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <SectionTag>Dashboard</SectionTag>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Progresul tău, în clar.
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
            Urmărește acuratețea, întrebările făcute și seriile zilnice. Plan
            FREE nu include dashboard-ul.
          </p>
        </div>
        <UpgradeBlocker
          requiredTier="PRO"
          title="Dashboard cu progres și statistici"
          description="Urmărește-ți evoluția în timp: acuratețe, număr de întrebări, serii zilnice și trend-uri. Planul FREE nu include dashboard-ul."
          benefits={[
            "Statistici generale: acuratețe, întrebări, teste, serie zile",
            "Evoluția acurateței în timp (grafic)",
            "Filtrare pe interval de timp și tip de test",
            "Istoricul complet al testelor și răspunsurilor",
            'Funcția "Greșelile mele" pentru a învăța din erori',
          ]}
          alternativeAction={{
            href: "/practice",
            label: "Începe un test practic",
          }}
          showStartTrial={access.trialAvailable}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <Suspense>
        <DashboardSidebar tier={access.tier} />
      </Suspense>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
