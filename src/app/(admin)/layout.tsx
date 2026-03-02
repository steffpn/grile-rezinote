import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin | grile-ReziNOTE",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
