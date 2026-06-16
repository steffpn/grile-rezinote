import { cookies } from "next/headers"
import { isRegistrationOpen } from "@/lib/launch"

export const STAFF_PREVIEW_COOKIE = "staff_preview"

/**
 * Whether this browser unlocked the staff preview via
 * /staff-access?token=STAFF_ACCESS_TOKEN. Lets the team reach /login while the
 * public auth surface is hidden behind the waitlist.
 */
async function hasStaffPreview(): Promise<boolean> {
  try {
    const store = await cookies()
    return store.get(STAFF_PREVIEW_COOKIE)?.value === "1"
  } catch {
    // cookies() throws outside a request scope — treat as no preview.
    return false
  }
}

/**
 * Whether the auth pages (login / forgot-password / update-password /
 * verify-email / signup) may be rendered. Public once registration opens;
 * before that, only to staff holding the preview cookie.
 *
 * NOTE: this only controls page VISIBILITY. Account creation stays separately
 * gated by isRegistrationOpen() in the signup action and the Google OAuth
 * callback, so staff can log in but cannot create new accounts pre-launch.
 */
export async function canViewAuthPages(): Promise<boolean> {
  return isRegistrationOpen() || (await hasStaffPreview())
}
