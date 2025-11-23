'use client'

/**
 * User Role Hook
 * 
 * Get current user's role (FREE, PREMIUM, ADMIN) and admin status
 * Automatically refreshes when roles change
 */

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type UserRole = 'FREE' | 'PREMIUM' | 'ADMIN' | null

export interface UserRoleData {
  role: UserRole
  isAdmin: boolean
  isPremium: boolean
  isFree: boolean
  loading: boolean
  userId: string | null
}

export function useUserRole(): UserRoleData {
  const [role, setRole] = useState<UserRole>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null)
        setIsAdmin(false)
        setLoading(false)
        setUserId(null)
        return
      }

      setUserId(user.uid)

      try {
        // Force refresh token to get latest custom claims
        const idTokenResult = await user.getIdTokenResult(true)
        const claims = idTokenResult.claims

        // Check custom claims first (most authoritative)
        if (claims.role) {
          setRole(claims.role as UserRole)
          setIsAdmin(!!claims.admin)
          setLoading(false)
          return
        }

        // Fallback to Firestore user document
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const userRole = userData.role || 'user'
          
          // Check if user is admin
          const isAdminUser = userRole === 'admin' || !!userData.admin
          
          setRole(userRole.toUpperCase() as UserRole)
          setIsAdmin(isAdminUser)
        } else {
          // New user - default to FREE
          setRole('FREE')
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole('FREE') // Default to FREE on error
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return {
    role,
    isAdmin,
    isPremium: role === 'PREMIUM' || role === 'ADMIN',
    isFree: role === 'FREE',
    loading,
    userId,
  }
}

/**
 * Helper function to refresh user token
 * Call this after role changes to update claims
 */
export async function refreshUserToken() {
  const user = auth.currentUser
  if (user) {
    await user.getIdToken(true)
    console.log('✅ User token refreshed')
  }
}
