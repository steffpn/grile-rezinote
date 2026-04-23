import { auth } from "@/lib/auth"
import { MarketingNav } from "@/components/marketing/marketing-nav"

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch session server-side so pages under the marketing layout (landing,
  // /pricing, legal) know whether to render a logged-out or logged-in nav.
  // Without this, a signed-in user on /pricing saw "Autentificare / Incepe
  // gratuit" and thought their session was gone.
  const session = await auth()
  const userEmail = session?.user?.email ?? null

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] text-white">
      <MarketingNav userEmail={userEmail} />
      {children}
    </div>
  )
}
