import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          grile-ReziNOTE
        </Link>
      </div>
      {children}
    </div>
  )
}
