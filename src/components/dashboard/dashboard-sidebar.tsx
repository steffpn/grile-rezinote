"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookOpen, TrendingUp, History, ClipboardList, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard/overview", label: "Sumar", icon: BarChart3 },
  { href: "/dashboard/chapters", label: "Capitole", icon: BookOpen },
  { href: "/dashboard/trends", label: "Tendinte", icon: TrendingUp },
  { href: "/dashboard/tests", label: "Teste", icon: ClipboardList },
  { href: "/dashboard/history", label: "Raspunsuri", icon: History },
  { href: "/dashboard/ranking", label: "Clasament", icon: Trophy },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              isActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive && "text-emerald-700 dark:text-emerald-400")} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile: horizontal scrollable tab strip */}
      <nav
        className="lg:hidden -mx-4 mb-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard sections"
      >
        <ul className="flex min-w-max items-center gap-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-20 p-4">
          <h2 className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dashboard</h2>
          <NavLinks />
        </div>
      </aside>
    </>
  )
}
