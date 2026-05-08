import type { Metadata } from "next"
import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { getAuthUser } from "@/lib/auth/get-user"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { PwaInstallPrompt } from "@/components/pwa/install-prompt"
import { AntiCopy } from "@/components/shared/anti-copy"
import { StartTrialBannerButton } from "@/components/subscription/StartTrialBannerButton"
import { hasTierAtLeast, type PlanTier } from "@/lib/subscription/tiers"

export const metadata: Metadata = {
  title: "Dashboard | grile-ReziNOTE",
}

type LinkSpec = Omit<NavLink, "locked" | "requiredTier"> & {
  requiredTier: PlanTier
}

const linkSpecs: LinkSpec[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM" },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  const subscriptionAccess = user
    ? await checkSubscriptionAccess(user.id)
    : null

  const tier = subscriptionAccess?.tier ?? "FREE"

  const links: NavLink[] = linkSpecs.map((spec) => ({
    href: spec.href,
    label: spec.label,
    requiredTier: spec.requiredTier,
    locked: !hasTierAtLeast(tier, spec.requiredTier),
  }))

  return (
    <AppShell
      links={links}
      userEmail={user?.email ?? null}
      showMobileTabBar
      context="student"
    >
      <AntiCopy />
      {/* Trial banner — active trial in progress */}
      {subscriptionAccess?.status === "trialing" &&
        subscriptionAccess.trialDaysRemaining !== undefined && (
          <div className="-mx-5 mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-y border-neon/30 bg-neon/8 px-4 py-2.5 text-center text-[13px] text-fg-dim sm:-mx-8 lg:-mx-10">
            <span className="font-mono text-[11px] uppercase tracking-mono text-neon">
              Trial · {subscriptionAccess.tier}
            </span>
            <span>
              <strong className="text-fg">
                {subscriptionAccess.trialDaysRemaining}{" "}
                {subscriptionAccess.trialDaysRemaining === 1 ? "zi" : "zile"} rămase
              </strong>
              .{" "}
              <a
                href="/pricing"
                className="font-medium text-neon underline-offset-2 hover:underline"
              >
                Activează acum
              </a>
            </span>
          </div>
        )}

      {/* FREE banner — eligible for trial start */}
      {subscriptionAccess?.tier === "FREE" &&
        subscriptionAccess.trialAvailable && (
          <div className="-mx-5 mb-6 flex flex-col items-center justify-center gap-2 border-y border-neon/25 bg-[radial-gradient(ellipse_at_center,oklch(0.84_0.21_162/0.08),transparent_70%)] px-4 py-2.5 text-center text-[13px] text-fg-dim sm:-mx-8 sm:flex-row lg:-mx-10">
            <span>
              Plan FREE · 20 întrebări/zi. Activează{" "}
              <strong className="text-fg">7 zile de PRO gratuit</strong> — fără card.
            </span>
            <StartTrialBannerButton />
          </div>
        )}

      {/* FREE banner — trial already used or not eligible */}
      {subscriptionAccess?.tier === "FREE" &&
        !subscriptionAccess.trialAvailable &&
        subscriptionAccess.status !== "trialing" && (
          <div className="-mx-5 mb-6 border-y border-warm/30 bg-warm/10 px-4 py-2.5 text-center text-[13px] text-fg-dim sm:-mx-8 lg:-mx-10">
            <span className="font-mono text-[11px] uppercase tracking-mono text-warm">
              Plan FREE
            </span>{" "}
            · 20 întrebări/zi, fără simulări sau statistici.{" "}
            <a
              href="/pricing"
              className="font-medium text-neon underline-offset-2 hover:underline"
            >
              Activează PRO sau PREMIUM
            </a>
          </div>
        )}

      {children}

      {/* PWA install prompt for mobile users */}
      <PwaInstallPrompt />
    </AppShell>
  )
}
