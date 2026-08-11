"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

/**
 * AppUpdateBanner — anunță că a fost publicată o versiune nouă a aplicației.
 *
 * Service worker-ul rulează cu `skipWaiting` + `clientsClaim`, deci workerul
 * nou preia imediat tab-urile deschise — dar JS-ul deja încărcat în pagină
 * rămâne cel vechi. Pentru Server Actions asta chiar strică: ID-urile lor se
 * regenerează la fiecare build, așa că un tab rămas deschis peste un deploy
 * primește 404 la orice acțiune ("Server Action was not found").
 *
 * Nu reîncărcăm automat — ar putea întrerupe un import în curs. Doar oferim
 * butonul.
 */
export function AppUpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    // Dacă pagina nu era controlată de niciun worker la montare, primul
    // `controllerchange` e instalarea inițială, nu un update.
    const hadController = !!navigator.serviceWorker.controller
    const show = () => setUpdateReady(true)
    const onControllerChange = () => {
      if (hadController) show()
    }

    let registration: ServiceWorkerRegistration | undefined

    const onUpdateFound = () => {
      const installing = registration?.installing
      if (!installing) return
      installing.addEventListener("statechange", () => {
        // Un worker nou ajuns "installed" cât timp altul deja controlează
        // pagina înseamnă deploy nou peste un tab deschis.
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          show()
        }
      })
    }

    const checkForUpdate = () => {
      registration?.update().catch(() => {})
    }

    // Un tab lăsat deschis ore în șir nu verifică singur dacă a apărut un
    // build nou, așa că forțăm verificarea la revenirea în tab.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)
    document.addEventListener("visibilitychange", onVisibilityChange)

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return
      registration = reg
      if (reg.waiting && navigator.serviceWorker.controller) show()
      reg.addEventListener("updatefound", onUpdateFound)
      checkForUpdate()
    })

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      )
      document.removeEventListener("visibilitychange", onVisibilityChange)
      registration?.removeEventListener("updatefound", onUpdateFound)
    }
  }, [])

  if (!updateReady) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-[10px] border border-neon/40 bg-bg-2/95 py-2.5 pl-3.5 pr-2.5 shadow-lg backdrop-blur-md"
    >
      <RefreshCw className="size-4 shrink-0 text-neon" aria-hidden />
      <span className="text-[13px] leading-snug text-fg-dim">
        A apărut o versiune nouă a aplicației.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-[6px] border border-neon bg-neon/12 px-2.5 py-1 font-mono text-[11px] uppercase tracking-mono-tight text-neon transition-colors hover:bg-neon/20"
      >
        Reîncarcă
      </button>
    </div>
  )
}
