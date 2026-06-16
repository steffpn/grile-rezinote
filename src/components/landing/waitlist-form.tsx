"use client"

import { useActionState } from "react"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { joinWaitlist, type WaitlistState } from "@/lib/actions/waitlist"
import { cn } from "@/lib/utils"

interface WaitlistFormProps {
  /** Analytics tag for where this instance lives (hero, final, signup-closed). */
  source: string
  className?: string
  /** Center the helper text (hero/CTA) or left-align it (auth card). */
  align?: "center" | "start"
}

export function WaitlistForm({
  source,
  className,
  align = "center",
}: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    null,
  )

  if (state?.success) {
    return (
      <div
        className={cn(
          "mx-auto flex max-w-[460px] items-center gap-2.5 rounded-[12px] border border-neon/30 bg-neon/8 px-4 py-3.5 text-[14px] text-fg",
          align === "start" && "mx-0",
          className,
        )}
        role="status"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-neon text-bg">
          <Check className="size-3" strokeWidth={3} />
        </span>
        Ești pe listă. Te anunțăm primul când deschidem.
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className={cn(
        "w-full",
        align === "center" && "mx-auto max-w-[460px]",
        className,
      )}
    >
      {/* Honeypot — hidden from real users, catches bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input type="hidden" name="source" value={source} />

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="adresa ta de email"
          autoComplete="email"
          aria-label="Adresa ta de email"
          className="h-11 flex-1 rounded-[10px] border border-line bg-bg-2 px-4 text-[15px] text-fg outline-none placeholder:text-fg-mute focus:border-neon/60 focus:ring-2 focus:ring-neon/20"
        />
        <Button type="submit" size="lg" disabled={pending} className="shrink-0">
          {pending ? "Se trimite…" : "Vreau acces la lansare"}
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {state?.error && (
        <p className="mt-2 text-[13px] text-danger" role="alert">
          {state.error}
        </p>
      )}

      <p
        className={cn(
          "mt-2.5 text-[12.5px] text-fg-mute",
          align === "center" && "text-center",
        )}
      >
        Te anunțăm primul când deschidem.
      </p>
    </form>
  )
}
