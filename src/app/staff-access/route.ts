import { NextResponse } from "next/server"
import { STAFF_PREVIEW_COOKIE } from "@/lib/auth/staff-preview"

/**
 * Secret entry point so the team can reach /login while public registration is
 * closed (pre-launch). Visit /staff-access?token=<STAFF_ACCESS_TOKEN> once — it
 * sets a long-lived cookie and forwards to /login. Unknown/missing token, or
 * STAFF_ACCESS_TOKEN unset, → home.
 *
 * The redirect Location is RELATIVE on purpose: behind a proxy (Railway)
 * request.url carries the internal http://localhost:8080 host, so an absolute
 * URL built from it sends the browser to localhost. A relative Location lets the
 * browser resolve it against the real public origin instead.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  const expected = process.env.STAFF_ACCESS_TOKEN
  const granted = Boolean(expected && token && token === expected)

  const res = new NextResponse(null, {
    status: 307,
    headers: { Location: granted ? "/login" : "/" },
  })

  if (granted) {
    res.cookies.set(STAFF_PREVIEW_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  return res
}
