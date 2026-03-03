"use client"

import { useTransition, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { togglePeerParticipation } from "@/lib/actions/peer"
import { useRouter } from "next/navigation"

interface OptInToggleProps {
  initialOptedIn: boolean
}

export function OptInToggle({ initialOptedIn }: OptInToggleProps) {
  const [optedIn, setOptedIn] = useState(initialOptedIn)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await togglePeerParticipation(checked)
      if (result.success) {
        setOptedIn(result.optedIn)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-start gap-3">
      <Switch
        id="peer-opt-in"
        checked={optedIn}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <div className="space-y-1">
        <Label
          htmlFor="peer-opt-in"
          className={`text-sm font-medium ${isPending ? "opacity-50" : ""}`}
        >
          Participa la clasament
        </Label>
        <p className="text-xs text-muted-foreground">
          Activeaza pentru a fi inclus in clasamentul anonim. Doar scorul tau va
          fi vizibil &mdash; fara nume sau alte informatii personale.
        </p>
      </div>
    </div>
  )
}
