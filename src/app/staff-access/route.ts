import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { STAFF_PREVIEW_COOKIE } from "@/lib/auth/staff-preview"

/**
 * Secret entry point so the team can reach /login while public registration is
 * closed (pre-launch). Visit /staff-access?token=<STAFF_ACCESS_TOKEN> once — it
 * sets a long-lived cookie and forwards to /login. Unknown/missing token, or
 * STAFF_ACCESS_TOKEN unset, → home (no hint that the route does anything).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const expected = process.env.STAFF_ACCESS_TOKEN

  if (expected && token && token === expected) {
    const store = await cookies()
    store.set(STAFF_PREVIEW_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return NextResponse.redirect(new URL("/login", url))
  }

  return NextResponse.redirect(new URL("/", url))
}
