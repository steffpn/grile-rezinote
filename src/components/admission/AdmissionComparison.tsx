"use client"

import { Trophy, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { SpecialtyCard } from "./SpecialtyCard"
import type { AdmissionComparisonResult } from "@/lib/admission/comparison"

interface AdmissionComparisonProps {
  comparison: AdmissionComparisonResult
}

export function AdmissionComparison({ comparison }: AdmissionComparisonProps) {
  const { results, totalSpecialties, admittedSpecialties, userScore } =
    comparison

  if (results.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nu exista date istorice de admitere. Contacteaza administratorul
          pentru a adauga datele.
        </p>
      </Card>
    )
  }

  const totalYears =
    results.length > 0
      ? results[0].totalYears
      : 0

  return (
    <div className="space-y-6">
      {/* Summary stat */}
      <Card
        className={
          admittedSpecialties > 0
            ? "border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950"
            : "border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950"
        }
      >
        <div className="flex items-center gap-4">
          {admittedSpecialties > 0 ? (
            <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-400" />
          )}
          <div>
            <h3 className="text-2xl font-bold">
              {admittedSpecialties > 0
                ? `Ai fi fost admis la ${admittedSpecialties} din ${totalSpecialties} specialitati`
                : `Nu ai fi fost admis la nicio specialitate`}
            </h3>
            <p className="text-muted-foreground">
              Bazat pe scorul tau de {userScore} puncte si datele istorice din
              ultimii {totalYears} ani
            </p>
          </div>
        </div>
      </Card>

      {/* Specialty cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <SpecialtyCard
            key={result.specialty.id}
            result={result}
            userScore={userScore}
          />
        ))}
      </div>
    </div>
  )
}
