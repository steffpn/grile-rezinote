import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Marketing navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-primary">
            grile-ReziNOTE
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Autentificare</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Incepe gratuit</Link>
            </Button>
          </div>
        </nav>
      </header>

      {children}
    </>
  )
}
