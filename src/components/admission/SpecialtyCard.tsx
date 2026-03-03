"use client"

import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SpecialtyAdmissionResult } from "@/lib/admission/comparison"

interface SpecialtyCardProps {
  result: SpecialtyAdmissionResult
  userScore: number
}

export function SpecialtyCard({ result, userScore }: SpecialtyCardProps) {
  const { specialty, years, admittedCount, totalYears } = result
  const isAdmitted = admittedCount > totalYears / 2

  return (
    <Card
      className={
        isAdmitted
          ? "border-green-200 dark:border-green-800"
          : "border-red-200 dark:border-red-800"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{specialty.name}</CardTitle>
          <Badge
            variant={isAdmitted ? "default" : "destructive"}
            className={
              isAdmitted
                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200"
                : ""
            }
          >
            {isAdmitted
              ? `Admis in ${admittedCount} din ${totalYears} ani`
              : `Neadmis`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {years.map((year) => (
            <div
              key={year.year}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                year.admitted
                  ? "bg-green-50 dark:bg-green-950/30"
                  : "bg-red-50 dark:bg-red-950/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {year.admitted ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className="font-medium">{year.year}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Prag: {year.threshold}</span>
                <span>{year.spots} locuri</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
          <span>Scorul tau: {userScore}</span>
          <span>
            {admittedCount > 0
              ? `Admis in ${admittedCount} din ${totalYears} ani`
              : `Sub prag in toti ${totalYears} ani`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
