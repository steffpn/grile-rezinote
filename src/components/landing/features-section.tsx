import {
  BookOpen,
  Target,
  Clock,
  BarChart3,
  Award,
  Brain,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: BookOpen,
    title: "Grile CS & CM",
    description:
      "Intrebari cu complement simplu si complement multiplu, exact ca la examenul real de rezidentiat.",
  },
  {
    icon: Target,
    title: "Punctaj oficial",
    description:
      "Calculare automata a scorului cu formula oficiala romaneasca, inclusiv reguli de anulare CM.",
  },
  {
    icon: Clock,
    title: "Simulare examen",
    description:
      "Simuleaza un examen real cu 200 de intrebari si cronometru, in conditii identice cu examenul.",
  },
  {
    icon: BarChart3,
    title: "Statistici detaliate",
    description:
      "Urmareste-ti progresul pe capitole, identifica punctele slabe si vezi evolutia in timp.",
  },
  {
    icon: Award,
    title: "Comparatie admitere",
    description:
      "Afla daca ai fi fost admis pe baza datelor istorice reale de admitere pe ultimii 5 ani.",
  },
  {
    icon: Brain,
    title: "Exersare pe capitole",
    description:
      "Practica intrebari dintr-un singur capitol sau amestecate din toate, fara limita de timp.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tot ce ai nevoie pentru pregatire
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Instrumente complete pentru a-ti maximiza sansele la admitere
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
