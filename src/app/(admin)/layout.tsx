import type { Metadata } from "next"

import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { getCurrentAdmin } from "@/lib/db/queries/admin"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

// Icons resolved by href in app-sidebar / app-shell-mobile-nav.
// Don't pass component refs from here — RSC can't serialize them.
const links: NavLink[] = [
  { href: "/admin", label: "Sumar" },
  { href: "/admin/chapters", label: "Capitole" },
  { href: "/admin/questions", label: "Întrebări" },
  { href: "/admin/import-export", label: "Import / Export" },
  { href: "/admin/specialties", label: "Specialități" },
  { href: "/admin/admission-data", label: "Date admitere" },
  { href: "/admin/settings", label: "Setări" },
  { href: "/dashboard", label: "← Înapoi la student" },
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
