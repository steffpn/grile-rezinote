"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "rezinote-cookie-notice-dismissed"

/**
 * Cookie notice. We only set strictly necessary cookies (auth session,
 * preferences) — no analytics, no advertising, no third-party trackers — so a
 * lightweight informational banner satisfies the EU "transparency" requirement
 * without needing granular consent management. If we ever add non-essential
 * cookies, swap this for a real consent manager.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {
      // localStorage can throw in private mode — banner just won't persist.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Notificare cookie-uri"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[14px] border border-line bg-bg-2/95 p-4 text-[13.5px] text-fg-dim shadow-dashboard backdrop-blur-xl sm:bottom-5 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neon/12 text-neon">
          <Cookie className="size-[18px]" />
        </span>
        <div className="flex-1">
          <p className="leading-relaxed">
            Folosim doar cookie-uri esențiale (autentificare, preferințe).
            Niciun tracking, niciun marketing.{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-neon underline-offset-2 hover:underline"
            >
              Politica de confidențialitate
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={dismiss} size="sm" variant="default">
              Înțeleg
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Închide notificarea"
          className="rounded-[6px] p-1 text-fg-mute transition-colors hover:bg-bg-3 hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
