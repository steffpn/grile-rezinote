import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

const adminLinks = [
  { href: "/admin", label: "Panou Admin" },
  { href: "/dashboard", label: "Dashboard" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <AppShell links={adminLinks} userEmail={user?.email ?? null}>
      {children}
    </AppShell>
  )
}
