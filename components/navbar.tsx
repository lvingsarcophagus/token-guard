"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Shield, Home, Search, TrendingUp, LogOut, User, Activity, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "./ui/button"
import { analyticsEvents } from "@/lib/firebase-analytics"
import NotificationBell from "./notification-bell"
import { logAuth } from "@/lib/services/activity-logger"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userData } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Smart scroll detection for enhanced floating effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      // Log logout before signing out
      if (user) {
        await logAuth(user.uid, user.email || '', 'user_logout')
      }
      
      analyticsEvents.logout()
      await signOut(auth)
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lastVisitedPath')
        sessionStorage.clear()
      }
      
      router.replace("/")
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = "/"
        }
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)
      router.replace("/")
    }
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // Build navigation links
  const navLinks = []
  const isDashboard = pathname === "/dashboard"
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  if (user) {
    // Single unified dashboard link
    navLinks.push({ href: "/dashboard", label: "Dashboard", icon: Home })
    
    // Dashboard-specific navigation (only show when on dashboard)
    if (isDashboard) {
      navLinks.push({ href: "#scanner", label: "Scanner", icon: Search })
      navLinks.push({ href: "#watchlist", label: "Watchlist", icon: TrendingUp })
    }
    
    // Landing page links (always show)
    navLinks.push({ href: "/#features", label: "Features", icon: Activity })
    navLinks.push({ href: "/docs", label: "Docs", icon: Shield })
    navLinks.push({ href: "/contact", label: "Contact", icon: Activity })
    
    // Pricing link (only for free users)
    const isPremiumUser = userData?.tier === "pro"
    if (!isPremiumUser) {
      navLinks.push({ href: "/pricing", label: "Pricing", icon: TrendingUp })
    }
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  if (!user) {
    const landingLinks = [
      { href: "#features", label: "Features" },
      { href: "#technology", label: "Technology" },
      { href: "/docs", label: "Docs" },
      { href: "/contact", label: "Contact" },
      { href: "/pricing", label: "Pricing" }
    ]

    return (
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className={`max-w-7xl mx-auto rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 ${
          scrolled ? 'shadow-black/50 bg-black/70' : 'shadow-black/20'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none"></div>
          
          <div className="relative px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="relative p-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm group-hover:border-white/40 group-hover:bg-white/10 transition-all duration-300">
                    <img 
                      src="/tokenomics-lab-logo.ico" 
                      alt="Tokenomics Lab" 
                      className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-full transition-all duration-300 group-hover:scale-110" 
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-base lg:text-lg font-bold text-white font-mono tracking-widest transition-all">
                    TOKENOMICS LAB
                  </span>
                  <div className="text-[8px] text-white/60 font-mono -mt-0.5 tracking-wider group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
                </div>
              </Link>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-white/30 hover:border-white/40 bg-black/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 h-10 w-10 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-4 flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Fullscreen Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
              {landingLinks.map((link, index) => (
                <Link
                  key={`${link.href}-fullscreen-${index}`}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href)
                    setMobileMenuOpen(false)
                  }}
                  className="text-3xl md:text-5xl font-bold text-white/60 hover:text-white transition-all duration-300 font-mono tracking-wider hover:scale-110"
                >
                  {link.label.toUpperCase()}
                </Link>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="mt-8 px-8 py-4 rounded-xl border-2 border-white/30 bg-white/10 hover:bg-white hover:text-black text-white transition-all duration-300 font-mono text-lg font-bold tracking-wider hover:scale-110">
                  GET STARTED
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    )
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className={`max-w-7xl mx-auto rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 ${
          scrolled ? 'shadow-black/50 bg-black/70' : 'shadow-black/20'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none"></div>
          
          <div className="relative px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="relative p-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm group-hover:border-white/40 group-hover:bg-white/10 transition-all duration-300">
                    <img 
                      src="/tokenomics-lab-logo.ico" 
                      alt="Tokenomics Lab" 
                      className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-full transition-all duration-300 group-hover:scale-110" 
                    />
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <span className="text-base lg:text-lg font-bold text-white font-mono tracking-widest transition-all">
                    TOKENOMICS LAB
                  </span>
                  <div className="text-[8px] text-white/60 font-mono -mt-0.5 tracking-wider group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
                </div>
              </Link>

              {/* Right Side: Notifications, User Profile, Admin (if admin), Hamburger */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <div className="rounded-xl border border-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:shadow-md h-9 flex items-center justify-center">
                  <NotificationBell />
                </div>

                {/* Admin Panel Button (only for admins) */}
                {userData?.role === "admin" && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="hidden sm:flex items-center gap-2 px-3 rounded-xl border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/10 hover:bg-purple-500/20 backdrop-blur-md transition-all duration-300 h-9"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono text-purple-300 font-bold tracking-wider">ADMIN</span>
                  </button>
                )}

                {/* User Profile Button */}
                <button
                  onClick={() => router.push('/profile')}
                  className="relative rounded-xl border border-white/20 hover:border-white/30 bg-black/40 hover:bg-white/5 backdrop-blur-md transition-all duration-300 h-9 w-9 flex items-center justify-center overflow-hidden p-0"
                  title={user?.email || 'Profile'}
                >
                  {userData?.photoURL ? (
                    <Image
                      src={userData.photoURL}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white/60" />
                  )}
                  {userData?.tier === "pro" && (
                    <span className="absolute -top-1 -right-1 text-[10px]">⚡</span>
                  )}
                </button>
                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl border border-white/30 hover:border-white/40 bg-black/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 h-10 w-10 flex items-center justify-center"
                  aria-label="Toggle menu"
                >
                  <div className="relative w-5 h-4 flex flex-col justify-between">
                    <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                    }`}></span>
                    <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'
                    }`}></span>
                    <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                    }`}></span>
                  </div>
                </button>

                {/* User Menu Dropdown (Hidden - now in fullscreen menu) */}
                <div className="relative user-menu-container hidden">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="relative p-2 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:shadow-md h-9 w-9 flex items-center justify-center"
                  >
                    <User className="w-4 h-4 text-white" />
                    {userData?.tier === "pro" && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border border-black flex items-center justify-center">
                        <span className="text-[6px] font-bold text-black">★</span>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl pointer-events-none"></div>
                      
                      <div className="relative p-2">
                        {/* User Info */}
                        <div className="px-3 py-2 mb-2 border-b border-white/10">
                          <div className="text-xs font-bold text-white font-mono truncate">
                            {user.email?.split('@')[0]?.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-white/50 font-mono truncate">
                            {user.email}
                          </div>
                        </div>

                        {/* Menu Items */}
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-left">
                            <User className="w-4 h-4" />
                            <span className="text-xs font-mono">Profile</span>
                          </button>
                        </Link>

                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-left">
                            <Home className="w-4 h-4" />
                            <span className="text-xs font-mono">Dashboard</span>
                          </button>
                        </Link>

                        <Link href="/dashboard#settings" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-left">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-mono">Settings</span>
                          </button>
                        </Link>

                        <Link href="/dashboard#history" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-left">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-mono">History</span>
                          </button>
                        </Link>

                        {userData?.role === "admin" && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-left border-t border-white/10 mt-2 pt-2">
                              <Shield className="w-4 h-4" />
                              <span className="text-xs font-mono">Admin Panel</span>
                            </button>
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            handleLogout()
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-all duration-200 text-left border-t border-white/10 mt-2 pt-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-xs font-mono">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl border border-white/30 hover:border-white/40 bg-black/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 h-10 w-10 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-4 flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Fullscreen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
          {/* Glassmorphic Background */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-purple-500/[0.05] pointer-events-none"></div>
          
          {/* Animated Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full border border-white/30 hover:border-white/40 bg-black/40 hover:bg-white/10 backdrop-blur-md transition-all duration-300 z-10"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative flex flex-col items-center justify-center h-full space-y-4 p-8 overflow-y-auto">
            {/* Navigation Links */}
            {navLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Link
                  key={`${link.href}-fullscreen-${index}`}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href)
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 text-2xl md:text-4xl font-bold text-white/60 hover:text-white transition-all duration-300 font-mono tracking-wider hover:scale-110"
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8" />
                  {link.label.toUpperCase()}
                </Link>
              )
            })}
            
            {userData?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-2xl md:text-4xl font-bold text-purple-400/80 hover:text-purple-300 transition-all duration-300 font-mono tracking-wider hover:scale-110 border-t border-white/10 pt-4 mt-4"
              >
                <Shield className="w-6 h-6 md:w-8 md:h-8" />
                ADMIN PANEL
              </Link>
            )}
            
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="mt-8 flex items-center gap-3 text-2xl md:text-4xl font-bold text-white/60 hover:text-red-400 transition-all duration-300 font-mono tracking-wider hover:scale-110"
            >
              <LogOut className="w-6 h-6 md:w-8 md:h-8" />
              LOGOUT
            </button>
          </div>
        </div>
      )}
    </>
  )
}
