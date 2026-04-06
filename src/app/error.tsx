"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface to logs without leaking details to the client.
    console.error("App error:", error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-semibold text-rose-400">!</p>
      <h1 className="mt-4 text-2xl font-semibold">Ceva nu a mers bine</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        A aparut o eroare neasteptata. Reincearca peste cateva momente. Daca
        problema persista, te rugam sa ne contactezi.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex h-10 items-center rounded-md bg-emerald-500 px-5 text-sm font-medium text-white transition hover:bg-emerald-600"
      >
        Incearca din nou
      </button>
    </main>
  )
}
