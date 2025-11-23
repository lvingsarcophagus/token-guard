"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Home, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { theme } from "@/lib/theme"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className={`min-h-screen ${theme.backgrounds.main} flex items-center justify-center p-4 overflow-hidden`}>
      {/* Background Effects */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* 404 Content */}
      <div className="relative max-w-2xl w-full text-center">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-purple-500 to-red-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
        
        {/* Card */}
        <div className={`relative ${theme.backgrounds.card} border-2 ${theme.borders.default} rounded-3xl p-12 backdrop-blur-2xl`}>
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>

          {/* 404 Text */}
          <div className="mb-6">
            <h1 className={`text-8xl ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} mb-4`}>
              404
            </h1>
            <h2 className={`text-2xl ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} mb-3 uppercase`}>
              Page Not Found
            </h2>
            <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono} max-w-md mx-auto`}>
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
          </div>

          {/* Error Code */}
          <div className="mb-8 p-4 rounded-lg bg-red-500/5 border border-red-500/20 inline-block">
            <p className={`${theme.text.tiny} text-red-400 ${theme.fonts.mono}`}>
              ERROR_CODE: PAGE_NOT_FOUND
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => router.back()}
              className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all font-mono text-sm uppercase flex items-center gap-2 min-w-[160px]"
            >
              <ArrowLeft className="w-4 h-4" />
              GO BACK
            </Button>
            
            <Link href="/">
              <Button className={`${theme.buttons.primary} uppercase flex items-center gap-2 min-w-[160px]`}>
                <Home className="w-4 h-4" />
                HOME PAGE
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button className="border-2 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all font-mono text-sm uppercase flex items-center gap-2 min-w-[160px]">
                <Search className="w-4 h-4" />
                DASHBOARD
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className={`${theme.text.tiny} ${theme.text.secondary} ${theme.fonts.mono} uppercase mb-4`}>
              Quick Links
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/docs" className={`${theme.text.small} ${theme.text.secondary} hover:${theme.text.primary} ${theme.fonts.mono} transition-colors`}>
                Documentation
              </Link>
              <span className="text-white/20">•</span>
              <Link href="/pricing" className={`${theme.text.small} ${theme.text.secondary} hover:${theme.text.primary} ${theme.fonts.mono} transition-colors`}>
                Pricing
              </Link>
              <span className="text-white/20">•</span>
              <Link href="/contact" className={`${theme.text.small} ${theme.text.secondary} hover:${theme.text.primary} ${theme.fonts.mono} transition-colors`}>
                Contact
              </Link>
              <span className="text-white/20">•</span>
              <Link href="/login" className={`${theme.text.small} ${theme.text.secondary} hover:${theme.text.primary} ${theme.fonts.mono} transition-colors`}>
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className={`mt-8 ${theme.text.tiny} ${theme.text.secondary} ${theme.fonts.mono}`}>
          If you believe this is an error, please{" "}
          <Link href="/contact" className={`${theme.text.primary} hover:underline`}>
            contact support
          </Link>
        </p>
      </div>

      <style jsx>{`
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%, 240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%, 70% 70%, 50% 50%;
          opacity: 0.3;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
