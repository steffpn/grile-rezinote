/**
 * Pre-launch gating.
 *
 * While the platform is in pre-launch we keep public sign-ups closed: visitors
 * can only join the waitlist, while existing users (incl. admins) can still log
 * in normally. Flip `REGISTRATION_OPEN=true` on the host to open account
 * creation at launch.
 *
 * Closed by DEFAULT — a missing/typo'd env var must never accidentally open
 * registration. This is enforced server-side in three places (UI hiding alone
 * is not enough):
 *   - the credentials signup server action (lib/auth/actions.ts)
 *   - the Google OAuth `signIn` callback (lib/auth/config.ts) — blocks NEW
 *     account creation, existing users still pass
 *   - the /signup page (renders the waitlist instead of the form)
 *
 * Server-only: do NOT expose this via NEXT_PUBLIC — the value is read in server
 * components, server actions and the auth callback, all of which run on the
 * server.
 */
export function isRegistrationOpen(): boolean {
  return process.env.REGISTRATION_OPEN === "true"
}
