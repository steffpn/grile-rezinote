"use client"

import { useTransition } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startMyTrial } from "@/lib/actions/trial"

/**
 * Primary CTA inside upgrade blockers for users eligible to start their
 * 7-day PRO trial. Clicking flips them from FREE -> PRO (trialing) for 7
 * days and reloads the page so the blocker is replaced by real content.
 */
export function StartTrialBlockerButton() {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await startMyTrial()
      if (result.success) {
        toast.success("Trial PRO activat!", {
          description:
            "Ai 7 zile cu acces complet la simulari, Greselile mele si dashboard.",
          icon: <Sparkles className="h-4 w-4" />,
        })
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
      className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-7 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
      )}
      {pending ? "Se activeaza..." : "Incepe trial gratuit 7 zile"}
    </button>
  )
}
