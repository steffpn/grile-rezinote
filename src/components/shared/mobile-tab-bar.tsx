"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Timer, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "Acasa", icon: Home },
  { href: "/practice", label: "Teste", icon: BookOpen },
  { href: "/exam", label: "Simulare", icon: Timer },
  { href: "/dashboard/overview", label: "Progres", icon: BarChart3 },
  { href: "/subscription", label: "Profil", icon: User },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl pb-safe md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : tab.href === "/dashboard/overview"
                ? pathname.startsWith("/dashboard/")
                : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-xs transition-all duration-200",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                isActive && "bg-primary/10 scale-110"
              )}>
                <tab.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              </div>
              <span className="leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
