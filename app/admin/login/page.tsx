"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, AlertCircle } from "lucide-react"
import { theme } from "@/lib/theme"
import { has2FAEnabled } from "@/lib/totp"
import TwoFactorVerify from "@/components/two-factor-verify"
import { logAuth } from "@/lib/services/activity-logger"
import Loader from "@/components/loader"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [show2FA, setShow2FA] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (userProfile.role === 'admin') {
        router.replace('/admin/dashboard')
      } else {
        setError("Access denied. Admin privileges required.")
      }
    }
  }, [user, userProfile, authLoading, router])

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData.role === 'admin'
      }
      return false
    } catch (error) {
      console.error("Error checking admin role:", error)
      return false
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid
      
      // Check if user is admin
      const isAdmin = await checkAdminRole(userId)
      if (!isAdmin) {
        await auth.signOut()
        setError("Access denied. Admin privileges required.")
        setLoading(false)
        return
      }
      
      // Check if user has 2FA enabled
      const needs2FA = await has2FAEnabled(userId)
      
      if (needs2FA) {
        setPendingUserId(userId)
        setShow2FA(true)
        setLoading(false)
      } else {
        await logAuth(userId, userCredential.user.email || '', 'admin_login')
        router.push("/admin/dashboard")
      }
    } catch (error: unknown) {
      console.error("Admin login failed:", error)
      const err = error as { code?: string; message?: string }
      
      switch (err.code) {
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
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user is admin
      const isAdmin = await checkAdminRole(user.uid)
      if (!isAdmin) {
        await auth.signOut()
        setError("Access denied. Admin privileges required.")
        setLoading(false)
        return
      }

      // Check if user has 2FA enabled
      const needs2FA = await has2FAEnabled(user.uid)
      
      if (needs2FA) {
        setPendingUserId(user.uid)
        setShow2FA(true)
        setLoading(false)
      } else {
        await logAuth(user.uid, user.email || '', 'admin_login')
        router.push("/admin/dashboard")
      }
    } catch (error: unknown) {
      console.error("Google admin login failed:", error)
      const err = error as { code?: string; message?: string }
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled")
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please allow popups for this site.")
      } else {
        setError(err.message || "Google login failed. Please try again.")
      }
      setLoading(false)
    }
  }

  const handle2FASuccess = async () => {
    if (pendingUserId) {
      const userDoc = await getDoc(doc(db, "users", pendingUserId))
      const email = userDoc.data()?.email || ''
      await logAuth(pendingUserId, email, 'admin_login')
    }
    setShow2FA(false)
    router.push("/admin/dashboard")
  }

  if (authLoading) {
    return <Loader fullScreen text="Checking credentials" />
  }

  if (show2FA && pendingUserId) {
    return (
      <TwoFactorVerify
        userId={pendingUserId}
        onSuccess={handle2FASuccess}
        onCancel={() => {
          setShow2FA(false)
          setPendingUserId(null)
          auth.signOut()
        }}
      />
    )
  }

  return (
    <div className={`min-h-screen ${theme.backgrounds.main} flex items-center justify-center p-4`}>
      {/* Background Effects */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      
      {/* Admin Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-purple-500 to-red-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
        
        {/* Card */}
        <div className={`relative ${theme.backgrounds.card} border-2 ${theme.borders.default} rounded-2xl p-8 backdrop-blur-2xl`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h1 className={`text-2xl ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} mb-2`}>
              ADMIN ACCESS
            </h1>
            <p className={`${theme.text.secondary} ${theme.text.small} ${theme.fonts.mono}`}>
              Authorized Personnel Only
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className={`${theme.text.small} text-red-400 ${theme.fonts.mono}`}>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tokenomicslab.com"
                required
                disabled={loading}
                className={`mt-1 ${theme.inputs.boxed}`}
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
                placeholder="••••••••"
                required
                disabled={loading}
                className={`mt-1 ${theme.inputs.boxed}`}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full ${theme.buttons.primary} uppercase`}
            >
              {loading ? "AUTHENTICATING..." : "ADMIN LOGIN"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`bg-black px-2 ${theme.text.secondary} ${theme.fonts.mono}`}>Or</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all font-mono text-sm uppercase flex items-center justify-center gap-3"
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
            {loading ? "AUTHENTICATING..." : "SIGN IN WITH GOOGLE"}
          </Button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className={`${theme.text.tiny} ${theme.text.secondary} ${theme.fonts.mono}`}>
              Not an admin?{" "}
              <Link href="/login" className={`${theme.text.primary} hover:underline`}>
                Regular Login
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className={`${theme.text.tiny} text-yellow-400 ${theme.fonts.mono} text-center`}>
              🔒 All admin actions are logged and monitored
            </p>
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
            radial-gradient(1px 1px at 90% 60%, white, transparent);
          background-size: 200% 200%;
          animation: twinkle 10s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
