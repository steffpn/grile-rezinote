interface SubscriptionStatusProps {
  status: string
  planType: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialDaysRemaining?: number
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    trialing:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    cancelling:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    expired: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }

  const labels: Record<string, string> = {
    active: "Activ",
    trialing: "Trial",
    cancelling: "Se anuleaza",
    expired: "Expirat",
    inactive: "Inactiv",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.inactive}`}
    >
      {labels[status] || status}
    </span>
  )
}

export function SubscriptionStatus({
  status,
  planType,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  trialDaysRemaining,
}: SubscriptionStatusProps) {
  const displayStatus = cancelAtPeriodEnd && status === "active"
    ? "cancelling"
    : status === "cancelled"
      ? "expired"
      : status

  const planLabel = planType === "annual" ? "Anual" : planType === "monthly" ? "Lunar" : null

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Starea abonamentului</h3>
        <StatusBadge status={displayStatus} />
      </div>

      <div className="mt-4 space-y-3">
        {planLabel && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{planLabel}</span>
          </div>
        )}

        {currentPeriodEnd && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {cancelAtPeriodEnd
                ? "Acces pana la"
                : "Urmatoarea facturare"}
            </span>
            <span className="font-medium">
              {formatDate(currentPeriodEnd)}
            </span>
          </div>
        )}

        {trialDaysRemaining !== undefined && trialDaysRemaining > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Zile ramase trial</span>
            <span className="font-medium">{trialDaysRemaining}</span>
          </div>
        )}
      </div>

      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="mt-4 rounded-md bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          Abonamentul se va anula pe {formatDate(currentPeriodEnd)}. Vei avea
          acces pana atunci.
        </div>
      )}

      {displayStatus === "expired" && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Abonamentul tau a expirat.{" "}
          <a href="/pricing" className="font-medium underline">
            Reaboneaza-te
          </a>{" "}
          pentru a continua sa folosesti platforma.
        </div>
      )}
    </div>
  )
}
