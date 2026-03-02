import { NavHeader } from "@/components/shared/nav-header"

interface NavLink {
  href: string
  label: string
}

interface AppShellProps {
  children: React.ReactNode
  links?: NavLink[]
}

export function AppShell({ children, links }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader links={links} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 grile-ReziNOTE. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  )
}
