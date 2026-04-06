import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-semibold text-emerald-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Pagina nu a fost gasita</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Link-ul pe care l-ai accesat nu mai exista sau a fost mutat. Verifica
        adresa sau intoarce-te la pagina principala.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-emerald-500 px-5 text-sm font-medium text-white transition hover:bg-emerald-600"
      >
        Inapoi acasa
      </Link>
    </main>
  )
}
