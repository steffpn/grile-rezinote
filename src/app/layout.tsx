import type { Metadata, Viewport } from "next"
import { Inter, Sora } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider"
import { CommandPalette } from "@/components/command/command-palette"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
})

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#10b981",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased`}>
        <OfflineIndicator />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            {children}
            <CommandPalette />
            <Toaster
              theme="dark"
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: "rgba(10, 14, 20, 0.92)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                },
              }}
            />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
