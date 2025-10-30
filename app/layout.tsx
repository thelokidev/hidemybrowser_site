import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { AuthProviderWrapper } from "@/components/auth-provider-wrapper"
import { ThemeProvider } from "@/components/theme-provider"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HideMyBrowser - The Truly Undetectable Browser",
  description: "Share your screen, not your secrets. Perfect for Interviews, Presentations, and Demos.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <AuthProviderWrapper>
            <Suspense fallback={null}>{children}</Suspense>
          </AuthProviderWrapper>
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
