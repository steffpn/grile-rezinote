import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Grile CS & CM",
    description:
      "Întrebări cu complement simplu și complement multiplu, exact ca la examen.",
    badge: "200 întrebări",
  },
  {
    title: "Punctaj oficial",
    description:
      "Calculare automată a scorului cu formula oficială de rezidențiat, inclusiv anulare CM.",
    badge: "Formulă oficială",
  },
  {
    title: "Simulare examen",
    description:
      "Simulează un examen real cu 200 de întrebări și cronometru integrat.",
    badge: "Timp real",
  },
  {
    title: "Statistici detaliate",
    description:
      "Urmărește-ți progresul pe capitole și identifică punctele slabe.",
    badge: "Analiză",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-16 py-12">
      {/* Hero section */}
      <section className="flex max-w-3xl flex-col items-center gap-6 text-center">
        <Badge variant="secondary" className="text-sm">
          Pregătire pentru rezidențiat stomatologie
        </Badge>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Pregătește-te pentru{" "}
          <span className="text-primary">Rezidențiat</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Simulează examene reale și află instant dacă ai fi fost admis.
          Grile cu complement simplu și multiplu, punctaj oficial și
          statistici detaliate.
        </p>

        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/login">Începe acum</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Află mai multe</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <Badge variant="outline">{feature.badge}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* CTA bottom */}
      <section className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold">
          Scor maxim: <span className="text-primary">950 puncte</span>
        </h2>
        <p className="text-muted-foreground">
          50 CS &times; 4 puncte + 150 CM &times; 5 puncte. Pregătește-te
          cu grile reale și obține admiterea la specialitatea dorită.
        </p>
      </section>
    </div>
  )
}
