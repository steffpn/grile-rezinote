import * as React from "react"

import { AppSidebar } from "./app-sidebar"
import { AppShellMobileNav } from "./app-shell-mobile-nav"
import { AppTopbar } from "./app-topbar"
import { MobileTabBar } from "./mobile-tab-bar"
import type { PlanTier } from "@/lib/subscription/tiers"

export interface NavLink {
  href: string
  label: string
  /**
   * Icon picked by href via the client-side ROUTE_ICONS map in
   * app-sidebar / app-shell-mobile-nav. We deliberately do NOT accept
   * a component override here — that would force server components to
   * pass React component references across the server→client boundary,
   * which RSC cannot serialize (manifests as a runtime "Functions
   * cannot be passed directly to Client Components" error in prod).
   */
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
  /** Trailing slot pentru topbar (search, notifications etc.). */
  topbarTrailing?: React.ReactNode
  /** Variantă brand — default `student`. */
  context?: "student" | "admin"
  /**
   * When true, the sidebar/mobile-drawer footer renders a "Panou admin"
   * shortcut. Compute this server-side from the email whitelist — don't
   * leak the list to the browser.
   */
  isAdmin?: boolean
}

/**
 * AppShell — layout sidebar+topbar pentru `(student)` și `(admin)`.
 *
 * Spec § 3.2 — sidebar 240px stânga `--bg-2`, topbar 56px sticky cu blur,
 * main padding 32 40 (8 / 10 în Tailwind), max-w content 1320.
 *
 * Pe mobile (< lg) sidebar-ul e drawer prin AppShellMobileNav, iar
 * MobileTabBar persistent la bottom rezolvă navigația principală.
 */
export function AppShell({
  children,
  links = [],
  userEmail,
  showMobileTabBar = false,
  topbarTrailing,
  context = "student",
  isAdmin = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-bg text-fg">
      <AppSidebar
        links={links}
        userEmail={userEmail}
        context={context}
        isAdmin={isAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          trailing={
            <div className="flex items-center gap-2">
              {topbarTrailing}
              <AppShellMobileNav
                links={links}
                userEmail={userEmail}
                context={context}
                isAdmin={isAdmin}
              />
            </div>
          }
        />

        <main
          className={`flex-1 ${showMobileTabBar ? "pb-24 lg:pb-10" : "pb-10"}`}
        >
          <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>

      {showMobileTabBar && <MobileTabBar />}
    </div>
  )
}
