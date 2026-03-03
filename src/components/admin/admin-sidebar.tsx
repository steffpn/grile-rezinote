"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/chapters", label: "Capitole", icon: BookOpen },
  { href: "/admin/questions", label: "Intrebari", icon: HelpCircle },
  {
    href: "/admin/import-export",
    label: "Import / Export",
    icon: FileSpreadsheet,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Panou Admin</h2>
        <p className="text-xs text-muted-foreground">
          Gestionare continut
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                "w-full justify-start gap-3",
                isActive &&
                  "bg-primary/10 text-primary hover:bg-primary/15"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Button variant="ghost" asChild className="w-full justify-start gap-3">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard Student
          </Link>
        </Button>
      </div>
    </aside>
  )
}
