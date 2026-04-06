"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "Cat costa accesul la platforma?",
    a: "Primesti 45 de zile complet gratuite, fara sa introduci niciun card. Dupa perioada de proba, abonamentul este accesibil si poate fi anulat oricand din contul tau.",
  },
  {
    q: "Grilele sunt actualizate dupa programa oficiala?",
    a: "Da. Banca de intrebari este revizuita constant de echipa noastra in pas cu programa oficiala de rezidentiat si cu schimbarile anuale ale Ministerului Sanatatii.",
  },
  {
    q: "Pot folosi platforma pe telefon, fara internet?",
    a: "Absolut. Aplicatia este o PWA (Progressive Web App) si poate fi instalata direct pe iOS sau Android. Odata instalata, poti rezolva grile chiar si offline.",
  },
  {
    q: "Cat de aproape sunt simularile de examenul real?",
    a: "Simularile respecta exact formatul oficial: numar de intrebari, timp alocat si sistemul de scoring. Vei intra in sala de examen stiind exact la ce sa te astepti.",
  },
  {
    q: "Pot sa imi compar progresul cu al colegilor?",
    a: "Da. Vei vedea percentile anonime pentru fiecare simulare si pozitia ta in topul general, fara sa expui datele tale personale.",
  },
  {
    q: "Cum functioneaza explicatiile detaliate?",
    a: "Dupa fiecare grila ai acces la rationamentul complet, raspunsul corect motivat si referinte din bibliografia oficiala, ca sa poti aprofunda subiectul.",
  },
  {
    q: "Pot sa imi anulez abonamentul oricand?",
    a: "Sigur ca da. Anularea se face cu un click din contul tau si nu trebuie sa contactezi suportul. Iti pastrezi accesul pana la finalul perioadei platite.",
  },
  {
    q: "Cum imi protejati datele personale?",
    a: "Datele tale sunt stocate criptat si nu sunt impartasite cu terti. Suntem complet conformi GDPR si poti solicita oricand stergerea contului si a datelor asociate.",
  },
] as const

export function FaqSection() {
  return (
    <section className="relative py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
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
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
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
