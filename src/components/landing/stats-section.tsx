const stats = [
  {
    value: "200",
    label: "intrebari per simulare",
    description: "Identic cu examenul real",
  },
  {
    value: "950",
    label: "punctaj maxim posibil",
    description: "50 CS x 4 + 150 CM x 5",
  },
  {
    value: "5+",
    label: "ani de date istorice",
    description: "Praguri reale de admitere",
  },
  {
    value: "100%",
    label: "formula oficiala",
    description: "Scoring romanesc autentic",
  },
]

export function StatsSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pregatire bazata pe date reale
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Folosim date autentice din examenele de rezidentiat din Romania
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-primary sm:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-foreground">
                {stat.label}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
