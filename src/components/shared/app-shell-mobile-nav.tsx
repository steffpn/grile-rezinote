"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Menu,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
  LayoutDashboard,
  Target,
  GraduationCap,
  Rocket,
  Wallet,
  BarChart3,
  Lock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserMenu } from "./user-menu"
import type { NavLink } from "./app-shell"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"

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
  if (href === "/practice/mistakes") return pathname.startsWith(href)
  if (href === "/practice") return pathname === href || (pathname.startsWith(href) && !pathname.startsWith("/practice/mistakes"))
  return pathname === href || pathname.startsWith(`${href}/`)
}

export interface AppShellMobileNavProps {
  links: NavLink[]
  userEmail?: string | null
  context?: "student" | "admin"
  /** Render the "Panou admin" shortcut in the footer. */
  isAdmin?: boolean
}

/**
 * Mobile drawer cu același conținut ca sidebar-ul desktop. Triggered de un
 * burger plasat în AppTopbar. Apare doar pe sub `lg`.
 */
export function AppShellMobileNav({
  links,
  userEmail,
  context = "student",
  isAdmin = false,
}: AppShellMobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="rounded-[8px] p-1.5 text-fg-dim hover:bg-bg-2 hover:text-fg lg:hidden"
          aria-label="Deschide meniul"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[260px] gap-0 border-line bg-bg-2 p-0 text-fg"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Navigație</SheetTitle>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-5">
            <Link
              href={userEmail ? "/dashboard" : "/"}
              className="flex items-center gap-2.5"
              onClick={() => setOpen(false)}
            >
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-lg bg-neon text-[13px] font-extrabold text-bg shadow-logo-glow"
              >
                R
              </span>
              <div className="leading-none">
                <div className="text-[15px] font-bold tracking-[-0.02em] text-fg">
                  grile-ReziNOTE
                </div>
                {context === "admin" && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-mono text-fg-mute">
                    admin · panou
                  </div>
                )}
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[8px] p-1 text-fg-mute hover:bg-bg-3 hover:text-fg"
              aria-label="Închide meniul"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="flex flex-col gap-0.5">
              {links.map((link) => {
                const Icon = resolveIcon(link)
                const active = isActive(pathname, link.href)
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-[8px] px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                        active
                          ? "border-l-2 border-l-neon bg-neon/10 pl-[calc(0.875rem-2px)] text-neon"
                          : "border-l-2 border-l-transparent text-fg-dim hover:bg-bg-3 hover:text-fg",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{link.label}</span>
                      {link.locked && link.requiredTier && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight",
                            link.requiredTier === "PREMIUM"
                              ? "bg-warm/15 text-warm"
                              : "bg-neon/14 text-neon",
                          )}
                        >
                          <Lock className="size-2.5" aria-hidden />
                          {link.requiredTier}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <a
              href={REFERENCE_BOOKS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 rounded-[8px] border border-line bg-bg-3/40 px-3.5 py-2.5 text-[13px] text-fg-dim hover:border-line-2 hover:text-fg"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Bibliografie</span>
              <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
            </a>
          </nav>

          {/* Footer */}
          <div className="border-t border-line p-3 space-y-2">
            {isAdmin && context !== "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[8px] border border-neon/30 bg-neon/8 px-3 py-2 text-[13px] text-neon transition-colors hover:border-neon/60 hover:bg-neon/12"
                aria-label="Deschide panoul de admin"
              >
                <ShieldCheck className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate font-medium">Panou admin</span>
                <span className="font-mono text-[9.5px] uppercase tracking-mono-tight text-neon/70">
                  ↗
                </span>
              </Link>
            )}
            {userEmail ? (
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
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-10 w-full items-center justify-center rounded-[8px] border border-line-2 text-[13.5px] text-fg hover:bg-bg-3"
              >
                Autentificare
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
