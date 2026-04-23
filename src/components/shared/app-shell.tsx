import { NavHeader } from "@/components/shared/nav-header"
import { MobileTabBar } from "@/components/shared/mobile-tab-bar"
import { BookOpen, ExternalLink } from "lucide-react"
import type { PlanTier } from "@/lib/subscription/tiers"

export interface NavLink {
  href: string
  label: string
  /** Tier required to access the target page. Optional for non-tiered links. */
  requiredTier?: PlanTier
  /** True when the current user's tier is below requiredTier. Renders a lock icon. */
  locked?: boolean
}

interface AppShellProps {
  children: React.ReactNode
  links?: NavLink[]
  userEmail?: string | null
  showMobileTabBar?: boolean
}

export function AppShell({
  children,
  links,
  userEmail,
  showMobileTabBar = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Subtle animated gradient blobs */}
      <div className="app-bg-blobs" />

      <NavHeader links={links} userEmail={userEmail} />

      <main
        className={`relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 ${
          showMobileTabBar ? "pb-24 md:pb-8" : ""
        }`}
      >
        {children}
      </main>

      <footer
        className={`border-t border-border ${
          showMobileTabBar ? "hidden md:block" : ""
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Partner CTA — same block as the marketing footer */}
          <a
            href="https://rezidentiat-medicina-dentara.ro/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-6 flex flex-col items-start gap-3 rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.05] to-transparent p-5 transition-colors hover:border-emerald-300/30 hover:from-emerald-500/[0.12] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-500/10 text-emerald-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Cauti cartile de referinta?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Comanda manualele oficiale de pe Rezidentiat Medicina
                  Dentara, partenerul nostru pentru bibliografie.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-colors group-hover:bg-emerald-500/15">
              Vezi cartile
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>

          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 grile-ReziNOTE. Toate drepturile rezervate.
          </p>
        </div>
      </footer>

      {showMobileTabBar && <MobileTabBar />}
    </div>
  )
}
