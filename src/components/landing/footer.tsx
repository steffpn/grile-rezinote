import Link from "next/link"
import { Stethoscope } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-white/30">
              &copy; {new Date().getFullYear()} ReziNOT. Toate drepturile rezervate.
            </span>
          </div>

          <div className="flex gap-8 text-sm text-white/30">
            <Link
              href="/legal/terms"
              className="transition-colors hover:text-white/60"
            >
              Termeni si conditii
            </Link>
            <Link
              href="/legal/privacy"
              className="transition-colors hover:text-white/60"
            >
              Confidentialitate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
