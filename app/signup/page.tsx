"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { theme } from "@/lib/theme"
import { analyticsEvents } from "@/lib/firebase-analytics"
import Navbar from "@/components/navbar"
import { logAuth } from "@/lib/services/activity-logger"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [country, setCountry] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Check if auto-premium is enabled
      let userTier = "FREE"
      let userPlan = "FREE"
      let redirectPath = "/free-dashboard"
      
      try {
        const settingsDoc = await getDoc(doc(db, "system", "platform_settings"))
        const settings = settingsDoc.data()
        
        if (settings?.autoPremiumEnabled === true) {
          userTier = "PREMIUM"
          userPlan = "PREMIUM"
          redirectPath = "/premium/dashboard"
          console.log('[Signup] Auto-premium enabled - assigning PREMIUM tier')
        }
      } catch (settingsError) {
        console.error('[Signup] Failed to check auto-premium setting:', settingsError)
        // Continue with FREE tier if settings check fails
      }

      // Create user profile in Firestore with enhanced data
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        company: company || null,
        country: country || null,
        tier: userTier,
        plan: userPlan,
        usage: {
          tokensAnalyzed: 0,
          lastResetDate: new Date(),
          dailyLimit: userTier === "PREMIUM" ? 999999 : 10
        },
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
          signupSource: "web",
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          signupIp: null, // Can be populated via server-side API
          autoPremiumGranted: userTier === "PREMIUM"
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Track signup event
      analyticsEvents.signup('email')
      
      // Log user signup
      await logAuth(userCredential.user.uid, email, 'user_signup')
      
      // Redirect based on tier
      router.push(redirectPath)
    } catch (error: unknown) {
      console.error("Sign up failed:", error)
      const err = error as { code?: string; message?: string }
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/operation-not-allowed':
          setError("Email/password authentication is not enabled. Please contact support.")
          break
        case 'auth/email-already-in-use':
          setError("An account with this email already exists.")
          break
        case 'auth/invalid-email':
          setError("Invalid email address.")
          break
        case 'auth/weak-password':
          setError("Password should be at least 6 characters long.")
          break
        default:
          setError(err.message || "Sign up failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError("")

    try {
      // Request additional user info scopes
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      
      if (!userDoc.exists()) {
        // Extract user info from Google profile
        const displayName = user.displayName || ""
        const photoURL = user.photoURL || null
        const email = user.email || ""
        
        // Create user profile in Firestore for new Google users with collected info
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
          usage: {
            tokensAnalyzed: 0,
            lastResetDate: new Date(),
            dailyLimit: 10
          },
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

        // Track signup event
        analyticsEvents.signup('google')
      } else {
        // Update last login time
        await setDoc(doc(db, "users", user.uid), {
          lastLoginAt: new Date().toISOString()
        }, { merge: true })
        
        // Track login event for existing users
        analyticsEvents.login('google')
      }
      
      // Redirect to unified dashboard
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error("Google sign up failed:", error)
      const err = error as { code?: string; message?: string }
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign up cancelled")
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please allow popups for this site.")
      } else {
        setError(err.message || "Google sign up failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className={`relative min-h-screen flex items-center justify-center ${theme.backgrounds.main} overflow-hidden p-4`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none"></div>

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      {/* Signup Card */}
      <div className={`relative ${theme.backgrounds.card} border ${theme.borders.default} p-8 w-full max-w-md`}>
        {/* Top decorative line */}
        <div className="flex items-center gap-2 mb-6 opacity-60">
          <div className={theme.decorative.divider}></div>
          <span className={`${theme.text.tiny} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>REGISTER</span>
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
          Create Account
        </h2>

        {error && (
          <div className={`mb-4 p-3 border ${theme.status.danger.border} ${theme.status.danger.bg} ${theme.status.danger.text} ${theme.text.small} ${theme.fonts.mono}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 ${theme.inputs.default}`}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="company" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                Company (Optional)
              </Label>
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`mt-1 ${theme.inputs.default}`}
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                Email *
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
              <Label htmlFor="country" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                Country (Optional)
              </Label>
              <Input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`mt-1 ${theme.inputs.default}`}
                placeholder="United States"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 ${theme.inputs.default}`}
              placeholder="••••••••"
              required
              minLength={8}
            />
            <p className={`mt-1 ${theme.text.tiny} ${theme.text.secondary} ${theme.fonts.mono}`}>
              Minimum 8 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
              Confirm Password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1 ${theme.inputs.default}`}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 border border-white/30 bg-black/50 checked:bg-white checked:border-white cursor-pointer"
              required
            />
            <Label htmlFor="terms" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.tiny} leading-relaxed cursor-pointer`}>
              I agree to the{" "}
              <Link href="/terms" className={`${theme.text.primary} hover:underline`} target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={`${theme.text.primary} hover:underline`} target="_blank">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.buttons.primary} uppercase mt-6`}
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
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

        {/* Google Sign Up Button */}
        <Button
          type="button"
          onClick={handleGoogleSignUp}
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
          {loading ? "SIGNING UP..." : "SIGN UP WITH GOOGLE"}
        </Button>

        <div className={`mt-6 text-center ${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small}`}>
          Already have an account?{" "}
          <Link href="/login" className={`${theme.text.primary} hover:underline`}>
            Log In
          </Link>
        </div>

        {/* Bottom decorative line */}
        <div className="flex items-center gap-2 mt-6 opacity-40">
          <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>{theme.decorative.infinity}</span>
          <div className="flex-1 h-px bg-white"></div>
          <span className={`${theme.text.primary} ${theme.text.tiny} ${theme.fonts.mono}`}>NEW.USER</span>
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
