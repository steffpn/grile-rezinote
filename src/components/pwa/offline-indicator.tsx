"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

/**
 * OfflineIndicator — banner sticky la top când conexiunea cade. Folosește
 * paleta `--warm` (galben atenuat, nu roșu de panică).
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)

    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 border-b border-warm/40 bg-warm/14 px-4 py-2 font-mono text-[12px] uppercase tracking-mono text-warm backdrop-blur-md"
    >
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      <span>Offline · unele funcții nu sunt disponibile</span>
    </div>
  )
}
