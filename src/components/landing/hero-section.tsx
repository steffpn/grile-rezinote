import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 gradient-hero opacity-[0.06] dark:opacity-[0.12]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-4xl px-4 text-center">
        <Badge variant="secondary" className="mb-8 gap-1.5 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Pregatire pentru rezidentiat stomatologie
        </Badge>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Pregateste-te pentru{" "}
          <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-[#8b5cf6] bg-clip-text text-transparent">
            Rezidentiat
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Simuleaza examene reale de rezidentiat si afla instant daca ai fi fost
          admis. Grile cu complement simplu si multiplu, punctaj oficial si
          comparatie cu pragurile istorice.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            asChild
            className="min-h-[52px] w-full min-w-[220px] rounded-full gradient-primary border-0 text-white text-base shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300 sm:w-auto"
          >
            <Link href="/signup">
              Incepe gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="min-h-[52px] w-full min-w-[220px] rounded-full border-border/60 text-base sm:w-auto"
          >
            <Link href="#features">Afla mai multe</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
