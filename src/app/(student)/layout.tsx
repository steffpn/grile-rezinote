import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
