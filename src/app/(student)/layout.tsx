import type { Metadata } from "next"
import { AppShell } from "@/components/shared/app-shell"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

const studentLinks = [
  { href: "/", label: "Acasă" },
  { href: "/dashboard", label: "Dashboard" },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell links={studentLinks}>{children}</AppShell>
}
