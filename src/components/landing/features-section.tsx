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
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    title: "Punctaj oficial",
    description:
      "Calculare automata a scorului cu formula oficiala romaneasca, inclusiv reguli de anulare CM.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Clock,
    title: "Simulare examen",
    description:
      "Simuleaza un examen real cu 200 de intrebari si cronometru, in conditii identice cu examenul.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Statistici detaliate",
    description:
      "Urmareste-ti progresul pe capitole, identifica punctele slabe si vezi evolutia in timp.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Award,
    title: "Comparatie admitere",
    description:
      "Afla daca ai fi fost admis pe baza datelor istorice reale de admitere pe ultimii 5 ani.",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    icon: Brain,
    title: "Exersare pe capitole",
    description:
      "Practica intrebari dintr-un singur capitol sau amestecate din toate, fara limita de timp.",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tot ce ai nevoie pentru pregatire
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Instrumente complete pentru a-ti maximiza sansele la admitere
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              <CardHeader>
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
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
