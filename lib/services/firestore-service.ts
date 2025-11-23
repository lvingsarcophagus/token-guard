/**
 * Firestore Service Layer
 * All database operations
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { 
  UserDocument, 
  WatchlistToken, 
  AlertDocument,
  AnalysisHistoryDocument,
  PortfolioDocument,
  DashboardStats
} from '@/lib/firestore-schema'

// ==================== USER OPERATIONS ====================

export async function getUserProfile(userId: string): Promise<UserDocument | null> {
  try {
    console.log('[Firestore] Getting user profile for:', userId)
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      console.log('[Firestore] User profile not found')
      return null
    }
    
    const data = docSnap.data()
    console.log('[Firestore] Raw user data:', data)
    
    // Convert Firestore Timestamps to JavaScript Dates
    const profile = {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt,
      subscription: {
        ...data.subscription,
        startDate: data.subscription?.startDate?.toDate?.() || data.subscription?.startDate,
        endDate: data.subscription?.endDate?.toDate?.() || data.subscription?.endDate,
      },
      usage: {
        ...data.usage,
        lastResetDate: data.usage?.lastResetDate?.toDate?.() || data.usage?.lastResetDate,
      }
    } as UserDocument
    
    console.log('[Firestore] Converted profile:', { plan: profile.plan, uid: profile.uid })
    return profile
  } catch (error) {
    console.error('[Firestore] Get user profile error:', error)
    return null
  }
}

export async function createUserProfile(userId: string, email: string, displayName: string | null): Promise<void> {
  try {
    const userDoc: UserDocument = {
      uid: userId,
      email,
      displayName,
      photoURL: null,
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
    
    await setDoc(doc(db, 'users', userId), userDoc)
  } catch (error) {
    console.error('[Firestore] Create user profile error:', error)
    throw error
  }
}

export async function updateUserPlan(userId: string, plan: 'FREE' | 'PREMIUM'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const docSnap = await getDoc(userRef)
    
    if (!docSnap.exists()) {
      throw new Error('User document does not exist')
    }
    
    await updateDoc(userRef, {
      plan,
      'usage.dailyLimit': plan === 'PREMIUM' ? -1 : 10
    })
  } catch (error) {
    console.error('[Firestore] Update user plan error:', error)
    throw error
  }
}

export async function incrementTokenAnalyzed(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const docSnap = await getDoc(userRef)
    
    if (!docSnap.exists()) {
      console.error('[Firestore] Cannot increment - user document does not exist')
      return
    }
    
    await updateDoc(userRef, {
      'usage.tokensAnalyzed': increment(1)
    })
  } catch (error) {
    console.error('[Firestore] Increment token analyzed error:', error)
  }
}

// ==================== WATCHLIST OPERATIONS ====================

export async function getWatchlist(userId: string): Promise<WatchlistToken[]> {
  try {
    const watchlistRef = collection(db, 'watchlist', userId, 'tokens')
    const q = query(watchlistRef, orderBy('addedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => doc.data() as WatchlistToken)
  } catch (error) {
    console.error('[Firestore] Get watchlist error:', error)
    return []
  }
}

export async function addToWatchlist(userId: string, token: WatchlistToken): Promise<void> {
  try {
    const tokenRef = doc(db, 'watchlist', userId, 'tokens', token.address)
    await setDoc(tokenRef, token)
  } catch (error) {
    console.error('[Firestore] Add to watchlist error:', error)
    throw error
  }
}

export async function removeFromWatchlist(userId: string, tokenAddress: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'watchlist', userId, 'tokens', tokenAddress)
    await deleteDoc(tokenRef)
  } catch (error) {
    console.error('[Firestore] Remove from watchlist error:', error)
    throw error
  }
}

export async function updateWatchlistToken(
  userId: string, 
  tokenAddress: string, 
  updates: Partial<WatchlistToken>
): Promise<void> {
  try {
    const tokenRef = doc(db, 'watchlist', userId, 'tokens', tokenAddress)
    await updateDoc(tokenRef, {
      ...updates,
      lastUpdatedAt: new Date()
    })
  } catch (error) {
    console.error('[Firestore] Update watchlist token error:', error)
    throw error
  }
}

export async function isInWatchlist(userId: string, tokenAddress: string): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'watchlist', userId, 'tokens', tokenAddress)
    const docSnap = await getDoc(tokenRef)
    return docSnap.exists()
  } catch (error) {
    console.error('[Firestore] Check watchlist error:', error)
    return false
  }
}

// ==================== ALERTS OPERATIONS ====================

export async function getAlerts(userId: string, onlyUnread = false): Promise<AlertDocument[]> {
  try {
    const alertsRef = collection(db, 'alerts', userId, 'notifications')
    let q = query(
      alertsRef, 
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    if (onlyUnread) {
      q = query(alertsRef, where('read', '==', false), orderBy('createdAt', 'desc'), limit(20))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertDocument))
  } catch (error) {
    console.error('[Firestore] Get alerts error:', error)
    return []
  }
}

export async function createAlert(userId: string, alert: Omit<AlertDocument, 'id'>): Promise<void> {
  try {
    const alertsRef = collection(db, 'alerts', userId, 'notifications')
    await setDoc(doc(alertsRef), alert)
  } catch (error) {
    console.error('[Firestore] Create alert error:', error)
    throw error
  }
}

export async function markAlertAsRead(userId: string, alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, 'alerts', userId, 'notifications', alertId)
    await updateDoc(alertRef, { read: true })
  } catch (error) {
    console.error('[Firestore] Mark alert as read error:', error)
  }
}

export async function dismissAlert(userId: string, alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, 'alerts', userId, 'notifications', alertId)
    await updateDoc(alertRef, { dismissed: true })
  } catch (error) {
    console.error('[Firestore] Dismiss alert error:', error)
  }
}

// ==================== ANALYSIS HISTORY ====================

export async function saveAnalysisHistory(userId: string, analysis: Omit<AnalysisHistoryDocument, 'id'>): Promise<void> {
  try {
    const historyRef = collection(db, 'analysis_history', userId, 'scans')
    await setDoc(doc(historyRef), analysis)
  } catch (error) {
    console.error('[Firestore] Save analysis history error:', error)
  }
}

export async function getAnalysisHistory(userId: string, limitCount = 10): Promise<AnalysisHistoryDocument[]> {
  try {
    const historyRef = collection(db, 'analysis_history', userId, 'scans')
    const q = query(historyRef, orderBy('analyzedAt', 'desc'), limit(limitCount))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisHistoryDocument))
  } catch (error) {
    console.error('[Firestore] Get analysis history error:', error)
    return []
  }
}

// ==================== PORTFOLIO ====================

export async function getPortfolio(userId: string): Promise<PortfolioDocument | null> {
  try {
    const portfolioRef = doc(db, 'portfolio', userId)
    const docSnap = await getDoc(portfolioRef)
    
    if (!docSnap.exists()) return null
    
    return docSnap.data() as PortfolioDocument
  } catch (error) {
    console.error('[Firestore] Get portfolio error:', error)
    return null
  }
}

export async function updatePortfolio(userId: string, portfolio: Partial<PortfolioDocument>): Promise<void> {
  try {
    const portfolioRef = doc(db, 'portfolio', userId)
    await setDoc(portfolioRef, {
      ...portfolio,
      userId,
      lastUpdatedAt: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('[Firestore] Update portfolio error:', error)
    throw error
  }
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats(userId: string, plan: 'FREE' | 'PREMIUM'): Promise<DashboardStats> {
  try {
    const [user, watchlist, alerts, history, portfolio] = await Promise.all([
      getUserProfile(userId),
      getWatchlist(userId),
      getAlerts(userId, true),
      getAnalysisHistory(userId, 5),
      plan === 'PREMIUM' ? getPortfolio(userId) : null
    ])
    
    const avgRiskScore = watchlist.length > 0
      ? watchlist.reduce((sum, token) => sum + token.latestAnalysis.riskScore, 0) / watchlist.length
      : 0
    
    return {
      tokensAnalyzed: user?.usage.tokensAnalyzed || 0,
      watchlistCount: watchlist.length,
      activeAlerts: alerts.filter(a => !a.dismissed).length,
      avgRiskScore: Math.round(avgRiskScore),
      recentScans: history,
      recentAlerts: alerts.slice(0, 5),
      portfolioValue: portfolio?.summary.totalValue,
      profitLoss24h: portfolio?.summary.profitLoss24h
    }
  } catch (error) {
    console.error('[Firestore] Get dashboard stats error:', error)
    return {
      tokensAnalyzed: 0,
      watchlistCount: 0,
      activeAlerts: 0,
      avgRiskScore: 0,
      recentScans: [],
      recentAlerts: []
    }
  }
}
