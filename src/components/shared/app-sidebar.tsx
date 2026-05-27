"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Rocket,
  Settings,
  Target,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { NavLink } from "./app-shell"

import { UserMenu } from "./user-menu"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"

/**
 * Icon by route. Single source of truth — layouts cannot override
 * because passing component refs from server→client is not RSC-safe.
 */
const ROUTE_ICONS: Record<string, LucideIcon> = {
  // student
  "/dashboard": LayoutDashboard,
  "/practice": Target,
  "/practice/mistakes": BarChart3,
  "/exam": GraduationCap,
  "/admission": Rocket,
  "/subscription": Wallet,
  // admin
  "/admin": LayoutDashboard,
  "/admin/chapters": BookOpen,
  "/admin/questions": HelpCircle,
  "/admin/import-export": FileSpreadsheet,
  "/admin/specialties": GraduationCap,
  "/admin/admission-data": BarChart3,
  "/admin/settings": Settings,
}

function resolveIcon(link: NavLink): LucideIcon {
  return ROUTE_ICONS[link.href] ?? LayoutDashboard
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href
  // mistakes vs practice — mistakes is more specific, must match first
  if (href === "/practice/mistakes") return pathname.startsWith(href)
  if (href === "/practice") return pathname === href || (pathname.startsWith(href) && !pathname.startsWith("/practice/mistakes"))
  return pathname === href || pathname.startsWith(`${href}/`)
}

export interface AppSidebarProps {
  links: NavLink[]
  userEmail?: string | null
  /**
   * Variant for the top "brand" block — student vs admin uses the same logo
   * but different sublabel.
   */
  context?: "student" | "admin"
}

export function AppSidebar({
  links,
  userEmail,
  context = "student",
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 self-start flex-col border-r border-line bg-bg-2 lg:flex">
      {/* Brand */}
      <Link
        href={userEmail ? "/dashboard" : "/"}
        className="flex items-center gap-2.5 px-5 pt-6 pb-5"
        aria-label="grile-ReziNOTE — Acasă"
      >
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-lg bg-neon text-[13px] font-extrabold text-bg shadow-logo-glow"
        >
          R
        </span>
        <div className="min-w-0">
          <div className="text-[16px] font-bold leading-none tracking-[-0.02em] text-fg">
            grile-ReziNOTE
          </div>
          {context === "admin" && (
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-mono text-fg-mute">
              admin · panou
            </div>
          )}
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-0.5">
          {links.map((link) => {
            const Icon = resolveIcon(link)
            const active = isActive(pathname, link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[8px] px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                    active
                      ? "border-l-2 border-l-neon bg-neon/10 pl-[calc(0.875rem-2px)] text-neon"
                      : "border-l-2 border-l-transparent text-fg-dim hover:bg-bg-3 hover:text-fg",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.locked && link.requiredTier && (
                    <LockBadge tier={link.requiredTier} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Bibliography external link */}
        <a
          href={REFERENCE_BOOKS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-3 rounded-[8px] border border-l-2 border-line border-l-transparent bg-bg-3/40 px-3.5 py-2.5 text-[13px] text-fg-dim transition-colors hover:border-line-2 hover:text-fg"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Bibliografie</span>
          <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
        </a>
      </nav>

      {/* Footer — user pill */}
      <div className="border-t border-line p-3">
        {userEmail ? (
          <SidebarUserPill userEmail={userEmail} />
        ) : (
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-[8px] border border-line-2 text-[13.5px] text-fg hover:bg-bg-3"
          >
            Autentificare
          </Link>
        )}
      </div>
    </aside>
  )
}

function SidebarUserPill({ userEmail }: { userEmail: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-bg-3 px-2.5 py-2">
      <UserMenu userEmail={userEmail} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[12.5px] text-fg">
          {userEmail.split("@")[0]}
        </div>
        <div className="truncate font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
          {userEmail}
        </div>
      </div>
    </div>
  )
}

function LockBadge({ tier }: { tier: string }) {
  return (
    <span
      className={cn(
        "ml-auto inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight",
        tier === "PREMIUM"
          ? "bg-warm/15 text-warm"
          : "bg-neon/14 text-neon",
      )}
    >
      <Lock className="size-2.5" aria-hidden />
      {tier}
    </span>
  )
}
