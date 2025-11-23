"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { getUserProfile, createUserProfile, updateUserPlan } from "@/lib/services/firestore-service"
import { migrateUserSchema } from "@/lib/services/migration-service"
import { initializeUserTracking, clearUserTracking } from "@/lib/firebase-analytics"
import type { UserDocument } from "@/lib/firestore-schema"

interface UserData {
  uid: string
  email: string
  name?: string
  photoURL?: string | null
  tier: "free" | "pro"
  role?: "user" | "admin"
  dailyAnalyses: number
  watchlist: string[]
  alerts: Array<Record<string, unknown>>
  createdAt: string
  nextBillingDate?: string
  walletAddress?: string
  company?: string
  country?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  userProfile: UserDocument | null
  loading: boolean
  updateProfile: (data: Partial<UserData>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[Auth Context] Setting up auth listener')
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth Context] Auth state changed:', { user: !!user, uid: user?.uid })
      try {
        setUser(user)

        if (user) {
          console.log('[Auth Context] User logged in, loading profile...')
          
          // First, try to migrate old schema if needed
          let profile = await migrateUserSchema(user.uid)
          
          // If migration didn't return a profile, try to get it normally
          if (!profile) {
            profile = await getUserProfile(user.uid)
          }
          
          console.log('[Auth Context] Profile loaded:', { exists: !!profile, plan: profile?.plan })
          
          if (profile) {
            setUserProfile(profile)
            // Map to old userData for backward compatibility
            setUserData({
              uid: user.uid,
              email: user.email || '',
              name: profile.name || profile.displayName || '',
              photoURL: profile.photoURL || null,
              role: profile.role || 'user',
              tier: profile.plan === 'PREMIUM' ? 'pro' : 'free',
              dailyAnalyses: profile.usage?.tokensAnalyzed || 0,
              watchlist: [],
              alerts: [],
              createdAt: profile.createdAt instanceof Date 
                ? profile.createdAt.toISOString() 
                : (profile.createdAt as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
              walletAddress: profile.walletAddress || '',
              company: profile.company || '',
              country: profile.country || '',
            })
            
            // Initialize analytics tracking for this user
            initializeUserTracking(user.uid, {
              email: user.email || '',
              plan: profile.plan,
              createdAt: profile.createdAt instanceof Date 
                ? profile.createdAt.toISOString() 
                : (profile.createdAt as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
            })
          } else {
            // Create new user profile
            try {
              await createUserProfile(user.uid, user.email || '', user.displayName)
              profile = await getUserProfile(user.uid)
              if (profile) {
                setUserProfile(profile)
                setUserData({
                  uid: user.uid,
                  email: user.email || '',
                  name: profile.name || profile.displayName || '',
                  photoURL: profile.photoURL || null,
                  role: profile.role || 'user',
                  tier: profile.plan === 'PREMIUM' ? 'pro' : 'free',
                  dailyAnalyses: profile.usage?.tokensAnalyzed || 0,
                  watchlist: [],
                  alerts: [],
                  createdAt: profile.createdAt instanceof Date 
                    ? profile.createdAt.toISOString() 
                    : (profile.createdAt as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
                  walletAddress: profile.walletAddress || '',
                  company: profile.company || '',
                  country: profile.country || '',
                })
              }
            } catch (createError) {
              console.error('Failed to create user profile:', createError)
              // Set minimal profile to allow app to function
              const fallbackProfile: UserDocument = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName,
                photoURL: user.photoURL,
                plan: 'FREE',
                subscription: {
                  status: 'active',
                  startDate: new Date(),
                  endDate: null,
                  autoRenew: false
                },
                usage: {
                  tokensAnalyzed: 0,
                  lastResetDate: new Date(),
                  dailyLimit: 10
                },
                preferences: {
                  notifications: true,
                  emailAlerts: false,
                  theme: 'system'
                },
                createdAt: new Date(),
                lastLoginAt: new Date()
              }
              setUserProfile(fallbackProfile)
              setUserData({
                uid: user.uid,
                email: user.email || '',
                name: user.displayName || '',
                photoURL: user.photoURL || null,
                role: 'user',
                tier: 'free',
                dailyAnalyses: 0,
                watchlist: [],
                alerts: [],
                createdAt: new Date().toISOString(),
                walletAddress: '',
                company: '',
                country: '',
              })
            }
          }
        } else {
          console.log('[Auth Context] No user logged in')
          setUserData(null)
          setUserProfile(null)
          // Clear analytics tracking on logout
          clearUserTracking()
        }
      } catch (error) {
        console.error('[Auth Context] Auth state change error:', error)
      } finally {
        console.log('[Auth Context] Setting loading = false')
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    const profile = await getUserProfile(user.uid)
    if (profile) {
      setUserProfile(profile)
      setUserData({
        uid: user.uid,
        email: user.email || '',
        name: profile.name || profile.displayName || '',
        photoURL: profile.photoURL || null,
        role: profile.role || 'user',
        tier: profile.plan === 'PREMIUM' ? 'pro' : 'free',
        dailyAnalyses: profile.usage?.tokensAnalyzed || 0,
        watchlist: [],
        alerts: [],
        createdAt: profile.createdAt instanceof Date 
          ? profile.createdAt.toISOString() 
          : (profile.createdAt as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
        walletAddress: profile.walletAddress || '',
        company: profile.company || '',
        country: profile.country || '',
      })
    }
  }

  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) return

    console.log('[AuthContext] Updating profile for user:', user.uid)
    console.log('[AuthContext] Data to update:', Object.keys(data))
    
    try {
      const userRef = doc(db, "users", user.uid)
      
      // Use updateDoc instead of setDoc to avoid state conflicts
      const updateData: Record<string, any> = {}
      
      // Map UserData fields to Firestore schema
      if (data.name !== undefined) updateData.name = data.name
      if (data.photoURL !== undefined) updateData.photoURL = data.photoURL
      if (data.walletAddress !== undefined) updateData.walletAddress = data.walletAddress
      if (data.company !== undefined) updateData.company = data.company
      if (data.country !== undefined) updateData.country = data.country
      
      await updateDoc(userRef, updateData)
      
      console.log('[AuthContext] Firestore update complete')
      
      // Update local state immediately
      setUserData((prev) => ({ ...prev, ...data }) as UserData)
      
      // Refresh profile from server
      await refreshProfile()
      
      console.log('[AuthContext] Profile refresh complete')
    } catch (error) {
      console.error('[AuthContext] Update profile error:', error)
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, userData, userProfile, loading, updateProfile, refreshProfile }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
