import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Incepe pregatirea acum
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Nu lasa examenul de rezidentiat la voia intamplarii. Pregateste-te cu
          grile reale, scoring oficial si date istorice de admitere.
        </p>

        <div className="mt-8">
          <Button size="lg" asChild className="min-w-[240px]">
            <Link href="/signup">Creeaza cont gratuit</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Fara card de credit. Acces instant.
        </p>
      </div>
    </section>
  )
}
