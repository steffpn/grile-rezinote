import Link from "next/link"
import { Target, TrendingUp, AlertCircle, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdmissionChanceReport } from "@/lib/db/queries/admission-chance"

interface AdmissionChanceEstimatorProps {
  report: AdmissionChanceReport
}

function confidenceTone(rate: number): {
  label: string
  badgeClass: string
  barClass: string
} {
  if (rate >= 0.8) {
    return {
      label: "Sansa foarte buna",
      badgeClass:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      barClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
    }
  }
  if (rate >= 0.5) {
    return {
      label: "Sansa buna",
      badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      barClass: "bg-gradient-to-r from-sky-500 to-cyan-500",
    }
  }
  if (rate >= 0.2) {
    return {
      label: "Sansa medie",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      barClass: "bg-gradient-to-r from-amber-500 to-orange-500",
    }
  }
  return {
    label: "Sansa scazuta",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    barClass: "bg-gradient-to-r from-rose-500 to-pink-500",
  }
}

export function AdmissionChanceEstimator({
  report,
}: AdmissionChanceEstimatorProps) {
  if (!report.hasSimulation) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            Completeaza o simulare pentru estimare
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Estimarea sanselor de admitere se bazeaza pe scorul tau din
            simulari. Completeaza cel putin o simulare completa pentru a vedea
            unde te-ai fi clasat in anii precedenti.
          </p>
          <Link
            href="/exam"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:shadow-md"
          >
            <Target className="h-4 w-4" />
            Incepe o simulare
          </Link>
        </CardContent>
      </Card>
    )
  }

  const bestPct =
    report.bestScore != null && report.maxScore
      ? Math.round((report.bestScore / report.maxScore) * 100)
      : null
  const overallPct = Math.round(report.overallRate * 100)

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Trophy className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cel mai bun scor</p>
              <p className="text-xl font-bold tabular-nums">
                {report.bestScore}
                {report.maxScore && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{report.maxScore}
                    {bestPct != null && (
                      <span className="ml-2 text-xs">({bestPct}%)</span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <TrendingUp className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scor mediu</p>
              <p className="text-xl font-bold tabular-nums">
                {report.avgScore ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {report.simulationCount}{" "}
                {report.simulationCount === 1 ? "simulare" : "simulari"}{" "}
                completate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Sansa medie de admitere
              </p>
              <p className="text-xl font-bold tabular-nums">{overallPct}%</p>
              <p className="text-xs text-muted-foreground">
                media pe {report.specialties.length}{" "}
                {report.specialties.length === 1
                  ? "specialitate"
                  : "specialitati"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-specialty breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Sanse pe specialitati — cu scorul tau actual
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Proiectie bazata pe scorul cel mai bun al tau vs. pragurile
            istorice de admitere. Cat din ultimii ani te-ai fi calificat.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.specialties.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nu sunt inregistrate praguri de admitere in baza de date.
            </p>
          ) : (
            report.specialties.map((s) => {
              const pct = Math.round(s.qualifyingRate * 100)
              const tone = confidenceTone(s.qualifyingRate)
              return (
                <div
                  key={s.specialtyId}
                  className="rounded-lg border border-border/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{s.specialtyName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ultim prag ({s.latestYear}):{" "}
                        <span className="font-medium tabular-nums">
                          {s.latestThreshold}
                        </span>{" "}
                        · Prag mediu:{" "}
                        <span className="font-medium tabular-nums">
                          {Math.round(s.avgThreshold)}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.badgeClass}`}
                    >
                      {tone.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${tone.barClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="min-w-[80px] text-right text-sm font-semibold tabular-nums">
                      {s.yearsQualified}/{s.yearsEvaluated} ani ({pct}%)
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Estimarea este orientativa si se bazeaza exclusiv pe scorurile tale
        istorice vs. pragurile de admitere din anii precedenti. Pragurile pot
        varia in viitor in functie de numarul de candidati si de dificultate.
      </p>
    </div>
  )
}
