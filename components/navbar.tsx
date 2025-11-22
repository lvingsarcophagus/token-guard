"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Shield, Home, Search, TrendingUp, LogOut, User, Bell, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "./ui/button"
import { analyticsEvents } from "@/lib/firebase-analytics"
import NotificationBell from "./notification-bell"

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
    
    // Pricing link (only for free users not on dashboard)
    const isPremiumUser = userData?.tier === "pro"
    if (!isDashboard && !isPremiumUser) {
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
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-1.5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm group-hover:border-white/40 group-hover:bg-white/10 transition-all duration-300">
                    <img 
                      src="/tokenomics-lab-logo.ico" 
                      alt="Tokenomics Lab" 
                      className="w-7 h-7 sm:w-9 sm:h-9 object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-125 group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.8)] group-hover:rotate-6" 
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-base lg:text-lg font-bold text-white font-mono tracking-widest group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                    TOKENOMICS LAB
                  </span>
                  <div className="text-[8px] text-white/60 font-mono -mt-0.5 tracking-wider group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
                {landingLinks.map((link, index) => (
                  <Link
                    key={`${link.href}-${index}`}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="px-4 py-2 rounded-xl border border-white/20 hover:border-white/30 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all duration-300 font-mono text-[10px] font-bold tracking-wider"
                  >
                    {link.label.toUpperCase()}
                  </Link>
                ))}
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl text-white/70 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 text-xs font-mono px-4 py-2 h-9 transition-all">
                    LOGIN
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-xl bg-white/10 border border-white/30 text-white hover:bg-white hover:text-black text-xs font-mono px-4 py-2 h-9 transition-all duration-300 hover:shadow-lg hover:shadow-white/20">
                    SIGN UP
                  </Button>
                </Link>
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2">
            <div className="rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none"></div>
              
              <div className="relative p-4 space-y-2">
                {landingLinks.map((link, index) => (
                  <Link
                    key={`${link.href}-mobile-${index}`}
                    href={link.href}
                    onClick={(e) => {
                      handleNavClick(e, link.href)
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px]"
                  >
                    <span className="font-bold tracking-wider">{link.label.toUpperCase()}</span>
                  </Link>
                ))}
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px] font-bold tracking-wider">
                    LOGIN
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white hover:text-black backdrop-blur-md text-white transition-all duration-300 font-mono text-[10px] font-bold tracking-wider">
                    SIGN UP
                  </button>
                </Link>
              </div>
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
              <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-1.5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm group-hover:border-white/40 group-hover:bg-white/10 transition-all duration-300">
                    <img 
                      src="/tokenomics-lab-logo.ico" 
                      alt="Tokenomics Lab" 
                      className="w-7 h-7 sm:w-9 sm:h-9 object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-125 group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.8)] group-hover:rotate-6" 
                    />
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <span className="text-base lg:text-lg font-bold text-white font-mono tracking-widest group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                    TOKENOMICS LAB
                  </span>
                  <div className="text-[8px] text-white/60 font-mono -mt-0.5 tracking-wider group-hover:text-white/80 transition-colors">ANALYTICS.PLATFORM</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
                {navLinks.map((link, index) => {
                  const Icon = link.icon
                  const isActive = link.href.startsWith('#') ? false : pathname === link.href
                  return (
                    <Link
                      key={`${link.href}-${link.label}-${index}`}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 group font-mono text-[10px] overflow-hidden ${
                        isActive
                          ? "text-white border-white/40 bg-white/15 shadow-lg shadow-white/10"
                          : "text-white/60 hover:text-white border-white/20 hover:border-white/30 hover:bg-white/10 hover:shadow-md"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-white/50 group-hover:text-white group-hover:scale-110'
                      }`} />
                      <span className="font-bold tracking-wider">{link.label.toUpperCase()}</span>
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/0 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl" />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Desktop User Menu */}
              <div className="hidden md:flex items-center gap-2">
                {/* Notifications */}
                <div className="rounded-xl border border-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:shadow-md h-9 flex items-center justify-center">
                  <NotificationBell />
                </div>

                {/* User Menu Dropdown */}
                <div className="relative user-menu-container">
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          
          <div className="absolute top-20 left-4 right-4 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none"></div>
            
            <div className="relative p-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl border border-white/40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white font-mono truncate">
                    {user?.email?.split('@')[0]?.toUpperCase()}
                  </div>
                  <div className="text-[9px] text-white/50 font-mono truncate">
                    {user?.email}
                  </div>
                  {userData?.tier === "pro" && (
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white/20 border border-white/30">
                      <span className="text-[8px] font-bold text-white font-mono">⚡ PRO</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link, index) => {
                  const Icon = link.icon
                  const isActive = link.href.startsWith('#') ? false : pathname === link.href
                  return (
                    <Link
                      key={`${link.href}-${link.label}-${index}`}
                      href={link.href}
                      onClick={(e) => {
                        handleNavClick(e, link.href)
                        setMobileMenuOpen(false)
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 font-mono text-[10px] ${
                        isActive
                          ? "bg-white/15 border-white/40 text-white font-bold shadow-md"
                          : "text-white/60 border-white/20 hover:border-white/30 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      <span className="font-bold tracking-wider">{link.label.toUpperCase()}</span>
                    </Link>
                  )
                })}
                
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px]"
                >
                  <User className="w-4 h-4" />
                  <span className="font-bold tracking-wider">PROFILE</span>
                </Link>

                <Link
                  href="/dashboard#settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px]"
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-bold tracking-wider">SETTINGS</span>
                </Link>

                <Link
                  href="/dashboard#history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px]"
                >
                  <Activity className="w-4 h-4" />
                  <span className="font-bold tracking-wider">HISTORY</span>
                </Link>

                {userData?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 font-mono text-[10px]"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="font-bold tracking-wider">ADMIN PANEL</span>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 hover:border-red-400/50 hover:bg-red-500/10 backdrop-blur-md text-white/60 hover:text-red-400 transition-all duration-300 font-mono text-[10px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-bold tracking-wider">LOGOUT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
