import type { Metadata } from "next"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Settings,
} from "lucide-react"

import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { getCurrentAdmin } from "@/lib/db/queries/admin"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

const links: NavLink[] = [
  { href: "/admin", label: "Sumar", icon: LayoutDashboard },
  { href: "/admin/chapters", label: "Capitole", icon: BookOpen },
  { href: "/admin/questions", label: "Întrebări", icon: HelpCircle },
  { href: "/admin/import-export", label: "Import / Export", icon: FileSpreadsheet },
  { href: "/admin/specialties", label: "Specialități", icon: GraduationCap },
  { href: "/admin/admission-data", label: "Date admitere", icon: BarChart3 },
  { href: "/admin/settings", label: "Setări", icon: Settings },
  { href: "/dashboard", label: "← Înapoi la student", icon: ArrowLeft },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side superadmin check — redirects non-admins to /dashboard.
  const admin = await getCurrentAdmin()

  return (
    <AppShell
      links={links}
      userEmail={admin?.email ?? null}
      context="admin"
    >
      {children}
    </AppShell>
  )
}
