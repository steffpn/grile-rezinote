"use client"

import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PaywallOverlayProps {
  isVisible: boolean
}

export function PaywallOverlay({ isVisible }: PaywallOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 30%, rgba(16,185,129,0.18), transparent 70%), radial-gradient(40% 40% at 70% 80%, rgba(20,184,166,0.16), transparent 70%)",
            }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/95 p-8 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur"
          >
            {/* Animated lock */}
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 14,
                delay: 0.1,
              }}
              className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center"
            >
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <Lock className="h-6 w-6 text-white" />
              </span>
            </motion.div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              Aboneaza-te pentru acces complet
            </h2>

            <p className="mb-6 text-muted-foreground">
              Perioada ta de trial a expirat. Aboneaza-te pentru a continua sa
              practici si sa te pregatesti pentru examenul de rezidentiat.
            </p>

            <Link
              href="/pricing"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-7 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Vezi planurile
            </Link>

            <p className="mt-4 text-xs text-muted-foreground">
              Ai deja abonament?{" "}
              <button
                onClick={() => window.location.reload()}
                className="underline hover:text-foreground"
              >
                Reincarca pagina
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
