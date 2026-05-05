"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

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
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/85 p-4 text-sm text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div className="flex-1">
          <p className="leading-relaxed text-white/80">
            Folosim doar cookie-uri esentiale (autentificare, preferinte de
            tema). Nu folosim cookie-uri de tracking sau marketing.{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-emerald-300 underline-offset-4 hover:underline"
            >
              Politica de confidentialitate
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={dismiss}
              className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Inteleg
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Inchide notificarea"
          className="rounded-md p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
