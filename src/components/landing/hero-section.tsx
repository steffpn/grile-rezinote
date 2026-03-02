import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/20" />

      <div className="mx-auto max-w-4xl px-4 text-center">
        <Badge variant="secondary" className="mb-6 text-sm">
          Pregatire pentru rezidentiat stomatologie
        </Badge>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Pregateste-te pentru{" "}
          <span className="text-primary">Rezidentiat</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Simuleaza examene reale de rezidentiat si afla instant daca ai fi fost
          admis. Grile cu complement simplu si multiplu, punctaj oficial si
          comparatie cu pragurile istorice de admitere.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="min-w-[200px]">
            <Link href="/signup">Incepe gratuit</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-w-[200px]">
            <Link href="#features">Afla mai multe</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
