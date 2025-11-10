"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Shield, Home, Search, TrendingUp, Settings, LogOut, Menu, X, User, Zap, Bell, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "./ui/button"
import { analyticsEvents } from "@/lib/firebase-analytics"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userData } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      // Track logout event before signing out
      analyticsEvents.logout()
      
      // Sign out from Firebase
      await signOut(auth)
      
      // Clear any local storage/session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lastVisitedPath')
        sessionStorage.clear()
      }
      
      // Force redirect to landing page with replace to prevent back navigation
      router.replace("/")
      
      // Force a hard reload after a short delay to clear all state
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = "/"
        }
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout fails, redirect to landing page
      router.replace("/")
    }
  }

  // Build navigation links based on user role, tier, and current page
  const navLinks = []
  const isPremiumDashboard = pathname === "/premium/dashboard"
  
  if (user) {
    // Dashboard link - different based on tier
    if (userData?.tier === "pro") {
      navLinks.push({ href: "/premium/dashboard", label: "Dashboard", icon: Home })
    } else {
      navLinks.push({ href: "/dashboard", label: "Dashboard", icon: Home })
    }
    
    // Hide pricing button on premium dashboard
    if (!isPremiumDashboard && userData?.tier !== "pro") {
      navLinks.push({ href: "/pricing", label: "Pricing", icon: TrendingUp })
    }
    
    // Admin-only links
    if (userData?.role === "admin") {
      navLinks.push({ href: "/api-test", label: "API Test", icon: Settings })
      navLinks.push({ href: "/admin", label: "Admin", icon: Shield })
    }
  }

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <img 
                src="/Logo.png" 
                alt="Tokenomics Lab" 
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
              />
              <div className="hidden sm:block">
                <span className="text-sm sm:text-base lg:text-lg font-bold text-white font-mono tracking-widest group-hover:text-white/90 transition-colors">
                  TOKENOMICS LAB
                </span>
                <div className="text-[7px] sm:text-[8px] text-white/60 font-mono -mt-0.5 group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 border border-white/20 text-xs font-mono px-3 py-1.5 h-8">
                  LOGIN
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-transparent border border-white text-white hover:bg-white hover:text-black text-xs font-mono px-3 py-1.5 h-8 transition-all">
                  SIGN UP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo with Dynamic Hover */}
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group relative">
            <img 
              src="/Logo.png" 
              alt="Tokenomics Lab" 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] group-hover:rotate-[5deg]" 
            />
            <div className="hidden sm:block">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-white font-mono tracking-widest group-hover:text-white/90 transition-colors drop-shadow-lg">
                TOKENOMICS LAB
              </span>
              <div className="text-[7px] sm:text-[8px] text-white/60 font-mono -mt-0.5 tracking-wider group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
            </div>
          </Link>

          {/* Desktop Navigation with Dynamic States & Glassmorphism */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link, index) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={`${link.href}-${link.label}-${index}`}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 border-2 backdrop-blur-md transition-all duration-300 group font-mono text-[10px] overflow-hidden h-9 ${
                    isActive
                      ? "text-white border-white/50 bg-white/15 shadow-lg shadow-white/10"
                      : "text-white/60 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50" />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 transition-all duration-300 ${
                    isActive ? 'text-white drop-shadow-lg' : 'text-white/50 group-hover:text-white group-hover:scale-110'
                  }`} />
                  <span className="relative z-10 font-mono tracking-wider font-bold whitespace-nowrap">{link.label.toUpperCase()}</span>
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop User Menu with Dynamic Interactions */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Notifications with Pulse & Glassmorphism */}
            <button className="relative p-2 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 group hover:shadow-lg hover:shadow-white/5 h-9 w-9 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-all duration-300 group-hover:scale-110" />
              {userData?.alerts && userData.alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black flex items-center justify-center text-[8px] font-bold border border-black animate-pulse shadow-lg">
                  {userData.alerts.length}
                </span>
              )}
            </button>

            {/* Profile with Hover Effect & Glassmorphism */}
            <Link href="/profile" className="group">
              <div className="flex items-center gap-2 px-2.5 py-1.5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-white/5 h-9">
                <div className="hidden lg:block text-right">
                  <div className="text-[10px] font-bold text-white font-mono group-hover:text-white/90 transition-colors drop-shadow-md leading-tight">
                    {user.email?.split('@')[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="w-5 h-5 border-2 border-white/40 bg-black/40 backdrop-blur-sm group-hover:bg-white group-hover:border-white flex items-center justify-center transition-all duration-300">
                  <User className="w-3 h-3 text-white group-hover:text-black transition-colors" />
                </div>
              </div>
            </Link>

            {/* Logout with Danger State & Glassmorphism */}
            <button
              onClick={handleLogout}
              className="p-2 border-2 border-white/20 hover:border-red-400/50 hover:bg-red-500/10 backdrop-blur-md transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/10 h-9 w-9 flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-white/60 group-hover:text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
            </button>
          </div>

          {/* Mobile Menu Button with Animation & Glassmorphism */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 group hover:shadow-lg hover:shadow-white/5 h-9 w-9 flex items-center justify-center"
          >
            {mobileMenuOpen ? 
              <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" /> : 
              <Menu className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Menu with Slide Animation & Glassmorphism */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/20 bg-black/40 backdrop-blur-xl animate-in slide-in-from-top-2">
          <div className="px-3 py-4 space-y-3">
            {/* User Info - Mobile with Glassmorphism */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/20">
              <div className="w-9 h-9 border-2 border-white/40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <User className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white font-mono drop-shadow-md truncate">
                  {user?.email?.split('@')[0]?.toUpperCase()}
                </div>
                <div className="text-[9px] text-white/50 font-mono truncate">
                  {user?.email}
                </div>
              </div>
              <div className={`px-2 py-1 border-2 backdrop-blur-md font-mono text-[9px] relative overflow-hidden ${
                userData?.tier === "pro"
                  ? "text-white border-white/50 bg-white/15 font-bold shadow-lg shadow-white/10"
                  : "text-white/60 border-white/20 bg-white/5"
              }`}>
                {userData?.tier === "pro" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-shimmer" />
                )}
                <span className="relative z-10">{userData?.tier === "pro" ? "⚡ PRO" : "FREE"}</span>
              </div>
            </div>

            {/* Mobile Navigation Links with Hover Effects */}
            <div className="space-y-1.5">
              {navLinks.map((link, index) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={`${link.href}-${link.label}-${index}`}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center gap-2.5 px-3 py-2.5 border-2 backdrop-blur-md transition-all duration-300 font-mono text-[10px] group overflow-hidden ${
                      isActive
                        ? "bg-white/15 border-white/50 text-white font-bold shadow-lg shadow-white/10"
                        : "text-white/60 hover:text-white border-white/20 hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
                    }`}
                  >
                    {isActive && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                      </>
                    )}
                    <Icon className={`w-3.5 h-3.5 transition-all duration-300 relative z-10 ${
                      isActive ? 'text-white scale-110 drop-shadow-lg' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-bold tracking-wider relative z-10">{link.label.toUpperCase()}</span>
                  </Link>
                )
              })}
              
              {/* Profile Link with Glassmorphism */}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 border-2 border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px] group hover:shadow-lg hover:shadow-white/5"
              >
                <User className="w-3.5 h-3.5 group-hover:scale-110 transition-all duration-300" />
                <span className="font-bold tracking-wider">PROFILE</span>
              </Link>
              
              {/* Logout Button with Glassmorphism & Danger State */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 border-2 border-white/20 hover:border-red-400/50 hover:bg-red-500/10 backdrop-blur-md text-white/60 hover:text-red-400 transition-all duration-300 font-mono text-[10px] group hover:shadow-lg hover:shadow-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
                <span className="font-bold tracking-wider">LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
