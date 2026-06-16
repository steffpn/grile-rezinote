import Link from "next/link"

import { canViewAuthPages } from "@/lib/auth/staff-preview"
import { RegistrationClosed } from "@/components/auth/registration-closed"

/**
 * Auth layout — centered card 440px pe `--bg`, conform spec § 3.1.
 *
 * Logo glyph "R" în `--neon` cu glow (același mark ca în nav landing). Form
 * card-ul este randat din pages/components individuale ca să poată varia în
 * conținut (login vs signup vs verify) păstrând shell-ul comun.
 *
 * Pre-launch the whole auth surface (login / signup / forgot / update / verify)
 * is hidden behind the waitlist — only staff with the preview cookie see the
 * real forms. See canViewAuthPages() / /staff-access.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const buildYear = new Date().getFullYear()
  const allowed = await canViewAuthPages()

  return (
    <div className="relative flex min-h-svh flex-col bg-bg">
      {/* Background grid subtle — același pattern ca în hero, dar mai discret. */}
      <div
        aria-hidden
        className="bg-brand-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-[0.25]"
      />

      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
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
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          {allowed ? children : <RegistrationClosed />}
        </div>
      </main>

      <footer className="relative z-10 px-6 py-6 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-mono text-fg-mute">
          © {buildYear} grile-ReziNOTE · Făcut în Cluj
        </p>
      </footer>
    </div>
  )
}
