"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

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
    <div className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-900 dark:bg-yellow-600 dark:text-yellow-50">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Nu exista conexiune la internet. Unele functii nu sunt disponibile.
      </span>
    </div>
  )
}
