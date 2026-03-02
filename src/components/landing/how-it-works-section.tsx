import { UserPlus, BookOpen, FileText, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Creeaza cont",
    description:
      "Inregistreaza-te rapid cu email si parola. Configureaza-ti profilul si anul de studiu.",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Exerseaza",
    description:
      "Rezolva grile pe capitole individuale sau amestecate, fara limita de timp. Vezi raspunsul corect si sursa.",
  },
  {
    icon: FileText,
    number: "03",
    title: "Simuleaza",
    description:
      "Sustine un examen complet cu 200 de intrebari si cronometru. Afla scorul final cu formula oficiala.",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "Compara",
    description:
      "Vezi daca ai fi fost admis comparand scorul tau cu pragurile istorice de admitere pe specialitati.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cum functioneaza
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Patru pasi simpli catre pregatirea eficienta
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (hidden on mobile, shown on desktop between items) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-8 -translate-x-0 translate-y-0 bg-border lg:block" />
              )}

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>

              <div className="mb-2 text-sm font-semibold text-primary">
                Pasul {step.number}
              </div>

              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>

              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
