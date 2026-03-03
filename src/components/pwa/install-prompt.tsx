"use client"

import { useState, useEffect } from "react"
import { Download, X, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) return

    // Check if dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) return

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as any).MSStream
    setIsIos(isIosDevice)

    // On iOS, show manual instructions banner
    if (isIosDevice) {
      setShowBanner(true)
      return
    }

    // Chrome/Edge: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showBanner || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-primary/20 bg-background p-4 shadow-lg md:bottom-6">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Inchide"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {isIos ? (
            <Share2 className="h-5 w-5 text-primary" />
          ) : (
            <Download className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Instaleaza ReziNOTE
          </p>

          {isIos ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Apasa{" "}
              <Share2 className="inline h-3 w-3" />{" "}
              Share, apoi &quot;Adauga pe ecranul principal&quot;
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Acces rapid de pe ecranul principal, fara browser
            </p>
          )}

          {!isIos && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="mt-2 min-h-[44px]"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Instaleaza
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
