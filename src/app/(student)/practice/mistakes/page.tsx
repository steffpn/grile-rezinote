import { getCurrentUser } from "@/lib/auth/get-user"
import { getMyMistakes, getMyMistakesStats } from "@/lib/actions/wrong-answers"
import { MistakesList } from "@/components/practice/MistakesList"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessMyMistakes } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export default async function MistakesPage() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!canAccessMyMistakes(access.tier)) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Greselile mele
          </h1>
          <p className="mt-1 text-muted-foreground">
            Reia si corecteaza intrebarile la care ai gresit
          </p>
        </div>
        <UpgradeBlocker
          requiredTier="PRO"
          title='Functia "Greselile mele"'
          description="Platforma reface automat intrebarile la care ai gresit, pana le stapanesti complet. Un mod eficient de a invata din erorile proprii."
          benefits={[
            "Lista tuturor intrebarilor gresite, organizate pe capitole",
            "Generator automat de teste doar cu greselile tale nerezolvate",
            "Mastery tracking — greselile ies din lista dupa 2 raspunsuri corecte consecutive",
            "Statistici detaliate despre ce tipuri de greseli faci",
          ]}
          alternativeAction={{
            href: "/practice",
            label: "Incepe un test practic",
          }}
          showStartTrial={access.trialAvailable}
        />
      </div>
    )
  }

  const [mistakes, stats] = await Promise.all([
    getMyMistakes(),
    getMyMistakesStats(),
  ])

  // Build chapter list with counts
  const chapters = stats.byChapter.map((ch) => ({
    id: ch.chapterId,
    name: ch.chapterName,
    count: ch.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Greselile mele
        </h1>
        <p className="mt-1 text-muted-foreground">
          Statistici si exercitii pentru intrebarile la care ai gresit
        </p>
        {stats.totalMastered > 0 && (
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
            {stats.totalMastered} intrebari stapanite (eliminate din lista)
          </p>
        )}
      </div>

      <MistakesList mistakes={mistakes} chapters={chapters} />
    </div>
  )
}
