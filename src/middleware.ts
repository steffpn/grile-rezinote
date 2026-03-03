import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  // Refresh the auth session (single network call)
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
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/practice") ||
      pathname.startsWith("/exam") ||
      pathname.startsWith("/admission") ||
      pathname.startsWith("/subscription") ||
      pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Subscription gating is handled in the student layout (server component)
  // — avoids 2 extra DB queries in the middleware hot path

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images.
     * This keeps middleware fast for asset requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
