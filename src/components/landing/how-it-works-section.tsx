"use client"

import { motion } from "framer-motion"
import { UserPlus, BookMarked, Trophy } from "lucide-react"
import { AnimatedBeam } from "./animated-beam"

const steps = [
  {
    icon: UserPlus,
    title: "Creezi cont",
    description:
      "Inregistrare in 30 de secunde. Primesti acces la perioada de proba, fara card.",
    badge: "01",
  },
  {
    icon: BookMarked,
    title: "Practici grile pe capitole",
    description:
      "Antrenament structurat pe materii si subteme, cu feedback imediat la fiecare raspuns.",
    badge: "02",
  },
  {
    icon: Trophy,
    title: "Dai simulari si vezi progresul",
    description:
      "Examene in conditii reale, statistici detaliate si comparatie cu colegii tai.",
    badge: "03",
  },
] as const

export function HowItWorksSection() {
  return (
    <section className="relative py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-teal-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Cum functioneaza
            </div>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              De la inregistrare la{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                examen promovat
              </span>
            </h2>
            <p className="mt-4 text-pretty text-base text-white/50 sm:text-lg">
              Trei pasi simpli, un singur obiectiv: sa stii materia mai bine
              decat te asteptai.
            </p>
          </motion.div>
        </div>

        {/* Steps with animated beam */}
        <div className="relative">
          {/* Beam — only visible on md+ where the row is horizontal */}
          <div className="absolute inset-x-0 top-12 hidden h-24 md:block">
            <AnimatedBeam variant="horizontal" />
          </div>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Icon disc */}
                  <div className="relative">
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-teal-500/30 blur-xl"
                    />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.01] backdrop-blur-sm">
                      <Icon className="h-9 w-9 text-emerald-300" />
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/30 bg-black text-[11px] font-semibold text-emerald-300">
                        {step.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-8 text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-pretty text-sm leading-relaxed text-white/50">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
