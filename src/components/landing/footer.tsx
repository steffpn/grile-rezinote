import Link from "next/link"
import { Stethoscope, Github, Twitter, Instagram, BookOpen, ExternalLink } from "lucide-react"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"

const columns = [
  {
    title: "Produs",
    links: [
      { label: "Functionalitati", href: "/#features" },
      { label: "Cum functioneaza", href: "/#how" },
      { label: "Preturi", href: "/pricing" },
      { label: "Inregistrare", href: "/signup" },
    ],
  },
  {
    title: "Companie",
    links: [
      { label: "Despre noi", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termeni si conditii", href: "/legal/terms" },
      { label: "Confidentialitate", href: "/legal/privacy" },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="relative">
      {/* Gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">ReziNOT</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
              Pregatire serioasa pentru rezidentiat. Grile, simulari si
              statistici intr-o singura platforma.
            </p>

            <div className="mt-6 flex gap-3">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Github, href: "#", label: "GitHub" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/40 transition-colors hover:border-emerald-300/30 hover:bg-emerald-500/[0.06] hover:text-emerald-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-[36px] items-center text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Partner CTA — visible on every page */}
        <a
          href={REFERENCE_BOOKS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-12 flex flex-col items-start gap-3 rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.05] to-transparent p-5 transition-colors hover:border-emerald-300/30 hover:from-emerald-500/[0.12] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-500/10 text-emerald-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Cauti cartile de referinta?
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                Comanda manualele oficiale de pe Rezidentiat Medicina Dentara,
                partenerul nostru pentru bibliografie.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-colors group-hover:bg-emerald-500/15">
            Vezi cartile
            <ExternalLink className="h-3 w-3" />
          </span>
        </a>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
          <span className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} ReziNOT. Toate drepturile rezervate.
          </span>
          <span className="text-xs text-white/30">
            Construit cu grija pentru viitorii medici din Romania.
          </span>
        </div>
      </div>
    </footer>
  )
}
