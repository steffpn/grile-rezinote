"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Stethoscope, Menu, X, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { UserMenu } from "@/components/shared/user-menu"

interface MarketingNavProps {
  userEmail: string | null
}

/**
 * Public marketing navigation. Rendered by the marketing layout (server) with
 * the current session handed in so logged-in users don't see "Autentificare /
 * Incepe gratuit" on pages like /pricing (which was confusing — nav looked
 * logged-out while the app still had the session).
 */
export function MarketingNav({ userEmail }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isAuthenticated = Boolean(userEmail)

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 transition-shadow group-hover:shadow-emerald-500/40">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-white">Rezi</span>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NOT
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/#features"
            className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            Functionalitati
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            Cum functioneaza
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            Preturi
          </Link>
          <Link
            href="/#faq"
            className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            FAQ
          </Link>
          <div className="ml-4 flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:brightness-110 transition-all"
                  asChild
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <UserMenu userEmail={userEmail!} variant="marketing" />
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
                  asChild
                >
                  <Link href="/login">Autentificare</Link>
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:brightness-110 transition-all"
                  asChild
                >
                  <Link href="/signup">Incepe gratuit</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <UserMenu userEmail={userEmail!} variant="marketing" />
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Inchide meniul" : "Deschide meniul"}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06]"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
            className="overflow-hidden border-t border-white/[0.06] bg-[#050508]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
              <Link
                href="/#features"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base text-white/70 hover:bg-white/[0.04] hover:text-white min-h-[44px] flex items-center"
              >
                Functionalitati
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base text-white/70 hover:bg-white/[0.04] hover:text-white min-h-[44px] flex items-center"
              >
                Cum functioneaza
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base text-white/70 hover:bg-white/[0.04] hover:text-white min-h-[44px] flex items-center"
              >
                Preturi
              </Link>
              <Link
                href="/#faq"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base text-white/70 hover:bg-white/[0.04] hover:text-white min-h-[44px] flex items-center"
              >
                FAQ
              </Link>
              <div className="mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button
                    asChild
                    className="min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      asChild
                      className="min-h-[48px] rounded-xl border-white/10 text-white hover:bg-white/[0.06]"
                    >
                      <Link href="/login">Autentificare</Link>
                    </Button>
                    <Button
                      asChild
                      className="min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white"
                    >
                      <Link href="/signup">Incepe gratuit</Link>
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
