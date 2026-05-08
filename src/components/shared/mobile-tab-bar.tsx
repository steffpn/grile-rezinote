"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookOpen, Home, Timer, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "Acasă", icon: Home },
  { href: "/practice", label: "Teste", icon: BookOpen },
  { href: "/exam", label: "Simulare", icon: Timer },
  { href: "/dashboard/overview", label: "Progres", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
]

/**
 * MobileTabBar — bottom nav fixed la bottom pentru mobile (< lg). Înlocuiește
 * sidebar-ul desktop pentru navigația principală pe ecrane mici.
 */
export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-2/[0.92] pb-safe backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : tab.href === "/dashboard/overview"
                ? pathname.startsWith("/dashboard/")
                : pathname.startsWith(tab.href)

          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-[10px] px-3 text-[10px] font-medium uppercase tracking-mono-tight transition-colors",
                isActive
                  ? "text-neon"
                  : "text-fg-mute hover:text-fg-dim",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-[8px] transition-colors",
                  isActive && "bg-neon/12",
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
