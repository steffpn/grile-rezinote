"use client"

import Link from "next/link"
import { useState } from "react"
import { LayoutDashboard, Menu, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/shared/user-menu"
import { cn } from "@/lib/utils"

interface MarketingNavProps {
  userEmail: string | null
}

const NAV_LINKS = [
  { href: "/#admission", label: "Admitere" },
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "Cum funcționează" },
  { href: "/pricing", label: "Preț" },
  { href: "/#faq", label: "Întrebări" },
]

/**
 * Marketing navigation — sticky, blur backdrop pe `--bg/0.78`, identitate
 * brand cu logo R neon glow. Spec § 1 Nav.
 */
export function MarketingNav({ userEmail }: MarketingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuthenticated = Boolean(userEmail)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/[0.78] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-5 py-4 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="grile-ReziNOTE — Acasă"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg bg-neon text-[13px] font-extrabold text-bg shadow-logo-glow"
          >
            R
          </span>
          <span className="text-[16px] font-bold tracking-[-0.02em] text-fg">
            grile-ReziNOTE
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13.5px] text-fg-dim transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTAs */}
        <div className="hidden items-center gap-2.5 md:flex">
          {isAuthenticated ? (
            <>
              <Button asChild size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
              </Button>
              <UserMenu userEmail={userEmail!} variant="marketing" />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup?source=landing-nav">
                  Începe gratuit
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <UserMenu userEmail={userEmail!} variant="marketing" />
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Închide meniul" : "Deschide meniul"}
            className="grid size-10 place-items-center rounded-[8px] text-fg-dim hover:bg-bg-2 hover:text-fg"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "overflow-hidden border-t border-line bg-bg-2/95 backdrop-blur-xl md:hidden",
            )}
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center rounded-[8px] px-3 py-2 text-[14px] text-fg-dim hover:bg-bg-3 hover:text-fg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="lg" className="w-full">
                      <Link href="/signup?source=landing-nav">
                        Începe gratuit
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
