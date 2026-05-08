import { Suspense } from "react"
import type { Metadata } from "next"
import { Trophy, Users } from "lucide-react"

import { fetchPeerComparison } from "@/lib/actions/peer"
import { Leaderboard } from "@/components/peer/leaderboard"
import { ScoreDistribution } from "@/components/peer/score-distribution"
import { PeerStatsCard } from "@/components/peer/peer-stats-card"
import { OptInToggle } from "@/components/peer/opt-in-toggle"
import { MonoLabel, SectionTag } from "@/components/branded"
import { getCurrentUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessRanking } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export const metadata: Metadata = {
  title: "Clasament | grile-ReziNOTE",
}

export default async function RankingPage() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!canAccessRanking(access.tier)) {
    return (
      <div className="space-y-8">
        <div>
          <SectionTag>Clasament</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Vezi unde ești.
          </h1>
        </div>
        <UpgradeBlocker
          requiredTier="PREMIUM"
          title="Clasamente și percentile"
          description="Vezi exact unde te situezi față de ceilalți candidați. Percentilă, distribuția scorurilor și leaderboard anonim."
          benefits={[
            "Leaderboard anonim cu top candidați",
            "Percentila ta în distribuția generală",
            "Distribuția scorurilor pe toate simulările",
            "Opt-in anonim — doar scorul tău e vizibil, nu identitatea",
            "Comparație cu media și vârful clasamentului",
          ]}
        />
      </div>
    )
  }

  const data = await fetchPeerComparison()
  const hasParticipants = data.stats.totalParticipants > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTag>Clasament</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Anonim. Cinstit. La zi.
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
            Compară-ți scorul cu ceilalți candidați la rezidențiat. Doar scorul
            tău e vizibil — niciodată identitatea.
          </p>
        </div>
        <OptInToggle initialOptedIn={data.userOptedIn} />
      </div>

      {!hasParticipants ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <Users className="size-6" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-fg">
            Clasamentul se populează în curând.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Datele apar după ce utilizatorii completează simulări de examen.
          </p>
        </div>
      ) : !data.userOptedIn ? (
        <div className="space-y-6">
          <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-8 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-neon/12 text-neon">
              <Trophy className="size-5" />
            </div>
            <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg">
              Activează participarea la clasament.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.55] text-fg-dim">
              Activează comutatorul de mai sus pentru a vedea clasamentul
              complet și poziția ta. Participarea e complet anonimă — doar
              scorul e vizibil.
            </p>
          </div>

          <Suspense>
            <PeerStatsCard stats={data.stats} />
          </Suspense>
        </div>
      ) : (
        <div className="space-y-6">
          <PeerStatsCard stats={data.stats} />

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="rounded-[14px] border border-line bg-bg-2 p-5 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="size-4 text-neon" />
                <MonoLabel size="cell">Top clasament</MonoLabel>
              </div>
              <Leaderboard rankings={data.rankings} />
            </section>

            <section className="rounded-[14px] border border-line bg-bg-2 p-5 lg:col-span-2">
              <div className="mb-4">
                <MonoLabel size="cell">Distribuția scorurilor</MonoLabel>
              </div>
              <ScoreDistribution distribution={data.distribution} />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
