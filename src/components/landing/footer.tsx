import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} grile-ReziNOTE. Toate drepturile
            rezervate.
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Termeni si conditii
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Politica de confidentialitate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
