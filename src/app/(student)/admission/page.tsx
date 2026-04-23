import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessAdmissionModule } from "@/lib/subscription/gating"
import {
  getAdmissionDataForExplorer,
  getAvailableYears,
} from "@/lib/db/queries/admission"
import { getAdmissionChanceForUser } from "@/lib/db/queries/admission-chance"
import { AdmissionExplorer } from "@/components/admission/AdmissionExplorer"
import { AdmissionChanceEstimator } from "@/components/admission/AdmissionChanceEstimator"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export const metadata: Metadata = {
  title: "Admitere | grile-ReziNOTE",
  description:
    "Exploreaza datele istorice de admitere la specialitatile dentare si vezi sansele tale",
}

export default async function AdmissionExplorerPage() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!canAccessAdmissionModule(access.tier)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Modul Admitere</h1>
          <p className="text-muted-foreground">
            Date istorice si estimare sanse de admitere
          </p>
        </div>
        <UpgradeBlocker
          requiredTier="PREMIUM"
          title='Modul "Admitere" si estimare sanse'
          description="Afla unde te-ai fi clasat in anii precedenti pe baza scorurilor tale din simulari. Exploreaza pragurile istorice si proiecteaza-ti sansele pentru fiecare specialitate."
          benefits={[
            "Date istorice complete pentru toate specialitatile dentare",
            "Estimare automata a sanselor tale pe baza scorurilor tale din simulari",
            "Clasare pe specialitati — unde te-ai fi calificat in anii trecuti",
            "Comparatie intre specialitati pentru a planifica strategia",
            "Actualizari automate pe masura ce completezi noi simulari",
          ]}
        />
      </div>
    )
  }

  const [specialtyData, availableYears, chanceReport] = await Promise.all([
    getAdmissionDataForExplorer(),
    getAvailableYears(),
    getAdmissionChanceForUser(user.id),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Modul Admitere</h1>
        <p className="text-muted-foreground">
          Exploreaza pragurile istorice si vezi sansele tale pe baza
          simularilor.
        </p>
      </div>

      {/* Chance estimator — new PREMIUM feature */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Sansele tale de admitere</h2>
          <p className="text-sm text-muted-foreground">
            Proiectie bazata pe cel mai bun scor al tau fata de pragurile
            istorice.
          </p>
        </div>
        <AdmissionChanceEstimator report={chanceReport} />
      </section>

      {/* Historical explorer */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Date istorice de admitere
          </h2>
          <p className="text-sm text-muted-foreground">
            Filtreaza dupa specialitate si interval de timp.
          </p>
        </div>
        <AdmissionExplorer
          specialtyData={specialtyData}
          availableYears={availableYears}
        />
      </section>
    </div>
  )
}
