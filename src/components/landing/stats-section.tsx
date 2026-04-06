"use client"

import { motion } from "framer-motion"
import { NumberTicker } from "./number-ticker"

const stats = [
  { value: 10000, suffix: "+", label: "Grile", detail: "CS si CM, identic cu examenul" },
  { value: 94, suffix: "%", label: "Rata succes", detail: "Studenti care promoveaza" },
  { value: 2400, suffix: "+", label: "Studenti activi", detail: "Comunitate in crestere" },
  { value: 150, suffix: "+", label: "Capitole", detail: "Acoperire completa a tematicii" },
]

export function StatsSection() {
  return (
    <section className="relative py-28 sm:py-36">
      {/* Separator line */}
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Subtle glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[300px] w-[700px] rounded-full bg-teal-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pregatire bazata pe{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              date reale
            </span>
          </h2>
          <p className="mt-5 text-lg text-white/45">
            Folosim date autentice din examenele de rezidentiat din Romania
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl p-[1px]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              {/* Gradient border */}
              <div
                className="absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.35), rgba(255,255,255,0.04) 40%, rgba(20,184,166,0.25) 100%)",
                }}
              />
              {/* Inner glass card */}
              <div className="relative h-full rounded-2xl bg-[#0a0a10]/90 p-7 text-center backdrop-blur-xl">
                <div
                  className="text-4xl font-extrabold tracking-tight sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
                    <NumberTicker value={stat.value} />
                    {stat.suffix}
                  </span>
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300/80">
                  {stat.label}
                </div>
                <div className="mt-1.5 text-xs text-white/40">{stat.detail}</div>

                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
