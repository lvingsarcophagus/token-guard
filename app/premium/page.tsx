'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { MorphingSquare } from '@/components/ui/morphing-square'

/**
 * Premium page redirect
 * Automatically redirects to /premium/dashboard for premium users
 * or /premium-signup for non-premium users
 */
export default function PremiumPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user || userProfile?.plan !== 'PREMIUM') {
        router.push('/premium-signup')
      } else {
        router.push('/premium/dashboard')
      }
    }
  }, [user, userProfile, loading, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <MorphingSquare
        message="Redirecting to premium dashboard..."
        messagePlacement="bottom"
      />
    </div>
  )
}
