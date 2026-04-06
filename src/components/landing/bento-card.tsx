"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BentoCardProps {
  className?: string
  children: ReactNode
  /** delay multiplier for stagger */
  index?: number
}

export function BentoCard({ className, children, index = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.06,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm transition-colors hover:border-white/[0.14]",
        className
      )}
    >
      {/* Gradient border glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(16,185,129,0.08), transparent 40%)",
        }}
      />
      {/* Subtle top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}
