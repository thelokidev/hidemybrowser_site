import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { AuthProviderWrapper } from "@/components/auth-provider-wrapper"

export const metadata: Metadata = {
  title: "HideMyBrowser - The Truly Undetectable Browser",
  description: "Share your screen, not your secrets. Perfect for Interviews, Presentations, and Demos.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProviderWrapper>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProviderWrapper>
        <Analytics />
      </body>
    </html>
  )
}
