"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"

interface Faq {
  q: string
  a: ReactNode
}

const faqs: Faq[] = [
  {
    q: "Cat costa accesul la platforma?",
    a: (
      <>
        Ai 3 planuri:{" "}
        <strong>FREE</strong> (gratuit pentru totdeauna, 20 intrebari/zi),{" "}
        <strong>PRO la 119 RON/luna</strong> (grile nelimitate, simulari,
        greselile tale, dashboard de progres) si{" "}
        <strong>PREMIUM la 179 RON/luna</strong> (tot din PRO + analiza pe
        capitole si subcapitole, clasamente, modul Admitere cu estimarea
        sanselor). La plata anuala primesti 20% reducere. La primul abonament
        ai 7 zile de trial gratuit.
      </>
    ),
  },
  {
    q: "Care e diferenta intre FREE, PRO si PREMIUM?",
    a: (
      <>
        <strong>FREE</strong>: 20 de intrebari pe zi pe capitole, fara simulari
        si fara statistici. Bun pentru a te familiariza cu platforma.
        <br />
        <strong>PRO</strong>: grile nelimitate, simulari cu cronometru real,
        istoric complet, &bdquo;Greselile mele&rdquo; si dashboard cu progres
        general. Ideal pentru pregatirea serioasa.
        <br />
        <strong>PREMIUM</strong>: tot din PRO + analiza detaliata pe capitole
        si subcapitole, clasamente anonime intre utilizatori, modulul Admitere
        cu estimarea sanselor de admitere bazata pe scorurile tale. Pentru cei
        care vor un avantaj competitiv real.
      </>
    ),
  },
  {
    q: "Cum functioneaza trial-ul de 7 zile?",
    a: "La primul abonament PRO sau PREMIUM primesti automat 7 zile gratuite, fara obligatie. In aceste 7 zile ai acces la toate functiile PRO. Daca anulezi inainte de final, nu platesti nimic. Trial-ul se acorda o singura data pe cont.",
  },
  {
    q: "Grilele sunt actualizate dupa programa oficiala?",
    a: "Da. Banca de intrebari este revizuita constant de echipa noastra in pas cu programa oficiala de rezidentiat si cu schimbarile anuale ale Ministerului Sanatatii.",
  },
  {
    q: "Pot folosi platforma pe telefon?",
    a: "Da. Aplicatia este o PWA (Progressive Web App) si poate fi instalata direct pe iOS sau Android, cu o experienta fluenta, optimizata pentru mobil. Pentru a rezolva grile si a-ti sincroniza progresul ai nevoie de conexiune la internet.",
  },
  {
    q: "Cat de aproape sunt simularile de examenul real?",
    a: "Simularile respecta exact formatul oficial: numar de intrebari, timp alocat si sistemul de scoring. Vei intra in sala de examen stiind exact la ce sa te astepti.",
  },
  {
    q: "Pot sa imi compar progresul cu al colegilor?",
    a: "Da, cu planul PREMIUM. Vei vedea percentile anonime pentru fiecare simulare, pozitia ta in clasamentul general si distributia scorurilor, toate complet anonime. Participarea e opt-in.",
  },
  {
    q: "Cum functioneaza explicatiile detaliate?",
    a: "Dupa fiecare grila ai acces la rationamentul complet, raspunsul corect motivat si referinte din bibliografia oficiala, ca sa poti aprofunda subiectul.",
  },
  {
    q: "Unde gasesc cartile de referinta pentru intrebarile la care am gresit?",
    a: (
      <>
        Toate intrebarile au mentionata sursa (manualul si pagina) chiar in
        ecranul de feedback. Cand vrei sa aprofundezi un subiect sau sa
        comanzi cartea de referinta, le gasesti pe{" "}
        <a
          href={REFERENCE_BOOKS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-300 underline-offset-4 hover:underline"
        >
          Rezidentiat Medicina Dentara
        </a>
        , partenerul nostru pentru bibliografia oficiala.
      </>
    ),
  },
  {
    q: "Pot sa imi anulez abonamentul oricand?",
    a: "Sigur ca da. Anularea se face cu un click din contul tau si nu trebuie sa contactezi suportul. Iti pastrezi accesul pana la finalul perioadei platite.",
  },
  {
    q: "Cum imi protejati datele personale?",
    a: "Datele tale sunt stocate criptat si nu sunt impartasite cu terti. Suntem complet conformi GDPR si poti solicita oricand stergerea contului si a datelor asociate.",
  },
]

export function FaqSection() {
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
