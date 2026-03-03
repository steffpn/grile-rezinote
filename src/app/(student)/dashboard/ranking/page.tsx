import { Suspense } from "react"
import type { Metadata } from "next"
import { Trophy, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchPeerComparison } from "@/lib/actions/peer"
import { Leaderboard } from "@/components/peer/leaderboard"
import { ScoreDistribution } from "@/components/peer/score-distribution"
import { PeerStatsCard } from "@/components/peer/peer-stats-card"
import { OptInToggle } from "@/components/peer/opt-in-toggle"

export const metadata: Metadata = {
  title: "Clasament | grile-ReziNOTE",
}

export default async function RankingPage() {
  const data = await fetchPeerComparison()

  const hasParticipants = data.stats.totalParticipants > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clasament</h1>
          <p className="text-sm text-muted-foreground">
            Compara performanta ta cu ceilalti participanti
          </p>
        </div>
        <OptInToggle initialOptedIn={data.userOptedIn} />
      </div>

      {!hasParticipants ? (
        /* No simulation data at all */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Inca nu exista date de clasament
            </h2>
            <p className="mb-2 mt-2 max-w-sm text-sm text-muted-foreground">
              Clasamentul se populeaza dupa ce utilizatorii completeaza simulari
              de examen. Completeaza o simulare pentru a-ti vedea pozitia!
            </p>
          </CardContent>
        </Card>
      ) : !data.userOptedIn ? (
        /* User not opted in — show aggregate stats only */
        <div className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                Activeaza participarea la clasament
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Activeaza comutatorul de mai sus pentru a vedea clasamentul
                complet si pozitia ta. Participarea este complet anonima &mdash;
                doar scorul tau va fi vizibil celorlalti.
              </p>
            </CardContent>
          </Card>

          {/* Still show general stats */}
          <Suspense>
            <PeerStatsCard stats={data.stats} />
          </Suspense>
        </div>
      ) : (
        /* Full ranking view */
        <div className="space-y-6">
          {/* Stats overview */}
          <PeerStatsCard stats={data.stats} />

          {/* Charts and leaderboard */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Leaderboard — larger */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4" />
                  Clasament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard rankings={data.rankings} />
              </CardContent>
            </Card>

            {/* Score distribution chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Distributia scorurilor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreDistribution distribution={data.distribution} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
