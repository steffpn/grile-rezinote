"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  LogOut,
  GraduationCap,
  BookOpen,
  Lock,
  CircleUser,
  CreditCard,
} from "lucide-react"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth/actions"
import type { NavLink } from "@/components/shared/app-shell"

interface NavHeaderProps {
  links?: NavLink[]
  userEmail?: string | null
}

const defaultLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
]

function LockBadge({ tier }: { tier: string }) {
  const isPremium = tier === "PREMIUM"
  return (
    <span
      className={`ml-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
        isPremium
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      <Lock className="h-2.5 w-2.5" />
      {tier}
    </span>
  )
}

/**
 * Avatar button that opens a dropdown menu with the user's email,
 * a link to account management, and the logout action. Replaces the
 * prior static email pill + inline logout button pattern.
 */
function UserMenu({ userEmail }: { userEmail: string }) {
  // Initials fallback for the avatar. Falls back to "U" if email is malformed.
  const initials =
    (userEmail[0]?.toUpperCase() ?? "") +
    (userEmail.split("@")[0]?.split(/[._-]/)[1]?.[0]?.toUpperCase() ?? "")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Meniu cont"
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 transition-all hover:from-emerald-500/30 hover:to-teal-500/30 hover:ring-emerald-500/40 dark:text-emerald-300"
        >
          {initials || <CircleUser className="h-5 w-5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Autentificat ca</p>
          <p className="truncate text-sm font-medium">{userEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/subscription" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Abonament
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconectare
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NavHeader({
  links = defaultLinks,
  userEmail,
}: NavHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={userEmail ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-lg font-bold"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span>
            <span className="text-foreground">Rezi</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              NOTE
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link href={link.href} className="flex items-center">
                {link.label}
                {link.locked && link.requiredTier && (
                  <LockBadge tier={link.requiredTier} />
                )}
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            asChild
          >
            <a
              href={REFERENCE_BOOKS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Bibliografie
            </a>
          </Button>
          <ThemeToggle />
          {userEmail ? (
            <UserMenu userEmail={userEmail} />
          ) : (
            <Button
              size="sm"
              className="rounded-full gradient-primary border-0 text-white shadow-md hover:shadow-lg transition-shadow"
              asChild
            >
              <Link href="/login">Autentificare</Link>
            </Button>
          )}
        </nav>

        {/* Mobile controls — avatar + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {userEmail && <UserMenu userEmail={userEmail} />}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Inchide meniul" : "Deschide meniul"}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <nav className="border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href={link.href} className="flex items-center">
                  <span className="flex-1">{link.label}</span>
                  {link.locked && link.requiredTier && (
                    <LockBadge tier={link.requiredTier} />
                  )}
                </Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start rounded-lg text-emerald-600 dark:text-emerald-400"
              asChild
              onClick={() => setMobileOpen(false)}
            >
              <a
                href={REFERENCE_BOOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Bibliografie
              </a>
            </Button>
            {!userEmail && (
              <Button
                size="sm"
                className="justify-start rounded-lg gradient-primary border-0 text-white"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/login">Autentificare</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
