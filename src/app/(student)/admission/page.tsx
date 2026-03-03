import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import {
  getAdmissionDataForExplorer,
  getAvailableYears,
} from "@/lib/db/queries/admission"
import { AdmissionExplorer } from "@/components/admission/AdmissionExplorer"

export const metadata: Metadata = {
  title: "Date Admitere | grile-ReziNOTE",
  description:
    "Exploreaza datele istorice de admitere la specialitatile dentare",
}

export default async function AdmissionExplorerPage() {
  const user = await getCurrentUser()

  // Check subscription -- explorer is subscriber-only
  const access = await checkSubscriptionAccess(user.id)
  if (!access.hasAccess) {
    redirect("/subscription")
  }

  const [specialtyData, availableYears] = await Promise.all([
    getAdmissionDataForExplorer(),
    getAvailableYears(),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Date Istorice de Admitere
        </h1>
        <p className="text-muted-foreground">
          Exploreaza pragurile de admitere per specialitate si an. Filtreaza
          dupa specialitate si interval de timp.
        </p>
      </div>

      <AdmissionExplorer
        specialtyData={specialtyData}
        availableYears={availableYears}
      />
    </div>
  )
}
