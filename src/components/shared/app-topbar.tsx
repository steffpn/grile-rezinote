"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Menu } from "lucide-react"

import { cn } from "@/lib/utils"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  practice: "Practică",
  mistakes: "Greșeli",
  exam: "Simulare",
  admission: "Admitere",
  subscription: "Abonament",
  profile: "Profil",
  overview: "Sumar",
  history: "Istoric",
  trends: "Tendințe",
  ranking: "Ranking",
  chapters: "Capitole",
  questions: "Întrebări",
  "import-export": "Import / Export",
  specialties: "Specialități",
  "admission-data": "Date admitere",
  settings: "Setări",
  admin: "Admin",
  results: "Rezultat",
}

function humanize(segment: string) {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

interface BreadcrumbCrumb {
  label: string
  href: string
  isLast: boolean
}

function buildCrumbs(pathname: string): BreadcrumbCrumb[] {
  const segments = pathname.split("/").filter(Boolean)
  // dynamic IDs (UUID-ish) — collapse to "În curs" / fallback
  return segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const isId = /^[0-9a-f-]{8,}$/i.test(seg)
    return {
      label: isId ? "În curs" : humanize(seg),
      href,
      isLast: i === segments.length - 1,
    }
  })
}

export interface AppTopbarProps {
  /** Slot pentru burger button pe mobile — randat de layout-ul părinte. */
  onMobileMenuToggle?: () => void
  /** Conținut suplimentar dreapta (ex: search box, notifications). */
  trailing?: React.ReactNode
}

/**
 * AppTopbar — sticky header cu breadcrumb din pathname și acțiuni dreapta.
 *
 * Spec § 3.2 — height 56, `--bg/0.78` blur 16, border-bottom `--line`,
 * breadcrumb mono 12 dim → fg pe last.
 */
export function AppTopbar({
  onMobileMenuToggle,
  trailing,
}: AppTopbarProps) {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-line bg-bg/[0.78] backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:pl-6 lg:pr-8">
        {/* Mobile burger */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="rounded-[8px] p-1.5 text-fg-dim hover:bg-bg-2 hover:text-fg lg:hidden"
            aria-label="Deschide meniul"
          >
            <Menu className="size-5" />
          </button>
        )}

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center font-mono text-[12px]"
        >
          <ol className="flex items-center gap-1.5">
            {crumbs.length === 0 && (
              <li className="text-fg-mute">— · —</li>
            )}
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {crumb.isLast ? (
                  <span className="text-fg">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-fg-mute hover:text-fg-dim"
                  >
                    {crumb.label}
                  </Link>
                )}
                {!crumb.isLast && (
                  <ChevronRight
                    className="size-3 shrink-0 text-fg-mute opacity-60"
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Trailing actions */}
        <div className={cn("flex shrink-0 items-center gap-1.5")}>
          {trailing}
        </div>
      </div>
    </header>
  )
}
