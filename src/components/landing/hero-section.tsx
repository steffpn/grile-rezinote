"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AuroraBackground } from "./aurora-background"
import { Spotlight } from "./spotlight"
import { HeroOrb } from "./hero-orb"

const headlineWords = ["Pregateste-te", "pentru"]
const accentWord = "Rezidentiat"

export function HeroSection() {
  const reduced = useReducedMotion()

  const wordVariant = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        delay: 0.15 + i * 0.08,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    }),
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      <AuroraBackground />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-28 pb-16 sm:px-6 sm:gap-12 sm:pt-32 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:pt-40">
        {/* LEFT: text content */}
        <div className="lg:col-span-7 text-center lg:text-left min-w-0">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] leading-tight text-emerald-300 backdrop-blur-sm sm:px-5 sm:py-2 sm:text-sm">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate">Pregatire pentru rezidentiat stomatologie</span>
            </div>
          </motion.div>

          {/* Headline — word-by-word reveal */}
          <h1
            className="mt-6 text-[2.25rem] font-extrabold leading-[1.05] tracking-tight sm:mt-8 sm:text-6xl lg:text-7xl xl:text-8xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={wordVariant}
                initial="hidden"
                animate="show"
                className="mr-3 inline-block text-white"
              >
                {word}
              </motion.span>
            ))}
            <br className="hidden sm:block" />
            <motion.span
              custom={headlineWords.length}
              variants={wordVariant}
              initial="hidden"
              animate="show"
              className="inline-block bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% 100%",
                animation: reduced ? undefined : "hero-shine 6s linear infinite",
              }}
            >
              {accentWord}
            </motion.span>
          </h1>

          {/* Subheadline */}
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:mt-8 sm:text-xl lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            Simuleaza examene reale cu grile CS si CM, punctaj oficial si
            comparatie cu pragurile istorice de admitere. Tot ce ai nevoie
            intr-un singur loc.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4 lg:items-start lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            <Spotlight className="w-full sm:w-auto">
              <Button
                size="lg"
                asChild
                className="group min-h-[52px] w-full sm:w-auto sm:min-w-[220px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-base font-semibold text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
              >
                <Link href="/signup">
                  Incepe gratuit
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </Spotlight>
            <Spotlight className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="min-h-[52px] w-full sm:w-auto sm:min-w-[220px] rounded-full border-white/15 bg-white/[0.04] text-base text-white/85 backdrop-blur-sm hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all duration-300"
              >
                <Link href="#pricing">Vezi planurile</Link>
              </Button>
            </Spotlight>
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="mt-6 text-sm text-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            Fara card de credit &middot; Acces instant &middot; 45 zile gratuit
          </motion.p>
        </div>

        {/* RIGHT: animated orb (desktop only) */}
        <motion.div
          className="relative hidden lg:col-span-5 lg:block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <HeroOrb />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes hero-shine {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </section>
  )
}
