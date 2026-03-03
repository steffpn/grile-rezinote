import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-12 text-center text-white shadow-2xl shadow-primary-500/25 sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Incepe pregatirea acum
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Nu lasa examenul de rezidentiat la voia intamplarii. Pregateste-te cu
              grile reale, scoring oficial si date istorice de admitere.
            </p>

            <div className="mt-10">
              <Button
                size="lg"
                asChild
                className="min-h-[52px] min-w-[260px] rounded-full bg-white text-base font-semibold text-primary-700 shadow-xl hover:bg-white/90 transition-all"
              >
                <Link href="/signup">
                  Creeaza cont gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Fara card de credit. Acces instant.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
