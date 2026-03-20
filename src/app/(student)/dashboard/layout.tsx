import { Suspense } from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Suspense>
        <DashboardSidebar />
      </Suspense>
      <main className="flex-1 overflow-auto">
        {/* Mobile header with menu trigger is inside DashboardSidebar */}
        <div className="p-4 lg:p-6 lg:pl-2">{children}</div>
      </main>
    </div>
  )
}
