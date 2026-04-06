import type { Metadata } from "next"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { Marquee } from "@/components/landing/marquee"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FaqSection } from "@/components/landing/faq-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "grile-ReziNOTE — Pregatire pentru rezidentiat stomatologie",
  description:
    "Simuleaza examene reale de rezidentiat stomatologie. Grile CS si CM cu punctaj oficial, comparatie cu pragurile istorice de admitere si statistici detaliate.",
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <FeaturesSection />
      <Marquee />
      <HowItWorksSection />
      <StatsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
