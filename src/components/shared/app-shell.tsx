import { NavHeader } from "@/components/shared/nav-header"
import { MobileTabBar } from "@/components/shared/mobile-tab-bar"

interface NavLink {
  href: string
  label: string
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
        className={`border-t border-white/[0.06] ${
          showMobileTabBar ? "hidden md:block" : ""
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 grile-ReziNOTE. Toate drepturile rezervate.
          </p>
        </div>
      </footer>

      {showMobileTabBar && <MobileTabBar />}
    </div>
  )
}
