import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

const studentLinks = [
  { href: "/", label: "Acasa" },
  { href: "/dashboard", label: "Dashboard" },
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

  return (
    <AppShell links={studentLinks} userEmail={user?.email ?? null}>
      {children}
    </AppShell>
  )
}
