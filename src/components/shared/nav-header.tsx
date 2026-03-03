"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { logout } from "@/lib/auth/actions"

interface NavLink {
  href: string
  label: string
}

interface NavHeaderProps {
  links?: NavLink[]
  userEmail?: string | null
}

const defaultLinks: NavLink[] = [
  { href: "/", label: "Acasa" },
  { href: "/dashboard", label: "Dashboard" },
]

export function NavHeader({
  links = defaultLinks,
  userEmail,
}: NavHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 text-lg font-bold">
          <span className="text-foreground">Rezi</span>
          <span className="text-primary">NOTE</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <ThemeToggle />
          {userEmail && (
            <>
              <span className="ml-2 text-sm text-muted-foreground">
                {userEmail}
              </span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="mr-1 h-4 w-4" />
                  Deconectare
                </Button>
              </form>
            </>
          )}
          {!userEmail && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Autentificare</Link>
            </Button>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
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
        <nav className="border-t border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            {userEmail && (
              <>
                <div className="my-2 border-t border-border" />
                <span className="px-3 text-sm text-muted-foreground">
                  {userEmail}
                </span>
                <form action={logout}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="w-full justify-start"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Deconectare
                  </Button>
                </form>
              </>
            )}
            {!userEmail && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
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
