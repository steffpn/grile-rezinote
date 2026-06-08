"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export interface Faq {
  q: string
  a: ReactNode
}

/**
 * Client view for the landing FAQ — owns the accordion interaction and the
 * scroll-in animation. Content (including any live prices) is built by the
 * server {@link FaqSection} and passed in, so this stays free of data fetching.
 */
export function FaqSectionView({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="relative py-20 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Intrebari frecvente
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Tot ce vrei sa stii
            </h2>
            <p className="mt-4 text-pretty text-base text-white/50 sm:text-lg">
              Daca nu gasesti raspunsul, scrie-ne — raspundem in cel mai scurt
              timp.
            </p>
          </motion.div>
        </div>

        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            >
              <AccordionItem value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
