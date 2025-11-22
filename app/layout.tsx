import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import CookieConsentBanner from "@/components/cookie-consent"
import { ToastProvider } from "@/components/toast-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Tokenomics Lab - Advanced Token Analytics & Risk Analysis",
  description: "Professional tokenomics analysis with real-time risk assessment, security audits, and market intelligence",
  generator: "v0.app",
  icons: {
    icon: '/tokenomics-lab-logo.ico',
    shortcut: '/tokenomics-lab-logo.ico',
    apple: '/tokenomics-lab-logo.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-black text-white`}>
        <AuthProvider>
          <ToastProvider />
          <main>
            {children}
          </main>
        </AuthProvider>

        <CookieConsentBanner />
        <Analytics />
        <div id="tg-portal-root"></div>
      </body>
    </html>
  )
}
