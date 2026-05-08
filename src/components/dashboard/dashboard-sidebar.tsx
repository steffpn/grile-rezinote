"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  History,
  Lock,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { PlanTier } from "@/lib/subscription/tiers"
import { hasTierAtLeast } from "@/lib/subscription/tiers"

type NavItem = {
  href: string
  label: string
  icon: typeof BarChart3
  requiredTier: PlanTier
}

const navItems: NavItem[] = [
  { href: "/dashboard/overview", label: "Sumar", icon: BarChart3, requiredTier: "PRO" },
  { href: "/dashboard/chapters", label: "Capitole", icon: BookOpen, requiredTier: "PREMIUM" },
  { href: "/dashboard/trends", label: "Tendințe", icon: TrendingUp, requiredTier: "PRO" },
  { href: "/dashboard/tests", label: "Teste", icon: ClipboardList, requiredTier: "PRO" },
  { href: "/dashboard/history", label: "Răspunsuri", icon: History, requiredTier: "PRO" },
  { href: "/dashboard/ranking", label: "Clasament", icon: Trophy, requiredTier: "PREMIUM" },
]

interface DashboardSidebarProps {
  tier: PlanTier
}

/**
 * Sub-navigation pentru `/dashboard/*` — separat de sidebar-ul global app-shell
 * fiindcă dashboard-ul are propriile secțiuni (Sumar, Capitole, Tendințe etc.)
 * specifice analytics. Pe desktop apare ca o coloană secundară 240px lângă
 * conținut. Pe mobile colapsează într-un strip orizontal.
 */
export function DashboardSidebar({ tier }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile: chip strip orizontal */}
      <nav
        className="-mx-1 mb-4 overflow-x-auto px-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard sections"
      >
        <ul className="flex min-w-max items-center gap-1.5 py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const locked = !hasTierAtLeast(tier, item.requiredTier)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    isActive
                      ? "border-neon/40 bg-neon/10 text-neon"
                      : "border-line bg-bg-2 text-fg-dim hover:border-line-2 hover:text-fg",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {locked && <Lock className="size-3 text-warm" aria-hidden />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Desktop: sub-sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 space-y-3 pr-4">
          <div className="px-1 font-mono text-[10.5px] uppercase tracking-mono text-fg-mute">
            Dashboard · sumar
          </div>
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const locked = !hasTierAtLeast(tier, item.requiredTier)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13px] transition-colors",
                      isActive
                        ? "bg-neon/10 font-medium text-neon"
                        : locked
                          ? "text-fg-mute hover:bg-bg-2 hover:text-fg-dim"
                          : "text-fg-dim hover:bg-bg-2 hover:text-fg",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-[3px] bg-warm/15 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight text-warm">
                        <Lock className="size-2.5" aria-hidden />
                        {item.requiredTier}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>
    </>
  )
}
