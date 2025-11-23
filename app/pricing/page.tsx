"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { theme } from "@/lib/theme"
import { ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className={`relative min-h-screen ${theme.backgrounds.main} overflow-hidden`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none"></div>

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      {/* Page Content */}
      <div className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button 
              variant="outline" 
              className="mb-8 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-mono tracking-wider transition-all group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              BACK TO HOME
            </Button>
          </Link>

          {/* Section Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className={theme.decorative.divider}></div>
              <span className={`${theme.text.tiny} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>ACCESS LEVELS</span>
              <div className="flex-1 h-px bg-white"></div>
            </div>
            <h1 className={`${theme.text.hero} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} mb-4`}>
              PRICING TIERS
            </h1>
            <p className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.base}`}>
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <div className="w-6 h-px bg-white"></div>
                  <span className={`${theme.text.primary} text-[9px] ${theme.fonts.mono}`}>TIER.01</span>
                </div>
                <h2 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mb-2 ${theme.fonts.mono} ${theme.fonts.tracking}`}>FREE</h2>
                <div className={`text-5xl ${theme.fonts.bold} ${theme.text.primary} mb-6 ${theme.fonts.mono}`}>
                  $0<span className={`text-lg ${theme.text.secondary} ${theme.fonts.mono}`}>/MONTH</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    20 ANALYSES/DAY
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    BASIC RISK SCORE
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    COMMUNITY ALERTS
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    REAL-TIME SCANNING
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className={`w-full ${theme.buttons.primary} uppercase`}>
                    GET STARTED
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className={`${theme.backgrounds.card} border-2 ${theme.borders.accent} relative`}>
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 ${theme.text.small} ${theme.fonts.mono} ${theme.fonts.tracking}`}>
                RECOMMENDED
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <div className="w-6 h-px bg-white"></div>
                  <span className={`${theme.text.primary} text-[9px] ${theme.fonts.mono}`}>TIER.02</span>
                </div>
                <h2 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mb-2 ${theme.fonts.mono} ${theme.fonts.tracking}`}>PRO</h2>
                <div className={`text-5xl ${theme.fonts.bold} ${theme.text.primary} mb-6 ${theme.fonts.mono}`}>
                  $29<span className={`text-lg ${theme.text.secondary} ${theme.fonts.mono}`}>/MONTH</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    UNLIMITED ANALYSES
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    ADVANCED AI INSIGHTS
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    CUSTOM ALERTS
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    API ACCESS
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    PORTFOLIO TRACKING
                  </li>
                  <li className={`flex items-center ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    <span className={`${theme.text.primary} mr-3`}>▸</span>
                    PRIORITY SUPPORT
                  </li>
                </ul>
                <Button className={`w-full ${theme.buttons.secondary} uppercase`}>
                  UPGRADE TO PRO
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom decorative line */}
          <div className="flex items-center gap-2 mt-12 opacity-40">
            <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>{theme.decorative.infinity}</span>
            <div className="flex-1 h-px bg-white"></div>
            <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>TOKENGUARD.PROTOCOL</span>
          </div>
        </div>
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
      `}</style>
    </div>
    </>
  )
}
