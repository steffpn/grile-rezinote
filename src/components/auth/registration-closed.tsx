import { AuthCard, AuthHeader, AuthFootLink } from "@/components/auth/auth-shell"
import { WaitlistForm } from "@/components/landing/waitlist-form"

/**
 * Shown on /signup while public registration is closed (pre-launch). Existing
 * users still log in via /login; everyone else can only join the waitlist.
 */
export function RegistrationClosed() {
  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Pre-lansare"
        title="Înregistrările se deschid la lansare"
        subtitle="Momentan platforma e în pregătire. Lasă-ți email-ul și te anunțăm primul când deschidem conturile."
      />
      <WaitlistForm source="signup-closed" align="start" />
      <AuthFootLink prompt="Ai deja cont?" href="/login" cta="Conectează-te" />
    </AuthCard>
  )
}
