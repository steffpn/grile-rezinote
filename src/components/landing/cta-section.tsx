"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CtaSection() {
  const reduce = useReducedMotion()

  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-32">
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] sm:rounded-[2.5rem]"
        >
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-600/15 to-cyan-600/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Floating orbs */}
          <motion.div
            className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl"
            animate={
              reduce
                ? undefined
                : { x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }
            }
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-400/25 blur-3xl"
            animate={
              reduce
                ? undefined
                : { x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }
            }
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Noise / grain texture */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
            aria-hidden
          >
            <filter id="cta-noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#cta-noise)" />
          </svg>

          {/* Grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
              backgroundSize: "56px 56px",
            }}
          />

          {/* Content */}
          <div className="relative px-5 py-16 text-center sm:px-12 sm:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              45 de zile gratuite, fara card
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-6xl"
            >
              Pregateste-te ca un{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-cyan-200 bg-clip-text text-transparent">
                viitor medic
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-base text-white/70 sm:text-lg"
            >
              Acces complet la grile, simulari si statistici. Anuleaza oricand,
              fara intrebari.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 flex justify-center"
            >
              <Button
                asChild
                size="lg"
                className="group min-h-[52px] w-full max-w-[320px] rounded-full bg-white px-8 text-base font-semibold text-emerald-900 shadow-xl shadow-emerald-500/20 hover:bg-emerald-50 sm:h-14 sm:w-auto"
              >
                <Link href="/register">
                  Incepe gratuit
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
