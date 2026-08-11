import withSerwistInit from "@serwist/next"
import type { NextConfig } from "next"

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // The bulk import chunks its payload (~120 KB/call), so this is only a
    // safety net: without it Next rejects anything over 1 MB with an opaque
    // 413 before the Server Action runs, which is how large imports used to
    // fail silently.
    serverActions: { bodySizeLimit: "4mb" },
  },
}

export default withSerwist(nextConfig)
