"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { theme } from "@/lib/theme"
import { analyticsEvents } from "@/lib/firebase-analytics"
import { has2FAEnabled } from "@/lib/totp"
import TwoFactorVerify from "@/components/two-factor-verify"
import Navbar from "@/components/navbar"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [show2FA, setShow2FA] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      console.log('[Login] User already logged in, redirecting')
      if (userProfile.plan === 'PREMIUM') {
        router.replace('/premium')
      } else {
        router.replace('/free-dashboard')
      }
    }
  }, [user, userProfile, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid
      
      // Check if user has 2FA enabled
      const needs2FA = await has2FAEnabled(userId)
      
      if (needs2FA) {
        // Show 2FA verification modal
        setPendingUserId(userId)
        setShow2FA(true)
        setLoading(false)
      } else {
        // No 2FA, proceed with login
        setTimeout(() => {
          router.push("/premium/dashboard") // Will auto-redirect FREE users to free-dashboard
        }, 500)
      }
    } catch (error: unknown) {
      console.error("Login failed:", error)
      const err = error as { code?: string; message?: string }
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/operation-not-allowed':
          setError("Email/password authentication is not enabled. Please contact support.")
          break
        case 'auth/user-not-found':
          setError("No account found with this email address.")
          break
        case 'auth/wrong-password':
          setError("Incorrect password.")
          break
        case 'auth/invalid-email':
          setError("Invalid email address.")
          break
        case 'auth/user-disabled':
          setError("This account has been disabled.")
          break
        default:
          setError("Login failed. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      // Request additional user info scopes
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      
      if (!userDoc.exists()) {
        // Extract user info from Google profile
        const displayName = user.displayName || ""
        const photoURL = user.photoURL || null
        const email = user.email || ""
        
        // Create user profile for new Google sign-ins with collected info
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          name: displayName,
          photoURL: photoURL,
          company: null,
          country: null,
          tier: "FREE",
          plan: "FREE",
          role: "user",
          dailyAnalyses: 0,
          totalAnalyses: 0,
          watchlist: [],
          alerts: [],
          preferences: {
            emailNotifications: true,
            riskAlerts: true,
            priceAlerts: false
          },
          metadata: {
            signupSource: "google",
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
            signupIp: null,
            provider: "google"
          },
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        analyticsEvents.signup('google')
      } else {
        // Update last login time
        await setDoc(doc(db, "users", user.uid), {
          lastLoginAt: new Date().toISOString()
        }, { merge: true })
        
        analyticsEvents.login('google')
      }
      
      // Redirect to unified dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error: unknown) {
      console.error("Google login failed:", error)
      const err = error as { code?: string; message?: string }
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled")
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please allow popups for this site.")
      } else {
        setError(err.message || "Google login failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handle2FASuccess = () => {
    setShow2FA(false)
    setPendingUserId(null)
    // Proceed with login
    setTimeout(() => {
      router.push("/premium/dashboard")
    }, 500)
  }

  const handle2FACancel = async () => {
    // Sign out the user since they cancelled 2FA
    await signOut(auth)
    setShow2FA(false)
    setPendingUserId(null)
    setError("2FA verification cancelled. Please login again.")
  }

  return (
    <>
      <Navbar />
      {show2FA && pendingUserId && (
        <TwoFactorVerify
          userId={pendingUserId}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      )}
      
      <div className={`relative min-h-screen flex items-center justify-center ${theme.backgrounds.main} overflow-hidden p-4`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none"></div>

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      {/* Login Card */}
      <div className={`relative ${theme.backgrounds.card} border ${theme.borders.default} p-8 w-full max-w-md`}>
        {/* Top decorative line */}
        <div className="flex items-center gap-2 mb-6 opacity-60">
          <div className={theme.decorative.divider}></div>
          <span className={`${theme.text.tiny} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>ACCESS</span>
          <div className="flex-1 h-px bg-white"></div>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-white" />
          <h1 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} italic transform -skew-x-12`}>
            TOKENGUARD
          </h1>
        </div>

        <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} mb-6 text-center ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
          Welcome Back
        </h2>

        {error && (
          <div className={`mb-4 p-3 border ${theme.status.danger.border} ${theme.status.danger.bg} ${theme.status.danger.text} ${theme.text.small} ${theme.fonts.mono}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 ${theme.inputs.default}`}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 ${theme.inputs.default}`}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.buttons.primary} uppercase`}
          >
            {loading ? "ACCESSING..." : "LOG IN"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.tiny} uppercase`}>
            OR
          </span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* Google Login Button */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          variant="outline"
          className="w-full border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-mono tracking-wider uppercase flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "SIGNING IN..." : "SIGN IN WITH GOOGLE"}
        </Button>

        <div className={`mt-6 text-center ${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small}`}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={`${theme.text.primary} hover:underline`}>
            Sign Up
          </Link>
        </div>

        {/* Bottom decorative line */}
        <div className="flex items-center gap-2 mt-6 opacity-40">
          <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>{theme.decorative.infinity}</span>
          <div className="flex-1 h-px bg-white"></div>
          <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>SECURE.LOGIN</span>
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
