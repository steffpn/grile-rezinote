"use client"

import { useTransition } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startMyTrial } from "@/lib/actions/trial"

/**
 * Compact CTA button shown inside the FREE banner to kick off the 7-day PRO
 * trial. Intentionally small so it doesn't dominate the top bar; the bigger
 * sell lives inside upgrade blockers.
 */
export function StartTrialBannerButton() {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await startMyTrial()
      if (result.success) {
        toast.success("Trial PRO activat", {
          description: "Ai 7 zile cu acces complet la toate functiile PRO.",
        })
        // Server action already revalidates; soft reload to pick up the new
        // session state (tier transitions to PRO, banner changes color).
        window.location.reload()
      } else {
        toast.error("Nu s-a putut activa trial-ul", {
          description: result.error,
        })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {pending ? "Se activeaza..." : "Incepe trial 7 zile"}
    </button>
  )
}
