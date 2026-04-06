"use client"

import { motion } from "framer-motion"
import {
  BookOpenCheck,
  BarChart3,
  Users,
  Timer,
  WifiOff,
  Lightbulb,
} from "lucide-react"
import { BentoCard } from "./bento-card"

const features = [
  {
    icon: BookOpenCheck,
    title: "Grile actualizate",
    description:
      "Banca de intrebari revizuita constant, in pas cu programa oficiala de rezidentiat.",
    span: "md:col-span-2 md:row-span-2",
    hero: true,
  },
  {
    icon: BarChart3,
    title: "Statistici personale",
    description:
      "Vezi exact unde stai pe fiecare capitol, cu evolutie in timp si recomandari.",
    span: "md:col-span-2",
    hero: false,
  },
  {
    icon: Users,
    title: "Comparare cu colegii",
    description: "Top anonim si percentile pentru fiecare simulare.",
    span: "md:col-span-1",
    hero: false,
  },
  {
    icon: Timer,
    title: "Simulari examen",
    description: "Conditii reale de timp si scoring identic celui oficial.",
    span: "md:col-span-1",
    hero: false,
  },
  {
    icon: WifiOff,
    title: "Mod offline (PWA)",
    description: "Instaleaza aplicatia si invata oriunde, chiar si fara internet.",
    span: "md:col-span-2",
    hero: false,
  },
  {
    icon: Lightbulb,
    title: "Explicatii detaliate",
    description:
      "Fiecare raspuns vine cu rationamentul complet si referinte din bibliografie.",
    span: "md:col-span-2",
    hero: false,
  },
] as const

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-500/30 via-teal-500/15 to-transparent blur-3xl" />
      <div className="absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden>
        <defs>
          <pattern
            id="dots-feat"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
          <radialGradient id="dot-mask-feat" cx="70%" cy="30%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="dots-mask-feat">
            <rect width="100%" height="100%" fill="url(#dot-mask-feat)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dots-feat)"
          mask="url(#dots-mask-feat)"
        />
      </svg>

      <motion.div
        className="absolute right-6 top-6 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 backdrop-blur-sm"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        peste 12.000 grile
      </motion.div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="relative py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Tot ce ai nevoie pentru rezidentiat
            </div>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Construit pentru{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                rezultate reale
              </span>
            </h2>
            <p className="mt-4 text-pretty text-base text-white/50 sm:text-lg">
              Instrumentele de care ai nevoie ca sa intri pregatit in sala de
              examen, intr-un singur loc.
            </p>
          </motion.div>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <BentoCard key={f.title} index={i} className={f.span}>
                {f.hero && <HeroVisual />}
                <div className="relative flex h-full flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/15 to-teal-500/15 ring-1 ring-emerald-300/20">
                    <Icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className="text-lg font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                      {f.description}
                    </p>
                  </div>
                </div>
              </BentoCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
