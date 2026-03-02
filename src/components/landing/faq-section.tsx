"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Ce tip de intrebari sunt disponibile?",
    answer:
      "Platforma contine intrebari cu complement simplu (CS) si complement multiplu (CM), exact ca la examenul real de rezidentiat stomatologie. Fiecare intrebare are 5 variante de raspuns (A-E).",
  },
  {
    question: "Cum se calculeaza scorul?",
    answer:
      "Folosim formula oficiala romaneasca de punctare. Pentru CS: 4 puncte per raspuns corect. Pentru CM: punctaj per optiune (1 punct pentru fiecare optiune corecta selectata SAU optiune gresita neselectata), cu anulare la sub 2 sau peste 4 selectii. Scorul maxim este 950 puncte.",
  },
  {
    question: "Pot vedea daca as fi fost admis?",
    answer:
      "Da! Dupa fiecare simulare completa, platforma compara scorul tau cu pragurile istorice de admitere pe ultimii 5 ani, pe fiecare specialitate. Vei vedea exact la ce specialitati ai fi fost admis.",
  },
  {
    question: "Functioneaza pe telefon?",
    answer:
      "Da, platforma este optimizata complet pentru dispozitive mobile. Poti instala aplicatia direct din browser pe ecranul principal al telefonului pentru acces rapid.",
  },
  {
    question: "Cate intrebari sunt intr-o simulare?",
    answer:
      "O simulare completa contine 200 de intrebari, exact ca la examenul real: primele 50 sunt CS (complement simplu), iar urmatoarele 150 sunt CM (complement multiplu).",
  },
  {
    question: "Pot exersa pe capitole individuale?",
    answer:
      "Da! Pe langa simularea completa a examenului, poti exersa intrebari dintr-un singur capitol sau amestecate din mai multe capitole, fara limita de timp. Ideal pentru a-ti consolida cunostintele.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Intrebari frecvente
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Raspunsuri la cele mai comune intrebari
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-border/50 bg-card"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-base font-medium">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-border/50 px-6 pb-4 pt-3">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
