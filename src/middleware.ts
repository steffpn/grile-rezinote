import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that bypass subscription check (user must be authed but not subscribed)
const subscriptionBypassRoutes = [
  "/pricing",
  "/checkout",
  "/subscription",
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public auth routes that unauthenticated users can access
  const publicAuthRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
    "/update-password",
  ]

  // Redirect authenticated users away from auth pages to dashboard
  if (user && publicAuthRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from protected routes
  if (
    !user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Subscription gating for student routes (dashboard)
  // Skip check for admin routes, subscription bypass routes, and API routes
  if (
    user &&
    pathname.startsWith("/dashboard") &&
    !subscriptionBypassRoutes.some((route) => pathname.startsWith(route))
  ) {
    // Query subscription + user data in parallel (Edge-compatible)
    const [{ data: subscription }, { data: userRecord }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("users")
        .select("trial_started_at")
        .eq("id", user.id)
        .single(),
    ])

    const hasActiveSubscription =
      subscription?.status === "active" ||
      (subscription?.status === "trialing" &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) > new Date())

    // Check server-side trial
    const trialStartedAt = userRecord?.trial_started_at
      ? new Date(userRecord.trial_started_at)
      : null

    const trialActive =
      trialStartedAt &&
      new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000) >
        new Date()

    // Trial not started yet — allow access (will start on this visit)
    const trialNotStarted = !trialStartedAt

    if (!hasActiveSubscription && !trialActive && !trialNotStarted) {
      // Subscription expired — redirect to pricing with paywall flag
      const url = request.nextUrl.clone()
      url.pathname = "/pricing"
      url.searchParams.set("paywall", "true")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
