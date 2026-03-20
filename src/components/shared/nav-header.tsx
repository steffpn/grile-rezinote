"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, LogOut, GraduationCap } from "lucide-react"
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
  { href: "/dashboard", label: "Dashboard" },
]

export function NavHeader({
  links = defaultLinks,
  userEmail,
}: NavHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={userEmail ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span>
            <span className="text-foreground">Rezi</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">NOTE</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" className="rounded-full" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <ThemeToggle />
          {userEmail && (
            <>
              <span className="ml-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {userEmail}
              </span>
              <form action={logout}>
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-destructive" type="submit">
                  <LogOut className="mr-1 h-4 w-4" />
                  Iesi
                </Button>
              </form>
            </>
          )}
          {!userEmail && (
            <Button size="sm" className="rounded-full gradient-primary border-0 text-white shadow-md hover:shadow-lg transition-shadow" asChild>
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
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            {userEmail && (
              <>
                <div className="my-2 border-t border-border/50" />
                <span className="px-3 text-sm text-muted-foreground">
                  {userEmail}
                </span>
                <form action={logout}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Deconectare
                  </Button>
                </form>
              </>
            )}
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
