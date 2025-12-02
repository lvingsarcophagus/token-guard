import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import CookieConsentBanner from "@/components/cookie-consent"
import { ToastProvider } from "@/components/toast-provider"
import ModalProvider from "@/components/modal-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Tokenomics Lab - 10-Factor Risk Algorithm & Token Analysis",
  description: "Proprietary 10-factor risk scoring algorithm for cryptocurrency tokens. Real-time security analysis, holder distribution, and liquidity assessment across 6+ blockchains.",
  generator: "v0.app",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
          <ModalProvider />
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
