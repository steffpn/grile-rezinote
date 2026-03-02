import { AppShell } from "@/components/shared/app-shell"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
