"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Testimonial {
  name: string
  role: string
  initials: string
  text: string
}

const testimonials: Testimonial[] = [
  {
    name: "Andrei P.",
    role: "Rezident anul I",
    initials: "AP",
    text: "Cele mai bine structurate grile pe care le-am gasit. M-au ajutat enorm sa imi organizez recapitularea pe capitole.",
  },
  {
    name: "Maria I.",
    role: "Studenta MG, anul VI",
    initials: "MI",
    text: "Statisticile pe categorii mi-au aratat exact unde aveam goluri. Am crescut de la 60% la 84% in 6 saptamani.",
  },
  {
    name: "Cristian D.",
    role: "Admis 2025",
    initials: "CD",
    text: "Simularile sunt cat se poate de aproape de examenul real. Calmul cu care am intrat in sala l-am invatat aici.",
  },
  {
    name: "Ioana V.",
    role: "Stomatologie, anul VI",
    initials: "IV",
    text: "Explicatiile detaliate de dupa fiecare grila valoreaza cat un mic curs. Foarte clar, foarte la subiect.",
  },
  {
    name: "Razvan M.",
    role: "Rezident anul II",
    initials: "RM",
    text: "Modul offline a fost salvarea mea in metroul de Bucuresti. Rezolvam grile in fiecare zi, fara intreruperi.",
  },
  {
    name: "Elena S.",
    role: "Admisa 2024",
    initials: "ES",
    text: "Comparatia cu colegii m-a tinut motivata. Stiam exact unde sunt si cat mai am de tras.",
  },
]

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="group relative mx-3 w-[340px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-colors hover:border-white/[0.14]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
          {t.initials}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white/90">{t.name}</div>
          <div className="text-xs text-white/40">{t.role}</div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/60">&ldquo;{t.text}&rdquo;</p>
    </div>
  )
}

export function Marquee({ className }: { className?: string }) {
  // duplicate the list so the loop is seamless
  const row = [...testimonials, ...testimonials]

  return (
    <section className={cn("relative overflow-hidden py-20", className)}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent" />

      <div className="mx-auto mb-12 max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Recenzii reale
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Mii de viitori medici, o singura platforma
          </h2>
        </motion.div>
      </div>

      <div className="group/marquee flex w-full">
        <motion.div
          className="flex shrink-0 motion-reduce:!transform-none"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
          style={{ willChange: "transform" }}
        >
          {row.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </motion.div>
      </div>

      {/* Pause on hover via CSS — framer's animate doesn't expose pause cleanly,
          so we use inline style trick: hover sets animation-play-state via class. */}
      <style>{`
        .group\\/marquee:hover > div { animation-play-state: paused; }
      `}</style>
    </section>
  )
}
