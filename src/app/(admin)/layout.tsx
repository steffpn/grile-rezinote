import type { Metadata } from "next"
import { getCurrentAdmin } from "@/lib/db/queries/admin"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side superadmin check - redirects non-admins to /dashboard
  await getCurrentAdmin()

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
