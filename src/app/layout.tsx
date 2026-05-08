import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider"
import { CommandPalette } from "@/components/command/command-palette"
import { CookieBanner } from "@/components/shared/cookie-banner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "grile-ReziNOTE",
  description:
    "Platformă de simulare examene de rezidențiat pentru studenții la medicină dentară",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ReziNOTE",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
}

export const viewport: Viewport = {
  // Aliniat cu --bg din design tokens (dark-only v1)
  themeColor: "#0A1110",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Dark-only pe v1 — clasa `dark` este hardcoded ca dublă-asigurare în
    // cazul în care ThemeProvider nu apucă să atașeze atributul înainte de
    // primul paint. ThemeProvider mai jos forțează tema în orice caz.
    <html lang="ro" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <OfflineIndicator />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            {children}
            <CommandPalette />
            <CookieBanner />
            <Toaster
              theme="dark"
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: "oklch(0.14 0.014 165 / 0.92)",
                  border: "1px solid oklch(0.26 0.018 165)",
                  backdropFilter: "blur(12px)",
                  color: "oklch(0.97 0.008 95)",
                },
              }}
            />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
