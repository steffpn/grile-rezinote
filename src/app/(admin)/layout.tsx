import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

const adminLinks = [
  { href: "/admin", label: "Panou Admin" },
  { href: "/dashboard", label: "Dashboard" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell links={adminLinks}>{children}</AppShell>
}
